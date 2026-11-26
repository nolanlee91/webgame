# D8: online (Phòng kín, nhịp tim, chủ phòng rời lúc hết ván, bố cục ngang / 320)

Nhánh `claude/d8-online` (từ master `d4be7a6`). Sửa phần P2 còn lại của audit 2 cho 10 game online: Ma Sói, Ai Là Nội Gián,
Đặt Bom, Nối Từ, Cờ Caro, Cờ Vua, Cờ Tướng, Ô Ăn Quan, Cá Ngựa, Tỷ Phú. Không đụng game tiệm, Thám Tử, trang chủ, `cdp.mjs`,
`_shared/online-kit.js` (file này kéo theo `_shared/account.js` của trang chủ / game tiệm).

## 1. Phòng kín thống nhất (quyết định chủ dự án 26/11, PTY-12)

- Mọi game: phòng **mặc định công khai**. Một ô **"Phòng kín"** (không tick sẵn) ở màn tạo phòng, ngay dưới là dòng gợi ý
  "Tích để chỉ người có mã mới vào được" (`aria-describedby`). Trước: nhãn "Phòng kín · vào bằng mã riêng", không có gợi ý.
- Đặt Bom: ô "Phòng công khai" tick sẵn trong phòng chờ đổi thành ô **"Phòng kín"** (tick = kín, chỉ chủ phòng đổi được), cùng
  nghĩa với màn tạo phòng. Dòng "chưa có phòng" ở danh sách công khai viết lại cho hợp.
- Giao thức **không đổi**: `create` vẫn mang `public` (thiếu trường ⇒ công khai như client cũ), Đặt Bom vẫn lệnh `{t:"public", on}`.
  `/api/lobby` (`server.js` → `host.publicList()` → `public-rooms.js`) chỉ liệt kê phòng `public`.
- Test mới `games-server/room-privacy.test.mjs` (server.js thật + WebSocket thật, cả 10 game): không gửi `public` / `public:true`
  ⇒ có trong `/api/lobby`; `public:false` ⇒ không có (mã phòng không xuất hiện ở bất kỳ trường nào), vẫn vào được bằng mã;
  Đặt Bom đổi Phòng kín trong phòng chờ ⇒ sảnh đổi theo.

## 2. Chủ phòng đóng tab rồi ván kết thúc (PARTY2-03)

- Máy chủ Ma Sói / Nội Gián (`host.js` `probeHostAtEnd`): ngay khi pha chuyển sang `end`, gửi ping cho kết nối của chủ phòng.
  Sau `endProbeMs` (mặc định 4 s) không có byte nào về ⇒ coi là rớt: đóng kết nối đó (`silent`), `room.setConnected` chuyển chủ
  phòng cho người thật kế tiếp **ngay**, người đó có nút "Chơi ván mới". Chủ phòng thật ra vẫn còn (trả pong) ⇒ không đổi gì;
  nếu lỡ đóng nhầm thì trình duyệt tự nối lại + resume, giữ ghế (pha `end` không xoá ghế).
- Màn kết quả của người không phải chủ phòng: thay vì trống, hiện "Chờ chủ phòng ★ X mở ván mới… Nếu chủ phòng rời đi, nút
  'Chơi ván mới' sẽ hiện cho bạn." Chủ phòng đã mất kết nối ⇒ nút hiện cho mọi người (máy chủ vốn cho phép `again` khi đó).
- Test `games-server/end-host.test.mjs`: chủ phòng im lặng ⇒ đổi chủ trong ~endProbeMs, chủ cũ còn ghế, chủ mới bấm `again`
  về phòng chờ; chủ phòng trả pong ⇒ giữ nguyên (cả 2 game).

## 3. Nhịp tim nhanh hơn (BOARD2-04)

| | Trước | Sau |
|---|---|---|
| Máy chủ ping | 20 s | **5 s** |
| Coi là rớt khi im lặng quá | 60 s | **15 s** |
| Rớt im lặng (khoá máy, mất sóng) ⇒ nhãn "mất kết nối" | 60–80 s | **15–20 s** |
| Phòng chờ: giữ ghế sau khi đóng tab (có khung đóng) | 20 s | 20 s (không đổi) |
| Phòng chờ: giữ ghế sau khi rớt im lặng | 60–80 + 20 = 80–100 s | 15–20 + 20 + **45** = 80–85 s |
| Đang chơi: giữ ghế / resume | tới khi phòng trống 5 phút | không đổi |

- 7 bản `games-server/*/ws.js` (Nội Gián, Nối Từ dùng bản Ma Sói; Ô Ăn Quan dùng host Caro): `PING_MS = 5000`, `DEAD_MS = 15000`,
  xuất ra để test. Đóng vì im lặng ⇒ `socket.silent = true`.
