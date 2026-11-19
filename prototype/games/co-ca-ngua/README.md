# Cờ Cá Ngựa — bản chơi thử (asset pixel art V4)

Chơi: chạy `PORT=8766 node server.js` ở gốc repo (có cả máy chủ online), mở `http://127.0.0.1:8766/games/co-ca-ngua/`.
Hai chế độ: **Chơi với máy** (bạn + 1–3 máy, không cần mạng) và **Online** (Tạo phòng / Vào phòng). Không còn chế độ "chơi chung 1 máy".
`?bot=1` (hoặc `?local=1` cũ) → thẳng phòng chờ chơi với máy; `?players=2|3|4&seed=N` → vào thẳng ván bạn + (N−1) máy, tái hiện cùng chuỗi xúc xắc.

- `logic.js` — luật thuần (không DOM), trạng thái sao chép được (structuredClone) để sau đưa lên server.
- `game.js` — vẽ canvas + điều khiển, theo hợp đồng `mount(el, ctx) -> { pause, resume, destroy }`. Vẽ bằng asset thật
  `assets/board.webp`, `quan-co.webp`, `xuc-xac.webp`; nếu ảnh không tải được thì tự quay về hình khối tạm (vẫn chơi được).
- `dice-throw.js` — quỹ đạo tung xúc xắc (thuần, `test/dice-throw.test.mjs`).
- `ai.js` — máy chọn nước đi (thuần): `botMove(g, rng)` + `makeRng(seed)`. Ưu tiên: thắng ván > vào/lên bậc chuồng đích > đá ngựa
  (ngựa đi càng xa càng đáng đá) > xuất ngựa khi gieo 6 > kéo ngựa đang bị dọa ra chỗ an toàn, tránh dừng ngay trước mũi đối thủ (1–6 ô,
  hoặc ô xuất phát của đối thủ còn ngựa trong chuồng) > ngựa đi xa nhất; rng chỉ để phá hoà. `pickMove` cũ trong `logic.js` giữ nguyên
  (máy chủ online dùng nó để đi thay người vắng).
- `test/logic.test.mjs` + `test/ai.test.mjs` + `test/dice-throw.test.mjs` — `npm test` (luật + 600 ván ngẫu nhiên; máy: luôn đi nước hợp lệ, đá khi được, ưu tiên vào chuồng / thắng,
  tránh ô nguy hiểm, cùng rng cùng nước, 180 ván toàn máy đều kết thúc có người thắng).
- `screenshots/e2e.mjs` — test trên Chrome headless bằng chuột/phím/chạm thật, quay video; có kiểm tra toạ độ từng ô so với màu trên ảnh bàn cờ.

## Chơi với máy
Màn vào → **Chơi với máy** → phòng chờ chọn 1/2/3 máy, **màu của bạn** (Đỏ / Xanh dương / Vàng / Xanh lá) + luật xuất ngựa → Chơi.
Màu nhớ qua `localStorage` `wgp.co-ca-ngua.botColor` (mặc định Đỏ; `?players=N` cũng dùng màu đã nhớ). Ghế dùng = `seatsFor(n, ghế bạn)` trong `game.js`:
các ghế theo chiều đi bắt đầu từ ghế bạn (2 người ngồi đối diện, 3 người bỏ ghế ngay trước bạn) ⇒ bạn luôn gieo trước; chọn Đỏ thì y hệt `SEATS_FOR`
của `logic.js` (luật / máy chủ không đổi). Máy cầm các phường còn lại;
thẻ người chơi ghi "Bạn" / "Máy", khay xúc xắc ghi "Máy sắp gieo…" / "Máy chọn ngựa". Tới lượt máy: máy chờ hoạt ảnh trước xong, ~0,45–0,7 s rồi
gieo, "nghĩ" 0,4–0,7 s rồi đi — đi bằng đúng đường của người (`applyRoll` / `applyMove` trong `game.js`) nên xúc xắc, bước nhảy, đá quân, về chuồng,
âm thanh y hệt. Trong lượt máy, bấm khay / chạm ngựa / Space / 1–4 đều bị bỏ qua. Tạm dừng (P, nút, hoặc chuyển tab) dừng cả máy.
Hết ván: bạn thắng → `thang`; máy thắng → `thua` (chép từ Cờ Caro), không phát nhạc thắng. Không lưu ván vào `localStorage` (chưa từng có ván
chung máy nào được lưu, nên không có gì phải chuyển đổi).

