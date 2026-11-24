// Drama (M4, agent B): đủ 58 sự kiện DRAMA.md + sự kiện cơ chế M3 + R01–R10; mọi sự kiện mở được (dựng trạng thái thoả điều kiện);
// mọi lựa chọn ở mọi bước giải quyết được (cả nhánh thắng / thua của hên xui); mỗi bước có lựa chọn miễn phí; chuỗi hẹn trỏ đúng;
// không còn {biến} chưa điền, không emoji; hẹn quay lại mở đúng ngày; tải lại giữa hội thoại giữ bước; mô phỏng 14 ngày.
import test from "node:test";
import assert from "node:assert/strict";
import { EVENTS, EVENT, DRAMA_IDS, MECH_IDS, REPLY_IDS } from "../data/events.js?v=c5";
import { NPCS, npcByName, DRAMA_FACES } from "../data/npcs.js?v=c5";
import { ARCHETYPES } from "../data/customers.js?v=c5";
import { LEVELS, SHIFTS, STOCK, GEAR } from "../data/economy.js?v=c5";
import { eligibleNow, openEvent, currentEvent, affordable, isFree, FX_KEYS, IF_KEYS, textCtx, nodeOf, speakerInfo, DRAMA } from "../core/drama.js?v=c5";
import { fill } from "../core/text.js?v=c5";
import { spawnGroup } from "../core/tables.js?v=c5";
import { apply, must, newGame, prepDay, playShift, seeded } from "./helpers.mjs";
import { loadSave, dump } from "../core/state.js?v=c5";

const allChoices = (ev) => Object.values(ev.nodes).flatMap((n) => n.choices);
const fxOf = (ch) => [ch.fx, ch.roll?.win?.fx, ch.roll?.lose?.fx].filter(Boolean);
const laters = (c) => [c.later, c.roll?.win?.later, c.roll?.lose?.later, c.fx?.group?.laterOk, c.fx?.preorder?.laterOk, c.roll?.win?.fx?.group?.laterOk, c.roll?.lose?.fx?.group?.laterOk].filter(Boolean);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/u;

test("đủ 58 sự kiện DRAMA.md + ≥ 28 sự kiện cơ chế + R01–R10, id không trùng, tỉ lệ trong ca / nhiều bước / hẹn / hên xui", () => {
  const ids = EVENTS.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "trùng id");
  assert.equal(DRAMA_IDS.length, 58);
  for (const id of [...DRAMA_IDS, ...REPLY_IDS]) assert.ok(EVENT[id], id);
  assert.ok(MECH_IDS.length >= 28, `cơ chế ${MECH_IDS.length}`);
  const shiftN = DRAMA_IDS.filter((id) => EVENT[id].when === "shift").length;
  assert.equal(shiftN, 37, `trong ca ${shiftN}`);
  const multi = EVENTS.filter((e) => Object.keys(e.nodes).length > 1).length;
  const later = EVENTS.filter((e) => allChoices(e).some((c) => laters(c).length)).length;
  const rolls = EVENTS.filter((e) => allChoices(e).some((c) => c.roll)).length;
  assert.ok(multi >= EVENTS.length / 3, `nhiều bước ${multi}/${EVENTS.length}`);
  assert.ok(later >= EVENTS.length / 4, `hẹn ${later}`);
  assert.ok(rolls >= 50, `hên xui ${rolls}`);
  for (const id of DRAMA_IDS.filter((x) => x.startsWith("V"))) assert.ok(EVENT[id].group === "viral", id);
});

