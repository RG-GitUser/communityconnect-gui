import { NextResponse } from 'next/server';
import { getFirebaseAdmin, POSTS_COLLECTION } from '@/lib/firebase-admin';
import type { Post } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const community = searchParams.get('community');

    let query = db.collection(POSTS_COLLECTION);
    
    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }
    
    if (category) {
      query = query.where('category', '==', category) as any;
    }
    
    if (community) {
      query = query.where('community', '==', community) as any;
    }
    
    const postsSnapshot = await query.get();
    
    const posts: Post[] = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
    
    // Sort by createdAt (newest first)
    posts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    const postData = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection(POSTS_COLLECTION).add(postData);
    const doc = await docRef.get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

