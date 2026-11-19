# Nông Trại 2.0 — báo cáo mô phỏng cân bằng
Sinh lúc 2026-11-19T16:49:23.900Z · 7 ngày mô phỏng · seed 12345 · chạy 24.0 s · luật thật từ `core/*` + `data/*` (xem README.md về giả định).
Mục tiêu §3 (thời gian **chơi**): cấp 4 ≈ 10 ph · cấp 7 ≈ 40 ph · cấp 10 ≈ 2 h · cấp 20 ≈ 10–12 h.

## Tóm tắt
- **Chăm**: cấp 4 / 7 / 10 / 20 sau 9 ph / 38 ph / 1.9 h / 11.3 h chơi (9 ph / 68 ph / 3.4 h / 32.3 h thật); cuối tuần cấp 20, 249,447 xu.
- **Thỉnh thoảng**: cấp 4 / 7 / 10 / 20 sau 8 ph / 31 ph / 1.7 h / — chơi (8 ph / 24.0 h / 3.2 ngày / — thật); cuối tuần cấp 12, 23,173 xu.
- **Ngày 2 lần**: cấp 4 / 7 / 10 / 20 sau 8 ph / 30 ph / — / — chơi (12.0 h / 2.5 ngày / — / — thật); cuối tuần cấp 9, 1,000 xu.
- Thu nhập: Chăm — đơn 41 %, thô 33 %, thành phẩm 13 %, trứng/sữa 6 %, nhiệm vụ 7 %; Thỉnh thoảng — đơn 37 %, thô 33 %, thành phẩm 15 %, trứng/sữa 5 %, nhiệm vụ 10 %; Ngày 2 lần — đơn 56 %, thô 23 %, thành phẩm 6 %, trứng/sữa 3 %, nhiệm vụ 13 %.
- Vòng lặp lời: không thấy (chợ chặn mua→bán lời; thu nhập/giờ chơi phẳng, không siêu tuyến tính).
- Lỗi luật còn tái hiện: 0 (xem §10).
- Chỗ tiêu xu còn lại cuối tuần (mọi mốc xây / nâng chưa mua, gồm bậc Nhà "danh tiếng" M5): Chăm 631,750 xu · Thỉnh thoảng 1,393,750 xu · Ngày 2 lần 1,405,350 xu.
- Gợi ý ưu tiên: (1) data/crops.js: ca-rot 1, ca-chua 2, dau-tay 4 (XP/phút-ô thấp hơn cho cây rất nhanh).

## Hồ sơ người chơi
| Hồ sơ | Mô tả | Chơi 7 ngày | Cấp cuối | Xu cuối | Tổng xu kiếm |
|---|---|---|---|---|---|
| Chăm | Phiên 30 phút liên tục, nghỉ 30 phút, 8:00–22:00 (14 phiên ≈ 7 giờ/ngày), nhìn màn hình mỗi phút | 49.0 h | 20 | 249,447 | 1,472,626 |
| Thỉnh thoảng | 3 phiên/ngày × 10 phút (8:00, 13:00, 20:00), thao tác mỗi 30 giây khi đang chơi | 3.5 h | 12 | 23,173 | 75,433 |
| Ngày 2 lần | 2 phiên/ngày × 5 phút (8:00, 20:00), gieo cây dài trước khi rời, thao tác mỗi 30 giây | 70 ph | 9 | 1,000 | 20,920 |

## 1. Thời gian tới từng cấp (chơi / thật)

