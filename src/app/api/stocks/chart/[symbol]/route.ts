import { NextRequest, NextResponse } from 'next/server'

type GrowwInstrument = {
  exchange: 'NSE' | 'BSE'
  segment: 'CASH'
  tradingSymbol: string
}

function parseGrowwInstrument(rawSymbol: string): GrowwInstrument | null {
  const upper = rawSymbol.trim().toUpperCase()

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
    const { searchParams } = new URL(request.url)
    const rawTimeframe = searchParams.get('timeframe') || '1d'
    const timeframe = rawTimeframe.toLowerCase()
    const { symbol } = await params

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    const GROWW_ACCESS_TOKEN =
      process.env.GROWW_ACCESS_TOKEN ||
      process.env.GROWW_API_TOKEN ||
      process.env.NEXT_PUBLIC_GROWW_ACCESS_TOKEN

    const FINNHUB_API_KEY =
      process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY

    const ALPHA_VANTAGE_API_KEY =
      process.env.ALPHA_VANTAGE_API_KEY || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY

    // 0) Groww historical candle/range for supported Indian symbols
    if (GROWW_ACCESS_TOKEN) {
      const ins = parseGrowwInstrument(symbol)
      if (ins) {
        const nowSec = Math.floor(Date.now() / 1000)
        const daysBack =
          timeframe === '1d' ? 1 :
          timeframe === '1w' ? 7 :
          timeframe === '1m' ? 30 :
          timeframe === '3m' ? 90 :
          timeframe === '1y' ? 365 :
          timeframe === '5y' ? 1825 :
          30

        const intervalInMinutes =
          timeframe === '1d' ? 5 :
          timeframe === '1w' ? 60 :
          timeframe === '1m' ? 1440 :
          timeframe === '3m' ? 1440 :
          timeframe === '1y' ? 10080 :
          timeframe === '5y' ? 10080 :
          1440

        const growwResp = await fetch(
          `https://api.groww.in/v1/historical/candle/range?exchange=${ins.exchange}&segment=${ins.segment}&trading_symbol=${encodeURIComponent(ins.tradingSymbol)}&start_time=${nowSec - daysBack * 86400}&end_time=${nowSec}&interval_in_minutes=${intervalInMinutes}`,
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
          const candles = growwData?.payload?.candles
          if (Array.isArray(candles)) {
            const chartData = candles
              .map((row: unknown) => {
                if (!Array.isArray(row) || row.length < 6) return null
                const ts = Number(row[0])
                const open = Number(row[1])
                const high = Number(row[2])
                const low = Number(row[3])
                const close = Number(row[4])
                const volume = Number(row[5])
                if (![ts, open, high, low, close].every((v) => Number.isFinite(v))) return null
                return {
                  timestamp: ts > 1e12 ? ts : ts * 1000,
                  open,
                  high,
                  low,
                  close,
                  volume: Number.isFinite(volume) ? Math.floor(volume) : 0,
                }
              })
              .filter((x: unknown): x is { timestamp: number; open: number; high: number; low: number; close: number; volume: number } => Boolean(x))

            if (chartData.length > 0) {
              return NextResponse.json({
                symbol: symbol.toUpperCase(),
                timeframe: timeframe.toUpperCase(),
                data: chartData,
              })
            }
          }
        }
      }
    }

    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: 'FINNHUB_API_KEY is missing' },
        { status: 500 }
      )
    }

    const nowSec = Math.floor(Date.now() / 1000)
    const daysBack =
      timeframe === '1d' ? 1 :
      timeframe === '1w' ? 7 :
      timeframe === '1m' ? 30 :
      timeframe === '3m' ? 90 :
      timeframe === '1y' ? 365 :
      timeframe === '5y' ? 1825 :
      30

    const resolution =
      timeframe === '1d' ? '5' :
      timeframe === '1w' ? '60' :
      timeframe === '1m' ? 'D' :
      timeframe === '3m' ? 'D' :
      timeframe === '1y' ? 'W' :
      timeframe === '5y' ? 'M' :
      'D'

    const from = nowSec - daysBack * 86400
    const to = nowSec

    const finnhubUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(
      symbol
    )}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`

    const finnhubResp = await fetch(finnhubUrl)
    if (finnhubResp.ok) {
      type FinnhubCandleResponse = {
        s?: string
        t?: number[]
        o?: number[]
        h?: number[]
        l?: number[]
        c?: number[]
        v?: number[]
      }

      const finnhubData = (await finnhubResp.json()) as FinnhubCandleResponse

      // Finnhub uses `s: "no_data"` for empty responses.
      if (!finnhubData || finnhubData.s === 'no_data' || !Array.isArray(finnhubData.t)) {
        // Fall through to Alpha Vantage (still real data).
      } else {
        const t = finnhubData.t as number[]
        const o = finnhubData.o ?? []
        const h = finnhubData.h ?? []
        const l = finnhubData.l ?? []
        const c = finnhubData.c ?? []
        const v = finnhubData.v ?? []

        const chartData = t.map((ts, i) => ({
          timestamp: ts * 1000, // Finnhub timestamps are in seconds
          open: Number(o?.[i] ?? 0),
          high: Number(h?.[i] ?? 0),
          low: Number(l?.[i] ?? 0),
          close: Number(c?.[i] ?? 0),
          volume: Math.floor(Number(v?.[i] ?? 0)),
        }))

        return NextResponse.json({
          symbol: symbol.toUpperCase(),
          timeframe: timeframe.toUpperCase(),
          data: chartData,
        })
      }
    }

    // Finnhub failed -> Alpha Vantage fallback (NO mock data).
    if (!ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json(
        { error: 'Finnhub candle fetch failed and ALPHA_VANTAGE_API_KEY is missing' },
        { status: 502 }
      )
    }

    // Use daily adjusted time series and slice to requested timeframe.
    const avFunction = 'TIME_SERIES_DAILY_ADJUSTED'
    const outputSize = timeframe === '5Y' ? 'full' : 'compact'

    const avResp = await fetch(
      `https://www.alphavantage.co/query?function=${avFunction}&symbol=${encodeURIComponent(
        symbol
      )}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`
    )

    if (!avResp.ok) {
      return NextResponse.json(
        { symbol: symbol.toUpperCase(), timeframe: timeframe.toUpperCase(), data: [], error: 'Failed to fetch chart data from Alpha Vantage' },
        { status: 200 }
      )
    }

    const avData = (await avResp.json()) as Record<string, unknown>
    const series = avData['Time Series (Daily)'] as Record<
      string,
      Record<string, string | undefined>
    > | undefined
    if (!series || typeof series !== 'object') {
      const yahooRange =
        timeframe === '1d' ? '1d' :
        timeframe === '1w' ? '5d' :
        timeframe === '1m' ? '1mo' :
        timeframe === '3m' ? '3mo' :
        timeframe === '1y' ? '1y' :
        timeframe === '5y' ? '5y' :
        '1mo'

      const yahooInterval =
        timeframe === '1d' ? '5m' :
        timeframe === '1w' ? '30m' :
        timeframe === '1m' ? '1d' :
        timeframe === '3m' ? '1d' :
        timeframe === '1y' ? '1wk' :
        timeframe === '5y' ? '1wk' :
        '1d'

      try {
        const yahooResp = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${yahooRange}&interval=${yahooInterval}`
        )
        if (yahooResp.ok) {
          const yahooData = await yahooResp.json()
          const result = yahooData?.chart?.result?.[0]
          const timestamps: number[] = result?.timestamp ?? []
          const q = result?.indicators?.quote?.[0] ?? {}
          const o: Array<number | null> = q?.open ?? []
          const h: Array<number | null> = q?.high ?? []
          const l: Array<number | null> = q?.low ?? []
          const c: Array<number | null> = q?.close ?? []
          const v: Array<number | null> = q?.volume ?? []

          const chartData = timestamps
            .map((ts, i) => {
              const open = Number(o?.[i] ?? NaN)
              const high = Number(h?.[i] ?? NaN)
              const low = Number(l?.[i] ?? NaN)
              const close = Number(c?.[i] ?? NaN)
              const volume = Number(v?.[i] ?? 0)
              if (![open, high, low, close].every(Number.isFinite)) return null
              return {
                timestamp: ts * 1000,
                open,
                high,
                low,
                close,
                volume: Number.isFinite(volume) ? Math.floor(volume) : 0,
              }
            })
            .filter((row: unknown): row is { timestamp: number; open: number; high: number; low: number; close: number; volume: number } => Boolean(row))

          if (chartData.length > 0) {
            return NextResponse.json({
              symbol: symbol.toUpperCase(),
              timeframe: timeframe.toUpperCase(),
              data: chartData,
            })
          }
        }
      } catch (yahooError) {
        console.error('Yahoo chart fallback failed:', yahooError)
      }

      return NextResponse.json(
        { symbol: symbol.toUpperCase(), timeframe: timeframe.toUpperCase(), data: [], error: 'No real chart data returned by providers' },
        { status: 200 }
      )
    }

    const entries = Object.entries(series).sort((a, b) => (a[0] < b[0] ? -1 : 1))
    const maxPoints =
      timeframe === '1d' ? 5 :
      timeframe === '1w' ? 7 :
      timeframe === '1m' ? 30 :
      timeframe === '3m' ? 90 :
      timeframe === '1y' ? 252 :
      timeframe === '5y' ? 1260 :
      30

    const sliced = entries.slice(Math.max(0, entries.length - maxPoints))
    const chartData = sliced.map(([dateStr, row]) => {
      const timestamp = new Date(dateStr).getTime()
      const typedRow = row as Record<string, string | undefined>
      return {
        timestamp,
        open: parseFloat(typedRow['1. open'] ?? '0'),
        high: parseFloat(typedRow['2. high'] ?? '0'),
        low: parseFloat(typedRow['3. low'] ?? '0'),
        close: parseFloat(typedRow['4. close'] ?? '0'),
        volume: Math.floor(parseFloat(typedRow['6. volume'] ?? '0')),
      }
    })

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      timeframe: timeframe.toUpperCase(),
      data: chartData,
    })

  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
