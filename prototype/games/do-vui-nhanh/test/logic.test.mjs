// Chạy: node --test test/logic.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

test("bộ câu hỏi: đủ số lượng, mỗi chủ đề ≥ 10 câu, 4 đáp án khác nhau, không trùng câu", () => {
  assert.ok(L.QUESTIONS.length >= 50 && L.QUESTIONS.length <= 100, "số câu " + L.QUESTIONS.length);
  for (const c of L.CATS) assert.ok(L.QUESTIONS.filter((q) => q.cat === c.id).length >= L.ROUND_LEN, c.id);
  const seen = new Set();
  for (const q of L.QUESTIONS) {
    assert.ok(L.CATS.some((c) => c.id === q.cat), "chủ đề lạ " + q.cat);
    assert.equal(q.a.length, 4, q.q);
    assert.equal(new Set(q.a.map((x) => x.toLowerCase())).size, 4, "đáp án trùng: " + q.q);
    assert.ok(!seen.has(q.q), "câu trùng: " + q.q); seen.add(q.q);
  }
});

test("ván mới: 10 câu không lặp, đáp án được xáo nhưng đáp án đúng giữ nguyên nội dung, cùng seed ra cùng ván", () => {
  const s = L.newRound({ seed: 42 });
  assert.equal(s.qs.length, 10);
  assert.equal(new Set(s.qs.map((q) => q.id)).size, 10);
  for (const q of s.qs) assert.equal(q.opts[q.correct], L.QUESTIONS[q.id].a[0]);
  assert.deepEqual(L.newRound({ seed: 42 }).qs, s.qs);
  const pos = new Set(); for (let k = 1; k < 30; k++) for (const q of L.newRound({ seed: k }).qs) pos.add(q.correct);
  assert.equal(pos.size, 4, "đáp án đúng nằm ở đủ 4 vị trí");
});

test("chọn chủ đề: chỉ ra câu chủ đề đó; câu đã gặp gần đây bị đẩy xuống cuối", () => {
  const s = L.newRound({ seed: 3, cat: "tieng-anh" });
  assert.ok(s.qs.every((q) => q.cat === "tieng-anh"));
  const pool = L.QUESTIONS.map((q, i) => i).filter((i) => L.QUESTIONS[i].cat === "do-meo");
  const recent = pool.slice(0, pool.length - 10);
  const t = L.newRound({ seed: 5, cat: "do-meo", recent });
  assert.deepEqual(new Set(t.qs.map((q) => q.id)), new Set(pool.slice(pool.length - 10)));
});

test("chế độ Tất cả: không có 3 câu cùng chủ đề liền nhau (khi đổi chỗ được)", () => {
  for (let k = 1; k < 60; k++) {
    const qs = L.newRound({ seed: k }).qs;
    for (let i = 2; i < qs.length; i++) {
      const triple = qs[i].cat === qs[i - 1].cat && qs[i].cat === qs[i - 2].cat;
      if (triple) assert.ok(qs.slice(i + 1).every((q) => q.cat === qs[i].cat), "seed " + k);
    }
  }
});

test("chấm điểm: đúng nhanh nhiều điểm hơn, chuỗi cộng thưởng, Siêu tốc × 1,5, sai/hết giờ mất chuỗi", () => {
  assert.deepEqual(L.scoreFor(0, 15000, 1), { base: 100, speed: 100, bonus: 0, total: 200 });
  assert.equal(L.scoreFor(15000, 15000, 1).total, 100);
  assert.equal(L.scoreFor(7500, 15000, 1).total, 150);
  assert.equal(L.scoreFor(0, 15000, 3).bonus, 50);
  assert.equal(L.scoreFor(0, 15000, 20).bonus, 100);
  assert.equal(L.scoreFor(0, 8000, 1, 1.5).total, 300);

  const s = L.newRound({ seed: 9 });
  let r = L.answer(s, s.qs[0].correct, 3000);
  assert.ok(r.ok); assert.equal(s.streak, 1); assert.equal(s.score, 180);
  assert.equal(L.answer(s, 0, 0), null, "không trả lời 2 lần một câu");
  L.next(s);
  r = L.answer(s, s.qs[1].correct, 0); assert.equal(r.pts, 225); assert.equal(s.streak, 2);
  L.next(s);
  r = L.answer(s, (s.qs[2].correct + 1) % 4, 1000); assert.equal(r.ok, false); assert.equal(s.streak, 0); assert.equal(s.score, 405);
  L.next(s);
  r = L.answer(s, -1, 99999); assert.ok(r.timeout); assert.equal(r.ms, 15000); assert.equal(s.streak, 0);
  assert.equal(s.bestStreak, 2); assert.equal(s.correct, 2);
});

test("dữ liệu lạ bị từ chối; 50:50 bỏ đúng 2 đáp án sai, 1 lần mỗi ván, không chọn được đáp án đã bỏ", () => {
  const s = L.newRound({ seed: 11 });
  for (const bad of [4, -2, 1.5, "0", null]) assert.equal(L.answer(s, bad, 0), null);
  const hid = L.fifty(s, () => 0.5);
  assert.equal(hid.length, 2); assert.ok(!hid.includes(s.qs[0].correct));
  assert.equal(L.fifty(s), null, "chỉ 1 lần");
  assert.equal(L.answer(s, hid[0], 0), null);
  assert.ok(L.answer(s, s.qs[0].correct, 0).ok);
  L.next(s); assert.deepEqual(s.hidden, []);
});

test("hết 10 câu ⇒ kết thúc; danh hiệu theo số câu đúng", () => {
  const s = L.newRound({ seed: 2 });
  for (let i = 0; i < 10; i++) { assert.equal(s.status, "play"); L.answer(s, s.qs[i].correct, 0); assert.equal(L.next(s), true); }
  assert.equal(s.status, "over"); assert.equal(s.correct, 10);
  assert.equal(L.answer(s, 0, 0), null); assert.equal(L.next(s), false);
  assert.equal(L.rank(10), "Thánh Đố Vui"); assert.equal(L.rank(8), "Cao Thủ"); assert.equal(L.rank(0), "Cố Lên");
});
