# Nông Trại 2.0 — báo cáo mô phỏng cân bằng
Sinh lúc 2026-11-19T09:46:27.682Z · 7 ngày mô phỏng · seed 12345 · chạy 25.5 s · luật thật từ `core/*` + `data/*` (xem README.md về giả định).
Mục tiêu §3 (thời gian **chơi**): cấp 4 ≈ 10 ph · cấp 7 ≈ 40 ph · cấp 10 ≈ 2 h · cấp 20 ≈ 10–12 h.

## Tóm tắt
- **Chăm**: cấp 4 / 7 / 10 / 20 sau 3 ph / 10 ph / 21 ph / 1.5 h chơi (3 ph / 10 ph / 21 ph / 3.0 h thật); cuối tuần cấp 110, 883,671 xu.
- **Thỉnh thoảng**: cấp 4 / 7 / 10 / 20 sau 2 ph / 10 ph / 20 ph / 80 ph chơi (2 ph / 5.0 h / 12.0 h / 2.5 ngày thật); cuối tuần cấp 35, 16,360 xu.
- **Ngày 2 lần**: cấp 4 / 7 / 10 / 20 sau 2 ph / 8 ph / 15 ph / 67 ph chơi (2 ph / 12.0 h / 36.0 h / 6.5 ngày thật); cuối tuần cấp 20, 1,620 xu.
- Thu nhập: Chăm — đơn 36 %, thô 34 %, thành phẩm 14 %, trứng/sữa 8 %, nhiệm vụ 8 %; Thỉnh thoảng — đơn 40 %, thô 31 %, thành phẩm 11 %, trứng/sữa 7 %, nhiệm vụ 10 %; Ngày 2 lần — đơn 52 %, thô 17 %, thành phẩm 8 %, trứng/sữa 5 %, nhiệm vụ 18 %.
- Vòng lặp lời: không thấy (chợ chặn mua→bán lời; thu nhập/giờ chơi phẳng, không siêu tuyến tính).
- Lỗi luật còn tái hiện: 7 (xem §10).
- Gợi ý ưu tiên: (1) core/progression.js: Math.round(60 · lv^2) (tổng ≈ 148,200 XP) · (2) core/progression.js: dừng ở MAX_LEVEL (data/levels.js), XP thừa dồn vào "danh tiếng" (§3 cấp 20) · (3) data/buildings.js: ×4–6 cho mốc cuối (vd. đất Đông 15 000, Xưởng cấp 2 6 000) hoặc thêm vật phẩm tiêu xu lặp lại (trang trí giá theo bậc, nâng kho 4–5 bằng xu) · (4) data/catalog.js: trứng 32, sữa 72 — hoặc 2 ngô → 4 bao thức ăn · (5) data/buildings.js: { "van-go": 4 } + 900 xu (hoặc tăng MATERIAL_DROP 2 % → 5 % trong core/plots.js).

## Hồ sơ người chơi
| Hồ sơ | Mô tả | Chơi 7 ngày | Cấp cuối | Xu cuối | Tổng xu kiếm |
|---|---|---|---|---|---|
| Chăm | Phiên 30 phút liên tục, nghỉ 30 phút, 8:00–22:00 (14 phiên ≈ 7 giờ/ngày), nhìn màn hình mỗi phút | 49.0 h | 110 | 883,671 | 1,337,720 |
| Thỉnh thoảng | 3 phiên/ngày × 10 phút (8:00, 13:00, 20:00), thao tác mỗi 30 giây khi đang chơi | 3.5 h | 35 | 16,360 | 72,071 |
| Ngày 2 lần | 2 phiên/ngày × 5 phút (8:00, 20:00), gieo cây dài trước khi rời, thao tác mỗi 30 giây | 70 ph | 20 | 1,620 | 16,620 |

## 1. Thời gian tới từng cấp (chơi / thật)

