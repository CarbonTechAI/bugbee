
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Plus, X } from 'lucide-react';

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
    const { userName } = useUser();
    const [title, setTitle] = useState('');
    const [typeId, setTypeId] = useState('');
    const [priority, setPriority] = useState('medium');
    const [notes, setNotes] = useState('');
    const [types, setTypes] = useState<any[]>([]);
    const [newTypeName, setNewTypeName] = useState('');
    const [isCreatingType, setIsCreatingType] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTypes();
        }
    }, [isOpen]);

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/todo-types', {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setTypes(data);
                if (data.length > 0 && !typeId) {
                    setTypeId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch types', error);
        }
    };

    const handleCreateType = async () => {
        if (!newTypeName.trim() || !userName) return;

        try {
            const res = await fetch('/api/todo-types', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({ name: newTypeName, actor_name: userName })
            });

            if (res.ok) {
                const newType = await res.json();
                setTypes([...types, newType]);
                setTypeId(newType.id);
                setNewTypeName('');
                setIsCreatingType(false);
            }
        } catch (error) {
            console.error('Failed to create type', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !userName) {
            alert(!userName ? "Please enter your name first" : "Title is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    title,
                    type_id: typeId || null,
                    priority,
                    notes,
                    actor_name: userName
                })
            });

            if (res.ok) {
                setTitle('');
                setNotes('');
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Failed to create task', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg w-full max-w-lg border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold">New Task</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Task Title *</label>
                        <input
                            autoFocus
                            type="text"
                            className="input w-full"
                            placeholder="What need to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                            {isCreatingType ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="input flex-1 min-w-0"
                                        placeholder="New Type Name"
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateType}
                                        className="btn btn-primary px-3"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select
                                        className="input w-full"
                                        value={typeId}
                                        onChange={(e) => setTypeId(e.target.value)}
                                    >
                                        <option value="">No Type</option>
                                        {types.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingType(true)}
                                        className="btn btn-secondary px-3"
                                        title="Create new type"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                            <select
                                className="input w-full"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Notes (Optional)</label>
                        <textarea
                            className="input w-full h-24 resize-none"
                            placeholder="Add details, links, or context..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {!userName && (
                        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded">
                            Please verify your identity by entering your name at the top of the main page before creating tasks.
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim() || !userName}
                            className="btn btn-primary bg-indigo-500 hover:bg-indigo-600"
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
