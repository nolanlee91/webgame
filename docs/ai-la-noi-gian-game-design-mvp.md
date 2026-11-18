# Đề cương Game Design & Art Direction MVP — "Ai Là Nội Gián"
*(Dự án Webgame Portal "Lụm Kèo" · Game xã hội ẩn vai trò nhiều người)*

**Tác giả:** Gehihi (Art Direction & UX Lead)  
**Tài liệu tham chiếu:** `docs/art-bible-v5.md`, `docs/ma-soi-game-design-mvp.md`  
**Trạng thái:** Bản đề cương sơ bộ trình duyệt (Chưa tạo asset / Chưa giao Codex vẽ).

---

## 1. Ý tưởng Bối cảnh & Chủ đề: "Tổng Bộ Mật Vụ Lụm Kèo" (The Secret Agency HQ)

Để tạo sự khác biệt hoàn toàn với không gian làng quê cổ tích, rừng rậm và đống lửa của **Ma Sói**, game **"Ai Là Nội Gián"** được định vị theo phong cách **Trinh thám Cổ điển kết hợp Retro Cyberpunk (Neo-Noir Detective Pixel)**:

- **Bối cảnh:** Phòng điều hành trung tâm của *Tổng Bộ Mật Vụ Lụm Kèo* (Command Center). Không gian phòng họp bảo mật cao với bàn hội nghị chữ nhật lớn, màn hình radar quét tín hiệu xanh lá, bảng ghim hồ sơ mật dán ảnh nối chỉ đỏ, máy đánh chữ và ánh đèn bàn vàng ấm.
- **Phong cách thị giác (Art Bible V5):** 16-bit Detailed Pixel Art, góc cạnh bevel/pixel-cut cứng cáp, tỷ lệ nhân vật người lớn trưởng thành (5–6 đầu, lịch lãm, bí ẩn, tuyệt đối không chibi/anime), tương phản ánh sáng mạnh giữa bóng tối và ánh neon.
- **Tone & Mood:** Hồi hộp, đấu trí căng thẳng, nghi ngờ lẫn nhau nhưng vẫn giữ nét hóm hỉnh đặc trưng của cổng game "Lụm Kèo".

---

## 2. Danh sách Vai trò MVP (Tối ưu phòng 6 - 8 người)

Đề xuất tinh giản xuống **4 vai trò cốt lõi**, giữ nguyên sự cân bằng kinh điển nhưng thay đổi hoàn toàn danh xưng và hành vi theo chủ đề mật vụ:

| Phe | Vai trò | Số lượng (Phòng 6-8) | Cơ chế & Kỹ năng trong Ca trực Đêm |
|---|---|---|---|
| **Phe Nội Gián** | **Nội Gián** *(The Mole)* | 2 | Thức dậy cùng đồng bọn, trao đổi qua kênh chat mã hóa bí mật và đồng thuận chọn 1 đặc vụ để **"Vô hiệu hóa / Ám hại"** (loại khỏi ván). |
| **Phe Đặc Vụ** | **Hacker Mật** *(Cyber Analyst)* | 1 | Thức dậy, chọn đột nhập dữ liệu soi hồ sơ 1 người chơi để kiểm tra danh tính (kết quả trả về: *Nội Gián* hoặc *Đặc Vụ*). |
| **Phe Đặc Vụ** | **Kỹ Sư An Ninh** *(Security Chief)* | 1 | Thức dậy, kích hoạt tường lửa bảo vệ 1 người không bị ám hại đêm đó (không được bảo vệ cùng 1 người 2 đêm liên tiếp). |
| **Phe Đặc Vụ** | **Đặc Vụ Hiện Trường** *(Field Agent)* | 2 - 4 | Không có kỹ năng đêm. Ban ngày tham gia đối chất lời khai, phân tích dữ liệu an ninh và bỏ phiếu bắt giữ nghi phạm. |

> *Ghi chú mở rộng (V1.1):* Các vai trò nâng cao như *Kẻ Chỉ Điểm (Snitch)*, *Điệp Viên Hai Mang (Double Agent)*, *Chuyên Viên Gỡ Bom* sẽ được bổ sung sau khi bản MVP hoàn tất.

---

## 3. Quy mô Phòng & Vòng lặp Trò chơi (Game Loop)

