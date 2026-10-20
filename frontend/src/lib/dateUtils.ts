/**
 * Utility functions for date formatting, relative time calculation,
 * and follow-up status determination in local timezone.
 */

export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  const date = parseDate(dateStr);
  if (!date) return "";

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);

  if (diffInSec < 0) {
    // In future
    const absSec = Math.abs(diffInSec);
    const absMin = Math.floor(absSec / 60);
    const absHours = Math.floor(absMin / 60);
    const absDays = Math.floor(absHours / 24);

    if (absMin < 1) return "in moments";
    if (absMin < 60) return `in ${absMin}m`;
    if (absHours < 24) return `in ${absHours}h`;
    if (absDays === 1) return "tomorrow";
    return `in ${absDays} days`;
  }

  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHours = Math.floor(diffInMin / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInSec < 45) return "just now";
  if (diffInMin < 60) return `${diffInMin} minute${diffInMin === 1 ? "" : "s"} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  if (diffInDays === 1) return "yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  const date = parseDate(dateStr);
  if (!date) return "";

  // Example: "May 4, 10:30 AM"
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${month} ${day}, ${time}`;
}

export function formatTimeOnly(dateStr: string | null | undefined): string {
  const date = parseDate(dateStr);
  if (!date) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function isToday(dateStr: string | null | undefined): boolean {
  const date = parseDate(dateStr);
  if (!date) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  const date = parseDate(dateStr);
  if (!date) return false;

  const now = new Date();
  // Overdue if the date/time has passed AND it's not today's remaining time
  return date.getTime() < now.getTime();
}

export function isTodayOrOverdue(dateStr: string | null | undefined): {
  isToday: boolean;
  isOverdue: boolean;
} {
  const today = isToday(dateStr);
  const overdue = isOverdue(dateStr);
  return {
    isToday: today,
    isOverdue: overdue && !today, // strictly overdue prior to today, or overdue if time past
  };
}
