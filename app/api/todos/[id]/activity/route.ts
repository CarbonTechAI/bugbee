import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../../utils/auth';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) return unauthorizedResponse();

  const params = await props.params;
  const { id } = params;

  const { data: activity, error } = await supabaseAdmin
    .from('activity_log')
    .select('*')
    .eq('item_type', 'todo')
    .eq('item_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(activity);
}
