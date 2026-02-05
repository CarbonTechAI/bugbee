'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

interface SectionGroupProps {
  label: string;
  count: number;
  children: ReactNode[];
  defaultOpen?: boolean;
  maxVisible?: number;
  accentColor?: 'red' | 'amber';
}

export default function SectionGroup({
  label,
  count,
  children,
  defaultOpen = true,
  maxVisible = 7,
  accentColor,
}: SectionGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);

  if (count === 0) return null;

  const visibleChildren = showAll ? children : children.slice(0, maxVisible);
  const hiddenCount = children.length - maxVisible;

  return (
    <div>
      {/* Section Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span
          className={cn(
            'text-xs font-medium uppercase tracking-wide',
            accentColor === 'red'
              ? 'text-red-400'
              : accentColor === 'amber'
                ? 'text-amber-400'
                : 'text-slate-400'
          )}
        >
          {label}
        </span>
        <span className="text-xs text-slate-500">· {count}</span>
        <svg
          className={cn(
            'w-3 h-3 text-slate-500 transition-transform duration-150',
            open && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Items */}
      {open && (
        <div className="mt-3 space-y-0.5">
          {visibleChildren}

          {/* Show more toggle */}
          {hiddenCount > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2 transition-colors duration-75"
            >
              Show {hiddenCount} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
