import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { data: features, error } = await supabaseAdmin
        .from('features')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: comments } = await supabaseAdmin
        .from('activity_log')
        .select('item_id, created_at')
        .eq('item_type', 'feature')
        .eq('action', 'comment')
        .order('created_at', { ascending: false });

    const commentMap = new Map();
    if (comments) {
        for (const c of comments) {
            if (!commentMap.has(c.item_id)) {
                commentMap.set(c.item_id, c.created_at);
            }
        }
    }

    // Fetch all activity for last activity timestamp
    const { data: allActivity } = await supabaseAdmin
        .from('activity_log')
        .select('item_id, created_at')
        .eq('item_type', 'feature')
        .order('created_at', { ascending: false });

    const activityMap = new Map();
    if (allActivity) {
        for (const a of allActivity) {
            if (!activityMap.has(a.item_id)) {
                activityMap.set(a.item_id, a.created_at);
            }
        }
    }

    const enrichedFeatures = features.map(f => ({
        ...f,
        last_comment_at: commentMap.get(f.id) || null,
        last_activity_at: activityMap.get(f.id) || f.created_at
    }));

    return NextResponse.json(enrichedFeatures);
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
