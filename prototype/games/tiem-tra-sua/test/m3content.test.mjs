// Nội dung M3: câu / review theo kết quả đơn nhiều ly, bàn pha đôi, nhiệm vụ, vựa sỉ, quảng bá, ký gửi, trang trí.
// Kiểm: đủ câu cho mỗi kết quả và mỗi nhóm khách, chọn đúng bảng theo kết quả, không lặp trong ca, cờ của game mở đúng sự kiện, bản lưu tương thích.
import test from "node:test";
import assert from "node:assert/strict";
import { ORDER_MULTI, MULTI_REVIEW, MULTI_SAY, BARISTA_PARALLEL, MISSION_DONE, MISSION_MISS, MISSION_ALL, CONSIGN_LINES, CONSIGN_DONE, REVIEW_DECOR, PROMO_REVIEW, CAPTIONS_M3 } from "../data/lines-m3.js";
import { MISTAKE_REVIEW } from "../data/lines-mistakes.js";
import { ARCHETYPE_IDS } from "../data/customers.js";
import { EQUIPMENT } from "../data/equipment.js";
import { MISSIONS } from "../data/missions.js";
import { STOCK_IDS } from "../data/ingredients.js";
import { EVENT, EVENTS } from "../data/events.js";
import { multiOutcome, poolFor, lineCtx, decorPool, promoPool, LATE_MS } from "../core/shift.js";
import { eligibleNow, openEvent, currentEvent, ENGINE_FLAG } from "../core/drama.js";
import { captionKind, journalMoments } from "../core/journal.js";
import { fill } from "../core/text.js";
import { loadSave, dump } from "../core/state.js";
import { shop, act, advance, stepsFor } from "./helpers.mjs";
import { LEVELS } from "../data/levels.js";
import { SAVE_VERSION } from "../core/state.js";

const OUTCOMES = ["allRight", "perfect3", "oneWrong", "swapped", "late", "sync"];
const VARS = new Set(["self", "call", "drink", "sugar", "ice", "topping", "name", "n"]);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
const BRANDS = /grab|shopee|tiktok|facebook|zalo|instagram|youtube|starbucks|gong cha|phúc long|highlands|koi/i;
function checkLines(list, where, vars = VARS) {
  assert.ok(Array.isArray(list) && list.length, where + ": trống");
  for (const t of list) {
    assert.equal(typeof t, "string", where);
    assert.ok(t.length >= 12 && t.length <= 220, `${where}: độ dài: ${t}`);
    assert.ok(!EMOJI.test(t), `${where}: có emoji: ${t}`);
    assert.ok(!BRANDS.test(t), `${where}: tên thương hiệu thật: ${t}`);
    for (const m of t.matchAll(/\{(\w+)\}/g)) assert.ok(vars.has(m[1][0].toLowerCase() + m[1].slice(1)), `${where}: biến lạ {${m[1]}}`);
  }
  assert.equal(new Set(list).size, list.length, where + ": câu trùng");
}
const XP = [0, ...LEVELS.map((L) => L.xp)];
function day(level, guests = [], seed = 3, owned = []) {
  const s = shop(seed);
  s.tutorialDone = true; s.day = 5; s.money = 3000; s.xp = XP[level]; s.level = level;
  for (const id of STOCK_IDS) s.stock[id] = 9;
  for (const id of owned) s.owned[id] = true;
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  s.shift.missions = [];
  s.shift.schedule = guests.map((g, i) => ({ at: 10 + i * 50, arch: g.arch || "van-phong", name: g.name || "Khách " + i, items: g.items }));
  s.shift.kitchen.ready = 9;
  advance(s, 2800);
  return s;
}
const dao = (sugar = 50, ice = "vua") => ({ recipe: "tra-dao", sugar, ice });
const brew = (s, o) => { for (const [step, id] of stepsFor(o)) act(s, { type: "brew", step, id }); };
/** Pha từng ly của đơn (có thể ghi đè từng ly), ghép vào đơn; gap = ms ca chờ giữa các ly. */
function serveOrder(s, c, over = [], gap = 0) {
  act(s, { type: "pin", cid: c.id });
  let r;
  c.items.forEach((it, i) => {
    if (i && gap) { const t = s.shift.t + gap; while (s.shift.t < t) act(s, { type: "tick", dt: 200 }); }
    brew(s, { ...it.order, ...(over[i] || {}) });
    r = act(s, { type: "serve", cid: c.id });
  });
  return r;
}
const filled = (table, c) => new Set(poolFor(table, c.arch).map((t) => fill(t, lineCtx(c))));

