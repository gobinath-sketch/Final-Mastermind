'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Bell,
  Briefcase,
  CreditCard,
  DollarSign,
  Edit3,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Moon,
  Plus,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
  Upload,
  User as UserIcon,
} from 'lucide-react'

import { BackToDashboardButton } from '@/components/BackToDashboardButton'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Skill, UserPreferences } from '@/shared/database/types'
import { useToast } from '@/shared/hooks/use-toast'
import { formatDate, formatRelativeTime } from '@/shared/utils'

const SKILL_LEVELS: Skill['level'][] = ['beginner', 'intermediate', 'advanced', 'expert']
const REMOTE_OPTIONS: Array<UserPreferences['job_preferences']['remote_preference']> = [
  'any',
  'remote',
  'hybrid',
  'onsite',
]
const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', label: 'Australian Dollar', symbol: '$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: '$' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: '$' },
]
const SALARY_PRESETS = [30000, 50000, 75000, 100000, 150000, 200000]

const defaultPreferences = (prefs?: UserPreferences | null): UserPreferences => ({
  theme: prefs?.theme ?? 'dark',
  notifications: {
    email: prefs?.notifications?.email ?? true,
    push: prefs?.notifications?.push ?? false,
    job_alerts: prefs?.notifications?.job_alerts ?? true,
    stock_alerts: prefs?.notifications?.stock_alerts ?? false,
  },
  job_preferences: {
    locations: prefs?.job_preferences?.locations ?? [],
    remote_preference: prefs?.job_preferences?.remote_preference ?? 'any',
    salary_range: {
      min: prefs?.job_preferences?.salary_range?.min ?? 0,
      max: prefs?.job_preferences?.salary_range?.max ?? 0,
      currency: prefs?.job_preferences?.salary_range?.currency ?? 'USD',
    },
  },
})

const safeSkills = (value: unknown): Skill[] =>
  Array.isArray(value)
    ? value
      .filter(
        (item): item is Skill =>
          typeof item?.name === 'string' &&
          ['beginner', 'intermediate', 'advanced', 'expert'].includes(item?.level as string)
      )
    : []

