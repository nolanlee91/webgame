# Quán Cơm Tấm · Ghi chú phát triển

**Vị trí và chuẩn:**
- Game ở `prototype/games/quan-com-tam/` (M1 + M2 lõi, chưa có thẻ trang chủ).
- Lưu ở `localStorage["wgp.quancomtam.v1"]`. Khoá giữ nguyên. Từ bản gộp M3 + M4, phiên bản trong bản lưu là `v: 2`; từ M5 (S) là `v: 3` (bảng XP mới, giữ cấp + %). Bản cũ được chép nguyên văn sang `….bak-v<cũ>` một lần trước khi nâng.
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
| M3 · Kinh tế + nội dung cơ chế | **Xong (gộp, branch `claude/qct-int`)** | Phần A: 20 cấp, ca trưa, ghi sổ, lên quán, đơn đặt / mâm cơm, Bông, nhiệm vụ, trang trí, hạng quán… Xem "M3 + M4 gộp" và "M3 · phần A". |
| M4 · Drama + review + Nhật Ký | **Xong (gộp, branch `claude/qct-int`)** | Phần B: Drama, 104 sự kiện. Phần C: review, tính cách, Sổ, Nhật Ký. Xem "M3 + M4 gộp". |
| M5 · Polish + cân bằng | **Phần S xong** (branch `claude/qct5-s`, chưa gộp); phần V (hình + tiếng) làm song song | S: bộ mô phỏng + cân bằng, kho vỉa hè, vỉ chay, tủ kính, nước mắm nhà pha vào điểm, bếp 2 than riêng, bày ×N cho bàn, nợ Drama chung sổ, trang trí Drama, hội chợ, thử thách + 14 huy hiệu, bản lưu v3. Xem "M5 · phần S". |

## M5 · phần S: cân bằng + lối chơi (agent S, branch `claude/qct5-s`)

Làm song song với agent V (hình + tiếng) trên bd5b283. S không đụng `render/`, `ui/`, `game.js`, `index.html`, `data/scene.js` trừ các móc `// S:` tối thiểu (liệt kê dưới). Không đổi tag `?v=`.

### Bộ mô phỏng `tools/sim/`

Chép khung Bánh Mì: `harness.mjs` (người chơi giả), `profiles.mjs` (cẩn thận / trung bình / ẩu), `sim.mjs`, `report.mjs` (gộp kết quả chạy song song), `fit.mjs` (dò bảng XP), `sim.test.mjs` (hồi quy đầy đủ), `README.md`, `report.md`. Hồi quy rút gọn chạy cùng bộ test: `test/sim.test.mjs`.
- Mọi thao tác qua `core/apply.js`, toạ độ cảnh từ manifest thật. Người chơi giả bấm thật: mời ngồi, châm trà + lấy phiếu, nướng (lật trễ theo hồ sơ, giữ ấm, tủ kính), bày từng lớp (quên lớp / sót dặn theo hồ sơ), bưng, tính tiền tay (chạm nhầm theo hồ sơ), dọn, rửa, nồi cơm, mỡ hành, chảo, xửng; ca trưa + tối từ cấp 5, ghi sổ, lên quán cấp 7, đơn đặt / mâm cơm, Bông / Dì Năm, quảng bá, hạng quán, nước mắm, hội chợ, thử thách, Drama + trả lời review.
- Báo cáo: mốc cấp theo phút chơi, tiền + lời theo ngày, kẹt, bỏ về, hao, ký gửi, hết hàng giữa ca.

### Lỗi bộ mô phỏng tìm ra (đã sửa)

