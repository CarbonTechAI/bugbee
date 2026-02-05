import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';
import { validateToken, unauthorizedResponse } from '@/app/utils/auth';
import type { WorkItem, WorkItemPriority, MyFocusResponse } from '@/app/types';

const WORK_ITEM_SELECT = `
  *,
  assignee:team_members!work_items_assigned_to_fkey(id, name, email, role, avatar_url),
  creator:team_members!work_items_created_by_fkey(id, name, email, role, avatar_url),
  project:projects!work_items_project_id_fkey(id, name, color)
`;

const PRIORITY_ORDER: Record<WorkItemPriority, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
  none: 5,
};

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday
  const daysUntilEndOfWeek = 7 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilEndOfWeek);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(req: NextRequest) {
  if (!validateToken(req)) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Fetch all active items for this user (not archived, and done only if within 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch non-done, non-archived items assigned to this user
    const { data: activeItems, error: activeError } = await supabaseAdmin
      .from('work_items')
      .select(WORK_ITEM_SELECT)
      .eq('assigned_to', userId)
      .not('status', 'in', '("archived")')
      .neq('status', 'done')
      .order('created_at', { ascending: false });

    if (activeError) {
      return NextResponse.json({ error: `Internal server error: ${activeError.message}` }, { status: 500 });
    }

    // Fetch recently done items (completed within last 24 hours)
    const { data: recentlyDoneItems, error: doneError } = await supabaseAdmin
      .from('work_items')
      .select(WORK_ITEM_SELECT)
      .eq('assigned_to', userId)
      .eq('status', 'done')
      .gte('completed_at', twentyFourHoursAgo)
      .order('completed_at', { ascending: false });

    if (doneError) {
      return NextResponse.json({ error: `Internal server error: ${doneError.message}` }, { status: 500 });
    }

    const allItems = [...(activeItems || []), ...(recentlyDoneItems || [])] as WorkItem[];

    const now = new Date();
    const today = getStartOfDay(now);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const endOfWeek = getEndOfWeek(now);
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    // Group items into focus categories using the PRD algorithm
    const result: MyFocusResponse = {
      overdue: [],
      due_today: [],
      due_this_week: [],
      high_priority: [],
      in_progress: [],
      other: [],
      recently_done: [],
    };

    // Track which items have been placed so we don't duplicate
    const placed = new Set<string>();

    for (const item of allItems) {
      // Recently done items go to their own group
      if (item.status === 'done') {
        result.recently_done.push(item);
        placed.add(item.id);
        continue;
      }

      // Group 1: Overdue — due_date < today
      if (item.due_date && item.due_date < todayStr) {
        result.overdue.push(item);
        placed.add(item.id);
        continue;
      }

      // Group 2: Due today
      if (item.due_date && item.due_date === todayStr) {
        result.due_today.push(item);
        placed.add(item.id);
        continue;
      }

      // Group 3: Due this week (between tomorrow and end of week)
      if (item.due_date && item.due_date >= tomorrowStr && item.due_date <= endOfWeekStr) {
        result.due_this_week.push(item);
        placed.add(item.id);
        continue;
      }

      // Group 4: Urgent/High priority with no due date
      if (
        (item.priority === 'urgent' || item.priority === 'high') &&
        !item.due_date
      ) {
        result.high_priority.push(item);
        placed.add(item.id);
        continue;
      }

      // Group 5: In progress (not already caught above)
      if (item.status === 'in_progress') {
        result.in_progress.push(item);
        placed.add(item.id);
        continue;
      }

      // Group 6: Everything else (remaining todos)
      result.other.push(item);
      placed.add(item.id);
    }

    // Sort within each group by priority then due_date then created_at
    const sortByPriorityAndDate = (a: WorkItem, b: WorkItem) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Due date ascending (nulls last)
      if (a.due_date && b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;

      // Created at descending
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };

    result.overdue.sort(sortByPriorityAndDate);
    result.due_today.sort(sortByPriorityAndDate);
    result.due_this_week.sort(sortByPriorityAndDate);
    result.high_priority.sort(sortByPriorityAndDate);
    result.in_progress.sort(sortByPriorityAndDate);
    result.other.sort(sortByPriorityAndDate);
    // recently_done already sorted by completed_at desc from query

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
