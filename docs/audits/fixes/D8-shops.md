# D8 · Tiệm (Trà Sữa, Bánh Mì, Cơm Tấm, Nông Trại)

Các P2 còn lại của audit lần 2 (`docs/audits/v2/raw/TLC1.md`, `TLC2.md`, `QUICK.md`). Nhánh `claude/d8-shops`.
Không đổi định dạng bản lưu. Không đụng `cdp.mjs` nào.

## QUICK2-04 · Trà Sữa tải lần đầu (LCP)

**Đo:** script riêng (Chrome headless qua CDP), hồ sơ mới, 390×844 dpr 3, chạm, tắt cache, CPU 4×, mạng giả lập kiểu Lighthouse
"Slow 4G" (RTT 562,5 ms, xuống 1,44 Mbps, lên 675 kbps), server `node server.js` cục bộ (HTTP/1.1, 6 kết nối). Mỗi lượt 3 lần.
Throttle này nặng hơn số của audit (audit: 10,3 / 10,9 s), nên so trước/sau trong cùng một cách đo.

| | LCP (3 lượt) | Phần tử LCP | Ảnh phố màn chào tải xong |
|---|---|---|---|
| Trước (master) | 16,2 / 16,1 / 16,1 s | `IMG.layer` (shop-scene.webp, tạo sau khi JS + ~1,3 MB sheet tải xong) | 19,2 s |
| Sau | 7,3 / 7,1 / 7,2 s | `IMG.scene-ph` (cùng ảnh, có sẵn trong HTML) | 7,9 s |

FCP giữ nguyên (~1,4 s). Tổng byte 60 s đầu không đổi (2,37 MB).

**Nguyên nhân:** `game.js` chờ cả cây module (4 tầng import, ~55 file qua HTTP/1.1), rồi mới tải manifest, rồi **chờ mọi sheet màn đầu**
(có `portraits-hd` 604 KB) trước khi dựng cảnh. Ảnh phố của màn chào chỉ bắt đầu tải sau tất cả, lúc 15,8 s.

**Sửa:**
- `index.html`: ảnh cảnh là `<img class="scene-ph" fetchpriority="high">` ngay trong `#scene`. Trình duyệt tải và vẽ nó từ đầu, không chờ JS.
  `render/scene.js createScene()` **giữ nguyên thẻ đó tại chỗ** làm nền (lớp `.bglayer`, đi cùng camera bằng cùng `transform` với sân
  khấu). Không dời/xoá thẻ nên không vẽ lại, và LCP không bị tính lại lúc JS xong. Ảnh tràn 2 px để phủ kín khung.
- Trước khi `#app.ready`: chỉ ẩn phần quầy/phiếu (`opacity: 0`); khung cảnh hiện luôn (trước đây cả `.app` `opacity: 0`).
- `<link rel="preload" as="fetch" crossorigin>` cho `data/asset-manifest.json`.
- Người chơi mới (chưa có `wgp.tiemtrasua.v1`): một đoạn script nhỏ trong `<head>` thêm preload cho `street-background.webp`
  (ảnh màn chào). Ảnh màn chào xong lúc 7,9 s thay vì 19,2 s.
- `game.js`: người chơi mới **không chờ** sheet trong tiệm nữa. Ảnh màn chào (phố + chân dung) tải trước, các sheet màn đầu tải sau
  (sprite tự hiện khi ảnh về, `icon()` có sẵn trạng thái "đang tải"). Người chơi cũ vẫn chờ đủ sheet như trước.

**Đã thử mà không dùng:**
- **Bản nhỏ cho điện thoại (`srcset`):** ảnh phố và ảnh cảnh đúng là lưới 2× (100 % khối 2×2 trùng màu), nên thu ½ bằng
  nearest-neighbour không mất gì (đã kiểm: phóng lại ×2 khớp từng pixel). Nhưng tranh có 173k / 151k màu nên WebP lossless chỉ nhỏ đi 14 %
  (515 → 443 KB, 486 → 415 KB). Không đáng thêm 2 file asset ngoài hợp đồng asset-spec. Không vẽ ảnh mới, không resample mượt.
- **`modulepreload` cả cây module:** chỉ nhanh hơn 0,3–0,5 s (nút cổ chai là băng thông + 6 kết nối HTTP/1.1, không phải số tầng import),
  mà phải giữ ~50 dòng tag khớp tay. Bỏ. Khi có HTTP/2 (Cloudflare, QUICK2-09) thì lợi hơn.
