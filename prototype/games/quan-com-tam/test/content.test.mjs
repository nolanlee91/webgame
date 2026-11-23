// Nội dung thoại: đủ khối lượng (PLAYBOOK §5), không emoji, biến điền đủ, freshLine không lặp trong ca; ca bot không lặp câu nào.
import test from "node:test";
import assert from "node:assert/strict";
import { ORDER, ARRIVE, TEA_CALL, BILL_CALL, HAPPY, TIMEOUT, pool } from "../data/lines.js?v=c3";
import * as L from "../data/lines.js?v=c3";
import { MISTAKE_SAY, MISTAKE_REVIEW } from "../data/lines-mistakes.js?v=c3";
import { REVIEWS, TIMEOUT_REVIEW } from "../data/lines-reviews.js?v=c3";
import { ARCHETYPES, ROLES } from "../data/customers.js?v=c3";
import { MISTAKE_IDS } from "../core/score.js?v=c3";
import { freshLine, fill } from "../core/text.js?v=c3";
import { newGame, prepDay, seeded, must, botStep } from "./helpers.mjs";

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const all = [];
const walk = (v) => { if (typeof v === "string") all.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
walk(L); walk(MISTAKE_SAY); walk(MISTAKE_REVIEW); walk(REVIEWS); walk(TIMEOUT_REVIEW);

test("13 vai sprite (11 khách + cô chủ + phụ bàn), mỗi khách có xưng hô, kiên nhẫn, tên", () => {
  assert.equal(ROLES.length, 13);
  assert.equal(Object.keys(ARCHETYPES).length, 11);
  for (const [id, A] of Object.entries(ARCHETYPES)) assert.ok(A.self && A.call && A.patience > 0 && A.names.length, id);
});

test("câu gọi món: 16+ câu chung, 4–5 câu mỗi vai khách", () => {
  assert.ok(ORDER.default.length >= 16);
  for (const r of Object.keys(ARCHETYPES)) assert.ok((ORDER[r] || []).length >= 4, r);
});

test("13 kiểu lỗi: mỗi kiểu ≥ 6 câu khách nói + ≥ 6 câu review, có biến thể theo vai", () => {
  for (const m of MISTAKE_IDS) {
    assert.ok(MISTAKE_SAY[m]?.default.length >= 6, "say " + m);
    assert.ok(MISTAKE_REVIEW[m]?.default.length >= 6, "review " + m);
    assert.ok(Object.keys(MISTAKE_SAY[m]).length >= 2 && Object.keys(MISTAKE_REVIEW[m]).length >= 1, "biến thể " + m);
  }
  for (const st of [1, 2, 3, 4, 5]) assert.ok(REVIEWS[st].default.length >= 6, "review " + st + " sao");
});

test("không emoji; mọi biến điền được bằng xưng hô của khách; không còn {…} sót", () => {
  assert.ok(all.length > 350, `tổng ${all.length} câu`);
  for (const t of all) assert.ok(!EMOJI.test(t), t);
  const ctx = { self: "em", call: "chị", name: "Tèo", n: 2, dish: "cơm sườn", quirks: ", thêm cơm", table: "1", mistake: "quên mỡ hành" };
  for (const t of all) assert.ok(!/\{\w+\}/.test(fill(t, ctx)), t);
  assert.equal(fill("{Call} ơi", { call: "chị" }), "Chị ơi");
});

test("freshLine không lặp tới khi pool cạn", () => {
  const s = newGame(51);
  const list = pool(ORDER, "worker");
  const seen = new Set();
  for (let i = 0; i < list.length; i++) seen.add(freshLine(s, list, { self: "chú", call: "cô", dish: "x", quirks: "" }));
  assert.equal(seen.size, list.length);
});

test("một ca bot: không câu thoại nào của khách lặp lại (bong bóng + review)", () => {
  for (const seed of [1, 5, 9]) {
    const s = newGame(seed); s.tutorialDone = true;
    prepDay(s);
    must(s, { type: "startShift" });
    const said = new Map(), rnd = seeded(seed);
    for (let t = 0; s.shift && t < 600000; t += 200) {
      botStep(s, "good", rnd);
      if (!s.shift) break;
      for (const g of s.shift.groups) if (g.say) said.set(`${g.id}@${g.say.at}`, g.say.text);
      if (!s.shift.dialog) must(s, { type: "tick", dt: 200 });
    }
    const texts = [...said.values()];
    const dup = texts.filter((x, i) => texts.indexOf(x) !== i);
    assert.ok(texts.length > 15, `seed ${seed}: ${texts.length} câu`);
    assert.deepEqual(dup, [], `seed ${seed} lặp: ${dup.join(" | ")}`);
    const reviews = s.feed.map((r) => r.line);
    assert.equal(new Set(reviews).size, reviews.length, "review không lặp");
  }
});
