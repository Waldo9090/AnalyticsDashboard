"use client"

import { useState } from "react"
import { UnifiedCampaignDashboard } from "@/components/unified-campaign-dashboard"
import { CampaignBreakdown } from "@/components/campaign-breakdown"
import { CampaignMessages } from "@/components/campaign-messages"
import { CampaignFilter } from "@/components/campaign-filter"
import { InboxFilters } from "@/components/inbox-filters"
import { InboxEmailList } from "@/components/inbox-email-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card } from "@/components/ui/card"
import { Mail, BarChart3, TrendingUp, Inbox } from "lucide-react"

export default function UnifiedCampaignsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'roger' | 'reachify' | 'prusa'>('all')
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [inboxFilters, setInboxFilters] = useState<string[]>([])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Unified Campaign Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">Combined analytics across Roger, Reachify, and PRUSA campaigns</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Category Filter */}
            <Card className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Campaign Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Campaigns</option>
                <option value="roger">Roger Campaigns</option>
                <option value="reachify">Reachify Campaigns</option>
                <option value="prusa">PRUSA Campaigns</option>
              </select>
            </Card>

            {/* Campaign Filter */}
            <Card className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Specific Campaign</label>
              <CampaignFilter 
                selectedCampaignId={selectedCampaignId}
                onCampaignChange={setSelectedCampaignId}
                workspaceId={null}
              />
            </Card>

            {/* Date Range Filter */}
            <Card className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End Date"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setSelectedTab("overview")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              selectedTab === "overview"
                ? "bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setSelectedTab("breakdown")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              selectedTab === "breakdown"
                ? "bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Campaign Breakdown
          </button>
          <button
            onClick={() => setSelectedTab("inbox")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              selectedTab === "inbox"
                ? "bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inbox
          </button>
          <button
            onClick={() => setSelectedTab("messages")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              selectedTab === "messages"
                ? "bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Mail className="w-4 h-4" />
            Campaign Messages
          </button>
        </div>

        {/* Content Sections */}
        {selectedTab === "inbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Inbox Filters */}
            <div className="lg:col-span-1">
              <InboxFilters
                selectedFilters={inboxFilters}
                onFiltersChange={setInboxFilters}
              />
            </div>
            
            {/* Inbox Content */}
            <div className="lg:col-span-3">
              <InboxEmailList
                selectedFilters={inboxFilters}
                campaignId={selectedCampaignId}
                workspaceId={null}
              />
            </div>
          </div>
        )}

        {selectedTab === "overview" && (
          <UnifiedCampaignDashboard 
            category={selectedCategory}
            startDate={dateRange.startDate || undefined}
            endDate={dateRange.endDate || undefined}
          />
        )}
        
        {selectedTab === "breakdown" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <CampaignBreakdown 
                  campaignId={selectedCampaignId} 
                  workspaceId={null} 
                  dateRange="30" 
                />
              </div>
              <div>
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Campaign Messages</h3>
                  {selectedCampaignId ? (
                    <CampaignMessages 
                      campaignId={selectedCampaignId}
                      workspaceId={''}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-slate-500 dark:text-slate-400">
                        <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">Select a Campaign</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Choose a specific campaign to view its email messages and sequences.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedTab === "messages" && (
          <div className="space-y-6">
            {selectedCampaignId ? (
              <CampaignMessages 
                campaignId={selectedCampaignId}
                workspaceId={''}
              />
            ) : (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-12 shadow-sm text-center">
                <div className="text-slate-500 dark:text-slate-400">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">Select a Campaign</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Choose a specific campaign to view its email messages and sequences.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}