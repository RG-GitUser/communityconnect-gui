# Firebase Collection Names Reference

This document lists the Firebase collection names used by the admin app. **The main app must use the same collection names** to read the data created by the admin app.

## Collection Names

The admin app uses the following Firebase collection names (configurable via environment variables):

- **News**: `news` (or `FIREBASE_NEWS_COLLECTION` env var)
- **Businesses**: `businesses` (or `FIREBASE_BUSINESSES_COLLECTION` env var)
- **Resources**: `resources` (or `FIREBASE_RESOURCES_COLLECTION` env var)

## Data Structure

### News Collection
```typescript
{
  id: string;                    // Document ID
  community?: string;            // Community name (e.g., "Elsipogtog")
  title: string;                  // News title
  content: string;                // News content
  date?: string;                  // ISO date string (YYYY-MM-DD)
  category?: string;              // Category (e.g., "Community News", "Announcements")
  createdAt: string;             // ISO timestamp
}
```

### Businesses Collection
```typescript
{
  id: string;                    // Document ID
  community?: string;            // Community name
  name: string;                  // Business name
  category?: string;              // Business category
  description?: string;          // Business description
  address?: string;              // Business address
  phone?: string;                // Phone number
  hours?: string;                // Business hours
  website?: string;              // Website URL
  createdAt: string;             // ISO timestamp
}
```

### Resources Collection
```typescript
{
  id: string;                    // Document ID
  community?: string;            // Community name
  name: string;                  // Resource name
  category: string;               // Always "Community Resources"
  subCategory?: string;           // Sub-category (e.g., "Chief & Council", "Elsipogtog Health Centre")
  description?: string;          // Resource description
  contacts?: Array<{             // Contact information
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    office?: string;
    fax?: string;
  }>;
  createdAt: string;             // ISO timestamp
}
```

## Querying Data

The main app should query these collections with the following considerations:

1. **Community Filtering**: All collections support filtering by `community` field
   ```javascript
   // Example query
   db.collection('news')
     .where('community', '==', 'Elsipogtog')
     .get()
   ```

2. **Collection Names**: Ensure the main app uses the exact same collection names:
   - `news` (not `News` or `NEWS`)
   - `businesses` (not `Businesses` or `BUSINESSES`)
   - `resources` (not `Resources` or `RESOURCES`)

3. **Firestore Security Rules**: Make sure your Firestore security rules allow reads from these collections:
   ```javascript
   match /news/{document=**} {
     allow read: if true; // Adjust based on your security needs
   }
   match /businesses/{document=**} {
     allow read: if true;
   }
   match /resources/{document=**} {
     allow read: if true;
   }
   ```

## Troubleshooting

If data created in the admin app is not appearing in the main app:

1. **Verify Collection Names**: Check that both apps use the same collection names
2. **Check Community Field**: Ensure the `community` field matches what the main app is filtering for
3. **Firestore Rules**: Verify that Firestore security rules allow reads
4. **Firebase Project**: Confirm both apps are connected to the same Firebase project
5. **Check Console Logs**: The admin app logs collection names and data when creating items

## Environment Variables

You can override collection names using environment variables:

```env
FIREBASE_NEWS_COLLECTION=news
FIREBASE_BUSINESSES_COLLECTION=businesses
FIREBASE_RESOURCES_COLLECTION=resources
```

