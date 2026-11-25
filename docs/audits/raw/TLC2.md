# REPORT — TLC2 (Tiệm Bánh Mì + Quán Cơm Tấm)
(Agent không ghi được file — coordinator chép từ báo cáo gửi qua tin nhắn. Ảnh `shots/` 64 tấm; script `*.mjs`; dữ liệu `*.json`.)

## Phạm vi đã chạy thật
Server 8903, headless Chromium, chạm thật `Input.dispatchTouchEvent`. Ca 1 từ hồ sơ mới ở 390×844 thời gian thật 45 s; chơi trọn ngày 1 bằng chạm (Bánh Mì 10 khách/10 ổ/5 sao; Cơm Tấm 8 dĩa/3,9 sao, 1 lần tính tiền tự động + 5 lần cộng tay); phá UI (tải lại giữa đơn, ẩn tab, chạm đúp Giao, tên 32 ký tự + emoji, tiền 987.654.321k ở 360); chia sẻ (Khoe lên cấp giữa ca, Khoe chốt ca); ngày sau dựng bằng sửa state (Bánh Mì cấp 18 đủ trạm; Cơm Tấm cấp 15 đủ đồ) ở 390/360; quét viewport giữa ca 360×800, 390×844, 412×915, 320×568, 768×1024, 1366×768@1,25, 1440×900, 1920×1080, 844×390; CPU 4×; âm thanh + độ lún (audit-lib); console + request.

## Hạng
- **Tiệm Bánh Mì: C** — pixel đẹp, gợi ý từng bước, lưu an toàn; nhưng mobile mỗi đơn cuộn 2–4 lần, 9–16 chạm/ổ (TLC2-01), tablet vỡ (TLC2-03), ngang chật (TLC2-04), tràn ngang 360 (TLC2-05).
- **Quán Cơm Tấm: C (sát B)** — dọc rất tốt (cả ca cuộn 1 lần, ~18 chạm/dĩa); nhưng tablet + ngang vỡ, mất nút bếp (TLC2-02), gợi ý bị cắt, nhãn vỉ khó hiểu, lỗi console.
- Điểm: Hình ảnh 8 (UI là thẻ bo tròn kiểu app, hệ số lẻ ở 1440/1920, hai game anh em hai bộ UI) · Mobile UX 5 · Trải nghiệm 7 · Luồng 6 · Hoạt ảnh/tương tác 7 · Hiệu năng 5 · Tiếp cận 5 · Quảng cáo n/a.

