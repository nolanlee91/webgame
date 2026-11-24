// Kiểm "bằng chứng" kết quả Thử thách hôm nay: máy chủ dựng lại đề của ngày từ hạt (cùng mã với trình duyệt) rồi
// chấm lại. Không tin điểm client gửi — điểm xếp hạng do máy chủ tính.
//
// Quy ước xếp hạng chung: `score` càng LỚN càng cao hạng (cùng score ⇒ ai gửi trước đứng trên).
//   Sudoku : score = −(giây + 30 × lỗi + 60 × gợi ý)       (thời gian có phạt, ít hơn = tốt hơn)
//   2048   : score = điểm ván (phát lại danh sách nước đi)
//   Đố Vui : score = số câu đúng × 100000 − tổng mili-giây  (đúng nhiều hơn trước, rồi nhanh hơn)
import * as D from "../../prototype/games/_shared/daily.js";
import * as Sudoku from "../../prototype/games/sudoku/logic.js";
import * as T2048 from "../../prototype/games/2048/logic.js";
import * as Quiz from "../../prototype/games/do-vui-nhanh/logic.js";

export const SUDOKU_MISTAKE_SEC = 30, SUDOKU_HINT_SEC = 60;
export const SUDOKU_MIN_SEC = 45; // giải đề "Vừa" nhanh hơn 45 giây coi như không phải người
export const LATE_GRACE_MS = 10 * 60 * 1000; // qua 0h VN vẫn nhận kết quả hôm qua trong 10 phút
export const MOVE_CODES = { L: "left", R: "right", U: "up", D: "down" };
export const MOVE_LETTER = { left: "L", right: "R", up: "U", down: "D" };

const fail = (error, detail = "") => ({ ok: false, error, detail });

/** Ngày có còn nhận kết quả không: hôm nay, hoặc hôm qua trong 10 phút đầu ngày mới. */
export function dayAccepted(day, now = Date.now()) {
  const today = D.dayNumber(now);
  if (day === today) return true;
  return day === today - 1 && now - D.dayStart(today) < LATE_GRACE_MS;
}

const sudokuCache = new Map();
/** Đề Sudoku của ngày (giống hệt game: newGame({ diff: "vua", seed: seedFor("sudoku", day) })). */
export function sudokuPuzzle(day) {
  let p = sudokuCache.get(day);
  if (!p) {
    p = Sudoku.generate("vua", D.seedFor("sudoku", day));
    sudokuCache.set(day, p);
    if (sudokuCache.size > 8) sudokuCache.delete(sudokuCache.keys().next().value);
  }
  return p;
}

const int = (v) => (typeof v === "number" && Number.isInteger(v) ? v : NaN);

function verifySudoku(day, proof, { now, minSec }) {
  const { cells, hinted } = proof;
  const time = int(proof.time), mistakes = int(proof.mistakes), hints = int(proof.hints);
  if (typeof cells !== "string" || !/^[1-9]{81}$/.test(cells)) return fail("proof", "cells");
  if (typeof hinted !== "string" || !/^[01]{81}$/.test(hinted)) return fail("proof", "hinted");
  if (!(time >= 0 && time <= 3 * 86400)) return fail("proof", "time");
  if (!(mistakes >= 0 && mistakes <= 999)) return fail("proof", "mistakes");
  if (!(hints >= 0 && hints <= Sudoku.HINTS)) return fail("proof", "hints");
  const grid = [...cells].map(Number);
  if (!Sudoku.isValidSolution(grid)) return fail("invalid", "lời giải sai");
  const { puzzle } = sudokuPuzzle(day);
  let nHinted = 0;
  for (let i = 0; i < 81; i++) {
    if (puzzle[i] && grid[i] !== puzzle[i]) return fail("invalid", "đổi số cho sẵn");
    if (hinted[i] === "1") { if (puzzle[i]) return fail("invalid", "gợi ý ô cho sẵn"); nHinted++; }
  }
  if (nHinted !== hints) return fail("invalid", "số gợi ý không khớp");
  if (!(time >= minSec)) return fail("invalid", "thời gian quá ngắn");
  // không thể chơi lâu hơn thời gian đề đã tồn tại (+1 phút đệm đồng hồ)
  if (time > Math.max(0, (now - D.dayStart(day)) / 1000) + 60) return fail("invalid", "thời gian quá dài");
  const result = { time, mistakes, hints };
  return { ok: true, score: -(time + SUDOKU_MISTAKE_SEC * mistakes + SUDOKU_HINT_SEC * hints), result };
}

