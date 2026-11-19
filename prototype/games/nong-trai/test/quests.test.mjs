import test from "node:test";
import assert from "node:assert/strict";
import { TUTORIAL } from "../data/quests.js?v=m5";
import { currentQuest } from "../core/quests.js?v=m5";
import { apply } from "../core/apply.js?v=m5";
import { farm, act, err, START, CENTER } from "./helpers.mjs";

/** Cày bằng cơ chế thật (gieo cà rốt mọi ô trống → chờ chín → thu hết → bán hết) tới khi `until()` đúng. Trả mốc giờ mới. */
function grind(s, t, until, onEvents = () => {}) {
  for (let k = 0; k < 400 && !until(); k++) {
    s.plots.forEach((p, i) => { if (p.open && !p.crop) apply(s, { type: "plant", i, crop: "ca-rot" }, t); });
    t += 30_000;
    const h = apply(s, { type: "harvestAll" }, t);
    if (h.ok) onEvents(h.events);
    if (s.inv["ca-rot"]) { const r = apply(s, { type: "sell", id: "ca-rot", n: s.inv["ca-rot"] }, t); if (r.ok) onEvents(r.events); }
  }
  assert.ok(until(), "cày mãi không tới mục tiêu");
  return t;
}
/** 5 bước đầu bằng cơ chế thật, dừng ở trước khi nhận "giao-don" (đã giao xong đơn đầu). */
function firstFive(s, t) {
  const claim = (id) => act(s, { type: "claimQuest", id }, t);
  act(s, { type: "plant", i: CENTER, crop: "ca-rot" }, t); claim("gieo-hat");
  act(s, { type: "water", i: CENTER }, t); claim("tuoi-cay");
  act(s, { type: "plant", i: 6, crop: "ca-rot" }, t); act(s, { type: "plant", i: 7, crop: "ca-rot" }, t);
  t += 30_000; act(s, { type: "harvestAll" }, t); claim("thu-hoach");
  act(s, { type: "sell", id: "ca-rot", n: 1 }, t); claim("ban-hang");
  assert.equal(s.inv["ca-rot"], 2, "3 thu hoạch − 1 bán");
  const x = s.orders.slots[0];
  assert.deepEqual(x.order.items, { "ca-rot": 2 });
  act(s, { type: "deliver", slot: 0, id: x.order.id, rev: x.rev }, t);
  assert.equal(currentQuest(s).id, "giao-don");
  return t;
}


