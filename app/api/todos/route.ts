
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const showClosed = searchParams.get('showClosed') === 'true';

    let query = supabaseAdmin
        .from('todo_items')
        .select('*')
        .order('created_at', { ascending: false });

    // If we have a type, filter by it. If not, maybe we just show all?
    // User requested: "filter by those different types"
    if (type) {
        query = query.eq('type', type);
    }

    if (!showClosed) {
        query = query.eq('is_completed', false);
    }

    const { data: items, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { text, type, description, actor_name } = body;

        if (!text || !actor_name) {
            return NextResponse.json({ error: 'Text and Actor Name are required' }, { status: 400 });
        }

        const { data: item, error } = await supabaseAdmin
            .from('todo_items')
            .insert({
                text,
                type: type || 'Task',
                description,
                created_by_name: actor_name,
                updated_by_name: actor_name,
                is_completed: false
            })
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_item',
            item_id: item.id,
            action: 'create',
            actor_name: actor_name,
            details: { text, type },
            note: 'Todo Item created'
        });

        return NextResponse.json(item);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
