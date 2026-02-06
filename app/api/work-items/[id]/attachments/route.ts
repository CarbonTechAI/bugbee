import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';
import { validateToken, unauthorizedResponse } from '@/app/utils/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { id } = await params;

    // Verify work item exists
    const { data: workItem, error: itemError } = await supabaseAdmin
      .from('work_items')
      .select('id')
      .eq('id', id)
      .single();

    if (itemError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const { data: attachments, error } = await supabaseAdmin
      .from('work_item_attachments')
      .select('*')
      .eq('work_item_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    // Generate signed URLs for all attachments
    const attachmentsWithUrls = await Promise.all(
      (attachments || []).map(async (att) => {
        const { data } = await supabaseAdmin
          .storage
          .from('bugbee-attachments')
          .createSignedUrl(att.file_path, 3600);

        return {
          ...att,
          signedUrl: data?.signedUrl || null,
        };
      })
    );

    return NextResponse.json(attachmentsWithUrls);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { id } = await params;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const actorName = (formData.get('actor_name') as string) || 'Anonymous';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, GIF, WebP, PDF, TXT.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    // Verify work item exists
    const { data: workItem, error: itemError } = await supabaseAdmin
      .from('work_items')
      .select('id')
      .eq('id', id)
      .single();

    if (itemError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    // Upload to Supabase Storage
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    const randomString = Math.random().toString(36).substring(2, 8);
    const storagePath = `work-items/${id}/${timestamp}_${randomString}_${safeFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('bugbee-attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // Save metadata to DB
    const { data: attachment, error: dbError } = await supabaseAdmin
      .from('work_item_attachments')
      .insert({
        work_item_id: id,
        file_path: storagePath,
        file_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup uploaded file if DB insert fails
      await supabaseAdmin.storage.from('bugbee-attachments').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save attachment metadata' }, { status: 500 });
    }

    // Activity log
    await supabaseAdmin.from('activity_log').insert({
      item_type: 'work_item',
      item_id: id,
      action: 'attachment_added',
      new_value: file.name,
      actor_name: actorName,
    });

    // Generate signed URL for immediate use
    const { data: signedUrlData } = await supabaseAdmin
      .storage
      .from('bugbee-attachments')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json(
      {
        ...attachment,
        signedUrl: signedUrlData?.signedUrl || null,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