| Cấp | Chăm — chơi | Thỉnh thoảng — chơi | Ngày 2 lần — chơi | Chăm — thật | Thỉnh thoảng — thật | Ngày 2 lần — thật |
|---|---|---|---|---|---|---|
| 1 | 0 ph | 0 ph | 0 ph | 0 ph | 0 ph | 0 ph |
| 2 | 1 ph | 1 ph | 1 ph | 1 ph | 1 ph | 1 ph |
| 3 | 2 ph | 2 ph | 2 ph | 2 ph | 2 ph | 2 ph |
| 4 (mục tiêu 10 ph) | 3 ph | 2 ph | 2 ph | 3 ph | 2 ph | 2 ph |
| 5 | 5 ph | 6 ph | 4 ph | 5 ph | 6 ph | 4 ph |
| 6 | 8 ph | 9 ph | 5 ph | 8 ph | 9 ph | 12.0 h |
| 7 (mục tiêu 40 ph) | 10 ph | 10 ph | 8 ph | 10 ph | 5.0 h | 12.0 h |
| 8 | 13 ph | 13 ph | 10 ph | 13 ph | 5.0 h | 12.1 h |
| 9 | 18 ph | 16 ph | 10 ph | 18 ph | 5.1 h | 24.0 h |
| 10 (mục tiêu 2.0 h) | 21 ph | 20 ph | 15 ph | 21 ph | 12.0 h | 36.0 h |
| 11 | 26 ph | 23 ph | 19 ph | 26 ph | 12.1 h | 36.1 h |
| 12 | 30 ph | 28 ph | 22 ph | 60 ph | 12.1 h | 2.0 ngày |
| 13 | 36 ph | 32 ph | 27 ph | 66 ph | 24.0 h | 2.5 ngày |
| 14 | 42 ph | 39 ph | 30 ph | 72 ph | 24.1 h | 3.0 ngày |
| 15 | 48 ph | 42 ph | 36 ph | 78 ph | 29.0 h | 3.5 ngày |
| 16 | 55 ph | 50 ph | 40 ph | 85 ph | 29.2 h | 4.0 ngày |
| 17 | 62 ph | 56 ph | 49 ph | 2.0 h | 36.1 h | 4.5 ngày |
| 18 | 73 ph | 64 ph | 55 ph | 2.2 h | 2.0 ngày | 5.0 ngày |
| 19 | 83 ph | 70 ph | 60 ph | 2.4 h | 2.2 ngày | 6.0 ngày |
| 20 (mục tiêu 11.0 h) | 1.5 h | 80 ph | 67 ph | 3.0 h | 2.5 ngày | 6.5 ngày |

Tỉ lệ so với mục tiêu (thời gian chơi thực tế ÷ mục tiêu; < 1 = nhanh hơn thiết kế):
| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 |
|---|---|---|---|---|
| Chăm | 0.3× | 0.25× | 0.18× | 0.14× |
| Thỉnh thoảng | 0.2× | 0.25× | 0.17× | 0.12× |
| Ngày 2 lần | 0.2× | 0.19× | 0.13× | 0.1× |

## 2. Đường cong xu / XP (mẫu cuối mỗi phiên)

**Chăm**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 30 ph | 30 | 11 | 1,669 | 697 | 3,598 | 14 | 6 |
| 7.5 h | 240 | 35 | 30,001 | 20,190 | 77,226 | 43 | 16 |
| 24.5 h | 450 | 49 | 68,217 | 87,362 | 178,788 | 43 | 16 |
| 31.5 h | 660 | 59 | 107,020 | 158,608 | 283,539 | 43 | 16 |
| 2.0 ngày | 870 | 66 | 143,654 | 226,729 | 381,902 | 43 | 16 |
| 2.3 ngày | 1080 | 73 | 182,033 | 299,023 | 485,655 | 43 | 16 |
| 3.0 ngày | 1290 | 79 | 219,937 | 361,014 | 582,287 | 43 | 16 |
| 3.3 ngày | 1500 | 83 | 254,713 | 423,573 | 673,077 | 43 | 16 |
| 4.0 ngày | 1710 | 88 | 292,502 | 496,849 | 778,540 | 43 | 16 |
| 4.3 ngày | 1920 | 92 | 328,896 | 562,225 | 873,615 | 43 | 16 |
| 5.0 ngày | 2130 | 96 | 363,385 | 625,907 | 964,993 | 43 | 16 |
| 5.3 ngày | 2340 | 100 | 401,651 | 695,658 | 1,066,771 | 43 | 16 |
| 6.0 ngày | 2550 | 104 | 438,075 | 762,634 | 1,163,840 | 43 | 16 |
| 6.3 ngày | 2760 | 107 | 475,271 | 830,531 | 1,261,463 | 43 | 16 |
| 6.6 ngày | 2940 | 110 | 504,118 | 883,671 | 1,337,720 | 43 | 16 |

**Thỉnh thoảng**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 10 ph | 10 | 6 | 358 | 103 | 782 | 12 | 0 |
| 5.2 h | 20 | 9 | 1,105 | 2 | 2,421 | 12 | 0 |
| 12.2 h | 30 | 12 | 1,942 | 566 | 4,197 | 14 | 6 |
| 24.2 h | 40 | 14 | 2,893 | 1,504 | 6,269 | 16 | 6 |
| 29.2 h | 50 | 16 | 3,885 | 908 | 9,523 | 17 | 8 |
| 36.2 h | 60 | 17 | 4,819 | 375 | 12,192 | 17 | 8 |
| 2.0 ngày | 70 | 18 | 5,856 | 171 | 15,005 | 17 | 13 |
| 2.2 ngày | 80 | 19 | 6,521 | 246 | 16,301 | 17 | 16 |
| 2.5 ngày | 90 | 21 | 7,697 | 454 | 18,974 | 17 | 16 |
| 3.0 ngày | 100 | 22 | 8,983 | 310 | 21,924 | 23 | 16 |
| 3.2 ngày | 110 | 23 | 10,299 | 203 | 25,298 | 26 | 16 |
| 3.5 ngày | 120 | 25 | 12,180 | 2,601 | 29,930 | 28 | 16 |
| 4.0 ngày | 130 | 26 | 13,621 | 242 | 33,025 | 28 | 16 |
| 4.2 ngày | 140 | 27 | 15,175 | 366 | 37,738 | 39 | 16 |
| 4.5 ngày | 150 | 28 | 17,034 | 1,032 | 41,296 | 40 | 16 |
| 5.0 ngày | 160 | 29 | 18,874 | 2,189 | 47,577 | 42 | 16 |
| 5.2 ngày | 170 | 31 | 20,756 | 2,895 | 52,186 | 43 | 16 |
| 5.5 ngày | 180 | 32 | 22,441 | 6,634 | 57,361 | 43 | 16 |
| 6.0 ngày | 190 | 33 | 24,429 | 8,987 | 61,562 | 43 | 16 |
| 6.2 ngày | 200 | 34 | 26,461 | 13,035 | 67,108 | 43 | 16 |
| 6.5 ngày | 210 | 35 | 28,161 | 16,360 | 72,071 | 43 | 16 |

