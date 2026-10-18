import type {
  ArticleInteraction,
  Comment,
  Entry,
  Notification,
  VisitorRecord,
} from "@/types/diary";
import { normalizeDateValue } from "@/utils/date";
import { getSupabaseClient } from "@/app/lib/supabase";

const articleInteractionsKey = "hibi-article-interactions";
const visitorsKey = "hibi-page-visitors";
const commentsKey = "hibi-article-comments";
const notificationsKey = "hibi-notifications";

export function clearSocialCache() {
  if (typeof window === "undefined") return;
  for (const key of [articleInteractionsKey, visitorsKey, commentsKey, notificationsKey])
    window.localStorage.removeItem(key);
}

export function getArticleInteraction(
  ownerEmail: string,
  date: string,
): ArticleInteraction {
  if (typeof window === "undefined") return { likes: [] };
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(articleInteractionsKey) ?? "{}",
    ) as Record<string, ArticleInteraction>;
    const value = saved[`${ownerEmail}:${normalizeDateValue(date)}`];
    return { likes: value?.likes ?? [] };
  } catch {
    return { likes: [] };
  }
}

export function saveArticleInteraction(
  ownerEmail: string,
  date: string,
  interaction: ArticleInteraction,
) {
  const saved = JSON.parse(
    window.localStorage.getItem(articleInteractionsKey) ?? "{}",
  ) as Record<string, ArticleInteraction>;
  const previous = saved[`${ownerEmail}:${normalizeDateValue(date)}`]?.likes ?? [];
  saved[`${ownerEmail}:${normalizeDateValue(date)}`] = interaction;
  window.localStorage.setItem(articleInteractionsKey, JSON.stringify(saved));
  const supabase = getSupabaseClient();
  if (supabase) {
    const added = interaction.likes.filter((email) => !previous.includes(email));
    const removed = previous.filter((email) => !interaction.likes.includes(email));
    for (const actorEmail of added) void supabase.from("article_likes").upsert({
      owner_email: ownerEmail, entry_date: normalizeDateValue(date), actor_email: actorEmail,
    }, { onConflict: "owner_email,entry_date,actor_email" });
    for (const actorEmail of removed) void supabase.from("article_likes").delete()
      .eq("owner_email", ownerEmail).eq("entry_date", normalizeDateValue(date)).eq("actor_email", actorEmail);
  }
}

export function getVisitorRecords(ownerEmail: string): VisitorRecord[] {
  if (typeof window === "undefined" || !ownerEmail) return [];
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(visitorsKey) ?? "{}",
    ) as Record<string, VisitorRecord[]>;
    return Array.isArray(saved[ownerEmail]) ? saved[ownerEmail] : [];
  } catch {
    return [];
  }
}

export function recordPageVisit(
  ownerEmail: string,
  visitorEmail: string,
  entry?: Entry,
) {
  if (
    typeof window === "undefined" ||
    !ownerEmail ||
    !visitorEmail ||
    ownerEmail === visitorEmail
  )
    return;
  const saved = JSON.parse(
    window.localStorage.getItem(visitorsKey) ?? "{}",
  ) as Record<string, VisitorRecord[]>;
  const records = Array.isArray(saved[ownerEmail]) ? saved[ownerEmail] : [];
  const next: VisitorRecord = {
    visitorEmail,
    visitedAt: new Date().toISOString(),
    entryDate: entry?.date,
    entryTitle: entry?.title,
  };
  const withoutRecentDuplicate = records.filter(
    (record) =>
      !(
        record.visitorEmail === visitorEmail &&
        Date.now() - new Date(record.visitedAt).getTime() < 30 * 60 * 1000
      ),
  );
  saved[ownerEmail] = [next, ...withoutRecentDuplicate].slice(0, 100);
  window.localStorage.setItem(visitorsKey, JSON.stringify(saved));
  const supabase = getSupabaseClient();
  if (supabase) void supabase.from("page_visitors").insert({
    owner_email: ownerEmail,
    visitor_email: visitorEmail,
    visited_at: next.visitedAt,
    entry_date: next.entryDate,
    entry_title: next.entryTitle,
  });
}

export function getComments(ownerEmail: string, date: string): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(commentsKey) ?? "{}",
    ) as Record<string, Comment[]>;
    return saved[`${ownerEmail}:${normalizeDateValue(date)}`] ?? [];
  } catch {
    return [];
  }
}

export function addComment(ownerEmail: string, date: string, comment: Comment) {
  const saved = JSON.parse(
    window.localStorage.getItem(commentsKey) ?? "{}",
  ) as Record<string, Comment[]>;
  const key = `${ownerEmail}:${normalizeDateValue(date)}`;
  saved[key] = [...(saved[key] ?? []), comment];
  window.localStorage.setItem(commentsKey, JSON.stringify(saved));
  const supabase = getSupabaseClient();
  if (supabase) void supabase.from("article_comments").insert({
    id: comment.id,
    owner_email: ownerEmail,
    entry_date: normalizeDateValue(date),
    author_email: comment.authorEmail,
    body: comment.body,
    created_at: comment.createdAt,
  });
}

