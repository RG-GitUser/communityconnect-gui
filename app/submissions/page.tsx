'use client'

import { useEffect, useState } from 'react'
import { getDocuments, getUsers, updateDocument, type Document, type User } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import { FileText, User as UserIcon, Calendar, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
]

export default function SubmissionsPage() {
  const { community } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [updatingDocs, setUpdatingDocs] = useState<Set<string>>(new Set())
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      if (!community) return
      
      try {
        setLoading(true)
        setError(null)
        const [docsData, usersData] = await Promise.all([
          getDocuments(undefined, community),
          getUsers(community),
        ])
        
        // Sort by createdAt (newest first)
        docsData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        
        setDocuments(docsData)
        setUsers(usersData)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch submissions')
        console.error('Error fetching submissions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [community])

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unknown User'
    const user = users.find(u => u.id === userId)
    return user?.name || user?.displayName || user?.email || 'Unknown User'
  }

  const getUserEmail = (userId?: string) => {
    if (!userId) return ''
    const user = users.find(u => u.id === userId)
    return user?.email || ''
  }

  const handleUpdateStatus = async (docId: string, newStatus: string) => {
    try {
      setUpdatingDocs(prev => new Set(prev).add(docId))
      await updateDocument(docId, { status: newStatus })
      
      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: newStatus } : doc
      ))
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setUpdatingDocs(prev => {
        const newSet = new Set(prev)
        newSet.delete(docId)
        return newSet
      })
    }
  }

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Status filter
    if (statusFilter !== 'all') {
      const docStatus = doc.status || 'pending'
      if (docStatus !== statusFilter) return false
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      const docCategory = doc.category || 'Other'
      if (docCategory !== categoryFilter) return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const title = (doc.title || doc.name || doc.fileName || '').toLowerCase()
      const description = (doc.description || '').toLowerCase()
      const userName = getUserName(doc.userId).toLowerCase()
      const userEmail = getUserEmail(doc.userId).toLowerCase()
      
      if (!title.includes(query) && 
          !description.includes(query) && 
          !userName.includes(query) && 
          !userEmail.includes(query)) {
        return false
      }
    }
    
    return true
  })

  // Get unique categories
  const categories = Array.from(new Set(documents.map(doc => doc.category || 'Other'))).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading submissions...</div>
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
        <h1 className="text-4xl font-bold text-gray-900">Track Submissions</h1>
        <p className="mt-2 text-base text-gray-600">
          Monitor and manage user-submitted documents and applications
        </p>
        {community && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800">
            <span>Viewing submissions for:</span>
            <span className="font-semibold">{community}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, description, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <div className="text-sm font-medium text-gray-500">Total Submissions</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{documents.length}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">
            {documents.filter(d => (d.status || 'pending') === 'pending').length}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {documents.filter(d => d.status === 'approved').length}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <div className="text-sm font-medium text-gray-500">Rejected</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {documents.filter(d => d.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Submissions ({filteredDocuments.length})
          </h2>
        </div>
        
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No submissions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((doc) => {
              const StatusIcon = STATUS_OPTIONS.find(opt => opt.value === (doc.status || 'pending'))?.icon || Clock
              const statusColor = STATUS_OPTIONS.find(opt => opt.value === (doc.status || 'pending'))?.color || 'bg-yellow-100 text-yellow-800'
              
              return (
                <div key={doc.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {doc.submissionId && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                            {doc.submissionId}
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {doc.title || doc.name || doc.fileName || doc.description?.substring(0, 50) || `Document ${doc.id.substring(0, 8)}`}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${
                          doc.status === 'approved' 
                            ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md shadow-green-200/50' :
                          doc.status === 'rejected' 
                            ? 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-md shadow-red-200/50' :
                          'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200/50'
                        }`}>
                          <StatusIcon className="h-4 w-4" />
                          {STATUS_OPTIONS.find(opt => opt.value === (doc.status || 'pending'))?.label || 'Pending'}
                        </span>
                        {doc.category && (
                          <span className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                            {doc.category}
                          </span>
                        )}
                      </div>
                      
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-base text-gray-500">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          <span><strong>User:</strong> {getUserName(doc.userId)}</span>
                          {getUserEmail(doc.userId) && (
                            <span className="text-base text-gray-600 font-medium">({getUserEmail(doc.userId)})</span>
                          )}
                        </div>
                        {doc.createdAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <span><strong>Submitted:</strong> {new Date(doc.createdAt).toLocaleDateString()} {new Date(doc.createdAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Update Status
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdowns(prev => {
                            const newSet = new Set(prev)
                            if (newSet.has(doc.id)) {
                              newSet.delete(doc.id)
                            } else {
                              newSet.add(doc.id)
                            }
                            return newSet
                          })}
                          disabled={updatingDocs.has(doc.id)}
                          className={`rounded-full px-5 py-2.5 text-base font-medium border-0 transition-all duration-200 flex items-center gap-2 ${
                            doc.status === 'approved' 
                              ? 'bg-green-100 text-green-900 hover:bg-green-200' :
                            doc.status === 'rejected' 
                              ? 'bg-red-100 text-red-900 hover:bg-red-200' :
                            'bg-yellow-100 text-yellow-900 hover:bg-yellow-200'
                          } disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1`}
                        >
                          <span>{doc.status === 'approved' ? 'Approved' : doc.status === 'rejected' ? 'Rejected' : 'Pending'}</span>
                          <svg className={`h-4 w-4 ${doc.status === 'approved' ? 'text-green-700' : doc.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openDropdowns.has(doc.id) && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdowns(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(doc.id)
                                return newSet
                              })}
                            />
                            <div className="absolute right-0 mt-2 z-20 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-[140px]">
                              <button
                                onClick={() => {
                                  handleUpdateStatus(doc.id, 'pending')
                                  setOpenDropdowns(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(doc.id)
                                    return newSet
                                  })
                                }}
                                className={`w-full text-left px-4 py-2.5 text-base font-medium rounded-full mx-2 my-1 transition ${
                                  doc.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-900' 
                                    : 'hover:bg-yellow-50 text-gray-700'
                                }`}
                              >
                                Pending
                              </button>
                              <button
                                onClick={() => {
                                  handleUpdateStatus(doc.id, 'approved')
                                  setOpenDropdowns(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(doc.id)
                                    return newSet
                                  })
                                }}
                                className={`w-full text-left px-4 py-2.5 text-base font-medium rounded-full mx-2 my-1 transition ${
                                  doc.status === 'approved' 
                                    ? 'bg-green-100 text-green-900' 
                                    : 'hover:bg-green-50 text-gray-700'
                                }`}
                              >
                                Approved
                              </button>
                              <button
                                onClick={() => {
                                  handleUpdateStatus(doc.id, 'rejected')
                                  setOpenDropdowns(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(doc.id)
                                    return newSet
                                  })
                                }}
                                className={`w-full text-left px-4 py-2.5 text-base font-medium rounded-full mx-2 my-1 transition ${
                                  doc.status === 'rejected' 
                                    ? 'bg-red-100 text-red-900' 
                                    : 'hover:bg-red-50 text-gray-700'
                                }`}
                              >
                                Rejected
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      {updatingDocs.has(doc.id) && (
                        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                          <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                          Updating...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

