'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportBug() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/bugs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || '',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to submit');

            router.push('/');
        } catch (err) {
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
                    <input name="title" required className="input" placeholder="e.g. Login page crashes on submit" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Severity</label>
                        <select name="severity" className="input" required>
                            <option value="critical">Critical (Blocker)</option>
                            <option value="high">High (Major Feature)</option>
                            <option value="medium">Medium (User Impact)</option>
                            <option value="low">Low (Cosmetic/Minor)</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Environment</label>
                        <input name="environment" className="input" placeholder="e.g. Chrome, Mac, Staging" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Expected Result</label>
                        <textarea name="expected_result" required className="input h-24" placeholder="What should have happened?" />
                    </div>
                    <div>
                        <label className="label">Actual Result</label>
                        <textarea name="actual_result" required className="input h-24" placeholder="What happened instead?" />
                    </div>
                </div>

                <div>
                    <label className="label">Reproduction Steps</label>
                    <textarea name="reproduction_steps" required className="input h-32 font-mono text-sm" placeholder="1. Go to page X&#10;2. Click button Y..." />
                </div>

                <div>
                    <label className="label">Console Logs / Errors</label>
                    <textarea name="console_logs" className="input h-32 font-mono text-xs text-slate-400" placeholder="Paste any stack traces or errors here..." />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                    <div>
                        <label className="label">Your Name (Optional)</label>
                        <input name="reporter_name" className="input" />
                    </div>
                    <div>
                        <label className="label">Your Email (Optional)</label>
                        <input name="reporter_email" type="email" className="input" />
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
