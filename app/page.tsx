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
import { getSupabaseClient } from "./lib/supabase";

type View = "week" | "detail" | "compose" | "visitors";

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
    date: "10月5日",
    day: "月",
    title: "金木犀の帰り道",
    content:
      "仕事を少し早めに切り上げて、遠回りして帰った。角を曲がったところで金木犀の香りがして、ようやく秋が来た気がした。急がず歩くと、いつもの道にも知らない景色がある。",
    updatedAt: "21:42",
    views: 18,
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "10月6日",
    day: "火",
    title: "小さく始める",
    content:
      "やりたいことがいくつもあるのに、どれも大きすぎて動けずにいた。でも今日、まずはノートを一冊買った。小さく始めれば、それでいい。",
    updatedAt: "08:16",
    views: 12,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "10月7日",
    day: "水",
    title: "雨の音で目が覚めた",
    content:
      "雨の音で目が覚めた。窓を開けると、ひんやりとした空気。何をするでもない朝だったけれど、こういう時間も嫌いじゃない。",
    updatedAt: "23:08",
    views: 24,
    image: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=720&q=80",
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

const dayNames = ["日", "月", "火", "水", "木", "金", "土"] as const;

function formatDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function parseDateLabel(label: string) {
  const match = label.match(/(\d+)月(\d+)日/);
  return match ? new Date(2026, Number(match[1]) - 1, Number(match[2])) : new Date(2026, 9, 5);
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
    return [formatDate(date), dayNames[date.getDay()]] as const;
  });
}

const visitors = [
  { name: "haru", initial: "H", color: "peach", time: "今日 14:32", entry: "静かな土曜日" },
  { name: "sora_note", initial: "S", color: "blue", time: "今日 10:15", entry: "静かな土曜日" },
  { name: "mugi", initial: "M", color: "yellow", time: "昨日 21:04", entry: "小さく始める" },
  { name: "凪", initial: "凪", color: "green", time: "昨日 18:47", entry: "小さく始める" },
  { name: "ao", initial: "A", color: "purple", time: "10月8日 08:11", entry: "金木犀の帰り道" },
];

function MiniCalendar({ month, entries, onMonthChange, onPick }: { month: Date; entries: Entry[]; onMonthChange: (offset: number) => void; onPick: (day: number) => void }) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const entryDates = new Set(entries.filter((entry) => entry.date.startsWith(`${monthIndex + 1}月`)).map((entry) => Number(entry.date.match(/月(\d+)日/)?.[1])));
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

