# Audit điện thoại & responsive

_Audit Lụm Kèo · 24–25/11/2026 · 7 agent kiểm song song trên trình duyệt thật (Chrome headless giả lập). Ảnh chụp nằm ngoài git; bằng chứng chi tiết ở `raw/`._

**Đã kiểm:** 320×568, 360×800, 390×844 (dpr 3, cảm ứng thật qua CDP), 412×915, 768×1024, 844×390 (ngang), 1366×768, 1440×900, 1920×1080 tuỳ game.

**Tốt:** màn dọc 360–412 phần lớn chơi được trọn; hầu như không tràn ngang; ô nhập 16 px ở game cờ; svh + safe-area + touch-action ở nhiều game; bàn phím ảo không che ô nhập (Nối Từ, chat).

**Vấn đề hệ thống:**
- **Màn ngang chưa được thiết kế** ở ~8 game (Cá Ngựa, Tỷ Phú, Cờ Vua, Đặt Bom, Bánh Mì, Cơm Tấm, Thám Tử, Đào Vàng; nút Bắt đầu dưới mép ở Rắn / Xếp Gạch). Cần một rule chung `@media (orientation: landscape) and (max-height: 500px)`, tái dùng bố cục 2 cột của desktop. Xếp Gạch, Đua Xe, Bắn Bóng là mẫu tốt.
- **Tablet 761–1100 px** không có tầng bố cục ở dòng game tiệm.
- **Thao tác chính bị che / phải cuộn** (Trà Sữa, Bánh Mì) — nghiêm trọng nhất vì là thao tác lặp lại liên tục.
- **Vùng chạm < 44 px** nhiều nơi (link "← Trang chủ", pause/mute, thanh trên Cơm Tấm).
- **Overlay che nút tắt tiếng** (Thám Tử khi thoại, Nông Trại khi mở bảng).
- **Hệ số pixel lẻ** ở vài game (trái PLAYBOOK §2).
- Chưa kiểm được trên máy thật: phóng to ô nhập iOS, thanh địa chỉ co giãn, bàn phím ảo thật.

## Danh sách (36)

### P1 (11)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PERF-02 | P1 | Trang chủ | Trang chủ nhảy bố cục khi tải: CLS 1,0–1,2 trên điện thoại (0,94 khi giả lập 4G chậm), tới 0,4 trên desktop; LCP 5,96 giây | Giữ chỗ sẵn cho hero / lưới game / khu thử thách, đặt ô tìm kiếm bằng CSS thay vì JS, preload ảnh slide đầu. Gộp HOME-01. | S-M |
| HOME-02 | P1 | Trang chủ | Màn đầu điện thoại chưa có thẻ game nào: chỉ thấy slide nổi bật + khung mã phòng cao 205 px; thẻ game đầu ở dưới màn (Poki thấy ~12 game) | Trên ≤720 px: thu sảnh còn 1 hàng, dải cuộn ngang 6–8 game "Chơi ngay" dưới slide, thêm h1, hạ cấp khu Thử thách (xem P-E). | M |
| TLC1-01 | P1 | Tiệm Trà Sữa | Nút nguyên liệu (thao tác chính) bị thanh "Hoàn tác / Đổ bỏ ly / Giao" che, game không tự cuộn tới; cuối game ở 360/390 cả dải bước nằm dưới thanh đó | Cuộn tới nút gợi ý sau mỗi bước và khi ghim phiếu; mobile đưa dải bước + nút lên ngay dưới phiếu. | M |
| TLC2-01 | P1 | Tiệm Bánh Mì | Trên điện thoại mỗi đơn phải cuộn 2–4 lần mới thấy nút bước kế; mỗi ổ 9–16 chạm + ~11 chạm thối tiền | Khi ghim phiếu thu cảnh ~150 px và cuộn tới thớt; hoặc hàng nguyên liệu dính trên thanh Giao; ngày 1–3 gộp Lấy + Rạch. Đạt: 0 lần cuộn, ≤ 10 chạm. | M |
| TLC2-02 | P1 | Quán Cơm Tấm | Tablet dọc 768 và điện thoại ngang: thanh bếp tràn, mất nút +Than / Quạt / Nấu cơm (không thể nấu cơm giữa ca) | Thêm tầng bố cục tablet/ngang hoặc dùng bố cục mobile tới 1024 px; thêm 768 và 844×390 vào e2e. | M |
| TLC2-03 | P1 | Tiệm Bánh Mì | Tablet 768: cảnh co còn 312×176 bị 3 thông báo che kín, phiếu giãn cao 1500 px | Bố cục mobile cho ≤1024 dọc, áp luật 1 thông báo cho tablet. | M |
| BRD-02 | P1 | Cờ Cá Ngựa | Bấm Chơi xong trang vẫn cuộn ở dưới, khay xúc xắc và dòng lượt của mình nằm ngoài màn hình | scrollTo(0,0) khi vào ván; phòng chờ thành overlay trên màn hẹp. | S |
| BRD-03 | P1 | Cờ Cá Ngựa | Không chơi được ở điện thoại ngang (bàn cao 812 px) và 320 px (bàn tràn ngang) | Cạnh bàn = min(100vw, 100svh − header); ngang xếp thẻ người chơi hai bên bàn. | M |
| BRD-04 | P1 | Cờ Tỷ Phú | Điện thoại ngang: nút Gieo nằm ngoài màn hình (y=603 trong khung 390) | Bố cục 2 cột như bản 1366 khi màn thấp. | M |
| BRD-05 | P1 | Cờ Vua | Điện thoại ngang: thẻ người chơi bị bóp còn "Q", "E", "N" | Thanh công cụ xuống hàng / cột cạnh bàn; .who{min-width:0}. | S |
| PTY-04 | P1 | Đặt Bom | Điện thoại ngang không chơi được: canvas cao 679 px trong khung 390, D-pad nằm ngoài màn | Bố cục ngang: canvas theo 100dvh, D-pad/BOM cố định hai bên. | M |

