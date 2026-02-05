'use client';

import type { Module } from '@/app/types';

const displayNames: Record<Module, string> = {
  receptionbee: 'Reception',
  recruitbee: 'Recruit',
  nurturebee: 'Nurture',
  pulsebee: 'Pulse',
  beesuite_web: 'BeeSuite',
  marketing: 'Marketing',
  sales: 'Sales',
  operations: 'Ops',
  general: 'General',
};

export default function ModuleBadge({ module }: { module: Module }) {
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-slate-400 bg-slate-700/50">
      {displayNames[module] || module}
    </span>
  );
}
