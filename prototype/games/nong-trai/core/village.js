// Làng, NPC, nhiệm vụ M4 — luật thuần (DESIGN-2.0 §5, Milestone 4). Không DOM, không biến toàn cục.
//
// TRẠNG THÁI (lưu trong save, field `village`):
//   village = {
//     friends: { [npcId]: { points, lastTalkAt, talks } },  // thân thiết (điểm), lần cộng điểm trò chuyện gần nhất, số lần trò chuyện
//     prog:    { i, progress },                             // nhiệm vụ tiến trình M4: chỉ số hiện tại (= PROGRESSION.length ⇒ xong)
//     chains:  { [npcId]: { step, progress } },             // nhiệm vụ chuỗi: bước hiện tại (= 3 ⇒ xong)
//     board:   { slots: [{ uid, tpl, progress }], nextUid, seq },  // bảng lặp lại: 3 ô; seq = bộ đếm chọn mẫu (tất định)
//   }
// Tiến độ CHỈ đếm sự kiện xảy ra khi nhiệm vụ đang mở (giống M1). Nhận thưởng: id/bước phải đúng nhiệm vụ hiện tại
// và đủ tiến độ ⇒ chỉ số tăng / ô bị thay ⇒ không thể nhận 2 lần.
//
// GIAO DIỆN TIÊM VÀO:
//   ctx = { level, seed?, buildings?, hasBuilding?(id) -> bool, tutorialDone? }
//         hasBuilding: công trình đã XÂY XONG (M3). Không có ⇒ đọc ctx.buildings (object {id: level|{level}|true}, mảng, Set).
//         tutorialDone: false ⇒ nhiệm vụ TIẾN TRÌNH M4 chưa mở (chờ hướng dẫn M1 xong). Ghép: tutorialDone: tutorialDone(s).
//         Bỏ trống (undefined) ⇒ coi như đã xong (tương thích test / công cụ cũ). Bảng lặp lại + chuỗi NPC không phụ thuộc cờ này.
//   io  = { inv, wallet, decor? }   inv / wallet như core/production.js; decor = { add(id, n) } (túi trang trí).
//         Không có decor ⇒ trang trí thưởng đi qua inv.add.
// XP thưởng KHÔNG cộng ở đây: kết quả trả `xp`, apply() cộng qua progression (lên cấp, sự kiện) như production.collect.
// Hàm trả { ok: true, ..., events } hoặc { err }; khi err thì không đổi gì.

import {
  VILLAGE_LEVEL, CHAIN_LEVEL, BOARD_SIZE, FRIEND_LEVELS, FRIEND_POINTS, TALK_COOLDOWN_MS, FRIEND_MAX,
  VILLAGERS, VILLAGER, PROGRESSION, REPEATABLE, REPEATABLE_BY_ID, TRUCK,
} from "../data/village.js?v=m6s";
import { TUTORIAL } from "../data/quests.js?v=m6s";

export const ERR = Object.freeze({
  BAD: "bad", LOCKED: "locked", CLAIMED: "quest-claimed", INCOMPLETE: "quest-incomplete", GIVE: "give-stock", FULL: "full",
});

const isTime = (t) => Number.isFinite(t);
const own = (o, k) => !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
const OWN_EVENTS = new Set(["villageQuestDone", "villageQuestClaimed", "questDone", "questClaimed", "boardRefilled", "friendUp", "chainComplete"]);

export function createVillage() {
  return {
    friends: Object.fromEntries(VILLAGERS.map((v) => [v.id, { points: 0, lastTalkAt: null, talks: 0 }])),
    prog: { i: 0, progress: 0 },
    chains: Object.fromEntries(VILLAGERS.map((v) => [v.id, { step: 0, progress: 0 }])),
    board: { slots: [], nextUid: 1, seq: 0 },
  };
}

