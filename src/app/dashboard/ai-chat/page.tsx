'use client'

import Chatbot from '@/components/Chatbot'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MessageCircle, Briefcase, FileText, TrendingUp, DollarSign, ArrowDownRight } from 'lucide-react'
import { BackToDashboardButton } from '@/components/BackToDashboardButton'

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: 'Sign in required',
        description: 'Log in to chat with the assistant.',
        variant: 'destructive',
      })
      router.push('/login')
    }
  }, [loading, router, toast, user])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/15">
                <MessageCircle className="h-5 w-5 text-white" />
              </span>
              AI Assistant
            </h1>
            <p className="text-white/60">
              Ask questions about careers, finance, markets, or get personalized recommendations.
            </p>
          </div>
          <BackToDashboardButton />
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Features Grid */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl h-full">
              <CardHeader>
                <CardTitle className="text-white">What I can do for you</CardTitle>
                <CardDescription className="text-white/60">
                  I'm trained to help you navigate your career and financial journey.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="mb-2 h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-blue-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Job Search</h3>
                    <p className="text-xs text-white/60">Find relevant roles based on your skills and preferences.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="mb-2 h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-purple-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Resume Help</h3>
                    <p className="text-xs text-white/60"> optimize your resume for specific job applications.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="mb-2 h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Market Insights</h3>
                    <p className="text-xs text-white/60">Get real-time stock data and market trends.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="mb-2 h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-yellow-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Financial Tips</h3>
                    <p className="text-xs text-white/60">Advice on budgeting, saving, and investing.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="h-[600px] md:h-auto">
            <Chatbot mode="embedded" className="h-full border border-white/10 bg-white/5 backdrop-blur-xl" />
          </div>
        </div>
      </main>
    </div>
  )
}
