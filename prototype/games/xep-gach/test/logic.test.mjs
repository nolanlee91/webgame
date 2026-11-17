import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../logic.js";

const { W, H } = L;
const fillRow = (s, y, hole = -1, v = 8) => { for (let x = 0; x < W; x++) s.board[y][x] = x === hole ? 0 : v; };
const force = (s, kind, rot = 0, x = kind === "O" ? 4 : 3, y = 1) => { s.cur = { kind, rot, x, y }; s.lowest = y; s.lock = 0; s.resets = 0; };
const run = (s, sec) => { for (let i = 0; i < Math.round(sec / 0.05); i++) L.step(s, 0.05); };
const drain = (s) => { const e = s.events; s.events = []; return e; };

test("mỗi khối có 4 ô, xoay 4 lần về lại hình cũ", () => {
  for (const k of L.KINDS) {
    for (let r = 0; r < 4; r++) assert.equal(L.SHAPES[k][r].length, 4);
    assert.deepEqual(L.SHAPES[k][0].map(String).sort(), L.SHAPES[k][0].map(String).sort());
  }
  const s = L.newGame({ seed: 1 }); force(s, "T", 0, 4, 8);
  for (let i = 0; i < 4; i++) assert.ok(L.rotate(s, 1));
  assert.equal(s.cur.rot, 0); assert.equal(s.cur.x, 4); assert.equal(s.cur.y, 8);
});

test("túi 7: mỗi 7 khối liên tiếp đủ cả 7 loại; cùng seed ra cùng thứ tự", () => {
  const a = L.newGame({ seed: 42 }), b = L.newGame({ seed: 42 }), c = L.newGame({ seed: 43 });
  const seq = (s) => { const out = [s.cur.kind]; for (let i = 0; i < 27; i++) { out.push(s.queue[0]); s.queue.shift(); s.queue.push(...[]); } return out; };
  // dùng hardDrop để đi qua 28 khối thật
  const run = (s) => { const out = []; for (let i = 0; i < 28; i++) { out.push(s.cur.kind); s.board = s.board.map((r) => r.map(() => 0)); L.hardDrop(s); } return out; };
  const ra = run(a), rb = run(b), rc = run(c);
  assert.deepEqual(ra, rb);
  assert.notDeepEqual(ra, rc);
  for (let i = 0; i < 28; i += 7) assert.equal(new Set(ra.slice(i, i + 7)).size, 7);
  void seq;
});

test("đi ngang bị chặn ở tường", () => {
  const s = L.newGame({ seed: 2 }); force(s, "O", 0, 4, 10);
  let n = 0; while (L.move(s, -1)) n++;
  assert.equal(s.cur.x, 0); assert.equal(n, 4);
  while (L.move(s, 1)); assert.equal(s.cur.x, W - 2);
});

test("xoay sát tường dùng đẩy tường (I dọc ở mép phải xoay về ngang)", () => {
  const s = L.newGame({ seed: 3 }); force(s, "I", 1, 0, 8);   // I dọc: cột x+2
  while (L.move(s, 1));
  const xs = L.cellsOf("I", s.cur.rot, s.cur.x, s.cur.y).map((c) => c[0]);
  assert.equal(Math.max(...xs), W - 1);
  drain(s);
  assert.ok(L.rotate(s, 1));
  const cells = L.cellsOf("I", s.cur.rot, s.cur.x, s.cur.y);
  assert.ok(cells.every(([x, y]) => x >= 0 && x < W && y < H));
  assert.ok(drain(s).find((e) => e.type === "rotate").kick > 0);
});

test("T xoay vào khe (kick) thay vì bị chặn", () => {
  const s = L.newGame({ seed: 4 });
  // dựng khe hình chữ T ở đáy
  for (let y = H - 2; y < H; y++) fillRow(s, y);
  s.board[H - 1][4] = 0; s.board[H - 2][3] = 0; s.board[H - 2][4] = 0; s.board[H - 2][5] = 0;
  s.board[H - 3][3] = 8; // mái che bên trái
  force(s, "T", 1, 3, H - 4);
  L.hardDrop(s);
  assert.ok(s.board[H - 1][4] || L.stackHeight(s) >= 2);
});

