# Báo cáo cân bằng Tiệm Bánh Mì (bộ mô phỏng)

Sinh bởi `node tools/sim/sim.mjs` (seed 12345). Thời gian = phút chơi thật: thời gian ca (đồng hồ chạy theo thao tác) + hội thoại + Chuẩn bị ca (gồm canh mẻ đầu ngày) + Chốt ca.

Bảng XP: 0, 30, 55, 125, 270, 445, 655, 1055, 1630, 2355, 2845, 3455, 4110, 5050, 6280, 7575, 9125, 11050, 13295, 16085.

## Mốc cấp (phút chơi)

| Cấp | Mục tiêu | careful | average | sloppy |
|---|---|---|---|---|
| 2 |  | 7.02 (ngày 1) | 6.69 (ngày 1) | 5.88 (ngày 1) |
| 3 |  | 7.02 (ngày 1) | 6.69 (ngày 1) | 5.88 (ngày 1) |
| 4 | 7–14 | 15.16 (ngày 2) | 15.22 (ngày 2) | 11.75 (ngày 2) |
| 5 |  | 23.78 (ngày 3) | 22.34 (ngày 3) | 18.2 (ngày 3) |
| 6 |  | 31.33 (ngày 4) | 30.6 (ngày 4) | 32.22 (ngày 5) |
| 7 | 30–50 | 40.8 (ngày 5) | 46.61 (ngày 6) | 49.75 (ngày 8) |
| 8 |  | 59.66 (ngày 7) | 63.41 (ngày 8) | 68.09 (ngày 11) |
| 9 |  | 90.42 (ngày 10) | 90.05 (ngày 11) | 96.54 (ngày 15) |
| 10 | 100–140 | 126.61 (ngày 14) | 128.47 (ngày 15) | 138.28 (ngày 20) |
| 11 |  | 148.45 (ngày 16) | 154.92 (ngày 18) | 162.95 (ngày 23) |
| 12 |  | 168.44 (ngày 18) | 176.07 (ngày 20) | 195.31 (ngày 27) |
| 13 |  | 199.4 (ngày 21) | 211.91 (ngày 24) | 218.7 (ngày 30) |
| 14 |  | 239.33 (ngày 25) | 245.62 (ngày 28) | 267.44 (ngày 36) |
| 15 |  | 287.41 (ngày 30) | 288.74 (ngày 33) | 321.58 (ngày 43) |
| 16 |  | 334.08 (ngày 35) | 341.99 (ngày 39) | 390.99 (ngày 52) |
| 17 |  | 399.41 (ngày 42) | 412.37 (ngày 47) | 453.09 (ngày 60) |
| 18 |  | 476.36 (ngày 50) | 483.59 (ngày 55) | 535.83 (ngày 71) |
| 19 |  | 567.55 (ngày 59) | 564.18 (ngày 64) | 629.22 (ngày 83) |
| 20 | 600–720 | 664.57 (ngày 69) | 661.55 (ngày 75) | 750.88 (ngày 98) |

## Đạt mục tiêu

- **careful**: cấp 4 15.16 ph LỆCH, cấp 7 40.8 ph đạt, cấp 10 126.61 ph đạt, cấp 20 664.57 ph đạt
- **average**: cấp 4 15.22 ph LỆCH, cấp 7 46.61 ph đạt, cấp 10 128.47 ph đạt, cấp 20 661.55 ph đạt
- **sloppy**: cấp 4 11.75 ph đạt, cấp 7 49.75 ph đạt, cấp 10 138.28 ph đạt, cấp 20 750.88 ph LỆCH

## Tiền theo ngày (mỗi 10 ngày)

| Ngày | careful tiền · lời ca · ổ · cấp | average tiền · lời ca · ổ · cấp | sloppy tiền · lời ca · ổ · cấp |
|---|---|---|---|
| 1 | 291k · 93k · 10 · 3 | 291k · 93k · 10 · 3 | 287k · 81k · 10 · 3 |
| 11 | 1247k · 410k · 36 · 9 | 1174k · 326k · 35 · 9 | 533k · 123k · 23 · 8 |
| 21 | 1970k · 482k · 46 · 13 | 1784k · 285k · 29 · 12 | 749k · 226k · 30 · 10 |
| 31 | 3051k · 548k · 54 · 15 | 1270k · 316k · 37 · 14 | 437k · -206k · 30 · 13 |
| 41 | 3327k · 318k · 46 · 16 | 2607k · 402k · 38 · 16 | 980k · 383k · 33 · 14 |
| 51 | 2137k · 634k · 55 · 18 | 1982k · 465k · 44 · 17 | 1072k · 299k · 31 · 15 |
| 61 | 4590k · 539k · 44 · 19 | 2482k · 403k · 42 · 18 | 1080k · 324k · 41 · 17 |
| 71 | — | 4737k · 334k · 37 · 19 | 812k · 175k · 30 · 18 |
| 81 | — | — | 960k · 60k · 22 · 18 |
| 91 | — | — | 2471k · 262k · 30 · 19 |

