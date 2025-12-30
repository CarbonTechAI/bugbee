'use client';

import { useState, useEffect, ReactNode } from 'react';

export default function AuthGuard({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('bugbee_token');
        if (stored) setToken(stored);
        setLoading(false);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            localStorage.setItem('bugbee_token', input.trim());
            setToken(input.trim());
            window.location.reload(); // Reload to ensure all components pick it up seamlessly if needed, or just state update
        }
    };

    if (loading) return null;

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
                <div className="w-full max-w-sm card">
                    <h1 className="text-xl font-bold mb-4 text-center">BugBee Access</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="label">Access Code</label>
                            <input
                                type="password"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="input"
                                placeholder="Enter internal token..."
                            />
                        </div>
                        <button type="submit" className="w-full btn btn-primary">
                            Enter System
                        </button>
                        <p className="text-xs text-slate-500 text-center">
                            Internal Tool. Unauthorized access prohibited.
                        </p>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