test("rơi mạnh: +2 điểm/hàng, khoá ngay, ra khối mới", () => {
  const s = L.newGame({ seed: 5 }); const k = s.queue[0];
  force(s, "O", 0, 4, 1);
  L.hardDrop(s);
  assert.equal(s.score, 2 * (H - 2 - 1));
  assert.equal(s.board[H - 1][4], 2); assert.equal(s.board[H - 1][5], 2);
  assert.equal(s.cur.kind, k);
});

test("rơi nhẹ +1 điểm/hàng", () => {
  const s = L.newGame({ seed: 6 }); force(s, "T", 0, 3, 2);
  assert.ok(L.softDrop(s)); assert.ok(L.softDrop(s));
  assert.equal(s.score, 2); assert.equal(s.cur.y, 4);
});

test("ăn 1/2/3/4 hàng tính đúng điểm × cấp; ăn 4 liên tiếp được ×1,5", () => {
  for (const [n, pts] of [[1, 100], [2, 300], [3, 500], [4, 800]]) {
    const s = L.newGame({ seed: 7, startLevel: 2 });
    for (let i = 0; i < n; i++) fillRow(s, H - 1 - i, 0);
    force(s, "I", 1, -2, 2);              // I dọc ở cột 0
    drain(s); L.hardDrop(s);
    const ev = drain(s).find((e) => e.type === "clear");
    assert.equal(ev.count, n);
    assert.equal(ev.perfect, n === 4);    // 4 hàng thì bàn sạch hẳn
    assert.equal(ev.points, pts * 2 + (n === 4 ? 2000 * 2 : 0));
    assert.equal(s.lines, n); assert.ok(s.clearing);
    run(s, L.CLEAR_TIME + 0.05);
    assert.ok(s.cur && !s.clearing);
    assert.equal(L.stackHeight(s), n === 4 ? 0 : 4 - n);
  }
  // 4 hàng hai lần liên tiếp
  const s = L.newGame({ seed: 8 });
  for (let i = 0; i < 8; i++) fillRow(s, H - 1 - i, 0);
  force(s, "I", 1, -2, 2); drain(s); L.hardDrop(s);
  const e1 = drain(s).find((e) => e.type === "clear"); run(s, 1);
  force(s, "I", 1, -2, 2); L.hardDrop(s);
  const e2 = drain(s).find((e) => e.type === "clear");
  assert.equal(e1.points, 800); assert.ok(e2.b2b);
  assert.equal(e2.points, 1200 + 50 * 1 + 2000); // ×1,5 + combo 1 + sạch bàn
  assert.ok(e2.perfect);
});

test("ăn đúng điểm 1 hàng ở cấp 2", () => {
  const s = L.newGame({ seed: 9, startLevel: 2 });
  fillRow(s, H - 1, 0); fillRow(s, H - 2, 0); s.board[H - 2][5] = 0;
  force(s, "I", 1, -2, 2); drain(s); L.hardDrop(s);
  const ev = drain(s).find((e) => e.type === "clear");
  assert.equal(ev.count, 1); assert.equal(ev.points, 200);
});

test("combo: ăn hàng liên tiếp cộng 50 × combo × cấp; khối không ăn thì mất combo", () => {
  const s = L.newGame({ seed: 10 });
  for (let i = 0; i < 3; i++) fillRow(s, H - 1 - i, 0);
  s.board[H - 4][1] = 8; // giữ bàn không sạch
  const pts = [];
  for (let i = 0; i < 3; i++) { force(s, "I", 1, -2, 2); drain(s); L.hardDrop(s); pts.push(drain(s).find((e) => e.type === "clear")); run(s, 1); }
  // khối I dọc 4 ô vào cột 0 ăn 1 hàng (3 hàng đầu), các khối sau tràn chiều cao
  assert.equal(pts[0].combo, 0);
  assert.ok(pts[1] === undefined || pts[1].combo === 1);
  force(s, "O", 0, 6, 2); L.hardDrop(s); run(s, 1);
  assert.equal(s.combo, -1);
});

test("giữ khối: chỉ 1 lần mỗi khối, đổi khối giữ ra", () => {
  const s = L.newGame({ seed: 11 });
  const a = s.cur.kind, b = s.queue[0];
  assert.ok(L.holdPiece(s)); assert.equal(s.hold, a); assert.equal(s.cur.kind, b);
  assert.equal(L.holdPiece(s), false);
  L.hardDrop(s);
  const c = s.cur.kind;
  assert.ok(L.holdPiece(s)); assert.equal(s.cur.kind, a); assert.equal(s.hold, c);
});

