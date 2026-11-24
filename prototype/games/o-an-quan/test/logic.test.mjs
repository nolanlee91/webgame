// Test luật Ô Ăn Quan (logic.js) + máy chơi (ai.js). Chạy: (thư mục game) npm test  hoặc  node --test test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

// Dựng thế cờ tuỳ ý: đội `turn` tới lượt.
function pos({ pits, quan = [true, true], score = null, debt = [0, 0], turn = 0, quanNon = false }) {
  const s = L.newMatch({ quanNon, first: turn });
  const onBoard = pits.reduce((a, b) => a + b, 0) + 10 * quan.filter(Boolean).length;
  const sc = score || [Math.floor((70 - onBoard) / 2), Math.ceil((70 - onBoard) / 2)];
  return { ...s, pits: pits.slice(), quan: quan.slice(), score: sc.slice(), debt: debt.slice(), turn };
}
const kinds = (steps) => steps.map((x) => x.k).join(",");

test("bàn đầu: 5 dân mỗi ô, 2 quan, 10 nước hợp lệ, tổng 70", () => {
  const s = L.newMatch();
  assert.deepEqual(s.pits, [0, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5]);
  assert.deepEqual(s.quan, [true, true]);
  assert.equal(L.total(s), 70);
  assert.equal(L.legalMoves(s).length, 10);
  assert.ok(L.legalMoves(s).every(([p, d]) => p >= 1 && p <= 5 && (d === 1 || d === -1)));
});

test("nước không hợp lệ: ô bên kia, ô trống, ô quan, hướng sai, số không nguyên, ván đã xong", () => {
  const s = pos({ pits: [0, 0, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5] });
  for (const [p, d] of [[7, 1], [1, 1], [0, 1], [6, -1], [2, 0], [2, 2], [2.5, 1], ["2", 1], [2, "1"], [12, 1], [-1, 1]]) assert.equal(L.play(s, p, d), null, `${p},${d}`);
  assert.ok(L.play(s, 2, 1));
  assert.equal(L.play({ ...s, winner: 0 }, 2, 1), null);
});

test("rải tiếp: ô kế có dân thì bốc rải tiếp; ô kế là ô quan thì mất lượt", () => {
  const s = pos({ pits: [0, 1, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1] });
  const r = L.playSteps(s, 1, 1);
  assert.equal(kinds(r.steps), "pick,drop,pick,drop,drop,stop");
  assert.deepEqual(r.steps.at(-1), { k: "stop", at: 6, why: "quan" });
  assert.deepEqual(r.state.pits.slice(1, 6), [0, 1, 0, 1, 1]);
  assert.equal(r.gained, 0);
  assert.equal(r.state.turn, 1);
  assert.equal(L.total(r.state), 70);
});

test("ô kế là ô quan → mất lượt kể cả khi ô quan đã trống (không ăn ô sau)", () => {
  const s = pos({ pits: [3, 0, 0, 0, 1, 0, 0, 4, 0, 0, 0, 2], quan: [true, false] });
  const r = L.playSteps(s, 4, 1);
  assert.deepEqual(r.steps.at(-1), { k: "stop", at: 6, why: "quan" });
  assert.equal(r.gained, 0);
  assert.equal(r.state.pits[7], 4);
});

test("ăn liên hoàn theo mẫu trống–có, ăn cả quan (10) lẫn dân trong ô quan", () => {
  const s = pos({ pits: [0, 1, 0, 0, 4, 0, 3, 2, 0, 0, 0, 5] });
  const r = L.playSteps(s, 1, 1);
  const takes = r.steps.filter((x) => x.k === "take");
  assert.deepEqual(takes.map((x) => [x.at, x.v, x.quan]), [[4, 4, false], [6, 13, true]]);
  assert.equal(r.gained, 17);
  assert.equal(r.state.quan[1], false);
  assert.equal(r.state.eaten[0], 1);
  assert.equal(r.state.pits[7], 2, "sau ô quan vừa ăn là ô có dân → dừng, không ăn tiếp");
  assert.equal(r.state.score[0], s.score[0] + 17);
  assert.equal(L.total(r.state), 70);
});

