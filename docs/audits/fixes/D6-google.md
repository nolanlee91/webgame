# D6 — Đăng nhập Google (giữ tên + điểm khi đổi máy)

Nhánh `claude/d6-google` (từ master `8cb0cdf`). Chủ dự án chọn Google. Code lên bản thật an toàn **trước** khi cấu hình xong:
nút Google chỉ hiện khi Supabase thật sự bật nhà cung cấp Google. Hướng dẫn cấu hình cho chủ dự án:
[`docs/account/GOOGLE-LOGIN-SETUP.md`](../../account/GOOGLE-LOGIN-SETUP.md).

## Luồng

1. **Dò Google** (`account.js` `googleEnabled()`): chỉ khi máy chủ ở chế độ `supabase`, trình duyệt gọi
   `GET {supabaseUrl}/auth/v1/settings` (header `apikey` = anon key) và đọc `external.google === true`. Nhớ trong biến trang +
   `sessionStorage["wgp.google.v1"]` (kèm URL project; đổi project thì hỏi lại). Lỗi mạng / HTTP lỗi ⇒ `false` và **không nhớ**
   (lần sau hỏi lại). Chỉ hỏi khi người chơi **mở ô hồ sơ**, xem trang không tốn request nào.
2. **Lưu tiến độ bằng Google** (ô hồ sơ, người đang ẩn danh): `startGoogleLink()` ⇒ `getToken({create:true})` (tạo người ẩn danh nếu
   chưa có) ⇒ `supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } })`. `redirectTo` = `origin + pathname` của
   trang đang mở (bỏ query/hash). Cùng user id ⇒ điểm giữ nguyên. Cần Supabase bật **Manual linking**.
3. **Quay về** (`handleOAuthReturn()`, gọi lúc tải `profile.js`, chỉ khi URL có `code` / `error` / `error_code`):
   - Client Supabase chuyển sang `flowType: "pkce"` (token không nằm trên URL); `detectSessionInUrl` vẫn **tắt** để game khác không
     đụng tham số URL. Trang có ô hồ sơ tự `exchangeCodeForSession(code)` rồi `history.replaceState` dọn `code/state/error*`
     (giữ tham số khác như `?game=`, `#thu-thach`).
   - Ý định ("link" hay "signin") ghi ở `sessionStorage["wgp.oauth.v1"]` trước khi đi, đọc một lần khi về.
   - Link xong ⇒ đẩy tên hiện tại lên `profiles` (`renameMe`) để máy khác lấy lại được ⇒ popover tự mở:
     **"✓ Đã lưu bằng Google · ng•••@gmail.com"** + "Xong! Tên và điểm của bạn đã được lưu."