**Ngày 2 lần**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 5 ph | 5 | 5 | 228 | 56 | 564 | 11 | 0 |
| 12.1 h | 10 | 8 | 664 | 5 | 1,316 | 12 | 0 |
| 24.1 h | 15 | 9 | 1,107 | 15 | 2,719 | 12 | 6 |
| 36.1 h | 20 | 11 | 1,525 | 371 | 3,636 | 14 | 6 |
| 2.0 ngày | 25 | 12 | 1,991 | 85 | 4,658 | 14 | 7 |
| 2.5 ngày | 30 | 13 | 2,455 | 0 | 5,332 | 16 | 8 |
| 3.0 ngày | 35 | 14 | 3,043 | 1,070 | 6,909 | 16 | 8 |
| 3.5 ngày | 40 | 15 | 3,580 | 883 | 8,672 | 16 | 8 |
| 4.0 ngày | 45 | 16 | 4,101 | 1,187 | 9,344 | 16 | 8 |
| 4.5 ngày | 50 | 17 | 4,556 | 2 | 10,550 | 17 | 10 |
| 5.0 ngày | 55 | 18 | 5,161 | 74 | 11,663 | 17 | 10 |
| 5.5 ngày | 60 | 18 | 5,671 | 1,066 | 13,043 | 17 | 10 |
| 6.0 ngày | 65 | 19 | 6,380 | 732 | 15,314 | 17 | 16 |
| 6.5 ngày | 70 | 20 | 6,927 | 1,620 | 16,620 | 17 | 16 |

## 3. Nguồn thu (xu)
| Hồ sơ | Bán nông sản thô | Giao đơn | Bán thành phẩm | Bán trứng / sữa | Thưởng nhiệm vụ | Tổng |
|---|---|---|---|---|---|---|
| Chăm | 453,212 (34 %) | 485,765 (36 %) | 187,735 (14 %) | 108,076 (8 %) | 102,932 (8 %) | 1,337,720 |
| Thỉnh thoảng | 22,310 (31 %) | 29,157 (40 %) | 8,138 (11 %) | 4,989 (7 %) | 7,477 (10 %) | 72,071 |
| Ngày 2 lần | 2,751 (17 %) | 8,720 (52 %) | 1,310 (8 %) | 907 (5 %) | 2,932 (18 %) | 16,620 |

XP theo nguồn:
| Hồ sơ | Thu hoạch | Giao đơn | Nhận từ máy | Vật nuôi | Nhiệm vụ M1 | Nhiệm vụ làng |
|---|---|---|---|---|---|---|
| Chăm | 357,860 | 65,660 | 43,631 | 11,365 | 85 | 25,517 |
| Thỉnh thoảng | 19,516 | 3,874 | 2,386 | 545 | 20 | 1,820 |
| Ngày 2 lần | 4,390 | 1,107 | 625 | 102 | 20 | 683 |

Chi tiêu:
| Hồ sơ | Hạt | Ô đất | Công trình | Máy | Nâng máy | Vật nuôi | Vật liệu (chợ) |
|---|---|---|---|---|---|---|---|
| Chăm | 417,883 | 10,350 | 11,590 | 2,450 | 7,150 | 1,680 | 2,970 |
| Thỉnh thoảng | 23,425 | 10,350 | 11,190 | 2,450 | 3,550 | 1,680 | 3,090 |
| Ngày 2 lần | 5,274 | 860 | 5,790 | 650 | 200 | 1,680 | 570 |

## 4. Lần đầu dùng được tính năng (phút chơi · thời gian thật)

