import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Check authentication
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's portfolio (mock data for now)
    const mockPortfolio = [
      {
        symbol: 'AAPL',
        shares: 10,
        averagePrice: 150.00,
        currentPrice: 155.25,
        totalValue: 1552.50,
        gainLoss: 52.50,
        gainLossPercent: 3.50
      },
      {
        symbol: 'GOOGL',
        shares: 5,
        averagePrice: 2800.00,
        currentPrice: 2850.75,
        totalValue: 14253.75,
        gainLoss: 253.75,
        gainLossPercent: 1.81
      }
    ]

    return NextResponse.json(mockPortfolio)

  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Check authentication
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { symbol, shares, price } = body

    if (!symbol || !shares || !price) {
      return NextResponse.json({ error: 'Symbol, shares, and price are required' }, { status: 400 })
    }

    // Mock portfolio addition
    return NextResponse.json({
      message: 'Stock added to portfolio',
      data: { symbol, shares, price }
    })

  } catch (error) {
    console.error('Error adding to portfolio:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