4. **Máy mới, Google đã gắn tài khoản khác**: Supabase trả `error_code=identity_already_exists` (query hoặc #hash) ⇒ popover báo
   "Tài khoản Google này đã lưu tiến độ trước đó" + **Đăng nhập bằng Google**. Ngoài ra có link nhỏ "Đã lưu ở máy khác? Đăng nhập"
   (đi thẳng, khỏi vòng link thất bại). Cả hai đều qua `pxConfirm` (`px-confirm.js?v=pc1`, nạp lười) cảnh báo tiến độ khách
   ("<tên khách>" và điểm của tên này) sẽ mất ⇒ `signInWithOAuth` ⇒ về ⇒ `GET /api/account/me` lấy `profiles.name` của tài khoản
   ⇒ dùng tên đó (cờ `gen` theo `looksGenerated()`); chưa có tên trên máy chủ thì đẩy tên trên máy lên.
5. **Đăng xuất** (pxConfirm): `signOut({ scope: "local" })` (máy khác vẫn đăng nhập) ⇒ tên khách tự sinh mới (`gen=true`). Lần sau
   cần danh tính, `getToken()` tự tạo người ẩn danh mới.
6. **Tên**: không bao giờ đọc `full_name` / `user_metadata` của Google. Ô hồ sơ chỉ hiện email đã che (`maskEmail`) cho chính người
   chơi. Tên công khai (phòng, bảng xếp hạng) vẫn là tên tự đặt / tự sinh.

Cờ `sent` (đã gửi điểm ngày nào) **không** xoá khi đổi tài khoản: tránh một kết quả bị gửi hai lần dưới hai tên.

## Máy chủ

- `auth.mjs` đã nhận mọi user mà `/auth/v1/user` trả id hợp lệ, không xét `is_anonymous` ⇒ người đã gắn Google được nhận y như
  người ẩn danh; điểm (`daily_scores.user_id`) và tên (`profiles.id`) khoá theo user id. Thêm test chứng minh (cùng id trước/sau khi
  gắn, token mới vẫn ghi, gửi lại không đè, `/api/daily/me` gộp).
  (Ghi chú: brief nói `verify.mjs`, nhưng `verify.mjs` là bộ chấm bằng chứng Thử thách; xác minh token nằm ở `auth.mjs`.)
- Mới: `GET /api/account/me` (+ danh tính) ⇒ `{ name }` từ `profiles` (`""` nếu chưa có). 401 không danh tính, 405 sai method,
  404 đường `/api/account/*` khác, 503 khi bảng tắt, giới hạn GET 240/phút/IP như các GET khác. Định tuyến ở `server.js`.
- `server.js`: `/` ⇒ `/homepage/` giờ **giữ query** (Supabase quay về Site URL `https://lumkeo.com/?code=…` vẫn xử lý được).

## Giao diện (`prototype/homepage/profile.js`, `nav.css`)

- Khối `#meAcct` giữa hạng hôm nay và nút Bảng xếp hạng, đường kẻ đứt phía trên. `data-state` = `guest | linked | already`.
- Nút ≥ 44 px (`.me__pop .me__acct-btn`, thắng `.portal .btn` 40 px), icon "G" pixel 16×16.
- Hộp pxConfirm nằm ngoài `#me`: bấm / focus / Esc trong hộp không đóng popover.
- Màn thấp (≤ 760 px cao): popover dài hơn màn mà thanh trên dính ⇒ `max-height: calc(100dvh - 84px)` + cuộn trong popover
  (mũi tên ẩn vì bị cắt). Đo 360×640: đáy popover 656 ⇒ 621 px, cuộn được tới nút cuối.
- `quyen-rieng-tu.html`: mục "Lưu tiến độ bằng Google (không bắt buộc)": lưu mã tài khoản Google + email chỉ để khôi phục, không
  hiện công khai, không đọc dữ liệu khác của Google; cách đăng xuất; xoá tài khoản bằng yêu cầu từ chính email đó (7 ngày) + gỡ quyền
  trong tài khoản Google. Sửa câu "không thu email" và mục Supabase / Google ở "Lưu ở đâu".

## File

| File | Thay đổi |
|---|---|
| `prototype/games/_shared/account.js` | `flowType: "pkce"`; mục Google: `parseAuthSettings`, `detectGoogle`, `googleEnabled`, `maskEmail`, `looksGenerated`, `googleOf`, `accountState`, `returnUrl`, `linkIdentity` (ghi ý định), `startGoogleLink`, `startGoogleSignIn`, `oauthErrorText`, `readOAuthParams`, `cleanOAuthUrl`, `getServerProfile`, `handleOAuthReturn`, `signOutAccount` |
| `prototype/homepage/profile.js`, `nav.css` | Khối Google trong popover, pxConfirm, xử lý quay về |
| `prototype/homepage/quyen-rieng-tu.html` | Mục Google + style `h3` |
| `games-server/account/index.mjs`, `server.js` | `GET /api/account/me`; giữ query khi `/` ⇒ `/homepage/` |
| `games-server/account/test/helpers.mjs` | Supabase giả có thêm `/settings`, `linkIdentity`, `/authorize`, "Google" giả, `/token?grant_type=pkce` (kiểm S256), `/logout`, user đã gắn Google |
| `games-server/account/test/google.test.mjs` | Mới (4 test) |
| `prototype/games/_shared/test/google-login.test.mjs` | Mới (11 test, chạy trong Node) |
| `prototype/games/_shared/test/google-login-e2e.mjs` | Mới (e2e, supabase-js thật từ jsDelivr + Supabase/Google giả) |
| `prototype/games/_shared/test/daily-e2e.mjs` | Cổng đổi được qua `E2E_PORT` (mặc định giữ 8767) |
| `docs/account/GOOGLE-LOGIN-SETUP.md` | Mới: hướng dẫn chủ dự án |
| 10 game online + 2048/Sudoku/Đố Vui | **Chỉ đổi tag** `?v=` (dây chuyền import) |

## Cache tag (`?v=d6g`)

`account.js` `name2 ⇒ d6g` ở mọi chỗ import; kéo theo `online-kit.js` (`ok2`), `daily-board.js` (`name1`), `daily-ui.js` (`name1`),
`bang-xep-hang.js` (`d3a`), `profile.js` (`d3a`), `nav.css` (`d5a`) ⇒ `d6g`; rồi `game.js` / `net.js` / `online.js` / `app.js` của
co-caro, co-tuong, co-vua, o-an-quan, co-ty-phu, co-ca-ngua, noi-tu, dat-bom, ma-soi, ai-la-noi-gian, 2048, sudoku, do-vui-nhanh
và `index.html` tương ứng ⇒ `d6g`. Trong file game chỉ có dòng tag đổi (agent khác đang sửa CSS nội tuyến các file này).

`node tools/cache-tags/check-tags.mjs master` ⇒ xem mục Test.

## Test

Chạy trên nhánh này (server riêng ở cổng 8993–8997, chỉ tắt tiến trình mình bật):

| Bộ test | Kết quả |
|---|---|
| `npm run test:account` (gồm `google.test.mjs` mới) | 30/30 đạt |
| `node --test prototype/games/_shared/test/*.test.mjs` (gồm `google-login.test.mjs` mới, 11 test) | 59/59 đạt |
| `node --test server-static.test.mjs games-server/name-gen.test.mjs` | 14/14 đạt |
| `google-login-e2e.mjs` (mới) | 34 PASS, TẤT CẢ ĐẠT |
| `home-d3-e2e` | 36 PASS, TẤT CẢ ĐẠT |
| `home-d5-e2e` | 20 PASS, TẤT CẢ ĐẠT |
| `touch-scroll-e2e` | 22 đạt, 0 lỗi |
| `daily-e2e` (`E2E_PORT=8995`) | 40 PASS, TẤT CẢ ĐẠT |
| `daily-board-e2e` (`E2E_PORT=8996`) | 26 PASS, TẤT CẢ ĐẠT |
| `account-supabase-e2e` (`E2E_PORT=8997`) | 10 PASS, TẤT CẢ ĐẠT (sau khi sửa test cũ, xem dưới) |

`google-login-e2e` kiểm: Google tắt và settings lỗi 500 thì khối Google ẩn; xem trang không hỏi settings; bật thì nút ≥ 44 px hiện;
bấm thì `linkIdentity` gửi `redirect_to = http://…/homepage/` (đã bỏ `?game=x#top`) + PKCE S256 + token người ẩn danh; quay về thì URL sạch,
hiện "Đã lưu bằng Google · ng•••@gmail.com", cùng user id, tên giữ nguyên, tên/email Google thật không có trên trang, tên được lưu vào
`profiles`; tải lại và trang Bảng xếp hạng vẫn linked, settings không hỏi lại; Đăng xuất: pxConfirm, Thôi giữ nguyên, Đăng xuất thì
`/logout?scope=local`, phiên bị xoá, tên khách tự sinh mới; máy mới: `identity_already_exists` thì mời đăng nhập, pxConfirm có tên khách,
`/authorize` đúng `redirect_to`, vào lại đúng user id cũ, tên = "Bé Na" lấy từ máy chủ (`gen=false`); không lỗi console.

**`account-supabase-e2e` đã hỏng sẵn trên master** (từ D3): test còn chờ bước hỏi tên (`dlyLb` state "ask") và thẻ `.dcard__rank`
trên trang chủ, cả hai đã bị D3 bỏ. Đã sửa test: đặt sẵn tên chung trong localStorage, kiểm hạng qua ô hồ sơ (`#meRanks`).
`daily-e2e` thêm `E2E_PORT` để chạy ngoài cổng 8767.

`node tools/cache-tags/check-tags.mjs master`:
```
OK: 29 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.
```

Ảnh e2e (390×844 và 1366×900): khách có nút, đã lưu, hộp xác nhận đăng xuất, đã đăng xuất, máy mới "đã lưu trước đó", hộp xác nhận
đăng nhập, đã đăng nhập. Không commit ảnh.

## Chủ dự án cần làm trước khi chạy thật

Theo `docs/account/GOOGLE-LOGIN-SETUP.md`: (1) Google Cloud: consent screen External, 3 quyền cơ bản, không logo, **Publish app**;
(2) Web client: origin `https://lumkeo.com`, redirect `https://<project-ref>.supabase.co/auth/v1/callback`; (3) Supabase: bật Google
(Client ID + Secret), giữ **Allow anonymous sign-ins**, bật **Allow manual linking**, Site URL `https://lumkeo.com/homepage/`, Redirect URLs
`https://lumkeo.com/**` (+ `http://localhost:8991/**` cho dev); (4) kiểm `/auth/v1/settings` ra `"google": true` rồi thử luồng.
Không cần đổi biến môi trường Railway, không cần deploy lại sau khi cấu hình.
