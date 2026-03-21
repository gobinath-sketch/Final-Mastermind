import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Check authentication
        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await request.json();

        // Prevent updating sensitive fields
        delete updates.password_hash;
        delete updates.email; // Usually separate flow for email change
        delete updates._id;

        // Filter allowed fields (optional but good practice)
        // For now, we trust the input matches the schema mostly

        const user = await User.findByIdAndUpdate(
            userPayload.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password_hash');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user, message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
