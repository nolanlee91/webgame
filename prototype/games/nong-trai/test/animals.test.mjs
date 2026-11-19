// Test luật Khu chăn nuôi (core/animals.js, Milestone 4). Chạy: node --test prototype/games/nong-trai/test/animals.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as A from "../core/animals.js?v=m5";
import { ANIMALS, ANIMAL, FEED, HARD_MAX, HOUSING } from "../data/animals.js?v=m5";
import { RECIPE } from "../data/recipes.js?v=m5";
import { ITEM } from "../data/catalog.js?v=m5";

const T0 = 1_700_000_000_000, MIN = 60_000, HOUR = 3600_000;

/** Kho trong bộ nhớ: cap = tổng số món tối đa; add nguyên tử. */
function memInv(init = {}, cap = Infinity) {
  const bag = Object.fromEntries(Object.entries(init).filter(([, q]) => q > 0));
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
const ctx = (level = 20, buildings = { "chuong-ga": 1, "chuong-bo": 1 }) => ({ level, buildings });

function farmWith(kinds, now = T0) {
  const f = A.createAnimals(), w = memWallet(1e6);
  for (const k of kinds) assert.ok(A.buyAnimal(f, w, k, now, ctx()).ok);
  return f;
}

test("dữ liệu: đúng bảng §2.4, sản phẩm có trong kho, sprite có trong manifest", async () => {
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(await readFile(new URL("../assets/v3/manifest.json", import.meta.url), "utf8"));
  const frames = new Set(manifest.sheets.animals.frames.map((f) => f.id));
  assert.deepEqual(ANIMALS.map((a) => [a.id, a.level, a.buy, a.feed, a.cycleMs, a.product, a.qty, a.capacityByLevel[0]]),
    [["ga", 7, 60, 1, 4 * MIN, "trung-ga", 1, 6], ["bo-sua", 9, 180, 2, 8 * MIN, "sua", 1, 4]]);
  assert.equal(FEED, "thuc-an-gia-suc");
  assert.ok(ITEM[FEED] && ITEM["trung-ga"] && ITEM.sua);
  assert.equal(HOUSING["chuong-ga"], "ga");
  assert.equal(HOUSING["chuong-bo"], "bo-sua");
  for (const a of ANIMALS) {
    for (const id of [...a.sprite.idle, ...a.sprite.eat, ...a.sprite.walk, a.sprite.bubbleReady, a.sprite.bubbleHungry]) assert.ok(frames.has(id), id);
    assert.ok(a.capacityByLevel.every((c) => c <= HARD_MAX));
  }
  // chống lời: mua thức ăn ở chợ để nuôi không lời hơn bán sản phẩm
  for (const a of ANIMALS) assert.ok(ITEM[FEED].buy * a.feed > ITEM[a.product].sell * a.qty, a.id);
});

test("mua: cấp mở, chuồng, sức chứa, giá", () => {
  const f = A.createAnimals();
  assert.equal(A.buyAnimal(f, memWallet(1000), "ga", T0, ctx(6)).err, "locked");
  assert.equal(A.buyAnimal(f, memWallet(1000), "bo-sua", T0, ctx(8)).err, "locked");
  assert.equal(A.buyAnimal(f, memWallet(1000), "ga", T0, ctx(7, {})).err, "no-housing");
  assert.equal(A.buyAnimal(f, memWallet(1000), "bo-sua", T0, ctx(9, { "chuong-ga": 1 })).err, "no-housing");
  assert.equal(A.buyAnimal(f, memWallet(1000), "voi", T0, ctx()).err, "bad");
  assert.equal(A.buyAnimal(f, memWallet(59), "ga", T0, ctx(7)).err, "coins");
  assert.equal(f.list.length, 0);
  const w = memWallet(60 * 7);
  for (let i = 0; i < 6; i++) assert.ok(A.buyAnimal(f, w, "ga", T0, ctx(7)).ok);
  assert.equal(w.value, 60);
  assert.equal(A.buyAnimal(f, w, "ga", T0, ctx(7)).err, "capacity");
  assert.equal(w.value, 60);
  // chuồng gà level 2 (M3) ⇒ 8 chỗ
  assert.ok(A.buyAnimal(f, w, "ga", T0, ctx(7, { "chuong-ga": { level: 2 } })).ok);
  assert.equal(w.value, 0);
  // capacity() tiêm vào từ M3 được ưu tiên, kẹp HARD_MAX
  assert.equal(A.capacity("ga", { level: 20, capacity: () => 999 }), HARD_MAX);
  assert.equal(A.capacity("ga", { level: 20, capacity: () => NaN }), 0);
  assert.equal(A.capacity("bo-sua", { level: 20, buildings: ["chuong-bo"] }), 4);
  assert.equal(A.capacity("bo-sua", { level: 20, buildings: { "chuong-bo": 5 } }), 6);
  const f2 = A.createAnimals(), w2 = memWallet(10_000);
  for (let i = 0; i < 4; i++) assert.ok(A.buyAnimal(f2, w2, "bo-sua", T0, ctx(9)).ok);
  assert.equal(A.buyAnimal(f2, w2, "bo-sua", T0, ctx(9)).err, "capacity");
  assert.equal(w2.value, 10_000 - 4 * 180);
  assert.deepEqual(f2.list.map((a) => a.uid), [1, 2, 3, 4]);
});

test("cho ăn → sản xuất → thu: đúng thời gian, trừ thức ăn 1 lần", () => {
  const f = farmWith(["ga", "bo-sua"]);
  const inv = memInv({ [FEED]: 3 });
  const [g, b] = f.list;
  assert.equal(A.stateOf(g, T0), "hungry");
  assert.equal(A.collect(f, inv, g.uid, T0).err, "not-ready");
  const r = A.feed(f, inv, g.uid, T0);
  assert.ok(r.ok);
  assert.equal(r.readyAt, T0 + 4 * MIN);
  assert.deepEqual(r.events, [{ type: "animalFed", kind: "ga", uid: g.uid, feed: 1 }]);
  assert.equal(inv.count(FEED), 2);
  assert.equal(A.feed(f, inv, g.uid, T0 + 1000).err, "not-hungry"); // không cho ăn 2 lần
  assert.equal(inv.count(FEED), 2);
  assert.equal(A.collect(f, inv, g.uid, T0 + 4 * MIN - 1).err, "not-ready");
  assert.equal(A.stateOf(g, T0 + 4 * MIN), "ready");
  assert.equal(A.feed(f, inv, g.uid, T0 + 4 * MIN).err, "not-hungry"); // đang có trứng thì không cho ăn
  const c = A.collect(f, inv, g.uid, T0 + 4 * MIN);
  assert.ok(c.ok);
  assert.equal(c.item, "trung-ga");
  assert.equal(c.xp, 2);
  assert.equal(inv.count("trung-ga"), 1);
  assert.equal(A.collect(f, inv, g.uid, T0 + 4 * MIN).err, "not-ready"); // không thu 2 lần
  assert.equal(inv.count("trung-ga"), 1);
  assert.equal(A.stateOf(g, T0 + 10 * HOUR), "hungry"); // không tự sản xuất khi không cho ăn
  // bò: 2 bao, 8 phút
  assert.ok(A.feed(f, inv, b.uid, T0).ok);
  assert.equal(inv.count(FEED), 0);
  assert.equal(A.collect(f, inv, b.uid, T0 + 8 * MIN - 1).err, "not-ready");
  assert.equal(A.collect(f, inv, b.uid, T0 + 8 * MIN).item, "sua");
  // thiếu thức ăn
  assert.equal(A.feed(f, inv, b.uid, T0 + 9 * MIN).err, "feed");
  assert.equal(A.feed(f, memInv({ [FEED]: 1 }), b.uid, T0 + 9 * MIN).err, "feed");
  assert.equal(A.feed(f, inv, 999, T0).err, "not-found");
  assert.equal(A.feed(f, inv, g.uid, NaN).err, "bad");
});

test("offline: vắng 3 ngày ⇒ sản phẩm chín đúng 1 lần, status theo timestamp", () => {
  const f = farmWith(["ga", "ga", "bo-sua"]);
  const inv = memInv({ [FEED]: 10 });
  A.feedAll(f, inv, T0);
  const later = T0 + 3 * 24 * HOUR;
  const st = A.status(f, later, ctx());
  assert.deepEqual(st.list.map((x) => x.state), ["ready", "ready", "ready"]);
  assert.equal(st.kinds.ga.ready, 2);
  assert.equal(st.kinds["bo-sua"].ready, 1);
  assert.deepEqual(A.readyWhileAway(f, T0 + MIN, later), { "trung-ga": 2, sua: 1 });
  const r = A.collectAll(f, inv, later);
  assert.deepEqual(r.items, { "trung-ga": 2, sua: 1 });
  assert.equal(r.xp, 2 * 2 + 5);
  assert.equal(A.collectAll(f, inv, later).err, "none");
  // giữa chừng
  A.feedAll(f, inv, later);
  const mid = A.status(f, later + 5 * MIN, ctx());
  assert.deepEqual(mid.list.map((x) => x.state), ["ready", "ready", "producing"]);
  assert.equal(mid.list[2].remaining, 3 * MIN);
  assert.equal(mid.kinds["bo-sua"].nextReadyAt, later + 8 * MIN);
  assert.equal(mid.list[0].sprite.bubble, "bong-bong-trung");
  assert.equal(mid.list[2].sprite.bubble, null);
});

test("kho đầy: sản phẩm vẫn nằm trên con vật, thu được sau khi có chỗ", () => {
  const f = farmWith(["ga", "ga"]);
  const inv = memInv({ [FEED]: 2 }, 2);
  A.feedAll(f, inv, T0);
  assert.equal(inv.count(FEED), 0);
  inv.add("ca-rot", 2); // đầy
  const t = T0 + 5 * MIN;
  assert.equal(A.collect(f, inv, 1, t).err, "full");
  assert.equal(A.collectAll(f, inv, t).err, "full");
  assert.equal(A.stateOf(f.list[0], t), "ready");
  inv.take("ca-rot", 1);
  const r = A.collectAll(f, inv, t);
  assert.equal(r.collected.length, 1);
  assert.equal(r.full, true);
  assert.equal(A.stateOf(f.list[1], t), "ready");
  // kho có canAdd từ chối ⇒ cũng full, không gọi add
  let called = false;
  const strict = { ...memInv({}), canAdd: () => false, add() { called = true; return { ok: true, overflow: 0 }; } };
  assert.equal(A.collect(f, strict, 2, t).err, "full");
  assert.equal(called, false);
});

test("feedAll: thiếu thức ăn cho bò vẫn cho gà ăn; không ai đói ⇒ none", () => {
  const f = farmWith(["bo-sua", "ga", "bo-sua"]);
  const inv = memInv({ [FEED]: 3 });
  const r = A.feedAll(f, inv, T0);
  assert.deepEqual(r.fed, [1, 2]);
  assert.equal(r.feed, 3);
  assert.equal(r.short, true);
  assert.equal(inv.count(FEED), 0);
  assert.equal(A.feedAll(f, inv, T0).err, "feed");
  assert.equal(A.feedAll(f, memInv({ [FEED]: 9 }), T0, "ga").err, "none");
  assert.equal(A.feedAll(f, inv, T0, "voi").err, "bad");
});

test("chuỗi B đầu–cuối: ngô → thức ăn → gà → trứng (+ lúa → bột gạo) → bánh trứng", () => {
  // Stub Xưởng: trừ nguyên liệu theo data/recipes.js, ra thành phẩm ngay (thời gian máy đã test ở production.test.mjs).
  const craft = (inv, id) => {
    const r = RECIPE[id];
    for (const [k, q] of Object.entries(r.inputs)) if (!inv.has(k, q)) return false;
    for (const [k, q] of Object.entries(r.inputs)) inv.take(k, q);
    return inv.add(r.output, r.qty).ok;
  };
  const inv = memInv({ ngo: 2, lua: 2 }), w = memWallet(120);
  assert.ok(craft(inv, "thuc-an-gia-suc"));
  assert.equal(inv.count(FEED), 3);
  assert.ok(craft(inv, "bot-gao"));
  const f = A.createAnimals();
  assert.ok(A.buyAnimal(f, w, "ga", T0, ctx(8)).ok);
  assert.ok(A.buyAnimal(f, w, "ga", T0, ctx(8)).ok);
  assert.equal(w.value, 0);
  assert.equal(A.feedAll(f, inv, T0).fed.length, 2);
  assert.equal(craft(inv, "banh-trung"), false); // chưa có trứng
  assert.deepEqual(A.collectAll(f, inv, T0 + 4 * MIN).items, { "trung-ga": 2 });
  assert.ok(craft(inv, "banh-trung"));
  assert.deepEqual(inv.bag, { [FEED]: 1, "banh-trung": 1 });
});

test("sanitize: rác, uid trùng, loại lạ, đồng hồ lùi, readyAt sửa tay", () => {
  for (const raw of [null, 1, "x", [], { list: 5 }, { list: [null, 3, {}] }]) assert.deepEqual(A.sanitize(raw, T0), { list: [], nextUid: 1 });
  const s = A.sanitize({ nextUid: -4, list: [
    { uid: 3, kind: "ga", fedAt: T0 - MIN, readyAt: T0 + 99 * HOUR }, // readyAt sửa tay ⇒ tính lại
    { uid: 3, kind: "ga", fedAt: null },                               // trùng
    { uid: 4, kind: "voi" },                                           // lạ
    { uid: 1.5, kind: "ga" }, { uid: -1, kind: "bo-sua" },                 // uid hỏng
    { uid: 7, kind: "bo", fedAt: T0 + 50 * HOUR },                     // id cũ "bo-sua" ⇒ "bo-sua"; tương lai ⇒ kẹp về now
    { uid: 9, kind: "bo-sua", fedAt: "abc", readyAt: 1 },              // fedAt hỏng ⇒ đói
    { uid: 10, kind: "__proto__" },
  ] }, T0);
  assert.deepEqual(s.list, [
    { uid: 3, kind: "ga", fedAt: T0 - MIN, readyAt: T0 + 3 * MIN },
    { uid: 7, kind: "bo-sua", fedAt: T0, readyAt: T0 + 8 * MIN },
    { uid: 9, kind: "bo-sua", fedAt: null, readyAt: null },
  ]);
  assert.equal(s.nextUid, 10);
  const many = A.sanitize({ list: Array.from({ length: 40 }, (_, i) => ({ uid: i + 1, kind: "ga" })) }, T0);
  assert.equal(many.list.length, HARD_MAX);
  // sạch rồi sanitize lại không đổi
  assert.deepEqual(A.sanitize(JSON.parse(JSON.stringify(s)), T0), s);
});

test("fuzz: vài nghìn thao tác ngẫu nhiên — xu ≥ 0, số món nguyên ≥ 0, không thu 2 lần, err không đổi gì", () => {
  let seed = 12345;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32);
  for (let run = 0; run < 6; run++) {
    const f = A.createAnimals(), w = memWallet(Math.floor(rnd() * 800)), inv = memInv({ [FEED]: Math.floor(rnd() * 10) }, 15);
    let now = T0, level = 5 + Math.floor(rnd() * 8);
    const blds = {};
    const produced = { "trung-ga": 0, sua: 0 };
    let feedUsed = 0;
    for (let k = 0; k < 800; k++) {
      now += Math.floor(rnd() * 3 * MIN);
      const c = { level, buildings: blds };
      const snap = JSON.stringify([f, w.value, inv.bag]);
      const pick = Math.floor(rnd() * 9);
      const uid = 1 + Math.floor(rnd() * (f.nextUid + 1));
      let r;
      if (pick === 0) r = A.buyAnimal(f, w, rnd() < 0.6 ? "ga" : "bo-sua", now, c);
      else if (pick === 1) { r = A.feed(f, inv, uid, now); if (r.ok) feedUsed += r.feed; }
      else if (pick === 2) { r = A.collect(f, inv, uid, now); if (r.ok) produced[r.item] += r.qty; }
      else if (pick === 3) { r = A.feedAll(f, inv, now); if (r.ok) feedUsed += r.feed; }
      else if (pick === 4) { r = A.collectAll(f, inv, now); if (r.ok) for (const [i, q] of Object.entries(r.items)) produced[i] += q; }
      else if (pick === 5) { inv.add(FEED, 1 + Math.floor(rnd() * 3)); continue; }
      else if (pick === 6) { const id = Object.keys(inv.bag)[0]; if (id) inv.take(id, 1); continue; }
      else if (pick === 7) { blds[rnd() < 0.5 ? "chuong-ga" : "chuong-bo"] = 1 + Math.floor(rnd() * 3); level = Math.min(20, level + 1); w.earn(Math.floor(rnd() * 100)); continue; }
      else { Object.assign(f, A.sanitize(JSON.parse(JSON.stringify(f)), now)); r = { ok: true }; }
      if (r.err) assert.equal(JSON.stringify([f, w.value, inv.bag]), snap, `err ${r.err} đổi trạng thái`);
      assert.ok(Number.isFinite(w.value) && w.value >= 0);
      for (const q of Object.values(inv.bag)) assert.ok(Number.isInteger(q) && q > 0);
      for (const def of ANIMALS) assert.ok(A.countOf(f, def.id) <= HARD_MAX);
      assert.equal(new Set(f.list.map((a) => a.uid)).size, f.list.length);
      for (const a of f.list) assert.ok(a.uid < f.nextUid);
    }
    // bảo toàn: mỗi sản phẩm thu được cần đúng 1 lần cho ăn ⇒ không thu 2 lần
    const feeds = produced["trung-ga"] * ANIMAL.ga.feed + produced.sua * ANIMAL["bo-sua"].feed;
    assert.ok(feeds <= feedUsed, `thu ${JSON.stringify(produced)} nhưng chỉ dùng ${feedUsed} bao`);
  }
});

