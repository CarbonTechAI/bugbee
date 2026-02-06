'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/app/lib/utils';
import { useUser } from '@/app/context/UserContext';
import { FilterBar } from '@/app/components/FilterBar';
import KanbanBoard from '@/app/components/KanbanBoard';
import WorkItemRow from '@/app/components/WorkItemRow';
import WorkItemDetail from '@/app/components/WorkItemDetail';
import PriorityDot from '@/app/components/PriorityDot';
import KindBadge from '@/app/components/KindBadge';
import ModuleBadge from '@/app/components/ModuleBadge';
import { StatusPill } from '@/app/components/StatusBadge';
import type {
  WorkItem,
  WorkItemKind,
  WorkItemStatus,
  WorkItemPriority,
  Module,
  TeamMember,
  Project,
} from '@/app/types';

// ---- Auth helper ----

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('bugbee_token')
      : null;
  return {
    'Content-Type': 'application/json',
    'x-bugbee-token': token || '',
  };
}

// ---- Sort types ----

type SortField = 'created' | 'priority' | 'due_date' | 'updated';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { field: SortField; dir: SortDir; label: string }[] = [
  { field: 'created', dir: 'desc', label: 'Newest first' },
  { field: 'created', dir: 'asc', label: 'Oldest first' },
  { field: 'priority', dir: 'desc', label: 'Priority (highest)' },
  { field: 'due_date', dir: 'asc', label: 'Due date (soonest)' },
  { field: 'updated', dir: 'desc', label: 'Recently updated' },
];

const PRIORITY_ORDER: Record<WorkItemPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
  none: 0,
};

// ---- Date helpers ----

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCreatedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---- Component ----

type ViewMode = 'list' | 'kanban';

