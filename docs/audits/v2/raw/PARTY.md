# REPORT v2 — PARTY (Ma Sói, Ai Là Nội Gián, Đặt Bom, Nối Từ)

Snapshot `ab70036` (worktree audit2, chỉ đọc). Ảnh + script: `scratchpad/audit2/PARTY/` (ngoài repo).

## 1. Phạm vi đã chạy thật

- Máy chủ thật `server.js` trong tiến trình, cổng 9151–9160, `MASOI_SPEED=0.25`, `NOIGIAN_SPEED=0.25`. Chrome headless qua `cdp.mjs`, mỗi người chơi một browser context riêng, chạm thật (`Input.dispatchTouchEvent`) và chuột/phím thật.
- **Ma Sói, Nội Gián** (script `wolf.mjs`, mỗi game 1 lượt đầy đủ): A 390×844 dpr3 cảm ứng (chủ phòng), B 1366×768, C 360×800 cảm ứng, D 412×915 cảm ứng. Tên tục khi tạo/vào phòng, `/api/lobby`, chat tục + link, nút "Mời ra" + hộp pixel + chặn vào lại, thêm 3 bot, bắt đầu, C tải lại giữa ván, B xoay 844×390, **A đóng tab giữa ván**, hết ván, "Chơi ván mới". Thêm `eight.mjs`: phòng 8 ghế ở 320×568, tên 16+ ký tự liền, pha bỏ phiếu, màn kết quả 320/390.
- **Chủ phòng rời giữa ván**: `hostleave.mjs` chạy 7 lần trên trình duyệt (Nội Gián 5, Ma Sói 2), có gắn log `setConnected` phía máy chủ; `wshost.mjs` chạy 3 lần ở mức WebSocket (Nội Gián).
- **Đặt Bom** (`bom.mjs`): A 360×640 cảm ứng (chủ phòng, kiểm dải "Bắt đầu" ghim chân màn), B 1366 (vào từ danh sách phòng công khai, chat rồi vào ván bằng phím), C 844×390 rồi 740×360 cảm ứng (D-pad giữ 700 ms, BOM). C tải lại giữa ván, chơi hết 3 phút, màn kết quả ở 390.
- **Nối Từ** (`noitu.mjs`, `nt2.mjs`): chơi với máy 390 dpr3 (4 lượt gõ thật, từ tục, xoay 844×390); online 1v1 390↔1366 và 390↔412 (4 nước, chat tục, tải lại, hết giờ, nút Mời ra ở thẻ kết thúc).
- **Viewport màn đầu** (`vp.mjs`): 4 game × 320×568, 412×915, 768×1024, 740×360, 1920×1080: đo tràn ngang và vùng chạm.
- **Bộ lọc**: chạy thẳng `moderation.js` với 100 tên/câu (`mod.cjs`); unit test lọc + mời ra: 33/33 đạt.
- **Bản thật** lumkeo.com (chỉ GET): `/api/lobby`, `avatars.webp`, `assets/HANDOFF.md`.
- **Chưa làm được**: máy iOS/Android thật, trình đọc màn hình, Lighthouse, vai đặc biệt của Nội Gián thao tác tay ("Gửi riêng" chỉ kiểm qua code + unit test).

## 2. Hạng

| Game | v1 | v2 | Lý do |
|---|---|---|---|
| Ma Sói | C | **B** | Tên/chat đã qua lọc, chuyển chủ phòng giữa ván chạy được, Mời ra + hộp pixel tốt, kết quả không vỡ với tên dài. Còn: phòng mặc định công khai, bộ lọc lọt biến thể, ghế chồng nhau ở 320 (8 ghế). |
| Ai Là Nội Gián | C | **B** | Như Ma Sói, cộng 8 chân dung pixel đẹp, đúng V5. Còn: banner sự kiện đè hàng ghế dưới, chip "Sẵn sàng" bị kéo cao. |
| Đặt Bom | C | **B** | Màn ngang chơi được, phím chạy sau khi chat, dải "Bắt đầu" ghim chân màn, nút Hủy phòng không còn bị cắt. Còn: tick sẵn "Phòng công khai", hoà vẫn xếp theo điểm. |
| Nối Từ | B | **B** | Online và chơi với máy đều mượt, tên HUD đã đọc được. Mới: mỗi lần bắt đầu ván online đều ném lỗi JS (TypeError). |

Không game nào lên A vì lỗi P1 dùng chung (PARTY2-01: bộ lọc lọt leetspeak như "l0n").

## 3. Điểm 0–10

