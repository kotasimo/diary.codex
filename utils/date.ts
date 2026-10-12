import { type Entry } from "@/types/diary";

export const dayNames = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDateValue(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const slash = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slash)
    return new Date(Number(slash[1]), Number(slash[2]) - 1, Number(slash[3]));
  const japanese = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (japanese)
    return new Date(
      Number(japanese[1]),
      Number(japanese[2]) - 1,
      Number(japanese[3]),
    );
  const match = value.match(/(\d+)月(\d+)日/);
  return match
    ? new Date(2026, Number(match[1]) - 1, Number(match[2]))
    : new Date(2026, 9, 5);
}

export function normalizeDateValue(value: string) {
  return toDateKey(parseDateValue(value));
}

export function mondayOf(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

export function buildWeek(start: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );
    return [toDateKey(date), dayNames[date.getDay()]] as const;
  });
}

export function withDerivedEntryDay(
  entry: Omit<Entry, "day" | "updatedAt" | "views">,
): Entry {
  return {
    ...entry,
    day: dayNames[parseDateValue(entry.date).getDay()],
    updatedAt: "",
    views: 0,
  };
}
