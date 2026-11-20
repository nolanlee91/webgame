# Tiệm Bánh Mì · Ghi chú phát triển

Game ở `prototype/games/tiem-banh-mi/` (M1–M5 xong, chờ chủ dự án duyệt; chưa lên trang chủ). Lưu ở `localStorage["wgp.tiembanhmi.v1"]`. Làm trong worktree `.claude/worktrees/tiem-banh-mi`, branch `claude/tiem-banh-mi`. Chuẩn: `docs/tap-lam-chu/PLAYBOOK.md`.

## Trạng thái milestone

| Mốc | Trạng thái | Nội dung |
|---|---|---|
| M0 · Thiết kế + hợp đồng asset | **Xong, chủ dự án đã duyệt 19/11/2026** | GAME-DESIGN, ECONOMY, DRAMA (59 sự kiện, 11 kiểu lỗi), SCREENS, ART-DIRECTION, `asset-spec.json` (26 sheet, 512 frame, 36 toạ độ đặt + 6 đường đi), `asset-manifest.json` rỗng. `check_assets` chạy được: hiện báo thiếu file (đúng, chưa có art). |
| M1 · Kiến trúc + cảnh | **Xong (lõi), chờ duyệt** | Khung chép từ Trà Sữa (apply + bất biến, state + MIGRATIONS, rng, freshLine, save + .corrupt + .backup, atlas crisp/snap/HD, camera bội 0,5, charScale 288). Cảnh xe đẩy dùng ảnh thật đợt 1 (`abea23e`), nhân vật ô 216×288 hiện ×1, toạ độ từ `manifest.placements`. Thiếu frame nào thì vẽ hình dự phòng canvas cùng ô + anchor (`render/placeholder.js`). |
| M2 · Một ca trọn | **Xong (lõi), chờ duyệt** | Lò (mẻ, 5 mức vỏ, rút, cháy, gas), tủ kính nguội dần, lò than nướng lại, ráp 9 bước có thứ tự + hoàn tác, 10 biến thể phiếu, ổ ba chục, "như cũ", đơn nhiều ổ, chấm 0–100 + sao, 11 kiểu lỗi, khiếu nại (làm lại / giảm / tặng), thối tiền bằng quỹ lẻ (Thối đúng ngày 1–3), hết lẻ, hết hàng / hết bánh / hết gas có cứu, ký gửi, ba buổi, ngày 1 hướng dẫn, chốt ca lời lỗ, mẻ đầu ngày. 66 unit test + e2e desktop/mobile ĐẠT. |
| M3 · Kinh tế + nội dung cơ chế | **Xong (lõi), chờ duyệt** | Sửa M1 (bong bóng, HUD / thông báo mobile, khung cảnh, tủ kính, chơi lại ngày, bánh hôm qua); món theo trạm, mua đồ / trang trí / bảng hiệu, lên tiệm cấp 7, đơn đặt trước, ráp ×N, thớt đôi / ba, Bé Na, nhiệm vụ, Chị Mai, quảng bá, kéo thả trang trí, hạng tiệm, pate nhà làm, ổ mang tên tiệm, bánh mì que, thời tiết, hội chợ + thử thách (tối thiểu). Xem mục "M3 + M4". |
| M4 · Drama + review + Nhật Ký | **Xong (lõi), chờ duyệt** | 96 sự kiện (59 DRAMA.md + 27 cơ chế + R01–R10), review lưu sổ + người theo dõi / độ hot, trả lời theo 4 tính cách đổi ngay trên review, Sổ 6 tab, thẻ Nhật Ký trên journal-card. Asset đợt 2 đã gộp (`ca6cc4b`). |
| M5 · Polish + cân bằng (sim) | **Xong, chờ duyệt** | Mobile không che nút (dock giữ chỗ, thông báo trong khung cảnh, bong bóng đục + tránh HUD), hàng chờ theo `placements` (đầu hàng gần chủ tiệm, vào / ra qua cửa), hội chợ + 5 thử thách + 14 huy hiệu, hợp đồng định kỳ K02 / X05, chảo / chảo đôi / bếp than nướng mẻ thịt, hạn dùng nguyên liệu, bánh mì nướng bơ đường 10k, 6 sự kiện cơ chế mới, âm thanh thật (28 MP3 Codex), bộ mô phỏng 3 hồ sơ + cân bằng, bản lưu v3 (`?v=b3`). Xem mục "M5". |

## Kiến trúc (M1 + M2)

JS module thuần, không build. Mọi import mang tag `?v=b1` (đổi cùng lúc khi deploy có đổi API).

