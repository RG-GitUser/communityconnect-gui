'use client'

import { useEffect, useState } from 'react'
import { getDocuments, getUsers, getDocumentCategories, getDocumentFileUrl, updateDocument, deleteDocument, type Document, type User } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import { FileText, Filter, X, Download, ExternalLink, Folder, ChevronDown, ChevronRight, Trash2, Share2, Eye, Edit, User as UserIcon, Calendar, Search, Mail, MessageSquare, Save, FileJson, FileDown, Archive } from 'lucide-react'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'

// Folder order - documents will be displayed in this order
const FOLDER_ORDER = [
  'Education',
  'Elder Care',
  'Housing',
  'Income Assistance',
  "Jordan's Principle",
  'Social Assistance',
  'Status Cards',
  'Other',
]

// Category to submission ID prefix mapping
const CATEGORY_PREFIXES: Record<string, string> = {
  'Education': 'E',
  'Elder Care': 'EC',
  'Housing': 'H',
  'Income Assistance': 'I',
  "Jordan's Principle": 'J',
  'Social Assistance': 'S',
  'Status Cards': 'SC',
  'Other': 'O',
}

// Function to get category prefix
const getCategoryPrefix = (category: string): string => {
  return CATEGORY_PREFIXES[category] || 'O'
}

// Function to generate submission ID for a document
const generateSubmissionId = (documents: Document[], category: string): string => {
  const prefix = getCategoryPrefix(category)
  const categoryDocs = documents
    .filter(doc => doc.category === category && doc.submissionId)
    .map(doc => {
      const match = doc.submissionId?.match(new RegExp(`^${prefix}(\\d+)$`))
      return match ? parseInt(match[1], 10) : 0
    })
    .filter(num => num > 0)
  
  const nextNumber = categoryDocs.length > 0 ? Math.max(...categoryDocs) + 1 : 1
  return `${prefix}${String(nextNumber).padStart(2, '0')}`
}

