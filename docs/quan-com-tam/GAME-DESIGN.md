# Quán Cơm Tấm

> **Chủ dự án đã duyệt M0 (20/11/2026):** hai ca trưa + tối (chọn ca từ cấp 5); cô chủ đi bộ thật trong cảnh để bưng dĩa; tính tiền tay, ngày 1–3 có nút "Tính đúng" tự động, cấp 15 có máy tính tiền; giữ 13 vai (có worker2 / student2); cô chủ là nữ như thumbnail.

> **Milestone 0, chờ chủ dự án duyệt.** Các quyết định cần chốt: DEV-NOTES.md, mục "Quyết định cần chủ dự án".

Lụm Kèo · Tập Làm Chủ · Milestone 0 · Game id `quan-com-tam` · Web một người chơi, tiền ảo.

Đọc cùng:
- [ECONOMY.md](ECONOMY.md): số liệu.
- [DRAMA.md](DRAMA.md): kịch bản, lỗi, review.
- [SCREENS.md](SCREENS.md): màn hình.
- [ART-DIRECTION.md](ART-DIRECTION.md): art, thước đo, toạ độ.
- [asset-spec.json](asset-spec.json): hợp đồng asset.

Chuẩn chung: `docs/tap-lam-chu/PLAYBOOK.md`.

## 1. Pitch

Sáu giờ tối, vỉa hè còn hơi nóng, than đã đỏ. Người chơi là **cô chủ một quán cơm tấm vỉa hè**: bốn cái ghế nhựa, hai cái bàn thấp, một bếp than dài và một nồi cơm điện. Việc trong ca:
- Lật sườn cho kịp lúc mỡ còn xèo.
- Canh nồi cơm tấm sắp cạn.
- Bày dĩa đủ lớp cho đội thợ công trình mới tan ca.
- Chạy ra châm trà đá, rồi lau bàn cho nhóm sinh viên đang đứng chờ.

Ai cũng có một câu dặn riêng: "không bì", "trứng lòng đào", "nước mắm để riêng", "cho chị miếng sườn cháy cạnh". Còn Anh Sáu xe ôm thì "ghi sổ nghen". Từ quán vỉa hè lên **quán có mái**, rồi thành **quán cơm tấm nổi tiếng** có người đứng chờ tới đầu hẻm.

Mỗi ca có ba câu hỏi:
- *Than còn đủ không, vùng nào nóng?*
- *Lật miếng nào trước, bưng dĩa nào trước?*
- *Bàn nào dọn trước để khách mới kịp ngồi?*

## 2. Khác hai game chị em ở đâu

| | Tiệm Trà Sữa | Tiệm Bánh Mì | **Quán Cơm Tấm** |
|---|---|---|---|
| Nguồn hàng | Pha khi có đơn | Nướng bánh trước theo mẻ, bánh nguội dần | **Bếp than nhiều chỗ, nướng liên tục**: mỗi miếng 2 mặt, phải lật đúng lúc. Ba vùng nhiệt (nóng / vừa / giữ ấm). Than cháy dần, phải thêm than. Quạt cho lửa bùng thì sinh khói. |
| Kỹ năng chính | Định lượng đường, đá | Canh lò + tồn bánh, ráp 9 bước | **Đa nhiệm theo không gian**: bếp (lật, thêm than, quạt), nồi cơm (mẻ, hết tấm), bày dĩa xếp lớp, và **phục vụ tại bàn** (mời ngồi, châm trà, bưng, tính tiền, dọn, lau). |
| Khách | Đứng quầy, mua mang đi | Đứng hàng, mua mang đi | **Ngồi ăn tại bàn**. Số ghế giới hạn khách. **Bàn dơ chặn khách mới**, nên vòng quay bàn là điểm nghẽn chính. Khách ngồi còn gọi thêm cơm, thêm trà, xin khăn lạnh. Shipper lấy **hộp mang về** ở quầy. |
| Thời gian | Một ca, 2 mốc tăng khách | Một ca, 3 buổi | **Hai ca tách riêng**: ca trưa (dân văn phòng dồn 45 phút, nhiều hộp mang về) và ca tối / khuya (sinh viên, thợ công trình, tài xế, điều dưỡng, bàn nhậu). Được chọn mở ca nào. |
| Đơn lớn | 3 ly | Đơn 6–30 ổ, ráp ×N | **Mâm cơm công ty** 10–40 dĩa / hộp, đặt trước, giao theo khay. **Đơn nhóm tại bàn**: 4 thợ ngồi bàn 4, mỗi người một kiểu. |
| Tiền | Doanh thu | Tiền lẻ là tài nguyên | **Tính tiền tại bàn**: cộng món đã ăn, thêm cơm, khăn lạnh 2k (trà đá miễn phí). **Sổ ghi nợ** cho khách quen. |
| Đồ dùng | Ly | Giấy gói, túi | **Dĩa sạch là tài nguyên**: dĩa dơ dồn vào thau, hết dĩa sạch thì phải rửa (hoặc thuê người rửa). |
| Phiếu kiểu Việt | Mức đường, đá | "Ổ ba chục", "như cũ" | "Thêm cơm", "cơm thêm mỡ hành", "không bì", "trứng lòng đào", "nước mắm để riêng", "sườn cháy cạnh", "dĩa đặc biệt", "ghi sổ". |
| Năng lượng | — | Bình gas | **Than** (bao than, rổ than thêm vào bếp) + **khói** (đồng hồ khói, hàng xóm phàn nàn). |
| Tiến trình | Một tiệm | Xe đẩy → tiệm → nổi tiếng | **Quán vỉa hè** (cấp 1–6, `street-scene`) → **quán có mái** (cấp 7, `quan-scene`) → **quán nổi tiếng** (cấp 16+). Mở thêm bàn, bếp thứ hai, phụ bàn. |

