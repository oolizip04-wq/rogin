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

-- 내가 가진 기구를 계정에 저장한다. (lib/equipmentSync.ts)
--   equipment_ids : 고른 기구 id 목록
--   equipment_set : '운동 시작하기'로 기구 선택을 한 번이라도 마쳤는지 (true 면 다음 로그인부터 바로 운동 시작)
alter table public.profiles add column if not exists equipment_ids text[] not null default '{}';
alter table public.profiles add column if not exists equipment_set boolean not null default false;
alter table public.profiles drop constraint if exists profiles_equipment_ids_size;
alter table public.profiles
  add constraint profiles_equipment_ids_size check (cardinality(equipment_ids) <= 200);

-- 내 루틴을 계정에 저장한다. (lib/routineSync.ts)
--   routines : [{ id, name, exerciseIds: [...] }, ...]  (루틴 이름과 운동 순서)
alter table public.profiles add column if not exists routines jsonb not null default '[]'::jsonb;
alter table public.profiles drop constraint if exists profiles_routines_shape;
alter table public.profiles
  add constraint profiles_routines_shape
  check (jsonb_typeof(routines) = 'array' and jsonb_array_length(routines) <= 50);

alter table public.units enable row level security;
alter table public.profiles enable row level security;

-- ───── 권한 (테이블 자동 공개를 껐으므로 직접 열어 준다) ─────
-- 부대 목록은 로그인한 사람만 읽는다. (지금은 부대를 고르는 화면이 없다)
revoke select on public.units from anon;
grant select on public.units to authenticated;
grant select on public.profiles to authenticated;
-- 닉네임, 내 기구, 내 루틴만 직접 수정할 수 있다. (소속 부대 칸은 지금 쓰지 않는다)
revoke update on public.profiles from authenticated;
grant update (nickname, equipment_ids, equipment_set, routines) on public.profiles to authenticated;

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

-- ═════════════════════════════════════════════════════════════
--  운동별 댓글 · 대댓글 · 좋아요/싫어요 · 신고
--  표는 사이트에서 직접 읽고 쓰지 못하게 막아 두고, 아래 함수로만 다룬다.
--  (그래야 남의 댓글을 고치거나, 좋아요 수를 조작하거나, 신고 기록을 훔쳐보지 못한다)
-- ═════════════════════════════════════════════════════════════

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  exercise_id text not null check (exercise_id ~ '^[a-z0-9-]{1,80}$'),
  -- 대댓글이면 달린 댓글의 id. 대댓글은 한 단계만 있고, 대댓글에 다는 답글도 원래 댓글 밑에 붙는다.
  parent_id uuid references public.comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists comments_exercise_idx on public.comments (exercise_id, created_at);
create index if not exists comments_parent_idx on public.comments (parent_id);

