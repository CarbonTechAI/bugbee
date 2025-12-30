'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Loader2, Paperclip } from 'lucide-react';
import clsx from 'clsx';

interface FileUploaderProps {
    onFilesChange: (files: File[]) => void;
    title?: string;
}

export default function FileUploader({ onFilesChange, title = 'Attachments' }: FileUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const handleFileSelect = (newFiles: FileList | null) => {
        if (!newFiles) return;
        const validFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Sync with parent
    useEffect(() => {
        onFilesChange(files);
    }, [files, onFilesChange]);

    // Paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData?.files) {
                const pastedFiles = e.clipboardData.files;
                handleFileSelect(pastedFiles);
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    return (
        <div
            className="card border-dashed border-2 border-slate-700 bg-slate-900/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-slate-400" />
                    {title}
                </h3>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        multiple
                    />
                    <button className="btn btn-secondary text-xs flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Add Images
                    </button>
                </div>
            </div>

            {files.length === 0 && (
                <div className="text-center text-slate-500 py-8 text-sm">
                    Paste images (Ctrl+V) or drag & drop here.
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                {files.map((file, idx) => (
                    <div key={idx} className="relative group bg-slate-800 rounded overflow-hidden border border-slate-700">
                        <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setViewingImage(URL.createObjectURL(file))}
                        />
                        <button
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-red-500 transition-colors"
                            type="button"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 text-[10px] text-white truncate">
                            {file.name}
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
