# Tiệm Bánh Mì

> **Chủ dự án đã duyệt M0 (19/11/2026):** giữ xe đẩy → tiệm; chủ tiệm nam; ngày 1–3 có nút "Thối đúng" tự động, từ ngày 4 thối tay; giữ bánh mì que và ổ mang tên tiệm; asset giao 2 đợt. Chi tiết: DEV-NOTES.md.

Lụm Kèo · Tập Làm Chủ · Milestone 0 · Game id `tiem-banh-mi` · Web một người chơi, tiền ảo.

Đọc cùng: [ECONOMY.md](ECONOMY.md) (số liệu), [DRAMA.md](DRAMA.md) (kịch bản, lỗi, review), [SCREENS.md](SCREENS.md) (màn hình), [ART-DIRECTION.md](ART-DIRECTION.md) (art), [asset-spec.json](asset-spec.json) (hợp đồng asset). Chuẩn chung: `docs/tap-lam-chu/PLAYBOOK.md`.

## 1. Pitch

5 giờ 30 sáng, hẻm còn tối, lò đã nóng. Người chơi bắt đầu bằng một **xe đẩy bánh mì** trước một mặt bằng đóng cửa: tự nướng từng mẻ bánh, canh lửa cho vỏ vừa vàng, rồi ráp ổ thật nhanh cho học sinh sắp trễ giờ, đội thợ hồ 12 người và anh shipper đang bị app hối. Bánh ra lò là bắt đầu nguội, khách thì "không hành, ít ớt, nhiều pate", tiền lẻ thì lúc nào cũng thiếu. Từ xe đẩy lên **tiệm**, rồi thành **tiệm nổi tiếng** mà reviewer xếp hàng chờ quay clip.

Ba câu hỏi mỗi ngày: *nướng bao nhiêu mẻ, lúc nào?* · *ráp ổ nào trước?* · *thối tiền sao cho đủ?*

## 2. Khác Trà Sữa ở đâu

| | Tiệm Trà Sữa | Tiệm Bánh Mì |
|---|---|---|
| Nguồn hàng chính | Nguyên liệu trong kho, pha khi có đơn | **Bánh phải nướng trước theo mẻ**, canh giờ rút (sống / chín / cháy). Bánh ra lò thì **nguội dần**, độ giòn giảm theo thời gian. |
| Kỹ năng | Đúng định lượng (đường, đá) | **Canh lò + quản lý tồn bánh theo giờ**: nướng dư thì bánh nguội, nướng thiếu thì khách chờ lò. |
| Thao tác | 7 bước pha cố định | **Dây chuyền ráp ổ**: lấy bánh → (nướng lại) → rạch → phết → nhân → đồ chua, dưa leo, rau → ớt, nước tương → gói → **thối tiền**. Nhiều bước tuỳ chọn theo phiếu ("không hành"). |
| Nhịp ca | 2 mốc tăng khách | **Ba buổi rõ rệt**: cao điểm sáng (55% khách, kiên nhẫn ngắn), trưa vắng (thời gian nướng, chuẩn bị, sự kiện), chiều tối (đơn mua về, đơn nhiều ổ). |
| Đơn lớn | Tối đa 3 ly | **Đơn 6–30 ổ** (thợ hồ, lớp học, công ty) qua **đơn đặt trước có giờ giao** và **ráp dây chuyền ×N**. |
| Tiền | Chỉ đếm doanh thu | **Tiền lẻ là tài nguyên**: khách đưa 500k lúc 6 giờ sáng, thối sai là lỗi, hết tiền lẻ là sự cố. |
| Đơn kiểu Việt | Mức đường / đá | **"Ổ ba chục"** (khách nói giá, người chơi chọn nhân cho vừa giá), **"như cũ"** (khách quen), **khách Tây** (phiếu hình), **"giòn giòn nha"** (phải nướng lại). |
| Năng lượng | Không có | **Bình gas** hao theo mẻ; lò điện ở cuối game nhanh, đều nhưng sợ cúp điện. |
| Tiến trình | Một tiệm, mua máy | **Ba giai đoạn đổi cảnh**: xe đẩy (cấp 1–6) → tiệm (cấp 7) → tiệm nổi tiếng (cấp 16+, bảng hiệu, dây xếp hàng, phụ việc). |

