'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '../../components/FileUploader';
import { useUser } from '../../context/UserContext';

export default function ReportFeature() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const { userName } = useUser();
    const [formData, setFormData] = useState({
        title: '',
        priority: 'important',
        description: '',
        requester_email: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('draft_feature');
        if (saved) {
            try {
                setFormData(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newData = { ...formData, [name]: value };
        setFormData(newData);
        localStorage.setItem('draft_feature', JSON.stringify(newData));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!userName.trim()) {
            alert('Please enter your name in the header to request a feature');
            return;
        }

        setSubmitting(true);

        try {
            // 1. Create Feature
            const res = await fetch('/api/features', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || '',
                },
                body: JSON.stringify({ ...formData, requester_name: userName }),
            });

            if (!res.ok) throw new Error('Failed to submit');
            const data = await res.json();
            const featureId = data.id;

            // 2. Upload Files if any
            if (files.length > 0 && featureId) {
                await Promise.all(
                    files.map(async (file) => {
                        const formData = new FormData();
                        formData.append('file', file);
                        await fetch(`/api/features/${featureId}/attachments`, {
                            method: 'POST',
                            headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' },
                            body: formData,
                        });
                    })
                );
            }

            localStorage.removeItem('draft_feature');
            router.push('/');
        } catch (err) {
            console.error(err);
            alert('Error submitting feature');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Request a Feature</h1>
                <p className="text-slate-400">Have an idea? Tell us about it.</p>
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
                        placeholder="e.g. Add Dark Mode"
                    />
                </div>

                <div>
                    <label className="label">Priority</label>
                    <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="input"
                        required
                    >
                        <option value="critical">Critical (Cannot work without)</option>
                        <option value="important">Important (Need this soon)</option>
                        <option value="nice">Nice to Have (Someday)</option>
                    </select>
                </div>

                <div>
                    <label className="label">Description / Use Case</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="input h-48"
                        placeholder="Describe the feature and why it's needed..."
                    />
                </div>

                <div>
                    <FileUploader onFilesChange={setFiles} />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                    <div>
                        <label className="label">Your Email (Optional)</label>
                        <input
                            name="requester_email"
                            value={formData.requester_email}
                            onChange={handleChange}
                            type="email"
                            className="input"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn btn-primary w-32">
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
}
