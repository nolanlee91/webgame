# Đặc tả màn hình

Ba ảnh concept duyệt bố cục và phong cách. Trạng thái và chuỗi tiếng Việt trong tài liệu này là chuẩn cho UI triển khai. Desktop lấy mốc 1440 × 900, mobile 390 × 844 và kiểm tiếp ở 360 px. Mỗi màn giữ một hành động chính, cỡ chạm 44 px trở lên, tương phản văn bản 4,5:1 và hiển thị focus. Giữ công việc đang làm khi đổi vùng hiển thị.

| Màn | Desktop | Mobile | Trạng thái và điều khiển |
|---|---|---|---|
| **Main Shop** · [concept](concepts/main-shop.webp) | Cảnh quán 3/4 mở toàn khung, HUD ca/thời gian/tiền nhỏ, hàng chờ cạnh quầy, dock thấp | Cắt cảnh theo vùng và chuyển bằng dock Quầy, Khách, Kho, Sổ. Không thu nhỏ cả bản đồ | Chạm khách để ghim phiếu. Hàng chờ rỗng có gợi ý bước phù hợp. Quầy đổi trạng thái khi có mẻ topping sẵn. |
| **Brewing Station** · [concept](concepts/brewing-station.webp) | Phiếu trái, ly lớn giữa, nguyên liệu gần ly, hàng điều khiển dưới | Phiếu ghim ở đầu, ly ở giữa, một dải nguyên liệu và panel định lượng dưới | Hiện yêu cầu bằng chữ lẫn icon. Chọn → xem mức → xác nhận. Khóa bước sai thứ tự có lý do. Hết hàng dẫn về kho hoặc mục đổi món hợp lệ. Đóng nắp và giao là hai bước. |
| **Customer Orders** | Hàng khách trong không gian, phiếu đang chọn mở cạnh cảnh | Danh sách đơn dạng tờ phiếu cuộn dọc bên trên dock | Mỗi đơn có ID, số ly, thời gian, khách và trạng thái. Đơn nhiều ly có khe ghép. Chọn giao chỉ khi đủ ly hoặc có xác nhận giao thiếu. |
| **Drama Event** · [concept](concepts/drama-event.webp) | Cảnh quán sau hai chân dung, câu thoại và hai nút lựa chọn | Một chân dung đang nói, tên người nói, hai nút toàn bề ngang, cuộn nếu câu dài | Ca tạm dừng. Lựa chọn tốn tồn kho hoặc tiền phải hiện chi phí. Sau chọn hiện hệ quả ngay hoặc ghi “Chờ đến ca sau”. |
| **Social Reviews** | Sổ mở trên nền quán, danh sách trái và phản hồi phải | Một danh sách, chạm review mở chi tiết, quay lại giữ vị trí | Sao, câu thoại, nguyên nhân và mốc danh tiếng. Chỉ gửi một phản hồi cho mỗi review đủ điều kiện. Kiểm tra trạng thái chưa có review. |
| **Upgrade & Decoration** | Cảnh bên trái, bảng tùy chọn bên phải, preview thay trực tiếp trong cảnh | Dải danh mục và panel dưới. Chọn vị trí bằng chạm hoặc nút chuyển vị trí | Hiển thị giá, cấp và tác động. Xác nhận mua mới trừ tiền. Vị trí cản lối có giải thích, hủy khôi phục đồ hiện tại. |
| **Daily Summary** | Sổ đóng ca gồm thống kê ngắn và một khoảnh khắc nổi bật | Một cột, doanh thu/lãi và số ly ở đầu, câu chuyện và nút lưu ảnh tiếp theo | Hiện giá vốn, hao hụt, lãi, review, sự kiện. Ba nút theo ngữ cảnh “Lưu ảnh”, “Nâng cấp”, “Ngày tiếp theo”. |

## Bản thiết kế thẻ Nhật Ký Làm Chủ

Khung dọc 1080 × 1350. Đầu thẻ nền kem có logo chữ “Lụm Kèo” và tên tiệm. Nửa trên là crop NPC và đồ uống từ cảnh hoặc ảnh game hợp lệ. Bên dưới là một câu thoại và kết quả ngắn. Dải cuối giữ số ly và lãi ca ở trái, `lumkeo.com` ở phải. Mẫu câu là “0% đường, 100% hiểu lầm.” Trước khi xuất, cho bỏ tên tiệm và đổi khoảnh khắc nếu có nhiều câu chuyện. Xuất PNG, không phụ thuộc quyền đăng mạng xã hội.