Giữ lại từ Trà Sữa (đã chứng minh, chép khung code): đơn nhiều phần, chỗ làm song song, nhiệm vụ ngày, hai nhà cung cấp, quảng bá, gói ký gửi chống kẹt, cứu hết hàng giữa ca, Drama Engine, review + trả lời theo tính cách chủ tiệm (đổi được từng review), Nhật Ký Làm Chủ, 20 cấp, hạng tiệm làm chỗ tiêu tiền cuối game, hội chợ, thử thách, chơi lại ngày hôm nay, chơi lại từ đầu có backup.

## 3. Vòng chơi một ngày

| Nhịp | Người chơi làm | Quyết định và hậu quả |
|---|---|---|
| **Chuẩn bị ca** (đêm trước, ngoài giờ) | Chọn menu 3–7 món, xem dự báo khách theo buổi, nhập hàng, **đổi tiền lẻ** ở tạp hoá Cô Sáu, xem **đơn đặt trước**, nướng **mẻ đầu ngày** (canh lò một lần, không tính giờ ca) | Mẻ đầu quyết định có bao nhiêu bánh lúc mở cửa. Đổi ít tiền lẻ thì rủi ro hết lẻ lúc cao điểm, đổi nhiều thì giữ tiền chết. |
| **Cao điểm sáng** (05:30–08:00, ~1 phút 45 giây thực) | Khách dồn, kiên nhẫn ngắn. Vừa ráp vừa canh lò mẻ 2, mẻ 3. Giao đơn đặt trước đúng giờ. | Bỏ lò quá giờ để kịp khách là cháy mẻ. Bánh hết thì khách chờ lò hoặc bỏ về. |
| **Trưa vắng** (11:00–13:00, ~45 giây) | Ít khách. Nướng bánh cho chiều, nướng thịt / chiên trứng sẵn, nhập gấp, xử lý sự kiện. | Nướng sớm quá thì tới chiều bánh nguội, phải nướng lại tốn giờ và than. |
| **Chiều tối** (16:00–19:00, ~1 phút 30 giây) | Dân văn phòng tan ca, phụ huynh đón con, đơn mua về nhiều ổ, shipper. | Bánh dư cuối ca thành **bánh hôm qua** (bán nửa giá sáng mai, cho đi hoặc bỏ). |
| **Chốt ca** | Doanh thu, giá vốn, hao bánh, gas, phí ca, lời lỗ, review, trả lời review, Nhật Ký, nhiệm vụ | Nâng cấp, trang trí, chuẩn bị ngày mới. Chơi lại ngày hôm nay nếu muốn. |

Một ca dài 4 phút thực (đồng hồ trong game chạy nhanh qua các buổi, có thông báo "Trưa vắng rồi, tranh thủ nướng bánh"). Một ngày tính cả chuẩn bị và chốt ca ≈ 5–6 phút. Đồng hồ ca dừng khi mở hội thoại, bảng phủ, tạm dừng hoặc rời tab.

### 3.1 Lò và độ giòn

- Lò có 1–3 **ngăn**, mỗi ngăn một **mẻ** (khay 4 / 6 / 8 ổ theo lò). Bỏ phôi vào ngăn, đồng hồ chạy.
- Vỏ bánh đổi màu theo thời gian: **phôi → vàng nhạt (sống) → vàng óng (chín) → nâu sậm (xém) → đen (cháy)**. Thanh tiến trình có vùng xanh "Rút!" và tiếng "ting".
- Rút trong vùng chín: độ giòn 100. Rút sớm: bánh sống, giòn tối đa 60, khách chê "bánh dai". Rút hơi trễ (xém): giòn 90, khách "giòn giòn nha" thích, khách khác trừ nhẹ. Quá trễ: **cháy**, bỏ cả mẻ (hao hụt), khói, có thể mở sự kiện.
- Bánh vào **tủ kính**. Độ giòn giảm dần (xem ECONOMY §3). Dưới 50 là **bánh ỉu**: khách chê, tối đa 3 sao.
- **Nướng lại** ở lò than nhỏ (4 giây mỗi ổ) đưa độ giòn lên ít nhất 85. Phiếu "giòn giòn nha" bắt buộc ≥ 85.
- Bánh mì que: khay riêng 12 que, nướng nhanh, chỉ phết pate, bán theo bịch 5 que.