| Lỗi | Hậu quả | Sửa |
|---|---|---|
| Gói học (đồ chua, dưa leo, sườn), gói ký gửi, hàng mượn, hàng chở tới, quà Drama không ghi lô hạn dùng | Hết hạn ngay đêm đầu: ngày 2 mất sạch đồ chua / dưa leo, ký gửi xong hôm sau mất | `addLot()` ở mọi chỗ cộng kho (`core/stock.js`) |
| Hết trứng / hết chả / hết hộp khi bày chỉ báo lỗi | Phiếu kẹt ở bước trứng / chả / hộp, người chơi không có lối ra trừ "Hết món" | Mở hội thoại hết hàng như món khác (`eggAct`, `steamAct`, `outToDialog`) |
| "Nhập + ướp đủ" mua than sau món phụ | Ít tiền thì sáng mai không nhóm nổi bếp ⇒ cả ngày không bán được ⇒ lụn bại | Than ngay sau sườn + gạo; ký gửi có 3 rổ than (bản cũ 1, không đủ nhóm bếp); "làm nổi một dĩa" cần 2 rổ đầu ngày |
| "Nhập + ướp đủ" chỉ giữ 4 hộp | Ca trưa (shipper lấy 1–3 hộp) và mâm cơm hết hộp giữa ca | Hộp theo khách mang về dự kiến + số phần đơn đặt / mâm hôm nay |
| Tab Menu ghi "tắt món nào thì khách không gọi" nhưng không có nút | Ít tiền không nhập đủ bì / chả / trứng mà khách vẫn gọi ⇒ hết hàng liên tục | Thao tác `toggleDish` + nút "Tắt món / Bán lại" |
| Có thể kẹt ca (sim: nhóm đã trả tiền mà chưa đứng dậy khi hội thoại tính dư bị bỏ dở; t = 17.500 giây) | Ca không bao giờ chốt | Chốt chặn: quá giờ đóng + 90 + 30 giây thì mọi nhóm còn lại tự trả / về |
| Bày ×N cho bàn: dĩa thứ 2–4 không được đếm | Lỗi bất biến bảo toàn dĩa | `platesInPlay` đếm `slot.batch` |

### Cân bằng

Bảng trước / sau ở `ECONOMY.md` mục 13 "Cân bằng M5" và cuối `tools/sim/report.md`. Tóm tắt (cẩn thận / trung bình / ẩu, phút chơi):

| Mốc | Mục tiêu | Trước M5 | Sau M5 |
|---|---|---|---|
| Cấp 4 | ≈ 10 | 22 / 19 / 16 | 13 / 11 / 10 |
| Cấp 7 (lên quán) | ≈ 40 | 182 / 91 / 82 | 40 / 44 / 41 |
| Cấp 10 | ≈ 120 | — / 427 / — | 111 / 132 / 151 |
| Cấp 20 | 600–720 | không tới (120 ngày) | 531 / 659 / 667 |
| Bỏ về | ≤ 12% | 59 / 52 / 57% | 15 / 19 / 25% |
| Ký gửi (lần) | ít | 105 / 65 / 97 | 0 / 0 / 5 |
| Cuối lượt | còn chỗ tiêu | hết tiền cả ba | 3.728k · 5/8 hạng / 915k · 2/8 / 694k · 2/8 |

Đổi số (data/economy.js, lý do ở ECONOMY §13): giá bán +20%, phí ca nhẹ hơn, cô chủ đi 400 px/giây, châm trà / dọn nhanh hơn, bưng 2 dĩa một chuyến, ăn 18–30 giây, kiên nhẫn ×1,25 (+×1,4 khi đã ngồi), vùng chín rộng hơn, giữ ấm 75 giây, khách / ca tăng chậm hơn, dự báo nhập 85%, ký gửi 3 rổ than, hạn mức ghi sổ 200 / 360 / 600k, hạng quán + nước mắm ×0,5, Bông 35k, bảng XP mới.

### Kho vỉa hè cấp 5–6 (chủ dự án để S chọn)

**Chọn: đồ chua + dưa leo không tính sức chứa** (như rau của Bánh Mì). Lý do (sim):
- Kho 80 bị gói 20 của đồ chua + dưa leo chiếm tới 40 chỗ: ở cấp 2–6 "Nhập + ướp đủ" hết chỗ trước khi mua trứng / bì / chả ⇒ món mới mở không bán được.
- Tăng sức chứa vỉa hè làm mất mốc "lên quán có kho lớn"; gói nhỏ hơn cho hàng tươi làm người chơi bấm nhập nhiều lần mà vẫn tốn chỗ.
- Sau khi bỏ hai món này khỏi sức chứa, kho vỉa hè đầy sau khi nhập 2 / 2 ngày ở cấp 5–6 (người trung bình), nhưng không còn hụt món vì sức chứa: hết giữa ca chủ yếu là hàng không tính chỗ (nước tương, đồ chua). Đồ chua / dưa leo hết giữa ca còn 19 / 26 / 53 (cẩn thận / trung bình / ẩu, cả lượt tới cấp 20; trước M5: 34 / 93 / 4 trong 120 ngày) lần (lựa chọn "mượn" / "bỏ qua" miễn phí).

### Lối chơi còn thiếu (đã làm, `core/extras.js`)

