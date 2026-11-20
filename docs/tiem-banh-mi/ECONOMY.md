# Economy và tiến trình · Tiệm Bánh Mì

Đơn vị **k** = 1.000 đồng ảo. Số liệu là bản thiết kế M0. **Bộ mô phỏng M5** (`prototype/games/tiem-banh-mi/tools/sim/`, chép khung Trà Sữa: 3 hồ sơ chăm / trung bình / ẩu, báo cáo `report.md`, test hồi quy) sẽ kiểm và chỉnh lại mọi con số ở đây; bảng nào đổi thì ghi lý do vào mục "Cân bằng M5" cuối file như Trà Sữa.

## 1. Nguyên liệu

Giá một **phần** (một ổ dùng một phần). "Kho" = có tính vào sức chứa không.

| id | Nguyên liệu | Giá/phần | Gói Bà Tư (cấp 1) | Gói Chị Mai (cấp 9, rẻ 10%, gói gấp đôi, chỉ giao trước ca) | Hạn | Kho |
|---|---|---:|---|---|---|:-:|
| `phoi` | Phôi bánh (bột đã ủ) | 2 | 12 phôi · 24k | 24 phôi · 43k | 2 ngày | ✓ |
| `banh-si` | Bánh sỉ nướng sẵn (giòn tối đa 80) | 3 | — | 10 ổ · 30k (giao gấp trong ca 40k) | trong ngày | ✓ |
| `phoi-que` | Phôi bánh mì que | 0,6 | 20 que · 12k | 40 que · 22k | 2 ngày | ✓ (20 que = 4 phần) |
| `pate` | Pate | 2 | hũ 10 · 20k | hũ 20 · 36k | 7 ngày | ✓ |
| `bo` | Bơ | 1 | hũ 10 · 10k | 20 · 18k | 7 ngày | ✓ |
| `mayo` | Mayo (sốt trứng) | 1 | chai 10 · 10k | 20 · 18k | 7 ngày | ✓ |
| `cha-lua` | Chả lụa | 4 | cây 8 · 32k | 16 · 58k | 2 ngày | ✓ |
| `thit-nguoi` | Thịt nguội | 5 | 8 · 40k | 16 · 72k | 2 ngày | ✓ |
| `xiu-mai` | Xíu mại (cần nồi) | 5 | nồi 10 · 50k | 20 · 90k | 2 ngày | ✓ |
| `trung` | Trứng (chiên theo đơn, cần chảo) | 3 | vỉ 10 · 30k | 20 · 54k | 7 ngày | ✓ |
| `thit-nuong` | Thịt nướng sống (nướng theo mẻ xiên) | 6 | 10 · 60k | 20 · 108k | trong ngày khi đã nướng; sống 2 ngày | ✓ |
| `heo-quay` | Heo quay | 7 | 8 · 56k | 16 · 100k | trong ngày | ✓ |
| `ga-xe` | Gà xé | 5 | 8 · 40k | 16 · 72k | 2 ngày | ✓ |
| `cha-chay` | Chả chay / đậu hũ | 3 | 8 · 24k | 16 · 43k | 2 ngày | ✓ |
| `cha-bong` | Chà bông | 2 | hũ 10 · 20k | 20 · 36k | 7 ngày | ✓ |
| `do-chua` | Đồ chua (cà rốt, củ cải) | 1 | hũ 15 · 15k | 30 · 27k | 3 ngày (ngày 3 "chua hơn") | ✓ |
| `dua-leo` | Dưa leo | 1 | 15 · 15k | 30 · 27k | trong ngày | ✓ |
| `rau` | Rau thơm (rau mùi + hành lá, hai bước riêng, một phần chung) | 1 | bó 15 · 15k | 30 · 27k | trong ngày | ✓ |
| `gia-vi` | Gia vị (ớt, nước tương, tương ớt) | 1 | bộ 30 · 30k | 60 · 54k | 14 ngày | — |
| `giay-goi` | Giấy gói | 1 | xấp 30 · 30k | 60 · 54k | — | — |
| `tui` | Túi (một túi đựng tới 5 ổ) | 1 | xấp 30 · 30k | 60 · 54k | — | — |
| `than` | Than (lò than nướng lại) | 0,4 / lần | bao 20 lần · 8k | 40 lần · 14k | — | — |
| `gas` | Bình gas | 2 / mẻ | bình 30 mẻ · 60k | — (Anh Lâm giao) | — | — |
| `trend` | Nguyên liệu topping trend (sự kiện M03) | 6 | 6 · 36k (chỉ khi có trend) | — | 2 ngày | ✓ |

