import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../utils/auth';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) return unauthorizedResponse();

  const params = await props.params;
  const { id } = params;

  const { data: todo, error } = await supabaseAdmin
    .from('todos')
    .select(`
      *,
      type:todo_types(id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json(todo);
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) return unauthorizedResponse();

  const params = await props.params;
  const body = await request.json();
  const { id } = params;

  const {
    is_completed,
    title,
    notes,
    priority,
    type_id,
    actor_name,
    archived
  } = body;

  // Validate actor name
  if (!actor_name) {
    return NextResponse.json(
      { error: 'Actor name is required' },
      { status: 400 }
    );
  }

  // Get current todo state
  const { data: currentTodo, error: fetchError } = await supabaseAdmin
    .from('todos')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentTodo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  // Build update object
  const updates: Record<string, any> = {
    updated_by_name: actor_name,
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updates.title = title;
  if (notes !== undefined) updates.notes = notes;
  if (priority !== undefined) updates.priority = priority;
  if (type_id !== undefined) updates.type_id = type_id;
  if (archived !== undefined) updates.archived = archived;

  // Handle completion status
  if (is_completed !== undefined) {
    updates.is_completed = is_completed;
    if (is_completed && !currentTodo.is_completed) {
      // Completing the todo
      updates.completed_at = new Date().toISOString();
      updates.completed_by_name = actor_name;
    } else if (!is_completed && currentTodo.is_completed) {
      // Reopening the todo
      updates.completed_at = null;
      updates.completed_by_name = null;
    }
  }

  // Update the todo
  const { data: todo, error: updateError } = await supabaseAdmin
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create activity log entry
  let action = 'updated';
  let old_value = null;
  let new_value = null;

  if (is_completed !== undefined && is_completed !== currentTodo.is_completed) {
    action = 'status_changed';
    old_value = currentTodo.is_completed ? 'completed' : 'open';
    new_value = is_completed ? 'completed' : 'open';
  } else if (archived !== undefined && archived !== currentTodo.archived) {
    action = archived ? 'archived' : 'unarchived';
  }

  await supabaseAdmin.from('activity_log').insert({
    item_type: 'todo',
    item_id: id,
    action,
    old_value,
    new_value,
    actor_name,
    details: updates,
  });

  return NextResponse.json(todo);
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) return unauthorizedResponse();

  const params = await props.params;
  const body = await request.json();
  const { id } = params;
  const { actor_name } = body;

  // Validate actor name
  if (!actor_name) {
    return NextResponse.json(
      { error: 'Actor name is required' },
      { status: 400 }
    );
  }

  // Get todo before deletion for activity log
  const { data: todo, error: fetchError } = await supabaseAdmin
    .from('todos')
    .select('title')
    .eq('id', id)
    .single();

  if (fetchError || !todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  // Create activity log entry before deletion
  await supabaseAdmin.from('activity_log').insert({
    item_type: 'todo',
    item_id: id,
    action: 'deleted',
    actor_name,
    details: {
      title: todo.title
    },
  });

  // Delete the todo
  const { error: deleteError } = await supabaseAdmin
    .from('todos')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
