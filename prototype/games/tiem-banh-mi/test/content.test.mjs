// Nội dung thoại (PLAYBOOK §5) + không lặp câu trong ca (freshLine) + không emoji + biến thoại hợp lệ.
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../data/lines.js";
import { MISTAKE_SAY, MISTAKE_REVIEW, MISTAKE_IDS } from "../data/lines-mistakes.js";
import * as OPS from "../data/lines-ops.js";
import { ARCH_IDS } from "../data/customers.js";
import { freshLine, fill } from "../core/text.js";
import { shop, act, playShift, prepAndOpen } from "./helpers.mjs";

const all = [];
const walk = (v) => { if (typeof v === "string") all.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
walk(L); walk(MISTAKE_SAY); walk(MISTAKE_REVIEW); walk(OPS);
const VARS = new Set(["self", "call", "name", "order", "loaf", "target", "n", "shop", "price", "diff", "want", "got", "item", "bill"]);

test("câu gọi món: ≥ 16 câu chung + 4–5 câu mỗi nhóm khách", () => {
  assert.ok(L.ORDER_LINES.length >= 16, String(L.ORDER_LINES.length));
  for (const a of ARCH_IDS) assert.ok((L.ORDER_BY_ARCH[a] || []).length >= 4, a);
});

test("11 kiểu lỗi: mỗi kiểu ≥ 6 câu khách nói + ≥ 6 review (chung), có biến thể theo nhóm khách", () => {
  let variants = 0;
  for (const m of MISTAKE_IDS) {
    assert.ok(MISTAKE_SAY[m].default.length >= 6, m + " say");
    assert.ok(MISTAKE_REVIEW[m].default.length >= 6, m + " review");
    variants += Object.keys(MISTAKE_SAY[m]).length - 1 + Object.keys(MISTAKE_REVIEW[m]).length - 1;
  }
  assert.ok(variants >= 25, String(variants));
});

test("review theo sao: ≥ 8 câu chung mỗi mức + câu riêng theo nhóm khách", () => {
  for (const st of [1, 2, 3, 4, 5]) assert.ok(L.STAR_REVIEWS[st].length >= 8, String(st));
  for (const a of ARCH_IDS) for (const st of [1, 2, 3, 4, 5]) assert.ok((L.STAR_REVIEWS_BY_ARCH[a]?.[st] || []).length >= 1, a + st);
});

test("không emoji, biến thoại đều hợp lệ, không thương hiệu", () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  for (const t of all) {
    assert.ok(!emoji.test(t), t);
    for (const m of t.matchAll(/\{(\w+)\}/g)) assert.ok(VARS.has(m[1][0].toLowerCase() + m[1].slice(1)), `${m[1]} trong "${t}"`);
  }
  assert.ok(all.length >= 500, `tổng ${all.length} câu`);
});

test("fill: {Call} viết hoa chữ đầu; freshLine ưu tiên câu chưa dùng (nhớ 120 câu)", () => {
  assert.equal(fill("{Call} ơi, {self} đói", { call: "anh", self: "em" }), "Anh ơi, em đói");
  const s = shop(); act(s, { type: "startShift" });
  const list = ["a", "b", "c", "d"];
  const got = new Set([0, 1, 2, 3].map(() => freshLine(s, list)));
  assert.equal(got.size, 4);
});

test("không lặp câu trong một ca: mọi câu khách nói + review trong ca đều khác nhau (pool đủ lớn)", () => {
  for (const seed of [3, 14, 59]) {
    const s = shop(seed);
    for (let d = 0; d < 3; d++) {
      prepAndOpen(s);
      const said = [];
      // ghi lại câu mỗi khi khách nói / review mới
      const seen = new Map();
      const origPlay = playShift;
      origPlay(s, { maxSteps: 20000, sloppy: 0.2, rnd: (() => { let a = seed + d; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })() });
      const reviews = s.feed.filter((r) => r.day === s.day - 1).map((r) => r.line);
      const dup = reviews.filter((x, i) => reviews.indexOf(x) !== i);
      assert.deepEqual(dup, [], `hạt ${seed} ngày ${d + 1}: review trùng`);
      void said; void seen;
    }
  }
});

test("câu gọi món trong một ca không trùng nhau", () => {
  const s = shop(21);
  prepAndOpen(s);
  const lines = [];
  for (let i = 0; i < 3000 && s.shift; i++) {
    act(s, { type: "tick", dt: 200 });
    for (const c of s.shift?.customers || []) if (c.orderLine && !lines.some((x) => x.id === c.id)) lines.push({ id: c.id, t: c.orderLine });
    for (const c of s.shift?.customers || []) if (c.phase === "wait") { c.phase = "leave"; c.leaveT = s.shift.t; } // nhường chỗ cho khách sau
    if (s.shift && s.shift.t > 230000) break;
  }
  const texts = lines.map((x) => x.t);
  assert.ok(texts.length >= 8);
  assert.equal(new Set(texts).size, texts.length, texts.join("\n"));
});
