// "Chơi lại từ đầu": bản cũ được cất sang KEY.backup, KEY bị bỏ ⇒ lần đọc sau là tiệm mới; không có bản lưu thì vẫn chạy.
import test from "node:test";
import assert from "node:assert/strict";
import { dump } from "../core/state.js";
import { shopSave, KEY, BACKUP_KEY } from "../save.js";
import { shop, act } from "./helpers.mjs";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }

test("chơi lại: cất bản cũ sang .backup rồi mở tiệm mới", () => {
  const mem = new Mem(), store = shopSave(mem);
  const s = shop(5); act(s, { type: "setName", name: "Tiệm Cũ" });
  store.write(s);
  const raw = mem.getItem(KEY);
  assert.equal(store.reset(), true);
  assert.equal(mem.getItem(KEY), null);
  assert.equal(mem.getItem(BACKUP_KEY), raw, "bản cũ còn nguyên trong .backup");
  const r = store.read(9);
  assert.equal(r.fresh, true);
  assert.notEqual(r.state.shopName, "Tiệm Cũ");
  assert.equal(dump(s), raw);
});

test("chơi lại khi chưa có bản lưu: không lỗi, không tạo .backup", () => {
  const mem = new Mem(), store = shopSave(mem);
  assert.equal(store.reset(), true);
  assert.equal(mem.getItem(BACKUP_KEY), null);
});
