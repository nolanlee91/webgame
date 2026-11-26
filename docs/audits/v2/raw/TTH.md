# REPORT v2 — TTH (Thám Tử Hẻm + Ô Ăn Quan)

Audit lại trên bản đóng băng `ab70036` (worktree `audit2`), ngày 25–26/11/2026. Cùng thang hạng, cùng nhóm điểm như lần 1.
Ảnh, script và log nằm ở thư mục tạm của phiên (`scratchpad/audit2/TTH/`: `child/`, `screens/`, `t320/`, `oaq/`, `online2/`, `online3/`, `rematch/`, `slow/`, `bot-mob/`, `bot-land/`). Không commit.

## 1. Phạm vi đã chạy thật

Server `PORT=9131 node server.js` (hai lần, phiên bị khởi động lại giữa chừng), Chrome headless qua CDP, chạm thật bằng `Input.dispatchTouchEvent`. Máy dùng chung với 6 auditor khác nên CPU tải 60–70%, khoảng 280 tiến trình Chrome. Mọi số đo thời gian bị ảnh hưởng; số nào chập chờn thì đã chạy lại và ghi rõ.

**Thám Tử Hẻm**
- **Vụ 1 tốc độ thật**, 390×844 dpr 3, chạm như trẻ "đọc kịp" (chờ chữ chạy hết mới chạm). Đặt tên dài có emoji; trên đường chơi cố ý mắc lỗi: chạm chỗ trống trong cảnh, đặt sai từ vào bảng rồi sửa. Chơi tới kết vụ 3★. Script `child-v1.mjs`.
- **Mọi màn ở 740×360** (chạm): đặt tên, bản đồ, thoại văn phòng, bài đăng, hiện trường, thẩm vấn, sổ tay (2 tab), bảng (chỗ trống + chip), Tèo, vạch mặt, chọn vật chứng, câu hỏi phụ, kết vụ. Đo tràn ngang, nút < 44 px, phần tử chính có trong khung không. Màn 844×390 lấy từ ảnh bot VIEW=land.
- **320×568 và 390×844**: thanh trên, tab sổ tay, chỗ trống bảng. Đọc `--b` và `box-shadow` thật của nút chính, nút Đang soi, thẻ người, nút Chốt bảng tắt và thanh danh tiếng.
- **`test/e2e-bot.mjs`, đủ 12 vụ, VIEW=mob và VIEW=land.** Lần chạy đầu hết giờ ở vụ 7 vì máy tải nặng nên chạy tiếp 6 vụ còn lại; vụ `meo-mat-tich` VIEW=land chạy lại riêng.
- **Mạng chậm** (150 ms, 200 KB/s ≈ 1,6 Mbps, tắt cache), có và không có CPU ×4, cả local lẫn lumkeo.com (GET). Thêm phép đo từ lúc mở Vụ 1 tới khi nền và chân dung có ảnh.

**Ô Ăn Quan**
- **Chơi với máy bằng chạm tới hết ván** ở 390, 320, 844×390, 740×360 (4 khung đầu xong; 360, 768 và 1366 không kịp vì hết giờ). Chạm ô đối thủ, đếm tiếng phát ra khi bấm Tạm dừng.
- **Online 1v1** gồm 3 lượt chạy, A và B đều ở 390×844 dpr 3, chạm thật:
  - Tạo phòng, mời bằng link; tên B 15 ký tự có emoji.
  - Chat 7 câu: tục có dấu, không dấu, có dấu chấm, số Zalo, link, câu thường.
  - A tắt chat, rồi B nhắn tiếp.
  - A xoay ngang 844×390 rồi thu về 320×568 giữa ván.
  - B đóng tab đúng lượt B: đo nhãn, toast, nước "máy đi thay"; 45 s sau mở lại link.
  - Hết ván, chỉ A bấm Ván tiếp: đo thời gian tới khi mở ván mới.
  - Chạy thêm `games-server/board-online-e2e.mjs o-an-quan` trỏ vào server của mình: **ĐẠT** (87 s).

