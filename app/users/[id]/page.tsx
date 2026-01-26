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
        className="inline-flex items-center text-base text-gray-600 hover:text-gray-900 transition"
        style={{ color: '#b3e8f0' }}
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Users
      </Link>

      <div className="cc-surface p-8" style={{ borderTop: '4px solid #b3e8f080' }}>
        <h1 className="text-4xl font-bold text-white drop-shadow-md">{user.name || 'Unnamed User'}</h1>
        
        <dl className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <dt className="text-base font-medium text-white/60">Account ID</dt>
            <dd className="mt-2 text-base font-mono text-white">{user.accountId || user.id}</dd>
          </div>
          <div>
            <dt className="text-base font-medium text-white/60">User ID</dt>
            <dd className="mt-2 text-base font-mono text-white">{user.id}</dd>
          </div>
          {user.email && (
            <div>
              <dt className="text-base font-medium text-white/70 flex items-center">
                <Mail className="mr-2 h-5 w-5" style={{ color: '#ffc299' }} />
                Email
              </dt>
              <dd className="mt-2 text-base text-white">{user.email}</dd>
            </div>
          )}
          {user.phone && (
            <div>
              <dt className="text-base font-medium text-white/70 flex items-center">
                <Phone className="mr-2 h-5 w-5" style={{ color: '#ffeaa7' }} />
                Phone
              </dt>
              <dd className="mt-2 text-base text-white">{user.phone}</dd>
            </div>
          )}
          {user.createdAt && (
            <div>
              <dt className="text-base font-medium text-white/70 flex items-center">
                <Calendar className="mr-2 h-5 w-5" style={{ color: '#b3e8f0' }} />
                Created
              </dt>
              <dd className="mt-2 text-base text-white">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="cc-surface p-8" style={{ borderTop: '4px solid #ffc29980' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center">
            <MessageSquare className="mr-2 h-6 w-6" style={{ color: '#ffc299' }} />
            Posts ({posts.length})
          </h2>
        </div>
        {posts.length === 0 ? (
          <p className="text-base text-white/70">This user hasn't posted anything yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="pl-5 py-3 rounded-lg transition hover:shadow-sm" style={{ borderLeft: '4px solid #ffeaa780', backgroundColor: '#ffeaa710' }}>
                <h3 className="text-lg font-semibold text-white">{post.title || 'Untitled'}</h3>
                <p className="mt-2 text-base text-white/80">{post.content || 'No content'}</p>
                {post.createdAt && (
                  <p className="mt-3 text-sm text-white/60">
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

