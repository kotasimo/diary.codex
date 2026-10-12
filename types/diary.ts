import type { SocialAccount } from "@/app/lib/social";

export type View =
  | "week"
  | "detail"
  | "compose"
  | "visitors"
  | "profile"
  | "search"
  | "account"
  | "relationships";
export type RelationshipKind = "following" | "followers";

export type Profile = {
  displayName: string;
  diaryTitle: string;
  subtitle: string;
  bio: string;
  avatar?: string;
  headerImage?: string;
};

export type Entry = {
  date: string;
  day: string;
  title?: string;
  content: string;
  updatedAt: string;
  views: number;
  image?: string;
};

export type ArticleInteraction = { likes: string[] };

export type VisitorRecord = {
  visitorEmail: string;
  visitedAt: string;
  entryDate?: string;
  entryTitle?: string;
};

export type PublicAccount = SocialAccount;