- 8 `host.js` có hẹn giờ phòng chờ: `lobbyGraceMs + (ws.silent ? silentExtraMs (45 s) : 0)` ⇒ tổng thời gian giữ ghế khi rớt im lặng
  **không ngắn hơn trước**. Tab nền trên điện thoại: trình duyệt trả pong ở tầng mạng (không phụ thuộc JS bị hãm) nên tab còn
  sống không bị đóng; tab bị hệ điều hành đóng băng thì chỉ bị đánh "mất kết nối", ghế vẫn giữ, mở lại thì resume.
- Các host nhận thêm `opts.pingMs / deadMs / silentExtraMs / endProbeMs` (chỉ để test).
- Test `games-server/ws-heartbeat.test.mjs` thêm: mặc định ping ≤ 5 s, dead ≤ 15 s, dead ≥ 2 nhịp, phát hiện ≤ 20 s (7 bản ws.js);
  `silent` đúng cho đóng vì im lặng / đóng thường; Ma Sói, Caro, Đặt Bom: rớt im lặng giữ ghế thêm `silentExtraMs`, đóng tab
  chỉ giữ `lobbyGraceMs`.

## 4. Ma Sói / Nội Gián xoay ngang (PARTY2-04)

`@media (orientation: landscape) and (max-height: 500px)`: trang không cuộn (`body` cao đúng `100dvh` khi đang trong phòng), 2 cột:
- Trái: cảnh cắt quanh chỗ ngồi, cao hết khung (thế giới 150% / 140%, ghế 6,4% / 7%). Phòng chờ: danh sách người + bộ vai (cuộn riêng).
- Phải (43%, ≥ 290 px): vai của bạn (gọn, chạm thẻ để xem mô tả), hành động, chat co giãn. Câu nói nhanh ẩn ở màn thấp (thiếu chỗ
  cho thêm một hàng 44 px), ô gõ vẫn còn.
- Đo (đang chơi): 844×390 và 740×360 `scrollHeight == innerHeight`; đồng hồ pha, 8 ghế, nút hành động, ô chat đều trong màn.
  Phòng chờ: Bắt đầu / Chép link / Hủy / Rời trong màn; 740×360 ô chat cần cuộn cột phải ~30 px.
- PTY-11 (phần còn lại): banner pha `pointer-events: none` ở cả 2 game ⇒ không chặn chạm ghế nữa.

## 5. Party 320 px + tên (PARTY2-05, 06, 08, 09)

- Chip ✕ bỏ bot 32×28 ⇒ **44×44**. Chip "Sẵn sàng" không bị kéo cao (`align-items: center`). Đo 320: ✕ 44×44, Sẵn sàng 67×18.
- Thanh trên ≤ 360 px: "← Lụm Kèo" còn "←" (nhãn đọc màn hình giữ "Về trang chủ Lụm Kèo"), tên game không xuống dòng ⇒ 1 dòng
  (h1 cao 18 px). Loa `flex: none` ⇒ 44×44 ở 320/360 (PARTY2-09).
- 320: tên trong danh sách người luôn còn ≥ 72 px (xuống 2 dòng), chip tự xuống hàng (trước "Bé …").
- Ô tên Ma Sói, Nội Gián, Đặt Bom, Nối Từ: bộ đếm **n/16** như game cờ (`maxlength` 16 ⇒ 40 để không cắt im lặng), dài quá ⇒
  "Tên tối đa 16 ký tự — bớt N ký tự nhé." và không tạo/vào phòng. Máy chủ thay tên (tên tục / số điện thoại) ⇒ Ma Sói, Nội Gián,
  Đặt Bom báo "Tên "…" chưa dùng được nên tạm gọi bạn là Người chơi N…".

## 6. Bố cục game cờ + Ô Ăn Quan

- BOARD2-05 Cá Ngựa: bảng kết quả chừa 60 px trên cùng cho nút loa (loa vẫn bấm được). 320–412 và 844×390: loa không còn giao tiêu đề.
- BOARD2-07 + BRD-14 Caro ngang (`max-height: 520px` + ngang): 3 cột thẻ người | bàn | nút (2 cột, mỗi nút ≥ 44×44, nút Đặt quân
  dưới). 740×360: bàn 304 px, **ô 20 px** (trước 14), menu / loa 44×44 (trước 28×44). 844×390: ô 22 px. Online có chat: cột chat
  180–220 px.
