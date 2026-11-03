"use client";

import {
  DiaryHero,
  Header,
  MiniCalendar,
  ProfileCard,
  SideNavigation,
} from "@/components/diary/AppChrome";
import { ProfileSettingsView } from "@/components/diary/EditorViews";
import { RecordsView } from "@/components/diary/RecordsView";
import { RecordTabs } from "@/components/diary/RecordTabs";
import {
  DetailView,
  NotificationsView,
  RelationshipView,
  SearchView,
  VisitorsView,
  WeekView,
} from "@/components/diary/ReadingViews";
import { useDiaryApp } from "@/hooks/useDiaryApp";
import type { View } from "@/types/diary";
import { normalizeDateValue } from "@/utils/date";
import { useState } from "react";

type MobileDrawerMode = "menu" | "search" | "notifications";

export default function HomePage() {
  const app = useDiaryApp();
  const [mobileDrawerMode, setMobileDrawerMode] =
    useState<MobileDrawerMode>("menu");
  const isMobileViewport = () =>
    window.matchMedia("(max-width: 767px)").matches;
  const openMobileDrawer = (mode: MobileDrawerMode) => {
    setMobileDrawerMode(mode);
    app.setDrawerOpen(true);
  };
  const openNavigationView = (nextView: View) => app.changeView(nextView);
  const sidebarEmail =
    app.view === "account" || app.view === "detail"
      ? (app.selectedAccount?.email ?? "")
      : app.view === "relationships"
        ? (app.selectedAccount?.email ?? app.currentEmail)
        : app.currentEmail;

  return (
    <div
      className={`app-shell view-${app.view}${app.profileReady ? "" : " profile-loading"}`}
    >
      <Header
        profile={app.visibleProfile}
        searchQuery={app.searchQuery}
        onSearchQuery={app.setSearchQuery}
        onSearch={() =>
          isMobileViewport()
            ? openMobileDrawer("search")
            : app.changeView("search")
        }
        onHome={app.goHome}
        onMenu={() => openMobileDrawer("menu")}
        hasUnreadNotifications={app.hasUnreadNotifications}
        onNotifications={() => {
          if (isMobileViewport()) {
            app.markAllNotificationsRead();
            openMobileDrawer("notifications");
            return;
          }
          app.openNotifications();
        }}
        onRecords={() =>
          app.view === "records" ? app.goHome() : app.changeView("records")
        }
        recordsActive={app.view === "records"}
      />
      <div className="mobile-title">{app.title}</div>
      {app.view !== "records" && <DiaryHero profile={app.publicProfile} />}
      <main
        className={`app-layout${app.selectedAccount && (app.view === "account" || app.view === "detail") ? " public-account-layout" : ""}`}
      >
        <aside className="left-column">
          <ProfileCard
            profile={app.publicProfile}
            socialEmail={sidebarEmail}
            currentEmail={app.currentEmail}
            socialVersion={app.socialVersion}
            onRelationships={app.openRelationships}
          />
          <MiniCalendar
            month={app.calendarMonth}
            entries={app.view === "account" ? app.publicEntries : app.entries}
            onMonthChange={(offset) =>
              app.setCalendarMonth(
                (current) =>
                  new Date(
                    current.getFullYear(),
                    current.getMonth() + offset,
                    1,
                  ),
              )
            }
            onSelectMonth={(year, month) =>
              app.setCalendarMonth(new Date(year, month, 1))
            }
            onToday={() => {
              const today = new Date();
              app.setCalendarMonth(
                new Date(today.getFullYear(), today.getMonth(), 1),
              );
            }}
            onPick={(day) => {
              if (app.view === "records") {
                const selected = new Date(
                  app.calendarMonth.getFullYear(),
                  app.calendarMonth.getMonth(),
                  day,
                );
                const month = String(selected.getMonth() + 1).padStart(2, "0");
                const date = String(selected.getDate()).padStart(2, "0");
                window.dispatchEvent(
                  new CustomEvent("records:select-date", {
                    detail: `${selected.getFullYear()}-${month}-${date}`,
                  }),
                );
                return;
              }
              app.pickCalendarDay(day);
            }}
          />
          {app.view !== "account" && (
            <SideNavigation
              view={app.view}
              onView={openNavigationView}
              open={false}
              onClose={() => undefined}
            />
          )}
        </aside>
        <section className="main-column">
          {app.view === "week" && (
            <WeekView
              entries={app.entries}
              weekStart={app.weekStart}
              onShift={app.shiftWeek}
              onDetail={app.openDetail}
            />
          )}
          {app.view === "detail" && (
            <DetailView
              key={app.selectedEntry.date}
              entry={app.selectedEntry}
              readOnly={Boolean(app.selectedAccount)}
              dayRecords={
                app.selectedAccount ? undefined : app.selectedDayRecords
              }
              onPrevious={() => app.moveDetail(-1)}
              onNext={() => app.moveDetail(1)}
              onBack={app.returnToSelectedWeek}
              onUpdate={app.updateEntry}
            />
          )}
          {app.view === "visitors" && (
            <VisitorsView
              records={app.visitorRecords}
              accounts={app.socialAccounts}
            />
          )}
          {app.view === "notifications" && (
            <NotificationsView
              notifications={app.notifications}
              accounts={app.socialAccounts}
            />
          )}
          {app.view === "profile" && (
            <ProfileSettingsView
              profile={app.visibleProfile}
              onCancel={() => app.changeView("week")}
              onSave={app.saveProfile}
            />
          )}
          {app.view === "search" && (
            <SearchView
              query={app.searchQuery}
              currentEmail={app.currentEmail}
              accounts={app.socialAccounts}
              onToggleFollow={app.toggleAccountFollow}
              onSelectAccount={app.openAccount}
            />
          )}
          {app.view === "records" && (
            <>
              <RecordTabs
                tabs={app.recordTabs}
                activeId={app.activeRecordTabId}
                onSelect={app.selectRecordTab}
                onAdd={app.addRecordTab}
                onClose={app.closeRecordTab}
                onRename={app.renameRecordTab}
              />
              <RecordsView
                key={app.activeRecordTabId}
                records={app.records}
                onAddRecord={app.addLifeRecord}
              />
            </>
          )}
          {app.view === "account" && app.selectedAccount && (
            <WeekView
              entries={app.publicEntries}
              weekStart={app.weekStart}
              onShift={app.shiftWeek}
              onDetail={app.openDetail}
              readOnly
            />
          )}
          {app.view === "relationships" && (
            <RelationshipView
              kind={app.relationshipKind}
              subjectEmail={app.selectedAccount?.email ?? app.currentEmail}
              currentEmail={app.currentEmail}
              accounts={app.socialAccounts}
              onBack={() =>
                app.selectedAccount
                  ? app.changeView("account")
                  : app.changeView("week")
              }
              onToggleFollow={app.toggleAccountFollow}
              onSelectAccount={app.openAccount}
            />
          )}
        </section>
      </main>
      {app.drawerOpen && (
        <button
          className="drawer-overlay"
          aria-label="メニューを閉じる"
          onClick={() => app.setDrawerOpen(false)}
        />
      )}
      <SideNavigation
        view={app.view}
        onView={openNavigationView}
        open={app.drawerOpen}
        onClose={() => app.setDrawerOpen(false)}
        mobileOnly
        title={
          mobileDrawerMode === "search"
            ? "検索"
            : mobileDrawerMode === "notifications"
              ? "お知らせ"
              : "メニュー"
        }
        panelKind={mobileDrawerMode}
        showNavigation={mobileDrawerMode === "menu"}
        onSearchPanel={() => setMobileDrawerMode("search")}
      >
        {mobileDrawerMode === "menu" && (
          <>
            <ProfileCard
              profile={app.publicProfile}
              socialEmail={sidebarEmail}
              currentEmail={app.currentEmail}
              socialVersion={app.socialVersion}
              onRelationships={app.openRelationships}
            />
            <MiniCalendar
              month={app.calendarMonth}
              entries={app.entries}
              onMonthChange={(offset) =>
                app.setCalendarMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() + offset,
                      1,
                    ),
                )
              }
              onSelectMonth={(year, month) =>
                app.setCalendarMonth(new Date(year, month, 1))
              }
              onToday={() => {
                const today = new Date();
                app.setCalendarMonth(
                  new Date(today.getFullYear(), today.getMonth(), 1),
                );
              }}
              onPick={(day) => {
                app.pickCalendarDay(day);
                app.setDrawerOpen(false);
              }}
            />
          </>
        )}
        {mobileDrawerMode === "search" && (
          <div className="mobile-search-panel">
            <input
              type="search"
              value={app.searchQuery}
              onChange={(event) => app.setSearchQuery(event.target.value)}
              placeholder="アカウントを検索"
              aria-label="アカウントを検索"
              autoFocus
            />
            <SearchView
              query={app.searchQuery}
              currentEmail={app.currentEmail}
              accounts={app.socialAccounts}
              onToggleFollow={app.toggleAccountFollow}
              onSelectAccount={(account) => {
                app.openAccount(account);
                app.setDrawerOpen(false);
              }}
            />
          </div>
        )}
        {mobileDrawerMode === "notifications" && (
          <NotificationsView
            notifications={app.notifications}
            accounts={app.socialAccounts}
          />
        )}
      </SideNavigation>
    </div>
  );
}
