# Quán Cơm Tấm · Ghi chú phát triển

**Vị trí và chuẩn:**
- Game ở `prototype/games/quan-com-tam/` (M1 + M2 lõi, chưa có thẻ trang chủ).
- Lưu ở `localStorage["wgp.quancomtam.v1"]`.
- Làm trong worktree `.claude/worktrees/quan-com-tam`, branch `claude/quan-com-tam`.
- Khung code chép từ **Tiệm Bánh Mì** (bản M5), không chép từ Trà Sữa.
- Chuẩn chung: `docs/tap-lam-chu/PLAYBOOK.md`.

## Trạng thái milestone

| Mốc | Trạng thái | Nội dung |
|---|---|---|
| M0 · Thiết kế + hợp đồng asset | **Xong, chủ dự án đã duyệt 20/11/2026** | GAME-DESIGN, ECONOMY, DRAMA (58 sự kiện, 13 kiểu lỗi), SCREENS, ART-DIRECTION, `asset-spec.json`, `asset-manifest.json` rỗng. Chi tiết `asset-spec.json`:<br>- 33 sheet, 777 frame;<br>- đợt 1: 22 sheet / 509 frame;<br>- đợt 2: 11 sheet / 268 frame;<br>- 74 toạ độ đặt + 12 đường đi / bàn;<br>- `checkSceneScale` cho 2 cảnh.<br>`check_assets` chạy được, hiện chỉ báo thiếu file (đúng, chưa có art). |
| Cảnh (Codex, đợt 0) | **Đã giao, đã gộp** (`codex/com-tam-scenes` b11f926) | 4 tranh cảnh; `sceneScale` vỉa hè 257, quán 258 (chủ dự án duyệt). |
| Đợt 1 (Codex) | **Đã giao, đã gộp** (`codex/com-tam-wave1` 4bc6dab) | `check_assets`: 0 lỗi, 11 cảnh báo (đợt 2 tuỳ chọn). Đủ 74 toạ độ + 12 khoá đường đi / bàn. |
| M1 · Kiến trúc + cảnh + bàn | **Xong (lõi)** | Xem "M1 + M2 lõi" bên dưới. |
| M2 · Một ca trọn | **Xong (lõi)** | Ngày 1 chơi trọn bằng chạm thật (e2e desktop 1366@1,25 + mobile 390@3). |
| M3 · Kinh tế + nội dung cơ chế | Chưa bắt đầu | |
| M4 · Drama + review + Nhật Ký | Chưa bắt đầu | |
| M5 · Polish + cân bằng | Chưa bắt đầu | |

## M1 + M2 lõi (đã làm)

**Chơi được:** màn chào (tên quán) → Chuẩn bị (Nhập hàng, Ướp sườn, Mẻ đầu: nấu nồi cơm / làm mỡ hành / nhóm bếp, Menu, Ca, Đồ nghề, Dự báo) → ca tối 210 giây
→ chốt ca lời lỗ → ngày tiếp theo. Ngày 1 là ca hướng dẫn: 6 nhóm / 8 khách, kiên nhẫn ×1,6, bếp chín ×0,7, dải gợi ý từng bước (`core/tutorial.js`).

**Luật (thuần, `core/`):**

