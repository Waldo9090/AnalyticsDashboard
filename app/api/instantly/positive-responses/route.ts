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

// All campaigns configuration combined
const ALL_CAMPAIGNS = [
  // Roger Campaigns
  {
    id: 'roger-new-real-estate-leads',
    name: 'Roger New Real Estate Leads',
    campaignId: 'd4e3c5ea-2bd6-46c2-9a32-2586cd7d1856',
    workspaceId: '1',
    workspaceName: 'Wings Over Campaign',
    category: 'roger'
  },
  {
    id: 'roger-real-estate-offices',
    name: 'Roger Real Estate Offices', 
    campaignId: '6ffe8ad9-9695-4f4d-973f-0c20425268eb',
    workspaceId: '1',
    workspaceName: 'Wings Over Campaign',
    category: 'roger'
  },
  {
    id: 'roger-hospitals-chapel-hill',
    name: 'Roger Hospitals Chapel Hill',
    campaignId: 'a59eefd0-0c1a-478d-bb2f-6216798fa757',
    workspaceId: '1', 
    workspaceName: 'Wings Over Campaign',
    category: 'roger'
  },
  // Reachify Campaigns
  {
    id: 'reachify-campaign',
    name: 'Reachify Campaign',
    campaignId: '477533b0-ad87-4f25-8a61-a296f384578e',
    workspaceId: '4',
    workspaceName: 'Reachify (5 accounts)',
    category: 'reachify'
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('=== Positive Responses API Request ===')
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // 'roger', 'reachify', 'prusa', 'all'
    const campaignId = searchParams.get('campaign_id') // optional specific campaign
    const workspaceId = searchParams.get('workspace_id') // optional specific workspace
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log('Request params:', { category, campaignId, workspaceId, limit })

    let campaignsToSearch = ALL_CAMPAIGNS

    // Filter campaigns by category if specified
    if (category && category !== 'all') {
      campaignsToSearch = ALL_CAMPAIGNS.filter(campaign => campaign.category === category)
    }

    // For PRUSA campaigns, we need to fetch them dynamically
    if (!category || category === 'all' || category === 'prusa') {
      try {
        const prusaApiKey = getApiKeyForWorkspace('2')
        if (prusaApiKey) {
          const prusaResponse = await fetch(
            `${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics`,
            {
              headers: {
                'Authorization': `Bearer ${prusaApiKey}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (prusaResponse.ok) {
            const prusaData = await prusaResponse.json()
            
            // Filter to only show specific PRUSA campaigns
            const allowedPrusaCampaigns = [
              'Candytrail Past Compass',
              'PRUSA external company 7.9M+',
              'PRUSA New Compass Leads',
              'PRUSA Compass 7.9M+',
              'PRUSA Target Company 7.9M+',
              'PRUSA Florida Campaign'
            ]
            
            const prusaCampaigns = prusaData
              .filter((campaign: any) => allowedPrusaCampaigns.includes(campaign.campaign_name))
              .map((campaign: any) => ({
                id: `prusa-${campaign.campaign_id}`,
                name: campaign.campaign_name,
                campaignId: campaign.campaign_id,
                workspaceId: '2',
                workspaceName: 'Paramount Realty USA', 
                category: 'prusa'
              }))
            campaignsToSearch = [...campaignsToSearch, ...prusaCampaigns]
          }
        }
      } catch (error) {
        console.warn('Failed to fetch PRUSA campaigns:', error)
      }
    }

    // If specific campaign is provided, filter to just that campaign
    if (campaignId) {
      campaignsToSearch = campaignsToSearch.filter(campaign => campaign.campaignId === campaignId)
    }

    // Fetch positive response leads for each campaign
    const positiveResponsesPromises = campaignsToSearch.map(async (campaign) => {
      const apiKey = getApiKeyForWorkspace(campaign.workspaceId)
      
      if (!apiKey) {
        console.warn(`No API key for workspace ${campaign.workspaceId}`)
        return []
      }

      try {
        // Fetch leads with positive responses (interested = 1 or out of office = 0)
        const response = await fetch(
          `${INSTANTLY_BASE_URL}/api/v2/leads/list`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campaign: campaign.campaignId,
              limit: Math.min(limit, 100), // API limit is 100
              // We'll filter for lt_interest_status 0 and 1 in the response processing
            })
          }
        )

        if (!response.ok) {
          console.warn(`Failed to fetch leads for campaign ${campaign.campaignId}: ${response.status}`)
          return []
        }

        const data = await response.json()
        
        // Filter for positive responses (lt_interest_status 0 or 1)
        const positiveLeads = (data.items || []).filter((lead: any) => 
          lead.lt_interest_status === 0 || lead.lt_interest_status === 1
        ).map((lead: any) => ({
          ...lead,
          campaignName: campaign.name,
          campaignId: campaign.campaignId,
          workspaceName: campaign.workspaceName
        }))

        return positiveLeads
      } catch (error) {
        console.warn(`Error fetching leads for campaign ${campaign.campaignId}:`, error)
        return []
      }
    })

    // Wait for all requests to complete
    const allResults = await Promise.all(positiveResponsesPromises)
    const allPositiveLeads = allResults.flat()

    // Sort by most recent interest change or reply
    const sortedLeads = allPositiveLeads.sort((a, b) => {
      const aTime = new Date(a.timestamp_last_interest_change || a.timestamp_last_reply || a.timestamp_updated).getTime()
      const bTime = new Date(b.timestamp_last_interest_change || b.timestamp_last_reply || b.timestamp_updated).getTime()
      return bTime - aTime // Most recent first
    })

    // Limit final results
    const limitedLeads = sortedLeads.slice(0, limit)

    return NextResponse.json({
      leads: limitedLeads,
      total: limitedLeads.length,
      message: `Found ${limitedLeads.length} positive responses across ${campaignsToSearch.length} campaigns`
    })
    
  } catch (error) {
    console.error('Positive Responses API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}