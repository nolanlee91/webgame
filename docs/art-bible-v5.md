# Art Bible V5 — Webgame Portal
*(Modern Pixel Art × Gamified Spatial UX × 16-bit Retro Craft)*

**Dự án:** Webgame Portal  
**Tác giả:** Gehihi (Art Direction & UX Lead)  
**Ngày:** 17/11/2026  
**Trạng thái:** Đã chốt theo phê duyệt của Chủ dự án (2026-11-17).  
**Tài liệu tham chiếu dùng chung:** Dành cho Codex (tạo prompt & review visual), Dev (triển khai UI CSS & canvas engine), Mama (điều phối kiểm duyệt).

---

## 0. Nền tảng Định hướng Thẩm mỹ (Core Pillars)

Phong cách Art Direction V5 kết hợp chặt chẽ từ 3 nguồn đã được Chủ dự án duyệt:
1. **V4 Premium Detailed Pixel Art:** Chất liệu 16-bit retro, ánh sáng vàng ấm (Warm Amber / Golden Hour), chất liệu mộc mạc, tỷ lệ nhân vật người lớn trưởng thành (5–6 đầu, không anime, không chibi).
2. **Đấu Trí Spatial UX:** Thiết kế không gian trực quan, bàn đấu làm trung tâm, hiển thị rõ nét trạng thái bàn cờ và lượt chơi thông qua hoạt ảnh (animation) và phân cấp vị trí.
3. **Modern Pixel Art × Gamified UI (tham khảo app Python Course):** Hệ thống phân cấp thị giác sắc nét, cấu trúc hình khối góc cắt pixel-cut (cut-corner / stepped bevel), bóng đổ cứng cơ học, tuyệt đối không dùng bo tròn mềm kiểu SaaS/web app văn phòng.

> **Mẫu thực tế chuẩn (Ground Truth):**
> - Bàn cờ & quân Cờ Cá Ngựa: `prototype/games/co-ca-ngua/assets/board-v5/` (lưới 13×13 64px, 4 màu cờ/ngựa animation).
> - Lớp UI/HUD Cờ Cá Ngựa: `prototype/games/co-ca-ngua/hud.css`, `hud.js`, icon 16/24px pixelated, khay xúc xắc, bục xếp hạng.
> - Thumbnail mẫu chuẩn: `prototype/homepage/assets/thumbs/ran-san-moi.webp` (chuẩn mật độ hạt pixel thô rõ) & `dao-vang-scene.webp` (chuẩn tỷ lệ nhân vật).

---

## 0.1. Chuẩn artwork đã duyệt — Detailed HD Pixel Art

Detailed HD Pixel Art là chuẩn hình ảnh bắt buộc cho toàn bộ dòng Tập Làm Chủ, từ Nông Trại đến Tiệm Trà Sữa, Tiệm Bánh Mì, Quán Cơm Tấm và các game ra sau. Cùng một phong cách áp dụng từ ảnh bìa đến trong game: cảnh và bản đồ, nội thất, công trình, NPC, chân dung, máy móc, đạo cụ, sản phẩm, icon vật phẩm và hiệu ứng.

