// ============================================================
// BugBee 2.0 — TypeScript Types & Constants
// ============================================================

// ---- Union Types (NOT enums) ----

export type WorkItemKind = 'bug' | 'feature' | 'task' | 'idea';

export type WorkItemStatus = 'inbox' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'archived';

export type WorkItemPriority = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export type ProjectStatus = 'active' | 'completed' | 'archived';

export type Module =
  | 'receptionbee'
  | 'recruitbee'
  | 'nurturebee'
  | 'pulsebee'
  | 'beesuite_web'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'general';

// ---- Interfaces ----

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description: string | null;
  kind: WorkItemKind;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  due_date: string | null;
  project_id: string | null;
  project?: { id: string; name: string; color: string | null };
  module: Module | null;
  assigned_to: string | null;
  assignee?: TeamMember;
  created_by: string | null;
  creator?: TeamMember;
  sort_order: number;
  checklist: ChecklistItem[];
  comment_count?: number;
  attachment_count?: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  archived_at: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  module: Module | null;
  status: ProjectStatus;
  color: string | null;
  created_by: string | null;
  item_count?: number;
  completed_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  work_item_id: string;
  author_id: string | null;
  author?: TeamMember;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  item_type: string;
  item_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  actor_name: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
}

export type MyFocusResponse = {
  overdue: WorkItem[];
  due_today: WorkItem[];
  due_this_week: WorkItem[];
  high_priority: WorkItem[];
  in_progress: WorkItem[];
  other: WorkItem[];
  recently_done: WorkItem[];
};

// ---- Constants ----

export const MODULES = [
  { value: 'receptionbee', label: 'ReceptionBee', shortLabel: 'Reception', color: 'bg-blue-500' },
  { value: 'recruitbee', label: 'RecruitBee', shortLabel: 'Recruit', color: 'bg-green-500' },
  { value: 'nurturebee', label: 'NurtureBee', shortLabel: 'Nurture', color: 'bg-purple-500' },
  { value: 'pulsebee', label: 'PulseBee', shortLabel: 'Pulse', color: 'bg-orange-500' },
  { value: 'beesuite_web', label: 'BeeSuite Web', shortLabel: 'BeeSuite', color: 'bg-cyan-500' },
  { value: 'marketing', label: 'Marketing', shortLabel: 'Marketing', color: 'bg-pink-500' },
  { value: 'sales', label: 'Sales', shortLabel: 'Sales', color: 'bg-amber-500' },
  { value: 'operations', label: 'Operations', shortLabel: 'Ops', color: 'bg-teal-500' },
  { value: 'general', label: 'General', shortLabel: 'General', color: 'bg-slate-500' },
] as const;

export const PRIORITY_CONFIG: Record<WorkItemPriority, { dot: string; bg: string }> = {
  urgent: { dot: 'bg-red-500', bg: 'bg-red-500/10' },
  high: { dot: 'bg-orange-500', bg: 'bg-orange-500/10' },
  normal: { dot: 'bg-blue-500', bg: 'bg-blue-500/10' },
  low: { dot: 'bg-slate-400', bg: 'bg-slate-400/10' },
  none: { dot: 'bg-slate-600', bg: 'transparent' },
};

export const KIND_CONFIG: Record<WorkItemKind, { label: string; textColor: string; bg: string }> = {
  bug: { label: 'bug', textColor: 'text-red-400', bg: 'bg-red-500/10' },
  feature: { label: 'feature', textColor: 'text-blue-400', bg: 'bg-blue-500/10' },
  task: { label: 'task', textColor: 'text-green-400', bg: 'bg-green-500/10' },
  idea: { label: 'idea', textColor: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

export const STATUS_CONFIG: Record<WorkItemStatus, { label: string; textColor: string; dotColor: string; bg: string }> = {
  inbox: { label: 'Inbox', textColor: 'text-slate-400', dotColor: 'bg-slate-400', bg: 'bg-slate-400/10' },
  todo: { label: 'Todo', textColor: 'text-blue-400', dotColor: 'bg-blue-400', bg: 'bg-blue-500/10' },
  in_progress: { label: 'In Progress', textColor: 'text-yellow-400', dotColor: 'bg-yellow-400', bg: 'bg-yellow-500/10' },
  in_review: { label: 'In Review', textColor: 'text-purple-400', dotColor: 'bg-purple-400', bg: 'bg-purple-500/10' },
  done: { label: 'Done', textColor: 'text-green-400', dotColor: 'bg-green-400', bg: 'bg-green-500/10' },
  archived: { label: 'Archived', textColor: 'text-slate-500', dotColor: 'bg-slate-500', bg: 'bg-slate-500/10' },
};
