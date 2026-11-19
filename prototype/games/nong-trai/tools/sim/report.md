# Nông Trại 2.0 — báo cáo mô phỏng cân bằng
Sinh lúc 2026-11-19T20:49:26.391Z · 7 ngày mô phỏng · seed 12345 · chạy 69.1 s · luật thật từ `core/*` + `data/*` (xem README.md về giả định).
Mục tiêu §3 (thời gian **chơi**): cấp 4 ≈ 10 ph · cấp 7 ≈ 40 ph · cấp 10 ≈ 2 h · cấp 20 ≈ 10–12 h.

## Tóm tắt
- **Chăm**: cấp 4 / 7 / 10 / 20 sau 9 ph / 39 ph / 1.8 h / 11.5 h chơi (9 ph / 69 ph / 3.3 h / 33.0 h thật); cuối tuần cấp 20, 258,480 xu.
- **Thỉnh thoảng**: cấp 4 / 7 / 10 / 20 sau 8 ph / 30 ph / 1.6 h / — chơi (8 ph / 24.0 h / 3.0 ngày / — thật); cuối tuần cấp 13, 21,640 xu.
- **Ngày 2 lần**: cấp 4 / 7 / 10 / 20 sau 8 ph / 30 ph / — / — chơi (12.0 h / 3.0 ngày / — / — thật); cuối tuần cấp 9, 2,124 xu.
- Thu nhập: Chăm — đơn 35 %, thô 34 %, thành phẩm 17 %, trứng/sữa 6 %, nhiệm vụ 8 %; Thỉnh thoảng — đơn 38 %, thô 32 %, thành phẩm 10 %, trứng/sữa 5 %, nhiệm vụ 15 %; Ngày 2 lần — đơn 58 %, thô 20 %, thành phẩm 2 %, trứng/sữa 3 %, nhiệm vụ 17 %.
- Vòng lặp lời: không thấy (chợ chặn mua→bán lời; thu nhập/giờ chơi phẳng, không siêu tuyến tính).
- Lỗi luật còn tái hiện: 0 (xem §10).
- Chỗ tiêu xu còn lại cuối tuần (mọi mốc xây / nâng chưa mua, gồm bậc Nhà "danh tiếng" M5): Chăm 628,150 xu · Thỉnh thoảng 1,393,750 xu · Ngày 2 lần 1,410,750 xu.
- Gợi ý ưu tiên: không có — các mốc §3 nằm trong khoảng mục tiêu, xu cuối tuần ít hơn chỗ tiêu còn lại; hai gợi ý cũ của M5 đã xét ở §11 (không áp dụng).
- Milestone 6: xem §11 (sổ sưu tập, phiên chợ, đơn đặc biệt hai lúc, so sánh M5 → M6).

## Hồ sơ người chơi
| Hồ sơ | Mô tả | Chơi 7 ngày | Cấp cuối | Xu cuối | Tổng xu kiếm |
|---|---|---|---|---|---|
| Chăm | Phiên 30 phút liên tục, nghỉ 30 phút, 8:00–22:00 (14 phiên ≈ 7 giờ/ngày), nhìn màn hình mỗi phút | 49.0 h | 20 | 258,480 | 1,497,201 |
| Thỉnh thoảng | 3 phiên/ngày × 10 phút (8:00, 13:00, 20:00), thao tác mỗi 30 giây khi đang chơi | 3.5 h | 13 | 21,640 | 82,328 |
| Ngày 2 lần | 2 phiên/ngày × 5 phút (8:00, 20:00), gieo cây dài trước khi rời, thao tác mỗi 30 giây | 70 ph | 9 | 2,124 | 21,634 |

## 1. Thời gian tới từng cấp (chơi / thật)

