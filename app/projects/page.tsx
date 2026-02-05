'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProjectCard from '@/app/components/ProjectCard';
import type { Project, Module } from '@/app/types';
import { MODULES } from '@/app/types';

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

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newModule, setNewModule] = useState('');
  const [newColor, setNewColor] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects', { headers: authHeaders() });
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          module: newModule || null,
          color: newColor.trim() || null,
        }),
      });
      if (res.ok) {
        setNewName('');
        setNewDescription('');
        setNewModule('');
        setNewColor('');
        setShowCreateForm(false);
        fetchProjects();
      }
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-100 mb-6">Projects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg p-4 bg-slate-800 border border-slate-700 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-700 rounded w-full mb-3" />
              <div className="h-1 bg-slate-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Projects</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white px-4 py-2 rounded-md transition-colors duration-75"
        >
          Create Project
        </button>
      </div>

      {/* Create Form (inline) */}
      {showCreateForm && (
        <div className="rounded-lg p-4 bg-slate-800 border border-slate-700 mb-6">
          <h3 className="text-sm font-medium text-slate-100 mb-4">New Project</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75 resize-none"
              />
            </div>

            <div className="flex gap-4">
              {/* Module */}
              <div className="flex-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                  Module
                </label>
                <select
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                >
                  <option value="">None</option>
                  {MODULES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div className="flex-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-75"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors duration-75"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <p className="text-sm text-slate-100 mb-1">No projects yet.</p>
          <p className="text-xs text-slate-500 mb-4">
            Projects help you group related work items together.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors duration-75"
          >
            Create Project
          </button>
        </div>
      )}
    </div>
  );
}
