# Tài khoản người chơi + Bảng xếp hạng hôm nay (giai đoạn 1)

Giai đoạn 1 chỉ có **tài khoản ẩn danh** (không email, không mật khẩu) và **Bảng xếp hạng hôm nay** cho 3 Thử thách: Sudoku, 2048, Đố Vui. Người chơi không phải làm gì: chơi xong thì kết quả tự lên bảng. Chỉ hỏi tên hiển thị một lần, có thể bỏ qua.

## Kiến trúc

```
Trình duyệt                          server.js (Railway)                         Supabase
───────────                          ───────────────────                         ────────
account.js ── GET /api/config ─────▶ chỉ trả URL + anon key (công khai)
   │
   ├─ supabase-js 2.110.9 (jsDelivr, tải lười)
   │     signInAnonymously() ─────────────────────────────────────────────────▶ Auth (anon key)
   │     ◀──────────────────────────────────────────────────── access token (JWT của người chơi)
   │
daily-board.js ─ POST /api/daily/:game/:day ─▶ kiểm token: GET /auth/v1/user ─▶ Auth (anon key + token)
                 { name, proof } + Bearer      dựng lại đề từ hạt, chấm proof
                                               ghi điểm: POST /rest/v1/daily_scores ─▶ PostgREST (SERVICE key)
                                               upsert profiles.name
                 ◀── { top, total, me } ───────
homepage/daily.js ─ GET /api/daily/me?day=N ─▶ hạng của mình ở cả 3 game (1 request)
```

| File | Việc |
|---|---|
| `games-server/account/index.mjs` | Định tuyến `/api/config`, `/api/daily/...`; giới hạn tần suất; cache bảng 15 giây; chọn chế độ |
| `games-server/account/verify.mjs` | Dựng lại đề của ngày và kiểm bằng chứng. Dùng chính `logic.js` của game và `_shared/daily.js` |
| `games-server/account/stores.mjs` | `memoryStore` (RAM) và `supabaseStore` (PostgREST), cùng giao diện |
| `games-server/account/auth.mjs` | `supabaseAuth` (hỏi `/auth/v1/user`, nhớ token hợp lệ 60 giây) và `devAuth` (`x-dev-user`) |
| `games-server/account/names.mjs`, `bad-words.json` | Làm sạch tên và lọc từ tục |
| `prototype/games/_shared/account.js` | Phía trình duyệt: cấu hình, đăng nhập ẩn danh, tên, gọi API. Không tải gì cho tới khi cần |
| `prototype/games/_shared/daily-board.js` | Khung "Bảng xếp hạng hôm nay" trong bảng kết quả (`daily-ui.js` nạp lười) |
| `db/supabase/001_init.sql` | Bảng, RLS, policy. Xem `db/supabase/README.md` |

### Ba chế độ (máy chủ tự chọn)

| Chế độ | Khi nào | Danh tính | Dữ liệu |
|---|---|---|---|
| `supabase` | Có đủ `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Access token Supabase (ẩn danh) | Supabase |
| `memory` | Máy dev, không có biến Supabase và không chạy trên Railway (hoặc `DAILY_BOARD=memory`) | Header `x-dev-user` (id ngẫu nhiên trong localStorage) | RAM, mất khi khởi động lại |
| `off` | Trên Railway mà chưa cấu hình đủ, cấu hình dở dang, hoặc `DAILY_BOARD=off` | — | Bảng ẩn hẳn, API trả 503 |

Vì vậy deploy bản này lên Railway **trước khi** đặt biến môi trường thì không hỏng gì: bảng xếp hạng chỉ ẩn đi, còn kết quả cục bộ, chuỗi ngày và nút Khoe vẫn chạy như cũ.

## Biến môi trường (Railway → Variables)

| Biến | Bí mật? | Lấy ở đâu |
|---|---|---|
| `SUPABASE_URL` | Không | Project Settings → Data API → Project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_ANON_KEY` | Không (công khai, gửi cho trình duyệt) | Project Settings → API Keys: **publishable** `sb_publishable_…` (hoặc anon JWT `eyJ…` kiểu cũ) |
| `SUPABASE_SERVICE_ROLE_KEY` | **CÓ** | Project Settings → API Keys: **secret** `sb_secret_…` (hoặc service_role JWT `eyJ…`) |

