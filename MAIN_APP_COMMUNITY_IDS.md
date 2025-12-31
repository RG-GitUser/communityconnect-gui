# Main App Community ID Integration Guide

## Problem
The admin panel and main app need to use the **same community IDs** for user filtering to work. Currently, there's a mismatch:
- **Admin Panel**: Uses community IDs like `C0001`, `C0002`, `C0003`, etc.
- **Main App Users**: Have numeric IDs like `"66"`, `"67"`, `"57"` in their `favoriteCommunities` array

## Solution: What the Main App Needs to Do

### 1. Use the Same Communities Collection

Both apps must use the **same Firebase `communities` collection**. The admin panel creates communities in this collection with:
- `name`: Community name (e.g., "Oromocto First Nation")
- `id`: Community ID in format `C0001`, `C0002`, etc. (auto-generated)

### 2. Get Community ID When User Favorites a Community

When a user selects/favorites a community in the main app, you need to:

1. **Query the communities collection** to find the community by name
2. **Get the `id` field** from that community document
3. **Store that `id`** in the user's `favoriteCommunities` array

### Example Code for Main App

```javascript
// When user selects a community during signup or favorites it
async function favoriteCommunity(communityName, userId) {
  const db = getFirestore();
  
  // 1. Find the community by name
  const communitiesRef = collection(db, 'communities');
  const q = query(communitiesRef, where('name', '==', communityName));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const communityDoc = querySnapshot.docs[0];
    const communityData = communityDoc.data();
    
    // 2. Get the community ID (should be C0001, C0002, etc.)
    const communityId = communityData.id; // e.g., "C0001"
    
    // 3. Add it to user's favoriteCommunities array
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentFavorites = userDoc.data()?.favoriteCommunities || [];
    
    // Only add if not already favorited
    if (!currentFavorites.includes(communityId)) {
      await updateDoc(userRef, {
        favoriteCommunities: [...currentFavorites, communityId]
      });
    }
    
    return communityId;
  } else {
    console.error(`Community "${communityName}" not found in communities collection`);
    return null;
  }
}
```

### 3. During User Signup

When a user signs up and selects their community:

```javascript
// During signup
async function createUserWithCommunity(userData, selectedCommunityName) {
  const db = getFirestore();
  
  // 1. Find the community
  const communitiesRef = collection(db, 'communities');
  const q = query(communitiesRef, where('name', '==', selectedCommunityName));
  const querySnapshot = await getDocs(q);
  
  let communityId = null;
  if (!querySnapshot.empty) {
    const communityDoc = querySnapshot.docs[0];
    communityId = communityDoc.data().id; // Get the C0001 format ID
  }
  
  // 2. Create user with community ID in favoriteCommunities
  const newUser = {
    ...userData,
    favoriteCommunities: communityId ? [communityId] : [],
    // Optionally also store community name for backward compatibility
    community: selectedCommunityName,
  };
  
  await addDoc(collection(db, 'users'), newUser);
}
```

### 4. Important Notes

1. **Community Name Must Match Exactly**: The community name must match exactly (case-sensitive, including spaces)
   - ✅ "Oromocto First Nation"
   - ❌ "oromocto first nation"
   - ❌ "Oromocto FN"

2. **Use the `id` Field**: Always use the `id` field from the community document, not the document ID or any other field

3. **Format**: The IDs are in format `C0001`, `C0002`, `C0003`, etc. (C + 4-digit number)

4. **Collection Name**: Must be exactly `communities` (lowercase)

### 5. Migration for Existing Users

If you have existing users with old numeric IDs in their `favoriteCommunities`, you have two options:

**Option A: Update Existing Users** (Recommended)
- Query all users
- For each user, find their communities by the old numeric ID
- Map the old ID to the new C0001 format ID
- Update the user's `favoriteCommunities` array

**Option B: Support Both Formats Temporarily**
- Modify the admin panel to check for both old numeric IDs and new C0001 format IDs
- Gradually migrate users over time

### 6. Testing

To verify it's working:

1. In the main app, have a user favorite "Oromocto First Nation"
2. Check the user document in Firebase Console
3. Verify `favoriteCommunities` contains `["C0001"]` (or whatever ID was assigned)
4. Log into admin panel as "Oromocto First Nation"
5. The user should appear in the users list

### 7. Community ID Format Reference

- **Communities**: `C0001`, `C0002`, `C0003`, etc.
- **Artists** (future): `A0001`, `A0002`, etc.
- **Hubs** (future): `H0001`, `H0002`, etc.

The pattern is: `[Prefix][4-digit-number]`

## Quick Checklist for Main App

- [ ] Main app queries `communities` collection (same as admin panel)
- [ ] When user favorites a community, get the `id` field from community document
- [ ] Store that `id` (C0001 format) in user's `favoriteCommunities` array
- [ ] Community names match exactly (case-sensitive)
- [ ] Both apps use the same Firebase project
- [ ] Collection name is exactly `communities` (lowercase)

## Troubleshooting

**Users not appearing in admin panel:**
1. Check that user's `favoriteCommunities` contains the community ID (e.g., `["C0001"]`)
2. Verify the community document has an `id` field with that value
3. Check that community names match exactly
4. Verify both apps use the same Firebase project

**Community not found:**
1. Make sure the community exists in the `communities` collection
2. Check that the community name matches exactly (including capitalization and spaces)
3. Verify the collection name is `communities` (not `Communities` or `COMMUNITIES`)