test("cấu trúc: khoá fx / if hợp lệ, goto trỏ đúng bước, người nói hợp lệ, mỗi bước có lựa chọn miễn phí", () => {
  for (const ev of EVENTS) {
    for (const k of Object.keys(ev.if || {})) assert.ok(IF_KEYS.has(k), `${ev.id} if.${k}`);
    for (const k of Object.keys(ev.if?.sum || {})) assert.ok(["profitMax", "profitMin", "starsMin", "starsMax", "lostMin", "burntMin", "smokeMin", "riceLeftMin", "platesMin", "mistake", "mistakeMin"].includes(k), `${ev.id} sum.${k}`);
    if (ev.npc) assert.ok(NPCS[ev.npc], `${ev.id} npc ${ev.npc}`);
    else assert.ok(["waiting", "seated", "lastServed"].includes(ev.who) || ARCHETYPES[ev.who?.arch], `${ev.id} who`);
    assert.ok(["shift", "day"].includes(ev.when), ev.id);
    assert.ok(ev.nodes.start, `${ev.id} không có start`);
    for (const [nid, n] of Object.entries(ev.nodes)) {
      assert.ok(n.line, `${ev.id}.${nid} line`);
      assert.ok(n.choices.length >= 2, `${ev.id}.${nid} < 2 lựa chọn`);
      assert.ok(n.choices.some((c) => isFree(c)), `${ev.id}.${nid} không có lựa chọn miễn phí`);
      assert.equal(new Set(n.choices.map((c) => c.id)).size, n.choices.length, `${ev.id}.${nid} trùng id lựa chọn`);
      for (const c of n.choices) {
        assert.ok(c.label && c.hint && (c.say || (c.roll?.win?.say && c.roll?.lose?.say)), `${ev.id}.${c.id} thiếu label / hint / say`);
        for (const f of fxOf(c)) for (const k of Object.keys(f)) assert.ok(FX_KEYS.has(k), `${ev.id}.${c.id} fx.${k}`);
        for (const f of fxOf(c)) { for (const id of Object.keys(f.stock || {})) assert.ok(STOCK[id], `${ev.id}.${c.id} kho ${id}`); if (f.own) assert.ok(GEAR[f.own], `${ev.id}.${c.id} own ${f.own}`); }
        for (const f of fxOf(c)) for (const r of f.group?.roles || []) assert.ok(ARCHETYPES[r], `${ev.id}.${c.id} vai ${r}`);
        for (const g of [c.goto, c.roll?.win?.goto, c.roll?.lose?.goto].filter(Boolean)) assert.ok(ev.nodes[g], `${ev.id}.${c.id} goto ${g}`);
        for (const l of laters(c)) assert.ok(EVENT[l.id], `${ev.id}.${c.id} later ${l.id}`);
        if (c.roll) assert.ok(c.roll.p > 0 && c.roll.p < 1 && c.roll.win && c.roll.lose, `${ev.id}.${c.id} roll`);
      }
    }
  }
});

test("sự kiện chỉ mở qua hẹn (chain) đều có sự kiện khác hẹn tới; mọi bước đi tới được từ start", () => {
  const targets = new Set();
  for (const ev of EVENTS) for (const c of allChoices(ev)) for (const l of laters(c)) targets.add(l.id);
  for (const ev of EVENTS) if (ev.if?.chain) assert.ok(targets.has(ev.id), `${ev.id} chain nhưng không ai hẹn`);
  for (const ev of EVENTS) {
    const seen = new Set(["start"]), st = ["start"];
    while (st.length) for (const c of ev.nodes[st.pop()].choices) for (const g of [c.goto, c.roll?.win?.goto, c.roll?.lose?.goto].filter(Boolean)) if (!seen.has(g)) { seen.add(g); st.push(g); }
    for (const nid of Object.keys(ev.nodes)) assert.ok(seen.has(nid), `${ev.id}.${nid} không tới được`);
  }
});

