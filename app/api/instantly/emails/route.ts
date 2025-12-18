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

export async function GET(request: NextRequest) {
  try {
    console.log('=== Emails API Request ===')
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // 'roger', 'reachify', 'prusa', 'all'
    const campaignId = searchParams.get('campaign_id') // optional specific campaign
    const workspaceId = searchParams.get('workspace_id') // optional specific workspace
    const limit = parseInt(searchParams.get('limit') || '50')
    const emailType = searchParams.get('email_type') || 'all' // 'received', 'sent', 'all'
    const isUnread = searchParams.get('is_unread') // 'true' or 'false'
    const search = searchParams.get('search') // search term
    const iStatus = searchParams.get('i_status') // interest status filter
    const threadId = searchParams.get('thread_id') // specific thread ID
    
    console.log('Request params:', { category, campaignId, workspaceId, limit, emailType, isUnread, search })

    let campaignsToSearch = ALL_CAMPAIGNS

    // For PRUSA campaigns, we need to fetch them dynamically first
    let prusaCampaigns: any[] = []
    if (!category || category === 'all' || category === 'prusa') {
      try {
        const prusaApiKey = getApiKeyForWorkspace('2')
        console.log('PRUSA API Key available:', !!prusaApiKey)
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
            console.log('PRUSA campaigns fetched:', prusaData.length)
            
            // Filter to only show specific PRUSA campaigns
            const allowedPrusaCampaigns = [
              'Candytrail Past Compass',
              'PRUSA external company 7.9M+',
              'PRUSA New Compass Leads',
              'PRUSA Compass 7.9M+',
              'PRUSA Target Company 7.9M+',
              'PRUSA Florida Campaign'
            ]
            
            prusaCampaigns = prusaData
              .filter((campaign: any) => 
                allowedPrusaCampaigns.includes(campaign.campaign_name) ||
                campaign.campaign_id === '43daa37e-1973-4e90-b8d5-5f218885e12d' || // PRUSA New York
                campaign.campaign_id === '25057551-6b40-45fe-97a9-2b5e3db3bafd' // PRUSA Florida Campaign
              )
              .map((campaign: any) => ({
                id: `prusa-${campaign.campaign_id}`,
                name: campaign.campaign_name,
                campaignId: campaign.campaign_id,
                workspaceId: '2',
                workspaceName: 'Paramount Realty USA', 
                category: 'prusa'
              }))
            console.log('Filtered PRUSA campaigns:', prusaCampaigns.length, prusaCampaigns.map(c => c.name))
          } else {
            console.error('Failed to fetch PRUSA campaigns:', prusaResponse.status, await prusaResponse.text())
          }
        }
      } catch (error) {
        console.warn('Failed to fetch PRUSA campaigns:', error)
      }
    }

    // Filter campaigns by category if specified
    if (category && category !== 'all') {
      if (category === 'prusa') {
        // For PRUSA category, only use PRUSA campaigns
        campaignsToSearch = prusaCampaigns
      } else {
        // For other categories, filter from ALL_CAMPAIGNS
        campaignsToSearch = ALL_CAMPAIGNS.filter(campaign => campaign.category === category)
      }
    } else {
      // For 'all' category, combine all campaigns including PRUSA
      campaignsToSearch = [...ALL_CAMPAIGNS, ...prusaCampaigns]
    }

    // If specific campaign is provided, filter to just that campaign
    if (campaignId) {
      campaignsToSearch = campaignsToSearch.filter(campaign => campaign.campaignId === campaignId)
    }

    // Limit campaigns for all categories to avoid rate limits
    if (campaignsToSearch.length > 5) {
      campaignsToSearch = campaignsToSearch.slice(0, 5) // Only process first 5 campaigns to avoid rate limits
      console.log(`Limited to first 5 campaigns to avoid rate limits`)
    }

    // Helper function to add delay between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Helper function to retry API calls with exponential backoff - improved for rate limits
    async function retryWithBackoff<T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      baseDelay: number = 1000  // Increased base delay for rate limits
    ): Promise<T> {
      let lastError: Error | null = null
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            // For rate limit errors, use longer delays
            const isRateLimit = lastError?.message.includes('Rate limit exceeded')
            const delayMultiplier = isRateLimit ? 5 : 2 // 5x longer for rate limits
            const delayMs = baseDelay * Math.pow(delayMultiplier, attempt - 1)
            console.log(`Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
            await delay(delayMs)
          }
          
          return await fn()
        } catch (error) {
          lastError = error as Error
          
          // Don't retry on certain error types for faster failures
          if (error instanceof Error && (
            error.message.includes('401') || 
            error.message.includes('403') ||
            error.message.includes('404')
          )) {
            break
          }
          
          console.warn(`Attempt ${attempt + 1} failed:`, error)
        }
      }
      
      throw lastError
    }

    // Process campaigns sequentially to avoid overwhelming the API
    const allEmails = []
    let rateLimitHits = 0
    const maxRateLimitHits = 2 // Stop after 2 rate limit hits
    
    for (let index = 0; index < campaignsToSearch.length; index++) {
      const campaign = campaignsToSearch[index]
      const apiKey = getApiKeyForWorkspace(campaign.workspaceId)
      
      if (!apiKey) {
        console.warn(`No API key for workspace ${campaign.workspaceId}`)
        continue
      }

      // Add delay between all requests to avoid rate limits
      if (index > 0) {
        await delay(1000) // 1 second delay between each request
      }

      try {
        console.log(`\n=== Processing Campaign: ${campaign.name} (Category: ${campaign.category}) ===`)
        console.log('Campaign details:', { 
          id: campaign.campaignId, 
          workspaceId: campaign.workspaceId,
          category: campaign.category,
          name: campaign.name
        })
        
        // Build query parameters for emails API
        const params = new URLSearchParams()
        // Reduce limit to avoid rate limits
        const emailLimit = '50' // Reduced limit for all categories
        params.append('limit', emailLimit)
        params.append('campaign_id', campaign.campaignId)
        params.append('sort_order', 'desc') // Most recent first
        
        if (emailType && emailType !== 'all') {
          params.append('email_type', emailType)
        }
        
        if (isUnread === 'true') {
          params.append('is_unread', 'true')
        }
        
        if (search) {
          params.append('search', search)
        }
        
        if (iStatus !== null && iStatus !== undefined) {
          params.append('i_status', iStatus)
        }
        
        if (threadId) {
          params.append('search', `thread:${threadId}`)
        }

        console.log('Fetching emails with params:', params.toString())

        const response = await retryWithBackoff(async () => {
          const res = await fetch(
            `${INSTANTLY_BASE_URL}/api/v2/emails?${params.toString()}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (!res.ok) {
            if (res.status === 429) {
              throw new Error(`Rate limit exceeded for campaign ${campaign.campaignId}`)
            }
            if (res.status === 401) {
              throw new Error(`Unauthorized for campaign ${campaign.campaignId}`)
            }
            throw new Error(`HTTP ${res.status}: Failed to fetch emails for campaign ${campaign.campaignId}`)
          }

          return res
        })

        if (!response.ok) {
          console.warn(`Failed to fetch emails for campaign ${campaign.campaignId}: ${response.status}`)
          return []
        }

        const data = await response.json()
        
        console.log(`Received ${data.items?.length || 0} emails from campaign ${campaign.name}`)
        if (data.items?.length > 0) {
          console.log('Sample email types:', data.items.slice(0, 3).map((email: any) => ({
            ue_type: email.ue_type,
            from: email.from_address_email,
            to: email.to_address_email_list,
            subject: email.subject
          })))
        }
        
        // Add campaign info to each email
        const emails = (data.items || []).map((email: any) => ({
          id: email.id,
          from_address_email: email.from_address_email,
          to_address_email_list: email.to_address_email_list,
          subject: email.subject,
          body: email.body || { text: email.content_preview, html: null },
          timestamp_email: email.timestamp_email,
          ue_type: email.ue_type,
          campaignName: campaign.name,
          campaignId: campaign.campaignId,
          workspaceName: campaign.workspaceName,
          category: campaign.category,
          is_unread: email.is_unread,
          content_preview: email.content_preview,
          lead: email.lead,
          thread_id: email.thread_id,
          i_status: email.i_status,
          lead_first_name: email.lead_first_name,
          lead_last_name: email.lead_last_name,
          lead_company: email.lead_company
        }))

        console.log(`Processed ${emails.length} emails from campaign ${campaign.name}`)
        allEmails.push(...emails)
      } catch (error) {
        console.warn(`Error fetching emails for campaign ${campaign.campaignId}:`, error)
        
        // If we hit rate limits, increment counter and potentially break
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
          rateLimitHits++
          console.warn(`Rate limit hit ${rateLimitHits}/${maxRateLimitHits}`)
          
          if (rateLimitHits >= maxRateLimitHits) {
            console.warn(`Too many rate limits hit, stopping further campaign processing`)
            break
          }
          
          // Add extra delay after rate limit
          await delay(5000) // 5 second delay after rate limit
        }
      }
    }

    console.log(`\n=== Final Email Results Summary ===`)
    console.log(`Total campaigns processed: ${campaignsToSearch.length}`)
    console.log(`Campaign names:`, campaignsToSearch.map(c => c.name))
    console.log(`Total emails collected: ${allEmails.length}`)
    console.log(`Email types distribution:`, allEmails.reduce((acc: any, email: any) => {
      acc[email.ue_type] = (acc[email.ue_type] || 0) + 1
      return acc
    }, {}))
    console.log(`Emails with received type (ue_type=2):`, allEmails.filter((email: any) => email.ue_type === 2).length)
    console.log(`Received emails by campaign:`)
    const receivedByCompaign = allEmails.filter((email: any) => email.ue_type === 2).reduce((acc: any, email: any) => {
      acc[email.campaignName] = (acc[email.campaignName] || 0) + 1
      return acc
    }, {})
    Object.entries(receivedByCompaign).forEach(([campaign, count]) => {
      console.log(`  ${campaign}: ${count} received emails`)
    })

    // Sort by most recent email timestamp
    const sortedEmails = allEmails.sort((a, b) => {
      const aTime = new Date(a.timestamp_email || a.timestamp_created).getTime()
      const bTime = new Date(b.timestamp_email || b.timestamp_created).getTime()
      return bTime - aTime // Most recent first
    })

    // Apply limit
    const limitedEmails = sortedEmails.slice(0, limit)

    return NextResponse.json({
      emails: limitedEmails,
      total: sortedEmails.length,
      limit,
      hasMore: limit < sortedEmails.length,
      campaigns: campaignsToSearch.length,
      message: `Found ${sortedEmails.length} emails across ${campaignsToSearch.length} campaigns`
    })
    
  } catch (error) {
    console.error('Emails API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}