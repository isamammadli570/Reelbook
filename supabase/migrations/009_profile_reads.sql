-- Faster profile pages for big libraries. Run once in the Supabase SQL Editor, after 008_public_profiles.sql.
-- The app works before and after it: until it runs, profile pages read the tables page by page as before.
--
-- 1. Someone's whole library or lists in one request, without what their page never shows.
-- 2. Row-level security that Postgres can plan once per query instead of calling a function on every row.

-- 1. One request per profile page ------------------------------------------------------------------------
-- Before: the library was read 1000 rows at a time, one page after another, with every field of every title.
-- Now: one call returns the whole library as one JSON object (item key → title), deleted titles left out,
-- and without "people" (who directed and stars), which only the owner's own statistics use: over a third of
-- the bytes. Visible only while the profile is public, or to its owner, as with the tables themselves.

create or replace function public.get_profile_library(owner uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(li.item_key, li.data - 'people'), '{}'::jsonb)
  from public.library_items li
  where li.user_id = owner
    and not (li.data ? 'deleted')
    and (owner = (select auth.uid()) or public.is_profile_public(owner));
$$;

create or replace function public.get_profile_lists(owner uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(ul.list_id, ul.data), '{}'::jsonb)
  from public.user_lists ul
  where ul.user_id = owner
    and not (ul.data ? 'deleted')
    and (owner = (select auth.uid()) or public.is_profile_public(owner));
$$;

grant execute on function public.get_profile_library(uuid) to anon, authenticated;
grant execute on function public.get_profile_lists(uuid) to anon, authenticated;

-- 2. Policies Postgres can evaluate once --------------------------------------------------------------------
-- `auth.uid()` written bare is called again for every row; inside `(select ...)` it is called once.
-- `is_profile_public(user_id)` is a security-definer function, which Postgres cannot inline, so it ran once per
-- row too; the same check written as `exists (...)` becomes one join. Same rules as before, only faster.

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own items" on public.library_items;
create policy "own items" on public.library_items for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own lists" on public.user_lists;
create policy "own lists" on public.user_lists for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own activity" on public.activity;
create policy "own activity" on public.activity
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "follow as yourself" on public.follows;
create policy "follow as yourself" on public.follows
  for insert to authenticated with check ((select auth.uid()) = follower_id);

drop policy if exists "unfollow as yourself" on public.follows;
create policy "unfollow as yourself" on public.follows
  for delete to authenticated using ((select auth.uid()) = follower_id);

drop policy if exists "public library" on public.library_items;
create policy "public library" on public.library_items
  for select to anon, authenticated using (
    exists (select 1 from public.profiles p where p.user_id = library_items.user_id and coalesce(p.share_activity, false))
  );

drop policy if exists "public lists" on public.user_lists;
create policy "public lists" on public.user_lists
  for select to anon, authenticated using (
    exists (select 1 from public.profiles p where p.user_id = user_lists.user_id and coalesce(p.share_activity, false))
  );

drop policy if exists "public activity" on public.activity;
create policy "public activity" on public.activity
  for select to anon, authenticated using (
    exists (select 1 from public.profiles p where p.user_id = activity.user_id and coalesce(p.share_activity, false))
  );
