// Milestone 2 — Xưởng + Khu chợ ghép vào apply(): xây Xưởng, máy, hàng chờ, nhận (XP qua progression), chợ (bán / mua),
// một nguồn giá cho Nhà kho, di chuyển save v3 → v4, offline, đơn có thành phẩm, chuỗi A & C, nhiệm vụ tiến trình.
import test from "node:test";
import assert from "node:assert/strict";
import { apply } from "../core/apply.js?v=m17";
import { createState, loadSave, dump, SAVE_VERSION } from "../core/state.js?v=m17";
import { MARKET, CYCLE_MS } from "../core/market.js?v=m17";
import { workshopState, finishedJobs, finishedWhileAway } from "../core/workshop.js?v=m17";
import * as O from "../core/orders.js?v=m17";
import { used, capacity } from "../core/inventory.js?v=m17";
import { currentQuest } from "../core/quests.js?v=m17";
import { xpNeed } from "../core/progression.js?v=m17";
import { TUTORIAL } from "../data/quests.js?v=m17";
import { WORKSHOP } from "../data/workshop.js?v=m17";
import { RECIPE } from "../data/recipes.js?v=m17";
import { ITEM } from "../data/catalog.js?v=m17";
import { farmSave, KEY, V3_KEY, V3_BACKUP_KEY } from "../save.js?v=m17";
import { act, err, START } from "./helpers.mjs";

const MIN = 60_000, HOUR = 3600_000;
/** Người chơi cấp lv, nhiều xu, đã xong hướng dẫn. */
function player(lv = 4, coins = 2000, seed = 11, t = START) {
  const s = createState(t, seed);
  s.level = lv; s.coins = coins; s.quests.tut = TUTORIAL.length;
  act(s, { type: "tick" }, t);
  return s;
}
/** Có Xưởng đã xây xong (mốc t). */
function withWorkshop(lv = 4, t = START) {
  const s = player(lv, 2000, 11, t - 2 * MIN);
  act(s, { type: "buildWorkshop" }, t - 2 * MIN);
  act(s, { type: "tick" }, t);
  return s;
}
const memStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test("xây Xưởng: cấp 4, trừ xu theo data, giàn giáo theo thời gian (offline được), xong ⇒ báo 1 lần + Bếp sên đi kèm", () => {
  const low = player(3);
  assert.equal(workshopState(low, START), "locked");
  assert.equal(err(low, { type: "buildWorkshop" }), "workshop-level");
  const poor = player(4, WORKSHOP.cost - 1);
  assert.equal(workshopState(poor, START), "available");
  assert.equal(err(poor, { type: "buildWorkshop" }), "coins");
  const s = player(4, 500);
  const r = act(s, { type: "buildWorkshop" });
  assert.ok(r.events.some((e) => e.type === "buildStarted"));
  assert.equal(s.coins, 500 - WORKSHOP.cost);
  assert.equal(err(s, { type: "buildWorkshop" }), "built");
  assert.equal(workshopState(s, START + WORKSHOP.buildMs - 1), "building");
  assert.equal(err(s, { type: "buildMachine", machine: "coi-xay" }, START + 1000), "no-workshop");
  assert.equal(err(s, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, START + 1000), "building");
  // tắt trang qua mốc xây xong, mở lại
  const back = loadSave(dump(s, START + 1000), START + 10 * MIN);
  const t = act(back, { type: "tick" }, START + 10 * MIN);
  assert.deepEqual(t.events.filter((e) => e.type === "buildingDone").map((e) => e.id), ["xuong"]);
  assert.equal(act(back, { type: "tick" }, START + 11 * MIN).events.filter((e) => e.type === "buildingDone").length, 0, "chỉ báo 1 lần");
  assert.equal(workshopState(back, START + 10 * MIN), "done");
  assert.ok(back.production.machines["bep-sen"], "Bếp sên đi kèm Xưởng");
  assert.equal(err(back, { type: "buildMachine", machine: "bep-sen" }, START + 10 * MIN), "built");
  assert.equal(err(back, { type: "buildMachine", machine: "coi-xay" }, START + 10 * MIN), "locked", "Cối xay cấp 5");
  assert.equal(err(back, { type: "buildMachine", machine: "may-bo-sua" }, START + 10 * MIN), "locked", "máy của Milestone 4 không xây được");
});

