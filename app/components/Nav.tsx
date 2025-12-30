'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function Nav() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
                href="/"
                className={clsx(
                    "transition-colors hover:text-white",
                    pathname === '/' ? "text-white" : "text-slate-400"
                )}
            >
                Dashboard
            </Link>
            <div className="w-px h-4 bg-slate-700 mx-2" />
            <Link
                href="/report/bug"
                className={clsx(
                    "px-4 py-2 rounded-md transition-all shadow-lg hover:shadow-red-500/20 flex items-center gap-2",
                    pathname === '/report/bug'
                        ? "bg-red-500 text-white"
                        : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                )}
            >
                Report Bug
            </Link>
            <Link
                href="/report/feature"
                className={clsx(
                    "px-4 py-2 rounded-md transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2",
                    pathname === '/report/feature'
                        ? "bg-blue-500 text-white"
                        : "bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20"
                )}
            >
                Request Feature
            </Link>
        </nav>
    );
}
