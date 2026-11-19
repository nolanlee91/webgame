// Âm thanh: bảng sự kiện → tiếng không trỏ tới file thiếu, mọi sự kiện quan trọng có tiếng, mọi file đều được dùng,
// nút Tiếng xoay vòng bật hết → chỉ hiệu ứng → tắt (wgp.muted là công tắc tổng), không phát gì trước thao tác người chơi.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
Object.defineProperty(globalThis, "localStorage", { value: new Mem(), configurable: true, writable: true });

const sfx = await import("../ui/sfx.js");
const { SFX, LOOPS, WARM, soundsFor, brewSound, play, soundMode, cycleSoundMode, isMuted, musicOn, MUTE_KEY, MUSIC_KEY } = sfx;
const { CHOICES, STEPS } = await import("../data/ingredients.js");
const { OUTCOME_LABEL } = await import("../data/lines-reply.js");

const dir = fileURLToPath(new URL("../assets/audio/", import.meta.url));
const onDisk = new Set(readdirSync(dir).filter((f) => f.endsWith(".mp3")).map((f) => f.slice(0, -4)));
const coreDir = fileURLToPath(new URL("../core/", import.meta.url));
const emitted = new Set(readdirSync(coreDir).flatMap((f) => [...readFileSync(coreDir + f, "utf8").matchAll(/type: "([a-zA-Z]+)"/g)].map((m) => m[1])));

test("mọi hiệu ứng và vòng lặp có file MP3, mọi file đều được dùng", () => {
  for (const n of [...Object.keys(SFX), ...Object.keys(LOOPS)]) assert.ok(onDisk.has(n), "thiếu file " + n + ".mp3");
  for (const n of onDisk) assert.ok(Object.hasOwn(SFX, n) || Object.hasOwn(LOOPS, n), "file không dùng: " + n);
  assert.equal(Object.keys(SFX).length, 29); assert.equal(Object.keys(LOOPS).length, 4);
  for (const n of WARM) assert.ok(Object.hasOwn(SFX, n), "tải sẵn tên lạ " + n);
});

test("dung lượng: hiệu ứng nhỏ, tải sẵn sau thao tác dưới 60 KB", () => {
  const size = (n) => statSync(dir + n + ".mp3").size;
  for (const n of Object.keys(SFX)) assert.ok(size(n) < 12_000, n + " quá nặng cho một hiệu ứng");
  assert.ok(WARM.reduce((a, n) => a + size(n), 0) < 60_000);
});

test("mọi sự kiện core có trong bảng đều ra tên hiệu ứng có thật; sự kiện quan trọng có tiếng", () => {
  const sample = { brewed: { step: "base", id: "hong-tra" }, served: { price: 30, stars: 5 }, replied: { outcome: "viral" }, dramaResolved: { rolled: "win" } };
  for (const type of emitted) for (const [n, d] of soundsFor({ type, ...(sample[type] || {}) })) {
    assert.ok(Object.hasOwn(SFX, n), `${type} → ${n} không có trong SFX`);
    assert.ok(d === undefined || (d >= 0 && d < 1), "độ trễ lạ " + d);
  }
  const important = ["brewed", "arrive", "served", "filled", "complaint", "timeout", "drama", "dramaResolved", "replied", "restocked", "cooking", "batchDone", "shiftStarted", "shiftEnded", "levelUp", "missionDone", "bought", "placed", "discarded", "promoted", "persona"];
  for (const t of important) {
    assert.ok(emitted.has(t), "core không còn phát " + t);
    assert.ok(soundsFor({ type: t, ...(sample[t] || {}) }).length > 0, t + " im lặng");
  }
  assert.deepEqual(soundsFor({ type: "tick" }), []); assert.deepEqual(soundsFor({ type: "spawn" }), []);
});

test("pha: mọi lựa chọn mọi bước ra tiếng hợp lệ; sữa rót nghe khác trà, bỏ qua bước nghe tiếng giấy", () => {
  for (const step of STEPS) for (const c of CHOICES[step]) assert.ok(Object.hasOwn(SFX, brewSound(step, c.id)), `${step}:${c.id}`);
  assert.equal(brewSound("base", "hong-tra"), "tea-pour"); assert.equal(brewSound("base", "sua-tuoi"), "milk-pour");
  assert.equal(brewSound("add", "sua"), "milk-pour"); assert.equal(brewSound("ice", "nhieu"), "ice"); assert.equal(brewSound("ice", "khong"), "paper");
  assert.equal(brewSound("sugar", 0), "paper"); assert.equal(brewSound("lid", "dong-nap"), "seal");
});

test("trả lời review: mỗi kết quả có tiếng riêng hợp lệ; viral / phốt khác nhau; drama thắng / thua khác nhau", () => {
  for (const outcome of Object.keys(OUTCOME_LABEL)) for (const [n] of soundsFor({ type: "replied", outcome })) assert.ok(Object.hasOwn(SFX, n), outcome);
  assert.equal(soundsFor({ type: "replied", outcome: "viral" })[0][0], "viral");
  assert.equal(soundsFor({ type: "replied", outcome: "phot" })[0][0], "drama");
  assert.notEqual(soundsFor({ type: "dramaResolved", rolled: "win" })[0][0], soundsFor({ type: "dramaResolved", rolled: "lose" })[0][0]);
  assert.deepEqual(soundsFor({ type: "served", price: 30, stars: 5 }).map((x) => x[0]), ["handoff", "coin", "voice-happy"]);
  assert.deepEqual(soundsFor({ type: "served", price: 0, stars: 1 }).map((x) => x[0]), ["handoff", "voice-sorry"]);
});

test("nút Tiếng: bật hết → chỉ hiệu ứng → tắt → bật hết; wgp.muted là công tắc tổng, tts.music riêng của game", () => {
  localStorage.m.clear();
  assert.equal(soundMode(), "all");
  assert.equal(cycleSoundMode(), "sfx"); assert.equal(localStorage.getItem(MUSIC_KEY), "0"); assert.equal(isMuted(), false);
  assert.equal(cycleSoundMode(), "off"); assert.equal(localStorage.getItem(MUTE_KEY), "1");
  assert.equal(cycleSoundMode(), "all"); assert.equal(localStorage.getItem(MUTE_KEY), "0"); assert.equal(musicOn(), true);
  localStorage.setItem(MUTE_KEY, "1"); assert.equal(soundMode(), "off", "tab khác / game khác tắt tiếng chung");
  localStorage.setItem(MUTE_KEY, "0"); localStorage.setItem(MUSIC_KEY, "0"); assert.equal(soundMode(), "sfx");
});

test("chưa có thao tác người chơi (chưa AudioContext) thì play() không làm gì, tên lạ cũng không lỗi", () => {
  localStorage.m.clear();
  assert.equal(play("coin"), false); assert.equal(play("không-có"), false);
  assert.equal(sfx.soundDebug().ctx, null);
});

test("âm thanh không phụ thuộc giảm chuyển động", () => {
  const src = readFileSync(fileURLToPath(new URL("../ui/sfx.js", import.meta.url)), "utf8");
  assert.ok(!/reduce|prefers-reduced/i.test(src));
});
