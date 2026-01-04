import { NextResponse } from 'next/server';
import { getFirebaseAdmin, COMMUNITIES_COLLECTION } from '@/lib/firebase-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const db = getFirebaseAdmin();
    const communityName = decodeURIComponent(name).trim();
    
    console.log(`[Community Association] Starting manual association for "${communityName}"`);
    
    // Find the community
    const communitiesRef = db.collection(COMMUNITIES_COLLECTION);
    const communityQuery = await communitiesRef
      .where('name', '==', communityName)
      .limit(1)
      .get();
    
    if (communityQuery.empty) {
      // Try case-insensitive search
      const allCommunities = await communitiesRef.get();
      const matchingDoc = allCommunities.docs.find(doc => {
        const docName = (doc.data().name || '').trim();
        return docName.toLowerCase() === communityName.toLowerCase();
      });
      
      if (!matchingDoc) {
        return NextResponse.json(
          { error: `Community "${communityName}" not found` },
          { status: 404 }
        );
      }
    }
    
    const communityDoc = communityQuery.empty 
      ? (await communitiesRef.get()).docs.find(doc => 
          (doc.data().name || '').trim().toLowerCase() === communityName.toLowerCase()
        )!
      : communityQuery.docs[0];
    
    const communityId = communityDoc.id;
    const communityData = communityDoc.data();
    const { getCommunityIdFromName } = await import('@/lib/community-helper');
    const communityIdFormatted = await getCommunityIdFromName(communityName);
    
    // Collect all possible IDs: document ID, formatted ID, and any 'id' field in the document
    const allPossibleIds = [communityId];
    if (communityIdFormatted && !allPossibleIds.includes(communityIdFormatted)) {
      allPossibleIds.push(communityIdFormatted);
    }
    if (communityData.id && !allPossibleIds.includes(communityData.id)) {
      allPossibleIds.push(communityData.id);
      console.log(`[Community Association] Found community document 'id' field: ${communityData.id}`);
    }
    
    console.log(`[Community Association] Community "${communityName}" has IDs:`, {
      documentId: communityId,
      formattedId: communityIdFormatted,
      idField: communityData.id,
      allPossibleIds
    });
    
    // Use document ID as primary, but we'll check all IDs when matching
    const finalCommunityId = communityIdFormatted || communityId;
    
    // Helper function to normalize community names for comparison (case-insensitive, punctuation-normalized)
    const normalizeName = (name: string | null | undefined): string => {
      if (!name) return '';
      return name.trim().toLowerCase()
        .replace(/[.'"]/g, '') // Remove apostrophes, periods, quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };
    
    const normalizedCommunityName = normalizeName(communityName);
    
    const { USERS_COLLECTION, POSTS_COLLECTION, NEWS_COLLECTION, BUSINESSES_COLLECTION, RESOURCES_COLLECTION, RESOURCE_CONTENT_COLLECTION, DOCUMENTS_COLLECTION } = await import('@/lib/firebase-admin');
    
    const results = {
      users: 0,
      posts: 0,
      news: 0,
      businesses: 0,
      resources: 0,
      resourceContent: 0,
      documents: 0,
    };
    
    // 1. Find and update users with matching community name
    const usersRef = db.collection(USERS_COLLECTION);
    const allUsers = await usersRef.get();
    
    // First pass: Users with matching community name OR users who already have any of the community IDs
    for (const userDoc of allUsers.docs) {
      const userData = userDoc.data();
      const userCommunityName = normalizeName(userData.community);
      const userFavorites = userData.favoriteCommunities || [];
      
      // Check if user has matching community name OR already has any of the community IDs
      const hasMatchingName = userCommunityName === normalizedCommunityName;
      const hasMatchingId = allPossibleIds.some(id => userFavorites.includes(id));
      
      if (hasMatchingName || hasMatchingId) {
        const currentFavorites = userData.favoriteCommunities || [];
        // Store all possible IDs (document ID, formatted ID, and any 'id' field)
        let updatedFavorites = [...currentFavorites];
        allPossibleIds.forEach(id => {
          if (!updatedFavorites.includes(id)) {
            updatedFavorites.push(id);
          }
        });
        
        await userDoc.ref.update({
          community: communityName,
          favoriteCommunities: updatedFavorites,
        });
        results.users++;
        console.log(`[Community Association] Associated user ${userDoc.id}`, {
          userCommunity: userData.community,
          userFavorites,
          communityName,
          allPossibleIds,
          hasMatchingName,
          hasMatchingId,
          updatedFavorites
        });
      }
    }
    
    // Second pass: Users with null/empty community but who have content associated with this community
    // This helps catch users with numeric IDs or other edge cases
    const userIdsWithContent = new Set<string>();
    
    // Check posts
    const postsRef = db.collection(POSTS_COLLECTION);
    const allPosts = await postsRef.get();
    let postsWithCommunity = 0;
    for (const postDoc of allPosts.docs) {
      const postData = postDoc.data();
      const postCommunity = normalizeName(postData.community);
      if (postCommunity === normalizedCommunityName && postData.userId) {
        userIdsWithContent.add(postData.userId);
        postsWithCommunity++;
        console.log(`[Community Association] Found post ${postDoc.id} with community "${postData.community}" for user ${postData.userId}`);
      }
    }
    console.log(`[Community Association] Found ${postsWithCommunity} posts and ${userIdsWithContent.size} unique users with content for "${communityName}"`);
    
    // Check documents
    const documentsRef = db.collection(DOCUMENTS_COLLECTION);
    const allDocuments = await documentsRef.get();
    let docsWithCommunity = 0;
    for (const docDoc of allDocuments.docs) {
      const docData = docDoc.data();
      const docCommunity = normalizeName(docData.community);
      if (docCommunity === normalizedCommunityName && docData.userId) {
        userIdsWithContent.add(docData.userId);
        docsWithCommunity++;
        console.log(`[Community Association] Found document ${docDoc.id} with community "${docData.community}" for user ${docData.userId}`);
      }
    }
    console.log(`[Community Association] Found ${docsWithCommunity} documents. Total unique users with content: ${userIdsWithContent.size}`);
    
    // Associate users who have content but no community set
    for (const userDoc of allUsers.docs) {
      const userData = userDoc.data();
      const userCommunityName = normalizeName(userData.community);
      const userId = userDoc.id;
      const userFavorites = userData.favoriteCommunities || [];
      
      // Skip if already processed in first pass
      if (userCommunityName === normalizedCommunityName || allPossibleIds.some(id => userFavorites.includes(id))) {
        continue;
      }
      
      // If user has content associated with this community, associate them (even if they have a different community set)
      if (userIdsWithContent.has(userId)) {
        const currentFavorites = userData.favoriteCommunities || [];
        // Store all possible IDs
        let updatedFavorites = [...currentFavorites];
        allPossibleIds.forEach(id => {
          if (!updatedFavorites.includes(id)) {
            updatedFavorites.push(id);
          }
        });
        
        await userDoc.ref.update({
          community: communityName,
          favoriteCommunities: updatedFavorites,
        });
        results.users++;
        console.log(`[Community Association] Associated user ${userId} based on content association`, {
          allPossibleIds,
          updatedFavorites
        });
      }
    }
    
    // Third pass: Associate ALL users with null/empty community (bulk association)
    // This is useful when users don't have content but should belong to this community
    const { searchParams } = new URL(request.url);
    const associateNullUsers = searchParams.get('associateNullUsers') === 'true';
    
    if (associateNullUsers) {
      console.log(`[Community Association] Bulk associating users with null community to "${communityName}"`);
      console.log(`[Community Association] Using community document ID: ${communityId}`);
      
      for (const userDoc of allUsers.docs) {
        const userData = userDoc.data();
        const userCommunityName = normalizeName(userData.community);
        const userId = userDoc.id;
        const userCommunityValue = userData.community;
        
        // Skip if already has this community
        if (userCommunityName === normalizedCommunityName) {
          console.log(`[Community Association] Skipping user ${userId} - already associated with "${communityName}"`);
          continue;
        }
        
        // Associate users with null/empty community (check for both string 'null' and actual null)
        const isNullCommunity = !userCommunityValue || 
                                userCommunityValue === 'null' || 
                                userCommunityValue === null || 
                                userCommunityValue === '' ||
                                String(userCommunityValue).trim().toLowerCase() === 'null';
        
        if (isNullCommunity) {
          const currentFavorites = userData.favoriteCommunities || [];
          // Add all possible IDs
          let updatedFavorites = [...currentFavorites];
          allPossibleIds.forEach(id => {
            if (!updatedFavorites.includes(id)) {
              updatedFavorites.push(id);
            }
          });
          
          console.log(`[Community Association] Associating user ${userId}:`, {
            currentCommunity: userCommunityValue,
            currentFavorites,
            newCommunity: communityName,
            newFavorites: updatedFavorites,
            allPossibleIds
          });
          
          await userDoc.ref.update({
            community: communityName,
            favoriteCommunities: updatedFavorites,
          });
          results.users++;
          console.log(`[Community Association] ✓ Bulk associated user ${userId} (null community) -> "${communityName}"`);
        } else {
          console.log(`[Community Association] Skipping user ${userId} - has community: "${userCommunityValue}"`);
        }
      }
      
      console.log(`[Community Association] Bulk association complete: ${results.users} users associated`);
    }
    
    // 2. Find and update posts (already fetched above, reuse)
    for (const postDoc of allPosts.docs) {
      const postData = postDoc.data();
      if (normalizeName(postData.community) === normalizedCommunityName) {
        await postDoc.ref.update({ community: communityName });
        results.posts++;
      }
    }
    
    // 3. Find and update news
    const newsRef = db.collection(NEWS_COLLECTION);
    const allNews = await newsRef.get();
    
    for (const newsDoc of allNews.docs) {
      const newsData = newsDoc.data();
      if (normalizeName(newsData.community) === normalizedCommunityName) {
        await newsDoc.ref.update({ community: communityName });
        results.news++;
      }
    }
    
    // 4. Find and update businesses
    const businessesRef = db.collection(BUSINESSES_COLLECTION);
    const allBusinesses = await businessesRef.get();
    
    for (const businessDoc of allBusinesses.docs) {
      const businessData = businessDoc.data();
      if (normalizeName(businessData.community) === normalizedCommunityName) {
        await businessDoc.ref.update({ community: communityName });
        results.businesses++;
      }
    }
    
    // 5. Find and update resources
    const resourcesRef = db.collection(RESOURCES_COLLECTION);
    const allResources = await resourcesRef.get();
    
    for (const resourceDoc of allResources.docs) {
      const resourceData = resourceDoc.data();
      if (normalizeName(resourceData.community) === normalizedCommunityName) {
        await resourceDoc.ref.update({ community: communityName });
        results.resources++;
      }
    }
    
    // 6. Find and update resource content
    const resourceContentRef = db.collection(RESOURCE_CONTENT_COLLECTION);
    const allResourceContent = await resourceContentRef.get();
    
    for (const contentDoc of allResourceContent.docs) {
      const contentData = contentDoc.data();
      if (normalizeName(contentData.community) === normalizedCommunityName) {
        await contentDoc.ref.update({ community: communityName });
        results.resourceContent++;
      }
    }
    
    // 7. Find and update documents (already fetched above, reuse)
    for (const docDoc of allDocuments.docs) {
      const docData = docDoc.data();
      if (normalizeName(docData.community) === normalizedCommunityName) {
        await docDoc.ref.update({ community: communityName });
        results.documents++;
      }
    }
    
    console.log(`[Community Association] Association complete for "${communityName}":`, results);
    
    return NextResponse.json({
      success: true,
      message: `Successfully associated ${Object.values(results).reduce((a, b) => a + b, 0)} items with "${communityName}"`,
      results,
    });
  } catch (error: any) {
    console.error('[Community Association] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to associate community' },
      { status: 500 }
    );
  }
}

