// Chấm điểm + sao, biến thể phiếu, 11 kiểu lỗi, ổ ba chục, "như cũ", khiếu nại (làm lại / giảm / tặng), bỏ về.
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, err, openDay, untilWaiting, build, serveRight, payRight, board, customer, advance } from "./helpers.mjs";
import { makeItem, makeBachuc, bachucPrice, orderText } from "../core/order.js";
import { checkLoaf, scoreOrder, starsFor, timePoints } from "../core/score.js";
import { MISTAKES, MISTAKE_IDS } from "../data/lines-mistakes.js";
import { REGULARS } from "../data/customers.js";

/** Ổ làm đúng y phiếu (bản ghi đã gói). */
const right = (it, extra = {}) => ({ spreads: { ...it.spreads }, fills: [...it.fills], veg: { ...it.veg }, ot: it.ot, sauces: { ...it.sauces }, wrap: it.bag ? "tui" : it.wrap, crisp: 100, burnt: false, dark: false, toasted: false, ...extra });
const cust = (items, filled, patience = 50000) => ({ items, filled, patience });

test("ổ đúng phiếu, giao nhanh ⇒ 100 điểm, 5 sao; mốc sao 0/40/55/70/85", () => {
  const it = makeItem("cha-lua");
  const sc = scoreOrder(cust([it], [right(it)]), 1000);
  assert.equal(sc.points, 100); assert.equal(sc.stars, 5); assert.deepEqual(sc.mistakes, []);
  assert.deepEqual([0, 39, 40, 55, 70, 85, 100].map(starsFor), [1, 1, 2, 3, 4, 5, 5]);
  assert.equal(timePoints(10000, 50000), 20); assert.equal(timePoints(50000, 50000), 4);
});

test("biến thể: không hành / ít ớt / nhiều pate / cắt đôi / thêm trứng (+5k) đổi yêu cầu, chữ phiếu đúng", () => {
  const it = makeItem("cha-lua", ["khong-hanh", "it-ot", "nhieu-pate", "cat-doi"]);
  assert.equal(it.veg["hanh-la"], false); assert.equal(it.ot, 1); assert.equal(it.spreads.pate, 3); assert.equal(it.wrap, "cat-doi");
  assert.match(orderText([it]), /một ổ chả lụa, không hành, ít ớt, nhiều pate, cắt đôi/);
  const eg = makeItem("pate-bo", ["them-trung"]);
  assert.ok(eg.fills.includes("trung")); assert.equal(eg.price, 21);
  assert.deepEqual(makeItem("pate-bo", ["it-ot", "khong-ot"]).quirks, ["it-ot"], "biến thể xung đột bị bỏ");
});

test("11 kiểu lỗi đều được phát hiện, có trần sao", () => {
  const cha = makeItem("cha-lua"), noOnion = makeItem("pate-bo", ["khong-hanh"]), little = makeItem("pate-bo", ["it-ot"]), crispy = makeItem("pate-bo", ["gion-gion"]);
  const cut = makeItem("pate-bo", ["cat-doi"]), bag = makeItem("pate-bo", [], { bag: true }), chay = makeItem("chay");
  const cases = {
    wrongFilling: [cha, right(cha, { fills: [] })],
    noPate: [cha, right(cha, { spreads: { bo: 2 } })],
    onionAnyway: [noOnion, right(noOnion, { veg: { ...noOnion.veg, "hanh-la": true } })],
    tooSpicy: [little, right(little, { ot: 3 })],
    burnt: [cha, right(cha, { burnt: true })],
    soggy: [cha, right(cha, { crisp: 40 })],
    notToasted: [crispy, right(crispy, { crisp: 70 })],
    wrongWrap: [cut, right(cut, { wrap: "giay" })],
    veganMeat: [chay, right(chay, { spreads: { bo: 2, pate: 2 } })],
  };
  for (const [m, [it, loaf]] of Object.entries(cases)) {
    const sc = scoreOrder(cust([it], [loaf]), 1000);
    assert.ok(sc.mistakes.includes(m), `${m}: ${sc.mistakes}`);
    assert.ok(sc.stars <= MISTAKES[m].cap, `${m} trần ${MISTAKES[m].cap}, được ${sc.stars}`);
  }
  // tráo đơn: hai ổ khác nhau gói vào nhầm phần
  const a = makeItem("pate-bo", ["khong-ot"]), b = makeItem("cha-lua");
  const sw = scoreOrder(cust([a, b], [right(b), right(a)]), 1000);
  assert.ok(sw.mistakes.includes("swapped"), String(sw.mistakes));
  assert.ok(bag.bag && scoreOrder(cust([bag], [right(bag, { wrap: "giay" })]), 1000).mistakes.includes("wrongWrap"), "shipper / mua về phải bỏ túi");
  assert.deepEqual(MISTAKE_IDS.length, 11);
});

