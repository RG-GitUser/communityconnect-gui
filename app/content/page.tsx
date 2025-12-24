'use client'

import { useEffect, useState } from 'react'
import { getNews, createNews, updateNews, deleteNews, type News } from '@/lib/firebase'
import { getBusinesses, createBusiness, updateBusiness, deleteBusiness, type Business } from '@/lib/firebase'
import { getResources, createResource, updateResource, deleteResource, type Resource } from '@/lib/firebase'
import { Newspaper, Building2, BookOpen, Plus, Edit, Trash2, X, Save } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

type TabType = 'news' | 'businesses' | 'resources'

export default function ContentPage() {
  const { community } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('news')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // News state
  const [news, setNews] = useState<News[]>([])
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [showNewsForm, setShowNewsForm] = useState(false)
  
  // Business state
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [showBusinessForm, setShowBusinessForm] = useState(false)
  
  // Resource state
  const [resources, setResources] = useState<Resource[]>([])
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [showResourceForm, setShowResourceForm] = useState(false)

  useEffect(() => {
    if (community) {
      fetchData()
    }
  }, [activeTab, community])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Always filter by the logged-in community
      if (activeTab === 'news') {
        const newsData = await getNews(community || undefined)
        setNews(newsData)
      } else if (activeTab === 'businesses') {
        const businessesData = await getBusinesses(community || undefined)
        setBusinesses(businessesData)
      } else if (activeTab === 'resources') {
        const resourcesData = await getResources(community || undefined)
        setResources(resourcesData)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // News handlers
  const handleCreateNews = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newsData: Omit<News, 'id' | 'createdAt'> = {
      community: community || undefined, // Always use logged-in community
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      date: formData.get('date') as string || new Date().toISOString().split('T')[0],
      category: formData.get('category') as string || undefined,
    }
    
    try {
      if (editingNews) {
        await updateNews(editingNews.id, newsData)
      } else {
        await createNews(newsData)
      }
      setShowNewsForm(false)
      setEditingNews(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to save news')
    }
  }

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return
    try {
      await deleteNews(id)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete news')
    }
  }

  // Business handlers
  const handleCreateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const businessData: Omit<Business, 'id' | 'createdAt'> = {
      community: community || undefined, // Always use logged-in community
      name: (formData.get('name') as string).trim(),
      category: (formData.get('category') as string || '').trim() || undefined,
      description: (formData.get('description') as string || '').trim() || undefined,
      address: (formData.get('address') as string || '').trim() || undefined,
      phone: (formData.get('phone') as string || '').trim() || undefined,
      hours: (formData.get('hours') as string || '').trim() || undefined,
      website: (formData.get('website') as string || '').trim() || undefined,
    }
    
    try {
      if (editingBusiness) {
        await updateBusiness(editingBusiness.id, businessData)
      } else {
        await createBusiness(businessData)
      }
      setShowBusinessForm(false)
      setEditingBusiness(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to save business')
    }
  }

  const handleDeleteBusiness = async (id: string) => {
    if (!confirm('Are you sure you want to delete this business?')) return
    try {
      await deleteBusiness(id)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete business')
    }
  }

  // Resource handlers
  const handleCreateResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const resourceData: Omit<Resource, 'id' | 'createdAt'> = {
      community: community || undefined, // Always use logged-in community
      name: formData.get('name') as string,
      category: 'Community Resources', // Always set to Community Resources
      subCategory: formData.get('subCategory') as string || undefined,
      description: formData.get('description') as string || undefined,
      contacts: [], // Will be handled separately if needed
    }
    
    try {
      if (editingResource) {
        await updateResource(editingResource.id, resourceData)
      } else {
        await createResource(resourceData)
      }
      setShowResourceForm(false)
      setEditingResource(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to save resource')
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    try {
      await deleteResource(id)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete resource')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Create Content</h1>
        <p className="mt-2 text-base text-gray-600">
          Manage News, Businesses, and Resources for {community}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'news' as TabType, name: 'News', icon: Newspaper },
            { id: 'businesses' as TabType, name: 'Businesses', icon: Building2 },
            { id: 'resources' as TabType, name: 'Resources', icon: BookOpen },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            const accentColors = ['#b3e8f0', '#ffc299', '#ffeaa7']
            const accentColor = accentColors[tab.id === 'news' ? 0 : tab.id === 'businesses' ? 1 : 2]
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setShowNewsForm(false)
                  setShowBusinessForm(false)
                  setShowResourceForm(false)
                  setEditingNews(null)
                  setEditingBusiness(null)
                  setEditingResource(null)
                }}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-base font-medium transition ${
                  isActive
                    ? 'border-current'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                style={isActive ? { color: accentColor, borderColor: accentColor } : {}}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">News Articles</h2>
            <button
              onClick={() => {
                setShowNewsForm(true)
                setEditingNews(null)
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
              Add News
            </button>
          </div>

          {showNewsForm && (
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingNews ? 'Edit News' : 'Create News'}
                </h3>
                <button
                  onClick={() => {
                    setShowNewsForm(false)
                    setEditingNews(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateNews} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community
                  </label>
                  <input
                    type="text"
                    name="community"
                    value={community || ''}
                    disabled
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-500 bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">This is automatically set to your community</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingNews?.title || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="e.g., River of Fire Market Grand Opening"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingNews?.date ? editingNews.date.split('T')[0] : new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingNews?.category || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                  >
                    <option value="">Select a category</option>
                    <option value="Community News">Community News</option>
                    <option value="Announcements">Announcements</option>
                    <option value="Events">Events</option>
                    <option value="Updates">Updates</option>
                    <option value="General">General</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">This category determines where the news appears in the main app</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    name="content"
                    required
                    rows={6}
                    defaultValue={editingNews?.content || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="Enter news content..."
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
                    {editingNews ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewsForm(false)
                      setEditingNews(null)
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

          <div className="space-y-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
                style={{ borderLeft: '4px solid #b3e8f080' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                      {item.category && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      )}
                      {item.community && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {item.community}
                        </span>
                      )}
                    </div>
                    {item.date && (
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                    <p className="text-base text-gray-700 whitespace-pre-wrap">{item.content}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingNews(item)
                        setShowNewsForm(true)
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {news.length === 0 && !showNewsForm && (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
                <Newspaper className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-semibold text-gray-900">No news articles</h3>
                <p className="mt-2 text-sm text-gray-500">Get started by creating a news article.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Businesses Tab */}
      {activeTab === 'businesses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Businesses</h2>
            <button
              onClick={() => {
                setShowBusinessForm(true)
                setEditingBusiness(null)
              }}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
              style={{ 
                backgroundColor: '#ffc299', 
                color: '#1e3a8a',
                boxShadow: '0 2px 8px rgba(255, 194, 153, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 194, 153, 0.5)'
              }}
            >
              <Plus className="h-5 w-5" />
              Add Business
            </button>
          </div>


          {showBusinessForm && (
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingBusiness ? 'Edit Business' : 'Create Business'}
                </h3>
                <button
                  onClick={() => {
                    setShowBusinessForm(false)
                    setEditingBusiness(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community
                  </label>
                  <input
                    type="text"
                    name="community"
                    value={community || ''}
                    disabled
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-500 bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">This is automatically set to your community</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingBusiness?.name || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="e.g., River of Fire Market"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingBusiness?.category || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                  >
                    <option value="">Select a category</option>
                    <option value="Retail">Retail</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Services">Services</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Construction">Construction</option>
                    <option value="Other">Other</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">This category determines where the business appears in the main app</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={editingBusiness?.description || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="Business description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingBusiness?.address || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="e.g., Elsipogtog First Nation, New Brunswick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingBusiness?.phone || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="e.g., (506) 523-7186"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours
                  </label>
                  <input
                    type="text"
                    name="hours"
                    defaultValue={editingBusiness?.hours || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="e.g., Sunday: 9:00 AM - 5:00 PM | Monday - Tuesday: 8:00 AM - 5:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    defaultValue={editingBusiness?.website || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
                    style={{ 
                      backgroundColor: '#ffc299', 
                      color: '#1e3a8a',
                      boxShadow: '0 2px 8px rgba(255, 194, 153, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 194, 153, 0.5)'
                    }}
                  >
                    <Save className="h-5 w-5" />
                    {editingBusiness ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBusinessForm(false)
                      setEditingBusiness(null)
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

          <div className="space-y-4">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
                style={{ borderLeft: '4px solid #ffc29980' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
                      {business.category && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {business.category}
                        </span>
                      )}
                      {business.community && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {business.community}
                        </span>
                      )}
                    </div>
                    {business.description && (
                      <p className="text-base text-gray-700 mb-3">{business.description}</p>
                    )}
                    <div className="space-y-1 text-sm text-gray-600">
                      {business.address && <p><strong>Address:</strong> {business.address}</p>}
                      {business.phone && <p><strong>Phone:</strong> {business.phone}</p>}
                      {business.hours && <p><strong>Hours:</strong> {business.hours}</p>}
                      {business.website && (
                        <p>
                          <strong>Website:</strong>{' '}
                          <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {business.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingBusiness(business)
                        setShowBusinessForm(true)
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBusiness(business.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {businesses.length === 0 && !showBusinessForm && (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-semibold text-gray-900">No businesses</h3>
                <p className="mt-2 text-sm text-gray-500">Get started by adding a business.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Resources</h2>
            <button
              onClick={() => {
                setShowResourceForm(true)
                setEditingResource(null)
              }}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
              style={{ 
                backgroundColor: '#ffeaa7', 
                color: '#1e3a8a',
                boxShadow: '0 2px 8px rgba(255, 234, 167, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 234, 167, 0.5)'
              }}
            >
              <Plus className="h-5 w-5" />
              Add Resource
            </button>
          </div>

          {showResourceForm && (
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingResource ? 'Edit Resource' : 'Create Resource'}
                </h3>
                <button
                  onClick={() => {
                    setShowResourceForm(false)
                    setEditingResource(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateResource} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community
                  </label>
                  <input
                    type="text"
                    name="community"
                    value={community || ''}
                    disabled
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-500 bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">This is automatically set to your community</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingResource?.name || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="e.g., Chief & Council"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Category *
                  </label>
                  <select
                    name="subCategory"
                    required
                    defaultValue={editingResource?.subCategory || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                  >
                    <option value="">Select a sub-category</option>
                    <option value="Chief & Council">Chief & Council</option>
                    <option value="Elsipogtog Health Centre">Elsipogtog Health Centre</option>
                    <option value="Economic Development">Economic Development</option>
                    <option value="Events Calendar">Events Calendar</option>
                    <option value="Other Departments">Other Departments</option>
                    <option value="Contact Information">Contact Information</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Resources are automatically categorized under "Community Resources" in the main app</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={editingResource?.description || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
                    placeholder="Resource description..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
                    style={{ 
                      backgroundColor: '#ffeaa7', 
                      color: '#1e3a8a',
                      boxShadow: '0 2px 8px rgba(255, 234, 167, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 234, 167, 0.5)'
                    }}
                  >
                    <Save className="h-5 w-5" />
                    {editingResource ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResourceForm(false)
                      setEditingResource(null)
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

          <div className="space-y-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
                style={{ borderLeft: '4px solid #ffeaa780' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{resource.name}</h3>
                      {resource.category && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                          {resource.category}
                        </span>
                      )}
                      {resource.subCategory && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-yellow-200 text-yellow-900">
                          {resource.subCategory}
                        </span>
                      )}
                      {resource.community && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {resource.community}
                        </span>
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-base text-gray-700 mb-3">{resource.description}</p>
                    )}
                    {resource.contacts && resource.contacts.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">Contacts:</h4>
                        {resource.contacts.map((contact, idx) => (
                          <div key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                            {contact.name && <p><strong>{contact.name}</strong> {contact.role && `- ${contact.role}`}</p>}
                            {contact.email && <p>Email: {contact.email}</p>}
                            {contact.phone && <p>Phone: {contact.phone}</p>}
                            {contact.office && <p>Office: {contact.office}</p>}
                            {contact.fax && <p>Fax: {contact.fax}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingResource(resource)
                        setShowResourceForm(true)
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {resources.length === 0 && !showResourceForm && (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-semibold text-gray-900">No resources</h3>
                <p className="mt-2 text-sm text-gray-500">Get started by adding a resource.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

