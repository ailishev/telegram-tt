-- Telegram-like auth/onboarding helpers for Supabase console

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_dialogs_updated_at on public.dialogs;
create trigger trg_dialogs_updated_at
before update on public.dialogs
for each row execute function public.set_updated_at();

drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

-- Auto create profile + stars when auth user is created
create or replace function public.handle_new_auth_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  normalized_phone text;
  new_profile_id uuid;
begin
  normalized_phone := coalesce(new.raw_user_meta_data ->> 'phone_number', null);

  insert into public.profiles (
    auth_user_id,
    phone_number,
    first_name,
    last_name,
    display_name,
    username
  )
  values (
    new.id,
    normalized_phone,
    '',
    '',
    '',
    concat('user_', substr(replace(new.id::text, '-', ''), 1, 16))
  )
  on conflict (auth_user_id) do update
    set phone_number = coalesce(excluded.phone_number, public.profiles.phone_number)
  returning id into new_profile_id;

  insert into public.stars_balances(profile_id, balance)
  values (new_profile_id, 1000)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- User completes TG-like onboarding (name/username/bio) after first login
create or replace function public.tg_complete_onboarding(
  p_first_name text,
  p_last_name text default '',
  p_username text default null,
  p_bio text default null
)
returns public.profiles
security definer
set search_path = public
language plpgsql
as $$
declare
  v_profile public.profiles;
  v_username text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_username := case
    when p_username is null or length(trim(p_username)) = 0 then null
    else lower(regexp_replace(trim(p_username), '[^a-zA-Z0-9_]', '', 'g'))
  end;

  update public.profiles
  set
    first_name = coalesce(trim(p_first_name), ''),
    last_name = coalesce(trim(p_last_name), ''),
    display_name = trim(concat(coalesce(trim(p_first_name), ''), ' ', coalesce(trim(p_last_name), ''))),
    username = coalesce(v_username, username),
    bio = p_bio
  where auth_user_id = auth.uid()
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Profile not found for current user';
  end if;

  return v_profile;
end;
$$;

grant execute on function public.tg_complete_onboarding(text, text, text, text) to anon, authenticated;

-- Read my profile (single row)
create or replace function public.tg_me()
returns public.profiles
security definer
set search_path = public
language plpgsql
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_profile
  from public.profiles
  where auth_user_id = auth.uid();

  return v_profile;
end;
$$;

grant execute on function public.tg_me() to anon, authenticated;

-- DB-backed login verification codes (dev-friendly, inspectable in SQL editor)
create table if not exists public.auth_verification_codes (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  is_used boolean not null default false,
  attempts_count integer not null default 0
);

create index if not exists idx_auth_verification_codes_phone_created
  on public.auth_verification_codes (phone_number, created_at desc);

alter table public.auth_verification_codes enable row level security;

drop policy if exists "auth_codes_deny_client_select" on public.auth_verification_codes;
create policy "auth_codes_deny_client_select"
on public.auth_verification_codes
for select using (false);

drop policy if exists "auth_codes_deny_client_modify" on public.auth_verification_codes;
create policy "auth_codes_deny_client_modify"
on public.auth_verification_codes
for all using (false) with check (false);

create or replace function public.tg_request_login_code(p_phone_number text)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_phone text;
  v_code text;
  v_expires_at timestamptz;
begin
  v_phone := regexp_replace(coalesce(p_phone_number, ''), '\s+', '', 'g');
  if v_phone = '' then
    raise exception 'Phone number is required';
  end if;

  update public.auth_verification_codes
  set is_used = true, used_at = now()
  where phone_number = v_phone and is_used = false;

  v_code := lpad((floor(random() * 90000) + 10000)::int::text, 5, '0');
  v_expires_at := now() + interval '10 minutes';

  insert into public.auth_verification_codes (
    phone_number,
    code,
    expires_at
  ) values (
    v_phone,
    v_code,
    v_expires_at
  );

  raise log 'telegram-tt dev login code for % is %', v_phone, v_code;

  return jsonb_build_object('ok', true, 'expires_at', v_expires_at);
end;
$$;

grant execute on function public.tg_request_login_code(text) to anon, authenticated;

create or replace function public.tg_verify_login_code(p_phone_number text, p_code text)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_row public.auth_verification_codes;
  v_phone text;
begin
  v_phone := regexp_replace(coalesce(p_phone_number, ''), '\s+', '', 'g');
  if v_phone = '' then
    return jsonb_build_object('valid', false, 'reason', 'missing_phone');
  end if;

  select *
  into v_row
  from public.auth_verification_codes
  where phone_number = v_phone
    and is_used = false
  order by created_at desc
  limit 1;

  if v_row.id is null then
    return jsonb_build_object('valid', false, 'reason', 'code_not_found');
  end if;

  if v_row.expires_at < now() then
    update public.auth_verification_codes
    set is_used = true, used_at = now()
    where id = v_row.id;
    return jsonb_build_object('valid', false, 'reason', 'code_expired');
  end if;

  if coalesce(trim(p_code), '') <> v_row.code then
    update public.auth_verification_codes
    set attempts_count = attempts_count + 1
    where id = v_row.id;
    return jsonb_build_object('valid', false, 'reason', 'code_invalid');
  end if;

  update public.auth_verification_codes
  set is_used = true, used_at = now()
  where id = v_row.id;

  return jsonb_build_object('valid', true);
end;
$$;

grant execute on function public.tg_verify_login_code(text, text) to anon, authenticated;

-- Dev-only relaxation: allow onboarding/profile edit when profile was created without auth_user_id
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (
  auth.uid() = auth_user_id
  or auth_user_id is null
);
