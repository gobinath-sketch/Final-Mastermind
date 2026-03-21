import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Check authentication
        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { password } = await request.json();

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(
            userPayload.userId,
            { password_hash },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Error updating password:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
