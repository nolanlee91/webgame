// Bản lưu: ghi / đọc giữ nguyên (cả giữa ca), kẹp số, bản hỏng chép sang .corrupt, chơi lại từ đầu cất .backup, chơi lại ngày hôm nay.
import test from "node:test";
import assert from "node:assert/strict";
import { shopSave, KEY, CORRUPT_KEY, BACKUP_KEY, DAY_KEY, REPLAY_BACKUP_KEY } from "../save.js?v=c9";
import { loadSave, dump, SAVE_VERSION, MIGRATIONS } from "../core/state.js?v=c9";
import { levelForXp } from "../core/progress.js?v=c9";
import { apply, must, openWithOrder, home, newGame, prepDay, playDay, seeded } from "./helpers.mjs";

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };

test("ghi rồi đọc lại giữa ca: dĩa đang bày, nồi cơm, vỉ nướng, khách, tiền y nguyên; tiếp tục chơi được", () => {
  const { s, t } = openWithOrder(31);
  home(s);
  must(s, { type: "pin", tk: t.id });
  must(s, { type: "layer", id: "dia" }); must(s, { type: "layer", id: "com" });
  must(s, { type: "placeMeat", slot: 0 });
  must(s, { type: "tick", dt: 1500 });
  const st = mem(); const sv = shopSave(st);
  sv.write(s);
  const r = sv.read(1);
  assert.ok(!r.fresh && !r.corrupt);
  assert.deepEqual(JSON.parse(dump(r.state)), JSON.parse(dump(s)));
  assert.ok(apply(r.state, { type: "tick", dt: 200 }).ok);
  assert.ok(apply(r.state, { type: "layer", id: "moHanh" }).ok);
});

test("kẹp số khi đọc: tiền âm, cấp sai, kho rác, id lạ ⇒ về miền hợp lệ; phiên bản lạ ⇒ hỏng", () => {
  const s = newGame(32);
  const d = JSON.parse(dump(s));
  Object.assign(d, { money: -50, xp: 60, level: 9, rep: 400, stock: { ...d.stock, suon: -3, "gao-tam": 2.7, la: 5 }, owned: { "egg-pan": true, xyz: true }, plan: ["dem"], menu: ["pho"] });
  const r = loadSave(JSON.stringify(d));
  assert.equal(r.money, 0); assert.equal(r.level, levelForXp(60)); assert.equal(r.rep, 100); // cấp tính lại từ XP (bảng M5)
  assert.equal(r.stock.suon, 0); assert.equal(r.stock["gao-tam"], 2); assert.equal(r.stock.la, undefined);
  assert.deepEqual(r.owned, { "egg-pan": true }); assert.deepEqual(r.plan, ["toi"]); assert.deepEqual(r.menu, ["com-suon"]);
  assert.equal(loadSave(JSON.stringify({ ...d, v: SAVE_VERSION + 1 })), null);
  assert.equal(loadSave("{hỏng"), null);
  assert.equal(typeof MIGRATIONS, "object");
});

test("ca hỏng cấu trúc thì bỏ riêng ca, giữ tiền / cấp / kho", () => {
  const { s } = openWithOrder(33);
  const d = JSON.parse(dump(s));
  d.shift.grill = null;
  const r = loadSave(JSON.stringify(d));
  assert.equal(r.shift, null);
  assert.equal(r.money, s.money); assert.equal(r.xp, s.xp);
});

test("bản lưu hỏng: chép nguyên văn sang .corrupt (một lần), mở quán mới", () => {
  const st = mem(); st.setItem(KEY, "{hỏng");
  const r = shopSave(st).read(5);
  assert.ok(r.fresh && r.corrupt);
  assert.equal(st.getItem(CORRUPT_KEY), "{hỏng");
});

test("chơi lại từ đầu: bản hiện tại cất sang .backup rồi mới xoá; chơi lại ngày: cất .before-replay, về ảnh đầu ngày", () => {
  const st = mem(); const sv = shopSave(st);
  const s = newGame(34);
  assert.ok(sv.snapshotDay(s));
  playDay(s, { rnd: seeded(1) });
  sv.write(s);
  const cur = st.getItem(KEY);
  assert.ok(sv.replayDay());
  assert.equal(st.getItem(REPLAY_BACKUP_KEY), cur);
  assert.equal(JSON.parse(st.getItem(KEY)).day, 1);
  const before = st.getItem(KEY);
  assert.ok(sv.reset());
  assert.equal(st.getItem(BACKUP_KEY), before);
  assert.equal(st.getItem(KEY), null); assert.equal(st.getItem(DAY_KEY), null);
  assert.ok(sv.read(9).fresh);
});
