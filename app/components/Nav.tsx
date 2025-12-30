'use client';

import Link from 'next/link';

export default function Nav() {
    return (
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/report/bug" className="hover:text-white transition-colors">+ Report Bug</Link>
            <Link href="/report/feature" className="hover:text-white transition-colors">+ Request Feature</Link>
            <button
                onClick={() => { localStorage.removeItem('bugbee_token'); window.location.reload(); }}
                className="text-red-400 hover:text-red-300 ml-4 text-xs"
            >
                Logout
            </button>
        </nav>
    );
}
