# Main App Integration Guide

This guide explains how to integrate News, Business, and Resources posts created in the admin panel with your main app.

## ✅ What's Already Working

The admin panel automatically:
- ✅ Sets the `community` field when creating News, Business, or Resources
- ✅ Stores data in the correct Firestore collections: `news`, `businesses`, `resources`
- ✅ Filters posts by community when displaying in the admin panel

## 🔧 What You Need to Do in the Main App

### 1. Query Firestore Collections

Your main app needs to query these three collections and filter by the user's community:

#### News Collection

```javascript
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase'; // Your Firebase config

async function getNewsForCommunity(communityName) {
  const newsRef = collection(db, 'news');
  const q = query(
    newsRef, 
    where('community', '==', communityName),
    orderBy('date', 'desc') // Sort by date, newest first
  );
  const querySnapshot = await getDocs(q);
  
  const news = [];
  querySnapshot.forEach((doc) => {
    news.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return news;
}
```

#### Businesses Collection

```javascript
async function getBusinessesForCommunity(communityName) {
  const businessesRef = collection(db, 'businesses');
  const q = query(
    businessesRef, 
    where('community', '==', communityName)
  );
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
async function getResourcesForCommunity(communityName) {
  const resourcesRef = collection(db, 'resources');
  const q = query(
    resourcesRef, 
    where('community', '==', communityName)
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

### 2. Get the User's Community Name

You need to get the community name from the logged-in user. This should match exactly how it's stored in the admin panel.

**Example:**
```javascript
// If your user object has a community field
const userCommunity = user.community; // e.g., "Oromocto First Nation"

// Or if you need to get it from user's favoriteCommunities
const userCommunity = user.favoriteCommunities?.[0]; // Get first community

// Then query the collections
const news = await getNewsForCommunity(userCommunity);
const businesses = await getBusinessesForCommunity(userCommunity);
const resources = await getResourcesForCommunity(userCommunity);
```

### 3. Display Posts on the Correct Pages

#### News Page
Display news items on your main app's News/Announcements page:

```javascript
// In your News component/page
useEffect(() => {
  const loadNews = async () => {
    if (userCommunity) {
      const newsItems = await getNewsForCommunity(userCommunity);
      setNews(newsItems);
    }
  };
  loadNews();
}, [userCommunity]);
```

#### Business Page
Display businesses on your main app's Business Directory page:

```javascript
// In your Business component/page
useEffect(() => {
  const loadBusinesses = async () => {
    if (userCommunity) {
      const businesses = await getBusinessesForCommunity(userCommunity);
      setBusinesses(businesses);
    }
  };
  loadBusinesses();
}, [userCommunity]);
```

#### Resources Page
Display resources on your main app's Resources page:

```javascript
// In your Resources component/page
useEffect(() => {
  const loadResources = async () => {
    if (userCommunity) {
      const resources = await getResourcesForCommunity(userCommunity);
      setResources(resources);
    }
  };
  loadResources();
}, [userCommunity]);
```

### 4. Important: Community Name Matching

The community name must match **exactly** (case-sensitive, including spaces):

✅ **Correct:**
- `"Oromocto First Nation"`
- `"Elsipogtog First Nation"`

❌ **Wrong (won't match):**
- `"Oromocto"`
- `"oromocto first nation"`
- `"OromoctoFirstNation"`

### 5. Data Structure

#### News Document Structure
```typescript
{
  id: string;
  community: string;           // e.g., "Oromocto First Nation"
  title: string;
  content: string;
  date: string;                // ISO date string
  category?: string;           // e.g., "Community News", "Announcements"
  createdAt: string;           // ISO timestamp
}
```

#### Business Document Structure
```typescript
{
  id: string;
  community: string;           // e.g., "Oromocto First Nation"
  name: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  createdAt: string;          // ISO timestamp
}
```

#### Resource Document Structure
```typescript
{
  id: string;
  community: string;           // e.g., "Oromocto First Nation"
  name: string;
  category: string;            // Always "Community Resources"
  subCategory?: string;        // e.g., "Chief & Council", "Health Centre"
  description?: string;
  contacts?: any[];           // Array of contact information
  createdAt: string;          // ISO timestamp
}
```

### 6. Firestore Security Rules

Ensure your Firestore security rules allow reads from these collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads for news
    match /news/{document=**} {
      allow read: if request.auth != null; // Or your auth logic
      allow write: if false; // Only admin app can write
    }
    
    // Allow reads for businesses
    match /businesses/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Allow reads for resources
    match /resources/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### 7. Real-time Updates (Optional)

To get real-time updates when new posts are created in the admin panel:

```javascript
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Subscribe to news updates
const newsRef = collection(db, 'news');
const newsQuery = query(newsRef, where('community', '==', userCommunity));

const unsubscribe = onSnapshot(newsQuery, (snapshot) => {
  const news = [];
  snapshot.forEach((doc) => {
    news.push({
      id: doc.id,
      ...doc.data()
    });
  });
  setNews(news);
});

// Don't forget to unsubscribe when component unmounts
return () => unsubscribe();
```

## 🎯 Summary

1. **Query Collections**: Use `news`, `businesses`, and `resources` collections
2. **Filter by Community**: Always filter by the user's community name
3. **Match Community Names**: Ensure exact match (case-sensitive)
4. **Display on Correct Pages**: Show News on News page, Businesses on Business page, Resources on Resources page
5. **Set Up Security Rules**: Allow reads but not writes from the main app

## 📝 Notes

- Posts created in the admin panel are immediately available in Firestore
- The `community` field is automatically set by the admin panel
- All posts are filtered by community, so users only see posts for their community
- The admin panel uses the same Firebase project, so no additional configuration is needed