| Cấp | Chăm — chơi | Thỉnh thoảng — chơi | Ngày 2 lần — chơi | Chăm — thật | Thỉnh thoảng — thật | Ngày 2 lần — thật |
|---|---|---|---|---|---|---|
| 1 | 0 ph | 0 ph | 0 ph | 0 ph | 0 ph | 0 ph |
| 2 | 2 ph | 2 ph | 2 ph | 2 ph | 2 ph | 2 ph |
| 3 | 5 ph | 3 ph | 3 ph | 5 ph | 3 ph | 3 ph |
| 4 (mục tiêu 10 ph) | 9 ph | 8 ph | 8 ph | 9 ph | 8 ph | 12.0 h |
| 5 | 16 ph | 13 ph | 13 ph | 16 ph | 5.0 h | 24.1 h |
| 6 | 27 ph | 20 ph | 20 ph | 27 ph | 12.0 h | 2.0 ngày |
| 7 (mục tiêu 40 ph) | 39 ph | 30 ph | 30 ph | 69 ph | 24.0 h | 3.0 ngày |
| 8 | 57 ph | 49 ph | 48 ph | 87 ph | 29.1 h | 4.5 ngày |
| 9 | 79 ph | 70 ph | 65 ph | 2.3 h | 2.2 ngày | 6.5 ngày |
| 10 (mục tiêu 2.0 h) | 1.8 h | 1.6 h | — | 3.3 h | 3.0 ngày | — |
| 11 | 2.3 h | 2.1 h | — | 4.3 h | 4.0 ngày | — |
| 12 | 2.9 h | 2.7 h | — | 5.4 h | 5.2 ngày | — |
| 13 | 3.6 h | 3.4 h | — | 7.1 h | 6.5 ngày | — |
| 14 | 4.5 h | — | — | 9.0 h | — | — |
| 15 | 5.4 h | — | — | 10.4 h | — | — |
| 16 | 6.5 h | — | — | 12.4 h | — | — |
| 17 | 7.6 h | — | — | 25.1 h | — | — |
| 18 | 8.7 h | — | — | 27.2 h | — | — |
| 19 | 10.0 h | — | — | 30.0 h | — | — |
| 20 (mục tiêu 11.0 h) | 11.5 h | — | — | 33.0 h | — | — |

Tỉ lệ so với mục tiêu (thời gian chơi thực tế ÷ mục tiêu; < 1 = nhanh hơn thiết kế):
| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 |
|---|---|---|---|---|
| Chăm | 0.9× | 0.98× | 0.91× | 1.05× |
| Thỉnh thoảng | 0.8× | 0.75× | 0.81× | chưa tới |
| Ngày 2 lần | 0.75× | 0.75× | chưa tới | chưa tới |

## 2. Đường cong xu / XP (mẫu cuối mỗi phiên)

**Chăm**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 30 ph | 30 | 6 | 2,163 | 126 | 5,569 | 20 | 0 |
| 7.5 h | 240 | 13 | 31,257 | 26,593 | 88,540 | 31 | 14 |
| 24.5 h | 450 | 16 | 62,813 | 46,576 | 178,439 | 34 | 16 |
| 31.5 h | 660 | 19 | 98,052 | 29,134 | 294,175 | 43 | 16 |
| 2.0 ngày | 870 | 20 | 120,750 | 4,616 | 406,024 | 43 | 16 |
| 2.3 ngày | 1080 | 20 | 120,750 | 82,479 | 517,507 | 43 | 16 |
| 3.0 ngày | 1290 | 20 | 120,750 | 159,046 | 626,732 | 43 | 16 |
| 3.3 ngày | 1500 | 20 | 120,750 | 55,167 | 741,935 | 43 | 16 |
| 4.0 ngày | 1710 | 20 | 120,750 | 133,737 | 852,341 | 43 | 16 |
| 4.3 ngày | 1920 | 20 | 120,750 | 212,705 | 965,049 | 43 | 16 |
| 5.0 ngày | 2130 | 20 | 120,750 | 289,083 | 1,071,627 | 43 | 16 |
| 5.3 ngày | 2340 | 20 | 120,750 | 37,262 | 1,181,172 | 43 | 16 |
| 6.0 ngày | 2550 | 20 | 120,750 | 113,149 | 1,289,450 | 43 | 16 |
| 6.3 ngày | 2760 | 20 | 120,750 | 191,582 | 1,403,588 | 43 | 16 |
| 6.6 ngày | 2940 | 20 | 120,750 | 258,480 | 1,497,201 | 43 | 16 |

