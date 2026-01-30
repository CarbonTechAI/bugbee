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

        // Manually calculate workload
        const workloadData = await Promise.all(
            members.map(async (member) => {
                const [bugsResult, featuresResult] = await Promise.all([
                    supabaseAdmin
                        .from('bugs')
                        .select('id, status')
                        .eq('assigned_to', member.id),
                    supabaseAdmin
                        .from('features')
                        .select('id, status')
                        .eq('assigned_to', member.id)
                ]);

                const bugs = bugsResult.data || [];
                const features = featuresResult.data || [];

                return {
                    team_member_id: member.id,
                    name: member.name,
                    role: member.role,
                    open_bugs: bugs.filter(b => !['closed', 'closed_archived', 'fixed'].includes(b.status)).length,
                    open_features: features.filter(f => !['closed', 'shipped'].includes(f.status)).length,
                    bugs_in_progress: bugs.filter(b => b.status === 'in_progress').length,
                    features_in_progress: features.filter(f => f.status === 'in_progress').length
                };
            })
        );

        return NextResponse.json(workloadData);
    }

    return NextResponse.json(workload || []);
}
