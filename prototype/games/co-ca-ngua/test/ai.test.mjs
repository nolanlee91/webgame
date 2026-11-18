// Chạy: cd prototype/games/co-ca-ngua && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, roll, move, absCell, legalMoves, BASE } from "../logic.js";
import { botMove, makeRng, threats } from "../ai.js";

const L = 44, GATE = L - 1;
function board(players, pos, seat = 0) {
  const g = createGame({ players, seed: 1 });
  for (const [s, arr] of Object.entries(pos)) g.horses[s] = arr.slice();
  g.turn = g.seats.indexOf(seat);
  return g;
}
const putAt = (g, seat, horse, p) => { g.horses[seat][horse] = (absCell(g, 0, p) - absCell(g, seat, 0) + L) % L; };
function rolled(g, d) { roll(g, d); assert.equal(g.phase, "move", "phải có nước đi"); return g; }

test("máy luôn chọn một nước hợp lệ (2/3/4 người, nhiều ván ngẫu nhiên)", () => {
  for (const n of [2, 3, 4]) for (let seed = 1; seed <= 40; seed++) {
    const g = createGame({ players: n, seed }), rng = makeRng(seed);
    for (let i = 0; i < 400 && g.phase !== "over"; i++) {
      roll(g);
      if (g.phase !== "move") continue;
      const m = botMove(g, rng);
      assert.ok(m && g.moves.includes(m), "nước của máy phải nằm trong danh sách hợp lệ");
      assert.ok(move(g, m.horse));
    }
  }
});

test("không có nước đi / chưa gieo → trả null", () => {
  const g = createGame({ players: 2, seed: 3 });
  assert.equal(botMove(g), null);
});

test("có nước đá ngựa thì máy đá (thay vì đi ngựa khác xa hơn)", () => {
  const g = board(2, { 0: [5, 20, BASE, BASE], 2: [BASE, BASE, BASE, BASE] });
  putAt(g, 2, 0, 8); // ngựa Vàng đứng ở ô ghế 0 đi 8 bước tới
  rolled(g, 3);
  const m = botMove(g, makeRng(1));
  assert.equal(m.horse, 0);
  assert.ok(m.kick && m.kick.seat === 2);
});

test("ưu tiên vào chuồng đích hơn đá ngựa / xuất ngựa", () => {
  const g = board(2, { 0: [GATE, 10, BASE, BASE], 2: [BASE, BASE, BASE, BASE] });
  putAt(g, 2, 0, 12);
  rolled(g, 2);
  const m = botMove(g, makeRng(1));
  assert.equal(m.kind, "enter");
  assert.equal(m.horse, 0);
});

test("nước thắng ván được chọn trước hết", () => {
  // 3 ngựa đã ở bậc 2,3,4; ngựa cuối ở cửa chuồng — gieo 1 vào bậc 1 là thắng
  const g = board(2, { 0: [GATE + 4, GATE + 3, GATE + 2, GATE], 2: [BASE, BASE, BASE, BASE] });
  rolled(g, 1);
  assert.equal(botMove(g, makeRng(1)).horse, 3);
});

test("gieo 6: xuất ngựa hơn là đi ngựa thường", () => {
  const g = board(2, { 0: [10, BASE, BASE, BASE], 2: [BASE, BASE, BASE, BASE] });
  rolled(g, 6);
  assert.equal(botMove(g, makeRng(1)).kind, "launch");
});

test("tránh dừng ngay trước mũi ngựa đối thủ", () => {
  // ngựa 0 ở bước 10, ngựa 1 ở bước 30; đối thủ đứng ở bước 12 của ghế 0.
  // gieo 4: ngựa 0 tới 14 (ngay trước đối thủ 2 ô → dễ bị đá), ngựa 1 tới 34 (an toàn) → chọn ngựa 1
  const g = board(2, { 0: [10, 30, BASE, BASE], 2: [BASE, BASE, BASE, BASE] });
  putAt(g, 2, 0, 12);
  assert.ok(legalMoves(g, 4).length === 1, "ngựa 0 bị chặn khi nhảy qua đối thủ");
  // dựng lại để cả 2 ngựa đều đi được: đối thủ ở phía sau ngựa 0
  const h = board(2, { 0: [10, 30, BASE, BASE], 2: [BASE, BASE, BASE, BASE] });
  putAt(h, 2, 0, 8);
  rolled(h, 2); // ngựa 0 → 12 (đối thủ ở 8, cách 4 → bị dọa); ngựa 1 → 32 (an toàn)
  assert.ok(threats({ ...h, horses: { ...h.horses, 0: [12, 30, BASE, BASE] } }, 0, 12) > 0);
  assert.equal(botMove(h, makeRng(1)).horse, 1);
});

test("cùng rng → cùng lựa chọn (tái hiện được)", () => {
  const play = (seed) => {
    const g = createGame({ players: 4, seed }), rng = makeRng(seed), picks = [];
    for (let i = 0; i < 300 && g.phase !== "over"; i++) { roll(g); if (g.phase === "move") { const m = botMove(g, rng); picks.push(m.horse); move(g, m.horse); } }
    return picks.join("");
  };
  assert.equal(play(11), play(11));
});

test("ván toàn máy (2/3/4 người) luôn kết thúc có người thắng trong số lượt hợp lý", () => {
  for (const n of [2, 3, 4]) for (let seed = 1; seed <= 60; seed++) {
    const g = createGame({ players: n, seed }), rng = makeRng(seed * 7);
    while (g.phase !== "over" && g.rolls < 4000) { roll(g); if (g.phase === "move") move(g, botMove(g, rng).horse); }
    assert.equal(g.phase, "over", `ván ${n} người seed ${seed} không kết thúc`);
    assert.ok(g.seats.includes(g.winner));
  }
});
