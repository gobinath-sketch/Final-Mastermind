import { NextRequest, NextResponse } from 'next/server'

type GrowwInstrument = {
  exchange: 'NSE' | 'BSE'
  segment: 'CASH'
  tradingSymbol: string
}

function parseGrowwInstrument(rawSymbol: string): GrowwInstrument | null {
  const upper = rawSymbol.trim().toUpperCase()

  // Supported Groww stock formats:
  // - NSE-RELIANCE / BSE-RELIANCE
  // - RELIANCE.NS / RELIANCE.NSE / RELIANCE.BO / RELIANCE.BSE
  if (upper.startsWith('NSE-')) {
    const tradingSymbol = upper.slice(4).replace(/-EQ$/, '')
    return tradingSymbol ? { exchange: 'NSE', segment: 'CASH', tradingSymbol } : null
  }
  if (upper.startsWith('BSE-')) {
    const tradingSymbol = upper.slice(4).replace(/-EQ$/, '')
    return tradingSymbol ? { exchange: 'BSE', segment: 'CASH', tradingSymbol } : null
  }

  const parts = upper.split('.')
  if (parts.length === 2) {
    const base = parts[0]?.replace(/-EQ$/, '') ?? ''
    const suffix = parts[1]
    if (!base) return null
    if (suffix === 'NS' || suffix === 'NSE') {
      return { exchange: 'NSE', segment: 'CASH', tradingSymbol: base }
    }
    if (suffix === 'BO' || suffix === 'BSE') {
      return { exchange: 'BSE', segment: 'CASH', tradingSymbol: base }
    }
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const GROWW_ACCESS_TOKEN =
      process.env.GROWW_ACCESS_TOKEN ||
      process.env.GROWW_API_TOKEN ||
      process.env.NEXT_PUBLIC_GROWW_ACCESS_TOKEN
    const FINNHUB_API_KEY =
      process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY
    const ALPHA_VANTAGE_API_KEY =
      process.env.ALPHA_VANTAGE_API_KEY || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
    const YAHOO_FINANCE_API_KEY =
      process.env.YAHOO_FINANCE_API_KEY || process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY

    if (!GROWW_ACCESS_TOKEN && !FINNHUB_API_KEY && !ALPHA_VANTAGE_API_KEY && !YAHOO_FINANCE_API_KEY) {
      return NextResponse.json(
        { error: 'No finance provider keys are configured on the server' },
        { status: 500 }
      )
    }

    // 0) Groww (real Indian market data for supported symbols)
    if (GROWW_ACCESS_TOKEN) {
      const ins = parseGrowwInstrument(symbol)
      if (ins) {
        const growwResp = await fetch(
          `https://api.groww.in/v1/live-data/quote?exchange=${ins.exchange}&segment=${ins.segment}&trading_symbol=${encodeURIComponent(ins.tradingSymbol)}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${GROWW_ACCESS_TOKEN}`,
              'X-API-VERSION': '1.0',
            },
          }
        )

        if (growwResp.ok) {
          const growwData = await growwResp.json()
          const payload = growwData?.payload
          if (payload && typeof payload.last_price === 'number') {
            const ohlc = payload.ohlc ?? {}
            return NextResponse.json({
              symbol: symbol.toUpperCase(),
              name: getCompanyName(symbol),
              price: Number(payload.last_price ?? 0),
              change: Number(payload.day_change ?? 0),
              changePercent: Number(payload.day_change_perc ?? 0),
              volume: Number(payload.volume ?? payload.total_traded_volume ?? 0),
              high52Week: Number(payload?.['52_week_high'] ?? payload?.fifty_two_week_high ?? 0),
              low52Week: Number(payload?.['52_week_low'] ?? payload?.fifty_two_week_low ?? 0),
              open: Number(ohlc.open ?? 0),
              previousClose: Number(ohlc.close ?? payload.previous_close ?? 0),
            })
          }
        }
      }
    }

    // 1) Finnhub
    if (FINNHUB_API_KEY) {
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
          symbol
        )}&token=${FINNHUB_API_KEY}`
      )

      if (finnhubResponse.ok) {
        const finnhubData = await finnhubResponse.json()
        if (typeof finnhubData?.c === 'number' && finnhubData.c > 0) {
          return NextResponse.json({
            symbol: symbol.toUpperCase(),
            name: getCompanyName(symbol),
            price: finnhubData.c,
            change: finnhubData.d,
            changePercent: finnhubData.dp,
            volume: finnhubData.v || 0,
            high52Week: finnhubData.h,
            low52Week: finnhubData.l,
            open: finnhubData.o,
            previousClose: finnhubData.pc,
          })
        }
      }
    }

    // 2) Alpha Vantage (GLOBAL_QUOTE)
    if (ALPHA_VANTAGE_API_KEY) {
      const avResp = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
          symbol
        )}&apikey=${ALPHA_VANTAGE_API_KEY}`
      )

      if (avResp.ok) {
        const data = await avResp.json()
        const quote = data?.['Global Quote']
        if (quote?.['05. price']) {
          const price = parseFloat(quote['05. price'])
          const change = parseFloat(quote['09. change'] || '0')
          const changePercent = parseFloat(
            String(quote['10. change percent'] || '0%').replace('%', '')
          )

          return NextResponse.json({
            symbol: symbol.toUpperCase(),
            name: getCompanyName(symbol),
            price,
            change,
            changePercent,
            volume: parseInt(quote['06. volume'] || '0', 10) || 0,
            high52Week: parseFloat(quote['03. high'] || '0'),
            low52Week: parseFloat(quote['04. low'] || '0'),
            open: parseFloat(quote['02. open'] || '0'),
            previousClose: parseFloat(quote['08. previous close'] || '0'),
          })
        }
      }
    }

    // 3) Yahoo Finance via RapidAPI
    if (YAHOO_FINANCE_API_KEY) {
      const yahooResp = await fetch(
        `https://yahoo-finance1.p.rapidapi.com/stock/v2/get-quotes?symbols=${encodeURIComponent(
          symbol
        )}`,
        {
          headers: {
            'X-RapidAPI-Key': YAHOO_FINANCE_API_KEY,
            'X-RapidAPI-Host': 'yahoo-finance1.p.rapidapi.com',
          },
        }
      )

      if (yahooResp.ok) {
        const data = await yahooResp.json()
        const result = data?.quoteResponse?.result?.[0]
        if (result) {
          return NextResponse.json({
            symbol: result.symbol,
            name: result.longName || getCompanyName(symbol),
            price: result.regularMarketPrice,
            change: result.regularMarketChange,
            changePercent: result.regularMarketChangePercent,
            volume: result.regularMarketVolume,
            marketCap: result.marketCap,
            pe: result.trailingPE,
            high52Week: result.fiftyTwoWeekHigh,
            low52Week: result.fiftyTwoWeekLow,
            dividend: result.dividendRate,
            dividendYield: result.dividendYield,
          })
        }
      }
    }

    // 4) Yahoo public quote endpoint (global symbols, no API key)
    try {
      const yahooPublicResp = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`
      )
      if (yahooPublicResp.ok) {
        const data = await yahooPublicResp.json()
        const result = data?.quoteResponse?.result?.[0]
        if (result && typeof result.regularMarketPrice === 'number') {
          return NextResponse.json({
            symbol: String(result.symbol || symbol).toUpperCase(),
            name: result.longName || result.shortName || getCompanyName(symbol),
            price: Number(result.regularMarketPrice ?? 0),
            change: Number(result.regularMarketChange ?? 0),
            changePercent: Number(result.regularMarketChangePercent ?? 0),
            volume: Number(result.regularMarketVolume ?? 0),
            marketCap: Number(result.marketCap ?? 0),
            pe: Number(result.trailingPE ?? 0),
            high52Week: Number(result.fiftyTwoWeekHigh ?? 0),
            low52Week: Number(result.fiftyTwoWeekLow ?? 0),
            open: Number(result.regularMarketOpen ?? 0),
            previousClose: Number(result.regularMarketPreviousClose ?? 0),
          })
        }
      }
    } catch (publicYahooError) {
      console.error('Yahoo public quote fallback failed:', publicYahooError)
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      unavailable: true,
      reason: `No real quote data available for ${symbol}`,
    })

  } catch (error) {
    console.error('Error fetching stock quote:', error)
    return NextResponse.json({
      symbol: 'UNKNOWN',
      unavailable: true,
      reason: 'Failed to fetch quote from providers',
    })
  }
}

function getCompanyName(symbol: string): string {
  const normalized = symbol.toUpperCase().replace(/^NSE-/, '').replace(/^BSE-/, '').split('.')[0]
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
  return companies[normalized] || `${normalized} Corporation`
}

// (Intentionally no mock/fallback quote generation: user requested real data only.)