- **Đạt LCP < 4 s với throttle trên:** không đạt được nếu chỉ sửa phía trang. Riêng ảnh cảnh 475 KB ở 184 KB/s đã mất 2,6 s, cộng HTML,
  CSS, font và độ trễ. Muốn xuống nữa thì cần HTTP/2/CDN hoặc ảnh cảnh nhẹ hơn (vẽ lại ít màu hơn; việc của Codex, cần chủ dự án duyệt).

## TLC12-02 · Trà Sữa: sự kiện khi xoay ngang

Trước: ở 844×390 và 740×360, 0/2 lựa chọn thấy trọn (dải ảnh 200 px chiếm hơn nửa sheet 318 px).

- `@media (max-height: 520px) and (orientation: landscape)`: `.sheet.drama` thành 2 cột. Cột trái 172 px là chân dung người nói, cao hết
  bảng. Cột phải là lời thoại và lựa chọn (chữ 14 px, nút ≥ 44 px).
  - Bảng sự kiện chỉ để chân dung khách/NPC. Lời của "Bạn" vẫn hiện bằng chữ xanh.
  - Bảng kết quả chỉ để chân dung "Bạn".
  - Nhãn nhóm trên ảnh được xuống dòng.
- Hộp hết hàng (5–6 cách xử lý, cùng khung `.drama`): lựa chọn xếp 2 cột, ẩn dòng "… đang chờ". Ở màn ≤ 400 px cao thì ẩn chữ phụ,
  chỉ giữ tên và chi phí.
- Đo: V12 (2 lựa chọn), R09 và FA2 (3 lựa chọn, chữ dài nhất) ở 844×390, 740×360, 667×375 đều thấy trọn, `scrollHeight = clientHeight`.
  Hết hàng: 5/5 thấy trọn ở 844×390 và 740×360. Ở 390 dọc không đổi.

## TLC12-06 · Trà Sữa: HUD 4 hàng ở 768 dọc

Khối HUD 1 hàng thêm điều kiện `(max-width: 1024px) and (orientation: portrait)`. Cuối game ở 768×1024: 1 hàng, cao 31 px (trước: 4 hàng,
146 px). Thông báo ở tablet dọc cũng xuống dưới HUD (`top: 110px`) như ở điện thoại.

## TLC12-05 · Trà Sữa 320×568: Hoàn tác che nút gợi ý

Tái hiện được với seed 42: nút "70%" và "Nhiều đá" ở y 485–564, thanh Hoàn tác ở 498. Quầy pha chỉ cao 191 px khi có dòng "sắp hết".

Nguyên nhân là `ui/brew.js reveal()`. Khi cụm "dải bước + nút" và cả cụm "tiêu đề + nút gợi ý" đều cao hơn khung, hàm ưu tiên giữ tiêu đề,
nên nút gợi ý nằm dưới thanh. Sửa: lúc đó chỉ cần nút gợi ý nằm trọn. Seed 42 ở 320, 5 đơn: phải cuộn 0 lần.

## TLC22-02 · Bánh Mì: tự cuộn tới quầy ráp làm mất HUD / gợi ý / thông báo

- `game.js`: ở điện thoại và tablet dọc (đúng media `mobile`), khi `.app` cuộn tới mức HUD trôi khỏi khung, các phần tử `#hud`, `#pills`
  (viên Lò/Gas), `#hintbar` và `#toasts` được **dời** vào `#dockbar`. Đây là dải cố định ngay dưới thanh đầu, nền đặc, không chép DOM.
  Cuộn lên thấy cảnh, hết ca hoặc mở bảng phủ thì các phần tử về lại cảnh.
- `bench.reveal(keys, reserve)`: chừa chiều cao dải ở mép trên khung, nên phiếu và nút của bước không nằm dưới dải. Bước ghim phiếu
  (cuộn lên cảnh) không chừa.
- e2e-layout kiểm thêm: ở mọi lần chạm lúc ráp (390, 360, 412, 768, 320), ô HUD, viên Lò, dòng gợi ý (nếu đang hiện) và thông báo mới nhất
  đều nằm trong màn và không bị che. Vẫn 0 lần cuộn tay mỗi đơn.

## TLC22-04 / TLC2-14 · Cơm Tấm: mở quán rỗng hàng, bếp tắt lặng lẽ

