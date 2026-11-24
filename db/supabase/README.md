# Supabase: chạy migration

Thư mục này chứa SQL tạo bảng cho tài khoản (giai đoạn 1) và Bảng xếp hạng Thử thách hôm nay. Kiến trúc đầy đủ ở `docs/accounts/README.md`.

## Chạy lần đầu (hoặc chạy lại)

1. Mở project Supabase → **SQL Editor** → **New query**.
2. Dán **toàn bộ** nội dung `001_init.sql` → **Run**. Kết quả phải là "Success. No rows returned".
3. Kiểm tra ở **Table Editor**: có `profiles` và `daily_scores`, cả hai đều có nhãn **RLS enabled**.

File viết theo kiểu chạy lại được (`create table if not exists`, `drop policy if exists` rồi tạo lại), nên chạy lần hai sẽ không hỏng dữ liệu.

## Migration sau này

Đặt tên tăng dần: `002_<việc>.sql`, `003_…`. Mỗi file cũng phải chạy lại được. Không sửa file đã chạy trên bản thật, chỉ thêm file mới.

## Kiểm nhanh sau khi chạy

```sql
-- phải trả 2 dòng, rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('profiles', 'daily_scores');
-- phải thấy 4 policy: 1 của daily_scores (select), 3 của profiles (select / insert / update)
select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename, cmd;
```