| File | Nội dung |
|---|---|
| `grill.js` | 6 chỗ, 3 vùng (×1,5 / ×1 / ×0,25, giữ ấm không cháy trước 60 giây, khô dần), 2 mặt, lật (đúng lúc 100–114 tính tay nướng), kết quả = mặt kém hơn, than −0,5/giây + rổ +35 sau 4 giây, lửa bùng, quạt +1 nấc / than ×2, khói. |
| `rice.js` | Nồi cơm theo mẻ (gạo tấm, 40 giây), hũ mỡ hành 20 phần, chảo trứng 5 độ, xửng chả (dữ liệu cho cấp 2 / 4). |
| `plate.js` | Bày dĩa xếp lớp (dĩa/hộp → cơm 1–2 vá → mỡ hành → món nướng → bì → chả → trứng → đồ chua → dưa leo → nước mắm chan/chén/bịch → ngò), hoàn tác, đổ dĩa, bước kế tiếp (Space). |
| `tables.js` | Nhóm khách, chỗ chờ theo người, mời ngồi, bàn dơ chặn khách, châm trà + lấy phiếu, ly trà vơi / cạn, ăn, gọi thêm (chén cơm, khăn lạnh), gọi tính tiền, trả tiền, về, bàn dơ có dĩa, dọn + lau, thau rửa, hộp mang về (shipper, cấp 4), khiếu nại, hết món. |
| `walker.js` | Cô chủ đi bộ thật theo lối đi (330 px/giây), hàng đợi 4 việc, việc bếp / bày chỉ làm khi đứng ở bếp; bưng dĩa ghé quầy trước. |
| `bill.js` | Phiếu tính tiền: dòng thật + 1–2 dòng nhiễu, chạm cộng từng dòng, "Tính đúng" ngày 1–3, thiếu = mất tiền, dư = khách phản đối. |
| `score.js` | 0–100 (công thức 45 · nướng 20 · thời gian 20 · phục vụ 15), sao 0/40/55/70/85, đủ 13 kiểu lỗi + trần sao, bưng nhầm bàn / tráo dĩa nhận ra khi dĩa khớp phiếu người khác. |
| `stock.js`, `rescue.js` | Nhập hàng, hạn hàng tươi (FIFO), "Nhập + ướp đủ", đồ nghề, gói ký gửi Cô Ba (cả khi kho đầy), hết hàng giữa ca (chạy chợ 12 giây, Anh Sáu 20 giây, mượn, ướp gấp, bánh mì sườn, treo bảng hết, bỏ qua), bao than dự phòng. |
| `shift.js` | Lịch khách theo nhịp ca, mở / đóng ca (90 giây ân hạn rồi tự trả tiền), hao cuối ca, phí ca, chốt lời lỗ, sang ngày. Ca trưa là dữ liệu (cấp 5). |
| `apply.js` | Cửa duy nhất; bất biến gồm bảo toàn dĩa (sạch + dơ + đang bày + đang bưng + trên bàn = số dĩa quán có). |

**Hiển thị:** cảnh thật + lớp che quầy, bàn / ghế / khách ngồi (lật theo `face`) / dĩa đang ăn / ly trà theo `placements`, cô chủ đi theo lối đi
(sau quầy thì nằm sau lớp che), bếp + miếng trên vỉ theo `grill.slots`, thiết bị ×0,5 (equipment vẽ to trong ô 192), kệ sau nằm sau cô chủ.
Thanh Bếp (6 chip vòng hai nửa, Than, Quạt giữ, Cơm, Dĩa sạch, Mỡ hành), Cột Dĩa (thanh phiếu màu bàn, dĩa xếp lớp `plate-layers`, dải lớp,
Hoàn tác / Đổ / Giao, phiếu tính tiền, việc ở bàn), dock mobile (Dĩa · Bàn · Bếp · Kho · Sổ). Gợi ý + thông báo nằm đầu khung cảnh (đáy cảnh là
hàng bàn trước và chỗ shipper, không được che). Mobile: camera dồn phải để thấy chỗ chờ + mọi bàn, hệ số 1,0 thiết bị.

**Âm thanh:** `ui/sfx.js` theo Bánh Mì, `wgp.muted` + `qct.music`; `AVAILABLE` rỗng ⇒ im lặng an toàn tới khi Codex giao `assets/audio/*.mp3`.

**Nội dung:** 18 câu gọi món chung + 5 câu × 11 vai; 13 kiểu lỗi × (6 câu chung + biến thể vai) câu khách nói và × (6–8 + biến thể) câu review;
review 1–5 sao (6–10 câu chung + theo vai); câu tới quán, chờ bàn, gọi trà, gọi thêm, tính tiền, vui / buồn, bỏ về, hết món, như hôm qua.

**Test:** `node --test "test/*.test.mjs"` (55 test: bếp, bày dĩa + biến thể, phục vụ + đi bộ + tính tiền, 13 lỗi, bản lưu, không kẹt
6 ngày × 3 hạt × 2 kiểu người chơi, thoại không lặp, manifest khớp + tên frame trong spec + giá vốn). E2E: `PORT=8851 node server.js` rồi
`PORT=8851 node prototype/games/quan-com-tam/test/e2e.mjs <thư mục ảnh>`.

