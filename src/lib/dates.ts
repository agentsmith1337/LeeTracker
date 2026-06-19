export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function addWeeks(weeks: number): string {
  return addDays(weeks * 7);
}

export function addMonths(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return toDateString(date);
}

export function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isDueToday(revisionDate: string): boolean {
  return revisionDate <= todayString();
}

export function isOverdue(revisionDate: string): boolean {
  return revisionDate < todayString();
}

export function daysUntil(revisionDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = revisionDate.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}