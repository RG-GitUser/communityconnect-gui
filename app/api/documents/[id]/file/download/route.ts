import { NextResponse } from 'next/server';
import { getFirebaseAdmin, getFirebaseStorage, DOCUMENTS_COLLECTION } from '@/lib/firebase-admin';

// Map admin categories to Firebase Storage folder names
const CATEGORY_TO_STORAGE_FOLDER: Record<string, string> = {
  'Education': 'education',
  'Elder Care': 'elder-support',
  'Housing': 'housing',
  'Income Assistance': 'income-assistance',
  "Jordan's Principle": 'jordans-principle',
  'Social Assistance': 'social-assistance',
  'Status Cards': 'status-cards',
  'Other': 'other',
}

function getStorageFolder(category?: string): string | null {
  if (!category) return null
  return CATEGORY_TO_STORAGE_FOLDER[category] || null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url') // Optional: specific file URL to download
    const db = getFirebaseAdmin();
    const storage = getFirebaseStorage();
    
    // Get the document from Firestore
    const docRef = db.collection(DOCUMENTS_COLLECTION).doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    const category = docData?.category
    
    // Try to find the file path/URL in common field names
    let filePath = docData?.filePath || 
                    docData?.storagePath || 
                    docData?.fileUrl || 
                    docData?.file ||
                    docData?.downloadUrl;
    
    // If no file path found but we have a category, try to construct path
    if (!filePath && category) {
      const storageFolder = getStorageFolder(category)
      if (storageFolder) {
        const fileName = docData?.fileName || docData?.name || `${id}.pdf`
        filePath = `${storageFolder}/${fileName}`
      }
    }
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path found in document' },
        { status: 404 }
      );
    }
    
    // If a specific file URL was provided via query parameter, use that instead
    if (fileUrl) {
      try {
        console.log(`[File Download API] Downloading specific file from URL: ${fileUrl.substring(0, 100)}...`)
        const response = await fetch(fileUrl);
        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to download file from URL' },
            { status: response.status }
          );
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        // Try to extract filename from URL or use default
        let fileName = 'document.pdf'
        try {
          const urlObj = new URL(fileUrl)
          const urlPath = urlObj.pathname
          const extractedName = urlPath.split('/').pop() || 'document'
          const cleanName = extractedName.split('?')[0]
          if (cleanName && cleanName.includes('.')) {
            fileName = cleanName
          }
        } catch (e) {
          // Use default filename
        }
        
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': blob.type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error: any) {
        console.error('Error downloading file from URL:', error);
        return NextResponse.json(
          { error: `Failed to download file: ${error.message}` },
          { status: 500 }
        );
      }
    }
    
    // If it's already a full URL, we need to download it server-side
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to download file from URL' },
            { status: response.status }
          );
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        // Get filename from URL or document
        const fileName = docData?.fileName || docData?.name || 'document.pdf';
        
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': blob.type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error: any) {
        console.error('Error downloading file from URL:', error);
        return NextResponse.json(
          { error: `Failed to download file: ${error.message}` },
          { status: 500 }
        );
      }
    }
    
    // Otherwise, get file from Firebase Storage
    try {
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
      let bucket;
      if (bucketName) {
        bucket = storage.bucket(bucketName);
      } else {
        try {
          bucket = storage.bucket();
        } catch (bucketError: any) {
          const projectId = process.env.FIREBASE_PROJECT_ID;
          if (projectId) {
            bucket = storage.bucket(`${projectId}.appspot.com`);
          } else {
            return NextResponse.json(
              { error: 'Storage bucket not configured' },
              { status: 500 }
            );
          }
        }
      }
      
      // Try the file path as-is first
      let file = bucket.file(filePath);
      let [exists] = await file.exists();
      
      // If file doesn't exist and we have a category, try alternative paths
      if (!exists && category) {
        const storageFolder = getStorageFolder(category)
        if (storageFolder) {
          const fileName = filePath.split('/').pop() || `${id}.pdf`
          const alternativePath = `${storageFolder}/${fileName}`
          file = bucket.file(alternativePath)
          const [altExists] = await file.exists()
          if (altExists) {
            filePath = alternativePath
            exists = true
          }
          
          // For Social Assistance, also try band-assistance as fallback
          if (!exists && category === 'Social Assistance') {
            const bandAssistancePath = `band-assistance/${fileName}`
            const bandFile = bucket.file(bandAssistancePath)
            const [bandExists] = await bandFile.exists()
            if (bandExists) {
              file = bandFile
              filePath = bandAssistancePath
              exists = true
            }
          }
        }
      }
      
      if (!exists) {
        return NextResponse.json(
          { error: `File not found in storage. Checked path: ${filePath}` },
          { status: 404 }
        );
      }
      
      // Download file as a stream
      const [fileBuffer] = await file.download();
      const [metadata] = await file.getMetadata();
      
      const fileName = docData?.fileName || docData?.name || metadata.name?.split('/').pop() || 'document.pdf';
      const contentType = metadata.contentType || 'application/octet-stream';
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (storageError: any) {
      console.error('Storage error:', storageError);
      return NextResponse.json(
        { error: `Failed to download file: ${storageError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    );
  }
}

