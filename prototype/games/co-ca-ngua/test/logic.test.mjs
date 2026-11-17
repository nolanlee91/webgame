// Chạy: cd prototype/games/co-ca-ngua && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, roll, move, legalMoves, absCell, currentSeat, hasWon, autoplay, restart, drainEvents, BASE, SEATS_FOR } from "../logic.js";

const L = 44, GATE = L - 1;
// Bàn tự dựng: đặt ngựa theo ý, đang tới lượt ghế `seat`.
function board(players, pos, seat = 0) {
  const g = createGame({ players, seed: 1 });
  for (const [s, arr] of Object.entries(pos)) g.horses[s] = arr.slice();
  g.turn = g.seats.indexOf(seat);
  return g;
}
const opts = (g, d) => legalMoves(g, d).map((m) => m.horse + ":" + m.kind + "→" + m.to).sort();
// Đặt ngựa `horse` của ghế `seat` vào đúng ô tuyệt đối mà ghế 0 tới sau `p` bước.
const putAt = (g, seat, horse, p) => { g.horses[seat][horse] = (absCell(g, 0, p) - absCell(g, seat, 0) + L) % L; };

test("tạo ván 2/3/4 người: đúng ghế, mỗi người 4 ngựa trong chuồng; số người sai thì báo lỗi", () => {
  for (const n of [2, 3, 4]) {
    const g = createGame({ players: n, seed: 5 });
    assert.deepEqual(g.seats, SEATS_FOR[n]);
    for (const s of g.seats) assert.deepEqual(g.horses[s], [BASE, BASE, BASE, BASE]);
  }
  assert.deepEqual(createGame({ players: 2 }).seats, [0, 2], "2 người ngồi đối diện");
  assert.throws(() => createGame({ players: 5 }));
});

test("cùng seed → cùng chuỗi xúc xắc", () => {
  const a = createGame({ seed: 9 }), b = createGame({ seed: 9 });
  const ra = [], rb = [];
  for (let i = 0; i < 30; i++) {
    ra.push(roll(a)); if (a.phase === "move") move(a, a.moves[0].horse);
    rb.push(roll(b)); if (b.phase === "move") move(b, b.moves[0].horse);
  }
  assert.deepEqual(ra, rb);
  assert.ok(ra.every((d) => d >= 1 && d <= 6));
});

test("chưa gieo 6 thì không xuất ngựa được và mất lượt; gieo 6 xuất ngựa và được gieo thêm", () => {
  const g = createGame({ players: 2, seed: 1 });
  roll(g, 3);
  assert.equal(g.phase, "roll"); assert.equal(currentSeat(g), 2, "mất lượt, sang người kế");
  roll(g, 6);
  assert.equal(g.phase, "move");
  assert.equal(g.moves.length, 4);
  move(g, 0);
  assert.equal(g.horses[2][0], 0, "ngựa ra ô xuất phát");
  assert.equal(currentSeat(g), 2, "gieo 6 được gieo thêm");
  assert.ok(drainEvents(g).some((e) => e.type === "extraTurn"));
});

test("luật tuỳ chọn: xuất ngựa bằng 1 hoặc 6", () => {
  const g = createGame({ players: 2, seed: 1, rules: { launchOn: [1, 6] } });
  roll(g, 1);
  assert.equal(g.phase, "move");
  move(g, 2);
  assert.equal(g.horses[0][2], 0);
  assert.equal(currentSeat(g), 2, "gieo 1 không được gieo thêm");
});

test("đi đúng số bước; không nhảy qua ngựa khác; không dừng lên ngựa mình", () => {
  const g = board(2, { 0: [5, 8, BASE, BASE] });
  assert.deepEqual(opts(g, 2), ["0:move→7", "1:move→10"]);
  assert.deepEqual(opts(g, 3), ["1:move→11"], "ngựa 0 đi 3 bước sẽ dừng lên ngựa 1 → cấm");
  assert.deepEqual(opts(g, 5), ["1:move→13"], "ngựa 0 đi 5 bước phải nhảy qua ngựa 1 → cấm");
  const h = board(2, { 0: [5, BASE, BASE, BASE] });
  putAt(h, 2, 0, 7);
  assert.deepEqual(opts(h, 4), [], "ngựa đối thủ ở bước 7 chắn đường");
  assert.deepEqual(opts(h, 2), ["0:move→7"], "dừng đúng ô đối thủ thì được (đá)");
});

test("đá ngựa: dừng đúng ô đối thủ → đối thủ về chuồng", () => {
  const g = board(2, { 0: [5, BASE, BASE, BASE] });
  putAt(g, 2, 1, 9);
  roll(g, 4);
  const m = move(g, 0);
  assert.ok(m.kick && m.kick.seat === 2 && m.kick.horse === 1);
  assert.equal(g.horses[2][1], BASE);
  assert.equal(g.horses[0][0], 9);
  assert.ok(drainEvents(g).some((e) => e.type === "kick"));
});

