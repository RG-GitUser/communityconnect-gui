import { NextResponse } from 'next/server';
import { getFirebaseAdmin, COMMUNITIES_COLLECTION } from '@/lib/firebase-admin';
import crypto from 'crypto';

// Simple password hashing function (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Check if password matches
function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { communityName, password, action } = await request.json();

    if (!communityName || !password) {
      return NextResponse.json(
        { error: 'Community name and password are required' },
        { status: 400 }
      );
    }

    const communityNameTrimmed = communityName.trim();
    const communitiesRef = db.collection(COMMUNITIES_COLLECTION);
    
    // Check if community exists
    const existingCommunityQuery = await communitiesRef
      .where('name', '==', communityNameTrimmed)
      .limit(1)
      .get();

    if (action === 'register') {
      // Registration flow
      if (!existingCommunityQuery.empty) {
        return NextResponse.json(
          { error: 'Community already exists. Please log in instead.' },
          { status: 400 }
        );
      }

      // Create new community
      const hashedPassword = hashPassword(password);
      const newCommunity = {
        name: communityNameTrimmed,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await communitiesRef.add(newCommunity);
      const doc = await docRef.get();

      return NextResponse.json({
        success: true,
        message: 'Community account created successfully',
        community: {
          id: doc.id,
          name: communityNameTrimmed,
        },
      });
    } else {
      // Login flow
      if (existingCommunityQuery.empty) {
        return NextResponse.json(
          { error: 'Community not found. Please register first.' },
          { status: 404 }
        );
      }

      const communityDoc = existingCommunityQuery.docs[0];
      const communityData = communityDoc.data();

      // Verify password
      if (!verifyPassword(password, communityData.password)) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }

      // Update last login
      await communityDoc.ref.update({
        lastLoginAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        community: {
          id: communityDoc.id,
          name: communityData.name,
        },
      });
    }
  } catch (error: any) {
    console.error('Error in community auth:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Check if community exists
export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const communityName = searchParams.get('name');

    if (!communityName) {
      return NextResponse.json(
        { error: 'Community name is required' },
        { status: 400 }
      );
    }

    const communitiesRef = db.collection(COMMUNITIES_COLLECTION);
    const query = await communitiesRef
      .where('name', '==', communityName.trim())
      .limit(1)
      .get();

    return NextResponse.json({
      exists: !query.empty,
    });
  } catch (error: any) {
    console.error('Error checking community:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check community' },
      { status: 500 }
    );
  }
}


