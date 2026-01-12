'use client';

import { useState } from 'react';
import { Check, Trash2, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '../../context/UserContext';

interface TodoItemProps {
    item: any;
    onUpdate: (updates: any) => void;
    onDelete: () => void;
}

export default function TodoItem({ item, onUpdate, onDelete }: TodoItemProps) {
    const { userName } = useUser();
    const [isHovered, setIsHovered] = useState(false);

    const toggleComplete = () => {
        if (!userName) {
            alert('Please enter your name at the top of the page first.');
            return;
        }
        onUpdate({ is_completed: !item.is_completed });
    };

    const handleDelete = () => {
        if (!userName) {
            alert('Please enter your name at the top of the page first.');
            return;
        }
        if (confirm('Are you sure you want to delete this item?')) {
            onDelete();
        }
    };

    return (
        <div
            className="group flex items-start gap-3 py-2 px-1 hover:bg-slate-800/50 rounded transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={toggleComplete}
                className={clsx(
                    "mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all",
                    item.is_completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-slate-600 hover:border-slate-400"
                )}
            >
                {item.is_completed && <Check size={12} strokeWidth={3} />}
            </button>

            <div className="flex-1 min-w-0">
                <div className={clsx(
                    "text-sm break-words transition-all",
                    item.is_completed ? "text-slate-500 line-through" : "text-slate-200"
                )}>
                    {item.text}
                </div>

                <div className="flex items-center gap-2 mt-1">
                    {item.priority && item.priority !== 'medium' && (
                        <span className={clsx(
                            "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                            item.priority === 'high' ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-slate-700 text-slate-400"
                        )}>
                            {item.priority}
                        </span>
                    )}
                    {item.notes && (
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {item.notes}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={handleDelete}
                className={clsx(
                    "text-slate-500 hover:text-red-400 transition-opacity p-1",
                    isHovered ? "opacity-100" : "opacity-0"
                )}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
