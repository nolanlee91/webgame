# D11 — Mỗi lần bấm đúng MỘT tiếng (bỏ "tách" chồng tiếng game)

## Lỗi

Chủ dự án bấm tay thấy nhiều nút kêu 2 tiếng một lúc: tiếng "tách" chung của `prototype/games/_shared/feedback.js`
cộng tiếng riêng của game. Ví dụ Ô Ăn Quan "▶ Bắt đầu" = tách + `turn.mp3`; nút điều khiển trên màn Xếp Gạch = tách + `buoc-nhay.ogg`.

Lý do: `feedback.js` kêu "tách" ngay khi chuột nhấn xuống (chạm: khi nhấc tay), TRƯỚC khi handler của game chạy, nên không thể biết
game có tự phát tiếng cho lần bấm đó hay không.

### Danh sách "trước" (bản quét nháp của dev, trên master trước D11)

Khoảng 80 lần bấm kêu 2 tiếng ở 17 game (bản quét nháp chỉ bấm chuột, màn đầu + sau khi Chơi):

| Game | Nút kêu 2 tiếng (tách + tiếng game) |
|---|---|
| 2048 | Ván mới, ▶ Bắt đầu (`qua-man`), ☰ Menu (`buoc-nhay`) |
| Ai Là Nội Gián | Hủy phòng (oscillator 660/440 Hz) |
| Bắn Bóng | ⇄ Đổi viên |
| Cờ Caro | ▶ Bắt đầu |
| Đào Vàng | Tạm dừng |
| Đố Vui Nhanh | 5 chủ đề, 2 chế độ, ▶ Bắt đầu, 50:50, Tạm dừng, 4 ô đáp án A–D |
| Đua Xe | ▶ Lên đường (tiếng máy), ❚❚ |
| Ghép Kẹo | ✦ Gợi ý, ☰ Menu |
| Ma Sói | Hủy phòng |
| Nối Thú | ▶ Bắt đầu chơi, Gợi ý, Đảo, Tạm dừng |
| Nối Từ | ▶ Bắt đầu |
| Nông Trại | Xây, Sổ, Xem chi tiết nhiệm vụ, Bảng đơn, Hàng rào, các ô cỏ / ô đất |
| Ô Ăn Quan | ▶ Bắt đầu (`turn.mp3`) |
| Rắn Săn Mồi | 2 chế độ, ▶ Bắt đầu, Tạm dừng, ▲ ▼ |
| Sudoku | ☰, ✦ Gợi ý, 9 nút số |
| Xếp Gạch | ▶ Bắt đầu, Tạm dừng, Giữ, Xoay trái, Xoay, ◀ ▶, ⤓ Thả |

(Bản nháp `double-sound-sweep.draft.mjs` + `double-sound-before.txt` đã xoá; test thật thay thế ở dưới.)

## Cách sửa: một chỗ, trong `feedback.js` (không sửa từng game)

1. **Nghe tiếng của cả trang.** `feedback.js` bọc `AudioBufferSourceNode.prototype.start`, `OscillatorNode.prototype.start/stop`
   và `HTMLMediaElement.prototype.play` để ghi "lần cuối có tiếng khác tách".
   - Không tính tiếng của chính `feedback.js` (cờ `own` bật trong lúc `SOUNDS[name]()` chạy).
   - Không tính tiếng lặp (`.loop === true`: nhạc nền) và `<audio>` đang `muted`.
   - Oscillator chỉ tính khi có hẹn `stop()` (xét lúc quyết định, không phải lúc `start()`): tiếng máy Đua Xe chạy liên tục với gain 0
     nên không làm mất "tách" của nút.
   - "Vút" khi gửi chat cũng tính là tiếng khác ⇒ nút Gửi kêu "vút", không kêu thêm "tách" (trước đây kêu cả hai).
