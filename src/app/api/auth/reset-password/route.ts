import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Missing token or password' }, { status: 400 });
        }

        const user = await User.findOne({
            reset_token: token,
            reset_token_expires: { $gt: Date.now() }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        const password_hash = await bcrypt.hash(password, 10);

        user.password_hash = password_hash;
        user.reset_token = undefined;
        user.reset_token_expires = undefined;
        await user.save();

        return NextResponse.json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
