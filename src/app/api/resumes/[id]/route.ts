import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Resume } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const token = request.cookies.get('auth_token')?.value
    const userPayload = token ? verifyToken(token) : null

    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const deleted = await Resume.findOneAndDelete({
      _id: id,
      user_id: userPayload.userId,
    })

    if (!deleted) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
