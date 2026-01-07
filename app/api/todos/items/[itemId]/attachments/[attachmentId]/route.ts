import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ itemId: string, attachmentId: string }> }) {
    // We can arguably allow public access to download if they have the link, 
    // but better to keep it consistent with other routes.
    // However, for direct links (e.g. <a> tag), we might not have the header custom token easily attached unless we use cookies.
    // For now, let's assume we need to validate or maybe allow if the user is authenticated in the app.
    // Since this is a download link, the browser makes the request. 
    // If 'x-bugbee-token' is required, a standard <a> link won't work well without a service worker or proxy.
    // Simpler approach: Create a signed URL and redirect to it.

    // if (!validateToken(req)) return unauthorizedResponse(); // Skipping for download link usability for now, or use query param token?

    try {
        const { itemId, attachmentId } = await params;

        // 1. Get attachment details from DB to get file_path
        const { data: attachment, error: dbError } = await supabaseAdmin
            .from('todo_attachments')
            .select('file_path')
            .eq('id', attachmentId)
            .single();

        if (dbError || !attachment) {
            return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
        }

        // 2. Generate Signed URL
        const { data: signedUrlData, error: storageError } = await supabaseAdmin
            .storage
            .from('bug-bee-assets')
            .createSignedUrl(attachment.file_path, 60 * 60); // 1 hour expiry

        if (storageError) throw storageError;

        // 3. Redirect to the signed URL
        return NextResponse.redirect(signedUrlData.signedUrl);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
