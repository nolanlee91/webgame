# Webgame Portal — Kế hoạch V2 (tổng hợp, chờ chủ dự án phê duyệt)

**Tác giả:** Mama (điều phối) — tổng hợp từ `docs/game-catalog-v2.md` (Gehihi), `docs/tech-architecture-v2.md` (Dev), `docs/architecture-review-v2.md` (Codex, review độc lập).
**Ngày tổng hợp:** 17/11/2026
**Trạng thái:** ĐỀ XUẤT — chưa có mục nào được chủ dự án phê duyệt. Tài liệu này không tự quyết thay chủ dự án; mục 8 liệt kê rõ các điểm cần quyết định.
**Quan hệ với V1:** `docs/plan.md` (và các tài liệu V1 khác) được giữ nguyên để so sánh. Tài liệu này **thay thế** phần phạm vi/roadmap của V1 theo yêu cầu điều chỉnh của chủ dự án, không xoá hay sửa file V1.
**Quy tắc đã tuân thủ:** chưa code game, chưa deploy, chưa dùng dịch vụ trả phí, Mama không tự phê duyệt thay chủ dự án.

---

## 0. Tóm tắt thay đổi so với V1

| | V1 | V2 (đề xuất) |
|---|---|---|
| Mục tiêu MVP kỹ thuật | Bị hiểu nhầm là phạm vi launch | 2–3 game (2048, Caro, Rắn đơn) **chỉ để kiểm chứng kiến trúc**, không phải launch công khai |
| Mục tiêu Public Launch | Không rõ ràng | ~18 game (có phương án dự phòng 15, xem mục 8) hoàn chỉnh, mượt trên mobile, chất lượng trên số lượng |
| Kiến trúc | Next.js + Colyseus + 1 GameRoom chung | Giữ Next.js + Colyseus, thay 1 GameRoom chung bằng `RoomShell` + 3 loại controller (Turn/Round/Tick) + 4 engine nội bộ dùng chung (E1–E4) + Content Service + Save Service |
| Review | 1 vòng | Codex review độc lập cả danh mục và roadmap, có nguồn trích dẫn, không tự thu hẹp phạm vi |

Ba bot đã có sản phẩm bàn giao cụ thể, đã được Mama đọc toàn văn (không chỉ qua báo cáo tóm tắt):
- Gehihi → `docs/game-catalog-v2.md` (173 dòng)
- Dev → `docs/tech-architecture-v2.md` (262 dòng)
- Codex → `docs/architecture-review-v2.md` (146 dòng, review độc lập cả hai file trên)

---

## 1. Danh mục game đề xuất (18 game) và xếp hạng ưu tiên

Nguồn: Gehihi, phản biện: Codex. **Điểm số là giả thuyết sản phẩm của Gehihi (thói quen người Việt, bài học từ Poki/Đấu Trí/CrazyGames), chưa phải số liệu traffic/SEO/chuyển đổi thật** — Codex nhấn mạnh điểm này, chưa có dữ liệu để xác nhận.

> **Lưu ý tên gọi (quan trọng, xem mục 7):** các tên trong ngoặc ở bảng gốc của Gehihi (Pikachu, Tetris, Dynomite, Hill Climb Racing, Bomb Arena/Bomberman, Bow Master/Bowmen) **không được dùng làm tên công khai, logo, hay sao chép hình ảnh/giao diện**. Bảng dưới dùng tên thuần Việt làm tên chính thức; tên trong ngoặc chỉ còn ý nghĩa tham chiếu nội bộ cho dev/thiết kế, phải xoá trước khi ra mắt công khai.

