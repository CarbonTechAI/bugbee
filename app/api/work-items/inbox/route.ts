import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';
import { validateToken, unauthorizedResponse } from '@/app/utils/auth';

const WORK_ITEM_SELECT = `
  *,
  assignee:team_members!work_items_assigned_to_fkey(id, name, email, role, avatar_url),
  creator:team_members!work_items_created_by_fkey(id, name, email, role, avatar_url),
  project:projects!work_items_project_id_fkey(id, name, color)
`;

export async function GET(req: NextRequest) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { data, error } = await supabaseAdmin
      .from('work_items')
      .select(WORK_ITEM_SELECT)
      .eq('status', 'inbox')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
