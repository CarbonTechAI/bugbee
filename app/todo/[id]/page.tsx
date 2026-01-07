'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Trash2,
    Paperclip,
    FileIcon,
    Download,
    Clock,
    User
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { use } from 'react';

export default function TodoItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { userName } = useUser();

    // State
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [text, setText] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Task');
    const [isCompleted, setIsCompleted] = useState(false);

    // Attachments
    const [attachments, setAttachments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchItemDetails();
    }, [id]);

    const fetchItemDetails = async () => {
        try {
            const res = await fetch(`/api/todos/items/${id}`, {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setItem(data);
                setText(data.text);
                setDescription(data.description || '');
                setType(data.type || 'Task');
                setIsCompleted(data.is_completed);

                // Fetch attachments
                fetchAttachments();
            }
        } catch (error) {
            console.error('Failed to fetch item', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttachments = async () => {
        try {
            const res = await fetch(`/api/todos/items/${id}/attachments`, {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setAttachments(data);
            }
        } catch (error) {
            console.error('Failed to fetch attachments', error);
        }
    };

    const handleSave = async () => {
        if (!userName) {
            alert('Please enter your name');
            return;
        }
        setSaving(true);
        try {
            await fetch(`/api/todos/items/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({
                    text,
                    description,
                    type,
                    is_completed: isCompleted,
                    actor_name: userName
                })
            });
            router.push('/');
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!userName) {
            alert('Please enter your name');
            return;
        }
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await fetch(`/api/todos/items/${id}?actor_name=${encodeURIComponent(userName)}`, {
                method: 'DELETE',
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            router.push('/');
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userName) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('actor_name', userName);

        try {
            const res = await fetch(`/api/todos/items/${id}/attachments`, {
                method: 'POST',
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' },
                body: formData
            });

            if (res.ok) {
                fetchAttachments();
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Upload error', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Inbox
                </button>

                <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <input
                                className="bg-transparent text-2xl font-bold text-white w-full border-none focus:ring-0 placeholder-slate-600 px-0"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Task Title"
                            />
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <User size={14} />
                                    {item.created_by_name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md px-3 py-1.5 focus:border-indigo-500 outline-none"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="Task">Task</option>
                                <option value="Bug">Bug</option>
                                <option value="Feature">Feature</option>
                                <option value="Onboarding">Onboarding</option>
                            </select>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                                <textarea
                                    className="w-full h-64 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Add details, steps, or context..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Attachments Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-slate-400">Attachments</h3>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                                    >
                                        <Paperclip size={14} />
                                        {uploading ? 'Uploading...' : 'Add File'}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>

                                {attachments.length === 0 ? (
                                    <div className="border-2 border-dashed border-slate-800 rounded-lg p-6 text-center text-sm text-slate-600">
                                        No files attached.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {attachments.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="bg-slate-700 p-2 rounded">
                                                        <FileIcon size={16} className="text-slate-400" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm text-slate-200 truncate">{file.file_name}</p>
                                                        <p className="text-xs text-slate-500">{(file.size_bytes / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/api/todos/items/${id}/attachments/${file.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-500 hover:text-white p-2"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar / Actions */}
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <label className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white select-none">
                                    <input
                                        type="checkbox"
                                        checked={isCompleted}
                                        onChange={(e) => setIsCompleted(e.target.checked)}
                                        className="rounded border-slate-600 bg-slate-700 w-5 h-5 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <span className={isCompleted ? "line-through text-slate-500" : ""}>Mark as Complete</span>
                                </label>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full btn btn-primary bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 py-2.5"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>

                            <button
                                onClick={handleDelete}
                                className="w-full btn btn-ghost text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center justify-center gap-2 py-2.5"
                            >
                                <Trash2 size={18} />
                                Delete Task
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