| # | Tên chính thức | Thể loại | Chế độ (launch) | Điểm /20 | Nhóm ưu tiên |
|---|---|---|---|---|---|
| 1 | Cờ Caro Trực Tuyến | Board/Trí tuệ | Online 1v1 + bot | 20 | 1 — Must-have |
| 2 | Rắn Săn Mồi Siêu Cấp | Arcade | **Đơn** (online realtime dời sau launch) | 20* | 1 — Must-have |
| 3 | Nối Thú Cổ Điển | Puzzle | Đơn | 19 | 1 — Must-have |
| 4 | Đào Vàng Biển Sâu | Casual/Kỹ năng | Đơn + 2P **cùng máy** | 19 | 1 — Must-have |
| 5 | Nối Từ Tiếng Việt | Wordplay | Online 1v1 + bot | 19 | 1 — Must-have |
| 6 | Bắn Bóng Trứng Khủng Long | Arcade/Puzzle | Đơn | 18 | 2 — Tăng trưởng |
| 7 | Cờ Tướng Đấu Trí | Board | Online 1v1 + bot | 18 | 2 — Tăng trưởng |
| 8 | Đố Vui Nhanh | Quiz | Đơn + online nhiều người | 18 | 2 — Tăng trưởng |
| 9 | 2048 Siêu Cấp | Puzzle | Đơn | 18 | 2 — Tăng trưởng |
| 10 | Cờ Cá Ngựa | Board | Online 2–4 người + bot | 17 | 2 — Tăng trưởng |
| 11 | Đặt Bom Tốc Độ | Arcade/Action | **Chơi với máy** (online 2–4 dời sau launch) | 17* | 2 — Tăng trưởng |
| 12 | Bắn Cung Tọa Độ | Kỹ năng/Vật lý | Đơn + 2P cùng máy | 16 | 3 — Bổ trợ |
| 13 | Xếp Gạch Cổ Điển | Arcade | Đơn | 16 | 3 — Bổ trợ (rủi ro pháp lý cao, xem mục 7) |
| 14 | Tìm Điểm Khác Biệt | Trí tuệ/Quan sát | Đơn | 15 | 3 — Bổ trợ |
| 15 | Đua Xe Vượt Đồi | Kỹ năng/Lái xe | Đơn | 15 | 3 — Bổ trợ *(ứng viên dời nếu phải cắt về 15 game)* |
| 16 | Nông Trại Trồng Rau | Idle/Casual | Đơn | 14 | 3 — Bổ trợ *(ứng viên dời)* |
| 17 | Ghép Kẹo Ngọt | Match-3 | Đơn | 14 | 3 — Bổ trợ |
| 18 | Sudoku Trí Tuệ | Logic | Đơn | 13 | 3 — Bổ trợ |

*\*Codex: điểm 20/20 của Rắn và 17/20 của Đặt Bom dựa một phần vào chế độ multiplayer. Bản launch chỉ có chơi đơn/với máy — **không nên dùng nguyên điểm số và kỳ vọng viral đó cho bản launch**; online thật ra mắt ở Giai đoạn 5 (sau Public Launch).*

Thứ tự **triển khai kỹ thuật** (roadmap mục 4) khác thứ tự điểm số này vì phụ thuộc kiến trúc (vd. Nối Từ 19/20 phải chờ từ điển + RoomShell ổn định trước). Đây là lựa chọn có chủ đích của Dev, Codex đồng ý.

---

## 2. Technical MVP vs Public Launch — tách biệt rõ

| | Technical MVP (Giai đoạn 1) | Public Launch |
|---|---|---|
| Mục đích | Kiểm chứng kiến trúc (RoomShell, TurnController, reconnect, tải) | Ra mắt sản phẩm thật cho người dùng |
| Phạm vi | **2048 + Cờ Caro + Rắn Săn Mồi (đơn)** — 3 game | **18 game** (phương án ưu tiên) hoặc **15 game** (dự phòng nếu bị ép tiến độ, mục 8) |
| Game online thật | 1 (Caro) | 5 (Caro, Cờ Tướng, Nối Từ, Cá Ngựa, Đố Vui) ở launch; +3 chế độ online (Rắn Battle, Đặt Bom, Bắn Cung online) sau launch ở GĐ5 |
| Cổng quyết định (gate) | Chỉ sang Giai đoạn 2 khi Caro qua test 2 client, reconnect, gửi trùng (double-submit), và đo tải thật | Mỗi game cần: vòng chơi hoàn chỉnh, điều khiển mobile, retry/save theo mode, đủ nội dung chơi lại, thumbnail/landing thật, license rõ, qua QA — **chưa có code hay mẫu nội dung nào để xác nhận 18 game đã đạt mức này** (Codex) |
| Dùng để | Đo năng suất thật của team trước khi chốt lịch Public Launch | Thu traffic, viral loop, chuyển đổi SpeakUp Kids |

**Điểm mấu chốt (Codex, chưa ai phản bác):** việc đếm đủ 18 "ô" trên trang chủ không đồng nghĩa 18 game đã đạt chất lượng launch. Số người-ngày ở mục 6 là **ước tính code+test**, không phải lịch giao sản phẩm hoàn chỉnh.

---

## 3. Kiến trúc đề xuất và điều kiện cần kiểm chứng

### 3.1. Kiến trúc A sửa đổi (giữ nền tảng V1, 4 thay đổi)

