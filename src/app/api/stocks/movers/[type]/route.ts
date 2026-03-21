import { NextRequest, NextResponse } from 'next/server'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd2q2qjhr01qnf9nn8ti0d2q2qjhr01qnf9nn8tig'
const YAHOO_FINANCE_API_KEY = process.env.YAHOO_FINANCE_API_KEY || 'ef7994ada9mshe853dff7586d068p1b8839jsneb6865952289'

interface StockMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

async function getMoversFromFinnhub(type: string): Promise<StockMover[]> {
  try {
    let endpoint = ''
    switch (type) {
      case 'gainers':
        endpoint = 'https://finnhub.io/api/v1/stock/market-status/gainers'
        break
      case 'losers':
        endpoint = 'https://finnhub.io/api/v1/stock/market-status/losers'
        break
      case 'most-active':
        endpoint = 'https://finnhub.io/api/v1/stock/market-status/most-active'
        break
      default:
        return []
    }

    const response = await fetch(`${endpoint}?token=${FINNHUB_API_KEY}`)
    
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    
    if (!data || !Array.isArray(data)) {
      return []
    }

    return data.slice(0, 10).map((item: {
      symbol: string
      description: string
      price: number
      change: number
      changePercent: number
      volume: number
    }) => ({
      symbol: item.symbol,
      name: item.description || item.symbol,
      price: item.price || 0,
      change: item.change || 0,
      changePercent: item.changePercent || 0,
      volume: item.volume || 0
    }))
  } catch (error) {
    console.log('Finnhub movers API failed:', error)
    return []
  }
}

async function getMoversFromYahooFinance(type: string): Promise<StockMover[]> {
  try {
    let endpoint = ''
    switch (type) {
      case 'gainers':
        endpoint = 'https://yahoo-finance1.p.rapidapi.com/market/v2/get-movers?region=US&lang=en&count=10&start=0'
        break
      case 'losers':
        endpoint = 'https://yahoo-finance1.p.rapidapi.com/market/v2/get-movers?region=US&lang=en&count=10&start=0'
        break
      case 'most-active':
        endpoint = 'https://yahoo-finance1.p.rapidapi.com/market/v2/get-movers?region=US&lang=en&count=10&start=0'
        break
      default:
        return []
    }

    const response = await fetch(endpoint, {
      headers: {
        'X-RapidAPI-Key': YAHOO_FINANCE_API_KEY,
        'X-RapidAPI-Host': 'yahoo-finance1.p.rapidapi.com'
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    
    if (!data.finance || !data.finance.result) {
      return []
    }

    const movers = data.finance.result[0]?.quotes || []
    
    return movers.slice(0, 10).map((item: {
      symbol: string
      longName?: string
      shortName?: string
      regularMarketPrice: number
      regularMarketChange: number
      regularMarketChangePercent: number
      regularMarketVolume: number
    }) => ({
      symbol: item.symbol,
      name: item.longName || item.shortName || item.symbol,
      price: item.regularMarketPrice || 0,
      change: item.regularMarketChange || 0,
      changePercent: item.regularMarketChangePercent || 0,
      volume: item.regularMarketVolume || 0
    }))
  } catch (error) {
    console.log('Yahoo Finance movers API failed:', error)
    return []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params

    if (!['gainers', 'losers', 'most-active'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be gainers, losers, or most-active' }, { status: 400 })
    }

    // Try to get real data from APIs
    const [finnhubResults, yahooResults] = await Promise.all([
      getMoversFromFinnhub(type),
      getMoversFromYahooFinance(type)
    ])

    let movers: StockMover[] = []

    // Use Finnhub results if available, otherwise Yahoo, otherwise fallback to mock
    if (finnhubResults.length > 0) {
      movers = finnhubResults
    } else if (yahooResults.length > 0) {
      movers = yahooResults
    } else {
      // Fallback to mock data
      const mockMovers = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, change: 5.25, changePercent: 3.62, volume: 45000000 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.50, change: -15.75, changePercent: -0.56, volume: 1200000 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', price: 350.80, change: 8.90, changePercent: 2.60, volume: 25000000 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3200.00, change: -25.50, changePercent: -0.79, volume: 8000000 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 800.25, change: 45.75, changePercent: 6.07, volume: 35000000 },
        { symbol: 'META', name: 'Meta Platforms Inc.', price: 350.90, change: -12.30, changePercent: -3.39, volume: 18000000 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 450.60, change: 22.40, changePercent: 5.24, volume: 28000000 },
        { symbol: 'NFLX', name: 'Netflix Inc.', price: 420.15, change: -8.75, changePercent: -2.04, volume: 15000000 },
        { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', price: 120.45, change: 6.80, changePercent: 5.99, volume: 22000000 },
        { symbol: 'INTC', name: 'Intel Corporation', price: 45.30, change: -2.15, changePercent: -4.53, volume: 30000000 }
      ]

      // Filter based on type
      if (type === 'gainers') {
        movers = mockMovers.filter(stock => stock.change > 0).sort((a, b) => b.changePercent - a.changePercent)
      } else if (type === 'losers') {
        movers = mockMovers.filter(stock => stock.change < 0).sort((a, b) => a.changePercent - b.changePercent)
      } else if (type === 'most-active') {
        movers = mockMovers.sort((a, b) => b.volume - a.volume)
      }
    }

    return NextResponse.json(movers.slice(0, 10)) // Return top 10

  } catch (error) {
    console.error('Error fetching movers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
