// Milestone 4 — handler sẵn để ghép vào core/apply.js (chăn nuôi + làng). Thuần, không DOM, nhận `now`.
// KHÔNG import core/apply.js / state.js / inventory.js / progression.js: những thứ đó TIÊM vào qua `deps` để file này
// không phụ thuộc chỗ đang sửa và dùng được cả ở trang thử ui/dev-m4.js.
//
//   deps = {
//     bag(s)    -> inv  (core/inventory.js bag)            wallet(s) -> wallet (core/inventory.js wallet)
//     addXp(s, n, events)  (core/progression.js addXp)
//     capacity?(s, kind, now) -> số con tối đa (M3: từ effects() của chuồng). Không có ⇒ core/animals.js đọc s.buildings[*].level
//     isBuilt?(s, id, now) -> bool (M3: build.isBuilt). Không có ⇒ core/village.js đọc s.buildings[*].level > 0
//   }
// Mọi handler có chữ ký (s, a, now, ev, deps) giống HANDLERS trong apply.js (trừ deps) và trả { ok, ... } | { err }.
// Trong apply.js: HANDLERS = { ..., ...bindM4(deps) } — xem core/README-M4.md "Wiring".
import * as A from "./animals.js?v=m6";
import * as V from "./village.js?v=m6";
import { HARD_MAX } from "../data/animals.js?v=m6";

/** ctx cho core/animals.js + core/village.js từ trạng thái. */
export function m4Ctx(s, now, deps = {}) {
  const c = { level: s.level, seed: s.seed, buildings: s.buildings || {}, tutorialDone: V.tutorialDone(s) };
  if (typeof deps.capacity === "function") c.capacity = (kind) => deps.capacity(s, kind, now);
  if (typeof deps.isBuilt === "function") c.hasBuilding = (id) => deps.isBuilt(s, id, now);
  return c;
}
/** io cho phần thưởng nhiệm vụ: trang trí vào túi s.decor (M2/M3). */
export function m4Io(s, deps) {
  return { inv: deps.bag(s), wallet: deps.wallet(s), decor: { add: (id, n) => { s.decor ||= {}; s.decor[id] = (s.decor[id] || 0) + n; } } };
}

/** Bảo đảm field M4 có trong trạng thái (save cũ / tạo mới). Gọi trong createState + loadSave (sau khi kẹp các field khác). */
export function ensureM4(s, raw, now) {
  s.animals = A.sanitize(raw?.animals, now);
  s.village = V.sanitize(raw?.village, now);
  const t = raw?.lastDeliveryAt;
  s.lastDeliveryAt = Number.isFinite(t) && t >= 0 && (!Number.isFinite(now) || t <= now) ? t : null;
  return s;
}

const run = (s, r, ev, deps) => { if (r && r.ok) { ev.push(...r.events); if (r.xp) deps.addXp(s, r.xp, ev); } return r; };

/** Handler M4, đã gắn deps. */
export function bindM4(deps) {
  const H = {
    buyAnimal: (s, a, now, ev) => run(s, A.buyAnimal(s.animals, deps.wallet(s), a.kind, now, m4Ctx(s, now, deps)), ev, deps),
    feedAnimal: (s, a, now, ev) => run(s, A.feed(s.animals, deps.bag(s), a.uid, now), ev, deps),
    feedAll: (s, a, now, ev) => run(s, A.feedAll(s.animals, deps.bag(s), now, a.kind), ev, deps),
    collectAnimal: (s, a, now, ev) => run(s, A.collect(s.animals, deps.bag(s), a.uid, now), ev, deps),
    collectAllAnimals: (s, a, now, ev) => run(s, A.collectAll(s.animals, deps.bag(s), now, a.kind), ev, deps),
    talkNpc: (s, a, now, ev) => run(s, V.talk(s.village, a.npc, now, m4Ctx(s, now, deps)), ev, deps),
    claimProgressQuest: (s, a, now, ev) => run(s, V.claimProgression(s.village, a.id, m4Io(s, deps), m4Ctx(s, now, deps)), ev, deps),
    claimChainStep: (s, a, now, ev) => run(s, V.claimChainStep(s.village, a.npc, a.step, m4Io(s, deps), m4Ctx(s, now, deps)), ev, deps),
    claimBoardQuest: (s, a, now, ev) => run(s, V.claimBoard(s.village, a.uid, m4Io(s, deps), m4Ctx(s, now, deps)), ev, deps),
  };
  return H;
}
export const M4_ACTIONS = Object.freeze(Object.keys(bindM4({ bag() {}, wallet() {}, addXp() {} })));

/** Gọi trong sync() của apply (mỗi action, cả tick): lấp bảng nhiệm vụ làng khi làng mở / lên cấp. */
export function m4Sync(s, now, ev, deps = {}) {
  ev.push(...V.syncVillage(s.village, m4Ctx(s, now, deps)));
}
/** Gọi MỘT lần sau handler (cạnh quests.track của M1) với toàn bộ events: tiến độ nhiệm vụ làng + mốc xe giao hàng.
 *  Thưởng XP không có ở đây (track chỉ báo "xong"; XP cộng lúc nhận). */
export function m4Track(s, ev, now, deps = {}) {
  if (ev.some((e) => e?.type === "delivered")) s.lastDeliveryAt = now;
  ev.push(...V.track(s.village, ev, m4Ctx(s, now, deps)));
}
/** Bất biến thêm cho invariantError(): mỗi loại ≤ HARD_MAX, uid không trùng. Trả mã lỗi | null. */
export function m4InvariantError(s) {
  const list = s.animals?.list;
  if (!Array.isArray(list)) return "animals";
  const per = {}, uids = new Set();
  for (const a of list) {
    if (!a || uids.has(a.uid)) return "animals";
    uids.add(a.uid);
    per[a.kind] = (per[a.kind] || 0) + 1;
    if (per[a.kind] > HARD_MAX) return "animals";
  }
  return null;
}
