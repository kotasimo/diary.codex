"use client";

import { useEffect, useMemo, useState } from "react";
import type { LifeRecord } from "@/types/diary";

const dateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateLabel = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

export function RecordsView({
  records,
  onAddRecord,
}: {
  records: LifeRecord[];
  onAddRecord: (content: string, date?: string) => void;
}) {
  const dates = useMemo(() => {
    const first = new Date();
    first.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return dateValue(date);
    });
  }, []);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    records.forEach((record) => {
      const date = record.date ?? record.createdAt.slice(0, 10);
      next[date] = next[date] ? `${next[date]}\n\n${record.content}` : record.content;
    });
    setDrafts(next);
  }, [records]);

  const submit = () => {
    dates.forEach((date) => {
      const content = drafts[date]?.trim();
      const alreadySaved = records.some(
        (record) => (record.date ?? record.createdAt.slice(0, 10)) === date,
      );
      if (content && !alreadySaved) onAddRecord(content, date);
    });
  };

  return (
    <div className="records-page">
      <section className="content-panel records-panel">
        <header className="records-heading">
          <h1>記録</h1>
        </header>
        <div className="records-body">
          <div className="records-form">
            {dates.map((date) => (
              <label className="record-day" key={date}>
                <time dateTime={date}>{dateLabel(date)}</time>
                <textarea
                  value={drafts[date] ?? ""}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [date]: event.target.value }))
                  }
                  rows={2}
                />
              </label>
            ))}
          </div>
        </div>
      </section>
      <button type="button" className="primary-button records-save" onClick={submit}>
        保存
      </button>
    </div>
  );
}
