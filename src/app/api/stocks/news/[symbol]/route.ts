import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const { symbol } = await params

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Mock news data - you can replace this with real API calls
    const mockNews = [
      {
        id: '1',
        title: `${symbol.toUpperCase()} Reports Strong Q4 Earnings`,
        summary: `The company exceeded expectations with revenue growth of 15% year-over-year.`,
        url: 'https://example.com/news/1',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'Financial Times'
      },
      {
        id: '2',
        title: `Analysts Upgrade ${symbol.toUpperCase()} Price Target`,
        summary: `Multiple analysts have raised their price targets following recent developments.`,
        url: 'https://example.com/news/2',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'Bloomberg'
      },
      {
        id: '3',
        title: `${symbol.toUpperCase()} Announces New Product Launch`,
        summary: `The company unveiled its latest innovation that could drive future growth.`,
        url: 'https://example.com/news/3',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'Reuters'
      },
      {
        id: '4',
        title: `Market Reacts Positively to ${symbol.toUpperCase()} News`,
        summary: `Investors are showing confidence in the company's strategic direction.`,
        url: 'https://example.com/news/4',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: 'Wall Street Journal'
      },
      {
        id: '5',
        title: `${symbol.toUpperCase()} Partnership Deal Announced`,
        summary: `The company has entered into a strategic partnership that could boost revenue.`,
        url: 'https://example.com/news/5',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        source: 'CNBC'
      }
    ]

    return NextResponse.json(mockNews.slice(0, limit))

  } catch (error) {
    console.error('Error fetching stock news:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
