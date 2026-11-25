# D5 · Nút ≥ 44 px khi xoay ngang, ghim "Bắt đầu" ở Đặt Bom, viền Nông Trại, sửa 2 e2e cũ

Nhánh `claude/d5-small` (tách từ master). Phạm vi: `2048`, `sudoku`, `noi-tu`, `dat-bom`, `nong-trai`, cùng 2 file test
`games-server/dat-bom/test/browser-e2e.mjs` và `prototype/games/_shared/test/chat-off-e2e.mjs`. Không sửa `_shared/*` code, trang chủ, game tiệm, Thám Tử.

## 1. Nút ≥ 44 px khi xoay ngang (844×390, 740×360)

Đo bằng Chrome headless, chạm giả lập, sau khi vào ván. "Trước" lấy từ D4.

| Game | Phần tử | Trước | Sau | Cách sửa |
|---|---|---|---|---|
| 2048 | Hoàn tác / Ván mới / Menu / Âm thanh (cột trái) | ×38 | ×44 | `.acts .btn` 38 → 44 trong luật xoay ngang |
| 2048 740×360 | cả cột trái | dùng nhầm bố cục dọc: 3 nút một hàng, "Menu" bị bàn chơi che mất một nửa, loa `.mini` 36×70 | 2 cột nút như 844×390 | khung ≤ 760 px cũng dính luật "cầm dọc" ⇒ luật ngang trả lại: `.wrap max-width: none`, `.stats` xếp hàng, ẩn `.mini` / `.hint`, `.acts` 2 cột, hiện lại nút loa trong cột |
| Sudoku | Đề mới / Menu / Âm thanh (cột trái) | ×36 | ×44 | `.acts .btn` 36 → 44 |
| Sudoku | Hoàn tác / Xóa / Ghi chú / Gợi ý (cột phải) | ×36 | ×44 | `.tools .btn` 36 → 44, xếp ngang |
| Sudoku 740×360 | cột trái | dùng `.mini` (☰ + loa), ô "Mức Vừa" bị cắt | như 844×390 | như 2048: ẩn `.mini`, hiện `.acts`, hiện lại "Gợi ý còn" |
| Sudoku ≤ 640 px ngang (568×320, 640×360) | cả trang | tràn ngang 602 px (có từ trước) | không tràn | luật thêm: cột trái 168 px, cột phải 156 px, nút công cụ cho xuống dòng |
| Nối Từ | ☰ / loa / chat | 40×40 | 48×44 | luật mới `(max-height: 560px) and (min-aspect-ratio: 4/3)` (chỉ xoay ngang thật, không đụng màn dọc khi mở bàn phím ảo) |
| Đặt Bom | nút loa thanh trên | 44×32 | vùng chạm 44×44 | `::after` cao 44 px tính từ mép trên màn; nút vẫn vẽ cao 32, thanh vẫn cao 38 (bản đồ tính theo khung) |
| 2048, Sudoku, Nối Từ, Đặt Bom | "← Trang chủ" / "← Lụm Kèo" | hộp 44 px nhưng thò lên trên mép màn 7–8 px ⇒ chạm được 36–38 px | chạm được 44 px (y 0–43) | bỏ `margin-block` âm, thêm `::after` 44 px bắt đầu từ mép trên màn, `z-index` để nổi trên khung bên dưới |

Đo lại sau sửa: 844×390, 740×360, 667×375, 568×320 không còn nút nào < 44 px (kiểm `elementFromPoint` theo từng px cho link và loa),
không tràn ngang, không có nút bị che. Bàn 2048 / Sudoku không phải thu nhỏ ở 844×390 và 740×360: cột trái vẫn còn chỗ.
Màn dọc không đổi vì mọi thay đổi nằm trong luật xoay ngang (`min-aspect-ratio: 1/1` hoặc `4/3`). Kiểm 390×844 và 360×740: kết quả đo như trước khi sửa.

## 2. Đặt Bom: ghim "Bắt đầu" xuống đáy màn

Trước: trên điện thoại dọc, khung phòng chờ nằm trong bản đồ (cao 250–300 px), nội dung cao 405 px ⇒ chủ phòng phải cuộn trong khung mới thấy "Bắt đầu".
Lỗi này có ở mọi máy dọc (360×740, 375×667, 390×844, 412×915), không riêng máy nhỏ.