Giữ lại từ hai game trước (đã chứng minh, chép khung code Bánh Mì):
- Đơn nhiều phần.
- Nhiệm vụ ngày.
- Hai nhà cung cấp.
- Quảng bá.
- Gói ký gửi chống kẹt.
- Cứu hết hàng giữa ca.
- Drama Engine.
- Review và trả lời theo tính cách chủ quán (đổi được trên từng review).
- Nhật Ký Làm Chủ.
- Đơn đặt trước và hợp đồng định kỳ.
- Hội chợ, thử thách, huy hiệu.
- 20 cấp.
- Hạng quán làm chỗ tiêu tiền cuối game.
- Chơi lại ngày hôm nay; chơi lại từ đầu có backup.

## 3. Vòng chơi một ngày

| Nhịp | Người chơi làm | Quyết định và hậu quả |
|---|---|---|
| **Chuẩn bị** (ngoài giờ) | Chọn menu 3–7 món. Xem dự báo khách theo ca. Nhập hàng (Cô Ba chợ, Chú Hòa vựa từ cấp 9). Ướp sườn (số miếng ướp sẵn = số miếng bán được). Nấu **mẻ cơm đầu**, làm **hũ mỡ hành**, chọn **mở ca trưa / ca tối** (từ cấp 5). Xem đơn đặt trước, mâm cơm. | Ướp dư thì sườn ướp để qua ngày mất điểm tươi. Ướp thiếu thì hết sườn giữa ca. Mở cả hai ca thì gấp đôi tiền, nhưng cũng gấp đôi than, gạo và mệt. |
| **Ca trưa** (11:00–13:00, cấp 5+, ~2 phút 30 giây thực) | Dân văn phòng tới dồn trong 45 phút, ngồi nhanh, ăn nhanh, đòi tính tiền nhanh. Shipper lấy 2–6 hộp. | Kiên nhẫn ngắn. Bàn dơ là mất khách ngay. Mâm cơm công ty hay giao ca này. |
| **Nghỉ giữa ca** (chỉ khi mở 2 ca) | Màn ngắn: rửa chén, nấu thêm cơm, nhập gấp, xử lý sự kiện giữa ca. | Không tính giờ. Tối đa 1 sự kiện. |
| **Ca tối** (17:30–23:00, ~3 phút 30 giây thực) | Ba nhịp: **tối sớm** (sinh viên, điều dưỡng đổi ca), **cao điểm** 18:30–20:00 (đông nhất, nhóm 2–4), **khuya** 21:00+ (thợ công trình, tài xế, bàn nhậu, khách ghi sổ). | Cao điểm thử bếp; khuya thử phục vụ (bàn ngồi lâu, gọi thêm, hát hò). |
| **Chốt ngày** | Doanh thu, giá vốn, hao (sườn cháy, cơm dư, dĩa bể), than, phí ca, sổ nợ, review, trả lời review, Nhật Ký, nhiệm vụ. | Nâng cấp, trang trí, chuẩn bị ngày mới. Chơi lại ngày hôm nay nếu muốn. |

Đồng hồ ca dừng khi mở hội thoại, bảng phủ, tạm dừng hoặc rời tab. Một ngày một ca ≈ 5 phút; hai ca ≈ 7,5 phút.

### 3.1 Bếp than (trái tim của game)

- **Vỉ 6 chỗ, chia 3 vùng.**
  - Hai chỗ trái **nóng**: ×1,5 tốc độ chín.
  - Hai chỗ giữa **vừa**: ×1.
  - Hai chỗ phải **giữ ấm**: ×0,25, không cháy trước 60 giây.
  - Bếp 2 (cấp 14) thêm 6 chỗ cùng luật.
- **Than.** Đồng hồ than 0–100 cháy dần (khoảng −0,5 mỗi giây ca). Mức than quyết định cả bếp:
  - ≥ 60: **rực** (+20% tốc độ).
  - 30–59: **vừa**.
  - 10–29: **yếu** (−40%).
  - < 10: **tàn** (không chín nữa).
  - **Thêm than** (một chạm, trừ 1 rổ than trong kho): mức than +35 sau 4 giây bén lửa. Thêm khi bếp đang rực thì lửa bùng (`grill-flare`): miếng ở vùng nóng chín nhanh gấp đôi trong 3 giây, dễ cháy.
- **Quạt** (giữ nút / giữ phím `F`): cả bếp +1 nấc nhiệt trong lúc quạt, nhưng than tốn ×2. Đồng hồ khói tăng theo thời gian quạt và theo số miếng sắp cháy.
  - Khói ≥ 70: khách ngồi gần bếp ho, kiên nhẫn −; có thể mở sự kiện hàng xóm (D03).
  - Quạt máy (cấp 12) tự quạt nhẹ, không tốn tay.
  - Chụp hút khói (cấp 8) giảm khói 60%.
- **Mỗi miếng có 2 mặt.** Mỗi mặt chạy 0 → 100 → 125:
  - < 60: sống.
  - 60–99: tái.
  - **100–114: chín**.
  - 115–129: cháy cạnh.
  - ≥ 130: cháy đen.
- **Lật**: chạm miếng (hoặc phím số). Mặt dưới đổi lên trên. Lật sớm khi mặt dưới còn sống thì mặt đó "tái", phải lật lại sau. Lật đúng lúc (100–114) có tiếng xèo và +1 điểm "tay nướng" cho nhiệm vụ.
- **Kết quả miếng** = mặt kém hơn trong hai mặt:
  - Chín hai mặt: chuẩn.
  - Một mặt cháy cạnh: "sườn cháy cạnh". Khách dặn cháy cạnh thì thích; khách văn phòng trừ nhẹ.
  - Có mặt tái hoặc sống: **sườn sống**. Lỗi nặng, trần 1 sao; có hội thoại xin lỗi nghiêm túc.
  - Cháy đen: không bán được, ghi hao.
- **Thời gian chín một mặt ở vùng vừa, than vừa:**

  | Món | Một mặt |
  |---|---|
  | Sườn cốt lết | 9 giây |
  | Sườn non | 14 giây |
  | Gà nướng | 12 giây |
  | Lạp xưởng | 5 giây (lăn thay vì lật: 2 lần) |
  | Đậu hũ / chả chay nướng | 6 giây |

