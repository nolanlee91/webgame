# Đặc tả Sản phẩm & Nghiên cứu UX/UI: Webgame Portal
**Dự án:** Webgame Portal  
**Tài liệu:** Product Discovery & UX/UI Specification  
**Người thực hiện:** Gehihi (UX/UI Designer)  
**Trạng thái:** Bản thảo đề xuất (Draft v1.0) - Chờ phê duyệt  
**Ngày lập:** 17/11/2026  

---

## 1. Nghiên cứu mô hình cổng game kết hợp (Poki x Đấu Trí)

### 1.1. Phân tích mô hình Poki (Instant Play & High Discovery)
* **Điểm mạnh cốt lõi:**
  - **Zero-Friction (Chơi ngay lập tức):** Người dùng truy cập là chơi được ngay trong 1-2 click, không bắt buộc đăng ký tài khoản, không tải app.
  - **Bento Grid Discovery:** Bố cục dạng lưới động (Bento grid / Masonry layout) tạo cảm giác như một kho báu trò chơi nhiều màu sắc, kích thích tính tò mò khám phá.
  - **Trải nghiệm webgame thuần túy (In-browser canvas):** Tối ưu responsive trên mọi kích thước màn hình, tải nhanh.
* **Hạn chế:** Tương tác xã hội (social connection) và tính năng nhiều người chơi (multiplayer) theo phòng riêng còn yếu, thiếu tính cạnh tranh cộng đồng.

### 1.2. Phân tích mô hình Đấu Trí (Social Multiplayer & Viral Loop)
* **Điểm mạnh cốt lõi:**
  - **Phòng chơi & Mời bạn bè (Room & Lobby):** Cơ chế tạo phòng nhanh bằng mã phòng (Room Code 6 ký tự) hoặc link chia sẻ trực tiếp (Deep link).
  - **Viral tự nhiên tại Việt Nam:** Người chơi dễ dàng sao chép link gửi qua nhóm Zalo, Facebook Messenger để rủ bạn bè vào "chiến" ngay.
  - **Cạnh tranh & Xếp hạng:** Bảng xếp hạng tuần/tháng, tích lũy điểm thưởng và vinh danh tạo động lực quay lại hàng ngày (Retention).
* **Hạn chế:** Nhiều rào cản ban đầu nếu bắt buộc đăng nhập tài khoản phức tạp, giao diện thường mang tính web cũ, thiếu sự tươi mới của modern gaming portal.

### 1.3. Mô hình kết hợp cho Webgame Portal (The Hybrid Engine)
Webgame Portal dung hợp sức mạnh của cả hai mô hình trên để tạo ra trải nghiệm tối ưu cho người dùng Việt Nam:
1. **Single-player (Chế độ Poki):** 100% không yêu cầu tài khoản, click vào game là chơi ngay với độ trễ thấp nhất.
2. **Multiplayer (Chế độ Đấu Trí không rào cản):**
   - Cho phép tạo phòng và tham gia phòng dưới tư cách **Khách (Guest)** chỉ với 1 biệt danh tạm thời (Nickname tự sinh hoặc nhập nhanh).
   - Hỗ trợ luồng mời bạn bè 1 chạm (Copy link gửi Zalo/Messenger/QR Code).
   - Đăng nhập (Google / Facebook / Email) chỉ xuất hiện như một tùy chọn **nâng cao** khi người chơi muốn: lưu lịch sử đấu, đua top bảng xếp hạng, nhận huy hiệu vinh danh.

---

## 2. Đề xuất cấu trúc trang & Luồng trải nghiệm (IA & User Flows)

