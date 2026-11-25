# D2 — Màn ngang / khung thấp (9 game bàn cờ + game nhanh)

Nhánh `claude/d2-landscape`. Quy ước chung rút ra: `docs/mobile-landscape.md` (PLAYBOOK §2 trỏ tới).
Đo bằng Chrome headless (`_shared/test/cdp.mjs`), server riêng `PORT=8951 node server.js`. "chạm" = giả lập touch.

## Từng lỗi: thay đổi + số đo trước → sau

| Mã | Game | Thay đổi | Trước | Sau |
|---|---|---|---|---|
| BRD-02 | Cá Ngựa | `hud.js` `showBoard()`: rời phòng chờ ⇒ cuộn về đầu trang (vừa màn) hoặc mép trên bàn chơi; phòng chờ hẹp/thấp (`max-width:980px` hoặc `max-height:860px`): nút CHƠI `sticky` đáy (1366×768 trước y 766–818 dưới mép ⇒ sau y 708–760) | online 390×844: bấm Chơi ở scrollY 318 → vẫn 318, khay xúc xắc y = −218 | scrollY 0, khay của chủ phòng y 105–168, bàn 222–596 (đủ trong 844); 844×390: khay 101–151; 320×568: khay 60–123 |
| BRD-03 | Cá Ngựa | `hud.css`: dọc `cạnh = min(100%, max(272px, 100svh − 310px))`, cột `minmax(0,1fr)`, ≤360 bỏ avatar; ngang (≤500 cao) `.cn-arena/.cn-top {display:contents}` ⇒ lưới 3 cột "status·board·tools / s0·board·s3 / s1·board·s2"; thanh đầu trang gọn (`index.html`) | 844×390 bàn 812×812, trang 1433; 320: bàn 381 px, lệch trái −31 px, thẻ cắt; phòng chờ 320 tràn ngang | 844×390 bàn 346×346 (y 37–383), trang vừa 390 (+phần hướng dẫn dưới); 568×320 bàn 216; 320 bàn 272, x 24–296, không tràn |
| BRD-04 | Tỷ Phú | `index.html`: ngang ≤500 bố cục 2 cột như 1366 (`--size: min(100svh−50px, 100vw−2·140px−36px)`); dọc thêm trần `100svh−280px`; nút Bắt đầu/Quay lại sảnh `sticky` đáy lớp phủ; `.pick` `minmax(0,1fr)` | 844×390 bàn 640×640, Gieo y = 603, trang 873; 568×320 Gieo y 553; sảnh 1366×768 Bắt đầu y 875 (dưới mép); 320 sảnh tràn 17 px | 844×390 bàn 340, Gieo y 241–285, trang 390; 568×320 bàn 252, Gieo y 185; sảnh 1366 Bắt đầu y 714–766, 390×844 y 790; 320 không tràn |
| BRD-05 | Cờ Vua | `index.html` khối cuối `(max-height:520px) and (min-aspect-ratio:1/1)`: lưới "hud·stage·tools", thẻ 2 người xếp dọc cột trái, nút xếp dọc cột phải, `.stage` = min(100svh−44px, 100vw−310px) | 844×390 tên "Bạn" rộng 7 px (cắt còn chữ cái), thẻ 95 px | thẻ 221 px, tên rộng 131 px đọc đủ "Bạn" / "Máy (dễ)"; bàn 346×346; 568×320 thẻ 134 px |
| BRD-13 | Cờ Tướng | `#tip` chuyển từ trong `.stage` sang `.side` (trên biên bản); dọc: nằm ở dải trống dưới bàn; `game.js` chỉ hiện 3 lần chọn quân đầu (`localStorage wgp.co-tuong.tip`) | 844×390 tip y 354–380 đè hàng quân nhà (bàn y 107–367) | tip ở cột phải x 587, y 186–216, không giao bàn; dọc không giao bàn (390×844 tip y 740, bàn tới 626) |
| PTY-04 | Đặt Bom | `style.css` khối ngang: bản đồ `min(100vw−2·152px, (100dvh−100px)·13/11)`, `.pad` fixed + `pointer-events:none`, D-pad trái / BOM phải, nút 44×44, safe-area; `app.js` vào ván `scrollTo(0,0)` | 844×390 canvas y 114–793, D-pad y 801–981, trang 1564 | 844×390 bản đồ 343×290 (y 80–370), D-pad x 9–145 y 239–379, BOM x 749 y 270; không nút nào đè bản đồ; 568×320 bản đồ 260×220, D-pad/BOM trong khung |
| PTY-05 | Đặt Bom | `app.js`: sang pha play ⇒ `activeElement.blur()`; Esc trong ô chat ⇒ blur; `typing()` chỉ tính ô gõ chữ (không tính checkbox) | chat ở phòng chờ ⇒ vào ván focus vẫn ở `#chatInp`, mũi tên không gửi `mv`, Space gõ vào chat | focus trước = chatInp, sau = BODY; 4 phím mũi tên ⇒ 25 gói `mv`, Space ⇒ 1 `bomb`, ô chat không thêm ký tự; Esc ⇒ BODY |
| OAQ-02 | Ô Ăn Quan | `index.html` `<b id="mySide">`, `game.js layout()` đổi chữ theo `board.info.rot` | dọc: "Bạn giữ hàng dưới" (thực ra cột phải) | 320/360/390 dọc: "cột bên phải" (rot=true, đối chiếu ảnh: ô sáng ở cột phải); ngang/desktop: "hàng dưới" |
| QCK-02 | Rắn, Xếp Gạch, Bắn Bóng | mới `_shared/short-screen.css`: `.ss-cta` (hàng nút sticky đáy lớp phủ, `max-height:860px`), `.ss-ov` (ngang ≤500: lớp phủ `fixed` dưới thanh đầu trang `--ss-bar-h`) | Rắn 844×390 Bắt đầu y 499 / Xếp Gạch 618 / Bắn Bóng 1366×768 749 (khung 390/390/768); menu ngang bị ép trong khung bàn (568×320 thẻ 150 px rộng, 1290 cao) | Rắn 844×390 y 330–382, Xếp Gạch 330–382, Bắn Bóng 1366×768 688–740, 568×320 cả 3 game y 260–312; thẻ menu 544 px rộng |