| Tính năng | Chăm | Thỉnh thoảng | Ngày 2 lần |
|---|---|---|---|
| Nhà kho xây xong | 2 ph · 2 ph | 2 ph · 2 ph | 2 ph · 2 ph |
| Xưởng + Bếp sên dùng được | 11 ph · 11 ph | 11 ph · 5.0 h | 6 ph · 12.0 h |
| Cối xay bắt đầu xây | 12 ph · 12 ph | 15 ph · 5.1 h | 8 ph · 12.0 h |
| Đơn kết hợp đầu tiên xuất hiện | 5 ph · 5 ph | 6 ph · 6 ph | 5 ph · 5 ph |
| Giao đơn kết hợp đầu | 15 ph · 15 ph | 10 ph · 5.0 h | 8 ph · 12.0 h |
| Chuồng gà xây xong | 17 ph · 17 ph | 20 ph · 12.0 h | 12 ph · 24.0 h |
| Thu sản phẩm vật nuôi đầu | 24 ph · 24 ph | 28 ph · 12.1 h | 15 ph · 36.0 h |
| Lò bánh bắt đầu xây | 30 ph · 60 ph | 20 ph · 5.2 h | 15 ph · 24.1 h |
| Chuồng bò xây xong | 75 ph · 2.3 h | 60 ph · 2.0 ngày | 53 ph · 5.0 ngày |
| Nhà kính xây xong | 1.6 h · 3.1 h | 1.5 h · 3.0 ngày | — |
| Đơn đặc biệt đầu tiên | 27 ph · 27 ph | 24 ph · 12.1 h | 20 ph · 36.1 h |
| Giao đơn đặc biệt đầu | 72 ph · 2.2 h | 2.0 h · 3.5 ngày | — |
| Máy bơ sữa bắt đầu xây | 1.6 h · 3.1 h | 1.7 h · 3.2 ngày | — |
| Nồi đường bắt đầu xây | 1.9 h · 3.4 h | 1.7 h · 3.2 ngày | — |
| Xưởng cấp 2 | 49 ph · 79 ph | 40 ph · 29.0 h | 35 ph · 3.5 ngày |
| Khu đất phía Đông mở | 2.4 h · 4.4 h | 2.2 h · 4.2 ngày | — |
| Hoàn thành chuỗi NPC đầu | 1.5 h · 3.0 h | 58 ph · 36.1 h | 50 ph · 5.0 ngày |
| Lưới an toàn tặng hạt (lần đầu) | — | — | — |

## 5. Khựng / kẹt
- **Không có gì để làm**: lần nhìn màn hình không có hành động có ích nào (chỉ tưới / chờ); chuỗi > 5 phút chơi được ghi lại.
- **Chờ gom xu**: mục ưu tiên lớn kế tiếp chưa đủ xu / vật liệu liên tục > 5 phút chơi.
- **Kẹt**: kho + giỏ tràn đầy chặn thu hoạch, hoặc ruộng trống mà không đủ xu mua hạt.

| Hồ sơ | Phút chơi rảnh | Chuỗi rảnh > 5 ph | Phút kẹt kho đầy | Phút hết xu | Lưới an toàn tặng hạt | Nhiệm vụ M1 (đã qua / 13) | Tiến trình làng (/6) | Chuỗi NPC (bước) |
|---|---|---|---|---|---|---|---|---|
| Chăm | 0 | 0 | 0 | 5 | 0 | 13 | 3 | chi-ba 3/3, co-hai 3/3, bac-tu 2/3, anh-ut 3/3 |
| Thỉnh thoảng | 15.5 | 0 | 0 | 7.5 | 0 | 6 | 3 | chi-ba 3/3, co-hai 3/3, bac-tu 2/3, anh-ut 1/3 |
| Ngày 2 lần | 1.5 | 0 | 0 | 6 | 0 | 6 | 3 | chi-ba 3/3, co-hai 3/3, bac-tu 2/3, anh-ut 0/3 |

Chờ gom xu lâu nhất — Chăm:
| Mục | Từ phút chơi | Từ giờ thật | Kéo dài (phút chơi) | Cấp lúc đó |
|---|---|---|---|---|
| build:dat-phia-dong@1 | 114 | 3.4 h | 27 | 22 |
| up:xuong@2 | 36 | 66 ph | 13 | 13 |
| build:chuong-bo@1 | 59 | 89 ph | 13 | 16 |
| up:nha-kinh@2 | 95 | 3.1 h | 13 | 20 |
| up:chuong-ga@3 | 49 | 79 ph | 10 | 15 |
| up:chuong-ga@2 | 21 | 21 ph | 9 | 10 |

Chờ gom xu lâu nhất — Thỉnh thoảng:
| Mục | Từ phút chơi | Từ giờ thật | Kéo dài (phút chơi) | Cấp lúc đó |
|---|---|---|---|---|
| build:dat-phia-dong@1 | 108 | 3.2 ngày | 22 | 23 |
| build:nha-kinh@1 | 68 | 2.0 ngày | 18 | 18 |
| up:chuong-ga@2 | 20 | 12.0 h | 12 | 10 |
| up:chuong-ga@3 | 46 | 29.1 h | 11 | 15 |
| up:nha-kinh@2 | 90 | 3.0 ngày | 9 | 21 |
| up:xuong@2 | 32 | 24.0 h | 8 | 13 |