## Lỗi (không có P0)
- **TLC2-01 · P1** · Bánh Mì mobile (390, cả 360/412): mỗi đơn phải cuộn 2–4 lần mới thấy nút bước kế (take/slice/veg/fill/wrap/toast); 9–16 chạm/ổ + ~11 chạm thối tiền tay; `.app` cao 1046 trong khung 740. Cause @media ≤760: `.world` cố định 300 px, rail 96 px, bench xếp dọc, không cuộn tự động. Fix: khi ghim phiếu thu cảnh ~150 px + cuộn tới thớt/hàng ô của bước; hoặc hàng ô bước hiện tại dính trên thanh Hoàn tác/Giao; ngày 1–3 gộp Lấy + Rạch. Acceptance ổ đầy đủ với 0 lần cuộn, ≤10 chạm. M. Ảnh bm-390-07-slip-pinned.png, bm-390-08-spreads.png, bm-390-04-shift-4.png.
- **TLC2-02 · P1** · Cơm Tấm 768×1024 + 844×390: chip vỉ thứ 6 đè ô "Dĩa", "Dĩa sạch" nổi đè giữa Món nướng/Đồ chua, mất nút +Than/Quạt/Nấu cơm (không thêm than/nấu cơm giữa ca); ngang 3 thông báo che cảnh, trang 508/390. Cause chỉ 2 tầng bố cục (≤760 mobile / còn lại desktop). Fix thêm tầng tablet/ngang hoặc dùng mobile tới 1024; thêm 768 + 844×390 vào e2e `notCovered`. M.
- **TLC2-03 · P1** · Bánh Mì 768×1024: cảnh 312×176 (k 0,25×dpr2) bị 3 thông báo + dải gợi ý phủ kín (luật 1 thông báo chỉ ≤760); phiếu giãn 1500 px. Cause lưới `minmax(0,1fr) 420px`, rail `align-items:stretch`. Fix bố cục mobile ≤1024 dọc, `align-items:start`, luật 1 thông báo cho tablet. Acceptance cảnh ≥700 px, phiếu ≤140 px. M.
- **TLC2-04 · P2** · Bánh Mì 844×390: thanh đầu 2 dòng ~75 px, 4 hàng chip HUD, gợi ý đè chip + che nửa cảnh, bench hết chỗ, "Thớt trống" đè Hoàn tác/Giao. Fix tầng `(orientation:landscape) and (max-height:500px)` hoặc màn "Xoay dọc để chơi". M.
- **TLC2-05 · P2** · Bánh Mì tràn ngang 360/320 (scrollWidth 376): `button.tab` bảng Chuẩn bị + `li` dải bước; màn chào 320 cũng tràn. Fix `min-width:0; overflow-x:auto`, `.app{overflow-x:clip}`, thêm `noOverflowX` 360 vào e2e. S.
- **TLC2-06 · P2** · Bánh Mì báo "Chưa có khách chờ. Tranh thủ nướng bánh!" khi có 2–5 khách chờ (cả khi thanh kiên nhẫn đỏ). S.
- **TLC2-07 · P2** · Cơm Tấm gợi ý ngày 1 bị cắt "…" đúng chỗ chỉ cách làm ("…rồi chạm một bàn trống …", "Tính đú…"). Fix line-clamp 2 / câu ngắn cho mobile. S.
- **TLC2-08 · P2** · Cơm Tấm mobile chip vỉ "N · bỏ sườn / V / Ấ" khó hiểu với trẻ (desktop có nhãn Nóng/Vừa/Giữ ấm); 6 vòng tròn tối giống nhau. Fix nhãn vùng / màu nền theo vùng, chip trống ghi "Trống". S.
- **TLC2-09 · P2** · Cơm Tấm TypeError lúc chốt ca: `Cannot read properties of null (reading 'groups')` ở `groupById (core/tables.js:22)` ← `act (game.js:170)` ← `frame (game.js:249)` khi tick vừa thu tiền bàn cuối vừa chốt ca ⇒ mất thông báo thu tiền cuối. 1/3 lượt. Fix `state.shift && groupById(...)`. S.
- **TLC2-10 · P2** · CPU 4×: Bánh Mì ngày 1 12,8 fps (khung hở 647 ms, 27 long task/5 s), cấp 18 21,3 fps; Cơm Tấm cấp 15 23,7 fps (khung hở 917 ms); 1× 60 fps. Nghi dựng lại DOM mỗi act + `filter: drop-shadow`/pulse trên sprite. Acceptance ≥30 fps, không khung >250 ms. M (đo headless, máy bận).
- **TLC2-11 · P2** · Vùng chạm nhỏ: Cơm Tấm thanh đầu Tiếng 71×32, Dừng 43×32, ? 40×32, "←" 15×34; Than/Quạt/Cơm/Dĩa sạch cao 40; Chuẩn bị 47×36. Bánh Mì thanh đầu 40, "Rút" 42×38, "Bỏ mẻ" 61×38, ba hàng lò cấp 18 không khe, tab Thớt 36. SCREENS.md yêu cầu ≥44. S.
- **TLC2-12 · P2** · Thông báo xếp chồng: 3 băng cùng màu xanh rêu che ~40% cảnh; huy hiệu nút Sổ bị cắt; Cơm Tấm "Hết giờ nhận khách…" đè thanh đầu khi mở bảng chốt ca. Fix lên cấp màu vàng, gợi ý màu kem, ẩn thông báo khi mở bảng chốt ca. S.
- **TLC2-13 · P2** · Bảng chốt ca quá "kế toán" với trẻ ("Giá vốn", "Hao hụt", "Lời vận hành", "ký gửi"); Bánh Mì phải cuộn tới "Ngày tiếp theo". Fix 3 số to đầu bảng, nút chính dính đáy, chi tiết gập. S.
- **TLC2-14 · P2** · Cơm Tấm mở quán được khi sườn = 0, cơm = 0, không cảnh báo (vào ca "Cơm 0/12", "Than sắp tàn"). Fix ngày 1–2 "Nhập + ướp rồi mở quán" hoặc xác nhận liệt kê thứ thiếu. S.
- **P3:** TLC2-15 Cơm Tấm tiền không dấu phân cách ("987654321k" cắt đè nút Tiếng; "97696k") · TLC2-16 hệ số pixel lẻ trái PLAYBOOK §2 (Bánh Mì 1440→0,769, 1920→1,144; Cơm Tấm 1920→1,1875) · TLC2-17 Cơm Tấm tự focus ô tên quán (`overlays.js:50`, có thể bật bàn phím Android), nút bắt đầu cách 2 màn cuộn · TLC2-18 hai game anh em hai khung UI khác nhau (thanh đầu, màu nút chính, tên nút dock) ⇒ chốt thanh đầu chung vào PLAYBOOK · TLC2-19 nút UI im lặng (tab, Tạm dừng, Mở hàng, Bỏ mẻ, Nấu, chọn nhóm khách), link về không lún.

## Nên giữ
Tải lại giữa đơn giữ nguyên ổ/dĩa + kho + tiền, mở lại vào Tạm dừng; ẩn tab đồng hồ đứng yên, AudioContext ngưng; chạm đúp Giao chỉ giao 1 lần; nút Khoe lên cấp dừng đồng hồ ca; nút Tiếng z 51 bấm được trên lớp phủ; âm thanh không tải trước thao tác đầu, mỗi thao tác chơi có tiếng; hội thoại ghi rõ chi phí; Cơm Tấm dọc cuộn 1 lần; màn tính tiền dạy cộng tay; desktop 1366/1920 ổn; Chơi lại có xác nhận.

## Chưa kiểm
iOS/Android thật; pagehide/freeze thật; mạng 3G; nghe tiếng thật; chơi thật nhiều ngày (cân bằng kinh tế); hội chợ/thử thách/Sổ/Nhật Ký/trang trí chỉ xem lướt; đo tương phản.

## Ghi chú chéo
Dòng game tiệm thiếu tầng 761–1100 px và tầng màn ngang ⇒ thêm 768×1024 + 844×390 vào e2e chung (kể cả Trà Sữa, Nông Trại); token màu riêng cho gợi ý / lên cấp; `noOverflowX` 360 vào e2e chung; an toàn trẻ: không chat, không link ngoài trong ca, nội dung sạch.
