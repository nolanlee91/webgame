// Chạy: cd prototype/games/co-ty-phu && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGame, roll, decide, payJail, autoplay, drainEvents, current, rentOf, netWorth, TILES, N, JAIL, GO_TO_JAIL, RULES, upgradeCost, baseRent } from "../logic.js";

test("bàn 40 ô khớp loại ô trong asset-manifest", () => {
  const m = JSON.parse(readFileSync(new URL("../assets/asset-manifest.json", import.meta.url)));
  const map = { start: "start", property: "property", "keo-thom": "keo-thom", "keo-thoi": "keo-thoi", jail: "jail", "bus-stop": "bus", "go-to-jail": "go-to-jail" };
  assert.equal(N, 40); assert.equal(m.board.tiles.length, 40);
  m.board.tiles.forEach((t) => assert.equal(TILES[t.id].type, map[t.type], "ô " + t.id));
  assert.equal(TILES.filter((t) => t.type === "property").length, 32);
});

test("tạo ván: người chơi đầu là người, còn lại bot, đủ vốn", () => {
  const g = createGame({ players: 3, human: 2, seed: 1 });
  assert.equal(g.players.length, 3);
  assert.equal(g.players[0].token, 2); assert.equal(g.players[0].bot, false);
  assert.ok(g.players.slice(1).every((p) => p.bot && p.cash === RULES.startCash));
  assert.throws(() => createGame({ players: 5 }));
});

test("mua đất, dừng lại thì nâng cấp tức thì, đối thủ trả tiền thuê", () => {
  const g = createGame({ players: 2, human: 0, seed: 3 });
  roll(g, [1, 1]); // ô 2
  assert.equal(g.phase, "decide"); assert.equal(g.pending.type, "buy");
  decide(g, true);
  assert.equal(g.props[2].owner, 0); assert.equal(g.players[0].cash, RULES.startCash - TILES[2].price);
  roll(g, [1, 1]); // bot tới ô 2 → trả thuê
  assert.equal(g.players[1].cash, RULES.startCash - baseRent(TILES[2].price, 0));
  // vòng lại: người chơi đi đủ 24 bước quay về ô 2 → nâng cấp
  g.players[0].pos = 0; roll(g, [1, 1]);
  assert.equal(g.pending.type, "upgrade"); decide(g, true);
  assert.equal(g.props[2].level, 1);
});

test("đi qua Xuất Phát được +200K; độc quyền vùng nhân đôi thuê", () => {
  const g = createGame({ players: 2, human: 0, seed: 4 });
  g.players[0].pos = N - 2; roll(g, [1, 2]); // qua xuất phát tới ô 1
  assert.equal(g.players[0].pos, 1);
  assert.ok(drainEvents(g).some((e) => e.type === "passStart"));
  TILES.forEach((t, i) => { if (t.region === TILES[1].region) g.props[i].owner = 1; });
  assert.equal(rentOf(g, 1), baseRent(TILES[1].price, 0) * 2);
  g.props[2].owner = 0; assert.equal(rentOf(g, 1), baseRent(TILES[1].price, 0), "thiếu 1 ô thì hết x2");
});

test("vào tù: Vào Tù Ngay đưa về Nhà Tù; đổ đôi ra sớm; nộp phạt ra tù", () => {
  const g = createGame({ players: 2, human: 0, seed: 5 });
  g.players[0].pos = GO_TO_JAIL - 4; roll(g, [2, 2]); // tới Vào Tù Ngay
  assert.equal(g.players[0].pos, JAIL); assert.ok(g.players[0].jailed);
  roll(g, [6, 5]); if (g.phase === "decide") decide(g, false); // bot
  roll(g, [1, 2]); assert.ok(g.players[0].jailed, "không đôi vẫn ở tù"); assert.equal(g.players[0].pos, JAIL);
  roll(g, [6, 5]); if (g.phase === "decide") decide(g, false);
  assert.ok(payJail(g)); assert.equal(g.players[0].jailed, false);
});

test("phá sản: hết tiền + tài sản thì bị loại, còn 1 người thì thắng", () => {
  const g = createGame({ players: 2, human: 0, seed: 6 });
  g.props[39].owner = 1; g.props[39].level = 3; g.players[0].cash = 10; g.players[0].pos = 35;
  roll(g, [2, 2]);
  assert.ok(g.players[0].bankrupt); assert.equal(g.phase, "over"); assert.equal(g.winner, 1);
});

test("hết 25 vòng thì kết thúc, người giàu nhất thắng", () => {
  for (let s = 1; s <= 30; s++) {
    const g = autoplay(createGame({ players: 4, human: null, seed: s }));
    assert.equal(g.phase, "over", "seed " + s);
    assert.ok(g.round <= 25);
    if (g.endReason === "rounds") assert.equal(g.ranking[0].worth, Math.max(...g.players.map((p) => p.bankrupt ? -1 : netWorth(g, p.id))));
    assert.ok(g.players.every((p) => p.bankrupt || p.cash >= 0), "không ai âm tiền");
  }
});
