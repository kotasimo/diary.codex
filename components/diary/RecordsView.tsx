"use client";

import { useState } from "react";
import type { LifeRecord } from "@/types/diary";

export function RecordsView({
  records,
  onAddRecord,
}: {
  records: LifeRecord[];
  onAddRecord: (content: string) => void;
}) {
  const [content, setContent] = useState("");
  const submit = () => {
    if (!content.trim()) return;
    onAddRecord(content.trim());
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
          <div className="records-form">
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
                      {new Date(record.createdAt).toLocaleDateString("ja-JP", {
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