test("enqueue / collect qua apply: trừ nguyên liệu lúc Bắt đầu, nhận XP qua progression (lên cấp), không nhận 2 lần", () => {
  const s = withWorkshop(4);
  s.inv = { "dau-tay": 6 };
  assert.equal(err(s, { type: "enqueue", machine: "bep-sen", recipe: "sot-ca-chua" }), "inputs");
  assert.deepEqual(s.inv, { "dau-tay": 6 });
  const q = act(s, { type: "enqueue", machine: "bep-sen", recipe: "mut-dau" });
  const job = q.events.find((e) => e.type === "jobQueued");
  assert.deepEqual(s.inv, { "dau-tay": 3 });
  assert.equal(job.endAt, START + RECIPE["mut-dau"].ms);
  assert.equal(err(s, { type: "collect", machine: "bep-sen", uid: job.uid }, job.endAt - 1), "not-ready");
  s.xp = xpNeed(4) - 1; // thiếu 1 XP lên cấp 5 ⇒ +8 XP lên cấp 5 (chưa tới cấp 6)
  const c = act(s, { type: "collect", machine: "bep-sen", uid: job.uid }, job.endAt);
  assert.ok(c.events.some((e) => e.type === "jobCollected" && e.item === "mut-dau" && e.xp === 8));
  assert.ok(c.events.some((e) => e.type === "levelUp" && e.level === 5 && e.unlocks.includes("Cối xay (trong Xưởng)")));
  assert.equal(s.inv["mut-dau"], 1);
  assert.equal(err(s, { type: "collect", machine: "bep-sen", uid: job.uid }, job.endAt + 1), "not-found", "không nhận 2 lần");
  assert.equal(err(s, { type: "collect", machine: "bep-sen", uid: "1" }), "bad");
  assert.equal(s.inv["mut-dau"], 1);
});

test("offline: xếp 2 việc, tua 5 giờ (lưu/tải), nhận đúng 2 ô; ô đang chờ khi kho đầy được giữ lại", () => {
  const s = withWorkshop(4);
  s.inv = { "dau-tay": 3, "ca-chua": 3, "ca-rot": 4 };
  act(s, { type: "enqueue", machine: "bep-sen", recipe: "mut-dau" });
  act(s, { type: "enqueue", machine: "bep-sen", recipe: "sot-ca-chua" }, START + 1000);
  assert.equal(err(s, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, START + 2000), "queue-full", "2 ô lúc mới xây");
  const later = START + 5 * HOUR;
  const back = loadSave(dump(s, START + 2000), later);
  assert.equal(finishedJobs(back, later), 2);
  assert.equal(finishedWhileAway(back, later), 2);
  const r = act(back, { type: "collectAll" }, later);
  assert.deepEqual(r.events.filter((e) => e.type === "jobCollected").map((e) => e.item), ["mut-dau", "sot-ca-chua"]);
  assert.equal(r.events.find((e) => e.type === "jobsCollected").xp, 8 + 6);
  assert.equal(err(back, { type: "collectAll" }, later + 1), "not-found");
  // kho đầy + giỏ tràn đầy ⇒ ô xong vẫn giữ, nhận được sau khi bán bớt
  back.inv = { "ca-rot": 4, "ca-chua": 60 }; back.overflow = { "ca-chua": 10 };
  const j = act(back, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, later).events.find((e) => e.type === "jobQueued");
  assert.equal(err(back, { type: "collect", machine: "bep-sen", uid: j.uid }, later + HOUR), "full");
  assert.equal(back.production.machines["bep-sen"].queue.length, 1);
  act(back, { type: "sell", id: "ca-chua", n: 15 }, later + HOUR); // giỏ tràn trước, rồi kho ⇒ còn 5 chỗ
  act(back, { type: "collect", machine: "bep-sen", uid: j.uid }, later + HOUR);
  assert.equal(back.inv["nuoc-ep-ca-rot"], 1);
});