test("8 nhiệm vụ hướng dẫn đúng thứ tự thiết kế (M3: lên cấp 3 rồi xây Nhà kho), mỗi cái có thưởng", () => {
  assert.deepEqual(TUTORIAL.map((q) => q.id), ["gieo-hat", "tuoi-cay", "thu-hoach", "ban-hang", "giao-don", "mo-o-dat", "len-cap-3", "xay-nha-kho"]);
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

test("đi hết hướng dẫn bằng cơ chế thật: bán, giao đơn, cày lên cấp 2, mở ô, nâng kho, cày lên cấp 3", () => {
  const s = farm();
  let t = firstFive(s, START);
  const claim = (id) => act(s, { type: "claimQuest", id }, t);
  claim("giao-don");
  assert.equal(currentQuest(s).id, "mo-o-dat");
  assert.equal(s.quests.progress, 0, "chưa mua ô thì chưa xong (không tự hoàn thành)");
  assert.equal(err(s, { type: "claimQuest", id: "mo-o-dat" }, t), "quest-incomplete");
  if (s.level < 2) assert.equal(err(s, { type: "buyPlot", i: 2 }, t), "plots-level", "mở ô cần cấp 2");
  t = grind(s, t, () => s.level >= 2 && s.coins >= 200);
  assert.equal(currentQuest(s).id, "mo-o-dat", "cày không làm nhảy bước");
  assert.equal(s.quests.progress, 0);
  const b = act(s, { type: "buyPlot", i: 2 }, t);
  assert.ok(b.events.some((e) => e.type === "questDone" && e.id === "mo-o-dat"));
  claim("mo-o-dat");
  assert.equal(currentQuest(s).id, "len-cap-3");
  if (s.level < 3) {
    assert.equal(err(s, { type: "claimQuest", id: "len-cap-3" }, t), "quest-incomplete");
    assert.equal(err(s, { type: "startBuild", id: "nha-kho" }, t), "locked", "Nhà kho mở ở cấp 3");
    let done = false;
    t = grind(s, t, () => s.level >= 3, (ev) => { if (ev.some((e) => e.type === "questDone" && e.id === "len-cap-3")) done = true; });
    assert.ok(done, "lên cấp 3 ⇒ báo xong nhiệm vụ đúng lúc");
  }
  claim("len-cap-3");
  assert.equal(currentQuest(s).id, "xay-nha-kho");
  assert.equal(err(s, { type: "claimQuest", id: "xay-nha-kho" }, t), "quest-incomplete");
  t = grind(s, t, () => s.coins >= 100);
  const w = act(s, { type: "startBuild", id: "nha-kho" }, t);
  assert.ok(w.events.some((e) => e.type === "questDone" && e.id === "xay-nha-kho"));
  claim("xay-nha-kho");
  assert.equal(currentQuest(s).id, "xay-xuong", "hết hướng dẫn ⇒ nhiệm vụ tiến trình của Milestone 2");
  assert.equal(err(s, { type: "claimQuest", id: "xay-nha-kho" }, t), "quest-claimed");
});

test("đã mở ô và xây Nhà kho TRƯỚC khi tới bước đó ⇒ tới nơi là xong ngay, không kẹt; nhiệm vụ tiến trình mở tiếp", () => {
  const s = farm();
  let t = firstFive(s, START);
  // còn đang ở "giao-don" (chưa nhận): cày lên cấp 3, mua ô, xây Nhà kho trước
  t = grind(s, t, () => s.level >= 3 && s.coins >= 200);
  act(s, { type: "buyPlot", i: 2 }, t);
  act(s, { type: "startBuild", id: "nha-kho" }, t);
  assert.equal(s.bought, 1);
  assert.equal(s.buildings["nha-kho"].done, true);
  assert.equal(currentQuest(s).id, "giao-don");
  const c1 = act(s, { type: "claimQuest", id: "giao-don" }, t);
  assert.equal(currentQuest(s).id, "mo-o-dat");
  assert.ok(c1.events.some((e) => e.type === "questDone" && e.id === "mo-o-dat"), "tới bước mở ô ⇒ xong ngay");
  const c2 = act(s, { type: "claimQuest", id: "mo-o-dat" }, t);
  assert.equal(currentQuest(s).id, "len-cap-3");
  assert.ok(c2.events.some((e) => e.type === "questDone" && e.id === "len-cap-3"));
  const c3 = act(s, { type: "claimQuest", id: "len-cap-3" }, t);
  assert.equal(currentQuest(s).id, "xay-nha-kho");
  assert.ok(c3.events.some((e) => e.type === "questDone" && e.id === "xay-nha-kho"), "tới bước xây kho ⇒ xong ngay");
  act(s, { type: "claimQuest", id: "xay-nha-kho" }, t);
  assert.equal(currentQuest(s).id, "xay-xuong", "nhiệm vụ tiến trình mở tiếp");
  // xây Xưởng (cấp 4) bằng cơ chế thật ⇒ nhiệm vụ tiến trình đầu xong, sang làm mứt
  t = grind(s, t, () => s.level >= 4 && s.coins >= 400);
  act(s, { type: "buildWorkshop" }, t);
  t += 10 * 60_000;
  const tk = act(s, { type: "tick" }, t);
  assert.ok(tk.events.some((e) => e.type === "questDone" && e.id === "xay-xuong"));
  act(s, { type: "claimQuest", id: "xay-xuong" }, t);
  assert.equal(currentQuest(s).id, "lam-mut");
  assert.equal(s.quests.progress, 0, "làm mứt chưa làm thì chưa xong");
});
