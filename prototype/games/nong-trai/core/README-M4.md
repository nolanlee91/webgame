# Milestone 4: Chăn nuôi, Làng, NPC, nhiệm vụ (luật thuần)

Các file: `data/animals.js`, `data/village.js`, `core/animals.js`, `core/village.js`. Test nằm ở `test/animals.test.mjs` và `test/village.test.mjs`.
Không file nào import `core/apply.js` / `core/state.js`. Kho, ví, cấp người chơi, công trình được truyền vào giống M2:

```js
inv    = { count(id), has(id, n), take(id, n) -> bool, add(id, n) -> { ok, overflow }, canAdd?(id, n) -> bool }  // = bag(s) của core/inventory.js
wallet = { coins() -> number, spend(n) -> bool, earn(n) }
ctx    = { level, seed?, buildings?, capacity?(kind) -> number, hasBuilding?(id) -> bool }
io     = { inv, wallet, decor? }   // decor = { add(id, n) } túi trang trí (s.decor). Không có ⇒ trang trí thưởng đi qua inv.add
```
Mọi hàm trả `{ ok: true, ..., events }` hoặc `{ err }`. Khi trả `err` thì không có gì bị đổi. `events` là các sự kiện để handler đẩy vào danh sách chung (`ev.push(...r.events)`).
XP **không** được cộng bên trong module: kết quả có trường `xp`, handler cộng qua `addXp(s, r.xp, ev)` như `production.collect`.

## core/animals.js
Save: `animals = { list: [{ uid, kind, fedAt, readyAt }], nextUid }`. `kind` là `"ga"` hoặc `"bo"` (khớp `producer.kind = "animal"` trong `data/catalog.js`).
Trạng thái `"hungry" | "producing" | "ready"` **không lưu**, mà suy ra từ timestamp bằng `stateOf(a, now)`, nên offline bao lâu cũng đúng.
Lưu ý: id vật nuôi `"bo"` (bò) không phải món `"bo"` (Bơ). Kho chỉ nhận `ANIMAL[kind].product`.

| Hàm | Ghi chú |
|---|---|
| `createAnimals()` | `{ list: [], nextUid: 1 }` |
| `buyAnimal(farm, wallet, kind, now, ctx)` | Kiểm cấp (gà 7, bò 9), chuồng (sức chứa > 0), sức chứa, xu. Con mới ở trạng thái đói. Lỗi: `bad locked no-housing capacity coins` |
| `feed(farm, inv, uid, now)` | Chỉ khi đói. Trừ thức ăn ngay lúc cho ăn (`inv.take`). Lỗi: `not-found not-hungry feed` |
| `collect(farm, inv, uid, now)` | Chỉ khi chín. Kho đầy thì trả `full` và sản phẩm vẫn nằm trên con vật. Thu xong con vật về trạng thái đói, nên không thu 2 lần được. Trả `{ item, qty, xp, overflow }` |
| `feedAll(farm, inv, now, kind?)` | Cho ăn mọi con đang đói. Thiếu 2 bao cho bò thì vẫn cho gà ăn (`short: true`). Lỗi: `none` (không con nào đói), `feed` (không đủ cho con nào) |
| `collectAll(farm, inv, now, kind?)` | Dừng khi kho đầy. Trả `{ collected, items, xp, full }` |
| `status(farm, now, ctx)` | `{ list: [{ uid, kind, state, remaining, readyAt, sprite }], kinds: { ga/bo: { count, capacity, unlocked, hungry, producing, ready, nextReadyAt, feedNeeded } } }` |
| `spriteOf(a, now)` | `{ sheet: "animals", frame, bubble, flip }`: ăn 2 giây sau khi cho ăn, đôi khi đi tại chỗ, có bong bóng trứng / sữa / đói |
| `readyWhileAway(farm, lastSeen, now)` | `{ "trung-ga": n, sua: n }` cho màn "Trong lúc bạn vắng" |
| `capacity(kind, ctx)` / `defaultCapacity` / `buildingLevel` / `canBuy` / `countOf` / `stateOf` | Dùng cho giao diện |
| `sanitize(raw, now)` | Bỏ loại lạ, uid trùng hoặc hỏng, mỗi loại tối đa `HARD_MAX` (12) con. Tính lại `readyAt = fedAt + cycleMs`. `fedAt` nằm ở tương lai thì kẹp về `now` |

### Sức chứa và M3
`capacity(kind, ctx)`:
1. Nếu có `ctx.capacity(kind)` thì dùng hàm này. M3 nên cấp nó từ `effects()` của công trình, ví dụ `kind => effects(s).animalCap?.[kind] ?? 0`.
2. Nếu không, đọc level chuồng từ `ctx.buildings`, chấp nhận dạng `{ "chuong-ga": 1 | {level: 2} | true }` (giống `s.buildings` của M1), mảng hoặc Set. Sau đó tra `ANIMAL[kind].capacityByLevel`: gà `[6, 8, 10]`, bò `[4, 6]`. Chuồng chưa xây cho ra 0, nên không mua được.
3. Kết quả luôn được kẹp vào khoảng `0..HARD_MAX`.