**Thỉnh thoảng**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 10 ph | 10 | 4 | 848 | 85 | 1,660 | 16 | 0 |
| 5.2 h | 20 | 5 | 1,837 | 0 | 4,694 | 20 | 0 |
| 12.2 h | 30 | 6 | 2,952 | 813 | 7,835 | 21 | 0 |
| 24.2 h | 40 | 7 | 4,250 | 1,271 | 11,122 | 22 | 6 |
| 29.2 h | 50 | 8 | 5,404 | 718 | 13,715 | 23 | 6 |
| 36.2 h | 60 | 8 | 6,715 | 558 | 17,397 | 24 | 6 |
| 2.0 ngày | 70 | 8 | 8,052 | 943 | 20,681 | 24 | 6 |
| 2.2 ngày | 80 | 9 | 9,352 | 297 | 24,914 | 25 | 10 |
| 2.5 ngày | 90 | 9 | 10,578 | 1,343 | 27,261 | 25 | 10 |
| 3.0 ngày | 100 | 10 | 12,059 | 3,713 | 35,397 | 25 | 12 |
| 3.2 ngày | 110 | 10 | 13,607 | 6,973 | 39,903 | 31 | 12 |
| 3.5 ngày | 120 | 10 | 15,033 | 9,542 | 43,773 | 31 | 12 |
| 4.0 ngày | 130 | 11 | 16,743 | 12,172 | 47,742 | 31 | 12 |
| 4.2 ngày | 140 | 11 | 18,303 | 15,451 | 52,383 | 31 | 12 |
| 4.5 ngày | 150 | 11 | 19,879 | 18,398 | 56,500 | 31 | 12 |
| 5.0 ngày | 160 | 11 | 21,185 | 21,119 | 60,459 | 31 | 12 |
| 5.2 ngày | 170 | 12 | 22,925 | 17,234 | 65,561 | 31 | 14 |
| 5.5 ngày | 180 | 12 | 24,517 | 19,952 | 69,584 | 31 | 14 |
| 6.0 ngày | 190 | 12 | 26,027 | 24,118 | 74,905 | 31 | 14 |
| 6.2 ngày | 200 | 12 | 27,521 | 26,711 | 78,862 | 31 | 14 |
| 6.5 ngày | 210 | 13 | 29,131 | 21,640 | 82,328 | 31 | 14 |

**Ngày 2 lần**
| Giờ thật | Phút chơi | Cấp | Tổng XP | Xu đang có | Tổng xu kiếm | Ô đất | Vật nuôi |
|---|---|---|---|---|---|---|---|
| 5 ph | 5 | 3 | 412 | 76 | 594 | 12 | 0 |
| 12.1 h | 10 | 4 | 800 | 139 | 1,538 | 15 | 0 |
| 24.1 h | 15 | 5 | 1,392 | 102 | 2,958 | 18 | 0 |
| 36.1 h | 20 | 5 | 1,717 | 52 | 4,585 | 20 | 0 |
| 2.0 ngày | 25 | 6 | 2,301 | 609 | 6,037 | 20 | 0 |
| 2.5 ngày | 30 | 6 | 2,951 | 78 | 7,844 | 22 | 0 |
| 3.0 ngày | 35 | 7 | 3,460 | 86 | 9,241 | 22 | 5 |
| 3.5 ngày | 40 | 7 | 4,122 | 444 | 10,947 | 22 | 6 |
| 4.0 ngày | 45 | 7 | 4,810 | 262 | 12,763 | 23 | 6 |
| 4.5 ngày | 50 | 8 | 5,510 | 1,204 | 14,645 | 23 | 6 |
| 5.0 ngày | 55 | 8 | 6,167 | 179 | 16,145 | 24 | 6 |
| 5.5 ngày | 60 | 8 | 7,000 | 1,949 | 18,447 | 24 | 6 |
| 6.0 ngày | 65 | 8 | 7,818 | 2,675 | 20,315 | 24 | 6 |
| 6.5 ngày | 70 | 9 | 8,515 | 2,124 | 21,634 | 24 | 10 |

## 3. Nguồn thu (xu)
| Hồ sơ | Bán nông sản thô | Giao đơn | Bán thành phẩm | Bán trứng / sữa | Thưởng nhiệm vụ | Tổng |
|---|---|---|---|---|---|---|
| Chăm | 515,506 (34 %) | 519,408 (35 %) | 248,540 (17 %) | 92,160 (6 %) | 121,587 (8 %) | 1,497,201 |
| Thỉnh thoảng | 26,193 (32 %) | 31,134 (38 %) | 8,588 (10 %) | 4,391 (5 %) | 12,022 (15 %) | 82,328 |
| Ngày 2 lần | 4,248 (20 %) | 12,649 (58 %) | 489 (2 %) | 576 (3 %) | 3,672 (17 %) | 21,634 |

