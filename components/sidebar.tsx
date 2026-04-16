"use client"
import { BarChart3, Target, Layers, Home, Zap, Database, Plus, MoreVertical, Trash2, Folder, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface CustomDashboard {
  name: string
  slug: string
  selectedCampaigns: string[]
  campaigns: any[]
  primaryCategory: string
  createdAt: string
  isActive: boolean
}

interface UserPermissions {
  isAdmin: boolean
  allowedCampaigns: string[]
}

export function Sidebar() {
  const pathname = usePathname()
  const [customDashboards, setCustomDashboards] = useState<CustomDashboard[]>([])
  const [loadingDashboards, setLoadingDashboards] = useState(true)
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  // Main navigation items - only show for admin users
  const allMainItems = [
    { icon: Home, label: "Overview", href: "/dashboard" },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  ]

  // Filter main items based on user permissions (admin only)
  const mainItems = userPermissions?.isAdmin ? allMainItems : []

  // Campaign items with color coding - filtered by user permissions
  const allCampaignItems = [
    { icon: Target, label: "Roger", href: "/roger-campaigns", color: "bg-blue-500", campaignId: "roger" },
    { icon: Zap, label: "Reachify", href: "/reachify-campaigns", color: "bg-green-500", campaignId: "reachify" },
    { icon: Database, label: "PRUSA", href: "/prusa-campaigns", color: "bg-purple-500", campaignId: "prusa" },
    { icon: Database, label: "Cloudlea", href: "/new-campaign-campaigns", color: "bg-orange-500", campaignId: "cloudlea" },
    { icon: Sparkles, label: "Root Signals", href: "/root-signals-campaigns", color: "bg-teal-500", campaignId: "root-signals" },
  ]

  // Filter campaigns based on user permissions (Root Signals is visible to any user with sidebar access)
  const campaignItems = userPermissions 
    ? allCampaignItems.filter(item => 
        userPermissions.isAdmin ||
        item.campaignId === "root-signals" ||
        userPermissions.allowedCampaigns.includes(item.campaignId)
      )
    : []

  // Create Dashboard item
  const createDashboardItem = { icon: Plus, label: "Create Dashboard", href: "/create-dashboard" }

  useEffect(() => {
    fetchUserPermissions()
    fetchCustomDashboards()
  }, [])

  const fetchUserPermissions = async () => {
    try {
      // Get user from localStorage (from signin)
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        // If no user in localStorage, assume admin for now (fallback)
        setUserPermissions({ isAdmin: true, allowedCampaigns: ['roger', 'reachify', 'prusa', 'unified'] })
        setLoadingPermissions(false)
        return
      }

      const user = JSON.parse(userStr)
      const response = await fetch('/api/user-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
      })

      if (response.ok) {
        const data = await response.json()
        setUserPermissions({
          isAdmin: data.isAdmin,
          allowedCampaigns: data.allowedCampaigns || []
        })
      } else {
        // If permission check fails, assume admin (fallback)
        setUserPermissions({ isAdmin: true, allowedCampaigns: ['roger', 'reachify', 'prusa', 'unified'] })
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error)
      // If there's an error, assume admin (fallback)
      setUserPermissions({ isAdmin: true, allowedCampaigns: ['roger', 'reachify', 'prusa', 'unified'] })
    } finally {
      setLoadingPermissions(false)
    }
  }

  const fetchCustomDashboards = async () => {
    try {
      const response = await fetch('/api/dashboards')
      if (response.ok) {
        const data = await response.json()
        setCustomDashboards(data.dashboards || [])
      }
    } catch (error) {
      console.error('Failed to fetch custom dashboards:', error)
    } finally {
      setLoadingDashboards(false)
    }
  }

  const deleteDashboard = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" dashboard?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dashboards?slug=${slug}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the dashboard list
        await fetchCustomDashboards()
        
        // If we're currently on the deleted dashboard, redirect to unified campaigns
        if (pathname === `/${slug}-campaigns`) {
          window.location.href = '/unified-campaigns'
        }
      } else {
        const error = await response.json()
        alert(`Failed to delete dashboard: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      alert('Failed to delete dashboard')
    }
  }


  return (
    <aside className="w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-200">
      {/* Logo Section */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">Candytrail</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Analytics</div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {/* Main Navigation - Admin Only */}
        {mainItems.length > 0 && (
          <div className="space-y-1 mb-6">
            {mainItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  )} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* Campaigns Section */}
        {campaignItems.length > 0 && (
          <div className="mb-6">
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campaigns</h3>
            </div>
            <div className="space-y-1">
              {campaignItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      isActive ? item.color : "bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500"
                    )} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Unified Campaigns - Show for admin or users with unified access */}
        {(userPermissions?.isAdmin || userPermissions?.allowedCampaigns.includes('unified')) && (
          <div className="mb-6">
            <div className="space-y-1">
              <Link
                href="/unified-campaigns"
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/unified-campaigns"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Layers className={cn(
                  "w-4 h-4 transition-colors",
                  pathname === "/unified-campaigns" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                )} />
                <span>Unified Campaigns</span>
              </Link>
            </div>
          </div>
        )}

        {/* Custom Dashboards Section - Admin Only */}
        {userPermissions?.isAdmin && !loadingDashboards && customDashboards.length > 0 && (
          <div className="mb-6">
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custom Dashboards</h3>
            </div>
            <div className="space-y-1">
              {customDashboards.map((dashboard) => {
                const dashboardHref = `/${dashboard.slug}-campaigns`
                const isActive = pathname === dashboardHref
                
                return (
                  <div key={dashboard.slug} className="group relative">
                    <Link
                      href={dashboardHref}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 pr-8",
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      <Folder className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      )} />
                      <span className="truncate text-xs">{dashboard.name}</span>
                      {isActive && (
                        <div className="absolute right-8 w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                      )}
                    </Link>
                    
                    {/* Three dots menu */}
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <MoreVertical className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <DropdownMenuItem
                            onClick={() => deleteDashboard(dashboard.slug, dashboard.name)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Create Dashboard Section - Admin Only */}
        {userPermissions?.isAdmin && (
          <div className="mb-6">
            <div className="space-y-1">
              <Link
                href={createDashboardItem.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === createDashboardItem.href
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <createDashboardItem.icon className={cn(
                  "w-4 h-4 transition-colors",
                  pathname === createDashboardItem.href ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                )} />
                <span>{createDashboardItem.label}</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom section with subtle branding */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
          v2.1.0
        </div>
      </div>
    </aside>
  )
}