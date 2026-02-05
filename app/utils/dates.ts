/**
 * Natural language date parser.
 * No heavy libraries — regex-based parsing for common patterns.
 *
 * Supported:
 *   "today"                → current date
 *   "tomorrow"             → current date + 1
 *   "next monday"          → next occurrence of that weekday
 *   "jan 15" / "feb 3"     → date in current year (or next if past)
 *   "in 3 days"            → relative offset (days)
 *   "in 2 weeks"           → relative offset (weeks)
 *
 * Returns YYYY-MM-DD string or null if unparseable.
 */

const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseNaturalDate(input: string): string | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // "today"
  if (text === 'today') {
    return formatDate(today);
  }

  // "tomorrow"
  if (text === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }

  // "yesterday"
  if (text === 'yesterday') {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  }

  // "next monday", "next friday", etc.
  const nextDayMatch = text.match(/^next\s+(\w+)$/);
  if (nextDayMatch) {
    const dayName = nextDayMatch[1];
    const targetDay = DAYS_OF_WEEK[dayName];
    if (targetDay !== undefined) {
      const d = new Date(today);
      const currentDay = d.getDay();
      let daysAhead = targetDay - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      d.setDate(d.getDate() + daysAhead);
      return formatDate(d);
    }
  }

  // "in 3 days", "in 2 weeks", "in 1 week"
  const relativeMatch = text.match(/^in\s+(\d+)\s+(day|days|week|weeks)$/);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const d = new Date(today);
    if (unit.startsWith('week')) {
      d.setDate(d.getDate() + amount * 7);
    } else {
      d.setDate(d.getDate() + amount);
    }
    return formatDate(d);
  }

  // "jan 15", "feb 3", "mar 20", "january 1"
  const monthDayMatch = text.match(/^(\w+)\s+(\d{1,2})$/);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1];
    const day = parseInt(monthDayMatch[2], 10);
    const month = MONTHS[monthName];
    if (month !== undefined && day >= 1 && day <= 31) {
      let year = today.getFullYear();
      const candidate = new Date(year, month, day);
      // If the date is already past this year, use next year
      if (candidate < today) {
        year += 1;
      }
      const d = new Date(year, month, day);
      return formatDate(d);
    }
  }

  return null;
}
