// HOME-16: cùng điểm rút gọn ("4/5") mà khác hạng ⇒ hiện tiêu chí phụ suy ra từ score máy chủ. `node --test prototype/games/_shared/test/board-labels.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreLabels, tieDetail } from "../daily-board.js";

test("Đố Vui: 4/5 bằng nhau ⇒ thêm thời gian (đúng×100000 − ms)", () => {
  const rows = [
    { rank: 1, short: "5/5", score: 5 * 100000 - 21000 },
    { rank: 2, short: "4/5", score: 4 * 100000 - 3800 },
    { rank: 3, short: "4/5", score: 4 * 100000 - 16500 },
  ];
  assert.deepEqual(scoreLabels("do-vui-nhanh", rows), ["5/5", "4/5 · 3,8 giây", "4/5 · 16,5 giây"]);
});

test("2048: cùng ô lớn nhất ⇒ thêm điểm", () => {
  const rows = [{ short: "Ô 512", score: 6120 }, { short: "Ô 512", score: 5880 }, { short: "Ô 256", score: 2400 }];
  assert.deepEqual(scoreLabels("2048", rows), ["Ô 512 · 6.120 điểm", "Ô 512 · 5.880 điểm", "Ô 256"]);
});

test("Sudoku: cùng thời gian hiện mà khác score ⇒ ghi phạt", () => {
  const rows = [{ short: "4:12 ⭐", score: -252 }, { short: "4:12", score: -282 }, { short: "4:12", score: -252 }];
  assert.equal(tieDetail("sudoku", rows[1]), "phạt +0:30");
  assert.deepEqual(scoreLabels("sudoku", rows), ["4:12 ⭐", "4:12 · phạt +0:30", "4:12"]);
});

test("không bằng nhau ⇒ giữ nguyên", () => {
  assert.deepEqual(scoreLabels("do-vui-nhanh", [{ short: "5/5", score: 1 }, { short: "3/5", score: 2 }]), ["5/5", "3/5"]);
  assert.deepEqual(scoreLabels("do-vui-nhanh", [{ short: "5/5", score: 7 }, { short: "5/5", score: 7 }]), ["5/5", "5/5"]);
});