## Tung xúc xắc (kéo-thả, `dice-throw.js`)
- Tới lượt bạn: xúc xắc nằm trong **sân** của bạn (khối 5×5 ô ở góc chuồng cùng màu), sân có viền vàng chạy; 3 lần đầu hiện "KÉO ĐỂ TUNG".
  Rê chuột vào sân → con trỏ `grab`. Cầm xúc xắc (chuột / ngón tay; `touch-action: none` trên bàn nên kéo không cuộn trang), kéo đi rồi thả:
  vận tốc ~100 ms cuối lúc thả (`releaseVelocity`) quyết định hướng + lực. Chạm không kéo / chạm khay / Space / Enter → tung nhẹ hướng ngẫu nhiên.
- `simulateThrow({x, y, vx, vy, bounds, r, seed, reduced})` (thuần, có test): xúc xắc bay (độ cao + bóng), xoay, nảy trên mặt sân,
  dội mép sân (hệ số nảy ngẫu nhiên), chậm dần, xoay về góc vuông rồi nằm yên — luôn trong sân; mỗi lần một seed nên đường bay, số lần nảy,
  chỗ nằm khác nhau. `keepOut` = vùng tròn quanh ngựa còn đứng trong lán: xúc xắc dừng đè lên ngựa thì trong lúc nằm yên trượt sang chỗ trống gần nhất
  (`freeSpot`, cũng dùng cho chỗ xúc xắc chờ trước khi tung / khi ngựa bị đá về lán đứng đúng chỗ xúc xắc) — không bao giờ che ngựa. Khi bay mặt trên đổi liên tục; ~140 ms cuối và lúc nằm yên hiện **đúng mặt logic/máy chủ gieo** + vòng sáng vàng, số to nảy lên.
- Máy và người chơi online khác tung y như vậy trong sân của họ (không kéo được), để mình xem. Online: thả tay là gửi `roll` ngay và xúc xắc bay luôn;
  máy chủ báo mặt về thì đáp xuống mặt đó (về chậm thì xúc xắc nảy tiếp vài cú nhẹ, quá 5 s thì thôi).
- Tiếng: `do-xuc-xac` một lần lúc tung + mỗi lần nảy/dội mép phát một đoạn 90 ms của chính file đó, to nhỏ theo lực, cao độ ngẫu nhiên (log `do-xuc-xac:nay`); tắt tiếng thì im.
- `prefers-reduced-motion: reduce` → trượt ngắn ~0,25 s, không xoay, không nảy.

## Luật mặc định (chỉnh được qua `rules`)
2–4 phường, mỗi phường 4 ngựa. Gieo 6 mới xuất ngựa và được gieo thêm (`launchOn: [1, 6]` cho luật "1 hoặc 6").
Đi đúng số bước, không nhảy qua ngựa khác; dừng đúng ô đối thủ thì đá ngựa đó về chuồng; không dừng lên ngựa mình.
Hết vòng phải dừng đúng cửa chuồng đích; từ cửa gieo n vào bậc n; trong chuồng lên bậc k+1 phải gieo đúng k+1.
Ai đủ 4 ngựa trong chuồng đích trước thì thắng. 2 người ngồi đối diện (Đỏ – Vàng).

## Điều khiển
Gieo: kéo-thả xúc xắc trong sân mình, chạm sân/khay, hoặc Space/Enter. Chọn ngựa: chạm ngựa có vòng vàng dưới chân (hoặc chấm đích) hoặc phím 1–4; chỉ 1 nước thì tự đi. P: tạm dừng.

## Ghép asset (đã làm)
- Bàn cờ: cắt khung [165,5,950,950] của `board.webp`, vẽ 696×696. Ô trên ảnh không chia đều tuyệt đối nên tâm từng ô
  lấy theo số đo trên ảnh cho từng nhánh (`ART` trong `game.js`), không dùng lưới đều.
- Ảnh có góc chuồng xanh lá/vàng lệch so với nhánh cùng màu (góc xanh lá ở dưới-phải nhưng nhánh xanh lá ở trái; vàng ngược lại).
  Ngựa trong chuồng xuất phát được đặt theo **góc cùng màu** trên ảnh (`ART.seatCorner`). Ô xuất phát mỗi màu có khung "XP"
  tô màu để người chơi biết ngựa ra ô nào. Không đổi luật, không cần tạo lại ảnh.
