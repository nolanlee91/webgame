# Ô Ăn Quan: ghi chú dev

## Cần Codex

Âm thanh còn thiếu, phát hiện khi rà tiếng toàn game (tháng 11/2026). Cùng chuẩn với `AUDIO.md`: MP3 vào `prototype/games/o-an-quan/assets/audio/`, hiệu ứng ngắn khoảng −16 LUFS, mono. Giao xong thì ghi vào bảng "Bản giao âm thanh" trong `AUDIO.md`; dev sẽ nối vào code.

| Tên file | Dùng khi | Mô tả |
|---|---|---|
| `invalid.mp3` | Chạm ô không đi được (ô trống của mình, ô bên đối thủ, ô quan) | Tiếng "cộc" gỗ trầm, ngắn khoảng 0,12 s, nhỏ hơn `select.mp3`, nghe là biết "không được" nhưng không gắt |
| `chat.mp3` | Có tin nhắn mới từ người kia trong phòng online | Hai nốt "ting" nhẹ (mõ tre hoặc chuông nhỏ), khoảng 0,25 s. Hiện code đang tạm dùng `select.mp3`, dễ lẫn với tiếng chọn ô |
| `pause.mp3` | Mở hoặc đóng menu tạm dừng | Tiếng lật giấy hoặc gõ nhẹ, khoảng 0,15 s. Các game cờ khác đều có tiếng này, riêng Ô Ăn Quan đang im |
