// Test nhẹ cho chính bộ mô phỏng (node --test tools/sim/sim.test.mjs): chạy mô phỏng ngắn bằng luật thật và kiểm bất biến.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Farm } from "./harness.mjs";
import { tick } from "./policy.mjs";
import { runSim } from "./sim.mjs";
import { analyse } from "./analysis.mjs";
import { renderReport } from "./report.mjs";
import { PROFILE_IDS } from "./profiles.mjs";

const T0 = Date.UTC(2026, 10, 2, 8, 0, 0);

function assertFarmOk(f, where) {
  const s = f.s;
  assert.ok(Number.isSafeInteger(s.coins) && s.coins >= 0, `${where}: xu âm / không nguyên (${s.coins})`);
  for (const bag of [s.inv, s.overflow, s.decor]) for (const [id, q] of Object.entries(bag)) assert.ok(Number.isInteger(q) && q >= 0, `${where}: ${id} = ${q}`);
  assert.ok(Object.values(s.overflow).reduce((a, b) => a + b, 0) <= 10, `${where}: giỏ tràn > 10`);
  for (const m of Object.values(s.production.machines)) assert.ok(m.queue.length <= m.slots + 1, `${where}: hàng chờ vượt sức chứa`);
}

test("tick-by-tick: xu ≥ 0, kho không âm, cấp không giảm (60 phút chơi liên tục)", () => {
  const f = new Farm(T0, 99);
  let level = 1;
  for (let k = 0; k < 60; k++) {
    const now = T0 + k * 60_000;
    f.taps = 30;
    tick(f, now, { checkMs: 60_000, lastCheck: T0 + 59 * 60_000, nextStart: T0 + 3 * 3600_000, activeClock: k * 60_000 });
    assertFarmOk(f, `phút ${k}`);
    assert.ok(f.s.level >= level, "cấp giảm");
    level = f.s.level;
  }
  assert.ok(f.s.level >= 4, `sau 60 phút vẫn cấp ${f.s.level} — chính sách không chơi?`);
  assert.ok(f.s.stats.harvested > 50, "gần như không thu hoạch");
  assert.equal(f.errors.length, 0, JSON.stringify(f.errors));
});

test("runSim 1 ngày mọi hồ sơ: không vi phạm bất biến, mốc cấp đơn điệu, mẫu hợp lệ", () => {
  for (const id of PROFILE_IDS) {
    const r = runSim(id, { days: 1, seed: 7 });
    assert.equal(r.errors.length, 0, `${id}: ${JSON.stringify(r.errors.slice(0, 3))}`);
    const lv = Object.keys(r.levels).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < lv.length; i++) {
      assert.equal(lv[i], lv[i - 1] + 1, `${id}: thiếu mốc cấp ${lv[i - 1] + 1}`);
      assert.ok(r.levels[lv[i]].active >= r.levels[lv[i - 1]].active, `${id}: thời gian chơi lùi`);
      assert.ok(r.levels[lv[i]].real >= r.levels[lv[i - 1]].real, `${id}: thời gian thật lùi`);
    }
    for (let i = 1; i < r.samples.length; i++) {
      const a = r.samples[i - 1], b = r.samples[i];
      assert.ok(b.level >= a.level && b.xp >= a.xp && b.earned >= a.earned, `${id}: đường cong lùi`);
      assert.ok(b.coins >= 0);
    }
    const income = Object.values(r.income).reduce((a, b) => a + b, 0);
    assert.equal(income, r.final.earned, `${id}: tổng nguồn thu ≠ stats.earned`);
  }
});

test("tất định: cùng seed ⇒ cùng kết quả", () => {
  const a = runSim("ngay-2-lan", { days: 2, seed: 5 }), b = runSim("ngay-2-lan", { days: 2, seed: 5 });
  assert.deepEqual(a.final, b.final);
  assert.deepEqual(a.levels, b.levels);
});

test("đường cong XP thử nghiệm làm chậm lên cấp và không làm cấp giảm", () => {
  const base = runSim("cham", { days: 1, seed: 3 });
  // base dùng đường thật (60·cấp²) ⇒ đường thử phải chậm hơn nó (gấp đôi) mới so được
  const slow = runSim("cham", { days: 1, seed: 3, xpNeed: (lv) => 120 * lv * lv });
  assert.equal(slow.errors.length, 0);
  assert.ok(slow.final.level < base.final.level, `chậm ${slow.final.level} < thật ${base.final.level}`);
});

test("báo cáo kết xuất được", () => {
  const results = [runSim("ngay-2-lan", { days: 1, seed: 1 })];
  const md = renderReport({ generated: "test", days: 1, seed: 1, elapsedSec: 0, results, analysis: analyse(results) });
  assert.match(md, /Thời gian tới từng cấp/);
  assert.match(md, /Gợi ý chỉnh số/);
});