export default function ProfilePage() {
  const { toast } = useToast()
  const { user, profile, updateProfile } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [displayName, setDisplayName] = useState(profile?.full_name ?? '')
  const [displayNameSaving, setDisplayNameSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [skills, setSkills] = useState<Skill[]>(safeSkills(profile?.skills))
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState<Skill['level']>('intermediate')

  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences(profile?.preferences))
  const [jobLocationInput, setJobLocationInput] = useState('')
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [savingJobPrefs, setSavingJobPrefs] = useState(false)
  const [savingSkills, setSavingSkills] = useState(false)
  const [salaryError, setSalaryError] = useState<string | null>(null)

  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    savedJobs: 0,
    resumes: 0,
    watchlist: 0,
    transactions: 0,
  })

  useEffect(() => {
    setDisplayName(profile?.full_name ?? '')
    setAvatarUrl(profile?.avatar_url ?? '')
    setSkills(safeSkills(profile?.skills))
    setPreferences(defaultPreferences(profile?.preferences))
  }, [profile])

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const res = await fetch('/api/user/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error loading profile stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const lastSignIn = useMemo(() => {
    return 'Recently'
  }, [])

  const memberSince = useMemo(() => {
    if (!user?.createdAt && !user?.created_at) return 'Unknown'
    return formatDate(user.createdAt || user.created_at)
  }, [user])

  const handleDisplayNameSave = async () => {
    if (!user) return
    const trimmed = displayName.trim()
    if (!trimmed) {
      toast({
        title: 'Display name required',
        description: 'Please enter a display name before saving.',
        variant: 'destructive',
      })
      return
    }

    setDisplayNameSaving(true)
    const { error } = await updateProfile({ full_name: trimmed })
    setDisplayNameSaving(false)
    if (error) {
      toast({
        title: 'Unable to update',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Display name updated' })
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    toast({ title: 'Avatar upload not implemented yet', variant: 'destructive' })
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    setUploadingAvatar(true)
    const { error } = await updateProfile({ avatar_url: '' })
    setUploadingAvatar(false)
    if (error) {
      toast({
        title: 'Unable to reset avatar',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    setAvatarUrl('')
    toast({ title: 'Avatar removed' })
  }

  const handlePreferencesSave = async () => {
    if (!user) return
    setSavingPreferences(true)
    const { error } = await updateProfile({ preferences })
    setSavingPreferences(false)
    if (error) {
      toast({
        title: 'Unable to save preferences',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Preferences updated' })
  }

  const handleJobPreferencesSave = async () => {
    if (!user) return
    const { min, max } = preferences.job_preferences.salary_range
    if (min && max && min > max) {
      setSalaryError('Maximum salary should be greater than or equal to minimum salary.')
      toast({
        title: 'Check salary range',
        description: 'Minimum salary cannot be higher than maximum salary.',
        variant: 'destructive',
      })
      return
    }

    setSavingJobPrefs(true)
    const { error } = await updateProfile({ preferences })
    setSavingJobPrefs(false)
    if (error) {
      toast({
        title: 'Unable to update job preferences',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Job preferences saved' })
  }

  const handleAddSkill = async () => {
    const name = newSkillName.trim()
    if (!name) {
      toast({
        title: 'Skill name required',
        description: 'Enter a name before adding a skill.',
        variant: 'destructive',
      })
      return
    }
    if (skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      toast({
        title: 'Duplicate skill',
        description: 'This skill is already on your profile.',
      })
      return
    }

    const updated = [...skills, { name, level: newSkillLevel }]
    setSavingSkills(true)
    const { error } = await updateProfile({ skills: updated })
    setSavingSkills(false)
    if (error) {
      toast({
        title: 'Unable to add skill',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    setSkills(updated)
    setNewSkillName('')
    setNewSkillLevel('intermediate')
    toast({ title: 'Skill added' })
  }

  const handleRemoveSkill = async (name: string) => {
    const updated = skills.filter((skill) => skill.name !== name)
    setSavingSkills(true)
    const { error } = await updateProfile({ skills: updated })
    setSavingSkills(false)
    if (error) {
      toast({
        title: 'Unable to remove skill',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    setSkills(updated)
    toast({ title: 'Skill removed' })
  }

  const handleAddLocation = () => {
    const value = jobLocationInput.trim()
    if (!value) return

    setPreferences((prev) => {
      if (prev.job_preferences.locations.some((loc) => loc.toLowerCase() === value.toLowerCase())) {
        toast({ title: 'Location already added' })
        return prev
      }
      return {
        ...prev,
        job_preferences: {
          ...prev.job_preferences,
          locations: [...prev.job_preferences.locations, value],
        },
      }
    })
    setJobLocationInput('')
  }

  const handleRemoveLocation = (location: string) => {
    setPreferences((prev) => ({
      ...prev,
      job_preferences: {
        ...prev.job_preferences,
        locations: prev.job_preferences.locations.filter((item) => item !== location),
      },
    }))
  }

  const renderStats = () => {
    if (statsLoading) {
      return (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-white/70" />
        </div>
      )
    }

    const statItems = [
      { label: 'Saved jobs', value: stats.savedJobs, icon: Briefcase },
      { label: 'Resumes', value: stats.resumes, icon: FileText },
      { label: 'Watchlist', value: stats.watchlist, icon: Star },
      { label: 'Transactions', value: stats.transactions, icon: CreditCard },
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {statItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
                <p className="text-xl font-semibold text-white mt-1">{value}</p>
              </div>
              <div className="rounded-full bg-white/10 p-2">
                <Icon className="h-4 w-4 text-white/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const selectedCurrency =
    CURRENCY_OPTIONS.find(
      (currency) => currency.code === preferences.job_preferences.salary_range.currency.toUpperCase()
    ) ?? CURRENCY_OPTIONS[0]

  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="mb-4">
          <BackToDashboardButton />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl flex-1">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
              <div className="relative h-20 w-20 rounded-full border border-white/20 bg-black/60 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName || 'Profile avatar'} fill sizes="80px" className="object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-white/60" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-white">{displayName || user?.email?.split('@')[0]}</h1>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    Member since {memberSince}
                  </span>
                </div>
                <p className="text-sm text-white/60">{user?.email}</p>
                <p className="text-xs text-white/40">Last active {lastSignIn}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  aria-label="Upload profile avatar"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/80 hover:text-white"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                  Upload
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-300 hover:text-red-100"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-white">Account basics</CardTitle>
                <p className="text-sm text-white/50">Update your identity within the workspace.</p>
              </div>
              <Edit3 className="h-5 w-5 text-white/50" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Display name</label>
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                    className="bg-gray-900/40 border-white/15 focus:border-white/30 text-white"
                  />
                  <Button onClick={handleDisplayNameSave} disabled={displayNameSaving}>
                    {displayNameSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-white/60">Account email</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/80">
                  <Mail className="h-4 w-4 text-white/50" />
                  {user?.email}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-white">Security</CardTitle>
                <p className="text-sm text-white/50">Keep your account safe and up to date.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-white/50" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <div>
                  <p className="text-sm text-white">Password</p>
                  <p className="text-xs text-white/50">Last signed in {lastSignIn}</p>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white/80 hover:text-white" asChild>
                  <Link href="/reset-password">Reset</Link>
                </Button>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <p className="text-xs text-white/60">Tip: enable two-factor authentication from your email provider for additional safety.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-white">Career & finance snapshot</CardTitle>
                <p className="text-sm text-white/50">A quick overview of your activity inside Sphinx.</p>
              </div>
              <Activity className="h-5 w-5 text-white/50" />
            </CardHeader>
            <CardContent>{renderStats()}</CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-white">Notification preferences</CardTitle>
                <p className="text-sm text-white/50">Choose how you stay informed.</p>
              </div>
              <Bell className="h-5 w-5 text-white/50" />
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: 'email', label: 'Email updates', description: 'Weekly digest and product updates.' },
                  { key: 'push', label: 'Browser push', description: 'Real-time alerts while you are signed in.' },
                  { key: 'job_alerts', label: 'Job alerts', description: 'Instant notifications for matching roles.' },
                  { key: 'stock_alerts', label: 'Market updates', description: 'Daily summaries for your watchlist.' },
                ] as const
              ).map(({ key, label, description }) => (
                <label key={key} className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-black/40 px-3 py-3">
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-white/50">{description}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-sky-500"
                    checked={preferences.notifications[key]}
                    onChange={(event) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, [key]: event.target.checked },
                      }))
                    }
                  />
                </label>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-3">
                <div className="flex items-center gap-2 text-sm text-white">
                  {preferences.theme === 'dark' ? <Moon className="h-4 w-4 text-white/60" /> : <Sun className="h-4 w-4 text-white/60" />}
                  Theme preference
                </div>
                <select
                  value={preferences.theme}
                  onChange={(event) =>
                    setPreferences((prev) => ({
                      ...prev,
                      theme: event.target.value as UserPreferences['theme'],
                    }))
                  }
                  className="rounded-md border border-white/15 bg-black/60 px-2 py-1 text-sm text-white focus:border-white/30"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>
              <Button onClick={handlePreferencesSave} disabled={savingPreferences} className="w-full">
                {savingPreferences ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save notification settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-white">Job preferences</CardTitle>
              <p className="text-sm text-white/50">Help the assistant tailor recommendations and alerts.</p>
            </div>
            <Briefcase className="h-5 w-5 text-white/50" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm text-white/60 mb-2">Preferred locations</label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={jobLocationInput}
                  onChange={(event) => setJobLocationInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddLocation()
                    }
                  }}
                  placeholder="Add city or country"
                  className="bg-gray-900/40 border-white/15 focus:border-white/30 text-white"
                />
                <Button type="button" variant="outline" className="border-white/20 text-white/80 hover:text-white" onClick={handleAddLocation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.job_preferences.locations.length === 0 ? (
                  <p className="text-xs text-white/40">No preferred locations added yet.</p>
                ) : (
                  preferences.job_preferences.locations.map((location) => (
                    <span
                      key={location}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                    >
                      <MapPin className="h-3.5 w-3.5 text-white/60" />
                      {location}
                      <button type="button" onClick={() => handleRemoveLocation(location)} className="text-white/60 hover:text-white">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-white/60 mb-2">Remote preference</label>
                <div className="relative">
                  <select
                    value={preferences.job_preferences.remote_preference}
                    onChange={(event) =>
                      setPreferences((prev) => ({
                        ...prev,
                        job_preferences: { ...prev.job_preferences, remote_preference: event.target.value as typeof REMOTE_OPTIONS[number] },
                      }))
                    }
                    className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                  >
                    {REMOTE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Globe2 className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-white/40" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Currency</label>
                <select
                  value={preferences.job_preferences.salary_range.currency.toUpperCase()}
                  onChange={(event) =>
                    setPreferences((prev) => ({
                      ...prev,
                      job_preferences: {
                        ...prev.job_preferences,
                        salary_range: {
                          ...prev.job_preferences.salary_range,
                          currency: event.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/40"
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} • {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-white/60 mb-2">Minimum salary</label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    step={1000}
                    value={preferences.job_preferences.salary_range.min}
                    onChange={(event) =>
                      setPreferences((prev) => ({
                        ...prev,
                        job_preferences: {
                          ...prev.job_preferences,
                          salary_range: {
                            ...prev.job_preferences.salary_range,
                            min: Number(event.target.value),
                          },
                        },
                      }))
                    }
                    onFocus={() => setSalaryError(null)}
                    className="bg-gray-900/40 border-white/15 focus:border-primary text-white pl-9 pr-10"
                  />
                  <span className="pointer-events-none absolute left-3 top-3 text-white/40 text-sm">
                    {selectedCurrency.symbol}
                  </span>
                  <DollarSign className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-white/40" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SALARY_PRESETS.map((preset) => (
                    <button
                      key={`min-${preset}`}
                      type="button"
                      onClick={() => {
                        setSalaryError(null)
                        setPreferences((prev) => ({
                          ...prev,
                          job_preferences: {
                            ...prev.job_preferences,
                            salary_range: { ...prev.job_preferences.salary_range, min: preset },
                          },
                        }))
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${preferences.job_preferences.salary_range.min === preset
                        ? 'border-sky-400 bg-sky-400/10 text-sky-100'
                        : 'border-white/15 text-white/60 hover:border-sky-400 hover:text-sky-200'
                        }`}
                    >
                      {selectedCurrency.symbol}
                      {Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(preset)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Maximum salary</label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    step={1000}
                    value={preferences.job_preferences.salary_range.max}
                    onChange={(event) =>
                      setPreferences((prev) => ({
                        ...prev,
                        job_preferences: {
                          ...prev.job_preferences,
                          salary_range: {
                            ...prev.job_preferences.salary_range,
                            max: Number(event.target.value),
                          },
                        },
                      }))
                    }
                    onFocus={() => setSalaryError(null)}
                    className="bg-gray-900/40 border-white/15 focus:border-primary text-white pl-9 pr-10"
                  />
                  <span className="pointer-events-none absolute left-3 top-3 text-white/40 text-sm">
                    {selectedCurrency.symbol}
                  </span>
                  <DollarSign className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-white/40" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SALARY_PRESETS.map((preset) => (
                    <button
                      key={`max-${preset}`}
                      type="button"
                      onClick={() => {
                        setSalaryError(null)
                        setPreferences((prev) => ({
                          ...prev,
                          job_preferences: {
                            ...prev.job_preferences,
                            salary_range: { ...prev.job_preferences.salary_range, max: preset },
                          },
                        }))
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${preferences.job_preferences.salary_range.max === preset
                        ? 'border-sky-400 bg-sky-400/10 text-sky-100'
                        : 'border-white/15 text-white/60 hover:border-sky-400 hover:text-sky-200'
                        }`}
                    >
                      {selectedCurrency.symbol}
                      {Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(preset)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {salaryError && <p className="text-sm text-red-300 mt-2">{salaryError}</p>}
            <Button onClick={handleJobPreferencesSave} disabled={savingJobPrefs} className="w-full">
              {savingJobPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save job preferences
            </Button>
          </CardContent>
        </Card>

        {/* Skills Section - Keep simplified for now */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a skill"
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                className="bg-gray-900/40 border-white/15 focus:border-white/30 text-white"
              />
              <Button onClick={handleAddSkill} disabled={savingSkills}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <div key={skill.name} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                  {skill.name}
                  <button onClick={() => handleRemoveSkill(skill.name)} className="hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
