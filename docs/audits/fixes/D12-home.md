# D12 · Trang chủ: một bố cục cố định cho sảnh, một danh sách game trên điện thoại, thẻ Tài trợ, nút Ủng hộ

Nhánh `claude/d12-home`, tách từ master `605df43`. Đo bằng Chrome headless qua `_shared/test/cdp.mjs` (chạm thật bằng `Input.dispatchTouchEvent`).
Máy đo dùng chung với agent khác nên số thời gian dao động.

## 1. Sảnh chờ: một bố cục, chỉ nội dung bên trong đổi

**Trước (D11):** bố cục đổi theo việc có phòng hay không.
- Máy tính, sảnh trống: hero trải hết hàng (ảnh 440 px trái, chữ phải); dưới hero là một hàng riêng "Có mã phòng bạn gửi? [mã] Vào phòng · + Tạo phòng mới".
- Máy tính, có phòng: hero bên trái, khung sảnh đầy đủ bên phải.
- Phòng về sau lần vẽ đầu: sảnh vẫn gọn, hiện nút nhỏ "● N phòng đang chờ · Xem".
- Điện thoại: khi trống chỉ có một hàng mã phòng; khi có phòng thì đổi sang khung đầy đủ (tiêu đề, tab, danh sách).

**Sau (D12):**
- **Máy tính / máy tính bảng ngang (≥ 1024 px):** luôn là hero bên trái, khung "Sảnh chờ trực tiếp" bên phải, cao bằng hero (như trước D11).
  - Trên cùng khung, luôn ở một chỗ: tiêu đề, rồi "Có mã phòng bạn gửi?" với ô mã, "Vào phòng", "+ Tạo phòng mới".
  - Phía dưới là ô `.lobby__body` chiếm phần còn lại:
    - có phòng / ván đang chơi: tab Phòng chờ / Đang diễn ra và danh sách cuộn bên trong;
    - trống: đúng một dòng ở giữa ô, "Chưa có phòng nào đang chờ — tạo phòng rồi gửi mã cho bạn bè.". Không có nút Tạo phòng thứ hai.
- **≤ 1023 px** (điện thoại, máy tính bảng dọc 721–1023, điện thoại xoay ngang): sảnh nằm dưới hero / băng, cùng một khung:
  - hàng tiêu đề;
  - hàng ô mã + Vào + Tạo phòng;
  - ô danh sách **cao cố định 74 px** (đúng một hàng phòng). Có phòng thì là dải vuốt ngang một hàng: phòng chờ trước, bàn đang chơi sau. Thẻ rộng 88% (máy tính bảng ~46%) để lộ mép thẻ sau; chỉ một mục thì rộng 100%. Trống thì là dòng nhắn ở giữa ô.
  - Không có tab ở cỡ này: tab tốn thêm một hàng, và cả hai loại đã nằm chung một dải (bàn đang chơi có chữ "N bàn đang chơi" và nút "Chơi").
- Máy tính bảng dọc 721–1023 px giữ cách xếp trước D11: hero ngang ở trên, sảnh ở dưới. Ngoài ra ô danh sách giờ cao cố định (xem mục 5).
- Đã bỏ:
  - chế độ "sảnh gọn" + hero trọn hàng (CSS `.lobby:not(.has-rooms)…`, `.arena:has(…)`);
  - nút `#lobbyPeek` "N phòng đang chờ · Xem" và JS `earlyRender` / `lobbyOpen`;
  - script nội tuyến đặt `.has-rooms` trước lần vẽ đầu. Không cần nữa vì ô có chiều cao cố định.
- `sizes` của ảnh hero (cỡ ≥ 1181 px) về lại 360px. 440px chỉ dùng cho hero trọn hàng của D11.
- Lúc đang tải, dòng nhắn đã là câu "Chưa có phòng nào…". Trống là trường hợp hay gặp nhất, nên khi kết quả về chữ không đổi số dòng. Trước đó có câu "Đang tìm…": đổi chữ làm đổi số dòng, đo ra CLS 0,005 ở 390 khi mạng chậm.
- Cookie `lk_via=sanh` của nút "Vào" ở sảnh vẫn giữ nguyên (bắt theo `.room__go`).

**Cùng toạ độ, đã thêm vào e2e** (`home-d12-e2e`). Hàng mã / Vào / Tạo phòng, khung ô danh sách và đỉnh "Tất cả game" giống hệt nhau ở 0 phòng, 1 phòng, 5 phòng (+ 1 bàn đang chơi) và khi phòng về sau 1 s:

