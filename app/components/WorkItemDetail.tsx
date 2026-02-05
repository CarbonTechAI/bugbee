'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/app/lib/utils';
import { useUser } from '@/app/context/UserContext';
import KindBadge from './KindBadge';
import { StatusPill } from './StatusBadge';
import type {
  WorkItem,
  WorkItemStatus,
  WorkItemPriority,
  WorkItemKind,
  Module,
  Comment,
  TeamMember,
  Project,
  ChecklistItem,
} from '@/app/types';
import { STATUS_CONFIG, MODULES } from '@/app/types';

// ---- Constants ----

const STATUSES: WorkItemStatus[] = [
  'inbox',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'archived',
];

const PRIORITIES: WorkItemPriority[] = [
  'urgent',
  'high',
  'normal',
  'low',
  'none',
];

const PRIORITY_LABELS: Record<WorkItemPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
  none: 'None',
};

const KINDS: WorkItemKind[] = ['bug', 'feature', 'task', 'idea'];

const KIND_LABELS: Record<WorkItemKind, string> = {
  bug: 'Bug',
  feature: 'Feature',
  task: 'Task',
  idea: 'Idea',
};

// ---- Helper: get auth header ----

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

// ---- Props ----

interface WorkItemDetailProps {
  item: WorkItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (item: WorkItem) => void;
}

// ---- Component ----

export default function WorkItemDetail({
  item,
  open,
  onClose,
  onUpdate,
}: WorkItemDetailProps) {
  const { userId, userName } = useUser();

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Lookup data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Sync title value when item changes
  useEffect(() => {
    if (item) {
      setTitleValue(item.title);
      setEditingTitle(false);
    }
  }, [item]);

  // Fetch comments when item opens
  const fetchComments = useCallback(async () => {
    if (!item) return;
    try {
      const res = await fetch(`/api/work-items/${item.id}/comments`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data: Comment[] = await res.json();
        setComments(data);
      }
    } catch {
      // Silently fail
    }
  }, [item]);

  useEffect(() => {
    if (open && item) {
      fetchComments();
    } else {
      setComments([]);
      setCommentBody('');
    }
  }, [open, item, fetchComments]);

  // Fetch team members and projects for dropdowns
  useEffect(() => {
    if (!open) return;

    const fetchLookups = async () => {
      try {
        const [membersRes, projectsRes] = await Promise.all([
          fetch('/api/team-members', { headers: authHeaders() }),
          fetch('/api/projects', { headers: authHeaders() }),
        ]);
        if (membersRes.ok) {
          const data = await membersRes.json();
          setTeamMembers(data);
        }
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data);
        }
      } catch {
        // Silently fail
      }
    };

    fetchLookups();
  }, [open]);

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // ---- PATCH helper ----

  const patchItem = async (updates: Record<string, unknown>) => {
    if (!item) return;
    try {
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          ...updates,
          actor_id: userId || undefined,
          actor_name: userName || undefined,
        }),
      });
      if (res.ok) {
        const updated: WorkItem = await res.json();
        onUpdate(updated);
      }
    } catch {
      // Silently fail
    }
  };

  // ---- Title save ----

  const saveTitle = () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && item && trimmed !== item.title) {
      patchItem({ title: trimmed });
    } else if (item) {
      setTitleValue(item.title);
    }
  };

  // ---- Comment submit ----

  const submitComment = async () => {
    if (!item || !commentBody.trim() || !userId) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/work-items/${item.id}/comments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          body: commentBody.trim(),
          actor_id: userId,
        }),
      });
      if (res.ok) {
        setCommentBody('');
        fetchComments();
      }
    } catch {
      // Silently fail
    } finally {
      setSubmittingComment(false);
    }
  };

  // ---- Checklist toggle ----

  const toggleChecklist = (checkItem: ChecklistItem) => {
    if (!item) return;
    const updatedChecklist = item.checklist.map((c) =>
      c.id === checkItem.id ? { ...c, completed: !c.completed } : c
    );
    patchItem({ checklist: updatedChecklist });
  };

  // ---- Render ----

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-30 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[480px] z-40',
          'bg-slate-900 border-l border-slate-800',
          'shadow-[-8px_0_24px_rgba(0,0,0,0.40)]',
          'overflow-y-auto',
          'transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {item && (
          <>
            {/* Sticky Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <KindBadge kind={item.kind} />
                <StatusPill status={item.status} />
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 transition-colors duration-75 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Title — editable on click */}
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') {
                      setEditingTitle(false);
                      setTitleValue(item.title);
                    }
                  }}
                  className="w-full text-lg font-semibold text-slate-100 bg-transparent border-b border-blue-600 outline-none pb-1"
                />
              ) : (
                <h2
                  className="text-lg font-semibold text-slate-100 cursor-pointer hover:text-slate-200 transition-colors duration-75"
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit"
                >
                  {item.title}
                </h2>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Status */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) =>
                      patchItem({ status: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                    Priority
                  </label>
                  <select
                    value={item.priority}
                    onChange={(e) =>
                      patchItem({ priority: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                    Assignee
                  </label>
                  <select
                    value={item.assigned_to || ''}
                    onChange={(e) =>
                      patchItem({
                        assigned_to: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={item.due_date || ''}
                    onChange={(e) =>
                      patchItem({
                        due_date: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                  />
                </div>

                {/* Module */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                    Module
                  </label>
                  <select
                    value={item.module || ''}
                    onChange={(e) =>
                      patchItem({
                        module: (e.target.value as Module) || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                  >
                    <option value="">None</option>
                    {MODULES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                    Project
                  </label>
                  <select
                    value={item.project_id || ''}
                    onChange={(e) =>
                      patchItem({
                        project_id: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kind */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                    Kind
                  </label>
                  <select
                    value={item.kind}
                    onChange={(e) =>
                      patchItem({ kind: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Checklist */}
              {item.checklist && item.checklist.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                    Checklist
                  </h3>
                  <div className="space-y-1">
                    {item.checklist.map((check) => (
                      <label
                        key={check.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-800/50 transition-colors duration-75 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={check.completed}
                          onChange={() => toggleChecklist(check)}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span
                          className={cn(
                            'text-sm',
                            check.completed
                              ? 'text-slate-500 line-through'
                              : 'text-slate-300'
                          )}
                        >
                          {check.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                  Comments
                </h3>

                {comments.length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-xs text-slate-500">No comments yet.</p>
                  </div>
                )}

                {comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-slate-800/50 rounded-md px-3 py-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-300">
                            {comment.author?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(comment.created_at).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                {userId && (
                  <div className="flex gap-2">
                    <input
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitComment();
                        }
                      }}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                    />
                    <button
                      onClick={submitComment}
                      disabled={!commentBody.trim() || submittingComment}
                      className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
