import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';

    let query = supabaseAdmin
        .from('bugs')
        .select('*');

    // Use status as the source of truth for inbox vs archives
    if (!archived) {
        // Inbox: show all bugs EXCEPT those with closed_archived status
        query = query.neq('status', 'closed_archived');
    } else {
        // Archives: only show bugs with closed_archived status
        query = query.eq('status', 'closed_archived');
    }

    const { data: bugs, error } = await query.order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!bugs || bugs.length === 0) return NextResponse.json([]);

    // Get bug IDs for filtering activity
    const bugIds = bugs.map(b => b.id);

    // Run activity queries in parallel and filter by bug IDs
    const [commentsResult, activityResult] = await Promise.all([
        supabaseAdmin
            .from('activity_log')
            .select('item_id, created_at')
            .eq('item_type', 'bug')
            .eq('action', 'comment')
            .in('item_id', bugIds)
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from('activity_log')
            .select('item_id, created_at, actor_name')
            .eq('item_type', 'bug')
            .in('item_id', bugIds)
            .order('created_at', { ascending: false })
    ]);

    const commentMap = new Map();
    if (commentsResult.data) {
        for (const c of commentsResult.data) {
            if (!commentMap.has(c.item_id)) {
                commentMap.set(c.item_id, c.created_at);
            }
        }
    }

    const activityMap = new Map();
    if (activityResult.data) {
        for (const a of activityResult.data) {
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
