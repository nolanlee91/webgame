// Test luật Xưởng (core/production.js). Chạy: node --test prototype/games/nong-trai/test/production.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../core/production.js?v=m16";
import { MACHINES, MACHINE, BASE_SLOTS, MAX_SLOTS } from "../data/machines.js?v=m16";
import { RECIPES, RECIPE } from "../data/recipes.js?v=m16";
import { ITEM } from "../data/catalog.js?v=m16";

const T0 = 1_700_000_000_000, MIN = 60_000, HOUR = 3600_000;

/** Kho trong bộ nhớ, chỉ dùng cho test. cap = tổng số món tối đa; add nguyên tử. */
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
const ctx = (level = 20, extra = {}) => ({ level, buildings: ["nha-kinh"], ...extra });
/** Production với máy đã xây xong trước T0. */
function built(...ids) {
  const prod = P.createProduction(), w = memWallet(1e9);
  for (const id of ids) assert.ok(P.buildMachine(prod, w, id, T0 - HOUR, ctx()).ok);
  return prod;
}

test("dữ liệu: mọi công thức trỏ tới máy + món có thật, đúng bảng §2.3", () => {
  const known = new Set(Object.keys(ITEM));
  for (const r of RECIPES) {
    assert.ok(MACHINE[r.machine], r.id);
    assert.ok(known.has(r.output), r.output);
    for (const id of Object.keys(r.inputs)) assert.ok(known.has(id), `${r.id} ← ${id}`);
    assert.ok(r.level >= MACHINE[r.machine].unlock, r.id);
  }
  assert.deepEqual(RECIPE["banh-bi-ngo"].inputs, { "bi-ngo": 1, "bot-gao": 1, "trung-ga": 1 });
  assert.equal(RECIPE["thuc-an-gia-suc"].qty, 3);
  assert.equal(RECIPE["banh-flan"].ms, 6 * MIN);
  assert.equal(RECIPE["banh-flan"].level, 16);
  assert.deepEqual(MACHINES.map((m) => [m.id, m.unlock]), [["bep-sen", 4], ["coi-xay", 5], ["lo-banh", 8], ["may-bo-sua", 12], ["noi-duong", 13]]);
  for (const m of MACHINES) assert.equal(m.upgrades.at(-1).slots, MAX_SLOTS);
});

test("xây máy: cấp mở, công trình cần, trừ xu, thời gian xây", () => {
  const prod = P.createProduction(), w = memWallet(1000);
  assert.equal(P.buildMachine(prod, w, "bep-sen", T0, ctx(3)).err, "locked");
  assert.equal(P.buildMachine(prod, w, "noi-duong", T0, { level: 20 }).err, "requires");
  assert.equal(P.buildMachine(prod, memWallet(149), "bep-sen", T0, ctx(4)).err, "coins");
  assert.equal(P.buildMachine(prod, w, "nope", T0, ctx()).err, "bad");
  const r = P.buildMachine(prod, w, "bep-sen", T0, ctx(4));
  assert.ok(r.ok);
  assert.equal(w.value, 850);
  assert.equal(P.buildMachine(prod, w, "bep-sen", T0, ctx(4)).err, "built");
  const inv = memInv({ "ca-rot": 8 });
  assert.equal(P.enqueue(prod, inv, "bep-sen", "nuoc-ep-ca-rot", T0 + 59_999, ctx()).err, "building");
  assert.equal(P.status(prod, T0 + 30_000)["bep-sen"].buildRemaining, 30_000);
  assert.ok(P.enqueue(prod, inv, "bep-sen", "nuoc-ep-ca-rot", T0 + MIN, ctx()).ok);
});

test("hàng chờ tuần tự + offline nhiều giờ chỉ dựa timestamp", () => {
  const prod = built("bep-sen");
  const inv = memInv({ "dau-tay": 3, "ca-chua": 3 });
  const a = P.enqueue(prod, inv, "bep-sen", "mut-dau", T0, ctx()).job;
  const b = P.enqueue(prod, inv, "bep-sen", "sot-ca-chua", T0 + 10_000, ctx()).job;
  assert.deepEqual([a.startAt, a.endAt], [T0, T0 + 2 * MIN]);
  assert.deepEqual([b.startAt, b.endAt], [T0 + 2 * MIN, T0 + 2 * MIN + 90_000]); // chờ job trước
  let st = P.status(prod, T0 + MIN)["bep-sen"];
  assert.equal(st.running.uid, a.uid);
  assert.equal(st.running.remaining, MIN);
  assert.equal(st.waiting, 1);
  st = P.status(prod, T0 + 3 * MIN)["bep-sen"];
  assert.equal(st.running.uid, b.uid);
  assert.equal(st.finished, 1);
  // Vắng 5 giờ: cả hai xong, nhận đúng một lần mỗi ô
  const later = T0 + 5 * HOUR;
  st = P.status(prod, later)["bep-sen"];
  assert.equal(st.finished, 2);
  assert.equal(st.running, null);
  const all = P.collectAll(prod, inv, later);
  assert.equal(all.collected.length, 2);
  assert.equal(all.xp, 8 + 6);
  assert.equal(inv.count("mut-dau"), 1);
  assert.equal(inv.count("sot-ca-chua"), 1);
  // Máy rảnh từ lâu: job mới bắt đầu ngay lúc bấm, không "lấy" thời gian đã qua
  const c = P.enqueue(prod, inv, "bep-sen", "mut-dau", later, ctx());
  assert.equal(c.err, "inputs");
  inv.add("dau-tay", 3);
  const d = P.enqueue(prod, inv, "bep-sen", "mut-dau", later, ctx()).job;
  assert.equal(d.startAt, later);
});

