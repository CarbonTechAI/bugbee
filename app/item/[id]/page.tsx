'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import StatusBadge from '../../components/StatusBadge';
import Attachments from '../../components/Attachments';
import { useUser } from '../../context/UserContext';
import { Copy, ThumbsUp } from 'lucide-react';
import clsx from 'clsx';

export default function ItemDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params.id as string;
    const type = searchParams.get('type') as 'bug' | 'feature';

    const [item, setItem] = useState<any>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [updating, setUpdating] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [hasUnread, setHasUnread] = useState(false);
    const [latestCommentDate, setLatestCommentDate] = useState<string | null>(null);
    const { userName } = useUser();


    useEffect(() => {
        if (id && type) fetchItem();
    }, [id, type]);

    const fetchItem = async () => {
        try {
            const res = await fetch(`/api/items/${id}?type=${type}`, {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.status === 404) { alert('Item not found'); router.push('/'); return; }
            const data = await res.json();
            setItem(data.item);
            setEditData(data.item);
            setActivity(data.activity);

            // Calculate unread status
            const latestComment = data.activity.find((a: any) => a.action === 'comment');
            if (latestComment) {
                setLatestCommentDate(latestComment.created_at);
                const lastViewed = localStorage.getItem(`bugbee_viewed_${id}`);
                if (!lastViewed || new Date(latestComment.created_at) > new Date(lastViewed)) {
                    setHasUnread(true);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = () => {
        if (!latestCommentDate) return;
        // Use latest comment date to be precise, or just NOW to clear everything current
        localStorage.setItem(`bugbee_viewed_${id}`, new Date().toISOString());
        setHasUnread(false);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const handleEditSubmit = async () => {
        if (!userName.trim()) {
            alert('Please enter your name in the header to save changes');
            setUpdating(false);
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || '',
                },
                body: JSON.stringify({ ...editData, type, user_name: userName }),
            });

            if (!res.ok) throw new Error('Failed to update');

            setEditing(false);
            fetchItem();
        } catch (e) {
            alert('Error updating item');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdate = async (newStatus?: string) => {
        if (!userName.trim()) {
            alert('Please enter your name in the header to make changes');
            return;
        }

        setUpdating(true);
        try {
            const body: any = { type, note: comment, user_name: userName }; // Ideally parse user from token or prompt, but v1 is anon
            if (newStatus) body.status = newStatus;
            else if (!comment) return; // Don't submit empty if no status change

            const res = await fetch(`/api/items/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || '',
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to update');

            setComment('');
            fetchItem();
        } catch (e) {
            alert('Error updating item');
        } finally {
            setUpdating(false);
        }
    };

    const copyMarkdown = () => {
        if (!item) return;
        const md = `## ${item.title}
**Status**: ${item.status} | **Severity**: ${item.severity || item.priority}
**ID**: ${item.id}

### Description
${item.actual_result ? `**Actual**: ${item.actual_result}
**Expected**: ${item.expected_result}

**Steps**:
${item.reproduction_steps}

**Environment**: ${item.environment || 'N/A'}

${item.console_logs ? `\`\`\`
${item.console_logs}
\`\`\`` : ''}
` : item.description}`;

        navigator.clipboard.writeText(md);
        alert('Markdown copied to clipboard!');
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (!item) return <div className="text-center py-10">Not Found</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span className="uppercase font-bold tracking-wider text-xs">{type}</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                        <h1 className="text-3xl font-bold">{item.title}</h1>
                        <div className="flex gap-2">
                            <StatusBadge status={item.status} />
                            <StatusBadge severity={item.severity || item.priority} />
                            {hasUnread && (
                                <button
                                    onClick={markAsRead}
                                    className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1 animate-pulse"
                                    title="Click to acknowledge updates"
                                >
                                    <ThumbsUp size={12} />
                                    New Comments
                                </button>
                            )}
                        </div>
                    </div>
                    {type === 'bug' && !editing && (
                        <div className="flex gap-2">
                            <button onClick={copyMarkdown} className="btn btn-secondary flex items-center gap-2 text-xs">
                                <Copy size={14} /> Copy MD
                            </button>
                            <button onClick={() => setEditing(true)} className="btn btn-secondary text-xs">Edit</button>
                        </div>
                    )}
                    {type === 'feature' && !editing && (
                        <button onClick={() => setEditing(true)} className="btn btn-secondary text-xs">Edit</button>
                    )}
                    {editing && (
                        <div className="flex gap-2">
                            <button onClick={() => { setEditing(false); setEditData(item); }} className="btn btn-secondary text-xs">Cancel</button>
                            <button onClick={handleEditSubmit} disabled={updating} className="btn btn-primary text-xs">
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="card space-y-4">
                    {editing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="label">Title</label>
                                <input name="title" value={editData.title} onChange={handleEditChange} className="input" />
                            </div>
                            {type === 'bug' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Severity</label>
                                            <select name="severity" value={editData.severity} onChange={handleEditChange} className="input">
                                                <option value="critical">Critical</option>
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Environment</label>
                                            <input name="environment" value={editData.environment || ''} onChange={handleEditChange} className="input" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Actual Result</label>
                                        <textarea name="actual_result" value={editData.actual_result} onChange={handleEditChange} className="input h-24" />
                                    </div>
                                    <div>
                                        <label className="label">Expected Result</label>
                                        <textarea name="expected_result" value={editData.expected_result} onChange={handleEditChange} className="input h-24" />
                                    </div>
                                    <div>
                                        <label className="label">Reproduction Steps</label>
                                        <textarea name="reproduction_steps" value={editData.reproduction_steps} onChange={handleEditChange} className="input h-32 font-mono text-sm" />
                                    </div>
                                    <div>
                                        <label className="label">Console Logs</label>
                                        <textarea name="console_logs" value={editData.console_logs || ''} onChange={handleEditChange} className="input h-24 font-mono text-xs" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="label">Priority</label>
                                        <select name="priority" value={editData.priority} onChange={handleEditChange} className="input">
                                            <option value="critical">Critical</option>
                                            <option value="important">Important</option>
                                            <option value="nice">Nice to Have</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Description</label>
                                        <textarea name="description" value={editData.description} onChange={handleEditChange} className="input h-48" />
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        type === 'bug' ? (
                            <>
                                <div>
                                    <label className="label">Actual Result</label>
                                    <div className="whitespace-pre-wrap text-sm">{item.actual_result}</div>
                                </div>
                                <div>
                                    <label className="label">Expected Result</label>
                                    <div className="whitespace-pre-wrap text-sm">{item.expected_result}</div>
                                </div>
                                <div>
                                    <label className="label">Reproduction Steps</label>
                                    <div className="whitespace-pre-wrap text-sm bg-slate-900/50 p-3 rounded font-mono">{item.reproduction_steps}</div>
                                </div>
                                {item.environment && (
                                    <div><label className="label">Environment</label><div className="text-sm">{item.environment}</div></div>
                                )}
                                {item.console_logs && (
                                    <div><label className="label">Console Logs</label><pre className="bg-black p-3 rounded text-xs whitespace-pre-wrap break-all">{item.console_logs}</pre></div>
                                )}
                            </>
                        ) : (
                            <div>
                                <label className="label">Description</label>
                                <div className="whitespace-pre-wrap text-sm">{item.description}</div>
                            </div>
                        )
                    )}
                </div>
                {(type === 'bug' || type === 'feature') && <Attachments itemId={id} itemType={type} readOnly={!editing} />}
            </div>

            <div className="space-y-6">
                <div className="card space-y-4">
                    <label className="label">Actions</label>
                    <select
                        className="input w-full"
                        value={item.status}
                        onChange={(e) => handleUpdate(e.target.value)}
                    >
                        {(type === 'bug'
                            ? ['open', 'needs_verification', 'reopened', 'closed_archived']
                            : ['open', 'planned', 'in_progress', 'shipped', 'closed']
                        ).map(s => {
                            let label = s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                            if (s === 'closed_archived' || s === 'closed') label = 'Closed & Archived';
                            return (
                                <option key={s} value={s}>
                                    {label}
                                </option>
                            );
                        })}
                    </select>
                    <div className="pt-4 border-t border-slate-700">
                        <textarea
                            className="input w-full h-24 mb-2"
                            placeholder="Add a comment..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                        <button onClick={() => handleUpdate()} disabled={!comment || updating || !userName} className="btn btn-primary w-full text-sm">
                            Post Comment
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-400 uppercase">Activity Log</h3>
                    <div className="space-y-4 relative pl-4 border-l-2 border-slate-800">
                        {activity.map((act) => (
                            <div key={act.id} className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-600 rounded-full border-2 border-slate-900"></div>
                                <div className="text-xs text-slate-500 mb-1">{new Date(act.created_at).toLocaleString()} by {act.actor_name || 'Anon'}</div>
                                <div className="text-sm">
                                    {act.action === 'created' && 'Created this item'}
                                    {act.action === 'status_changed' && <span className="text-blue-400">Changed status to {act.new_value}</span>}
                                    {act.action === 'comment' && <span className="italic">"{act.note}"</span>}
                                </div>
                                {act.note && act.action !== 'comment' && <div className="mt-1 text-xs text-slate-400 italic">"{act.note}"</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
