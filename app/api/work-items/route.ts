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
const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'due_date', 'priority', 'title', 'status', 'kind'];

export async function GET(req: NextRequest) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const kind = searchParams.get('kind');
    const module = searchParams.get('module');
    const assignedTo = searchParams.get('assigned_to');
    const projectId = searchParams.get('project_id');
    const priority = searchParams.get('priority');
    const dueBefore = searchParams.get('due_before');
    const dueAfter = searchParams.get('due_after');
    const overdue = searchParams.get('overdue');
    const search = searchParams.get('search');
    const includeArchived = searchParams.get('include_archived') === 'true';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabaseAdmin
      .from('work_items')
      .select(`
        *,
        assignee:team_members!work_items_assigned_to_fkey(id, name, email, role, avatar_url),
        creator:team_members!work_items_created_by_fkey(id, name, email, role, avatar_url),
        project:projects!work_items_project_id_fkey(id, name, color)
      `);

    // Filter: exclude archived unless explicitly requested
    if (!includeArchived) {
      query = query.neq('status', 'archived');
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (kind) {
      query = query.eq('kind', kind);
    }

    if (module) {
      query = query.eq('module', module);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (dueBefore) {
      query = query.lte('due_date', dueBefore);
    }

    if (dueAfter) {
      query = query.gte('due_date', dueAfter);
    }

    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('due_date', today).not('status', 'in', '("done","archived")');
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Sort
    const sortField = VALID_SORT_FIELDS.includes(sort) ? sort : 'created_at';
    const ascending = order === 'asc';
    query = query.order(sortField, { ascending });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const body = await req.json();
    const {
      title,
      description,
      kind = 'task',
      status = 'todo',
      priority = 'none',
      due_date,
      project_id,
      module,
      assigned_to,
      checklist,
      actor_id,
    } = body;

    // Validation: actor_id required
    if (!actor_id) {
      return NextResponse.json({ error: 'actor_id is required' }, { status: 400 });
    }

    // Validation: title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (title.length > 500) {
      return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
    }

    // Validation: kind
    if (!VALID_KINDS.includes(kind as WorkItemKind)) {
      return NextResponse.json(
        { error: `Invalid value for kind. Must be one of: ${VALID_KINDS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: status
    if (!VALID_STATUSES.includes(status as WorkItemStatus)) {
      return NextResponse.json(
        { error: `Invalid value for status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: priority
    if (!VALID_PRIORITIES.includes(priority as WorkItemPriority)) {
      return NextResponse.json(
        { error: `Invalid value for priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: module
    if (module !== undefined && module !== null && !VALID_MODULES.includes(module as Module)) {
      return NextResponse.json(
        { error: `Invalid value for module. Must be one of: ${VALID_MODULES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: assigned_to — verify exists in team_members
    if (assigned_to) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('id', assigned_to)
        .single();

      if (memberError || !member) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
      }
    }

    // Validation: project_id — verify exists
    if (project_id) {
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    // Look up actor name for activity log
    const { data: actor } = await supabaseAdmin
      .from('team_members')
      .select('name')
      .eq('id', actor_id)
      .single();

    const actorName = actor?.name || 'Unknown';

    // Build insert object
    const insertData: Record<string, unknown> = {
      title: title.trim(),
      kind,
      status,
      priority,
      created_by: actor_id,
    };

    if (description !== undefined) insertData.description = description;
    if (due_date !== undefined) insertData.due_date = due_date;
    if (project_id !== undefined) insertData.project_id = project_id;
    if (module !== undefined) insertData.module = module;
    if (assigned_to !== undefined) insertData.assigned_to = assigned_to;
    if (checklist !== undefined) insertData.checklist = checklist;

    const { data: workItem, error } = await supabaseAdmin
      .from('work_items')
      .insert(insertData)
      .select(`
        *,
        assignee:team_members!work_items_assigned_to_fkey(id, name, email, role, avatar_url),
        creator:team_members!work_items_created_by_fkey(id, name, email, role, avatar_url),
        project:projects!work_items_project_id_fkey(id, name, color)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }

    // Activity log
    await supabaseAdmin.from('activity_log').insert({
      item_type: 'work_item',
      item_id: workItem.id,
      action: 'created',
      new_value: JSON.stringify(workItem),
      actor_name: actorName,
      details: { changed_fields: Object.keys(insertData) },
    });

    return NextResponse.json(workItem, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
