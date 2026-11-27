// Test luật Khu chợ (core/market.js) + fuzz Xưởng/Chợ. Chạy: node --test prototype/games/nong-trai/test/market.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createMarket, CYCLE_MS, nextChangeAt, swing, seedId, RESALE_MIN_RATIO } from "../core/market.js?v=m16";
import * as P from "../core/production.js?v=m16";
import { ITEMS, ITEM as GOOD } from "../data/catalog.js?v=m16";
const GOODS = ITEMS.filter((it) => it.producer.kind !== "crop"); // món không phải nông sản (trước M2: data/goods.js)
import { RECIPES } from "../data/recipes.js?v=m16";
import { MACHINES } from "../data/machines.js?v=m16";

/** Kho / ví trong bộ nhớ, chỉ cho test (giống production.test.mjs). */
function memInv(init = {}, cap = Infinity) {
  const bag = { ...init };
  const total = () => Object.values(bag).reduce((a, b) => a + b, 0);
  return {
    bag,
    count: (id) => bag[id] || 0,
    has: (id, n) => (bag[id] || 0) >= n,
    take(id, n) { if (!Number.isInteger(n) || n <= 0 || (bag[id] || 0) < n) return false; bag[id] -= n; if (!bag[id]) delete bag[id]; return true; },
    add(id, n) { if (!Number.isInteger(n) || n <= 0 || total() + n > cap) return { ok: false, overflow: 0 }; bag[id] = (bag[id] || 0) + n; return { ok: true, overflow: 0 }; },
  };
}
function memWallet(coins = 0) {
  return { get value() { return coins; }, coins: () => coins, spend(n) { if (!(n >= 0) || coins < n) return false; coins -= n; return true; }, earn(n) { coins += n; } };
}

// Bản sao bảng §2.2 (không import data/crops.js của M1 — chợ nhận danh sách cây qua tham số).
const CROPS = [
  { id: "ca-rot", name: "Cà rốt", level: 1, seed: 2, sell: 6 },
  { id: "ca-chua", name: "Cà chua", level: 1, seed: 5, sell: 12 },
  { id: "dau-tay", name: "Dâu tây", level: 2, seed: 8, sell: 18 },
  { id: "ngo", name: "Ngô", level: 3, seed: 12, sell: 29 },
  { id: "bi-ngo", name: "Bí ngô", level: 4, seed: 20, sell: 47 },
  { id: "lua", name: "Lúa", level: 6, seed: 10, sell: 26 },
  { id: "mia", name: "Mía", level: 10, seed: 24, sell: 58 },
];
const M = createMarket({ crops: CROPS });
const T0 = 1_700_000_000_000;
const SELLABLE = [...CROPS.map((c) => c.id), ...GOODS.filter((g) => g.sell > 0).map((g) => g.id)];

test("giá tất định: cùng now ⇒ cùng giá, trong ±15 %, đổi giữa các chu kỳ", () => {
  for (const id of SELLABLE) {
    const b = M.basePrice(id), seen = new Set();
    for (let k = 0; k < 200; k++) {
      const now = T0 + k * CYCLE_MS + 12345;
      const p = M.priceOf(id, now);
      assert.equal(p, M.priceOf(id, now));
      assert.equal(p, createMarket({ crops: CROPS }).priceOf(id, now)); // không phụ thuộc trạng thái
      assert.equal(p, M.priceOf(id, Math.floor(now / CYCLE_MS) * CYCLE_MS)); // cả chu kỳ cùng giá
      assert.ok(Number.isInteger(p) && p >= 1);
      assert.ok(Math.abs(p - b) <= b * 0.15 + 1e-9, `${id} ${p} vs ${b}`);
      seen.add(p);
    }
    if (b >= 20) assert.ok(seen.size >= 5, `${id} gần như không đổi giá`);
  }
  for (let k = 0; k < 1000; k++) { const f = swing("x" + k, k); assert.ok(f >= -1 && f <= 1); }
  assert.equal(M.priceOf("van-go", T0), null);
  assert.equal(M.priceOf("khong-co", T0), null);
  assert.equal(M.priceOf(seedId("ca-rot"), T0), null);
});