function WeekView({ entries, weekStart, onShift, onDetail, onEdit }: { entries: Entry[]; weekStart: Date; onShift: (days: number) => void; onDetail: (entry: Entry) => void; onEdit: (date: string, day: string, entry?: Entry) => void }) {
  const weekDays = buildWeek(weekStart);
  return (
    <div className="content-panel">
      <div className="week-toolbar">
        <span className="week-range" aria-label="表示期間">{weekDays[0][0]} — {weekDays[weekDays.length - 1][0]}</span>
        <div className="week-actions">
          <button className="week-arrow" aria-label="前の週" onClick={() => onShift(-7)}><ChevronLeft size={20} /></button>
          <button className="week-arrow" aria-label="次の週" onClick={() => onShift(7)}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="entry-list">
        {weekDays.map(([date, day]) => {
          const entry = entries.find((item) => item.date === date);
          return (
            <article className={`entry-row reading-entry ${!entry ? "empty-entry" : ""} ${entry?.image ? "has-image" : ""}`} key={date}>
              <div className="reading-copy">
                <header className="entry-heading">
                  <h2>{entry?.title ?? ""}</h2>
                  <button className="entry-menu-button" onClick={() => onEdit(date, day, entry)} aria-label={`${date}の日記を${entry ? "編集" : "作成"}`}>…</button>
                </header>
                {entry ? (
                  <button className="entry-content" onClick={() => onDetail(entry)}>
                    <p>{entry.content}</p>
                  </button>
                ) : null}
              </div>
              <div className="reading-media">
                <time className="entry-heading-date">{date.replace("月", "/").replace("日", "")}（{day}）</time>
                <div
                  className={`reading-image${entry?.image ? "" : " reading-image-empty"}`}
                  role={entry?.image ? "img" : undefined}
                  aria-label={entry?.image ? `${entry.title ?? "日記"}の写真` : undefined}
                  aria-hidden={entry?.image ? undefined : true}
                  style={entry?.image ? { backgroundImage: `url(${entry.image})` } : undefined}
                />
              </div>
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

function ComposeView({ entry, date, day, onCancel, onSave }: { entry?: Entry; date: string; day: string; onCancel: () => void; onSave: (entry: Entry) => Promise<boolean> }) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [image, setImage] = useState(entry?.image ?? "");
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

  const selectImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <section className="content-panel compose-panel">
      <div className="compose-heading">
        <button className="back-button" onClick={onCancel}><X size={18} />キャンセル</button>
        <button className="primary-button compose-save-button" disabled={!content.trim() || saving} onClick={() => void saveEntry()}>{saving ? "保存中…" : entry ? "保存" : "公開"}</button>
      </div>
      <label className="field-label" htmlFor="title">タイトル <span>任意</span></label>
      <input id="title" className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="記事タイトル" maxLength={80} />
      <div className="character-count">{title.length} / 80</div>
      <label className="field-label" htmlFor="body">本文</label>
      <textarea id="body" className="body-input" value={content} onChange={(event) => setContent(event.target.value)} placeholder="今日あったこと、感じたことを書いてみましょう。" />
      <label className="image-upload-button" htmlFor="image-file">画像を追加</label>
      <input id="image-file" type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} />
      {saveError && <p className="compose-save-error" role="alert">{saveError}</p>}
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
      <button className={view === "visitors" ? "active" : ""} onClick={() => onView("visitors")}><Footprints size={19} />足あと</button>
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
  const [weekStart, setWeekStart] = useState(() => new Date(2026, 9, 5));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 9, 1));
  const [selectedEntry, setSelectedEntry] = useState(initialEntries[3]);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>();
  const [editingDate, setEditingDate] = useState({ date: "10月10日", day: "土" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = useMemo(() => view === "visitors" ? "足あと" : "kotaroの日記", [view]);

  useEffect(() => {
    let cancelled = false;
    const loadEntries = async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("diary_entries").select("*").order("date");
        if (!cancelled && !error && data?.length) {
          setEntries(data.map((row) => ({ ...row, updatedAt: row.updated_at })) as Entry[]);
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
  const openDetail = (entry: Entry) => { setSelectedEntry(entry); changeView("detail"); };
  const openEditor = (date: string, day: string, entry?: Entry) => {
    setEditingDate({ date, day });
    setEditingEntry(entry);
    changeView("compose");
  };
  const shiftWeek = (days: number) => setWeekStart((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + days));
  const pickCalendarDay = (day: number) => {
    const dateLabel = `${calendarMonth.getMonth() + 1}月${day}日`;
    const entry = entries.find((item) => item.date === dateLabel);
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
      const { error } = await supabase.from("diary_entries").upsert({ ...entryData, updated_at: updatedAt }, { onConflict: "date" });
      if (error) {
        console.error("Supabase save failed", { message: error.message, details: error.details, hint: error.hint, code: error.code });
        return false;
      }
    }
    setEntries((current) => {
      const nextEntries = [...current.filter((item) => item.date !== entry.date), entry];
      if (!supabase) window.localStorage.setItem("hibi-diary-entries", JSON.stringify(nextEntries));
      return nextEntries;
    });
    setSelectedEntry(entry);
    changeView("week");
    return true;
  };

  return (
    <>
      <Header onMenu={() => setDrawerOpen(true)} />
      <div className="mobile-title">{title}</div>
      <DiaryHero />
      <main className="app-layout">
        <aside className="left-column">
          <ProfileCard />
          <MiniCalendar month={calendarMonth} entries={entries} onMonthChange={(offset) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))} onPick={pickCalendarDay} />
          <SideNavigation
            view={view}
            onView={(nextView) => nextView === "compose" ? openEditor("10月10日", "土", entries.find((entry) => entry.date === "10月10日")) : changeView(nextView)}
            open={false}
            onClose={() => undefined}
          />
        </aside>
        <section className="main-column">
          {view === "week" && <WeekView entries={entries} weekStart={weekStart} onShift={shiftWeek} onDetail={openDetail} onEdit={openEditor} />}
          {view === "detail" && <DetailView entry={selectedEntry} onBack={() => { setWeekStart(mondayOf(parseDateLabel(selectedEntry.date))); changeView("week"); }} onEdit={() => openEditor(selectedEntry.date, selectedEntry.day, selectedEntry)} />}
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
