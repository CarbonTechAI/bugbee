'use client';

import { useState, useEffect } from 'react';
import { TeamWorkload } from '../components/TeamWorkload';

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('bugbee_token')
      : null;
  return {
    'Content-Type': 'application/json',
    'x-bugbee-token': token || '',
  };
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
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newMember),
      });

      if (res.ok) {
        setNewMember({ name: '', email: '', role: 'developer' });
        setShowAddModal(false);
        fetchMembers();
      }
    } catch {
      // silently fail
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/team-members/${member.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !member.is_active }),
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div>
      {/* Page Title */}
      <h1 className="text-2xl font-semibold text-slate-100 mb-6">Team &amp; Workload</h1>

      {/* Workload Overview */}
      <section className="mb-8">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">
          Workload
        </h2>
        <TeamWorkload />
      </section>

      {/* Team Members List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Team Members
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white px-4 py-2 rounded-md transition-colors duration-75"
          >
            Add Member
          </button>
        </div>

        {loading ? (
          <div className="space-y-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center px-3 py-2 gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-700" />
                <div className="flex-1 h-4 bg-slate-700 rounded" />
                <div className="w-16 h-4 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left p-3 text-xs font-medium uppercase tracking-wide text-slate-400">Name</th>
                  <th className="text-left p-3 text-xs font-medium uppercase tracking-wide text-slate-400">Email</th>
                  <th className="text-left p-3 text-xs font-medium uppercase tracking-wide text-slate-400">Role</th>
                  <th className="text-left p-3 text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
                  <th className="text-right p-3 text-xs font-medium uppercase tracking-wide text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className={`border-t border-slate-700 ${!member.is_active ? 'opacity-50' : ''}`}
                  >
                    <td className="p-3 text-sm font-medium text-slate-100">{member.name}</td>
                    <td className="p-3 text-sm text-slate-400">{member.email || '—'}</td>
                    <td className="p-3 text-sm text-slate-300 capitalize">{member.role}</td>
                    <td className="p-3">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                          member.is_active
                            ? 'text-green-400 bg-green-500/10'
                            : 'text-slate-400 bg-slate-400/10'
                        }`}
                      >
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleActive(member)}
                        className="text-sm text-slate-400 hover:text-slate-200 transition-colors duration-75"
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

      {/* Add Member Modal */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-md rounded-xl bg-slate-800 border border-slate-700 shadow-[0_16px_48px_rgba(0,0,0,0.50)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-sm font-medium text-slate-100">Add Team Member</h3>
            </div>
            <form onSubmit={handleAddMember} className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                  Role
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                >
                  <option value="founder">Founder</option>
                  <option value="developer">Developer</option>
                  <option value="operations">Operations</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors duration-75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors duration-75"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
