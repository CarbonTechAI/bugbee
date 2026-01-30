'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
    id: string;
    name: string;
    email: string | null;
    role: string;
    avatar_url: string | null;
    is_active: boolean;
}

interface AssigneeSelectorProps {
    value?: string | null;
    onChange: (assigneeId: string | null) => void;
    showAll?: boolean;
    className?: string;
}

export function AssigneeSelector({ value, onChange, showAll = true, className = '' }: AssigneeSelectorProps) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/team-members', {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (error) {
            console.error('Failed to fetch team members', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <select disabled className={`input opacity-50 ${className}`}>
                <option>Loading...</option>
            </select>
        );
    }

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={`input ${className}`}
        >
            {showAll && <option value="">All Team</option>}
            {!showAll && <option value="">Unassigned</option>}
            {members.map((member) => (
                <option key={member.id} value={member.id}>
                    {member.name}
                </option>
            ))}
        </select>
    );
}

interface AssigneeBadgeProps {
    assigneeId?: string | null;
    assigneeName?: string | null;
    size?: 'sm' | 'md';
}

export function AssigneeBadge({ assigneeId, assigneeName, size = 'md' }: AssigneeBadgeProps) {
    if (!assigneeId && !assigneeName) return null;

    const sizeClasses = size === 'sm' 
        ? 'px-1.5 py-0.5 text-xs' 
        : 'px-2 py-1 text-sm';

    // Generate a consistent color based on the name
    const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
    const colorIndex = (assigneeName || '').charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <span className={`${bgColor} text-white rounded-full font-medium ${sizeClasses}`}>
            {assigneeName || 'Unknown'}
        </span>
    );
}