Chờ gom xu lâu nhất — Ngày 2 lần:
| Mục | Từ phút chơi | Từ giờ thật | Kéo dài (phút chơi) | Cấp lúc đó |
|---|---|---|---|---|
| up:chuong-ga@3 | 35 | 3.5 ngày | 10 | 14 |
| build:nha-kinh@1 | 60.5 | 6.0 ngày | 10 | 19 |
| up:xuong@2 | 26.5 | 2.5 ngày | 9 | 13 |
| up:chuong-ga@2 | 15 | 36.0 h | 7 | 10 |
| up:chuong-bo@2 | 53 | 5.0 ngày | 7 | 17 |

## 6. Vòng lặp lời vô hạn
- `MARKET.assertEconomy()` (mua ở chợ → chế biến / nuôi → bán): **không có vòng lời** ✔.
- Chăm: xu kiếm mỗi giờ chơi theo ngày 23,497 → 28,980 → 28,662 → 27,944 → 26,870 → 28,283 → 26,867; tăng 0.93× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 66 % tổng xu kiếm được chưa tiêu.
- Thỉnh thoảng: xu kiếm mỗi giờ chơi theo ngày 8,394 → 15,990 → 13,564 → 21,912 → 22,732 → 32,130 → 29,420; tăng 1.84× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 23 % tổng xu kiếm được chưa tiêu.
- Ngày 2 lần: xu kiếm mỗi giờ chơi theo ngày 7,896 → 13,920 → 10,176 → 20,040 → 11,268 → 14,958 → 21,462; tăng 1.54× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 10 % tổng xu kiếm được chưa tiêu.

## 7. Lợi nhuận chuỗi A/B/C theo phút tài nguyên (giá gốc, cây đã tưới)
| Chuỗi | Cách làm | Doanh thu | Hạt | Lãi | Hơn bán thô | Phút-ô | Phút-máy | Phút-vật nuôi | Lãi / phút-ô | Lãi / tổng phút | Thô / phút-ô |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | Dâu → Mứt dâu → bán chợ (giá gốc) | 74 | 24 | 50 | 20 | 3.15 | 2 | 0 | 15.9 | 9.7 | 9.5 |
| A | Dâu → Mứt dâu → đơn thường | 86.9 | 24 | 62.9 | 32.9 | 3.15 | 2 | 0 | 20 | 12.2 | 9.5 |
| A | Dâu → Mứt dâu → đơn kết hợp | 96.2 | 24 | 72.2 | 42.2 | 3.15 | 2 | 0 | 22.9 | 14 | 9.5 |
| B | Ngô → Thức ăn → Gà → Trứng + Lúa → Bột → Bánh trứng → bán chợ (giá gốc) | 160 | 36 | 124 | 69.3 | 8.4 | 6.67 | 8 | 14.8 | 5.4 | 6.5 |
| B | Ngô → Thức ăn → Gà → Trứng + Lúa → Bột → Bánh trứng → bán chợ giá ↑ (+15 %) | 184 | 36 | 148 | 93.3 | 8.4 | 6.67 | 8 | 17.6 | 6.4 | 6.5 |
| B | Ngô → Thức ăn → Gà → Trứng + Lúa → Bột → Bánh trứng → đơn kết hợp | 208 | 36 | 172 | 117.3 | 8.4 | 6.67 | 8 | 20.5 | 7.5 | 6.5 |
| C | Cà chua → bán ngay | 12 | 5 | 7 | 0 | 0.7 | 0 | 0 | 10 | 10 | 10 |
| C | 12 cà chua → đơn "6 cà chua + 2 sốt" (kết hợp) | 218.4 | 60 | 158.4 | 74.4 | 8.4 | 3 | 0 | 18.9 | 13.9 | 10 |

Cây (mỗi phút-ô):
| Cây | Cấp | Lớn (ph) | Lãi/vụ | Xu/phút-ô | Xu/phút-ô (tưới) | XP/phút-ô | XP/phút-ô (tưới) |
|---|---|---|---|---|---|---|---|
| Cà rốt | 1 | 0.5 | 4 | 8 | 11.4 | 4 | 5.7 |
| Cà chua | 1 | 1 | 7 | 7 | 10 | 4 | 5.7 |
| Dâu tây | 2 | 1.5 | 10 | 6.7 | 9.5 | 4 | 5.7 |
| Ngô | 3 | 3 | 17 | 5.7 | 8.1 | 3.3 | 4.8 |
| Bí ngô | 4 | 5 | 27 | 5.4 | 7.7 | 3.2 | 4.6 |
| Lúa | 6 | 4 | 16 | 4 | 5.7 | 3 | 4.3 |
| Mía | 10 | 8 | 34 | 4.3 | 6.1 | 2.5 | 3.6 |