1. **Bỏ "1 GameRoom chung"** → `RoomShell` (auth guest, ghế, mời, reconnect, lưu kết quả, version) + 3 controller: **TurnController** (Caro, Cờ Tướng, Nối Từ, Cá Ngựa, Bắn Cung online), **RoundController** (Đố Vui — mọi người trả lời cùng lúc), **TickController** (Rắn Battle, Đặt Bom online — vòng lặp 15–20 Hz). Mỗi game một room type riêng trên Colyseus.
2. **Tách game server realtime** (TickController) ra process/container riêng — chỉ cần làm khi vào Giai đoạn 5.
3. **Content Service** (Postgres + script nhập liệu): từ điển Nối Từ, ngân hàng câu hỏi Đố Vui (có chủ đề SpeakUp Kids), màn chơi Tìm Điểm/Đào Vàng.
4. **Save Service phía client** (IndexedDB/localStorage có version schema) cho 11 game chơi đơn — không đăng nhập, đúng nguyên tắc zero-friction của Gehihi.
5. **Bot phía server** dùng chung interface `BotPlayer` để thay người rớt mạng (Caro, Cờ Tướng, Nối Từ, Cá Ngựa) — chạy trong worker thread để không chặn event loop.
6. Ngân sách bundle theo game + chunk Phaser dùng chung; Monorepo + Turborepo, CI chỉ test game thay đổi **nhưng phải chạy theo dependency graph** (sửa RoomShell/E1/SDK thì test lại mọi consumer — Codex).

4 engine nội bộ dùng chung (giảm 18 game thành không phải 18 dự án riêng):

| Engine | Dùng chung cho | Game dùng |
|---|---|---|
| E1 — Lưới ô (Grid Core) | Lưới vuông/lục giác, flood-fill, animation, RNG seed, save/undo | 2048, Xếp Gạch, Sudoku, Nối Thú, Ghép Kẹo, Bắn Bóng, bàn Caro/Cờ Tướng |
| E2 — Arcade 2D (Phaser) | Vòng lặp game, va chạm, input, 2P cùng máy | Rắn, Đào Vàng, Bắn Cung, Đặt Bom, Đua Xe, Bắn Bóng |
| E3 — Đố chữ/Hỏi đáp | Đếm giờ, chuẩn hoá tiếng Việt, tra từ điển, chấm điểm, bot | Nối Từ, Đố Vui |
| E4 — Cảnh/Màn chơi | Nạp màn từ JSON+ảnh, hitbox, tiến trình offline | Tìm Điểm Khác Biệt, Nông Trại |

**Codex lưu ý:** 4 engine là *thư viện dùng chung*, không phải điểm lỗi vận hành đơn lẻ — nhưng tạo phạm vi ảnh hưởng rộng khi có lỗi/thay đổi. E1 hiện gộp quá nhiều (lưới vuông+lục giác+gravity+undo+RNG+bàn cờ); E4 gộp Tìm Điểm (puzzle) với Nông Trại (idle economy) — hai thứ khác bản chất. **Cần**: chỉ trích phần thật sự dùng chung ở ≥2 game, dùng composition thay kế thừa lớn, có contract test + smoke test cho mọi consumer khi engine thay đổi.

### 3.2. Vì sao vẫn không cần đổi sang kiến trúc B/C

11/18 game chỉ chơi đơn hoặc 2 người cùng máy → không tốn server, chỉ tốn CDN. 1 VPS (~10–25 USD/tháng) + CDN miễn phí vẫn đủ cho launch. **Mốc phải xem lại kiến trúc là khi game realtime online (Rắn Battle, Đặt Bom) có tải thật, không phải khi số game tăng lên 18.**

> **Codex phát hiện sai lệch số liệu cần sửa:** Dev nói "11/18 không tốn server và 9 game online" — hai số này không khớp cách phân loại thực tế. Đếm đúng ở thời điểm launch: **13 game hoàn toàn local** (9 đơn + Đào Vàng/Bắn Cung 2P cùng máy + Rắn/Đặt Bom chơi đơn/với máy) và **5 game online** (Caro, Cờ Tướng, Nối Từ, Cá Ngựa, Đố Vui). Sau Giai đoạn 5 (thêm 3 chế độ online) thành **8 game có chế độ online**, không phải 9 — và "local" với "online" có thể là cùng một game (không cộng gộp hai nhóm). "Không tốn server" chỉ nói về gameplay — trang HTML, analytics, tải nội dung vẫn có tải server.

