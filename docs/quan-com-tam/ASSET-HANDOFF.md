# Bàn giao asset · Quán Cơm Tấm

## Âm thanh Quán Cơm Tấm

Asset commit `d59b277` trên `codex/com-tam-audio`. 32 MP3 tổng hợp nguyên bản từ dao động, nhiễu lọc và cộng hưởng, đặt trong `prototype/games/quan-com-tam/assets/audio/`. Các giọng gọi và phản ứng là âm không lời. Tất cả dùng 32 kHz như Tiệm Bánh Mì.

| Nhóm | File MP3 (bỏ đuôi) |
| --- | --- |
| Bếp than | `pork-sizzle` sườn xèo, `pork-flip` lật sườn, `charcoal-crackle` than lép bép, `fan-flap` quạt, `charcoal-add` thêm than |
| Bày dĩa | `rice-ready` nồi cơm cạch, `rice-scoop` xới cơm, `scallion-ladle` múc mỡ hành, `fish-sauce-pour` chan nước mắm |
| Bàn | `plate-set` đặt dĩa sứ, `iced-tea-pour` rót trà và đá, `table-wipe` lau bàn, `plates-stack` chồng dĩa, `plates-wash` rửa dĩa |
| Tính tiền | `bill-key` bấm tính tiền, `cash-paper` tiền giấy |
| Khách | `arrival` khách tới, `voice-call` gọi phục vụ, `voice-happy` vui, `voice-annoyed` bực, `voice-surprised` ngạc nhiên |
| Sự kiện | `drama`, `viral`, `level-up`, `mission`, `shift-end`, `error` |

| Vòng lặp | Nội dung | Thời lượng giải mã | Kênh và bitrate |
| --- | --- | ---: | --- |
| `riverside-night-loop` | Phố ven sông, xe máy xa và tiếng người | 34 giây | Stereo 96 kbps |
| `charcoal-grill-loop` | Bếp than cháy đều | 9,6 giây | Mono 56 kbps |
| `prep-music-loop` | Nhạc chuẩn bị, 78 BPM | 49,23 giây | Stereo 112 kbps |
| `rush-music-loop` | Nhạc cao điểm, 108 BPM | 35,56 giây | Stereo 112 kbps |
| `busy-dining-loop` | Khách trò chuyện, muỗng đũa và dĩa | 31 giây | Stereo 96 kbps |

27 hiệu ứng mono 56 kbps. Đã giải mã cả 32 file bằng FFmpeg, kiểm codec, thời lượng, kênh, biên độ và điểm nối của 5 vòng lặp. Kiểm ở cấp file, chưa phát thử trong game.

## Đợt 1 · Nhân vật và đồ

Asset commit `a6f6bcb` trên `codex/com-tam-wave1`, gồm hai cảnh đã duyệt và master local `f07fef9`.

- Thêm 18 sheet; toàn Đợt 1 có 22 sheet, 514 frame khai báo (509 frame atlas và 5 frame cảnh/màn chào) và 55 clip. WebP lossless, alpha cứng, lưới 2×.
- Chủ quán nữ khăn chàm, áo chàm, tạp dề nâu và khăn trắng. 13 vai đứng cao 242–260 px. 10 vai ngồi có ghế nhựa, cao khoảng 212 px, cùng ô 216×288 và anchor [108,262]. Các khung ngồi quay phải để trình vẽ lật theo ghế. Dĩa và ly là sprite rời. Một số khung chuyển động nhẹ được tạo từ pose chính để giữ điểm neo.
- Có năm mức than, các mức chín và khung lật cho món nướng, các lớp dĩa/hộp đã ghép thử, bàn 2/4 chỗ với bốn trạng thái, đồ bếp, đồ bàn, nguyên liệu, tiền, FX và icon.
- Manifest có đủ 74 điểm đặt và 12 khóa đường đi/bàn. Bảng có điểm ghế, hướng, điểm dĩa và điểm phục vụ. Dời mốc chủ quán sang [394,532] để đứng cạnh bếp thay vì bị bếp che. Đã đo lại sáu chỗ đặt món theo mặt vỉ thật. Giữ nguyên `sceneScale` 257 px (vỉa hè) và 258 px (quán).
- Đã mở ảnh soi từ checker, đối chiếu các vai giữa dáng đứng, đi, phản ứng và ngồi, rồi ghép người, bếp, bàn, dĩa lên cả hai cảnh. Kiểm tra ở cấp file và ảnh ghép tĩnh, chưa kiểm gameplay.

```text
python -I tools/asset-check/check_assets.py docs/quan-com-tam/asset-spec.json --preview <tmp>

0 lỗi, 11 cảnh báo — ĐẠT, giao được.
Ảnh soi nhân vật: <tmp>/nhan-vat-xep-hang-x2.png
```

Cả 11 cảnh báo đều là sheet tùy chọn của Đợt 2.

## Bản duyệt cảnh ban đầu

Asset commit `46ade9d` trên `codex/com-tam-scenes`. Bước duyệt cảnh theo DEV-NOTES, trước khi vẽ nhân vật và đồ rời.

- Hai nền `street-scene` và `quan-scene`, kèm hai lớp che quầy `street-foreground` và `quan-foreground`. Cả bốn file 1280×720, lưới 2×, WebP lossless. Vùng ngoài quầy trên foreground trong suốt.
- Quầy bên trái và sàn bên phải dành cho bàn ghế động. Dùng chung điểm đứng chủ quán [330,532] và điểm đặt bếp [229,404]. Điểm vào qua cửa sau ở cảnh quán là [1146,452]. Ảnh sơ đồ có vị trí bàn dự kiến để duyệt.
- `sceneScale` ghi 257 px cho người 1,65 m ở cả hai cảnh. Cảnh vỉa hè đo từ quầy cao 148 px, tương ứng khoảng 0,95 m. Cảnh quán đo từ khung mở cao 328 px, tương ứng cửa 2,1 m.
- Đã mở ảnh từng cảnh và kiểm chồng foreground lên nền. Pixel phủ trùng màu và tọa độ với nền.

Checker trên phạm vi bốn file cảnh bằng bản sao hợp đồng tạm trả `0 lỗi, 0 cảnh báo — ĐẠT, giao được.` Hợp đồng chính giữ nguyên. Lệnh toàn bộ:

```text
python -I tools/asset-check/check_assets.py docs/quan-com-tam/asset-spec.json --preview <tmp>

99 lỗi, 11 cảnh báo — CHƯA ĐẠT, sửa rồi chạy lại.
```

Phần chưa có gồm 18 sheet bắt buộc còn lại, 70 tọa độ đặt vật, 11 khóa đường đi và bàn, cùng 11 sheet tùy chọn Đợt 2. Checker sẽ có ảnh soi nhân vật khi có sprite.