export function getNotifications(ownerEmail: string): Notification[] {
  if (typeof window === "undefined" || !ownerEmail) return [];
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(notificationsKey) ?? "{}",
    ) as Record<string, Notification[]>;
    return saved[ownerEmail] ?? [];
  } catch {
    return [];
  }
}

export function addNotification(
  ownerEmail: string,
  notification: Omit<Notification, "id" | "createdAt" | "read">,
) {
  if (
    typeof window === "undefined" ||
    !ownerEmail ||
    ownerEmail === notification.actorEmail
  )
    return;
  const saved = JSON.parse(
    window.localStorage.getItem(notificationsKey) ?? "{}",
  ) as Record<string, Notification[]>;
  const next: Notification = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  saved[ownerEmail] = [next, ...(saved[ownerEmail] ?? [])].slice(0, 100);
  window.localStorage.setItem(notificationsKey, JSON.stringify(saved));
  const supabase = getSupabaseClient();
  if (supabase) void supabase.from("notifications").insert({
    id: next.id,
    owner_email: ownerEmail,
    kind: next.kind,
    actor_email: next.actorEmail,
    created_at: next.createdAt,
    read: next.read,
    entry_date: next.entryDate,
    entry_title: next.entryTitle,
    comment_body: next.commentBody,
  });
}

export function markNotificationsRead(ownerEmail: string) {
  const notifications = getNotifications(ownerEmail);
  if (!notifications.some((notification) => !notification.read)) return;
  const saved = JSON.parse(
    window.localStorage.getItem(notificationsKey) ?? "{}",
  ) as Record<string, Notification[]>;
  saved[ownerEmail] = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));
  window.localStorage.setItem(notificationsKey, JSON.stringify(saved));
  const supabase = getSupabaseClient();
  if (supabase) void supabase.from("notifications").update({ read: true })
    .eq("owner_email", ownerEmail);
}

/** Load the signed-in user's social data from Supabase into the existing cache. */
export async function hydrateSocialData(email: string) {
  const supabase = getSupabaseClient();
  if (!supabase || !email || typeof window === "undefined") return;
  const [interactions, visitors, comments, notifications] = await Promise.all([
    supabase.from("article_likes").select("owner_email,entry_date,actor_email").eq("owner_email", email),
    supabase.from("page_visitors").select("visitor_email,visited_at,entry_date,entry_title").eq("owner_email", email).order("visited_at", { ascending: false }).limit(100),
    supabase.from("article_comments").select("id,entry_date,author_email,body,created_at").eq("owner_email", email).order("created_at"),
    supabase.from("notifications").select("id,kind,actor_email,created_at,read,entry_date,entry_title,comment_body").eq("owner_email", email).order("created_at", { ascending: false }).limit(100),
  ]);
  if (interactions.error || visitors.error || comments.error || notifications.error) return;
  const interactionMap = JSON.parse(window.localStorage.getItem(articleInteractionsKey) ?? "{}") as Record<string, ArticleInteraction>;
  for (const key of Object.keys(interactionMap)) if (key.startsWith(`${email}:`)) delete interactionMap[key];
  for (const row of interactions.data ?? []) (interactionMap[`${email}:${row.entry_date}`] ??= { likes: [] }).likes.push(row.actor_email);
  const visitorMap = JSON.parse(window.localStorage.getItem(visitorsKey) ?? "{}") as Record<string, VisitorRecord[]>;
  visitorMap[email] = (visitors.data ?? []).map((row) => ({ visitorEmail: row.visitor_email, visitedAt: row.visited_at, entryDate: row.entry_date ?? undefined, entryTitle: row.entry_title ?? undefined }));
  const commentMap = JSON.parse(window.localStorage.getItem(commentsKey) ?? "{}") as Record<string, Comment[]>;
  for (const key of Object.keys(commentMap)) if (key.startsWith(`${email}:`)) delete commentMap[key];
  for (const row of comments.data ?? []) {
    const key = `${email}:${row.entry_date}`;
    (commentMap[key] ??= []).push({ id: row.id, authorEmail: row.author_email, body: row.body, createdAt: row.created_at });
  }
  const notificationRows = (notifications.data ?? []).map((row) => ({ id: row.id, kind: row.kind, actorEmail: row.actor_email, createdAt: row.created_at, read: row.read, entryDate: row.entry_date ?? undefined, entryTitle: row.entry_title ?? undefined, commentBody: row.comment_body ?? undefined } satisfies Notification));
  window.localStorage.setItem(articleInteractionsKey, JSON.stringify(interactionMap));
  window.localStorage.setItem(visitorsKey, JSON.stringify(visitorMap));
  window.localStorage.setItem(commentsKey, JSON.stringify(commentMap));
  const notificationMap = JSON.parse(window.localStorage.getItem(notificationsKey) ?? "{}") as Record<string, Notification[]>;
  notificationMap[email] = notificationRows;
  window.localStorage.setItem(notificationsKey, JSON.stringify(notificationMap));
}
