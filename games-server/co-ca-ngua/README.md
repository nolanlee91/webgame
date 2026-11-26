# Máy chủ Cờ Cá Ngựa online

Phòng 2–4 người qua WebSocket `/ws/co-ca-ngua`, gắn vào `server.js` — mặc định **bật**, tắt bằng `COCANGUA_ONLINE=0`.
Độc lập với `games-server/ma-soi/` (ws.js là bản chép riêng, không dùng chung file).

- `room.js` — luật lấy nguyên từ `prototype/games/co-ca-ngua/logic.js`; máy chủ tự gieo xúc xắc (`crypto.randomInt`), kiểm tra đúng ghế / đúng pha / nước hợp lệ,
  tự đi khi chỉ có nước bắt buộc (1,1 s), người có lượt im lặng (30 s), mất kết nối (8 s) hoặc đã rời (1,2 s).
- `host.js` — mã phòng 5 ký tự, token 128 bit, nối lại (`resume`), giới hạn: 1 KB/khung, 12 tin nhắn liền rồi 5/giây, 16 kết nối + 3 phòng mỗi IP,
  phòng không còn ai kết nối bị xoá sau 5 phút. Sau proxy (Railway) đặt `COCANGUA_TRUST_PROXY=1` để lấy IP thật từ `X-Forwarded-For`.
- `chat.js` — trò chuyện trong phòng: client gửi `chat{text}`, máy chủ lấy người gửi theo token của kết nối (không tin tên client gửi), làm sạch
  (ký tự điều khiển/bidi → khoảng trắng, gộp khoảng trắng), từ chối rỗng (`bad`) / > 200 ký tự (`long`), mỗi người 4 tin liền rồi 0,7 tin/giây (`chat-slow`). Thêm hạn mức chung theo IP trong phòng (sống suốt đời phòng, = hạn mức 1 người × số ghế đang ngồi từ IP đó) nên rời/vào lại hay mở kết nối phụ không làm đầy lại.
  Giữ 40 tin gần nhất trong bộ nhớ phòng; `state.v.chat = [{id,name,text,at,mine}]` (không lộ token).
- Giao thức: client gửi `create{name}` / `join{code,name}` / `resume{code,token}` / `rule{rule}` / `start` / `again` / `lobby` / `roll` / `move{horse}` / `chat{text}` / `sync` / `leave` / `ping`;
  máy chủ gửi `joined{code,token}`, `state{now,v}` (mỗi người một bản, có `gid`, `seq`, `act` để client phát lại), `err{code}`, `replaced`, `kicked`, `left`, `pong`.
- Hết ván (Đợt 7): `again` = "tôi sẵn sàng ván mới" (`../rematch.js`): mọi người thật đã bấm ⇒ mở ngay, chưa đủ ⇒ đếm ngược 10 giây
  rồi tự mở; `state.v.again` (cờ theo ghế) + `state.v.againDeadline` (giờ máy chủ) cho client hiện "k/N muốn chơi tiếp". `lobby` = cả phòng
  về phòng chờ, giữ mã + người + bot, bỏ người đã rời. Client cũ chỉ gửi `again` vẫn chạy (ván mới sau đếm ngược).
  E2E trình duyệt: `node games-server/co-ca-ngua/test/rematch-e2e.mjs`.
- Chạy thử: `node games-server/co-ca-ngua/dev.js` (PORT 8767). Test: `node --test --test-concurrency=1 games-server/co-ca-ngua/test/*.test.mjs`.
