
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import StatusDropdown from '../StatusDropdown';
import { ArrowUpDown, Filter, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export default function TodoTable() {
    const { userName } = useUser();
    const [todos, setTodos] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all'); // all, open, completed
    const [showCompleted, setShowCompleted] = useState(false);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const fetchTodos = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (showCompleted) queryParams.set('show_completed', 'true');
            if (typeFilter !== 'all') queryParams.set('type_id', typeFilter);
            if (search) queryParams.set('search', search);

            const res = await fetch(`/api/todos?${queryParams.toString()}`, {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            const data = await res.json();
            setTodos(data);
        } catch (error) {
            console.error('Failed to fetch todos', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/todo-types', {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            const data = await res.json();
            setTypes(data);
        } catch (error) {
            console.error('Failed to fetch types', error);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    useEffect(() => {
        fetchTodos();
    }, [showCompleted, typeFilter]); // Re-fetch query based

    // Client-side filtering for immediate feedback if not refetching everything
    const filteredTodos = todos
        .filter(t => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'open') return !t.is_completed;
            if (statusFilter === 'completed') return t.is_completed;
            return true;
        })
        .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (!userName) return;

        // Optimistic update
        const isCompleted = newStatus === 'completed';
        setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: isCompleted, status: newStatus } : t));

        try {
            await fetch(`/api/todos/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    is_completed: isCompleted,
                    actor_name: userName
                })
            });
            // Background refresh to get precise timestamps
            fetchTodos();
        } catch (error) {
            console.error('Failed to update status', error);
            fetchTodos(); // Revert
        }
    };

    const handleDelete = async (id: string) => {
        if (!userName || !confirm('Are you sure you want to delete this task?')) return;
        try {
            await fetch(`/api/todos/${id}?actor_name=${encodeURIComponent(userName)}`, {
                method: 'DELETE',
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            setTodos(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <input
                    placeholder="Search tasks..."
                    className="input max-w-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

                <select
                    className="input max-w-[150px]"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">All Types</option>
                    {types.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                <select
                    className="input max-w-[150px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="completed">Completed</option>
                </select>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 hover:text-white select-none">
                        <input
                            type="checkbox"
                            checked={showCompleted}
                            onChange={(e) => setShowCompleted(e.target.checked)}
                            className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                        />
                        Show Completed History
                    </label>
                </div>

                <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="btn btn-secondary flex items-center gap-2 ml-auto"
                    title="Sort by Creation Date"
                >
                    <ArrowUpDown size={14} />
                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-3 w-32">Type</th>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3 w-40">Status</th>
                            <th className="px-6 py-3 w-40 text-right">Created</th>
                            <th className="px-6 py-3 w-40 text-right">Last Updated</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading tasks...</td></tr>
                        ) : filteredTodos.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No tasks found</td></tr>
                        ) : (
                            filteredTodos.map(todo => (
                                <tr key={todo.id} className="hover:bg-slate-700/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded text-xs font-semibold border uppercase whitespace-nowrap bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                                            {todo.type ? todo.type.name : 'Task'}
                                        </span>
                                    </td>
                                    <td className={clsx("px-6 py-4 font-medium", todo.is_completed && "line-through text-slate-500")}>
                                        {todo.title}
                                        {todo.notes && <div className="text-xs text-slate-500 font-normal truncate max-w-md">{todo.notes}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusDropdown
                                            type="todo"
                                            currentStatus={todo.is_completed ? 'completed' : 'open'}
                                            onStatusChange={(s) => handleStatusChange(todo.id, s)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500">
                                        <div className="flex flex-col items-end">
                                            <span>{new Date(todo.created_at).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-600">by {todo.created_by_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500">
                                        <div className="flex flex-col items-end">
                                            <span>{new Date(todo.updated_at).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-600">by {todo.updated_by_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(todo.id)}
                                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Task"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Expose refresh method ref? Or just rely on SWR-like patterns? For now simple effect re-fetches */}
        </div>
    );
}
