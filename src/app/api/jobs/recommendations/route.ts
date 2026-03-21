import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

type UserSkill = { name?: string } | string

type JobPreferences = {
  locations?: string[]
  remote_preference?: string
  salary_range?: {
    min?: number
    max?: number
  }
  [key: string]: unknown
}

type JobSearchParams = {
  query: string
  location: string
  remote: boolean
  salary_min?: number
  salary_max?: number
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Check authentication
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const user = await User.findById(userPayload.userId).select('skills preferences')

    if (!user) {
      // If user not found (e.g. deleted), return empty or error
      return NextResponse.json({ jobs: [], total: 0, message: 'User not found' })
    }

    const userSkills = Array.isArray(user.skills) ? (user.skills as UserSkill[]) : []
    const jobPreferences = ((user.preferences as { job_preferences?: JobPreferences } | null)?.job_preferences) ?? {}

    // Generate recommended jobs based on user profile
    const recommendedJobs = await generateRecommendedJobs(userSkills, jobPreferences)

    return NextResponse.json({
      jobs: recommendedJobs,
      total: recommendedJobs.length,
      message: 'Personalized job recommendations based on your profile'
    })

  } catch (error) {
    console.error('Error fetching job recommendations:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}

async function generateRecommendedJobs(userSkills: UserSkill[], jobPreferences: JobPreferences): Promise<unknown[]> {
  // This would typically use AI/ML to match jobs with user profile
  // For now, we'll return curated jobs based on common skills

  const skillKeywords = userSkills
    .map((skill) => (typeof skill === 'string' ? skill : skill?.name ?? ''))
    .filter(Boolean)
    .join(' ')
  const location = jobPreferences.locations?.[0] ?? ''
  const remotePreference = jobPreferences.remote_preference ?? 'any'

  // Search for jobs using user's skills
  const searchParams: JobSearchParams = {
    query: skillKeywords || 'software developer',
    location,
    remote: remotePreference === 'remote',
    salary_min: jobPreferences.salary_range?.min,
    salary_max: jobPreferences.salary_range?.max
  }

  // Call the job search API with user preferences
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/jobs/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    })

    if (response.ok) {
      const data = await response.json()
      return data.jobs.slice(0, 5) // Return top 5 recommendations
    } else {
      const text = await response.text()
      console.log(`Recommendation search failed: ${response.status} ${response.statusText} – ${text}`)
    }
  } catch (error) {
    console.log('Error fetching recommended jobs:', error)
  }

  // Return empty array if no real jobs found
  console.log('No real jobs found for recommendations')
  return []
}
