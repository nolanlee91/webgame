# REPORT v2 — BOARD (Cờ Caro, Cờ Vua, Cờ Tướng, Cờ Cá Ngựa, Cờ Tỷ Phú)

Snapshot `audit2` (ab70036). Server `PORT=9141 node server.js`, Chrome headless qua CDP (`_shared/test/cdp.mjs`), mỗi người chơi một hồ sơ trình duyệt riêng (`Target.createBrowserContext`). Chạm thật (`Input.dispatchTouchEvent`) và chuột thật. Ảnh và JSON thô nằm trong scratchpad `audit2/BOARD/` (`shots/`, `duel-*.json`, `party-*.json`, `solo-*.json`, `perf.json`), không nằm trong repo. Máy đo bị tải nặng vì 7 auditor chạy cùng lúc, nên số thời gian (FCP, độ trễ phát hiện rớt mạng) dao động. Mỗi số dưới đây đều đã chạy lại ít nhất 2 lần.

## 1. Phạm vi đã chạy thật

- **Online Caro / Vua / Tướng** (`duel.mjs`). Mỗi game chạy trọn 1–2 lượt, có 4 hồ sơ:
  - A là chủ phòng, 390×844, dpr 3, cảm ứng.
  - B là khách, 360×800, cảm ứng.
  - C là người thứ 3, 412×915.
  - D là người thứ 4, 1366×768, dùng chuột.
- **Các bước online đã chạy cho Caro / Vua / Tướng:**
  - Tên 28 ký tự có dấu và emoji: bộ đếm hiện `28/16 · dài quá`, bị chặn tạo phòng. Sau đó dùng tên 16 ký tự có emoji.
  - Phòng hiện trong danh sách công khai ở trang chủ. C vào bằng link trên trang chủ, chủ phòng "Mời ra" C qua hộp pixel. C vào lại thì bị chặn 10 phút.
  - B gõ mã chữ thường để vào phòng. D vào khi phòng đã đủ người.
  - Bắt đầu ván. Mỗi bên đi 2 nước bằng chạm thật (Caro: chạm ô rồi bấm Đặt quân; Vua/Tướng: chạm quân rồi chạm ô đích).
  - Chat: gửi từ tục có dấu, từ tục không dấu kèm link, và "d.u m.a". Tắt chat rồi kiểm lại.
  - Khách F5. Khách đóng tab, máy đi thay, khách mở lại link sau 45 s.
  - Chủ phòng đóng tab rồi mở lại sau 20 s. Chủ phòng F5.
  - Hết ván: Xin thua qua hộp pixel (Caro thì đánh 5 quân thắng). B bấm "Ván tiếp", A chờ hết 10 s.
  - Hủy phòng qua hộp pixel. D nhập lại mã đã hủy.
  - Chạy lại `games-server/board-online-e2e.mjs`: Caro và Vua ĐẠT, **Tướng TRƯỢT 2/2 lần** (mục BOARD2-10).
- **Online Cá Ngựa / Tỷ Phú, 3 người** (`party.mjs`): A 390×844 dpr 3, B 360×800, C 320×568.
  - Tên dài, vào phòng bằng link mời, "Mời ra" có trong phòng chờ.
  - Bấm Chơi/Bắt đầu, chơi 50 s bằng chạm thật. Cá Ngựa lệch trạng thái giữa 3 máy = 0.
  - Chat bị lọc.
  - Xoay B sang 844×390 và C sang 740×360, rồi C về 320.
  - B đóng tab và mở lại link sau 30 s.
