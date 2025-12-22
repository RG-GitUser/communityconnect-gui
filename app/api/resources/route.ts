import { NextResponse } from 'next/server';
import { getFirebaseAdmin, RESOURCES_COLLECTION } from '@/lib/firebase-admin';
import type { Resource } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const community = searchParams.get('community');

    let query = db.collection(RESOURCES_COLLECTION);
    
    if (community) {
      query = query.where('community', '==', community) as any;
    }
    
    const resourcesSnapshot = await query.get();
    
    const resources: Resource[] = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Resource[];
    
    return NextResponse.json(resources);
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    const resourceData = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection(RESOURCES_COLLECTION).add(resourceData);
    const doc = await docRef.get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create resource' },
      { status: 500 }
    );
  }
}

