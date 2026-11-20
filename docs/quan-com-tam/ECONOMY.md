# Economy và tiến trình · Quán Cơm Tấm

Đơn vị **k** = 1.000 đồng ảo. Số liệu dưới đây là bản thiết kế M0.

**Bộ mô phỏng M5** sẽ kiểm và chỉnh lại mọi con số ở đây:
- Thư mục `prototype/games/quan-com-tam/tools/sim/`, chép khung Bánh Mì.
- 3 hồ sơ người chơi: chăm / trung bình / ẩu.
- Báo cáo `report.md`, có test hồi quy.

Bảng nào đổi thì ghi lý do vào mục "Cân bằng M5" cuối file, như Bánh Mì.

Bài học Bánh Mì cần tính trước:
- Người chơi trung bình chậm hơn thiết kế khoảng 30%. Vì vậy số khách và kiên nhẫn ở đây đã chừa sẵn khoảng trống.
- Gói nhập lớn hơn nhu cầu một ngày gây hao hụt. Vì vậy hạn dùng ở đây đã theo bản M5 của Bánh Mì (dài hơn bản M0).

## 1. Nguyên liệu

Giá một **phần** (một dĩa dùng một phần). Cột "Kho" cho biết nguyên liệu có tính vào sức chứa không.

| id | Nguyên liệu | Giá/phần | Gói Cô Ba (cấp 1) | Gói Chú Hòa (cấp 9: rẻ 10%, gói gấp đôi, chỉ giao trước ca) | Hạn | Kho |
|---|---|---:|---|---|---|:-:|
| `gao-tam` | Gạo tấm (1 phần = 1 vá cơm) | 1,5 | bao 20 phần · 30k | bao 50 phần · 68k | 30 ngày | ✓ |
| `suon` | Sườn cốt lết (mua sống, ướp ở Chuẩn bị) | 10 | 10 miếng · 100k | 20 · 180k | sống 3 ngày · đã ướp: hôm nay + mai (mai tươi tối đa 85) | ✓ |
| `suon-non` | Sườn non | 15 | 8 · 120k | 16 · 216k | như sườn | ✓ |
| `ga` | Đùi gà góc tư | 12 | 8 · 96k | 16 · 173k | như sườn | ✓ |
| `lap-xuong` | Lạp xưởng | 5 | 10 · 50k | 20 · 90k | 14 ngày | ✓ |
| `dau-hu` | Đậu hũ + chả chay để nướng | 3 | 10 · 30k | 20 · 54k | 3 ngày | ✓ |
| `bi` | Bì (thính, mua sẵn) | 3 | khay 15 · 45k | 30 · 81k | 3 ngày | ✓ |
| `bi-chay` | Bì chay | 2 | 15 · 30k | 30 · 54k | 3 ngày | ✓ |
| `cha` | Chả trứng (sống, phải hấp) | 4 | khay 8 · 32k | 16 · 58k | 3 ngày (đã hấp: trong ca) | ✓ |
| `cha-chay` | Chả chay (hấp chung xửng) | 2 | 8 · 16k | 16 · 29k | 3 ngày | ✓ |
| `trung` | Trứng gà | 3 | vỉ 10 · 30k | 20 · 54k | 10 ngày | ✓ |
| `do-chua` | Đồ chua (cà rốt, củ cải) | 1 | hũ 20 · 20k | 40 · 36k | 5 ngày | ✓ |
| `dua-leo` | Dưa leo + cà chua | 1 | 20 · 20k | 40 · 36k | 3 ngày | ✓ |
| `mo-heo` + `hanh-la` | Bộ làm mỡ hành (1 hũ = 20 phần) | 0,5 | bộ 10k | bộ đôi 18k | hũ đã làm: 2 ngày | — |
| `nuoc-mam` | Nước mắm pha (chén hoặc bịch) | 1 | can 30 phần · 30k | 60 · 54k | 14 ngày | — |
| `nuoc-tuong` | Nước tương chay + hành phi | 0,5 | chai 30 · 15k | 60 · 27k | 14 ngày | — |
| `rau-canh` | Rau + xương nấu canh (nồi 30 chén) | 0,6 / chén | bộ nồi · 18k | — | nồi đã nấu: trong ca | — |
| `tra` + `da` | Trà đá (1 phần = 1 ly, châm lại tốn thêm 1) | 0,3 | 30 ly · 9k | 60 · 16k | trong ngày (đá tan) | — |
| `khan-lanh` | Khăn lạnh (bán 2k) | 0,8 | xấp 30 · 24k | 60 · 43k | — | — |
| `than` | Than (1 rổ = +35 mức than) | 4 / rổ | bao 10 rổ · 40k | bao 25 rổ · 85k | — | — (gầm bếp) |
| `gas` | Gas bếp phụ (chảo, xửng, canh, mỡ hành) | — | bình 60k ≈ 12 ca | — | — | — |
| `hop` | Hộp giấy + bịch nước mắm (mang về) | 2 | 30 · 60k | 60 · 108k | — | — |
| `tui` | Túi (1 túi tới 4 hộp) | 0,5 | 50 · 25k | 100 · 45k | — | — |
| `dia` | Dĩa (thay dĩa bể) | 8 / cái | — | — | — | — |