2. **Quyết định SAU KHI game xử lý lần bấm.** Bắt đầu bấm (chuột/chạm xuống, Enter/Space trên nút) chỉ ghi lại lần bấm.
   Ở sự kiện `click` (pha capture) đặt hẹn **40 ms**; hết hẹn: nếu từ lúc bắt đầu bấm game đã phát tiếng ⇒ im; chưa ⇒ "tách".
   - Dự phòng 80 ms sau khi nhấc tay / nhả phím cho phần tử làm việc ở pointerdown mà không có click (bị gỡ khỏi trang…).
   - Chạm giữ nguyên luật cũ: lướt > 10 px, trang cuộn, `pointercancel` ⇒ huỷ, không kêu — nhưng chỉ TRƯỚC khi nhấc tay. Nhấc tay rồi
     thì chốt (như bản cũ kêu ngay lúc nhấc tay): trang cuộn sau đó là do chính nút gây ra. Trường hợp thật: trang chủ "+ Tạo phòng mới"
     mở hộp thoại làm trang cuộn ⇒ nếu không chốt thì mất tiếng.
   - Enter: click đến ngay khi nhấn; Space: click đến lúc nhả phím (dự phòng tối đa 1,5 s khi còn giữ phím).
   - `wgp.muted` vẫn im (kiểm lúc phát). Hệ quả nhỏ: bấm nút 🔊 để TẮT tiếng giờ im luôn (trước kêu "tách" rồi mới tắt); bấm để BẬT thì kêu.
3. **Không đổi:** CSS lún nút, tiếng "vút" chat, `data-nosfx` / `data-nopress`, `clickName` + "bụp" trang chủ, `press-nav.js`
   (vẫn import `play`/`clickName` và kêu ngay khi nhấn thẻ game; tiếng đó đi qua `play()` nên mang cờ `own`, không bị tính là tiếng game).

### Độ trễ "tách" (chuột giờ kêu lúc nhả thay vì lúc nhấn)

Đo bằng `double-sound-e2e` (Chrome headless, máy dev, 113 lần bấm chuột kêu "tách", lần chạy cuối):

- Hẹn 40 ms trên trang rảnh thực tế ra **≈ 46 ms** (đo riêng `setTimeout(40)` trên trang chủ / 2048 / Nông Trại: 42–52 ms; Windows làm tròn đồng hồ).
- Tính từ lúc nhả chuột: **trung vị 61 ms**, lớn nhất 180 ms (các lần chạy trước: lớn nhất 228–382 ms). Phần vượt 46 ms là thời gian trang BẬN chạy chính handler của nút
  (dựng màn mới, vẽ lại) — hẹn giờ nào cũng phải chờ việc đó xong; chính phản hồi trên màn hình cũng trễ y như vậy. Headless vẽ bằng
  phần mềm nên chậm hơn máy thật.
- Bản cũ: "tách" kêu lúc nhấn xuống, sớm hơn lúc nhả ≈ 72 ms (chuột test giữ 60 ms).
- Tiếng game so với sự kiện click: trung vị 2 ms, lớn nhất 60 ms. Con số này GỒM thời gian handler của game chạy trước khi gọi tiếng
  (vd. 2048 "Ván mới" dựng lại bàn rồi mới phát `qua-man`, 54 ms): tiếng phát đồng bộ trong handler luôn được thấy, dù handler chạy
  lâu bao nhiêu, vì hẹn giờ không thể chạy chen giữa. Tiếng thực sự KHÔNG đồng bộ chỉ có ở Trà Sữa (chờ tải/giải mã file, xem dưới) —
  đã báo trước bằng `wgp:sfx`. Cửa sổ 40 ms là dự phòng cho game làm tiếng sau một promise ngắn; hạ thấp hơn (vd. 25 ms) nhanh hơn
  nhưng sát mép.

## Ngoại lệ từng game

- **Tiệm Trà Sữa** (`ui/sfx.js`): `play()` chỉ `start()` sau khi `fetch` + `decodeAudioData` xong. Tiếng đã giải mã thì trễ vài ms,
  nhưng tiếng chưa có trong `WARM` (vd. `open`, `stock`) lần đầu trễ theo mạng — trên mạng điện thoại dễ quá 40 ms ⇒ lại kêu 2 tiếng.
  Thay vì `data-nosfx` (sẽ làm mất "tách" của các nút Trà Sữa không có tiếng riêng), `play()` báo trước bằng
  `dispatchEvent(new Event("wgp:sfx"))` ngay lúc nhận lệnh; `feedback.js` nghe sự kiện này như một tiếng game. Đây là API chung: game nào
  phát tiếng không đồng bộ cũng dùng được (đã ghi trong chú thích `feedback.js`). Thẻ: `ui/sfx.js?v=d11`, `game.js?v=d11`;
  `tiem-tra-sua/test/e2e.mjs` import `sfx.js?v=d11` cho trùng bản module.
