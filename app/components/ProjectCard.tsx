'use client';

import type { Project, Module } from '@/app/types';
import ModuleBadge from './ModuleBadge';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const itemCount = project.item_count ?? 0;
  const completedCount = project.completed_count ?? 0;
  const progress = itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="rounded-lg p-4 bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors duration-75 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-100 truncate">
          {project.name}
        </h3>
        {project.module && <ModuleBadge module={project.module as Module} />}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
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
  );
}