**Còn thiếu / để M3–M5:**
- Cân bằng: người chơi "ẩu" (bot) lỗ ở ngày 2+ vì cháy nhiều; người chăm có lời. Vùng chín 100–114 ở vùng nóng chỉ ~0,7 giây — núm chỉnh M5.
- Chưa có: nhiệm vụ, drama, trả lời review, Nhật Ký, sổ nợ / ghi sổ, đơn đặt trước, mâm cơm, phụ bàn Bông, lên quán, trang trí, cơm chiên từ cơm dư, ghép bàn, bày ×N, ca trưa chơi được (mới là dữ liệu), nồi canh + chén canh, chảo / xửng có UI riêng (chỉ nút ở bảng Bếp mobile), bếp lớn HD.
- Chưa dùng ảnh đợt 2 (`plate-layers-hd`, `grill-items-hd` sẽ tự dùng khi có vì cùng tên frame).
- Thời gian thực ngày 1 ≈ 4–5 phút; chưa đo người thật.

## M3 · phần A: tiến trình + kinh tế (agent A)

**Code:** `core/progression.js` (luật), `core/progression-actions.js` (thao tác gộp vào `apply`), `data/lines-progress.js` (câu + review theo cơ chế),
`ui/progress-ui.js` (tab Chuẩn bị, chốt ca, sổ nợ, hộp nhiệm vụ, thông báo). Móc một dòng `// A:` ở `core/apply.js`, `core/shift.js`
(onStart / onTick / beforeEnd / afterEnd / onNextDay), `core/tables.js`, `core/plate.js`, `core/bill.js`, `core/grill.js`, `core/state.js`,
`ui/overlays.js`, `ui/column.js`, `ui/grillbar.js`, `render/scene.js`, `render/atlas.js`, `game.js`.

| Cơ chế | Cấp | Ghi chú |
|---|---:|---|
| Chảo trứng / xửng hấp chả có UI | 2 / 4 | Thanh Bếp desktop: nút Chảo (trạng thái + thanh giây, sáng khi lòng đào / lòng vừa), nút Xửng (chả chín, giây còn hấp). Mobile: bảng Bếp. Phím `E` chiên trứng khi ô bày trống. |
| Cơm chiên từ cơm dư | 2 | Cuối ngày: 50% cơm dư (tối đa 6) ⇒ `s.friedRice`; sáng mai món `com-chien` (20k) vào menu, mỗi phiếu giữ một phần; bày không lấy cơm nồi. |
| Nhiệm vụ ngày | 2 | 3 mục / ca từ `MISSIONS`; thưởng XP + tiền một lần; mục "xử lý tình huống" đếm sự kiện `dramaResolved` / `dramaDone` (agent B phát). |
| Ca trưa | 5 | Chọn ở tab Ca: chỉ trưa / chỉ tối / cả hai. Khách dồn 12–62% ca, shipper 1–3 hộp, câu + review riêng cho dân văn phòng. |
| Ghép bàn | 5 | Vỉa hè: nhóm 3–4 ngồi hai bàn 2 cạnh nhau (`joinWith`); bàn ghép `joinOf`, không nhận việc riêng; khách về thì cả hai dơ. |
| Nồi canh | 5 | Nồi 30 chén / ca, bưng kèm dĩa; hết canh ⇒ mất 3 điểm phục vụ. |
| Ghi sổ | 6 | Lúc mở phiếu tính tiền, khách quen (vai `regular`, hoặc thợ / tài xế ăn vui ≥ 3 lần) 40% xin ghi sổ ⇒ nút "Cho ghi sổ" / "Xin trả liền" trên phiếu. Hạn mức 150 / 300 / 500k, tối đa 5 lần mỗi người. Sang ngày: mỗi người nợ 25% trả hết (review đã trả), nợ ≥ 14 ngày 6% quên luôn. Sổ: xoá nợ (+1 danh tiếng). Agent B trả nợ qua sự kiện: `payDebt(s, regularId(name), ev)`. |
| Lên quán | 7 | Tab Đồ nghề / cột phải: "Thuê mặt bằng 350k". `s.stage = "quan"` ⇒ `quan-scene` + `quan-foreground` theo placements không tiền tố của Codex, nồi lớn 20, ≥ 16 dĩa, kho 140, bàn q1–q3 (q4 cấp 10 / q5 cấp 13 phải mua). Giữ đồ + kho; `s.streetMemory` (kỷ niệm vỉa hè). |
| Đơn đặt trước / mâm cơm công ty | 7 / 10 | Tab Đơn đặt (ở quán): tối đa 2 đơn / ngày, cọc 30%. Phiếu "Mâm cơm ×N" trên thanh phiếu (hộp + bịch nước mắm); **bày ×N**: một chạm lấy 2 hộp (ô bày đôi) / 4 hộp (khay mâm), mỗi lớp áp cho cả hàng. Giao đủ đúng giờ ⇒ trả phần còn lại; trễ ≤ 30 giây −10%, hơn −30%; quá hạn + 45 giây ⇒ khách lấy phần đã xong, trả 70%. |
| Gà nướng, sườn non, cơm chay, lạp xưởng | 8 / 10 / 11 / 13 | Món + nguyên liệu theo bảng (chưa có chỗ nướng chay riêng). |
| Phụ bàn Bông | 9 | Thuê theo ngày (40k mỗi ca mở). Tự đi châm trà bàn cạn ly và dọn + lau bàn dơ (không trùng việc cô chủ đã giao); không bao giờ đứng yên khi còn việc (test). |
| Chú Hòa | 9 | Tab Nhập hàng: gói gấp đôi rẻ 10%, chỉ trước ca. |
| Hạng quán, nước mắm nhà pha | 10 / 15 | Tab Hạng quán: 8 bậc (+1 khách / ca, kiên nhẫn +2% mỗi bậc); nước mắm 3 bậc (+1k mỗi dĩa, `ticket.plus`). |
| Quảng bá | 11 | Tờ rơi (+4 sinh viên), check-in (+2 khách), livestream hên xui; 1 lần / ngày. |
| Quạt máy, nồi cơm thứ hai | 12 | Nút Quạt máy trên Thanh Bếp (+1 nấc, than ×1,5, khói ×0,6); nồi +20 phần. Chụp hút khói (cấp 8, quán): khói ×0,4. |
| Dì Năm rửa chén | 13 | 25k / ca, rửa 1 dĩa mỗi 2 giây. |
| Tủ mát, tủ chén, hộp tính tiền | 14 / 13 / 15 | Kho 200, 24 dĩa, tự cộng phiếu (có sẵn từ M2). |
| Quán nổi tiếng, ghế chờ | 16 | Bảng hiệu bậc 3 ⇒ `isFamous` (+2 khách); ghế chờ: 4 người chờ, kiên nhẫn +10%. |
| Ca khuya kéo dài | 17 | Tab Ca: bật / tắt; ca tối +45 giây, khuya +25% khách. |
| Trang trí kéo thả | 4 / 7 | Tab Trang trí: mua; ở quán kéo đồ trên hình quán (đồ treo ở tường, đồ sàn không đè bàn ghế / lối đi / chỗ chờ). Hấp dẫn trần 3 (4 từ cấp 19) ⇒ khách thêm. Hình dự phòng tới khi Codex giao `decor.webp`. |
| Thời tiết | 5+ | Mưa 15% / ngày: vỉa hè −40% khách (mái bạt −15%), quán −15%. |
| Chơi lại ngày hôm nay | luôn | Ở Tạm dừng, Chốt ngày và Cách chơi; có xác nhận; bản hiện tại cất ở `….before-replay`. |

