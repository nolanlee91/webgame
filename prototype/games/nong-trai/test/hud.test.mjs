// TLC12-04: số gọn cho HUD (như Trà Sữa) ⇒ xu lớn không đẩy HUD xuống 2 hàng.
import test from "node:test";
import assert from "node:assert/strict";
import { shortNum } from "../ui/short-num.js?v=m18";

test("shortNum: 24 · 9.999 · 148k · 1,2tr · 999tr · 1,5 tỷ, cắt xuống không làm tròn lên, ≤ 6 ký tự tới 999 tỷ", () => {
  assert.equal(shortNum(24), "24");
  assert.equal(shortNum(9999), "9.999");
  assert.equal(shortNum(148_500), "148k");
  assert.equal(shortNum(10_000), "10k");
  assert.equal(shortNum(1_250_000), "1,2tr");
  assert.equal(shortNum(999_999_999), "999tr");
  assert.equal(shortNum(1_500_000_000), "1,5 tỷ");
  assert.equal(shortNum(-12_000), "−12k");
  for (const n of [0, 7, 99_999, 999_999, 12_345_678, 999_999_999, 999e9]) assert.ok(shortNum(n).length <= 7, `${n} ⇒ ${shortNum(n)}`);
});
