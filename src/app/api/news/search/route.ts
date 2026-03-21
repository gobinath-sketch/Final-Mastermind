import { NextRequest, NextResponse } from 'next/server'

const NEWS_API_KEY = '3f228b229db2419b98bff4bea635a441'
const NEWS_API_URL = 'https://newsapi.org/v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, language = 'en', pageSize = 20, page = 1 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    let url = `${NEWS_API_URL}/everything?apiKey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${page}&sortBy=publishedAt`

    if (language) {
      url += `&language=${language}`
    }

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform the data to match our interface
    const articles = data.articles?.map((article: {
      title: string
      description: string
      url: string
      publishedAt: string
      source: { name: string }
      author?: string
      urlToImage?: string
      content?: string
    }, index: number) => ({
      id: `search_${Date.now()}_${index}`,
      title: article.title || 'No title',
      description: article.description || '',
      url: article.url || '',
      publishedAt: article.publishedAt || new Date().toISOString(),
      source: article.source?.name || 'Unknown',
      author: article.author,
      urlToImage: article.urlToImage,
      content: article.content
    })) || []

    return NextResponse.json(articles)

  } catch (error) {
    console.error('Error searching news:', error)
    return NextResponse.json(
      { error: 'Failed to search news' },
      { status: 500 }
    )
  }
}