**Hệ số hiện thiết bị là dữ liệu:** `data/scene.js` `SHEET_SCALE` (equipment ×0,5; ly trà ×0,5) chỉ áp khi manifest còn đúng bản đợt 1
(dấu vân tay `productionStatus` + `dimensions`). Codex giao bản vẽ đúng thước ⇒ tự ×1. Muốn ép số khác: ghi `displayScale` trên item trong manifest.

**Khoá trạng thái mới** (`core/state.js` khối `// --- A: progression ---`, mặc định + đọc bản lưu cũ ở `freshA()` / `loadA()`):
`debts`, `debtNews`, `tabVisits`, `orders`, `offers`, `nextOrder`, `tier`, `fishSauce`, `staff`, `promo`, `followers`, `buzz`, `decor`, `placement`,
`streetMemory`, `friedRice`, `weather`, `lateShift`. Trong ca: `sh.a`, `sh.missions`, `sh.helper`, `sh.dishwasher`, `sh.soup`, `slot.batch`, `ticket.catering / n / plus`,
`table.joined / joinOf`, `grill.blower / hood`. Không đổi phiên bản bản lưu.

**Bếp than thứ hai** (cấp 14, quán): +6 chỗ (chỗ 6–11, cùng luật vùng, chung than), vẽ ở `grill-2` (kệ sau); Thanh Bếp có nút đổi chip bếp 1 / bếp 2, phím `Shift+1..6`.

