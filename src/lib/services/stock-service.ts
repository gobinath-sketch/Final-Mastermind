export interface StockQuote {
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
}

export interface StockChartData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockNews {
  id: string
  title: string
  summary: string
  url: string
  publishedAt: string
  source: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  addedAt: string
}

export interface PortfolioItem {
  symbol: string
  shares: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  gainLoss: number
  gainLossPercent: number
}

class StockService {
  private baseUrl = '/api/stocks'
  
  // API Keys
  private finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd2q2qjhr01qnf9nn8ti0d2q2qjhr01qnf9nn8tig'
  private alphaVantageKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'ANEBEZ36W1G7OT61'
  private yahooFinanceKey = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY || 'ef7994ada9mshe853dff7586d068p1b8839jsneb6865952289'

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await fetch(`${this.baseUrl}/quote/${symbol}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching stock quote:', error)
      throw new Error('Failed to fetch stock quote')
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      const response = await fetch(`${this.baseUrl}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching multiple quotes:', error)
      throw new Error('Failed to fetch stock quotes')
    }
  }

  async getChartData(
    symbol: string,
    timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y' = '1M'
  ): Promise<StockChartData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chart/${symbol}?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching chart data:', error)
      throw new Error('Failed to fetch chart data')
    }
  }

  async getTopMovers(type: 'gainers' | 'losers' | 'most_active'): Promise<StockQuote[]> {
    try {
      const response = await fetch(`${this.baseUrl}/movers/${type}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching top movers:', error)
      throw new Error('Failed to fetch top movers')
    }
  }

  async searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching stocks:', error)
      throw new Error('Failed to search stocks')
    }
  }

  async getStockNews(symbol: string, limit: number = 10): Promise<StockNews[]> {
    try {
      const response = await fetch(`${this.baseUrl}/news/${symbol}?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching stock news:', error)
      throw new Error('Failed to fetch stock news')
    }
  }

  async addToWatchlist(userId: string, symbol: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, symbol }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      throw new Error('Failed to add to watchlist')
    }
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlist?symbol=${symbol}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      throw new Error('Failed to remove from watchlist')
    }
  }

  async getWatchlist(): Promise<WatchlistItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlist`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching watchlist:', error)
      throw new Error('Failed to fetch watchlist')
    }
  }

  async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/portfolio/${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching portfolio:', error)
      throw new Error('Failed to fetch portfolio')
    }
  }

  async addToPortfolio(
    userId: string,
    symbol: string,
    shares: number,
    price: number
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, symbol, shares, price }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error adding to portfolio:', error)
      throw new Error('Failed to add to portfolio')
    }
  }

  async updatePortfolio(
    userId: string,
    symbol: string,
    shares: number,
    price: number
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/portfolio/${userId}/${symbol}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shares, price }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error updating portfolio:', error)
      throw new Error('Failed to update portfolio')
    }
  }

  async removeFromPortfolio(userId: string, symbol: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/portfolio/${userId}/${symbol}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error removing from portfolio:', error)
      throw new Error('Failed to remove from portfolio')
    }
  }
}

export const stockService = new StockService()