- **Giữ ấm**: miếng chín kéo sang vùng phải. Độ tươi giảm −1 mỗi 3 giây (dưới 60 là "sườn khô", trần 4 sao). Không cháy trước 60 giây.
- **Nướng sẵn** trước cao điểm là chiến thuật đúng nhưng có giá:
  - Vùng giữ ấm chỉ có 2 chỗ.
  - Tủ kính (cấp 3) giữ thêm 6 miếng, tươi giảm chậm hơn 40%.

### 3.2 Trạm cơm, trứng, chả, canh

- **Nồi cơm.** Cần gạo tấm.
  - Nồi nhỏ 12 phần (vỉa hè), nồi lớn 20 phần (cấp 7), nồi thứ hai (cấp 12).
  - Bấm Nấu: 40 giây ca (không cần canh, nhưng không lấy cơm được trong lúc nấu).
  - Viên Cơm trên HUD hiện số phần còn lại; vàng khi ≤ 3.
  - **Hết cơm** giữa ca: khách chờ nồi mới hoặc đổi sang "bánh mì sườn" (cứu nóng, ECONOMY §9).
  - Cơm dư cuối ca là hao. Ngày mai bán được "cơm chiên" nếu có chảo (cấp 2): 50% số dư, giá 20k, câu riêng.
- **Gạo tấm** là hàng kho riêng. Hết gạo tấm thì không nấu được nữa. Cứu bằng mượn hàng xóm hoặc nấu gạo thường; gạo thường bị khách sành chê "đâu phải cơm tấm" (trần 4 sao).
- **Mỡ hành.**
  - Hũ 20 phần, làm ở Chuẩn bị hoặc giữa ca: 8 giây ở bếp phụ, tốn mỡ heo + hành lá.
  - Phiếu "thêm mỡ hành" dùng 2 phần.
  - Cơm chay dùng **hành phi** (không mỡ heo).
- **Trứng ốp la** (cấp 2).
  - Chảo 1 trứng (chảo đôi cấp 8).
  - Trạng thái:

    | Trạng thái | Giây |
    |---|---|
    | Sống | < 6 |
    | **Lòng đào** | 6–9 |
    | Lòng vừa | 9–13 |
    | Chín kỹ | 13–18 |
    | Cháy | > 18 |

  - Phiếu "trứng lòng đào" phải lấy ra ở 6–9 giây. Mặc định chấp nhận lòng đào hoặc lòng vừa.
- **Chả trứng hấp** (cấp 4): xửng hấp khay 8 miếng, 30 giây, giữ ấm tới hết ca.
- **Bì** (cấp 3): khay bì mua sẵn của Cô Ba, không cần nấu.
- **Canh** (cấp 5): nồi canh 30 chén. Khách ăn tại chỗ được một chén miễn phí (bưng kèm dĩa, hoặc bưng sau khi khách đòi "cho chén canh"). Cấp 5+ quên canh thì trừ nhẹ kỳ vọng.

### 3.3 Bày dĩa (xếp lớp, nhìn thấy dĩa đầy dần)

Phiếu ghim vào **ô bày**. Mỗi ô giữ một dĩa (hoặc một hộp), ô đôi từ cấp 6. Các bước:

1. **Dĩa / hộp**: tại bàn dùng dĩa; mang về dùng hộp. Dĩa lấy từ chồng dĩa sạch.
2. **Cơm**: một vá. "Thêm cơm" thì vá hai.
3. **Mỡ hành** rưới (mặc định). Phiếu "thêm mỡ hành" thì 2 phần; "không mỡ hành" thì bỏ qua.
4. **Món nướng**: gắp từ vỉ hoặc vùng giữ ấm. Hiện độ chín và độ tươi trên từng miếng; chọn được miếng cháy cạnh cho người dặn.
5. **Bì** (phiếu "không bì" thì bỏ qua).
6. **Chả** (một miếng từ xửng).
7. **Trứng** (từ chảo, đúng độ lòng).
8. **Đồ chua**, **dưa leo + cà chua** (bật / tắt).
9. **Nước mắm**: **chan** lên cơm / **chén riêng** / **bịch riêng** (mang về bắt buộc bịch). Mặc định theo nhóm khách (thợ: chan; văn phòng: chén riêng). Phiếu "nước mắm để riêng" bắt buộc chén hoặc bịch.
10. **Ớt** (tuỳ phiếu), **ngò rắc** (dĩa đặc biệt).
11. **Giao**:
    - Tại bàn: bưng ra bàn (chủ quán đi tới bàn; mất 1,2–2,5 giây theo khoảng cách) hoặc giao phụ bàn.
    - Mang về: đóng hộp, bỏ túi, đưa shipper ở quầy.

Dĩa trên ô to dần theo lớp sprite `plate-layers` (cận cảnh `plate-layers-hd`). Sửa được bước gần nhất trước khi giao; lớp đã bỏ vẫn tính hao. **Dĩa đặc biệt** = sườn + bì + chả + trứng + ngò, xếp theo thứ tự đẹp. Đúng thứ tự (bì cạnh sườn, trứng trên cùng) thì +3 điểm kỳ vọng "đẹp như hình".

**Bày ×N** (cấp 6): phiếu bàn 4 người cùng món thì đặt 2–4 dĩa lên ô dài. Mỗi chạm áp cho cả hàng; dĩa khác biệt ("dĩa này không bì") có nhãn đỏ.

### 3.4 Phục vụ tại bàn

Mỗi bàn có vòng trạng thái, hiện bằng biểu tượng nổi trên bàn và trên danh sách Bàn:

