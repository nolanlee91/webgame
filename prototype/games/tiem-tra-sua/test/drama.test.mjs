// Drama Engine: cấu trúc dữ liệu sự kiện, mọi sự kiện đều mở được, mọi lựa chọn đều giải quyết được, hậu quả thấy được, hẹn quay lại.
import test from "node:test";
import assert from "node:assert/strict";
import { EVENTS, EVENT } from "../data/events.js";
import { STOCK } from "../data/ingredients.js";
import { RECIPE } from "../data/recipes.js";
import { EQUIPMENT } from "../data/equipment.js";
import { ARCHETYPES } from "../data/customers.js";
import { FX_KEYS, IF_KEYS, ENGINE_FLAG, ROLES, eligibleNow, openEvent, currentEvent, affordable, fxSummary } from "../core/drama.js";
import { loadSave, dump } from "../core/state.js";
import { levelForXp } from "../core/progression.js";
import { LEVELS } from "../data/levels.js";
import { orderSpec } from "../core/shift.js";
import { shop, act, err, advance, untilWaiting, serveRight, clearDrama, openDay } from "./helpers.mjs";

const GROUPS = new Set(["khach", "mang", "van-hanh", "dac-biet", "doi"]);
const TONES = new Set(["good", "mixed", "bad"]);
const VARS = new Set(["name", "self", "call", "drink", "sugar", "ice", "topping", "shop", "n", "followers", "day"]);
const allChoices = (ev) => Object.entries(ev.nodes).flatMap(([node, n]) => n.choices.map((c) => ({ node, c })));
const fxOf = (c) => [c.fx || {}, c.roll?.win?.fx || {}, c.roll?.lose?.fx || {}];
const isFree = (c) => fxOf(c).every((fx) => !(fx.money < 0) && !Object.values(fx.stock || {}).some((n) => n < 0) && !(fx.kitchen < 0)) && !c.need;

test("có ít nhất 30 sự kiện, đủ 5 nhóm, cả trong ca và giữa hai ca, đủ C01–X05 của DRAMA.md", () => {
  assert.ok(EVENTS.length >= 30, `${EVENTS.length} sự kiện`);
  assert.equal(new Set(EVENTS.map((e) => e.id)).size, EVENTS.length, "id trùng");
  for (const g of GROUPS) assert.ok(EVENTS.some((e) => e.group === g), "thiếu nhóm " + g);
  assert.ok(EVENTS.some((e) => e.when === "shift") && EVENTS.some((e) => e.when === "day"));
  const doc = ["C02", "C03", "C04", "C05", "S01", "S02", "S03", "S04", "S05", "O01", "O02", "O03", "O04", "O05", "X01", "X02", "X03", "X04", "X05"];
  for (const id of doc) assert.ok(EVENT[id], "thiếu " + id); // C01 = hội thoại khiếu nại (core/shift.js resolve)
  assert.ok(EVENTS.filter((e) => Object.keys(e.nodes).length >= 2).length >= 8, "ít nhất 8 sự kiện nhiều bước");
  assert.ok(EVENTS.filter((e) => allChoices(e).some(({ c }) => c.later)).length >= 8, "ít nhất 8 sự kiện có hẹn quay lại");
});

