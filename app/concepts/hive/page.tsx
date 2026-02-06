'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, mockProjects, mockTeamMembers, type MockItem, type MockProject, type MockTeamMember } from '../mock-data';

// ─── API Integration ────────────────────────────────────────────────────────

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'x-bugbee-token': typeof window !== 'undefined' ? localStorage.getItem('bugbee_token') || '' : '',
});

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapWorkItemsToMockItems(apiItems: any[]): MockItem[] {
  return apiItems.map(item => ({
    id: item.id,
    title: item.title || '',
    kind: item.kind || 'task',
    status: item.status || 'inbox',
    priority: item.priority || 'normal',
    due_date: item.due_date || null,
    module: item.module || null,
    assigned_to: item.assignee?.name ? getInitials(item.assignee.name) : 'UN',
    assignee_name: item.assignee?.name || 'Unassigned',
    description: item.description || '',
    checklist: Array.isArray(item.checklist) ? item.checklist : [],
    notes: Array.isArray(item.notes) ? item.notes : [],
    comment_count: item.comment_count || 0,
  }));
}

function mapProjectsToMockProjects(apiProjects: any[]): MockProject[] {
  return apiProjects.map(p => ({
    id: p.id,
    name: p.name || '',
    key: p.module || p.name?.toLowerCase().replace(/\s+/g, '_') || '',
    description: p.description || '',
    color: p.color || '#94a3b8',
    icon: p.name?.[0]?.toUpperCase() || 'P',
  }));
}

