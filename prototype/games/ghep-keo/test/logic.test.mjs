import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

const S = (rows, opts = {}) => L.boardFrom(L.newGame({ mode: "free", seed: 3, ...opts }), rows);
// Bàn nền không có hàng khớp nào (mẫu chéo 0..5) để đặt tình huống lên trên
const BASE = ["01234501", "23450123", "45012345", "01234501", "23450123", "45012345", "01234501", "23450123"];
const base = () => S(BASE);
const kinds = (s) => s.cells.map((c) => (c.k === L.STAR ? "*" : c.k)).join("");
const noNull = (s) => s.cells.every((c) => c && Number.isInteger(c.id));
const uniqueIds = (s) => new Set(s.cells.map((c) => c.id)).size === L.N;

test("bàn nền dùng trong test không có hàng khớp", () => {
  assert.equal(L.findGroups(base().cells).length, 0);
});

test("tìm hàng khớp: ngang 3, dọc 4, chữ L gộp thành 1 nhóm", () => {
  const s = base();
  for (const i of [0, 1, 2]) L.setCell(s, i, 5);
  assert.deepEqual(L.findGroups(s.cells).map((g) => g.cells), [[0, 1, 2]]);
  const t = base();
  for (const i of [3, 11, 19, 27]) L.setCell(t, i, 0);
  const g = L.findGroups(t.cells);
  assert.equal(g.length, 1); assert.deepEqual(g[0].cells, [3, 11, 19, 27]); assert.equal(g[0].runs[0].dir, "v");
  const u = base();
  for (const i of [40, 41, 42, 48, 56]) L.setCell(u, i, 5); // ngang 40-42 + dọc 40,48,56 → chữ L
  const gl = L.findGroups(u.cells);
  assert.equal(gl.length, 1); assert.equal(gl[0].cells.length, 5); assert.equal(gl[0].runs.length, 2);
  assert.deepEqual(L.specialFor(gl[0]), { k: 5, sp: "b", at: 40 });
});

test("kẹo đặc biệt: 4 ngang → sọc ngang, 4 dọc → sọc dọc, 5 → kẹo sao; đặt ở ô vừa đổi", () => {
  const s = base();
  for (const i of [0, 1, 2, 3]) L.setCell(s, i, 5);
  const g = L.findGroups(s.cells)[0];
  assert.deepEqual(L.specialFor(g, [2]), { k: 5, sp: "h", at: 2 });
  const t = base();
  for (const i of [5, 13, 21, 29]) L.setCell(t, i, 4);
  assert.equal(L.specialFor(L.findGroups(t.cells)[0]).sp, "v");
  const u = base();
  for (const i of [16, 17, 18, 19, 20]) L.setCell(u, i, 1);
  assert.equal(L.specialFor(L.findGroups(u.cells)[0]).k, L.STAR);
  assert.equal(L.specialFor({ cells: [1, 2, 3], kind: 0, runs: [{ dir: "h", cells: [1, 2, 3] }] }), null);
});

test("nước đi hợp lệ: phải tạo hàng khớp; không cho đổi ô không kề hoặc nước vô nghĩa", () => {
  const s = base();
  // hàng 0: 0 1 2 3 4 5 0 1 — đặt ô 9 (hàng 1, cột 1) = 0 và ô 2 = 0: đổi ô 1 với ô 9 → hàng 0 có 0 0 0
  L.setCell(s, 2, 0); L.setCell(s, 9, 0);
  assert.equal(L.validSwap(s.cells, 1, 9), true);
  assert.equal(L.validSwap(s.cells, 1, 2), false, "không tạo hàng");
  assert.equal(L.validSwap(s.cells, 0, 9), false, "chéo không kề");
  assert.equal(L.validSwap(s.cells, 7, 8), false, "cuối hàng không kề đầu hàng sau");
  const before = kinds(s);
  assert.equal(L.swap(s, 1, 2), null);
  assert.equal(kinds(s), before, "nước vô nghĩa không đổi bàn");
  assert.equal(s.moves, 0);
});

