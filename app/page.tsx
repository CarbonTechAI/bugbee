'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import StatusBadge from './components/StatusBadge';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, Archive, LayoutGrid, List } from 'lucide-react';
import TaskDetailModal from './components/TaskDetailModal';
import KanbanBoard from './components/KanbanBoard';
import { FilterBar } from './components/FilterBar';
import { ModuleBadge } from './components/ModuleSelector';

interface TeamMember {
    id: string;
    name: string;
}

export default function Dashboard() {
    const router = useRouter();
    const [tab, setTab] = useState<'bugs' | 'features' | 'todos'>('bugs');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // View mode
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [showCompleted, setShowCompleted] = useState(false);
    const [moduleFilter, setModuleFilter] = useState<string | null>(null);
    const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

    // Team members for display
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    // Task detail modal
    const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [tab, moduleFilter, assigneeFilter]);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const res = await fetch('/api/team-members', {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data);
            }
        } catch (error) {
            console.error('Failed to fetch team members', error);
        }
    };

    const getAssigneeName = (assigneeId: string | null) => {
        if (!assigneeId) return null;
        const member = teamMembers.find(m => m.id === assigneeId);
        return member?.name || null;
    };

    const fetchItems = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const params = new URLSearchParams();
            if (moduleFilter) params.set('module', moduleFilter);
            if (assigneeFilter) params.set('assigned_to', assigneeFilter);
            
            const queryString = params.toString();
            const url = `/api/${tab}${queryString ? `?${queryString}` : ''}`;
            
            const res = await fetch(url, {
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

    const handleStatusChange = async (itemId: string, newStatus: string, actorName: string) => {
        // Optimistic update
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));

        try {
            const res = await fetch(`/api/${tab}/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    status: newStatus,
                    actor_name: actorName,
                }),
            });
            if (!res.ok) {
                fetchItems(false);
                alert('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            fetchItems(false);
            alert('Failed to update status');
        }
    };

    const handleItemClick = (item: any) => {
        router.push(`/item/${item.id}?type=${tab === 'bugs' ? 'bug' : 'feature'}`);
    };

    const filteredItems = items
        .filter(i => {
            // For todos, filter by search in title and notes
            const matchesSearch = tab === 'todos'
                ? (i.title.toLowerCase().includes(search.toLowerCase()) ||
                   (i.notes && i.notes.toLowerCase().includes(search.toLowerCase())))
                : i.title.toLowerCase().includes(search.toLowerCase());

            // For todos, handle completion status filter
            if (tab === 'todos') {
                const matchesCompletion = showCompleted || !i.is_completed;
                const matchesStatus = statusFilter === 'all' ||
                    (statusFilter === 'open' && !i.is_completed) ||
                    (statusFilter === 'completed' && i.is_completed);
                const matchesType = typeFilter === 'all' || i.type?.id === typeFilter;
                return matchesSearch && matchesCompletion && matchesStatus && matchesType;
            }

            const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
            const matchesSeverity = severityFilter === 'all' || (tab === 'bugs' ? i.severity === severityFilter : i.priority === severityFilter);
            return matchesSearch && matchesStatus && matchesSeverity;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

    const bugStatuses = ['open', 'in_progress', 'needs_verification', 'fixed', 'closed_archived'];
    const featureStatuses = ['open', 'planned', 'in_progress', 'shipped', 'closed'];
    const todoStatuses = ['open', 'completed'];
    const statuses = tab === 'bugs' ? bugStatuses : tab === 'features' ? featureStatuses : todoStatuses;
    const severities = ['low', 'medium', 'high', 'critical'];
    const priorities = ['nice', 'important', 'critical'];
    const uniqueTypes = Array.from(new Set(items.filter(i => i.type).map(i => ({ id: i.type.id, name: i.type.name })))).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    const showKanbanToggle = tab === 'bugs' || tab === 'features';

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2 sm:gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold">Inbox</h1>
                    <Link href="/archives" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors bg-slate-800/50 px-2 py-1 rounded border border-slate-800 hover:border-slate-700 whitespace-nowrap">
                        <Archive size={12} />
                        <span className="hidden sm:inline">View Archives</span>
                        <span className="sm:hidden">Archives</span>
                    </Link>
                </div>
                <div className="flex gap-2 bg-slate-800 p-1 rounded-lg w-full sm:w-auto">
                    <button
                        onClick={() => setTab('bugs')}
                        className={clsx("flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded transition-all", tab === 'bugs' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
                    >
                        Bugs
                    </button>
                    <button
                        onClick={() => setTab('features')}
                        className={clsx("flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded transition-all", tab === 'features' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
                    >
                        Features
                    </button>
                    <button
                        onClick={() => setTab('todos')}
                        className={clsx("flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded transition-all", tab === 'todos' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
                    >
                        To-Do
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-4">
                    {/* Filter Bar for bugs/features */}
                    {showKanbanToggle && (
                        <FilterBar
                            moduleFilter={moduleFilter}
                            assigneeFilter={assigneeFilter}
                            onModuleChange={setModuleFilter}
                            onAssigneeChange={setAssigneeFilter}
                            onClearFilters={() => {
                                setModuleFilter(null);
                                setAssigneeFilter(null);
                            }}
                        />
                    )}

                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <input
                            placeholder="Search..."
                            className="input max-w-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

                        {tab === 'todos' ? (
                            <>
                                <select
                                    className="input max-w-[150px]"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    {todoStatuses.map(s => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>

                                <select
                                    className="input max-w-[150px]"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    {uniqueTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>

                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showCompleted}
                                        onChange={(e) => setShowCompleted(e.target.checked)}
                                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                    />
                                    Show Completed
                                </label>
                            </>
                        ) : (
                            <>
                                <select
                                    className="input max-w-[150px]"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    {statuses.map((s: string) => (
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
                            </>
                        )}

                        {viewMode === 'list' && (
                            <button
                                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                className="btn btn-secondary flex items-center gap-2"
                                title="Sort by Creation Date"
                            >
                                <ArrowUpDown size={14} />
                                {sortOrder === 'desc' ? 'Newest Logged' : 'Oldest Logged'}
                            </button>
                        )}

                        {/* View Toggle */}
                        {showKanbanToggle && (
                            <>
                                <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
                                <div className="flex bg-slate-800 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={clsx(
                                            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-all",
                                            viewMode === 'list' 
                                                ? "bg-slate-700 text-white" 
                                                : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <List size={14} />
                                        List
                                    </button>
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        className={clsx(
                                            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-all",
                                            viewMode === 'kanban' 
                                                ? "bg-slate-700 text-white" 
                                                : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <LayoutGrid size={14} />
                                        Board
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Content Area */}
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading...</div>
                    ) : viewMode === 'kanban' && showKanbanToggle ? (
                        <KanbanBoard
                            items={filteredItems}
                            type={tab as 'bugs' | 'features'}
                            onStatusChange={handleStatusChange}
                            onItemClick={handleItemClick}
                        />
                    ) : (
                        <div className="card p-0 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-200">
                                <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700">
                                    <tr>
                                        {tab === 'todos' ? (
                                            <>
                                                <th className="px-6 py-3 w-40">Type</th>
                                                <th className="px-6 py-3">Title</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3 w-40 text-right">Created</th>
                                                <th className="px-6 py-3 w-40 text-right">Last Updated</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-4 py-3 w-28">{tab === 'bugs' ? 'Severity' : 'Priority'}</th>
                                                <th className="px-4 py-3">Title</th>
                                                <th className="px-4 py-3 w-32">Module</th>
                                                <th className="px-4 py-3 w-28">Assignee</th>
                                                <th className="px-4 py-3 w-36">Status</th>
                                                <th className="px-4 py-3 w-28 text-right">Created</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredItems.length === 0 ? (
                                        <tr><td colSpan={tab === 'todos' ? 5 : 6} className="px-6 py-8 text-center text-slate-500">No items found</td></tr>
                                    ) : (
                                        filteredItems.map(item => (
                                            tab === 'todos' ? (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => {
                                                        setSelectedTodoId(item.id);
                                                        setShowTaskModal(true);
                                                    }}
                                                    className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-4">
                                                        {item.type ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/20">
                                                                {item.type.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className={clsx("px-6 py-4 font-medium", item.is_completed && "line-through text-slate-500")}>
                                                        <div className="flex flex-col">
                                                            <span>{item.title}</span>
                                                            {item.priority && (
                                                                <span className="text-xs text-slate-500 mt-0.5">
                                                                    Priority: {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={item.is_completed ? 'completed' : 'open'}
                                                            onChange={async (e) => {
                                                                e.stopPropagation();
                                                                const userName = localStorage.getItem('bugbee_username');
                                                                if (!userName) {
                                                                    alert('Please enter your name in the header before making changes');
                                                                    return;
                                                                }
                                                                const newStatus = e.target.value === 'completed';
                                                                try {
                                                                    const res = await fetch(`/api/todos/${item.id}`, {
                                                                        method: 'PATCH',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                                                                        },
                                                                        body: JSON.stringify({
                                                                            is_completed: newStatus,
                                                                            actor_name: userName,
                                                                        }),
                                                                    });
                                                                    if (res.ok) {
                                                                        fetchItems();
                                                                    } else {
                                                                        alert('Failed to update status');
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('Failed to update status');
                                                                }
                                                            }}
                                                            className="input text-xs py-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="open">Open</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500">
                                                        <div className="flex flex-col items-end">
                                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-slate-600">by {item.created_by_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500">
                                                        <div className="flex flex-col items-end">
                                                            <span>{new Date(item.last_activity_at).toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-slate-600">by {item.last_activity_by}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => router.push(`/item/${item.id}?type=${tab === 'bugs' ? 'bug' : 'feature'}`)}
                                                    className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-4 py-3"><StatusBadge severity={tab === 'bugs' ? item.severity : item.priority} muted={item.status?.toLowerCase() === 'closed_archived' || item.status?.toLowerCase() === 'closed'} /></td>
                                                    <td className={clsx("px-4 py-3 font-medium", item.status?.toLowerCase() === 'closed_archived' && "line-through text-slate-500")}>{item.title}</td>
                                                    <td className="px-4 py-3">
                                                        {item.module ? (
                                                            <ModuleBadge module={item.module} size="sm" />
                                                        ) : (
                                                            <span className="text-slate-500 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {getAssigneeName(item.assigned_to) ? (
                                                            <span className="text-sm text-slate-300">{getAssigneeName(item.assigned_to)}</span>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={item.status || ''}
                                                                onChange={async (e) => {
                                                                    e.stopPropagation();
                                                                    const userName = localStorage.getItem('bugbee_username');
                                                                    if (!userName) {
                                                                        alert('Please enter your name in the header before making changes');
                                                                        return;
                                                                    }
                                                                    const newStatus = e.target.value;
                                                                    const isArchiving = newStatus === 'closed_archived' || newStatus === 'closed';

                                                                    // Optimistic update: immediately remove item if archiving
                                                                    if (isArchiving) {
                                                                        setItems(prev => prev.filter(i => i.id !== item.id));
                                                                    } else {
                                                                        // Update status locally for non-archive changes
                                                                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
                                                                    }

                                                                    try {
                                                                        const res = await fetch(`/api/${tab}/${item.id}`, {
                                                                            method: 'PATCH',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                                                                            },
                                                                            body: JSON.stringify({
                                                                                status: newStatus,
                                                                                actor_name: userName,
                                                                            }),
                                                                        });
                                                                        if (!res.ok) {
                                                                            // Revert on failure
                                                                            fetchItems(false);
                                                                            alert('Failed to update status');
                                                                        }
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        fetchItems(false);
                                                                        alert('Failed to update status');
                                                                    }
                                                                }}
                                                                className="input text-xs py-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {statuses.map((s: string) => (
                                                                    <option key={s} value={s}>{s === 'closed_archived' || s === 'closed' ? 'Closed & Archived' : s.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</option>
                                                                ))}
                                                            </select>
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
                                                    <td className="px-4 py-3 text-right text-slate-500">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            )
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <TaskDetailModal
                isOpen={showTaskModal}
                todoId={selectedTodoId}
                onClose={() => {
                    setShowTaskModal(false);
                    setSelectedTodoId(null);
                }}
                onUpdate={() => {
                    fetchItems();
                }}
            />
        </div>
    );
}
