import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Watchlist } from '@/lib/models';
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

    // Get user's watchlist
    const watchlist = await Watchlist.find({ user_id: userPayload.userId }).sort({ added_at: -1 });

    return NextResponse.json(watchlist || []);

  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    const userPayload = token ? verifyToken(token) : null;

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, symbol } = body;

    // Validate that the user can only add to their own watchlist
    if (userId !== userPayload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const symbolUpper = symbol.toUpperCase();

    // Check for duplicate
    const existingItem = await Watchlist.findOne({ user_id: userId, symbol: symbolUpper });
    if (existingItem) {
      return NextResponse.json({ message: 'Stock already in watchlist' });
    }

    // Add to watchlist
    const newItem = await Watchlist.create({
      user_id: userId,
      symbol: symbolUpper,
      meta: {
        name: getCompanyName(symbolUpper),
        added_at: new Date().toISOString()
      }
    });

    return NextResponse.json({ message: 'Stock added to watchlist', data: newItem });

  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getCompanyName(symbol: string): string {
  const companies: { [key: string]: string } = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'AMD': 'Advanced Micro Devices Inc.',
    'INTC': 'Intel Corporation'
  }
  return companies[symbol.toUpperCase()] || `${symbol} Corporation`
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    const userPayload = token ? verifyToken(token) : null;

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Remove from watchlist
    await Watchlist.deleteOne({ user_id: userPayload.userId, symbol: symbol.toUpperCase() });

    return NextResponse.json({ message: 'Stock removed from watchlist' });

  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