Sau:
- `index.html` bọc Bắt đầu, dòng ghi chú và Hủy phòng trong `<div class="wait__foot">`. `app.js` không đổi vì nó tìm theo id.
- `@media (max-width: 640px) and (orientation: portrait)`: nếu phòng chờ đang mở **và** nút Bắt đầu đang hiện (tức mình là chủ phòng), cụm này thành dải `position: fixed` ở đáy màn:
  - Đệm đáy `calc(10px + env(safe-area-inset-bottom))`, hai bên chừa safe-area.
  - Ghi chú nằm trên, Bắt đầu và Hủy phòng cùng một hàng bên dưới.
- Phần cài đặt (mã, Chép link mời, Phòng công khai, Tắt chat) cuộn trong khung phía trên. Ở 360×740 không còn phải cuộn, ở 320×568 thì cuộn.
- Không che nội dung: `.game` được đệm đáy `112px + safe-area` trong lúc dải hiện ⇒ cuộn xuống cuối vẫn thấy hết danh sách người chơi và ô chat.
  Dải nằm dưới khung phòng chờ nên không đè lên khung.
- Người không phải chủ phòng chỉ thấy dòng "Chờ chủ phòng bắt đầu", vẫn nằm trong khung như cũ.
- Đang gõ chat (`#chatInp:focus`) thì ẩn dải, để nó không đè ô nhập ngay trên bàn phím ảo.
- Mọi luật đều dùng `:has()`. Trình duyệt cũ không hỗ trợ thì bỏ qua cả luật và giữ bố cục cũ.
- Màn rộng và xoay ngang không đổi.

## 3. Nông Trại: viền theo `--b` của từng phần tử

Nguyên nhân: `--border` khai trên `:root` ⇒ `var(--b, var(--line))` được tính một lần ở gốc (nơi không có `--b`), nên mọi phần tử nhận cùng một viền `#0a0807`.

Sửa (CSS nội tuyến trong `index.html`, không đụng module nào ⇒ tag vẫn `m12`, `m5.test` vẫn đạt):
```css
*, ::before, ::after { --b: initial; --border: 0 -3px 0 0 var(--b, var(--line)), …; }
```
- `--border` giờ được tính trên từng phần tử, theo `--b` của chính phần tử đó.
- `--b: initial` (độ ưu tiên 0, mọi luật class đè được) để `--b` không truyền từ cha xuống con. Phần tử không tự đặt `--b` vẫn viền `--line` như trước.

Kiểm bằng cách so `box-shadow` của mọi phần tử trước và sau (1366×768 và 390×844, màn đầu, sau khi đóng hộp, chế độ Xây). Chỉ những phần tử có đặt `--b` đổi màu, và đều đúng ý trong CSS:

| Phần tử | Viền trước → sau |
|---|---|
| `.btn` (loa, ?, Sổ, Xây, khoá Chăn nuôi, Phía Đông) | #0a0807 → #6d6150 |
| `.btn--teal` (Thu hết) / `.btn--primary` (Xong, Chơi) | → #17521c / #5a3a08 |
| `.btn--build` khi bật | → vàng #ffc94a |
| hạt giống đang chọn / hạt thường / hạt khoá | → vàng / #4a3f33 / #4a3f33 (trước đây hạt đang chọn không có viền nổi) |
| khay hạt `.seeds`, `.quest`, `.farm`, `.build-bar`, `.toast` | → #251a13 / #5b4a2d / #3a2716 / #5a3a08 / #5a3a08 |
| ô ruộng `.plot` | → nâu đất #3f2716 (viền ruộng chìm hơn, hợp với đất; ô được chọn vẫn viền vàng như cũ) |

Không có phần tử nào ngoài danh sách bị đổi. Đã xem ảnh so sánh: không lệch bố cục.

## 4. Hai e2e cũ