test("chữ: không còn {biến} chưa điền, không emoji, không đường dẫn máy", () => {
  const ctx = { shop: "Quán", day: 5, followers: 10, debt: 75, catName: "Vàng", name: "Chú Tư", self: "chú", call: "con", n: 2 };
  for (const ev of EVENTS) {
    const texts = [ev.moment];
    for (const n of Object.values(ev.nodes)) { texts.push(n.line, n.me, ...Object.values(n.meBy || {}), ...(n.alt || []).map((a) => a.line)); for (const c of n.choices) texts.push(c.label, c.hint, c.say, ...Object.values(c.sayBy || {}), c.roll?.win?.say, c.roll?.lose?.say, ...Object.values(c.roll?.win?.sayBy || {}), ...Object.values(c.roll?.lose?.sayBy || {}), c.fx?.moment); }
    for (const t of texts.filter((x) => typeof x === "string")) {
      const out = fill(t, ctx);
      assert.ok(!/\{\w+\}/.test(out), `${ev.id}: biến chưa điền trong "${t.slice(0, 60)}"`);
      assert.ok(!EMOJI.test(t), `${ev.id}: emoji trong "${t.slice(0, 60)}"`);
      assert.ok(!/[A-Z]:\\|AppData|Users\\/.test(t), `${ev.id}: đường dẫn máy`);
    }
  }
});

test("chân dung: khớp tên neo đầu tên, 12 NPC Drama có vai dự phòng", () => {
  assert.equal(npcByName("Chú Tư"), "chu-tu");
  assert.equal(npcByName("Chú Tư 2"), "chu-tu");
  assert.equal(npcByName("Bà Năm"), null);
  assert.equal(npcByName("Điều dưỡng Hạnh"), "dd-hanh");
  assert.equal(npcByName("Năm"), null);
  assert.equal(DRAMA_FACES.length, 12);
  for (const id of DRAMA_FACES) assert.ok(NPCS[id]?.role, id);
});