test("ăn liên hoàn đi qua ô quan đã trống", () => {
  const s = pos({ pits: [2, 0, 1, 0, 0, 2, 0, 3, 0, 0, 0, 0], quan: [true, false] });
  const r = L.playSteps(s, 2, 1); // rải ô 3 → ô 4 trống, ăn ô 5 → ô quan phải trống, ăn ô 7 → hai ô trống → dừng
  assert.deepEqual(r.steps.filter((x) => x.k === "take").map((x) => [x.at, x.v]), [[5, 2], [7, 3]]);
  assert.equal(r.gained, 5);
});

test("hai ô trống liền nhau → dừng, không ăn gì", () => {
  const s = pos({ pits: [0, 1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2] });
  const r = L.playSteps(s, 1, 1);
  assert.equal(r.gained, 0);
  assert.deepEqual(r.steps.at(-1), { k: "stop", at: 4, why: "trong" });
});

test("rải ngược chiều (hướng -1) vòng qua ô quan trái sang hàng bên kia", () => {
  const s = pos({ pits: [0, 2, 3, 0, 0, 0, 0, 1, 0, 0, 4, 0] });
  const r = L.playSteps(s, 1, -1); // rải 0, 11 → ô kế 10 có 4 → bốc rải 9, 8, 7, 6 → ô kế 5 trống, ô 4 trống → dừng
  assert.equal(kinds(r.steps), "pick,drop,drop,pick,drop,drop,drop,drop,stop");
  assert.deepEqual(r.state.pits, [1, 0, 3, 0, 0, 0, 1, 2, 1, 1, 0, 1]);
});

test("luật quan non: ô quan ít hơn 5 dân thì chưa được ăn; đủ 5 thì ăn", () => {
  const pits = [0, 1, 0, 0, 4, 0, 3, 2, 0, 0, 0, 5];
  const r1 = L.playSteps(pos({ pits, quanNon: true }), 1, 1);
  assert.equal(r1.gained, 4);
  assert.equal(r1.state.quan[1], true);
  assert.deepEqual(r1.steps.at(-1), { k: "stop", at: 6, why: "quan-non" });
  const pits5 = pits.slice(); pits5[6] = 5; pits5[11] = 3;
  const r2 = L.playSteps(pos({ pits: pits5, quanNon: true }), 1, 1);
  assert.equal(r2.gained, 19);
  assert.equal(r2.state.quan[1], false);
  // tắt luật quan non thì ăn được ngay
  assert.equal(L.playSteps(pos({ pits }), 1, 1).gained, 17);
  // newMatch nhận cả rule: "quan-non"
  assert.equal(L.newMatch({ rule: "quan-non" }).quanNon, true);
  assert.equal(L.newMatch({ rule: "thuong" }).quanNon, false);
});

test("hết dân: đội tới lượt lấy 5 dân từ điểm của mình rải lại", () => {
  const s = pos({ pits: [3, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0], score: [30, 13] });
  const r = L.playSteps(s, 1, -1); // rải vào ô 0 → ô kế 11 trống, ô 10 trống → dừng; đổi lượt: hàng B trống
  const ref = r.steps.find((x) => x.k === "refill");
  assert.deepEqual(ref, { k: "refill", side: 1, own: 5, borrow: 0, at: [7, 8, 9, 10, 11] });
  assert.deepEqual(r.state.pits.slice(7), [1, 1, 1, 1, 1]);
  assert.deepEqual(r.state.score, [30, 8]);
  assert.deepEqual(r.state.debt, [0, 0]);
  assert.equal(L.total(r.state), 70);
});

