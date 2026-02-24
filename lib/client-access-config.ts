// Client Access Configuration
// Update these campaign IDs with actual values from your Instantly API

export interface ClientConfig {
  name: string
  campaignId: string
  workspaceId: string
  description?: string
}

export const CLIENT_ACCESS_MAP: Record<string, ClientConfig> = {
  'roger-hospital-chapel-hill': {
    name: 'Roger Hospital Chapel Hill',
    campaignId: 'roger-hospitals-chapel-hill', // This will be auto-detected by campaign name matching
    workspaceId: '1', // Wings Over Campaign
    description: 'Healthcare campaign analytics for Chapel Hill location'
  },
  'roger-real-estate-offices': {
    name: 'Roger Real Estate Offices', 
    campaignId: 'roger-real-estate-offices', // This will be auto-detected by campaign name matching
    workspaceId: '3', // Modu campaign
    description: 'Real estate office outreach campaign analytics'
  },
  'roger-wisconsin-leads': {
    name: 'Roger Wisconsin Leads',
    campaignId: 'roger-wisconsin-leads', // This will be auto-detected by campaign name matching
    workspaceId: '1', // Wings Over Campaign  
    description: 'Wisconsin lead generation campaign analytics'
  },
  'prusa-external-company': {
    name: 'PRUSA External Company 7.9M+',
    campaignId: '87dcc1bb-471a-4b5a-9416-3fb2d34a1691',
    workspaceId: '2',
    description: 'PRUSA external company outreach campaign analytics'
  },
  'prusa-target-company': {
    name: 'PRUSA Target Company 7.9M+',
    campaignId: 'f7275204-8c5f-449f-bb02-58e4027ecca8',
    workspaceId: '2',
    description: 'PRUSA target company outreach campaign analytics'
  },
  'prusa-compass': {
    name: 'PRUSA Compass 7.9M+',
    campaignId: 'de0864ce-252a-4aa2-8cb7-e33e55ad5997',
    workspaceId: '2',
    description: 'PRUSA Compass campaign analytics'
  },
  'prusa-compass-florida-texas': {
    name: 'PRUSA Compass Florida: Texas',
    campaignId: 'f211938a-9ffe-4262-9001-6e36892ba127',
    workspaceId: '2',
    description: 'PRUSA Compass Florida and Texas campaign analytics'
  },
  'prusa-new-campaign': {
    name: 'PRUSA New Campaign',
    campaignId: '51bab480-545d-4241-94e5-26d9e3fe34ad',
    workspaceId: '2',
    description: 'PRUSA new campaign analytics'
  },
  'prusa-ca-re-agents': {
    name: 'PRUSA CA RE Agents',
    campaignId: 'fd602881-04ac-4336-9ef3-e4fbb7fffa92',
    workspaceId: '2',
    description: 'PRUSA California real estate agents campaign analytics'
  }
}

// Helper function to get client configuration
export function getClientConfig(token: string): ClientConfig | null {
  return CLIENT_ACCESS_MAP[token] || null
}

// Helper function to validate campaign access
export function isValidClientToken(token: string): boolean {
  return token in CLIENT_ACCESS_MAP
}

// Get all available client tokens (for admin use)
export function getAvailableClientTokens(): Array<{token: string, config: ClientConfig}> {
  return Object.entries(CLIENT_ACCESS_MAP).map(([token, config]) => ({
    token,
    config
  }))
}