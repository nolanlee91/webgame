# Danh mục Game & Đặc tả Giao diện Trang chủ (V2)
**Dự án:** Webgame Portal  
**Tài liệu:** Game Catalog Expansion & Homepage Discovery Spec (V2)  
**Tác giả:** Gehihi (UX/UI Designer)  
**Trạng thái:** Đề xuất kế hoạch V2 (Chờ Product Manager & Chủ dự án xem xét)  
**Ngày lập:** 17/11/2026  

---

## 1. Nghiên cứu bài học từ các cổng webgame hàng đầu

Để xây dựng một danh mục game đa dạng từ 15–20 trò chơi cho đợt Public Launch mà không làm người dùng bị ngợp hay lạc lối, chúng tôi rút ra các bài học thực tiễn từ các nền tảng:

### 1.1. Poki (Instant Discovery & Dynamic Bento Grid)
* **Bento Grid không đồng nhất:** Không dùng lưới các ô vuông đều tăm tắp nhàm chán. Poki dùng ô 1x1, 2x1, 2x2 để dẫn dắt thị giác vào các tựa game nổi bật.
* **Tagging hành vi tức thì:** Thẻ game gắn tag theo tâm trạng và ngữ cảnh: *"Chơi cùng bạn (2 Người)"*, *"Mới ra mắt"*, *"Gợi ý cho bạn"*, *"Giải đố thư giãn"*.
* **Zero-Friction:** 1 click chơi ngay, không màn hình chờ đăng nhập, lưu tiến trình tự động bằng LocalStorage/IndexedDB.

### 1.2. Đấu Trí (Social Viral & Room Loop tại Việt Nam)
* **Tâm lý so tài trực tiếp:** Người Việt Nam rất chuộng các game đối kháng trí tuệ nhanh (Cờ Caro, Nối từ, Đố vui).
* **Viral qua kênh nhắn tin (Zalo / Messenger):** Người chơi có nhu cầu "rủ bạn bè vào phòng chiến ngay". Cơ chế Deep-link kèm mã phòng ngắn gọn (6 ký tự) giúp tỷ lệ rủ rê thành công vượt trội so với gửi link game chung chung.
* **Bảng xếp hạng & Vinh danh:** Cạnh tranh thứ hạng (Top tuần, Top game) là động lực giữ chân người chơi lâu dài.

### 1.3. CrazyGames & itch.io (Phân cấp & Đa dạng hóa thể loại)
* **CrazyGames:** Thanh sidebar danh mục với icon minh họa 3D sống động; bộ lọc phân nhánh rõ ràng (Tags, Số người chơi, Đánh giá của cộng đồng).
* **itch.io:** Tôn vinh tính cá bản và phong cách nghệ thuật của từng game độc lập (Indie vibes), mang lại cảm giác mới lạ chứ không công nghiệp hóa.

---

## 2. Đề xuất danh mục 18 Game trọng tâm cho Thị trường Việt Nam

Danh mục 18 game được tuyển chọn dựa trên thói quen chơi game web lâu đời tại Việt Nam (kết hợp các thể loại hoài niệm, giải trí nhẹ nhàng công sở/trường học, và game thi đấu bạn bè).

### Bảng chi tiết 18 tựa game
*Thang điểm đánh giá: 1 (Rất thấp) đến 5 (Xuất sắc)*

