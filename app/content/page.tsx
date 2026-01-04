'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPost, createNews, createBusiness, createResource, type Post, type News, type Business, type Resource } from '@/lib/firebase'
import { MessageSquare, Newspaper, Building2, BookOpen, Plus, X, Save } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

type ContentType = 'post' | 'news' | 'business' | 'resource'

export default function ContentPage() {
  const router = useRouter()
  const { community } = useAuth()
  const [activeTab, setActiveTab] = useState<ContentType>('post')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const postCategories = [
    'News',
    'Events',
    'Announcements',
    'Community',
    'Business',
    'Resources',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      switch (activeTab) {
        case 'post': {
          const postData: Omit<Post, 'id' | 'createdAt'> = {
            title: formData.get('title') as string || '',
            content: formData.get('content') as string || '',
            category: formData.get('category') as string || undefined,
            community: community || undefined,
            userId: formData.get('userId') as string || undefined,
            userAccountId: formData.get('userAccountId') as string || undefined,
          }
          await createPost(postData)
          setSuccess('Post created successfully!')
          break
        }
        case 'news': {
          const newsData: Omit<News, 'id' | 'createdAt'> = {
            title: formData.get('title') as string || '',
            content: formData.get('content') as string || '',
            date: formData.get('date') as string || new Date().toISOString(),
            category: formData.get('category') as string || undefined,
            community: community || undefined,
          }
          await createNews(newsData)
          setSuccess('News article created successfully!')
          break
        }
        case 'business': {
          const businessData: Omit<Business, 'id' | 'createdAt'> = {
            name: formData.get('name') as string || '',
            description: formData.get('description') as string || undefined,
            category: formData.get('category') as string || undefined,
            address: formData.get('address') as string || undefined,
            phone: formData.get('phone') as string || undefined,
            hours: formData.get('hours') as string || undefined,
            website: formData.get('website') as string || undefined,
            community: community || undefined,
          }
          await createBusiness(businessData)
          setSuccess('Business created successfully!')
          break
        }
        case 'resource': {
          const resourceData: Omit<Resource, 'id' | 'createdAt'> = {
            name: formData.get('name') as string || '',
            description: formData.get('description') as string || undefined,
            category: formData.get('category') as string || undefined,
            subCategory: formData.get('subCategory') as string || undefined,
            community: community || undefined,
          }
          await createResource(resourceData)
          setSuccess('Resource created successfully!')
          break
        }
      }

      // Reset form
      e.currentTarget.reset()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create content')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'post' as ContentType, name: 'Post', icon: MessageSquare, color: '#4dd0e1' },
    { id: 'news' as ContentType, name: 'News', icon: Newspaper, color: '#ff8c42' },
    { id: 'business' as ContentType, name: 'Business', icon: Building2, color: '#ffb300' },
    { id: 'resource' as ContentType, name: 'Resource', icon: BookOpen, color: '#4dd0e1' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Create Content</h1>
        <p className="mt-2 text-base text-gray-600">
          Create posts, news articles, businesses, and resources for your community
        </p>
        {community && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800">
            <span>Creating content for:</span>
            <span className="font-semibold">{community}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setError(null)
                  setSuccess(null)
                }}
                className={`
                  flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium transition
                  ${isActive
                    ? 'text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
                style={isActive ? { borderBottomColor: tab.color } : {}}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}

      {/* Form */}
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Form */}
          {activeTab === 'post' && (
            <>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                >
                  <option value="">Select a category</option>
                  {postCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                  placeholder="Post title..."
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  required
                  rows={8}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                  placeholder="Post content..."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    User ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="userId"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                    placeholder="Leave empty for admin posts"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    User Account ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="userAccountId"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                    placeholder="User account ID"
                  />
                </div>
              </div>
            </>
          )}

          {/* News Form */}
          {activeTab === 'news' && (
            <>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ff8c42] focus:ring-offset-2"
                  placeholder="News article title..."
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  required
                  rows={8}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ff8c42] focus:ring-offset-2"
                  placeholder="News article content..."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ff8c42] focus:ring-offset-2"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    name="category"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ff8c42] focus:ring-offset-2"
                    placeholder="e.g., Community, Events"
                  />
                </div>
              </div>
            </>
          )}

          {/* Business Form */}
          {activeTab === 'business' && (
            <>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ffb300] focus:ring-offset-2"
                  placeholder="Business name..."
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ffb300] focus:ring-offset-2"
                  placeholder="Business description..."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    name="category"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ffb300] focus:ring-offset-2"
                    placeholder="e.g., Restaurant, Retail"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ffb300] focus:ring-offset-2"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  name="address"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ffb300] focus:ring-offset-2"
                  placeholder="Business address"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Hours (Optional)
                  </label>
                  <input
                    type="text"
                    name="hours"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ffb300] focus:ring-offset-2"
                    placeholder="e.g., Mon-Fri 9am-5pm"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#ffb300] focus:ring-offset-2"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Resource Form */}
          {activeTab === 'resource' && (
            <>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Resource Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                  placeholder="Resource name..."
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                  placeholder="Resource description..."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    name="category"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                    placeholder="e.g., Health, Education"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Sub-Category (Optional)
                  </label>
                  <input
                    type="text"
                    name="subCategory"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-[#4dd0e1] focus:ring-offset-2"
                    placeholder="Sub-category"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ 
                backgroundColor: tabs.find(t => t.id === activeTab)?.color || '#4dd0e1',
                boxShadow: `0 2px 8px ${tabs.find(t => t.id === activeTab)?.color || '#4dd0e1'}40, 0 1px 3px rgba(0, 0, 0, 0.1)`,
                border: `1px solid ${tabs.find(t => t.id === activeTab)?.color || '#4dd0e1'}80`
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create {tabs.find(t => t.id === activeTab)?.name}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

