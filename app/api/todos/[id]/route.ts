
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../utils/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await req.json();
        const { actor_name, ...updates } = body;

        if (!actor_name) {
            return NextResponse.json({ error: 'Actor Name is required' }, { status: 400 });
        }

        // Handle completion status changes
        if ('is_completed' in updates) {
            if (updates.is_completed) {
                updates.completed_at = new Date().toISOString();
                updates.completed_by_name = actor_name;
            } else {
                updates.completed_at = null;
                updates.completed_by_name = null;
            }
        }

        updates.updated_at = new Date().toISOString();
        updates.updated_by_name = actor_name;

        const { data: todo, error } = await supabaseAdmin
            .from('todos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Determine action for log
        let action = 'update';
        if ('is_completed' in updates) {
            action = updates.is_completed ? 'complete' : 'reopen';
        } else if ('archived' in updates) {
            action = updates.archived ? 'archive' : 'unarchive';
        }

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo',
            item_id: id,
            action: action,
            actor_name: actor_name,
            details: updates,
            note: `Todo ${action}d`
        });

        return NextResponse.json(todo);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const actor_name = searchParams.get('actor_name');

        if (!actor_name) {
            return NextResponse.json({ error: 'Actor Name is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo',
            item_id: id,
            action: 'delete',
            actor_name: actor_name,
            note: 'Todo deleted'
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
