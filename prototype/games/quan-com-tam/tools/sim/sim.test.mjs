// Test hồi quy cân bằng đầy đủ (node --test tools/sim/sim.test.mjs, ~4–6 phút): người chơi trung bình lên cấp đúng mục tiêu PLAYBOOK §6
// tới cấp 20, không hồ sơ nào kẹt, tiền cuối game còn chỗ tiêu (hạng quán + nước mắm nhà pha). Bản rút gọn chạy cùng bộ test: test/sim.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runSim, TARGETS } from "./sim.mjs";
import { TIERS, FISH_SAUCE } from "../../data/economy.js?v=c6";

test("hồi quy cân bằng (người chơi trung bình): cấp 4 / 7 / 10 / 20 trong khoảng mục tiêu, lên quán, tiền cuối game còn chỗ tiêu", () => {
  const r = runSim("average", { days: 220, seed: 12345 });
  const tol = { 4: [6, 16], 7: [28, 58], 10: [95, 155], 20: [540, 800] }; // TARGETS ± biên cho seed
  for (const [lv, [lo, hi]] of Object.entries(tol)) {
    const m = r.levels[lv]?.minutes;
    assert.ok(m !== undefined && m >= lo && m <= hi, `cấp ${lv}: ${m} phút (mục tiêu ${TARGETS[lv].join("–")})`);
  }
  assert.equal(r.log.stuck.length, 0);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors.slice(0, 3)));
  const sinkLeft = TIERS.slice(r.final.tier).reduce((a, x) => a + x.price, 0) + FISH_SAUCE.slice(r.final.fishSauce).reduce((a, x) => a + x.price, 0);
  assert.ok(sinkLeft > 0 && r.final.money < sinkLeft + 8000, `tiền ${r.final.money}k, chỗ tiêu còn ${sinkLeft}k`);
  assert.ok(r.final.quanDay !== null, "đã lên quán");
});
test("người ẩu tới cấp 12: không phá sản (luôn có tiền hoặc ký gửi), không kẹt, bỏ về ≤ 40%", () => {
  const r = runSim("sloppy", { days: 90, seed: 777, untilLevel: 12 });
  assert.equal(r.log.stuck.length, 0, JSON.stringify(r.log.stuck.slice(0, 3)));
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors.slice(0, 3)));
  const broke = r.money.filter((d) => d.money <= 5).length;
  assert.ok(broke <= Math.ceil(r.money.length * 0.1), `${broke}/${r.money.length} ngày gần hết tiền`);
  assert.ok(r.log.walkouts / Math.max(1, r.log.guests) <= 0.4, `bỏ về ${r.log.walkouts}/${r.log.guests}`);
});
