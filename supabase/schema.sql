create table if not exists public.diary_entries (
  date text primary key,
  day text not null,
  title text,
  content text not null default '',
  image text,
  updated_at text not null default '',
  views integer not null default 0
);

alter table public.diary_entries enable row level security;

create policy "diary entries are readable"
  on public.diary_entries for select using (true);

create policy "diary entries are writable"
  on public.diary_entries for insert with check (true);

create policy "diary entries are updatable"
  on public.diary_entries for update using (true) with check (true);
