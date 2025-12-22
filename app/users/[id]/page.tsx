'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUsers, getPostsByUser, type User, type Post } from '@/lib/firebase'
import { ArrowLeft, Mail, Phone, Calendar, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [usersData, postsData] = await Promise.all([
          getUsers(),
          getPostsByUser(userId),
        ])
        const foundUser = usersData.find(u => u.id === userId)
        if (!foundUser) {
          setError('User not found')
        } else {
          setUser(foundUser)
          setPosts(postsData)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user data')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading user details...</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link
          href="/users"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error || 'User not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Link>

      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h1 className="text-3xl font-bold text-gray-900">{user.name || 'Unnamed User'}</h1>
        
        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Account ID</dt>
            <dd className="mt-1 text-sm font-mono text-gray-900">{user.accountId || user.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">User ID</dt>
            <dd className="mt-1 text-sm font-mono text-gray-900">{user.id}</dd>
          </div>
          {user.email && (
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
          )}
          {user.phone && (
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{user.phone}</dd>
            </div>
          )}
          {user.createdAt && (
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Posts ({posts.length})
          </h2>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">This user hasn't posted anything yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border-l-4 border-primary-500 pl-4">
                <h3 className="text-sm font-semibold text-gray-900">{post.title || 'Untitled'}</h3>
                <p className="mt-1 text-sm text-gray-600">{post.content || 'No content'}</p>
                {post.createdAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

