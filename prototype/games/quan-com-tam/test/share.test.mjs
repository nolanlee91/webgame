// Khoe "Lên cấp N!": lên cấp giữa ca được ghi vào ca (giữ qua tải lại), bảng chốt ca có levelUps, thẻ khoe chốt ca + thẻ khoe giữa ca ghi đúng cấp.
import test from "node:test";
import assert from "node:assert/strict";
import { newGame, prepDay, must } from "./helpers.mjs";
import { gainXp } from "../core/progress.js?v=c8";
import { endShift } from "../core/shift.js?v=c8";
import { loadSave, dump } from "../core/state.js?v=c8";
import { LEVELS } from "../data/economy.js?v=c8";
import { summaryShare, levelUpShare } from "../ui/overlays.js?v=c8";

const openShift = () => { const s = newGame(11); s.tutorialDone = true; prepDay(s); must(s, { type: "startShift" }); return s; };

test("lên cấp giữa ca: ghi vào ca, giữ qua tải lại, bảng chốt ca có levelUps và cấp sau cùng", () => {
  const s = openShift();
  const lv0 = s.level, ev = [];
  gainXp(s, LEVELS[lv0] - s.xp, ev);
  assert.deepEqual(ev.filter((e) => e.type === "levelUp").map((e) => e.level), [lv0 + 1]);
  assert.deepEqual(s.shift.stats.levelUps, [lv0 + 1]);
  const s2 = loadSave(dump(s));
  assert.ok(s2.shift, "ca còn mở sau tải lại");
  assert.deepEqual(s2.shift.stats.levelUps, [lv0 + 1], "tải lại giữa ca vẫn nhớ đã lên cấp");
  gainXp(s2, LEVELS[lv0 + 1] - s2.xp, []);
  endShift(s2, []);
  const m = s2.lastSummary;
  assert.deepEqual(m.levelUps, [lv0 + 1, lv0 + 2]);
  assert.equal(m.level, s2.level);
  const card = summaryShare(m);
  assert.ok(card.lines.includes(`Lên cấp: ${lv0 + 2}!`), card.lines.join(" | "));
  assert.ok(card.lines.length <= 4);
});

test("ca không lên cấp: thẻ chốt ca vẫn ghi Cấp quán; bản lưu cũ (thiếu levelUps) không hỏng", () => {
  const s = openShift();
  endShift(s, []);
  assert.deepEqual(s.lastSummary.levelUps, []);
  assert.ok(summaryShare(s.lastSummary).lines.includes(`Cấp quán: ${s.level}`));
  const old = { ...s.lastSummary }; delete old.levelUps;
  assert.ok(summaryShare(old).lines.includes(`Cấp quán: ${s.level}`));
  const t = openShift(); delete t.shift.stats.levelUps;
  gainXp(t, LEVELS[t.level] - t.xp, []);
  assert.equal(t.shift.stats.levelUps.length, 1);
});

test("thẻ khoe giữa ca: tiêu đề Lên cấp N!, số thật của quán, tối đa 4 dòng", () => {
  const s = openShift(); s.followers = 9; s.shopName = "Cơm Tấm Cô Ba";
  const c = levelUpShare(s, 5);
  assert.equal(c.game, "quan-com-tam");
  assert.equal(c.title, "Lên cấp 5!");
  assert.ok(c.lines.includes("Quán: Cơm Tấm Cô Ba") && c.lines.includes("Người theo dõi: 9"));
  assert.ok(c.lines.length <= 4 && c.tagline && c.theme === "wood");
});