### 3.2 Dây chuyền ráp ổ

Phiếu khách ghim lên **thớt**. Mỗi thớt giữ một ổ (hoặc một nhóm ổ giống nhau khi ráp ×N). Thứ tự bước:

1. **Lấy bánh** từ tủ kính (chọn ổ giòn nhất hoặc ổ sắp ỉu để bán trước; hiện số độ giòn trên ổ).
2. **Nướng lại** (tuỳ chọn, tốn 4 giây, cần chỗ trống ở lò than).
3. **Rạch** (một chạm, có hoạt ảnh dao).
4. **Phết**: pate, bơ, mayo. Mỗi thứ chạm vòng **không / ít / vừa / nhiều** (mặc định theo công thức).
5. **Nhân**: một hoặc nhiều nhân theo công thức hoặc theo "ổ ba chục". Thêm trứng là nhân phụ.
6. **Rau dưa**: đồ chua, dưa leo, rau mùi, hành lá (bật / tắt).
7. **Gia vị**: ớt (không / ít / vừa / nhiều), nước tương, tương ớt.
8. **Gói**: giấy, giấy cắt đôi, túi (đơn mua về từ 3 ổ, shipper bắt buộc túi).
9. **Giao + thối tiền**: khách đưa tờ tiền, người chơi chọn tờ thối (hoặc bấm "Thối đúng" khi có hộp đếm tiền / phụ việc).

Ổ trên thớt to dần theo từng lớp sprite (loaf-layers): bánh mở → pate → nhân → đồ chua → rau → ớt → gói. Sửa được bước gần nhất trước khi gói. Đã phết / đã bỏ nhân thì vẫn tính hao hụt.

**Ráp dây chuyền ×N** (từ cấp 3): khi phiếu có nhiều ổ giống nhau, chọn số ổ lên thớt dài (tối đa 4, bàn dài 8). Mỗi chạm áp cho cả hàng. Ổ khác biệt ("1 ổ không hành") hiện nhãn đỏ trên ổ đó, chạm ổ để tách riêng.

### 3.3 Phiếu kiểu Việt

| Kiểu phiếu | Ví dụ | Luật |
|---|---|---|
| Biến thể | "không hành, ít ớt, nhiều pate", "không rau", "thêm trứng" (+5k), "cắt đôi" | Hiện chữ + icon gạch / mũi tên. Đúng biến thể = điểm kỳ vọng. |
| "Giòn giòn nha" | | Độ giòn ≥ 85 lúc giao. |
| "Ổ ba chục" | "Cho ổ ba chục, gì cũng được" | Khách nói giá (20k / 25k / 30k / 40k). Người chơi tự chọn nhân, tổng giá hiện trên phiếu. Lệch ≤ 3k là đúng; dư nhiều thì lỗ, thiếu nhiều thì "ổ ba chục mà ba sợi chả". |
| "Như cũ" | Khách quen | Phiếu ẩn, xem ở **Sổ khách quen** (hiện sau 2 lần phục vụ ≥ 4 sao). Nhớ sai = lỗi. |
| Khách Tây | "One bánh mì, no spicy please" | Phiếu hình (icon), một dòng tiếng Anh đơn giản. Có biến thể "very spicy challenge". |
| Đơn nhiều ổ | Phụ huynh 3 ổ khác nhau, shipper 5 ổ cho 3 đơn app | Giao chung một lượt. Tráo ổ giữa các phần = lỗi "tráo đơn". |
| Đơn đặt trước | "30 ổ thập cẩm giao 6 giờ, công ty Hoa Sen Xanh" | Đặt từ hôm trước (sự kiện hoặc bảng Đơn đặt), có giờ giao trong ca, cọc 30%. Trễ hoặc thiếu thì giảm tiền, review riêng. |