| Thư mục | File | Vai trò |
|---|---|---|
| `data/` | `economy.js` | Nguyên liệu, công thức (giá vốn khớp ECONOMY §2, có test), lò, tủ kính, lò than, mệnh giá tiền, đổi lẻ, phí ca, 20 cấp, cứu hàng, ký gửi. |
| | `customers.js`, `quirks.js`, `shift.js` | 8 nhóm khách (xưng hô, kiên nhẫn, trả tiền), khách quen + món "như cũ"; 10 biến thể phiếu (thêm biến thể = thêm một dòng); ba buổi, ngày 1, toạ độ dự phòng. |
| | `lines.js`, `lines-mistakes.js`, `lines-ops.js` | Thoại: gọi món, như cũ, ổ ba chục, nhiều ổ, sốt ruột, bỏ về, vui / ổn, khiếu nại, thối tiền, review theo sao (chung + theo nhóm), 11 kiểu lỗi × (nói + review, có biến thể), hết hàng / hết lẻ / lò / gợi ý. |
| | `asset-manifest.json` | Bản chép của `docs/tiem-banh-mi/asset-manifest.json` (test kiểm khớp). |
| `core/` (thuần, chạy node) | `apply.js` | Cửa duy nhất đổi trạng thái: bản nháp + bất biến (tiền nguyên ≥ 0, quỹ lẻ ≤ tiền, kho, sức chứa, tủ, cấp/XP, thớt / người đang trả tiền). |
| | `shift.js` | Lịch khách, tick, ghim phiếu, giao, chấm, khiếu nại, trả tiền + thối (`giveChange`, `autoChange`, `noChange`), review, XP, chốt ca lời lỗ. |
| | `board.js` | Dây chuyền ráp 8 bước trên thớt + giao: thứ tự một chiều, trừ kho khi bỏ lên ổ, hoàn tác / đổ ổ ghi hao, hết hàng mở hội thoại. |
| | `oven.js` | Mẻ (bỏ / rút / cháy / gas), mức vỏ, tủ kính nguội dần, lò than, mẻ đầu ngày. |
| | `money.js` | Quỹ lẻ theo mệnh giá, máy giải tiền thối (quy hoạch động, ít tờ nhất), chi tiền (két trước), cách khách trả. |
| | `score.js`, `order.js` | Chấm 50/15/20/15, 11 kiểu lỗi + trần sao, tráo đơn; phiếu, chữ phiếu, giá ổ ba chục. |
| | `stock.js`, `rescue.js` | Nhập hàng, "Nhập đủ cho hôm nay", dự báo, đổi lẻ, ký gửi; hội thoại hết hàng / hết bánh / hết gas / hết lẻ, luôn có lựa chọn miễn phí. |
| | `state.js`, `rng.js`, `text.js`, `tutorial.js` | Tạo / đọc + kẹp bản lưu (giữ ca dở nếu hợp lệ, `MIGRATIONS`), RNG có hạt trong state, `fill` + `freshLine` (nhớ 120 câu), gợi ý ngày 1. |
| `render/` | `atlas.js`, `placeholder.js`, `scene.js`, `loafview.js` | Atlas (SHEETS, HD_SHEETS, LAZY_SHEETS, crisp, snap, paint, icon) + hình dự phòng; cảnh xe đẩy (camera bội 0,5, `CHAR_H = 288`, placements); danh sách lớp loaf-layers theo ART-DIRECTION §5. |
| `ui/` | `bench.js`, `screens.js`, `sfx.js` | Quầy ráp (lò, phiếu, ổ cận cảnh, dải bước, ô nguyên liệu, khay thối tiền); HUD, viên Lò / Gas, dải phiếu, bảng phủ (chào, Chuẩn bị ca 4 thẻ, Cách chơi, Tạm dừng, Chốt ca, khiếu nại, hết hàng, hết lẻ); âm thanh cùng API Trà Sữa, `wgp.muted`, im lặng an toàn (chưa có file: `AVAILABLE` rỗng). |
| | `game.js`, `save.js`, `index.html` | Nối vòng lặp + lưu tự động; khoá `wgp.tiembanhmi.v1`, `.corrupt`, `.backup`, `.day` / `.before-replay` (hàm có sẵn, chưa có nút "Chơi lại ngày hôm nay"). |
| `test/` | `*.test.mjs`, `e2e.mjs`, `cdp.mjs`, `helpers.mjs` | `npm test` (66 test); e2e: `PORT=8841 node server.js` rồi `PORT=8841 node prototype/games/tiem-banh-mi/test/e2e.mjs <thư mục ảnh>`. Hook: `?seed=N`, `?prepSpeed=N` (tua mẻ đầu), `window.__game`. |

Lệch so với M0 (ghi để sim M5 dò lại): đồ chua / dưa leo / rau không tính sức chứa kho (gói học 85 phần đã vượt kho 60); trần sao 3 cho ổ ba chục thiếu nhân; khiếu nại "làm lại" trần 4 sao.

### Frame code tự dùng khi manifest có (đã có ở đợt 1 trừ ghi chú)

