import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let app: App | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

export function getFirebaseAdmin(): Firestore {
  if (db) {
    return db;
  }

  // Check if Firebase Admin is already initialized
  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
  } else {
    // Initialize Firebase Admin
    // Support multiple configuration methods (matching main app format)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Also support JSON file or JSON string (for backward compatibility)
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    let serviceAccountJson;
    
    // Option 1: Use individual environment variables (matching main app)
    if (projectId && clientEmail && privateKey) {
      serviceAccountJson = {
        type: 'service_account',
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Replace escaped newlines
      };
    }
    // Option 2: Use file path
    else if (serviceAccountPath) {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.resolve(process.cwd(), serviceAccountPath);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        serviceAccountJson = JSON.parse(fileContent);
      } catch (error: any) {
        throw new Error(`Failed to read Firebase service account file at ${serviceAccountPath}: ${error.message}`);
      }
    }
    // Option 3: Use JSON string from environment variable
    else if (serviceAccountKey) {
      try {
        serviceAccountJson = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON string. Make sure it\'s wrapped in quotes in your .env file.');
      }
    } else {
      throw new Error('Firebase Admin configuration missing. Please set either:\n' +
        '1. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (recommended, matches main app)\n' +
        '2. FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON file)\n' +
        '3. FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)');
    }
    
    // Ensure private_key is properly formatted (replace escaped newlines)
    if (serviceAccountJson.private_key && typeof serviceAccountJson.private_key === 'string') {
      serviceAccountJson.private_key = serviceAccountJson.private_key.replace(/\\n/g, '\n');
    }
    
    try {
      app = initializeApp({
        credential: cert(serviceAccountJson),
      });
    } catch (error: any) {
      console.error('Firebase initialization error:', error);
      throw new Error(`Failed to initialize Firebase: ${error.message}`);
    }
  }

  db = getFirestore(app);
  return db;
}

export function getFirebaseStorage(): Storage {
  if (storage) {
    return storage;
  }

  if (!app) {
    getFirebaseAdmin(); // Initialize app if not already initialized
    // After calling getFirebaseAdmin, app should be set
    if (!app) {
      throw new Error('Failed to initialize Firebase app');
    }
  }

  storage = getStorage(app);
  return storage;
}

// Collection names - matching your Firebase collections
export const USERS_COLLECTION = process.env.FIREBASE_USERS_COLLECTION || 'users';
export const POSTS_COLLECTION = process.env.FIREBASE_POSTS_COLLECTION || 'artPosts';
export const DOCUMENTS_COLLECTION = process.env.FIREBASE_DOCUMENTS_COLLECTION || 'documentation-submissions';
export const STATUS_CARDS_COLLECTION = process.env.FIREBASE_STATUS_CARDS_COLLECTION || 'status-cards';

