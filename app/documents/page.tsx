'use client'

import { useEffect, useState } from 'react'
import { getDocuments, getUsers, getDocumentCategories, getDocumentFileUrl, type Document, type User } from '@/lib/firebase'
import { FileText, Filter, X, Download, ExternalLink } from 'lucide-react'

const CATEGORIES = [
  'Social Assistance',
  'Housing',
  'Elder Care',
  'Education Funding',
  'Status Card Update',
  "Jordan's Principle",
  'Other',
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileUrls, setFileUrls] = useState<Record<string, string | null>>({})
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [docsData, usersData] = await Promise.all([
          getDocuments(selectedCategory || undefined),
          getUsers(),
        ])
        setDocuments(docsData)
        setUsers(usersData)
        
        // Fetch file URLs for documents that have file references
        const fileUrlPromises = docsData.map(async (doc) => {
          const hasFile = doc.filePath || doc.storagePath || doc.fileUrl || doc.file || doc.downloadUrl
          if (hasFile) {
            setLoadingFiles(prev => ({ ...prev, [doc.id]: true }))
            const url = await getDocumentFileUrl(doc.id)
            setFileUrls(prev => ({ ...prev, [doc.id]: url }))
            setLoadingFiles(prev => ({ ...prev, [doc.id]: false }))
          }
        })
        await Promise.all(fileUrlPromises)
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
    ...CATEGORIES,
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
          style={selectedCategory === '' ? { backgroundColor: '#ff751f80' } : {}}
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
            style={selectedCategory === category ? { backgroundColor: '#5ce1e680' } : {}}
          >
            {category}
          </button>
        ))}
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory('')}
            className="ml-2 flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {selectedCategory && (
        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Showing {documents.length} document{documents.length !== 1 ? 's' : ''} in{' '}
            <strong>{selectedCategory}</strong>
          </p>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No documents found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {selectedCategory
              ? `No documents found in the "${selectedCategory}" category.`
              : 'No documentation submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-900/5"
              style={{ borderLeft: '4px solid #ffde5980' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {doc.title || 'Untitled Document'}
                    </h3>
                    {doc.category && (
                      <span className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
                        style={{ backgroundColor: '#ffde5980' }}
                      >
                        {doc.category}
                      </span>
                    )}
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
                    <p className="mt-3 text-base text-gray-700">{doc.description}</p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-base text-gray-500">
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
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {loadingFiles[doc.id] ? (
                        <div className="text-sm text-gray-500">Loading file...</div>
                      ) : fileUrls[doc.id] ? (
                        <a
                          href={fileUrls[doc.id]!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
                          style={{ backgroundColor: '#ff751f' }}
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
          ))}
        </div>
      )}
    </div>
  )
}

