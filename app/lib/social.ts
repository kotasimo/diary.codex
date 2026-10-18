import { getSupabaseClient } from "./supabase";

export type SocialAccount = {
  id?: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatar?: string;
};

export type SocialDiaryEntry = {
  date: string;
  title: string;
  content: string;
};

let accounts: SocialAccount[] = [];
const entriesByEmail: Record<string, SocialDiaryEntry[]> = {};

const followsKey = "hibi-local-follows";

export function getSocialAccounts(): SocialAccount[] {
  return accounts;
}

export function getSocialEntries(email: string): SocialDiaryEntry[] {
  return entriesByEmail[email] ?? [];
}

export async function hydrateSocialAccounts(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { data, error } = await supabase.from("profiles").select("id,email,display_name,bio,avatar");
  if (error) throw error;
  accounts = (data ?? []).map((row) => ({ id: row.id, email: row.email, username: row.display_name, displayName: row.display_name, bio: row.bio, avatar: row.avatar ?? undefined }));
}

export async function hydrateSocialEntries(account: SocialAccount): Promise<void> {
  if (!account.id) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { data, error } = await supabase.from("user_diary_entries").select("date,title,content").eq("user_id", account.id).order("date");
  if (error) throw error;
  entriesByEmail[account.email] = (data ?? []).map((row) => ({ date: row.date, title: row.title ?? "", content: row.content }));
}

function getFollowMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(followsKey);
    return saved ? JSON.parse(saved) as Record<string, string[]> : {};
  } catch {
    return {};
  }
}

export function getFollowing(email: string): string[] {
  return getFollowMap()[email] ?? [];
}

export function toggleFollowing(email: string, targetEmail: string): boolean {
  const map = getFollowMap();
  const current = new Set(map[email] ?? []);
  if (current.has(targetEmail)) current.delete(targetEmail);
  else current.add(targetEmail);
  map[email] = [...current];
  window.localStorage.setItem(followsKey, JSON.stringify(map));
  const supabase = getSupabaseClient();
  if (supabase) {
    if (current.has(targetEmail)) {
      void supabase.from("follows").upsert({ follower_email: email, following_email: targetEmail }, { onConflict: "follower_email,following_email" });
    } else {
      void supabase.from("follows").delete().eq("follower_email", email).eq("following_email", targetEmail);
    }
  }
  return current.has(targetEmail);
}

export function getFollowerCount(targetEmail: string): number {
  return Object.values(getFollowMap()).filter((following) => following.includes(targetEmail)).length;
}

export function getFollowingCount(email: string): number {
  return getFollowing(email).length;
}

export async function hydrateFollowing(email: string) {
  const supabase = getSupabaseClient();
  if (!supabase || !email || typeof window === "undefined") return;
  const { data } = await supabase.from("follows").select("following_email").eq("follower_email", email);
  const map = getFollowMap();
  map[email] = (data ?? []).map((row) => row.following_email);
  window.localStorage.setItem(followsKey, JSON.stringify(map));
}
