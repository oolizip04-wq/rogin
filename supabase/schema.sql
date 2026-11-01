-- 체단실: 부대 / 프로필 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전합니다. 이전 버전을 이미 실행했다면 그대로 다시 실행하면 업데이트됩니다.

-- ───── 부대 ─────
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.units add column if not exists branch text;
alter table public.units drop constraint if exists units_name_check;
alter table public.units drop constraint if exists units_name_length;
alter table public.units
  add constraint units_name_length check (char_length(name) between 2 and 80);

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
grant select on public.units to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nickname, unit_id) on public.profiles to authenticated;

-- ───── RLS 정책 ─────
drop policy if exists "units are readable by everyone" on public.units;
create policy "units are readable by everyone"
  on public.units for select
  to anon, authenticated
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

-- ───── 중복확인 함수 ─────
-- 회원가입 화면의 [중복확인] 버튼이 부른다. 사용 가능하면 true.
-- 주의: 로그인 전에도 호출할 수 있어서, 이메일이 가입돼 있는지 누구나 물어볼 수 있다.
create or replace function public.check_nickname_available(p_nickname text)
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

create or replace function public.check_email_available(p_email text)
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
-- 회원가입 폼이 보낸 nickname, unit_branch, unit_name 으로 프로필을 만들고,
-- 처음 보는 부대 이름이면 부대도 새로 만든다.
-- 소셜 로그인처럼 값이 없으면 unit_id 는 비워 두고 나중에 설정하게 한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_branch text;
  v_unit_name text;
  v_unit_id uuid;
  v_nickname text;
begin
  v_branch := left(nullif(btrim(new.raw_user_meta_data ->> 'unit_branch'), ''), 10);
  v_unit_name := left(nullif(btrim(new.raw_user_meta_data ->> 'unit_name'), ''), 80);
  v_nickname := left(nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''), 20);

  if v_unit_name is not null and char_length(v_unit_name) >= 2 then
    insert into public.units (name, branch) values (v_unit_name, v_branch)
    on conflict (name) do nothing;
    select id into v_unit_id from public.units where name = v_unit_name;
  end if;

  if v_nickname is null or char_length(v_nickname) < 2 then
    v_nickname := '장병' || substr(new.id::text, 1, 4);
  end if;

  -- 확인 후 가입 사이에 같은 닉네임을 다른 사람이 가져갔다면 뒤에 숫자를 붙인다.
  if exists (
    select 1 from public.profiles where lower(nickname) = lower(v_nickname)
  ) then
    v_nickname := left(v_nickname, 15) || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.profiles (id, nickname, unit_id)
  values (new.id, v_nickname, v_unit_id);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