test("cấu trúc từng sự kiện hợp lệ: bước, lựa chọn, hậu quả, điều kiện, người nói, biến trong câu", () => {
  for (const ev of EVENTS) {
    const at = ev.id;
    assert.ok(GROUPS.has(ev.group), at + " group");
    assert.ok(TONES.has(ev.tone), at + " tone");
    assert.ok(ev.when === "shift" || ev.when === "day", at + " when");
    assert.ok(ev.nodes?.start, at + " thiếu start");
    for (const k of Object.keys(ev.if || {})) assert.ok(IF_KEYS.has(k), `${at} if.${k}`);
    if (ev.when === "day") for (const k of ["waitingMin", "rush", "lastServe", "pearlsOut", "archWaiting", "lostMin", "cupsMin", "tMin", "tMax", "queueFree"]) assert.equal(ev.if?.[k], undefined, `${at}: ${k} chỉ dùng trong ca`);
    if (ev.who) {
      assert.ok(ev.who === "waiting" || ev.who === "lastServed" || ARCHETYPES[ev.who.arch], at + " who");
      assert.equal(ev.when, "shift", at + ": who chỉ dùng trong ca");
    } else assert.ok(ev.npc && ROLES.includes(ev.npc.role) && ev.npc.name, at + " npc");
    if (ev.who === "lastServed") assert.ok(ev.if?.lastServe, at + ": lastServed cần if.lastServe");
    if (ev.if?.owns) for (const id of [].concat(ev.if.owns)) assert.ok(EQUIPMENT[id], at + " owns " + id);
    for (const [id, n] of Object.entries(ev.nodes)) {
      assert.ok(typeof n.line === "string" && n.line.length > 10, `${at}.${id} line`);
      assert.ok(n.choices.length >= 2, `${at}.${id}: ít nhất 2 lựa chọn`);
      assert.ok(n.choices.some(isFree), `${at}.${id}: phải có lựa chọn không tốn tiền / hàng`);
      assert.equal(new Set(n.choices.map((c) => c.id)).size, n.choices.length, `${at}.${id}: id lựa chọn trùng`);
      for (const text of [n.line, n.me, ...n.choices.flatMap((c) => [c.label, c.hint, c.say, c.roll?.win?.say, c.roll?.lose?.say, ...fxOf(c).map((f) => (typeof f.moment === "string" ? f.moment : "")), ...fxOf(c).map((f) => f.review?.line || "")])].filter(Boolean)) {
        for (const m of text.matchAll(/\{(\w+)\}/g)) assert.ok(VARS.has(m[1][0].toLowerCase() + m[1].slice(1)), `${at}.${id}: biến lạ {${m[1]}}`);
      }
      for (const c of n.choices) {
        const where = `${at}.${id}.${c.id}`;
        assert.ok(c.label && c.say && c.say.length >= 12, where + ": cần nhãn và câu trả lời đáng trích");
        if (c.goto) assert.ok(ev.nodes[c.goto] && c.goto !== "start", where + " goto " + c.goto);
        if (c.later) assert.ok(EVENT[c.later.id], where + " later " + c.later.id);
        if (c.roll) assert.ok(c.roll.p > 0 && c.roll.p < 1 && c.roll.win && c.roll.lose, where + " roll");
        for (const fx of fxOf(c)) {
          for (const k of Object.keys(fx)) assert.ok(FX_KEYS.has(k), `${where} fx.${k}`);
          for (const sid of Object.keys(fx.stock || {})) assert.ok(STOCK[sid], `${where} stock ${sid}`);
          if (fx.demand && fx.demand !== "who") assert.ok(RECIPE[fx.demand], `${where} demand`);
          if (fx.review) assert.ok(fx.review.stars >= 1 && fx.review.stars <= 5 && fx.review.line, `${where} review`);
          if (fx.group) assert.ok(fx.group.cups >= 2 && fx.group.cups <= 3 && (!fx.group.arch || ARCHETYPES[fx.group.arch]), `${where} group`);
          if (ev.when === "day") for (const k of ["patience", "whoPatience", "delaySpawn", "sealMs", "guests", "group", "kitchen", "swapTopping", "priceWho", "leaveWho"]) assert.equal(fx[k], undefined, `${where}: ${k} chỉ dùng trong ca`);
          if (!ev.who) for (const k of ["whoPatience", "swapTopping", "priceWho", "leaveWho"]) assert.equal(fx[k], undefined, `${where}: ${k} cần khách nói (who)`);
        }
        assert.ok(fxSummary(c.fx || {}, c.later).length > 0 || c.goto || c.roll, where + ": phải có hậu quả thấy được");
      }
    }
    // mọi bước đến được từ start, không vòng lặp goto
    const seen = new Set(["start"]), stack = ["start"];
    while (stack.length) for (const c of ev.nodes[stack.pop()].choices) if (c.goto && !seen.has(c.goto)) { seen.add(c.goto); stack.push(c.goto); }
    assert.deepEqual([...seen].sort(), Object.keys(ev.nodes).sort(), at + ": có bước không tới được");
    const depth = (node, path) => { assert.ok(!path.includes(node), at + ": vòng lặp goto"); for (const c of ev.nodes[node].choices) if (c.goto) depth(c.goto, [...path, node]); };
    depth("start", []);
  }
});

/** Sự kiện chain do luật game hẹn (không qua lựa chọn sự kiện): H01 ← "Mượn đỡ chị Lụa" (core/stockout.js). */
const ENGINE_CHAIN = new Set(["H01"]);
test("mọi cờ điều kiện đều có lựa chọn đặt; mọi sự kiện chain đều có hẹn tới", () => {
  const set = new Set(EVENTS.flatMap((e) => allChoices(e).flatMap(({ c }) => fxOf(c).flatMap((fx) => [].concat(fx.flag || [])))));
  const later = new Set(EVENTS.flatMap((e) => allChoices(e).map(({ c }) => c.later?.id).filter(Boolean)));
  for (const ev of EVENTS) {
    for (const f of ev.if?.flags || []) assert.ok(set.has(f) || ENGINE_FLAG.test(f), `${ev.id}: cờ ${f} không ai đặt`);
    if (ev.if?.chain) assert.ok(later.has(ev.id) || ENGINE_CHAIN.has(ev.id), `${ev.id}: chain nhưng không có later nào trỏ tới`);
  }
});