### 3.3. Điều kiện kỹ thuật còn phải kiểm chứng trước khi coi kiến trúc đã "chốt" (Codex, mục 3 — **chưa giải quyết**, không phải đã xong)

| Vấn đề | Tình trạng V2 | Còn thiếu |
|---|---|---|
| Serialization state ↔ wire | Thiết kế có nêu, **chưa có schema/adapter/snapshot contract thật** | 1 ví dụ cụ thể cho Caro + 1 cho Đố Vui: actionId/revision, schemaVersion, xử lý client cũ |
| Dữ liệu riêng tư (đáp án, bài kín) | Có nêu nguyên tắc "đáp án chỉ ở server" | Chưa có cơ chế wire cụ thể tách public/internal/private state; chưa test bằng client không có quyền / late-join / reconnect |
| Bảo mật guest | Có guest session ở GĐ0 | Threat model, auth/Origin/quota/seat token (từ review V1) vẫn là acceptance criteria **chưa đóng** |
| Lưu kết quả khi crash | Có idempotent matchId | Retry bền vững, race kết thúc, drain khi deploy, version pin — chưa thiết kế/test |
| Interpolation TickController | Mới có ý tưởng | Cần **spike kỹ thuật đo input latency thật** trước khi cam kết 19–30 người-ngày cho Giai đoạn 5 |

**Quyết định cần chủ dự án:** chấp nhận các điều này là "điều kiện mở" đi kèm kiến trúc (không chặn Technical MVP, nhưng phải đóng trước khi mở rộng multiplayer ở Giai đoạn 3) — xem mục 8.

---

## 4. Roadmap theo giai đoạn

> Người-ngày = 1 lập trình viên quen stack, **chỉ code+test**, chưa gồm đồ hoạ/âm thanh/nội dung/pháp lý. Toàn bộ chưa kiểm chứng, sẽ hiệu chỉnh sau Giai đoạn 1. 🟢 đơn (không server) · 🔵 online (cần RoomShell) · 🟡 2 người cùng máy (không server).

| Giai đoạn | Nội dung | Số game mới | Người-ngày |
|---|---|---|---|
| **0 — Nền móng** | Monorepo, Game SDK/manifest, layout cổng, khung quảng cáo SpeakUp Kids, guest session, CI (lint/test/license/bundle budget) | 0 | 12–18 |
| **1 — Technical MVP** | 2048 🟢, Caro 🔵 (dựng RoomShell+TurnController+mời/phòng/reconnect), Rắn đơn 🟢, ổn định+test tải | 3 | 19–28 |
| **2 — Làn sóng lưới ô** | Tách E1, Xếp Gạch, Sudoku, Nối Thú, Ghép Kẹo, Bắn Bóng (toàn bộ 🟢) | 5 | 22–32 |
| **3 — Đối kháng theo lượt** | Mở rộng RoomShell (2–4 ghế, bot takeover, RoundController), Nối Từ, Đố Vui, Cờ Tướng, Cờ Cá Ngựa (🔵) | 4 | 27–41 |
| **4 — Arcade/vật lý/cảnh** | Đào Vàng, Bắn Cung, Tìm Điểm, Đua Xe, Nông Trại, Đặt Bom vs bot | 6 | 32–46 |
| **Chuẩn bị Public Launch** | Test tải hỗn hợp, LCP/CLS thiết bị thật, SEO 18 landing, trang Giấy phép/Ghi công, chính sách riêng tư, backup/restore | — | 8–12 |
| **→ Public Launch** | **Đủ 18 game** (Rắn/Đặt Bom ở chế độ đơn/với máy, ghi "sắp có đấu online") | | **18 game, ~120–177 người-ngày đến đây** |
| **5 — Sau launch: realtime online** | TickController + tách process + test mạng xấu, Rắn Battle online, Đặt Bom online, Bắn Cung online | +3 chế độ | 19–30 |

### Thay đổi thứ tự theo đề nghị của Codex (chưa được Dev/Gehihi xác nhận lại — cần Mama/chủ dự án quyết)

