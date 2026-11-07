-- 체단실: 프로필 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요. (Logs 화면이 아닙니다)
-- 여러 번 실행해도 안전합니다. 이전 버전을 이미 실행했다면 그대로 다시 실행하면 업데이트됩니다.

-- ───── 프로필 (auth.users 와 1:1) ─────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  created_at timestamptz not null default now()
);

-- ───── 예전 '부대 목록' 정리 ─────
-- 소속 부대를 고르는 기능은 없앴다. 예전 버전에서 만든 부대 칸과 부대 표가 남아 있으면 지운다.
-- (이 칸과 표는 지금 어떤 기능에서도 쓰지 않는다. 처음 실행하는 경우에는 아무 일도 일어나지 않는다)
alter table public.profiles drop column if exists unit_id;
drop table if exists public.units;

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

-- 입대일·전역일. 전역까지 남은 날(D-day)을 보여 주는 데만 쓴다. (모르면 비워 둔다)
alter table public.profiles add column if not exists enlist_date date;
alter table public.profiles add column if not exists discharge_date date;
alter table public.profiles drop constraint if exists profiles_service_dates_order;
alter table public.profiles
  add constraint profiles_service_dates_order
  check (enlist_date is null or discharge_date is null or discharge_date > enlist_date);

alter table public.profiles enable row level security;

-- ───── 권한 (테이블 자동 공개를 껐으므로 직접 열어 준다) ─────
grant select on public.profiles to authenticated;
-- 닉네임, 내 기구, 내 루틴, 입대일·전역일만 직접 수정할 수 있다.
revoke update on public.profiles from authenticated;
grant update (nickname, equipment_ids, equipment_set, routines, enlist_date, discharge_date)
  on public.profiles to authenticated;

-- ───── RLS 정책 ─────
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

-- ───── 운영자 닉네임 보호 ─────
-- '운영자', '관리자' 같은 이름은 일반 사용자가 쓸 수 없다. (운영자는 SQL Editor 에서 직접 정한다)
drop function if exists public.protect_reserved_nickname() cascade;
create function public.protect_reserved_nickname()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_reserved_nickname(new.nickname)
     and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'reserved nickname';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_reserved_nickname on public.profiles;
create trigger profiles_protect_reserved_nickname
  before insert or update of nickname on public.profiles
  for each row execute function public.protect_reserved_nickname();

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

-- 운동 설명 이미지 저장소. 파일 이름은 운동 id 와 같게 한다. (예: pushup.jpg)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercises', 'exercises', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "exercise images are readable by everyone" on storage.objects;
create policy "exercise images are readable by everyone"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'exercises');

