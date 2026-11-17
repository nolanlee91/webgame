# Webgame Portal — Kế hoạch thống nhất (Product Discovery, Architecture & MVP)

Tác giả: Mama (Product Manager / Chief) · Ngày: 17/11/2026 · Trạng thái: **ĐỀ XUẤT — chờ chủ dự án phê duyệt**

Tổng hợp từ 3 tài liệu gốc (giữ nguyên, không sửa):
- [`docs/ux-ui-spec.md`](./ux-ui-spec.md) — Gehihi (UX/UI research)
- [`docs/tech-architecture.md`](./tech-architecture.md) — Dev (kiến trúc & MVP ban đầu)
- [`docs/architecture-review.md`](./architecture-review.md) — Codex (review độc lập)

Tài liệu này **chỉ là kế hoạch**, chưa có code, chưa cài đặt, chưa deploy, chưa dùng dịch vụ trả phí.

---

## 1. Kiến trúc đề xuất

### Phương án A — Next.js + Colyseus (Node.js) + PostgreSQL/Redis trên 1 VPS ⭐ Đề xuất

| | |
|---|---|
| Thành phần | Next.js (SSG/ISR, SEO) · Colyseus (MIT, realtime room/matchmaking) · PostgreSQL + Redis · 1 VPS Singapore + Cloudflare free (CDN/DNS) |
| Ưu điểm | SEO mạnh (HTML tĩnh), 100% mã nguồn mở không khoá nhà cung cấp, 1 ngôn ngữ TypeScript toàn hệ thống, Colyseus giải sẵn phần khó (room, state sync, reconnect), chi phí cố định thấp (~150–400k VNĐ/tháng) |
| Nhược điểm | 1 VPS = điểm lỗi đơn ở giai đoạn đầu (ngắt trận khi process/máy lỗi); tự vận hành (bảo mật, backup, giám sát); cần cấu hình cache rõ ràng để tách nội dung công khai (cache được) khỏi API/session/phòng (không cache) |
| Điều kiện trước khi chốt (Codex) | Khoá phiên bản framework/Colyseus; làm thử 1 phòng Caro 2 client với reconnect thật; xác định state adapter + lọc dữ liệu riêng từng người (`StateView`) + xác thực guest; có kế hoạch backup/restore và đo tải trước khi công bố ngưỡng CCU |

### Phương án B — Cloudflare Pages + Workers + Durable Objects

| | |
|---|---|
| Thành phần | Astro/Next.js trên Cloudflare Pages · Workers (Hono) · Durable Objects cho từng phòng · D1/KV hoặc Postgres ngoài |
| Ưu điểm | Không quản lý server, tự scale, chi phí khởi điểm rất thấp, gần người dùng (edge) |
| Nhược điểm | Khoá vào Cloudflare (khó chuyển đi); không có framework room hoàn chỉnh như Colyseus → phải tự viết state sync/reconnect/matchmaking (nhiều việc hơn cho MVP); môi trường Workers giới hạn CPU/memory; chi phí theo usage khó dự báo khi tăng trưởng |

**Phương án C (Nakama)** được Dev đề xuất nhưng không khuyến nghị cho MVP — quá nhiều tính năng (social/leaderboard) vượt nhu cầu, đường cong học tập cao, tùy biến sâu khó khăn. Phù hợp hơn ở giai đoạn sau khi ranking/social là trọng tâm.

**Khuyến nghị:** chọn **Phương án A**, đi kèm đầy đủ các điều kiện kỹ thuật mà Codex nêu (xem mục 4 và `architecture-review.md` §1–§3) trước khi bắt đầu code nền móng.

---

## 2. Kiến trúc modular (áp dụng cho A)

