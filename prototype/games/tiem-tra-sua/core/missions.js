// Nhiệm vụ ngày: chọn 3 mục ở đầu ca (RNG của ván ⇒ tải lại không đổi), đếm khi giao / xử lý sự kiện / chốt ca, thưởng một lần.
import { MISSIONS, MISSION, MISSIONS_PER_DAY } from "../data/missions.js?v=m36snd";
import { int } from "./rng.js?v=m36snd";
import { gainXp } from "./progression.js?v=m36snd";
import { fill } from "./text.js?v=m36snd";
import { costOfUse } from "./economy.js?v=m36snd";
import { MISSION_DONE, MISSION_MISS, MISSION_ALL } from "../data/lines-m3.js?v=m36snd";
import { freshLine } from "./shift.js?v=m36snd";

/** Câu vui khi xong / hụt nhiệm vụ: câu riêng theo kind + câu chung, không lặp trong ca. */
export const missionLines = (table, kind) => [...(table[kind] || []), ...table.default];

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
  const line = freshLine(s, missionLines(MISSION_DONE, MISSION[m.id]?.kind), {});
  s.shift.moments.push({ kind: "mission", name: "", line: `Xong nhiệm vụ “${m.text}”. ${line}` });
  events.push({ type: "missionDone", id: m.id, text: m.text, xp, money: m.reward.money, line });
  const ms = s.shift.missions;
  if (ms.length >= 3 && ms.every((x) => x.done)) {
    const all = freshLine(s, MISSION_ALL, {});
    s.shift.moments.push({ kind: "mission-all", name: "", line: all });
    events.push({ type: "missionsAll", line: all });
  }
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
  // nhiệm vụ hụt: tối đa hai câu an ủi cho Nhật Ký
  for (const m of sh.missions.filter((x) => !x.done).slice(0, 2)) {
    sh.moments.push({ kind: "mission-miss", name: "", line: `Hụt nhiệm vụ “${m.text}”. ${freshLine(s, missionLines(MISSION_MISS, MISSION[m.id]?.kind), {})}` });
  }
}
export { costOfUse };