## Tag cache đã đổi

- Cá Ngựa: `hud.css`, `hud.js`, `game.js`, `online.js` → `?v=ls1` (mọi chỗ nhập: `index.html`, `online.js`, `game.js`, `hud.js`).
- Cờ Tướng, Ô Ăn Quan: `game.js?v=d0` → `ls1`. Đặt Bom: `app.js`, `style.css` `chat1` → `ls1`.
- `hud.css` sửa thêm lần 2 (nút CHƠI sticky cả laptop 768 cao) ⇒ `?v=ls2`. Mới: `_shared/short-screen.css?v=ss1` (Rắn, Xếp Gạch, Bắn Bóng). Tỷ Phú, Cờ Vua chỉ sửa `index.html` (không có tag).
- `node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 9 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.` (sau khi gộp master 6d85529).

## Kiểm thử

- Unit: Cá Ngựa 31/31, Tỷ Phú 7/7, Cờ Vua 16/16, Cờ Tướng 15/15, Ô Ăn Quan 21/21, Rắn 8/8, Xếp Gạch 18/18, Bắn Bóng 18/18 (Đặt Bom không có unit test).
- Online Cá Ngựa 2 hồ sơ (chủ phòng bấm Chơi bằng chạm thật sau khi cuộn xuống phòng chờ): 390×844 scrollY 388→0, 844×390 33→0, 320×568 250→45; khay xúc xắc của chủ phòng nằm trọn trong khung, không bị che, 0 lỗi console.
- Chơi thật bằng chạm (844×390, 568×320, 320×568): Cá Ngựa gieo từ khay ⇒ trạng thái đổi; Tỷ Phú bấm Gieo ⇒ đi quân, hiện hỏi mua; Rắn bấm Bắt đầu ⇒ menu đóng; Đặt Bom D-pad giữ 4 hướng ⇒ 12–25 gói `mv`, BOM ⇒ 1 `bomb` (cả 7 khung).
- `chat-off-e2e.mjs` (BASE=8951): 239 đạt, 1 lỗi — `noi-tu 390×844` hết giờ chờ ô chat (game không thuộc phạm vi, không sửa; lần chạy trước 237/2, lỗi khác nhau ⇒ chập chờn). Đặt Bom / Cá Ngựa / Tỷ Phú / Vua / Tướng / Ô Ăn Quan đều đạt.
- `resume-e2e.mjs co-ca-ngua co-ty-phu co-vua`: 3/3 ĐẠT (Cá Ngựa lần đầu trượt do server thử đã đầy giới hạn phòng/IP vì các lần đo trước; khởi động lại server ⇒ ĐẠT).
- `sound-press-e2e.mjs`: 246 PASS, 0 FAIL (gồm Rắn, Xếp Gạch, Bắn Bóng: tiếng + độ lún nút ở 1366×768 và 390×844).
- Ảnh trước/sau: thư mục tạm của phiên (`shots/before`, `shots/after1`, `shots/final`), không commit.
- Đo bố cục 7 khung × 9 game: không tràn ngang ở mọi khung; nút chính trong khung và `elementFromPoint` ở tâm trả về chính nút; không lỗi console.

## Chưa làm / ghi chú

- Cá Ngựa 568×320: bàn chỉ 216 px (hai cột thẻ 150 px chiếm chỗ) — chơi được nhưng nhỏ.
- Phòng chờ Cá Ngựa dọc vẫn xếp dưới bàn (không làm bottom-sheet); bù bằng nút CHƠI sticky + cuộn về bàn khi vào ván.
- Tên dài bị "…" ở thẻ hẹp (BRD-08, ngoài phạm vi). Cờ Vua ngang: thẻ Trắng luôn ở trên (không đảo theo màu người chơi).
