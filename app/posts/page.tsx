'use client'

import { useEffect, useState } from 'react'
import { getPosts, getPostsByCategory, getUsers, createPost, updatePost, deletePost, type Post, type User } from '@/lib/firebase'
import { MessageSquare, User as UserIcon, Plus, Edit, Trash2, X, Save, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function PostsPage() {
  const { community } = useAuth()
  const [allPosts, setAllPosts] = useState<Post[]>([]) // Store all posts for category counts
  const [posts, setPosts] = useState<Post[]>([]) // Filtered posts to display
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (community) {
      fetchData()
    }
  }, [community, selectedCategory])

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
      community: community || undefined, // Always use logged-in community
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
      // Filter posts by community on the server
      const postsData = await getPosts(community || undefined)
      
      // Also get users filtered by community for the user dropdown
      const [usersData] = await Promise.all([
        getUsers(community || undefined),
      ])
      
      setAllPosts(postsData) // Store all posts for category counts
      
      // Filter by selected category if one is selected
      const filteredPosts = selectedCategory 
        ? postsData.filter(post => post.category === selectedCategory)
        : postsData
      
      setPosts(filteredPosts)
      setUsers(usersData)
      
      // Expand all categories by default
      const categories = Array.from(new Set(postsData.map(p => p.category).filter(Boolean))) as string[]
      const expanded: Record<string, boolean> = {}
      categories.forEach(cat => {
        expanded[cat] = true
      })
      setExpandedCategories(expanded)
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
          <h1 className="text-4xl font-bold text-white drop-shadow-md">Posts</h1>
          <p className="mt-2 text-base text-white/80 drop-shadow-sm">
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
        <div className="cc-surface p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              {editingPost ? 'Edit Post' : 'Create Post'}
            </h3>
            <button
              onClick={() => {
                setShowPostForm(false)
                setEditingPost(null)
              }}
              className="text-white/60 hover:text-white/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Community
              </label>
              <input
                type="text"
                name="community"
                value={community || ''}
                disabled
                className="cc-input w-full rounded-md px-3 py-2 text-base text-white/70 bg-white/5"
              />
              <p className="mt-1 text-xs text-white/60">This is automatically set to your community</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Category *
              </label>
              <select
                name="category"
                required
                defaultValue={editingPost?.category || ''}
                className="cc-input w-full rounded-md px-3 py-2 text-base"
              >
                <option value="">Select a category</option>
                {postCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/60">
                This category determines where the post appears in the main app
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={editingPost?.title || ''}
                className="cc-input w-full rounded-md px-3 py-2 text-base"
                placeholder="Post title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Content *
              </label>
              <textarea
                name="content"
                required
                rows={6}
                defaultValue={editingPost?.content || ''}
                className="cc-input w-full rounded-md px-3 py-2 text-base"
                placeholder="Post content..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                User ID (Optional)
              </label>
              <input
                type="text"
                name="userId"
                defaultValue={editingPost?.userId || ''}
                className="cc-input w-full rounded-md px-3 py-2 text-base"
                placeholder="Leave empty for admin posts"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                User Account ID (Optional)
              </label>
              <input
                type="text"
                name="userAccountId"
                defaultValue={editingPost?.userAccountId || ''}
                className="cc-input w-full rounded-md px-3 py-2 text-base"
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

      {/* Category Filter */}
      {allPosts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-white/80">Filter by category:</span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedCategory === ''
                ? 'text-navy'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
            style={selectedCategory === '' ? { 
              backgroundColor: '#b3e8f0',
              boxShadow: '0 2px 6px rgba(179, 232, 240, 0.3), 0 1px 2px rgba(0, 0, 0, 0.08)',
            } : {}}
          >
            All ({allPosts.length})
          </button>
          {postCategories.map((category) => {
            const count = allPosts.filter(p => p.category === category).length
            if (count === 0) return null
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'text-navy'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
                style={selectedCategory === category ? { 
                  backgroundColor: '#b3e8f0',
                  boxShadow: '0 2px 6px rgba(179, 232, 240, 0.3), 0 1px 2px rgba(0, 0, 0, 0.08)',
                } : {}}
              >
                {category} ({count})
              </button>
            )
          })}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="cc-surface p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-white/50" />
          <h3 className="mt-4 text-sm font-semibold text-white">No posts found</h3>
          <p className="mt-2 text-sm text-white/70">
            {selectedCategory 
              ? `No posts found in the "${selectedCategory}" category.`
              : 'No posts found for this community.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group posts by category */}
          {(() => {
            const groupedPosts = posts.reduce((acc, post) => {
              const category = post.category || 'Uncategorized'
              if (!acc[category]) {
                acc[category] = []
              }
              acc[category].push(post)
              return acc
            }, {} as Record<string, Post[]>)

            const sortedCategories = Object.keys(groupedPosts).sort((a, b) => {
              // Put "Uncategorized" at the end
              if (a === 'Uncategorized') return 1
              if (b === 'Uncategorized') return -1
              return a.localeCompare(b)
            })

            return sortedCategories.map((category) => (
              <div key={category} className="cc-surface overflow-hidden">
                <button
                  onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                  className="w-full flex items-center justify-between px-6 py-4 bg-white/10 hover:bg-white/15 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-white">{category}</span>
                    <span className="rounded-full px-3 py-1 text-xs font-medium bg-white/15 text-white/70">
                      {groupedPosts[category].length} {groupedPosts[category].length === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                  {expandedCategories[category] !== false ? (
                    <ChevronDown className="h-5 w-5 text-white/60" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-white/60" />
                  )}
                </button>
                {expandedCategories[category] !== false && (
                  <div className="divide-y divide-white/10">
                    {groupedPosts[category].map((post) => (
                      <div
                        key={post.id}
                        className="p-6 hover:bg-white/5 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {post.title || 'Untitled Post'}
                              </h3>
                              {post.community && (
                                <span className="rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                                  {post.community}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-white/60">
                              {post.userId && (
                                <Link
                                  href={`/users/${post.userId}`}
                                  className="flex items-center transition hover:opacity-70"
                                  style={{ color: '#ffc299' }}
                                >
                                  <UserIcon className="mr-1 h-4 w-4" />
                                  {getUserName(post.userId)}
                                </Link>
                              )}
                              {post.userAccountId && (
                                <span className="font-mono text-xs">
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
                              <p className="mt-3 text-sm text-white/80 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingPost(post)
                                setShowPostForm(true)
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                              title="Edit post"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Delete post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}