Ghi chú:
- **Giao gấp trong ca:**
  - Cô Ba giao gấp, +15%.
  - Chú Hòa không giao trong ca, trừ than gấp: 1 bao 50k, tới sau 20 giây.
- **Ướp sườn** (Chuẩn bị): chọn số miếng ướp. Miếng chưa ướp không lên vỉ được. Ướp gấp giữa ca thì mất 10 giây đứng ở khay, và miếng đó tươi tối đa 90 ("chưa thấm").
- Đồ hết hạn ghi **hao hụt** lúc chốt ngày. Tủ mát (cấp 14) cộng 1 ngày cho thịt.
- "Thêm mỡ hành" dùng 2 phần mỡ hành, khách không trả thêm.
- "Thêm cơm" khách trả +4k.

## 2. Món (10 + dĩa mang tên quán)

**Phần nền tại bàn**: cơm 1,5 + mỡ hành 0,5 + đồ chua 1 + dưa leo / cà 1 + nước mắm 1 = **5k**.
- Cơm chay thay mỡ hành bằng hành phi, nước mắm bằng nước tương: **4,5k**.
- Giá vốn ở bảng chưa tính than, trà đá, canh. Ba thứ đó cộng khoảng 2,5–3k mỗi người ngồi (§5).

| # | Món | Cấp | Thành phần ngoài phần nền | Giá vốn | Bán | Lãi gộp | Biên | XP 4–5 sao | Trạm cần |
|---:|---|---:|---|---:|---:|---:|---:|---:|---|
| 1 | Cơm sườn | 1 | sườn | 15 | 32 | 17 | 53% | 8 | Bếp |
| 2 | Cơm sườn trứng | 2 | sườn, trứng ốp la | 18 | 38 | 20 | 53% | 9 | Bếp, chảo |
| 3 | Cơm sườn bì | 3 | sườn, bì | 18 | 37 | 19 | 51% | 9 | Bếp |
| 4 | Cơm sườn bì chả | 4 | sườn, bì, chả | 22 | 45 | 23 | 51% | 10 | Bếp, xửng |
| 5 | Cơm bì chả | 5 | bì, chả | 12 | 26 | 14 | 54% | 7 | Xửng (không cần bếp) |
| 6 | Cơm tấm đặc biệt | 6 | sườn, bì, chả, trứng, ngò | 25 | 55 | 30 | 55% | 13 | Bếp, chảo, xửng |
| 7 | Cơm gà nướng | 8 | gà | 17 | 40 | 23 | 58% | 11 | Bếp (12 s một mặt) |
| 8 | Cơm sườn non | 10 | sườn non | 20 | 50 | 30 | 60% | 13 | Bếp (14 s một mặt) |
| 9 | Cơm chay | 11 | đậu hũ nướng, bì chay, chả chay | 11,5 | 30 | 18,5 | 62% | 11 | Chỗ nướng chay riêng (2 chỗ phải bếp 1 dán nhãn chay), xửng |
| 10 | Cơm lạp xưởng trứng | 13 | lạp xưởng, trứng | 13 | 34 | 21 | 62% | 10 | Bếp (lăn 2 lần), chảo |
| — | Cơm chiên (từ cơm dư hôm trước) | 2 | 2 phần cơm dư + trứng | 3,5 | 20 | 16,5 | — | 5 | Chảo |
| — | Bánh mì sườn (cứu khi hết cơm) | 1 | ổ bánh 3k + sườn | 13 | 30 | 17 | 57% | 4 | Bếp; tối đa 3 ổ / ca; khách sành trừ kỳ vọng |
| 11 | Dĩa mang tên quán | 19 | Người chơi chọn tối đa 5 món mặn | theo món | giá vốn ×1,6 – ×2,4 | | | 14 | Giá càng cao khách càng khó tính |

