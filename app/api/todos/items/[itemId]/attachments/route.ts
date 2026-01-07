import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { itemId } = await params;
        const { data, error } = await supabaseAdmin
            .from('todo_attachments')
            .select('*')
            .eq('todo_id', itemId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { itemId } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const actor_name = formData.get('actor_name') as string;

        if (!file || !actor_name) {
            return NextResponse.json({ error: 'File and Actor Name are required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${itemId}/${Date.now()}-${file.name}`;
        const contentType = file.type || 'application/octet-stream';

        // Upload to Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('bug-bee-assets')
            .upload(fileName, buffer, {
                contentType: contentType,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Insert into DB
        const { data: attachment, error: dbError } = await supabaseAdmin
            .from('todo_attachments')
            .insert({
                todo_id: itemId,
                file_path: uploadData.path,
                file_name: file.name,
                content_type: contentType,
                size_bytes: file.size,
                // created_by_name: actor_name // Column not in schema yet
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_item',
            item_id: itemId,
            action: 'upload',
            actor_name: actor_name,
            details: { file_name: file.name },
            note: 'Attachment uploaded'
        });

        return NextResponse.json(attachment);

    } catch (err: any) {
        console.error('Upload Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
