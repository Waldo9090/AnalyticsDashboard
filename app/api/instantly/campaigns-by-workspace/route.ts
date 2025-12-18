import { NextRequest, NextResponse } from 'next/server'

const INSTANTLY_BASE_URL = 'https://api.instantly.ai'

// Get API key for workspace
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

export async function GET(request: NextRequest) {
  try {
    console.log('=== Campaigns by Workspace API Request ===')
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    
    console.log('Requested workspace:', workspaceId)

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key found for workspace ${workspaceId}` },
        { status: 404 }
      )
    }

    // Fetch campaigns for this workspace
    const response = await fetch(
      `${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch campaigns: ${response.status}`)
    }

    const campaignsData = await response.json()
    
    // Transform campaigns to include workspace info
    const campaigns = campaignsData.map((campaign: any) => ({
      id: campaign.campaign_id,
      campaignId: campaign.campaign_id,
      name: campaign.campaign_name,
      status: campaign.campaign_status,
      workspaceId: workspaceId,
      workspaceName: getWorkspaceName(workspaceId),
      category: getWorkspaceCategory(workspaceId),
      analytics: {
        leads_count: campaign.leads_count || 0,
        emails_sent_count: campaign.emails_sent_count || 0,
        reply_count: campaign.reply_count || 0,
        open_count: campaign.open_count || 0,
        contacted_count: campaign.contacted_count || 0,
        bounced_count: campaign.bounced_count || 0,
        unsubscribed_count: campaign.unsubscribed_count || 0,
        total_opportunities: campaign.total_opportunities || 0,
        total_opportunity_value: campaign.total_opportunity_value || 0,
      }
    }))

    // Filter campaigns based on workspace-specific rules
    let filteredCampaigns = campaigns
    
    if (workspaceId === '2') {
      // PRUSA workspace - filter to specific campaigns
      const allowedPrusaCampaigns = [
        'Candytrail Past Compass',
        'PRUSA external company 7.9M+',
        'PRUSA New Compass Leads',
        'PRUSA Compass 7.9M+',
        'PRUSA Target Company 7.9M+',
        'PRUSA Florida Campaign'
      ]
      filteredCampaigns = campaigns.filter((campaign: any) => 
        allowedPrusaCampaigns.includes(campaign.name)
      )
    } else if (workspaceId === '1') {
      // Roger workspace - filter to specific campaigns
      const allowedRogerCampaigns = [
        'Roger New Real Estate Leads',
        'Roger Real Estate Offices',
        'Roger Hospitals Chapel Hill'
      ]
      filteredCampaigns = campaigns.filter((campaign: any) => 
        allowedRogerCampaigns.some(allowed => campaign.name.includes(allowed.replace('Roger ', '')))
      )
    }

    return NextResponse.json({
      campaigns: filteredCampaigns,
      workspaceId: workspaceId,
      workspaceName: getWorkspaceName(workspaceId),
      total: filteredCampaigns.length,
      message: `Found ${filteredCampaigns.length} campaigns in workspace ${workspaceId}`
    })

  } catch (error) {
    console.error('Campaigns by Workspace API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getWorkspaceName(workspaceId: string): string {
  switch (workspaceId) {
    case '1':
      return 'Wings Over Campaign (Roger)'
    case '2':
      return 'Paramount Realty USA (PRUSA)'
    case '3':
      return 'Workspace 3'
    case '4':
      return 'Reachify (5 accounts)'
    default:
      return `Workspace ${workspaceId}`
  }
}

function getWorkspaceCategory(workspaceId: string): string {
  switch (workspaceId) {
    case '1':
      return 'roger'
    case '2':
      return 'prusa'
    case '4':
      return 'reachify'
    default:
      return 'other'
  }
}