| Cấp | Chăm — chơi | Thỉnh thoảng — chơi | Ngày 2 lần — chơi | Chăm — thật | Thỉnh thoảng — thật | Ngày 2 lần — thật |
|---|---|---|---|---|---|---|
| 1 | 0 ph | 0 ph | 0 ph | 0 ph | 0 ph | 0 ph |
| 2 | 2 ph | 2 ph | 2 ph | 2 ph | 2 ph | 2 ph |
| 3 | 5 ph | 3 ph | 3 ph | 5 ph | 3 ph | 3 ph |
| 4 (mục tiêu 10 ph) | 9 ph | 8 ph | 8 ph | 9 ph | 8 ph | 12.0 h |
| 5 | 16 ph | 13 ph | 13 ph | 16 ph | 5.0 h | 24.1 h |
| 6 | 26 ph | 20 ph | 20 ph | 26 ph | 12.0 h | 2.0 ngày |
| 7 (mục tiêu 40 ph) | 38 ph | 31 ph | 30 ph | 68 ph | 24.0 h | 2.5 ngày |
| 8 | 60 ph | 54 ph | 45 ph | 2.0 h | 36.1 h | 4.5 ngày |
| 9 | 83 ph | 76 ph | 68 ph | 2.4 h | 2.2 ngày | 6.5 ngày |
| 10 (mục tiêu 2.0 h) | 1.9 h | 1.7 h | — | 3.4 h | 3.2 ngày | — |
| 11 | 2.4 h | 2.2 h | — | 4.4 h | 4.0 ngày | — |
| 12 | 3.0 h | 2.8 h | — | 6.0 h | 5.2 ngày | — |
| 13 | 3.7 h | — | — | 7.2 h | — | — |
| 14 | 4.5 h | — | — | 9.1 h | — | — |
| 15 | 5.4 h | — | — | 10.4 h | — | — |
| 16 | 6.5 h | — | — | 13.1 h | — | — |
| 17 | 7.7 h | — | — | 25.1 h | — | — |
| 18 | 8.8 h | — | — | 27.3 h | — | — |
| 19 | 10.0 h | — | — | 30.0 h | — | — |
| 20 (mục tiêu 11.0 h) | 11.3 h | — | — | 32.3 h | — | — |

Tỉ lệ so với mục tiêu (thời gian chơi thực tế ÷ mục tiêu; < 1 = nhanh hơn thiết kế):
| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 |
|---|---|---|---|---|
| Chăm | 0.9× | 0.95× | 0.94× | 1.03× |
| Thỉnh thoảng | 0.8× | 0.76× | 0.83× | chưa tới |
| Ngày 2 lần | 0.75× | 0.74× | chưa tới | chưa tới |

## 2. Đường cong xu / XP (mẫu cuối mỗi phiên)

**Chăm**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 30 ph | 30 | 6 | 2,129 | 8 | 4,747 | 19 | 0 |
| 7.5 h | 240 | 13 | 30,986 | 21,372 | 82,880 | 31 | 14 |
| 24.5 h | 450 | 16 | 62,030 | 44,713 | 167,701 | 34 | 16 |
| 31.5 h | 660 | 19 | 100,738 | 18,820 | 279,254 | 43 | 16 |
| 2.0 ngày | 870 | 20 | 120,750 | 96,040 | 390,770 | 43 | 16 |
| 2.3 ngày | 1080 | 20 | 120,750 | 75,309 | 504,849 | 43 | 16 |
| 3.0 ngày | 1290 | 20 | 120,750 | 149,338 | 611,623 | 43 | 16 |
| 3.3 ngày | 1500 | 20 | 120,750 | 47,676 | 724,887 | 43 | 16 |
| 4.0 ngày | 1710 | 20 | 120,750 | 128,859 | 837,925 | 43 | 16 |
| 4.3 ngày | 1920 | 20 | 120,750 | 205,607 | 946,150 | 43 | 16 |
| 5.0 ngày | 2130 | 20 | 120,750 | 278,054 | 1,051,777 | 43 | 16 |
| 5.3 ngày | 2340 | 20 | 120,750 | 26,970 | 1,161,586 | 43 | 16 |
| 6.0 ngày | 2550 | 20 | 120,750 | 103,101 | 1,269,756 | 43 | 16 |
| 6.3 ngày | 2760 | 20 | 120,750 | 181,997 | 1,381,216 | 43 | 16 |
| 6.6 ngày | 2940 | 20 | 120,750 | 249,447 | 1,472,626 | 43 | 16 |

