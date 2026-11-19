// Milestone 5: chơi lại ngày hôm nay, hội chợ (cấp 18), ca thử thách + huy hiệu (cấp 20), máy rót hai vòi, hạng tiệm,
// tiền thuê theo cấp, bản lưu v3 → v4 (đường cong XP mới giữ nguyên cấp).
import test from "node:test";
import assert from "node:assert/strict";
import { dump, loadSave, MIGRATIONS, SAVE_VERSION, OLD_XP, remapXp } from "../core/state.js";
import { shopSave, KEY, DAY_KEY, REPLAY_BACKUP_KEY, backupKey } from "../save.js";
import { FAIR, fairAvailable, TIERS, shiftFee } from "../core/fair.js";
import { CHALLENGES, challengeToday, BADGES } from "../core/challenge.js";
import { levelForXp } from "../core/progression.js";
import { captionKind } from "../core/journal.js";
import { EVENT } from "../data/events.js";
import { LEVELS } from "../data/levels.js";
import { RECIPE } from "../data/recipes.js";
import { FAIR_REVIEW, CHALLENGE_REVIEW, DUAL_SPOUT_REVIEW, DUAL_SPOUT_LINES, FAIR_ORDER, BADGE_LINES, CHALLENGE_WIN, CHALLENGE_FAIL } from "../data/lines-m5.js";
import { shop, act, err, advance, untilWaiting, clearDrama, openDay } from "./helpers.mjs";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
const at = (level, seed = 11) => { const s = shop(seed); s.introSeen = true; s.tutorialDone = true; s.day = 8; s.money = 5000; s.xp = LEVELS[level - 1].xp; s.level = level; s.drama.queue = []; for (const id of Object.keys(s.stock)) s.stock[id] = 12; s.capacity = 400; return s; };
/** Chơi hết ca: giao đúng từng khách, giải quyết mọi hội thoại. */
function playOut(s, max = 6000) {
  for (let g = 0; g < max && s.shift; g++) {
    const d = s.shift.dialog;
    if (d?.kind === "event") { clearDrama(s); continue; }
    if (d?.kind === "complaint") { act(s, { type: "resolve", choice: "refund" }); continue; }
    if (d?.kind === "stockout") { act(s, { type: "stockout", choice: "close" }); continue; }
    act(s, { type: "tick", dt: 500 });
  }
}

test("chơi lại ngày hôm nay: chụp đầu ngày một lần, quay lại cất bản hiện tại, đọc lại đúng ngày", () => {
  const mem = new Mem(), store = shopSave(mem);
  const s = at(3);
  assert.equal(store.snapshotDay(s), true);
  assert.equal(store.snapshotDay(s), false, "mỗi ngày một ảnh");
  assert.deepEqual(store.replayInfo(), { day: 8, seed: s.seed });
  const money0 = s.money;
  act(s, { type: "startShift" });
  assert.equal(store.snapshotDay(s), false, "đang mở ca thì không chụp");
  s.shift.drama.max = 0;
  playOut(s);
  assert.equal(s.day, 9);
  store.write(s);
  const now = mem.getItem(KEY);
  assert.equal(store.replayDay(), true);
  assert.equal(mem.getItem(REPLAY_BACKUP_KEY), now, "bản trước khi chơi lại được cất");
  const r = store.read(1);
  assert.equal(r.state.day, 8);
  assert.equal(r.state.money, money0);
  assert.equal(r.state.shift, null);
  // sang ngày mới thì ảnh đổi
  const t = r.state; t.day = 9;
  assert.equal(store.snapshotDay(t), true);
  assert.equal(store.replayInfo().day, 9);
  // chơi lại từ đầu xoá luôn ảnh đầu ngày
  store.reset();
  assert.equal(mem.getItem(DAY_KEY), null);
  assert.equal(store.replayDay(), false, "không có ảnh thì không chơi lại");
});