Công thức (mỗi phút-máy, giá gốc):
| Công thức | Máy | Cấp | Phút | Giá trị vào | Giá trị ra | Ra/vào | Cộng thêm / phút-máy |
|---|---|---|---|---|---|---|---|
| mut-dau | bep-sen | 4 | 2 | 54 | 74 | 1.37 | 10 |
| sot-ca-chua | bep-sen | 4 | 1.5 | 36 | 48 | 1.33 | 8 |
| nuoc-ep-ca-rot | bep-sen | 4 | 1 | 24 | 32 | 1.33 | 8 |
| thuc-an-gia-suc | coi-xay | 5 | 1 | 58 | 57 | 0.98 | -1 |
| bot-gao | coi-xay | 6 | 2 | 52 | 70 | 1.35 | 9 |
| bap-rang | lo-banh | 8 | 1.5 | 58 | 78 | 1.34 | 13.3 |
| banh-trung | lo-banh | 8 | 4 | 122 | 160 | 1.31 | 9.5 |
| banh-bi-ngo | lo-banh | 8 | 5 | 143 | 190 | 1.33 | 9.4 |
| bo | may-bo-sua | 12 | 3 | 116 | 150 | 1.29 | 11.3 |
| pho-mai | may-bo-sua | 12 | 6 | 174 | 240 | 1.38 | 11 |
| duong | noi-duong | 13 | 3 | 116 | 150 | 1.29 | 11.3 |
| banh-flan | lo-banh | 16 | 6 | 260 | 330 | 1.27 | 11.7 |

Vật nuôi:
| Con | Giá | Chu kỳ (ph) | Sản phẩm | Thức ăn tự làm | Thức ăn mua | Lãi/giờ (tự làm) | Lãi/giờ (mua) | Hoàn vốn (chu kỳ) |
|---|---|---|---|---|---|---|---|---|
| Gà | 60 | 4 | trung-ga 26 | 19.3 | 48 | 100 | -330 | 9 |
| Bò | 180 | 8 | sua 58 | 38.7 | 96 | 145 | -285 | 9.3 |

## 8. Dò đường cong XP (hồ sơ chăm, 3 ngày)
Lưới `a · lv^b`; sai số = Σ log²(thực tế / mục tiêu) trên cấp 4/7/10/20.
| a | b | Tổng XP tới cấp 20 | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Sai số |
|---|---|---|---|---|---|---|---|
| 60 | 2 | 148,200 | 9 ph | 47 ph | 2.0 h | 14.1 h | 0.1 |
| 40 | 2.1 | 128,677 | 8 ph | 30 ph | 1.7 h | 11.9 h | 0.16 |
| 60 | 1.9 | 113,918 | 8 ph | 30 ph | 1.5 h | 10.8 h | 0.22 |
| 40 | 2 | 98,800 | 8 ph | 30 ph | 1.5 h | 9.5 h | 0.23 |
| 50 | 2 | 123,500 | 7 ph | 30 ph | 1.8 h | 11.6 h | 0.23 |
| 50 | 1.9 | 94,932 | 7 ph | 37 ph | 1.5 h | 9.6 h | 0.24 |
| 50 | 2.1 | 160,844 | 7 ph | 45 ph | 2.1 h | 15.4 h | 0.26 |
| 60 | 2.1 | 193,015 | 9 ph | 50 ph | 2.3 h | 17.7 h | 0.31 |
| 40 | 1.9 | 75,944 | 8 ph | 30 ph | 81 ph | 7.4 h | 0.44 |
| 30 | 2.1 | 96,508 | 6 ph | 30 ph | 84 ph | 9.1 h | 0.51 |
| 30 | 2 | 74,100 | 6 ph | 30 ph | 73 ph | 7.3 h | 0.76 |
| 30 | 1.9 | 56,961 | 6 ph | 30 ph | 68 ph | 5.9 h | 1.05 |

Kiểm lại đường cong tốt nhất (60 · lv^2) trên mọi hồ sơ, 7 ngày — cột "+XP cây" thêm gợi ý XP cây (đổi tạm trong bộ nhớ):
| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Cấp cuối | +XP cây: cấp 4 / 7 / 10 / 20 | +XP cây: cấp cuối |
|---|---|---|---|---|---|---|---|
| Chăm | 9 ph · 9 ph | 47 ph · 77 ph | 2.0 h · 4.0 h | 14.1 h · 2.0 ngày | 30 | 8 ph / 44 ph / 2.2 h / 14.1 h | 30 |
| Thỉnh thoảng | 7 ph · 7 ph | 20 ph · 12.0 h | 1.7 h · 3.2 ngày | — | 12 | 8 ph / 20 ph / 80 ph / — | 12 |
| Ngày 2 lần | 5 ph · 12.0 h | 15 ph · 36.0 h | 55 ph · 5.5 ngày | — | 10 | 5 ph / 20 ph / — / — | 9 |

## 9. Gợi ý chỉnh số (CHƯA áp dụng)

