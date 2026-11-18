// Cờ Cá Ngựa — "máy" chọn nước đi (thuần, không DOM; chạy được trong Node để test).
// botMove(g, rng) chọn một nước trong g.moves (ván đang ở pha "move"), theo thứ tự ưu tiên:
//   thắng ván > vào / lên bậc chuồng đích > đá ngựa đối thủ (ngựa đi càng xa càng đáng đá) > xuất ngựa
//   > đưa ngựa đang bị dọa ra khỏi chỗ nguy hiểm > ngựa đi xa nhất; tránh dừng ngay trước mũi ngựa đối thủ.
// rng(): số [0,1) chỉ để phá thế hoà giữa các nước điểm bằng nhau → cùng rng thì cùng nước (test tái hiện được).
import { BASE, absCell, currentSeat, hasWon } from "./logic.js";

// Ai đứng ở ô tuyệt đối `cell` (chỉ xét ngựa trên đường chung, kể cả ô cửa chuồng đích).
function occupied(g, cell) {
  const L = g.rules.trackLen;
  for (const s of g.seats) for (const p of g.horses[s]) if (p >= 0 && p < L && absCell(g, s, p) === cell) return true;
  return false;
}

// Ngựa ghế `seat` đứng ở bước `p` có bị đối thủ nào đá được ở lượt kế không (gieo 1–6, không nhảy qua ngựa,
// hoặc ngựa đối thủ trong chuồng xuất ra đúng ô xuất phát của họ). Trả về số "mối đe dọa".
export function threats(g, seat, p) {
  const R = g.rules, L = R.trackLen;
  if (p < 0 || p >= L) return 0;
  const cell = absCell(g, seat, p);
  let n = 0;
  for (const o of g.seats) {
    if (o === seat) continue;
    for (const q of g.horses[o]) {
      if (q === BASE) { if (absCell(g, o, 0) === cell && R.launchOn.length) n++; continue; }
      if (q >= L - 1) continue; // đã ở cửa chuồng đích / trong chuồng: không đi tiếp trên đường chung
      for (let k = 1; k <= 6 && q + k <= L - 1; k++) {
        const c = absCell(g, o, q + k);
        if (c === cell) { n++; break; }
        if (occupied(g, c)) break; // bị chặn, không đi qua được
      }
    }
  }
  return n;
}

// Trạng thái giả định sau nước `m` (chỉ sao chép vị trí ngựa — đủ cho threats/hasWon).
function after(g, seat, m) {
  const horses = {};
  for (const s of g.seats) horses[s] = g.horses[s].slice();
  if (m.kick) horses[m.kick.seat][m.kick.horse] = BASE;
  horses[seat][m.horse] = m.to;
  return { ...g, horses };
}

export function scoreMove(g, m) {
  const seat = currentSeat(g), L = g.rules.trackLen;
  const g2 = after(g, seat, m);
  if (hasWon(g2, seat)) return 100000;
  let s = 0;
  if (m.kind === "enter" || m.kind === "climb") s += 3000 + (m.to - (L - 1)) * 10;
  if (m.kick) s += 2000 + Math.max(0, g.horses[m.kick.seat][m.kick.horse]) * 5;
  if (m.kind === "launch") s += 1000;
  if (m.to === L - 1) s += 150; // tới cửa chuồng đích
  // an toàn: kéo ngựa đang bị dọa đi chỗ khác, tránh dừng ngay trước mũi đối thủ
  if (m.kind !== "launch" && m.from >= 0 && m.from < L) s += 120 * Math.min(2, threats(g, seat, m.from));
  s -= 260 * Math.min(2, threats(g2, seat, m.to));
  s += m.to * 3; // ưu tiên ngựa đi xa
  return s;
}

export function botMove(g, rng = Math.random) {
  if (g.phase !== "move" || !g.moves.length) return null;
  let best = null, bs = -Infinity;
  for (const m of g.moves) {
    const s = scoreMove(g, m) + rng(); // rng < 1: chỉ phá hoà
    if (s > bs) { bs = s; best = m; }
  }
  return best;
}

// RNG có seed (mulberry32) cho máy — tách khỏi xúc xắc của ván.
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
