# Webgame Portal — Kiến trúc kỹ thuật V2: Roadmap cho danh mục 18 game

> Tác giả: Dev (Technical Lead / Developer) · Ngày: 2026-11-17 · Trạng thái: **ĐỀ XUẤT — chủ dự án CHƯA phê duyệt**
> Đầu vào: `docs/game-catalog-v2.md` (Gehihi, 18 game), `docs/tech-architecture.md` (v1 của Dev), `docs/architecture-review.md` (Codex), `docs/plan.md`.
> Tài liệu này **mở rộng** v1 và tiếp thu review của Codex; không nhắc lại phần đã có (so sánh A/B/C, SEO, Game SDK cơ bản).
> Chưa code, chưa cài đặt, chưa dùng dịch vụ trả phí. Mọi thời gian (người-ngày) là **ước tính chưa kiểm chứng**.

---

## 0. Kết luận nhanh

| Câu hỏi | Trả lời |
|---|---|
| Kiến trúc A còn phù hợp ở 18 game? | **Có, với 4 thay đổi**: (1) bỏ "1 GameRoom chung", thay bằng **RoomShell + 3 loại controller** (lượt / vòng hỏi-đáp / realtime theo tick), mỗi game đăng ký room type riêng; (2) tách **game server realtime** thành process/container riêng khi có game realtime online; (3) thêm **Content Service** (từ điển tiếng Việt, ngân hàng câu hỏi, màn chơi) và **Save Service** cho single-player; (4) **4 engine nội bộ dùng chung** (Lưới ô, Arcade 2D, Đố chữ/Hỏi đáp, Cảnh/Màn chơi) để 18 game không phải là 18 dự án riêng |
| Vì sao vẫn ổn | 11/18 game chỉ chơi đơn hoặc chơi 2 người trên cùng máy → **không tốn tài nguyên server**, chỉ tốn CDN. Tải server chỉ đến từ 9 game online, trong đó chỉ 2 game là realtime thật (Rắn Battle, Đặt Bom) |
| Roadmap | Giai đoạn 0 nền móng → 1 Technical MVP (2048, Caro, Rắn đơn) → 2 làn sóng game lưới ô (5 game đơn) → 3 làn sóng đối kháng theo lượt (4 game online) → 4 arcade/vật lý + Đặt Bom chơi với máy (6 game) → **Public Launch 18 game** (Rắn và Đặt Bom chưa có online) → 5 sau launch: Rắn Battle và Đặt Bom online realtime |
| Ước tính đến Public Launch | **~120–177 người-ngày** công lập trình (chưa gồm làm đồ họa/âm thanh, nội dung câu hỏi, tư vấn pháp lý) — chưa kiểm chứng |
| License | Đã tra trực tiếp trên GitHub/npm hôm nay cho 17 thư viện/repo (bảng mục 2). **Cảnh báo lớn**: các danh sách từ tiếng Việt mã nguồn mở tìm được đều là **GPL** → nên tự xây từ điển; một số **tên game trong danh mục là thương hiệu của người khác** (Pikachu, Tetris, Dynomite, Hill Climb Racing, Bomberman/Bowmen) → phải đổi tên và tự vẽ |

---

## 1. Phân loại kỹ thuật 18 game

### 1.1. Bốn engine nội bộ dùng chung (nền của nhóm b)

| Engine | Nội dung dùng chung | Game dùng |
|---|---|---|
| **E1 — Lưới ô (Grid Core)** | Mô hình lưới (vuông + lục giác), tọa độ, thao tác vuốt/chạm ô, phát hiện cụm (flood-fill), trọng lực rơi ô, animation hợp nhất/nổ, RNG có seed, lưu/khôi phục ván, undo | 2048, Xếp Gạch, Sudoku, Nối Thú, Ghép Kẹo, Bắn Bóng, (bàn cờ của Caro, Cờ Tướng) |
| **E2 — Arcade 2D (trên Phaser, MIT)** | Vòng lặp game, va chạm, input bàn phím/cảm ứng/joystick ảo, camera, âm thanh, chế độ 2 người cùng máy, màn chơi theo cấp | Rắn, Đào Vàng, Bắn Cung, Đặt Bom, Đua Xe (+ thư viện vật lý), Bắn Bóng (phần bắn) |
| **E3 — Đố chữ / Hỏi đáp** | Bộ đếm giờ mỗi lượt, chuẩn hóa tiếng Việt (dấu, hoa thường, khoảng trắng), tra từ điển, ngân hàng câu hỏi, chấm điểm theo thời gian, bot trả lời | Nối Từ, Đố Vui |
| **E4 — Cảnh / Màn chơi** | Nạp màn chơi từ JSON + ảnh, vùng chạm (hitbox), tiến trình, lưu offline, thời gian thực tế trôi qua (idle) | Tìm Điểm Khác Biệt, Nông Trại |

