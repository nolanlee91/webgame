// Cờ Cá Ngựa — logic thuần (không DOM, không canvas). Chạy được trong trình duyệt lẫn Node để test.
// Trạng thái là object thường, sao chép được (structuredClone) — sau này đưa lên server (TurnController) được.
//
// Luật mặc định (cá ngựa phổ biến ở Việt Nam, 1 xúc xắc):
//  - Mỗi người 4 ngựa, bắt đầu trong chuồng. Gieo được 6 mới được xuất ngựa ra ô xuất phát.
//  - Gieo 6 được gieo thêm lượt (kể cả khi không đi được).
//  - Ngựa đi đúng số bước theo chiều bàn cờ; KHÔNG được nhảy qua ngựa khác (của mình lẫn đối thủ).
//  - Dừng đúng ô có ngựa đối thủ → "đá" ngựa đó về chuồng. Không được dừng lên ngựa của mình.
//  - Đi hết 1 vòng phải dừng ĐÚNG ô cửa chuồng đích (không đi quá).
//  - Từ cửa chuồng, gieo số n → vào bậc n của chuồng đích (các bậc 1..n phải trống).
//  - Trong chuồng đích, muốn lên bậc k+1 phải gieo đúng k+1.
//  - Ai đưa đủ 4 ngựa lên các bậc cao nhất của chuồng đích trước thì thắng.
// Các con số chỉnh được qua `rules` (VD launchOn: [1, 6] cho luật "1 hoặc 6 được xuất quân").

export const SEAT_COLORS = ["red", "green", "yellow", "blue"]; // thứ tự ghế = thứ tự lượt = chiều đi quân
export const SEAT_NAMES = { red: "Đỏ", green: "Xanh lá", yellow: "Vàng", blue: "Xanh dương" };
export const DEFAULT_RULES = {
  trackLen: 44,      // số ô đường đi chung (bàn 13×13, mỗi nhánh 11 ô) — khớp board.webp
  stableLen: 4,      // số bậc chuồng đích
  horses: 4,
  launchOn: [6],     // mặt xúc xắc được xuất ngựa
  extraTurnOn: [6],  // mặt xúc xắc được gieo thêm
};
// Ghế dùng theo số người: 2 người ngồi đối diện.
export const SEATS_FOR = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] };

// Vị trí ngựa (pos):  -1 = trong chuồng xuất phát;  0..L-1 = số bước đã đi trên đường chung
// (0 = ô xuất phát, L-1 = ô cửa chuồng đích);  L-1+k = bậc k của chuồng đích (k = 1..stableLen).
export const BASE = -1;