function mapTeamToMockTeamMembers(apiTeam: any[]): MockTeamMember[] {
  const defaultColors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
  return apiTeam.map(m => {
    const url: string = m.avatar_url || '';
    const isImage = url.startsWith('data:') || url.startsWith('http') || url.startsWith('/');
    const isColor = url.startsWith('#');
    return {
      id: m.id,
      initials: getInitials(m.name || ''),
      name: m.name || '',
      role: m.role || 'Team Member',
      avatar_color: isColor ? url : defaultColors[Math.abs(hashString(m.name || '')) % defaultColors.length],
      avatar_image: isImage ? url : undefined,
    };
  });
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Utilities ───────────────────────────────────────────────────────────────

function isOverdue(item: MockItem) { return item.due_date ? new Date(item.due_date + 'T00:00:00') < new Date('2026-02-05T00:00:00') && item.status !== 'done' : false; }
function isDueToday(item: MockItem) { return item.due_date === '2026-02-05'; }
function fmtDate(d: string | null) { if (!d) return 'No date'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

// ─── Strata system ───────────────────────────────────────────────────────────

type Stratum = 'surface' | 'inflight' | 'backlog';

function classifyItem(item: MockItem): Stratum {
  if (item.priority === 'urgent' || isOverdue(item) || isDueToday(item)) return 'surface';
  if (item.status === 'in_progress' || item.status === 'in_review') return 'inflight';
  return 'backlog';
}

const strataConfig: Record<Stratum, {
  label: string; subtitle: string;
  glassOpacity: number; borderOpacity: number; blurPx: number; depth: number;
  accentColor: string; accentGlow: string; edgeColor: string;
}> = {
  surface: {
    label: 'Surface', subtitle: 'Urgent & overdue',
    glassOpacity: 0.04, borderOpacity: 0.10, blurPx: 20, depth: 0,
    accentColor: 'hsla(42,92%,60%,0.25)', accentGlow: 'hsla(42,92%,60%,0.08)',
    edgeColor: 'rgba(245,185,30,0.35)',
  },
  inflight: {
    label: 'In Flight', subtitle: 'Active work',
    glassOpacity: 0.03, borderOpacity: 0.07, blurPx: 16, depth: 1,
    accentColor: 'hsla(38,80%,52%,0.20)', accentGlow: 'hsla(38,80%,52%,0.06)',
    edgeColor: 'rgba(245,185,30,0.25)',
  },
  backlog: {
    label: 'Backlog', subtitle: 'Future work',
    glassOpacity: 0.02, borderOpacity: 0.04, blurPx: 12, depth: 2,
    accentColor: 'hsla(35,60%,45%,0.15)', accentGlow: 'hsla(35,60%,45%,0.04)',
    edgeColor: 'rgba(245,185,30,0.15)',
  },
};

const allKinds = ['bug', 'feature', 'task', 'idea'] as const;
const allPriorities = ['urgent', 'high', 'normal', 'low', 'none'] as const;
const allStatuses = ['inbox', 'todo', 'in_progress', 'in_review', 'done'] as const;
const allModules = Object.keys(moduleConfig);

const statusColumns: { key: MockItem['status']; label: string }[] = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'todo', label: 'Todo' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

// ─── MetaField helper ────────────────────────────────────────────────────────

function MF({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>{label}</div>{children}</div>);
}

// ─── ItemRow ─────────────────────────────────────────────────────────────────

function ItemRow({
  item, stratum, isHovered, isExpanded, isSelected, showDepth, onHover, onLeave, onClick, onExpand, onPromote, onDemote, onToggleChecklist, teamMembers: members,
}: {
  item: MockItem; stratum?: Stratum; isHovered: boolean; isExpanded: boolean; isSelected: boolean;
  showDepth: boolean;
  onHover: () => void; onLeave: () => void; onClick: () => void; onExpand: () => void;
  onPromote?: () => void; onDemote?: () => void;
  onToggleChecklist?: (checklistId: string) => void;
  teamMembers?: MockTeamMember[];
}) {
  const config = stratum ? strataConfig[stratum] : strataConfig.inflight;
  const depth = showDepth ? config.depth : 0;
  const assigneeMember = members?.find(m => m.initials === item.assigned_to);
  const completed = item.checklist.filter(c => c.completed).length;
  const total = item.checklist.length;

  return (
    <div
      className="hive-row"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        background: `rgba(255,255,255,${isHovered ? (showDepth ? config.glassOpacity + 0.015 : 0.055) : (showDepth ? config.glassOpacity : 0.03)})`,
        backdropFilter: `blur(${showDepth ? config.blurPx : 18}px)`,
        WebkitBackdropFilter: `blur(${showDepth ? config.blurPx : 18}px)`,
        border: `1px solid rgba(255,255,255,${isHovered ? (showDepth ? config.borderOpacity + 0.06 : 0.14) : (showDepth ? config.borderOpacity : 0.06)})`,
        boxShadow: isSelected
          ? `0 0 0 2px rgba(245,185,30,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`
          : isHovered
          ? `0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `inset 0 1px 0 rgba(255,255,255,${0.04 - depth * 0.01})`,
      }}
    >
      {/* Edge highlight on hover */}
      {showDepth && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 14,
          boxShadow: `
            inset 0 0 4px 1px ${config.edgeColor},
            inset 0 0 12px 2px ${config.edgeColor.replace(')', ',0.25)')},
            inset 0 0 28px 4px ${config.edgeColor.replace(')', ',0.10)')}
          `,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 400ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      )}

      {/* Compact row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', position: 'relative', zIndex: 1 }}>
        {/* Expand chevron */}
        <span
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="hive-chevron"
          style={{
            width: 18, height: 18, borderRadius: 0, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: 'transparent', color: 'rgba(255,255,255,0.35)',
            fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease, color 150ms',
          }}
        >&#9654;</span>

        {/* Priority bar */}
        <div style={{
          width: 4, height: 26, borderRadius: 2, flexShrink: 0,
          background: priorityConfig[item.priority].color,
          opacity: 0.9 - depth * 0.2,
        }} />

        {/* Kind badge */}
        <span style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          color: kindConfig[item.kind].color, minWidth: 48, flexShrink: 0,
          opacity: 1 - depth * 0.15,
        }}>{kindConfig[item.kind].label}</span>

        {/* Title */}
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 400,
          color: `rgba(255,255,255,${0.88 - depth * 0.14})`,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{item.title}</span>

        {/* Checklist fraction */}
        {total > 0 && (
          <span style={{ fontSize: 11, color: `rgba(255,255,255,${0.3 - depth * 0.06})`, flexShrink: 0 }}>
            {completed}/{total}
          </span>
        )}

        {/* Module */}
        {item.module && moduleConfig[item.module] && (
          <span style={{
            fontSize: 11, color: moduleConfig[item.module].color, flexShrink: 0,
            opacity: 0.55 - depth * 0.12,
          }}>{moduleConfig[item.module].label}</span>
        )}

        {/* Date */}
        <span style={{
          fontSize: 11, flexShrink: 0,
          color: isOverdue(item) ? 'rgba(239,68,68,0.8)' : isDueToday(item) ? 'rgba(245,158,11,0.7)' : `rgba(255,255,255,${0.32 - depth * 0.08})`,
        }}>{fmtDate(item.due_date)}</span>

        {/* Assignee */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: assigneeMember?.avatar_image
            ? `url(${assigneeMember.avatar_image}) center/cover no-repeat`
            : assigneeMember?.avatar_color || `rgba(255,255,255,${0.06 - depth * 0.015})`,
          border: assigneeMember ? 'none' : `1px solid rgba(255,255,255,${0.08 - depth * 0.02})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, color: '#fff', overflow: 'hidden',
          boxShadow: assigneeMember ? `0 1px 4px ${assigneeMember.avatar_color}40` : 'none',
        }}>{!assigneeMember?.avatar_image && item.assigned_to}</div>

        {/* Promote/Demote */}
        {showDepth && (onPromote || onDemote) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            {onPromote && (
              <button className="hive-promote" onClick={onPromote} style={{
                width: 22, height: 16, border: 'none', borderRadius: 4, cursor: 'pointer',
                background: 'rgba(245,185,30,0.08)', color: 'rgba(255,255,255,0.4)',
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
              }} title="Promote">&#9650;</button>
            )}
            {onDemote && (
              <button className="hive-demote" onClick={onDemote} style={{
                width: 22, height: 16, border: 'none', borderRadius: 4, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)',
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
              }} title="Demote">&#9660;</button>
            )}
          </div>
        )}
      </div>

      {/* Accordion expanded content */}
      {isExpanded && (
        <div style={{
          padding: '0 18px 16px 56px', position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          {/* Description */}
          {item.description && (
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)', margin: '12px 0 0', fontWeight: 300 }}>
              {item.description}
            </p>
          )}

          {/* Inline checklist */}
          {total > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(completed / total) * 100}%`, background: 'linear-gradient(90deg, rgba(245,185,30,0.5), rgba(245,185,30,0.25))', borderRadius: 2 }} />
              </div>
              {item.checklist.map((c) => (
                <div
                  key={c.id}
                  onClick={(e) => { e.stopPropagation(); onToggleChecklist?.(c.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.02)', marginBottom: 3,
                    cursor: onToggleChecklist ? 'pointer' : 'default',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={e => { if (onToggleChecklist) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: c.completed ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    background: c.completed ? 'rgba(16,185,129,0.18)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#10b981',
                    transition: 'all 180ms ease',
                  }}>{c.completed ? '\u2713' : ''}</div>
                  <span style={{ fontSize: 12, color: c.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)', textDecoration: c.completed ? 'line-through' : 'none', transition: 'all 180ms ease' }}>{c.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────

function KanbanCard({
  item, isHovered, isDragging, onHover, onLeave, onClick, onDragStart, onDragEnd, teamMembers: members,
}: {
  item: MockItem; isHovered: boolean; isDragging?: boolean;
  onHover: () => void; onLeave: () => void; onClick: () => void;
  onDragStart?: () => void; onDragEnd?: () => void;
  teamMembers?: MockTeamMember[];
}) {
  const kc = kindConfig[item.kind];
  const pc = priorityConfig[item.priority];
  const mc = item.module ? moduleConfig[item.module] : null;
  const assigneeMember = members?.find(m => m.initials === item.assigned_to);
  const completed = item.checklist.filter(c => c.completed).length;
  const total = item.checklist.length;

  return (
    <div
      className="hive-kanban-card"
      draggable
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      style={{
        position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'grab',
        flexShrink: 0,
        opacity: isDragging ? 0.4 : 1,
        background: isHovered ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid rgba(255,255,255,${isHovered ? 0.12 : 0.06})`,
        boxShadow: isHovered
          ? '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Priority color bar at top */}
      <div style={{ height: 3, background: pc.color, opacity: 0.7 }} />

      <div style={{ padding: '12px 14px 14px' }}>
        {/* Title */}
        <h4 style={{
          fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)',
          margin: '0 0 10px', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
        }}>{item.title}</h4>

        {/* Kind badge + Priority badge + Module */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '2px 6px', borderRadius: 4, color: kc.color, background: kc.bg,
          }}>{kc.label}</span>
          <span style={{
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '2px 6px', borderRadius: 4, color: pc.color, background: pc.bg,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: pc.color }} />
            {pc.label}
          </span>
          {mc && (
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: '0.03em',
              padding: '2px 6px', borderRadius: 4,
              color: mc.color, background: `${mc.color}12`,
              border: `1px solid ${mc.color}20`,
            }}>{mc.label}</span>
          )}
        </div>

        {/* Bottom: assignee + checklist */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: assigneeMember?.avatar_image
                ? `url(${assigneeMember.avatar_image}) center/cover no-repeat`
                : assigneeMember?.avatar_color || 'rgba(255,255,255,0.05)',
              border: assigneeMember ? 'none' : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 600, color: '#fff', overflow: 'hidden',
              boxShadow: assigneeMember ? `0 1px 4px ${assigneeMember.avatar_color}40` : 'none',
            }}>{!assigneeMember?.avatar_image && item.assigned_to}</div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.assignee_name}</span>
          </div>
          {total > 0 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{completed}/{total}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FilterDropdowns ─────────────────────────────────────────────────────────

type FilterCategory = 'kind' | 'priority' | 'status' | 'module';

function FilterDropdowns({
  openDropdown, setOpenDropdown,
  filterKinds, filterPriorities, filterStatuses, filterModules,
  toggleKind, togglePriority, toggleStatus, toggleModule,
  showStatuses, showModules,
}: {
  openDropdown: FilterCategory | null; setOpenDropdown: (v: FilterCategory | null) => void;
  filterKinds: Set<string>; filterPriorities: Set<string>; filterStatuses?: Set<string>; filterModules?: Set<string>;
  toggleKind: (k: string) => void; togglePriority: (p: string) => void;
  toggleStatus?: (s: string) => void; toggleModule?: (m: string) => void;
  showStatuses?: boolean; showModules?: boolean;
}) {
  const kindCount = allKinds.length - filterKinds.size;
  const prioCount = allPriorities.length - filterPriorities.size;
  const statusCount = filterStatuses ? allStatuses.length - filterStatuses.size : 0;
  const moduleCount = filterModules ? allModules.length - filterModules.size : 0;

  const categories: { key: FilterCategory; label: string; count: number; show: boolean }[] = [
    { key: 'kind', label: 'Type', count: kindCount, show: true },
    { key: 'priority', label: 'Priority', count: prioCount, show: true },
    { key: 'status', label: 'Status', count: statusCount, show: !!showStatuses },
    { key: 'module', label: 'Module', count: moduleCount, show: !!showModules },
  ];

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, position: 'relative', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {categories.filter(c => c.show).map((cat) => {
        const isOpen = openDropdown === cat.key;
        const hasFilters = cat.count > 0;
        return (
          <div key={cat.key} style={{ position: 'relative' }}>
            {/* Dropdown trigger button */}
            <button
              className="hive-chip"
              onClick={() => setOpenDropdown(isOpen ? null : cat.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                background: isOpen ? 'rgba(245,185,30,0.06)' : hasFilters ? 'rgba(245,185,30,0.04)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isOpen ? 'rgba(245,185,30,0.2)' : hasFilters ? 'rgba(245,185,30,0.1)' : 'rgba(255,255,255,0.07)'}`,
                color: isOpen ? 'rgba(245,185,30,0.9)' : hasFilters ? 'rgba(245,185,30,0.7)' : 'rgba(255,255,255,0.45)',
              }}
            >
              {cat.label}
              {hasFilters && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '0px 5px', borderRadius: 5,
                  background: 'rgba(245,185,30,0.12)', color: 'rgba(245,185,30,0.9)',
                  lineHeight: '16px',
                }}>{cat.count}</span>
              )}
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease', opacity: 0.5,
              }}>
                <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Popover */}
            {isOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                padding: '10px 12px', borderRadius: 12, minWidth: 180,
                background: 'rgba(15,22,38,0.98)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation: 'hive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards',
              }}>
                {cat.key === 'kind' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {allKinds.map((k) => {
                      const active = filterKinds.has(k);
                      const kc = kindConfig[k];
                      return (
                        <div key={k} className="hive-chip" onClick={() => toggleKind(k)} style={{
                          padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: active ? kc.bg : 'transparent',
                          color: active ? kc.color : 'rgba(255,255,255,0.35)',
                        }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                            border: `1px solid ${active ? kc.color + '55' : 'rgba(255,255,255,0.12)'}`,
                            background: active ? kc.color + '25' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: kc.color,
                          }}>{active ? '\u2713' : ''}</div>
                          {kc.label}
                        </div>
                      );
                    })}
                  </div>
                )}
                {cat.key === 'priority' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {allPriorities.map((p) => {
                      const active = filterPriorities.has(p);
                      const pc = priorityConfig[p];
                      return (
                        <div key={p} className="hive-chip" onClick={() => togglePriority(p)} style={{
                          padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: active ? pc.bg : 'transparent',
                          color: active ? pc.color : 'rgba(255,255,255,0.35)',
                        }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                            border: `1px solid ${active ? pc.color + '55' : 'rgba(255,255,255,0.12)'}`,
                            background: active ? pc.color + '25' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: pc.color,
                          }}>{active ? '\u2713' : ''}</div>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? pc.color : 'rgba(255,255,255,0.15)' }} />
                          {pc.label}
                        </div>
                      );
                    })}
                  </div>
                )}
                {cat.key === 'status' && filterStatuses && toggleStatus && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {allStatuses.map((s) => {
                      const active = filterStatuses.has(s);
                      const sc = statusConfig[s];
                      return (
                        <div key={s} className="hive-chip" onClick={() => toggleStatus(s)} style={{
                          padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: active ? `${sc.color}18` : 'transparent',
                          color: active ? sc.color : 'rgba(255,255,255,0.35)',
                        }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                            border: `1px solid ${active ? sc.color + '55' : 'rgba(255,255,255,0.12)'}`,
                            background: active ? sc.color + '25' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: sc.color,
                          }}>{active ? '\u2713' : ''}</div>
                          {sc.label}
                        </div>
                      );
                    })}
                  </div>
                )}
                {cat.key === 'module' && filterModules && toggleModule && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {allModules.map((m) => {
                      const active = filterModules.has(m);
                      const mc = moduleConfig[m];
                      return (
                        <div key={m} className="hive-chip" onClick={() => toggleModule(m)} style={{
                          padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: active ? `${mc.color}18` : 'transparent',
                          color: active ? mc.color : 'rgba(255,255,255,0.35)',
                        }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                            border: `1px solid ${active ? mc.color + '55' : 'rgba(255,255,255,0.12)'}`,
                            background: active ? mc.color + '25' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: mc.color,
                          }}>{active ? '\u2713' : ''}</div>
                          {mc.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Click-away listener */}
      {openDropdown && (
        <div onClick={() => setOpenDropdown(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      )}
    </div>
  );
}

// ─── Main: HiveConcept ───────────────────────────────────────────────────────

export default function HiveConcept() {
  type View = 'focus' | 'allwork' | 'kanban' | 'projects' | 'team';

  // Core state
  const [activeView, setActiveView] = useState<View>('focus');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [items, setItems] = useState<MockItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Stratum>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [scrollY, setScrollY] = useState(0);

  // Filter state
  const [filterKinds, setFilterKinds] = useState<Set<string>>(new Set(allKinds));
  const [filterPriorities, setFilterPriorities] = useState<Set<string>>(new Set(allPriorities));
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set(allStatuses));
  const [filterModules, setFilterModules] = useState<Set<string>>(new Set(allModules));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'priority' | 'due_date' | 'newest'>('priority');
  const [scopeModule, setScopeModule] = useState<string | null>(null);
  const [allWorkDropdown, setAllWorkDropdown] = useState<FilterCategory | null>(null);
  const [kanbanDropdown, setKanbanDropdown] = useState<FilterCategory | null>(null);

  // Quick Add state
  const [qaTitle, setQaTitle] = useState('');
  const [qaKind, setQaKind] = useState<MockItem['kind']>('task');
  const [qaPriority, setQaPriority] = useState<MockItem['priority']>('normal');
  const [qaModule, setQaModule] = useState<string>('general');
  const [qaDescription, setQaDescription] = useState('');
  const [qaChecklist, setQaChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [qaNewStep, setQaNewStep] = useState('');

  // Filter state for kanban
  const [kanbanFilterKinds, setKanbanFilterKinds] = useState<Set<string>>(new Set(allKinds));
  const [kanbanFilterPriorities, setKanbanFilterPriorities] = useState<Set<string>>(new Set(allPriorities));
  const [kanbanFilterModules, setKanbanFilterModules] = useState<Set<string>>(new Set(allModules));

  // Projects & Team state
  const [projects, setProjects] = useState<MockProject[]>([]);
  const [teamMembers, setTeamMembers] = useState<MockTeamMember[]>([]);
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  // Panel dropdown state (for interactive detail panel)
  const [panelDropdown, setPanelDropdown] = useState<'status' | 'priority' | 'assignee' | 'kind' | 'module' | 'due' | null>(null);

  // Team member editing state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('');
  const [editMemberColor, setEditMemberColor] = useState('');

  // View transition state
  const [viewTransition, setViewTransition] = useState(false);

  // Panel inline-add state
  const [newNoteText, setNewNoteText] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');

  // Kanban drag-and-drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const quickAddInputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(116);

  // ─── Fetch data from API on mount (fallback to mock data) ─────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [itemsRes, projectsRes, teamRes] = await Promise.all([
          fetch('/api/work-items', { headers: authHeaders() }),
          fetch('/api/projects', { headers: authHeaders() }),
          fetch('/api/team-members', { headers: authHeaders() }),
        ]);

        if (!itemsRes.ok || !projectsRes.ok || !teamRes.ok) {
          throw new Error('Failed to load data');
        }

        const [itemsData, projectsData, teamData] = await Promise.all([
          itemsRes.json(), projectsRes.json(), teamRes.json(),
        ]);

        setItems(mapWorkItemsToMockItems(itemsData));
        setProjects(mapProjectsToMockProjects(projectsData));
        setTeamMembers(mapTeamToMockTeamMembers(teamData));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        // Fallback to mock data so the UI still works without a running server
        setItems([...mockItems]);
        setProjects([...mockProjects]);
        setTeamMembers([...mockTeamMembers]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Strata helpers
  const getStratum = useCallback((item: MockItem): Stratum => overrides[item.id] || classifyItem(item), [overrides]);

  const filteredItems = items.filter((item) =>
    filterKinds.has(item.kind) && filterPriorities.has(item.priority)
  );

  const surfaceItems = filteredItems.filter((i) => getStratum(i) === 'surface');
  const inflightItems = filteredItems.filter((i) => getStratum(i) === 'inflight');
  const backlogItems = filteredItems.filter((i) => getStratum(i) === 'backlog');
  const focusVisibleItems = [...surfaceItems, ...inflightItems, ...backlogItems];

  // All Work filtering/sorting
  const allWorkItems = (() => {
    let result = items.filter((item) =>
      filterKinds.has(item.kind) &&
      filterPriorities.has(item.priority) &&
      filterStatuses.has(item.status) &&
      (scopeModule === null || item.module === scopeModule) &&
      filterModules.has(item.module || 'general')
    );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3, none: 4 };
    if (sortMode === 'priority') result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    else if (sortMode === 'due_date') result.sort((a, b) => (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1);
    else result.sort((a, b) => b.id.localeCompare(a.id));
    return result;
  })();

  // Kanban filtering
  const kanbanItems = items.filter((item) =>
    kanbanFilterKinds.has(item.kind) &&
    kanbanFilterPriorities.has(item.priority) &&
    kanbanFilterModules.has(item.module || 'general')
  );

  // Get visible items list for keyboard navigation
  const visibleItems = activeView === 'focus' ? focusVisibleItems : activeView === 'allwork' ? allWorkItems : [];

  // Update item helper (keeps selected and items in sync + persists to API)
  const updateItem = useCallback((id: string, updates: Partial<MockItem>) => {
    // Optimistic local update
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    setSelected(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);

    // Build API payload — map MockItem fields to API fields
    const apiPayload: Record<string, unknown> = {};
    if (updates.status !== undefined) apiPayload.status = updates.status;
    if (updates.priority !== undefined) apiPayload.priority = updates.priority;
    if (updates.kind !== undefined) apiPayload.kind = updates.kind;
    if (updates.checklist !== undefined) apiPayload.checklist = updates.checklist;
    if (updates.notes !== undefined) apiPayload.notes = updates.notes;
    if (updates.title !== undefined) apiPayload.title = updates.title;
    if (updates.description !== undefined) apiPayload.description = updates.description;
    if (updates.module !== undefined) apiPayload.module = updates.module;
    if (updates.due_date !== undefined) apiPayload.due_date = updates.due_date;
    // assigned_to in MockItem is initials — we need the team member UUID for the API
    // For assignee changes, find the matching team member by initials
    if (updates.assigned_to !== undefined) {
      const member = teamMembers.find(m => m.initials === updates.assigned_to);
      if (member) apiPayload.assigned_to = member.id;
    }

    // Only call API if there are fields to update
    if (Object.keys(apiPayload).length > 0) {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('bugbee_user_id') || '' : '';
      if (userId) apiPayload.actor_id = userId;

      fetch(`/api/work-items/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(apiPayload),
      }).catch(() => {
        console.error('Failed to save update');
      });
    }
  }, [teamMembers]);

  // Panel actions
  const openPanel = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closePanel = useCallback(() => { setPanelOpen(false); setPanelDropdown(null); setTimeout(() => setSelected(null), 400); }, []);

  // Strata actions
  const promote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'backlog' ? 'inflight' : current === 'inflight' ? 'surface' : 'surface';
    if (next === current) return;
    setOverrides((prev) => ({ ...prev, [item.id]: next }));
  }, [getStratum]);

  const demote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'surface' ? 'inflight' : current === 'inflight' ? 'backlog' : 'backlog';
    if (next === current) return;
    setOverrides((prev) => ({ ...prev, [item.id]: next }));
  }, [getStratum]);

  // Toggle helpers
  const toggle = (set: Set<string>, val: string): Set<string> => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  // Expand/collapse
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Get the stripped title for Quick Add (remove kind prefix)
  const getStrippedTitle = useCallback((title: string) => {
    const prefixes = ['bug:', 'feature:', 'idea:', 'task:', 'bug ', 'feature ', 'idea ', 'task '];
    const lower = title.toLowerCase();
    for (const p of prefixes) {
      if (lower.startsWith(p)) return title.slice(p.length).trim();
    }
    return title.trim();
  }, []);

  // Quick Add submit
  const submitQuickAdd = useCallback(() => {
    if (!qaTitle.trim()) return;
    const finalTitle = getStrippedTitle(qaTitle);
    if (!finalTitle) return;
    const tempId = `temp-${nextIdRef.current++}`;
    const newItem: MockItem = {
      id: tempId,
      title: finalTitle,
      kind: qaKind,
      status: 'inbox',
      priority: qaPriority,
      due_date: null,
      module: qaModule,
      assigned_to: 'AK',
      assignee_name: 'Alex Kilgo',
      description: qaDescription,
      checklist: qaChecklist,
      notes: [],
      comment_count: 0,
    };
    // Optimistic: add to local state immediately
    setItems(prev => [newItem, ...prev]);
    setQaTitle('');
    setQaKind('task');
    setQaPriority('normal');
    setQaModule('general');
    setQaDescription('');
    setQaChecklist([]);
    setQaNewStep('');
    setQuickAddOpen(false);

    // Persist to API
    const userId = typeof window !== 'undefined' ? localStorage.getItem('bugbee_user_id') || '' : '';
    fetch('/api/work-items', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: finalTitle,
        kind: qaKind,
        status: 'inbox',
        priority: qaPriority,
        module: qaModule,
        description: qaDescription || undefined,
        checklist: qaChecklist.length > 0 ? qaChecklist : undefined,
        actor_id: userId || undefined,
      }),
    })
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(created => {
        if (created) {
          // Replace temp item with real one from API (with real UUID)
          const mapped = mapWorkItemsToMockItems([created])[0];
          setItems(prev => prev.map(i => i.id === tempId ? mapped : i));
        }
      })
      .catch(() => {
        // Item stays as temp — works offline
      });
  }, [qaTitle, qaKind, qaPriority, qaModule, qaDescription, qaChecklist, getStrippedTitle]);

  // Auto-detect kind from title prefix
  useEffect(() => {
    const lower = qaTitle.toLowerCase();
    if (lower.startsWith('bug:') || lower.startsWith('bug ')) setQaKind('bug');
    else if (lower.startsWith('feature:') || lower.startsWith('feature ')) setQaKind('feature');
    else if (lower.startsWith('idea:') || lower.startsWith('idea ')) setQaKind('idea');
    else if (lower.startsWith('task:') || lower.startsWith('task ')) setQaKind('task');
  }, [qaTitle]);

  // Focus quick add input
  useEffect(() => {
    if (quickAddOpen && quickAddInputRef.current) {
      setTimeout(() => quickAddInputRef.current?.focus(), 50);
    }
  }, [quickAddOpen]);

  // Scroll tracking
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // Cmd+K: Quick Add
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickAddOpen(true);
        return;
      }

      // Don't capture keys when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') {
          if (quickAddOpen) { setQuickAddOpen(false); return; }
        }
        return;
      }

      if (e.key === 'Escape') {
        if (panelOpen) { closePanel(); return; }
        if (quickAddOpen) { setQuickAddOpen(false); return; }
        setSelectedIndex(-1);
        return;
      }

      if (activeView === 'kanban') return; // no j/k in kanban

      if (e.key === 'j') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, visibleItems.length - 1));
        return;
      }
      if (e.key === 'k') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < visibleItems.length) {
        e.preventDefault();
        openPanel(visibleItems[selectedIndex]);
        return;
      }
      if (e.key === 'e' && selectedIndex >= 0 && selectedIndex < visibleItems.length) {
        e.preventDefault();
        toggleExpand(visibleItems[selectedIndex].id);
        return;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, quickAddOpen, closePanel, activeView, visibleItems, selectedIndex, openPanel, toggleExpand, submitQuickAdd]);

  // Reset selectedIndex and close dropdowns on view change
  useEffect(() => { setSelectedIndex(-1); setAllWorkDropdown(null); setKanbanDropdown(null); }, [activeView]);

  // View switching via sidebar (sidebar state is independent — only toggle button changes it)
  const switchView = useCallback((v: View) => {
    setActiveView(v);
  }, []);

  const navItems: { label: string; letter: string; view: View }[] = [
    { label: 'My Focus', letter: 'F', view: 'focus' },
    { label: 'All Work', letter: 'W', view: 'allwork' },
    { label: 'Kanban', letter: 'K', view: 'kanban' },
    { label: 'Projects', letter: 'P', view: 'projects' },
    { label: 'Team', letter: 'T', view: 'team' },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes hive-orb1 {
          0% { transform: translate(0,0) scale(1); }
          40% { transform: translate(-4vw,6vh) scale(1.04); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes hive-orb2 {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(5vw,-5vh) scale(1.05); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes hive-orb3 {
          0% { transform: translate(0,0) scale(1); }
          45% { transform: translate(-3vw,-7vh) scale(0.97); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes hive-ambient1 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          25% { transform: translate(60px, -40px); opacity: 0.9; }
          50% { transform: translate(120px, 20px); opacity: 0.5; }
          75% { transform: translate(40px, 60px); opacity: 0.8; }
          100% { transform: translate(0, 0); opacity: 0.6; }
        }
        @keyframes hive-ambient2 {
          0% { transform: translate(0, 0); opacity: 0.5; }
          30% { transform: translate(-80px, 50px); opacity: 0.8; }
          60% { transform: translate(-40px, -30px); opacity: 0.4; }
          100% { transform: translate(0, 0); opacity: 0.5; }
        }
        @keyframes hive-ambient3 {
          0% { transform: translate(0, 0); opacity: 0.4; }
          35% { transform: translate(50px, 70px); opacity: 0.7; }
          70% { transform: translate(-60px, 30px); opacity: 0.5; }
          100% { transform: translate(0, 0); opacity: 0.4; }
        }
        @keyframes hive-dropdown-in {
          0% { transform: translateY(-4px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes hive-modal-in {
          0% { transform: translate(-50%, -50%) scale(0.95) translateY(10px); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1) translateY(0); opacity: 1; }
        }
        .hive-row {
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1), border-color 280ms, box-shadow 400ms, background 280ms;
        }
        .hive-row:hover { transform: translateY(-2px) !important; }
        .hive-kanban-card {
          transition: transform 250ms cubic-bezier(0.4,0,0.2,1), border-color 250ms, box-shadow 350ms, background 250ms, opacity 200ms;
        }
        .hive-kanban-card:hover { transform: translateY(-3px) !important; }
        .hive-kanban-card:active { cursor: grabbing !important; }
        .hive-promote:hover { background: rgba(245,185,30,0.12) !important; color: rgba(255,255,255,0.9) !important; }
        .hive-demote:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.6) !important; }
        .hive-chevron:hover { color: rgba(245,185,30,0.7) !important; }
        .hive-chip {
          transition: all 180ms cubic-bezier(0.4,0,0.2,1);
          cursor: pointer; user-select: none;
        }
        .hive-chip:hover { transform: translateY(-1px); }
        .hive-sb {
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }
        .hive-sb:hover { background: rgba(255,255,255,0.05) !important; transform: translateY(-1px); }
        .hive-scroll::-webkit-scrollbar { width: 5px; }
        .hive-scroll::-webkit-scrollbar-track { background: transparent; }
        .hive-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .hive-view-pill {
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
          cursor: pointer; user-select: none;
        }
        .hive-view-pill:hover { background: rgba(255,255,255,0.06) !important; }
        .hive-scope-tab {
          transition: all 180ms cubic-bezier(0.4,0,0.2,1);
          cursor: pointer; user-select: none;
        }
        .hive-scope-tab:hover { background: rgba(255,255,255,0.04) !important; }
        .hive-fab {
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1), background 280ms, border-color 280ms, box-shadow 400ms;
          cursor: pointer; user-select: none;
        }
        .hive-fab:hover {
          transform: translateY(-2px) !important;
          background: rgba(245,185,30,0.08) !important;
          border-color: rgba(245,185,30,0.18) !important;
          box-shadow: 0 4px 20px rgba(245,185,30,0.10), 0 0 0 1px rgba(245,185,30,0.08), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        .hive-fab:active { transform: scale(0.95) !important; }
        .hive-editable {
          cursor: pointer;
          transition: all 180ms ease;
          border-radius: 6px;
          padding: 3px 8px;
          margin: -3px -8px;
          border: 1px dashed rgba(255,255,255,0.08);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .hive-editable:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(245,185,30,0.25);
        }
        .hive-editable::after {
          content: '\\25BE';
          font-size: 8px;
          color: rgba(255,255,255,0.2);
          margin-left: 2px;
        }
        .hive-editable:hover::after {
          color: rgba(245,185,30,0.6);
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes hive-view-enter {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hive-view-enter {
          animation: hive-view-enter 300ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* ── Background orbs ─────────────────────────────────────────────── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '5%', left: '18%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(42,92%,55%,0.10) 0%, transparent 65%)',
            filter: 'blur(75px)', animation: 'hive-orb1 55s ease-in-out infinite',
            transform: `translateY(${scrollY * -0.04}px)`,
          }} />
          <div style={{
            position: 'absolute', top: '38%', right: '6%', width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(38,70%,48%,0.07) 0%, transparent 65%)',
            filter: 'blur(90px)', animation: 'hive-orb2 68s ease-in-out infinite',
            transform: `translateY(${scrollY * -0.02}px)`,
          }} />
          <div style={{
            position: 'absolute', bottom: '5%', left: '8%', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(35,50%,38%,0.04) 0%, transparent 60%)',
            filter: 'blur(110px)', animation: 'hive-orb3 80s ease-in-out infinite',
          }} />
        </div>

        {/* ── Sidebar (click-to-toggle) ───────────────────────────────────── */}
        <div style={{
          width: sidebarOpen ? 220 : 56,
          transition: 'width 250ms cubic-bezier(0.4,0,0.2,1), transform 400ms cubic-bezier(0.4,0,0.2,1), filter 400ms cubic-bezier(0.4,0,0.2,1)',
          height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          position: 'relative', zIndex: 20, overflow: 'hidden',
          transform: quickAddOpen ? 'scale(0.96)' : 'scale(1)',
          filter: quickAddOpen ? 'blur(4px)' : 'none',
          transformOrigin: 'center center',
        }}>
          {/* Top: toggle button */}
          <div style={{
            padding: sidebarOpen ? '20px 16px' : '20px 0',
            display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center',
            height: 60, flexShrink: 0, transition: 'padding 250ms',
          }}>
            {sidebarOpen ? (
              <>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>BugBee</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >&times;</button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                  fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 3,
                }}
              >
                <div style={{ width: 14, height: 1.5, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
                <div style={{ width: 14, height: 1.5, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
                <div style={{ width: 14, height: 1.5, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
              </button>
            )}
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: sidebarOpen ? '8px' : '8px 12px' }}>
            {navItems.map((n) => {
              const isActive = n.view === activeView;
              return (
                <div
                  key={n.label}
                  className="hive-sb"
                  onClick={() => switchView(n.view)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: sidebarOpen ? '8px 10px' : '0',
                    borderRadius: 8, cursor: 'pointer',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    background: isActive ? 'rgba(245,185,30,0.08)' : 'rgba(255,255,255,0.02)',
                    boxShadow: isActive
                      ? 'inset 0 1px 0 rgba(245,185,30,0.1), inset 0 -1px 0 rgba(0,0,0,0.15)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.1)',
                    height: sidebarOpen ? 'auto' : 34, minHeight: 34,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: isActive ? 'rgba(245,185,30,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? 'rgba(245,185,30,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 500, color: isActive ? 'rgba(245,185,30,0.9)' : 'rgba(255,255,255,0.4)', flexShrink: 0,
                  }}>{n.letter}</div>
                  {sidebarOpen && <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{n.label}</span>}
                </div>
              );
            })}
          </div>

          {/* Depth legend (sidebar expanded) */}
          {sidebarOpen && (
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: 10 }}>Depth</div>
              {(['surface', 'inflight', 'backlog'] as Stratum[]).map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'surface' ? 'rgba(245,185,30,0.6)' : s === 'inflight' ? 'rgba(245,185,30,0.3)' : 'rgba(245,185,30,0.12)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{strataConfig[s].label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Back link */}
          <div style={{ padding: sidebarOpen ? '12px 16px' : '16px 0', display: 'flex', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderTop: sidebarOpen ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
            <Link href="/concepts" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {sidebarOpen ? '\u2190 Back to Concepts' : '\u2190'}
            </Link>
          </div>
        </div>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main ref={scrollRef} className="hive-scroll" style={{
          flex: 1, height: '100%', overflow: 'auto', position: 'relative', zIndex: 10,
          transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1), filter 400ms cubic-bezier(0.4,0,0.2,1)',
          transform: panelOpen ? 'translateX(-180px) scale(0.95)' : quickAddOpen ? 'scale(0.96)' : 'translateX(0) scale(1)',
          filter: panelOpen ? 'blur(6px)' : quickAddOpen ? 'blur(4px)' : 'none',
          transformOrigin: 'center center',
        }}>
          {/* Floating Quick Add button */}
          <button
            className="hive-fab"
            onClick={() => setQuickAddOpen(true)}
            title="Quick Add (⌘K)"
            style={{
              position: 'fixed', bottom: 36, right: 48, zIndex: 15,
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.12)',
              color: 'rgba(245,185,30,0.8)',
              fontSize: 20, fontWeight: 300, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, padding: 0,
            }}
          >+</button>

          <div className={viewTransition ? '' : 'hive-view-enter'} style={{ padding: '36px 48px 80px', maxWidth: (activeView === 'kanban' || activeView === 'projects' || activeView === 'team') ? '100%' : 920, margin: '0 auto', position: 'relative', opacity: viewTransition ? 0 : undefined }}>

            {/* ── Header + view pills ──────────────────────────────────────── */}
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', margin: 0 }}>
                  {activeView === 'focus' ? 'My Focus' : activeView === 'allwork' ? 'All Work' : activeView === 'kanban' ? 'Kanban' : activeView === 'projects' ? 'Projects' : 'Team'}
                </h1>
                <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
                  {activeView === 'focus' ? 'Depth-layered task focus' : activeView === 'allwork' ? 'Everything across the hive' : activeView === 'kanban' ? 'Visual workflow board' : activeView === 'projects' ? 'All modules and workstreams' : 'Your team and workload'}
                </p>
              </div>

              {/* View tab pills */}
              <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {([
                  { key: 'focus' as View, label: 'Focus' },
                  { key: 'allwork' as View, label: 'All Work' },
                  { key: 'kanban' as View, label: 'Kanban' },
                  { key: 'projects' as View, label: 'Projects' },
                  { key: 'team' as View, label: 'Team' },
                ]).map((v) => (
                  <div
                    key={v.key}
                    className="hive-view-pill"
                    onClick={() => setActiveView(v.key)}
                    style={{
                      padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: activeView === v.key ? 'rgba(245,185,30,0.1)' : 'transparent',
                      color: activeView === v.key ? 'rgba(245,185,30,0.9)' : 'rgba(255,255,255,0.4)',
                      border: activeView === v.key ? '1px solid rgba(245,185,30,0.15)' : '1px solid transparent',
                    }}
                  >{v.label}</div>
                ))}
              </div>
            </div>

            {/* ── Loading State ──────────────────────────────────────────── */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0' }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    height: 52, borderRadius: 14,
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }} />
                ))}
              </div>
            )}

            {/* ── Offline Banner ────────────────────────────────────────────── */}
            {error && !loading && (
              <div style={{
                padding: '8px 16px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(245,185,30,0.06)', border: '1px solid rgba(245,185,30,0.12)',
                fontSize: 12, color: 'rgba(245,185,30,0.7)',
              }}>
                Using offline data — {error}
              </div>
            )}

            {/* ── Focus View ───────────────────────────────────────────────── */}
            {!loading && activeView === 'focus' && (
              <>
                {([
                  { key: 'surface' as Stratum, items: surfaceItems },
                  { key: 'inflight' as Stratum, items: inflightItems },
                  { key: 'backlog' as Stratum, items: backlogItems },
                ]).map(({ key: stratum, items: strataItems }) => {
                  const config = strataConfig[stratum];
                  const parallaxOffset = scrollY * (0.015 * config.depth);
                  // Calculate global index offset
                  let indexOffset = 0;
                  if (stratum === 'inflight') indexOffset = surfaceItems.length;
                  if (stratum === 'backlog') indexOffset = surfaceItems.length + inflightItems.length;

                  return (
                    <div key={stratum} style={{
                      marginBottom: 48, position: 'relative',
                      transform: `translateY(${parallaxOffset}px)`,
                      transition: 'transform 50ms linear',
                    }}>
                      {/* Ambient light behind cards */}
                      <div style={{ position: 'absolute', inset: '-40px -60px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', top: '10%', left: '5%', width: 280, height: 180, borderRadius: '50%',
                          background: `radial-gradient(ellipse, ${config.accentColor.replace(')', ',0.35)')}, transparent 70%)`,
                          filter: 'blur(60px)',
                          animation: `hive-ambient1 ${40 + config.depth * 15}s ease-in-out infinite`,
                        }} />
                        <div style={{
                          position: 'absolute', top: '40%', right: '10%', width: 220, height: 220, borderRadius: '50%',
                          background: `radial-gradient(circle, hsla(38,80%,52%,${0.12 - config.depth * 0.03}) 0%, transparent 70%)`,
                          filter: 'blur(50px)',
                          animation: `hive-ambient2 ${48 + config.depth * 12}s ease-in-out infinite`,
                        }} />
                        <div style={{
                          position: 'absolute', bottom: '5%', left: '30%', width: 260, height: 160, borderRadius: '50%',
                          background: `radial-gradient(ellipse, hsla(42,92%,55%,${0.08 - config.depth * 0.02}) 0%, transparent 70%)`,
                          filter: 'blur(55px)',
                          animation: `hive-ambient3 ${55 + config.depth * 10}s ease-in-out infinite`,
                        }} />
                      </div>

                      {/* Section header */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, paddingBottom: 10, position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 500, color: `rgba(255,255,255,${0.85 - config.depth * 0.18})`, letterSpacing: '-0.01em', margin: 0 }}>{config.label}</h2>
                        <span style={{ fontSize: 12, fontWeight: 300, color: `rgba(255,255,255,${0.3 - config.depth * 0.06})` }}>{config.subtitle}</span>
                        <span style={{ fontSize: 11, color: `rgba(255,255,255,${0.18 - config.depth * 0.04})`, marginLeft: 'auto' }}>{strataItems.length}</span>
                      </div>

                      {/* Glow separator */}
                      {stratum === 'surface' && (
                        <div style={{ height: 1, marginTop: -12, marginBottom: 16, background: 'linear-gradient(90deg, transparent, rgba(245,185,30,0.25) 20%, rgba(245,185,30,0.25) 80%, transparent)', position: 'relative', zIndex: 1 }} />
                      )}
                      {stratum === 'inflight' && (
                        <div style={{ height: 1, marginTop: -12, marginBottom: 16, background: 'linear-gradient(90deg, transparent, rgba(245,185,30,0.12) 20%, rgba(245,185,30,0.12) 80%, transparent)', position: 'relative', zIndex: 1 }} />
                      )}

                      {/* Item rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', zIndex: 1 }}>
                        {strataItems.map((item, i) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            stratum={stratum}
                            teamMembers={teamMembers}
                            isHovered={hoveredId === item.id}
                            isExpanded={expandedIds.has(item.id)}
                            isSelected={selectedIndex === indexOffset + i}
                            showDepth={true}
                            onHover={() => setHoveredId(item.id)}
                            onLeave={() => setHoveredId(null)}
                            onClick={() => openPanel(item)}
                            onExpand={() => toggleExpand(item.id)}
                            onPromote={stratum !== 'surface' ? () => promote(item) : undefined}
                            onDemote={stratum !== 'backlog' ? () => demote(item) : undefined}
                            onToggleChecklist={(cId) => {
                              const newChecklist = item.checklist.map(c => c.id === cId ? { ...c, completed: !c.completed } : c);
                              updateItem(item.id, { checklist: newChecklist });
                            }}
                          />
                        ))}
                        {strataItems.length === 0 && (
                          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, fontWeight: 300, color: `rgba(255,255,255,${0.18 - config.depth * 0.04})` }}>
                            No items at this depth
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── All Work View ────────────────────────────────────────────── */}
            {!loading && activeView === 'allwork' && (
              <>
                {/* Module scope tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div
                    className="hive-scope-tab"
                    onClick={() => setScopeModule(null)}
                    style={{
                      padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: scopeModule === null ? 'rgba(245,185,30,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${scopeModule === null ? 'rgba(245,185,30,0.15)' : 'rgba(255,255,255,0.06)'}`,
                      color: scopeModule === null ? 'rgba(245,185,30,0.9)' : 'rgba(255,255,255,0.35)',
                    }}
                  >All</div>
                  {allModules.filter(m => items.some(i => i.module === m)).map((m) => (
                    <div
                      key={m}
                      className="hive-scope-tab"
                      onClick={() => setScopeModule(scopeModule === m ? null : m)}
                      style={{
                        padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        background: scopeModule === m ? `${moduleConfig[m].color}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${scopeModule === m ? `${moduleConfig[m].color}33` : 'rgba(255,255,255,0.06)'}`,
                        color: scopeModule === m ? moduleConfig[m].color : 'rgba(255,255,255,0.35)',
                      }}
                    >{moduleConfig[m].label}</div>
                  ))}
                </div>

                {/* Search + sort row */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                      <circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <path d="M10 10l3 3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search items..."
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                    style={{
                      padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="priority" style={{ background: '#1e293b' }}>Sort: Priority</option>
                    <option value="due_date" style={{ background: '#1e293b' }}>Sort: Due Date</option>
                    <option value="newest" style={{ background: '#1e293b' }}>Sort: Newest</option>
                  </select>
                </div>

                {/* Filter dropdowns */}
                <FilterDropdowns
                  openDropdown={allWorkDropdown}
                  setOpenDropdown={setAllWorkDropdown}
                  filterKinds={filterKinds}
                  filterPriorities={filterPriorities}
                  filterStatuses={filterStatuses}
                  filterModules={filterModules}
                  toggleKind={(k) => setFilterKinds(prev => toggle(prev, k))}
                  togglePriority={(p) => setFilterPriorities(prev => toggle(prev, p))}
                  toggleStatus={(s) => setFilterStatuses(prev => toggle(prev, s))}
                  toggleModule={(m) => setFilterModules(prev => toggle(prev, m))}
                  showStatuses={true}
                  showModules={true}
                />

                {/* Result count */}
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
                  {allWorkItems.length} item{allWorkItems.length !== 1 ? 's' : ''}
                </div>

                {/* Item rows (flat, no depth) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {allWorkItems.map((item, i) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      teamMembers={teamMembers}
                      isHovered={hoveredId === item.id}
                      isExpanded={expandedIds.has(item.id)}
                      isSelected={selectedIndex === i}
                      showDepth={false}
                      onHover={() => setHoveredId(item.id)}
                      onLeave={() => setHoveredId(null)}
                      onClick={() => openPanel(item)}
                      onExpand={() => toggleExpand(item.id)}
                      onToggleChecklist={(cId) => {
                        const newChecklist = item.checklist.map(c => c.id === cId ? { ...c, completed: !c.completed } : c);
                        updateItem(item.id, { checklist: newChecklist });
                      }}
                    />
                  ))}
                  {allWorkItems.length === 0 && (
                    <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.2)' }}>
                      No items match your filters
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Kanban View ──────────────────────────────────────────────── */}
            {!loading && activeView === 'kanban' && (
              <>
                {/* Kanban filter dropdowns */}
                <FilterDropdowns
                  openDropdown={kanbanDropdown}
                  setOpenDropdown={setKanbanDropdown}
                  filterKinds={kanbanFilterKinds}
                  filterPriorities={kanbanFilterPriorities}
                  filterModules={kanbanFilterModules}
                  toggleKind={(k) => setKanbanFilterKinds(prev => toggle(prev, k))}
                  togglePriority={(p) => setKanbanFilterPriorities(prev => toggle(prev, p))}
                  toggleModule={(m) => setKanbanFilterModules(prev => toggle(prev, m))}
                  showModules={true}
                />

                {/* Kanban columns */}
                <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 20, height: 'calc(100vh - 240px)' }}>
                  {statusColumns.map((col) => {
                    const colItems = kanbanItems.filter(i => i.status === col.key);
                    const isWip = col.key !== 'done' && col.key !== 'inbox' && colItems.length > 3;

                    return (
                      <div
                        key={col.key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverColumn(col.key);
                        }}
                        onDragLeave={() => setDragOverColumn(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          const itemId = e.dataTransfer.getData('text/plain');
                          if (itemId) {
                            updateItem(itemId, { status: col.key });
                          }
                          setDragOverColumn(null);
                          setDraggedItemId(null);
                        }}
                        style={{
                          flex: '1 0 200px', minWidth: 200, maxWidth: 280,
                          borderRadius: 14, overflow: 'hidden',
                          background: dragOverColumn === col.key ? 'rgba(245,185,30,0.04)' : 'rgba(255,255,255,0.02)',
                          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                          border: `1px solid ${dragOverColumn === col.key ? 'rgba(245,185,30,0.3)' : isWip ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                          display: 'flex', flexDirection: 'column',
                          transition: 'border-color 200ms ease, background 200ms ease',
                        }}
                      >
                        {/* Column header */}
                        <div style={{
                          padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          flexShrink: 0,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusConfig[col.key].color }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{col.label}</span>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            padding: '1px 7px', borderRadius: 6,
                            background: isWip ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                            color: isWip ? 'rgba(245,158,11,0.9)' : 'rgba(255,255,255,0.3)',
                          }}>{colItems.length}</span>
                        </div>

                        {/* Cards */}
                        <div className="hive-scroll" style={{ padding: '10px 10px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', minHeight: 0 }}>
                          {colItems.map((item) => (
                            <KanbanCard
                              key={item.id}
                              item={item}
                              teamMembers={teamMembers}
                              isHovered={hoveredId === item.id}
                              isDragging={draggedItemId === item.id}
                              onHover={() => setHoveredId(item.id)}
                              onLeave={() => setHoveredId(null)}
                              onClick={() => openPanel(item)}
                              onDragStart={() => setDraggedItemId(item.id)}
                              onDragEnd={() => { setDraggedItemId(null); setDragOverColumn(null); }}
                            />
                          ))}
                          {colItems.length === 0 && (
                            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.12)' }}>
                              Empty
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Projects View ─────────────────────────────────────────────── */}
            {!loading && activeView === 'projects' && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}>
                  {projects.map((project) => {
                    const projectItemCount = items.filter(i => i.module === project.key).length;
                    const projectBugCount = items.filter(i => i.module === project.key && i.kind === 'bug' && i.status !== 'done').length;
                    const projectDoneCount = items.filter(i => i.module === project.key && i.status === 'done').length;
                    const projectProgress = projectItemCount > 0 ? Math.round((projectDoneCount / projectItemCount) * 100) : 0;

                    return (
                      <div
                        key={project.id}
                        className="hive-kanban-card"
                        onClick={() => { setActiveView('allwork'); setScopeModule(project.key); }}
                        style={{
                          position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.03)',
                          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                      >
                        {/* Color accent bar */}
                        <div style={{ height: 3, background: project.color, opacity: 0.7 }} />

                        <div style={{ padding: '18px 20px 20px' }}>
                          {/* Project icon + name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: `${project.color}18`,
                              border: `1px solid ${project.color}30`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 600, color: project.color, flexShrink: 0,
                            }}>{project.icon}</div>
                            <h3 style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{project.name}</h3>
                          </div>

                          {/* Description */}
                          <p style={{
                            fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.35)',
                            margin: '0 0 16px', lineHeight: 1.5,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                          }}>{project.description}</p>

                          {/* Stats row */}
                          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>{projectItemCount}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>items</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 500, color: projectBugCount > 0 ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.8)', lineHeight: 1 }}>{projectBugCount}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>open bugs</div>
                            </div>
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                              <div style={{ fontSize: 18, fontWeight: 500, color: 'rgba(245,185,30,0.8)', lineHeight: 1 }}>{projectProgress}%</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>done</div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${projectProgress}%`,
                              background: `linear-gradient(90deg, ${project.color}80, rgba(245,185,30,0.4))`,
                              borderRadius: 2, transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
                            }} />
                          </div>

                          {/* Empty state */}
                          {projectItemCount === 0 && (
                            <div style={{ textAlign: 'center', padding: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
                              No work items yet
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Project card */}
                  {!addingProject ? (
                    <div
                      className="hive-kanban-card"
                      onClick={() => setAddingProject(true)}
                      style={{
                        position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minHeight: 200, flexDirection: 'column', gap: 8,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: 'rgba(255,255,255,0.2)',
                      }}>+</div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Add Project</span>
                    </div>
                  ) : (
                    <div style={{
                      position: 'relative', borderRadius: 14, overflow: 'hidden',
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(245,185,30,0.15)',
                      padding: '20px',
                    }}>
                      <h4 style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: '0 0 12px' }}>New Project</h4>
                      <input
                        autoFocus
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', outline: 'none', marginBottom: 8,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { setAddingProject(false); setNewProjectName(''); setNewProjectDesc(''); }
                        }}
                      />
                      <input
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        placeholder="Description"
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', outline: 'none', marginBottom: 12,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newProjectName.trim()) {
                            const pName = newProjectName.trim();
                            const pDesc = newProjectDesc.trim();
                            const key = pName.toLowerCase().replace(/\s+/g, '_');
                            const tempId = `proj-${Date.now()}`;
                            setProjects(prev => [...prev, {
                              id: tempId, name: pName, key,
                              description: pDesc, color: '#f59e0b', icon: pName[0]?.toUpperCase() || 'P',
                            }]);
                            setNewProjectName(''); setNewProjectDesc(''); setAddingProject(false);
                            fetch('/api/projects', {
                              method: 'POST', headers: authHeaders(),
                              body: JSON.stringify({ name: pName, description: pDesc, module: key, color: '#f59e0b' }),
                            }).then(r => r.ok ? r.json() : null).then(created => {
                              if (created) {
                                const mapped = mapProjectsToMockProjects([created])[0];
                                setProjects(prev => prev.map(p => p.id === tempId ? mapped : p));
                              }
                            }).catch(() => {});
                          }
                          if (e.key === 'Escape') { setAddingProject(false); setNewProjectName(''); setNewProjectDesc(''); }
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            if (!newProjectName.trim()) return;
                            const pName = newProjectName.trim();
                            const pDesc = newProjectDesc.trim();
                            const key = pName.toLowerCase().replace(/\s+/g, '_');
                            const tempId = `proj-${Date.now()}`;
                            setProjects(prev => [...prev, {
                              id: tempId, name: pName, key,
                              description: pDesc, color: '#f59e0b', icon: pName[0]?.toUpperCase() || 'P',
                            }]);
                            setNewProjectName(''); setNewProjectDesc(''); setAddingProject(false);
                            fetch('/api/projects', {
                              method: 'POST', headers: authHeaders(),
                              body: JSON.stringify({ name: pName, description: pDesc, module: key, color: '#f59e0b' }),
                            }).then(r => r.ok ? r.json() : null).then(created => {
                              if (created) {
                                const mapped = mapProjectsToMockProjects([created])[0];
                                setProjects(prev => prev.map(p => p.id === tempId ? mapped : p));
                              }
                            }).catch(() => {});
                          }}
                          style={{
                            flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                            background: newProjectName.trim() ? 'rgba(245,185,30,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${newProjectName.trim() ? 'rgba(245,185,30,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            color: newProjectName.trim() ? 'rgba(245,185,30,0.9)' : 'rgba(255,255,255,0.2)',
                          }}
                        >Create</button>
                        <button
                          onClick={() => { setAddingProject(false); setNewProjectName(''); setNewProjectDesc(''); }}
                          style={{
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.35)',
                          }}
                        >Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Team View ──────────────────────────────────────────────────── */}
            {!loading && activeView === 'team' && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}>
                  {teamMembers.map((member) => {
                    const memberItems = items.filter(i => i.assigned_to === member.initials);
                    const inProgress = memberItems.filter(i => i.status === 'in_progress').length;
                    const overdue = memberItems.filter(i => isOverdue(i)).length;
                    const done = memberItems.filter(i => i.status === 'done').length;
                    const total = memberItems.length;
                    const memberProgress = total > 0 ? Math.round((done / total) * 100) : 0;
                    const isOverloaded = inProgress > 4;
                    const isEditing = editingMemberId === member.id;

                    return (
                      <div
                        key={member.id}
                        className="hive-kanban-card"
                        onClick={() => {
                          if (isEditing) return;
                          setViewTransition(true);
                          setTimeout(() => {
                            setActiveView('allwork');
                            setSearchQuery(member.initials);
                            setTimeout(() => setViewTransition(false), 50);
                          }, 150);
                        }}
                        style={{
                          position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: isEditing ? 'default' : 'pointer',
                          background: 'rgba(255,255,255,0.03)',
                          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                          border: `1px solid ${isOverloaded ? 'rgba(245,185,30,0.18)' : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: isOverloaded
                            ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 12px rgba(245,185,30,0.06)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                      >
                        {/* Edit icon in top-right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditing) {
                              // Save edits
                              const updatedName = editMemberName.trim();
                              const updatedRole = editMemberRole.trim();
                              if (updatedName) {
                                const mNames = updatedName.split(/\s+/);
                                const mInitials = mNames.length >= 2 ? (mNames[0][0] + mNames[mNames.length - 1][0]).toUpperCase() : mNames[0].slice(0, 2).toUpperCase();
                                const currentMember = teamMembers.find(tm => tm.id === member.id);
                                const finalImage = currentMember?.avatar_image;
                                const finalColor = editMemberColor || member.avatar_color;
                                setTeamMembers(prev => prev.map(tm => tm.id === member.id ? { ...tm, name: updatedName, role: updatedRole || tm.role, initials: mInitials, avatar_color: finalColor, avatar_image: finalImage } : tm));
                                fetch(`/api/team-members/${member.id}`, {
                                  method: 'PATCH', headers: authHeaders(),
                                  body: JSON.stringify({
                                    name: updatedName,
                                    role: updatedRole || member.role,
                                    avatar_url: finalImage || finalColor,
                                  }),
                                }).catch(() => {});
                              }
                              setEditingMemberId(null);
                            } else {
                              setEditMemberName(member.name);
                              setEditMemberRole(member.role);
                              setEditMemberColor(member.avatar_color);
                              setEditingMemberId(member.id);
                            }
                          }}
                          style={{
                            position: 'absolute', top: 12, right: 12, zIndex: 2,
                            width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                            background: isEditing ? 'rgba(245,185,30,0.12)' : 'rgba(255,255,255,0.04)',
                            color: isEditing ? 'rgba(245,185,30,0.9)' : 'rgba(255,255,255,0.3)',
                            fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 180ms ease',
                          }}
                          onMouseEnter={e => { if (!isEditing) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                          onMouseLeave={e => { if (!isEditing) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; } }}
                          title={isEditing ? 'Save' : 'Edit member'}
                        >{isEditing ? '\u2713' : '\u270E'}</button>

                        <div style={{ padding: '20px' }}>
                          {/* Avatar + name */}
                          <div style={{ display: 'flex', alignItems: isEditing ? 'flex-start' : 'center', gap: 12, marginBottom: 14, paddingRight: 32 }}>
                            <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => isEditing && e.stopPropagation()}>
                              <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: member.avatar_image ? `url(${member.avatar_image}) center/cover no-repeat` : (isEditing ? editMemberColor : member.avatar_color),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 600, color: '#fff',
                                boxShadow: `0 2px 8px ${isEditing ? editMemberColor : member.avatar_color}40`,
                                overflow: 'hidden',
                                transition: 'background 200ms ease',
                                position: 'relative',
                              }}>
                                {member.avatar_image ? null : member.initials}
                                {/* Photo upload overlay in edit mode */}
                                {isEditing && (
                                  <label style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', opacity: 0, transition: 'opacity 180ms ease',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                                  onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
                                  >
                                    <span style={{ fontSize: 20, color: '#fff', lineHeight: 1 }}>+</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            const dataUrl = ev.target?.result as string;
                                            setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, avatar_image: dataUrl } : m));
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                              {/* Color picker swatches in edit mode */}
                              {isEditing && (
                                <div style={{ display: 'flex', gap: 3, marginTop: 6, justifyContent: 'center' }}>
                                  {['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#64748b'].map(c => (
                                    <div
                                      key={c}
                                      onClick={() => { setEditMemberColor(c); setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, avatar_image: undefined } : m)); }}
                                      style={{
                                        width: 14, height: 14, borderRadius: '50%', background: c, cursor: 'pointer',
                                        border: editMemberColor === c ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
                                        transition: 'border-color 150ms ease',
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {isEditing ? (
                                <>
                                  <input
                                    autoFocus
                                    value={editMemberName}
                                    onChange={(e) => setEditMemberName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') { setEditingMemberId(null); }
                                      if (e.key === 'Enter') {
                                        const updatedName = editMemberName.trim();
                                        const updatedRole = editMemberRole.trim();
                                        if (updatedName) {
                                          const mNames = updatedName.split(/\s+/);
                                          const mInitials = mNames.length >= 2 ? (mNames[0][0] + mNames[mNames.length - 1][0]).toUpperCase() : mNames[0].slice(0, 2).toUpperCase();
                                          setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, name: updatedName, role: updatedRole || m.role, initials: mInitials, avatar_color: editMemberColor || m.avatar_color } : m));
                                        }
                                        setEditingMemberId(null);
                                      }
                                    }}
                                    style={{
                                      width: '100%', padding: '4px 8px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,185,30,0.2)',
                                      color: 'rgba(255,255,255,0.9)', fontFamily: 'inherit', outline: 'none', marginBottom: 4,
                                    }}
                                  />
                                  <input
                                    value={editMemberRole}
                                    onChange={(e) => setEditMemberRole(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingMemberId(null); }}
                                    placeholder="Role"
                                    style={{
                                      width: '100%', padding: '3px 8px', borderRadius: 6, fontSize: 11,
                                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                      color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none',
                                    }}
                                  />
                                </>
                              ) : (
                                <>
                                  <h3 style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{member.name}</h3>
                                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{member.role}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Workload stats */}
                          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>{total}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>assigned</div>
                            </div>
                            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 500, color: inProgress > 0 ? 'rgba(245,185,30,0.8)' : 'rgba(255,255,255,0.8)', lineHeight: 1 }}>{inProgress}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>active</div>
                            </div>
                            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: overdue > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 500, color: overdue > 0 ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.8)', lineHeight: 1 }}>{overdue}</div>
                              <div style={{ fontSize: 10, color: overdue > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.25)', marginTop: 3 }}>overdue</div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${memberProgress}%`,
                                background: `linear-gradient(90deg, ${member.avatar_color}80, rgba(245,185,30,0.4))`,
                                borderRadius: 2, transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{memberProgress}%</span>
                          </div>

                          {/* Empty state */}
                          {total === 0 && (
                            <div style={{ textAlign: 'center', padding: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
                              No items assigned
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Member card */}
                  {!addingMember ? (
                    <div
                      className="hive-kanban-card"
                      onClick={() => setAddingMember(true)}
                      style={{
                        position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minHeight: 200, flexDirection: 'column', gap: 8,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: 'rgba(255,255,255,0.2)',
                      }}>+</div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Add Member</span>
                    </div>
                  ) : (
                    <div style={{
                      position: 'relative', borderRadius: 14, overflow: 'hidden',
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(245,185,30,0.15)',
                      padding: '20px',
                    }}>
                      <h4 style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: '0 0 12px' }}>New Member</h4>
                      <input
                        autoFocus
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Full name"
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', outline: 'none', marginBottom: 8,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { setAddingMember(false); setNewMemberName(''); setNewMemberRole(''); }
                        }}
                      />
                      <input
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        placeholder="Role"
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', outline: 'none', marginBottom: 12,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMemberName.trim()) {
                            const mName = newMemberName.trim();
                            const mRole = newMemberRole.trim() || 'Team Member';
                            const mNames = mName.split(/\s+/);
                            const mInitials = mNames.length >= 2 ? (mNames[0][0] + mNames[mNames.length - 1][0]).toUpperCase() : mNames[0].slice(0, 2).toUpperCase();
                            const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
                            const tempId = `tm-${Date.now()}`;
                            setTeamMembers(prev => [...prev, {
                              id: tempId, initials: mInitials, name: mName,
                              role: mRole,
                              avatar_color: colors[teamMembers.length % colors.length],
                            }]);
                            setNewMemberName(''); setNewMemberRole(''); setAddingMember(false);
                            fetch('/api/team-members', {
                              method: 'POST', headers: authHeaders(),
                              body: JSON.stringify({ name: mName, role: mRole }),
                            }).then(r => r.ok ? r.json() : null).then(created => {
                              if (created) {
                                const mapped = mapTeamToMockTeamMembers([created])[0];
                                setTeamMembers(prev => prev.map(m => m.id === tempId ? mapped : m));
                              }
                            }).catch(() => {});
                          }
                          if (e.key === 'Escape') { setAddingMember(false); setNewMemberName(''); setNewMemberRole(''); }
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            if (!newMemberName.trim()) return;
                            const mName = newMemberName.trim();
                            const mRole = newMemberRole.trim() || 'Team Member';
                            const mNames = mName.split(/\s+/);
                            const mInitials = mNames.length >= 2 ? (mNames[0][0] + mNames[mNames.length - 1][0]).toUpperCase() : mNames[0].slice(0, 2).toUpperCase();
                            const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
                            const tempId = `tm-${Date.now()}`;
                            setTeamMembers(prev => [...prev, {
                              id: tempId, initials: mInitials, name: mName,
                              role: mRole,
                              avatar_color: colors[teamMembers.length % colors.length],
                            }]);
                            setNewMemberName(''); setNewMemberRole(''); setAddingMember(false);
                            fetch('/api/team-members', {
                              method: 'POST', headers: authHeaders(),
                              body: JSON.stringify({ name: mName, role: mRole }),
                            }).then(r => r.ok ? r.json() : null).then(created => {
                              if (created) {
                                const mapped = mapTeamToMockTeamMembers([created])[0];
                                setTeamMembers(prev => prev.map(m => m.id === tempId ? mapped : m));
                              }
                            }).catch(() => {});
                          }}
                          style={{
                            flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                            background: newMemberName.trim() ? 'rgba(245,185,30,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${newMemberName.trim() ? 'rgba(245,185,30,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            color: newMemberName.trim() ? 'rgba(245,185,30,0.9)' : 'rgba(255,255,255,0.2)',
                          }}
                        >Add</button>
                        <button
                          onClick={() => { setAddingMember(false); setNewMemberName(''); setNewMemberRole(''); }}
                          style={{
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.35)',
                          }}
                        >Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </main>

        {/* ── Panel backdrop ──────────────────────────────────────────────── */}
        {panelOpen && <div onClick={closePanel} style={{ position: 'absolute', inset: 0, zIndex: 25 }} />}

        {/* ── Detail Panel ────────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, zIndex: 30,
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Amber edge line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, rgba(245,185,30,0.04) 0%, rgba(245,185,30,0.15) 25%, rgba(245,185,30,0.15) 75%, rgba(245,185,30,0.04) 100%)',
          }} />

          {selected && (
            <div className="hive-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
              {/* Click-away overlay for panel dropdowns */}
              {panelDropdown && (
                <div onClick={() => setPanelDropdown(null)} style={{ position: 'fixed', inset: 0, zIndex: 45 }} />
              )}

              {/* Close button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={closePanel} style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>&times;</button>
              </div>

              {/* ID + clickable status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{selected.id}</span>
                <div style={{ position: 'relative', zIndex: panelDropdown === 'status' ? 200 : 1 }}>
                  <span
                    onClick={() => setPanelDropdown(panelDropdown === 'status' ? null : 'status')}
                    style={{
                      fontSize: 11, fontWeight: 500, padding: '3px 10px 3px 8px', borderRadius: 6,
                      background: panelDropdown === 'status' ? `${statusConfig[selected.status].color}20` : 'rgba(255,255,255,0.05)',
                      color: statusConfig[selected.status].color,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                      border: `1px solid ${panelDropdown === 'status' ? `${statusConfig[selected.status].color}40` : 'rgba(255,255,255,0.08)'}`,
                      transition: 'all 180ms ease',
                    }}
                  >{statusConfig[selected.status].label}<span style={{ fontSize: 8, opacity: 0.5 }}>&#9662;</span></span>

                  {/* Status dropdown */}
                  {panelDropdown === 'status' && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                      padding: '8px 10px', borderRadius: 12, minWidth: 180,
                      background: 'rgba(15,22,38,0.98)',
                      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                      animation: 'hive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {allStatuses.map((s) => {
                          const sc = statusConfig[s];
                          const isSelected = selected.status === s;
                          return (
                            <div
                              key={s}
                              onClick={() => {
                                updateItem(selected.id, {
                                  status: s,
                                  status_changed_at: new Date().toISOString(),
                                });
                                setPanelDropdown(null);
                              }}
                              style={{
                                padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 8,
                                cursor: 'pointer',
                                color: isSelected ? sc.color : 'rgba(255,255,255,0.5)',
                                background: isSelected ? `${sc.color}18` : 'transparent',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = `rgba(255,255,255,0.05)`; }}
                              onMouseLeave={e => { e.currentTarget.style.background = isSelected ? `${sc.color}18` : 'transparent'; }}
                            >
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                              {sc.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, margin: '0 0 22px', letterSpacing: '-0.01em' }}>
                {selected.title}
              </h2>

              {/* 2-column metadata grid — all fields clickable */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px',
                marginBottom: 24, padding: 18, background: 'rgba(255,255,255,0.02)',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)',
                position: 'relative',
              }}>
                <MF label="Kind">
                  <div style={{ position: 'relative', zIndex: panelDropdown === 'kind' ? 200 : 1 }}>
                    <div
                      className="hive-editable"
                      onClick={() => setPanelDropdown(panelDropdown === 'kind' ? null : 'kind')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    >
                      <span style={{ color: kindConfig[selected.kind].color, fontSize: 13 }}>{kindConfig[selected.kind].label}</span>
                    </div>

                    {panelDropdown === 'kind' && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                        padding: '8px 10px', borderRadius: 12, minWidth: 180,
                        background: 'rgba(15,22,38,0.98)',
                        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                        animation: 'hive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {allKinds.map((k) => {
                            const kc = kindConfig[k];
                            const isCurrent = selected.kind === k;
                            return (
                              <div
                                key={k}
                                onClick={() => {
                                  updateItem(selected.id, { kind: k });
                                  setPanelDropdown(null);
                                }}
                                style={{
                                  padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  cursor: 'pointer',
                                  color: isCurrent ? kc.color : 'rgba(255,255,255,0.5)',
                                  background: isCurrent ? kc.bg : 'transparent',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? kc.bg : 'transparent'; }}
                              >
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: kc.color, flexShrink: 0 }} />
                                {kc.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </MF>

                {/* Clickable Priority */}
                <MF label="Priority">
                  <div style={{ position: 'relative', zIndex: panelDropdown === 'priority' ? 200 : 1 }}>
                    <div
                      className="hive-editable"
                      onClick={() => setPanelDropdown(panelDropdown === 'priority' ? null : 'priority')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityConfig[selected.priority].color }} />
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{priorityConfig[selected.priority].label}</span>
                    </div>

                    {/* Priority dropdown */}
                    {panelDropdown === 'priority' && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                        padding: '8px 10px', borderRadius: 12, minWidth: 180,
                        background: 'rgba(15,22,38,0.98)',
                        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                        animation: 'hive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {allPriorities.map((p) => {
                            const pc = priorityConfig[p];
                            const isSelected = selected.priority === p;
                            return (
                              <div
                                key={p}
                                onClick={() => {
                                  updateItem(selected.id, { priority: p });
                                  setPanelDropdown(null);
                                }}
                                style={{
                                  padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  cursor: 'pointer',
                                  color: isSelected ? pc.color : 'rgba(255,255,255,0.5)',
                                  background: isSelected ? `${pc.color}18` : 'transparent',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `rgba(255,255,255,0.05)`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? `${pc.color}18` : 'transparent'; }}
                              >
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: pc.color, flexShrink: 0 }} />
                                {pc.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </MF>

                <MF label="Due">
                  <div style={{ position: 'relative', zIndex: panelDropdown === 'due' ? 200 : 1 }}>
                    <span
                      className="hive-editable"
                      onClick={() => setPanelDropdown(panelDropdown === 'due' ? null : 'due')}
                      style={{ color: isOverdue(selected) ? '#ef4444' : isDueToday(selected) ? '#f59e0b' : 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' }}
                    >{fmtDate(selected.due_date)}</span>

                    {panelDropdown === 'due' && (() => {
                      const today = new Date();
                      const currentDate = selected.due_date ? new Date(selected.due_date + 'T00:00:00') : today;
                      const viewYear = currentDate.getFullYear();
                      const viewMonth = currentDate.getMonth();
                      const firstDay = new Date(viewYear, viewMonth, 1).getDay();
                      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                      const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      const days: (number | null)[] = [];
                      for (let i = 0; i < firstDay; i++) days.push(null);
                      for (let d = 1; d <= daysInMonth; d++) days.push(d);

                      return (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                          padding: '12px', borderRadius: 12, width: 260,
                          background: 'rgba(15,22,38,0.98)',
                          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                          animation: 'hive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 10 }}>{monthName}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                              <div key={i} style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>
                            ))}
                            {days.map((day, i) => {
                              if (day === null) return <div key={`e-${i}`} />;
                              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const isSelected = selected.due_date === dateStr;
                              const isToday = dateStr === today.toISOString().split('T')[0];
                              return (
                                <div
                                  key={day}
                                  onClick={() => {
                                    updateItem(selected.id, { due_date: dateStr });
                                    setPanelDropdown(null);
                                  }}
                                  style={{
                                    padding: '5px 0', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                                    fontWeight: isSelected ? 600 : 400,
                                    color: isSelected ? 'rgba(245,185,30,0.95)' : isToday ? 'rgba(245,185,30,0.7)' : 'rgba(255,255,255,0.5)',
                                    background: isSelected ? 'rgba(245,185,30,0.15)' : 'transparent',
                                    border: isToday && !isSelected ? '1px solid rgba(245,185,30,0.25)' : '1px solid transparent',
                                    transition: 'all 150ms ease',
                                  }}
                                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >{day}</div>
                              );
                            })}
                          </div>
                          {/* Quick date shortcuts */}
                          <div style={{ display: 'flex', gap: 4, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                            {[
                              { label: 'Today', offset: 0 },
                              { label: 'Tomorrow', offset: 1 },
                              { label: '+1 wk', offset: 7 },
                              { label: 'None', offset: -1 },
                            ].map((shortcut) => (
                              <div
                                key={shortcut.label}
                                className="hive-chip"
                                onClick={() => {
                                  if (shortcut.offset === -1) {
                                    updateItem(selected.id, { due_date: null });
                                  } else {
                                    const d = new Date();
                                    d.setDate(d.getDate() + shortcut.offset);
                                    const ds = d.toISOString().split('T')[0];
                                    updateItem(selected.id, { due_date: ds });
                                  }
                                  setPanelDropdown(null);
                                }}
                                style={{
                                  flex: 1, padding: '4px 0', borderRadius: 6, fontSize: 10, fontWeight: 500,
                                  textAlign: 'center',
                                  background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}
                              >{shortcut.label}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </MF>
                <MF label="Module">
                  <div style={{ position: 'relative', zIndex: panelDropdown === 'module' ? 200 : 1 }}>
                    <span
                      className="hive-editable"
                      onClick={() => setPanelDropdown(panelDropdown === 'module' ? null : 'module')}
                      style={{ color: selected.module ? moduleConfig[selected.module]?.color : 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer' }}
                    >{selected.module ? moduleConfig[selected.module]?.label : 'None'}</span>

                    {panelDropdown === 'module' && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                        padding: '8px 10px', borderRadius: 12, minWidth: 200, maxHeight: 260, overflowY: 'auto',
                        background: 'rgba(15,22,38,0.98)',
                        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                        animation: 'hive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {allModules.map((m) => {
                            const mc = moduleConfig[m];
                            const isCurrent = selected.module === m;
                            return (
                              <div
                                key={m}
                                onClick={() => {
                                  updateItem(selected.id, { module: m });
                                  setPanelDropdown(null);
                                }}
                                style={{
                                  padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  cursor: 'pointer',
                                  color: isCurrent ? mc.color : 'rgba(255,255,255,0.5)',
                                  background: isCurrent ? `${mc.color}18` : 'transparent',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? `${mc.color}18` : 'transparent'; }}
                              >
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: mc.color, flexShrink: 0 }} />
                                {mc.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </MF>

                {/* Clickable Assignee */}
                <MF label="Assignee">
                  <div style={{ position: 'relative', zIndex: panelDropdown === 'assignee' ? 200 : 1 }}>
                    <span
                      className="hive-editable"
                      onClick={() => setPanelDropdown(panelDropdown === 'assignee' ? null : 'assignee')}
                      style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer' }}
                    >{selected.assignee_name}</span>

                    {/* Assignee dropdown */}
                    {panelDropdown === 'assignee' && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                        padding: '8px 10px', borderRadius: 12, minWidth: 200,
                        background: 'rgba(15,22,38,0.98)',
                        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                        animation: 'hive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {teamMembers.map((member) => {
                            const isSelected = selected.assigned_to === member.initials;
                            return (
                              <div
                                key={member.id}
                                onClick={() => {
                                  updateItem(selected.id, { assigned_to: member.initials, assignee_name: member.name });
                                  setPanelDropdown(null);
                                }}
                                style={{
                                  padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  cursor: 'pointer',
                                  color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                                  background: isSelected ? 'rgba(245,185,30,0.10)' : 'transparent',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `rgba(255,255,255,0.05)`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(245,185,30,0.10)' : 'transparent'; }}
                              >
                                <div style={{
                                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                  background: member.avatar_image ? `url(${member.avatar_image}) center/cover no-repeat` : member.avatar_color,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 9, fontWeight: 600, color: '#fff', overflow: 'hidden',
                                }}>{!member.avatar_image && member.initials}</div>
                                {member.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </MF>

                <MF label="Layer"><span style={{ color: 'rgba(245,185,30,0.8)', fontSize: 13 }}>{strataConfig[getStratum(selected)].label}</span></MF>
                <MF label="Comments"><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{selected.comment_count} comment{selected.comment_count !== 1 ? 's' : ''}</span></MF>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', marginBottom: 8 }}>Description</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', fontWeight: 300, margin: 0 }}>
                  {selected.description || 'No description provided.'}
                </p>
              </div>

              {/* Sub-steps / Checklist (toggleable + add new) */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)' }}>
                    Sub-steps {selected.checklist.length > 0 && `(${selected.checklist.filter(c => c.completed).length}/${selected.checklist.length})`}
                  </div>
                </div>
                {selected.checklist.length > 0 && (
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(selected.checklist.filter(c => c.completed).length / selected.checklist.length) * 100}%`, background: 'linear-gradient(90deg, rgba(245,185,30,0.5), rgba(245,185,30,0.25))', borderRadius: 2, transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                )}
                {selected.checklist.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      const newChecklist = selected.checklist.map(item =>
                        item.id === c.id ? { ...item, completed: !item.completed } : item
                      );
                      updateItem(selected.id, { checklist: newChecklist });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                      borderRadius: 8, background: 'rgba(255,255,255,0.02)', marginBottom: 4,
                      cursor: 'pointer', transition: 'background 180ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: c.completed ? 'none' : '1px solid rgba(255,255,255,0.12)',
                      background: c.completed ? 'rgba(16,185,129,0.18)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#10b981',
                      transition: 'all 180ms ease',
                    }}>{c.completed ? '\u2713' : ''}</div>
                    <span style={{ fontSize: 13, color: c.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)', textDecoration: c.completed ? 'line-through' : 'none', transition: 'all 180ms ease' }}>{c.text}</span>
                  </div>
                ))}
                {/* Add sub-step input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: '1px dashed rgba(255,255,255,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'rgba(255,255,255,0.15)',
                  }}>+</div>
                  <input
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newChecklistText.trim()) {
                        const newStep = { id: `cl-${Date.now()}`, text: newChecklistText.trim(), completed: false };
                        updateItem(selected.id, { checklist: [...selected.checklist, newStep] });
                        setNewChecklistText('');
                      }
                    }}
                    placeholder="Add a sub-step... (Enter to save)"
                    style={{
                      flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 12,
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Notes (timestamped) */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', marginBottom: 10 }}>
                  Notes {selected.notes.length > 0 && `(${selected.notes.length})`}
                </div>
                {selected.notes.map((note) => (
                  <div key={note.id} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    marginBottom: 6,
                  }}>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: '0 0 6px', fontWeight: 300 }}>{note.text}</p>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
                      {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(note.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {/* Add note input */}
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newNoteText.trim()) {
                        const newNote = { id: `note-${Date.now()}`, text: newNoteText.trim(), created_at: new Date().toISOString() };
                        updateItem(selected.id, { notes: [...selected.notes, newNote] });
                        setNewNoteText('');
                      }
                    }}
                    placeholder="Add a note... (Enter to save)"
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Quick Add Modal (Cmd+K) ─────────────────────────────────────── */}
      {quickAddOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setQuickAddOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.4)',
            }}
          />

          {/* Modal */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%', zIndex: 50,
            transform: 'translate(-50%, -50%)',
            width: 520, maxHeight: '85vh', borderRadius: 18,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            animation: 'hive-modal-in 250ms cubic-bezier(0.16,1,0.3,1) forwards',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Glass sheen */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)',
              borderRadius: 18,
            }} />

            <div className="hive-scroll" style={{ position: 'relative', zIndex: 1, padding: '22px 28px 24px', overflowY: 'auto', flex: 1 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Quick Add</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>&#8984;K</span>
                  <button onClick={() => setQuickAddOpen(false)} style={{
                    width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>&times;</button>
                </div>
              </div>

              {/* Title input */}
              <input
                ref={quickAddInputRef}
                value={qaTitle}
                onChange={(e) => setQaTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitQuickAdd(); } }}
                placeholder={'Type a title... (try "bug: Fix something")'}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 15, fontWeight: 400,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.9)', fontFamily: 'inherit', outline: 'none',
                  marginBottom: 14,
                }}
              />

              {/* Description textarea */}
              <textarea
                value={qaDescription}
                onChange={(e) => setQaDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 400,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none',
                  marginBottom: 14, resize: 'vertical', minHeight: 48,
                }}
              />

              {/* Kind + Priority on one row */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.18)', marginBottom: 6 }}>Kind</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {allKinds.map((k) => {
                      const active = qaKind === k;
                      const kc = kindConfig[k];
                      return (
                        <div key={k} className="hive-chip" onClick={() => setQaKind(k)} style={{
                          padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                          background: active ? kc.bg : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${active ? `${kc.color}44` : 'rgba(255,255,255,0.06)'}`,
                          color: active ? kc.color : 'rgba(255,255,255,0.3)',
                        }}>{kc.label}</div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.18)', marginBottom: 6 }}>Priority</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(['urgent', 'high', 'normal', 'low'] as const).map((p) => {
                      const active = qaPriority === p;
                      const pc = priorityConfig[p];
                      return (
                        <div key={p} className="hive-chip" onClick={() => setQaPriority(p)} style={{
                          padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: active ? pc.bg : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${active ? `${pc.color}44` : 'rgba(255,255,255,0.06)'}`,
                          color: active ? pc.color : 'rgba(255,255,255,0.3)',
                        }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: active ? pc.color : 'rgba(255,255,255,0.15)' }} />
                          {pc.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Module chips */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.18)', marginBottom: 6 }}>Module</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {allModules.map((m) => {
                    const active = qaModule === m;
                    const mc = moduleConfig[m];
                    return (
                      <div key={m} className="hive-chip" onClick={() => setQaModule(m)} style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 500,
                        background: active ? `${mc.color}18` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? `${mc.color}44` : 'rgba(255,255,255,0.06)'}`,
                        color: active ? mc.color : 'rgba(255,255,255,0.3)',
                      }}>{mc.label}</div>
                    );
                  })}
                </div>
              </div>

              {/* Sub-steps */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.18)', marginBottom: 6 }}>Sub-steps</div>
                {qaChecklist.map((step, idx) => (
                  <div key={step.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                    borderRadius: 6, background: 'rgba(255,255,255,0.02)', marginBottom: 3,
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      border: '1px solid rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: 'rgba(255,255,255,0.3)',
                    }}>{idx + 1}</div>
                    <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{step.text}</span>
                    <button
                      onClick={() => setQaChecklist(prev => prev.filter(s => s.id !== step.id))}
                      style={{
                        width: 18, height: 18, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)',
                        fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >&times;</button>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    value={qaNewStep}
                    onChange={(e) => setQaNewStep(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && qaNewStep.trim()) {
                        e.preventDefault();
                        e.stopPropagation();
                        setQaChecklist(prev => [...prev, { id: `qa-${Date.now()}`, text: qaNewStep.trim(), completed: false }]);
                        setQaNewStep('');
                      }
                    }}
                    placeholder="Add a sub-step... (Enter)"
                    style={{
                      flex: 1, padding: '5px 10px', borderRadius: 6, fontSize: 11,
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={submitQuickAdd}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                  background: qaTitle.trim() ? 'rgba(245,185,30,0.15)' : 'rgba(255,255,255,0.03)',
                  color: qaTitle.trim() ? 'rgba(245,185,30,0.9)' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${qaTitle.trim() ? 'rgba(245,185,30,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 200ms',
                }}
              >
                Create Item
              </button>
              </div>
            </div>
          </>
        )}
    </>
  );
}
