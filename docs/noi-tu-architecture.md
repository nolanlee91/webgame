# Nối Từ — kiến trúc (bản 2, đã áp 6 điểm review của Codex)

Trạng thái: **bước 1 xong** — kiến trúc + lõi + lớp phiên chơi + test hợp đồng đã code và chạy (56 test; bản 2.1 sửa 4 lỗi Codex tìm ra khi review code — xem mục 8).
**Bước 2 xong** — giao diện chơi offline với máy (`index.html` + `game.js`), E2E Chrome thật 49 kiểm tra (mục 9). Mục tiêu giữ nguyên: bản đầu chơi với máy/offline, sau này cắm online 1v1 thật
**mà không sửa luật, AI hay giao diện** — chỉ thêm một transport Colyseus và phần server.
**Bước 3 xong** — online 1v1 thật qua mã phòng (mục 11).
Code: `prototype/games/noi-tu/` + `games-server/noi-tu/` · Test: `npm test` trong thư mục game, `npm run test:noi-tu` ở gốc repo.

## 1. Luật (bản đầu)
- Mỗi từ là **từ ghép đúng 2 âm tiết** có trong từ điển; từ sau bắt đầu bằng **âm tiết cuối của từ trước**,
  khớp cả dấu (sau chuẩn hóa — mục 7). Không lặp từ trong ván. Mỗi lượt **15 s** (cấu hình được).
- Gõ sai thì báo lý do, gõ lại đến hết giờ. Hết giờ / bỏ cuộc → thua ván. Tỉ số giữ qua các ván, người thua đi trước.
- **Từ cụt** (mục 7): mặc định được phép và **kết thúc ván ngay, người đánh từ cụt thắng** (không bắt đối thủ chờ 15 s);
  `config.noDeadEnd = true` thì từ cụt bị từ chối.

## 2. Các lớp

```
game.js (UI)        chỉ biết MatchSession (session/client.js) — không import core/rules, core/ai
   │ intent                 ▲ snapshot / event / result / pong / presence     (mọi thứ là JSON)
   ▼                        │
transport           memoryTransport (offline, cùng trang) │ IPC (test, tiến trình riêng) │ Colyseus (sau)
   │                        ▲
   ▼                        │
session/referee.js  RefereeHost — TRỌNG TÀI, nguồn sự thật duy nhất: log sự kiện, đồng hồ, bot, chờ kết nối lại
   │
core/  thuần (không DOM, không Date.now, không fetch): normalize · dict · rules (validate/reduce) · ai · rng
data/  words-src.txt (tự soạn) → build.mjs → words.json (+ contentHash), blocklist.txt
```

Điểm khác bản 1: **không còn LocalSession tự làm trọng tài**. Offline cũng là `MatchClient` ↔ `RefereeHost`
qua transport trong bộ nhớ, mọi thông điệp vẫn đi qua `JSON.stringify` ⇒ UI chỉ có **một** đường code cho offline
và online; online chỉ đổi transport và chuyển `RefereeHost` lên server.

## 3. Hợp đồng intent / event (điểm 1 của Codex)

**Intent** (client → trọng tài): `{ t:'intent', type:'submit'|'resign'|'rematch', commandId, matchId, roundId, expectedSeq?, word? }`
- `commandId` duy nhất mỗi lệnh. Client **gửi lại nguyên lệnh (cùng commandId)** mỗi 1 s và sau khi kết nối lại,
  đến khi có `result`. Trọng tài lưu kết quả theo `ghế:commandId` (**giới hạn: 500 lệnh gần nhất** của cả trận; lệnh cũ hơn bị đẩy khỏi cache sẽ xử lý như lệnh mới, nhưng submit vẫn phải khớp `expectedSeq` nên nhận `stale` chứ không đánh lần hai) ⇒ trùng lệnh / mất ACK
  **trả lại kết quả cũ, không đánh hai lần**.
- `submit` bắt buộc `expectedSeq === state.seq` (từ được chọn theo chuỗi người chơi đang thấy) — lệch thì `stale`. Mọi `result` kèm `seq` hiện tại của server; nếu lớn hơn seq client đang có, client **xin snapshot ngay** (gửi lại sau mỗi `retryMs` đến khi bắt kịp), không chờ sự kiện kế tiếp.
  `resign`/`rematch` chỉ cần đúng `matchId` + `roundId`.

