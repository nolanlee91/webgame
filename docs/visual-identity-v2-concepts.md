# TÀI LIỆU KHÁM PHÁ THIẾT KẾ THỊ GIÁC V2 (VISUAL DIRECTION V2)
**Dự án:** Webgame Portal Giải Trí Đa Thế Hệ  
**Phiên bản:** V2 Exploration (Vòng nghiên cứu & định hướng mới, chưa phê duyệt/chốt)  
**Người thực hiện:** Gehihi (MausBot Agent) theo phân công từ Mama & Chủ dự án  
**Ngày thực hiện:** 17/11/2026  

---

## 1. Bối cảnh & Mục tiêu Định vị V2

### 1.1. Quyết định loại bỏ V1
Chủ dự án và Mama đã chính thức **từ chối cả 3 concept V1** với các phản hồi then chốt:
- **Flat Pop (V1):** Quá trẻ con, đường viền đen (black outlines) dày thô, thiếu độ tinh tế và sang trọng.
- **Cozy Paper-Craft (V1):** Giống sách tranh cắt dán thiếu nhi mầm non, không phù hợp người chơi trưởng thành.
- **Cyber Pixel-Arcade (V1):** Hiệu ứng neon tím/xanh quá nặng, giao diện rối rắm, gây mỏi mắt khi chơi lâu.

Toàn bộ tư liệu V1 đã được lưu trữ đối chiếu tại commit \c039747\ và thư mục \ssets/concepts/\.

### 1.2. Định vị "Modern Social Gaming" cho V2
- **Đối tượng trọng tâm:** Nhóm người chơi 20–39 tuổi (thế hệ đã gắn bó với game tuổi thơ, hiện là nhân viên văn phòng, phụ huynh trẻ) chơi cùng bạn bè hoặc con cái.
- **Tiêu chuẩn thị giác:** Hiện đại, tinh tế, sạch sẽ, có cá tính riêng; loại bỏ hoàn toàn viền đen hoạt hình dày cộp và neon chói lòa; không bị "công sở hóa" giống SaaS dashboard; tương thích hoàn hảo trên cả desktop và mobile.
- **Tiêu chí số 1 - Tính đồng bộ toàn hệ thống (Visual Consistency):** Dù đi theo concept nào, toàn bộ hệ sinh thái gồm: *Portal Homepage, Game Catalog, Multiplayer Lobby, Phòng chờ, HUD In-game, Hộp thoại/Popup, Thumbnail, và Gameplay của 18 game* phải dùng chung một ngôn ngữ thiết kế, hệ thống bo góc, đổ bóng, bảng màu và typography.

---

## 2. Chi Tiết 3 Hướng Thiết Kế V2

### CONCEPT 1: WARM MODERNIST ARCADE (Scandinavian Social Gaming)
> **Tệp ảnh minh họa thật:** \ssets/concepts-v2/direction-1-warm-modernist.png\ (Composite 4 màn hình)

* **Cảm hứng & Triết lý:** Lấy cảm hứng từ phong cách Scandinavian tối giản, thẩm mỹ giao diện Nintendo Switch kết hợp Apple Arcade và game indie nghệ thuật (*Monument Valley, Alto’s Adventure*). Mang đến cảm giác thư thái, thân thiện và ấm cúng như một phòng khách hiện đại vào buổi tối cuối tuần.
* **Ngôn ngữ đồ họa:**
  - Bề mặt phẳng lì có chiều sâu quang học (soft matte elevation), sử dụng bóng đổ môi trường đa lớp (ambient drop shadows) cực kỳ mềm mại.
  - Hoàn toàn **không dùng viền đen outline** thô cứng.
  - Các góc bo tròn vừa phải (border-radius: 12px–20px) tạo cảm giác thân thiện, xúc giác mượt mà.