| Bước | Hành động | Ghi chú |
|---|---|---|
| Khách tới | Đứng ở `waitSpots`, bong bóng số người | Chạm khách rồi chạm bàn trống sạch đủ chỗ (bàn hợp lệ sáng lên). Từ cấp 9, phụ bàn tự xếp chỗ. Nhóm 3–4 cần bàn 4 (quán) hoặc **ghép 2 bàn 2** (vỉa hè: hai bàn cạnh nhau cùng trống, một chạm "Ghép bàn"). Chờ quá kiên nhẫn thì bỏ về. |
| Ngồi | Bàn đổi `set`; khách `sit-wait` | Ly trà đá rỗng: chạm **Châm trà** (0,8 giây, tốn 1 phần trà đá). Không châm trong 12 giây thì kiên nhẫn giảm nhanh gấp đôi. |
| Gọi món | Chạm bàn: **Lấy phiếu**, mỗi người một phiếu | Phiếu vào thanh phiếu (màu theo bàn). |
| Chờ món | | Kiên nhẫn chạy. Ly trà vơi dần (mỗi 20 giây), khách `sit-call` khi hết. |
| Bưng món | Giao từ ô bày | Bưng nhầm bàn = lỗi. Tráo dĩa giữa hai người cùng bàn = lỗi. |
| Ăn | `sit-eat` 25–40 giây ca | Gọi thêm giữa bữa (bong bóng): "thêm cơm" (+4k, một vá, bưng chén cơm), "thêm trà đá", "khăn lạnh" (2k), "cho chén canh", "thêm nước mắm". |
| Tính tiền | Khách `sit-call` "tính tiền" | Phiếu tính tiền liệt kê món + phần gọi thêm. Người chơi **chạm từng dòng để cộng**. Ngày 1–3 có nút "Tính đúng"; hộp tính tiền (cấp 15) tự cộng. Trả tiền mặt, chuyển khoản hoặc **ghi sổ** (khách quen). |
| Rời bàn | Bàn thành `dirty` | Chạm **Dọn** (1,5 giây: dĩa vào thau) rồi **Lau** (1 giây, `wet` rồi `clean`). Bàn dơ lâu thì khách đứng chờ "nhìn bàn dơ" mất kiên nhẫn; khách ngồi bàn bên cạnh trừ điểm phục vụ. |

- **Dĩa sạch.**
  - Chồng dĩa: 10 (vỉa hè) / 16 (quán) / 24 (tủ chén cấp 13).
  - **Rửa chén** (chạm thau): 6 giây cho 6 dĩa, chủ quán đứng ở thau, không làm việc khác.
  - Dì Năm rửa chén (cấp 13) tự rửa 1 dĩa mỗi 2 giây.
  - Hết dĩa thì khách mới phải chờ, hoặc **dùng hộp giấy ăn tại chỗ** (tốn hộp, khách kêu "ăn hộp như ăn vội").
- **Chủ quán di chuyển thật trong cảnh** (bếp ↔ bàn ↔ thau). Trong lúc đi, bếp vẫn chạy. Đây là căng thẳng chính: bưng dĩa ra bàn xa thì miếng sườn trên vùng nóng có thể cháy.
  - Phụ bàn Bông (cấp 9) nhận việc bưng, châm, dọn, lau theo hàng đợi việc (tối đa 3 việc xếp chờ). Chủ quán ở lại bếp.

### 3.5 Hộp mang về

- Shipper đứng `queueSpots` trước quầy.
- Phiếu 1–6 hộp, có thể cho 2–3 đơn app khác nhau, kiên nhẫn ngắn.
- Mang về bắt buộc:
  - hộp,
  - **bịch nước mắm riêng**,
  - túi (từ 2 hộp).
- Đồ chua, dưa leo bỏ chung hộp.
- Không ăn tại bàn nên không tốn dĩa, không tốn bàn. Đây là đường xả áp lực khi quán hết ghế, nhưng biên lời thấp hơn 3k vì tiền hộp.

### 3.6 Phiếu kiểu Việt

| Kiểu phiếu | Ví dụ | Luật |
|---|---|---|
| Biến thể món | "không bì", "không mỡ hành", "thêm mỡ hành", "không đồ chua", "nhiều dưa leo" | Hiện chữ + icon gạch / mũi tên. |
| "Thêm cơm" | Ngay lúc gọi, hoặc gọi thêm giữa bữa | Lúc gọi: vá hai trên dĩa (+4k). Giữa bữa: bưng chén cơm thêm (+4k, nhớ ghi vào phiếu tính tiền). |
| "Trứng lòng đào" | | Trứng 6–9 giây. |
| "Nước mắm để riêng" | | Chén riêng (tại bàn) hoặc bịch (mang về). Chan vào là lỗi. |
| "Sườn cháy cạnh" | | Miếng có một mặt 115–129. Chín đều cũng được, nhưng −5 kỳ vọng. |
| "Dĩa đặc biệt" | "Cho anh dĩa đặc biệt, đói lắm rồi" | Đủ 4 món mặn + ngò; xếp đẹp được +3. |
| "Như hôm qua" | Khách quen | Phiếu ẩn, xem ở **Sổ khách quen**. Hiện sau 2 lần phục vụ ≥ 4 sao. |
| "Ghi sổ" | Anh Sáu, chú Tư, khách quen thân | Khi tính tiền, khách chọn ghi sổ. Tiền vào **Sổ nợ**. Trả nợ qua sự kiện. Hạn mức sổ nợ theo cấp (ECONOMY §4). |
| Đơn bàn nhóm | 4 thợ: "hai sườn trứng, một đặc biệt không bì, một sườn bì chả thêm cơm" | Mỗi người một phiếu cùng màu bàn. Giao đủ thì bàn vui. Tráo giữa người trong bàn = lỗi tráo dĩa. |
| Mâm cơm công ty | "40 phần, 11 giờ 30, 10 phần chay" | Đơn đặt trước có giờ giao, cọc 30%, giao bằng khay / thùng hộp. |

### 3.7 Khách

