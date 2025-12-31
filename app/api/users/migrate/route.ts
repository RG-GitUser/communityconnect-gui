import { NextResponse } from 'next/server';
import { getFirebaseAdmin, USERS_COLLECTION, COMMUNITIES_COLLECTION } from '@/lib/firebase-admin';

/**
 * Migration endpoint to update existing users with:
 * 1. Set community field based on favoriteCommunities
 * 2. Convert old numeric IDs to C#### format
 * 
 * Usage: POST /api/users/migrate?dryRun=true (to preview changes)
 */
export async function POST(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    
    console.log(`[Migration] Starting user migration (dryRun: ${dryRun})`);
    
    // Get all users
    const usersSnapshot = await db.collection(USERS_COLLECTION).get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log(`[Migration] Found ${users.length} users to process`);
    
    // Get all communities to build a mapping
    const communitiesSnapshot = await db.collection(COMMUNITIES_COLLECTION).get();
    const communityMap = new Map<string, { id: string; name: string }>();
    
    communitiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const communityId = data.id || doc.id;
      const communityName = data.name;
      if (communityId && communityName) {
        communityMap.set(communityId, { id: communityId, name: communityName });
        // Also map by name for reverse lookup
        communityMap.set(communityName.toLowerCase(), { id: communityId, name: communityName });
      }
    });
    
    console.log(`[Migration] Found ${communityMap.size / 2} communities`);
    
    const results = {
      total: users.length,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      changes: [] as Array<{
        userId: string;
        before: any;
        after: any;
      }>,
    };
    
    for (const user of users) {
      try {
        const userId = user.id;
        let needsUpdate = false;
        const updates: any = {};
        
        // Check if user has community field set
        const hasCommunityField = user.community && user.community !== 'null' && user.community !== null;
        
        // Check favoriteCommunities
        const favoriteCommunities = user.favoriteCommunities || [];
        const hasOldNumericIds = favoriteCommunities.some((id: string) => /^\d+$/.test(id));
        const hasCFormatIds = favoriteCommunities.some((id: string) => /^C\d{4}$/.test(id));
        
        // Strategy 1: If user has favoriteCommunities but no community field, try to set it
        if (!hasCommunityField && favoriteCommunities.length > 0) {
          // Try to find a community by ID
          for (const favId of favoriteCommunities) {
            const community = communityMap.get(favId);
            if (community) {
              updates.community = community.name;
              needsUpdate = true;
              break; // Use first match
            }
          }
        }
        
        // Strategy 2: If user has community field but no C#### IDs, add them
        if (hasCommunityField && !hasCFormatIds) {
          const communityName = user.community;
          const community = communityMap.get(communityName.toLowerCase());
          if (community) {
            const newFavorites = [...favoriteCommunities];
            if (!newFavorites.includes(community.id)) {
              newFavorites.push(community.id);
            }
            updates.favoriteCommunities = newFavorites;
            needsUpdate = true;
          }
        }
        
        // Strategy 3: Convert old numeric IDs to C#### format (if we can map them)
        // Note: This requires a mapping table. For now, we'll just ensure C#### IDs are present.
        
        if (needsUpdate) {
          const before = {
            community: user.community,
            favoriteCommunities: user.favoriteCommunities,
          };
          
          const after = {
            community: updates.community !== undefined ? updates.community : user.community,
            favoriteCommunities: updates.favoriteCommunities !== undefined ? updates.favoriteCommunities : user.favoriteCommunities,
          };
          
          results.changes.push({ userId, before, after });
          
          if (!dryRun) {
            await db.collection(USERS_COLLECTION).doc(userId).update(updates);
            results.updated++;
            console.log(`[Migration] Updated user ${userId}:`, updates);
          } else {
            results.updated++;
            console.log(`[Migration] Would update user ${userId}:`, updates);
          }
        } else {
          results.skipped++;
        }
      } catch (error: any) {
        const errorMsg = `Error processing user ${user.id}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Migration] ${errorMsg}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        total: results.total,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length,
      },
      changes: results.changes,
      errors: results.errors,
    });
  } catch (error: any) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