- Không game nào cần `data-nosfx` mới. Thám Tử vẫn tắt tiếng chung bằng `data-nosfx` trên body như cũ; Quán Cơm Tấm, Tiệm Bánh Mì
  không nạp `feedback.js`.
- Đua Xe "▶ Lên đường": tiếng máy (oscillator chạy liên tục, không hẹn `stop()`) không còn tính là tiếng game ⇒ nút kêu "tách".

## Test

### `prototype/games/_shared/test/double-sound-e2e.mjs` (mới)

- Mọi trang `prototype/games/*/index.html` + trang chủ; bấm THẬT bằng chuột (1366×768) và chạm (`Input.dispatchTouchEvent`, 390×844 có
  giả lập cảm ứng); ở màn đầu và sau khi bấm Chơi. Đào Vàng / 2048 / Rắn thêm màn hết ván (nút ⚔ Thách bạn) và bảng chia sẻ
  "Thách bạn" của `challenge.js` (Đợt 10). Trang chủ thêm thẻ game (press-nav.js) bằng chuột + chạm ⇒ đúng 1 "bụp".
- Nhận "tách"/"bụp" qua tần số đầu (`setValueAtTime`) của oscillator; tiếng game = buffer / `<audio>` không lặp, oscillator có `stop()`.
- LỖI khi một lần bấm có ≥ 2 tiếng; cũng LỖI khi không tới được màn cần kiểm (để test không âm thầm bỏ sót).
- `--baseline`: thay `feedback.js` bằng bản trên `master` (chặn bằng CDP Fetch) — tự kiểm test bắt được lỗi cũ.
- Mỗi lần tải trang xoá localStorage của hồ sơ test (trạng thái mới, không mang chế độ / bản lưu / khoá tắt tiếng của lần bấm trước).
- Server thật ở cổng 8921–8929; Chrome qua `launchChrome()` (hồ sơ `tempProfile`/`guardChrome`); `--shots` chụp ảnh lỗi vào `shotDir("double-sound")`.

#### Tự kiểm test bắt được lỗi (code đã gộp master D10)

| | `--baseline` (feedback.js của master) | Bản sửa D11 |
|---|---|---|
| Trang | 26 (25 game + trang chủ) | 26 |
| Lần bấm | 600 | 599 |
| Chỉ "tách" | 290 | 222 |
| Chỉ tiếng game | 65 | 212 |
| Im | 97 | 165 |
| **Kêu 2 tiếng** | **148 (16 game)** | **0** |
| Thẻ game trang chủ (press-nav) | 1 "bụp" chuột + chạm | 1 "bụp" chuột + chạm |

Baseline báo đúng `FAIL /games/o-an-quan/ [game/chuột] #startBtn ▶ Bắt đầu :: tách×1 + game=turn.mp3` (và bản chạm). 148 lần bấm kêu 2 tiếng:

| Game | Số lần | Nút |
|---|---|---|
| Đố Vui Nhanh | 28 | 5 chủ đề, 2 chế độ, ▶ Bắt đầu, 50:50, Tạm dừng, ô đáp án |
| Sudoku | 28 | Đề mới, ☰, ☰ Menu, ▶ Bắt đầu, ✦ Gợi ý, nút số |
| 2048 | 20 | Ván mới, ▶ Bắt đầu, ☰ Menu; màn hết ván: Hoàn tác, Ván mới, Menu, ▶ Chơi lại, Về menu |
| Rắn Săn Mồi | 16 | 2 chế độ, ▶ Bắt đầu, Tạm dừng, 4 nút hướng; hết ván: ▶ Chơi lại, Về menu |
| Trà Sữa | 12 | Nhận tiệm, Mở quán, các nút nhập hàng (+10 · 20k…), Mua 40k |
| Xếp Gạch | 10 | ▶ Bắt đầu, Tạm dừng, Giữ, Xoay trái, Xoay, ◀ ▶, ⤓ Thả |
| Nối Thú | 8 | ▶ Bắt đầu chơi, Gợi ý, Đảo, Tạm dừng |
| Ghép Kẹo | 6 | ▶ Chơi màn 1, ✦ Gợi ý, ☰ Menu |
| Bắn Bóng, Đào Vàng | 4 mỗi game | ▶ Chơi màn 1, ⇄ Đổi viên / Tạm dừng (cả màn hết ván) |
| Ai Là Nội Gián, Đặt Bom, Ma Sói | 2 mỗi game | Hủy phòng |
| Cờ Caro, Ô Ăn Quan | 2 mỗi game | ▶ Bắt đầu |
| Đua Xe | 2 | ❚❚ |

