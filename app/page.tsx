'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/app/context/UserContext';
import WorkItemRow from '@/app/components/WorkItemRow';
import SectionGroup from '@/app/components/SectionGroup';
import WorkItemDetail from '@/app/components/WorkItemDetail';
import type { WorkItem, MyFocusResponse } from '@/app/types';

const SECTION_ORDER: {
  key: keyof MyFocusResponse;
  label: string;
  accentColor?: 'red' | 'amber';
  defaultOpen?: boolean;
}[] = [
  { key: 'overdue', label: 'Overdue', accentColor: 'red' },
  { key: 'due_today', label: 'Due Today', accentColor: 'amber' },
  { key: 'due_this_week', label: 'Due This Week' },
  { key: 'high_priority', label: 'High Priority' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'other', label: 'Todo' },
  { key: 'recently_done', label: 'Recently Done', defaultOpen: false },
];

export default function MyFocusPage() {
  const { userId } = useUser();
  const [data, setData] = useState<MyFocusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  const fetchFocusData = useCallback(async () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('bugbee_token');
      const res = await fetch('/api/work-items/my-focus?user_id=' + userId, {
        headers: { 'x-bugbee-token': token || '' },
      });
      if (res.status === 401) {
        localStorage.removeItem('bugbee_token');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const json: MyFocusResponse = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail — data will remain null and show empty state
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchFocusData();
  }, [fetchFocusData]);

  const handleItemClick = (item: WorkItem) => {
    setSelectedItem(item);
    setSlideOverOpen(true);
  };

  const handleSlideOverClose = () => {
    setSlideOverOpen(false);
  };

  const handleItemUpdate = (updatedItem: WorkItem) => {
    // Update the item in the local data so re-render reflects changes
    if (!data) return;
    const updated = { ...data };
    for (const key of Object.keys(updated) as (keyof MyFocusResponse)[]) {
      updated[key] = updated[key].map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );
    }
    setData(updated);
    // Also update the selected item
    setSelectedItem(updatedItem);
  };

  const isEmpty =
    data &&
    SECTION_ORDER.every((section) => data[section.key].length === 0);

  // Loading skeleton
  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="h-8 w-32 bg-slate-800 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-800/50 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Page Title */}
      <h1 className="text-2xl font-semibold text-slate-100 mb-8">My Focus</h1>

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <p className="text-sm text-slate-100 mb-1">
            Nothing to focus on. Nice.
          </p>
          <p className="text-xs text-slate-500">
            New items will appear here when they&apos;re assigned to you.
          </p>
        </div>
      )}

      {/* No userId state */}
      {!userId && !loading && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <p className="text-sm text-slate-100 mb-1">
            Set your name to see your focus items.
          </p>
          <p className="text-xs text-slate-500">
            Enter your name in the header to get started.
          </p>
        </div>
      )}

      {/* Sections */}
      {data && !isEmpty && (
        <div className="space-y-8">
          {SECTION_ORDER.map((section) => {
            const items = data[section.key];
            if (items.length === 0) return null;

            return (
              <SectionGroup
                key={section.key}
                label={section.label}
                count={items.length}
                accentColor={section.accentColor}
                defaultOpen={section.defaultOpen ?? true}
              >
                {items.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                    accentColor={section.accentColor}
                  />
                ))}
              </SectionGroup>
            );
          })}
        </div>
      )}

      {/* Slide-Over Detail Panel */}
      <WorkItemDetail
        item={selectedItem}
        open={slideOverOpen}
        onClose={handleSlideOverClose}
        onUpdate={handleItemUpdate}
      />
    </div>
  );
}