- Mỗi game là 1 package độc lập: `manifest` (metadata + SEO) + `client module` (lazy-load) + `logic` thuần (dùng chung client/server) — core (lobby/phòng/mời bạn/matchmaking/quảng cáo) không biết luật từng game.
- **Bổ sung theo Codex trước khi code:** tách metadata khỏi loader client/server (không để registry kéo React/Phaser vào server); định nghĩa schema/serialization cụ thể cho state thay vì `unknown` tùy ý; SDK cần khai báo capability (turn-based / drawing / spectator / private-state) và lifecycle huỷ (listener/timer/socket).
- Game bên thứ ba (nếu dùng) chạy qua iframe sandbox origin riêng, không đồng thời cấp `allow-scripts` + `allow-same-origin`; MVP ưu tiên chỉ chạy game tự viết, hoãn game bên thứ ba.

## 3. Game mã nguồn mở & license

Giữ nguyên đánh giá của Dev (`tech-architecture.md` §4): ưu tiên MIT/BSD/Apache-2.0/ISC cho code, CC0/CC-BY cho asset; tránh GPL/AGPL/CC-BY-NC. Game MVP luật đơn giản → tự viết logic là nhanh và sạch license nhất; chỉ dùng nguyên 2048 (MIT). **Cần xác minh lại license thực tế tại thời điểm triển khai** (chưa tra cứu trên web ở bước này).

---

## 4. MVP · Phase 2 · Dài hạn

Dev đề xuất 6 game; Codex (dựa trên rủi ro serialization, private-state, reconnect, chống gian lận, năng lực kiểm thử) đề nghị thu hẹp MVP xuống 3 game theo 3 mốc rõ tiêu chí qua mốc. Mama khuyến nghị theo hướng **thu hẹp của Codex** để giảm rủi ro ra mắt, và đưa phần còn lại của Dev vào Phase 2 / dài hạn — nhưng đây là một quyết định cần chủ dự án chốt (xem mục 7).

### MVP (đề xuất) — 3 mốc

| Mốc | Phạm vi | Tiêu chí qua mốc |
|---|---|---|
| **1. 2048 + portal** | Trang chủ/danh mục/landing SEO, lazy-load, điều khiển mobile, restart/mute, điểm lưu local | Chạy ổn trên thiết bị thật; 1 thẻ SpeakUp Kids có nhãn quảng cáo rõ ràng; chưa PWA/animated preview/đăng nhập mạng xã hội |
| **2. Cờ Caro end-to-end** | Bàn 15×15, luật 5-liên-tiếp đã chốt rõ; 2 guest tạo/vào phòng, copy link/mã PIN, ready/start, danh sách phòng công khai đơn giản; kết quả tính từ server; reconnect + chống spam | Test thật 2 client + reconnect; chưa AI/spectator/chat tự do/ranking |
| **3. Rắn Săn Mồi + ổn định hệ thống** | Kiểm chứng SDK game thứ 2 (single-player), touch/viewport, hiệu năng 60fps máy yếu; banner end-game nếu không cản chơi lại | Chỉ nghiệm thu sau test thiết bị thật + load test cơ bản |

**MVP tối thiểu nếu cần cắt thêm:** chỉ 2048 + Caro (bỏ Rắn khỏi MVP, dời sang Phase 2).

### Phase 2 (sau khi MVP ổn định, có số liệu thật)

- **Cờ Tướng** (multiplayer) — cần test sâu luật chiếu/bí/hòa/đồng hồ trước khi coi là "tái dùng 100% hệ thống phòng".
- Đấu xếp hạng / Elo rating (dữ liệu trận đã lưu từ MVP, chỉ cần thêm job tính rating).
- Đăng nhập nâng cấp (Google, sau đó Zalo/Facebook).
- Quick-match riêng, spectator, trang hồ sơ & lịch sử đầy đủ.
- PWA (chơi offline/mạng chập chờn), animated preview khi hover.
- Mở rộng thêm game single-player mới (tận dụng Game SDK đã ổn định).

### Dài hạn (cần điều kiện tiên quyết riêng trước khi lên kế hoạch kỹ)

