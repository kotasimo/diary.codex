import { getSupabaseClient } from "@/app/lib/supabase";
import { initialEntries } from "@/lib/diary-data";
import type { Entry } from "@/types/diary";
import { normalizeDateValue } from "@/utils/date";

const entriesKey = "hibi-diary-entries";

export async function loadDiaryEntries(): Promise<Entry[] | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .order("date");
    if (error) return null;
    const byDate = new Map<string, Entry>();
    for (const row of data ?? []) {
      const date = normalizeDateValue(row.date);
      byDate.set(date, { ...row, date, updatedAt: row.updated_at } as Entry);
    }
    for (const seed of initialEntries) {
      const existing = byDate.get(seed.date);
      if (!existing) {
        const { updatedAt, ...seedData } = seed;
        const { error: seedError } = await supabase
          .from("diary_entries")
          .insert({ ...seedData, updated_at: updatedAt });
        if (!seedError) byDate.set(seed.date, seed);
      } else {
        const metadata = {
          title: existing.title || seed.title,
          image: existing.image || seed.image,
        };
        if (
          metadata.title !== existing.title ||
          metadata.image !== existing.image
        ) {
          const { error: metadataError } = await supabase
            .from("diary_entries")
            .update(metadata)
            .eq("date", existing.date);
          if (!metadataError)
            byDate.set(seed.date, { ...existing, ...metadata });
        }
      }
    }
    return [...byDate.values()];
  }

  const savedEntries = window.localStorage.getItem(entriesKey);
  if (!savedEntries) return null;
  try {
    const saved = JSON.parse(savedEntries) as Entry[];
    const merged = saved.map((entry) => {
      const seed = initialEntries.find((item) => item.date === entry.date);
      return !entry.image && seed?.image
        ? { ...entry, image: seed.image }
        : entry;
    });
    window.localStorage.setItem(entriesKey, JSON.stringify(merged));
    return merged;
  } catch {
    window.localStorage.removeItem(entriesKey);
    return null;
  }
}

export async function saveDiaryEntry(
  entry: Entry,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: true };
  const { updatedAt, ...entryData } = entry;
  const { error } = await supabase
    .from("diary_entries")
    .upsert(
      {
        ...entryData,
        date: normalizeDateValue(entry.date),
        updated_at: updatedAt,
      },
      { onConflict: "date" },
    );
  if (!error) return { ok: true };
  const message = [
    error.message,
    error.details,
    error.hint,
    error.code && `code: ${error.code}`,
  ]
    .filter(Boolean)
    .join(" / ");
  console.error("Supabase save failed", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
  return { ok: false, message };
}

export function persistLocalDiaryEntries(entries: Entry[]) {
  if (!getSupabaseClient())
    window.localStorage.setItem(entriesKey, JSON.stringify(entries));
}
