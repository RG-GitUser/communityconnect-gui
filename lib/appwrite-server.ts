import { Client, Databases, ID, Query } from 'node-appwrite';

// Server-side Appwrite client with API key
let databasesInstance: Databases | null = null;

export function getDatabases(): Databases {
  if (databasesInstance) {
    return databasesInstance;
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const apiKey = process.env.APPWRITE_API_KEY || '';

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set');
  }

  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is not set');
  }

  // Debug: Verify API key is loaded (remove in production)
  if (apiKey.length < 20) {
    console.warn('Warning: API key seems too short. Please verify APPWRITE_API_KEY in .env file.');
  }

  // Create client and set endpoint, project, and API key
  // node-appwrite supports setKey for server-side API key authentication
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  databasesInstance = new Databases(client);
  return databasesInstance;
}

export { ID, Query };

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || '';
export const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID || '';
export const DOCUMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID || '';

// Re-export types
export type { User, Post, Document } from './appwrite';