- **Vẽ & Đoán** — cần thiết kế riêng "drawing protocol" (batch stroke, backpressure, giấu đáp án) + phương án kiểm duyệt nội dung (lọc từ ngữ tiếng Việt, báo cáo/moderation) trước khi đưa vào roadmap kỹ thuật.
- **Tiến Lên Miền Nam** — Dev đã tự gắn cờ rủi ro hình ảnh (gần cờ bạc) lệch với thương hiệu SpeakUp Kids; **cần chủ dự án + (khuyến nghị) tư vấn pháp lý xác nhận trước** khi đưa vào roadmap kỹ thuật, không chỉ vì lý do kỹ thuật.
- Giải đấu / tournament, hệ thống bạn bè đầy đủ, huy hiệu/vinh danh.
- Mạng quảng cáo bên thứ ba (nếu sau này không chỉ dùng house ads nội bộ cho SpeakUp Kids) — kéo theo yêu cầu cookie consent, ảnh hưởng hiệu năng, cần đánh giá lại.

---

## 5. KPI đề xuất

*(Chưa có công cụ đo lường nào được cài — đây là đề xuất chỉ số cần theo dõi khi có traffic thật; dùng Umami/Plausible tự host hoặc GA4 miễn phí như Dev đã đề xuất, qua UTM.)*

**Traffic**
- Sessions/ngày, Unique visitors/ngày.
- % traffic từ organic search (đo hiệu quả SEO landing từng game).
- Bounce rate trang chủ & trang chơi; thời gian tải trang (LCP) trên 4G.

**Retention**
- D1 / D7 / D30 retention (người chơi quay lại).
- Số trận chơi trung bình / người dùng / ngày.
- Tỷ lệ session có tạo phòng hoặc vào phòng công khai (đo mức độ "viral loop" mời bạn hoạt động).
- Tỷ lệ link mời được click → vào phòng thành công.

**Chuyển đổi sang SpeakUp Kids**
- CTR riêng cho từng vị trí ads (Bento card trang chủ / End-game banner / Sticky bar) — để biết vị trí nào hiệu quả nhất.
- Số click/1.000 session tới SpeakUp Kids.
- (Khi SpeakUp Kids có thể track) tỷ lệ click → đăng ký/trial, qua UTM riêng cho từng vị trí.

---

## 6. Giả định chưa được kiểm chứng (tổng hợp)

### Pháp lý & kinh doanh
1. **Rủi ro lớn nhất:** game multiplayer qua server có thể cần xin phép theo Nghị định 147/2024/NĐ-CP (trò chơi điện tử trên mạng) — Dev tự nêu, **chưa xác minh chi tiết**. Dữ liệu trẻ em chịu Nghị định 13/2023/NĐ-CP. → **Cần tư vấn pháp lý trước khi mở multiplayer công khai**, đặc biệt trước khi xem xét Tiến Lên Miền Nam.
2. Mô hình quảng cáo SpeakUp Kids giả định là "house ad" nội bộ, chưa dùng mạng quảng cáo bên thứ ba (Google AdSense...).
3. Ngân sách hạ tầng ~10–25 USD/tháng (~250–650k VNĐ) cho MVP được giả định là chấp nhận được; chưa xác nhận với chủ dự án.
4. Chưa có tên miền riêng.
5. Đối tượng chơi game có trùng lặp đáng kể với phụ huynh/học sinh học tiếng Anh — tỷ lệ chuyển đổi CTR thực tế chưa đo được, có thể thấp nếu không gắn phần thưởng gameplay cụ thể.

