import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Transaction } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const transactions = await Transaction.find({ user_id: userPayload.userId })
            .sort({ created_at: -1 });

        // Transform _id to id for frontend compatibility
        const formattedTransactions = transactions.map(t => ({
            ...t.toObject(),
            id: t._id.toString()
        }));

        return NextResponse.json(formattedTransactions);

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, currency, category, merchant, metadata } = body;

        const newTransaction = await Transaction.create({
            user_id: userPayload.userId,
            amount,
            currency,
            category,
            merchant,
            metadata
        });

        return NextResponse.json({
            ...newTransaction.toObject(),
            id: newTransaction._id.toString()
        });

    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