### 3.4 Khách

| Nhóm (vai sprite) | Kiên nhẫn | Buổi hay tới | Đặc tính |
|---|---:|---|---|
| Học sinh (`student`) | 40 s | Sáng | Đơn rẻ, "ổ mười lăm ngàn", hay đi nhóm 2–3, sợ trễ giờ vào lớp. |
| Thợ hồ (`worker`) | 50 s | Sáng sớm | Nhiều ớt, thêm trứng, đơn 4–12 ổ, trả tiền chẵn lớn. |
| Shipper (`shipper`) | 35 s | Cả ngày | Gom nhiều đơn app, bắt buộc túi, ghi chú khó đọc, hay hối. |
| Dân văn phòng (`office`) | 45 s | Sáng, chiều | "Không hành, ít ớt", chay / gà xé, thích nhanh, chuyển khoản (không cần thối). |
| Khách quen (`regular`) | 70 s | Sáng sớm, chiều | Cô chú trong hẻm, "như cũ", ghi nợ, kể chuyện. |
| Reviewer (`reviewer`) | 55 s | Bất kỳ, danh tiếng ≥ 55 | Chấm kỹ từng bước, quay clip, bài đăng tạo đợt khách ngày sau. |
| Khách Tây (`tourist`) | 60 s | Trưa, chiều, từ cấp 6 | Phiếu hình, hỏi "phở có không", thích chụp ảnh, tip. |
| Phụ huynh (`parent`) | 50 s | Sáng, chiều | Cắt đôi cho con, không ớt, đơn 2–4 ổ khác nhau. |

Số khách: 10–14 ở ngày 1, tăng theo danh tiếng, giai đoạn và trang trí, tới 30–40 ở cấp 20 (cộng đơn đặt trước). Hàng chờ tối đa 4 (xe đẩy) / 5 (tiệm) / 6 (dây xếp hàng).

### 3.5 Chấm điểm và sao

Điểm 0–100: **công thức 50** (đúng loại bánh / nhân 20, phết 8, rau dưa 8, gia vị 6, gói 4, nướng lại nếu phiếu cần 4) + **độ giòn 15** (≥ 85 đủ 15, < 50 còn 0) + **thời gian 20** (giao trước nửa kiên nhẫn đủ 20, sát hạn còn 4) + **kỳ vọng 15** (biến thể trên phiếu, kỳ vọng nhóm khách). Thối thiếu tiền: tối đa 2 sao và khiếu nại; thối dư: không trừ sao nhưng mất tiền (khách thật thà có thể trả lại: sự kiện). Mốc sao 1/2/3/4/5 tại 0/40/55/70/85. Nhân sai hoặc chay dính mặn: tối đa 2 sao. Giao nhầm khách: tối đa 2 sao.

## 4. Điều khiển

### Desktop (chuột + phím, mốc 1366×768 dpr 1,25)

| Việc | Chuột | Phím |
|---|---|---|
| Ghim phiếu | Chạm khách hoặc phiếu | `1`–`6` chọn phiếu theo thứ tự |
| Bước ráp kế tiếp / thêm nguyên liệu | Chạm ô nguyên liệu trên dải | `Q W E R T Y U I O` theo thứ tự ô trên dải; `Space` = bước mặc định theo công thức |
| Đổi lượng (không / ít / vừa / nhiều) | Chạm lại ô đang chọn (xoay vòng) hoặc giữ để mở bảng | `↑ ↓` |
| Hoàn tác bước gần nhất | Nút Hoàn tác | `Backspace` |
| Rút mẻ / bỏ mẻ mới | Chạm lò hoặc viên "Lò" trên HUD | `L` (ngăn đang tới giờ trước) |
| Nướng lại | Nút trên ổ | `N` |
| Đổi thớt | Chạm thớt | `Tab` |
| Gói + giao | Nút Gói, rồi Giao | `Enter` |
| Thối tiền | Chạm tờ tiền | `Shift+1..9` theo mệnh giá; `Enter` xác nhận |
| Tạm dừng / Cách chơi | | `Esc` / `H` |

