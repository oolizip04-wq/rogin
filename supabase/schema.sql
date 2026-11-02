-- 체단실: 부대 / 프로필 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요. (Logs 화면이 아닙니다)
-- 여러 번 실행해도 안전합니다. 이전 버전을 이미 실행했다면 그대로 다시 실행하면 업데이트됩니다.

-- ───── 부대 ─────
-- name 은 목록에서 고른 부대의 전체 이름입니다. (예: 육군 지상작전사령부 제1군단 제1보병사단)
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  branch text,
  created_at timestamptz not null default now()
);

-- ───── 프로필 (auth.users 와 1:1) ─────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  unit_id uuid references public.units (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 닉네임은 대소문자 구분 없이 중복 불가
create unique index if not exists profiles_nickname_lower_key
  on public.profiles (lower(nickname));

alter table public.units enable row level security;
alter table public.profiles enable row level security;

-- ───── 권한 (테이블 자동 공개를 껐으므로 직접 열어 준다) ─────
-- 부대 목록은 로그인한 사람만 읽는다. (지금은 부대를 고르는 화면이 없다)
revoke select on public.units from anon;
grant select on public.units to authenticated;
grant select on public.profiles to authenticated;
-- 닉네임만 직접 수정할 수 있다. (소속 부대 칸은 지금 쓰지 않는다)
revoke update on public.profiles from authenticated;
grant update (nickname) on public.profiles to authenticated;

-- ───── RLS 정책 ─────
drop policy if exists "units are readable by everyone" on public.units;
drop policy if exists "units are readable by logged-in users" on public.units;
create policy "units are readable by logged-in users"
  on public.units for select
  to authenticated
  using (true);

drop policy if exists "profiles are readable by logged-in users" on public.profiles;
create policy "profiles are readable by logged-in users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ───── 기구 사진 저장소 ─────
-- 사진은 Supabase 대시보드 Storage > equipment 에서 올린다. 파일 이름은 기구 id 와 같게 한다.
-- (예: dumbbell.jpg). 누구나 보고, 올리고 지우는 건 대시보드(관리자)에서만 한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipment', 'equipment', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "equipment photos are readable by everyone" on storage.objects;
create policy "equipment photos are readable by everyone"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'equipment');

-- ───── 중복확인 함수 ─────
-- 회원가입 화면의 [중복확인] 버튼이 부른다. 사용 가능하면 true.
-- 주의: 로그인 전에도 호출할 수 있어서, 이메일이 가입돼 있는지 누구나 물어볼 수 있다.
drop function if exists public.check_nickname_available(text);
create function public.check_nickname_available(p_nickname text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles
    where lower(nickname) = lower(btrim(p_nickname))
  );
$$;

drop function if exists public.check_email_available(text);
create function public.check_email_available(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from auth.users
    where lower(email) = lower(btrim(p_email))
  );
$$;

revoke all on function public.check_nickname_available(text) from public;
revoke all on function public.check_email_available(text) from public;
grant execute on function public.check_nickname_available(text) to anon, authenticated;
grant execute on function public.check_email_available(text) to anon, authenticated;

-- ───── 가입 시 프로필 자동 생성 ─────
-- 회원가입 폼이 보낸 nickname 으로 프로필을 만든다.
-- 소속 부대는 받지 않는다. (units 테이블과 unit_id 칸은 나중을 위해 남겨 둔다)
drop function if exists public.handle_new_user() cascade;
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nickname text;
begin
  v_nickname := left(nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''), 20);

  if v_nickname is null or char_length(v_nickname) < 2 then
    v_nickname := '장병' || substr(new.id::text, 1, 4);
  end if;

  -- 확인 후 가입 사이에 같은 닉네임을 다른 사람이 가져갔다면 뒤에 숫자를 붙인다.
  if exists (
    select 1 from public.profiles where lower(nickname) = lower(v_nickname)
  ) then
    v_nickname := left(v_nickname, 15) || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.profiles (id, nickname)
  values (new.id, v_nickname);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