test("giòn giòn nha: phải nướng lại (≥ 85 lúc giao), không thì lỗi quên nướng lại", () => {
  const s = shop(); openDay(s);
  const c = untilWaiting(s);
  const cc = customer(s, c.id);
  cc.items = [makeItem("pate-bo", ["gion-gion"])];
  act(s, { type: "pin", cid: c.id }); act(s, { type: "take" });
  board(s).loaf.crisp = 70;
  build(s, cc.items[0]); // build nướng lại khi < 85
  assert.ok(board(s).loaf.toasted && board(s).loaf.crisp >= 85);
  act(s, { type: "serve" });
  assert.ok(!customer(s, c.id).score.mistakes.includes("notToasted"));
});

test("thối thiếu ⇒ lỗi thối nhầm tiền, tối đa 2 sao, tiệm bù đủ (tiền cuối = giá ổ)", () => {
  const s = shop(); openDay(s);
  const c = untilWaiting(s);
  customer(s, c.id).payPlan = 50;
  act(s, { type: "pin", cid: c.id }); build(s, customer(s, c.id).items[0]); act(s, { type: "serve" });
  const price = customer(s, c.id).pay.due;
  const m0 = s.money;
  const r = act(s, { type: "giveChange", bills: { 10: 1 } });
  const e = r.events.find((x) => x.type === "served");
  assert.equal(e.change, "short"); assert.ok(e.stars <= 2);
  assert.equal(s.money, m0 + price);
});

test("ổ ba chục: giá = 7k nền + giá lẻ + 2k; lệch ≤ 3k là đúng; thiếu nhân là lỗi kỳ vọng", () => {
  const it = makeBachuc(25);
  const good = { spreads: { pate: 3, bo: 2 }, fills: ["cha-lua"], veg: { ...it.veg }, ot: 2, sauces: { "nuoc-tuong": true }, wrap: "giay", crisp: 100 };
  assert.equal(bachucPrice(good), 7 + 6 + 1 + 7 + 2);
  const ok = checkLoaf(good, it);
  assert.ok(!ok.errors.includes("bachucLow"));
  const cheap = checkLoaf({ ...good, spreads: { pate: 2 }, fills: [] }, it);
  assert.ok(cheap.errors.includes("bachucLow"));
  assert.ok(scoreOrder(cust([it], [{ ...good, spreads: { pate: 2 }, fills: [] }]), 1000).stars <= 3);
  assert.ok(scoreOrder(cust([it], [good]), 1000).stars === 5);
});

test("khách quen: 2 lần ≥ 4 sao thì lần sau gọi \"như cũ\" (phiếu ẩn, món cũ)", () => {
  const s = shop(3);
  s.regulars["Cụ Năm"] = { visits: 2, good: 2 };
  s.tutorialDone = true; s.day = 2;
  act(s, { type: "startShift" });
  s.shift.schedule = [{ at: 0, arch: "regular", name: "Cụ Năm", items: [makeItem(REGULARS["Cụ Năm"].recipe, REGULARS["Cụ Năm"].quirks)], patienceMul: 1 }];
  const c = untilWaiting(s);
  assert.equal(c.nhuCu, true);
  assert.match(c.orderLine, /như cũ|Như cũ/i);
  assert.equal(c.items[0].recipe, "cha-lua");
});

test("khiếu nại: làm lại (khách chờ lại, ổ cũ ghi hao) / giảm 50% / tặng luôn (0 XP)", () => {
  for (const choice of ["remake", "discount", "free"]) {
    const s = shop(11); openDay(s);
    const c = untilWaiting(s);
    act(s, { type: "pin", cid: c.id });
    build(s, customer(s, c.id).items[0], { fills: ["cha-lua"], spreads: {} }); // sai nhân + quên pate
    act(s, { type: "serve" });
    assert.equal(s.shift.dialog?.kind, "complaint", choice);
    const r = act(s, { type: "complaint", choice });
    const cc = customer(s, c.id);
    if (choice === "remake") { assert.equal(cc.phase, "wait"); assert.equal(cc.remade, true); assert.ok(cc.filled.every((f) => !f)); serveRight(s, cc); }
    else { payRight(s); const sv = [...r.events].find((e) => e.type === "served") || s.feed[0]; assert.ok(sv); if (choice === "free") assert.equal(s.shift.stats.xp, 0); }
  }
});

test("chờ quá kiên nhẫn ⇒ khách bỏ về, review 1 sao, danh tiếng −1", () => {
  const s = shop(); openDay(s);
  const c = untilWaiting(s);
  const rep = s.rep;
  const ev = advance(s, c.patience + 400);
  assert.ok(ev.some((e) => e.type === "timeout" && e.cid === c.id));
  assert.equal(s.feed[0].stars, 1);
  assert.ok(s.rep < rep);
});
