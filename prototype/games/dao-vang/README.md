# Đào Vàng — bản thử cơ chế (hình khối tạm)

Chỉ có logic và cơ chế chơi, hình vẽ là hình khối tạm. Asset thật sẽ thay vào sau, khi Art Bible được áp dụng cho game này.

## Chạy thử

```bash
cd prototype
python -m http.server 8766
# mở http://127.0.0.1:8766/games/dao-vang/
```

- Có thể vào thẳng một chế độ: `?players=1` hoặc `?players=2`.
- Thêm `&seed=11` để luôn ra cùng một màn chơi, tiện so sánh và báo lỗi.
- Test logic: `cd prototype/games/dao-vang && npm test` (dùng Node ≥ 20, không cần cài gói nào).
- Test trên trình duyệt (Chrome headless, điều khiển bằng phím và chạm thật): `node screenshots/e2e.mjs <thư-mục-output>`. Lệnh này cần server cổng 8766 đang chạy.

## Cách chơi

| Chế độ | Thả móc |
|---|---|
| 1 người | Space, ↓ hoặc chạm/nhấp vào khung chơi |
| 2 người cùng máy (chung phe, chung điểm) | P1: **S** (móc trái) · P2: **↓** (móc phải) · điện thoại: chạm nửa trái hoặc nửa phải |

- **P** hoặc **Esc**: tạm dừng. Game cũng tự dừng khi chuyển tab.
- Khi kết thúc màn: nhấn Space hoặc chạm để sang màn tiếp theo, hoặc để chơi lại.

## Cơ chế

- **Móc:**
  - Móc lắc qua lại ±72° (chu kỳ khoảng 3,3 giây).
  - Khi thả, móc lao ra với tốc độ 430 px/s.
  - Chạm biên mà không trúng gì thì móc thu về nhanh (640 px/s).
  - Gắp được vật thì tốc độ thu về là `560 / trọng lượng` px/s.
- **Vật thể:**

  | Vật thể | Điểm | Trọng lượng |
  |---|---|---|
  | Vàng nhỏ | 50 | 1,4 |
  | Vàng vừa | 150 | 2,6 |
  | Vàng lớn | 500 | 5,5 |
  | Kim cương | 600 | 1 |
  | Đá nhỏ | 20 | 3,2 |
  | Đá lớn | 60 | 6 |
  | Túi “?” | 30–700, ngẫu nhiên | 1,5 |

  - **Thùng TNT** (từ màn 2): khi bị móc trúng sẽ nổ, phá mọi vật thể trong bán kính 95 px, và móc về rỗng.
- **Màn chơi:**
  - Mỗi màn có 60 giây.
  - Mục tiêu điểm cộng dồn: 650 → 1400 → 2250 → …
  - **Màn 1 đã cân bằng lại** cho người mới: chỉ có 4 vàng vừa (nằm sâu) + 12 vàng nhỏ xen 9 viên đá (4 lớn, 5 nhỏ), không có vàng lớn, kim cương, túi hay TNT. Theo mô phỏng 300 màn (`node tools/sim-man1.mjs`; người chơi nghĩ 0,35–0,85 giây mỗi lượt, bấm lệch ±70 ms), người chơi bình thường cần khoảng 40 giây (đa số 33–45 giây) để đạt 650 điểm, khoảng 12% không kịp. Trước khi chỉnh là khoảng 16 giây. Từ màn 2 giữ nguyên công thức cũ.
  - Hết giờ mà đủ mục tiêu thì qua màn và giữ điểm. Thiếu điểm thì thua, chơi lại từ màn 1.
  - Gom hết vàng, kim cương và túi trước khi hết giờ thì màn kết thúc sớm.
  - Màn chơi được sinh ngẫu nhiên theo seed. Vật thể không chồng lên nhau, và màn nào cũng đủ điểm để qua (đã có test).
- **2 người:**
  - Hai móc độc lập, chung đồng hồ và chung tổng điểm.
  - Mỗi người được ghi riêng số điểm mình gom, hiện ở màn "Qua màn".
  - Hai móc không gắp trùng một vật.

## Cấu trúc

- `logic.js`: logic thuần, không dùng DOM, chạy được trong trình duyệt lẫn Node.
  - Trạng thái là object thường, đi theo bước cố định 1/60 giây.
  - RNG có seed, nên kết quả tất định.
- `game.js`: phần vẽ trên canvas và điều khiển. Tuân theo hợp đồng Game SDK `mount(el, ctx) → { pause, resume, destroy }` (docs/tech-architecture.md §3.3), gọi `sdk.reportScore` và `sdk.gameOver`.
- `index.html`: trang chơi thử độc lập, có SDK giả lập.
- `test/logic.test.mjs`: 22 test cho logic.
- `screenshots/`: ảnh chụp, 2 video ngắn và script E2E.

Viết bằng JS thuần + Canvas 2D, chưa dùng Phaser vì tech stack chưa được cài hoặc duyệt. Phần logic đã tách riêng, nên sau này có thể bọc vào một scene Phaser (engine E2 trong tech-architecture-v2) mà không phải viết lại.

## Chưa làm / chưa kiểm chứng

- Chưa có âm thanh, vật phẩm mua thêm (thuốc nổ, thuốc tăng lực), vật thể di chuyển, hay bảng xếp hạng.
- Màn 1 đã cân bằng bằng mô phỏng, chưa thử với người chơi thật. Từ màn 2 trở đi chưa cân chỉnh.
- Chỉ mới kiểm tra trên Chrome (desktop và giả lập điện thoại). Chưa thử trên máy thật hay Safari/iOS.
