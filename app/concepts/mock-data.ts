export interface MockItem {
  id: string;
  title: string;
  kind: 'bug' | 'feature' | 'task' | 'idea';
  status: 'inbox' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'urgent' | 'high' | 'normal' | 'low' | 'none';
  due_date: string | null;
  module: string | null;
  assigned_to: string;
  assignee_name: string;
  description: string;
  checklist: { id: string; text: string; completed: boolean }[];
  notes: { id: string; text: string; created_at: string }[];
  comment_count: number;
  status_changed_at?: string;
}

export const mockItems: MockItem[] = [
  {
    id: 'BB-101',
    title: 'Fix authentication redirect loop on Safari',
    kind: 'bug',
    status: 'in_progress',
    priority: 'urgent',
    due_date: '2026-02-03',
    module: 'recruitbee',
    assigned_to: 'AK',
    assignee_name: 'Alex Kilgo',
    description: 'Users on Safari 18.x are experiencing an infinite redirect loop when authenticating via SSO. The session cookie is not being set correctly due to ITP restrictions. Need to migrate to partitioned cookies.',
    checklist: [
      { id: 'c1', text: 'Reproduce on Safari 18.2', completed: true },
      { id: 'c2', text: 'Test partitioned cookie approach', completed: true },
      { id: 'c3', text: 'Deploy fix to staging', completed: false },
      { id: 'c4', text: 'QA sign-off', completed: false },
    ],
    notes: [
      { id: 'n1', text: 'Confirmed ITP is the root cause — partitioned cookies fix tested locally', created_at: '2026-02-03T14:22:00Z' },
      { id: 'n2', text: 'Staging deploy blocked by CI — need to fix flaky test first', created_at: '2026-02-04T09:15:00Z' },
    ],
    comment_count: 5,
  },
  {
    id: 'BB-102',
    title: 'Implement voice interview scoring algorithm',
    kind: 'feature',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-02-05',
    module: 'recruitbee',
    assigned_to: 'JD',
    assignee_name: 'Jamie Drake',
    description: 'Build the psychometric scoring pipeline for Retell voice interviews. Must handle tone analysis, keyword extraction, and response timing metrics.',
    checklist: [
      { id: 'c1', text: 'Define scoring rubric with HR team', completed: true },
      { id: 'c2', text: 'Integrate Retell transcript API', completed: false },
      { id: 'c3', text: 'Build scoring weights engine', completed: false },
    ],
    notes: [],
    comment_count: 12,
  },
  {
    id: 'BB-103',
    title: 'Dashboard load time exceeds 4s on mobile',
    kind: 'bug',
    status: 'todo',
    priority: 'high',
    due_date: '2026-02-06',
    module: 'nurturebee',
    assigned_to: 'MR',
    assignee_name: 'Morgan Riley',
    description: 'The NurtureBee dashboard takes over 4 seconds to render on mid-range mobile devices. Profiling shows excessive re-renders in the retention chart component.',
    checklist: [],
    notes: [],
    comment_count: 3,
  },
  {
    id: 'BB-104',
    title: 'Add bulk SMS campaign scheduling',
    kind: 'feature',
    status: 'in_review',
    priority: 'normal',
    due_date: '2026-02-07',
    module: 'nurturebee',
    assigned_to: 'SP',
    assignee_name: 'Sam Park',
    description: 'Allow franchise owners to schedule SMS campaigns to employee segments. Must respect timezone-aware delivery windows and opt-out lists.',
    checklist: [
      { id: 'c1', text: 'Design campaign builder UI', completed: true },
      { id: 'c2', text: 'Build scheduling API', completed: true },
      { id: 'c3', text: 'Integrate Twilio send', completed: true },
      { id: 'c4', text: 'Add timezone handling', completed: false },
    ],
    notes: [],
    comment_count: 8,
  },
  {
    id: 'BB-105',
    title: 'Explore AI-powered resume pre-screening',
    kind: 'idea',
    status: 'inbox',
    priority: 'normal',
    due_date: null,
    module: 'recruitbee',
    assigned_to: 'AK',
    assignee_name: 'Alex Kilgo',
    description: 'Investigate using LLM-based resume parsing to auto-score candidates before the voice interview stage. Could reduce manual screening time by 70%.',
    checklist: [],
    notes: [],
    comment_count: 2,
  },
  {
    id: 'BB-106',
    title: 'RLS policy allows cross-org data leak in reports',
    kind: 'bug',
    status: 'todo',
    priority: 'urgent',
    due_date: '2026-02-04',
    module: 'pulsebee',
    assigned_to: 'JD',
    assignee_name: 'Jamie Drake',
    description: 'The aggregated reports endpoint is not properly filtering by organization_id when generating cross-franchise comparisons. Critical security fix needed.',
    checklist: [
      { id: 'c1', text: 'Audit all report queries', completed: false },
      { id: 'c2', text: 'Add RLS integration tests', completed: false },
    ],
    notes: [],
    comment_count: 7,
  },
  {
    id: 'BB-107',
    title: 'Design onboarding flow for new franchisees',
    kind: 'task',
    status: 'in_progress',
    priority: 'normal',
    due_date: '2026-02-10',
    module: 'receptionbee',
    assigned_to: 'MR',
    assignee_name: 'Morgan Riley',
    description: 'Create a guided onboarding experience for new franchise locations including Retell agent setup, team import, and initial configuration.',
    checklist: [
      { id: 'c1', text: 'Map onboarding steps', completed: true },
      { id: 'c2', text: 'Design step-by-step UI', completed: false },
      { id: 'c3', text: 'Build Retell setup wizard', completed: false },
    ],
    notes: [],
    comment_count: 4,
  },
  {
    id: 'BB-108',
    title: 'Migrate cron jobs to n8n workflows',
    kind: 'task',
    status: 'todo',
    priority: 'normal',
    due_date: '2026-02-12',
    module: 'operations',
    assigned_to: 'SP',
    assignee_name: 'Sam Park',
    description: 'Move all legacy cron-based automation (report generation, data sync, cleanup) to n8n workflows for better observability and error handling.',
    checklist: [],
    notes: [],
    comment_count: 1,
  },
  {
    id: 'BB-109',
    title: 'Add real-time typing indicators to team chat',
    kind: 'feature',
    status: 'in_progress',
    priority: 'low',
    due_date: '2026-02-14',
    module: 'general',
    assigned_to: 'AK',
    assignee_name: 'Alex Kilgo',
    description: 'Implement Supabase real-time presence to show when team members are typing in work item comments.',
    checklist: [
      { id: 'c1', text: 'Set up Supabase presence channel', completed: true },
      { id: 'c2', text: 'Build typing indicator component', completed: false },
    ],
    notes: [],
    comment_count: 0,
  },
  {
    id: 'BB-110',
    title: 'Calendar view shows wrong week for DST transitions',
    kind: 'bug',
    status: 'done',
    priority: 'normal',
    due_date: '2026-02-01',
    module: 'general',
    assigned_to: 'MR',
    assignee_name: 'Morgan Riley',
    description: 'The weekly calendar view miscalculates week boundaries during daylight saving time transitions, causing items to appear on wrong days.',
    checklist: [
      { id: 'c1', text: 'Fix date-fns timezone handling', completed: true },
      { id: 'c2', text: 'Add DST edge case tests', completed: true },
    ],
    notes: [],
    comment_count: 3,
  },
  {
    id: 'BB-111',
    title: 'Build franchise performance comparison dashboard',
    kind: 'feature',
    status: 'todo',
    priority: 'high',
    due_date: '2026-02-08',
    module: 'pulsebee',
    assigned_to: 'JD',
    assignee_name: 'Jamie Drake',
    description: 'Create a side-by-side franchise comparison view showing retention rates, hiring velocity, and employee satisfaction scores across locations.',
    checklist: [],
    notes: [],
    comment_count: 6,
  },
  {
    id: 'BB-112',
    title: 'Reduce Supabase query count on team page',
    kind: 'task',
    status: 'in_review',
    priority: 'normal',
    due_date: '2026-02-05',
    module: 'general',
    assigned_to: 'AK',
    assignee_name: 'Alex Kilgo',
    description: 'The team page fires 14 separate queries on load. Consolidate into 3 parallel queries using Supabase joins and materialized views.',
    checklist: [
      { id: 'c1', text: 'Profile current query pattern', completed: true },
      { id: 'c2', text: 'Create materialized view', completed: true },
      { id: 'c3', text: 'Benchmark improvement', completed: false },
    ],
    notes: [],
    comment_count: 2,
  },
  {
    id: 'BB-113',
    title: 'Retell agent drops calls after 8 minutes',
    kind: 'bug',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-02-05',
    module: 'receptionbee',
    assigned_to: 'SP',
    assignee_name: 'Sam Park',
    description: 'Voice agent calls are being terminated at the 8-minute mark. Likely a WebSocket timeout issue on the proxy layer. Need to implement keep-alive pings.',
    checklist: [
      { id: 'c1', text: 'Add WebSocket keep-alive', completed: true },
      { id: 'c2', text: 'Test with 15-min calls', completed: false },
    ],
    notes: [],
    comment_count: 9,
  },
  {
    id: 'BB-114',
    title: 'Add dark mode toggle for client-facing portal',
    kind: 'idea',
    status: 'inbox',
    priority: 'low',
    due_date: null,
    module: 'beesuite_web',
    assigned_to: 'MR',
    assignee_name: 'Morgan Riley',
    description: 'The client-facing job application portal currently only has light mode. Consider adding a dark mode option that respects system preferences.',
    checklist: [],
    notes: [],
    comment_count: 1,
  },
  {
    id: 'BB-115',
    title: 'Write API documentation for webhook endpoints',
    kind: 'task',
    status: 'todo',
    priority: 'low',
    due_date: '2026-02-20',
    module: 'operations',
    assigned_to: 'JD',
    assignee_name: 'Jamie Drake',
    description: 'Document all webhook endpoints (Retell callbacks, n8n triggers, Stripe events) with payload schemas, auth requirements, and retry behavior.',
    checklist: [],
    notes: [],
    comment_count: 0,
  },
];