test("xuất ngựa đè lên đối thủ ở ô xuất phát → đá; ô xuất phát có ngựa mình → không xuất được", () => {
  const g = board(2, { 0: [BASE, BASE, BASE, BASE] });
  putAt(g, 2, 3, 0);
  roll(g, 6); move(g, 0);
  assert.equal(g.horses[2][3], BASE);
  const h = board(2, { 0: [0, BASE, BASE, BASE] });
  assert.deepEqual(opts(h, 6), ["0:move→6"], "chỉ còn nước đi ngựa đang ở ô xuất phát");
});

test("đi hết vòng phải dừng đúng cửa chuồng; từ cửa gieo n vào bậc n; trong chuồng lên bậc phải gieo đúng", () => {
  const g = board(2, { 0: [GATE - 3, BASE, BASE, BASE] });
  assert.deepEqual(opts(g, 5), [], "đi quá cửa chuồng → cấm");
  assert.deepEqual(opts(g, 3), ["0:move→43"]);
  const h = board(2, { 0: [GATE, BASE, BASE, BASE] });
  assert.deepEqual(opts(h, 3), ["0:enter→46"], "gieo 3 → bậc 3");
  assert.deepEqual(opts(h, 5), [], "chuồng chỉ có 4 bậc");
  const k = board(2, { 0: [GATE + 2, GATE, BASE, BASE] }); // ngựa 0 ở bậc 2, ngựa 1 ở cửa
  assert.deepEqual(opts(k, 3), ["0:climb→46"], "bậc 2 lên bậc 3 cần đúng 3; ngựa ở cửa không vào bậc 3 vì bậc 2 chắn");
  assert.deepEqual(opts(k, 4), [], "bậc 2 không nhảy thẳng lên bậc 4");
  assert.deepEqual(opts(k, 1), ["1:enter→44"]);
});

test("đủ 4 ngựa trong chuồng đích → thắng, ván kết thúc", () => {
  const g = board(2, { 0: [GATE + 4, GATE + 3, GATE + 2, GATE] });
  assert.equal(hasWon(g, 0), false);
  roll(g, 1);
  move(g, 3);
  assert.equal(g.phase, "over");
  assert.equal(g.winner, 0);
  assert.equal(roll(g), null, "hết ván thì không gieo nữa");
});

test("không có nước đi hợp lệ thì tự mất lượt", () => {
  const g = board(2, { 0: [GATE, BASE, BASE, BASE] });
  roll(g, 5);
  assert.equal(currentSeat(g), 2);
});

test("lượt đi theo vòng 3 người / 4 người", () => {
  for (const n of [3, 4]) {
    const g = createGame({ players: n, seed: 1 }), order = [];
    for (let i = 0; i < n + 1; i++) { order.push(currentSeat(g)); roll(g, 2); }
    assert.deepEqual(order, [...SEATS_FOR[n], SEATS_FOR[n][0]]);
  }
});

test("chơi ngẫu nhiên 200 ván × 2/3/4 người: ván nào cũng kết thúc, có người thắng, không 2 ngựa chung ô", () => {
  for (const n of [2, 3, 4]) for (let seed = 1; seed <= 200; seed++) {
    const g = createGame({ players: n, seed });
    let guard = 0;
    while (g.phase !== "over" && guard++ < 8000) {
      roll(g);
      if (g.phase === "move") move(g, g.moves[(g.rolls * 7) % g.moves.length].horse);
      const cells = [];
      for (const s of g.seats) for (const p of g.horses[s]) if (p >= 0 && p < L) cells.push(absCell(g, s, p));
      assert.equal(new Set(cells).size, cells.length, `seed ${seed}: chồng ô`);
    }
    assert.equal(g.phase, "over", `${n} người seed ${seed} không kết thúc`);
    assert.ok(hasWon(g, g.winner));
  }
});

test("độ dài ván (máy chơi khá): số lần gieo hợp lý", () => {
  for (const n of [2, 4]) {
    const r = [];
    for (let seed = 1; seed <= 200; seed++) r.push(autoplay(createGame({ players: n, seed })));
    r.sort((a, b) => a - b);
    console.log(`  ${n} người: trung vị ${r[100]} lần gieo (p10 ${r[20]}, p90 ${r[180]})`);
    assert.ok(r[100] > 40 && r[100] < 1500);
  }
});

test("chơi lại: ván mới, ngựa về chuồng, giữ số người và luật", () => {
  const g = createGame({ players: 3, seed: 4, rules: { launchOn: [1, 6] } });
  autoplay(g);
  const n = restart(g);
  assert.equal(n.players, 3); assert.equal(n.phase, "roll"); assert.deepEqual(n.rules.launchOn, [1, 6]);
  for (const s of n.seats) assert.deepEqual(n.horses[s], [BASE, BASE, BASE, BASE]);
});

test("trạng thái sao chép được (structuredClone) — đưa lên server/replay được", () => {
  const g = createGame({ players: 4, seed: 3 });
  for (let i = 0; i < 20; i++) { roll(g); if (g.phase === "move") move(g, g.moves[0].horse); }
  assert.deepEqual(structuredClone(g), g);
});