| Nhóm (vai sprite) | Kiên nhẫn | Ca hay tới | Cỡ nhóm | Đặc tính |
|---|---:|---|---|---|
| Dân văn phòng (`office`) | 40 s | Trưa | 1–2 | "Nước mắm để riêng", "ít cơm", ăn nhanh, chuyển khoản, ghét bàn dơ. |
| Thợ công trình (`worker`, `worker2`) | 55 s | Tối khuya, trưa | 2–4 | "Thêm cơm" (40%), nước mắm chan đẫm, dĩa đặc biệt, khăn lạnh, tiền mặt, ghi sổ nếu quen. |
| Sinh viên (`student`, `student2`) | 50 s | Tối | 2–3 | Món rẻ (bì chả, sườn), "xin thêm cơm miễn phí được không", chia tiền lẻ từng người. |
| Shipper (`shipper`) | 35 s | Trưa, tối | — (đứng quầy) | Hộp mang về, nhiều đơn, bịch nước mắm riêng bắt buộc. |
| Khách quen (`regular`) | 75 s | Tối khuya | 1 | Cô chú trong xóm, "như hôm qua", ghi sổ, kể chuyện, ngồi lâu. |
| Reviewer (`reviewer`) | 55 s | Bất kỳ, danh tiếng ≥ 55 | 1–2 | Chấm kỹ: đẹp dĩa, độ chín, trà đá. Quay clip. |
| Tài xế đêm (`driver`) | 45 s | Khuya | 1 | Ăn nhanh, "sườn cháy cạnh", trà đá liên tục (ly vơi nhanh gấp đôi). |
| Điều dưỡng ca đêm (`nurse`) | 45 s | Tối sớm, khuya | 1–2 | "Trứng lòng đào", "ít mỡ hành", hay mua thêm hộp cho đồng nghiệp. |
| Khách du lịch (`tourist`) | 60 s | Tối, cấp 8+ | 1–2 | Phiếu hình. Hỏi "broken rice?". Chụp ảnh dĩa. Tip. Thử ớt. |

Số khách mỗi ca:
- Ngày 1: 8–11 người ngồi + 0–2 shipper.
- Cấp 20: 34–44 mỗi ca tối và 22–28 ca trưa, cộng mâm cơm.
- Số người đứng chờ bàn tối đa: 2 (vỉa hè) / 3 (quán) / 4 (ghế chờ, cấp 16).

### 3.8 Chấm điểm và sao

Điểm mỗi dĩa 0–100:

| Phần | Điểm | Chi tiết |
|---|---:|---|
| **Công thức** | 45 | Đúng món 20 · đủ lớp 15 · đúng biến thể 10 |
| **Nướng** | 20 | Chín 20 · cháy cạnh 16 (20 nếu khách dặn) · khô 14 · tái 0 |
| **Thời gian** | 20 | Từ lúc gọi tới lúc dĩa xuống bàn: trước nửa kiên nhẫn 20, sát hạn 4 |
| **Phục vụ** | 15 | Trà đá châm kịp 5 · bàn sạch lúc ngồi 4 · canh (cấp 5+) 3 · tính tiền ≤ 6 giây sau khi gọi 3 |

- Mốc sao 1 / 2 / 3 / 4 / 5 tại 0 / 40 / 55 / 70 / 85.
- Sao của bàn = trung bình các người trong bàn. Review viết theo người có điểm thấp nhất, nếu chênh ≥ 2 sao.
- Trần sao theo lỗi: DRAMA.md §3.

## 4. Điều khiển

### Desktop (chuột + phím, mốc 1366×768 dpr 1,25)

| Việc | Chuột | Phím |
|---|---|---|
| Lật / gắp miếng trên vỉ | Chạm miếng (trên Thanh Bếp hoặc trong cảnh) | `1`–`6` (bếp 2: `Shift+1..6`). Miếng chín hai mặt thì chạm lần nữa: gắp sang ô bày đang mở, hoặc sang vùng giữ ấm nếu ô bày chưa cần. |
| Bỏ miếng sống lên vỉ | Chạm khay sườn ướp, rồi chạm chỗ trống | `G`: bỏ món của phiếu đầu tiên vào chỗ trống nóng nhất |
| Thêm than / quạt | Nút Than / giữ nút Quạt | `C` / giữ `F` |
| Nấu cơm · chiên trứng · hấp chả | Chạm thiết bị | `R` · `E` · `H` |
| Bước bày kế tiếp / thêm lớp | Chạm ô trên dải bày | `Q W E R T Y U I O` (khi ô bày mở, phím chuyển sang dải); `Space` = bước mặc định theo phiếu |
| Đổi lượng (nước mắm chan / chén / bịch; cơm 1 / 2 vá) | Chạm lại ô (xoay vòng) | `↑ ↓` |
| Hoàn tác | Nút Hoàn tác | `Backspace` |
| Giao | Nút Giao | `Enter` |
| Bàn: mời ngồi, châm trà, lấy phiếu, tính tiền, dọn, lau | Chạm bàn: làm **việc đang chờ** của bàn đó (biểu tượng trên bàn). Chạm khách đang chờ rồi chạm bàn để xếp chỗ. | `Alt+1..5` = làm việc đang chờ của bàn 1–5 |
| Rửa chén | Chạm thau | `W` (khi ô bày đóng) |
| Đổi phiếu / ô bày | Chạm phiếu | `Tab` |
| Tạm dừng / Cách chơi | | `Esc` / `?` |

### Mobile 390×844 (một tay, ngón cái)

- **Thanh Bếp** luôn hiện ngay dưới cảnh:
  - 6 chip vỉ (mỗi chip 56×56, vòng độ chín 2 mặt, màu vùng),
  - nút Than,
  - nút Quạt (giữ),
  - viên Cơm, viên Dĩa sạch.
  - Lật được ở mọi màn trừ hội thoại. **Không bao giờ phải rời màn bày dĩa để cứu miếng sườn.**
