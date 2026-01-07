
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '../context/UserContext';

interface StatusDropdownProps {
    currentStatus: string;
    type: 'bug' | 'feature' | 'todo';
    onStatusChange: (newStatus: string) => Promise<void>;
}

export default function StatusDropdown({ currentStatus, type, onStatusChange }: StatusDropdownProps) {
    const { userName } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const STATUS_OPTIONS = {
        bug: [
            { value: 'open', label: 'Open', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { value: 'needs_verification', label: 'Needs Verification', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
            { value: 'reopened', label: 'Reopened', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { value: 'closed', label: 'Closed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { value: 'archived', label: 'Archived', color: 'bg-slate-700/50 text-slate-500 border-slate-700' }
        ],
        feature: [
            { value: 'open', label: 'Open', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { value: 'planned', label: 'Planned', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            { value: 'in_progress', label: 'In Progress', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
            { value: 'shipped', label: 'Shipped', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { value: 'closed', label: 'Closed', color: 'bg-slate-700/50 text-slate-500 border-slate-700' }
        ],
        todo: [
            { value: 'open', label: 'Open', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
        ]
    };

    const options = STATUS_OPTIONS[type] || [];
    const currentOption = options.find(o => o.value === currentStatus) || options[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleChange = async (newStatus: string) => {
        if (!userName) {
            alert('Please enter your name at the top of the page to change status.');
            return;
        }
        setIsLoading(true);
        await onStatusChange(newStatus);
        setIsOpen(false);
        setIsLoading(false);
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                disabled={isLoading}
                className={clsx(
                    "px-2 py-0.5 rounded text-xs font-semibold border capitalize whitespace-nowrap flex items-center gap-1 transition-all",
                    currentOption.color,
                    isLoading && "opacity-50 cursor-not-allowed"
                )}
            >
                {currentOption.label}
                <ChevronDown size={12} className={clsx("transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-32 bg-slate-800 border border-slate-700 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {options.map(option => (
                        <button
                            key={option.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleChange(option.value);
                            }}
                            className={clsx(
                                "w-full text-left px-3 py-2 text-xs hover:bg-slate-700 transition-colors flex items-center gap-2",
                                currentStatus === option.value ? "text-white font-medium bg-slate-700/50" : "text-slate-400"
                            )}
                        >
                            <span className={clsx("w-2 h-2 rounded-full", option.color.split(' ')[0].replace('/20', ''))}></span>
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