- TTH2-09: "▶ Bắt đầu · Quay lại" (thẻ Chơi với máy) dính đáy thẻ ở màn thấp / hẹp; `.ov` đổi sang `place-items: safe center`
  (thẻ cao hơn khung thì bắt đầu từ mép trên, trước bị cắt đầu không cuộn tới được). Áp cho **Caro, Vua, Tướng, Ô Ăn Quan** vì
  cả 4 cùng lỗi: Bắt đầu nằm ngoài màn ở 844×390, 740×360, 568×320 (Caro cả 320×568). Giờ trong màn ở mọi cỡ đã đo.
- TTH2-10: thẻ kết ván (4 game cờ trên) — hàng nút không dính đáy nữa, ≤ 520 px xếp "Ván tiếp" một hàng + 2 cột. 320×568 (Ô Ăn
  Quan online, đủ 5 nút): tiêu đề, điểm và Ván tiếp cùng thấy, không giao nhau; Hủy phòng cuộn tới được.
- OAQ-03 / OAQ-05: khi 2 ô liền nhau cách < 1,25 × mũi tên (320: ~43 px), hai mũi tên chọn hướng ra ngoài hàng (phía người chơi),
  không che ô / số sỏi. Màn rộng giữ chỗ cũ. Khoảng cách ô ở 320 vẫn do bề ngang màn quyết định (không đổi).
- OAQ-08: nút Tạm dừng / Chơi tiếp có `data-nosfx` ⇒ chỉ 1 tiếng. OAQ-06: online, hộp Tạm dừng đổi tiêu đề "Menu" và ghi
  "Ván online vẫn tiếp tục, hết giờ lượt thì máy đi thay." OAQ-09: giảm chuyển động ⇒ tắt hoạt cảnh CSS, rải sỏi tua nhanh sẵn.
- TTH2-12: Ô Ăn Quan ngang, tên trên thẻ 2 dòng.

## 7. Khác

- PTY-15 Đặt Bom: bảng kết quả xếp người thắng → **người còn sống** → điểm (hoà thì người bị loại điểm cao không đứng đầu).
- BRD-20 Cá Ngựa "Chơi với máy": ẩn nút "Sao chép link phòng" (chỉ còn khi online).

## Cache tag

Mọi file tĩnh đã sửa đổi sang `d8o` ở mọi chỗ tham chiếu:

| File | Tag cũ → mới | Chỗ tham chiếu |
|---|---|---|
| `ma-soi/app.js`, `ma-soi/style.css` | `d6g`, `d6b` → `d8o` | `ma-soi/index.html` |
| `ai-la-noi-gian/app.js`, `ai-la-noi-gian/style.css` | `d6g`, `d6b` → `d8o` | `ai-la-noi-gian/index.html` |
| `dat-bom/app.js`, `dat-bom/style.css` | `d6g`, `d6b` → `d8o` | `dat-bom/index.html` |
| `noi-tu/game.js` | `d7o` → `d8o` | `noi-tu/index.html` |
| `co-ca-ngua/online.js` | `d7o` → `d8o` | `co-ca-ngua/index.html` |
| `co-ca-ngua/game.js` | `d7o` → `d8o` | `co-ca-ngua/index.html`, `co-ca-ngua/online.js` |
| `co-ca-ngua/hud.js` | `d7o` → `d8o` | `co-ca-ngua/game.js` |
| `co-ca-ngua/hud.css` | `d7o` → `d8o` | `co-ca-ngua/hud.js`, `co-ca-ngua/online.js` |
| `o-an-quan/game.js` | `d6g` → `d8o` | `o-an-quan/index.html` |
| `o-an-quan/board.js` | `oaq2` → `d8o` | `o-an-quan/game.js` |

