import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';
import { validateToken, unauthorizedResponse } from '@/app/utils/auth';
import { Module } from '@/app/types';

const VALID_MODULES: Module[] = [
    'receptionbee', 'recruitbee', 'nurturebee', 'pulsebee',
    'beesuite_web', 'marketing', 'sales', 'operations', 'general',
];

export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!projects) {
        return NextResponse.json([]);
    }

    // Enrich each project with item counts
    for (const project of projects) {
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
    }

    return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { name, description, module, color, created_by } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        if (module && !VALID_MODULES.includes(module)) {
            return NextResponse.json(
                { error: `Invalid module. Must be one of: ${VALID_MODULES.join(', ')}` },
                { status: 400 }
            );
        }

        const { data: project, error } = await supabaseAdmin
            .from('projects')
            .insert({
                name,
                description: description || null,
                module: module || null,
                color: color || null,
                created_by: created_by || null,
            })
            .select()
            .single();

        if (error) throw error;

        // Log to activity_log
        await supabaseAdmin.from('activity_log').insert({
            item_type: 'project',
            item_id: project.id,
            action: 'created',
            new_value: name,
            actor_name: created_by || 'Anonymous',
        });

        return NextResponse.json(project);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
