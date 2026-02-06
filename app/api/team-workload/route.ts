import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../utils/supabase';
import { validateToken, unauthorizedResponse } from '../../utils/auth';

// Get team workload summary - how many items each person has assigned
export async function GET(req: NextRequest) {
    if (!validateToken(req)) return unauthorizedResponse();

    const { data: workload, error } = await supabaseAdmin
        .from('team_workload')
        .select('*');

    if (error) {
        // View might not exist yet - fall back to manual query
        const { data: members } = await supabaseAdmin
            .from('team_members')
            .select('id, name, role')
            .eq('is_active', true);

        if (!members) {
            return NextResponse.json([]);
        }

        const today = new Date().toISOString().split('T')[0];

        // Manually calculate workload from work_items
        const workloadData = await Promise.all(
            members.map(async (member) => {
                const { data: items } = await supabaseAdmin
                    .from('work_items')
                    .select('id, status, kind, due_date')
                    .eq('assigned_to', member.id);

                const allItems = items || [];

                const openItems = allItems.filter(
                    (i) => i.status !== 'done' && i.status !== 'archived'
                );

                return {
                    team_member_id: member.id,
                    name: member.name,
                    role: member.role,
                    open_items: openItems.length,
                    in_progress: allItems.filter((i) => i.status === 'in_progress').length,
                    in_review: allItems.filter((i) => i.status === 'in_review').length,
                    open_bugs: openItems.filter((i) => i.kind === 'bug').length,
                    open_features: openItems.filter((i) => i.kind === 'feature').length,
                    open_tasks: openItems.filter((i) => i.kind === 'task').length,
                    overdue: openItems.filter(
                        (i) => i.due_date && i.due_date < today
                    ).length,
                };
            })
        );

        return NextResponse.json(workloadData);
    }

    return NextResponse.json(workload || []);
}