* **Bảng màu chủ đạo:**
  - **Nền chính:** Kem yến mạch ấm (\#FAF7F2\) và trắng sữa (\#FFFFFF\), tạo không gian thoáng đãng, dễ chịu cho mắt.
  - **Màu nhấn tương tác:** Đất nung / quả hồng chín (\#E05A47\) cho các nút hành động chính (CTA: Chơi ngay, Tạo phòng).
  - **Màu bổ trợ:** Xanh lá xô thơm (Sage Green \#2E5A44\) và xanh rêu nhạt (\#DDE5DB\) đại diện cho sự tươi mới, gắn kết gia đình.
  - **Màu chữ & Khối:** Xanh navy đậm ngả than (\#1B263B\), đảm bảo độ tương phản chuẩn WCAG AAA mà không bị gắt như màu đen tuyền.
* **Typography:** Humanistic Sans hiện đại (Plus Jakarta Sans kết hợp Inter), nét chữ tròn trịa, hiện đại, độ dễ đọc cao ở mọi kích thước màn hình.
* **Giải pháp đồng bộ toàn hệ sinh thái:**
  - *Homepage & Catalog:* Thẻ game dạng khối nổi nhẹ, thumbnail 3D isometric mềm mại; nhãn tag bo tròn tinh tế.
  - *Multiplayer Lobby:* Thẻ người chơi dạng thẻ thành viên câu lạc bộ, avatar bo tròn với viền trạng thái mềm mại, mã phòng hiển thị lớn dạng font số rõ ràng.
  - *Game Caro:* Bàn cờ gỗ bạch dương sáng màu vân mịn, quân cờ đá mài lì tự nhiên (Navy X tương phản Đất nung O), HUD đếm giờ nổi nhẹ bên góc.
  - *Game Đào Vàng:* Nhân vật bác thợ mỏ vẽ theo phong cách indie art cách điệu ấm áp, khối vàng và đá quý có góc cạnh mài bóng tự nhiên, bảng kỹ năng (Thuốc nổ, Nước tăng lực) dùng icon phẳng tối giản viền mềm.

---

### CONCEPT 2: NEO-ARCADE GLASS (Translucent Retro-Chic)
> **Tệp ảnh minh họa thật:** \ssets/concepts-v2/direction-2-neo-arcade-glass.png\ (Composite 4 màn hình)

* **Cảm hứng & Triết lý:** Hiện đại hóa ký ức phòng game Arcade và máy chơi game cầm tay thập niên 90–2000 qua lăng kính đồ họa kính mờ bán trong suốt (Frosted Acrylic Glassmorphism). Mang lại năng lượng thi đấu sôi nổi, cuốn hút giới trẻ và phụ huynh hiện đại mà không rơi vào bẫy "cyberpunk/neon" chói lóa.
* **Ngôn ngữ đồ họa:**
  - Các lớp thẻ kính mờ (\ackdrop-filter: blur(16px)\, \gba(255,255,255,0.06)\) xếp lớp trên nền tối sâu thẳm.
  - Viền thẻ phản xạ vi mô siêu mảnh (1px border gradient) tạo cảm giác cao cấp, công nghệ cao.
  - Các viên thuốc trạng thái (pill-shaped badges) phát sáng nhẹ nhàng (soft luminescent glow).
* **Bảng màu chủ đạo:**
  - **Nền chính:** Xanh chàm thẫm sang trọng (\#0E131F\ kết hợp gradient \#131B2E\), triệt tiêu hoàn toàn mỏi mắt khi chơi ban đêm.
  - **Màu nhấn tương tác:** Vàng hổ phách Arcade (\#FFB800\) và xanh ngọc bạc hà mint (\#00E5A3\) đại diện cho chiến thắng, phần thưởng và năng lượng tích cực.
  - **Màu bổ trợ:** Xanh băng tuyết tím nhạt (\#8EA7E9\) dùng cho các chi tiết phụ trợ và hiệu ứng chuyển động.
* **Typography:** Geometric Techno-Sans hiện đại (Outfit / Space Grotesk), dứt khoát, các chữ số hiển thị điểm số và đồng hồ được thiết kế theo phom số thể thao điện tử hiện đại.
* **Giải pháp đồng bộ toàn hệ sinh thái:**
  - *Homepage & Catalog:* Header thanh thoát kính mờ, carousel game nổi bật với hiệu ứng thẻ trôi đa tầng, badge "Đang hot", "4 người" nổi bật.
  - *Multiplayer Lobby:* Danh sách phòng thi đấu với thẻ kính sẫm màu, chỉ số trạng thái "Sẵn sàng" sáng xanh ngọc mint, nút "Vào phòng" / "Tạo phòng" màu hổ phách và mint bóng bẩy.
  - *Game Caro:* Bàn cờ slate xám đen khắc laser chìm, quân X xanh mint phát quang và quân O vàng hổ phách, hiệu ứng vệt sáng mờ khi đặt quân.
  - *Game Đào Vàng:* Bối cảnh hang mỏ huyền bí ánh dạ quang, vàng và kim cương phát sáng tinh thể quyến rũ, cụm HUD hiển thị thời gian và điểm số dạng kính mờ tinh tế.

---

### CONCEPT 3: EDITORIAL TABLETOP (Modern Boardgame Social Club)
> **Trạng thái minh họa:** Đã hoàn thiện toàn bộ đặc tả mỹ thuật (Art Spec) & Prompt; bước sinh ảnh thực tế dừng lại do giới hạn Quota hàng tuần của model AI tạo ảnh (\gemini-3.1-flash-image\ đạt ngưỡng 429 Resource Exhausted).

* **Cảm hứng & Triết lý:** Lấy cảm hứng từ thời hoàng kim của các trò chơi cờ bàn gia đình hiện đại châu Âu (*Catan, Wingspan, Ticket to Ride*) và tạp chí thiết kế đương đại. Tạo ra một "phòng trà trò chơi" trực tuyến — nơi mỗi tựa game giống như một bộ boardgame cao cấp được bày biện trên bàn gỗ.
* **Ngôn ngữ đồ họa:**
  - Chất liệu giấy mỹ thuật dày dặn, bề mặt canvas/linen nhám mịn không lóa.
  - Nét vẽ vector tinh xảo kết hợp mảng màu dập chìm (engraved / letterpress effect).
  - Huy hiệu kim loại đồng thau (brass badges), thẻ bài bo góc cổ điển, con dấu chứng nhận.
  - Hoàn toàn khác biệt với sách tranh trẻ em V1: đây là phong cách bàn chơi trí tuệ, đĩnh đạc và giàu tính thẩm mỹ.
* **Bảng màu chủ đạo:**
  - **Nền chính:** Giấy ngà cổ điển (Warm Bone / Parchment \#F4EFEA\) phối cùng màu gỗ mộc (\#EAE3D9\).
  - **Màu nhấn tương tác:** Vàng mật ong hổ phách (\#E5A93C\) và đỏ đất nung gốm sứ (\#C85A32\).
  - **Màu cấu trúc:** Xanh dầu thẫm (Deep Petroleum Navy \#14213D\) làm khung viền và tiêu đề chính.
  - **Màu chữ:** Than chì tự nhiên (\#1A1D20\), thanh nhã và sang trọng.
* **Typography:** Kết hợp nghệ thuật giữa Modern Serif/Slab tiêu đề (phong cách Fraunces/Recoleta) tạo sự hoài niệm đầm ấm, đi kèm font Sans-serif trung tính (DM Sans / Inter) cho toàn bộ hệ thống số liệu, nút bấm và HUD.
* **Giải pháp đồng bộ toàn hệ sinh thái:**
  - *Homepage & Catalog:* Bố cục dạng lưới tạp chí nghệ thuật, thẻ game mô phỏng hộp boardgame sang trọng với thông số thời gian chơi và số người tham gia ("2-4 người", "15 phút").
  - *Multiplayer Lobby:* Không gian "Bàn chơi cộng đồng", mỗi phòng game là một bàn chơi với ghế ngồi dạng token gỗ, nút "Mở bàn mới" phong cách huy hiệu đồng thau.
  - *Game Caro:* Bàn cờ gỗ óc chó đánh bóng cao cấp, quân cờ gốm sứ mộc mạc âm vang tiếng gõ, đồng hồ tính giờ cơ học vintage bằng kim loại.
  - *Game Đào Vàng:* Phong cách đoàn thám hiểm địa chất cơn sốt vàng, bản đồ kho báu cổ, các khối khoáng vật tự nhiên và cần trục cơ khí đồng thau.

---

## 3. Bảng So Sánh Đối Chiếu 3 Hướng V2

| Tiêu chí | Hướng 1: Warm Modernist Arcade | Hướng 2: Neo-Arcade Glass | Hướng 3: Editorial Tabletop |
| :--- | :--- | :--- | :--- |
| **Ảnh thật minh họa** | \ssets/concepts-v2/direction-1-warm-modernist.png\ | \ssets/concepts-v2/direction-2-neo-arcade-glass.png\ | Đã có Art Spec & Prompt (dừng do Quota) |
| **Phong cách nền** | Sáng ấm (Oat / Cream \#FAF7F2\) | Tối sâu (Dark Indigo Glass \#0E131F\) | Giấy ngà / Canvas (\#F4EFEA\) |
| **Xử lý viền & khối** | Matte elevation, bóng mềm, không viền | Thẻ kính mờ, viền phản quang 1px | Thẻ bài canvas, dập chìm, huy hiệu đồng |
| **Cảm xúc mang lại** | Thư thái, ấm cúng, thân thiện gia đình | Sôi nổi, hiện đại, năng lượng thi đấu | Hoài niệm, tinh tế, trí tuệ, đĩnh đạc |
| **Độ tuổi tiếp cận** | Rất tốt cho phụ huynh 25–39 và trẻ nhỏ | Rất hút giới trẻ 18–35 và người thích arcade | Phù hợp người chơi yêu thích cờ bàn & gia đình |
| **Khả năng scale 18 game** | Cực kỳ dễ scale, asset nhẹ, tải nhanh | Rất hợp game multiplayer & nhịp độ nhanh | Rất hợp game trí tuệ, cờ, đối kháng truyền thống |

---

## 4. Nhật Ký Kiểm Soát Quota & Kỹ Thuật (Quota Audit Log)

Tuân thủ nghiêm ngặt chỉ đạo của Mama và Chủ dự án:
- **Hạn mức yêu cầu:** Tối đa 6 lượt tạo ảnh AI, kiểm tra quota trước khi thực hiện, không dùng dịch vụ trả phí, dừng ngay khi thiếu quota.
- **Trạng thái Quota trước khi thực hiện:**
  - Engine: Google Gemini (Antigravity)
  - Quota ghi nhận tại hệ thống: 35.4% Gemini weekly used.
- **Quá trình thực thi:**
  - Lượt 1: Tạo Concept 1 (\concept_warm_modernist\) -> **Thành công** (Lưu tại \ssets/concepts-v2/direction-1-warm-modernist.png\).
  - Lượt 2: Tạo Concept 2 (\concept_neo_arcade\) -> **Thành công** (Lưu tại \ssets/concepts-v2/direction-2-neo-arcade-glass.png\).
  - Lượt 3: Tạo Concept 3 (\concept_editorial_tabletop\) -> **Model Image Quota Exhausted**: Gặp lỗi HTTP 429 (\RESOURCE_EXHAUSTED\, \model: gemini-3.1-flash-image\, \quotaResetDelay: ~167 giờ\).
- **Trạng thái Quota sau khi thực hiện:**
  - Antigravity weekly: 37.9% used.
  - Sub-model tạo ảnh (\gemini-3.1-flash-image\): Đã chạm trần phân bổ hạn mức hình ảnh hàng tuần của hệ sinh thái.
- **Xử lý dừng đúng quy trình:**
  - Lập tức dừng tạo ảnh, không cố thử lại hay bypass.
  - Không phát sinh bất kỳ khoản phí ngoài nào.
  - Lưu giữ 2 ảnh chất lượng cao hoàn thiện cho 2 hướng đầu tiên, và bảo lưu bộ thông số hoàn chỉnh cho hướng thứ 3.

---

## 5. Kết Luận & Khuyến Nghị Tiếp Theo

1. **Không tự ý chọn hoặc phê duyệt:** Toàn bộ 3 hướng được trình bày độc lập, khách quan để Mama và Chủ dự án đánh giá.
2. **Độ hoàn thiện:** Cả 2 ảnh V2 đã tạo thành công đều khắc phục triệt để các nhược điểm của V1 (không viền đen hoạt hình, không giống tranh mầm non, không neon rối mắt).
3. **Bước tiếp theo:** Sau khi Chủ dự án và Mama xem xét tài liệu này và 2 hình ảnh minh họa thực tế tại thư mục \ssets/concepts-v2/\, đội ngũ sẽ chờ phản hồi chính thức trước khi tiến hành bước xây dựng Art Bible chi tiết cho concept được chọn.