| Khoảng trống | Luật |
|---|---|
| Chỗ nướng chay riêng | Đồ nghề "Vỉ nướng chay riêng" (cấp 11, 80k): 2 chỗ sau bếp 1 (`g.vegFrom`, vùng `veg` như vùng vừa) chỉ nướng đậu hũ. Chỗ nào đã nướng thịt trong ca là chỗ mặn (`g.meatSlots`); đậu hũ đặt / dời vào chỗ mặn ⇒ `tainted` ⇒ dĩa chay lỗi 13 (dính mặn, trần 1 sao, xin lỗi nghiêm túc). Đậu hũ tự ưu tiên vỉ chay, rồi chỗ chưa nướng thịt. Thanh Bếp: nút đổi trang xoay bếp 1 → bếp 2 → vỉ chay. |
| Tủ kính giữ ấm | Có tủ (cấp 3): vùng ấm đầy thì "dời vào vùng ấm" cất vào tủ (`sh.case`, tối đa 6), tươi giảm 1 mỗi 5 giây (vỉ 3 giây), không cháy; bày dĩa lấy miếng tủ khi vỉ không có; hoàn tác trả về tủ; cuối ca còn trong tủ là hao. |
| "+1 điểm kỳ vọng" nước mắm nhà pha | `scorePlate(..., { houseSauce })`: +1 điểm mỗi bậc khi dĩa có nước mắm (không áp dĩa chay); 20–50% review 4–5 sao đổi sang câu nước mắm nhà pha (10 câu). |
| Bếp 2 than riêng | `g.coal2` / `pending2` / lửa bùng riêng; chỗ 6–11 nướng theo than bếp 2. "Nhóm bếp" đầu ca nhóm cả hai (4 rổ); `addCoal { grill: 2 }`; nút Than trên Thanh Bếp theo trang đang xem. Bản lưu giữ `kitchen.coal2` giữa ca trưa và ca tối. |
| Bày ×N cho bàn cùng món | Có ô bày đôi (2) / khay mâm (4): ghim phiếu ⇒ nút "Bày ×N" gom phiếu cùng bàn, cùng món, cùng dặn riêng (món có trứng chiên từng quả nên không gom). Mỗi lớp áp cho cả hàng, bưng một chuyến (khay), mỗi người đúng dĩa của mình. Thêm: bưng hai dĩa cùng bàn một chuyến (`SERVICE.carryMax`, trước đây có số mà chưa dùng). |
| Nợ Anh Sáu chung sổ nợ | `fx.debt` của Drama ghi vào `s.debts` (`drama: true`): tab Sổ nợ hiện, xoá nợ được, tính vào hạn mức ghi sổ và `{debt}`; không tự trả ngẫu nhiên lúc sang ngày (trả theo chuỗi K03–K05). `s.drama.debt` không còn dùng (bản lưu cũ chuyển sang). |
| Trang trí Drama tặng | `fx.decor` ⇒ đồ kéo thả (`DECOR`, `event: true`): lá thư, bó hoa giấy, ảnh khai trương, ảnh Mai, ổ mèo, ghế nhựa cao, khung giấy khen, radio; dùng frame `decor.webp` gần giống tới khi có art riêng (`decorFrame`). "Mái bạt" của Drama = có mái bạt. Đồ Drama không bán. |
| Hội chợ (cấp 18, ở quán) | Tab Chuẩn bị "Hội chợ · Thử thách": thuê gian 180k mỗi 4 ngày ⇒ ca tối thành "Đêm hội ẩm thực bờ sông" 4 phút, +10 khách đi nhóm 2–4, giá +15% (`t.fairMul`), khách kém kiên nhẫn 10%. Câu mở gian 10, câu khách 8, review 10 / 8 / 8 (tuyệt / ổn / tệ), câu chốt 8 / 8 / 8. |
| Thử thách + huy hiệu (cấp 20) | Lịch 5 ngày xoay vòng, miễn phí: Một bếp, ca khuya · Không cháy miếng nào · Trưa không phụ bàn (hoàn lương) · Ngày toàn mang về · Mâm 40 phần (không cọc). Đạt lần đầu +150k, +60 XP, huy hiệu; lần sau +75k, +30 XP. Mỗi thử thách 8 câu đạt + 8 câu chưa đạt. 14 huy hiệu (9 + 5 thử thách) ở Sổ · Huy hiệu, xét lúc chốt ca và khi mua hạng / nước mắm; huy hiệu mới thành khoảnh khắc Nhật Ký. |

### Bản lưu v3

