import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';
import { signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        if (!code) {
            return NextResponse.redirect(`${baseUrl}/login?error=NoCodeProvided`);
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${baseUrl}/api/auth/google/callback`;

        // Exchange code for token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId!,
                client_secret: clientSecret!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
            console.error('Google token error', tokenData);
            return NextResponse.redirect(`${baseUrl}/login?error=OAuthFailed`);
        }

        // Fetch user info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userData = await userRes.json();
        
        if (!userData.email) {
            return NextResponse.redirect(`${baseUrl}/login?error=NoEmailProvided`);
        }

        await dbConnect();

        // Find or create user
        let user = await User.findOne({ email: userData.email });
        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const password_hash = await bcrypt.hash(randomPassword, 10);
            
            user = await User.create({
                email: userData.email,
                full_name: userData.name || userData.given_name,
                avatar_url: userData.picture,
                password_hash
            });
        }

        // Sign token and set cookie
        const token = signToken({ userId: user._id.toString(), email: user.email });
        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.redirect(`${baseUrl}/dashboard`, {
            headers: { 'Set-Cookie': cookie },
        });

    } catch (error) {
        console.error('Google Callback Error:', error);
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/login?error=InternalError`);
    }
}