- `ui/overlays.js`: bấm "Mở quán" (và "Mở ca …" giữa hai ca) khi **chưa có sườn ướp**, **nồi cơm 0** hoặc **bếp chưa nhóm** thì hỏi lại
  ngay trong chân bảng, giống mẫu "Vẫn mở quán?" của Trà Sữa. Dòng đỏ (`role="alert"`) ghi rõ thiếu gì, vd "nồi cơm chưa nấu, bếp chưa
  nhóm than" hay "hết than, bếp nguội".
  - **"Chuẩn bị nhanh"** (nút chính): nhập + ướp đủ cho hôm nay, ướp sườn nếu còn sườn sống, nấu nồi cơm, làm hũ mỡ hành, nhóm bếp.
    Bước nào làm được thì làm, như bấm tay ở các tab. Sau đó vẽ lại bảng, người chơi bấm Mở quán lần nữa.
  - **"Vẫn mở quán"**: mở như cũ.
  - Không dùng `pxConfirm`: hộp đó chỉ có 2 kết quả và Esc trả `false`, nên khó tách "Thôi" với "Vẫn mở". Hỏi trong chân bảng không có chỗ
    mơ hồ đó, lại cùng kiểu với Trà Sữa.
- `core/shift.js`:
  - Mở ca mà bếp chưa nhóm thì báo ngay: "Bếp chưa nhóm than! Bấm +Than để nhóm lửa…". Trước đây không có lời nào vì `coalOut` chỉ phát
    khi than từng ≥ 10.
  - Nếu kho cũng hết than: "Bếp nguội mà kho hết than! Bấm +Than để nhờ mua gấp."
  - Than tàn giữa ca mà kho hết than thì lời `coalOut` có thêm cách mua gấp.
- Thanh Bếp: than < 10 thì nút đổi thành **"Tắt lửa! +Than (n)"**, nền đỏ đặc (`.gbtn2.out`). Bảng bếp mobile có "Tắt lửa! Thêm than".
- Test: `test/open-empty.test.mjs` (4 test). e2e-layout ở 6 khung: bấm Mở quán rỗng thì hỏi lại, 2 nút ≥ 44 px bấm được, ca chưa mở;
  "Chuẩn bị nhanh" cho ra sườn ướp, cơm và lửa.

## TLC12-03 · Nông Trại 320×568: ruộng 0 % thấy được

- `index.html @media (max-width: 760px) and (orientation: portrait) and (max-height: 700px)`, khi đang gieo/tưới ở cảnh trại:
  - Trang không cuộn nữa (`100svh`). Bản đồ `.farm` thành khung cuộn riêng, chiếm phần còn lại giữa HUD + nhiệm vụ và khay.
  - Khay nằm theo dòng ở đáy, không còn dính đè lên bản đồ.
  - Hàng 10 nút điều hướng thành 1 hàng cuộn ngang (nút ≥ 44 px).
  - Bảng Kho / Đơn / Nâng cấp vẫn nằm theo dòng trang như cũ.
- `game.js`: ruộng tự vào giữa khung (`centerField`) khi vào layout này và khi quay lại Hạt giống/Tưới từ bảng khác.
- Đo:
  - 320×568 ngày 1: ô sáng NV1 bấm được tại chỗ, 13/25 ô thấy (trước: 0).
  - 320×568 cuối game (cấp 20, 999tr, đủ công trình): 13/25 ô (52 %).
  - 360×640: 25/25 ô cả ngày 1 lẫn cuối game (trước: cuối game 0).
  - 390×844: không đổi (media không áp dụng).
- e2e: thêm 2 kiểm tra TLC12-03 (320 ngày 1 và cuối game).

## P2 nhỏ khác đã sửa

| Mã | Sửa |
|---|---|
| TLC1-02 NT Cách chơi mở ở cuối | `showHelp`: `focus({ preventScroll: true })` + `scrollTop = 0`. e2e 390 kiểm tiêu đề trong màn, `scrollTop` 0. |
| TLC2-06 Bánh Mì "Chưa có khách chờ" khi có khách | Khoá vẽ lại quầy thiếu "có khách đang chờ" nên chữ cũ đứng mãi. Đã thêm vào khoá; đã kiểm chữ đổi ngay khi khách tới. |
| TLC2-07 Cơm Tấm gợi ý ngày 1 bị cắt "…" | Dọc: tối đa 3 dòng. Ngang: 2 dòng. Thông báo dời xuống dưới gợi ý. |
| TLC2-08 Cơm Tấm chip "N · bỏ sườn" | Chip trống: "Nóng · trống" / "Vừa · trống" / "Ấm · trống" (khớp chữ "chỗ trống" của gợi ý). Đang nướng: "Nóng · tái"… |
| TLC2-13 (một phần) Bánh Mì "Ngày tiếp theo" ở y = 820 | Chân bảng chốt ca dính đáy sheet (`.sum-foot`), nút luôn thấy. Chữ "kế toán" chưa đổi (xem dưới). |
| TLC22-06 (P3, cần cho test) e2e-layout chập chờn | e2e-layout Cơm Tấm + Bánh Mì: chưa thấy `#introGo` thì xoá storage + mở lại, tối đa 3 lần. |

## P2 bỏ qua

