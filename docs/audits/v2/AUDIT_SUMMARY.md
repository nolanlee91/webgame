# Tóm tắt audit lần 2

_Audit lại Lụm Kèo · 25–26/11/2026 · 7 agent kiểm song song trên trình duyệt thật (Chrome headless giả lập), cùng phương pháp và thang điểm với lần 1 (24–25/11). Mã được kiểm: master ab70036, gồm Đợt 0–6 (Đợt 6 gồm đăng nhập Google và sửa màu viền, chưa lên bản thật). Bằng chứng chi tiết ở `raw/`; ảnh chụp không đưa vào git._

## Kết luận

Sau 6 đợt sửa, Lụm Kèo tăng từ **64 lên 72/100**.

- **An toàn trẻ em:** tăng từ 2 lên 6/10. Lỗi P0 tên tục hiện công khai đã được chặn ở các trường hợp chính.
- **Hiệu năng nền tảng:** có nén, cache và font tự host. CLS trang chủ về 0. Thám Tử hiện chữ đầu tiên sau 0,9 giây, lần 1 là 18,5 giây.
- **Màn ngang và máy tính bảng:** chơi được ở phần lớn game.

Không còn P0. Còn **8 P1**: 7 lỗi mới phát hiện và 1 lỗi cũ (Tỷ Phú nặng). Phần lớn sửa nhanh (công S).

**Điểm tổng: 72/100** (lần 1: 64) · An toàn trẻ em 6/10 (lần 1: 2).

Đối chiếu 134 mục lỗi của lần 1:

| Đã sửa | Sửa một phần | Chưa sửa | Hồi quy |
|---|---|---|---|
| 65 | 30 | 39 | 0 |

Các mục chưa sửa phần lớn là P2/P3 không nằm trong lộ trình.

## Điểm theo trọng số

| Hạng mục | Trọng số | Lần 1 | Lần 2 | Quy đổi | Căn cứ |
|---|---|---|---|---|---|
| Visual Design & Brand Identity | 15 | 7.9 | 8.1 | 12.2 | 3 game tiệm đã sang khung V5. Đã bỏ nhãn "bản chơi thử" và thay `confirm()` bằng hộp pixel. Viền nút hiện đúng màu theo từng phần tử. Còn: hệ số pixel lẻ ở các game tiệm, 16/25 nhãn MỚI/HOT. |
| Mobile UX & Responsive | 25 | 6 | 7.4 | 18.5 | Màn đầu trang chủ có 7 thẻ game. Màn ngang và tablet chạy được ở các game tiệm, game cờ, Đặt Bom, Thám Tử. Nút ≥ 44 px ở hầu hết chỗ. Còn: 5 game nhỏ có nút Bắt đầu nằm ngoài màn khi xoay ngang; Tỷ Phú online tràn màn ở ≤ 360 px; HUD Trà Sữa 4 hàng ở 768. |
| Game Experience | 20 | 7.2 | 7.5 | 15.0 | Vụ 1 Thám Tử tới hiện trường còn 9 chạm. Bánh Mì không còn phải cuộn tay. Cá Ngựa và Tỷ Phú có nút Khoe. Còn: hướng dẫn Nông Trại kẹt 2 chỗ, Cơm Tấm có thể treo lúc chốt ca, Bánh Mì vẫn ~11 chạm mỗi đơn. |
| Navigation & User Flow | 10 | 7 | 7.5 | 7.5 | Đóng tab mở lại vẫn vào đúng ghế. "Ván tiếp" chờ đủ hai bên. Có trang Bảng xếp hạng và thanh điều hướng. Còn: ô tìm đè mục "Bảng xếp hạng" trên máy tính; Cá Ngựa "Về phòng" thoát hẳn khỏi phòng. |
| Animation & Interaction | 10 | 7.4 | 7.4 | 7.4 | Bấm nút có lún và tiếng ở mọi nơi. Cuộn trên điện thoại không còn kêu nhầm. Chưa soi lại hiệu ứng chuyển cảnh. |
| Performance | 10 | 4.5 | 6.8 | 6.8 | Có br/gzip, ETag/304, cache immutable trên bản thật. Trà Sữa lúc đứng yên tải 2,4 MB (lần 1: 12,2 MB). Còn: Tỷ Phú 2,4 MB, LCP trang chủ ~4,7 s và Trà Sữa ~10 s trên 4G chậm, Bánh Mì ~15 fps ở CPU×4, TBT Nông Trại 2,9 s, chưa có CDN. |
| Accessibility | 5 | 6.1 | 6.5 | 3.3 | Nút ≥ 44 px, HUD có nhãn chữ. Lighthouse a11y: trang chủ 95, 2048 93, Trà Sữa 93. Còn: skip link, thứ tự tiêu đề, focus rơi về body ở hero. |
| Advertising Integration | 5 | 2 | 3 | 1.5 | Thẻ Tài trợ SpeakUp Kids có trong code nhưng đang ẩn vì chưa có link. Thẻ kết quả các game cờ còn chỗ đặt. Chưa có quảng cáo chạy thật để chấm. |
| **Tổng** | 100 | **64** | | **72** | |

