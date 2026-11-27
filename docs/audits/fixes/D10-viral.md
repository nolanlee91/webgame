# D10 · Lan truyền: đo đếm phía máy chủ + "Thách cùng màn" (Đào Vàng, 2048, Rắn)

Nhánh `claude/d10-viral`. Làm theo hướng C trong `docs/strategy/VIRAL-VA-THI-DAU.md` (chủ dự án chọn, yêu cầu đo trước).
Không đổi định dạng bản lưu (2048 chỉ thêm trường `seed0` tuỳ chọn trong ván đang lưu). Không đụng asset. Chưa push.

## 1. Số đếm lượt dùng (không công cụ ngoài, không danh tính)

### Máy chủ
- `games-server/stats.js` (mới):
  - `POST /api/ev`, body `{e, g}`, luôn trả rỗng (204).
  - `e` phải nằm trong 9 sự kiện: `share_click`, `challenge_click`, `share_open`, `challenge_open`, `challenge_done`, `room_create`,
    `room_join_link`, `room_join_lobby`, `daily_submit`.
  - `g` phải là id trong `games-meta.js` (sinh từ `homepage/games.js`) hoặc rỗng. Lạ ⇒ bỏ qua, vẫn 204.
  - Thân tối đa 512 byte. Đọc JSON bất kể Content-Type (`sendBeacon` gửi `text/plain`).
  - Giới hạn 60 sự kiện/phút/IP, chỉ trong RAM (`client-ip.js`, tự quên). Quá ngưỡng ⇒ 429, không đếm.
  - Chỉ lưu `(ngày giờ VN dạng YYYYMMDD, sự kiện, game) → n`. Không lưu IP, user id, user agent, tên.
