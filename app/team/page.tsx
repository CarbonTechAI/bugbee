'use client';

import { useState, useEffect } from 'react';
import { TeamWorkload } from '../components/TeamWorkload';
import NavWithModal from '../components/NavWithModal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface TeamMember {
    id: string;
    name: string;
    email: string | null;
    role: string;
    avatar_url: string | null;
    is_active: boolean;
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'developer' });

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/team-members?active=false', {
                headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (error) {
            console.error('Failed to fetch team members', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/team-members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify(newMember)
            });

            if (res.ok) {
                setNewMember({ name: '', email: '', role: 'developer' });
                setShowAddModal(false);
                fetchMembers();
            }
        } catch (error) {
            console.error('Failed to add team member', error);
        }
    };

    const handleToggleActive = async (member: TeamMember) => {
        try {
            const res = await fetch(`/api/team-members/${member.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-bugbee-token': localStorage.getItem('bugbee_token') || ''
                },
                body: JSON.stringify({ is_active: !member.is_active })
            });

            if (res.ok) {
                fetchMembers();
            }
        } catch (error) {
            console.error('Failed to update team member', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <NavWithModal />
            
            <main className="max-w-7xl mx-auto p-6">
                {/* Workload Overview */}
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Team Workload</h2>
                    <TeamWorkload />
                </section>

                {/* Team Members List */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Team Members</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Member
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-slate-400">Loading...</div>
                    ) : (
                        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium text-slate-300">Name</th>
                                        <th className="text-left p-3 text-sm font-medium text-slate-300">Email</th>
                                        <th className="text-left p-3 text-sm font-medium text-slate-300">Role</th>
                                        <th className="text-left p-3 text-sm font-medium text-slate-300">Status</th>
                                        <th className="text-right p-3 text-sm font-medium text-slate-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.id} className={`border-t border-slate-700 ${!member.is_active ? 'opacity-50' : ''}`}>
                                            <td className="p-3 font-medium">{member.name}</td>
                                            <td className="p-3 text-slate-400">{member.email || '—'}</td>
                                            <td className="p-3">
                                                <span className="capitalize text-slate-300">{member.role}</span>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${member.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                    {member.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => handleToggleActive(member)}
                                                    className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
                                                >
                                                    {member.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Add Team Member</h3>
                        <form onSubmit={handleAddMember}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input w-full"
                                        value={newMember.name}
                                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="input w-full"
                                        value={newMember.email}
                                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                                    <select
                                        className="input w-full"
                                        value={newMember.role}
                                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                    >
                                        <option value="founder">Founder</option>
                                        <option value="developer">Developer</option>
                                        <option value="operations">Operations</option>
                                        <option value="support">Support</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn bg-slate-700 hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn bg-indigo-500 hover:bg-indigo-600"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
