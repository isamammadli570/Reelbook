-- Username, cover image and avatar colour for profiles, plus a username availability check.
-- Run once in the Supabase SQL Editor.

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists cover_path text;
alter table public.profiles add column if not exists avatar_color text not null default 'amber';

-- Usernames are unique regardless of letter case.
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- Row level security hides other users' rows, so availability is checked by a function that only answers yes or no.
create or replace function public.is_username_available(candidate text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(candidate));
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
