# Art Bible V4 — Premium Detailed Pixel Art
**Dự án:** Webgame Portal  
**Tài liệu:** Art Bible & Asset Standardization Guide (V4)  
**Tác giả:** Gehihi (UX/UI Designer)  
**Trạng thái:** Đã duyệt bởi Chủ dự án (Dùng làm chuẩn chính thức)  
**Ngày lập:** 17/11/2026  
**Tài liệu tham chiếu:**  
- Key Visual tổng hợp: `C:\Projects\Webgame-Portal\assets\concepts-v4\direction-premium-pixel-art.png`
- Chuẩn nhân vật người trưởng thành: `C:\Projects\Webgame-Portal\prototype\homepage\assets\thumbs\dao-vang-scene.webp`
- 18 thumbnails game đã đồng bộ: `C:\Projects\Webgame-Portal\prototype\homepage\assets\thumbs\*.webp`

---

## 1. Bảng màu chuẩn & Kỹ thuật hòa sắc (Palette & Dithering)

### 1.1. Bảng màu giới hạn (Indexed Palette)
Webgame Portal sử dụng bảng màu 16-bit/32-bit kinh điển có chọn lọc, tạo cảm giác retro hoài niệm, ấm áp, rực rỡ nhưng không chói gắt:
* **Màu nền không gian (Dark Slate / Deep Navy / Warm Wood):**
  - Gỗ sồi tối / Đất mỏ: `#2B1E16`, `#422D1D`, `#63452C`
  - Đêm Arcade / Nền bảng đấu: `#121526`, `#1B2038`, `#282F4D`
* **Màu vàng tài nguyên & Ánh sáng (Gold & Highlights):**
  - Vàng ấm / Kim loại: `#F9A825`, `#FDD835`, `#FFF59D` (dùng cho vàng đào được, sao, điểm số, cúp)
* **Màu tương phản hành động (Cyber Accents / Retro Arcade):**
  - Xanh Cyan biển: `#00BCD4`, `#26C6DA`, `#80DEEA` (quân O Caro, nước, kim cương)
  - Đỏ gạch / Đỏ son: `#D32F2F`, `#E53935`, `#FFCDD2` (quân X Caro, bom nổ, táo)
  - Xanh cỏ / Rừng: `#388E3C`, `#4CAF50`, `#A5D6A7` (sân cỏ rắn, nông trại)
* **Màu da người & Vải vóc thực tế (Grounded Human Tones):**
  - Màu da người trưởng thành: `#D79B73`, `#B5744C`, `#8D5333`
  - Quần yếm lao động / Áo da: `#3B5998`, `#4A3B32`, `#6D7278`

### 1.2. Kỹ thuật hòa sắc (Dithering vs No-Gradients)
* **Bắt buộc dùng Dithering:** Chuyển màu ánh sáng (shading) và bề mặt vật liệu (gỗ, đất, kim loại) phải dùng kỹ thuật phối hạt pixel so le (checkerboard / ordered dithering).
* **Tuyệt đối cấm:**
  - Không dùng gradient kỹ thuật số mềm (linear/radial gradient mượt).
  - Không dùng cọ kỹ thuật số mềm (soft airbrush/soft brush).
  - Không làm mờ viền (Gaussian blur, bloom blur) làm mất đường răng cưa pixel.

---

## 2. Cỡ & Mật độ khối Pixel chuẩn (Pixel Density & Grid Scale)

### 2.1. Bài học xương máu từ quá trình tạo asset
* *Lỗi thường gặp:* Ảnh AI sinh ra bị "painterly" — tức là một bức tranh minh họa chi tiết cao rồi dùng filter pixelation che phủ, dẫn đến hạt pixel quá nhỏ (sub-pixel), đường nét bị nhòe và mất đi chất pixel art thực thụ (như bản v1 của `ran-san-moi` và `dat-bom`).
* *Giải pháp V4 chuẩn:* Mọi chi tiết phải được cấu thành từ **lưới pixel thô rõ ràng (Chunky & Crisp Pixel Grid)**.

### 2.2. Thông số kỹ thuật
* **Canvas ảo tham chiếu:** Tương đương độ phân giải gốc `320x240` hoặc `400x300` px (tỉ lệ 4:3), sau đó upscale nguyên số (Nearest Neighbor x3 hoặc x4) lên 1024x768 hoặc 1280x960 px.
* **Độ dày viền (Pixel Outlines):**
  - Đường bao vật thể chính: Dày đúng 1 pixel block màu tối (đen hoặc nâu sẫm, xanh sẫm cùng tông).
  - Không có hiện tượng anti-aliasing làm mờ viền. Các góc bo dùng cấu trúc bậc thang pixel (vd: 2-1-1-2).

### 2.3. Cụm từ bắt buộc khi viết Prompt
> *"Authentic 16-bit retro pixel art, hard-edge pixel grid, strict palette dithering, chunky visible pixels, absolutely no painterly illustration, no smooth gradients, no digital airbrush, no soft blur."*

---

## 3. Chuẩn tỉ lệ Nhân vật người (Adult Proportions)

### 3.1. Đối tượng mục tiêu & Phong cách thể hiện
* Cổng game nhắm tới tệp người dùng **20–39 tuổi** (thanh niên, dân văn phòng, phụ huynh chơi cùng con).
* Nhân vật người khi xuất hiện trong game (Đào vàng, Đặt bom, Bắn cung, Đua xe, 2048,...) phải mang phong thái: **trưởng thành, điềm đạm, có nét phong trần của người lao động hoặc đấu thủ thi đấu nghiêm túc.**