- Bà Tư giao gấp trong ca: +15%. Chị Mai không giao trong ca (trừ bánh sỉ gấp).
- Đồ hết hạn ghi **hao hụt** lúc chốt ca. Tủ mát (cấp 13) cộng 1 ngày cho đồ hạn 2 ngày.
- "Nhiều pate" dùng 2 phần pate, khách không trả thêm (thói quen thật). "Thêm trứng" khách trả +5k.

## 2. Công thức (10 loại)

Phần nền của mọi ổ ráp (trừ que): phôi 2 + đồ chua 1 + dưa leo 1 + rau 1 + gia vị 1 + giấy 1 = **7k**. Giá vốn chưa tính gas và nướng lại.

| # | Món | Cấp | Thành phần ngoài phần nền | Giá vốn | Bán | Lãi gộp | Biên | XP 4–5 sao | Trạm cần |
|---:|---|---:|---|---:|---:|---:|---:|---:|---|
| 1 | Bánh mì pate bơ | 1 | pate, bơ | 10 | 16 | 6 | 38% | 6 | — |
| 2 | Bánh mì chả lụa | 1 | pate, bơ, chả lụa | 14 | 22 | 8 | 36% | 7 | — |
| 3 | Bánh mì trứng ốp la | 2 | pate, trứng (chiên 6 giây) | 12 | 20 | 8 | 40% | 7 | Chảo trứng |
| 4 | Bánh mì xíu mại | 3 | xíu mại (kèm nước sốt) | 12 | 22 | 10 | 45% | 8 | Nồi xíu mại |
| 5 | Bánh mì thập cẩm | 4 | pate, bơ, chả lụa, thịt nguội, chà bông | 21 | 34 | 13 | 38% | 9 | — |
| 6 | Bánh mì thịt nướng | 5 | mayo, thịt nướng (đã nướng) | 14 | 26 | 12 | 46% | 9 | Bếp than |
| 7 | Bánh mì chay | 6 | bơ, chả chay | 11 | 20 | 9 | 45% | 8 | Thớt chay (không phết pate / mayo trứng) |
| 8 | Bánh mì gà xé | 8 | mayo, gà xé | 13 | 25 | 12 | 48% | 9 | — |
| 9 | Bánh mì heo quay | 10 | pate, heo quay | 16 | 32 | 16 | 50% | 10 | — |
| 10 | Bánh mì que (bịch 5 que) | 12 | 5 phôi que (3k), pate 1 phần, túi | 6 | 15 | 9 | 60% | 8 | Khay que |

- **Ổ ba chục** (cấp 3): khách nói giá 20 / 25 / 30 / 40k. Giá ổ = 7k nền + tổng giá bán từng phần nhân theo bảng "giá lẻ" (pate 3, bơ 1, mayo 1, chả lụa 7, thịt nguội 8, xíu mại 9, trứng 5, thịt nướng 11, heo quay 15, gà xé 11, chả chay 7, chà bông 3) + phụ thu 2k. Lệch ≤ 3k là đúng.
- **Ổ gia truyền** (cấp 19): người chơi đặt tên, chọn tối đa 4 nhân, giá tự chọn trong khung giá vốn ×1,6 – ×2,4; giá càng cao khách càng khó tính.
- **XP**: 3 sao = 60% XP, 1–2 sao 25%, làm tròn xuống. Đơn nhiều ổ: 4 ổ đầu đủ XP, ổ thứ 5 trở đi 50% (đơn 30 ổ không làm vỡ đường cong). Hoàn tiền / huỷ: 0 XP.

## 3. Lò, mẻ bánh và độ giòn

