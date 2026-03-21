import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd2q2qjhr01qnf9nn8ti0d2q2qjhr01qnf9nn8tig'

    // Try Finnhub API first
    try {
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      )

      if (finnhubResponse.ok) {
        const finnhubData = await finnhubResponse.json()

        if (finnhubData.c && finnhubData.c > 0) {
          const quote = {
            symbol: symbol.toUpperCase(),
            name: getCompanyName(symbol),
            price: finnhubData.c,
            change: finnhubData.d,
            changePercent: finnhubData.dp,
            volume: finnhubData.v || 0,
            high52Week: finnhubData.h,
            low52Week: finnhubData.l,
            open: finnhubData.o,
            previousClose: finnhubData.pc
          }

          return NextResponse.json(quote)
        }
      }
    } catch {
      console.log('Finnhub API failed, using mock data')
    }

    // Fallback to mock data if API fails
    const mockQuote = {
      symbol: symbol.toUpperCase(),
      name: getCompanyName(symbol),
      price: getRandomPrice(),
      change: getRandomChange(),
      changePercent: getRandomChangePercent(),
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      pe: Math.floor(Math.random() * 50) + 10,
      high52Week: getRandomPrice() * 1.2,
      low52Week: getRandomPrice() * 0.8,
      dividend: Math.random() * 5,
      dividendYield: Math.random() * 5
    }

    return NextResponse.json(mockQuote)

  } catch (error) {
    console.error('Error fetching stock quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getCompanyName(symbol: string): string {
  const companies: { [key: string]: string } = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'AMD': 'Advanced Micro Devices Inc.',
    'INTC': 'Intel Corporation'
  }
  return companies[symbol.toUpperCase()] || `${symbol} Corporation`
}

function getRandomPrice(): number {
  return Math.floor(Math.random() * 1000) + 50
}

function getRandomChange(): number {
  return (Math.random() - 0.5) * 20
}

function getRandomChangePercent(): number {
  return (Math.random() - 0.5) * 10
}