- **Tỷ Phú thêm `typrobe*.mjs`:** đo bề rộng trang ở 320/360 trong phòng chờ, trong ván online và trong ván solo.
- **Solo cả 5 game** (`solo.mjs`), chạm thật.
  - Caro: thắng máy Dễ (13 nước).
  - Vua và Tướng: đi 6 nước rồi Xin thua qua hộp pixel.
  - Cá Ngựa: chơi 40 s, rồi đưa ván tới lúc thắng bằng test hook (như e2e của game), xem bảng kết quả ở 390, 360×640 và 844×390, bấm Khoe.
  - Tỷ Phú: chơi 30 s, rồi `setFast` cho chạy hết 25 vòng, bấm Khoe.
  - Quét bố cục 320, 360, 390, 412, 768, 844×390, 740×360, 1366 và 1920.
- **Tải trang Fast 3G + CPU ×4** cho 5 game (`perf.mjs`, 2 lần, tắt cache). Gửi HEAD lên lumkeo.com để xem cỡ ảnh Tỷ Phú.
- **Đọc code:** server `host.js`, `room.js`, `ws.js`; client `net.js` và `hud.js` của Cá Ngựa; CSS `:hover`.

**Chưa kiểm:**
- Máy iOS/Android thật, trình duyệt trong Zalo/Messenger.
- Đánh trọn ván online Cá Ngựa/Tỷ Phú tới bảng kết quả (không có hook tua nhanh phía server). Phần này chỉ đọc code, cộng với bảng kết quả khi chơi solo.
- Trình đọc màn hình.

## 2. Hạng

| Game | Hạng v1 → v2 | Lý do |
|---|---|---|
| Cờ Caro | B → **A** | Đủ luồng online: giữ ghế khi đóng tab, Ván tiếp hai phía, hộp pixel, "Mời ra", "Tắt chat". Solo rất dễ hiểu. Còn P2: ở 740×360 ô cờ chỉ 14 px. |
| Cờ Vua | C → **B** | Màn ngang đã sửa (cột thẻ người, bàn, cột nút). Còn khoảng trống lớn giữa HUD và bàn khi cầm dọc. Công cụ ở 320 xuống 2 dòng. |
| Cờ Tướng | B → **B** | Mẹo đi quân đã dời sang cột bên. Online đúng luồng. Test e2e của chính game này trượt 2/2 lần. |
| Cờ Cá Ngựa | C → **B** | Đã hết kẹt cuộn. Chơi được ở màn ngang và 320. Có nút Khoe. Còn P2: "Về phòng" khi online là rời hẳn phòng, "Ván mới" chỉ cần một người bấm, nút loa đè tiêu đề bảng kết quả. |
| Cờ Tỷ Phú | C → **C** | Ngang đã chơi được, có nút Khoe. Nhưng vẫn nặng 2,4 MB, tải xong sau 15–17 s (P1 chưa sửa). Online ở 320/360 trang bị nở ra 379 px, nút loa ra ngoài màn (P1 mới). |

## 3. Điểm 0–10

| Hạng mục | v1 | v2 | Ghi chú |
|---|---|---|---|
| Visual/V5 | 8 | **8** | Hộp xác nhận pixel thay `confirm()`. Viền theo `--b` đồng nhất trên nút. Tỷ Phú vẫn dùng loa emoji. Còn khoảng trống dọc lớn ở Caro/Vua. |
| Mobile UX | 6 | **7** | Màn ngang đã sửa ở Cá Ngựa, Tỷ Phú và Vua. Nút công cụ đạt 44 px. Còn: Tỷ Phú online tràn ở ≤360; link "← Trang chủ" chỉ 92×23 hoặc 13×23; Caro 740×360. |
| Game experience | 7 | **7,5** | Ván tiếp hai phía. Nhãn "Bạn". Có Khoe ở đủ 5 game. Cá Ngựa online vẫn mở ván mới khi chỉ một người bấm. |
| Navigation/flow | 7 | **8** | Đóng tab rồi mở lại vẫn đúng ghế (5/5 game). Có "Mời ra" trong phòng chờ, Hủy phòng có hỏi xác nhận, các thông báo lỗi tiếng Việt đúng. Còn "Về phòng" ở Cá Ngựa. |
| Animation/interaction | 7 | **7** | Không đổi. Thẻ kết quả vẫn hiện sau 1,0–1,3 s. `:hover` chưa bọc trong `@media (hover:hover)`. |
| Performance | 6 | **6** | FCP tốt hơn (font tự host, nén). Tỷ Phú vẫn 2.429 KB. Caro tăng 146 → 211 KB (thêm 4 file font). |
| Accessibility | 6 | **6,5** | Hộp xác nhận là `alertdialog`, bộ đếm tên có `aria-live`. Còn link nhỏ, loa emoji, chưa thử trình đọc màn hình. |
| Ads | n/a | **n/a** | Thẻ SpeakUp đang ẩn. Về chỗ đặt sau này: thẻ kết quả đã có hàng nút ổn định (Ván tiếp · Khoe · Xem bàn · Rời/Hủy), nên đủ chỗ đặt dưới hàng nút. Chưa chấm điểm. |