- Chế độ, giống `resolveMode` của tài khoản:
  - **supabase**: có `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Gom trong RAM, mỗi 60 s gọi RPC `stats_add`. Railway tắt máy
    (SIGTERM) thì gửi nốt, chờ tối đa 4 s. Gửi lỗi ⇒ trả về hàng đợi, lần sau gửi tiếp (chặn phình ở 5.000 dòng).
  - **memory**: không có Supabase (máy dev, test, hoặc Railway chưa cấu hình). Mất khi khởi động lại.
  - **off**: `STATS=off`.
- `GET /admin/stats[?days=14|30]`:
  - HTTP Basic, mật khẩu `ADMIN_PASSWORD`, tên đăng nhập gì cũng được. So bằng `timingSafeEqual` trên SHA-256 (không lộ độ dài).
  - Thiếu biến ⇒ **404**. Sai / thiếu mật khẩu ⇒ 401. Sai quá 20 lần/phút/IP ⇒ 429.
  - HTML thuần, không script, không thư viện. Có `noindex` (meta + `X-Robots-Tag`), `no-store`, CSP chặn hết, `X-Frame-Options: DENY`.
  - Hai bảng: theo ngày × sự kiện (mọi game), theo game × sự kiện (cộng cả kỳ). Thêm 3 tỉ lệ: mở link thách / bấm Thách,
    chơi xong / mở link thách, mở link khoe / bấm Khoe.
  - Ở chế độ supabase, trang đọc `stats_daily` (phân trang 1.000 dòng) rồi cộng phần chưa gửi.
- `server.js`:
  - `/api/ev` xử lý trước bước chặn phương thức.
  - Mọi đường bắt đầu bằng `/admin` (không phân biệt hoa thường) bị chặn **trước** bộ phục vụ file tĩnh. Chỉ `/admin/stats` vào
    trang admin, còn lại 404. Bộ ẩn tài liệu nội bộ của `server-static.js` giữ nguyên.
  - `server.stats` để test đọc số trong RAM.

### Phòng online (máy chủ, 10 game)
- `games-server/stats-hook.js` (mới): `roomEvent(game, t, via)` + `viaOf(req)`. `server.js` gắn nơi nhận bằng `setSink`.
  Test host riêng lẻ không gắn thì móc không làm gì.
- Mỗi `host.js` thêm 3 dòng, không có chỗ dùng chung nào sẵn:
  - `require`;
  - `via: viaOf(req)` trong `conn`;
  - `roomEvent(...)` ngay sau khi trả `joined`.
  - Ô Ăn Quan dùng chung khung của Caro. Nối Từ gọi ở `create` và lúc khách vào ghế 2.
  - `resume` không đếm.
- **Phân biệt sảnh / link:** nút "Vào" ở sảnh chờ trang chủ đặt cookie `lk_via=sanh` (2 phút, giá trị cố định, không định danh).
  Trình duyệt gửi cookie này khi game mở WebSocket ⇒ `room_join_lobby`. Còn lại (link mời, gõ mã ở trang chủ hoặc trong game)
  ⇒ `room_join_link`.
  - Sai số đã biết: trong 2 phút sau khi bấm "Vào" ở sảnh, nếu người đó vào phòng khác bằng link thì vẫn tính là "sảnh".

### Trình duyệt
- `_shared/stats.js?v=st1` (mới): `ev(e, g)` gửi bằng `sendBeacon`, không được thì `fetch keepalive`. Không chờ, nuốt mọi lỗi.
  - Nạp module là tự đếm `share_open` nếu trang có `?ref=share` hoặc `?ref=daily` (link khoe Thử thách). Mỗi địa chỉ đếm một lần
    mỗi phiên tab (sessionStorage), tải lại không đếm thêm.
  - `g` nhận cả tên thư mục (`do-vui-nhanh` ⇒ `do-vui`).
- `share.js` (`s2` → `s3`): `shareResult` đếm `share_click`. Thêm `shareLink()` (chia sẻ link + chữ, không ảnh). Bảng chia sẻ
  nhận `title` và chạy được khi không có ảnh.
- `daily-ui.js` (`d6g` → `d10`): bọc `D.record`, lần ghi đầu trong ngày ⇒ `daily_submit`. Đếm cả khi bảng xếp hạng tắt: trên
  Railway hiện chưa bật bảng nên không đếm được bằng request lên máy chủ. Nút "Khoe kết quả" của bảng kết quả ⇒ `share_click`.
  Mọi thứ khác của `daily.js` giữ nguyên.
- Trang chủ: nạp `stats.js` (đếm link khoe về trang chủ `?ref=share&g=home`), cookie sảnh trong `app.js`.
- Trang Quyền riêng tư: thêm 2 dòng "Số đếm lượt dùng" + "Link thách đấu", ngày cập nhật 27/11/2026.

### Chủ dự án cần làm (chi tiết: `docs/account/STATS-SETUP.md`)
1. Supabase → SQL Editor → chạy `db/supabase/002_stats.sql`. File tạo bảng `stats_daily`, bật RLS, không tạo policy, và tạo hàm
   `stats_add(jsonb)` mà chỉ `service_role` gọi được.
2. Railway → thêm `ADMIN_PASSWORD` (≥ 16 ký tự ngẫu nhiên). `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` đã có sẵn.
3. Xem `https://lumkeo.com/admin/stats`.

SQL **chưa chạy thử trên Postgres thật**: máy không có Postgres, Docker không chạy. Unit test chỉ kiểm phía Node, với Supabase giả.
Cách kiểm sau khi chạy có trong `STATS-SETUP.md`.

## 2. "Thách cùng màn": `_shared/challenge.js?v=ch1`

### Link và luồng
- Link có dạng `https://lumkeo.com/games/<thư mục>/?thach=<seed>.<điểm>[.<tên>]`. Domain lấy từ `SITE_URL`.
  - `seed` là uint32. `điểm` là số nguyên 0–99.999.999.
  - `tên` ≤ 16 ký tự, đã `encodeURIComponent`, được phép có dấu chấm.