## 2. Hạng

| Game | Hạng | Lần 1 | Ghi chú |
|---|---|---|---|
| Thám Tử Hẻm | **B (sát A)** | B (sát A) | Mấy chỗ khó nhất đã được sửa thật: 9 chạm tới hiện trường, soi bật sẵn, 6 chỗ trống, nhãn chữ, xoay ngang đủ màn. Còn lại: nút ← / loa nhỏ, ảnh tựa HD 1,1 MB trên điện thoại, tab sổ tay bị cắt, cả vụ vẫn ~360 chạm. |
| Ô Ăn Quan | **B** | B (sát C vì online) | Online lên hẳn: giữ ghế khi đóng tab, nhãn mất kết nối, Ván tiếp 10 s, lọc tục, tắt chat. Còn lại: 320 px vẫn ô 38 px, mũi tên che ô, màn ngang phải cuộn mới thấy Bắt đầu, chat lọt số điện thoại / Zalo. |

## 3. Điểm 0–10

| Nhóm | Thám Tử (lần 1 → nay) | Ô Ăn Quan (lần 1 → nay) | Căn cứ |
|---|---|---|---|
| Visual / V5 | 9 → **9** | 8 → **8** | Viền `--b` đúng màu: nút chính `rgb(90,58,8)`, Đang soi `rgb(15,58,51)`, nút tắt `#6d6150`. Quan đỏ vẫn trùng màu đá đội đỏ / Máy. Thanh danh tiếng 0% vẫn là dải tối trơn. |
| Mobile UX | 7 → **8** | 7 → **7,5** | TTH: nhãn chữ dưới icon, 320 không tràn. Nhưng ← 24×40, loa 34×38, tab sổ tay bị cắt. OAQ: 320 thấy nút Bắt đầu; ngang thì Bắt đầu nằm ngoài màn; ô 38 px ở 320. |
| Trải nghiệm game | 8 → **8** | 7 → **7,5** | TTH Vụ 1 tốc độ thật: 9 chạm tới hiện trường, nhưng cả vụ 357 chạm (230 chạm qua thoại), 11,4 phút, chip "Vật gì" 12 lựa chọn. |
| Điều hướng / luồng | 8 → **8,5** | 7 → **8** | TTH ngang đủ mọi màn. OAQ: rematch 2 phía, mở lại link về đúng ghế. |
| Chuyển động / tương tác | 8 → **8** | 8 → **7,5** | OAQ: mũi tên vẫn che số sỏi; bấm Tạm dừng phát 1–2 tiếng; không có `prefers-reduced-motion`. |
| Hiệu năng | 6 → **7** | 8 → **8** | TTH chỉ giả lập mạng: FCP 1,3 s (local) / 2,6 s (live), 163 KB, file vụ chỉ nạp khi mở. Có CPU ×4 trên máy đang tải: 5,5–8,5 s (không ổn định). Ảnh tựa HD 1,1 MB xong ở giây 18,9 ⇒ LCP 19 s. |
| Truy cập | 6 → **6,5** | 6 → **6** | TTH đã có reduced-motion, nhưng ← và loa < 44 px. OAQ vẫn không có reduced-motion. |
| Online / an toàn trẻ (OAQ) | — | 6 → **7** | Che tục, `[link]`, tắt chat hoạt động. Lọt: "vao zalo 0912345678", "mày ngu", "thằng ngu", "*** m.á". |
| Quảng cáo | **n/a** (thẻ SpeakUp Kids đang ẩn). Chấm *độ sẵn sàng vị trí*: **5/10** | **n/a**. Độ sẵn sàng vị trí: **5/10** | TTH màn kết vụ ngang đã có hàng nút dính đáy và tường bình luận cuộn riêng, chưa có ô dành sẵn. OAQ thẻ kết ván ở 320 đã tràn (TTH2-11), chèn thêm ô quảng cáo sẽ đẩy nút xuống dưới. |

