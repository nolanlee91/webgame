# Visual Identity → Portal UI Kit & Game UI Kit (3 hướng)

**Dự án:** Webgame Portal · **Tác giả:** Dev (Technical Lead) · **Ngày:** 16/11/2026
**Trạng thái:** Phân tích để chọn hướng. **Chưa chốt hướng nào, chưa code, chưa sản xuất asset hàng loạt.**
**Đầu vào (ảnh thật, đã mở và xem trực tiếp):**
- `assets/concepts/direction-1-flat-pop.png`
- `assets/concepts/direction-2-cozy-craft.png`
- `assets/concepts/direction-3-pixel-arcade.png`
Mỗi file là PNG 1024×1024, RGB, ghép 4 màn hình: Portal, Lobby, Caro, Đào Vàng.

**Ký hiệu dùng trong tài liệu:**
- 🔍 **Quan sát/đo từ ảnh**, tức mô tả khách quan.
- 🧪 **Đã thử thật** (render font, mô phỏng, tính tương phản).
- 💭 **Đánh giá/đề xuất của Dev.**
- ⚠️ **Giả định chưa kiểm chứng.**

**Cách mình kiểm (để Codex/Mama kiểm lại được):**
1. Xem cả 3 ảnh và phóng to từng vùng.
2. Gom cụm màu (k-means 40 màu) trên toàn ảnh để lấy mã hex thật, không lấy theo mô tả.
3. Đo độ dày viền và bo góc theo pixel.
4. Kiểm hướng 3 có phải pixel art thật không: đếm số màu và độ dài các đoạn cùng màu.
5. Tính tỉ lệ tương phản WCAG cho mọi cặp chữ/nền đề xuất.
6. Tải font từ repo `google/fonts` và render câu tiếng Việt có dấu.
7. Thu nhỏ màn Portal và Đào Vàng của mỗi hướng xuống 300 px rộng để mô phỏng màn hình hẹp.

Ảnh bằng chứng: `docs/visual-identity-evidence/font-vietnamese-test.png`, `docs/visual-identity-evidence/narrow-width-sim.png`.

---

## 0. Kết luận nhanh

| | 1. Flat Pop | 2. Cozy Craft | 3. Pixel Arcade |
|---|---|---|---|
| Dễ responsive trên mobile | 💭 **Dễ nhất** | 💭 **Trung bình–khó** | 💭 **Khó nhất** |
| Phần UI làm được bằng CSS/SVG (không cần ảnh) | 💭 Gần như toàn bộ | 💭 Bố cục được, nhưng vân giấy, mép rách, băng dính cần ảnh raster | 💭 Khung pixel làm bằng 9-slice nhỏ; icon/sprite phải là pixel art thật |
| Font tiếng Việt | 🧪 Ổn (Baloo 2 + Be Vietnam Pro) | 🧪 Font viết tay có dấu, nhưng hẹp ở 14 px | 🧪 **Font 8-bit kinh điển (Press Start 2P) hỏng dấu**; VT323/Tiny5 hiển thị được |
| Ảnh concept có dùng làm chuẩn sản xuất được không | 🔍 Gần với cách làm thật | 🔍 Gần, nhưng có chi tiết lệch luật chơi | 🔍 **Không phải pixel art thật** (1.517 màu trong ô 40×40, phần lớn đoạn cùng màu dài 1 px) |
| Rủi ro giữ ĐỒNG BỘ qua 18 game và 170–280 ảnh AI | 💭 Thấp | 💭 Trung bình (vân/màu nước dễ lệch giữa các lần tạo) | 💭 Cao (mỗi ảnh AI phải dọn lại thành lưới pixel) |

💭 **Đề xuất kiến trúc, áp dụng cho hướng nào cũng vậy:**
- **Một bộ component contracts duy nhất** (mục 2), và **3 hướng chỉ là 3 "theme"** gồm token + skin asset.
- Nhờ vậy component không phụ thuộc hướng được chọn.
- ĐỒNG BỘ được bảo đảm bằng cấu trúc: web portal và UI trong game (Phaser/canvas) đọc **cùng một file token**.

---

## 1. Mô tả khách quan từ ảnh