**Gọi thêm:**

| Món gọi thêm | Khách trả | Giá vốn | Ghi chú |
|---|---:|---:|---|
| Thêm cơm | +4k | 2k | |
| Thêm trứng | +6k | 3k | |
| Thêm sườn | +18k | 10k | Cần một miếng chín |
| Thêm bì / chả | +5k / +6k | | |
| Khăn lạnh | 2k | 0,8k | |
| Canh | miễn phí | 0,6k | |
| Trà đá | miễn phí | 0,3k mỗi ly | Mỗi người uống 2–3 ly |

**Mang về:**
- Giá như tại chỗ, tốn thêm hộp 2k + túi 0,5k.
- Không tốn bàn, dĩa, trà, canh (khoảng 1,4k).
- Tính ra lãi thấp hơn tại chỗ khoảng 1k mỗi phần.

**XP:**
- 3 sao được 60% XP; 1–2 sao được 25%; làm tròn xuống.
- Bàn nhóm: mỗi người tính XP riêng.
- Mâm cơm: 4 phần đầu đủ XP, từ phần thứ 5 được 50%.
- Hoàn tiền / huỷ: 0 XP.

## 3. Bếp than, than và khói

### 3.1 Bếp và nhiệt

| Thông số | Giá trị |
|---|---|
| Chỗ nướng | 6 (bếp 1) · +6 (bếp 2, cấp 14) |
| Vùng | trái **nóng ×1,5** · giữa **vừa ×1** · phải **giữ ấm ×0,25** (không cháy trước 60 s) |
| Mức than → hệ số | ≥ 60 rực ×1,2 · 30–59 vừa ×1 · 10–29 yếu ×0,6 · < 10 tàn ×0 |
| Than cháy | −0,5 mức / giây ca; quạt ×2; thêm 1 rổ +35 sau 4 giây |
| Lửa bùng | Thêm than khi mức ≥ 60: vùng nóng ×2 trong 3 giây |
| Mặt thịt | < 60 sống · 60–99 tái · **100–114 chín** · 115–129 cháy cạnh · ≥ 130 cháy đen |
| Một mặt ở vùng vừa, than vừa | sườn 9 s · sườn non 14 s · gà 12 s · lạp xưởng 5 s (lăn 2 lần) · đậu hũ 6 s |
| Giữ ấm | Tươi 100 → −1 mỗi 3 s (tủ kính −1 mỗi 5 s). Dưới 60 = khô (trần 4 sao). Miếng chín còn trên vỉ cuối ca: hao. |
| Khói | +1 mỗi giây quạt, +3 mỗi giây có miếng ≥ 125, −2 mỗi giây khi không quạt. Chụp hút khói ×0,4. ≥ 70: khách 2 bàn gần bếp kiên nhẫn ×1,3 tốc độ giảm, mở được D03. |

### 3.2 Kinh tế than

- **Nhóm bếp đầu ca** (Chuẩn bị, không tính giờ): 2 rổ, mở ca ở mức 70.
- **Ca tối** (210 giây ca):
  - Không quạt: cần thêm khoảng 3 rổ; quạt vừa phải: 4–5 rổ.
  - Tổng **5–7 rổ = 20–28k / bếp / ca**.
- **Ca trưa** (150 giây): 4–5 rổ = 16–20k.
- **Than trên mỗi dĩa:** khoảng 1,5–2k ở cấp 1 (11–14 dĩa). Giảm còn khoảng 0,8k ở cấp 10 vì bếp kín chỗ hơn.
- **Hết than:**
  - Viên Than đỏ ở 10%.
  - Kho còn 0 rổ: sự kiện O01.
  - Bao than dự phòng (40k, mua trước) tự mở, không có sự kiện.
