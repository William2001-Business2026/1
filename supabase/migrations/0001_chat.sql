-- Hale Moku player chat: profiles, rooms, membership, messages.
-- Every table has row level security on. Players can only read rooms they can
-- access, and all writes that need extra checks go through the functions below.

create schema if not exists private;

-- ───────────────────────── tables ─────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  is_guest boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  is_private boolean not null default true,
  invite_code text unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index room_members_user_idx on public.room_members (user_id);

create table public.messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index messages_room_time_idx on public.messages (room_id, created_at desc);
create index messages_user_time_idx on public.messages (user_id, created_at desc);

-- Words that get starred out of messages, names and room names.
-- Edit this table in the Supabase dashboard to tune the filter. Plain words only.
create table private.blocked_words (word text primary key check (word ~ '^[a-z]+$'));
insert into private.blocked_words (word) values
  ('fuck'), ('fucking'), ('fucker'), ('shit'), ('bitch'), ('asshole'), ('bastard'),
  ('cunt'), ('dick'), ('pussy'), ('slut'), ('whore'), ('nigger'), ('nigga'), ('faggot'), ('retard');

-- The one public room everybody shares.
insert into public.rooms (id, name, is_private)
values ('00000000-0000-0000-0000-000000000001', 'General', false);

-- ───────────────────────── helpers ─────────────────────────

create function private.clean_text(t text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare w text;
begin
  for w in select word from private.blocked_words loop
    t := regexp_replace(t, '\m' || w || '\M', repeat('*', char_length(w)), 'gi');
  end loop;
  return t;
end $$;

create function private.is_room_member(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = rid and m.user_id = (select auth.uid())
  );
$$;

create function private.can_access_room(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rooms r
    where r.id = rid and (not r.is_private or private.is_room_member(rid))
  );
$$;

-- ───────────────────────── triggers ─────────────────────────

-- Give every new account (Google or guest) a profile.
-- Google players start with their first name only; guests get "Guest-1234".
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n text;
begin
  n := split_part(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ' ', 1);
  n := left(private.clean_text(n), 24);
  if coalesce(new.is_anonymous, false) or char_length(n) < 2 then
    n := 'Guest-' || (1000 + floor(random() * 9000))::int;
  end if;
  insert into public.profiles (id, display_name, is_guest)
  values (new.id, n, coalesce(new.is_anonymous, false))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.profiles_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.display_name := btrim(regexp_replace(private.clean_text(new.display_name), '\s+', ' ', 'g'));
  return new;
end $$;

create trigger profiles_clean_name
before update on public.profiles
for each row execute function private.profiles_before_update();

-- Stamp each message with its real author, filter it, and rate limit the sender.
create function private.messages_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if (select count(*) from public.messages m
      where m.user_id = uid and m.created_at > now() - interval '10 seconds') >= 5 then
    raise exception 'rate_limit';
  end if;
  new.user_id := uid;
  new.created_at := now();
  new.author_name := (select p.display_name from public.profiles p where p.id = uid);
  if new.author_name is null then
    raise exception 'no_profile';
  end if;
  new.body := private.clean_text(btrim(new.body));
  return new;
end $$;

create trigger messages_stamp
before insert on public.messages
for each row execute function private.messages_before_insert();

-- ───────────────────────── room functions (called from the game) ─────────────────────────

create function public.create_room(room_name text) returns public.rooms
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); r public.rooms;
begin
  if uid is null then
    raise exception 'not_signed_in';
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

create function public.join_room(code text) returns public.rooms
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); r public.rooms;
begin
  if uid is null then
    raise exception 'not_signed_in';
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

-- ───────────────────────── permissions ─────────────────────────

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.is_room_member(uuid), private.can_access_room(uuid) to authenticated;

revoke all on public.profiles, public.rooms, public.room_members, public.messages from anon, authenticated;
grant select on public.profiles, public.rooms, public.room_members, public.messages to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant insert (room_id, body) on public.messages to authenticated;
grant delete on public.room_members to authenticated;

revoke all on function public.create_room(text), public.join_room(text) from public, anon;
grant execute on function public.create_room(text), public.join_room(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table private.blocked_words enable row level security;

create policy "profiles are readable by signed-in players" on public.profiles
  for select to authenticated using (true);
create policy "players rename themselves" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "see public rooms and rooms you joined" on public.rooms
  for select to authenticated
  using (not is_private or private.is_room_member(id));

create policy "see your own memberships" on public.room_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "leave a room" on public.room_members
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "read messages in rooms you can access" on public.messages
  for select to authenticated using (private.can_access_room(room_id));
create policy "post in rooms you can access" on public.messages
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_access_room(room_id));

-- Live delivery of new messages.
alter publication supabase_realtime add table public.messages;
