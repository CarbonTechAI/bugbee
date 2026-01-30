'use client';

import { ModuleSelector } from './ModuleSelector';
import { AssigneeSelector } from './AssigneeSelector';
import { X } from 'lucide-react';

interface FilterBarProps {
    moduleFilter: string | null;
    assigneeFilter: string | null;
    onModuleChange: (module: string | null) => void;
    onAssigneeChange: (assignee: string | null) => void;
    onClearFilters: () => void;
}

export function FilterBar({ 
    moduleFilter, 
    assigneeFilter, 
    onModuleChange, 
    onAssigneeChange, 
    onClearFilters 
}: FilterBarProps) {
    const hasFilters = moduleFilter || assigneeFilter;

    return (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Module:</label>
                <ModuleSelector 
                    value={moduleFilter} 
                    onChange={onModuleChange}
                    className="w-40"
                />
            </div>
            
            <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Assignee:</label>
                <AssigneeSelector 
                    value={assigneeFilter} 
                    onChange={onAssigneeChange}
                    className="w-36"
                />
            </div>

            {hasFilters && (
                <button
                    onClick={onClearFilters}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <X size={14} />
                    Clear filters
                </button>
            )}
        </div>
    );
}
