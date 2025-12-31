# Firebase Storage Bucket Configuration

## Error Fix

If you're seeing this error:
```
Bucket name not specified or invalid. Specify a valid bucket name via the storageBucket option when initializing the app
```

You need to set the `FIREBASE_STORAGE_BUCKET` environment variable.

## How to Find Your Bucket Name

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Storage** in the left sidebar
4. Look at the URL or the bucket name shown at the top
5. The bucket name is usually: `your-project-id.appspot.com`

## Setting the Environment Variable

### Option 1: Add to `.env.local` (Recommended)

Create or edit `.env.local` in your project root:

```bash
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

Replace `your-project-id` with your actual Firebase project ID.

### Option 2: Add to `.env`

If you're using a `.env` file:

```bash
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Option 3: Service Account JSON

If you're using a service account JSON file, make sure it includes the `storageBucket` field:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "storageBucket": "your-project-id.appspot.com",
  ...
}
```

## Verify Configuration

After setting the environment variable:

1. **Restart your Next.js dev server** (important!)
2. Try downloading a document file again
3. Check the console logs - you should see `[File API]` logs without bucket errors

## Example

If your Firebase project ID is `community-connect-12345`, your bucket name would be:

```bash
FIREBASE_STORAGE_BUCKET=community-connect-12345.appspot.com
```

## Troubleshooting

- **Still getting errors?** Make sure you restarted the dev server after adding the environment variable
- **Can't find bucket name?** Check Firebase Console → Storage → Files tab - the bucket name is in the URL
- **Multiple buckets?** Use the default bucket (usually `project-id.appspot.com`) unless you have a specific custom bucket

