import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'bug' or 'feature'

    if (!type || (type !== 'bug' && type !== 'feature')) {
        return NextResponse.json({ error: 'Type (bug/feature) required' }, { status: 400 });
    }

    // Fetch Item
    const { data: item, error: itemError } = await supabaseAdmin
        .from(type === 'bug' ? 'bugs' : 'features')
        .select('*')
        .eq('id', id)
        .single();

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 404 });

    // Fetch Activity
    const { data: activity, error: actError } = await supabaseAdmin
        .from('activity_log')
        .select('*')
        .eq('item_id', id)
        .order('created_at', { ascending: false });

    return NextResponse.json({ item, activity: activity || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id } = await params;

    try {
        const body = await req.json();
        const { type, user_name, note, ...updates } = body;

        if (!type) return NextResponse.json({ error: 'Type required' }, { status: 400 });

        // Allowed fields for update to prevent overwriting metadata like id, created_at
        const allowedFields = [
            'title', 'description', 'status', 'severity', 'priority',
            'expected_result', 'actual_result', 'reproduction_steps',
            'environment', 'console_logs', 'requester_name', 'requester_email',
            'reporter_name', 'reporter_email', 'module', 'assigned_to'
        ];

        const filteredUpdates: any = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        if (Object.keys(filteredUpdates).length === 0 && !note) {
            return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
        }

        // Auto-archive logic
        if (filteredUpdates.status === 'closed') {
            filteredUpdates.is_archived = true;
        } else if (filteredUpdates.status) {
            filteredUpdates.is_archived = false;
        }

        const table = type === 'bug' ? 'bugs' : 'features';

        // Get old item state for logging
        const { data: oldItem } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (!oldItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        let newItem = oldItem;

        // Perform update if we have fields to update
        if (Object.keys(filteredUpdates).length > 0) {
            const { data, error } = await supabaseAdmin
                .from(table)
                .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            newItem = data;
        }

        // Logging Logic
        if (oldItem.status !== newItem.status) {
            await supabaseAdmin.from('activity_log').insert({
                item_type: type,
                item_id: id,
                action: 'status_changed',
                old_value: oldItem.status,
                new_value: newItem.status,
                note: note || '',
                actor_name: user_name || 'Anonymous'
            });
        }
        // General Update Log (if no status change but other fields changed)
        else if (Object.keys(filteredUpdates).length > 0) {
            await supabaseAdmin.from('activity_log').insert({
                item_type: type,
                item_id: id,
                action: 'updated',
                note: note || 'Updated details',
                actor_name: user_name || 'Anonymous'
            });
        }
        // Comment Only
        else if (note) {
            await supabaseAdmin.from('activity_log').insert({
                item_type: type,
                item_id: id,
                action: 'comment',
                note: note,
                actor_name: user_name || 'Anonymous'
            });
        }

        return NextResponse.json(newItem);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
