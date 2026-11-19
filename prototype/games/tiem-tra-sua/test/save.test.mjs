import test from "node:test";
import assert from "node:assert/strict";
import { createState, loadSave, dump, SAVE_VERSION } from "../core/state.js";
import { shopSave, KEY, CORRUPT_KEY } from "../save.js";
import { shop, act, untilWaiting, serveRight, advance } from "./helpers.mjs";
import { levelForXp } from "../core/progression.js";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } }

test("bản lưu v1: ghi rồi đọc lại y nguyên (ngoài ca)", () => {
  const s = shop(3);
  act(s, { type: "setName", name: "  Trà Sữa   Cô Ba  " });
  act(s, { type: "startShift" });
  serveRight(s, untilWaiting(s));
  advance(s, 400000);
  const back = loadSave(dump(s));
  assert.deepEqual(back, s);
  assert.equal(back.shopName, "Trà Sữa Cô Ba");
  assert.equal(back.v, SAVE_VERSION);
});

test("lưu giữa ca giữ ly đang pha, phiếu ghim, khách, thời gian ca, sổ ca", () => {
  const s = shop(4);
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  for (const [step, id] of [["cup", "ly"], ["base", "hong-tra"], ["add", "sua"]]) act(s, { type: "brew", step, id });
  advance(s, 5000);
  const back = loadSave(dump(s));
  assert.deepEqual(back.shift, s.shift);
  assert.equal(back.shift.stations[0].cup.steps.length, 3);
  assert.equal(back.shift.stations[0].cid, c.id);
  // tiếp tục chơi trên bản đọc lại: pha tiếp rồi giao đúng một lần
  for (const [step, id] of [["sugar", c.order.sugar], ["ice", c.order.ice], ["topping", c.order.topping], ["lid", "dong-nap"]]) act(back, { type: "brew", step, id });
  const r = act(back, { type: "serve", cid: c.id });
  assert.ok(r.events.some((e) => e.type === "served"));
});

test("lưu lúc đang khiếu nại: tải lại vẫn ở hội thoại, giải quyết một lần", () => {
  const s = shop(5);
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  for (const [step, id] of [["cup", "ly"], ["base", "hong-tra"], ["add", "dao"], ["sugar", 50], ["ice", "it"], ["topping", "none"], ["lid", "dong-nap"]]) act(s, { type: "brew", step, id });
  act(s, { type: "serve", cid: c.id });
  const back = loadSave(dump(s));
  assert.equal(back.shift.dialog.kind, "complaint");
  act(back, { type: "resolve", choice: "refund" });
  assert.equal(back.shift.dialog, null);
});

test("bản lưu bị sửa: số bị kẹp, id lạ bị bỏ, cấp suy ra từ XP", () => {
  const d = JSON.parse(dump(createState(1)));
  Object.assign(d, { money: -50, rep: 400, xp: 80, level: 19, day: 0, shopName: 12 });
  d.stock.ly = -3; d.stock.ghost = 9; d.stock.sua = 2.7;
  const s = loadSave(JSON.stringify(d));
  assert.equal(s.money, 0);
  assert.equal(s.rep, 100);
  assert.equal(s.level, levelForXp(80));
  assert.equal(s.day, 1);
  assert.equal(s.shopName, "Tiệm Nhà Mình");
  assert.equal(s.stock.ly, 0);
  assert.equal(s.stock.sua, 2);
  assert.equal("ghost" in s.stock, false);
});

test("ca hỏng cấu trúc bị bỏ riêng, giữ tiền / cấp / kho", () => {
  const s = shop(6);
  act(s, { type: "startShift" });
  untilWaiting(s);
  const d = JSON.parse(dump(s));
  d.shift.customers[0].recipe = "khong-co-mon";
  const back = loadSave(JSON.stringify(d));
  assert.equal(back.shift, null);
  assert.equal(back.money, s.money);
  assert.deepEqual(back.stock, s.stock);
  const d2 = JSON.parse(dump(s));
  d2.shift.stations[0].cup = { steps: [{ step: "base", id: "hong-tra" }] }; // ly sai thứ tự ⇒ bỏ ly, giữ ca
  d2.shift.customers.length = 1;
  assert.equal(loadSave(JSON.stringify(d2)).shift.stations[0].cup, null);
});

test("không đọc được ⇒ null; phiên bản lạ ⇒ null", () => {
  assert.equal(loadSave("{không phải json"), null);
  assert.equal(loadSave(JSON.stringify({ v: 99 })), null);
  assert.equal(loadSave(null), null);
});

test("adapter: khoá wgp.tiemtrasua.v1; bản hỏng được giữ ở *.corrupt rồi mới mở tiệm mới", () => {
  assert.equal(KEY, "wgp.tiemtrasua.v1");
  const mem = new Mem();
  const st = shopSave(mem);
  const a = st.read(9);
  assert.ok(a.fresh);
  a.state.money = 77;
  st.write(a.state);
  assert.equal(st.read(9).state.money, 77);
  mem.setItem(KEY, "hỏng{");
  const b = st.read(9);
  assert.ok(b.corrupt && b.fresh);
  assert.equal(mem.getItem(CORRUPT_KEY), "hỏng{");
});
