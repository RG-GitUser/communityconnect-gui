# Verification Checklist

Use this checklist to verify your main app is properly connected to the admin app's data.

## ✅ Implementation Complete

You've correctly implemented:
- ✅ `communityData.js` utility file with all query functions
- ✅ Firestore security rules allowing reads
- ✅ Correct collection names (lowercase)
- ✅ Community field matching (case-sensitive)

## 🔍 Verification Steps

### Step 1: Verify Data Exists in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Check if you see these collections:
   - `news`
   - `businesses`
   - `resources`

5. Open each collection and verify:
   - Documents exist
   - `community` field shows: `"Elsipogtog First Nation"` (exact match)
   - Data structure matches expected format

### Step 2: Test Your Query Functions

Add console logging to verify queries are working:

```javascript
// In your communityData.js or where you call these functions

// Test News
const news = await getNews('Elsipogtog First Nation');
console.log('News fetched:', news);
console.log('News count:', news.length);

// Test Businesses
const businesses = await getBusinesses('Elsipogtog First Nation');
console.log('Businesses fetched:', businesses);
console.log('Businesses count:', businesses.length);

// Test Resources
const resources = await getResources('Elsipogtog First Nation');
console.log('Resources fetched:', resources);
console.log('Resources count:', resources.length);
```

### Step 3: Verify Firebase Project Match

**Critical**: Both apps must use the **same Firebase project**.

**In Admin App:**
- Check `.env` or config for `FIREBASE_PROJECT_ID`
- Note the project ID

**In Main App:**
- Check your Firebase config file
- Verify `projectId` matches the admin app's project ID

```javascript
// Main app firebase config
const firebaseConfig = {
  projectId: "your-project-id", // ⚠️ Must match admin app
  // ... other config
};
```

### Step 4: Check Community Name Matching

The admin app creates data with:
```javascript
community: "Elsipogtog First Nation"
```

Your main app queries must use **exactly** the same string:
```javascript
// ✅ Correct
getNews('Elsipogtog First Nation')

// ❌ Wrong - won't match
getNews('Elsipogtog')
getNews('elsipogtog first nation')
getNews('ElsipogtogFirstNation')
```

### Step 5: Verify Firestore Rules Are Deployed

1. Go to Firebase Console → Firestore Database → Rules
2. Verify your rules are deployed and match:
   ```javascript
   match /news/{document=**} {
     allow read: if true;
     allow write: if false;
   }
   match /businesses/{document=**} {
     allow read: if true;
     allow write: if false;
   }
   match /resources/{document=**} {
     allow read: if true;
     allow write: if false;
   }
   ```

3. Click **Publish** if you see "Rules not published" warning

### Step 6: Test with Firebase Console Query

In Firebase Console, manually test a query:

1. Go to Firestore Database
2. Click on `news` collection
3. Add a filter:
   - Field: `community`
   - Operator: `==`
   - Value: `Elsipogtog First Nation`
4. Verify documents appear

If documents don't appear here, the issue is with:
- Collection name mismatch
- Community field value mismatch
- Wrong Firebase project

### Step 7: Check Browser Console for Errors

Open your main app in browser and check console for:
- Firebase initialization errors
- Permission denied errors
- Network errors
- Query errors

Common errors:
```
❌ Missing or insufficient permissions
→ Check Firestore security rules

❌ Firebase: Error (auth/unauthorized-domain)
→ Check Firebase project settings → Authorized domains

❌ Firebase: Error (app/no-app)
→ Firebase not initialized properly
```

## 🐛 Common Issues & Solutions

### Issue 1: No Data Appearing

**Possible Causes:**
1. **Different Firebase Projects**
   - Solution: Verify both apps use same `projectId`

2. **Community Name Mismatch**
   - Solution: Check exact string in Firebase Console vs your query

3. **Collection Name Mismatch**
   - Solution: Verify lowercase: `news`, `businesses`, `resources`

4. **Security Rules Not Deployed**
   - Solution: Publish rules in Firebase Console

### Issue 2: Permission Denied Errors

**Solution:**
- Check Firestore rules are published
- Verify rules allow `read: if true`
- Check Firebase project settings → Authorized domains includes your app domain

### Issue 3: Empty Arrays Returned

**Possible Causes:**
1. **Community field doesn't match**
   - Check: `"Elsipogtog First Nation"` (with spaces, exact case)
   - Debug: Log the community name you're querying with

2. **No documents in collection**
   - Check: Firebase Console to see if documents exist
   - Verify: Documents have `community` field set

## 📝 Debugging Code Template

Add this to your main app to debug:

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase'; // Your Firebase config

async function debugQuery() {
  const communityName = 'Elsipogtog First Nation';
  
  console.log('🔍 Debugging Firebase Query');
  console.log('Community:', communityName);
  console.log('Firebase Project ID:', db.app.options.projectId);
  
  // Test News
  try {
    const newsRef = collection(db, 'news');
    console.log('📰 News collection exists:', newsRef);
    
    const newsQuery = query(newsRef, where('community', '==', communityName));
    const newsSnapshot = await getDocs(newsQuery);
    
    console.log('📰 News query result:');
    console.log('  - Documents found:', newsSnapshot.size);
    newsSnapshot.forEach((doc) => {
      console.log('  - Document ID:', doc.id);
      console.log('  - Data:', doc.data());
    });
  } catch (error) {
    console.error('❌ News query error:', error);
  }
  
  // Test Businesses
  try {
    const businessesRef = collection(db, 'businesses');
    const businessesQuery = query(businessesRef, where('community', '==', communityName));
    const businessesSnapshot = await getDocs(businessesQuery);
    
    console.log('🏢 Businesses query result:');
    console.log('  - Documents found:', businessesSnapshot.size);
  } catch (error) {
    console.error('❌ Businesses query error:', error);
  }
  
  // Test Resources
  try {
    const resourcesRef = collection(db, 'resources');
    const resourcesQuery = query(resourcesRef, where('community', '==', communityName));
    const resourcesSnapshot = await getDocs(resourcesQuery);
    
    console.log('📚 Resources query result:');
    console.log('  - Documents found:', resourcesSnapshot.size);
  } catch (error) {
    console.error('❌ Resources query error:', error);
  }
}

// Call this function in your app to debug
debugQuery();
```

## ✅ Success Indicators

You'll know it's working when:
- ✅ Browser console shows documents being fetched
- ✅ Data appears in your UI
- ✅ No permission errors in console
- ✅ Query returns non-empty arrays
- ✅ Firebase Console shows documents exist

## 🎯 Next Steps

1. Run the debugging code above
2. Check browser console output
3. Verify Firebase Console has documents
4. Compare community names exactly
5. Share console output if issues persist