test("hết dân mà điểm không đủ 5 → vay đội kia, ghi nợ", () => {
  const s = pos({ pits: [3, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0], score: [41, 2] });
  const r = L.playSteps(s, 1, -1);
  assert.deepEqual(r.steps.find((x) => x.k === "refill"), { k: "refill", side: 1, own: 2, borrow: 3, at: [7, 8, 9, 10, 11] });
  assert.deepEqual(r.state.score, [38, 0]);
  assert.deepEqual(r.state.debt, [0, 3]);
  assert.equal(L.total(r.state), 70);
});

test("hết quan (hai ô quan trống) → mỗi bên thu dân hàng mình, trả nợ, tính thắng/hòa", () => {
  const s = pos({ pits: [1, 0, 0, 1, 0, 3, 0, 2, 0, 0, 0, 4], quan: [false, false], score: [25, 34], debt: [0, 5] });
  const r = L.playSteps(s, 3, -1); // rải ô 2 → ô 1 trống, ăn ô quan trái (1 dân) → hai ô quan trống: hết ván
  assert.equal(kinds(r.steps.slice(-5)), "take,collect,collect,repay,end");
  assert.deepEqual(r.state.final.score, [35, 35]);
  assert.equal(r.state.winner, 2);
  assert.deepEqual(r.state.tally, [0, 0, 1]);
  assert.ok(r.state.pits.every((n) => n === 0));
  assert.equal(L.legalMoves(r.state).length, 0);
  // không nợ thì đội nhiều điểm hơn thắng
  const r2 = L.playSteps({ ...s, debt: [0, 0] }, 3, -1);
  assert.equal(r2.state.winner, 1);
  assert.deepEqual(r2.state.final.score, [30, 40]);
});

test("bảo toàn 70 điểm qua 600 ván ngẫu nhiên (cả quan non); ván nào cũng kết thúc", () => {
  let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let refills = 0, borrows = 0, chains = 0;
  for (let g = 0; g < 600; g++) {
    let s = L.newMatch({ quanNon: g % 2 === 1, first: g % 2 });
    while (!L.isOver(s)) {
      const ms = L.legalMoves(s);
      assert.ok(ms.length > 0, "ván chưa xong luôn có nước đi");
      const [p, d] = ms[Math.floor(rnd() * ms.length)];
      const r = L.playSteps(s, p, d);
      for (const x of r.steps) { if (x.k === "refill") { refills++; if (x.borrow) borrows++; } }
      if (r.steps.filter((x) => x.k === "take").length > 1) chains++;
      s = r.state;
      assert.equal(L.total(s), 70);
      assert.ok(s.pits.every((n) => Number.isInteger(n) && n >= 0));
    }
    assert.equal(s.final.score[0] + s.final.score[1] + s.pits.reduce((a, b) => a + b, 0) + 10 * s.quan.filter(Boolean).length, 70);
  }
  assert.ok(refills > 100 && borrows > 10 && chains > 100, `rải lại ${refills}, vay ${borrows}, ăn liên hoàn ${chains}`);
});

test("replay dựng lại đúng ván; nước sai trong danh sách → null; ván kế đội thua đi trước", () => {
  let s = L.newMatch({ mode: "ai", aiLevel: "hard" });
  const moves = [];
  while (!L.isOver(s)) { const m = L.legalMoves(s)[(s.ply * 7) % L.legalMoves(s).length]; moves.push(m); s = L.play(s, ...m); }
  const r = L.replay(L.restartRound(s), moves);
  assert.deepEqual(r.pits, s.pits); assert.deepEqual(r.final, s.final); assert.equal(r.winner, s.winner);
  assert.equal(L.replay(L.newMatch(), [[7, 1]]), null);
  assert.equal(L.replay(L.newMatch(), "x"), null);
  const n = L.nextRound(s);
  assert.equal(n.round, 2);
  assert.equal(n.first, s.winner === 2 ? 1 : 1 - s.winner);
  assert.deepEqual(n.tally, s.tally);
  assert.equal(n.mode, "ai"); assert.equal(n.aiLevel, "hard");
});
