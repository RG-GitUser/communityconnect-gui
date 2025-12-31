import { NextResponse } from 'next/server';
import { getFirebaseAdmin, USERS_COLLECTION } from '@/lib/firebase-admin';
import { getCommunityIdFromName, getCommunityIdsFromName } from '@/lib/community-helper';
import type { User } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const communityName = searchParams.get('community');
    
    let usersSnapshot;
    
    if (communityName) {
      // Get community IDs for this community name
      const communityIds = await getCommunityIdsFromName(communityName);
      const searchCommunity = communityName.trim().toLowerCase();
      
      // Fetch all users and filter by community ID or community name
      // This handles both cases: users with favoriteCommunities array and users with community name field
      const allUsersSnapshot = await db.collection(USERS_COLLECTION).get();
      const allUsers = allUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      
      // Log for debugging
      console.log(`[Users API] Filtering ${allUsers.length} users for community: "${communityName}"`);
      console.log(`[Users API] Search community (normalized): "${searchCommunity}"`);
      console.log(`[Users API] Community IDs found:`, communityIds);
      
      const filteredUsers = allUsers.filter(user => {
        // Primary check: community field (case-insensitive, trimmed)
        // Handle both null and string 'null' cases
        const userCommunityRaw = user.community;
        const userCommunity = (userCommunityRaw && userCommunityRaw !== 'null') 
          ? userCommunityRaw.trim().toLowerCase() 
          : '';
        const matchesCommunityField = userCommunity === searchCommunity;
        
        // Secondary check: favoriteCommunities array (if community ID was found)
        let matchesFavoriteCommunities = false;
        if (communityIds.length > 0) {
          const userCommunities = user.favoriteCommunities || [];
          matchesFavoriteCommunities = communityIds.some(id => userCommunities.includes(id));
        }
        
        const matches = matchesCommunityField || matchesFavoriteCommunities;
        
        if (matches) {
          console.log(`[Users API] User "${user.name || user.id}" matched:`, {
            communityField: user.community,
            favoriteCommunities: user.favoriteCommunities,
            matchesCommunityField,
            matchesFavoriteCommunities
          });
        }
        
        return matches;
      });
      
      console.log(`[Users API] Filtered ${filteredUsers.length} users out of ${allUsers.length}`);
      
      // If no matches, log all users' community data
      if (filteredUsers.length === 0 && allUsers.length > 0) {
        console.log(`[Users API] No matches found. All users' community data:`);
        allUsers.forEach(user => {
          console.log(`  - User "${user.name || user.id}":`, {
            community: user.community || 'null',
            favoriteCommunities: user.favoriteCommunities || [],
            communityNormalized: (user.community || '').trim().toLowerCase(),
            searchCommunity
          });
        });
      }
      
      // Return filtered users with debug info in response headers for troubleshooting
      const response = NextResponse.json(filteredUsers);
      response.headers.set('X-Debug-Total-Users', allUsers.length.toString());
      response.headers.set('X-Debug-Filtered-Users', filteredUsers.length.toString());
      response.headers.set('X-Debug-Community-IDs', JSON.stringify(communityIds));
      response.headers.set('X-Debug-Search-Community', communityName);
      
      if (filteredUsers.length === 0 && allUsers.length > 0) {
        // Log all users' community data for debugging
        const userCommunityData = allUsers.map(user => ({
          id: user.id,
          name: user.name,
          community: user.community || 'null',
          favoriteCommunities: user.favoriteCommunities || [],
        }));
        
        response.headers.set('X-Debug-All-User-Communities', JSON.stringify(userCommunityData));
        
        const sampleUser = allUsers[0];
        response.headers.set('X-Debug-Sample-User', JSON.stringify({
          hasFavoriteCommunities: !!sampleUser.favoriteCommunities,
          favoriteCommunitiesCount: sampleUser.favoriteCommunities?.length || 0,
          favoriteCommunities: sampleUser.favoriteCommunities || [],
          hasCommunityField: !!sampleUser.community,
          communityFieldValue: sampleUser.community || 'null',
        }));
      }
      
      return response;
    } else {
      // No community filter, return all users
      usersSnapshot = await db.collection(USERS_COLLECTION).get();
    }
    
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
    
    // If community name is provided, get the community ID and add it to favoriteCommunities
    let favoriteCommunities: string[] = userData.favoriteCommunities || [];
    const communityName = userData.community;
    
    if (communityName) {
      const communityId = await getCommunityIdFromName(communityName);
      if (communityId && !favoriteCommunities.includes(communityId)) {
        favoriteCommunities = [...favoriteCommunities, communityId];
      }
    }
    
    // Add createdAt timestamp, favoriteCommunities, and ensure community field is set
    // Preserve all existing fields from userData
    const newUser: any = {
      ...userData,
      favoriteCommunities,
    };
    
    // Set createdAt if not already provided
    if (!newUser.createdAt) {
      newUser.createdAt = new Date().toISOString();
    }
    
    // Always set community field if provided (don't let it be undefined)
    if (communityName) {
      newUser.community = communityName;
    } else if (userData.community) {
      newUser.community = userData.community;
    }
    
    // Remove undefined values (but keep null values and all other fields)
    Object.keys(newUser).forEach(key => {
      if (newUser[key] === undefined) {
        delete newUser[key];
      }
    });
    
    const docRef = await db.collection(USERS_COLLECTION).add(newUser);
    const doc = await docRef.get();
    
    const createdUser = {
      id: doc.id,
      ...doc.data(),
    } as User;
    
    console.log('[Users API] Created user:', {
      id: createdUser.id,
      name: createdUser.name,
      community: createdUser.community,
      favoriteCommunities: createdUser.favoriteCommunities,
    });
    
    return NextResponse.json(createdUser);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

