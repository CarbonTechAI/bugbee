'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function Nav() {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Dashboard' },
        { href: '/report/bug', label: '+ Report Bug' },
        { href: '/report/feature', label: '+ Request Feature' },
    ];

    return (
        <nav className="flex flex-col gap-2 text-sm font-medium">
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                        "transition-colors",
                        pathname === link.href
                            ? "text-blue-400"
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}
