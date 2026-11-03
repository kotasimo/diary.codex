import type { LifeRecord } from "@/types/diary";

const recordsKey = "hibi-life-records";

export function loadLifeRecords(): LifeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(recordsKey);
    return saved ? (JSON.parse(saved) as LifeRecord[]) : [];
  } catch {
    window.localStorage.removeItem(recordsKey);
    return [];
  }
}

export function saveLifeRecords(records: LifeRecord[]) {
  window.localStorage.setItem(recordsKey, JSON.stringify(records));
}
