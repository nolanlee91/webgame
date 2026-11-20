# Đặc tả màn hình · Quán Cơm Tấm

**Mốc kiểm:**
- Desktop 1366×768 dpr 1,25 (thiết bị 1707×960).
- Mobile 390×844 dpr 3.
- Kiểm thêm 1920×1080 dpr 1 và 360 px.

**Quy tắc chung:**
- Mỗi màn có một hành động chính.
- Vùng chạm ≥ 44 px (dải lớp dĩa và chip vỉ trên mobile ≥ 48 px).
- Tương phản chữ 4,5:1, có focus bàn phím.
- Đổi vùng hiển thị không làm mất việc đang làm.
- Chữ tiếng Việt trong tài liệu này là chuẩn cho UI.

Khác Bánh Mì ở một điểm cốt lõi: **cảnh không bị thay bởi màn làm việc.** Bàn ăn nằm trong cảnh, nên cảnh luôn phải thấy được. Bếp cũng luôn phải lật được. Bố cục vì vậy chia ba vùng cố định: Cảnh, Thanh Bếp, Cột Dĩa.

## Quy tắc hiển thị (PLAYBOOK §2)

**Cảnh 1280×720:**
- Hiển thị với hệ số thiết bị **bội 0,5** (camera `render/scene.js` chép từ Bánh Mì).
- Không dùng `object-fit: cover`.
- Gốc toạ độ làm tròn theo px thiết bị. Sprite đặt đúng lưới 2 px.

| Màn | Hệ số thiết bị | Kích thước CSS | Ghi chú |
|---|---|---|---|
| Desktop 1366@1,25 | **1,0** | 1024×576 | Đúng 1280×720 px thiết bị, thấy toàn cảnh, không cắt |
| Desktop 1920@1 | **1,0** | 1280×720 | |
| Mobile 390@3 | **1,0** | 427×240 | Cắt mỗi mép ~55 px file (≤ 5%), **thấy mọi bàn cùng lúc**. Không lia camera để phục vụ bàn. |

**Kích thước hiện của các phần:**
- Nhân vật (260 px file): ~208 px CSS ở desktop 1366, ~87 px CSS ở mobile.
- Bàn + 2 ghế (~300 px file): ~100 px CSS ở mobile. **Chạm bàn, không chạm ghế.** Vùng chạm bàn là hình chữ nhật bao bàn + ghế.

**Hình HD và icon:**
- Hình HD (dĩa HD, cận cảnh chủ quán, bếp HD, chân dung) qua `crisp()`.
- Icon < 96 px không làm tròn cỡ (bài học Trà Sữa: icon to ra 25%, e2e bấm trượt).

**Luôn thấy trong ca, ở mọi màn trừ hội thoại:**
- **Thanh Bếp**: 6 chip vỉ (+6 khi có bếp 2), Than, Quạt, viên Cơm, viên Dĩa sạch, đồng hồ Khói.

### Không gì được che nút (bài học Bánh Mì M5)

1. **Vùng cuộn** là `.app` (từ đầu trang tới mép trên dock). Dock giữ chỗ riêng. Không phần tử nào trôi xuống dưới dock.
2. **Thông báo** (toast) nằm **trong khung cảnh**, ở đáy `#world`, phía trên Thanh Bếp.
   - Không bao giờ nằm trên Thanh Bếp, Cột Dĩa, dock hay nút Giao.
   - Khi có dải gợi ý ngày 1 thì thông báo nâng lên trên dải đó.
3. **Khi có bảng phủ** (Kho, Sổ, Chuẩn bị):
   - Thông báo chuyển lên dải 52 px trên cùng.
   - Bảng chừa chỗ cho dải đó, không đè tab / nút của bảng.
4. **Bong bóng thoại:**
   - Nền đục `#fffaf0`, viền mực 2 px, hiện không mờ dần.
   - Đặt bằng `placeBubble`: tránh mặt chủ quán, chip HUD, Thanh Bếp; khách ngồi thì tránh bàn bên cạnh.
   - Hết chỗ thì thu thành chấm biểu tượng trên đầu khách. Chạm chấm thì hiện bong bóng 2 giây.
