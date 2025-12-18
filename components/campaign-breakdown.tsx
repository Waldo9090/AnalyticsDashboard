'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CampaignStep {
  step: string
  variant: string
  sent: number
  opened: number
  unique_opened: number
  replies: number
  unique_replies: number
  clicks: number
  unique_clicks: number
  bounced?: number
  unsubscribed?: number
  completed?: number
}

interface CampaignBreakdownData {
  campaign_id: string
  campaign_name: string
  campaign_status: number
  emails_sent_count: number
  reply_count: number
  open_count: number
  link_click_count: number
  leads_count?: number
  contacted_count?: number
  new_leads_contacted_count?: number
  open_count_unique?: number
  reply_count_unique?: number
  reply_count_automatic?: number
  reply_count_automatic_unique?: number
  link_click_count_unique?: number
  bounced_count?: number
  unsubscribed_count?: number
  completed_count?: number
  total_opportunities?: number
  total_opportunity_value?: number
  steps: CampaignStep[]
}

interface CampaignBreakdownProps {
  workspaceId?: string | null
  campaignId?: string | null
  dateRange?: string
  overviewAnalytics?: any
  detailedAnalytics?: any
}

export function CampaignBreakdown({ workspaceId, campaignId, dateRange, overviewAnalytics, detailedAnalytics }: CampaignBreakdownProps) {
  const [campaigns, setCampaigns] = useState<CampaignBreakdownData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (workspaceId) params.append('workspace_id', workspaceId)
        if (campaignId) params.append('campaign_id', campaignId)
        if (dateRange) {
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(endDate.getDate() - parseInt(dateRange))
          
          params.append('start_date', startDate.toISOString().split('T')[0])
          params.append('end_date', endDate.toISOString().split('T')[0])
        }
        
        const url = `/api/instantly/campaigns/breakdown?${params.toString()}`
        console.log('Fetching campaign breakdown from:', url)
        
        const response = await fetch(url)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch campaign breakdown')
        }
        
        const data = await response.json()
        console.log('Campaign breakdown data received:', data)
        console.log('Sample campaign bounced_count:', data[0]?.bounced_count)
        setCampaigns(data)
        
        // Auto-expand if only one campaign
        if (data.length === 1) {
          setExpandedCampaigns(new Set([data[0].campaign_id]))
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load campaign breakdown'
        setError(errorMessage)
        console.error('Failed to fetch campaign breakdown:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBreakdown()
  }, [workspaceId, campaignId, dateRange])

  const toggleCampaign = (campaignId: string) => {
    const newExpanded = new Set(expandedCampaigns)
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId)
    } else {
      newExpanded.add(campaignId)
    }
    setExpandedCampaigns(newExpanded)
  }

  const calculateReplyRate = (replies: number, sent: number) => {
    return sent > 0 ? ((replies / sent) * 100).toFixed(1) : '0.0'
  }

  const getCampaignStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-500' // Active
      case 2: return 'bg-yellow-500' // Paused
      case 3: return 'bg-blue-500' // Completed
      default: return 'bg-gray-400'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading campaign breakdown...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Breakdown Unavailable</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">Unable to load detailed campaign breakdown data</p>
          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Breakdown Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            {campaignId 
              ? 'No detailed breakdown data found for the selected campaign.' 
              : 'No campaigns found to display breakdown data.'
            }
          </p>
          <p className="text-xs text-gray-500">
            Try selecting a different {campaignId ? 'campaign' : 'workspace'} or check back later.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Campaign Breakdown</h2>
        <p className="text-sm text-gray-600">
          Detailed performance breakdown by campaign and variant
          {campaigns.length > 0 && ` • ${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} found`}
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1600px]">
          {/* Header Row */}
          <div className="grid grid-cols-[200px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px] gap-2 text-xs font-medium text-muted-foreground border-b pb-3 mb-4">
            <div>STEP</div>
            <div className="text-center">LEADS</div>
            <div className="text-center">CONTACTED</div>
            <div className="text-center">SENT</div>
            <div className="text-center">OPENED</div>
            <div className="text-center">UNIQUE OPENS</div>
            <div className="text-center">REPLIES</div>
            <div className="text-center">CLICKS</div>
            <div className="text-center">UNIQUE CLICKS</div>
            <div className="text-center">BOUNCES</div>
            <div className="text-center">COMPLETED</div>
            <div className="text-center">OPPORTUNITIES</div>
          </div>

          {/* Campaign Rows */}
          {campaigns.map((campaign) => {
            return (
            <div key={campaign.campaign_id} className="mb-4">
              {/* Main Campaign Row */}
              <div className="grid grid-cols-[200px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px] gap-2 items-center py-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded text-sm">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto font-normal justify-start"
                    onClick={() => toggleCampaign(campaign.campaign_id)}
                  >
                    {expandedCampaigns.has(campaign.campaign_id) ? (
                      <ChevronDown className="w-4 h-4 mr-2 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2 text-muted-foreground" />
                    )}
                    <div className={`w-2 h-2 rounded-full mr-2 ${getCampaignStatusColor(campaign.campaign_status)}`} />
                    <span className="font-bold">{campaign.campaign_name}</span>
                  </Button>
                </div>
                {/* Leads */}
                <div className="text-center font-medium">
                  {detailedAnalytics?.leads_count?.toLocaleString() || campaign.leads_count?.toLocaleString() || '0'}
                </div>
                {/* Contacted */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">{detailedAnalytics?.contacted_count?.toLocaleString() || campaign.contacted_count?.toLocaleString() || '0'}</span>
                  {detailedAnalytics?.leads_count > 0 && (
                    <div className="text-xs text-slate-500">
                      ({((detailedAnalytics.contacted_count / detailedAnalytics.leads_count) * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
                {/* Sent */}
                <div className="text-center font-medium">
                  {campaign.emails_sent_count?.toLocaleString() || '0'}
                </div>
                {/* Opened */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">{campaign.open_count?.toLocaleString() || '0'}</span>
                  <div className="text-xs text-slate-500">
                    {campaign.emails_sent_count ? ((campaign.open_count / campaign.emails_sent_count) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
                {/* Unique Opens */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">{detailedAnalytics?.open_count_unique?.toLocaleString() || campaign.open_count_unique?.toLocaleString() || '0'}</span>
                  {campaign.emails_sent_count > 0 && detailedAnalytics?.open_count_unique && (
                    <div className="text-xs text-slate-500">
                      ({((detailedAnalytics.open_count_unique / campaign.emails_sent_count) * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
                {/* Replies */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">{campaign.reply_count?.toLocaleString() || '0'}</span>
                  <div className="text-xs text-slate-500">
                    {calculateReplyRate(campaign.reply_count || 0, campaign.emails_sent_count || 0)}%
                  </div>
                </div>
                {/* Clicks */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">{campaign.link_click_count?.toLocaleString() || '0'}</span>
                  <div className="text-xs text-slate-500">
                    {campaign.emails_sent_count ? ((campaign.link_click_count / campaign.emails_sent_count) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
                {/* Unique Clicks */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">{detailedAnalytics?.link_click_count_unique?.toLocaleString() || campaign.link_click_count_unique?.toLocaleString() || '0'}</span>
                </div>
                {/* Bounces */}
                <div className="text-center">
                  <span className="text-red-600 dark:text-red-400">
                    {(() => {
                      // Prioritize campaign.bounced_count from /api/v2/campaigns/analytics
                      const bounces = campaign.bounced_count ?? detailedAnalytics?.bounced_count ?? 0
                      return bounces.toLocaleString()
                    })()}
                  </span>
                  {campaign.emails_sent_count > 0 && (campaign.bounced_count ?? detailedAnalytics?.bounced_count) && (
                    <div className="text-xs text-slate-500">
                      ({(((campaign.bounced_count ?? detailedAnalytics?.bounced_count ?? 0) / campaign.emails_sent_count) * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
                {/* Completed */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">
                    {(() => {
                      const completed = detailedAnalytics?.completed_count ?? campaign.completed_count ?? 0
                      return completed.toLocaleString()
                    })()}
                  </span>
                  {(detailedAnalytics?.leads_count ?? campaign.leads_count) > 0 && (detailedAnalytics?.completed_count ?? campaign.completed_count) && (
                    <div className="text-xs text-slate-500">
                      ({(((detailedAnalytics?.completed_count ?? campaign.completed_count ?? 0) / (detailedAnalytics?.leads_count ?? campaign.leads_count ?? 1)) * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
                {/* Opportunities */}
                <div className="text-center">
                  <span className="text-slate-700 dark:text-slate-200">{campaign.total_opportunities?.toLocaleString() || detailedAnalytics?.total_opportunities?.toLocaleString() || '0'}</span>
                </div>
              </div>

              {/* Expanded Step/Variant Rows */}
              {expandedCampaigns.has(campaign.campaign_id) && campaign.steps?.map((step, stepIndex) => (
                <div key={`${campaign.campaign_id}-${stepIndex}`} className="grid grid-cols-[200px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px] gap-2 items-center py-1 hover:bg-gray-25 dark:hover:bg-slate-800/30 text-sm overflow-x-auto">
                  <div className="pl-8 text-muted-foreground font-medium">
                    {step.variant}
                  </div>
                  {/* Leads - N/A for steps */}
                  <div className="text-center text-slate-400">-</div>
                  {/* Contacted - N/A for steps */}
                  <div className="text-center text-slate-400">-</div>
                  {/* Sent */}
                  <div className="text-center">
                    {step.sent?.toLocaleString() || '0'}
                  </div>
                  {/* Opened */}
                  <div className="text-center">
                    <span className="text-slate-700 dark:text-slate-200">{step.opened?.toLocaleString() || '0'}</span>
                    <div className="text-xs text-slate-500">
                      {step.sent ? ((step.opened / step.sent) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                  {/* Unique Opens */}
                  <div className="text-center">
                    <span className="text-slate-700 dark:text-slate-200">{step.unique_opened?.toLocaleString() || '0'}</span>
                    {step.sent > 0 && step.unique_opened && (
                      <div className="text-xs text-slate-500">
                        ({((step.unique_opened / step.sent) * 100).toFixed(1)}%)
                      </div>
                    )}
                  </div>
                  {/* Replies */}
                  <div className="text-center">
                    <span className="text-slate-700 dark:text-slate-200">{step.replies?.toLocaleString() || '0'}</span>
                    <div className="text-xs text-slate-500">
                      {calculateReplyRate(step.replies || 0, step.sent || 0)}%
                    </div>
                  </div>
                  {/* Clicks */}
                  <div className="text-center">
                    <span className="text-slate-700 dark:text-slate-200">{step.clicks?.toLocaleString() || '0'}</span>
                    <div className="text-xs text-slate-500">
                      {step.sent ? ((step.clicks / step.sent) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                  {/* Unique Clicks */}
                  <div className="text-center">
                    <span className="text-slate-700 dark:text-slate-200">{step.unique_clicks?.toLocaleString() || '0'}</span>
                  </div>
                  {/* Bounces - N/A for steps */}
                  <div className="text-center text-slate-400">-</div>
                  {/* Completed - N/A for steps */}
                  <div className="text-center text-slate-400">-</div>
                  {/* Opportunities - N/A for steps */}
                  <div className="text-center text-slate-400">-</div>
                </div>
              ))}
            </div>
          )
          })}

          {/* Summary Row */}
          <div className="border-t pt-6 mt-6">
            {(() => {
              // Calculate totals based on what's actually displayed in each campaign row
              // This ensures consistency between individual rows and totals
              let totalLeads = 0
              let totalContacted = 0
              let totalSent = 0
              let totalOpened = 0
              let totalUniqueOpens = 0
              let totalReplies = 0
              let totalClicks = 0
              let totalUniqueClicks = 0
              let totalBounces = 0
              let totalCompleted = 0
              let totalOpportunities = 0

              campaigns.forEach((campaign) => {
                // Use the exact same logic as displayed in each row to ensure consistency
                // Match the exact fallback order and operators (|| vs ??) used in display
                
                // Leads: detailedAnalytics?.leads_count || campaign.leads_count || '0'
                totalLeads += Number(detailedAnalytics?.leads_count || campaign.leads_count || 0)
                
                // Contacted: detailedAnalytics?.contacted_count || campaign.contacted_count || '0'
                totalContacted += Number(detailedAnalytics?.contacted_count || campaign.contacted_count || 0)
                
                // Sent: campaign.emails_sent_count || '0'
                totalSent += Number(campaign.emails_sent_count || 0)
                
                // Opened: campaign.open_count || '0'
                totalOpened += Number(campaign.open_count || 0)
                
                // Unique Opens: detailedAnalytics?.open_count_unique || campaign.open_count_unique || '0'
                totalUniqueOpens += Number(detailedAnalytics?.open_count_unique || campaign.open_count_unique || 0)
                
                // Replies: campaign.reply_count || '0'
                totalReplies += Number(campaign.reply_count || 0)
                
                // Clicks: campaign.link_click_count || '0'
                totalClicks += Number(campaign.link_click_count || 0)
                
                // Unique Clicks: detailedAnalytics?.link_click_count_unique || campaign.link_click_count_unique || '0'
                totalUniqueClicks += Number(detailedAnalytics?.link_click_count_unique || campaign.link_click_count_unique || 0)
                
                // Bounces: Use campaign.bounced_count from /api/v2/campaigns/analytics, fallback to detailedAnalytics
                // Prioritize campaign.bounced_count since it comes directly from the analytics API
                totalBounces += Number(campaign.bounced_count ?? detailedAnalytics?.bounced_count ?? 0)
                
                // Completed: detailedAnalytics?.completed_count ?? campaign.completed_count ?? 0 (uses ??)
                totalCompleted += Number(detailedAnalytics?.completed_count ?? campaign.completed_count ?? 0)
                
                // Opportunities: campaign.total_opportunities || detailedAnalytics?.total_opportunities || '0'
                totalOpportunities += Number(campaign.total_opportunities || detailedAnalytics?.total_opportunities || 0)
              })
              
              return (
                <div className="grid grid-cols-[200px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px_100px] gap-2 font-semibold text-lg overflow-x-auto">
                  <div>
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-200">Totals</span>
                  </div>
                  {/* Total Leads */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalLeads.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Leads</div>
                  </div>
                  {/* Total Contacted */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalContacted.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Contacted</div>
                  </div>
                  {/* Total Sent */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalSent.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Sent</div>
                  </div>
                  {/* Total Opened */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalOpened.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Opened</div>
                  </div>
                  {/* Total Unique Opens */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalUniqueOpens.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Unique Opens</div>
                  </div>
                  {/* Total Replies */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalReplies.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Replied</div>
                  </div>
                  {/* Total Clicks */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalClicks.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Clicked</div>
                  </div>
                  {/* Total Unique Clicks */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalUniqueClicks.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Unique Clicks</div>
                  </div>
                  {/* Total Bounces */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                      {totalBounces.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Bounced</div>
                  </div>
                  {/* Total Completed */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalCompleted.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Completed</div>
                  </div>
                  {/* Total Opportunities */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {totalOpportunities.toLocaleString()}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal">Total Opportunities</div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </Card>
  )
}