export default function AllWorkPage() {
  const { userId } = useUser();

  // View mode
  const [view, setView] = useState<ViewMode>('list');

  // Data
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueFilter, setDueFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sort
  const [sortIndex, setSortIndex] = useState(0);

  // Detail slide-over
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Sort columns (list view)
  const [columnSort, setColumnSort] = useState<{
    col: string;
    dir: 'asc' | 'desc';
  } | null>(null);

  // ---- Fetch lookups ----

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [membersRes, projectsRes] = await Promise.all([
          fetch('/api/team-members', { headers: authHeaders() }),
          fetch('/api/projects', { headers: authHeaders() }),
        ]);
        if (membersRes.ok) {
          setTeamMembers(await membersRes.json());
        }
        if (projectsRes.ok) {
          setProjects(await projectsRes.json());
        }
      } catch {
        // Silently fail
      }
    };
    fetchLookups();
  }, []);

  // ---- Fetch items ----

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kindFilter !== 'all') params.set('kind', kindFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (moduleFilter) params.set('module', moduleFilter);
      if (assigneeFilter) params.set('assigned_to', assigneeFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (projectFilter) params.set('project_id', projectFilter);

      const res = await fetch(`/api/work-items?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        let data: WorkItem[] = await res.json();

        // Client-side search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          data = data.filter((item) =>
            item.title.toLowerCase().includes(q)
          );
        }

        // Client-side due-date filter
        if (dueFilter !== 'all') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

          data = data.filter((item) => {
            if (dueFilter === 'no_date') return !item.due_date;
            if (!item.due_date) return false;
            const due = new Date(item.due_date);
            due.setHours(0, 0, 0, 0);
            if (dueFilter === 'overdue') return due < today;
            if (dueFilter === 'today')
              return due.getTime() === today.getTime();
            if (dueFilter === 'this_week')
              return due >= today && due <= endOfWeek;
            return true;
          });
        }

        setItems(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [
    kindFilter,
    statusFilter,
    moduleFilter,
    assigneeFilter,
    priorityFilter,
    projectFilter,
    dueFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ---- Sort items ----

  const getSortedItems = useCallback((): WorkItem[] => {
    const sorted = [...items];

    // If a column header was clicked in list view, use that
    if (columnSort) {
      sorted.sort((a, b) => {
        let cmp = 0;
        switch (columnSort.col) {
          case 'priority':
            cmp =
              PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            break;
          case 'title':
            cmp = a.title.localeCompare(b.title);
            break;
          case 'kind':
            cmp = a.kind.localeCompare(b.kind);
            break;
          case 'status':
            cmp = a.status.localeCompare(b.status);
            break;
          case 'due_date':
            if (!a.due_date && !b.due_date) cmp = 0;
            else if (!a.due_date) cmp = 1;
            else if (!b.due_date) cmp = -1;
            else cmp = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            break;
          case 'created':
            cmp =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
          default:
            cmp = 0;
        }
        return columnSort.dir === 'asc' ? cmp : -cmp;
      });
      return sorted;
    }

    // Fallback to the sort dropdown
    const { field, dir } = SORT_OPTIONS[sortIndex];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case 'created':
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
        case 'updated':
          cmp =
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime();
          break;
        case 'priority':
          cmp =
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'due_date':
          if (!a.due_date && !b.due_date) cmp = 0;
          else if (!a.due_date) cmp = 1;
          else if (!b.due_date) cmp = -1;
          else
            cmp =
              new Date(a.due_date).getTime() -
              new Date(b.due_date).getTime();
          break;
      }
      return dir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [items, sortIndex, columnSort]);

  // ---- Column sort handler ----

  const handleColumnSort = (col: string) => {
    if (columnSort?.col === col) {
      // Toggle direction
      setColumnSort({
        col,
        dir: columnSort.dir === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setColumnSort({ col, dir: 'asc' });
    }
  };

  const sortArrow = (col: string) => {
    if (columnSort?.col !== col) return '';
    return columnSort.dir === 'asc' ? ' ↑' : ' ↓';
  };

  // ---- Clear filters ----

  const clearFilters = () => {
    setKindFilter('all');
    setStatusFilter('all');
    setModuleFilter(null);
    setAssigneeFilter(null);
    setPriorityFilter('all');
    setDueFilter('all');
    setProjectFilter(null);
    setSearchQuery('');
  };

  const hasFilters =
    kindFilter !== 'all' ||
    statusFilter !== 'all' ||
    moduleFilter !== null ||
    assigneeFilter !== null ||
    priorityFilter !== 'all' ||
    dueFilter !== 'all' ||
    projectFilter !== null ||
    searchQuery.trim() !== '';

  // ---- Kanban status change ----

  const handleStatusChange = async (
    itemId: string,
    newStatus: string,
    _actorName: string
  ) => {
    try {
      const res = await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          status: newStatus,
          actor_id: userId || undefined,
        }),
      });
      if (res.ok) {
        fetchItems();
      }
    } catch {
      // Silently fail
    }
  };

  // ---- Detail handlers ----

  const openDetail = (item: WorkItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleItemUpdate = (updated: WorkItem) => {
    setSelectedItem(updated);
    setItems((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  };

  // ---- Get assignee name ----

  const getAssigneeName = (assigneeId: string | null): string | null => {
    if (!assigneeId) return null;
    const member = teamMembers.find((m) => m.id === assigneeId);
    return member?.name || null;
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // ---- Render ----

  const sortedItems = getSortedItems();

  return (
    <div className="px-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
          All Work
        </h1>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <select
            value={sortIndex}
            onChange={(e) => {
              setSortIndex(Number(e.target.value));
              setColumnSort(null); // Reset column sort when using dropdown
            }}
            className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
          >
            {SORT_OPTIONS.map((opt, idx) => (
              <option key={idx} value={idx}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-slate-700 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors duration-75',
                view === 'list'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors duration-75',
                view === 'kanban'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        moduleFilter={moduleFilter}
        assigneeFilter={assigneeFilter}
        kindFilter={kindFilter}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        dueFilter={dueFilter}
        projectFilter={projectFilter}
        searchQuery={searchQuery}
        projects={projects}
        onModuleChange={setModuleFilter}
        onAssigneeChange={setAssigneeFilter}
        onKindChange={setKindFilter}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onDueChange={setDueFilter}
        onProjectChange={setProjectFilter}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
      />

      {/* Loading */}
      {loading && (
        <div className="space-y-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center px-3 py-2 gap-3 animate-pulse"
            >
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              <div className="flex-1 h-4 bg-slate-700 rounded" />
              <div className="w-10 h-5 bg-slate-700 rounded-full" />
              <div className="w-16 h-5 bg-slate-700 rounded-full" />
              <div className="w-10 h-4 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
          {hasFilters ? (
            <>
              <p className="text-sm text-slate-100 mb-1">
                No items match these filters.
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Try adjusting your filter criteria.
              </p>
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors duration-75"
              >
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-100 mb-1">
                No work items yet.
              </p>
              <p className="text-xs text-slate-500">
                Create your first item to get started.
              </p>
            </>
          )}
        </div>
      )}

      {/* List View */}
      {!loading && sortedItems.length > 0 && view === 'list' && (
        <div>
          {/* Table header */}
          <div className="flex items-center px-3 py-2 gap-3 border-b border-slate-800 mb-1">
            <button
              onClick={() => handleColumnSort('priority')}
              className="w-2 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors duration-75"
              title="Sort by priority"
            >
              {sortArrow('priority') || '·'}
            </button>
            <button
              onClick={() => handleColumnSort('title')}
              className="flex-1 text-left text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors duration-75"
            >
              Title{sortArrow('title')}
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleColumnSort('kind')}
                className="w-16 text-left text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors duration-75"
              >
                Kind{sortArrow('kind')}
              </button>
              <span className="w-20 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                Module
              </span>
              <span className="w-20 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                Assignee
              </span>
              <button
                onClick={() => handleColumnSort('status')}
                className="w-24 text-left text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors duration-75"
              >
                Status{sortArrow('status')}
              </button>
              <button
                onClick={() => handleColumnSort('due_date')}
                className="w-20 text-left text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors duration-75"
              >
                Due{sortArrow('due_date')}
              </button>
              <button
                onClick={() => handleColumnSort('created')}
                className="w-24 text-left text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors duration-75"
              >
                Created{sortArrow('created')}
              </button>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-0.5">
            {sortedItems.map((item) => {
              const assigneeName = getAssigneeName(item.assigned_to);
              const isOverdue =
                item.due_date &&
                new Date(item.due_date) <
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate()
                  );
              const isDone = item.status === 'done';

              return (
                <div
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md gap-3',
                    'transition-colors duration-75 cursor-pointer',
                    'hover:bg-slate-800/50',
                    isOverdue && 'border-l-2 border-red-500',
                    isDone && 'opacity-50'
                  )}
                >
                  <PriorityDot priority={item.priority} />

                  <span className="flex-1 text-sm text-slate-100 truncate">
                    {item.title}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-16">
                      <KindBadge kind={item.kind} />
                    </span>
                    <span className="w-20">
                      {item.module && (
                        <ModuleBadge module={item.module as Module} />
                      )}
                    </span>
                    <span className="w-20 text-xs text-slate-400 truncate">
                      {assigneeName || '—'}
                    </span>
                    <span className="w-24">
                      <StatusPill status={item.status} />
                    </span>
                    <span
                      className={cn(
                        'w-20 text-xs',
                        isOverdue ? 'text-red-400' : 'text-slate-500'
                      )}
                    >
                      {item.due_date ? formatDate(item.due_date) : '—'}
                    </span>
                    <span className="w-24 text-xs text-slate-500">
                      {formatCreatedDate(item.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban View */}
      {!loading && sortedItems.length > 0 && view === 'kanban' && (
        <KanbanBoard
          items={sortedItems}
          onStatusChange={handleStatusChange}
          onItemClick={openDetail}
        />
      )}

      {/* Work Item Detail Slide-over */}
      <WorkItemDetail
        item={selectedItem}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleItemUpdate}
      />
    </div>
  );
}