-- ───── 중복확인 함수 ─────
-- 회원가입 화면의 [중복확인] 버튼이 부른다. 사용 가능하면 true.
-- 주의: 로그인 전에도 호출할 수 있어서, 이메일이 가입돼 있는지 누구나 물어볼 수 있다.
-- 운영자만 쓸 수 있는 닉네임. 가입 확인, 가입 처리, 닉네임 수정에서 모두 같은 목록을 쓴다.
drop function if exists public.is_reserved_nickname(text);
create function public.is_reserved_nickname(p_nickname text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(btrim(coalesce(p_nickname, ''))) in (
    '운영자', '관리자', '운영진', '관리', 'admin', 'administrator', 'operator', 'moderator'
  );
$$;

drop function if exists public.check_nickname_available(text);
create function public.check_nickname_available(p_nickname text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not public.is_reserved_nickname(p_nickname)
    and not exists (
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
-- 소속 부대는 받지 않는다.
drop function if exists public.handle_new_user() cascade;
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nickname text;
  v_enlist date;
  v_discharge date;
begin
  v_nickname := left(nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''), 20);

  -- 입대일·전역일. 형식이 틀리거나 순서가 이상하면 둘 다 비워 두고 가입은 그대로 진행한다.
  begin
    v_enlist := (new.raw_user_meta_data ->> 'enlist_date')::date;
    v_discharge := (new.raw_user_meta_data ->> 'discharge_date')::date;
  exception when others then
    v_enlist := null;
    v_discharge := null;
  end;
  if v_enlist is not null and v_discharge is not null and v_discharge <= v_enlist then
    v_enlist := null;
    v_discharge := null;
  end if;

  -- 닉네임이 없거나 너무 짧거나, '운영자' 처럼 운영자만 쓸 수 있는 이름이면 임시 이름을 준다.
  if v_nickname is null or char_length(v_nickname) < 2 or public.is_reserved_nickname(v_nickname) then
    v_nickname := '장병' || substr(new.id::text, 1, 4);
  end if;

  -- 확인 후 가입 사이에 같은 닉네임을 다른 사람이 가져갔다면 뒤에 숫자를 붙인다.
  if exists (
    select 1 from public.profiles where lower(nickname) = lower(v_nickname)
  ) then
    v_nickname := left(v_nickname, 15) || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.profiles (id, nickname, enlist_date, discharge_date)
  values (new.id, v_nickname, v_enlist, v_discharge);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 프로필이 없는 예전 계정에 프로필을 만들어 준다.
-- (가입 자동 처리가 생기기 전에 가입한 계정은 프로필 줄이 없어서 닉네임·기구·루틴·날짜가 저장되지 않는다)
-- 닉네임은 임시 이름('장병' + 번호)이고, 나중에 바꿀 수 있다. 이미 프로필이 있는 계정은 건드리지 않는다.
insert into public.profiles (id, nickname)
select u.id, '장병' || substr(replace(u.id::text, '-', ''), 1, 6)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict do nothing;

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

-- ═════════════════════════════════════════════════════════════
--  갤러리(커뮤니티 방) · 글 · 댓글 · 추천 · 신고
--  디시인사이드의 갤러리처럼 누구나 만들 수 있고, 방장은 없다.
--  표는 사이트에서 직접 읽고 쓰지 못하게 막아 두고, 아래 함수로만 다룬다.
-- ═════════════════════════════════════════════════════════════

-- 제목을 비교용으로 바꾼다: 띄어쓰기를 없애고 소문자로. ('3 사단 체단실' 과 '3사단체단실' 은 같은 방)
drop function if exists public.normalize_gallery_title(text);
create function public.normalize_gallery_title(p_title text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(coalesce(p_title, ''), '\s+', '', 'g'));
$$;

create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 30),
  title_key text not null unique,
  -- 하루에 만들 수 있는 방 수를 세는 데만 쓰고, 화면에는 보이지 않는다.
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_posts (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists gallery_posts_gallery_idx on public.gallery_posts (gallery_id, created_at desc);

create table if not exists public.post_votes (
  post_id uuid not null references public.gallery_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.gallery_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

-- 신고. 갤러리는 5명, 글·댓글은 3명이 신고하면 다른 사람에게 가려진다.
create table if not exists public.community_reports (
  kind text not null check (kind in ('gallery', 'post', 'comment')),
  target_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('욕설·비방', '군사 보안 위반', '광고·도배', '기타')),
  created_at timestamptz not null default now(),
  primary key (kind, target_id, user_id)
);

alter table public.galleries enable row level security;
alter table public.gallery_posts enable row level security;
alter table public.post_votes enable row level security;
alter table public.post_comments enable row level security;
alter table public.community_reports enable row level security;
revoke all on public.galleries from anon, authenticated;
revoke all on public.gallery_posts from anon, authenticated;
revoke all on public.post_votes from anon, authenticated;
revoke all on public.post_comments from anon, authenticated;
revoke all on public.community_reports from anon, authenticated;

-- 갤러리 만들기. 같은 제목(띄어쓰기·대소문자 무시)은 만들 수 없고, 한 사람이 하루에 1개까지.
drop function if exists public.create_gallery(text);
create function public.create_gallery(p_title text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_title text := btrim(coalesce(p_title, ''));
  v_key text := public.normalize_gallery_title(p_title);
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;
  if char_length(v_title) < 2 or char_length(v_title) > 30 or v_key = '' then
    raise exception 'invalid title';
  end if;
  if public.is_reserved_nickname(v_title) then
    raise exception 'invalid title';
  end if;
  if (
    select count(*) from public.galleries
    where created_by = v_uid and created_at > now() - interval '1 day'
  ) >= 1 then
    raise exception 'too many galleries';
  end if;
  begin
    insert into public.galleries (title, title_key, created_by)
    values (v_title, v_key, v_uid)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'duplicate title';
  end;
  return v_id;
end;
$$;

-- 갤러리 목록·검색. 최근 7일 글이 많은 방, 글이 많은 방 순. 검색어가 있으면 비슷한 제목만(만들기 전 중복 확인에도 쓴다).
-- p_sort: 'active' 최근 활발한 순 | 'posts' 글 많은 순 | 'new' 새로 생긴 순
drop function if exists public.list_galleries(text);
drop function if exists public.list_galleries(text, text);
create function public.list_galleries(p_query text default '', p_sort text default 'active')
returns table (
  id uuid,
  title text,
  post_count bigint,
  recent_count bigint,
  last_post_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (select public.normalize_gallery_title(p_query) as k),
  base as (
    select
      g.id,
      g.title,
      g.created_at as made_at,
      (select count(*) from public.gallery_posts p where p.gallery_id = g.id) as posts,
      (select count(*) from public.gallery_posts p
        where p.gallery_id = g.id and p.created_at > now() - interval '7 days') as recent,
      (select max(p.created_at) from public.gallery_posts p where p.gallery_id = g.id) as last_at
    from public.galleries g, q
  where (select auth.uid()) is not null
    and (
      select count(*) from public.community_reports r
      where r.kind = 'gallery' and r.target_id = g.id
    ) < 5
    and (q.k = '' or position(q.k in g.title_key) > 0 or position(g.title_key in q.k) > 0)
  )
  select b.id, b.title, b.posts, b.recent, b.last_at
  from base b
  order by
    case when p_sort = 'new' then b.made_at end desc nulls last,
    case when p_sort = 'posts' then b.posts else b.recent end desc,
    b.posts desc,
    b.made_at desc
  limit 100;
$$;

-- 갤러리 한 곳의 제목
drop function if exists public.get_gallery(uuid);
create function public.get_gallery(p_gallery_id uuid)
returns table (id uuid, title text)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.title
  from public.galleries g
  where g.id = p_gallery_id
    and (select auth.uid()) is not null
    and (
      select count(*) from public.community_reports r
      where r.kind = 'gallery' and r.target_id = g.id
    ) < 5;
$$;

-- 갤러리의 글 목록(최신순). 신고로 가려진 글은 제목을 빼고 hidden = true 로 돌려준다.
-- p_sort: 'latest' 최신순 | 'likes' 추천순(추천−비추천) | 'comments' 댓글 많은 순
drop function if exists public.list_posts(uuid, integer, integer);
drop function if exists public.list_posts(uuid, integer, integer, text);
create function public.list_posts(
  p_gallery_id uuid,
  p_limit integer default 30,
  p_offset integer default 0,
  p_sort text default 'latest'
)
returns table (
  id uuid,
  title text,
  nickname text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  is_mine boolean,
  hidden boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      p.id, p.title, p.created_at, p.user_id, pr.nickname,
      (select coalesce(sum(v.value), 0) from public.post_votes v where v.post_id = p.id) as score,
      (select count(*) from public.post_comments c where c.post_id = p.id) as comments,
      (select count(*) from public.community_reports r where r.kind = 'post' and r.target_id = p.id) as reports
    from public.gallery_posts p
    left join public.profiles pr on pr.id = p.user_id
    where p.gallery_id = p_gallery_id and (select auth.uid()) is not null
  )
  select
    b.id,
    case when b.reports >= 3 and b.user_id <> (select auth.uid()) then null else b.title end,
    b.nickname,
    b.created_at,
    b.score,
    b.comments,
    (b.user_id = (select auth.uid())),
    (b.reports >= 3)
  from base b
  order by
    case when p_sort = 'likes' then b.score end desc nulls last,
    case when p_sort = 'comments' then b.comments end desc nulls last,
    b.created_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

-- 글 한 개
drop function if exists public.get_post(uuid);
create function public.get_post(p_post_id uuid)
returns table (
  id uuid,
  gallery_id uuid,
  gallery_title text,
  title text,
  body text,
  nickname text,
  created_at timestamptz,
  like_count bigint,
  dislike_count bigint,
  my_vote smallint,
  is_mine boolean,
  hidden boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      p.id, p.gallery_id, g.title as gallery_title, p.title, p.body, p.created_at, p.user_id, pr.nickname,
      (select count(*) from public.post_votes v where v.post_id = p.id and v.value = 1) as likes,
      (select count(*) from public.post_votes v where v.post_id = p.id and v.value = -1) as dislikes,
      (select v.value from public.post_votes v
        where v.post_id = p.id and v.user_id = (select auth.uid())) as my_value,
      (select count(*) from public.community_reports r where r.kind = 'post' and r.target_id = p.id) as reports
    from public.gallery_posts p
    join public.galleries g on g.id = p.gallery_id
    left join public.profiles pr on pr.id = p.user_id
    where p.id = p_post_id and (select auth.uid()) is not null
  )
  select
    b.id,
    b.gallery_id,
    b.gallery_title,
    case when b.reports >= 3 and b.user_id <> (select auth.uid()) then null else b.title end,
    case when b.reports >= 3 and b.user_id <> (select auth.uid()) then null else b.body end,
    b.nickname,
    b.created_at,
    b.likes,
    b.dislikes,
    coalesce(b.my_value, 0)::smallint,
    (b.user_id = (select auth.uid())),
    (b.reports >= 3)
  from base b;
$$;

-- 글쓰기. 도배 방지: 1분에 3개까지.
drop function if exists public.add_post(uuid, text, text);
create function public.add_post(p_gallery_id uuid, p_title text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;
  if char_length(v_title) < 1 or char_length(v_title) > 60 then
    raise exception 'invalid title';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 3000 then
    raise exception 'invalid body';
  end if;
  if not exists (select 1 from public.galleries g where g.id = p_gallery_id) then
    raise exception 'gallery not found';
  end if;
  if (
    select count(*) from public.gallery_posts
    where user_id = v_uid and created_at > now() - interval '1 minute'
  ) >= 3 then
    raise exception 'too many posts';
  end if;
  insert into public.gallery_posts (gallery_id, user_id, title, body)
  values (p_gallery_id, v_uid, v_title, v_body)
  returning id into v_id;
  return v_id;
end;
$$;

-- 내 글 지우기 (댓글·추천도 함께 지워진다)
drop function if exists public.delete_post(uuid);
create function public.delete_post(p_post_id uuid)
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
  delete from public.gallery_posts where id = p_post_id and user_id = v_uid;
end;
$$;

-- 추천(1) / 비추천(-1) / 취소(0). 내 글에는 누를 수 없다.
drop function if exists public.vote_post(uuid, smallint);
create function public.vote_post(p_post_id uuid, p_value smallint)
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
  select p.user_id into v_owner from public.gallery_posts p where p.id = p_post_id;
  if v_owner is null then
    raise exception 'post not found';
  end if;
  if v_owner = v_uid then
    raise exception 'cannot vote own post';
  end if;
  if p_value = 0 then
    delete from public.post_votes where post_id = p_post_id and user_id = v_uid;
  else
    insert into public.post_votes (post_id, user_id, value)
    values (p_post_id, v_uid, p_value)
    on conflict (post_id, user_id) do update set value = excluded.value;
  end if;
end;
$$;

-- 글의 댓글(오래된 순)
drop function if exists public.list_post_comments(uuid);
create function public.list_post_comments(p_post_id uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  nickname text,
  is_mine boolean,
  hidden boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      c.id, c.body, c.created_at, c.user_id, pr.nickname,
      (select count(*) from public.community_reports r where r.kind = 'comment' and r.target_id = c.id) as reports
    from public.post_comments c
    left join public.profiles pr on pr.id = c.user_id
    where c.post_id = p_post_id and (select auth.uid()) is not null
  )
  select
    b.id,
    case when b.reports >= 3 and b.user_id <> (select auth.uid()) then null else b.body end,
    b.created_at,
    b.nickname,
    (b.user_id = (select auth.uid())),
    (b.reports >= 3)
  from base b
  order by b.created_at asc
  limit 500;
$$;

-- 댓글 쓰기. 도배 방지: 1분에 5개까지.
drop function if exists public.add_post_comment(uuid, text);
create function public.add_post_comment(p_post_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 500 then
    raise exception 'invalid body';
  end if;
  if not exists (select 1 from public.gallery_posts p where p.id = p_post_id) then
    raise exception 'post not found';
  end if;
  if (
    select count(*) from public.post_comments
    where user_id = v_uid and created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'too many comments';
  end if;
  insert into public.post_comments (post_id, user_id, body)
  values (p_post_id, v_uid, v_body)
  returning id into v_id;
  return v_id;
end;
$$;

drop function if exists public.delete_post_comment(uuid);
create function public.delete_post_comment(p_comment_id uuid)
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
  delete from public.post_comments where id = p_comment_id and user_id = v_uid;
end;
$$;

-- 신고. p_kind 는 'gallery' | 'post' | 'comment'. 내 것은 신고할 수 없고, 같은 대상은 한 번만 센다.
drop function if exists public.report_content(text, uuid, text);
create function public.report_content(p_kind text, p_target_id uuid, p_reason text)
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
  if p_kind = 'gallery' then
    select g.created_by into v_owner from public.galleries g where g.id = p_target_id;
  elsif p_kind = 'post' then
    select p.user_id into v_owner from public.gallery_posts p where p.id = p_target_id;
  elsif p_kind = 'comment' then
    select c.user_id into v_owner from public.post_comments c where c.id = p_target_id;
  else
    raise exception 'invalid kind';
  end if;
  if v_owner is null then
    raise exception 'target not found';
  end if;
  if v_owner = v_uid then
    raise exception 'cannot report own content';
  end if;
  insert into public.community_reports (kind, target_id, user_id, reason)
  values (p_kind, p_target_id, v_uid, p_reason)
  on conflict (kind, target_id, user_id) do nothing;
end;
$$;

revoke all on function public.normalize_gallery_title(text) from public, anon, authenticated;
revoke all on function public.create_gallery(text) from public, anon;
revoke all on function public.list_galleries(text, text) from public, anon;
revoke all on function public.get_gallery(uuid) from public, anon;
revoke all on function public.list_posts(uuid, integer, integer, text) from public, anon;
revoke all on function public.get_post(uuid) from public, anon;
revoke all on function public.add_post(uuid, text, text) from public, anon;
revoke all on function public.delete_post(uuid) from public, anon;
revoke all on function public.vote_post(uuid, smallint) from public, anon;
revoke all on function public.list_post_comments(uuid) from public, anon;
revoke all on function public.add_post_comment(uuid, text) from public, anon;
revoke all on function public.delete_post_comment(uuid) from public, anon;
revoke all on function public.report_content(text, uuid, text) from public, anon;
grant execute on function public.create_gallery(text) to authenticated;
grant execute on function public.list_galleries(text, text) to authenticated;
grant execute on function public.get_gallery(uuid) to authenticated;
grant execute on function public.list_posts(uuid, integer, integer, text) to authenticated;
grant execute on function public.get_post(uuid) to authenticated;
grant execute on function public.add_post(uuid, text, text) to authenticated;
grant execute on function public.delete_post(uuid) to authenticated;
grant execute on function public.vote_post(uuid, smallint) to authenticated;
grant execute on function public.list_post_comments(uuid) to authenticated;
grant execute on function public.add_post_comment(uuid, text) to authenticated;
grant execute on function public.delete_post_comment(uuid) to authenticated;
grant execute on function public.report_content(text, uuid, text) to authenticated;

-- ═════════════════════════════════════════════════════════════
--  알림 (앱 안의 알림 종)
--  내 글에 댓글이 달리거나, 내 운동 댓글에 답글이 달리면 알림이 생긴다.
--  표는 사이트에서 직접 읽고 쓰지 못하게 막아 두고, 아래 함수로만 다룬다.
-- ═════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('post_comment', 'comment_reply')),
  message text not null,
  link text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;

-- 내 글에 댓글이 달리면 글쓴이에게 알린다. (내가 내 글에 단 댓글은 알리지 않는다)
drop function if exists public.notify_post_comment() cascade;
create function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_title text;
  v_name text;
begin
  select p.user_id, p.title into v_owner, v_title
  from public.gallery_posts p where p.id = new.post_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select pr.nickname into v_name from public.profiles pr where pr.id = new.user_id;
  insert into public.notifications (user_id, kind, message, link)
  values (
    v_owner,
    'post_comment',
    coalesce(v_name, '누군가') || '님이 "' || left(v_title, 20) || '" 글에 댓글을 남겼어요',
    '/community/post?id=' || new.post_id
  );
  return new;
end;
$$;

drop trigger if exists post_comments_notify on public.post_comments;
create trigger post_comments_notify
  after insert on public.post_comments
  for each row execute function public.notify_post_comment();

-- 내 운동 댓글에 답글이 달리면 알린다.
drop function if exists public.notify_comment_reply() cascade;
create function public.notify_comment_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_name text;
begin
  if new.parent_id is null then
    return new;
  end if;
  select c.user_id into v_owner from public.comments c where c.id = new.parent_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select pr.nickname into v_name from public.profiles pr where pr.id = new.user_id;
  insert into public.notifications (user_id, kind, message, link)
  values (
    v_owner,
    'comment_reply',
    coalesce(v_name, '누군가') || '님이 내 댓글에 답글을 남겼어요',
    '/exercises/' || new.exercise_id
  );
  return new;
end;
$$;

drop trigger if exists comments_notify_reply on public.comments;
create trigger comments_notify_reply
  after insert on public.comments
  for each row execute function public.notify_comment_reply();

-- 내 알림 목록 (최근 50개)
drop function if exists public.list_notifications();
create function public.list_notifications()
returns table (id uuid, kind text, message text, link text, created_at timestamptz, is_read boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.kind, n.message, n.link, n.created_at, (n.read_at is not null)
  from public.notifications n
  where n.user_id = (select auth.uid())
  order by n.created_at desc
  limit 50;
$$;

-- 안 읽은 알림 수
drop function if exists public.unread_notification_count();
create function public.unread_notification_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from public.notifications n
  where n.user_id = (select auth.uid()) and n.read_at is null;
$$;

-- 알림을 모두 읽음으로. 한 달이 지난 읽은 알림은 함께 정리한다.
drop function if exists public.mark_notifications_read();
create function public.mark_notifications_read()
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
  update public.notifications set read_at = now() where user_id = v_uid and read_at is null;
  delete from public.notifications where user_id = v_uid and read_at < now() - interval '30 days';
end;
$$;

revoke all on function public.list_notifications() from public, anon;
revoke all on function public.unread_notification_count() from public, anon;
revoke all on function public.mark_notifications_read() from public, anon;
revoke all on function public.notify_post_comment() from public, anon, authenticated;
revoke all on function public.notify_comment_reply() from public, anon, authenticated;
grant execute on function public.list_notifications() to authenticated;
grant execute on function public.unread_notification_count() to authenticated;
grant execute on function public.mark_notifications_read() to authenticated;