### 1.1 Hướng 1: Flat Pop & Neo-Brutalism 🔍
**Nền và màu:**
- Nền kem đo được **#F7F1D9 / #F5EFD3**, chiếm ~46% ảnh. Không phải `#FAF7F0` như mô tả.
- Viền và chữ gần đen (#040302).
- Thanh tiêu đề xanh **#3999EC**.
- Thẻ game nền pastel bão hoà: xanh trời #66CAF8, vàng #FBD342, bạc hà #5ED3C6, tím lilac #C096EE, hồng #F68BB3, đào #FBBE82.
- Nút nguy hiểm đỏ **#F25855**, nút cam **#EE892E**, chấm online xanh lá (~#43CA47).

**Hình khối:**
- **Viền đen ~4–5 px** trên ảnh 1024 (mỗi màn rộng ~470 px).
- Bo góc thẻ **~14 px** (~11% chiều rộng thẻ).
- Bóng cứng lệch xuống-phải, không mờ.
- Avatar tròn có viền màu, đè lên hàng người chơi.

**Chữ:** không chân, đậm, bo tròn. Tiêu đề "WEBGAME PORTAL" có viền và bóng.

**Màn hình:**
- **Caro:** lưới vuông, X hồng / O xanh. P1 hồng, P2 xanh, có số trận thắng.
- **Đào Vàng:** thanh HUD vàng "SCORE | LEVEL | TIME | GOAL", nút to "DROP CLAW" (đỏ) và "USE TNT" (cam), hai nút icon cài đặt. Cảnh vẽ cartoon nhiều chi tiết hơn phần UI.

**Lệch với yêu cầu:** chữ tiếng Anh; cờ quốc gia ở lobby; mã phòng **4 chữ số** (spec UX là 6 ký tự); nhãn hàng Caro bị lặp/sai (A…N rồi "15").

### 1.2 Hướng 2: Cozy Hand-Drawn Paper-Craft 🔍
**Màu:**
- **Gần như toàn bộ cụm màu có hue 20–40°** (nâu/cam/be).
- Nền bìa kraft **#C5A076**, giấy **#F2E3CB / #EBD5B6**, giấy ghi chú **#E8CA9D**.
- Mực nâu đen #2D1B0D, nâu phụ #634C3A.
- Đất nung **#C87E56**, gỗ **#AC714B**.
- Xanh sage **#ACAA82 / #7E8B5F** chỉ chiếm ~3%; vàng mật ong #F4CA5D dưới 1%; xanh dương (#74B2C9) xuất hiện rất ít.

**Hình khối:**
- Thẻ dạng polaroid xoay nghiêng, dán băng dính washi, ghim, giấy rách mép, dây cờ trang trí.
- Không có viền đậm; bóng mềm.

**Chữ:** viết tay, nét đều, dễ đọc ở cỡ lớn.

**Màn hình:**
- **Caro:** bàn gỗ, ô giấy màu nước. **Quân cờ là nút áo (xanh đậm / gỗ) thay cho X/O**.
- **Đào Vàng:** thông tin là tờ giấy ghi chú ("Level / Gold / Goal"). **Không có nút điều khiển nào**.
- **Lobby:** danh sách người chơi có avatar dạng sticker cắt viền trắng.

**Lệch với yêu cầu:** chữ tiếng Anh; tên game giả ("Woodland Quest", "Flappy Finch"; chữ "Flappy" gợi liên tưởng một game có thật, nên tránh); chú thích kiểu mockup nằm ngay trong ảnh.

### 1.3 Hướng 3: 16-Bit Cyber Pixel-Arcade 🔍
**Màu:**
- Nền tím than đo được **#150831** (~31%; mô tả là #160F2B, gần đúng), nền sâu #0A071C.
- Bề mặt **#252149 / #382B4F**, viền tối #4A3862.
- Neon cyan **#5FF5FA** (và #50CDDC); magenta đo được dịu hơn mô tả, **#C064D7**.
- Vàng **#FAEC3C / #F2C036**; nút xanh **#2782AD**; chữ trắng #F9F6FC.

**Hình khối:** panel viền neon đôi (ngoài sáng, trong tối), góc vuông, có glow.

**Chữ:** font kiểu bitmap ở mọi nơi.

**Màn hình:**
- **Lobby:** 5 nhân vật pixel đứng trên bệ, mã PIN vàng lớn.
- **Caro:** X cyan / O magenta, có danh sách nước đi, nút Undo/Reset.
- **Đào Vàng:** HUD 4 ô số vàng, cảnh hang động nhiều hạt sáng.

**🔍 Không phải pixel art thật** (đo trên vùng nhân vật thợ mỏ):
- Ô 40×40 px chứa **1.517 màu khác nhau**. Pixel art thật thường dưới ~32 màu.
- Độ dài đoạn cùng màu theo hàng: **69% là 1 px**, 14% là 2 px, không có bước lặp đều. Pixel art phóng to theo bội số nguyên phải ra các đoạn là bội số của một kích thước cố định.
- Kết luận: đây là tranh **mô phỏng phong cách pixel**, có khử răng cưa và trộn nhiều cỡ "pixel".

**Lỗi chữ do AI:** "PLRY NUW", "RERDY", "CHRT", "UNDOM".

---

## 2. Component contracts (dùng chung cho cả 3 hướng)

💭 Phần này **giống nhau cho cả 3 hướng**: cùng props, cùng states, cùng hành vi. Chỉ phần "skin" khác (bảng 2.3).

### 2.1 Quy ước chung
- **States chuẩn** cho mọi component tương tác: `default`, `hover` (chỉ thiết bị có chuột), `active/pressed`, `focus-visible`, `disabled`, và khi cần thì `loading`, `selected`, `error`.
- **Touch target ≥ 44×44 px** (theo `ux-ui-spec.md`). Phần nhìn thấy có thể nhỏ hơn, nhưng vùng chạm phải đủ.
- **Không dùng màu làm tín hiệu duy nhất:** người chơi/phe luôn có thêm hình (X/O, icon, số ghế); trạng thái luôn có thêm chữ hoặc icon.
- **Chữ là chữ thật (HTML/text), không vẽ trong ảnh**, để đúng dấu tiếng Việt và đổi nội dung không cần làm lại ảnh.
- **`prefers-reduced-motion`:** tắt nảy, rung, nhấp nháy và glow động.
- Trong game (canvas), component HUD/popup ưu tiên **lớp DOM chồng lên canvas**, dùng chung CSS token. Chỉ vẽ trong canvas khi cần hiệu năng. 💭

### 2.2 Danh sách component

| Component | Props chính | States / biến thể | Ghi chú hành vi |
|---|---|---|---|
| **Button** | `variant`: primary / secondary / danger / ghost / icon · `size`: sm 36 / md 44 / lg 56 px · `icon`, `iconPosition` · `fullWidth` · `loading` · `disabled` · `label` (bắt buộc với nút chỉ có icon, làm aria-label) | default, hover, pressed, focus-visible, disabled, loading | Pressed có phản hồi rõ (lún xuống / đổi bóng). Loading giữ nguyên chiều rộng. Trong game, lg dùng cho hành động chính (Thả móc, Sẵn sàng) |
| **GameCard** (thẻ game) | `title`, `thumbnail` (key manifest), `size`: 1x1 / 2x1 / 2x2 · `badges[]` (HOT, 2 NGƯỜI, MỚI, ĐUA TOP) · `players`: 1 / 2 / 2–4 · `onlineCount?` · `href` · `rating?` | default, hover (nâng / phát preview), pressed, focus-visible, loading (skeleton), disabled ("Sắp ra mắt") | Cả thẻ là một link duy nhất, không lồng nút "Chơi ngay" riêng (1 tab stop). Preview động chỉ khi hover và không bật reduced-motion |
| **Modal / Popup** | `type`: confirm / result (kết thúc ván) / invite (mời bạn) / settings / ad-break · `title` · `dismissible` · `primaryAction`, `secondaryAction` · `size`: sm / md / full-mobile | open, closing, loading (hành động đang chạy) | Giữ focus trong modal, Esc để đóng nếu `dismissible`. Mobile: dạng bottom sheet. Ad-break luôn có nhãn "Tài trợ" |
| **HUD** | `items[]`: { `kind`: score / time / level / goal / lives / coins / turn, `value`, `label`, `max?` } · `layout`: bar / corner / stacked · `compact` | normal, warning (sắp hết giờ), critical, highlight (vừa tăng điểm) | Số dùng chữ số đều chiều rộng (tabular) để không nhảy. Mobile < 400 px: tối đa 3 ô, phần còn lại vào menu. Cảnh báo có chữ + icon, không chỉ đổi màu |
| **TurnIndicator** | `players[]`, `activeSeat`, `timeLeft`, `symbol` (X/O/màu ngựa) | waiting, my-turn, opponent-turn, disconnected (bot đang thay) | Đến lượt mình thì có tín hiệu rõ (chữ "Lượt của bạn") |
| **Badge / Tag** | `tone`: hot / new / multiplayer / ranked / sponsor / neutral · `label` · `icon?` | static | Nhãn "Tài trợ" cho SpeakUp Kids là bắt buộc và không được làm giống nhãn game |
| **FilterPill** | `label`, `icon?`, `selected`, `count?` | default, hover, selected, focus-visible, disabled | Hàng cuộn ngang trên mobile, không xuống dòng |
| **Avatar** | `src` / `seed` (avatar sinh từ seed), `size`: 24 / 32 / 48 / 64 · `status`: online / away / offline / bot · `seatColor?` · `isHost?` | default, speaking/active (đến lượt), disconnected (mờ + icon) | Có chữ thay thế khi ảnh lỗi (chữ cái đầu) |
| **PlayerSeat** (một hàng trong lobby) | `player?`, `seatIndex`, `ready`, `isHost`, `isMe`, `kickable` | empty (mời bạn), occupied, ready, not-ready, disconnected, bot | Ghế trống là một nút "Mời bạn" |
| **RoomCodeDisplay** | `code` (6 ký tự, theo spec UX), `inviteUrl` · `onCopy`, `onShare` | default, copied (2 s), error | Chia nhóm 3-3 cho dễ đọc. Bỏ ký tự dễ nhầm (0/O, 1/I/L) 💭. Có nút "Sao chép link" và chia sẻ Zalo |
| **PinCodeInput** | `length` = 6 · `charset`: chữ + số (không dấu) · `autoFocus` · `onComplete` | empty, typing, complete, checking, error (rung nhẹ + chữ), disabled | Một input thật (dán được, bàn phím mobile đúng loại), hiển thị thành 6 ô. Tự viết hoa |
| **Toast** | `tone`: info / success / warning / error · `message` · `duration` · `action?` | enter, visible, exit | Có aria-live; không che HUD hoặc nút chính |
| **ChatBox** | `messages[]`, `canSend`, `maxLength`, `quickReplies[]` | idle, typing, sending, muted, error | Mobile: thu gọn thành nút. Ưu tiên câu chat nhanh có sẵn (an toàn cho trẻ em 💭) |
| **ProgressBar / TimerBar** | `value`, `max`, `tone` | normal, warning, critical, paused | Có cả số, không chỉ thanh |
| **BoardCell** (ô lưới cho engine Lưới ô) | `state`: empty / hover / placed / last-move / winning / disabled · `symbol` · `owner` | như `state` | Dùng chung cho Caro, Cờ Tướng (giao điểm), Sudoku, 2048, Nối Thú. Ô nhỏ nhất trên mobile là ràng buộc lớn (mục 4) |
| **LeaderboardRow** | `rank`, `player`, `score`, `isMe`, `delta?` | default, highlight (mình), top-3 | Top 3 có huy chương (icon) |
| **AdSlot** | `placement`: native-card / sticky-bar / end-game · `sponsor` · `label` = "Tài trợ" | loading, filled, empty (ẩn, không để khoảng trống) | Kích thước cố định để tránh nhảy layout |
| **Header / BottomNav** | `items[]`, `active`, `user?` | default, active, badge-count | Desktop: header ngang. **< 768 px: bottom nav 4–5 mục** (concept hướng 1 có 5 mục ngang, không đủ chỗ ở 360 px) |
| **Toggle / SettingsRow** | `checked`, `label`, `disabled` | on, off, focus-visible, disabled | Âm thanh, nhạc, rung |
| **Skeleton / EmptyState / ErrorState** | `variant`, `message`, `action?` | — | Mỗi hướng có hình minh hoạ riêng cho trạng thái trống/lỗi |

### 2.3 Skin theo hướng (cùng contract, khác cách thể hiện) 💭

| Component | 1. Flat Pop | 2. Cozy Craft | 3. Pixel Arcade |
|---|---|---|---|
| Button pressed | Dịch 2 px xuống-phải, bóng cứng giảm từ 4 → 2 px | Lún nhẹ, bóng mềm thu lại, có thể là nút gỗ/nỉ | Đổi sang frame pressed (9-slice), dịch 1 pixel đơn vị |
| Button disabled | Nền xám kem, viền 50% opacity, chữ phụ | Giấy bạc màu, nét đứt | Khung tối, chữ mờ, không glow |
| Focus-visible | Vòng xanh đậm 3 px, cách 2 px | Vòng nâu đậm 3 px, nét đứt kiểu đường may | Viền vàng pixel 2 đơn vị, nhấp nháy theo bước (tắt khi reduced-motion) |
| GameCard hover | Nâng 6 px, bóng cứng dài ra | Xoay ±1°, nhấc lên như ảnh dán | Viền neon sáng + glow |
| Modal | Hộp viền đen dày, bóng cứng lớn | Tờ giấy dán băng dính, mép rách | Khung CRT viền neon đôi, scanline |
| HUD | Thanh màu đặc, ô bo tròn | Tờ ghi chú ghim | Ô số neon, font bitmap |
| Avatar | Tròn, viền màu ghế | Sticker cắt viền trắng | Pixel 32/48 px trong khung vuông |
| PlayerSeat ready | Nền bạc hà + icon ✓ | Con dấu "Sẵn sàng" | Nhãn "READY" xanh lá nhấp nháy theo bước |

---

## 3. Design tokens theo từng hướng

💭 Token chia 3 tầng: **primitive** (mã màu gốc) → **semantic** (`text.primary`, `status.error`…) → **component** (`button.primary.bg`…). Component chỉ dùng semantic. Đổi hướng = thay primitive + một số semantic.

Trong các bảng dưới: cột "Nguồn" ghi 🔍 nếu mã màu **đo từ ảnh**, 💭 nếu **Dev đề xuất thêm** (thường để đạt tương phản). Tỉ lệ tương phản 🧪 tính theo công thức WCAG 2.x. Ngưỡng: chữ thường ≥ 4.5; chữ lớn (≥ 24 px, hoặc ≥ 18.66 px đậm) và thành phần giao diện ≥ 3.

### 3.1 Hướng 1: Flat Pop (theme sáng)

**Màu**

| Token | Giá trị | Nguồn | Tương phản 🧪 |
|---|---|---|---|
| `bg.canvas` | #F7F1D9 | 🔍 | — |
| `bg.surface` (thẻ, panel) | #FFFDF5 | 💭 | chữ ink: 17.09 |
| `bg.sunken` (ô nhập, vùng lõm) | #EFE7C8 | 💭 | — |
| `border.strong` / `ink` | #1B1A17 | 💭 (ảnh đo #040302, gần đen tuyền) | trên canvas: 15.36 |
| `text.primary` | #1B1A17 | 💭 | 15.36 ✅ |
| `text.secondary` | #4C443C | 🔍 | 8.43 ✅ |
| `text.onFill` (chữ trên mọi nền pastel) | #1B1A17 | 💭 | vàng 12.01 · hồng 7.68 · bạc hà 9.62 · lilac 7.32 · xanh #3999EC 5.75 ✅ |
| `text.inverse` | #FFFFFF | 💭 | **chỉ dùng trên `brand.blueStrong`** (5.13). Trắng trên #3999EC chỉ 3.03, trên vàng 1.45 ❌ |
| `brand.blue` (header, nút chính) | #3999EC | 🔍 | — |
| `brand.blueStrong` (link, chữ xanh) | #1F6FC0 | 💭 | trên canvas: 4.53 ✅ |
| `accent.yellow / pink / lilac / mint / sky / peach` | #FBD342 / #F68BB3 / #C096EE / #5ED3C6 / #66CAF8 / #FBBE82 | 🔍 | dùng làm nền, chữ đen |
| `status.success` (nền / chữ) | #43CA47 / #1E7A3C | 🔍 / 💭 | chữ: 4.75 ✅ |
| `status.error` | #F25855 / #C0362C | 🔍 / 💭 | chữ: 4.87 ✅ |
| `status.warning` | #EE892E / #9A5B00 | 🔍 / 💭 | chữ: 4.79 ✅ |
| `status.info` | #66CAF8 / #1F6FC0 | 🔍 / 💭 | 4.53 ✅ |
| `player.1–4` | hồng #F68BB3, xanh #66CAF8, vàng #FBD342, bạc hà #5ED3C6 | 🔍 (P1/P2 lấy từ màn Caro) | luôn kèm ký hiệu |
| `focus.ring` | #1F6FC0 | 💭 | ≥ 3 ✅ |

**Typography**
- Tiêu đề / nút: **Baloo 2**, đậm 700–800. Có bộ ký tự tiếng Việt 🧪 (metadata Google Fonts + render thử), giấy phép OFL 🧪.
- Nội dung: **Be Vietnam Pro** (OFL, có tiếng Việt 🧪).
- Lưu ý: **Fredoka**, một font tròn rất giống concept, **không có bộ ký tự tiếng Việt** 🧪, nên không dùng.
- Thang cỡ: 12 / 14 / 16 / 20 / 24 / 32 / 40 px (tỉ lệ ~1.25). Chữ nội dung tối thiểu 16 px trên mobile.

**Không gian và hình khối**

| Token | Giá trị |
|---|---|
| spacing | 4 / 8 / 12 / 16 / 24 / 32 / 48 |
| radius | sm 8 · md 14 (🔍 thẻ đo ~14 px) · lg 20 · xl 28 · pill 999 |
| border | 3 px desktop, **2 px khi < 400 px** 💭 |
| shadow (bóng cứng, không blur 🔍) | sm `2px 2px 0 ink` · md `4px 4px 0 ink` · lg `6px 6px 0 ink`; pressed: dịch 2 px và giảm bóng |
| motion | 120–200 ms, easing nảy nhẹ |

### 3.2 Hướng 2: Cozy Craft (theme sáng, ấm)

**Màu**

| Token | Giá trị | Nguồn | Tương phản 🧪 |
|---|---|---|---|
| `bg.canvas` (bìa kraft) | #C5A076 | 🔍 | — |
| `bg.surface` (giấy) | #F2E3CB | 🔍 | — |
| `bg.surfaceAlt` | #EBD5B6 | 🔍 | — |
| `bg.note` (giấy ghi chú) | #E8CA9D | 🔍 | chữ ink 10.49 |
| `ink` / `text.primary` | #2D1B0D | 🔍 | giấy 13.05 ✅ · kraft 6.80 ✅ |
| `text.secondary` | #634C3A | 🔍 | giấy 6.33 ✅ · **kraft 3.30 ❌** |
| `accent.terracotta` / `terracottaStrong` | #C87E56 / #85492B | 🔍 / 💭 | chữ trắng trên #C87E56 chỉ 3.19 ❌ → dùng chữ ink (5.16) hoặc nền #85492B với chữ giấy (5.57 ✅) |
| `accent.sage` / `sageDeep` / `sageStrong` | #ACAA82 / #7E8B5F / #4F5E33 | 🔍 / 🔍 / 💭 | #7E8B5F làm chữ chỉ 2.89 ❌; #4F5E33 + chữ giấy 5.58 ✅ |
| `accent.honey` / `honeyDeep` | #F4CA5D / #CA9131 | 🔍 | chữ ink trên honey 10.56 |
| `accent.wood` | #AC714B | 🔍 | — |
| `accent.navy` (quân cờ tối) | #3E4855 | 🔍 | trên giấy 7.35 |
| `status.success` (nền / chữ) | #97A56A / #5B6B3A | 🔍 / 💭 | 4.61 ✅ |
| `status.error` | #C87E56 / #A3402B | 🔍 / 💭 | 5.00 ✅ |
| `status.warning` | #F4CA5D / #8A5A12 | 🔍 / 💭 | 4.68 ✅ |
| `status.info` | #74B2C9 / #3E4855 | 🔍 / 💭 | 7.35 ✅ |
| `player.1–4` | navy #3E4855, gỗ #AC714B, sage #7E8B5F, terracotta #C87E56 | 💭 | độ sáng gần nhau → **bắt buộc kèm ký hiệu/hoa văn** |

**Typography**
- Tiêu đề / nhãn lớn: **Patrick Hand** (vi 🧪, OFL 🧪), hoặc Itim / Mali (có tiếng Việt theo metadata 🧪, chưa render thử ⚠️).
- Nội dung: Be Vietnam Pro hoặc Nunito.
- 🧪 Patrick Hand ở 14 px hẹp, khó đọc (xem ảnh thử font). **Font viết tay chỉ dùng từ 20 px trở lên**; chat, luật chơi, mô tả dùng font không chân.
- Thang cỡ: 12 / 14 / 16 / 20 / 24 / 32 / 40 (giống hướng 1, để component có cùng kích thước).

**Không gian và hình khối**

| Token | Giá trị |
|---|---|
| spacing | 4 / 8 / 12 / 16 / 24 / 32 / 48 (+ lề trong lớn hơn cho thẻ polaroid) |
| radius | xs 2 (góc giấy) · sm 4 · md 8 (nút gỗ/nỉ). Mép rách dùng ảnh mask, không dùng radius |
| border | thường không viền; nét chì/sáp 1.5–2 px khi cần (SVG) |
| shadow (mềm 🔍) | sm `0 1px 2px rgba(45,27,13,.25)` · md `0 4px 10px rgba(45,27,13,.18)` · lifted `0 10px 24px rgba(45,27,13,.22)` |
| rotation | thẻ / ghi chú xoay ±1–3° (💭 tắt khi reduced-motion và ở vùng chứa chữ dài) |
| motion | 200–300 ms, êm, hơi lắc |

### 3.3 Hướng 3: Pixel Arcade (theme tối)

**Màu**

| Token | Giá trị | Nguồn | Tương phản 🧪 |
|---|---|---|---|
| `bg.canvas` | #150831 | 🔍 | — |
| `bg.deep` | #0A071C | 🔍 | — |
| `bg.surface` / `surface2` | #252149 / #382B4F | 🔍 | chữ trắng trên surface 14.09 |
| `border.dim` | #4A3862 | 🔍 | **1.83 so với nền** → chỉ trang trí, không dùng để báo trạng thái |
| `border.neon` / `accent.cyan` | #5FF5FA | 🔍 | 14.34 ✅ |
| `accent.cyan2` | #50CDDC | 🔍 | — |
| `accent.magenta` / `magentaHot` | #C064D7 / #FF4FD8 | 🔍 / 💭 | 5.44 / 6.63 ✅ |
| `accent.yellow` / `gold` | #FAEC3C / #F2C036 | 🔍 | 15.42 / 11.13 ✅ |
| `button.blue` / `blueStrong` | #2782AD / #1D6A8F | 🔍 / 💭 | chữ trắng: 4.02 ❌ (chữ thường) / 5.98 ✅ |
| `text.primary` / `secondary` / `muted` | #F9F6FC / #CAC8DA / #8E86B0 | 🔍 / 🔍 / 💭 | 17.66 / 11.51 / 5.57 ✅ |
| `status.success` | #3DDC84 | 💭 | 10.59 ✅ |
| `status.error` | #FF5C7A | 💭 | 6.36 ✅ |
| `status.warning` | #F2C036 | 🔍 | 11.13 ✅ |
| `status.info` | #5FF5FA | 🔍 | 14.34 ✅ |
| `player.1–4` | cyan, magenta, vàng, xanh lá | 🔍 (P1/P2 từ Caro) | kèm ký hiệu |
| `glow` | `0 0 0 2px <neon>, 0 0 12px <neon>/50%` | 💭 | trang trí; tắt khi reduced-motion hoặc máy yếu |

**Typography**
- 🧪 **Press Start 2P**, font 8-bit phổ biến nhất, **không có ơ, ư, ắ, ẵ, ờ, ữ, ớ**: hiện thành ô vuông. ❌ Không dùng được.
- **Pixelify Sans** và **Silkscreen** cũng không có bộ ký tự tiếng Việt (metadata 🧪).
- **Dùng được:**
  - **VT323**: có tiếng Việt, render đủ dấu 🧪, OFL 🧪. Đọc tốt từ ~20 px.
  - **Tiny5**: có tiếng Việt 🧪, OFL 🧪. Ở 10 px dấu không đọc được; dùng từ 15 px.
- **Font pixel chỉ dùng cho tiêu đề, số HUD, nhãn ngắn.** Chat, luật chơi, mô tả, form dùng Be Vietnam Pro, nếu không thì văn bản tiếng Việt dài sẽ rất khó đọc 💭.
- Thang cỡ: font pixel theo bội số cỡ thiết kế của font (cỡ thiết kế cụ thể của VT323/Tiny5 trong trình duyệt ⚠️ chưa thử); font thường dùng thang 12–40 như trên.

**Không gian và hình khối**

| Token | Giá trị |
|---|---|
| đơn vị pixel | **1 "pixel nghệ thuật" = 2 px CSS (mobile) / 3–4 px CSS (desktop)** 💭. Mọi viền, bo góc, khoảng cách là bội số của đơn vị này |
| spacing | 4 / 8 / 12 / 16 / 24 / 32 (bội số 4, khớp đơn vị 2 px) |
| radius | 0. Góc "bậc thang" vẽ bằng 9-slice hoặc clip-path theo bước pixel |
| border | 2 đơn vị pixel; panel viền đôi (neon ngoài, tối trong) 🔍 |
| shadow | bóng pixel cứng `4px 4px 0 #0A071C`; glow như bảng màu |
| motion | easing theo bước (`steps(4)`), 100–160 ms; nhấp nháy ≤ 2 lần/giây |
| rendering | `image-rendering: pixelated`; canvas game vẽ ở độ phân giải gốc rồi phóng theo **bội số nguyên** (mục 4) |

---

## 4. Asset specifications theo hướng

Kế thừa quy chuẩn manifest, kích thước và atlas trong `docs/asset-production-strategy-dev.md`. Bảng dưới chỉ ghi **phần khác nhau giữa 3 hướng**. Số lượng là ⚠️ ước tính.

### 4.1 Asset của UI Kit (portal + khung UI trong game)

| Loại asset | 1. Flat Pop | 2. Cozy Craft | 3. Pixel Arcade |
|---|---|---|---|
| **Bộ icon** (~40 icon: home, game, nhiều người, cúp, cài đặt, âm thanh bật/tắt, chia sẻ, sao chép, đóng, quay lại, tạm dừng, chơi lại, gợi ý, hoàn tác, sao, xu, chat, gửi, vương miện, khoá, ✓, cảnh báo…) | **SVG**, lưới 24×24, nét 2–2.5 px bo tròn. **Lấy Lucide (ISC ✅) chỉnh nét/thêm màu** → hầu như không cần AI | **SVG nét tay** (rung, không đều) vẽ riêng ~40 cái; hoặc PNG @2x 48/96 px. Lucide quá hình học. Bộ lọc SVG làm nhoè nét tốn hiệu năng trên mobile ⚠️ | **Pixel icon lưới 16×16** (chỉ thêm 24×24 khi cần). Xuất PNG 1× hoặc SVG từ ô vuông (`shape-rendering: crispEdges`), phóng ×2/×3 nguyên. Vẽ tay hoặc AI + dọn lại từng pixel |
| **Vân / họa tiết nền** | Không cần ảnh; chấm bi/sọc bằng CSS nếu muốn | Ảnh lặp liền mạch, WebP: **giấy 512×512, kraft 512×512, gỗ 512×512, nỉ 256×256** (4–6 ảnh, mỗi ảnh ≤ 40–60 KB ⚠️) | Scanline CSS (gradient); lưới/ngôi sao dạng ô pixel 64×64 PNG (2–4 ảnh, vài KB) |
| **Khung / viền** | Không cần ảnh: CSS border + bóng cứng | **9-slice PNG-32 @2x:** mép giấy rách (4 biến thể), khung polaroid, băng dính washi (3–4 màu × 2 độ dài), ghim, giấy ghi chú, dây cờ → **~15–20 ảnh** | **9-slice pixel:** panel neon đôi (default / selected / danger / card), mỗi khung ~24×24 với góc 8 px, phóng nguyên qua `border-image` → **~6–10 ảnh** rất nhẹ |
| **Nút** | CSS | CSS + tùy chọn nút gỗ / nút nỉ (9-slice, 3 trạng thái) | 9-slice pixel × 3 trạng thái (default / pressed / disabled) × 3 màu |
| **Logo** | SVG (chữ có viền và bóng) | SVG/PNG chữ viết tay + giấy | Logo pixel (PNG 1×, phóng nguyên) |
| **Avatar** (16 mẫu khách, nếu không sinh bằng code) | SVG/PNG 256, tròn, viền màu ghế | PNG 256 dạng sticker viền trắng | Pixel 32×32 hoặc 48×48 |
| **Minh hoạ trạng thái trống / lỗi / 404** (3–5) | SVG/PNG phẳng | PNG màu nước | Pixel art |
| **Hiệu ứng** (tia, sao, confetti) | CSS/canvas hình khối | Giấy vụn, ngôi sao vẽ tay (PNG nhỏ) | Hạt pixel (canvas, ô vuông) |
| **Font** (WOFF2, chỉ giữ bộ latin + vietnamese) | Baloo 2 + Be Vietnam Pro | Patrick Hand (hoặc Itim / Mali) + Be Vietnam Pro / Nunito | VT323 / Tiny5 + Be Vietnam Pro |

### 4.2 Asset trong game (thumbnail, sprite, nền)

| Loại | 1. Flat Pop | 2. Cozy Craft | 3. Pixel Arcade |
|---|---|---|---|
| Thumbnail game | Master 1024² PNG → WebP 512/256 (như strategy) | Như hướng 1; màu nước có nhiều chi tiết tần số cao, nén WebP nặng hơn ⚠️ | **Vẽ ở 128×128 hoặc 160×160 gốc**, lưu PNG 1× (vài KB), CSS phóng nguyên. Nhẹ nhất, nhưng phải là pixel art thật |
| Sprite / vật phẩm | Master 512² PNG-32, viền đen đồng nhất. **Viền có thể thêm bằng code** khi hậu kỳ → dễ đồng bộ ảnh AI | Master 512² PNG-32, viền sticker trắng (có thể thêm bằng code) | **Lưới gốc 16 / 24 / 32 px**, bảng màu giới hạn (đề xuất ≤ 32 màu chung toàn site 💭), PNG 1× |
| Nền màn chơi | 1920×1080 WebP ≤ 200 KB | 1920×1080 WebP, dễ vượt 200 KB vì vân giấy ⚠️ | **320×180 hoặc 480×270 gốc** → phóng ×4/×6 nguyên; PNG vài chục KB |
| Animation | Tween bằng code là chính | Tween + lắc giấy | **Frame theo lưới pixel** (tween xoay/scale làm vỡ lưới pixel → hạn chế xoay tự do) 💭 |
| Bàn cờ / lưới (Caro, Cờ Tướng, Sudoku, 2048…) | CSS/SVG, rất hợp phong cách | SVG + vân giấy/gỗ (ảnh) | Ô pixel; lưới phải khớp đơn vị pixel |

### 4.3 Ảnh hưởng tới quy trình sản xuất AI (170–280 ảnh) 💭

| | 1. Flat Pop | 2. Cozy Craft | 3. Pixel Arcade |
|---|---|---|---|
| Hậu kỳ bằng code giúp đồng bộ? | **Nhiều**: thêm viền đen đều, ép bảng màu phẳng | Vừa: thêm viền sticker, phủ vân giấy chung | **Bắt buộc nhưng chưa đủ**: thu về lưới gốc + ép bảng màu, thường vẫn phải sửa tay từng pixel |
| Số ảnh cần sửa tay | Thấp | Trung bình (vân/ánh sáng lệch giữa các lần tạo) | **Cao**: ảnh concept chứng minh AI cho ra "trông giống pixel" chứ không phải pixel thật |
| Lấy được từ nguồn mở? | Một phần (Kenney CC0 có nhiều bộ phẳng ⚠️ chưa đối chiếu phong cách) | Ít | Kenney CC0 có bộ pixel ⚠️ chưa đối chiếu phong cách |

---

## 5. Đánh giá triển khai trên mobile

### 5.1 Bằng chứng từ mô phỏng màn hình hẹp 🧪
Thu nhỏ màn Portal và Đào Vàng của mỗi hướng xuống 300 px rộng (`narrow-width-sim.png`). Đây chỉ là thu nhỏ bố cục desktop, **không phải layout mobile thật**, nhưng cho thấy chi tiết nào sống sót được:
- **Hướng 1:** nhãn thẻ và nút vẫn đọc được. Chỉ menu ngang 5 mục quá nhỏ. Cảnh Đào Vàng vẫn rõ nhờ viền đậm.
- **Hướng 2:** tiêu đề viết tay lớn vẫn đọc tốt, vân giấy vẫn đẹp. **Chỉ vừa 3 thẻ game một hàng**, vì polaroid cộng lề và độ nghiêng tốn chỗ. Ghi chú HUD đọc được vì cỡ lớn.
- **Hướng 3:** cảnh game vẫn rõ nhờ tương phản cao. **Chữ nhỏ trên thẻ ("PLAY NOW", tên game) gần như không đọc được.**

### 5.2 Bảng đánh giá

| Tiêu chí | 1. Flat Pop | 2. Cozy Craft | 3. Pixel Arcade |
|---|---|---|---|
| Phóng to/nhỏ theo mật độ điểm ảnh (DPR 2 / 2.625 / 3) | ✅ Vector/CSS, nét ở mọi DPR | 🟡 Vân raster cần @2x; mép rách 9-slice có thể lộ đường nối ⚠️ | ❌ **Khó nhất.** Pixel art chỉ nét khi phóng **bội số nguyên theo pixel thiết bị**. Nhiều máy Android có DPR 2.625/2.75: phóng theo px CSS sẽ mờ hoặc pixel to nhỏ không đều. Canvas game phải tính theo pixel thiết bị + letterbox (ví dụ màn 1080 px ngang với nền 320×180 → ×3 = 960, dư 60 px mỗi bên). Khung UI DOM bằng `border-image` có thể lệch 1 pixel thiết bị ⚠️ |
| Mật độ thông tin ở 360 px | ✅ Lưới 2 cột thẻ vẫn rõ. Viền 3 px + bóng 4 px tốn ~7 px mỗi cạnh → giảm còn 2/2 px | 🟡 Polaroid nghiêng, băng dính, mép rách chiếm diện tích. Phải bỏ bớt trang trí ở mobile, dễ làm mất "chất" của hướng | 🟡 Khung neon đôi tốn ~4 đơn vị pixel mỗi cạnh; HUD 4 ô phải gom lại |
| Chữ tiếng Việt cỡ nhỏ | ✅ Font tròn có dấu, đọc tốt từ 14 px | 🟡 Font viết tay hẹp ở 14 px → phải dùng font thường cho chữ nhỏ (2 font song song) | ❌ Font pixel có dấu chồng nhiều tầng (ẵ, ữ) khó đọc ở cỡ nhỏ; Tiny5 10 px không đọc được 🧪 → hầu hết chữ nhỏ phải là font thường, làm loãng phong cách |
| Ô lưới nhỏ nhất (Caro 15×15 trên 360 px ≈ 22 px mỗi ô) | ✅ Đường lưới mảnh + X/O rõ | 🟡 Nút áo/vân giấy trong ô 22 px mất chi tiết; cần ký hiệu đơn giản hơn | 🟡 22 px không chia hết cho đơn vị pixel ×2 lớn → phải chọn kích thước ô theo bội số (20 hoặc 24) 💭 |
| Hiệu năng máy tầm trung ⚠️ | ✅ Nhẹ nhất: ít ảnh, bóng cứng không tốn GPU | 🟡 Nhiều ảnh vân (tải + bộ nhớ); bóng mềm nhiều lớp và xoay làm nặng lúc cuộn | 🟡 Ảnh rất nhẹ; **glow (blur) và scanline phủ toàn màn** tốn GPU khi animation → cần tắt ở máy yếu |
| Tương phản / dễ tiếp cận 🧪 | ✅ Chữ đen trên mọi nền pastel ≥ 5.2. Cần cấm chữ trắng trên pastel | 🟡 Bảng màu dồn trong hue 20–40° → khó phân biệt trạng thái/phe; chữ phụ trên kraft không đạt (3.30) | ✅ Chữ trên nền tối rất cao (≥ 11). Rủi ro: nhấp nháy/glow với người nhạy cảm ánh sáng |
| Đồng bộ web ↔ canvas game | ✅ Dễ: cùng hình khối, viền, màu | 🟡 Vân giấy phải có mặt cả trong canvas (thêm ảnh nền game) | 🟡 UI DOM dùng font thường lẫn font pixel; canvas dùng pixel thật → dễ "hai thế giới" nếu không kỷ luật |
| Công sức responsive tổng thể (💭 so sánh tương đối) | **1×** (mốc) | **~1.5–2×** ⚠️ | **~2–2.5×** ⚠️ |

### 5.3 Nhận định 💭
- **Hướng 1 dễ nhất, không chỉ "dễ theo mặc định":** UI làm bằng CSS/SVG nên nét ở mọi DPR; chữ đen trên nền pastel đạt tương phản; viền đậm giúp vật thể nổi rõ ở cỡ nhỏ; hậu kỳ thêm viền bằng code giúp 170–280 ảnh AI đồng bộ. Rủi ro chính là bị coi là "giống nhiều app khác" (thẩm mỹ, không phải kỹ thuật).
- **Hướng 2 làm được nhưng phải có "bản rút gọn cho mobile":** bỏ bớt nghiêng, băng dính, mép rách ở màn nhỏ; vân giấy làm ảnh nền chung; font viết tay chỉ cho tiêu đề. Cần thêm một màu tương phản (ví dụ xanh) để phân biệt trạng thái và người chơi.
- **Hướng 3 khó nhất về kỹ thuật và sản xuất:**
  - Phải có pipeline tính tỉ lệ nguyên theo pixel thiết bị.
  - Font pixel tiếng Việt chỉ dùng được cho chữ ngắn và cỡ lớn.
  - **Ảnh AI phải dọn lại thành pixel art thật**, mà concept cho thấy AI chưa làm được.
  - Nếu chọn hướng này, nên làm **thử nghiệm kỹ thuật 1 màn** (Đào Vàng hoặc Caro) trên 2–3 máy Android trước khi cam kết.

---

## 6. Giả định chưa kiểm chứng ⚠️

1. Mọi hệ số công sức (1× / 1.5–2× / 2–2.5×) và ngân sách KB là ước lượng, chưa đo trên máy thật.
2. Hành vi render font pixel trong trình duyệt ở từng cỡ chữ và DPR. Ảnh thử font được render bằng thư viện ảnh Python, không phải Chrome/Safari.
3. Hiệu năng glow, bóng mềm, vân giấy trên Android tầm trung.
4. Itim/Mali chưa render thử (chỉ có metadata xác nhận có tiếng Việt). License của từng font chỉ kiểm qua file OFL.txt trong `google/fonts` cho: VT323, Tiny5, Baloo 2, Patrick Hand, Press Start 2P (đã kiểm), cùng Be Vietnam Pro và Nunito (đã kiểm ở lần trước).
5. Kenney có bộ asset phẳng/pixel hợp phong cách hay không (chưa đối chiếu).
6. Mã màu đo từ ảnh AI nén có sai số vài đơn vị. Token cuối cùng nên do Gehihi chốt sau khi chọn hướng.
7. Mã phòng 6 ký tự theo `ux-ui-spec.md`. Cả 3 concept đều vẽ 4 chữ số; cần Gehihi thống nhất.

## 7. Cần Mama / chủ dự án quyết (không chặn công việc khác)
1. Chọn một hướng. Mình chỉ nêu đánh giá kỹ thuật, không chốt.
2. Đồng ý kiến trúc "1 bộ component + theme token" để mọi hướng dùng chung contract.
3. Nếu nghiêng về hướng 3: duyệt thử nghiệm kỹ thuật 1 màn trên máy thật trước khi sản xuất asset.
4. Gehihi cập nhật concept bằng **chữ tiếng Việt thật** (dài hơn chữ Anh và có dấu chồng). Đây là phép thử cho cả 3 hướng mà concept hiện tại chưa làm.
