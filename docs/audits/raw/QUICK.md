# REPORT — QUICK (10 game casual + hiệu năng toàn cổng)
(Agent không ghi được file — coordinator chép từ báo cáo gửi qua tin nhắn. Ảnh `shots/` 45 PNG; `scripts/`, `logs/`, `perf-*.jsonl`, `mem.log`; Lighthouse + trace trong `lh/`.)

## Phạm vi đã chạy thật
- 10 game casual, Chrome headless giả lập, profile trắng, `wgp.muted=1`. 390×844 cảm ứng (chạm/vuốt/giữ/kéo thả thật qua CDP), 1366×768 chuột + phím, ngang 844×390 cho Rắn/Xếp Gạch/Đào Vàng/Bắn Bóng/Đua Xe. Mỗi game chơi tới màn kết quả, Chơi lại, về Trang chủ. Daily: 2048 hết 150 nước, Sudoku giải hết bằng chạm, Đố Vui 5 câu + Khoe.
- Hiệu năng: script CDP đo FCP/LCP/CLS/TBT/request/KB (tắt cache, mobile + desktop) trên trang chủ, quyền riêng tư, Nông Trại, Trà Sữa, Thám Tử, Cờ Tướng, Ô Ăn Quan, Ma Sói, 2048, Đua Xe. Throttle Slow 4G + CPU 4×: trace MCP cho trang chủ, Trà Sữa, Thám Tử; script cho Nông Trại. Lighthouse MCP (a11y/best practices/SEO) cho trang chủ, 2048, Trà Sữa. Bộ nhớ: 2048 ×5 ván, Xếp Gạch ×5, chuyển 3 game ×3 vòng, Đào Vàng vào/ra ×5. Header: curl local, HEAD lumkeo.com (chỉ đọc).
- 10 game × 3 viewport: 0 lỗi console, 0 request hỏng, 0 tràn ngang.

## Hạng
2048 **A** · Sudoku **A** · Đố Vui **A-** · Ghép Kẹo **A-** · Đua Xe **A-** · Xếp Gạch **B+** · Nối Thú **B+** · Rắn **B** · Bắn Bóng **B** · Đào Vàng **C+**.
Điểm phụ: V5 8 · Mobile UX 7 · Trải nghiệm chơi 8 · Điều hướng 7 · Hoạt ảnh 7 · Hiệu năng toàn cổng 5 · A11y 7 (Lighthouse: trang chủ 100, 2048 93, Trà Sữa 93).

