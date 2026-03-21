import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';
import { verifyToken, signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await request.json();

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userPayload.userId,
            { email },
            { new: true }
        );

        // Issue new token with updated email
        const newToken = signToken({ userId: updatedUser._id.toString(), email: updatedUser.email });

        const cookie = serialize('auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json(
            { success: true, user: { email: updatedUser.email } },
            {
                headers: { 'Set-Cookie': cookie }
            }
        );

    } catch (error) {
        console.error('Error changing email:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