- **Mẫu gốc khi tạo ảnh.** Dùng bộ ảnh đã duyệt ở `prototype/homepage/assets/thumbs/`: `cozy-nong-trai.webp`, `tiem-tra-sua.webp`, `tiem-banh-mi.webp`, `quan-com-tam.webp`. Khi viết prompt hoặc brief, đính kèm ảnh của game tương ứng và ghi rõ các đặc điểm cần giữ: hình khối, mật độ pixel, tương phản, ánh sáng và chất liệu. Game mới dùng ảnh gần nhất về bối cảnh làm mẫu.
- **Cảnh chơi và công trình.** Tách rõ tiền cảnh, trung cảnh, hậu cảnh. Tạo chiều sâu bằng bố cục, vật thể che nhau và mảng sáng tối. Giữ chất liệu dễ nhận ra như gỗ, tre, gạch men, vải và kim loại qua cụm pixel có chủ đích. Dùng navy hoặc teal trong bóng và vàng hổ phách ở vùng sáng, phối màu theo bối cảnh của game.
- **NPC, vật phẩm và hiệu ứng.** Giữ tỷ lệ nhân vật tự nhiên, dáng dễ nhận, đường biên bậc thang sắc và viền tối có chọn lọc. Icon nhỏ ưu tiên hình dáng và mảng màu đặc trưng của vật phẩm. Tạo chuyển sắc bằng cụm pixel hoặc dithering tiết chế. Tránh cọ mềm, viền anti-alias, gradient mịn, bloom và nhiễu hạt kiểu ảnh chụp.
- **Khi đưa vào game.** Giữ góc nhìn, kích thước ô, tỷ lệ pixel, điểm neo, hướng sáng và thứ tự frame của atlas đích. Đặt asset mới cạnh nhân vật, công trình và vật phẩm cùng cảnh để kiểm tra độ đồng nhất. Giữ thân và điểm chạm đất ổn định giữa các frame, xuất sprite với alpha cứng và phóng nguyên bội bằng nearest-neighbor.
- **Duyệt trước khi làm cả bộ.** Làm một cảnh mẫu và một cụm asset gồm nhân vật, đạo cụ hoặc vật phẩm, rồi đặt trực tiếp vào màn chơi ở kích thước thật. Duyệt đường biên, ánh sáng, độ chi tiết, khả năng đọc và sự nhất quán với ảnh mẫu trước khi mở rộng. Với thumbnail homepage, dùng 4:3, dựng 240 × 180 pixel nghệ thuật, phóng nearest-neighbor lên 480 × 360 và xuất WebP lossless. Kiểm tra cạnh `ma-soi.webp` và `ai-la-noi-gian.webp` ở kích thước thẻ desktop và mobile.
- Homepage dùng UI Premium Modern Gaming Portal với nền dark navy, viền mảnh, góc bo vừa và điểm nhấn teal, vàng ấm. Quy tắc khung pixel-cut và bóng cứng ở các mục dưới dành cho HUD trong game.

---

## 1. Bảng màu chuẩn (Palette Token System)

Hệ thống token màu chuẩn hóa từ `hud.css` và bộ `board-v5`, đảm bảo độ tương phản cao trên nền tối và nhất quán toàn cổng:

### 1.1. Palette cốt lõi (Dark Warm Retro Foundation)
* **Màu nền & Panel:**
  - `--px-panel: #1d1a16` — Panel nền chính (tông gỗ tối / đất trầm ấm áp, tạo cảm giác arcade hoài cổ).
  - `--px-panel2: #262019` — Nền nút thứ cấp, rãnh ô slot, thanh điều khiển.
  - `--px-line: #0a0807` — Viền pixel chuẩn, rãnh phân tách khối.
  - `--px-shadow: rgba(0, 0, 0, 0.60)` — Bóng đổ pixel cứng (hard shadow).
* **Màu chữ & Nội dung hiển thị:**
  - `--px-ink: #f4ead2` — Màu kem sáng ngà (chữ tiêu đề và nội dung chính, tương phản cao > 9:1 trên panel).
  - `--px-soft: #b9ad93` — Chữ phụ, nhãn trạng thái, thông số phụ.
  - `--px-dim: #7d7564` — Trạng thái vô hiệu hóa (disabled), ô trống chờ người chơi.
* **Màu điểm nhấn & Hành động (Accent / Primary Action — "Quy tắc Vàng"):**
  - `--px-gold: #ffc94a` — Vàng rực rỡ. **QUY TẮC BẮT BUỘC:** Chỉ dùng cho người chơi đang có lượt đi hiện tại và nút hành động chính (Primary CTA).
  - `--px-gold-d: #a8741a` — Viền tối / bóng đổ của màu vàng.
  - `--px-gold-l: #ffe9a8` — Gờ sáng trên cùng (bevel highlight) của màu vàng.

### 1.2. Màu định danh 4 Phường / Ghế người chơi (Player Factions / Seats)
Được lấy mẫu chính xác từ màu nhánh `board-v5` và biến CSS ghế ngồi:
- **Phường Đỏ (Red):** Chính `#e0483d` | Viền tối `#7a1c17` (Ghế 0, trên-trái).
- **Phường Xanh lá (Green):** Chính `#3fae4a` | Viền tối `#17521c` (Ghế 3, trên-phải).
- **Phường Vàng (Yellow):** Chính `#f2b632` | Viền tối `#7a5410` (Ghế 2, dưới-phải).
- **Phường Xanh dương (Blue):** Chính `#3a7bd5` | Viền tối `#163a73` (Ghế 1, dưới-trái).

### 1.3. Kỹ thuật chuyển màu (Dithering vs No-Gradients)
* **Bắt buộc dùng Dithering:** Đổ bóng bề mặt vật liệu (gỗ, đá, vải, kim loại) phải dùng kỹ thuật phối hạt pixel so le (checkerboard / ordered dithering).
* **Tuyệt đối cấm:**
  - Không dùng dải màu neon huỳnh quang chói gắt (chỉ dùng màu bão hòa vừa phải ấm áp).
  - Không dùng gradient kỹ thuật số mềm (linear/radial gradient mượt kiểu web hiện đại).
  - Không dùng hiệu ứng phát sáng mờ ảo (bloom blur / soft glow).

