'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { ModuleBadge } from './ModuleSelector';
import StatusBadge from './StatusBadge';

interface TeamMember {
    id: string;
    name: string;
}

interface KanbanBoardProps {
    items: any[];
    type: 'bugs' | 'features';
    onStatusChange: (itemId: string, newStatus: string, actorName: string) => Promise<void>;
    onItemClick: (item: any) => void;
}

const BUG_STATUSES = [
    { value: 'open', label: 'Open', color: 'border-red-500/50' },
    { value: 'in_progress', label: 'In Progress', color: 'border-yellow-500/50' },
    { value: 'needs_verification', label: 'Needs Verification', color: 'border-blue-500/50' },
    { value: 'fixed', label: 'Fixed', color: 'border-green-500/50' },
];

const FEATURE_STATUSES = [
    { value: 'open', label: 'Open', color: 'border-slate-500/50' },
    { value: 'planned', label: 'Planned', color: 'border-purple-500/50' },
    { value: 'in_progress', label: 'In Progress', color: 'border-yellow-500/50' },
    { value: 'shipped', label: 'Shipped', color: 'border-green-500/50' },
];

export default function KanbanBoard({ items, type, onStatusChange, onItemClick }: KanbanBoardProps) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [draggingItem, setDraggingItem] = useState<string | null>(null);

    const statuses = type === 'bugs' ? BUG_STATUSES : FEATURE_STATUSES;

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

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleDragStart = (e: React.DragEvent, itemId: string) => {
        setDraggingItem(itemId);
        e.dataTransfer.setData('text/plain', itemId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const userName = localStorage.getItem('bugbee_username');
        
        if (!userName) {
            alert('Please enter your name in the header before making changes');
            return;
        }

        const item = items.find(i => i.id === itemId);
        if (item && item.status !== targetStatus) {
            await onStatusChange(itemId, targetStatus, userName);
        }
        setDraggingItem(null);
    };

    const getColumnItems = (status: string) => {
        return items.filter(item => item.status === status);
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map(status => (
                <div
                    key={status.value}
                    className={clsx(
                        "flex-shrink-0 w-72 bg-slate-800/50 rounded-lg border-t-2",
                        status.color
                    )}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status.value)}
                >
                    {/* Column Header */}
                    <div className="p-3 border-b border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-slate-300">{status.label}</h3>
                            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-400">
                                {getColumnItems(status.value).length}
                            </span>
                        </div>
                    </div>

                    {/* Column Body */}
                    <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                        {getColumnItems(status.value).map(item => {
                            const assigneeName = getAssigneeName(item.assigned_to);
                            return (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item.id)}
                                    onClick={() => onItemClick(item)}
                                    className={clsx(
                                        "bg-slate-800 rounded-lg p-3 cursor-pointer transition-all border border-slate-700/50",
                                        "hover:border-slate-600 hover:shadow-lg",
                                        draggingItem === item.id && "opacity-50"
                                    )}
                                >
                                    {/* Title */}
                                    <h4 className="font-medium text-sm text-slate-200 line-clamp-2 mb-2">
                                        {item.title}
                                    </h4>

                                    {/* Meta row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {/* Severity/Priority */}
                                            <StatusBadge 
                                                severity={type === 'bugs' ? item.severity : item.priority} 
                                                muted={false}
                                            />
                                            {/* Module */}
                                            {item.module && (
                                                <ModuleBadge module={item.module} size="sm" />
                                            )}
                                        </div>

                                        {/* Assignee */}
                                        {assigneeName && (
                                            <div 
                                                className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-medium text-indigo-300"
                                                title={assigneeName}
                                            >
                                                {getInitials(assigneeName)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div className="mt-2 text-xs text-slate-500">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}

                        {getColumnItems(status.value).length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No items
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
