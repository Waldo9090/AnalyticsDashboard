'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { UnifiedCampaignsDashboard } from "@/components/unified-campaigns-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { Loader2, LogOut } from "lucide-react"

interface UserPermissions {
  isAdmin: boolean
  allowedCampaigns: string[]
}

const DASHBOARD_TITLE = "Root Signals"

export default function RootSignalsCampaignsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [permissionLoading, setPermissionLoading] = useState(true)
  const [isAdminAuth, setIsAdminAuth] = useState(false)
  const [isRegularUserAuth, setIsRegularUserAuth] = useState(false)

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let storedUserData = null
  try {
    storedUserData = storedUser ? JSON.parse(storedUser) : null
  } catch (e) {
    console.error('Error parsing stored user:', e)
  }

  const isEmergencyAdmin = (storedUserData && (
    storedUserData.email === 'adimahna@gmail.com' ||
    storedUserData.email === 'adimstuff@gmail.com'
  )) || (user && (
    user.email === 'adimahna@gmail.com' ||
    user.email === 'adimstuff@gmail.com'
  ))

  useEffect(() => {
    if (isEmergencyAdmin) {
      return
    }

    const ls = localStorage.getItem('user')
    if (ls) {
      try {
        const userData = JSON.parse(ls)
        if (userData.email === 'adimahna@gmail.com' || userData.email === 'adimstuff@gmail.com') {
          setIsAdminAuth(true)
          return
        } else {
          setIsRegularUserAuth(true)
          return
        }
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }

    if (!loading && !user && !isAdminAuth && !isRegularUserAuth) {
      router.push('/signin')
    }
  }, [user, loading, router, isAdminAuth, isEmergencyAdmin, isRegularUserAuth])

  useEffect(() => {
    if (isEmergencyAdmin) {
      return
    }

    if ((user && !loading) || isAdminAuth || isRegularUserAuth) {
      checkUserPermissions()
    }
  }, [user, loading, isAdminAuth, isRegularUserAuth, isEmergencyAdmin])

  const checkUserPermissions = async () => {
    try {
      let email: string | undefined
      let password: string | undefined

      if (isAdminAuth || isRegularUserAuth) {
        const stored = localStorage.getItem('user')
        if (stored) {
          const userData = JSON.parse(stored)
          email = userData.email
          password = typeof window !== 'undefined' ? sessionStorage.getItem('userPassword') || '' : ''
        }

        if ((isAdminAuth && (email === 'adimahna@gmail.com' || email === 'adimstuff@gmail.com')) ||
            (user && (user.email === 'adimahna@gmail.com' || user.email === 'adimstuff@gmail.com'))) {
          setUserPermissions({
            isAdmin: true,
            allowedCampaigns: ['roger', 'reachify', 'prusa', 'unified', 'root-signals']
          })
          setPermissionLoading(false)
          return
        }

        if (isRegularUserAuth && email) {
          const stored = localStorage.getItem('user')
          if (stored) {
            const userData = JSON.parse(stored)
            setUserPermissions({
              isAdmin: false,
              allowedCampaigns: userData.allowedCampaigns || []
            })
            setPermissionLoading(false)
            return
          }
        }
      } else {
        email = user?.email ?? undefined
        password = 'firebase-auth'
      }

      if (!email) {
        router.push('/signin')
        return
      }

      if (!password && (isAdminAuth || isRegularUserAuth)) {
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

  if (isEmergencyAdmin) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader />
          <main className="p-8">
            <UnifiedCampaignsDashboard sampleMode title={DASHBOARD_TITLE} />
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
          <p className="text-slate-600 dark:text-slate-300">Loading Root Signals...</p>
        </div>
      </div>
    )
  }

  if ((!user && !isAdminAuth && !isRegularUserAuth) || !userPermissions) {
    return null
  }

  const isAdmin = userPermissions.isAdmin

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div>
                <div className="font-semibold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                  {DASHBOARD_TITLE}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Welcome, {isAdminAuth ? 'Admin User' : (isRegularUserAuth ? storedUserData?.displayName || storedUserData?.email : (user?.displayName || user?.email))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
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
          <UnifiedCampaignsDashboard sampleMode title={DASHBOARD_TITLE} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-8">
          <UnifiedCampaignsDashboard sampleMode title={DASHBOARD_TITLE} />
        </main>
      </div>
    </div>
  )
}
