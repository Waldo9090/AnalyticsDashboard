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

// GET subsequence by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    
    console.log('=== GET Subsequence API Request ===')
    console.log('Subsequence ID:', id)
    console.log('Workspace ID:', workspaceId)
    
    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured for selected workspace' },
        { status: 500 }
      )
    }
    
    const response = await fetch(
      `${INSTANTLY_BASE_URL}/api/v2/subsequences/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || `HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('GET Subsequence API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH (update) subsequence by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    
    console.log('=== PATCH Subsequence API Request ===')
    console.log('Subsequence ID:', id)
    console.log('Workspace ID:', workspaceId)
    
    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured for selected workspace' },
        { status: 500 }
      )
    }
    
    const body = await request.json()
    console.log('Update body:', JSON.stringify(body, null, 2))
    
    const response = await fetch(
      `${INSTANTLY_BASE_URL}/api/v2/subsequences/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('PATCH Subsequence API Error:', errorData)
      return NextResponse.json(
        { error: errorData.message || `HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Subsequence updated successfully')
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('PATCH Subsequence API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


