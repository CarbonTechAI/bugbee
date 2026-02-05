'use client';

import { useEffect } from 'react';

/**
 * Global keyboard shortcut hook.
 * Listens for Cmd+K (Mac) / Ctrl+K (Windows) and dispatches to registered handlers.
 *
 * Usage:
 *   useKeyboard({ 'cmd+k': () => setOpen(true) });
 */
export function useKeyboard(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts['cmd+k']?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
