-- Hale Moku chat: Google accounts only.
-- Guest (anonymous) accounts can no longer read or post, create or join rooms,
-- even if anonymous sign-ins are switched on in the dashboard by mistake.

create function private.is_full_account() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false;
$$;
revoke all on function private.is_full_account() from public, anon;
grant execute on function private.is_full_account() to authenticated;

-- Restrictive policies are ANDed with the existing ones.
create policy "google accounts only" on public.profiles
  as restrictive for all to authenticated using (private.is_full_account());
create policy "google accounts only" on public.rooms
  as restrictive for all to authenticated using (private.is_full_account());
create policy "google accounts only" on public.room_members
  as restrictive for all to authenticated using (private.is_full_account());
create policy "google accounts only" on public.messages
  as restrictive for all to authenticated
  using (private.is_full_account()) with check (private.is_full_account());

-- The room functions run with owner rights, so they check for themselves.
create or replace function public.create_room(room_name text) returns public.rooms
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); r public.rooms;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if not private.is_full_account() then
    raise exception 'google_only';
  end if;
  if (select count(*) from public.rooms where created_by = uid) >= 10 then
    raise exception 'room_limit';
  end if;
  insert into public.rooms (name, is_private, invite_code, created_by)
  values (
    btrim(regexp_replace(private.clean_text(room_name), '\s+', ' ', 'g')),
    true,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    uid
  )
  returning * into r;
  insert into public.room_members (room_id, user_id) values (r.id, uid);
  return r;
end $$;

create or replace function public.join_room(code text) returns public.rooms
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); r public.rooms;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if not private.is_full_account() then
    raise exception 'google_only';
  end if;
  select * into r from public.rooms
  where is_private and invite_code = upper(btrim(code));
  if not found then
    raise exception 'room_not_found';
  end if;
  insert into public.room_members (room_id, user_id) values (r.id, uid)
  on conflict do nothing;
  return r;
end $$;