XP theo nguồn:
| Hồ sơ | Thu hoạch | Giao đơn | Nhận từ máy | Vật nuôi | Nhiệm vụ M1 | Nhiệm vụ làng |
|---|---|---|---|---|---|---|
| Chăm | 86,040 | 13,086 | 11,439 | 2,883 | 257 | 7,045 |
| Thỉnh thoảng | 20,462 | 3,661 | 2,475 | 568 | 257 | 1,708 |
| Ngày 2 lần | 5,400 | 1,551 | 596 | 86 | 257 | 625 |

Chi tiêu:
| Hồ sơ | Hạt | Ô đất | Công trình | Máy | Nâng máy | Vật nuôi | Vật liệu (chợ) |
|---|---|---|---|---|---|---|---|
| Chăm | 430,325 | 10,350 | 783,790 | 2,450 | 10,150 | 1,680 | 0 |
| Thỉnh thoảng | 24,612 | 10,350 | 18,190 | 2,450 | 3,550 | 1,560 | 0 |
| Ngày 2 lần | 6,619 | 7,645 | 1,190 | 650 | 2,350 | 1,080 | 0 |

## 4. Lần đầu dùng được tính năng (phút chơi · thời gian thật)

| Tính năng | Chăm | Thỉnh thoảng | Ngày 2 lần |
|---|---|---|---|
| Nhà kho xây xong | 5 ph · 5 ph | 3 ph · 3 ph | 3 ph · 3 ph |
| Xưởng + Bếp sên dùng được | 10 ph · 10 ph | 9 ph · 9 ph | 9 ph · 12.1 h |
| Cối xay bắt đầu xây | 16 ph · 16 ph | 13 ph · 5.0 h | 13 ph · 24.1 h |
| Đơn kết hợp đầu tiên xuất hiện | 18 ph · 18 ph | 13 ph · 5.0 h | 14 ph · 24.1 h |
| Giao đơn kết hợp đầu | 27 ph · 27 ph | 20 ph · 12.0 h | 15 ph · 36.0 h |
| Chuồng gà xây xong | 41 ph · 71 ph | 32 ph · 24.0 h | 32 ph · 3.0 ngày |
| Thu sản phẩm vật nuôi đầu | 46 ph · 76 ph | 40 ph · 29.0 h | 35 ph · 3.5 ngày |
| Lò bánh bắt đầu xây | 57 ph · 87 ph | 49 ph · 29.1 h | 48 ph · 4.5 ngày |
| Chuồng bò xây xong | 82 ph · 2.4 h | 74 ph · 2.2 ngày | 68 ph · 6.5 ngày |
| Nhà kính xây xong | 1.9 h · 3.4 h | 1.7 h · 3.2 ngày | — |
| Đơn đặc biệt đầu tiên | 2.3 h · 4.3 h | 2.1 h · 4.0 ngày | — |
| Giao đơn đặc biệt đầu | 9.2 h · 28.2 h | — | — |
| Máy bơ sữa bắt đầu xây | 2.9 h · 5.4 h | 2.7 h · 5.2 ngày | — |
| Nồi đường bắt đầu xây | 3.6 h · 7.1 h | 3.4 h · 6.5 ngày | — |
| Xưởng cấp 2 | 3.6 h · 7.1 h | 3.4 h · 6.5 ngày | — |
| Khu đất phía Đông mở | 7.7 h · 25.1 h | — | — |
| Hoàn thành chuỗi NPC đầu | 4.9 h · 9.4 h | — | — |
| Lưới an toàn tặng hạt (lần đầu) | — | — | — |

## 5. Khựng / kẹt
- **Không có gì để làm**: lần nhìn màn hình không có hành động có ích nào (chỉ tưới / chờ); chuỗi > 5 phút chơi được ghi lại.
- **Chờ gom xu**: mục ưu tiên lớn kế tiếp chưa đủ xu / vật liệu liên tục > 5 phút chơi.
- **Kẹt**: kho + giỏ tràn đầy chặn thu hoạch, hoặc ruộng trống mà không đủ xu mua hạt.

