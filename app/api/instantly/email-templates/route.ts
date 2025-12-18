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

    // Helper function to retry API calls with exponential backoff
    async function retryWithBackoff<T>(
      fn: () => Promise<T>,
      maxRetries: number = 2,
      baseDelay: number = 300
    ): Promise<T> {
      let lastError: Error | null = null
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const delayMs = baseDelay * Math.pow(2, attempt - 1)
            console.log(`Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
            await delay(delayMs)
          }
          
          return await fn()
        } catch (error) {
          lastError = error as Error
          
          // Don't retry on certain error types
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

    // Process campaigns to get their email templates
    const allEmailTemplates = []
    
    for (let index = 0; index < campaignsToSearch.length; index++) {
      const campaign = campaignsToSearch[index]
      const apiKey = getApiKeyForWorkspace(campaign.workspaceId)
      
      if (!apiKey) {
        console.warn(`No API key for workspace ${campaign.workspaceId}`)
        continue
      }

      // Add delay for rate limiting
      if (index > 0) {
        await delay(500)
      }

      try {
        console.log(`\n=== Processing Campaign: ${campaign.name} (${campaign.campaignId}) ===`)
        
        // Try different approaches to get email templates
        
        // Approach 1: Get campaign details and look for sequences
        try {
          console.log('Approach 1: Fetching campaign details...')
          const campaignResponse = await retryWithBackoff(async () => {
            const res = await fetch(
              `${INSTANTLY_BASE_URL}/api/v2/campaigns/${campaign.campaignId}`,
              {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            )

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: Failed to fetch campaign ${campaign.campaignId}`)
            }

            return res
          })

          const campaignData = await campaignResponse.json()
          console.log('Campaign structure keys:', Object.keys(campaignData))
          
          // Look for sequences directly in campaign data
          if (campaignData.sequences) {
            console.log(`Found ${campaignData.sequences.length} sequences in campaign data`)
            campaignData.sequences.forEach((sequence: any, seqIndex: number) => {
              const steps = sequence.steps || []
              steps.forEach((step: any, stepIndex: number) => {
                if (step.variants) {
                  step.variants.forEach((variant: any, variantIndex: number) => {
                    if (variant.subject || variant.body) {
                      console.log(`Adding template from campaign sequences: ${variant.subject}`)
                      allEmailTemplates.push({
                        id: `${campaign.campaignId}-seq-${seqIndex}-${stepIndex}-${variantIndex}`,
                        campaignName: campaign.name,
                        campaignId: campaign.campaignId,
                        workspaceName: campaign.workspaceName,
                        category: campaign.category,
                        subsequenceId: `sequence-${seqIndex}`,
                        subsequenceName: sequence.name || `Sequence ${seqIndex + 1}`,
                        sequenceIndex: seqIndex + 1,
                        stepIndex: stepIndex + 1,
                        variantIndex: variantIndex + 1,
                        subject: variant.subject || 'No Subject',
                        body: variant.body || 'No Content',
                        step_name: step.name || `Step ${stepIndex + 1}`,
                        variant_name: variant.name || `Variant ${variantIndex + 1}`
                      })
                    }
                  })
                }
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
                  const res = await fetch(
                    `${INSTANTLY_BASE_URL}/api/v2/subsequences/${subsequence.id}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                      },
                    }
                  )

                  if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: Failed to fetch subsequence ${subsequence.id}`)
                  }

                  return res
                })

                const subseqData = await subseqResponse.json()
                console.log('Subsequence structure keys:', Object.keys(subseqData))
                
                if (subseqData.sequences) {
                  subseqData.sequences.forEach((sequence: any, seqIndex: number) => {
                    const steps = sequence.steps || []
                    steps.forEach((step: any, stepIndex: number) => {
                      if (step.variants) {
                        step.variants.forEach((variant: any, variantIndex: number) => {
                          if (variant.subject || variant.body) {
                            console.log(`Adding template from subsequence: ${variant.subject}`)
                            allEmailTemplates.push({
                              id: `${campaign.campaignId}-${subsequence.id}-${seqIndex}-${stepIndex}-${variantIndex}`,
                              campaignName: campaign.name,
                              campaignId: campaign.campaignId,
                              workspaceName: campaign.workspaceName,
                              category: campaign.category,
                              subsequenceId: subsequence.id,
                              subsequenceName: subsequence.name || `Subsequence ${subsequence.id}`,
                              sequenceIndex: seqIndex + 1,
                              stepIndex: stepIndex + 1,
                              variantIndex: variantIndex + 1,
                              subject: variant.subject || 'No Subject',
                              body: variant.body || 'No Content',
                              step_name: step.name || `Step ${stepIndex + 1}`,
                              variant_name: variant.name || `Variant ${variantIndex + 1}`
                            })
                          }
                        })
                      }
                    })
                  })
                }

                await delay(200) // Small delay between subsequence requests
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
                    variant_name: 'Default'
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
                variant_name: 'Unknown'
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
            variant_name: 'Error'
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