## Lỗi (không có P0)
- **PERF-01 · P1** · Trà Sữa tự tải nền ~7 MB ảnh HD khi chưa làm gì (`drama-portraits-hd.webp` 2,46 MB, `portrait-expressions-hd.webp` 2,44 MB, `journal-card.png` 2,18 MB PNG, `street-background.webp` 0,5 MB); tổng 12,2 MB/95 request mobile. Cause `tiem-tra-sua/game.js:36-39` `idle(() => later.forEach(load))`. Fix tải ngay trước khi cần, journal-card sang WebP, bản thường thay -hd trên màn nhỏ. Acceptance đứng yên 60 s < 3 MB. M. (Cơm Tấm `portrait-expressions-hd` 6,2 MB và Bánh Mì có lẽ cùng khuôn, chưa đo.)
- **PERF-02 · P1** · CLS trang chủ 0,94 (Slow 4G + 4×; MAIN/FOOTER/logo bị đẩy ở 5,37 s), Lighthouse mobile 0,246, desktop 0,39/0,016. Ảnh LCP `thumbs/co-ca-ngua.webp` chỉ phát hiện qua app.js; LCP 5,96 s (trễ tải 3,27 s). Fix: giữ chỗ hero/lưới/`.daily__row`, ẩn footer tới khi vẽ xong, preload slide đầu. Acceptance CLS < 0,1, LCP < 4 s khi throttle. S–M. (Trùng HOME-01.)
- **PERF-03 · P1** · Thám Tử Hẻm FCP 18,5 s (Slow 4G + 4×; TTFB 570 ms, DCL 12,4 s): 24 module tải nối tiếp rồi mới `asset-manifest.json` 103 KB; không giới hạn mạng tổng 2 MB, `title-art-hd.webp` 1,1 MB, mọi `data/cases/*.js` (70–90 KB) tải từ đầu. Fix nén (PERF-04), modulepreload/gộp file, màn tựa HTML tĩnh, import vụ án khi chọn vụ. Acceptance FCP < 4 s. M.
- **PERF-04 · P1** · Server không nén gzip/br, không ETag/Last-Modified (luôn 200 đủ byte), HTTP/1.1; bản thật `x-railway-edge: ord1` (Chicago), không CDN. `server.js:84-88`. Fix zlib gzip/br + ETag/304 + `max-age=31536000, immutable` cho file có `?v=`; lâu dài Cloudflare. S (nén + ETag), M (CDN).
- **PERF-05 · P2** · Google Fonts chặn render mọi trang (ước tiết kiệm FCP ~2,1 s; 141–252 KB woff2/trang). Fix tự host + preload hoặc nạp không chặn. S.
- **PERF-06 · P2** · Nông Trại CLS 0,47–0,66 (3/5 lần; farm-world/world-tree/hStoreStat/upgradeTool, `LI|actions`), TBT 267–2549 ms (throttle 11,2 s). S–M.
- **PERF-07 · P2** · Ma Sói tải 3,4 MB ở sảnh (poster 1 MB, village-day 950 KB, village-night 844 KB chưa cần, role-card-back.png 406 KB). S.
- **QCK-02 · P2** · Nút Bắt đầu dưới mép màn hình: Rắn 844×390 (499/551 vs 390), Xếp Gạch 844×390 (618/670), Bắn Bóng 1366×768 (749/801 vs 768). Fix `@media (max-height:500px)` thu luật vào details hoặc ghim CTA sticky. S. Ảnh `*-menu-start-below-fold.png`.
- **QCK-03 · P2** · Màn kết quả daily che link "← Trang chủ" (2048, Sudoku, Đố Vui). Fix nút "Thử thách khác / Về trang chủ" trong panel hoặc nâng z-index header. S.
- **QCK-05 · P2** · Đào Vàng: dọc canvas 360×225, chữ kết quả trên canvas 6–8 px, nút Khoe đè hộp kết quả; ngang trang cao 691/390, điều khiển ngoài màn; desktop 990/768. Khung trang riêng (`index.html:86-120`). Fix chuyển về khuôn HUD + overlay HTML, canvas theo 100dvh khi ngang. M.
- **QCK-01 · P2** · Nhãn nội bộ "Lụm Kèo · bản chơi thử · pixel V5" hiện ở 13 header game (≥844 px); `<title>` Đào Vàng, Cờ Cá Ngựa có "— bản chơi thử". S.
- **QCK-04 · P2** · Vùng chạm nhỏ: pause/mute 36×24 (Rắn, Xếp Gạch); "← Trang chủ" 92×23 (có game 79×20). S.
- **PERF-08 · P3** · Thumbnail 720×540 lossless 109–215 KB; dao-vang-scene 463 KB; yard-bg Ô Ăn Quan 502 KB; trang chủ mobile lúc đầu 52 request 2,5 MB. S.
- **PERF-09 · P3** · Âm thanh không lazy: `makeSfx` fetch toàn bộ .ogg lúc mount kể cả khi tắt tiếng; chỉ có .ogg (cần thử iOS thật). S.
- **QCK-06 · P3** · Đố Vui daily: "← Trang chủ" xuống 2 dòng. S.
- **QCK-07 · P3** · A11y Lighthouse: 2048 role=grid sai, thiếu main, aria-label undoBtn lệch chữ; trang chủ aria-label logo/dcard lệch; Trà Sữa dialog không tên, tương phản 2,37:1 (#ae967f trên #fbeacf, 11 px). S.

## Nên giữ
0 lỗi console/request hỏng/tràn ngang ở 10 game × 3 viewport; không rò bộ nhớ (heap 2048 0,90→0,94 MB; Xếp Gạch 1,66→1,73 MB; chuyển game ổn ~3 MB; Đào Vàng đóng AudioContext); game casual nhẹ (314–607 KB, LCP < 1,2 s không throttle); `/healthz` 200; màn daily kiểu Wordle + native share tốt; thumbnail lazy + fetchpriority; font swap + subset vietnamese; bố cục ngang Xếp Gạch/Đua Xe/Bắn Bóng là mẫu tốt; Best Practices + SEO 100.

## Chưa kiểm
Điểm Performance Lighthouse (MCP không có); INP thật; iOS/Android thật (.ogg, safe-area, 100vh); số đo nhiễu do dùng chung máy, không có CrUX; throttle chưa chạy cho Cờ Tướng/Ô Ăn Quan/Ma Sói/2048/Đua Xe; Nối Thú luồng thắng; Đào Vàng qua màn 1; âm thanh/fullscreen.

## Ghi chú chéo
1. Sửa một lần ở `server.js` (nén + ETag + immutable) + tự host font lợi cho mọi game; cân nhắc CDN (edge ở Chicago).
2. Tập Làm Chủ và Thám Tử nặng nhất (thư mục 14–40 MB, sheet -hd 2–6 MB) ⇒ ghi vào PLAYBOOK quy tắc "tải khi cần, không tải nền" + giới hạn dung lượng sheet cho mobile.
3. CLS do JS đổ nội dung muộn lặp lại ở trang chủ, Nông Trại, 2048 ⇒ mọi vùng JS đổ nội dung cần giữ chỗ.
4. Rule `@media (max-height:500px)` dùng chung cho overlay menu.
5. 10 game casual không có chat/quảng cáo/link ngoài; ô tên bảng xếp hạng là chữ tự do (server đã lọc ở names.mjs).
6. Nhãn "bản chơi thử" ở 15 game sửa hàng loạt một lần.
