'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import PriorityDot from './PriorityDot';
import KindBadge from './KindBadge';
import ModuleBadge from './ModuleBadge';
import type { WorkItem, WorkItemStatus, Module } from '@/app/types';
import { STATUS_CONFIG } from '@/app/types';

interface TeamMember {
  id: string;
  name: string;
}

interface KanbanBoardProps {
  items: WorkItem[];
  onStatusChange: (
    itemId: string,
    newStatus: string,
    actorName: string
  ) => Promise<void>;
  onItemClick: (item: WorkItem) => void;
}

const KANBAN_STATUSES: {
  value: WorkItemStatus;
  label: string;
  borderColor: string;
}[] = [
  { value: 'inbox', label: 'Inbox', borderColor: 'border-slate-400/50' },
  { value: 'todo', label: 'Todo', borderColor: 'border-blue-400/50' },
  {
    value: 'in_progress',
    label: 'In Progress',
    borderColor: 'border-yellow-400/50',
  },
  {
    value: 'in_review',
    label: 'In Review',
    borderColor: 'border-purple-400/50',
  },
  { value: 'done', label: 'Done', borderColor: 'border-green-400/50' },
];

export default function KanbanBoard({
  items,
  onStatusChange,
  onItemClick,
}: KanbanBoardProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/team-members', {
        headers: {
          'x-bugbee-token': localStorage.getItem('bugbee_token') || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch {
      // Silently fail
    }
  };

  const getAssigneeName = (assigneeId: string | null) => {
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

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggingItem(itemId);
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    const userName = localStorage.getItem('bugbee_username');

    if (!userName) {
      alert('Please enter your name in the header before making changes');
      return;
    }

    const item = items.find((i) => i.id === itemId);
    if (item && item.status !== targetStatus) {
      await onStatusChange(itemId, targetStatus, userName);
    }
    setDraggingItem(null);
  };

  const getColumnItems = (status: string) =>
    items.filter((item) => item.status === status);

  const formatDueDate = (dueDate: string | null): string | null => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate: string | null): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map((status) => (
        <div
          key={status.value}
          className={cn(
            'flex-shrink-0 w-72 bg-slate-800/50 rounded-lg border-t-2',
            status.borderColor
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status.value)}
        >
          {/* Column Header */}
          <div className="p-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {status.label}
              </h3>
              <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-400">
                {getColumnItems(status.value).length}
              </span>
            </div>
          </div>

          {/* Column Body */}
          <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
            {getColumnItems(status.value).map((item) => {
              const assigneeName = getAssigneeName(item.assigned_to);
              const dueDateStr = formatDueDate(item.due_date);
              const overdue = isOverdue(item.due_date);

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => onItemClick(item)}
                  className={cn(
                    'bg-slate-800 rounded-lg p-3 cursor-pointer transition-all border border-slate-700/50',
                    'hover:border-slate-600 hover:shadow-lg',
                    draggingItem === item.id && 'opacity-50'
                  )}
                >
                  {/* Priority + Title */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="mt-1 shrink-0">
                      <PriorityDot priority={item.priority} />
                    </div>
                    <h4 className="text-sm text-slate-100 line-clamp-2">
                      {item.title}
                    </h4>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <KindBadge kind={item.kind} />
                    {item.module && (
                      <ModuleBadge module={item.module as Module} />
                    )}
                  </div>

                  {/* Footer: assignee + due date */}
                  <div className="flex items-center justify-between">
                    <div>
                      {assigneeName && (
                        <div
                          className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-medium text-indigo-300"
                          title={assigneeName}
                        >
                          {getInitials(assigneeName)}
                        </div>
                      )}
                    </div>
                    {dueDateStr && (
                      <span
                        className={cn(
                          'text-xs',
                          overdue ? 'text-red-400' : 'text-slate-500'
                        )}
                      >
                        {dueDateStr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {getColumnItems(status.value).length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
