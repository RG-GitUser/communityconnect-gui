import { NextResponse } from 'next/server';
import { getFirebaseAdmin, DOCUMENTS_COLLECTION } from '@/lib/firebase-admin';
import type { Document } from '@/lib/firebase';

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
    
    if (community) {
      query = query.where('community', '==', community) as any;
    }
    
    const documentsSnapshot = await query.get();
    
    const documents: Document[] = documentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Document[];
    
    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