- **Quạt máy** (cấp 12): giữ bếp ở mức +1 nấc khi bật, than ×1,5 (thay vì ×2 khi quạt tay), khói ×0,6.

## 4. Cơm, dĩa, tiền

### 4.1 Nồi cơm

| Nồi | Mở | Giá | Phần / mẻ | Thời gian | Ghi chú |
|---|---:|---:|---:|---|---|
| Nồi nhỏ | 1 | có sẵn | 12 | 40 s ca | Không lấy cơm được khi đang nấu |
| Nồi lớn | 7 | gồm trong thuê mặt bằng | 20 | 45 s | Nồi nhỏ giữ làm nồi phụ |
| Nồi thứ hai | 12 | 150k | 20 | 45 s | Nấu xen kẽ, không bao giờ trống cơm nếu canh đúng |

- **Mẻ đầu** nấu ở Chuẩn bị, mở ca có đủ một nồi.
- **Một mẻ nồi nhỏ = 18k gạo.** Cơm dư cuối ca là hao.
  - Nấu dư 4 phần = mất 6k. Nấu thiếu = khách chờ 40 giây, hoặc đổi sang bánh mì sườn.
- **Cơm chiên:** 50% số phần cơm dư thành món cơm chiên ở ca kế tiếp (tối đa 6 dĩa). Dư nhiều cũng không lãi hết được.
- **Hết gạo tấm:**
  - Mượn quán bên cạnh: 6 phần, mai trả.
  - Nấu gạo thường: 1k / phần, trần 4 sao, câu "đâu phải cơm tấm".

### 4.2 Dĩa sạch

| | Vỉa hè | Quán | Tủ chén (cấp 13) |
|---|---:|---:|---:|
| Dĩa sạch tối đa | 10 | 16 | 24 |

- Mỗi người ăn tại chỗ dùng 1 dĩa, 1 chén canh, 1 ly (chén và ly không tính tài nguyên).
- **Rửa chén** (chủ quán): 6 giây cho 6 dĩa, đứng ở thau.
- **Dì Năm** (cấp 13, 25k / ca): tự rửa 1 dĩa mỗi 2 giây.
- Mỗi ca 2% khả năng bể một dĩa khi rửa vội (câu vui, 8k).
- **Hết dĩa sạch:**
  - Khách mới ngồi được nhưng chờ dĩa.
  - Hoặc dùng hộp ăn tại chỗ: tốn 2k, trần 4 sao, câu "ăn hộp như ăn vội".

### 4.3 Tính tiền và sổ nợ

- **Tính tiền:**
  - Phiếu liệt kê món + gọi thêm. Người chơi chạm cộng từng dòng.
  - Thiếu dòng = tính thiếu: mất tiền, không trừ sao.
  - Thừa dòng (cộng món không ăn) = tính dư: trần 2 sao + khiếu nại.
  - Ngày 1–3 có "Tính đúng". Hộp tính tiền (cấp 15) tự cộng.
- **Cách trả:**

  | Cách trả | Cấp 1 | Cấp 20 | Ghi chú |
  |---|---:|---:|---|
  | Chuyển khoản | 20% | 55% | Văn phòng, điều dưỡng, du khách hay chuyển khoản |
  | Tiền mặt | phần còn lại | phần còn lại | Không có minigame thối tiền (nét riêng của Bánh Mì) |

- **Sổ nợ:**
  - Từ cấp 6. Khách quen và thợ quen (đã phục vụ ≥ 3 lần, ≥ 4 sao) có thể chọn "ghi sổ".
  - Hạn mức tổng: 150k (cấp 6), 300k (cấp 10), 500k (cấp 16).
  - Mỗi người tối đa 5 lần chưa trả.
  - Trả qua sự kiện K04 / K05 / K14 và ngẫu nhiên 25% mỗi ngày mỗi người nợ.
  - 6% nợ "quên luôn" sau 14 ngày (xoá nợ thì +1 danh tiếng).
  - Sổ nợ hiện ở Sổ và ở Chốt ngày.

## 5. Vòng quay bàn (toán)

