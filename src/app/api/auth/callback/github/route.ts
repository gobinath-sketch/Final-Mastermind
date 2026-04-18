import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models'
import { signToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const REDIRECT_URI = `${BASE_URL}/api/auth/callback/github`

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      return NextResponse.redirect(`${BASE_URL}/login?error=github_denied`)
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    })

    if (!tokenRes.ok) {
      console.error('GitHub token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${BASE_URL}/login?error=github_token_failed`)
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error('No access token from GitHub:', tokenData)
      return NextResponse.redirect(`${BASE_URL}/login?error=github_token_failed`)
    }

    // 2. Get user info from GitHub
    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      }),
    ])

    if (!userRes.ok) {
      return NextResponse.redirect(`${BASE_URL}/login?error=github_userinfo_failed`)
    }

    const githubUser = await userRes.json()
    let email = githubUser.email

    // GitHub can hide email — fetch from emails endpoint
    if (!email && emailsRes.ok) {
      const emails = await emailsRes.json()
      const primary = emails.find((e: { primary: boolean; verified: boolean; email: string }) =>
        e.primary && e.verified
      )
      email = primary?.email || emails[0]?.email
    }

    if (!email) {
      return NextResponse.redirect(`${BASE_URL}/login?error=no_email`)
    }

    const { name, avatar_url: avatarUrl, id: githubId, login } = githubUser

    // 3. Find or create user in MongoDB
    await dbConnect()

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // New user — create account
      user = await User.create({
        email: email.toLowerCase(),
        full_name: name || login || email.split('@')[0],
        avatar_url: avatarUrl || null,
        password_hash: null, // OAuth users have no password
        oauth_provider: 'github',
        oauth_id: String(githubId),
        skills: [],
        preferences: {},
      })
    } else {
      // Existing user — update avatar if not set
      if (!user.avatar_url && avatarUrl) {
        user.avatar_url = avatarUrl
        await user.save()
      }
    }

    // 4. Issue our own JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
    })

    // 5. Set cookie and redirect to dashboard
    const response = NextResponse.redirect(`${BASE_URL}/dashboard`)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response

  } catch (err) {
    console.error('GitHub OAuth callback error:', err)
    return NextResponse.redirect(`${BASE_URL}/login?error=github_oauth_failed`)
  }
}
