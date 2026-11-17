import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

const SAMPLE = "530070000600195000098000060800060003400803001700020006060000280000419005000080079".split("").map(Number);

test("bộ giải: đề mẫu có đúng 1 lời giải hợp lệ, khớp các ô cho sẵn", () => {
  const r = L.solve(SAMPLE, 2);
  assert.equal(r.count, 1);
  assert.ok(L.isValidSolution(r.solution));
  SAMPLE.forEach((v, i) => { if (v) assert.equal(r.solution[i], v); });
});

test("bộ giải: phát hiện đề nhiều lời giải và đề mâu thuẫn", () => {
  const few = SAMPLE.slice(); for (let i = 0; i < 40; i++) few[i] = 0;
  assert.equal(L.solve(few, 2).count, 2);
  const bad = SAMPLE.slice(); bad[2] = 5; // trùng số 5 ở hàng 1
  assert.equal(L.solve(bad, 2).count, 0);
  assert.equal(L.solve(new Array(81).fill(0), 2).count, 2);
});

test("nhóm & ô liên quan: 27 nhóm 9 ô, mỗi ô có 20 ô cùng nhóm", () => {
  assert.equal(L.UNITS.length, 27);
  assert.ok(L.UNITS.every((u) => u.length === 9 && new Set(u).size === 9));
  assert.ok(L.PEERS.every((p) => p.length === 20));
  assert.deepEqual([L.ROW(40), L.COL(40), L.BOX(40)], [4, 4, 4]);
  assert.equal(L.BOX(80), 8); assert.equal(L.BOX(26), 2);
});

test("sinh đề: mỗi mức 25 đề đều có lời giải duy nhất, đúng độ khó, đối xứng tâm", () => {
  const stats = {};
  for (const diff of L.DIFF_IDS) {
    const clues = [];
    for (let k = 1; k <= 25; k++) {
      const g = L.generate(diff, k * 104729 + diff.length);
      assert.ok(L.isValidSolution(g.solution), diff + " lời giải hỏng");
      g.puzzle.forEach((v, i) => { if (v) assert.equal(v, g.solution[i]); assert.equal(!!v, !!g.puzzle[80 - i], "không đối xứng"); });
      const r = L.solve(g.puzzle, 2);
      assert.equal(r.count, 1, diff + " không duy nhất");
      assert.deepEqual(r.solution, g.solution);
      assert.equal(g.clues, g.puzzle.filter(Boolean).length);
      assert.equal(L.grade(g.puzzle), g.level);
      clues.push(g.clues);
      if (diff === "de") assert.equal(g.level, 1);
      if (diff === "vua") assert.equal(g.level, 2);
      if (diff === "kho") assert.equal(g.level, 3);
    }
    stats[diff] = { min: Math.min(...clues), max: Math.max(...clues), avg: clues.reduce((a, b) => a + b) / clues.length };
  }
  // càng khó càng ít ô cho sẵn
  assert.ok(stats.de.min > stats.vua.max - 2 && stats.de.avg > stats.vua.avg && stats.vua.avg > stats.kho.avg, JSON.stringify(stats));
  assert.ok(stats.de.min >= 36 && stats.kho.max <= 30, JSON.stringify(stats));
});

test("sinh đề: cùng seed → cùng đề, khác seed → khác đề", () => {
  assert.deepEqual(L.generate("vua", 42).puzzle, L.generate("vua", 42).puzzle);
  assert.notDeepEqual(L.generate("vua", 42).puzzle, L.generate("vua", 43).puzzle);
});

test("chấm độ khó: bàn đầy = 1, đề mẫu cổ điển giải được bằng suy luận", () => {
  const full = L.solve(SAMPLE, 1).solution;
  assert.equal(L.grade(full), 1);
  assert.ok(L.grade(SAMPLE) <= 2);
});

function game(diff = "vua", seed = 7) { return L.newGame({ diff, seed }); }
const emptyCell = (s) => s.cells.findIndex((v) => v === 0);

