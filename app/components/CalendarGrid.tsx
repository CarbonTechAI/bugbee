'use client';

import { useMemo } from 'react';
import { cn } from '@/app/lib/utils';
import type { WorkItem } from '@/app/types';
import { PRIORITY_CONFIG } from '@/app/types';

interface CalendarGridProps {
  items: WorkItem[];
  year: number;
  month: number; // 0-indexed (JS Date convention)
  onDayClick: (date: string) => void;
  onItemClick: (item: WorkItem) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarGrid({
  items,
  year,
  month,
  onDayClick,
  onItemClick,
}: CalendarGridProps) {
  // Build the 6×7 grid of day cells
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Previous month fill
    const prevMonthDays = new Date(year, month, 0).getDate();

    const result: { year: number; month: number; day: number; currentMonth: boolean }[] = [];

    // Days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      result.push({ year: py, month: pm, day: d, currentMonth: false });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ year, month, day: d, currentMonth: true });
    }

    // Fill remaining to reach 42 (6 rows × 7 cols)
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = month === 11 ? 0 : month + 1;
      const ny = month === 11 ? year + 1 : year;
      result.push({ year: ny, month: nm, day: d, currentMonth: false });
    }

    return result;
  }, [year, month]);

  // Index items by date key
  const itemsByDate = useMemo(() => {
    const map: Record<string, WorkItem[]> = {};
    for (const item of items) {
      if (!item.due_date) continue;
      // due_date is YYYY-MM-DD
      const key = item.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  // Today
  const now = new Date();
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <div className="w-full">
      {/* Day headers */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-xs font-medium uppercase tracking-wide text-slate-400 text-center py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells — 6 rows */}
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const dateKey = toDateKey(cell.year, cell.month, cell.day);
          const isToday = dateKey === todayKey;
          const dayItems = itemsByDate[dateKey] || [];

          return (
            <div
              key={idx}
              onClick={() => onDayClick(dateKey)}
              className="min-h-[100px] p-1.5 border-t border-slate-800 hover:bg-slate-800/30 transition-colors duration-75 cursor-pointer"
            >
              <span
                className={cn(
                  'text-xs inline-flex items-center gap-1',
                  isToday
                    ? 'text-blue-400 font-medium'
                    : cell.currentMonth
                      ? 'text-slate-400'
                      : 'text-slate-600'
                )}
              >
                {isToday && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
                {cell.day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                    }}
                    className="text-[10px] text-slate-300 truncate hover:text-slate-100 cursor-pointer px-1 py-0.5 rounded hover:bg-slate-700/50"
                  >
                    <span
                      className={cn(
                        'inline-block w-1.5 h-1.5 rounded-full mr-1',
                        PRIORITY_CONFIG[item.priority].dot
                      )}
                    />
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-slate-500 px-1">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