| STT | Tên Game | Thể loại | Chế độ | Mô tả trải nghiệm | Sức hấp dẫn | Chơi lại | Chia sẻ | Phù hợp SEO | Tổng điểm (/20) |
|:---:|---|---|---|---|:---:|:---:|:---:|:---:|:---:|
| 1 | **Cờ Caro Trực Tuyến** | Board / Trí tuệ | Multiplayer (1v1 & Bot) | Đánh cờ 5 ô thắng kinh điển, tạo phòng gửi link bạn bè qua Zalo hoặc ghép ngẫu nhiên. | 5 | 5 | 5 | 5 | **20** |
| 2 | **Rắn Săn Mồi Siêu Cấp (Snake Battle)** | Arcade / Casual | Multiplayer & Single | Điều khiển rắn ăn kẹo lớn dần, né đụng thân, có bảng xếp hạng realtime trong phòng. | 5 | 5 | 5 | 5 | **20** |
| 3 | **Pikachu / Nối Thú Cổ Điển** | Puzzle / Casual | Single-player | Tìm cặp hình giống nhau nối không quá 3 đoạn gấp khúc. Game quốc dân của dân văn phòng. | 5 | 5 | 4 | 5 | **19** |
| 4 | **Đào Vàng Biển Sâu (Gold Miner)** | Casual / Kỹ năng | Single & 2P Co-op | Kéo mỏ neo gắp vàng, kim cương, tránh bom và đá. Hỗ trợ 2 người chơi chung bàn phím. | 5 | 5 | 4 | 5 | **19** |
| 5 | **Nối Từ Tiếng Việt (Word Chain)** | Wordplay / Trí tuệ | Multiplayer & Bot | Thi đấu nối từ tiếng Việt 1v1 theo lượt trong 10 giây (VD: "Học tập" -> "Tập vở"). Rất viral trên mạng xã hội. | 5 | 4 | 5 | 5 | **19** |
| 6 | **Bắn Bóng Trứng Khủng Long (Dynomite Pop)** | Arcade / Puzzle | Single-player | Bắn bóng màu tạo chùm 3 viên cùng màu để nổ bóng, cứu trứng khủng long con. | 5 | 5 | 3 | 5 | **18** |
| 7 | **Cờ Tướng Đấu Trí (Xiangqi Online)** | Board / Chiến thuật | Multiplayer (1v1 & Bot) | Cờ tướng truyền thống Việt Nam, hỗ trợ tính giờ ván đấu, phòng mời bạn bè và luyện tập cùng AI. | 4 | 5 | 4 | 5 | **18** |
| 8 | **Đố Vui Nhanh (Trivia Quiz VN)** | Quiz / Trivia | Multiplayer & Single | Trả lời nhanh 10 câu hỏi trắc nghiệm tiếng Việt (văn hóa, địa lý, tiếng Anh cơ bản, đố mẹo). | 4 | 4 | 5 | 5 | **18** |
| 9 | **2048 Siêu Cấp** | Puzzle / Logic | Single-player | Vuốt trượt các khối số hoặc hình động vật cute để hợp nhất lên ô 2048/4096. | 4 | 5 | 4 | 5 | **18** |
| 10 | **Cờ Cá Ngựa (Ludo Fun)** | Board / Casual | Multiplayer (2-4 Người) | Đổ xúc xắc đua 4 chú ngựa về chuồng, đá ngựa đối thủ, chơi theo nhóm bạn 4 người cực vui. | 4 | 4 | 5 | 4 | **17** |
| 11 | **Đặt Bom Tốc Độ (Bomb Arena)** | Arcade / Action | Multiplayer (2-4P) & Bot | Di chuyển đặt bom phá gạch, nhặt vật phẩm tăng tầm bom/tốc độ, gài bẫy hạ đối thủ. | 4 | 5 | 4 | 4 | **17** |
| 12 | **Bắn Cung Tọa Độ (Bow Master)** | Kỹ năng / Vật lý | 2P Đối kháng & Single | Căn góc và lực gió để bắn tên trúng đối thủ, mô phỏng trò chơi Bowmen kinh điển. | 4 | 4 | 4 | 4 | **16** |
| 13 | **Xếp Gạch Cổ Điển (Retro Blocks / Tetris)** | Arcade / Xếp hình | Single-player | Xếp các khối gạch rơi xuống thành hàng hoàn chỉnh để ghi điểm combo. | 4 | 5 | 3 | 4 | **16** |
| 14 | **Tìm Điểm Khác Biệt (Spot the Difference)** | Trí tuệ / Quan sát | Single-player | Tìm 5 điểm khác nhau giữa 2 bức tranh phong cảnh, hoạt hình ngộ nghĩnh trong thời gian giới hạn. | 4 | 4 | 3 | 4 | **15** |
| 15 | **Đua Xe Vượt Đồi (Hill Climb Racer)** | Kỹ năng / Lái xe | Single-player | Điều khiển xe đạp/ô tô leo dốc gập ghềnh, giữ thăng bằng không để lật xe và gom tiền nâng cấp. | 4 | 4 | 3 | 4 | **15** |
| 16 | **Nông Trại Trồng Rau (Mini Garden)** | Quản lý / Idle Casual | Single-player | Cuốc đất, gieo hạt, tưới nước thu hoạch nông sản thư giãn nhẹ nhàng, không áp lực thời gian. | 4 | 4 | 3 | 3 | **14** |
| 17 | **Ghép Kẹo Ngọt (Candy Match-3)** | Puzzle / Match-3 | Single-player | Đổi vị trí các viên kẹo màu sắc để tạo chuỗi nổ combo kẹo rực rỡ vui mắt. | 4 | 4 | 2 | 4 | **14** |
| 18 | **Sudoku Trí Tuệ** | Logic / Con số | Single-player | Điền số từ 1 đến 9 vào lưới 9x9 với các cấp độ từ Dễ, Trung bình đến Chuyên gia. | 3 | 4 | 2 | 4 | **13** |