5. **Đổi nhịp ca** ("Cao điểm tới rồi!"): băng chữ 2 giây trong khung cảnh, không dừng ca, không che Thanh Bếp.
6. **E2E kiểm** bằng `elementFromPoint` ở 5 điểm của từng nút. Danh sách nút:
   - Giao, Hoàn tác;
   - từng ô dải lớp;
   - từng chip vỉ, nút Than, nút Quạt;
   - từng nút dock;
   - từng bàn.

   Kiểm ở cả desktop và 390, cả khi có thông báo và khi có bảng phủ.

## Bố cục trong ca

### Desktop 1366×768 (CSS)

```
┌────────────────────────────────────────────── HUD 40 ─────────────────────────────────────────────┐
│ Ngày 5 · Ca tối 19:20 · 412k · ★4,3 · Kho · Sổ nợ 45k                           Âm · Tạm dừng · ? │
├──────────────────────────────── Cảnh 1024×576 ─────────────────────────┬──── Cột Dĩa 342 ─────────┤
│  bếp + quầy (trái)          bàn 1   bàn 2                              │ Thanh phiếu (cuộn ngang) │
│  chủ quán                   bàn 3   bàn 4      chờ bàn ▸               │ 342×96, chip 96×80        │
│                                                                        │ màu viền = màu bàn       │
│  (thông báo nằm ở đáy khung cảnh)                                      ├──────────────────────────┤
│                                                                        │ Ô bày (tab 1 / 2)        │
│                                                                        │ Dĩa HD 256×307           │
│                                                                        │ (plate-layers-hd ×1 thiết│
│                                                                        │  bị; chưa có HD thì      │
│                                                                        │  plate-layers ×2)        │
├──────────────────────────────── Thanh Bếp 1024×112 ────────────────────┤ Dải lớp 2 hàng ô 52     │
│ [vỉ: N N | V V | Ấ Ấ]  Than ▮▮▮▯ [+Than] [Quạt]  Khói ▮▯  Cơm 7/12 [Nấu] │ Hoàn tác · Giao (48)     │
│ chip 80×80, vòng 2 mặt, nhãn vùng      Trứng · Chả · Canh · Dĩa sạch 6  │                          │
└────────────────────────────────────────────────────────────────────────┴──────────────────────────┘
```

Tổng cao 40 + 576 + 112 = 728 ≤ 768.

**Ở 1920×1080 dpr 1:**
- Cảnh 1280×720.
- Cột Dĩa 400 (dĩa HD ×1, 320×384).
- Thanh Bếp 1280×140.
- Căn giữa.

### Mobile 390×844 (CSS)

| Vùng | Cao | Nội dung |
|---|---:|---|
| HUD | 36 | Giờ · tiền · sao. Cấp, danh tiếng, theo dõi, sổ nợ để trong Sổ. |
| Cảnh | 240 | Toàn cảnh ở hệ số 1,0. Chạm bàn: làm việc đang chờ. Chạm giữ bàn: mở vòng lựa chọn (Châm trà · Phiếu · Tính tiền · Dọn · Lau · Ghép bàn). |
| Thanh Bếp | 104 | Hàng 1: 6 chip vỉ 56×56. Hàng 2: Than, Quạt (giữ), Cơm, Dĩa sạch, Khói; mỗi nút 56×40. Bếp 2: chip thành 2 hàng, Thanh Bếp cao 160, Cột Dĩa thu dĩa còn 128×154. |
| Thanh phiếu | 64 | Chip 88×56 cuộn ngang, màu viền = màu bàn, hộp mang về viền nâu. |
| Vùng làm việc | 296 | Theo nút dock. **Dĩa**: ô bày (dĩa HD ở hệ số 1,5 = 160×192 CSS) + dải lớp 2 hàng ô 48 + Hoàn tác / Giao dính đáy. **Bàn**: danh sách việc theo bàn, việc gấp lên đầu. **Bếp**: bếp HD cận cảnh ở hệ số 1,5 (320×160 CSS) + nồi cơm, chảo, xửng, canh. |
| Dock | 56 | **Dĩa · Bàn · Bếp · Kho · Sổ**. |

Tổng 796 ≤ 844 (chừa vùng an toàn).

## Bảng màn

