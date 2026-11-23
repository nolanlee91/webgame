# Báo cáo cân bằng Quán Cơm Tấm (bộ mô phỏng)

Sinh bởi `node tools/sim/sim.mjs` (seed 12345). Thời gian = phút chơi thật: thời gian ca (đồng hồ chạy theo thao tác, cô chủ đi bộ trong cảnh) + hội thoại + Chuẩn bị (đầu ngày, giữa hai ca) + Chốt ca.

Bảng XP: 0, 40, 75, 110, 200, 315, 445, 660, 980, 1525, 1935, 2425, 2910, 3375, 3930, 4745, 5505, 6455, 7590, 9015.

## Mốc cấp (phút chơi)

| Cấp | Mục tiêu | careful | average | sloppy |
|---|---|---|---|---|
| 2 |  | 6.09 (ngày 1) | 5.2 (ngày 1) | 5.23 (ngày 1) |
| 3 |  | 12.74 (ngày 2) | 11.25 (ngày 2) | 10.47 (ngày 2) |
| 4 | 7–14 | 12.74 (ngày 2) | 11.25 (ngày 2) | 10.47 (ngày 2) |
| 5 |  | 18.54 (ngày 3) | 17.85 (ngày 3) | 21.5 (ngày 4) |
| 6 |  | 29.15 (ngày 4) | 30.61 (ngày 4) | 29.64 (ngày 5) |
| 7 | 30–50 | 40.28 (ngày 5) | 44.25 (ngày 5) | 41.22 (ngày 6) |
| 8 |  | 54.13 (ngày 6) | 77.44 (ngày 8) | 51.91 (ngày 7) |
| 9 |  | 77.76 (ngày 8) | 90 (ngày 9) | 104.51 (ngày 11) |
| 10 | 100–140 | 110.75 (ngày 11) | 131.84 (ngày 13) | 150.94 (ngày 15) |
| 11 |  | 131.64 (ngày 13) | 153.25 (ngày 15) | 170.88 (ngày 17) |
| 12 |  | 169.76 (ngày 16) | 198.79 (ngày 19) | 201.55 (ngày 20) |
| 13 |  | 210.43 (ngày 19) | 230.65 (ngày 22) | 235.1 (ngày 23) |
| 14 |  | 235.1 (ngày 21) | 263.7 (ngày 25) | 269.73 (ngày 26) |
| 15 |  | 275.18 (ngày 24) | 309.1 (ngày 29) | 310.63 (ngày 30) |
| 16 |  | 308.9 (ngày 27) | 362.89 (ngày 34) | 358.94 (ngày 35) |
| 17 |  | 356.31 (ngày 31) | 418.92 (ngày 39) | 415.9 (ngày 40) |
| 18 |  | 394.94 (ngày 34) | 486.95 (ngày 45) | 490.23 (ngày 47) |
| 19 |  | 468.3 (ngày 39) | 566.47 (ngày 52) | 571.39 (ngày 55) |
| 20 | 600–720 | 530.59 (ngày 44) | 659.13 (ngày 60) | 667.24 (ngày 64) |

## Đạt mục tiêu

- **careful**: cấp 4 12.74 ph đạt, cấp 7 40.28 ph đạt, cấp 10 110.75 ph đạt, cấp 20 530.59 ph LỆCH
- **average**: cấp 4 11.25 ph đạt, cấp 7 44.25 ph đạt, cấp 10 131.84 ph đạt, cấp 20 659.13 ph đạt
- **sloppy**: cấp 4 10.47 ph đạt, cấp 7 41.22 ph đạt, cấp 10 150.94 ph LỆCH, cấp 20 667.24 ph đạt

## Tiền theo ngày (mỗi 10 ngày)