**Thỉnh thoảng**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 10 ph | 10 | 4 | 848 | 85 | 1,660 | 16 | 0 |
| 5.2 h | 20 | 5 | 1,777 | 204 | 3,754 | 18 | 0 |
| 12.2 h | 30 | 6 | 2,736 | 220 | 6,278 | 20 | 0 |
| 24.2 h | 40 | 7 | 3,895 | 725 | 9,507 | 21 | 6 |
| 29.2 h | 50 | 7 | 4,892 | 1,277 | 11,883 | 22 | 6 |
| 36.2 h | 60 | 8 | 5,844 | 413 | 14,550 | 23 | 6 |
| 2.0 ngày | 70 | 8 | 7,209 | 527 | 17,763 | 23 | 6 |
| 2.2 ngày | 80 | 9 | 8,710 | 754 | 22,197 | 24 | 9 |
| 2.5 ngày | 90 | 9 | 10,249 | 148 | 25,587 | 25 | 10 |
| 3.0 ngày | 100 | 9 | 11,568 | 2,642 | 29,220 | 25 | 10 |
| 3.2 ngày | 110 | 10 | 12,984 | 900 | 33,558 | 31 | 12 |
| 3.5 ngày | 120 | 10 | 14,559 | 4,384 | 38,430 | 31 | 12 |
| 4.0 ngày | 130 | 11 | 16,336 | 6,470 | 41,880 | 31 | 12 |
| 4.2 ngày | 140 | 11 | 18,040 | 11,735 | 48,187 | 31 | 12 |
| 4.5 ngày | 150 | 11 | 19,407 | 13,770 | 51,490 | 31 | 12 |
| 5.0 ngày | 160 | 11 | 20,770 | 17,196 | 55,546 | 31 | 12 |
| 5.2 ngày | 170 | 12 | 22,135 | 11,253 | 58,421 | 31 | 13 |
| 5.5 ngày | 180 | 12 | 23,797 | 13,526 | 62,355 | 31 | 14 |
| 6.0 ngày | 190 | 12 | 25,441 | 17,379 | 67,337 | 31 | 14 |
| 6.2 ngày | 200 | 12 | 26,513 | 20,233 | 71,201 | 31 | 14 |
| 6.5 ngày | 210 | 12 | 28,105 | 23,173 | 75,433 | 31 | 14 |

**Ngày 2 lần**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 5 ph | 5 | 3 | 412 | 76 | 594 | 12 | 0 |
| 12.1 h | 10 | 4 | 800 | 139 | 1,538 | 15 | 0 |
| 24.1 h | 15 | 5 | 1,392 | 102 | 2,958 | 18 | 0 |
| 36.1 h | 20 | 5 | 1,717 | 312 | 3,785 | 18 | 0 |
| 2.0 ngày | 25 | 6 | 2,378 | 235 | 5,116 | 19 | 0 |
| 2.5 ngày | 30 | 7 | 3,110 | 793 | 7,076 | 20 | 0 |
| 3.0 ngày | 35 | 7 | 3,756 | 686 | 8,643 | 21 | 6 |
| 3.5 ngày | 40 | 7 | 4,315 | 391 | 10,335 | 22 | 6 |
| 4.0 ngày | 45 | 7 | 5,019 | 111 | 12,069 | 23 | 6 |
| 4.5 ngày | 50 | 8 | 5,674 | 749 | 13,609 | 23 | 6 |
| 5.0 ngày | 55 | 8 | 6,355 | 1,070 | 15,147 | 23 | 6 |
| 5.5 ngày | 60 | 8 | 7,158 | 35 | 17,227 | 24 | 6 |
| 6.0 ngày | 65 | 8 | 7,791 | 1 | 18,779 | 24 | 6 |
| 6.5 ngày | 70 | 9 | 8,421 | 1,000 | 20,920 | 24 | 6 |

## 3. Nguồn thu (xu)
| Hồ sơ | Bán nông sản thô | Giao đơn | Bán thành phẩm | Bán trứng / sữa | Thưởng nhiệm vụ | Tổng |
|---|---|---|---|---|---|---|
| Chăm | 488,219 (33 %) | 602,206 (41 %) | 188,708 (13 %) | 89,321 (6 %) | 104,172 (7 %) | 1,472,626 |
| Thỉnh thoảng | 24,669 (33 %) | 28,229 (37 %) | 11,321 (15 %) | 4,047 (5 %) | 7,167 (10 %) | 75,433 |
| Ngày 2 lần | 4,714 (23 %) | 11,679 (56 %) | 1,262 (6 %) | 638 (3 %) | 2,627 (13 %) | 20,920 |