// ---------- dựng trạng thái thoả điều kiện ----------
const PHASE_F = { som: 0.1, cao: 0.4, khuya: 0.72, trua: 0.3 };
const realFlag = (f) => (f.endsWith("*") ? f.slice(0, -1) + "test" : f);
function addGroup(s, arch, phase = "wait", n = 1) {
  const sh = s.shift;
  const roles = [arch]; for (let i = 1; i < n; i++) roles.push(arch);
  if (phase === "wait") {
    const ok = spawnGroup(s, { arch, roles, patienceMul: 1 });
    assert.ok(ok, "không còn chỗ chờ");
    const g = sh.groups[sh.groups.length - 1]; g.phase = "wait"; g.arriveT = sh.t;
    return g;
  }
  const t = sh.tables.find((x) => x.gid === null && x.state !== "dirty");
  assert.ok(t, "hết bàn");
  const P = sh.groups.length;
  sh.groups.push({ id: sh.nextGid++, arch, size: n, takeaway: false, phase: "seated", t0: sh.t - 20000, walkMs: 0, spot: 0, spots: [0], table: t.id, arriveT: sh.t - 18000, seatT: sh.t - 15000,
    orderT: sh.t - 12000, firstTeaT: sh.t - 12000, billT: null, used: 0, patienceMs: 60000, said: {}, say: null, tag: null, paid: false, leaveT: null, outcome: null,
    members: roles.map((r, idx) => ({ idx, role: r, name: ARCHETYPES[r].names[(P + idx) % ARCHETYPES[r].names.length], self: ARCHETYPES[r].self, call: ARCHETYPES[r].call, tk: null, tea: "full", teaT: sh.t, teaEmpty: null, noTea: false, dirty: false, plate: null, eatUntil: null, eatMs: 0, eaten: false, req: null, reqDone: false, extras: { com: 0, khan: 0 }, score: null, bonus: 0 })) });
  t.gid = sh.groups[sh.groups.length - 1].id;
  return sh.groups[sh.groups.length - 1];
}
export function stage(ev, seed = 11) {
  const s = newGame(seed);
  const q = ev.if || {};
  s.tutorialDone = true;
  s.day = Math.max(q.minDay || 1, 9);
  if (q.maxDay) s.day = Math.min(s.day, q.maxDay);
  s.level = Math.min(q.maxLevel || 20, Math.max(q.minLevel || 1, q.kind === "trua" ? 5 : 1, 6));
  s.xp = LEVELS[s.level - 1];
  s.rep = q.minRep !== undefined ? Math.max(q.minRep, 60) : q.maxRep !== undefined ? q.maxRep : 60;
  s.followers = Math.max(q.minFollowers || 0, 50);
  s.hype = q.minHype || 0;
  s.money = q.maxMoney !== undefined ? Math.min(q.maxMoney, 100) : Math.max(q.minMoney || 0, 600);
  s.stage = q.stage || (s.level >= 7 && q.stage !== "street" ? "street" : "street");
  for (const id of ["egg-pan", "steamer", "takeaway-shelf", "ban-3", "ban-4", "soup-pot"]) if (GEAR[id].level <= s.level) s.owned[id] = true;
  for (const id of [].concat(q.owns || []).slice(0, 1)) { if (GEAR[id]) s.owned[id] = true; else s.drama.decor[id] = true; }
  if (q.notOwns) { delete s.owned[q.notOwns]; delete s.drama.decor[q.notOwns]; }
  for (const f of [...(q.flags || []), ...(q.anyFlags || []).slice(0, 1)]) s.drama.flags[realFlag(f)] = s.day + 5;
  for (const [f, n] of Object.entries(q.flagMin || {})) s.flags[f] = n;
  for (const f of q.noFlags || []) { delete s.drama.flags[f]; delete s.flags[f]; }
  if (q.debtMin !== undefined) s.drama.debt.test = q.debtMin;
  const S = q.sum || {};
  s.lastSummary = { day: s.day - 1, kind: "toi", kindName: "Ca tối", profit: S.profitMax !== undefined ? S.profitMax - 10 : S.profitMin !== undefined ? S.profitMin + 10 : 60, avg: S.starsMax ?? Math.max(4, S.starsMin || 0), lost: S.lostMin || 0,
    burnt: S.burntMin || 0, smokeMax: S.smokeMin || 20, riceLeft: S.riceLeftMin || 0, plates: S.platesMin || 20, mistakes: S.mistake ? { [S.mistake]: S.mistakeMin || 1 } : {}, seen: true, reviews: [] };
  if (ev.when === "day") { s.dayDone = false; return s; }
  // trong ca
  prepDay(s);
  s.plan = [q.kind || "toi"]; s.shiftIdx = 0;
  must(s, { type: "startShift" });
  const sh = s.shift;
  sh.drama.max = 9; sh.schedule = [];
  const ph = [].concat(q.phase || [])[0];
  let f = ph ? PHASE_F[ph] : 0.3;
  if (q.fMin !== undefined) f = Math.max(f, q.fMin + 0.01);
  if (q.fMax !== undefined) f = Math.min(f, q.fMax - 0.01);
  sh.t = Math.round(sh.len * f);
  const phases = SHIFTS[sh.kind].phases;
  sh.phaseIdx = Math.max(0, phases.findLastIndex((p) => p.at <= f + 1e-9));
  if (ph && phases[sh.phaseIdx].key !== ph) sh.phaseIdx = Math.max(0, phases.findIndex((p) => p.key === ph));
  const needArch = q.archPresent || ev.who?.arch;
  const nWait = Math.max(q.waitingMin || 0, ev.who === "waiting" ? 1 : 0, needArch && ev.who !== "seated" ? 1 : 0);
  for (let i = 0; i < nWait; i++) addGroup(s, i === 0 && needArch ? needArch : ["student", "office", "worker"][i % 3], "wait");
  const nSeat = Math.max(q.seatedMin || 0, ev.who === "seated" ? 1 : 0, q.lastServe || ev.who === "lastServed" ? 1 : 0);
  for (let i = 0; i < nSeat; i++) {
    const L = q.lastServe || {};
    const arch = i === 0 && (L.arch || (L.phone ? "reviewer" : null) || (ev.who === "lastServed" ? "reviewer" : null)) || ["student", "office"][i % 2];
    const g = addGroup(s, [].concat(arch)[0], "seated");
    if (i === 0 && (q.lastServe || ev.who === "lastServed")) {
      const mk = L.mistake === "any" ? ["burnt"] : L.mistake ? [].concat(L.mistake).slice(0, 1) : [];
      sh.drama.lastServe = { gid: g.id, t: sh.t - 100, mistakes: L.clean ? [] : mk, arch: g.arch, tid: g.table, phone: true };
    }
  }
  if (q.freeSeats !== undefined) assert.ok(sh.tables.some((t) => t.gid === null && t.state !== "dirty" && t.seats >= q.freeSeats), `${ev.id}: không có bàn trống ${q.freeSeats} chỗ`);
  if (q.dirtyMin) { let k = 0; for (const t of sh.tables) if (t.gid === null && k < q.dirtyMin && !(q.freeSeats && sh.tables.filter((x) => x.gid === null && x.state !== "dirty").length <= 1)) { t.state = "dirty"; t.plates = 0; t.dirtyT = sh.t; k++; } }
  if (q.coalMax !== undefined) sh.grill.coal = Math.max(0, q.coalMax - 1);
  if (q.coalMin !== undefined) sh.grill.coal = Math.max(sh.grill.coal, q.coalMin);
  if (q.smokeMin !== undefined) sh.grill.smoke = q.smokeMin;
  if (q.riceCooking) sh.rice.cooking = { at: sh.t + 20000, add: 12 };
  if (q.riceMax !== undefined) sh.rice.n = Math.min(sh.rice.n, q.riceMax);
  for (const [id, n] of Object.entries(q.stockMax || {})) s.stock[id] = Math.min(s.stock[id] || 0, n);
  if (q.cleanPlatesMax !== undefined) { const k = sh.cleanPlates - q.cleanPlatesMax; if (k > 0) { sh.cleanPlates -= k; sh.dirty += k; } }
  for (const [k, n] of Object.entries(q.statMin || {})) sh.stats[k] = n;
  const piece = (i) => ({ id: 500 + i, item: "suon", sides: [110, 104], fresh: 100, freshMax: 100, warmMs: 2000, flips: 1, perfect: 1, said: {} });
  for (let i = 0; i < (q.warmMin || 0); i++) sh.grill.slots[4 + i] = piece(4 + i);
  for (let i = 0; i < (q.hotMin || 0); i++) sh.grill.slots[i] = { ...piece(i), sides: [60, 0] };
  for (let i = 0; i < (q.grillMin || 0); i++) if (!sh.grill.slots[2 + i]) sh.grill.slots[2 + i] = { ...piece(2 + i), sides: [50, 0] };
  return s;
}
function openStaged(ev, seed) {
  const s = stage(ev, seed);
  if (ev.if?.chain) s.drama.queue.push({ id: ev.id, day: s.day, from: "test" });
  return s;
}

