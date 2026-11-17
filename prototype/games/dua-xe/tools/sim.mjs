// Bot mô phỏng để chỉnh vật lý / độ khó: node tools/sim.mjs [số ván] [nâng cấp 0-5]
import * as L from '../logic.js';
const N = +process.argv[2] || 10, U = +process.argv[3] || 0;
export function bot(s) {
  const a = L.carAngle(s), x = L.carX(s), sl = L.slopeAt(s.terrain, x + 1.5);
  const air = !s.wc[0] && !s.wc[1];
  if (air) { if (a > sl + 0.25) return { gas: false, brake: true }; if (a < sl - 0.25) return { gas: true, brake: false }; return { gas: false, brake: false }; }
  if (a > 0.95) return { gas: false, brake: a > 1.15 };
  return { gas: true, brake: false };
}
if ((process.argv[1] || '').endsWith('sim.mjs')) {
  const res = [];
  for (let g = 0; g < N; g++) {
    const s = L.newRun(1000 + g, { engine: U, grip: U, tank: U });
    let steps = 0;
    while (s.status !== 'over' && steps < 120 * 600) { L.substep(s, bot(s)); steps++; }
    res.push({ d: s.dist, why: s.reason, coins: s.coins, fuels: s.fuels, t: Math.round(s.t), flips: s.flips });
  }
  console.table(res);
  console.log('avg', Math.round(res.reduce((a, r) => a + r.d, 0) / N));
}