// ---------- bảng câu ----------
test("đơn nhiều ly: câu gọi món theo nhóm khách, review 8–12+ câu mỗi kết quả mỗi nhóm khách, câu nói ≥ 6, giọng mạng có hashtag", () => {
  for (const a of ARCHETYPE_IDS) {
    assert.ok(poolFor(ORDER_MULTI, a).length >= 9, `ORDER_MULTI.${a}`);
    checkLines(ORDER_MULTI[a], `ORDER_MULTI.${a}`);
  }
  checkLines(ORDER_MULTI.default, "ORDER_MULTI.default");
  let tagged = 0, all = 0;
  for (const o of OUTCOMES) {
    for (const [T, min, name] of [[MULTI_REVIEW, 8, "REVIEW"], [MULTI_SAY, 6, "SAY"]]) {
      checkLines(T[o].default, `${name}.${o}.default`);
      for (const a of ARCHETYPE_IDS) {
        assert.ok((T[o][a] || []).length >= 2, `${name}.${o}.${a}: câu riêng`);
        checkLines(T[o][a], `${name}.${o}.${a}`);
        const pool = poolFor(T[o], a);
        assert.ok(pool.length >= min, `${name}.${o}.${a}: ${pool.length} < ${min}`);
        assert.equal(new Set(pool).size, pool.length, `${name}.${o}.${a}: trùng giữa chung và riêng`);
      }
    }
    for (const t of Object.values(MULTI_REVIEW[o]).flat()) { all++; if (/#\S/.test(t)) tagged++; }
  }
  assert.ok(tagged / all >= 0.4, `hashtag ${tagged}/${all}`);
});

test("nhiệm vụ, ký gửi, bàn pha, trang trí, quảng bá, câu chốt ca: đủ câu, không emoji, không thương hiệu thật", () => {
  checkLines(BARISTA_PARALLEL, "BARISTA_PARALLEL");
  for (const T of [MISSION_DONE, MISSION_MISS]) {
    assert.ok(T.default.length >= 6);
    for (const m of MISSIONS) assert.ok((T[m.kind] || []).length >= 1, "thiếu câu cho kind " + m.kind);
    for (const [k, list] of Object.entries(T)) checkLines(list, "mission." + k);
  }
  checkLines(MISSION_ALL, "MISSION_ALL");
  checkLines(CONSIGN_LINES, "CONSIGN_LINES"); assert.ok(CONSIGN_LINES.length >= 6);
  checkLines(CONSIGN_DONE, "CONSIGN_DONE");
  for (const [id, T] of Object.entries(REVIEW_DECOR)) {
    assert.ok(EQUIPMENT[id]?.kind === "decor", id + " là đồ trang trí");
    for (const [k, list] of Object.entries(T)) { checkLines(list, `decor.${id}.${k}`); assert.ok(list.length >= 6); }
  }
  for (const id of ["waiting-bench", "room-screen", "flowering-pot"]) assert.ok(REVIEW_DECOR[id], "ghế chờ / góc check-in / cây: " + id);
  for (const k of ["to-roi", "check-in", "livestream"]) { checkLines(PROMO_REVIEW[k], "promo." + k); assert.ok(PROMO_REVIEW[k].length >= 6); }
  const capVars = new Set(["cups", "lost", "profit", "stars", "shop", "multi", "followers", "drama", "oops"]);
  for (const [k, list] of Object.entries(CAPTIONS_M3)) checkLines(list, "captions." + k, capVars);
});

test("sự kiện M3: đủ cho mỗi cơ chế; mọi cờ trong điều kiện đều do lựa chọn hoặc do game đặt", () => {
  const by = (p) => EVENTS.filter((e) => e.id.startsWith(p));
  assert.ok(by("F").length >= 4 && by("P").length >= 3 && by("U").length >= 5 && by("Q").length >= 9 && by("B").length >= 3);
  for (const k of ["to-roi", "check-in", "livestream"]) assert.equal(EVENTS.filter((e) => e.if?.flags?.includes("promo-" + k)).length, 3, k + ": lên mạng / phản tác dụng / ăn ké");
  assert.ok(by("U").filter((e) => e.when === "day").length >= 3 && by("U").some((e) => e.if?.chain), "vựa sỉ có sự kiện giữa ca và hẹn quay lại");
  for (const f of ["si-mua", "promo-to-roi", "ky-gui", "ky-gui-xong"]) assert.ok(ENGINE_FLAG.test(f), f);
});

// ---------- chọn bảng theo kết quả (đơn vị) ----------
const cust = (n, at = []) => ({ items: Array.from({ length: n }, () => ({})), filled: Array.from({ length: n }, (_, i) => ({ at: at[i] ?? 0 })) });
const per = (...errs) => errs.map((e) => ({ errors: e }));
test("multiOutcome: đúng hết / ba ly năm sao / một ly lệch / đổi chỗ / ly tới trễ / ra cùng lúc", () => {
  assert.equal(multiOutcome({ items: [{}], filled: [{}] }, { stars: 5, errors: [], per: per([]) }), null, "đơn một ly");
  assert.equal(multiOutcome(cust(2), { stars: 4, errors: [], per: per([], []) }), "allRight");
  assert.equal(multiOutcome(cust(2), { stars: 5, errors: [], per: per([], []) }), "allRight", "hai ly năm sao vẫn là đúng hết");
  assert.equal(multiOutcome(cust(3), { stars: 5, errors: [], per: per([], [], []) }), "perfect3");
  assert.equal(multiOutcome(cust(3), { stars: 4, errors: [], per: per([], [], []) }), "allRight", "ba ly bốn sao");
  assert.equal(multiOutcome(cust(2), { stars: 4, errors: ["sugarHigh"], per: per([], ["sugarHigh"]) }), "oneWrong");
  assert.equal(multiOutcome(cust(3), { stars: 3, errors: ["iceLow", "sugarLow"], per: per(["iceLow"], ["sugarLow"], []) }), null, "hai ly lệch: dùng câu theo lỗi");
  assert.equal(multiOutcome(cust(2), { stars: 4, errors: ["swapped"], per: per(["swapped", "baseWrong"], ["baseWrong"]) }), "swapped");
  assert.equal(multiOutcome(cust(2), { stars: 2, errors: ["wrongCustomer"], per: per(["wrongCustomer"], []) }), null);
  assert.equal(multiOutcome(cust(2, [0, LATE_MS]), { stars: 3, errors: ["slow"], per: per(["slow"], ["slow"]) }), "late", "ly tới trễ (chậm không tính là lệch)");
  assert.equal(multiOutcome(cust(2, [0, LATE_MS - 1]), { stars: 4, errors: [], per: per([], []) }), "allRight");
  assert.equal(multiOutcome(cust(2, [100, 900]), { stars: 4, errors: [], per: per([], []) }, 2), "sync", "bàn pha đôi, ly ra sát nhau");
  assert.equal(multiOutcome(cust(2, [100, 900]), { stars: 4, errors: [], per: per([], []) }, 1), "allRight", "một chỗ pha thì không tính cùng lúc");
  assert.equal(multiOutcome(cust(2), { stars: 3, errors: [], per: per([], []) }), null, "ba sao không lỗi: dùng câu theo sao");
});

// ---------- tích hợp: giao đơn thật ----------
test("giao đơn hai ly đúng hết: review + câu nói từ bảng allRight, lý do multi, khoảnh khắc lưu", () => {
  const s = day(3, [{ items: [dao(), dao(30, "it")] }]);
  const c = s.shift.customers[0];
  const r = serveOrder(s, c);
  const sv = r.events.find((e) => e.type === "served");
  assert.equal(sv.outcome, "allRight");
  const rv = s.shift.reviews.at(-1);
  assert.equal(rv.reason, "multi");
  assert.ok(filled(MULTI_REVIEW.allRight, c).has(rv.line), rv.line);
  assert.ok(filled(MULTI_SAY.allRight, c).has(s.shift.customers[0].say.text), "bong bóng thoại");
  assert.equal(s.shift.lastServe.outcome, "allRight");
});

test("đơn ba ly năm sao ⇒ perfect3; mở được sự kiện F03 ngay sau đó", () => {
  const s = day(10, [{ items: [dao(), dao(30, "it"), dao(70, "nhieu")] }]);
  const c = s.shift.customers[0];
  const r = serveOrder(s, c);
  assert.equal(r.events.find((e) => e.type === "served").stars, 5);
  const rv = s.shift.reviews.at(-1);
  assert.equal(rv.reason, "multi3");
  assert.ok(filled(MULTI_REVIEW.perfect3, c).has(rv.line), rv.line);
  assert.ok(s.shift.moments.some((m) => m.kind === "multi" && m.id === "perfect3"));
  assert.ok(eligibleNow(s, EVENT.F03), "F03 mở được");
});

test("một ly lệch đường ⇒ oneWrong, lý do là lỗi thật (trả lời xin lỗi được); F05 mở được", () => {
  const s = day(3, [{ items: [dao(), dao()] }]);
  const c = s.shift.customers[0];
  serveOrder(s, c, [{}, { sugar: 100 }]);
  const rv = s.shift.reviews.at(-1);
  assert.equal(rv.reason, "sugarHigh");
  assert.ok(filled(MULTI_REVIEW.oneWrong, c).has(rv.line), rv.line);
  assert.equal(s.shift.lastServe.outcome, "oneWrong");
  assert.ok(eligibleNow(s, EVENT.F05));
});

test("ly thứ hai tới trễ ≥ 18 giây ⇒ late; F02 mở được ngay sau khi giao", () => {
  const s = day(3, [{ items: [dao(), dao(30, "it")] }]);
  const c = s.shift.customers[0];
  serveOrder(s, c, [], LATE_MS + 400);
  const rv = s.shift.reviews.at(-1);
  assert.equal(rv.reason, "multiLate");
  assert.ok(filled(MULTI_REVIEW.late, c).has(rv.line), rv.line);
  assert.ok(eligibleNow(s, EVENT.F02), "F02 mở được");
});

test("bàn pha đôi: hai ly rót đồng loạt có câu nhân viên; giao sát nhau ⇒ sync", () => {
  const s = day(9, [{ items: [dao(), dao()] }], 3, ["double-station"]);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  const first = act(s, { type: "brew", step: "cup", id: "ly" }).events.find((e) => e.type === "brewed");
  assert.ok(new Set(BARISTA_PARALLEL.map((t) => fill(t, { n: 2 }))).has(first.line), first.line);
  for (const [step, id] of stepsFor(c.items[0].order).slice(1)) act(s, { type: "brew", step, id });
  act(s, { type: "serve", cid: c.id });
  act(s, { type: "select", station: 1 });
  const r = act(s, { type: "serve", cid: c.id });
  assert.equal(r.events.find((e) => e.type === "served").outcome, "sync");
  assert.ok(filled(MULTI_REVIEW.sync, c).has(s.shift.reviews.at(-1).line));
  assert.equal(s.shift.reviews.at(-1).reason, "multiSync");
});

test("hai ly đúng nhưng ghép nhầm ô ⇒ swapped, câu từ bảng đổi chỗ (nhiều ly + pha nhầm)", () => {
  const s = day(3, [{ items: [dao(50, "vua"), dao(30, "it")] }]);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  const mk = (o) => ({ steps: stepsFor(o).map(([step, id]) => ({ step, id })), sealed: true, forCid: c.id, at: s.shift.t });
  s.shift.customers[0].filled = [mk(c.items[1].order), null]; // apply chạy trên bản nháp: sửa thẳng trạng thái hiện tại
  brew(s, c.items[0].order);
  act(s, { type: "serve", cid: c.id });
  const rv = s.shift.reviews.at(-1);
  assert.equal(rv.reason, "swapped");
  const pool = new Set([...filled(MULTI_REVIEW.swapped, c), ...filled(MISTAKE_REVIEW.swapped, c)]);
  assert.ok(pool.has(rv.line), rv.line);
});

test("nhiều đơn nhiều ly trong một ca: câu review và câu nói không lặp (freshLine)", () => {
  const s = day(3, Array.from({ length: 4 }, (_, i) => ({ name: "Nhóm " + i, items: [dao(), dao(30, "it")] })));
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const c = s.shift.customers.find((q) => q.phase === "wait");
    serveOrder(s, c);
    lines.push(s.shift.reviews.at(-1).line, s.shift.customers.find((q) => q.id === c.id).say.text);
  }
  assert.equal(new Set(lines).size, lines.length, lines.join(" | "));
});

// ---------- trang trí, quảng bá ----------
test("review nhắc đồ trang trí đang có; chưa có thì không; ghế chờ thêm câu khi khách chờ lâu", () => {
  const s0 = day(3);
  assert.equal(decorPool(s0).length, 0);
  const decor = Object.keys(REVIEW_DECOR);
  const s = day(16, Array.from({ length: 8 }, (_, i) => ({ arch: "hoc-sinh", name: "K" + i, items: [dao()] })), 11, decor);
  assert.equal(decorPool(s).length, decor.reduce((a, id) => a + REVIEW_DECOR[id].good.length, 0));
  const pool = new Set();
  let hit = 0;
  for (let i = 0; i < 8; i++) {
    let c = null;
    for (let k = 0; k < 60 && !(c = s.shift.customers.find((q) => q.phase === "wait")); k++) advance(s, 500);
    serveOrder(s, c);
    for (const t of decorPool(s)) pool.add(fill(t, lineCtx(c)));
    if (pool.has(s.shift.reviews.at(-1).line)) hit++;
  }
  assert.ok(hit >= 1, "ít nhất một review nhắc trang trí");
  const only = day(3, [], 3, ["waiting-bench"]);
  assert.deepEqual(decorPool(only), REVIEW_DECOR["waiting-bench"].good);
});

test("quảng bá đặt cờ trong ngày ⇒ sự kiện lên mạng / phản tác dụng / ăn ké mở được, chọn xong thì tắt cờ; khách ngày đó có review riêng", () => {
  for (const kind of ["to-roi", "check-in", "livestream"]) {
    const s = shop(5);
    s.tutorialDone = true; s.day = 6; s.money = 500; s.xp = XP[14]; s.level = 14;
    act(s, { type: "promo", kind });
    assert.equal(s.drama.flags["promo-" + kind], s.day);
    act(s, { type: "startShift" });
    assert.deepEqual(promoPool(s), PROMO_REVIEW[kind]);
    s.shift.drama.max = 0; s.shift.schedule = [{ at: 10, arch: "hoc-sinh", name: "Tí", items: [dao()] }];
    advance(s, 3000); s.shift.t = 20000;
    const evs = EVENTS.filter((e) => e.if?.flags?.includes("promo-" + kind));
    for (const ev of evs) assert.ok(eligibleNow(s, ev), ev.id);
    assert.equal(openEvent(s, evs[0].id).ok, true);
    act(s, { type: "choose", choice: EVENT[evs[0].id].nodes.start.choices[0].id });
    assert.equal(s.drama.flags["promo-" + kind], undefined, "một sự kiện mỗi lần quảng bá");
    assert.ok(evs.every((ev) => !eligibleNow(s, ev)));
  }
});

// ---------- vựa sỉ ----------
test("nhập vựa sỉ ⇒ cờ si-mua; giữa hai ca Anh Út gọi (U02), nói ngắn ⇒ hẹn U03 giao trễ ca sau; U01 trà cũ trong ca", () => {
  const s = shop(8);
  s.tutorialDone = true; s.day = 7; s.money = 900; s.xp = XP[12]; s.level = 12;
  for (const id of STOCK_IDS) s.stock[id] = 2; // chừa chỗ kho cho gói gấp đôi
  act(s, { type: "restock", id: "hong-tra", supplier: "si" });
  assert.ok(s.drama.flags["si-mua"] >= s.day);
  assert.ok(eligibleNow(s, EVENT.U02) && eligibleNow(s, EVENT.U04));
  assert.equal(openEvent(s, "U02").ok, true);
  act(s, { type: "choose", choice: "short" });
  assert.ok(s.drama.queue.some((q) => q.id === "U03" && q.day === s.day + 1));
  assert.ok(s.drama.flags["ut-doi"]);
  act(s, { type: "startShift" });
  s.shift.t = 20000;
  assert.ok(eligibleNow(s, EVENT.U01), "U01 trong ca khi có hàng vựa sỉ");
  assert.equal(openEvent(s, "U01").ok, true);
  act(s, { type: "choose", choice: "call" });
  assert.equal(currentEvent(s).node, "call");
  const tea = s.stock["hong-tra"];
  act(s, { type: "choose", choice: "listen" });
  assert.ok(s.stock["hong-tra"] > tea, "Anh Út gửi bù trà");
});

// ---------- ký gửi ----------
test("gói ký gửi: câu tử tế khi nhận, cờ ky-gui (Dì Ba ghé B01); trả đủ ⇒ khoảnh khắc + cờ ky-gui-xong mở B02", () => {
  const s = shop(9);
  s.tutorialDone = true; s.day = 4; s.money = 0;
  for (const id of STOCK_IDS) s.stock[id] = 0;
  const r = act(s, { type: "consign" });
  const ev = r.events.find((e) => e.type === "consigned");
  assert.ok(CONSIGN_LINES.includes(ev.line));
  assert.ok(s.drama.flags["ky-gui"]);
  act(s, { type: "startShift" });
  s.shift.drama.max = 0; s.shift.missions = [];
  s.shift.schedule = [{ at: 10, arch: "hoc-sinh", name: "Tí", items: [dao()] }];
  advance(s, 2800); s.shift.t = 25000;
  assert.ok(eligibleNow(s, EVENT.B01));
  s.consign.owed = 3; // còn nợ ít: ly này trả đủ
  s.shift.customers[0].arriveT = s.shift.t;
  const sv = serveOrder(s, s.shift.customers[0]);
  assert.equal(s.consign.owed, 0);
  assert.ok(sv.events.some((e) => e.type === "consignDone" && CONSIGN_DONE.includes(e.line)));
  assert.ok(s.shift.moments.some((m) => m.kind === "consign-done"));
  assert.ok(s.drama.flags["ky-gui-xong"] && !s.drama.flags["ky-gui"]);
  advance(s, 400000);
  if (currentEvent(s)?.id !== "B02") { s.drama.pending = null; }
  assert.ok(eligibleNow(s, EVENT.B02), "ngày trả đủ: Dì Ba gạch sổ");
});

// ---------- nhiệm vụ ----------
test("nhiệm vụ: xong có câu vui, xong cả ba có khoảnh khắc riêng + câu chốt ca; hụt có câu an ủi trong Nhật Ký", () => {
  const s = day(4, [{ arch: "hoc-sinh", items: [dao()] }, { arch: "hoc-sinh", items: [dao()] }]);
  s.shift.missions = ["cups", "fast", "drama"].map((id) => ({ id, text: id, n: id === "cups" ? 1 : id === "fast" ? 1 : 1, prog: 0, done: false, reward: { xp: 1, money: 0 } }));
  const r = serveOrder(s, s.shift.customers[0]);
  const done = r.events.filter((e) => e.type === "missionDone");
  assert.equal(done.length, 2);
  for (const d of done) assert.ok(d.line && d.line.length > 10);
  assert.ok(s.shift.moments.some((m) => m.kind === "mission" && m.line.includes(done[0].line)));
  assert.ok(!s.shift.moments.some((m) => m.kind === "mission-all"));
  // nhiệm vụ còn lại (drama) hụt ⇒ chốt ca có câu an ủi
  advance(s, 400000);
  if (s.shift) { const c = s.shift.customers.find((q) => q.phase === "wait"); if (c) serveOrder(s, c); advance(s, 400000); }
  const sum = s.lastSummary;
  assert.ok(sum.moments.some((m) => m.kind === "mission-miss" && /Hụt nhiệm vụ/.test(m.line)));
  assert.ok(journalMoments(sum).some((m) => /Hụt nhiệm vụ/.test(m.line)), "khoảnh khắc hụt lên được thẻ Nhật Ký");
  // đủ ba nhiệm vụ ⇒ câu chốt ca riêng
  assert.equal(captionKind({ profit: 10, lost: 0, cups: 5, avgStars: 4, moments: [], drama: [], missions: [{ done: true }, { done: true }, { done: true }] }), "missions");
  const s2 = day(4, [{ arch: "hoc-sinh", items: [dao()] }]);
  s2.shift.missions = ["cups", "fast", "pearls"].map((id) => ({ id, text: id, n: 1, prog: 0, done: false, reward: { xp: 1, money: 0 } }));
  const r2 = serveOrder(s2, s2.shift.customers[0], [{ topping: "tran-chau" }]);
  assert.ok(r2.events.some((e) => e.type === "missionsAll" && MISSION_ALL.includes(e.line)));
});

// ---------- bản lưu ----------
test("bản lưu: lúc ghép ly (cup.at) và kết quả đơn nhiều ly giữ qua tải lại; bản lưu cũ không có trường này vẫn đọc được", () => {
  const s = day(3, [{ items: [dao(), dao(30, "it")] }]);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  brew(s, c.items[0].order);
  act(s, { type: "serve", cid: c.id });
  const at = s.shift.customers[0].filled[0].at;
  assert.ok(Number.isFinite(at));
  const back = loadSave(dump(s));
  assert.equal(back.shift.customers[0].filled[0].at, at);
  // bản lưu trước bản cập nhật này: ly đã ghép không có at
  const old = JSON.parse(dump(s));
  delete old.shift.customers[0].filled[0].at;
  const b2 = loadSave(JSON.stringify(old));
  assert.ok(b2.shift.customers[0].filled[0] && b2.shift.customers[0].filled[0].at === undefined);
  // ly không có at: không tính trễ / cùng lúc, vẫn chấm và chọn câu được
  brew(b2, b2.shift.customers[0].items[1].order);
  act(b2, { type: "serve", cid: c.id });
  assert.equal(b2.shift.reviews.at(-1).reason, "multi");
  const b3 = loadSave(dump(b2));
  assert.equal(b3.shift.lastServe.outcome, "allRight");
  assert.equal(b3.v, SAVE_VERSION, "M3 nội dung không nâng phiên bản riêng");
});