- Service key chỉ dùng trên máy chủ. Máy chủ không gửi nó cho trình duyệt, không ghi nó vào log, không trả nó trong lỗi. Test `supabase.test.mjs` và e2e Supabase đều kiểm điều này.
- Key mới (`sb_secret_…`) chỉ gửi ở header `apikey`. Key JWT kiểu cũ (`eyJ…`) gửi thêm `Authorization: Bearer`.
- Biến chỉ dùng khi test: `DAILY_SUDOKU_MIN_SEC` (hạ ngưỡng thời gian Sudoku, **chỉ có tác dụng ở chế độ memory**), `DAILY_BOARD`, `TRUST_PROXY`.

## Lưu những gì

| Ở đâu | Gì |
|---|---|
| Supabase `auth.users` | Người dùng ẩn danh: chỉ có uuid (không email, không số điện thoại) |
| `public.profiles` | `id` (uuid), `name` (tên hiển thị 2–16 ký tự), thời điểm tạo / sửa |
| `public.daily_scores` | `game`, `day`, `user_id`, `name` lúc gửi, `score` (giá trị xếp hạng), `result` (số liệu ngắn: thời gian, lỗi…), `created_at` |
| localStorage `wgp.account.v1` | Tên hiển thị, đã hỏi tên chưa, những (game, ngày) đã gửi, id dev (chỉ máy dev) |
| localStorage `sb-<ref>-auth-token` | Phiên Supabase (supabase-js tự quản lý) |
| localStorage `wgp.daily.v1` | Như cũ. Kết quả daily nay có thêm trường `proof` để gửi lại khi mất mạng |

Bảng xếp hạng không trả `user_id` ra ngoài, chỉ trả hạng, tên, điểm và dòng tóm tắt. Bản ghi của chính mình được đánh dấu `you: true`.

## Luật xếp hạng

Quy ước chung: `score` **lớn hơn thì hạng cao hơn**. Bằng điểm thì dùng chung hạng (1, 1, 3); trong danh sách, ai gửi trước đứng trên.

| Game | Bằng chứng (`proof`) | `score` |
|---|---|---|
| Sudoku | Lưới đã giải (81 số), mặt nạ ô gợi ý, giây, số lỗi, số gợi ý | `−(giây + 30 × lỗi + 60 × gợi ý)`: nhanh hơn thì cao hơn, mỗi lỗi phạt 30 giây, mỗi gợi ý phạt 60 giây |
| 2048 | Chuỗi nước đi `LRUD…` (tối đa 150) | Điểm ván do máy chủ phát lại |
| Đố Vui | 5 lựa chọn (−1 = hết giờ) và số mili-giây mỗi câu | `số câu đúng × 100000 − tổng mili-giây`: đúng nhiều hơn xếp trên, cùng số câu đúng thì nhanh hơn xếp trên |

## Chống gian lận: làm được gì, không làm được gì

Máy chủ **không tin điểm do trình duyệt gửi**. Nó dựng lại đề của ngày từ hạt (dùng cùng mã `logic.js` và `daily.js` với game) rồi chấm lại:

- **Sudoku:** lưới phải là lời giải hợp lệ, giữ đúng mọi số cho sẵn, số ô gợi ý khớp mặt nạ (tối đa 3). Thời gian phải từ 45 giây trở lên và không dài hơn thời gian đề đã tồn tại.
- **2048:** phát lại từng nước bằng chính `2048/logic.js` với hạt của ngày. Nước nào không làm bàn đổi, hay đi tiếp khi ván đã hết, hay quá 150 nước thì bị loại. Điểm và ô lớn nhất do máy chủ tính.
- **Đố Vui:** chấm từng lựa chọn theo đúng 5 câu của ngày (cùng thứ tự xáo đáp án). Thời gian mỗi câu bị ép trong khoảng 0–15 giây.
- **Chung:** chỉ nhận đề của hôm nay. Riêng đề hôm qua còn được nhận trong 10 phút đầu sau 0h giờ VN, cho người chơi xong sát giờ. Mỗi (game, ngày, người) chỉ giữ **lần gửi đầu tiên** (khóa chính và `resolution=ignore-duplicates`). Body tối đa 16 KB. Mỗi IP gửi tối đa 20 POST/phút. Tên được làm sạch và lọc từ tục.

