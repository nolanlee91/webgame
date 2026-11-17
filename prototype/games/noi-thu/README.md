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
- 36 loại ô (16 con vật + 20 đồ vật) **vẽ bằng code** trong `sprites.js` (pixel 16×16, không dùng ảnh AI). Đây là bộ tạm: khi có bộ ảnh 36 ô chính thức chỉ cần thay `renderAnimal`/`TILES` trong `sprites.js` (mỗi loại trả về 1 canvas/ảnh), không đụng `logic.js`/`game.js`. Xem cả bộ: `tools/xem-thu.html`.
- Icon UI và âm thanh dùng lại từ Đào Vàng và Cờ Cá Ngựa (`assets/ui`, `assets/sfx`).

## Cấu trúc
- `logic.js` — luật thuần (tìm đường ≤ 3 đoạn, chia bài luôn có nước, ô dồn 4 hướng, combo, giờ, gợi ý/đảo).
- `game.js` — vẽ canvas, hiệu ứng (đường nối, ô vỡ, điểm bay, ô trượt), HUD, âm thanh, lưu tiến độ, menu/kết thúc.
- `sprites.js` — 36 hình ô pixel.
- `test/logic.test.mjs` — `node --test test/logic.test.mjs` (13 test, gồm giải trọn 8 màn × 12 seed).
- `screenshots/e2e.mjs` — test trình duyệt thật (Chrome headless, bấm chuột/chạm thật, đổi kích thước giữa ván, chụp ảnh): `node screenshots/e2e.mjs <thư mục ra>`.
