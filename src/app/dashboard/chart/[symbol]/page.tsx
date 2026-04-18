'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { stockService, type StockChartData } from '@/lib/services/stock-service'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'

export default function ChartPage({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params)
  const symbol = resolvedParams.symbol?.toUpperCase?.() ?? resolvedParams.symbol
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [chartData, setChartData] = useState<StockChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      const initial = !hasLoadedRef.current
      if (initial) setLoading(true)
      else setRefreshing(true)

      try {
        const data = await stockService.getChartData(symbol, timeframe)
        if (!cancelled) setChartData(Array.isArray(data) ? data : [])
        if (!cancelled) {
          hasLoadedRef.current = true
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError('Failed to fetch chart data')
        console.error('Error fetching chart data:', e)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    hasLoadedRef.current = false
    fetchData()
    const id = setInterval(fetchData, 5000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [symbol, timeframe])

  const chartJsData = useMemo(() => {
    const labels = chartData.map((d) => new Date(d.timestamp).toLocaleDateString())
    const closeValues = chartData.map((d) => d.close)

    return {
      labels,
      datasets: [
        {
          label: `${symbol} Close`,
          data: closeValues,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.15)',
          tension: 0.25,
          fill: true,
          pointRadius: 0,
        },
      ],
    }
  }, [chartData, symbol])

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index' as const, intersect: false },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 6 },
          grid: { display: false },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
      },
    }),
    []
  )

  const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', '5Y']

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm" className="border-gray-600 text-gray-200">
            <Link href="/dashboard/market">← Back to Market</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
        </div>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">{symbol} Chart</CardTitle>
            <CardDescription className="text-gray-400">
              Updates every 5 seconds (background polling)
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2 mb-5">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={tf === timeframe ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs border-gray-600"
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <div className="h-[430px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Loading chart...
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No real chart data available for this symbol/timeframe.
                </div>
              ) : (
                <Line data={chartJsData} options={chartOptions} />
              )}
            </div>
            {!loading && refreshing && (
              <p className="mt-2 text-xs text-gray-500">Refreshing in background...</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