| Ngày | careful tiền · lời ngày · dĩa/khách · cấp | average tiền · lời ngày · dĩa/khách · cấp | sloppy tiền · lời ngày · dĩa/khách · cấp |
|---|---|---|---|
| 1 | 408k · 147k · 8/8 · 2 | 328k · 96k · 6/8 · 2 | 448k · 144k · 8/8 · 2 |
| 11 | 829k · 243k · 22/46 · 10 | 604k · 245k · 19/48 · 9 | 478k · -35k · 9/38 · 9 |
| 21 | 1070k · 291k · 25/67 · 14 | 965k · 118k · 16/55 · 12 | 804k · 229k · 21/49 · 12 |
| 31 | 2121k · 574k · 32/84 · 17 | 848k · 8k · 28/64 · 15 | 619k · 153k · 20/57 · 15 |
| 41 | 2205k · 534k · 30/88 · 19 | 719k · 148k · 17/68 · 17 | 379k · 105k · 18/56 · 17 |
| 51 | — | 483k · 67k · 18/61 · 18 | 87k · -156k · 14/72 · 18 |
| 61 | — | — | 443k · 15k · 17/80 · 19 |

## Lời vận hành trung bình theo giai đoạn (k / ngày)

| Hồ sơ | ngày 1 | cấp 1–4 | cấp 5–6 | cấp 7–9 | cấp 10–14 | cấp 15–19 | cấp 20 | dĩa/ngày cấp 10 | dĩa/ngày cấp 20 |
|---|---|---|---|---|---|---|---|---|---|
| careful | 147k | 131k | 114k | 189k | 349k | 442k | 421k | 23 | 30 |
| average | 96k | 120k | 214k | 173k | 143k | 111k | 158k | 17 | 19 |
| sloppy | 144k | 78k | 231k | 41k | 101k | -1k | 6k | 19 | 16 |

## Tổng kết

| Hồ sơ | Ngày | Phút | Cấp | Tiền cuối | Lên quán (ngày) | Hạng quán | Nước mắm | Đồ chưa mua | Chỗ tiêu còn lại | Ký gửi | Hết hàng giữa ca | Kẹt | Lỗi luật | Hội chợ | Thử thách (đạt) | Huy hiệu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| careful | 45 | 531 | 20 | 3728k | 6 | 5/8 | 3/3 | 0k | 10600k | 0 | 204 | 0 | 0 | 3 | 0 (0) | 3 |
| average | 61 | 659 | 20 | 915k | 9 | 2/8 | 1/3 | 0k | 16600k | 0 | 172 | 0 | 0 | 0 | 0 (0) | 2 |
| sloppy | 65 | 667 | 20 | 694k | 12 | 2/8 | 1/3 | 0k | 16600k | 5 | 731 | 0 | 0 | 0 | 0 (0) | 2 |

## Khách bỏ về, hao hụt

- **careful**: bỏ về 419/2737 khách (15%), đi ngang (cửa đầy) 1686; cháy đen 87 miếng / 1126 dĩa (7%), hao TB 92k/ngày; vòng lặp kẹt thao tác 0.
- **average**: bỏ về 650/3403 khách (19%), đi ngang (cửa đầy) 1902; cháy đen 382 miếng / 1082 dĩa (26%), hao TB 120k/ngày; vòng lặp kẹt thao tác 0.
- **sloppy**: bỏ về 908/3569 khách (25%), đi ngang (cửa đầy) 1729; cháy đen 882 miếng / 994 dĩa (47%), hao TB 203k/ngày; vòng lặp kẹt thao tác 0.

Kẹt = đầu ngày không đủ tiền + hàng làm một dĩa cơm sườn mà không có gói ký gửi. Lỗi luật = action ném lỗi / bất biến hỏng / ca không kết thúc.

## Trước cân bằng M5

Bản bd5b283 (M3 + M4 gộp, trước M5), cùng bộ mô phỏng và hồ sơ, seed 12345, tối đa 120 ngày.

| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Ngày / phút cuối | Cấp cuối | Tiền cuối | Lên quán | Ký gửi | Bỏ về | Lời / ngày cấp 1–4 | cấp 5–6 | cấp 7–9 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| careful | 21.54 ph | 182.21 ph | — | — | 121 / 1256 | 8 | 0k | không | 105 | 2388/4081 (59%) | 33k | -126k | -190k |
| average | 18.7 ph | 91.34 ph | 427.2 ph | — | 121 / 1243 | 12 | 0k | 13 | 65 | 2741/5258 (52%) | 28k | -23k | -198k |
| sloppy | 16 ph | 82.27 ph | — | — | 121 / 1040 | 9 | 0k | không | 97 | 2474/4339 (57%) | -59k | -92k | -225k |