test("mọi sự kiện mở được: dựng trạng thái thoả điều kiện thì engine chọn được (eligible)", () => {
  const bad = [];
  for (const ev of EVENTS) { const s = openStaged(ev); if (!eligibleNow(s, ev)) bad.push(ev.id); }
  assert.deepEqual(bad, []);
});

function paths(ev) {
  const out = [];
  const walk = (nid, route) => {
    for (const c of ev.nodes[nid].choices) {
      out.push({ route, choice: c.id, node: nid });
      for (const g of [c.goto, c.roll?.win?.goto, c.roll?.lose?.goto].filter(Boolean)) if (route.length < 4 && !route.some((r) => r.node === g) && g !== nid) walk(g, [...route, { node: nid, choice: c.id, goal: g }]);
    }
  };
  walk("start", []);
  const seen = new Set();
  return out.filter((p) => { const k = p.node + ":" + p.choice; if (seen.has(k)) return false; seen.add(k); return true; });
}
function rich(s) {
  s.money = Math.max(s.money, 5000);
  for (const k of Object.keys(s.stock)) s.stock[k] = Math.max(s.stock[k], 30);
  if (s.shift) { s.shift.rice.n = Math.max(s.shift.rice.n, 20); }
}
function forceNeed(s, c) {
  for (const f of c.need?.flags || []) s.drama.flags[realFlag(f)] = s.day + 3;
  for (const f of c.need?.noFlags || []) { delete s.drama.flags[f]; delete s.flags[f]; }
  if (c.need?.owns) { if (GEAR[c.need.owns]) s.owned[c.need.owns] = true; else s.drama.decor[c.need.owns] = true; }
  if (c.need?.stage) s.stage = c.need.stage;
  if (c.need?.minLevel && s.level < c.need.minLevel) { s.level = c.need.minLevel; s.xp = LEVELS[s.level - 1]; }
}

