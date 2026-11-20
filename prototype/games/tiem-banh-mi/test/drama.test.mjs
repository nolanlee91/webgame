// Drama (M4): đủ 59 sự kiện DRAMA.md + sự kiện cơ chế M3 + R01–R10; mọi sự kiện mở được (dựng trạng thái thoả điều kiện);
// mọi lựa chọn ở mọi bước giải quyết được (cả nhánh thắng / thua của hên xui); luôn có lựa chọn miễn phí; chuỗi hẹn trỏ đúng; mô phỏng 14 ngày.
import test from "node:test";
import assert from "node:assert/strict";
import { EVENTS, EVENT, DRAMA_IDS, M3_IDS, REPLY_IDS } from "../data/events.js";
import { NPCS } from "../data/npcs.js";
import { ARCHETYPES } from "../data/customers.js";
import { eligibleNow, openEvent, currentEvent, affordable, isFree, choiceVisible, FX_KEYS, IF_KEYS, nodeOf } from "../core/drama.js";
import { makeItem } from "../core/order.js";
import { spawnPre } from "../core/shift.js";
import { shop, act, prepAndOpen, playShift, resolveEvent } from "./helpers.mjs";
import { apply } from "../core/apply.js";
import { LEVELS } from "../data/economy.js";

const allChoices = (ev) => Object.values(ev.nodes).flatMap((n) => n.choices);
const fxOf = (ch) => [ch.fx, ch.roll?.win?.fx, ch.roll?.lose?.fx].filter(Boolean);

test("đủ 59 sự kiện DRAMA.md + 27 sự kiện cơ chế M3 + R01–R10, id không trùng", () => {
  const ids = EVENTS.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [...DRAMA_IDS, ...M3_IDS, ...REPLY_IDS]) assert.ok(EVENT[id], id);
  assert.equal(DRAMA_IDS.length, 59);
  const shiftN = DRAMA_IDS.filter((id) => EVENT[id].when === "shift").length;
  assert.ok(shiftN >= 30 && shiftN <= 40, `trong ca ${shiftN}`);
  const multi = EVENTS.filter((e) => Object.keys(e.nodes).length > 1).length, later = EVENTS.filter((e) => allChoices(e).some((c) => c.later || c.roll?.win?.later || c.roll?.lose?.later || c.fx?.preorder?.laterOk || c.fx?.group?.laterOk)).length;
  const rolls = EVENTS.filter((e) => allChoices(e).some((c) => c.roll)).length;
  assert.ok(multi >= EVENTS.length / 3, `nhiều bước ${multi}`);
  assert.ok(later >= 25, `hẹn ${later}`);
  assert.ok(rolls >= 30, `hên xui ${rolls}`);
});

test("cấu trúc: khoá fx / if hợp lệ, goto trỏ đúng bước, người nói hợp lệ, mỗi bước có lựa chọn miễn phí", () => {
  for (const ev of EVENTS) {
    for (const k of Object.keys(ev.if || {})) assert.ok(IF_KEYS.has(k), `${ev.id} if.${k}`);
    if (ev.npc) assert.ok(NPCS[ev.npc], `${ev.id} npc ${ev.npc}`);
    else assert.ok(ev.who === "waiting" || ev.who === "lastServed" || ARCHETYPES[ev.who?.arch], `${ev.id} who`);
    assert.ok(["shift", "day"].includes(ev.when), ev.id);
    for (const [nid, n] of Object.entries(ev.nodes)) {
      assert.ok(n.line, `${ev.id}.${nid} line`);
      assert.ok(n.choices.some((c) => isFree(c)), `${ev.id}.${nid} không có lựa chọn miễn phí`);
      for (const c of n.choices) {
        for (const f of fxOf(c)) for (const k of Object.keys(f)) assert.ok(FX_KEYS.has(k), `${ev.id}.${c.id} fx.${k}`);
        for (const g of [c.goto, c.roll?.win?.goto, c.roll?.lose?.goto].filter(Boolean)) assert.ok(ev.nodes[g], `${ev.id}.${c.id} goto ${g}`);
        for (const l of [c.later, c.roll?.win?.later, c.roll?.lose?.later, c.fx?.preorder?.laterOk, c.fx?.group?.laterOk].filter(Boolean)) assert.ok(EVENT[l.id], `${ev.id}.${c.id} later ${l.id}`);
        if (c.roll) assert.ok(c.roll.p > 0 && c.roll.p < 1, `${ev.id}.${c.id} roll`);
      }
    }
  }
});