- **Mở luồng nội dung & quyền sử dụng ngay từ Giai đoạn 0**, không đợi Giai đoạn 3: từ điển, câu hỏi, ảnh Tìm Điểm, concept/thumbnail thay tên thương hiệu, chọn khoá phiên bản thư viện. Đây nằm trên đường găng, không phải phụ việc song song.
- Content Service cần định dạng nhập/validation/versioning/rollback **trước** khi làm Nối Từ/Đố Vui. Save Service cần có trước Sudoku/Ghép Kẹo (không phải chỉ cho Nông Trại).
- Có thể đưa **Đào Vàng** (19/20, chỉ phụ thuộc E2 từ Rắn) lên sớm hơn Giai đoạn 4 nếu muốn ưu tiên điểm sản phẩm cao; Nối Thú giữ ưu tiên sớm như Dev đề xuất. Đố Vui không bắt buộc chờ Nối Từ xong hẳn — dùng chung round timer/content interface.
- RoundController + 4 ghế + bot takeover đang gộp trong 3–4 ngày — Codex đề nghị tách acceptance riêng cho: (a) round giữ kín đáp án, (b) 4 ghế, (c) bot takeover — không coi "room đã xong" khi mới làm 1 phần.
- CI "chỉ test game thay đổi" phải chạy theo dependency graph, không lọc theo folder.

### Sai lệch số học — đã kiểm tra, không có lỗi cộng

Codex đã cộng lại toàn bộ: GĐ1 = 19–28 ✓, GĐ2 = 22–32 ✓, GĐ3 = 27–41 ✓, GĐ4 = 32–46 ✓, tổng GĐ0→Launch = 120–177 ✓. **Không phát hiện lỗi số học** trong bảng của Dev. Vấn đề không nằm ở phép cộng mà ở **những gì chưa được tính**: đồ hoạ/âm thanh, nội dung (từ điển, câu hỏi, màn chơi), pháp lý, refactor engine, vận hành, migration, beta feedback, sửa lỗi liên game — chưa rõ các việc này nằm ở dòng nào hay bị bỏ sót.

**Dự phòng lập kế hoạch (reviewer đề xuất, không phải số đã đo):** +25–35% cho phần code/test → khoảng **150–239 người-ngày**. Vẫn chưa gồm việc phi-lập-trình. Quy đổi 1 lập trình viên full-time 5 ngày/tuần: dải gốc ≈ 24–35,4 tuần — **không quy đổi 3 bot AI (Dev/Gehihi/Codex) thành 3 lập trình viên chạy song song**; cần đo năng suất thật sau Giai đoạn 1.

Nếu rút về 15 game (bỏ Đua Xe, Nông Trại, Đặt Bom — xem mục 8 để biết lý do và tác động kinh doanh): tổng còn **~101–150 người-ngày** (chưa cộng dự phòng).

---

## 5. Chiến lược traffic, SEO, viral loop và chuyển đổi SpeakUp Kids

### 5.1. Thiết kế trang chủ (Gehihi) — nguyên tắc: tuyệt đối không phong cách "SaaS dashboard"
- Bento Grid không đồng nhất (ô 1x1/2x1/2x2), Hero Carousel 3 game tiêu điểm/tuần, Quick Filter Pills (🔥 Hot / 👥 2 người / 🧠 Trí tuệ / ⚡ Chơi ngay), Realtime Lobby Ticker ("Phòng Caro #1042 đang chờ 1 người → Vào ngay").
- Nền xanh đêm sâu (`#0B0E17`), accent neon hồng/tím/vàng (`#FF2E93`/`#7928CA`/`#FFB800`), thumbnail bo góc lớn, hover nâng thẻ + video/GIF ngắn tự phát.
- **Rủi ro kỹ thuật cần kiểm (Codex):** 18 thumbnail 3D + preview video/GIF tự phát + font + Phaser chunk dùng chung có thể làm vỡ ngân sách tải trang chủ. Không tự phát tất cả preview cùng lúc — dùng poster nhẹ, tải khi cần, tôn trọng `reduced-motion`.

### 5.2. Viral loop
- Mã phòng 6 ký tự + nút "Sao chép link gửi Zalo" (chưa kiểm chứng người Việt thích link hay mã — cần A/B test).
- Bảng xếp hạng Top tuần/Top game để giữ chân.
- Bot takeover khi người chơi rớt mạng — **nhưng là quyết định UX/đồng thuận cần phê duyệt riêng** (mục 8), không mặc nhiên coi là đã được người dùng chấp nhận.
- Đo lường thật trước khi tin vào điểm viral của catalog: **invite → join → hoàn tất ván**, theo từng game riêng — không dùng tổng điểm chủ quan của Gehihi làm bằng chứng traffic.

### 5.3. SEO
- Next.js SSG cho 18 trang landing riêng từng game + trang danh mục.
- Mô tả kiểu "game nối thú cổ điển", "game xếp gạch cổ điển" — **không dùng tên thương hiệu (Pikachu, Tetris...) trong tên sản phẩm hay thẻ SEO** (rủi ro pháp lý, mục 7).

