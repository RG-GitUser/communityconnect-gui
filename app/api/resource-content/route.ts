import { NextResponse } from 'next/server';
import { getFirebaseAdmin, RESOURCE_CONTENT_COLLECTION } from '@/lib/firebase-admin';
import type { ResourceContent } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const community = searchParams.get('community');

    let query = db.collection(RESOURCE_CONTENT_COLLECTION);
    
    if (resourceId) {
      query = query.where('resourceId', '==', resourceId) as any;
    }
    
    if (community) {
      query = query.where('community', '==', community) as any;
    }
    
    const contentSnapshot = await query.get();
    
    const content: ResourceContent[] = contentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ResourceContent[];
    
    // Sort by createdAt (newest first)
    content.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    return NextResponse.json(content);
  } catch (error: any) {
    console.error('Error fetching resource content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resource content' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    const contentData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Creating resource content in collection:', RESOURCE_CONTENT_COLLECTION);
    console.log('Resource content data:', JSON.stringify(contentData, null, 2));
    
    const docRef = await db.collection(RESOURCE_CONTENT_COLLECTION).add(contentData);
    const doc = await docRef.get();
    const createdData = { id: doc.id, ...doc.data() };
    
    console.log('Resource content created successfully with ID:', doc.id);
    console.log('Created resource content data:', JSON.stringify(createdData, null, 2));
    
    return NextResponse.json(createdData);
  } catch (error: any) {
    console.error('Error creating resource content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create resource content' },
      { status: 500 }
    );
  }
}





