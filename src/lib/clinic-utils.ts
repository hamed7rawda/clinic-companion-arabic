import { formatDistanceToNow, format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

export function timeAgo(date: string | Date) {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: ar });
  } catch {
    return "";
  }
}

export function formatDate(date: string | Date, fmt = "d MMMM yyyy") {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, fmt, { locale: ar });
  } catch {
    return String(date);
  }
}

export function formatTime(time: string) {
  // time format "HH:mm:ss" or "HH:mm"
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "م" : "ص";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${period}`;
}

export async function logActivity(
  supabase: any,
  action: string,
  description: string
) {
  try {
    await supabase.from("activity_log").insert({ action, description });
  } catch (e) {
    console.error("activity log failed", e);
  }
}
