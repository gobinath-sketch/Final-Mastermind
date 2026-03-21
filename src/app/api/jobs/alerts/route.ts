import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

type JobAlert = {
  id: string
  query?: string
  location?: string
  salary_min?: number
  salary_max?: number
  job_type?: string
  experience_level?: string
  frequency: string
  created_at: string
  is_active: boolean
}

type Preferences = {
  job_alerts?: JobAlert[]
  [key: string]: unknown
}

const getJobAlerts = (preferences: Preferences | null | undefined): JobAlert[] => {
  const maybeAlerts = preferences?.job_alerts
  return Array.isArray(maybeAlerts) ? maybeAlerts.map((alert) => ({ ...alert })) : []
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Check authentication
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      query,
      location,
      salary_min,
      salary_max,
      job_type,
      experience_level,
      frequency = 'daily'
    } = body

    // Fetch user profile
    const user = await User.findById(userPayload.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentPreferences = (user.preferences as Preferences | null) ?? {}
    const jobAlerts = getJobAlerts(currentPreferences)

    const newAlert = {
      id: Date.now().toString(),
      query,
      location,
      salary_min,
      salary_max,
      job_type,
      experience_level,
      frequency,
      created_at: new Date().toISOString(),
      is_active: true
    }

    jobAlerts.push(newAlert)

    // Update user preferences
    user.preferences = {
      ...user.preferences,
      job_alerts: jobAlerts
    }
    await user.save()

    return NextResponse.json({
      message: 'Job alert created successfully',
      alert: newAlert
    })

  } catch (error) {
    console.error('Error creating job alert:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
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

    // Get user's job alerts
    const user = await User.findById(userPayload.userId).select('preferences')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const preferences = (user.preferences as Preferences | null) ?? {}
    const jobAlerts = getJobAlerts(preferences)

    return NextResponse.json({
      alerts: jobAlerts
    })

  } catch (error) {
    console.error('Error fetching job alerts:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    // Check authentication
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    // Get current preferences
    const user = await User.findById(userPayload.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentPreferences = (user.preferences as Preferences | null) ?? {}
    const jobAlerts = getJobAlerts(currentPreferences)

    // Remove the alert
    const updatedAlerts = jobAlerts.filter((alert) => alert.id !== alertId)

    user.preferences = {
      ...user.preferences,
      job_alerts: updatedAlerts
    }
    await user.save()

    return NextResponse.json({
      message: 'Job alert deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting job alert:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}
