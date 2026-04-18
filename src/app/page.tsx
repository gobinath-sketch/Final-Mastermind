'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/context/AuthContext'
import MatrixBackground from '@/components/MatrixBackground'
import { Activity, ArrowRight, BarChart3, Briefcase, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { stockService, type StockChartData, type StockQuote } from '@/lib/services/stock-service'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [charts, setCharts] = useState<Record<string, StockChartData[]>>({})

  const landingSymbols = useMemo(() => ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'RELIANCE.NS'], [])
  const tickerTape = useMemo(() => [...landingSymbols, ...landingSymbols], [landingSymbols])

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    if (loading || user) return

    let active = true
    const loadMarketPreview = async () => {
      try {
        const quoteRows = await stockService.getMultipleQuotes(landingSymbols)
        if (!active) return
        setQuotes(quoteRows)

        const chartRows = await Promise.all(
          landingSymbols.slice(0, 3).map(async (symbol) => {
            try {
              const points = await stockService.getChartData(symbol, '1M')
              return [symbol, points.slice(-20)] as const
            } catch {
              return [symbol, []] as const
            }
          })
        )
        if (!active) return
        setCharts(Object.fromEntries(chartRows))
      } catch {
        if (!active) return
        setQuotes([])
        setCharts({})
      }
    }

    loadMarketPreview()
    const interval = setInterval(loadMarketPreview, 60000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [loading, user, landingSymbols])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-sky-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) return null

  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]))

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <MatrixBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black" />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between border border-[#1a4f32] bg-black/70 p-4">
          <div className="flex items-center gap-3">
            <div className="border border-[#39ff88] bg-black px-2 py-1 text-xs tracking-[0.25em] text-[#39ff88]">SPHINX</div>
            
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-[#1a4f32] bg-black/70 p-6">
            <p className="mb-3 text-xs tracking-[0.35em] text-[#39ff88]">NEON MODE ACTIVE</p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-[#d7ffe9] sm:text-5xl">
              Build Career, Track Markets, Grow Wealth.
            </h1>
            <p className="max-w-2xl text-sm text-[#9fd8b8] sm:text-base">
              One command center for jobs, resumes, AI guidance, stocks, expenses, and live market intelligence.
              Fast, real, and connected.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 border border-[#39ff88] bg-[#39ff88] px-5 py-3 font-semibold !text-black hover:bg-[#8fffc3]">
                Get Started <ArrowRight className="h-4 w-4 text-black" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 border border-[#39ff88] px-5 py-3 text-[#b8ffd9] hover:bg-[#0d2e1e]">
                Sign In
              </Link>
            </div>
          </div>

          <div className="border border-[#1a4f32] bg-black/70 p-6">
            <p className="mb-4 text-xs tracking-[0.3em] text-[#39ff88]">LIVE PREVIEW</p>
            <div className="space-y-3 text-sm text-[#c9ffdf]">
              <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-[#39ff88]" /> Real jobs from connected providers</div>
              <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#39ff88]" /> Live stock quotes and market charts</div>
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-[#39ff88]" /> Real-time dashboard data and watchlist</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#39ff88]" /> Secure auth + database persistence</div>
            </div>
          </div>
        </section>

        <section className="mt-6 border border-[#1a4f32] bg-black/70 p-4">
          <div className="mb-2 text-xs tracking-[0.28em] text-[#39ff88]">MARKET TICKER</div>
          <div className="landing-ticker overflow-hidden">
            <div className="landing-ticker-track">
              {tickerTape.map((symbol, index) => {
                const q = quoteMap.get(symbol)
                return (
                  <span key={`${symbol}-${index}`} className="mx-6 inline-flex items-center gap-2 text-sm">
                    <span className="font-semibold text-[#d9ffea]">{symbol}</span>
                    <span className="text-[#8cffbf]">{q ? q.price.toFixed(2) : '--'}</span>
                    <span className={q && q.changePercent < 0 ? 'text-red-400' : 'text-[#39ff88]'}>
                      {q ? `${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%` : '--'}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {landingSymbols.slice(0, 3).map((symbol) => {
            const q = quoteMap.get(symbol)
            const data = charts[symbol] ?? []
            const closes = data.map((d) => d.close)
            const min = closes.length ? Math.min(...closes) : 0
            const max = closes.length ? Math.max(...closes) : 1
            const points = closes.map((value, idx) => {
              const x = (idx / Math.max(closes.length - 1, 1)) * 100
              const y = 100 - ((value - min) / Math.max(max - min, 1)) * 100
              return `${x},${y}`
            }).join(' ')
            return (
              <div key={symbol} className="border border-[#1a4f32] bg-black/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#d9ffea]">{symbol}</p>
                  <p className="text-xs text-[#8fffc3]">{q ? q.price.toFixed(2) : '--'}</p>
                </div>
                <svg viewBox="0 0 100 100" className="h-20 w-full border border-[#123824] bg-black/60">
                  <polyline
                    fill="none"
                    stroke={q && q.changePercent < 0 ? '#f87171' : '#39ff88'}
                    strokeWidth="2"
                    points={points || '0,50 100,50'}
                  />
                </svg>
              </div>
            )
          })}
        </section>

        <section className="mt-8 grid gap-4 border border-[#1a4f32] bg-black/70 p-6 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#d9ffea]">Animated Interface</p>
            <p className="text-xs text-[#9fd8b8]">Matrix rain background, neon cards, ticker movement, and live signal-style visual flow.</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[#d9ffea]">Connected Flow</p>
            <p className="text-xs text-[#9fd8b8]">`Get Started` opens signup, `Sign In` opens login, and authenticated users auto-enter dashboard.</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[#d9ffea]">Contact</p>
            <a href="https://github.com/gobinath-sketch" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#39ff88] px-3 py-2 text-xs text-[#b8ffd9] hover:bg-[#0d2e1e]">
              <Zap className="h-3.5 w-3.5" /> GitHub Profile
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