test("đặt số: đúng, sai (tính lỗi), ô cho sẵn bị khóa, đặt lại cùng số không tính", () => {
  const s = game();
  const g = s.puzzle.findIndex(Boolean);
  assert.equal(L.place(s, g, (s.puzzle[g] % 9) + 1), null, "ô cho sẵn không sửa được");
  const i = emptyCell(s);
  const wrongD = (s.solution[i] % 9) + 1;
  const r = L.place(s, i, wrongD);
  assert.ok(r.wrong); assert.equal(s.mistakes, 1); assert.ok(L.isWrong(s, i));
  assert.equal(L.place(s, i, wrongD), null);
  const r2 = L.place(s, i, s.solution[i]);
  assert.ok(!r2.wrong); assert.equal(s.mistakes, 1); assert.ok(!L.isWrong(s, i));
  assert.equal(s.moves, 2);
});

test("ghi chú: bật/tắt, chỉ ô trống, đặt số xóa ghi chú cùng số ở ô liên quan", () => {
  const s = game();
  const i = emptyCell(s);
  const d = s.solution[i];
  const peer = L.PEERS[i].find((j) => s.cells[j] === 0);
  const far = s.cells.findIndex((v, j) => v === 0 && j !== i && !L.PEERS[i].includes(j));
  L.toggleNote(s, peer, d); L.toggleNote(s, peer, (d % 9) + 1); L.toggleNote(s, far, d);
  assert.ok(s.notes[peer] & (1 << d));
  L.toggleNote(s, i, 1); L.toggleNote(s, i, 2);
  const r = L.place(s, i, d);
  assert.equal(s.notes[i], 0, "ô đã có số thì hết ghi chú");
  assert.ok(!(s.notes[peer] & (1 << d)) && s.notes[peer] & (1 << ((d % 9) + 1)));
  assert.ok(s.notes[far] & (1 << d), "ô không liên quan giữ nguyên ghi chú");
  assert.ok(r.cleared.includes(peer));
  assert.equal(L.toggleNote(s, i, 3), null, "ô có số không ghi chú được");
  assert.equal(L.toggleNote(s, peer, 5).on, !!(s.notes[peer] & (1 << 5)));
});

test("xóa + hoàn tác: khôi phục cả số lẫn ghi chú, nhiều bước", () => {
  const s = game();
  const i = emptyCell(s);
  const before = { c: s.cells.slice(), n: s.notes.slice() };
  L.toggleNote(s, i, 4); L.toggleNote(s, i, 6);
  const notesAfter = s.notes[i];
  L.place(s, i, s.solution[i]);
  L.erase(s, i);
  assert.equal(s.cells[i], 0);
  assert.equal(L.erase(s, i), null, "ô trống không cần xóa");
  L.undo(s); assert.equal(s.cells[i], s.solution[i]);
  L.undo(s); assert.equal(s.cells[i], 0); assert.equal(s.notes[i], notesAfter);
  L.undo(s); L.undo(s);
  assert.deepEqual(s.cells, before.c); assert.deepEqual(s.notes, before.n);
  assert.equal(L.undo(s), false);
});

test("gợi ý: điền đúng ô đang chọn (nếu trống/sai), khóa ô, tối đa 3 lần", () => {
  const s = game();
  const i = emptyCell(s);
  L.place(s, i, (s.solution[i] % 9) + 1);
  const r = L.hint(s, i);
  assert.equal(r.i, i); assert.equal(s.cells[i], s.solution[i]); assert.ok(L.isLocked(s, i));
  assert.equal(L.erase(s, i), null); assert.equal(L.place(s, i, 1 + (s.solution[i] % 9)), null);
  const r2 = L.hint(s, -1);
  assert.ok(r2 && r2.i !== i && s.cells[r2.i] === s.solution[r2.i]);
  L.hint(s, -1);
  assert.equal(s.hintsLeft, 0);
  assert.equal(L.hint(s, -1), null);
});

