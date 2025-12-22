// Simple authentication utilities
// In production, you'd want to use proper authentication (Firebase Auth, NextAuth, etc.)

export function getAuthenticatedCommunity(): string | null {
  if (typeof window === 'undefined') return null
  const isAuthenticated = localStorage.getItem('admin_authenticated')
  const community = localStorage.getItem('admin_community')
  
  if (isAuthenticated === 'true' && community) {
    return community
  }
  return null
}

export function setAuthenticatedCommunity(community: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('admin_authenticated', 'true')
  localStorage.setItem('admin_community', community)
}

export function clearAuthentication(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_authenticated')
  localStorage.removeItem('admin_community')
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin_authenticated') === 'true'
}

