"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const todayDate = dateValue(new Date());
  const dates = useMemo(() => {
    const first = new Date();
    first.setHours(0, 0, 0, 0);
    first.setDate(first.getDate() - 7);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return dateValue(date);
    });
  }, []);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const todayRef = useRef<HTMLLabelElement | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    records.forEach((record) => {
      const date = record.date ?? record.createdAt.slice(0, 10);
      next[date] = next[date] ? `${next[date]}\n\n${record.content}` : record.content;
    });
    setDrafts(next);
  }, [records]);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
  }, []);

  return (
    <div className="records-page">
      <section className="content-panel records-panel">
        <div className="records-form">
            {dates.map((date) => (
              <label
                className={`record-day${date === todayDate ? " today" : ""}`}
                key={date}
                ref={date === todayDate ? todayRef : undefined}
              >
                <time dateTime={date}>{dateLabel(date)}</time>
                <textarea
                  value={drafts[date] ?? ""}
                  ref={(element) => {
                    if (element) {
                      element.style.height = "auto";
                      element.style.height = `${Math.max(26, element.scrollHeight)}px`;
                    }
                  }}
                  onChange={(event) =>
                    (() => {
                      const value = event.target.value;
                      setDrafts((current) => ({ ...current, [date]: value }));
                      onAddRecord(value, date);
                    })()
                  }
                  rows={2}
                />
              </label>
            ))}
        </div>
      </section>
    </div>
  );
}