test("trend + nextChangeAt", () => {
  const c = Math.floor(T0 / CYCLE_MS);
  assert.equal(nextChangeAt(T0), (c + 1) * CYCLE_MS);
  assert.equal(M.nextChangeAt((c + 1) * CYCLE_MS), (c + 2) * CYCLE_MS);
  assert.equal(nextChangeAt((c + 1) * CYCLE_MS - 1), (c + 1) * CYCLE_MS);
  let up = 0, down = 0;
  for (let k = 0; k < 100; k++) {
    const now = T0 + k * CYCLE_MS, p = M.priceOf("pho-mai", now), q = M.priceOf("pho-mai", now - CYCLE_MS);
    const t = M.trend("pho-mai", now);
    assert.equal(t, p > q ? "↑" : p < q ? "↓" : "·");
    if (t === "↑") up++; if (t === "↓") down++;
  }
  assert.ok(up > 10 && down > 10);
  assert.equal(M.trend("van-go", T0), "·");
  const board = M.board(T0);
  assert.equal(board.length, SELLABLE.length);
  assert.ok(board.every((r) => r.price === M.priceOf(r.id, T0)));
});

test("bán: kiểm số lượng, món tồn tại, có hàng; cộng xu theo giá lúc bán", () => {
  const inv = memInv({ "mut-dau": 3, "van-go": 2 }), w = memWallet(0);
  for (const n of [0, -1, 1.5, NaN, "2", 1e9]) assert.equal(M.sell(inv, w, "mut-dau", n, T0).err, "bad-count");
  assert.equal(M.sell(inv, w, "van-go", 1, T0).err, "bad");
  assert.equal(M.sell(inv, w, "khong-co", 1, T0).err, "bad");
  assert.equal(M.sell(inv, w, "mut-dau", 4, T0).err, "empty-stock");
  const r = M.sell(inv, w, "mut-dau", 2, T0);
  assert.equal(r.coins, 2 * M.priceOf("mut-dau", T0));
  assert.equal(w.value, r.coins);
  assert.equal(inv.count("mut-dau"), 1);
});

test("mua: cấp mở, đủ xu, kho đầy hoàn tác, hạt giống chỉ mua lúc gieo", () => {
  const inv = memInv({}, 3), w = memWallet(160);
  assert.equal(M.buy(inv, w, "thuc-an-gia-suc", 1, T0, { level: 6 }).err, "locked");
  assert.equal(M.buy(inv, w, "thuc-an-gia-suc", 3, T0, { level: 7 }).err, "coins");
  assert.equal(M.buy(inv, w, seedId("ca-rot"), 1, T0, { level: 7 }).err, "plant-only");
  assert.equal(M.buy(inv, w, "mut-dau", 1, T0, { level: 20 }).err, "bad");
  assert.equal(M.buy(inv, w, "thuc-an-gia-suc", 0, T0, { level: 7 }).err, "bad-count");
  const r = M.buy(inv, w, "thuc-an-gia-suc", 2, T0, { level: 7 });
  assert.deepEqual([r.coins, w.value, inv.count("thuc-an-gia-suc")], [144, 16, 2]); // 72 xu / bao (Milestone 6)
  const big = memInv({}, 1), w2 = memWallet(1000);
  assert.equal(M.buy(big, w2, "chau-hoa", 2, T0, { level: 20 }).err, "full");
  assert.equal(w2.value, 1000);
  // ví từ chối spend sau khi đã thêm hàng ⇒ hàng bị lấy lại
  const inv3 = memInv(), liar = { coins: () => 999, spend: () => false, earn() {} };
  assert.equal(M.buy(inv3, liar, "chau-hoa", 1, T0, { level: 20 }).err, "coins");
  assert.equal(inv3.count("chau-hoa"), 0);
  assert.deepEqual(M.catalogue({ level: 1 }).map((s) => s.id), [seedId("ca-rot"), seedId("ca-chua")]);
  assert.ok(M.catalogue().length > M.catalogue({ level: 7 }).length);
});

