# Art Bible · Tiệm Trà Sữa

Đọc cùng [Art Bible V5, mục 0.1](../art-bible-v5.md). Bốn ảnh được duyệt nằm ở `prototype/homepage/assets/thumbs/`, bản bắt đầu Phase 1 là commit `8eb83b1`.

| Mẫu gốc | Chi tiết giữ trong game |
|---|---|
| [Tiệm Trà Sữa](../../prototype/homepage/assets/thumbs/tiem-tra-sua.webp) | Tham chiếu chính. Nhân viên trưởng thành, khăn và tạp dề mận, tay áo kem, vàng đèn mây trên gạch teal, tay thao tác và ly dễ nhận ra. Kính có viền phản sáng mảnh, thấy được chất lỏng và topping. |
| [Nông Trại](../../prototype/homepage/assets/thumbs/cozy-nong-trai.webp) | Lớp cảnh từ giỏ và tán gần đến nhà và tầng xa. Lá và tre tách bằng cụm sáng tối. Áp dụng vào lớp quầy, cửa, phố. |
| [Tiệm Bánh Mì](../../prototype/homepage/assets/thumbs/tiem-banh-mi.webp) | Bàn gỗ và kệ kính có đường biên bậc thang rõ, món ăn đọc được ở góc 3/4. Bố trí tay và dụng cụ để hiểu ngay hành động. |
| [Quán Cơm Tấm](../../prototype/homepage/assets/thumbs/quan-com-tam.webp) | Đèn ấm trên phố xanh tím, đồ sành và mái gạch đọc được bằng những mảng chọn lọc. Lấy tương phản này cho cuối ca và hội thoại. |

## Thế giới và ánh sáng

Giữ chất Detailed HD Pixel Art từ quầy tới nhân vật, nguyên liệu, máy và hiệu ứng. Một loại vật liệu có các cụm màu riêng: phản sáng hẹp cho kính, mảng bậc thang dài cho gỗ, đốm nhỏ chọn lọc cho gạch men, nét sáng lạnh viền kim loại, bè bóng cong đơn giản cho vải tạp dề. Nhân vật tỷ lệ tự nhiên, mắt và lông mày là dấu hiệu biểu cảm chính. Dùng mảng rời và dithering nhẹ để chuyển sắc. Bố cục tiệm có quầy gỗ ở trước, khách ở lớp giữa, bếp và cửa sổ nhìn ra phố ở lớp sau. Chọn nguồn sáng chung từ cửa sổ trên-trái và đèn vàng cục bộ trên quầy.

Swatch khởi đầu để duyệt cạnh mẫu: navy `#16202D`, teal `#244F4D`, hổ phách `#E8A64F`, gỗ `#8D5134`, mận `#71364E`. Giữ lưới dự kiến 1 pixel nghệ thuật = 2 px xuất, không pha giữa các lớp sprite cùng cảnh. Không áp bộ lọc pixel lên ảnh mịn hoặc xếp hình CSS thay cho đồ vật trong thế giới. Emoji chỉ có thể xuất hiện ở dữ liệu nhập của người dùng.

## UI và hội thoại

Modern Cozy dùng kem `#FFF2DC`, caramel `#80543A`, teal `#29625C`, sage `#83A28A`. Nút bo vừa, chữ đậm vừa, trạng thái có chữ và hình, bóng mỏng. Ưu tiên Be Vietnam Pro hoặc font giao diện hỗ trợ đầy đủ dấu tiếng Việt trong repo. Chữ và nút là lớp UI độc lập với sprite. Hạn chế chữ trên đồ vật trong cảnh để dễ thay nội dung. Tôn trọng giảm chuyển động và điều hướng bàn phím.

Drama dùng panel kiểu truyện tranh hiện đại với chân dung pixel, mỗi lượt một câu thoại, hai hoặc ba lựa chọn. Portrait nhân viên giữ khăn mận, tạp dề và ánh sáng như màn pha. Tạm dừng ca và cho thấy hệ quả sau lựa chọn. Khi hội thoại mở, focus vào tiêu đề hoặc lựa chọn đầu, đóng sẽ quay về hành động trước đó.

## Thông số bàn giao dự kiến

- Lưới môi trường 32 px nghệ thuật, xuất tile 64 × 64. Khung nhân vật 48 × 64 nghệ thuật, xuất 96 × 128, neo chân tại `[48,116]`. Máy 96 × 96 nghệ thuật, xuất 192 × 192, neo `[96,168]`, trừ vật thể có chân neo riêng.
- Ly và mọi lớp trong cùng ô 160 × 192, anchor `[80,174]`. Thứ tự vẽ: bóng → thân sau → chất lỏng theo mức → topping lắng → đá → phản sáng thân trước → nắp. Giữ đá và topping trong mask lòng ly. Các layer có thể kết hợp thay vì cần một ảnh cho mỗi tổ hợp công thức.
- Dùng PNG hoặc WebP lossless, alpha cứng cho sprite, metadata atlas ghi tọa độ, điểm neo, frame và thời lượng. Concept có UI minh họa và chỉ dùng để duyệt bố cục, ánh sáng và thao tác.
- Đến Phase 2, thử ghép một cảnh cùng NPC, máy và ly ở kích thước hiển thị thật trên desktop/mobile. Đối chiếu cạnh bốn ảnh gốc trước khi làm cả bộ.
