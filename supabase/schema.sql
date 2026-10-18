-- Legacy schema retained for existing data. Apply auth-migration.sql after this
-- file to create account-owned data and policies. Do not restore open policies.
create table if not exists public.diary_entries (
  date text primary key,
  day text not null,
  title text,
  content text not null default '',
  image text,
  updated_at text not null default '',
  views integer not null default 0
);
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
alter table public.diary_entries enable row level security;
alter table public.follows enable row level security;
alter table public.article_interactions enable row level security;
alter table public.page_visitors enable row level security;
alter table public.article_comments enable row level security;
alter table public.notifications enable row level security;