test("máy đang xây: không nhận việc, không trừ nguyên liệu", () => {
  const prod = P.createProduction();
  P.buildMachine(prod, memWallet(999), "bep-sen", T0, ctx());
  const inv = memInv({ "ca-rot": 4 });
  assert.equal(P.enqueue(prod, inv, "bep-sen", "nuoc-ep-ca-rot", T0, ctx()).err, "building");
  assert.equal(inv.count("ca-rot"), 4);
});

test("enqueue trừ nguyên liệu đúng một lần, lỗi thì không trừ", () => {
  const prod = built("lo-banh");
  const inv = memInv({ "trung-ga": 3, "bot-gao": 1, "bi-ngo": 1 });
  assert.ok(P.enqueue(prod, inv, "lo-banh", "banh-trung", T0, ctx()).ok);
  assert.deepEqual(inv.bag, { "trung-ga": 1, "bi-ngo": 1 });
  assert.equal(P.enqueue(prod, inv, "lo-banh", "banh-bi-ngo", T0, ctx()).err, "inputs");
  assert.deepEqual(inv.bag, { "trung-ga": 1, "bi-ngo": 1 });
  assert.equal(P.collect(prod, inv, "lo-banh", 1, T0 + 4 * MIN).ok, true);
  assert.equal(inv.count("banh-trung"), 1);
  // kho trả take=false giữa chừng ⇒ hoàn lại phần đã lấy
  const flaky = memInv({ "trung-ga": 2, "bot-gao": 1, "bi-ngo": 1 });
  const realTake = flaky.take;
  flaky.take = (id, n) => (id === "trung-ga" ? false : realTake(id, n));
  assert.equal(P.enqueue(prod, flaky, "lo-banh", "banh-bi-ngo", T0, ctx()).err, "inputs");
  assert.deepEqual(flaky.bag, { "trung-ga": 2, "bot-gao": 1, "bi-ngo": 1 });
});

test("không nhận ô chưa xong, không nhận 2 lần, uid sai", () => {
  const prod = built("coi-xay");
  const inv = memInv({ ngo: 2 });
  const job = P.enqueue(prod, inv, "coi-xay", "thuc-an-gia-suc", T0, ctx()).job;
  assert.equal(P.collect(prod, inv, "coi-xay", job.uid, job.endAt - 1).err, "not-ready");
  assert.equal(P.collectAll(prod, inv, job.endAt - 1).err, "not-found");
  const r = P.collect(prod, inv, "coi-xay", job.uid, job.endAt);
  assert.equal(r.qty, 3);
  assert.equal(inv.count("thuc-an-gia-suc"), 3);
  assert.equal(P.collect(prod, inv, "coi-xay", job.uid, job.endAt + HOUR).err, "not-found");
  assert.equal(inv.count("thuc-an-gia-suc"), 3);
  assert.equal(P.collect(prod, inv, "bep-sen", 1, T0).err, "bad");
});

test("kho đầy: giữ nguyên ô, nhận lại được khi có chỗ", () => {
  const prod = built("coi-xay");
  const inv = memInv({ ngo: 4 }, 5);
  const j1 = P.enqueue(prod, inv, "coi-xay", "thuc-an-gia-suc", T0, ctx()).job;
  const j2 = P.enqueue(prod, inv, "coi-xay", "thuc-an-gia-suc", T0, ctx()).job;
  assert.ok(P.collect(prod, inv, "coi-xay", j1.uid, T0 + HOUR).ok); // 3 thức ăn, còn chỗ 2
  assert.equal(P.collect(prod, inv, "coi-xay", j2.uid, T0 + HOUR).err, "full");
  assert.equal(P.collectAll(prod, inv, T0 + HOUR).err, "full");
  assert.equal(prod.machines["coi-xay"].queue.length, 1);
  inv.take("thuc-an-gia-suc", 3);
  assert.ok(P.collect(prod, inv, "coi-xay", j2.uid, T0 + HOUR).ok);
  // canAdd được ưu tiên nếu có
  const prod2 = built("coi-xay"), inv2 = memInv({ ngo: 2 });
  const j = P.enqueue(prod2, inv2, "coi-xay", "thuc-an-gia-suc", T0, ctx()).job;
  inv2.canAdd = () => false;
  assert.equal(P.collect(prod2, inv2, "coi-xay", j.uid, T0 + HOUR).err, "full");
  assert.equal(prod2.machines["coi-xay"].queue.length, 1);
});

