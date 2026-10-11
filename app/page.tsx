"use client";

import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Feather,
  Footprints,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRoundPlus,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "./lib/supabase";
import { localAuthEnabled, localSessionKey } from "./lib/auth";
import { getFollowerCount, getFollowing, getFollowingCount, getSocialAccounts, getSocialEntries, toggleFollowing, type SocialAccount } from "./lib/social";

type View = "week" | "detail" | "compose" | "visitors" | "profile" | "search" | "account" | "relationships";
type RelationshipKind = "following" | "followers";

type Profile = {
  displayName: string;
  diaryTitle: string;
  subtitle: string;
  bio: string;
  avatar?: string;
  headerImage?: string;
};

const defaultProfile: Profile = {
  displayName: "kotaro",
  diaryTitle: "kotaroの日記",
  subtitle: "何でもない毎日を、忘れないために。",
  bio: "日々の出来事を、ゆっくり記録しています。",
};

function upgradeProfile(profile?: Partial<Profile> | null): Profile {
  const source = profile ?? {};
  const isLegacyProfile = source.subtitle === undefined;
  return {
    displayName: source.displayName ?? defaultProfile.displayName,
    diaryTitle: source.diaryTitle ?? defaultProfile.diaryTitle,
    subtitle: source.subtitle ?? source.bio ?? defaultProfile.subtitle,
    bio: isLegacyProfile ? defaultProfile.bio : source.bio ?? defaultProfile.bio,
    avatar: source.avatar,
    headerImage: source.headerImage,
  };
}

type Entry = {
  date: string;
  day: string;
  title?: string;
  content: string;
  updatedAt: string;
  views: number;
  image?: string;
};

const initialEntries: Entry[] = [
  {
    date: "2026-10-05",
    day: "月",
    title: "金木犀の帰り道",
    content:
      "仕事を少し早めに切り上げて、遠回りして帰った。角を曲がったところで金木犀の香りがして、ようやく秋が来た気がした。急がず歩くと、いつもの道にも知らない景色がある。",
    updatedAt: "21:42",
    views: 18,
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "2026-10-06",
    day: "火",
    title: "小さく始める",
    content:
      "やりたいことがいくつもあるのに、どれも大きすぎて動けずにいた。でも今日、まずはノートを一冊買った。小さく始めれば、それでいい。",
    updatedAt: "08:16",
    views: 12,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "2026-10-07",
    day: "水",
    title: "雨の音で目が覚めた",
    content:
      "雨の音で目が覚めた。窓を開けると、ひんやりとした空気。何をするでもない朝だったけれど、こういう時間も嫌いじゃない。",
    updatedAt: "23:08",
    views: 24,
    image: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "2026-10-09",
    day: "金",
    title: "読みかけの本",
    content:
      "寝る前に、少しだけ本を読んだ。登場人物の言葉が、妙に沁みた。自分の今の気持ちと、どこか重なっている気がして。",
    updatedAt: "22:14",
    views: 20,
  },
  {
    date: "2026-10-10",
    day: "土",
    title: "静かな土曜日",
    content:
      "予定を入れない土曜日。読みかけの本を開いて、眠くなったら昼寝をした。夕方に散歩へ出たら、空が薄い桃色だった。",
    updatedAt: "18:35",
    views: 31,
  },
  {
    date: "2026-10-11",
    day: "日",
    title: "来週に向けて",
    content:
      "部屋を少し片づけて、やることリストを見直した。完璧じゃなくていい、また一週間、やっていこう。",
    updatedAt: "20:02",
    views: 16,
  },
];

const dayNames = ["日", "月", "火", "水", "木", "金", "土"] as const;

function formatDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateValue(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const slash = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slash) return new Date(Number(slash[1]), Number(slash[2]) - 1, Number(slash[3]));
  const japanese = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (japanese) return new Date(Number(japanese[1]), Number(japanese[2]) - 1, Number(japanese[3]));
  const match = value.match(/(\d+)月(\d+)日/);
  return match ? new Date(2026, Number(match[1]) - 1, Number(match[2])) : new Date(2026, 9, 5);
}

function normalizeDateValue(value: string) {
  return toDateKey(parseDateValue(value));
}

function mondayOf(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function buildWeek(start: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return [toDateKey(date), dayNames[date.getDay()]] as const;
  });
}

const visitors = [
  { name: "haru", initial: "H", color: "peach", time: "今日 14:32", entry: "静かな土曜日" },
  { name: "sora_note", initial: "S", color: "blue", time: "今日 10:15", entry: "静かな土曜日" },
  { name: "mugi", initial: "M", color: "yellow", time: "昨日 21:04", entry: "小さく始める" },
  { name: "凪", initial: "凪", color: "green", time: "昨日 18:47", entry: "小さく始める" },
  { name: "ao", initial: "A", color: "purple", time: "10月8日 08:11", entry: "金木犀の帰り道" },
];

