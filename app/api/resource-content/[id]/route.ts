import { NextResponse } from 'next/server';
import { getFirebaseAdmin, RESOURCE_CONTENT_COLLECTION } from '@/lib/firebase-admin';
import type { ResourceContent } from '@/lib/firebase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    // Get current content to preserve all existing fields
    const currentContent = await db.collection(RESOURCE_CONTENT_COLLECTION).doc(id).get();
    if (!currentContent.exists) {
      return NextResponse.json(
        { error: 'Resource content not found' },
        { status: 404 }
      );
    }
    
    const currentData = currentContent.data() || {};
    
    // Merge with existing data, preserving all fields
    const updateData: any = { 
      ...currentData, 
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    // Remove the id field if it's in updateData (Firestore doesn't allow updating document ID)
    delete updateData.id;
    
    await db.collection(RESOURCE_CONTENT_COLLECTION).doc(id).update(updateData);
    
    const updatedContent = await db.collection(RESOURCE_CONTENT_COLLECTION).doc(id).get();
    
    return NextResponse.json({
      id: updatedContent.id,
      ...updatedContent.data(),
    });
  } catch (error: any) {
    console.error('Error updating resource content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update resource content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    
    const contentRef = db.collection(RESOURCE_CONTENT_COLLECTION).doc(id);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      return NextResponse.json(
        { error: 'Resource content not found' },
        { status: 404 }
      );
    }
    
    await contentRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resource content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete resource content' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    const doc = await db.collection(RESOURCE_CONTENT_COLLECTION).doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Resource content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error fetching resource content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resource content' },
      { status: 500 }
    );
  }
}