**Thời gian một lượt ghế** (một người, chủ quán làm một mình, cấp 1, giây ca):

| Bước | Giây | Ghi chú |
|---|---:|---|
| Xếp chỗ + châm trà | 3 | |
| Lấy phiếu | 2 | |
| Nướng | 0–18 | 0 nếu đã nướng sẵn ở vùng giữ ấm |
| Bày dĩa (7 chạm) | 7 | |
| Bưng ra bàn | 2 | đi + về |
| Ăn | 25–40 | khách ngồi lâu hơn khi có trà đá đầy, canh, bàn sạch xung quanh |
| Tính tiền | 3 | |
| Dọn + lau | 3 | |
| **Tổng** | **≈ 65–80** | Phần chủ quán bận tay ≈ 22–40 giây; còn lại là khách tự ăn |

**Công suất:**

| Giai đoạn | Ghế | Lượt mỗi ghế (ca tối 210 s) | Số người ngồi tối đa | Thực tế (người trung bình) |
|---|---:|---:|---:|---:|
| Cấp 1 | 4 | ≈ 2,8 | 11 | 8–10, + 0 shipper |
| Cấp 5 | 8 | ≈ 2,8 | 22 | 15–18 + 3 shipper |
| Cấp 7 (quán) | 8 | ≈ 2,8 | 22 | 16–19 + 4 shipper |
| Cấp 10 | 10 (+Bông) | ≈ 3,2 | 32 | 22–26 + 5 shipper + mâm |
| Cấp 13 | 14 (+Dì Năm) | ≈ 3,2 | 45 | 28–34 + 6 shipper |
| Cấp 20 | 14 (bếp 2, ca khuya kéo dài) | ≈ 3,5 | 49 | 34–42 + 8 shipper + mâm |

- **Điểm nghẽn theo cấp:**

  | Cấp | Điểm nghẽn |
  |---|---|
  | 1–4 | Ghế |
  | 5–9 | Tay chủ quán (bếp ↔ bàn) |
  | 10+ | Bếp (12 chỗ ở cấp 14) và dĩa sạch |

  Bông, Dì Năm và bếp 2 mở đúng lúc từng điểm nghẽn tới.
- **Bàn dơ:**
  - Mỗi giây một bàn dơ có khách đứng chờ: kiên nhẫn khách chờ −1,5 giây.
  - Bàn dơ quá 15 giây: bàn bên cạnh −2 điểm phục vụ.
- **Ghép bàn** (vỉa hè, cấp 5): 2 bàn 2 cạnh nhau thành 4 chỗ. Khi khách đi, cả hai bàn dơ.

## 6. Kho, sức chứa, chi phí cố định

| Giai đoạn | Sức chứa kho | Chờ bàn tối đa | Shipper chờ tối đa | Phí ca |
|---|---:|---:|---:|---|
| Vỉa hè (cấp 1–6) | 80 phần | 2 | 2 | "Phí giữ chỗ + điện đèn" 12k + 2k mỗi cấp (14k ở cấp 1, 24k ở cấp 6) |
| Quán (cấp 7–15) | 140 (200 với tủ mát, cấp 14) | 3 | 3 | Tiền mặt bằng 30k + 3k mỗi cấp (51k ở cấp 7) |
| Nổi tiếng (cấp 16–20) | 200 | 4 (ghế chờ) | 4 | Như trên (78k ở cấp 16, 90k ở cấp 20) + Bông 40k + Dì Năm 25k nếu thuê |

Phí ca tính **mỗi ca mở**. Mở hai ca thì trả hai lần.

**Vốn đầu và gói học:**
- Vốn đầu 150k.
- Gói học, đủ khoảng 12 dĩa cơm sườn:
  - 12 miếng sườn đã ướp;
  - gạo tấm 24 phần;
  - đồ chua, dưa leo 20;
  - 1 hũ mỡ hành;
  - nước mắm 30;
  - trà đá 30;
  - 1 bao than.

**Gói ký gửi Cô Ba:**
- Bù đủ cho **10 dĩa cơm sườn** (chỉ phần thiếu).
- Để dưới gầm bếp, vượt sức chứa được, trừ dần giá vốn khi bán.
- Mở khi tiền + hàng không làm nổi một dĩa cơm sườn.
- Một lần mỗi ngày + một lần giữa ca khi hết tiền.

