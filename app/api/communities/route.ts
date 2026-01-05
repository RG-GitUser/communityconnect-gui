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
      const communityId = doc.id;

      // Automatically associate existing users and content from main app
      // that match this community name (case-insensitive)
      try {
        console.log(`[Community Registration] Auto-associating users and content for "${communityNameTrimmed}"`);
        
        const { USERS_COLLECTION, POSTS_COLLECTION, NEWS_COLLECTION, BUSINESSES_COLLECTION, RESOURCES_COLLECTION, RESOURCE_CONTENT_COLLECTION, DOCUMENTS_COLLECTION } = await import('@/lib/firebase-admin');
        const { getCommunityIdFromName } = await import('@/lib/community-helper');
        
        // Get the community ID in C#### format if it exists
        const communityIdFormatted = await getCommunityIdFromName(communityNameTrimmed);
        const finalCommunityId = communityIdFormatted || communityId;
        
        // Helper function to normalize community names for comparison (case-insensitive)
        const normalizeName = (name: string | null | undefined): string => {
          if (!name) return '';
          return name.trim().toLowerCase();
        };
        
        const normalizedCommunityName = normalizeName(communityNameTrimmed);
        
        // 1. Find and update users with matching community name
        const usersRef = db.collection(USERS_COLLECTION);
        const allUsers = await usersRef.get();
        let usersUpdated = 0;
        
        // First pass: Users with matching community name
        for (const userDoc of allUsers.docs) {
          const userData = userDoc.data();
          const userCommunityName = normalizeName(userData.community);
          
          // Check if user's community name matches (case-insensitive)
          if (userCommunityName === normalizedCommunityName) {
            const currentFavorites = userData.favoriteCommunities || [];
            const updatedFavorites = currentFavorites.includes(finalCommunityId) 
              ? currentFavorites 
              : [...currentFavorites, finalCommunityId];
            
            await userDoc.ref.update({
              community: communityNameTrimmed, // Ensure exact name match
              favoriteCommunities: updatedFavorites,
            });
            usersUpdated++;
            console.log(`[Community Registration] Updated user ${userDoc.id} to associate with ${communityNameTrimmed}`);
          }
        }
        
        // 2. Find and update posts with matching community name
        const postsRef = db.collection(POSTS_COLLECTION);
        const allPosts = await postsRef.get();
        
        // Second pass: Find users with content associated with this community
        // This helps catch users with numeric IDs or null community fields
        const userIdsWithContent = new Set<string>();
        
        // Check posts for users with content in this community (reuse allPosts)
        for (const postDoc of allPosts.docs) {
          const postData = postDoc.data();
          if (normalizeName(postData.community) === normalizedCommunityName && postData.userId) {
            userIdsWithContent.add(postData.userId);
          }
        }
        
        // Check documents for users with content in this community (will fetch later)
        const documentsRef = db.collection(DOCUMENTS_COLLECTION);
        const allDocuments = await documentsRef.get();
        for (const docDoc of allDocuments.docs) {
          const docData = docDoc.data();
          if (normalizeName(docData.community) === normalizedCommunityName && docData.userId) {
            userIdsWithContent.add(docData.userId);
          }
        }
        
        // Associate users who have content but no community set
        for (const userDoc of allUsers.docs) {
          const userData = userDoc.data();
          const userCommunityName = normalizeName(userData.community);
          const userId = userDoc.id;
          
          // Skip if already has community set or already processed
          if (userCommunityName === normalizedCommunityName) {
            continue;
          }
          
          // If user has no community but has content associated with this community, associate them
          if ((!userData.community || userData.community === 'null' || userData.community === null) && 
              userIdsWithContent.has(userId)) {
            const currentFavorites = userData.favoriteCommunities || [];
            const updatedFavorites = currentFavorites.includes(finalCommunityId) 
              ? currentFavorites 
              : [...currentFavorites, finalCommunityId];
            
            await userDoc.ref.update({
              community: communityNameTrimmed,
              favoriteCommunities: updatedFavorites,
            });
            usersUpdated++;
            console.log(`[Community Registration] Associated user ${userId} based on content association`);
          }
        }
        let postsUpdated = 0;
        
        for (const postDoc of allPosts.docs) {
          const postData = postDoc.data();
          const postCommunityName = normalizeName(postData.community);
          
          if (postCommunityName === normalizedCommunityName) {
            await postDoc.ref.update({
              community: communityNameTrimmed,
            });
            postsUpdated++;
          }
        }
        
        // 3. Find and update news with matching community name
        const newsRef = db.collection(NEWS_COLLECTION);
        const allNews = await newsRef.get();
        let newsUpdated = 0;
        
        for (const newsDoc of allNews.docs) {
          const newsData = newsDoc.data();
          const newsCommunityName = normalizeName(newsData.community);
          
          if (newsCommunityName === normalizedCommunityName) {
            await newsDoc.ref.update({
              community: communityNameTrimmed,
            });
            newsUpdated++;
          }
        }
        
        // 4. Find and update businesses with matching community name
        const businessesRef = db.collection(BUSINESSES_COLLECTION);
        const allBusinesses = await businessesRef.get();
        let businessesUpdated = 0;
        
        for (const businessDoc of allBusinesses.docs) {
          const businessData = businessDoc.data();
          const businessCommunityName = normalizeName(businessData.community);
          
          if (businessCommunityName === normalizedCommunityName) {
            await businessDoc.ref.update({
              community: communityNameTrimmed,
            });
            businessesUpdated++;
          }
        }
        
        // 5. Find and update resources with matching community name
        const resourcesRef = db.collection(RESOURCES_COLLECTION);
        const allResources = await resourcesRef.get();
        let resourcesUpdated = 0;
        
        for (const resourceDoc of allResources.docs) {
          const resourceData = resourceDoc.data();
          const resourceCommunityName = normalizeName(resourceData.community);
          
          if (resourceCommunityName === normalizedCommunityName) {
            await resourceDoc.ref.update({
              community: communityNameTrimmed,
            });
            resourcesUpdated++;
          }
        }
        
        // 6. Find and update documents with matching community name (already fetched above, reuse)
        let documentsUpdated = 0;
        
        for (const docDoc of allDocuments.docs) {
          const docData = docDoc.data();
          const docCommunityName = normalizeName(docData.community);
          
          if (docCommunityName === normalizedCommunityName) {
            await docDoc.ref.update({
              community: communityNameTrimmed,
            });
            documentsUpdated++;
          }
        }
        
        // 7. Find and update resource content with matching community name
        const resourceContentRef = db.collection(RESOURCE_CONTENT_COLLECTION);
        const allResourceContent = await resourceContentRef.get();
        let resourceContentUpdated = 0;
        
        for (const contentDoc of allResourceContent.docs) {
          const contentData = contentDoc.data();
          const contentCommunityName = normalizeName(contentData.community);
          
          if (contentCommunityName === normalizedCommunityName) {
            await contentDoc.ref.update({
              community: communityNameTrimmed,
            });
            resourceContentUpdated++;
          }
        }
        
        console.log(`[Community Registration] Auto-association complete:`, {
          users: usersUpdated,
          posts: postsUpdated,
          news: newsUpdated,
          businesses: businessesUpdated,
          resources: resourcesUpdated,
          resourceContent: resourceContentUpdated,
          documents: documentsUpdated,
        });
      } catch (associationError: any) {
        // Log error but don't fail registration - association is a bonus feature
        console.error(`[Community Registration] Error during auto-association:`, associationError);
      }

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


