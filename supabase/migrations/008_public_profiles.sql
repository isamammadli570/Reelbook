-- Public profiles, as on Letterboxd: anyone, signed in or not, can open a profile and see its watch stats,
-- favourites, diary, shelves, reviews and lists. Writing stays with the owner. Emails stay in auth.users.
-- Run once in the Supabase SQL Editor, after 007_social.sql.
--
-- There are no private accounts any more. Accounts that had turned "Share my activity" off before this
-- change stay hidden until their owner opens their profile in the app and makes it public; nobody is
-- made public without being asked.

-- 1. Whether a person's profile is open. A person without a profile row has no @username and cannot be found.
create or replace function public.is_profile_public(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.share_activity from public.profiles p where p.user_id = owner), false);
$$;

grant execute on function public.is_profile_public(uuid) to anon, authenticated;

-- 2. Profiles and follows: readable without an account too, so a shared link opens for anyone.
drop policy if exists "profiles are visible to signed-in users" on public.profiles;
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "follows are visible to signed-in users" on public.follows;
drop policy if exists "follows are public" on public.follows;
create policy "follows are public" on public.follows
  for select to anon, authenticated using (true);

-- 3. The library and lists behind a profile page. "own items" / "own lists" still cover the owner's writes.
drop policy if exists "public library" on public.library_items;
create policy "public library" on public.library_items
  for select to anon, authenticated using (public.is_profile_public(user_id));

drop policy if exists "public lists" on public.user_lists;
create policy "public lists" on public.user_lists
  for select to anon, authenticated using (public.is_profile_public(user_id));

-- 4. Activity: the same rule, now also for visitors without an account.
drop policy if exists "shared activity is visible to signed-in users" on public.activity;
drop policy if exists "public activity" on public.activity;
create policy "public activity" on public.activity
  for select to anon, authenticated using (public.is_profile_public(user_id));

grant select on public.profiles, public.follows, public.library_items, public.user_lists, public.activity to anon;
