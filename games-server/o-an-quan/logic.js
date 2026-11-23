"use strict";

const QUAN = [0, 6];
const rows = [[1, 2, 3, 4, 5], [7, 8, 9, 10, 11]];
const next = (cell, dir) => (cell + dir + 12) % 12;

function newGame() {
  return { pits: [0, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5], quan: [true, true], scores: [0, 0] };
}

function play(game, team, cell, dir) {
  if (!rows[team]?.includes(cell) || !game.pits[cell] || (dir !== 1 && dir !== -1)) return null;
  const { pits, quan, scores } = game;
  const trail = [];
  const seen = new Set();
  let captured = 0;
  let cursor = cell;
  while (true) {
    const key = cursor + ":" + pits.join(",");
    if (seen.has(key)) break;
    seen.add(key);
    const count = pits[cursor];
    pits[cursor] = 0;
    for (let i = 0; i < count; i++) {
      cursor = next(cursor, dir);
      pits[cursor]++;
      trail.push(cursor);
    }
    cursor = next(cursor, dir);
    if (!pits[cursor] && !(QUAN.includes(cursor) && quan[cursor / 6])) {
      while (!pits[cursor] && !(QUAN.includes(cursor) && quan[cursor / 6])) {
        const target = next(cursor, dir);
        const hasQuan = QUAN.includes(target) && quan[target / 6];
        if (!pits[target] && !hasQuan) break;
        captured += pits[target] + (hasQuan ? 10 : 0);
        pits[target] = 0;
        if (hasQuan) quan[target / 6] = false;
        cursor = next(target, dir);
      }
      break;
    }
    if (QUAN.includes(cursor)) break;
  }
  scores[team] += captured;
  const over = !quan.some(Boolean);
  if (over) {
    rows.forEach((row, side) => row.forEach((i) => {
      scores[side] += pits[i];
      pits[i] = 0;
    }));
    for (const i of QUAN) {
      scores[team] += pits[i];
      pits[i] = 0;
    }
  } else if (rows[1 - team].every((i) => pits[i] === 0)) {
    scores[1 - team] -= 5;
    for (const i of rows[1 - team]) pits[i] = 1;
  }
  return { captured, trail: [...new Set(trail)], over };
}

module.exports = { play, newGame };
