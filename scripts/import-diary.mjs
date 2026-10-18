import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const inputPath = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
const userId = process.argv.find((arg) => arg.startsWith("--user-id="))?.slice("--user-id=".length);
if (!inputPath) {
  console.error("Usage: npm run import:diary -- /path/to/diary.csv --user-id=AUTH_USER_UUID [--dry-run]");
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
    const dateMatch = rawDate.match(/^(\d{4})(?:[\/-](\d{1,2})[\/-](\d{1,2})|年(\d{1,2})月(\d{1,2})日)$/);
    if (!dateMatch) return null;
    const month = dateMatch[2] ?? dateMatch[4];
    const day = dateMatch[3] ?? dateMatch[5];
    const date = `${dateMatch[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

if (dryRun) {
  console.log(`読み込み確認: ${entries.length}件（${entries[0]?.date ?? "-"}〜${entries.at(-1)?.date ?? "-"}）`);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。service role keyはサーバー側でのみ使用してください。");
if (!userId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(userId)) throw new Error("--user-id=AUTH_USER_UUID を指定してください。");

const supabase = createClient(url, key);
for (let offset = 0; offset < entries.length; offset += 100) {
  const batch = entries.slice(offset, offset + 100).map((entry) => ({ ...entry, user_id: userId }));
  const { error } = await supabase.from("user_diary_entries").upsert(batch, { onConflict: "user_id,date" });
  if (error) throw new Error(`行 ${offset + 1}-${offset + batch.length} の保存に失敗: ${error.message}`);
  console.log(`保存済み: ${Math.min(offset + batch.length, entries.length)}/${entries.length}`);
}
console.log(`完了: ${entries.length}件の日記本文を保存しました。`);