## 4. Bảng đối chiếu v1

Tổng: **ĐÃ SỬA 14 · SỬA MỘT PHẦN 2 · CHƯA SỬA 8 · HỒI QUY 0**.

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| BRD-01 | **ĐÃ SỬA** | Khách đóng tab, 45 s sau mở lại link thì về đúng ghế (`you=1`) ở Caro, Vua và Tướng. Chủ phòng đóng tab, 20 s sau mở lại thì vẫn là chủ phòng. Cá Ngựa và Tỷ Phú: đóng rồi mở lại sau 30 s, `phase=play`, đúng ghế. Cơ chế: `co-caro/net.js:4–33` lưu localStorage 30 phút. |
| BRD-02 | **ĐÃ SỬA** | Cá Ngựa: sau khi bấm Chơi, `scrollY` = 0 ở 390 và 360, = 45 ở 320 (khay xúc xắc ở y = 91, vẫn trong màn). Nút Chơi nằm sẵn ở y 784–836 trong khung 844. |
| BRD-03 | **ĐÃ SỬA** | Cạnh bàn Cá Ngựa: 346 px ở 844×390, 316 ở 740×360, 272 ở 320. Không tràn ngang (`cangua-B-landscape.png`). |
| BRD-04 | **ĐÃ SỬA** | Tỷ Phú 844×390: bàn 328, nút Gieo ở y 250–294 (`typhu-solo-844x390.png`). Ở 740×360: y 231–275. |
| BRD-05 | **ĐÃ SỬA** | Vua 844×390: 3 cột, thẻ "Quân Trắng · Bạn" đọc trọn (`vua-solo-844x390.png`). |
| BRD-06 | **CHƯA SỬA** | Fast 3G + CPU ×4: 2.429 KB, load 15,4 / 17,3 s, FCP 2,2 / 5,2 s. `board-co-ty-phu.webp` 1.323 KB, `poster` 922 KB. lumkeo.com: Content-Length 1.354.468 và 943.468. |
| BRD-07 | **ĐÃ SỬA** (theo quyết định của chủ dự án: chat tự do có lọc) | "đụ má mày ngu quá" hiện thành "*** mày ngu quá". Link hiện thành `[link]`. "d.u m.a" hiện thành "***". Tắt chat: không còn toast, log `display:none`, giá trị `wgp.chatOff=1` được lưu. Cá Ngựa và Tỷ Phú cũng lọc. |
| BRD-08 | **SỬA MỘT PHẦN** | Bộ đếm `n/16` và câu báo "bớt 12 ký tự" chạy ở cả 5 game. Thẻ người chơi Caro/Vua/Tướng ở 360/390 hiện đủ tên dài có emoji, có nhãn "BẠN". Còn lại: Cá Ngựa ở 320 vẫn cắt "Ngọc Á…", "Trần Bảo…", "Lê Min…" (`cangua-C-play.png`); trang chủ, xem BRD-24. |
| BRD-09 | **ĐÃ SỬA** (Caro/Vua/Tướng) | B bấm Ván tiếp. A thấy "Đối thủ muốn chơi tiếp · ván mới sau 10 giây", nút đổi thành "Chơi tiếp ngay ▶", thẻ vẫn mở sau 5 s. Ván mới tự mở sau khoảng 10 s. B thấy "Đã sẵn sàng ✓" (nút bị khoá). Cá Ngựa chưa làm, xem BOARD2-03. |
| BRD-10 | **ĐÃ SỬA** | Nhãn "MẤT KẾT NỐI" hiện trên thẻ và có toast "… mất kết nối — chờ quay lại". Sau 15 s có toast "… máy đánh/đi thay." Khi người đó quay lại có toast "đã quay lại". Thời gian phát hiện, xem BOARD2-04. |
| BRD-11 | **ĐÃ SỬA** | `confirm()` gốc được gọi 0 lần ở cả 5 game. Hộp pixel xuất hiện khi: Xin thua, Mời ra, Hủy phòng, Rời ván (Cá Ngựa). |
| BRD-12 | **ĐÃ SỬA** | Cá Ngựa có nút "Khoe kết quả", mở `lk-share`. Tỷ Phú `#shareBtn` (chạm được). |
| BRD-13 | **ĐÃ SỬA** | Mẹo của Cờ Tướng không còn đè bàn ở 844×390 (đã chuyển sang cột Biên bản, `tuong-solo-844x390.png`). |
| BRD-14 | **SỬA MỘT PHẦN** | Mọi nút đều cao 44. Ở 320, chữ "ĐI LẠI", "VÁN MỚI", "XIN THUA" xuống 2 dòng nhưng vẫn đọc được (`vua-solo-320x568.png`). Caro 740×360: menu và loa chỉ rộng 28×44. |
| BRD-15 | **CHƯA SỬA** | `hud.js:32` vẫn ghi "Rời bàn — về phòng chờ", nhưng khi online thì `game.js:206` gọi `net.leave()`, tức rời hẳn phòng. Nặng hơn ở BOARD2-02. |
| BRD-16 | **ĐÃ SỬA** | Tên ở phòng chờ Cá Ngựa không còn viết hoa, dấu hiện đủ ("Lê Minh Nguyễn"). |
| BRD-17 | **ĐÃ SỬA** | Không còn chữ "bản chơi thử" hay "pixel V5". Cá Ngựa giữ dòng "Hội đua ngựa làng" làm khẩu hiệu, chấp nhận được. |
| BRD-18 | **CHƯA SỬA** | Vua và Caro ở 390×844: trống khoảng 100–120 CSS px giữa HUD và bàn (`vua-A-play.png`, `caro-A-opp-away.png`). |
| BRD-19 | **CHƯA SỬA** | Thẻ kết quả hiện sau: Caro 968–1.032 ms (`game.js:605`), Tướng 1.100 ms, Vua 1.200 ms khi chiếu bí. Vẫn dưới mức 2–2,5 s đã đề xuất. |
| BRD-20 | **CHƯA SỬA** | Cá Ngựa `?bot=1`: nút "Sao chép link phòng" vẫn hiện (`copyBtnVisible:true`). |
| BRD-21 | **CHƯA SỬA** | `:hover` không bọc trong `@media (hover:hover)` (`co-caro/index.html:87,96,98,124`, Vua, Tỷ Phú, `co-ca-ngua/hud.css:30–36`). Có vá riêng cho nút khoá (`co-caro/index.html:100`). |
| BRD-22 | **ĐÃ SỬA** | `co-caro/game.js:470` đã dùng `esc(p.name)`. |
| BRD-23 | **CHƯA SỬA** | `co-ty-phu/game.js:43–44`, `index.html:306`: loa vẫn là 🔊/🔇. |
| BRD-24 | **CHƯA SỬA** | Trang chủ: tên chủ phòng dùng `text-overflow:clip`, scrollWidth 153 > clientWidth 120. Emoji bị xén im lặng, không có "…" (`caro-C-home-list.png`). |

