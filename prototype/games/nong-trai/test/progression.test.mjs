import test from "node:test";
import assert from "node:assert/strict";
import * as G from "../core/progression.js?v=m10";
import { LEVELS, MAX_LEVEL, CURRENT_MILESTONE } from "../data/levels.js?v=m10";
import { CROPS } from "../data/crops.js?v=m10";
import { farm, START } from "./helpers.mjs";
import { loadSave, migrateV2, dump } from "../core/state.js?v=m10";

test("đường XP (bảng data/levels.js XP_TO_NEXT, Milestone 5): tăng dần, ≈ 45·cấp², tổng tới cấp 20 ≈ 104 000 XP", () => {
  assert.equal(G.xpNeed(1), 50);
  assert.equal(G.xpNeed(4), 500);
  assert.equal(G.xpNeed(19), 14950);
  assert.equal(G.xpNeed(25), G.xpNeed(MAX_LEVEL), "trên cấp 20 ⇒ trần cấp 20");
  assert.equal(G.xpNeed(0), G.xpNeed(1));
  let total = 0;
  for (let lv = 1; lv <= MAX_LEVEL; lv++) {
    assert.ok(Number.isInteger(G.xpNeed(lv)) && G.xpNeed(lv) % 10 === 0);
    if (lv > 1) assert.ok(G.xpNeed(lv) > G.xpNeed(lv - 1));
    if (lv < MAX_LEVEL) total += G.xpNeed(lv);
    assert.ok(Math.abs(G.xpNeed(lv) / (45 * lv * lv) - 1) <= 0.31, `cấp ${lv} lệch xa 45·cấp²`);
  }
  assert.equal(total, 104_190);
});

test("bảng 20 cấp trong data; mỗi cây mở đúng cấp của bảng cây", () => {
  assert.equal(LEVELS.length, MAX_LEVEL);
  assert.deepEqual(LEVELS.map((l) => l.lv), Array.from({ length: 20 }, (_, k) => k + 1));
  for (const c of CROPS.filter((c) => !c.requires)) {
    const at = LEVELS.find((l) => l.unlocks.some((u) => u.kind === "crop" && u.id === c.id));
    assert.equal(at.lv, c.level, c.id);
  }
});

test("cộng XP lên nhiều cấp cùng lúc, mỗi cấp một sự kiện có danh sách mở khoá (chỉ món đã có ở bản này)", () => {
  const s = farm();
  const ev = [];
  G.addXp(s, G.xpNeed(1) + G.xpNeed(2) + G.xpNeed(3), ev);
  assert.equal(s.level, 4);
  assert.equal(s.xp, 0, "đúng mốc ⇒ XP dư 0");
  assert.deepEqual(ev.map((e) => e.level), [2, 3, 4]);
  assert.ok(ev[0].unlocks.includes("Dâu tây"));
  assert.ok(ev[1].unlocks.includes("Ngô") && ev[1].unlocks.includes("Ô đơn thứ 4"));
  assert.ok(ev[2].unlocks.includes("Xưởng + Bếp sên"), "Milestone 2: Xưởng được báo khi lên cấp 4");
  assert.ok(G.unlocksAt(7).some((u) => u.name === "Chuồng gà"), "Milestone 4: Chuồng gà được báo khi lên cấp 7");
  assert.ok(G.unlocksAt(15).some((u) => u.name === "Hàng rào đá"), "Milestone 6: Hàng rào đá được báo khi lên cấp 15");
  for (const l of LEVELS) for (const u of G.unlocksAt(l.lv)) assert.ok(u.milestone <= CURRENT_MILESTONE);
});

test("tính năng mở theo cấp từ data/levels.js", () => {
  const s = farm();
  assert.equal(G.hasFeature(s, "plots"), false);
  s.level = 2;
  assert.equal(G.hasFeature(s, "plots"), true);
  assert.equal(G.hasFeature(s, "orders-combo"), false);
  s.level = 5;
  assert.equal(G.hasFeature(s, "orders-combo"), true);
  assert.equal(G.hasFeature(s, "orders-special"), false);
  s.level = 11;
  assert.equal(G.hasFeature(s, "orders-special"), true);
  assert.equal(G.nextUnlock(1).lv, 2);
});

test("trần cấp 20: addXp không vượt cấp 20, không còn levelUp sau 20, XP bị kẹp", () => {
  const s = farm();
  const ev = [];
  let total = 0;
  for (let lv = 1; lv < MAX_LEVEL; lv++) total += G.xpNeed(lv);
  G.addXp(s, total + 5 * G.xpNeed(MAX_LEVEL) + 123, ev);
  assert.equal(s.level, MAX_LEVEL);
  assert.deepEqual(ev.map((e) => e.level), Array.from({ length: MAX_LEVEL - 1 }, (_, k) => k + 2), "mỗi cấp 2..20 đúng một sự kiện");
  assert.ok(s.xp <= G.xpNeed(MAX_LEVEL), "XP kẹp ở mức của cấp 20");
  assert.ok(s.xp >= 0);
  // đã ở trần: cộng thêm bao nhiêu cũng không lên cấp, không có sự kiện
  for (const n of [1, G.xpNeed(MAX_LEVEL), 1e9]) {
    const more = [];
    G.addXp(s, n, more);
    assert.equal(s.level, MAX_LEVEL);
    assert.equal(more.length, 0);
    assert.equal(s.xp, G.xpNeed(MAX_LEVEL));
  }
  // lên cấp 20 từng chút một từ cấp 19
  const t = farm(); t.level = MAX_LEVEL - 1; t.xp = G.xpNeed(MAX_LEVEL - 1) - 1;
  const e2 = [];
  G.addXp(t, 10 * G.xpNeed(MAX_LEVEL), e2);
  assert.deepEqual(e2.map((e) => e.level), [MAX_LEVEL]);
  assert.equal(t.level, MAX_LEVEL);
  assert.ok(t.xp <= G.xpNeed(MAX_LEVEL));
  // trạng thái hỏng (cấp > 20) bị kéo về 20, không phát sự kiện
  const u = farm(); u.level = 150; u.xp = 5;
  const e3 = [];
  G.addXp(u, 1e6, e3);
  assert.equal(u.level, MAX_LEVEL);
  assert.equal(e3.length, 0);
  assert.ok(u.xp <= G.xpNeed(MAX_LEVEL));
});

test("tải bản lưu cấp 150 (v4 và v2) ⇒ cấp 20, XP hợp lệ", () => {
  const d = JSON.parse(dump(farm(5), START));
  Object.assign(d, { level: 150, xp: 1e9 });
  const l = loadSave(JSON.stringify(d), START);
  assert.ok(l);
  assert.equal(l.level, MAX_LEVEL);
  assert.ok(l.xp >= 0 && l.xp < G.xpNeed(MAX_LEVEL));
  const v2 = { v: 2, coins: 10, xp: 1e9, level: 150, bought: 0, lastSeen: START, freeSeeds: 0, upgrade: 0, stock: {}, orders: [],
    plots: Array.from({ length: 25 }, (_, i) => ({ open: [6, 7, 8, 11, 12, 13, 16, 17, 18].includes(i), crop: null, plantAt: 0, readyAt: 0, watered: false })) };
  const m = migrateV2(v2, START);
  assert.ok(m);
  assert.equal(m.level, MAX_LEVEL);
  assert.ok(m.xp >= 0 && m.xp < G.xpNeed(MAX_LEVEL));
});
