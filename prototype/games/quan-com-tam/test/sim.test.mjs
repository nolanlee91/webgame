// Hồi quy cân bằng rút gọn (chạy cùng bộ test, ~1–2 phút): bộ mô phỏng tools/sim chơi bằng luật thật (core/apply.js).
// Bản đầy đủ tới cấp 20: node --test tools/sim/sim.test.mjs (~4–6 phút). Báo cáo: node tools/sim/sim.mjs ⇒ tools/sim/report.md.
import test from "node:test";
import assert from "node:assert/strict";
import { runSim } from "../tools/sim/sim.mjs";
import { Player } from "../tools/sim/harness.mjs";
import { PROFILES, PROFILE_IDS } from "../tools/sim/profiles.mjs";

test("sim tất định: cùng seed ⇒ cùng kết quả", () => {
  const a = runSim("sloppy", { days: 2, seed: 5 }), b = runSim("sloppy", { days: 2, seed: 5 });
  assert.deepEqual(a.final, b.final);
  assert.deepEqual(a.levels, b.levels);
});

test("sim: mọi hồ sơ 7 ngày — không lỗi luật, không kẹt, tiền không âm, ngày 4–12 phút, người ẩu không phá sản", () => {
  for (const id of PROFILE_IDS) {
    const r = runSim(id, { days: 7, seed: 7 });
    assert.equal(r.errors.length, 0, `${id}: ${JSON.stringify(r.errors.slice(0, 3))}`);
    assert.equal(r.log.stuck.length, 0, `${id} kẹt: ${JSON.stringify(r.log.stuck)}`);
    for (const d of r.money) assert.ok(d.money >= 0);
    const perDay = r.final.minutes / r.money.length;
    assert.ok(perDay >= 4 && perDay <= 12, `${id}: ${perDay.toFixed(1)} phút / ngày`);
    assert.ok(r.final.level >= 4, `${id}: cấp ${r.final.level} sau 7 ngày`);
    if (id === "sloppy") assert.ok(r.final.money > 0 || r.log.consign > 0, "người ẩu còn tiền hoặc có ký gửi");
  }
});

test("sim: phá sản giữa chừng vẫn không kẹt — 0 đồng, kho trống ⇒ ký gửi (3 rổ than), vẫn bán được dĩa", () => {
  const P = new Player(PROFILES.sloppy, { seed: 3, gameSeed: 99 });
  P.start();
  P.playDay();
  P.s.money = 0; for (const id of Object.keys(P.s.stock)) P.s.stock[id] = 0;
  let plates = 0;
  for (let d = 0; d < 3; d++) { const r = P.playDay(); assert.ok(r, "ngày chạy hết"); plates += r.plates; }
  assert.ok(plates >= 6, `bán ${plates} dĩa sau khi phá sản`);
  assert.equal(P.errors.length, 0, JSON.stringify(P.errors.slice(0, 3)));
  assert.equal(P.log.stuck.length, 0);
});

test("hồi quy cân bằng đầu game (người chơi trung bình): cấp 4 ≈ 10 phút, có lời ngày 1", () => {
  const r = runSim("average", { days: 4, seed: 12345 });
  const m4 = r.levels[4]?.minutes;
  assert.ok(m4 !== undefined && m4 >= 6 && m4 <= 16, `cấp 4: ${m4} phút`);
  assert.ok(r.money[0].profit > 60, `ngày 1 lời ${r.money[0].profit}k`);
});
