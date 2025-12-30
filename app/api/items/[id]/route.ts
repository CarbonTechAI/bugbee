import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    if (!validateToken(req)) return unauthorizedResponse();
    const id = params.id;
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    if (!validateToken(req)) return unauthorizedResponse();
    const id = params.id;

    try {
        const body = await req.json();
        const { type, status, user_name, note } = body; // status update

        if (!type) return NextResponse.json({ error: 'Type required' }, { status: 400 });

        // Get old status
        const { data: oldItem } = await supabaseAdmin
            .from(type === 'bug' ? 'bugs' : 'features')
            .select('status')
            .eq('id', id)
            .single();

        if (!oldItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        // Update
        const { data: newItem, error } = await supabaseAdmin
            .from(type === 'bug' ? 'bugs' : 'features')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log
        if (oldItem.status !== status || note) {
            await supabaseAdmin.from('activity_log').insert({
                item_type: type,
                item_id: id,
                action: oldItem.status !== status ? 'status_changed' : 'comment',
                old_value: oldItem.status,
                new_value: status,
                note: note || '',
                actor_name: user_name || 'Anonymous'
            });
        }

        return NextResponse.json(newItem);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
