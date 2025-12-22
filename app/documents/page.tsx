'use client'

import { useEffect, useState } from 'react'
import { getDocuments, getUsers, getDocumentCategories, getDocumentFileUrl, type Document, type User } from '@/lib/firebase'
import { FileText, Filter, X, Download, ExternalLink, Folder, ChevronDown, ChevronRight } from 'lucide-react'

// Folder order - documents will be displayed in this order
const FOLDER_ORDER = [
  'Education',
  'Elder Care',
  'Housing',
  "Jordan's Principle",
  'Other',
  'Social Assistance',
  'Status Cards',
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileUrls, setFileUrls] = useState<Record<string, string | null>>({})
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({})
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Always fetch all documents, we'll group them by category
        const [docsData, usersData] = await Promise.all([
          getDocuments(),
          getUsers(),
        ])
        
        // Filter by selected category if one is selected
        const filteredDocs = selectedCategory 
          ? docsData.filter(doc => doc.category === selectedCategory)
          : docsData
        
        setDocuments(filteredDocs)
        setUsers(usersData)
        
        // Fetch file URLs for documents that have file references
        const fileUrlPromises = filteredDocs.map(async (doc) => {
          const hasFile = doc.filePath || doc.storagePath || doc.fileUrl || doc.file || doc.downloadUrl
          if (hasFile) {
            setLoadingFiles(prev => ({ ...prev, [doc.id]: true }))
            const url = await getDocumentFileUrl(doc.id)
            setFileUrls(prev => ({ ...prev, [doc.id]: url }))
            setLoadingFiles(prev => ({ ...prev, [doc.id]: false }))
          }
        })
        await Promise.all(fileUrlPromises)
        
        // Expand all folders by default (including all FOLDER_ORDER categories)
        const expanded: Record<string, boolean> = {}
        FOLDER_ORDER.forEach(cat => {
          expanded[cat] = true
        })
        // Also expand any other categories that have documents
        filteredDocs.forEach(doc => {
          const cat = doc.category || 'Other'
          if (!expanded[cat]) {
            expanded[cat] = true
          }
        })
        setExpandedFolders(expanded)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch documents')
        console.error('Error fetching documents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCategory])

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unknown User'
    const user = users.find(u => u.id === userId)
    return user?.name || user?.email || 'Unknown User'
  }

  const getUserAccountId = (userId?: string) => {
    if (!userId) return 'N/A'
    const user = users.find(u => u.id === userId)
    return user?.accountId || user?.id || 'N/A'
  }

  // Group documents by category
  const groupedDocuments = documents.reduce((acc, doc) => {
    // Map uncategorized documents to "Other"
    const category = doc.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  // Initialize all FOLDER_ORDER categories (even if empty)
  FOLDER_ORDER.forEach(cat => {
    if (!groupedDocuments[cat]) {
      groupedDocuments[cat] = []
    }
  })

  // Sort folders according to FOLDER_ORDER, then add any other categories at the end
  const sortedCategories = [
    ...FOLDER_ORDER,
    ...Object.keys(groupedDocuments).filter(cat => !FOLDER_ORDER.includes(cat)).sort()
  ]

  const toggleFolder = (category: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getCategoryColor = (category: string, index: number) => {
    const colors = ['#b3e8f0', '#ffc299', '#ffeaa7']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading documents...</div>
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

  const categories = Array.from(new Set([
    ...FOLDER_ORDER,
    ...documents.map(d => d.category).filter(Boolean) as string[]
  ])).sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Documentation Submissions</h1>
        <p className="mt-2 text-base text-gray-600">
          View all documentation submissions by category
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter by category:</span>
        <button
          onClick={() => setSelectedCategory('')}
          className={`rounded-full px-4 py-2 text-base font-medium transition ${
            selectedCategory === ''
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={selectedCategory === '' ? { 
            backgroundColor: '#ffc29980',
            boxShadow: '0 2px 6px rgba(255, 194, 153, 0.2), 0 1px 2px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 194, 153, 0.3)'
          } : {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(209, 213, 219, 0.3)'
          }}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-base font-medium transition ${
              selectedCategory === category
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedCategory === category ? { 
              backgroundColor: '#b3e8f080',
              boxShadow: '0 2px 6px rgba(179, 232, 240, 0.2), 0 1px 2px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(179, 232, 240, 0.3)'
            } : {
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(209, 213, 219, 0.3)'
            }}
          >
            {category}
          </button>
        ))}
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory('')}
            className="ml-2 flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
            style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(209, 213, 219, 0.3)'
            }}
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-6">
        {sortedCategories.map((category, index) => {
          const docs = groupedDocuments[category] || []
          const isExpanded = expandedFolders[category] ?? true
          const categoryColor = getCategoryColor(category, index)
          
          // Skip empty folders if filtering by category
          if (selectedCategory && category !== selectedCategory) {
            return null
          }
            
            return (
              <div
                key={category}
                className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden"
                style={{ borderTop: `4px solid ${categoryColor}80` }}
              >
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(category)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <Folder className="h-6 w-6" style={{ color: categoryColor }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {docs.length} document{docs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Folder Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4">
                    {docs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm">No documents in this category</p>
                      </div>
                    ) : (
                      docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-lg bg-gray-50 p-6 border border-gray-200 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {doc.title || 'Untitled Document'}
                              </h3>
                              {doc.status && (
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {doc.status}
                                </span>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-base text-gray-700 mb-4">{doc.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                              <span>
                                <strong>User:</strong> {getUserName(doc.userId)}
                              </span>
                              <span className="font-mono text-xs">
                                <strong>Account ID:</strong> {getUserAccountId(doc.userId)}
                              </span>
                              {doc.createdAt && (
                                <span>
                                  <strong>Submitted:</strong> {new Date(doc.createdAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            
                            {/* File download section */}
                            {(doc.filePath || doc.storagePath || doc.fileUrl || doc.file || doc.downloadUrl) && (
                              <div className="pt-4 border-t border-gray-200">
                                {loadingFiles[doc.id] ? (
                                  <div className="text-sm text-gray-500">Loading file...</div>
                                ) : fileUrls[doc.id] ? (
                                  <a
                                    href={fileUrls[doc.id]!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
                                    style={{ 
                                      backgroundColor: '#ffc299', 
                                      color: '#1e3a8a',
                                      boxShadow: '0 2px 8px rgba(255, 194, 153, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                                      border: '1px solid rgba(255, 194, 153, 0.5)'
                                    }}
                                  >
                                    <Download className="h-5 w-5" />
                                    View/Download File
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    File not available (may need to check file path in Firebase)
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

