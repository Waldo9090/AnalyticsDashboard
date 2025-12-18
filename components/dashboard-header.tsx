"use client"

import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      router.push('/signin')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-500 dark:text-slate-400">
              <rect x="2" y="2" width="5" height="5" fill="currentColor" rx="1" />
              <rect x="9" y="2" width="5" height="5" fill="currentColor" rx="1" />
              <rect x="2" y="9" width="5" height="5" fill="currentColor" rx="1" />
              <rect x="9" y="9" width="5" height="5" fill="currentColor" rx="1" />
            </svg>
          </button>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Dashboard</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Analytics</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span>Welcome, {user.displayName || user.email}</span>
            </div>
          )}

          {/* Icons */}
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <Bell className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <User className="w-5 h-5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