Phía server: **E5 — RoomShell** (ghế, auth guest, mời, phòng công khai, reconnect, lưu kết quả) + controller lượt / vòng / realtime (xem mục 3).

### 1.2. Bảng phân loại

Nhóm: **(a)** tự viết từ đầu trên Game SDK (thường là game "gốc" dựng nên một engine) · **(b)** tái sử dụng/mở rộng engine nội bộ · **(c)** tích hợp/chuyển thể mã nguồn mở có sẵn.
Lưu ý: Phaser, Colyseus, Next.js là **nền tảng chung**, không tính là (c) cho từng game.

| # | Game (tên trong catalog) | Chế độ kỹ thuật | Nhóm | Engine | Lý do |
|---|---|---|---|---|---|
| 1 | Cờ Caro | Online 1v1 + bot | **(a)** | E1 + E5 lượt | Game gốc dựng RoomShell và controller lượt. Luật đơn giản, tự viết sạch license; nên làm sớm để kiểm chứng hệ thống phòng |
| 2 | Rắn Săn Mồi | Đơn (launch) → online realtime nhiều người (sau launch) | **(a)** | E2 | Game gốc của engine Arcade 2D. Bản online là game gốc của controller realtime — tách thành mục riêng trong roadmap vì công sức gấp đôi |
| 3 | Pikachu / Nối Thú | Đơn | **(b)** | E1 | Lưới ô + tìm đường ≤ 3 đoạn (BFS) tự viết. **Không dùng tên/hình Pikachu/Pokémon** |
| 4 | Đào Vàng | Đơn + 2 người cùng máy | **(a)** | E2 | Cơ chế móc gắp riêng biệt, không có engine trước. Chế độ "2P co-op" trong catalog là **chung bàn phím → không cần server** |
| 5 | Nối Từ Tiếng Việt | Online 1v1 + bot | **(a)** | E3 + E5 lượt | Game gốc của engine Đố chữ. Phần khó nhất là **từ điển từ ghép tiếng Việt** (license, xem 2.3), không phải code |
| 6 | Bắn Bóng (catalog: "Dynomite Pop") | Đơn | **(c)** | E1 (lưới lục giác) + E2 | Tham khảo/chuyển thể `rembound/Bubble-Shooter-HTML5` (MIT, đã tra). **Không dùng tên "Dynomite"** |
| 7 | Cờ Tướng | Online 1v1 + bot | **(b)** + thư viện (c) | E1 + E5 lượt | Dùng lại phòng và đồng hồ của Caro. Sinh nước đi có thể dùng `lengyanyu258/xiangqi.js` (BSD-2, đã tra) hoặc tự viết. Bot: tự viết alpha-beta đơn giản, **tránh Fairy-Stockfish (GPL-3)** |
| 8 | Đố Vui Nhanh | Đơn + online nhiều người | **(b)** | E3 + E5 vòng | Dùng lại bộ đếm giờ và chấm điểm của Nối Từ. Công sức chính là **nội dung câu hỏi** (tự soạn, có chủ đề SpeakUp Kids) |
| 9 | 2048 | Đơn | **(c)** | E1 | Chuyển thể `gabrielecirulli/2048` (MIT, đã tra), viết lại giao diện theo design system, giữ ghi công |
| 10 | Cờ Cá Ngựa | Online 2–4 người + bot | **(b)** | E5 lượt (mở rộng 4 ghế) | Luật đơn giản, nhưng cần phòng 4 ghế, xúc xắc RNG phía server, bot thay người thoát giữa chừng |
| 11 | Đặt Bom (catalog: "Bomb Arena") | Chơi với máy (launch) → online 2–4 realtime (sau launch) | **(b)** | E2 + bản đồ ô E1 | Dùng lại engine Arcade của Rắn + bản đồ lưới. Bản online dùng lại controller realtime của Rắn Battle. **Tự vẽ, tránh giống Bomberman (Konami)** |
| 12 | Bắn Cung (catalog: "Bow Master", giống Bowmen) | Đơn + 2 người cùng máy; online theo lượt (sau launch) | **(a)** | E2 | Quỹ đạo đạn + gió tự viết (vật lý đơn giản, không cần thư viện). Vì là **theo lượt**, bản online dùng được controller lượt có sẵn |
| 13 | Xếp Gạch (catalog: "Tetris") | Đơn | **(b)** | E1 | Lưới + trọng lực + xóa hàng. **"Tetris" là thương hiệu đã đăng ký** → đặt tên khác, tránh sao chép giao diện đặc trưng |
| 14 | Tìm Điểm Khác Biệt | Đơn | **(a)** | E4 | Engine đơn giản (ảnh + vùng chạm) nhưng là game gốc của E4. Chi phí chính là **vẽ cặp ảnh** cho từng màn |
| 15 | Đua Xe Vượt Đồi (catalog: "Hill Climb Racer") | Đơn | **(c)** | E2 + vật lý | Dùng thư viện vật lý `piqnt/planck.js` hoặc `liabru/matter-js` (đều MIT, đã tra). **"Hill Climb Racing" là thương hiệu của người khác** → đổi tên |
| 16 | Nông Trại Trồng Rau | Đơn (idle) | **(a)** | E4 | Logic idle + lưu tiến trình offline. Không có engine trước |
| 17 | Ghép Kẹo (Match-3) | Đơn | **(c)** | E1 | Tham khảo/chuyển thể `rembound/Match-3-Game-HTML5` (MIT, đã tra) trên E1. Tự vẽ, tránh giống Candy Crush |
| 18 | Sudoku | Đơn | **(b)** + thư viện (c) | E1 | Lưới E1 + bộ sinh/giải đề `robatron/sudoku.js` (MIT, đã tra) hoặc tự viết (thuật toán phổ biến) |