### 2.1. Cấu trúc tổng thể (Site Architecture)
```
[Header: Logo, Tìm kiếm nhanh, Danh mục, Nút Tạo/Vào phòng, Nút Đăng nhập/Profile]
│
├── 1. Trang chủ (Home Portal)
│     ├── Hero Banner (Game nổi bật / Sự kiện đua top)
│     ├── Bento Grid (Game hot, Game mới, Game 2 người chơi)
│     ├── Live Lobby Widget (Danh sách phòng công khai đang chờ người)
│     ├── Native Banner (SpeakUp Kids Challenge)
│     └── Danh mục theo thể loại (Trí tuệ, Đối kháng, Đua xe, Thể thao, Vui nhộn)
│
├── 2. Danh mục & Tìm kiếm (Game Catalog & Filter)
│     ├── Bộ lọc nhanh: Số người (1P / 2P / Co-op), Thể loại, Xu hướng
│     └── Lưới game phân trang/cuộn vô tận (Infinite Scroll)
│
├── 3. Trang chơi game (Game Player Screen)
│     ├── Khu vực Canvas Game trung tâm (Iframe/Canvas chuẩn responsive)
│     ├── Quick Control Bar (Fullscreen, Mute, Restart, Phím tắt hướng dẫn)
│     ├── Social Action Bar (Mời bạn, Tạo phòng cho game này, Share kết quả)
│     └── Khu vực đề xuất game tương tự & Game cùng thể loại
│
├── 4. Luồng Tạo phòng & Vào phòng (Multiplayer Room Hub)
│     ├── [Tạo phòng nhanh] ──> Chọn game + số người ──> Sinh Mã/Link ──> Sảnh chờ (Lobby)
│     └── [Phòng công khai] ──> Danh sách phòng mở ──> Ghép nhanh (Quick Match) ──> Vào trận
│
└── 5. Trang Hồ sơ & Bảng xếp hạng (Profile & Leaderboard)
      ├── Top người chơi tuần/tháng theo từng tựa game
      └── Lịch sử ván đấu & Bộ sưu tập huy hiệu
```

### 2.2. Đặc tả chi tiết các màn hình trọng tâm

#### A. Trang chủ (Homepage)
* **Bento Grid Layout:** Sử dụng các ô thẻ game kích thước linh hoạt (ô lớn 2x2 cho game tiêu điểm, ô 1x1 cho game phổ thông).
* **Tagging trực quan:** Mỗi thẻ game có badge rõ ràng: `🔥 Hot`, `👥 2 Người`, `⚡ Chơi ngay`, `🏆 Đấu hạng`.
* **Live Lobby Ticker:** Một hàng widget nhỏ hiển thị real-time các phòng game cộng đồng đang thiếu người (Ví dụ: *"Phòng Cờ Caro #4829 đang chờ 1 người - Vào ngay"*).

#### B. Trang chơi game (Game Player Page)
* **Focus Mode (Chế độ tập trung):** Khi game bắt đầu, các thành phần râu ria tự động giảm độ tương phản hoặc ẩn bớt, tâm điểm tối đa vào màn hình game.
* **Thanh công cụ nhanh:**
  - Nút **Toàn màn hình (Fullscreen)** luôn nổi bật ở góc trên/dưới canvas.
  - Nút **Mời bạn**: Click mở pop-up chứa mã phòng, QR code quét bằng điện thoại, và nút copy link rút gọn.
  - Phím điều khiển gợi ý (Controls Tooltip) hiển thị trực quan (WASD, Phím mũi tên, Chuột).

#### C. Luồng Tạo phòng & Vào phòng công khai
* **Luồng Tạo phòng:**
  1. Người chơi chọn game multiplayer -> Bấm **"Tạo phòng đấu"**.
  2. Chọn chế độ: *Công khai (Ai cũng vào được)* hoặc *Riêng tư (Chỉ ai có mã/link mới vào được)*.
  3. Hệ thống tạo phòng ngay (< 0.5s), chuyển sang màn hình **Sảnh chờ (Waiting Lobby)**:
     - Hiển thị danh sách slot người chơi kèm avatar/nickname.
     - Hiển thị mã PIN 6 ký tự to rõ + Nút "Sao chép link mời".
     - Nút "Sẵn sàng" (Ready) cho khách và nút "Bắt đầu trận" (Start) cho chủ phòng.
* **Luồng Vào phòng công khai:**
  - Tab "Phòng mở" hiển thị danh sách phòng realtime kèm bộ lọc game.
  - Nút **"Ghép nhanh (Quick Match)"**: Tự động ghép vào phòng còn trống gần nhất trong vòng 3 giây.

