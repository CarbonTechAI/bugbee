import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const { data: todoTypes, error } = await supabaseAdmin
    .from('todo_types')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(todoTypes);
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const body = await request.json();

  const { name, actor_name } = body;

  // Validate required fields
  if (!name || !actor_name) {
    return NextResponse.json(
      { error: 'Name and actor name are required' },
      { status: 400 }
    );
  }

  // Check for duplicate type (case-insensitive)
  const { data: existing } = await supabaseAdmin
    .from('todo_types')
    .select('id, name')
    .ilike('name', name)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'A type with this name already exists', existing },
      { status: 409 }
    );
  }

  // Create the todo type
  const { data: todoType, error: typeError } = await supabaseAdmin
    .from('todo_types')
    .insert({
      name,
      created_by_name: actor_name,
    })
    .select()
    .single();

  if (typeError) {
    return NextResponse.json({ error: typeError.message }, { status: 500 });
  }

  // Create activity log entry
  await supabaseAdmin.from('activity_log').insert({
    item_type: 'todo_type',
    item_id: todoType.id,
    action: 'created',
    actor_name,
    details: {
      name,
    },
  });

  return NextResponse.json(todoType, { status: 201 });
}
