# Nguồn dữ liệu Nối Từ

## Đợt bổ sung 2026-11-18

Thêm 12.628 mục từ vào 7.372 mục có sẵn, tổng 20.000. Phần bổ sung lấy từ các cộng tác viên **Wiktionary tiếng Việt**, qua bản trích xuất Kaikki/Wiktextract tải ngày 2026-11-18:

- Nguồn: https://kaikki.org/dictionary/downloads/vi/vi-extract.jsonl.gz
- Dự án gốc: https://vi.wiktionary.org/
- Giấy phép phần bổ sung: **Creative Commons Attribution-ShareAlike 4.0 International** — https://creativecommons.org/licenses/by-sa/4.0/
- `words-v3-attribution.tsv` ghi tên và URL từng mục từ, dẫn tới trang gốc và lịch sử cộng tác viên.
- `words-v3-audit.json` ghi SHA-256 bản tải, số lượng và kết quả kiểm tra.

Đây là dữ liệu được tuyển chọn/chuyển đổi, **không phải phần tự soạn**. Khi phân phối lại phần dữ liệu này hoặc bản chuyển thể của nó, giữ ghi công, liên kết giấy phép và thông báo thay đổi; áp dụng điều kiện ShareAlike cho dữ liệu chuyển thể thuộc phạm vi giấy phép. Thông báo này không thay đổi giấy phép mã gameplay. Các ghi chú tự soạn ở đầu `words-src.txt` mô tả các đợt cũ, không mô tả đợt 3.

## Cách tuyển chọn và giới hạn

Chỉ lấy tiêu đề tiếng Việt hai âm tiết có thông tin từ loại/định nghĩa; chuẩn hóa theo game, loại trùng với bộ cũ và giữa các mục, lọc blocklist cùng bộ lọc tiêu đề/nhãn/ngữ cảnh trong `words-v3-review-rules.json`. Không ghép âm tiết tự động để tạo từ. Không phân phối lại nội dung định nghĩa trong đợt này.

Đã kiểm tra mẫu biên tập và loại các lỗi rõ ràng; chưa có người thẩm định từng mục trong toàn bộ 12.628 mục mới. Bộ lọc nhạy cảm không bảo đảm tuyệt đối mọi ngữ nghĩa. Cần tiếp tục tiếp nhận phản hồi từ người chơi.

Dấu `~` được dùng thận trọng cho nhãn hiếm/địa phương/thuật ngữ, biến thể và từ mới không có đường nối tiếp ngay, để bot Dễ tránh dùng. Đây không phải thống kê tần suất sử dụng từ. Có 3.791 mục mới đánh dấu `~`, gồm 748 mục chưa có đường nối tiếp trong bộ hiện tại. Số mục cũ bị cụt giảm từ 394 xuống 206; không tuyên bố đã loại hết cụt từ.

## Đợt 4 — 30.000 mục

Thêm 10.000 mục vào bộ 20.000 mục. Bảng `words-v4-attribution.tsv` ghi tiêu đề và nguồn của từng mục. Tệp `words-v4-audit.json` ghi mã SHA-256 của các bản dữ liệu dùng để tuyển chọn và kết quả kiểm tra.

- 7.590 mục từ do các cộng tác viên Wiktionary đóng góp, gồm 2.442 mục từ bản tiếng Việt và 5.148 mục tiếng Việt từ bản tiếng Anh. Dữ liệu đi qua bản trích xuất Kaikki/Wiktextract. Các mục Wiktionary đã được chuẩn hóa và tuyển chọn theo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). URL từng mục dẫn đến trang gốc có lịch sử đóng góp. [Wiktionary tiếng Việt](https://vi.wiktionary.org/) · [Bản trích xuất các mục tiếng Việt từ Wiktionary tiếng Anh](https://kaikki.org/dictionary/Vietnamese/)
- 2.410 mục từ bộ danh sách của Hồ Ngọc Đức, qua bản lưu của Duyệt. Các dòng có URL Viet22K hoặc Viet39K trong bảng ghi công xác định phần dữ liệu thuộc GPL-2.0. Phần này đã được lọc và chuẩn hóa. Văn bản giấy phép nằm trong `words-v4-vietwordlist-license.txt`. [Bộ danh sách tiếng Việt](https://github.com/duyet/vietnamese-wordlist)

Chỉ thêm mục hai âm tiết sau chuẩn hóa, loại trùng và mục khớp danh sách chặn. Với Wiktionary, ưu tiên mục có định nghĩa và loại mục chỉ dẫn sang biến thể, tên riêng và nhãn bị loại. Với Viet22K/Viet39K, kiểm tra cả hai đầu để mục mới có thể được nối tới và có từ nối tiếp trong nhóm thường cũ. Toàn bộ mục từ hai danh sách này được đánh dấu `~` vì nguồn chỉ cung cấp danh sách mục từ.

Đã rà một số mẫu. Chất lượng và độ phù hợp ngữ nghĩa của từng mục vẫn cần được kiểm tra qua phản hồi người chơi. Mục mới có thể thuộc nhóm ít gặp hoặc không có từ nối tiếp sau khi đã dùng một số từ trong ván.
