# Đề cương Game Design & Art Direction MVP — "Cờ Tỷ Phú" (Lụm Kèo Đại Phú)
*(Dự án Webgame Portal "Lụm Kèo" · Board game đối kháng kinh tế 2–4 người)*

**Tác giả:** Gehihi (Art Direction & UX Lead)  
**Tài liệu tham chiếu:** `docs/art-bible-v5.md`, `docs/ma-soi-game-design-mvp.md`, `docs/ai-la-noi-gian-game-design-mvp.md`  
**Trạng thái:** Bản đề cương sơ bộ trình duyệt (Chưa tạo asset / Chưa giao Codex vẽ / Chưa tiêu tốn quota AI).

---

## 1. Bối cảnh & Chủ đề: "Phố Thương Gia Lụm Kèo" (Vietnamese Retro Street & Landmark Tour)

Để tôn vinh thương hiệu **Lụm Kèo** và mang lại cảm giác thân thuộc, hài hước, mang đậm dấu ấn Việt Nam nhưng vẫn chuẩn phong cách **Modern Retro Pixel Art (Art Bible V5)**:

- **Chủ đề bối cảnh:** Hành trình buôn bán bất động sản dọc theo các địa danh và tuyến phố danh tiếng của Việt Nam: từ *Chợ Bến Thành, Hồ Gươm, Phố Cổ Hội An, Cầu Vàng Đà Nẵng, Cố Đô Huế, Chợ Nổi Cái Răng* đến các ô dịch vụ bình dân hài hước như *Tiệm Cơm Tấm Đêm, Quán Trà Đá Vỉa Hè, Bến Xe Miền Tây, Ga Hàng Cỏ*.
- **Phong cách thị giác (Art Bible V5):** 
  - Đồ họa 16-bit Detailed Pixel Art sắc nét, đường nét cơ học viền pixel đậm (`--px-line: #0a0807`), góc vát cut-corner 3px.
  - Bảng màu lấy cảm hứng từ phố thị Việt Nam: mái ngói đỏ đất nung (`#d35230`), tường vàng cổ điển phố Hội (`#f4c042`), xanh ngọc biển đảo (`--px-teal: #1a887a`), khung bàn gỗ sồi ấm áp (`--px-panel: #241c16`).
  - Tuyệt đối không sao chép nguyên mẫu bàn cờ Monopoly của phương Tây; không dùng gradient mờ hoặc bóng tròn SaaS.
- **Tone & Mood:** Náo nhiệt, cạnh tranh vui nhộn, "lụm kèo" chớp nhoáng, tạo tiếng cười sảng khoái khi bạn bè tranh giành từng mảnh đất hoặc bị phạt tiền đổ xăng/uống trà đá.

---

## 2. Luật chơi MVP (Tinh giản cho Webgame, Khắc phục Nhược điểm Bàn Cờ Vật Lý)

Bàn cờ vật lý Monopoly thường bị chê là ván đấu kéo dài quá lâu (1-3 tiếng) và dễ gây chán nản khi rơi vào bế tắc. Bản MVP của **Lụm Kèo** được tinh giản luật để một ván đấu web chỉ diễn ra trong **10 đến 15 phút**, nhịp độ dồn dập, kịch tính:

### 2.1. Cấu trúc Bàn cờ MVP (24 ô thay vì 40 ô):
Bàn cờ hình vuông khép kín gồm 24 ô (6 ô mỗi cạnh):
- **4 ô góc đặc biệt:**
  1. **Ô XUẤT PHÁT (Khởi Hành):** Đi qua nhận ngay `+200K` tiền vốn "lụm kèo".
  2. **Ô NHÀ TÙ (Tạm Giam Giao Thông):** Bị giữ chân tối đa 2 lượt (hoặc nộp `50K`, hoặc đổ xúc xắc ra đôi để ra sớm).
  3. **Ô BẾN XE DU LỊCH (Nghỉ Chân Miễn Phí):** Đỗ chân an toàn, không bị thu phí, nhận thưởng ngẫu nhiên.
  4. **Ô VÀO TÙ NGAY (Bị Bắt Quả Tang):** Di chuyển thẳng vào ô Nhà Tù ngay lập tức.
- **16 ô Đất Bất Động Sản:** Chia làm 4 cụm màu vùng miền (Bắc - Trung - Nam - Tây Nguyên), mỗi cụm 4 khu đất.
- **2 ô Cơ Hội ("Kèo Thơm"):** Rút thẻ nhận thưởng đột xuất (trúng vé số, được tài trợ, thu tiền bản quyền...).
- **2 ô Vận Mệnh ("Kèo Thối"):** Rút thẻ nộp phạt (thủng lốp xe, đóng thuế kinh doanh, khao bạn bè...).

