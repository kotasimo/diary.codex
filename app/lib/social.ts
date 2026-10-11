import { getLocalUsers } from "./auth";

export type SocialAccount = {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatar?: string;
};

const seedAccounts: SocialAccount[] = [
  { email: "haru@example.com", username: "haru", displayName: "haru", bio: "季節の変化を、短い言葉で記録しています。" },
  { email: "sora@example.com", username: "sora_note", displayName: "sora note", bio: "静かな朝と、本のある暮らし。" },
  { email: "mugi@example.com", username: "mugi", displayName: "mugi", bio: "小さく始める日々の実験。" },
  { email: "nagi@example.com", username: "nagi", displayName: "凪", bio: "波の音を聞きながら日記を書いています。" },
];

const followsKey = "hibi-local-follows";

export function getSocialAccounts(): SocialAccount[] {
  const users = getLocalUsers();
  const localAccounts = users.map((user) => ({
    email: user.email,
    username: user.username || user.email.split("@")[0],
    displayName: user.username || user.email.split("@")[0],
    bio: "Hibiで日記を書いています。",
  }));
  return [...seedAccounts, ...localAccounts.filter((account) => !seedAccounts.some((seed) => seed.email === account.email))];
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
  return current.has(targetEmail);
}

export function getFollowerCount(targetEmail: string): number {
  return Object.values(getFollowMap()).filter((following) => following.includes(targetEmail)).length;
}

export function getFollowingCount(email: string): number {
  return getFollowing(email).length;
}