- Cảnh: `cart-scene`, `cart-foreground` (file), `shop-scene` / `shop-counter-foreground` (cấp 7, M3).
- Nhân vật: `characters/<vai>`, `<vai>-walk-1..4`, `<vai>-{waiting,happy,impatient}`, `<vai>-{order,surprised}-1..2`, `baker-{idle 1..2, slice/oven/serve 1..4, wrap/change 1..2}`.
- Lò, đồ trên xe: `oven-mini-{cold,ready}`, `oven-mini-baking-1..4`, `oven-mini-smoke-1..2`, `toaster-idle`, `toaster-on-1..4`, `board-{empty,busy}`, `gas-tank-{full,low,empty}`, `sauce-bottles`, `pate-jar`, `pickle-jar`, `herb-basket`, `paper-stack`, `cash-tin`, `tea-jug`.
- Ổ bánh: `loaf-whole-{raw,pale,golden,dark,burnt}`, `loaf-open-back/front`, `loaf-toasted-sheen`, `spread-*`, `fill-*`, `do-chua`, `dua-leo`, `rau-mui`, `hanh-la`, `ot-{it,vua,nhieu}`, `sauce-*`, `wrap-{paper,paper-half,bag}`; `loaf-layers-hd` (đợt 2) tự thay qua HD_SHEETS.
- Nguyên liệu (icon trong nút + Nhập hàng), `bill-{1..500}k`, clip fx `crumbs`, `coin-fly`.
- Đợt 2 (chưa dùng ở M2): chân dung HD, `baker-actions-hd`, fixtures (`cart-display-*` thay ổ nhỏ vẽ chồng trong tủ), weather, decor, journal.

## M3 + M4 (bản lưu v2, tag `?v=b2`)

### Sửa M1
- Bong bóng thoại đặt bằng `placeBubble` (render/scene.js): thử trên đầu → bên xa chủ tiệm → bên kia; không bao giờ chạm vùng mặt chủ tiệm (`scene.bakerFace`, e2e kiểm).
- Mobile: HUD gọn (giờ · tiền · lẻ; cấp / danh tiếng / theo dõi trong Sổ), thông báo ở đáy cảnh trên dock, dock 5 nút **Quầy · Lò · Khách · Kho · Sổ**. Khung cảnh mobile tính từ `scene.region()` (chủ tiệm + 2 chỗ đứng đầu hàng + lò), nút Khách lia sang hàng chờ.
- Tủ kính: đợt 2 có `cart-display-empty` + `placements["cart-display"].stockSlots` ⇒ code vẽ từng ổ theo mức vỏ vào ô; tủ tiệm đổi `display-case-*` theo số ổ; chưa có fixtures thì không vẽ chồng lên tranh. Nhãn "Tủ n ổ · giòn TB" luôn hiện.
- "Chơi lại ngày hôm nay": ở Chốt ca, Tạm dừng, Cách chơi; hỏi xác nhận, bản hiện tại cất ở `.before-replay` (save.js `replayDay`).
- Bánh dư cuối ca ⇒ `s.stale` (giòn 30). Sáng: bán nướng bơ đường (vào tủ, ổ làm từ đó rẻ 30% tối thiểu 10k, nướng lại tối đa 70) · cho đi (+1 danh tiếng, mở D07) · bỏ.

### Module mới
| File | Vai trò |
|---|---|
| `core/flags.js` | Cờ Drama (hạn theo ngày, `today(s)`) + bộ điều chỉnh có hạn `s.mods` (khách, giá, pate, giá nhập, vùng chín, mẻ đầu, đổi lẻ, kiên nhẫn, rạch chậm). |
| `core/drama.js` | Drama Engine chép Trà Sữa: `if` khai báo, ưu tiên lỗi người chơi, ≥ 1 sự kiện vui / 3, nghỉ theo `cooldown`, hẹn `later` (+ `flagOk` / `laterOk` khi đơn nhóm / đặt trước giao đủ sao), `alt` + `need.flags` theo lựa chọn cũ, hên xui, hậu quả hiện ngay; tối đa 1–2 / ca + 1 giữa hai ca. |
| `core/reviews.js` | Sổ review (40), điểm đánh giá, người theo dõi, độ hot, trả lời theo tính cách, câu đáp lại, lời hứa, khách quay lại, sự kiện sinh từ câu trả lời; review chay dính mặn chỉ cho lựa chọn xin lỗi. |
| `core/progress.js` | Mua đồ / trang trí, thuê tiệm (kỷ niệm xe đẩy vào Nhật Ký), hạng tiệm, pate nhà làm, ổ mang tên tiệm, quảng bá, Bé Na, hội chợ, thử thách, bánh hôm qua, thời tiết, kéo thả trang trí, đơn đặt trước. |
| `core/missions.js`, `core/journal.js` | Nhiệm vụ 16 mẫu (ECONOMY §8); câu chốt ca theo dữ kiện + nội dung thẻ. |
| `ui/drama.js`, `ui/notebook.js`, `ui/journal.js`, `ui/persona.js` | Hội thoại Drama (chân dung), Sổ 6 tab, thẻ Nhật Ký (journal-card hoặc nền canvas), thẻ / nút tính cách. |
| `data/events*.js`, `data/npcs.js`, `data/equipment.js`, `data/lines-m3.js`, `data/lines-reply.js`, `data/lines-reviews.js` | Nội dung (lược đồ sự kiện ở đầu `data/events.js`). |