---

## 2. Quy tắc hình khối Pixel (Pixel Shapes & Bevels)

### 2.1. Độ dày viền (Pixel Borders)
* **Khung Panel & Nút bấm UI:** Độ dày viền 3px cứng, cấu thành từ box-shadow không góc:
  ```css
  --px-border: 0 -3px 0 0 var(--b, var(--px-line)),
               0  3px 0 0 var(--b, var(--px-line)),
              -3px  0 0 0 var(--b, var(--px-line)),
               3px  0 0 0 var(--b, var(--px-line));
  ```
* **Sprite / Asset in-game:** Đường viền bao ngoài dày đúng 1 pixel block màu tối (`#0a0807` hoặc nâu sẫm cùng tông), không có viền mờ anti-aliasing.

### 2.2. Bo góc kiểu Pixel-Cut (Pixel-cut Corner / Stepped Corners)
* **Tuyệt đối cấm:** Không dùng `border-radius` bo tròn mềm kiểu SaaS.
* **Quy tắc chuẩn:** Dùng góc cắt bậc thang pixel (cut-corner / stepped bevel) 2–3px hoặc cấu trúc khuyết góc tự nhiên của box-shadow pixel. Các nút hoặc panel trông sắc nét, cơ học và dứt khoát.

### 2.3. Kiểu bóng đổ (Hard-Edge Offset Shadows)
* **Tuyệt đối cấm:** Không dùng blur mềm (soft drop-shadow, Gaussian blur).
* **Quy tắc chuẩn:** Bóng đổ cứng lệch góc cố định 45° (hướng xuống-phải):
  ```css
  --px-drop: 4px 7px 0 0 var(--px-shadow), 7px 4px 0 0 var(--px-shadow);
  ```
* **Cơ chế phản hồi xúc giác (Haptic Click):** Khi bấm nút (`:active` hoặc `.is-down`), nút dịch chuyển `transform: translate(4px, 4px)` và thu gọn bóng đổ, tạo cảm giác nút cơ học vật lý thật lún xuống bàn cờ.

### 2.4. Gờ vát nổi (Pixel Beveling)
Tạo chiều sâu 3D pixel bằng 2 lớp vát sáng/tối sắc nét:
```css
--px-bevel: inset 0 2px 0 rgba(255, 255, 255, 0.13),
            inset 0 -2px 0 rgba(0, 0, 0, 0.35);
```

---

## 3. Quy tắc phân cấp UI 3 tầng (3-Tier UI Hierarchy)

Kế thừa trực tiếp từ đề xuất kiến trúc HUD Cờ Cá Ngựa của Dev và tư duy spatial UX của Đấu Trí:

```
┌────────────────────────────────────────────────────────┐
│ [TẦNG 3] Top Bar: Trạng thái nhỏ + Icon tiện ích (Mute, Pause, Leave) │
├────────────────────────────────────────────────────────┤
│                      [TẦNG 1]                          │
│               BÀN CỜ / SÂN ĐẤU CHÍNH                   │
│        (Khu vực trọng tâm, chiếm 60–70% diện tích)     │
│                                                        │
│   [TẦNG 1] Khay xúc xắc & Nút chính (chỉ người có lượt)│
├────────────────────────────────────────────────────────┤
│ [TẦNG 2] Thẻ người chơi 4 góc (Avatar, quân về đích)   │
│ (Active: nổi lên + viền vàng | Inactive: mờ nhẹ 70%)   │
└────────────────────────────────────────────────────────┘
```

### 3.1. TẦNG 1: Sân chơi trung tâm & Hành động chính (Primary / Core Gameplay)
* **Mục tiêu:** Thu hút ngay 80% sự chú ý của người chơi; nhìn lướt qua phải biết ngay ván đấu đang diễn ra thế nào và ai đang cần làm gì.
* **Thành phần:**
  - Bàn cờ / Vùng gameplay trung tâm (`.cn-board`).
  - Khay hành động / Nút xúc xắc của người đang có lượt đi (`.cn-tray.on`).
  - Nút hành động chính (`.px-btn.primary`, kích thước lớn 52px, nền gradient vàng vát `--px-gold`).