### 5.4. Chuyển đổi SpeakUp Kids
- **Top 3 game phù hợp nhất:** Đố Vui Nhanh (chủ đề riêng "Thử tài Tiếng Anh Thiếu Nhi"), Nối Từ (chế độ song ngữ/gợi ý từ vựng), Tìm Điểm Khác Biệt & Bắn Bóng Khủng Long (đồ hoạ linh vật SpeakUp Kids, banner cuối ván tặng bài học thử).
- Phân loại affinity toàn danh mục: **Cao** (Đố Vui, Nối Từ, Tìm Điểm, Bắn Bóng, Nối Thú), **Trung bình** (Caro, Cá Ngựa, Rắn, Đào Vàng, 2048), **Thấp** (Cờ Tướng, Sudoku — tệp người lớn tuổi, chỉ đặt banner kín đáo).
- **Codex cảnh báo quan trọng:** các khẳng định "tỷ lệ chuyển đổi cực cao" trong catalog của Gehihi **chưa có thử nghiệm thật**, không được dùng để duyệt ngân sách marketing. Lời hứa "nhận quà/bài học miễn phí" phải có điều kiện thực tế và nơi nhận rõ ràng; nội dung quiz tài trợ phải ghi nhãn tài trợ, không giả làm nội dung game độc lập. Không tự cấp quyền chia sẻ nickname/room data sang hệ thống SpeakUp Kids — cần chính sách riêng tư rõ ràng trước khi làm điều đó.

---

## 6. Ước tính chi phí và thời gian (giả định nêu rõ)

| Mục | Ước tính | Giả định |
|---|---|---|
| Công lập trình đến Public Launch (18 game) | 120–177 người-ngày (code+test) | 1 lập trình viên quen stack; chưa gồm đồ hoạ/âm thanh/nội dung/pháp lý |
| + Dự phòng lập kế hoạch 25–35% | → ~150–239 người-ngày | Dải quản trị do Codex đề xuất, **chưa phải số đã đo**; vẫn chưa gồm việc phi-code |
| Nếu rút về 15 game | ~101–150 người-ngày (chưa cộng dự phòng) | Bỏ Đua Xe/Nông Trại/Đặt Bom — xem tác động kinh doanh ở mục 8 |
| Thời gian quy đổi 1 FTE, 5 ngày/tuần | ~24–35,4 tuần (dải gốc, chưa dự phòng) | Không quy đổi 3 bot AI thành 3 lập trình viên song song; **chưa có số liệu năng suất thật** — sẽ đo sau Giai đoạn 1 |
| Hạ tầng đến trước Giai đoạn 5 | 1 VPS ~10–25 USD/tháng + CDN miễn phí | Chi phí gần như không đổi khi tăng 6→18 game vì phần lớn game thêm là single-player; **chưa tra lại giá VPS hôm nay** |
| Hạ tầng sau Giai đoạn 5 (realtime online) | +1 VPS ~10–25 USD/tháng (ước tính, chưa đo tải thật) | Cần đo băng thông thật trước khi chốt |
| **Việc KHÔNG nằm trong số người-ngày trên** | Đồ hoạ/âm thanh 18 game, biên tập 3.000–10.000 từ + 500+ câu hỏi, tư vấn pháp lý, QA độc lập, vận hành | **Hiện chưa có ai cam kết nguồn lực mỹ thuật/biên tập/QA riêng** (Codex) — chỉ có Dev (code), Gehihi (UX), Codex (review), Mama (điều phối) |

### Ví dụ minh bạch về quy mô việc biên tập (Codex)
Tự xây 3.000–10.000 từ ghép tiếng Việt cho Nối Từ: nếu kiểm 2 lượt, 1–2 phút/mục → ước tính thô **50–333 giờ = 6,3–41,7 ngày làm việc 8 giờ**, chưa gồm tìm nguồn, khử trùng lặp, chơi thử cân bằng. Đây là mô hình giả định, khuyến nghị thử 200 mục trước để đo tốc độ thật trước khi cam kết lịch cho Giai đoạn 3.

**Kết luận của Codex mà Mama giữ nguyên, không làm nhẹ đi:** *"120–177 người-ngày có thể dùng làm baseline code để đo lại, chưa thực tế như lịch giao toàn bộ sản phẩm."* Khuyến nghị: dùng kết quả đo năng suất thật ở Giai đoạn 1 để tính lại lịch trước khi công bố ngày Public Launch ra ngoài.

