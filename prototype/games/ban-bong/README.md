# Bắn Bóng Khủng Long

Game bắn bóng ghép màu một người chơi, không cần server. Sân hang rừng và khủng long có ảnh pixel art riêng. Bóng và ký hiệu được vẽ bằng Canvas để giữ sáu màu và hình dễ phân biệt.
Tên và hình là bản riêng của Lụm Kèo, không lấy tên hay giao diện của game thương mại nào.

## Cách chơi
- Bắn bóng lên trần. Ghép từ 3 bóng cùng màu trở lên thì nổ; bóng không còn bám trần sẽ rơi (điểm gấp đôi).
- Mục tiêu mỗi màn: cứu hết trứng khủng long trong đám bóng, bằng cách làm nổ hoặc làm rơi chúng, trước khi hết viên.
- Đá không nổ, chỉ rơi khi mất chỗ bám. Bom nổ tung các bóng quanh nó.
- Bắn hụt đủ số lần thì trần hạ thêm một hàng. Bóng chạm vạch đỏ là thua.
- Có 12 màn khó dần (nhiều màu hơn, nhiều trứng/đá/bom hơn, trần hạ nhanh hơn) và chế độ Tự do không giới hạn viên.
- Thắng được 1–3 sao, cộng thưởng theo số viên còn dư.

## Điều khiển
- Máy tính: rê chuột để ngắm, bấm để bắn; ←/→ xoay nòng (giữ Shift để xoay chậm); Space/↑/Enter bắn; X hoặc bấm vào bệ để đổi viên; M tắt tiếng; Esc mở menu.
- Điện thoại: chạm kéo để ngắm, thả tay để bắn; kéo xuống dưới bệ rồi thả để hủy; chạm bệ hoặc nút Đổi viên để đổi viên.

## Lưu
`localStorage` khóa `wgp.ban-bong.v1` lưu màn đã mở, sao, kỷ lục và ván đang chơi. Lần mở sau có nút "Chơi tiếp". Dữ liệu lưu hỏng sẽ bị bỏ qua.

## Ảnh sân và nhân vật

Hai ảnh được tạo bằng ImageGen tích hợp, sau đó thu nhỏ và lưu WebP để tải trong game. Sprite khủng long giữ nền trong suốt.

- `assets/sprites/dino-v2.webp` — “Transparent standalone original game sprite. One expressive chubby baby dinosaur, like a small teal-green triceratops adventurer with warm pale cream cheeks and belly, small amber frill accents, friendly lively wide eyes. Full body, three-quarter view facing right, standing proudly on two feet with hands slightly raised, compact nearly square silhouette. Polished hand-placed 32-bit pixel art, chunky clusters and selective dark outlines, readable at 90 pixels. Centered with modest padding. No floor, no shadow outside silhouette, no environment, no props, no lettering. True transparent background.”
- `assets/bg/arena-v2.webp` — “Portrait 4:5 original pixel art background for mobile dinosaur bubble shooter. Deep petrol teal and blue-green prehistoric jungle grotto, an open, quiet dark lagoon-colored central area that occupies 85 percent of width and almost the entire height, very low contrast, practically uniform dark teal with only soft broad shaded planes. Narrow framing at extreme edges: distant fern silhouettes and teal stone, tiny firefly specks very sparse, subtle green moss, a thin teal stone ground ledge at absolute bottom. Premium hand-placed 32-bit pixel art. Designed to sit behind bright colored game balls across entire field, do not put any objects, balls, characters, symbols, frames, checkerboards, brick patterns, or lettering in the playfield. Edge accents moss green and muted turquoise, minimal amber. No user interface.”

## Bệ phóng

`assets/sprites/launcher-base.webp` và `assets/sprites/launcher-barrel.webp` là hai phần trong suốt từ một tấm ImageGen tích hợp. Nòng xoay quanh đúng tâm bắn. Bóng thủy tinh và ký hiệu màu được vẽ bằng Canvas.

> Two separate game sprite parts in a horizontal sheet for a charming original pixel-art baby teal triceratops bubble-shooting game in a lush dark teal jungle grotto. TRUE transparent background. Left half: one compact squat turquoise stone and warm brass seed-pod launcher BASE, front view, like a tiny rounded art-deco temple pedestal with a SOCKET at its exact top center, strong readable silhouette, no barrel, no ball. Right half: one separate charming rounded brass and teal short barrel, perfectly UPRIGHT facing straight up, flat front orthographic view, dark flared open muzzle at top, amber brass rim and jade body. No sphere, no projectile, no character, no platform behind either part or cast shadows. Thick transparent gutter between both assets, fully separated. Handmade premium 32-bit crisp pixel art with broad shading and medium-dark outline, teal, muted gold, cream. No letters, text, labels or interface. Both parts centered independently in their halves.

## Tệp
- `logic.js`: luật thuần (lưới lục giác, đường bay có nảy tường, nổ/rơi, trứng, đá, bom, hạ trần, màn chơi, lưu/khôi phục).
- `game.js`: vẽ canvas, hiệu ứng, âm thanh, điều khiển.
- `index.html`: bố cục, HUD, menu.
- `test/logic.test.mjs`: 18 test luật (`npm test`).
- `tools/sim.mjs`: bot mô phỏng để chỉnh độ khó (`npm run sim`).
- `screenshots/e2e.mjs`: E2E trên Chrome thật qua CDP. Chạy `PORT=8768 node server.js` ở gốc repo, rồi `node prototype/games/ban-bong/screenshots/e2e.mjs <thư mục>`. Kết quả mới nhất nằm trong `screenshots/e2e-ket-qua.txt`.
