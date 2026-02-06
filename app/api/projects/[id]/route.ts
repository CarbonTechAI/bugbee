import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';
import { validateToken, unauthorizedResponse } from '@/app/utils/auth';
import { Module, ProjectStatus } from '@/app/types';

const VALID_MODULES: Module[] = [
    'receptionbee', 'recruitbee', 'nurturebee', 'pulsebee',
    'beesuite_web', 'marketing', 'sales', 'operations', 'general',
];

const VALID_STATUSES: ProjectStatus[] = ['active', 'completed', 'archived'];

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id } = await params;

    const { data: project, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Enrich with item counts
    const { count: itemCount } = await supabaseAdmin
        .from('work_items')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .not('status', 'eq', 'archived');

    const { count: completedCount } = await supabaseAdmin
        .from('work_items')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .eq('status', 'done');

    project.item_count = itemCount || 0;
    project.completed_count = completedCount || 0;

    return NextResponse.json(project);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id } = await params;

    try {
        const body = await req.json();
        const { name, description, module, status, color, actor_name } = body;

        // Validate module if provided
        if (module !== undefined && module !== null && !VALID_MODULES.includes(module)) {
            return NextResponse.json(
                { error: `Invalid module. Must be one of: ${VALID_MODULES.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate status if provided
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        // Build update object with only provided fields
        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (module !== undefined) updates.module = module;
        if (status !== undefined) updates.status = status;
        if (color !== undefined) updates.color = color;
        updates.updated_at = new Date().toISOString();

        if (Object.keys(updates).length <= 1) {
            // Only updated_at, no real changes
            return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
        }

        // Check project exists
        const { data: existing } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('id', id)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const { data: project, error } = await supabaseAdmin
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log to activity_log
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'project',
            item_id: id,
            action: 'updated',
            note: `Updated ${Object.keys(updates).filter(k => k !== 'updated_at').join(', ')}`,
            actor_name: actor_name || 'Anonymous',
        });

        return NextResponse.json(project);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateToken(req)) return unauthorizedResponse();
    const { id } = await params;

    try {
        // Check project exists
        const { data: existing } = await supabaseAdmin
            .from('projects')
            .select('id, name')
            .eq('id', id)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Hard delete — FK ON DELETE SET NULL handles work_items.project_id
        const { error } = await supabaseAdmin
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log to activity_log
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'project',
            item_id: id,
            action: 'deleted',
            old_value: existing.name,
            actor_name: 'Anonymous',
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
