import { NextRequest, NextResponse } from 'next/server'

interface TrendData {
  keyword: string
  interest: number
  timestamp: string
  region?: string
}

interface TrendResponse {
  trends: TrendData[]
  relatedQueries: string[]
  risingQueries: string[]
}

async function getGoogleTrendsData(keywords: string[]): Promise<TrendResponse> {
  try {
    // Since we can't use pytrends directly in Next.js API routes,
    // we'll use a web scraping approach or a proxy service
    // For now, we'll simulate trend data based on the keywords
    
    const trends: TrendData[] = keywords.map(keyword => ({
      keyword,
      interest: Math.floor(Math.random() * 100) + 1,
      timestamp: new Date().toISOString(),
      region: 'US'
    }))

    // Generate related and rising queries based on keywords
    const relatedQueries = keywords.flatMap(keyword => [
      `${keyword} jobs`,
      `${keyword} salary`,
      `${keyword} skills`,
      `${keyword} career`,
      `${keyword} training`
    ])

    const risingQueries = keywords.flatMap(keyword => [
      `${keyword} 2024`,
      `${keyword} remote`,
      `${keyword} certification`,
      `${keyword} bootcamp`,
      `${keyword} interview`
    ])

    return {
      trends,
      relatedQueries: relatedQueries.slice(0, 10),
      risingQueries: risingQueries.slice(0, 10)
    }
  } catch (error) {
    console.error('Error fetching Google Trends data:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keywordsParam = searchParams.get('keywords')
    
    if (!keywordsParam) {
      return NextResponse.json({ error: 'Keywords parameter is required' }, { status: 400 })
    }

    const keywords = keywordsParam.split(',').map(k => k.trim()).filter(k => k.length > 0)
    
    if (keywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 })
    }

    const trendData = await getGoogleTrendsData(keywords)

    return NextResponse.json(trendData)

  } catch (error) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords } = body

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords array is required' }, { status: 400 })
    }

    const trendData = await getGoogleTrendsData(keywords)

    return NextResponse.json(trendData)

  } catch (error) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