test("bản lưu v3 → v4: XP quy đổi giữ đúng cấp + tiến độ, chép bản v3 sang .bak-v3, thêm huy hiệu / hạng / hội chợ", () => {
  assert.equal(SAVE_VERSION, 4);
  assert.ok(MIGRATIONS[3]);
  for (const [xp, lv] of [[0, 1], [29, 1], [30, 2], [100, 3], [670, 10], [1500, 15], [2370, 20], [2500, 20]]) {
    assert.equal(levelForXp(remapXp(xp)), lv, `XP cũ ${xp} ⇒ cấp ${lv}`);
    let old = 1; for (let i = 0; i < OLD_XP.length; i++) if (xp >= OLD_XP[i]) old = i + 1;
    assert.equal(old, lv);
  }
  const s = at(12);
  const old = JSON.parse(dump(s));
  old.v = 3; old.xp = 1000; // cấp 12 theo bảng cũ (930–1075), ~48% cấp
  delete old.badges; delete old.tier; delete old.fair; delete old.challenge;
  const mem = new Mem(); mem.setItem(KEY, JSON.stringify(old));
  const r = shopSave(mem).read(1);
  assert.equal(r.migrated, 3);
  assert.equal(r.state.level, 12);
  const into = (r.state.xp - LEVELS[11].xp) / (LEVELS[12].xp - LEVELS[11].xp);
  assert.ok(Math.abs(into - (1000 - 930) / (1075 - 930)) < 0.02, `tiến độ ${into}`);
  assert.deepEqual(r.state.badges, {}); assert.equal(r.state.tier, 0);
  assert.equal(JSON.parse(mem.getItem(backupKey(3))).xp, 1000);
});

test("tiền thuê ca tăng theo cấp (12k ở cấp 1)", () => {
  assert.equal(shiftFee({ level: 1 }), 12);
  assert.ok(shiftFee({ level: 20 }) > 40);
  const s = at(10);
  const m = s.money;
  act(s, { type: "startShift" });
  assert.equal(m - s.money, shiftFee(s));
});

test("hội chợ: mở ở cấp 18, phí gian hàng, ca dài + đông + giá cao + đơn nhóm kết hợp, mỗi 4 ngày một lần", () => {
  const low = at(17);
  assert.equal(fairAvailable(low), false);
  assert.equal(err(low, { type: "fair" }), "locked");
  const s = at(18);
  assert.ok(fairAvailable(s));
  const m = s.money;
  act(s, { type: "fair" });
  assert.equal(s.money, m - FAIR.fee);
  assert.equal(err(s, { type: "fair" }), "already");
  act(s, { type: "startShift" });
  assert.equal(s.shift.fair, true);
  assert.equal(s.shift.duration, FAIR.duration);
  assert.ok(s.shift.planned >= 12, `${s.shift.planned} khách`);
  const multi = s.shift.schedule.filter((g) => g.items.length > 1);
  assert.ok(multi.length >= 2, "nhiều đơn nhóm");
  assert.ok(multi.some((g) => new Set(g.items.map((i) => i.recipe)).size > 1), "đơn nhóm kết hợp (khác món)");
  s.shift.drama.max = 0;
  const c = untilWaiting(s);
  assert.equal(c.items[0].price, Math.round(RECIPE[c.items[0].recipe].price * FAIR.priceMul), "giá hội chợ +15%");
  playOut(s);
  assert.equal(s.lastSummary.fair, true);
  assert.equal(captionKind(s.lastSummary), s.lastSummary.profit < 0 ? "loss" : "fair");
  assert.ok(s.drama.flags["hoi-cho-xong"]);
  assert.equal(fairAvailable(s), false, "chưa đủ 4 ngày");
  s.day += FAIR.every - 1;
  assert.equal(fairAvailable(s), true);
});

test("ca thử thách: lịch xoay vòng 5 loại ở cấp 20; tham gia đúng thử thách hôm nay; mods có hiệu lực; chốt ca xét mục tiêu + huy hiệu", () => {
  const s = at(20);
  const ch = challengeToday(s);
  assert.ok(ch && CHALLENGES.includes(ch));
  const other = CHALLENGES.find((c) => c.id !== ch.id);
  assert.equal(err(s, { type: "challenge", id: other.id }), "not-today");
  assert.equal(err(at(19), { type: "challenge", id: ch.id }), "locked");
  for (const c of CHALLENGES) {
    const t = at(20, 5); t.day = CHALLENGES.indexOf(c) + 10 * CHALLENGES.length;
    act(t, { type: "challenge", id: c.id });
    act(t, { type: "startShift" });
    t.shift.drama.max = 0;
    if (c.id === "mot-cho") assert.equal(t.shift.stations.length, 1);
    if (c.id === "khong-hoan-tac") { untilWaiting(t); act(t, { type: "brew", step: "cup", id: "ly" }); assert.equal(err(t, { type: "undo" }), "no-undo"); }
    if (c.id === "kho-tinh") assert.ok(t.shift.schedule.every((g) => ["khach-quen", "reviewer", "vip"].includes(g.arch)));
    playOut(t);
    const S = t.lastSummary;
    assert.equal(S.challenge.id, c.id);
    assert.equal(typeof S.challenge.ok, "boolean");
    assert.equal(captionKind(S), S.challenge.ok ? "challengeWin" : "challengeLose");
    if (S.challenge.ok) assert.ok(t.badges["tt-" + c.id], "huy hiệu thử thách");
    assert.ok(t.badges["chu-tiem"], "huy hiệu Chủ Tiệm ở cấp 20");
  }
});

