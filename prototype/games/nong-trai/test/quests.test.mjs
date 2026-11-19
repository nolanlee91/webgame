import test from "node:test";
import assert from "node:assert/strict";
import { TUTORIAL } from "../data/quests.js?v=m2";
import { currentQuest } from "../core/quests.js?v=m2";
import { farm, act, err, START, CENTER } from "./helpers.mjs";

test("8 nhiệm vụ hướng dẫn đúng thứ tự thiết kế, mỗi cái có thưởng", () => {
  assert.deepEqual(TUTORIAL.map((q) => q.id), ["gieo-hat", "tuoi-cay", "thu-hoach", "ban-hang", "giao-don", "mo-o-dat", "nang-kho", "len-cap-3"]);
  for (const q of TUTORIAL) assert.ok(q.reward.coins > 0 && q.hint && q.title);
});

test("chưa làm thì không nhận được; làm xong nhận đúng 1 lần", () => {
  const s = farm();
  assert.equal(err(s, { type: "claimQuest", id: "gieo-hat" }), "quest-incomplete");
  const r = act(s, { type: "plant", i: CENTER, crop: "ca-rot" });
  assert.ok(r.events.some((e) => e.type === "questDone" && e.id === "gieo-hat"));
  const coins = s.coins;
  act(s, { type: "claimQuest", id: "gieo-hat" });
  assert.equal(s.coins, coins + TUTORIAL[0].reward.coins);
  assert.equal(err(s, { type: "claimQuest", id: "gieo-hat" }), "quest-claimed");
  assert.equal(s.coins, coins + TUTORIAL[0].reward.coins);
  assert.equal(currentQuest(s).id, "tuoi-cay");
  assert.equal(err(s, { type: "claimQuest", id: "thu-hoach" }), "quest-claimed", "không nhảy cóc");
});

test("tiến độ chỉ tính khi nhiệm vụ đang mở (thu hoạch trước khi tới bước 3 không được tính)", () => {
  const s = farm();
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" });
  act(s, { type: "harvest", i: CENTER }, START + 30_000); // đang ở bước 1 (đã xong), chưa nhận
  act(s, { type: "claimQuest", id: "gieo-hat" }, START + 30_000);
  assert.equal(s.quests.progress, 0);
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" }, START + 30_000);
  act(s, { type: "water", i: CENTER }, START + 31_000);
  act(s, { type: "claimQuest", id: "tuoi-cay" }, START + 31_000);
  for (const i of [6, 7]) act(s, { type: "plant", i, crop: "ca-rot" }, START + 31_000);
  act(s, { type: "harvestAll" }, START + 70_000);
  assert.equal(s.quests.progress, 3);
  act(s, { type: "claimQuest", id: "thu-hoach" }, START + 70_000);
});

test("đi hết hướng dẫn bằng cơ chế thật: bán, giao đơn, mở ô, nâng kho, lên cấp 3", () => {
  const s = farm();
  let t = START;
  const claim = (id) => act(s, { type: "claimQuest", id }, t);
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" }, t); claim("gieo-hat");
  act(s, { type: "water", i: CENTER }, t); claim("tuoi-cay");
  act(s, { type: "plant", i: 6, crop: "ca-rot" }, t); act(s, { type: "plant", i: 7, crop: "ca-rot" }, t);
  t += 30_000; act(s, { type: "harvestAll" }, t); claim("thu-hoach");
  act(s, { type: "sell", id: "ca-rot", n: 1 }, t); claim("ban-hang");
  s.inv["ca-rot"] = 2;
  const x = s.orders.slots[0];
  act(s, { type: "deliver", slot: 0, id: x.order.id, rev: x.rev }, t); claim("giao-don");
  assert.ok(s.level >= 2);
  s.coins += 200;
  act(s, { type: "buyPlot", i: 2 }, t); claim("mo-o-dat");
  act(s, { type: "upgradeWarehouse" }, t);
  const r = claim("nang-kho");
  if (s.level < 3) {
    assert.equal(currentQuest(s).id, "len-cap-3");
    assert.equal(err(s, { type: "claimQuest", id: "len-cap-3" }), "quest-incomplete");
    s.xp = 27; s.inv["ca-rot"] = 9;
    const y = s.orders.slots.find((z) => z.order && Object.keys(z.order.items).every((id) => id === "ca-rot"));
    if (y) act(s, { type: "deliver", slot: s.orders.slots.indexOf(y), id: y.order.id, rev: y.rev }, t);
    else { act(s, { type: "plant", i: CENTER, crop: "ca-rot" }, t); act(s, { type: "harvest", i: CENTER }, t + 30_000); }
  } else assert.ok(r.events.some((e) => e.type === "questDone" && e.id === "len-cap-3"));
  assert.ok(s.level >= 3);
  act(s, { type: "claimQuest", id: "len-cap-3" }, t + 30_000);
  assert.equal(currentQuest(s).id, "xay-xuong", "hết hướng dẫn ⇒ nhiệm vụ tiến trình của Milestone 2");
  assert.equal(err(s, { type: "claimQuest", id: "len-cap-3" }), "quest-claimed");
});