| Hồ sơ | Phút chơi rảnh | Chuỗi rảnh > 5 ph | Phút kẹt kho đầy | Phút hết xu | Lưới an toàn tặng hạt | Nhiệm vụ M1 (đã qua / 13) | Tiến trình làng (/6) | Chuỗi NPC (bước) |
|---|---|---|---|---|---|---|---|---|
| Chăm | 0 | 0 | 0 | 1 | 0 | 13 | 6 | chi-ba 3/3, co-hai 3/3, bac-tu 3/3, anh-ut 3/3 |
| Thỉnh thoảng | 9.5 | 0 | 0 | 0.5 | 0 | 13 | 6 | chi-ba 0/3, co-hai 0/3, bac-tu 0/3, anh-ut 0/3 |
| Ngày 2 lần | 0 | 0 | 0 | 0.5 | 0 | 13 | 6 | chi-ba 0/3, co-hai 0/3, bac-tu 0/3, anh-ut 0/3 |

## 6. Vòng lặp lời vô hạn
- `MARKET.assertEconomy()` (mua ở chợ → chế biến / nuôi → bán): **không có vòng lời** ✔.
- Chăm: xu kiếm mỗi giờ chơi theo ngày 23,619 → 32,148 → 31,526 → 31,875 → 31,904 → 30,978 → 31,837; tăng 0.99× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 17 % tổng xu kiếm được chưa tiêu.
- Thỉnh thoảng: xu kiếm mỗi giờ chơi theo ngày 15,670 → 19,124 → 19,728 → 33,024 → 25,454 → 26,168 → 25,488; tăng 1.33× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 26 % tổng xu kiếm được chưa tiêu.
- Ngày 2 lần: xu kiếm mỗi giờ chơi theo ngày 9,228 → 18,282 → 19,554 → 18,618 → 22,188 → 22,812 → 19,122; tăng 1.05× (ngày 2 → cuối) ⇒ tuyến tính / bão hoà (không vòng lặp); giữ 10 % tổng xu kiếm được chưa tiêu.

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
| banh-ngo | lo-banh | 9 | 3 | 119 | 155 | 1.3 | 12 |
| sinh-to-dau | may-bo-sua | 12 | 3 | 126 | 165 | 1.31 | 13 |
| bap-rang-bo | lo-banh | 13 | 5 | 243 | 315 | 1.3 | 14.4 |
| che-bi-ngo | noi-duong | 14 | 5 | 197 | 255 | 1.29 | 11.6 |
| sua-chua | may-bo-sua | 15 | 6 | 294 | 380 | 1.29 | 14.3 |
| banh-gao | lo-banh | 17 | 6 | 290 | 375 | 1.29 | 14.2 |

Vật nuôi:
| Con | Giá | Chu kỳ (ph) | Sản phẩm | Thức ăn tự làm | Thức ăn mua | Lãi/giờ (tự làm) | Lãi/giờ (mua) | Hoàn vốn (chu kỳ) |
|---|---|---|---|---|---|---|---|---|
| Gà | 60 | 4 | trung-ga 32 | 19.3 | 72 | 190 | -600 | 4.7 |
| Bò sữa | 180 | 8 | sua 72 | 38.7 | 144 | 250 | -540 | 5.4 |

## 8. Dò đường cong XP (hồ sơ chăm, 3 ngày)
Lưới `a · lv^b`; sai số = Σ log²(thực tế / mục tiêu) trên cấp 4/7/10/20.
| a | b | Tổng XP tới cấp 20 | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Sai số |
|---|---|---|---|---|---|---|---|
| 40 | 2 | 98,800 | 9 ph | 41 ph | 1.8 h | 11.1 h | 0.02 |
| 50 | 1.9 | 94,932 | 9 ph | 42 ph | 1.8 h | 10.5 h | 0.03 |
| 50 | 2 | 123,500 | 10 ph | 46 ph | 2.2 h | 13.1 h | 0.06 |
| 40 | 2.1 | 128,677 | 9 ph | 44 ph | 2.1 h | 13.6 h | 0.07 |
| 60 | 1.9 | 113,918 | 12 ph | 49 ph | 2.2 h | 12.2 h | 0.09 |
| 40 | 1.9 | 75,944 | 8 ph | 38 ph | 1.6 h | 8.4 h | 0.18 |
| 30 | 2.1 | 96,508 | 7 ph | 36 ph | 1.6 h | 10.2 h | 0.19 |
| 50 | 2.1 | 160,844 | 10 ph | 50 ph | 2.3 h | 16.4 h | 0.23 |
| 60 | 2 | 148,200 | 12 ph | 53 ph | 2.4 h | 15.3 h | 0.25 |
| 30 | 2 | 74,100 | 6 ph | 37 ph | 86 ph | 8.2 h | 0.46 |
| 60 | 2.1 | 193,015 | 13 ph | 55 ph | 2.6 h | 19.2 h | 0.56 |
| 30 | 1.9 | 56,961 | 6 ph | 30 ph | 73 ph | 6.5 h | 0.86 |