test("đổi tạo hàng 3: nổ, ô phía trên rơi xuống, sinh ô mới từ trên; ô luôn đầy, id duy nhất", () => {
  const s = base();
  L.setCell(s, 2, 0); L.setCell(s, 9, 0); // như trên
  const r = L.swap(s, 1, 9);
  assert.ok(r);
  const r0 = r.rounds[0];
  assert.deepEqual(r0.removed.map((x) => x.at).sort((a, b) => a - b), [0, 1, 2]);
  assert.equal(r0.pts, 30);
  assert.equal(r0.spawns.length, 3, "3 ô mới ở hàng trên cùng");
  assert.ok(r0.spawns.every((p) => p.at < 8 && p.drop === 1));
  assert.equal(r0.falls.length, 0, "hàng trên cùng nổ thì không có ô nào rơi");
  assert.ok(noNull(s) && uniqueIds(s));
  assert.equal(L.findGroups(s.cells).length, 0, "sau dây chuyền bàn ổn định");
  assert.equal(s.moves, 1);
  // nổ ở giữa bàn: các ô phía trên rơi đúng 1 hàng
  const t = base();
  L.setCell(t, 26, 0); L.setCell(t, 28, 0); L.setCell(t, 35, 0); // hàng 3: 0,?,0 — đổi 27 với 35
  const idsAbove = [3, 11, 19].map((i) => t.cells[i].id);
  const r2 = L.swap(t, 27, 35);
  assert.ok(r2);
  const f = r2.rounds[0].falls;
  for (const [k, from] of [3, 11, 19].entries()) assert.ok(f.some((x) => x.id === idsAbove[k] && x.from === from && x.to === from + 8), "ô " + from + " rơi 1 hàng");
});

test("dây chuyền: vòng sau nhân điểm theo số vòng", () => {
  let found = null;
  for (let seed = 1; seed < 400 && !found; seed++) {
    const s = L.newGame({ level: 1, seed });
    const m = L.findMove(s.cells);
    const r = L.swap(s, m[0], m[1]);
    if (r.rounds.length >= 2) found = r;
  }
  assert.ok(found, "tìm được ván có dây chuyền");
  const r1 = found.rounds[1];
  assert.equal(r1.pts % 2, 0);
  assert.ok(r1.pts >= r1.removed.length * 10 * 2, "vòng 2 nhân đôi");
});

test("sọc ngang xóa cả hàng; bom nổ 3×3; kẹo sao xóa hết 1 loại", () => {
  const s = base();
  L.setCell(s, 2, 0); L.setCell(s, 9, 0);
  L.setCell(s, 0, 0, "h"); // kẹo sọc nằm trong hàng khớp
  const r = L.swap(s, 1, 9);
  assert.equal(r.rounds[0].removed.length, 8, "cả hàng 0");
  assert.ok(r.rounds[0].fx.some((f) => f.type === "h"));
  const t = base();
  L.setCell(t, 34, 0); L.setCell(t, 43, 0); L.setCell(t, 36, 0, "b"); // hàng 4: đổi 35 với 43 → 34,35,36
  const r2 = L.swap(t, 35, 43);
  const at = r2.rounds[0].removed.map((x) => x.at);
  for (const i of [27, 28, 29, 35, 36, 37, 43, 44, 45]) assert.ok(at.includes(i), "bom nổ ô " + i);
  const u = base();
  L.setCell(u, 0, L.STAR);
  const k1 = u.cells[1].k, cnt = u.cells.filter((c) => c.k === k1).length;
  const r3 = L.swap(u, 0, 1);
  assert.ok(r3, "kẹo sao luôn đổi được");
  assert.equal(r3.combo, "star");
  assert.equal(r3.rounds[0].removed.length, cnt + 1, "xóa hết loại " + k1 + " + chính kẹo sao");
});

test("2 kẹo đặc biệt đổi nhau: sọc+sọc = chữ thập, bom+bom = 5×5, sao+sao = cả bàn", () => {
  const s = base();
  L.setCell(s, 27, 2, "h"); L.setCell(s, 28, 3, "v");
  const r = L.swap(s, 27, 28);
  assert.equal(r.combo, "cross");
  const at = new Set(r.rounds[0].removed.map((x) => x.at));
  for (let k = 0; k < 8; k++) { assert.ok(at.has(24 + k)); assert.ok(at.has(k * 8 + 3) || at.has(k * 8 + 4)); }
  const t = base();
  L.setCell(t, 27, 2, "b"); L.setCell(t, 35, 3, "b");
  const r2 = L.swap(t, 27, 35);
  assert.equal(r2.combo, "bomb2"); assert.ok(r2.rounds[0].removed.length >= 25);
  const u = base();
  L.setCell(u, 27, L.STAR); L.setCell(u, 28, L.STAR);
  const r3 = L.swap(u, 27, 28);
  assert.equal(r3.combo, "star2"); assert.equal(r3.rounds[0].removed.length, 64);
  assert.ok(noNull(u) && uniqueIds(u) && L.findGroups(u.cells).length === 0);
});

