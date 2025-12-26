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
  {
    id: 'roger-real-estate-official',
    name: 'Roger Real Estate Official',
    campaignId: '2d3a8573-8e95-4497-a72d-d70e7f4176f2',
    workspaceId: '1',
    workspaceName: 'Wings Over Campaign',
    category: 'roger'
  },
  {
    id: 'roger-campaign-7451e173',
    name: 'Roger Campaign',
    campaignId: '7451e173-09d4-4ccb-ad1e-8912e5a2c239',
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
    console.log('=== Email Templates API Request ===')
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // 'roger', 'reachify', 'prusa', 'all'
    const campaignId = searchParams.get('campaign_id') // optional specific campaign
    
    console.log('Request params:', { category, campaignId })

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

    console.log(`Processing ${campaignsToSearch.length} campaigns:`, campaignsToSearch.map(c => c.name))

    // Helper function to add delay between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Rate limit tracking
    let consecutiveRateLimits = 0
    const MAX_CONSECUTIVE_RATE_LIMITS = 2

    // Helper function to retry API calls with exponential backoff and proper 429 handling
    async function retryWithBackoff<T>(
      fn: () => Promise<Response>,
      maxRetries: number = 5,
      baseDelay: number = 2000
    ): Promise<Response> {
      let lastResponse: Response | null = null
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            // Calculate delay based on response status
            let delayMs = baseDelay * Math.pow(2, attempt - 1)
            
            // If we have a Retry-After header from previous attempt, use it
            if (lastResponse?.headers.has('Retry-After')) {
              const retryAfter = parseInt(lastResponse.headers.get('Retry-After') || '0', 10)
              if (retryAfter > 0) {
                delayMs = Math.max(retryAfter * 1000, 10000) // At least 10 seconds, or Retry-After value
                console.log(`Rate limited. Waiting ${retryAfter} seconds as specified by Retry-After header`)
              }
            } else if (lastResponse?.status === 429) {
              // For 429 errors without Retry-After, use aggressive exponential backoff
              delayMs = Math.max(10000, baseDelay * Math.pow(4, attempt - 1)) // Start at 10 seconds, then 40s, 160s
              console.log(`Rate limited (429). Waiting ${delayMs / 1000}s before retry (attempt ${attempt + 1}/${maxRetries + 1})`)
            }
            
            console.log(`Retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${maxRetries + 1})`)
            await delay(delayMs)
          }
          
          const response = await fn()
          lastResponse = response
          
          // Check for rate limit BEFORE throwing error
          if (response.status === 429) {
            consecutiveRateLimits++
            console.warn(`Rate limit hit (429). Consecutive rate limits: ${consecutiveRateLimits}/${MAX_CONSECUTIVE_RATE_LIMITS}`)
            
            // If we've hit too many consecutive rate limits, stop processing
            if (consecutiveRateLimits >= MAX_CONSECUTIVE_RATE_LIMITS) {
              throw new Error(`HTTP 429: Too many consecutive rate limits. Please wait before retrying.`)
            }
            
            // Continue to retry logic
            continue
          }
          
          // Reset consecutive rate limits on success
          consecutiveRateLimits = 0
          
          // Check for other error statuses
          if (!response.ok) {
            // Don't retry on certain error types
            if ([401, 403, 404].includes(response.status)) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            // For other errors, throw but allow retry
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          return response
        } catch (error) {
          // If it's not a Response error, rethrow
          if (!(error instanceof Error && error.message.includes('HTTP'))) {
            throw error
          }
          
          // Extract status code from error message
          const statusMatch = error.message.match(/HTTP (\d+)/)
          const status = statusMatch ? parseInt(statusMatch[1], 10) : null
          
          if (status === 429) {
            consecutiveRateLimits++
            console.warn(`Rate limit hit (429). Consecutive rate limits: ${consecutiveRateLimits}/${MAX_CONSECUTIVE_RATE_LIMITS}`)
            
            if (consecutiveRateLimits >= MAX_CONSECUTIVE_RATE_LIMITS) {
              throw new Error(`HTTP 429: Too many consecutive rate limits. Please wait before retrying.`)
            }
            
            // Continue to next retry attempt
            if (attempt < maxRetries) {
              continue
            }
          }
          
          // Don't retry on certain error types
          if (status && [401, 403, 404].includes(status)) {
            throw error
          }
          
          console.warn(`Attempt ${attempt + 1} failed:`, error)
          
          // If we've exhausted retries, throw
          if (attempt === maxRetries) {
            throw error
          }
        }
      }
      
      throw new Error(`Failed after ${maxRetries + 1} attempts`)
    }

    // Process campaigns to get their email templates
    const allEmailTemplates: Array<{
      id: string
      campaignName: string
      campaignId: string
      workspaceName: string
      category: string
      subsequenceId: string
      subsequenceName: string
      sequenceIndex: number
      stepIndex: number
      variantIndex: number
      subject: string
      body: string
      step_name: string
      variant_name: string
      delay?: number
      step_type: string
    }> = []
    
    for (let index = 0; index < campaignsToSearch.length; index++) {
      const campaign = campaignsToSearch[index]
      const apiKey = getApiKeyForWorkspace(campaign.workspaceId)
      
      if (!apiKey) {
        console.warn(`No API key for workspace ${campaign.workspaceId}`)
        continue
      }

      // Add delay for rate limiting - conservative delays to prevent rate limits
      if (index > 0) {
        // Progressive delay: longer delays as we process more campaigns
        const baseDelay = 3000 // 3 seconds base
        const progressiveDelay = Math.min(index * 500, 10000) // Up to 10 seconds max
        const delayMs = baseDelay + progressiveDelay
        console.log(`Waiting ${delayMs / 1000}s before processing next campaign (${index + 1}/${campaignsToSearch.length})`)
        await delay(delayMs)
      }
      
      // Check if we've hit too many rate limits - stop processing if so
      if (consecutiveRateLimits >= MAX_CONSECUTIVE_RATE_LIMITS) {
        console.warn(`Stopping campaign processing due to excessive rate limits`)
        break
      }

      try {
        console.log(`\n=== Processing Campaign: ${campaign.name} (${campaign.campaignId}) ===`)
        
        // Try different approaches to get email templates
        
        // Approach 1: Get campaign details and look for sequences
        try {
          console.log('Approach 1: Fetching campaign details...')
          const campaignResponse = await retryWithBackoff(async () => {
            return await fetch(
              `${INSTANTLY_BASE_URL}/api/v2/campaigns/${campaign.campaignId}`,
              {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            )
          })

          const campaignData = await campaignResponse.json()
          console.log('Campaign structure keys:', Object.keys(campaignData))
          
          // Look for sequences directly in campaign data
          // According to API docs: "Even though this field is an array, only the first element is used"
          if (campaignData.sequences && campaignData.sequences.length > 0) {
            const sequence = campaignData.sequences[0] // Only use first sequence
            const steps = sequence.steps || []
            console.log(`Found ${steps.length} steps in campaign main sequence`)
            
            steps.forEach((step: any, stepIndex: number) => {
              // Ensure step has variants
              if (!step.variants || step.variants.length === 0) {
                console.warn(`Step ${stepIndex + 1} has no variants, skipping`)
                return
              }
              
              // Process each variant - include ALL variants, even disabled ones
              step.variants.forEach((variant: any, variantIndex: number) => {
                // Get subject and body - use empty string if not provided (don't use defaults)
                const subject = variant.subject ?? ''
                const body = variant.body ?? ''
                
                // Log for debugging
                console.log(`Adding template: Step ${stepIndex + 1}, Variant ${variantIndex + 1}, Delay: ${step.delay ?? 'none'}, Disabled: ${variant.v_disabled || false}, Subject length: ${subject.length}, Body length: ${body.length}`)
                
                allEmailTemplates.push({
                  id: `${campaign.campaignId}-main-seq-${stepIndex}-${variantIndex}`,
                  campaignName: campaign.name,
                  campaignId: campaign.campaignId,
                  workspaceName: campaign.workspaceName,
                  category: campaign.category,
                  subsequenceId: 'main-sequence',
                  subsequenceName: sequence.name || 'Main Sequence',
                  sequenceIndex: 1,
                  stepIndex: stepIndex + 1,
                  variantIndex: variantIndex + 1,
                  subject: subject, // Preserve original subject, even if empty
                  body: body, // Preserve original body content exactly as returned from API
                  step_name: step.name || `Step ${stepIndex + 1}`,
                  variant_name: variant.name || `Variant ${variantIndex + 1}`,
                  delay: step.delay !== undefined ? step.delay : (stepIndex === 0 ? 0 : undefined), // Delay is days to wait before NEXT email
                  step_type: step.type || 'email'
                })
              })
            })
          }

          // Look for subsequences
          if (campaignData.subsequences && campaignData.subsequences.length > 0) {
            console.log(`Found ${campaignData.subsequences.length} subsequences`)
            
            for (const subsequence of campaignData.subsequences) {
              try {
                console.log(`Fetching subsequence: ${subsequence.id}`)
                const subseqResponse = await retryWithBackoff(async () => {
                  return await fetch(
                    `${INSTANTLY_BASE_URL}/api/v2/subsequences/${subsequence.id}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                      },
                    }
                  )
                })

                const subseqData = await subseqResponse.json()
                console.log('Subsequence structure keys:', Object.keys(subseqData))
                console.log('Subsequence name:', subseqData.name)
                console.log('Subsequence sequences count:', subseqData.sequences?.length || 0)
                
                // According to API docs: "Even though this field is an array, only the first element is used"
                if (subseqData.sequences && subseqData.sequences.length > 0) {
                  const sequence = subseqData.sequences[0] // Only use first sequence
                  const steps = sequence.steps || []
                  console.log(`Found ${steps.length} steps in subsequence ${subseqData.name}`)
                  
                  steps.forEach((step: any, stepIndex: number) => {
                    // Ensure step has variants
                    if (!step.variants || step.variants.length === 0) {
                      console.warn(`Subsequence step ${stepIndex + 1} has no variants, skipping`)
                      return
                    }
                    
                    // Process each variant - include ALL variants, even disabled ones
                    step.variants.forEach((variant: any, variantIndex: number) => {
                      // Get subject and body - use empty string if not provided (don't use defaults)
                      const subject = variant.subject ?? ''
                      const body = variant.body ?? ''
                      
                      // Log for debugging
                      console.log(`Adding template from subsequence: Step ${stepIndex + 1}, Variant ${variantIndex + 1}, Delay: ${step.delay ?? 'none'}, Disabled: ${variant.v_disabled || false}, Subject length: ${subject.length}, Body length: ${body.length}`)
                      
                      allEmailTemplates.push({
                        id: `${campaign.campaignId}-${subsequence.id}-${stepIndex}-${variantIndex}`,
                        campaignName: campaign.name,
                        campaignId: campaign.campaignId,
                        workspaceName: campaign.workspaceName,
                        category: campaign.category,
                        subsequenceId: subsequence.id,
                        subsequenceName: subseqData.name || subsequence.name || `Subsequence ${subsequence.id}`,
                        sequenceIndex: 1, // Always 1 since we only use sequences[0]
                        stepIndex: stepIndex + 1,
                        variantIndex: variantIndex + 1,
                        subject: subject, // Preserve original subject, even if empty
                        body: body, // Preserve original body content exactly as returned from API
                        step_name: step.name || `Step ${stepIndex + 1}`,
                        variant_name: variant.name || `Variant ${variantIndex + 1}`,
                        delay: step.delay !== undefined ? step.delay : (stepIndex === 0 ? 0 : undefined), // Delay is days to wait before NEXT email
                        step_type: step.type || 'email'
                      })
                    })
                  })
                } else {
                  console.warn(`Subsequence ${subsequence.id} has no sequences`)
                }

                // Increased delay between subsequence requests to avoid rate limits
                await delay(2000) // 2 seconds between subsequences
              } catch (subseqError) {
                console.warn(`Error fetching subsequence ${subsequence.id}:`, subseqError)
              }
            }
          }

          // If no templates found yet, look for other email content in campaign data
          if (allEmailTemplates.filter(t => t.campaignId === campaign.campaignId).length === 0) {
            console.log('No templates found in sequences/subsequences, looking for other email content...')
            
            // Check for email content in other places
            if (campaignData.steps) {
              campaignData.steps.forEach((step: any, stepIndex: number) => {
                if (step.subject || step.body || step.content) {
                  console.log(`Adding template from campaign steps: ${step.subject}`)
                  allEmailTemplates.push({
                    id: `${campaign.campaignId}-step-${stepIndex}`,
                    campaignName: campaign.name,
                    campaignId: campaign.campaignId,
                    workspaceName: campaign.workspaceName,
                    category: campaign.category,
                    subsequenceId: 'main',
                    subsequenceName: 'Main Sequence',
                    sequenceIndex: 1,
                    stepIndex: stepIndex + 1,
                    variantIndex: 1,
                    subject: step.subject || step.title || 'No Subject',
                    body: step.body || step.content || 'No Content',
                    step_name: step.name || `Step ${stepIndex + 1}`,
                    variant_name: 'Default',
                    step_type: 'email'
                  })
                }
              })
            }

            // If still no content, create a placeholder to show the campaign exists
            if (allEmailTemplates.filter(t => t.campaignId === campaign.campaignId).length === 0) {
              console.log('No email content found, creating placeholder...')
              allEmailTemplates.push({
                id: `${campaign.campaignId}-placeholder`,
                campaignName: campaign.name,
                campaignId: campaign.campaignId,
                workspaceName: campaign.workspaceName,
                category: campaign.category,
                subsequenceId: 'unknown',
                subsequenceName: 'Unknown Structure',
                sequenceIndex: 1,
                stepIndex: 1,
                variantIndex: 1,
                subject: 'Email content structure not found',
                body: `Campaign: ${campaign.name}\nWorkspace: ${campaign.workspaceName}\nCategory: ${campaign.category}\n\nThis campaign exists but its email content structure could not be determined from the available APIs. The campaign may use a different email structure or may not have email sequences configured.`,
                step_name: 'Unknown',
                variant_name: 'Unknown',
                step_type: 'email'
              })
            }
          }

        } catch (campaignError) {
          console.warn(`Error processing campaign ${campaign.campaignId}:`, campaignError)
          
          // Create error placeholder
          allEmailTemplates.push({
            id: `${campaign.campaignId}-error`,
            campaignName: campaign.name,
            campaignId: campaign.campaignId,
            workspaceName: campaign.workspaceName,
            category: campaign.category,
            subsequenceId: 'error',
            subsequenceName: 'Error Loading',
            sequenceIndex: 1,
            stepIndex: 1,
            variantIndex: 1,
            subject: 'Error loading email content',
            body: `Campaign: ${campaign.name}\nError: ${campaignError instanceof Error ? campaignError.message : 'Unknown error'}\n\nThis campaign could not be loaded. This may be due to API permissions, network issues, or campaign configuration.`,
            step_name: 'Error',
            variant_name: 'Error',
            step_type: 'email'
          })
        }

      } catch (error) {
        console.warn(`Error processing campaign ${campaign.campaignId}:`, error)
      }
    }

    console.log(`\n=== Final Results ===`)
    console.log(`Total email templates found: ${allEmailTemplates.length}`)
    console.log(`Campaigns processed: ${campaignsToSearch.length}`)
    console.log('Templates by campaign:')
    campaignsToSearch.forEach(campaign => {
      const count = allEmailTemplates.filter(t => t.campaignId === campaign.campaignId).length
      console.log(`  ${campaign.name}: ${count} templates`)
    })

    return NextResponse.json({
      emailTemplates: allEmailTemplates,
      total: allEmailTemplates.length,
      campaigns: campaignsToSearch.length,
      message: `Found ${allEmailTemplates.length} email templates across ${campaignsToSearch.length} campaigns`
    })
    
  } catch (error) {
    console.error('Email Templates API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}