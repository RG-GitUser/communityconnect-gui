// Client-side API functions that call Next.js API routes
// The actual Firebase operations are handled server-side in app/api routes

// Types (updated for Firebase - Firestore uses 'id' instead of '$id')
export interface User {
  id: string;
  // Basic fields
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  accountId?: string;
  
  // Community fields
  favoriteCommunities?: string[]; // Array of community IDs (e.g., ["C0001", "66", "C0064"])
  community?: string; // Community name for backward compatibility
  
  // Profile fields
  bio?: string;
  badge?: string;
  role?: string;
  photoURL?: string;
  location?: string;
  lineage?: string;
  
  // Business profile
  businessProfile?: {
    activatedAt?: string;
    businessAddress?: string;
    businessCategory?: string;
    businessDescription?: string;
    businessName?: string;
    businessPhone?: string;
    businessWebsite?: string;
    createdAt?: string;
    darkMode?: boolean;
  };
  isBusiness?: boolean;
  isArtist?: boolean;
  isEducation?: boolean;
  isJob?: boolean;
  
  // Favorites
  favoriteArtPosts?: string[];
  favoriteArtists?: string[];
  likedPosts?: string[];
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | Date;
  
  // Allow any other fields
  [key: string]: any;
}

export interface Post {
  id: string;
  userId?: string;
  userAccountId?: string;
  content?: string;
  title?: string;
  category?: string;
  community?: string;
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
  submissionId?: string;
  note?: string;
  createdAt?: string;
  filePath?: string;
  storagePath?: string;
  fileUrl?: string;
  file?: string;
  downloadUrl?: string;
  [key: string]: any;
}

export interface News {
  id: string;
  community?: string;
  title: string;
  content: string;
  date?: string;
  category?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Business {
  id: string;
  community?: string;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Resource {
  id: string;
  community?: string;
  name: string;
  category?: string;
  subCategory?: string;
  description?: string;
  contacts?: Array<{
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    office?: string;
    fax?: string;
  }>;
  createdAt?: string;
  [key: string]: any;
}

export interface ResourceContent {
  id: string;
  resourceId: string; // Links to the parent resource
  community?: string;
  title: string;
  content: string;
  description?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// User operations
export const getUsers = async (community?: string): Promise<User[]> => {
  try {
    const url = community ? `/api/users?community=${encodeURIComponent(community)}` : '/api/users';
    const response = await fetch(url);
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

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating user:', error);
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
export const getPosts = async (community?: string): Promise<Post[]> => {
  try {
    const url = community ? `/api/posts?community=${encodeURIComponent(community)}` : '/api/posts';
    const response = await fetch(url);
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

export const getPostsByCategory = async (category: string): Promise<Post[]> => {
  try {
    const response = await fetch(`/api/posts?category=${encodeURIComponent(category)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch posts by category');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching posts by category:', error);
    throw error;
  }
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>): Promise<Post> => {
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const updatePost = async (id: string, postData: Partial<Post>): Promise<Post> => {
  try {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update post');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete post');
    }
  } catch (error: any) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Document operations
export const getDocuments = async (category?: string, community?: string): Promise<Document[]> => {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (community) params.append('community', community);
    const url = params.toString() ? `/api/documents?${params.toString()}` : '/api/documents';
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

export const getDocumentFileUrl = async (documentId: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/documents/${documentId}/file`);
    if (!response.ok) {
      if (response.status === 404) {
        // File not found - return null silently (not an error condition)
        return null;
      }
      // For other errors, try to get error message but don't throw
      try {
        const error = await response.json();
        console.warn(`Failed to fetch file URL for document ${documentId}:`, error.error || 'Unknown error');
      } catch {
        // If response isn't JSON, just return null
      }
      return null;
    }
    const data = await response.json();
    return data.url || null;
  } catch (error: any) {
    // Silently return null - file URL fetching is optional for viewing
    // Downloads work via the proxy endpoint
    return null;
  }
};

export const updateDocument = async (documentId: string, documentData: Partial<Document>): Promise<Document> => {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update document');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete document');
    }
  } catch (error: any) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// News operations
export const getNews = async (community?: string): Promise<News[]> => {
  try {
    const url = community ? `/api/news?community=${encodeURIComponent(community)}` : '/api/news';
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch news');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const createNews = async (newsData: Omit<News, 'id' | 'createdAt'>): Promise<News> => {
  try {
    const response = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create news');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error creating news:', error);
    throw error;
  }
};

export const updateNews = async (id: string, newsData: Partial<News>): Promise<News> => {
  try {
    const response = await fetch(`/api/news/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update news');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating news:', error);
    throw error;
  }
};

export const deleteNews = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/news/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete news');
    }
  } catch (error: any) {
    console.error('Error deleting news:', error);
    throw error;
  }
};

// Business operations
export const getBusinesses = async (community?: string): Promise<Business[]> => {
  try {
    const url = community ? `/api/businesses?community=${encodeURIComponent(community)}` : '/api/businesses';
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch businesses');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
};

export const createBusiness = async (businessData: Omit<Business, 'id' | 'createdAt'>): Promise<Business> => {
  try {
    const response = await fetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create business');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error creating business:', error);
    throw error;
  }
};

export const updateBusiness = async (id: string, businessData: Partial<Business>): Promise<Business> => {
  try {
    const response = await fetch(`/api/businesses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update business');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating business:', error);
    throw error;
  }
};

export const deleteBusiness = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/businesses/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete business');
    }
  } catch (error: any) {
    console.error('Error deleting business:', error);
    throw error;
  }
};

// Resource operations
export const getResources = async (community?: string): Promise<Resource[]> => {
  try {
    const url = community ? `/api/resources?community=${encodeURIComponent(community)}` : '/api/resources';
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch resources');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const createResource = async (resourceData: Omit<Resource, 'id' | 'createdAt'>): Promise<Resource> => {
  try {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resourceData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create resource');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (id: string, resourceData: Partial<Resource>): Promise<Resource> => {
  try {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resourceData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update resource');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete resource');
    }
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

// Resource Content operations
export const getResourceContent = async (resourceId?: string, community?: string): Promise<ResourceContent[]> => {
  try {
    const params = new URLSearchParams();
    if (resourceId) params.append('resourceId', resourceId);
    if (community) params.append('community', community);
    const url = `/api/resource-content${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch resource content');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching resource content:', error);
    throw error;
  }
};

export const createResourceContent = async (contentData: Omit<ResourceContent, 'id' | 'createdAt'>): Promise<ResourceContent> => {
  try {
    const response = await fetch('/api/resource-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create resource content');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error creating resource content:', error);
    throw error;
  }
};

export const updateResourceContent = async (id: string, contentData: Partial<ResourceContent>): Promise<ResourceContent> => {
  try {
    const response = await fetch(`/api/resource-content/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update resource content');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating resource content:', error);
    throw error;
  }
};

export const deleteResourceContent = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/resource-content/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete resource content');
    }
  } catch (error: any) {
    console.error('Error deleting resource content:', error);
    throw error;
  }
};

