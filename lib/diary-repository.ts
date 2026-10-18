import { getSupabaseClient } from "@/app/lib/supabase";
import type { Entry } from "@/types/diary";
import { normalizeDateValue } from "@/utils/date";

export async function loadDiaryEntries(userId: string): Promise<Entry[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabaseの接続設定がありません。");
  const { data, error } = await supabase.from("user_diary_entries")
    .select("date,day,title,content,image,updated_at,views")
    .eq("user_id", userId).order("date");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    date: normalizeDateValue(row.date), day: row.day,
    title: row.title ?? undefined, content: row.content,
    image: row.image ?? undefined, updatedAt: row.updated_at, views: row.views,
  }));
}

export async function saveDiaryEntry(entry: Entry, userId: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabaseの接続設定がありません。" };
  const { error } = await supabase.from("user_diary_entries").upsert({
    user_id: userId, date: normalizeDateValue(entry.date), day: entry.day,
    title: entry.title ?? null, content: entry.content,
    image: entry.image ?? null, updated_at: entry.updatedAt, views: entry.views,
  }, { onConflict: "user_id,date" });
  return error ? { ok: false, message: error.message } : { ok: true };
}
