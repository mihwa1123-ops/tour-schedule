const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function isMonday(date: Date): boolean {
  return date.getDay() === 1;
}

export function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()} (${getDayName(date)})`;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
