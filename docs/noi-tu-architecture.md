# Nối Từ — phác thảo kiến trúc (chờ Codex review)

Trạng thái: **bản nháp bước 1**, chưa code. Mục tiêu: bản đầu chơi với máy (offline), sau này cắm online 1v1 thật
**mà không sửa luật, AI hay giao diện** — chỉ thêm một module phiên chơi mới và phía server.
Dựa trên `docs/tech-architecture-v2.md` (engine E3 Đố chữ, E5 RoomShell + TurnController, mục 2.3 license từ điển).

## 1. Luật (bản đầu)
- Mỗi từ là **từ ghép đúng 2 âm tiết** có trong từ điển. Từ sau phải bắt đầu bằng **âm tiết cuối của từ trước**,
  khớp đúng cả dấu (học tập → tập vở → vở ...). Không lặp từ đã dùng trong ván.
- Mỗi lượt **15 giây** (cấu hình được; catalog ghi 10 s, chọn 15 s cho người mới/trẻ em). Gõ sai từ thì báo lý do,
  được gõ lại đến khi hết giờ. Hết giờ hoặc bỏ cuộc → thua ván. Tỉ số giữ qua các ván, người thua đi trước.
- Từ "cụt" (không còn từ nào nối tiếp) được phép — đó là đòn chiến thuật. Có tùy chọn luật cấm từ cụt (`rules.noDeadEnd`).

## 2. Các lớp và hướng phụ thuộc

```
ui/  (game.js, index.html)          ← chỉ biết MatchSession, không import rules/ai
  │  intent: submit(word) / resign() / rematch()      ▲ state + event
  ▼                                                   │
session/  MatchSession (interface)
  ├─ local.js     LocalSession   — "trọng tài" chạy ngay trong trình duyệt (bot hoặc 2 người chung máy)
  ├─ loopback.js  LoopbackSession — giả lập mạng: JSON + độ trễ + đứt kết nối (để test, bản đầu có luôn)
  └─ online.js    OnlineSession  — (sau) WebSocket tới server
  │
core/  (thuần JS, không DOM, không Date.now, không fetch — chạy được cả trình duyệt lẫn Node server)
  ├─ normalize.js  chuẩn hóa tiếng Việt: NFC, chữ thường, gộp khoảng trắng, tách âm tiết, đổi dấu kiểu cũ/mới (hoà/hòa)
  ├─ dict.js       createDict(words) → has(w), startsWith(syl), countNext(syl, used)  (chỉ nhận dữ liệu, không tự tải)
  ├─ rules.js      initRound(config, seed), validate(state, seat, word, dict) → {ok, reason}, reduce(state, event)
  └─ ai.js         pickWord(state, dict, level, rng) → word | null
data/words.json    từ điển tự xây + dictVersion
```

Quy tắc cứng: `core/` không import gì ngoài `core/`; `ui/` không import `core/rules` hay `core/ai`
(trừ `normalize`/`validate` để báo đỏ/xanh tức thì khi gõ — chỉ là gợi ý, quyết định cuối là của trọng tài).

## 3. Trạng thái = gộp dần các sự kiện
`state = events.reduce(reduce, initial)`. State là dữ liệu thuần, JSON được:
`{ v, rulesVersion, dictVersion, seats:[{id,name,kind:'human'|'bot'}], round, first, turn, chain:[{seat,word,at}],
used:Set→array, turnStartedAt, turnMs, winner, reason, score, seq }`.

Sự kiện (do **trọng tài** phát, có `seq` tăng dần):
| Sự kiện | Ý nghĩa |
|---|---|
| `roundStart {first, seed, at, rulesVersion, dictVersion}` | bắt đầu ván; seed cho bot |
| `played {seat, word, at}` | từ hợp lệ đã nối |
| `timeout {seat, at}` · `resigned {seat, at}` | kết thúc ván |
| `rejected {seat, word, reason}` | **không đổi state**, chỉ gửi cho người gõ (sai luật/không có trong từ điển/đã dùng) |

Thời gian luôn nằm **trong sự kiện** (`at`), không đọc đồng hồ trong `core/`. Trọng tài sở hữu đồng hồ và tự phát `timeout`.
Giao diện chỉ hiển thị đếm ngược từ `turnStartedAt + turnMs` (online: cộng độ lệch giờ với server).

## 4. Interface MatchSession (điểm cắm online)
```js
session.mySeat            // 0 | 1 — UI vẽ theo góc nhìn này, không giả định "người = ghế 0"
session.state             // snapshot hiện tại (chỉ đọc)
session.submit(word)      // ý định, không phải sự kiện; trả Promise<{ok, reason}>
session.resign(); session.rematch()
session.on('state', fn)   // sau mỗi sự kiện được áp dụng
session.on('event', fn)   // để chạy hiệu ứng (từ bay vào chuỗi, rung khi rejected, hết giờ...)
session.on('status', fn)  // 'connecting' | 'live' | 'opponent-left' | 'reconnecting' | 'closed'
session.dispose()
```
- **LocalSession**: giữ log sự kiện, chạy `validate` + `reduce`, giữ đồng hồ, khi tới lượt bot thì gọi `ai.pickWord`
  sau 0,8–2,5 s "suy nghĩ" (độ trễ do session quyết định, AI vẫn thuần). Lưu log vào localStorage để mở lại ván dở.
