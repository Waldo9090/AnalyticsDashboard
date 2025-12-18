"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Mail, BarChart3, Inbox, FileText, Server } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CampaignAnalytics {
  campaign_name: string
  campaign_id: string
  campaign_status: number
  leads_count: number
  contacted_count: number
  emails_sent_count: number
  open_count: number
  reply_count: number
  link_click_count: number
  bounced_count: number
  unsubscribed_count: number
  completed_count: number
  total_opportunities: number
  total_opportunity_value: number
}

interface Campaign {
  id: string
  name: string
  campaignId: string
  workspaceId: string
  workspaceName: string
  category: 'roger' | 'reachify' | 'prusa'
  analytics: CampaignAnalytics
}

interface UnifiedAnalyticsData {
  campaigns: Campaign[]
  totals: CampaignAnalytics
  categories: {
    roger: number
    reachify: number
    prusa: number
  }
}

interface UnifiedCampaignDashboardProps {
  category?: 'all' | 'roger' | 'reachify' | 'prusa'
  startDate?: string
  endDate?: string
}

export function UnifiedCampaignDashboard({ category = 'all', startDate, endDate }: UnifiedCampaignDashboardProps) {
  const [data, setData] = useState<UnifiedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('analytics')

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (category !== 'all') params.append('category', category)
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)

        const response = await fetch(`/api/instantly/unified-analytics?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch analytics')
        }

        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        console.error('Error fetching unified analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [category, startDate, endDate])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-200 dark:bg-slate-700 h-32 rounded-xl"></div>
            ))}
          </div>
          <div className="bg-slate-200 dark:bg-slate-700 h-96 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <div className="text-red-600 dark:text-red-400 font-medium mb-2">Error Loading Analytics</div>
        <div className="text-red-500 dark:text-red-300 text-sm">{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">No Analytics Data</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">No analytics data available for the selected criteria.</p>
      </div>
    )
  }

  const { totals, campaigns } = data

  // Calculate percentages
  const openRate = totals.emails_sent_count > 0 ? ((totals.open_count / totals.emails_sent_count) * 100) : 0
  const replyRate = totals.emails_sent_count > 0 ? ((totals.reply_count / totals.emails_sent_count) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-sm">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'analytics'
              ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'inbox'
              ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox
        </button>
        <button
          onClick={() => setActiveTab('frameworks')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'frameworks'
              ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          Email Frameworks
        </button>
        <button
          onClick={() => setActiveTab('mailboxes')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'mailboxes'
              ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Server className="w-4 h-4" />
          Mailboxes
        </button>
      </div>

      {/* Performance Overview - Top Metrics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Performance Overview</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Absolute</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Emails Sent */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Emails Sent</span>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                +{Math.round((totals.emails_sent_count / Math.max(totals.contacted_count, 1)) * 100)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {totals.emails_sent_count.toLocaleString()}
            </div>
          </div>

          {/* Replies */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-slate-600">Replies</span>
              <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {replyRate.toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {totals.reply_count.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              ({replyRate.toFixed(1)}%)
            </div>
          </div>

          {/* Opens */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-slate-600">Opens</span>
              <div className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {openRate.toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {totals.open_count.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              ({openRate.toFixed(1)}%)
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-slate-600">Opportunities</span>
              <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ${totals.total_opportunity_value.toLocaleString()}
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {totals.total_opportunities}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              (${totals.total_opportunity_value.toLocaleString()} total)
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Campaign Breakdown */}
          <Card className="p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Campaign Analytics Breakdown</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Campaign</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Workspace</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Leads</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Emails Sent</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Opens</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Replies</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Opportunities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {campaigns.map((campaign) => {
                    const analytics = campaign.analytics
                    const campaignOpenRate = analytics.emails_sent_count > 0 ? ((analytics.open_count / analytics.emails_sent_count) * 100) : 0
                    const campaignReplyRate = analytics.emails_sent_count > 0 ? ((analytics.reply_count / analytics.emails_sent_count) * 100) : 0
                    
                    return (
                      <tr key={campaign.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-2">
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-100 text-sm">{campaign.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{campaign.category}</div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm text-slate-600 dark:text-slate-300">{campaign.workspaceName}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{analytics.leads_count?.toLocaleString() || 0}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{analytics.emails_sent_count?.toLocaleString() || 0}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{analytics.open_count?.toLocaleString() || 0}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">({campaignOpenRate.toFixed(1)}%)</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{analytics.reply_count?.toLocaleString() || 0}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">({campaignReplyRate.toFixed(1)}%)</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{analytics.total_opportunities || 0}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">${(analytics.total_opportunity_value || 0).toLocaleString()}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'inbox' && (
        <Card className="p-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">Inbox Management</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Unified inbox functionality coming soon.
          </p>
        </Card>
      )}

      {activeTab === 'frameworks' && (
        <Card className="p-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">Email Frameworks</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Email template and framework management coming soon.
          </p>
        </Card>
      )}

      {activeTab === 'mailboxes' && (
        <Card className="p-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <Server className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">Mailboxes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Mailbox management and configuration coming soon.
          </p>
        </Card>
      )}
    </div>
  )
}