`SAVE_VERSION = 3`. `MIGRATIONS[2]`:
- XP đổi sang bảng mới, giữ cấp và % tiến độ trong cấp (`rescaleXp`, bảng cũ `LEVELS_V2`);
- nợ `drama.debt` vào `debts` (`drama: true`);
- đồ `drama.decor` thành đồ kéo thả;
- `save.js` chép nguyên văn bản v2 sang `wgp.quancomtam.v1.bak-v2` một lần trước khi nâng (cơ chế có sẵn).

Khoá mới: `fair { day, count }`, `challenge { id, day }`, `badges { id: ngày }`, `kitchen.coal2`; trong ca `grill.coal2 / pending2 / vegFrom / meatSlots`, `sh.case`, `sh.fair`, `sh.challengeId`, `slot.batchTks`, `task.more`, `ticket.fairMul`.

### Móc ngoài vùng S (đánh dấu `// S:`)

| File | Móc |
|---|---|
| `ui/grillbar.js` | Nhãn vùng "Vỉ chay", nút đổi trang xoay bếp 1 / bếp 2 / vỉ chay, ẩn chip thừa, nút Than theo bếp đang xem |
| `ui/progress-ui.js` | Tab "Hội chợ · Thử thách" (cấp 18+), chữ lỗi M5 |
| `ui/overlays.js` | Nút "Tắt món / Bán lại" ở tab Menu; dòng hội chợ / thử thách / huy hiệu ở bảng chốt ca; "Nhóm bếp" tính bếp 2 |
| `ui/book-tabs.js` | Danh sách 14 huy hiệu ở Sổ · Huy hiệu |
| `ui/column.js` | Nút "Bày ×N" ở đầu cột Dĩa |
| `render/scene.js` | Đồ Drama dùng frame tạm (`decorFrame`); miếng trên vỉ chay chưa vẽ trong cảnh (chỉ Thanh Bếp) |
| `ui/m5-ui.js` (mới) | Thẻ hội chợ, lịch thử thách, nút menu, nút bày ×N, huy hiệu, dòng chốt ca |

Cần V / Codex (sau): chỗ vẽ vỉ chay trong cảnh (`placements["veg-grill"]` + 2 `slots`), art riêng cho đồ Drama (lá thư, ổ mèo, ghế cao…), chữ "Tủ kính n/6" trên Thanh Bếp.

### Test

- `node --test "test/*.test.mjs"`: 133 test, đạt hết (thêm `test/m5.test.mjs` 17 test, `test/sim.test.mjs` 4 test).
- `node --test tools/sim/sim.test.mjs`: hồi quy đầy đủ tới cấp 20 (2 test, đạt; ~3,5 phút).
- E2E (`PORT=8857 node server.js`, `CDP_PORT=9489 PORT=8857 node prototype/games/quan-com-tam/test/e2e.mjs <thư mục>`): thêm `M5_ONLY=1` (vỉ chay bằng nút thật, tắt món, hội chợ, thử thách, huy hiệu). Cả 5 lần chạy tách (`DESK_PART=1`, `DESK_PART=2`, `M3_ONLY=1`, `M5_ONLY=1`, `MOBILE_ONLY=1`) ra "E2E ĐẠT", 0 lỗi console.

## M3 + M4 gộp (A + B + C, đã làm)

Ba agent làm song song trên d3db69b:
- **A**: tiến trình + kinh tế (`claude/qct-a`).
- **B**: Drama (`claude/qct-b`).
- **C**: review, tính cách, Sổ, Nhật Ký (`claude/qct-c`).

Bản gộp ở `claude/qct-int`, chưa push, chưa vào master.

**Chơi được:**
- **Tiến trình:**
  - 20 cấp, ca trưa từ cấp 5, ghép bàn, nồi canh.
  - Ghi sổ (cấp 6) có Sổ nợ. Lên quán (cấp 7, 350k).
  - Đơn đặt trước và mâm cơm công ty, bày ×N.
  - Phụ bàn Bông, Dì Năm rửa chén, Chú Hòa giao hàng.
  - Cơm chiên từ cơm dư, nhiệm vụ ngày, quảng bá, hạng quán, nước mắm nhà pha.
  - Trang trí kéo thả, thời tiết, ca khuya kéo dài, bếp 2, quạt máy, chảo đôi (2 trứng).
- **Drama:** 104 sự kiện: 58 ở DRAMA.md, 33 sự kiện cơ chế, V08–V10, R01–R10.
  - Hội thoại trong ca dừng đồng hồ. Sự kiện giữa hai ngày hiện trên bảng Chuẩn bị.
  - Có chân dung HD, cờ có hạn, mod khách, đơn đặt trước, khoảnh khắc Nhật Ký.
