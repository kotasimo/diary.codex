"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";
import {
  getFollowerCount,
  getFollowing,
  getFollowingCount,
  type SocialAccount,
} from "@/app/lib/social";
import { useState } from "react";
import {
  ImageCropModal,
  resizeImage,
} from "@/components/diary/EditorViews";
import type { DayRecord } from "@/lib/record-repository";
import type {
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
  readOnly = false,
}: {
  entries: Entry[];
  weekStart: Date;
  onShift: (days: number) => void;
  onDetail: (entry: Entry) => void;
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
          <span className="week-range-desktop">
            {weekDays[0].label} — {weekDays[weekDays.length - 1].label}
          </span>
          <span className="week-range-mobile">
            {weekDays[0].label.replace("月", "/").replace("日", "")}ー
            {weekDays[weekDays.length - 1].label
              .replace("月", "/")
              .replace("日", "")}
          </span>
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
          const stored = entries.find(
            (item) => normalizeDateValue(item.date) === iso,
          );
          // An entry emptied on the day page reads as a day with nothing on it.
          const entry =
            stored && (stored.content.trim() || stored.image)
              ? stored
              : undefined;
          const openDay = () =>
            onDetail(
              stored ?? {
                date: iso,
                day,
                content: "",
                updatedAt: "",
                views: 0,
              },
            );
          return (
            <article
              className={`entry-row reading-entry ${!entry ? "empty-entry" : ""} ${entry?.image ? "has-image" : ""}`}
              key={iso}
            >
              <header className="entry-heading">
                <button
                  type="button"
                  className="entry-heading-date"
                  aria-label={`${label}を開く`}
                  onClick={openDay}
                >
                  {label.replace("月", "/").replace("日", "")}（{day}）
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className="entry-edit-button"
                    onClick={openDay}
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
                    <button className="entry-content" onClick={openDay}>
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
                        ? `${label}の日記の写真`
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
  onPrevious,
  onNext,
  readOnly,
  dayRecords = [],
  onUpdate,
}: {
  entry: Entry;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  readOnly?: boolean;
  dayRecords?: DayRecord[];
  onUpdate?: (entry: Entry) => Promise<boolean>;
}) {
  const displayDate = formatDate(parseDateValue(entry.date));
  const [content, setContent] = useState(entry.content);
  const [image, setImage] = useState(entry.image ?? "");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  // Written straight to storage as it is typed, like the record tabs, so the
  // page is never in an unsaved state and nothing needs confirming on exit.
  const persist = async (next: { content: string; image: string }) => {
    if (!onUpdate) return;
    const now = new Date();
    const saved = await onUpdate({
      date: entry.date,
      day: entry.day,
      content: next.content,
      updatedAt: `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`,
      views: entry.views ?? 0,
      image: next.image || undefined,
    });
    setSaveError(saved ? "" : "この端末に日記を保存できませんでした。");
  };
  const changeContent = (value: string) => {
    setContent(value);
    void persist({ content: value, image });
  };
  const changeImage = (value: string) => {
    setImage(value);
    void persist({ content, image: value });
  };
  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCropSource(await resizeImage(file, 1800, 1200));
      setSaveError("");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "画像を処理できませんでした。",
      );
    }
  };
  return (
    <article className="content-panel detail-panel">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        週一覧へ
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

      </header>
      {readOnly ? (
        entry.content && (
          <div className="detail-body">
            <p>{entry.content}</p>
          </div>
        )
      ) : (
        <div className="detail-body">
          <textarea
            className="detail-input"
            value={content}
            placeholder="今日あったこと、感じたことを書いてみましょう。"
            aria-label="日記の本文"
            ref={(element) => {
              if (element) {
                element.style.height = "auto";
                element.style.height = `${Math.max(96, element.scrollHeight)}px`;
              }
            }}
            onChange={(event) => changeContent(event.target.value)}
          />
          <div className="detail-image-actions">
            <label className="image-upload-button" htmlFor="detail-image-file">
              画像を追加
            </label>
            <input
              id="detail-image-file"
              type="file"
              accept="image/*"
              onChange={(event) => void pickImage(event.target.files?.[0])}
            />
            {image && (
              <>
                <button
                  type="button"
                  className="image-adjust-button"
                  onClick={() => setCropSource(image)}
                >
                  画像の表示範囲を調整
                </button>
                <button
                  type="button"
                  className="image-adjust-button"
                  onClick={() => changeImage("")}
                >
                  画像を削除
                </button>
              </>
            )}
          </div>
          {saveError && (
            <p className="compose-save-error" role="alert">
              {saveError}
            </p>
          )}
        </div>
      )}
      {dayRecords.length > 0 && (
        <section className="detail-records" aria-label="この日の記録">
          {dayRecords.map((record) => (
            <div className="detail-record" key={record.tabId}>
              <span className="detail-record-name">{record.name}</span>
              <p>{record.content}</p>
            </div>
          ))}
        </section>
      )}
      {readOnly && !entry.content && !dayRecords.length && (
        <p className="detail-empty">この日はまだ何も書かれていません。</p>
      )}
      {cropSource && (
        <ImageCropModal
          source={cropSource}
          aspect={1}
          outputWidth={800}
          onCancel={() => setCropSource(null)}
          onUse={(croppedImage) => {
            changeImage(croppedImage);
            setCropSource(null);
          }}
        />
      )}
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
      return `${actor}さんが日記にいいねしました`;
    return `${actor}さんが日記にコメントしました`;
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
                <span>あなたの日記を訪れました</span>
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
