// Chạy: node --test prototype/games/_shared/test/daily.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as D from "../daily.js";
import * as S from "../../sudoku/logic.js";
import * as T from "../../2048/logic.js";
import * as Q from "../../do-vui-nhanh/logic.js";

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m }; };
const vn = (y, mo, d, h = 0, mi = 0, s = 0) => Date.UTC(y, mo - 1, d, h - 7, mi, s); // giờ VN → ms UTC

test("số ngày theo giờ VN: #1 = 24/11/2026, sang ngày lúc 0h VN (17h UTC hôm trước)", () => {
  assert.equal(D.dayNumber(vn(2026, 11, 24, 0, 0, 0)), 1);
  assert.equal(D.dayNumber(vn(2026, 11, 24, 23, 59, 59)), 1);
  assert.equal(D.dayNumber(vn(2026, 11, 25, 0, 0, 0)), 2);
  assert.equal(D.dayNumber(Date.UTC(2026, 10, 23, 17, 0, 0)), 1, "17:00 UTC 23/11 = 0h VN 24/11 ⇒ ngày 1");
  assert.equal(D.dayNumber(Date.UTC(2026, 10, 24, 16, 59, 59)), 1, "16:59 UTC = 23:59 VN vẫn là ngày 1");
  assert.equal(D.dayNumber(Date.UTC(2026, 10, 24, 17, 0, 0)), 2, "17:00 UTC = 0h VN ngày 25");
  assert.equal(D.dayNumber(vn(2026, 12, 31, 12)), 38);
  assert.equal(D.dayNumber(vn(2026, 1, 1)), 1, "trước ngày ra mắt vẫn là #1");
  assert.equal(D.dateLabel(1), "24/11/2026");
  assert.equal(D.dateLabel(8), "01/12/2026");
  assert.equal(D.dayStart(2), vn(2026, 11, 25));
});

test("đếm ngược tới 0h VN", () => {
  assert.equal(D.msUntilNext(vn(2026, 11, 24, 23, 59, 0)), 60000);
  assert.equal(D.msUntilNext(vn(2026, 11, 25, 0, 0, 0)), D.DAY_MS);
  assert.equal(D.fmtCountdown(3723000), "01:02:03");
  assert.equal(D.fmtCountdown(0), "00:00:00");
});

test("hạt: cùng (game, ngày) ⇒ cùng hạt; khác ngày / khác game ⇒ khác", () => {
  assert.equal(D.seedFor("sudoku", 5), D.seedFor("sudoku", 5));
  assert.notEqual(D.seedFor("sudoku", 5), D.seedFor("sudoku", 6));
  assert.notEqual(D.seedFor("sudoku", 5), D.seedFor("2048", 5));
  const a = D.rng(123), b = D.rng(123);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
  const seeds = new Set(); for (let d = 1; d <= 400; d++) seeds.add(D.seedFor("2048", d));
  assert.equal(seeds.size, 400);
});

test("Sudoku: cùng ngày cùng đề, khác ngày khác đề, đề Vừa có đúng 1 lời giải", () => {
  for (const day of [1, 2, 3, 30, 365]) {
    const a = S.generate("vua", D.seedFor("sudoku", day)), b = S.generate("vua", D.seedFor("sudoku", day));
    assert.deepEqual(a.puzzle, b.puzzle);
    assert.equal(S.solve(a.puzzle, 2).count, 1, "ngày " + day + " phải có lời giải duy nhất");
    assert.ok(a.level === 2 && a.clues >= 28 && a.clues <= 36, `ngày ${day}: level ${a.level}, ${a.clues} số`);
  }
  assert.notDeepEqual(S.generate("vua", D.seedFor("sudoku", 1)).puzzle, S.generate("vua", D.seedFor("sudoku", 2)).puzzle);
});

test("2048: cùng ngày + cùng nước đi ⇒ cùng bàn/điểm; khác ngày ⇒ khác chuỗi ô", () => {
  const play = (day) => {
    const s = T.newGame({ size: 4, seed: D.seedFor("2048", day) });
    const dirs = ["left", "down", "right", "down"];
    for (let i = 0; i < 150 && s.status === "playing"; i++) T.move(s, dirs[i % 4]) || T.move(s, "up");
    return { cells: s.cells.map((c) => (c ? c.v : 0)).join(","), score: s.score, moves: s.moves };
  };
  assert.deepEqual(play(7), play(7));
  assert.notDeepEqual(play(7), play(8));
  const start = (d) => T.newGame({ size: 4, seed: D.seedFor("2048", d) }).cells.map((c) => (c ? c.v : 0)).join("");
  const distinct = new Set(); for (let d = 1; d <= 30; d++) distinct.add(start(d));
  assert.ok(distinct.size >= 20, "bàn mở đầu đa dạng: " + distinct.size);
});

