import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, rng, deal, findPath, findAnyPair, applyGravity, reshuffle, tilesOf, newGame, pick, hint, shuffle, tick, nextLevel, retryLevel, remaining } from "../logic.js";
import { TILES } from "../sprites.js";

// Dựng lưới đệm từ chuỗi: "." trống, chữ cái = loại ô. Viền ngoài tự thêm.
function grid(rowsStr) {
  let id = 1;
  const w = rowsStr[0].length;
  const g = [Array(w + 2).fill(null)];
  for (const s of rowsStr) g.push([null, ...[...s].map((ch) => (ch === "." ? null : { id: id++, t: ch.charCodeAt(0) })), null]);
  g.push(Array(w + 2).fill(null));
  return g;
}
const segs = (p) => p.length - 1;

test("36 loại ô, mỗi loại 16×16, id không trùng", () => {
  assert.equal(TILES.length, 36);
  assert.equal(new Set(TILES.map((t) => t.id)).size, 36);
  for (const t of TILES) { assert.equal(t.rows.length, 16, t.id); for (const r of t.rows) assert.equal(r.length, 8, t.id); }
});

test("nối thẳng 1 đoạn, kề nhau và cách ô trống", () => {
  const g = grid(["AB", "A.", "BA"]);
  assert.equal(segs(findPath(g, [1, 1], [2, 1])), 1); // kề nhau
  const g2 = grid(["A..A"]);
  assert.deepEqual(findPath(g2, [1, 1], [1, 4]), [[1, 1], [1, 4]]);
});

test("không nối khác loại / cùng 1 ô / ô trống", () => {
  const g = grid(["AB"]);
  assert.equal(findPath(g, [1, 1], [1, 2]), null);
  assert.equal(findPath(g, [1, 1], [1, 1]), null);
  const g2 = grid(["A.A"]);
  assert.equal(findPath(g2, [1, 1], [1, 2]), null);
});

test("nối 2 đoạn (1 lần gấp) và 3 đoạn (2 lần gấp) bên trong bàn", () => {
  const g = grid([
    "AXXX",
    ".XXX",
    "...A"]);
  const p = findPath(g, [1, 1], [3, 4]);
  assert.equal(segs(p), 2);
  const g2 = grid([
    "XXXXX",
    "A...X",
    "XXX.X",
    "XXXA.",
    "XXXXX"]);
  // A(2,1) → phải tới (2,4) → xuống (3,4) → ... (4,4) là A: 2 đoạn; đổi chỗ để buộc 3 đoạn
  assert.ok(findPath(g2, [2, 1], [4, 4]));
  const g3 = grid([
    "XXXXXX",
    "A..XXX",
    "XX.XXX",
    "XX...A",
    "XXXXXX"]);
  assert.equal(segs(findPath(g3, [2, 1], [4, 6])), 3);
});

test("đi vòng qua viền ngoài bàn", () => {
  const g = grid([
    "AXXA",
    "XXXX"]);
  const p = findPath(g, [1, 1], [1, 4]);
  assert.equal(segs(p), 3);
  assert.equal(p[1][0], 0); // đi lên hàng viền
});

test("cần 4 đoạn thì KHÔNG nối được", () => {
  const g = grid([
    "XXXXXXX",
    "A.XXXXX",
    "X.XXXXX",
    "X.....X",
    "XXXXX.X",
    "XXXXX.A",
    "XXXXXXX"]);
  // A(2,1)→(2,2)→xuống (4,2)→phải (4,6)→xuống (6,6)→phải (6,7): 5 đoạn; bị chặn mọi lối viền
  assert.equal(findPath(g, [2, 1], [6, 7]), null);
});

test("deal: đúng kích thước, mọi loại có số chẵn ô, luôn có nước đi, đúng số loại", () => {
  for (let lv = 0; lv < LEVELS.length; lv++) for (let seed = 1; seed <= 20; seed++) {
    const L = LEVELS[lv], g = deal(lv, rng(seed));
    assert.equal(tilesOf(g).length, L.rows * L.cols);
    const count = new Map();
    for (const [r, c] of tilesOf(g)) count.set(g[r][c].t, (count.get(g[r][c].t) || 0) + 1);
    assert.equal(count.size, L.types);
    for (const v of count.values()) assert.equal(v % 2, 0);
    assert.ok(findAnyPair(g));
    for (let c = 0; c < g[0].length; c++) assert.ok(!g[0][c] && !g[g.length - 1][c]);
  }
});

