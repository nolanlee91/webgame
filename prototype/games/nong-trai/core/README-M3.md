# Milestone 3: Xây dựng và bản đồ theo cấp (luật thuần)

Các file: `data/buildings.js`, `core/build.js`, `core/levels-map.js`. Test: `test/build.test.mjs`, `test/map.test.mjs`.
Không import `core/apply.js` / `core/state.js`. Chỉ đọc `data/levels.js` và `data/warehouse.js` (import `?v=m3`).
Test so khớp thêm với `data/workshop.js` và `data/animals.js` nếu hai file này có mặt.
Kho, ví, cấp người chơi được truyền vào như ở M2.

## Giao diện truyền vào
```js
wallet = { coins() -> number, spend(n) -> bool, earn(n) }   // build.js không gọi earn
inv    = { count(id), has(id, n), take(id, n) -> bool, add(id, n) -> { ok, overflow } }  // = bag(s) của core/inventory.js
ctx    = { level }
```
Thứ tự trừ: vật liệu trước (`inv.take`), xu sau (`wallet.spend`). Lỗi giữa chừng thì hoàn vật liệu bằng `inv.add`.
Hàm trả `{ ok: true, ... }` hoặc `{ err }`. Khi trả `err` thì không có gì bị đổi.

## Trạng thái (save): `b` có thể chính là `s`
```js
s.buildings   = { [id]: { level, done, startAt, readyAt } }  // level = level ĐÃ XONG (0 = đang xây lần đầu); done=false ⇒ đang xây/nâng, tới readyAt thì level+1
s.decor       = { [id]: n }        // túi trang trí: giữ nguyên field của M2 (chợ bán đồ trang trí vào đây)
s.decorPlaced = [{ id, slot }]     // MỚI: đồ đang đặt trên bản đồ (đặt ⇒ túi −1, cất ⇒ túi +1)
```
- Xưởng có id `"xuong"`, cùng id với M2 và nhiệm vụ `{ building: "xuong" }`.
- `.done` dùng được cho `quests.condMet`. `.level` (level đã xong) dùng được cho `animals.buildingLevel`: trong lúc xây chuồng thì level 0, nên chưa mua được con nào.
- Nhà, sạp chợ, bảng đơn (`prebuilt`) coi như level 1 khi không có bản ghi.
- Biển Làng và xe giao hàng (`auto`) hiện khi đủ cấp và không được lưu.
- Cối xay gió (`machine`) là hình của máy `coi-xay` trong `s.production`. build.js không xây và không thu tiền cho loại này.

## core/build.js
| Hàm | Ghi chú |
|---|---|
| `createBuild()` | Trả `{ buildings: {}, decor: {}, decorPlaced: [] }` |
| `buildingStatus(b, id, now, level, { production }?)` | Trả `"locked"`, `"available"`, `"building"`, `"done"` hoặc `"upgradeable"`. `upgradeable` chỉ xét cấp, không xét tiền |
| `startBuild(b, wallet, inv, id, now, ctx)` | `ms = 0` thì xong ngay (`instant: true`). Trả `{ ok, id, level, instant, readyAt, cost, materials }` |
| `startUpgrade(b, wallet, inv, id, now, ctx)` | Nâng 1 level. Trong lúc nâng, công trình vẫn dùng được ở level cũ |
| `tick(b, now)` / `finishIfReady(b, id, now)` | Ghi xong các công trình có `readyAt ≤ now`. Trả `[{ id, level, at }]`, mỗi công trình chỉ báo một lần |
| `levelOf`, `isBuilt`, `isBusy`, `nextStep` | Đọc theo thời gian: đã quá `readyAt` thì tính là xong, kể cả khi chưa `tick` |
| `affordError` / `canAfford(step, wallet, inv)` | Dùng cho UI: làm mờ nút, hiện "thiếu xu" hoặc "thiếu vật liệu" |
| `canStartBuild` / `canStartUpgrade` | Trả lý do không làm được, chưa xét tiền |
| `effects(b, now)` | Trả `{ warehouseTier, warehouseCap, workshopLevel, extraQueueSlots, chickenCap, cowCap, greenhousePlots, greenhouseNoWater, eastOpen, eastPlots, eastLots, marketFull, levels }` |
| `builtIds(b, now, level?)` | Id các công trình dùng được. Truyền `level` thì có cả loại `auto`. Dùng làm `ctx.buildings` cho production |
| `addDecor(b, id, n)` | Thêm vào túi. `placeDecor(b, id, slot, now, ctx)` / `removeDecor(b, slot)`: mỗi ô một món. Đồ cỡ `l` (giếng đá, cổng tre) chỉ đặt ở ô cỡ `l`. Ô phía Đông cần đã mở đất |
| `slotOpen(b, slot, now, level)` | Ô trang trí đã dùng được chưa |
| `sanitize(raw, now)` | Đọc được bản ghi Xưởng của M2 `{ level, readyAt, done }` (không có `startAt`, level là level đang xây). Không ghi xong công trình, để `tick` còn báo cho màn "Trong lúc bạn vắng" |
| `migrate({ warehouseTier }, now)` | Nếu `s.warehouse ≥ 1` thì Nhà kho tính là đã xây, level = tier + 1 |

