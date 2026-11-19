# Tiệm Bánh Mì · Ghi chú phát triển

Game sẽ ở `prototype/games/tiem-banh-mi/` (chưa có code). Lưu ở `localStorage["wgp.tiembanhmi.v1"]`. Làm trong worktree `.claude/worktrees/tiem-banh-mi`, branch `claude/tiem-banh-mi`. Chuẩn: `docs/tap-lam-chu/PLAYBOOK.md`.

## Trạng thái milestone

| Mốc | Trạng thái | Nội dung |
|---|---|---|
| M0 · Thiết kế + hợp đồng asset | **Xong, chờ chủ dự án duyệt** | GAME-DESIGN, ECONOMY, DRAMA (59 sự kiện, 11 kiểu lỗi), SCREENS, ART-DIRECTION, `asset-spec.json` (26 sheet, 512 frame, 36 toạ độ đặt + 6 đường đi), `asset-manifest.json` rỗng. `check_assets` chạy được: hiện báo thiếu file (đúng, chưa có art). |
| M1 · Kiến trúc + cảnh | Chờ asset Codex | |
| M2 · Một ca trọn | | |
| M3 · Kinh tế + nội dung cơ chế | | |
| M4 · Drama + review + Nhật Ký | | |
| M5 · Polish + cân bằng (sim) | | |

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

## Câu nhắn gửi Codex

Gửi sau khi chủ dự án duyệt M0 (PLAYBOOK §8):

```
Game mới: Tiệm Bánh Mì (tiem-banh-mi). Việc của bạn: vẽ toàn bộ asset Phase 1.

1. Đọc AGENTS.md, rồi docs/tap-lam-chu/PLAYBOOK.md §1 và §2.
2. Hợp đồng: docs/tiem-banh-mi/asset-spec.json (sheet, cỡ ô, lưới, anchor, tên frame, clip, placements, đường đi).
   Mô tả từng sheet, bảng màu, ánh sáng, nhân vật, thứ tự lớp ổ bánh, toạ độ đề xuất: docs/tiem-banh-mi/ART-DIRECTION.md.
3. Mẫu art đã duyệt: prototype/homepage/assets/thumbs/tiem-banh-mi.webp (thợ bánh khăn kem rạch ổ, tủ kính bánh, đồ chua, tương ớt, rau, đèn mây, hũ sứ xanh trắng, tiệm gỗ ban đêm).
4. Vẽ vào prototype/games/tiem-banh-mi/assets/. Ghi manifest vào docs/tiem-banh-mi/asset-manifest.json (items + placements).
5. Sheet cần giao (24 mục, 26 file):
   shop-scene, shop-counter-foreground, cart-scene, cart-foreground, title-art (1280×720);
   characters, customer-walk-cycles, customer-reactions, customer-actions, baker-scene (144×192, anchor [72,174], 9 vai: baker, student, worker, shipper, office, regular, reviewer, tourist, parent);
   baker-actions-hd (320×320, lưới 1×); loaf-layers-hd (320×384, lưới 1×) + loaf-layers (160×192), mỗi nguyên liệu một lớp để ổ bánh dày dần từng bước;
   portraits-hd, portrait-expressions-hd, drama-portraits-hd (384×320, lưới 1×, 12 NPC);
   ovens (256×256: lò mini / gas / điện × nguội, đang nướng 4 khung, chín, cháy, khói), equipment (192×192), fixtures (384×256), decor (128×128), ingredients (64×64), bills (96×48), fx (96×96), ui-icons (48×48), weather-fx (640×360), journal-card (1080×1350).
6. Luật cứng: lưới 2× (HD lưới 1×), alpha cứng, WebP lossless, cùng mật độ điểm vẽ cho cả bộ; nhân vật cao 150–180 px, mọi frame một vai cao bằng nhau ±8%; mỗi vai là cùng một người trên mọi sheet; không chữ, logo, thương hiệu, người thật trên đồ vật.
7. Ghi placements.<khoá>.at (điểm chạm mặt bàn) cho đủ 36 khoá trong asset-spec, và door, queueSpots, exitPath, cartEntry, cartQueueSpots, cartExitPath.
8. Trước khi giao, chạy:
   python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json --preview <thư mục tạm>
   Phải ra "0 lỗi — ĐẠT". Mở nhan-vat-xep-hang-x2.png tự soi tỉ lệ so với cảnh và mỗi vai giữ cùng một người.
9. Dán kết quả + commit hash vào docs/tiem-banh-mi/ASSET-HANDOFF.md. Không push lên master khi chưa được chủ dự án đồng ý.
```

## Kiểm hợp đồng (M0)

`python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json` chạy được, đọc manifest qua đường dẫn `../../../docs/tiem-banh-mi/asset-manifest.json`, báo 62 lỗi đúng dự kiến khi chưa có art: 20 file bắt buộc chưa có + 36 toạ độ đặt + 6 đường đi; 6 cảnh báo cho sheet HD / thời tiết (tuỳ chọn về mặt script nhưng vẫn phải vẽ). Mọi mẫu tên frame mở rộng đúng, không trùng tên trong cùng sheet (512 frame).