-- 좋아요(1) / 싫어요(-1). 한 사람이 댓글 하나에 하나만.
create table if not exists public.comment_votes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- 신고. 한 사람이 댓글 하나를 한 번만 신고할 수 있고, 3명이 신고하면 다른 사람에게는 자동으로 가려진다.
create table if not exists public.comment_reports (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('욕설·비방', '군사 보안 위반', '광고·도배', '기타')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;
alter table public.comment_reports enable row level security;
revoke all on public.comments from anon, authenticated;
revoke all on public.comment_votes from anon, authenticated;
revoke all on public.comment_reports from anon, authenticated;

-- 좋아요·싫어요 점수 (윌슨 점수). 표가 적은 댓글이 우연히 맨 위로 오르지 않게 하고, 싫어요가 많으면 아래로 내려간다.
drop function if exists public.comment_score(bigint, bigint);
create function public.comment_score(p_likes bigint, p_dislikes bigint)
returns double precision
language sql
immutable
as $$
  select case
    when (p_likes + p_dislikes) = 0 then 0::double precision
    else (
      (p_likes::double precision / (p_likes + p_dislikes))
      + 1.9208 / (p_likes + p_dislikes)
      - 1.96 * sqrt(
          (
            (p_likes::double precision / (p_likes + p_dislikes))
            * (1 - (p_likes::double precision / (p_likes + p_dislikes)))
            + 0.9604 / (p_likes + p_dislikes)
          ) / (p_likes + p_dislikes)
        )
    ) / (1 + 3.8416 / (p_likes + p_dislikes))
  end;
$$;

-- 한 운동의 댓글 목록. 로그인한 사람만 볼 수 있다.
-- 신고 3건 이상이면 본문을 빼고 hidden = true 로 돌려준다. (쓴 본인에게는 본문이 보인다)
drop function if exists public.list_comments(text);
create function public.list_comments(p_exercise_id text)
returns table (
  id uuid,
  parent_id uuid,
  body text,
  created_at timestamptz,
  nickname text,
  is_mine boolean,
  like_count bigint,
  dislike_count bigint,
  my_vote smallint,
  hidden boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      c.id,
      c.parent_id,
      c.body,
      c.created_at,
      c.user_id,
      p.nickname,
      (select count(*) from public.comment_votes v where v.comment_id = c.id and v.value = 1) as likes,
      (select count(*) from public.comment_votes v where v.comment_id = c.id and v.value = -1) as dislikes,
      (select count(*) from public.comment_reports r where r.comment_id = c.id) as reports,
      (select v.value from public.comment_votes v
        where v.comment_id = c.id and v.user_id = (select auth.uid())) as my_value
    from public.comments c
    left join public.profiles p on p.id = c.user_id
    where c.exercise_id = p_exercise_id
      and (select auth.uid()) is not null
  )
  select
    b.id,
    b.parent_id,
    case when b.reports >= 3 and b.user_id <> (select auth.uid()) then null else b.body end,
    b.created_at,
    b.nickname,
    (b.user_id = (select auth.uid())),
    b.likes,
    b.dislikes,
    coalesce(b.my_value, 0)::smallint,
    (b.reports >= 3)
  from base b
  order by public.comment_score(b.likes, b.dislikes) desc, b.created_at desc
  limit 300;
$$;

-- 댓글 쓰기. p_parent_id 가 있으면 대댓글.
drop function if exists public.add_comment(text, uuid, text);
create function public.add_comment(p_exercise_id text, p_parent_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_body text := btrim(coalesce(p_body, ''));
  v_parent uuid := null;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;
  if p_exercise_id !~ '^[a-z0-9-]{1,80}$' then
    raise exception 'invalid exercise';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 500 then
    raise exception 'invalid body';
  end if;
  -- 도배 방지: 1분에 5개까지
  if (
    select count(*) from public.comments
    where user_id = v_uid and created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'too many comments';
  end if;

  if p_parent_id is not null then
    -- 대댓글에 단 답글도 원래 댓글 밑에 붙인다.
    select coalesce(c.parent_id, c.id) into v_parent
    from public.comments c
    where c.id = p_parent_id and c.exercise_id = p_exercise_id;
    if v_parent is null then
      raise exception 'parent not found';
    end if;
  end if;

  insert into public.comments (exercise_id, parent_id, user_id, body)
  values (p_exercise_id, v_parent, v_uid, v_body)
  returning id into v_id;
  return v_id;
end;
$$;

-- 내 댓글 지우기. (그 댓글에 달린 대댓글, 좋아요, 신고도 함께 지워진다)
drop function if exists public.delete_comment(uuid);
create function public.delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;
  delete from public.comments where id = p_comment_id and user_id = v_uid;
end;
$$;

-- 좋아요(1) / 싫어요(-1) / 취소(0). 내 댓글에는 누를 수 없다.
drop function if exists public.vote_comment(uuid, smallint);
create function public.vote_comment(p_comment_id uuid, p_value smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;
  if p_value not in (-1, 0, 1) then
    raise exception 'invalid value';
  end if;
  select c.user_id into v_owner from public.comments c where c.id = p_comment_id;
  if v_owner is null then
    raise exception 'comment not found';
  end if;
  if v_owner = v_uid then
    raise exception 'cannot vote own comment';
  end if;

  if p_value = 0 then
    delete from public.comment_votes where comment_id = p_comment_id and user_id = v_uid;
  else
    insert into public.comment_votes (comment_id, user_id, value)
    values (p_comment_id, v_uid, p_value)
    on conflict (comment_id, user_id) do update set value = excluded.value;
  end if;
end;
$$;

-- 신고. 내 댓글은 신고할 수 없고, 같은 댓글을 두 번 신고해도 한 번만 센다.
drop function if exists public.report_comment(uuid, text);
create function public.report_comment(p_comment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;
  if p_reason not in ('욕설·비방', '군사 보안 위반', '광고·도배', '기타') then
    raise exception 'invalid reason';
  end if;
  select c.user_id into v_owner from public.comments c where c.id = p_comment_id;
  if v_owner is null then
    raise exception 'comment not found';
  end if;
  if v_owner = v_uid then
    raise exception 'cannot report own comment';
  end if;

  insert into public.comment_reports (comment_id, user_id, reason)
  values (p_comment_id, v_uid, p_reason)
  on conflict (comment_id, user_id) do nothing;
end;
$$;

revoke all on function public.comment_score(bigint, bigint) from public, anon, authenticated;
revoke all on function public.list_comments(text) from public, anon;
revoke all on function public.add_comment(text, uuid, text) from public, anon;
revoke all on function public.delete_comment(uuid) from public, anon;
revoke all on function public.vote_comment(uuid, smallint) from public, anon;
revoke all on function public.report_comment(uuid, text) from public, anon;
grant execute on function public.list_comments(text) to authenticated;
grant execute on function public.add_comment(text, uuid, text) to authenticated;
grant execute on function public.delete_comment(uuid) to authenticated;
grant execute on function public.vote_comment(uuid, smallint) to authenticated;
grant execute on function public.report_comment(uuid, text) to authenticated;
