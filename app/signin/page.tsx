'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth()
  const router = useRouter()

  // Clear any stored credentials on mount to force fresh login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear any stored user credentials (including session indicators)
      localStorage.removeItem('user')
      sessionStorage.removeItem('userPassword')
      // Sign out from Firebase to clear any active session
      // This ensures users must login through this page every time
      if (auth) {
        auth.signOut().catch(() => {
          // Ignore errors if already signed out
        })
      }
    }
  }, [])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check for admin authentication using our user system
      if (email === 'adimahna@gmail.com' && password === 'admin123') {
        // Store session indicator (email only, no password in localStorage) for navigation
        // Password stored in sessionStorage (cleared on tab close) for API calls only
        localStorage.setItem('user', JSON.stringify({
          email: email,
          displayName: 'Admin User',
          loginTime: Date.now(),
          isAdmin: true
        }))
        sessionStorage.setItem('userPassword', password)
        toast.success('Signed in successfully!')
        router.push('/dashboard')
        return
      }

      // This hardcoded check is no longer needed - remove it since we have the user system

      // Try regular user system first
      try {
        const response = await fetch('/api/user-permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        if (response.ok) {
          const userData = await response.json()
          // Store session indicator (email only, no password in localStorage) for navigation
          // Password stored in sessionStorage (cleared on tab close) for API calls only
          localStorage.setItem('user', JSON.stringify({
            email: email,
            displayName: userData.user.displayName,
            loginTime: Date.now(),
            isAdmin: userData.isAdmin,
            allowedCampaigns: userData.allowedCampaigns
          }))
          sessionStorage.setItem('userPassword', password)
          toast.success('Signed in successfully!')
          
          // Redirect to first allowed campaign or dashboard
          if (userData.allowedCampaigns?.length > 0) {
            router.push(`/${userData.allowedCampaigns[0]}-campaigns`)
          } else {
            router.push('/dashboard')
          }
          return
        }
      } catch (apiError) {
        console.log('User system auth failed, trying Firebase:', apiError)
      }

      // Fallback to Firebase authentication
      await signIn(email, password)
      toast.success('Signed in successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Signed in with Google!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Google sign in error:', error)
      toast.error(error.message || 'Google sign in failed')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-indigo-700/90 to-purple-800/90"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-16 w-24 h-24 bg-purple-400/20 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-md"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Candytrail
              <span className="block text-2xl font-medium text-indigo-200 mt-2">Analytics Dashboard</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Right Side - Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Candytrail</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Welcome back
            </h2>
            <p className="text-slate-600">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="off"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="off"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

          </form>

          {/* Footer Note */}
          <p className="text-center text-xs text-slate-500 mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}