import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run import:diary -- /path/to/diary.csv");
  process.exit(1);
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadEnv(path.resolve(".env.local"));
loadEnv(path.resolve(".env"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です。.env.local を確認してください。");

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i], next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const rows = parseCsv(fs.readFileSync(path.resolve(inputPath), "utf8").replace(/^\uFEFF/, ""));
const headers = rows.shift();
const index = Object.fromEntries(headers.map((header, i) => [header, i]));
const entries = rows
  .map((row) => {
    const rawDate = row[index["日付"]] ?? "";
    const dateMatch = rawDate.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if (!dateMatch) return null;
    const date = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, "0")}-${String(dateMatch[3]).padStart(2, "0")}`;
    return {
      date,
      day: row[index["曜日"]] || "",
      title: null,
      content: row[index["本文"]] || "",
      image: null,
      updated_at: row[index["更新日時"]] || row[index["登録日時"]] || "",
      views: 0,
    };
  })
  .filter(Boolean);

const supabase = createClient(url, key);
for (let offset = 0; offset < entries.length; offset += 100) {
  const batch = entries.slice(offset, offset + 100);
  const { error } = await supabase.from("diary_entries").upsert(batch, { onConflict: "date" });
  if (error) throw new Error(`行 ${offset + 1}-${offset + batch.length} の保存に失敗: ${error.message}`);
  console.log(`保存済み: ${Math.min(offset + batch.length, entries.length)}/${entries.length}`);
}
console.log(`完了: ${entries.length}件の日記本文を保存しました。`);
