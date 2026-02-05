'use client';

import { ModuleSelector } from './ModuleSelector';
import { AssigneeSelector } from './AssigneeSelector';
import { X } from 'lucide-react';
import type { Project } from '@/app/types';

interface FilterBarProps {
  moduleFilter: string | null;
  assigneeFilter: string | null;
  kindFilter?: string;
  statusFilter?: string;
  priorityFilter?: string;
  dueFilter?: string;
  projectFilter?: string | null;
  searchQuery?: string;
  projects?: Project[];
  onModuleChange: (module: string | null) => void;
  onAssigneeChange: (assignee: string | null) => void;
  onKindChange?: (kind: string) => void;
  onStatusChange?: (status: string) => void;
  onPriorityChange?: (priority: string) => void;
  onDueChange?: (due: string) => void;
  onProjectChange?: (project: string | null) => void;
  onSearchChange?: (query: string) => void;
  onClearFilters: () => void;
}

const selectClass =
  'text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75';

export function FilterBar({
  moduleFilter,
  assigneeFilter,
  kindFilter,
  statusFilter,
  priorityFilter,
  dueFilter,
  projectFilter,
  searchQuery,
  projects,
  onModuleChange,
  onAssigneeChange,
  onKindChange,
  onStatusChange,
  onPriorityChange,
  onDueChange,
  onProjectChange,
  onSearchChange,
  onClearFilters,
}: FilterBarProps) {
  const hasFilters =
    moduleFilter ||
    assigneeFilter ||
    (kindFilter && kindFilter !== 'all') ||
    (statusFilter && statusFilter !== 'all') ||
    (priorityFilter && priorityFilter !== 'all') ||
    (dueFilter && dueFilter !== 'all') ||
    projectFilter ||
    (searchQuery && searchQuery.trim() !== '');

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      {/* Search */}
      {onSearchChange && (
        <input
          type="text"
          placeholder="Search…"
          value={searchQuery || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-xs text-slate-100 bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 w-40 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
        />
      )}

      {/* Kind */}
      {onKindChange && (
        <select
          value={kindFilter || 'all'}
          onChange={(e) => onKindChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Kinds</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="task">Task</option>
          <option value="idea">Idea</option>
        </select>
      )}

      {/* Status */}
      {onStatusChange && (
        <select
          value={statusFilter || 'all'}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Statuses</option>
          <option value="inbox">Inbox</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
          <option value="archived">Archived</option>
        </select>
      )}

      {/* Priority */}
      {onPriorityChange && (
        <select
          value={priorityFilter || 'all'}
          onChange={(e) => onPriorityChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
          <option value="none">None</option>
        </select>
      )}

      {/* Module */}
      <div className="flex items-center gap-2">
        <ModuleSelector
          value={moduleFilter}
          onChange={onModuleChange}
          className="w-36"
        />
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2">
        <AssigneeSelector
          value={assigneeFilter}
          onChange={onAssigneeChange}
          className="w-32"
        />
      </div>

      {/* Due date */}
      {onDueChange && (
        <select
          value={dueFilter || 'all'}
          onChange={(e) => onDueChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="no_date">No Date</option>
        </select>
      )}

      {/* Project */}
      {onProjectChange && projects && (
        <select
          value={projectFilter || ''}
          onChange={(e) => onProjectChange(e.target.value || null)}
          className={selectClass}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors duration-75"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