test("một nguồn giá: Bán 1 / Bán hết ở Nhà kho, giỏ tràn và chợ dùng market.priceOf (±15 % / 3 giờ); đơn giữ thưởng gốc", () => {
  // tìm một chu kỳ cà chua lệch giá gốc
  let t = START;
  while (MARKET.priceOf("ca-chua", t) === 12) t += CYCLE_MS;
  const price = MARKET.priceOf("ca-chua", t);
  const s = player(4, 0, 3, t);
  s.inv = { "ca-chua": 5, "mut-dau": 2 }; s.overflow = {};
  const a = act(s, { type: "sell", id: "ca-chua", n: 1 }, t);
  assert.equal(a.result.coins, price);
  act(s, { type: "sell", id: "ca-chua" }, t);
  assert.equal(s.coins, 5 * price);
  s.inv = { "ca-chua": 60 }; s.overflow = { "ca-chua": 2 }; // kho đầy ⇒ giỏ tràn không tự vào kho
  assert.equal(act(s, { type: "sellOverflow" }, t).result.coins, 2 * price);
  s.inv = { "mut-dau": 2 };
  const m = act(s, { type: "marketSell", id: "mut-dau", n: 2 }, t);
  const ev = m.events.find((e) => e.type === "sold");
  assert.equal(ev.coins, 2 * MARKET.priceOf("mut-dau", t));
  assert.equal(ev.trend, MARKET.trend("mut-dau", t));
  assert.equal(err(s, { type: "marketSell", id: "mut-dau", n: 1 }, t), "empty-stock");
  assert.equal(err(s, { type: "marketSell", id: "van-go", n: 1 }, t), "bad");
  // "Bán hết nông sản" giữ lại thành phẩm cho đơn
  s.inv = { "ca-rot": 3, "mut-dau": 1 };
  act(s, { type: "sellAll" }, t);
  assert.deepEqual(s.inv, { "mut-dau": 1 });
  // đơn: thưởng tính từ giá gốc, không theo chợ
  const o = { type: "thuong", items: { "ca-chua": 2 }, mult: 1.2 };
  assert.equal(O.priceOrder(o).value, 24);
});

test("chợ mua: cấp mở, thức ăn vào kho (tính sức chứa), trang trí vào túi riêng, hạt giống chỉ trả lúc gieo", () => {
  const s = player(6, 1000);
  assert.equal(err(s, { type: "marketBuy", id: "thuc-an-gia-suc", n: 1 }), "locked");
  s.level = 7;
  const r = act(s, { type: "marketBuy", id: "thuc-an-gia-suc", n: 2 });
  assert.ok(r.events.some((e) => e.type === "bought" && e.coins === 144)); // 72 xu / bao từ Milestone 6 (56 ở M4)
  assert.equal(s.coins, 856);
  assert.equal(s.inv["thuc-an-gia-suc"], 2);
  assert.equal(used(s), 2);
  act(s, { type: "marketBuy", id: "ghe-tre", n: 1 });
  assert.deepEqual(s.decor, { "ghe-tre": 1 });
  assert.equal(s.inv["ghe-tre"], undefined);
  assert.equal(used(s), 2, "trang trí không tính sức chứa");
  assert.equal(err(s, { type: "marketBuy", id: "hat-ca-rot", n: 1 }), "plant-only");
  assert.equal(err(s, { type: "marketBuy", id: "den-long", n: 1 }), "locked");
  assert.equal(err(s, { type: "marketBuy", id: "ghe-tre", n: 1e6 }), "bad-count");
  s.coins = 10;
  assert.equal(err(s, { type: "marketBuy", id: "ghe-tre", n: 1 }), "coins");
  s.coins = 1000; s.inv = { "ca-chua": 60 }; s.overflow = { "ca-chua": 10 };
  assert.equal(err(s, { type: "marketBuy", id: "thuc-an-gia-suc", n: 1 }), "full");
  assert.equal(s.coins, 1000);
  // trang trí giữ qua lưu / tải
  assert.deepEqual(loadSave(dump(s, START), START).decor, { "ghe-tre": 1 });
});