1. **core/progression.js — xpNeed (nên chuyển hằng số sang data/levels.js: XP_BASE, XP_EXP)** — từ `Math.round(10 · lv^1,5) (tổng tới cấp 20 ≈ 6 300 XP)` → `Math.round(60 · lv^2) (tổng ≈ 148,200 XP)`.  
   Lý do: Người chơi "chăm" hiện tới cấp 4/7/10/20 sau 3 ph / 10 ph / 21 ph / 1.5 h chơi (mục tiêu 10 ph / 40 ph / 2 h / 10–12 h). XP thu hoạch ≈ 3–4 XP mỗi phút-ô với MỌI cây ⇒ tỉ lệ thuận với số ô; 25+ ô cho 70–100 XP/ph trong khi mục tiêu cần ~10 XP/ph. Với đường cong đề xuất, mô phỏng "chăm" cho 9 ph / 47 ph / 2.0 h / 14.1 h.

2. **core/progression.js — addXp** — từ `không giới hạn` → `dừng ở MAX_LEVEL (data/levels.js), XP thừa dồn vào "danh tiếng" (§3 cấp 20)`.  
   Lý do: Sau 7 ngày: Chăm cấp 110, Thỉnh thoảng cấp 35, Ngày 2 lần cấp 20.

3. **data/buildings.js — levels[].cost của chuồng/nhà kính/đất Đông; data/machines.js upgrades[].cost** — từ `đất phía Đông 3 000 xu; nâng máy 200–2 400` → `×4–6 cho mốc cuối (vd. đất Đông 15 000, Xưởng cấp 2 6 000) hoặc thêm vật phẩm tiêu xu lặp lại (trang trí giá theo bậc, nâng kho 4–5 bằng xu)`.  
   Lý do: "Chăm" mua hết mọi công trình sau 2.4 h chơi rồi tích 883,671 xu không có chỗ tiêu (thu 27,300 xu/giờ chơi). Sửa đường cong XP sẽ dời mốc mở khoá nhưng thu nhập/giờ vẫn ~tuyến tính theo số ô ⇒ cần chỗ tiêu xu dài hạn. Với đường cong đề xuất: "chăm" mở đất phía Đông sau 9.1 h chơi và vẫn kết thúc tuần với 855,972 xu.

4. **data/catalog.js — trung-ga.sell, sua.sell (và ANIMAL_REF); hoặc data/recipes.js thuc-an-gia-suc qty** — từ `trứng 26, sữa 58; 2 ngô → 3 bao thức ăn` → `trứng 32, sữa 72 — hoặc 2 ngô → 4 bao thức ăn`.  
   Lý do: Một con gà lãi 100 xu/giờ, bò 145 xu/giờ (thức ăn tự làm) — kém 1 ô cà chua (420 xu/giờ chưa tưới). Gà 60 xu cần ~9 chu kỳ mới hoàn vốn. Lý do duy nhất để nuôi là nhiệm vụ / bánh. Kiểm lại MARKET.assertEconomy() sau khi đổi (mua thức ăn 48 → bán trứng phải còn lỗ).

5. **data/buildings.js — nha-kinh.levels[0].materials** — từ `{ "van-go": 10 } + 900 xu` → `{ "van-go": 4 } + 900 xu (hoặc tăng MATERIAL_DROP 2 % → 5 % trong core/plots.js)`.  
   Lý do: Ván gỗ chỉ có từ 2 % rơi khi thu hoạch (chia 3 loại ⇒ ~0,7 %), đơn đặc biệt (từ cấp 11, SAU nhà kính) và chợ 120 xu/tấm ⇒ thực tế người chơi phải mua 10 tấm (1 200 xu, đắt hơn chính Nhà kính). Ngày 2 lần đã cấp ≥ 10 nhưng 7 ngày chưa xây được Nhà kính.

6. **data/crops.js — xp** — từ `ca-rot 2, ca-chua 4, dau-tay 6` → `ca-rot 1, ca-chua 2, dau-tay 4 (XP/phút-ô thấp hơn cho cây rất nhanh)`.  
   Lý do: XP mỗi phút-ô hiện gần như phẳng (4 / 4 / 4 / 3.3 / 3.2 / 3 / 2.5) nên cây 30 giây ăn đứt khi đang chơi (thu được nhiều lần). Cấp 4 tới sau 3 ph (mục tiêu ~10). Giảm XP cây rất nhanh tạo đánh đổi "cây nhanh lấy xu / cây dài lấy XP" và làm 10 phút đầu chậm lại (§4: lên cấp 2 ở phút ~5). Mô phỏng (cùng đường cong đề xuất): chăm cấp 4/7/10/20 = 8 ph / 44 ph / 2.2 h / 14.1 h so với 9 ph / 47 ph / 2.0 h / 14.1 h không đổi XP cây ⇒ tác dụng lên tốc độ nhỏ, chủ yếu là đổi cảm giác lựa chọn — ưu tiên thấp.

