// Mô phỏng người chơi màn 1 (300 seed): đo thời gian đạt mục tiêu. Chạy: node tools/sim-man1.mjs
// perfect = bấm đúng lúc, không suy nghĩ; normal = nghĩ 0,35–0,85 s, lệch ±70 ms; casual = nghĩ 0,6–1,5 s, lệch ±110 ms.
import { W, CFG, KINDS, createGame, step, fire, tipOf } from "../logic.js";
const DT = 1 / 60;
let s = 12345; const R = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
const gauss = () => Math.sqrt(-2 * Math.log(R() + 1e-9)) * Math.cos(2 * Math.PI * R());
const VAL = { goldS: 50, goldM: 150, goldL: 500, diamond: 600, bag: 150 };
function firstHit(g, h, ang) {
  // vật đầu tiên trên đường thẳng từ trục theo góc ang
  let best = null, bd = 1e9;
  const dx = Math.sin(ang), dy = Math.cos(ang);
  for (const o of g.objects) { if (o.taken) continue;
    const px = o.x - h.x, py = o.y - h.y, t = px * dx + py * dy; if (t < 0) continue;
    const d = Math.abs(px * dy - py * dx); if (d <= o.r + CFG.tipR && t < bd) { bd = t; best = o; } }
  return best;
}
function play(seed, prof) {
  const g = createGame({ seed }); const h = g.hooks[0];
  let plan = null, readyAt = 0, t = 0;
  while (g.status === "playing") {
    if (h.state === "swing") {
      if (!plan && t >= readyAt) {
        const cands = g.objects.filter((o) => VAL[o.kind] && firstHit(g, h, Math.atan2(o.x - h.x, o.y - h.y)) === o && Math.abs(Math.atan2(o.x - h.x, o.y - h.y)) < CFG.maxAngle);
        // Không còn vàng nào lộ đường: gắp đá che đường (đá nhỏ trước).
        if (!cands.length) cands.push(...g.objects.filter((o) => !VAL[o.kind] && o.kind !== "tnt" && firstHit(g, h, Math.atan2(o.x - h.x, o.y - h.y)) === o && Math.abs(Math.atan2(o.x - h.x, o.y - h.y)) < CFG.maxAngle));
        if (!cands.length) { plan = { fireAt: t + 1 }; }
        else {
          const sc = (o) => { const d = Math.hypot(o.x - h.x, o.y - h.y); return (VAL[o.kind] || 20) / (d / CFG.shootSpeed + d / Math.max(CFG.minPull, CFG.pullPower / KINDS[o.kind].weight) + 1.6) * (1 + prof.noise * gauss()); };
          const o = cands.sort((a, b) => sc(b) - sc(a))[0];
          const ta = Math.atan2(o.x - h.x, o.y - h.y);
          let ph = h.phase, k = 0, prev = h.angle;
          for (k = 1; k < 2000; k++) { ph += CFG.swingSpeed * DT; const a = CFG.maxAngle * Math.sin(ph); if ((prev - ta) * (a - ta) <= 0 && k * DT > prof.think()) break; prev = a; }
          plan = { fireAt: t + Math.max(DT, k * DT + (prof.late ? prof.late() : prof.err * gauss())) };
        }
      }
      if (plan && t >= plan.fireAt) { fire(g); plan = null; }
    } else if (!plan) readyAt = t + 0; // khi móc về sẽ tính lại
    const wasBusy = h.state !== "swing";
    step(g, DT); t += DT;
    if (wasBusy && h.state === "swing") readyAt = t;
    if (g.score >= g.target && prof.hit == null) prof.hit = t;
  }
  return { hit: prof.hit, score: g.score, end: t };
}
const PROFILES = {
  perfect: () => ({ think: () => 0, err: 0, noise: 0 }),
  normal: () => ({ think: () => 0.35 + R() * 0.5, err: 0.07, noise: 0.35 }),
  casual: () => ({ think: () => 0.6 + R() * 0.9, err: 0.11, noise: 0.6 }),
};
for (const [name, mk] of Object.entries(PROFILES)) {
  const hits = [], scores = []; let fail = 0;
  for (let seed = 1; seed <= 300; seed++) { const r = play(seed, mk()); scores.push(r.score); if (r.hit == null) fail++; else hits.push(r.hit); }
  hits.sort((a, b) => a - b); scores.sort((a, b) => a - b);
  const q = (a, p) => a.length ? a[Math.floor(p * (a.length - 1))].toFixed(1) : "-";
  console.log(name.padEnd(8), `đạt mục tiêu: trung vị ${q(hits, .5)}s (p25 ${q(hits, .25)} · p75 ${q(hits, .75)}) · không đạt ${fail}/300 · điểm cuối trung vị ${q(scores, .5)}`);
}
