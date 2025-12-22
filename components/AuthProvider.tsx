'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthenticatedCommunity, isAuthenticated } from '@/lib/auth'

interface AuthContextType {
  community: string | null
  setCommunity: (community: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default context value for when not authenticated
const defaultAuthContext: AuthContextType = {
  community: null,
  setCommunity: () => {},
  logout: () => {},
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [community, setCommunityState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication on mount and route changes
    const checkAuth = () => {
      if (isAuthenticated()) {
        const comm = getAuthenticatedCommunity()
        setCommunityState(comm)
      } else {
        setCommunityState(null)
        // Redirect to login if not on login page
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  const setCommunity = (comm: string | null) => {
    setCommunityState(comm)
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_authenticated')
      localStorage.removeItem('admin_community')
      setCommunityState(null)
      router.push('/login')
    }
  }

  // Allow access to login page without auth
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Don't render children until auth is checked (except login page)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  // Require authentication for all other pages
  if (!community) {
    return null // Will redirect to login
  }

  // Always provide the context, even if not authenticated (for login page)
  // This allows Navigation to work on login page
  return (
    <AuthContext.Provider value={{ community, setCommunity, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  // Return default context if not available (for login page)
  return context || defaultAuthContext
}