**Test phần A:** `test/progression.test.mjs` (22 test). E2E: `test/e2e-m3a.mjs` (gọi từ `test/e2e.mjs`; `M3_ONLY=1` chỉ chạy phần M3, `SKIP_M3=1` bỏ qua).
Bot test (`test/helpers.mjs`) biết hấp chả và ghép bàn.

**Còn thiếu (phần A):** chỗ nướng chay riêng; chảo đôi chưa chiên 2 trứng cùng lúc (mua được, chưa có luật); tủ kính giữ ấm chưa có luật;
"+1 điểm kỳ vọng" của nước mắm nhà pha chưa cộng vào điểm; than riêng cho bếp 2; bày ×N cho bàn 4 người cùng món (mới có cho mâm cơm);
ở quán, nhãn "n người" của các nhóm đứng chờ sát cửa chồng lên nhau ở 390 px; "Nhập + ướp đủ" ở vỉa hè cấp 5–6 có thể hết chỗ kho 80 trước khi mua chả / bì.

### Cờ dùng chung

Agent A ghi bằng `s.flags = s.flags || {}; s.flags[name] = value;` (agent B đọc qua `core/flags.js`). "Ngày" = số ngày `s.day` lúc ghi; 0 = tắt.

| Cờ | Giá trị | Khi nào |
|---|---|---|
| `ghiso-open` | số lần ghi sổ chưa trả (tổng) | Mỗi lần ghi sổ / trả nợ / xoá nợ / quên nợ. |
| `ghiso-unpaid-<regularId>` | số tiền còn nợ (k), 0 khi hết nợ | Như trên. `regularId` = tên bỏ dấu nối gạch (`Chú Tư` ⇒ `chu-tu`), hàm `regularId(name)`. |
| `catering-active` | ngày có đơn đặt / mâm cơm đang mở, 0 khi giao xong hết | Mở ca có đơn; giao xong / sang ngày ⇒ 0. |
| `catering-late` | ngày có đơn trễ | Đơn quá giờ hẹn (lúc trễ và lúc chốt). |
| `quan-moved` | ngày thuê mặt bằng | Thuê mặt bằng lên quán. |
| `lunch-today` | ngày có mở ca trưa, 0 nếu không | Mở ca / sang ngày. |
| `helper-bong` | ngày thuê Bông, 0 nếu không | Thuê / thôi thuê; sang ngày ⇒ 0. |
| `charcoal-low` | ngày | Than trên bếp xuống dưới 25 trong ca. |
| `smoke-high` | ngày | Khói ≥ 70 trong lúc đang quạt (tay hoặc quạt máy). |
| `rain-today` | ngày mưa, 0 khi khô | Tung thời tiết lúc sang ngày / mở ca. |

## Ghi chú cho dev (M1 trở đi)

- **Chép từ Bánh Mì:**

  | File | Phần cần chép |
  |---|---|
  | `core/apply.js` | Bản nháp + bất biến |
  | `core/state.js` | MIGRATIONS, kẹp |
  | `core/rng.js` | |
  | `core/text.js` | freshLine |
  | `core/flags.js`, `core/drama.js`, `core/reviews.js`, `core/journal.js`, `core/missions.js` | |
  | `core/expiry.js` | Lô hàng |
  | `core/contracts.js` | Hợp đồng định kỳ |
  | `core/partial.js` | Khách lấy phần đã xong |
  | `core/placements.js` | |
  | `render/atlas.js` | crisp, snap, HD, LAZY, placeholder |
  | `render/scene.js` | Camera bội 0,5, `CHAR_H = 288`, `placeBubble` |
  | `ui/sfx.js` | |
  | `save.js` | |
  | `test/cdp.mjs`, `test/e2e*.mjs`, `tools/sim/` | |

- **Mới so với Bánh Mì:**

  | File | Việc |
  |---|---|
  | `core/grill.js` | Chỗ, vùng, 2 mặt, than, quạt, khói, giữ ấm |
  | `core/rice.js` | Nồi, gạo tấm, mỡ hành, chảo, xửng, canh |
  | `core/plate.js` | Bày dĩa: dây chuyền lớp, thay `board.js` |
  | `core/tables.js` | Vòng bàn 8 bước, ghép bàn, dĩa sạch, rửa chén, việc của Bông |
  | `core/bill.js` | Tính tiền, sổ nợ |
  | `core/walker.js` | Chủ quán / Bông đi theo `aisle` + `servePoint`; thời gian đi tính vào ca |
  | `render/tables.js` | Vẽ bàn, ghế, khách ngồi lật theo `face`, `plate-eating` trên `plateSpots`; sắp lớp theo y chân |

