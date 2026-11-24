// Kiểm bằng chứng kết quả Thử thách hôm nay (máy chủ dựng lại đề từ hạt). `npm run test:account`
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyDaily, dayAccepted, replay2048, sudokuPuzzle, quizRound, SUDOKU_MIN_SEC, D } from "../verify.mjs";
import * as Sudoku from "../../../prototype/games/sudoku/logic.js";
import { DAY, NOW, sudokuProof, moves2048, quizProof } from "./helpers.mjs";

const V = (game, proof, opts = {}) => verifyDaily(game, opts.day ?? DAY, proof, { now: NOW, ...opts });

test("đề máy chủ dựng lại trùng đề trong game (cùng hạt)", () => {
  const g = Sudoku.newGame({ diff: "vua", seed: D.seedFor("sudoku", DAY) });
  assert.deepEqual(sudokuPuzzle(DAY).puzzle, g.puzzle);
  assert.equal(quizRound(DAY).qs.length, 5);
});

test("ngày: hôm nay nhận, hôm qua chỉ nhận trong 10 phút đầu ngày mới, ngày mai / cũ hơn thì không", () => {
  const start = D.dayStart(DAY);
  assert.equal(dayAccepted(DAY, NOW), true);
  assert.equal(dayAccepted(DAY - 1, start + 9 * 60 * 1000), true);
  assert.equal(dayAccepted(DAY - 1, start + 11 * 60 * 1000), false);
  assert.equal(dayAccepted(DAY + 1, NOW), false);
  assert.equal(dayAccepted(DAY - 2, start + 60 * 1000), false);
  const r = V("2048", { moves: moves2048(DAY, 10) }, { day: DAY + 1 });
  assert.equal(r.ok, false); assert.equal(r.error, "day");
});

test("Sudoku: lời giải đúng ⇒ điểm = −(giây + 30×lỗi + 60×gợi ý)", () => {
  const r = V("sudoku", sudokuProof(DAY, { time: 300, mistakes: 2, hints: 1 }));
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.score, -(300 + 60 + 60));
  assert.deepEqual(r.result, { time: 300, mistakes: 2, hints: 1 });
  assert.equal(r.short, "5:00");
  assert.equal(V("sudoku", sudokuProof(DAY, { time: 250 })).short, "4:10 ⭐");
});

test("Sudoku: từ chối lưới sai, đổi số cho sẵn, gợi ý không khớp, thời gian vô lý", () => {
  const ok = sudokuProof(DAY);
  // lưới không hợp lệ (đổi 2 số trong một hàng ⇒ cột hỏng)
  const bad = ok.cells.split(""); [bad[0], bad[1]] = [bad[1], bad[0]];
  assert.equal(V("sudoku", { ...ok, cells: bad.join("") }).error, "invalid");
  // lưới hợp lệ nhưng không phải lời giải của đề hôm nay (đề ngày khác)
  assert.equal(V("sudoku", { ...ok, cells: sudokuProof(DAY + 7).cells }).error, "invalid");
  // hoán đổi chữ số 1↔2 khắp lưới: vẫn là lưới Sudoku hợp lệ nhưng phá số cho sẵn
  const swapped = ok.cells.replace(/[12]/g, (c) => (c === "1" ? "2" : "1"));
  assert.ok(Sudoku.isValidSolution([...swapped].map(Number)));
  assert.equal(V("sudoku", { ...ok, cells: swapped }).detail, "đổi số cho sẵn");
  // khai 0 gợi ý nhưng mặt nạ có 1 ô gợi ý
  assert.equal(V("sudoku", { ...sudokuProof(DAY, { hints: 1 }), hints: 0 }).detail, "số gợi ý không khớp");
  assert.equal(V("sudoku", { ...ok, time: SUDOKU_MIN_SEC - 1 }).detail, "thời gian quá ngắn");
  assert.equal(V("sudoku", { ...ok, time: 6 * 3600 }).detail, "thời gian quá dài"); // mới 5 giờ kể từ 0h
  assert.equal(V("sudoku", { ...ok, time: 12.5 }).error, "proof");
  assert.equal(V("sudoku", { ...ok, cells: ok.cells.slice(0, 80) }).error, "proof");
  assert.equal(V("sudoku", { ...ok, hints: 4 }).error, "proof");
  assert.equal(V("sudoku", { ...ok, mistakes: -1 }).error, "proof");
  assert.equal(V("sudoku", null).error, "proof");
  assert.equal(V("sudoku", [1, 2]).error, "proof");
  // ngưỡng thời gian tối thiểu chỉnh được (máy dev / e2e)
  assert.equal(V("sudoku", { ...ok, time: 3 }, { minSudokuSec: 0 }).ok, true);
});

