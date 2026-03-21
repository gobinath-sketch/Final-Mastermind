import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const cookie = serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        path: '/',
    });

    return NextResponse.json(
        { success: true },
        {
            status: 200,
            headers: { 'Set-Cookie': cookie },
        }
    );
}