XP theo nguồn:
| Hồ sơ | Thu hoạch | Giao đơn | Nhận từ máy | Vật nuôi | Nhiệm vụ M1 | Nhiệm vụ làng |
|---|---|---|---|---|---|---|
| Chăm | 85,843 | 14,849 | 10,493 | 2,701 | 257 | 6,607 |
| Thỉnh thoảng | 19,622 | 3,268 | 2,664 | 593 | 257 | 1,701 |
| Ngày 2 lần | 5,404 | 1,510 | 590 | 94 | 257 | 566 |

Chi tiêu:
| Hồ sơ | Hạt | Ô đất | Công trình | Máy | Nâng máy | Vật nuôi | Vật liệu (chợ) |
|---|---|---|---|---|---|---|---|
| Chăm | 424,383 | 10,350 | 774,190 | 2,450 | 10,150 | 1,680 | 0 |
| Thỉnh thoảng | 23,184 | 10,350 | 12,190 | 1,450 | 3,550 | 1,560 | 0 |
| Ngày 2 lần | 6,549 | 7,645 | 1,190 | 650 | 3,550 | 360 | 0 |

## 4. Lần đầu dùng được tính năng (phút chơi · thời gian thật)

| Tính năng | Chăm | Thỉnh thoảng | Ngày 2 lần |
|---|---|---|---|
| Nhà kho xây xong | 5 ph · 5 ph | 3 ph · 3 ph | 3 ph · 3 ph |
| Xưởng + Bếp sên dùng được | 10 ph · 10 ph | 9 ph · 9 ph | 9 ph · 12.1 h |
| Cối xay bắt đầu xây | 16 ph · 16 ph | 15 ph · 5.1 h | 13 ph · 24.1 h |
| Đơn kết hợp đầu tiên xuất hiện | 18 ph · 18 ph | 13 ph · 5.0 h | 14 ph · 24.1 h |
| Giao đơn kết hợp đầu | 22 ph · 22 ph | 20 ph · 12.0 h | 15 ph · 36.0 h |
| Chuồng gà xây xong | 40 ph · 70 ph | 33 ph · 24.0 h | 30 ph · 3.0 ngày |
| Thu sản phẩm vật nuôi đầu | 45 ph · 75 ph | 37 ph · 24.1 h | 35 ph · 3.0 ngày |
| Lò bánh bắt đầu xây | 60 ph · 2.0 h | 55 ph · 36.1 h | 45 ph · 4.5 ngày |
| Chuồng bò xây xong | 86 ph · 2.4 h | 79 ph · 2.2 ngày | — |
| Nhà kính xây xong | 2.0 h · 3.5 h | 1.8 h · 3.2 ngày | — |
| Đơn đặc biệt đầu tiên | 2.4 h · 4.4 h | 2.2 h · 4.2 ngày | — |
| Giao đơn đặc biệt đầu | 3.6 h · 7.1 h | 2.6 h · 5.0 ngày | — |
| Máy bơ sữa bắt đầu xây | 3.0 h · 6.0 h | 2.8 h · 5.2 ngày | — |
| Nồi đường bắt đầu xây | 3.7 h · 7.2 h | — | — |
| Xưởng cấp 2 | 3.7 h · 7.2 h | — | — |
| Khu đất phía Đông mở | 7.7 h · 25.2 h | — | — |
| Hoàn thành chuỗi NPC đầu | 4.8 h · 9.3 h | — | — |
| Lưới an toàn tặng hạt (lần đầu) | — | — | — |

## 5. Khựng / kẹt
- **Không có gì để làm**: lần nhìn màn hình không có hành động có ích nào (chỉ tưới / chờ); chuỗi > 5 phút chơi được ghi lại.
- **Chờ gom xu**: mục ưu tiên lớn kế tiếp chưa đủ xu / vật liệu liên tục > 5 phút chơi.
- **Kẹt**: kho + giỏ tràn đầy chặn thu hoạch, hoặc ruộng trống mà không đủ xu mua hạt.