test("2048: phát lại nước đi ⇒ điểm do máy chủ tính, không tin client", () => {
  const moves = moves2048(DAY, 150);
  const r = V("2048", { moves, score: 999999, maxTile: 2048 });
  assert.equal(r.ok, true);
  const rp = replay2048(DAY, moves).state;
  assert.equal(r.score, rp.score);
  assert.deepEqual(r.result, { score: rp.score, maxTile: rp.maxTile, moves: rp.moves });
  assert.ok(r.result.score > 0 && r.result.score < 999999);
  assert.equal(r.short, `Ô ${rp.maxTile}`);
});

test("2048: từ chối quá 150 nước, nước không đổi bàn, ký tự lạ, nước sau khi hết ván", () => {
  const moves = moves2048(DAY, 150);
  assert.equal(V("2048", { moves: moves + "L" }).error, "invalid");
  assert.equal(V("2048", { moves: "X" }).error, "proof");
  assert.equal(V("2048", { moves: "" }).error, "proof");
  assert.equal(V("2048", { moves: 123 }).error, "proof");
  // tìm một nước không làm bàn đổi ở đầu ván
  const first = ["L", "R", "U", "D"].find((m) => !replay2048(DAY, m).ok);
  if (first) assert.match(V("2048", { moves: first }).detail, /không làm bàn thay đổi/);
});

test("Đố Vui: chấm lại đáp án theo câu của ngày, ép thời gian về giới hạn 15 giây", () => {
  const r = V("do-vui-nhanh", quizProof(DAY, [true, false, true, "t", true], [3000, 5000, 999999, 0, 2000]));
  assert.equal(r.ok, true);
  assert.deepEqual(r.result.marks, [true, false, true, false, true]);
  assert.equal(r.result.ms, 3000 + 5000 + 15000 + 15000 + 2000);
  assert.equal(r.score, 3 * 100000 - r.result.ms);
  assert.equal(r.short, "3/5");
  // khai "đúng" mà chọn sai ⇒ máy chủ chấm sai
  const fake = quizProof(DAY, [false, false, false, false, false]);
  const rf = V("do-vui-nhanh", { ...fake, marks: [true, true, true, true, true] });
  assert.equal(rf.result.marks.filter(Boolean).length, 0);
});

test("Đố Vui: từ chối số câu sai, lựa chọn ngoài 0..3, thời gian âm / NaN", () => {
  const ok = quizProof(DAY);
  assert.equal(V("do-vui-nhanh", { answers: ok.answers.slice(0, 4) }).error, "proof");
  assert.equal(V("do-vui-nhanh", { answers: [...ok.answers, ok.answers[0]] }).error, "proof");
  assert.equal(V("do-vui-nhanh", { answers: ok.answers.map((a, i) => (i ? a : { pick: 4, ms: 1 })) }).error, "proof");
  assert.equal(V("do-vui-nhanh", { answers: ok.answers.map((a, i) => (i ? a : { pick: 1, ms: -5 })) }).error, "proof");
  assert.equal(V("do-vui-nhanh", { answers: ok.answers.map((a, i) => (i ? a : { pick: 1, ms: "x" })) }).error, "proof");
  assert.equal(V("do-vui-nhanh", { answers: ok.answers.map((a, i) => (i ? a : { pick: 1.5, ms: 1 })) }).error, "proof");
});

test("xếp hạng: Đố Vui đúng nhiều hơn luôn trên, cùng số đúng thì nhanh hơn trên; Sudoku nhanh + ít lỗi trên", () => {
  const a = V("do-vui-nhanh", quizProof(DAY, [true, true, true, true, false], 14000)).score;
  const b = V("do-vui-nhanh", quizProof(DAY, [true, true, true, false, false], 500)).score;
  const c = V("do-vui-nhanh", quizProof(DAY, [true, true, true, true, false], 1000)).score;
  assert.ok(c > a && a > b);
  const s1 = V("sudoku", sudokuProof(DAY, { time: 300 })).score;
  const s2 = V("sudoku", sudokuProof(DAY, { time: 280, mistakes: 1 })).score; // 280 + 30 = 310
  assert.ok(s1 > s2);
});

test("game lạ / ngày không hợp lệ", () => {
  assert.equal(verifyDaily("xep-gach", DAY, {}, { now: NOW }).error, "game");
  assert.equal(verifyDaily("sudoku", 0, {}, { now: NOW }).error, "day");
  assert.equal(verifyDaily("sudoku", 1.5, {}, { now: NOW }).error, "day");
});
