import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models'
import { signToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const REDIRECT_URI = `${BASE_URL}/api/auth/callback/google`

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_denied`)
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${BASE_URL}/login?error=google_token_failed`)
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 2. Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_userinfo_failed`)
    }

    const googleUser = await userInfoRes.json()
    const { email, name, picture, id: googleId } = googleUser

    if (!email) {
      return NextResponse.redirect(`${BASE_URL}/login?error=no_email`)
    }

    // 3. Find or create user in MongoDB
    await dbConnect()

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // New user — create account
      user = await User.create({
        email: email.toLowerCase(),
        full_name: name || email.split('@')[0],
        avatar_url: picture || null,
        password_hash: null, // OAuth users have no password
        oauth_provider: 'google',
        oauth_id: googleId,
        skills: [],
        preferences: {},
      })
    } else {
      // Existing user — update avatar if not set
      if (!user.avatar_url && picture) {
        user.avatar_url = picture
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
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(`${BASE_URL}/login?error=google_oauth_failed`)
  }
}
