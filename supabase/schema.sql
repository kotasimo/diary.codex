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

create table if not exists public.follows (
  follower_email text not null,
  following_email text not null,
  created_at timestamptz not null default now(),
  primary key (follower_email, following_email)
);

create table if not exists public.article_interactions (
  owner_email text not null,
  entry_date text not null,
  likes text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (owner_email, entry_date)
);

create table if not exists public.page_visitors (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  visitor_email text not null,
  visited_at timestamptz not null default now(),
  entry_date text,
  entry_title text
);

create table if not exists public.article_comments (
  id text primary key,
  owner_email text not null,
  entry_date text not null,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  owner_email text not null,
  kind text not null check (kind in ('like', 'comment', 'follow')),
  actor_email text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false,
  entry_date text,
  entry_title text,
  comment_body text
);

alter table public.follows enable row level security;
alter table public.article_interactions enable row level security;
alter table public.page_visitors enable row level security;
alter table public.article_comments enable row level security;
alter table public.notifications enable row level security;

create policy "social data is readable" on public.follows for select using (true);
create policy "social data is writable" on public.follows for all using (true) with check (true);
create policy "interactions are readable" on public.article_interactions for select using (true);
create policy "interactions are writable" on public.article_interactions for all using (true) with check (true);
create policy "visitors are readable" on public.page_visitors for select using (true);
create policy "visitors are writable" on public.page_visitors for all using (true) with check (true);
create policy "comments are readable" on public.article_comments for select using (true);
create policy "comments are writable" on public.article_comments for all using (true) with check (true);
create policy "notifications are readable" on public.notifications for select using (true);
create policy "notifications are writable" on public.notifications for all using (true) with check (true);