// ---------- dựng trạng thái thoả điều kiện của từng sự kiện ----------
function synth(ev, seed = 5) {
  const q = ev.if || {};
  const s = shop(seed);
  s.tutorialDone = true; s.introSeen = true;
  const lv = Math.max(q.minLevel || 1, q.owns ? 1 : 1, 6);
  s.xp = LEVELS[lv - 1].xp; s.level = levelForXp(s.xp);
  s.day = Math.max(q.minDay || 1, 5);
  s.rep = q.minRep !== undefined ? q.minRep : q.maxRep !== undefined ? Math.min(35, q.maxRep) : 50;
  s.followers = q.minFollowers || 0;
  s.money = q.maxMoney !== undefined ? Math.min(q.maxMoney, 30) : Math.max(q.minMoney || 0, 400);
  for (const f of q.flags || []) s.drama.flags[f] = s.day + 3;
  if (q.owns) s.owned[[].concat(q.owns)[0]] = true;
  if (q.reviewLow) s.feed.unshift({ id: 99, day: s.day - 1, name: "Khách", arch: "hoc-sinh", recipe: "tra-dao", stars: 1, line: "Chờ lâu quá.", reason: "timeout", reply: null, src: "quan" });
  if (q.sum) {
    const S = q.sum;
    s.lastSummary = { day: s.day - 1, cups: Math.max(S.cupsMin || 0, 6), lost: S.lostMin || 0, profit: S.profitMax !== undefined ? S.profitMax - 5 : Math.max(S.profitMin || 0, 60),
      avgStars: S.starsMax !== undefined ? Math.min(S.starsMax, 3) : Math.max(S.starsMin || 0, 4), moments: [], drama: [], reviews: [], seen: true };
  }
  if (ev.when === "day") { s.drama.pending = null; return s; }
  act(s, { type: "startShift" });
  const sh = s.shift;
  sh.drama.max = 0; // tự mở sự kiện khác không chen vào
  sh.schedule = [];
  const arch = ev.who?.arch || q.archWaiting || q.lastServe?.arch || "hoc-sinh";
  const need = Math.max(q.waitingMin || 0, ev.who || q.archWaiting || q.pearlsOut ? 1 : 0, 1);
  for (let i = 0; i < Math.min(need, 3); i++) sh.schedule.push({ at: sh.t + 10 + i, arch: i === 0 ? arch : "van-phong", name: "Khách " + i, items: [{ recipe: q.pearlsOut ? "tra-sua-truyen-thong" : "tra-dao", sugar: 50, ice: "vua" }] });
  advance(s, 3000);
  return tune(s, ev);
}
function tune(s, ev) {
  const q = ev.if || {}, sh = s.shift;
  if (q.lastServe) {
    const L = q.lastServe;
    const c = sh.customers[0];
    c.phase = "react"; c.reactUntil = sh.t + 2000;
    if (L.cups) { c.items = Array.from({ length: L.cups }, () => ({ ...c.items[0] })); c.filled = c.items.map(() => null); }
    const sugar = L.sugar ?? 50;
    sh.lastServe = { t: sh.t, cid: c.id, arch: c.arch, name: c.name, recipe: c.recipe, stars: L.minStars ?? (L.maxStars ?? 4), cups: L.cups || 1,
      sugar, ice: "vua", sugarOk: L.sugarOk ?? true, iceOk: L.iceOk ?? true, topping: L.topping || c.order.topping, mistake: L.mistake === undefined ? null : L.mistake === "any" ? "sugar" : [].concat(L.mistake)[0],
      outcome: L.outcome === undefined ? null : [].concat(L.outcome)[0] };
    if (L.notArch === c.arch) { c.arch = "hoc-sinh"; sh.lastServe.arch = "hoc-sinh"; }
  }
  if (q.pearlsOut) sh.kitchen.ready = 0;
  if (q.rush !== undefined) sh.t = q.rush ? 52000 : 100000;
  if (q.tMin !== undefined) sh.t = Math.max(sh.t, q.tMin);
  if (q.tMax !== undefined) sh.t = Math.min(sh.t, q.tMax);
  if (q.lostMin) sh.ledger.lost = q.lostMin;
  if (q.cupsMin) sh.ledger.cups = q.cupsMin;
  for (const c of sh.customers) if (c.phase === "wait") c.arriveT = sh.t; // kiên nhẫn còn đầy
  return s;
}