| Hạng mục | v1 | v2 | Ghi chú |
|---|---|---|---|
| Visual/V5 | 7 | **8** | Chân dung Nội Gián đúng V5, hộp pixel đồng bộ, viền theo `--b` không thấy lệch. Thanh trên ở 320 xuống 2 dòng, chip Sẵn sàng bị kéo dãn. |
| Mobile UX | 5 | **7** | Đặt Bom ngang đạt (D-pad 44×44, bản đồ 343×290 không bị đè), không tràn ngang ở mọi viewport. Ma Sói/Nội Gián ngang trang cao 1152 px, phải cuộn mới thấy vai/hành động/chat. |
| Trải nghiệm chơi | 6 | **7** | Vòng đời phòng ổn: chủ phòng rời, tải lại, mời ra. Hết ván không có nút gì trong 5–32 s trước khi máy chủ nhận ra chủ phòng đã đi. |
| Điều hướng/flow | 7 | **8** | Link mời, "Quay lại phòng", mời ra có lời báo rõ, rời ván có hộp hỏi. |
| Hoạt cảnh/tương tác | 7 | **7** | Không đổi nhiều. Banner pha vẫn 2,6 s và vẫn chặn chạm. |
| Hiệu năng | 8 | **8** | 0 request lỗi. Không đo lại trace. |
| Accessibility | 6 | **6.5** | Vùng chạm phần lớn ≥ 44, màn ngang có `::after` 44 px. Còn ghế 38×55 ở 320, chip ✕ bỏ bot 32×28, loa 41×44. Chưa kiểm trình đọc màn hình. |
| Quảng cáo | không có | **n/a** | Bốn game party không có chỗ đặt. Thẻ SpeakUp Kids đang ẩn theo quyết định chủ dự án. Không chấm. |
| An toàn trẻ em (thêm) | 2 | **6** | Lọc tên/chat ở máy chủ và cả `/api/lobby` đã có, nhưng vẫn lọt biến thể, phòng vẫn mặc định công khai, chưa có nút tắt tiếng hay báo cáo người chơi. |

## 4. Bảng đối chiếu

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| PTY-01 tên tục | **SỬA MỘT PHẦN** | "Cặc Bự", "đụ mẹ mày", "địt mẹ mày", "Fuck You", "ĐỊT MẸ", "sh1t head", "Đồ Óc Chó" ⇒ đổi thành "Người chơi N" / "Người N" ở cả 4 game và `/api/lobby` (log wolf/bom/noitu). **Lọt**: "l0n" hiện công khai trên ghế và danh sách phòng chờ (ms-390-lobby.png, ng-390-lobby.png). Cũng lọt "c4c", "kặc", "lìn", "phuck", "ｆｕｃｋ" (chữ full-width), "fսck" (chữ giả dạng), "kys", "penis" (`mod.cjs`). Xem PARTY2-01. |
| PTY-02 chat tục | **SỬA MỘT PHẦN** | Ma Sói/Nội Gián: "địt mẹ mày… zalo.me/abc123" ⇒ "*** mày vào [link]". Đặt Bom: "đm thằng ngu, f*ck, www.abc.com" ⇒ "*** thằng ngu, ***, vào [link]". Nối Từ: "đụ má mày, discord.gg/xyz" ⇒ "*** mày, vào [link]". "Gửi riêng" của Nội Gián qua `maskChat` (`ai-la-noi-gian/room.js:286`, unit test đạt). Còn lọt "đ ụ m á", "l0n", "con chó", "thằng ngu". Chưa có tắt tiếng từng người hay báo cáo (MODERATION.md ghi rõ là chưa làm). "Tắt chat" đã có. |
| PTY-03 chủ phòng rời | **ĐÃ SỬA** | WS 3/3: host 0→1, B bấm "again" ⇒ "lobby ok". Trình duyệt: Ma Sói 3/3 có nút "Chơi ván mới" cho người kế nhiệm. Nội Gián: máy chủ chỉ thấy tab đóng sau 5–32 s (log `setConnected(0,false)` lúc +5 s, +20 s, +32 s). Nếu ván kết thúc trước lúc đó thì màn kết quả không có nút cho ai (3/5 lượt chạy), đến lúc máy chủ thấy thì nút mới hiện. Xem PARTY2-03. |
| PTY-04 Đặt Bom ngang | **ĐÃ SỬA** | 844×390: bản đồ 343×290 ở y 80–370, D-pad x 8–150, BOM 84×84 ở x 749, không đè nhau. 740×360: bản đồ 307×260. Ảnh bom-844x390-play.png. |
| PTY-05 phím sau chat | **ĐÃ SỬA** | Focus trước khi vào ván = `chatInp`, sau = BODY. 4 mũi tên + Space không ghi thêm ký tự nào vào ô chat. |
| PTY-06 tên dài vỡ kết quả | **ĐÃ SỬA** | Tên "NguyễnThịThanhHươngXX", 8 thẻ ở 320/390: 0 thẻ chồng nhau, `endCards` không tràn (ms-390-end-longname.png). |
| PTY-07 ghế đè nhau | **SỬA MỘT PHẦN** | 320, 8 ghế: nhãn tên chồng nhau 0, nhưng khung ghế chồng nhau 3/28 cặp. Ô đồng hồ pha che đầu ghế trên cùng (ms-320-8seat-night.png). 360, 6 ghế: không chồng. |
| PTY-08 Hủy phòng bị cắt | **ĐÃ SỬA** | 390: Ván mới / Về phòng chờ / Hủy phòng đều nằm trong khung x 29–361, không có nút bị cắt. |
| PTY-09 tên HUD Nối Từ | **ĐÃ SỬA** | 390: "Người chơi (bạn)" 55 px, "Phúc Đức Dũng Cư" 120/130 px (chỉ thiếu khoảng 10 px). |
| PTY-10 ô màu Nội Gián | **ĐÃ SỬA** | `assets/avatars.webp` 768×96 (8 chân dung) hiện ở ghế và danh sách người chơi (ng-390-lobby.png). |
| PTY-11 banner che ghế | **SỬA MỘT PHẦN** | Ma Sói: banner "Bỏ phiếu" ở 320 che 0 ghế đang chọn được. Nội Gián: banner `top:64%` đè hàng ghế dưới (ng-360-ingame.png). Banner vẫn hiện 2,6 s (`ma-soi/app.js:258`) và không có `pointer-events:none` (`ma-soi/style.css:127`, `ai-la-noi-gian/style.css:145`). |
| PTY-12 phòng mặc định công khai | **SỬA MỘT PHẦN** | Đã có "Mời ra" + chặn vào lại 10 phút. Nhưng `#privateRoom` vẫn không tick ở cả 4 game (`*/index.html`, đo được `checked:false`). Đặt Bom tick sẵn "Phòng công khai" trong phòng chờ. Phòng hiện ngay trên `/api/lobby`. Checklist roadmap yêu cầu "phòng mặc định kín". |
| PTY-13 cắt emoji | **ĐÃ SỬA** | `cutChars` cắt theo cụm grapheme: "👨‍👩‍👧👨‍👩‍👧abc…" và 🐱×12 cắt gọn, không vỡ emoji. |
| PTY-14 người bị loại vẫn chat | **ĐÃ SỬA** | `chatInp.disabled = !canTalk` (`ma-soi/app.js` renderChat), placeholder "Người đã bị loại không được nói". |
| PTY-15 xếp hạng khi hoà | **CHƯA SỬA** | `dat-bom/app.js:244` xếp: người thắng trước, rồi theo điểm. Khi hoà (`winner` null), người đã bị loại mà điểm cao vẫn đứng đầu. |

