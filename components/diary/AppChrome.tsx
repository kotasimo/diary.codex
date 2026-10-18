"use client";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Feather,
  Footprints,
  Menu,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getFollowerCount, getFollowingCount } from "@/app/lib/social";
import type { Entry, Profile, RelationshipKind, View } from "@/types/diary";
import { parseDateValue } from "@/utils/date";

export function ProfileAvatar({
  profile,
  large = false,
}: {
  profile: Profile;
  large?: boolean;
}) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "K";
  return (
    <div
      className={`avatar avatar-me${large ? " avatar-large" : ""}${profile.avatar ? " profile-avatar-image" : ""}`}
      style={
        profile.avatar
          ? { backgroundImage: `url(${profile.avatar})` }
          : undefined
      }
      aria-label={`${profile.displayName}のプロフィール画像`}
    >
      {profile.avatar ? null : initial}
    </div>
  );
}

export function Header({
  profile,
  searchQuery,
  onSearchQuery,
  onSearch,
  onHome,
  onMenu,
  hasUnreadNotifications,
  onNotifications,
}: {
  profile: Profile;
  searchQuery: string;
  onSearchQuery: (query: string) => void;
  onSearch: () => void;
  onHome: () => void;
  onMenu: () => void;
  hasUnreadNotifications: boolean;
  onNotifications: () => void;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="mobile-menu" onClick={onMenu} aria-label="メニュー">
          <Menu size={22} />
        </button>
        <button className="brand" aria-label="Hibi ホーム" onClick={onHome}>
          <span className="brand-mark">
            <Feather size={19} />
          </span>
          <span>Hibi</span>
        </button>
        <label className="header-search">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
            }}
            placeholder="アカウントを検索"
            aria-label="アカウントを検索"
          />
        </label>
        <div className="header-actions">
          <button
            className="mobile-search-button"
            aria-label="アカウントを検索"
            onClick={onSearch}
          >
            <Search size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="お知らせ"
            onClick={onNotifications}
          >
            <Bell size={20} />
            {hasUnreadNotifications && <span className="notification-dot" />}
          </button>
          <button
            className="header-profile-button"
            aria-label="プロフィールとメニュー"
            onClick={onMenu}
          >
            <ProfileAvatar profile={profile} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function DiaryHero({ profile }: { profile: Profile }) {
  return (
    <section
      className="diary-hero"
      aria-label="日記の紹介"
      style={
        profile.headerImage
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(38, 66, 78, .08), rgba(38, 66, 78, .36)), url(${profile.headerImage})`,
            }
          : undefined
      }
    >
      <div className="diary-hero-copy">
        <h1>{profile.diaryTitle}</h1>
        <p>{profile.subtitle}</p>
      </div>
    </section>
  );
}

export function MobileProfileSummary({ profile }: { profile: Profile }) {
  return (
    <section className="mobile-profile-summary" aria-label="プロフィール概要">
      <div className="mobile-profile-identity">
        <ProfileAvatar profile={profile} large />
        <strong>{profile.displayName}</strong>
      </div>
      <p>{profile.bio}</p>
    </section>
  );
}

export function ProfileCard({
  profile,
  socialEmail,
  currentEmail,
  socialVersion,
  onRelationships,
}: {
  profile: Profile;
  socialEmail: string;
  currentEmail: string;
  socialVersion: number;
  onRelationships: (kind: RelationshipKind, email: string) => void;
}) {
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  useEffect(() => {
    setFollowingCount(getFollowingCount(socialEmail));
    setFollowerCount(getFollowerCount(socialEmail));
  }, [currentEmail, socialEmail, socialVersion]);
  return (
    <section className="profile-card">
      <div className="profile-identity">
        <ProfileAvatar profile={profile} large />
        <p className="profile-name">{profile.displayName}</p>
      </div>
      <p className="profile-bio">{profile.bio}</p>
      <div className="profile-follow-summary">
        <button
          type="button"
          onClick={() => onRelationships("following", socialEmail)}
        >
          <strong>{followingCount}</strong>
          <span>フォロー</span>
        </button>
        <button
          type="button"
          onClick={() => onRelationships("followers", socialEmail)}
        >
          <strong>{followerCount}</strong>
          <span>フォロワー</span>
        </button>
      </div>
    </section>
  );
}

export function MiniCalendar({
  month,
  entries,
  onMonthChange,
  onSelectMonth,
  onToday,
  onPick,
}: {
  month: Date;
  entries: Entry[];
  onMonthChange: (offset: number) => void;
  onSelectMonth: (year: number, month: number) => void;
  onToday: () => void;
  onPick: (day: number) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const [yearInput, setYearInput] = useState(String(year));
  const [monthInput, setMonthInput] = useState(String(monthIndex + 1));
  useEffect(() => {
    setYearInput(String(year));
    setMonthInput(String(monthIndex + 1));
  }, [year, monthIndex]);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const entryDates = new Set(
    entries
      .filter((entry) => {
        const date = parseDateValue(entry.date);
        return date.getFullYear() === year && date.getMonth() === monthIndex;
      })
      .map((entry) => parseDateValue(entry.date).getDate()),
  );
  return (
    <section className="calendar-card">
      <div className="calendar-heading">
        <button aria-label="前月" onClick={() => onMonthChange(-1)}>
          <ChevronLeft size={17} />
        </button>
        <strong>
          {year}年{monthIndex + 1}月
        </strong>
        <button aria-label="次月" onClick={() => onMonthChange(1)}>
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="calendar-grid calendar-labels">
        {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid calendar-days">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
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
          <label>
            <input
              type="number"
              min="1900"
              max="2100"
              value={yearInput}
              onChange={(event) => {
                const value = event.target.value;
                setYearInput(value);
                const nextYear = Number(value);
                if (
                  value.length === 4 &&
                  Number.isInteger(nextYear) &&
                  nextYear >= 1900 &&
                  nextYear <= 2100
                )
                  onSelectMonth(nextYear, monthIndex);
              }}
            />
            年
          </label>
          <label>
            <input
              type="number"
              min="1"
              max="12"
              value={monthInput}
              onChange={(event) => {
                const value = event.target.value;
                setMonthInput(value);
                const nextMonth = Number(value);
                if (
                  Number.isInteger(nextMonth) &&
                  nextMonth >= 1 &&
                  nextMonth <= 12
                )
                  onSelectMonth(year, nextMonth - 1);
              }}
            />
            月
          </label>
        </div>
        <button className="calendar-today-button" onClick={onToday}>
          今月
        </button>
      </div>
    </section>
  );
}

export function SideNavigation({
  view,
  onView,
  open,
  onClose,
  mobileOnly = false,
  children,
}: {
  view: View;
  onView: (view: View) => void;
  open: boolean;
  onClose: () => void;
  mobileOnly?: boolean;
  children?: ReactNode;
}) {
  const selectView = (nextView: View) => {
    onView(nextView);
    if (mobileOnly) onClose();
  };

  return (
    <aside
      className={`mobile-drawer ${mobileOnly ? "mobile-nav" : "desktop-nav"} ${open ? "drawer-open" : ""}`}
    >
      <div className="drawer-head">
        <span>メニュー</span>
        <button onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children && <div className="mobile-drawer-context">{children}</div>}
      {mobileOnly && (
        <button
          className={view === "search" ? "active" : ""}
          onClick={() => selectView("search")}
        >
          <Search size={19} />
          検索
        </button>
      )}
      <button
        className={view === "visitors" ? "active" : ""}
        onClick={() => selectView("visitors")}
      >
        <Footprints size={19} />
        足あと
      </button>
      <button
        className={view === "profile" ? "active" : ""}
        onClick={() => selectView("profile")}
      >
        <UserRound size={19} />
        プロフィール
      </button>
      <button>
        <Settings size={19} />
        設定
      </button>
    </aside>
  );
}