### Frame đợt 2 code đang dùng
- `drama-portraits-hd` "<npc>-<neutral|happy|annoyed|surprised>" (id NPC trùng DRAMA.md: me, chu-tam, anh-bay, ba-tu, chi-mai, cau-hung, co-hai, co-sau, co-thanh, anh-lam, be-na, ollie) → `portrait-expressions-hd` "<vai>-<biểu cảm>" / "baker-<…>" → `portraits-hd` "<vai>" → `characters` (ui/drama.js `portraitRef`).
- `loaf-layers-hd` (HD_SHEETS, trừ `loaf-whole-pale` dính mép ổ bên cạnh ⇒ `HD_SKIP` dùng bản thường; sheet thường vẫn tải), `baker-actions-hd` (mờ sau ổ ở Quầy ráp, động tác theo bước).
- `fixtures`: `cart-display-empty` + stockSlots, `display-case[-warm]-{empty,low,full}`, `signboard-1..3`, `queue-rope`, `helper-station`. `decor` (vị trí mặc định `placements[id]`, kéo thả lưu `s.placement`). `weather-fx` `rain-1..4` (ngày mưa). `journal-card`.
- LAZY: portraits / expressions / drama / baker-actions / weather / journal / title / shop.

### Lệch so với thiết kế (ghi để M5 dò)
- Bánh hôm qua dùng như phôi rẻ (ổ làm từ đó −30%) thay vì món riêng "nướng bơ đường 10k".
- Chảo đôi chưa có tác dụng (chưa mô phỏng chiên trứng); bếp than nướng xiên chỉ mở món, chưa nướng mẻ thịt.
- Hạn dùng nguyên liệu (hao lúc chốt ca) chưa làm; tủ mát chỉ tăng kho.
- Hội chợ / thử thách là bản tối thiểu (bật ở Chuẩn bị ca, +khách / giá, xét cuối ca) để F01–F03, CH1–CH2 mở được; cảnh hội chợ riêng để M5.
- Sự kiện: vài hiệu ứng phức tạp gần đúng bằng cờ / mod (đơn định kỳ K02 / X05 chỉ tạo đơn đầu + cờ hợp đồng; "2 review" thành 1 review + −1 danh tiếng).
- Ca có thể có 2 sự kiện; mỗi ca 1 sự kiện trước ngày 5.

### Kiểm
- `node --test "test/*.test.mjs"`: 100 test (thêm `drama.test.mjs` 8, `m3.test.mjs` 16, `m4.test.mjs` 10; test cũ chạy với Drama bật). Test "mọi lựa chọn giải quyết được" dựng trạng thái thoả điều kiện cho từng sự kiện, đi mọi đường goto, thử cả nhánh thắng / thua.
- E2E: `test/e2e.mjs` + `test/e2e-m34.mjs` (thuê tiệm, đơn đặt, Drama, đổi tính cách + trả lời, thẻ Nhật Ký, chơi lại ngày) ở 1366@1,25 và 390@3.

## M5 (bản lưu v3, tag `?v=b3`)

### Sửa bố cục / cảnh
- **Mobile 390×844:** vùng cuộn là `.app` (từ đầu trang tới mép trên dock) ⇒ dock 5 nút giữ chỗ riêng, không phần tử nào trôi xuống dưới dock (trước: dock che dải bước ráp). Thanh Hoàn tác / Đổ ổ / Giao dính đáy vùng cuộn. Thông báo nằm ở đáy khung cảnh (trong `#world`), nâng lên khi có dải gợi ý ngày 1 (trước: nổi ở đáy màn hình, che Hoàn tác / Giao). Khi có bảng phủ: thông báo ở dải 52 px trên cùng, bảng chừa chỗ (không đè tab / nút bảng). Dock bật lại khi mở ca (trước: mờ suốt ca).
- **Bong bóng thoại:** nền đục `#fffaf0` + viền mực 2 px, hiệu ứng hiện không còn mờ dần (trước: nhìn trong suốt trên cảnh lúc hiện). `placeBubble` tránh cả chip HUD + viên Lò / Gas (`avoid()` từ game.js), hết chỗ thì hạ xuống dưới HUD.
- **Hàng chờ (desktop, tiệm):** `core/placements.js` `orderQueue` sắp `queueSpots` theo thứ tự vào hàng: đầu hàng = chỗ gần chủ tiệm nhất (chỗ giao bánh), nối dần về phía cửa; góc cửa sổ (`queueSpots[0]` = [246,582], nơi khách từng đứng một mình) chỉ dùng khi hàng đủ 6. Đi vào theo `entryRoute` (ngược `exitPath`, không cắt chéo đầu quầy), ra theo `exitRoute` (đuôi ngắn nhất của `exitPath`, luôn tới cửa). Xe đẩy giữ nguyên thứ tự (đã đúng). Unit test + e2e kiểm khách chờ đứng đúng một chỗ trong manifest và đầu hàng gần chủ tiệm (xe đẩy và tiệm).
- **Tải nhanh:** chỉ chờ ảnh của khung đầu (cảnh đang ở + chủ tiệm, lò, đồ quầy, icon; tối đa 2,5 giây), còn lại tải nền theo lô 3 file. Bỏ `HD_SKIP` (Codex đã sửa `loaf-whole-pale`, 88b99ac) nên không tải `loaf-layers.webp` thường nữa.
- **Giảm chuyển động:** CSS tắt mọi animation / transition; JS bỏ hiệu ứng vụn bánh / tiền bay (đã có), cảnh chuyển lên tiệm 0,6 giây.

