-- Tables for the account library and profile. Already applied to the project; kept here as the record.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  bio text not null default '',
  updated_at timestamptz not null default now()
);

create table public.library_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.profiles enable row level security;
alter table public.library_items enable row level security;

create policy "own profile" on public.profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own items" on public.library_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
