'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '../../components/FileUploader';
import { useUser } from '../../context/UserContext';

export default function ReportBug() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const { userName } = useUser();
    const [formData, setFormData] = useState({
        title: '',
        severity: 'critical',
        environment: '',
        expected_result: '',
        actual_result: '',
        reproduction_steps: '',
        console_logs: '',
        reproduction_steps: '',
        console_logs: '',
        reporter_email: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('draft_bug');
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
        localStorage.setItem('draft_bug', JSON.stringify(newData));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!userName.trim()) {
            alert('Please enter your name in the header to report a bug');
            return;
        }

        setSubmitting(true);

        try {
            // 1. Create Bug
            const res = await fetch('/api/bugs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || '',
                },
                body: JSON.stringify({ ...formData, reporter_name: userName }),
            });

            if (!res.ok) throw new Error('Failed to submit');
            const data = await res.json();
            const bugId = data.id;

            // 2. Upload Files if any
            if (files.length > 0 && bugId) {
                await Promise.all(
                    files.map(async (file) => {
                        const formData = new FormData();
                        formData.append('file', file);
                        await fetch(`/api/bugs/${bugId}/attachments`, {
                            method: 'POST',
                            headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' },
                            body: formData,
                        });
                    })
                );
            }

            localStorage.removeItem('draft_bug');
            router.push('/');
        } catch (err) {
            console.error(err);
            alert('Error submitting bug');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Report a Bug</h1>
                <p className="text-slate-400">Found something broken? Let us know.</p>
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
                        placeholder="e.g. Login page crashes on submit"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Severity</label>
                        <select
                            name="severity"
                            value={formData.severity}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="critical">Critical (Blocker)</option>
                            <option value="high">High (Major Feature)</option>
                            <option value="medium">Medium (User Impact)</option>
                            <option value="low">Low (Cosmetic/Minor)</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Environment</label>
                        <input
                            name="environment"
                            value={formData.environment}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g. Chrome, Mac, Staging"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Expected Result</label>
                        <textarea
                            name="expected_result"
                            value={formData.expected_result}
                            onChange={handleChange}
                            required
                            className="input h-24"
                            placeholder="What should have happened?"
                        />
                    </div>
                    <div>
                        <label className="label">Actual Result</label>
                        <textarea
                            name="actual_result"
                            value={formData.actual_result}
                            onChange={handleChange}
                            required
                            className="input h-24"
                            placeholder="What happened instead?"
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Reproduction Steps</label>
                    <textarea
                        name="reproduction_steps"
                        value={formData.reproduction_steps}
                        onChange={handleChange}
                        required
                        className="input h-32 font-mono text-sm"
                        placeholder="1. Go to page X&#10;2. Click button Y..."
                    />
                </div>

                <div>
                    <FileUploader onFilesChange={setFiles} />
                </div>

                <div>
                    <label className="label">Console Logs / Errors</label>
                    <textarea
                        name="console_logs"
                        value={formData.console_logs}
                        onChange={handleChange}
                        className="input h-32 font-mono text-xs text-slate-400"
                        placeholder="Paste any stack traces or errors here..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                    <div>
                        <label className="label">Your Email (Optional)</label>
                        <input
                            name="reporter_email"
                            value={formData.reporter_email}
                            onChange={handleChange}
                            type="email"
                            className="input"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn btn-primary w-32">
                        {submitting ? 'Submitting...' : 'Submit Bug'}
                    </button>
                </div>
            </form>
        </div>
    );
}
