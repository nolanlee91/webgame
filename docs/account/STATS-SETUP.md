# Bật số đếm lượt dùng (Đợt 10): hướng dẫn cho chủ dự án

Số đếm đã chạy sẵn trong code. Chưa làm gì thì máy chủ đếm **trong RAM** (khởi động lại là mất) và **không có trang xem**.
Làm 2 bước dưới đây để số được giữ lâu dài trên Supabase và xem được ở `https://lumkeo.com/admin/stats`.

> **Không dán service key hay mật khẩu admin vào chat với agent.** Chỉ nhập thẳng vào Supabase / Railway.

## Bước 1. Supabase: tạo bảng `stats_daily` và hàm `stats_add`

1. Mở project Supabase → **SQL Editor** → **New query**.
2. Dán **toàn bộ** nội dung `db/supabase/002_stats.sql` → **Run**. Kết quả phải là "Success. No rows returned".
   (Bản đầy đủ của file nằm ngay dưới đây để đối chiếu. Chạy lại nhiều lần không hỏng dữ liệu.)
3. Kiểm nhanh:

```sql
-- 1 dòng, rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = 'stats_daily';
-- thử cộng rồi xoá dòng thử
select public.stats_add('[{"day":20260101,"event":"share_click","game":"","n":2},{"day":20260101,"event":"share_click","game":"","n":3}]'::jsonb);
select * from public.stats_daily where day = 20260101;   -- phải ra n = 5
delete from public.stats_daily where day = 20260101;
```

```sql
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
revoke all on table public.stats_daily from anon, authenticated;

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
```

## Bước 2. Railway: biến môi trường

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `SUPABASE_URL` | đã có | Dùng chung với Bảng xếp hạng. |
| `SUPABASE_SERVICE_ROLE_KEY` | đã có | Dùng chung. Có URL + key này là số đếm tự chuyển sang Supabase. |
| `ADMIN_PASSWORD` | **mới** | Mật khẩu trang `/admin/stats`. Dài ≥ 16 ký tự, ngẫu nhiên, không dùng lại mật khẩu khác. Không đặt ⇒ trang trả 404. |
| `STATS` | không | `off` = tắt đếm hẳn; `memory` = ép đếm trong RAM (thử nghiệm). Để trống là được. |

Đặt `ADMIN_PASSWORD` xong Railway tự deploy lại. Dòng log khởi động phải có `Số đếm: chế độ supabase, trang /admin/stats bật`.

## Xem số

Mở `https://lumkeo.com/admin/stats` → trình duyệt hỏi tên + mật khẩu: tên gõ gì cũng được, mật khẩu là `ADMIN_PASSWORD`.
`?days=30` để xem 30 ngày. Trang không có link nào trỏ tới, có `noindex`, không lưu cache.

Số trên Supabase trễ tối đa ~60 giây (máy chủ gom rồi gửi mỗi phút; khi Railway tắt máy thì gửi nốt). Trang admin cộng luôn phần
chưa gửi nên số luôn mới nhất.

## Sự kiện được đếm

| Sự kiện | Khi nào | Đếm ở đâu |
|---|---|---|
| `share_click` | Bấm "Khoe kết quả" (17 game + bảng kết quả Thử thách hôm nay) | trình duyệt |
| `challenge_click` | Bấm "Thách bạn" / "Thách lại" | trình duyệt |
| `share_open` | Mở trang có `?ref=share` (link khoe) hoặc `?ref=daily` (link khoe Thử thách) | trình duyệt |
| `challenge_open` | Mở link thách hợp lệ `?thach=…` | trình duyệt |
| `challenge_done` | Người nhận chơi xong ván thách | trình duyệt |
| `room_create` | Tạo phòng online thành công (10 game) | máy chủ |
| `room_join_link` | Vào phòng bằng link hoặc mã (kể cả gõ mã trên trang chủ) | máy chủ |
| `room_join_lobby` | Vào phòng bằng nút "Vào" ở sảnh chờ trang chủ | máy chủ (cookie `lk_via`, 2 phút) |
| `daily_submit` | Xong một Thử thách hôm nay (lần ghi đầu tiên trong ngày, kể cả khi bảng xếp hạng tắt) | trình duyệt |
| `donate_open` | Mở hộp "☕ Ủng hộ Lụm Kèo" ở chân trang chủ / trang Thử thách (không gắn game) | trình duyệt (`homepage/donate.js`) |

Không lưu IP, user id, user agent hay tên. IP chỉ dùng giới hạn 60 sự kiện/phút/IP trong RAM.
Trình duyệt có thể tự gửi số giả (ví dụ bấm F12 gửi hàng loạt): giới hạn theo IP làm chậm việc này nhưng không chặn hẳn.
Xem số như **xu hướng**, không như số chính xác tuyệt đối.
