'use client';

import { User, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useEffect, useState } from 'react';

export default function UserNameInput() {
    const { userName, setUserName } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-40 h-9 bg-slate-800/50 rounded animate-pulse" />;

    return (
        <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <User size={14} />
            </div>
            <input
                type="text"
                placeholder="Your Name (Required)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`
                    pl-9 pr-3 py-1.5 bg-slate-900 border appearance-none rounded text-sm w-40 md:w-48
                    focus:outline-none focus:ring-1 transition-all
                    ${!userName.trim()
                        ? 'border-red-500/50 focus:border-red-500 ring-red-500/20 placeholder:text-red-300/50'
                        : 'border-slate-700 focus:border-blue-500 ring-blue-500/20'
                    }
                `}
            />
            {!userName.trim() && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-[10px] text-red-400 font-medium bg-red-950/90 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Required for actions
                </div>
            )}
        </div>
    );
}