Giới hạn (nói thẳng): đề sinh ngay trong trình duyệt nên người rành kỹ thuật vẫn tự tính được lời giải hoặc đáp án, hoặc khai thời gian Sudoku / Đố Vui ngắn hơn thật. Tài khoản ẩn danh cũng tạo được nhiều cái. Máy chủ chặn được điểm "bịa" và điểm vô lý, nhưng không chặn được người viết bot chơi đúng luật. Nếu cần chặt hơn: bật CAPTCHA cho đăng nhập ẩn danh, ghi nhật ký từng nước Sudoku kèm thời điểm, hoặc chỉ cho tài khoản đã liên kết Google / Facebook lên bảng.

## Thêm đăng nhập Google / Facebook sau này

Tài khoản ẩn danh có thể **liên kết** với Google / Facebook mà vẫn giữ nguyên uuid, nên điểm cũ không mất:

1. Supabase → Authentication → Sign In / Providers: bật **Google** / **Facebook**, điền Client ID và Secret lấy từ Google Cloud Console / Meta for Developers. Thêm `https://<ref>.supabase.co/auth/v1/callback` vào redirect URI của hai bên.
2. Authentication → Sign In / Providers → bật **Allow manual linking** (cần cho `linkIdentity`).
3. Authentication → URL Configuration: Site URL = `https://lumkeo.com`, thêm các trang game vào Redirect URLs.
4. Phía trình duyệt đã có sẵn hàm `linkIdentity(provider)` trong `prototype/games/_shared/account.js`. Chỉ cần làm nút "Liên kết Google/Facebook" gọi `linkIdentity("google")`. Khi quay về trang, `detectSessionInUrl` phải bật cho trang đó (hiện đang tắt vì chưa có luồng OAuth).
5. Khi có tài khoản thật, cập nhật mục "Quyền riêng tư" bên dưới (sẽ có email / tên từ Google, Facebook) và trang chính sách.

## Quyền riêng tư

Hiện chỉ thu: **một id ẩn danh** (uuid ngẫu nhiên do Supabase tạo), **tên hiển thị do người chơi tự chọn** (không bắt buộc, mặc định "Người chơi") và **kết quả Thử thách** (thời gian, số lỗi, điểm, số câu đúng). Không thu email, số điện thoại, tên thật hay danh bạ. Máy chủ Railway có thấy địa chỉ IP (dùng để giới hạn tần suất, chỉ giữ trong RAM khoảng một phút, không ghi vào cơ sở dữ liệu). Tên hiển thị và kết quả trên bảng là công khai. Xoá người dùng trong Supabase (Authentication → Users) sẽ xoá luôn profile và điểm (`on delete cascade`). Xoá dữ liệu trình duyệt thì mất phiên ẩn danh: lần sau sẽ là người chơi mới.

## Chạy và test

```
npm run test:account                         # verify + API + 2 store + Supabase giả (24 test)
node prototype/games/_shared/test/daily-board-e2e.mjs <thư-mục-ảnh>        # 2 người chơi thật qua giao diện (chế độ RAM)
node prototype/games/_shared/test/account-supabase-e2e.mjs <thư-mục-ảnh>   # supabase-js thật + Supabase giả (cần mạng)
node prototype/games/_shared/test/daily-e2e.mjs <thư-mục-ảnh>              # e2e Thử thách cũ
```

Máy dev: `node server.js` là có bảng xếp hạng trong RAM ngay, không cần Supabase.
