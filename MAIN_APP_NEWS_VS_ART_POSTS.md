# News vs Art Posts - Main App Configuration

## Problem
News items created in the admin panel are appearing as "art posts" and "anon" in the main app.

## Solution

The admin panel creates news in the **`news` collection**, which is separate from the **`artPosts` collection** used for art posts.

### Collections

- **News**: `news` collection (created by admin panel)
- **Art Posts**: `artPosts` collection (created by users in main app)

These are **two different collections** and should be queried separately.

## What the Main App Needs to Do

### 1. Query the `news` Collection for News Items

The main app should query the `news` collection to display news items:

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

async function getNews(communityName) {
  const newsRef = collection(db, 'news'); // ← Use 'news' collection, NOT 'artPosts'
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

### 2. Display News Separately from Art Posts

News and art posts should be displayed in different sections:

- **News Section**: Query `news` collection
- **Art Posts Section**: Query `artPosts` collection

### 3. News Document Structure

News items from the admin panel have this structure:

```typescript
{
  id: string;
  community?: string;        // "Oromocto First Nation"
  title: string;             // News title
  content: string;            // News content
  date?: string;              // "2025-01-15" (YYYY-MM-DD)
  category?: string;         // "Community News", "Announcements", etc.
  type?: string;             // "news" (to distinguish from art posts)
  source?: string;           // "admin" (indicates created from admin panel)
  createdAt: string;          // ISO timestamp
}
```

### 4. Art Posts vs News - Key Differences

| Field | News (Admin) | Art Posts (Users) |
|-------|-------------|-------------------|
| Collection | `news` | `artPosts` |
| Type | `type: "news"` | No type field (or different) |
| Source | `source: "admin"` | Created by users |
| User Info | No userId (admin created) | Has userId/userAccountId |
| Author | Shows as admin/community | Shows user name |

### 5. Displaying News with Author

Since news items don't have a `userId`, you can display them as:

```javascript
// For news items (from admin)
const author = newsItem.source === 'admin' 
  ? newsItem.community || 'Admin' 
  : 'Unknown';

// For art posts (from users)
const author = artPost.userName || artPost.userAccountId || 'Anonymous';
```

### 6. Filtering News by Category

News items can be filtered by category:

```javascript
async function getNewsByCategory(communityName, category) {
  const newsRef = collection(db, 'news');
  const q = query(
    newsRef,
    where('community', '==', communityName),
    where('category', '==', category) // e.g., "Announcements", "Community News"
  );
  const querySnapshot = await getDocs(q);
  
  // ... process results
}
```

## Common Issues

### Issue 1: News Appearing as Art Posts
**Problem**: Main app is querying `artPosts` collection instead of `news` collection.

**Solution**: Make sure you're querying the `news` collection for news items.

### Issue 2: Showing as "anon"
**Problem**: News items don't have `userId` or `userName` fields, so the main app shows them as anonymous.

**Solution**: Check if `source === 'admin'` and display the community name or "Admin" as the author.

### Issue 3: News Not Appearing
**Problem**: Main app might be filtering by `userId` which news items don't have.

**Solution**: Query news separately without user filters, or check for `type === 'news'` or `source === 'admin'`.

## Quick Checklist

- [ ] Main app queries `news` collection for news items (separate from `artPosts`)
- [ ] News items are displayed in a separate section from art posts
- [ ] Author is displayed as community name or "Admin" for news items
- [ ] News items are filtered by `community` field
- [ ] Both apps use the same Firebase project
- [ ] Collection name is exactly `news` (lowercase, not `News` or `NEWS`)

## Example: Displaying Both News and Art Posts

```javascript
// Fetch news
const news = await getNews(communityName);

// Fetch art posts
const artPosts = await getArtPosts(communityName);

// Display separately
<div>
  <h2>Community News</h2>
  {news.map(item => (
    <div key={item.id}>
      <h3>{item.title}</h3>
      <p>{item.content}</p>
      <p>By: {item.community || 'Admin'}</p>
      <p>Date: {item.date}</p>
    </div>
  ))}
</div>

<div>
  <h2>Art Posts</h2>
  {artPosts.map(post => (
    <div key={post.id}>
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <p>By: {post.userName || 'Anonymous'}</p>
    </div>
  ))}
</div>
```

