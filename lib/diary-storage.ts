import type {
  ArticleInteraction,
  Comment,
  Entry,
  Notification,
  VisitorRecord,
} from "@/types/diary";
import { normalizeDateValue } from "@/utils/date";

const articleInteractionsKey = "hibi-article-interactions";
const visitorsKey = "hibi-page-visitors";
const commentsKey = "hibi-article-comments";
const notificationsKey = "hibi-notifications";

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
  saved[`${ownerEmail}:${normalizeDateValue(date)}`] = interaction;
  window.localStorage.setItem(articleInteractionsKey, JSON.stringify(saved));
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
}
