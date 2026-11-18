# Đề cương Game Design & Art Direction MVP: Ma Sói (Werewolf)
**Dự án:** Webgame Portal (Thương hiệu Lụm Kèo)  
**Tài liệu:** Werewolf MVP Game Design & Visual Direction Outline  
**Người lập:** Gehihi (UX/UI & Art Designer)  
**Trạng thái:** Đề xuất trình @Mama và Chủ dự án phê duyệt trước khi tạo asset & lập trình  
**Nguyên tắc chỉ đạo:** Art Bible V5 (Premium Detailed Pixel Art × Spatial UX × Rich Game Mood)

---

## 1. Danh sách Vai trò Bản đầu (MVP Roles - Tối ưu cho phòng 6 - 8 người)

Để bản MVP ra mắt nhanh chóng, mạch lạc và dễ cân bằng trong môi trường Webgame Portal "Lụm Kèo", đề xuất tinh giản danh sách vai trò xuống **4 vai trò cốt lõi**:

| Phe | Vai trò | Số lượng (Phòng 6-8) | Cơ chế & Kỹ năng trong đêm |
|---|---|---|---|
| **Phe Sói** | **Ma Sói** (Werewolf) | 2 | Thức dậy cùng đồng bọn, trao đổi qua kênh chat bí mật và đồng thuận chọn 1 nạn nhân để cắn. |
| **Phe Dân** | **Tiên Tri** (Seer) | 1 | Thức dậy, chọn soi 1 người chơi bất kỳ để biết phe (Sói hay Dân). |
| **Phe Dân** | **Bảo Vệ** (Bodyguard) | 1 | Thức dậy, chọn ban khiên bảo vệ 1 người (không được bảo vệ cùng 1 người 2 đêm liên tiếp). |
| **Phe Dân** | **Dân Làng** (Villager) | 2 - 4 | Không có kỹ năng đêm. Sức mạnh nằm ở khả năng phân tích, tranh biện và biểu quyết treo cổ vào ban ngày. |

> *Ghi chú mở rộng (V1.1):* Các vai trò biến thể phức tạp hơn (Phù Thủy, Thợ Săn, Bán Sói, Kẻ Phản Bội) sẽ được bổ sung sau khi kiến trúc đồng bộ multiplayer chạy trơn tru.

---

## 2. Quy mô Phòng & Vòng lặp Trò chơi (Game Loop)

- **Quy mô:** 6 - 8 người chơi / phòng (hỗ trợ thêm Bot thế chỗ khi thiếu người test).
- **Thời lượng ước tính:** 5 - 8 phút / ván.

```
+---------------+     +---------------+     +---------------+     +---------------+
|   SẢNH CHỜ    | --> |   PHÁT THẺ    | --> |    PHA ĐÊM    | --> |  BÌNH MINH    |
| (Lobby Board) |     |  (Ẩn vai trò) |     | (30s kỹ năng) |     | (Công bố chết)|
+---------------+     +---------------+     +---------------+     +---------------+
                                                   ^                      |
                                                   |                      v
                                            +---------------+     +---------------+
                                            | KẾT THÚC VÁN  | <-- |   PHA NGÀY    |
                                            | (Thắng / Thua)|     | (Chat & Vote) |
                                            +---------------+     +---------------+
```

### Chi tiết các pha:
1. **Phát thẻ bài bí mật (Đầu trận - 5s):** Hiệu ứng lật thẻ bài Pixel Art riêng tư cho từng người chơi. Server quản lý bí mật vai trò, chống gian lận/soi mạng.
2. **Pha Đêm (Night Phase - 30s):**
   - Không gian chìm vào bóng tối. Mọi người "nhắm mắt đi ngủ".
   - **Tiên Tri** thức dậy (10s) -> Click chọn 1 người -> Quả cầu pha lê pixel phát sáng báo kết quả.
   - **Bảo Vệ** thức dậy (10s) -> Click chọn 1 người -> Khiên ánh sáng xanh che chở.
   - **Ma Sói** thức dậy (15s) -> Chat riêng giữa 2 Sói -> Chọn mục tiêu cắn.
3. **Bình Minh & Báo cáo kết quả (Dawn - 10s):**
   - Đèn sáng dần, tiếng chuông làng báo tử (hoặc thông báo "Đêm qua là một đêm bình yên" nếu được Bảo vệ cứu kịp).
4. **Pha Ngày - Thảo luận (Day Discussion - 60s):**
   - Tranh biện qua khung chat text và bộ Quick-Emoji Pixel hài hước ("Tôi là dân!", "Nghi ngờ quá", "Cứu tôi!").
5. **Pha Ngày - Bỏ phiếu Treo cổ (Day Voting - 20s):**
   - Người chơi đặt thẻ bài biểu quyết vào nghi phạm. Người nhiều phiếu nhất sẽ bị đưa lên giàn treo cổ và lộ diện thẻ vai trò.
6. **Điều kiện Thắng / Thua:**
   - **Phe Dân thắng:** Khi toàn bộ Ma Sói đã bị loại bỏ.
   - **Phe Sói thắng:** Khi số Ma Sói bằng hoặc lớn hơn số Dân Làng còn sống.

