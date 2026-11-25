// logic.js giờ chỉ là lớp gom (re-export) core/ + data/ cho game.js. Test luật chi tiết nằm ở các file *.test.mjs theo module.
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js?v=m11";

test("logic.js gom đủ API mà game.js dùng", () => {
  for (const name of ["apply", "needsSync", "createState", "loadV3", "migrateV2", "dump", "boardView", "demand", "currentQuest",
    "capacity", "used", "overflowCount", "have", "stage", "progress", "isReady", "canBuy", "plotCost", "readyWhileAway", "xpNeed",
    "cropUnlocked", "iconCell", "unlocksAt", "nextUnlock", "mapLayout", "mapUnlocksAt", "effects", "nextStep", "inMilestone"]) assert.equal(typeof L[name], "function", name);
  assert.equal(L.CROPS.length, 7);
  assert.equal(L.FIELD_CROPS.length, 6);
  assert.equal(L.TUTORIAL.length, 8);
  assert.equal(L.NPCS.length, 4);
});

test("đơn hàng của bản v2 (Codex) vẫn được giữ ý tưởng: thưởng ×1,2, giao bằng id + revision", () => {
  const s = L.createState(1_000_000, 1);
  const [first] = L.boardView(s).slots;
  assert.equal(first.order.coins, Math.ceil(12 * 1.2));
  s.inv["ca-rot"] = 2;
  assert.ok(L.apply(s, { type: "deliver", slot: 0, id: first.order.id, rev: first.rev }, 1_000_000).ok);
  assert.equal(L.apply(s, { type: "deliver", slot: 0, id: first.order.id, rev: first.rev }, 1_000_000).err, "order-changed");
});