test("hết nước đi → tự xáo bàn, giữ nguyên các viên kẹo", () => {
  // bàn không có nước đi nào (mẫu chéo 6 loại, mỗi ô khác hàng xóm theo kiểu không thể tạo 3)
  const s = S(["01230123", "45014501", "23452345", "01230123", "45014501", "23452345", "01230123", "45014501"]);
  assert.equal(L.findGroups(s.cells).length, 0);
  assert.equal(L.hasMove(s.cells), false, "bàn bế tắc");
  const before = s.cells.map((c) => c.k).sort().join("");
  const map = L.shuffle(s);
  assert.equal(map.length, 64);
  assert.equal(s.cells.map((c) => c.k).sort().join(""), before, "đúng bộ kẹo cũ");
  assert.ok(L.hasMove(s.cells) && L.findGroups(s.cells).length === 0);
  assert.equal(s.shuffles, 1);
});

test("tạo màn: bàn ổn định, có nước đi, đúng số loại; xác định theo seed", () => {
  for (let lv = 1; lv <= L.LEVELS.length; lv++) for (let seed = 1; seed <= 15; seed++) {
    const s = L.newGame({ level: lv, seed });
    assert.equal(L.findGroups(s.cells).length, 0);
    assert.ok(L.hasMove(s.cells));
    assert.ok(s.cells.every((c) => c.k < L.LEVELS[lv - 1].kinds && !c.sp));
    assert.equal(s.movesLeft, L.LEVELS[lv - 1].moves);
  }
  assert.equal(kinds(L.newGame({ level: 3, seed: 9 })), kinds(L.newGame({ level: 3, seed: 9 })));
  assert.notEqual(kinds(L.newGame({ level: 3, seed: 9 })), kinds(L.newGame({ level: 3, seed: 10 })));
  assert.throws(() => L.newGame({ level: 99 }));
});

test("độ khó tăng dần: càng về sau càng ít bước trên mỗi điểm mục tiêu hoặc nhiều mục tiêu hơn", () => {
  assert.ok(L.LEVELS.length >= 10);
  assert.ok(L.LEVELS[0].kinds < L.LEVELS.at(-1).kinds);
  const load = (l) => l.target / l.moves / (l.kinds === 5 ? 1.4 : 1) + (l.collect || []).reduce((a, [, n]) => a + n, 0) / l.moves * 10;
  assert.ok(load(L.LEVELS.at(-1)) > load(L.LEVELS[0]) * 1.5);
});

test("thắng màn: đủ điểm + đủ thu thập → thưởng bước dư, tính sao; hết bước → thua", () => {
  const s = L.boardFrom(L.newGame({ level: 2, seed: 5 }), BASE);
  L.setCell(s, 2, 0); L.setCell(s, 9, 0);
  s.score = 5000; s.goals[0].left = 2; s.movesLeft = 10;
  const r = L.swap(s, 1, 9); // xóa 3 kẹo loại 0 → đủ thu thập
  assert.equal(r.status, "won");
  assert.equal(s.goals[0].left, 0);
  assert.equal(r.bonus, 9 * L.BONUS_PER_MOVE);
  assert.equal(s.stars, 3);
  assert.equal(L.swap(s, 3, 4), null, "thắng rồi thì không đi nữa");
  const t = L.boardFrom(L.newGame({ level: 1, seed: 5 }), BASE);
  L.setCell(t, 2, 0); L.setCell(t, 9, 0);
  t.movesLeft = 1;
  assert.equal(L.swap(t, 1, 9).status, "lost");
  assert.equal(L.starsFor({ score: 1200, target: 1200 }), 1);
  assert.equal(L.starsFor({ score: 1700, target: 1200 }), 2);
  assert.equal(L.starsFor({ score: 2100, target: 1200 }), 3);
});

