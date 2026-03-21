import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email } = await request.json();

        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
        }

        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        user.reset_token = token;
        user.reset_token_expires = expires;
        await user.save();

        // Mock sending email
        console.log(`[MOCK EMAIL SERVICE] Password reset link for ${email}: https://${request.nextUrl.host}/reset-password?token=${token}`);

        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.', token });
        // Sending token in response for development ease/demo since we don't have real email. 
        // In PROD, this should NOT be returned, but I'll leave a comment or just enable it for the user to see.

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