test("huy hiệu: xét lúc chốt ca, mỗi huy hiệu một lần, lưu qua tải lại", () => {
  const s = at(20);
  s.money = 4000;
  act(s, { type: "startShift" }); s.shift.drama.max = 0; playOut(s);
  const got = Object.keys(s.badges);
  assert.ok(got.includes("chu-tiem") && got.includes("trieu-phu"), got.join());
  assert.ok(s.lastSummary.badges.length >= 2);
  const b = loadSave(dump(s));
  assert.deepEqual(b.badges, s.badges);
  clearDrama(s);
  act(s, { type: "startShift" }); s.shift.drama.max = 0; playOut(s);
  assert.ok(!s.lastSummary.badges.some((x) => x.id === "chu-tiem"), "không nhận lại");
  assert.ok(BADGES.length >= 12);
});

test("hạng tiệm: 8 bậc mở theo cấp, trừ tiền, thêm khách + kiên nhẫn", () => {
  const s = at(10);
  assert.equal(TIERS.length, 8);
  act(s, { type: "tier" });
  assert.equal(s.tier, 1);
  assert.equal(err(s, { type: "tier" }), "locked", "bậc 2 mở ở cấp 11");
  const a = at(20), b = at(20);
  a.tier = 8;
  act(a, { type: "startShift" }); act(b, { type: "startShift" });
  assert.ok(a.shift.planned >= b.shift.planned);
  assert.ok(a.shift.patienceMult > b.shift.patienceMult);
});

test("máy rót hai vòi: cần bàn pha đôi; rót trà nền cho chỗ pha khác đúng loại trà của ly đó; review riêng", () => {
  const s = at(11);
  assert.equal(err(s, { type: "buy", id: "dual-spout-brewer" }), "requires");
  act(s, { type: "buy", id: "double-station" });
  act(s, { type: "buy", id: "dual-spout-brewer" });
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  const c1 = untilWaiting(s);
  act(s, { type: "pin", cid: c1.id });
  // ép khách thứ hai tới cùng lúc với món trà nền khác
  let c2 = null;
  for (let i = 0; i < 400 && !c2; i++) { advance(s, 250); c2 = s.shift.customers.find((c) => c.id !== c1.id && c.phase === "wait"); }
  assert.ok(c2);
  c2.items[0].order.base = c1.order.base === "o-long" ? "hong-tra" : "o-long"; c2.order = { ...c2.items[0].order };
  act(s, { type: "select", station: 1 });
  act(s, { type: "pin", cid: c2.id });
  act(s, { type: "select", station: 0 });
  const st = () => s.shift.stations;
  act(s, { type: "brew", step: "cup", id: "ly" });
  if (!st()[1].cup) { act(s, { type: "select", station: 1 }); act(s, { type: "brew", step: "cup", id: "ly" }); act(s, { type: "select", station: 0 }); }
  const r = act(s, { type: "brew", step: "base", id: c1.order.base });
  const ev = r.events.find((e) => e.type === "brewed");
  assert.deepEqual(ev.dual, [1], JSON.stringify(ev));
  assert.ok(DUAL_SPOUT_LINES.includes(ev.line));
  assert.equal(st()[1].cup.steps[1].id, c2.order.base, "ly bên kia đúng loại trà của nó");
  assert.ok(st()[0].cup.dual && st()[1].cup.dual);
});