**Tổng**: (a) 7 game · (b) 7 game · (c) 4 game. Nếu tính cả thư viện phụ trợ, có 6 game dùng mã nguồn mở bên ngoài (6, 7, 9, 15, 17, 18).

**Tách theo chế độ (quan trọng cho roadmap)**

| Loại | Game | Tốn server? |
|---|---|---|
| Chỉ chơi đơn | Nối Thú, Bắn Bóng, 2048, Xếp Gạch, Tìm Điểm, Đua Xe, Nông Trại, Ghép Kẹo, Sudoku | Không (chỉ CDN) |
| Đơn + 2 người **cùng máy** | Đào Vàng, Bắn Cung (bản launch) | Không |
| Đơn trước, **online realtime** sau launch | Rắn, Đặt Bom | Có, nhiều nhất |
| **Online theo lượt** | Caro, Cờ Tướng, Nối Từ, Cờ Cá Ngựa (+ Bắn Cung online sau launch) | Ít |
| **Online theo vòng** (nhiều người cùng trả lời) | Đố Vui | Ít–vừa |

---

## 2. Kiểm tra giấy phép

### 2.1. Đã kiểm chứng (tra trực tiếp ngày 17/11/2026)

Cách kiểm: gọi GitHub API `repos/<owner>/<repo>/license` (trường SPDX do GitHub nhận diện từ file LICENSE) và npm registry. **Phạm vi**: chỉ xác nhận license khai báo ở repo/npm hôm nay; **chưa** kiểm tra từng file con, asset đi kèm hay phiên bản cụ thể sẽ dùng → vẫn phải đọc lại file LICENSE và khóa phiên bản khi tích hợp.