/** Phát lại ván 2048 daily từ hạt + chuỗi nước "LRUD…". Trả về trạng thái cuối hoặc lỗi. */
export function replay2048(day, moves, limit = D.GAMES["2048"].moveLimit) {
  if (typeof moves !== "string" || !/^[LRUD]*$/.test(moves)) return fail("proof", "moves");
  if (moves.length < 1) return fail("proof", "moves");
  if (moves.length > limit) return fail("invalid", "quá số nước tối đa");
  const s = T2048.newGame({ size: 4, seed: D.seedFor("2048", day) });
  for (let k = 0; k < moves.length; k++) {
    if (s.status !== "playing") return fail("invalid", "nước đi sau khi ván đã hết");
    const r = T2048.move(s, MOVE_CODES[moves[k]]);
    if (!r) return fail("invalid", `nước ${k + 1} không làm bàn thay đổi`);
    if (r.reachedGoal) T2048.keepGoing(s);
    if (s.status === "playing" && s.moves >= limit) s.status = "over";
  }
  return { ok: true, state: s };
}

function verify2048(day, proof) {
  const r = replay2048(day, proof.moves);
  if (!r.ok) return r;
  const s = r.state;
  return { ok: true, score: s.score, result: { score: s.score, maxTile: s.maxTile, moves: s.moves } };
}

/** Câu hỏi Đố Vui của ngày (giống game). */
export function quizRound(day) {
  const g = D.GAMES["do-vui-nhanh"];
  const ids = D.pickNoRepeat("do-vui-nhanh", day, Quiz.QUESTIONS.length, g.questions, 30);
  return Quiz.newRound({ seed: D.seedFor("do-vui-nhanh", day), ids, mode: "normal" });
}

function verifyQuiz(day, proof) {
  const answers = proof.answers;
  const s = quizRound(day);
  if (!Array.isArray(answers) || answers.length !== s.qs.length) return fail("proof", "answers");
  for (const a of answers) {
    const pick = int(a && a.pick);
    const ms = Number(a && a.ms);
    if (!(pick >= -1 && pick <= 3) || !Number.isFinite(ms) || ms < 0) return fail("proof", "answer");
    if (!Quiz.answer(s, pick, Math.min(ms, s.limit))) return fail("invalid", "câu trả lời không hợp lệ");
    Quiz.next(s);
  }
  const marks = s.answers.map((a) => a.ok);
  const ms = Math.round(s.answers.reduce((p, a) => p + a.ms, 0));
  const correct = marks.filter(Boolean).length;
  return { ok: true, score: correct * 100000 - ms, result: { marks, ms } };
}

/**
 * Kiểm bằng chứng. Trả về { ok:true, score, result, short } hoặc { ok:false, error:"proof"|"invalid"|"day"|"game", detail }.
 * opts: { now, minSudokuSec }
 */
export function verifyDaily(game, day, proof, { now = Date.now(), minSudokuSec = SUDOKU_MIN_SEC } = {}) {
  if (!D.GAMES[game]) return fail("game");
  if (!Number.isInteger(day) || day < 1) return fail("day");
  if (!dayAccepted(day, now)) return fail("day", "không phải đề hôm nay");
  if (!proof || typeof proof !== "object" || Array.isArray(proof)) return fail("proof");
  let r;
  if (game === "sudoku") r = verifySudoku(day, proof, { now, minSec: minSudokuSec });
  else if (game === "2048") r = verify2048(day, proof);
  else r = verifyQuiz(day, proof);
  if (r.ok) r.short = D.short(game, r.result);
  return r;
}

export { D };