**Tổng: 9 ĐÃ SỬA · 5 SỬA MỘT PHẦN · 1 CHƯA SỬA · 0 HỒI QUY.**

## 5. Lỗi mới

| ID | P | Ở đâu | Vấn đề | Đề xuất | Nghiệm thu | Effort |
|---|---|---|---|---|---|---|
| PARTY2-01 | **P1** | `games-server/moderation.js`, `account/bad-words.json` | Biến thể lọt bộ lọc tên và chat. "l0n", "c4c" lọt vì leet đổi ra "lon"/"cac" mà dạng không dấu cố ý bỏ qua. Lọt cả "kặc", "lìn", "phuck", "ｆｕｃｋ" (full-width), "fսck" (chữ giả dạng), "đ ụ m á", "kys", "penis", "vagina". "l0n" hiện công khai trên ghế. | `normalize('NFKC')` + bảng chữ giả dạng (confusables) trước khi so. Dạng **có số leet** thì so với danh sách gốc kể cả từ trong nhóm plain-skip, vì người gõ "l0n" chắc chắn cố ý. Thêm kặc/lìn/phuck, cụm "đụmá" ghép từ chữ rời, từ tình dục/tự hại tiếng Anh vào nhóm `contains`/`exact`. | Toàn bộ danh sách trên ⇒ tên bị thay, chat thành ***. Bảng SHOULD_NOT_BLOCK vẫn đạt. | S |
| PARTY2-02 | P2 | `noi-tu/session/online.js:76` → `core/rules.js:8` | Mỗi lần bắt đầu ván online, **cả hai tab** ném `TypeError: Cannot read properties of null (reading 'contentHash')`: `start()` chạy trước khi từ điển nạp xong. Ván vẫn chạy (nt2.mjs: lỗi có ngay trước bước tải lại, 1/1 mỗi tab). | Chờ `dict` sẵn sàng rồi mới `start()` (đặt cờ chờ, chạy lại khi dict nạp xong). | 0 lỗi JS khi tạo/vào ván, tải lại, Ván tiếp. | S |
| PARTY2-03 | P2 | Ma Sói / Nội Gián, màn hết ván | Máy chủ chỉ nhận ra chủ phòng đã đóng tab sau 5–32 s. Trong lúc đó màn kết quả không có nút "Chơi ván mới" cho ai và không có lời giải thích, nên trẻ chỉ thấy "Xem kết quả / Rời phòng". | Hiện "Chờ chủ phòng ★X… (nếu vắng, bạn sẽ mở được ván mới)". Rút nhịp heartbeat ở pha `end`, hoặc cho người còn lại bấm sau 10 s nếu chủ phòng không phản hồi. | Chủ phòng đóng tab ⇒ ≤ 10 s có người cầm nút; trong lúc chờ có dòng giải thích. | S |
| PARTY2-04 | P2 | Ma Sói / Nội Gián xoay ngang 844×390, 740×360 | Cảnh chiếm trọn chiều cao, trang cao 1152 px. Vai, nút hành động và chat nằm dưới mép màn, phải cuộn qua lại khi đang bỏ phiếu (ms-844x390-ingame.png). | Bố cục 2 cột khi `(orientation: landscape) and (max-height: 500px)`: cảnh trái theo `100dvh`, cột phải gồm đồng hồ, vai, hành động và chat cuộn trong cột. | 844×390: cảnh, đồng hồ pha và nút hành động cùng thấy trong 1 màn, trang không cuộn dọc. | M |
| PARTY2-05 | P2 | Ma Sói / Nội Gián phòng chờ 320 | Chip ✕ bỏ bot 32×28. Ghế 38×55. Thanh trên ở 320 xuống 2 dòng ("← Lụm / Kèo", "MA / SÓI"). | Chip ✕ ≥ 44×44 (hoặc `::after`). Thu chữ thanh trên / ẩn chữ "Lụm Kèo" ≤ 340 px. | Không có vùng chạm < 44 ở 320. Thanh trên 1 dòng. | S |
| PARTY2-06 | P3 | Nối Từ, Ma Sói, Nội Gián, Đặt Bom | Tên bị đổi thành "Người chơi N" hoặc bị cắt ở 16 ký tự ("Phúc Đức Dũng Cư") mà không báo, trẻ không hiểu vì sao tên mình đổi. | Toast "Tên này chưa dùng được, đổi tên khác nhé". Bộ đếm 16 ký tự ở ô tên (như game cờ đã có). | Gõ tên tục ⇒ thấy lời nhắc. Ô tên có bộ đếm. | S |
| PARTY2-07 | P3 | `prototype/games/ai-la-noi-gian/assets/` | `HANDOFF.md`, `generation-prompts.json`, `avatars-x4-preview.png` được phục vụ công khai trên lumkeo.com (HANDOFF.md trả 200). | Chuyển sang `docs/ai-la-noi-gian/` hoặc chặn ở `server.js`. | GET các file đó ⇒ 404. | S |
| PARTY2-08 | P3 | Nội Gián phòng chờ | Chip "SẴN SÀNG" bị kéo cao theo hàng 44 px, chữ dính mép trên (ng-390-lobby.png). | `align-self:center` cho chip. | Chip cao vừa chữ, căn giữa. | S |
| PARTY2-09 | P3 | Ma Sói / Nội Gián | Loa 41×44 ở 360 (màn kết quả, trong ván). | ≥ 44×44. | Đo ≥ 44. | S |

