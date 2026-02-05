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

    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        author:team_members!comments_author_id_fkey(id, name, email, role, avatar_url)
      `)
      .eq('work_item_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(comments || []);
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
    const body = await req.json();
    const { body: commentBody, actor_id } = body;

    // Validation
    if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    if (!actor_id) {
      return NextResponse.json({ error: 'actor_id is required' }, { status: 400 });
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

    // Look up actor name
    const { data: actor } = await supabaseAdmin
      .from('team_members')
      .select('name')
      .eq('id', actor_id)
      .single();

    const actorName = actor?.name || 'Unknown';

    // Insert comment
    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        work_item_id: id,
        author_id: actor_id,
        body: commentBody.trim(),
      })
      .select(`
        *,
        author:team_members!comments_author_id_fkey(id, name, email, role, avatar_url)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    // Activity log
    await supabaseAdmin.from('activity_log').insert({
      item_type: 'work_item',
      item_id: id,
      action: 'comment',
      new_value: commentBody.trim(),
      actor_name: actorName,
      details: { comment_id: comment.id },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