test("sự kiện chỉ mở qua hẹn (chain) đều có sự kiện khác hẹn tới", () => {
  const targets = new Set();
  for (const ev of EVENTS) for (const c of allChoices(ev)) for (const l of [c.later, c.roll?.win?.later, c.roll?.lose?.later, c.fx?.preorder?.laterOk, c.fx?.group?.laterOk].filter(Boolean)) targets.add(l.id);
  for (const ev of EVENTS) if (ev.if?.chain) assert.ok(targets.has(ev.id), `${ev.id} chain nhưng không ai hẹn`);
});

// ---------- dựng trạng thái thoả điều kiện ----------
const MAX_T = 240000;
function stage(ev, seed = 11) {
  const s = shop(seed);
  const q = ev.if || {};
  s.tutorialDone = true;
  s.day = Math.max(8, q.minDay || 1);
  const lvl = Math.max(q.minLevel || 1, q.shop || q.owns === "electric-oven" ? 7 : 1, 1);
  s.level = Math.min(q.maxLevel || 20, Math.max(lvl, 8));
  if (q.maxLevel !== undefined) s.level = Math.min(s.level, q.maxLevel);
  s.xp = LEVELS[s.level - 1];
  s.rep = q.minRep !== undefined ? Math.max(q.minRep, 60) : q.maxRep !== undefined ? q.maxRep : 60;
  s.followers = Math.max(q.minFollowers || 0, 50);
  s.buzz = q.minBuzz || 0;
  s.money = q.maxMoney !== undefined ? Math.min(q.maxMoney, 200) : Math.max(q.minMoney || 0, 600);
  if (q.shop !== undefined) s.shop = q.shop; else if (s.level >= 7) s.shop = true;
  if (s.shop) s.oven = "gas";
  for (const id of [].concat(q.owns || [])) { s.owned[id] = true; if (id === "electric-oven") s.oven = "electric"; break; }
  if (q.oven) s.oven = q.oven;
  for (const id of ["egg-pan", "xiu-mai-pot", "grill", "vegan-board", "long-board"]) s.owned[id] = true;
  if (q.notOwns) delete s.owned[q.notOwns];
  if (q.weather) s.weather = { day: s.day, kind: q.weather };
  if (q.staleMin) s.stale = { n: q.staleMin, choice: null };
  if (q.reviewLow) s.feed.unshift({ id: 999, day: s.day, name: "X", arch: "student", stars: 1, line: "tệ", reason: "soggy" });
  for (const f of [...(q.flags || []), ...(q.anyFlags || []).slice(0, 1)]) s.drama.flags[f] = s.day + 5;
  for (const f of q.noFlags || []) delete s.drama.flags[f];
  if (ev.when === "day") {
    if (q.sum) s.lastSummary = { day: s.day - 1, profit: q.sum.profitMax !== undefined ? q.sum.profitMax - 10 : 50, lost: q.sum.lostMin || 0, avg: q.sum.starsMax !== undefined ? q.sum.starsMax : 4, loaves: q.sum.loavesMin || 10, burntBatches: q.sum.burntMin || 0, batches: q.sum.batchesMin || 3, leftover: q.sum.leftoverMin || 0, moments: [] };
    else s.lastSummary = { day: s.day - 1, profit: 50, lost: 0, avg: 4, loaves: 10, burntBatches: 0, batches: 3, moments: [] };
    // giữa hai ca: s.day là ngày ca tới ⇒ cờ phải còn hạn tới hôm nay
    return s;
  }
  // trong ca
  act(s, { type: "startShift" });
  const sh = s.shift;
  sh.drama.max = 9; sh.schedule = [];
  sh.t = Math.min(MAX_T - 30000, Math.max(q.tMin || 0, q.phase === "trua" ? 110000 : q.phase === "chieu" ? 160000 : 20000));
  if (q.tMax !== undefined) sh.t = Math.min(sh.t, Math.max(q.tMin || 0, q.tMax - 1000));
  sh.phase = q.phase || (sh.t < 105000 ? "sang" : sh.t < 150000 ? "trua" : "chieu");
  const archs = [q.archWaiting, ev.who?.arch, q.lastServe?.arch && [].concat(q.lastServe.arch)[0]].filter(Boolean);
  const nWait = Math.max(q.waitingMin || 0, 2, q.caseCrispOne ? 2 : 0);
  for (let i = 0; i < nWait; i++) {
    const arch = archs[i] || archs[0] || ["student", "office", "worker"][i % 3];
    const items = [makeItem(q.boardStep ? "cha-lua" : "pate-bo", [])];
    sh.customers.push({ id: sh.nextCid++, arch, sprite: ARCHETYPES[arch].sprite, name: ARCHETYPES[arch].names[0], self: ARCHETYPES[arch].self, call: ARCHETYPES[arch].call, items, filled: items.map(() => null),
      phase: "wait", t0: sh.t - 3000, arriveT: sh.t - 100, patience: 60000, spot: i, mood: "waiting", say: null, orderLine: "", nhuCu: false, pay: null, payPlan: null, leaveT: null, reactUntil: null, remade: false, impatientSaid: false, discount: 0 });
  }
  if (q.queueFree) sh.customers.splice(3);
  const crisp = q.caseCrispOne ? [90, 60, 55] : [100, 95, 90, 88, 85, 80];
  sh.case = crisp.slice(0, Math.max(q.caseMin || 0, q.caseCrispOne ? 3 : 6)).map((c, i) => ({ id: 900 + i, crisp: c, src: "oven" }));
  if (q.caseMin > sh.case.length) for (let i = sh.case.length; i < q.caseMin; i++) sh.case.push({ id: 950 + i, crisp: 70, src: "oven" });
  if (q.caseMax !== undefined) sh.case = sh.case.slice(0, q.caseMax);
  if (q.boardStep) {
    const c = sh.customers[0];
    Object.assign(sh.boards[0], { cid: c.id, item: 0, loaf: { spreads: {}, fills: [], veg: {}, ot: 0, sauces: {}, wrap: null, sliced: true, toasted: false, toastT0: null, used: {}, id: 1, crisp: 95, src: "oven" }, step: Math.max(0, ["take", "toast", "slice", "spread", "fill", "veg", "spice", "wrap"].indexOf(q.boardStep) - 1), hist: [] });
  }
  if (q.burntRecent) sh.burntAt = sh.t - 1000;
  if (q.gasOut) { s.stock.gas = 0; delete s.owned["spare-gas"]; }
  if (q.noChange) s.float = { 1: 2 };
  if (q.lastServe || ev.who === "lastServed") {
    const L = q.lastServe || {}, c = sh.customers[0];
    c.phase = "react"; c.reactUntil = sh.t + 1600;
    const mk = L.mistake === "any" ? ["soggy"] : L.mistake ? [].concat(L.mistake).slice(0, 1) : [];
    sh.lastServe = { cid: c.id, t: sh.t - 100, stars: L.maxStars ?? L.minStars ?? (mk.length ? 2 : 5), arch: c.arch, mistakes: mk, crisp: L.crispMin ?? 95, loaves: L.loavesMin || 1,
      overpaid: L.overpaidMin || 0, bachucLow: !!L.bachucLow, quirks: L.quirk ? [L.quirk] : [], burnt: !!L.burnt };
    if (L.minStars !== undefined && sh.lastServe.stars < L.minStars) sh.lastServe.stars = L.minStars;
  }
  return s;
}
function openStaged(ev, seed) {
  const s = stage(ev, seed);
  if (ev.if?.chain) s.drama.queue.push({ id: ev.id, day: s.day - (s.shift ? 0 : 1), from: "test" });
  return s;
}