test("di chuyển save v3 (Milestone 1) → v7: giữ mọi thứ, Xưởng trống, sao lưu v3 không xoá", () => {
  const m1 = createState(START, 4);
  Object.assign(m1, { v: 3, coins: 321, level: 4, xp: 20, inv: { "dau-tay": 7 } });
  delete m1.production; delete m1.decor;
  const raw3 = JSON.stringify(m1);
  const st = memStorage({ [V3_KEY]: raw3 });
  const save = farmSave(st);
  const first = save.initialize(START);
  assert.equal(first.migrated, true);
  assert.equal(first.from, "v3");
  assert.equal(st.getItem(V3_BACKUP_KEY), raw3);
  assert.equal(st.getItem(V3_KEY), raw3, "bản v3 gốc vẫn còn");
  const v4 = JSON.parse(st.getItem(KEY));
  assert.equal(v4.v, SAVE_VERSION);
  assert.equal(SAVE_VERSION, 7);
  const s = save.read(START + 1000).state;
  assert.equal(s.coins, 321); assert.equal(s.level, 4); assert.equal(s.xp, 20);
  assert.deepEqual(s.inv, { "dau-tay": 7 });
  assert.deepEqual(s.production, { machines: {} });
  assert.deepEqual(s.decor, {});
  assert.equal(workshopState(s, START), "available");
  assert.equal(save.read(START + 2000).migrated, false);
  // save rác cho Xưởng: máy lạ bị bỏ (máy Milestone 4 — Máy bơ sữa — giữ từ khi CURRENT_MILESTONE = 4), Bếp sên luôn đi kèm, readyAt kẹp
  const d = JSON.parse(dump(withWorkshop(4), START));
  d.production.machines["may-bo-sua"] = { level: 1, readyAt: 0, queue: [], nextUid: 1 };
  d.production.machines["nope"] = {};
  delete d.production.machines["bep-sen"];
  d.buildings.xuong.readyAt = START * 99;
  const l = loadSave(d, START);
  assert.deepEqual(Object.keys(l.production.machines).sort(), ["bep-sen", "may-bo-sua"]);
  assert.ok(l.buildings.xuong.readyAt <= START + WORKSHOP.buildMs);
  const d2 = JSON.parse(dump(withWorkshop(4), START)); d2.level = 2;
  assert.equal(loadSave(d2, START).buildings.xuong, undefined, "cấp chưa tới thì không có Xưởng");
});

test("máy trong Xưởng: Cối xay cấp 5 (trừ xu, thời gian xây), nâng Bếp sên +1 ô; Xưởng cấp 2 (cấp 13) ⇒ 5 ô", () => {
  const s = withWorkshop(5);
  const coins = s.coins;
  act(s, { type: "buildMachine", machine: "coi-xay" });
  assert.equal(s.coins, coins - 250);
  assert.equal(err(s, { type: "enqueue", machine: "coi-xay", recipe: "thuc-an-gia-suc" }, START + 1000), "building");
  s.inv = { ngo: 2 };
  act(s, { type: "enqueue", machine: "coi-xay", recipe: "thuc-an-gia-suc" }, START + 90_000);
  const up = act(s, { type: "upgradeMachine", machine: "bep-sen" }, START + 90_000);
  assert.ok(up.events.some((e) => e.type === "machineUpgraded" && e.slots === 3));
  assert.equal(err(s, { type: "upgradeWorkshop" }, START + 90_000), "workshop-level");
  s.level = 13; s.coins = 100_000; s.inv = { "ca-rot": 40 };
  act(s, { type: "upgradeMachine", machine: "bep-sen" }, START + 90_000);
  for (let k = 0; k < 4; k++) act(s, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, START + 90_000);
  assert.equal(err(s, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, START + 90_000), "queue-full", "tối đa 4 ô / máy");
  act(s, { type: "upgradeWorkshop" }, START + 90_000);
  assert.equal(err(s, { type: "upgradeWorkshop" }, START + 90_000), "max");
  act(s, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, START + 90_000);
  assert.equal(s.production.machines["bep-sen"].queue.length, 5, "Xưởng cấp 2: +1 ô ⇒ 5");
  assert.equal(err(s, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, START + 90_000), "queue-full");
});

