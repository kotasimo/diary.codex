import type { SocialAccount } from "@/app/lib/social";

export type View =
  | "week"
  | "detail"
  | "compose"
  | "visitors"
  | "profile"
  | "search"
  | "account"
  | "relationships"
  | "notifications";
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

export type Comment = {
  id: string;
  authorEmail: string;
  body: string;
  createdAt: string;
};

export type NotificationKind = "like" | "comment" | "follow";

export type Notification = {
  id: string;
  kind: NotificationKind;
  actorEmail: string;
  createdAt: string;
  read: boolean;
  entryDate?: string;
  entryTitle?: string;
  commentBody?: string;
};

export type PublicAccount = SocialAccount;