## 5. Lỗi mới

| ID | Mức | Ở đâu | Vấn đề | Cách sửa | Nghiệm thu | Công |
|---|---|---|---|---|---|---|
| BOARD2-01 | **P1** | Tỷ Phú online, phòng chờ và trong ván, ở 320/360 | Trang nở ra 379 px: `innerWidth` = 379 khi khung là 320/360. Phần tử tràn: `#mute` mép phải 379, `#quitBtn` 327, `.card`/`.lobbyBtns` 365. Trình duyệt thu nhỏ cả trang, nút loa và chữ "Rời" bị cắt (`typhu-probe-room-360.png`, `typhu-C-lobby.png`). Chơi solo ở cùng cỡ thì không tràn. | Thanh trên khi online: CHAT và Rời chỉ dùng icon (44×44), các nút `min-width:0`, `flex-wrap`. Thẻ phòng `max-width:100%`. | `scrollWidth == innerWidth == 320/360` ở phòng chờ và trong ván online. Nút loa nằm trong màn. | S |
| BOARD2-02 | P2 | Cá Ngựa online, nút "Về phòng" ở bảng kết quả và nút "Rời bàn" | `hud.js:96–98` gọi `cb.onLobby()`, rồi `game.js:206` gọi `net.leave()`, nên người chơi rời hẳn phòng và về màn nhập mã. Đúng ra phải về phòng chờ cùng nhóm. | Online: gửi lệnh về phòng chờ (như `lobby` của Tỷ Phú, `co-ty-phu/room.js:127`). Đổi nhãn cho đúng. Gộp BRD-15. | Bấm "Về phòng" thì cả nhóm vẫn ở phòng chờ, cùng mã, giữ đủ người. | M |
| BOARD2-03 | P2 | Cá Ngựa online, "Ván mới" | Server `co-ca-ngua/room.js:102–104`: bất kỳ ai gửi `again` là mở ván mới ngay cho cả phòng. Bảng kết quả của 2 người còn lại bị đóng ngang, không kịp Khoe. | Dùng `games-server/rematch.js` (bản đã làm cho BRD-09). | Một người bấm thì người khác thấy "k/3 muốn chơi tiếp · N giây" và bảng kết quả vẫn mở. | S–M |
| BOARD2-04 | P2 | Mọi game online, `games-server/*/ws.js:8` | Phát hiện mất kết nối dựa vào việc trình duyệt gửi khung đóng. Đo khi đóng tab: 0,4 / 2,1 / 5 / 11 / 12 s, và 2 lần quá 14 s chưa có nhãn (chủ phòng ở Caro và Vua). Nếu rớt im lặng (điện thoại khoá màn, mất sóng) thì `DEAD_MS=60000` nên 60–80 s sau mới có nhãn, cộng thêm 15 s nữa máy mới đi thay. | `DEAD_MS` 25–30 s, client ping 10 s. Client gửi `{t:"bye"}` lúc `pagehide`. | Đóng tab thì ≤ 3 s có nhãn. Tắt mạng thì ≤ 35 s có nhãn. | M |
| BOARD2-05 | P2 | Cá Ngựa, bảng kết quả ở 360×640 | Nút loa của HUD đè lên chữ "BẠN THẮNG!" (`cangua-solo-result-360x640.png`). Lỗi D4 đã ghi lại nhưng chưa sửa. | Ẩn HUD hoặc nâng `z-index` của bảng kết quả, thêm `padding-top`. | Không còn phần tử nào đè tiêu đề ở 320–412. | S |
| BOARD2-06 | P2 | Cá Ngựa, Tỷ Phú: link "← Trang chủ" | Chỉ cao 92×23 px. Tỷ Phú trong phòng chỉ còn dấu "←" rộng 13×23 px. 3 game kia đã đạt 44. | Dùng chung kiểu `.bar a{min-height:44px}` như Caro. | Đo `small44` ra rỗng ở 360/390. | S |
| BOARD2-07 | P2 | Caro 740×360 (cũng thấy ở 844×390) | Ô cờ 14 px (16 px ở 844), bàn 236 px trong khi nửa phải trống. Nút menu và loa rộng 28 px (`caro-solo-740x360.png`). | Bố cục 3 cột như Vua ngang. Bàn = min(100svh − thanh trên, 100vw − 2 cột). | Ô ≥ 20 px ở 740×360, mọi nút ≥ 44×44. | M |
| BOARD2-08 | P3 | Cá Ngựa 320 | Tên và dòng trạng thái bị "…" ("Lượt Ngọc Á…"). | Tên 2 dòng như Caro (`line-clamp:2`). | Đọc trọn tên 15 ký tự ở 320. | S |
| BOARD2-09 | P3 | 5 game, sau ván | Chủ dự án cho phép "Mời ra" sau ván, nhưng thẻ kết quả không có nút này (`kick_btn_after: 0`). Chỉ phòng chờ có. | Thêm nút trên thẻ kết quả hoặc danh sách người sau ván. | Chủ phòng mời ra được sau ván. | S |
| BOARD2-10 | P3 | `games-server/board-online-e2e.mjs` (Cờ Tướng) | Test chính thức trượt 2/2 lần ("A không thấy Đối thủ muốn chơi tiếp", rồi lần sau "cả hai bấm mà không mở ván ngay"). Kiểm tay thì luồng đúng, khả năng là do `tab.click` không kiểm `free` / timing. | Kiểm `free`, chờ `ovEnd` hết hoạt ảnh. | Chạy 3 lần liên tiếp đều ĐẠT. | S |
| BOARD2-11 | P3 | Tỷ Phú ở ≤360 | Ô đất trên bàn (chạm để xem thông tin) chỉ 21–27 × 29–38 px. Nút chọn số người 2/3/4 rộng 38×44. | Ô 44 ảo (vùng chạm lớn hơn) hoặc chạm vào nhóm ô. | Mục tiêu chạm ≥ 44 hoặc có vùng chạm ảo. | S |