- **Bếp dừng khi hội thoại / bảng phủ mở** (cùng đồng hồ ca). Lật được trong lúc ô bày đang mở; test bắt buộc.
- **Khách ngồi:**
  - Frame `<vai>-sit-*` vẽ quay phải.
  - Ghế có `face: "left"` thì vẽ lật ngang. Lật bằng `scale(-1,1)` quanh anchor x, vẫn snap lưới 2 px.
- **Thiếu frame thì vẽ hình dự phòng** cùng ô + anchor (`render/placeholder.js`).
  - Khách ngồi chưa có: vẽ dáng `waiting` cắt ngang hông, đặt thấp xuống 50 px.
- **Mọi import** mang tag `?v=c1` (đổi cùng lúc khi deploy có đổi API).
- `CHAR_H = 288` (`render/scene.js`); ô nhân vật 216×288 hiện ×1.

## Quyết định cần chủ dự án

1. **Hai ca (trưa + tối), người chơi chọn mở ca nào** từ cấp 5. Phương án khác: chỉ một ca tối có ba nhịp. Gọn hơn, ngày ngắn hơn (5 phút), nhưng mất nhịp "dân văn phòng dồn 45 phút".
2. **Chủ quán đi thật trong cảnh** (bưng, dọn, rửa chén tốn thời gian di chuyển, bếp vẫn chạy). Đây là nét căng thẳng chính. Phương án khác: bưng tức thì, chỉ tốn một chạm. Dễ hơn nhưng mất cái hay "bưng ra bàn xa thì sườn cháy".
3. **Chủ quán nữ như thumbnail** (khăn chàm), không có lựa chọn chủ nam.
4. **Tính tiền tay** (chạm cộng từng dòng), ngày 1–3 có nút "Tính đúng", hộp tính tiền ở cấp 15. Không làm thối tiền như Bánh Mì, để hai game khác nhau.
5. **Khối lượng asset**: 33 sheet / 777 frame, nhiều nhất trong ba game. Phần thêm chủ yếu do khách ngồi (60 frame), bếp và món trên vỉ (51), bàn ghế (22), và hai vai biến thể `worker2` / `student2` để nhóm khách không là bản sao.
   - Giữ nguyên, hoặc bỏ `worker2` / `student2`. Bỏ thì bớt 48 frame, code sẽ đổi màu áo bằng bảng màu.

## Cần Codex

Mọi sheet ở `asset-spec.json`, mô tả ở `ART-DIRECTION.md` mục 8.

**Ghi vào `docs/quan-com-tam/asset-manifest.json`:**
- `filename`, `dimensions`, `frames{name:{rect,anchor}}`, `animations{name:{frames,fps,loop}}`.
- `sceneScale` cho 2 cảnh.
- `placements`:
  - 74 khoá `at`;
  - `door`, `queueSpots`, `waitSpots`, `exitPath`, `tables`, `aisle`;
  - `streetEntry`, `streetQueueSpots`, `streetWaitSpots`, `streetExitPath`, `streetTables`, `streetAisle`;
  - `grill.slots` / `street-grill.slots` nếu khác đề xuất.

