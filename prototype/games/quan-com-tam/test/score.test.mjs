// Chấm điểm 0–100 + sao 1–5 + trần sao của đủ 13 kiểu lỗi (DRAMA.md §3); khiếu nại (làm lại / giảm giá / miễn phí); lỗi nặng mở xin lỗi nghiêm túc.
import test from "node:test";
import assert from "node:assert/strict";
import { judge, scorePlate, servicePoints, finalStars, starsFor, timePoints, MISTAKES, MISTAKE_IDS } from "../core/score.js?v=c1";
import { emptyPlate } from "../core/plate.js?v=c1";
import { apply, must, openWithOrder, home, cookedPiece, until } from "./helpers.mjs";

const T = (dish = "com-suon", quirks = [], extra = {}) => ({ id: 1, dish, quirks, ...extra });
/** Dĩa đúng chuẩn cho phiếu. */
function good(t, over = {}) {
  const p = emptyPlate(t.id, t.takeaway ? "hop" : "dia");
  Object.assign(p, { com: t.quirks.includes("themCom") ? 2 : 1, moHanh: t.quirks.includes("khongMoHanh") ? 0 : t.quirks.includes("themMoHanh") ? 2 : 1, meat: { item: "suon", sides: [105, 105], fresh: 100, result: "done" }, doChua: !t.quirks.includes("khongDoChua"), duaLeo: true, sauce: t.takeaway ? "bich" : t.quirks.includes("riengNuocMam") ? "chen" : "chan" });
  if (t.dish === "com-suon-bi" || t.dish === "dac-biet") p.bi = !t.quirks.includes("khongBi");
  if (t.dish === "com-suon-trung" || t.dish === "dac-biet") p.trung = t.quirks.includes("longDao") ? "runny" : "set";
  if (t.dish === "dac-biet") { p.cha = true; p.ngo = true; }
  return Object.assign(p, over);
}

