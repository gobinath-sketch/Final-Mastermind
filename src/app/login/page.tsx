'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import MatrixBackground from '@/components/MatrixBackground'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const attemptSignin = useCallback(async () => {
    if (loading) return
    setLoading(true)

    try {
      const { error } = await signIn(email.trim(), password)

      if (error) {
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Welcome back!",
        description: "You’re now signed in.",
      })
      router.push('/dashboard')
    } catch {
      toast({
        title: "Something went wrong",
        description: "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [email, loading, password, router, signIn, toast])

  const handleSubmit = async (
    event?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLFormElement>
  ) => {
    event?.preventDefault()
    await attemptSignin()
  }

  return (
    <div className="relative min-h-[100dvh] px-4 overflow-hidden">
      <MatrixBackground />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-5 py-6">
        {/* Header */}
        <div className="text-center space-y-1.5">

          <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-white">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleSubmit(event)
                }
              }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 p-0 flex items-center justify-center leading-none text-white/70 hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                  aria-label="Forgot password"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-10"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/signup')}
                  className="text-sky-400 hover:text-sky-300 hover:underline font-medium transition-colors"
                  aria-label="Go to signup page"
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer space for balance */}
      </div>
    </div >
  )
}