- Cảnh hiện **toàn bộ** ở hệ số 1,0 (SCREENS.md), nên thấy mọi bàn cùng lúc. Chạm bàn thì làm việc đang chờ. Chạm giữ bàn thì mở vòng lựa chọn.
- Dock dưới 5 nút cao 56 px: **Dĩa · Bàn · Bếp · Kho · Sổ**.
  - **Dĩa**: ô bày + dải lớp, 2 hàng ô 48 px.
  - **Bàn**: danh sách việc theo bàn, sắp theo gấp.
  - **Bếp**: bếp lớn cận cảnh + nồi cơm, chảo, xửng, canh.
- Kéo thả là tuỳ chọn. Mọi việc làm được bằng chạm.

## 5. Các hệ thống

| Hệ thống | Mở | Tóm tắt (số ở ECONOMY.md) |
|---|---|---|
| Bếp than + vùng nhiệt + quạt + khói | 1 | §3.1. Bếp 2 ở cấp 14. Quạt máy cấp 12. Chụp hút khói cấp 8. |
| Than | 1 | Bao than trong kho, rổ than thêm vào bếp. Viên Than trên HUD vàng < 25%, đỏ < 10%. **Hết than giữa ca**: sự kiện O01. |
| Nồi cơm + gạo tấm | 1 | §3.2. Hết cơm, hết gạo: hội thoại cứu. Nồi hư: O03. |
| Bày dĩa xếp lớp | 1 | §3.3. Bày ×N cấp 6. |
| Phục vụ tại bàn + dĩa sạch | 1 | §3.4. Vỉa hè: 2 → 4 bàn 2 chỗ (ghép bàn). Quán: 3 → 5 bàn (2 bàn 4 chỗ). |
| Hộp mang về | 4 | §3.5. |
| Tính tiền + sổ nợ | 1 / 6 | Ngày 1–3 có nút "Tính đúng". Sổ nợ chính thức ở cấp 6 (trước đó chỉ Anh Sáu qua sự kiện K03). |
| Nhiệm vụ ngày | 2 | 3 mục mỗi ca từ ~18 mẫu. Tính cả việc đã làm trước khi nhận nhiệm vụ. |
| Hai nhà cung cấp | 1 / 9 | **Cô Ba** (sạp thịt chợ: sườn, bì, chả, trứng, rau, giao gấp trong ca +15%) và **Chú Hòa** (vựa gạo than, cấp 9: gạo tấm, than, hộp, dĩa, gói to rẻ 10%, chỉ giao trước ca). |
| Đơn đặt trước + mâm cơm công ty | 7 / 10 | Đơn đặt trước: tối đa 2 đơn / ngày, cọc 30%. Mâm cơm: 10–40 phần, giao theo khay, có thể ký hợp đồng định kỳ (X05). |
| Quảng bá | 11 | Tờ rơi khu trọ (+sinh viên), "check-in tặng trà tắc" (+người theo dõi), livestream lúc nướng (hên xui). Một lần mỗi ngày. |
| Gói ký gửi | luôn có | Khi tiền + hàng không đủ làm một dĩa cơm sườn: Cô Ba gửi gói "10 dĩa cơm sườn" (sườn ướp, gạo tấm, đồ chua, nước mắm, 1 rổ than). Trừ dần giá vốn khi bán; vượt sức chứa được. Một lần mỗi ngày + một lần giữa ca khi hết tiền. **Không bao giờ kẹt.** |
| Hết hàng giữa ca | luôn có | Nhắc khi còn ≤ 2 phần. Hết hẳn thì mở hội thoại, chọn một trong:<br>- chạy ra chợ (chủ quán rời cảnh 12 giây, bếp vẫn chạy!);<br>- nhờ Anh Sáu chở (20 giây);<br>- mượn quán bên cạnh;<br>- đổi món;<br>- treo bảng "hết sườn";<br>- ký gửi.<br>Luôn có lựa chọn miễn phí. |
| Drama Engine | 1 | DRAMA.md:<br>- tối đa 1 sự kiện trong mỗi ca + 1 giữa hai ca / sau ngày;<br>- mỗi tình huống nghỉ ≥ 2 ngày;<br>- cứ ba sự kiện có một chuyện vui. |
| Review + trả lời theo tính cách | 1 | 4 tính cách (Hiền lành / Cục súc / Lầy lội / Sale-man), chọn ở màn chào, **đổi ngay trên từng review**. |
| Nhật Ký Làm Chủ | 1 | Câu chốt ngày kiểu caption meme theo dữ kiện ca. Thẻ 1080×1350 lưu PNG / chia sẻ. |
| Nâng cấp + trang trí | 1 / 4 | Trang trí kéo thả; không đặt lên lối đi, bàn, ghế. Trần hấp dẫn +3 (+4 từ cấp 19). |
| Ba giai đoạn | 1 / 7 / 16 | Vỉa hè (`street-scene`) → thuê mặt bằng lên **quán** (`quan-scene`, 350k, cảnh chuyển) → **quán nổi tiếng** (bảng hiệu bậc 3, ghế chờ, reviewer thường xuyên). |
| Phụ bàn Bông | 9 | Nhận việc bưng / châm / dọn / lau theo hàng đợi việc. 40k mỗi ca. Cấp 17: làm 2 việc liên tiếp không cần quay về chỗ. |
| Hội chợ | 18 | "Đêm hội ẩm thực bờ sông": thuê gian 180k, ca 4 phút, +10 khách, giá +15%, toàn nhóm 2–4 người. Mỗi 4 ngày. |
| Thử thách + huy hiệu | 20 | 5 thử thách xoay vòng:<br>- Một bếp, ca khuya;<br>- Không cháy miếng nào;<br>- Trưa không phụ bàn;<br>- Ngày toàn mang về;<br>- Mâm 40 phần.<br>14 huy hiệu. |
| Hạng quán | 10 | 8 bậc mua bằng tiền, chỗ tiêu tiền cuối game. Thêm **Nước mắm nhà pha** 3 bậc (cấp 15). |
| Chơi lại | luôn có | **Chơi lại ngày hôm nay**: ở Tạm dừng và Chốt ngày, có xác nhận, cất `….before-replay`, ảnh đầu ngày `….day`.<br>**Chơi lại từ đầu**: ở Cách chơi và Tạm dừng, có xác nhận, cất `….backup`, tắt ghi trong lúc xoá.<br>Khoá lưu `wgp.quancomtam.v1`. |

