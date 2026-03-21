'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/shared/hooks/use-toast'
import {
  Newspaper,
  Search,
  ExternalLink,
  Calendar,
  ArrowLeft,
  TrendingUp,
  Briefcase,
  DollarSign
} from 'lucide-react'
import { BackToDashboardButton } from '@/components/BackToDashboardButton'
import { newsService, NewsArticle } from '@/lib/services/news-service'
import { formatRelativeTime } from '@/shared/utils'

export default function NewsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'tech' | 'business' | 'personalized'>('all')

  const loadNews = useCallback(async (category: string = 'all') => {
    setLoadingNews(true)
    try {
      let newsData: NewsArticle[] = []

      switch (category) {
        case 'tech':
          newsData = await newsService.getTechNews()
          break
        case 'business':
          newsData = await newsService.getBusinessNews()
          break
        case 'personalized':
          if (profile?.skills && profile.skills.length > 0) {
            const skillNames = profile.skills.map(skill => skill.name)
            newsData = await newsService.getPersonalizedNews(skillNames)
          } else {
            newsData = await newsService.getTechNews()
          }
          break
        default:
          newsData = await newsService.getTopHeadlines({ pageSize: 30 })
      }

      setArticles(newsData)
    } catch {
      toast({
        title: "Error Loading News",
        description: "Failed to load news articles. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingNews(false)
    }
  }, [profile?.skills, toast])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadNews()
    }
  }, [user, loading, router, loadNews])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoadingNews(true)
    try {
      const searchResults = await newsService.searchNews({
        query: searchQuery,
        pageSize: 20
      })
      setArticles(searchResults)
    } catch {
      toast({
        title: "Search Failed",
        description: "Failed to search news. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingNews(false)
    }
  }

  const handleCategoryChange = (category: 'all' | 'tech' | 'business' | 'personalized') => {
    setActiveCategory(category)
    loadNews(category)
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
              <h1 className="text-2xl font-bold text-white">News Feed</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="bg-gray-900/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Stay Informed</CardTitle>
            <CardDescription className="text-gray-400">
              Get the latest news on technology, business, and your areas of interest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/50 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/30"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loadingNews}
                className="bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white"
              >
                {loadingNews ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Category Tabs */}
            <div className="flex space-x-2">
              {([
                { key: 'all' as const, label: 'All News', icon: Newspaper },
                { key: 'tech' as const, label: 'Technology', icon: TrendingUp },
                { key: 'business' as const, label: 'Business', icon: DollarSign },
                { key: 'personalized' as const, label: 'For You', icon: Briefcase }
              ] as const).map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(key)}
                  className={`${activeCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 border-gray-600 hover:border-sky-400'
                    }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* News Articles */}
        {loadingNews ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading news...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {articles.length > 0 ? (
              articles.map((article, index) => (
                <Card key={article.id || index} className="bg-gray-900/50 border-gray-700 hover:border-sky-400/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2 hover:text-sky-300 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-300 mb-4 line-clamp-3">
                          {article.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                          <div className="flex items-center">
                            <Newspaper className="h-4 w-4 mr-1" />
                            {article.source.name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatRelativeTime(article.publishedAt)}
                          </div>
                        </div>

                        {article.urlToImage && (
                          <div className="mb-4">
                            <Image
                              src={article.urlToImage}
                              alt={article.title}
                              width={400}
                              height={192}
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(article.url, '_blank')}
                          className="text-gray-300 border-gray-600 hover:border-sky-400"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Read More
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Newspaper className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No articles found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or selecting a different category
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
