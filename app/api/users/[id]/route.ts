import { NextResponse } from 'next/server';
import { getFirebaseAdmin, USERS_COLLECTION } from '@/lib/firebase-admin';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdmin();
    await db.collection(USERS_COLLECTION).doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdmin();
    const doc = await db.collection(USERS_COLLECTION).doc(params.id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

