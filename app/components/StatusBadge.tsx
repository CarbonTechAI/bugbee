'use client';

import { cn } from '@/app/lib/utils';
import { STATUS_CONFIG } from '@/app/types';
import type { WorkItemStatus } from '@/app/types';

// ---- New Design System component (StatusPill) ----

const pillStyles: Record<WorkItemStatus, string> = {
  inbox: 'text-slate-400 bg-slate-400/10',
  todo: 'text-blue-400 bg-blue-500/10',
  in_progress: 'text-yellow-400 bg-yellow-500/10',
  in_review: 'text-purple-400 bg-purple-500/10',
  done: 'text-green-400 bg-green-500/10',
  archived: 'text-slate-500 bg-slate-500/10',
};

const dotColors: Record<WorkItemStatus, string> = {
  inbox: 'bg-slate-400',
  todo: 'bg-blue-400',
  in_progress: 'bg-yellow-400',
  in_review: 'bg-purple-400',
  done: 'bg-green-400',
  archived: 'bg-slate-500',
};

export function StatusPill({ status }: { status: WorkItemStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'text-[11px] font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5',
        pillStyles[status]
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[status])} />
      {config.label}
    </span>
  );
}

// ---- Legacy default export for backward compatibility ----
// Existing pages (archives, kanban, item detail) use the old API.
// This wrapper keeps them working until they are migrated.

interface LegacyStatusBadgeProps {
  status?: string;
  severity?: string;
  muted?: boolean;
}

export default function StatusBadge({ status, severity, muted }: LegacyStatusBadgeProps) {
  // If a valid WorkItemStatus is passed, use the new StatusPill
  if (status && status in STATUS_CONFIG) {
    return <StatusPill status={status as WorkItemStatus} />;
  }

  // Legacy severity badge
  if (severity) {
    const severityColors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-500 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-500 border-green-500/30',
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
      normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      none: 'bg-slate-700/50 text-slate-500 border-slate-700',
    };

    if (muted) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold border uppercase whitespace-nowrap bg-slate-700/30 text-slate-600 border-slate-700/50">
          {severity}
        </span>
      );
    }

    return (
      <span
        className={cn(
          'px-2 py-0.5 rounded text-xs font-semibold border uppercase whitespace-nowrap',
          severityColors[severity.toLowerCase()] || 'bg-slate-700 text-slate-300 border-slate-600'
        )}
      >
        {severity}
      </span>
    );
  }

  // Legacy status badge (for statuses not in STATUS_CONFIG)
  if (status) {
    const statusColors: Record<string, string> = {
      open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      fixed: 'bg-green-500/20 text-green-400 border-green-500/30',
      shipped: 'bg-green-500/20 text-green-400 border-green-500/30',
      needs_verification: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      reopened: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      closed: 'bg-slate-700/50 text-slate-500 border-slate-700',
      closed_archived: 'bg-slate-700/50 text-slate-500 border-slate-700',
    };

    return (
      <span
        className={cn(
          'px-2 py-0.5 rounded text-xs font-semibold border capitalize whitespace-nowrap',
          statusColors[status.toLowerCase()] || 'bg-slate-700 text-slate-300 border-slate-600'
        )}
      >
        {status.replace(/_/g, ' ')}
      </span>
    );
  }

  return null;
}
