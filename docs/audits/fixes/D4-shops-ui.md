# D4 · Game tiệm: khung UI pixel V5 + HUD Trà Sữa 1 hàng

Mục audit: **TLC1-04** (gộp TLC2-18) và **TLC1-03**. Nhánh `claude/d4-shops-ui` (tách từ master fd03559).
Quyết định chủ dự án 25/11/2026: khung UI Tập Làm Chủ theo **pixel V5 như Nông Trại** (góc bậc, bóng cứng).

## Cách làm khung V5 (cả 3 game)

1. Đổi máy trên khối `<style>` của `index.html` (script ngoài repo):
   - bỏ **mọi** `border-radius`: Trà Sữa 56, Bánh Mì 63, Cơm Tấm 46 chỗ, nay 0;
   - bóng có blur thành bóng cứng: blur 0, lệch tối đa 6 px, độ đậm ≥ .45;
   - quầng mờ `0 0 Npx` thành viền cứng 2 px;
   - px lẻ (1,5 px) thành px chẵn.
2. Biến dùng chung, khai trên `*` để `var(--b)` tính tại từng phần tử (xem "Bẫy" bên dưới):
   - `--px-border` (4 box-shadow lệch 3 px, góc khuyết) và `--px-border2` (2 px);
   - `--px-bevel` (vát sáng trên, tối dưới) và `--px-drop` (bóng cứng `3px 4px 0 0`).
3. Áp tay cho từng phần:

| Phần | Khung mới |
|---|---|
| thanh trên | nền đặc + gờ `inset 0 -3px #000` |
| nút thanh trên (`.tbtn`) | viền 2 px khuyết, bóng cứng, lún khi ấn |
| khung cảnh (`.world`) | viền 3 px tối + bóng `4px 6px` |
| bảng quầy (`.brew` / `.bench` / `.col`) | viền 3 px, vát, bóng cứng |
| phiếu khách (`.slip`) | viền 3 px; `.on` / `.hint` / `.pre` chỉ đổi màu viền (`--b`), không thêm vòng |
| phiếu đang làm, bếp, hộp (`.ticket`, `.kitchen`, `.box`, `.card`, `.minioven`…) | viền 2 px khuyết màu caramel / cream |
| ô nguyên liệu (`.opt`, `.lay`, `.billbtn`, `.gbtn2`, `.choice`, `.pcard`, `.stn`, `.tab`) | vát + viền 2 px + bóng cứng nhỏ; trạng thái đổi `--b`; nhấp nháy `steps()` |
| nút (`.btn` + primary / danger / warn / hint) | vát + viền 3 px (Cơm Tấm 2 px vì lưới chật) + bóng `3px 3px`; ấn: lún, mất bóng |
| ô HUD (`.chip`), viên Lò / Gas (`.pill`) | viền 2 px khuyết + bóng cứng; vòng giờ lò thành bát giác `clip-path` |
| hộp thoại (`.sheet`) | vát + viền 3 px + bóng `6px 8px` |
| thông báo (`.toast`, `.toast-act`, `.banner`, `.hintbar`) | viền khuyết + bóng cứng; hiện ra theo `steps(3)` |
| bong bóng thoại | viền 2 px mực + bóng cứng; đuôi cùng màu viền (Trà Sữa) |
| dock điện thoại (Bánh Mì, Cơm Tấm) | gờ `inset 0 3px #000` |

**Cơm Tấm:** khung do JS chèn (`ui/drama.js`, `ui/progress-ui.js`) được ghi đè `border-radius: 0 !important` ngay trong `index.html`. Vì thế không sửa hai module đó, cũng không phải đổi tag dây chuyền (book-tabs, column, overlays, game.js).

**Kích thước:** bố cục, cỡ chữ và vùng chạm giữ nguyên. Riêng `.tab` ba game tăng 40 lên **44 px**. Vùng cuộn phiếu (`.rail`) nới đệm 3 px để viền ngoài không bị cắt; Trà Sữa điện thoại bớt 1 px đệm phiếu để bù.

**Bẫy (đã ghi vào PLAYBOOK §2.1):** Nông Trại khai `--border: … var(--b, var(--line))` trên `:root`. Khi đó `var(--b)` bị tính một lần ở `:root`, nên `.btn { --b: #6d6150 }` không đổi được màu viền. Đo trên trang: `--b = #6d6150` nhưng viền vẫn `rgb(10, 8, 7)`. Game tiệm khai biến viền trên `*` để tránh lỗi này. Nông Trại chưa sửa vì ngoài phạm vi.

## TLC1-03 · HUD Trà Sữa

