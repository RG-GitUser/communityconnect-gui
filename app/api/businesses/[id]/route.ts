import { NextResponse } from 'next/server';
import { getFirebaseAdmin, BUSINESSES_COLLECTION } from '@/lib/firebase-admin';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    await db.collection(BUSINESSES_COLLECTION).doc(params.id).update(data);
    
    const doc = await db.collection(BUSINESSES_COLLECTION).doc(params.id).get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update business' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdmin();
    await db.collection(BUSINESSES_COLLECTION).doc(params.id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete business' },
      { status: 500 }
    );
  }
}


