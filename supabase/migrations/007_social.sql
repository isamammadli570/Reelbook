-- Friends and activity: following other people, seeing their profiles, and a feed of what they watch.
-- Run once in the Supabase SQL Editor.

-- 1. Profiles: whether the person shares their activity, and visible to everyone signed in.
--    Search, profile pages and the feed need another person's name, @username and photo. Emails stay in
--    auth.users and are never readable here.
alter table public.profiles add column if not exists share_activity boolean not null default true;

drop policy if exists "profiles are visible to signed-in users" on public.profiles;
create policy "profiles are visible to signed-in users" on public.profiles
  for select to authenticated using (true);

-- Finding someone by the start of their handle.
create index if not exists profiles_username_pattern_idx on public.profiles (lower(username) text_pattern_ops);

-- 2. Follows: one row per "A follows B". Anyone signed in can see who follows whom (for the counts);
--    only A can create or remove A's follows, and nobody can follow themself.
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

drop policy if exists "follows are visible to signed-in users" on public.follows;
create policy "follows are visible to signed-in users" on public.follows
  for select to authenticated using (true);

drop policy if exists "follow as yourself" on public.follows;
create policy "follow as yourself" on public.follows
  for insert to authenticated with check (auth.uid() = follower_id);

drop policy if exists "unfollow as yourself" on public.follows;
create policy "unfollow as yourself" on public.follows
  for delete to authenticated using (auth.uid() = follower_id);

-- 3. Activity: what a person watched, rated and reviewed, published by their app from their library.
--    One row per event; event_key makes re-publishing the same event an update, not a copy:
--      watch:<diary entry id>                 a film viewing, with the stars given then
--      review:<media type>:<id>               the review of a title
--      episodes:tv:<id>:<yyyy-mm-dd>          episodes of a series watched on one day
create table if not exists public.activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  item_key text not null,
  kind text not null check (kind in ('watch', 'review', 'episodes')),
  media_type text not null check (media_type in ('movie', 'tv')),
  media_id integer not null,
  title text not null,
  poster_path text,
  year text,
  rating numeric(2, 1),
  review text,
  episode_count integer,
  happened_at timestamptz not null,
  primary key (user_id, event_key)
);

create index if not exists activity_user_time_idx on public.activity (user_id, happened_at desc);
create index if not exists activity_user_item_idx on public.activity (user_id, item_key);

alter table public.activity enable row level security;

drop policy if exists "own activity" on public.activity;
create policy "own activity" on public.activity
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Others see it only while its author shares their activity; turning sharing off hides it at once.
drop policy if exists "shared activity is visible to signed-in users" on public.activity;
create policy "shared activity is visible to signed-in users" on public.activity
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.user_id = activity.user_id and p.share_activity)
  );
