import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../../../utils/auth';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id, attachmentId } = await params;

    try {
        // Get attachment details first
        const { data: attachment, error: fetchError } = await supabaseAdmin
            .from('bug_attachments')
            .select('*')
            .eq('id', attachmentId)
            .eq('bug_id', id)
            .single();

        if (fetchError || !attachment) {
            return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
        }

        // Delete from Storage
        const { error: storageError } = await supabaseAdmin
            .storage
            .from('bugbee-attachments')
            .remove([attachment.file_path]);

        if (storageError) {
            console.error('Storage delete error:', storageError);
            // proceed anyway to clean up DB? No, safer to keep DB sync.
            // But if file is already gone, we should allow DB delete.
            // For now, treat as error.
            return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 });
        }

        // Delete from DB
        const { error: dbError } = await supabaseAdmin
            .from('bug_attachments')
            .delete()
            .eq('id', attachmentId);

        if (dbError) {
            return NextResponse.json({ error: 'Failed to delete attachment record' }, { status: 500 });
        }

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'bug',
            item_id: id,
            action: 'attachment_removed',
            old_value: attachment.file_name,
            actor_name: 'Admin' // or get from headers if passed
        });

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
