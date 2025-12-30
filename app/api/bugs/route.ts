import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { searchParams } = new URL(req.url); // Can use for filters later if needed

    const { data, error } = await supabaseAdmin
        .from('bugs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
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