- Ghế không chơi (2–3 người): góc chuồng bị phủ tối.
- Quân cờ: cắt 4 con ngựa theo màu từ `quan-co.webp`, có số 1–4 để chọn bằng phím.
- Xúc xắc: ảnh `xuc-xac.webp` chỉ có một mặt cố định, nên mặt trên được vẽ lại chấm theo số gieo được (đúng phối cảnh hình thoi).

## Âm thanh (`assets/sfx/`, Codex)
Phát bằng Web Audio, bắt thời điểm từ sự kiện của `logic.js` và hoạt ảnh (luật không đổi):
`do-xuc-xac` khi gieo · `buoc-nhay` mỗi lần ngựa đáp xuống một ô · `da-quan` khi đá ngựa đối thủ · `ve-chuong` khi ngựa vào/lên bậc chuồng đích ·
`thang` khi bạn thắng (sau tiếng về chuồng 0,3 giây) · `thua` khi máy thắng · online: người thua nghe `qua-man`. Tắt tiếng: nút "Âm thanh" dưới bàn hoặc phím M (nhớ qua `localStorage` `wgp.muted`;
game đọc `sdk.sound.muted`, core thật sẽ cấp giá trị này). Trình duyệt chỉ cho phát tiếng sau lần chạm/bấm phím đầu tiên.

## Chơi online (2–4 người, mỗi người một máy)
- Mở trang không có tham số → màn vào phòng: nhập tên → **Tạo phòng online** (nhận mã 5 ký tự + link `?room=MÃ`) hoặc nhập mã → **Vào phòng**,
  hoặc **Chơi với máy**.
- Máy chủ (`games-server/co-ca-ngua/`, WebSocket `/ws/co-ca-ngua`) giữ ván, **gieo xúc xắc bằng crypto**, kiểm tra đúng người / đúng pha / nước hợp lệ
  bằng chính `logic.js` (không sửa). Client chỉ gửi ý định (`roll`, `move{horse}`) và phát lại hành động máy chủ gửi về để có hoạt ảnh;
  lệch hoặc thiếu gói thì nhận nguyên trạng thái máy chủ.
- Chủ phòng chọn luật + bấm Bắt đầu (≥ 2 người). Rớt mạng: tự nối lại, giữ ghế (token trong `sessionStorage`, mỗi tab một người);
  tải lại trang vẫn vào lại đúng ghế. Người có lượt im lặng 30 s / mất kết nối 8 s / đã rời → máy chủ đi thay.
- **Trò chuyện trong phòng**: mọi ghế đã vào phòng nhắn được cho cả phòng (phòng chờ lẫn trong ván). Tin đi qua máy chủ, máy chủ gắn tên người gửi
  theo ghế (client không tự khai tên được), cắt ký tự điều khiển, tối đa 200 ký tự/tin, mỗi người 4 tin liền rồi ~0,7 tin/giây; chỉ giữ 40 tin gần nhất
  trong bộ nhớ của phòng (mất khi phòng đóng). Máy rộng ≥ 1360px: cột bên phải bàn; nhỏ hơn: nút **Chat** (có số tin chưa đọc) mở bảng nổi / trượt từ dưới.
- File: `online.js` + `online.css` (màn vào phòng, kết nối, ô chat), `game.js` (`ctx.online`, `netState`), `hud.js` (tên, chủ phòng, mất kết nối).
- Máy chủ mặc định **bật** (đã qua review Codex); tắt bằng `COCANGUA_ONLINE=0`. Chạy thử trên máy: `node games-server/co-ca-ngua/dev.js` → http://localhost:8767/games/co-ca-ngua/
- Test: `node --test --test-concurrency=1 games-server/co-ca-ngua/test/*.test.mjs` (máy chủ, 14 test) ·
  `PORT=8767 node prototype/games/co-ca-ngua/screenshots/online-e2e.mjs <thư mục>` (3 trình duyệt thật, 50 kiểm tra gồm chat; cần dev.js đang chạy).
- E2E chơi với máy: `PORT=8766 node prototype/games/co-ca-ngua/screenshots/e2e.mjs <thư mục>` (Chrome headless, chuột/phím/chạm thật, quay video).
