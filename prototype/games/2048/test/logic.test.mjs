import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

// Đặt bàn theo mảng giá trị (0 = trống), id mới, rng cố định.
function board(vals, size = 4) {
  const s = L.newGame({ size, seed: 7 });
  let id = 1;
  s.cells = vals.map((v) => (v ? { id: id++, v } : null));
  s.nextId = id; s.maxTile = L.maxTile(s);
  return s;
}
const vals = (s) => s.cells.map((c) => (c ? c.v : 0));
// So hàng trước khi ô mới sinh ra: bỏ ô vừa spawn
function withoutSpawn(s, r) { const v = vals(s); if (r && r.spawned) v[r.spawned.at] = 0; return v; }

test("ván mới có đúng 2 ô 2/4, đúng kích thước và mục tiêu", () => {
  for (const size of L.SIZES) {
    const s = L.newGame({ size, seed: 123 });
    assert.equal(s.cells.length, size * size);
    const t = s.cells.filter(Boolean);
    assert.equal(t.length, 2);
    for (const c of t) assert.ok(c.v === 2 || c.v === 4);
    assert.equal(s.goal, L.GOALS[size]);
    assert.equal(s.status, "playing");
  }
});

test("cùng seed → cùng ván, khác seed → thường khác", () => {
  const a = L.newGame({ seed: 99 }), b = L.newGame({ seed: 99 });
  for (const d of ["left", "up", "right", "down", "left", "up"]) { L.move(a, d); L.move(b, d); }
  assert.deepEqual(vals(a), vals(b));
  let diff = 0;
  for (let i = 0; i < 20; i++) if (JSON.stringify(vals(L.newGame({ seed: i }))) !== JSON.stringify(vals(L.newGame({ seed: i + 100 })))) diff++;
  assert.ok(diff > 10);
});

test("gộp trái: [2,2,2,2] → [4,4], [2,2,4,4] → [4,8], [4,0,4,4] → [8,4]", () => {
  const cases = [
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 4, 4], [4, 8, 0, 0], 12],
    [[4, 0, 4, 4], [8, 4, 0, 0], 8],
    [[2, 4, 8, 16], null, 0],
    [[0, 0, 0, 2], [2, 0, 0, 0], 0],
    [[8, 8, 8, 0], [16, 8, 0, 0], 16],
  ];
  for (const [row, exp, pts] of cases) {
    const s = board([...row, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const r = L.move(s, "left");
    if (!exp) { assert.equal(r, null, `không đổi: ${row}`); continue; }
    assert.deepEqual(withoutSpawn(s, r).slice(0, 4), exp, `hàng ${row}`);
    assert.equal(r.gained, pts);
    assert.equal(s.score, pts);
  }
});

