import { NextResponse } from 'next/server';
import { getFirebaseAdmin, POSTS_COLLECTION } from '@/lib/firebase-admin';
import type { Post } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = db.collection(POSTS_COLLECTION);
    
    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }
    
    const postsSnapshot = await query.get();
    
    const posts: Post[] = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
    
    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

