import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';
import { validateToken, unauthorizedResponse } from '@/app/utils/auth';
import {
  WorkItemKind,
  WorkItemStatus,
  WorkItemPriority,
  Module,
} from '@/app/types';

const VALID_KINDS: WorkItemKind[] = ['bug', 'feature', 'task', 'idea'];
const VALID_STATUSES: WorkItemStatus[] = ['inbox', 'todo', 'in_progress', 'in_review', 'done', 'archived'];
const VALID_PRIORITIES: WorkItemPriority[] = ['urgent', 'high', 'normal', 'low', 'none'];
const VALID_MODULES: Module[] = [
  'receptionbee', 'recruitbee', 'nurturebee', 'pulsebee',
  'beesuite_web', 'marketing', 'sales', 'operations', 'general',
];

const WORK_ITEM_SELECT = `
  *,
  assignee:team_members!work_items_assigned_to_fkey(id, name, email, role, avatar_url),
  creator:team_members!work_items_created_by_fkey(id, name, email, role, avatar_url),
  project:projects!work_items_project_id_fkey(id, name, color)
`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { id } = await params;

    const { data: workItem, error } = await supabaseAdmin
      .from('work_items')
      .select(WORK_ITEM_SELECT)
      .eq('id', id)
      .single();

    if (error || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    return NextResponse.json(workItem);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();
    const { actor_id, actor_name: providedActorName, ...updates } = body;

    // Fetch current item for comparison and auto-status rules
    const { data: currentItem, error: fetchError } = await supabaseAdmin
      .from('work_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    // Validation: title
    if (updates.title !== undefined) {
      if (!updates.title || typeof updates.title !== 'string' || updates.title.trim().length === 0) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      if (updates.title.length > 500) {
        return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
      }
      updates.title = updates.title.trim();
    }

    // Validation: kind
    if (updates.kind !== undefined && !VALID_KINDS.includes(updates.kind as WorkItemKind)) {
      return NextResponse.json(
        { error: `Invalid value for kind. Must be one of: ${VALID_KINDS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: status
    if (updates.status !== undefined && !VALID_STATUSES.includes(updates.status as WorkItemStatus)) {
      return NextResponse.json(
        { error: `Invalid value for status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: priority
    if (updates.priority !== undefined && !VALID_PRIORITIES.includes(updates.priority as WorkItemPriority)) {
      return NextResponse.json(
        { error: `Invalid value for priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: module
    if (updates.module !== undefined && updates.module !== null && !VALID_MODULES.includes(updates.module as Module)) {
      return NextResponse.json(
        { error: `Invalid value for module. Must be one of: ${VALID_MODULES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: assigned_to — verify exists
    if (updates.assigned_to !== undefined && updates.assigned_to !== null) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('id', updates.assigned_to)
        .single();

      if (memberError || !member) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
      }
    }

    // --- Auto-status rules ---

    // If assigned_to changes from null to a value AND current status='inbox': auto-set status='todo'
    if (
      updates.assigned_to !== undefined &&
      updates.assigned_to !== null &&
      currentItem.assigned_to === null &&
      (updates.status === undefined ? currentItem.status : updates.status) === 'inbox'
    ) {
      updates.status = 'todo';
    }

    // If status changes to 'done': set completed_at
    const newStatus = updates.status !== undefined ? updates.status : currentItem.status;
    if (updates.status === 'done' && currentItem.status !== 'done') {
      updates.completed_at = new Date().toISOString();
    }

    // If status changes FROM 'done' to anything else: clear completed_at
    if (currentItem.status === 'done' && updates.status !== undefined && updates.status !== 'done') {
      updates.completed_at = null;
    }

    // If status changes to 'archived': set archived_at
    if (updates.status === 'archived' && currentItem.status !== 'archived') {
      updates.archived_at = new Date().toISOString();
    }

    // Set updated_at
    updates.updated_at = new Date().toISOString();

    // Determine actor name
    let actorName = providedActorName || 'Unknown';
    if (actor_id && !providedActorName) {
      const { data: actor } = await supabaseAdmin
        .from('team_members')
        .select('name')
        .eq('id', actor_id)
        .single();
      actorName = actor?.name || 'Unknown';
    }

    // Build old/new values for activity log
    const changedFields: string[] = [];
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const key of Object.keys(updates)) {
      if (key === 'updated_at') continue;
      if (currentItem[key as keyof typeof currentItem] !== updates[key]) {
        changedFields.push(key);
        oldValues[key] = currentItem[key as keyof typeof currentItem];
        newValues[key] = updates[key];
      }
    }

    const { data: workItem, error } = await supabaseAdmin
      .from('work_items')
      .update(updates)
      .eq('id', id)
      .select(WORK_ITEM_SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    // Activity log
    if (changedFields.length > 0) {
      await supabaseAdmin.from('activity_log').insert({
        item_type: 'work_item',
        item_id: id,
        action: 'updated',
        old_value: JSON.stringify(oldValues),
        new_value: JSON.stringify(newValues),
        actor_name: actorName,
        details: { changed_fields: changedFields },
      });
    }

    return NextResponse.json(workItem);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { id } = await params;

    // Verify item exists
    const { data: currentItem, error: fetchError } = await supabaseAdmin
      .from('work_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    // Get actor name from header or body
    const actorName = req.headers.get('x-bugbee-user') || 'Unknown';

    const { error } = await supabaseAdmin
      .from('work_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    // Activity log
    await supabaseAdmin.from('activity_log').insert({
      item_type: 'work_item',
      item_id: id,
      action: 'deleted',
      old_value: JSON.stringify(currentItem),
      actor_name: actorName,
      details: { changed_fields: ['deleted'] },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
