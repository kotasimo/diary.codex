import type { ArticleInteraction, Entry, VisitorRecord } from "@/types/diary";
import { normalizeDateValue } from "@/utils/date";

const articleInteractionsKey = "hibi-article-interactions";
const visitorsKey = "hibi-page-visitors";

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
