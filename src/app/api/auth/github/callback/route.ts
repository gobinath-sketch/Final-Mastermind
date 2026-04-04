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

        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        const redirectUri = `${baseUrl}/api/auth/github/callback`;

        // Exchange code for token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
            console.error('GitHub token error', tokenData);
            return NextResponse.redirect(`${baseUrl}/login?error=OAuthFailed`);
        }

        // Fetch user info
        const userRes = await fetch('https://api.github.com/user', {
            headers: { 
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        const userData = await userRes.json();
        
        let email = userData.email;
        if (!email) {
            // Fetch emails if public email is not set
            const emailRes = await fetch('https://api.github.com/user/emails', {
                headers: { 
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });
            const emailsData = await emailRes.json();
            const primaryEmailObj = emailsData.find((e: any) => e.primary) || emailsData[0];
            if (primaryEmailObj) {
                email = primaryEmailObj.email;
            }
        }
        
        if (!email) {
            return NextResponse.redirect(`${baseUrl}/login?error=NoEmailProvided`);
        }

        await dbConnect();

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const password_hash = await bcrypt.hash(randomPassword, 10);
            
            user = await User.create({
                email,
                full_name: userData.name || userData.login,
                avatar_url: userData.avatar_url,
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
        console.error('GitHub Callback Error:', error);
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/login?error=InternalError`);
    }
}
