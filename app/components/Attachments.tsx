'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Image as ImageIcon, X, Upload, Loader2, Paperclip } from 'lucide-react';
import clsx from 'clsx';

import { useUser } from '../context/UserContext';

interface Attachment {
    id: string;
    file_name: string;
    signedUrl: string; // The presigned URL from the API
    created_at: string;
    size_bytes: number;
}

export default function Attachments({ itemId, itemType = 'bug', readOnly = false }: { itemId: string; itemType?: 'bug' | 'feature'; readOnly?: boolean }) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const { userName } = useUser();

    const fetchAttachments = useCallback(async () => {
        try {
            const token = localStorage.getItem('bugbee_token');
            const endpoint = itemType === 'bug' ? 'bugs' : 'features';
            const res = await fetch(`/api/${endpoint}/${itemId}/attachments`, {
                headers: { 'x-bugbee-token': token || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setAttachments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [itemId, itemType]);

    useEffect(() => {
        fetchAttachments();
    }, [fetchAttachments]);

    const handleUpload = async (file: File) => {
        if (!file || readOnly) return;
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('reporter_name', userName);

        try {
            const token = localStorage.getItem('bugbee_token');
            const endpoint = itemType === 'bug' ? 'bugs' : 'features';
            const res = await fetch(`/api/${endpoint}/${itemId}/attachments`, {
                method: 'POST',
                headers: { 'x-bugbee-token': token || '' },
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            // Refresh list
            await fetchAttachments();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId: string) => {
        if (readOnly) return;
        if (!confirm('Are you sure you want to delete this attachment?')) return;

        try {
            const token = localStorage.getItem('bugbee_token');
            const endpoint = itemType === 'bug' ? 'bugs' : 'features';
            const res = await fetch(`/api/${endpoint}/${itemId}/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: { 'x-bugbee-token': token || '' }
            });

            if (res.ok) {
                setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            } else {
                alert('Failed to delete attachment');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData?.files) {
                const file = e.clipboardData.files[0];
                if (file && file.type.startsWith('image/')) {
                    e.preventDefault(); // Prevent pasting into text inputs if that was the target? 
                    // To be safe, maybe only upload if we aren't focused on a text input...
                    // But "Paste image anywhere" was requested.
                    // Let's check if the active element is NOT a text input/textarea.
                    const activeTag = document.activeElement?.tagName.toLowerCase();
                    if (activeTag === 'input' || activeTag === 'textarea') return;

                    handleUpload(file);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [readOnly, itemId, itemType]);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                handleUpload(file);
            }
        }
    };

    return (
        <div
            className={clsx(
                "card border-dashed border-2 bg-slate-900/30",
                readOnly ? "border-transparent px-0 bg-transparent" : "border-slate-700"
            )}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={onDrop}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-slate-400" />
                    Attachments
                </h3>
                {!readOnly && (
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                            disabled={uploading}
                        />
                        <button className="btn btn-secondary text-xs flex items-center gap-2" disabled={uploading}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? 'Uploading...' : 'Upload Image'}
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

            {attachments.length === 0 && !loading && (
                <div className="text-center text-slate-500 py-8 text-sm">
                    {readOnly ? 'No attachments.' : 'No attachments yet. Paste an image (Ctrl+V) or drag & drop here.'}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {attachments.map(att => (
                    <div key={att.id} className="relative group bg-slate-800 rounded overflow-hidden border border-slate-700 flex flex-col">
                        {!readOnly && (
                            <button
                                onClick={() => handleDelete(att.id)}
                                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <img
                            src={att.signedUrl}
                            alt={att.file_name}
                            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setViewingImage(att.signedUrl)}
                        />
                        <div className="p-2 text-[10px] text-slate-300 truncate border-t border-slate-700 bg-slate-900/30">
                            {att.file_name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setViewingImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-red-400"
                        onClick={() => setViewingImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={viewingImage}
                        className="max-w-full max-h-[90vh] rounded shadow-2xl"
                        alt="Full size"
                    />
                </div>
            )}
        </div>
    );
}
