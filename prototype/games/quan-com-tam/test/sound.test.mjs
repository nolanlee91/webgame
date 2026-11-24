// V: âm thanh M5 — 32 file Codex khớp bảng tên, mọi sự kiện chỉ gọi tên có file, vòng lặp theo cảnh, chưa thao tác thì không phát.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { soundsFor, loopsFor, AVAILABLE, play, MUTE_KEY, MUSIC_KEY, SFX, LOOPS, WARM, soundDebug } from "../ui/sfx.js";

const files = new Set(readdirSync(new URL("../assets/audio/", import.meta.url)).filter((f) => f.endsWith(".mp3")).map((f) => f.slice(0, -4)));

test("âm thanh: 32 file Codex khớp bảng tên (27 hiệu ứng + 5 vòng lặp)", () => {
  assert.equal(files.size, 32);
  assert.deepEqual([...AVAILABLE].sort(), [...files].sort());
  assert.equal(Object.keys(SFX).length, 27);
  assert.equal(Object.keys(LOOPS).length, 5);
  for (const n of WARM) assert.ok(SFX[n], n);
  assert.equal(MUTE_KEY, "wgp.muted");
  assert.equal(MUSIC_KEY, "qct.music");
});

test("âm thanh: mọi sự kiện chính có tiếng và chỉ gọi tên có file; mọi hiệu ứng đều được dùng", () => {
  const evs = [{ type: "flip", perfect: true }, { type: "flip" }, { type: "placed" }, { type: "sideDone", both: true }, { type: "nearBurn" }, { type: "burnt" }, { type: "coalAdded" },
    { type: "lit" }, { type: "fan" }, { type: "flare" }, { type: "riceCooking" }, { type: "riceReady", n: 12 }, { type: "layer", id: "dia" }, { type: "layer", id: "com" },
    { type: "layer", id: "moHanh" }, { type: "layer", id: "sauce" }, { type: "layer", id: "meat" }, { type: "layer", id: "bi" }, { type: "teaPoured" }, { type: "cleaned", plates: 2 },
    { type: "cleaned", plates: 0 }, { type: "washed", n: 4 }, { type: "delivered", mistakes: [] }, { type: "delivered", mistakes: ["raw"] }, { type: "billOpen" }, { type: "paid", total: 60 },
    { type: "arrive" }, { type: "request", kind: "com" }, { type: "billCall" }, { type: "groupDone", stars: 5 }, { type: "groupDone", stars: 1 }, { type: "complaint" },
    { type: "drama" }, { type: "dramaResolved", rolled: "win" }, { type: "missionDone" }, { type: "levelUp" }, { type: "shiftEnded" }, { type: "stockout" }, { type: "restocked" },
    { type: "plateDropped" }, { type: "timeout" }];
  const used = new Set();
  for (const e of evs) { const out = soundsFor(e); assert.ok(out.length, e.type); for (const [n] of out) { assert.ok(files.has(n), `${e.type} → ${n}`); used.add(n); } }
  for (const n of Object.keys(SFX)) assert.ok(used.has(n), "chưa dùng: " + n);
  assert.deepEqual(soundsFor({ type: "layer", id: "sauce" }), [["fish-sauce-pour"]]);
  assert.deepEqual(soundsFor({ type: "riceReady", prep: true }), []);
  assert.deepEqual(soundsFor({ type: "unknown" }), []);
});

test("âm thanh: vòng lặp theo cảnh — bếp than chỉ khi nhóm, quán đông chỉ khi ≥ 3 bàn, chỉ hiệu ứng thì không nhạc, hội thoại hạ âm", () => {
  assert.deepEqual([...loopsFor("prep").keys()].sort(), ["prep-music-loop", "riverside-night-loop"]);
  assert.deepEqual([...loopsFor("service").keys()].sort(), ["riverside-night-loop", "rush-music-loop"]);
  assert.ok(loopsFor("service", { grill: true }).has("charcoal-grill-loop"));
  assert.ok(loopsFor("service", { busy: true }).has("busy-dining-loop"));
  assert.ok(!loopsFor("service", { music: false }).has("rush-music-loop"));
  assert.ok(loopsFor("service", { music: false }).has("riverside-night-loop"));
  const d = loopsFor("dialog", { grill: true, busy: true });
  assert.ok(!d.has("charcoal-grill-loop") && d.get("rush-music-loop") < LOOPS["rush-music-loop"].gain);
  assert.equal(loopsFor("quiet").size, 0);
});

test("âm thanh: chưa có thao tác ⇒ không AudioContext, play() không phát, không tải", () => {
  assert.equal(play("cash-paper"), false);
  assert.equal(play("khong-co"), false);
  assert.equal(soundDebug().ctx, null);
});

test("âm thanh: huy hiệu / hội chợ / nước mắm nhà pha có tiếng (cùng bảng Bánh Mì)", () => {
  assert.deepEqual(soundsFor({ type: "badge" }), [["level-up"]]);
  assert.deepEqual(soundsFor({ type: "fair" }), [["viral"]]);
  assert.deepEqual(soundsFor({ type: "fishSauce", tier: 1, price: 80 }), [["cash-paper"]]);
});