test("đơn có thành phẩm: chỉ khi máy thật sự làm được, số lượng theo sức máy; kết hợp ≥ 1 thành phẩm, Bác Tư", () => {
  const none = player(5, 0, 9);
  for (let k = 0; k < 100; k++) {
    const o = O.generate(none, "ket-hop", START);
    assert.ok(Object.keys(o.items).every((id) => ITEM[id].cat === "nong-san"), "chưa có Xưởng ⇒ không đòi thành phẩm");
  }
  const s = withWorkshop(5);
  assert.deepEqual(O.orderableProducts(s, START), ["mut-dau", "sot-ca-chua", "nuoc-ep-ca-rot"]);
  assert.deepEqual(O.orderableProducts(s, START - 10 * MIN), [], "Xưởng đang xây thì chưa");
  let products = 0, chainC = false;
  for (let k = 0; k < 300; k++) {
    const o = O.generate(s, "ket-hop", START);
    const kinds = Object.keys(o.items);
    assert.ok(kinds.length >= 3 && kinds.length <= 4);
    assert.ok(kinds.some((id) => ITEM[id].cat === "thanh-pham"), "đơn kết hợp có thành phẩm");
    assert.equal(o.npc, "bac-tu");
    for (const id of kinds) if (ITEM[id].cat === "thanh-pham") { products++; assert.ok(o.items[id] <= O.productUnit(s, id), `${id} ${o.items[id]}`); }
    assert.ok(!kinds.includes("thuc-an-gia-suc"), "chưa có Cối xay");
    const r = O.generate(s, "thuong", START);
    if (r.items["ca-chua"] && r.items["sot-ca-chua"]) chainC = true;
  }
  assert.ok(products >= 300);
  assert.ok(chainC, "chuỗi C: có đơn thường cà chua + sốt cà chua");
  s.coins = 1000; act(s, { type: "buildMachine", machine: "coi-xay" });
  assert.ok(O.orderableProducts(s, START + 2 * MIN).includes("thuc-an-gia-suc"));
  assert.ok(!O.orderableProducts(s, START + 2 * MIN).includes("bot-gao"), "bột gạo cần lúa (cấp 6)");
  s.level = 8; act(s, { type: "buildMachine", machine: "lo-banh" }, START + 2 * MIN);
  const later = O.orderableProducts(s, START + 10 * MIN);
  assert.ok(later.includes("bap-rang") && !later.includes("banh-trung"), "bánh trứng cần trứng (Milestone 4)");
});

