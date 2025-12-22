import { NextResponse } from 'next/server';
import { getFirebaseAdmin, BUSINESSES_COLLECTION } from '@/lib/firebase-admin';
import type { Business } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const community = searchParams.get('community');

    let query = db.collection(BUSINESSES_COLLECTION);
    
    if (community) {
      query = query.where('community', '==', community) as any;
    }
    
    const businessesSnapshot = await query.get();
    
    const businesses: Business[] = businessesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Business[];
    
    return NextResponse.json(businesses);
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    const businessData = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection(BUSINESSES_COLLECTION).add(businessData);
    const doc = await docRef.get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create business' },
      { status: 500 }
    );
  }
}