### P2 (22)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| HOME-03 | P2 | Trang chủ | Trang chủ tải ngay 2,5 MB ảnh (thumb ~100 KB hiện ở 113 px); mạng chậm thì sảnh chờ báo lỗi | Thumb 240w + srcset, gán ảnh slide khi tới lượt, không render lưới Mở phòng nhanh trên mobile, gọi API sảnh trước + thử lại. | M |
| HOME-05 | P2 | Trang chủ | Ô tìm kiếm chữ 14 px trên điện thoại, iPhone sẽ tự phóng to khi chạm | Cỡ chữ 16 px trên ≤720 px. | S |
| TLC1-03 | P2 | Tiệm Trà Sữa | HUD điện thoại chỉ còn biểu tượng (35 / 0 là gì?), cuối game HUD 2 hàng che nhân viên và bong bóng gọi món | Rút gọn số, nhãn ngắn, HUD tối đa 1 hàng, bong bóng tránh HUD. | S-M |
| TLC1-05 | P2 | Nông Trại | HUD + nhiệm vụ chiếm ~1/3 màn 390, khay hạt nằm dưới mép màn trong khi hướng dẫn bảo "chọn hạt ở khay dưới"; ngang gần như không thấy ruộng | HUD mỏng ~44 px, nhiệm vụ 1 dòng, khay hạt dính đáy, bố cục ngang 2 cột. | M |
| TLC1-09 | P2 | Tiệm Trà Sữa | Màn ngang: bảng tình huống (drama) chỉ thấy 1 lựa chọn | Màn thấp: chân dung đặt hai bên cột lựa chọn. | S |
| TLC2-04 | P2 | Tiệm Bánh Mì | Điện thoại ngang: thanh trên 2 dòng, 4 hàng chip HUD, gợi ý che nửa cảnh, "Thớt trống" đè nút Giao | Tầng bố cục ngang (HUD gọn, bench 2 cột) hoặc màn "Xoay dọc để chơi". | M |
| TLC2-05 | P2 | Tiệm Bánh Mì | Tràn ngang ở 360 và 320 px (tab Chuẩn bị, dải bước) | min-width:0 + overflow-x:auto, .app overflow-x:clip, thêm kiểm noOverflowX 360 vào e2e. | S |
| TLC2-11 | P2 | Bánh Mì, Cơm Tấm | Nút chạm nhỏ hơn 44 px (Cơm Tấm nút về 15×34, thanh trên cao 32; Bánh Mì nút Rút 42×38, ba hàng lò không khe) | Mọi nút ≥ 44 px, hàng lò cách 8 px. | S |
| TTH-01 | P2 | Thám Tử Hẻm | Khung thoại phủ cả thanh trên cùng: không tắt tiếng, không quay lại được suốt đoạn thoại | Khung thoại bắt đầu dưới thanh trên, hoặc nâng thanh trên. | S |
| TTH-03 | P2 | Thám Tử Hẻm | Điện thoại ngang: cảnh chỉ 320×180, nửa phải trống | Bố cục 2 cột như desktop khi màn thấp và ngang. | M |
| TTH-04 | P2 | Thám Tử Hẻm | Ở 320 px nút loa bị cắt mất một nửa, tab sổ tay bị cắt | Từ 360 px trở xuống thu dải uy tín. | S |
| OAQ-03 | P2 | Ô Ăn Quan | Ở 320×568 bàn nhỏ (ô 38 px), mũi tên che 3 ô, tên HUD còn "B…" | Cho phép hệ số lẻ khi ô < 48 px, đặt mũi tên ra rìa. | M |
| BRD-08 | P2 | Cờ Caro, Vua, Tướng, Cá Ngựa | Tên dài bị cắt vô nghĩa ("N…"); Cờ Tướng ≤360 ẩn hẳn tên; ô nhập cắt im lặng giữa chữ | Hiện tên gọi khi hẹp, luôn gắn nhãn "Bạn", bộ đếm ký tự. | S-M |
| BRD-13 | P2 | Cờ Tướng | Điện thoại ngang: toast gợi ý che hàng quân nhà | Chuyển gợi ý sang cột biên bản, chỉ hiện vài lần đầu. | S |
| BRD-14 | P2 | Cờ Vua | Thanh công cụ chật ở 320–360, chữ xuống 2–3 dòng | Rút gọn nhãn / icon. | S |
| PTY-07 | P2 | Ma Sói | Ở 390/360/320 ghế và nhãn tên đè nhau (phòng 8 ghế), chip phiếu che tên | Bố cục ghế riêng cho màn dọc. | M |
| PTY-08 | P2 | Đặt Bom | Nút Hủy phòng ở màn kết quả bị cắt ở 390 | Hộp kết quả cuộn được hoặc nút lưới 2×2. | S |
| PTY-09 | P2 | Nối Từ | Tên trên HUD bị cắt còn ~1 ký tự ở 390 | Tên 2 dòng / rút gọn có nghĩa. | S |
| PTY-11 | P2 | Ai Là Nội Gián | Banner pha che hàng ghế dưới ~2,6 giây đầu pha bỏ phiếu | Dời banner hoặc pointer-events:none. | S |
| QCK-02 | P2 | Rắn, Xếp Gạch (ngang), Bắn Bóng (desktop) | Nút "Bắt đầu" nằm dưới mép màn hình, người chơi chỉ thấy phần luật | Rule chung @media (max-height:500px): thu luật vào <details> hoặc ghim nút. | S |
| QCK-05 | P2 | Đào Vàng | Dọc cảnh quá nhỏ (chữ kết quả ~7 px trên canvas, nút Khoe đè hộp); ngang nút điều khiển ngoài màn | Chuyển về khuôn HUD + overlay HTML như các game khác. | M |
| QCK-04 | P2 | Rắn, Xếp Gạch, nhiều game | Nút Tạm dừng / Âm thanh 36×24 px, link "← Trang chủ" ~92×23 px | Tối thiểu 44 px. | S |

### P3 (3)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| TLC2-17 | P3 | Quán Cơm Tấm | Tự focus ô tên quán ở màn chào (có thể bật bàn phím Android), nút bắt đầu cách 2 màn cuộn | Bỏ focus tự động trên mobile. | S |
| BRD-18 | P3 | Cờ Vua, Tướng | Bàn căn giữa để trống ~110 px trên/dưới ở màn dọc | Dồn bàn lên, dùng chỗ trống cho quân bị ăn / biên bản. | S |
| BRD-21 | P3 | Cờ online | Hiệu ứng hover dính lại trên màn cảm ứng | Bọc :hover trong @media (hover:hover). | S |