- **Review và Sổ:**
  - Review có lý do. Cô chủ trả lời theo 4 tính cách.
  - Sổ quản lý có 6 tab: Review · Nhật ký · Sự kiện · Nhiệm vụ · Huy hiệu · Sổ nợ.
  - Thẻ Nhật Ký 1080×1350.

**Quyết định khi gộp:**

| Chỗ chồng | Cách gộp |
|---|---|
| `followers` (A, B, C đều thêm) | Một sổ: `s.followers` + `s.hype`, khối C đọc ở `loadSocial`.<br>- A bỏ `followers` / `buzz` khỏi `freshA` / `loadA`.<br>- Quảng bá của A ghi `followers`, cộng `buzz` của gói vào `hype`.<br>- B ghi thẳng `followers` / `hype`.<br>- Review của A (`addReviewA`: mâm cơm, trả nợ) đi qua `pushReview` của C: có lý do, người theo dõi, đánh giá trung bình 20 review. |
| Đọc `s.flags` | Một bộ đọc: khối B trong `core/state.js`.<br>- Chỉ nhận `true` / số, khoá dài ≤ 60, tối đa 200 cờ.<br>- Dòng đọc cờ trong `loadA` đã bỏ. |
| Sổ | Giữ Sổ có tab của C (`ui/notebook.js`). Sổ cũ trong `ui/overlays.js` đã bỏ.<br>Tab mới cắm ở `ui/book-tabs.js`:<br>- **Sự kiện**: `s.drama.history` + `s.drama.moments`;<br>- **Nhiệm vụ**: ca đang mở / ca vừa chốt;<br>- **Huy hiệu**: cấp, giai đoạn quán, hạng, cột mốc, khách quen, kỷ niệm vỉa hè;<br>- **Sổ nợ**: `PU.book`, xoá nợ ngoài ca.<br>Ở 390 px hàng tab cuộn ngang và tự cuộn tới tab đang mở. |
| Bảng chốt ca | Giữ phần của cả hai:<br>- A: lương phụ việc, nhiệm vụ, ghi sổ, mâm cơm, cơm chiên (`PU.summary`);<br>- C: câu chốt, nút "Nhật Ký Làm Chủ", nút "Trả lời review".<br>Nút "Chơi lại ngày hôm nay" chỉ hiện một lần. |
| Thứ tự móc mở ca | 1. Lịch gốc.<br>2. A `PG.onStart`: mưa, ca trưa dồn, khách thêm, đơn mâm, nhiệm vụ.<br>3. C `onShiftStart`: khách nhờ review, khách quay lại.<br>4. B `startDrama`: khách dồn, mod, đơn đặt.<br>Mưa của A và "bớt khách" của B, C chỉ bớt khách **không nhãn**. Số khách báo lúc mở ca tính sau cùng. |
| Thứ tự móc khác | - Nhịp ca: A `onTick` trước, B `maybeTrigger` cuối nhịp (đọc cờ A vừa đặt).<br>- Chốt ca: A `afterEnd` trước C `onShiftEnd`, nên lời lỗ ngày trong Nhật Ký đã trừ lương.<br>- Sang ngày: C `onNewDay` → A `onNextDay` (sổ nợ, thời tiết, cờ) → B `endDrama`. |
| Khách có hẹn | Cửa đầy: khách thường thử 4 lần rồi đi ngang.<br>Khách quay lại (nhãn `back`) và đơn đặt / mâm (`dr:…`, `cat…`) chờ tới khi có chỗ (`keepsTrying`, `core/shift.js`).<br>Đây là gốc lỗi test "khách quay lại đã tới". |
| Đơn đặt trước | Ở quán từ cấp 7, `fx.preorder` của Drama từ 8 phần trở lên (X03, D06, K07…) thành đơn mâm thật của A (`openDramaOrder`).<br>- Có phiếu "Mâm cơm ×N", bày ×N, giờ hẹn, trễ trừ tiền.<br>- Giao đủ và đạt sao thì có cờ `flagOk`, sự kiện nối tiếp, tip của Drama.<br>Vỉa hè hoặc đơn nhỏ vẫn là nhóm khách `dr:` như cũ.<br>Đơn hẹn ca không mở hôm nay (vd mâm trưa mà chỉ mở ca tối) dồn vào ca cuối ngày. |
| Ghi sổ | - Sự kiện S03 (`fx.payDebt`) trả sổ nợ thật của khách nợ lâu nhất qua `payDebt(s, id, ev)`. Sổ trống thì vẫn +30k.<br>- `debtMin` và biến `{debt}` cộng cả sổ nợ thật (`debtTotal`).<br>- Nợ của Anh Sáu (chuỗi K03–K05, `s.drama.debt`) vẫn là chuyện riêng của Drama. |
| Nhật Ký | - Ngày lên quán (`moved`) và ngày giao trọn mâm cơm (`catering-done`) của A vào khoảnh khắc ngày qua `dayMoment`.<br>- Khoảnh khắc Drama hôm nay (`s.drama.moments`) vào Nhật Ký lúc chốt ngày.<br>- Thêm 3 nhóm câu chốt `moved` / `catering` / `drama` (`data/lines-journal.js`). |
| Bản lưu | `SAVE_VERSION = 2`.<br>- `MIGRATIONS[1]`: gộp `buzz` vào `hype`, lọc cờ rác.<br>- `save.js` chép nguyên văn `….bak-v1` một lần.<br>- Tải lại giữ các khoá thống kê mới (`debtPaid`, `ordersDone`, `missions`) và `feed[].mech`. |
| Cache | Mọi import và `index.html` dùng `?v=c2`. |

