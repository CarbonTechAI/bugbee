'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/app/lib/utils';
import { useUser } from '@/app/context/UserContext';
import KindBadge from '@/app/components/KindBadge';
import ModuleBadge from '@/app/components/ModuleBadge';
import type { WorkItem, TeamMember, WorkItemPriority, Module } from '@/app/types';

const PRIORITIES: WorkItemPriority[] = ['urgent', 'high', 'normal', 'low'];

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function InboxPage() {
  const { userId } = useUser();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [triaged, setTriaged] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const getToken = useCallback(() => {
    return localStorage.getItem('bugbee_token') || '';
  }, []);

  // Fetch inbox items
  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch('/api/work-items/inbox', {
        headers: { 'x-bugbee-token': getToken() },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team-members', {
        headers: { 'x-bugbee-token': getToken() },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch {
      // silently fail
    }
  }, [getToken]);

  useEffect(() => {
    fetchInbox();
    fetchTeamMembers();
  }, [fetchInbox, fetchTeamMembers]);

  // Animate out then remove from list
  const animateOut = useCallback((itemId: string) => {
    setTriaged((prev) => new Set([...prev, itemId]));
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setTriaged((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 200);
  }, []);

  // PATCH helper
  const patchItem = useCallback(
    async (itemId: string, body: Record<string, unknown>) => {
      const res = await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-bugbee-token': getToken(),
        },
        body: JSON.stringify({ ...body, actor_id: userId }),
      });
      return res.ok;
    },
    [getToken, userId]
  );

  // Triage actions
  const handleAssign = useCallback(
    async (itemId: string, memberId: string) => {
      if (!memberId) return;
      const ok = await patchItem(itemId, { assigned_to: memberId });
      if (ok) animateOut(itemId);
    },
    [patchItem, animateOut]
  );

  const handlePriority = useCallback(
    async (itemId: string, priority: string) => {
      if (!priority) return;
      await patchItem(itemId, { priority });
    },
    [patchItem]
  );

  const handleArchive = useCallback(
    async (itemId: string) => {
      const ok = await patchItem(itemId, { status: 'archived' });
      if (ok) animateOut(itemId);
    },
    [patchItem, animateOut]
  );

  // Bulk actions
  const handleBulkAssign = useCallback(
    async (memberId: string) => {
      if (!memberId) return;
      const ids = Array.from(selected);
      const results = await Promise.all(
        ids.map((id) => patchItem(id, { assigned_to: memberId }))
      );
      results.forEach((ok, i) => {
        if (ok) animateOut(ids[i]);
      });
    },
    [selected, patchItem, animateOut]
  );

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selected);
    const results = await Promise.all(
      ids.map((id) => patchItem(id, { status: 'archived' }))
    );
    results.forEach((ok, i) => {
      if (ok) animateOut(ids[i]);
    });
  }, [selected, patchItem, animateOut]);

  // Selection helpers
  const toggleSelect = useCallback((itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }, [selected.size, items]);

  // Visible items (not yet animated out)
  const visibleItems = items;
  const activeCount = items.filter((i) => !triaged.has(i.id)).length;

  if (loading) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-slate-100 mb-1">Inbox</h1>
        <p className="text-sm text-slate-400 mb-6">Loading…</p>
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-12 rounded-md bg-slate-800/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Inbox</h1>
        <p className="text-sm text-slate-400">
          {activeCount === 0
            ? 'No items to triage'
            : `${activeCount} item${activeCount === 1 ? '' : 's'} to triage`}
        </p>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-md bg-slate-800 border border-slate-700">
          <span className="text-xs text-slate-300 font-medium">
            {selected.size} selected
          </span>
          <select
            onChange={(e) => {
              handleBulkAssign(e.target.value);
              e.target.value = '';
            }}
            className="text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-400"
            defaultValue=""
          >
            <option value="">Assign all to…</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkArchive}
            className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors duration-75"
          >
            Archive selected
          </button>
        </div>
      )}

      {/* Item list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-slate-100">Inbox zero.</p>
          <p className="text-xs text-slate-500 mt-1">
            New items without an owner will show up here for triage.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Select all */}
          {items.length > 1 && (
            <div className="flex items-center px-3 py-1">
              <input
                type="checkbox"
                checked={selected.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800"
              />
              <span className="text-xs text-slate-500 ml-3">Select all</span>
            </div>
          )}

          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center px-3 py-3 rounded-md gap-3 hover:bg-slate-800/50 transition-all duration-200 ease-out group',
                triaged.has(item.id)
                  ? 'opacity-0 h-0 overflow-hidden py-0 my-0'
                  : 'opacity-100'
              )}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 shrink-0"
              />

              {/* Title */}
              <span className="flex-1 text-sm text-slate-100 truncate">
                {item.title}
              </span>

              {/* Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <KindBadge kind={item.kind} />
                {item.module && <ModuleBadge module={item.module as Module} />}
              </div>

              {/* Created time + creator */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(item.created_at)}
                </span>
                {item.creator && (
                  <span className="text-xs text-slate-600">
                    {item.creator.name}
                  </span>
                )}
              </div>

              {/* Triage actions */}
              <div className="flex items-center gap-1 shrink-0">
                <select
                  onChange={(e) => {
                    handleAssign(item.id, e.target.value);
                    e.target.value = '';
                  }}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-400"
                  defaultValue=""
                >
                  <option value="">Assign…</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <select
                  onChange={(e) => {
                    handlePriority(item.id, e.target.value);
                    e.target.value = '';
                  }}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-400"
                  defaultValue=""
                >
                  <option value="">Priority…</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleArchive(item.id)}
                  className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors duration-75"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