Chuồng **đang xây** phải trả 0, hoặc không có mặt trong `buildings`. M3 tự lo điều này. Nếu M3 hạ cấp chuồng, các con đã có vẫn giữ nguyên, chỉ không mua thêm được.

## core/village.js
Save: `village = { friends: {npc: {points, lastTalkAt, talks}}, prog: {i, progress}, chains: {npc: {step, progress}}, board: {slots: [{uid, tpl, progress}], nextUid, seq} }`.

| Hàm | Ghi chú |
|---|---|
| `createVillage()` / `sanitize(raw, now)` | |
| `syncVillage(vs, ctx)` | Lấp bảng lặp lại khi làng mở (từ cấp 6). Gọi trong `sync()` của apply. Trả events `boardRefilled` |
| `track(vs, events, ctx)` | Gọi **sau** handler, cạnh `quests.track` của M1, với toàn bộ `events` của action. Trả các sự kiện mới (`villageQuestDone {scope, id, title, npc?, uid?}`, `friendUp`) để đẩy thêm vào danh sách |
| `claimProgression(vs, id, io, ctx)` | Nhiệm vụ tiến trình M4, làm tuần tự |
| `claimChainStep(vs, npc, step, io, ctx)` | `step` phải đúng bước hiện tại, nên phải đi đúng thứ tự và không nhận 2 lần. Bước "trao tay" kiểm và trừ hàng lúc bấm nhận. Nhận bước cuối thì có thêm sự kiện `chainComplete` |
| `claimBoard(vs, uid, io, ctx)` | Nhận xong thì ô bị xoá và được lấp bằng mẫu mới, không trùng mẫu đang có trên bảng, chọn tất định theo `ctx.seed + seq` |
| `talk(vs, npc, now, ctx)` | `{ line, points, friendship: {points, index, name, next}, chain: {title, intro, step, quest} | null }`. Câu thoại xoay vòng. Trò chuyện cộng +1 thân thiết, tối đa 1 lần mỗi 4 giờ cho mỗi NPC |
| `questLog(vs, ctx, inv?)` | Dữ liệu cho sổ nhiệm vụ: `progression`, `progressionNext`, `chains[]`, `board[]`, `friends[]`. Mỗi nhiệm vụ có `progress/count/claimable/reward`; bước trao tay có thêm `give: [{id, need, have}]` |
| `truckVisit(now, lastDeliveryAt, { level }?)` | Hoạt cảnh xe của Anh Út sau khi giao đơn: `arrive` 1,4 s → `load` 1,6 s → `leave` 1,4 s → `idle`. Trả `{ phase, t, pos (0 → 0.5 cổng → 1), remaining, frame, driver, fx }`. Dưới cấp 11 luôn trả `idle` |
| `matches(cond, e)` / `asM1Quest(q)` / `friendLevel(p)` / `currentProgression` / `currentChainStep` | Hàm phụ |

Thân thiết là phần trang trí, không có hiệu ứng kinh tế. Điểm cộng như sau: trò chuyện +1 (4 giờ mới được 1 lần), giao đơn của NPC đó +2, nhận một bước chuỗi +5. Các mốc: Mới quen 0, Quen biết 10, Thân quen 30, Thân thiết 60. Điểm tối đa là 999.

### Định dạng nhiệm vụ và tương thích M1
Định dạng M4 là **siêu tập** của `TUTORIAL` M1 (`{ id, title, hint, event, count, reward, level? }`) và thêm các trường:
`match: {field: value | [values]}`, `hasItem: [ids]` (lấy từ `e.items`), `amount: "qty" | "count"` (cộng giá trị trường đó thay vì +1), `building: id` (điều kiện trạng thái), `give: {id: n}` (trao tay), `steps: [...]` (các bước trong một nhiệm vụ, phải đúng thứ tự), `minLevel` (cấp để nhiệm vụ bắt đầu đếm), `reward.decor`.
`core/quests.js` của M1 chỉ đếm `e.type === q.event`, mỗi sự kiện +1, nên **không chạy được** các trường mở rộng. Vì vậy M4 chạy engine riêng (`track`) song song với M1, không sửa M1.
`asM1Quest(q)` đổi được những nhiệm vụ đơn giản (chỉ có 1 event, không lọc) sang định dạng M1; các nhiệm vụ còn lại trả `null`. Ngược lại, `matches()` đọc được nhiệm vụ M1.