### Tính năng hoàn thiện
| Tính năng | Code | Nội dung |
|---|---|---|
| Hội chợ (cấp 18) | `core/progress.js` `rentFair`, `shiftLenFor` | Phí 150k mỗi 4 ngày; ca 4,5 phút, +8 khách, giá +15%, kiên nhẫn ×0,9, khách nào cũng hay đi nhóm (2 ổ 40%, 3 ổ 20%) với câu gọi riêng. Thẻ ở đầu Chuẩn bị ca. Sự kiện F02 / F03, review 11 / 10 / 10. |
| Thử thách (cấp 20) | `core/challenge.js` | Lịch 5 loại xoay theo ngày (Rush kép, Một lò, Ngày khách Tây, Không cháy mẻ nào, Thối tay toàn bộ) với mod thật (thêm khách sáng, ép 1 ngăn lò, 70% khách Tây, tắt "Thối đúng" + phụ việc). Thưởng lần đầu 120k + 60 XP + huy hiệu, lần sau 60k + 30 XP. Câu đạt / chưa đạt 8 + 8 mỗi loại. Sự kiện CH1 / CH2. |
| Huy hiệu | `core/challenge.js` `BADGES` | 14 (Chủ Tiệm, Không ai bỏ về, Ca năm sao, Tay lò vàng, Thối không sai một đồng, Ngôi sao hội chợ, Gian hàng quen mặt, Két sắt nặng tay, Tiệm Chủ Tiệm + 5 huy hiệu thử thách). Xét lúc chốt ca và khi mua hạng tiệm; Sổ · Huy hiệu có bức tường; câu + khoảnh khắc Nhật Ký. |
| Hợp đồng định kỳ | `core/contracts.js`, fx `contract` | K02 (12 ổ chả lụa / 2 ngày × 5 đợt), X05 (25 ổ thập cẩm / tuần × 4 đợt): đơn tự sinh đầu ca đúng lịch (không cọc, hạn 90–100 giây). Trễ 2 đợt ⇒ huỷ (HD2), trọn ⇒ gia hạn (HD1). Thẻ ở Chuẩn bị ca, review đúng giờ / trễ 10 + 10, câu nhận đơn 8. |
| Chảo / chảo đôi / bếp than | `core/cook.js` | Bước Nhân lấy trứng / thịt ĐÃ CHÍN: trứng 6 giây (chảo đôi 2 cái một lúc), thịt mẻ 5 phần chín 25 giây cháy sau 33 giây, giữ ấm tới hết ca, dư ghi hao. Chưa có thì tự bắc chảo / bỏ mẻ và báo chờ; nút Chiên trứng / Nướng thịt / Gắp thịt trên quầy. Câu khách chờ 8 + 8, review trứng nóng / chờ trứng, thịt mới nướng / để lâu 10 mỗi loại. Sự kiện TR1, NT1. |
| Hạn dùng | `core/expiry.js` | Lô theo ngày nhập (`s.lots`), dùng lô cũ trước, chốt ca bỏ lô quá hạn + ghi hao "hết hạn"; Chuẩn bị ca báo phần hết hạn cuối ca hôm nay; tủ mát / chậu rau thơm giữ lâu hơn. Review rau tươi / đồ chua để lâu 10 + 10, câu Nhật Ký 8, sự kiện HH1 (Bà Tư). |
| Bánh mì nướng bơ đường | `data/economy.js` `bo-duong`, `core/shift.js` | Chọn "Bán nướng bơ đường" ⇒ ~70% số ổ bánh hôm qua thành khách sáng gọi món riêng 10k (lấy đúng ổ hôm qua, nướng lại tối đa 70, phết bơ). Câu gọi 8, review giòn / chưa nướng 10 + 10, sự kiện BD1. |
| Đơn dở khách mang về | `core/partial.js` | Đơn nhiều ổ (cả đơn đặt trước) mà khách phải đi: khách lấy ổ đã gói, trả 70% (trước: ghi hao hết). |

Nội dung M5: `data/lines-m5.js` (31 pool kiểm bằng test, mỗi pool 8–14 câu, ~330 câu), `data/events-m5.js` (HD1, HD2, HH1, NT1, TR1, BD1). Tổng sự kiện 102.

### Âm thanh (`ui/sfx.js`, bộ Codex `codex/banh-mi-audio` e7967c8, 28 MP3)
Cùng kiến trúc Trà Sữa: AudioContext chỉ tạo sau thao tác đầu (trước đó không tải byte nào), `WARM` tải sẵn 8 hiệu ứng nhỏ, vòng lặp tải khi cảnh cần (nhạc chuẩn bị ca chỉ ở Chuẩn bị ca, nhạc giờ cao điểm chỉ trong ca), file lỗi ghi `failed` không thử lại, giới hạn lặp theo tên, ba giọng không lời chung một khoảng nghỉ. Nút Tiếng 3 trạng thái (bật hết → chỉ hiệu ứng `tbm.music=0` → tắt `wgp.muted=1`). E2E kiểm cả ba.