## 4. Bảng đối chiếu (18 mã lần 1)

| Mã | Trạng thái | Bằng chứng |
|---|---|---|
| TTH-01 khung thoại che thanh trên | **ĐÃ SỬA** | Đang thoại ở 740×360: `#btnMute` trong khung, `elementFromPoint` trúng nút (`tth-740x360-03-office-dialog`). Ở 390, thanh ← / loa nằm trên khung thoại (`slow-local-case-2000.png`). |
| TTH-02 Vụ 1 nặng chữ | **ĐÃ SỬA** (đạt nghiệm thu, còn phần dư → TTH2-04) | Tốc độ thật 390: **9 chạm / 34 s** tới hiện trường; intro 5 dòng + 1 câu Tèo; Đang soi bật sẵn (`is-on`); bảng **6** chỗ trống; nhãn "Sổ tay / Bảng / Tèo" 44×44; không còn chip "soi" / "từ khoá" (`v1-m-05-scene.png`). |
| TTH-03 xoay ngang | **ĐÃ SỬA** | 740×360: 14 màn, tràn ngang 0, phần tử chính đều trong khung (bảng, chip, Chốt, Tèo, vạch mặt, chọn vật chứng). Bot VIEW=land: 12/12 vụ 3★ (`meo-mat-tich` trượt một lần, chạy lại thì đạt — xem TTH2-07). |
| TTH-04 320: loa cắt, tab cắt | **SỬA MỘT PHẦN** | Thanh trên 320 vừa: loa x 282–316, tràn 0. Tab sổ tay vẫn cắt "TỪ KHO…", "Nhân vật" x 359–479 ngoài màn ở cả 320 và 390 (`t320-320x568-notebook.png`). |
| TTH-05 mạng chậm | **SỬA MỘT PHẦN** | Giả lập mạng: sẵn sàng 2,4 s, FCP 1,34 s, 163 KB; chỉ tải `index.js` của vụ. Mở vụ: có ảnh mờ giữ chỗ, hết khung đen. Nhưng `title-art-hd.webp` 1,1 MB vẫn tải trên 390 dpr 3 (`index.html:760`, `sizes="100vw"`) ⇒ LCP 19 s khi bị bóp băng thông. |
| TTH-06 toast chồng 3 tầng | **CHƯA SỬA** | `ui/dom.js:80` vẫn giữ tối đa 3 toast. |
| TTH-07 chữ cắt / tên cắt im lặng | **CHƯA SỬA** | Nhãn "Lịch treo tườn" ở 390 (`v1-m-05-scene.png`); `maxlength="24"` không báo (`ui/screens.js:73`). |
| TTH-08 hạng và câu trích lệch nhau | **CHƯA SỬA** | `ui/screens.js:353` vẫn "Suýt soát thôi, thám tử tập sự!" cho 2★, không theo hạng. |
| TTH-09 thanh danh tiếng 0% | **CHƯA SỬA** | `.rep-bar` vẫn nền `#0f0d0b`, chỉ thêm viền `#3a332a` (`tth-740x360-02-map.png`). |
| OAQ-01 đóng tab mất ghế | **ĐÃ SỬA** | B đóng tab, 45 s sau mở lại link ⇒ `phase play`, `you: 1`; A thấy "Tí đã quay lại." (`o3-B-reopen.png`). |
| OAQ-02 "hàng dưới" sai khi dọc | **ĐÃ SỬA** | 390 / 320: "cột bên phải"; 844×390 / 740×360: "hàng dưới". |
| OAQ-03 320 quá nhỏ | **SỬA MỘT PHẦN** | Bắt đầu ở 320 nằm trong khung (y 504–556 / 568). Bàn vẫn k = 0,5, ô cách nhau **38 px**, hai mũi tên đè 2 ô (`oaq-320-04-arrow.png`). |
| OAQ-04 tên cắt + không báo mất kết nối | **ĐÃ SỬA** (còn dư ở màn ngang) | Dọc: tên 2 dòng, không cắt; nhãn "MẤT KẾT NỐI" trên thẻ đối thủ (`o3-A-offline.png`). Nhãn và toast hiện **7,1 s** sau khi đóng tab; máy đi thay sau **22,6 s**. Ngang: "Tí Siêu …" bị cắt (`on-A-06-land.png`). |
| OAQ-05 mũi tên che số sỏi | **CHƯA SỬA** | `oaq-844x390-04-arrow.png`: mũi tên che số của ô đang chọn và nửa ô bên cạnh. |
| OAQ-06 "Tạm dừng" online không dừng | **CHƯA SỬA** | `index.html:398` vẫn tiêu đề "Tạm dừng", không có dòng "ván vẫn tiếp tục". |
| OAQ-07 rematch kéo người kia khỏi màn kết | **ĐÃ SỬA** | Chỉ A bấm ⇒ B thấy "Đối thủ muốn chơi tiếp · ván mới sau 10 giây", nút "Chơi tiếp ngay ▶"; ván mới mở sau **10 038 ms**. (Một lượt có B vừa mất kết nối rồi vào lại thì mất 27 s, chưa lặp lại được.) |
| OAQ-08 bấm Tạm dừng kêu 3 tiếng | **SỬA MỘT PHẦN** | Đếm `AudioBufferSourceNode.start` + `play`: 390 ra **2**, 320 / 844 / 740 ra 1. `#menuBtn` vẫn không có `data-nosfx`. |
| OAQ-09 thiếu reduced-motion | **CHƯA SỬA** | `grep reduced-motion` trong `index.html`, `game.js`, `board.js` = 0. |

