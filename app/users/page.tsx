'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUsers, deleteUser, updateUser, type User } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, Trash2, Eye, User as UserIcon, AlertTriangle, CheckCircle } from 'lucide-react'

export default function UsersPage() {
  const { community } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([]) // Store all users when filtered results are empty
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [associatingUsers, setAssociatingUsers] = useState<Set<string>>(new Set())

  // Helper function to safely parse JSON response
  const parseJsonResponse = async (response: Response) => {
    // Clone response before reading so we can read it multiple times if needed
    const responseClone = response.clone()
    const contentType = response.headers.get('content-type') || ''
    
    if (!response.ok) {
      // Try to parse as JSON first if content-type suggests it
      if (contentType.includes('application/json')) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        } catch (err: any) {
          // If JSON parsing fails, try text
          if (err.message && err.message.includes('JSON')) {
            try {
              const text = await responseClone.text()
              throw new Error(`HTTP error! status: ${response.status}. Response: ${text.substring(0, 200)}`)
            } catch {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
          }
          throw err
        }
      } else {
        // Not JSON, read as text
        const text = await response.text()
        throw new Error(`HTTP error! status: ${response.status}. Response: ${text.substring(0, 200)}`)
      }
    }
    
    // Response is OK, try to parse as JSON
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}. Response: ${text.substring(0, 200)}`)
    }
    
    try {
      return await response.json()
    } catch (err: any) {
      // If JSON parsing fails, get text for better error message
      const text = await responseClone.text()
      throw new Error(`Failed to parse JSON: ${err.message}. Response: ${text.substring(0, 200)}`)
    }
  }

  const fetchUsers = async (showAll = false) => {
    try {
      setLoading(true)
      setError(null)
      
      if (showAll) {
        // User explicitly requested to see all users
        const response = await fetch('/api/users')
        const data = await parseJsonResponse(response)
        setUsers(data)
        setAllUsers(data)
        setShowAllUsers(true)
      } else if (community) {
        // Always filter by community - show ONLY users for this community
        const response = await fetch(`/api/users?community=${encodeURIComponent(community)}`)
        
        // Check debug headers for troubleshooting BEFORE parsing the body
        const totalUsers = response.headers.get('X-Debug-Total-Users')
        const filteredUsers = response.headers.get('X-Debug-Filtered-Users')
        const communityIds = response.headers.get('X-Debug-Community-IDs')
        const searchCommunity = response.headers.get('X-Debug-Search-Community')
        const allUserCommunities = response.headers.get('X-Debug-All-User-Communities')
        
        // Now parse the JSON response
        const data = await parseJsonResponse(response)
        
        // Always show filtered results - never show all users unless explicitly requested
        setUsers(data)
        setShowAllUsers(false)
        
          if (data.length === 0 && totalUsers && parseInt(totalUsers) > 0) {
            // Always fetch all users so we can show them for selective association
            const allResponse = await fetch('/api/users')
            const allData = await parseJsonResponse(allResponse)
            setAllUsers(allData)
            
            // Enhanced error message with debug info
            let errorMsg = `No users found for "${community}". ${totalUsers} users exist but none are associated with this community.`
            
            if (allUserCommunities) {
              try {
                const userData = JSON.parse(allUserCommunities)
                console.group('🔍 User Community Data Debug')
                console.log('Searching for:', searchCommunity)
                console.log('Community IDs found:', communityIds ? JSON.parse(communityIds) : 'none')
                console.log('All users and their communities:')
                userData.forEach((u: any) => {
                  console.log(`  - ${u.name || u.id}: community="${u.community}", favoriteCommunities=${JSON.stringify(u.favoriteCommunities)}`)
                })
                console.groupEnd()
                
                // Show which communities users actually have
                const uniqueCommunities = Array.from(new Set(userData.map((u: any) => u.community).filter(Boolean)))
                if (uniqueCommunities.length === 0) {
                  errorMsg = `No users found for "${community}". All ${totalUsers} users have community: null. Click "Show All Users" below to selectively associate them.`
                } else {
                  errorMsg = `No users found for "${community}". Users have communities: ${uniqueCommunities.join(', ')}. Click "Show All Users" to see and selectively associate them.`
                }
              } catch (e) {
                console.error('Error parsing user communities:', e)
                errorMsg = `No users found for "${community}". ${totalUsers} users exist. Click "Show All Users" below to see and selectively associate them.`
              }
            } else {
              errorMsg = `No users found for "${community}". ${totalUsers} users exist. Click "Show All Users" below to see and selectively associate them.`
            }
            
            setError(errorMsg)
          } else {
            setError(null)
            // Clear allUsers if we have filtered results
            if (data.length > 0) {
              setAllUsers([])
            }
          }
      } else {
        // No community, show all users
        const response = await fetch('/api/users')
        const data = await parseJsonResponse(response)
        setUsers(data)
        setAllUsers(data)
        setShowAllUsers(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAssociateUser = async (userId: string) => {
    if (!community) {
      alert('No community selected')
      return
    }
    
    try {
      setAssociatingUsers(prev => new Set(prev).add(userId))
      console.log(`[Users Page] Associating user ${userId} with community: ${community}`)
      
      const result = await updateUser(userId, { community })
      console.log(`[Users Page] User updated successfully:`, result)
      
      // Update local state immediately
      setUsers(prev => prev.map(u => u.id === userId ? result : u))
      setAllUsers(prev => prev.map(u => u.id === userId ? result : u))
      
      // Refresh the filtered list - show only community users
      await fetchUsers(false)
      
      setAssociatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    } catch (err: any) {
      console.error(`[Users Page] Failed to associate user:`, err)
      alert(`Failed to associate user: ${err.message}`)
      setAssociatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleAssociateAllUsers = async () => {
    if (!community) {
      alert('No community selected')
      return
    }
    
    if (!confirm(`Associate ALL ${allUsers.length} users with "${community}"?`)) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const usersToAssociate = allUsers.filter(user => {
        const userCommunity = (user.community && user.community !== 'null') ? user.community : null
        return !userCommunity || userCommunity.toLowerCase() !== community.toLowerCase()
      })
      
      console.log(`[Users Page] Associating ${usersToAssociate.length} users with ${community}`)
      
      // Associate all users in parallel
      const promises = usersToAssociate.map(user => updateUser(user.id, { community }))
      await Promise.all(promises)
      
      console.log(`[Users Page] Successfully associated ${usersToAssociate.length} users`)
      
      // Refresh to show filtered list
      await fetchUsers(false)
      
      alert(`Successfully associated ${usersToAssociate.length} users with ${community}`)
    } catch (err: any) {
      console.error(`[Users Page] Failed to associate users:`, err)
      setError(`Failed to associate users: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  
  const handleShowAllUsers = () => {
    fetchUsers(true)
  }
  
  const handleShowFilteredUsers = () => {
    fetchUsers(false)
  }

  useEffect(() => {
    if (community) {
      console.log('[Users Page] Fetching users for community:', community)
      fetchUsers(false) // Always filter by community
    }
  }, [community])
  
  // Refresh when returning from creating a new user - always show filtered list
  useEffect(() => {
    const handleFocus = () => {
      if (community && !loading) {
        fetchUsers(false) // Show only filtered users
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [community, loading])

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
          onClick={() => fetchUsers(false)}
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
          <h1 className="text-4xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-base text-gray-600">
            {showAllUsers 
              ? `Showing all ${users.length} users (not filtered by "${community}")`
              : community 
                ? `Showing ${users.length} user${users.length !== 1 ? 's' : ''} for ${community}`
                : `Manage all ${users.length} registered users and their account information`}
          </p>
          {community && !showAllUsers && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800">
              <CheckCircle className="h-4 w-4" />
              Filtered by community
            </div>
          )}
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

      {error && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">{error}</p>
            <div className="mt-3 flex gap-2 flex-wrap items-center">
              {!showAllUsers && allUsers.length > 0 && (
                <button
                  onClick={handleShowAllUsers}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
                  style={{ 
                    backgroundColor: '#b3e8f0', 
                    color: '#1e3a8a',
                    boxShadow: '0 2px 8px rgba(179, 232, 240, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(179, 232, 240, 0.5)'
                  }}
                >
                  Show All Users ({allUsers.length}) to Selectively Associate
                </button>
              )}
              {!showAllUsers && allUsers.length === 0 && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/users')
                      const data = await parseJsonResponse(response)
                      setAllUsers(data)
                      setUsers(data)
                      setShowAllUsers(true)
                      setError(null)
                    } catch (err: any) {
                      setError(`Failed to load all users: ${err.message}`)
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
                  style={{ 
                    backgroundColor: '#b3e8f0', 
                    color: '#1e3a8a',
                    boxShadow: '0 2px 8px rgba(179, 232, 240, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(179, 232, 240, 0.5)'
                  }}
                >
                  Show All Users to Selectively Associate
                </button>
              )}
              {showAllUsers && (
                <>
                  <button
                    onClick={handleShowFilteredUsers}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ 
                      backgroundColor: '#b3e8f0', 
                      color: '#1e3a8a',
                      boxShadow: '0 2px 8px rgba(179, 232, 240, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(179, 232, 240, 0.5)'
                    }}
                  >
                    Show Only {community} Users
                  </button>
                  {allUsers.length > 0 && (
                    <button
                      onClick={handleAssociateAllUsers}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shadow-md"
                      style={{ 
                        backgroundColor: '#ffc299', 
                        color: '#1e3a8a',
                        boxShadow: '0 2px 8px rgba(255, 194, 153, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 194, 153, 0.5)'
                      }}
                    >
                      {loading ? 'Associating...' : `Associate All ${allUsers.length} Users`}
                    </button>
                  )}
                  <p className="text-xs text-yellow-700">
                    Select individual users below and click "Associate" to add them to {community}, or use "Associate All" to associate all users at once.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {users.length === 0 && !showAllUsers ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No users found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {community 
              ? `No users found for "${community}". Users may not have community associations set up yet.`
              : 'Get started by adding a new user.'}
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
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-gray-500">
                  Account ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-gray-500">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wide text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(showAllUsers ? allUsers : users).map((user) => {
                const isAssociating = associatingUsers.has(user.id)
                // Handle both null and string 'null' cases
                const userCommunity = (user.community && user.community !== 'null') ? user.community : null
                const isAssociatedWithThisCommunity = userCommunity && userCommunity.toLowerCase() === (community || '').toLowerCase()
                const hasOtherCommunity = userCommunity && !isAssociatedWithThisCommunity
                
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${isAssociatedWithThisCommunity ? 'bg-green-50' : ''}`}>
                    <td className="whitespace-nowrap px-6 py-5 text-base font-mono text-gray-900">
                      {user.accountId || user.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-base text-gray-900">
                      {user.displayName || user.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-base text-gray-500">
                      {user.email || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-base text-gray-500">
                      {user.phoneNumber || user.phone || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-base text-gray-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    {showAllUsers && (
                      <td className="whitespace-nowrap px-6 py-5 text-base text-gray-500">
                        {isAssociatedWithThisCommunity ? (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                            ✓ {user.community}
                          </span>
                        ) : hasOtherCommunity ? (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                            {user.community}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600">
                            Not set
                          </span>
                        )}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {showAllUsers && community && !isAssociatedWithThisCommunity && (
                          <button
                            onClick={() => handleAssociateUser(user.id)}
                            disabled={isAssociating}
                            className="text-sm px-3 py-1 rounded-md text-white transition hover:opacity-90 disabled:opacity-50 font-medium"
                            style={{ 
                              backgroundColor: '#b3e8f0', 
                              color: '#1e3a8a',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            }}
                            title={`Associate with ${community}`}
                          >
                            {isAssociating ? 'Associating...' : 'Associate'}
                          </button>
                        )}
                        {showAllUsers && community && isAssociatedWithThisCommunity && (
                          <span className="text-xs text-green-600 font-medium">Associated</span>
                        )}
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
                          className="text-red-600 hover:text-red-900"
                          title="Delete user"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

