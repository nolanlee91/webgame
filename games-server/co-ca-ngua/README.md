# Máy chủ Cờ Cá Ngựa online

Phòng 2–4 người qua WebSocket `/ws/co-ca-ngua`, gắn vào `server.js` khi `COCANGUA_ONLINE=1` (mặc định **tắt**).
Độc lập với `games-server/ma-soi/` (ws.js là bản chép riêng, không dùng chung file).

- `room.js` — luật lấy nguyên từ `prototype/games/co-ca-ngua/logic.js`; máy chủ tự gieo xúc xắc (`crypto.randomInt`), kiểm tra đúng ghế / đúng pha / nước hợp lệ,
  tự đi khi chỉ có nước bắt buộc (1,1 s), người có lượt im lặng (30 s), mất kết nối (8 s) hoặc đã rời (1,2 s).
- `host.js` — mã phòng 5 ký tự, token 128 bit, nối lại (`resume`), giới hạn: 1 KB/khung, 12 tin nhắn liền rồi 5/giây, 16 kết nối + 3 phòng mỗi IP,
  phòng không còn ai kết nối bị xoá sau 5 phút. Sau proxy (Railway) đặt `COCANGUA_TRUST_PROXY=1` để lấy IP thật từ `X-Forwarded-For`.
- Giao thức: client gửi `create{name}` / `join{code,name}` / `resume{code,token}` / `rule{rule}` / `start` / `again` / `roll` / `move{horse}` / `sync` / `leave` / `ping`;
  máy chủ gửi `joined{code,token}`, `state{now,v}` (mỗi người một bản, có `gid`, `seq`, `act` để client phát lại), `err{code}`, `replaced`, `kicked`, `left`, `pong`.
- Chạy thử: `node games-server/co-ca-ngua/dev.js` (PORT 8767). Test: `node --test --test-concurrency=1 games-server/co-ca-ngua/test/*.test.mjs`.
