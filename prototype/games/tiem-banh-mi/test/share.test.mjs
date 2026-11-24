// Khoe "Lên cấp N!": lên cấp giữa ca được ghi vào ca (giữ qua tải lại), bảng chốt ca có levelUps, thẻ khoe chốt ca + thẻ khoe giữa ca ghi đúng cấp.
import test from "node:test";
import assert from "node:assert/strict";
import { shop, prepAndOpen } from "./helpers.mjs";
import { gainXp, endShift } from "../core/shift.js?v=b5";
import { loadSave, dump } from "../core/state.js?v=b5";
import { LEVELS } from "../data/economy.js?v=b5";
import { summaryShare, levelUpShare } from "../ui/screens.js?v=b5";

const openShift = () => { const s = shop(11); s.tutorialDone = true; s.day = 3; prepAndOpen(s); return s; };

test("lên cấp giữa ca: ghi vào ca, giữ qua tải lại, bảng chốt ca có levelUps và cấp sau cùng", () => {
  const s = openShift();
  const lv0 = s.level, ev = [];
  gainXp(s, LEVELS[lv0] - s.xp, ev);
  assert.deepEqual(ev.filter((e) => e.type === "levelUp").map((e) => e.level), [lv0 + 1]);
  assert.deepEqual(s.shift.stats.levelUps, [lv0 + 1]);
  const s2 = loadSave(dump(s));
  assert.deepEqual(s2.shift.stats.levelUps, [lv0 + 1], "tải lại giữa ca vẫn nhớ đã lên cấp");
  gainXp(s2, LEVELS[lv0 + 1] - s2.xp, []);
  endShift(s2, [], true);
  const S = s2.lastSummary;
  assert.deepEqual(S.levelUps, [lv0 + 1, lv0 + 2]);
  assert.equal(S.level, s2.level);
  const card = summaryShare(S);
  assert.ok(card.lines.includes(`Lên cấp: ${lv0 + 2}!`), card.lines.join(" | "));
  assert.ok(card.lines.length <= 4);
});

test("ca không lên cấp: thẻ chốt ca vẫn ghi Cấp tiệm; bản lưu cũ (thiếu levelUps) không hỏng", () => {
  const s = openShift();
  endShift(s, [], true);
  assert.deepEqual(s.lastSummary.levelUps, []);
  assert.ok(summaryShare(s.lastSummary).lines.includes(`Cấp tiệm: ${s.level}`));
  const old = { ...s.lastSummary }; delete old.levelUps;
  assert.ok(summaryShare(old).lines.includes(`Cấp tiệm: ${s.level}`));
  const t = openShift(); delete t.shift.stats.levelUps;
  const t2 = loadSave(dump(t));
  assert.deepEqual(t2.shift.stats.levelUps, []);
  gainXp(t2, LEVELS[t2.level] - t2.xp, []);
  assert.equal(t2.shift.stats.levelUps.length, 1);
});

test("thẻ khoe giữa ca: tiêu đề Lên cấp N!, số thật của tiệm, tối đa 4 dòng", () => {
  const s = openShift(); s.followers = 42; s.shopName = "Bánh Mì Cô Út";
  const c = levelUpShare(s, 7);
  assert.equal(c.game, "tiem-banh-mi");
  assert.equal(c.title, "Lên cấp 7!");
  assert.ok(c.lines.includes("Tiệm: Bánh Mì Cô Út") && c.lines.includes("Người theo dõi: 42"));
  assert.ok(c.lines.length <= 4 && c.tagline);
});
