# Báo cáo cân bằng Quán Cơm Tấm (bộ mô phỏng)

Sinh bởi `node tools/sim/sim.mjs` (seed 12345). Thời gian = phút chơi thật: thời gian ca (đồng hồ chạy theo thao tác, cô chủ đi bộ trong cảnh) + hội thoại + Chuẩn bị (đầu ngày, giữa hai ca) + Chốt ca.

Bảng XP: 0, 40, 75, 110, 200, 315, 445, 660, 980, 1525, 1935, 2425, 2910, 3375, 3930, 4745, 5505, 6455, 7590, 9015.

## Mốc cấp (phút chơi)

| Cấp | Mục tiêu | average |
|---|---|---|
| 2 |  | 5.2 (ngày 1) |
| 3 |  | 10.08 (ngày 2) |
| 4 | 7–14 | 15.75 (ngày 3) |
| 5 |  | 29.18 (ngày 5) |
| 6 |  | 40.15 (ngày 6) |
| 7 | 30–50 | 61.98 (ngày 8) |
| 8 |  | 92.18 (ngày 11) |
| 9 |  | 123.76 (ngày 14) |
| 10 | 100–140 | 165.09 (ngày 18) |
| 11 |  | 185.77 (ngày 20) |
| 12 |  | 231.05 (ngày 24) |
| 13 |  | 274.74 (ngày 28) |
| 14 |  | 339.95 (ngày 34) |
| 15 |  | 438.26 (ngày 42) |
| 16 |  | 533.35 (ngày 50) |
| 17 |  | 661.18 (ngày 61) |
| 18 |  | 809.27 (ngày 74) |
| 19 |  | 992.98 (ngày 90) |
| 20 | 600–720 | 1212.66 (ngày 109) |

## Đạt mục tiêu

- **average**: cấp 4 15.75 ph LỆCH, cấp 7 61.98 ph LỆCH, cấp 10 165.09 ph LỆCH, cấp 20 1212.66 ph LỆCH

## Tiền theo ngày (mỗi 10 ngày)

| Ngày | average tiền · lời ngày · dĩa/khách · cấp |
|---|---|
| 1 | 328k · 96k · 6/8 · 2 |
| 11 | 244k · 69k · 16/41 · 8 |
| 21 | 1215k · 306k · 29/49 · 11 |
| 31 | 994k · -8k · 16/65 · 13 |
| 41 | 556k · 34k · 19/61 · 14 |
| 51 | 597k · 137k · 18/54 · 16 |
| 61 | 582k · 174k · 17/63 · 17 |
| 71 | 688k · -11k · 18/66 · 17 |
| 81 | 598k · 124k · 17/64 · 18 |
| 91 | 865k · 65k · 15/74 · 19 |
| 101 | 724k · 170k · 20/72 · 19 |

## Lời vận hành trung bình theo giai đoạn (k / ngày)

| Hồ sơ | ngày 1 | cấp 1–4 | cấp 5–6 | cấp 7–9 | cấp 10–14 | cấp 15–19 | cấp 20 | dĩa/ngày cấp 10 | dĩa/ngày cấp 20 |
|---|---|---|---|---|---|---|---|---|---|
| average | 96k | 110k | 115k | 200k | 57k | 71k | -71k | 18 | 19 |

## Tổng kết

| Hồ sơ | Ngày | Phút | Cấp | Tiền cuối | Lên quán (ngày) | Hạng quán | Nước mắm | Đồ chưa mua | Chỗ tiêu còn lại | Ký gửi | Hết hàng giữa ca | Kẹt | Lỗi luật | Hội chợ | Thử thách (đạt) | Huy hiệu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| average | 110 | 1213 | 20 | 678k | 10 | 1/8 | 1/3 | 0k | 34200k | 0 | 317 | 0 | 0 | 5 | 0 (0) | 3 |

## Khách bỏ về, hao hụt

- **average**: bỏ về 1237/6539 khách (19%), đi ngang (cửa đầy) 3754; cháy đen 778 miếng / 2019 dĩa (28%), hao TB 133k/ngày; vòng lặp kẹt thao tác 0.

Kẹt = đầu ngày không đủ tiền + hàng làm một dĩa cơm sườn mà không có gói ký gửi. Lỗi luật = action ném lỗi / bất biến hỏng / ca không kết thúc.

## Trước cân bằng M5

Bản bd5b283 (M3 + M4 gộp, trước M5), cùng bộ mô phỏng và hồ sơ, seed 12345, tối đa 120 ngày.

| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Ngày / phút cuối | Cấp cuối | Tiền cuối | Lên quán | Ký gửi | Bỏ về | Lời / ngày cấp 1–4 | cấp 5–6 | cấp 7–9 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| careful | 21.54 ph | 182.21 ph | — | — | 121 / 1256 | 8 | 0k | không | 105 | 2388/4081 (59%) | 33k | -126k | -190k |
| average | 18.7 ph | 91.34 ph | 427.2 ph | — | 121 / 1243 | 12 | 0k | 13 | 65 | 2741/5258 (52%) | 28k | -23k | -198k |
| sloppy | 16 ph | 82.27 ph | — | — | 121 / 1040 | 9 | 0k | không | 97 | 2474/4339 (57%) | -59k | -92k | -225k |