#### D. Trải nghiệm Mobile-First (Tối ưu cho người dùng Việt Nam)
* **Thực tế người dùng VN:** Trên 75% truy cập giải trí diễn ra trên điện thoại di động (Android & iOS).
* **Xử lý Viewport & Safe-area:**
  - Tự động ẩn thanh URL trình duyệt khi vào game (Fullscreen API hoặc scroll lock).
  - Tự động phát hiện hướng màn hình: Nếu game yêu cầu xoay ngang (Landscape), hiển thị màn hình hướng dẫn xoay nhẹ nhàng, không gây khó chịu.
* **Bottom Navigation Bar:** Thanh điều hướng cố định phía dưới màn hình với 4 mục chính: `Trang chủ`, `Danh mục`, `Phòng chờ`, `Cá nhân`.
* **Touch Target:** Tất cả nút bấm, icon tối thiểu 44x44px, khoảng cách an toàn tránh bấm nhầm.

---

## 3. Vị trí quảng cáo SpeakUp Kids (Native & Non-Intrusive Ad Strategy)

### 3.1. Định hướng tiếp cận
SpeakUp Kids là sản phẩm học tiếng Anh cho trẻ em. Người chơi webgame thường gồm học sinh, thanh thiếu niên và các bậc phụ huynh chơi cùng con. Vì vậy, quảng cáo cần mang tính **giáo dục, vui nhộn, tích cực (Edutainment)**, tuyệt đối tránh cảm giác spam khó chịu.

### 3.2. Đề xuất 3 vị trí chiến lược
| Vị trí | Hình thức hiển thị | Cơ chế & Thời điểm xuất hiện | Đánh giá ảnh hưởng UX |
|---|---|---|---|
| **Vị trí 1: Bento Native Card** *(Trang chủ & Danh mục)* | Thẻ game đặc biệt mô phỏng mini-game/thử thách tiếng Anh ("Thử tài tiếng Anh cùng SpeakUp Kids") | Nằm hòa nhập tự nhiên trong lưới game ở Trang chủ (chiếm 1 ô 2x1) | **0% gián đoạn gameplay.** Người dùng tự nguyện bấm vào vì tò mò và cảm giác như một mini-game vui nhộn. |
| **Vị trí 2: End-Game Reward Banner** *(Màn hình kết thúc ván)* | Banner tương tác / Card chúc mừng sau trận đấu kèm CTA: *"Thưởng nóng 1 bài học tiếng Anh tương tác miễn phí!"* | Xuất hiện ở màn hình tổng kết điểm số / khi ván đấu kết thúc. | **Rất thấp (< 5%).** Không cắt ngang mạch chơi; xuất hiện đúng lúc người chơi đang nghỉ giữa các ván để chuẩn bị ván mới. |
| **Vị trí 3: Sticky Sponsor Bar** *(Dưới khung game / Sidebar desktop)* | Banner tĩnh hoặc animation nhẹ kích thước chuẩn (728x90 trên desktop, 320x50 trên mobile dưới canvas game) | Cố định ngoài vùng chơi của game, không che khuất màn hình game. | **Thấp (< 10%).** Người chơi luôn thấy thương hiệu SpeakUp Kids một cách tự nhiên mà không bị che khuất nút thao tác game. |

### 3.3. Nguyên tắc vàng về trải nghiệm quảng cáo (Ad Guardrails)
* **KHÔNG Interstitial In-gameplay:** Tuyệt đối không bật pop-up quảng cáo khi người chơi đang trong trận đấu.
* **KHÔNG Clickbait / Bẫy click:** Nút tắt/đóng hoặc chuyển hướng phải rõ ràng, minh bạch, tránh gây ức chế bấm nhầm.
* **Thời gian chờ thân thiện:** Nếu có video giới thiệu ngắn ở màn hình chờ tải game (Loading screen), tối đa không quá 5 giây và cho phép bỏ qua (Skip).

---

## 4. Định hướng thiết kế (Design Direction: Modern Gaming Portal)