| Lò | Mở | Giá | Ngăn × khay | Thời gian (s ca) · vùng chín | Năng lượng/mẻ | Ghi chú |
|---|---:|---:|---|---|---|---|
| Lò mini (xe đẩy) | 1 | có sẵn | 1 × 4 (khay 6 từ cấp 4, 60k) | sống < 26 · **chín 26–32** · xém 32–36 · cháy > 36 | gas 2k | |
| Lò gas 2 ngăn | 7 | gồm trong thuê mặt bằng | 2 × 6 | sống < 24 · **chín 24–31** · xém 31–35 · cháy > 35 | gas 2k | Giữ lại làm dự phòng khi có lò điện |
| Lò điện đối lưu | 14 | 520k | 3 × 8 | sống < 20 · **chín 20–32** · xém 32–37 · cháy > 37 | điện 1k (cộng vào phí ca) | Cúp điện (sự kiện O02) là dừng hết ngăn |
| Khay que | 12 | 70k | dùng một ngăn, 12 que | **chín 14–19** · cháy > 22 | như lò đang dùng | |

Độ giòn khi rút: **chín 100**, xém 90 (khách "giòn giòn" +5 kỳ vọng, khách khác −3), sống 60, cháy = bỏ (hao hụt phôi + gas).

Giá một ổ bánh tự nướng: phôi 2k + gas 2k / 4–8 ổ = **2,25–2,5k**. Bánh sỉ 3k, không tốn lò nhưng giòn tối đa 80 nên muốn 5 sao phải nướng lại.

| Nơi giữ bánh | Mở | Sức chứa | Giảm giòn |
|---|---:|---:|---|
| Tủ kính xe đẩy | 1 | 12 ổ | −1 mỗi 2,5 s ca (100 → 50 sau ~2 phút) |
| Tủ kính tiệm | 7 | 20 ổ | như trên |
| Tủ kính sưởi | 5 (120k) | +4 ổ | −1 mỗi 4,2 s (chậm 40%) |

- **Nướng lại** (lò than): 4 s / ổ, đưa giòn lên tối thiểu 85, tốn 0,4k than. Để quá 10 s là cháy ổ đó. Lò than 1 chỗ, lò than đôi 100k (cấp 8).
- Bánh dưới 50 là **bánh ỉu**: tối đa 3 sao. Dưới 25 khách từ chối (phải làm lại).
- **Bánh hôm qua**: bánh dư cuối ca xuống 30. Sáng mai ba lựa chọn ở Chuẩn bị ca: bán "bánh mì nướng bơ đường" 10k (cần nướng lại, tối đa 70), cho đi (+1 danh tiếng, mở D06), hoặc bỏ (hao hụt).
- **Mẻ đầu ngày** (Chuẩn bị ca): nướng tối đa `số ngăn × 2` mẻ, mỗi mẻ canh lò một lần (không tính giờ ca). Bánh vào tủ với độ giòn 100 lúc mở cửa.
- **Nướng thịt**: bếp than 5 phần/mẻ, 25 s, cháy sau 33 s. Thịt đã nướng giữ ấm tới hết ca, dư thì hao hụt.

## 4. Tiền lẻ và thanh toán

- Tiền mặt gồm **quỹ lẻ** (tờ 1–50k) và **két** (100k trở lên). Khởi đầu 120k, trong đó lẻ 40k (1k×5, 2k×5, 5k×3, 10k×1).
- **Đổi tiền lẻ** ở Chuẩn bị ca (Cô Sáu, miễn phí): tối đa 100k (xe đẩy) / 200k (tiệm) / 300k (nổi tiếng) mỗi ngày, chọn gói "nhiều tờ nhỏ" hoặc "nhiều tờ 10–20k".
- Khách trả: **chuyển khoản** 15% ở cấp 1 → 45% ở cấp 20 (văn phòng, khách Tây hay chuyển khoản; thợ hồ, cô chú gần như luôn tiền mặt). Tiền mặt: 25% đưa vừa đủ, còn lại đưa tờ ≥ giá trong {10, 20, 50, 100, 200, 500}. 06:00–07:00 khả năng tờ 200k/500k gấp đôi.
- Tờ khách đưa ≤ 50k vào quỹ lẻ (dùng thối được). Máy giải luôn kiểm có thối được không; không thì mở O08.
- Thối **thiếu**: tối đa 2 sao + khiếu nại (bù ngay được). Thối **dư**: mất tiền, 40% khách thật thà trả lại (+1 danh tiếng, câu riêng).

## 5. Kho, sức chứa, chi phí cố định

