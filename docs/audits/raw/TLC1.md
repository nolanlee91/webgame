# REPORT — TLC1 (Nông Trại + Tiệm Trà Sữa)
(Agent không ghi được file — coordinator chép từ báo cáo gửi qua tin nhắn. Ảnh `shots/` 63 tấm; log `log.txt`; script `*.mjs`.)

## Phạm vi đã chạy thật
Server 8902, headless Chrome giả lập touch. NT hồ sơ mới chạm thật 390×844@3: Cách chơi → NV1 gieo → NV2 tưới → NV3 thu hoạch (`?testclock`) → NV4 bán → Bảng đơn; cấp 4: thẻ xây Xưởng, xây, tải lại giữa lúc xây, thẻ "Xây xong!", lên cấp, toast Khoe, bảng chia sẻ; cuối game dựng cấp 20 qua `apply()` (mọi công trình, 43 ô, 5 con vật, 8 trang trí, 999.999.999 xu) soi bản đồ/Xây/Xưởng/Chợ/Chăn nuôi/Làng/Đơn/Kho/Nâng cấp/Sổ. TTS hồ sơ mới: màn chào (tên 70 ký tự, chọn tính cách) → Chuẩn bị ca → pha 7 bước theo "Phiếu ghi" → giao; trọn ngày 1 (5 khách) → Chốt ca → Khoe → Nhật Ký; tải lại giữa ca, Tạm dừng, drama giữa ca, hết hàng giữa ca; cuối game cấp 20, 999.999.999k, 123 triệu theo dõi, 14 thiết bị, ngày 40. Viewport NT 390/360/320×568/844×390/768/1366@1,25/1920; TTS thêm 412×915. Phá UI (tiền khổng lồ, chạm Mua 10–12 lần, 2 tab, tải lại ngay sau thao tác); âm thanh + lún (audit-lib); FPS 1×/4×, CPU profile, heap/DOM sau 60 vòng đổi cảnh. 0 lỗi JS.

## Hạng
- **Nông Trại B** — hướng dẫn Chị Ba có mũi tên đúng chỗ, 8 bước không kẹt; thẻ xây/ăn mừng ghi rõ "Dùng để / Bạn được / Làm gì tiếp"; V5 nét; bản lưu chắc. Nhiều P2.
- **Tiệm Trà Sữa C** — nội dung giàu, Nhật Ký đẹp, tải lại giữ nguyên; nhưng nút nguyên liệu bị thanh hành động che (P1), HUD chỉ icon trên điện thoại, UI bo tròn lệch V5, ~20 fps ở CPU 4×.
- Điểm: Visual 7 · Mobile 6 · Game 7,5 · Điều hướng 7 · Hoạt ảnh 7 (lún 39/40 NT, 10/11 TTS; thiếu ở link "←") · Hiệu năng 6 · A11y 6 · Ads n/a.

