import { NextRequest, NextResponse } from 'next/server'

const INSTANTLY_BASE_URL = 'https://api.instantly.ai'

// Get API key based on workspace selection
function getApiKeyForWorkspace(workspaceId: string | null) {
  if (!workspaceId) {
    return process.env.INSTANTLY_API_KEY
  }
  
  switch (workspaceId) {
    case '1':
      return process.env.INSTANTLY_API_KEY_1
    case '2':
      return process.env.INSTANTLY_API_KEY_2
    case '3':
      return process.env.INSTANTLY_API_KEY_3
    case '4':
      return process.env.INSTANTLY_API_KEY_4
    default:
      return process.env.INSTANTLY_API_KEY
  }
}

// Workspace configuration - now fetch all campaigns dynamically
const WORKSPACE_CONFIG = [
  {
    workspaceId: '1',
    workspaceName: 'Wings Over Campaign', 
    category: 'roger',
    apiKeyIndex: '1'
  },
  {
    workspaceId: '2', 
    workspaceName: 'Paramount Realty USA',
    category: 'prusa',
    apiKeyIndex: '2'
  },
  {
    workspaceId: '3',
    workspaceName: 'Workspace 3',
    category: 'workspace3', 
    apiKeyIndex: '3'
  },
  {
    workspaceId: '4',
    workspaceName: 'Reachify (5 accounts)',
    category: 'reachify',
    apiKeyIndex: '4'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('=== Unified Analytics API Request ===')
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const category = searchParams.get('category') // 'roger', 'reachify', 'prusa', 'all'
    
    console.log('Request params:', { startDate, endDate, category })

    let campaignsToFetch: any[] = []

    // Get all campaigns from all workspaces
    for (const workspace of WORKSPACE_CONFIG) {
      // Skip if filtering by category and this workspace doesn't match
      if (category && category !== 'all' && workspace.category !== category) {
        continue
      }

      try {
        const apiKey = getApiKeyForWorkspace(workspace.workspaceId)
        if (!apiKey) {
          console.warn(`No API key for workspace ${workspace.workspaceId}`)
          continue
        }

        const params = new URLSearchParams()
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)

        const response = await fetch(
          `${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          
          // Filter campaigns based on workspace category
          let filteredData = data
          if (workspace.category === 'prusa') {
            // For PRUSA workspace, filter to specific allowed campaigns
            const allowedPrusaCampaigns = [
              'Candytrail Past Compass',
              'PRUSA external company 7.9M+',
              'PRUSA New Compass Leads',
              'PRUSA Compass 7.9M+',
              'PRUSA Target Company 7.9M+',
              'PRUSA Florida Campaign'
            ]
            
            filteredData = data.filter((campaign: any) => 
              allowedPrusaCampaigns.includes(campaign.campaign_name) ||
              campaign.campaign_id === '43daa37e-1973-4e90-b8d5-5f218885e12d' // PRUSA New York
            )
          }
          
          // Add filtered campaigns from this workspace
          const workspaceCampaigns = filteredData.map((campaign: any) => ({
            id: `${workspace.category}-${campaign.campaign_id}`,
            name: campaign.campaign_name,
            campaignId: campaign.campaign_id,
            workspaceId: workspace.workspaceId,
            workspaceName: workspace.workspaceName,
            category: workspace.category,
            analytics: campaign
          }))
          
          campaignsToFetch = [...campaignsToFetch, ...workspaceCampaigns]
        } else {
          console.warn(`Failed to fetch campaigns for workspace ${workspace.workspaceId}: ${response.status}`)
        }
      } catch (error) {
        console.warn(`Error fetching campaigns for workspace ${workspace.workspaceId}:`, error)
      }
    }


    // Fetch analytics for each campaign
    const analyticsPromises = campaignsToFetch.map(async (campaign) => {
      const apiKey = getApiKeyForWorkspace(campaign.workspaceId)
      
      if (!apiKey) {
        console.warn(`No API key for workspace ${campaign.workspaceId}`)
        return null
      }

      try {
        const params = new URLSearchParams()
        params.append('id', campaign.campaignId)
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)
        params.append('exclude_total_leads_count', 'true') // For faster response

        const response = await fetch(
          `${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          console.warn(`Failed to fetch analytics for campaign ${campaign.campaignId}: ${response.status}`)
          return null
        }

        const data = await response.json()
        const analytics = data[0] // Analytics endpoint returns array

        return {
          ...campaign,
          analytics: analytics || {}
        }
      } catch (error) {
        console.warn(`Error fetching analytics for campaign ${campaign.campaignId}:`, error)
        return null
      }
    })

    // Wait for all analytics to be fetched
    const results = await Promise.all(analyticsPromises)
    const campaigns = results.filter(result => result !== null)

    // Calculate totals across all campaigns
    const totals = campaigns.reduce((acc, campaign) => {
      const analytics = campaign.analytics || {}
      return {
        leads_count: acc.leads_count + (analytics.leads_count || 0),
        contacted_count: acc.contacted_count + (analytics.contacted_count || 0),
        emails_sent_count: acc.emails_sent_count + (analytics.emails_sent_count || 0),
        open_count: acc.open_count + (analytics.open_count || 0),
        reply_count: acc.reply_count + (analytics.reply_count || 0),
        link_click_count: acc.link_click_count + (analytics.link_click_count || 0),
        bounced_count: acc.bounced_count + (analytics.bounced_count || 0),
        unsubscribed_count: acc.unsubscribed_count + (analytics.unsubscribed_count || 0),
        completed_count: acc.completed_count + (analytics.completed_count || 0),
        total_opportunities: acc.total_opportunities + (analytics.total_opportunities || 0),
        total_opportunity_value: acc.total_opportunity_value + (analytics.total_opportunity_value || 0)
      }
    }, {
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
    })

    return NextResponse.json({
      campaigns,
      totals,
      categories: {
        roger: campaigns.filter(c => c.category === 'roger').length,
        reachify: campaigns.filter(c => c.category === 'reachify').length,
        prusa: campaigns.filter(c => c.category === 'prusa').length
      },
      message: `Fetched analytics for ${campaigns.length} campaigns`
    })
    
  } catch (error) {
    console.error('Unified Analytics API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}