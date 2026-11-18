import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";
import { bestMove } from "../ai.js";

const sq = (name) => { // "e0" kiểu toạ độ: cột a–i trái→phải, hàng 0 dưới cùng (phía Đỏ) → 9 trên cùng
  const c = name.charCodeAt(0) - 97, r = 9 - Number(name.slice(1));
  return r * 9 + c;
};
const from = (fen, turn = 1) => {
  const board = L.parse(fen);
  return { ...L.newMatch(), board, turn, keys: [L.key(board, turn)] };
};
const dests = (s, a) => L.legalFrom(s.board, sq(a)).sort((x, y) => x - y);
const set = (...names) => names.map(sq).sort((x, y) => x - y);

test("thế khởi đầu: Đỏ có 44 nước, Đen cũng 44", () => {
  const s = L.newMatch();
  assert.equal(L.legalMoves(s.board, 1).length, 44);
  assert.equal(L.legalMoves(s.board, 2).length, 44);
  assert.equal(L.toFen(s.board), L.START);
});

test("Pháo đi thẳng không ăn được, ăn phải nhảy qua đúng 1 ngòi", () => {
  const s = L.newMatch();
  const d = dests(s, "b2");
  assert.ok(d.includes(sq("b9")), "pháo b2 ăn mã b9 qua ngòi pháo b7");
  assert.ok(!d.includes(sq("b7")), "không ăn thẳng pháo b7 khi không có ngòi");
  assert.ok(d.includes(sq("e2")) && d.includes(sq("b6")));
});

test("Mã bị cản chân", () => {
  const s = L.newMatch(); // mã b0: chân b1 trống → a2, c2; chân c0 có tượng → không đi d1
  assert.deepEqual(dests(s, "b0"), set("a2", "c2"));
});

test("Tượng không qua sông, bị cản mắt; Sĩ, Tướng ở trong cung", () => {
  const s = from("4k4/9/9/9/9/2B6/9/9/4A4/4K4");
  assert.deepEqual(dests(s, "c4"), set("a2", "e2"), "tượng ở c4 không lên e6/a6 (qua sông)");
  const s2 = from("3k5/9/9/9/9/9/9/4B4/3P5/4K4");
  assert.deepEqual(dests(s2, "e2"), set("c4", "g4", "g0"), "mắt tượng d1 bị tốt cản → không xuống c0");
  const s3 = L.newMatch();
  assert.deepEqual(dests(s3, "e0"), set("e1"));
  assert.deepEqual(dests(s3, "d0"), set("e1"));
});

test("Tốt chưa qua sông chỉ đi thẳng, qua sông đi ngang được, không lùi", () => {
  const s = from("4k4/9/9/9/2P6/9/4P4/9/9/4K4");
  assert.deepEqual(dests(s, "e3"), set("e4"));
  assert.deepEqual(dests(s, "c5"), set("c6", "b5", "d5"));
});

test("Không được để hai Tướng đối mặt", () => {
  const s = from("3k5/9/9/9/9/9/9/9/9/4K4");
  assert.ok(!dests(s, "e0").includes(sq("d0")), "Tướng đỏ sang cột d sẽ đối mặt tướng đen");
  const s2 = from("4k4/9/9/9/9/9/9/9/4R4/4K4"); // xe e1 đứng chắn giữa hai tướng: chỉ được đi trên cột e
  assert.ok(dests(s2, "e1").every((k) => k % 9 === 4));
});

test("Chiếu bí → bên bị bí thua", () => {
  // Hai xe đỏ: xe a8 chặn hàng 8, xe đi a9 chiếu hết.
  let s = from("4k4/R8/9/9/9/9/9/9/9/R3K4");
  s = L.play(s, sq("a0"), sq("a9")); // xe a0 → a9? a-file bị xe a8 chắn → không hợp lệ
  assert.equal(s, null);
  s = from("3k5/R8/9/9/9/9/9/9/9/1R2K4");
  s = L.play(s, sq("b0"), sq("b9"));
  assert.ok(s && s.winner === 1 && s.reason === "checkmate", JSON.stringify(s && [s.winner, s.reason]));
});

test("Hết nước đi (không bị chiếu) cũng là thua", () => {
  // Tướng đen d9 bị xe d.. không chiếu nhưng mọi ô đều bị khống chế; đen chỉ còn tướng.
  let s = from("3k5/9/4R4/9/9/9/9/9/9/5K3");
  s = L.play(s, sq("e7"), sq("e8"));
  assert.ok(s, "nước đi hợp lệ");
  // d9: d8 bị xe e8? xe ở e8 khống chế hàng 8 (d8) và cột e (e9); tướng đỏ ở f0 khống chế cột f — không có f.
  assert.equal(s.check, false);
  assert.equal(s.winner, 1);
  assert.equal(s.reason, "stalemate");
});