function MiniCalendar({ month, entries, onMonthChange, onSelectMonth, onToday, onPick }: { month: Date; entries: Entry[]; onMonthChange: (offset: number) => void; onSelectMonth: (year: number, month: number) => void; onToday: () => void; onPick: (day: number) => void }) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const [yearInput, setYearInput] = useState(String(year));
  const [monthInput, setMonthInput] = useState(String(monthIndex + 1));
  useEffect(() => { setYearInput(String(year)); setMonthInput(String(monthIndex + 1)); }, [year, monthIndex]);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const entryDates = new Set(entries.filter((entry) => {
    const date = parseDateValue(entry.date);
    return date.getFullYear() === year && date.getMonth() === monthIndex;
  }).map((entry) => parseDateValue(entry.date).getDate()));
  return (
    <section className="calendar-card">
      <div className="calendar-heading">
        <button aria-label="前月" onClick={() => onMonthChange(-1)}><ChevronLeft size={17} /></button>
        <strong>{year}年{monthIndex + 1}月</strong>
        <button aria-label="次月" onClick={() => onMonthChange(1)}><ChevronRight size={17} /></button>
      </div>
      <div className="calendar-grid calendar-labels">
        {['月', '火', '水', '木', '金', '土', '日'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid calendar-days">
        {Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} />)}
        {days.map((day) => (
          <button
            key={day}
            className={entryDates.has(day) ? "has-entry" : ""}
            onClick={() => onPick(day)}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="calendar-month-picker-wrap">
        <div className="calendar-month-picker">
          <label><input type="number" min="1900" max="2100" value={yearInput} onChange={(event) => { const value = event.target.value; setYearInput(value); const nextYear = Number(value); if (value.length === 4 && Number.isInteger(nextYear) && nextYear >= 1900 && nextYear <= 2100) onSelectMonth(nextYear, monthIndex); }} />年</label>
          <label><input type="number" min="1" max="12" value={monthInput} onChange={(event) => { const value = event.target.value; setMonthInput(value); const nextMonth = Number(value); if (Number.isInteger(nextMonth) && nextMonth >= 1 && nextMonth <= 12) onSelectMonth(year, nextMonth - 1); }} />月</label>
        </div>
        <button className="calendar-today-button" onClick={onToday}>今月</button>
      </div>
    </section>
  );
}

function Header({ profile, searchQuery, onSearchQuery, onSearch, onHome, onMenu, onPost }: { profile: Profile; searchQuery: string; onSearchQuery: (query: string) => void; onSearch: () => void; onHome: () => void; onMenu: () => void; onPost: () => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="mobile-menu" onClick={onMenu} aria-label="メニュー"><Menu size={22} /></button>
        <button className="brand" aria-label="Hibi ホーム" onClick={onHome}>
          <span className="brand-mark"><Feather size={19} /></span>
          <span>Hibi</span>
        </button>
        <label className="header-search">
          <Search size={20} aria-hidden="true" />
          <input type="search" value={searchQuery} onChange={(event) => onSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSearch(); }} placeholder="アカウントを検索" aria-label="アカウントを検索" />
        </label>
        <div className="header-actions">
          <button className="icon-button" aria-label="お知らせ"><Bell size={20} /><span className="notification-dot" /></button>
          <button className="header-profile-button" aria-label="プロフィール"><ProfileAvatar profile={profile} /></button>
          <button className="header-post-button" onClick={onPost}><Edit3 size={15} />日記を書く</button>
        </div>
      </div>
    </header>
  );
}

function DiaryHero({ profile }: { profile: Profile }) {
  return (
    <section
      className="diary-hero"
      aria-label="日記の紹介"
      style={profile.headerImage ? { backgroundImage: `linear-gradient(180deg, rgba(38, 66, 78, .08), rgba(38, 66, 78, .36)), url(${profile.headerImage})` } : undefined}
    >
      <div className="diary-hero-copy">
        <h1>{profile.diaryTitle}</h1>
        <p>{profile.subtitle}</p>
      </div>
    </section>
  );
}

function ProfileAvatar({ profile, large = false }: { profile: Profile; large?: boolean }) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "K";
  return (
    <div
      className={`avatar avatar-me${large ? " avatar-large" : ""}${profile.avatar ? " profile-avatar-image" : ""}`}
      style={profile.avatar ? { backgroundImage: `url(${profile.avatar})` } : undefined}
      aria-label={`${profile.displayName}のプロフィール画像`}
    >
      {profile.avatar ? null : initial}
    </div>
  );
}

function ProfileCard({ profile, socialEmail, currentEmail, publicAccount, onToggleFollow, onRelationships }: { profile: Profile; socialEmail: string; currentEmail: string; publicAccount: boolean; onToggleFollow: (email: string) => void; onRelationships: (kind: RelationshipKind, email: string) => void }) {
  const following = socialEmail ? getFollowing(currentEmail).includes(socialEmail) : false;
  return (
    <section className="profile-card">
      <div className="profile-identity">
        <ProfileAvatar profile={profile} large />
        <p className="profile-name">{profile.displayName}</p>
      </div>
      <p className="profile-bio">{profile.bio}</p>
      <div className="profile-follow-summary"><button type="button" onClick={() => onRelationships("following", socialEmail)}><strong>{getFollowingCount(socialEmail)}</strong><span>フォロー</span></button><button type="button" onClick={() => onRelationships("followers", socialEmail)}><strong>{getFollowerCount(socialEmail)}</strong><span>フォロワー</span></button></div>
      {publicAccount && socialEmail !== currentEmail && <button type="button" className={following ? "secondary-button profile-follow-button" : "primary-button profile-follow-button"} onClick={() => onToggleFollow(socialEmail)}>{following ? "フォロー中" : <><UserRoundPlus size={16} />フォロー</>}</button>}
    </section>
  );
}

