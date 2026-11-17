# Ghép Kẹo — bản chơi thử (pixel V5, Lụm Kèo)

Game ghép 3 cổ điển chơi một mình trên lưới 8×8. Đổi chỗ 2 viên kẹo cạnh nhau để tạo hàng ngang hoặc dọc từ 3 viên cùng loại trở lên. Kẹo trong hàng sẽ nổ, kẹo phía trên rơi xuống và kẹo mới rơi từ trên vào.

Game chạy hoàn toàn trên trình duyệt, không cần server. Kẹo là sprite pixel 16×16 vẽ bằng code (canvas), không dùng ảnh AI. Âm thanh và icon chép từ bộ có sẵn.

Cách mở: ở gốc repo chạy `PORT=8768 node server.js`, rồi vào `http://127.0.0.1:8768/games/ghep-keo/`.

## Kẹo
Có 6 loại kẹo. Mỗi loại khác cả màu lẫn hình để người mù màu vẫn phân biệt được:

| Kẹo | Hình |
|---|---|
| Đỏ | Tròn |
| Cam | Vuông |
| Vàng | Thoi |
| Xanh lá | Giọt nước |
| Xanh dương | Lục giác |
| Tím | Tim |

Kẹo đặc biệt:

| Cách tạo | Kẹo nhận được | Tác dụng khi nổ |
|---|---|---|
| Xếp 4 viên thẳng hàng | Kẹo sọc ngang hoặc sọc dọc | Xóa cả hàng hoặc cả cột |
| Xếp hình chữ L hoặc T | Kẹo bom (viền vàng) | Nổ vùng 3×3 |
| Xếp 5 viên | Kẹo sao cầu vồng | Đổi với một viên nào thì xóa hết loại kẹo đó |

Đổi 2 kẹo đặc biệt với nhau tạo vụ nổ lớn hơn:

| Cặp kẹo | Vụ nổ |
|---|---|
| Sọc + sọc | Chữ thập (cả hàng và cả cột) |
| Sọc + bom | 3 hàng và 3 cột |
| Bom + bom | Vùng 5×5 |
| Sao + sao | Quét sạch cả bàn |

Kẹo đặc biệt bị nổ lây sẽ kích hoạt dây chuyền.

## Luật
- **Chặn nước vô nghĩa:** chỉ đổi được khi tạo thành hàng, hoặc khi có kẹo sao, hoặc khi đổi 2 kẹo đặc biệt với nhau. Nước không hợp lệ thì 2 viên đổi chỗ rồi trả về, bàn rung nhẹ và không mất bước.
- **Điểm:** (số viên nổ × 10 + thưởng kẹo đặc biệt) × số vòng nổ dây chuyền. Thưởng là +40 cho kẹo sọc, +60 cho bom, +100 cho sao, +150 khi đổi 2 kẹo đặc biệt và +500 khi đổi sao với sao.
- **Hết nước đi:** bàn tự xáo lại, có thông báo trên màn hình.
- **Gợi ý:** bấm nút Gợi ý, phím H, hoặc đứng yên khoảng 6 giây, 2 viên kẹo của một nước hợp lệ sẽ rung lên.

## Màn chơi
Có 12 màn khó dần. Mỗi màn có số bước giới hạn, điểm mục tiêu và có thể có yêu cầu thu đủ một số kẹo. Đạt đủ yêu cầu là qua màn ngay, mỗi bước còn dư được +60 điểm. Hết bước mà chưa đạt thì thua.

Sao đánh giá theo điểm:

| Sao | Điểm cần đạt |
|---|---|
| 1 sao | ≥ mục tiêu |
| 2 sao | ≥ 1,35 × mục tiêu |
| 3 sao | ≥ 1,7 × mục tiêu |

| Màn | Loại kẹo | Bước | Mục tiêu | Thu thập | Bot tham lam qua được |
|---|---|---|---|---|---|
| 1 | 5 | 20 | 1.200 | — | 99% |
| 2 | 5 | 18 | 1.800 | 14 đỏ | 88% |
| 3 | 5 | 18 | 2.200 | — | 83% |
| 4 | 5 | 18 | 2.000 | 18 vàng, 18 xanh dương | 86% |
| 5 | 6 | 24 | 1.900 | — | 73% |
| 6 | 6 | 24 | 2.000 | 18 cam | 61% |
| 7 | 6 | 25 | 2.300 | 16 xanh lá, 16 tím | 51% |
| 8 | 6 | 25 | 2.700 | — | 38% |
| 9 | 6 | 26 | 2.600 | 18 đỏ, 18 vàng, 18 xanh dương | 41% |
| 10 | 6 | 23 | 2.700 | — | 30% |
| 11 | 6 | 24 | 2.600 | 22 cam, 22 tím | 31% |
| 12 | 6 | 24 | 3.000 | 18 đỏ, 18 xanh lá, 18 xanh dương | 24% |

