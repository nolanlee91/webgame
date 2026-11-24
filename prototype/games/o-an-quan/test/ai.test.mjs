// Test máy chơi Ô Ăn Quan: luôn đi nước hợp lệ, đủ nhanh cho điện thoại, Khó thắng Dễ.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";
import { bestMove } from "../ai.js";

const rngOf = (seed) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

function playGame(lv, { quanNon = false, first = 0, rng, timeMs } = {}) {
  let s = L.newMatch({ quanNon, first });
  let maxMs = 0;
  while (!L.isOver(s)) {
    const t0 = performance.now();
    const m = bestMove(s, lv[s.turn], { rng, timeMs });
    maxMs = Math.max(maxMs, performance.now() - t0);
    assert.ok(m && L.canPlay(s, m[0], m[1]), `${lv[s.turn]} đi nước không hợp lệ ${JSON.stringify(m)}`);
    s = L.play(s, m[0], m[1]);
  }
  return { s, maxMs };
}

test("cả 3 mức luôn đi nước hợp lệ (nhiều thế cờ ngẫu nhiên, cả quan non)", () => {
  const rng = rngOf(3);
  for (let g = 0; g < 14; g++) {
    let s = L.newMatch({ quanNon: g % 2 === 0, first: g % 2 });
    while (!L.isOver(s)) {
      for (const lv of L.LEVELS) {
        const m = bestMove(s, lv, { rng, timeMs: 20 });
        assert.ok(m && L.canPlay(s, m[0], m[1]), lv);
      }
      const ms = L.legalMoves(s); s = L.play(s, ...ms[Math.floor(rng() * ms.length)]);
    }
    assert.equal(bestMove(s, "hard"), null, "ván xong → không có nước");
  }
});

test("máy Khó chọn nước trong < 300 ms", () => {
  const { maxMs } = playGame(["hard", "medium"], { rng: rngOf(11) });
  assert.ok(maxMs < 300, `chậm nhất ${maxMs.toFixed(0)} ms`);
});

test("máy Khó thắng máy Dễ ≥ 80% trên 50 ván (đổi đội đi trước, có ván quan non)", () => {
  let win = 0;
  const rng = rngOf(2026);
  for (let g = 0; g < 50; g++) {
    const hardSide = g % 2; // Khó lúc là đội A, lúc là đội B
    const lv = hardSide === 0 ? ["hard", "easy"] : ["easy", "hard"];
    const { s } = playGame(lv, { quanNon: g % 5 === 0, first: (g >> 1) % 2, rng, timeMs: 60 });
    if (s.winner === hardSide) win++;
  }
  assert.ok(win >= 40, `Khó thắng ${win}/50`);
});

test("máy Vừa thắng máy Dễ phần lớn số ván", () => {
  let win = 0;
  const rng = rngOf(99);
  for (let g = 0; g < 30; g++) {
    const side = g % 2, lv = side === 0 ? ["medium", "easy"] : ["easy", "medium"];
    if (playGame(lv, { rng, first: (g >> 1) % 2 }).s.winner === side) win++;
  }
  assert.ok(win >= 20, `Vừa thắng ${win}/30`);
});

test("máy tham ăn: có nước ăn quan thì Vừa và Khó đều chọn", () => {
  // ô 3 rải sang phải: ô 4 → ô 5 trống → ăn ô quan phải (quan + 3 dân = 13). Các nước khác không ăn được gì.
  const t = { ...L.newMatch(), pits: [0, 0, 0, 1, 0, 0, 3, 2, 2, 2, 2, 2], quan: [true, true], score: [18, 18] };
  assert.equal(L.total(t), 70);
  for (const lv of ["medium", "hard"]) assert.deepEqual(bestMove(t, lv, { rng: rngOf(1) }), [3, 1], lv);
});