| Giai đoạn | Sức chứa kho | Hàng chờ | Đổi lẻ tối đa | Phí ca |
|---|---:|---:|---:|---|
| Xe đẩy (cấp 1–6) | 60 phần | 4 | 100k | 8k + 2k mỗi cấp (10k ở cấp 1, 20k ở cấp 6) |
| Tiệm (cấp 7–15) | 100 (150 với tủ mát, cấp 13) | 5 | 200k | 20k + 2k mỗi cấp (34k ở cấp 7) |
| Nổi tiếng (cấp 16–20) | 150 | 6 (dây xếp hàng) | 300k | như trên (52k ở cấp 16, 60k ở cấp 20) + phụ việc 45k nếu thuê |

- Vốn đầu 120k + gói học (12 phôi, 10 pate, 10 bơ, 8 chả lụa, 15 đồ chua / dưa leo / rau, 30 gia vị, 30 giấy, bình gas đầy, bao than) đủ ~12 ổ.
- Gói ký gửi Bà Tư: bù đủ cho **10 ổ pate bơ** (chỉ phần thiếu), để dưới gầm xe, vượt sức chứa được, trừ dần giá vốn khi bán. Mở khi tiền + hàng không làm nổi một ổ pate bơ. Một lần mỗi ngày + một lần giữa ca khi hết tiền.
- Phí ca ghi một lần lúc mở cửa. Lợi nhuận vận hành = doanh thu sau hoàn − giá vốn bán − hao hụt (bánh cháy, bánh bỏ, đồ hết hạn, nguyên liệu đổ bỏ) − gas/điện − than − phí ca. Dòng tiền còn tính nhập kho, chi phí sự kiện, mua đồ.

Ví dụ ngày 1: bán 14 ổ (8 pate bơ, 6 chả lụa) = 260k doanh thu, giá vốn 164k, cháy 1 ổ xém bỏ 2,5k, gas 4 mẻ 8k, than 6 lần 2,4k, phí 10k ⇒ **lợi nhuận vận hành ≈ 73k**.

## 6. Nâng cấp

| Đồ | Cấp | Giá | Tác dụng |
|---|---:|---:|---|
| Chảo trứng | 2 | 30k | Mở trứng ốp la (6 s/trứng) |
| Nồi xíu mại | 3 | 40k | Mở xíu mại |
| Thớt dài (ráp ×4) | 3 | 50k | Ráp tối đa 4 ổ giống nhau một lượt |
| Khay lò 6 | 4 | 60k | Lò mini 4 → 6 ổ/mẻ |
| Bếp than nướng xiên | 5 | 90k | Mở thịt nướng |
| Tủ kính sưởi | 5 | 120k | Bánh nguội chậm 40%, +4 chỗ |
| Mái che xe đẩy | 6 | 50k | Mưa chỉ giảm 15% khách thay vì 35% |
| **Thuê mặt bằng (lên tiệm)** | 7 | 300k | Cảnh tiệm, lò gas 2 ngăn, kho 100, hàng chờ 5 |
| Chụp hút khói | 7 | 140k | Hết phàn nàn khói (D03), mẻ cháy không lan khói |
| Thớt đôi | 8 | 200k | 2 ổ song song |
| Chảo đôi | 8 | 70k | 2 trứng cùng lúc |
| Lò than đôi | 8 | 100k | Nướng lại 2 ổ cùng lúc |
| Hộp đếm tiền | 9 | 90k | Gợi ý tờ thối (vẫn phải bấm) |
| Bàn dài (ráp ×8) | 10 | 160k | Cần thớt dài |
| Bình trà đá | 11 | 40k | Khách chờ +6% kiên nhẫn |
| Khay que | 12 | 70k | Mở bánh mì que |
| Tủ mát lớn | 13 | 280k | Kho 150, đồ 2 ngày giữ thêm 1 ngày |
| Lò điện đối lưu | 14 | 520k | §3 |
| Máy ráp định lượng | 15 | 420k | Bước phết / gia vị tự đặt lượng theo phiếu |
| Dây xếp hàng | 16 | 150k | Hàng chờ 6, khách chờ +5% kiên nhẫn |
| Thớt ba | 17 | 560k | 3 ổ song song (cần thớt đôi) |
| Phụ việc Bé Na | 17 | 45k / ca | Tự gói + thối tiền đơn đang giao |
| Bình gas dự phòng | 1 | 60k | Tự thay khi hết, không mở O01 |

