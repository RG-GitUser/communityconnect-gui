'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, FileText, MessageSquare, BarChart3 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { getUsers, getPosts, getDocuments } from '@/lib/firebase'

export default function Home() {
  const { community } = useAuth()
  const [stats, setStats] = useState([
    { name: 'Total Users', value: '...', icon: Users, href: '/users' },
    { name: 'Total Posts', value: '...', icon: MessageSquare, href: '/posts' },
    { name: 'Documents', value: '...', icon: FileText, href: '/documents' },
    { name: 'Categories', value: '6+', icon: BarChart3, href: '/documents' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!community) {
        setLoading(false)
        return
      }

      try {
        const [users, posts, documents] = await Promise.all([
          getUsers(community),
          getPosts(community),
          getDocuments(undefined, community),
        ])

        setStats([
          { name: 'Total Users', value: users.length.toString(), icon: Users, href: '/users' },
          { name: 'Total Posts', value: posts.length.toString(), icon: MessageSquare, href: '/posts' },
          { name: 'Documents', value: documents.length.toString(), icon: FileText, href: '/documents' },
          { name: 'Categories', value: '6+', icon: BarChart3, href: '/documents' },
        ])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [community])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold text-gray-900">Community Connect Admin</h1>
        <p className="mt-3 text-xl text-gray-600">
          Manage users, posts, and documentation submissions
        </p>
        {community && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800">
            <span>Viewing data for:</span>
            <span className="font-semibold">{community}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const accentColors = ['#b3e8f0', '#ffc299', '#ffeaa7', '#b3e8f0']
          const accentColor = accentColors[index % accentColors.length]
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="relative overflow-hidden rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md"
              style={{ borderTop: `4px solid ${accentColor}80` }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-10 w-10" style={{ color: accentColor }} />
                </div>
                <div className="ml-5">
                  <p className="text-base font-medium text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/users/new"
            className="flex items-center justify-center rounded-lg px-6 py-4 text-base font-semibold text-white transition hover:opacity-90"
            style={{ 
              backgroundColor: '#ffc299',
              boxShadow: '0 2px 8px rgba(255, 194, 153, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 194, 153, 0.5)'
            }}
          >
            Add New User
          </Link>
          <Link
            href="/users"
            className="flex items-center justify-center rounded-lg bg-white px-6 py-4 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
            style={{ 
              borderColor: '#b3e8f080',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(179, 232, 240, 0.3)'
            }}
          >
            View All Users
          </Link>
          <Link
            href="/documents"
            className="flex items-center justify-center rounded-lg bg-white px-6 py-4 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
            style={{ 
              borderColor: '#ffeaa780',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 234, 167, 0.3)'
            }}
          >
            View Documents
          </Link>
          <Link
            href="/content"
            className="flex items-center justify-center rounded-lg px-6 py-4 text-base font-semibold text-white transition hover:opacity-90"
            style={{ 
              backgroundColor: '#b3e8f0', 
              color: '#1e3a8a',
              boxShadow: '0 2px 8px rgba(179, 232, 240, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(179, 232, 240, 0.5)'
            }}
          >
            Create Content
          </Link>
        </div>
      </div>
    </div>
  )
}