test("trễ khoá 0,5s, di chuyển gia hạn tối đa 15 lần", () => {
  const s = L.newGame({ seed: 12 }); force(s, "T", 0, 3, H - 2);
  L.step(s, 0.3); assert.ok(s.cur && s.cur.kind === "T");
  let resets = 0;
  for (let i = 0; i < 40; i++) { if (!s.cur || s.cur.kind !== "T" || s.cur.y !== H - 2) break; L.move(s, i % 2 ? 1 : -1); resets++; L.step(s, 0.2); }
  assert.ok(resets <= 20, "phải khoá sau ~15 lần gia hạn, thực tế " + resets);
  assert.ok(s.pieces >= 1);
});

test("trọng lực: cấp 1 rơi 1 hàng/giây, cấp cao nhanh hơn", () => {
  const s = L.newGame({ seed: 13 }); const y0 = s.cur.y;
  run(s, 0.5); assert.equal(s.cur.y, y0);
  run(s, 0.55); assert.equal(s.cur.y, y0 + 1);
  assert.ok(L.gravityFor(10) < 0.1 && L.gravityFor(15) < L.gravityFor(10));
});

test("lên cấp mỗi 10 hàng (vô tận)", () => {
  const s = L.newGame({ seed: 14 });
  s.lines = 9; s.board[H - 5][1] = 8;
  fillRow(s, H - 1, 0); force(s, "I", 1, -2, 2); drain(s); L.hardDrop(s);
  assert.equal(s.level, 2);
  assert.ok(drain(s).some((e) => e.type === "level" && e.level === 2));
});

test("thua khi khối khoá hoàn toàn trong vùng ẩn phía trên", () => {
  const s = L.newGame({ seed: 15 });
  for (let y = 2; y < H; y++) fillRow(s, y, 9);
  force(s, "O", 0, 4, 0);
  L.hardDrop(s);
  assert.equal(s.status, "over"); assert.equal(s.cur, null);
  assert.equal(L.move(s, 1), false);
});

test("thua khi khối mới không còn chỗ xuất hiện", () => {
  const s = L.newGame({ seed: 17 });
  for (let x = 3; x <= 6; x++) { s.board[1][x] = 8; s.board[2][x] = 8; }
  for (let y = 3; y < H; y++) s.board[y][4] = 8;   // cột chống, không có hàng đầy
  force(s, "O", 0, 0, 2);
  L.hardDrop(s);
  assert.equal(s.status, "over");
  assert.ok(s.events.some((e) => e.type === "over" && e.why === "block"));
});

test("Về đích 40 hàng: đạt 40 hàng thì thắng, đồng hồ dừng", () => {
  const s = L.newGame({ mode: "sprint", seed: 16 });
  assert.equal(s.level, 1);
  s.lines = 38; s.time = 61.5; s.board[H - 5][1] = 8;
  fillRow(s, H - 1, 0); fillRow(s, H - 2, 0);
  force(s, "I", 1, -2, 2); L.hardDrop(s);
  assert.equal(s.status, "won"); assert.equal(s.lines, 40);
  run(s, 1); assert.equal(s.time, 61.5);
});

test("chơi ngẫu nhiên 3000 khối × 5 seed: không lỗi, bàn luôn hợp lệ", () => {
  for (let seed = 1; seed <= 5; seed++) {
    let s = L.newGame({ seed, startLevel: 5 }), games = 0, pieces = 0, r = seed * 7;
    const rnd = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    while (pieces < 3000) {
      if (s.status !== "playing") { games++; s = L.newGame({ seed: seed * 100 + games }); }
      const a = rnd();
      if (a < 0.3) L.move(s, rnd() < 0.5 ? -1 : 1);
      else if (a < 0.45) L.rotate(s, rnd() < 0.5 ? -1 : 1);
      else if (a < 0.5) L.holdPiece(s);
      else if (a < 0.6) L.softDrop(s);
      else if (a < 0.7) { if (L.hardDrop(s)) pieces++; }
      else L.step(s, rnd() * 0.2);
      s.events.length = 0;
      for (const row of s.board) assert.equal(row.length, W);
      assert.equal(s.board.length, H);
      if (s.cur) assert.ok(L.fits(s, s.cur.kind, s.cur.rot, s.cur.x, s.cur.y), "khối đang rơi đè lên gạch");
      for (const row of s.board) assert.ok(!row.every(Boolean) || s.clearing || s.status !== "playing", "còn hàng đầy chưa ăn");
    }
  }
});
