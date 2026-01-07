
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { data: types, error } = await supabaseAdmin
        .from('todo_types')
        .select('*')
        .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { name, actor_name } = body;

        if (!name || !actor_name) {
            return NextResponse.json({ error: 'Name and Actor Name are required' }, { status: 400 });
        }

        const { data: type, error } = await supabaseAdmin
            .from('todo_types')
            .insert({
                name,
                created_by_name: actor_name
            })
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_type',
            item_id: type.id,
            action: 'create',
            actor_name: actor_name,
            details: { name },
            note: 'Todo Type created'
        });

        return NextResponse.json(type);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