**Kết quả** `{ t:'result', commandId, res:{ ok, reason?, key?, need?, seq } }` — chỉ gửi cho người ra lệnh.
`rejected` **không phải sự kiện**, không vào log, **không tốn số seq** ⇒ đối thủ không bao giờ thấy hụt số.

**Sự kiện** (trọng tài phát cho cả phòng, `seq` tăng liên tục 1,2,3…). **Mọi** thay đổi state đều là sự kiện:

| Sự kiện | Ý nghĩa |
|---|---|
| `matchCreated {matchId, pin, config, seats}` | tạo trận; `pin` ghim từ điển + luật (mục 6) |
| `roundStarted {roundId, first, at, deadlineAt}` | bắt đầu ván |
| `played {roundId, seat, word, at, deadlineAt}` | từ hợp lệ (đã chuẩn hóa) |
| `roundEnded {roundId, winner, reason: timeout/resign/no-move, at}` | kết thúc ván, cộng điểm |
| `seatChanged {seat, kind: human/bot, id, name}` | bot thay ghế / người cũ lấy lại ghế |
| `rematchRequested {seat}` | một bên đồng ý chơi lại (đủ hai bên ⇒ `roundStarted`) |
| `configChanged {config}` | đổi cấu hình lượt — chỉ giữa các ván |
| `clockReset {roundId, deadlineAt}` | chỉ offline: mở lại tab giữa ván thì tính giờ lại lượt đang dở |

`state = fold(reduce, log)`; `snapshot = { snapshotSeq, state }`. Test kiểm tra `fold(log) == state server == state mỗi client`.

**Client áp sự kiện:** `seq ≤ hiện tại` ⇒ bỏ (trùng) · `seq = hiện tại + 1` ⇒ áp + chạy hiệu ứng ·
`seq > hiện tại + 1` ⇒ giữ trong bộ đệm và **xin snapshot** (`sync`), không đòi phát lại từng sự kiện.
Snapshot cũ hơn state hiện có thì bỏ; sự kiện đến muộn đã nằm trong snapshot thì bỏ.
Sự kiện được snapshot phủ **không chạy hiệu ứng** (UI vẽ lại từ state), chỉ sự kiện mới sau snapshot mới có hiệu ứng.

## 4. Đồng hồ, rớt mạng, mở lại tab (điểm 2)
- Trọng tài dùng đồng hồ **monotonic** (`performance.timeOrigin + performance.now()` — đơn vị ms, gốc kiểu epoch để
  hai bên so được). Mỗi lượt có `deadlineAt` trong sự kiện. Trọng tài tự phát `timeout` đúng `deadlineAt`.
- Trọng tài **chỉ nhận từ khi giờ của chính nó lúc nhận < deadlineAt**; không có trường thời gian nào từ client
  được tin. Không bù trễ mạng (lag compensation) ở bản đầu.
- Client ping mỗi 3 s, giữ 8 mẫu, lấy **mẫu RTT nhỏ nhất** để ước lượng lệch giờ
  `offset = serverTime − (t0+t1)/2`; đếm ngược hiển thị = `deadlineAt − (giờ client + offset)`. Chỉ để hiển thị.
- **Rớt mạng:** trọng tài báo `presence offline` + `graceUntil`; **đồng hồ lượt vẫn chạy**. Chờ `graceMs` (mặc định
  **30 s**) mới cho bot thay ghế (`seatChanged`). Quay lại trong 30 s ⇒ không có gì thay đổi.
  Quay lại sau khi bot đã vào ⇒ được xem ván, **lấy lại ghế khi ván đó kết thúc** (không giật ghế giữa ván).
- **Đóng tab rồi mở lại (online):** client lưu `{matchId, token}`; mở lại ⇒ `join` với token ⇒ nhận snapshot,
  dựng lại toàn bộ ván, không chạy lại hiệu ứng cũ; tab cũ (nếu còn) bị `kicked`. Trong 30 s thì vẫn giữ ghế.
- **Đóng tab rồi mở lại (offline):** log sự kiện lưu localStorage; mở lại ⇒ dựng trọng tài từ log, phát `clockReset`
  cho lượt đang dở (người chơi một mình không bị xử thua vì lúc tab đóng). Log có ghim lệch từ điển ⇒ bỏ, mở ván mới.

