'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUsers, deleteUser, type User } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, Trash2, Eye, User as UserIcon } from 'lucide-react'

export default function UsersPage() {
  const { community } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUsers(community || undefined)
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (community) {
      fetchUsers()
    }
  }, [community])

  const handleDelete = async (userId: string, userName?: string) => {
    if (!confirm(`Are you sure you want to delete ${userName || 'this user'}?`)) {
      return
    }

    try {
      await deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
        <button
          onClick={fetchUsers}
          className="mt-2 text-sm text-red-600 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white drop-shadow-md">Users</h1>
          <p className="mt-2 text-base text-white/80 drop-shadow-sm">
            Manage all registered users and their account information
          </p>
        </div>
        <Link
          href="/users/new"
          className="flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white transition hover:opacity-90"
          style={{ 
            backgroundColor: '#ffc299', 
            color: '#1e3a8a',
            boxShadow: '0 2px 8px rgba(255, 194, 153, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 194, 153, 0.5)'
          }}
        >
          <Plus className="h-6 w-6" />
          Add User
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="cc-surface p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-white/50" />
          <h3 className="mt-4 text-sm font-semibold text-white">No users found</h3>
          <p className="mt-2 text-sm text-white/70">
            Get started by adding a new user.
          </p>
          <Link
            href="/users/new"
            className="mt-6 inline-flex items-center rounded-lg px-6 py-3 text-base font-semibold text-white transition hover:opacity-90"
            style={{ 
              backgroundColor: '#ffc299', 
              color: '#1e3a8a',
              boxShadow: '0 2px 8px rgba(255, 194, 153, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 194, 153, 0.5)'
            }}
          >
            <Plus className="mr-2 h-6 w-6" />
            Add User
          </Link>
        </div>
      ) : (
        <div className="cc-surface overflow-hidden">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-white/60">
                  Account ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-white/60">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-white/60">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-white/60">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-white/60">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-white/60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="whitespace-nowrap px-6 py-5 text-base font-mono text-white">
                    {user.accountId || user.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-base text-white">
                    {user.name || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-base text-white/70">
                    {user.email || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-base text-white/70">
                    {user.phone || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-base text-white/70">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/users/${user.id}`}
                        className="transition hover:opacity-70"
                        style={{ color: '#b3e8f0' }}
                        title="View details"
                      >
                        <Eye className="h-6 w-6" />
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="text-red-300 hover:text-red-200"
                        title="Delete user"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