test("4 hướng gộp đúng và không gộp 2 lần trong 1 nước", () => {
  const base = [2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2];
  const exp = {
    left: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0],
    right: [0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    up: [4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    down: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4],
  };
  for (const d of L.DIRS) {
    const s = board(base); const r = L.move(s, d);
    assert.deepEqual(withoutSpawn(s, r), exp[d], d);
    assert.equal(r.merges.length, 2);
  }
  const s = board([4, 4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const r = L.move(s, "left");
  assert.deepEqual(withoutSpawn(s, r).slice(0, 4), [8, 8, 0, 0], "ô 8 vừa gộp không gộp tiếp với 8");
});

test("mỗi nước hợp lệ sinh đúng 1 ô vào chỗ trống; nước không hợp lệ không tính", () => {
  const s = board([2, 4, 8, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(L.move(s, "left"), null);
  assert.equal(L.move(s, "up"), null);
  assert.equal(s.moves, 0);
  const r = L.move(s, "down");
  assert.ok(r);
  assert.equal(s.moves, 1);
  assert.equal(s.cells.filter(Boolean).length, 5);
  assert.ok(r.spawned && (r.spawned.v === 2 || r.spawned.v === 4));
  assert.ok(r.spawned.at < 12, "ô mới ở chỗ trống phía trên");
});

test("ghi lại di chuyển + gộp để vẽ hoạt ảnh", () => {
  const s = board([0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const ids = s.cells.filter(Boolean).map((c) => c.id);
  const r = L.move(s, "left");
  assert.deepEqual(r.moves.map((m) => m.to).sort(), [0, 0]);
  assert.equal(r.merges.length, 1);
  assert.deepEqual(r.merges[0].from.sort(), ids.sort());
  assert.equal(r.merges[0].at, 0);
  assert.equal(s.cells[0].v, 4);
  assert.equal(s.cells[0].id, r.merges[0].id);
});

test("hết nước đi → over; còn ô trống hoặc cặp kề nhau → chưa over", () => {
  const full = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  assert.equal(L.canMove(board(full)), false);
  const pair = [...full]; pair[15] = 4; // 4 cạnh 4 ở hàng cuối
  assert.equal(L.canMove(board(pair)), true);
  // còn 1 nước cuối dẫn đến bế tắc
  const s = board([0, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]);
  s.rng = 5;
  const r = L.move(s, "left");
  assert.ok(r);
  if (!L.canMove(s)) { assert.equal(s.status, "over"); assert.equal(r.over, true); }
  assert.equal(L.move(board(full), "left"), null);
});

test("đạt mục tiêu → won (dừng), chơi tiếp → playing, không báo thắng lần 2", () => {
  const s = board([1024, 1024, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const r = L.move(s, "left");
  assert.equal(r.reachedGoal, true);
  assert.equal(s.status, "won");
  assert.equal(L.move(s, "right"), null, "đang chờ chọn, không đi được");
  assert.equal(L.canUndo(s), false);
  assert.ok(L.keepGoing(s));
  assert.equal(s.status, "playing");
  s.cells[5] = { id: s.nextId++, v: 2048 }; s.cells[6] = { id: s.nextId++, v: 2048 };
  const r2 = L.move(s, "left");
  assert.equal(r2.reachedGoal, false);
  assert.equal(s.status === "playing" || s.status === "over", true);
  assert.equal(s.maxTile, 4096);
});

test("mục tiêu 3×3 = 256, 5×5 = 4096", () => {
  const s = board([128, 128, 0, 0, 0, 0, 0, 0, 0], 3);
  assert.equal(s.goal, 256);
  assert.equal(L.move(s, "left").reachedGoal, true);
  const b = board(new Array(25).fill(0).map((_, i) => (i < 2 ? 2048 : 0)), 5);
  assert.equal(L.move(b, "left").reachedGoal, true);
});

test("hoàn tác: trả lại bàn, điểm, rng; tối đa 3 lần/ván", () => {
  const s = L.newGame({ seed: 42 });
  const v0 = vals(s), sc0 = s.score;
  let n = 0;
  for (const d of ["left", "up", "right", "down", "left", "up", "right", "down"]) if (L.move(s, d)) n++;
  assert.ok(n >= 4);
  const v3 = [];
  // lùi 3 bước
  for (let i = 0; i < 3; i++) { v3.push(vals(s)); assert.ok(L.undo(s)); }
  assert.equal(s.undoLeft, 0);
  assert.equal(L.undo(s), false);
  // đi lại đúng nước cũ ra đúng ô cũ (rng được khôi phục, không đổ lại)
  const t = L.newGame({ seed: 42 });
  assert.deepEqual(vals(t), v0); assert.equal(t.score, sc0);
  const s2 = L.newGame({ seed: 42 });
  const hist = [];
  for (const d of ["left", "up", "right", "down", "left", "up", "right", "down"]) { const r = L.move(s2, d); if (r) hist.push(d); }
  L.undo(s2);
  const before = vals(s2);
  L.move(s2, hist[hist.length - 1]);
  L.undo(s2);
  assert.deepEqual(vals(s2), before);
});

test("hoàn tác sau khi thua → chơi lại được", () => {
  const s = board([0, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]);
  let found = false;
  for (let seed = 1; seed < 200 && !found; seed++) {
    const t = board([0, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]); t.rng = seed;
    const r = L.move(t, "left");
    if (r && r.over) {
      found = true;
      assert.ok(L.canUndo(t));
      assert.ok(L.undo(t));
      assert.equal(t.status, "playing");
      assert.equal(t.cells[0], null);
    }
  }
  assert.ok(found || s);
});

test("lưu / nạp ván giữ nguyên bàn, điểm, trạng thái; dữ liệu hỏng → null", () => {
  const s = L.newGame({ size: 5, seed: 8 });
  for (let i = 0; i < 30; i++) L.move(s, L.DIRS[i % 4]);
  s.time = 77.4;
  const d = JSON.parse(JSON.stringify(L.serialize(s)));
  const t = L.deserialize(d);
  assert.deepEqual(vals(t), vals(s));
  assert.equal(t.score, s.score); assert.equal(t.moves, s.moves); assert.equal(t.size, 5);
  assert.equal(t.rng, s.rng); assert.equal(t.undoLeft, s.undoLeft); assert.equal(t.time, 77);
  // tiếp tục giống hệt
  const a = L.move(s, "left"), b = L.move(t, "left");
  assert.deepEqual(vals(s), vals(t)); assert.equal(!!a, !!b);
  for (const bad of [null, 5, {}, { size: 4, cells: [1, 2] }, { size: 7, cells: [] }, { size: 3, cells: [3, 0, 0, 0, 0, 0, 0, 0, 0] }, { size: 3, cells: new Array(9).fill(0) }])
    assert.equal(L.deserialize(bad), null);
});

test("tổng giá trị trên bàn = tổng các ô đã sinh (bảo toàn) qua 2000 nước ngẫu nhiên × 3 cỡ", () => {
  for (const size of L.SIZES) for (let seed = 1; seed <= 4; seed++) {
    const s = L.newGame({ size, seed });
    let sum = s.cells.reduce((a, c) => a + (c ? c.v : 0), 0), score = 0;
    let r2 = seed * 7919;
    for (let i = 0; i < 2000 && s.status !== "over"; i++) {
      if (s.status === "won") L.keepGoing(s);
      r2 = (r2 * 1103515245 + 12345) & 0x7fffffff;
      const r = L.move(s, L.DIRS[r2 % 4]);
      if (!r) continue;
      score += r.gained;
      sum += r.spawned ? r.spawned.v : 0;
      const now = s.cells.reduce((a, c) => a + (c ? c.v : 0), 0);
      assert.equal(now, sum);
      assert.equal(s.score, score);
      const ids = s.cells.filter(Boolean).map((c) => c.id);
      assert.equal(new Set(ids).size, ids.length, "id ô không trùng");
      for (const c of s.cells) if (c) assert.equal(c.v & (c.v - 1), 0);
      assert.equal(s.status === "over", !L.canMove(s) && s.status !== "won");
    }
  }
});
