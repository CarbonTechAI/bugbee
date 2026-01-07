
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../utils/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { listId } = await params;
        const body = await req.json();
        const { actor_name, ...updates } = body;

        if (!actor_name) {
            return NextResponse.json({ error: 'Actor Name is required' }, { status: 400 });
        }

        updates.updated_at = new Date().toISOString();
        updates.updated_by_name = actor_name;

        const { data: list, error } = await supabaseAdmin
            .from('todo_lists')
            .update(updates)
            .eq('id', listId)
            .select()
            .single();

        if (error) throw error;

        // Determine action for log
        let action = 'update';
        if ('archived' in updates) {
            action = updates.archived ? 'archive' : 'unarchive';
        }

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_list',
            item_id: listId,
            action: action,
            actor_name: actor_name,
            details: updates,
            note: `Todo List ${action}d`
        });

        return NextResponse.json(list);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
