# Community Connect Admin Dashboard

A modern web application for managing the Community Connect app backend. This admin dashboard allows you to view and manage users, posts, and documentation submissions.

## Features

- **User Management**
  - View all registered users with their account information
  - View user details including account ID, email, phone, and creation date
  - Add new users
  - Delete users
  - See posts made by each user

- **Post Management**
  - View all posts made by users
  - See associated user information and account IDs
  - View post content and timestamps

- **Documentation Submissions**
  - View all documentation submissions
  - Filter by category:
    - Social Assistance
    - Housing
    - Elder Care
    - Education Funding
    - Status Card Update
    - Jordan's Principle
    - Other
  - See submission status, user information, and account IDs

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Appwrite**
   - Copy `.env.example` to `.env`
   - Fill in your Appwrite configuration:
     ```
     NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
     NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
     NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
     NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID=your-posts-collection-id
     NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID=your-documents-collection-id
     APPWRITE_API_KEY=your-api-key
     ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Appwrite Database Structure

The app expects the following collections in your Appwrite database:

### Users Collection
- `name` (string)
- `email` (string)
- `phone` (string)
- `accountId` (string) - Optional, can be auto-generated

### Posts Collection
- `userId` (string) - Reference to user
- `userAccountId` (string) - Optional, for quick lookup
- `title` (string)
- `content` (string)
- `createdAt` (datetime)

### Documents Collection
- `userId` (string) - Reference to user
- `userAccountId` (string) - Optional, for quick lookup
- `category` (string) - One of: Social Assistance, Housing, Elder Care, Education Funding, Status Card Update, Jordan's Principle, Other
- `title` (string)
- `description` (string)
- `status` (string) - Optional: pending, approved, rejected
- `createdAt` (datetime)

## Building for Production

```bash
npm run build
npm start
```

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Appwrite** - Backend database
- **Lucide React** - Icons

## Notes

- Make sure your Appwrite API key has the necessary permissions to read and write to your collections
- The app uses client-side rendering for all data fetching
- All operations are performed directly through the Appwrite SDK

## Firebase Integration

This admin app now uses **Firebase Firestore** (not Appwrite) for storing News, Businesses, and Resources. 

### Important: Main App Configuration

**The main app must use the same Firebase collection names** to read the data created by this admin app:

- News: `news` collection
- Businesses: `businesses` collection  
- Resources: `resources` collection

See `FIREBASE_COLLECTIONS.md` for detailed information about:
- Collection names and data structures
- How to query the data in the main app
- Troubleshooting if data isn't appearing

### Firebase Configuration

Configure Firebase using environment variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Optional: Override collection names
FIREBASE_NEWS_COLLECTION=news
FIREBASE_BUSINESSES_COLLECTION=businesses
FIREBASE_RESOURCES_COLLECTION=resources
```

# communityconnect-gui
