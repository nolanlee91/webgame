// Kiểm thử luật Cờ Vua: perft (số nút chuẩn quốc tế) + từng luật đặc biệt + bot.
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";
import * as A from "../ai.js";

const sq = (n) => (8 - +n[1]) * 8 + L.FILES.indexOf(n[0]);
const mv = (a, b, promo) => ({ from: sq(a), to: sq(b), promo });
const go = (s, ...list) => { for (const x of list) { const [a, b, p] = x.split(/[-=]/); s = L.play(s, mv(a, b, p)); assert.ok(s, "nước hợp lệ " + x); } return s; };

test("perft thế xuất phát", () => {
  const s = L.newMatch();
  assert.equal(L.perft(s, 1), 20);
  assert.equal(L.perft(s, 2), 400);
  assert.equal(L.perft(s, 3), 8902);
});
test("perft Kiwipete (nhập thành, qua đường, phong cấp)", () => {
  const s = L.fromFen("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");
  assert.equal(L.perft(s, 1), 48);
  assert.equal(L.perft(s, 2), 2039);
  assert.equal(L.perft(s, 3), 97862);
});
test("perft thế 3, 4, 5", () => {
  assert.equal(L.perft(L.fromFen("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"), 4), 43238);
  assert.equal(L.perft(L.fromFen("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"), 3), 9467);
  assert.equal(L.perft(L.fromFen("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"), 3), 62379);
});
test("chiếu bí nhanh (Fool's mate) → Đen thắng, tỉ số cộng cho người cầm Đen", () => {
  const s = go(L.newMatch(), "f2-f3", "e7-e5", "g2-g4", "d8-h4");
  assert.deepEqual(s.result, { winner: "b", reason: "mate" });
  assert.equal(s.moves.at(-1).san, "Qh4#");
  assert.deepEqual(s.score, [0, 1]);
  assert.equal(L.play(s, mv("a2", "a3")), null);
});
test("hết nước đi (stalemate) → hòa", () => {
  const t = L.fromFen("7k/8/5QK1/8/8/8/8/8 w - - 0 1");
  const u = go(t, "f6-f7");
  assert.deepEqual(u.result, { winner: null, reason: "stalemate" });
});
test("nhập thành: hợp lệ, dời Xe, mất quyền khi Vua đi / bị chiếu / đi qua ô bị đánh", () => {
  let s = L.fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  const n = go(s, "e1-g1");
  assert.equal(n.board[sq("f1")], "R"); assert.equal(n.board[sq("h1")], ""); assert.equal(n.moves[0].san, "O-O");
  assert.equal(n.castle, "kq");
  const q = go(s, "e1-c1"); assert.equal(q.board[sq("d1")], "R"); assert.equal(q.moves[0].san, "O-O-O");
  // ô f1 bị Xe đen khống chế → không nhập thành cánh Vua
  s = L.fromFen("r3kr2/8/8/8/8/8/8/R3K2R w KQq - 0 1");
  assert.equal(L.play(s, mv("e1", "g1")), null);
  assert.ok(L.play(s, mv("e1", "c1")));
  // đang bị chiếu → không nhập thành
  s = L.fromFen("r3k3/8/8/8/8/8/8/R3K2r w Qq - 0 1");
  assert.equal(L.play(s, mv("e1", "c1")), null);
  // Xe bị ăn mất → mất quyền
  s = go(L.fromFen("r3k2r/8/8/8/8/8/6b1/R3K2R b KQkq - 0 1"), "g2-h1");
  assert.equal(s.castle, "Qkq");
});
test("bắt tốt qua đường chỉ ngay nước sau", () => {
  let s = go(L.newMatch(), "e2-e4", "a7-a6", "e4-e5", "d7-d5");
  const t = go(s, "e5-d6");
  assert.equal(t.board[sq("d5")], ""); assert.equal(t.moves.at(-1).san, "exd6"); assert.equal(t.moves.at(-1).cap, "p");
  s = go(s, "a2-a3", "a6-a5");
  assert.equal(L.play(s, mv("e5", "d6")), null);
});
test("phong cấp: bắt buộc chọn quân, chọn được Mã", () => {
  const s = L.fromFen("8/P6k/8/8/8/8/8/K7 w - - 0 1");
  assert.equal(L.play(s, mv("a7", "a8")), null);
  assert.equal(L.play(s, mv("a7", "a8", "k")), null);
  const n = L.play(s, mv("a7", "a8", "n"));
  assert.equal(n.board[0], "N"); assert.equal(n.moves[0].san, "a8=N");
  assert.equal(L.play(L.fromFen("8/7k/8/8/8/8/P7/K7 w - - 0 1"), mv("a2", "a3", "q")), null);
});
test("không được để Vua mình bị chiếu (quân bị ghim)", () => {
  const s = L.fromFen("4k3/4r3/8/8/8/8/4B3/4K3 w - - 0 1");
  assert.equal(L.play(s, mv("e2", "d3")), null);
  assert.equal(L.legalMoves(s, sq("e2")).length, 0);
});
test("hòa: không đủ quân, 50 nước, lặp 3 lần", () => {
  assert.deepEqual(go(L.fromFen("8/8/8/8/3k4/8/1r6/K7 w - - 0 1"), "a1-b2").result, { winner: null, reason: "material" });
  assert.deepEqual(go(L.fromFen("8/8/8/8/8/2k5/8/K6R w - - 99 80"), "h1-h2").result, { winner: null, reason: "fifty" });
  const s = go(L.newMatch(), "g1-f3", "g8-f6", "f3-g1", "f6-g8", "g1-f3", "g8-f6", "f3-g1");
  assert.equal(s.result, null);
  assert.deepEqual(go(s, "f6-g8").result, { winner: null, reason: "repeat" });
  assert.ok(L.insufficient(L.fromFen("8/8/8/8/8/2k1b3/8/KB6 w - - 0 1").board) === false);
  assert.ok(L.insufficient(L.fromFen("8/8/8/8/8/2kb4/8/KB6 w - - 0 1").board));
});
test("lặp 3 lần: ô qua đường chỉ tính khi bắt qua đường thật sự hợp lệ (Tốt bị ghim thì không)", () => {
  // Tốt e5 bị Xe e8 ghim vào Vua e1 → exd6 không hợp lệ → thế đầu và thế lặp là một
  const s0 = L.fromFen("k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
  assert.equal(L.legalMoves(s0).some((m) => m.to === sq("d6")), false);
  const s = go(s0, "e1-f1", "a8-b8", "f1-e1", "b8-a8", "e1-f1", "a8-b8", "f1-e1");
  assert.equal(s.result, null);
  assert.deepEqual(go(s, "b8-a8").result, { winner: null, reason: "repeat" });
  // bắt qua đường hợp lệ → ô qua đường vẫn được tính trong khóa
  const t = L.fromFen("k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
  assert.notEqual(L.posKey(t), L.posKey({ ...t, ep: -1 }));
});
test("SAN phân biệt quân cùng loại", () => {
  const s = L.fromFen("4k3/8/8/8/8/8/8/R4R1K w - - 0 1");
  assert.equal(go(s, "a1-d1").moves[0].san, "Rad1");
});
test("ván sau đổi màu, giữ tỉ số; hoàn tác; replay", () => {
  let s = go(L.newMatch(), "f2-f3", "e7-e5", "g2-g4", "d8-h4");
  const n = L.nextRound(s);
  assert.equal(n.white, 1); assert.deepEqual(n.score, [0, 1]); assert.equal(n.round, 2);
  const t = go(L.newMatch(), "e2-e4", "e7-e5");
  const u = L.undo(t, 1);
  assert.equal(u.moves.length, 1); assert.equal(u.turn, "b");
  const r = L.replay(L.newMatch(), t.moves);
  assert.equal(L.posKey(r), L.posKey(t));
  assert.equal(L.replay(L.newMatch(), [{ from: 0, to: 63 }]), null);
});
test("xin thua / hòa thỏa thuận", () => {
  const s = L.newMatch();
  assert.deepEqual(L.resign(s, "w").result, { winner: "b", reason: "resign" });
  assert.deepEqual(L.resign(s, "w").score, [0, 1]);
  assert.equal(L.agreeDraw(s).draws, 1);
});
test("nước đi rác bị từ chối", () => {
  const s = L.newMatch();
  for (const bad of [null, {}, { from: -1, to: 3 }, { from: 52, to: 64 }, { from: 52.5, to: 36 }, { from: "52", to: "36" }, { from: 52, to: 36, promo: "q" }, { from: 12, to: 28 }])
    assert.equal(L.play(s, bad), null, JSON.stringify(bad));
});
test("bot luôn ra nước hợp lệ, bắt được chiếu bí 1 nước ở mức thường/khó", () => {
  let s = L.newMatch({ mode: "ai" });
  for (let k = 0; k < 40 && !s.result; k++) { const m = A.bestMove(s, k % 2 ? "easy" : "normal"); const n = L.play(s, m); assert.ok(n); s = n; }
  const mate = L.fromFen("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
  for (const lv of ["normal", "hard"]) { const m = A.bestMove(mate, lv); assert.deepEqual([m.from, m.to], [sq("a1"), sq("a8")]); }
  // ăn Hậu treo
  const hang = L.fromFen("4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1");
  const m = A.bestMove(hang, "normal"); assert.deepEqual([m.from, m.to], [sq("d1"), sq("d5")]);
});
