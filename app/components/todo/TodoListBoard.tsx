'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import TodoListCard from './TodoListCard';
import { useUser } from '../../context/UserContext';

export default function TodoListBoard() {
    const { userName } = useUser();
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');

    const fetchLists = async () => {
        try {
            const res = await fetch('/api/todos', {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setLists(data);
            }
        } catch (error) {
            console.error('Failed to fetch todo lists', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        if (!userName) {
            alert('Please enter your name at the top of the page to create a list.');
            return;
        }

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    name: newListName,
                    actor_name: userName
                })
            });

            if (res.ok) {
                setNewListName('');
                setIsCreating(false);
                fetchLists();
            }
        } catch (error) {
            console.error('Failed to create list', error);
        }
    };

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-300">My Boards</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
                >
                    <Plus size={16} />
                    New List
                </button>
            </div>

            {/* Create List Modal/Inline */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Create New List</h3>
                        <form onSubmit={handleCreateList}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-400 mb-1">List Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="input w-full"
                                    placeholder="e.g. Q4 Objectives, Housekeeping..."
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary bg-indigo-500 hover:bg-indigo-600"
                                >
                                    Create List
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lists Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading lists...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {lists.map(list => (
                        <TodoListCard
                            key={list.id}
                            list={list}
                            onRefresh={fetchLists}
                        />
                    ))}

                    {lists.length === 0 && !isCreating && (
                        <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                            <h3 className="text-lg font-medium text-slate-400 mb-2">No lists yet</h3>
                            <p className="text-slate-500 mb-4">Create a task list to get started tracking your work.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="btn btn-outline border-slate-700 text-slate-300 hover:text-white"
                            >
                                <Plus size={16} className="mr-2" />
                                Create your first list
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