### 3.2. Tiêu chuẩn hình thái (Mẫu tham chiếu: `dao-vang-scene.webp`)
* **Tỉ lệ cơ thể:** 5 đến 6 đầu (Semi-realistic / Stylized mature). Thân hình cân đối, tay chân chắc khỏe, vai rõ ràng.
* **Khuôn mặt & Đôi mắt:**
  - Mắt dạng pixel tinh gọn (1-2 pixel cho con ngươi), nét mặt tập trung, điềm tĩnh.
  - Có thể có râu quai nón tỉa gọn, nếp nhăn nhẹ khóe mắt hoặc vệt bụi lao động.
* **Tuyệt đối cấm:**
  - **Không phong cách Anime / Manga:** Không mắt long lanh to đùng chiếm nửa khuôn mặt, không tóc nhọn màu mè quá lố.
  - **Không phong cách Chibi / Trẻ con:** Không đầu to người bé (tỉ lệ 2-3 đầu), không tay chân bánh mì cụt ngủn, không biểu cảm mè nheo hoạt hình trẻ nhỏ.

### 3.3. Cụm từ bắt buộc khi viết Prompt nhân vật
> *"Mature adult male/female with realistic mature proportions and practical working gear, calm and steady expression, matching the mature working-adult aesthetic of the miner in dao-vang-scene.webp. Strictly no anime style, no chibi, no giant manga eyes."*

---

## 4. Khung hình, Góc nhìn & Ánh sáng chung (Framing & Lighting)

### 4.1. Khung hình (Aspect Ratio)
* **Tỉ lệ chuẩn 4:3:** Mọi thumbnail ô lưới trang chủ và ảnh đại diện game sử dụng tỉ lệ `4:3` (chuẩn màn hình CRT/Arcade cổ điển, hiển thị tối ưu trên cả desktop lẫn mobile card).
* **Bố cục (Composition):**
  - Vật thể trọng tâm chiếm 60–70% khung hình ở vị trí trung tâm hoặc lệch 1/3 (Rule of thirds).
  - Có lớp tiền cảnh (foreground), trung cảnh (gameplay action) và hậu cảnh mộc mạc (background) để tạo chiều sâu pixel.

### 4.2. Góc nhìn (Camera Perspective)
* **Góc nhìn Isometric (3/4 từ trên xuống):** Ưu tiên hàng đầu cho các game chiến thuật, board game, giải đố và arcade (Cờ Caro, Cờ Tướng, Cờ Cá Ngựa, Đặt Bom, Xếp Gạch, 2048, Nông Trại). Mang lại cái nhìn toàn cảnh rõ ràng từng ô lưới.
* **Góc nhìn Side-view 2D (Cắt ngang / Phẳng):** Dành riêng cho các game cơ chế kéo thả, vượt dốc (Đào Vàng, Đua Xe Vượt Đồi, Rắn Săn Mồi).

### 4.3. Nguồn sáng & Bầu không khí (Lighting & Mood)
* **Ánh sáng ấm (Warm Amber / Golden Hour):** Ánh sáng xiên góc 45 độ từ phía trên bên trái (Top-left key light) rọi sáng các bề mặt phẳng, tạo bóng dither đổ về góc dưới bên phải.
* **Bầu không khí mộc mạc & Thư thái:** Gợi nhớ cảm giác ngồi trước màn hình tivi thùng hoặc quán game tuổi thơ ấm cúng, bàn gỗ sồi, đèn chụp ấm áp.

---

## 5. Checklist tự kiểm tra Asset trước khi duyệt (Quality Gate)

Bất kỳ ảnh mới nào trước khi đưa vào codebase/prototype phải vượt qua 5 tiêu chí tự kiểm duyệt sau:

| STT | Tiêu chí kiểm tra | Đạt chuẩn (Pass) | Không đạt (Fail - Cần làm lại) |
|:---:|---|---|---|
| **1** | **Chất lượng hạt Pixel (Crispness)** | Zoom 200% thấy rõ từng khối pixel vuông vức sắc nét. Chuyển màu bằng hạt dither. | Nhìn mịn màng như ảnh vẽ tay kỹ thuật số (digital painting) rồi bị giảm chất lượng, mờ viền. |
| **2** | **Tỉ lệ & Thần thái Nhân vật** | Người lớn trưởng thành, tỉ lệ ~5-6 đầu, trang phục thực tế, nét mặt điềm đạm như `dao-vang-scene.webp`. | Mắt to tròn kiểu anime, đầu to người bé kiểu chibi, vẻ mặt trẻ con nũng nịu. |
| **3** | **Bảng màu & Ánh sáng** | Thuộc dải màu ấm cổ điển (Vàng sồi, Slate, Đỏ gạch, Cyan retro). Ánh sáng có hướng dither rõ. | Màu neon dạ quang quá chói, hoặc màu xám xịt đơn điệu kiểu ứng dụng SaaS/văn phòng. |
| **4** | **Khung hình & Tỉ lệ (4:3)** | Tỉ lệ 4:3 cân đối, bố cục trọng tâm rõ ràng, các chi tiết nhận diện game nổi bật ngay từ cỡ nhỏ 120x90px. | Tỉ lệ vuông 1:1 hoặc 16:9 bị bóp méo; vật thể chính quá nhỏ, chi tiết rối rắm khó nhìn ở cỡ thumbnail. |
| **5** | **Tính đồng bộ toàn cổng (Harmony)** | Đặt cạnh `co-caro.webp`, `dao-vang.webp`, `noi-thu.webp` tạo cảm giác thuộc cùng một studio phát triển game retro. | Lạc tông về nét vẽ hoặc chất liệu so với các game khác trong thư mục `assets/thumbs/`. |

---
*Tài liệu này được áp dụng tức thì cho tất cả các nhiệm vụ thiết kế và sinh prompt asset tiếp theo của Webgame Portal.*
