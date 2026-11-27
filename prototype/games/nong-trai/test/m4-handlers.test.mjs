// Test core/m4-handlers.js (handler M4 để ghép vào apply) với bag / wallet / addXp thật trên trạng thái thật (createState).
import test from "node:test";
import assert from "node:assert/strict";
import { bindM4, m4Sync, m4Track, m4InvariantError, ensureM4, M4_ACTIONS } from "../core/m4-handlers.js?v=m17";
import { bag, wallet } from "../core/inventory.js?v=m17";
import { addXp } from "../core/progression.js?v=m17";
import { createState } from "../core/state.js?v=m17";
import { TUTORIAL } from "../data/quests.js?v=m17";

const T0 = 1_000_000, MIN = 60_000;
const deps = { bag, wallet, addXp };
const H = bindM4(deps);
/** apply() thu nhỏ: nháp → sync → handler → track. */
function run(s, a, now) {
  const d = structuredClone(s), ev = [];
  m4Sync(d, now, ev);
  const r = H[a.type](d, a, now, ev);
  if (r.err) return r;
  m4Track(d, ev, now);
  assert.equal(m4InvariantError(d), null);
  Object.assign(s, d);
  return { ok: true, events: ev, r };
}

test("m4-handlers: chuỗi mua gà → cho ăn → thu trứng → nhiệm vụ tiến trình, trên trạng thái thật", () => {
  assert.deepEqual(M4_ACTIONS, ["buyAnimal", "feedAnimal", "feedAll", "collectAnimal", "collectAllAnimals", "talkNpc", "claimProgressQuest", "claimChainStep", "claimBoardQuest"]);
  const s = ensureM4(createState(T0, 3), { animals: { list: [{ uid: 4, kind: "bo", fedAt: null }], nextUid: 5 }, lastDeliveryAt: T0 + 1 }, T0);
  assert.deepEqual(s.animals.list.map((a) => a.kind), ["bo-sua"], "migration kind cũ");
  assert.equal(s.lastDeliveryAt, null, "mốc tương lai bị bỏ");
  s.animals = { list: [], nextUid: 1 };
  Object.assign(s, { level: 8, coins: 500 }); s.quests.tut = TUTORIAL.length;
  s.buildings["chuong-ga"] = { level: 1, done: true, startAt: T0, readyAt: T0 };
  s.inv["thuc-an-gia-suc"] = 2;
  assert.ok(run(s, { type: "buyAnimal", kind: "ga" }, T0).ok);
  assert.equal(s.coins, 440);
  assert.ok(run(s, { type: "feedAnimal", uid: 1 }, T0).ok);
  assert.equal(run(s, { type: "collectAnimal", uid: 1 }, T0 + MIN).err, "not-ready");
  const xp0 = s.xp;
  const c = run(s, { type: "collectAnimal", uid: 1 }, T0 + 4 * MIN);
  assert.ok(c.ok);
  assert.equal(s.inv["trung-ga"], 1);
  assert.equal(s.xp, xp0 + 2, "XP thu trứng cộng qua addXp");
  // tiến trình: xây chuồng gà (trạng thái) ⇒ nhận; mua gà / thu trứng đã xảy ra TRƯỚC khi tới bước ⇒ chưa tính (đúng luật M1)
  const r = run(s, { type: "claimProgressQuest", id: "xay-chuong-ga" }, T0 + 5 * MIN);
  assert.ok(r.ok, r.err);
  assert.equal(s.village.prog.i, 1);
  // giao đơn (sự kiện từ orders) ⇒ lastDeliveryAt
  const ev = [{ type: "delivered", orderType: "thuong", npc: "co-hai", items: { "trung-ga": 1 } }];
  m4Track(s, ev, T0 + 6 * MIN);
  assert.equal(s.lastDeliveryAt, T0 + 6 * MIN);
  // lỗi ⇒ không đổi gì
  const snap = JSON.stringify(s);
  assert.equal(run(s, { type: "buyAnimal", kind: "bo-sua" }, T0).err, "locked", "bò mở ở cấp 9");
  assert.equal(run(s, { type: "talkNpc", npc: "nobody" }, T0).err, "bad");
  assert.equal(JSON.stringify(s), snap);
});
