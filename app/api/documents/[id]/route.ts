import { NextResponse } from 'next/server';
import { getFirebaseAdmin, DOCUMENTS_COLLECTION } from '@/lib/firebase-admin';
import type { Document } from '@/lib/firebase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    const doc = await db.collection(DOCUMENTS_COLLECTION).doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    // Get current document to preserve all existing fields
    const currentDoc = await db.collection(DOCUMENTS_COLLECTION).doc(id).get();
    if (!currentDoc.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    const currentData = currentDoc.data() || {};
    
    // Merge with existing data, preserving all fields
    const updateData: any = { ...currentData, ...data };
    
    // Remove the id field if it's in updateData (Firestore doesn't allow updating document ID)
    delete updateData.id;
    
    await db.collection(DOCUMENTS_COLLECTION).doc(id).update(updateData);
    
    const updatedDoc = await db.collection(DOCUMENTS_COLLECTION).doc(id).get();
    
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error: any) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
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
    await db.collection(DOCUMENTS_COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}

