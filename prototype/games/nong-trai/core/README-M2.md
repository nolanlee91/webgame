# Milestone 2: Xưởng và Chợ (luật thuần)

Các file: `data/goods.js`, `data/machines.js`, `data/recipes.js`, `core/production.js`, `core/market.js`. Test nằm ở `test/production.test.mjs` và `test/market.test.mjs`.
Các module này không import gì của M1. Kho, ví và cấp người chơi được truyền vào qua tham số.

## Giao diện truyền vào

```js
inv    = { count(id), has(id, n), take(id, n) -> bool, add(id, n) -> { ok, overflow }, canAdd?(id, n) -> bool }
wallet = { coins() -> number, spend(n) -> bool, earn(n) }
ctx    = { level, buildings?: string[], extraSlots?: number }
```
`add` phải **nguyên tử**. `ok: true` nghĩa là đã nhận đủ n món (phần vào giỏ tràn ghi ở `overflow`). `ok: false` nghĩa là không thêm món nào.
Nếu có `canAdd` thì hàm này được gọi trước `add`.

Mọi hàm trả `{ ok: true, ... }` hoặc `{ err }`. Khi trả `err` thì không có gì bị đổi.

## core/production.js
| Hàm | Ghi chú |
|---|---|
| `createProduction()` | Trả `{ machines: {} }` |
| `buildMachine(prod, wallet, id, now, ctx)` | Kiểm cấp / `requires` (Nồi đường cần `"nha-kinh"` trong `ctx.buildings`). Trừ `buildCost`. Máy dùng được từ `readyAt = now + buildMs` |
| `upgradeMachine(prod, wallet, id, now, ctx)` / `nextUpgrade(prod, id)` | Mỗi lần nâng: +1 ô, level +1, tối đa 4 ô. Nâng xong ngay, không có thời gian chờ |
| `enqueue(prod, inv, id, recipeId, now, ctx)` | Trừ nguyên liệu ngay lúc bấm. Trả `{ ok, job: { uid, recipe, startAt, endAt } }` |
| `collect(prod, inv, id, uid, now)` | Chỉ nhận ô đã xong. Kho không nhận thì trả `err: "full"` và giữ ô lại. Trả `{ item, qty, xp, overflow }` |
| `collectAll(prod, inv, now, id?)` | Nhận mọi ô đã xong, dừng khi kho đầy. Trả `{ collected, xp, full }` |
| `status(prod, now, ctx)` | Theo từng máy: `{ built, buildRemaining, running: { uid, recipe, remaining }, finished, waiting, free, slots, nextDoneAt }` |
| `canBuild` / `canEnqueue` / `capacity` / `isBuilt` | Dùng cho giao diện (làm mờ nút, hiện lý do) |
| `sanitize(raw, now)` | Dùng khi đọc save. Bỏ máy / công thức lạ và uid trùng, tính lại `endAt` theo dữ liệu, kẹp các mốc thời gian nằm ở tương lai |

Mã lỗi (`ERR`): `bad locked requires built not-built building wrong-machine machine-level queue-full inputs coins max not-found not-ready full`.

## core/market.js
`const market = createMarket({ crops: CROPS })`. Tham số `crops` là `CROPS` của `data/crops.js`, cần các trường `{ id, name, seed, sell, level }`.
- `priceOf(id, now)`, `trend(id, now)` (trả `↑ ↓ ·`), `nextChangeAt(now)`, `board(now)`. Giá dao động ±15 %, đổi sau mỗi chu kỳ 3 giờ, tính tất định từ `now`. Đơn hàng vẫn dùng giá gốc.
- `catalogue(ctx)`: danh sách chợ bán. Hạt giống có `kind: "seed"`; thức ăn, vật liệu, trang trí lấy giá `buy` từ `data/goods.js`.
- `sell(inv, wallet, id, n, now)` và `buy(inv, wallet, id, n, now, ctx)`. `n` phải là số nguyên từ 1 đến 999. Mua hạt giống thì trả `"plant-only"`, vì hạt được trả tiền lúc gieo (action `plant` của M1).
- `assertEconomy()` trả `{ ok, violations, costs }`.

## Ghép vào `apply(state, action, now)` của M1
Trong `core/apply.js`, mỗi handler làm việc trên bản nháp `s`. Cần làm ba việc:
1. Viết adapter cho kho dựa trên `core/inventory.js`: `count` và `has` dùng `have(s, id)`, `take` gọi `take()` rồi trả `true`, `canAdd` dùng `canAdd(s, id, n)`, `add` gọi `canAdd` rồi `add()` và trả `{ ok, overflow: overflowed }`.
2. Viết adapter cho ví: `coins: () => s.coins`, `spend: n => (s.coins >= n ? (s.coins -= n, true) : false)`, `earn: n => { s.coins += n; s.stats.earned += n; }`.
3. Tạo `ctx = { level: s.level, buildings: s.buildings ?? [], extraSlots: s.workshopLevel >= 2 ? 1 : 0 }`.

| action | handler |
|---|---|
| `buildMachine { machine }` | `P.buildMachine(s.production, wallet, a.machine, now, ctx)` |
| `upgradeMachine { machine }` | `P.upgradeMachine(...)` |
| `enqueue { machine, recipe }` | `P.enqueue(s.production, inv, a.machine, a.recipe, now, ctx)` |
| `collect { machine, uid }` | `P.collect(...)`, sau đó cộng `r.xp` qua `progression` (lên cấp, sự kiện) |
| `collectAll { machine? }` | `P.collectAll(...)`, sau đó cộng `r.xp` |
| `marketSell { id, n }` | `market.sell(inv, wallet, a.id, a.n, now)`. Có thể thay `eco.sell` của M1 bằng hàm này khi chợ đầy đủ ra mắt (M1 đang bán theo giá cố định) |
| `marketBuy { id, n }` | `market.buy(inv, wallet, a.id, a.n, now, ctx)` |

Mỗi handler nên đẩy một event, ví dụ `machineBuilt`, `jobQueued`, `jobCollected`, `sold`, `bought`. Bất biến chung của `apply` (xu ≥ 0, số món nguyên ≥ 0) đã bao phủ các action này.

**Save v3 cần thêm:** `production` (khởi tạo bằng `createProduction()`, khi đọc thì chạy `sanitize(raw, now)`). Có thể thêm `buildings` và `workshopLevel` nếu M3 chưa thêm. Không cần lưu field nào cho `market`, vì giá được suy ra từ thời gian.
Phần "Trong lúc bạn vắng" lấy từ `status(prod, now)[id].finished`.

## Việc cần chốt khi ghép
- `data/items.js` của M1 đã có sẵn các món này với cùng id và cùng giá bán. Có thể gộp `buy`, `shopLevel`, `uses` vào đó rồi bỏ `data/goods.js`.
- `data/items.js` của M1 ghi producer của Bánh flan là `"lo-banh-2"`. Ở M2, Bánh flan nằm ở `lo-banh` và cần máy level 2.
- Vật liệu và trang trí mua về đi vào `inv.add`. Trong M1, vật liệu không tính vào sức chứa; trang trí chưa có trong `ITEM` nên `canAdd` sẽ từ chối. Cần thêm trang trí vào `ITEM`, hoặc chuyển trang trí sang một túi riêng ở M3.