Mỗi hạng mục lấy trung bình điểm của 7 agent. Ở mục Hiệu năng, số đo toàn cổng (QUICK) được tính nặng hơn.

## Hạng từng game

| Game | Lần 1 | Lần 2 | Ghi chú |
|---|---|---|---|
| Trang chủ | B- | **B** | Điện thoại dọc A-, ngang B+. Máy tính B- vì ô tìm đè mục điều hướng. |
| Nông Trại | B | **C** | Bố cục điện thoại tốt hơn nhiều. Bị hạ vì phát hiện hướng dẫn làm trẻ kẹt 2 lần (lỗi có từ trước, lần 1 chưa thấy). |
| Tiệm Trà Sữa | C | **B** | Nút không còn bị che. Khung V5, HUD 1 hàng. |
| Tiệm Bánh Mì | C | **B** | Không còn cuộn tay. Chơi được trên tablet và khi xoay ngang. |
| Quán Cơm Tấm | C+ | **C** | Tablet và màn ngang đã sửa. Mới phát hiện lỗi treo lúc chốt ca. |
| Thám Tử Hẻm | B+ | **B (sát A)** | Vụ 1 nhẹ cho trẻ. Màn ngang đủ 14 màn hình. |
| Ô Ăn Quan | B- | **B** | Giữ ghế, nhãn mất kết nối, Ván tiếp đúng. Chat còn lọt số điện thoại. |
| Cờ Caro | B | **A** | |
| Cờ Vua | C | **B** | Màn ngang đã sửa. |
| Cờ Tướng | B | **B** | |
| Cờ Cá Ngựa | C | **B** | Ngang, 320 px và nút Khoe đã sửa. Luồng "Về phòng" / "Ván mới" online còn lỗi. |
| Cờ Tỷ Phú | C | **C** | Vẫn nặng 2,4 MB. Online tràn màn ở ≤ 360 px. |
| Ma Sói | C | **B** | |
| Ai Là Nội Gián | C | **B** | Đã có 8 chân dung pixel. |
| Đặt Bom | C | **B** | Màn ngang chơi được, phím chạy đúng sau khi chat, nút Bắt đầu ghim đáy. |
| Nối Từ | B | **B** | |
| 2048 | A | **B+** | Lần 2 có đo màn ngang (lần 1 không đo): nút Bắt đầu nằm dưới mép. |
| Sudoku | A | **B+** | Như 2048. |
| Đố Vui | A- | **B** | Khi xoay ngang, lời giải thích và đáp án bị cắt. |
| Ghép Kẹo | A- | **B** | Khi xoay ngang, nút nằm dưới mép. |
| Đua Xe | A- | **A-** | |
| Xếp Gạch | B+ | **A-** | |
| Nối Thú | B+ | **B** | Khi xoay ngang, nút nằm dưới mép. |
| Rắn Săn Mồi | B | **A-** | |
| Bắn Bóng | B | **A-** | |
| Đào Vàng | C+ | **C+** | Chưa sửa. |

Thang: **A** mượt, trẻ em hiểu ngay trên điện thoại, không P0/P1 · **B** tốt, vài P2 · **C** chơi được nhưng vướng đáng kể · **D** hỏng luồng chính.

Năm game nhỏ bị hạ vì lần 2 đo thêm màn ngang. Đây không phải hồi quy.

## P1 còn lại (đề xuất Đợt 7)

