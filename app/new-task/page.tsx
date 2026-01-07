'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';

export default function NewTask() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const { userName } = useUser();
    const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        priority: '',
        type_id: '',
        notes: ''
    });

    useEffect(() => {
        fetchTypes();
        const saved = localStorage.getItem('draft_task');
        if (saved) {
            try {
                setFormData(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }
    }, []);

    const fetchTypes = async () => {
        try {
            const token = localStorage.getItem('bugbee_token');
            const res = await fetch('/api/todo-types', {
                headers: { 'x-bugbee-token': token || '' }
            });

            if (res.ok) {
                const data = await res.json();
                setTypes(data);
            }
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const handleCreateType = async () => {
        if (!newTypeName.trim()) return;

        try {
            const token = localStorage.getItem('bugbee_token');
            const res = await fetch('/api/todo-types', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': token || ''
                },
                body: JSON.stringify({
                    name: newTypeName.trim(),
                    actor_name: userName || 'Anonymous'
                })
            });

            if (res.ok) {
                const newType = await res.json();
                setTypes([...types, newType]);
                setFormData({ ...formData, type_id: newType.id });
                setNewTypeName('');
                setShowNewTypeInput(false);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create type');
            }
        } catch (error) {
            console.error('Error creating type:', error);
            alert('Failed to create type');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newData = { ...formData, [name]: value };
        setFormData(newData);
        localStorage.setItem('draft_task', JSON.stringify(newData));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!userName.trim()) {
            alert('Please enter your name in the header to create a task');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || '',
                },
                body: JSON.stringify({
                    title: formData.title,
                    priority: formData.priority || null,
                    type_id: formData.type_id || null,
                    notes: formData.notes || null,
                    created_by_name: userName
                }),
            });

            if (!res.ok) throw new Error('Failed to submit');

            localStorage.removeItem('draft_task');
            router.push('/');
        } catch (err) {
            console.error(err);
            alert('Error creating task');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Create New Task</h1>
                <p className="text-slate-400">Add a new task to your to-do list.</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-6">
                <div>
                    <label className="label">Title</label>
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder="e.g. Update documentation for API endpoints"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Priority</label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">No Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Type</label>
                        {!showNewTypeInput ? (
                            <div className="flex gap-2">
                                <select
                                    name="type_id"
                                    value={formData.type_id}
                                    onChange={handleChange}
                                    className="input flex-1"
                                >
                                    <option value="">No Type</option>
                                    {types.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewTypeInput(true)}
                                    className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-all text-sm whitespace-nowrap"
                                >
                                    + New
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    placeholder="Type name"
                                    className="input flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleCreateType();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateType}
                                    className="px-3 py-2 bg-green-500/10 text-green-400 rounded hover:bg-green-500 hover:text-white transition-all text-sm"
                                >
                                    ✓
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewTypeInput(false);
                                        setNewTypeName('');
                                    }}
                                    className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-all text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="label">Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="input h-32"
                        placeholder="Add any additional details (optional)"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn btn-primary w-32">
                        {submitting ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