Mã lỗi: `bad locked built not-built building max coins materials not-buildable slot slot-taken slot-empty slot-size no-decor bag-full`.

## core/levels-map.js
- `mapLayout({ build, level, now, production })` trả `{ bounds, eastOpen, fields, items, emptyLots, decor, decorSlots }`.
  - Mỗi món trong `items` (đã sắp theo y) có `view`, `sprite`, `rotor`, `level`, `upgrading`, `progress`, `remainingMs`, `next` (mốc kế tiếp: cấp, giá, vật liệu, thời gian) và `unlockLevel`.
  - `view` là một trong `locked`, `blueprint`, `scaffold`, `built`.
  - Toạ độ chuẩn hoá theo bản đồ 960×600. `(x, y)` là điểm neo đáy-giữa, khớp `anchor` của manifest.
  - Khi mở đất phía Đông, `bounds.w` đổi từ 1 thành 1,5.
- `unlocksAt(level)` trả `{ features (= data/levels.js, kèm milestone), build: [{ id, action: build|upgrade|appears|machine, toLevel }], decor }`. Dùng cho toast lên cấp.
- `unlockTable()` và `lotMenu(input, lotId)` dùng cho chế độ Xây.

## Ghép vào `apply()`
1. Trong `sync`, gọi `for (const f of build.tick(s, now)) events.push({ type: "buildingDone", ...f })`.
   Hàm này thay cho `workshop.sync`. **Không dùng song song** `workshop.buildWorkshop` / `upgradeWorkshop` / `sync`: hai bên hiểu `level` khác nhau.
   Bản ghi M2 `{ level: 1, done: false }` vừa tạo mà rơi vào `levelOf` của build.js sẽ bị hiểu là đang nâng lên level 2.
2. Thêm các action:

| action | handler | ghi chú |
|---|---|---|
| `startBuild { id }` | `build.startBuild(s, wallet(s), bag(s), a.id, now, { level: s.level })` | Khi `id === "xuong"`, giữ đoạn tặng Bếp sên của M2: `grantMachine(s.production, m.id, r.readyAt)` cho các máy `withWorkshop` |
| `startUpgrade { id }` | `build.startUpgrade(...)` | Thay cho `upgradeWorkshop` và `upgradeWarehouse` |
| `placeDecor { id, slot }` | `build.placeDecor(s, a.id, a.slot, now, { level: s.level })` | |
| `removeDecor { slot }` | `build.removeDecor(s, a.slot)` | |

   Event: `buildStarted` / `upgradeStarted`. Nếu `instant` thì đẩy thêm `buildingDone`.
   Nên thêm vào `invariantError`: `level ≤ maxLevel(id)` và mỗi ô trong `decorPlaced` là duy nhất.
