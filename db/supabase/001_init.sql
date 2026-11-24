-- Lụm Kèo — tài khoản giai đoạn 1 + Bảng xếp hạng Thử thách hôm nay.
-- Dán toàn bộ file vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng được (idempotent).
--
-- Ai được làm gì:
--   daily_scores : ai cũng ĐỌC được (bảng công khai). KHÔNG có policy insert/update/delete ⇒ trình duyệt (anon /
--                  authenticated) không ghi được. Chỉ máy chủ ghi, bằng service key (bỏ qua RLS), sau khi đã kiểm bằng chứng.
--   profiles     : ai cũng đọc được tên; mỗi người chỉ tạo / sửa dòng của chính mình (auth.uid() = id).

-- ---------- Bảng ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default 'Người chơi',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_name_len check (char_length(name) between 2 and 16)
);

create table if not exists public.daily_scores (
  game        text not null,
  day         integer not null,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  score       numeric not null,              -- giá trị xếp hạng: LỚN hơn = hạng cao hơn (máy chủ tính, xem docs/accounts/README.md)
  result      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  primary key (game, day, user_id),          -- mỗi người một kết quả mỗi game mỗi ngày; lần gửi đầu thắng
  constraint daily_scores_game_fmt check (game ~ '^[a-z0-9-]{1,32}$'),
  constraint daily_scores_day_pos check (day > 0),
  constraint daily_scores_name_len check (char_length(name) between 2 and 16)
);

-- top N của một (game, ngày): order by score desc, created_at asc
create index if not exists daily_scores_board_idx on public.daily_scores (game, day, score desc, created_at);
-- hạng của mình ở mọi game trong ngày (thẻ trang chủ)
create index if not exists daily_scores_user_day_idx on public.daily_scores (user_id, day);

-- updated_at tự cập nhật khi sửa profile
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.daily_scores enable row level security;

drop policy if exists "daily_scores: ai cũng đọc" on public.daily_scores;
create policy "daily_scores: ai cũng đọc" on public.daily_scores
  for select to anon, authenticated using (true);
-- (cố ý KHÔNG có policy insert / update / delete cho daily_scores)

drop policy if exists "profiles: ai cũng đọc" on public.profiles;
create policy "profiles: ai cũng đọc" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "profiles: tạo của mình" on public.profiles;
create policy "profiles: tạo của mình" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and char_length(name) between 2 and 16);

drop policy if exists "profiles: sửa của mình" on public.profiles;
create policy "profiles: sửa của mình" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and char_length(name) between 2 and 16);

-- Lớp chặn thứ hai ngoài RLS: trình duyệt không có quyền ghi daily_scores, không xoá profiles.
revoke insert, update, delete, truncate on public.daily_scores from anon, authenticated;
revoke delete, truncate on public.profiles from anon, authenticated;
grant select on public.daily_scores to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