## 7. Trang trí

Mỗi món có điểm hấp dẫn (+khách đi ngang). Cộng dồn tối đa +3 (+4 từ cấp 19). Không đổi sao đã nhận.

| Đồ | Cấp | Giá | Hấp dẫn / hiệu ứng |
|---|---:|---:|---|
| Đèn mây | 4 | 30k | +0,5 |
| Bảng phấn ghi menu | 4 | 25k | +0,5 |
| Hũ sứ xanh trắng | 4 | 35k | +0,5 |
| Bó lúa mì | 5 | 20k | +0,25 |
| Chậu rau thơm | 5 | 30k | +0,25, rau hao chậm hơn |
| Chuông gió | 6 | 25k | +0,25 |
| Ghế nhựa | 11 | 40k | +6% kiên nhẫn |
| Bàn nhỏ | 11 | 60k | +0,5, khách Tây ở lâu tip hơn |
| Lịch treo tường | 7 | 15k | +0,25 |
| Radio cũ | 8 | 45k | +0,5 |
| Quạt tường | 9 | 50k | +4% kiên nhẫn |
| Chuối cảnh | 10 | 55k | +0,5 |
| Khung giấy khen | — | sự kiện X02 | +0,5 |
| Biển đèn neon | 16 | 260k | +1, +2 khách đi ngang buổi chiều |
| Bảng hiệu bậc 2 / 3 | 10 / 16 | 180k / 450k | +0,5 / +1 |

## 8. Nhiệm vụ ngày (cấp 2)

3 mục mỗi ca, chọn theo cơ chế đã mở, thưởng trả một lần, tính cả việc đã làm trước khi nhận nhiệm vụ trong ca.

| Mẫu | Mở | Thưởng |
|---|---:|---|
| Rút {n} mẻ đúng vùng chín | 2 | 8 XP |
| Không có ổ ỉu nào trong ca | 2 | 10 XP, 8k |
| Thối tiền đúng {n} lần | 2 | 8 XP |
| Phục vụ {n} khách cao điểm sáng không ai bỏ về | 2 | 12 XP, 10k |
| Giao {n} phiếu có biến thể đúng ("không hành"…) | 2 | 10 XP |
| Nhận {n} review 5 sao | 2 | 10 XP, 8k |
| Bán {n} ổ có trứng | 2 | 8 XP, 6k |
| Giao trọn một đơn nhiều ổ từ 3 sao | 3 | 12 XP, 8k |
| Làm đúng {n} ổ ba chục | 3 | 10 XP |
| Bánh dư cuối ca không quá {n} ổ | 3 | 12 XP, 10k |
| Bán {n} ổ trong ca | 4 | 14 XP, 10k |
| Phục vụ khách quen "như cũ" đúng | 4 | 12 XP |
| Doanh thu ca đạt {n}k | 5 | 15 XP, 15k |
| Giao đơn đặt trước đúng giờ | 7 | 15 XP, 15k |
| Hao hụt cả ca dưới {n}k | 7 | 12 XP, 12k |
| Xử lý một tình huống trong ca | 2 | 6 XP, 5k |

## 9. Quảng bá (cấp 11), cứu hết hàng, đơn đặt trước

| Việc | Chi phí | Hiệu ứng |
|---|---|---|
| Tờ rơi cổng trường | 20k | +4 học sinh buổi sáng hôm sau |
| Check-in tặng trà đá | 15k + trà đá | +2 khách hôm nay, +người theo dõi |
| Livestream lúc ráp | 0 | Hên xui: +độ hot / khách ăn ké / phản tác dụng nếu làm sai trên sóng |
| Chạy ra chợ mua gấp | +30% | Quầy bỏ trống 12 s, chủ tiệm rời cảnh |
| Nhờ Anh Lâm chở tới | +15% + 5k | Tới sau 20 s, 25% mua nhầm |
| Mượn Cậu Hưng (xe đối diện) | 0 (4 phần, 1 lần/ngày) | Mai trả (sự kiện T02) |
| Bánh sỉ gấp | 10 ổ 45k (trước cấp 9, chạy ra lò đầu hẻm, quầy trống 15 s) / 40k (Chị Mai giao, 15 s) | Giòn 80 |
| Đơn đặt trước | Cọc 30% | Giá theo menu, đơn ≥ 10 ổ giảm 5–10% tuỳ thoả thuận. Trễ ≤ 30 s ca: −10%; trễ hơn hoặc thiếu: −30% và review 2 sao. Tối đa 2 đơn/ngày. |