- **Lọc tên ở cả hai đầu:**
  - Tên tự sinh ("Heo Cute 15") đã duyệt sẵn nên dùng thẳng.
  - Tên tự đặt phải hỏi `POST /api/name/check`, cùng bộ lọc với phòng online và bảng xếp hạng.
  - Bị lọc, mất mạng hoặc quá 1,5 s ⇒ **bỏ tên** (người nhận thấy "bạn bè").
  - Người nhận lọc lại tên trong link, vì link có thể bị sửa tay.
- Link hỏng ⇒ báo nhỏ "Link thách không hợp lệ", xoá `?thach` khỏi thanh địa chỉ, chơi thường.
- Người nhận:
  - Trước khi chơi thấy thẻ "⚔ Thách đấu từ Minh: 1.240 điểm. Cùng màn, chơi thử xem!", với 2 nút "⚔ Nhận thách đấu" và
    "Chơi thường".
  - Hết ván thấy "Bạn 980 – Minh 1.240", một dòng thắng/thua/hoà, và 2 nút "⚔ Thách lại" (link cùng seed + điểm của mình +
    tên mình) và "▶ Chơi màn mới" (ván thường, xoá `?thach`).
  - Khung so điểm nằm ngay dưới tiêu đề để hàng nút ghim đáy ở điện thoại không che.
- Người gửi:
  - Cuối ván thường có nút "⚔ Thách bạn" cạnh "Khoe kết quả". 2048 trước giờ không có nút Khoe nên chỉ thêm nút Thách.
  - Điện thoại có bảng chia sẻ hệ thống ⇒ `navigator.share({ text, url })`.
  - Còn lại ⇒ bảng pixel tiêu đề "Thách bạn": Chép link / Facebook / Messenger (điện thoại) / Zalo.
  - Câu chia sẻ: "Mình được 1.240 điểm ở màn này của Đào Vàng trên Lụm Kèo, bạn vượt nổi không? ⚔".
- Số đếm: `challenge_click` (Thách bạn / Thách lại), `challenge_open` (link hợp lệ), `challenge_done` (một lần mỗi ván thách).

### Quyết định: ván thách **không** tính thành tích riêng
- Ván thách không ghi kỷ lục, không ghi độ dài dài nhất (Rắn), không ghi ô lớn nhất (2048), và không đè ván 2048 đang lưu.
- Màn kết thúc ghi rõ "Ván thách đấu (không tính kỷ lục)".
- Lý do: điểm thách để so với một người cụ thể. Nếu tính vào kỷ lục thì người ta có thể chơi đi chơi lại cùng một màn đã biết trước
  để đẩy kỷ lục.
- Chơi thường giữ nguyên hoàn toàn. Thay đổi duy nhất là seed của ván thường mang biến thể ở vài bit thấp (xem dưới); seed vốn
  là số ngẫu nhiên nên người chơi không thấy khác gì.
- Thử thách hôm nay (`?daily=1`) thắng link thách: có cả hai tham số thì link thách bị bỏ qua (e2e có kiểm).

### Từng game
| Game | Biến thể trong seed | Tái lập được vì | Ghi chú |
|---|---|---|---|
| Rắn Săn Mồi | `seed % 2`: 0 Cổ điển, 1 Xuyên tường | Mồi + đồng vàng sinh từ `s.r` (mulberry32 theo seed). `Math.random` chỉ dùng cho hạt / rung, không ảnh hưởng luật | Test bot đi theo mồi: cùng seed ⇒ cùng chuỗi mồi, cùng điểm |
| 2048 | `seed % 3`: chỉ số trong `SIZES` (3×3 / 4×4 / 5×5) | Ô sinh qua `s.rng` lưu trong ván; hoàn tác trả lại rng | Luật như thường (3 lần hoàn tác). Đạt mục tiêu thì tự chơi tiếp tới hết nước. Ván lưu từ bản cũ (không có `seed0`) thì ẩn nút "Thách bạn" |
| Đào Vàng | không cần | `nextLevel` tính seed màn sau từ seed màn trước. Túi bí ẩn rút từ cùng RNG | `runSeed` = seed màn 1 của lượt. Ván kết thúc ở màn đầu tiên trượt mục tiêu, so tổng điểm |