### 2.2. Cơ chế Mua Đất, Nâng cấp & Thu Tiền Thuê:
- **Mua đất:** Khi dừng chân ở ô đất trống, người chơi có quyền mua với giá niêm yết.
- **Xây Nhà / Biệt Thự (Khách Sạn):**
  - Không cần đợi gom đủ toàn bộ màu mới được xây: Dừng lại ô đất của mình lần tiếp theo là được nâng cấp ngay (Cấp 1: Căn Nhà Gỗ ➔ Cấp 2: Nhà Phố Mái Ngói ➔ Cấp 3: Biệt Thự Lụm Kèo).
  - Phí dừng chân tăng vọt theo từng cấp công trình.
- **Độc quyền vùng miền (Monopoly Bonus):** Nếu sở hữu đủ 4 ô cùng màu, tiền thuê trên toàn bộ khu vực đó x2 tự động.

### 2.3. Điều kiện Thắng / Thua & Cơ chế Chống cù cưa:
- **Phá sản:** Khi số tiền mặt âm và không đủ tài sản cầm cố để trả nợ cho chủ nợ hoặc ngân hàng ➔ Bị loại ngay lập tức, tài sản bàn giao cho chủ nợ.
- **Giới hạn thời gian (Sudden Death):**
  - Ván đấu tối đa **25 vòng** (hoặc giới hạn 15 phút).
  - Khi hết 25 vòng, người có **Tổng giá trị tài sản lớn nhất (Tiền mặt + Giá trị đất/nhà)** giành chiến thắng vinh quang `ĐẠI PHÚ LỤM KÈO`.
  - Nếu chỉ còn 1 người chơi sống sót (các người chơi khác đều phá sản) ➔ Thắng tức thì.

---

## 3. Quy mô Phòng & Vòng lặp Trò chơi (Game Loop)

- **Quy mô:** 2 đến 4 người chơi / phòng (hỗ trợ Bot AI thay thế để test hoặc chơi đơn).
- **Thời gian mỗi lượt đi:** 15 giây (quá thời gian tự động đổ xúc xắc và mua đất mặc định).

```
[SẢNH CHỜ (2-4 Người)] 
       │
       ▼
[CHỌN QUÂN CỜ / TOKEN] 
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                   VÒNG LẶP LƯỢT ĐI (TURN LOOP)              │
│                                                             │
│ 1. ĐỔ XÚC XẮC (Hiệu ứng xúc xắc Pixel 3D lăn vui mắt)      │
│ 2. DI CHUYỂN TOKEN (Bước nhảy âm thanh retro lách cách)     │
│ 3. KÍCH HOẠT Ô:                                             │
│    - Ô Đất trống: [ Mua Ngay ] hoặc [ Bỏ Qua ] (5s đếm)     │
│    - Ô Đất của mình: [ Nâng Cấp Nhà ]                       │
│    - Ô Đất đối thủ: Trừ tiền thuê tự động                   │
│    - Ô Kèo Thơm / Kèo Thối: Lật thẻ bài Pixel               │
│    - Ô Góc (Tù / Bến Xe): Xử lý trạng thái                  │
│ 4. KIỂM TRA PHÁ SẢN / CHUYỂN LƯỢT TIẾP THEO                │
└─────────────────────────────────────────────────────────────┘
       │
       ▼ (Hết 25 vòng HOẶC chỉ còn 1 người chưa phá sản)
[BẢNG TỔNG KẾT & PHÁO HOA ĐẠI PHÚ]
```

---

## 4. Bố cục Không gian Bàn Cờ & Giao diện (Spatial UX)

Kế thừa kinh nghiệm bố cục không gian từ Cờ Cá Ngựa (`board-v5`) và phòng họp Ai Là Nội Gián:

- **Bàn cờ trung tâm (Orthographic / 2.5D Top-Down View):**
  - Tỉ lệ vuông chuẩn màn hình, viền bàn cờ là 24 ô đất bao quanh.
  - **Lòng bàn cờ (Khu trung tâm):** Nơi hiển thị đĩa đổ xúc xắc, khay cất thẻ Kèo Thơm / Kèo Thối, và bảng thông báo sự kiện ván đấu (News ticker: *"Người chơi Đỏ vừa thâu tóm Phố Cổ Hội An!"*).
- **HUD 4 Góc (Góc nhìn người chơi):**
  - 4 thẻ Profile người chơi đặt gọn gàng ở 4 góc màn hình: Avatar, màu cờ, số dư tiền mặt (`--px-gold`), số bất động sản đang sở hữu.
  - Đến lượt ai, góc profile của người đó sẽ nhấp nháy đèn viền pixel vàng rực rỡ và đếm ngược 15s.