## Lời vận hành trung bình theo giai đoạn (k / ca)

| Hồ sơ | ngày 1 | cấp 1–6 | cấp 7–9 | cấp 10–14 | cấp 15–19 | cấp 20 | ổ/ca cấp 10 | ổ/ca cấp 20 |
|---|---|---|---|---|---|---|---|---|
| careful | 93k | 189k | 298k | 439k | 511k | 602k | 32 | 46 |
| average | 93k | 167k | 317k | 314k | 411k | 524k | 29 | 40 |
| sloppy | 81k | 86k | 148k | 152k | 189k | 310k | 29 | 35 |

## Tổng kết

| Hồ sơ | Ngày | Phút | Cấp | Tiền cuối | Lên tiệm (ngày) | Hạng tiệm | Pate nhà làm | Đồ chưa mua | Chỗ tiêu còn lại | Ký gửi | Hết hàng giữa ca | Đóng cửa sớm | Kẹt | Lỗi luật | Hội chợ | Thử thách (đạt) | Huy hiệu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| careful | 70 | 665 | 20 | 4194k | 7 | 7/8 | 3/3 | 0k | 6000k | 0 | 118 | 0 | 0 | 0 | 5 | 0 (0) | 7 |
| average | 76 | 662 | 20 | 1590k | 8 | 7/8 | 3/3 | 0k | 6000k | 0 | 116 | 0 | 0 | 0 | 5 | 0 (0) | 7 |
| sloppy | 99 | 751 | 20 | 2259k | 14 | 4/8 | 3/3 | 0k | 16400k | 0 | 273 | 5 | 0 | 0 | 0 | 0 (0) | 3 |

## Hao hụt

- **careful**: 17/1160 mẻ cháy, hao TB 82k/ca, hết hạn TB 13k/ca
- **average**: 13/870 mẻ cháy, hao TB 72k/ca, hết hạn TB 20k/ca
- **sloppy**: 47/890 mẻ cháy, hao TB 68k/ca, hết hạn TB 13k/ca

Kẹt = ngày không đủ tiền + hàng làm một ổ pate bơ mà gói ký gửi đã dùng. Lỗi luật = action ném lỗi / ca không kết thúc / thớt kẹt.


## Trước / sau Milestone 5

Phút chơi tới cấp (seed 12345, `report.md`). "Trước" = lần chạy đầu của bộ mô phỏng trên luật M4 + tính năng M5, chưa chỉnh số.

| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Lời / ca cấp 7–9 · cấp 20 | Tiền cuối · hạng tiệm | Ký gửi · đóng sớm · kẹt |
|---|---|---|---|---|---|---|---|
| Mục tiêu | ≈ 10 | ≈ 40 | ≈ 120 | 600–720 | 160–200k · 420–480k | còn chỗ tiêu | 0 kẹt |
| average trước | 14,3 | 110,9 | 388 | 2758 (không tới) | ≈ 0k (tiền về 0 từ ngày 5) | 29k · 0/8 | 186 · 175 · 0 |
| careful sau | 15,2 | 40,8 | 126,6 | 664,6 | 298k · 602k | 4.194k · 7/8, pate 3/3 | 0 · 0 · 0 |
| average sau | 15,2 | 46,6 | 128,5 | 661,6 | 317k · 524k | 1.590k · 7/8, pate 3/3 | 0 · 0 · 0 |
| sloppy sau | 11,8 | 49,8 | 138,3 | 750,9 | 148k · 310k | 2.259k · 4/8, pate 3/3 | 0 · 5 · 0 |

Cấp 4 ở ~15 phút vì mốc cấp chỉ ghi lúc chốt ca (ngày 1 kết thúc ở phút ~7, cấp 4 tới giữa ca ngày 2). Tới cấp 20 mọi hồ sơ vẫn còn bậc hạng tiệm cuối 6.000k (sloppy còn 16.400k) ⇒ tiền còn ý nghĩa. Lời / ca cao hơn bảng ECONOMY §11 vì giá ×1,25 nhưng số ổ thấp hơn (29–32 ổ ở cấp 10, 40–46 ở cấp 20).
