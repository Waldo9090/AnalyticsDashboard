import { useState, useEffect } from 'react'

export interface PrusaDailyData {
  date: string
  sent: number
  unique_opened: number
  unique_replies: number
  unique_clicks: number
}

// Mock daily analytics data for PRUSA campaigns - Base data for external company campaign
const MOCK_DAILY_DATA: PrusaDailyData[] = [
  { date: '2024-11-01', sent: 85, unique_opened: 42, unique_replies: 1, unique_clicks: 0 },
  { date: '2024-11-02', sent: 92, unique_opened: 48, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-03', sent: 78, unique_opened: 39, unique_replies: 1, unique_clicks: 0 },
  { date: '2024-11-04', sent: 105, unique_opened: 55, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-05', sent: 88, unique_opened: 41, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-06', sent: 0, unique_opened: 0, unique_replies: 0, unique_clicks: 0 }, // Weekend
  { date: '2024-11-07', sent: 0, unique_opened: 0, unique_replies: 0, unique_clicks: 0 }, // Weekend
  { date: '2024-11-08', sent: 110, unique_opened: 58, unique_replies: 1, unique_clicks: 0 },
  { date: '2024-11-09', sent: 95, unique_opened: 47, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-10', sent: 89, unique_opened: 44, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-11', sent: 102, unique_opened: 51, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-12', sent: 97, unique_opened: 49, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-13', sent: 0, unique_opened: 0, unique_replies: 0, unique_clicks: 0 }, // Weekend
  { date: '2024-11-14', sent: 0, unique_opened: 0, unique_replies: 0, unique_clicks: 0 }, // Weekend
  { date: '2024-11-15', sent: 108, unique_opened: 56, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-16', sent: 93, unique_opened: 46, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-17', sent: 86, unique_opened: 43, unique_replies: 0, unique_clicks: 0 },
  { date: '2024-11-18', sent: 0, unique_opened: 1, unique_replies: 0, unique_clicks: 0 } // Campaign completed, only tracking opens
]

interface UsePrusaMockDataProps {
  campaignId?: string | null
  workspaceId?: string | null
}

export function usePrusaMockDailyData({ campaignId, workspaceId }: UsePrusaMockDataProps) {
  const [data, setData] = useState<PrusaDailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      // Filter mock data based on campaign ID for realistic daily sending patterns
      if (campaignId) {
        let adjustedData
        
        if (campaignId === 'f7275204-8c5f-449f-bb02-58e4027ecca8') {
          // PRUSA Target Company: 23 total sent over 2-3 days
          adjustedData = MOCK_DAILY_DATA.map((day, index) => ({
            ...day,
            sent: index === 0 ? 12 : index === 1 ? 11 : 0,
            unique_opened: index === 0 ? 8 : index === 1 ? 6 : 0,
            unique_replies: 0,
            unique_clicks: 0
          }))
        } else if (campaignId === 'de0864ce-252a-4aa2-8cb7-e33e55ad5997') {
          // PRUSA Compass: 125 total sent over 5-6 days  
          adjustedData = MOCK_DAILY_DATA.map((day, index) => ({
            ...day,
            sent: index < 6 ? Math.round(125 / 6) : 0,
            unique_opened: index < 6 ? Math.round(51 / 6) : 0,
            unique_replies: 0,
            unique_clicks: 0
          }))
        } else if (campaignId === 'f211938a-9ffe-4262-9001-6e36892ba127') {
          // PRUSA Compass Florida: Texas: 18 total sent, active campaign
          adjustedData = MOCK_DAILY_DATA.map((day, index) => ({
            ...day,
            sent: index === MOCK_DAILY_DATA.length - 1 ? 18 : 0, // All sent on last day (recent activity)
            unique_opened: index === MOCK_DAILY_DATA.length - 1 ? 1 : 0,
            unique_replies: 0,
            unique_clicks: 0
          }))
        } else if (campaignId === '51bab480-545d-4241-94e5-26d9e3fe34ad') {
          // PRUSA New Campaign: 45 total sent over recent days, active campaign
          adjustedData = MOCK_DAILY_DATA.map((day, index) => ({
            ...day,
            sent: index >= MOCK_DAILY_DATA.length - 3 ? 15 : 0, // 15 emails per day for last 3 days
            unique_opened: index >= MOCK_DAILY_DATA.length - 3 ? 7 : 0,
            unique_replies: index === MOCK_DAILY_DATA.length - 2 ? 2 : index === MOCK_DAILY_DATA.length - 1 ? 1 : 0,
            unique_clicks: index === MOCK_DAILY_DATA.length - 1 ? 1 : 0
          }))
        } else {
          // PRUSA external company: 1,188 total sent (default data works well)
          adjustedData = MOCK_DAILY_DATA
        }
        
        setData(adjustedData)
      } else {
        setData(MOCK_DAILY_DATA)
      }
      setLoading(false)
    }, 500) // 500ms delay to simulate network request

    return () => clearTimeout(timer)
  }, [campaignId, workspaceId])

  return { data, loading, error }
}

export const PRUSA_CAMPAIGN_IDS = [
  '87dcc1bb-471a-4b5a-9416-3fb2d34a1691',
  'f7275204-8c5f-449f-bb02-58e4027ecca8',
  'de0864ce-252a-4aa2-8cb7-e33e55ad5997',
  'f211938a-9ffe-4262-9001-6e36892ba127',
  '51bab480-545d-4241-94e5-26d9e3fe34ad',
  '25057551-6b40-45fe-97a9-2b5e3db3bafd' // PRUSA Florida Campaign
]

// Check if a campaign ID is a PRUSA campaign
export function isPrusaCampaign(campaignId: string | null | undefined): boolean {
  if (!campaignId) return false
  return PRUSA_CAMPAIGN_IDS.includes(campaignId)
}