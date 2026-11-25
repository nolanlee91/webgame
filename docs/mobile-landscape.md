# Quy ước màn thấp / điện thoại xoay ngang

Áp dụng cho mọi game trong `prototype/games/`. Rút ra từ đợt sửa D2 (BRD-02..05, BRD-13, PTY-04/05, QCK-02).
Mục tiêu: **đang chơi thì không phải cuộn**, nút chính (Gieo, Bắt đầu, D-pad, BOM…) luôn nằm trong khung và không bị che.

## 1. Breakpoint

| Trường hợp | Media query | Ví dụ khung |
|---|---|---|
| Điện thoại xoay ngang | `@media (orientation: landscape) and (max-height: 500px)` | 844×390, 568×320, 740×360 |
| Lớp phủ / menu dài hơn khung | `@media (max-height: 860px)` + `position: sticky` (chỉ "dính" khi thật sự tràn) | laptop 1366×768, điện thoại dọc |
| Điện thoại dọc hẹp | giữ breakpoint riêng của game (`max-width: 760/860/980px`) | 320–430 px |

Game nào đã có query riêng gần tương đương (Cờ Vua / Cờ Tướng: `(max-height: 520–560px) and (min-aspect-ratio: 1/1)`) thì giữ, khỏi đổi.
Khối landscape đặt **cuối** stylesheet để thắng các khối `max-width` (568×320 khớp cả hai).

## 2. Bố cục khi xoay ngang

- Thanh đầu trang gọn: padding 3–4 px, chữ 14–15 px (≈ 30–34 px cao), ẩn dòng tag phụ.
- Bàn ở giữa, **thẻ người chơi sang hai bên** như bố cục máy tính (Cá Ngựa, Tỷ Phú) hoặc thẻ cột trái + nút cột phải (Cờ Vua, Cờ Tướng).
- Cột hai bên ≥ 140–150 px; thẻ tên `min-width: 0` + `text-overflow: ellipsis`, cột lưới dùng `minmax(0, 1fr)` để không đẩy bàn tràn ngang.
- Lề trái/phải cộng `env(safe-area-inset-left/right)` (tai thỏ khi xoay ngang).
- Điều khiển cảm ứng (D-pad / BOM) `position: fixed` ở hai dải trống hai bên bàn, `pointer-events: none` cho khung chứa và `auto` cho nút, nút ≥ 44×44 px, chừa `env(safe-area-inset-bottom)`.

## 3. Công thức cạnh bàn

```
cạnh = min( bề rộng còn lại , 100svh − phần cố định )
```

- Xoay ngang: `width: min(calc(100svh − <thanh trên + lề> − env(safe-area-inset-top) − env(safe-area-inset-bottom)), calc(100vw − 2 × <cột bên> − <khoảng cách>))`.
  Ví dụ Cá Ngựa: `min(calc(100svh − 44px − …), calc(100vw − 2*150px − 2*14px − 2*lề))` ⇒ 844×390: bàn 346 px (trước 812).
- Dọc: cộng cả các hàng thẻ trên/dưới bàn vào phần cố định, có sàn tối thiểu:
  `width: min(100%, max(272px, calc(100svh − 310px)))` (Cá Ngựa), `min(100vw − 16px, 640px, max(260px, 100svh − 280px))` (Tỷ Phú).
- Bàn vẽ trên canvas tự co theo khung (Cờ Vua, Ô Ăn Quan) thì chỉ cần cho khung đúng cỡ, canvas tự canh giữa.
- Dùng `svh`/`dvh`, không dùng `vh` (thanh địa chỉ di động).

## 4. Thu gọn gì

- Ẩn: dòng tag "bản chơi thử", phím tắt bàn phím (`.keys`) trên máy chạm, ảnh đại diện trong thẻ ở ≤ 360 px.
- Gợi ý nổi (toast/tip) **không đặt đè lên bàn**: chuyển ra cột bên / dải trống dưới bàn, chỉ hiện vài lần đầu (Cờ Tướng: 3 lần, nhớ ở `localStorage`).
- Cột chat / danh sách người chơi xuống dưới hoặc thành bảng trượt; khi ván bắt đầu thì cuộn về đầu (`scrollTo(0,0)`) để bàn + điều khiển nằm trong màn.

## 5. Nút chính luôn thấy

- Menu / phòng chờ trong lớp phủ cuộn được: hàng nút chính `position: sticky; bottom: −<lề lớp phủ>` có nền panel + viền trên 3 px.
  Dùng chung: `prototype/games/_shared/short-screen.css` — gắn class `ss-cta` vào hàng nút, `ss-ov` vào lớp phủ
  (xoay ngang: lớp phủ thành `position: fixed` phủ cả khung dưới thanh đầu trang, biến `--ss-bar-h`). Đang dùng: Rắn Săn Mồi, Xếp Gạch, Bắn Bóng.
- Phòng chờ nằm cạnh bàn (Cá Ngựa): nút CHƠI sticky đáy cột phòng chờ; bấm CHƠI ⇒ cuộn về bàn.
- Vào ván: bỏ focus ô nhập (chat) để phím mũi tên / Space về game; Esc rời ô chat; chỉ nhường phím khi ô **gõ chữ** đang focus (không tính checkbox).

## 6. Kiểm tra trước khi giao

Chrome headless (`prototype/games/_shared/test/cdp.mjs`) ở 320×568, 360×800, 390×844 (chạm), 844×390 (chạm), 568×320, 768×1024, 1366×768:
không tràn ngang (`scrollWidth ≤ innerWidth`), nút chính nằm trọn trong khung và `elementFromPoint` ở tâm nút trả về chính nút, tên người chơi đọc được, không lỗi console.
