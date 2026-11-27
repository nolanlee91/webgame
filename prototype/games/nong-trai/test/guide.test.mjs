// TLC12-01: hồ sơ mới chỉ làm đúng theo mũi tên (core/guide.js tutorialGoal ⇒ game.js highlight) đi hết NV1–NV5, không có bước nào
// thiếu mục tiêu; NV4 không bao giờ "Bán hết"; bản lưu cũ kẹt giữa chừng (NV3 ruộng trống, NV5 kho trống) vẫn có đường đi.
import test from "node:test";
import assert from "node:assert/strict";
import { TUTORIAL } from "../data/quests.js?v=m17";
import { currentQuest } from "../core/quests.js?v=m17";
import { tutorialGoal } from "../core/guide.js?v=m17";
import { loadSave, dump } from "../core/state.js?v=m17";
import { farm, act, START } from "./helpers.mjs";

/** Làm đúng một việc mũi tên chỉ. Trả mốc giờ mới. */
function follow(s, g, t) {
  switch (g.do) {
    case "claim": act(s, { type: "claimQuest", id: currentQuest(s).id }, t); return t;
    case "plant": act(s, { type: "plant", i: g.i, crop: g.crop }, t); return t;
    case "water": act(s, { type: "water", i: g.i }, t); return t;
    case "harvest": act(s, { type: "harvest", i: g.i }, t); return t;
    case "wait": assert.ok(g.ms > 0 && g.hint.includes("Chờ cây chín")); return t + g.ms;
    case "sell": { const before = s.inv[g.id]; act(s, { type: "sell", id: g.id, n: 1 }, t); assert.equal(s.inv[g.id] || 0, before - 1, "chỉ bán 1"); return t; }
    case "deliver": { const x = s.orders.slots[g.slot]; act(s, { type: "deliver", slot: g.slot, id: x.order.id, rev: x.rev }, t); return t; }
  }
  throw new Error("mũi tên lạ: " + JSON.stringify(g));
}
/** Chỉ theo mũi tên tới khi xong NV `upto` (chỉ số trong TUTORIAL). Trả { t, steps, detours }. */
function walk(s, t, upto = 5) {
  let steps = 0, detours = 0;
  while (s.quests.tut < upto) {
    const g = tutorialGoal(s, t);
    assert.ok(g, `NV${s.quests.tut + 1} (${currentQuest(s).id}) không có mũi tên`);
    if (g.detour) { detours++; assert.ok(g.hint, "đi vòng thì có gợi ý chữ"); }
    t = follow(s, g, t);
    assert.ok(++steps < 80, "đi mãi không xong");
  }
  return { t, steps, detours };
}

test("hồ sơ mới chỉ chạm theo mũi tên: xong NV1–NV5 (gieo 3 → tưới → thu 3 → bán 1 → giao đơn), chỉ chờ cây chứ không phải gieo thêm, 5 seed", () => {
  for (const seed of [1, 2, 3, 7, 42]) {
    const s = farm(seed);
    const kinds = [];
    let t = START, guard = 0;
    while (s.quests.tut < 5) { const g = tutorialGoal(s, t); assert.ok(g); kinds.push(g.do); t = follow(s, g, t); assert.ok(++guard < 80); }
    assert.equal(currentQuest(s).id, "mo-o-dat");
    assert.equal(kinds.filter((k) => k === "plant").length, 3, "NV1 gieo đúng 3 hạt tặng, không phải gieo thêm");
    assert.ok(!kinds.includes("sell") || kinds.filter((k) => k === "sell").length === 1);
    assert.equal(s.stats.delivered, 1, "đã giao đơn đầu");
    assert.ok(!tutorialGoal(s, t), "NV6 trở đi dùng nhánh cũ của game.js");
  }
});

test("NV1 cần 3 hạt = đúng 3 hạt tặng; NV3 'Thu hoạch 3' đủ cây từ NV1", () => {
  assert.equal(TUTORIAL[0].count, 3);
  assert.equal(TUTORIAL[2].count, 3);
  assert.ok(TUTORIAL[0].count >= TUTORIAL[2].count);
  assert.equal(farm().freeSeeds, TUTORIAL[0].count);
});

test("bản lưu cũ kẹt NV3 (gieo 1 hạt ở NV1, đã thu 1, ruộng trống) ⇒ mũi tên trỏ gieo hạt, gợi ý tự mở, đi tiếp tới hết NV5", () => {
  const s = farm(5);
  s.quests.tut = 2; s.quests.progress = 1; s.inv["ca-rot"] = 1;
  const s2 = loadSave(JSON.parse(JSON.stringify(dump(s))), START); // qua đường nạp bản lưu thật
  const g = tutorialGoal(s2, START);
  assert.equal(g.do, "plant"); assert.ok(g.detour && g.hint);
  const r = walk(s2, START);
  assert.ok(r.detours > 0);
  assert.equal(currentQuest(s2).id, "mo-o-dat");
});

test("bản lưu cũ kẹt NV5 (đã 'Bán hết' ở NV4, kho trống) ⇒ mũi tên trỏ gieo món đơn cần, rồi thu, rồi giao", () => {
  const s = farm(9);
  s.quests.tut = 4; s.quests.progress = 0; s.inv = {}; s.freeSeeds = 0; s.coins = 30;
  const g = tutorialGoal(s, START);
  assert.equal(g.do, "plant"); assert.ok(g.detour && /thiếu hàng/.test(g.hint));
  const r = walk(s, START);
  assert.equal(s.stats.delivered, 1);
  assert.ok(r.steps < 40);
});

test("NV3 khi cây còn đang lớn ⇒ mũi tên 'chờ' kèm đồng hồ, không trỏ gieo thêm", () => {
  const s = farm(3);
  s.quests.tut = 2; s.quests.progress = 0;
  act(s, { type: "plant", i: 12, crop: "ca-rot" }, START);
  act(s, { type: "water", i: 12 }, START);
  const g = tutorialGoal(s, START + 1000);
  assert.equal(g.do, "wait"); assert.equal(g.i, 12); assert.match(g.hint, /Chờ cây chín… \d+:\d\d/);
});

test("NV4 bán món dư so với đơn đang cần (giữ đủ cà rốt cho đơn đầu)", () => {
  const s = farm(4);
  s.quests.tut = 3; s.quests.progress = 0; s.inv = { "ca-rot": 2, "ca-chua": 1 };
  // đơn đầu cần 2 cà rốt, đơn 2 cần 1 cà chua + 1 cà rốt ⇒ không món nào "dư" hẳn: vẫn chỉ bán 1, không bán hết
  const g = tutorialGoal(s, START);
  assert.equal(g.do, "sell");
  s.inv = { "ca-rot": 9 };
  assert.deepEqual(tutorialGoal(s, START), { do: "sell", id: "ca-rot" });
});
