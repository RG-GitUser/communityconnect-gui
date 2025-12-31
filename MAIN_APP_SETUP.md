# Main App Setup Guide

This guide explains what you need to add/configure in your **main app** to display News, Businesses, and Resources created in the admin app.

## ✅ What's Already Working

Based on the admin app logs, data is being successfully created in Firebase:
- **Collection**: `news`
- **Community**: `Elsipogtog First Nation`
- **Data Structure**: Correct with all required fields

## 🔧 What You Need to Add to the Main App

### 1. **Query Firebase Collections**

Your main app needs to query these three Firebase collections:

#### News Collection
```javascript
// Example: Fetching news for a community
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase'; // Your Firebase config

async function getNews(communityName) {
  const newsRef = collection(db, 'news');
  const q = query(newsRef, where('community', '==', communityName));
  const querySnapshot = await getDocs(q);
  
  const news = [];
  querySnapshot.forEach((doc) => {
    news.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Sort by date (newest first)
  news.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  return news;
}
```

#### Businesses Collection
```javascript
async function getBusinesses(communityName) {
  const businessesRef = collection(db, 'businesses');
  const q = query(businessesRef, where('community', '==', communityName));
  const querySnapshot = await getDocs(q);
  
  const businesses = [];
  querySnapshot.forEach((doc) => {
    businesses.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return businesses;
}
```

#### Resources Collection
```javascript
async function getResources(communityName) {
  const resourcesRef = collection(db, 'resources');
  const q = query(resourcesRef, where('community', '==', communityName));
  const querySnapshot = await getDocs(q);
  
  const resources = [];
  querySnapshot.forEach((doc) => {
    resources.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return resources;
}
```

### 2. **Important: Collection Names Must Match Exactly**

The main app **must** use these exact collection names (case-sensitive):
- ✅ `news` (lowercase)
- ✅ `businesses` (lowercase)
- ✅ `resources` (lowercase)

**NOT:**
- ❌ `News` or `NEWS`
- ❌ `Businesses` or `BUSINESSES`
- ❌ `Resources` or `RESOURCES`

### 3. **Ensure Community Field is Set**

The admin panel automatically sets the `community` field when creating News, Business, or Resource posts. The community name matches the logged-in admin's community (e.g., "Oromocto First Nation", "Elsipogtog First Nation").

**Important**: The main app must query using the exact community name as stored in the database. The community field is case-sensitive.

### 4. **Community Field Matching**

The admin app is creating data with:
```
community: "Elsipogtog First Nation"
```

Your main app queries must match this **exactly** (case-sensitive, including spaces):
```javascript
// ✅ Correct
where('community', '==', 'Elsipogtog First Nation')

// ❌ Wrong - won't match
where('community', '==', 'Elsipogtog')
where('community', '==', 'elsipogtog first nation')
```

### 4. **Firestore Security Rules**

Update your Firestore security rules to allow reads from these collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads for news
    match /news/{document=**} {
      allow read: if true; // Or add your authentication logic
      allow write: if false; // Only admin app can write
    }
    
    // Allow reads for businesses
    match /businesses/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Allow reads for resources
    match /resources/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 5. **Display Resources by Category/Sub-Category**

For Resources, the admin app sets:
- `category`: Always `"Community Resources"`
- `subCategory`: One of:
  - `"Chief & Council"`
  - `"Capital"`
  - `"Child & Family Services"`
  - `"Education"`
  - `"Employment & Training"`
  - `"Finance"`
  - `"Economic Development"`
  - `"Social Development"`
  - `"Human Resources"`
  - `"Band Operations"`
  - `"Contacts"`
  - `"Other"`

You can filter resources by sub-category:
```javascript
async function getResourcesBySubCategory(communityName, subCategory) {
  const resourcesRef = collection(db, 'resources');
  const q = query(
    resourcesRef, 
    where('community', '==', communityName),
    where('subCategory', '==', subCategory)
  );
  const querySnapshot = await getDocs(q);
  
  const resources = [];
  querySnapshot.forEach((doc) => {
    resources.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return resources;
}
```

### 6. **Display News by Category**

News items have a `category` field that can be:
- `"Community News"`
- `"Announcements"`
- `"Events"`
- `"Updates"`
- `"General"`

Filter news by category:
```javascript
async function getNewsByCategory(communityName, category) {
  const newsRef = collection(db, 'news');
  const q = query(
    newsRef,
    where('community', '==', communityName),
    where('category', '==', category)
  );
  const querySnapshot = await getDocs(q);
  
  // ... rest of the code
}
```

## 📁 File Storage Requirements

### Firebase Storage Folder Structure