- **LoopbackSession**: một "server" giả chạy cùng trang, mọi intent/sự kiện đi qua `JSON.stringify` + trễ ngẫu nhiên,
  có thể cắt kết nối. Chạy chung bộ test với LocalSession ⇒ chứng minh UI không phụ thuộc vào chuyện ai làm trọng tài.
- **OnlineSession (sau)**: gửi intent qua WebSocket, nhận sự kiện có `seq`; mất kết nối thì xin lại snapshot + các sự kiện
  sau `seq` cuối. Không đổi gì ở `ui/` và `core/`.

## 5. Khi làm online (chưa làm bây giờ)
- Server Node dùng **nguyên `core/`** (ES module) làm trọng tài: room type `noi-tu` trên TurnController của RoomShell
  (Colyseus đã ghi trong kiến trúc v2, hoặc `ws` thuần nếu Codex thấy nhẹ hơn cho giai đoạn này).
- Server có từ điển riêng, là nguồn quyết định; client vẫn có bản sao để báo tức thì và để chơi offline.
  Nối Từ không có thông tin ẩn nên client có từ điển không tạo lỗ gian lận.
- Đối thủ thoát giữa ván → server cho **bot thay ghế** bằng cùng `ai.js` (đúng giả định ở catalog v2 mục rủi ro).
- `rulesVersion` + `dictVersion` trong `roundStart`: hai bên lệch bản thì server từ chối vào phòng thay vì chơi sai luật.
- Chống gian lận: chỉ server phát `played`/`timeout`; client gửi từ, không gửi "tôi thắng".

## 6. Từ điển
- **Tự xây** theo khuyến nghị mục 2.3 kiến trúc v2 (nguồn mở tìm được đều GPL): mục tiêu bản đầu **~3.000–5.000 từ ghép
  2 âm tiết thông dụng**, lọc từ nhạy cảm cho trẻ em, thêm cờ `kid`/`common` để bot Dễ chỉ dùng từ quen.
- Định dạng: `words.json` = `{dictVersion, words:[...]}` (~60–90 KB, nén gzip còn ~25 KB). Dựng chỉ mục theo âm tiết đầu khi tải.
- Rủi ro chính của game là **người chơi gõ từ đúng mà từ điển thiếu**. Bản đầu: báo "Từ này chưa có trong từ điển",
  ghi lại các từ bị thiếu vào localStorage (sau này gửi lên server để duyệt bổ sung). Cần người thật duyệt danh sách.

## 7. AI
- Chỉ chọn từ trong từ điển, chưa dùng, nối đúng. Hết từ → chịu thua (để hết giờ).
- **Dễ**: chọn ngẫu nhiên trong từ `common`, thỉnh thoảng "bí" khi còn ít lựa chọn.
- **Khó**: ưu tiên từ có âm tiết cuối ít đường nối tiếp nhất cho đối thủ (`countNext` thấp), dùng từ cụt khi luật cho phép,
  tránh tự để mình vào thế ít lựa chọn ở lượt sau (nhìn trước 1 bước).
- Thuần, có `rng` truyền vào ⇒ test lặp lại được, và server dùng lại y nguyên.

## 8. Test (bước 2)
- Unit `core/`: chuẩn hóa (dấu, hoa thường, khoảng trắng, "hoà/hòa"), luật nối, lặp từ, hết giờ, tỉ số, replay log.
- **Bộ test hợp đồng MatchSession** chạy cho cả LocalSession và LoopbackSession (trễ, mất gói, reconnect).
- AI đấu AI hàng trăm ván: luôn từ hợp lệ, đủ nhanh trên điện thoại.
- E2E Chrome thật desktop + mobile như Cờ Caro (bàn phím ảo trên mobile không che ô nhập, gõ tiếng Việt có dấu bằng IME).

## 9. Cần Codex xem kỹ
1. Ranh giới intent/sự kiện và việc `rejected` không đi vào log có hợp lý cho reconnect không.
2. Đồng hồ do trọng tài giữ, client chỉ hiển thị — đủ chưa, hay cần thêm bù trễ mạng cho lượt 15 s.
3. Colyseus hay `ws` thuần cho room 1v1 theo lượt ở giai đoạn đầu online.
4. Từ điển gửi xuống client (cần cho offline) — có vấn đề gì về license/kích thước không, khi danh sách là tự xây.

Giao diện (bước 2, tóm tắt): chuỗi từ dạng thẻ pixel V5 cuộn ngang/dọc, âm tiết nối được tô màu,
ô nhập lớn có đếm ngược dạng thanh, khung lượt của hai bên như Cờ Caro; dùng asset có sẵn, không tạo ảnh AI mới.