**Tổng (18 mã):** ĐÃ SỬA 7 · SỬA MỘT PHẦN 4 · CHƯA SỬA 7 · HỒI QUY 0.

Ngoài danh sách: chat lọc từ tục (BRD-07 / PTY-02) và nút Tắt chat ở OAQ hoạt động. Tắt chat thì ô nhập khoá, "Chat đang tắt", không toast, không huy hiệu, nhớ khi tải lại. Viền `--b` (D6) đúng ở cả hai game.

## 5. Lỗi mới

| ID | Mức | Ở đâu | Vấn đề | Đề xuất sửa | Nghiệm thu | Công |
|---|---|---|---|---|---|---|
| TTH2-01 | P1 | Ô Ăn Quan (và mọi game dùng `games-server/moderation.js`) | Chat phòng lọt **số điện thoại / lời rủ qua Zalo**: "vao zalo 0912345678 nha" hiện nguyên văn ở máy A. Lọt cả câu chửi không có từ tục: "mày ngu", "thằng ngu". "đ.ụ m.á" chỉ bị che một nửa ("*** m.á"). Trang dành cho trẻ, phòng có thể công khai ⇒ rủi ro dụ trẻ sang kênh riêng. | Che dãy ≥ 7 chữ số (cả khi có dấu cách hay dấu chấm xen giữa), các từ zalo / fb / sđt / ib / inbox / tele. Thêm danh sách xúc phạm nhẹ (ngu, óc chó…). Chuẩn hoá bỏ dấu câu chen giữa chữ trước khi so. | Gửi 10 mẫu (số điện thoại 3 kiểu viết, "zalo", "đ.ụ m.á", "mày ngu"…) ⇒ máy bên kia không thấy số hay từ nào; có test trong `moderation.test`. | S–M |
| TTH2-02 | P2 | Thám Tử, mọi màn có thanh trên, ≤ 400 px | Nút "← Bản đồ" chỉ còn mũi tên **24×40**, nút loa **34×38** (đo ở 320 và 390, `index.html:582`). Trẻ khó bấm Tắt tiếng / Thoát. | `.bar .btn--icon` và `#toMap` tối thiểu 44×44 (hoặc vùng chạm `::after` 44). | `elementFromPoint` trúng nút trong ô 44×44 quanh tâm, ở 320 và 390. | S |
| TTH2-03 | P2 | Thám Tử, màn tựa trên điện thoại | `srcset` + `sizes="100vw"` ⇒ máy dpr 3 tải `title-art-hd.webp` **1,1 MB** (`index.html:760`, `screens.js:32`). Mạng 1,6 Mbps: ảnh xong ở giây 18,9, LCP 19 s; tổng trang từ 163 KB lên 1,3 MB. | Màn dọc ≤ 480 px dùng bản 960 (`sizes` thực tế hoặc `<picture>` theo media). Ảnh HD chỉ cho ngang / desktop. | 390×844 dpr 3: tổng tải ở màn tựa ≤ 450 KB, LCP < 4 s (mạng 1,6 Mbps). | S |
| TTH2-04 | P2 | Thám Tử Vụ 1 (vụ hướng dẫn) | Tới hiện trường đã nhanh, nhưng cả vụ vẫn **357 chạm, 230 chạm qua thoại, 11,4 phút**. Chỗ trống "Vật gì?" có **12 chip** (sổ tay nhặt 38 từ khoá), trẻ 7–10 tuổi dễ đoán mò. | Vụ 1: mỗi chỗ trống chỉ hiện 3–4 chip cùng loại (đúng + nhiễu gần), hoặc bỏ nhặt các từ khoá không dùng; gộp thêm thoại hỏi cung. | Vụ 1 ≤ 200 chạm, ≤ 6 chip mỗi chỗ trống. | M |
| TTH2-05 | P2 | Thám Tử, sổ tay 320 / 390 | Tab "Từ khoá" bị cắt, tab "Nhân vật" nằm hẳn ngoài màn, không có dấu hiệu cuộn (phần còn lại của TTH-04). | Tab 2×2 hoặc chữ ngắn + số; hoặc mép mờ báo cuộn được. | 4 tab thấy trọn ở 320. | S |
| TTH2-06 | P3 | Thám Tử, chỗ trống bảng (dọc) | `.slot` đo được 96×**36** ở 320 / 390, trong khi D5 ghi "chỗ trống 44 px" (đúng ở màn ngang, chưa đúng ở màn dọc). | `min-height: 44px` cho `.slot` ở mọi khung. | Mọi `.slot` ≥ 44 px cao. | S |
| TTH2-07 | P3 | Thám Tử, kết vụ khi xoay ngang | Câu hỏi phụ nằm dưới hàng nút dính đáy (y 414–458, ngoài khung 360), phải cuộn mới thấy. Dòng "+100 danh tiếng (gốc 100)" bị hàng nút đè (`tth-740x360-12-result-bonus.png`). | `scroll-padding-bottom` bằng chiều cao hàng nút; gợi ý "Còn 3 câu hỏi phụ ↓". | Câu hỏi phụ đầu tiên thấy được mà không bị che. | S |
| TTH2-08 | P3 | `test/e2e-bot.mjs` | Cả VIEW=mob và VIEW=land báo **FAIL "0 lỗi console"** vì `net::ERR_CACHE_OPERATION_NOT_SUPPORTED` với file mp3 (Range 206 khi Chrome headless dùng cache). Lối chơi vẫn 12/12. Một lần trượt chập chờn: `meo-mat-tich` VIEW=land "không thấy [data-case]" khi máy tải nặng. | Bỏ qua lỗi này trong bộ lọc test, hoặc server trả `Cache-Control: no-store` cho yêu cầu Range. `press()` chờ lâu hơn khi cột hồ sơ đang cuộn. | Bot 12/12 với 0 FAIL hai lần liền. | S |
| TTH2-09 | P2 | Ô Ăn Quan "Chơi với máy", xoay ngang | Nút **▶ Bắt đầu nằm ngoài màn**: 844×390 ở y 376–428, 740×360 ở y 363–415 (`oaq-844x390-02-solo.png`). | Hàng nút dính đáy như `short-screen.css` `.ss-cta`. | Bắt đầu trong khung ở 844×390, 740×360, 568×320. | S |
| TTH2-10 | P2 | Ô Ăn Quan thẻ kết ván 320×568 (online) | Hàng nút (Ván tiếp, Khoe, Xem bàn, Rời phòng, Hủy phòng) **đè tiêu đề + điểm** "ĐỘI BẠN THẮNG"; "Hủy phòng" bị cắt (`on-A-07-320.png`). Người chơi không thấy mình thắng hay thua. | Thẻ cuộn từ trên xuống (`place-items:start`), hoặc gộp Rời / Hủy vào menu. Tiêu đề + điểm luôn nằm trên cùng. | 320×568: tiêu đề, điểm và Ván tiếp cùng thấy, không giao nhau. | S |
| TTH2-11 | P3 | Ô Ăn Quan online | Đóng tab ⇒ nhãn "mất kết nối" hiện sau **6,4–8,1 s**, máy đi thay sau **22,6 s** (lần 1 toast hiện ở 13,9 s). Giữa lúc đó A thấy "Chờ Tí…" mà không biết vì sao. | Nhịp ping ngắn hơn (2–3 s) hoặc bắt `pagehide` để gửi "leave-soft". | Nhãn hiện ≤ 3 s sau khi đóng tab. | S |
| TTH2-12 | P3 | Ô Ăn Quan xoay ngang (online) | Tên đối thủ bị cắt "Tí Siêu …" trên thẻ cột trái; ở dọc thì đã 2 dòng. | Áp `line-clamp: 2` cho cả bố cục ngang. | Tên 15 ký tự đọc đủ ở 844×390. | S |