// ---------- Sửa M4: id bò, giá một nguồn, cân bằng ----------
import { productValue, PROPOSED_SELL, LEGACY_KIND, PRODUCER_OF } from "../data/animals.js?v=m5";
import { ITEMS as ITEMS4, ANIMAL_REF } from "../data/catalog.js?v=m5";

test("id bò sữa = bo-sua, không trùng id món nào trong kho (bo = Bơ); save cũ kind \"bo\" ⇒ bo-sua", () => {
  assert.equal(ANIMAL.bo, undefined);
  assert.equal(ITEM.bo.name, "Bơ");
  for (const a of ANIMALS) assert.equal(ITEM[a.id], undefined, `id vật nuôi ${a.id} trùng món kho`);
  assert.deepEqual(LEGACY_KIND, { bo: "bo-sua" });
  assert.equal(PRODUCER_OF.sua, "bo-sua");
  assert.equal(PRODUCER_OF["trung-ga"], "ga");
  const s = A.sanitize({ nextUid: 3, list: [{ uid: 1, kind: "bo", fedAt: T0, readyAt: 0 }, { uid: 2, kind: "ga", fedAt: null }] }, T0 + MIN);
  assert.deepEqual(s.list.map((a) => a.kind), ["bo-sua", "ga"]);
  assert.equal(s.list[0].readyAt, T0 + 8 * MIN);
  assert.deepEqual(A.producibleGoods(s), { sua: 1, "trung-ga": 1 });
  assert.equal(A.buyAnimal(A.createAnimals(), memWallet(1e4), "bo", T0, ctx()).err, "bad", "không mua bằng id cũ");
});