### Mobile 390×844 (một tay, ngón cái)

- Dock dưới 5 nút cao 56 px: **Quầy · Lò · Khách · Kho · Sổ**. Khi đang ráp, dock thu thành 3 nút để dành chỗ cho dải nguyên liệu.
- **Viên Lò** luôn nổi ở góc trên phải (vòng tiến trình + màu vỏ). Tới vùng chín thì rung nhẹ (nếu thiết bị hỗ trợ) và viên sáng; chạm là rút mẻ ngay ở bất kỳ màn nào. Không bao giờ phải rời Quầy để cứu mẻ.
- Dải nguyên liệu 2 hàng, mỗi ô ≥ 48×48 px, xếp theo thứ tự dây chuyền; ô không thuộc công thức mờ đi nhưng vẫn chạm được.
- Thối tiền: hàng tờ tiền cuộn ngang, tổng đã chọn hiện to, nút "Thối" chiếm cả bề ngang.
- Kéo thả là tuỳ chọn, mọi việc làm được bằng chạm.

## 5. Các hệ thống

| Hệ thống | Mở | Tóm tắt (số ở ECONOMY.md) |
|---|---|---|
| Lò + độ giòn | 1 | §3.1. Lò mini (xe đẩy) → lò gas 2 ngăn (tiệm) → lò điện 3 ngăn (cửa sổ chín rộng hơn, nướng đều, nhưng cúp điện là đứng). Giữ lò gas cũ làm dự phòng được. |
| Bình gas | 1 | Mỗi mẻ trừ gas. Viên gas trên HUD vàng khi < 20%, đỏ khi < 8%. Hết gas giữa ca: hội thoại cứu (sự kiện O01). Mua bình dự phòng được. |
| Tiền lẻ | 1 | Quỹ tiền lẻ theo mệnh giá. Đổi đầu ngày ở Cô Sáu (miễn phí, tối đa theo cấp). Khách chuyển khoản không cần thối (tỉ lệ tăng theo cấp). Hết lẻ: sự kiện O08. Hộp đếm tiền (cấp 9) gợi ý tờ thối; phụ việc (cấp 17) tự thối. |
| Đơn nhiều ổ + ráp ×N | 3 | §3.2. |
| Đơn đặt trước | 7 | Bảng Đơn đặt trong Chuẩn bị ca + sự kiện. Cọc 30% nhận trước, phần còn lại khi giao. Tối đa 2 đơn mỗi ngày. |
| Nhiệm vụ ngày | 2 | 3 mục mỗi ca từ ~16 mẫu (ví dụ "Rút 3 mẻ đúng vùng chín", "Thối tiền đúng 10 lần", "Không bánh ỉu nào"). Tính cả việc đã làm trước khi mở nhiệm vụ. |
| Hai nhà cung cấp | 1 / 9 | **Bà Tư** (chợ hẻm: pate nhà làm, chả lụa, đồ tươi, giao trong ca +15%) và **Chị Mai Lò Sỉ** (cấp 9: phôi, bánh sỉ nướng sẵn, gói to rẻ 10%, chỉ giao trước ca). Bánh sỉ không cần lò nhưng giòn tối đa 80. |
| Quảng bá | 11 | Tờ rơi cổng trường (+học sinh), check-in tặng trà đá (+người theo dõi), livestream lúc ráp (+độ hot, hên xui). Một lần mỗi ngày. |
| Gói ký gửi | luôn có | Khi tiền + hàng không đủ làm một ổ pate: Bà Tư gửi gói "10 ổ pate" (phôi, pate, đồ chua, giấy), trừ dần bằng giá vốn khi bán, để dưới gầm xe (vượt sức chứa được). Một lần mỗi ngày, giữa ca hết tiền thì xin thêm được. **Không bao giờ kẹt.** |
| Hết hàng giữa ca | luôn có | Nhắc khi còn ≤ 2 phần. Hết hẳn: hội thoại (chạy ra chợ mua gấp, quầy bỏ trống; nhờ Anh Lâm chở tới; mượn Cậu Hưng xe đối diện; đổi món; đóng cửa sớm; ký gửi khi hết tiền). Hết **bánh**: chờ mẻ đang nướng, mua bánh sỉ gấp, bán bánh hôm qua nướng lại. |
| Drama Engine | 1 | DRAMA.md. Tối đa 1 sự kiện trong ca + 1 giữa hai ca, nghỉ ≥ 2 ngày mỗi tình huống, mỗi ba sự kiện có một tình huống vui. |
| Review + trả lời theo tính cách | 1 | 4 tính cách (Hiền lành / Cục súc / Lầy lội / Sale-man), chọn ở màn chào, **đổi ngay trên từng review**. Lựa chọn theo chủ đề review (khen giòn, lỗi, chậm, đơn lớn, trên mạng). |
| Nhật Ký Làm Chủ | 1 | Câu chốt ca kiểu caption meme theo dữ kiện ca, thẻ 1080×1350 lưu PNG / chia sẻ. |
| Nâng cấp + trang trí | 1 / 4 | Mua ở Chuẩn bị ca hoặc Chốt ca. Trang trí kéo thả, chặn lối khách và chỗ đứng. Trần hấp dẫn +3 (+4 từ cấp 19). |
| Ba giai đoạn | 1 / 7 / 16 | Xe đẩy (cảnh `cart-scene`) → thuê mặt bằng lên **tiệm** (cảnh `shop-scene`, một lần 300k, có cảnh chuyển) → **tiệm nổi tiếng** (bảng hiệu bậc 3, dây xếp hàng, phụ việc, reviewer thường xuyên). |
| Hội chợ | 18 | "Lễ hội Bánh Mì phố": thuê gian 150k, ca 4,5 phút, +8 khách, giá +15%, đơn nhóm cho mọi khách. Mỗi 4 ngày. |
| Thử thách + huy hiệu | 20 | 5 thử thách xoay vòng (Rush kép, Một lò, Ngày khách Tây, Không cháy mẻ nào, Thối tay toàn bộ), 14 huy hiệu. |
| Hạng tiệm | 10 | 8 bậc mua bằng tiền, chỗ tiêu tiền cuối game. Thêm Pate nhà làm 3 bậc (cấp 15). |
| Chơi lại | luôn có | **Chơi lại ngày hôm nay** (Tạm dừng + Chốt ca, có xác nhận, cất `….before-replay`, ảnh đầu ngày `….day`). **Chơi lại từ đầu** (Cách chơi + Tạm dừng, xác nhận, cất `….backup`, tắt ghi khi đang xoá). Khoá lưu `wgp.tiembanhmi.v1`. |

