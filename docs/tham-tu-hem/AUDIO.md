# Âm thanh Thám Tử Hẻm

## Bản giao âm thanh

Tất cả âm thanh được tổng hợp riêng bằng NumPy và SciPy. Hiệu ứng dùng xung gõ, nhiễu lọc và dao động theo cao độ. Nhạc không lời và tiếng nền dùng tín hiệu tổng hợp theo chu kỳ. MP3 32 kHz, mono 56 kbps cho hiệu ứng và stereo 96 kbps cho vòng lặp. Độ dài bên dưới là thời lượng tín hiệu trước khi mã hóa.

| File | Thời lượng (giây) | Loại |
|---|---:|---|
| `type-blip.mp3` | 0.047 | Hiệu ứng |
| `type-blip-2.mp3` | 0.047 | Hiệu ứng |
| `type-blip-3.mp3` | 0.047 | Hiệu ứng |
| `click.mp3` | 0.086 | Hiệu ứng |
| `page-flip.mp3` | 0.380 | Hiệu ứng |
| `keyword.mp3` | 0.160 | Hiệu ứng |
| `inspect.mp3` | 0.290 | Hiệu ứng |
| `lose-cred.mp3` | 0.390 | Hiệu ứng |
| `wrong.mp3` | 0.240 | Hiệu ứng |
| `clue-found.mp3` | 0.502 | Hiệu ứng |
| `objection.mp3` | 0.520 | Hiệu ứng |
| `deduce-ok.mp3` | 0.640 | Hiệu ứng |
| `deduce-bad.mp3` | 0.580 | Hiệu ứng |
| `confront.mp3` | 0.790 | Hiệu ứng |
| `confess.mp3` | 0.790 | Hiệu ứng |
| `case-solved.mp3` | 0.728 | Hiệu ứng |
| `rank-up.mp3` | 0.770 | Hiệu ứng |
| `zalo-ping.mp3` | 0.413 | Hiệu ứng |
| `like-pop.mp3` | 0.125 | Hiệu ứng |
| `door-bell.mp3` | 0.510 | Hiệu ứng |
| `teo-hint.mp3` | 0.534 | Hiệu ứng |
| `map-select.mp3` | 0.480 | Hiệu ứng |
| `amb-office.mp3` | 72.000 | Vòng lặp |
| `amb-rain-alley.mp3` | 72.000 | Vòng lặp |
| `music-map.mp3` | 70.244 | Vòng lặp |
| `music-investigate.mp3` | 66.977 | Vòng lặp |
| `music-interrogate.mp3` | 61.277 | Vòng lặp |
| `music-finale.mp3` | 60.000 | Vòng lặp |
| `music-solved.mp3` | 65.455 | Vòng lặp |

## Mùa 2 · Chợ Hẻm

| File | Thời lượng | Âm lượng tích hợp | Nội dung |
|---|---:|---:|---|
| `music-map-2.mp3` | 74,483 s | −19,4 LUFS | Jazz noir không lời, swing 116 BPM với tiếng đàn nguyệt, kèn, mõ và phách tổng hợp. |
| `amb-market.mp3` | 72,000 s | −22,4 LUFS | Chợ đêm với giọng rao, tiếng người, xe máy, chén bát và loa xa. Tiếng giọng tổng hợp không có lời rõ. |

Hai vòng lặp tổng hợp riêng bằng NumPy và SciPy, MP3 stereo 32 kHz 96 kbps. Tín hiệu nền chạy theo chu kỳ, các sự kiện vượt điểm cuối được ráp về đầu vòng. Thời lượng và LUFS đo trên MP3 đã xuất bằng FFmpeg.
