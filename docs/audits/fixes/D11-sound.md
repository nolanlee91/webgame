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
   - Chạm giữ nguyên luật cũ: lướt > 10 px, trang cuộn, `pointercancel` ⇒ huỷ, không kêu.
   - Enter: click đến ngay khi nhấn; Space: click đến lúc nhả phím (dự phòng tối đa 1,5 s khi còn giữ phím).
   - `wgp.muted` vẫn im (kiểm lúc phát). Hệ quả nhỏ: bấm nút 🔊 để TẮT tiếng giờ im luôn (trước kêu "tách" rồi mới tắt); bấm để BẬT thì kêu.
3. **Không đổi:** CSS lún nút, tiếng "vút" chat, `data-nosfx` / `data-nopress`, `clickName` + "bụp" trang chủ, `press-nav.js`
   (vẫn import `play`/`clickName` và kêu ngay khi nhấn thẻ game; tiếng đó đi qua `play()` nên mang cờ `own`, không bị tính là tiếng game).

### Độ trễ "tách" (chuột giờ kêu lúc nhả thay vì lúc nhấn)

ĐO_DO_TRE

## Ngoại lệ từng game

Không cần `data-nosfx` riêng cho game nào: mọi tiếng game đo được đều bắt đầu trong vòng NGOAI_LE.
(Thám Tử vẫn tắt tiếng chung bằng `data-nosfx` trên body như cũ; Quán Cơm Tấm, Tiệm Bánh Mì không nạp `feedback.js`.)

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

KET_QUA_TEST

## Thẻ cache

- `feedback.js` → `?v=f4` ở MỌI nơi: trang chủ `index.html`, `bang-xep-hang.html`, `play.html`, import trong `press-nav.js` (phải trùng thẻ
  trong HTML, khác là 2 bản module ⇒ kêu 2 lần), Thám Tử (`t11` → `f4`, cả `modulepreload`), và 22 game trước đây nạp
  `../_shared/feedback.js` KHÔNG có `?v=` (giờ có `?v=f4` để người chơi đang giữ bản cũ trong cache cũng nhận bản sửa).
- `press-nav.js` → `?v=d11a` (trang chủ + bảng xếp hạng).
- Đã gộp `master` (D10, `fdc6589`): giữ thẻ mới của master (`game.js?v=d10`, `app.js?v=d10`, `stats.js?v=st1`…), chỉ đổi thẻ feedback/press-nav.
- `node tools/cache-tags/check-tags.mjs master` ⇒ OK.

## Cần chủ dự án quyết

QUYET_DINH