- **Quy mô:** 6 - 8 người chơi / phòng (hỗ trợ Bot thế chỗ khi thiếu người test).
- **Thời lượng ước tính:** 5 - 8 phút / ván.

```
+---------------+     +---------------+     +---------------+     +---------------+
|   SẢNH CHỜ    | --> |   PHÁT THẺ    | --> | PHA ĐÊM BẢO MẬT| --> | BÁO CÁO CA TRỰC|
| (Lobby Board) |     |  (Ẩn vai trò) |     | (30s kỹ năng) |     | (Công bố bị hại)|
+---------------+     +---------------+     +---------------+     +---------------+
                                                   ^                      |
                                                   |                      v
                                            +---------------+     +---------------+
                                            | KẾT THÚC VÁN  | <-- |   PHA NGÀY    |
                                            | (Thắng / Thua)|     | (Họp & Bỏ phiếu)|
                                            +---------------+     +---------------+
```

### Chi tiết các pha:
1. **Phát thẻ mật vụ bí mật (Đầu trận - 5s):** Hiệu ứng lật thẻ ID mật vụ Pixel Art riêng tư. Server bảo mật vai trò tuyệt đối, chống lộ thông tin.
2. **Pha Đêm - Mất điện & Kỹ năng (Night Phase - 30s):**
   - Hệ thống báo động: "Mất điện toàn khu vực! Kích hoạt chế độ cách ly".
   - **Hacker Mật** thức dậy (10s) -> Click soi hồ sơ 1 người -> Màn hình radar pixel báo kết quả xanh/đỏ.
   - **Kỹ Sư An Ninh** thức dậy (10s) -> Click chọn 1 người -> Kích hoạt khiên tường lửa mã hóa.
   - **Nội Gián** thức dậy (15s) -> Chat mật giữa 2 nội gián -> Chọn 1 mục tiêu để vô hiệu hóa.
3. **Báo cáo Ca trực Ban mai (Dawn - 10s):**
   - Đèn phòng họp bật sáng dần, còi báo động dứt, màn hình hiển thị: Đặc vụ bị loại đêm qua (hoặc "Đêm qua an toàn nhờ tường lửa can thiệp kịp thời").
4. **Pha Ngày - Họp khẩn & Thảo luận (Day Discussion - 60s):**
   - Các đặc vụ đối chất qua khung chat và bộ Emoji Pixel hài hước ("Tôi trong sạch!", "Tín hiệu đáng ngờ", "Xem lại camera!").
5. **Pha Ngày - Bỏ phiếu Bắt giữ (Day Voting - 20s):**
   - Bỏ phiếu tra tay vào Còng số 8. Người nhận nhiều phiếu nhất bị tống vào Buồng giam cách ly và công bố danh tính.
6. **Điều kiện Thắng / Thua:**
   - **Phe Đặc Vụ thắng:** Toàn bộ 2 Nội Gián bị vạch mặt và tống giam.
   - **Phe Nội Gián thắng:** Số lượng Nội Gián bằng hoặc nhiều hơn số Đặc Vụ còn lại.

---

## 4. Hiệu ứng Chuyển cảnh Ngày / Đêm (Visual Phase Transitions)

Bám sát yêu cầu chuyển cảnh ngày/đêm rõ nét của Chủ dự án:

### Bảng màu biến chuyển theo chu kỳ:
- **Pha Ban Ngày (Họp Khẩn / Bỏ Phiếu):**
  - Khí sắc: Ánh sáng đèn trần phòng họp, nghiêm túc, tập trung, sắc nét.
  - Bảng màu: Vàng hổ phách `#f5d77f`, nâu gỗ sồi bàn họp `#2c221b`, xanh hải quân mật vụ `#1b2a4a`.
  - Khung giao diện: Bevel pixel xám thép công vụ (`--px-panel: #1e232d`).
- **Pha Chuyển giao (Còi Báo Động Red Alert & Khởi động lại hệ thống):**
  - Hiệu ứng màn hình CRT scanlines chớp giật (dithering 16-bit), đèn xoay cảnh báo đỏ nhấp nháy 2 giây.
  - Đi kèm hiệu ứng âm thanh còi hú báo động ngắn và tiếng sập cầu dao điện.