| # | Sheet | Ô · anchor · lưới | Đợt |
|---:|---|---|---:|
| 1 | `assets/street-scene.webp`, `assets/street-foreground.webp` | 1280×720 · 2× | 1 (đang vẽ) |
| 2 | `assets/quan-scene.webp`, `assets/quan-foreground.webp` | 1280×720 · 2× | 1 (đang vẽ) |
| 3 | `assets/title-art.webp` | 1280×720 · 2× | 1 |
| 4 | `assets/characters.webp` | 216×288 · [108,262] · 2× | 1 |
| 5 | `assets/customer-walk-cycles.webp` | 216×288 · [108,262] · 2× | 1 |
| 6 | `assets/customer-reactions.webp` | 216×288 · [108,262] · 2× | 1 |
| 7 | `assets/customer-actions.webp` | 216×288 · [108,262] · 2× | 1 |
| 8 | `assets/customer-seated.webp` | 216×288 · [108,262] · 2× (cao 190–232) | 1 |
| 9 | `assets/owner-scene.webp` | 216×288 · [108,262] · 2× | 1 |
| 10 | `assets/helper-scene.webp` | 216×288 · [108,262] · 2× | 1 |
| 11 | `assets/grill.webp` | 320×192 · [160,176] · 2× | 1 |
| 12 | `assets/grill-items.webp` | 96×64 · [48,52] · 2× | 1 |
| 13 | `assets/plate-layers.webp` | 160×192 · [80,174] · 2× | 1 |
| 14 | `assets/equipment.webp` | 192×192 · [96,168] · 2× | 1 |
| 15 | `assets/tables.webp` | 320×224 · [160,208] · 2× | 1 |
| 16 | `assets/table-items.webp` | 96×96 · [48,84] · 2× | 1 |
| 17 | `assets/ingredients.webp` | 64×64 · [32,32] · 2× | 1 |
| 18 | `assets/bills.webp` | 96×48 · [48,24] · 2× | 1 |
| 19 | `assets/fx.webp` | 96×96 · [48,48] · 2× | 1 |
| 20 | `assets/ui-icons.webp` | 48×48 · [24,42] · 2× | 1 |
| 21 | `assets/owner-actions-hd.webp` | 320×320 · [160,316] · 1× | 2 |
| 22 | `assets/plate-layers-hd.webp` | 320×384 · [160,348] · 1× | 2 |
| 23 | `assets/grill-hd.webp` | 640×320 · [320,304] · 1× | 2 |
| 24 | `assets/grill-items-hd.webp` | 192×128 · [96,104] · 1× | 2 |
| 25 | `assets/portraits-hd.webp` | 384×320 · [192,308] · 1× | 2 |
| 26 | `assets/portrait-expressions-hd.webp` | 384×320 · [192,308] · 1× | 2 |
| 27 | `assets/drama-portraits-hd.webp` | 384×320 · [192,308] · 1× | 2 |
| 28 | `assets/weather-fx.webp` | 640×360 · [0,0] · 2× (alpha mềm được) | 2 |
| 29 | `assets/fixtures.webp` | 384×256 · [192,240] · 2× | 2 |
| 30 | `assets/decor.webp` | 128×128 · [64,120] · 2× | 2 |
| 31 | `assets/journal-card.webp` | 1080×1350 · 2× | 2 |

## Câu nhắn gửi Codex

### Đợt 1: nhân vật và phần còn lại (gửi SAU KHI chủ dự án duyệt 2 cảnh)

