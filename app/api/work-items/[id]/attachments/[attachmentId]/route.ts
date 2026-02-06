import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';
import { validateToken, unauthorizedResponse } from '@/app/utils/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { id, attachmentId } = await params;

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabaseAdmin
      .from('work_item_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('work_item_id', id)
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
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 });
    }

    // Delete from DB
    const { error: dbError } = await supabaseAdmin
      .from('work_item_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      return NextResponse.json({ error: 'Failed to delete attachment record' }, { status: 500 });
    }

    // Activity log
    const actorName = req.headers.get('x-bugbee-user') || 'Unknown';
    await supabaseAdmin.from('activity_log').insert({
      item_type: 'work_item',
      item_id: id,
      action: 'attachment_removed',
      old_value: attachment.file_name,
      actor_name: actorName,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