function SearchView({ query, currentEmail, accounts, onToggleFollow, onSelectAccount }: { query: string; currentEmail: string; accounts: SocialAccount[]; onToggleFollow: (email: string) => void; onSelectAccount: (account: SocialAccount) => void }) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = accounts.filter((account) => !normalizedQuery || `${account.username} ${account.displayName} ${account.email}`.toLowerCase().includes(normalizedQuery));
  const following = new Set(getFollowing(currentEmail));
  return (
    <section className="content-panel search-panel">
      <div className="page-heading"><p className="eyebrow">ACCOUNT SEARCH</p><h1>アカウントを探す</h1><p>{normalizedQuery ? `「${query}」の検索結果` : "仮のアカウントを含むユーザー一覧"}</p></div>
      <div className="search-result-list">
        {results.map((account) => {
          const isSelf = account.email === currentEmail;
          const followerCount = getFollowerCount(account.email);
          const followingCount = getFollowingCount(account.email);
          return (
            <article className="search-account-card" key={account.email}>
              <div className="search-account-avatar">{account.displayName.trim().charAt(0).toUpperCase() || "?"}</div>
              <div className="search-account-copy"><button type="button" className="search-account-link" onClick={() => onSelectAccount(account)}><strong>{account.displayName}</strong><span>@{account.username}</span></button><p>{account.bio}</p><small>{followerCount} フォロワー ・ {followingCount} フォロー中</small></div>
              {!isSelf && <button type="button" className={following.has(account.email) ? "secondary-button" : "primary-button"} onClick={() => onToggleFollow(account.email)}>{following.has(account.email) ? "フォロー中" : "フォロー"}</button>}
            </article>
          );
        })}
        {!results.length && <p className="search-empty">該当するアカウントが見つかりませんでした。</p>}
      </div>
    </section>
  );
}

function AccountView({ entries, weekStart }: { entries: Entry[]; weekStart: Date }) {
  return (
    <>
      <WeekView entries={entries} weekStart={weekStart} onShift={() => undefined} onDetail={() => undefined} onEdit={() => undefined} readOnly />
    </>
  );
}

function RelationshipView({ kind, subjectEmail, currentEmail, accounts, onBack, onToggleFollow, onSelectAccount }: { kind: RelationshipKind; subjectEmail: string; currentEmail: string; accounts: SocialAccount[]; onBack: () => void; onToggleFollow: (email: string) => void; onSelectAccount: (account: SocialAccount) => void }) {
  const followingEmails = new Set(getFollowing(subjectEmail));
  const listedAccounts = kind === "following"
    ? accounts.filter((account) => followingEmails.has(account.email))
    : accounts.filter((account) => getFollowing(account.email).includes(subjectEmail));
  const followingByViewer = new Set(getFollowing(currentEmail));
  return (
    <section className="content-panel relationship-panel">
      <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={16} />プロフィールへ戻る</button>
      <div className="page-heading"><h1>{kind === "following" ? "フォロー" : "フォロワー"}<small>{listedAccounts.length}人</small></h1></div>
      <div className="relationship-list">
        {listedAccounts.map((account) => <article className="relationship-row" key={account.email}>
          <button type="button" className="relationship-person" onClick={() => onSelectAccount(account)}><span className="search-account-avatar">{account.displayName.trim().charAt(0).toUpperCase() || "?"}</span><span><strong>{account.displayName}</strong><small>@{account.username}</small><em>{account.bio}</em></span></button>
          {account.email !== currentEmail && <button type="button" className={followingByViewer.has(account.email) ? "secondary-button" : "primary-button"} onClick={() => onToggleFollow(account.email)}>{followingByViewer.has(account.email) ? "フォロー中" : "フォロー"}</button>}
        </article>)}
        {!listedAccounts.length && <p className="search-empty">まだアカウントがありません。</p>}
      </div>
    </section>
  );
}