test("sức chứa hàng chờ: 2 ô, nâng +1 tới 4, extraSlots, ô xong chưa nhận vẫn chiếm chỗ", () => {
  const prod = built("bep-sen"), w = memWallet(10_000);
  const inv = memInv({ "ca-rot": 400 });
  const go = (now = T0) => P.enqueue(prod, inv, "bep-sen", "nuoc-ep-ca-rot", now, ctx());
  assert.ok(go().ok); assert.ok(go().ok);
  assert.equal(go().err, "queue-full");
  assert.equal(go(T0 + HOUR).err, "queue-full"); // xong nhưng chưa nhận
  assert.equal(P.enqueue(prod, inv, "bep-sen", "nuoc-ep-ca-rot", T0, ctx(20, { extraSlots: 1 })).ok, true);
  assert.equal(P.status(prod, T0, ctx(20, { extraSlots: 1 }))["bep-sen"].free, 0);
  let u = P.upgradeMachine(prod, w, "bep-sen", T0, ctx());
  assert.deepEqual([u.level, u.slots, w.value], [2, 3, 9800]);
  assert.equal(go().err, "queue-full"); // 3 job đã có
  u = P.upgradeMachine(prod, w, "bep-sen", T0, ctx());
  assert.deepEqual([u.slots, w.value], [4, 9350]);
  assert.ok(go().ok);
  assert.equal(go().err, "queue-full");
  assert.equal(P.upgradeMachine(prod, w, "bep-sen", T0, ctx()).err, "max");
  assert.equal(P.nextUpgrade(prod, "bep-sen"), null);
  assert.equal(P.upgradeMachine(prod, memWallet(0), "coi-xay", T0, ctx()).err, "not-built");
  const p2 = built("coi-xay");
  assert.equal(P.upgradeMachine(p2, memWallet(10), "coi-xay", T0, ctx()).err, "coins");
  assert.equal(p2.machines["coi-xay"].slots, BASE_SLOTS);
});

test("mở công thức theo cấp người chơi + level máy; sai máy", () => {
  const prod = built("coi-xay", "lo-banh");
  const inv = memInv({ lua: 2, "trung-ga": 2, sua: 1, duong: 1, ngo: 2 });
  assert.equal(P.enqueue(prod, inv, "coi-xay", "bot-gao", T0, ctx(5)).err, "locked");
  assert.equal(P.enqueue(prod, inv, "coi-xay", "bap-rang", T0, ctx()).err, "wrong-machine");
  assert.equal(P.enqueue(prod, inv, "lo-banh", "banh-flan", T0, ctx(15)).err, "locked");
  assert.equal(P.enqueue(prod, inv, "lo-banh", "banh-flan", T0, ctx(16)).err, "machine-level");
  P.upgradeMachine(prod, memWallet(1e6), "lo-banh", T0, ctx());
  assert.ok(P.enqueue(prod, inv, "lo-banh", "banh-flan", T0, ctx(16)).ok);
  assert.ok(P.enqueue(prod, inv, "coi-xay", "bot-gao", T0, ctx(6)).ok);
  assert.equal(P.enqueue(prod, inv, "may-bo-sua", "bo", T0, ctx()).err, "not-built");
  assert.equal(P.enqueue(prod, inv, "lo-banh", "khong-co", T0, ctx()).err, "bad");
});

test("sanitize: bỏ rác, tính lại endAt theo dữ liệu, kẹp mốc ở tương lai", () => {
  const raw = { machines: {
    "bep-sen": { level: 9, readyAt: T0 + 100 * HOUR, nextUid: 2, queue: [
      { uid: 5, recipe: "mut-dau", startAt: T0 + 50 * HOUR, endAt: 1 },
      { uid: 5, recipe: "mut-dau", startAt: T0, endAt: 0 },
      { uid: 6, recipe: "bap-rang", startAt: T0, endAt: 0 },
      { uid: 7, recipe: "sot-ca-chua", startAt: T0, endAt: 0 },
    ] },
    "may-la": { level: 1 },
  } };
  const p = P.sanitize(raw, T0);
  assert.deepEqual(Object.keys(p.machines), ["bep-sen"]);
  const m = p.machines["bep-sen"];
  assert.equal(m.level, 3); assert.equal(m.slots, 4);
  assert.equal(m.readyAt, T0 + MACHINE["bep-sen"].buildMs);
  assert.deepEqual(m.queue.map((j) => j.uid), [5, 7]);
  assert.deepEqual([m.queue[0].startAt, m.queue[0].endAt], [T0, T0 + 2 * MIN]);
  assert.equal(m.queue[1].startAt, T0 + 2 * MIN);
  assert.equal(m.nextUid, 8);
  assert.deepEqual(P.sanitize(null), { machines: {} });
});
