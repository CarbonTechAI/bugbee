import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { data: bugs, error } = await supabaseAdmin
        .from('bugs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch latest comments
    const { data: comments } = await supabaseAdmin
        .from('activity_log')
        .select('item_id, created_at')
        .eq('item_type', 'bug')
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
        .eq('item_type', 'bug')
        .order('created_at', { ascending: false });

    const activityMap = new Map();
    if (allActivity) {
        for (const a of allActivity) {
            if (!activityMap.has(a.item_id)) {
                activityMap.set(a.item_id, a.created_at);
            }
        }
    }

    const enrichedBugs = bugs.map(bug => ({
        ...bug,
        last_comment_at: commentMap.get(bug.id) || null,
        last_activity_at: activityMap.get(bug.id) || bug.created_at
    }));

    return NextResponse.json(enrichedBugs);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { title, severity, actual_result, expected_result, reproduction_steps, environment, console_logs, reporter_name, reporter_email } = body;

        const { data: bug, error } = await supabaseAdmin
            .from('bugs')
            .insert({
                title, severity, actual_result, expected_result, reproduction_steps,
                environment, console_logs, reporter_name, reporter_email,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'bug',
            item_id: bug.id,
            action: 'created',
            actor_name: reporter_name || 'Anonymous',
            note: 'Bug reported'
        });

        return NextResponse.json(bug);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
