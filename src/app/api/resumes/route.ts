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
            .sort({ created_at: -1 });

        const formattedResumes = resumes.map(r => ({
            ...r.toObject(),
            id: r._id.toString()
        }));

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
            content: content_markdown, // Mapping markdown to 'content' field which is Mixed/String
            version,
            is_active
        });

        // Note: Model has 'content', frontend sends 'content_markdown'. 
        // We should standardise. Let's save it as content_markdown in DB to avoid confusion? 
        // Or map it. Mongoose schema has `content: { type: Schema.Types.Mixed }`.
        // Let's explicitly save `content_markdown` if that matches frontend expectation.
        // I'll update the Resume model slightly in next step if needed, or just use flexible schema.

        // Let's assume we want to store it as `content_markdown` since frontend expects it back.
        // Update: I'll actually just update the Resume model to have `content_markdown` explicitly or use `content`.
        // The frontend code I saw uses `content_markdown`.

        // Quick fix: Update the document with specific field
        await Resume.updateOne({ _id: newResume._id }, { content_markdown });

        return NextResponse.json({
            ...newResume.toObject(),
            content_markdown,
            id: newResume._id.toString()
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
            id: updated._id.toString()
        });

    } catch (error) {
        console.error('Error updating resume:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
