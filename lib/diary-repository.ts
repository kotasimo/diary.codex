import { initialEntries } from "@/lib/diary-data";
import type { Entry } from "@/types/diary";

const entriesKey = "hibi-diary-entries";

export async function loadDiaryEntries(): Promise<Entry[]> {
  try {
    const saved = window.localStorage.getItem(entriesKey);
    return saved ? JSON.parse(saved) as Entry[] : initialEntries;
  } catch {
    window.localStorage.removeItem(entriesKey);
    return initialEntries;
  }
}

export async function saveDiaryEntry(entry: Entry): Promise<{ ok: boolean; message?: string }> {
  try {
    const current = await loadDiaryEntries();
    const entries = [...current.filter((item) => item.date !== entry.date), entry];
    window.localStorage.setItem(entriesKey, JSON.stringify(entries));
    return { ok: true };
  } catch {
    return { ok: false, message: "ブラウザーに日記を保存できませんでした。" };
  }
}
