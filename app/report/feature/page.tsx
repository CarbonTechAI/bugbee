'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportFeature() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/features', {
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
                    <input name="title" required className="input" placeholder="e.g. Add Dark Mode" />
                </div>

                <div>
                    <label className="label">Priority</label>
                    <select name="priority" className="input" required>
                        <option value="critical">Critical (Cannot work without)</option>
                        <option value="important">Important (Need this soon)</option>
                        <option value="nice">Nice to Have (Someday)</option>
                    </select>
                </div>

                <div>
                    <label className="label">Description / Use Case</label>
                    <textarea name="description" required className="input h-48" placeholder="Describe the feature and why it's needed..." />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                    <div>
                        <label className="label">Your Name (Optional)</label>
                        <input name="requester_name" className="input" />
                    </div>
                    <div>
                        <label className="label">Your Email (Optional)</label>
                        <input name="requester_email" type="email" className="input" />
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
