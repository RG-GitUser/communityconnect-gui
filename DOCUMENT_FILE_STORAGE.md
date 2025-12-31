# Document File Storage Requirements

## Current Implementation

The admin panel attempts to download user-submitted documents by:

1. **Checking known file fields**:
   - `filePath`
   - `storagePath`
   - `fileUrl`
   - `downloadUrl`
   - `file`

2. **Searching all document fields** for file references (URLs, paths, etc.)

3. **Using the API endpoint** `/api/documents/[id]/file` to get signed URLs from Firebase Storage

## Issues

If files are not being downloaded, it could be because:

1. **Files are stored in a different location** (not Firebase Storage)
2. **Files are stored with different field names** than expected
3. **Files are stored as base64** in the document itself
4. **Files require different authentication** to access

## What the Main App Should Provide

For the admin panel to successfully download user-submitted documents, the main app should ensure:

### Option 1: Firebase Storage (Recommended)
- Store files in Firebase Storage
- Save the storage path in one of these fields: `filePath`, `storagePath`, `fileUrl`, `downloadUrl`, or `file`
- The admin panel will automatically generate signed URLs

### Option 2: Direct URLs
- Store direct download URLs in the document
- URLs should be accessible without authentication (or use signed URLs)
- Store in: `fileUrl`, `downloadUrl`, or `file` fields

### Option 3: Base64 Files
- If files are stored as base64 strings, they should be in a field that can be identified
- The admin panel will search for base64 data and can convert it to files

## Debugging

When downloading a ZIP, check the browser console for:
- `[ZIP Download] Found X potential file reference(s)` - shows what files were detected
- `[ZIP Download] Document fields` - shows all available fields in the document
- `[ZIP Download] Full document data` - shows the actual document structure

## Required Document Structure

The document should have at least one of these fields populated with file information:

```typescript
{
  filePath?: string,        // Firebase Storage path
  storagePath?: string,     // Alternative storage path
  fileUrl?: string,         // Direct download URL
  downloadUrl?: string,     // Alternative download URL
  file?: string,            // File reference or URL
  fileName?: string,        // Original file name (optional)
  // OR any nested field containing file URLs/paths
}
```

## Testing

To test if files are being detected:
1. Open browser console
2. Click "Download All" on a document
3. Check console logs for file detection
4. If no files are found, check what fields the document actually has

