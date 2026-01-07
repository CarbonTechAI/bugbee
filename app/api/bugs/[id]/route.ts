
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { id } = await params;

        const { data: bug, error } = await supabaseAdmin
            .from('bugs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!bug) return NextResponse.json({ error: 'Bug not found' }, { status: 404 });

        return NextResponse.json(bug);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await req.json();
        const { actor_name, ...updates } = body;

        if (!actor_name) {
            return NextResponse.json({ error: 'Actor Name is required' }, { status: 400 });
        }

        // Logic: If closing, also archive. If opening, unarchive.
        // We only touch 'archived' if 'status' is being changed.
        if (updates.status) {
            if (updates.status === 'closed') {
                updates.archived = true;
            } else {
                updates.archived = false;
            }
        }

        updates.updated_at = new Date().toISOString();
        updates.updated_by_name = actor_name;

        const { data: bug, error } = await supabaseAdmin
            .from('bugs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'bug',
            item_id: id,
            action: 'update',
            actor_name: actor_name,
            details: updates,
            note: updates.status ? `Bug marked as ${updates.status}` : 'Bug updated'
        });

        return NextResponse.json(bug);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
