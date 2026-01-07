import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { itemId } = await params;
        const { data: item, error } = await supabaseAdmin
            .from('todo_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;
        return NextResponse.json(item);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { itemId } = await params;
        const body = await req.json();
        const { actor_name, ...updates } = body;

        if (!actor_name) {
            return NextResponse.json({ error: 'Actor Name is required' }, { status: 400 });
        }

        // Handle specific logic for completion toggles
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

        const { data: item, error } = await supabaseAdmin
            .from('todo_items')
            .update(updates)
            .eq('id', itemId)
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
            .eq('id', item.list_id);

        // Determine action for log
        let action = 'update';
        if ('is_completed' in updates) {
            action = updates.is_completed ? 'complete' : 'reopen';
        }

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_item',
            item_id: itemId,
            action: action,
            actor_name: actor_name,
            details: updates,
            note: `Todo Item ${action}d`
        });

        return NextResponse.json(item);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { itemId } = await params;
        const { searchParams } = new URL(req.url);
        const actor_name = searchParams.get('actor_name'); // Passed as query param for delete

        if (!actor_name) {
            return NextResponse.json({ error: 'Actor Name is required' }, { status: 400 });
        }

        // Get item first to know list_id
        const { data: item, error: fetchError } = await supabaseAdmin
            .from('todo_items')
            .select('list_id, text')
            .eq('id', itemId)
            .single();

        if (fetchError) throw fetchError;

        const { error } = await supabaseAdmin
            .from('todo_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        // Update list updated_at
        await supabaseAdmin
            .from('todo_lists')
            .update({
                updated_at: new Date().toISOString(),
                updated_by_name: actor_name
            })
            .eq('id', item.list_id);

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'todo_item',
            item_id: itemId,
            action: 'delete',
            actor_name: actor_name,
            details: { text: item.text },
            note: 'Todo Item deleted'
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