export default function DocumentsPage() {
  const { community } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileUrls, setFileUrls] = useState<Record<string, string | null>>({})
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({})
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [updatingDocs, setUpdatingDocs] = useState<Set<string>>(new Set())
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({})
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      if (!community) return
      
      try {
        setLoading(true)
        setError(null)
        // Filter documents by community
        const [docsData, usersData] = await Promise.all([
          getDocuments(undefined, community),
          getUsers(community),
        ])
        
        // Auto-update documents with proper categories and assign submission IDs
        const docsToUpdate: Array<{ id: string; category: string; submissionId: string }> = []
        docsData.forEach(doc => {
          const title = (doc.title || doc.name || doc.fileName || '').toLowerCase()
          const description = (doc.description || '').toLowerCase()
          const categoryLower = (doc.category || '').toLowerCase()
          const submissionId = (doc.submissionId || '').toUpperCase()
          const searchText = `${title} ${description} ${categoryLower} ${submissionId}`
          
          let detectedCategory: string | null = null
          
          // First, check submission ID to determine category (this takes priority)
          if (submissionId) {
            if (submissionId.startsWith('EC')) {
              detectedCategory = 'Elder Care'
            } else if (submissionId.startsWith('E') && !submissionId.startsWith('EC')) {
              detectedCategory = 'Education'
            } else if (submissionId.startsWith('H')) {
              detectedCategory = 'Housing'
            } else if (submissionId.startsWith('I')) {
              detectedCategory = 'Income Assistance'
            } else if (submissionId.startsWith('J')) {
              detectedCategory = "Jordan's Principle"
            } else if (submissionId.startsWith('S') && !submissionId.startsWith('SC')) {
              detectedCategory = 'Social Assistance'
            } else if (submissionId.startsWith('SC')) {
              detectedCategory = 'Status Cards'
            } else if (submissionId.startsWith('O')) {
              detectedCategory = 'Other'
            }
          }
          
          // If no category from submission ID, check keywords
          if (!detectedCategory) {
            // Check for Elder Care keywords
            const elderCareKeywords = ['elder', 'elderly', 'senior', 'seniors', 'elder care', 'caregiver', 'aging', 'aged']
            if (elderCareKeywords.some(keyword => searchText.includes(keyword))) {
              detectedCategory = 'Elder Care'
            }
            // Check for Income Assistance keywords
            else if (['income', 'assistance', 'social assistance', 'welfare', 'benefit', 'financial aid', 'support payment'].some(keyword => searchText.includes(keyword)) && !searchText.includes('social assistance') || searchText.includes('income')) {
              detectedCategory = 'Income Assistance'
            }
            // Check for Education keywords
            else if (['education', 'school', 'student', 'learning', 'tuition'].some(keyword => searchText.includes(keyword))) {
              detectedCategory = 'Education'
            }
            // Check for Housing keywords
            else if (['housing', 'home', 'residence', 'accommodation', 'rental'].some(keyword => searchText.includes(keyword))) {
              detectedCategory = 'Housing'
            }
            // Check for Jordan's Principle keywords
            else if (['jordan', 'principle', 'jordans principle'].some(keyword => searchText.includes(keyword))) {
              detectedCategory = "Jordan's Principle"
            }
            // Check for Status Cards keywords
            else if (['status', 'card', 'status card', 'indian status'].some(keyword => searchText.includes(keyword))) {
              detectedCategory = 'Status Cards'
            }
            // Check for Social Assistance keywords
            else if (['social assistance', 'social support'].some(keyword => searchText.includes(keyword)) && !searchText.includes('income')) {
              detectedCategory = 'Social Assistance'
            }
          }
          
          // Update if category detected and document is uncategorized, in Other, or has wrong category
          // OR if document has a submission ID that indicates a different category
          if (detectedCategory && (!doc.category || doc.category === 'Other' || doc.category !== detectedCategory)) {
            // If document already has a submission ID that matches the detected category, keep it
            // Otherwise generate a new one
            let newSubmissionId = doc.submissionId
            if (!newSubmissionId || !newSubmissionId.toUpperCase().startsWith(getCategoryPrefix(detectedCategory))) {
              newSubmissionId = generateSubmissionId(docsData, detectedCategory)
            }
            docsToUpdate.push({ id: doc.id, category: detectedCategory, submissionId: newSubmissionId })
          }
          
          // Also check: if document has submission ID but wrong category, fix it
          if (submissionId && doc.category && detectedCategory && doc.category !== detectedCategory) {
            // Keep the existing submission ID if it matches the detected category
            if (submissionId.toUpperCase().startsWith(getCategoryPrefix(detectedCategory))) {
              docsToUpdate.push({ id: doc.id, category: detectedCategory, submissionId: doc.submissionId || '' })
            }
          }
          
          // Assign submission ID if missing
          if (!doc.submissionId && doc.category) {
            const newSubmissionId = generateSubmissionId(docsData, doc.category)
            docsToUpdate.push({ id: doc.id, category: doc.category, submissionId: newSubmissionId })
          }
        })
        
        // Update documents in the background (don't wait)
        if (docsToUpdate.length > 0) {
          console.log(`[Documents] Auto-updating ${docsToUpdate.length} documents with categories and submission IDs`)
          Promise.all(
            docsToUpdate.map(({ id, category, submissionId }) => 
              updateDocument(id, { category, submissionId }).catch(err => 
                console.error(`Failed to update document ${id}:`, err)
              )
            )
          ).then(() => {
            // Refresh after updates complete
            setTimeout(async () => {
              if (!community) return
              try {
                const [docsData, usersData] = await Promise.all([
                  getDocuments(undefined, community),
                  getUsers(community),
                ])
                const filteredDocs = selectedCategory 
                  ? docsData.filter(doc => doc.category === selectedCategory)
                  : docsData
                setDocuments(filteredDocs)
                setUsers(usersData)
              } catch (err: any) {
                console.error('Error refreshing documents:', err)
              }
            }, 500)
          })
        }
        
        // Store all documents for search
        setAllDocuments(docsData)
        
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
  }, [selectedCategory, community])

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unknown User'
    const user = users.find(u => u.id === userId)
    return user?.name || user?.displayName || user?.email || 'Unknown User'
  }

  const getUserFullName = (userId?: string) => {
    if (!userId) return null
    const user = users.find(u => u.id === userId)
    // Try to get first and last name from name field
    const fullName = user?.name || user?.displayName
    if (fullName) {
      // If name contains space, assume it's "First Last"
      const nameParts = fullName.trim().split(/\s+/)
      if (nameParts.length >= 2) {
        return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
      }
      return fullName
    }
    return null
  }

  const getDocumentTitle = (doc: Document) => {
    // If document has a title, use it
    if (doc.title || doc.name || doc.fileName) {
      return doc.title || doc.name || doc.fileName || ''
    }
    
    // Otherwise, use user's first and last name (just the name, no "Submission")
    const userFullName = getUserFullName(doc.userId)
    if (userFullName) {
      return userFullName
    }
    
    // Fallback to description or submission ID
    if (doc.description) {
      return doc.description.substring(0, 50)
    }
    
    // Last resort: submission ID
    if (doc.submissionId) {
      return `Submission ${doc.submissionId}`
    }
    
    return `Document ${doc.id.substring(0, 8)}`
  }

  const getUserEmail = (userId?: string) => {
    if (!userId) return null
    const user = users.find(u => u.id === userId)
    return user?.email || null
  }

  const getUserAccountId = (userId?: string) => {
    if (!userId) return 'N/A'
    const user = users.find(u => u.id === userId)
    return user?.accountId || user?.id || 'N/A'
  }

  const refreshDocuments = async () => {
    if (!community) return
    try {
      const [docsData, usersData] = await Promise.all([
        getDocuments(undefined, community),
        getUsers(community),
      ])
      const filteredDocs = selectedCategory 
        ? docsData.filter(doc => doc.category === selectedCategory)
        : docsData
      setDocuments(filteredDocs)
      setUsers(usersData)
    } catch (err: any) {
      console.error('Error refreshing documents:', err)
    }
  }

  const handleDeleteDocument = async (docId: string, docTitle?: string) => {
    if (!confirm(`Are you sure you want to delete "${docTitle || 'this document'}"?`)) {
      return
    }
    
    try {
      setUpdatingDocs(prev => new Set(prev).add(docId))
      await deleteDocument(docId)
      await refreshDocuments()
    } catch (err: any) {
      alert(`Failed to delete document: ${err.message}`)
    } finally {
      setUpdatingDocs(prev => {
        const newSet = new Set(prev)
        newSet.delete(docId)
        return newSet
      })
    }
  }

  const handleStartEditNote = (docId: string, currentNote?: string) => {
    setEditingNote(docId)
    setNoteTexts(prev => ({ ...prev, [docId]: currentNote || '' }))
  }

  const handleCancelEditNote = () => {
    setEditingNote(null)
  }

  const handleSaveNote = async (docId: string) => {
    try {
      setUpdatingDocs(prev => new Set(prev).add(docId))
      const note = noteTexts[docId] || ''
      await updateDocument(docId, { note })
      await refreshDocuments()
      setEditingNote(null)
    } catch (err: any) {
      alert(`Failed to save note: ${err.message}`)
    } finally {
      setUpdatingDocs(prev => {
        const newSet = new Set(prev)
        newSet.delete(docId)
        return newSet
      })
    }
  }

  const handleUpdateStatus = async (docId: string, newStatus: string) => {
    try {
      setUpdatingDocs(prev => new Set(prev).add(docId))
      await updateDocument(docId, { status: newStatus })
      await refreshDocuments()
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

  const handleShareDocument = async (docId: string) => {
    try {
      const url = `${window.location.origin}/api/documents/${docId}/file`
      await navigator.clipboard.writeText(url)
      alert('Document link copied to clipboard!')
    } catch (err: any) {
      alert(`Failed to copy link: ${err.message}`)
    }
  }

  const handleViewDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) return
    
    // Set the document to view (this will open a modal/viewer)
    setViewingDoc(doc)
    
    // Also try to load the file URL if available
    try {
      setLoadingFiles(prev => ({ ...prev, [docId]: true }))
      const url = await getDocumentFileUrl(docId)
      setLoadingFiles(prev => ({ ...prev, [docId]: false }))
      if (url) {
        setFileUrls(prev => ({ ...prev, [docId]: url }))
      }
    } catch (err: any) {
      setLoadingFiles(prev => ({ ...prev, [docId]: false }))
      console.error('Failed to load file URL:', err)
    }
  }

  const handleDownloadPDF = async () => {
    if (!viewingDoc) return

    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin
      const lineHeight = 7
      const maxWidth = pageWidth - (margin * 2)

      // Helper function to add a new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number, isBold: boolean = false) => {
        pdf.setFontSize(fontSize)
        if (isBold) {
          pdf.setFont('helvetica', 'bold')
        } else {
          pdf.setFont('helvetica', 'normal')
        }
        
        const lines = pdf.splitTextToSize(text, maxWidth)
        lines.forEach((line: string) => {
          checkNewPage(lineHeight)
          pdf.text(line, margin, yPosition)
          yPosition += lineHeight
        })
      }

      // Helper function to check if a value is an image URL
      const isImageUrl = (val: any): boolean => {
        if (typeof val !== 'string') return false
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image')
      }

      // Helper function to check if a field is a signature field
      const isSignatureField = (fieldName: string): boolean => {
        const lowerName = fieldName.toLowerCase()
        return lowerName.includes('signature') || lowerName.includes('sign')
      }

      // Title
      addText('Form Submission Details', 18, true)
      yPosition += 5

      // Document Details
      addText('Document Information', 14, true)
      yPosition += 3
      addText(`Submission ID: ${viewingDoc.submissionId || 'N/A'}`, 10)
      addText(`User: ${getUserName(viewingDoc.userId)}`, 10)
      if (getUserEmail(viewingDoc.userId)) {
        addText(`Email: ${getUserEmail(viewingDoc.userId)}`, 10)
      }
      addText(`Category: ${viewingDoc.category || 'Other'}`, 10)
      addText(`Status: ${(viewingDoc.status || 'pending').toUpperCase()}`, 10)
      if (viewingDoc.createdAt) {
        addText(`Submitted: ${new Date(viewingDoc.createdAt).toLocaleString()}`, 10)
      }
      yPosition += 5

      // Description
      if (viewingDoc.description) {
        addText('Description', 14, true)
        yPosition += 3
        addText(viewingDoc.description, 10)
        yPosition += 5
      }

      // Form Fields
      const excludeFields = ['id', 'userId', 'userAccountId', 'category', 'title', 'name', 'fileName', 'description', 'status', 'submissionId', 'note', 'createdAt', 'filePath', 'storagePath', 'fileUrl', 'file', 'downloadUrl', 'community']
      const formFields = Object.keys(viewingDoc)
        .filter(key => !excludeFields.includes(key) && viewingDoc[key] !== null && viewingDoc[key] !== undefined && viewingDoc[key] !== '')
        .reduce((acc, key) => {
          acc[key] = viewingDoc[key]
          return acc
        }, {} as Record<string, any>)

      if (Object.keys(formFields).length > 0) {
        addText('Form Data', 14, true)
        yPosition += 3

        for (const [key, value] of Object.entries(formFields)) {
          checkNewPage(lineHeight * 3)
          const fieldName = key.replace(/([A-Z])/g, ' $1').trim()
          addText(`${fieldName}:`, 10, true)
          
          const isSignature = isSignatureField(key)
          const isImage = isImageUrl(value)
          const isDataUrl = typeof value === 'string' && value.startsWith('data:image')
          const isHttpUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))
          
          // Only include signature images if they're data URLs (base64 embedded)
          // Skip all HTTP/HTTPS URLs (both signatures and document URLs)
          if (isSignature && isImage && isDataUrl) {
            // Try to add signature image (only for data URLs)
            try {
              checkNewPage(50) // Reserve space for image
              const img = new Image()
              
              await new Promise((resolve) => {
                img.onload = () => {
                  try {
                    // Calculate image dimensions to fit in PDF
                    const maxImgWidth = maxWidth
                    const maxImgHeight = 40
                    let imgWidth = img.width
                    let imgHeight = img.height
                    const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight)
                    imgWidth = imgWidth * ratio
                    imgHeight = imgHeight * ratio

                    checkNewPage(imgHeight + 5)
                    pdf.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight)
                    yPosition += imgHeight + 5
                    resolve(null)
                  } catch (err) {
                    // If image fails, skip it
                    resolve(null)
                  }
                }
                img.onerror = () => {
                  // If image fails to load, skip it
                  resolve(null)
                }
                img.src = String(value)
              })
            } catch (err) {
              // Skip on error
            }
          } else if (isHttpUrl) {
            // Skip ALL HTTP/HTTPS URLs (document URLs, signature URLs, etc.)
            continue
          } else {
            // Include non-URL values
            const valueText = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
            addText(valueText, 9)
          }
          yPosition += 2
        }
      }

      // Return PDF blob
      return pdf.output('blob')
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    }
  }

  const handleDownloadZip = async () => {
    if (!viewingDoc) return

    try {
      // Show loading indicator
      const loadingMessage = document.createElement('div')
      loadingMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999;'
      loadingMessage.textContent = 'Preparing download...'
      document.body.appendChild(loadingMessage)

      const zip = new JSZip()
      const submissionId = viewingDoc.submissionId || viewingDoc.id
      const dateStr = new Date().toISOString().split('T')[0]
      const folderName = `Submission_${submissionId}_${dateStr}`

      // Generate PDF
      try {
        const pdfBlob = await handleDownloadPDF()
        if (pdfBlob) {
          zip.file(`${folderName}/Form_Submission_Details.pdf`, pdfBlob)
        }
      } catch (error) {
        console.error('Error generating PDF:', error)
        document.body.removeChild(loadingMessage)
        alert('Failed to generate PDF. Please try again.')
        return
      }

      // Download attached documents - check all possible file fields
      // First, check known file fields
      const knownFileFields = [
        viewingDoc.filePath,
        viewingDoc.storagePath,
        viewingDoc.fileUrl,
        viewingDoc.downloadUrl,
        viewingDoc.file
      ].filter(Boolean) // Remove null/undefined values

      // Also check if we have a file URL from the loaded URLs
      const fileUrl = fileUrls[viewingDoc.id]
      if (fileUrl) {
        knownFileFields.push(fileUrl)
      }

      // Search through ALL document fields for file references (including nested objects)
      const allFileFields: string[] = knownFileFields.filter((f): f is string => f !== null && f !== undefined)
      const excludeFields = ['id', 'userId', 'userAccountId', 'category', 'title', 'name', 'fileName', 'description', 'status', 'submissionId', 'note', 'createdAt', 'community', 'updatedAt']
      
      const searchForFiles = (obj: any, prefix = ''): void => {
        if (!obj || typeof obj !== 'object') return
        
        Object.keys(obj).forEach(key => {
          if (excludeFields.includes(key)) return
          
          const value = obj[key]
          if (!value) return
          
          // Check if value is a URL or file path
          if (typeof value === 'string') {
            // Check for file URLs
            if (value.startsWith('http://') || value.startsWith('https://')) {
              // Only add if it looks like a file URL (not a signature URL)
              if (!value.includes('signature') && !value.includes('data:image')) {
                allFileFields.push(value)
              }
            }
            // Check for storage paths (common patterns)
            else if (value.includes('/') && (value.includes('documents') || value.includes('uploads') || value.includes('files') || value.endsWith('.pdf') || value.endsWith('.jpg') || value.endsWith('.png') || value.endsWith('.doc') || value.endsWith('.docx'))) {
              allFileFields.push(value)
            }
          }
          // Recursively search nested objects
          else if (typeof value === 'object' && !Array.isArray(value)) {
            searchForFiles(value, `${prefix}${key}.`)
          }
          // Check arrays for file references
          else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://') || item.includes('/'))) {
                if (!item.includes('signature') && !item.includes('data:image')) {
                  allFileFields.push(item)
                }
              } else if (typeof item === 'object' && item !== null) {
                // Check if this object has a URL property (like documentUrls array items)
                if (item.url && typeof item.url === 'string') {
                  if (!item.url.includes('signature') && !item.url.includes('data:image')) {
                    allFileFields.push(item.url)
                  }
                } else {
                  // Recursively search nested objects
                  searchForFiles(item, `${prefix}${key}[${index}].`)
                }
              }
            })
          }
        })
      }
      
      // Search through all fields in the document
      searchForFiles(viewingDoc)
      
      // Remove duplicates
      const uniqueFileFields = Array.from(new Set(allFileFields))
      
      console.log(`[ZIP Download] Document fields for ${viewingDoc.id}:`, Object.keys(viewingDoc))
      console.log(`[ZIP Download] Found ${uniqueFileFields.length} potential file reference(s):`, uniqueFileFields)
      
      // Log all document data for debugging (excluding sensitive data)
      const { id: _, ...debugData } = viewingDoc
      console.log(`[ZIP Download] Full document data (first 500 chars):`, JSON.stringify(debugData).substring(0, 500))

      // Always ensure we try to download the main document file via proxy
      // Add a marker if we don't have any file references yet
      if (uniqueFileFields.length === 0) {
        // No files detected in document fields, try to get main file via proxy
        uniqueFileFields.push(`__MAIN_FILE__`)
        console.log(`[ZIP Download] No files detected in document fields, will try main file via proxy`)
      } else {
        // We have files, but also ensure we get the main document file if it exists
        const hasMainFileField = viewingDoc.filePath || 
                                 viewingDoc.storagePath || 
                                 viewingDoc.fileUrl || 
                                 viewingDoc.file ||
                                 viewingDoc.downloadUrl
        
        if (hasMainFileField && !uniqueFileFields.some(f => f === '__MAIN_FILE__')) {
          // Add main file marker to ensure it's downloaded
          uniqueFileFields.unshift(`__MAIN_FILE__`)
          console.log(`[ZIP Download] Main file field detected, adding to download queue`)
        }
      }
      
      console.log(`[ZIP Download] Total files to download: ${uniqueFileFields.length}`)
      console.log(`[ZIP Download] File list:`, uniqueFileFields.map(f => f === '__MAIN_FILE__' ? '__MAIN_FILE__' : f.substring(0, 50) + '...'))

      // Download all attached files
      let filesDownloaded = 0
      let filesSkipped = 0
      
      for (let i = 0; i < uniqueFileFields.length; i++) {
        const fileField = uniqueFileFields[i]
        if (!fileField) continue

        try {
          loadingMessage.textContent = `Downloading attached document ${i + 1} of ${uniqueFileFields.length}...`
          
          // Determine if we should use the proxy endpoint (for Firebase Storage URLs to avoid CORS)
          let downloadUrl = fileField
          let useProxy = false
          
          // Check if this is a marker for the main file
          if (fileField === '__MAIN_FILE__') {
            useProxy = true
            downloadUrl = `/api/documents/${viewingDoc.id}/file/download`
            console.log(`[ZIP Download] Downloading main document file via proxy`)
          } else if (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://')) {
            // It's a storage path - use the proxy endpoint
            useProxy = true
            downloadUrl = `/api/documents/${viewingDoc.id}/file/download`
            console.log(`[ZIP Download] File field ${i + 1} is a storage path, using proxy endpoint`)
          } else if (downloadUrl.includes('storage.googleapis.com') || downloadUrl.includes('firebasestorage.app')) {
            // It's a Firebase Storage URL - use proxy to avoid CORS
            useProxy = true
            // Pass the file URL as a query parameter
            downloadUrl = `/api/documents/${viewingDoc.id}/file/download?url=${encodeURIComponent(fileField)}`
            console.log(`[ZIP Download] File ${i + 1} is a Firebase Storage URL, using proxy to avoid CORS`)
          } else {
            // It's a regular URL - try direct download
            console.log(`[ZIP Download] File ${i + 1} is a regular URL, attempting direct download`)
          }

          console.log(`[ZIP Download] Attempting to download file ${i + 1} from: ${downloadUrl.substring(0, 100)}...`)
          
          const response = await fetch(downloadUrl, { 
            mode: 'cors',
            credentials: 'omit',
            redirect: 'follow'
          })
          
          console.log(`[ZIP Download] Response status for file ${i + 1}: ${response.status} ${response.statusText}`)
          
          if (response.ok) {
            const fileBlob = await response.blob()
            console.log(`[ZIP Download] Successfully downloaded file ${i + 1}, size: ${fileBlob.size} bytes`)
            
            // Try to get original file name
            let originalFileName = viewingDoc.fileName || viewingDoc.name
            
            if (!originalFileName || (uniqueFileFields.length > 1 && i > 0)) {
              // If multiple files or no name, try to extract from Content-Disposition header or URL
              const contentDisposition = response.headers.get('content-disposition')
              if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
                if (filenameMatch && filenameMatch[1]) {
                  originalFileName = filenameMatch[1]
                }
              }
              
              // If still no name, try to extract from URL or use index
              if (!originalFileName) {
                try {
                  const urlObj = new URL(downloadUrl.startsWith('/') ? `http://localhost${downloadUrl}` : downloadUrl)
                  const urlPath = urlObj.pathname
                  const extractedName = urlPath.split('/').pop() || 'document'
                  // Remove query parameters from filename
                  const cleanName = extractedName.split('?')[0]
                  if (cleanName && cleanName.includes('.')) {
                    originalFileName = cleanName
                  } else {
                    // If no extension, try to detect from content type
                    const contentType = response.headers.get('content-type')
                    const extension = contentType?.split('/')[1]?.split(';')[0] || 'pdf'
                    originalFileName = uniqueFileFields.length > 1 
                      ? `attached_document_${i + 1}.${extension}`
                      : `attached_document.${extension}`
                  }
                } catch (e) {
                  // If URL parsing fails, use a default name
                  const contentType = response.headers.get('content-type')
                  const extension = contentType?.split('/')[1]?.split(';')[0] || 'pdf'
                  originalFileName = uniqueFileFields.length > 1 
                    ? `attached_document_${i + 1}.${extension}`
                    : `attached_document.${extension}`
                }
              }
            }
            
            zip.file(`${folderName}/${originalFileName}`, fileBlob)
            filesDownloaded++
            console.log(`[ZIP Download] Added file to ZIP: ${originalFileName}`)
          } else if (response.status === 404) {
            filesSkipped++
            const errorText = await response.text().catch(() => '')
            console.warn(`[ZIP Download] File ${i + 1} not found (404): ${downloadUrl.substring(0, 100)}`)
            console.warn(`[ZIP Download] Error response: ${errorText.substring(0, 200)}`)
          } else {
            filesSkipped++
            const errorText = await response.text().catch(() => '')
            console.warn(`[ZIP Download] Failed to download file ${i + 1}: HTTP ${response.status} ${response.statusText}`)
            console.warn(`[ZIP Download] Error response: ${errorText.substring(0, 200)}`)
            // Continue with other files even if one fails
          }
        } catch (error) {
          filesSkipped++
          console.error(`Error downloading attached file ${i + 1}:`, error)
          // Continue with other files even if one fails
        }
      }
      
      // Log summary
      if (filesSkipped > 0) {
        console.log(`Download summary: ${filesDownloaded} file(s) downloaded, ${filesSkipped} file(s) skipped`)
      }

      // Generate ZIP file
      loadingMessage.textContent = 'Creating ZIP file...'
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Download ZIP
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${folderName}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Remove loading message
      if (loadingMessage && loadingMessage.parentNode) {
        document.body.removeChild(loadingMessage)
      }
      
      // Show summary if files were skipped
      if (filesSkipped > 0 && filesDownloaded === 0) {
        alert(`ZIP created with PDF only. ${filesSkipped} attached file(s) could not be downloaded (file may not exist or is unavailable).`)
      } else if (filesSkipped > 0) {
        alert(`ZIP created successfully. ${filesDownloaded} file(s) downloaded, ${filesSkipped} file(s) could not be downloaded.`)
      }
    } catch (error) {
      console.error('Error creating ZIP:', error)
      alert('Failed to create ZIP file. Please try again.')
      // Remove loading message if it exists
      const loadingMessageEl = document.querySelector('div[style*="position: fixed"]')
      if (loadingMessageEl && loadingMessageEl.parentNode) {
        document.body.removeChild(loadingMessageEl)
      }
    }
  }

  // Filter documents by search query
  const filteredDocuments = searchQuery
    ? documents.filter(doc => {
        const query = searchQuery.toLowerCase()
        const title = getDocumentTitle(doc).toLowerCase()
        const description = (doc.description || '').toLowerCase()
        const userName = getUserName(doc.userId).toLowerCase()
        const userAccountId = getUserAccountId(doc.userId).toLowerCase()
        const submissionId = (doc.submissionId || '').toLowerCase()
        const category = (doc.category || '').toLowerCase()
        
        return (
          title.includes(query) ||
          description.includes(query) ||
          userName.includes(query) ||
          userAccountId.includes(query) ||
          submissionId.includes(query) ||
          category.includes(query)
        )
      })
    : documents

  // Group documents by category
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    // Use the document's category directly - it should already be set correctly
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

      {/* Search Bar */}
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name, ID, submission ID, category, title, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-500">
            Found {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200/50">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Filter by category:</span>
        </div>
        <button
          onClick={() => setSelectedCategory('')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            selectedCategory === ''
              ? 'text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-105'
          }`}
          style={selectedCategory === '' ? { 
            backgroundColor: '#ffc299',
            boxShadow: '0 4px 12px rgba(255, 194, 153, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 194, 153, 0.6)'
          } : {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(209, 213, 219, 0.4)'
          }}
        >
          All
        </button>
        {categories.map((category) => {
          const count = groupedDocuments[category]?.length || 0
          const isSelected = selectedCategory === category
          const categoryColor = getCategoryColor(category, categories.indexOf(category))
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(isSelected ? '' : category)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                isSelected
                  ? 'text-white shadow-lg scale-105'
                  : 'text-gray-700 bg-white hover:bg-gray-50 hover:scale-105'
              }`}
              style={isSelected ? {
                backgroundColor: categoryColor,
                boxShadow: `0 4px 12px ${categoryColor}40, 0 2px 4px rgba(0, 0, 0, 0.1)`,
                border: `1px solid ${categoryColor}80`
              } : {
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(209, 213, 219, 0.4)'
              }}
            >
              {category}
              {count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory('')}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-105 border border-gray-300/50"
            style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <X className="h-4 w-4" />
            Clear Filter
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
                className="rounded-xl bg-white shadow-md ring-1 ring-gray-900/5 overflow-hidden transition-all duration-300 hover:shadow-lg"
                style={{ 
                  borderTop: `4px solid ${categoryColor}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(category)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 transition-transform" style={{ color: categoryColor }} />
                        ) : (
                          <ChevronRight className="h-5 w-5 transition-transform" style={{ color: categoryColor }} />
                        )}
                      </div>
                      <Folder className="h-7 w-7 transition-transform group-hover:scale-110" style={{ color: categoryColor }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">{category}</h2>
                      <p className="text-sm text-gray-500 mt-1.5 font-medium">
                        {docs.length} document{docs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Folder Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4">
                    {docs.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">No documents in this category</p>
                        <p className="text-xs text-gray-400 mt-1">Documents will appear here once submitted</p>
                      </div>
                    ) : (
                      docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="group rounded-xl bg-gradient-to-br from-white to-gray-50/50 p-6 border border-gray-200/60 hover:border-gray-300 hover:shadow-lg transition-all duration-300 backdrop-blur-sm"
                        style={{
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                                    {doc.submissionId || generateSubmissionId(documents, doc.category || 'Other')}
                                  </span>
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                      {getDocumentTitle(doc)}
                                    </h3>
                                    {getUserEmail(doc.userId) && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">{getUserEmail(doc.userId)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {doc.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Custom Status Dropdown */}
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
                                    className={`rounded-full px-5 py-2.5 text-sm font-medium border-0 transition-all duration-200 flex items-center gap-2 ${
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
                                          className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-full mx-2 my-1 transition ${
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
                                          className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-full mx-2 my-1 transition ${
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
                                          className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-full mx-2 my-1 transition ${
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
                                  <span className="text-xs text-gray-500 animate-pulse flex items-center gap-1">
                                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                                    Updating...
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Modern metadata cards */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50/80 border border-blue-100/50">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                  {getUserName(doc.userId)}
                                </span>
                              </div>
                              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50/80 border border-gray-100/50">
                                <span className="text-sm font-mono text-gray-600">
                                  ID: {getUserAccountId(doc.userId)}
                                </span>
                              </div>
                              {doc.createdAt && (
                                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50/80 border border-purple-100/50">
                                  <Calendar className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm font-medium text-purple-900">
                                    {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* View Submission and Action buttons */}
                            <div className="pt-4 border-t border-gray-200/60 space-y-3">
                              <button
                                onClick={() => handleViewDocument(doc.id)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                                style={{ 
                                  backgroundColor: '#b3e8f0', 
                                  color: '#1e3a8a',
                                  boxShadow: '0 2px 8px rgba(179, 232, 240, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
                                  border: '1px solid rgba(179, 232, 240, 0.6)'
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                View Submission
                              </button>
                              
                              {(doc.filePath || doc.storagePath || doc.fileUrl || doc.file || doc.downloadUrl) && (
                                <div>
                                  {loadingFiles[doc.id] ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                      Loading file...
                                    </div>
                                  ) : fileUrls[doc.id] ? (
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <a
                                        href={fileUrls[doc.id]!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                                        style={{ 
                                          backgroundColor: '#ffc299', 
                                          color: '#1e3a8a',
                                          boxShadow: '0 2px 8px rgba(255, 194, 153, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
                                          border: '1px solid rgba(255, 194, 153, 0.6)'
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                        Download File
                                      </a>
                                      <button
                                        onClick={() => handleShareDocument(doc.id)}
                                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                                        style={{ 
                                          backgroundColor: '#ffeaa7', 
                                          color: '#1e3a8a',
                                          boxShadow: '0 2px 8px rgba(255, 234, 167, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
                                          border: '1px solid rgba(255, 234, 167, 0.6)'
                                        }}
                                      >
                                        <Share2 className="h-4 w-4" />
                                        Share
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 bg-gray-50/50 rounded-lg px-3 py-2 border border-gray-200/50">
                                      File not available (may need to check file path in Firebase)
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Note section */}
                            <div className="pt-4 mt-4 border-t border-gray-200/60">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4 text-gray-500" />
                                  <label className="text-sm font-semibold text-gray-700">Note for User:</label>
                                </div>
                                {editingNote !== doc.id && (
                                  <button
                                    onClick={() => handleStartEditNote(doc.id, doc.note)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                                  >
                                    {doc.note ? 'Edit' : 'Add Note'}
                                  </button>
                                )}
                              </div>
                              {editingNote === doc.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={noteTexts[doc.id] || ''}
                                    onChange={(e) => setNoteTexts(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                    placeholder="Enter a note for the user about this submission..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none text-gray-900"
                                    rows={3}
                                    disabled={updatingDocs.has(doc.id)}
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleSaveNote(doc.id)}
                                      disabled={updatingDocs.has(doc.id)}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                      <Save className="h-4 w-4" />
                                      Save Note
                                    </button>
                                    <button
                                      onClick={handleCancelEditNote}
                                      disabled={updatingDocs.has(doc.id)}
                                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                    {updatingDocs.has(doc.id) && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                                        Saving...
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  {doc.note ? (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{doc.note}</p>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No note added yet</p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Category display and actions section */}
                            <div className="pt-4 mt-4 border-t border-gray-200/60 flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-gray-700">Category:</label>
                                <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                                  {doc.category || 'Other'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.title || doc.name)}
                                disabled={updatingDocs.has(doc.id)}
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200/50 hover:border-red-300"
                                title="Delete document"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
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

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingDoc(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getDocumentTitle(viewingDoc)}
                </h2>
                {viewingDoc.submissionId && (
                  <p className="text-sm text-gray-500 mt-1">Submission ID: {viewingDoc.submissionId}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadZip}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ 
                    backgroundColor: '#b3e8f0', 
                    color: '#1e3a8a',
                    boxShadow: '0 2px 8px rgba(179, 232, 240, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(179, 232, 240, 0.5)'
                  }}
                  title="Download form and documents as ZIP"
                >
                  <Archive className="h-4 w-4" />
                  Download All
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Document Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">User:</label>
                  <p className="text-sm text-gray-900 mt-1">{getUserName(viewingDoc.userId)}</p>
                </div>
                {getUserEmail(viewingDoc.userId) && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Email:</label>
                    <p className="text-sm text-gray-900 mt-1">{getUserEmail(viewingDoc.userId)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700">Category:</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingDoc.category || 'Other'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status:</label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">{viewingDoc.status || 'pending'}</p>
                </div>
                {viewingDoc.createdAt && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Submitted:</label>
                    <p className="text-sm text-gray-900 mt-1">{new Date(viewingDoc.createdAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {viewingDoc.description && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Description:</label>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{viewingDoc.description}</p>
                </div>
              )}

              {/* Form Data / Document Fields */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  Form Data / Document Contents:
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                  {(() => {
                    // Get all fields from the document, excluding common metadata fields and URLs
                    const excludeFields = ['id', 'userId', 'userAccountId', 'category', 'title', 'name', 'fileName', 'description', 'status', 'submissionId', 'note', 'createdAt', 'filePath', 'storagePath', 'fileUrl', 'file', 'downloadUrl', 'community']
                    
                    // Helper to check if a value is a URL (but not a data URL for signatures)
                    const isUrl = (val: any): boolean => {
                      if (typeof val !== 'string') return false
                      return (val.startsWith('http://') || val.startsWith('https://')) && !val.startsWith('data:image')
                    }
                    
                    // Helper to check if a field is a signature field
                    const isSignatureField = (fieldName: string): boolean => {
                      const lowerName = fieldName.toLowerCase()
                      return lowerName.includes('signature') || lowerName.includes('sign')
                    }
                    
                    // Recursive function to remove URLs from nested objects and arrays
                    const removeUrls = (obj: any, fieldName: string = ''): any => {
                      if (obj === null || obj === undefined) return obj
                      
                      // If it's a string URL (and not a signature data URL), remove it
                      if (typeof obj === 'string') {
                        if (isUrl(obj) && !isSignatureField(fieldName)) {
                          return undefined // Mark for removal
                        }
                        return obj
                      }
                      
                      // If it's an array, filter out URLs
                      if (Array.isArray(obj)) {
                        const filtered = obj
                          .map((item, index) => removeUrls(item, `${fieldName}[${index}]`))
                          .filter(item => item !== undefined)
                        return filtered.length > 0 ? filtered : undefined
                      }
                      
                      // If it's an object, recursively process
                      if (typeof obj === 'object') {
                        const filtered: Record<string, any> = {}
                        let hasValidFields = false
                        
                        for (const [key, value] of Object.entries(obj)) {
                          const processed = removeUrls(value, key)
                          if (processed !== undefined) {
                            filtered[key] = processed
                            hasValidFields = true
                          }
                        }
                        
                        return hasValidFields ? filtered : undefined
                      }
                      
                      return obj
                    }
                    
                    const formFields = Object.keys(viewingDoc)
                      .filter(key => {
                        // Exclude metadata fields
                        if (excludeFields.includes(key)) return false
                        const value = viewingDoc[key]
                        // Exclude null/undefined/empty
                        if (value === null || value === undefined || value === '') return false
                        // Exclude URLs (except signature data URLs)
                        if (isUrl(value) && !isSignatureField(key)) return false
                        return true
                      })
                      .reduce((acc, key) => {
                        const processedValue = removeUrls(viewingDoc[key], key)
                        if (processedValue !== undefined) {
                          acc[key] = processedValue
                        }
                        return acc
                      }, {} as Record<string, any>)
                    
                    if (Object.keys(formFields).length === 0) {
                      return <p className="text-sm text-gray-400 italic">No additional form data available</p>
                    }
                    
                    // Helper function to check if a value is an image URL or data URL
                    const isImageUrl = (val: any): boolean => {
                      if (typeof val !== 'string') return false
                      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image')
                    }
                    
                    return (
                      <div className="space-y-3">
                        {Object.entries(formFields).map(([key, value]) => {
                          const isSignature = isSignatureField(key)
                          const isImage = isImageUrl(value)
                          const isDataUrl = typeof value === 'string' && value.startsWith('data:image')
                          const isHttpUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))
                          
                          // Only display signature images if they're data URLs (base64 embedded)
                          // Skip all HTTP/HTTPS URLs
                          if (isHttpUrl && !isDataUrl) {
                            return null // Don't render URLs
                          }
                          
                          const displayAsImage = isSignature && isImage && isDataUrl
                          
                          return (
                            <div key={key} className="border-b border-gray-200 pb-3 last:border-0">
                              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </label>
                              {displayAsImage ? (
                                <div className="mt-2">
                                  <img 
                                    src={String(value)} 
                                    alt={`${key} signature`}
                                    className="max-w-full h-auto rounded-lg border border-gray-300 shadow-sm bg-white"
                                    style={{ maxHeight: '200px' }}
                                    onError={(e) => {
                                      // Fallback to text if image fails to load
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      const fallback = document.createElement('p')
                                      fallback.className = 'text-sm text-gray-900 mt-1'
                                      fallback.textContent = String(value)
                                      target.parentElement?.appendChild(fallback)
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="text-sm text-gray-900 mt-1">
                                  {(() => {
                                    // Recursively render value, filtering out URLs
                                    const renderNestedValue = (val: any, depth: number = 0): React.ReactNode => {
                                      if (val === null || val === undefined) return <span className="text-gray-400 italic">null</span>
                                      
                                      if (typeof val === 'string') {
                                        const isDataUrl = val.startsWith('data:image')
                                        const isHttpUrl = val.startsWith('http://') || val.startsWith('https://')
                                        // Don't render HTTP/HTTPS URLs
                                        if (isHttpUrl && !isDataUrl) return null
                                        return <span className="whitespace-pre-wrap break-words">{val}</span>
                                      }
                                      
                                      if (Array.isArray(val)) {
                                        if (val.length === 0) return <span className="text-gray-400 italic">[]</span>
                                        // Filter out items that are only URLs
                                        const filtered = val.filter(item => {
                                          if (typeof item === 'string') return !isUrl(item)
                                          if (typeof item === 'object' && item !== null) {
                                            // Keep if it has non-URL properties
                                            return Object.values(item).some(v => typeof v !== 'string' || !isUrl(v))
                                          }
                                          return true
                                        })
                                        if (filtered.length === 0) return null
                                        return (
                                          <ul className="list-disc list-inside space-y-1 ml-4">
                                            {filtered.map((item, idx) => {
                                              const rendered = renderNestedValue(item, depth + 1)
                                              if (rendered === null) return null
                                              return <li key={idx}>{rendered}</li>
                                            })}
                                          </ul>
                                        )
                                      }
                                      
                                      if (typeof val === 'object') {
                                        const entries = Object.entries(val).filter(([k, v]) => {
                                          // Filter out URL fields (except signature data URLs)
                                          if (typeof v === 'string' && isUrl(v) && !isSignatureField(k)) return false
                                          return true
                                        })
                                        if (entries.length === 0) return <span className="text-gray-400 italic">{'{}'}</span>
                                        return (
                                          <div className="ml-4 space-y-1">
                                            {entries.map(([k, v]) => {
                                              const rendered = renderNestedValue(v, depth + 1)
                                              if (rendered === null) return null
                                              return (
                                                <div key={k} className="border-l-2 border-gray-200 pl-2">
                                                  <span className="font-semibold text-gray-700">{k}:</span> {rendered}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )
                                      }
                                      
                                      return <span>{String(val)}</span>
                                    }
                                    
                                    const rendered = renderNestedValue(value)
                                    if (rendered === null) return <span className="text-gray-400 italic">(URLs hidden)</span>
                                    return rendered
                                  })()}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* File Preview */}
              {(fileUrls[viewingDoc.id] || viewingDoc.fileUrl || viewingDoc.downloadUrl) && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2">Attached File:</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <iframe
                      src={fileUrls[viewingDoc.id] || viewingDoc.fileUrl || viewingDoc.downloadUrl}
                      className="w-full h-96 border-0 rounded"
                      title="Document preview"
                    />
                    <div className="mt-3 flex gap-2">
                      <a
                        href={fileUrls[viewingDoc.id] || viewingDoc.fileUrl || viewingDoc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                      >
                        <Download className="h-4 w-4" />
                        Download File
                      </a>
                      <a
                        href={fileUrls[viewingDoc.id] || viewingDoc.fileUrl || viewingDoc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

