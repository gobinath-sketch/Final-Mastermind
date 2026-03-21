import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '1d'
    const { symbol } = await params

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Mock chart data - you can replace this with real API calls
    const now = new Date()
    const dataPoints = timeframe === '1d' ? 24 : timeframe === '1w' ? 7 : timeframe === '1m' ? 30 : 365
    
    const chartData = Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date(now.getTime() - (dataPoints - i - 1) * 24 * 60 * 60 * 1000)
      return {
        timestamp: date.toISOString(),
        open: Math.random() * 1000 + 50,
        high: Math.random() * 1000 + 50,
        low: Math.random() * 1000 + 50,
        close: Math.random() * 1000 + 50,
        volume: Math.floor(Math.random() * 10000000)
      }
    })

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      data: chartData
    })

  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