test("sự kiện M5 (FA1–FA3, CH1–CH2, DS1–DS2) mở được, mọi lựa chọn giải quyết được", () => {
  for (const id of ["FA1", "FA2", "FA3", "CH1", "CH2", "DS1", "DS2"]) {
    const ev = EVENT[id];
    assert.ok(ev, id);
    for (const ch of ev.nodes.start.choices) {
      const s = at(20);
      s.owned["double-station"] = true; s.owned["dual-spout-brewer"] = true;
      s.drama.flags = { "hoi-cho": s.day, "hoi-cho-xong": s.day + 3, "thu-thach": s.day, "thu-thach-dat": s.day + 3 };
      if (ev.when === "shift") { act(s, { type: "startShift" }); s.shift.drama.max = 0; untilWaiting(s); s.shift.dialog = { kind: "event", id, node: "start", cid: ev.who ? s.shift.customers.find((c) => c.phase === "wait").id : null, npc: ev.npc || null, steps: 0 }; }
      else s.drama.pending = { kind: "event", id, node: "start", cid: null, npc: ev.npc, steps: 0 };
      act(s, { type: "choose", choice: ch.id });
    }
  }
});

test("nội dung M5: 8–12 review mỗi kết cục, câu riêng từng cơ chế, không emoji", () => {
  for (const [k, list] of Object.entries({ ...FAIR_REVIEW, ...Object.fromEntries(Object.entries(CHALLENGE_REVIEW).map(([a, b]) => ["ch-" + a, b])), ...Object.fromEntries(Object.entries(DUAL_SPOUT_REVIEW).map(([a, b]) => ["ds-" + a, b])) })) {
    assert.ok(list.length >= 8 && list.length <= 12, `${k}: ${list.length}`);
  }
  for (const list of [FAIR_ORDER, BADGE_LINES, CHALLENGE_WIN, CHALLENGE_FAIL, DUAL_SPOUT_LINES]) assert.ok(list.length >= 8);
  const all = JSON.stringify([FAIR_REVIEW, CHALLENGE_REVIEW, DUAL_SPOUT_REVIEW, FAIR_ORDER, BADGE_LINES, CHALLENGE_WIN, CHALLENGE_FAIL, DUAL_SPOUT_LINES]);
  assert.ok(!/\p{Extended_Pictographic}/u.test(all));
});

test("chân dung NPC Drama và thời tiết đọc từ manifest, có dự phòng nếu thiếu sheet", async () => {
  const { makeAtlas, SHEETS, HD_SHEETS, OPTIONAL_SHEETS, LAZY_SHEETS } = await import("../render/atlas.js");
  const { npcFace, NPC_FACES } = await import("../ui/panels.js");
  const { readFileSync } = await import("node:fs");
  const manifest = JSON.parse(readFileSync(new URL("../data/asset-manifest.json", import.meta.url), "utf8"));
  const real = makeAtlas(manifest);
  const fallback = makeAtlas({ ...manifest, items: manifest.items.filter((item) =>
    item.filename !== HD_SHEETS.drama && item.filename !== SHEETS.weather) });
  assert.equal(fallback.has("drama", "me-happy"), false);
  assert.equal(fallback.sheet("weather"), null);
  assert.ok(OPTIONAL_SHEETS.has("weather") && LAZY_SHEETS.has(SHEETS.weather) && LAZY_SHEETS.has(HD_SHEETS.drama));
  for (const [name, id] of [["Mẹ", "me"], ["Dì Ba tạp hoá", "di-ba"], ["Anh Út vựa sỉ", "anh-ut"], ["Anh Tèo shipper", "anh-teo"], ["Bé Bông Official", "be-bong"], ["Chị Lụa Hẻm Bên", "chi-lua"], ["Cô Hạnh tổ kiểm tra phường", "co-to"], ["Bà Tư bán xôi", null]]) assert.equal(npcFace(name), id, name);
  assert.equal(NPC_FACES.length, 7);
  const portrait = real.frame("drama", "me-happy");
  assert.ok(portrait?.hd && portrait.w === 192 && portrait.h === 160, JSON.stringify(portrait));
  const rain = real.frame("weather", "rain-1");
  assert.equal(rain?.w, 640);
  assert.equal(rain?.h, 360);
  assert.deepEqual(real.clip("weather", "rain")?.frames, ["rain-1", "rain-2", "rain-3", "rain-4"]);
  assert.deepEqual(real.clip("weather", "lightning")?.frames, ["lightning-1", "lightning-2"]);
  assert.ok(real.has("weather", "power-cut-glow"));
});
