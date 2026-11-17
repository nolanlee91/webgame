import test from "node:test";
import assert from "node:assert/strict";
import { newMatch, play, undo, nextRound, replay, winLine, canPlay, isAiTurn } from "../logic.js";
import { bestMove, candidates } from "../ai.js";

const seq = (s, moves) => moves.reduce((a, [r, c]) => { const n = play(a, r, c); assert.ok(n, `nước ${r},${c} phải hợp lệ`); return n; }, s);
function rng(seed) { return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); }

test("ván mới: bàn trống, X đi trước", () => {
  const s = newMatch();
  assert.equal(s.size, 15); assert.equal(s.board.length, 225); assert.equal(s.turn, 1); assert.equal(s.round, 1);
  assert.equal(newMatch({ size: 19 }).board.length, 361);
  assert.equal(newMatch({ size: 7 }).size, 15, "kích thước lạ → 15");
});

test("đặt quân luân phiên, không đặt đè, không sửa trạng thái cũ", () => {
  const s0 = newMatch();
  const s1 = play(s0, 7, 7);
  assert.equal(s1.board[7 * 15 + 7], 1); assert.equal(s1.turn, 2);
  assert.equal(s0.board[7 * 15 + 7], 0, "trạng thái cũ giữ nguyên");
  assert.equal(play(s1, 7, 7), null, "ô đã có quân");
  assert.equal(play(s1, -1, 3), null); assert.equal(play(s1, 15, 0), null); assert.equal(play(s1, 1.5, 0), null);
  assert.equal(play(s1, 0, 0).board[0], 2);
});

test("5 quân liên tiếp thắng — đủ 4 hướng", () => {
  const lines = {
    ngang: [[5, 3], [5, 4], [5, 5], [5, 6], [5, 7]],
    doc: [[2, 9], [3, 9], [4, 9], [5, 9], [6, 9]],
    cheo: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
    "chéo ngược": [[4, 10], [5, 9], [6, 8], [7, 7], [8, 6]],
  };
  for (const [name, xs] of Object.entries(lines)) {
    let s = newMatch();
    const os = [[14, 0], [14, 2], [14, 4], [14, 6]];
    for (let i = 0; i < 5; i++) {
      s = play(s, ...xs[i]);
      if (i < 4) { assert.equal(s.winner, 0, name); s = play(s, ...os[i]); }
    }
    assert.equal(s.winner, 1, name); assert.equal(s.line.length, 5, name); assert.equal(s.score[1], 1, name);
    assert.equal(play(s, 10, 10), null, "hết ván thì không đặt thêm");
  }
});

test("4 quân chưa thắng; 6 quân (nối hai đoạn) vẫn thắng", () => {
  let s = seq(newMatch(), [[7, 1], [0, 0], [7, 2], [0, 2], [7, 3], [0, 4], [7, 5], [0, 6], [7, 6], [0, 8]]);
  assert.equal(s.winner, 0, "X có 3 + 2, chưa đủ");
  s = play(s, 7, 4);
  assert.equal(s.winner, 1); assert.equal(s.line.length, 6);
});

test("luật chặn 2 đầu: bị chặn cả hai đầu thì không thắng; mép bàn không tính là chặn", () => {
  const m = newMatch({ rule: "block2" });
  // O chặn (3,0) và (3,6); X xếp (3,1)…(3,5)
  let s = seq(m, [[3, 1], [3, 0], [3, 2], [3, 6], [3, 3], [10, 10], [3, 4], [10, 12]]);
  s = play(s, 3, 5);
  assert.equal(s.winner, 0, "bị chặn 2 đầu");
  // Cùng thế cờ nhưng luật tự do → thắng
  let f = seq(newMatch(), [[3, 1], [3, 0], [3, 2], [3, 6], [3, 3], [10, 10], [3, 4], [10, 12]]);
  assert.equal(play(f, 3, 5).winner, 1);
  // Sát mép trái, chỉ bị chặn một đầu → thắng
  let e = seq(m, [[5, 0], [5, 5], [5, 1], [9, 9], [5, 2], [9, 11], [5, 3], [9, 13]]);
  assert.equal(play(e, 5, 4).winner, 1);
});

test("đi lại: bỏ nước cuối, trả lượt; không đi lại khi đã hết ván", () => {
  let s = seq(newMatch(), [[7, 7], [7, 8], [8, 8]]);
  const u = undo(s);
  assert.equal(u.moves.length, 2); assert.equal(u.board[8 * 15 + 8], 0); assert.equal(u.turn, 1);
  const u2 = undo(s, 2);
  assert.equal(u2.moves.length, 1); assert.equal(u2.turn, 2);
  assert.equal(undo(newMatch()), null, "bàn trống");
  const won = seq(newMatch(), [[0, 0], [5, 0], [0, 1], [5, 1], [0, 2], [5, 2], [0, 3], [5, 3], [0, 4]]);
  assert.equal(won.winner, 1); assert.equal(undo(won), null);
});

