// Nhiệm vụ hướng dẫn: tuần tự, tiến độ chỉ đếm sự kiện xảy ra khi nhiệm vụ đang mở (dạy đúng cơ chế, không bấm-để-nhận).
// s.quests = { tut: chỉ số nhiệm vụ hiện tại trong QUESTS (hướng dẫn rồi tiến trình; = QUESTS.length ⇒ xong), progress }
// Nhận thưởng: chỉ khi đúng id nhiệm vụ hiện tại và đã đủ tiến độ ⇒ chỉ số tăng ⇒ không nhận 2 lần.
import { QUESTS } from "../data/quests.js?v=m10";
import { addXp } from "./progression.js?v=m10";
import { add } from "./inventory.js?v=m10";

export const currentQuest = (s) => QUESTS[s.quests.tut] || null;
const matches = (e, where) => !where || Object.entries(where).every(([k, v]) => e[k] === v);
const condMet = (s, c) => !!c.building && !!s.buildings?.[c.building]?.done;
// Việc làm một lần (có thể đã làm TRƯỚC khi tới bước này) ⇒ xét theo trạng thái thật, tránh kẹt nhiệm vụ mãi.
const ALREADY = { "mo-o-dat": (s) => s.bought >= 1 }; // "xay-nha-kho" dùng cond (công trình), tự xét theo trạng thái
export const questComplete = (s) => { const q = currentQuest(s); return !!q && s.quests.progress >= q.count; };

/** Cập nhật tiến độ theo sự kiện vừa xảy ra. Đủ ⇒ thêm sự kiện questDone (một lần). */
export function track(s, events) {
  const q = currentQuest(s);
  if (!q || s.quests.progress >= q.count) return;
  if (q.level) s.quests.progress = s.level >= q.level ? q.count : 0;
  else if (q.cond) s.quests.progress = condMet(s, q.cond) ? q.count : 0;
  else if (ALREADY[q.id]?.(s)) s.quests.progress = q.count;
  else for (const e of events) if (e.type === q.event && matches(e, q.where)) s.quests.progress = Math.min(q.count, s.quests.progress + 1);
  if (s.quests.progress >= q.count) events.push({ type: "questDone", id: q.id, title: q.title });
}

export function claim(s, id, events) {
  const q = currentQuest(s);
  if (!q || q.id !== id) return { err: "quest-claimed" };
  if (s.quests.progress < q.count) return { err: "quest-incomplete" };
  s.quests.tut++;
  s.quests.progress = 0;
  const r = q.reward;
  if (r.coins) { s.coins += r.coins; s.stats.earned += r.coins; }
  for (const [m, n] of Object.entries(r.items || {})) add(s, m, n);
  events.push({ type: "questClaimed", id: q.id, title: q.title, reward: r });
  if (r.xp) addXp(s, r.xp, events);
  return { ok: true };
}
