# Nối Thú — bản chơi thử (pixel V5, Lụm Kèo)

Tìm 2 ô cùng hình và nối chúng bằng đường đi qua ô trống, **gấp khúc tối đa 2 lần (≤ 3 đoạn thẳng)**, được đi vòng ngoài mép bàn. Chơi một mình, chạy hoàn toàn trên trình duyệt, không cần server.

Mở: `http://127.0.0.1:8766/games/noi-thu/` (ở gốc repo chạy `PORT=8766 node server.js`). Tham số thử: `?level=1..8`, `?seed=số`.

## Luật & tiến trình
| Màn | Bàn | Số loại | Thời gian | Ô dồn |
|---|---|---|---|---|
| 1 | 6×10 | 15 | 3:20 | — |
| 2 | 7×12 | 21 | 4:00 | ↓ |
| 3 | 8×14 | 28 | 5:00 | ← |
| 4 | 9×16 | 36 | 6:00 | — |
| 5 | 9×16 | 36 | 6:00 | ↓ |
| 6 | 9×16 | 36 | 5:40 | ↑ |
| 7 | 9×16 | 36 | 5:20 | ← |
| 8 | 9×16 | 36 | 5:00 | → |

- Mỗi cặp +10 điểm; nối liên tục trong 4 giây được combo (+5/bậc, tối đa +25). Qua màn thưởng 2 điểm/giây còn lại.
- Mỗi màn có 3 Gợi ý (H) và 2 lần Đảo (S). Bàn hết nước đi thì tự đảo miễn phí — không bao giờ bị kẹt.
- Hết giờ: thua màn, chơi lại màn đó với điểm lúc đầu màn. Qua màn 8: “Phá đảo”.
- Tiến độ (màn đã mở + kỷ lục) lưu ở `localStorage["wgp.noithu.v1"]`; tắt tiếng dùng chung `wgp.muted` với các game khác.
- Phím: chuột/chạm chọn ô · mũi tên + Enter · H gợi ý · S đảo · P/Esc tạm dừng · M tắt tiếng. Chuyển tab/rời cửa sổ tự tạm dừng.

## Hiển thị
- Canvas pixel, tự co theo khung; khi khung cao hơn rộng (điện thoại cầm dọc) bàn **xoay dọc** để ô to hơn — logic không đổi, mũi tên “ô dồn” xoay theo.
- 36 loại ô (16 con vật + 20 đồ vật) dùng `assets/sprites/tiles-v2.webp`, lưới 6×6 với ô 64×64 theo thứ tự `TILES`. `sprites.js` giữ bộ 16×16 để hiển thị khi ảnh chưa tải hoặc không tải được.
- Icon UI và âm thanh dùng lại từ Đào Vàng và Cờ Cá Ngựa (`assets/ui`, `assets/sfx`).

## Cấu trúc
- `logic.js` — luật thuần (tìm đường ≤ 3 đoạn, chia bài luôn có nước, ô dồn 4 hướng, combo, giờ, gợi ý/đảo).
- `game.js` — vẽ canvas, hiệu ứng (đường nối, ô vỡ, điểm bay, ô trượt), HUD, âm thanh, lưu tiến độ, menu/kết thúc.
- `sprites.js` — mã loại ô và bộ hình dự phòng.
- `test/logic.test.mjs` — `node --test test/logic.test.mjs` (13 test, gồm giải trọn 8 màn × 12 seed).
- `screenshots/e2e.mjs` — test trình duyệt thật (Chrome headless, bấm chuột/chạm thật, đổi kích thước giữa ván, chụp ảnh): `node screenshots/e2e.mjs <thư mục ra>`.

## Prompt ImageGen

Hai tấm sprite được tạo bằng ImageGen tích hợp, tách theo ô trong suốt và sắp lại thành một atlas WebP.

- A production sprite sheet for a Vietnamese tile matching game. Exactly sixteen isolated cute animal FACE icons in an exact 4-column by 4-row regular grid, each face centered in its own equally sized square slot, all rows and columns equally spaced, within the central 68 percent of each cell, wide transparent gutters; background truly transparent. Pixel art with clear chunky shapes, dark warm outlines, warm saturated palette and crisp distinctive ears and markings, readable at 26 pixels. No grid lines, letters, numbers or decoration. Exact order left to right, top to bottom. Row 1: gray cat, white rabbit with long ears, orange fox, black and white panda. Row 2: brown floppy-eared dog, pink pig, green frog, yellow chick. Row 3: brown bear, gray mouse with big ears, black-and-white cow with little horns, tawny owl with large eyes. Row 4: tan monkey, orange tiger with stripes, blue-gray penguin with white belly, curly white sheep.
- Transparent production sprite sheet for a pixel art tile matching game. EXACTLY 20 isolated pixel art icons: 5 equal-width columns, 4 equal-height rows. Every icon centered in its exact grid cell, artwork within the central 65% of each cell, ample transparent separation. Clean chunky pixel art, warm dark outlines, saturated color blocks, crisp silhouettes readable at 26 pixels. No squares or frames behind icons, no text or digits. True alpha transparent background. Exact order: row 1 red apple, pink strawberry, red white-spotted mushroom, green leaf, pink five-petal flower; row 2 golden five-pointed star, ruby heart, orange sun with rays, white cloud, blue water drop; row 3 yellow bell, cyan faceted diamond, green four-leaf clover, brown acorn, cream egg; row 4 wedge of watermelon, pink frosted cupcake, orange carrot with green top, purple wrapped candy, mint ice cream cone.