| Hồ sơ | Phút chơi rảnh | Chuỗi rảnh > 5 ph | Phút kẹt kho đầy | Phút hết xu | Lưới an toàn tặng hạt | Nhiệm vụ M1 (đã qua / 13) | Tiến trình làng (/6) | Chuỗi NPC (bước) |
|---|---|---|---|---|---|---|---|---|
| Chăm | 0 | 0 | 0 | 10 | 0 | 13 | 6 | chi-ba 3/3, co-hai 3/3, bac-tu 3/3, anh-ut 3/3 |
| Thỉnh thoảng | 9.5 | 0 | 0 | 3 | 0 | 13 | 6 | chi-ba 0/3, co-hai 0/3, bac-tu 0/3, anh-ut 0/3 |
| Ngày 2 lần | 1.5 | 0 | 0 | 1 | 0 | 13 | 5 | chi-ba 0/3, co-hai 0/3, bac-tu 0/3, anh-ut 0/3 |

## 6. Vòng lặp lời vô hạn
- `MARKET.assertEconomy()` (mua ở chợ → chế biến / nuôi → bán): **không có vòng lời** ✔.
- Chăm: xu kiếm mỗi giờ chơi theo ngày 22,156 → 31,651 → 31,268 → 32,421 → 30,478 → 31,593 → 30,808; tăng 0.97× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 17 % tổng xu kiếm được chưa tiêu.
- Thỉnh thoảng: xu kiếm mỗi giờ chơi theo ngày 12,556 → 16,544 → 22,074 → 25,686 → 26,120 → 21,730 → 26,156; tăng 1.58× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 31 % tổng xu kiếm được chưa tiêu.
- Ngày 2 lần: xu kiếm mỗi giờ chơi theo ngày 9,228 → 13,482 → 19,746 → 19,554 → 19,644 → 21,708 → 22,158; tăng 1.64× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 5 % tổng xu kiếm được chưa tiêu.

## 7. Lợi nhuận chuỗi A/B/C theo phút tài nguyên (giá gốc, cây đã tưới)
| Chuỗi | Cách làm | Doanh thu | Hạt | Lãi | Hơn bán thô | Phút-ô | Phút-máy | Phút-vật nuôi | Lãi / phút-ô | Lãi / tổng phút | Thô / phút-ô |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | Dâu → Mứt dâu → bán chợ (giá gốc) | 74 | 24 | 50 | 20 | 3.15 | 2 | 0 | 15.9 | 9.7 | 9.5 |
| A | Dâu → Mứt dâu → đơn thường | 86.9 | 24 | 62.9 | 32.9 | 3.15 | 2 | 0 | 20 | 12.2 | 9.5 |
| A | Dâu → Mứt dâu → đơn kết hợp | 96.2 | 24 | 72.2 | 42.2 | 3.15 | 2 | 0 | 22.9 | 14 | 9.5 |
| B | Ngô → Thức ăn → Gà → Trứng + Lúa → Bột → Bánh trứng → bán chợ (giá gốc) | 175 | 36 | 139 | 84.3 | 8.4 | 6.67 | 8 | 16.5 | 6 | 6.5 |
| B | Ngô → Thức ăn → Gà → Trứng + Lúa → Bột → Bánh trứng → bán chợ giá ↑ (+15 %) | 201.2 | 36 | 165.2 | 110.6 | 8.4 | 6.67 | 8 | 19.7 | 7.2 | 6.5 |
| B | Ngô → Thức ăn → Gà → Trứng + Lúa → Bột → Bánh trứng → đơn kết hợp | 227.5 | 36 | 191.5 | 136.8 | 8.4 | 6.67 | 8 | 22.8 | 8.3 | 6.5 |
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
| banh-trung | lo-banh | 8 | 4 | 134 | 175 | 1.31 | 10.3 |
| banh-bi-ngo | lo-banh | 8 | 5 | 149 | 190 | 1.28 | 8.2 |
| bo | may-bo-sua | 12 | 3 | 144 | 185 | 1.28 | 13.7 |
| pho-mai | may-bo-sua | 12 | 6 | 216 | 280 | 1.3 | 10.7 |
| duong | noi-duong | 13 | 3 | 116 | 150 | 1.29 | 11.3 |
| banh-flan | lo-banh | 16 | 6 | 286 | 370 | 1.29 | 14 |