## 6. Bảng 20 cấp

XP tích luỹ lấy theo đường cong Trà Sữa sau cân bằng; bộ mô phỏng M5 sẽ dò lại.

| Cấp | XP | Mở khoá | Giai đoạn |
|---:|---:|---|---|
| 1 | 0 | Xe đẩy, lò mini 1 ngăn khay 4, lò than nướng lại 1 chỗ, **pate bơ** + **chả lụa**, 1 thớt, quỹ tiền lẻ, ký gửi | Xe đẩy |
| 2 | 35 | **Trứng ốp la** + chảo trứng, nhiệm vụ ngày, phiếu "thêm trứng" | Xe đẩy |
| 3 | 70 | **Xíu mại** + nồi xíu mại, đơn 2–3 ổ, **ráp ×N** (thớt 4), phiếu "ổ ba chục" | Xe đẩy |
| 4 | 115 | **Thập cẩm** (thịt nguội, chà bông), trang trí (đèn mây, bảng phấn), khay lò 6 | Xe đẩy |
| 5 | 360 | **Thịt nướng** + bếp than nướng xiên, tủ kính sưởi (bánh nguội chậm 40%) | Xe đẩy |
| 6 | 580 | **Bánh mì chay** (thớt chay riêng, khách văn phòng hay gọi), **khách Tây**, mái che xe đẩy (mưa ít ảnh hưởng) | Xe đẩy |
| 7 | 870 | **Lên tiệm**: thuê mặt bằng 300k, lò gas 2 ngăn, kho 60 → 100, hàng chờ 5, **đơn đặt trước**, phí ca tăng | Tiệm |
| 8 | 1.450 | **Gà xé**, **thớt đôi** (2 ổ song song), nhóm reviewer thường xuyên hơn | Tiệm |
| 9 | 2.100 | **Nhà cung cấp thứ hai** (Chị Mai Lò Sỉ, bánh sỉ), hộp đếm tiền (gợi ý tờ thối) | Tiệm |
| 10 | 3.000 | **Heo quay**, đơn 6–12 ổ giờ cao điểm (đội thợ hồ), bàn dài ráp ×8, **hạng tiệm** bậc 1 | Tiệm |
| 11 | 3.625 | **Quảng bá**, bình trà đá miễn phí (+kiên nhẫn 6%), ghế nhựa + bàn nhỏ | Tiệm |
| 12 | 4.380 | **Bánh mì que** (khay que 12, bịch 5), đơn lớp học 20–35 que | Tiệm |
| 13 | 5.225 | Tủ mát lớn (đồ tươi để được 2 ngày), kho 100 → 150 | Tiệm |
| 14 | 6.240 | **Lò điện đối lưu 3 ngăn** (vùng chín rộng gấp đôi, khay 8, sợ cúp điện), đơn shipper theo khung giờ | Tiệm |
| 15 | 7.530 | **Pate nhà làm** (3 bậc nghiên cứu: +giá ổ có pate, +sao), máy ráp định lượng (nhớ lượng mặc định) | Tiệm |
| 16 | 9.005 | **Tiệm nổi tiếng**: bảng hiệu bậc 3, biển đèn, dây xếp hàng (hàng chờ 6), +khách đi ngang | Nổi tiếng |
| 17 | 10.835 | **Thớt ba** + **phụ việc Bé Na** (tự gói và thối tiền cho đơn đang giao, 45k/ca) | Nổi tiếng |
| 18 | 12.950 | **Lễ hội Bánh Mì phố** (hội chợ) + đơn nhóm kết hợp | Nổi tiếng |
| 19 | 15.415 | Nội thất hoàn thiện, trần trang trí +4, công thức "ổ gia truyền" của tiệm (đặt tên, giá tự chọn trong khung) | Nổi tiếng |
| 20 | 18.260 | Huy hiệu Chủ Tiệm, lịch ca thử thách, hạng tiệm bậc cuối | Nổi tiếng |

