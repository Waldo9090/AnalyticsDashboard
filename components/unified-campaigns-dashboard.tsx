"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InterestedLeadsThreads } from "@/components/interested-leads-threads"
import { FromAddressList } from "@/components/from-address-list"
import { EmailFrameworks } from "@/components/email-frameworks"
import { UserManagement } from "@/components/user-management"
import { CampaignBreakdown } from "@/components/campaign-breakdown"
import { CampaignMessages } from "@/components/campaign-messages"
import { 
  Loader2, 
  BarChart3, 
  Inbox, 
  FileText, 
  Mail, 
  Users, 
  TrendingUp, 
  Calendar, 
  ChevronDown,
  ChevronRight,
  Settings,
  Check,
  UserCog
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  campaignId: string
  workspaceId: string
  workspaceName: string
  category: 'roger' | 'reachify' | 'prusa'
  analytics?: any
  selected: boolean
}

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

interface UnifiedCampaignsDashboardProps {
  defaultCategory?: 'roger' | 'reachify' | 'prusa' | 'all'
  title?: string
}

export function UnifiedCampaignsDashboard({ 
  defaultCategory = 'all', 
  title = "Unified Campaigns Dashboard" 
}: UnifiedCampaignsDashboardProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('analytics')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<CampaignAnalytics | null>(null)
  const [showCampaignSelector, setShowCampaignSelector] = useState(false)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Check if current user is admin (including localStorage check)
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let storedUserData = null
  try {
    storedUserData = storedUser ? JSON.parse(storedUser) : null
  } catch (e) {
    console.error('Error parsing stored user:', e)
  }
  
  const isAdmin = user?.email === 'adimahna@gmail.com' || 
                  storedUserData?.email === 'adimahna@gmail.com' ||
                  storedUserData?.email === 'adimstuff@gmail.com'

  // Toggle expanded campaign
  const toggleExpandedCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(campaignId)) {
        newExpanded.delete(campaignId)
      } else {
        newExpanded.add(campaignId)
      }
      return newExpanded
    })
  }

  // Handle campaign selection changes
  const handleCampaignToggle = (campaignId: string) => {
    setCampaigns(prev => {
      const updated = prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, selected: !campaign.selected }
          : campaign
      )
      setHasUnsavedChanges(true)
      return updated
    })
  }

  // Save campaign selections
  const saveCampaignSelections = async () => {
    if (!isAdmin) return
    
    setIsSaving(true)
    try {
      const selectedCampaignIds = campaigns
        .filter(c => c.selected)
        .map(c => c.campaignId)

      const response = await fetch('/api/admin/campaign-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: defaultCategory,
          selectedCampaigns: selectedCampaignIds
        })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        // Show success message or toast
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving campaign preferences:', error)
      // Show error message or toast
    } finally {
      setIsSaving(false)
    }
  }

  // Get selected campaigns and determine display category
  const selectedCampaigns = campaigns.filter(c => c.selected)
  const selectedCategories = [...new Set(selectedCampaigns.map(c => c.category))]
  const displayCategory = selectedCategories.length === 1 ? selectedCategories[0] : 'all'

  // Campaign IDs that should always be included in PRUSA selections
  const alwaysIncludePrusaCampaignIds = [
    'e8f31410-6020-490c-a9d0-6f5220464d42', // PRUSA CA #2
    '43daa37e-1973-4e90-b8d5-5f218885e12d'  // PRUSA New York
  ]

  // Load saved preferences
  const loadSavedPreferences = async () => {
    // First try localStorage for immediate access
    try {
      const localStorageKey = `campaign-selections-${defaultCategory}`
      const localSavedIds = localStorage.getItem(localStorageKey)
      if (localSavedIds) {
        let parsedIds = JSON.parse(localSavedIds)
        
        // For PRUSA category, ensure required campaigns are always included
        if (defaultCategory === 'prusa') {
          for (const requiredId of alwaysIncludePrusaCampaignIds) {
            if (!parsedIds.includes(requiredId) && !parsedIds.includes(`prusa-${requiredId}`)) {
              parsedIds.push(requiredId)
            }
          }
          // Update localStorage with the new IDs
          localStorage.setItem(localStorageKey, JSON.stringify(parsedIds))
        }
        
        console.log(`Loaded ${defaultCategory} campaign selections from localStorage:`, parsedIds)
        return parsedIds
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error)
    }
    
    // Fallback to API preferences
    try {
      const response = await fetch('/api/admin/campaign-preferences')
      if (response.ok) {
        const preferences = await response.json()
        let apiSavedIds = preferences[defaultCategory] || []
        
        // For PRUSA category, ensure required campaigns are always included
        if (defaultCategory === 'prusa') {
          for (const requiredId of alwaysIncludePrusaCampaignIds) {
            if (!apiSavedIds.includes(requiredId) && !apiSavedIds.includes(`prusa-${requiredId}`)) {
              apiSavedIds.push(requiredId)
            }
          }
        }
        
        // Save to localStorage for future quick access
        if (apiSavedIds.length > 0) {
          localStorage.setItem(`campaign-selections-${defaultCategory}`, JSON.stringify(apiSavedIds))
        }
        
        console.log(`Loaded ${defaultCategory} campaign selections from API:`, apiSavedIds)
        return apiSavedIds
      }
    } catch (error) {
      console.error('Error loading preferences from API:', error)
    }
    return []
  }

  useEffect(() => {
    async function fetchAllCampaigns() {
      setLoading(true)
      setError(null)
      
      try {
        // Load saved preferences first
        const savedCampaignIds = await loadSavedPreferences()
        
        const categories = ['roger', 'reachify', 'prusa']
        const allCampaignsData: Campaign[] = []
        let aggregatedTotals: CampaignAnalytics = {
          campaign_name: 'All Campaigns',
          campaign_id: 'unified',
          campaign_status: 1,
          leads_count: 0,
          contacted_count: 0,
          emails_sent_count: 0,
          open_count: 0,
          reply_count: 0,
          link_click_count: 0,
          bounced_count: 0,
          unsubscribed_count: 0,
          completed_count: 0,
          total_opportunities: 0,
          total_opportunity_value: 0
        }

        // Fetch campaigns from each category
        for (const category of categories) {
          try {
            const response = await fetch(`/api/instantly/unified-analytics?category=${category}`)
            
            if (response.ok) {
              const categoryData = await response.json()
              
              // Add campaigns with category info
              const categoryCampaigns = categoryData.campaigns?.map((campaign: any) => {
                const campaignId = campaign.id || campaign.campaign_id
                const rawCampaignId = campaign.campaignId || campaignId.replace(/^(roger|reachify|prusa)-/, '')
                const prefixedId = `${category}-${campaignId}`
                
                // Always include specific PRUSA campaigns by raw ID
                const alwaysIncludeRawIds = [
                  'e8f31410-6020-490c-a9d0-6f5220464d42', // PRUSA CA #2
                  '43daa37e-1973-4e90-b8d5-5f218885e12d' // PRUSA New York
                ]
                const shouldAlwaysInclude = alwaysIncludeRawIds.includes(rawCampaignId)
                
                // Check if this campaign is in saved preferences (check all possible ID formats)
                const isInSavedPrefs = savedCampaignIds.length > 0 
                  ? (savedCampaignIds.includes(campaignId) || 
                     savedCampaignIds.includes(prefixedId) || 
                     savedCampaignIds.includes(rawCampaignId))
                  : (defaultCategory === 'all' || defaultCategory === category)
                
                const isSelected = isInSavedPrefs || shouldAlwaysInclude
                
                return {
                  id: prefixedId,
                  name: campaign.name || campaign.campaign_name,
                  campaignId: campaignId,
                  workspaceId: campaign.workspaceId || '1',
                  workspaceName: campaign.workspaceName || 'Default Workspace',
                  category: category as 'roger' | 'reachify' | 'prusa',
                  analytics: campaign.analytics || campaign,
                  selected: isSelected
                }
              }) || []
              
              allCampaignsData.push(...categoryCampaigns)
              
              // Aggregate totals
              if (categoryData.totals) {
                const totals = categoryData.totals
                aggregatedTotals.leads_count += totals.leads_count || 0
                aggregatedTotals.contacted_count += totals.contacted_count || 0
                aggregatedTotals.emails_sent_count += totals.emails_sent_count || 0
                aggregatedTotals.open_count += totals.open_count || 0
                aggregatedTotals.reply_count += totals.reply_count || 0
                aggregatedTotals.link_click_count += totals.link_click_count || 0
                aggregatedTotals.bounced_count += totals.bounced_count || 0
                aggregatedTotals.unsubscribed_count += totals.unsubscribed_count || 0
                aggregatedTotals.completed_count += totals.completed_count || 0
                aggregatedTotals.total_opportunities += totals.total_opportunities || 0
                aggregatedTotals.total_opportunity_value += totals.total_opportunity_value || 0
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch ${category} campaigns:`, err)
          }
        }

        setCampaigns(allCampaignsData)
        setTotals(aggregatedTotals)
      } catch (err) {
        console.error('Error fetching campaigns:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
      } finally {
        setLoading(false)
      }
    }

    fetchAllCampaigns()
  }, [defaultCategory])

  const toggleCampaignSelection = (campaignId: string) => {
    setCampaigns(prev => {
      const updated = prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, selected: !campaign.selected }
          : campaign
      )
      
      // Save to localStorage immediately for persistence
      const selectedIds = updated.filter(c => c.selected).map(c => c.campaignId)
      localStorage.setItem(`campaign-selections-${defaultCategory}`, JSON.stringify(selectedIds))
      
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const selectAllCampaigns = () => {
    setCampaigns(prev => {
      const updated = prev.map(campaign => ({ ...campaign, selected: true }))
      
      // Save to localStorage
      const selectedIds = updated.map(c => c.campaignId)
      localStorage.setItem(`campaign-selections-${defaultCategory}`, JSON.stringify(selectedIds))
      
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const deselectAllCampaigns = () => {
    setCampaigns(prev => {
      const updated = prev.map(campaign => ({ ...campaign, selected: false }))
      
      // Save to localStorage
      localStorage.setItem(`campaign-selections-${defaultCategory}`, JSON.stringify([]))
      
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const selectCategoryOnly = (category: 'roger' | 'reachify' | 'prusa') => {
    setCampaigns(prev => {
      const updated = prev.map(campaign => ({ 
        ...campaign, 
        selected: campaign.category === category 
      }))
      
      // Save to localStorage immediately
      const selectedIds = updated.filter(c => c.selected).map(c => c.id)
      try {
        localStorage.setItem(`campaign-selections-${defaultCategory}`, JSON.stringify(selectedIds))
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
      
      return updated
    })
    setHasUnsavedChanges(true)
  }

  // Calculate metrics from selected campaigns with validation
  const selectedTotals = selectedCampaigns.reduce((acc, campaign) => {
    const analytics = campaign.analytics
    if (analytics) {
      const leads = analytics.leads_count || 0
      const emailsSent = analytics.emails_sent_count || 0
      const rawOpens = analytics.open_count || 0
      const rawReplies = analytics.reply_count || 0
      
      // Validate individual campaign metrics before aggregation
      const validatedOpens = Math.min(rawOpens, emailsSent)
      const validatedReplies = Math.min(rawReplies, emailsSent)
      
      acc.leads_count += leads
      acc.emails_sent_count += emailsSent
      acc.reply_count += validatedReplies
      acc.open_count += validatedOpens
      acc.total_opportunities += analytics.total_opportunities || 0
      acc.total_opportunity_value += analytics.total_opportunity_value || 0
    }
    return acc
  }, {
    leads_count: 0,
    emails_sent_count: 0,
    reply_count: 0,
    open_count: 0,
    total_opportunities: 0,
    total_opportunity_value: 0
  })

  // Additional validation for metrics not handled in aggregation
  const validatedTotals = {
    ...selectedTotals,
    // These metrics are now validated during aggregation, but add fallback validation
    bounced_count: Math.min(selectedTotals.bounced_count || 0, selectedTotals.emails_sent_count),
    unsubscribed_count: Math.min(selectedTotals.unsubscribed_count || 0, selectedTotals.emails_sent_count),
    link_click_count: Math.min(selectedTotals.link_click_count || 0, selectedTotals.open_count),
    contacted_count: Math.min(selectedTotals.contacted_count || 0, selectedTotals.leads_count)
  }

  const replyRate = validatedTotals.emails_sent_count > 0 
    ? ((validatedTotals.reply_count / validatedTotals.emails_sent_count) * 100) 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500 dark:text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading unified campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Campaign Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          <p className="text-slate-600 dark:text-slate-300">
            {selectedCampaigns.length} of {campaigns.length} campaigns selected
          </p>
        </div>
        
        
        {isAdmin && (
          <Button
            onClick={() => setShowCampaignSelector(!showCampaignSelector)}
            variant="outline"
            className="flex items-center gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Settings className="w-4 h-4" />
            Select Campaigns
            <ChevronDown className={`w-4 h-4 transition-transform ${showCampaignSelector ? 'rotate-180' : ''}`} />
          </Button>
        )}
        
      </div>

      {/* Campaign Selection Panel */}
      {isAdmin && showCampaignSelector && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Campaign Selection</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={selectAllCampaigns} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAllCampaigns} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                Deselect All
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectCategoryOnly('roger')} className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                Roger Only
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectCategoryOnly('reachify')} className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/30">
                Reachify Only
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectCategoryOnly('prusa')} className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                PRUSA Only
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
                <Checkbox
                  checked={campaign.selected}
                  onCheckedChange={() => toggleCampaignSelection(campaign.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-slate-800 dark:text-slate-100">{campaign.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {campaign.category} • {campaign.workspaceName}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Save Button */}
          {isAdmin && hasUnsavedChanges && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  ⚠️ You have unsaved changes to <span className="capitalize font-bold">{defaultCategory}</span> campaign selections.
                </div>
                <Button 
                  onClick={saveCampaignSelections}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    '💾 Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}

        </Card>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-8 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === 'analytics'
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === 'inbox'
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === 'emails'
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <FileText className="w-4 h-4" />
          Email Frameworks
        </button>
        <button
          onClick={() => setActiveTab('mailboxes')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === 'mailboxes'
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <Mail className="w-4 h-4" />
          Mailboxes
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === 'settings'
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <UserCog className="w-4 h-4" />
            Settings
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Performance Overview */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Performance Overview</h2>
            
            {/* Metrics Cards */}
            <div className="grid grid-cols-5 gap-6 mb-8">
              {/* Sourced */}
              <Card className="p-6 bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Sourced</span>
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {validatedTotals.leads_count.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  From {selectedCampaigns.length} campaigns
                </div>
              </Card>

              {/* Emails Sent */}
              <Card className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Emails Sent</span>
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {validatedTotals.emails_sent_count.toLocaleString()}
                </div>
              </Card>

              {/* Replies */}
              <Card className="p-6 bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Replies</span>
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {validatedTotals.reply_count.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  ({replyRate.toFixed(1)}%)
                </div>
              </Card>

              {/* Opens */}
              <Card className="p-6 bg-purple-50/30 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/30 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Opens</span>
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {validatedTotals.open_count.toLocaleString()}
                </div>
              </Card>

              {/* Opportunities */}
              <Card className="p-6 bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Opportunities</span>
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {validatedTotals.total_opportunities.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  ${validatedTotals.total_opportunity_value.toLocaleString()}
                </div>
              </Card>
            </div>

            {/* Selected Campaigns Table */}
            <Card className="p-6 mt-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Selected Campaigns ({selectedCampaigns.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm w-8"></th>
                      <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Campaign</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Category</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Sourced</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Emails Sent</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Replies</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-300 text-sm">Opens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {selectedCampaigns.map((campaign) => {
                      const analytics = campaign.analytics
                      const campaignReplyRate = analytics?.emails_sent_count > 0 
                        ? ((analytics.reply_count / analytics.emails_sent_count) * 100) 
                        : 0
                      const isExpanded = expandedCampaigns.has(campaign.campaignId)
                      
                      return (
                        <>
                          <tr key={campaign.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-4 px-2">
                              <button
                                onClick={() => toggleExpandedCampaign(campaign.campaignId)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                )}
                              </button>
                            </td>
                            <td className="py-4 px-2">
                              <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{campaign.name}</div>
                            </td>
                            <td className="py-4 px-2">
                              <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                campaign.category === 'roger' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                                campaign.category === 'reachify' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                                'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                              }`}>
                                {campaign.category}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {analytics?.leads_count?.toLocaleString() || 0}
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {analytics?.emails_sent_count?.toLocaleString() || 0}
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {analytics?.reply_count?.toLocaleString() || 0}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">({campaignReplyRate.toFixed(1)}%)</div>
                            </td>
                            <td className="py-4 px-2">
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {analytics?.open_count?.toLocaleString() || 0}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${campaign.id}-details`}>
                              <td colSpan={7} className="px-2 py-0">
                                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-6 my-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Campaign Breakdown */}
                                    <div>
                                      <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Campaign Breakdown</h4>
                                      <CampaignBreakdown 
                                        campaignId={campaign.campaignId.replace(/^(roger|reachify|prusa)-/, '')} 
                                        workspaceId={campaign.workspaceId} 
                                        dateRange="30" 
                                      />
                                    </div>
                                    {/* Campaign Messages */}
                                    <div>
                                      <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Campaign Messages</h4>
                                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                        <CampaignMessages 
                                          campaignId={campaign.campaignId.replace(/^(roger|reachify|prusa)-/, '')}
                                          workspaceId={campaign.workspaceId}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <InterestedLeadsThreads category={displayCategory as 'roger' | 'reachify' | 'prusa' | 'all'} />
      )}

      {activeTab === 'emails' && (
        <EmailFrameworks category={displayCategory as 'roger' | 'reachify' | 'prusa' | 'all'} />
      )}

      {activeTab === 'mailboxes' && (
        <FromAddressList category={displayCategory} />
      )}

      {activeTab === 'settings' && isAdmin && (
        <UserManagement />
      )}
    </div>
  )
}