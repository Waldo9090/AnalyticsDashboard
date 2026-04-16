import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, rm } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface DashboardMetadata {
  name: string
  slug: string
  selectedCampaigns: string[]
  campaigns: any[]
  primaryCategory: string
  createdAt: string
  isActive: boolean
}

export async function GET() {
  try {
    const appDir = join(process.cwd(), 'app')
    const entries = await readdir(appDir, { withFileTypes: true })
    
    // Find all directories ending with '-campaigns' that are not the original ones
    const originalCampaigns = ['roger-campaigns', 'reachify-campaigns', 'prusa-campaigns', 'unified-campaigns', 'root-signals-campaigns', 'sample-campaigns']
    const customDashboards: DashboardMetadata[] = []
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith('-campaigns') && !originalCampaigns.includes(entry.name)) {
        const metadataPath = join(appDir, entry.name, 'metadata.json')
        
        if (existsSync(metadataPath)) {
          try {
            const metadataContent = await readFile(metadataPath, 'utf-8')
            const metadata: DashboardMetadata = JSON.parse(metadataContent)
            
            if (metadata.isActive) {
              customDashboards.push(metadata)
            }
          } catch (error) {
            console.error(`Error reading metadata for ${entry.name}:`, error)
          }
        }
      }
    }
    
    // Sort by creation date (newest first)
    customDashboards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({ dashboards: customDashboards })
    
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Dashboard slug is required' },
        { status: 400 }
      )
    }
    
    const dashboardPath = join(process.cwd(), 'app', `${slug}-campaigns`)
    
    if (!existsSync(dashboardPath)) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }
    
    // Remove the entire dashboard directory
    await rm(dashboardPath, { recursive: true, force: true })
    
    return NextResponse.json({ success: true, message: 'Dashboard deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    )
  }
}