---

## 5. Danh mục Asset cần vẽ mới & Dự toán Quota ảnh AI (Tối ưu triệt để)

Để giữ đúng nguyên tắc tiết kiệm chi phí và không vượt hạn mức của Ma Sói (8 lượt) và Ai Là Nội Gián (8 lượt):

| STT | Nhóm Asset | Chi tiết nội dung vẽ | Kỹ thuật tối ưu hóa | Số lượt AI đề xuất |
|:---:|---|---|---|:---:|
| **1** | **Bàn cờ Phố Thương Gia (Main Board)** | Bàn cờ vuông 24 ô góc nhìn 2.5D, viền đường phố Việt Nam, lòng bàn cờ có bãi cỏ trung tâm để đổ xúc xắc và cọc thẻ bài. | Vẽ toàn bộ cấu trúc bàn cờ trong 1 hình hoàn chỉnh (1024×1024), các tên ô đất và giá tiền do CSS/HTML render đè lên để dễ tùy biến. | **1 lượt** |
| **2** | **Bộ Quân cờ Token (Player Tokens)** | 4 linh vật pixel Việt Nam đại diện 4 người chơi: Xe Xích Lô, Chiếc Nón Lá, Ly Cà Phê Phin, Con Trâu Vàng. | **Ghép chung cả 4 linh vật vào 1 bức tranh Sprite Sheet** 4 góc màu (Đỏ / Xanh Dương / Vàng / Xanh Lá). | **1 lượt** |
| **3** | **Cụm Công trình Bất động sản (Buildings)** | 3 cấp nhà: Nhà Cấp 4 Mái Lá, Nhà Phố Mái Ngói Đỏ, Tòa Khách Sạn Biệt Thự Pixel. | **Ghép chung 3 cấp công trình + cọc cờ đánh dấu chủ quyền** vào 1 tấm Sprite Sheet 32×32px. | **1 lượt** |
| **4** | **Thẻ Bài Sự Kiện (Card Back & Frame)** | 2 mẫu mặt sau thẻ bài: Thẻ Kèo Thơm (Màu vàng kim may mắn) & Thẻ Kèo Thối (Màu tím quỷ quyệt). | **Vẽ chung 2 mẫu thẻ bài cạnh nhau** trên 1 lượt ảnh. Nội dung chữ bên trong do code HTML hiển thị. | **1 lượt** |
| **5** | **Xúc Xắc & Ký hiệu HUD (Dice & UI Icons)** | Bộ mặt xúc xắc 1-6 chấm pixel, cọc tiền polyme pixel, túi vàng, còng số 8 nhà tù, bảng cấm. | **Gom toàn bộ vào 1 Sprite Sheet icon 32×32px**. | **1 lượt** |
| **6** | **Banner / Poster Trang chủ (Homepage Hero)** | Tranh đại cảnh 3:2: Nhóm 4 nhân vật Lụm Kèo ngồi cười đùa tranh cãi quanh bàn cờ tỷ phú giữa phố đêm lung linh đèn lồng. | Dùng làm ảnh thumbnail chính trên Trang chủ Lụm Kèo và màn hình Loading sảnh chờ. | **1 lượt** |

### Tổng số lượt tạo ảnh AI đề xuất: **6 LƯỢT**
*(Thấp hơn cả Ma Sói và Ai Là Nội Gián nhờ chiến lược tận dụng Sprite Sheet tối đa cho Token, Nhà cửa, Thẻ bài và HUD).*

> [!IMPORTANT]
> **Cam kết của Gehihi:** Hiện tại **CHƯA** thực hiện bất kỳ lượt tạo ảnh AI nào, **CHƯA** giao việc vẽ cho Codex. Tài liệu này chỉ là bản đề cương thiết kế và dự toán ngân sách ảnh AI để @Mama trình Chủ dự án phê duyệt.

---

## 6. Kế hoạch Phối hợp Tiếp theo

1. **Trình Chủ dự án phê duyệt:** Phê duyệt chủ đề "Phố Thương Gia Lụm Kèo", luật chơi 24 ô chống cù cưa, và gói quota 6 lượt ảnh AI.
2. **Sau khi được duyệt:**
   - Gehihi soạn prompt chuẩn Art Bible V5 và bàn giao cho **Codex** / hệ thống tạo 6 asset nói trên.
   - Gehihi cắt ghép sprite sheet, đóng gói file tọa độ JSON tương tự `board-v5-grid.json` của Cờ Cá Ngựa.
   - Bàn giao trọn gói cho **Dev** và **Dev Phụ** ráp logic và giao diện chơi.
