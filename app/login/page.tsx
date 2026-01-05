'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [communityName, setCommunityName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [checkingCommunity, setCheckingCommunity] = useState(false)

  // Check if community exists when name changes
  useEffect(() => {
    const checkCommunity = async () => {
      if (communityName.trim().length < 3) {
        setIsRegistering(false)
        return
      }

      setCheckingCommunity(true)
      try {
        const response = await fetch(`/api/communities?name=${encodeURIComponent(communityName.trim())}`)
        const data = await response.json()
        setIsRegistering(!data.exists)
      } catch (err) {
        // If check fails, allow both login and register
        console.error('Error checking community:', err)
      } finally {
        setCheckingCommunity(false)
      }
    }

    const timeoutId = setTimeout(checkCommunity, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [communityName])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!communityName.trim() || !password.trim()) {
        setError('Please enter both community name and password')
        setLoading(false)
        return
      }

      if (isRegistering) {
        // Registration flow
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters long')
          setLoading(false)
          return
        }

        const response = await fetch('/api/communities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            communityName: communityName.trim(),
            password,
            action: 'register',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Registration failed')
          setLoading(false)
          return
        }

        // Registration successful, now log them in
        localStorage.setItem('admin_community', communityName.trim())
        localStorage.setItem('admin_authenticated', 'true')
        router.push('/')
        router.refresh()
      } else {
        // Login flow
        const response = await fetch('/api/communities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            communityName: communityName.trim(),
            password,
            action: 'login',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Login failed')
          setLoading(false)
          return
        }

        // Login successful
        localStorage.setItem('admin_community', communityName.trim())
        localStorage.setItem('admin_authenticated', 'true')
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-16">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-4xl font-bold text-white drop-shadow-md">
            Community Connect Admin
          </h2>
          <p className="mt-2 text-center text-base text-white drop-shadow-md">
            {isRegistering 
              ? 'Create an account to manage your community content'
              : 'Sign in to manage your community content'}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/20 backdrop-blur-sm border border-red-500/30 p-4">
              <div className="text-sm text-white">{error}</div>
            </div>
          )}
          <div className="rounded-lg bg-white/10 backdrop-blur-md p-8 shadow-lg border border-white/20 space-y-6">
            <div>
              <label htmlFor="community" className="block text-base font-medium text-white mb-2">
                Community Name
              </label>
              <input
                id="community"
                name="community"
                type="text"
                required
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full rounded-md border border-white/30 bg-white/20 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition"
                placeholder="e.g., Elsipogtog First Nation"
                disabled={loading || checkingCommunity}
              />
              {checkingCommunity && (
                <p className="mt-1 text-xs text-white/70">Checking...</p>
              )}
              {!checkingCommunity && communityName.trim().length >= 3 && (
                <p className="mt-1 text-xs text-white/70">
                  {isRegistering 
                    ? '✓ New community - you can create an account'
                    : '✓ Community found - please log in'}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-base font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/30 bg-white/20 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition"
                placeholder={isRegistering ? "Create a password (min 6 characters)" : "Enter your password"}
                disabled={loading}
              />
              {isRegistering && password.length > 0 && password.length < 6 && (
                <p className="mt-1 text-xs text-red-200">Password must be at least 6 characters</p>
              )}
            </div>
            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="block text-base font-medium text-white mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-white/30 bg-white/20 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-200">Passwords do not match</p>
                )}
              </div>
            )}
            <div>
              <button
                type="submit"
                disabled={loading || checkingCommunity}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50 bg-[#001638] border border-white/30 shadow-lg"
              >
                {isRegistering ? (
                  <>
                    <UserPlus className="h-5 w-5" />
                    {loading ? 'Creating account...' : 'Create Account'}
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    {loading ? 'Signing in...' : 'Sign In'}
                  </>
                )}
              </button>
            </div>
            {!checkingCommunity && communityName.trim().length >= 3 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering)
                    setError(null)
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="text-sm text-white hover:text-white/80 underline"
                >
                  {isRegistering 
                    ? 'Already have an account? Sign in instead'
                    : "Don't have an account? Register here"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

