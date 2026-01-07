import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const archived = searchParams.get('archived') === 'true';
  const q = searchParams.get('q') || '';
  const typeId = searchParams.get('typeId') || '';
  const status = searchParams.get('status') || 'all'; // open|completed|all
  const showCompleted = searchParams.get('showCompleted') === 'true';
  const sort = searchParams.get('sort') || 'newest'; // newest|oldest|updated
  const limit = parseInt(searchParams.get('limit') || '200');
  const offset = parseInt(searchParams.get('offset') || '0');
  const cursor = searchParams.get('cursor') || '';

  // Build query
  let query = supabaseAdmin
    .from('todos')
    .select(`
      *,
      type:todo_types(id, name)
    `)
    .eq('archived', archived);

  // Filter by completion status
  if (status === 'open') {
    query = query.eq('is_completed', false);
  } else if (status === 'completed') {
    query = query.eq('is_completed', true);
  }
  // If showCompleted is false and status is 'all', hide completed
  if (!showCompleted && status === 'all') {
    query = query.eq('is_completed', false);
  }

  // Filter by type
  if (typeId) {
    query = query.eq('type_id', typeId);
  }

  // Apply sorting
  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'updated') {
    query = query.order('updated_at', { ascending: false });
  } else {
    // Default: newest
    query = query.order('created_at', { ascending: false });
  }

  // Apply cursor-based pagination if cursor is provided
  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  // Apply limit and offset
  query = query.range(offset, offset + limit - 1);

  const { data: todos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Apply search filter on enriched data (searches title and notes)
  let filteredTodos = todos;
  if (q) {
    const searchLower = q.toLowerCase();
    filteredTodos = todos.filter(todo =>
      todo.title.toLowerCase().includes(searchLower) ||
      (todo.notes && todo.notes.toLowerCase().includes(searchLower))
    );
  }

  // Fetch all activity for last activity timestamp
  const todoIds = filteredTodos.map(t => t.id);
  if (todoIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: allActivity } = await supabaseAdmin
    .from('activity_log')
    .select('item_id, created_at, actor_name')
    .eq('item_type', 'todo')
    .in('item_id', todoIds)
    .order('created_at', { ascending: false });

  const activityMap = new Map();
  if (allActivity) {
    for (const a of allActivity) {
      if (!activityMap.has(a.item_id)) {
        activityMap.set(a.item_id, {
          date: a.created_at,
          user: a.actor_name || 'Anonymous'
        });
      }
    }
  }

  const enrichedTodos = filteredTodos.map(todo => {
    const activity = activityMap.get(todo.id);
    return {
      ...todo,
      last_activity_at: activity ? activity.date : todo.created_at,
      last_activity_by: activity ? activity.user : (todo.created_by_name || 'Anonymous')
    };
  });

  return NextResponse.json(enrichedTodos);
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const body = await request.json();

  const { title, notes, priority, type_id, actor_name } = body;

  // Validate required fields
  if (!title || !actor_name) {
    return NextResponse.json(
      { error: 'Title and actor name are required' },
      { status: 400 }
    );
  }

  // Create the todo
  const { data: todo, error: todoError } = await supabaseAdmin
    .from('todos')
    .insert({
      title,
      notes,
      priority,
      type_id: type_id || null,
      created_by_name: actor_name,
      updated_by_name: actor_name,
    })
    .select()
    .single();

  if (todoError) {
    return NextResponse.json({ error: todoError.message }, { status: 500 });
  }

  // Create activity log entry
  await supabaseAdmin.from('activity_log').insert({
    item_type: 'todo',
    item_id: todo.id,
    action: 'created',
    actor_name,
    details: {
      title,
      type_id,
      priority,
    },
  });

  return NextResponse.json(todo, { status: 201 });
}