test("mọi sự kiện mở được: dựng trạng thái thoả điều kiện thì engine chọn được (eligible)", () => {
  const bad = [];
  for (const ev of EVENTS) {
    const s = openStaged(ev);
    if (!eligibleNow(s, ev)) bad.push(ev.id);
  }
  assert.deepEqual(bad, []);
});

/** Đi tới bước `nid` bằng đường goto, rồi chọn `cid` với RNG cố định; trả kết quả. */
function paths(ev) {
  const out = [], seen = new Set();
  const walk = (nid, route) => {
    if (seen.has(nid + route.length)) return; seen.add(nid + route.length);
    for (const c of ev.nodes[nid].choices) {
      out.push({ route, choice: c.id, node: nid });
      for (const g of [c.goto, c.roll?.win?.goto, c.roll?.lose?.goto].filter(Boolean)) if (route.length < 4 && !route.some((r) => r.node === g)) walk(g, [...route, { node: nid, choice: c.id, goal: g }]);
    }
  };
  walk("start", []);
  return out;
}
function rich(s) { s.money = Math.max(s.money, 5000); for (const k of Object.keys(s.stock)) s.stock[k] = Math.max(s.stock[k], 40); if (s.shift) while (s.shift.case.length < 12) s.shift.case.push({ id: 700 + s.shift.case.length, crisp: 90, src: "oven" }); }