- **Pha Ban Đêm (Mất Điện / Hoạt Động Ngầm):**
  - Khí sắc: Lạnh lẽo, căng thẳng, nguy hiểm rình rập trong bóng tối.
  - Bảng màu: Xanh đen terminal `#0b0e14`, xanh phosphor radar `#33ff33`, ánh đèn báo động đỏ rực `#e74c3c`.
  - Khung giao diện: Chuyển sang viền đen kim loại bóng mờ.
  - **Đồng hồ chu kỳ (Cycle Dial):** Biểu tượng pixel Radar quét 360 độ (48×48px) ở đỉnh màn hình xoay kim đếm ngược thời gian từng pha.

---

## 5. Danh mục Asset cần vẽ mới & Dự toán Quota ảnh AI

*Tuân thủ Art Bible V5: Pixel art 16-bit chi tiết cao, nét viền cứng 2-3px, tỷ lệ nhân vật người lớn 5-6 đầu, tuyệt đối không dùng gradient mờ hoặc phong cách bo tròn SaaS.*

| Nhóm Asset | Tên cụ thể | Quy cách & Phong cách | Số lượt AI đề xuất |
|---|---|---|---|
| **1. Thẻ bài Vai trò (Role Cards)** | - Nội Gián *(The Mole)*<br>- Hacker Mật *(Cyber Analyst)*<br>- Kỹ Sư An Ninh *(Security Chief)*<br>- Đặc Vụ Hiện Trường *(Field Agent)* | Thẻ đứng 3:4 pixel sắc nét. Nhân vật mặc âu phục mật vụ, thần thái bí ẩn, đeo kính đen/hoodie/tai nghe đàm thoại. | **4 lượt** |
| **2. Bối cảnh Phòng Chỉ Huy (HQ Board)** | - Phòng Chỉ Huy Ban Ngày *(Day HQ)*<br>- Phòng Chỉ Huy Ban Đêm *(Night Red Alert)* | Góc nhìn Isometric/Top-down 16:9 bàn hội nghị trung tâm, màn hình điều khiển lớn. Khớp chính xác tọa độ góc nhìn để fade chuyển cảnh liền mạch. | **2 lượt** |
| **3. Icon & Ký hiệu chu kỳ (HUD Sprite Sheet)** | Radar quét, Còng số 8, Khiên tường lửa, Mắt camera soi, USB hack mã độc, Huy hiệu mật vụ Lụm Kèo | Tạo dạng Sprite Sheet 32×32 pixel trên 1 bức tranh duy nhất rồi cắt tọa độ CSS để tiết kiệm tối đa lượt ảnh. | **1 lượt** (Gom Sprite Sheet) |
| **4. Poster / Banner Trang chủ** | Key Artwork "Ai Là Nội Gián — Lụm Kèo" | Tỷ lệ 3:2 đại cảnh 2 đặc vụ đối đầu dưới ánh đèn neon trinh thám, phục vụ ô nổi bật Multiplayer trên Homepage. | **1 lượt** |

### Tổng số lượt tạo ảnh AI đề xuất: **8 lượt**
*(Mức tối ưu hóa triệt để tương tự Ma Sói, tận dụng sprite sheet và chỉ tạo 4 vai trò cốt lõi).*

> [!IMPORTANT]
> **Cam kết:** Hiện tại **CHƯA** thực hiện bất kỳ lượt tạo ảnh AI nào và **CHƯA** giao Codex vẽ. Toàn bộ 8 lượt trên chỉ là bảng dự toán chờ @Mama và Chủ dự án phê duyệt.

---

## 6. Kế hoạch Phối hợp Tiếp theo

1. **Trình duyệt:** @Mama xem xét và trình Chủ dự án duyệt concept bối cảnh Tổng Bộ Mật Vụ, 4 vai trò MVP và hạn mức 8 lượt ảnh AI.
2. **Giao việc Codex (sau khi có lệnh duyệt):** Codex sẽ lập prompt chuẩn Art Bible V5 và tiến hành sinh đúng 8 lượt ảnh theo danh mục trên.
3. **Bàn giao Dev:** Dev tái sử dụng kiến trúc máy chủ WebSocket và state machine ngày/đêm của Ma Sói để dựng nhanh gameplay cho Ai Là Nội Gián mà không cần viết lại hạ tầng.
