"use client";

import { useEffect, useState } from "react";
import type { LifeRecord } from "@/types/diary";

export function RecordsView({
  records,
  onAddRecord,
}: {
  records: LifeRecord[];
  onAddRecord: (content: string, date?: string) => void;
}) {
  const today = new Date();
  const toDateValue = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(toDateValue(today));
  const [content, setContent] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const recordsForDate = records.filter(
    (record) => (record.date ?? record.createdAt.slice(0, 10)) === selectedDate,
  );
  useEffect(() => {
    setContent(recordsForDate.map((record) => record.content).join("\n\n"));
    // The selected date intentionally controls which day's memo is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, records]);
  const shiftDate = (offset: number) => {
    const next = new Date(`${selectedDate}T00:00:00`);
    next.setDate(next.getDate() + offset);
    setSelectedDate(toDateValue(next));
  };
  const dateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    "ja-JP",
    { month: "numeric", day: "numeric", weekday: "short" },
  );
  const submit = () => {
    if (!content.trim()) return;
    onAddRecord(content.trim(), selectedDate);
    setContent("");
  };
  return (
    <div className="records-page">
      <section className="content-panel records-panel">
        <header className="records-heading">
          <div>
            <h1>記録</h1>
          </div>
        </header>
        <div className="records-body">
          <div
            className="records-form"
            onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStart === null) return;
              const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
              if (Math.abs(distance) > 50) shiftDate(distance > 0 ? -1 : 1);
              setTouchStart(null);
            }}
          >
            <div className="records-date-column">
              <button type="button" aria-label="前の日" onClick={() => shiftDate(-1)}>‹</button>
              <time dateTime={selectedDate}>{dateLabel}</time>
              <button type="button" aria-label="次の日" onClick={() => shiftDate(1)}>›</button>
            </div>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="思ったこと、覚えておきたいことを書いてみましょう。"
              rows={6}
            />
          </div>
          {records.length > 0 && (
            <div className="records-feed">
              {records.map((record) => (
                <article className="life-record" key={record.id}>
                  <div className="life-record-meta">
                    <time dateTime={record.createdAt}>
                      {new Date(`${record.date ?? record.createdAt.slice(0, 10)}T00:00:00`).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </time>
                  </div>
                  <p>{record.content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <button
        type="button"
        className="primary-button records-save"
        disabled={!content.trim()}
        onClick={submit}
      >
        保存
      </button>
    </div>
  );
}
