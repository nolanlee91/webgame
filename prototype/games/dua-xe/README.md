# Đua Xe Vượt Đồi

Game lái xe địa hình chơi một mình: vượt những ngọn đồi sinh ngẫu nhiên, giữ thăng bằng, nhặt xu và can xăng, nâng cấp xe, đi càng xa càng tốt trước khi **hết xăng** hoặc **lật xe**. Thiết kế và hình ảnh tự làm (pixel art vẽ bằng code theo Art Bible V5 / Lụm Kèo), không sao chép game thương mại nào.

Mở: `prototype/games/dua-xe/index.html` (qua server tĩnh). Trang chủ: id `dua-xe`. **Dev cần thêm** `url: "../games/dua-xe/"` vào mục này trong `prototype/homepage/games.js` (Dev Phụ không sửa trang chủ).

## Cách chơi
- **GA**: chạy tới. **PHANH**: giảm tốc, dừng hẳn thì lùi chậm.
- Lên dốc mà ga quá tay xe sẽ bốc đầu. Khi bay trên không: ga = ngóc đầu, phanh = chúi đầu.
- **Thua**: đầu tài xế chạm đất, xe nằm ngửa, hoặc kẹt lật quá 1,5 giây (lật), hay hết xăng mà xe đã dừng (hết xăng).
- Can xăng đỏ đổ đầy bình. Can xuất hiện thưa dần theo quãng đường. Xu vàng có mệnh giá 5, 10 và 25, càng xa càng có giá trị cao.
- Thưởng thêm: lộn một vòng trên không được 50 xu mỗi vòng; bay trên 1 giây được 10 xu mỗi giây.
- Mỗi 400 m đổi vùng: Đồi Cỏ → Đồi Cát → Hẻm Đá Đỏ → Đồi Tuyết. Đồi cao và gắt dần theo quãng đường.
- **Nâng cấp** (5 cấp mỗi loại, giá 150 / 350 / 700 / 1200 / 2000 xu):
  - Động cơ: tốc độ tối đa và lực kéo.
  - Lốp bám: độ bám 45% → 95%, leo được dốc gắt hơn.
  - Bình xăng: 100 → 225 lít.
- Kỷ lục, ví xu và cấp nâng cấp được lưu trong localStorage `wgp.dua-xe.v1`. Tắt tiếng lưu ở `wgp.muted`.

## Điều khiển
| | Desktop | Mobile |
|---|---|---|
| Ga | → / D / ↑ / W, hoặc giữ chuột trên bàn đạp GA | Giữ bàn đạp GA (góc phải dưới) |
| Phanh / lùi | ← / A / ↓ / S, hoặc giữ chuột trên bàn đạp PHANH | Giữ bàn đạp PHANH (góc trái dưới) |
| Tạm dừng | P / Esc / nút ⏸ | nút ⏸ |
| Tắt tiếng | M / nút loa | nút loa |
| Chơi lại | Enter / Space ở màn kết thúc | nút "Chơi lại" |

Bàn đạp hỗ trợ đa chạm (giữ cả hai cùng lúc). Khi chuyển tab hoặc rời cửa sổ, game tự tạm dừng và nhả hết phím.

## Kỹ thuật
- `logic.js`: luật và vật lý thuần JS, không phụ thuộc DOM, tất định theo seed.
  - Xe gồm 5 hạt: 2 hạt khung, 1 hạt đầu tài xế, 2 bánh. Giải bằng ràng buộc vị trí (PBD) với bước 1/120 giây.
  - Treo bánh theo trục khung xe.
  - Lực kéo và phanh giới hạn theo ma sát Coulomb (độ bám × lực ép), nên dốc gắt sẽ trượt bánh.
  - Địa hình là value-noise nhiều tầng, biên độ tăng theo độ khó.
- `game.js`: vẽ canvas pixel độ phân giải thấp (camera bám pixel), HUD, cửa hàng, âm thanh và điều khiển.
  - Âm động cơ tổng hợp bằng Web Audio.
  - Hiệu ứng âm thanh lấy từ `assets/sfx` (chép từ Đào Vàng / Bắn Bóng của dự án).
- Toàn bộ hình ảnh (xe, bánh, xu, can xăng, nền, icon nâng cấp) vẽ bằng code. Không dùng ảnh AI mới.

## Test
- `npm test`: 19 test luật, gồm:
  - địa hình;
  - tăng tốc, phanh, lùi, trôi;
  - độ bám và leo dốc;
  - xoay khi bay;
  - điều kiện lật/thua;
  - xăng và can xăng;
  - xu và quãng đường, mốc, vùng;
  - thưởng bay và lộn vòng;
  - nâng cấp và lưu trữ;
  - tất định;
  - bot mô phỏng chơi xa trên 500 m;
  - fuzz chống NaN và xuyên đất.
- `node tools/sim.mjs 10 0`: bot tự lái 10 ván, in quãng đường trung bình.
- `node prototype/games/dua-xe/screenshots/e2e.mjs <thư-mục-ảnh>`: chạy từ gốc repo, cần server tĩnh `prototype/` ở cổng 8771. Đây là E2E trên Chrome thật qua CDP:
  - desktop: bàn phím và chuột;
  - mobile: chạm và đa chạm;
  - 6 kích thước màn hình.
  - Kết quả và ảnh nằm trong `screenshots/`.
