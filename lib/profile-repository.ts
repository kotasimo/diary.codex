import { getSupabaseClient } from "@/app/lib/supabase";
import { upgradeProfile } from "@/lib/diary-data";
import type { Profile } from "@/types/diary";

export async function loadProfile(userId: string, email: string, username?: string): Promise<Profile> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabaseの接続設定がありません。");
  const { data, error } = await supabase.from("profiles").select("display_name,diary_title,subtitle,bio,avatar,header_image").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data) return upgradeProfile({ displayName: data.display_name, diaryTitle: data.diary_title, subtitle: data.subtitle, bio: data.bio, avatar: data.avatar ?? undefined, headerImage: data.header_image ?? undefined });
  const displayName = username?.trim() || email.split("@")[0] || "ユーザー";
  const profile = upgradeProfile({ displayName, diaryTitle: `${displayName}の日記`, subtitle: "何でもない毎日を、忘れないために。", bio: "日々の出来事を、ゆっくり記録しています。" });
  const result = await saveProfileForUser(userId, email, profile);
  if (!result.ok) throw new Error(result.message);
  return profile;
}

export async function saveProfileForUser(userId: string, email: string, profile: Profile): Promise<{ ok: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabaseの接続設定がありません。" };
  const { error } = await supabase.from("profiles").upsert({
    id: userId, email, display_name: profile.displayName, diary_title: profile.diaryTitle,
    subtitle: profile.subtitle, bio: profile.bio, avatar: profile.avatar ?? null,
    header_image: profile.headerImage ?? null,
  }, { onConflict: "id" });
  return error ? { ok: false, message: error.message } : { ok: true };
}