```
Quán Cơm Tấm (quan-com-tam) — ĐỢT 1, phần nhân vật và đồ. Pull master.

Bối cảnh: bạn đang / đã vẽ 4 tranh cảnh assets/street-scene.webp, street-foreground.webp,
quan-scene.webp, quan-foreground.webp (1280×720, lưới 2×, người 1,65 m ≈ 260 px, cửa ≈ 330,
mặt quầy ≈ 150, mặt bàn ≈ 120). Chủ dự án đã duyệt 2 cảnh. Giờ vẽ phần còn lại CÙNG THƯỚC đó.

1. Đọc AGENTS.md, docs/tap-lam-chu/PLAYBOOK.md §1 và §2 (nhất là §1.2b: cảnh và người cùng thước).
2. Hợp đồng: docs/quan-com-tam/asset-spec.json — các sheet "wave": 1.
   Mô tả, bảng màu, thước đo, thứ tự lớp dĩa, toạ độ đề xuất: docs/quan-com-tam/ART-DIRECTION.md (mục 0, 4–8).
3. Mẫu art: prototype/homepage/assets/thumbs/quan-com-tam.webp. Chủ quán là NỮ, khăn chàm, tạp dề nâu,
   khăn trắng vắt vai, như thumbnail.
4. Vẽ vào prototype/games/quan-com-tam/assets/. Ghi manifest vào docs/quan-com-tam/asset-manifest.json.
5. Sheet đợt 1 còn lại:
   title-art (1280×720);
   characters, customer-walk-cycles, customer-reactions, customer-actions, owner-scene, helper-scene
     (ô 216×288, anchor [108,262], người đứng cao 235–275 px; 13 vai: owner, helper, office, worker,
     worker2, student, student2, shipper, regular, reviewer, driver, nurse, tourist);
   customer-seated (cùng ô + anchor; khách NGỒI trên ghế nhựa, vẽ luôn ghế, quay 3/4 sang PHẢI,
     anchor = chân ghế chạm sàn, cao 190–232 px; 10 vai, không có shipper;
     sit-eat-1..2, sit-wait, sit-call, sit-happy, sit-annoyed);
   grill (320×192), grill-items (96×64: sườn, sườn non, gà, lạp xưởng, đậu hũ × sống / tái / chín /
     cháy cạnh / cháy + lật 2 khung; trứng 5 độ);
   plate-layers (160×192: mọi lớp vẽ trên CÙNG một khung dĩa / hộp để chồng khít);
   equipment (192×192), tables (320×224: bàn 2 và 4 chỗ × sạch / bày sẵn / dơ / ướt, không kèm ghế),
   table-items (96×96: ghế, dĩa đang ăn, ly trà…), ingredients (64×64), bills (96×48), fx (96×96),
   ui-icons (48×48).
6. Luật cứng: lưới 2×, alpha cứng, WebP lossless, cùng mật độ điểm vẽ với cảnh; mọi frame một vai cao bằng
   nhau ±8%; mỗi vai là CÙNG MỘT NGƯỜI trên mọi sheet (đứng, đi, ngồi); worker2 / student2 là người
   KHÁC worker / student; không chữ, logo, thương hiệu, người thật.
7. manifest: sceneScale["assets/street-scene.webp"].humanHeight và ["assets/quan-scene.webp"].humanHeight
   (đo theo cửa / quầy trong cảnh của bạn, dự kiến 260); placements.<khoá>.at đủ 74 khoá;
   door, queueSpots, waitSpots, exitPath, aisle, tables (mỗi bàn: id, seats, unlock, at, seatSpots[{at,face}],
   plateSpots, servePoint) và street- tương ứng (streetEntry, streetQueueSpots, streetWaitSpots,
   streetExitPath, streetAisle, streetTables có joinWith). Đề xuất ở ART-DIRECTION §7.1–7.2; đặt theo
   tranh thật của bạn (bàn không đè cột / chậu vẽ sẵn, lối đi không bị chắn).
8. Chạy: python -I tools/asset-check/check_assets.py docs/quan-com-tam/asset-spec.json --preview <thư mục tạm>
   đến "0 lỗi — ĐẠT" (cảnh báo chỉ được là các sheet wave 2 tuỳ chọn). Mở nhan-vat-xep-hang-x2.png soi:
   người đứng / ngồi so với cửa, quầy, bàn trong cảnh; mỗi vai giữ cùng một người.
9. Dán kết quả + commit hash vào docs/quan-com-tam/ASSET-HANDOFF.md, commit lên branch riêng rồi báo.
```

### Đợt 2 (gửi khi code tới M3)

```
Quán Cơm Tấm ĐỢT 2. Pull master. Trong docs/quan-com-tam/asset-spec.json, bỏ "optional": true ở các sheet
"wave": 2 rồi vẽ:
owner-actions-hd (320×320, lưới 1×: thân trên chủ quán, cùng người với owner-scene),
plate-layers-hd (320×384, lưới 1×, CÙNG tên lớp và bố cục với plate-layers),
grill-hd (640×320, lưới 1×) + grill-items-hd (192×128, lưới 1×, cùng tên frame với grill-items),
portraits-hd, portrait-expressions-hd, drama-portraits-hd (384×320, lưới 1×; 12 NPC ở DRAMA.md §1 —
  "bong" là cùng người với helper; "chu-tu" cùng kiểu người với worker; "anh-sau" xe ôm khác driver),
weather-fx (640×360: mưa, chớp, nước tràn vỉa hè, khói bếp dày, cúp điện),
fixtures (384×256), decor (128×128, 14 món), journal-card (1080×1350).
Cùng luật như đợt 1. Chạy check_assets đến 0 lỗi, soi ảnh, dán kết quả vào ASSET-HANDOFF.md rồi báo.
```

## Kiểm hợp đồng (M0)

`python -I tools/asset-check/check_assets.py docs/quan-com-tam/asset-spec.json`:
- Chạy được, đọc manifest qua `../../../docs/quan-com-tam/asset-manifest.json`.
- Báo 110 lỗi, đúng dự kiến khi chưa có art:
  - 22 file đợt 1 chưa có;
  - 2 `sceneScale` chưa ghi;
  - 74 toạ độ đặt;
  - 12 khoá đường đi / bàn.
- 11 cảnh báo cho sheet đợt 2 (tuỳ chọn về mặt script nhưng vẫn phải vẽ).
- Mọi mẫu tên frame mở rộng đúng, không trùng tên trong cùng sheet (777 frame).
