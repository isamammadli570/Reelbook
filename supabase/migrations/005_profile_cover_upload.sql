-- A cover photo the user uploaded, stored in the "avatars" bucket from 004 next to their avatar.
-- It wins over cover_path (a TMDB backdrop) when both are set.

alter table public.profiles add column if not exists cover_url text;
