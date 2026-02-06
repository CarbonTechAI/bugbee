'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Inbox,
  Calendar,
  LayoutList,
  FolderKanban,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

// ---- Navigation Config ----

interface NavSection {
  items: { icon: LucideIcon; label: string; path: string; showBadge?: boolean }[];
}

const navSections: NavSection[] = [
  {
    items: [
      { icon: Home, label: 'My Focus', path: '/' },
      { icon: Inbox, label: 'Inbox', path: '/inbox', showBadge: true },
      { icon: Calendar, label: 'Calendar', path: '/calendar' },
    ],
  },
  {
    items: [
      { icon: LayoutList, label: 'All Work', path: '/work' },
      { icon: FolderKanban, label: 'Projects', path: '/projects' },
    ],
  },
  {
    items: [
      { icon: Users, label: 'Team & Workload', path: '/team' },
    ],
  },
];

// ---- NavItem ----

function NavItem({
  icon: Icon,
  label,
  path,
  badge,
  active,
}: {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
  active: boolean;
}) {
  return (
    <Link
      href={path}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md',
        'text-sm transition-colors duration-75',
        active
          ? 'text-slate-100 bg-slate-800'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      )}
    >
      <Icon size={18} strokeWidth={1.5} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[11px] font-medium text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ---- Sidebar ----

export default function Sidebar() {
  const pathname = usePathname();
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    async function fetchInboxCount() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('bugbee_token') : null;
        const res = await fetch('/api/work-items/inbox', {
          headers: { 'x-bugbee-token': token || '' },
        });
        if (res.ok) {
          const data = await res.json();
          // Support both array response and { count } response
          if (Array.isArray(data)) {
            setInboxCount(data.length);
          } else if (typeof data.count === 'number') {
            setInboxCount(data.count);
          }
        }
      } catch {
        // Silently fail — badge just won't show
      }
    }
    fetchInboxCount();
  }, []);

  return (
    <aside className="w-60 h-screen bg-slate-900 border-r border-slate-800 flex flex-col py-4 shrink-0">
      {/* App title */}
      <div className="px-4 mb-6">
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
          BugBee
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {sIdx > 0 && (
              <div className="border-t border-slate-800 my-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  badge={item.showBadge ? inboxCount : undefined}
                  active={pathname === item.path}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Quick Add shortcut */}
      <div className="px-4 mt-4">
        <button className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors duration-75">
          <span>Quick Add</span>
          <kbd className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>
    </aside>
  );
}