| ID | Game / trang | Vấn đề | Đề xuất | Công |
|---|---|---|---|---|
| TLC22-01 | Cơm Tấm | Bàn cuối trả tiền đúng lúc chốt ca thì game treo ở 23:00, phải tải lại trang (`game.js:180`, `groupById(null)` làm vòng lặp vẽ dừng) | Chặn null ở `state.shift`. Đặt `requestAnimationFrame` trước, hoặc bọc trong try/finally. | S |
| PARTY2-01 | 4 game nhóm + game cờ + trang chủ | Bộ lọc tên và chat còn lọt: "l0n", "c4c", "kặc", "đ ụ m á", chữ full-width "ｆｕｃｋ", chữ giống Latinh "fսck". "l0n" đã hiện làm tên ghế. | Chuẩn hoá NFKC, bảng chữ giống nhau, so cả dạng leetspeak với toàn bộ danh sách từ. | S |
| TTH2-01 | Chat mọi game online | Chat lọt số điện thoại kèm lời mời Zalo ("vao zalo 0912…"), câu chửi "mày ngu", và "đ.ụ m.á" chỉ bị che một nửa. | Che chuỗi ≥ 7 chữ số và các từ zalo / fb / sđt / inbox. Bỏ dấu câu chen giữa chữ trước khi so. | S-M |
| TLC12-01 | Nông Trại | Hướng dẫn kẹt: nhiệm vụ 1 gieo 1 hạt nhưng nhiệm vụ 3 cần thu 3 nông sản; nhiệm vụ 4 trỏ "Bán hết" nên nhiệm vụ 5 không còn hàng để giao. | Khi không có gì để làm thì trỏ khay hạt / ô trống. Cho số hạt và số thu hoạch khớp nhau. Không trỏ vào "Bán hết". | S-M |
| HOME2-01 | Trang chủ, máy tính 1181–1920 | Ô tìm kiếm đè mục "Bảng xếp hạng" 30–90 px (`nav.css:8`) | Dùng nhãn ngắn "Xếp hạng" hoặc cột nav `auto`. | S |
| HOME2-02 | Trang quyền riêng tư | Trang hứa xoá dữ liệu khi gửi email nhưng không có email liên hệ. Trang vẫn ghi dùng Google Fonts. **Chặn bật đăng nhập Google.** | Cần email liên hệ công khai từ chủ dự án. Sửa câu về font. | S |
| BOARD2-01 | Tỷ Phú online | Trang nở ra 379 px ở 320/360, nút loa và nút "Rời" bị cắt | Thanh trên dùng nút chỉ có icon, thêm `min-width:0`. | S |
| BRD-06 | Tỷ Phú | Nặng 2,4 MB, tải xong sau 15–17 s trên 3G (chưa sửa từ lần 1) | Xuất ảnh đúng cỡ, srcset 1×/2×, poster ≤ 150 KB. | M |

**P2 đáng làm cùng đợt:**
- QUICK2-01/02: nút ngoài màn khi xoay ngang ở 2048, Sudoku, Đố Vui, Ghép Kẹo, Nối Thú. Áp `short-screen.css` cho 5 game này.
- BOARD2-02/03: Cá Ngựa online, "Về phòng" và "Ván mới" một phía.
- PARTY2-02: Nối Từ báo lỗi JS mỗi lần vào ván online.
- PARTY2-07: thư mục assets Nội Gián lộ HANDOFF.md và file prompt lên bản thật.
- PTY-12: phòng mặc định vẫn công khai. Chủ dự án cần chốt lại.
- TLC12-04: HUD Nông Trại xuống 2 hàng khi tiền lớn.
- TLC22-03: Bánh Mì "Thối 0k" là nút chính nhưng bị tính lỗi.

## Giới hạn

- **Môi trường:** chỉ kiểm trên Chrome headless giả lập. Không có iPhone/Android thật, chưa thử Safari và Firefox.
- **Số đo thời gian và fps nhiễu:** 7 agent chạy song song trên cùng máy (CPU ~87%). Mỗi số đã chạy lại ít nhất 2 lần và lấy trung vị.
- **Phiên bị ngắt một lần giữa chừng:** các agent chạy tiếp từ log còn lại, không đo lại từ đầu.
- **Lighthouse:** không có mục Performance (giới hạn của MCP).
- **Đăng nhập Google:** chỉ kiểm được trạng thái "ẩn khi chưa bật". Luồng thật cần chủ dự án cài Google trong Supabase.

## Tài liệu

- `raw/HOME.md` · `raw/TLC1.md` · `raw/TLC2.md` · `raw/TTH.md` · `raw/BOARD.md` · `raw/PARTY.md` · `raw/QUICK.md`: 7 báo cáo gốc. Mỗi báo cáo có bảng đối chiếu từng lỗi của lần 1 kèm bằng chứng.
- Lần 1: [../AUDIT_SUMMARY.md](../AUDIT_SUMMARY.md)
