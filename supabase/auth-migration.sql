-- Run in Supabase SQL Editor before deploying this version. Legacy diary data
-- remains in diary_entries and is not imported into the new account-owned table.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  diary_title text not null,
  subtitle text not null default '',
  bio text not null default '',
  avatar text,
  header_image text
);
create unique index if not exists profiles_email_unique on public.profiles (lower(email));
alter table public.profiles enable row level security;
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
drop policy if exists "profile owner inserts" on public.profiles;
create policy "profile owner inserts" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and lower(email) = lower((select auth.jwt())->>'email'));
drop policy if exists "profile owner updates" on public.profiles;
create policy "profile owner updates" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and lower(email) = lower((select auth.jwt())->>'email'));

create table if not exists public.user_diary_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  day text not null,
  title text,
  content text not null default '',
  image text,
  updated_at text not null default '',
  views integer not null default 0,
  primary key (user_id, date)
);
alter table public.user_diary_entries enable row level security;
drop policy if exists "user diary readable" on public.user_diary_entries;
create policy "user diary readable" on public.user_diary_entries for select to authenticated using (true);
drop policy if exists "user diary inserts" on public.user_diary_entries;
create policy "user diary inserts" on public.user_diary_entries for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "user diary updates" on public.user_diary_entries;
create policy "user diary updates" on public.user_diary_entries for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "user diary deletes" on public.user_diary_entries;
create policy "user diary deletes" on public.user_diary_entries for delete to authenticated using (user_id = (select auth.uid()));

-- Retire the shared legacy diary table from browser access without deleting data.
drop policy if exists "diary entries are readable" on public.diary_entries;
drop policy if exists "diary entries are writable" on public.diary_entries;
drop policy if exists "diary entries are updatable" on public.diary_entries;
revoke all on public.diary_entries from anon, authenticated;

-- The old likes array cannot safely permit other people to update it.
create table if not exists public.article_likes (
  owner_email text not null,
  entry_date text not null,
  actor_email text not null,
  created_at timestamptz not null default now(),
  primary key (owner_email, entry_date, actor_email)
);
alter table public.article_likes enable row level security;
drop policy if exists "likes readable" on public.article_likes;
create policy "likes readable" on public.article_likes for select to authenticated using (true);
drop policy if exists "likes insert own" on public.article_likes;
create policy "likes insert own" on public.article_likes for insert to authenticated
  with check (lower(actor_email) = lower((select auth.jwt())->>'email'));
drop policy if exists "likes delete own" on public.article_likes;
create policy "likes delete own" on public.article_likes for delete to authenticated
  using (lower(actor_email) = lower((select auth.jwt())->>'email'));

drop policy if exists "social data is readable" on public.follows;
drop policy if exists "social data is writable" on public.follows;
drop policy if exists "follows readable" on public.follows;
drop policy if exists "follows insert own" on public.follows;
drop policy if exists "follows delete own" on public.follows;
create policy "follows readable" on public.follows for select to authenticated using (true);
create policy "follows insert own" on public.follows for insert to authenticated
  with check (lower(follower_email) = lower((select auth.jwt())->>'email'));
create policy "follows delete own" on public.follows for delete to authenticated
  using (lower(follower_email) = lower((select auth.jwt())->>'email'));

drop policy if exists "interactions are readable" on public.article_interactions;
drop policy if exists "interactions are writable" on public.article_interactions;
revoke all on public.article_interactions from anon, authenticated;

drop policy if exists "visitors are readable" on public.page_visitors;
drop policy if exists "visitors are writable" on public.page_visitors;
drop policy if exists "visitors owner reads" on public.page_visitors;
drop policy if exists "visitors actor inserts" on public.page_visitors;
create policy "visitors owner reads" on public.page_visitors for select to authenticated
  using (lower(owner_email) = lower((select auth.jwt())->>'email'));
create policy "visitors actor inserts" on public.page_visitors for insert to authenticated
  with check (lower(visitor_email) = lower((select auth.jwt())->>'email'));

drop policy if exists "comments are readable" on public.article_comments;
drop policy if exists "comments are writable" on public.article_comments;
drop policy if exists "comments readable" on public.article_comments;
drop policy if exists "comments author inserts" on public.article_comments;
create policy "comments readable" on public.article_comments for select to authenticated using (true);
create policy "comments author inserts" on public.article_comments for insert to authenticated
  with check (lower(author_email) = lower((select auth.jwt())->>'email'));

drop policy if exists "notifications are readable" on public.notifications;
drop policy if exists "notifications are writable" on public.notifications;
drop policy if exists "notifications owner reads" on public.notifications;
drop policy if exists "notifications actor inserts" on public.notifications;
drop policy if exists "notifications owner updates" on public.notifications;
create policy "notifications owner reads" on public.notifications for select to authenticated
  using (lower(owner_email) = lower((select auth.jwt())->>'email'));
create policy "notifications actor inserts" on public.notifications for insert to authenticated
  with check (lower(actor_email) = lower((select auth.jwt())->>'email'));
create policy "notifications owner updates" on public.notifications for update to authenticated
  using (lower(owner_email) = lower((select auth.jwt())->>'email'))
  with check (lower(owner_email) = lower((select auth.jwt())->>'email'));

grant select, insert, update, delete on public.profiles, public.user_diary_entries,
  public.article_likes to authenticated;