| Mã | Lý do |
|---|---|
| TLC1-06 NT "Phía Đông →" che công trình | Cần chọn chỗ mới cho nút trên bản đồ ở 6 khung (và ở chế độ Xây). Đụng `placePan` + bố cục, cỡ M, cần ảnh để duyệt. |
| TLC1-07 (một phần) NT nhãn chế độ Xây bị nút Phía Đông / ô trang trí che | Đi cùng TLC1-06. |
| TLC1-08 TTS fps CPU 4× cuối game ~30 | Việc tối ưu hiệu năng (profile + sửa render), cỡ M. Máy đo đang chung nhiều agent, số không tin được. |
| TLC1-10 TTS hệ số cảnh lẻ + `zoom` | Đổi thang cảnh/ô theo PLAYBOOK §2 ở 7 khung, cỡ M, dễ vỡ bố cục vừa sửa. |
| TLC2-10 fps CPU 4× Bánh Mì / Cơm Tấm | Như TLC1-08 (Bánh Mì cần bỏ `getBoundingClientRect` mỗi khung trong `avoidRects`). |
| TLC2-12 (một phần) thông báo đè thanh đầu khi mở bảng chốt ca; Bánh Mì 1366 3 thông báo | Cần quyết định chỗ đặt thông báo khi có bảng phủ cho cả 2 game. Nhỏ nhưng dễ đụng luật "1 thông báo" của D4. |
| TLC2-13 (phần chữ) "Giá vốn", "Hao hụt", "Lời vận hành" | Đổi lời cho trẻ là việc nội dung, nên để chủ dự án duyệt câu chữ. |
| TLC2-01 (một phần) chạm/đơn trung vị 11 (mục tiêu ≤ 10) | Cần đổi luồng ráp (gộp bước), là việc thiết kế. |

Thấy thêm khi đo (ngoài danh sách audit): Nông Trại 360×640 cuối game, HUD vẫn xuống 2 hàng với "999tr" + "80/320". TLC12-04 của D7 mới
kiểm ở 390. Chưa sửa.

## Tag cache

| Game | Trước | Sau |
|---|---|---|
| Trà Sữa | game.js `m42`; scene.js, brew.js, screens.js, stockout.js `m41` | 5 file đó `m43` (các module khác giữ `m38`) |
| Bánh Mì | mọi module `b10` | mọi module `b11` (cả test / tools/sim) |
| Cơm Tấm | mọi module `c8` | mọi module `c9` (cả test / tools/sim) |
| Nông Trại | một tag `m13` | một tag `m14` (`test/m5.test.mjs` kiểm) |

Asset, manifest, font, `_shared` giữ nguyên.

`node tools/cache-tags/check-tags.mjs master`: `OK: 183 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Kết quả test

Unit (`node --test test/*.test.mjs`):

| Game | Kết quả |
|---|---|
| Trà Sữa | 179/179 |
| Bánh Mì | 124/124 |
| Cơm Tấm | 147/147 (gồm 4 test mới ở `open-empty.test.mjs`) |
| Nông Trại | 182/182 |

E2E (Chrome headless, server cổng 8931):

| Test | Kết quả |
|---|---|
| Trà Sữa `e2e.mjs` (gồm e2e-layout) | **177/177**: thêm seed 42 ở 320, HUD 1 hàng ở mọi khung ≤ 1024 cuối game, 12 kiểm tra sự kiện ngang |
| Cơm Tấm `e2e.mjs` (gồm layout, m3a, m5, m5v) | **211 PASS, E2E ĐẠT**, chạy 2 lần (lần 2 sau khi sửa TLC2-07/08) |
| Bánh Mì `e2e.mjs` (gồm layout) | **150 PASS, E2E ĐẠT**, chạy 2 lần (lần 2 sau khi sửa TLC2-06/13) |
| Nông Trại `e2e.mjs` | **181/181** (thêm TLC12-03 ×2, TLC1-02) |
| Nông Trại `e2e-cards.mjs` | 44/44 |
| Nông Trại `e2e-m4.mjs` | ALL PASS |

Chập chờn:
- Trà Sữa lần 1 dừng ở `#introGo` (xoá bản lưu chưa kịp, TLC22-06), nằm trong phần sự kiện ngang mới thêm. Đã thêm `freshProfile()`
  thử lại 3 lần, lần 2 đạt hết.
- Lần 1 còn FAIL "cảnh tiệm dùng … barista-scene": test tìm ảnh cảnh trong `.stage`, nay ảnh nằm dưới sân khấu (`#scene > img.bglayer`).
  Đã sửa test.
- Cơm Tấm và Bánh Mì e2e-layout từng dừng một lần ở `#introGo`. Đã thêm thử lại, sau đó đạt.
