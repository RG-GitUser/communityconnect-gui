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
    
    console.log('Creating resource in collection:', RESOURCES_COLLECTION);
    console.log('Resource data:', JSON.stringify(resourceData, null, 2));
    
    const docRef = await db.collection(RESOURCES_COLLECTION).add(resourceData);
    const doc = await docRef.get();
    const createdData = { id: doc.id, ...doc.data() };
    
    console.log('Resource created successfully with ID:', doc.id);
    console.log('Created resource data:', JSON.stringify(createdData, null, 2));
    
    return NextResponse.json(createdData);
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create resource' },
      { status: 500 }
    );
  }
}