## Lỗi (không có P0)
- **TLC1-01 · P1** · TTS: nút nguyên liệu (thao tác chính) bị thanh "Hoàn tác / Đổ bỏ ly / Giao" che, game không cuộn tới. Ngày 1 ở 390: 6/35 bước bị `#undoBtn` đè, "Lấy ly" chỉ lộ ~40 px, nút 70% đường bị che hẳn; cuối game ở 360/390 cả dải bước + nút nằm dưới thanh; desktop 1366 thẻ "Ly nhựa" cắt nửa. Cause `tiem-tra-sua/index.html:216` `.acts{position:sticky;bottom:-12px}` trên `.brew{overflow-y:auto}` (dòng 148), `scroll-padding-bottom:76px` có nhưng `ui/brew.js` không gọi `scrollIntoView`. Fix scrollIntoView nút gợi ý sau mỗi bước + khi ghim phiếu; mobile đưa dải bước + nút lên dưới phiếu, thu ly/phiếu khi pha. Acceptance `elementFromPoint` tại tâm nút gợi ý mọi bước = chính nút (360/390/412/1366@1,25, ngày 1 + cuối game). M. Ảnh tts-390-13-hint-hidden-1.png, tts-390-23-late-crowded.png, tts-360-25-late-shift.png.
- **TLC1-02 · P2** · NT Cách chơi lần đầu mở đã cuộn tới cuối (`scrollTop` 351/1195, tiêu đề y=−314). `nong-trai/game.js:1265` `helpOk.focus()` thiếu `preventScroll`. Lần đầu chỉ nên 3–4 dòng. S.
- **TLC1-03 · P2** · TTS HUD mobile chỉ icon ("148k · 2:19 · 35 · 0 · Cấp 1"), bong bóng gọi món bị chip che, cuối game HUD 2 hàng che đầu nhân viên, "123.456,8k" theo dõi. `index.html:323`, `.hud{flex-wrap:wrap}` (91). S–M.
- **TLC1-04 · P2** · TTS khung UI bo tròn 12–18 px + bóng blur kiểu SaaS, trái `art-bible-v5.md` §2.2; `docs/tiem-tra-sua/ART-DIRECTION.md` mâu thuẫn art bible; hai game cùng dòng hai hệ UI (PLAYBOOK §8 bảo chép khung từ TTS ⇒ lây sang Bánh Mì/Cơm Tấm). Chủ dự án chốt chuẩn. M.
- **TLC1-05 · P2** · NT HUD + nhiệm vụ chiếm ~1/3 màn 390 (bản đồ từ y=272, khay hạt y=920 dưới mép 844 trong khi NV1 bảo "chọn hạt ở khay dưới"); thẻ nhiệm vụ theo vào mọi cảnh phụ; ngang 844×390 ruộng bắt đầu y=317. Fix HUD ~44 px, nhiệm vụ 1 dòng, khay hạt dính đáy, bố cục ngang 2 cột. M.
- **TLC1-06 · P2** · NT nút "Phía Đông → / Xem thêm →" che biển Làng + "!" + xe giao hàng (`game.js:723–732` placePan). S.
- **TLC1-07 · P2** · NT chế độ Xây: nhãn "Hoàn thành" đè nhau và bị ô trang trí che. S.
- **TLC1-08 · P2** · TTS CPU 4×: ngày 1 22,9 fps (khung xấu 133 ms), cuối game 19 fps (khung xấu 969 ms); profile: `apply` + `structuredClone` mỗi khung 211 ms, render HUD 95 ms, `k()` định dạng tiền 94 ms. Fix tick logic 5–10/s, HUD ghi DOM khi đổi, cache `k()`. Acceptance 4× ngày 1 ≥45, cuối ≥35 fps. M.
- **TLC1-09 · P2** · TTS ngang: bảng drama chỉ thấy 1 lựa chọn (dải chân dung ~200/390). S.
- **TLC1-10 · P2** · TTS cảnh mobile hệ số lẻ (1,2555 ở 360@3; 1,2646 ở 412; 0,7397 ở 320) + `zoom:.8/.76` icon/chân dung. `render/scene.js:181`. S–M.
- **P3:** TLC1-11 NT lên cấp chỉ là toast ~6,6 s đè hàng ruộng cuối; thẻ khoe ghi "Đơn đã giao: 0" · TLC1-12 NT lớp phủ (`#ovBuild`, thẻ ăn mừng, Cách chơi) che nút tắt tiếng (TTS làm đúng) · TLC1-13 NT gà ~45 px gần bằng chuồng ~60 px (trái quy tắc cùng thước) · TLC1-14 nền ui-kit thẻ xây có pixel nhiễu sau chữ · TLC1-15 NT long task 65–170 ms mỗi giây ở 4× (placePan đọc layout + ghi style mỗi tick) · TLC1-16 lặt vặt: link "←" nhỏ (NT 92×23, TTS 21×42) và không lún; TTS nút "Nhận tiệm" ở y=989 dưới mép; tên tiệm maxlength 32 cắt ngầm; nút `user-select:auto` (iOS nhấn giữ bôi chữ); NT Chợ chữ "đổi giá sau" trên nền gỗ đỏ khó đọc; NV4 mũi tên trỏ "Bán hết" trong khi NV5 cần 2 cà rốt.

## Nên giữ
Bản lưu chắc (tải lại ngay sau thao tác, giữa lúc xây giữ `readyAt`, giữa ca TTS mở "Ca đang dở dang", 2 tab đồng bộ, ẩn tab NT báo "Trong lúc bạn vắng…"); mua liên tục an toàn; kinh tế dễ hiểu (thẻ xây, khay hạt giá + thời gian, Kho ghi nguồn/dùng cho/đơn cần); hướng dẫn mũi tên đúng chỗ; TTS ngày học + "Phiếu ghi" + "Nhập đủ cho hôm nay"; bảng Khoe navy V5 + Nhật Ký có "Ẩn tên tiệm"; âm thanh theo từng bước, không tạo AudioContext trước thao tác đầu; không tràn ngang; heap 2–3 MB không rò; tiếng Việt tự nhiên.

## Chưa kiểm
iOS/Android thật; phiên 10 phút liền (thay bằng tua); FPS nhiễu do dùng chung máy; không chơi tới cấp 20 bằng tay; hội chợ TTS, thử thách cấp 20, kéo-thả trang trí TTS, Nhà kính NT; Lighthouse.

## Ghi chú chéo
Hai game Tập Làm Chủ hai hệ UI — chủ dự án chốt chuẩn trước khi game sau chép; ghi mẫu "thanh hành động dính đáy che nội dung cuộn" vào PLAYBOOK §7; màn ngang chưa có bố cục riêng; link "←" nhỏ không lún có thể ở thanh trên dùng chung; nút tắt tiếng nên luôn bấm được dù có lớp phủ.
