# Máy chủ Cờ Vua online

Phòng 1v1 qua WebSocket `/ws/co-vua`, gắn vào `server.js` — mặc định **bật**, tắt bằng `COVUA_ONLINE=0`.
Độc lập với các game khác (`ws.js`, `chat.js` là bản chép riêng từ Cờ Caro, không dùng chung file).

- `room.js` — luật lấy nguyên từ `prototype/games/co-vua/logic.js` (`L.play` từ chối mọi nước không hợp lệ: sai lượt, để Vua bị chiếu,
  nhập thành / qua đường / phong cấp sai). Máy chủ kiểm tra thêm: đúng ghế, đúng lượt, `from`/`to` là số nguyên, `promo` ∈ `q r b n`.
  Ván 1 chủ phòng cầm Trắng, mỗi ván sau đổi màu. Xin thua (`resign`), đề nghị hòa (`draw` — mỗi nước 1 lần; đối thủ gửi `draw` là đồng ý, `draw-no` là từ chối).
  Người có lượt im lặng 60 s (mất kết nối 15 s) → máy đi thay (ai.js mức "normal"); có người rời → về phòng chờ.
  `state.v.game.moves = [[from, to, promo?], …]` — client dựng lại thế cờ bằng `L.replay`.
- `host.js` — mã phòng 5 ký tự, token 128 bit, nối lại (`resume`), giới hạn: 1 KB/khung, 12 tin liền rồi 5/giây, 16 kết nối + 3 phòng mỗi IP,
  phòng không còn ai kết nối bị xoá sau 5 phút. Sau proxy đặt `COVUA_TRUST_PROXY=1` để lấy IP thật từ `X-Forwarded-For`.
- `chat.js` — như Cờ Caro: người gửi lấy theo token, làm sạch ký tự điều khiển/bidi, tối đa 200 ký tự, chặn spam theo người + theo IP.
- Chạy thử: `node games-server/co-vua/dev.js` (PORT 8768). Test: `node --test --test-concurrency=1 games-server/co-vua/test/*.test.mjs`.