test("chuỗi A chơi được: dâu → mứt → giao đơn kết hợp của Bác Tư → đủ xu nâng Bếp sên; nhiệm vụ tiến trình nhận 1 lần", () => {
  const s = player(4, WORKSHOP.cost, 21);
  assert.equal(currentQuest(s).id, "xay-xuong");
  act(s, { type: "buildWorkshop" });
  const done = act(s, { type: "tick" }, START + WORKSHOP.buildMs);
  assert.ok(done.events.some((e) => e.type === "questDone" && e.id === "xay-xuong"));
  let t = START + WORKSHOP.buildMs;
  act(s, { type: "claimQuest", id: "xay-xuong" }, t);
  assert.equal(err(s, { type: "claimQuest", id: "xay-xuong" }, t), "quest-claimed");
  // trồng dâu thật trên ruộng, thu, làm mứt
  s.coins += 200;
  const plots = s.plots.map((p, i) => (p.open ? i : -1)).filter((i) => i >= 0).slice(0, 3);
  for (const i of plots) act(s, { type: "plant", i, crop: "dau-tay" }, t);
  t += 90_000; act(s, { type: "harvestAll" }, t);
  assert.equal(s.inv["dau-tay"], 3);
  act(s, { type: "enqueue", machine: "bep-sen", recipe: "mut-dau" }, t);
  t += RECIPE["mut-dau"].ms;
  act(s, { type: "collectAll", machine: "bep-sen" }, t);
  assert.equal(currentQuest(s).id, "lam-mut");
  act(s, { type: "claimQuest", id: "lam-mut" }, t);
  // lên cấp 5 ⇒ đơn kết hợp có mứt của Bác Tư xuất hiện (bỏ đơn để làm mới bảng)
  s.level = 5;
  let slot = -1;
  for (let k = 0; k < 200 && slot < 0; k++) {
    act(s, { type: "tick" }, t);
    slot = s.orders.slots.findIndex((x) => x.order?.type === "ket-hop" && x.order.items["mut-dau"]);
    if (slot < 0) { const i = k % s.orders.slots.length, x = s.orders.slots[i]; if (x.order) act(s, { type: "cancelOrder", slot: i, id: x.order.id, rev: x.rev }, t); t += 120_000; }
  }
  assert.ok(slot >= 0, "có đơn kết hợp đòi mứt dâu");
  const x = s.orders.slots[slot];
  assert.equal(x.order.npc, "bac-tu");
  for (const [id, q] of Object.entries(x.order.items)) s.inv[id] = Math.max(s.inv[id] || 0, q);
  const coinsBefore = s.coins;
  s.quests.tut = TUTORIAL.length + 3; s.quests.progress = 0; // nhảy tới "giao đơn kết hợp có thành phẩm"
  const d = act(s, { type: "deliver", slot, id: x.order.id, rev: x.rev }, t);
  assert.ok(d.events.some((e) => e.type === "delivered" && e.withProduct && e.npc === "bac-tu"));
  assert.ok(d.events.some((e) => e.type === "questDone" && e.id === "giao-ket-hop"));
  assert.ok(x.order === null || s.orders.slots[slot].order.id !== x.order.id);
  assert.ok(s.coins - coinsBefore >= x.order.coins);
  s.coins = Math.max(s.coins, 200);
  assert.ok(act(s, { type: "upgradeMachine", machine: "bep-sen" }, t).events.some((e) => e.type === "machineUpgraded" && e.slots === 3));
});

test("nhiệm vụ 'bán thành phẩm khi giá ↑' chỉ tính khi giá đang lên", () => {
  const s = withWorkshop(5);
  s.quests.tut = TUTORIAL.length + 4; s.quests.progress = 0;
  assert.equal(currentQuest(s).id, "ban-gia-len");
  let up = START, down = START;
  while (MARKET.trend("mut-dau", up) !== "↑") up += CYCLE_MS;
  while (MARKET.trend("mut-dau", down) === "↑") down += CYCLE_MS;
  s.inv = { "mut-dau": 2 };
  act(s, { type: "marketSell", id: "mut-dau", n: 1 }, down);
  assert.equal(s.quests.progress, 0);
  const r = act(s, { type: "marketSell", id: "mut-dau", n: 1 }, up);
  assert.ok(r.events.some((e) => e.type === "questDone" && e.id === "ban-gia-len"));
});

test("bất biến chung: hàng chờ vượt sức chứa / sửa tay bị apply chặn, trạng thái không đổi", () => {
  const s = withWorkshop(4);
  const m = s.production.machines["bep-sen"];
  for (let k = 0; k < 3; k++) m.queue.push({ uid: m.nextUid++, recipe: "mut-dau", startAt: START, endAt: START + 1 });
  const before = structuredClone(s);
  s.inv = { "ca-rot": 4 };
  const snap = structuredClone(s);
  const r = apply(s, { type: "enqueue", machine: "bep-sen", recipe: "nuoc-ep-ca-rot" }, START);
  assert.ok(r.err);
  assert.deepEqual(s, snap);
  assert.ok(before);
  assert.ok(used(s) <= capacity(s));
});
