// Client-side API functions that call Next.js API routes
// The actual Firebase operations are handled server-side in app/api routes

// Types (updated for Firebase - Firestore uses 'id' instead of '$id')
export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  accountId?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Post {
  id: string;
  userId?: string;
  userAccountId?: string;
  content?: string;
  title?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Document {
  id: string;
  userId?: string;
  userAccountId?: string;
  category?: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

// User operations
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Post operations
export const getPosts = async (): Promise<Post[]> => {
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch posts');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const getPostsByUser = async (userId: string): Promise<Post[]> => {
  try {
    const response = await fetch(`/api/posts?userId=${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user posts');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

// Document operations
export const getDocuments = async (category?: string): Promise<Document[]> => {
  try {
    const url = category ? `/api/documents?category=${encodeURIComponent(category)}` : '/api/documents';
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch documents');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const getDocumentCategories = async (): Promise<string[]> => {
  try {
    const documents = await getDocuments();
    const categories = new Set<string>();
    documents.forEach(doc => {
      if (doc.category) {
        categories.add(doc.category);
      }
    });
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

