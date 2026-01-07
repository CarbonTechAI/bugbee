
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const showCompleted = searchParams.get('show_completed') === 'true';
    const typeId = searchParams.get('type_id');
    const search = searchParams.get('search');

    let query = supabaseAdmin
        .from('todos')
        .select(`
            *,
            type:todo_types(id, name)
        `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

    if (!showCompleted) {
        query = query.eq('is_completed', false);
    }

    if (typeId && typeId !== 'all') {
        query = query.eq('type_id', typeId);
    }

    if (search) {
        query = query.ilike('title', `%${search}%`);
    }

    const { data: todos, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(todos);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { title, type_id, priority, notes, actor_name } = body;

        if (!title || !actor_name) {
            return NextResponse.json({ error: 'Title and Actor Name are required' }, { status: 400 });
        }

        const { data: todo, error } = await supabaseAdmin
            .from('todos')
            .insert({
                title,
                type_id,
                priority,
                notes,
                created_by_name: actor_name,
                updated_by_name: actor_name
            })
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo',
            item_id: todo.id,
            action: 'create',
            actor_name: actor_name,
            details: { title, type_id, priority },
            note: 'Todo created'
        });

        return NextResponse.json(todo);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