| Màn | Desktop 1366×768 | Mobile 390×844 | Trạng thái, điều khiển |
|---|---|---|---|
| **Màn chào** | Tranh `title-art` phủ khung theo bội 0,5 (không `object-fit: cover`). Khung kem bên phải 420 px: tên quán (nhập), 4 thẻ tính cách chủ quán, nút **Nhóm bếp mở quán** / **Tiếp tục ngày N** | Tranh cắt trên 45% chiều cao, thẻ tính cách cuộn ngang, nút chính toàn bề ngang dưới cùng | Có bản lưu: "Tiếp tục" là nút chính, "Chơi lại từ đầu" trong Cách chơi. Bản lưu hỏng: thông báo + đã chép `.corrupt`. |
| **Chuẩn bị** | Cảnh mờ phía sau, bảng 980×620 giữa. 6 thẻ: **Menu · Nhập hàng · Ướp sườn · Mẻ đầu · Ca · Đơn đặt**. Cột phải "Dự báo hôm nay": khách theo ca, thời tiết, đơn đặt trước, mâm cơm, cảnh báo "Coi chừng hết than" | Một cột. Thẻ thành tab cuộn ngang dính đầu. "Dự báo" là hộp gập ở đầu. Nút **Mở quán** dính đáy | Nút **Nhập đủ cho hôm nay**: giữ chỗ kho cho sườn + gạo trước. **Mẻ đầu**: nấu nồi cơm, làm hũ mỡ hành, nhóm bếp (một chạm mỗi việc, không tính giờ). **Ca** (cấp 5): bật / tắt ca trưa, ca tối (cấp 17: ca khuya kéo dài). Mở quán khi thiếu hàng: hỏi lại. |
| **Cảnh chính (trong ca)** | Bố cục ba vùng ở trên | Bố cục 6 dải ở trên | Bàn có biểu tượng việc đang chờ: ghế (mời ngồi) · ly (châm trà) · phiếu · dĩa (chờ món, kèm vòng kiên nhẫn) · hoá đơn · dĩa dơ · khăn. Màu viền bàn trùng màu phiếu. Khách chờ bàn có bong bóng số người + thanh kiên nhẫn. Chủ quán / Bông đi trong cảnh theo đường đi. |
| **Thanh Bếp** | 1024×112 dưới cảnh | 390×104 dưới cảnh | Mỗi chip: sprite món (`grill-items`) + **vòng hai nửa** (nửa trái mặt dưới, nửa phải mặt trên; màu sống / tái / chín / cháy cạnh / cháy) + nhãn vùng (N / V / Ấ). Chạm: lật. Chín hai mặt thì chạm lần nữa: gắp vào ô bày (hoặc sang vùng ấm). Chip trống: chạm để bỏ món của phiếu đầu. Tới vùng chín: chip sáng + tiếng xèo. Sắp cháy (≥ 112): chip rung, viền đỏ. **Than**: thanh 4 nấc + nút +Than. **Quạt**: giữ để quạt (khói tăng, thanh khói hiện cạnh nút). **Cơm**: số phần + nút Nấu (đang nấu: vòng tiến trình). |
| **Bếp lớn** (dock Bếp / chạm bếp trong cảnh) | Bảng nổi 640×360 trên cảnh, cạnh bếp. Bếp HD (`grill-hd`, `grill-items-hd`) ở hệ số thiết bị 1,0 (512×256 CSS), các miếng to, kéo thả giữa vùng được. Dưới: nồi cơm, chảo trứng (vòng giây: sống / lòng đào / vừa / kỹ / cháy), xửng chả, nồi canh, hũ mỡ hành | Vùng làm việc 296 | Thanh Bếp vẫn hiện. Không bắt buộc dùng: mọi việc bếp làm được trên Thanh Bếp + nút thiết bị. |
| **Ô bày (Cột Dĩa)** | Phiếu ghim trên ô (tên khách, bàn, món, biến thể bằng chữ + icon). Dĩa HD giữa. Dải lớp 2 hàng theo thứ tự bày. Tab ô 1 / 2 (cấp 6). Nút Hoàn tác / Giao | Vùng làm việc khi dock = Dĩa | Mỗi ô: icon + tên + nấc (cơm 1 / 2 vá; nước mắm chan / chén / bịch). Ô ngoài công thức mờ nhưng chạm được. Bước sai thứ tự: rung nhẹ + lý do ("Xới cơm trước đã"). Ô Món nướng hiện các miếng chín có sẵn (vỉ + giữ ấm + tủ kính) với độ chín / độ tươi; chọn miếng cháy cạnh cho người dặn. Bày ×N: số dĩa trên ô dài, nhãn đỏ trên dĩa khác biệt. Hết hàng ở bước nào thì mở hội thoại Hết hàng. |
| **Tính tiền** | Khay nổi cạnh bàn: phiếu tính tiền giấy (`slip-blank`), danh sách món + gọi thêm, mỗi dòng chạm để cộng (dòng đã cộng gạch chân), tổng to. Nút **Thu tiền** · **Ghi sổ** (nếu khách được) | Tấm trượt từ dưới 60% chiều cao | Ngày 1–3: nút "Tính đúng". Hộp tính tiền: tự cộng. Chuyển khoản: hiện `qr-card` + "Đã nhận". Tính dư: khách phản đối ngay (mở khiếu nại). Tính thiếu: không ai nói, chỉ thấy ở Chốt ngày. |
| **Danh sách Bàn** (dock Bàn) | Không cần (desktop thấy bàn trong cảnh). Có thêm hàng việc ở đáy Cột Dĩa khi ô bày trống | Vùng làm việc | Mỗi dòng: bàn N · số người · việc đang chờ · kiên nhẫn. Chạm dòng = làm việc. Cấp 9: cột "Giao Bông" (xếp việc cho Bông, tối đa 3). |
| **Hội thoại Drama** | Cảnh mờ phía sau. 2 chân dung HD (người nói trái, chủ quán phải), khung thoại dưới. 2–4 nút lựa chọn, mỗi nút có dòng chi phí ("−50k", "Chủ quán rời cảnh 10 giây", "Hên xui 60%") | Một chân dung đang nói ở trên, tên người nói, nút lựa chọn toàn bề ngang, cuộn nếu câu dài | Ca và **bếp** tạm dừng. Sau khi chọn: bảng hậu quả (tiền, DD, TD, HOT, KCS, kho) hoặc "Chờ đến ngày sau". Focus vào lựa chọn đầu. `Esc` không đóng (phải chọn). |
| **Hết hàng giữa ca** | Như Drama: chân dung chủ quán + nhân vật cứu (Anh Sáu, Cô Ba, Chú Hòa, quán bên cạnh) | Như Drama | Các lựa chọn: chạy chợ (chủ quán rời cảnh, đồng hồ và bếp vẫn chạy), nhờ Anh Sáu, mượn, đổi món, treo bảng hết. Ký gửi lên đầu khi không đủ tiền. Luôn có lựa chọn miễn phí. |
| **Kho / Nhập gấp** | Bảng 640×520: lưới icon nguyên liệu + số phần + hạn + thanh sức chứa. Tab Cô Ba / Chú Hòa. Nhập gấp trong ca +15% | Toàn vùng làm việc, lưới 4 cột | Ô đỏ khi ≤ 2 phần. Hàng hết hạn hôm nay có nhãn. Than, gạo, dĩa, hộp có hàng riêng. Gói ký gửi hiện khi đủ điều kiện. |
| **Sổ quản lý** | Sổ mở trên nền cảnh 1000×620. Tab trái: **Review · Nhật ký · Sự kiện · Nhiệm vụ · Khách quen · Sổ nợ · Huy hiệu** | Toàn màn, tab ngang cuộn, danh sách một cột | Khách quen: tên, món "như hôm qua", biến thể, số lần ghé. Sổ nợ: tên, số lần, tổng, ngày ghi đầu, nút "Xoá nợ" (+DD). Nhiệm vụ: 3 mục + tiến độ. |
| **Trả lời review** | Trong tab Review: review trái, khung trả lời phải. **Hàng nút tính cách** trên các lựa chọn; hậu quả ghi trên nút | Chạm review mở chi tiết. Hàng tính cách cuộn ngang. Lựa chọn toàn bề ngang | Câu trả lời lưu nguyên văn dưới review, kèm kết quả + câu đáp lại. Vẽ lại giữ vị trí cuộn. |
| **Nâng cấp & Trang trí** | Cảnh bên trái (hệ số 1,0), bảng phải 342: danh mục, giá, cấp, tác dụng. Trang trí kéo thả trực tiếp trong cảnh | Dải danh mục + bảng dưới. Đặt đồ bằng chạm vị trí hoặc nút chuyển vị trí | Chặn vị trí đè lối đi, bàn, ghế, `waitSpots`, mép cảnh; ghi lý do. Có nút Đặt lại. Xác nhận mua mới trừ tiền. Bàn mới hiện ngay ở `tables[]` theo `unlock`. |
| **Lên quán (cấp 7)** | Hộp hỏi "Thuê mặt bằng ngay (350k) hay bán vỉa hè thêm?". Sau đó cảnh chuyển 4 giây: bàn ghế nhựa xếp chồng, cửa cuốn kéo lên, `quan-scene` hiện | Như desktop, toàn màn | Không đủ tiền: "Để dành thêm", nhắc lại mỗi ngày ở Chuẩn bị. Sự kiện Q10 chạy ngay sau. |
| **Nghỉ giữa ca** (khi mở 2 ca) | Bảng 640×420: tóm tắt ca trưa (dĩa, lời, review), việc nhanh (Rửa hết chén · Nấu cơm · Nhập gấp · Thêm than), nút **Mở ca tối** | Toàn màn, nút dính đáy | Không tính giờ. Tối đa 1 sự kiện. |
| **Chốt ngày** | Bảng 900×600: doanh thu / lời ở đầu; giá vốn; hao (sườn cháy, cơm dư, đồ hết hạn, dĩa bể); than, gas; phí ca, lương; sổ nợ (+ghi mới, −đã trả). Theo ca: số dĩa, số khách bỏ về. Review nổi bật, khoảnh khắc, nhiệm vụ. Ba nút **Lưu ảnh Nhật Ký · Nâng cấp · Ngày tiếp theo** + **Chơi lại ngày hôm nay** (phụ) | Một cột: số lớn đầu, chi tiết gập, nút chính dính đáy | Cơm dư: báo số phần thành cơm chiên ca sau. Sườn ướp dư: báo "mai tươi tối đa 85". |
| **Thẻ Nhật Ký** | Xem trước thẻ 1080×1350 ở hệ số 0,5 (540×675). Nút Lưu PNG / Chia sẻ / Ẩn tên quán / Đổi khoảnh khắc | Thẻ ×0,333 (360×450), nút dưới | Vẽ canvas trên `journal-card.webp`. Bố cục ở mục cuối. |
| **Tạm dừng / Cách chơi** | Hộp 520 px: Tiếp tục, Âm thanh, Cách chơi (6 thẻ hình: Bếp, Lật, Bày dĩa, Bàn, Tính tiền, Ca), **Chơi lại ngày hôm nay**, **Chơi lại từ đầu** | Toàn màn | Hai nút chơi lại đều hỏi xác nhận (Thôi / Chơi lại), ghi rõ bản hiện tại được cất dự phòng. |
| **Hội chợ (cấp 18)** | Cảnh quán thêm đèn lồng, cờ dây, bờ sông đông người. HUD thêm "Đêm hội ẩm thực" + đồng hồ 4:00 | Như ca thường | Thuê gian ở Chuẩn bị. Review great / ok / bad. |
| **Thử thách (cấp 20)** | Lịch treo tường trong Chuẩn bị: thử thách hôm nay, mục tiêu, thưởng; bật / tắt | Thẻ trong tab Ca | Mục tiêu hiện trên HUD trong ca. Xét ở Chốt ngày. Huy hiệu ở Sổ. |

## Thẻ Nhật Ký Làm Chủ

**Khung:** dọc 1080×1350 (`journal-card.webp`, lưới 2×).

**Bố cục từ trên xuống:**
- Đầu thẻ nền kem, logo chữ "Lụm Kèo" và tên quán (ẩn được).
- Nửa trên chừa vùng 960×640 cho crop cảnh hoặc dĩa HD.
- Câu chốt ngày, tối đa 2 dòng, 44 px.
- Một câu thoại đại diện.
- Dải cuối: "{n} dĩa · lời {profit}k" bên trái, `lumkeo.com` bên phải.

**Câu mẫu:** "Bốn thợ, bốn kiểu, một thằng Lực ăn ba vá cơm."

**Xuất:** PNG. Chia sẻ qua thiết bị nếu hỗ trợ, có nút tải PNG dự phòng.