### 4.1. Tinh thần chủ đạo: "Vibrant, Playful & High-Energy"
* **Tránh hoàn toàn phong cách SaaS Dashboard:**
  - Không dùng các thẻ xám cứng nhắc, bảng biểu số liệu khô khan, bố cục văn phòng trịnh trọng.
  - Giao diện phải khơi gợi cảm xúc phấn khích, niềm vui khám phá, màu sắc rực rỡ và tươi mới.
* **Học hỏi từ các cổng game hàng đầu:**
  - **Poki:** Sự tinh nghịch, bo góc lớn (Squircle / rounded-2xl), micro-animations khi hover chuột vào game.
  - **CrazyGames:** Thanh bên thu gọn thông minh, phân loại danh mục cực kỳ trực quan với icon 3D.
  - **itch.io:** Sự gắn kết cộng đồng, tôn vinh nét đặc trưng của từng trò chơi.

### 4.2. Hệ thống thị giác (Visual Language)
* **Bảng màu (Color Palette):**
  - *Màu nền chính (Background):* Tối tương phản hiện đại (`#0F111A` - Deep Game Navy) giúp làm nổi bật các thumbnail game rực rỡ; đi kèm chế độ Light Mode tươi sáng cho đối tượng trẻ nhỏ (`#F4F6FB`).
  - *Màu nhấn (Primary Accent):* Tím Neon (`#7C3AED` - Electric Violet) và Xanh Cyan (`#06B6D4` - Cyber Cyan).
  - *Màu hành động (Action/CTA):* Vàng Cam năng động (`#F59E0B` / `#FF5722`) tạo cảm giác thôi thúc click chơi ngay.
* **Typography & Typography Hierarchy:**
  - Font chữ không chân, bo tròn nhẹ, năng động (như Be Vietnam Pro, Nunito hoặc Lexend).
  - Tiêu đề đậm nét, kích thước rõ ràng, thân thiện với tiếng Việt (không lỗi dấu font).
* **Hiệu ứng & Chuyển động (Micro-interactions):**
  - Thẻ game hơi phóng to nhẹ (scale 1.04) kèm hiệu ứng đổ bóng màu khi hover.
  - Xem trước gameplay ngắn (Animated GIF / WebP preview 2 giây) khi di chuột qua thẻ game trên desktop.

---

## 5. Các giả định chưa kiểm chứng & Rủi ro tiềm ẩn (Assumptions & Risks)

1. **Hành vi thiết bị & Mạng kết nối:**
   - *Giả định:* Đa số người dùng chơi trên thiết bị di động tầm trung và mạng 4G/Wifi thông thường tại Việt Nam.
   - *Rủi ro & Cần kiểm chứng:* Dung lượng game nhúng nếu vượt quá 10MB sẽ gây tỷ lệ thoát trang (Bounce rate) cao. Cần đo lường thời gian tải trung bình thực tế (First Contentful Paint < 1.5s).
2. **Trình duyệt In-app Browser (Zalo / Facebook Messenger):**
   - *Giả định:* Người chơi sẽ chia sẻ link phòng chơi qua Zalo và Messenger nhiều nhất.
   - *Rủi ro & Cần kiểm chứng:* In-app browser của Zalo/Facebook thường chặn một số API (như Fullscreen API, Audio autoplay, Cookie/LocalStorage bên thứ ba, WebRTC). Cần giải pháp xử lý fallback mở trình duyệt mặc định (Chrome/Safari) khi cần.
3. **Chuyển đổi traffic sang SpeakUp Kids:**
   - *Giả định:* Đối tượng chơi game có sự trùng lặp đáng kể với phụ huynh có con học tiếng Anh hoặc học sinh tiểu học/cấp 2.
   - *Rủi ro & Cần kiểm chứng:* Tỷ lệ click (CTR) từ game portal sang sản phẩm EdTech có thể thấp nếu không gắn liền với phần thưởng game cụ thể (ví dụ: chơi mini-quiz tiếng Anh để nhận thêm lượt chơi hoặc mở khóa skin/avatar game).

---
*Bản tài liệu này là cơ sở để hoàn thiện kiến trúc kỹ thuật và lập kế hoạch MVP trước khi chuyển sang giai đoạn thiết kế wireframe chi tiết.*