test("mọi sự kiện đều mở được khi đủ điều kiện (chain: khi tới hẹn)", () => {
  for (const ev of EVENTS) {
    const s = synth(ev);
    if (ev.if?.chain) s.drama.queue.push({ id: ev.id, day: s.day, from: "test" });
    assert.ok(eligibleNow(s, ev), `${ev.id} không mở được với điều kiện ${JSON.stringify(ev.if || {})}`);
    assert.equal(openEvent(s, ev.id).ok, true, ev.id);
    assert.equal(currentEvent(s).id, ev.id);
  }
});

test("mọi lựa chọn ở mọi bước đều giải quyết được, đúng một lần, lưu khoảnh khắc Nhật Ký", () => {
  let n = 0;
  for (const ev of EVENTS) {
    // đường đi tới từng bước
    const paths = { start: [] };
    const q = ["start"];
    while (q.length) { const node = q.shift(); for (const c of ev.nodes[node].choices) if (c.goto && !paths[c.goto]) { paths[c.goto] = [...paths[node], c.id]; q.push(c.goto); } }
    for (const [node, path] of Object.entries(paths)) {
      for (const c of ev.nodes[node].choices) {
        const s = synth(ev, 5 + n);
        s.money = 600; for (const id of Object.keys(s.stock)) s.stock[id] = 3;
        if (s.shift) s.shift.kitchen.ready = 4;
        assert.equal(openEvent(s, ev.id).ok, true, ev.id);
        for (const p of path) act(s, { type: "choose", choice: p });
        assert.equal(currentEvent(s).node, node);
        const hist = s.drama.history.length;
        const r = act(s, { type: "choose", choice: c.id });
        const done = r.events.find((e) => e.type === "dramaResolved");
        assert.ok(done && done.say.length > 5, `${ev.id}.${node}.${c.id}`);
        assert.ok(!/\{\w+\}/.test(done.say), `${ev.id}.${c.id}: còn biến chưa điền: ${done.say}`);
        assert.equal(s.drama.history.length, hist + 1);
        if (c.goto) assert.equal(currentEvent(s)?.node, c.goto);
        else {
          assert.equal(currentEvent(s), null, `${ev.id}.${c.id} đóng hội thoại`);
          assert.equal(err(s, { type: "choose", choice: c.id }), "no-event", "chọn lặp bị chặn");
        }
        if (c.later) assert.ok(s.drama.queue.some((x) => x.id === c.later.id));
        // bản lưu đọc lại được sau mỗi lựa chọn
        assert.ok(loadSave(dump(s)), `${ev.id}.${c.id}: lưu được`);
        n++;
      }
    }
  }
  assert.ok(n >= 60, `${n} lựa chọn`);
});

test("hai lựa chọn của cùng một sự kiện cho hậu quả khác nhau (GAME-DESIGN: kiểm tra được)", () => {
  for (const ev of EVENTS) {
    const sums = ev.nodes.start.choices.map((c) => JSON.stringify([c.fx || {}, c.goto || null, c.later || null, c.roll || null]));
    assert.equal(new Set(sums).size, sums.length, ev.id + ": hai lựa chọn giống hệt nhau");
  }
});

test("lựa chọn tốn tiền bị khoá khi không đủ tiền; luôn còn lựa chọn miễn phí", () => {
  const paid = EVENTS.find((ev) => ev.nodes.start.choices.some((c) => c.fx?.money < 0));
  assert.ok(paid, "có sự kiện tốn tiền");
  const s = synth(paid);
  s.money = 0;
  assert.equal(openEvent(s, paid.id).ok, true);
  const c = paid.nodes.start.choices.find((x) => x.fx?.money < 0);
  assert.equal(affordable(s, c), false);
  assert.equal(err(s, { type: "choose", choice: c.id }), "cannot-afford");
  assert.ok(paid.nodes.start.choices.some((x) => affordable(s, x)));
});

