import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const PREFERENCES_FILE = path.join(process.cwd(), 'data', 'campaign-preferences.json')

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(PREFERENCES_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Get current preferences
function getPreferences() {
  ensureDataDirectory()
  try {
    if (fs.existsSync(PREFERENCES_FILE)) {
      const data = fs.readFileSync(PREFERENCES_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading preferences:', error)
  }
  
  // Default preferences
  return {
    roger: [],
    reachify: [],
    prusa: [],
    all: [],
    admin: [] // Global admin selection
  }
}

// Save preferences
function savePreferences(preferences: any) {
  ensureDataDirectory()
  try {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(preferences, null, 2))
    return true
  } catch (error) {
    console.error('Error saving preferences:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const preferences = getPreferences()
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error getting campaign preferences:', error)
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category, selectedCampaigns } = await request.json()

    if (!category || !Array.isArray(selectedCampaigns)) {
      return NextResponse.json(
        { error: 'Category and selectedCampaigns array are required' },
        { status: 400 }
      )
    }

    const preferences = getPreferences()
    preferences[category] = selectedCampaigns

    const saved = savePreferences(preferences)
    
    if (saved) {
      return NextResponse.json({ 
        message: `Saved ${selectedCampaigns.length} campaigns for ${category}`,
        preferences 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error saving campaign preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}