Vật nuôi:
| Con | Giá | Chu kỳ (ph) | Sản phẩm | Thức ăn tự làm | Thức ăn mua | Lãi/giờ (tự làm) | Lãi/giờ (mua) | Hoàn vốn (chu kỳ) |
|---|---|---|---|---|---|---|---|---|
| Gà | 60 | 4 | trung-ga 32 | 19.3 | 56 | 190 | -360 | 4.7 |
| Bò sữa | 180 | 8 | sua 72 | 38.7 | 112 | 250 | -300 | 5.4 |

## 8. Dò đường cong XP (hồ sơ chăm, 3 ngày)
Lưới `a · lv^b`; sai số = Σ log²(thực tế / mục tiêu) trên cấp 4/7/10/20.
| a | b | Tổng XP tới cấp 20 | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Sai số |
|---|---|---|---|---|---|---|---|
| 40 | 2 | 98,800 | 9 ph | 42 ph | 1.9 h | 10.8 h | 0.02 |
| 50 | 1.9 | 94,932 | 9 ph | 41 ph | 1.8 h | 10.4 h | 0.03 |
| 40 | 2.1 | 128,677 | 9 ph | 43 ph | 2.1 h | 13.3 h | 0.05 |
| 50 | 2 | 123,500 | 10 ph | 45 ph | 2.1 h | 13.2 h | 0.05 |
| 60 | 1.9 | 113,918 | 12 ph | 48 ph | 2.1 h | 12.4 h | 0.08 |
| 30 | 2.1 | 96,508 | 7 ph | 39 ph | 1.7 h | 10.4 h | 0.16 |
| 40 | 1.9 | 75,944 | 8 ph | 38 ph | 1.5 h | 8.5 h | 0.2 |
| 50 | 2.1 | 160,844 | 10 ph | 48 ph | 2.4 h | 16.5 h | 0.23 |
| 60 | 2 | 148,200 | 12 ph | 53 ph | 2.4 h | 15.3 h | 0.26 |
| 30 | 2 | 74,100 | 6 ph | 35 ph | 86 ph | 8.3 h | 0.47 |
| 60 | 2.1 | 193,015 | 13 ph | 57 ph | 2.8 h | 19.1 h | 0.61 |
| 30 | 1.9 | 56,961 | 6 ph | 31 ph | 74 ph | 6.7 h | 0.81 |

Kiểm lại đường cong tốt nhất (40 · lv^2) trên mọi hồ sơ, 7 ngày — cột "+XP cây" thêm gợi ý XP cây (đổi tạm trong bộ nhớ):
| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Cấp cuối | +XP cây: cấp 4 / 7 / 10 / 20 | +XP cây: cấp cuối |
|---|---|---|---|---|---|---|---|
| Chăm | 9 ph · 9 ph | 42 ph · 72 ph | 1.9 h · 3.4 h | 10.8 h · 31.3 h | 20 | 11 ph / 47 ph / 2.0 h / 11.3 h | 20 |
| Thỉnh thoảng | 7 ph · 7 ph | 35 ph · 24.1 h | 1.6 h · 3.0 ngày | — | 13 | 9 ph / 39 ph / 1.7 h / — | 13 |
| Ngày 2 lần | 5 ph · 12.0 h | 33 ph · 3.0 ngày | — | — | 9 | 8 ph / 35 ph / — / — | 8 |

## 9. Gợi ý chỉnh số (CHƯA áp dụng)

1. **data/crops.js — xp** — từ `ca-rot 2, ca-chua 4, dau-tay 6` → `ca-rot 1, ca-chua 2, dau-tay 4 (XP/phút-ô thấp hơn cho cây rất nhanh)`.  
   Lý do: XP mỗi phút-ô gần như phẳng (4 / 4 / 4 / 3.3 / 3.2 / 3 / 2.5) nên cây 30 giây ăn đứt khi đang chơi. Giảm XP cây rất nhanh tạo đánh đổi "cây nhanh lấy xu / cây dài lấy XP". Mô phỏng (đường cong dò được): chăm cấp 4/7/10/20 = 11 ph / 47 ph / 2.0 h / 11.3 h so với 9 ph / 42 ph / 1.9 h / 10.8 h không đổi XP cây — ưu tiên thấp.

## 10. Lỗi luật phát hiện (repro tối thiểu — xem tools/sim/bugs.mjs)
- đã sửa / không tái hiện — addXp() không dừng ở cấp tối đa (MAX_LEVEL = 20) — người chơi chăm lên cấp 100+  
  File: `core/progression.js addXp` · Repro: `const s = { level: 1, xp: 0 }; addXp(s, 1e6, []); s.level // > 20` · Kết quả: level = 20