test("Chiếu mãi lặp thế 3 lần → bên chiếu thua; lặp không chiếu → hòa", () => {
  // Xe đỏ chiếu qua lại, tướng đen chạy qua lại.
  let s = from("4k4/9/9/9/9/9/9/9/9/R2K5");
  const seq = [["a0", "a9"], ["e9", "e8"], ["a9", "a8"], ["e8", "e9"], ["a8", "a9"], ["e9", "e8"], ["a9", "a8"], ["e8", "e9"], ["a8", "a9"]];
  for (const [a, b] of seq) { assert.ok(!s.winner, "chưa kết thúc trước " + a + b); s = L.play(s, sq(a), sq(b)); assert.ok(s, a + b); }
  assert.equal(s.winner, 2); assert.equal(s.reason, "perpetual");

  let t = from("4k4/9/9/9/9/9/9/9/9/R4K3");
  const q = [["a0", "a1"], ["e9", "d9"], ["a1", "a0"], ["d9", "e9"], ["a0", "a1"], ["e9", "d9"], ["a1", "a0"], ["d9", "e9"]];
  for (const [a, b] of q) { assert.ok(!t.winner); t = L.play(t, sq(a), sq(b)); assert.ok(t, a + b); }
  assert.equal(t.winner, 3); assert.equal(t.reason, "repetition");
});

test("Hết quân tấn công cả hai bên → hòa", () => {
  let s = from("3k5/4a4/9/9/9/9/9/9/4r4/3AK4", 1);
  s = L.play(s, sq("e0"), sq("e1")); // tướng ăn xe
  assert.equal(s.winner, 3); assert.equal(s.reason, "material");
});

test("Không đi được quân bên kia / khi chưa tới lượt / ô ngoài bàn", () => {
  const s = L.newMatch();
  assert.equal(L.play(s, sq("b7"), sq("e7")), null);
  assert.equal(L.play(s, -1, 3), null);
  assert.equal(L.play(s, 1.5, 3), null);
  assert.equal(L.play(s, sq("b2"), sq("b2")), null);
});

test("replay + undo dựng lại đúng ván", () => {
  let s = L.newMatch();
  for (const [a, b] of [["b2", "e2"], ["h7", "e7"], ["b0", "c2"], ["b9", "c7"]]) s = L.play(s, sq(a), sq(b));
  const r = L.replay(s, s.moves);
  assert.equal(L.toFen(r.board), L.toFen(s.board));
  const u = L.undo(s, 2);
  assert.equal(u.moves.length, 2); assert.equal(u.turn, 1);
  assert.equal(L.replay(s, [[sq("b2"), sq("b9")], [sq("a0"), sq("a5")]]), null);
});

test("xin thua / hòa", () => {
  const s = L.newMatch();
  const r = L.resign(s, 1); assert.equal(r.winner, 2); assert.equal(r.score[2], 1);
  const d = L.agreeDraw(s); assert.equal(d.winner, 3); assert.equal(d.score.draw, 1);
  assert.equal(L.resign(r, 2), null);
});

test("máy: luôn ăn chiếu bí khi có, nước đi luôn hợp lệ, đủ nhanh", () => {
  const s = from("3k5/R8/9/9/9/9/9/9/9/1R2K4");
  for (const lv of ["easy", "normal"]) { const mv = bestMove(s, lv, () => 0.5); assert.equal(L.play(s, mv[0], mv[1])?.winner, 1, lv + " phải chọn nước thắng ngay"); }
  let g = L.newMatch({ mode: "ai" });
  const t0 = Date.now();
  for (let i = 0; i < 30 && !g.winner; i++) {
    const mv = bestMove(g, i % 2 ? "normal" : "easy", () => 0.3);
    const n = L.play(g, mv[0], mv[1]); assert.ok(n, "nước máy hợp lệ"); g = n;
  }
  const ms = (Date.now() - t0) / 30;
  assert.ok(ms < 1500, "trung bình " + ms.toFixed(0) + " ms/nước");
});

test("tên nước đi", () => {
  const s = L.newMatch();
  assert.equal(L.moveName(s.board, sq("b2"), sq("e2")), "Pháo 8-5");
  assert.equal(L.moveName(s.board, sq("h0"), sq("g2")), "Mã 2↑3");
});