test("Đố Vui: 5 câu theo ngày, cùng ngày cùng đề, khác ngày khác đề, không lặp trong cửa sổ cho phép", () => {
  const N = Q.QUESTIONS.length;
  assert.deepEqual(D.pickNoRepeat("do-vui-nhanh", 4, N, 5), D.pickNoRepeat("do-vui-nhanh", 4, N, 5));
  assert.notDeepEqual(D.pickNoRepeat("do-vui-nhanh", 4, N, 5), D.pickNoRepeat("do-vui-nhanh", 5, N, 5));
  const win = Math.min(30, Math.floor(N / 5) - 1);
  const days = []; for (let d = 1; d <= 200; d++) days.push(D.pickNoRepeat("do-vui-nhanh", d, N, 5));
  for (let d = 0; d < days.length; d++) {
    assert.equal(new Set(days[d]).size, 5);
    for (let b = Math.max(0, d - win); b < d; b++) for (const x of days[d]) assert.ok(!days[b].includes(x), `ngày ${d + 1} lặp câu ${x} của ngày ${b + 1}`);
  }
  // đủ câu (≥ 155) ⇒ không lặp trong 30 ngày
  const big = []; for (let d = 1; d <= 90; d++) big.push(D.pickNoRepeat("thu", d, 160, 5));
  for (let d = 0; d < big.length; d++) for (let b = Math.max(0, d - 30); b < d; b++) for (const x of big[d]) assert.ok(!big[b].includes(x));
  // ván từ ids giữ đúng thứ tự, đáp án xáo cố định theo hạt
  const ids = days[0];
  const r1 = Q.newRound({ seed: D.seedFor("do-vui-nhanh", 1), ids }), r2 = Q.newRound({ seed: D.seedFor("do-vui-nhanh", 1), ids });
  assert.deepEqual(r1.qs.map((q) => q.id), ids);
  assert.deepEqual(r1.qs, r2.qs);
  for (const q of r1.qs) assert.equal(q.opts[q.correct], Q.QUESTIONS[q.id].a[0]);
});

test("chuỗi ngày: liên tiếp tăng, bỏ 1 ngày thì về 1, hiển thị 0 khi đã đứt; mỗi ngày ghi 1 lần", () => {
  const st = mem();
  let r = D.record("sudoku", 1, { time: 200, mistakes: 0, hints: 0 }, { storage: st });
  assert.equal(r.streak, 1); assert.equal(r.already, false);
  r = D.record("sudoku", 2, { time: 300, mistakes: 1, hints: 0 }, { storage: st });
  assert.equal(r.streak, 2);
  r = D.record("sudoku", 2, { time: 1, mistakes: 0, hints: 0 }, { storage: st });
  assert.equal(r.already, true); assert.equal(D.getResult("sudoku", 2, st).time, 300, "không ghi đè");
  assert.equal(D.stats("sudoku", 3, st).streak, 2, "hôm sau chưa chơi: chuỗi vẫn còn");
  assert.equal(D.stats("sudoku", 4, st).streak, 0, "bỏ qua cả ngày 3 ⇒ đứt");
  r = D.record("sudoku", 4, { time: 100, mistakes: 0, hints: 0 }, { storage: st });
  assert.equal(r.streak, 1); assert.equal(r.maxStreak, 2); assert.equal(r.played, 3); assert.equal(r.perfect, 2);
  assert.equal(D.stats("2048", 4, st).streak, 0, "chuỗi tính riêng từng game");
});

