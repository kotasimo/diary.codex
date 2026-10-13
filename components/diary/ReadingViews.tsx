"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Heart,
} from "lucide-react";
import { useState } from "react";
import {
  getFollowerCount,
  getFollowing,
  getFollowingCount,
  type SocialAccount,
} from "@/app/lib/social";
import type {
  ArticleInteraction,
  Comment,
  Entry,
  Notification,
  RelationshipKind,
  VisitorRecord,
} from "@/types/diary";
import {
  buildWeek,
  formatDate,
  normalizeDateValue,
  parseDateValue,
} from "@/utils/date";

export function SearchView({
  query,
  currentEmail,
  accounts,
  onToggleFollow,
  onSelectAccount,
}: {
  query: string;
  currentEmail: string;
  accounts: SocialAccount[];
  onToggleFollow: (email: string) => void;
  onSelectAccount: (account: SocialAccount) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = accounts.filter(
    (account) =>
      !normalizedQuery ||
      `${account.username} ${account.displayName} ${account.email}`
        .toLowerCase()
        .includes(normalizedQuery),
  );
  const following = new Set(getFollowing(currentEmail));
  return (
    <section className="content-panel search-panel">
      <div className="search-result-list">
        {results.map((account) => {
          const isSelf = account.email === currentEmail;
          const followerCount = getFollowerCount(account.email);
          const followingCount = getFollowingCount(account.email);
          return (
            <article className="search-account-card" key={account.email}>
              <div className="search-account-avatar">
                {account.displayName.trim().charAt(0).toUpperCase() || "?"}
              </div>
              <div className="search-account-copy">
                <button
                  type="button"
                  className="search-account-link"
                  onClick={() => onSelectAccount(account)}
                >
                  <strong>{account.displayName}</strong>
                  <span>@{account.username}</span>
                </button>
                <p>{account.bio}</p>
                <small>
                  {followerCount} フォロワー ・ {followingCount} フォロー中
                </small>
              </div>
              {!isSelf && (
                <button
                  type="button"
                  className={
                    following.has(account.email)
                      ? "secondary-button"
                      : "primary-button"
                  }
                  onClick={() => onToggleFollow(account.email)}
                >
                  {following.has(account.email) ? "フォロー中" : "フォロー"}
                </button>
              )}
            </article>
          );
        })}
        {!results.length && (
          <p className="search-empty">
            該当するアカウントが見つかりませんでした。
          </p>
        )}
      </div>
    </section>
  );
}

export function RelationshipView({
  kind,
  subjectEmail,
  currentEmail,
  accounts,
  onBack,
  onToggleFollow,
  onSelectAccount,
}: {
  kind: RelationshipKind;
  subjectEmail: string;
  currentEmail: string;
  accounts: SocialAccount[];
  onBack: () => void;
  onToggleFollow: (email: string) => void;
  onSelectAccount: (account: SocialAccount) => void;
}) {
  const followingEmails = new Set(getFollowing(subjectEmail));
  const listedAccounts =
    kind === "following"
      ? accounts.filter((account) => followingEmails.has(account.email))
      : accounts.filter((account) =>
          getFollowing(account.email).includes(subjectEmail),
        );
  const followingByViewer = new Set(getFollowing(currentEmail));
  return (
    <section className="content-panel relationship-panel">
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeft size={16} />
        プロフィールへ戻る
      </button>
      <div className="page-heading">
        <h1>
          {kind === "following" ? "フォロー" : "フォロワー"}
          <small>{listedAccounts.length}人</small>
        </h1>
      </div>
      <div className="relationship-list">
        {listedAccounts.map((account) => (
          <article className="relationship-row" key={account.email}>
            <button
              type="button"
              className="relationship-person"
              onClick={() => onSelectAccount(account)}
            >
              <span className="search-account-avatar">
                {account.displayName.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <span>
                <strong>{account.displayName}</strong>
                <small>@{account.username}</small>
                <em>{account.bio}</em>
              </span>
            </button>
            {account.email !== currentEmail && (
              <button
                type="button"
                className={
                  followingByViewer.has(account.email)
                    ? "secondary-button"
                    : "primary-button"
                }
                onClick={() => onToggleFollow(account.email)}
              >
                {followingByViewer.has(account.email)
                  ? "フォロー中"
                  : "フォロー"}
              </button>
            )}
          </article>
        ))}
        {!listedAccounts.length && (
          <p className="search-empty">まだアカウントがありません。</p>
        )}
      </div>
    </section>
  );
}

export function WeekView({
  entries,
  weekStart,
  onShift,
  onDetail,
  onEdit,
  readOnly = false,
}: {
  entries: Entry[];
  weekStart: Date;
  onShift: (days: number) => void;
  onDetail: (entry: Entry) => void;
  onEdit: (date: string, day: string, entry?: Entry) => void;
  readOnly?: boolean;
}) {
  const weekDays = buildWeek(weekStart).map(([date, day]) => ({
    iso: date,
    label: formatDate(parseDateValue(date)),
    day,
  }));
  return (
    <div className="content-panel">
      <div className="week-toolbar">
        <span className="week-range" aria-label="表示期間">
          {weekDays[0].label} — {weekDays[weekDays.length - 1].label}
        </span>
        <div className="week-actions">
          <button
            className="week-arrow"
            aria-label="前の週"
            onClick={() => onShift(-7)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="week-arrow"
            aria-label="次の週"
            onClick={() => onShift(7)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="entry-list">
        {weekDays.map(({ iso, label, day }) => {
          const entry = entries.find(
            (item) => normalizeDateValue(item.date) === iso,
          );
          return (
            <article
              className={`entry-row reading-entry ${!entry ? "empty-entry" : ""} ${entry?.image ? "has-image" : ""}`}
              key={iso}
            >
              <header className="entry-heading">
                <time className="entry-heading-date">
                  {label.replace("月", "/").replace("日", "")}（{day}）
                </time>
                <h2>{entry?.title ?? ""}</h2>
                {!readOnly && (
                  <button
                    type="button"
                    className="entry-edit-button"
                    onClick={() => onEdit(iso, day, entry)}
                    aria-label={`${label}の日記を${entry ? "編集" : "作成"}`}
                  >
                    <Edit3 size={14} aria-hidden="true" />
                    <span>{entry ? "編集" : "作成"}</span>
                  </button>
                )}
              </header>
              <div className="entry-body">
                <div className="reading-copy">
                  {entry ? (
                    <button
                      className="entry-content"
                      onClick={() => onDetail(entry)}
                    >
                      <p>{entry.content}</p>
                    </button>
                  ) : null}
                </div>
                <div className="reading-media">
                  <div
                    className={`reading-image${entry?.image ? "" : " reading-image-empty"}`}
                    role={entry?.image ? "img" : undefined}
                    aria-label={
                      entry?.image
                        ? `${entry.title ?? "日記"}の写真`
                        : undefined
                    }
                    aria-hidden={entry?.image ? undefined : true}
                    style={
                      entry?.image
                        ? { backgroundImage: `url(${entry.image})` }
                        : undefined
                    }
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function DetailView({
  entry,
  onBack,
  onEdit,
  onPrevious,
  onNext,
  readOnly,
  interaction,
  currentEmail,
  onToggleLike,
  comments,
  onAddComment,
}: {
  entry: Entry;
  onBack: () => void;
  onEdit: () => void;
  onPrevious: () => void;
  onNext: () => void;
  readOnly?: boolean;
  interaction: ArticleInteraction;
  currentEmail: string;
  onToggleLike: () => void;
  comments: Comment[];
  onAddComment: (body: string) => void;
}) {
  const displayDate = formatDate(parseDateValue(entry.date));
  const [commentBody, setCommentBody] = useState("");
  const submitComment = () => {
    if (!commentBody.trim()) return;
    onAddComment(commentBody);
    setCommentBody("");
  };
  return (
    <article className="content-panel detail-panel">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        週の一覧へ
      </button>
      <nav className="entry-pagination">
        <button type="button" onClick={onPrevious}>
          <ChevronLeft size={17} />
          前の日記
        </button>
        <button type="button" onClick={onNext}>
          次の日記
          <ChevronRight size={17} />
        </button>
      </nav>
      <header className="detail-heading">
        <p>
          {displayDate.replace("月", "/").replace("日", "")}（{entry.day}）
        </p>
        {entry.title && <h1>{entry.title}</h1>}
        {!readOnly && (
          <button type="button" className="detail-edit-button" onClick={onEdit}>
            <Edit3 size={14} aria-hidden="true" />
            編集
          </button>
        )}
      </header>
      <div className="detail-body">
        <p>{entry.content}</p>
      </div>
      <div className="article-reactions">
        <button
          type="button"
          className={
            interaction.likes.includes(currentEmail)
              ? "reaction-button liked"
              : "reaction-button"
          }
          onClick={onToggleLike}
        >
          <Heart
            size={17}
            fill={
              interaction.likes.includes(currentEmail) ? "currentColor" : "none"
            }
          />
          いいね {interaction.likes.length}
        </button>
      </div>
      <section className="article-comments" aria-label="コメント">
        <h2>コメント</h2>
        <div className="comment-list">
          {comments.map((comment) => (
            <article key={comment.id}>
              <strong>{comment.authorEmail}</strong>
              <p>{comment.body}</p>
            </article>
          ))}
          {!comments.length && (
            <p className="comment-empty">まだコメントはありません。</p>
          )}
        </div>
        <form
          className="comment-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitComment();
          }}
        >
          <input
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            maxLength={280}
            placeholder="コメントを書く"
            aria-label="コメント"
          />
          <button
            type="submit"
            className="primary-button"
            disabled={!commentBody.trim()}
          >
            送信
          </button>
        </form>
      </section>
    </article>
  );
}

export function NotificationsView({
  notifications,
  accounts,
}: {
  notifications: Notification[];
  accounts: SocialAccount[];
}) {
  const accountByEmail = new Map(
    accounts.map((account) => [account.email, account]),
  );
  const formatMessage = (notification: Notification) => {
    const actor =
      accountByEmail.get(notification.actorEmail)?.displayName ??
      notification.actorEmail;
    if (notification.kind === "follow")
      return `${actor}さんがあなたをフォローしました`;
    if (notification.kind === "like")
      return `${actor}さんが「${notification.entryTitle ?? "日記"}」にいいねしました`;
    return `${actor}さんが「${notification.entryTitle ?? "日記"}」にコメントしました`;
  };
  return (
    <section className="content-panel notifications-panel">
      <div className="page-heading">
        <h1>お知らせ</h1>
      </div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <article
            className={`notification-row${notification.read ? "" : " unread"}`}
            key={notification.id}
          >
            <span className="notification-avatar">
              {(
                accountByEmail.get(notification.actorEmail)?.displayName ??
                notification.actorEmail
              )
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <div>
              <strong>{formatMessage(notification)}</strong>
              {notification.commentBody && <p>{notification.commentBody}</p>}
              <time>
                {new Date(notification.createdAt).toLocaleString("ja-JP")}
              </time>
            </div>
          </article>
        ))}
        {!notifications.length && (
          <p className="notification-empty">お知らせはまだありません。</p>
        )}
      </div>
    </section>
  );
}

export function VisitorsView({
  records,
  accounts,
}: {
  records: VisitorRecord[];
  accounts: SocialAccount[];
}) {
  const accountByEmail = new Map(
    accounts.map((account) => [account.email, account]),
  );
  const recentRecords = records.filter(
    (record) => !Number.isNaN(new Date(record.visitedAt).getTime()),
  );
  const formatVisitedAt = (value: string) => {
    const date = new Date(value);
    const prefix =
      date.toDateString() === new Date().toDateString()
        ? "今日"
        : `${date.getMonth() + 1}月${date.getDate()}日`;
    return `${prefix} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };
  return (
    <section className="content-panel visitors-panel">
      <div className="page-heading">
        <h1>足あと</h1>
      </div>
      <div className="visitor-list">
        {recentRecords.map((record) => {
          const account = accountByEmail.get(record.visitorEmail);
          const name =
            account?.displayName ?? account?.username ?? record.visitorEmail;
          return (
            <button
              className="visitor-row"
              key={`${record.visitorEmail}-${record.visitedAt}`}
            >
              <span className="avatar avatar-blue">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <span className="visitor-info">
                <strong>{name}</strong>
                <span>
                  {record.entryTitle
                    ? `「${record.entryTitle}」を読みました`
                    : "あなたの日記を訪れました"}
                </span>
              </span>
              <time>{formatVisitedAt(record.visitedAt)}</time>
              <ChevronRight size={17} />
            </button>
          );
        })}
        {!recentRecords.length && (
          <p className="visitor-empty">まだ足あとがありません。</p>
        )}
      </div>
      <p className="visitor-note">
        ログインしているユーザーの訪問だけが表示されます。
      </p>
    </section>
  );
}
