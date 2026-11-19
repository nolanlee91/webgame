// Test hồi quy cân bằng (node --test tools/sim/sim.test.mjs, ~1–2 phút): bộ mô phỏng chơi bằng luật thật,
// người chơi trung bình phải lên cấp đúng mục tiêu PLAYBOOK §6, người ẩu không bao giờ kẹt, tiền cuối game còn chỗ tiêu.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runSim, TARGETS } from "./sim.mjs";
import { Player } from "./harness.mjs";
import { PROFILES, PROFILE_IDS } from "./profiles.mjs";
import { TIERS } from "../../core/fair.js";

test("tất định: cùng seed ⇒ cùng kết quả", () => {
  const a = runSim("sloppy", { days: 4, seed: 5 }), b = runSim("sloppy", { days: 4, seed: 5 });
  assert.deepEqual(a.final, b.final);
  assert.deepEqual(a.levels, b.levels);
});

test("mọi hồ sơ 12 ngày: không lỗi luật, không kẹt, cấp và thời gian tăng đều", () => {
  for (const id of PROFILE_IDS) {
    const r = runSim(id, { days: 12, seed: 7 });
    assert.equal(r.errors.length, 0, `${id}: ${JSON.stringify(r.errors.slice(0, 3))}`);
    assert.equal(r.log.stuck.length, 0, `${id} kẹt: ${JSON.stringify(r.log.stuck)}`);
    const lv = Object.keys(r.levels).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < lv.length; i++) assert.ok(r.levels[lv[i]].minutes >= r.levels[lv[i - 1]].minutes, `${id}: thời gian lùi`);
    for (const d of r.money) assert.ok(d.money >= 0);
  }
});

test("người ẩu nghèo rớt mồng tơi vẫn không kẹt: 0 đồng, kho trống ⇒ ký gửi / mượn / đổi món, vẫn bán được ly", () => {
  const P = new Player(PROFILES.sloppy, { seed: 3, gameSeed: 99 });
  P.start();
  P.prepDay(); P.playShift();
  P.s.money = 0; for (const id of Object.keys(P.s.stock)) P.s.stock[id] = 0;
  let cups = 0;
  for (let d = 0; d < 4; d++) { P.prepDay(); const r = P.playShift(); assert.ok(r, "ca chạy hết"); cups += r.cups; }
  assert.ok(cups >= 4, `bán ${cups} ly sau khi phá sản`);
  assert.equal(P.errors.length, 0, JSON.stringify(P.errors.slice(0, 3)));
});

test("hồi quy cân bằng (người chơi trung bình): cấp 4 / 7 / 10 / 20 trong khoảng mục tiêu, tiền cuối game còn chỗ tiêu", () => {
  const r = runSim("average", { days: 300, seed: 12345 });
  const tol = { 4: [6, 16], 7: [28, 55], 10: [95, 150], 20: [540, 780] }; // mục tiêu TARGETS ± biên cho seed
  for (const [lv, [lo, hi]] of Object.entries(tol)) {
    const m = r.levels[lv]?.minutes;
    assert.ok(m !== undefined && m >= lo && m <= hi, `cấp ${lv}: ${m} phút (mục tiêu ${TARGETS[lv].join("–")})`);
  }
  assert.equal(r.log.stuck.length, 0);
  // chỗ tiêu tiền cuối game: còn bậc hạng tiệm chưa mua, hoặc tiền mặt nhỏ hơn tổng giá các bậc
  const tiersLeft = TIERS.slice(r.final.tier || 0).reduce((a, t) => a + t.price, 0);
  assert.ok(r.final.money < tiersLeft + 6000, `tiền ${r.final.money}k, hạng còn ${tiersLeft}k`);
});