export const villageUnlocked = (ctx) => (ctx?.level ?? 0) >= VILLAGE_LEVEL;
/** Hướng dẫn M1 đã xong (s.quests.tut đã qua hết TUTORIAL) ⇒ nhiệm vụ tiến trình M4 được mở. Truyền vào ctx.tutorialDone. */
export const tutorialDone = (s) => Number.isInteger(s?.quests?.tut) && s.quests.tut >= TUTORIAL.length;
/** Cờ trong ctx: chỉ false tường minh mới chặn (undefined ⇒ không chặn). */
const tutOk = (ctx) => ctx?.tutorialDone !== false;
export const chainsUnlocked = (ctx) => (ctx?.level ?? 0) >= CHAIN_LEVEL;

function hasBuilding(ctx, id) {
  if (typeof ctx?.hasBuilding === "function") return !!ctx.hasBuilding(id);
  const b = ctx?.buildings;
  if (!b) return false;
  if (b instanceof Set || Array.isArray(b)) return [...b].includes(id);
  if (!own(b, id)) return false;
  const v = b[id];
  if (Number.isInteger(v)) return v > 0;
  if (v && typeof v === "object") return v.level === undefined || v.level > 0;
  return !!v;
}

// ---------- So khớp sự kiện ----------
const eventTypes = (q) => (Array.isArray(q.event) ? q.event : q.event ? [q.event] : []);

