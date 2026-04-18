'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { validatePassword } from '@/shared/utils'
import MatrixBackground from '@/components/MatrixBackground'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const { signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field === 'password') {
      const validation = validatePassword(value)
      setPasswordErrors(validation.errors)
    }
  }

  const attemptSignup = useCallback(async () => {
    if (loading) return
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don’t match",
        description: "Double-check both password fields.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      toast({
        title: "Strength check failed",
        description: passwordValidation.errors.join(', '),
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim()
      )

      if (error) {
        toast({
          title: "Couldn’t create account",
          description: error.message || "Please try a different email.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Account ready!",
        description: "Verify your inbox to finish setup.",
      })
      router.push('/login')
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [formData, loading, router, signUp, toast])

  const handleSubmit = async (
    event?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLFormElement>
  ) => {
    event?.preventDefault()
    await attemptSignup()
  }

  return (
    <div className="auth-theme-override relative min-h-[100dvh] px-4 overflow-hidden">
      <MatrixBackground />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-5 py-6">
        {/* Header */}
        <div className="text-center space-y-1.5">

          <h1 className="text-3xl font-semibold text-white">Create your account</h1>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-2 inline-flex items-center border border-white/20 px-3 py-1.5 text-xs font-medium text-sky-300 hover:border-sky-400 hover:text-sky-200"
          >
            Back to Website
          </button>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-white">Sign up</CardTitle>
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
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="h-10 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-10 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    autoComplete="new-password"
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
                {passwordErrors.length > 0 && (
                  <div className="text-xs text-destructive space-y-1">
                    {passwordErrors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-10 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 p-0 flex items-center justify-center leading-none text-white/70 hover:text-white"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-sky-400 hover:text-sky-300 hover:underline font-medium transition-colors"
                  aria-label="Go to login page"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  )
}
