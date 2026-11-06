-- Lets a signed-in user delete their own account from inside the app (required by the App Store).
-- profiles, library_items and user_lists reference auth.users with "on delete cascade", so their rows go too.
-- The app removes the user's files in the "avatars" bucket before calling this.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if auth.uid() is null then
        raise exception 'Not signed in';
    end if;
    delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
