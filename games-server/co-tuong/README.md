# Máy chủ Cờ Tướng online

Phòng 1v1 qua WebSocket `/ws/co-tuong`, gắn vào `server.js` — mặc định **bật**, tắt bằng `COTUONG_ONLINE=0`.
Độc lập với các game khác (`ws.js`, `chat.js` là bản chép riêng từ Cờ Caro, không dùng chung file).

- `room.js` — luật lấy nguyên từ `prototype/games/co-tuong/logic.js`; kiểm tra đúng ghế / đúng lượt / nước hợp lệ (gồm không tự để bị chiếu,
  tướng không đối mặt) / ván chưa kết thúc. Client chỉ gửi `{t:"move", f, to}` (số ô 0..89); mọi trường khác bị bỏ qua.
  Ván 1 chủ phòng cầm Đỏ, mỗi ván sau đổi màu; điểm tính theo người. `resign` (xin thua, lúc nào cũng được), `draw` (cầu hòa / đồng ý khi đối thủ đang cầu hòa),
  `draw-no` (từ chối / rút lại); mỗi người chỉ cầu hòa 1 lần mỗi nước; đối thủ đi tiếp = từ chối.
  Người có lượt im lặng 60 s (mất kết nối 15 s) → máy đi thay (ai.js mức "normal"); có người rời → về phòng chờ, điểm làm lại.
- `host.js` — mã phòng 5 ký tự, token 128 bit, nối lại (`resume`), giới hạn: 1 KB/khung, 12 tin liền rồi 5/giây, 16 kết nối + 3 phòng mỗi IP,
  phòng không còn ai kết nối bị xoá sau 5 phút. Sau proxy đặt `COTUONG_TRUST_PROXY=1` để lấy IP thật từ `X-Forwarded-For`.
- `chat.js` — như Cờ Caro: người gửi lấy theo token, làm sạch ký tự điều khiển/bidi, tối đa 200 ký tự, giới hạn số tin theo người + theo IP.
- Chạy thử: `node games-server/co-tuong/dev.js` (PORT 8769). Test: `node --test --test-concurrency=1 games-server/co-tuong/test/*.test.mjs`.
