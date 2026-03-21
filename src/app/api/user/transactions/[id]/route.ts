import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Transaction } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // params is now a promise in Next.js 15
) {
    try {
        await dbConnect();

        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const transactionId = resolvedParams.id;

        const deleted = await Transaction.findOneAndDelete({
            _id: transactionId,
            user_id: userPayload.userId
        });

        if (!deleted) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
