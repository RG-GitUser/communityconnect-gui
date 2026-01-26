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
        className="inline-flex items-center text-sm text-white/80 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-white drop-shadow-md">Add New User</h1>
        <p className="mt-2 text-base text-white/80 drop-shadow-sm">
          Create a new user account in the system
        </p>
      </div>

      <form onSubmit={handleSubmit} className="cc-surface space-y-6 p-8">
        {error && (
          <div className="rounded-md bg-red-500/20 border border-red-500/30 p-4">
            <div className="text-sm text-white">{error}</div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-base font-medium text-white/80">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="cc-input mt-2 block w-full rounded-lg shadow-sm text-base px-4 py-3 focus:ring-2 focus:ring-offset-2 transition"
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
          <label htmlFor="email" className="block text-base font-medium text-white/80">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="cc-input mt-2 block w-full rounded-lg shadow-sm text-base px-4 py-3 focus:ring-2 focus:ring-offset-2 transition"
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
          <label htmlFor="phone" className="block text-base font-medium text-white/80">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="cc-input mt-2 block w-full rounded-lg shadow-sm text-base px-4 py-3 focus:ring-2 focus:ring-offset-2 transition"
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
          <label htmlFor="accountId" className="block text-base font-medium text-white/80">
            Account ID
          </label>
          <input
            type="text"
            name="accountId"
            id="accountId"
            value={formData.accountId}
            onChange={handleChange}
            className="cc-input mt-2 block w-full rounded-lg shadow-sm text-base px-4 py-3 focus:ring-2 focus:ring-offset-2 transition"
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
            className="rounded-lg bg-white/10 px-6 py-3 text-base font-semibold text-white shadow-sm border border-white/20 transition hover:bg-white/15"
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