`node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 13 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Kết quả kiểm thử

Chạy trên nhánh này, mỗi lệnh có `timeout`. Máy test dùng chung với nhiều agent khác nên rất bận: lần chạy đầu bộ unit (chạy song
song với e2e) trượt vài test đo thời gian thật (Nội Gián room, `ws-heartbeat` khoảng 40 / 200 ms); đã nới khoảng thời gian của
test nhịp tim / dò chủ phòng (chờ 101 trước khi gửi khung, khoảng 0,3–3 s thay vì 0,1 s, luôn đóng máy chủ trong `finally`)
rồi chạy lại tuần tự, tất cả đạt.

| Lệnh | Kết quả |
|---|---|
| `node --test --test-concurrency=1 games-server/*.test.mjs games-server/*/test/*.test.mjs games-server/account/test/*.test.mjs server-static.test.mjs` (chia 2 nửa để vừa `timeout 590`) | **403/403 đạt** (177 + 226) |
| — trong đó mới: `room-privacy.test.mjs` (1, 10 game), `end-host.test.mjs` (4), `ws-heartbeat.test.mjs` (+17) | đạt |
| `node games-server/ma-soi/test/browser-e2e.mjs` | đạt |
| `node games-server/ai-la-noi-gian/test/browser-e2e.mjs` | đạt |
| `node games-server/dat-bom/test/browser-e2e.mjs` | đạt (sửa bước "maxlength 16" ⇒ kiểm bộ đếm 22/16 + nhắc bớt ký tự; Phòng kín ở phòng chờ) |
| `node games-server/noi-tu/test/browser-e2e.mjs` | đạt |
| `node games-server/board-online-e2e.mjs` | Caro / Vua / Tướng / Ô Ăn Quan: tất cả đạt |
| `node prototype/games/_shared/test/kick-e2e.mjs` | tất cả đạt |
| `node games-server/co-ca-ngua/test/rematch-e2e.mjs` | đạt |
| `BASE=http://127.0.0.1:8941 node prototype/games/_shared/test/chat-off-e2e.mjs` | 250 đạt, 0 lỗi |
| `node tools/cache-tags/check-tags.mjs master` | `OK: 13 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.` |

Đo bố cục bằng script tạm (Chrome headless cổng 8942, server cổng 8941, ngoài repo, đã xoá): Ma Sói / Nội Gián 844×390, 740×360
(đang chơi + phòng chờ), 320 / 360 phòng chờ; Cá Ngựa kết quả 320–412 + 844×390; Caro 740×360, 844×390, 568×320; Bắt đầu chơi với
máy ở Caro / Vua / Tướng / Ô Ăn Quan × 844×390, 740×360, 568×320, 320×568; thẻ kết ván Ô Ăn Quan 320–390 + ngang; mũi tên Ô Ăn
Quan 320 / 390 / 844 / 1366; ô Phòng kín + gợi ý ở cả 10 game (360 px, không tràn ngang).

## Bỏ qua (lý do)

| ID | Lý do |
|---|---|
| OAQ-03 (khoảng cách ô ở 320) | Bàn đã to nhất có thể theo bề ngang 300 px (k không bị làm tròn xuống). Đã sửa phần gây hại (mũi tên che ô / số sỏi). Muốn ô to hơn phải đổi bố cục cả màn 320 (bỏ HUD / hàng nút) — để đợt sau nếu cần. |
| PTY-07 (8 ghế chồng khung ở 320) | Toạ độ ghế đo trên ảnh làng; sửa cần chỉnh lại vị trí ghế / ảnh (asset). Nhãn tên đã không chồng. |
| PTY-02 tắt tiếng / báo cáo từng người | Tính năng mới (M), MODERATION.md ghi là chưa làm. |
| BRD-06 Tỷ Phú 2,4 MB | P1 riêng về ảnh, ngoài phạm vi đợt này (D7 trang chủ đã ưu tiên tải poster). |
| BRD-18 khoảng trống dọc Caro / Vua, BRD-19 thẻ kết quả hiện sau ~1 s | Quyết định thiết kế, không phải lỗi P2; đề xuất cũ đã đạt (< 2 s). |
| BRD-21 `:hover` không bọc `@media (hover:hover)` | Đụng CSS của 5 game, rủi ro lệch giao diện; P3 thẩm mỹ. |
| BRD-23 loa emoji Tỷ Phú | Cần icon pixel mới (asset). |
| BOARD2-08 tên Cá Ngựa 320 "…", BOARD2-09 Mời ra sau ván, BOARD2-11 ô đất Tỷ Phú nhỏ | P3, không thuộc danh sách P2. |
| BOARD2-10 e2e Cờ Tướng trượt | Lần chạy này `board-online-e2e.mjs` Tướng ĐẠT, không tái hiện. |
| TTH2-11 (nhãn mất kết nối 6–8 s ở Ô Ăn Quan) | Đã nhanh hơn nhờ nhịp tim mới (rớt im lặng ≤ 20 s); đóng tab có khung đóng vẫn báo ngay như cũ. |
| Vua / Tướng 568×320: nút "Tạo phòng online" ở màn đầu phải cuộn | Cỡ màn quá nhỏ, ngoài danh sách audit; "Bắt đầu" (chơi với máy) đã trong màn. |
| Chạy e2e trên cổng 8941–8950 | Các e2e có sẵn tự dựng server cổng ngẫu nhiên (`listen(0)`) và Chrome cổng 9400–9900 trong `cdp.mjs` (không được sửa). Chỉ server riêng cho chat-off và script đo của tôi dùng 8941 / 8942. |
