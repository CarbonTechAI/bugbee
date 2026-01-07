'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    CheckCircle2,
    Circle,
    Clock,
    Filter,
    Plus,
    Search,
    AlertCircle,
    User
} from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '../../context/UserContext';
import StatusBadge from '../StatusBadge';

export default function TodoTable() {
    const router = useRouter();
    const { userName } = useUser();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('');
    const [showClosed, setShowClosed] = useState(false);

    // New Task State
    const [isCreating, setIsCreating] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskType, setNewTaskType] = useState('Task');

    // Unique types for filter dropdown
    const availableTypes = Array.from(new Set(items.map(i => i.type || 'Task'))).sort();

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType) params.append('type', filterType);
            if (showClosed) params.append('showClosed', 'true');

            const res = await fetch(`/api/todos?${params.toString()}`, {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch todos', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [filterType, showClosed]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        if (!userName) {
            alert('Please enter your name');
            return;
        }

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    text: newTaskText,
                    type: newTaskType,
                    actor_name: userName
                })
            });

            if (res.ok) {
                setNewTaskText('');
                setIsCreating(false);
                fetchItems();
            }
        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    const handleToggleComplete = async (item: any, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click

        try {
            // Optimistic update
            const newStatus = !item.is_completed;
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, is_completed: newStatus } : i
            ));

            await fetch(`/api/todos/items/${item.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    is_completed: newStatus,
                    actor_name: userName
                })
            });
            // Background refresh to confirm consistency
            fetchItems();
        } catch (error) {
            console.error('Failed to toggle completion', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md pl-9 pr-8 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-750"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {availableTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showClosed}
                            onChange={(e) => setShowClosed(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                        />
                        Show Completed
                    </label>
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    New Task
                </button>
            </div>

            {/* Create Inline (Modal overlay for now to match style, or could be inline row) */}
            {isCreating && (
                <div className="p-4 bg-slate-800/50 border-b border-slate-700 animate-in slide-in-from-top-2">
                    <form onSubmit={handleCreate} className="flex gap-4 items-start">
                        <div className="flex-1">
                            <input
                                autoFocus
                                type="text"
                                placeholder="What needs to be done?"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                            />
                        </div>
                        <div className="w-48">
                            <input
                                type="text"
                                placeholder="Type (e.g. Task)"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                value={newTaskType}
                                onChange={(e) => setNewTaskType(e.target.value)}
                                list="types-datalist"
                            />
                            <datalist id="types-datalist">
                                <option value="Task" />
                                <option value="Bug" />
                                <option value="Feature" />
                                <option value="Onboarding" />
                            </datalist>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-medium"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-8 md:col-span-6">Task</div>
                <div className="col-span-4 md:col-span-2">Type</div>
                <div className="hidden md:block col-span-2">Created By</div>
                <div className="hidden md:block col-span-2 text-right">Created</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-500 gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                        Loading...
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <CheckCircle2 size={48} className="mb-4 text-slate-700" />
                        <p className="text-lg font-medium text-slate-400">All caught up!</p>
                        <p className="text-sm">No tasks found matching your filters.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/todo/${item.id}`)}
                                className={clsx(
                                    "grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-slate-800/50 transition-colors cursor-pointer group",
                                    item.is_completed && "opacity-50"
                                )}
                            >
                                <div className="col-span-8 md:col-span-6 flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleToggleComplete(item, e)}
                                        className={clsx(
                                            "flex-shrink-0 transition-colors",
                                            item.is_completed ? "text-green-500" : "text-slate-600 hover:text-slate-400"
                                        )}
                                    >
                                        {item.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>
                                    <span className={clsx(
                                        "font-medium truncate",
                                        item.is_completed ? "text-slate-500 line-through" : "text-slate-200"
                                    )}>
                                        {item.text}
                                    </span>
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                        {item.type || 'Task'}
                                    </span>
                                </div>
                                <div className="hidden md:block col-span-2 text-sm text-slate-400">
                                    {item.created_by_name}
                                </div>
                                <div className="hidden md:block col-span-2 text-right text-sm text-slate-500 font-mono">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