## 5. Hạ tầng phòng online (điểm 3) — Colyseus
- Dùng **Colyseus** (theo kiến trúc v2: RoomShell + TurnController), **bọc hoàn toàn sau transport**: một room
  `noi-tu` chứa đúng một `RefereeHost`; `onJoin/onLeave/onMessage` của room chỉ chuyển tiếp sang
  `host.connect / host.disconnect / host.message`; `host` gửi lại qua `client.send`.
- **Nguồn sự thật duy nhất là log của RefereeHost.** **Không dùng Colyseus Schema state** cho ván (room state để
  trống hoặc chỉ metadata ngoài ván như số người trong phòng) ⇒ không có hai nguồn trạng thái độc lập.
  Reconnect của Colyseus (`allowReconnection`) chỉ dùng như kênh mới; đồng bộ ván vẫn bằng `join` + snapshot ở trên.
- Idempotency, `expectedSeq`, xử lý hụt/trùng sự kiện là của ta (đã có test), không phụ thuộc Colyseus.

## 6. Từ điển gửi xuống máy người chơi (điểm 4)
- Mỗi trận ghim `pin = { dictHash, normVersion, rulesVersion }` trong `matchCreated`. `dictHash` là **hash nội dung**
  (FNV-1a 64 trên danh sách khóa đã chuẩn hóa + sắp xếp + danh sách từ hiếm) — không phải chuỗi phiên bản đặt tay.
  Client **bắt buộc** gửi pin khi `join` (LocalSession luôn gửi): thiếu ⇒ `joinRejected: pin-required`, lệch/thiếu trường ⇒ `joinRejected: pin-mismatch`, kèm pin đúng của trận (sau này: client tải đúng file
  `words.<hash>.json` bất biến rồi vào lại).
- **Đo thật** (`node data/build.mjs`, bản khởi đầu): **591 từ → 8.069 B JSON, gzip 3.111 B, brotli 2.841 B
  (5,26 B/từ gzip)**. Ngoại suy tuyến tính cho 5.000 từ ≈ **26 KB gzip** — sẽ đo lại khi đủ danh sách.
- Danh sách tự soạn ⇒ không vướng GPL. **Không có endpoint công khai thêm từ.** Từ người chơi gõ mà thiếu chỉ được
  ghi lại (localStorage; sau này gửi lên kèm trận) để người duyệt bổ sung thủ công vào `words-src.txt`.
- `blocklist.txt`: build **dừng** nếu từ điển chứa âm tiết/từ bị chặn (lọc cho trẻ em).

## 7. Hai quyết định đã chốt (điểm 6)
- **Chuẩn hóa (NORM_VERSION 1):** NFC → chữ thường → bỏ ký tự không phải chữ → gộp khoảng trắng → **tách dấu thanh
  khỏi từng âm tiết rồi đặt lại theo một luật cố định "kiểu cũ"** (mặc định của Unikey/bàn phím điện thoại):
  `hoà/hòa → hòa`, `khoẻ/khỏe → khỏe`, `thuý/thúy → thúy`; có phụ âm cuối hoặc nguyên âm có mũ/móc thì hai kiểu
  vốn giống nhau (`hoàng`, `thuyền`, `quý`, `người`). Từ hiển thị trong chuỗi là dạng chuẩn này.
- **"Không còn đường nối tiếp"** được tính **sau khi đã thêm từ vừa đánh vào danh sách đã dùng**
  (vd. `số ba → ba ba`: đường nối duy nhất của "ba" chính là "ba ba" ⇒ sau khi đánh là cụt). Kiểm tra ngay trong
  `validate` của lượt đánh; mặc định ⇒ `played` + `roundEnded(no-move)` cùng lúc, `noDeadEnd` ⇒ từ chối `dead-end`.

