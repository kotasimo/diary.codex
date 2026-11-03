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
  const earliestRecordDate = records.reduce(
    (earliest, record) => {
      const date = record.date ?? record.createdAt.slice(0, 10);
      return date < earliest ? date : earliest;
    },
    todayDate,
  );
  const [dates, setDates] = useState(() => {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);
    const earliest = new Date(`${earliestRecordDate}T00:00:00`);
    const first = earliest < yesterday ? earliest : yesterday;
    return buildDates(first, 15);
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
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

  useEffect(() => {
    setDates((current) => {
      if (earliestRecordDate >= current[0]) return current;
      const first = new Date(`${earliestRecordDate}T00:00:00`);
      const currentFirst = new Date(`${current[0]}T00:00:00`);
      const days = Math.ceil(
        (currentFirst.getTime() - first.getTime()) / 86400000,
      );
      return [...buildDates(first, days), ...current];
    });
  }, [earliestRecordDate]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (formRef.current) formRef.current.scrollTop = 0;
    });
  }, []);

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
    const selectDate = (event: Event) => {
      const date = (event as CustomEvent<string>).detail;
      if (!date) return;
      const previousDate = new Date(`${date}T00:00:00`);
      previousDate.setDate(previousDate.getDate() - 1);
      const previous = dateValue(previousDate);
      setDates((current) =>
        [...new Set([...current, previous, date])].sort(),
      );
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollDateToTop(previous);
        });
      });
    };
    window.addEventListener("records:select-date", selectDate);
    return () => window.removeEventListener("records:select-date", selectDate);
  }, []);

  const extendDates = (direction: "past" | "future") => {
    setDates((current) => {
      if (direction === "future") {
        const last = new Date(`${current[current.length - 1]}T00:00:00`);
        last.setDate(last.getDate() + 1);
        return [...current, ...buildDates(last, 7)];
      }
      if (current[0] <= earliestRecordDate) return current;
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
                ref={(element) => {
                  dateRefs.current[date] = element;
                }}
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