- đã sửa / không tái hiện — Bộ sinh đơn không bao giờ đòi trứng / sữa, cũng không đòi món cần trứng / sữa (bánh trứng, bánh bí ngô, bơ, phô mai, flan) ⇒ nhiệm vụ M4 "giao-don-trung-sua" không thể xong ⇒ chặn mọi nhiệm vụ tiến trình M4 sau nó (lam-banh-trung, xay-chuong-bo)  
  File: `core/orders.js orderableProducts / orderableCrops` · Repro: `trạng thái cấp 12, có Lò bánh + Máy bơ sữa đã xây, gà, bò: orderableItems(s, now) không chứa trung-ga / sua / banh-trung` · Kết quả: không bao giờ có trong đơn: 
- đã sửa / không tái hiện — Sự kiện `delivered` của orders.deliver() thiếu `items` ⇒ nhiệm vụ M4 dùng `hasItem` (giao-don-trung-sua, chuỗi Bác Tư bước 3 "đơn kết hợp có bánh") không bao giờ đếm  
  File: `core/orders.js deliver (events.push delivered)` · Repro: `giao 1 đơn ⇒ events.find(e => e.type === 'delivered').items === undefined` · Kết quả: fields: type, slot, id, orderType, npc, items, coins, baseCoins, xp, materials, withProduct
- đã sửa / không tái hiện — Nhiệm vụ hướng dẫn chỉ đếm sự kiện khi đang mở ⇒ nâng kho (một lần, mốc sau cần cấp 6 + vật liệu) TRƯỚC khi tới bước "nang-kho" làm sổ nhiệm vụ kẹt; kéo theo cả 5 nhiệm vụ tiến trình M2 (xây Xưởng, làm mứt …) không bao giờ mở  
  File: `core/quests.js track + data/quests.js TUTORIAL (nang-kho)` · Repro: `s.quests.tut = 0; upgradeWarehouse (event warehouseUpgraded) ⇒ hoàn thành các bước trước ⇒ ở bước nang-kho progress = 0 mãi` · Kết quả: sim: hồ sơ "ngày 2 lần" kẹt ở bước này suốt 7 ngày
- đã sửa / không tái hiện — Mía gieo được ở MỌI ô ruộng thường: plots.plant chỉ kiểm cropUnlocked (Nhà kính đã xây), không kiểm ô có thuộc Nhà kính không ⇒ 6 ô nhà kính không còn ý nghĩa (người chơi trồng mía cả 25 ô)  
  File: `core/plots.js plant (chưa có khái niệm ô nhà kính)` · Repro: `s.level = 10; s.buildings['nha-kinh'] = { level: 1, done: true }; plant(s, 12 /* ô ruộng giữa */, 'mia', now) ⇒ ok` · Kết quả: greenhouse-only
- đã sửa / không tái hiện — Lưới an toàn: stuck() không xét vật nuôi đang làm trứng / sữa (chỉ xét cây + máy) ⇒ có thể tặng hạt dù sắp có hàng bán (nhẹ)  
  File: `core/economy.js stuck` · Repro: `coins 0, ruộng trống, kho trống, 1 gà đang ấp ⇒ stuck(s) === true` · Kết quả: gà đang ấp nhưng vẫn coi là kẹt
- đã sửa / không tái hiện — Hai định dạng bản ghi Xưởng: core/workshop.js coi `buildings.xuong.level` là level ĐANG xây (M2), core/build.js là level ĐÃ XONG (M3). extraSlots() của workshop.js (orders.productUnit dùng) lệch 1 khi đang nâng Xưởng lên cấp 2 theo kiểu M3 — cần chốt một định dạng khi ghép  
  File: `core/workshop.js extraSlots · core/build.js` · Repro: `bản ghi M2 { level: 2, readyAt: tương lai } ⇒ extraSlots = 1 dù chưa xong; bản ghi M3 đang nâng { level: 1, done: false } ⇒ 0 (đúng)` · Kết quả: đang nâng ⇒ 0 ô thêm, xong ⇒ 1
