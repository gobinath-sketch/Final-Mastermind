import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Resume } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resumes = await Resume.find({ user_id: userPayload.userId })
            .sort({ createdAt: -1 });

        const formattedResumes = resumes.map((r) => {
            const o = r.toObject() as Record<string, unknown>
            const rawContent = o.content
            const fromContent =
                typeof rawContent === 'string'
                    ? rawContent
                    : rawContent &&
                        typeof rawContent === 'object' &&
                        'markdown' in rawContent &&
                        typeof (rawContent as { markdown?: unknown }).markdown === 'string'
                      ? (rawContent as { markdown: string }).markdown
                      : ''
            const markdown =
                typeof o.content_markdown === 'string' && o.content_markdown.trim().length > 0
                    ? o.content_markdown
                    : fromContent
            const createdSource = r.createdAt ?? o.created_at
            const created_at =
                createdSource instanceof Date
                    ? createdSource.toISOString()
                    : typeof createdSource === 'string'
                      ? createdSource
                      : new Date().toISOString()

            return {
                id: r._id.toString(),
                title: r.title,
                content_markdown: markdown,
                version: typeof o.version === 'number' ? o.version : 1,
                is_active: typeof o.is_active === 'boolean' ? o.is_active : true,
                created_at,
            }
        });

        return NextResponse.json(formattedResumes);

    } catch (error) {
        console.error('Error fetching resumes:', error);
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

        const { title, content_markdown, version, is_active } = await request.json();

        // Check if updating or creating based on if an ID is provided? 
        // Logic in frontend seemed to use UPDATE if existingId. 
        // Here we'll stick to POST = Create. Updates should go to PUT or separate route? 
        // Actually frontend calls .update on 'resumes' table directly in Supabase.
        // We can handle both here or be strict. Let's start with CREATE.

        const newResume = await Resume.create({
            user_id: userPayload.userId,
            title,
            content: content_markdown,
            content_markdown,
            version: version ?? 1,
            is_active: is_active ?? true,
        });

        return NextResponse.json({
            ...newResume.toObject(),
            content_markdown: newResume.content_markdown ?? content_markdown,
            id: newResume._id.toString(),
            created_at: newResume.createdAt?.toISOString() ?? new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error creating resume:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const token = request.cookies.get('auth_token')?.value;
        const userPayload = token ? verifyToken(token) : null;

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, title, content_markdown, version, is_active } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const updated = await Resume.findOneAndUpdate(
            { _id: id, user_id: userPayload.userId },
            {
                title,
                content_markdown,
                content: content_markdown,
                version,
                is_active
            },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...updated.toObject(),
            id: updated._id.toString(),
            content_markdown: updated.content_markdown ?? content_markdown,
            created_at: updated.createdAt?.toISOString(),
        });

    } catch (error) {
        console.error('Error updating resume:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
