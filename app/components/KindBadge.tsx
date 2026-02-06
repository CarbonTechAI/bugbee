'use client';

import { cn } from '@/app/lib/utils';
import type { WorkItemKind } from '@/app/types';

const styles: Record<WorkItemKind, string> = {
  bug: 'text-red-400 bg-red-500/10',
  feature: 'text-blue-400 bg-blue-500/10',
  task: 'text-green-400 bg-green-500/10',
  idea: 'text-yellow-400 bg-yellow-500/10',
};

export default function KindBadge({ kind }: { kind: WorkItemKind }) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium px-2 py-0.5 rounded-full',
        styles[kind]
      )}
    >
      {kind}
    </span>
  );
}
