"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LifeRecord } from "@/types/diary";

const dateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Days from another year carry it, so an old record is never mistaken for
// one of this week's.
const dateLabel = (value: string, thisYear: number) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("ja-JP", {
    year: Number(value.slice(0, 4)) === thisYear ? undefined : "numeric",
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
  const thisYear = new Date().getFullYear();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // Days held open although nothing is written on them: today, a day picked
  // from the calendar, and whichever day is being typed in right now.
  const [openDates, setOpenDates] = useState<string[]>([todayDate]);
  const formRef = useRef<HTMLDivElement | null>(null);
  const dateRefs = useRef<Record<string, HTMLLabelElement | null>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    records.forEach((record) => {
      const date = record.date ?? record.createdAt.slice(0, 10);
      next[date] = next[date] ? `${next[date]}\n\n${record.content}` : record.content;
    });
    setDrafts(next);
  }, [records]);

  // Newest first: today, anything written, and anything held open. Days with
  // nothing on them are left out, so the page stays as short as the writing.
  const dates = useMemo(() => {
    const rest = [
      ...new Set([
        ...Object.keys(drafts).filter((date) => drafts[date].trim()),
        ...openDates,
      ]),
    ]
      .filter((date) => date !== todayDate)
      .sort((a, b) => b.localeCompare(a));
    return [todayDate, ...rest];
  }, [drafts, openDates, todayDate]);

  const holdOpen = (date: string) =>
    setOpenDates((current) =>
      current.includes(date) ? current : [...current, date],
    );

  const scrollDateToTop = (date: string) => {
    const container = formRef.current;
    const target = dateRefs.current[date];
    if (container && target) {
      container.scrollTo({
        top: Math.max(0, target.offsetTop - container.offsetTop),
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => scrollDateToTop(todayDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selectDate = (event: Event) => {
      const date = (event as CustomEvent<string>).detail;
      if (!date) return;
      holdOpen(date);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollDateToTop(date);
          dateRefs.current[date]?.querySelector("textarea")?.focus();
        });
      });
    };
    window.addEventListener("records:select-date", selectDate);
    return () => window.removeEventListener("records:select-date", selectDate);
  }, []);

  return (
    <div className="records-page">
      <section className="content-panel records-panel">
        <div className="records-form" ref={formRef}>
          {dates.map((date) => (
            <label
              className={`record-day${date === todayDate ? " today" : ""}`}
              key={date}
              ref={(element) => {
                dateRefs.current[date] = element;
              }}
            >
              <time dateTime={date}>{dateLabel(date, thisYear)}</time>
              <textarea
                value={drafts[date] ?? ""}
                ref={(element) => {
                  if (element) {
                    element.style.height = "auto";
                    element.style.height = `${Math.max(20, element.scrollHeight)}px`;
                  }
                }}
                // Keeps the row from disappearing as its last character is deleted.
                onFocus={() => holdOpen(date)}
                onChange={(event) => {
                  const value = event.target.value;
                  setDrafts((current) => ({ ...current, [date]: value }));
                  onAddRecord(value, date);
                }}
                rows={1}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