---

## 3. Bảng xếp hạng mức độ ưu tiên triển khai (UX / Product Perspective)

Bảng xếp hạng dựa trên tổng điểm 4 tiêu chí sản phẩm (Sức hút + Chơi lại + Lan truyền + SEO). *Lưu ý: Không xếp theo độ khó code, mà xếp theo giá trị mang lại cho người dùng và lượng traffic đổ về cổng game.*

### Nhóm 1: Top 5 Game Ưu Tiên Tuyệt Đối (Must-Have Launchpad)
1. **Cờ Caro Trực Tuyến (20/20):** Game đối kháng số 1 Việt Nam, là xương sống cho tính năng tạo phòng mời bạn bè qua Zalo.
2. **Rắn Săn Mồi Siêu Cấp (20/20):** Vừa có chế độ chơi đơn gây nghiện, vừa có phòng hỗn chiến nhiều người, kích thích chia sẻ điểm cao.
3. **Pikachu / Nối Thú Cổ Điển (19/20):** Tựa game "quốc dân" thu hút lượng traffic tìm kiếm khổng lồ từ giới văn phòng và học sinh.
4. **Đào Vàng Biển Sâu (19/20):** Hoài niệm cực cao, cơ chế chơi 2 người chung bàn phím rất hút người dùng rủ nhau chơi tại chỗ.
5. **Nối Từ Tiếng Việt (19/20):** Tính năng đấu từ vựng cực kỳ viral trên mạng xã hội, tạo tiếng cười và tính cạnh tranh cao.

### Nhóm 2: Nhóm Tăng Trưởng & Giữ Chân (Retention & Community Boosters)
6. **Bắn Bóng Trứng Khủng Long (18/20):** Dễ chơi, màu sắc bắt mắt, phù hợp mọi lứa tuổi từ trẻ em đến người lớn.
7. **Cờ Tướng Đấu Trí (18/20):** Thu hút tệp người dùng trung thành, thời gian on-site (thời lượng chơi) mỗi ván rất cao.
8. **Đố Vui Nhanh (18/20):** Công cụ hoàn hảo để tích hợp các gói câu hỏi kiến thức và học tập.
9. **2048 Siêu Cấp (18/20):** Game logic gây nghiện, tốn rất ít tài nguyên, chơi mượt mà trên cả máy yếu.
10. **Cờ Cá Ngựa (17/20):** Game nhóm 4 người hay nhất cho các buổi tụ họp bạn bè rảnh rỗi.
11. **Đặt Bom Tốc Độ (17/20):** Nhịp độ hành động nhanh, vui nhộn, tạo nhiều tiếng cười khi chơi cùng bạn.

### Nhóm 3: Nhóm Bổ Trợ Nội Dung Phong Phú (Catalog Fillers)
12. **Bắn Cung Tọa Độ (16/20)**
13. **Xếp Gạch Cổ Điển (16/20)**
14. **Tìm Điểm Khác Biệt (15/20)**
15. **Đua Xe Vượt Đồi (15/20)**
16. **Nông Trại Trồng Rau (14/20)**
17. **Ghép Kẹo Ngọt (14/20)**
18. **Sudoku Trí Tuệ (13/20)**

---

## 4. Đánh giá Mức độ phù hợp với Quảng cáo SpeakUp Kids

Sản phẩm tài trợ **SpeakUp Kids** là giải pháp học tiếng Anh cho trẻ em. Do đó, người chơi là học sinh tiểu học, thiếu nhi hoặc phụ huynh chơi cùng con là đối tượng khách hàng mục tiêu vàng.