| Sự kiện | Tiếng |
|---|---|
| Rạch / phết / bỏ nhân, lấy bánh / rau / gia vị | `bread-slice` / `pate-spread` / `filling-place` / `herb-sprinkle` / `soy-squirt` |
| Bỏ mẻ / rút mẻ, lấy ổ khỏi lò than / chín, trứng chín, thịt chín / cháy | `oven-close` / `oven-open` / `bread-ready` / `bread-burnt` |
| Nướng lại lò than, bỏ mẻ thịt, bắc chảo | `charcoal-crackle` |
| Gói giấy / bỏ túi | `paper-wrap` / `plastic-bag` |
| Khách cần thối, thối sai, đổi lẻ, ký gửi | `change-count` |
| Thu tiền, nhập hàng, mua đồ | `cashbox` |
| Khách tới · vui · bực (sốt ruột, bỏ về, trễ đơn) · ngạc nhiên (khiếu nại, Drama) | `arrival` · `voice-happy` · `voice-annoyed` · `voice-surprised` |
| Drama · lên mạng / hội chợ / quảng bá · lên cấp / huy hiệu / hạng tiệm / lên tiệm · nhiệm vụ / hợp đồng xong · chốt ca · lỗi / hết hàng | `drama` · `viral` · `level-up` · `mission` · `shift-end` · `error` |
| Vòng lặp | Chuẩn bị ca: `prep-music-loop` (nhạc) + `dawn-street-loop`; trong ca: `rush-music-loop` (nhạc) + `dawn-street-loop` + `gas-oven-loop` khi lò có mẻ; hội thoại: hạ âm |

`data-nosfx`: game không nạp `feedback.js` chung của Lụm Kèo, nên không có tiếng bấm chung chồng lên tiếng game; khi trang chủ bọc game vào khung có feedback.js thì đặt `data-nosfx` trên `#app` (feedback.js nhận thuộc tính ở tổ tiên).

### Cân bằng (bộ mô phỏng `tools/sim/`)
Phút chơi tới cấp (seed 12345, `report.md`). "Trước" = lần chạy đầu của bộ mô phỏng trên luật M4 + tính năng M5, chưa chỉnh số.

| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Lời / ca cấp 7–9 · cấp 20 | Tiền cuối · hạng tiệm | Ký gửi · đóng sớm · kẹt |
|---|---|---|---|---|---|---|---|
| Mục tiêu | ≈ 10 | ≈ 40 | ≈ 120 | 600–720 | 160–200k · 420–480k | còn chỗ tiêu | 0 kẹt |
| average trước | 14,3 | 110,9 | 388 | 2758 (không tới) | ≈ 0k (tiền về 0 từ ngày 5) | 29k · 0/8 | 186 · 175 · 0 |
| careful sau | 15,2 | 40,8 | 126,6 | 664,6 | 298k · 602k | 4.194k · 7/8, pate 3/3 | 0 · 0 · 0 |
| average sau | 15,2 | 46,6 | 128,5 | 661,6 | 317k · 524k | 1.590k · 7/8, pate 3/3 | 0 · 0 · 0 |
| sloppy sau | 11,8 | 49,8 | 138,3 | 750,9 | 148k · 310k | 2.259k · 4/8, pate 3/3 | 0 · 5 · 0 |

Cấp 4 ở ~15 phút vì mốc cấp chỉ ghi lúc chốt ca (ngày 1 kết thúc ở phút ~7, cấp 4 tới giữa ca ngày 2). Tới cấp 20 mọi hồ sơ vẫn còn bậc hạng tiệm cuối 6.000k (sloppy còn 16.400k) ⇒ tiền còn ý nghĩa. Lời / ca cao hơn bảng ECONOMY §11 vì giá ×1,25 nhưng số ổ thấp hơn (29–32 ổ ở cấp 10, 40–46 ở cấp 20).

Chi tiết thay đổi số: `ECONOMY.md` mục "Cân bằng M5". Một ngày trong sim ≈ 6–8 phút (ca 4 phút + hội thoại ~1–1,5 phút + Chuẩn bị ca có canh mẻ đầu ~1,5 phút).

### Bản lưu v3
`MIGRATIONS[2]`: thêm `contracts`, `lots`, `fairCount`, `challenge`; huy hiệu cũ `chuTiem` (số lần đạt thử thách M3) thành `stats.challenges`; XP đổi sang bảng mới bằng `rescaleXp` (giữ cấp + phần trăm tới cấp sau). save.js cất bản gốc nguyên văn ở `wgp.tiembanhmi.v1.bak-v2` một lần trước khi nâng. Test trong `m5.test.mjs`.

