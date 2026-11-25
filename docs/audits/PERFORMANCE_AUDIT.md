# Audit hiệu năng

_Audit Lụm Kèo · 24–25/11/2026 · 7 agent kiểm song song trên trình duyệt thật (Chrome headless giả lập). Ảnh chụp nằm ngoài git; bằng chứng chi tiết ở `raw/`._

**Cách đo:** script CDP (FCP / LCP / CLS / TBT / request / KB), performance trace qua Chrome DevTools MCP, giả lập Slow 4G (150 ms, 1,6 Mbps) + CPU chậm 4×, đo heap sau chơi lại nhiều lần. Số lab, nhiễu do máy dùng chung — chỉ kết luận khi lặp lại.

**Tốt:** game casual nhẹ (314–607 KB, LCP < 1,2 giây không giới hạn mạng); không rò bộ nhớ (heap 2048 0,90 → 0,94 MB sau 5 ván; chuyển 3 game ổn quanh 3 MB); Best Practices + SEO 100.

**Số chính:**

| Trang | Kết quả |
|---|---|
| Server | Không gzip/br, không ETag, HTTP/1.1, edge Chicago (ord1), max-age 300 |
| Trang chủ | CLS 1,0–1,2 (mobile), LCP 5,96 giây (4G chậm), 2,5 MB lúc đầu |
| Tiệm Trà Sữa | 12,2 MB / 95 request trên mobile, tự tải ngầm ~7 MB ảnh HD |
| Thám Tử Hẻm | FCP 18,5 giây (4G chậm + 4×), 24 module tải nối tiếp |
| Cờ Tỷ Phú | 2.342 KB, FCP 8,2 giây (3G + 4×) |
| Ma Sói | 3,4 MB ở sảnh |
| Cờ Caro / Cá Ngựa | ~150 KB, FCP ~1,5–2,2 giây |
| Máy yếu (CPU 4×) | Trà Sữa 19–23 fps, Bánh Mì 13–21, Cơm Tấm 24 (khung hở 917 ms) |

**Ưu tiên:** sửa server một lần (nén + ETag + cache dài) và tự host font là lợi cho mọi game; sau đó "tải khi cần, không tải nền" cho ảnh -hd của dòng game tiệm và Thám Tử — nên ghi thành quy tắc trong PLAYBOOK kèm ngân sách dung lượng mỗi trang.

## Danh sách (13)

### P1 (5)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PERF-04 | P1 | Toàn cổng | Server không nén gzip/br, không ETag/Last-Modified (luôn trả lại đủ byte), HTTP/1.1; server đặt ở Chicago, không CDN | server.js: nén zlib + ETag/304 + max-age 1 năm immutable cho file có ?v=; lâu dài đặt Cloudflare phía trước. | S/M |
| PERF-02 | P1 | Trang chủ | Trang chủ nhảy bố cục khi tải: CLS 1,0–1,2 trên điện thoại (0,94 khi giả lập 4G chậm), tới 0,4 trên desktop; LCP 5,96 giây | Giữ chỗ sẵn cho hero / lưới game / khu thử thách, đặt ô tìm kiếm bằng CSS thay vì JS, preload ảnh slide đầu. Gộp HOME-01. | S-M |
| PERF-01 | P1 | Tiệm Trà Sữa (có lẽ cả Bánh Mì, Cơm Tấm) | Trà Sữa tự tải ngầm ~7 MB ảnh HD khi người chơi chưa làm gì (tổng 12,2 MB trên điện thoại) | Chỉ tải mỗi sheet ngay trước khi cần; journal-card sang WebP; dùng bản thường thay -hd trên màn nhỏ. Đạt: đứng yên 60 giây < 3 MB. | M |
| PERF-03 | P1 | Thám Tử Hẻm | Trắng màn hình 18,5 giây khi giả lập 4G chậm + máy yếu: 24 module JS tải nối tiếp, mọi file vụ án tải ngay từ đầu | Nén (PERF-04), modulepreload, màn tựa HTML tĩnh, chỉ nạp file vụ khi chọn vụ, srcset ảnh tựa. Gộp TTH-05. | M |
| BRD-06 | P1 | Cờ Tỷ Phú | Cờ Tỷ Phú nặng 2,3 MB (bàn 1,3 MB + poster 0,9 MB), chữ đầu tiên hiện sau 8,2 giây trên 3G | Xuất ảnh đúng cỡ hiển thị (~1.344 px), srcset 1×/2×, poster ≤ 150 KB, giữ lưới 2× sắc nét. | M |

### P2 (6)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PERF-05 | P2 | Toàn cổng | Google Fonts chặn hiện trang (ước tiết kiệm ~2,1 giây); font dự phòng Georgia vỡ dấu tiếng Việt khi Google Fonts lỗi | Tự host font subset tiếng Việt + preload; đổi font dự phòng. Gộp HOME-06. | S |
| HOME-03 | P2 | Trang chủ | Trang chủ tải ngay 2,5 MB ảnh (thumb ~100 KB hiện ở 113 px); mạng chậm thì sảnh chờ báo lỗi | Thumb 240w + srcset, gán ảnh slide khi tới lượt, không render lưới Mở phòng nhanh trên mobile, gọi API sảnh trước + thử lại. | M |
| PERF-06 | P2 | Nông Trại | Nông Trại nhảy bố cục khi tải (CLS 0,47–0,66), có long task 65–170 ms mỗi giây | Giữ chỗ cho các khối bản đồ; placePan chỉ chạy khi resize/scroll/đổi cảnh. Gộp TLC1-15. | S-M |
| PERF-07 | P2 | Ma Sói | Sảnh Ma Sói tải 3,4 MB, gồm cả ảnh làng ban đêm chưa cần | Tải ảnh đêm khi vào phòng; PNG sang WebP. | S |
| TLC1-08 | P2 | Tiệm Trà Sữa | Máy yếu (CPU chậm 4×) chỉ còn 19–23 khung/giây khi đang ca: logic apply + structuredClone chạy mỗi khung, HUD vẽ lại mỗi khung | Tick logic 5–10 lần/giây, HUD chỉ ghi DOM khi đổi, cache hàm định dạng tiền. | M |
| TLC2-10 | P2 | Bánh Mì, Cơm Tấm | Máy yếu: Bánh Mì 13–21 khung/giây, Cơm Tấm 24 khung/giây với khung hở 917 ms | Trace ở 4× tìm hàm nóng, vẽ lại theo diff, bỏ filter động trên sprite. | M |

### P3 (2)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PERF-08 | P3 | Toàn cổng | Ảnh lớn hơn cần: thumbnail 720×540 lossless 109–215 KB, ảnh nền vài game ~0,5 MB | Lượng tử hoá bảng màu, srcset cỡ 360 px. | S |
| PERF-09 | P3 | 10 game casual | Âm thanh tải hết ngay khi mở game, kể cả khi đang tắt tiếng; chỉ có định dạng .ogg (cần thử iPhone thật) | Tải âm thanh ở lần chạm đầu; thêm bản m4a dự phòng. | S |
