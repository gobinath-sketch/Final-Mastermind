import { NextRequest, NextResponse } from 'next/server'

const NEWS_API_KEY = process.env.NEWS_API_KEY || '3f228b229db2419b98bff4bea635a441'
const NEWS_API_URL = 'https://newsapi.org/v2'

type HeadlineParams = {
  category?: string
  country?: string
  language?: string
  pageSize?: number
  page?: number
}

async function fetchTopHeadlines(params: HeadlineParams) {
  const {
    category,
    country = 'us',
    language = 'en',
    pageSize = 20,
    page = 1,
  } = params

  let url = `${NEWS_API_URL}/top-headlines?apiKey=${NEWS_API_KEY}&pageSize=${pageSize}&page=${page}`

  if (category) {
    url += `&category=${category}`
  }

  if (country) {
    url += `&country=${country}`
  }

  if (language) {
    url += `&language=${language}`
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`News API error: ${response.status}`)
  }

  const data = await response.json()

  const articles =
    data.articles?.map(
      (
        article: {
          title: string
          description: string
          url: string
          publishedAt: string
          source: { name: string }
          author?: string
          urlToImage?: string
          content?: string
        },
        index: number
      ) => ({
        id: `news_${Date.now()}_${index}`,
        title: article.title || 'No title',
        description: article.description || '',
        url: article.url || '',
        publishedAt: article.publishedAt || new Date().toISOString(),
        source: {
          id: null as string | null,
          name: article.source?.name || 'Unknown',
        },
        author: article.author,
        urlToImage: article.urlToImage,
        content: article.content,
      })
    ) || []

  return articles
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const country = searchParams.get('country') || 'us'
    const language = searchParams.get('language') || 'en'
    const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10)
    const page = Number.parseInt(searchParams.get('page') || '1', 10)

    const articles = await fetchTopHeadlines({
      category,
      country,
      language,
      pageSize: Number.isFinite(pageSize) ? pageSize : 20,
      page: Number.isFinite(page) ? page : 1,
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching news headlines:', error)
    return NextResponse.json({ error: 'Failed to fetch news headlines' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, country = 'us', language = 'en', pageSize = 20, page = 1 } = body

    const articles = await fetchTopHeadlines({
      category,
      country,
      language,
      pageSize,
      page,
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching news headlines:', error)
    return NextResponse.json({ error: 'Failed to fetch news headlines' }, { status: 500 })
  }
}
