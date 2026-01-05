import { NextResponse } from 'next/server';
import { getFirebaseAdmin, DOCUMENTS_COLLECTION, USERS_COLLECTION } from '@/lib/firebase-admin';
import type { Document } from '@/lib/firebase';

const normalizeName = (name: string | null | undefined): string => {
  if (!name) return '';
  return name.trim().toLowerCase();
};

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const community = searchParams.get('community');

    let query = db.collection(DOCUMENTS_COLLECTION);
    
    if (category) {
      query = query.where('category', '==', category) as any;
    }
    
    // If community filter is provided, we need to handle documents that might not have a community field
    // by checking the user's community field
    let documentsSnapshot;
    if (community) {
      // First, try to get documents with the community field set
      query = query.where('community', '==', community) as any;
      documentsSnapshot = await query.get();
      
      // Also get all documents without a community field (or with different community)
      // and filter by user's community
      const allDocsSnapshot = await db.collection(DOCUMENTS_COLLECTION).get();
      const normalizedCommunityName = normalizeName(community);
      
      // Get all users for this community
      const usersSnapshot = await db.collection(USERS_COLLECTION).get();
      const communityUserIds = new Set<string>();
      
      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        const userCommunityName = normalizeName(userData.community);
        if (userCommunityName === normalizedCommunityName) {
          communityUserIds.add(userDoc.id);
        }
      });
      
      // Filter documents by user's community and merge with documents that have community field
      const docsByUserCommunity: Document[] = [];
      const docsToUpdate: Array<{ id: string; community: string }> = [];
      
      allDocsSnapshot.docs.forEach(doc => {
        const docData = doc.data();
        const docId = doc.id;
        
        // Skip if already in the results (has community field matching)
        const alreadyIncluded = documentsSnapshot.docs.some(d => d.id === docId);
        if (alreadyIncluded) return;
        
        // Skip if category filter doesn't match
        if (category && docData.category !== category) return;
        
        // Check if document has userId and user belongs to the community
        if (docData.userId && communityUserIds.has(docData.userId)) {
          const docWithId: Document = {
            id: docId,
            ...docData,
          } as Document;
          docsByUserCommunity.push(docWithId);
          
          // If document doesn't have community field, mark it for update
          if (!docData.community || normalizeName(docData.community) !== normalizedCommunityName) {
            docsToUpdate.push({ id: docId, community: community });
          }
        }
      });
      
      // Update documents in the background to add community field
      if (docsToUpdate.length > 0) {
        console.log(`[Documents API] Updating ${docsToUpdate.length} documents with community field`);
        Promise.all(
          docsToUpdate.map(({ id, community: comm }) => 
            db.collection(DOCUMENTS_COLLECTION).doc(id).update({ community: comm }).catch(err => 
              console.error(`Failed to update document ${id}:`, err)
            )
          )
        ).catch(err => console.error('Error updating documents:', err));
      }
      
      // Merge documents with community field and documents by user community
      const allDocuments = [
        ...documentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })),
        ...docsByUserCommunity,
      ] as Document[];
      
      return NextResponse.json(allDocuments);
    } else {
      // No community filter - return all documents
      documentsSnapshot = await query.get();
      
      const documents: Document[] = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];
      
      return NextResponse.json(documents);
    }
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