**Lợi nhuận vận hành** = doanh thu sau hoàn − các khoản chi:
- giá vốn bán;
- hao hụt (sườn cháy, cơm dư, đồ hết hạn, dĩa bể, lớp đổ bỏ);
- than, gas;
- trà đá, canh, khăn;
- phí ca, lương.

**Ví dụ ngày 1** (chỉ ca tối):

| Khoản | Tiền |
|---|---:|
| Doanh thu: 10 dĩa cơm sườn (320k) + 3 thêm cơm (12k) + 4 khăn (8k) | 340k |
| Giá vốn | −156k |
| Than 6 rổ | −24k |
| Trà đá 25 ly + gas mỡ hành | −12k |
| Hao: 1 miếng cháy + 3 phần cơm dư | −15k |
| Phí ca | −14k |
| **Lợi nhuận vận hành** | **≈ 119k** |

## 7. Nâng cấp

| Đồ | Cấp | Giá | Tác dụng |
|---|---:|---:|---|
| Chảo trứng | 2 | 40k | Mở trứng ốp la, cơm chiên |
| Bàn 3 (+2 ghế) | 3 | 90k | Vỉa hè 6 chỗ |
| Tủ kính giữ ấm | 3 | 120k | Giữ 6 miếng chín, tươi giảm chậm 40% |
| Xửng hấp chả | 4 | 60k | Mở chả trứng (khay 8, 30 s) |
| Kệ hộp mang về | 4 | 40k | Mở shipper / hộp |
| Nồi canh | 5 | 50k | Chén canh miễn phí (+3 điểm phục vụ) |
| Bàn 4 (+2 ghế) | 5 | 110k | Vỉa hè 8 chỗ, ghép bàn |
| Mái bạt | 6 | 80k | Mưa −15% khách thay vì −40%; O04 nhẹ hơn |
| Ô bày đôi | 6 | 90k | 2 dĩa song song + bày ×N |
| Can nước dự trữ | 6 | 50k | Mất nước (O06) còn rửa được 18 dĩa |
| **Thuê mặt bằng (lên quán)** | 7 | 350k | `quan-scene`, nồi lớn, 16 dĩa, kho 140, 3 bàn |
| Chụp hút khói | 8 | 180k | Khói ×0,4, D03 không mở |
| Chảo đôi | 8 | 80k | 2 trứng cùng lúc |
| Phụ bàn Bông | 9 | 40k / ca | Bưng / châm / dọn / lau theo hàng đợi việc |
| Bàn thứ 4 của quán (2 chỗ, góc trước quầy) | 10 | 160k | Quán 10 chỗ |
| Quạt máy | 12 | 160k | §3.2 |
| Nồi cơm thứ hai | 12 | 150k | §4.1 |
| Bàn 5 (4 chỗ) | 13 | 260k | Quán 14 chỗ |
| Dì Năm rửa chén | 13 | 25k / ca | Tự rửa |
| Tủ chén | 13 | 120k | 24 dĩa |
| **Bếp than thứ hai** | 14 | 520k | +6 chỗ, than riêng |
| Tủ mát | 14 | 300k | Kho 200, thịt ướp giữ thêm 1 ngày |
| Hộp tính tiền | 15 | 200k | Tự cộng phiếu tính tiền |
| Ghế chờ | 16 | 120k | 4 người chờ, kiên nhẫn chờ +10% |
| Bao than dự phòng | 1 | 40k | Tự mở khi hết than, không mở O01 |
| Thêm 4 dĩa | 1 | 32k | Mua nhiều lần, tới trần tủ |

## 8. Trang trí

Mỗi món có điểm hấp dẫn (+khách đi ngang). Cộng dồn tối đa +3 (+4 từ cấp 19). Không đổi sao đã nhận.