* **Trạng thái thị giác:**
  - Khi đến lượt: Bừng sáng rõ ràng, độ mờ 100%, có hiệu ứng nảy hạt xúc xắc (`animation: steps`).
  - Điểm nhấn thị giác vàng (`--px-gold`) tập trung duy nhất ở đây.

### 3.2. TẦNG 2: Bối cảnh người chơi & Tiến độ trận đấu (Secondary / Context & Player Status)
* **Mục tiêu:** Cung cấp thông tin tiến độ của 4 người chơi mà không cạnh tranh thị giác với bàn đấu.
* **Thành phần:** 4 thẻ người chơi (`.cn-card`), hiển thị tên, avatar pixel 48×48px, thanh đo quân về đích (`.px-bar`), số lượng quân cờ còn lại.
* **Trạng thái thị giác:**
  - Nền trầm `--px-panel`, có vạch màu nóc 6px định danh phường (`--seat`).
  - **Khi đến lượt (Active):** Thẻ nảy nhẹ lên trên-trái (`transform: translate(-2px, -2px)`), đổi viền sang vàng `--px-gold`, bật nhãn thẻ "LƯỢT ĐI".
  - **Khi chưa đến lượt (Inactive):** Giảm độ đậm (`opacity: 0.7`, `filter: saturate(0.7)`) để nhường toàn bộ tiêu điểm cho người có lượt.
  - **Ghế trống (Empty slot):** Khung nét đứt màu trầm, không có vạch màu nóc.

### 3.3. TẦNG 3: Tiện ích hệ thống & Điều hướng phụ (Tertiary / Utilities & Meta Controls)
* **Mục tiêu:** Đầy đủ chức năng nhưng hoàn toàn "vô hình" trong khi ván chơi đang căng thẳng.
* **Thành phần:** Thanh trạng thái trên cùng (`.cn-top`), icon tắt/bật âm thanh, tạm dừng, rời phòng, sao chép link phòng.
* **Trạng thái thị giác:**
  - Dùng icon pixel 16×16px hoặc 24×24px (`image-rendering: pixelated`).
  - Nút bấm phụ dạng icon (`.px-btn.icon`) dùng nền `--px-panel2`, viền trầm `--b: #6d6150`.
  - Chữ trạng thái nhỏ (14px), màu mềm `--px-soft`, không dùng màu vàng hay đỏ ở tầng này (trừ cảnh báo mất kết nối).

---

## 4. Độ phân giải & Kích thước chuẩn khi tạo Asset mới

### 4.1. Bài học xương máu: Khắc phục triệt để lỗi "Nét/Mờ lẫn lộn"
* **Nguyên nhân lỗi cũ (v2/v3):** AI tạo ảnh ở độ phân giải cao kiểu tranh minh họa mịn (painterly illustration) rồi áp filter pixelation/downscale. Hậu quả là hạt pixel quá nhỏ (sub-pixel), đường nét bị nhòe và mật độ hạt pixel giữa các game không khớp nhau (ví dụ: `dat-bom` quá mịn, còn `ran-san-moi` lại hạt thô).
* **Nguyên tắc V5:** Mọi asset phải được sinh ra trên **lưới pixel thô rõ ràng (Chunky & Crisp Pixel Grid)**, hạt pixel vuông vức đếm được bằng mắt, đồng nhất mật độ pixel giữa 18 game và trang chủ.

### 4.2. Bảng quy chuẩn kích thước kỹ thuật

| Loại Asset | Tỉ lệ (Ratio) | Kích thước xuất bản (File WebP/PNG) | Độ phân giải pixel gốc tham chiếu | Quy cách hiển thị / CSS |
|---|:---:|:---:|:---:|---|
| **Thumbnail Trang chủ** (19 game) | **4:3** | **384 × 288 px** *(chuẩn)*<br>hoặc 768 × 576 px *(Retina)* | 384 × 288 (tương đương 192×144 pixel blocks nhân đôi) | `aspect-ratio: 4/3;`<br>`image-rendering: pixelated;` |
| **Bàn cờ / Sân đấu lớn** | **1:1** | **832 × 832 px** *(Cờ Cá Ngựa)* | Lưới 13 × 13 ô, mỗi ô đúng **64 × 64 px** | Canvas / WebGL vẽ đúng tọa độ lưới, không scale méo |
| **Sprite Nhân vật / Quân cờ** | **1:1** | Frame: **64 × 64 px**<br>Sheet: **192 × 192 px** (3×3) | 64 × 64 px pixel grid, Anchor cố định `[32, 60]` | 9 frame animation chuẩn (đứng yên, nhảy, bị đá, mừng thắng) |
| **Khay xúc xắc / Khung phụ** | ~1:1 | **128 × 125 px** (256 × 250 px @2x) | Pixel art cơ khí, khay gỗ sẫm vát góc | Hiển thị sắc nét qua Canvas render |
| **Icon Giao diện (HUD Icons)** | **1:1** | **16 × 16 px** hoặc **24 × 24 px** | Vẽ tay / tạo chuẩn từng pixel block | `image-rendering: pixelated;` |
| **Bục xếp hạng / Minigame Art** | ~16:9 | **960 × 552 px** | Pixel art phối cảnh isometric, bục 4 bậc | Canvas dialog hiển thị cuối ván |

