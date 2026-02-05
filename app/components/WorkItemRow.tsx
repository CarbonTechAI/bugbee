'use client';

import { cn } from '@/app/lib/utils';
import type { WorkItem, Module } from '@/app/types';
import PriorityDot from './PriorityDot';
import KindBadge from './KindBadge';
import ModuleBadge from './ModuleBadge';

interface WorkItemRowProps {
  item: WorkItem;
  onClick: () => void;
  accentColor?: 'red' | 'amber';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round(
    (itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
}

export default function WorkItemRow({ item, onClick, accentColor }: WorkItemRowProps) {
  const overdue = isOverdue(item.due_date);
  const dueToday = isDueToday(item.due_date);
  const isDone = item.status === 'done';

  // Determine border accent — explicit prop takes priority, then computed
  const borderAccent = accentColor === 'red'
    ? 'border-l-2 border-red-500'
    : accentColor === 'amber'
      ? 'border-l-2 border-amber-500'
      : overdue
        ? 'border-l-2 border-red-500'
        : dueToday
          ? 'border-l-2 border-amber-500'
          : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center px-3 py-2 rounded-md gap-3',
        'transition-colors duration-75 cursor-pointer',
        'hover:bg-slate-800/50',
        borderAccent,
        isDone && 'opacity-50'
      )}
    >
      {/* Priority Dot */}
      <PriorityDot priority={item.priority} />

      {/* Title — fills available space */}
      <span className="flex-1 text-sm text-slate-100 truncate">
        {item.title}
      </span>

      {/* Metadata — right aligned, consistent order */}
      <div className="flex items-center gap-2 shrink-0">
        <KindBadge kind={item.kind} />
        {item.module && <ModuleBadge module={item.module as Module} />}
        {item.due_date && (
          <span
            className={cn(
              'text-xs',
              overdue ? 'text-red-400' : 'text-slate-500'
            )}
          >
            {formatDate(item.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}