### API `_shared/challenge.js` (để 8 game còn lại dùng)
```js
import * as CH from "../_shared/challenge.js?v=ch1";

// Mở trang: null (không có link) | object thách. Link hỏng ⇒ tự báo + xoá tham số + trả null. Tự đếm challenge_open.
const chal = CH.readChallenge("xep-gach");      // { game, seed, score, name, ready: Promise<tên đã lọc>, done() }
// Thẻ nhận thách: CH.introBox(chal) → <div class="lk-chal">, game đặt vào thẻ menu của mình, nút do game vẽ bằng class nút riêng.
// Ván thách: createGame({ seed: chal.seed }) (+ biến thể: CH.variantOf(chal.seed, k)); KHÔNG ghi kỷ lục.
// Hết ván thách: card.append(CH.compareBox(chal, myScore)); chal.done();   // đếm challenge_done một lần
// Nút "Thách bạn" / "Thách lại":
CH.shareChallenge({ game: "xep-gach", seed: runSeed, score, against: chal /* null nếu ván thường */ });
// Ván thường: seed mang biến thể ⇒ CH.seedWithVariant(rawSeed, variantIndex, k)
// Rời chế độ thách: CH.stripParam()
```
Hàm thuần (test Node): `parseChallenge`, `formatChallenge`, `challengeUrl`, `challengeText`, `verdict`, `seedWithVariant`,
`variantOf`, `safeName`. Hàm giao diện: `toast`, `introBox`, `compareBox`. CSS tự chèn (`.lk-chal*`), màu lấy từ biến của game
(`--panel2`, `--line`, `--gold`, `--soft`, `--ink`), viền pixel 3 px, chữ ≥ 13 px.

Muốn gắn cho một game mới, cần 3 điều:
1. Luật **chỉ** dùng RNG theo seed (không `Math.random` trong luật).
2. Biết seed đầu ván (lưu `runSeed` / `seed0` lúc tạo ván).
3. Tách biến thể (chế độ, độ khó) vào bit thấp của seed.

## 3. Tag `?v=`
- Mới: `stats.js?v=st1`, `challenge.js?v=ch1`.
- `share.js` `s2` → `s3` (26 chỗ).
- `daily-ui.js` `d6g` → `d10` (Sudoku, 2048, Đố Vui).
- Nhánh đã rebase lên `master` mới nhất (6823eb9). Mọi file import `share.js` / `daily-ui.js` nên đổi theo, kéo dây chuyền tới
  `index.html`. Tag mới là `d10` ở:
  - `game.js` của 2048, Rắn, Đào Vàng, Sudoku, Đố Vui, Bắn Bóng, Cờ Caro, Cờ Tướng, Cờ Vua, Cờ Tỷ Phú, Đua Xe, Ghép Kẹo,
    Nối Thú, Nông Trại, Ô Ăn Quan, Xếp Gạch, Thám Tử Hẻm, Trà Sữa, Cá Ngựa;
  - `co-ca-ngua/hud.js`, `co-ca-ngua/online.js`;
  - `quan-com-tam/ui/overlays.js`;
  - `tham-tu-hem/ui/screens.js` + `ui/panels.js`;
  - `tiem-tra-sua/ui/screens.js`;
  - trang chủ `app.js` (master đang `d9b`);
  - Bánh Mì `game.js` + `ui/screens.js`, Cơm Tấm `game.js` (master `b13` / `c11`).
- **Nông Trại** dùng một tag chung cho mọi module (test `m5.test.mjs` kiểm) ⇒ đổi cả bộ `m15` → `m16` (69 file, gồm test + `tools/sim`).
- `press-nav.js` vẫn import `feedback.js?v=f3`.
- `node tools/cache-tags/check-tags.mjs master`: **OK**.

