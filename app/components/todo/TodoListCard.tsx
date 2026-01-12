'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, MoreHorizontal, Calendar } from 'lucide-react';
import TodoItem from './TodoItem';
import { useUser } from '../../context/UserContext';

interface TodoListCardProps {
    list: any;
    onRefresh: () => void;
}

export default function TodoListCard({ list, onRefresh }: TodoListCardProps) {
    const { userName } = useUser();
    const [newItemText, setNewItemText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const activeItems = list.items.filter((i: any) => !i.is_completed);
    const completedItems = list.items.filter((i: any) => i.is_completed);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || isSubmitting) return;

        if (!userName) {
            alert('Please enter your name at the top of the page to add items.');
            return;
        }

        setIsSubmitting(true);
        try {
            await fetch(`/api/todos/${list.id}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    text: newItemText,
                    actor_name: userName,
                    priority: 'medium' // Default to medium
                })
            });
            setNewItemText('');
            onRefresh();
        } catch (error) {
            console.error('Failed to add item', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateItem = async (itemId: string, updates: any) => {
        try {
            await fetch(`/api/todos/items/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    ...updates,
                    actor_name: userName
                })
            });
            onRefresh();
        } catch (error) {
            console.error('Failed to update item', error);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            await fetch(`/api/todos/items/${itemId}?actor_name=${encodeURIComponent(userName)}`, {
                method: 'DELETE',
                headers: {
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                }
            });
            onRefresh();
        } catch (error) {
            console.error('Failed to delete item', error);
        }
    };

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex flex-col h-full max-h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-lg">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-white">{list.name}</h3>
                    <button className="text-slate-500 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} />
                    <span>Created {new Date(list.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
                <div className="space-y-0.5">
                    {activeItems.map((item: any) => (
                        <TodoItem
                            key={item.id}
                            item={item}
                            onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                            onDelete={() => handleDeleteItem(item.id)}
                        />
                    ))}
                    {activeItems.length === 0 && completedItems.length === 0 && (
                        <div className="text-center text-slate-600 py-8 text-sm italic">
                            No items yet. Add one below!
                        </div>
                    )}
                </div>

                {/* Completed Section */}
                {completedItems.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-300 mb-2 px-2 uppercase tracking-wider w-full"
                        >
                            {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Completed ({completedItems.length})
                        </button>

                        {showCompleted && (
                            <div className="opacity-75 space-y-0.5">
                                {completedItems.map((item: any) => (
                                    <TodoItem
                                        key={item.id}
                                        item={item}
                                        onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                                        onDelete={() => handleDeleteItem(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Item Footer */}
            <form onSubmit={handleAddItem} className="p-3 border-t border-slate-700 bg-slate-900/30 rounded-b-lg">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Add an item..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 pl-9 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                    />
                    <Plus className="absolute left-2.5 top-2.5 text-slate-500" size={16} />
                </div>
            </form>
        </div>
    );
}
