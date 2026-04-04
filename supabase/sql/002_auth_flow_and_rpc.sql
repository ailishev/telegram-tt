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