Mở khoá là quyền mua và dùng, không trừ tiền tự động (trừ cấp 7: hỏi "Thuê mặt bằng ngay hay ở xe đẩy thêm?", ở lại được, nhiệm vụ và giá vẫn tính đúng; không đủ tiền thì hẹn ngày khác, không kẹt).

## 7. Kế hoạch milestone

Làm trong worktree `.claude/worktrees/tiem-banh-mi`, branch `claude/tiem-banh-mi`. Mỗi milestone: unit + e2e (+ sim từ M5), ảnh 1366×768 dpr 1,25 và 390×844, kiểm trong cây sạch, báo chủ dự án, **chờ lệnh push**.

| Mốc | Nội dung | Xong khi |
|---|---|---|
| **M0** | Bộ tài liệu này + asset-spec + manifest rỗng | Chủ dự án duyệt; Codex nhận câu nhắn ở DEV-NOTES. |
| **M1** · Kiến trúc + cảnh | Chép khung Trà Sữa (atlas crisp/snap, scene camera bội 0,5 + charScale, text freshLine, save backup + chơi lại, test cdp/e2e). Dựng `cart-scene` và `shop-scene` từ asset Codex theo `placements`, khách đi cửa → hàng chờ → về, chủ tiệm đứng sau quầy. `data/` đầy đủ bảng số liệu ECONOMY. | check_assets 0 lỗi; cảnh nét ở 1366@1,25 và 390@3 (hệ số bội 0,5); khách đi đúng `queueSpots`; unit test atlas / manifest khớp / economy giá vốn khớp bảng; tải lại không mất gì. |
| **M2** · Một ca trọn | Lò (mẻ, màu vỏ, rút, cháy), độ giòn + nướng lại, tủ kính, dây chuyền ráp 9 bước với loaf-layers, thối tiền, phiếu biến thể, 3 buổi, chấm điểm + sao, review cơ bản, chốt ca lời lỗ, mẻ đầu ngày, ký gửi, lưu giữa ca. | Người mới tự nướng, ráp và giao được 1 ổ trong ca đầu không cần đọc hướng dẫn ngoài; e2e chơi trọn ngày 1 trên desktop và 390 bằng chạm thật; mọi giao / trừ kho / thối tiền đúng một lần khi bấm lặp hoặc tải lại; 0 lỗi console. |
| **M3** · Kinh tế + nội dung cơ chế | 10 món, 20 cấp, nâng cấp, trang trí kéo thả, gas, tiền lẻ, đơn nhiều ổ + ráp ×N, đơn đặt trước, thớt đôi/ba, nhiệm vụ, 2 nhà cung cấp, quảng bá, hết hàng giữa ca, chuyển lên tiệm. **Nội dung mỗi cơ chế**: sự kiện, câu khách, review theo kết quả, khoảnh khắc Nhật Ký (PLAYBOOK §5). | Mỗi cơ chế có test + ≥ 1 sự kiện + review theo kết quả; không kẹt khi 0 đồng / kho đầy / hết gas / hết lẻ (test); lên tiệm giữ bản lưu và đồ đã mua. |
| **M4** · Drama + review + Nhật Ký | ≥ 45 sự kiện DRAMA.md, 11 kiểu lỗi × 6–10 câu nói + 6–10 review mỗi kiểu, có biến thể theo nhóm khách; review theo sao 8–12 câu mỗi mức mỗi nhóm; trả lời theo tính cách; Sổ (Review, Nhật ký, Sự kiện, Nhiệm vụ, Khách quen); thẻ Nhật Ký. Tổng pool thoại ~1.000 câu. | Test: mọi sự kiện mở được, mọi lựa chọn ở mọi bước giải quyết được, luôn có lựa chọn miễn phí; không lặp câu trong ca (freshLine); không emoji; thẻ PNG xuất được; mô phỏng 14 ngày không lỗi. |
| **M5** · Polish + cân bằng | Hoạt ảnh (lò, dao, khói, hơi), mobile hoàn thiện, âm thanh, thời tiết (mưa, ngập, cúp điện, khói), hội chợ, thử thách, huy hiệu, hạng tiệm, pate nhà làm, lò điện, phụ việc, chơi lại ngày hôm nay. **Bộ mô phỏng** `tools/sim/` 3 hồ sơ. | Sim: cấp 4 ≈ 10 ph, 7 ≈ 40 ph, 10 ≈ 2 giờ, 20 ≈ 10–12 giờ; 0 kẹt; tới cấp 20 còn chỗ tiêu tiền; e2e đủ luồng; ảnh 1366@1,25, 1920@1, 390@3 không mờ, không tràn. |

## 8. Tiêu chí thử gameplay

- Ca đầu: người mới hiểu được "bánh nguội dần" và "rút lò đúng lúc" mà không cần chữ dài (màu vỏ + số độ giòn + câu khách).
- Đến ngày 3: có ít nhất một lần phải chọn "ráp tiếp hay rút lò", một lần chọn nướng thêm mẻ hay không, và một quyết định mua hàng có hậu quả thấy được.
- Đổi lựa chọn cùng một sự kiện cho ít nhất hai hậu quả khác nhau kiểm được trong ca này hoặc ca sau.
- Đơn 12 ổ ráp được trong ≤ 35 lần chạm nhờ ráp ×N.
- Không màn nào bắt người chơi rời Quầy để cứu mẻ bánh.