Kiểm lại đường cong tốt nhất (40 · lv^2) trên mọi hồ sơ, 7 ngày — cột "+XP cây" thêm gợi ý XP cây (đổi tạm trong bộ nhớ):
| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Cấp cuối | +XP cây: cấp 4 / 7 / 10 / 20 | +XP cây: cấp cuối |
|---|---|---|---|---|---|---|---|
| Chăm | 9 ph · 9 ph | 41 ph · 71 ph | 1.8 h · 3.3 h | 11.1 h · 32.1 h | 20 | 11 ph / 47 ph / 2.0 h / 10.9 h | 20 |
| Thỉnh thoảng | 7 ph · 7 ph | 32 ph · 24.0 h | 1.6 h · 3.0 ngày | — | 13 | 9 ph / 40 ph / 1.8 h / — | 13 |
| Ngày 2 lần | 5 ph · 12.0 h | 30 ph · 3.0 ngày | — | — | 9 | 8 ph / 39 ph / — / — | 8 |

## 9. Gợi ý chỉnh số (CHƯA áp dụng)

1. **data/crops.js — xp** — từ `ca-rot 2, ca-chua 4, dau-tay 6` → `ca-rot 1, ca-chua 2, dau-tay 4 (XP/phút-ô thấp hơn cho cây rất nhanh)`. **(M6: đã xét, không áp dụng — xem §11)**  
   Lý do: XP mỗi phút-ô gần như phẳng (4 / 4 / 4 / 3.3 / 3.2 / 3 / 2.5) nên cây 30 giây ăn đứt khi đang chơi. Giảm XP cây rất nhanh tạo đánh đổi "cây nhanh lấy xu / cây dài lấy XP". Mô phỏng (đường cong dò được): chăm cấp 4/7/10/20 = 11 ph / 47 ph / 2.0 h / 10.9 h so với 9 ph / 41 ph / 1.8 h / 11.1 h không đổi XP cây — ưu tiên thấp.

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

## 11. Milestone 6 — sổ sưu tập, phiên chợ, đơn đặc biệt hai lúc, 6 công thức mới
Thay đổi kinh tế M6: 6 công thức mới (Bánh ngô, Sinh tố dâu, Bắp rang bơ, Chè bí ngô, Sữa chua, Bánh gạo — ×1,29–1,31, 12–14,5 xu cộng thêm / phút-máy); thưởng Sổ sưu tập 10 / 20 / 30 món (800 + 4 000 + 15 000 xu, vật liệu, trang trí); Phiên chợ 30 ph / ngày từ cấp 18 (thành phẩm ×1,25, 3 hàng săn ×1,5 cho 10 món đầu); đơn đặc biệt thứ hai từ cấp 18; hàng rào đá 6 000 xu (cấp 15); thức ăn mua ở chợ 56 → 72 xu (giữ MARKET.assertEconomy khi có giá phiên chợ).
| Hồ sơ | M5: cấp 4 / 7 / 10 / 20 (ph chơi) | M6: cấp 4 / 7 / 10 / 20 | M5: cấp · xu cuối | M6: cấp · xu cuối | Sổ (món · mốc nhận) · giờ chơi tới mốc 10/20/30 | Xu thêm nhờ phiên chợ | Giao đơn đặc biệt |
|---|---|---|---|---|---|---|---|
| Chăm | 9 ph / 38 ph / 1.9 h / 11.3 h | 9 ph / 39 ph / 1.8 h / 11.5 h | 20 · 249,447 | 20 · 258,480 | 30/30 · 3/3 · 0.3 h / 2.3 h / 8.5 h | 1,408 | 20 |
| Thỉnh thoảng | 8 ph / 31 ph / 1.7 h / — | 8 ph / 30 ph / 1.6 h / — | 12 · 23,173 | 13 · 21,640 | 21/30 · 2/3 · 0.2 h / 1.6 h / — | 0 | 0 |
| Ngày 2 lần | 8 ph / 30 ph / — / — | 8 ph / 30 ph / — / — | 9 · 1,000 | 9 · 2,124 | 17/30 · 1/3 · 0.3 h / — / — | 0 | 0 |