## 6. Bảng 20 cấp

XP tích luỹ dò bằng bộ mô phỏng M5 (`tools/sim/fit.mjs`, người chơi trung bình): cấp 4 ≈ 10 phút, 7 ≈ 40 phút, 10 ≈ 2 giờ, 20 ≈ 11 giờ. Bảng M0 (theo Bánh Mì) ở `core/state.js` `LEVELS_V2`; bản lưu cũ nâng giữ cấp + %.

| Cấp | XP | Mở khoá | Giai đoạn |
|---:|---:|---|---|
| 1 | 0 | Quán vỉa hè, bếp than 1 (6 chỗ, 3 vùng), nồi cơm 12, 10 dĩa, **2 bàn × 2 chỗ**, **cơm sườn**, trà đá, ca tối, ký gửi, "Tính đúng" | Vỉa hè |
| 2 | 40 | **Trứng ốp la** (chảo), cơm sườn trứng, phiếu "trứng lòng đào", nhiệm vụ ngày, cơm chiên từ cơm dư | Vỉa hè |
| 3 | 75 | **Bì** + **cơm sườn bì**, phiếu "không bì", **bàn 3**, tủ kính giữ ấm 6 miếng | Vỉa hè |
| 4 | 110 | **Chả trứng hấp** (xửng) + sườn bì chả, **hộp mang về** (shipper), trang trí | Vỉa hè |
| 5 | 200 | **Ca trưa** (dân văn phòng), **cơm bì chả** (không cần bếp), **nồi canh**, **bàn 4**, ghép bàn | Vỉa hè |
| 6 | 315 | **Dĩa đặc biệt**, bày ×N + ô bày đôi, **sổ nợ** chính thức, mái bạt (mưa chỉ −15% khách) | Vỉa hè |
| 7 | 445 | **Lên quán**: thuê mặt bằng 350k, `quan-scene`, 3 bàn (2 bàn 2 + 1 bàn 4), nồi cơm lớn 20, 16 dĩa, **đơn đặt trước**, kho lớn, phí ca tăng | Quán |
| 8 | 660 | **Gà nướng**, chụp hút khói, chảo đôi, khách du lịch, reviewer thường hơn | Quán |
| 9 | 980 | **Phụ bàn Bông**, **nhà cung cấp 2** (Chú Hòa) | Quán |
| 10 | 1.525 | **Sườn non** (nướng lâu), **bàn thứ 4** của quán (2 chỗ, góc trước quầy), **mâm cơm công ty**, **hạng quán** bậc 1 | Quán |
| 11 | 1.935 | **Cơm chay** (đậu hũ nướng, bì chay, chả chay, hành phi, chỗ nướng chay riêng), **quảng bá** | Quán |
| 12 | 2.425 | **Quạt máy** thổi bếp, **nồi cơm thứ hai**, ca khuya đông hơn (+2 khách) | Quán |
| 13 | 2.910 | **Lạp xưởng** + cơm lạp xưởng trứng, **bàn 5** (bàn 4 chỗ thứ hai), **Dì Năm rửa chén**, tủ chén 24 dĩa | Quán |
| 14 | 3.375 | **Bếp than thứ hai** (12 chỗ), tủ mát (thịt ướp giữ thêm 1 ngày) | Quán |
| 15 | 3.930 | **Nước mắm nhà pha** (3 bậc: +giá, +sao), **hộp tính tiền** (tự cộng phiếu) | Quán |
| 16 | 4.745 | **Quán nổi tiếng**: bảng hiệu bậc 3, đèn lồng, ghế chờ (4 người chờ), +khách đi ngang, reviewer xếp hàng | Nổi tiếng |
| 17 | 5.505 | Bông lên tay (2 việc liên tiếp), **ca khuya kéo dài** tới 0:30 (tuỳ chọn, +25% khách khuya) | Nổi tiếng |
| 18 | 6.455 | **Đêm hội ẩm thực bờ sông** (hội chợ) | Nổi tiếng |
| 19 | 7.590 | **Dĩa mang tên quán** (đặt tên, chọn tối đa 5 món, giá tự chọn trong khung), trần trang trí +4 | Nổi tiếng |
| 20 | 9.015 | Huy hiệu Chủ Quán, lịch thử thách, hạng quán bậc cuối | Nổi tiếng |

Mở khoá là quyền mua và dùng, không trừ tiền tự động. Riêng cấp 7 có hỏi: "Thuê mặt bằng ngay hay bán vỉa hè thêm?".
- Ở lại vỉa hè được; nhiệm vụ và giá vẫn tính đúng.
- Bàn mở ở cấp 10 và 13 chỉ có ở quán. Ở lại vỉa hè thì trần 4 bàn.
- Không đủ tiền thì hẹn ngày khác, không kẹt.

## 7. Kế hoạch milestone

Làm trong worktree `.claude/worktrees/quan-com-tam`, branch `claude/quan-com-tam`. Khung code chép từ Tiệm Bánh Mì (bản mới nhất), không phải Trà Sữa.

Mỗi milestone:
- Chạy unit + e2e (+ sim từ M5).
- Chụp ảnh 1366×768 dpr 1,25 và 390×844.
- Kiểm trong cây sạch.
- Báo chủ dự án, **chờ lệnh push**.