---

## 7. Vấn đề pháp lý cần xác minh trước khi phát hành công khai

### 7.1. Thương hiệu / sở hữu trí tuệ — đã tra nguồn công khai (17/11/2026), **chưa phải kết luận pháp lý cho Việt Nam**

| Tên trong catalog gốc | Mức rủi ro | Hành động bắt buộc trước public |
|---|---|---|
| Pikachu/Pokémon | **Cao — chặn** | Không dùng tên/hình; Nối Thú Cổ Điển phải có bộ hình tự vẽ hoàn toàn riêng, tự vẽ lại cùng nhân vật không đủ |
| Tetris | **Cao** | Không chỉ đổi tên — Tetris giữ quyền cả trade dress (thiết kế bàn/mảnh/màu/âm thanh tổng thể). Cần duyệt thiết kế độc lập cho Xếp Gạch Cổ Điển trước khi triển khai |
| Dynomite! (EA) | Trung bình | Đổi tên (đã làm: Bắn Bóng Trứng Khủng Long) + concept độc lập; chủ đề khủng long/trứng vẫn cần hình ảnh khác biệt, không phải mọi bubble-shooter đều vi phạm |
| Hill Climb Racing (Fingersoft) | Trung bình–cao | Đổi tên chưa đủ nếu xe/nhân vật/track/UI vẫn giống; Fingersoft có chính sách kiểm soát IP |
| Bomberman (Konami) | Không rõ cho "Đặt Bom Tốc Độ" cụ thể | Franchise Bomberman có thật, nhưng chưa có chứng cứ Đặt Bom vi phạm; vẫn cần tránh nhân vật/trang phục/maze/âm thanh giống |
| Bow Master / Bowmen / Bowmasters (Miniclip) | Chưa rõ | Bowmasters là sản phẩm thật của Miniclip — tên gần, cần sàng lọc thêm; tránh art/bạo lực giống cả hai |
| **Bổ sung — chưa được rà soát trong danh sách "6 tên" của Dev** | | **Gold Miner** (tên phụ của Đào Vàng), **Snake Battle**, **Ludo Fun**, **Mini Garden**, **2048 Siêu Cấp**, và **tên portal** — tên phổ thông không đồng nghĩa an toàn cho logo/domain/sản phẩm, cần hồ sơ nguồn riêng |

**Nguyên tắc chung bắt buộc:** đổi hết tên công khai sang tên thuần Việt (đã có trong catalog), toàn bộ đồ hoạ/âm thanh tự vẽ hoặc có nguồn rõ ràng, không sao chép giao diện đặc trưng của sản phẩm gốc.

### 7.2. Từ điển / nội dung Nối Từ
- 2 nguồn mở tra được (`duyet/vietnamese-wordlist`, `undertheseanlp/dictionary`) đều tuyên bố **GPL** — xác nhận đúng 2 repo này, **không suy rộng ra "mọi từ điển tiếng Việt đều GPL"**. GPL không cấm dùng thương mại nhưng có nghĩa vụ khi phân phối; "chỉ dùng phía server" không tự động miễn trừ.
- **Quyết định đề xuất:** tự xây danh sách từ ghép riêng (xem ước tính 6,3–41,7 ngày ở mục 6), có nhật ký nguồn, tiêu chí tuyển từ, người duyệt thật — nguồn GPL chỉ dùng đối chiếu nội bộ sau khi có ý kiến pháp lý, không sao/đổi thứ tự trực tiếp từ danh sách GPL.

### 7.3. Quy định Việt Nam (carry-over từ V1 — vẫn chưa giải quyết)
- **Nghị định 147/2024** (quản lý game online) — 5 game online ở launch (Caro, Cờ Tướng, Nối Từ, Cá Ngựa, Đố Vui) làm rủi ro này rõ hơn, có thể cần giấy phép trước khi mở online công khai.
- **Nghị định 13/2023** (bảo vệ dữ liệu trẻ em) — portal có game hướng trẻ em (SpeakUp Kids affinity cao) và danh tính guest; "không yêu cầu email" không đồng nghĩa miễn nghĩa vụ.
- Cần người chịu trách nhiệm xác minh hiện trạng quy định trước khi mở phần online công khai cho người dùng thật.

