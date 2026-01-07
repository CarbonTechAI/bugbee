'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import StatusBadge from './components/StatusBadge';
import TodoTable from './components/todo/TodoTable';
import NewTaskModal from './components/todo/NewTaskModal';
import StatusDropdown from './components/StatusDropdown';
import { useUser } from './context/UserContext';
import { useRouter } from 'next/navigation';
import { Filter, ArrowUpDown, Archive, ListTodo, Plus } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const { userName } = useUser();
    const [tab, setTab] = useState<'bugs' | 'features' | 'todo'>('bugs');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    useEffect(() => {
        if (tab !== 'todo') {
            fetchItems();
        }
    }, [tab]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/${tab}`, {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.status === 401) {
                localStorage.removeItem('bugbee_token');
                window.location.reload();
                return;
            }
            const data = await res.json();
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        // Optimistic update
        setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

        try {
            await fetch(`/api/${tab}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    status: newStatus,
                    actor_name: userName
                })
            });
            // Background refresh to get precise timestamps/logs
            fetchItems();
        } catch (error) {
            console.error('Failed to update status', error);
            fetchItems(); // Revert
        }
    };

    const filteredItems = items
        .filter(i => {
            const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
            const matchesSeverity = severityFilter === 'all' || (tab === 'bugs' ? i.severity === severityFilter : i.priority === severityFilter);
            return matchesSearch && matchesStatus && matchesSeverity;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

    const uniqueStatuses = Array.from(new Set(items.map(i => i.status)));
    const severities = ['low', 'medium', 'high', 'critical'];
    const priorities = ['nice', 'important', 'critical'];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Inbox</h1>
                    <Link href="/archives" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors bg-slate-800/50 px-2 py-1 rounded border border-slate-800 hover:border-slate-700">
                        <Archive size={12} />
                        View Archives
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setTab('bugs')}
                            className={clsx("px-4 py-1.5 text-sm font-medium rounded transition-all", tab === 'bugs' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
                        >
                            Bugs
                        </button>
                        <button
                            onClick={() => setTab('features')}
                            className={clsx("px-4 py-1.5 text-sm font-medium rounded transition-all", tab === 'features' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
                        >
                            Features
                        </button>
                        <button
                            onClick={() => setTab('todo')}
                            className={clsx("px-4 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-2", tab === 'todo' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
                        >
                            <ListTodo size={14} />
                            To-Do
                        </button>
                    </div>

                    <button
                        onClick={() => setIsNewTaskOpen(true)}
                        className="btn btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm border-slate-600 hover:bg-slate-700 font-medium"
                    >
                        <Plus size={16} />
                        New Task
                    </button>
                </div>
            </div>

            {tab === 'todo' ? (
                <TodoTable />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-4">
                        <div className="flex flex-wrap gap-4 mb-4 items-center">
                            <input
                                placeholder="Search..."
                                className="input max-w-xs"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

                            <select
                                className="input max-w-[150px]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                {uniqueStatuses.map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</option>
                                ))}
                            </select>

                            <select
                                className="input max-w-[150px]"
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                            >
                                <option value="all">All {tab === 'bugs' ? 'Severities' : 'Priorities'}</option>
                                {(tab === 'bugs' ? severities : priorities).map(s => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                className="btn btn-secondary flex items-center gap-2"
                                title="Sort by Creation Date"
                            >
                                <ArrowUpDown size={14} />
                                {sortOrder === 'desc' ? 'Newest Logged' : 'Oldest Logged'}
                            </button>
                        </div>

                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 w-40">{tab === 'bugs' ? 'Severity' : 'Priority'}</th>
                                        <th className="px-6 py-3">Title</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 w-40 text-right">Created</th>
                                        <th className="px-6 py-3 w-40 text-right">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No items found</td></tr>
                                    ) : (
                                        filteredItems.map(item => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-700/50 transition-colors"
                                            >
                                                <td
                                                    className="px-6 py-4 cursor-pointer"
                                                    onClick={() => router.push(`/item/${item.id}?type=${tab === 'bugs' ? 'bug' : 'feature'}`)}
                                                >
                                                    <StatusBadge severity={tab === 'bugs' ? item.severity : item.priority} muted={item.status?.toLowerCase() === 'closed'} />
                                                </td>
                                                <td
                                                    className={clsx("px-6 py-4 font-medium cursor-pointer", item.status?.toLowerCase() === 'closed' && "line-through text-slate-500")}
                                                    onClick={() => router.push(`/item/${item.id}?type=${tab === 'bugs' ? 'bug' : 'feature'}`)}
                                                >
                                                    {item.title}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <StatusDropdown
                                                            type={tab}
                                                            currentStatus={item.status}
                                                            onStatusChange={(s) => handleStatusChange(item.id, s)}
                                                        />
                                                        {item.last_comment_at && (
                                                            (!localStorage.getItem(`bugbee_viewed_${item.id}`) ||
                                                                new Date(item.last_comment_at) > new Date(localStorage.getItem(`bugbee_viewed_${item.id}`)!))
                                                        ) && (
                                                                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-red-500/20 whitespace-nowrap">
                                                                    New Comment
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500">
                                                    <div className="flex flex-col items-end">
                                                        <span>{new Date(item.updated_at || item.created_at).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-slate-600">by {item.updated_by_name || 'system'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <NewTaskModal
                isOpen={isNewTaskOpen}
                onClose={() => setIsNewTaskOpen(false)}
                onSuccess={() => {
                    if (tab === 'todo') {
                        // Force refresh of todo table via context or event if we had one. 
                        // For now since NewTaskModal is disconnected from TodoTable's state,
                        // we might briefly see stale data until manual refresh OR we move fetch up.
                        // Simple fix: switch to Todo tab if not there
                        if (tab !== 'todo') setTab('todo');
                        else {
                            // This is a bit lazy but effective for now: trigger a window event or just let user refresh
                            // Ideally TodoTable exposes a refresh method or listens to global state
                            // Let's rely on standard navigation/reload behaviors or the user simply seeing the new item
                            // actually, NewTaskModal onSuccess should probably trigger a refetch in TodoTable
                            // We'll leave as is for MVP, user will likely switch tab or see it on next load
                            window.location.reload(); // Quickest way to ensure all lists update
                        }
                    } else {
                        setTab('todo');
                    }
                }}
            />
        </div>
    );
}

