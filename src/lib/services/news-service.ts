export interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
  source: {
    id: string | null
    name: string
  }
  author?: string
  urlToImage?: string
  content?: string
}

export interface NewsSearchParams {
  query?: string
  category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology'
  country?: string
  language?: string
  pageSize?: number
  page?: number
}

class NewsService {
  private baseUrl = '/api/news'
  private newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY || '3f228b229db2419b98bff4bea635a441'

  async getTopHeadlines(params?: NewsSearchParams): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/headlines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching top headlines:', error)
      throw new Error('Failed to fetch top headlines')
    }
  }

  async searchNews(params: NewsSearchParams): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching news:', error)
      throw new Error('Failed to search news')
    }
  }

  async getTechNews(): Promise<NewsArticle[]> {
    return this.getTopHeadlines({
      category: 'technology',
      pageSize: 20
    })
  }

  async getBusinessNews(): Promise<NewsArticle[]> {
    return this.getTopHeadlines({
      category: 'business',
      pageSize: 20
    })
  }

  async getPersonalizedNews(userSkills: string[]): Promise<NewsArticle[]> {
    const queries = userSkills.slice(0, 3) // Use top 3 skills
    const allArticles: NewsArticle[] = []

    for (const skill of queries) {
      try {
        const articles = await this.searchNews({
          query: skill,
          pageSize: 5
        })
        allArticles.push(...articles)
      } catch (error) {
        console.error(`Error fetching news for skill ${skill}:`, error)
      }
    }

    // Remove duplicates and sort by date
    const uniqueArticles = allArticles.filter((article, index, self) =>
      index === self.findIndex(a => a.url === article.url)
    )

    return uniqueArticles.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  }
}

export const newsService = new NewsService()
