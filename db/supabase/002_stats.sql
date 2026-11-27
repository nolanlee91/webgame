-- Lụm Kèo — số đếm lượt dùng (Đợt 10). Dán toàn bộ file vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng được.
-- Chỉ lưu số GỘP theo ngày: (ngày giờ VN dạng YYYYMMDD, sự kiện, game) → n. Không có cột IP, user id, user agent hay tên.
-- Máy chủ (games-server/stats.js) gom trong RAM rồi mỗi ~60 giây gọi stats_add() bằng service key (bỏ qua RLS).
-- Trình duyệt (anon / authenticated) KHÔNG đọc, KHÔNG ghi được bảng này.

create table if not exists public.stats_daily (
  day    integer not null,                 -- 20261127 = ngày 27/11/2026 giờ Việt Nam
  event  text    not null,
  game   text    not null default '',      -- id game trong homepage/games.js, '' = không gắn game
  n      bigint  not null default 0,
  primary key (day, event, game),
  constraint stats_daily_day_fmt   check (day between 20260101 and 29991231),
  constraint stats_daily_event_fmt check (event ~ '^[a-z_]{1,32}$'),
  constraint stats_daily_game_fmt  check (game ~ '^[a-z0-9-]{0,32}$'),
  constraint stats_daily_n_pos     check (n >= 0)
);

alter table public.stats_daily enable row level security;
-- Không tạo policy nào ⇒ anon / authenticated bị RLS chặn hết. Thu thêm quyền cho chắc.
revoke all on table public.stats_daily from anon, authenticated;

-- Cộng dồn một lô: p_rows = [{"day":20261127,"event":"share_click","game":"2048","n":3}, …]
-- Gộp các dòng trùng khoá trong cùng lô trước khi upsert (ON CONFLICT không cho sửa một dòng hai lần trong một lệnh).
create or replace function public.stats_add(p_rows jsonb) returns void
language sql
set search_path = ''
as $$
  insert into public.stats_daily as s (day, event, game, n)
  select (r->>'day')::integer, r->>'event', coalesce(r->>'game', ''), sum((r->>'n')::bigint)
  from jsonb_array_elements(p_rows) as r
  where (r->>'n')::bigint > 0
  group by 1, 2, 3
  on conflict (day, event, game) do update set n = s.n + excluded.n;
$$;

revoke all on function public.stats_add(jsonb) from public, anon, authenticated;
grant execute on function public.stats_add(jsonb) to service_role;
grant select, insert, update on table public.stats_daily to service_role;