3. Save thêm `decorPlaced`, còn `buildings` và `decor` đã có. Khi đọc thì chạy `Object.assign(s, build.sanitize({ buildings: d.buildings, decor: d.decor, decorPlaced: d.decorPlaced }, now))`.
   Nếu save chưa có M3 thì gộp thêm `build.migrate({ warehouseTier: s.warehouse }, now).buildings`.
   Lưu ý: `sanitize` chỉ giữ đồ trang trí có trong `DECOR` của data/buildings.js. Đó là 8 món, trùng với catalog.
4. Các nơi đang đọc nguồn khác cần đổi sang đọc `effects(s, now)` hoặc `builtIds(s, now, s.level)`:
   - **Sức chứa kho**: `inventory.capacity(s)` hiện là `WAREHOUSE[s.warehouse].cap`. Cách ít đụng code nhất: sau mỗi lần xây / nâng / tick thì gán `s.warehouse = effects(s).warehouseTier`. Nút "Nâng kho" gọi `startUpgrade { id: "nha-kho" }`.
   - **Ô hàng chờ**: `workshop.extraSlots(s)` vẫn đúng với cách đếm level của M3, vì level 2 cho ra 1 ô. Có thể thay bằng `effects(s, now).extraQueueSlots`.
   - **`workshop.ctxOf().buildings`**: hiện lọc theo `now >= readyAt`, nên sẽ sai trong lúc nâng có thời gian (công trình bị coi như chưa có). Dùng `builtIds(s, now, s.level)`.
   - **`progression` (mía cần `"nha-kinh"`)**: hiện viết `!!s.buildings?.["nha-kinh"]`, nên mía mở ngay khi bắt đầu xây nhà kính. Đổi thành `isBuilt(s, "nha-kinh", now)` hoặc `s.buildings["nha-kinh"]?.level >= 1`.
   - **Chăn nuôi (M4)**: `animals.defaultCapacity` đọc `.level` nên dùng được ngay. Cũng có thể truyền `capacity: k => k === "ga" ? eff.chickenCap : eff.cowCap`.
   - **Nhà kính**: lấy `greenhousePlots` (6, rồi 9) và `greenhouseNoWater`. **Ruộng phía Đông**: lấy `eastPlots` (9). Gợi ý thêm 9 ô vào `s.plots` với chỉ số 25..33.
   - **Chợ đầy đủ**: cờ `marketFull` bật khi Sạp chợ lên level 2 (cấp 3, 50 xu, tức thì). Lead quyết định có chặn chợ theo cờ này hay không.

## Việc cần chốt khi ghép
- **Nhà kho**: chưa xây thì vẫn có kho tạm 60 chỗ. Xây ở cấp 3 tốn 60 xu, tức thì, vẫn 60 chỗ. Lần xây này mở cảnh Nhà kho và các mốc nâng. Level L ứng với `WAREHOUSE[L-1]`.
  `data/levels.js` có "warehouse-upgrade" ở cấp 2, nhưng xây kho ("build-warehouse", §3) lại ở cấp 3. Vì vậy ở M3 mốc 90 chỗ mở từ cấp 3.
  Người đã nâng kho ở cấp 2 vẫn giữ mốc nhờ `migrate`. Nên chuyển hoặc bỏ dòng "warehouse-upgrade" ở cấp 2.
- **Xưởng**: số liệu theo `data/workshop.js`. Xây 150 xu, 1 phút, tặng Bếp sên. Nâng cấp 2 ở cấp 13: 1500 xu, tức thì, +1 ô.
- **Chưa có sprite nên chưa làm**: hàng rào đá (cấp 15), biển tên mạ vàng (cấp 20), khói / ống khói lò bánh, cờ hội (cấp 18), chuồng bò cấp 2 (dùng lại sprite cấp 1). Lô xây phía Đông `lo-dong` để trống cho nội dung sau.
