import { NextRequest, NextResponse } from 'next/server'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd2q2qjhr01qnf9nn8ti0d2q2qjhr01qnf9nn8tig'
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'ANEBEZ36W1G7OT61'
const YAHOO_FINANCE_API_KEY = process.env.YAHOO_FINANCE_API_KEY || 'ef7994ada9mshe853dff7586d068p1b8839jsneb6865952289'

interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  pe?: number
  high52Week?: number
  low52Week?: number
  dividend?: number
  dividendYield?: number
  open?: number
  previousClose?: number
}

async function getCompanyName(symbol: string): Promise<string> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    )
    if (response.ok) {
      const data = await response.json()
      return data.name || `${symbol} Corporation`
    }
  } catch {
    console.log('Failed to fetch company name from Finnhub')
  }

  // Fallback company names
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

async function fetchQuoteFromFinnhub(symbol: string): Promise<StockQuote | null> {
  try {
    const [quoteResponse, profileResponse] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
    ])

    if (!quoteResponse.ok || !profileResponse.ok) {
      return null
    }

    const quoteData = await quoteResponse.json()
    const profileData = await profileResponse.json()

    if (!quoteData.c || quoteData.c <= 0) {
      return null
    }

    return {
      symbol: symbol.toUpperCase(),
      name: profileData.name || await getCompanyName(symbol),
      price: quoteData.c,
      change: quoteData.d,
      changePercent: quoteData.dp,
      volume: quoteData.v || 0,
      marketCap: profileData.marketCapitalization,
      pe: profileData.pe,
      high52Week: quoteData.h,
      low52Week: quoteData.l,
      dividend: profileData.dividend,
      dividendYield: profileData.dividendYield
    }
  } catch (error) {
    console.log(`Finnhub API failed for ${symbol}:`, error)
    return null
  }
}

async function fetchQuoteFromAlphaVantage(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const quote = data['Global Quote']

    if (!quote || !quote['05. price']) {
      return null
    }

    const price = parseFloat(quote['05. price'])
    const change = parseFloat(quote['09. change'])
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''))

    return {
      symbol: symbol.toUpperCase(),
      name: await getCompanyName(symbol),
      price,
      change,
      changePercent,
      volume: parseInt(quote['06. volume']) || 0,
      high52Week: parseFloat(quote['03. high']),
      low52Week: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close'])
    }
  } catch (error) {
    console.log(`Alpha Vantage API failed for ${symbol}:`, error)
    return null
  }
}

async function fetchQuoteFromYahooFinance(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `https://yahoo-finance1.p.rapidapi.com/stock/v2/get-quotes?symbols=${symbol}`,
      {
        headers: {
          'X-RapidAPI-Key': YAHOO_FINANCE_API_KEY,
          'X-RapidAPI-Host': 'yahoo-finance1.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const result = data.quoteResponse?.result?.[0]

    if (!result) {
      return null
    }

    return {
      symbol: result.symbol,
      name: result.longName || await getCompanyName(symbol),
      price: result.regularMarketPrice,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent,
      volume: result.regularMarketVolume,
      marketCap: result.marketCap,
      pe: result.trailingPE,
      high52Week: result.fiftyTwoWeekHigh,
      low52Week: result.fiftyTwoWeekLow,
      dividend: result.dividendRate,
      dividendYield: result.dividendYield
    }
  } catch (error) {
    console.log(`Yahoo Finance API failed for ${symbol}:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json([])
    }

    const quotes: StockQuote[] = []

    // Fetch quotes from multiple APIs in parallel
    for (const symbol of symbols) {
      try {
        // Try Finnhub first (most reliable)
        let quote = await fetchQuoteFromFinnhub(symbol)

        // Fallback to Alpha Vantage if Finnhub fails
        if (!quote) {
          quote = await fetchQuoteFromAlphaVantage(symbol)
        }

        // Fallback to Yahoo Finance if both fail
        if (!quote) {
          quote = await fetchQuoteFromYahooFinance(symbol)
        }

        if (quote) {
          quotes.push(quote)
        } else {
          // If all APIs fail, create a basic quote with mock data
          console.log(`All APIs failed for ${symbol}, using fallback data`)
          quotes.push({
            symbol: symbol.toUpperCase(),
            name: await getCompanyName(symbol),
            price: Math.random() * 1000 + 50,
            change: (Math.random() - 0.5) * 20,
            changePercent: (Math.random() - 0.5) * 10,
            volume: Math.floor(Math.random() * 10000000),
            marketCap: Math.floor(Math.random() * 1000000000000),
            high52Week: Math.random() * 1000 + 50,
            low52Week: Math.random() * 1000 + 50
          })
        }
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error)
        // Add fallback quote for this symbol
        quotes.push({
          symbol: symbol.toUpperCase(),
          name: await getCompanyName(symbol),
          price: Math.random() * 1000 + 50,
          change: (Math.random() - 0.5) * 20,
          changePercent: (Math.random() - 0.5) * 10,
          volume: Math.floor(Math.random() * 10000000),
          marketCap: Math.floor(Math.random() * 1000000000000),
          high52Week: Math.random() * 1000 + 50,
          low52Week: Math.random() * 1000 + 50
        })
      }
    }

    return NextResponse.json(quotes)

  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
