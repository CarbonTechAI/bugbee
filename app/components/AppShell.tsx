'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/app/components/Sidebar';
import QuickAddOverlay from '@/app/components/QuickAddOverlay';
import { useKeyboard } from '@/app/hooks/useKeyboard';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const shortcuts = useCallback(
    () => ({
      'cmd+k': () => setQuickAddOpen((prev) => !prev),
    }),
    []
  );

  useKeyboard(shortcuts());

  return (
    <>
      <div className="min-h-screen flex bg-slate-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <QuickAddOverlay
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </>
  );
}
