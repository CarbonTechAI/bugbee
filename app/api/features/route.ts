import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { data, error } = await supabaseAdmin
        .from('features')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { title, description, priority, requester_name, requester_email } = body;

        const { data: feature, error } = await supabaseAdmin
            .from('features')
            .insert({
                title, description, priority, requester_name, requester_email,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;

        await supabaseAdmin.from('activity_log').insert({
            item_type: 'feature',
            item_id: feature.id,
            action: 'created',
            actor_name: requester_name || 'Anonymous',
            note: 'Feature requested'
        });

        return NextResponse.json(feature);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
