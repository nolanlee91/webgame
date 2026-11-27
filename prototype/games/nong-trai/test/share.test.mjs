// Khoe kết quả (ui/share-card.js): lên cấp, danh hiệu Sổ sưu tập, danh hiệu Nhà (nâng Nhà ⇒ danh hiệu danh tiếng mới).
import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../core/state.js?v=m15";
import { BUILDING, FAME_TITLES } from "../data/buildings.js?v=m15";
import { farmShare } from "../ui/share-card.js?v=m15";

test("thẻ khoe danh hiệu Nhà: tên danh hiệu đúng bậc, bậc ★, phần xu đơn hàng trả thêm, ≤ 4 dòng, tiêu đề ≤ 40 ký tự", () => {
  const s = createState(); s.level = 14; s.stats.earned = 123456;
  for (let lv = 2; lv <= BUILDING.nha.levels.length; lv++) {
    const c = farmShare(s, "fame", null, lv);
    assert.equal(c.game, "nong-trai");
    assert.ok(c.title.length <= 40, c.title);
    assert.ok(c.title.includes(FAME_TITLES[lv - 1].slice(0, 30)), c.title);
    assert.equal(c.lines[0], `Nhà: bậc ★${lv - 1}`);
    assert.equal(c.lines[1], `Đơn hàng trả thêm: +${Math.round(BUILDING.nha.levels[lv - 1].effect.orderBonus * 100)} % xu`);
    assert.ok(c.lines.includes("Cấp nông trại: 14") && c.lines.length <= 4 && c.tagline);
  }
  assert.equal(farmShare(s, "fame", null, 3).title, `“${FAME_TITLES[2]}”`);
  assert.equal(farmShare(s, "fame", null, 99).lines[0], `Nhà: bậc ★${BUILDING.nha.levels.length - 1}`, "bậc quá cao ⇒ kẹp về bậc cuối");
});

test("thẻ khoe lên cấp / danh hiệu Sổ vẫn như cũ", () => {
  const s = createState(); s.level = 6;
  assert.equal(farmShare(s, "level").title, "Lên cấp 6!");
  assert.equal(farmShare(s, "title", "Nhà sưu tầm danh tiếng").title, "Danh hiệu “Nhà sưu tầm danh tiếng”");
});
