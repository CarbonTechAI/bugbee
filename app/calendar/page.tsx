'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/app/lib/utils';
import CalendarGrid from '@/app/components/CalendarGrid';
import WorkItemDetail from '@/app/components/WorkItemDetail';
import WorkItemRow from '@/app/components/WorkItemRow';
import type { WorkItem } from '@/app/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getToken(): string {
  return typeof window !== 'undefined'
    ? localStorage.getItem('bugbee_token') || ''
    : '';
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Day side panel
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // WorkItemDetail slide-over
  const [detailItem, setDetailItem] = useState<WorkItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch items for the visible month
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const res = await fetch(
        `/api/work-items?due_after=${startOfMonth}&due_before=${endOfMonth}&limit=500`,
        { headers: { 'x-bugbee-token': token } }
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Month navigation
  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  // Items for the selected day
  const dayItems = selectedDate
    ? items.filter((item) => item.due_date === selectedDate)
    : [];

  // Format selected date for display
  const formatSelectedDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle item click — opens WorkItemDetail slide-over
  const handleItemClick = (item: WorkItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  // Handle item update from WorkItemDetail
  const handleItemUpdate = (updated: WorkItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setDetailItem(updated);
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Calendar</h1>

        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="text-slate-400 hover:text-slate-200 transition-colors duration-75 text-lg px-1"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-slate-200 min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={goToNextMonth}
            className="text-slate-400 hover:text-slate-200 transition-colors duration-75 text-lg px-1"
          >
            ›
          </button>
        </div>
      </div>

      {/* Main content: Calendar + optional day panel */}
      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className={cn('flex-1 min-w-0', loading && 'opacity-50')}>
          <CalendarGrid
            items={items}
            year={year}
            month={month}
            onDayClick={(date) =>
              setSelectedDate((prev) => (prev === date ? null : date))
            }
            onItemClick={handleItemClick}
          />
        </div>

        {/* Day side panel */}
        {selectedDate && (
          <div className="w-72 shrink-0 border-l border-slate-800 pl-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-200">
                {formatSelectedDate(selectedDate)}
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors duration-75 text-sm"
              >
                ✕
              </button>
            </div>

            {dayItems.length === 0 ? (
              <p className="text-xs text-slate-500">No items due this day.</p>
            ) : (
              <div className="space-y-0.5">
                {dayItems.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WorkItemDetail slide-over */}
      <WorkItemDetail
        item={detailItem}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleItemUpdate}
      />
    </div>
  );
}
