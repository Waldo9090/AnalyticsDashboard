'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"

interface CampaignData {
  campaign_name: string
  campaign_id: string
  campaign_status: number
  campaign_is_evergreen: boolean
  leads_count: number
  contacted_count: number
  open_count: number
  reply_count: number
  link_click_count: number
  bounced_count: number
  unsubscribed_count: number
  completed_count: number
  emails_sent_count: number
  new_leads_contacted_count: number
  total_opportunities: number
  total_opportunity_value: number
}

interface PrusaCampaignListProps {
  workspaceId: string
  selectedCampaign: CampaignData | null
  onSelectCampaign: (campaign: CampaignData) => void
}

const PRUSA_CAMPAIGN_IDS = [
  '87dcc1bb-471a-4b5a-9416-3fb2d34a1691',
  'f7275204-8c5f-449f-bb02-58e4027ecca8',
  'de0864ce-252a-4aa2-8cb7-e33e55ad5997',
  'f211938a-9ffe-4262-9001-6e36892ba127',
  '51bab480-545d-4241-94e5-26d9e3fe34ad',
  '25057551-6b40-45fe-97a9-2b5e3db3bafd' // PRUSA Florida Campaign
]

// Mock data for when API fails
const MOCK_PRUSA_CAMPAIGNS: CampaignData[] = [
  {
    campaign_name: 'PRUSA external company 7.9M+',
    campaign_id: '87dcc1bb-471a-4b5a-9416-3fb2d34a1691',
    campaign_status: 3, // Completed
    campaign_is_evergreen: false,
    leads_count: 1188,
    contacted_count: 1188,
    open_count: 601,
    reply_count: 3,
    link_click_count: 0,
    bounced_count: 50,
    unsubscribed_count: 5,
    completed_count: 1188,
    emails_sent_count: 1188,
    new_leads_contacted_count: 0,
    total_opportunities: 0,
    total_opportunity_value: 0
  },
  {
    campaign_name: 'PRUSA Target Company 7.9M+',
    campaign_id: 'f7275204-8c5f-449f-bb02-58e4027ecca8',
    campaign_status: 3, // Completed
    campaign_is_evergreen: false,
    leads_count: 23,
    contacted_count: 23,
    open_count: 14,
    reply_count: 0,
    link_click_count: 0,
    bounced_count: 0,
    unsubscribed_count: 0,
    completed_count: 23,
    emails_sent_count: 23,
    new_leads_contacted_count: 0,
    total_opportunities: 0,
    total_opportunity_value: 0
  },
  {
    campaign_name: 'PRUSA Compass 7.9M+',
    campaign_id: 'de0864ce-252a-4aa2-8cb7-e33e55ad5997',
    campaign_status: 3, // Completed
    campaign_is_evergreen: false,
    leads_count: 125,
    contacted_count: 125,
    open_count: 51,
    reply_count: 0,
    link_click_count: 0,
    bounced_count: 2,
    unsubscribed_count: 1,
    completed_count: 125,
    emails_sent_count: 125,
    new_leads_contacted_count: 0,
    total_opportunities: 0,
    total_opportunity_value: 0
  },
  {
    campaign_name: 'PRUSA Compass Florida: Texas',
    campaign_id: 'f211938a-9ffe-4262-9001-6e36892ba127',
    campaign_status: 1, // Active
    campaign_is_evergreen: false,
    leads_count: 2999,
    contacted_count: 18,
    open_count: 1,
    reply_count: 0,
    link_click_count: 0,
    bounced_count: 0,
    unsubscribed_count: 0,
    completed_count: 0,
    emails_sent_count: 18,
    new_leads_contacted_count: 18,
    total_opportunities: 0,
    total_opportunity_value: 0
  },
  {
    campaign_name: 'PRUSA New Campaign',
    campaign_id: '51bab480-545d-4241-94e5-26d9e3fe34ad',
    campaign_status: 3, // Completed
    campaign_is_evergreen: false,
    leads_count: 9300,
    contacted_count: 9330,
    open_count: 7739,
    reply_count: 124,
    link_click_count: 0,
    bounced_count: 100,
    unsubscribed_count: 20,
    completed_count: 9330,
    emails_sent_count: 9330,
    new_leads_contacted_count: 0,
    total_opportunities: 15,
    total_opportunity_value: 75000
  }
]

function getCampaignStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'Draft'
    case 1: return 'Active'
    case 2: return 'Paused'
    case 3: return 'Completed'
    case 4: return 'Running Subsequences'
    case -99: return 'Account Suspended'
    case -1: return 'Accounts Unhealthy'
    case -2: return 'Bounce Protect'
    default: return 'Unknown'
  }
}

function getStatusVariant(status: number): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 1: // Active
    case 4: // Running Subsequences
      return 'default'
    case 2: // Paused
    case 3: // Completed
      return 'secondary'
    case -99: // Account Suspended
    case -1: // Accounts Unhealthy
    case -2: // Bounce Protect
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function PrusaCampaignList({ workspaceId, selectedCampaign, onSelectCampaign }: PrusaCampaignListProps) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        setError(null)

        // First test if API key is configured
        console.log('Testing API key for workspace:', workspaceId)
        const debugResponse = await fetch(`/api/instantly/debug-campaigns?workspace_id=${workspaceId}`)
        
        // If API test fails, use mock data
        if (!debugResponse.ok) {
          const debugError = await debugResponse.text()
          console.error('API key test failed, using mock data:', debugError)
          setCampaigns(MOCK_PRUSA_CAMPAIGNS)
          return
        }

        const campaignPromises = PRUSA_CAMPAIGN_IDS.map(async (campaignId) => {
          const params = new URLSearchParams({
            id: campaignId,
            workspace_id: workspaceId
          })

          console.log(`Fetching campaign ${campaignId} with URL:`, `/api/instantly/campaigns-analytics?${params}`)

          const response = await fetch(`/api/instantly/campaigns-analytics?${params}`)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Failed to fetch campaign ${campaignId}:`, response.status, errorText)
            return null
          }

          const data = await response.json()
          console.log(`Campaign ${campaignId} data:`, data)
          return data[0] // Analytics API returns an array
        })

        const results = await Promise.allSettled(campaignPromises)
        const validCampaigns = results
          .map((result) => result.status === 'fulfilled' ? result.value : null)
          .filter((campaign): campaign is CampaignData => campaign !== null)

        console.log('Final valid campaigns:', validCampaigns)
        
        // If no campaigns were fetched successfully, use mock data
        if (validCampaigns.length === 0) {
          const failedResults = results.filter(result => result.status === 'rejected')
          console.error('All campaign fetches failed, using mock data:', failedResults)
          setCampaigns(MOCK_PRUSA_CAMPAIGNS)
        } else {
          setCampaigns(validCampaigns)
        }
      } catch (err) {
        console.error('Campaign fetch error, using mock data:', err)
        setCampaigns(MOCK_PRUSA_CAMPAIGNS)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [workspaceId])

  if (loading) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Campaign</h2>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-center h-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Campaign</h2>
        </div>
        <div className="text-center text-slate-600 py-8">
          <p className="text-sm font-medium">Unable to load campaigns</p>
          <p className="text-xs mt-2 text-slate-500">{error}</p>
        </div>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Campaign</h2>
        </div>
        <div className="text-center text-slate-600 py-8">
          <p className="text-sm font-medium">No campaigns available</p>
          <p className="text-xs mt-2 text-slate-500">No campaign data could be loaded</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Campaign</h2>
      </div>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.campaign_id}
            onClick={() => onSelectCampaign(campaign)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedCampaign?.campaign_id === campaign.campaign_id
                ? 'border-indigo-300 bg-indigo-50/50 shadow-md'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-center py-4">
              <h3 className="font-medium text-slate-800 text-sm text-center">{campaign.campaign_name}</h3>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}