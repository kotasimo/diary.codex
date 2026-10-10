"use client";

import {
  ArrowLeft,
  Bell,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Feather,
  Footprints,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type View = "week" | "detail" | "compose" | "visitors";

type Entry = {
  date: string;
  day: string;
  title?: string;
  content: string;
  updatedAt: string;
  views: number;
};

const initialEntries: Entry[] = [
  {
    date: "10月5日",
    day: "月",
    title: "金木犀の帰り道",
    content:
      "仕事を少し早めに切り上げて、遠回りして帰った。角を曲がったところで金木犀の香りがして、ようやく秋が来た気がした。急がず歩くと、いつもの道にも知らない景色がある。",
    updatedAt: "21:42",
    views: 18,
  },
  {
    date: "10月6日",
    day: "火",
    title: "小さく始める",
    content:
      "やりたいことがいくつもあるのに、どれも大きすぎて動けずにいた。でも今日、まずはノートを一冊買った。小さく始めれば、それでいい。",
    updatedAt: "08:16",
    views: 12,
  },
  {
    date: "10月7日",
    day: "水",
    title: "雨の音で目が覚めた",
    content:
      "雨の音で目が覚めた。窓を開けると、ひんやりとした空気。何をするでもない朝だったけれど、こういう時間も嫌いじゃない。",
    updatedAt: "23:08",
    views: 24,
  },
  {
    date: "10月9日",
    day: "金",
    title: "読みかけの本",
    content:
      "寝る前に、少しだけ本を読んだ。登場人物の言葉が、妙に沁みた。自分の今の気持ちと、どこか重なっている気がして。",
    updatedAt: "22:14",
    views: 20,
  },
  {
    date: "10月10日",
    day: "土",
    title: "静かな土曜日",
    content:
      "予定を入れない土曜日。読みかけの本を開いて、眠くなったら昼寝をした。夕方に散歩へ出たら、空が薄い桃色だった。",
    updatedAt: "18:35",
    views: 31,
  },
  {
    date: "10月11日",
    day: "日",
    title: "来週に向けて",
    content:
      "部屋を少し片づけて、やることリストを見直した。完璧じゃなくていい、また一週間、やっていこう。",
    updatedAt: "20:02",
    views: 16,
  },
];

const weekDays = [
  ["10月5日", "月"],
  ["10月6日", "火"],
  ["10月7日", "水"],
  ["10月8日", "木"],
  ["10月9日", "金"],
  ["10月10日", "土"],
  ["10月11日", "日"],
] as const;

const visitors = [
  { name: "haru", initial: "H", color: "peach", time: "今日 14:32", entry: "静かな土曜日" },
  { name: "sora_note", initial: "S", color: "blue", time: "今日 10:15", entry: "静かな土曜日" },
  { name: "mugi", initial: "M", color: "yellow", time: "昨日 21:04", entry: "小さく始める" },
  { name: "凪", initial: "凪", color: "green", time: "昨日 18:47", entry: "小さく始める" },
  { name: "ao", initial: "A", color: "purple", time: "10月8日 08:11", entry: "金木犀の帰り道" },
];

function MiniCalendar({ onPick }: { onPick: () => void }) {
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  return (
    <section className="calendar-card">
      <div className="calendar-heading">
        <button aria-label="前月"><ChevronLeft size={17} /></button>
        <strong>2026年10月</strong>
        <button aria-label="次月"><ChevronRight size={17} /></button>
      </div>
      <div className="calendar-grid calendar-labels">
        {['月', '火', '水', '木', '金', '土', '日'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid calendar-days">
        <span /><span /><span />
        {days.map((day) => (
          <button
            key={day}
            className={`${[5, 6, 7, 9, 10, 11].includes(day) ? "has-entry" : ""}`}
            onClick={onPick}
          >
            {day}
          </button>
        ))}
      </div>
    </section>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="mobile-menu" onClick={onMenu} aria-label="メニュー"><Menu size={22} /></button>
        <button className="brand" aria-label="Hibi ホーム">
          <span className="brand-mark"><Feather size={19} /></span>
          <span>Hibi</span>
        </button>
        <nav className="top-nav" aria-label="メインナビゲーション">
          <button><Home size={17} />みんなの日記</button>
          <button><Search size={17} />探す</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="お知らせ"><Bell size={19} /><span className="notification-dot" /></button>
          <button className="avatar avatar-me">K</button>
        </div>
      </div>
    </header>
  );
}

function DiaryHero() {
  return (
    <section className="diary-hero" aria-label="プロフィール紹介">
      <div className="diary-hero-copy">
        <h1>kotaroの日記</h1>
        <p>何でもない毎日を、忘れないために。</p>
      </div>
    </section>
  );
}

function ProfileCard() {
  return (
    <section className="profile-card">
      <div className="profile-identity">
        <div className="avatar avatar-large avatar-me">K</div>
        <p className="profile-name">kotaro</p>
      </div>
      <p className="profile-bio">何でもない毎日を、忘れないために。</p>
    </section>
  );
}

function WeekView({ entries, onDetail, onEdit }: { entries: Entry[]; onDetail: (entry: Entry) => void; onEdit: (date: string, day: string, entry?: Entry) => void }) {
  return (
    <div className="content-panel">
      <div className="week-toolbar">
        <button className="week-arrow" aria-label="前の週"><ChevronLeft size={20} /></button>
        <div>
          <h1>10月5日 <span>—</span> 10月11日</h1>
        </div>
        <button className="week-arrow" aria-label="次の週"><ChevronRight size={20} /></button>
      </div>

      <div className="entry-list">
        {weekDays.map(([date, day]) => {
          const entry = entries.find((item) => item.date === date);
          return (
            <article className={`entry-row ${!entry ? "empty-entry" : ""}`} key={date}>
              <header className="entry-heading">
                <h2>{entry?.title ?? ""}</h2>
                <div className="entry-heading-actions">
                  <time className={`entry-date day-${day}`}>2026年{date}（{day}）</time>
                  <button className="edit-entry-button" onClick={() => onEdit(date, day, entry)} aria-label={`${date}の日記を${entry ? "編集" : "作成"}`}>
                    <Edit3 size={14} />{entry ? "編集" : "書く"}
                  </button>
                </div>
              </header>
              {entry ? (
                <button className="entry-content" onClick={() => onDetail(entry)}>
                  <p>{entry.content}</p>
                  <div className="entry-meta"><span className="read-more">続きを読む <ChevronRight size={15} /></span></div>
                </button>
              ) : <div className="empty-entry-space" aria-hidden="true" />}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DetailView({ entry, onBack, onEdit }: { entry: Entry; onBack: () => void; onEdit: () => void }) {
  return (
    <article className="content-panel detail-panel">
      <button className="back-button" onClick={onBack}><ArrowLeft size={18} />週の一覧へ</button>
      <header className="detail-heading">
        <p>{entry.date}（{entry.day}）</p>
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

function ComposeView({ entry, date, day, onCancel, onSave }: { entry?: Entry; date: string; day: string; onCancel: () => void; onSave: (entry: Entry) => void }) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");

  const saveEntry = () => {
    const now = new Date();
    onSave({
      date,
      day,
      title: title.trim() || undefined,
      content: content.trim(),
      updatedAt: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      views: entry?.views ?? 0,
    });
  };

  return (
    <section className="content-panel compose-panel">
      <div className="compose-heading">
        <button className="back-button" onClick={onCancel}><X size={18} />キャンセル</button>
        <div><p className="eyebrow">{entry ? "EDIT ENTRY" : "NEW ENTRY"}</p><h1>{entry ? "日記を編集" : "日記を書く"}</h1><span>2026年{date}（{day}）</span></div>
      </div>
      <label className="field-label" htmlFor="title">タイトル <span>任意</span></label>
      <input id="title" className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="今日をひとことで表すなら" maxLength={80} />
      <div className="character-count">{title.length} / 80</div>
      <label className="field-label" htmlFor="body">本文</label>
      <textarea id="body" className="body-input" value={content} onChange={(event) => setContent(event.target.value)} placeholder="今日あったこと、感じたことを書いてみましょう。" />
      <div className="compose-footer"><span>すべての人に公開されます</span><button className="primary-button" disabled={!content.trim()} onClick={saveEntry}>{entry ? "変更を保存" : "日記を公開する"}</button></div>
    </section>
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

function SideNavigation({ view, onView, open, onClose, mobileOnly = false }: { view: View; onView: (view: View) => void; open: boolean; onClose: () => void; mobileOnly?: boolean }) {
  return (
    <aside className={`mobile-drawer ${mobileOnly ? "mobile-nav" : "desktop-nav"} ${open ? "drawer-open" : ""}`}>
      <div className="drawer-head"><span>メニュー</span><button onClick={onClose}><X size={20} /></button></div>
      <button className={view === "week" || view === "detail" ? "active" : ""} onClick={() => onView("week")}><BookOpenText size={19} />自分の日記</button>
      <button className={view === "visitors" ? "active" : ""} onClick={() => onView("visitors")}><Footprints size={19} />足あと<span className="nav-badge">3</span></button>
      <button><UserRound size={19} />プロフィール</button>
      <button><Settings size={19} />設定</button>
      <div className="drawer-spacer" />
      <button><LogOut size={19} />ログアウト</button>
    </aside>
  );
}

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [view, setView] = useState<View>("week");
  const [selectedEntry, setSelectedEntry] = useState(initialEntries[3]);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>();
  const [editingDate, setEditingDate] = useState({ date: "10月10日", day: "土" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = useMemo(() => view === "visitors" ? "足あと" : "kotaroの日記", [view]);

  useEffect(() => {
    const savedEntries = window.localStorage.getItem("hibi-diary-entries");
    if (!savedEntries) return;

    try {
      setEntries(JSON.parse(savedEntries) as Entry[]);
    } catch {
      window.localStorage.removeItem("hibi-diary-entries");
    }
  }, []);

  const changeView = (nextView: View) => { setView(nextView); setDrawerOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openDetail = (entry: Entry) => { setSelectedEntry(entry); changeView("detail"); };
  const openEditor = (date: string, day: string, entry?: Entry) => {
    setEditingDate({ date, day });
    setEditingEntry(entry);
    changeView("compose");
  };
  const saveEntry = (entry: Entry) => {
    setEntries((current) => {
      const nextEntries = [...current.filter((item) => item.date !== entry.date), entry];
      window.localStorage.setItem("hibi-diary-entries", JSON.stringify(nextEntries));
      return nextEntries;
    });
    setSelectedEntry(entry);
    changeView("week");
  };

  return (
    <>
      <Header onMenu={() => setDrawerOpen(true)} />
      <div className="mobile-title">{title}</div>
      <DiaryHero />
      <main className="app-layout">
        <aside className="left-column">
          <ProfileCard />
          <MiniCalendar onPick={() => changeView("week")} />
          <SideNavigation
            view={view}
            onView={(nextView) => nextView === "compose" ? openEditor("10月10日", "土", entries.find((entry) => entry.date === "10月10日")) : changeView(nextView)}
            open={false}
            onClose={() => undefined}
          />
        </aside>
        <section className="main-column">
          {view === "week" && <WeekView entries={entries} onDetail={openDetail} onEdit={openEditor} />}
          {view === "detail" && <DetailView entry={selectedEntry} onBack={() => changeView("week")} onEdit={() => openEditor(selectedEntry.date, selectedEntry.day, selectedEntry)} />}
          {view === "compose" && <ComposeView entry={editingEntry} date={editingDate.date} day={editingDate.day} onCancel={() => changeView("week")} onSave={saveEntry} />}
          {view === "visitors" && <VisitorsView />}
        </section>
      </main>

      {drawerOpen && <button className="drawer-overlay" aria-label="メニューを閉じる" onClick={() => setDrawerOpen(false)} />}
      <SideNavigation
        view={view}
        onView={(nextView) => nextView === "compose" ? openEditor("10月10日", "土", entries.find((entry) => entry.date === "10月10日")) : changeView(nextView)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mobileOnly
      />

      <nav className="bottom-nav">
        <button className={view === "week" || view === "detail" ? "active" : ""} onClick={() => changeView("week")}><BookOpenText size={20} /><span>日記</span></button>
        <button className="write-button" onClick={() => openEditor("10月10日", "土", entries.find((entry) => entry.date === "10月10日"))}><Edit3 size={22} /><span>書く</span></button>
        <button className={view === "visitors" ? "active" : ""} onClick={() => changeView("visitors")}><Footprints size={20} /><span>足あと</span></button>
      </nav>
    </>
  );
}
