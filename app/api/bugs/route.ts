import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';

    let query = supabaseAdmin
        .from('bugs')
        .select('*')
        .eq('archived', archived);

    // Safety net: filter by status in addition to archived field
    // This ensures items appear in correct view even if archived field wasn't properly set
    if (!archived) {
        // Inbox: exclude closed_archived status
        query = query.neq('status', 'closed_archived');
    } else {
        // Archives: only show closed_archived status (exclude reopened, open, etc.)
        query = query.eq('status', 'closed_archived');
    }

    const { data: bugs, error } = await query.order('created_at', { ascending: false });

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
        .select('item_id, created_at, actor_name')
        .eq('item_type', 'bug')
        .order('created_at', { ascending: false });

    const activityMap = new Map();
    if (allActivity) {
        for (const a of allActivity) {
            if (!activityMap.has(a.item_id)) {
                activityMap.set(a.item_id, {
                    date: a.created_at,
                    user: a.actor_name || 'Anonymous'
                });
            }
        }
    }

    const enrichedBugs = bugs.map(bug => {
        const activity = activityMap.get(bug.id);
        return {
            ...bug,
            last_comment_at: commentMap.get(bug.id) || null,
            last_activity_at: activity ? activity.date : bug.created_at,
            last_activity_by: activity ? activity.user : (bug.reporter_name || 'Anonymous')
        };
    });

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
