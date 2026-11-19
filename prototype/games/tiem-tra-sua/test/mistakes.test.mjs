// Hài kịch pha nhầm + review: đủ câu cho mỗi loại lỗi / mỗi mức sao / mỗi nhóm khách, không emoji, có hashtag, không lặp trong ca;
// luật mới: quên nắp, giao nhầm khách, đổi chỗ hai ly trong đơn nhóm; lỗi có thể "lên mạng" thành sự kiện.
import test from "node:test";
import assert from "node:assert/strict";
import { MISTAKE_KINDS, MISTAKE_SAY, MISTAKE_REVIEW, REVIEW_BY_STARS, mistakeOf } from "../data/lines-mistakes.js";
import { ARCHETYPE_IDS } from "../data/customers.js";
import { EVENTS } from "../data/events.js";
import { poolFor } from "../core/shift.js";
import { STOCK_IDS } from "../data/ingredients.js";
import { shop, act, err, advance, stepsFor } from "./helpers.mjs";
import { LEVELS } from "../data/levels.js";

const VARS = new Set(["self", "call", "drink", "sugar", "ice", "topping", "name", "n"]);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
function checkLines(list, where) {
  for (const t of list) {
    assert.equal(typeof t, "string", where);
    assert.ok(t.length >= 12 && t.length <= 220, `${where}: độ dài: ${t}`);
    assert.ok(!EMOJI.test(t), `${where}: có emoji: ${t}`);
    for (const m of t.matchAll(/\{(\w+)\}/g)) assert.ok(VARS.has(m[1][0].toLowerCase() + m[1].slice(1)), `${where}: biến lạ {${m[1]}}`);
  }
  assert.equal(new Set(list).size, list.length, where + ": câu trùng");
}

test("mỗi loại lỗi: 6–10+ câu khách nói và 6–10+ câu review cho mỗi nhóm khách, có câu riêng từng nhóm", () => {
  assert.deepEqual([...MISTAKE_KINDS].sort(), ["ice", "noLid", "slow", "sugar", "swapped", "topping", "wrongCustomer", "wrongDrink"]);
  for (const k of MISTAKE_KINDS) for (const [name, T] of [["SAY", MISTAKE_SAY], ["REVIEW", MISTAKE_REVIEW]]) {
    assert.ok((T[k]?.default || []).length >= 4, `${name}.${k}.default ≥ 4`);
    checkLines(T[k].default, `${name}.${k}.default`);
    for (const a of ARCHETYPE_IDS) {
      const own = T[k][a] || [];
      assert.ok(own.length >= 2, `${name}.${k}.${a}: ≥ 2 câu riêng`);
      checkLines(own, `${name}.${k}.${a}`);
      assert.ok(poolFor(T[k], a).length >= 6, `${name}.${k}.${a}: tổng ≥ 6`);
    }
  }
});

