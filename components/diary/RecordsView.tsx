"use client";

import { useMemo, useState } from "react";
import type { LifeRecord } from "@/types/diary";

const defaultGenres = ["TOEIC", "読書", "運動", "お金", "その他"];

export function RecordsView({
  records,
  onAddRecord,
}: {
  records: LifeRecord[];
  onAddRecord: (genre: string, content: string) => void;
}) {
  const [selectedGenre, setSelectedGenre] = useState("すべて");
  const [draftGenre, setDraftGenre] = useState(defaultGenres[0]);
  const [content, setContent] = useState("");
  const genres = useMemo(
    () => [
      ...defaultGenres,
      ...records
        .map((record) => record.genre)
        .filter((genre) => !defaultGenres.includes(genre)),
    ],
    [records],
  );
  const visibleRecords = records.filter(
    (record) => selectedGenre === "すべて" || record.genre === selectedGenre,
  );
  const submit = () => {
    if (!content.trim()) return;
    onAddRecord(draftGenre, content.trim());
    setContent("");
    setSelectedGenre(draftGenre);
  };
  return (
    <section className="content-panel records-panel">
      <header className="records-heading">
        <div>
          <p className="eyebrow">LIFE RECORDS</p>
          <h1>記録</h1>
          <p>ジャンルごとの記録を、ひとつの場所に残せます。</p>
        </div>
      </header>
      <div className="records-body">
        <div className="records-form">
          <div className="records-form-heading">
            <strong>新しい記録</strong>
            <span>日付は自動で保存されます</span>
          </div>
          <select
            value={draftGenre}
            onChange={(event) => setDraftGenre(event.target.value)}
            aria-label="記録のジャンル"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="今日の記録を書いてみましょう。"
            rows={3}
          />
          <button
            type="button"
            className="primary-button"
            disabled={!content.trim()}
            onClick={submit}
          >
            記録を保存
          </button>
        </div>
        <nav className="records-genres" aria-label="記録のジャンル">
          <button
            type="button"
            className={selectedGenre === "すべて" ? "active" : ""}
            onClick={() => setSelectedGenre("すべて")}
          >
            すべて
          </button>
          {genres.map((genre) => (
            <button
              type="button"
              className={selectedGenre === genre ? "active" : ""}
              key={genre}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </nav>
        <div className="records-feed">
          {visibleRecords.map((record) => (
            <article className="life-record" key={record.id}>
              <div className="life-record-meta">
                <strong>{record.genre}</strong>
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
          {!visibleRecords.length && (
            <p className="records-empty">
              {selectedGenre === "すべて"
                ? "まだ記録がありません。"
                : `${selectedGenre}の記録はまだありません。`}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