test("ván kế: giữ tỉ số, người thua đi trước; hòa thì đổi người đi trước", () => {
  const won = seq(newMatch(), [[0, 0], [5, 0], [0, 1], [5, 1], [0, 2], [5, 2], [0, 3], [5, 3], [0, 4]]);
  const n = nextRound(won);
  assert.equal(n.round, 2); assert.equal(n.first, 2); assert.equal(n.turn, 2); assert.deepEqual(n.score, { 1: 1, 2: 0, draw: 0 });
  assert.equal(n.moves.length, 0); assert.ok(n.board.every((v) => v === 0));
  const d = nextRound({ ...n, winner: 3 });
  assert.equal(d.first, 1);
});

test("bàn đầy không ai thắng → hòa", () => {
  // Mẫu tuần hoàn XXOO dịch 2 ô mỗi hàng: không hướng nào có quá 2 quân cùng màu liên tiếp.
  let s = newMatch();
  const n = 15, color = (r, c) => (Math.floor(((c + 2 * r) % 4) / 2) === 0 ? 1 : 2);
  const xs = [], os = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) (color(r, c) === 1 ? xs : os).push([r, c]);
  assert.equal(xs.length, 113); assert.equal(os.length, 112);
  for (let i = 0; i < n * n; i++) {
    s = play(s, ...(i % 2 === 0 ? xs[i >> 1] : os[i >> 1]));
    assert.ok(s); if (i < n * n - 1) assert.equal(s.winner, 0);
  }
  assert.equal(s.winner, 3); assert.equal(s.score.draw, 1);
});

test("dựng lại từ danh sách nước đi cho đúng trạng thái", () => {
  const s = seq(newMatch({ size: 19, rule: "block2" }), [[9, 9], [9, 10], [10, 10], [8, 8]]);
  const r = replay(s, s.moves);
  assert.deepEqual(r.board, s.board); assert.equal(r.turn, s.turn); assert.equal(r.size, 19); assert.equal(r.rule, "block2"); assert.equal(r.round, s.round);
  assert.equal(replay(s, [[0, 0], [0, 0]]), null, "nước trùng → lỗi");
});

test("máy: đi giữa bàn khi trống, chỉ xét ô gần quân", () => {
  const s = newMatch({ mode: "ai" });
  assert.deepEqual(bestMove(s), [7, 7]);
  const s1 = play(s, 0, 0);
  assert.ok(candidates(s1).every(([r, c]) => r <= 2 && c <= 2));
  assert.ok(isAiTurn(s1)); assert.ok(!isAiTurn(s));
});

test("máy: thắng ngay khi có thể, chặn nước thắng của người", () => {
  // O (máy) có 4 quân hàng 2, X có 4 quân hàng 7 → máy phải thắng chứ không chặn
  let s = seq(newMatch({ mode: "ai" }), [[7, 3], [2, 3], [7, 4], [2, 4], [7, 5], [2, 5], [7, 6], [2, 6], [12, 12]]);
  const w = bestMove(s, "hard");
  assert.ok([[2, 2], [2, 7]].some((m) => m[0] === w[0] && m[1] === w[1]), "máy thắng: " + w);
  for (const lv of ["hard", "easy"]) {
    let t = seq(newMatch({ mode: "ai" }), [[7, 3], [2, 3], [7, 4], [12, 4], [7, 5], [12, 8], [7, 6]]);
    const b = bestMove(t, lv, rng(3));
    assert.ok([[7, 2], [7, 7]].some((m) => m[0] === b[0] && m[1] === b[1]), lv + " chặn: " + b);
  }
});

test("máy (khó) chặn thế ba mở", () => {
  const s = seq(newMatch({ mode: "ai" }), [[7, 5], [0, 14], [7, 6], [1, 14], [7, 7]]);
  const b = bestMove(s, "hard");
  assert.equal(b[0], 7); assert.ok([4, 8, 9, 3].includes(b[1]), "chặn ở hàng 7: " + b);
});

test("máy tự chơi với máy: luôn đi nước hợp lệ đến hết ván, đủ nhanh", () => {
  for (let k = 0; k < 6; k++) {
    let s = newMatch({ mode: "ai", size: k % 2 ? 19 : 15 }), r = rng(k + 1);
    const t0 = Date.now();
    while (!s.winner) {
      const mv = bestMove(s, k % 3 ? "hard" : "easy", r);
      assert.ok(mv && canPlay(s, mv[0], mv[1]));
      s = play(s, mv[0], mv[1]);
    }
    assert.ok(s.winner >= 1); assert.ok((Date.now() - t0) / s.moves.length < 60, "mỗi nước < 60ms");
    if (s.winner !== 3) assert.ok(winLine(s, s.line[0][0], s.line[0][1]));
  }
});
