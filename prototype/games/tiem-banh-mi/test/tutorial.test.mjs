// Ngày 1 có gợi ý từng bước; nhịp ba buổi; chốt ca lời lỗ; âm thanh im lặng an toàn khi chưa có file.
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, advance, untilWaiting, build, customer, playShift } from "./helpers.mjs";
import { hint } from "../core/tutorial.js";
import { clockOf, phaseAt } from "../core/shift.js";
import { soundsFor, AVAILABLE, play, MUTE_KEY, SFX, LOOPS, WARM } from "../ui/sfx.js";
import { readdirSync } from "node:fs";
import { PHASES } from "../data/shift.js";

test("gợi ý ngày 1 theo đúng bước: nướng → rút → ghim → lấy bánh → rạch → phết … → giao → thối tiền", () => {
  const s = shop(); act(s, { type: "startShift" });
  assert.equal(hint(s).key, "bake");
  act(s, { type: "bake", slot: 0 });
  assert.equal(hint(s).key, "waitOven");
  advance(s, 27000);
  assert.equal(hint(s).key, "pull");
  act(s, { type: "pull", slot: 0 });
  const c = untilWaiting(s);
  assert.equal(hint(s).key, "pin");
  act(s, { type: "pin", cid: c.id });
  assert.equal(hint(s).key, "take");
  act(s, { type: "take" });
  assert.equal(hint(s).key, "slice");
  act(s, { type: "slice" });
  assert.equal(hint(s).key, "spread");
  build(s, customer(s, c.id).items[0]);
  assert.equal(hint(s).key, "serve");
  act(s, { type: "serve" });
  assert.equal(hint(s).key, "change");
  assert.ok(s.shift.tutorial);
});

test("ngày 1 là ca hướng dẫn: 10 khách, kiên nhẫn dài; ngày 2 hết hướng dẫn", () => {
  const s = shop(); act(s, { type: "startShift" });
  assert.equal(s.shift.schedule.length, 10);
  assert.ok(s.shift.schedule[0].patienceMul > 1.5);
  playShift(s);
  act(s, { type: "startShift" });
  assert.equal(s.shift.tutorial, false);
  assert.equal(hint(s) && s.shift.tutorial, false);
});

test("ba buổi: cao điểm sáng 05:30–08:00 (55% khách), trưa vắng 11:00–13:00, chiều tối 16:00–19:00", () => {
  assert.equal(clockOf(0), "05:30");
  assert.equal(phaseAt(50000).id, "sang");
  assert.equal(phaseAt(120000).id, "trua");
  assert.equal(phaseAt(200000).id, "chieu");
  assert.equal(clockOf(239999), "18:59");
  const s = shop(4); s.tutorialDone = true; s.day = 3;
  act(s, { type: "startShift" });
  const sang = s.shift.schedule.filter((g) => g.at < 105000).length / s.shift.schedule.length;
  assert.ok(sang > 0.3 && sang < 0.85, String(sang));
  assert.ok(s.shift.schedule.filter((g) => g.at < 105000).every((g) => g.patienceMul === PHASES[0].patience && PHASES[0].patience < PHASES[1].patience), "sáng kiên nhẫn ngắn");
  const ev = advance(s, 110000);
  assert.ok(ev.some((e) => e.type === "phase" && e.id === "trua"));
});

test("chốt ca: lời vận hành = doanh thu − giá vốn − hao hụt − gas − than − phí ca; sang ngày mới", () => {
  const s = shop(); act(s, { type: "firstBatch", sec: 28 }); act(s, { type: "startShift" });
  playShift(s);
  const S = s.lastSummary;
  assert.ok(Math.abs(S.profit - (S.revenue - S.cogs - S.waste - S.gas - S.than - S.fee - S.changeLoss)) <= 1, JSON.stringify(S));
  assert.ok(S.served >= 8 && S.revenue > 100);
  assert.equal(s.day, 2);
});

test("âm thanh: 28 file Codex khớp bảng tên; mọi sự kiện chỉ gọi tên có file; chưa có thao tác ⇒ không phát", () => {
  const files = new Set(readdirSync(new URL("../assets/audio/", import.meta.url)).filter((f) => f.endsWith(".mp3")).map((f) => f.slice(0, -4)));
  assert.equal(files.size, 28);
  assert.deepEqual([...AVAILABLE].sort(), [...files].sort());
  for (const n of [...Object.keys(SFX), ...Object.keys(LOOPS), ...WARM]) assert.ok(files.has(n), n);
  const evs = [{ type: "step", step: "slice" }, { type: "step", step: "spread" }, { type: "step", step: "fill", on: true }, { type: "step", step: "veg", on: true }, { type: "step", step: "spice" },
    { type: "step", step: "toast", on: true }, { type: "step", step: "wrap", id: "tui" }, { type: "step", step: "wrap", id: "giay" }, { type: "batchLoaded" }, { type: "batchPulled" }, { type: "batchGolden" },
    { type: "batchBurnt" }, { type: "paying" }, { type: "served", price: 16, stars: 5, change: "short" }, { type: "arrive" }, { type: "drama" }, { type: "viral" }, { type: "levelUp" },
    { type: "missionDone" }, { type: "shiftEnded" }, { type: "stockout" }, { type: "impatient" }, { type: "grillLoaded" }, { type: "eggReady" }, { type: "badge" }, { type: "challengeResult", ok: false }];
  const used = new Set();
  for (const e of evs) { const out = soundsFor(e); assert.ok(out.length, e.type); for (const [n] of out) { assert.ok(files.has(n), `${e.type} → ${n}`); used.add(n); } }
  assert.deepEqual(soundsFor({ type: "step", step: "slice" }), [["bread-slice"]]);
  assert.equal(soundsFor({ type: "served", price: 16, stars: 5 }).length, 2);
  assert.deepEqual(soundsFor({ type: "unknown" }), []);
  assert.equal(play("cashbox"), false); // chưa có AudioContext (chưa thao tác) ⇒ không phát, không tải
  assert.equal(MUTE_KEY, "wgp.muted");
});
