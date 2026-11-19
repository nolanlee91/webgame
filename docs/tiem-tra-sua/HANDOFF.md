# Bàn giao Phase 1 · Tiệm Trà Sữa

| Tài liệu | Nội dung |
|---|---|
| [Thiết kế game](GAME-DESIGN.md) | Ca bán hàng, bảy khu, khách, review, Nhật Ký Làm Chủ và kiểm thử. |
| [Art Bible](ART-DIRECTION.md) | Bốn ảnh gốc đã duyệt, chuẩn thế giới, UI và thông số sprite đề xuất. |
| [Economy](ECONOMY.md) | 8 công thức, 20 cấp, định giá, hao hụt, XP, nhiệm vụ ngày. |
| [Drama](DRAMA.md) | 20 sự kiện có điều kiện, thoại và hai nhánh tác động. |
| [Màn hình](SCREENS.md) | 7 màn desktop/mobile, trong đó 3 có hình, kèm thiết kế thẻ chia sẻ. |
| [Asset manifest](asset-manifest.json) | Ba mockup thực tế và danh mục asset dự kiến. |

## Concept để duyệt

1. [Main Shop](concepts/main-shop.webp) thể hiện lối từ cửa đến hàng chờ, quầy, bếp và chỗ ngồi.
2. [Brewing Station](concepts/brewing-station.webp) thể hiện phiếu ghim, lớp chất lỏng trong ly, nguyên liệu và thao tác.
3. [Drama Event](concepts/drama-event.webp) thể hiện sự kiện C02 với chân dung, đồng hồ dừng và hai cách xử lý.

Mỗi ảnh 1672 × 941, WebP lossless. Hình là mockup bố cục desktop. Mobile có đặc tả riêng và cần dựng thử ở Phase 2. Một số chi tiết trên hình là minh họa. Ví dụ ảnh quầy pha cho thấy trân châu khi đang rót sữa để duyệt các lớp ly trong cùng khung, còn vòng pha cơ bản dùng thứ tự ghi trong Game Design. Nút đóng nắp chỉ khả dụng khi hoàn tất bước cần thiết.

## Mốc hoạt ảnh dự kiến

| Hành động | Khung · nhịp | Điểm đồng bộ |
|---|---|---|
| Đứng/chờ | 2 + 2 khung riêng, 3 fps, lặp | Neo chân và hướng nhìn giữ ổn định. |
| Đi | 4 khung, 8 fps, lặp | Dùng neo chân trên sàn; khi đổi hướng phản chiếu nếu áo hoặc đạo cụ cho phép. |
| Gọi món | 2 khung, 6 fps, một lượt | Phiếu hiện ở frame thứ hai. |
| Rót trà hoặc sữa | 6 khung, 12 fps | Luồng rót ở frame 3–5. Trạng thái nhận nguyên liệu lúc xác nhận, hoạt ảnh hiển thị thay đổi ở frame 4. |
| Thêm topping | 5 khung, 10 fps | Hạt rơi ở frame 3, gắn lớp topping ở frame 4. |
| Thêm đá | 4 khung, 10 fps | Gắn lớp đá ở frame 3. |
| Đóng nắp | 5 khung, 12 fps | Chạm nắp ở frame 4, khóa hình trạng thái hoàn chỉnh. |
| Giao đồ | 5 khung nhân vật và 4 khung hiệu ứng, 10 fps | Ghép tay và ly ở frame 3; review hiện sau chuyển cảnh. |
| Vui / bực / ngạc nhiên | 3 / 3 / 2 khung, 6 fps, một lượt | Giữ chân ổn định, đổi biểu cảm tại khung cuối. |

Nhịp hình dùng để trình diễn. Thời điểm tính kho, giao ly, trả thưởng và lưu tiến trình cần gắn với xác nhận hợp lệ của người chơi để không lặp khi bấm lại, giảm chuyển động hoặc tải lại. Material, anchor và kích thước đề xuất nằm trong Art Bible và manifest.

## Hồ sơ sau Phase 1

Bộ sản xuất và thông số tích hợp xem trong [bàn giao asset Phase 2](ASSET-HANDOFF.md). Màn review, đơn khách, nâng cấp và tổng ca hiện có đặc tả chữ. Claude quyết định kiến trúc khi đến lượt triển khai.
