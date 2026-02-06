'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import WorkItemRow from '@/app/components/WorkItemRow';
import WorkItemDetail from '@/app/components/WorkItemDetail';
import ModuleBadge from '@/app/components/ModuleBadge';
import type { Project, WorkItem, Module } from '@/app/types';

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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Slide-over state
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data: Project = await res.json();
        setProject(data);
      }
    } catch {
      // silently fail
    }
  }, [projectId]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/work-items?project_id=${projectId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data: WorkItem[] = await res.json();
        setItems(data);
      }
    } catch {
      // silently fail
    }
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchItems()]);
      setLoading(false);
    };
    load();
  }, [fetchProject, fetchItems]);

  const handleItemClick = (item: WorkItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleItemUpdate = (updated: WorkItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
    setSelectedItem(updated);
    // Re-fetch project to update counts
    fetchProject();
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedItem(null);
  };

  // Computed progress
  const itemCount = project?.item_count ?? 0;
  const completedCount = project?.completed_count ?? 0;
  const progress = itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="animate-pulse mb-6">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-700 rounded w-2/3" />
        </div>
        <div className="space-y-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center px-3 py-2 gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              <div className="flex-1 h-4 bg-slate-700 rounded" />
              <div className="w-10 h-5 bg-slate-700 rounded-full" />
              <div className="w-16 h-5 bg-slate-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-sm text-slate-100 mb-1">Project not found.</p>
        <button
          onClick={() => router.push('/projects')}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors duration-75 mt-2"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => router.push('/projects')}
        className="text-xs text-slate-400 hover:text-slate-200 transition-colors duration-75 mb-4"
      >
        ← Projects
      </button>

      {/* Project Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-slate-100">{project.name}</h1>
          {project.module && <ModuleBadge module={project.module as Module} />}
        </div>
        {project.description && (
          <p className="text-sm text-slate-300 mb-3">{project.description}</p>
        )}

        {/* Progress bar */}
        <div className="max-w-md space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{completedCount} of {itemCount} done</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Work Items · {items.length}
        </span>
      </div>

      {/* Work Items List */}
      {items.length > 0 ? (
        <div className="space-y-0.5">
          {items.map((item) => (
            <WorkItemRow
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
          <p className="text-sm text-slate-100 mb-1">No work items in this project.</p>
          <p className="text-xs text-slate-500">
            Assign work items to this project from the item detail panel.
          </p>
        </div>
      )}

      {/* Work Item Detail Slide-over */}
      <WorkItemDetail
        item={selectedItem}
        open={detailOpen}
        onClose={handleDetailClose}
        onUpdate={handleItemUpdate}
      />
    </div>
  );
}