**Sửa nhỏ khi gộp:**
- **"Nhập + ướp đủ":** mua lần lượt từng gói theo vòng; món của menu (bì, chả, trứng) xếp ngay sau sườn + gạo. Kho thiếu chỗ thì chia chỗ theo tỉ lệ nhu cầu. Kho vỉa hè 80 không còn hết chỗ trước khi tới bì / chả.
- **Chảo đôi (`egg-pan-2`):** chiên trứng thứ hai khi trứng đầu còn trên chảo, gắp lần lượt.
- **Quán ở 390 px:** nhãn "n người" của các nhóm chờ sát cửa không còn chồng nhau (lùi sang trái, hết chỗ thì xếp tầng). Bong bóng thoại tránh nút nhóm chờ và bong bóng khác.
- **Test của A:** ca thử mâm cơm và ca thử cơm chiên tắt Drama trong ca (`drama.max = 0`). Drama có test riêng.

**Test:** `node --test "test/*.test.mjs"` ra 112 test, đạt hết.

`test/integration.test.mjs` (9 test):
- 10 ngày có hạt qua cấp 7: lên quán, đơn đặt, Drama, trả lời review, Nhật Ký mỗi ngày, tải lại y nguyên;
- cờ qua tải lại;
- một sổ người theo dõi;
- thứ tự móc mở ca;
- mâm cơm từ Drama;
- S03 trả nợ;
- nâng v1 → v2 + `.bak-v1`;
- chảo đôi;
- nhập hàng chia chỗ kho.

**E2E:** chạy `PORT=8855 node server.js`, rồi chạy e2e tách bốn lần cho mỗi lần dưới 3 phút:

| Biến môi trường | Phần chạy | Số kiểm | Thời gian |
|---|---|---:|---:|
| `DESKTOP_ONLY=1 DESK_PART=1` | Desktop ngày 1 bằng chạm thật; review, tính cách, 6 tab Sổ, Nhật Ký | 41 | ~2 phút 40 |
| `DESKTOP_ONLY=1 DESK_PART=2` | Tải lại giữa ca, Drama (K14, O11), chơi lại từ đầu, bản lưu hỏng | 14 | ~10 giây |
| `DESKTOP_ONLY=1 M3_ONLY=1` | Phần M3 của A (ca trưa, ghi sổ, chơi lại ngày, lên quán, mâm cơm, Bông, trang trí) | 28 | ~20 giây |
| `MOBILE_ONLY=1` | Mobile 390@3 ngày 1, M3 mobile, nhóm chờ cửa quán | 47 | ~1 phút 20 |

Mỗi lần chạy `CDP_PORT=9485 PORT=8855 node prototype/games/quan-com-tam/test/e2e.mjs <thư mục ảnh>`. Cả bốn lần đều ra "E2E ĐẠT", 0 lỗi console.
Không đặt biến môi trường thì chạy hết một lần, khoảng 4–5 phút.
Vòng chơi ngày 1 của e2e bỏ qua lỗi "ca đã chốt" khi ca tự chốt giữa hai lệnh, vì đồng hồ ca chạy thật.