7. **core/orders.js (orderableProducts + deliver) — lỗi, không phải số** — từ `đơn không đòi trứng/sữa; delivered thiếu items` → `cho trứng/sữa + món làm từ chúng vào bộ sinh đơn khi có vật nuôi; thêm items: { ...order.items } vào sự kiện delivered`.  
   Lý do: Mọi hồ sơ kẹt nhiệm vụ tiến trình M4 ở bước 4/6 (Chăm: 3/6, Thỉnh thoảng: 3/6, Ngày 2 lần: 3/6). Chuỗi Bác Tư bước 3 cũng không thể xong.

## 10. Lỗi luật phát hiện (repro tối thiểu — xem tools/sim/bugs.mjs)
- **CÒN** — addXp() không dừng ở cấp tối đa (MAX_LEVEL = 20) — người chơi chăm lên cấp 100+  
  File: `core/progression.js addXp` · Repro: `const s = { level: 1, xp: 0 }; addXp(s, 1e6, []); s.level // > 20` · Kết quả: level = 144
- **CÒN** — Bộ sinh đơn không bao giờ đòi trứng / sữa, cũng không đòi món cần trứng / sữa (bánh trứng, bánh bí ngô, bơ, phô mai, flan) ⇒ nhiệm vụ M4 "giao-don-trung-sua" không thể xong ⇒ chặn mọi nhiệm vụ tiến trình M4 sau nó (lam-banh-trung, xay-chuong-bo)  
  File: `core/orders.js orderableProducts / orderableCrops` · Repro: `trạng thái cấp 12, có Lò bánh + Máy bơ sữa đã xây, gà, bò: orderableItems(s, now) không chứa trung-ga / sua / banh-trung` · Kết quả: không bao giờ có trong đơn: trung-ga, sua, banh-trung, banh-bi-ngo, bo, pho-mai
- **CÒN** — Sự kiện `delivered` của orders.deliver() thiếu `items` ⇒ nhiệm vụ M4 dùng `hasItem` (giao-don-trung-sua, chuỗi Bác Tư bước 3 "đơn kết hợp có bánh") không bao giờ đếm  
  File: `core/orders.js deliver (events.push delivered)` · Repro: `giao 1 đơn ⇒ events.find(e => e.type === 'delivered').items === undefined` · Kết quả: fields: type, slot, id, orderType, npc, coins, xp, materials, withProduct
- **CÒN** — Nhiệm vụ hướng dẫn chỉ đếm sự kiện khi đang mở ⇒ nâng kho (một lần, mốc sau cần cấp 6 + vật liệu) TRƯỚC khi tới bước "nang-kho" làm sổ nhiệm vụ kẹt; kéo theo cả 5 nhiệm vụ tiến trình M2 (xây Xưởng, làm mứt …) không bao giờ mở  
  File: `core/quests.js track + data/quests.js TUTORIAL (nang-kho)` · Repro: `s.quests.tut = 0; upgradeWarehouse (event warehouseUpgraded) ⇒ hoàn thành các bước trước ⇒ ở bước nang-kho progress = 0 mãi` · Kết quả: sim: hồ sơ "ngày 2 lần" kẹt ở bước này suốt 7 ngày
- **CÒN** — Mía gieo được ở MỌI ô ruộng thường: plots.plant chỉ kiểm cropUnlocked (Nhà kính đã xây), không kiểm ô có thuộc Nhà kính không ⇒ 6 ô nhà kính không còn ý nghĩa (người chơi trồng mía cả 25 ô)  
  File: `core/plots.js plant (chưa có khái niệm ô nhà kính)` · Repro: `s.level = 10; s.buildings['nha-kinh'] = { level: 1, done: true }; plant(s, 12 /* ô ruộng giữa */, 'mia', now) ⇒ ok` · Kết quả: ô ruộng 12 (không phải nhà kính) đang trồng mía
- **CÒN** — Lưới an toàn: stuck() không xét vật nuôi đang làm trứng / sữa (chỉ xét cây + máy) ⇒ có thể tặng hạt dù sắp có hàng bán (nhẹ)  
  File: `core/economy.js stuck` · Repro: `coins 0, ruộng trống, kho trống, 1 gà đang ấp ⇒ stuck(s) === true` · Kết quả: gà đang ấp nhưng vẫn coi là kẹt
- **CÒN** — Hai định dạng bản ghi Xưởng: core/workshop.js coi `buildings.xuong.level` là level ĐANG xây (M2), core/build.js là level ĐÃ XONG (M3). extraSlots() của workshop.js (orders.productUnit dùng) lệch 1 khi đang nâng Xưởng lên cấp 2 theo kiểu M3 — cần chốt một định dạng khi ghép  
  File: `core/workshop.js extraSlots · core/build.js` · Repro: `bản ghi M2 { level: 2, readyAt: tương lai } ⇒ extraSlots = 1 dù chưa xong; bản ghi M3 đang nâng { level: 1, done: false } ⇒ 0 (đúng)` · Kết quả: khác biệt định dạng (đọc code), không đổi số trong mô phỏng