## 10. Chỗ tiêu tiền cuối game

- **Hạng tiệm** 8 bậc: 300k (cấp 10), 600k (11), 1.000k (12), 1.600k (14), 2.400k (15), 3.400k (17), 4.600k (19), 6.000k (20) — tổng 19.900k. Mỗi bậc +1 khách đi ngang mỗi ca, kiên nhẫn +2%.
- **Pate nhà làm** 3 bậc: 400k (cấp 15), 900k (17), 1.600k (19). Mỗi bậc: ổ có pate +1k giá bán (cộng dồn +3k), +1 điểm kỳ vọng, câu review riêng ("pate tiệm tự làm, béo mà không ngấy").
- **Hội chợ** (cấp 18): thuê gian 150k mỗi 4 ngày, ca 4,5 phút, +8 khách, giá +15%, đơn nhóm kết hợp. Lãi thêm ~150–250k nếu chạy kịp.
- **Thử thách** (cấp 20): miễn phí. Đạt lần đầu +120k, +60 XP, huy hiệu; lần sau +60k, +30 XP.

## 11. Mục tiêu cân bằng (PLAYBOOK §6, bộ mô phỏng M5 kiểm)

| Chỉ số | Mục tiêu |
|---|---|
| Thời gian lên cấp (hồ sơ trung bình) | cấp 4 ≈ 10 phút · cấp 7 ≈ 40 phút · cấp 10 ≈ 2 giờ · cấp 20 ≈ 10–12 giờ |
| Một ngày | 5–6 phút (chuẩn bị ~1 · ca 4 · chốt ~0,5–1) |
| Lợi nhuận vận hành / ngày | ngày 1 ≈ 60–80k · cấp 7 ≈ 160–200k · cấp 10 ≈ 230–270k · cấp 15 ≈ 320–380k · cấp 20 ≈ 420–480k |
| Số ổ / ngày | ngày 1: 12–16 · cấp 10: 30–40 · cấp 20: 50–65 (gồm đơn đặt trước) |
| Lên tiệm | Đủ 300k vào khoảng ngày 7–9 nếu không mua đồ thừa |
| Cuối game | Tới cấp 20 đã mua 7/8 bậc hạng tiệm, còn 3–9 triệu cho bậc cuối và pate nhà làm |
| Kẹt | 0 lần ở cả 3 hồ sơ (ký gửi + cứu hết hàng + bình gas dự phòng + đổi lẻ) |
| Hao bánh | Người trung bình ≤ 12% số ổ nướng; người ẩu ≤ 25% mà vẫn có lời |

Các núm chỉnh ưu tiên trong M5: số khách theo cấp, tốc độ giảm giòn, độ rộng vùng chín, phí ca, giá bán; giữ nguyên tỉ lệ biên giữa các món.

## Cân bằng M5

Dò bằng bộ mô phỏng `prototype/games/tiem-banh-mi/tools/sim/` (3 hồ sơ, luật thật, báo cáo `report.md`, test hồi quy `sim.test.mjs`). Số trong các bảng phía trên là bản M0; bảng dưới là giá trị đang chạy trong `data/`.

