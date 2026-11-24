# Ô Ăn Quan: âm thanh cho Codex

Làm trên nhánh `claude/oaq-audio`, tạo từ `codex/o-an-quan-assets`.
- File mp3 vào `prototype/games/o-an-quan/assets/audio/`. Ghi danh sách, độ dài và nguồn vào cuối file này.
- Tiếng hiệu ứng ngắn, khoảng −16 LUFS.
- Nhạc là vòng lặp liền mạch 60–120 s: nhạc dân gian nhẹ nhàng (sáo trúc, đàn tranh, mõ), không lời.

| Tên file | Dùng khi |
|---|---|
| `pebble-1.mp3` … `pebble-4.mp3` | Thả một viên sỏi vào ô (tách gỗ / gạch). Rất ngắn vì phát liên tục khi rải, 4 biến thể |
| `pick-up.mp3` | Bốc cả nắm sỏi lên |
| `capture.mp3` | Ăn ô dân: sỏi lạo xạo bay về khay |
| `capture-quan.mp3` | Ăn quan: tiếng đá to + sting vui |
| `chain.mp3` | Ăn liên hoàn (lần thứ 2 trở đi) |
| `borrow.mp3` | Hết dân phải vay hoặc rải lại (hài nhẹ) |
| `select.mp3` | Chọn ô / chọn hướng |
| `turn.mp3` | Tới lượt mình |
| `win.mp3` / `lose.mp3` / `draw.mp3` | Kết ván |
| `amb-yard.mp3` | Nền: sân gạch buổi chiều, chim sẻ, lá xào xạc, xa xa tiếng rao (loop) |
| `music-game.mp3` | Nhạc trong ván (loop, nhỏ) |

## Bản giao âm thanh

Tất cả âm thanh được tổng hợp riêng bằng NumPy và SciPy. Hiệu ứng dùng xung gõ, nhiễu lọc và dao động theo cao độ. Nhạc không lời và tiếng nền dùng tín hiệu tổng hợp theo chu kỳ. MP3 32 kHz, mono 56 kbps cho hiệu ứng và stereo 96 kbps cho vòng lặp. Độ dài bên dưới là thời lượng tín hiệu trước khi mã hóa.

| File | Thời lượng (giây) | Loại |
|---|---:|---|
| `pebble-1.mp3` | 0.095 | Hiệu ứng |
| `pebble-2.mp3` | 0.095 | Hiệu ứng |
| `pebble-3.mp3` | 0.095 | Hiệu ứng |
| `pebble-4.mp3` | 0.095 | Hiệu ứng |
| `pick-up.mp3` | 0.360 | Hiệu ứng |
| `capture.mp3` | 0.570 | Hiệu ứng |
| `capture-quan.mp3` | 0.625 | Hiệu ứng |
| `chain.mp3` | 0.589 | Hiệu ứng |
| `borrow.mp3` | 0.655 | Hiệu ứng |
| `select.mp3` | 0.105 | Hiệu ứng |
| `turn.mp3` | 0.430 | Hiệu ứng |
| `win.mp3` | 0.860 | Hiệu ứng |
| `lose.mp3` | 0.850 | Hiệu ứng |
| `draw.mp3` | 0.715 | Hiệu ứng |
| `amb-yard.mp3` | 72.000 | Vòng lặp |
| `music-game.mp3` | 70.244 | Vòng lặp |
