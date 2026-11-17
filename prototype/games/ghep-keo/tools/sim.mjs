// Cân độ khó: cho bot chơi mỗi màn nhiều lần, in tỉ lệ qua màn và số sao.
import * as L from "../logic.js";
const RUNS = +process.argv[2] || 60;
function allMoves(c) { const out = []; for (let i = 0; i < L.N; i++) for (const j of [L.X(i) < 7 ? i + 1 : -1, L.Y(i) < 7 ? i + 8 : -1]) if (j >= 0 && L.validSwap(c, i, j)) out.push([i, j]); return out; }
function play(level, seed, greedy) {
  const s = L.newGame({ level, seed }); let guard = 0;
  while (s.status === "playing" && guard++ < 200) {
    let m;
    if (greedy) m = L.findMove(s.cells); else { const ms = allMoves(s.cells); m = ms[Math.floor(L.rngNext({ rng: seed * 31 + guard }) * ms.length)]; }
    if (!m || !L.swap(s, m[0], m[1])) throw new Error("bế tắc " + level + " " + seed);
  }
  return s;
}
const t0 = Date.now();
for (let lv = 1; lv <= L.LEVELS.length; lv++) {
  const row = [];
  for (const greedy of [true, false]) {
    let win = 0, stars = [0, 0, 0, 0], sc = 0;
    for (let r = 0; r < RUNS; r++) { const s = play(lv, 1000 + r * 77, greedy); if (s.status === "won") { win++; stars[s.stars]++; } sc += s.score; }
    row.push(`${greedy ? "giỏi" : "ngẫu"} ${String(Math.round(win / RUNS * 100)).padStart(3)}% sao1/2/3=${stars.slice(1).join("/")} tbđiểm ${Math.round(sc / RUNS)}`);
  }
  console.log("màn " + String(lv).padStart(2), JSON.stringify(L.LEVELS[lv - 1]).padEnd(70), row.join(" | "));
}
console.log((Date.now() - t0) + "ms");
