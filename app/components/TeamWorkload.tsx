'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';

interface WorkloadItem {
  team_member_id: string;
  name: string;
  role: string;
  open_items: number;
  in_progress: number;
  in_review: number;
  overdue: number;
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
        headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkload(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg p-4 bg-slate-800 border border-slate-700 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-700" />
              <div>
                <div className="h-4 bg-slate-700 rounded w-24 mb-1" />
                <div className="h-3 bg-slate-700 rounded w-16" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-10 bg-slate-700 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (workload.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-slate-100 mb-1">No team members found.</p>
        <p className="text-xs text-slate-500">Add team members to see workload data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workload.map((member) => (
        <div
          key={member.team_member_id}
          className="rounded-lg p-4 bg-slate-800 border border-slate-700"
        >
          {/* Name + role */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
              {member.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-100">{member.name}</div>
              <div className="text-xs text-slate-500 capitalize">{member.role}</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-slate-100">{member.open_items}</div>
              <div className="text-[10px] text-slate-500">Open</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{member.in_progress}</div>
              <div className="text-[10px] text-slate-500">Active</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">{member.in_review}</div>
              <div className="text-[10px] text-slate-500">Review</div>
            </div>
            <div>
              <div className={cn('text-lg font-bold', member.overdue > 0 ? 'text-red-400' : 'text-slate-500')}>
                {member.overdue}
              </div>
              <div className="text-[10px] text-slate-500">Overdue</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
