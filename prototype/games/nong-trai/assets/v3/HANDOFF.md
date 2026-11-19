# Asset duyệt hình ảnh Nông Trại 2.0

Đọc atlas từ trái sang phải, trên xuống dưới. `manifest.json` ghi khung cắt và điểm neo, tính bằng pixel trong file giao. Mỗi pixel mỹ thuật là một khối 2 × 2 px. Hiển thị bằng nearest-neighbor. Các sheet là WebP lossless, với alpha cứng cho vật thể cắt rời.

| Sheet | Ô | Lưới | Cách dùng |
|---|---:|:---:|---|
| `buildings.webp` | 256 × 256 | 4 × 3 | Công trình và trạng thái xây dựng trên bản đồ. Ghép cánh cối xay lên trục của thân bằng hai điểm trong manifest. Chuồng trống để vật nuôi có thể đặt riêng. |
| `decor.webp` | 128 × 128 | 4 × 2 | Vật trang trí đặt theo điểm neo chân. |
| `workshop.webp` | 64 × 64 | 4 × 2 | Hàng trên là vật liệu phủ kín ô. Sàn A/B sáng, ít vân và có mép ngang khớp nhau. Tường nâu trầm, chân tường lặp ngang. Hàng dưới là bốn vật thể trang trí rời. |
| `machines.webp` | 192 × 192 | 3 × 3 | Mỗi hàng là một máy. Dùng cột đầu khi đứng yên, luân phiên hai cột sau khi chạy. Thân lấy chung một khung, hiệu ứng được ghép vào vùng lửa, khói hoặc bột. |
| `market.webp` | 192 × 192 | 3 × 2 | Atlas quầy và đạo cụ rời cho bố cục cũ. Dùng `market-stall.webp` cho quầy hoàn chỉnh. |
| `market-stall.webp` | 384 × 384 | 1 × 1 | Một gian hoàn chỉnh với cột tre, bạt và quầy. Dịch ngang theo `repeatStepX` để hai gian dùng chung cột. Vẽ Cô Hai trước gian quầy, theo `keeperLayer.drawRect`. |
| `npc.webp` | 128 × 128 | 4 × 2 | Cô Hai ở hàng trên, Chị Ba ở hàng dưới. Hai khung đứng, một khung vẫy, một chân dung. Chân giữ điểm neo khi chuyển khung. |
| `npc-market.webp` | 192 × 192 | 1 × 1 | Cô Hai từ hông trở lên, riêng cho cảnh sau quầy. |
| `items.webp` | 64 × 64 | 8 × 4 | Icon cho kho, chợ và giao diện. Bao hạt giống màu xanh có hình mầm, bao thức ăn màu nâu vàng. Có thể hiển thị ở 32 × 32 px. |

Prompt ImageGen nằm trong `generation-prompts.json`. `sha256.json` bao gồm tất cả ảnh giao kèm. `contact-sheet.png` dùng để duyệt.

Contact sheet có mẫu ghép hai gian dùng chung cột và Cô Hai sau quầy. Khi ghép cảnh, dùng cùng tỷ lệ cho bước ghép và hình quầy để cột không lệch.

## Bộ bổ sung cho M1–M2

- `npc-2.webp` dùng lưới 4 × 2, ô 128 × 128. Bác Tư ở hàng trên, Anh Út ở hàng dưới. Hai khung đứng, một khung vẫy và một chân dung theo thứ tự cột.
- `ui-kit.webp` dùng tọa độ riêng theo từng frame. `slice` là khoảng cách từ bốn mép của frame nguồn. Giữ nguyên góc, co giãn phần cạnh và giữa. Với thanh tiến độ, `repeatX` ghi độ rộng hai đầu cần giữ khi lặp phần giữa.
- `fx.webp` gồm 6 hàng, mỗi hàng 4 khung 64 × 64. Vị trí hạt và độ cao đồng xu đã nằm sẵn trong khung. Các hiệu ứng phát một lần, theo thứ tự trong `animations`.
- `contact-sheet-2.png` là ảnh duyệt bộ bổ sung.

## Bộ bổ sung cho M3–M4

- `animals.webp` dùng tọa độ từng frame thay vì một cỡ lưới cố định. Hàng đầu là gà 96 × 96, hàng thứ hai là bò 128 × 128, mỗi con có hai khung đứng, hai khung ăn và hai khung đi hướng trái. Ba icon bong bóng ở hàng cuối là trứng, sữa và đói, mỗi ô 48 × 48.
- `village.webp` chứa bốn công trình 256 × 256, hai ô đường và mép cỏ 64 × 64 lặp ngang, cùng ba đồ trang trí 128 × 128. Đọc tọa độ từng frame trong manifest vì atlas dùng ô chứa lớn hơn một số sprite.
- `buildings-2.webp` có bốn công trình nâng cấp, ô 256 × 256 với neo chân giống bản cấp 1, theo thứ tự kho, xưởng, chuồng gà, nhà kính.
- `machines-2.webp` có ba hàng gồm máy bơ sữa, nồi đường và lò bánh hai cửa. Mỗi hàng dùng một khung đứng và hai khung chạy, ô 192 × 192. Khung chạy dùng chung thân máy với khung đứng, phần tay quay, lửa và hơi nước thay đổi.

Contact sheet hiện gồm cả A và B. Hoạt ảnh và chuyển cảnh vẫn cần được xem lại ở tỷ lệ hiển thị thực tế khi ghép vào game.

## Lúa, mía và lò bánh cấp 2

- `crops-2.webp` là atlas 400 × 160, gồm hai hàng lúa và mía, mỗi hàng có năm ô 80 × 80. Các cột lần lượt là hạt vừa gieo, mầm, đang lớn, gần chín, chín. Mười khung mới dùng điểm neo chân [40, 74] như atlas `garden/crops.webp`.
- Hàng 3 của `machines-2.webp` là lò bánh cấp 2. Thân lò rộng khoảng 1,29 lần bản cấp 1, có hai cửa lửa, ống khói cao và kệ bánh gỗ. Hai khung chạy thay đổi lửa và khói. Ba khung dùng ô 192 × 192 và giữ neo [96, 168].
- `contact-sheet-3.png` đặt lúa và mía cạnh cà rốt, ngô ở cùng tỷ lệ, đồng thời đối chiếu hai cấp lò. Sprite xuất WebP lossless, alpha cứng, mỗi pixel nghệ thuật phủ 2 × 2 pixel ảnh.