### 4.1. Top 3 Tựa Game Phù Hợp Hoàn Hảo Nhất Để Gắn SpeakUp Kids
1. **Đố Vui Nhanh (Trivia Quiz VN):**
   * *Hình thức tích hợp:* Thêm riêng một chủ đề thi đấu: *"Thử tài Tiếng Anh Thiếu Nhi cùng SpeakUp Kids"*.
   * *Hiệu quả:* Tự nhiên 100%, không bị xem là quảng cáo phiền nhiễu mà là một phần nội dung game hấp dẫn. Người chơi trả lời đúng được tặng huy hiệu và link nhận quà trải nghiệm bài học.
2. **Nối Từ Tiếng Việt & Tiếng Anh:**
   * *Hình thức tích hợp:* Chế độ song ngữ hoặc gợi ý từ vựng tiếng Anh vui nhộn từ linh vật SpeakUp Kids khi người chơi gặp từ khó.
   * *Hiệu quả:* Gắn liền kiến thức ngôn ngữ trực tiếp vào tâm trí người chơi.
3. **Tìm Điểm Khác Biệt & Bắn Bóng Khủng Long:**
   * *Hình thức tích hợp:* Đồ họa các màn chơi sử dụng hình ảnh linh vật SpeakUp Kids (chú khủng long con/bạn nhỏ năng động). Banner kết thúc ván tặng 1 bài học phát âm miễn phí cho bé.
   * *Hiệu quả:* Tệp người chơi game này chủ yếu là trẻ em và các mẹ chơi giải trí cùng con, tỷ lệ chuyển đổi sang khóa học thử nghiệm cực cao.

### 4.2. Phân loại mức độ phù hợp toàn danh mục
* **Rất cao (High Affinity):** Đố Vui Nhanh, Nối Từ, Tìm Điểm Khác Biệt, Bắn Bóng Khủng Long, Pikachu (phù hợp đặt Native Bento Banner & End-Game Reward).
* **Trung bình (Medium Affinity):** Cờ Caro, Cờ Cá Ngựa, Rắn Săn Mồi, Đào Vàng, 2048 (phù hợp đặt Sticky Bar ngoài lề hoặc Pop-up nhận quà sau trận).
* **Thấp (Low Affinity):** Cờ Tướng, Sudoku (tệp người chơi chủ yếu là người lớn tuổi/thanh niên nghiêm túc; chỉ nên đặt banner phụ kín đáo, tránh gây ức chế).

---

## 5. Đề xuất Thiết kế Giao diện Trang chủ (Modern Gaming Portal)

**Nguyên tắc tối thượng:** TUYỆT ĐỐI KHÔNG mang phong cách SaaS Dashboard (không dùng các khối thẻ xám xịt, không thanh thống kê khô khan, không icon văn phòng tẻ nhạt). Thay vào đó, giao diện phải toát lên năng lượng giải trí bùng nổ, vui tươi và tràn đầy màu sắc.