When users submit documents with file attachments, files **must** be stored in Firebase Storage using the following folder structure based on the document category:

#### Required Storage Folders:

| Document Category | Storage Folder Path |
|-------------------|---------------------|
| Education | `education/` |
| Elder Care | `elder-support/` |
| Housing | `housing/` |
| Income Assistance | `income-assistance/` |
| Jordan's Principle | `jordans-principle/` |
| Social Assistance | `social-assistance/` (or `band-assistance/` as fallback) |
| Status Cards | `status-cards/` |
| Other | `other/` |

#### File Upload Example:

```javascript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadDocumentFile(file, category, documentId) {
  const storage = getStorage();
  
  // Map category to storage folder
  const categoryFolders = {
    'Education': 'education',
    'Elder Care': 'elder-support',
    'Housing': 'housing',
    'Income Assistance': 'income-assistance',
    "Jordan's Principle": 'jordans-principle',
    'Social Assistance': 'social-assistance',
    'Status Cards': 'status-cards',
    'Other': 'other',
  };
  
  const folder = categoryFolders[category] || 'other';
  const fileName = `${documentId}_${file.name}`;
  const storagePath = `${folder}/${fileName}`;
  
  // Upload file
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  
  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  // Save to Firestore document
  return {
    filePath: storagePath,        // Full path: "education/document123.pdf"
    storagePath: storagePath,     // Same as filePath
    downloadUrl: downloadURL,     // Full download URL
    fileName: file.name,          // Original filename
  };
}
```

#### Important Notes:

1. **Folder names must match exactly** (case-sensitive, use lowercase with hyphens)
2. **Always include the category folder in the file path** (e.g., `education/filename.pdf`, not just `filename.pdf`)
3. **Save the storage path in the document** - Store at least one of: `filePath`, `storagePath`, `fileUrl`, or `downloadUrl`
4. **Create missing folders** - Ensure all 8 category folders exist in Firebase Storage

See `FIREBASE_STORAGE_FOLDERS.md` for complete details.

## 📋 Data Structure Reference

### News Document
```typescript
{
  id: string;
  community?: string;        // "Elsipogtog First Nation"
  title: string;             // "Testing Announcement"
  content: string;            // News content
  date?: string;              // "2025-12-24"
  category?: string;         // "Announcements"
  createdAt: string;          // ISO timestamp
}
```

### Business Document
```typescript
{
  id: string;
  community?: string;
  name: string;
  category?: string;          // "Retail", "Food & Beverage", etc.
  description?: string;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  createdAt: string;
}
```

### Resource Document
```typescript
{
  id: string;
  community?: string;
  name: string;
  category: string;           // Always "Community Resources"
  subCategory?: string;        // "Chief & Council", etc.
  description?: string;
  contacts?: Array<{
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    office?: string;
    fax?: string;
  }>;
  createdAt: string;
}
```

## 🔍 Troubleshooting

### Data Not Appearing?

1. **Check Collection Names**: Verify you're using `news`, `businesses`, `resources` (lowercase)

2. **Check Community Field**: 
   - Admin app uses: `"Elsipogtog First Nation"` (with spaces, exact capitalization)
   - Your query must match exactly

3. **Check Firebase Project**: 
   - Both apps must use the **same Firebase project**
   - Verify in Firebase Console → Project Settings

4. **Check Security Rules**: 
   - Rules must allow `read` access
   - Test in Firebase Console → Firestore Database → Rules

5. **Check Firebase Connection**: 
   - Ensure main app is properly initialized with Firebase
   - Verify Firebase config matches the admin app's project

6. **Test Query in Firebase Console**:
   - Go to Firebase Console → Firestore Database
   - Check if documents exist in `news`, `businesses`, `resources` collections
   - Verify the `community` field value matches your queries

## 📝 Quick Checklist

- [ ] Main app queries `news` collection
- [ ] Main app queries `businesses` collection
- [ ] Main app queries `resources` collection
- [ ] Community field matches exactly: `"Elsipogtog First Nation"`
- [ ] Firestore security rules allow reads
- [ ] Both apps use the same Firebase project
- [ ] Firebase is properly initialized in main app

## 🎯 Example: Complete Integration

```javascript
// firebase.js (main app)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config (must match admin app's project)
  apiKey: "...",
  authDomain: "...",
  projectId: "...", // ⚠️ Must be same as admin app
  // ... rest of config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

```javascript
// services/content.js (main app)
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchNews(community) {
  const q = query(
    collection(db, 'news'),
    where('community', '==', community)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchBusinesses(community) {
  const q = query(
    collection(db, 'businesses'),
    where('community', '==', community)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchResources(community) {
  const q = query(
    collection(db, 'resources'),
    where('community', '==', community)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