| Thư viện / repo | License (đã tra) | Dùng cho | Ghi chú |
|---|---|---|---|
| `gabrielecirulli/2048` | MIT ✅ | 2048 | Giữ thông báo bản quyền |
| `rembound/Bubble-Shooter-HTML5` | MIT ✅ | Bắn Bóng (tham khảo/chuyển thể) | Kiểm tra lại asset ảnh trong repo khi dùng |
| `rembound/Match-3-Game-HTML5` | MIT ✅ | Ghép Kẹo (tham khảo/chuyển thể) | Như trên |
| `robatron/sudoku.js` | MIT ✅ | Sudoku (sinh/giải đề) | |
| `lengyanyu258/xiangqi.js` | BSD-2-Clause ✅ | Cờ Tướng (sinh nước đi/luật) | Cần test kỹ đúng luật Cờ Tướng VN (lộ mặt tướng, chiếu dai) |
| `piqnt/planck.js` | MIT ✅ | Đua Xe (vật lý) | Repo `shakiba/planck.js` cũ đã chuyển về đây |
| `liabru/matter-js` | MIT ✅ | Đua Xe (phương án thay thế) | |
| `phaser` (npm, bản mới nhất 4.2.1) | MIT ✅ | Engine Arcade 2D (E2) | Phaser 4 là bản lớn mới — cần đánh giá độ ổn định so với Phaser 3 trước khi chọn |
| `colyseus` (npm, bản mới nhất 0.18.12) | MIT ✅ | Game server | **Review của Codex dẫn tài liệu 0.16; bản npm hiện là 0.18** → phải khóa phiên bản và đọc tài liệu đúng bản |
| `goldfire/howler.js` | MIT ✅ | Âm thanh | |
| `pixijs/pixijs` | MIT ✅ | (thay thế render nếu không dùng Phaser) | |
| `excaliburjs/Excalibur` | BSD-2-Clause ✅ | (thay thế engine) | |
| `boardgameio/boardgame.io` | MIT ✅ | Tham khảo mô hình turn-based | |
| `jhlywa/chess.js` | BSD-2-Clause ✅ | Tham khảo (Cờ Vua sau này) | |
| `fairy-stockfish/Fairy-Stockfish` | **GPL-3.0** ⚠️ | (AI Cờ Tướng mạnh) | **Không dùng trong MVP/launch** |
| `duyet/vietnamese-wordlist` | **GPL-2.0** ⚠️ | (danh sách từ cho Nối Từ) | Xem 2.3 |
| `undertheseanlp/dictionary` | **GPL-3.0** ⚠️ | (từ điển cho Nối Từ) | Xem 2.3 |

### 2.2. Chưa kiểm chứng — cần tra lại trước khi dùng

| Nguồn | Tình trạng |
|---|---|
| **Kenney.nl** (asset 2D/âm thanh) | Thường được biết là CC0 nhưng **trang giấy phép trả lỗi 403 khi tra hôm nay → chưa kiểm chứng, cần tra lại trước khi dùng** |
| **OpenGameArt.org** (sprite, bộ bài, âm thanh) | License khác nhau từng asset (CC0/CC-BY/GPL…) → **chưa kiểm chứng, phải tra từng asset** |
| Repo mã nguồn mở cho Nối Thú/Onet, Đào Vàng, Đặt Bom, Bắn Cung, Xếp Gạch, Tìm Điểm, Nông Trại | **Chưa tra** — các game này được xếp nhóm (a)/(b) tự viết nên không cần; nếu sau muốn dùng repo nào thì phải tra license trước |
| Từ điển tiếng Việt khác (ví dụ các bộ từ điển mở cộng đồng, Wiktionary tiếng Việt) | **Chưa kiểm chứng, cần tra lại trước khi dùng** (Wiktionary thường dùng CC-BY-SA — chưa xác minh, có nghĩa vụ chia sẻ lại tương tự) |
| Font tiếng Việt (Be Vietnam Pro, Inter…) | Thường là SIL OFL — **chưa kiểm chứng hôm nay** |

### 2.3. Hai rủi ro license/sở hữu trí tuệ đáng chú ý

1. **Từ điển cho Nối Từ**: hai nguồn mở tìm được đều GPL. GPL ràng buộc khi *phân phối*; nếu chỉ dùng phía server (không gửi file cho trình duyệt) thì về lý thuyết ít ràng buộc hơn, và quyền tác giả với một danh sách từ cũng là câu hỏi pháp lý chưa rõ. **Đề xuất**: tự xây danh sách từ ghép 2 âm tiết (vài nghìn từ thông dụng, lọc từ nhạy cảm cho trẻ em), có thể dùng nguồn GPL **chỉ để đối chiếu nội bộ** sau khi có ý kiến pháp lý. Bot Nối Từ chỉ dùng từ điển tự xây.
2. **Tên và hình game là thương hiệu của người khác**: Pikachu/Pokémon, Tetris, Dynomite, Hill Climb Racing, Bomberman, Bowmen, Candy Crush (đều là tên/thương hiệu theo hiểu biết chung, **chưa tra cứu đăng ký cụ thể**). Danh mục đang dùng các tên này làm tên phụ/tham chiếu → **đề nghị Gehihi/Mama đổi sang tên thuần Việt riêng** (ví dụ "Nối Thú", "Xếp Gạch", "Bắn Bóng Khủng Long", "Đua Xe Leo Đồi") và **toàn bộ đồ họa tự vẽ**, không sao chép giao diện đặc trưng. Lưu ý SEO: có thể viết mô tả kiểu "game nối thú cổ điển" nhưng không dùng thương hiệu làm tên sản phẩm.