export const priorityConfig = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  normal: { label: 'Normal', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  low: { label: 'Low', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  none: { label: 'None', color: '#475569', bg: 'rgba(71,85,105,0.12)' },
};

export const kindConfig = {
  bug: { label: 'Bug', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  feature: { label: 'Feature', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  task: { label: 'Task', color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  idea: { label: 'Idea', color: '#a855f7', bg: 'rgba(168,85,247,0.10)' },
};

export const statusConfig = {
  inbox: { label: 'Inbox', color: '#64748b' },
  todo: { label: 'Todo', color: '#3b82f6' },
  in_progress: { label: 'In Progress', color: '#eab308' },
  in_review: { label: 'In Review', color: '#a855f7' },
  done: { label: 'Done', color: '#10b981' },
};

export const moduleConfig: Record<string, { label: string; color: string }> = {
  recruitbee: { label: 'RecruitBee', color: '#3b82f6' },
  nurturebee: { label: 'NurtureBee', color: '#10b981' },
  receptionbee: { label: 'ReceptionBee', color: '#f59e0b' },
  pulsebee: { label: 'PulseBee', color: '#06b6d4' },
  beesuite_web: { label: 'BeeSuite', color: '#8b5cf6' },
  operations: { label: 'Operations', color: '#64748b' },
  general: { label: 'General', color: '#94a3b8' },
  marketing: { label: 'Marketing', color: '#ec4899' },
  sales: { label: 'Sales', color: '#f97316' },
};

export interface MockProject {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  icon: string;
}

export const mockProjects: MockProject[] = [
  { id: 'proj-1', name: 'RecruitBee', key: 'recruitbee', description: 'AI-powered hiring pipeline with Retell voice interviews, resume screening, and candidate scoring.', color: '#3b82f6', icon: 'R' },
  { id: 'proj-2', name: 'NurtureBee', key: 'nurturebee', description: 'Employee retention and engagement platform with SMS campaigns, pulse surveys, and sentiment tracking.', color: '#10b981', icon: 'N' },
  { id: 'proj-3', name: 'ReceptionBee', key: 'receptionbee', description: 'Virtual receptionist powered by Retell voice agents for franchise locations and onboarding flows.', color: '#f59e0b', icon: 'X' },
  { id: 'proj-4', name: 'PulseBee', key: 'pulsebee', description: 'Franchise analytics dashboard with cross-location performance comparison and retention metrics.', color: '#06b6d4', icon: 'P' },
  { id: 'proj-5', name: 'BeeSuite Web', key: 'beesuite_web', description: 'Client-facing job portal and application flow with dark mode support and mobile optimization.', color: '#8b5cf6', icon: 'B' },
  { id: 'proj-6', name: 'Operations', key: 'operations', description: 'Internal tooling, n8n workflow automation, cron migration, and infrastructure management.', color: '#64748b', icon: 'O' },
  { id: 'proj-7', name: 'General', key: 'general', description: 'Cross-cutting concerns including team chat, calendar, notifications, and shared UI components.', color: '#94a3b8', icon: 'G' },
];

export interface MockTeamMember {
  id: string;
  initials: string;
  name: string;
  role: string;
  avatar_color: string;
  avatar_image?: string;
}

export const mockTeamMembers: MockTeamMember[] = [
  { id: 'tm-1', initials: 'AK', name: 'Alex Kilgo', role: 'Lead Engineer', avatar_color: '#f59e0b' },
  { id: 'tm-2', initials: 'JD', name: 'Jamie Drake', role: 'Senior Developer', avatar_color: '#3b82f6' },
  { id: 'tm-3', initials: 'MR', name: 'Morgan Riley', role: 'Designer/Developer', avatar_color: '#10b981' },
  { id: 'tm-4', initials: 'SP', name: 'Sam Park', role: 'Backend Engineer', avatar_color: '#8b5cf6' },
];