test("trọng lực: dồn đúng hướng, không mất ô", () => {
  for (const dir of ["down", "up", "left", "right"]) {
    const g = grid(["ABC", "D.F", "GHI"]);
    g[2][2] = null;
    const before = tilesOf(g).length;
    // xoá giữa cột 2 (đã trống) và (1,2)
    g[1][2] = null;
    applyGravity(g, dir, [[1, 2], [2, 2]]);
    assert.equal(tilesOf(g).length, before - 1, dir);
    if (dir === "down") { assert.equal(g[3][2].t, "H".charCodeAt(0)); assert.equal(g[1][2], null); assert.equal(g[2][2], null); }
    if (dir === "up") { assert.equal(g[1][2].t, "H".charCodeAt(0)); assert.equal(g[3][2], null); }
    if (dir === "left") { assert.equal(g[1][1].t, 65); assert.equal(g[1][2].t, 67); assert.equal(g[1][3], null); assert.equal(g[2][2].t, 70); }
    if (dir === "right") { assert.equal(g[1][3].t, 67); assert.equal(g[1][2].t, 65); assert.equal(g[1][1], null); }
  }
});

test("đảo bài giữ nguyên tập ô và có nước đi", () => {
  const g = deal(3, rng(5));
  const before = tilesOf(g).map(([r, c]) => g[r][c].id).sort((a, b) => a - b);
  assert.ok(reshuffle(g, rng(9)));
  assert.deepEqual(tilesOf(g).map(([r, c]) => g[r][c].id).sort((a, b) => a - b), before);
  assert.ok(findAnyPair(g));
});

test("pick: chọn / bỏ chọn / sai loại / nối được + cộng điểm + combo", () => {
  const s = newGame({ level: 0, seed: 3 });
  const h = findAnyPair(s.grid);
  assert.equal(pick(s, h.a).type, "select");
  assert.equal(pick(s, h.a).type, "deselect");
  pick(s, h.a);
  const e = pick(s, h.b);
  assert.equal(e.type, "match");
  assert.equal(s.score, 10);
  assert.equal(remaining(s), 58);
  const h2 = findAnyPair(s.grid);
  pick(s, h2.a); const e2 = pick(s, h2.b);
  assert.equal(e2.combo, 1); assert.equal(s.score, 10 + 15);
  // sai loại → chọn ô mới
  const tiles = tilesOf(s.grid); const a = tiles[0]; const b = tiles.find(([r, c]) => s.grid[r][c].t !== s.grid[a[0]][a[1]].t);
  pick(s, a); assert.equal(pick(s, b).type, "mismatch"); assert.deepEqual(s.sel, b);
  assert.equal(pick(s, [0, 0]).type, "ignored");
});

// Người chơi máy: luôn nối cặp tìm thấy → mọi màn phải giải hết được (có tự đảo khi bế tắc).
test("giải trọn cả 8 màn với nhiều seed, không bao giờ kẹt", () => {
  for (let seed = 1; seed <= 12; seed++) {
    let s = newGame({ level: 0, seed });
    while (true) {
      let guard = 0;
      while (s.status === "playing") {
        const h = findAnyPair(s.grid);
        assert.ok(h, `bế tắc màn ${s.level + 1} seed ${seed}`);
        pick(s, h.a); const e = pick(s, h.b);
        assert.equal(e.type, "match");
        tick(s, 1);
        assert.ok(++guard < 500);
      }
      if (s.status === "won") break;
      assert.equal(s.status, "cleared");
      s = nextLevel(s, seed * 7 + s.level);
    }
    assert.equal(s.level, LEVELS.length - 1);
  }
});

test("gợi ý và đảo có giới hạn; hết giờ thì thua; chơi lại trả điểm về đầu màn", () => {
  const s = newGame({ level: 1, seed: 4, score: 120 });
  assert.ok(hint(s)); assert.ok(hint(s)); assert.ok(hint(s)); assert.equal(hint(s), null);
  assert.ok(shuffle(s)); assert.ok(shuffle(s)); assert.equal(shuffle(s), false);
  const h = findAnyPair(s.grid); pick(s, h.a); pick(s, h.b);
  assert.equal(s.score, 130);
  assert.deepEqual(tick(s, 1000), { type: "timeout" });
  assert.equal(s.status, "timeout");
  assert.equal(pick(s, h.a).type, "ignored");
  const r = retryLevel(s, 1);
  assert.equal(r.score, 120); assert.equal(r.level, 1); assert.equal(r.status, "playing");
});

test("qua màn được thưởng điểm theo thời gian còn lại", () => {
  const s = newGame({ level: 0, seed: 8 });
  tick(s, 50.5);
  while (s.status === "playing") { const h = findAnyPair(s.grid); pick(s, h.a); pick(s, h.b); }
  assert.equal(s.status, "cleared");
  assert.equal(s.bonus, Math.floor(200 - 50.5) * 2);
});