test("chế độ tự do: không giới hạn bước, không bao giờ kết thúc", () => {
  const s = L.newGame({ mode: "free", seed: 4 });
  for (let n = 0; n < 150; n++) { const m = L.findMove(s.cells); assert.ok(L.swap(s, m[0], m[1])); }
  assert.equal(s.status, "playing"); assert.equal(s.movesLeft, null); assert.equal(s.moves, 150);
  assert.ok(s.score > 0);
});

test("lưu / nạp: giữ nguyên bàn, điểm, bước, mục tiêu, rng; dữ liệu hỏng bị từ chối", () => {
  const s = L.newGame({ level: 7, seed: 21 });
  for (let n = 0; n < 5; n++) { const m = L.findMove(s.cells); L.swap(s, m[0], m[1]); }
  L.setCell(s, 0, s.cells[0].k, "b");
  const d = JSON.parse(JSON.stringify(L.serialize(s)));
  const t = L.deserialize(d);
  assert.ok(t);
  assert.deepEqual(t.cells.map((c) => [c.k, c.sp]), s.cells.map((c) => [c.k, c.sp]));
  for (const k of ["score", "moves", "movesLeft", "level", "rng", "kinds", "target"]) assert.equal(t[k], s[k], k);
  assert.deepEqual(t.goals, s.goals);
  // cùng nước đi → cùng kết quả sau khi nạp
  const m = L.findMove(s.cells);
  L.swap(s, m[0], m[1]); L.swap(t, m[0], m[1]);
  assert.equal(kinds(t), kinds(s)); assert.equal(t.score, s.score);
  const bad = (f) => { const x = JSON.parse(JSON.stringify(d)); f(x); return L.deserialize(x); };
  assert.equal(bad((x) => x.cells.pop()), null);
  assert.equal(bad((x) => { x.cells[5] = 9; }), null);
  assert.equal(bad((x) => { x.cells[5] = [1, "z"]; }), null);
  assert.equal(bad((x) => { x.level = 77; }), null);
  assert.equal(bad((x) => { x.movesLeft = 999; }), null);
  assert.equal(bad((x) => { x.goals[0][2] = 999; }), null);
  assert.equal(bad((x) => { x.status = "won"; }), null);
  assert.equal(bad((x) => { x.cells[0] = 1; x.cells[1] = 1; x.cells[2] = 1; }), null, "bàn đang có hàng khớp = hỏng");
  assert.equal(L.deserialize(null), null); assert.equal(L.deserialize("abc"), null);
});

test("fuzz: 4 seed × mọi màn, chơi đến hết — bàn luôn đầy, id duy nhất, ổn định, có nước đi, số liệu khớp", () => {
  for (let lv = 1; lv <= L.LEVELS.length; lv++) for (const seed of [1, 2, 3, 4]) {
    const s = L.newGame({ level: lv, seed: seed * 101 + lv });
    let guard = 0, pts = 0, cleared = 0;
    while (s.status === "playing" && guard++ < 100) {
      const all = [];
      for (let i = 0; i < 64; i++) for (const j of [i + 1, i + 8]) if (L.validSwap(s.cells, i, j)) all.push([i, j]);
      const m = all[(guard * 7 + seed) % all.length];
      const sc0 = s.score;
      const r = L.swap(s, m[0], m[1]);
      assert.ok(r);
      const sum = r.rounds.reduce((a, x) => a + x.pts, 0);
      assert.equal(s.score - sc0, sum + r.bonus, "điểm khớp tổng các vòng");
      pts += sum; cleared += r.rounds.reduce((a, x) => a + x.removed.length, 0);
      for (const x of r.rounds) { const made = x.made.length; assert.equal(x.spawns.length, x.removed.length - made, "số ô sinh = số ô mất − kẹo đặc biệt tạo ra"); }
      assert.ok(noNull(s) && uniqueIds(s), "bàn đầy, id duy nhất");
      assert.equal(L.findGroups(s.cells).length, 0, "bàn ổn định");
      if (s.status === "playing") assert.ok(L.hasMove(s.cells), "luôn còn nước đi");
      assert.ok(s.goals.every((g) => g.left >= 0));
    }
    assert.notEqual(s.status, "playing", "màn " + lv + " phải kết thúc");
    assert.equal(s.cleared, cleared);
  }
});
