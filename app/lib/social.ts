import { getLocalUsers } from "./auth";

export type SocialAccount = {
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

const seedAccounts: SocialAccount[] = [
  { email: "haru@example.com", username: "haru", displayName: "haru", bio: "季節の変化を、短い言葉で記録しています。" },
  { email: "sora@example.com", username: "sora_note", displayName: "sora note", bio: "静かな朝と、本のある暮らし。" },
  { email: "mugi@example.com", username: "mugi", displayName: "mugi", bio: "小さく始める日々の実験。" },
  { email: "nagi@example.com", username: "nagi", displayName: "凪", bio: "波の音を聞きながら日記を書いています。" },
];

const seedEntries: Record<string, SocialDiaryEntry[]> = {
  "haru@example.com": [
    { date: "2026-10-09", title: "風が変わった日", content: "帰り道の風が少し冷たくなっていた。季節はいつも、気づかないうちに次へ進んでいる。" },
    { date: "2026-10-03", title: "朝の光", content: "カーテンの隙間から入る光で目が覚めた。何もない朝がいちばん好きかもしれない。" },
  ],
  "sora@example.com": [
    { date: "2026-10-08", title: "本を閉じる時間", content: "読みかけの本を閉じて、窓の外を眺めた。読むことと休むことは、案外よく似ている。" },
  ],
  "mugi@example.com": [
    { date: "2026-10-07", title: "小さな習慣", content: "五分だけ机を片づけた。始める前に思っていたより、終わったあとの気持ちは軽かった。" },
  ],
  "nagi@example.com": [
    { date: "2026-10-06", title: "波の音", content: "遠くで波の音がしていた。静かな場所では、自分の考えていることがよく聞こえる。" },
  ],
};

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

export function getSocialEntries(email: string): SocialDiaryEntry[] {
  return seedEntries[email] ?? [];
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
