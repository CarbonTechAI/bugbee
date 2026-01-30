import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';
    const module = searchParams.get('module');
    const assignedTo = searchParams.get('assigned_to');

    let query = supabaseAdmin
        .from('features')
        .select('*');

    // Use status as the source of truth for inbox vs archives
    if (!archived) {
        // Inbox: show all features EXCEPT those with closed status
        query = query.neq('status', 'closed');
    } else {
        // Archives: only show features with closed status
        query = query.eq('status', 'closed');
    }

    // Filter by module if specified
    if (module) {
        query = query.eq('module', module);
    }

    // Filter by assignee if specified
    if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
    }

    const { data: features, error } = await query.order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!features || features.length === 0) return NextResponse.json([]);

    // Get feature IDs for filtering activity
    const featureIds = features.map(f => f.id);

    // Run activity queries in parallel and filter by feature IDs
    const [commentsResult, activityResult] = await Promise.all([
        supabaseAdmin
            .from('activity_log')
            .select('item_id, created_at')
            .eq('item_type', 'feature')
            .eq('action', 'comment')
            .in('item_id', featureIds)
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from('activity_log')
            .select('item_id, created_at, actor_name')
            .eq('item_type', 'feature')
            .in('item_id', featureIds)
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

    const enrichedFeatures = features.map(f => {
        const activity = activityMap.get(f.id);
        return {
            ...f,
            last_comment_at: commentMap.get(f.id) || null,
            last_activity_at: activity ? activity.date : f.created_at,
            last_activity_by: activity ? activity.user : (f.requester_name || 'Anonymous')
        };
    });

    return NextResponse.json(enrichedFeatures);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { title, description, priority, requester_name, requester_email, module, assigned_to } = body;

        const { data: feature, error } = await supabaseAdmin
            .from('features')
            .insert({
                title, description, priority, requester_name, requester_email,
                module, assigned_to,
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
