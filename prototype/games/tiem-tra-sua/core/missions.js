// Nhiệm vụ ngày: chọn 3 mục ở đầu ca (RNG của ván ⇒ tải lại không đổi), đếm khi giao / xử lý sự kiện / chốt ca, thưởng một lần.
import { MISSIONS, MISSION, MISSIONS_PER_DAY } from "../data/missions.js";
import { int } from "./rng.js";
import { gainXp } from "./progression.js";
import { fill } from "./text.js";
import { costOfUse } from "./economy.js";

export const missionsUnlocked = (s) => s.level >= 2 && s.tutorialDone;

export function startMissions(s) {
  const sh = s.shift;
  sh.missions = [];
  if (!missionsUnlocked(s) || sh.tutorial) return;
  const pool = MISSIONS.filter((m) => m.unlock <= s.level);
  while (sh.missions.length < MISSIONS_PER_DAY && pool.length) {
    const m = pool.splice(int(s, pool.length), 1)[0];
    sh.missions.push({ id: m.id, text: fill(m.text, { n: m.n }), n: m.n, prog: 0, done: false, reward: { ...m.reward } });
  }
}

function bump(s, m, by, events) {
  if (m.done || by <= 0) return;
  m.prog = Math.min(m.n, m.prog + by);
  if (m.prog >= m.n) complete(s, m, events);
}
function complete(s, m, events) {
  m.done = true; m.prog = m.n;
  const xp = gainXp(s, m.reward.xp, events);
  s.money += m.reward.money;
  s.shift.xp += xp;
  s.stats.missions = (s.stats.missions || 0) + 1;
  s.shift.moments.push({ kind: "mission", name: "", line: "Xong nhiệm vụ: " + m.text });
  events.push({ type: "missionDone", id: m.id, text: m.text, xp, money: m.reward.money });
}

function cupSpec(cup) { const o = {}; for (const st of cup?.steps || []) o[st.step] = st.id; return o; }

export function missionsOnServe(s, c, sc, events) {
  const sh = s.shift;
  for (const m of sh.missions) {
    const kind = MISSION[m.id]?.kind;
    const specs = c.filled.map(cupSpec);
    let by = 0;
    if (kind === "sugarExact") by = specs.filter((sp, i) => sp.sugar === c.items[i].order.sugar).length;
    else if (kind === "iceExact") by = specs.filter((sp, i) => sp.ice === c.items[i].order.ice).length;
    else if (kind === "fiveStars") by = sc.stars === 5 ? 1 : 0;
    else if (kind === "regular4") by = c.arch === "khach-quen" && sc.stars >= 4 ? 1 : 0;
    else if (kind === "multi") by = c.items.length > 1 && sc.stars >= 3 ? 1 : 0;
    else if (kind === "pearls") by = specs.filter((sp) => sp.topping === "tran-chau").length;
    else if (kind === "fast") by = sc.frac <= 0.5 ? c.items.length : 0;
    else if (kind === "cups") by = c.items.length;
    else if (kind === "revenue") { m.prog = Math.min(m.n, sh.ledger.revenue); if (m.prog >= m.n && !m.done) complete(s, m, events); continue; }
    bump(s, m, by, events);
  }
}
export function missionsOnDrama(s, events) {
  for (const m of s.shift?.missions || []) if (MISSION[m.id]?.kind === "drama") bump(s, m, 1, events);
}
export function missionsOnEnd(s, events) {
  const sh = s.shift, Lg = sh.ledger;
  for (const m of sh.missions) {
    if (m.done) continue;
    const kind = MISSION[m.id]?.kind;
    if (kind === "lowWaste") { m.prog = Math.min(m.n, Lg.cups); if (Lg.cups >= m.n && Lg.waste <= 4) complete(s, m, events); }
    else if (kind === "noLost") { m.prog = Math.min(m.n, Lg.served); if (Lg.served >= m.n && Lg.lost === 0) complete(s, m, events); }
  }
}
export { costOfUse };