// RNG có seed (mulberry32) — cùng seed thì cùng chuỗi xúc xắc, để test và tái hiện ván.
export function rand(g) {
  g.rng = (g.rng + 0x6d2b79f5) >>> 0;
  let t = g.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createGame({ players = 2, seed = Date.now() >>> 0, rules = {} } = {}) {
  const R = { ...DEFAULT_RULES, ...rules };
  const seats = SEATS_FOR[players];
  if (!seats) throw new Error("Số người chơi phải là 2, 3 hoặc 4");
  const horses = {};
  for (const s of seats) horses[s] = Array(R.horses).fill(BASE);
  return {
    rules: R, players, seats, seed, rng: seed >>> 0,
    turn: 0,            // chỉ số trong seats
    phase: "roll",      // roll → (move) → roll … → over
    dice: null, moves: [], horses, winner: null,
    rolls: 0, events: [],
  };
}

export const currentSeat = (g) => g.seats[g.turn];
export const isHome = (g, pos) => pos > g.rules.trackLen - 1;
export const stableLevel = (g, pos) => (isHome(g, pos) ? pos - (g.rules.trackLen - 1) : 0);
// Ô tuyệt đối trên đường chung của ngựa ghế `seat` đã đi `p` bước.
export const absCell = (g, seat, p) => (seat * (g.rules.trackLen / 4) + p) % g.rules.trackLen;

// Ai đang đứng ở ô tuyệt đối `cell` (chỉ xét ngựa trên đường chung).
function occupant(g, cell) {
  const L = g.rules.trackLen;
  for (const s of g.seats) {
    const hs = g.horses[s];
    for (let i = 0; i < hs.length; i++) if (hs[i] >= 0 && hs[i] < L && absCell(g, s, hs[i]) === cell) return { seat: s, horse: i };
  }
  return null;
}

// Các nước đi hợp lệ của ghế đang tới lượt với mặt xúc xắc d.
export function legalMoves(g, d = g.dice) {
  const R = g.rules, L = R.trackLen, S = R.stableLen;
  const seat = currentSeat(g), hs = g.horses[seat], out = [];
  const ownLevel = (k) => hs.some((p) => stableLevel(g, p) === k);
  for (let i = 0; i < hs.length; i++) {
    const p = hs[i];
    if (p === BASE) {
      if (!R.launchOn.includes(d)) continue;
      const occ = occupant(g, absCell(g, seat, 0));
      if (occ && occ.seat === seat) continue;
      out.push({ horse: i, from: p, to: 0, kind: "launch", kick: occ });
    } else if (p < L - 1) {
      const to = p + d;
      if (to > L - 1) continue; // phải dừng đúng cửa chuồng đích
      let blocked = false;
      for (let q = p + 1; q < to; q++) if (occupant(g, absCell(g, seat, q))) { blocked = true; break; }
      if (blocked) continue;
      const occ = occupant(g, absCell(g, seat, to));
      if (occ && occ.seat === seat) continue;
      out.push({ horse: i, from: p, to, kind: "move", kick: occ });
    } else if (p === L - 1) {
      if (d > S) continue;
      let free = true;
      for (let k = 1; k <= d; k++) if (ownLevel(k)) { free = false; break; }
      if (free) out.push({ horse: i, from: p, to: L - 1 + d, kind: "enter", kick: null });
    } else {
      const k = stableLevel(g, p);
      if (d === k + 1 && k + 1 <= S && !ownLevel(k + 1)) out.push({ horse: i, from: p, to: p + 1, kind: "climb", kick: null });
    }
  }
  return out;
}

export function hasWon(g, seat) {
  const S = g.rules.stableLen, hs = g.horses[seat];
  return hs.every((p) => stableLevel(g, p) > S - hs.length);
}

function endTurn(g, d) {
  if (g.phase === "over") return;
  g.phase = "roll";
  g.moves = [];
  if (!g.rules.extraTurnOn.includes(d)) g.turn = (g.turn + 1) % g.seats.length;
  else g.events.push({ type: "extraTurn", seat: currentSeat(g) });
}

// Gieo xúc xắc (chỉ khi tới pha roll). `forced` dùng cho test.
export function roll(g, forced) {
  if (g.phase !== "roll") return null;
  const d = forced || 1 + Math.floor(rand(g) * 6);
  const seat = currentSeat(g);
  g.dice = d;
  g.rolls++;
  g.moves = legalMoves(g, d);
  g.events.push({ type: "roll", seat, dice: d, options: g.moves.length });
  if (!g.moves.length) {
    g.events.push({ type: "noMove", seat, dice: d });
    endTurn(g, d);
  } else g.phase = "move";
  return d;
}

// Đi ngựa số `horse` (0..3) của ghế đang tới lượt. Trả về nước đi đã thực hiện hoặc null nếu không hợp lệ.
export function move(g, horse) {
  if (g.phase !== "move") return null;
  const m = g.moves.find((x) => x.horse === horse);
  if (!m) return null;
  const seat = currentSeat(g);
  if (m.kick) {
    g.horses[m.kick.seat][m.kick.horse] = BASE;
    g.events.push({ type: "kick", seat, victim: m.kick.seat, victimHorse: m.kick.horse });
  }
  g.horses[seat][horse] = m.to;
  g.events.push({ type: "move", seat, horse, from: m.from, to: m.to, kind: m.kind, dice: g.dice });
  if (hasWon(g, seat)) {
    g.phase = "over";
    g.winner = seat;
    g.moves = [];
    g.events.push({ type: "win", seat });
    return m;
  }
  endTurn(g, g.dice);
  return m;
}

// Nước đi "khá" cho máy/test/demo: đá ngựa > vào chuồng > lên bậc > xuất ngựa > ngựa đi xa nhất.
export function pickMove(g) {
  const score = (m) => (m.kick ? 1000 : 0) + (m.kind === "enter" ? 500 : 0) + (m.kind === "climb" ? 400 : 0) + (m.kind === "launch" ? 300 : 0) + m.to;
  return g.moves.slice().sort((a, b) => score(b) - score(a))[0] || null;
}

// Chơi tự động tới hết ván (test/mô phỏng). Trả về số lần gieo.
export function autoplay(g, maxRolls = 5000) {
  while (g.phase !== "over" && g.rolls < maxRolls) {
    roll(g);
    if (g.phase === "move") move(g, pickMove(g).horse);
  }
  return g.rolls;
}

export function restart(g) {
  return createGame({ players: g.players, seed: (g.seed * 31 + 17) >>> 0, rules: g.rules });
}

export function drainEvents(g) {
  const e = g.events;
  g.events = [];
  return e;
}