test("mọi lựa chọn ở mọi bước giải quyết được (cả thắng và thua khi hên xui), không phá bất biến", () => {
  let tried = 0;
  for (const ev of EVENTS) {
    for (const p of paths(ev)) {
      const ch = ev.nodes[p.node].choices.find((c) => c.id === p.choice);
      for (const want of ch.roll ? ["win", "lose"] : ["any"]) {
        let done = false;
        for (let seed = 1; seed < 80 && !done; seed++) {
          const s = openStaged(ev, 11);
          s.rng = (seed * 2654435761) >>> 0;
          rich(s);
          const r0 = apply(s, { type: "eventOpen", id: ev.id });
          assert.ok(r0.ok, `${ev.id} không mở được: ${r0.err}`);
          let okRoute = true;
          for (const step of p.route) {
            const sc = ev.nodes[step.node].choices.find((c) => c.id === step.choice);
            forceNeed(s, sc);
            const r = apply(s, { type: "event", choice: step.choice });
            if (r.err || currentEvent(s)?.node !== step.goal) { okRoute = false; break; }
          }
          if (!okRoute) continue;
          forceNeed(s, ch);
          const r = apply(s, { type: "event", choice: ch.id });
          assert.ok(!r.err, `${ev.id}.${p.node}.${ch.id}: ${r.err} ${String(r.detail || "").slice(0, 300)}`);
          const e = r.events.find((x) => x.type === "dramaResolved");
          assert.ok(e && e.say && !/\{\w+\}/.test(e.say), `${ev.id}.${ch.id} không có câu kết quả`);
          if (want !== "any" && e.rolled !== want) continue;
          const d = currentEvent(s);
          assert.ok(!d || ev.nodes[d.node], `${ev.id}.${ch.id} kẹt ở bước lạ`);
          done = true; tried++;
        }
        assert.ok(done, `${ev.id}.${p.node}.${ch.id} (${want}) không thử được`);
      }
    }
  }
  assert.ok(tried > 400, String(tried));
});

test("hẹn quay lại: K03 ghi sổ ⇒ K04 vào hàng hẹn, sang ngày đúng hạn thì hiện trên Chuẩn bị; chọn xong thì đóng", () => {
  const ev = EVENT.K03, s = openStaged(ev);
  must(s, { type: "eventOpen", id: "K03" });
  must(s, { type: "event", choice: "credit" });
  const q = s.drama.queue.find((x) => x.id === "K04");
  assert.ok(q);
  assert.equal(q.day, s.day + 2);
  assert.ok(s.drama.history[0].id === "K03" && s.drama.moments[0].line.includes("Anh Sáu"));
  // kết thúc ca nhanh rồi sang ngày
  const day = s.day;
  q.day = day + 1;
  const sh = s.shift; sh.schedule = []; sh.groups = []; for (const t of sh.tables) { t.gid = null; if (t.state === "dirty") { sh.dirty += t.plates; t.plates = 0; t.state = "clean"; } }
  sh.t = sh.len + 1;
  must(s, { type: "tick", dt: 100 });
  assert.equal(s.shift, null);
  must(s, { type: "nextDay" });
  assert.equal(s.day, day + 1);
  assert.equal(s.drama.pending?.id, "K04");
  assert.ok(currentEvent(s));
  const before = s.money;
  must(s, { type: "event", choice: "limit75" });
  assert.equal(s.money, before + 25);
  assert.equal(currentEvent(s).node, "cho");
  must(s, { type: "event", choice: "rest" });
  assert.equal(s.drama.pending, null);
  assert.ok(s.drama.queue.some((x) => x.id === "K05" && x.day === s.day + 7));
});