test("bất biến kinh tế: mua ≥ 1,6 × bán lại tối đa; không chuỗi mua-chế biến-bán nào có lời", () => {
  const rep = M.assertEconomy();
  assert.deepEqual(rep.violations, []);
  for (const s of Object.values(M.shop)) {
    assert.ok(s.buy >= RESALE_MIN_RATIO * M.maxSell(s.id), s.id);
    assert.ok(!M.sellable(s.id) || s.kind !== "seed");
  }
  // kiểm độc lập: với mọi chu kỳ trong 30 ngày, không món chợ bán nào bán lại được ≥ giá mua
  for (let k = 0; k < 240; k++) for (const s of Object.values(M.shop)) {
    const p = M.priceOf(s.id, T0 + k * CYCLE_MS);
    if (p !== null) assert.ok(p * RESALE_MIN_RATIO <= s.buy, s.id);
  }
  // bơ / phô mai từ thức ăn mua: lỗ
  assert.ok(rep.costs.bo > M.maxSell("bo"));
  assert.ok(rep.costs["pho-mai"] > M.maxSell("pho-mai"));
  // vì sao thức ăn 56 chứ không ~36 (mức 1,6× tối thiểu): 4 bao × 36 = 144 < bơ bán tối đa 212,75 ⇒ có lời.
  // 48 (bản M2) cũng không đủ từ Milestone 4: sữa 72 ⇒ bơ ≥ 1,25 × 144 = 180 ⇒ 4 × 48 = 192 < 185 × 1,15.
  assert.ok(2 * 2 * 36 < M.maxSell("bo"));
  assert.ok(2 * 2 * 48 < M.maxSell("bo"));
  // Milestone 6: Phiên chợ trả bơ / phô mai tới ×1,5 (hàng săn) ⇒ 56 không đủ (4 × 56 = 224 < 185 × 1,5) ⇒ 72.
  assert.ok(2 * 2 * 56 < M.maxSell("bo"));
  assert.equal(GOOD["thuc-an-gia-suc"].buy, 72);
});

test("chế biến tăng giá trị 1,25–1,45× so với bán thô (trừ thức ăn gia súc)", () => {
  for (const r of RECIPES) {
    if (r.id === "thuc-an-gia-suc") continue;
    const raw = Object.entries(r.inputs).reduce((t, [id, q]) => t + M.basePrice(id) * q, 0);
    const k = (M.basePrice(r.output) * r.qty) / raw;
    assert.ok(k >= 1.25 && k <= 1.45, `${r.id} ×${k.toFixed(2)}`);
  }
});

test("fuzz: vài nghìn thao tác ngẫu nhiên — xu ≥ 0, số món nguyên ≥ 0, không nhận 2 lần", () => {
  let seed = 12345;
  const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 2 ** 32; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const inv = memInv({ "ca-rot": 20, "ca-chua": 20, "dau-tay": 20, ngo: 20, lua: 10, "bi-ngo": 5, "trung-ga": 5, sua: 5, mia: 4 }, 200);
  const w = memWallet(3000), prod = P.createProduction(), ctx = { level: 20, buildings: ["nha-kinh"] };
  const items = [...SELLABLE, ...GOODS.map((g) => g.id), "khong-co"];
  const seenUids = new Set();
  let now = T0, ok = 0;
  for (let step = 0; step < 4000; step++) {
    now += Math.floor(rnd() * (rnd() < 0.05 ? 6 * 3600_000 : 90_000));
    const mid = pick(MACHINES).id;
    const n = pick([1, 2, 3, 0, -1, 1.5, 5]);
    let r;
    switch (Math.floor(rnd() * 8)) {
      case 0: r = P.buildMachine(prod, w, mid, now, ctx); break;
      case 1: r = P.upgradeMachine(prod, w, mid, now, ctx); break;
      case 2: case 3: r = P.enqueue(prod, inv, mid, pick(RECIPES).id, now, ctx); break;
      case 4: { const q = prod.machines[mid]?.queue; r = P.collect(prod, inv, mid, q?.length ? pick(q).uid : 1, now);
        if (r.ok) { const key = mid + "#" + r.job.uid; assert.ok(!seenUids.has(key), "nhận 2 lần " + key); seenUids.add(key); } break; }
      case 5: r = P.collectAll(prod, inv, now);
        if (r.ok) for (const c of r.collected) { const key = c.machine + "#" + c.uid; assert.ok(!seenUids.has(key)); seenUids.add(key); } break;
      case 6: r = M.sell(inv, w, pick(items), n, now); break;
      default: r = M.buy(inv, w, pick(items), n, now, ctx); if (rnd() < 0.3) for (const c of CROPS) inv.add(c.id, 1);
    }
    if (r.ok) ok++;
    assert.ok(Number.isSafeInteger(w.value) && w.value >= 0, "xu âm");
    for (const [id, q] of Object.entries(inv.bag)) assert.ok(Number.isInteger(q) && q >= 0, `${id}=${q}`);
    for (const [id, m] of Object.entries(prod.machines)) {
      assert.ok(m.queue.length <= m.slots, id);
      for (let i = 1; i < m.queue.length; i++) assert.ok(m.queue[i].startAt >= m.queue[i - 1].endAt, "chồng thời gian");
    }
  }
  assert.ok(ok > 200, `quá ít thao tác thành công: ${ok}`);
  assert.ok(seenUids.size > 20);
});
