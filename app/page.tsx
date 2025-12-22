import Link from 'next/link'
import { Users, FileText, MessageSquare, BarChart3 } from 'lucide-react'

export default function Home() {
  const stats = [
    { name: 'Total Users', value: '0', icon: Users, href: '/users' },
    { name: 'Total Posts', value: '0', icon: MessageSquare, href: '/posts' },
    { name: 'Documents', value: '0', icon: FileText, href: '/documents' },
    { name: 'Categories', value: '6+', icon: BarChart3, href: '/documents' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Community Connect Admin</h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage users, posts, and documentation submissions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="relative overflow-hidden rounded-lg bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/users/new"
            className="flex items-center justify-center rounded-md bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            Add New User
          </Link>
          <Link
            href="/users"
            className="flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            View All Users
          </Link>
          <Link
            href="/documents"
            className="flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            View Documents
          </Link>
        </div>
      </div>
    </div>
  )
}