| Khung | ô mã (x, y) | Tạo phòng (x, y) | ô danh sách (cao) |
|---|---|---|---|
| 1366×768 | 485, 191 | 1086, 188 | 307 |
| 1920×1080 | 762, 191 | 1363, 188 | 308 |
| 1024×768 | 468, 237 | 465, 298 (Tạo phòng xuống hàng riêng, như trước D11) | 269 |
| 390×844 | 30, 379 | 228, 376 | 74 |
| 360×640 | 30, 379 | 211, 376 | 74 |
| 320×568 | 30, 379 | 171, 376 | 74 |

**CLS lúc tải** (mock `/api/lobby`, `home-d12-e2e`):

| Khung | 0 phòng | 1 phòng | 5 phòng | về sau 1 s |
|---|---|---|---|---|
| 1366×768 | 0,0005 | 0,0003 | 0,0003 | 0,0004 |
| 1920×1080 | 0,0001 | 0,0001 | 0,0001 | 0,0001 |
| 1024×768 | 0,0007 | 0,0006 | 0,0006 | 0,0007 |
| 390×844 | 0 | 0 | 0 | 0,0002 |
| 360×640 | 0 | 0 | 0 | 0 |
| 320×568 | 0 | 0 | 0 | 0 |

Ảnh chụp: `sanh-<w>x<h>-{0-phong,1-phong,5-phong,ve-muon-1s}.png` trong thư mục ảnh của `home-d12-e2e` (24 ảnh).

## 2. Điện thoại: một danh sách, mỗi game một lần

**Trước (D11):** hero bị ẩn. Dải "Chơi ngay" gồm ô lớn 2×2 "Tựa game của tuần" + 8 game (`QUICK_PLAY`), rồi đến các kệ "Tất cả game" lặp lại những game đó.

**Sau:** từ trên xuống gồm thanh trên, chip "Chơi · Thử thách", ô "Tìm game", **băng thấp một hàng "Tựa game của tuần"**, sảnh, chip lọc + các kệ (giữ như cũ).
- Băng chính là slide 1 của hero (`HERO_SLIDES[0]`, hôm nay Cờ Cá Ngựa): ảnh 4:3 nhỏ (128×96), kicker, tên, nút "Chơi ngay". Cao 96 px ở dọc và ở xoay ngang thấp.
  - Ở khung này không có ‹ ›, chấm, tự chuyển hay vuốt (`bannerMQ` trong `app.js`, cùng điều kiện với khối CSS). Các slide sau chỉ được nối vào DOM (ảnh lười), không tải.
  - Xoay / kéo cửa sổ sang khung lớn thì băng chuyền chạy lại.
- Đã bỏ hẳn dải "Chơi ngay": HTML 9 ô viết sẵn, `renderQuickPlay`, `featHTML`, `QP_SIZES`, `window.QUICK_PLAY` (games.js) và CSS `.qp*` / `.tile--feat`. Xoay ngang thấp cũng theo cách xếp một danh sách này.
- Game của tuần **vẫn nằm trong kệ của nó** ("Đối Kháng", ở dưới, ngoài màn đầu), nên trong màn đầu không game nào lặp. Kệ là nơi duy nhất có đủ mọi game, mỗi game đúng một lần (e2e kiểm cả hai điều này).
- Ảnh băng: `fetchpriority="high"`, `sizes` = `(orientation: landscape) and (max-height: 500px) 128px, (max-width: 720px) 120px, …`. Máy dpr 3 lấy bản 360w (`half/co-ca-ngua.webp`). Không cần `preload`: ảnh nằm sớm trong HTML.
- Gọn khoảng cách ở ≤ 720 px (giữa sảnh và kệ, tiêu đề kệ, hàng tiêu đề sảnh) để màn 390×844 thấy trọn hàng ô đầu.

**Thẻ game thấy trọn trong màn đầu** (ngoài băng):

| Khung | Trước (D11) | Sau |
|---|---|---|
| 390×844 | 6 (ô lớn + 5, thuộc dải "Chơi ngay") | **3** (hàng đầu kệ Tập Làm Chủ) + băng + hàng mã phòng |
| 360×640 | 6 | **0**: băng + hàng mã + dòng nhắn sảnh; kệ bắt đầu ngay dưới (ô đầu y 690) |
| 320×568 | 6 | **0**: như 360 |
| 568×320 / 844×390 | dải 1 hàng | 0: băng + đầu sảnh |

Muốn thấy game sớm hơn ở 360 / 320 thì phải đổi thứ tự (xem mục 7).

**LCP điện thoại** (`tools/perf/home-vitals.mjs --only 390-slow --runs 3 --dpr 3`, Slow 4G + CPU 4×; master xuất ra thư mục tạm ở cổng 8941, nhánh ở 8942, chạy xen kẽ):