### Kiểm
- `node --test "test/*.test.mjs"`: 114 test (thêm `m5.test.mjs` 14). `node --test tools/sim/sim.test.mjs`: 4 test hồi quy (tất định; 12 ngày × 3 hồ sơ không lỗi, không kẹt, 4,5–10 phút / ngày; phá sản vẫn bán được; người trung bình đúng mục tiêu cấp 4 / 7 / 10 / 20 + còn chỗ tiêu tiền).
- E2E (`test/e2e.mjs` + `e2e-m34.mjs` + `e2e-m5.mjs`) ở 1366@1,25 và 390@3: âm thanh (không tải trước thao tác, nhạc tải lười, nút 3 trạng thái, không file lỗi), không nút nào bị che (elementFromPoint ở 5 điểm của Giao, Hoàn tác, từng ô dải bước, từng nút dock + thông báo không giao hình nút, cả trên bảng phủ), bong bóng đục không đè HUD, khách đứng đúng queueSpots (xe đẩy + tiệm), thẻ Hội chợ / Lịch thử thách, nhận thử thách + thuê gian bằng nút, ca hội chợ 4,5 phút + Một lò 1 ngăn, chảo / bếp than, chốt ca có kết quả thử thách, bức tường 14 huy hiệu, 0 lỗi console.

### Còn lại
- Cảnh hội chợ riêng (đang dùng cảnh tiệm); sprite chảo / bếp than đổi theo trạng thái (đang dùng `grill-idle`, `egg-pan-idle`): nếu muốn thì nhờ Codex vẽ thêm `grill-on-1..4`, `egg-pan-frying-1..2`.
- Người chơi giả chỉ dùng một thớt; thớt đôi / ba chưa được sim đo.
- Người chơi ẩu vẫn chậm hơn mục tiêu ở giữa game (xem bảng); ổ mang tên tiệm, quảng bá, phụ việc giữ số M3.

## Quyết định cần chủ dự án

1. **Ba giai đoạn hai cảnh**: xe đẩy (`cart-scene`) + tiệm (`shop-scene`). Bỏ cảnh xe đẩy thì bớt 2 tranh 1280×720 và 13 toạ độ đặt, nhưng mất cảm giác "từ xe đẩy lên tiệm".
2. **Chủ tiệm nam như thumbnail**, hay thêm lựa chọn chủ tiệm nữ (gấp đôi sheet `baker-*`, chân dung chủ tiệm)?
3. **Thối tiền tay** mặc định từ ngày 1 (đặc trưng nhất của game) — có muốn nút "Thối đúng" tự động ngay từ đầu cho người chơi nhỏ tuổi không?
4. **Bánh mì que** cấp 12 và **ổ gia truyền** cấp 19: giữ, hay đổi lấy món khác (ví dụ bánh mì chảo)?
5. **Số lượng asset Phase 1** (26 sheet, 512 frame): giao một lần, hay chia hai đợt (đợt 1: cảnh, nhân vật, lò, ổ bánh, icon; đợt 2: HD, NPC Drama, thời tiết, trang trí)?

## Cần Codex (Phase 1, toàn bộ)

Mọi sheet ở `asset-spec.json`, mô tả ở `ART-DIRECTION.md` mục 7. Ghi `filename`, `dimensions`, `frames{name:{rect,anchor}}`, `animations{name:{frames,fps,loop}}` vào `docs/tiem-banh-mi/asset-manifest.json`, cùng `placements` (36 khoá `at` + `door`, `queueSpots`, `exitPath`, `cartEntry`, `cartQueueSpots`, `cartExitPath`).

| # | Sheet | Ô · anchor · lưới |
|---:|---|---|
| 1 | `assets/shop-scene.webp`, `assets/shop-counter-foreground.webp` | 1280×720 · 2× |
| 2 | `assets/cart-scene.webp`, `assets/cart-foreground.webp` | 1280×720 · 2× |
| 3 | `assets/title-art.webp` | 1280×720 · 2× |
| 4 | `assets/characters.webp` | 144×192 · [72,174] · 2× |
| 5 | `assets/customer-walk-cycles.webp` | 144×192 · [72,174] · 2× |
| 6 | `assets/customer-reactions.webp` | 144×192 · [72,174] · 2× |
| 7 | `assets/customer-actions.webp` | 144×192 · [72,174] · 2× |
| 8 | `assets/baker-scene.webp` | 144×192 · [72,174] · 2× |
| 9 | `assets/baker-actions-hd.webp` | 320×320 · [160,316] · 1× |
| 10 | `assets/loaf-layers-hd.webp` | 320×384 · [160,348] · 1× |
| 11 | `assets/loaf-layers.webp` | 160×192 · [80,174] · 2× |
| 12 | `assets/portraits-hd.webp` | 384×320 · [192,308] · 1× |
| 13 | `assets/portrait-expressions-hd.webp` | 384×320 · [192,308] · 1× |
| 14 | `assets/drama-portraits-hd.webp` | 384×320 · [192,308] · 1× |
| 15 | `assets/ovens.webp` | 256×256 · [128,240] · 2× |
| 16 | `assets/equipment.webp` | 192×192 · [96,168] · 2× |
| 17 | `assets/fixtures.webp` | 384×256 · [192,240] · 2× |
| 18 | `assets/decor.webp` | 128×128 · [64,120] · 2× |
| 19 | `assets/ingredients.webp` | 64×64 · [32,32] · 2× |
| 20 | `assets/bills.webp` | 96×48 · [48,24] · 2× |
| 21 | `assets/fx.webp` | 96×96 · [48,48] · 2× |
| 22 | `assets/ui-icons.webp` | 48×48 · [24,42] · 2× |
| 23 | `assets/weather-fx.webp` | 640×360 · [0,0] · 2× (alpha mềm được) |
| 24 | `assets/journal-card.webp` | 1080×1350 · 2× |