- `ui/screens.js` createHud:
  - mỗi ô có thêm nhãn ngắn `.lb`: Tiền / Ngày N / Danh tiếng / theo dõi (hoặc 4,7★) / Cấp / sắp hết;
  - số gọn: `shortMoney` (148k · 1,2tr · 12tr · 1,5 tỷ), `shortCount` (950 · 1,2k · 12k); ô Tiền có `title` ghi số đủ;
  - ô Cấp chỉ ghi số, chú thích màn rộng thành "cấp · 0/35 XP";
  - "Đóng cửa" rút thành "Đóng";
  - ô Kho gọn (điện thoại) = số món sắp hết + nhãn "sắp hết".
- `index.html` khối `@media (max-width: 760px), (max-height: 520px)`:
  - HUD `flex-wrap: nowrap`; ô là lưới icon 16 px + số 13 px, nhãn 9 px dưới;
  - ô co được (`min-width: 0`), nên không bao giờ xuống dòng;
  - áp cả cho điện thoại xoay ngang (trước đó 844×390 dùng HUD máy tính, 3 hàng);
  - thông báo dời xuống `top: 110px`, dưới HUD.
- `render/scene.js`: bong bóng gọi món và nhãn tên khách bị kẹp xuống dưới đáy HUD. Đáy HUD đọc một lần mỗi khung, chỉ khi có khách; chiều cao bong bóng đo một lần khi đổi câu.
- Bản lưu không đổi định dạng (chỉ đổi phần hiển thị).

Đo số hàng HUD trong ca, tiệm cuối game (cấp 20, 123.456k, 12.345 theo dõi, mọi món còn 2 phần ⇒ 6 ô):

| Khung | Trước | Sau |
|---|---|---|
| 390×844 ngày 1 | 1 hàng, chỉ icon + số ("35", "0" không nhãn) | 1 hàng, có nhãn |
| 390×844 cuối game | **2 hàng** | **1 hàng** (6 ô: 61, 58, 57, 49, 44, 46 px) |
| 360×640 cuối game | **2 hàng** | **1 hàng** (6 ô, tổng 334 / 334 px) |
| 844×390 | **3 hàng** (che nửa cảnh) | **1 hàng** |

## Tag `?v=` đã tăng

- `tiem-tra-sua/ui/screens.js` m39 → **m40** (trong game.js)
- `tiem-tra-sua/render/scene.js` m38 → **m40** (trong game.js)
- `tiem-tra-sua/game.js` m39 → **m40** (trong index.html)
- Bánh Mì, Cơm Tấm: chỉ sửa `index.html` (không cache theo tag), nên không cần tăng tag.

## Kiểm thử

- Unit (`node --test`):
  - Trà Sữa 183/183;
  - Bánh Mì 121/121;
  - Cơm Tấm 142 bài: lần 1 có 1 bài fail (máy bận), chạy lại 0 fail.
- E2E (Chrome headless, server riêng):
  - Trà Sữa **158/158**, gồm bố cục 7 khung × ngày 1 / cuối game: 0 lần tự cuộn, không tràn ngang, 0 lỗi console.
  - Bánh Mì **129/129**.
    - Hai lần đầu dừng ở `m5Flows` ("không thấy #introGo": bản lưu ngày 8 còn sau khi xoá localStorage).
    - Nguyên nhân: test xoá localStorage 300 ms sau khi điều hướng sang about:blank. Máy bận thì trang cũ chưa dỡ xong, pagehide của game ghi lại bản lưu sau lệnh xoá.
    - Sửa `test/e2e-m5.mjs`: chờ `location.href === "about:blank"` rồi mới xoá.
  - Cơm Tấm **199/199** (gồm bố cục 768×1024, 844×390, 740×360, 1024×768, 360, 320).
- `node tools/cache-tags/check-tags.mjs master`: OK, "3 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag" (file test không tính).
- Ảnh trước / sau 390×844, 844×390 (Trà Sữa thêm 360×640, cuối game) ở thư mục tạm ngoài repo, không commit.

## Còn lại / cần chủ dự án

- Bánh Mì xoay ngang 844×390 vẫn bị HUD 3 hàng và thông báo che cảnh. Lỗi này có từ trước, nằm ngoài TLC1-03 (mục đó chỉ nói Trà Sữa); nên áp cùng kiểu HUD 1 hàng ở đợt sau.
- `.btn.small` Bánh Mì 38 px và Cơm Tấm 36 px, nút thanh trên Cơm Tấm 32 px (TLC2-11): chưa đổi, vì sẽ đổi bố cục các bài e2e 0 cuộn.
- Nông Trại: biến `--border` khai trên `:root` làm `--b` vô tác dụng (xem "Bẫy"). Sửa là việc của game đó.
