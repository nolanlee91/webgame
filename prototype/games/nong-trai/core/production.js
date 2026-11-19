// Xưởng chế biến — luật thuần (DESIGN-2.0 §2.3). Không DOM, không biến toàn cục, mọi hàm nhận `now` (ms).
//
// TRẠNG THÁI (lưu trong save, field `production`):
//   production = {
//     machines: {
//       [machineId]: {
//         level: 1..3,            // level máy (1 = vừa xây; mỗi nâng cấp +1)
//         slots: 2..4,            // số ô hàng chờ của máy (BASE_SLOTS + số lần nâng cấp, tối đa MAX_SLOTS)
//         readyAt: ms,            // xây xong lúc nào (now < readyAt ⇒ đang xây, chưa dùng được)
//         queue: [{ uid, recipe, startAt, endAt }],   // theo thứ tự chạy; ô đã xong vẫn chiếm chỗ tới khi "Nhận"
//         nextUid: số nguyên ≥ 1, // uid tăng dần trong máy ⇒ mỗi ô có id riêng, nhận xong xoá ⇒ không nhận 2 lần
//       }
//     }
//   }
// Chạy TUẦN TỰ: job k bắt đầu khi job k-1 kết thúc, hoặc lúc bấm nếu máy rảnh ⇒ startAt = max(now, endAt của job cuối).
// Thời gian chỉ suy ra từ timestamp ⇒ đúng cả khi tắt trang (offline) bao lâu cũng được, không cần tick.
//
// GIAO DIỆN TIÊM VÀO (không import kho / ví của M1):
//   inv    = { count(id), has(id, n), take(id, n) -> bool, add(id, n) -> { ok, overflow }, canAdd?(id, n) -> bool }
//            add PHẢI nguyên tử: ok=true ⇒ đã nhận đủ n (overflow = số món vào giỏ tràn, được phép);
//            ok=false ⇒ không thêm gì. Nếu có canAdd thì được gọi trước add.
//   wallet = { coins() -> number, spend(n) -> bool, earn(n) }   (chỉ build / upgrade dùng; xu không bị đụng ở chỗ khác)
//   ctx    = { level, buildings?: Iterable<string>, extraSlots?: number }
//            buildings: công trình đã có (Nồi đường cần "nha-kinh"). extraSlots: ô cộng thêm cho mọi máy (vd. Xưởng cấp 2, §3 cấp 13).
// Hàm trả { ok: true, ... } hoặc { err: "<mã>" }; khi err thì KHÔNG đổi gì (prod, inv, wallet).

import { MACHINE, BASE_SLOTS, MAX_SLOTS } from "../data/machines.js?v=m3b";
import { RECIPE } from "../data/recipes.js?v=m3b";

export const ERR = Object.freeze({
  BAD: "bad", LOCKED: "locked", REQUIRES: "requires", BUILT: "built", NOT_BUILT: "not-built", BUILDING: "building",
  WRONG_MACHINE: "wrong-machine", MACHINE_LEVEL: "machine-level", QUEUE_FULL: "queue-full", INPUTS: "inputs",
  COINS: "coins", MAX: "max", NOT_FOUND: "not-found", NOT_READY: "not-ready", FULL: "full",
});

export function createProduction() { return { machines: {} }; }

const isTime = (t) => Number.isFinite(t);
const hasBuilding = (ctx, id) => !!ctx?.buildings && [...ctx.buildings].includes(id);

/** Số ô hàng chờ hiệu lực của máy (gồm ctx.extraSlots). */
export function capacity(m, ctx) {
  const extra = Number.isInteger(ctx?.extraSlots) && ctx.extraSlots > 0 ? ctx.extraSlots : 0;
  return m.slots + extra;
}

/** Máy đã xây xong và dùng được ở thời điểm now. */
export const isBuilt = (prod, machineId, now) => !!prod.machines[machineId] && now >= prod.machines[machineId].readyAt;

export function canBuild(prod, machineId, ctx) {
  const def = MACHINE[machineId];
  if (!def) return ERR.BAD;
  if (prod.machines[machineId]) return ERR.BUILT;
  if (!(ctx?.level >= def.unlock)) return ERR.LOCKED;
  if (def.requires && !hasBuilding(ctx, def.requires)) return ERR.REQUIRES;
  return null;
}

