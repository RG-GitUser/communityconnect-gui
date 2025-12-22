import { NextResponse } from 'next/server';
import { getFirebaseAdmin, USERS_COLLECTION } from '@/lib/firebase-admin';
import type { User } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getFirebaseAdmin();
    const usersSnapshot = await db.collection(USERS_COLLECTION).get();
    
    const users: User[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
    
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const userData = await request.json();
    
    // Add createdAt timestamp
    const newUser = {
      ...userData,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection(USERS_COLLECTION).add(newUser);
    const doc = await docRef.get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    } as User);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