---

## 3. Đánh giá lại kiến trúc A ở quy mô 18 game

### 3.1. Điều gì vẫn đúng
- Next.js SSG cho trang chủ/danh mục/18 trang landing: không thay đổi, thêm game chỉ thêm trang tĩnh.
- Game tải lười theo manifest: càng nhiều game càng quan trọng — trang chủ không được kéo theo code 18 game.
- 1 VPS + CDN miễn phí vẫn đủ cho giai đoạn launch, **vì 11/18 game không chạm server**.

### 3.2. Cần đổi gì

| # | Thay đổi | Lý do |
|---|---|---|
| 1 | **Bỏ "1 GameRoom chung"** → `RoomShell` (auth, ghế, mời, reconnect, lưu kết quả, version) + controller: **TurnController** (Caro, Cờ Tướng, Nối Từ, Cá Ngựa, Bắn Cung online), **RoundController** (Đố Vui: mọi người trả lời cùng lúc, chấm theo thời điểm server nhận), **TickController** (Rắn Battle, Đặt Bom online: vòng lặp 15–20 lần/giây, server quyết định, client nội suy). Mỗi game đăng ký **1 room type riêng** trên Colyseus (`caro`, `xiangqi`…) | Tiếp thu review Codex mục 4. Ba kiểu đồng bộ khác nhau bản chất; tách room type giúp đo tải theo game, khóa phiên bản luật theo trận, deploy an toàn |
| 2 | **Tách game server realtime** (TickController) ra process/container riêng, giới hạn CPU/RAM riêng | Vòng lặp tick tốn CPU liên tục; không để Rắn Battle làm chậm nước đi Cờ Tướng. Chỉ làm khi bắt đầu Giai đoạn 5 |
| 3 | **Content Service** (bảng trong Postgres + script nhập dữ liệu, chưa cần trang admin): từ điển Nối Từ, ngân hàng câu hỏi Đố Vui (gắn chủ đề SpeakUp Kids), màn chơi Tìm Điểm/Đào Vàng dạng JSON | 3–4 game phụ thuộc nội dung; nội dung phải cập nhật được không cần deploy code. Đáp án Đố Vui chỉ nằm ở server |
| 4 | **Save Service phía client**: IndexedDB/localStorage có version schema cho tiến trình single-player (Nông Trại, Sudoku dở dang, kỷ lục) | 11 game đơn cần "chơi tiếp" không đăng nhập (đúng nguyên tắc zero-friction của Gehihi). Điểm tự báo từ client **không** dùng cho bảng xếp hạng tin cậy (review Codex mục 5) |
| 5 | **Bot phía server** dùng chung giao diện `BotPlayer` cho Caro, Cờ Tướng, Nối Từ, Cá Ngựa (thay người rớt mạng — giả định của Gehihi) | Cần tính trước: bot chạy trong cùng process có thể chặn event loop (đặc biệt bot Cờ Tướng) → chạy bot nặng trong worker thread, giới hạn thời gian nghĩ |
| 6 | **Ngân sách bundle theo game** + chunk Phaser dùng chung cho 6 game arcade; CI kiểm tra kích thước | 18 game làm phình asset; không để một game làm chậm cả cổng |
| 7 | **Monorepo + Turborepo cache, CI chỉ build/test game thay đổi** | 18 package game; build toàn bộ mỗi lần sẽ chậm |

### 3.3. Điểm nghẽn khi tăng số phòng/CCU

