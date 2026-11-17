// Máy chơi Caro — đánh giá theo mẫu thế cờ (heuristic), không tìm kiếm sâu, chạy tức thì trên điện thoại.
// Mỗi ô trống gần quân đã đặt được chấm điểm = (thế công nếu mình đặt) + (thế thủ nếu đối thủ đặt).
import { DIRS, at, other } from "./logic.js";

// Mẫu trên đoạn 9 ô quanh ô xét: x = quân mình, o = quân địch hoặc mép bàn, . = trống.
const PATTERNS = [
  [/xxxxx/, 1e7],
  [/\.xxxx\./, 1e6],
  [/xxxx\.|\.xxxx|xx\.xx|x\.xxx|xxx\.x/, 1.2e5],
  [/\.xxx\.\.|\.\.xxx\.|\.xx\.x\.|\.x\.xx\./, 1e4],
  [/\.xxx\.|xxx\.\.|\.\.xxx|xx\.x\.|\.x\.xx|x\.xx\.|\.xx\.x|xx\.\.x|x\.\.xx|x\.x\.x/, 900],
  [/\.\.xx\.\.|\.xx\.\.|\.\.xx\.|\.x\.x\.|\.x\.\.x\./, 220],
  [/xx\.\.\.|\.\.\.xx|x\.x\.\.|\.\.x\.x/, 40],
  [/\.\.x\.\./, 12],
];
function lineScore(str) {
  for (const [re, v] of PATTERNS) if (re.test(str)) return v;
  return 0;
}
function lineStr(s, r, c, dr, dc, p, put) {
  let out = "";
  for (let k = -4; k <= 4; k++) {
    const v = k === 0 ? put : at(s, r + dr * k, c + dc * k);
    out += v === p ? "x" : v === 0 ? "." : "o";
  }
  return out;
}
// Lợi ích khi quân p đặt vào (r,c): tổng mức tăng điểm thế cờ trên 4 hướng.
function gain(s, r, c, p) {
  let total = 0, big = 0;
  for (const [dr, dc] of DIRS) {
    const d = lineScore(lineStr(s, r, c, dr, dc, p, p)) - lineScore(lineStr(s, r, c, dr, dc, p, 0));
    if (d > 0) { total += d; if (d >= 900) big++; }
  }
  if (big >= 2) total *= 2.5; // hai thế ba/bốn cùng lúc (đòn kép)
  return total;
}

export function candidates(s, dist = 2) {
  const out = [], n = s.size;
  if (!s.moves.length) return [[n >> 1, n >> 1]];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (s.board[r * n + c]) continue;
    let near = false;
    for (let a = -dist; a <= dist && !near; a++) for (let b = -dist; b <= dist; b++) {
      const v = at(s, r + a, c + b);
      if (v > 0) { near = true; break; }
    }
    if (near) out.push([r, c]);
  }
  return out;
}

// Trả về [r, c]. rnd: hàm ngẫu nhiên 0..1 (cho phép test lặp lại được).
export function bestMove(s, level = "hard", rnd = Math.random) {
  const me = s.turn, op = other(me);
  const scored = candidates(s).map(([r, c]) => {
    const atk = gain(s, r, c, me), def = gain(s, r, c, op);
    // Ưu tiên thắng ngay > chặn thua ngay > tấn công/phòng thủ thường.
    let v = atk * 1.15 + def;
    if (atk >= 1e7) v += 1e9; else if (def >= 1e7) v += 1e8;
    const mid = (s.size - 1) / 2;
    v += 1 - (Math.abs(r - mid) + Math.abs(c - mid)) / (s.size * 2) + rnd() * 0.5;
    return { r, c, v, atk, def };
  }).sort((a, b) => b.v - a.v);
  if (!scored.length) return null;
  if (level === "easy") {
    // Dễ: luôn thắng nếu có thể và chặn nước thắng ngay, còn lại hay bỏ lỡ thế ba của người chơi.
    const must = scored.filter((x) => x.atk >= 1e7 || x.def >= 1e7);
    if (must.length) return [must[0].r, must[0].c];
    const pool = scored.slice(0, 5).map((x) => ({ ...x, w: rnd() * 0.9 + (x.def >= 1e6 ? 0.6 : 0) }));
    pool.sort((a, b) => b.w - a.w);
    return [pool[0].r, pool[0].c];
  }
  return [scored[0].r, scored[0].c];
}