- **`dat-bom/test/browser-e2e.mjs`**: tên khách giờ tự sinh nên bỏ bước "không nhập tên ⇒ nhắc". Thay bằng các bước kiểm theo luồng mới:
  - ô tên điền sẵn tên tự sinh, không rỗng, ≤ 16 ký tự;
  - ô tên có `maxlength=16`, nên không gõ được tên quá dài;
  - xoá trắng tên ("   ") rồi bấm Tạo phòng ⇒ hiện nhắc nhập tên, không tạo phòng, con trỏ về ô tên.
- **`_shared/test/chat-off-e2e.mjs`**:
  - Chờ ô tên **hiện và đã có tên sẵn** (`nameReady`). B vào phòng bằng tên tự sinh, không gõ tên, đúng luồng người mới. A vẫn đặt tên riêng.
  - Thêm bước kiểm trước: máy chủ ở `BASE` phải trả về trang của từng game. Sai cổng hoặc chạy nhầm bản cũ thì báo ngay và thoát mã 2, không chờ hết giờ từng ô.
  - Phần kiểm "Tắt chat" giữ nguyên.
  - Ghi chú: lỗi 0/20 ghi trong D4 **không lặp lại được**, kể cả khi chạy đúng bản D4 (ca61155) ở cổng riêng: Nội Gián đạt 25/25. Bản master chưa sửa cũng đạt 250/0.
    Khả năng cao lần chạy D4 trỏ vào một máy chủ khác ở cổng mặc định 8922. Bước kiểm trước nói trên là để bắt đúng trường hợp này.

## Tag đã tăng

| File | Cũ → mới | Tham chiếu |
|---|---|---|
| `dat-bom/style.css` | d4p1 → d5s1 | `dat-bom/index.html` |

`index.html` của 2048 / Sudoku / Nối Từ / Nông Trại / Đặt Bom chỉ sửa CSS nội tuyến hoặc HTML, không có `?v=`. Nông Trại không sửa module nào ⇒ tag vẫn `m12`.

## Kiểm thử

- Unit:
  - 2048: 13/13. Sudoku: 15/15. `noi-tu/test`: 62/62.
  - Nông Trại: 175/175, gồm `m5.test` (tag module vẫn m12).
  - games-server: dat-bom 21/21, noi-tu 14/14.
- e2e:
  - `dat-bom/test/browser-e2e.mjs`: **Tất cả đạt** (gồm 4 bước tên mới).
  - `chat-off-e2e.mjs`, đủ 10 game: lần đầu 249/1. Mục lỗi là Cờ Tướng 1366 "B thấy tin của A", chập chờn: lúc chạy máy đang bận đo song song, và game này ngoài phạm vi.
    Chạy lại `co-tuong,ai-la-noi-gian`: lần một 49/1 (lỗi khác), lần hai 50/0. Lần chạy đủ 10 game trước khi sửa test cũng đạt 250/0.
  - Nối Từ: offline 80/80, online xong không lỗi.
  - Nông Trại: `e2e.mjs` 171/171, `e2e-cards.mjs` 44/44, `e2e-m4.mjs` đạt hết.
- So ảnh màn dọc trước và sau (390×844, 360×740, màn đầu 2048 / Sudoku / Nối Từ): chỉ khác tên khách tự sinh và ảnh nền ngẫu nhiên, bố cục y hệt.
- `node tools/cache-tags/check-tags.mjs master`: xem cuối file.

## Câu hỏi mở

1. 2048 (và có thể các game V5 khác chép cùng khối `:root`) cũng khai `--border` trên `:root` y như Nông Trại ⇒ `--b` của `.btn` / `.mode.on` không ăn,
   nên viền chọn chế độ (`.mode.on` viền xanh) không hiện. Ngoài phạm vi lần này. Có muốn sửa cùng cách cho các game đó không?
2. Đặt Bom xoay ngang: phòng chờ trong bản đồ cũng thấp, nhưng chưa ghim (đề bài chỉ nói điện thoại dọc). Bản đồ ở đó chiếm gần hết chiều cao, ghim thêm dải đáy sẽ che D-pad.
3. Dải "Bắt đầu" ở Đặt Bom áp cho mọi điện thoại dọc ≤ 640 px (390×844 và 412×915 cũng phải cuộn mới thấy nút), không chỉ máy ≤ 360×740.