test("review theo sao: mỗi mức 1–5, mỗi nhóm khách ≥ 10 câu (≥ 4 câu riêng), giọng mạng xã hội có hashtag", () => {
  let tagged = 0, all = 0;
  for (const st of [1, 2, 3, 4, 5]) {
    const T = REVIEW_BY_STARS[st];
    assert.ok(T?.default?.length >= 6, `${st} sao: default ≥ 6`);
    checkLines(T.default, `${st}.default`);
    for (const a of ARCHETYPE_IDS) {
      const own = T[a] || [];
      assert.ok(own.length >= 4, `${st} sao ${a}: ≥ 4 câu riêng`);
      checkLines(own, `${st}.${a}`);
      assert.ok(poolFor(T, a).length >= 10, `${st} sao ${a}: tổng ≥ 10`);
    }
    for (const t of Object.values(T).flat()) { all++; if (/#\S/.test(t)) tagged++; }
  }
  for (const T of Object.values(MISTAKE_REVIEW)) for (const t of Object.values(T).flat()) { all++; if (/#\S/.test(t)) tagged++; }
  assert.ok(tagged / all >= 0.4, `hashtag ${tagged}/${all}`);
});

test("mistakeOf: thứ tự ưu tiên loại lỗi", () => {
  assert.equal(mistakeOf([]), null);
  assert.equal(mistakeOf(["slow", "sugarHigh"]), "sugar");
  assert.equal(mistakeOf(["iceLow", "toppingMissing"]), "topping");
  assert.equal(mistakeOf(["noLid", "baseWrong"]), "wrongDrink");
  assert.equal(mistakeOf(["swapped", "sugarLow"]), "swapped");
  assert.equal(mistakeOf(["wrongCustomer", "baseWrong"]), "wrongCustomer");
});

/** Ca ngày thường, lịch khách do test đặt, không drama tự mở. */
function day(guests, level = 3) {
  const s = shop(13);
  s.tutorialDone = true; s.day = 5; s.money = 999; s.xp = LEVELS[level - 1].xp; s.level = level;
  for (const id of STOCK_IDS) s.stock[id] = 8;
  act(s, { type: "startShift" });
  s.shift.drama.max = 0; s.shift.kitchen.ready = 8;
  s.shift.schedule = guests.map((g, i) => ({ at: 10 + i * 30, arch: g.arch || "hoc-sinh", name: g.name || "Khách " + i, items: g.items }));
  advance(s, 2800);
  return s;
}
const dao = (sugar = 50, ice = "vua") => ({ recipe: "tra-dao", sugar, ice });

test("quên đóng nắp: ly đủ 6 bước giao được, lỗi noLid, khách nói câu riêng, review từ bảng quên nắp", () => {
  const s = day([{ items: [dao()] }]);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  for (const [step, id] of stepsFor(c.order).slice(0, 5)) act(s, { type: "brew", step, id });
  assert.equal(err(s, { type: "serve", cid: c.id }), "not-sealed", "chưa đủ 6 bước thì chưa giao");
  act(s, { type: "brew", step: "topping", id: "none" });
  const r = act(s, { type: "serve", cid: c.id });
  const sv = r.events.find((e) => e.type === "served");
  assert.ok(sv.errors.includes("noLid"));
  const k = s.shift.customers[0];
  const rv = s.shift.reviews.at(-1);
  assert.ok(sv.stars <= 3, "quên nắp tối đa 3 sao");
  assert.equal(rv.reason, "noLid");
  assert.ok(rv.line.length > 10 && k.say.text.length > 10);
  assert.ok(s.shift.moments.some((m) => m.kind === "mistake" && m.id === "noLid"));
  assert.equal(s.shift.lastServe.mistake, "noLid");
});

test("giao nhầm khách: ly pha cho A (phiếu chuyển sang B) không khớp B ⇒ lỗi wrongCustomer, tối đa 2 sao", () => {
  const s = day([{ name: "A", items: [dao(50, "vua")] }, { name: "B", items: [{ recipe: "tra-sua-truyen-thong", sugar: 50, ice: "it" }] }]);
  const [a, b] = s.shift.customers;
  act(s, { type: "pin", cid: a.id });
  for (const [step, id] of stepsFor(a.order).slice(0, 3)) act(s, { type: "brew", step, id });
  act(s, { type: "pin", cid: b.id }); // chỉ một chỗ pha: ly dở theo phiếu sang B
  for (const [step, id] of stepsFor(a.order).slice(3)) act(s, { type: "brew", step, id });
  const r = act(s, { type: "serve", cid: b.id });
  assert.ok(r.result.complaint, "sai món nền nên khách khiếu nại");
  assert.ok(s.shift.dialog.errors.includes("wrongCustomer"));
  assert.equal(mistakeOf(s.shift.dialog.errors), "wrongCustomer");
  assert.ok(s.shift.dialog.line.length > 10);
});

test("đơn hai ly bị đổi chỗ: ly đúng nhưng ghép nhầm ô ⇒ lỗi swapped", () => {
  const s = day([{ arch: "van-phong", items: [dao(50, "vua"), dao(30, "it")] }]);
  const c = s.shift.customers[0];
  act(s, { type: "pin", cid: c.id });
  // ép ghép: pha ly 2 (30%) nhưng ô đang ghim là ly 1, ly 1 khác hẳn ly 2 chỉ ở đường + đá ⇒ bestItem vẫn chọn đúng ô.
  // Mô phỏng nhầm tên: đặt thẳng hai ly đã đóng nắp vào sai ô rồi chấm.
  const mk = (o) => ({ steps: stepsFor(o).map(([step, id]) => ({ step, id })), sealed: true, forCid: c.id });
  const k = s.shift.customers[0];
  k.filled = [mk(k.items[1].order), null];
  for (const [step, id] of stepsFor(k.items[0].order)) act(s, { type: "brew", step, id });
  const r = act(s, { type: "serve", cid: c.id });
  const sv = r.events.find((e) => e.type === "served");
  assert.ok(sv.errors.includes("swapped"), sv.errors.join(","));
  assert.equal(s.shift.lastServe.mistake, "swapped");
});

test("câu khách + review không lặp trong cùng ca (freshLine) khi còn câu khác", () => {
  const s = day(Array.from({ length: 4 }, (_, i) => ({ name: "K" + i, items: [dao(50, "vua")] })));
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const c = s.shift.customers.find((q) => q.phase === "wait");
    act(s, { type: "pin", cid: c.id });
    for (const [step, id] of stepsFor({ ...c.order, sugar: 0, ice: "khong" })) act(s, { type: "brew", step, id });
    act(s, { type: "serve", cid: c.id });
    lines.push(s.shift.reviews.at(-1).line, s.shift.customers.find((q) => q.id === c.id).say.text);
  }
  assert.equal(new Set(lines).size, lines.length, lines.join(" | "));
});

test("lỗi có thể lên mạng: có sự kiện reviewer quay lại lỗi (lastServe.mistake), chọn biến thành trend hoặc xin lỗi", () => {
  const viral = EVENTS.filter((e) => e.if?.lastServe?.mistake);
  assert.ok(viral.length >= 3, `${viral.length} sự kiện lỗi lên mạng`);
  assert.ok(viral.some((e) => e.nodes.start.choices.some((c) => c.fx?.buzz > 0 || c.fx?.followers > 0)), "có lựa chọn biến lỗi thành trend");
  assert.ok(viral.some((e) => e.nodes.start.choices.some((c) => c.fx?.rep > 0)), "có lựa chọn xin lỗi");
});
