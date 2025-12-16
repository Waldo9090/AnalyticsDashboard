'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { UnifiedCampaignsDashboard } from "@/components/unified-campaigns-dashboard"
import { Loader2, LogOut, AlertCircle } from "lucide-react"

interface UserPermissions {
  isAdmin: boolean
  allowedCampaigns: string[]
}

export default function PrusaCampaignsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [permissionLoading, setPermissionLoading] = useState(true)
  const [isAdminAuth, setIsAdminAuth] = useState(false)
  const [isRegularUserAuth, setIsRegularUserAuth] = useState(false)

  // EMERGENCY ADMIN BYPASS - Check localStorage immediately
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let storedUserData = null
  try {
    storedUserData = storedUser ? JSON.parse(storedUser) : null
  } catch (e) {
    console.error('Error parsing stored user:', e)
  }
  
  // Check for both possible admin emails (localStorage + Firebase)
  const isEmergencyAdmin = (storedUserData && (
    storedUserData.email === 'adimahna@gmail.com' || 
    storedUserData.email === 'adimstuff@gmail.com'
  )) || (user && (
    user.email === 'adimahna@gmail.com' || 
    user.email === 'adimstuff@gmail.com'
  ))
  
  console.log('🚨 EMERGENCY ADMIN CHECK (PRUSA):', { 
    isEmergencyAdmin, 
    storedUser: storedUser ? 'exists' : 'none',
    storedEmail: storedUserData?.email,
    storedUserData: storedUserData
  })

  useEffect(() => {
    console.log('🔍 First useEffect - Auth check (PRUSA):', { user: user?.email, loading, isAdminAuth, isEmergencyAdmin })
    
    // Skip all auth checks if emergency admin
    if (isEmergencyAdmin) {
      console.log('🚨 SKIPPING AUTH CHECK - Emergency admin detected (PRUSA)')
      return
    }
    
    // Check localStorage for any user (admin or regular)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        console.log('🔍 Found stored user:', userData.email)
        if (userData.email === 'adimahna@gmail.com' || userData.email === 'adimstuff@gmail.com') {
          console.log('✅ Setting admin auth to true')
          setIsAdminAuth(true)
          return // Don't do Firebase checks for admin
        } else {
          console.log('✅ Setting regular user auth to true for:', userData.email)
          setIsRegularUserAuth(true)
          return // Don't do Firebase checks for localStorage users
        }
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }

    // Firebase auth check only if no localStorage user
    if (!loading && !user && !isAdminAuth && !isRegularUserAuth) {
      console.log('❌ No user found, redirecting to signin')
      router.push('/signin')
    }
  }, [user, loading, router, isAdminAuth, isEmergencyAdmin, isRegularUserAuth])

  useEffect(() => {
    console.log('🔍 Second useEffect - Permission check trigger (PRUSA):', { 
      hasUser: !!user, 
      loading, 
      isAdminAuth, 
      isRegularUserAuth,
      userEmail: user?.email,
      isEmergencyAdmin 
    })
    
    // Skip all permission checks if emergency admin
    if (isEmergencyAdmin) {
      console.log('🚨 SKIPPING PERMISSION CHECK - Emergency admin detected (PRUSA)')
      return
    }
    
    if ((user && !loading) || isAdminAuth || isRegularUserAuth) {
      console.log('✅ Conditions met, calling checkUserPermissions')
      checkUserPermissions()
    } else {
      console.log('❌ Conditions not met for permission check')
    }
  }, [user, loading, isAdminAuth, isRegularUserAuth, isEmergencyAdmin])

  const checkUserPermissions = async () => {
    try {
      let email, password
      
      // Use localStorage data for both admin and regular users
      if (isAdminAuth || isRegularUserAuth) {
        console.log('📱 Using localStorage for user auth')
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          email = userData.email
          // Get password from sessionStorage (not localStorage) - cleared on tab close
          password = typeof window !== 'undefined' ? sessionStorage.getItem('userPassword') || '' : ''
          console.log('📱 Retrieved credentials:', { email, hasPassword: !!password })
        }
        
        // For admin users, set permissions directly without API call
        if ((isAdminAuth && (email === 'adimahna@gmail.com' || email === 'adimstuff@gmail.com')) || 
            (user && (user.email === 'adimahna@gmail.com' || user.email === 'adimstuff@gmail.com'))) {
          console.log('✅ ADMIN BYPASS: Setting admin permissions directly for prusa-campaigns')
          setUserPermissions({
            isAdmin: true,
            allowedCampaigns: ['roger', 'reachify', 'prusa', 'unified']
          })
          setPermissionLoading(false)
          console.log('✅ ADMIN BYPASS: Permissions set and loading disabled')
          return
        }
        
        // For regular users, also skip API call and use localStorage data directly  
        if (isRegularUserAuth && email) {
          console.log('✅ REGULAR USER BYPASS: Using localStorage data directly for:', email)
          // Use the stored user data to set permissions without API call
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            setUserPermissions({
              isAdmin: false,
              allowedCampaigns: userData.allowedCampaigns || []
            })
            setPermissionLoading(false)
            console.log('✅ REGULAR USER: Permissions set from localStorage', userData.allowedCampaigns)
            return
          }
        }
      } else {
        console.log('🔥 Using Firebase user data')
        email = user?.email
        password = 'firebase-auth' // Placeholder for Firebase users
        console.log('🔥 Retrieved Firebase credentials:', { email })
      }

      if (!email) {
        console.log('❌ No email found, redirecting to signin')
        router.push('/signin')
        return
      }

      // If password is missing from sessionStorage, redirect to signin
      if (!password && (isAdminAuth || isRegularUserAuth)) {
        console.log('❌ No password found in sessionStorage, redirecting to signin')
        localStorage.removeItem('user')
        router.push('/signin')
        return
      }

      const response = await fetch('/api/user-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        setUserPermissions({
          isAdmin: data.isAdmin,
          allowedCampaigns: data.allowedCampaigns || []
        })

        // Check if user has access to prusa campaigns
        if (!data.isAdmin && !data.allowedCampaigns?.includes('prusa')) {
          // Redirect to a campaign they do have access to, or show error
          if (data.allowedCampaigns?.length > 0) {
            const firstAllowedCampaign = data.allowedCampaigns[0]
            router.push(`/${firstAllowedCampaign}-campaigns`)
          } else {
            router.push('/signin') // No access to any campaigns
          }
        }
      } else {
        router.push('/signin')
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
      router.push('/signin')
    } finally {
      setPermissionLoading(false)
    }
  }

  // EMERGENCY ADMIN BYPASS - Render immediately for admin
  if (isEmergencyAdmin) {
    console.log('🚨 EMERGENCY ADMIN RENDER BYPASS (PRUSA)')
    return (
      <div className="flex min-h-screen bg-white dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader />
          <main className="p-8">
            <UnifiedCampaignsDashboard defaultCategory="prusa" title="PRUSA Campaigns Dashboard" />
          </main>
        </div>
      </div>
    )
  }

  if ((loading && !isAdminAuth && !isRegularUserAuth) || permissionLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500 dark:text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading PRUSA campaigns...</p>
        </div>
      </div>
    )
  }

  if ((!user && !isAdminAuth && !isRegularUserAuth) || !userPermissions) {
    return null
  }

  // If user is not admin, show simplified layout without sidebar
  const isAdmin = userPermissions.isAdmin

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Simple header for regular users */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div>
                <div className="font-semibold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  PRUSA Campaigns
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Welcome, {isAdminAuth ? 'Admin User' : (isRegularUserAuth ? storedUserData?.displayName || storedUserData?.email : (user?.displayName || user?.email))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl hover:bg-red-100 dark:hover:bg-red-900 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => {
                  localStorage.removeItem('user')
                  router.push('/signin')
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          <UnifiedCampaignsDashboard defaultCategory="prusa" title="PRUSA Campaigns Dashboard" />
        </main>
      </div>
    )
  }

  // Admin layout with sidebar
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-8">
          <UnifiedCampaignsDashboard defaultCategory="prusa" title="PRUSA Campaigns Dashboard" />
        </main>
      </div>
    </div>
  )
}