Không có P0 mới.

## 6. Top 3

**Thắng lớn nhất**
1. An toàn trẻ em từ 2 lên 6: một bộ lọc dùng chung ở máy chủ cho tên, chat, "Gửi riêng" và `/api/lobby` (phòng thủ 2 lớp). Các câu chửi phổ biến có dấu, không dấu, viết tắt và tiếng Anh đều bị chặn.
2. Vòng đời phòng hoàn chỉnh: chuyển chủ phòng ở mọi pha, "Mời ra" + chặn vào lại 10 phút có lời báo tiếng Việt, hộp hỏi pixel 44 px thay `confirm()`.
3. Đặt Bom thành game điện thoại thật sự: xoay ngang chơi được, dải "Bắt đầu" ghim chân màn, phím chạy sau khi chat. Nội Gián có 8 chân dung pixel.

**Còn tồn lớn nhất**
1. Bộ lọc lọt leetspeak/biến thể ("l0n" hiện công khai), chưa có tắt tiếng hay báo cáo từng người (PARTY2-01, PTY-02).
2. Phòng vẫn mặc định công khai và hiện ngay ở sảnh trang chủ, trái với checklist "phòng mặc định kín" (PTY-12).
3. Ma Sói/Nội Gián xoay ngang và 320 vẫn chật: phải cuộn để thấy hành động, ghế chồng nhau, banner chặn chạm 2,6 s (PARTY2-04, PTY-07, PTY-11).