| Thay đổi | Trước (M0 – M4) | Sau (M5) | Lý do (bộ mô phỏng) |
|---|---|---|---|
| Giá bán mọi món | pate bơ 16 · chả lụa 22 · trứng 20 · xíu mại 22 · thập cẩm 34 · thịt nướng 26 · chay 20 · gà xé 25 · heo quay 32 · que 15 · gia truyền 48 | 20 · 27 · 25 · 27 · 42 · 32 · 25 · 31 · 40 · 18 · 58 (×1,25) | Người chơi trung bình ráp ~13 giây một khách (≈ 11 lần bấm) nên chỉ bán 18–22 ổ / ca: lời cấp 7 chỉ 0–60k (mục tiêu 160–200k). Giữ nguyên tỉ lệ biên giữa các món. |
| Sức chứa kho | xe đẩy 60 · tiệm 100 · tủ mát 150 | 90 · 140 · 200 | Từ cấp 4 kho đầy chà bông / thịt nguội (gói 8–10 phần mỗi nhân), "Nhập đủ" không còn chỗ cho phôi ⇒ ngày nào cũng hết bánh, tiền về 0 ở ngày 5. |
| "Nhập đủ cho hôm nay" | dự báo ổ × 1,15, mỗi nhân chia đều | ổ × 1,1, nhân × 1,2 theo phần món, **giữ chỗ trong kho cho phôi trước** | Hết nhân giữa ca (pate, chả lụa) khi khách lệch về món ruột; mua dư thì hết hạn. |
| Ba buổi | sáng 55% khách × kiên nhẫn 0,8 · trưa 15% · chiều 30% | sáng 47% × 0,95 · trưa 18% · chiều 35% | Sáng dồn quá sức một người ráp ⇒ mất 5–12 khách mỗi ca, danh tiếng tụt. |
| Kiên nhẫn khách (từ ngày 2) | ×1 | ×1,2 | Cùng lý do; ngày 1 (hướng dẫn) giữ nguyên. |
| Hạn dùng (mới, M5) | chưa làm | phôi / que 3 ngày · chả, thịt, xíu mại, gà, chả chay 4 · heo quay 3 · đồ chua 5 · dưa leo 3 · rau 2 · pate, bơ, mayo, trứng, chà bông 10 · tủ mát +1 · chậu rau thơm +1 cho rau | Bản M0 (2 ngày / trong ngày) làm người trung bình bỏ 30–80k mỗi ca vì gói nhập lớn hơn nhu cầu một ngày. |
| Hợp đồng K02 / X05 | một đơn đặt trước, hạn 30–40 giây sau mở cửa | hợp đồng định kỳ (12 ổ / 2 ngày × 5 đợt; 25 ổ / tuần × 4 đợt), hạn 90–100 giây, không cọc | 12 ổ trong 30 giây không ai kịp ⇒ đơn hỏng, mất hợp đồng ngay đợt đầu. |
| Đơn nhiều ổ khách bỏ đi | mọi ổ đã gói ghi hao | khách lấy luôn ổ đã gói, trả 70% (cả đơn đặt trước giao thiếu) | Người ẩu mất 150–500k một ca vì đơn 6–30 ổ hỏng giữa chừng ⇒ kẹt nghèo hàng chục ngày (141 lần ký gửi). |
| Cỡ đơn đặt trước ở Chuẩn bị ca | 6 + ngẫu nhiên tới cấp + 4 (tối đa 30) | 6 + ngẫu nhiên tới 3 + 0,8 × cấp (tối đa 26) | Cùng lý do. |
| Anh Lâm chở hàng | gọi bao nhiêu chuyến cũng được | đang chở món nào thì không gọi thêm món đó | Bộ mô phỏng từng gọi 16 chuyến dưa leo trong một ca (159 phần hết hạn). |
| Đường cong XP | 0, 35, 70, 115, 360, 580, 870, 1450, 2100, 3000, 3625, 4380, 5225, 6240, 7530, 9005, 10835, 12950, 15415, 18260 | 0, 30, 55, 125, 270, 445, 655, 1055, 1630, 2355, 2845, 3455, 4110, 5050, 6280, 7575, 9125, 11050, 13295, 16085 | `fit.mjs`: XP mỗi cấp = XP người chơi trung bình có ở phút mục tiêu (4 ≈ 10, 7 ≈ 40, 10 ≈ 120, 20 ≈ 660). Bản lưu v2 nâng lên v3 giữ cấp + phần trăm (`rescaleXp`), bản gốc cất ở `….bak-v2`. |

Lỗi luật bộ mô phỏng bắt được (đã sửa trong code): người lấy đơn đặt trước bị sự kiện cho "rời quầy" không bao giờ rời ca (ca không kết thúc); ráp ×N bịch que mở hội thoại "hết que" dù còn đủ que cho vài bịch (vòng lặp vô tận).

Kết quả: xem `prototype/games/tiem-banh-mi/tools/sim/report.md` và DEV-NOTES mục "M5".