### 4.3. Tiêu chuẩn nhân vật người (Mature Adult Proportions)
* **Kế thừa nghiêm ngặt từ V4:**
  - Tỷ lệ người lớn thực tế: **5 đến 6 đầu** (Semi-realistic mature proportions), thân hình cân đối, bắp thịt chắc khỏe.
  - Thần thái: Người lao động / đấu thủ nghiêm túc, nét mặt điềm đạm, tập trung (chuẩn như thợ mỏ trong `dao-vang-scene.webp`).
* **Tuyệt đối cấm:**
  - Cấm phong cách Anime / Manga: Không mắt to long lanh, không tóc nhọn màu mè quá lố.
  - Cấm phong cách Chibi / Trẻ con: Không đầu to người bé (2–3 đầu), không tay chân bánh mì cụt lủn.

### 4.4. Cấu trúc Prompt chuẩn dành cho Codex
Khi Codex tạo bất kỳ asset mới nào (thumbnail, sprite, background), prompt **BẮT BUỘC** phải có khối lệnh kỹ thuật sau:

> *"Authentic 16-bit retro pixel art, hard-edge chunky pixel grid, strict palette dithering, coarse visible pixel blocks matching the coarse pixel density of ran-san-moi.webp, completely free of painterly brushwork, no smooth gradients, no digital airbrush, no soft blur, no anime eyes, no chibi. 4:3 landscape framing."*

---

## 5. Checklist tự kiểm tra Asset (Quality Gate 5 bước)

Trước khi commit bất kỳ file ảnh nào vào thư mục `assets/`, Codex và Dev đối chiếu 5 tiêu chí:

| Bước | Tiêu chí kiểm tra | Đạt chuẩn (PASS) ✅ | Vi phạm (FAIL — Cần làm lại) ❌ |
|:---:|---|---|---|
| **1** | **Mật độ hạt pixel (Chunky Pixel Density)** | Zoom 200% thấy rõ khối pixel vuông vức sắc nét. Hạt pixel thô đồng nhất với `ran-san-moi.webp`. | Hạt pixel quá mịn, mờ viền, trông như tranh vẽ máy tính (digital painting) rồi thu nhỏ. |
| **2** | **Hình khối & Bo góc** | Góc cắt pixel-cut, bóng đổ cứng 45° không blur. Nút bấm có hiệu ứng vát sáng/tối 2px. | Bo góc tròn mềm kiểu SaaS (`border-radius`), bóng đổ mờ Gaussian blur. |
| **3** | **Bảng màu & Điểm nhấn** | Dùng nền tối trầm (`--px-panel`), màu vàng (`--px-gold`) **chỉ xuất hiện** ở nút chính hoặc lượt đi hiện tại. | Lạm dụng màu vàng khắp nơi, dùng màu neon dạ quang chói gắt. |
| **4** | **Tỷ lệ & Kích thước** | Thumbnail đúng tỉ lệ **4:3** (384×288 px). Sprite đúng lưới **64×64 px**. Bố cục 60–70% trọng tâm. | Sai tỉ lệ (vuông 1:1 hoặc kéo dãn 16:9), sai kích thước frame animation. |
| **5** | **Tính hài hòa toàn cổng (Studio Harmony)** | Đặt cạnh `ran-san-moi.webp`, `dao-vang-scene.webp` và `board-v5`, tài sản trông như cùng một game studio retro chuyên nghiệp. | Lạc tông về ánh sáng, sai tỷ lệ nhân vật (dính anime/chibi), phong cách rời rạc. |

---
*Tài liệu này là quy chuẩn kỹ thuật và mỹ thuật có hiệu lực thi hành ngay cho Webgame Portal. Mọi thành viên (Mama, Dev, Codex, Gehihi) căn cứ tài liệu này để thực hiện và kiểm duyệt.*
