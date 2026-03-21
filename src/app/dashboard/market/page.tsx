'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/shared/hooks/use-toast'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Star,
  ArrowLeft,
  BarChart3,
  Activity
} from 'lucide-react'
import { BackToDashboardButton } from '@/components/BackToDashboardButton'
import { stockService, StockQuote, WatchlistItem } from '@/lib/services/stock-service'
import { formatCurrency } from '@/shared/utils'

export default function StocksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockQuote[]>([])
  const [loadingStocks, setLoadingStocks] = useState(false)
  const [loadingWatchlist, setLoadingWatchlist] = useState(false)

  const loadWatchlist = useCallback(async () => {
    if (!user) return

    setLoadingWatchlist(true)
    try {
      const watchlistData = await stockService.getWatchlist()
      setWatchlist(watchlistData)
    } catch (error) {
      console.error('Error loading watchlist:', error)
    } finally {
      setLoadingWatchlist(false)
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadWatchlist()
    }
  }, [user, loading, router, loadWatchlist])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoadingStocks(true)
    try {
      const results = await stockService.searchStocks(searchQuery)
      // Convert search results to quotes
      const quotes = await Promise.all(
        results.slice(0, 5).map(async (result) => {
          try {
            return await stockService.getQuote(result.symbol)
          } catch {
            return null
          }
        })
      )
      setSearchResults(quotes.filter(Boolean) as StockQuote[])
    } catch {
      toast({
        title: "Search Failed",
        description: "Failed to search stocks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingStocks(false)
    }
  }

  const handleAddToWatchlist = async (symbol: string) => {
    if (!user) return

    try {
      await stockService.addToWatchlist(user.id, symbol)
      toast({
        title: "Added to Watchlist",
        description: `${symbol} has been added to your watchlist`,
      })
      loadWatchlist()
    } catch {
      toast({
        title: "Add Failed",
        description: "Failed to add stock to watchlist. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFromWatchlist = async (symbol: string) => {
    if (!user) return

    try {
      await stockService.removeFromWatchlist(user.id, symbol)
      toast({
        title: "Removed from Watchlist",
        description: `${symbol} has been removed from your watchlist`,
      })
      loadWatchlist()
    } catch {
      toast({
        title: "Remove Failed",
        description: "Failed to remove stock from watchlist. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/50 border-b border-gray-800 backdrop-blur-sm">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BackToDashboardButton className="mr-4" />
              <h1 className="text-2xl font-bold text-white">Stock Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="bg-gray-900/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Search Stocks</CardTitle>
            <CardDescription className="text-gray-400">
              Search for stocks to add to your watchlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter stock symbol (e.g., AAPL, GOOGL, MSFT)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="pl-10 bg-black/50 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/30"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loadingStocks}
                className="bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white"
              >
                {loadingStocks ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="bg-gray-900/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-white">{stock.symbol}</h3>
                        <span className="text-gray-400">{stock.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xl font-bold text-white">{formatCurrency(stock.price)}</span>
                        <div className={`flex items-center space-x-1 ${getChangeColor(stock.change)}`}>
                          {getChangeIcon(stock.change)}
                          <span>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}</span>
                          <span>({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddToWatchlist(stock.symbol)}
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-600 hover:border-sky-400"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Watchlist
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Watchlist */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400" />
              Your Watchlist
            </CardTitle>
            <CardDescription className="text-gray-400">
              Track your favorite stocks and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWatchlist ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading watchlist...</p>
              </div>
            ) : watchlist.length > 0 ? (
              <div className="grid gap-4">
                {watchlist.map((item) => {
                  const priceValue = typeof item.price === 'number' ? item.price : 0
                  const changeValue = typeof item.change === 'number' ? item.change : 0
                  const changePercentValue =
                    typeof item.changePercent === 'number' ? item.changePercent : 0

                  return (
                    <div key={item.symbol} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">{item.symbol}</h3>
                          <span className="text-gray-400">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xl font-bold text-white">{formatCurrency(priceValue)}</span>
                          <div className={`flex items-center space-x-1 ${getChangeColor(changeValue)}`}>
                            {getChangeIcon(changeValue)}
                            <span>{changeValue > 0 ? '+' : ''}{changeValue.toFixed(2)}</span>
                            <span>({changePercentValue > 0 ? '+' : ''}{changePercentValue.toFixed(2)}%)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-300 border-gray-600 hover:border-sky-400"
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Chart
                        </Button>
                        <Button
                          onClick={() => handleRemoveFromWatchlist(item.symbol)}
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-600 hover:border-red-500"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No stocks in watchlist</h3>
                <p className="text-gray-500 mb-6">
                  Search for stocks above to add them to your watchlist
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-semibold text-sky-300 mb-1">Popular Stocks</h4>
                    <p className="text-xs text-gray-400">AAPL, GOOGL, MSFT</p>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-semibold text-sky-300 mb-1">Tech Giants</h4>
                    <p className="text-xs text-gray-400">TSLA, META, NVDA</p>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-semibold text-sky-300 mb-1">Finance</h4>
                    <p className="text-xs text-gray-400">JPM, BAC, WFC</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
