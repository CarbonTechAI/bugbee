import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { id } = await params;
    const { data: member, error } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(member);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await req.json();
        const { name, email, role, avatar_url, is_active } = body;

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (role !== undefined) updates.role = role;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;
        if (is_active !== undefined) updates.is_active = is_active;

        const { data: member, error } = await supabaseAdmin
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(member);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { id } = await params;
    // Soft delete - mark as inactive
    const { data: member, error } = await supabaseAdmin
        .from('team_members')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member });
}
