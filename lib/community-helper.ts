import { getFirebaseAdmin, COMMUNITIES_COLLECTION } from './firebase-admin';

/**
 * Get the community ID from a community name
 * @param communityName The name of the community (e.g., "Oromocto First Nation")
 * @returns The community ID (e.g., "C0001") or null if not found
 */
export async function getCommunityIdFromName(communityName: string | null): Promise<string | null> {
  if (!communityName) return null;
  
  try {
    const db = getFirebaseAdmin();
    const communitiesRef = db.collection(COMMUNITIES_COLLECTION);
    const trimmedName = communityName.trim();
    
    // Try exact match first
    let query = await communitiesRef
      .where('name', '==', trimmedName)
      .limit(1)
      .get();
    
    // If not found, try case-insensitive search by fetching all and filtering
    if (query.empty) {
      console.log(`[Community Helper] Exact match not found for "${trimmedName}", trying case-insensitive search...`);
      const allCommunities = await communitiesRef.get();
      const matchingDoc = allCommunities.docs.find(doc => {
        const docName = (doc.data().name || '').trim();
        return docName.toLowerCase() === trimmedName.toLowerCase();
      });
      
      if (matchingDoc) {
        const communityData = matchingDoc.data();
        const communityId = communityData.id || matchingDoc.id;
        console.log(`[Community Helper] Found community via case-insensitive match: "${matchingDoc.data().name}" -> ID: ${communityId}`);
        return communityId;
      }
      
      console.warn(`[Community Helper] Community not found: "${trimmedName}"`);
      return null;
    }
    
    const communityDoc = query.docs[0];
    const communityData = communityDoc.data();
    
    // Return the 'id' field if it exists, otherwise return the document ID
    const communityId = communityData.id || communityDoc.id;
    console.log(`[Community Helper] Found community: "${communityData.name}" -> ID: ${communityId}`);
    return communityId;
  } catch (error: any) {
    console.error('[Community Helper] Error getting community ID:', error);
    return null;
  }
}

/**
 * Get all community IDs associated with a community name
 * This handles cases where a community might have multiple IDs or aliases
 * @param communityName The name of the community
 * @returns Array of community IDs
 */
export async function getCommunityIdsFromName(communityName: string | null): Promise<string[]> {
  if (!communityName) return [];
  
  const communityId = await getCommunityIdFromName(communityName);
  return communityId ? [communityId] : [];
}

