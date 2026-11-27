// TLC22-01: bàn cuối trả tiền đúng nhịp chốt ca ⇒ event "paid" tới sau khi s.shift = null. Handler không được ném lỗi,
// và vòng lặp khung hình hẹn requestAnimationFrame trước khi làm việc (một lỗi không làm đơ cả game).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { apply, openWithOrder } from "./helpers.mjs?v=c10";
import { groupById, tableById } from "../core/tables.js?v=c10";
import { CLOSE_GRACE_MS } from "../data/economy.js?v=c10";

/** Ca chỉ còn 1 nhóm đang ăn, sát hạn ân hạn ⇒ tick sau tự thu tiền (autoPay) và chốt ca luôn. */
function lastTableSameTick(seed) {
  const { s, g } = openWithOrder(seed, { notTutorial: true });
  const sh = s.shift;
  for (const x of sh.schedule) x.done = true;
  for (const o of sh.groups) if (o.id !== g.id) o.phase = "leave";
  for (const m of g.members) m.plate = { layers: [] };
  sh.t = sh.len + CLOSE_GRACE_MS - 50;
  return { s, r: apply(s, { type: "tick", dt: 200 }) };
}

test("bàn cuối thu tiền đúng tick chốt ca: 'paid' và 'shiftEnded' cùng nhịp, groupById không ném lỗi (20 lượt)", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const { s, r } = lastTableSameTick(seed);
    assert.equal(r.err, undefined);
    const types = r.events.map((e) => e.type);
    assert.ok(types.includes("paid") && types.includes("shiftEnded"), `seed ${seed}: ${types.join(",")}`);
    assert.equal(s.shift, null);
    assert.ok(s.lastSummary, "có bảng chốt ca");
    for (const e of r.events) if (e.type === "paid") assert.equal(groupById(s, e.gid), null);
    assert.equal(tableById(s, 1), null);
  }
});

test("game.js: frame() hẹn requestAnimationFrame trước khi làm việc, bọc try; handler 'paid' kiểm state.shift", () => {
  const src = readFileSync(new URL("../game.js", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("function frame(now)"), src.indexOf("function step(now)"));
  assert.ok(body.indexOf("requestAnimationFrame(frame)") > 0 && body.indexOf("requestAnimationFrame(frame)") < body.indexOf("step(now)"), "rAF trước step()");
  assert.match(body, /try\s*\{\s*step\(now\)/);
  assert.match(src, /case "paid": \{ const g = state\.shift \?/);
});
