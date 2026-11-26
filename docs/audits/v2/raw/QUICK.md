# REPORT v2 — QUICK (10 game casual + hiệu năng toàn cổng)

Audit lại trên snapshot `ab70036` (worktree `audit2`, chỉ đọc), 25–26/11/2026. Cùng phương pháp và thang điểm với lần 1 (64/100). Ảnh, script, log nằm trong thư mục tạm `scratchpad/audit2/QUICK/` (`shots/play`, `shots/play2`, `shots/daily`, `shots/probe`, `lh/`, `logs/*.jsonl`), không commit.

## 1. Phạm vi đã chạy thật

- **Server:** `PORT=9161 node server.js` từ worktree, Chrome headless qua `_shared/test/cdp.mjs`, mỗi lần chạy một hồ sơ trắng, `wgp.muted=1`. Máy dùng chung với 6 auditor (CPU 87 %, khoảng 90 tiến trình Chrome), nên số đo thời gian lấy nhiều lần và dùng trung vị hoặc lần sạch nhất. Phiên bị ngắt một lần (server và Chrome chết), sau đó chạy tiếp từ log đã có.
- **Chơi hết vòng ở 10 game × 4 khung:** 390×844 dpr 3 cảm ứng, 1366×768 chuột + phím, 844×390 và 740×360 cảm ứng. Script `play.mjs` chơi tới màn kết quả bằng chạm, vuốt, kéo, phím và giữ ga thật qua CDP, rồi bấm "Chơi lại" bằng input thật, sau đó bấm "← Trang chủ" và kiểm đã về `/homepage/`. Ở mỗi màn menu và kết quả, script đo: tràn ngang/dọc, nút nằm ngoài khung, vùng chạm thật (dò `elementFromPoint`), nút bị che, viền `--b` (box-shadow có đúng màu `--b` của chính phần tử không) và nhãn nội bộ.
  - Ghép Kẹo và Nối Thú: script chọn nước đi bằng `logic.js` (`findMove`, `findAnyPair`), nhưng vẫn bấm và vuốt thật.
  - Đào Vàng: thả móc thật 8 lần rồi tua đồng hồ còn 1,5 s. Chưa chơi đủ 60 s.
  - Đua Xe 844×390: giữ ga 60 s mà xe chưa lật hay hết xăng, nên gọi `finish()`.
  - Bắn Bóng và Đố Vui ở 390: lần đầu trang tải quá 15 s vì máy quá tải. Chạy lại thì đạt.
- **Thử thách hôm nay** (`daily.mjs`): 2048 (vuốt tới hết nước đi), Sudoku (giải bằng chạm), Đố Vui (5 câu), ở 390×844, 844×390 và 1366. Đã kiểm bảng kết quả, nút trong bảng, link Trang chủ có bị che không, Khoe (chặn `navigator.share`, đọc nội dung chia sẻ) và Về trang chủ.
- **Đo phụ** (`probe.mjs`): cột trái 2048/Sudoku khi xoay ngang, Đố Vui khi xoay ngang trong lúc trả lời câu hỏi, bàn đạp Đua Xe khi xoay ngang, menu Đào Vàng.
- **Hiệu năng** (`perf.mjs`): FCP/LCP/CLS/TBT/request/KB, tắt cache, đo 10 trang ở mobile 390 dpr 3 và desktop 1366, 3 lượt (lượt 1 bị nhiễu nặng nên chỉ dùng lượt 2–3). Slow 4G (150 ms, 1,6 Mbps) + CPU 4× ×3 lần cho trang chủ, Trà Sữa, Thám Tử, Nông Trại. Trà Sữa đứng yên 60 s. Thác nước request của trang chủ (`waterfall.mjs`).
- **Lighthouse** (chrome-devtools MCP, mobile): trang chủ, 2048, Trà Sữa (a11y, best practices, SEO). Về sau MCP mất kết nối nên không chạy thêm được. Điểm Performance của Lighthouse không có (MCP loại phần này).
- **Bộ nhớ** (`mem.mjs`): 2048 ×5 ván, Xếp Gạch ×5, chuyển Ghép Kẹo → Bắn Bóng → Nối Thú ×3 vòng, Đào Vàng vào/ra ×5. Heap đo sau GC.
- **Header:** curl trên server local (nén, ETag/304, Cache-Control). Trên lumkeo.com chỉ gửi HEAD.

