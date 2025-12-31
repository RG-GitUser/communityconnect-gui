import { NextResponse } from 'next/server';
import { getFirebaseAdmin, USERS_COLLECTION } from '@/lib/firebase-admin';
import { getCommunityIdFromName } from '@/lib/community-helper';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    const data = await request.json();
    
    // Get current user data to preserve all existing fields
    const currentUser = await db.collection(USERS_COLLECTION).doc(id).get();
    if (!currentUser.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const currentData = currentUser.data() || {};
    
    // Start with current data to preserve all fields
    let updateData: any = { ...currentData, ...data };
    
    // Handle community association
    if (data.community !== undefined) {
      if (data.community) {
        const communityId = await getCommunityIdFromName(data.community);
        console.log(`[Users API Update] Updating user ${id} with community: "${data.community}", communityId: ${communityId}`);
        
        if (communityId) {
          const existingFavorites = currentData?.favoriteCommunities || [];
          
          console.log(`[Users API Update] Current favoriteCommunities:`, existingFavorites);
          
          // Add community ID if not already present (preserve old IDs)
          if (!existingFavorites.includes(communityId)) {
            updateData.favoriteCommunities = [...existingFavorites, communityId];
            console.log(`[Users API Update] Updated favoriteCommunities:`, updateData.favoriteCommunities);
          } else {
            console.log(`[Users API Update] Community ID ${communityId} already in favoriteCommunities`);
          }
        }
        // Always set the community field (even if communityId lookup failed)
        updateData.community = data.community;
        console.log(`[Users API Update] Setting community field to: "${data.community}"`);
      } else {
        // If community is being cleared, remove it
        updateData.community = null;
      }
    }
    
    // Remove the id field if it's in updateData (Firestore doesn't allow updating document ID)
    delete updateData.id;
    
    console.log(`[Users API Update] Final updateData keys:`, Object.keys(updateData));
    await db.collection(USERS_COLLECTION).doc(id).update(updateData);
    
    const doc = await db.collection(USERS_COLLECTION).doc(id).get();
    
    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
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
    await db.collection(USERS_COLLECTION).doc(id).delete();
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getFirebaseAdmin();
    const doc = await db.collection(USERS_COLLECTION).doc(id).get();
    
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