"Im" tăng vì: (1) các nút trước kêu 2 tiếng giờ chỉ còn tiếng game; (2) nút 🔊 khi TẮT tiếng giờ im (quyết định lúc nhả, lúc đó đã tắt).
So từng nút giữa hai lần chạy: KHÔNG có nút nào (ngoài nút tắt tiếng) trước kêu mà nay im. Nút "Thách bạn" (màn hết ván Đào Vàng /
2048 / Rắn) và các nút trong bảng chia sẻ "Thách bạn" (×, Chia sẻ…, Chép link, Facebook, Zalo) đều kêu đúng 1 "tách" ở cả hai bản.

Thời gian chạy toàn bộ ≈ 40–45 phút (chuột và chạm song song, mỗi tab một hồ sơ trình duyệt). Lọc nhanh: `… double-sound-e2e.mjs 2048,xep-gach`.

#### Các bộ test khác (trên code đã gộp master)

| Bộ | Kết quả |
|---|---|
| `sound-press-e2e.mjs` (mọi game còn tiếng, M / wgp.muted im, nút lún) | 246 PASS, 0 FAIL — không phải sửa (các chỗ chờ đều ≥ 150 ms) |
| `home-d3-e2e.mjs` | TẤT CẢ ĐẠT |
| `home-d5-e2e.mjs` | TẤT CẢ ĐẠT |
| `touch-scroll-e2e.mjs` (lướt không kêu, chạm thật kêu, chuột kêu ngay trên thẻ game) | 26 đạt, 0 lỗi |
| Ô Ăn Quan `screenshots/e2e.mjs` | 4 PASS rồi FAIL "Tạo phòng online khi chưa nhập tên → báo nhập tên" và dừng (`không thấy #createBtn`). Y hệt trên master (đã chạy master ở worktree tạm) — lỗi có sẵn, không do D11; các bước sau của bộ này không chạy được ở cả hai bản. |
| Trà Sữa `test/e2e.mjs` (có kiểm tắt tiếng qua `import(sfx.js?v=d11)`) | 180/180 PASS |

## Thẻ cache

- `feedback.js` → `?v=f4` ở MỌI nơi: trang chủ `index.html`, `bang-xep-hang.html`, `play.html`, import trong `press-nav.js` (phải trùng thẻ
  trong HTML, khác là 2 bản module ⇒ kêu 2 lần), Thám Tử (`t11` → `f4`, cả `modulepreload`), và 22 game trước đây nạp
  `../_shared/feedback.js` KHÔNG có `?v=` (giờ có `?v=f4` để người chơi đang giữ bản cũ trong cache cũng nhận bản sửa).
- `press-nav.js` → `?v=d11a` (trang chủ + bảng xếp hạng).
- Đã gộp `master` (D10, `fdc6589`): giữ thẻ mới của master (`game.js?v=d10`, `app.js?v=d10`, `stats.js?v=st1`…), chỉ đổi thẻ feedback/press-nav.
- `node tools/cache-tags/check-tags.mjs master` ⇒ OK.

## Cần chủ dự án quyết

1. **Độ trễ "tách" khi bấm chuột** (giờ kêu ≈ 46 ms sau khi nhả trên trang rảnh, thay vì lúc nhấn):
   - A. Giữ cửa sổ 40 ms (đề xuất: an toàn, đo được tiếng game trễ nhất ≈ 15 ms ngoài Trà Sữa).
   - B. Hạ xuống 25 ms: nhanh hơn ≈ 15 ms, sát mép với game chậm trên điện thoại yếu.
   - C. Chuột kêu lúc nhấn như cũ (chấp nhận 2 tiếng khi bấm chuột trên máy tính), chỉ chạm/bàn phím mới chờ.
2. **Nút 🔊 khi bấm để tắt tiếng** giờ im (bật lại thì kêu):
   - A. Giữ như vậy (đề xuất: đã tắt thì im là hợp lý).
   - B. Muốn nút tắt tiếng vẫn "tách" một cái trước khi tắt (phải làm ngoại lệ riêng).
3. **Bộ e2e Ô Ăn Quan dừng ở bước "báo nhập tên"** (lỗi có sẵn trên master) nên các bước sau không được chạy:
   - A. Giao một đợt sửa test/game Ô Ăn Quan riêng.
   - B. Để nguyên.
