'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/lib/firebase'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accountId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createUser(formData)
      router.push('/users')
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/users"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-gray-900">Add New User</h1>
        <p className="mt-2 text-base text-gray-600">
          Create a new user account in the system
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-base font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm text-base px-4 py-3 text-gray-900 focus:ring-2 focus:ring-offset-2 transition"
            style={{ 
              borderColor: '#b3e8f080',
              '--tw-ring-color': '#b3e8f080'
            } as React.CSSProperties}
            onFocus={(e) => {
              e.target.style.borderColor = '#b3e8f0';
              e.target.style.boxShadow = '0 0 0 3px rgba(92, 225, 230, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '';
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-base font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm text-base px-4 py-3 text-gray-900 focus:ring-2 focus:ring-offset-2 transition"
            style={{ 
              borderColor: '#ffc29980',
              '--tw-ring-color': '#ffc29980'
            } as React.CSSProperties}
            onFocus={(e) => {
              e.target.style.borderColor = '#ffc299';
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 194, 153, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '';
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-base font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm text-base px-4 py-3 text-gray-900 focus:ring-2 focus:ring-offset-2 transition"
            style={{ 
              borderColor: '#ffeaa780',
              '--tw-ring-color': '#ffeaa780'
            } as React.CSSProperties}
            onFocus={(e) => {
              e.target.style.borderColor = '#ffeaa7';
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 234, 167, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '';
            }}
          />
        </div>

        <div>
          <label htmlFor="accountId" className="block text-base font-medium text-gray-700">
            Account ID
          </label>
          <input
            type="text"
            name="accountId"
            id="accountId"
            value={formData.accountId}
            onChange={handleChange}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm text-base px-4 py-3 text-gray-900 focus:ring-2 focus:ring-offset-2 transition"
            style={{ 
              borderColor: '#b3e8f080',
              '--tw-ring-color': '#b3e8f080'
            } as React.CSSProperties}
            onFocus={(e) => {
              e.target.style.borderColor = '#b3e8f0';
              e.target.style.boxShadow = '0 0 0 3px rgba(92, 225, 230, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '';
            }}
            placeholder="Optional - will be auto-generated if not provided"
          />
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/users"
            className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ 
              backgroundColor: '#ffc299', 
              color: '#1e3a8a',
              boxShadow: '0 2px 8px rgba(255, 194, 153, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 194, 153, 0.5)'
            }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}