## 6. Top 3

**Thắng lớn nhất**
1. **Online Ô Ăn Quan đủ tin cậy:** mở lại link sau 45 s về đúng ghế, nhãn và toast mất kết nối, "máy đi thay", Ván tiếp chờ cả hai hoặc đúng 10,0 s, Khoe kịp. Thêm lọc tục và Tắt chat chạy đúng.
2. **Vụ 1 Thám Tử nhẹ đi rõ:** tới hiện trường 19 → **9** chạm (34 s đọc thật), soi bật sẵn, bảng 11 → 6 chỗ trống, nhãn chữ dưới icon.
3. **Thám Tử xoay ngang đủ 14 màn** ở 740×360 và 844×390, tràn ngang 0. Bot ngang 12/12 vụ 3★. Mạng chậm (chỉ giả lập mạng) từ 7,4 s xuống ~1,3–2,6 s tới lúc chơi được.

**Vấn đề còn lại lớn nhất**
1. **Chat lọt số điện thoại / Zalo và lời chửi không tục** (TTH2-01, P1, an toàn trẻ).
2. **Màn nhỏ / ngang của Ô Ăn Quan:** ô 38 px và mũi tên che ô ở 320 (OAQ-03/05); Bắt đầu ngoài màn khi ngang (TTH2-09); thẻ kết ván 320 bị đè (TTH2-10).
3. **Thám Tử trên điện thoại vẫn có điểm vướng:** ← 24 px và loa 34 px (TTH2-02), ảnh tựa HD 1,1 MB (TTH2-03), Vụ 1 tổng ~360 chạm và chip 12 lựa chọn (TTH2-04). Cùng với đó 4 mã P3 cũ (TTH-06..09) chưa động tới.

## Chưa kiểm được
Máy thật, âm thanh nghe thật. 2v2. Ô Ăn Quan solo ở 360 / 768 / 1366 (hết giờ). Hiệu năng có CPU ×4 không tin được vì máy dùng chung đang quá tải (lần đo ra FCP 210 s, bỏ). Lighthouse.
