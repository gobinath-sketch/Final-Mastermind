import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Job, Resume, Watchlist, Transaction, User } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Check authentication
        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = userPayload.userId;

        const [savedJobs, resumes, watchlist, transactions] = await Promise.all([
            Job.countDocuments({ user_id: userId }),
            Resume.countDocuments({ user_id: userId }),
            Watchlist.countDocuments({ user_id: userId }),
            Transaction.countDocuments({ user_id: userId })
        ]);

        return NextResponse.json({
            savedJobs,
            resumes,
            watchlist,
            transactions
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
