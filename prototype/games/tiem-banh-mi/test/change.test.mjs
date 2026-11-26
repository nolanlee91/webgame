// Tiền lẻ là tài nguyên: thối đúng / thiếu / dư, không thể thối, quỹ cạn dần, nút "Thối đúng" ngày 1–3, đổi lẻ ở Cô Sáu.
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, err, openDay, untilWaiting, build, board, customer } from "./helpers.mjs";
import { makeChange, canChange, floatValue, spend, greedyBills, till } from "../core/money.js";
import { nochangeOptions } from "../core/rescue.js";

function paying(seed = 7, bill = 50, setup = null) {
  const s = shop(seed); openDay(s);
  if (setup) setup(s);
  const c = untilWaiting(s);
  customer(s, c.id).payPlan = bill;
  act(s, { type: "pin", cid: c.id }); build(s, customer(s, c.id).items[0]); act(s, { type: "serve" });
  return [s, customer(s, c.id)];
}

test("máy giải tiền thối: ít tờ nhất, tôn trọng số tờ có; không thể thì null", () => {
  assert.deepEqual(makeChange({ 1: 5, 2: 5, 5: 3, 10: 1 }, 4), { 2: 2 });
  assert.deepEqual(makeChange({ 10: 1, 5: 3, 2: 5, 1: 5 }, 28), { 10: 1, 5: 3, 2: 1, 1: 1 });
  assert.equal(makeChange({ 5: 1, 2: 1 }, 4), null, "có 7k mà không ra 4k");
  assert.equal(makeChange({ 20: 2 }, 30), null);
  assert.equal(canChange({ 50: 1 }, 50), true);
  assert.deepEqual(makeChange({}, 0), {});
});

test("thối đúng bằng tờ tay: tờ khách đưa ≤ 50k vào quỹ lẻ, tiền tăng đúng giá ổ", () => {
  const [s, c] = paying(7, 50);
  const due = c.pay.due, change = c.pay.change, m0 = s.money, f0 = { ...s.float };
  const bills = makeChange(s.float, change);
  const r = act(s, { type: "giveChange", bills });
  assert.equal(r.events.find((e) => e.type === "served").change, null);
  assert.equal(s.money, m0 + due);
  assert.equal((s.float[50] || 0), (f0[50] || 0) + 1);
  assert.equal(s.shift.stats.changeRight, 1);
  assert.notEqual(err(s, { type: "giveChange", bills }), undefined, "bấm lặp không thối hai lần");
});

test("TLC22-03: chưa chọn tờ nào ⇒ không 'Thối 0k' được, không tính lỗi thối nhầm, khách vẫn chờ thối", () => {
  const [s, c] = paying(7, 50);
  const wrong0 = s.shift.stats.changeWrong || 0, m0 = s.money;
  for (const bills of [{}, { 10: 0 }, { 1: 0, 5: 0 }]) assert.equal(err(s, { type: "giveChange", bills }), "no-change-picked");
  assert.equal(s.shift.paying, c.id, "vẫn đang thối cho khách này");
  assert.equal(s.shift.stats.changeWrong || 0, wrong0);
  assert.equal(s.money, m0);
  act(s, { type: "giveChange", bills: makeChange(s.float, c.pay.change) });
  assert.equal(s.shift.stats.changeRight, 1);
});

test("thối dư: mất tiền (hoặc khách thật thà trả lại), không trừ sao", () => {
  let returned = 0, lost = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const [s, c] = paying(seed, 50);
    const over = { ...makeChange(s.float, c.pay.change) };
    const extra = [1, 2, 5].find((d) => (s.float[d] || 0) > (over[d] || 0));
    over[extra] = (over[extra] || 0) + 1;
    const m0 = s.money;
    const e = act(s, { type: "giveChange", bills: over }).events.find((x) => x.type === "served");
    if (e.change === "overBack") { returned++; assert.equal(s.money, m0 + c.pay.due); }
    else { lost++; assert.equal(e.change, "overGone"); assert.equal(s.money, m0 + c.pay.due - extra); }
    assert.ok(e.stars >= 3, "thối dư không trừ sao");
  }
  assert.ok(returned > 0 && lost > 0, `${returned} trả lại · ${lost} mất`);
});

test("quỹ lẻ không thối nổi ⇒ hội thoại hết lẻ, cả ba lựa chọn miễn phí, không kẹt", () => {
  for (const choice of ["run", "owe", "self"]) {
    const [s, c] = paying(5, 100, (s) => { s.float = { 1: 1 }; });
    assert.equal(s.shift.dialog?.kind, "nochange", "tự mở khi không thối được");
    assert.ok(nochangeOptions(s).every((o) => o.ok && o.free));
    const m0 = s.money;
    act(s, { type: "nochange", choice });
    if (choice === "run") { assert.ok(s.shift.away); for (let i = 0; i < 60; i++) act(s, { type: "tick", dt: 200 }); assert.equal(s.money, m0 + c.pay.due); }
    if (choice === "owe") assert.equal(s.money, m0);
    assert.equal(s.shift.paying, null);
    assert.notEqual(customer(s, c.id).phase, "pay");
  }
});

test("quỹ lẻ cạn dần khi khách đưa tờ lớn liên tục; Hết lẻ? mở hội thoại thủ công", () => {
  const [s, c] = paying(9, 50);
  const f0 = floatValue(s.float);
  act(s, { type: "autoChange" });
  assert.ok(floatValue(s.float) < f0 + 50 && floatValue(s.float) <= s.money);
  const [s2] = paying(9, 50);
  act(s2, { type: "noChange" });
  assert.equal(s2.shift.dialog.kind, "nochange");
});

test("nút Thối đúng chỉ ngày 1–3; từ ngày 4 phải thối tay", () => {
  const [s] = paying(7, 50);
  act(s, { type: "autoChange" });
  const [s4] = paying(7, 50, (x) => { x.day = 4; });
  assert.equal(err(s4, { type: "autoChange" }), "manual-change");
});

test("đổi lẻ ở Cô Sáu: tối đa 100k/ngày ở xe đẩy, lấy từ két; chi tiền lấy két trước", () => {
  const s = shop();
  s.money = 300;
  act(s, { type: "exchange", pack: "nho" }); act(s, { type: "exchange", pack: "vua" });
  assert.equal(s.daily.exchanged, 90);
  assert.equal(err(s, { type: "exchange", pack: "vua" }), "exchange-limit");
  const f = floatValue(s.float);
  spend(s, 30);
  assert.equal(floatValue(s.float), f, "két đủ thì không đụng quỹ lẻ");
  s.money = floatValue(s.float);
  spend(s, 7);
  assert.equal(till(s), 0); assert.equal(floatValue(s.float), s.money);
  assert.deepEqual(greedyBills(28), { 20: 1, 5: 1, 2: 1, 1: 1 });
});
