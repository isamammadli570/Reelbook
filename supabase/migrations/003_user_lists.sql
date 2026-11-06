-- User-made lists ("Best sci-fi", "One-night miniseries"). Run once in the Supabase SQL Editor.
-- Each row is one list as JSON; a deleted list stays as {"deleted": true} so other devices learn about it.

create table if not exists public.user_lists (
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, list_id)
);

alter table public.user_lists enable row level security;

create policy "own lists" on public.user_lists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