Hai gợi ý còn treo từ M5 — chạy thử 7 ngày, cùng seed (đổi tạm trong bộ nhớ):
| Hồ sơ | Hiện tại: cấp 4 / 7 / 10 / 20 · cấp · xu | XP cây nhanh 1 / 2 / 4 | 2 ngô → 4 bao thức ăn |
|---|---|---|---|
| Chăm | 9 ph / 39 ph / 1.8 h / 11.5 h · cấp 20 · 258,480 xu · rảnh 0.0 ph · trứng/sữa 92,160 | 12 ph / 41 ph / 2.0 h / 11.5 h · cấp 20 · 293,743 xu · rảnh 6 ph · trứng/sữa 67,443 | 9 ph / 39 ph / 1.9 h / 11.2 h · cấp 20 · 374,141 xu · rảnh 0 ph · trứng/sữa 97,241 |
| Thỉnh thoảng | 8 ph / 30 ph / 1.6 h / — · cấp 13 · 21,640 xu · rảnh 9.5 ph · trứng/sữa 4,391 | 10 ph / 36 ph / 1.7 h / — · cấp 13 · 24,284 xu · rảnh 15.5 ph · trứng/sữa 3,918 | 8 ph / 30 ph / 1.6 h / — · cấp 13 · 27,583 xu · rảnh 6.5 ph · trứng/sữa 4,139 |
| Ngày 2 lần | 8 ph / 30 ph / — / — · cấp 9 · 2,124 xu · rảnh 0.0 ph · trứng/sữa 576 | 9 ph / 35 ph / — / — · cấp 8 · 2,229 xu · rảnh 4 ph · trứng/sữa 1,319 | 8 ph / 30 ph / — / — · cấp 9 · 1,741 xu · rảnh 0 ph · trứng/sữa 1,086 |
**Quyết định M6: không áp dụng cả hai.**
- *Giảm XP cây nhanh (cà rốt 1, cà chua 2, dâu 4)*: làm chậm đúng nhóm đang yếu nhất ("ngày 2 lần" kết tuần thấp hơn một cấp, "chăm" có phút rảnh trở lại vì phải gieo cây dài hơn), trong khi "chăm" vốn đã nằm giữa khoảng mục tiêu §3. Đánh đổi "cây nhanh / cây dài" đã có sẵn ở chỗ khác: cây nhanh cần chạm mỗi 30–60 giây, khi rời máy thì cây dài thắng (bộ mô phỏng tự gieo cây dài trước khi rời). Không đáng để đổi một con số người chơi đã quen.
- *Gà / bò lãi mỗi giờ thấp hơn một ô cà chua*: so sánh theo giờ-tài-sản không công bằng — đàn bị chặn ở 10 gà + 6 bò và không chiếm ô ruộng, nên mọi đồng từ đàn là thu nhập CỘNG THÊM; tính theo chạm, một lượt "cho ăn tất cả + thu tất cả" (2 chạm) cho cả chuồng lãi hơn hẳn 2 chạm trên ruộng. Tăng giá trứng / sữa phá luật chế biến ×1,25 (bánh trứng, bơ, phô mai…); còn 2 ngô → 4 bao (thử ở bảng trên) gần như không đổi phần thu từ trứng / sữa nhưng đẩy xu cuối tuần của "chăm" lên mạnh — ngược mục tiêu M5 (không dư xu). Trứng / sữa còn là đầu vào của 9 / 18 thành phẩm (4 trong 6 công thức M6 mới), đó mới là giá trị chính của vật nuôi.
- Thưởng mới của M6 (sổ sưu tập + phiên chợ) không làm lệch nhịp lên cấp (thưởng sổ không có XP) và xu cuối tuần vẫn dưới chỗ tiêu còn lại ⇒ không cần chỉnh đường XP hay giá.