function WeekView({ entries, weekStart, onShift, onDetail, onEdit, readOnly = false }: { entries: Entry[]; weekStart: Date; onShift: (days: number) => void; onDetail: (entry: Entry) => void; onEdit: (date: string, day: string, entry?: Entry) => void; readOnly?: boolean }) {
  const weekDays = buildWeek(weekStart).map(([date, day]) => ({ iso: date, label: formatDate(parseDateValue(date)), day }));
  return (
    <div className="content-panel">
      <div className="week-toolbar">
        <span className="week-range" aria-label="表示期間">{weekDays[0].label} — {weekDays[weekDays.length - 1].label}</span>
        <div className="week-actions">
          <button className="week-arrow" aria-label="前の週" onClick={() => onShift(-7)}><ChevronLeft size={20} /></button>
          <button className="week-arrow" aria-label="次の週" onClick={() => onShift(7)}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="entry-list">
        {weekDays.map(({ iso, label, day }) => {
          const entry = entries.find((item) => normalizeDateValue(item.date) === iso);
          return (
            <article className={`entry-row reading-entry ${!entry ? "empty-entry" : ""} ${entry?.image ? "has-image" : ""}`} key={iso}>
              <header className="entry-heading">
                <time className="entry-heading-date">{label.replace("月", "/").replace("日", "")}（{day}）</time>
                <h2>{entry?.title ?? ""}</h2>
                {!readOnly && <button
                  type="button"
                  className="entry-edit-button"
                  onClick={() => onEdit(iso, day, entry)}
                  aria-label={`${label}の日記を${entry ? "編集" : "作成"}`}
                >
                  <Edit3 size={14} aria-hidden="true" />
                  <span>{entry ? "編集" : "作成"}</span>
                </button>}
              </header>
              <div className="entry-body">
                <div className="reading-copy">
                  {entry ? (
                    <button className="entry-content" onClick={() => onDetail(entry)} disabled={readOnly}>
                      <p>{entry.content}</p>
                    </button>
                  ) : null}
                </div>
                <div className="reading-media">
                  <div
                    className={`reading-image${entry?.image ? "" : " reading-image-empty"}`}
                    role={entry?.image ? "img" : undefined}
                    aria-label={entry?.image ? `${entry.title ?? "日記"}の写真` : undefined}
                    aria-hidden={entry?.image ? undefined : true}
                    style={entry?.image ? { backgroundImage: `url(${entry.image})` } : undefined}
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

function DetailView({ entry, onBack, onEdit }: { entry: Entry; onBack: () => void; onEdit: () => void }) {
  const displayDate = formatDate(parseDateValue(entry.date));
  return (
    <article className="content-panel detail-panel">
      <button className="back-button" onClick={onBack}><ArrowLeft size={18} />週の一覧へ</button>
      <header className="detail-heading">
        <p>{displayDate.replace("月", "/").replace("日", "")}（{entry.day}）</p>
        {entry.title && <h1>{entry.title}</h1>}
      </header>
      <div className="detail-body">
        <p>{entry.content}</p>
      </div>
      <div className="detail-actions"><button className="secondary-button" onClick={onEdit}><Edit3 size={16} />編集する</button></div>
      <nav className="entry-pagination"><button><ChevronLeft size={17} />前の日記</button><button>次の日記<ChevronRight size={17} /></button></nav>
    </article>
  );
}

function ComposeView({ entry, date, day, onCancel, onSave }: { entry?: Entry; date: string; day: string; onCancel: () => void; onSave: (entry: Entry) => Promise<boolean> }) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [image, setImage] = useState(entry?.image ?? "");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const saveEntry = async () => {
    const now = new Date();
    setSaving(true);
    setSaveError("");
    const saved = await onSave({
      date,
      day,
      title: title.trim() || undefined,
      content: content.trim(),
      updatedAt: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      views: entry?.views ?? 0,
      image: image.trim() || undefined,
    });
    setSaving(false);
    if (!saved) setSaveError("保存できませんでした。Supabaseの設定とテーブルを確認してください。");
  };

  const selectImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCropSource(await resizeProfileImage(file, 1800, 1200));
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "画像を処理できませんでした。");
    }
  };

  return (
    <>
      <section className="content-panel compose-panel">
        <label className="field-label" htmlFor="title">タイトル <span>任意</span></label>
        <input id="title" className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="記事タイトル" maxLength={80} />
        <div className="character-count">{title.length} / 80</div>
        <label className="field-label" htmlFor="body">本文</label>
        <textarea id="body" className="body-input" value={content} onChange={(event) => setContent(event.target.value)} placeholder="今日あったこと、感じたことを書いてみましょう。" />
        <div className="compose-image-actions">
          <label className="image-upload-button" htmlFor="image-file">画像を追加</label>
          <input id="image-file" type="file" accept="image/*" onChange={(event) => void selectImage(event.target.files?.[0])} />
          {image && <button type="button" className="image-adjust-button" onClick={() => setCropSource(image)}>画像の表示範囲を調整</button>}
        </div>
        <div className="compose-heading">
          <button className="back-button" onClick={onCancel}><X size={18} />キャンセル</button>
          <button className="primary-button compose-save-button" disabled={!content.trim() || saving} onClick={() => void saveEntry()}>{saving ? "保存中…" : entry ? "保存" : "公開"}</button>
        </div>
        {saveError && <p className="compose-save-error" role="alert">{saveError}</p>}
      </section>
      {cropSource && <ImageCropModal source={cropSource} aspect={1} outputWidth={800} onCancel={() => setCropSource(null)} onUse={(croppedImage) => { setImage(croppedImage); setCropSource(null); }} />}
    </>
  );
}

function resizeProfileImage(file: File, maxWidth: number, maxHeight: number) {
  return new Promise<string>((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("画像は10MB以下のものを選んでください。"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。別の画像をお試しください。"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("この画像形式には対応していません。"));
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("画像を処理できませんでした。別の画像をお試しください。"));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.84));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ImageCropModal({ source, aspect, outputWidth, onCancel, onUse }: { source: string; aspect: number; outputWidth: number; onCancel: () => void; onUse: (image: string) => void }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropError, setCropError] = useState("");
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const frameWidth = 1000;
  const frameHeight = frameWidth / aspect;

  const finishCrop = () => {
    if (!imageSize.width || !imageSize.height) return;
    const baseScale = Math.max(frameWidth / imageSize.width, frameHeight / imageSize.height);
    const renderedScale = baseScale * zoom;
    const cropWidth = Math.min(imageSize.width, frameWidth / renderedScale);
    const cropHeight = Math.min(imageSize.height, frameHeight / renderedScale);
    const cropX = Math.max(0, Math.min(imageSize.width - cropWidth, (imageSize.width - cropWidth) / 2 - offset.x / renderedScale));
    const cropY = Math.max(0, Math.min(imageSize.height - cropHeight, (imageSize.height - cropHeight) / 2 - offset.y / renderedScale));
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = Math.max(1, Math.round(outputWidth / aspect));
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        onUse(canvas.toDataURL("image/webp", 0.86));
      } catch {
        setCropError("この画像は切り取れませんでした。画像を選び直してください。");
      }
    };
    image.src = source;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const limitX = frameWidth * Math.max(0.12, (zoom - 1) / 2 + 0.12);
    const limitY = frameHeight * Math.max(0.12, (zoom - 1) / 2 + 0.12);
    setOffset({
      x: Math.max(-limitX, Math.min(limitX, dragStart.current.offsetX + event.clientX - dragStart.current.x)),
      y: Math.max(-limitY, Math.min(limitY, dragStart.current.offsetY + event.clientY - dragStart.current.y)),
    });
  };
  const stopDragging = () => { dragStart.current = null; };

  return (
    <div className="crop-modal-backdrop" role="presentation">
      <section className="crop-modal" role="dialog" aria-modal="true" aria-label="画像の表示範囲を調整">
        <header className="crop-modal-header">
          <div><strong>画像の表示範囲</strong><span>画像をドラッグして位置を調整できます</span></div>
          <button type="button" className="crop-modal-close" onClick={onCancel} aria-label="閉じる"><X size={20} /></button>
        </header>
        <div
          className="crop-frame"
          style={{ aspectRatio: `${aspect}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
        >
          <img
            src={source}
            crossOrigin="anonymous"
            alt="切り取り範囲のプレビュー"
            onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            style={{ transform: `translate(${offset.x / zoom}px, ${offset.y / zoom}px) scale(${zoom})` }}
          />
          <div className="crop-grid" aria-hidden="true"><span /><span /><span /><span /></div>
        </div>
        {cropError && <p className="crop-error" role="alert">{cropError}</p>}
        <div className="crop-controls">
          <span aria-hidden="true">−</span>
          <input aria-label="画像の拡大率" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          <span aria-hidden="true">＋</span>
        </div>
        <footer className="crop-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>キャンセル</button>
          <button type="button" className="primary-button" disabled={!imageSize.width} onClick={finishCrop}>この範囲を使う</button>
        </footer>
      </section>
    </div>
  );
}

function ProfileSettingsView({ profile, onCancel, onSave }: { profile: Profile; onCancel: () => void; onSave: (profile: Profile) => void }) {
  const [draft, setDraft] = useState(profile);
  const [imageError, setImageError] = useState("");
  const [cropSource, setCropSource] = useState<{ kind: "avatar" | "header"; source: string } | null>(null);
  const safeDraft = upgradeProfile(draft);

  const selectImage = async (file: File | undefined, kind: "avatar" | "header") => {
    if (!file) return;
    setImageError("");
    try {
      const resizedImage = await resizeProfileImage(file, kind === "avatar" ? 1800 : 2400, kind === "avatar" ? 1800 : 1400);
      setCropSource({ kind, source: resizedImage });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "画像を処理できませんでした。");
    }
  };

  const useCroppedImage = (image: string) => {
    if (!cropSource) return;
    setDraft((current) => cropSource.kind === "avatar" ? { ...current, avatar: image } : { ...current, headerImage: image });
    setCropSource(null);
  };

  const canSave = safeDraft.displayName.trim() && safeDraft.diaryTitle.trim() && safeDraft.subtitle.trim() && safeDraft.bio.trim();

  return (
    <>
      <section className="content-panel profile-settings-panel">
      <header className="profile-settings-heading">
        <div>
          <p className="eyebrow">PROFILE</p>
          <h1>プロフィール設定</h1>
          <p>日記に表示される名前や紹介文を編集できます。</p>
        </div>
      </header>

      <div className="profile-settings-body">
        <section className="profile-preview" aria-label="プロフィールのプレビュー">
          <ProfileAvatar profile={safeDraft} large />
          <div>
            <strong>{safeDraft.displayName.trim() || "表示名"}</strong>
            <span>{safeDraft.bio.trim() || "紹介文がここに表示されます。"}</span>
          </div>
        </section>

        <div className="profile-avatar-actions">
          <label className="secondary-button" htmlFor="profile-avatar-file">画像を選ぶ</label>
          <input id="profile-avatar-file" type="file" accept="image/*" onChange={(event) => void selectImage(event.target.files?.[0], "avatar")} />
          {safeDraft.avatar && <button type="button" className="profile-image-remove" onClick={() => setDraft((current) => ({ ...current, avatar: undefined }))}>画像を削除</button>}
          {safeDraft.avatar && <button type="button" className="image-adjust-button" onClick={() => setCropSource({ kind: "avatar", source: safeDraft.avatar! })}>表示範囲を調整</button>}
          <span className="profile-image-hint">10MBまで・自動で縮小</span>
        </div>
        {imageError && <p className="profile-form-error" role="alert">{imageError}</p>}

        <section className="profile-header-setting">
          <div className="profile-setting-label">
            <strong>ヘッダー画像</strong>
            <span>日記上部に表示される画像です</span>
          </div>
          <div
            className="profile-header-preview"
            style={safeDraft.headerImage ? { backgroundImage: `linear-gradient(180deg, rgba(38, 66, 78, .08), rgba(38, 66, 78, .36)), url(${safeDraft.headerImage})` } : undefined}
          >
            <strong>{safeDraft.diaryTitle.trim() || "日記タイトル"}</strong>
            <span>{safeDraft.subtitle.trim() || "日記のサブタイトル"}</span>
          </div>
          <div className="profile-header-actions">
            <label className="secondary-button" htmlFor="profile-header-file">画像を選ぶ</label>
            <input id="profile-header-file" type="file" accept="image/*" onChange={(event) => void selectImage(event.target.files?.[0], "header")} />
            {safeDraft.headerImage && <button type="button" className="profile-image-remove" onClick={() => setDraft((current) => ({ ...current, headerImage: undefined }))}>標準画像に戻す</button>}
            {safeDraft.headerImage && <button type="button" className="image-adjust-button" onClick={() => setCropSource({ kind: "header", source: safeDraft.headerImage! })}>表示範囲を調整</button>}
            <span className="profile-image-hint">10MBまで・自動で縮小</span>
          </div>
        </section>

        <div className="profile-form-grid">
          <label>
            <span>表示名</span>
            <input value={safeDraft.displayName} maxLength={24} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} />
            <small>{safeDraft.displayName.length} / 24</small>
          </label>
          <label>
            <span>日記タイトル</span>
            <input value={safeDraft.diaryTitle} maxLength={60} onChange={(event) => setDraft((current) => ({ ...current, diaryTitle: event.target.value }))} />
            <small>{safeDraft.diaryTitle.length} / 60</small>
          </label>
          <label>
            <span>日記のサブタイトル</span>
            <input value={safeDraft.subtitle} maxLength={80} onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))} />
            <small>{safeDraft.subtitle.length} / 80</small>
          </label>
          <label className="profile-bio-field">
            <span>自己紹介文</span>
            <textarea value={safeDraft.bio} maxLength={120} rows={4} onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))} />
            <small>{safeDraft.bio.length} / 120</small>
          </label>
        </div>
      </div>

      <div className="profile-settings-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>キャンセル</button>
        <button type="button" className="primary-button" disabled={!canSave} onClick={() => onSave({ ...safeDraft, displayName: safeDraft.displayName.trim(), diaryTitle: safeDraft.diaryTitle.trim(), subtitle: safeDraft.subtitle.trim(), bio: safeDraft.bio.trim() })}>保存する</button>
      </div>
      </section>
      {cropSource && <ImageCropModal source={cropSource.source} aspect={cropSource.kind === "header" ? 5 : 1} outputWidth={cropSource.kind === "header" ? 1600 : 512} onCancel={() => setCropSource(null)} onUse={useCroppedImage} />}
    </>
  );
}

function VisitorsView() {
  return (
    <section className="content-panel visitors-panel">
      <div className="page-heading"><p className="eyebrow">VISITORS</p><h1>足あと</h1><p>あなたの日記を訪れた人</p></div>
      <div className="visitor-summary"><Footprints size={22} /><div><strong>今週 18人</strong><span>先週より4人増えました</span></div></div>
      <div className="visitor-list">
        {visitors.map((visitor) => (
          <button className="visitor-row" key={`${visitor.name}-${visitor.time}`}>
            <span className={`avatar avatar-${visitor.color}`}>{visitor.initial}</span>
            <span className="visitor-info"><strong>{visitor.name}</strong><span>「{visitor.entry}」を読みました</span></span>
            <time>{visitor.time}</time>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
      <p className="visitor-note">ログインしているユーザーの訪問だけが表示されます。</p>
    </section>
  );
}

function SideNavigation({ view, onView, open, onClose, onLogout, mobileOnly = false }: { view: View; onView: (view: View) => void; open: boolean; onClose: () => void; onLogout: () => void; mobileOnly?: boolean }) {
  return (
    <aside className={`mobile-drawer ${mobileOnly ? "mobile-nav" : "desktop-nav"} ${open ? "drawer-open" : ""}`}>
      <div className="drawer-head"><span>メニュー</span><button onClick={onClose}><X size={20} /></button></div>
      <button className={view === "visitors" ? "active" : ""} onClick={() => onView("visitors")}><Footprints size={19} />足あと</button>
      <button className={view === "search" ? "active" : ""} onClick={() => onView("search")}><Search size={19} />アカウント検索</button>
      <button className={view === "profile" ? "active" : ""} onClick={() => onView("profile")}><UserRound size={19} />プロフィール</button>
      <button><Settings size={19} />設定</button>
      <div className="drawer-spacer" />
      <button onClick={onLogout}><LogOut size={19} />ログアウト</button>
    </aside>
  );
}

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [profileReady, setProfileReady] = useState(false);
  const [view, setView] = useState<View>("week");
  const [weekStart, setWeekStart] = useState(() => new Date(2026, 9, 5));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 9, 1));
  const [selectedEntry, setSelectedEntry] = useState(initialEntries[3]);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>();
  const [editingDate, setEditingDate] = useState({ date: "2026-10-10", day: "土" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setSocialVersion] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | undefined>();
  const [relationshipKind, setRelationshipKind] = useState<RelationshipKind>("following");
  const visibleProfile = upgradeProfile(profile);
  const publicProfile = (view === "account" || view === "relationships") && selectedAccount ? upgradeProfile({
    displayName: selectedAccount.displayName,
    diaryTitle: `${selectedAccount.displayName}の日記`,
    subtitle: selectedAccount.bio,
    bio: selectedAccount.bio,
  }) : visibleProfile;
  const title = useMemo(() => view === "visitors" ? "足あと" : view === "profile" ? "プロフィール設定" : view === "search" ? "アカウントを探す" : view === "account" ? selectedAccount?.displayName ?? "アカウント" : view === "relationships" ? relationshipKind === "following" ? "フォロー" : "フォロワー" : visibleProfile.diaryTitle, [relationshipKind, selectedAccount?.displayName, visibleProfile.diaryTitle, view]);
  const currentEmail = typeof window !== "undefined" ? window.localStorage.getItem(localSessionKey) ?? "" : "";
  const socialAccounts = (() => {
    const accounts = getSocialAccounts();
    if (currentEmail && !accounts.some((account) => account.email === currentEmail)) {
      accounts.unshift({ email: currentEmail, username: visibleProfile.displayName, displayName: visibleProfile.displayName, bio: visibleProfile.bio });
    }
    return accounts;
  })();
  const publicEntries = selectedAccount
    ? selectedAccount.email === currentEmail
      ? entries
      : getSocialEntries(selectedAccount.email).map((entry) => {
        const date = parseDateValue(entry.date);
        const days = ["日", "月", "火", "水", "木", "金", "土"];
        return { ...entry, day: days[date.getDay()], updatedAt: "", views: 0 };
      })
    : [];

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem("hibi-diary-profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as Partial<Profile>;
        setProfile(upgradeProfile(parsed));
      }
    } catch {
      window.localStorage.removeItem("hibi-diary-profile");
    } finally {
      setProfileReady(true);
    }
  }, []);

  useEffect(() => {
    if (localAuthEnabled) {
      if (!window.localStorage.getItem(localSessionKey)) window.location.assign("/login");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    const redirectIfSignedOut = async () => {
      const { data } = await supabase.auth.getSession();
      if (active && !data.session) window.location.assign("/login");
    };
    void redirectIfSignedOut();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.assign("/login");
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadEntries = async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("diary_entries").select("*").order("date");
        if (!cancelled && !error) {
          const byDate = new Map<string, Entry>();
          for (const row of data ?? []) {
            const date = normalizeDateValue(row.date);
            byDate.set(date, { ...row, date, updatedAt: row.updated_at } as Entry);
          }

          // Keep the current week's demo entries available after a reload without
          // overwriting an entry the user has already saved for the same date.
          for (const seed of initialEntries) {
            const existing = byDate.get(seed.date);
            if (!existing) {
              const { updatedAt, ...seedData } = seed;
              const { error: seedError } = await supabase.from("diary_entries").insert({
                ...seedData,
                updated_at: updatedAt,
              });
              if (!seedError) byDate.set(seed.date, seed);
            } else {
              const metadata = {
                title: existing.title || seed.title,
                image: existing.image || seed.image,
              };
              if (metadata.title !== existing.title || metadata.image !== existing.image) {
                const { error: metadataError } = await supabase.from("diary_entries").update(metadata).eq("date", existing.date);
                if (!metadataError) byDate.set(seed.date, { ...existing, ...metadata });
              }
            }
          }
          setEntries([...byDate.values()]);
        }
        return;
      }

      const savedEntries = window.localStorage.getItem("hibi-diary-entries");
      if (!savedEntries) return;
      try {
        const saved = JSON.parse(savedEntries) as Entry[];
        const merged = saved.map((entry) => {
          const seed = initialEntries.find((item) => item.date === entry.date);
          return !entry.image && seed?.image ? { ...entry, image: seed.image } : entry;
        });
        if (!cancelled) setEntries(merged);
        window.localStorage.setItem("hibi-diary-entries", JSON.stringify(merged));
      } catch {
        window.localStorage.removeItem("hibi-diary-entries");
      }
    };
    void loadEntries();
    return () => { cancelled = true; };
  }, []);

  const changeView = (nextView: View) => { setView(nextView); setDrawerOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const searchAccounts = () => changeView("search");
  const goHome = () => { setSelectedAccount(undefined); changeView("week"); };
  const openRelationships = (kind: RelationshipKind, email: string) => { setRelationshipKind(kind); setSelectedAccount(email === currentEmail ? undefined : socialAccounts.find((account) => account.email === email)); changeView("relationships"); };
  const openAccount = (account: SocialAccount) => { setSelectedAccount(account); changeView("account"); };
  const toggleAccountFollow = (email: string) => {
    if (!currentEmail) return;
    toggleFollowing(currentEmail, email);
    setSocialVersion((version) => version + 1);
  };
  const openDetail = (entry: Entry) => { setSelectedEntry(entry); changeView("detail"); };
  const openEditor = (date: string, day: string, entry?: Entry) => {
    setEditingDate({ date, day });
    setEditingEntry(entry);
    changeView("compose");
  };
  const shiftWeek = (days: number) => setWeekStart((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + days));
  const pickCalendarDay = (day: number) => {
    const dateKey = toDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    const entry = entries.find((item) => normalizeDateValue(item.date) === dateKey);
    if (entry) {
      openDetail(entry);
      return;
    }
    setWeekStart(mondayOf(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)));
    changeView("week");
  };
  const saveEntry = async (entry: Entry): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { updatedAt, ...entryData } = entry;
      const { error } = await supabase.from("diary_entries").upsert({ ...entryData, date: normalizeDateValue(entry.date), updated_at: updatedAt }, { onConflict: "date" });
      if (error) {
        const reason = [error.message, error.details, error.hint, error.code && `code: ${error.code}`].filter(Boolean).join(" / ");
        console.error("Supabase save failed", { message: error.message, details: error.details, hint: error.hint, code: error.code });
        window.alert(`Supabase保存エラー\n${reason || "接続設定またはテーブル設定を確認してください"}`);
        return false;
      }
    }
    setEntries((current) => {
      const nextEntries = [...current.filter((item) => item.date !== entry.date), entry];
      if (!supabase) window.localStorage.setItem("hibi-diary-entries", JSON.stringify(nextEntries));
      return nextEntries;
    });
    setSelectedEntry(entry);
    changeView("detail");
    return true;
  };
  const saveProfile = (nextProfile: Profile) => {
    const upgradedProfile = upgradeProfile(nextProfile);
    setProfile(upgradedProfile);
    window.localStorage.setItem("hibi-diary-profile", JSON.stringify(upgradedProfile));
    changeView("week");
  };
  const handleLogout = async () => {
    if (localAuthEnabled) {
      window.localStorage.removeItem(localSessionKey);
      window.location.assign("/login");
      return;
    }
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <div className={`app-shell${profileReady ? "" : " profile-loading"}`}>
      <Header
        profile={visibleProfile}
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
        onSearch={searchAccounts}
        onHome={goHome}
        onMenu={() => setDrawerOpen(true)}
        onPost={() => openEditor("2026-10-10", "土", entries.find((entry) => normalizeDateValue(entry.date) === "2026-10-10"))}
      />
      <div className="mobile-title">{title}</div>
      <DiaryHero profile={publicProfile} />
      <main className="app-layout">
        <aside className="left-column">
          <ProfileCard profile={publicProfile} socialEmail={view === "account" ? selectedAccount?.email ?? "" : view === "relationships" ? selectedAccount?.email ?? currentEmail : currentEmail} currentEmail={currentEmail} publicAccount={view === "account"} onToggleFollow={toggleAccountFollow} onRelationships={openRelationships} />
          <MiniCalendar month={calendarMonth} entries={entries} onMonthChange={(offset) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))} onSelectMonth={(year, month) => setCalendarMonth(new Date(year, month, 1))} onToday={() => { const today = new Date(); setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }} onPick={pickCalendarDay} />
          {view !== "account" && <SideNavigation
            view={view}
            onView={(nextView) => nextView === "compose" ? openEditor("2026-10-10", "土", entries.find((entry) => normalizeDateValue(entry.date) === "2026-10-10")) : changeView(nextView)}
            open={false}
            onClose={() => undefined}
            onLogout={() => void handleLogout()}
          />}
        </aside>
        <section className="main-column">
          {view === "week" && <WeekView entries={entries} weekStart={weekStart} onShift={shiftWeek} onDetail={openDetail} onEdit={openEditor} />}
          {view === "detail" && <DetailView entry={selectedEntry} onBack={() => { setWeekStart(mondayOf(parseDateValue(selectedEntry.date))); changeView("week"); }} onEdit={() => openEditor(normalizeDateValue(selectedEntry.date), selectedEntry.day, selectedEntry)} />}
          {view === "compose" && <ComposeView entry={editingEntry} date={editingDate.date} day={editingDate.day} onCancel={() => changeView("week")} onSave={saveEntry} />}
          {view === "visitors" && <VisitorsView />}
          {view === "profile" && <ProfileSettingsView profile={visibleProfile} onCancel={() => changeView("week")} onSave={saveProfile} />}
          {view === "search" && <SearchView query={searchQuery} currentEmail={currentEmail} accounts={socialAccounts} onToggleFollow={toggleAccountFollow} onSelectAccount={openAccount} />}
          {view === "account" && selectedAccount && <AccountView entries={publicEntries} weekStart={weekStart} />}
          {view === "relationships" && <RelationshipView kind={relationshipKind} subjectEmail={selectedAccount?.email ?? currentEmail} currentEmail={currentEmail} accounts={socialAccounts} onBack={() => selectedAccount ? changeView("account") : changeView("week")} onToggleFollow={toggleAccountFollow} onSelectAccount={openAccount} />}
        </section>
      </main>

      {drawerOpen && <button className="drawer-overlay" aria-label="メニューを閉じる" onClick={() => setDrawerOpen(false)} />}
      {view !== "account" && <SideNavigation
          view={view}
          onView={(nextView) => nextView === "compose" ? openEditor("2026-10-10", "土", entries.find((entry) => normalizeDateValue(entry.date) === "2026-10-10")) : changeView(nextView)}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onLogout={() => void handleLogout()}
          mobileOnly
        />}

    </div>
  );
}