Cột cuối là tỉ lệ qua màn của một bot luôn chọn nước nổ nhiều nhất, chạy bằng `node tools/sim.mjs`. Người chơi biết tính trước kẹo đặc biệt sẽ dễ qua hơn bot.

Qua một màn thì mở khóa màn kế. **Chế độ Tự do** dùng 6 loại kẹo, không giới hạn bước, không bao giờ kết thúc và có kỷ lục riêng.

## Lưu
Dữ liệu lưu ở `localStorage["wgp.ghep-keo.v1"]`, gồm:
- Màn đã mở, số sao và kỷ lục từng màn.
- Kỷ lục chế độ Tự do.
- Ván đang chơi: bàn kẹo, điểm, bước còn lại, mục tiêu thu thập và hạt giống ngẫu nhiên.

Ván đang chơi được lưu sau mỗi nước, mỗi 5 giây và khi rời trang. Mở lại thì menu hiện nút "Chơi tiếp". Dữ liệu hỏng hoặc sai cấu trúc sẽ bị bỏ qua.

Tắt tiếng dùng chung khóa `wgp.muted`.

## Điều khiển
- **Máy tính:**
  - Kéo chuột một viên sang ô bên cạnh, hoặc bấm 1 viên rồi bấm viên kề bên.
  - Mũi tên hoặc W/A/S/D để di chuyển ô chọn. Space hoặc Enter để chọn kẹo, rồi bấm mũi tên để đổi.
  - H để gợi ý, M để tắt tiếng, Esc để mở menu hoặc quay lại ván.
- **Điện thoại:** vuốt một viên sang ô bên cạnh, hoặc chạm 2 viên kề nhau.
- **Bố cục:**
  - Máy tính: HUD bên trái, bàn bên phải.
  - Điện thoại dọc: HUD gọn ở trên, bàn ở giữa, nút ở dưới.
  - Điện thoại ngang: HUD ở cột trái, bàn bên phải.

## Cấu trúc
- `logic.js`: toàn bộ luật chơi, không đụng DOM, chạy được bằng Node.
  - Tìm nhóm, tạo kẹo đặc biệt, kiểm tra nước đi hợp lệ.
  - Nổ dây chuyền, rơi, sinh kẹo theo RNG có seed.
  - Xáo bàn, thắng/thua, lưu/nạp có kiểm tra dữ liệu.
  - Hàm `swap` trả về từng vòng nổ để vẽ hoạt ảnh.
- `game.js`: sprite pixel vẽ bằng canvas, hoạt ảnh (đổi chỗ, nổ, hạt văng, tia sọc, vòng bom, rơi theo độ cao), chuột/chạm/vuốt/phím, âm thanh, lưu trữ, các hộp thoại.
  - Có SDK giả: `reportScore` và `gameOver` (gửi `{result, level, score, stars, moves}`).
  - Mở `window.__game` để test.
- `index.html`: giao diện và CSS pixel V5.
- `tools/sim.mjs`: mô phỏng cân bằng độ khó.
- `assets/`: âm thanh và icon có sẵn.

## Test
- Unit test luật chơi: `node --test test/logic.test.mjs`. Hiện 15/15 đạt.
  - Có kiểm tra: tìm nhóm, chữ L, tạo kẹo đặc biệt, chặn nước vô nghĩa, nổ/rơi/sinh ô, nhân điểm dây chuyền, tác dụng sọc/bom/sao, các cặp kẹo đặc biệt, xáo bàn khi bế tắc, thắng/thua/sao, chế độ tự do, lưu/nạp.
  - Fuzz: chơi hết mọi màn với nhiều seed. Sau mỗi nước, bàn luôn đầy, id duy nhất, không còn hàng sẵn, luôn có nước đi và điểm khớp với tổng các vòng nổ.
- E2E: mở server ở cổng 8768, rồi chạy `node screenshots/e2e.mjs <thư-mục-ra>`. Hiện 62/62 đạt.
  - Script chạy Chrome headless qua CDP, cổng 9346.
  - Có kiểm tra:
    - Kéo chuột, bấm 2 ô, bàn phím, vuốt và chạm trên mobile.
    - Chặn nước vô nghĩa, khóa thao tác khi đang chạy hoạt ảnh.
    - Gợi ý bằng nút/phím và tự gợi ý.
    - Kẹo sọc, kẹo sao, cặp 2 kẹo sọc.
    - Thắng, mở khóa màn, thua, chơi lại.
    - Lưu, tải lại và chơi tiếp; dữ liệu lưu hỏng.
    - Tắt tiếng, chế độ Tự do.
    - 7 kích thước màn hình không tràn, không có lỗi console.
  - Kết quả lưu ở `screenshots/e2e-ket-qua.txt`.
