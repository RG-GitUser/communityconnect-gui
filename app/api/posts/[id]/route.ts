import { NextResponse } from 'next/server';
import { getFirebaseAdmin, POSTS_COLLECTION } from '@/lib/firebase-admin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    await db.collection(POSTS_COLLECTION).doc(id).update(data);
    
    const doc = await db.collection(POSTS_COLLECTION).doc(id).get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
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
    await db.collection(POSTS_COLLECTION).doc(id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}