test("C02: giao đúng 0% đường cho khách mới ⇒ sự kiện mở ngay, đồng hồ dừng; chọn giải thích ⇒ +1 danh tiếng, hẹn C05 ca sau", () => {
  const s = shop(21);
  s.tutorialDone = true; s.day = 3; s.introSeen = true;
  act(s, { type: "startShift" });
  s.shift.schedule = [{ at: s.shift.t + 10, arch: "hoc-sinh", name: "Tí", items: [{ recipe: "tra-dao", sugar: 0, ice: "vua" }] }];
  s.shift.drama.max = 0;
  const c = untilWaiting(s);
  advance(s, Math.max(0, 23000 - s.shift.t));
  s.shift.drama.max = 1; s.shift.drama.nextAt = 999999;
  serveRight(s, s.shift.customers.find((q) => q.id === c.id));
  advance(s, 200);
  const d = currentEvent(s);
  assert.equal(d?.id, "C02");
  const t = s.shift.t;
  advance(s, 2000);
  assert.equal(s.shift.t, t, "đồng hồ dừng khi hội thoại mở");
  const rep = s.rep;
  const r = act(s, { type: "choose", choice: "explain" });
  assert.equal(s.rep, rep + 1);
  assert.ok(s.drama.queue.some((q) => q.id === "C05" && q.day === s.day + 1));
  assert.ok(s.shift.moments.some((m) => m.kind === "drama" && m.id === "C02"));
  assert.ok(r.events.find((e) => e.type === "dramaResolved").fx.includes("Danh tiếng +1"));
});

test("hẹn quay lại: C05 tới hạn ở ca sau thì được ưu tiên mở", () => {
  const s = synth(EVENT.C05);
  s.drama.queue.push({ id: "C05", day: s.day, from: "C02" });
  s.shift.drama.max = 1; s.shift.drama.nextAt = 0;
  advance(s, 400);
  assert.equal(currentEvent(s)?.id, "C05");
  assert.equal(s.drama.queue.some((q) => q.id === "C05"), false);
});

test("sự kiện nhiều bước: X04 nhận đơn nhóm → bước 2 → khách nhóm 3 ly tới quầy", () => {
  const s = synth(EVENT.X04);
  openEvent(s, "X04");
  act(s, { type: "choose", choice: "accept" });
  assert.equal(currentEvent(s).node, "cap");
  act(s, { type: "choose", choice: "honest" });
  assert.equal(currentEvent(s), null);
  s.shift.customers = s.shift.customers.filter((c) => c.phase === "wait").slice(0, 1);
  const g = s.shift.schedule.find((x) => x.tag === "group");
  assert.equal(g.items.length, 3);
  assert.equal(g.tip, 8);
});

test("sự kiện giữa hai ca hiện sau chốt ca, chặn mở quán tới khi chọn, lưu / tải lại vẫn giữ", () => {
  const s = shop(4);
  s.tutorialDone = true; s.day = 4;
  assert.equal(openEvent(s, "D01").ok, true);
  assert.equal(err(s, { type: "startShift" }), "event-pending");
  const back = loadSave(dump(s));
  assert.equal(currentEvent(back).id, "D01");
  const f = back.followers;
  act(back, { type: "choose", choice: "brag" });
  assert.equal(back.followers, f + 15);
  act(back, { type: "startShift" });
});

test("mô phỏng 14 ngày tự chơi: drama nổ ra đều, nhiều sự kiện khác nhau, không lỗi bất biến", () => {
  const s = shop(77);
  const fired = new Set();
  for (let d = 0; d < 14; d++) {
    for (let i = 0; i < 10 && currentEvent(s); i++) { fired.add(currentEvent(s).id); clearDrama(s); }
    if (s.money < 60) s.money += 200; // người chơi mô phỏng không tối ưu nhập hàng
    for (const id of Object.keys(s.stock)) if (s.stock[id] < 6) s.stock[id] = 6;
    act(s, { type: "startShift" });
    for (let guard = 0; guard < 4000 && s.shift; guard++) {
      const d2 = currentEvent(s);
      if (d2) { fired.add(d2.id); clearDrama(s); continue; }
      if (s.shift.dialog?.kind === "complaint") { act(s, { type: "resolve", choice: "refund" }); continue; }
      if (s.shift.dialog?.kind === "stockout") { act(s, { type: "stockout", choice: stockoutOptions(s).find((o) => o.ok).id }); continue; }
      const c = s.shift.customers.find((q) => q.phase === "wait");
      if (c && !s.shift.dialog) {
        try { serveRight(s, c); } catch { /* đơn đổi giữa chừng: bỏ qua */ }
      }
      if (s.shift && !s.shift.dialog) act(s, { type: "tick", dt: 400 });
    }
    assert.equal(s.shift, null, "ca phải kết thúc");
  }
  assert.ok(fired.size >= 4, `chỉ ${fired.size} sự kiện: ${[...fired]}`);
  assert.ok(s.drama.history.length >= 8, `${s.drama.history.length} lựa chọn trong 14 ngày`);
});

import { stockoutOptions } from "../core/stockout.js";
export { synth, orderSpec };