### 5.1. Bố cục Tổng thể Trang chủ (Dynamic Discovery Flow)
```
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo Neon | Thanh tìm kiếm Game | Tab "Chơi cùng bạn" | Avatar │
├────────────────────────────────────────────────────────────────────────┤
│ HERO CAROUSEL: 3 Game Tiêu Điểm tuần + Sự kiện Đua Top Cờ Caro         │
├────────────────────────────────────────────────────────────────────────┤
│ QUICK FILTER PILLS: [🔥 Hot] [👥 2 Người] [🧠 Trí tuệ] [⚡ Chơi ngay]  │
├────────────────────────────────────────────────────────────────────────┤
│ BENTO GRID KHÁM PHÁ (Lưới Game Năng Động - Không đều nhau):            │
│ ┌───────────────┐ ┌───────┐ ┌───────┐ ┌──────────────────────────────┐ │
│ │ Cờ Caro 1v1   │ │ Rắn   │ │ Đào   │ │ 🌟 THỬ THÁCH TIẾNG ANH       │ │
│ │ (Ô lớn 2x2)   │ │ Săn   │ │ Vàng  │ │    SpeakUp Kids (Ô 2x1)      │ │
│ │ Chơi ngay     │ │ Mồi   │ │ (1x1) │ │    Chơi vui nhận quà bé      │ │
│ └───────────────┘ └───────┘ └───────┘ └──────────────────────────────┘ │
│ ┌───────┐ ┌───────┐ ┌───────────────┐ ┌───────┐ ┌───────┐              │
│ │Pikachu│ │Nối Từ │ │ Cờ Cá Ngựa    │ │ 2048  │ │Bắn    │              │
│ │(1x1)  │ │(1x1)  │ │ Nhóm 4P (2x1) │ │(1x1)  │ │Bóng   │              │
│ └───────┘ └───────┘ └───────────────┘ └───────┘ └───────┘              │
├────────────────────────────────────────────────────────────────────────┤
│ REALTIME LOBBY TICKER: "Phòng Caro #1042 đang chờ 1 người" -> [Vào ngay]│
├────────────────────────────────────────────────────────────────────────┤
│ CÁC HÀNG DANH MỤC CUỘN NGANG (Horizontal Carousels):                  │
│ ▶ Game Trí tuệ & Đối kháng đỉnh cao                                    │
│ ▶ Game Hoài niệm tuổi thơ (Pikachu, Đào vàng, Dynomite)                │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Ngôn ngữ Thị giác & Thumbnail Design
* **Thumbnail Game (Hình đại diện):**
  - Tỷ lệ bo góc lớn (`rounded-2xl` - 16px to 20px) tạo nét mềm mại, thân thiện.
  - Hình minh họa 3D sống động, độ tương phản cao, thể hiện rõ nhân vật và gameplay chính.
  - Badge nổi bật ở góc thẻ: Nhãn đỏ `HOT`, nhãn tím `2 NGƯỜI`, nhãn vàng `ĐUA TOP`.
  - Hiệu ứng Hover Desktop: Card tự nâng lên (`translate-y-[-6px]`), viền sáng màu neon phát sáng nhẹ, video/GIF ngắn tự động phát 2 giây mô phỏng cách chơi.
* **Hệ thống Màu sắc (Visual Palette):**
  - *Nền Portal:* Xanh đêm sâu thẳm (`#0B0E17` / `#131826`) làm nổi bật các sắc màu rực rỡ của game.
  - *Màu điểm nhấn (Accents):* Hồng Neon Cyber (`#FF2E93`), Tím Điện Tử (`#7928CA`), Vàng Nắng (`#FFB800`).
* **Hệ thống Lọc & Tìm kiếm:**
  - Thanh tìm kiếm thông minh có gợi ý từ khóa tức thì (gõ "cờ" gợi ý ngay *Cờ Caro*, *Cờ Tướng*, *Cờ Cá Ngựa*).
  - Thanh cuộn các Filter Pills hình con nhộng (Capsule Pills) giúp chọn nhanh theo 1 chạm trên mobile.

---

## 6. Các Giả định Chưa Kiểm chứng & Khuyến nghị Thử nghiệm

1. **Khả năng tiếp nhận game đối kháng so với game chơi đơn:**
   * *Giả định:* Game multiplayer (như Cờ Caro, Nối Từ) có tỷ lệ viral cao hơn nhưng tỷ lệ drop ván khi đối thủ thoát ngang là rất lớn.
   * *Cần kiểm chứng:* Cần cơ chế AI thay thế ngay (Bot take over) khi người chơi bị rớt mạng hoặc thoát game đột ngột để không phá hỏng trải nghiệm người còn lại.
2. **Nguồn cung cấp mã nguồn / Tài nguyên game cho 15-20 game:**
   * *Giả định:* Để launch 18 game nhanh chóng, Dev cần kết hợp cả game tự phát triển trên nền Game SDK (Caro, Rắn, 2048) và game open-source/HTML5 canvas nhúng chuẩn iframe.
   * *Cần kiểm chứng:* Các game mã nguồn mở bên ngoài có tương thích tốt trên mobile và có nhúng được trình theo dõi UTM hay không.
3. **Thói quen chia sẻ link phòng chơi tại Việt Nam:**
   * *Giả định:* Người dùng thích bấm nút "Sao chép link gửi Zalo" hơn là nhớ mã số phòng 6 số.
   * *Cần kiểm chứng:* Cần test A/B giữa cơ chế "Nhập mã số" và "Click link trực tiếp" xem phương thức nào đem lại lượt vào phòng cao hơn.

---
*Tài liệu này được gửi tới Product Manager (Mama) để tổng hợp vào Kế hoạch Dự án V2 trình Chủ dự án phê duyệt.*
