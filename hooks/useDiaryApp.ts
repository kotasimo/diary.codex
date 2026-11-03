"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSocialAccounts,
  getSocialEntries,
  toggleFollowing,
  type SocialAccount,
} from "@/app/lib/social";
import {
  defaultProfile,
  initialEntries,
  upgradeProfile,
} from "@/lib/diary-data";
import {
  loadDiaryEntries,
  saveDiaryEntry,
} from "@/lib/diary-repository";
import {
  createTabId,
  defaultTabId,
  defaultTabName,
  loadLifeRecords,
  loadRecordsForDate,
  loadRecordTabs,
  removeLifeRecords,
  saveLifeRecords,
  saveRecordTabs,
} from "@/lib/record-repository";
import {
  addNotification,
  getNotifications,
  getVisitorRecords,
  markNotificationsRead,
  recordPageVisit,
} from "@/lib/diary-storage";
import type {
  Entry,
  LifeRecord,
  Profile,
  RecordTab,
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
  const [records, setRecords] = useState<LifeRecord[]>([]);
  const [recordTabs, setRecordTabs] = useState<RecordTab[]>([
    { id: defaultTabId, name: defaultTabName },
  ]);
  const [activeRecordTabId, setActiveRecordTabId] = useState(defaultTabId);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [profileReady, setProfileReady] = useState(false);
  const [view, setView] = useState<View>("week");
  const [notificationsReturnView, setNotificationsReturnView] =
    useState<View>("week");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(
    () => {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    },
  );
  const [selectedEntry, setSelectedEntry] = useState<Entry>(() => {
    const today = new Date();
    return { date: toDateKey(today), day: dayNames[today.getDay()], content: "", updatedAt: "", views: 0 };
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [socialVersion, setSocialVersion] = useState(0);
  const [currentEmail] = useState("local@hibi.app");
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
              : view === "records"
                ? "記録"
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
  const socialAccounts = (() => {
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
  })();
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
    try {
      const savedProfile = window.localStorage.getItem("hibi-diary-profile");
      if (savedProfile) setProfile(upgradeProfile(JSON.parse(savedProfile) as Partial<Profile>));
    } catch {
      window.localStorage.removeItem("hibi-diary-profile");
    } finally {
      setProfileReady(true);
    }
    void loadDiaryEntries().then(setEntries);
    const storedTabs = loadRecordTabs();
    setRecordTabs(storedTabs.tabs);
    setActiveRecordTabId(storedTabs.activeId);
    setRecords(loadLifeRecords(storedTabs.activeId));
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
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setWeekStart(mondayOf(today));
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
  // Everything written in the record tabs on the day being read. This reads
  // storage rather than state, so `records` is listed to recompute it after
  // the open tab is edited; the linter cannot see that dependency.
  const selectedDayRecords = useMemo(
    () => loadRecordsForDate(recordTabs, normalizeDateValue(selectedEntry.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recordTabs, selectedEntry.date, records],
  );
  const markAllNotificationsRead = () => {
    markNotificationsRead(currentEmail);
    setSocialVersion((version) => version + 1);
  };
  const openNotifications = () => {
    if (view === "notifications") {
      changeView(notificationsReturnView);
      return;
    }
    setNotificationsReturnView(view);
    markAllNotificationsRead();
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
  // Saves as the day page is typed in, so it never navigates or interrupts.
  const updateEntry = async (entry: Entry) => {
    const result = await saveDiaryEntry(entry);
    if (!result.ok) return false;
    setEntries((current) => [
      ...current.filter((item) => item.date !== entry.date),
      entry,
    ]);
    setSelectedEntry(entry);
    return true;
  };
  const selectRecordTab = (tabId: string) => {
    if (tabId === activeRecordTabId) return;
    setActiveRecordTabId(tabId);
    setRecords(loadLifeRecords(tabId));
    saveRecordTabs(recordTabs, tabId);
  };
  const addRecordTab = () => {
    const usedNames = new Set(recordTabs.map((tab) => tab.name));
    let suffix = recordTabs.length + 1;
    while (usedNames.has(`${defaultTabName} ${suffix}`)) suffix += 1;
    const tab = { id: createTabId(), name: `${defaultTabName} ${suffix}` };
    const nextTabs = [...recordTabs, tab];
    setRecordTabs(nextTabs);
    setActiveRecordTabId(tab.id);
    setRecords([]);
    saveLifeRecords(tab.id, []);
    saveRecordTabs(nextTabs, tab.id);
  };
  const renameRecordTab = (tabId: string, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const nextTabs = recordTabs.map((tab) =>
      tab.id === tabId ? { ...tab, name: trimmedName } : tab,
    );
    setRecordTabs(nextTabs);
    saveRecordTabs(nextTabs, activeRecordTabId);
  };
  const closeRecordTab = (tabId: string) => {
    if (recordTabs.length <= 1) return;
    const closingIndex = recordTabs.findIndex((tab) => tab.id === tabId);
    if (closingIndex < 0) return;
    const closingTab = recordTabs[closingIndex];
    if (
      loadLifeRecords(tabId).length &&
      !window.confirm(
        `「${closingTab.name}」を閉じると、このタブに書いた記録も削除されます。よろしいですか？`,
      )
    )
      return;
    const nextTabs = recordTabs.filter((tab) => tab.id !== tabId);
    const nextActiveId =
      tabId === activeRecordTabId
        ? nextTabs[Math.min(closingIndex, nextTabs.length - 1)].id
        : activeRecordTabId;
    setRecordTabs(nextTabs);
    removeLifeRecords(tabId);
    saveRecordTabs(nextTabs, nextActiveId);
    if (nextActiveId !== activeRecordTabId) {
      setActiveRecordTabId(nextActiveId);
      setRecords(loadLifeRecords(nextActiveId));
    }
  };
  const addLifeRecord = (content: string, date?: string) => {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      genre: "メモ",
      content,
      createdAt: new Date().toISOString(),
      date: targetDate,
    };
    setRecords((current) => {
      const nextRecords = current.filter(
        (item) => (item.date ?? item.createdAt.slice(0, 10)) !== targetDate,
      );
      // Keep whatever was typed, blank lines included; only a fully cleared
      // day drops its record. Trimming here wiped newlines as they were typed.
      if (content) nextRecords.unshift(record);
      saveLifeRecords(activeRecordTabId, nextRecords);
      return nextRecords;
    });
  };
  const saveProfile = async (nextProfile: Profile) => {
    const upgradedProfile = upgradeProfile(nextProfile);
    setProfile(upgradedProfile);
    window.localStorage.setItem("hibi-diary-profile", JSON.stringify(upgradedProfile));
    changeView("week");
  };

  return {
    entries,
    records,
    recordTabs,
    activeRecordTabId,
    selectedDayRecords,
    profileReady,
    view,
    weekStart,
    calendarMonth,
    selectedEntry,
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
    setCalendarMonth,
    setDrawerOpen,
    setSearchQuery,
    changeView,
    goHome,
    openRelationships,
    openAccount,
    toggleAccountFollow,
    openNotifications,
    markAllNotificationsRead,
    openDetail,
    returnToSelectedWeek,
    moveDetail,
    shiftWeek,
    pickCalendarDay,
    updateEntry,
    addLifeRecord,
    selectRecordTab,
    addRecordTab,
    renameRecordTab,
    closeRecordTab,
    saveProfile,
  };
}
