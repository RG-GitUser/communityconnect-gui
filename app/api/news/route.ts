import { NextResponse } from 'next/server';
import { getFirebaseAdmin, NEWS_COLLECTION } from '@/lib/firebase-admin';
import type { News } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const community = searchParams.get('community');

    let query = db.collection(NEWS_COLLECTION);
    
    if (community) {
      query = query.where('community', '==', community) as any;
    }
    
    const newsSnapshot = await query.get();
    
    const news: News[] = newsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as News[];
    
    // Sort by date (newest first)
    news.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
    
    return NextResponse.json(news);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    const newsData = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection(NEWS_COLLECTION).add(newsData);
    const doc = await docRef.get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create news' },
      { status: 500 }
    );
  }
}

