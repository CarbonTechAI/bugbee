'use client';

import { useState, useEffect } from 'react';
import { Bug, Lightbulb, Loader2 } from 'lucide-react';

interface WorkloadItem {
    team_member_id: string;
    name: string;
    role: string;
    open_bugs: number;
    open_features: number;
    bugs_in_progress: number;
    features_in_progress: number;
}

export function TeamWorkload() {
    const [workload, setWorkload] = useState<WorkloadItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkload();
    }, []);

    const fetchWorkload = async () => {
        try {
            const res = await fetch('/api/team-workload', {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkload(data);
            }
        } catch (error) {
            console.error('Failed to fetch team workload', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    if (workload.length === 0) {
        return (
            <div className="text-center text-slate-400 py-8">
                No team members found. Run the migration to seed the team.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workload.map((member) => (
                <div 
                    key={member.team_member_id}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-200">{member.name}</h3>
                        <span className="text-xs text-slate-500 capitalize">{member.role}</span>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Bug size={14} className="text-red-400" />
                                <span>Bugs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-300">{member.open_bugs}</span>
                                {member.bugs_in_progress > 0 && (
                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                                        {member.bugs_in_progress} active
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Lightbulb size={14} className="text-green-400" />
                                <span>Features</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-300">{member.open_features}</span>
                                {member.features_in_progress > 0 && (
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                        {member.features_in_progress} active
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="text-xs text-slate-500">
                            Total: {member.open_bugs + member.open_features} items
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
