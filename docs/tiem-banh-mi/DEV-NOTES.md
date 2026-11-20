# Tiệm Bánh Mì · Ghi chú phát triển

Game ở `prototype/games/tiem-banh-mi/` (M1 + M2 lõi đã có, chưa lên trang chủ). Lưu ở `localStorage["wgp.tiembanhmi.v1"]`. Làm trong worktree `.claude/worktrees/tiem-banh-mi`, branch `claude/tiem-banh-mi`. Chuẩn: `docs/tap-lam-chu/PLAYBOOK.md`.

## Trạng thái milestone

| Mốc | Trạng thái | Nội dung |
|---|---|---|
| M0 · Thiết kế + hợp đồng asset | **Xong, chủ dự án đã duyệt 19/11/2026** | GAME-DESIGN, ECONOMY, DRAMA (59 sự kiện, 11 kiểu lỗi), SCREENS, ART-DIRECTION, `asset-spec.json` (26 sheet, 512 frame, 36 toạ độ đặt + 6 đường đi), `asset-manifest.json` rỗng. `check_assets` chạy được: hiện báo thiếu file (đúng, chưa có art). |
| M1 · Kiến trúc + cảnh | **Xong (lõi), chờ duyệt** | Khung chép từ Trà Sữa (apply + bất biến, state + MIGRATIONS, rng, freshLine, save + .corrupt + .backup, atlas crisp/snap/HD, camera bội 0,5, charScale 288). Cảnh xe đẩy dùng ảnh thật đợt 1 (`abea23e`), nhân vật ô 216×288 hiện ×1, toạ độ từ `manifest.placements`. Thiếu frame nào thì vẽ hình dự phòng canvas cùng ô + anchor (`render/placeholder.js`). |
| M2 · Một ca trọn | **Xong (lõi), chờ duyệt** | Lò (mẻ, 5 mức vỏ, rút, cháy, gas), tủ kính nguội dần, lò than nướng lại, ráp 9 bước có thứ tự + hoàn tác, 10 biến thể phiếu, ổ ba chục, "như cũ", đơn nhiều ổ, chấm 0–100 + sao, 11 kiểu lỗi, khiếu nại (làm lại / giảm / tặng), thối tiền bằng quỹ lẻ (Thối đúng ngày 1–3), hết lẻ, hết hàng / hết bánh / hết gas có cứu, ký gửi, ba buổi, ngày 1 hướng dẫn, chốt ca lời lỗ, mẻ đầu ngày. 66 unit test + e2e desktop/mobile ĐẠT. |
| M3 · Kinh tế + nội dung cơ chế | | |
| M4 · Drama + review + Nhật Ký | | |
| M5 · Polish + cân bằng (sim) | | |

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