/** Sự kiện e có khớp điều kiện (event / match / hasItem) không. */
export function matches(cond, e) {
  if (!e || typeof e !== "object" || !eventTypes(cond).includes(e.type)) return false;
  for (const [k, want] of Object.entries(cond.match || {})) {
    if (Array.isArray(want) ? !want.includes(e[k]) : e[k] !== want) return false;
  }
  if (cond.hasItem) {
    const items = e.items && typeof e.items === "object" ? e.items : null;
    if (!items || !cond.hasItem.some((id) => Number(items[id]) > 0)) return false;
  }
  return true;
}
/** Lượng tiến độ mà 1 sự kiện khớp đóng góp. */
function amountOf(q, e) {
  if (!q.amount) return 1;
  const n = e[q.amount];
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

const isStateQuest = (q) => q.level !== undefined || q.building !== undefined;

/** Cập nhật tiến độ 1 nhiệm vụ theo danh sách sự kiện. Trả tiến độ mới (kẹp ≤ count). */
function advance(q, progress, events, ctx) {
  if (progress >= q.count) return q.count;
  if (q.give) return 0; // trao tay: đủ hay chưa là do kho, kiểm lúc nhận
  if (isStateQuest(q)) {
    const okLv = q.level === undefined || (ctx?.level ?? 0) >= q.level;
    const okB = q.building === undefined || hasBuilding(ctx, q.building);
    return okLv && okB ? q.count : 0;
  }
  let p = progress;
  for (const e of events) {
    if (!e || OWN_EVENTS.has(e.type)) continue;
    if (q.steps) { if (p < q.steps.length && matches(q.steps[p], e)) p++; }
    else if (matches(q, e)) p += amountOf(q, e);
    if (p >= q.count) return q.count;
  }
  return p;
}

// ---------- Chọn nhiệm vụ ----------
export const currentProgression = (vs) => PROGRESSION[vs.prog.i] || null;
const progActive = (vs, ctx) => { const q = currentProgression(vs); return !!q && tutOk(ctx) && (ctx?.level ?? 0) >= (q.minLevel ?? 0); };
export const currentChainStep = (vs, npc) => VILLAGER[npc]?.chain.steps[vs.chains[npc]?.step] || null;

function hash32(a, b) {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Lấp ô trống trên bảng lặp lại (tất định theo seed + seq). Không trùng mẫu trên bảng. */
function fillBoard(vs, ctx, events) {
  if (!villageUnlocked(ctx)) return;
  const b = vs.board;
  while (b.slots.length < BOARD_SIZE) {
    const onBoard = new Set(b.slots.map((s) => s.tpl));
    const pool = REPEATABLE.filter((q) => (ctx.level ?? 0) >= q.minLevel && !onBoard.has(q.id));
    if (!pool.length) break;
    const tpl = pool[hash32((ctx.seed ?? 0) >>> 0, b.seq++) % pool.length];
    const slot = { uid: b.nextUid++, tpl: tpl.id, progress: 0 };
    b.slots.push(slot);
    events.push({ type: "boardRefilled", uid: slot.uid, id: tpl.id });
  }
}

/** Gọi mỗi lần apply() (trước track): lấp bảng lặp lại khi làng mở / sau khi nhận. Trả events. */
export function syncVillage(vs, ctx) {
  const events = [];
  fillBoard(vs, ctx, events);
  return events;
}

/** Đếm tiến độ mọi nhiệm vụ đang mở từ sự kiện của action vừa chạy. Trả sự kiện mới (villageQuestDone, friendUp). */
export function track(vs, events, ctx) {
  const out = [];
  if (!Array.isArray(events)) return out;
  const done = (scope, id, title, extra = {}) => out.push({ type: "villageQuestDone", scope, id, title, ...extra });
  // thân thiết: đơn của NPC
  if (villageUnlocked(ctx)) {
    for (const e of events) {
      if (e?.type === "delivered" && own(vs.friends, e.npc)) addPoints(vs, e.npc, FRIEND_POINTS.deliver, out);
    }
  }
  // tiến trình
  if (progActive(vs, ctx)) {
    const q = currentProgression(vs), before = vs.prog.progress;
    vs.prog.progress = advance(q, before, events, ctx);
    if (before < q.count && vs.prog.progress >= q.count) done("progression", q.id, q.title);
  }
  // chuỗi NPC
  if (villageUnlocked(ctx) && chainsUnlocked(ctx)) {
    for (const v of VILLAGERS) {
      const st = vs.chains[v.id], q = currentChainStep(vs, v.id);
      if (!q || q.give) continue;
      const before = st.progress;
      st.progress = advance(q, before, events, ctx);
      if (before < q.count && st.progress >= q.count) done("chain", q.id, q.title, { npc: v.id, step: st.step });
    }
  }
  // bảng lặp lại
  if (villageUnlocked(ctx)) {
    for (const slot of vs.board.slots) {
      const q = REPEATABLE_BY_ID[slot.tpl];
      if (!q) continue;
      const before = slot.progress;
      slot.progress = advance(q, before, events, ctx);
      if (before < q.count && slot.progress >= q.count) done("board", q.id, q.title, { uid: slot.uid });
    }
  }
  return out;
}

// ---------- Thưởng ----------
function giveOk(inv, give) { return Object.entries(give || {}).every(([id, n]) => inv.has(id, n)); }

/** Trừ món trao tay + trao thưởng, nguyên tử (lỗi giữa chừng ⇒ hoàn lại). */
function settle(io, give, reward) {
  const { inv, wallet, decor } = io;
  const taken = [], added = [];
  const rollback = () => {
    for (const [id, n] of added) inv.take(id, n);
    for (const [id, n] of taken) inv.add(id, n);
  };
  for (const [id, n] of Object.entries(give || {})) {
    if (!inv.take(id, n)) { rollback(); return ERR.GIVE; }
    taken.push([id, n]);
  }
  const items = { ...(reward.items || {}) };
  if (!decor) for (const [id, n] of Object.entries(reward.decor || {})) items[id] = (items[id] || 0) + n;
  for (const [id, n] of Object.entries(items)) {
    if ((inv.canAdd && !inv.canAdd(id, n)) || !inv.add(id, n)?.ok) { rollback(); return ERR.FULL; }
    added.push([id, n]);
  }
  if (decor) for (const [id, n] of Object.entries(reward.decor || {})) { decor.add(id, n); }
  if (reward.coins) wallet.earn(reward.coins);
  return null;
}

function claimed(scope, q, extra) {
  const reward = { coins: 0, xp: 0, items: {}, decor: {}, ...q.reward };
  return { ok: true, id: q.id, xp: reward.xp || 0, reward,
    events: [{ type: "villageQuestClaimed", scope, id: q.id, title: q.title, reward, ...extra }] };
}

/** Nhận thưởng nhiệm vụ tiến trình hiện tại. */
export function claimProgression(vs, id, io, ctx) {
  const q = currentProgression(vs);
  if (!q || q.id !== id) return { err: ERR.CLAIMED };
  if (!progActive(vs, ctx)) return { err: ERR.LOCKED };
  if (q.give ? !giveOk(io.inv, q.give) : vs.prog.progress < q.count) return { err: q.give ? ERR.GIVE : ERR.INCOMPLETE };
  const e = settle(io, q.give, q.reward);
  if (e) return { err: e };
  vs.prog.i++;
  vs.prog.progress = 0;
  return claimed("progression", q, {});
}

/** Nhận thưởng bước `step` của chuỗi NPC (phải đúng bước hiện tại ⇒ đúng thứ tự, không nhận 2 lần). */
export function claimChainStep(vs, npc, step, io, ctx) {
  if (!own(VILLAGER, npc) || !Number.isInteger(step)) return { err: ERR.BAD };
  if (!villageUnlocked(ctx) || !chainsUnlocked(ctx)) return { err: ERR.LOCKED };
  const st = vs.chains[npc], q = currentChainStep(vs, npc);
  if (!q || st.step !== step) return { err: ERR.CLAIMED };
  if (q.give ? !giveOk(io.inv, q.give) : st.progress < q.count) return { err: q.give ? ERR.GIVE : ERR.INCOMPLETE };
  const e = settle(io, q.give, q.reward);
  if (e) return { err: e };
  st.step++;
  st.progress = 0;
  const r = claimed("chain", q, { npc, step });
  addPoints(vs, npc, FRIEND_POINTS.chainStep, r.events);
  if (!currentChainStep(vs, npc)) r.events.push({ type: "chainComplete", npc, title: VILLAGER[npc].chain.title });
  return r;
}

/** Nhận thưởng 1 ô bảng lặp lại ⇒ ô được thay bằng nhiệm vụ mới (làm mới khi xong). */
export function claimBoard(vs, uid, io, ctx) {
  if (!villageUnlocked(ctx)) return { err: ERR.LOCKED };
  const i = vs.board.slots.findIndex((s) => s.uid === uid);
  if (i < 0) return { err: ERR.CLAIMED };
  const slot = vs.board.slots[i], q = REPEATABLE_BY_ID[slot.tpl];
  if (!q) return { err: ERR.BAD };
  if (slot.progress < q.count) return { err: ERR.INCOMPLETE };
  const e = settle(io, null, q.reward);
  if (e) return { err: e };
  vs.board.slots.splice(i, 1);
  const r = claimed("board", q, { uid });
  fillBoard(vs, ctx, r.events);
  return r;
}

// ---------- Thân thiết & trò chuyện ----------
export function friendLevel(points) {
  let k = 0;
  for (let i = 0; i < FRIEND_LEVELS.length; i++) if (points >= FRIEND_LEVELS[i].min) k = i;
  return { index: k, name: FRIEND_LEVELS[k].name, next: FRIEND_LEVELS[k + 1]?.min ?? null };
}
function addPoints(vs, npc, n, events) {
  const f = vs.friends[npc];
  const before = friendLevel(f.points).index;
  f.points = Math.min(FRIEND_MAX, f.points + n);
  const after = friendLevel(f.points);
  if (after.index > before) events.push({ type: "friendUp", npc, level: after.index, name: after.name });
}

/** Trò chuyện: câu thoại xoay vòng (tất định), +1 thân thiết tối đa 1 lần / 4 giờ / NPC. */
export function talk(vs, npc, now, ctx) {
  if (!own(VILLAGER, npc) || !isTime(now)) return { err: ERR.BAD };
  if (!villageUnlocked(ctx)) return { err: ERR.LOCKED };
  const v = VILLAGER[npc], f = vs.friends[npc];
  const line = v.lines[f.talks % v.lines.length];
  f.talks = Math.min(Number.MAX_SAFE_INTEGER, f.talks + 1);
  const events = [];
  let points = 0;
  if (f.lastTalkAt === null || now - f.lastTalkAt >= TALK_COOLDOWN_MS || now < f.lastTalkAt) {
    f.lastTalkAt = now;
    points = FRIEND_POINTS.talk;
    addPoints(vs, npc, points, events);
  }
  const step = chainsUnlocked(ctx) ? currentChainStep(vs, npc) : null;
  events.unshift({ type: "npcTalked", npc, points, line });
  return { ok: true, npc, line, points, friendship: { points: f.points, ...friendLevel(f.points) },
    chain: step ? { title: v.chain.title, intro: vs.chains[npc].step === 0 ? v.chain.intro : null, step: vs.chains[npc].step, quest: step.title } : null,
    events };
}

// ---------- Sổ nhiệm vụ (cho giao diện) ----------
function view(q, progress, inv) {
  if (q.give) {
    const need = Object.entries(q.give).map(([id, n]) => ({ id, need: n, have: inv ? Math.min(n, inv.count(id)) : 0 }));
    const ok = !!inv && need.every((x) => x.have >= x.need);
    return { id: q.id, title: q.title, hint: q.hint, give: need, progress: ok ? 1 : 0, count: 1, claimable: ok, reward: q.reward };
  }
  return { id: q.id, title: q.title, hint: q.hint, progress, count: q.count, claimable: progress >= q.count, reward: q.reward,
    steps: q.steps ? q.steps.length : undefined };
}

/** Toàn bộ nhiệm vụ M4 đang thấy được. inv (tuỳ chọn) để tính "trao tay" đủ chưa. */
export function questLog(vs, ctx, inv) {
  const pq = currentProgression(vs);
  return {
    villageUnlocked: villageUnlocked(ctx),
    progression: pq && progActive(vs, ctx) ? view(pq, vs.prog.progress, inv) : null,
    progressionNext: pq && !progActive(vs, ctx)
      ? { id: pq.id, title: pq.title, minLevel: pq.minLevel, reason: !tutOk(ctx) ? "tutorial" : "level" } : null,
    chains: VILLAGERS.map((v) => {
      const st = vs.chains[v.id], q = currentChainStep(vs, v.id);
      return { npc: v.id, title: v.chain.title, step: st.step, total: v.chain.steps.length,
        locked: !villageUnlocked(ctx) || !chainsUnlocked(ctx), done: !q, quest: q ? view(q, st.progress, inv) : null };
    }),
    board: villageUnlocked(ctx) ? vs.board.slots.map((s) => ({ uid: s.uid, ...view(REPEATABLE_BY_ID[s.tpl], s.progress, inv) })) : [],
    friends: VILLAGERS.map((v) => ({ npc: v.id, points: vs.friends[v.id].points, ...friendLevel(vs.friends[v.id].points) })),
  };
}

// ---------- Tương thích M1 ----------
/** Đổi nhiệm vụ M4 sang định dạng TUTORIAL của M1 nếu biểu diễn được (1 loại sự kiện, +1 mỗi sự kiện, không lọc).
 *  core/quests.js của M1 chỉ đếm `e.type === q.event` từng cái một ⇒ không lọc theo món / NPC, không cộng `qty`,
 *  không có chuỗi bước / trao tay / công trình ⇒ những nhiệm vụ đó trả null và chạy bằng track() ở file này. */
export function asM1Quest(q) {
  if (!q || q.match || q.hasItem || q.amount || q.steps || q.give || q.building || Array.isArray(q.event)) return null;
  if (!q.event && q.level === undefined) return null;
  const out = { id: q.id, title: q.title, hint: q.hint, count: q.count, reward: { coins: q.reward.coins || 0, xp: q.reward.xp || 0, items: { ...(q.reward.items || {}) } }, target: null, arrow: false };
  if (q.event) out.event = q.event; else out.level = q.level;
  return out;
}

// ---------- Kẹp save ----------
const int = (v, lo, hi, d) => (Number.isSafeInteger(v) ? Math.min(hi, Math.max(lo, v)) : d);

/** Sửa dữ liệu làng đọc từ save. now (tuỳ chọn) ⇒ kẹp lastTalkAt ở tương lai. */
export function sanitize(raw, now) {
  const vs = createVillage();
  if (!raw || typeof raw !== "object") return vs;
  for (const v of VILLAGERS) {
    const f = own(raw.friends, v.id) ? raw.friends[v.id] : null;
    if (f && typeof f === "object") {
      vs.friends[v.id].points = int(f.points, 0, FRIEND_MAX, 0);
      vs.friends[v.id].talks = int(f.talks, 0, Number.MAX_SAFE_INTEGER, 0);
      const t = isTime(f.lastTalkAt) && f.lastTalkAt >= 0 ? f.lastTalkAt : null;
      vs.friends[v.id].lastTalkAt = t !== null && isTime(now) && t > now ? now : t;
    }
    const c = own(raw.chains, v.id) ? raw.chains[v.id] : null;
    if (c && typeof c === "object") {
      const steps = v.chain.steps, step = int(c.step, 0, steps.length, 0);
      vs.chains[v.id] = { step, progress: steps[step] ? int(c.progress, 0, steps[step].count, 0) : 0 };
    }
  }
  if (raw.prog && typeof raw.prog === "object") {
    const i = int(raw.prog.i, 0, PROGRESSION.length, 0);
    vs.prog = { i, progress: PROGRESSION[i] ? int(raw.prog.progress, 0, PROGRESSION[i].count, 0) : 0 };
  }
  const b = raw.board;
  if (b && typeof b === "object") {
    let nextUid = int(b.nextUid, 1, Number.MAX_SAFE_INTEGER, 1);
    const seen = new Set(), tpls = new Set();
    for (const s of Array.isArray(b.slots) ? b.slots : []) {
      if (vs.board.slots.length >= BOARD_SIZE || !s || typeof s !== "object") continue;
      const q = typeof s.tpl === "string" ? REPEATABLE_BY_ID[s.tpl] : null;
      if (!q || !Number.isSafeInteger(s.uid) || s.uid <= 0 || seen.has(s.uid) || tpls.has(s.tpl)) continue;
      seen.add(s.uid); tpls.add(s.tpl);
      vs.board.slots.push({ uid: s.uid, tpl: s.tpl, progress: int(s.progress, 0, q.count, 0) });
      if (s.uid >= nextUid) nextUid = s.uid + 1;
    }
    vs.board.nextUid = nextUid;
    vs.board.seq = int(b.seq, 0, Number.MAX_SAFE_INTEGER, 0);
  }
  return vs;
}

// ---------- Xe giao hàng (Anh Út) ----------
const ease = (t) => t * t * (3 - 2 * t);
/** Trạng thái hoạt cảnh xe sau lần giao đơn gần nhất. Thuần: chỉ suy ra từ (now, lastDeliveryAt).
 *  opts.level (tuỳ chọn): dưới cấp 11 ⇒ luôn "idle" (chưa có xe). Trả:
 *  { phase: "idle"|"arrive"|"load"|"leave", t: 0..1 trong pha, pos: 0 (ngoài trái) → 0.5 (cổng) → 1 (ngoài phải),
 *    remaining: ms tới khi xong, frame, driver: frame tài xế | null, fx: frame hiệu ứng | null } */
export function truckVisit(now, lastDeliveryAt, opts = {}) {
  const idle = { phase: "idle", t: 0, pos: 0, remaining: 0, frame: TRUCK.sprite.frame, driver: null, fx: null };
  if (!isTime(now) || !isTime(lastDeliveryAt) || now < lastDeliveryAt) return idle;
  if (opts.level !== undefined && !(opts.level >= TRUCK.level)) return idle;
  const { arriveMs: A, loadMs: L, leaveMs: V } = TRUCK, e = now - lastDeliveryAt, total = A + L + V;
  if (e >= total) return idle;
  const base = { frame: TRUCK.sprite.frame, remaining: total - e };
  if (e < A) { const t = e / A; return { ...base, phase: "arrive", t, pos: 0.5 * ease(t), driver: TRUCK.driver.idle[Math.floor(e / 350) % 2], fx: null }; }
  if (e < A + L) {
    const t = (e - A) / L, fx = TRUCK.fx.load;
    return { ...base, phase: "load", t, pos: 0.5, driver: TRUCK.driver.wave, fx: fx[Math.min(fx.length - 1, Math.floor(t * fx.length))] };
  }
  const t = (e - A - L) / V;
  return { ...base, phase: "leave", t, pos: 0.5 + 0.5 * ease(t), driver: TRUCK.driver.idle[Math.floor(e / 350) % 2], fx: null };
}