## Ghép vào `apply(state, action, now)`
```js
const inv = bag(s), wallet = { coins: () => s.coins, spend: n => s.coins >= n ? (s.coins -= n, true) : false, earn: n => { s.coins += n; s.stats.earned += n; } };
const ctx = { level: s.level, seed: s.seed, buildings: s.buildings, capacity: k => M3.animalCapacity(s, k), hasBuilding: id => M3.isBuilt(s, id, now) };
const io = { inv, wallet, decor: { add: (id, n) => { s.decor[id] = (s.decor[id] || 0) + n; } } };
const run = (r) => { if (r.ok) { ev.push(...r.events); if (r.xp) addXp(s, r.xp, ev); } return r; };
```
| action | handler |
|---|---|
| `buyAnimal { kind }` | `run(A.buyAnimal(s.animals, wallet, a.kind, now, ctx))` |
| `feedAnimal { uid }` | `run(A.feed(s.animals, inv, a.uid, now))` |
| `feedAll { kind? }` | `run(A.feedAll(s.animals, inv, now, a.kind))` |
| `collectAnimal { uid }` | `run(A.collect(s.animals, inv, a.uid, now))` |
| `collectAllAnimals { kind? }` | `run(A.collectAll(s.animals, inv, now, a.kind))` |
| `talkNpc { npc }` | `run(V.talk(s.village, a.npc, now, ctx))`. Kết quả (`line`, `chain`) trả cho giao diện qua `result` |
| `claimProgressQuest { id }` | `run(V.claimProgression(s.village, a.id, io, ctx))` |
| `claimChainStep { npc, step }` | `run(V.claimChainStep(s.village, a.npc, a.step, io, ctx))` |
| `claimBoardQuest { uid }` | `run(V.claimBoard(s.village, a.uid, io, ctx))` |

Trong `apply()`:
- Trong `sync()`, gọi `ev.push(...V.syncVillage(s.village, ctx))`.
- Sau handler, gọi `quests.track(draft, events)` (M1) rồi `events.push(...V.track(draft.village, events, ctx))`. Gọi **một lần** cho mỗi action, kể cả `tick` (nhiệm vụ `building` hoàn thành khi công trình xây xong lúc offline).
- `invariantError` đã bao phủ xu và kho. Có thể kiểm thêm `animals.list.length` theo loại ≤ `HARD_MAX`.

**Save v3 cần thêm:** `animals` (khởi tạo bằng `createAnimals()`, khi đọc chạy `A.sanitize(raw, now)`), `village` (`createVillage()` / `V.sanitize(raw, now)`), `lastDeliveryAt` (cho `truckVisit`, gán `now` khi có sự kiện `delivered`). Cần thêm `decor` nếu M2/M3 chưa thêm.

### Sự kiện game phải phát để nhiệm vụ đếm đúng
| type | trường cần | nguồn |
|---|---|---|
| `harvested` | `crop` | M1, đã có. Mỗi ô một sự kiện |
| `planted` | | M1, đã có |
| `sold` | `count` (tổng số món), `items` | M1, đã có. **Chợ M2 (`marketSell`) cũng phải phát `sold { count, items }`** |
| `delivered` | `npc`, `orderType`, **`items: {...order.items}`** | M1 hiện **chưa có `items`**: cần thêm vào `core/orders.js deliver()`. Không có `items` thì các nhiệm vụ "đơn có trứng/sữa" và "đơn kết hợp có bánh" không bao giờ được tính |
| `jobCollected` | `machine`, `recipe`, `item`, `qty` | Handler `collect` / `collectAll` của M2 (README-M2 gợi ý tên này). collectAll phải phát **một sự kiện cho mỗi ô** |
| `animalBought` / `animalFed` / `animalCollected` | `kind`, `item`, `qty` | Có sẵn trong `r.events` của core/animals.js |
| `npcTalked` | `npc` | `r.events` của `talk` |

Nhiệm vụ xây chuồng dùng điều kiện trạng thái (`hasBuilding`), không phụ thuộc vào tên sự kiện của M3.

## Câu hỏi mở khi ghép
1. **`delivered.items`**: cần thêm vào `orders.deliver` (1 dòng). Nếu không thêm, 3 nhiệm vụ nói trên bị kẹt.
2. **Tên sự kiện Xưởng**: M4 dùng `jobCollected {item, qty}`. Nếu M2 đặt tên khác, đổi `event` trong `data/village.js` (chỉ đổi dữ liệu).
3. **Thứ tự với hướng dẫn M1**: nhiệm vụ tiến trình M4 bắt đầu theo `minLevel` (7+), chạy song song với hướng dẫn M1 (đã xong ở cấp 3). Có cần chặn tới khi `quests.tut === TUTORIAL.length` không?
4. **Bảng đơn có trứng / sữa**: bộ sinh đơn của M1 phải đưa `trung-ga`/`sua` vào đơn sau khi người chơi có gà / bò. `cropUnlocked` hiện chỉ biết cây trồng.
5. **Túi trang trí**: thưởng trang trí hiếm (đèn lồng, bù nhìn, giếng đá, cổng tre) đi qua `io.decor`. Nếu M2/M3 cho `inv.add` tự chuyển trang trí vào túi thì có thể bỏ `io.decor`.
6. **Hiệu ứng thân thiết**: hiện không có tác dụng kinh tế. Có thể dùng `friendLevel` để mở câu thoại, hoặc tăng nhẹ thưởng đơn của NPC đó ở M5.
7. **XP khi thu sản phẩm**: gà +2, bò +5 mỗi lần thu. §2.4 không ghi XP cho vật nuôi, đây là số đề xuất.
