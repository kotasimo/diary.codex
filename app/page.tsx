"use client";

import {
  DiaryHero,
  Header,
  MiniCalendar,
  ProfileCard,
  SideNavigation,
} from "@/components/diary/AppChrome";
import {
  ComposeView,
  ProfileSettingsView,
} from "@/components/diary/EditorViews";
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

export default function HomePage() {
  const app = useDiaryApp();
  const openNavigationView = (nextView: View) => {
    if (nextView === "compose") {
      app.openEditor(
        "2026-10-10",
        "土",
        app.entries.find(
          (entry) => normalizeDateValue(entry.date) === "2026-10-10",
        ),
      );
      return;
    }
    app.changeView(nextView);
  };
  const sidebarEmail =
    app.view === "account" || app.view === "detail"
      ? (app.selectedAccount?.email ?? "")
      : app.view === "relationships"
        ? (app.selectedAccount?.email ?? app.currentEmail)
        : app.currentEmail;

  return (
    <div className={`app-shell${app.profileReady ? "" : " profile-loading"}`}>
      <Header
        profile={app.visibleProfile}
        searchQuery={app.searchQuery}
        onSearchQuery={app.setSearchQuery}
        onSearch={() => app.changeView("search")}
        onHome={app.goHome}
        onMenu={() => app.setDrawerOpen(true)}
        hasUnreadNotifications={app.hasUnreadNotifications}
        onNotifications={app.openNotifications}
      />
      <div className="mobile-title">{app.title}</div>
      <DiaryHero profile={app.publicProfile} />
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
            onPick={app.pickCalendarDay}
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
              onEdit={app.openEditor}
            />
          )}
          {app.view === "detail" && (
            <DetailView
              entry={app.selectedEntry}
              readOnly={Boolean(app.selectedAccount)}
              interaction={app.selectedInteraction}
              currentEmail={app.currentEmail}
              onToggleLike={app.toggleSelectedLike}
              comments={app.selectedComments}
              onAddComment={app.addSelectedComment}
              onPrevious={() => app.moveDetail(-1)}
              onNext={() => app.moveDetail(1)}
              onBack={app.returnToSelectedWeek}
              onEdit={() =>
                app.openEditor(
                  normalizeDateValue(app.selectedEntry.date),
                  app.selectedEntry.day,
                  app.selectedEntry,
                )
              }
            />
          )}
          {app.view === "compose" && (
            <ComposeView
              entry={app.editingEntry}
              date={app.editingDate.date}
              day={app.editingDate.day}
              onCancel={() => app.changeView("week")}
              onSave={app.saveEntry}
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
          {app.view === "account" && app.selectedAccount && (
            <WeekView
              entries={app.publicEntries}
              weekStart={app.weekStart}
              onShift={app.shiftWeek}
              onDetail={app.openDetail}
              onEdit={() => undefined}
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
      {app.view !== "account" && (
        <SideNavigation
          view={app.view}
          onView={openNavigationView}
          open={app.drawerOpen}
          onClose={() => app.setDrawerOpen(false)}
          mobileOnly
        >
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
        </SideNavigation>
      )}
    </div>
  );
}