### 7.4. Nội dung và vận hành khác
- 500+ câu hỏi Đố Vui + ảnh Tìm Điểm + font + giọng AI: "tự vẽ/AI" không tự chứng minh quyền sử dụng hay originality — cần hồ sơ nguồn và quy trình sửa/gỡ khi có khiếu nại.
- Quảng cáo/quà SpeakUp Kids: lời hứa quà phải có điều kiện thực tế, nhãn tài trợ rõ ràng.
- Trẻ em/định danh/kiểm duyệt: moderation nickname và nội dung Nối Từ, cơ chế report/mute thật, không chỉ bộ lọc từ.
- Bot takeover: cần chính sách đồng thuận — không tự thay đối thủ bằng bot vô hình mà không thông báo.

---

## 8. Danh sách quyết định cần chủ dự án phê duyệt

Mama **không tự quyết** bất kỳ điểm nào dưới đây — trình để chủ dự án xem xét:

1. **Phạm vi Public Launch:** giữ 18 game (ưu tiên của team) hay chấp nhận phương án dự phòng 15 game (bỏ Đua Xe Vượt Đồi, Nông Trại Trồng Rau, Đặt Bom vs bot — tiết kiệm ~19–27 người-ngày code, tổng còn ~101–150)? **Lưu ý:** đây chỉ nên là lựa chọn nếu buộc phải rút ngắn tiến độ sau khi đo năng suất thật ở Giai đoạn 1 — không áp dụng ngay bây giờ.
2. **Chế độ online cho Rắn Săn Mồi và Đặt Bom:** chấp nhận ra mắt ở chế độ đơn/với máy trước, online thật dời sang Giai đoạn 5 sau launch (như roadmap đề xuất) — hay yêu cầu có online ngay từ launch (thêm 19–30 người-ngày + cần đo tải thật sớm hơn)?
3. **Ngân sách thời gian để lập kế hoạch:** dùng dải nào làm cơ sở — 120–177 người-ngày (baseline code thô) hay 150–239 (có dự phòng 25–35%)? Cả hai **đều chưa gồm** đồ hoạ/âm thanh/nội dung/pháp lý/QA.
4. **Nguồn lực mỹ thuật/biên tập/QA:** hiện chỉ có Dev (code) + Gehihi (UX) + Codex (review) + Mama (điều phối) — không có ai cam kết làm đồ hoạ 18 game, biên tập từ điển/câu hỏi, hay QA độc lập. Có bổ sung nguồn lực này, hay chấp nhận launch chậm hơn/mỏng hơn?
5. **Tên công khai và xử lý rủi ro thương hiệu (mục 7.1):** phê duyệt việc đổi toàn bộ tên/đồ hoạ sang bản thuần Việt tự thiết kế trước khi làm asset thật — đặc biệt cần duyệt thiết kế độc lập cho Xếp Gạch Cổ Điển (rủi ro Tetris cao nhất).
6. **Chiến lược nội dung Nối Từ/Đố Vui:** phê duyệt việc tự xây từ điển/ngân hàng câu hỏi riêng (không dùng trực tiếp nguồn GPL), với ước tính 6,3–41,7 ngày biên tập (ngoài số người-ngày code) và cần người biên tập thật.
7. **Tư vấn pháp lý trước khi mở online công khai:** có chủ động xin ý kiến pháp lý về Nghị định 147/2024 (giấy phép game online), Nghị định 13/2023 (dữ liệu trẻ em), và rủi ro thương hiệu Tetris/Pokémon trước khi launch 5 game online không?
8. **Mốc đo năng suất:** đồng ý dùng kết quả thực tế của Giai đoạn 1 (Technical MVP) để hiệu chỉnh lại toàn bộ lịch trước khi công bố ngày Public Launch chính thức ra bên ngoài?
9. **Chính sách bot takeover:** phê duyệt cơ chế bot tự động thay người chơi rớt mạng trong game online — có cần thông báo/đồng thuận hiển thị cho người chơi còn lại không, và kết quả có bot có tách khỏi thống kê đối đầu người thật không?
10. **Cam kết quảng cáo/quà SpeakUp Kids:** phê duyệt chính sách — mọi lời hứa quà/bài học thử phải có điều kiện thực tế và nhãn tài trợ rõ, không dùng số liệu "tỷ lệ chuyển đổi cao" chưa kiểm chứng để duyệt ngân sách marketing.

---

*Tài liệu tổng hợp từ sản phẩm bàn giao thật của Gehihi, Dev, Codex — đã đọc toàn văn cả ba file nguồn, không chỉ dựa vào báo cáo tóm tắt. Không mục nào trong tài liệu này được Mama tự phê duyệt.*