| Đồ (`decor` id) | Cấp | Giá | Hấp dẫn / hiệu ứng |
|---|---:|---:|---|
| Chậu hoa giấy (`bougainvillea-pot`) | 4 | 40k | +0,5 |
| Đèn lồng đỏ (`red-lantern`) | 4 | 35k | +0,5 |
| Đèn lồng giấy (`paper-lantern`) | 4 | 30k | +0,25 |
| Dây đèn nhỏ (`fairy-lights`) | 5 | 45k | +0,5, ca tối +1 khách |
| Hũ sứ (`ceramic-jar`) | 5 | 35k | +0,25 |
| Bảng phấn (`chalk-menu`) | 5 | 30k | +0,5 |
| Lịch treo (`wall-calendar`) | 7 | 15k | +0,25 |
| Radio cũ (`old-radio`) | 8 | 50k | +0,5, khách khuya ngồi lâu hơn (+tiền gọi thêm) |
| Quạt tường (`wall-fan`) | 8 | 60k | Kiên nhẫn +4% |
| TV cũ (`old-tv`) | 9 | 120k | +0,5, tối có đá banh +2 khách (sự kiện D07) |
| Lồng chim (`bird-cage`) | 10 | 70k | +0,25, câu khách riêng |
| Chuối cảnh (`banana-plant`) | 10 | 55k | +0,5 |
| Khung giấy khen (`award-frame`) | — | sự kiện X02 | +0,5 |
| Biển đèn neon (`neon-sign`) | 16 | 300k | +1, +2 khách đi ngang ca tối |
| Bảng hiệu bậc 2 / 3 (`signboard-2/3`) | 10 / 16 | 200k / 500k | +0,5 / +1 |

## 9. Nhiệm vụ ngày (cấp 2)

Mỗi ca 3 mục, chọn theo cơ chế đã mở. Thưởng trả một lần. Tính cả việc đã làm trong ca trước khi nhận nhiệm vụ.

| Mẫu | Mở | Thưởng |
|---|---:|---|
| Lật đúng lúc {n} lần | 2 | 8 XP |
| Không miếng nào cháy đen trong ca | 2 | 10 XP, 10k |
| Châm trà kịp cho mọi bàn | 2 | 10 XP |
| Không khách nào bỏ về vì chờ bàn | 2 | 12 XP, 12k |
| Giao {n} phiếu có biến thể đúng | 2 | 10 XP |
| Nhận {n} review 5 sao | 2 | 10 XP, 10k |
| Làm đúng {n} trứng lòng đào | 2 | 8 XP, 6k |
| Không để bàn nào dơ quá 10 giây | 3 | 12 XP, 10k |
| Phục vụ trọn một bàn 4 người từ 4 sao | 5 | 14 XP, 12k |
| Giao {n} hộp mang về đúng (có bịch nước mắm) | 4 | 10 XP |
| Cơm dư cuối ca không quá {n} phần | 3 | 10 XP, 8k |
| Bán {n} dĩa trong ca | 4 | 14 XP, 12k |
| Phục vụ khách quen "như hôm qua" đúng | 4 | 12 XP |
| Doanh thu ca đạt {n}k | 5 | 15 XP, 18k |
| Tính tiền tay đúng {n} bàn | 4 | 10 XP |
| Giao đơn đặt trước đúng giờ | 7 | 15 XP, 18k |
| Khói không vượt 70 cả ca | 3 | 10 XP |
| Xử lý một tình huống trong ca | 2 | 6 XP, 5k |

## 10. Quảng bá (cấp 11), cứu hết hàng, đơn đặt trước, mâm cơm

| Việc | Chi phí | Hiệu ứng |
|---|---|---|
| Tờ rơi khu trọ | 25k | +4 sinh viên ca tối hôm sau |
| Check-in tặng trà tắc | 20k + trà | +2 khách hôm nay, +người theo dõi |
| Livestream lúc nướng | 0 | Hên xui: +độ hot / khách ăn ké / phản tác dụng nếu cháy miếng trên sóng |
| Chạy ra chợ mua gấp | +30% | Chủ quán rời cảnh 12 s, **bếp vẫn chạy** |
| Nhờ Anh Sáu chở | +15% + 5k | Tới sau 20 s, 25% mua nhầm (sườn non thay sườn…) |
| Mượn quán bên cạnh | 0 (4 phần, 1 lần / ngày) | Mai trả (sự kiện) |
| Treo bảng "hết sườn" | 0 | Món đó tắt tới hết ca, khách gọi món khác (−10% khách mới) |
| Đơn đặt trước | Cọc 30% | Giá theo menu, ≥ 10 phần giảm 5–10%. Trễ ≤ 30 s: −10%. Trễ hơn hoặc thiếu: −30% + review 2 sao. Tối đa 2 đơn / ngày. |
| Mâm cơm công ty (cấp 10) | Cọc 30% | 10–40 phần, giao theo khay 10 phần (hoặc thùng hộp). Có thể ký hợp đồng định kỳ (X05). Đơn đến hạn mà thiếu: khách lấy phần đã xong, trả 70% (bài học Bánh Mì M5). |

