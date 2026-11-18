# Đố Vui Nhanh

Trắc nghiệm nhanh một người chơi: 10 câu một ván, 4 đáp án, trả lời càng nhanh càng nhiều điểm.

- **80 câu** tự soạn (`questions.js`), 4 chủ đề × 20 câu: Văn hóa – Lịch sử, Địa lý, Tiếng Anh, Đố mẹo. Chọn một chủ đề hoặc "Tất cả".
- **Chấm điểm** (`logic.js`): đúng 100 + thưởng tốc độ tới 100 (làm tròn 10) + thưởng chuỗi đúng 25/câu (tối đa 100). Sai/hết giờ = 0 và mất chuỗi.
- **Chế độ**: Bình thường 15 giây/câu; Siêu tốc 8 giây/câu, điểm ×1,5. Kỷ lục lưu riêng theo chế độ.
- **50:50** một lần mỗi ván. Câu đã gặp gần đây (50 câu) bị đẩy xuống cuối để ván sau ít lặp lại; trong một ván không bao giờ lặp câu.
- Phím: 1–4 / A–D chọn, F 50:50, Enter/Space câu tiếp, P/Esc tạm dừng, M tắt tiếng. Ẩn tab thì tự tạm dừng.
- Lưu cục bộ: `localStorage["wgp.dovuinhanh.v1"]`.
- Không dùng ảnh mới: UI pixel theo Art Bible V5, âm thanh + icon chép từ Xếp Gạch.

Test: `node --test test/logic.test.mjs` · E2E: (gốc repo) `PORT=8768 node server.js` rồi `node screenshots/e2e.mjs <thư mục ảnh>`.
