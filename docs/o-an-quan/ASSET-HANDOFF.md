# Bàn giao asset Ô Ăn Quan

Asset commit `3175561` trên `codex/o-an-quan-assets`, từ `claude/o-an-quan`.

- Nền sân gạch 1280×720 và bàn trống 1200×480, gồm 10 ô dân và hai ô quan bán nguyệt. Thumbnail hiện có được giữ nguyên.
- Atlas sỏi có 8 ô 32×32. Atlas quân quan có 2 ô 96×96, trái ngọc lam và phải đỏ son. WebP lossless, lưới 2×, alpha cứng.
- Ghép thử với sỏi và kiểm trực tiếp 12 vùng đặt. Manifest ghi tâm và bán kính theo tọa độ của ảnh bàn. Ô dân có bán kính 57 px, ô quan 72 px.

```text
python -I tools/asset-check/check_assets.py docs/o-an-quan/asset-spec.json --preview <tmp>

CẢNH BÁO [assets/hand.webp] thiếu file (tuỳ chọn)
0 lỗi, 1 cảnh báo — ĐẠT, giao được.
```

Sprite tay là tùy chọn và chưa được vẽ. Hợp đồng này chỉ có bàn và sỏi nên checker không tạo ảnh xếp hàng nhân vật.

## Tay rải sỏi

Hai khung `hand-hold` và `hand-drop`, lưới 2×, alpha cứng, WebP lossless. Đã mở ảnh ở 2× và kiểm tra tư thế nhả sỏi.

```text
0 lỗi, 1 cảnh báo — ĐẠT, giao được.
```

Cảnh báo `hand-drop`: đã soi, mẩu rời là viên sỏi đang rơi đúng theo tư thế.
Commit âm thanh: `73507fa`.

## Âm thanh bổ sung tháng 11

Commit âm thanh: `76b2f69`. Tự tổng hợp bằng NumPy và SciPy. Đã giải mã cả bộ MP3 bằng FFmpeg, kiểm tên file, định dạng mono 32 kHz 56 kbps và điểm bắt đầu tín hiệu dưới 1 ms. Độ dài là thời lượng phát sau khi bỏ phần đệm mã hóa. Với tiếng dưới 0,4 giây, phép đo LUFS đệm im lặng ở cuối khi đo, không thêm vào file.

| File | Thời lượng (giây) | LUFS |
|---|---:|---:|
| `invalid.mp3` | 0.120 | -27.8 |
| `chat.mp3` | 0.250 | -16.4 |
| `pause.mp3` | 0.150 | -16.3 |

`invalid.mp3` nhỏ hơn `select.mp3` theo yêu cầu (−27,8 so với −25,7 LUFS với cùng cửa sổ đo).
