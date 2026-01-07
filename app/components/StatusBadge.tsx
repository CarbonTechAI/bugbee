import clsx from 'clsx';

export default function StatusBadge({ status, severity, muted }: { status?: string, severity?: string, muted?: boolean }) {
    if (severity) {
        if (muted) {
            return (
                <span className="px-2 py-0.5 rounded text-xs font-semibold border uppercase whitespace-nowrap bg-slate-700/30 text-slate-600 border-slate-700/50">
                    {severity}
                </span>
            );
        }
        const colors: Record<string, string> = {
            critical: 'bg-red-500/20 text-red-500 border-red-500/30',
            high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
            medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
            low: 'bg-green-500/20 text-green-500 border-green-500/30',
        };
        return (
            <span className={clsx("px-2 py-0.5 rounded text-xs font-semibold border uppercase whitespace-nowrap", colors[severity.toLowerCase()] || 'bg-slate-700 text-slate-300 border-slate-600')}>
                {severity}
            </span>
        );
    }

    if (status) {
        const colors: Record<string, string> = {
            open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            fixed: 'bg-green-500/20 text-green-400 border-green-500/30',
            shipped: 'bg-green-500/20 text-green-400 border-green-500/30',
            needs_verification: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
            reopened: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            closed: 'bg-slate-700/50 text-slate-500 border-slate-700',
        };
        return (
            <span className={clsx("px-2 py-0.5 rounded text-xs font-semibold border capitalize whitespace-nowrap", colors[status.toLowerCase()] || 'bg-slate-700 text-slate-300 border-slate-600')}>
                {status === 'closed' ? 'Closed & Archived' : status.replace('_', ' ')}
            </span>
        );
    }

    return null;
}
