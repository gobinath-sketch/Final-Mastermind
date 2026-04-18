import { NextResponse } from 'next/server'

export async function GET() {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback/github`

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'user:email read:user',
  })

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  )
}
