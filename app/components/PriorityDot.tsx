'use client';

import { cn } from '@/app/lib/utils';
import type { WorkItemPriority } from '@/app/types';

const colorMap: Record<WorkItemPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-slate-400',
  none: 'bg-slate-600',
};

export default function PriorityDot({ priority }: { priority: WorkItemPriority }) {
  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full shrink-0',
        colorMap[priority]
      )}
      title={priority}
      aria-label={`Priority: ${priority}`}
    />
  );
}