### Kỹ thuật & hạ tầng
6. Giai đoạn đầu < 500 CCU, < 50.000 lượt truy cập/ngày — chưa có load test xác nhận; Codex đề nghị không lấy số CCU làm mốc cố định mà đo trực tiếp (event-loop lag, RAM/room, p95/p99 join & move ack...).
7. Giá VPS/Cloudflare, license từng thư viện — viết theo hiểu biết hiện có, **chưa tra cứu lại giá/license thực tế** (cần làm trước khi đăng ký/mua bất kỳ dịch vụ nào — và việc đăng ký vẫn cần chủ dự án duyệt).
8. Độ trễ VPS Singapore → Việt Nam ~30–50ms — chưa đo trên mạng di động thật (Viettel/VNPT/FPT), chưa tính RTT cao/jitter/mất gói.
9. `GameLogic`/`viewFor` hiện là interface, chưa có cơ chế serialization & lọc dữ liệu riêng từng người (StateView) được xác nhận hoạt động đúng theo phiên bản Colyseus thực tế.
10. Reconnect khi mất mạng ngắn khác với khôi phục khi process/VPS chết — MVP cần quyết định rõ: trận bị hủy khi crash thay vì giả định tự phục hồi.
11. Team hiện là bot AI + review, có quyền dùng Docker trên máy để dev local — cần xác nhận khi bắt đầu giai đoạn code.

### UX & hành vi người dùng
12. Đa số người dùng trên thiết bị di động tầm trung, mạng 4G — dung lượng game nhúng cần < 10MB để tránh bounce rate cao (chưa đo thực tế).
13. In-app browser Zalo/Facebook Messenger có thể chặn Fullscreen API, autoplay audio, một số storage/WebRTC — cần kiểm chứng và có fallback mở Chrome/Safari.
14. Thiết bị chính là Android tầm trung, trình duyệt Chrome — chưa có analytics thực tế để xác nhận.

---

## 7. Quyết định cần chủ dự án phê duyệt

1. **Chốt kiến trúc:** Phương án A (Next.js + Colyseus + Postgres/Redis trên 1 VPS), kèm các điều kiện kỹ thuật của Codex trước khi code nền móng (khoá phiên bản, thử reconnect thật, xác nhận StateView, kế hoạch backup).
2. **Chốt phạm vi MVP:** theo hướng thu hẹp 3 game (2048 + Caro + Rắn, theo 3 mốc) như Codex đề nghị, **hay** theo danh sách rộng hơn ban đầu của Dev (tối thiểu Caro + 2048 + Rắn + Cờ Tướng)? Mama khuyến nghị bắt đầu từ phạm vi hẹp của Codex.
3. **Vẽ & Đoán và Tiến Lên Miền Nam:** đồng ý đưa vào "Dài hạn" (chưa lên kế hoạch kỹ) chứ không phải Phase 2 gần, cho đến khi có phương án kiểm duyệt nội dung (Vẽ & Đoán) và xác nhận pháp lý/hình ảnh thương hiệu (Tiến Lên)?
4. **Tư vấn pháp lý:** có cần thuê/tham vấn pháp lý về Nghị định 147/2024 (giấy phép trò chơi điện tử) và Nghị định 13/2023 (dữ liệu trẻ em) trước khi mở multiplayer công khai? Đây là rủi ro lớn nhất ngoài kỹ thuật.
5. **Ngân sách hạ tầng:** xác nhận mức chấp nhận được (~10–25 USD/tháng cho MVP) và kế hoạch mua domain — hay bắt buộc 0 đồng (free tier) ở giai đoạn này?
6. **Mô hình quảng cáo SpeakUp Kids:** house ad nội bộ (như đề xuất) hay có kế hoạch dùng mạng quảng cáo bên thứ ba sau này?
7. **KPI ở mục 5:** xác nhận các chỉ số theo dõi và công cụ đo (Umami/Plausible tự host hay GA4) có phù hợp không.

Sau khi có quyết định ở trên, Mama sẽ giao Dev bắt đầu nền móng (monorepo + Game SDK) theo đúng các điều kiện đã duyệt — **chưa bắt đầu code cho tới khi có phê duyệt.**
