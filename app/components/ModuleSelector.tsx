'use client';

import { useState } from 'react';

const MODULES = [
    { value: 'receptionbee', label: 'ReceptionBee', color: 'bg-blue-500' },
    { value: 'recruitbee', label: 'RecruitBee', color: 'bg-green-500' },
    { value: 'nurturebee', label: 'NurtureBee', color: 'bg-purple-500' },
    { value: 'pulsebee', label: 'PulseBee', color: 'bg-orange-500' },
    { value: 'socialbee', label: 'SocialBee', color: 'bg-pink-500' },
    { value: 'bugbee', label: 'BugBee', color: 'bg-yellow-500' },
    { value: 'other', label: 'Other', color: 'bg-slate-500' },
];

interface ModuleSelectorProps {
    value?: string | null;
    onChange: (module: string | null) => void;
    showAll?: boolean;
    className?: string;
}

export function ModuleSelector({ value, onChange, showAll = true, className = '' }: ModuleSelectorProps) {
    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={`input ${className}`}
        >
            {showAll && <option value="">All Modules</option>}
            {!showAll && <option value="">Select Module</option>}
            {MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                    {m.label}
                </option>
            ))}
        </select>
    );
}

interface ModuleBadgeProps {
    module?: string | null;
    size?: 'sm' | 'md';
}

export function ModuleBadge({ module, size = 'md' }: ModuleBadgeProps) {
    if (!module) return null;
    
    const moduleConfig = MODULES.find(m => m.value === module);
    if (!moduleConfig) return null;

    const sizeClasses = size === 'sm' 
        ? 'px-1.5 py-0.5 text-xs' 
        : 'px-2 py-1 text-sm';

    return (
        <span className={`${moduleConfig.color} text-white rounded-full font-medium ${sizeClasses}`}>
            {moduleConfig.label}
        </span>
    );
}

export { MODULES };