/** Xây máy: trừ def.buildCost qua wallet, máy dùng được từ now + buildMs. */
export function buildMachine(prod, wallet, machineId, now, ctx) {
  if (!isTime(now)) return { err: ERR.BAD };
  const e = canBuild(prod, machineId, ctx);
  if (e) return { err: e };
  const def = MACHINE[machineId];
  if (wallet.coins() < def.buildCost || !wallet.spend(def.buildCost)) return { err: ERR.COINS };
  const m = { level: 1, slots: BASE_SLOTS, readyAt: now + def.buildMs, queue: [], nextUid: 1 };
  prod.machines[machineId] = m;
  return { ok: true, machine: machineId, cost: def.buildCost, readyAt: m.readyAt };
}

/** Máy tặng kèm công trình (Bếp sên đi cùng Xưởng): không trừ xu, dùng được từ readyAt. Đã có ⇒ err "built". */
export function grantMachine(prod, machineId, readyAt) {
  if (!MACHINE[machineId] || !isTime(readyAt)) return { err: ERR.BAD };
  if (prod.machines[machineId]) return { err: ERR.BUILT };
  prod.machines[machineId] = { level: 1, slots: BASE_SLOTS, readyAt, queue: [], nextUid: 1 };
  return { ok: true, machine: machineId, readyAt };
}

/** Giá nâng cấp kế tiếp (null ⇒ đã tối đa / chưa xây). */
export function nextUpgrade(prod, machineId) {
  const m = prod.machines[machineId], def = MACHINE[machineId];
  if (!m || !def) return null;
  const u = def.upgrades[m.level - 1];
  return u && u.slots <= MAX_SLOTS ? u : null;
}

/** Nâng máy: +1 ô hàng chờ (tối đa MAX_SLOTS), level +1. Tức thì; cần máy đã xây xong. */
export function upgradeMachine(prod, wallet, machineId, now, ctx) {
  if (!isTime(now) || !MACHINE[machineId]) return { err: ERR.BAD };
  const m = prod.machines[machineId];
  if (!m) return { err: ERR.NOT_BUILT };
  if (now < m.readyAt) return { err: ERR.BUILDING };
  const u = nextUpgrade(prod, machineId);
  if (!u) return { err: ERR.MAX };
  if (wallet.coins() < u.cost || !wallet.spend(u.cost)) return { err: ERR.COINS };
  m.level += 1;
  m.slots = u.slots;
  return { ok: true, machine: machineId, level: m.level, slots: m.slots, cost: u.cost };
}

/** Lý do không bắt đầu được công thức (null ⇒ được). Không kiểm nguyên liệu nếu không truyền inv. */
export function canEnqueue(prod, inv, machineId, recipeId, now, ctx) {
  const def = MACHINE[machineId], r = RECIPE[recipeId];
  if (!def || !r || !isTime(now)) return ERR.BAD;
  if (r.machine !== machineId) return ERR.WRONG_MACHINE;
  const m = prod.machines[machineId];
  if (!m) return ERR.NOT_BUILT;
  if (now < m.readyAt) return ERR.BUILDING;
  if (!(ctx?.level >= r.level)) return ERR.LOCKED;
  if (m.level < r.machineLevel) return ERR.MACHINE_LEVEL;
  if (m.queue.length >= capacity(m, ctx)) return ERR.QUEUE_FULL;
  if (inv) for (const [id, q] of Object.entries(r.inputs)) if (!inv.has(id, q)) return ERR.INPUTS;
  return null;
}

/** Bấm "Bắt đầu": trừ nguyên liệu ngay (inv.take), thêm ô vào cuối hàng chờ. */
export function enqueue(prod, inv, machineId, recipeId, now, ctx) {
  const e = canEnqueue(prod, inv, machineId, recipeId, now, ctx);
  if (e) return { err: e };
  const m = prod.machines[machineId], r = RECIPE[recipeId];
  const taken = [];
  for (const [id, q] of Object.entries(r.inputs)) {
    if (!inv.take(id, q)) { // kho từ chối giữa chừng ⇒ hoàn lại phần đã lấy
      for (const [tid, tq] of taken) inv.add(tid, tq);
      return { err: ERR.INPUTS };
    }
    taken.push([id, q]);
  }
  const last = m.queue[m.queue.length - 1];
  const startAt = Math.max(now, last ? last.endAt : now, m.readyAt);
  const job = { uid: m.nextUid++, recipe: recipeId, startAt, endAt: startAt + r.ms };
  m.queue.push(job);
  return { ok: true, job: { ...job }, inputs: { ...r.inputs } };
}

