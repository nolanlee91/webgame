// Test hồi quy cân bằng (node --test tools/sim/sim.test.mjs, ~2–3 phút): bộ mô phỏng chơi bằng luật thật,
// người chơi trung bình lên cấp đúng mục tiêu PLAYBOOK §6, không hồ sơ nào kẹt, tiền cuối game còn chỗ tiêu (hạng tiệm + pate nhà làm).
import { test } from "node:test";
import assert from "node:assert/strict";
import { runSim, TARGETS } from "./sim.mjs";
import { Player } from "./harness.mjs";
import { PROFILES, PROFILE_IDS } from "./profiles.mjs";
import { RANKS, HOUSE_PATE } from "../../data/equipment.js?v=b14";

test("tất định: cùng seed ⇒ cùng kết quả", () => {
  const a = runSim("sloppy", { days: 3, seed: 5 }), b = runSim("sloppy", { days: 3, seed: 5 });
  assert.deepEqual(a.final, b.final);
  assert.deepEqual(a.levels, b.levels);
});

test("mọi hồ sơ 12 ngày: không lỗi luật, không kẹt, cấp và thời gian tăng đều, tiền không âm, ngày 5–10 phút", () => {
  for (const id of PROFILE_IDS) {
    const r = runSim(id, { days: 12, seed: 7 });
    assert.equal(r.errors.length, 0, `${id}: ${JSON.stringify(r.errors.slice(0, 3))}`);
    assert.equal(r.log.stuck.length, 0, `${id} kẹt: ${JSON.stringify(r.log.stuck)}`);
    const lv = Object.keys(r.levels).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < lv.length; i++) assert.ok(r.levels[lv[i]].minutes >= r.levels[lv[i - 1]].minutes, `${id}: thời gian lùi`);
    for (const d of r.money) assert.ok(d.money >= 0);
    const perDay = r.final.minutes / r.money.length;
    assert.ok(perDay >= 4.5 && perDay <= 10, `${id}: ${perDay.toFixed(1)} phút / ngày`);
  }
});

test("phá sản giữa chừng vẫn không kẹt: 0 đồng, kho trống ⇒ ký gửi / mượn / đổi món, vẫn bán được ổ", () => {
  const P = new Player(PROFILES.sloppy, { seed: 3, gameSeed: 99 });
  P.start();
  P.prepDay(); P.playShift();
  P.s.money = 0; P.s.float = {}; for (const id of Object.keys(P.s.stock)) P.s.stock[id] = 0; P.s.lots = {};
  let loaves = 0;
  for (let d = 0; d < 4; d++) { P.prepDay(); const r = P.playShift(); assert.ok(r, "ca chạy hết"); loaves += r.loaves; }
  assert.ok(loaves >= 6, `bán ${loaves} ổ sau khi phá sản`);
  assert.equal(P.errors.length, 0, JSON.stringify(P.errors.slice(0, 3)));
  assert.equal(P.log.stuck.length, 0);
});

test("hồi quy cân bằng (người chơi trung bình): cấp 4 / 7 / 10 / 20 trong khoảng mục tiêu, tiền cuối game còn chỗ tiêu", () => {
  const r = runSim("average", { days: 160, seed: 12345 });
  const tol = { 4: [6, 16], 7: [28, 55], 10: [95, 150], 20: [560, 780] }; // TARGETS ± biên cho seed
  for (const [lv, [lo, hi]] of Object.entries(tol)) {
    const m = r.levels[lv]?.minutes;
    assert.ok(m !== undefined && m >= lo && m <= hi, `cấp ${lv}: ${m} phút (mục tiêu ${TARGETS[lv].join("–")})`);
  }
  assert.equal(r.log.stuck.length, 0);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors.slice(0, 3)));
  // chỗ tiêu tiền cuối game: tới cấp 20 vẫn còn bậc hạng tiệm / pate nhà làm chưa mua, hoặc tiền mặt chưa đủ mua hết
  const sinkLeft = RANKS.slice(r.final.rank).reduce((a, x) => a + x.price, 0) + HOUSE_PATE.slice(r.final.pate).reduce((a, x) => a + x.price, 0);
  assert.ok(sinkLeft > 0 && r.final.money < sinkLeft + 6000, `tiền ${r.final.money}k, chỗ tiêu còn ${sinkLeft}k`);
  assert.ok(r.final.shopDay !== null, "đã lên tiệm");
});
