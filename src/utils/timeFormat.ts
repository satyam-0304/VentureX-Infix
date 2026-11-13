/**
 * LURNIX Unified Timestamp & Date Formatting Utility
 * Standardizes time and date presentation across the entire learning workspace.
 */

/**
 * Formats video playback position or duration in seconds.
 * - Under 1 hour: MM:SS (e.g., "14:05", "00:42")
 * - 1 hour or above: HH:MM:SS (e.g., "01:14:05")
 */
export function formatVideoTime(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

/**
 * Formats a timestamp range for lectures/chapters (e.g. "00:00 - 04:00" or "01:00:00 - 01:15:30")
 */
export function formatVideoRange(startSec: number, endSec: number): string {
  return `${formatVideoTime(startSec)} - ${formatVideoTime(endSec)}`;
}

/**
 * Formats a date into a clean, readable representation: e.g. "14 Nov 2026"
 */
export function formatDate(input: number | string | Date | undefined | null): string {
  if (!input) return 'Recent';
  const date = parseDateInput(input);
  if (isNaN(date.getTime())) return 'Recent';

  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats relative time for learning activity feeds:
 * - "Today"
 * - "Yesterday"
 * - "2 days ago", "5 days ago"
 * - Otherwise "14 Nov 2026"
 */
export function formatRelativeDate(input: number | string | Date | undefined | null): string {
  if (!input) return 'Just now';
  const date = parseDateInput(input);
  if (isNaN(date.getTime())) return 'Recent';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const diffDays = Math.round((todayStart - targetStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Check if within last 60 minutes
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays >= 7 && diffDays < 14) {
    return '1 week ago';
  }

  return formatDate(date);
}

/**
 * Formats learning duration in human-readable terms: e.g. "45m", "1h 15m", "4.2 hrs"
 */
export function formatDurationHuman(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  const totalMins = Math.round(seconds / 60);

  if (totalMins < 60) {
    return `${totalMins} min`;
  }

  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  if (remainingMins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Parses date inputs reliably whether epoch ms, epoch seconds (if < 10000000000), ISO string, or Date.
 */
function parseDateInput(input: number | string | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'number') {
    // If timestamp is in seconds (10 digits), convert to ms
    const ms = input < 10000000000 ? input * 1000 : input;
    return new Date(ms);
  }
  return new Date(input);
}