/** Nhận 1 ô đã xong. Kho không nhận ⇒ err "full", ô vẫn còn nguyên. Nhận xong ô bị xoá ⇒ không thể nhận lần 2. */
export function collect(prod, inv, machineId, uid, now) {
  const m = prod.machines[machineId];
  if (!m || !isTime(now)) return { err: ERR.BAD };
  const i = m.queue.findIndex((j) => j.uid === uid);
  if (i < 0) return { err: ERR.NOT_FOUND };
  const job = m.queue[i];
  if (now < job.endAt) return { err: ERR.NOT_READY };
  const r = RECIPE[job.recipe];
  if (!r) return { err: ERR.BAD };
  if (inv.canAdd && !inv.canAdd(r.output, r.qty)) return { err: ERR.FULL };
  const res = inv.add(r.output, r.qty);
  if (!res || !res.ok) return { err: ERR.FULL };
  m.queue.splice(i, 1);
  return { ok: true, job: { ...job }, item: r.output, qty: r.qty, xp: r.xp, overflow: res.overflow || 0 };
}

/** Nhận mọi ô đã xong (mọi máy, hoặc chỉ machineId). Dừng khi kho đầy; ô chưa nhận được vẫn giữ. */
export function collectAll(prod, inv, now, machineId) {
  if (!isTime(now)) return { err: ERR.BAD };
  const ids = machineId ? [machineId] : Object.keys(prod.machines);
  const collected = [];
  let xp = 0, full = false;
  outer: for (const id of ids) {
    const m = prod.machines[id];
    if (!m) continue;
    for (const job of m.queue.filter((j) => now >= j.endAt)) {
      const r = collect(prod, inv, id, job.uid, now);
      if (r.err === ERR.FULL) { full = true; break outer; }
      if (r.ok) { collected.push({ machine: id, uid: r.job.uid, item: r.item, qty: r.qty, overflow: r.overflow }); xp += r.xp; }
    }
  }
  if (!collected.length) return { err: full ? ERR.FULL : ERR.NOT_FOUND };
  return { ok: true, collected, xp, full };
}

/** Trạng thái hiển thị cho từng máy đã xây. */
export function status(prod, now, ctx) {
  const out = {};
  for (const [id, m] of Object.entries(prod.machines)) {
    const running = m.queue.find((j) => now >= j.startAt && now < j.endAt) || null;
    out[id] = {
      level: m.level,
      slots: capacity(m, ctx),
      built: now >= m.readyAt,
      buildRemaining: Math.max(0, m.readyAt - now),
      running: running ? { uid: running.uid, recipe: running.recipe, remaining: running.endAt - now } : null,
      finished: m.queue.filter((j) => now >= j.endAt).length,
      waiting: m.queue.filter((j) => now < j.startAt).length,
      free: Math.max(0, capacity(m, ctx) - m.queue.length),
      nextDoneAt: m.queue.find((j) => now < j.endAt)?.endAt ?? null,
    };
  }
  return out;
}

/** Kẹp / sửa production đọc từ save (dữ liệu lạ, đồng hồ lùi …). Trả bản sạch. now (tuỳ chọn) ⇒ kẹp mốc thời gian vô lý ở tương lai. */
export function sanitize(raw, now) {
  const prod = createProduction();
  if (!raw || typeof raw !== "object" || !raw.machines || typeof raw.machines !== "object") return prod;
  for (const [id, m] of Object.entries(raw.machines)) {
    const def = MACHINE[id];
    if (!def || !m || typeof m !== "object") continue;
    const level = Number.isInteger(m.level) ? Math.min(Math.max(m.level, 1), def.upgrades.length + 1) : 1;
    const slots = level === 1 ? BASE_SLOTS : def.upgrades[level - 2].slots;
    const queue = [];
    let prevEnd = -Infinity, nextUid = Number.isInteger(m.nextUid) && m.nextUid > 0 ? m.nextUid : 1;
    for (const j of Array.isArray(m.queue) ? m.queue : []) {
      const r = j && RECIPE[j.recipe];
      if (!r || r.machine !== id || !Number.isInteger(j.uid) || !isTime(j.startAt) || queue.length >= MAX_SLOTS + 2) continue;
      if (queue.some((q) => q.uid === j.uid)) continue;
      let startAt = Math.max(j.startAt, prevEnd);
      if (isTime(now) && startAt > now && prevEnd === -Infinity) startAt = now; // job đầu không thể bắt đầu ở tương lai
      const job = { uid: j.uid, recipe: j.recipe, startAt, endAt: startAt + r.ms }; // thời lượng luôn theo dữ liệu
      queue.push(job);
      prevEnd = job.endAt;
      if (j.uid >= nextUid) nextUid = j.uid + 1;
    }
    prod.machines[id] = { level, slots, readyAt: isTime(m.readyAt) ? (isTime(now) ? Math.min(m.readyAt, now + def.buildMs) : m.readyAt) : 0, queue, nextUid };
  }
  return prod;
}