test("mốc sao 0 / 40 / 55 / 70 / 85; điểm thời gian 20 → 4; dĩa chuẩn + phục vụ chuẩn = 100 điểm = 5 sao", () => {
  assert.deepEqual([0, 39, 40, 54, 55, 69, 70, 84, 85, 100].map(starsFor), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(timePoints(10000, 50000), 20); assert.equal(timePoints(50000, 50000), 4);
  const t = T();
  const r = scorePlate(good(t), t, { waitMs: 5000, patienceMs: 50000 });
  assert.equal(r.partial, 85); assert.deepEqual(r.mistakes, []);
  assert.equal(r.partial + servicePoints({ billMs: 3000 }), 100);
  assert.equal(finalStars(100, []), 5);
});

test("đủ 13 kiểu lỗi, mỗi kiểu có trần sao đúng bảng DRAMA.md §3", () => {
  assert.equal(MISTAKE_IDS.length, 13);
  const caps = { wrongDish: 2, biAnyway: 3, hardEgg: 4, burnt: 2, raw: 1, noMoHanh: 4, sauceMixed: 3, noTea: 4, dirtyTable: 3, wrongTable: 2, swapped: 3, wrongBill: 2, veganMeat: 1 };
  for (const [k, c] of Object.entries(caps)) { assert.equal(MISTAKES[k].cap, c, k); assert.equal(finalStars(100, [k]), c, k); }
});

test("phát hiện lỗi món: sai món, không bì mà có bì, lòng đào thành chín, cháy khét, sống, quên mỡ hành, chan khi dặn riêng, chay dính mặn", () => {
  const has = (p, t, m) => assert.ok(judge(p, t).mistakes.includes(m), `${m}: ${JSON.stringify(judge(p, t).mistakes)}`);
  has(good(T(), { meat: { item: "ga", sides: [105, 105], fresh: 100, result: "done" } }), T(), "wrongDish");
  has(good(T("com-suon-bi", ["khongBi"]), { bi: true }), T("com-suon-bi", ["khongBi"]), "biAnyway");
  has(good(T("com-suon-trung", ["longDao"]), { trung: "hard" }), T("com-suon-trung", ["longDao"]), "hardEgg");
  has(good(T(), { meat: { item: "suon", sides: [135, 105], fresh: 100, result: "burnt" } }), T(), "burnt");
  has(good(T(), { meat: { item: "suon", sides: [80, 105], fresh: 100, result: "half" } }), T(), "raw");
  has(good(T(), { moHanh: 0 }), T(), "noMoHanh");
  has(good(T([], ["themMoHanh"]), { moHanh: 1 }), T("com-suon", ["themMoHanh"]), "noMoHanh");
  has(good(T("com-suon", ["riengNuocMam"]), { sauce: "chan" }), T("com-suon", ["riengNuocMam"]), "sauceMixed");
  has(good(T("com-suon", [], { takeaway: true }), { sauce: "chan" }), T("com-suon", [], { takeaway: true }), "sauceMixed");
  const vegan = T("com-chay");
  const vp = emptyPlate(1, "dia"); Object.assign(vp, { com: 1, moHanh: 1, hanhPhi: true, meat: { item: "dau-hu", sides: [105, 105], fresh: 100, result: "done" }, bi: true, cha: true, doChua: true, duaLeo: true, sauce: "chan" });
  has(vp, vegan, "veganMeat");
  assert.deepEqual(judge({ ...vp, moHanh: 0 }, vegan).mistakes, []);
});

test("cháy cạnh: khách dặn thì 20 điểm nướng; không dặn thì 16; dặn mà ra chín đều −5; sườn khô (giữ ấm lâu) tối đa 14, trần 4 sao", () => {
  const charred = { item: "suon", sides: [118, 105], fresh: 100, result: "charred" };
  assert.equal(judge(good(T("com-suon", ["chayCanh"]), { meat: charred }), T("com-suon", ["chayCanh"])).grill, 20);
  assert.equal(judge(good(T(), { meat: charred }), T()).grill, 16);
  assert.equal(judge(good(T("com-suon", ["chayCanh"])), T("com-suon", ["chayCanh"])).grill, 15);
  const dry = judge(good(T(), { meat: { item: "suon", sides: [105, 105], fresh: 40, result: "done" } }), T());
  assert.equal(dry.grill, 14); assert.ok(dry.errors.includes("dry"));
  assert.equal(finalStars(100, [], ["dry"]), 4);
});

test("bưng nhầm bàn / tráo dĩa: dĩa đúng phiếu của người khác (khác bàn / cùng bàn)", () => {
  const mine = T("com-suon", ["khongDoChua"], { id: 1 }), other = T("com-suon", ["themCom"], { id: 2 });
  const plate = good(other);
  assert.deepEqual(scorePlate(plate, mine, { others: [{ ticket: other, sameTable: true }] }).mistakes, ["swapped"]);
  assert.deepEqual(scorePlate(plate, mine, { others: [{ ticket: other, sameTable: false }] }).mistakes, ["wrongTable"]);
});

test("lỗi phục vụ: quên trà ⇒ mất 5 điểm + trần 4; bàn dơ ⇒ mất 4 + trần 3; tính tiền chậm / khách để tiền ⇒ mất điểm tính tiền; tính dư trần 2", () => {
  assert.equal(servicePoints({ noTea: true, billMs: 0 }), 10);
  assert.equal(servicePoints({ dirty: true, billMs: 0 }), 11);
  assert.equal(servicePoints({ billMs: 30000 }), 12);
  assert.equal(servicePoints({ auto: true }), 12);
  assert.equal(finalStars(90, ["noTea"]), 4); assert.equal(finalStars(90, ["dirtyTable"]), 3); assert.equal(finalStars(90, ["wrongBill"]), 2);
  assert.equal(finalStars(90, ["burnt"], [], 2), 4, "miễn phí dĩa bù +2 trần");
});

test("ca thật: giao dĩa sườn sống ⇒ hội thoại xin lỗi nghiêm túc (làm lại miễn phí) ⇒ phiếu quay lại thanh phiếu", () => {
  const { s, t } = openWithOrder(21);
  home(s);
  must(s, { type: "pin", tk: t.id });
  cookedPiece(s, 4, "suon", [70, 105]); // một mặt còn tái
  for (const id of ["dia", "com", "moHanh"]) must(s, { type: "layer", id });
  must(s, { type: "pickMeat", slot: 4 });
  for (const id of ["doChua", "duaLeo", "sauce"]) must(s, { type: "layer", id });
  must(s, { type: "serve" });
  until(s, (x) => !!x.shift.dialog, 20000);
  assert.equal(s.shift.dialog.kind, "complaint");
  assert.equal(s.shift.dialog.mistake, "raw");
  assert.ok(s.shift.dialog.serious);
  assert.equal(apply(s, { type: "complaint", choice: "discount" }).err, "bad-choice", "lỗi nặng không cho giảm giá cho qua");
  must(s, { type: "complaint", choice: "remake" });
  const tk = s.shift.tickets.find((x) => x.id === t.id);
  assert.equal(tk.status, "open"); assert.ok(tk.free && tk.remade);
});
