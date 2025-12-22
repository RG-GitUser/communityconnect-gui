import { NextResponse } from 'next/server';
import { getFirebaseAdmin, getFirebaseStorage, DOCUMENTS_COLLECTION } from '@/lib/firebase-admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdmin();
    const storage = getFirebaseStorage();
    
    // Get the document from Firestore
    const docRef = db.collection(DOCUMENTS_COLLECTION).doc(params.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    
    // Try to find the file path/URL in common field names
    const filePath = docData?.filePath || 
                    docData?.storagePath || 
                    docData?.fileUrl || 
                    docData?.file ||
                    docData?.downloadUrl;
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path found in document' },
        { status: 404 }
      );
    }
    
    // If it's already a full URL, return it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return NextResponse.json({ url: filePath });
    }
    
    // Otherwise, generate a signed URL from Firebase Storage
    try {
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return NextResponse.json(
          { error: 'File not found in storage' },
          { status: 404 }
        );
      }
      
      // Generate signed URL (valid for 1 hour)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 3600000, // 1 hour
      });
      
      return NextResponse.json({ url });
    } catch (storageError: any) {
      console.error('Storage error:', storageError);
      return NextResponse.json(
        { error: `Failed to generate file URL: ${storageError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching file URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch file URL' },
      { status: 500 }
    );
  }
}