test("giá một nguồn: sản phẩm đọc data/catalog.js, giá mua / thức ăn / chu kỳ đọc ANIMAL_REF", () => {
  for (const a of ANIMALS) {
    assert.equal(productValue(a.id), ITEM[a.product].sell);
    const ref = ANIMAL_REF.find((r) => r.id === a.ref);
    assert.ok(ref, a.ref);
    assert.deepEqual([a.level, a.buy, a.feed, a.cycleMs, a.product, a.qty], [ref.level, ref.buy, ref.feed, ref.cycleMs, ref.output, ref.qty]);
  }
  assert.equal(productValue("voi"), 0);
});

/** Kiểm như MARKET.assertEconomy() (mua thức ăn ở chợ → nuôi → bán / chế biến phải LỖ ở giá chợ cao nhất) với bảng giá `sell`. */
function feedLoop(sell) {
  const feedBuy = ITEM[FEED].buy, bad = [];
  const maxSell = (id) => (sell[id] ?? ITEM[id].sell) * 1.15;
  const cost = { [FEED]: feedBuy };
  for (const a of ANIMALS) {
    cost[a.product] = (feedBuy * a.feed) / a.qty;
    if (!(maxSell(a.product) * a.qty < feedBuy * a.feed)) bad.push(`${a.id}: ${feedBuy * a.feed} ≤ ${maxSell(a.product) * a.qty}`);
  }
  for (const r of Object.values(RECIPE)) { // công thức chỉ dùng trứng / sữa / thức ăn mua (các đầu vào khác không mua được ⇒ bỏ qua)
    if (!Object.keys(r.inputs).every((id) => cost[id] !== undefined)) continue;
    const total = Object.entries(r.inputs).reduce((t, [id, q]) => t + cost[id] * q, 0);
    if (!(maxSell(r.output) * r.qty < total)) bad.push(`${r.id}: ${total} ≤ ${maxSell(r.output) * r.qty}`);
  }
  return bad;
}

