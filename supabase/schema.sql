-- ConnectTime initial schema reference.
-- Apply only to the dedicated ConnectTime Supabase project after it is created.
-- Adult eligibility is set only by a trusted server-side verification workflow.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text not null default '',
  avatar_url text,
  locale text not null default 'en',
  country_code text,
  adult_status text not null default 'pending' check (adult_status in ('pending','verified','rejected','review')),
  account_status text not null default 'pending' check (account_status in ('pending','active','suspended','banned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$')
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  visibility text not null default 'public' check (visibility in ('public','friends','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_friend_request check (requester_id <> recipient_id),
  constraint unique_friend_request unique (requester_id, recipient_id)
);

create index if not exists posts_author_created_idx on public.posts(author_id, created_at desc);
create index if not exists friend_requests_recipient_status_idx on public.friend_requests(recipient_id, status);

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, adult_status, account_status)
  values (new.id, 'pending', 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_connecttime on auth.users;
create trigger on_auth_user_created_connecttime
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.friend_requests enable row level security;

-- Public profile discovery exposes only profiles that passed adult verification.
create policy "verified profiles are discoverable"
on public.profiles for select to anon, authenticated
using (adult_status = 'verified' and account_status = 'active');

create policy "users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "users can update their own editable profile fields"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Do not grant clients write access to verification or account status columns.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_url, locale, country_code) on public.profiles to authenticated;

create policy "verified users can read public posts"
on public.posts for select to anon, authenticated
using (
  visibility = 'public'
  and exists (
    select 1 from public.profiles p
    where p.id = author_id and p.adult_status = 'verified' and p.account_status = 'active'
  )
);

create policy "authors can read their own posts"
on public.posts for select to authenticated
using ((select auth.uid()) = author_id);

create policy "verified active users can create posts"
on public.posts for insert to authenticated
with check (
  (select auth.uid()) = author_id
  and exists (
    select 1 from public.profiles p
    where p.id = author_id and p.adult_status = 'verified' and p.account_status = 'active'
  )
);

create policy "authors can update their own posts"
on public.posts for update to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy "authors can delete their own posts"
on public.posts for delete to authenticated
using ((select auth.uid()) = author_id);

create policy "participants can view their friend requests"
on public.friend_requests for select to authenticated
using ((select auth.uid()) in (requester_id, recipient_id));

create policy "verified users can send friend requests"
on public.friend_requests for insert to authenticated
with check (
  (select auth.uid()) = requester_id
  and exists (select 1 from public.profiles p where p.id = requester_id and p.adult_status = 'verified' and p.account_status = 'active')
  and exists (select 1 from public.profiles p where p.id = recipient_id and p.adult_status = 'verified' and p.account_status = 'active')
);

create policy "recipients can respond to requests"
on public.friend_requests for update to authenticated
using ((select auth.uid()) = recipient_id)
with check ((select auth.uid()) = recipient_id);

grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant select on public.friend_requests to authenticated;
grant insert, update on public.friend_requests to authenticated;