**Còn thiếu sau khi gộp:**
- ~~Kho vỉa hè cấp 5–6~~ — M5 (S): đồ chua + dưa leo không tính sức chứa.
- ~~Phần A còn dở (vỉ chay, tủ kính, nước mắm vào điểm, bếp 2 than riêng, bày ×N cho bàn)~~ — M5 (S) đã làm.
- ~~Hai sổ nợ~~ — M5 (S): nợ Anh Sáu vào sổ nợ thật.
- **Nhóm chờ ở 390 px:** bong bóng không còn chỗ thì ẩn, không chồng. Chưa đo lúc có 4 nhóm chờ (ghế chờ cấp 16).
- ~~Trang trí từ Drama~~ — M5 (S): thành đồ kéo thả.
- Chưa dùng ảnh đợt 2. Chưa có thẻ trang chủ.

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
`table.joined / joinOf`, `grill.blower / hood`. Bản gộp nâng bản lưu lên v2 (xem "M3 + M4 gộp").

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
## M4 phần C: review, tính cách cô chủ, Sổ quản lý, Nhật Ký (đã làm)

**Chơi được:**
- Màn chào có 4 thẻ tính cách (Hiền lành, Cục súc, Lầy lội, Sale-man). Bản lưu cũ chưa có tính cách thì hỏi một lần trước bảng Chuẩn bị.
- Bảng chốt ngày có câu chốt Nhật Ký, nút "Trả lời review" và "Nhật Ký Làm Chủ".
- Sổ quản lý (nút Sổ / phím S): tab Review · Nhật ký · Sự kiện · Nhiệm vụ · Huy hiệu.
  - Review: chạm một review ⇒ khung trả lời. Hàng nút tính cách nằm trên các lựa chọn; bấm là đổi tính ngay và lựa chọn đổi theo.
  - Mỗi nút ghi hậu quả + "Hên xui x%" / "An toàn" / tiền. Câu trả lời lưu nguyên văn dưới review (cả trong danh sách), kèm kết quả và câu đáp lại.
  - Nhật ký: mỗi ngày một dòng (câu chốt, khoảnh khắc, số), mở thẻ 1080×1350: Lưu PNG, Chia sẻ, Ẩn tên quán, Đổi khoảnh khắc.

**Luật (`core/reviews.js`, `core/journal.js`, thuần):**
- Lý do review `r.reason`: 13 kiểu lỗi · `slow` (bỏ về / chờ món lâu, điểm thời gian ≤ 8) · `soldOut` · `takeaway` · `praise` · `charred` / `egg` (dặn cháy cạnh / lòng đào, 5 sao) · `service` (5 sao không lỗi phục vụ) · `meh` · `net` (cư dân mạng).
- Pool câu theo lý do: `reviewPool` (tables.js gọi).
- Đánh giá = trung bình 20 review gần nhất. Người theo dõi +3 mỗi review 5 sao, +1 mỗi review 4 sao.
- Độ hot `s.hype` giảm một nửa mỗi ngày.
- Khách ca sau: `trafficBonus` (−1..+5 người) + `s.nextGuests` (từ câu trả lời Sale-man). Thêm vào lịch lúc mở ca (`onShiftStart`), ngày hướng dẫn thì không.
- Trả lời: 3–4 lựa chọn mỗi tính cách theo chủ đề (`praise` / `takeaway` / `mistake` / `slow` / `meh` / `net` / `serious`).
  - Hiền lành an toàn. Cục súc đánh cược lên mạng / phốt (kèm review cư dân mạng 5 / 2 sao). Lầy lội độ hot lên xuống. Sale-man ra khách nhưng 1/4–1/3 bị chê phiền.
  - Hậu quả: tiền, người theo dõi, độ hot, danh tiếng, review cư dân mạng, khách ca sau, khách quay lại (giữ tên, nói câu quay lại), lời hứa.
  - Lời hứa: ngày tới hạn trung bình ≥ 4 sao (≥ 2 khách) thì danh tiếng +2.
- Sườn sống / dĩa chay dính mặn: mọi tính cách chỉ còn 2 lựa chọn xin lỗi nghiêm túc (hứa sửa / hoàn tiền + mời bữa khác), câu không đùa, không khuyến mãi.
- Đổi tính: lịch sử `s.persona.switches`. Đổi giữa hai lần trả lời thì 70% cư dân mạng bình luận (FLIP_LINES). Đổi 3 lần một ngày ⇒ khoảnh khắc "flip" và câu chốt ngày đổi.
- Nhật Ký: cộng dồn các ca trong ngày (`s.dayLog`), chốt ở ca cuối ngày (`onShiftEnd`) ⇒ `s.journal[0]`.
  - Câu chốt chọn theo dữ kiện (`captionKind`, 18 nhóm).
  - Trả lời lên mạng / phốt sau lúc chốt ngày vẫn thay câu chốt (`recaption`) và đưa câu trả lời lên đầu khoảnh khắc.
