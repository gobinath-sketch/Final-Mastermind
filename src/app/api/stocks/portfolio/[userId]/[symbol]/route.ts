import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; symbol: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, symbol } = await params

    // Validate that the user can only access their own portfolio
    if (userId !== userPayload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mock portfolio item data
    const mockPortfolioItem = {
      symbol: symbol.toUpperCase(),
      shares: 10,
      averagePrice: 150.00,
      currentPrice: 155.25,
      totalValue: 1552.50,
      gainLoss: 52.50,
      gainLossPercent: 3.50
    }

    return NextResponse.json(mockPortfolioItem)

  } catch (error) {
    console.error('Error fetching portfolio item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; symbol: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, symbol } = await params

    // Validate that the user can only update their own portfolio
    if (userId !== userPayload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { shares, price } = body

    // Mock portfolio update
    return NextResponse.json({
      message: 'Portfolio item updated',
      data: { symbol, shares, price }
    })

  } catch (error) {
    console.error('Error updating portfolio item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; symbol: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, symbol } = await params

    // Validate that the user can only delete their own portfolio items
    if (userId !== userPayload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mock portfolio item deletion
    return NextResponse.json({
      message: 'Portfolio item deleted',
      data: { symbol }
    })

  } catch (error) {
    console.error('Error deleting portfolio item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
