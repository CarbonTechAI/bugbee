import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../../utils/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { listId } = await params;
        const body = await req.json();
        const { text, priority, notes, actor_name } = body;

        if (!text || !actor_name) {
            return NextResponse.json({ error: 'Text and Actor Name are required' }, { status: 400 });
        }

        const { data: item, error } = await supabaseAdmin
            .from('todo_items')
            .insert({
                list_id: listId,
                text,
                priority,
                notes,
                created_by_name: actor_name,
                updated_by_name: actor_name,
                is_completed: false
            })
            .select()
            .single();

        if (error) throw error;

        // Update list updated_at
        await supabaseAdmin
            .from('todo_lists')
            .update({
                updated_at: new Date().toISOString(),
                updated_by_name: actor_name
            })
            .eq('id', listId);

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_item',
            item_id: item.id,
            action: 'create',
            actor_name: actor_name,
            details: { text, priority, list_id: listId },
            note: 'Todo Item added'
        });

        return NextResponse.json(item);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
