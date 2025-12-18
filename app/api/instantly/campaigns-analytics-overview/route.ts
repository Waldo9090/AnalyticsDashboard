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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignIds, workspaceId, startDate, endDate } = body

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return NextResponse.json(
        { error: 'campaignIds array is required' },
        { status: 400 }
      )
    }

    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured for selected workspace' },
        { status: 500 }
      )
    }

    // Build query parameters for analytics overview
    const params = new URLSearchParams()
    campaignIds.forEach(id => params.append('ids', id))
    if (startDate) {
      params.append('start_date', startDate)
    }
    if (endDate) {
      params.append('end_date', endDate)
    }
    params.append('expand_crm_events', 'true') // Include all CRM events

    const response = await fetch(
      `${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics/overview?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Analytics Overview API Error:', errorData)
      return NextResponse.json(
        { error: errorData.message || `HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // The Instantly API returns an object with campaign_id as keys when using 'ids' parameter
    // Convert to array format for easier consumption
    let analyticsArray: any[] = []
    
    if (Array.isArray(data)) {
      analyticsArray = data
    } else if (typeof data === 'object' && data !== null) {
      // Convert object with campaign_id keys to array
      analyticsArray = Object.entries(data).map(([campaignId, metrics]: [string, any]) => ({
        campaign_id: campaignId,
        ...metrics
      }))
    }

    return NextResponse.json(analyticsArray)
    
  } catch (error) {
    console.error('Campaigns Analytics Overview API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

