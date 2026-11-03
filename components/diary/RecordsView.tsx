"use client";

import { useEffect, useRef, useState } from "react";
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

const buildDates = (start: Date, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return dateValue(date);
  });

export function RecordsView({
  records,
  onAddRecord,
}: {
  records: LifeRecord[];
  onAddRecord: (content: string, date?: string) => void;
}) {
  const todayDate = dateValue(new Date());
  const [dates, setDates] = useState(() => {
    const first = new Date();
    first.setHours(0, 0, 0, 0);
    first.setDate(first.getDate() - 7);
    return buildDates(first, 15);
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const todayRef = useRef<HTMLLabelElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

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

  const extendDates = (direction: "past" | "future") => {
    setDates((current) => {
      if (direction === "future") {
        const last = new Date(`${current[current.length - 1]}T00:00:00`);
        last.setDate(last.getDate() + 1);
        return [...current, ...buildDates(last, 7)];
      }
      const first = new Date(`${current[0]}T00:00:00`);
      first.setDate(first.getDate() - 7);
      requestAnimationFrame(() => {
        if (formRef.current) formRef.current.scrollTop += 7 * 75;
      });
      return [...buildDates(first, 7), ...current];
    });
  };

  return (
    <div className="records-page">
      <section className="content-panel records-panel">
        <div
          className="records-form"
          ref={formRef}
          onScroll={(event) => {
            const element = event.currentTarget;
            if (element.scrollTop < 80) extendDates("past");
            if (element.scrollHeight - element.scrollTop - element.clientHeight < 80) {
              extendDates("future");
            }
          }}
        >
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
