'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/shared/hooks/use-toast'
import MatrixBackground from '@/components/MatrixBackground'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to send request')

      setSubmitted(true)
      // DEV ONLY: If token returned, show it in console/toast for testing
      if (data.token) {
        console.log('DEV RESET LINK: ', `/reset-password?token=${data.token}`)
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 overflow-hidden">
      <MatrixBackground />
      <div className="relative z-10 w-full max-w-sm space-y-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Reset password</CardTitle>
            <CardDescription className="mt-2 text-sm text-white/60">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send reset link
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="font-medium text-white/60 hover:text-white">
                    Back to sign in
                  </Link>
                </div>
              </form>
            ) : (
              <div className="mt-8 space-y-6">
                <div className="rounded-md bg-emerald-500/10 p-4 border border-emerald-500/20">
                  <p className="text-sm text-emerald-200 text-center">
                    Check your email. We've sent you a link to reset your password.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white" onClick={() => setSubmitted(false)}>
                    Try another email
                  </Button>
                  <Button variant="ghost" className="w-full text-white/60 hover:text-white" asChild>
                    <Link href="/login">Return to login</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
