// Bản lưu: ghi / đọc trọn (kể cả giữa ca), bản hỏng chép sang .corrupt, kẹp số, Chơi lại từ đầu cất .backup.
import test from "node:test";
import assert from "node:assert/strict";
import { dump, loadSave, createState, SAVE_VERSION } from "../core/state.js";
import { shopSave, KEY, BACKUP_KEY, CORRUPT_KEY } from "../save.js";
import { shop, act, openDay, untilWaiting, playShift, prepAndOpen, board, customer } from "./helpers.mjs";
import { invariantError } from "../core/apply.js";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }

test("khoá lưu wgp.tiembanhmi.v1, phiên bản trong bản lưu", () => {
  assert.equal(KEY, "wgp.tiembanhmi.v1");
  assert.equal(createState().v, SAVE_VERSION);
});

test("lưu rồi đọc lại giữa ca: giữ ổ đang ráp, lò, tủ kính, phiếu, tiền, quỹ lẻ", () => {
  const s = shop(4); openDay(s);
  act(s, { type: "bake", slot: 0 });
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id }); act(s, { type: "take" }); act(s, { type: "slice" }); act(s, { type: "spread", id: "pate", lvl: 3 });
  const r = loadSave(dump(s));
  assert.ok(r.shift, "giữ ca");
  assert.deepEqual(r.shift.boards[0].loaf.spreads, { pate: 3 });
  assert.equal(r.shift.oven[0].n, s.shift.oven[0].n);
  assert.equal(r.shift.case.length, s.shift.case.length);
  assert.equal(r.money, s.money); assert.deepEqual(r.float, s.float); assert.deepEqual(r.stock, s.stock);
  assert.equal(invariantError(r, null), null);
  // chơi tiếp được sau khi đọc lại
  act(r, { type: "spice", id: "ot", lvl: 2 });
});

test("lưu giữa lúc thối tiền và giữa hội thoại hết lẻ: đọc lại vẫn chốt được", () => {
  const s = shop(5); openDay(s);
  const c = untilWaiting(s);
  customer(s, c.id).payPlan = 100; s.float = { 1: 1 };
  act(s, { type: "pin", cid: c.id });
  const { build } = awaitHelpers;
  build(s, customer(s, c.id).items[0]); act(s, { type: "serve" });
  assert.equal(s.shift.dialog.kind, "nochange");
  const r = loadSave(dump(s));
  assert.equal(r.shift.dialog.kind, "nochange");
  act(r, { type: "nochange", choice: "owe" });
  assert.equal(r.shift.paying, null);
});
import * as awaitHelpers from "./helpers.mjs";

test("bản lưu hỏng ⇒ chép nguyên văn sang .corrupt (một lần), mở tiệm mới", () => {
  const mem = new Mem(), store = shopSave(mem);
  mem.setItem(KEY, "{not json");
  const r = store.read(3);
  assert.equal(r.corrupt, true); assert.equal(r.fresh, true);
  assert.equal(mem.getItem(CORRUPT_KEY), "{not json");
  mem.setItem(KEY, "{\"v\":99}");
  store.read(3);
  assert.equal(mem.getItem(CORRUPT_KEY), "{not json", "không ghi đè bản hỏng đầu tiên");
});

test("đọc bản lưu kẹp số: tiền âm, kho lạ, quỹ lẻ vượt tiền, ca hỏng bị bỏ riêng", () => {
  const s = shop(); openDay(s);
  const d = JSON.parse(dump(s));
  d.money = -50; d.stock.pate = 1.7; d.stock.xyz = 5; d.float = { 50: 99 }; d.rep = 900; d.xp = 40; d.level = 9;
  d.shift.customers = [{ id: 1, arch: "alien" }];
  const r = loadSave(JSON.stringify(d));
  assert.equal(r.money, 0); assert.equal(r.stock.pate, 1); assert.equal(r.stock.xyz, undefined);
  assert.ok(Object.values(r.float).every((n) => n === 0) || Object.keys(r.float).length === 0);
  assert.equal(r.rep, 100); assert.equal(r.level, 2);
  assert.equal(r.shift, null, "ca hỏng bị bỏ, phần còn lại giữ");
  assert.equal(invariantError(r, null), null);
});

test("lưu / đọc sau nhiều ngày chơi thật vẫn khớp", () => {
  const s = shop(8);
  for (let d = 0; d < 3; d++) { prepAndOpen(s); playShift(s, { sloppy: 0.1, rnd: mulberry(d) }); }
  const r = loadSave(dump(s));
  for (const k of ["money", "xp", "level", "day", "rep", "shopName", "tutorialDone"]) assert.deepEqual(r[k], s[k], k);
  assert.deepEqual(r.float, s.float); assert.deepEqual(r.stock, s.stock); assert.equal(r.feed.length, s.feed.length);
});
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

test("Chơi lại từ đầu: cất bản cũ sang .backup rồi mở tiệm mới; chưa có bản lưu thì không tạo .backup", () => {
  const mem = new Mem(), store = shopSave(mem);
  assert.equal(store.reset(), true);
  assert.equal(mem.getItem(BACKUP_KEY), null);
  const s = shop(5); act(s, { type: "setName", name: "Tiệm Cũ" });
  store.write(s);
  const raw = mem.getItem(KEY);
  assert.equal(store.reset(), true);
  assert.equal(mem.getItem(KEY), null);
  assert.equal(mem.getItem(BACKUP_KEY), raw);
  const r = store.read(9);
  assert.equal(r.fresh, true); assert.notEqual(r.state.shopName, "Tiệm Cũ");
});