test("cân bằng: giá trứng 32 / sữa 72 (đã áp vào catalog) làm vật nuôi đáng nuôi mà thức ăn mua 56 vẫn luôn lỗ (kể cả MARKET.assertEconomy thật)", async () => {
  assert.deepEqual(PROPOSED_SELL, { "trung-ga": 32, sua: 72 });
  for (const [id, v] of Object.entries(PROPOSED_SELL)) assert.equal(ITEM[id].sell, v, `catalog.js ${id}`);
  assert.equal(ITEM[FEED].buy, 56);
  assert.deepEqual(feedLoop({}), [], "giá hiện tại");
  assert.deepEqual(feedLoop(PROPOSED_SELL), [], "giá đề xuất");
  // lãi / giờ với thức ăn tự làm (2 ngô 29 xu → 3 bao) cao hơn rõ so với giá cũ (trứng 26, sữa 58)
  const homeFeed = (2 * ITEM.ngo.sell) / 3, OLD = { "trung-ga": 26, sua: 58 };
  const perHour = (a, price) => ((price * a.qty - homeFeed * a.feed) * 3600_000) / a.cycleMs;
  for (const a of ANIMALS) assert.ok(perHour(a, PROPOSED_SELL[a.product]) > perHour(a, OLD[a.product]) * 1.4, a.id);
  // chạy chính MARKET.assertEconomy() với giá đề xuất: nạp đúng thể hiện catalog.js mà core/market.js dùng, đổi tạm, khôi phục
  const { readFile } = await import("node:fs/promises");
  const marketUrl = new URL("../core/market.js", import.meta.url);
  const src = await readFile(marketUrl, "utf8");
  const spec = /from "(\.\.\/data\/catalog\.js[^"]*)"/.exec(src)[1];
  const cat = await import(new URL(spec, marketUrl).href);
  const { createMarket } = await import(marketUrl.href + "?m4-balance");
  const old = Object.fromEntries(Object.keys(PROPOSED_SELL).map((id) => [id, cat.ITEM[id].sell]));
  try {
    for (const [id, v] of Object.entries(PROPOSED_SELL)) cat.ITEM[id].sell = v;
    const r = createMarket().assertEconomy();
    assert.deepEqual(r.violations, [], "assertEconomy với giá đề xuất");
    assert.ok(r.costs["trung-ga"] === 56 && r.costs.sua === 112, "trứng / sữa mua-được qua thức ăn chợ: 56 / 112 xu");
  } finally {
    for (const [id, v] of Object.entries(old)) cat.ITEM[id].sell = v;
  }
  assert.deepEqual(createMarket().assertEconomy().violations, [], "giá hiện tại (đã khôi phục)");
  void ITEMS4;
});
