// Nhiệm vụ ngày (ECONOMY §8, chép core/missions.js Trà Sữa): 3 mục chọn ở đầu ca (RNG của ván ⇒ tải lại không đổi) theo cơ chế đã mở,
// đếm khi rút mẻ / giao / thối tiền / xử lý sự kiện / chốt ca, thưởng một lần. Câu vui khi xong / hụt (data/lines-m3.js) lưu thành khoảnh khắc.
import { MISSIONS, MISSIONS_PER_DAY } from "../data/equipment.js?v=b2";
import { MISSION_DONE, MISSION_MISS, MISSION_ALL } from "../data/lines-m3.js?v=b2";
import { int } from "./rng.js?v=b2";
import { fill, freshLine } from "./text.js?v=b2";

export const MISSION = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
export const missionLines = (table, kind) => [...(table[kind] || []), ...table.default];
export const missionsUnlocked = (s) => s.level >= 2 && s.tutorialDone;

export function startMissions(s) {
  const sh = s.shift;
  sh.missions = [];
  if (!missionsUnlocked(s) || sh.tutorial) return;
  const pool = MISSIONS.filter((m) => m.unlock <= s.level && (!m.needs || s.owned?.[m.needs]) && (m.kind !== "preorder" || (s.preorders || []).some((p) => p.day === s.day)));
  while (sh.missions.length < MISSIONS_PER_DAY && pool.length) {
    const m = pool.splice(int(s, pool.length), 1)[0];
    sh.missions.push({ id: m.id, kind: m.kind, text: fill(m.text, { n: m.n }), n: m.n, prog: 0, done: false, reward: { ...m.reward } });
  }
}
function bump(s, m, by, events, gainXp) {
  if (m.done || by <= 0) return;
  m.prog = Math.min(m.n, m.prog + by);
  if (m.prog >= m.n) complete(s, m, events, gainXp);
}
function complete(s, m, events, gainXp) {
  m.done = true; m.prog = m.n;
  const xp = gainXp(s, m.reward.xp, events);
  s.money += m.reward.money;
  s.shift.stats.missionCash = (s.shift.stats.missionCash || 0) + m.reward.money;
  s.stats.missions = (s.stats.missions || 0) + 1;
  const line = freshLine(s, missionLines(MISSION_DONE, m.kind), {});
  s.shift.moments.push({ kind: "mission", name: "", line: `Xong nhiệm vụ “${m.text}”. ${line}` });
  events.push({ type: "missionDone", id: m.id, text: m.text, xp, money: m.reward.money, line });
  const ms = s.shift.missions;
  if (ms.length >= 3 && ms.every((x) => x.done)) {
    const all = freshLine(s, MISSION_ALL, {});
    s.shift.moments.push({ kind: "mission-all", name: "", line: all });
    events.push({ type: "missionsAll", line: all });
  }
}
const each = (s, kind, fn) => { for (const m of s.shift?.missions || []) if (m.kind === kind && !m.done) fn(m); };
export function missionsOnPull(s, level, events, gainXp) { if (level === "golden") each(s, "golden", (m) => bump(s, m, 1, events, gainXp)); }
export function missionsOnChange(s, right, events, gainXp) { if (right) each(s, "change", (m) => bump(s, m, 1, events, gainXp)); }
export function missionsOnDrama(s, events, gainXp) { each(s, "drama", (m) => bump(s, m, 1, events, gainXp)); }
/** Khi chốt tiền một khách. c = khách, sc = điểm. */
export function missionsOnServe(s, c, sc, events, gainXp) {
  const sh = s.shift;
  for (const m of sh.missions || []) {
    if (m.done) continue;
    let by = 0;
    switch (m.kind) {
      case "noSoggy": by = 0; break;
      case "rush": if (sh.phase === "sang" && !c.pre) m.prog = Math.min(m.n, m.prog + 1); continue; // xét lúc chốt ca (không ai bỏ về buổi sáng)
      case "quirks": by = c.items.reduce((a, it, i) => a + (it.quirks.length && !(sc.per[i]?.errors.length) ? 1 : 0), 0); break;
      case "five": by = sc.stars === 5 ? 1 : 0; break;
      case "egg": by = c.filled.filter((f) => f?.fills?.includes("trung")).length; break;
      case "multi": by = c.items.length > 1 && sc.stars >= 3 ? 1 : 0; break;
      case "bachuc": by = c.items.filter((it, i) => it.recipe === "bachuc" && !sc.per[i]?.errors.includes("bachucLow")).length; break;
      case "loaves": by = c.items.length; break;
      case "nhuCu": by = c.nhuCu && sc.stars >= 4 ? 1 : 0; break;
      case "preorder": by = c.pre && c.pre.onTime ? 1 : 0; break;
      case "revenue": m.prog = Math.min(m.n, sh.stats.revenue); if (m.prog >= m.n) complete(s, m, events, gainXp); continue;
      default: continue;
    }
    bump(s, m, by, events, gainXp);
  }
}
/** Chốt ca: nhiệm vụ xét cuối ca + câu an ủi cho nhiệm vụ hụt. */
export function missionsOnEnd(s, info, events, gainXp) {
  const sh = s.shift, st = sh.stats;
  for (const m of sh.missions || []) {
    if (m.done) continue;
    if (m.kind === "noSoggy") { m.prog = Math.min(m.n, st.loaves); if (st.loaves >= m.n && !(st.mistakes.soggy > 0)) complete(s, m, events, gainXp); }
    else if (m.kind === "rush") { if (m.prog >= m.n && !st.lostSang) complete(s, m, events, gainXp); }
    else if (m.kind === "leftover") { m.prog = info.leftover <= m.n ? m.n : 0; if (info.leftover <= m.n && st.loaves >= 4) complete(s, m, events, gainXp); }
    else if (m.kind === "lowWaste") { m.prog = info.waste < m.n ? m.n : 0; if (info.waste < m.n && st.loaves >= 6) complete(s, m, events, gainXp); }
  }
  for (const m of (sh.missions || []).filter((x) => !x.done).slice(0, 2)) {
    sh.moments.push({ kind: "mission-miss", name: "", line: `Hụt nhiệm vụ “${m.text}”. ${freshLine(s, missionLines(MISSION_MISS, m.kind), {})}` });
  }
}
