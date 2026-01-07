import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { data: lists, error } = await supabaseAdmin
        .from('todo_lists')
        .select(`
            *,
            items:todo_items(*)
        `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sort items within lists: is_completed asc, sort_order asc, created_at asc
    lists?.forEach(list => {
        if (list.items) {
            list.items.sort((a: any, b: any) => {
                if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
                if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
        }
    });

    return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { name, actor_name } = body;

        if (!name || !actor_name) {
            return NextResponse.json({ error: 'Name and Actor Name are required' }, { status: 400 });
        }

        const { data: list, error } = await supabaseAdmin
            .from('todo_lists')
            .insert({
                name,
                created_by_name: actor_name,
                updated_by_name: actor_name
            })
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_list',
            item_id: list.id,
            action: 'create',
            actor_name: actor_name,
            details: { name },
            note: 'Todo List created'
        });

        return NextResponse.json(list);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