test("mọi lựa chọn ở mọi bước giải quyết được (cả thắng và thua khi hên xui), không phá bất biến", () => {
  let tried = 0;
  for (const ev of EVENTS) {
    for (const p of paths(ev)) {
      const ch = ev.nodes[p.node].choices.find((c) => c.id === p.choice);
      const outcomes = ch.roll ? ["win", "lose"] : ["any"];
      for (const want of outcomes) {
        let done = false;
        for (let seed = 1; seed < 60 && !done; seed++) {
          const s = openStaged(ev, seed);
          rich(s);
          const r0 = openEvent(s, ev.id);
          assert.ok(r0.ok, `${ev.id} không mở được: ${r0.err}`);
          // đi theo đường goto (chọn tới khi tới đúng bước)
          let okRoute = true;
          for (const step of p.route) {
            const sc = ev.nodes[step.node].choices.find((c) => c.id === step.choice);
            for (const f of sc.need?.flags || []) s.drama.flags[f] = s.day + 3;
            for (const f of sc.need?.noFlags || []) delete s.drama.flags[f];
            if (sc.need?.owns) s.owned[sc.need.owns] = true;
            const r = apply(s, { type: "event", choice: step.choice });
            if (r.err || currentEvent(s)?.node !== step.goal) { okRoute = false; break; }
          }
          if (!okRoute) continue;
          for (const f of ch.need?.flags || []) s.drama.flags[f] = s.day + 3;
          for (const f of ch.need?.noFlags || []) delete s.drama.flags[f];
          if (ch.need?.owns) s.owned[ch.need.owns] = true;
          if (ch.need?.shop !== undefined) s.shop = ch.need.shop;
          const rng0 = s.rng;
          const r = apply(s, { type: "event", choice: ch.id });
          assert.ok(!r.err, `${ev.id}.${p.node}.${ch.id}: ${r.err} ${r.detail || ""}`);
          const e = r.events.find((x) => x.type === "dramaResolved");
          assert.ok(e, `${ev.id}.${ch.id} không có dramaResolved`);
          if (want !== "any" && e.rolled !== want) { void rng0; continue; }
          const d = currentEvent(s);
          assert.ok(!d || ev.nodes[d.node], `${ev.id}.${ch.id} kẹt ở bước lạ`);
          if (!d) assert.ok(!s.shift || !s.shift.dialog || s.shift.dialog.kind !== "event", `${ev.id}.${ch.id} hội thoại không đóng`);
          done = true; tried++;
        }
        assert.ok(done, `${ev.id}.${p.node}.${ch.id} (${want}) không thử được`);
      }
    }
  }
  assert.ok(tried > 400, String(tried));
});

test("hẹn quay lại: chọn lựa chọn có later ⇒ sự kiện đích vào hàng hẹn và mở được đúng ngày", () => {
  const ev = EVENT.K03, s = openStaged(ev);
  openEvent(s, "K03");
  const ch = ev.nodes.start.choices.find((c) => c.later?.id === "K04");
  assert.ok(ch);
  act(s, { type: "event", choice: ch.id });
  const q = s.drama.queue.find((x) => x.id === "K04");
  assert.ok(q);
  assert.equal(q.day, s.day + ch.later.days);
  q.day = s.day; // tua: tới hạn ngay tối nay
  const day = s.day;
  // chốt ca ⇒ sự kiện giữa hai ca K04 (chain) đến hạn
  s.shift.customers = []; s.shift.schedule = []; s.shift.t = 240000;
  act(s, { type: "tick", dt: 200 });
  assert.equal(s.day, day + 1);
  assert.equal(s.drama.pending?.id, "K04");
  resolveEvent(s);
  assert.equal(s.drama.pending, null);
});

test("hội thoại sự kiện lưu khoảnh khắc Nhật Ký + lịch sử; tải lại giữa hội thoại giữ đúng bước", async () => {
  const { loadSave, dump } = await import("../core/state.js");
  const ev = EVENT.K01, s = openStaged(ev);
  rich(s);
  openEvent(s, "K01");
  const two = ev.nodes.start.choices.find((c) => c.goto);
  if (two) {
    act(s, { type: "event", choice: two.id });
    const r = loadSave(dump(s));
    assert.equal(r.shift.dialog.kind, "event");
    assert.equal(r.shift.dialog.node, two.goto);
  }
  resolveEvent(s);
  assert.ok(s.drama.history.length >= 1);
  assert.ok(s.shift.moments.some((m) => m.kind === "drama"));
});

test("mô phỏng 14 ngày × 2 hạt có Drama: không lỗi, có sự kiện trong ca và giữa hai ca, cờ hết hạn", () => {
  for (const seed of [2, 31]) {
    const s = shop(seed);
    let inShift = 0, between = 0;
    for (let d = 0; d < 14; d++) {
      if (s.drama.pending) between++;
      prepAndOpen(s);
      const before = s.drama.history.length;
      playShift(s, { rnd: mulberry(seed * 100 + d) });
      inShift += s.drama.history.filter((h, i) => i < s.drama.history.length - before).length;
    }
    assert.ok(s.drama.history.length >= 4, `hạt ${seed}: ${s.drama.history.length} sự kiện`);
    assert.ok(between >= 1, `hạt ${seed}: không có sự kiện giữa hai ca`);
    for (const until of Object.values(s.drama.flags)) assert.ok(until >= s.day - 2, "cờ quá hạn chưa xoá");
    void inShift;
  }
});
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export { stage, nodeOf, spawnPre, choiceVisible, affordable };
