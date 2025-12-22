'use client'

import { useEffect, useState } from 'react'
import { getPosts, getUsers, createPost, updatePost, deletePost, type Post, type User } from '@/lib/firebase'
import { MessageSquare, User as UserIcon, Plus, Edit, Trash2, X, Save } from 'lucide-react'
import Link from 'next/link'

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showPostForm, setShowPostForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unknown User'
    const user = users.find(u => u.id === userId)
    return user?.name || user?.email || 'Unknown User'
  }

  const getUserAccountId = (userId?: string) => {
    if (!userId) return 'N/A'
    const user = users.find(u => u.id === userId)
    return user?.accountId || user?.id || 'N/A'
  }

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const postData: Omit<Post, 'id' | 'createdAt'> = {
      userId: formData.get('userId') as string || undefined,
      userAccountId: formData.get('userAccountId') as string || undefined,
      title: formData.get('title') as string || '',
      content: formData.get('content') as string || '',
      category: formData.get('category') as string || undefined,
      community: formData.get('community') as string || undefined,
    }
    
    try {
      if (editingPost) {
        await updatePost(editingPost.id, postData)
      } else {
        await createPost(postData)
      }
      setShowPostForm(false)
      setEditingPost(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to save post')
    }
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await deletePost(id)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete post')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [postsData, usersData] = await Promise.all([
        getPosts(),
        getUsers(),
      ])
      setPosts(postsData)
      setUsers(usersData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts')
      console.error('Error fetching posts:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading posts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      </div>
    )
  }

  // Common categories for posts
  const postCategories = [
    'News',
    'Events',
    'Announcements',
    'Community',
    'Business',
    'Resources',
    'Other'
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Posts</h1>
          <p className="mt-2 text-base text-gray-600">
            Manage posts and assign them to categories for the main app
          </p>
        </div>
        <button
          onClick={() => {
            setShowPostForm(true)
            setEditingPost(null)
          }}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
          style={{ 
            backgroundColor: '#b3e8f0', 
            color: '#1e3a8a',
            boxShadow: '0 2px 8px rgba(179, 232, 240, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(179, 232, 240, 0.5)'
          }}
        >
          <Plus className="h-5 w-5" />
          Create Post
        </button>
      </div>

      {showPostForm && (
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingPost ? 'Edit Post' : 'Create Post'}
            </h3>
            <button
              onClick={() => {
                setShowPostForm(false)
                setEditingPost(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community
              </label>
              <input
                type="text"
                name="community"
                defaultValue={editingPost?.community || ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                placeholder="e.g., Elsipogtog First Nation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                required
                defaultValue={editingPost?.category || ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
              >
                <option value="">Select a category</option>
                {postCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                This category determines where the post appears in the main app
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={editingPost?.title || ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                placeholder="Post title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                name="content"
                required
                rows={6}
                defaultValue={editingPost?.content || ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                placeholder="Post content..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID (Optional)
              </label>
              <input
                type="text"
                name="userId"
                defaultValue={editingPost?.userId || ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                placeholder="Leave empty for admin posts"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Account ID (Optional)
              </label>
              <input
                type="text"
                name="userAccountId"
                defaultValue={editingPost?.userAccountId || ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                placeholder="User account ID"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
                style={{ 
                  backgroundColor: '#b3e8f0', 
                  color: '#1e3a8a',
                  boxShadow: '0 2px 8px rgba(179, 232, 240, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(179, 232, 240, 0.5)'
                }}
              >
                <Save className="h-5 w-5" />
                {editingPost ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPostForm(false)
                  setEditingPost(null)
                }}
                className="rounded-md px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 transition"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(209, 213, 219, 0.5)'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No posts found</h3>
          <p className="mt-2 text-sm text-gray-500">
            No one has posted anything yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-900/5"
              style={{ borderLeft: '4px solid #b3e8f080' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {post.title || 'Untitled Post'}
                    </h3>
                    {post.category && (
                      <span className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                        {post.category}
                      </span>
                    )}
                    {post.community && (
                      <span className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                        {post.community}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-base text-gray-500">
                    {post.userId && (
                      <Link
                        href={`/users/${post.userId}`}
                        className="flex items-center transition hover:opacity-70"
                        style={{ color: '#ffc299' }}
                      >
                        <UserIcon className="mr-1 h-5 w-5" />
                        {getUserName(post.userId)}
                      </Link>
                    )}
                    {post.userAccountId && (
                      <span className="font-mono text-sm">
                        Account: {post.userAccountId}
                      </span>
                    )}
                    {post.createdAt && (
                      <span>
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {post.content && (
                    <p className="mt-4 text-base text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingPost(post)
                      setShowPostForm(true)
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