- Thẻ (`ui/journal.js`): nền `assets/journal-card.webp` khi manifest có, không thì nền canvas dự phòng + cắt ảnh cảnh quán.

**Nội dung:** 624 câu, tất cả qua `freshLine`.
- Trả lời: 310 câu, ở `data/lines-reply-a.js` (Hiền lành, Cục súc) và `data/lines-reply-b.js` (Lầy lội, Sale-man), 6–10 câu mỗi lựa chọn mỗi chủ đề, Lầy lội có câu meme riêng cho 6 kiểu lỗi.
- Câu đáp lại (khách + cư dân mạng × 9 kết quả), cư dân mạng bình luận đổi tính, review cư dân mạng, câu khách quay lại: `data/lines-reply.js`.
- Câu chốt ngày theo dữ kiện / tính cách / câu trả lời nổi: `data/lines-journal.js`, `data/lines-reply.js`.
- Review theo lý do (chờ lâu, hộp mang về, cháy cạnh, lòng đào, phục vụ): `data/lines-reviews-m4.js`.

**Trạng thái (khối `// --- C: reviews/journal ---` trong `core/state.js`, đọc + kẹp ở `loadSocial`):**

| Khoá | Nội dung |
|---|---|
| `persona` | `{ id, last, switches[{day,from,to}], asked }` |
| `followers`, `hype`, `nextGuests` | Người theo dõi, độ hot, khách thêm ca sau |
| `promises` | Lời hứa `{ day, name, reviewId }` |
| `returning` | Khách quay lại `{ name, arch, persona, day }` |
| `journal` | Nhật Ký `{ day, kind, headline, plates, profit, revenue, stars, followers, moments[], replyCap }` |
| `dayLog` | Cộng dồn ca trong ngày |

Review trong `feed` có thêm `reason`, `src` (`quan` / `mang`), `reply`.

**Móc vào file chung (dòng `// C:`):**
- `core/state.js`: `freshSocial` / `loadSocial`.
- `core/tables.js`: `addReview` ⇒ `pushReview`; `reviewPool` trong `finalizeGroup`; `spawnGroup` nhận `plan.name` / `plan.line`.
- `core/shift.js`: `onShiftStart` / `onShiftEnd` / `onNewDay`.
- `core/apply.js`: action `persona`, `reply`.
- `ui/overlays.js`: thẻ tính cách ở màn chào, câu chốt + 2 nút ở bảng chốt, `book` ⇒ `ui/notebook.js`.
- `game.js`: nền thẻ, hỏi tính cách một lần, thông báo `replied` / `persona`.
- `index.html`: CSS.

**Cắm tab vào Sổ (`ui/notebook.js`):**

```js
import { registerTab } from "./ui/notebook.js?v=c2";
registerTab("events", "Sự kiện", (body, state, ctx) => { /* vẽ vào body; ctx = { act, rerender, close, el, button, starText } */ });
```

- Id `events` / `missions` / `badges` thay chỗ trống có sẵn. Id mới thì thêm cuối hàng tab.
- Gọi `registerTab` lúc nạp module (trước khi mở Sổ).
- Tab Huy hiệu tạm hiện cấp / XP / khách quen tới khi được thay.

### Cờ dùng chung

Ghi bằng `s.flags[name] = value`. Agent B (`core/flags.js`, sự kiện R01–R10) đọc và tự quyết hạn.

| Cờ | Giá trị | Khi nào |
|---|---|---|
| `reply-viral` | ngày đặt (`s.day`) | Một câu trả lời "Lên mạng" |
| `reply-phot` | ngày đặt | Một câu trả lời "Dính phốt" (Cục súc nói thẳng thua; kèm review cư dân mạng 2 sao) |
| `reply-sale` | ngày đặt | Mỗi lần trả lời bằng tính cách Sale-man |
| `persona-flip` | số lần đổi tính trong ngày (về 0 khi sang ngày) | Mỗi lần đổi tính |
| `review-1star-<lý do>` | ngày đặt | Mỗi review 1 sao. Lý do như `r.reason`: `raw`, `veganMeat`, `slow`, `wrongDish`… |

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
- **Mọi import** mang tag `?v=c2` từ bản gộp M3 + M4. Đổi tag cùng lúc khi deploy có đổi API.
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