---

## 3. Hiệu ứng Chuyển cảnh Ngày / Đêm (Visual Phase Transitions)

Bám sát yêu cầu chuyển cảnh ấn tượng, rõ rệt của Chủ dự án:

### Bảng màu biến chuyển theo chu kỳ:
- **Pha Ban Ngày (Day / Voting):**
  - Khí sắc: Ấm áp, nhộn nhịp, dân dã kiểu làng quê pixel Lụm Kèo.
  - Màu nền chính: Đất gỗ ấm `#2c221b`, ánh nắng vàng cam `#f5d77f`, sắc xanh cây cỏ `#3a7d44`.
  - Khung giao diện: Gỗ sồi sáng viền nổi pixel bevel (`--px-panel: #2a2119`).
- **Pha Chuyển giao (Hoàng Hôn Dusk & Bình Minh Dawn):**
  - Hiệu ứng đổi màu Dithering Pixel 16-bit toàn màn hình (chuyển êm từ vàng ấm sang tím thẫm hoặc ngược lại trong 2 giây).
  - Đi kèm tiếng chuông đồng hồ gõ 3 tiếng vang xa và hiệu ứng sương mù pixel bay ngang màn hình.
- **Pha Ban Đêm (Night):**
  - Khí sắc: Lạnh lẽo, cô tịch, nguy hiểm rình rập.
  - Màu nền chính: Xanh đen dạ trời `#0b0e14`, ánh trăng bạc `#7ea7e0`, điểm xuyết mắt sói đỏ rực `#e03c3c`.
  - Khung giao diện: Chuyển sang gỗ ngâm tối màu `#12161f`.
  - **Đồng hồ chu kỳ (Cycle Dial):** Một biểu tượng pixel Mặt Trời / Mặt Trăng lớn (48×48px) ở trung tâm đỉnh đầu xoay kim đếm ngược thời gian từng pha.

---

## 4. Danh mục Asset cần tạo & Dự toán Quota Ảnh AI

*Tuân thủ tuyệt đối Art Bible V5: Pixel art chi tiết cao, nét viền đen cơ học 2-3px, bóng đổ cứng, không dùng gradient mờ hoặc phong cách bo tròn SaaS.*

| Nhóm Asset | Tên cụ thể | Quy cách & Phong cách | Số lượt AI đề xuất |
|---|---|---|---|
| **1. Thẻ bài Vai trò (Role Cards)** | - Ma Sói (Werewolf)<br>- Dân Làng (Villager)<br>- Tiên Tri (Seer)<br>- Bảo Vệ (Bodyguard) | Thẻ đứng 3:4 pixel sắc nét. Nhân vật có thần thái biểu cảm đặc trưng thương hiệu Lụm Kèo. | **4 lượt** |
| **2. Bối cảnh Sân họp làng (Village Board)** | - Làng Ban Ngày (Day Board)<br>- Làng Ban Đêm (Night Board) | Khung cảnh góc nhìn Isometric/Top-down 16:9 với đống lửa trại ở giữa và các ghế gỗ quanh vòng tròn. Hai bản ngày/đêm khớp tọa độ để chuyển cảnh liền mạch. | **2 lượt** |
| **3. Icon & Ký hiệu chu kỳ (HUD Sprite Sheet)** | Mặt Trời, Mặt Trăng, Khiên bảo vệ, Cầu pha lê, Móng vuot sói, Dây treo cổ | Tạo dạng Sprite Sheet 32×32 pixel trên 1 bức tranh duy nhất rồi cắt lẻ bằng CSS để tiết kiệm lượt ảnh. | **1 lượt** (Gom Sprite Sheet) |
| **4. Poster / Banner Trang chủ** | Key Artwork Ma Sói Lụm Kèo | Tỉ lệ 3:2 đại cảnh phục vụ ô nổi bật Multiplayer trên Homepage mới. | **1 lượt** |

### Tổng số lượt tạo ảnh AI đề xuất: **8 lượt**
*(Mức tối ưu hóa triệt để, tận dụng sprite sheet và chỉ tạo 4 vai trò cốt lõi).*

> [!IMPORTANT]
> **Cam kết:** Hiện tại **CHƯA** thực hiện bất kỳ lượt tạo ảnh AI nào. Toàn bộ 8 lượt trên chỉ là bảng dự toán chờ @Mama và Chủ dự án phê duyệt.

---

## 5. Kế hoạch Phối hợp Tiếp theo

1. **Trình duyệt:** @Mama xem xét và trình Chủ dự án duyệt danh sách vai trò MVP, cơ chế chuyển cảnh và hạn mức 8 lượt ảnh AI.
2. **Triển khai (sau khi duyệt):**
   - Gehihi tiến hành sinh 8 lượt ảnh theo đúng prompt tiêu chuẩn Art Bible V5.
   - Bàn giao bộ mockup giao diện và asset cho **Dev** dựng khung kiến trúc WebSocket / Multiplayer.