## 4. Test
| Bộ | Kết quả |
|---|---|
| `games-server/stats.test.mjs` (mới, 15 test) | danh sách sự kiện, game hợp lệ, 204/405, giới hạn tần suất 429, gộp theo ngày giờ VN, flush Supabase cộng dồn + lỗi giữ lại, key JWT / sb_secret_, admin 404/401/200/429, `/admin/*` không rơi xuống file tĩnh, móc phòng Caro qua WebSocket thật (tạo / vào bằng mã / vào từ sảnh bằng cookie) |
| `_shared/test/challenge.test.mjs` (mới, 10 test) | đọc link (đúng / hỏng / tên bẩn / quá dài), tạo link + đọc lại, câu chữ, thắng thua, gói biến thể, lọc tên (máy chủ giả: ok / bị lọc / lỗi / quá giờ), `stats.js` (whitelist, map thư mục, lỗi không lọt), danh sách sự kiện khớp máy chủ, **seed tái lập** cho Rắn / Đào Vàng (5 màn) / 2048 (3 cỡ bàn) |
| `_shared/test/challenge-e2e.mjs` (mới) | **38/38**: Rắn, 2048, Đào Vàng mở link thách ⇒ chơi giả lập tới hết ⇒ màn so điểm, kỷ lục không đổi, "Thách bạn" ra đúng link; link hỏng; `?daily=1` không bị ảnh hưởng; nút ≥ 44 px, chữ ≥ 12 px, nút bắt đầu bấm được, không tràn ngang ở 320×568 / 390×844 / 844×390 / 1366×768; bộ đếm RAM tăng (`challenge_open/done/click`, `share_open`); admin 401/200 |
| Unit 3 game + `_shared/test/*.test.mjs` + `server-static.test.mjs` | 127/127 |
| `games-server/*.test.mjs` + `account/test` | 207/207 |
| `games-server/*/test/*.test.mjs` (10 game online) | 232/232 |
| `daily-e2e.mjs` | TẤT CẢ ĐẠT (40 kiểm, chạy lại sau rebase) |
| `share-e2e.mjs` | 53/53 |
| Toàn bộ unit `prototype/games/*/test` | 1.074/1.074 (sau khi đổi tag Nông Trại `m16`) |
| e2e ảnh Rắn (`screenshots/e2e.mjs`) | 39 PASS, 0 FAIL |
| e2e ảnh 2048 | 59 PASS, 0 FAIL |
| e2e ảnh Đào Vàng | 40/41. Chỉ trượt "≥ 50 khung hình/giây" (đo được 49) vì máy đang chạy song song nhiều Chrome; không liên quan đợt này |
| `sound-press-e2e.mjs` | 246/246 (chạy riêng; một lần chạy song song với e2e khác trượt 2 kiểm "nút vô hiệu không lún" do canh giờ, chạy lại đạt hết) |

Chạy: `node --test --test-concurrency=1 games-server/stats.test.mjs`, `node --test prototype/games/_shared/test/challenge.test.mjs`,
`node prototype/games/_shared/test/challenge-e2e.mjs` (cổng 8993, `PORT=` để đổi).

## 5. Chưa làm / để ý
- 8 game chơi một mình còn lại chưa gắn thách (theo lộ trình: lô 3–4 game mỗi đợt). Module đã sẵn.
- 2048 chưa có nút "Khoe kết quả" ở màn kết thúc thường (từ trước tới giờ chưa có), đợt này chỉ thêm "Thách bạn".
- Số đếm từ trình duyệt có thể bị gửi giả (F12). Giới hạn 60/phút/IP chỉ làm chậm. Nên xem như xu hướng.
- SQL chưa chạy trên Postgres thật (xem mục 1).
- `cdp.mjs` mở Chrome ở cổng gỡ lỗi ngẫu nhiên 9400–9900. Đây là hàm dùng chung nên không đổi; server của e2e mới dùng 8993.