test("hoàn thành nhóm + thắng: điền hết đúng → won, nhóm vừa xong được báo", () => {
  const s = game("de", 3);
  let units = 0, last = null;
  for (let i = 0; i < 81; i++) if (!s.cells[i]) { last = L.place(s, i, s.solution[i]); units += last.units.length; }
  assert.ok(last.won); assert.equal(s.status, "won");
  assert.ok(units >= 1);
  assert.equal(L.place(s, 0, 1), null, "đã thắng thì không đặt được nữa");
  assert.ok(L.score(s) >= 900);
});

test("trùng số: phát hiện ô trùng trong cùng hàng/cột/khối", () => {
  const s = game();
  const i = emptyCell(s);
  const peerGiven = L.PEERS[i].find((j) => s.puzzle[j]);
  L.place(s, i, s.puzzle[peerGiven]);
  const c = L.conflicts(s);
  assert.ok(c.has(i) && c.has(peerGiven));
  L.erase(s, i);
  assert.equal(L.conflicts(s).size, 0);
});

test("đếm chữ số: tính số đã điền đúng", () => {
  const s = game("de", 9);
  const c = L.digitCounts(s);
  assert.equal(c.reduce((a, b) => a + b), s.clues);
  for (let i = 0; i < 81; i++) if (!s.cells[i] && s.solution[i] === 5) L.place(s, i, 5);
  assert.equal(L.digitCounts(s)[5], 9);
});

test("lưu/nạp: giữ đúng ván, ghi chú, gợi ý, lịch sử; dữ liệu hỏng bị từ chối", () => {
  const s = game("kho", 11);
  const i = emptyCell(s);
  L.toggleNote(s, i, 3); L.hint(s, -1); L.place(s, emptyCell(s), 9); s.time = 77.4;
  const o = JSON.parse(JSON.stringify(L.serialize(s)));
  const t = L.deserialize(o);
  for (const k of ["cells", "puzzle", "solution", "notes", "hinted"]) assert.deepEqual(t[k], s[k], k);
  assert.equal(t.mistakes, s.mistakes); assert.equal(t.hintsLeft, 2); assert.equal(t.time, 77.4); assert.equal(t.diff, "kho");
  assert.equal(t.history.length, s.history.length);
  assert.ok(L.undo(t));
  assert.equal(L.deserialize({ ...o, solution: o.solution.replace(/^./, "0") }), null);
  assert.equal(L.deserialize({ ...o, cells: "1".repeat(81) }), null, "sửa ô cho sẵn");
  assert.equal(L.deserialize({ ...o, diff: "x" }), null);
  assert.equal(L.deserialize({ ...o, notes: [1, 2] }), null);
  assert.equal(L.deserialize(null), null);
  const sw = o.solution.split(""); [sw[0], sw[1]] = [sw[1], sw[0]];
  assert.equal(L.deserialize({ ...o, solution: sw.join("") }), null, "lời giải sai luật");
});

test("fuzz: 300 thao tác ngẫu nhiên giữ bất biến (ô cho sẵn nguyên vẹn, lỗi khớp, ghi chú chỉ ở ô trống)", () => {
  for (const diff of L.DIFF_IDS) {
    const s = game(diff, 1234);
    const st = { rng: 99 };
    for (let k = 0; k < 300 && s.status === "playing"; k++) {
      const i = Math.floor(L.rngNext(st) * 81), d = 1 + Math.floor(L.rngNext(st) * 9), op = L.rngNext(st);
      const m0 = s.mistakes;
      if (op < 0.45) { const r = L.place(s, i, d); if (r) assert.equal(s.mistakes - m0, r.wrong ? 1 : 0); }
      else if (op < 0.75) L.toggleNote(s, i, d);
      else if (op < 0.88) L.erase(s, i);
      else if (op < 0.97) L.undo(s);
      else L.hint(s, i);
      for (let j = 0; j < 81; j++) {
        if (s.puzzle[j]) assert.equal(s.cells[j], s.puzzle[j]);
        if (s.cells[j]) assert.equal(s.notes[j], 0);
        if (s.hinted[j]) assert.equal(s.cells[j], s.solution[j]);
      }
    }
  }
});
