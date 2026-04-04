import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const protocol = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https') ? 'https' : 'http');
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== 'http://localhost:3000' 
        ? process.env.NEXTAUTH_URL 
        : `${protocol}://${host}`;
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
        return NextResponse.json({ error: 'GitHub Client ID not configured' }, { status: 500 });
    }

    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    const scope = encodeURIComponent('user:email');
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    return NextResponse.redirect(githubAuthUrl);
}
