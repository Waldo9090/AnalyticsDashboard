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

export async function GET(request: NextRequest) {
  try {
    console.log('=== Campaign Breakdown API Request ===')
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    const campaignId = searchParams.get('campaign_id')
    
    console.log('Request params:', { workspaceId, campaignId })
    
    // Validate workspace ID
    if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
      console.error('Invalid workspace ID:', workspaceId)
      return NextResponse.json(
        { error: 'Invalid workspace ID provided' },
        { status: 400 }
      )
    }
    
    // Validate campaign ID
    if (!campaignId || campaignId === 'undefined' || campaignId === 'null') {
      console.error('Invalid campaign ID:', campaignId)
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }
    
    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      console.error('No API key found for workspace:', workspaceId)
      return NextResponse.json(
        { error: 'API key not configured for selected workspace' },
        { status: 500 }
      )
    }
    
    // Get both campaign analytics and step analytics
    const campaignParams = new URLSearchParams()
    if (campaignId) campaignParams.append('id', campaignId)
    
    const stepsParams = new URLSearchParams()
    if (campaignId) stepsParams.append('campaign_id', campaignId)
    
    const [campaignsResponse, stepsResponse] = await Promise.allSettled([
      // Get all campaigns analytics
      fetch(`${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics?${campaignParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }),
      // Get steps analytics
      fetch(`${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics/steps?${stepsParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
    ])

    let campaigns = []
    let steps = []

    // Handle campaigns response
    if (campaignsResponse.status === 'fulfilled') {
      if (campaignsResponse.value.ok) {
        try {
          campaigns = await campaignsResponse.value.json()
        } catch (error) {
          console.error('Error parsing campaigns response:', error)
        }
      } else {
        console.error('Campaigns API error:', campaignsResponse.value.status, campaignsResponse.value.statusText)
      }
    } else {
      console.error('Campaigns request failed:', campaignsResponse.reason)
    }
    
    // Handle steps response
    if (stepsResponse.status === 'fulfilled') {
      if (stepsResponse.value.ok) {
        try {
          steps = await stepsResponse.value.json()
        } catch (error) {
          console.error('Error parsing steps response:', error)
        }
      } else {
        console.error('Steps API error:', stepsResponse.value.status, stepsResponse.value.statusText)
      }
    } else {
      console.error('Steps request failed:', stepsResponse.reason)
    }

    console.log('Campaign data:', campaigns)
    console.log('Steps data:', steps)

    // Map variant numbers to letters for display (A-Z)
    const variantLabels: { [key: string]: string } = {
      '0': 'A',
      '1': 'B', 
      '2': 'C',
      '3': 'D',
      '4': 'E',
      '5': 'F',
      '6': 'G',
      '7': 'H',
      '8': 'I',
      '9': 'J',
      '10': 'K',
      '11': 'L',
      '12': 'M',
      '13': 'N',
      '14': 'O',
      '15': 'P',
      '16': 'Q',
      '17': 'R',
      '18': 'S',
      '19': 'T',
      '20': 'U',
      '21': 'V',
      '22': 'W',
      '23': 'X',
      '24': 'Y',
      '25': 'Z'
    }

    // Fetch subsequences using the List campaign subsequence API endpoint
    // Fetch subsequences for all campaigns in the response
    let subsequences: any[] = []
    const campaignIds = campaigns.map((c: any) => c.campaign_id).filter(Boolean)
    
    if (campaignIds.length > 0) {
      try {
        // Fetch subsequences for each campaign
        const subsequencePromises = campaignIds.map(async (cid: string) => {
          try {
            const subsequencesParams = new URLSearchParams()
            subsequencesParams.append('parent_campaign', cid)
            subsequencesParams.append('limit', '100') // Get up to 100 subsequences per campaign
            
            const subsequencesResponse = await fetch(`${INSTANTLY_BASE_URL}/api/v2/subsequences?${subsequencesParams.toString()}`, {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (subsequencesResponse.ok) {
              const subsequencesData = await subsequencesResponse.json()
              const subsequenceItems = subsequencesData.items || []
              console.log(`Found ${subsequenceItems.length} subsequences for campaign ${cid}`)
              
              // Fetch analytics for each subsequence
              const analyticsPromises = subsequenceItems.map(async (subseq: any) => {
                try {
                  // Fetch subsequence analytics
                  const analyticsParams = new URLSearchParams()
                  analyticsParams.append('id', subseq.id)
                  
                  const analyticsResponse = await fetch(`${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics?${analyticsParams.toString()}`, {
                    headers: {
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json',
                    },
                  })
                  
                  let analytics = null
                  if (analyticsResponse.ok) {
                    const analyticsData = await analyticsResponse.json()
                    analytics = Array.isArray(analyticsData) && analyticsData.length > 0 ? analyticsData[0] : null
                  }
                  
                  return {
                    id: subseq.id,
                    name: subseq.name,
                    status: subseq.status,
                    parent_campaign: subseq.parent_campaign,
                    workspace: subseq.workspace,
                    timestamp_created: subseq.timestamp_created,
                    analytics: analytics
                  }
                } catch (error) {
                  console.error(`Error fetching analytics for subsequence ${subseq.id}:`, error)
                  // Return subsequence without analytics if analytics fetch fails
                  return {
                    id: subseq.id,
                    name: subseq.name,
                    status: subseq.status,
                    parent_campaign: subseq.parent_campaign,
                    workspace: subseq.workspace,
                    timestamp_created: subseq.timestamp_created,
                    analytics: null
                  }
                }
              })
              
              return await Promise.all(analyticsPromises)
            } else {
              console.warn(`Failed to fetch subsequences for campaign ${cid}:`, subsequencesResponse.status)
              return []
            }
          } catch (error) {
            console.error(`Error fetching subsequences for campaign ${cid}:`, error)
            return []
          }
        })
        
        const allSubsequenceResults = await Promise.all(subsequencePromises)
        subsequences = allSubsequenceResults.flat().filter((s: any) => s !== null)
        console.log(`Total subsequences fetched: ${subsequences.length}`)
      } catch (error) {
        console.error(`Error fetching subsequences:`, error)
      }
    }

    // Attach steps data to each campaign
    const campaignsWithSteps = campaigns.map((campaign: any) => {
      // Filter steps for this campaign and format them
      const campaignSteps = steps
        .filter((step: any) => step.campaign_id === campaign.campaign_id || !step.campaign_id)
        .map((step: any) => ({
          step: step.step,
          variant: variantLabels[step.variant] || step.variant,
          sent: step.sent,
          opened: step.unique_opened,
          unique_opened: step.unique_opened,
          replies: step.unique_replies,
          unique_replies: step.unique_replies,
          clicks: step.unique_clicks,
          unique_clicks: step.unique_clicks
        }))
        .sort((a: any, b: any) => {
          // Sort by variant label (A, B, C, D, E)
          return a.variant.localeCompare(b.variant)
        })

      // Attach subsequences for this campaign
      const campaignSubsequences = subsequences.filter((subseq: any) => 
        subseq.parent_campaign === campaign.campaign_id
      )

      return {
        ...campaign,
        steps: campaignSteps,
        subsequences: campaignSubsequences
      }
    })
    
    return NextResponse.json(campaignsWithSteps)
    
  } catch (error) {
    console.error('Campaign Breakdown API Error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}