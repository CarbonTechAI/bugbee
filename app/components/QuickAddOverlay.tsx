'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/app/lib/utils';
import { useUser } from '@/app/context/UserContext';
import { useToast } from '@/app/components/Toast';
import { parseNaturalDate } from '@/app/utils/dates';
import {
  MODULES,
  KIND_CONFIG,
  type WorkItemKind,
  type WorkItemPriority,
  type Module,
} from '@/app/types';

interface QuickAddOverlayProps {
  open: boolean;
  onClose: () => void;
}

const KINDS: WorkItemKind[] = ['task', 'bug', 'feature', 'idea'];

const PRIORITIES: { value: WorkItemPriority; label: string }[] = [
  { value: 'none', label: 'No priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export default function QuickAddOverlay({ open, onClose }: QuickAddOverlayProps) {
  const { userId } = useUser();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<WorkItemKind>('task');
  const [priority, setPriority] = useState<WorkItemPriority>('none');
  const [module, setModule] = useState<string>('');
  const [dueDateText, setDueDateText] = useState('');
  const [parsedDate, setParsedDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus the title input when overlay opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM is ready after transition
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleDueDateBlur = useCallback(() => {
    if (dueDateText.trim()) {
      const parsed = parseNaturalDate(dueDateText);
      setParsedDate(parsed);
    } else {
      setParsedDate(null);
    }
  }, [dueDateText]);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('bugbee_token') || '';
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bugbee-token': token,
        },
        body: JSON.stringify({
          title: trimmed,
          kind,
          priority,
          module: module || undefined,
          due_date: parsedDate || undefined,
          assigned_to: userId || undefined,
          status: 'inbox' as const,
          actor_id: userId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        showToast(err.error || 'Failed to create item', 'error');
        return;
      }

      showToast(`Created: ${trimmed}`, 'success');

      // Clear title for rapid adds, keep other fields
      setTitle('');
      titleInputRef.current?.focus();
    } catch {
      showToast('Network error — could not create item', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [title, kind, priority, module, parsedDate, userId, submitting, showToast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Overlay panel */}
      <div
        className={cn(
          'fixed top-[20%] left-1/2 -translate-x-1/2 z-50',
          'w-full max-w-lg',
          'rounded-xl bg-slate-800 border border-slate-700',
          'shadow-[0_16px_48px_rgba(0,0,0,0.50)]',
          'overflow-hidden',
          'transition-all duration-150 ease-out',
          'opacity-100 translate-y-0'
        )}
      >
        {/* Title input */}
        <div className="px-4 pt-4 pb-3">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            className="w-full text-sm text-slate-100 bg-transparent placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Options row */}
        <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
          {/* Kind selector */}
          <div className="flex items-center gap-1">
            {KINDS.map((k) => {
              const config = KIND_CONFIG[k];
              const isActive = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    'text-[11px] font-medium px-2 py-0.5 rounded-full',
                    'transition-colors duration-75',
                    isActive
                      ? `${config.textColor} ${config.bg}`
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {/* Priority select */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as WorkItemPriority)}
            className="text-xs text-slate-400 bg-transparent border border-slate-700 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Module select */}
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="text-xs text-slate-400 bg-transparent border border-slate-700 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">Module</option>
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.shortLabel}
              </option>
            ))}
          </select>

          {/* Due date input */}
          <input
            type="text"
            value={dueDateText}
            onChange={(e) => setDueDateText(e.target.value)}
            onBlur={handleDueDateBlur}
            onKeyDown={handleKeyDown}
            placeholder="Due date"
            title={parsedDate ? `Parsed: ${parsedDate}` : 'e.g. tomorrow, next friday, jan 15'}
            className={cn(
              'text-xs bg-transparent border border-slate-700 rounded-md px-2 py-1 w-24 outline-none',
              'focus:ring-1 focus:ring-blue-600 focus:border-blue-600',
              parsedDate ? 'text-slate-100' : 'text-slate-400',
              dueDateText && !parsedDate && dueDateText.trim() ? 'border-red-500/50' : ''
            )}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Footer */}
        <div className="px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            ↵ to create · Esc to close
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className={cn(
              'px-3 py-1.5 rounded-md',
              'bg-blue-600 hover:bg-blue-700',
              'text-xs font-medium text-white',
              'transition-colors duration-75',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
}