## 11. Chỗ tiêu tiền cuối game

- **Hạng quán**, 8 bậc, tổng 30.800k:

  | Bậc | Giá | Mở ở cấp |
  |---:|---:|---:|
  | 1 | 500k | 10 |
  | 2 | 1.000k | 11 |
  | 3 | 1.700k | 12 |
  | 4 | 2.600k | 14 |
  | 5 | 3.800k | 15 |
  | 6 | 5.200k | 17 |
  | 7 | 7.000k | 19 |
  | 8 | 9.000k | 20 |

  Mỗi bậc: +1 khách đi ngang mỗi ca, kiên nhẫn +2%.
- **Nước mắm nhà pha**, 3 bậc: 600k (cấp 15), 1.400k (17), 2.500k (19). Mỗi bậc:
  - mọi dĩa +1k giá bán (cộng dồn +3k);
  - +1 điểm kỳ vọng;
  - câu review riêng ("nước mắm quán tự pha, chan cơm không cần gì thêm").
- **Hội chợ** (cấp 18):
  - Thuê gian 180k mỗi 4 ngày.
  - Ca 4 phút, +10 khách, giá +15%.
  - Lãi thêm ~200–350k nếu chạy kịp.
- **Thử thách** (cấp 20): miễn phí.
  - Đạt lần đầu: +150k, +60 XP, huy hiệu.
  - Lần sau: +75k, +30 XP.

## 12. Mục tiêu cân bằng (PLAYBOOK §6, bộ mô phỏng M5 kiểm)

| Chỉ số | Mục tiêu |
|---|---|
| Thời gian lên cấp (hồ sơ trung bình) | cấp 4 ≈ 10 phút · cấp 7 ≈ 40 phút · cấp 10 ≈ 2 giờ · cấp 20 ≈ 10–12 giờ |
| Một ngày | Một ca: 5 phút (chuẩn bị ~1 · ca 3,5 · chốt ~0,5). Hai ca: 7,5 phút. |
| Lợi nhuận vận hành / ngày | ngày 1 ≈ 100–140k · cấp 5 (2 ca) ≈ 220–280k · cấp 7 ≈ 300–380k · cấp 10 ≈ 450–550k · cấp 15 ≈ 650–750k · cấp 20 ≈ 850–1.000k |
| Số dĩa / ngày | ngày 1: 9–12 · cấp 10: 45–60 (2 ca, gồm hộp) · cấp 20: 75–95 (gồm mâm cơm) |
| Lên quán | Đủ 350k vào khoảng ngày 6–8 nếu không mua đồ thừa |
| Cuối game | Tới cấp 20 đã mua 7/8 bậc hạng quán, còn 4–10 triệu cho bậc cuối và nước mắm nhà pha |
| Kẹt | 0 lần ở cả 3 hồ sơ (ký gửi + cứu hết hàng + bao than dự phòng + hộp ăn tại chỗ khi hết dĩa) |
| Hao | Người trung bình: ≤ 10% số miếng nướng bị cháy đen, cơm dư ≤ 15% số phần nấu. Người ẩu ≤ 25% mà vẫn có lời. |
| Khách bỏ về | Người trung bình ≤ 12% số khách / ca. Người ẩu ≤ 30%. |

Các núm chỉnh ưu tiên trong M5:
- số khách theo cấp;
- kiên nhẫn chờ bàn;
- thời gian ăn;
- tốc độ chín một mặt;
- độ rộng vùng chín (hiện 100–114);
- tốc độ cháy than;
- phí ca;
- giá bán.

Giữ nguyên tỉ lệ biên giữa các món.
