'use client'

import { useEffect, useState } from 'react'
import { getPosts, getUsers, type Post, type User } from '@/lib/firebase'
import { MessageSquare, User as UserIcon } from 'lucide-react'
import Link from 'next/link'

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all posts made by users
        </p>
      </div>

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
              className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {post.title || 'Untitled Post'}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <Link
                      href={`/users/${post.userId}`}
                      className="flex items-center hover:text-primary-600"
                    >
                      <UserIcon className="mr-1 h-4 w-4" />
                      {getUserName(post.userId)}
                    </Link>
                    <span className="font-mono text-xs">
                      Account: {getUserAccountId(post.userId)}
                    </span>
                    {post.createdAt && (
                      <span>
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {post.content && (
                    <p className="mt-4 text-sm text-gray-700">{post.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