## 2. Hạng

| Game | v1 | v2 | Ghi chú ngắn |
|---|---|---|---|
| 2048 | A | **B+** | Dọc và desktop vẫn rất tốt; daily ổn. Lần này có đo xoay ngang: ở 844×390, "Bắt đầu" (y 495–547) và nút màn kết quả nằm ngoài khung. CLS menu 0,09–0,12. |
| Sudoku | A | **B+** | Dọc và desktop tốt, daily "Hoàn hảo" + Khoe chạy. 844×390: "Bắt đầu" ở y 521–573, "Đề mới" ở y 431–483, đều ngoài khung. |
| Đố Vui Nhanh | A- | **B** | Dọc tốt. Xoay ngang: "Bắt đầu" ngoài khung; lời giải thích và "Câu tiếp" nằm dưới mép; ở 740×360 đáp án C/D bị cắt. Daily: "← Trang chủ" vẫn xuống 2 dòng. |
| Ghép Kẹo | A- | **B** | Dọc và desktop tốt. 844×390: "Chơi màn 1" ở y 606–658. 740×360: kết quả có 4 nút, trải tới y 595. |
| Đua Xe | A- | **A-** | Ổn. Xoay ngang thì "Lên đường" thò quá mép 3 px; ở 740 hàng nút kết quả ở y 315–373. |
| Xếp Gạch | B+ | **A-** | QCK-02 đã sửa: "Bắt đầu" luôn thấy khi xoay ngang, vùng chạm ≥ 44. |
| Nối Thú | B+ | **B** | Luồng thắng màn 1 đã kiểm (v1 chưa kiểm). Xoay ngang: "Bắt đầu chơi" (y 468–520 / 437–489) và "Màn 2 →" ngoài khung. |
| Rắn Săn Mồi | B | **A-** | QCK-02 và QCK-04 đã sửa. |
| Bắn Bóng | B | **A-** | QCK-02 đã sửa (1366: "Bắt đầu" ở y 688–740). Chơi tới thua/thắng ở cả 4 khung đều trơn. |
| Đào Vàng | C+ | **C+** | Khoe hết đè hộp kết quả. Vẫn còn: chữ kết quả vẽ trên canvas khoảng 6–8 px CSS ở 390; desktop trang cao hơn khung 226 px, xoay ngang hơn 305 px; Tạm dừng/Âm thanh/Về menu ngoài khung khi xoay ngang. |

## 3. Điểm 0–10

| Hạng mục | v1 | v2 | Lý do |
|---|---|---|---|
| Visual / V5 | 8 | **8** | Đã bỏ nhãn nội bộ. Viền `--b` đúng ở mọi phần tử đo được (2048 23/23, Sudoku 18/18…, 0 lệch). Riêng nút công cụ của Nối Thú là kiểu viền mảnh, cố ý khác. Đào Vàng vẫn tự làm khung riêng, chữ canvas quá nhỏ. |
| Mobile UX | 7 | **7** | Dọc 390 rất tốt (0 tràn, 0 nút ngoài khung ở 10 game). Ba game cũ đã sửa xoay ngang, nhưng 5 game khác (2048, Sudoku, Đố Vui, Ghép Kẹo, Nối Thú) chưa áp `.ss-cta`. Chưa có `env(safe-area-inset-*)` dù đã khai `viewport-fit=cover`. |
| Trải nghiệm chơi | 8 | **8** | 10/10 game chơi tới kết quả → Chơi lại → về Trang chủ ở cả 4 khung, 0 lỗi console. |
| Điều hướng / flow | 7 | **8** | Bảng daily có "Về trang chủ", "Chơi thường", "Xem bàn" và link sang 2 thử thách còn lại; link Trang chủ trên thanh đầu không còn bị che (QCK-03). Trừ điểm vì nút kết quả ngoài khung khi xoay ngang ở 5 game. |
| Hoạt ảnh / tương tác | 7 | **7** | Lần này không soi lại kỹ; không thấy hồi quy. Nút lún và viền khi bấm đúng `--b`. |
| Hiệu năng (toàn cổng) | 5 | **8** | Server đã nén br + ETag/304 + immutable, cả local lẫn live. Font tự host, hết Google Fonts. Trang chủ CLS 0 khi throttle, Thám Tử FCP ~0,9 s. Trà Sữa đứng yên 60 s còn 2,4 MB. Còn lại: Trà Sữa LCP ~10 s khi throttle, Nông Trại TBT, live không có CDN (TTFB 1,0–1,7 s). |
| Accessibility | 7 | **7** | Lighthouse mobile: trang chủ 95, 2048 93, Trà Sữa 93. Các lỗi QCK-07 của 2048 và Trà Sữa còn nguyên. |
| Quảng cáo | — | **n/a** | Thẻ SpeakUp Kids ẩn tới khi có link; 10 game casual không có ô quảng cáo hay link ngoài. Không chấm điểm sẵn sàng vì chỗ đặt thẻ nằm ở trang chủ, thuộc phạm vi HOME. |