test("tải lại giữa hội thoại giữ đúng bước (trong ca và trên Chuẩn bị); mở ca thì sự kiện ngày chưa chọn được bỏ qua", () => {
  const ev = EVENT.K09, s = openStaged(ev);
  must(s, { type: "eventOpen", id: "K09" });
  must(s, { type: "event", choice: "last" });
  const r = loadSave(dump(s));
  assert.equal(r.shift.dialog.kind, "event");
  assert.equal(r.shift.dialog.node, "song");
  const d = stage(EVENT.D01);
  must(d, { type: "eventOpen", id: "D01" });
  const r2 = loadSave(dump(d));
  assert.equal(r2.drama.pending.id, "D01");
  prepDay(r2);
  must(r2, { type: "startShift" });
  assert.equal(r2.drama.pending, null);
});

test("hiệu ứng: tiền, danh tiếng, cờ, khách thêm, đơn nhiều phần có nhãn, dĩa bể (dĩa vẫn được bảo toàn)", () => {
  const s = openStaged(EVENT.O11);
  must(s, { type: "eventOpen", id: "O11" });
  const plates = s.plates;
  must(s, { type: "event", choice: "clean" });
  assert.equal(s.plates, plates - 2);
  const k = openStaged(EVENT.K01);
  must(k, { type: "eventOpen", id: "K01" });
  const n0 = k.shift.schedule.length;
  must(k, { type: "event", choice: "all" });
  assert.equal(k.shift.schedule.length, n0 + 1);
  assert.ok(k.shift.schedule.at(-1).tag?.startsWith("dr:K01"));
  assert.ok(k.shift.drama.watch.some((w) => w.tip === 15 && w.laterOk?.id === "K02"));
  must(k, { type: "event", choice: "charge" });
  assert.equal(currentEvent(k), null);
  assert.equal(k.shift.dialog, null);
});

test("người nói là khách trong cảnh: tên khớp NPC thì dùng chân dung NPC; câu {self}/{call} theo vai", () => {
  const s = openStaged(EVENT.K12);
  must(s, { type: "eventOpen", id: "K12" });
  const d = currentEvent(s);
  const info = speakerInfo(s, d);
  assert.ok(info.cid !== undefined && info.name);
  const ctx = textCtx(s, d);
  assert.ok(ctx.self && ctx.call);
  assert.ok(!/\{\w+\}/.test(fill(nodeOf(s, EVENT.K12, "start").line, ctx)));
});

test("mô phỏng 14 ngày × 2 hạt có Drama: không lỗi, có sự kiện trong ca và giữa hai ngày, cờ hết hạn", () => {
  for (const seed of [2, 31]) {
    const s = newGame(seed);
    let between = 0;
    const rnd = seeded(seed);
    for (let d = 0; d < 14; d++) {
      if (s.drama.pending) {
        between++;
        for (let k = 0; k < 4 && currentEvent(s); k++) must(s, { type: "event", choice: pickOk(s, rnd) });
      }
      prepDay(s);
      do { playShift(s, { rnd }); } while (!s.dayDone);
      must(s, { type: "nextDay" });
    }
    const inShift = s.drama.history.filter((h) => EVENT[h.id].when === "shift").length;
    assert.ok(s.drama.history.length >= 6, `hạt ${seed}: ${s.drama.history.length} lựa chọn`);
    assert.ok(inShift >= 3, `hạt ${seed}: ${inShift} sự kiện trong ca`);
    assert.ok(between >= 2, `hạt ${seed}: ${between} sự kiện giữa hai ngày`);
    for (const until of Object.values(s.drama.flags)) assert.ok(until >= s.day, "cờ quá hạn chưa xoá");
    assert.ok(s.money >= 0 && Number.isInteger(s.money));
  }
});
function pickOk(s, rnd) {
  const d = currentEvent(s), node = EVENT[d.id].nodes[d.node];
  const ok = node.choices.filter((c) => affordable(s, c));
  return ok[Math.floor(rnd() * ok.length)].id;
}
export { DRAMA };
