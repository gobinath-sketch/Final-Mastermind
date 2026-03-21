import { NextResponse } from 'next/server'

export async function GET() {
  const mongoUri = process.env.MONGODB_URI
  const jwtSecret = process.env.JWT_SECRET

  return NextResponse.json({
    hasMongoUri: Boolean(mongoUri && mongoUri.length > 0),
    hasJwtSecret: Boolean(jwtSecret && jwtSecret.length > 0),
    environment: process.env.NODE_ENV
  })
}
