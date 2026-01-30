import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabaseAdmin
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data: members, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(members || []);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { name, email, role, avatar_url } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const { data: member, error } = await supabaseAdmin
            .from('team_members')
            .insert({ name, email, role: role || 'developer', avatar_url })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(member);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
