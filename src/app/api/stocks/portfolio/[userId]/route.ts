import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    // Validate that the user can only access their own portfolio
    if (userId !== userPayload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mock portfolio data
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
