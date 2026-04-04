import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const protocol = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https') ? 'https' : 'http');
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== 'http://localhost:3000' 
        ? process.env.NEXTAUTH_URL 
        : `${protocol}://${host}`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
        return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
    }

    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const scope = encodeURIComponent('email profile');
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    return NextResponse.redirect(googleAuthUrl);
}
