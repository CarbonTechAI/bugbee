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

    const { data: activity, error } = await supabaseAdmin
      .from('activity_log')
      .select('*')
      .eq('item_type', 'work_item')
      .eq('item_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(activity || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