## Quyết định của chủ dự án (19/11/2026, duyệt M0)

- Giữ hai cảnh: **xe đẩy** (cấp 1–6) → **thuê tiệm** (cấp 7+).
- Chủ tiệm **chỉ nam**, như thumbnail (có thể thêm chủ nữ sau).
- **Thối tiền tay** là nét riêng; **ngày 1–3 có nút "Thối đúng"** tự động cho người mới, từ ngày 4 tự thối.
- Giữ bánh mì que (cấp 12) và ổ mang tên tiệm (cấp 19).
- Codex giao ảnh **2 đợt** (`wave` trong asset-spec.json): đợt 1 đủ để code M1–M2, đợt 2 cho M3–M5.

## Câu nhắn gửi Codex

### Đợt 1 (gửi ngay)

```
Game mới: Tiệm Bánh Mì (tiem-banh-mi). Pull master. Vẽ ĐỢT 1 asset.

1. Đọc AGENTS.md, rồi docs/tap-lam-chu/PLAYBOOK.md §1 và §2.
2. Hợp đồng: docs/tiem-banh-mi/asset-spec.json — chỉ các sheet "wave": 1 (sheet wave 2 đang optional, chưa vẽ).
   Mô tả từng sheet, bảng màu, ánh sáng, nhân vật, thứ tự lớp ổ bánh, toạ độ đề xuất: docs/tiem-banh-mi/ART-DIRECTION.md.
3. Mẫu art đã duyệt: prototype/homepage/assets/thumbs/tiem-banh-mi.webp. Chủ tiệm là NAM như thumbnail.
4. Vẽ vào prototype/games/tiem-banh-mi/assets/. Ghi manifest vào docs/tiem-banh-mi/asset-manifest.json (items + placements).
5. Sheet đợt 1:
   shop-scene, shop-counter-foreground, cart-scene, cart-foreground, title-art (1280×720);
   characters, customer-walk-cycles, customer-reactions, customer-actions, baker-scene
   (144×192, anchor [72,174], 9 vai: baker, student, worker, shipper, office, regular, reviewer, tourist, parent);
   loaf-layers (160×192, mỗi nguyên liệu một lớp để ổ bánh dày dần từng bước);
   ovens (256×256: lò mini / gas / điện × nguội, đang nướng, chín, cháy, khói), equipment (192×192),
   ingredients (64×64), bills (96×48), fx (96×96), ui-icons (48×48).
6. Luật cứng: lưới 2×, alpha cứng, WebP lossless, cùng mật độ điểm vẽ cả bộ; nhân vật cao 150–180 px, mọi frame
   một vai cao bằng nhau ±8%; mỗi vai là cùng một người trên mọi sheet; không chữ, logo, thương hiệu, người thật.
7. Ghi placements.<khoá>.at (điểm chạm mặt bàn) đủ 36 khoá và door, queueSpots, exitPath, cartEntry, cartQueueSpots, cartExitPath.
8. Chạy: python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json --preview <thư mục tạm>
   đến "0 lỗi — ĐẠT" (cảnh báo chỉ được là các sheet wave 2). Mở nhan-vat-xep-hang-x2.png tự soi.
9. Dán kết quả + commit hash vào docs/tiem-banh-mi/ASSET-HANDOFF.md, commit lên branch riêng rồi báo.
```

### Đợt 2 (gửi khi code tới M3)

```
Tiệm Bánh Mì ĐỢT 2. Pull master. Trong docs/tiem-banh-mi/asset-spec.json, bỏ "optional" ở các sheet "wave": 2 rồi vẽ:
baker-actions-hd (320×320, lưới 1×), loaf-layers-hd (320×384, lưới 1×, cùng tên lớp với loaf-layers),
portraits-hd, portrait-expressions-hd, drama-portraits-hd (384×320, lưới 1×, 12 NPC trong DRAMA.md),
weather-fx (640×360), fixtures (384×256), decor (128×128), journal-card (1080×1350).
Cùng luật như đợt 1; chạy check_assets đến 0 lỗi, dán kết quả vào ASSET-HANDOFF.md rồi báo.
```

## Kiểm hợp đồng (M0)

`python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json` chạy được, đọc manifest qua đường dẫn `../../../docs/tiem-banh-mi/asset-manifest.json`, báo 62 lỗi đúng dự kiến khi chưa có art: 20 file bắt buộc chưa có + 36 toạ độ đặt + 6 đường đi; 6 cảnh báo cho sheet HD / thời tiết (tuỳ chọn về mặt script nhưng vẫn phải vẽ). Mọi mẫu tên frame mở rộng đúng, không trùng tên trong cùng sheet (512 frame).
