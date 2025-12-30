import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../../utils/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id } = await params;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const reporterName = formData.get('reporter_name') as string || 'Anonymous';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed.' }, { status: 400 });
        }

        // Validate file size (10MB limit)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
        }

        // Validate bug exists
        const { data: bug, error: bugError } = await supabaseAdmin
            .from('bugs')
            .select('id')
            .eq('id', id)
            .single();

        if (bugError || !bug) {
            return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop() || 'png';
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
        const randomString = Math.random().toString(36).substring(2, 8);
        const storagePath = `bugs/${id}/${timestamp}_${randomString}_${safeFileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('bugbee-attachments')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }

        // Save metadata to DB
        const { data: attachment, error: dbError } = await supabaseAdmin
            .from('bug_attachments')
            .insert({
                bug_id: id,
                file_path: storagePath,
                file_name: file.name,
                content_type: file.type,
                size_bytes: file.size
            })
            .select()
            .single();

        if (dbError) {
            // cleanup file if db insert fails
            await supabaseAdmin.storage.from('bugbee-attachments').remove([storagePath]);
            return NextResponse.json({ error: 'Failed to save attachment metadata' }, { status: 500 });
        }

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'bug',
            item_id: id,
            action: 'attachment_added',
            new_value: file.name,
            actor_name: reporterName
        });

        // Generate a signed URL for immediate display
        const { data: signedUrlData } = await supabaseAdmin
            .storage
            .from('bugbee-attachments')
            .createSignedUrl(storagePath, 3600); // 1 hour

        return NextResponse.json({
            ...attachment,
            signedUrl: signedUrlData?.signedUrl
        });

    } catch (err: any) {
        console.error('Server error upload:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id } = await params;

    try {
        const { data: attachments, error } = await supabaseAdmin
            .from('bug_attachments')
            .select('*')
            .eq('bug_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Generate signed URLs for all
        const attachmentsWithUrls = await Promise.all(attachments.map(async (att) => {
            const { data } = await supabaseAdmin
                .storage
                .from('bugbee-attachments')
                .createSignedUrl(att.file_path, 3600); // 1 hour expiration

            return {
                ...att,
                signedUrl: data?.signedUrl
            };
        }));

        return NextResponse.json(attachmentsWithUrls);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