| Mốc | Nội dung | Xong khi |
|---|---|---|
| **M0** | Bộ tài liệu này + asset-spec + manifest rỗng | Chủ dự án duyệt; Codex nhận câu nhắn ở DEV-NOTES. |
| **M1** · Kiến trúc + cảnh + bàn | **Chép khung Bánh Mì:**<br>- `apply` + bất biến;<br>- state + MIGRATIONS;<br>- rng, freshLine;<br>- save (`.corrupt`, `.backup`, `.day`);<br>- atlas (crisp / snap / HD / placeholder);<br>- camera bội 0,5 + charScale 288;<br>- `placeBubble`;<br>- test cdp / e2e.<br>**Dựng cảnh:**<br>- `street-scene` và `quan-scene` theo `placements`;<br>- bàn + ghế theo `tables[].seatSpots`;<br>- khách đi vào → chờ bàn → ngồi (frame ngồi, lật theo `face`) → về;<br>- chủ quán đi bếp ↔ bàn ↔ thau theo đường đi.<br>**Dữ liệu:** `data/` đủ bảng số liệu ECONOMY. | - check_assets 0 lỗi.<br>- Cảnh nét ở 1366@1,25 và 390@3 (hệ số bội 0,5).<br>- Khách ngồi đúng `seatSpots`, chân ghế khớp sàn, đúng lớp trước / sau bàn.<br>- Unit test: atlas, manifest khớp, giá vốn khớp bảng.<br>- Tải lại không mất gì. |
| **M2** · Một ca trọn | - Bếp: 6 chỗ, 3 vùng, 2 mặt, lật, than, quạt, khói, cháy.<br>- Nồi cơm, mỡ hành, chảo trứng.<br>- Bày dĩa 11 bước với `plate-layers`.<br>- Vòng bàn đủ 8 bước: ngồi, châm trà, phiếu, bưng, ăn, gọi thêm, tính tiền, dọn / lau.<br>- Dĩa sạch + rửa chén.<br>- Phiếu biến thể; chấm 0–100 + sao; review cơ bản.<br>- Chốt ngày lời lỗ; ký gửi; lưu giữa ca; ngày 1 hướng dẫn. | - Người mới tự nướng, bày và bưng được 1 dĩa ở ca đầu mà không cần đọc hướng dẫn ngoài.<br>- E2E chơi trọn ngày 1 bằng chạm thật (desktop + 390).<br>- Bấm lặp hoặc tải lại: mọi lần giao, trừ kho, tính tiền chỉ chạy đúng một lần.<br>- Lật miếng được trong lúc ô bày đang mở (cả mobile).<br>- 0 lỗi console. |
| **M3** · Kinh tế + nội dung cơ chế | - 10 món, 20 cấp, nâng cấp, trang trí kéo thả.<br>- Ca trưa / ca tối, hộp mang về, ghép bàn, bày ×N.<br>- Sổ nợ, đơn đặt trước, mâm cơm, phụ bàn.<br>- Nhiệm vụ, 2 nhà cung cấp, quảng bá, hết hàng giữa ca, lên quán.<br>- **Nội dung mỗi cơ chế**: sự kiện, câu khách, review theo kết quả, khoảnh khắc Nhật Ký (PLAYBOOK §5). | - Mỗi cơ chế có test + ≥ 1 sự kiện + review theo kết quả.<br>- Có test không kẹt ở các trường hợp: 0 đồng, kho đầy, hết than, hết gạo, hết dĩa, mọi bàn dơ.<br>- Lên quán giữ bản lưu và đồ đã mua.<br>- Phụ bàn không bao giờ đứng yên khi còn việc. |
| **M4** · Drama + review + Nhật Ký | - ≥ 56 sự kiện DRAMA.md + sự kiện cơ chế.<br>- 12 kiểu lỗi × 6–10 câu nói + 6–10 review mỗi kiểu, có biến thể theo nhóm.<br>- Review theo sao 8–12 câu mỗi mức mỗi nhóm.<br>- Trả lời theo tính cách.<br>- Sổ (Review, Nhật ký, Sự kiện, Nhiệm vụ, Khách quen, Sổ nợ, Huy hiệu).<br>- Thẻ Nhật Ký.<br>- Tổng pool thoại ~1.000 câu. | - Test: mọi sự kiện mở được; mọi lựa chọn ở mọi bước đều giải quyết được; luôn có lựa chọn miễn phí.<br>- Không lặp câu trong ca; không emoji.<br>- Thẻ PNG xuất được.<br>- Mô phỏng 14 ngày không lỗi. |
| **M5** · Polish + cân bằng | - Hoạt ảnh: lật, lửa bùng, khói, hơi cơm, lau bàn.<br>- Mobile hoàn thiện, âm thanh (xèo, than nổ, chén dĩa, mưa).<br>- Thời tiết (mưa, ngập vỉa hè, cúp điện, mất nước).<br>- Hội chợ, thử thách, huy hiệu, hạng quán, nước mắm nhà pha, bếp 2, ca khuya kéo dài, chơi lại ngày.<br>- **Bộ mô phỏng** `tools/sim/` 3 hồ sơ. | - Sim: cấp 4 ≈ 10 phút, cấp 7 ≈ 40 phút, cấp 10 ≈ 2 giờ, cấp 20 ≈ 10–12 giờ.<br>- 0 kẹt; tới cấp 20 còn chỗ tiêu tiền.<br>- E2E đủ luồng (gồm "không nút nào bị che").<br>- Ảnh 1366@1,25, 1920@1, 390@3 không mờ, không tràn. |

## 8. Tiêu chí thử gameplay

- **Ca đầu:** người mới hiểu "miếng sườn có hai mặt" và "bàn dơ thì khách không ngồi được" mà không cần chữ dài. Thấy bằng màu thịt, vòng độ chín, biểu tượng bàn và câu khách.
- **Đến ngày 3:** người chơi đã gặp ít nhất mỗi tình huống một lần:
  - phải chọn "bưng dĩa ra bàn hay ở lại lật sườn";
  - phải chọn "dọn bàn hay rửa chén";
  - một lần hết than hoặc gần hết cơm.
- Đổi lựa chọn trong cùng một sự kiện thì phải ra ít nhất hai hậu quả khác nhau, kiểm được trong ca đó hoặc ca sau.
- Bàn 4 thợ, 4 phiếu khác nhau: phục vụ trọn (ngồi → tính tiền) trong ≤ 40 lần chạm nhờ bày ×N.
- Không màn nào bắt người chơi rời Thanh Bếp để cứu miếng sườn.
