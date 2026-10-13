"use client";

import { useEffect, useMemo, useState } from "react";
import { localAuthEnabled, localSessionKey } from "@/app/lib/auth";
import {
  getSocialAccounts,
  getSocialEntries,
  hydrateFollowing,
  toggleFollowing,
  type SocialAccount,
} from "@/app/lib/social";
import { getSupabaseClient } from "@/app/lib/supabase";
import {
  defaultProfile,
  initialEntries,
  upgradeProfile,
} from "@/lib/diary-data";
import {
  loadDiaryEntries,
  persistLocalDiaryEntries,
  saveDiaryEntry,
} from "@/lib/diary-repository";
import {
  addComment,
  addNotification,
  getArticleInteraction,
  getComments,
  getNotifications,
  getVisitorRecords,
  markNotificationsRead,
  hydrateSocialData,
  recordPageVisit,
  saveArticleInteraction,
} from "@/lib/diary-storage";
import type {
  ArticleInteraction,
  Comment,
  Entry,
  Profile,
  RelationshipKind,
  View,
} from "@/types/diary";
import {
  dayNames,
  mondayOf,
  normalizeDateValue,
  parseDateValue,
  toDateKey,
  withDerivedEntryDay,
} from "@/utils/date";

export function useDiaryApp() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [profileReady, setProfileReady] = useState(false);
  const [view, setView] = useState<View>("week");
  const [notificationsReturnView, setNotificationsReturnView] =
    useState<View>("week");
  const [weekStart, setWeekStart] = useState(() => new Date(2026, 9, 5));
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(2026, 9, 1),
  );
  const [selectedEntry, setSelectedEntry] = useState(initialEntries[3]);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>();
  const [editingDate, setEditingDate] = useState({
    date: "2026-10-10",
    day: "土",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [socialVersion, setSocialVersion] = useState(0);
  const [currentEmail, setCurrentEmail] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<
    SocialAccount | undefined
  >();
  const [relationshipKind, setRelationshipKind] =
    useState<RelationshipKind>("following");
  const visibleProfile = upgradeProfile(profile);
  const publicProfile =
    (view === "account" || view === "detail" || view === "relationships") &&
    selectedAccount
      ? upgradeProfile({
          displayName: selectedAccount.displayName,
          diaryTitle: `${selectedAccount.displayName}の日記`,
          subtitle: selectedAccount.bio,
          bio: selectedAccount.bio,
        })
      : visibleProfile;
  const title = useMemo(
    () =>
      view === "visitors"
        ? "足あと"
        : view === "profile"
          ? "プロフィール設定"
          : view === "search"
            ? "アカウントを探す"
            : view === "notifications"
              ? "お知らせ"
              : view === "account"
                ? (selectedAccount?.displayName ?? "アカウント")
                : view === "relationships"
                  ? relationshipKind === "following"
                    ? "フォロー"
                    : "フォロワー"
                  : visibleProfile.diaryTitle,
    [
      relationshipKind,
      selectedAccount?.displayName,
      visibleProfile.diaryTitle,
      view,
    ],
  );
  const socialAccounts = useMemo(() => {
    const accounts = getSocialAccounts();
    if (
      currentEmail &&
      !accounts.some((account) => account.email === currentEmail)
    )
      accounts.unshift({
        email: currentEmail,
        username: visibleProfile.displayName,
        displayName: visibleProfile.displayName,
        bio: visibleProfile.bio,
      });
    return accounts;
  }, [currentEmail, visibleProfile.bio, visibleProfile.displayName]);
  const visitorRecords = getVisitorRecords(currentEmail);
  const notifications = getNotifications(currentEmail);
  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.read,
  );
  const publicEntries = selectedAccount
    ? selectedAccount.email === currentEmail
      ? entries
      : getSocialEntries(selectedAccount.email).map(withDerivedEntryDay)
    : [];

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem("hibi-diary-profile");
      if (savedProfile)
        setProfile(
          upgradeProfile(JSON.parse(savedProfile) as Partial<Profile>),
        );
    } catch {
      window.localStorage.removeItem("hibi-diary-profile");
    } finally {
      setProfileReady(true);
    }
  }, []);
  useEffect(() => {
    let active = true;
    const loadEmail = async () => {
      if (localAuthEnabled) {
        if (active) setCurrentEmail(window.localStorage.getItem(localSessionKey) ?? "");
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (active) setCurrentEmail(data.user?.email?.toLowerCase() ?? "");
    };
    void loadEmail();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!currentEmail || localAuthEnabled) return;
    void Promise.all([hydrateSocialData(currentEmail), hydrateFollowing(currentEmail)])
      .then(() => setSocialVersion((version) => version + 1));
  }, [currentEmail]);
  useEffect(() => {
    if (localAuthEnabled || !selectedAccount || selectedAccount.email === currentEmail)
      return;
    void hydrateSocialData(selectedAccount.email)
      .then(() => setSocialVersion((version) => version + 1));
  }, [currentEmail, selectedAccount]);
  useEffect(() => {
    if (
      !selectedAccount ||
      !currentEmail ||
      selectedAccount.email === currentEmail ||
      (view !== "account" && view !== "detail")
    )
      return;
    recordPageVisit(
      selectedAccount.email,
      currentEmail,
      view === "detail" ? selectedEntry : undefined,
    );
  }, [currentEmail, selectedAccount, selectedEntry, view]);
  useEffect(() => {
    if (localAuthEnabled) {
      if (!window.localStorage.getItem(localSessionKey))
        window.location.assign("/login");
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
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) window.location.assign("/login");
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    void loadDiaryEntries().then((loaded) => {
      if (!cancelled && loaded) setEntries(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const changeView = (nextView: View) => {
    setView(nextView);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goHome = () => {
    setSelectedAccount(undefined);
    changeView("week");
  };
  const openRelationships = (kind: RelationshipKind, email: string) => {
    setRelationshipKind(kind);
    setSelectedAccount(
      email === currentEmail
        ? undefined
        : socialAccounts.find((account) => account.email === email),
    );
    changeView("relationships");
  };
  const openAccount = (account: SocialAccount) => {
    const accountEntries =
      account.email === currentEmail
        ? entries
        : getSocialEntries(account.email).map(withDerivedEntryDay);
    const firstEntry = accountEntries[accountEntries.length - 1];
    if (firstEntry) {
      const firstDate = parseDateValue(firstEntry.date);
      setCalendarMonth(
        new Date(firstDate.getFullYear(), firstDate.getMonth(), 1),
      );
      setWeekStart(mondayOf(firstDate));
    }
    setSelectedAccount(account);
    changeView("account");
  };
  const toggleAccountFollow = (email: string) => {
    if (!currentEmail) return;
    const isFollowing = toggleFollowing(currentEmail, email);
    if (isFollowing)
      addNotification(email, { kind: "follow", actorEmail: currentEmail });
    setSocialVersion((version) => version + 1);
  };
  const interactionOwnerEmail = selectedAccount?.email ?? currentEmail;
  const selectedInteraction = getArticleInteraction(
    interactionOwnerEmail,
    selectedEntry.date,
  );
  const selectedComments = getComments(
    interactionOwnerEmail,
    selectedEntry.date,
  );
  const updateSelectedInteraction = (
    update: (current: ArticleInteraction) => ArticleInteraction,
  ) => {
    const next = update(
      getArticleInteraction(interactionOwnerEmail, selectedEntry.date),
    );
    saveArticleInteraction(interactionOwnerEmail, selectedEntry.date, next);
    setSocialVersion((version) => version + 1);
  };
  const toggleSelectedLike = () => {
    if (!currentEmail) return;
    const isNewLike = !selectedInteraction.likes.includes(currentEmail);
    updateSelectedInteraction((current) => ({
      ...current,
      likes: current.likes.includes(currentEmail)
        ? current.likes.filter((email) => email !== currentEmail)
        : [...current.likes, currentEmail],
    }));
    if (isNewLike) {
      addNotification(interactionOwnerEmail, {
        kind: "like",
        actorEmail: currentEmail,
        entryDate: selectedEntry.date,
        entryTitle: selectedEntry.title,
      });
    }
  };
  const addSelectedComment = (body: string) => {
    if (!currentEmail || !body.trim()) return;
    const comment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      authorEmail: currentEmail,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    addComment(interactionOwnerEmail, selectedEntry.date, comment);
    addNotification(interactionOwnerEmail, {
      kind: "comment",
      actorEmail: currentEmail,
      entryDate: selectedEntry.date,
      entryTitle: selectedEntry.title,
      commentBody: comment.body,
    });
    setSocialVersion((version) => version + 1);
  };
  const openNotifications = () => {
    if (view === "notifications") {
      changeView(notificationsReturnView);
      return;
    }
    setNotificationsReturnView(view);
    markNotificationsRead(currentEmail);
    setSocialVersion((version) => version + 1);
    changeView("notifications");
  };
  const openDetail = (entry: Entry) => {
    setSelectedEntry(entry);
    changeView("detail");
  };
  const returnToSelectedWeek = () => {
    setWeekStart(mondayOf(parseDateValue(selectedEntry.date)));
    changeView(selectedAccount ? "account" : "week");
  };
  const moveDetail = (direction: -1 | 1) => {
    const availableEntries = selectedAccount ? publicEntries : entries;
    const currentDate = parseDateValue(selectedEntry.date);
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + direction,
    );
    const targetIso = toDateKey(targetDate);
    setSelectedEntry(
      availableEntries.find(
        (entry) => normalizeDateValue(entry.date) === targetIso,
      ) ?? {
        date: targetIso,
        day: dayNames[targetDate.getDay()],
        content: "",
        updatedAt: "",
        views: 0,
      },
    );
    setWeekStart(mondayOf(targetDate));
  };
  const openEditor = (date: string, day: string, entry?: Entry) => {
    setEditingDate({ date, day });
    setEditingEntry(entry);
    changeView("compose");
  };
  const shiftWeek = (days: number) =>
    setWeekStart(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + days,
        ),
    );
  const pickCalendarDay = (day: number) => {
    const pickedDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    setWeekStart(mondayOf(pickedDate));
    if (selectedAccount) {
      if (view !== "account") changeView("account");
      return;
    }
    changeView("week");
  };
  const saveEntry = async (entry: Entry) => {
    const result = await saveDiaryEntry(entry);
    if (!result.ok) {
      window.alert(
        `Supabase保存エラー\n${result.message || "接続設定またはテーブル設定を確認してください"}`,
      );
      return false;
    }
    setEntries((current) => {
      const nextEntries = [
        ...current.filter((item) => item.date !== entry.date),
        entry,
      ];
      persistLocalDiaryEntries(nextEntries);
      return nextEntries;
    });
    setSelectedEntry(entry);
    changeView("detail");
    return true;
  };
  const saveProfile = (nextProfile: Profile) => {
    const upgradedProfile = upgradeProfile(nextProfile);
    setProfile(upgradedProfile);
    window.localStorage.setItem(
      "hibi-diary-profile",
      JSON.stringify(upgradedProfile),
    );
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

  return {
    entries,
    profileReady,
    view,
    weekStart,
    calendarMonth,
    selectedEntry,
    editingEntry,
    editingDate,
    drawerOpen,
    searchQuery,
    socialVersion,
    selectedAccount,
    relationshipKind,
    visibleProfile,
    publicProfile,
    title,
    currentEmail,
    socialAccounts,
    visitorRecords,
    notifications,
    hasUnreadNotifications,
    publicEntries,
    selectedInteraction,
    selectedComments,
    setCalendarMonth,
    setDrawerOpen,
    setSearchQuery,
    changeView,
    goHome,
    openRelationships,
    openAccount,
    toggleAccountFollow,
    toggleSelectedLike,
    addSelectedComment,
    openNotifications,
    openDetail,
    returnToSelectedWeek,
    moveDetail,
    openEditor,
    shiftWeek,
    pickCalendarDay,
    saveEntry,
    saveProfile,
    handleLogout,
  };
}