| | master (D11) | D12 |
|---|---|---|
| Vòng 1 (trung vị) | 1 164 ms | 1 460 ms |
| Vòng 2 | 1 072 ms | 1 100 ms |
| Vòng 3 (từng lần) | 1 048 / 1 620 / 2 704 ⇒ 1 620 ms | 1 228 / 1 564 / 1 100 ⇒ 1 228 ms |
| Sau khi sửa câu lúc tải | | 940 / 1 312 / 1 088 ⇒ 1 088 ms |
| CLS | 0,0002–0,0003 | 0,0008–0,0009 |
| Dung lượng / ảnh / số request | 968 KB / 711 KB / 44 | **912 KB / 653 KB / 40** |

Phần tử LCP vẫn là ảnh Cờ Cá Ngựa (giờ là ảnh băng). Có một lần master lấy LCP là ảnh Đào Vàng của dải "Chơi ngay". Hai bản cùng tầm, D12 nhẹ hơn 56 KB và ít hơn 4 request.

## 3. Thẻ "Tài trợ" SpeakUp Kids

- `games.js`: `SPONSOR.url = "https://speakupkids.net/"` ⇒ thẻ tự hiện (cuối kệ cuối "Trí tuệ", cùng cỡ thẻ game, cả máy tính và điện thoại). Mở tab mới, `rel="sponsored noopener"`.
- Bấm thẻ kêu đúng 1 tiếng (press-nav), cả chuột 1366 và chạm 390. Trang chủ không chuyển vì link mở tab mới.
- Xoá link (url trống / không phải https://) ⇒ thẻ ẩn, như D5.

## 4. "☕ Ủng hộ Lụm Kèo"

- Nút nằm trong dòng chân trang, sau "Quyền riêng tư": `index.html` và `bang-xep-hang.html`. Là `<button>`, cao 44 px. Logic ở file mới `donate.js`.
- Bấm ⇒ `<dialog>` (showModal) theo kiểu pixel của cổng, gồm:
  - tiêu đề;
  - lời cảm ơn "Lụm Kèo miễn phí cho mọi người. Nếu bạn thấy vui, có thể mời team một ly trà đá ❤";
  - ảnh QR (`assets/ung-ho-qr.webp`), rộng 256 px ở 320, 280 px ở 390 / 1366, `image-rendering: auto`;
  - "Mở app ngân hàng → Quét QR";
  - dòng tên · ngân hàng · số tài khoản;
  - nút "Chép số tài khoản". Chép xong hiện thông báo nhỏ "Đã chép"; trình duyệt không cho chép thì dùng cách cũ bằng `execCommand`.
- Không tự mở, không nhắc, không khoá gì.
- Đóng bằng Esc, nút × hoặc chạm nền mờ. Khi mở, focus giữ trong hộp (showModal + vòng Tab); đóng thì focus về nút.
- Ảnh QR chỉ có `data-src` cho tới lần mở đầu, nên không tính vào dung lượng / LCP trang chủ (e2e kiểm không có request nào tới ảnh trước khi mở, và chỉ 1 request sau nhiều lần mở).
- Mở hộp ⇒ gửi sự kiện `donate_open` (chỉ tên sự kiện, `g` rỗng).
  - Máy chủ: thêm vào `EVENTS` + nhãn "Mở hộp Ủng hộ" trong `games-server/stats.js`, nên bảng admin tự có cột. Cập nhật `stats.test.mjs` và `docs/account/STATS-SETUP.md`.
  - Phía trình duyệt, `donate.js` tự gửi beacon, không qua `ev()` của `games/_shared/stats.js`. Thêm tên vào danh sách bên đó buộc đổi tag `stats.js?v=st1` ⇒ đổi tag `share.js` / `challenge.js` / `daily-ui.js` ở ~40 file game của các nhánh khác. `challenge.test.mjs` sửa tương ứng: danh sách máy chủ = danh sách trình duyệt + `donate_open`.
- Đúng 1 tiếng mỗi lần bấm. Các nút đều là `<button>` nên `feedback.js` kêu, `donate.js` không tự phát tiếng. Đã kiểm ở 320 / 390 / 1366.
- `quyen-rieng-tu.html`: thêm mục "Ủng hộ Lụm Kèo". Hộp chỉ hiện QR ngân hàng; tiền và thông tin thanh toán đi thẳng qua ngân hàng, không qua Lụm Kèo; mở hộp chỉ cộng 1 vào số đếm chung.
- **Kiểm mã QR:** máy này chỉ có OpenCV, và `cv2.QRCodeDetector` (cả bản Aruco) không đọc được **ngay cả file gốc**. QR này có chấm tròn và logo giữa, bộ đọc của OpenCV hay hụt kiểu này. Không có pyzbar; không chạy được bộ đọc JS tải về.
  - Có ảnh chụp 1:1 trong thư mục ảnh của `home-d12-e2e`: `ung-ho-320x568.png`, `ung-ho-390x844.png`, `ung-ho-1366x768.png`.
  - **Cần quét thử bằng app ngân hàng trên điện thoại thật**, nhất là ở 320 px. Ở đó phần mã QR trong ảnh chỉ còn khoảng 150 px.

## 5. Tag cache đã đổi

- `app.js` d11 → **d12**
- `portal-pixel.css` d11a → **d12a** (index, bang-xep-hang, quyen-rieng-tu)
- `games.js` d5a → **d12a**
- mới: `donate.js?v=d12a` (index, bang-xep-hang)
- Không đổi:
  - `feedback.js?v=f4` (không sửa; `press-nav.js` vẫn import f4, cũng không sửa);
  - `nav.css` d11a, `press-nav.js` d11a;
  - `stats.js?v=st1` (không sửa);
  - `portal.css`, `styles.css` (không sửa).
- `node tools/cache-tags/check-tags.mjs master` ⇒ OK.

## 6. Test

| Bộ | Kết quả |
|---|---|
| `_shared/test/home-d12-e2e.mjs` (mới) | 145/145 ĐẠT |
| `home-d11-e2e` | ĐẠT. HOME2-06 chuyển sang máy tính bảng dọc 820×1180 (điện thoại không còn băng chuyền); HOME2-07 đo dải `.lobby__lists`; HOME2-13 đo đỉnh băng; bỏ các mục ô lớn "Chơi ngay" / sảnh gọn / nút "Xem" (đã có ở d12) |
| `home-d3-e2e` | ĐẠT. Màn đầu 390: băng + ≥ 3 thẻ, không lặp; Tài trợ hiện với link thật, xoá link ⇒ ẩn |
| `home-d5-e2e` | ĐẠT. Xoay ngang: băng ≤ 35% chiều cao, không ‹ › / chấm, không "Chơi ngay"; dọc 390: băng 96–120 px; máy tính sảnh trống: hero trái, sảnh cao bằng hero; Tài trợ: link thật, tab mới, rel noopener sponsored; xoá link ⇒ ẩn |
| `touch-scroll-e2e` | 34/34 (thêm băng Tựa game của tuần + thẻ Tài trợ) |
| `double-sound-e2e.mjs homepage` | 24 lần bấm, **0 FAIL** |
| `sound-press-e2e` | **246/246** |
| `games-server/stats.test.mjs` | 15/15 |
| `_shared/test/challenge.test.mjs` | 10/10 |
| `tools/cache-tags/check-tags.mjs master` | OK |

`home-d12-e2e` kiểm:
- sảnh ở 6 khung × 4 trạng thái: toạ độ, CLS, dòng nhắn duy nhất, không nút Tạo phòng thứ 2, không nút "Xem", hero trái + sảnh phải cao bằng hero;
- một danh sách ở 390 / 360 / 320 / 568×320 / 844×390: không "Chơi ngay", băng = `HERO_SLIDES[0]`, không game lặp trong màn đầu, kệ mỗi game một lần, băng không tự chuyển;
- Tài trợ: link, tab mới, rel, 1 tiếng;
- Ủng hộ: ảnh chỉ tải khi mở, QR ≥ 240 px, 1 tiếng, `donate_open`, chép số tài khoản, Tab trong hộp, Esc / × / nền mờ, focus về nút; trang Thử thách mở được hộp.

## 7. Cần chủ dự án chọn

1. **Màn đầu 360×640 / 320×568 không thấy trọn thẻ game nào** (băng + sảnh chiếm hết, kệ bắt đầu ngay dưới):
   - (a) giữ như vậy;
   - (b) trên màn thấp (≤ 700 px) chuyển sảnh xuống dưới hàng ô đầu của kệ đầu;
   - (c) thu ô danh sách sảnh khi trống còn một dòng chữ nhỏ, cao khoảng 40 px thay vì 74 px. Như vậy chiều cao vẫn cố định, nhưng khi có phòng thẻ phòng phải thấp hơn.
2. **Máy tính bảng dọc 721–1023 px**: hiện xếp như trước D11, hero ngang ở trên, sảnh ở dưới (ô danh sách cao cố định một hàng):
   - (a) giữ;
   - (b) cũng đặt hero trái / sảnh phải như ≥ 1024 (hero hẹp còn ~300 px).
3. **Tab "Phòng chờ / Đang diễn ra" trên điện thoại**: đã bỏ, dùng một dải chung:
   - (a) giữ một dải;
   - (b) đưa tab trở lại. Ô danh sách phải cao thêm khoảng 52 px ở mọi trạng thái, kể cả khi trống.
4. **QR ở 320 px** (phần mã chỉ khoảng 150 px trong ảnh 256 px):
   - (a) giữ ảnh hiện tại;
   - (b) cắt ảnh chỉ còn phần mã (bỏ khung VietQR / chữ bên dưới) để mã to hơn;
   - (c) cho chạm vào ảnh thì phóng to toàn màn.