test("chuỗi ngày qua ranh giới 0h VN: chơi 23:59 rồi 00:01 ⇒ 2 ngày liên tiếp", () => {
  const st = mem();
  const t1 = vn(2026, 11, 25, 23, 59), t2 = vn(2026, 11, 26, 0, 1);
  D.record("2048", D.dayNumber(t1), { maxTile: 256, score: 2000 }, { storage: st, now: t1 });
  const r = D.record("2048", D.dayNumber(t2), { maxTile: 512, score: 5000 }, { storage: st, now: t2 });
  assert.equal(D.dayNumber(t2) - D.dayNumber(t1), 1);
  assert.equal(r.streak, 2);
  // 16:59 UTC và 17:01 UTC cùng ngày UTC nhưng khác ngày VN
  const st2 = mem(), u1 = Date.UTC(2026, 11, 1, 16, 59), u2 = Date.UTC(2026, 11, 1, 17, 1);
  D.record("2048", D.dayNumber(u1), { maxTile: 128 }, { storage: st2, now: u1 });
  assert.equal(D.record("2048", D.dayNumber(u2), { maxTile: 128 }, { storage: st2, now: u2 }).streak, 2);
});

test("lưu trữ: hỏng / không có localStorage / ném lỗi đều không vỡ; tiến độ xoá khi xong", () => {
  const bad = { getItem: () => "{hỏng", setItem: () => { throw new Error("đầy"); } };
  assert.equal(D.stats("sudoku", 1, bad).streak, 0);
  assert.doesNotThrow(() => D.record("sudoku", 1, { time: 5 }, { storage: bad }));
  assert.equal(D.loadStore(null).v, 1);
  const st = mem();
  D.saveProgress("2048", 3, { a: 1 }, st);
  assert.deepEqual(D.loadProgress("2048", 3, st), { a: 1 });
  assert.equal(D.loadProgress("2048", 4, st), null, "tiến độ ngày khác không dùng");
  D.record("2048", 3, { maxTile: 64 }, { storage: st });
  assert.equal(D.loadProgress("2048", 3, st), null);
  assert.equal(D.saveProgress("2048", 3, { b: 2 }, st), false, "đã xong thì không lưu tiến độ nữa");
});

test("chuỗi chia sẻ: tên + số thử thách, ô emoji, chuỗi ngày, link; không lộ đáp án", () => {
  const st = mem();
  D.record("do-vui-nhanh", 3, { marks: [true, false, true, true, true], ms: 38400 }, { storage: st });
  const t = D.shareText("do-vui-nhanh", D.getResult("do-vui-nhanh", 3, st), { storage: st });
  const lines = t.split("\n");
  assert.equal(lines[0], "Lụm Kèo · Thử thách #3 · Đố Vui");
  assert.equal(lines[1], "🟩🟥🟩🟩🟩");
  assert.match(t, /Đúng 4\/5 · ⏱️ 38,4 giây/);
  assert.match(t, /🔥 Chuỗi 1 ngày/);
  assert.equal(lines.at(-1), "https://lumkeo.com/games/do-vui-nhanh/?daily=1&ref=daily");
  for (const q of Q.QUESTIONS) assert.ok(!t.includes(q.a[0]) || q.a[0].length < 3, "lộ đáp án: " + q.a[0]);

  const su = D.shareText("sudoku", { day: 9, time: 431, mistakes: 0, hints: 0 }, { streak: 4 });
  assert.match(su, /^Lụm Kèo · Thử thách #9 · Sudoku\n⏱️🟩🟩🟩🟨 7:11 ⭐\n🔥 Chuỗi 4 ngày\nhttps:\/\/lumkeo.com\/games\/sudoku\/\?daily=1&ref=daily$/);
  const su2 = D.shareText("sudoku", { day: 9, time: 1500, mistakes: 2, hints: 1 }, { streak: 0 });
  assert.match(su2, /🟥➕ 25:00\nLỗi 2 · Gợi ý 1\nhttps/);
  assert.ok(!su2.includes("⭐") && !su2.includes("🔥"));

  const g = D.shareText("2048", { day: 2, maxTile: 512, score: 6240 }, { streak: 2 });
  assert.match(g, /\n🟦🟩🟪⬜⬜\nÔ lớn nhất 512 · 6\.240 điểm\n/);
  assert.equal(D.grid("2048", { maxTile: 2048 }), "🟦🟩🟪🟧🟨");
  assert.equal(D.grid("2048", { maxTile: 64 }), "⬜⬜⬜⬜⬜");
  assert.equal(D.short("sudoku", { time: 252, mistakes: 0 }), "4:12 ⭐");
});

test("isDailyURL", () => {
  assert.equal(D.isDailyURL("?daily=1&ref=daily"), true);
  assert.equal(D.isDailyURL("?daily=0"), false);
  assert.equal(D.isDailyURL(""), false);
});
