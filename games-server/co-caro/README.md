# Máy chủ Cờ Caro online

Phòng 1v1 qua WebSocket `/ws/co-caro`, gắn vào `server.js` khi `COCARO_ONLINE=1` (mặc định **tắt** cho tới khi qua review độc lập).
Độc lập với các game khác (`ws.js`, `chat.js` là bản chép riêng, không dùng chung file).

- `room.js` — luật lấy nguyên từ `prototype/games/co-caro/logic.js`; kiểm tra đúng ghế / đúng lượt / ô hợp lệ / ván chưa kết thúc.
  Cỡ bàn (15/19) + luật (tự do / chặn 2 đầu) chọn khi tạo phòng. Ván sau người thua đi trước. Người có lượt im lặng 60 s (mất kết nối 15 s) → máy đánh thay (ai.js); có người rời → về phòng chờ.
- `host.js` — mã phòng 5 ký tự, token 128 bit, nối lại (`resume`), giới hạn: 1 KB/khung, 12 tin liền rồi 5/giây, 16 kết nối + 3 phòng mỗi IP,
  phòng không còn ai kết nối bị xoá sau 5 phút. Sau proxy đặt `COCARO_TRUST_PROXY=1` để lấy IP thật từ `X-Forwarded-For`.
- `chat.js` — trò chuyện: người gửi lấy theo token của kết nối (không tin tên client gửi), làm sạch ký tự điều khiển/bidi, tối đa 200 ký tự (`long`),
  4 tin liền rồi 0,7 tin/giây mỗi người (`chat-slow`), giữ 40 tin trong bộ nhớ phòng; `state.v.chat = [{id,name,text,at,mine}]` (không lộ token).
- Chạy thử: `node games-server/co-caro/dev.js` (PORT 8768). Test: `node --test --test-concurrency=1 games-server/co-caro/test/*.test.mjs`.