| Điểm nghẽn | Mức | Ghi chú / cách giảm |
|---|---|---|
| CPU vòng lặp tick (Rắn Battle, Đặt Bom) | **Cao** | Đo ms/tick/room; giới hạn số người/phòng; tách process (thay đổi #2); tick 15 Hz thay vì 60 Hz |
| Băng thông realtime | **Cao** | Ước lượng thô (chưa kiểm chứng): game lượt < 1 KB/s/người; realtime 20 Hz × 100–300 byte delta ≈ 2–6 KB/s/người nhận, nhân theo số người trong phòng. 300 CCU realtime ≈ 1–2 MB/s ≈ 10–15 Mbps → kiểm tra hạn mức băng thông của gói VPS |
| Bot Cờ Tướng / tra từ điển chặn event loop | Vừa | Worker thread; từ điển nạp vào bộ nhớ dạng Set (vài MB) |
| Phát cập nhật danh sách phòng công khai cho 9 game | Vừa | Lobby theo từng game, phân trang, gộp cập nhật 1–2 giây/lần (review Codex) |
| Ghi kết quả trận vào Postgres | Thấp–vừa | Ghi bất đồng bộ, idempotent theo matchId, pool kết nối giới hạn |
| CDN/asset 18 game | Thấp | Cloudflare free; hash tên file, cache dài hạn |
| Một VPS = điểm lỗi đơn | Vừa | Chấp nhận ở launch; trận đang chơi bị hủy khi crash, không tính thua (review Codex) |

**Kết luận**: không cần đổi sang B/C. Mốc phải xem lại kiến trúc là khi **game realtime online** có tải thật, không phải khi số game tăng.

---

## 4. Roadmap theo giai đoạn

> **Người-ngày** = một ngày làm việc của một lập trình viên quen stack, **chỉ phần code + test**, chưa gồm đồ họa, âm thanh, nội dung câu hỏi/màn chơi, pháp lý. **Toàn bộ là ước tính chưa kiểm chứng**; sẽ hiệu chỉnh sau Giai đoạn 1 dựa trên thời gian thực tế.
> 🟢 Single-player (không server) · 🔵 Multiplayer online (cần RoomShell + đồng bộ + reconnect → luôn tốn công hơn) · 🟡 2 người cùng máy (không server)

### Giai đoạn 0 — Nền móng (12–18 người-ngày)
Monorepo, Game SDK + manifest/registry tách client/server, layout cổng + trang danh mục/landing SSG, khung quảng cáo SpeakUp Kids, guest session phía server, CI (lint, test, license check, bundle budget), Docker Compose dev local.

### Giai đoạn 1 — Technical MVP: kiểm chứng kiến trúc (19–28 người-ngày)

| Game | Chế độ | Nhóm | Độ khó | Ước tính | Phụ thuộc |
|---|---|---|---|---|---|
| 2048 | 🟢 | (c) | Thấp | 2–3 | GĐ0 (SDK client) |
| Cờ Caro | 🔵 1v1 | (a) | Trung bình (vì dựng RoomShell + TurnController + mời/phòng công khai/reconnect) | 10–14 | GĐ0, guest session |
| Rắn Săn Mồi (đơn) | 🟢 | (a) | Thấp | 3–5 | GĐ0, chọn Phaser 3 hay 4 |
| Ổn định + test thiết bị/tải theo tiêu chí review Codex | — | — | — | 4–6 | Cả 3 game |

Khớp với phạm vi MVP Codex đề xuất (2048 + Caro + Rắn). **Cổng quyết định**: chỉ sang GĐ2 khi Caro qua test 2 client, reconnect, gửi trùng, và đo tải.

### Giai đoạn 2 — Làn sóng game lưới ô (22–32 người-ngày) — toàn bộ 🟢

| Game | Nhóm | Độ khó | Ước tính | Phụ thuộc |
|---|---|---|---|---|
| Tách Grid Core (E1) từ 2048/Caro | — | — | 2–3 | GĐ1 |
| Xếp Gạch | (b) | Thấp | 3–4 | E1 |
| Sudoku | (b)+lib | Thấp | 3–5 | E1, sudoku.js hoặc tự viết |
| Nối Thú | (b) | Trung bình (tìm đường ≤3 đoạn, xáo khi bế tắc) | 4–6 | E1 |
| Ghép Kẹo | (c) | Trung bình (combo, kẹo đặc biệt, tránh bàn chết) | 5–7 | E1 |
| Bắn Bóng | (c) | Trung bình (lưới lục giác, góc bật tường) | 5–7 | E1 (lục giác) + E2 cơ bản |

Lý do làm sớm: rẻ, không đụng server, tăng nhanh số game, tận dụng một engine. Nối Thú có điểm sản phẩm cao (19/20) nên ưu tiên trong đợt.

### Giai đoạn 3 — Làn sóng đối kháng theo lượt (27–41 người-ngày) — 🔵

| Game | Nhóm | Độ khó | Ước tính | Phụ thuộc |
|---|---|---|---|---|
| Mở rộng RoomShell: 2–4 ghế, BotPlayer thay người thoát, RoundController | — | — | 3–4 | Caro ổn định |
| Nối Từ | (a) | Trung bình (luật nối, chuẩn hóa dấu, chống lặp từ, bot) | 6–9 | E3 mới, **từ điển tự xây xong trước** (Content Service) |
| Đố Vui | (b) | Trung bình | 5–8 | E3 từ Nối Từ, RoundController, **ngân hàng câu hỏi** (nội dung, không tính vào số ngày) |
| Cờ Tướng | (b)+lib | **Cao** (luật chiếu, lộ mặt tướng, chiếu dai/hòa, đồng hồ, bot) | 8–12 | TurnController + đồng hồ từ Caro, xiangqi.js hoặc luật tự viết, worker thread cho bot |
| Cờ Cá Ngựa | (b) | Trung bình | 5–8 | **Phòng 4 ghế + bot thay người** (dòng đầu bảng), xúc xắc RNG server |

### Giai đoạn 4 — Arcade, vật lý, cảnh (32–46 người-ngày) — 🟢/🟡

| Game | Chế độ | Nhóm | Độ khó | Ước tính | Phụ thuộc |
|---|---|---|---|---|---|
| Đào Vàng | 🟢 + 🟡 2P cùng máy | (a) | Trung bình | 5–7 | E2 (từ Rắn), màn chơi JSON |
| Bắn Cung | 🟢 + 🟡 | (a) | Trung bình | 5–7 | E2 |
| Tìm Điểm Khác Biệt | 🟢 | (a) | Thấp (code) / **cao về đồ họa** | 3–5 | E4 mới; mỗi màn cần 1 cặp ảnh tự vẽ |
| Đua Xe Leo Đồi | 🟢 | (c) | **Cao** (vật lý xe, địa hình sinh tự động, cân chỉnh cảm giác lái trên mobile) | 7–10 | E2 + planck.js/matter-js |
| Nông Trại | 🟢 (idle) | (a) | Trung bình | 6–9 | E4, Save Service (tiến trình offline) |
| Đặt Bom (chơi với máy) | 🟢 vs bot | (b) | Trung bình | 6–8 | E2 + bản đồ E1, AI né bom đơn giản |

### Chuẩn bị Public Launch (8–12 người-ngày)
Test tải hỗn hợp, đo LCP/CLS trên thiết bị thật, kiểm tra SEO 18 landing, trang Giấy phép & Ghi công, chính sách quyền riêng tư, kiểm tra backup/restore.

**→ Public Launch: đủ 18 game** (16 game đầy đủ; Rắn và Đặt Bom ra mắt ở chế độ chơi đơn / chơi với máy, ghi "Sắp có đấu online").

### Giai đoạn 5 — Sau launch: realtime online (19–30 người-ngày) — 🔵

| Hạng mục | Độ khó | Ước tính | Phụ thuộc |
|---|---|---|---|
| TickController + tách process realtime + test mạng xấu (jitter, mất gói) | **Cao** | 5–8 | GĐ3 RoomShell, số liệu tải thật |
| Rắn Battle online nhiều người | **Cao** | 6–9 | TickController, Rắn đơn |
| Đặt Bom online 2–4 người | **Cao** | 6–9 | TickController, Đặt Bom vs bot |
| Bắn Cung online 1v1 (theo lượt) | Thấp–trung bình | 2–4 | TurnController |

### Tổng hợp

| Giai đoạn | Số game mới | Tích lũy | Người-ngày (ước tính) |
|---|---|---|---|
| 0 Nền móng | 0 | 0 | 12–18 |
| 1 Technical MVP | 3 | 3 | 19–28 |
| 2 Lưới ô | 5 | 8 | 22–32 |
| 3 Đối kháng theo lượt | 4 | 12 | 27–41 |
| 4 Arcade/vật lý/cảnh | 6 | 18 | 32–46 |
| Chuẩn bị launch | — | 18 | 8–12 |
| **Đến Public Launch** | | **18** | **~120–177** |
| 5 Realtime online (sau launch) | (+3 chế độ online) | 18 | 19–30 |

Nếu chủ dự án muốn launch sớm hơn với **15 game**: bỏ ra khỏi đợt launch Đua Xe, Nông Trại, Đặt Bom (3 game ít điểm sản phẩm nhất / khó nhất trong GĐ4), tiết kiệm ~19–27 người-ngày.

Thứ tự trên **xếp theo phụ thuộc kỹ thuật và rủi ro**, khác một phần với xếp hạng sản phẩm của Gehihi (ví dụ Nối Từ 19/20 phải chờ từ điển và RoomShell ổn định; Đào Vàng 19/20 có thể kéo lên GĐ2 nếu Mama muốn ưu tiên — nó chỉ phụ thuộc E2 từ Rắn).

---

## 5. Giả định chưa kiểm chứng

| # | Giả định | Nếu sai thì |
|---|---|---|
| 1 | CCU lúc launch < 500, trong đó realtime online = 0 (vì realtime ra sau launch) | Nếu muốn có Rắn Battle ngay lúc launch: +19–30 người-ngày trước launch và cần đo tải realtime sớm |
| 2 | Băng thông ước lượng ở mục 3.3 (KB/s mỗi người) | Có thể vượt hạn mức băng thông VPS → cần gói lớn hơn |
| 3 | Chi phí hạ tầng khi tăng 6 → 18 game **gần như không đổi** đến trước GĐ5 (vẫn 1 VPS ~10–25 USD/tháng + CDN miễn phí), vì game thêm chủ yếu là single-player | Nếu lưu lượng asset vượt giới hạn sử dụng hợp lý của gói CDN miễn phí → phát sinh chi phí; giá VPS chưa tra lại |
| 4 | Sau GĐ5 có thể cần thêm 1 VPS cho realtime (~+10–25 USD/tháng) | Chưa đo |
| 5 | Ước tính người-ngày cho 1 lập trình viên quen stack; chưa có số liệu năng suất thực tế của team (bot AI + review) | Hiệu chỉnh sau GĐ1 |
| 6 | Đồ họa/âm thanh cho 18 game có nguồn (tự vẽ/AI/asset CC0) và không nằm trên đường găng của lập trình | Đồ họa có thể là phần chậm nhất, đặc biệt Tìm Điểm, Nông Trại, Đua Xe |
| 7 | Tự xây được từ điển ~3.000–10.000 từ ghép tiếng Việt và ~500+ câu hỏi Đố Vui trước GĐ3 | Nối Từ/Đố Vui bị chậm hoặc chất lượng kém |
| 8 | Phaser (bản 3 hoặc 4) chạy mượt 60 fps trên Android tầm trung | Phải giảm hiệu ứng hoặc đổi sang PixiJS/canvas thuần |
| 9 | Colyseus 0.18 hỗ trợ đủ: nhiều room type, lọc state theo người (bài kín/đáp án), presence chia sẻ | Phải tự viết thêm; review Codex dẫn tài liệu 0.16 |
| 10 | Đổi tên các game trùng thương hiệu là đủ để tránh rủi ro sở hữu trí tuệ | Cần ý kiến pháp lý, đặc biệt Xếp Gạch (giao diện đặc trưng) và Nối Thú (hình nhân vật) |
| 11 | Giả định pháp lý từ v1 (giấy phép trò chơi điện tử cho game online, dữ liệu trẻ em) vẫn giữ nguyên; 9 game online làm rủi ro này rõ hơn | Có thể phải hoãn phần online đến khi có giấy phép |
| 12 | Mã nguồn MIT của rembound/2048 chuyển thể được sang Game SDK với công sức như ước tính | Nếu code cũ khó tách, tự viết lại trên E1 (công sức tương đương nhóm b) |

---

## 6. Đề nghị với Mama / Gehihi (không sửa file của Gehihi)

1. Đổi tên các game trùng thương hiệu trong `game-catalog-v2.md` (Pikachu, Tetris, Dynomite, Hill Climb, Bomb Arena/Bomberman, Bow Master/Bowmen).
2. Ghi rõ trong catalog: Đào Vàng "2P" là **cùng máy**; Rắn và Đặt Bom ra mắt chế độ đơn/với máy trước, online sau launch.
3. Chủ dự án chọn: launch 18 game (~120–177 người-ngày) hay 15 game (~100–150 người-ngày).