## 4. Bảng đối chiếu (16 mục v1)

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| PERF-01 | **ĐÃ SỬA** | Trà Sữa đứng yên 60 s: 390 dpr 3 **2 378 KB / 74 req**, 1366 2 617 KB (v1: 12,2 MB / 95). Không còn tải nền `drama-portraits-hd`/`journal-card`. `logs/perf-idle.jsonl` |
| PERF-02 | **SỬA MỘT PHẦN** | Slow 4G + 4×, 390: CLS **0 / 0 / 0** (v1 0,94); FCP 2,3–3,5 s; LCP 2,4 / 4,7 / 4,8 s, trung vị **4,68 s**, chưa đạt < 4 s. Không throttle: FCP 0,4–0,7 s. Lighthouse không còn báo CLS. LCP vẫn là `half/co-ca-ngua.webp`. |
| PERF-03 | **ĐÃ SỬA** | Thám Tử, Slow 4G + 4×: FCP 0,88–1,12 s, LCP 2,76–2,96 s, 424 KB / 27 req, CLS 0 (v1 FCP 18,5 s). |
| PERF-04 | **ĐÃ SỬA** (phần server); CDN chưa làm, chủ dự án hoãn | Local: `Content-Encoding: br`, ETag `"…-br"`, If-None-Match → **304**; `?v=` → `public, max-age=31536000, immutable`; HTML `no-cache`. Live lumkeo.com (HEAD): br + immutable + 304 đúng. Vẫn HTTP/1.1, `x-railway-edge: ord1`, TTFB 1,0–1,7 s. |
| PERF-05 | **ĐÃ SỬA** | `git grep fonts.googleapis` trong `prototype/*.html,*.js`: 0 kết quả. Trang chủ preload 2 woff2. |
| PERF-06 | **SỬA MỘT PHẦN** | Nông Trại throttle ×3: CLS **0 / 0 / 0** (v1 0,47–0,66). TBT vẫn 0,8–2,9 s, task dài nhất 0,3–0,9 s, LCP 4,9–6,7 s, 1 428 KB / 100 req. |
| PERF-07 | **SỬA MỘT PHẦN** | Ma Sói sảnh 1 555 KB / 17 req (v1 3,4 MB), đã bỏ ảnh làng ngày/đêm. Vẫn còn `poster-ma-soi.webp` 1 001 KB và `role-card-back.png` 406 KB (PNG) tải ngay. |
| PERF-08 | **SỬA MỘT PHẦN** | Thumb `half/` 30–86 KB. Trang chủ dpr 1: 905 KB / 45 req (v1 2,5 MB / 52); dpr 3: 1 540 KB / 42. `yard-bg.webp` Ô Ăn Quan vẫn 502 KB. |
| PERF-09 | **CHƯA SỬA** | `2048/game.js:25-35` `makeSfx` vẫn fetch + decode mọi `.ogg` lúc mount kể cả khi tắt tiếng; chỉ có định dạng `.ogg`. |
| QCK-01 | **ĐÃ SỬA** | 0 kết quả "bản chơi thử / pixel V5" trong chữ hiện và `<title>` ở 10 game × 4 khung (cờ `internal=false`). `git grep` chỉ còn trong comment. |
| QCK-02 | **ĐÃ SỬA** | "Bắt đầu" ở 844×390 / 740×360: Rắn 330–382 / 300–352, Xếp Gạch 330–382 / 300–352, Bắn Bóng 330–382 / 300–352; Bắn Bóng 1366×768 688–740. (Lỗi cùng loại ở 5 game khác: xem QUICK2-01.) |
| QCK-03 | **ĐÃ SỬA** | Bảng daily có nút "Về trang chủ" 46 px; link "← Trang chủ" trên thanh không bị che (`homeFree=true`) ở cả 3 game × 3 khung. Ảnh `daily-sudoku-p390-1result.png`. |
| QCK-04 | **SỬA MỘT PHẦN** | Cột trái 2048/Sudoku xoay ngang đạt **44 px** (vùng chạm 45, `probe.out`). Link Trang chủ ở 2048/Sudoku 44. Còn thiếu: link Trang chủ ở 7 game kia chạm được **41 px** (dọc) và **37 px** (ngang); 2048 dọc `#muteBtn2` chỉ rộng **36 px**; Ghép Kẹo 740×360 nút chọn màn `🔒` 26–42 px. |
| QCK-05 | **SỬA MỘT PHẦN** | Khoe đã nằm dưới hộp kết quả, không đè (ảnh `dao-vang-p390-2result.png`). Vẫn còn: chữ "Thiếu 570 điểm…" vẽ trên canvas khoảng 7 px CSS ở 390; 1366 trang cao 994/768; 844×390 menu cao +114, kết quả +305; Tạm dừng/Âm thanh/Về menu ở y 402–446 (ngoài 390). |
| QCK-06 | **CHƯA SỬA** | Đố Vui `?daily=1` ở 390: "← Trang chủ" vẫn xuống 2 dòng (ảnh `daily-do-vui-nhanh-p390-0start.png`). |
| QCK-07 | **CHƯA SỬA** | Lighthouse 2048: vẫn `aria-required-children` (#board role=grid), `landmark-one-main`, `label-content-name-mismatch` #undoBtn. Trà Sữa: `aria-dialog-name` (.sheet intro), tương phản 2,37:1 (#ae967f/#fbeacf, 10 px) ×7. Trang chủ: logo vẫn lệch aria-label. |

**Tổng: 7 ĐÃ SỬA · 6 SỬA MỘT PHẦN · 3 CHƯA SỬA · 0 HỒI QUY.**

## 5. Lỗi mới

Không có P0 hay P1.

- **QUICK2-01 · P2 · M.** 2048, Sudoku, Đố Vui, Ghép Kẹo, Nối Thú khi xoay ngang.
  - Vấn đề: lỗi giống QCK-02 nhưng ở 5 game chưa được sửa. "Bắt đầu" nằm dưới mép:
    - 2048 844×390: y 495–547
    - Sudoku 844×390: y 521–573
    - Đố Vui 844 và 740: y 428–480
    - Ghép Kẹo 844: y 606–658; 740: y 332–384
    - Nối Thú 844: y 468–520; 740: y 437–489
  - Nút màn kết quả cũng ngoài khung: 2048 "Chơi lại" 349–401; Sudoku "Đề mới" 431–483; Ghép Kẹo 740 bốn nút tới y 595; Nối Thú "Màn 2 →" 353–405. Trẻ chỉ thấy phần luật hoặc bảng điểm, phải tự biết cuộn lớp phủ.
  - Ảnh: `2048-l844-1menu.png`, `ghep-keo-l844-1menu.png`, `noi-thu-l740-2result.png`.
  - Sửa: thêm `_shared/short-screen.css` + class `ss-cta` (hàng nút menu/kết quả) và `ss-ov` cho 5 game này, giống Rắn/Xếp Gạch/Bắn Bóng.
  - Nghiệm thu: ở 844×390, 740×360 và 568×320, nút chính của menu và màn kết quả có `bottom ≤ innerHeight` và không bị che tại tâm.
- **QUICK2-02 · P2 · S–M.** Đố Vui khi xoay ngang, trong lúc trả lời.
  - Vấn đề: ở 844×390, phản hồi "Đúng rồi / Sai rồi! Đáp án: B… (giải thích)" và "Câu tiếp" nằm ở y 407–451, ngoài khung. Game tự sang câu sau `REVEAL_MS`, nên trẻ không kịp thấy lời giải thích. Ở 740×360, đáp án C/D ở y 329–387, bị cắt 27 px trong khi đồng hồ đang chạy.
  - Ảnh: `probe-dovui-844-fb.png`.
  - Sửa: luật `(orientation: landscape) and (max-height:500px)`: HUD 1 hàng thấp, câu hỏi và đáp án 2×2 gọn hơn, phản hồi phủ lên vùng đáp án thay vì đẩy xuống dưới.
  - Nghiệm thu: ở 740×360, 4 đáp án và phản hồi nằm trọn trong khung, không phải cuộn.
- **QUICK2-03 · P2 · S.** 9/10 game casual (trừ Đào Vàng).
  - Vấn đề: `<meta viewport … viewport-fit=cover>` nhưng trang game không dùng `env(safe-area-inset-*)`; chỉ lớp phủ `.ss-ov` ở 3 game có. Khi xoay ngang trên iPhone có tai thỏ, nội dung sát mép sẽ nằm dưới tai thỏ hoặc góc bo, ví dụ bàn đạp phanh Đua Xe ở x 12–20, cột trái 2048/Sudoku/Ghép Kẹo, HUD.
  - Sửa: `padding-inline: max(…, env(safe-area-inset-left/right))` cho `.bar` và `.wrap`/`.stage`; `padding-bottom: env(safe-area-inset-bottom)` cho pad/bàn đạp. Hoặc bỏ `viewport-fit=cover`.
  - Nghiệm thu: trên iPhone thật xoay ngang, không nút nào nằm dưới tai thỏ hay thanh home. **Cần máy thật.**
- **QUICK2-04 · P2 · S.** Trà Sữa tải lần đầu.
  - Vấn đề: Slow 4G + 4× ở 390: LCP **10,3 / 10,9 s** (một lần nhiễu 24,5 s), phần tử LCP là `street-background.webp` 504 KB, kèm `shop-scene.webp` 475 KB; tải lần đầu 1 832 KB. FCP thì tốt (0,7–0,8 s).
  - Sửa: giảm cỡ ảnh phố cho màn nhỏ (srcset ½), `fetchpriority=high` cho cảnh tiệm, hoãn ảnh phố tới khi cần.
  - Nghiệm thu: LCP < 4 s khi throttle như trên.
- **QUICK2-05 · P3 · S.** 2048 menu.
  - Vấn đề: CLS **0,087–0,106** (`#frame DIV.card`, `DIV.how #dailyLink`); Lighthouse mobile 0,119. Đua Xe desktop 0,025–0,031 (`DIV.card`), privacy desktop tới 0,058 (`TABLE UL P`).
  - Sửa: giữ chỗ cho thẻ menu và link Thử thách trước khi JS dựng.
  - Nghiệm thu: CLS < 0,05.
- **QUICK2-06 · P3 · S.** Link "← Trang chủ" ở 7 game (Ghép Kẹo, Đua Xe, Xếp Gạch, Nối Thú, Rắn, Bắn Bóng, Đào Vàng) và nút loa 2048 dọc.
  - Vấn đề: vùng chạm thật 41 px (dọc) và 37 px (ngang), trong khi 2048/Sudoku đạt 44. `#muteBtn2` 2048 ở 390 rộng 36 px.
  - Sửa: dùng chung `::after` 44 px tính từ mép trên màn như D5 đã làm cho 2048/Sudoku; loa `min-width: 44px`.
  - Nghiệm thu: dò `elementFromPoint` theo cột qua tâm cho ra ≥ 44 px.
- **QUICK2-07 · P3 · S.** Đố Vui HUD.
  - Vấn đề: ô "KỶ LỤC —" lệch dòng so với 3 ô bên cạnh, cả dọc lẫn ngang (ảnh `daily-do-vui-nhanh-p390-0start.png`).
  - Sửa: căn baseline nhãn/số giống các ô khác.
  - Nghiệm thu: 4 nhãn cùng một hàng.
- **QUICK2-08 · P3 · S.** Màn kết quả 2048.
  - Vấn đề: thanh công cụ dưới (Hoàn tác / Ván mới / Menu) vẫn hiện và bấm được dưới lớp phủ kết quả, trùng với các nút trong bảng. Nối Thú và 2048 xoay ngang có viền focus nét đứt trên nút chính ngay sau khi chạm (focus do JS, không phải bàn phím).
  - Sửa: ẩn hoặc `inert` thanh dưới khi có lớp phủ; chỉ gọi `focus()` khi người dùng đang dùng bàn phím.
- **QUICK2-09 · P3 · M.** Hạ tầng live.
  - Vấn đề: ETag của file không có `?v=` đều dùng chung mtime lúc deploy, nên mỗi lần deploy mọi file đều bị coi là đã đổi. Vẫn HTTP/1.1, không CDN, TTFB từ Việt Nam 1,0–1,7 s.
  - Sửa: Cloudflare (đã duyệt, đang hoãn; `client-ip.js` đã sẵn); ETag theo hash nội dung.
  - Nghiệm thu: TTFB < 300 ms ở VN, HTTP/2 hoặc 3.
- **Ghi chép chéo (thuộc HOME):** Lighthouse trang chủ báo `target-size` cho nhãn "★ Thử thách" 86×17 px ×3 (vùng chạm mở rộng bằng `::after` mà axe không thấy; cần kiểm trên máy thật) và `heading-order` (h3 trong hero).

## 6. Top 3

**Thắng lớn**
1. **Hiệu năng nền tảng:** nén br + ETag/304 + immutable chạy đúng cả trên live; font tự host; trang chủ CLS từ 0,94 xuống **0**; Thám Tử FCP từ 18,5 s xuống **~0,9 s**; Trà Sữa đứng yên từ 12,2 MB xuống **2,4 MB**. Hạng mục hiệu năng từ 5 lên 8.
2. **Thử thách hôm nay hoàn chỉnh:** bảng kết quả kiểu Wordle có Khoe (nội dung share đúng), Về trang chủ, Chơi thường, Xem bàn, link sang 2 thử thách còn lại, bảng xếp hạng. Server chặn được kết quả Sudoku giải nhanh hơn 45 s, và UI báo nhẹ nhàng thay vì lỗi.
3. **Dọn sạch:** không còn nhãn "bản chơi thử". Viền `--b` đúng màu ở mọi nút. Ba game Rắn/Xếp Gạch/Bắn Bóng thành mẫu tốt cho xoay ngang. 0 lỗi console và 0 tràn ngang ở 40 lượt chơi; bộ nhớ ổn định (2048: 0,73 → 0,98 MB sau 5 ván; Xếp Gạch ~1,6–1,7 MB; Đào Vàng vào/ra ×5 không tăng; chuyển 9 trang dừng ở ~3,8 MB khi bfcache đầy 7 trang).

**Còn lại lớn nhất**
1. **QUICK2-01 + QUICK2-02:** xoay ngang ở 5 game (2048, Sudoku, Đố Vui, Ghép Kẹo, Nối Thú) vẫn giấu nút "Bắt đầu" và nút màn kết quả. Đố Vui xoay ngang giấu luôn lời giải thích. Đã có sẵn cách sửa (`short-screen.css`), chỉ chưa áp cho các game này.
2. **Đào Vàng (QCK-05):** vẫn là game kém nhất. Khung trang riêng, chữ canvas khoảng 7 px, desktop/xoay ngang tràn dọc 226–305 px, nút điều khiển ngoài khung.
3. **Tải nặng còn sót:** Trà Sữa LCP ~10 s khi throttle; Nông Trại TBT tới 2,9 s; Ma Sói poster 1 MB + PNG 406 KB; âm thanh `.ogg` tải hết lúc mount (PERF-09); live chưa có CDN. A11y của QCK-07 chưa đụng tới.

## Chưa kiểm

- iOS/Android thật: `.ogg` trên Safari, safe-area, 100svh.
- INP thật; điểm Performance của Lighthouse (MCP loại phần này, rồi mất kết nối).
- Throttle chưa chạy cho Cờ Tướng, Ô Ăn Quan, Ma Sói, 2048, Đua Xe.
- Các khung 320/360/412/768/1920: lần này không chạy vòng chơi đầy đủ, chỉ chạy 4 khung được giao.
- Đào Vàng qua màn 1 (đồng hồ bị tua).
- Hoạt ảnh: không soi lại theo checklist review-animations.