## 8. Test (điểm 5) — `npm test`, 56 test
- **Hợp đồng, 17 kịch bản × 2 backend** (`test/contract.test.mjs`): backend `process` chạy trọng tài trong
  **tiến trình Node riêng** (`test/referee-proc.mjs`, tự dựng từ điển của nó, chỉ trao đổi chuỗi JSON qua IPC);
  backend `inproc` là đường của bản offline. Giữa hai phía có đường truyền lỗi lập trình được (rơi / nhân đôi /
  giữ rồi thả muộn). Đồng hồ server và client tách riêng, lệch nhau ~995 s.
  Kịch bản: vào phòng + bù lệch giờ · từ bị từ chối không làm đối thủ hụt seq · **gửi trùng lệnh** · **mất ACK** ·
  mất cả lệnh lẫn ACK nhiều lần · expectedSeq cũ · **sự kiện trùng** · **sự kiện hụt** (xin snapshot, không chạy
  lại hiệu ứng) · **snapshot chồng lấn sự kiện đến muộn** · sự kiện đảo thứ tự · **sát deadline** (còn 1 ms nhận,
  đúng deadline thì không) · lệnh kẹt mạng quá deadline bị từ chối · từ cụt (3 trường hợp) · **rematch** (cần hai bên,
  lệnh trùng không thừa sự kiện, người thua đi trước) · **bot thay thế** (29 s không thay, 30 s thay, bot đánh đúng
  luật, người cũ lấy lại ghế ván sau) · đóng tab mở lại · lệch từ điển/token sai bị từ chối.
  Mỗi kịch bản kết thúc bằng kiểm tra chung: `fold(log) == state server == state từng client`, seq liên tục,
  không hiệu ứng nào chạy hai lần.
- **Kiểm tra chéo bằng cố ý gây lỗi**: tắt idempotency, bỏ lọc sự kiện trùng, nhận từ đúng deadline, thay bot ngay,
  bỏ expectedSeq, tính từ cụt trước khi trừ từ vừa dùng ⇒ mỗi lỗi đều làm 2–6 test đỏ.
- **Lõi** (`test/core.test.mjs`): chuẩn hóa, hash từ điển, luật, replay mọi loại sự kiện, AI đấu AI 200 ván
  (mọi nước hợp lệ, nước chậm nhất ~5 ms).
- **Hồi quy review code của Codex** (`test/regression.test.mjs`, 13 test — cả 12 test lỗi đều đỏ trên code cũ 86d69b4):
  (1) callback bot chạy trễ quá deadline (event loop nghẽn) ⇒ kiểm lại deadline + `validate` ngay lúc áp nước, xử thua hết giờ;
  (2) nhận `stale` với seq server mới hơn ⇒ client tự xin snapshot ngay, cả khi yêu cầu sync bị rơi (2 backend);
  (3) `dispose()` LocalSession đóng mọi client (cả 2 ghế hotseat) và `RefereeHost.dispose()` hủy mọi hẹn giờ ⇒ không tự đổi ghế/mở ván;
  (4) join thiếu/sai pin bị từ chối (trọng tài + 2 backend + LocalSession). Kèm: message hỏng (null) bị bỏ qua, `sync` khi chưa join bị từ chối.
- **LocalSession** (`test/local.test.mjs`): chơi với bot, đóng tab mở lại (clockReset), đổi từ điển ⇒ ván mới,
  hai người chung máy.

## 9. Bước 2 — giao diện (đã làm)
- `game.js` là gốc lắp ráp: import duy nhất `createDict` + `createLocalSession`; phần còn lại chỉ nói chuyện qua
  MatchSession. Đổi sang online = thay `createLocalSession` bằng `createOnlineSession`, UI không đổi.
- Đồng hồ: UI không giữ timer riêng; mỗi khung hình vẽ từ `session.remainingMs()` (số trên màn = ceil(ms/1000)).
- Tạm dừng = `session.dispose()` (trọng tài dừng thật); chơi tiếp = dựng lại từ nhật ký lưu (`clockReset`) ⇒ lượt
  dở được tính lại đủ 15 s. Ẩn tab / tắt màn hình giữa ván cũng tự tạm dừng.
- Chuỗi từ vẽ tăng dần; hiệu ứng chỉ chạy cho sự kiện mới, không chạy lại khi dựng từ snapshot.
- Nút “Nối” không dùng thuộc tính `disabled` (nút submit bị disabled chặn Enter trong ô nhập và làm mobile mất
  bàn phím) — dùng `aria-disabled`, lệnh gửi bị chặn trong `submit()`.
- Mobile: `interactive-widget=resizes-content` + `100dvh`; khung thấp (bàn phím ảo mở) chuyển bố cục gọn;
  khung chuỗi tự cuộn tới từ mới nhất khi đổi cỡ.
- E2E: `npm run test:e2e` (`test/browser/e2e.mjs`, tự dựng server tĩnh + Chrome headless qua CDP).