Không có P0. Có 1 P1 mới (BOARD2-01) và 1 P1 cũ chưa sửa (BRD-06).

## 6. Top 3

**Thắng lớn nhất**
1. **Giữ ghế khi đóng tab (BRD-01).** Cả 5 game đều về đúng ghế sau 30–45 s, chủ phòng giữ quyền chủ phòng. Có nhãn và toast mất kết nối / quay lại / máy đi thay (BRD-10).
2. **Luồng online đủ và đúng V5.** Hộp xác nhận pixel thay `confirm()`. "Mời ra" kèm chặn 10 phút. Hủy phòng xong, nhập lại mã thì báo "Không tìm thấy phòng". "Ván tiếp" hai phía, thẻ kết quả vẫn mở để Khoe (BRD-09/11). Chat lọc tục và link, có "Tắt chat".
3. **Màn ngang và 320 đã chơi được** ở Cá Ngựa, Tỷ Phú và Vua (BRD-02/03/04/05).

**Còn lại lớn nhất**
1. **Tỷ Phú nặng 2,4 MB, tải xong sau 15–17 s** trên 3G (BRD-06), giống hệt bản đang chạy thật.
2. **Tỷ Phú online tràn ở 320/360** (BOARD2-01): trang nở ra 379 px, nút loa bị cắt.
3. **Cá Ngựa online còn 2 lỗi luồng:** "Về phòng" là rời hẳn phòng (BOARD2-02), "Ván mới" chỉ cần một người bấm (BOARD2-03). Kèm theo: phát hiện rớt mạng im lặng mất tới 60–80 s (BOARD2-04).