### 9.1 Gõ khi chưa bật bộ gõ tiếng Việt
- Lỗi chủ dự án gặp ("từ nào cũng báo không có trong từ điển"): không bật Unikey/bộ gõ ⇒ chữ đi vào là Telex thô
  ("hocj taapj"), VNI thô ("ho5c ta6p5") hoặc không dấu ("hoc tap") ⇒ mọi từ đều không khớp từ điển.
- `core/input.js` `guessWord(raw, dict, need)`: thử nguyên văn → Telex → VNI → bỏ dấu; **chỉ đổi khi ra đúng MỘT từ
  có trong từ điển và đúng tiếng nối**, không thì gửi nguyên chữ. Chữ đã có dấu được tôn trọng nguyên văn.
  Chỉ là trợ giúp nhập phía người chơi: trọng tài vẫn kiểm đầy đủ ⇒ không đổi luật, không mở đường gian lận.
- Từ lạ gõ không dấu ⇒ nhắc "bật bộ gõ tiếng Việt"; nhiều khả năng ⇒ liệt kê tối đa 3 từ.
- E2E đếm hẹn giờ của lớp phiên bằng cách bọc `setTimeout` (chỉ trong test) để chứng minh tạm dừng không để timer chạy ngầm.

## 10. Còn lại
- **Từ điển:** bản khởi đầu mới có 591 từ (ván máy-đấu-máy trung bình ~4 nước — quá ngắn; máy hay thắng bằng
  từ cụt). Cần mở rộng lên 3.000–5.000 từ và **người thật duyệt** nguồn gốc trước khi phát hành.
- Từ người chơi gõ mà thiếu đã được ghi cục bộ (`noi-tu:missing`) — chưa có đường gửi về để duyệt.
- ~~Chưa có adapter WebSocket thật~~ — đã có (mục 11). Bộ test hợp đồng gốc vẫn chạy qua transport bộ nhớ/tiến trình riêng;
  test mạng thật nằm ở `games-server/noi-tu/test/`.

## 11. Online 1v1 (bước 3) — WebSocket thuần thay vì Colyseus
- **Đổi so với mục 5:** dùng WebSocket thuần (`games-server/ma-soi/ws.js`, không thư viện ngoài) cùng tiến trình
  `server.js`, giống Ma Sói. Lý do: một máy chủ Railway duy nhất, không thêm phụ thuộc, và RefereeHost vốn đã lo hết
  idempotency / seq / snapshot nên Colyseus không thêm gì. Nguyên tắc mục 5 giữ nguyên: **log của RefereeHost là
  nguồn sự thật duy nhất**, tầng phòng chỉ chuyển tiếp.
- `host.js` = tầng phòng: `create {name}` → mã 5 ký tự + token ghế 0; `enter {code,name}` → ghế 1 và bắt đầu trận
  (người đi trước, seed ngẫu nhiên ở server); `resume {code,token}` → vào lại ghế (kết nối cũ bị thay, mã đóng 4000);
  `leave`. Chỉ `join / ping / sync / intent` được chuyển cho trọng tài, sau khi **làm sạch**: token luôn lấy từ kết
  nối (không tin token/seat client gửi), `commandId` `[\w-]{1,64}`, `type` ∈ submit/resign/rematch, `word` ≤ 40 ký
  tự, `expectedSeq` số nguyên. Lệnh sai hình dạng có commandId hợp lệ ⇒ trả `result {ok:false, reason:'bad-command'}`
  để client ngừng gửi lại.
- Giới hạn: khung ≤ 1 KB, 6 tin/giây (dồn tối đa 20), 16 kết nối + 4 phòng mỗi IP, tối đa 300 phòng, phòng không ai
  kết nối bị xoá sau 5 phút. Tên: bỏ ký tự điều khiển/định hướng, tối đa 16 ký tự, hiển thị bằng `textContent`.
- Rớt mạng: trọng tài chờ 30 giây (`graceMs`) rồi cho máy thay ghế; người cũ quay lại lấy lại ghế ở đầu ván sau.
- Mặc định bật; tắt bằng `NOITU_ONLINE=0`. Đã qua review độc lập của Codex (không lỗi chặn); 2 điểm nên sửa đã sửa
  kèm test hồi quy: ghế chưa từng join cũng được bot thay sau 30 giây (`RefereeHost.awaitJoin`), và lớp WebSocket
  dùng chung không còn đóng nhầm (1009) khi một lần ghi TCP gộp nhiều khung hợp lệ.
