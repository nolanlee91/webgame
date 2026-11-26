// Khu chăn nuôi — luật thuần (DESIGN-2.0 §2.4, Milestone 4). Không DOM, không biến toàn cục, mọi hàm nhận `now` (ms).
//
// TRẠNG THÁI (lưu trong save, field `animals`):
//   animals = {
//     list: [{ uid, kind, fedAt, readyAt }],   // kind ∈ data/animals.js ("ga" | "bo-sua"); fedAt/readyAt = null ⇒ đang đói
//     nextUid: số nguyên ≥ 1,                   // uid tăng dần, không dùng lại
//   }
//   Trạng thái hiển thị KHÔNG lưu mà suy ra từ timestamp (đúng cả khi offline bao lâu cũng được):
//     "hungry"    : fedAt === null              (chưa cho ăn / vừa thu xong)
//     "producing" : now <  readyAt              (đã cho ăn, đang chờ)
//     "ready"     : now >= readyAt              (sản phẩm nổi trên đầu, chạm để thu)
//   Thu xong ⇒ fedAt = readyAt = null ⇒ không thể thu lần 2 (phải cho ăn lại, tốn thức ăn).
//
// GIAO DIỆN TIÊM VÀO (giống core/production.js):
//   inv    = { count(id), has(id, n), take(id, n) -> bool, add(id, n) -> { ok, overflow }, canAdd?(id, n) -> bool }
//   wallet = { coins() -> number, spend(n) -> bool, earn(n) }
//   ctx    = { level, capacity?(kind) -> number, buildings? }
//            capacity(kind): số con tối đa của loại đó (M3 cấp từ level chuồng). Không có ⇒ tự tính từ ctx.buildings
//            (object { id: level | {level} | true } như s.buildings, hoặc mảng / Set id) theo ANIMAL[kind].capacityByLevel.
//            Chuồng chưa xây ⇒ 0 ⇒ không mua được. Luôn kẹp ≤ HARD_MAX.
// Hàm trả { ok: true, ..., events: [...] } hoặc { err: "<mã>" }; khi err thì KHÔNG đổi gì (farm, inv, wallet).
// `events` là sự kiện gợi ý cho apply() đẩy vào danh sách chung (nhiệm vụ ở core/village.js đếm từ đây).

import { ANIMAL, ANIMALS, FEED, HARD_MAX, EAT_ANIM_MS, LEGACY_KIND } from "../data/animals.js?v=m13";

export const ERR = Object.freeze({
  BAD: "bad", LOCKED: "locked", NO_HOUSING: "no-housing", CAPACITY: "capacity", COINS: "coins", NOT_FOUND: "not-found",
  NOT_HUNGRY: "not-hungry", FEED: "feed", NOT_READY: "not-ready", FULL: "full", NONE: "none",
});

export function createAnimals() { return { list: [], nextUid: 1 }; }

const isTime = (t) => Number.isFinite(t);

/** Level công trình trong ctx.buildings (0 = chưa có). Chấp nhận object {id: level|{level}|true}, mảng hoặc Set. */
export function buildingLevel(buildings, id) {
  if (!buildings) return 0;
  if (buildings instanceof Set || Array.isArray(buildings)) return [...buildings].includes(id) ? 1 : 0;
  if (typeof buildings !== "object" || !Object.prototype.hasOwnProperty.call(buildings, id)) return 0;
  const v = buildings[id];
  if (Number.isInteger(v)) return Math.max(0, v);
  if (v && typeof v === "object") return Number.isInteger(v.level) ? Math.max(0, v.level) : 1;
  return v ? 1 : 0;
}

/** Sức chứa mặc định theo level chuồng (dùng khi ctx không có capacity()). */
export function defaultCapacity(kind, buildings) {
  const def = ANIMAL[kind];
  if (!def) return 0;
  const lv = buildingLevel(buildings, def.housing);
  if (lv <= 0) return 0;
  return def.capacityByLevel[Math.min(lv, def.capacityByLevel.length) - 1];
}

/** Sức chứa hiệu lực (kẹp 0..HARD_MAX). */
export function capacity(kind, ctx) {
  const raw = typeof ctx?.capacity === "function" ? ctx.capacity(kind) : defaultCapacity(kind, ctx?.buildings);
  return Number.isFinite(raw) ? Math.max(0, Math.min(HARD_MAX, Math.floor(raw))) : 0;
}

export const countOf = (farm, kind) => farm.list.filter((a) => a.kind === kind).length;

/** "hungry" | "producing" | "ready" ở thời điểm now. */
export function stateOf(a, now) {
  if (!a || a.fedAt === null || !isTime(a.readyAt)) return "hungry";
  return now >= a.readyAt ? "ready" : "producing";
}

/** Lý do không mua được (null ⇒ được). Không kiểm xu nếu không truyền wallet. */
export function canBuy(farm, wallet, kind, ctx) {
  const def = ANIMAL[kind];
  if (!def) return ERR.BAD;
  if (!(ctx?.level >= def.level)) return ERR.LOCKED;
  const cap = capacity(kind, ctx);
  if (cap <= 0) return ERR.NO_HOUSING;
  if (countOf(farm, kind) >= cap) return ERR.CAPACITY;
  if (wallet && !(wallet.coins() >= def.buy)) return ERR.COINS;
  return null;
}

/** Mua 1 con: trừ def.buy, con mới ở trạng thái đói. */
export function buyAnimal(farm, wallet, kind, now, ctx) {
  if (!isTime(now)) return { err: ERR.BAD };
  const e = canBuy(farm, wallet, kind, ctx);
  if (e) return { err: e };
  const def = ANIMAL[kind];
  if (!wallet.spend(def.buy)) return { err: ERR.COINS };
  const a = { uid: farm.nextUid++, kind, fedAt: null, readyAt: null };
  farm.list.push(a);
  return { ok: true, uid: a.uid, kind, cost: def.buy, events: [{ type: "animalBought", kind, uid: a.uid, cost: def.buy }] };
}

const find = (farm, uid) => farm.list.find((a) => a.uid === uid) || null;

/** Cho ăn: chỉ khi đói. Trừ thức ăn NGAY (inv.take), bắt đầu chu kỳ. */
export function feed(farm, inv, uid, now) {
  if (!isTime(now)) return { err: ERR.BAD };
  const a = find(farm, uid);
  if (!a) return { err: ERR.NOT_FOUND };
  const def = ANIMAL[a.kind];
  if (!def) return { err: ERR.BAD };
  if (stateOf(a, now) !== "hungry") return { err: ERR.NOT_HUNGRY };
  if (!inv.has(FEED, def.feed) || !inv.take(FEED, def.feed)) return { err: ERR.FEED };
  a.fedAt = now;
  a.readyAt = now + def.cycleMs;
  return { ok: true, uid, kind: a.kind, feed: def.feed, readyAt: a.readyAt,
    events: [{ type: "animalFed", kind: a.kind, uid, feed: def.feed }] };
}

/** Thu sản phẩm: chỉ khi chín. Kho không nhận ⇒ err "full", con vật vẫn giữ sản phẩm (vẫn "ready"). */
export function collect(farm, inv, uid, now) {
  if (!isTime(now)) return { err: ERR.BAD };
  const a = find(farm, uid);
  if (!a) return { err: ERR.NOT_FOUND };
  const def = ANIMAL[a.kind];
  if (!def) return { err: ERR.BAD };
  if (stateOf(a, now) !== "ready") return { err: ERR.NOT_READY };
  if (inv.canAdd && !inv.canAdd(def.product, def.qty)) return { err: ERR.FULL };
  const res = inv.add(def.product, def.qty);
  if (!res || !res.ok) return { err: ERR.FULL };
  a.fedAt = null;
  a.readyAt = null;
  return { ok: true, uid, kind: a.kind, item: def.product, qty: def.qty, xp: def.xp, overflow: res.overflow || 0,
    events: [{ type: "animalCollected", kind: a.kind, uid, item: def.product, qty: def.qty, xp: def.xp }] };
}

/** Cho ăn mọi con đang đói (hoặc chỉ loại kind) theo thứ tự uid, dừng khi hết thức ăn. */
export function feedAll(farm, inv, now, kind) {
  if (!isTime(now)) return { err: ERR.BAD };
  if (kind !== undefined && !ANIMAL[kind]) return { err: ERR.BAD };
  const hungry = farm.list.filter((a) => (kind === undefined || a.kind === kind) && stateOf(a, now) === "hungry");
  if (!hungry.length) return { err: ERR.NONE };
  const fed = [], events = [];
  let used = 0, short = false;
  for (const a of hungry) {
    const r = feed(farm, inv, a.uid, now);
    if (r.err === ERR.FEED) { short = true; continue; } // bò cần 2 bao có thể thiếu nhưng gà 1 bao vẫn đủ
    if (r.ok) { fed.push(a.uid); used += r.feed; events.push(...r.events); }
  }
  if (!fed.length) return { err: ERR.FEED };
  return { ok: true, fed, feed: used, short, events };
}

/** Thu mọi con đã chín (hoặc chỉ loại kind). Dừng khi kho đầy; con chưa thu vẫn giữ sản phẩm. */
export function collectAll(farm, inv, now, kind) {
  if (!isTime(now)) return { err: ERR.BAD };
  if (kind !== undefined && !ANIMAL[kind]) return { err: ERR.BAD };
  const ready = farm.list.filter((a) => (kind === undefined || a.kind === kind) && stateOf(a, now) === "ready");
  if (!ready.length) return { err: ERR.NONE };
  const collected = [], events = [], items = {};
  let xp = 0, full = false;
  for (const a of ready) {
    const r = collect(farm, inv, a.uid, now);
    if (r.err === ERR.FULL) { full = true; break; }
    if (r.ok) {
      collected.push({ uid: a.uid, kind: a.kind, item: r.item, qty: r.qty, overflow: r.overflow });
      items[r.item] = (items[r.item] || 0) + r.qty;
      xp += r.xp;
      events.push(...r.events);
    }
  }
  if (!collected.length) return { err: ERR.FULL };
  return { ok: true, collected, items, xp, full, events };
}

/** Frame + bong bóng để vẽ 1 con (animation tại chỗ, không AI đi lại). */
export function spriteOf(a, now) {
  const def = ANIMAL[a.kind];
  if (!def) return null;
  const st = stateOf(a, now), sp = def.sprite;
  let frames = sp.idle;
  if (st === "producing" && now - a.fedAt < EAT_ANIM_MS) frames = sp.eat;
  else if (st === "producing" && Math.floor((now + a.uid * 977) / 6000) % 3 === 0) frames = sp.walk; // đi lững thững tại chỗ
  const frame = frames[Math.floor(now / sp.frameMs) % frames.length];
  const bubble = st === "ready" ? sp.bubbleReady : st === "hungry" ? sp.bubbleHungry : null;
  return { sheet: sp.sheet, frame, bubble, flip: a.uid % 2 === 0 };
}

/** Trạng thái hiển thị: từng con + tóm tắt theo loại. */
export function status(farm, now, ctx) {
  const list = farm.list.map((a) => {
    const st = stateOf(a, now);
    return { uid: a.uid, kind: a.kind, state: st, remaining: st === "producing" ? a.readyAt - now : 0,
      readyAt: a.readyAt, sprite: spriteOf(a, now) };
  });
  const kinds = {};
  for (const def of ANIMALS) {
    const mine = list.filter((x) => x.kind === def.id);
    const pending = mine.filter((x) => x.state === "producing").map((x) => x.readyAt);
    kinds[def.id] = {
      count: mine.length, capacity: capacity(def.id, ctx), unlocked: (ctx?.level ?? 0) >= def.level,
      hungry: mine.filter((x) => x.state === "hungry").length,
      producing: pending.length, ready: mine.filter((x) => x.state === "ready").length,
      nextReadyAt: pending.length ? Math.min(...pending) : null,
      feedNeeded: mine.filter((x) => x.state === "hungry").length * def.feed,
    };
  }
  return { list, kinds };
}

/** Số sản phẩm chín trong lúc vắng (readyAt trong (lastSeen, now]) — cho màn "Trong lúc bạn vắng". */
export function readyWhileAway(farm, lastSeen, now) {
  const out = {};
  for (const a of farm.list) {
    if (stateOf(a, now) !== "ready" || !(a.readyAt > lastSeen)) continue;
    const def = ANIMAL[a.kind];
    out[def.product] = (out[def.product] || 0) + def.qty;
  }
  return out;
}

/** Kẹp / sửa dữ liệu đọc từ save. Đổi kind cũ "bo" → "bo-sua". Bỏ loại lạ, uid trùng / không nguyên, vượt HARD_MAX mỗi loại;
 *  readyAt luôn tính lại = fedAt + cycleMs theo dữ liệu; fedAt ở tương lai (đồng hồ lùi / sửa save) ⇒ kẹp về now. */
export function sanitize(raw, now) {
  const farm = createAnimals();
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.list)) return farm;
  let nextUid = Number.isSafeInteger(raw.nextUid) && raw.nextUid > 0 ? raw.nextUid : 1;
  const seen = new Set(), per = {};
  for (const a of raw.list) {
    if (!a || typeof a !== "object") continue;
    // id cũ "bo" (trùng món Bơ) ⇒ "bo-sua"
    const kind = typeof a.kind === "string" ? (Object.prototype.hasOwnProperty.call(LEGACY_KIND, a.kind) ? LEGACY_KIND[a.kind] : a.kind) : null;
    const def = kind ? ANIMAL[kind] : null;
    if (!def || !Number.isSafeInteger(a.uid) || a.uid <= 0 || seen.has(a.uid)) continue;
    if ((per[kind] || 0) >= HARD_MAX) continue;
    seen.add(a.uid);
    per[kind] = (per[kind] || 0) + 1;
    let fedAt = isTime(a.fedAt) && a.fedAt >= 0 ? a.fedAt : null;
    if (fedAt !== null && isTime(now) && fedAt > now) fedAt = now;
    farm.list.push({ uid: a.uid, kind, fedAt, readyAt: fedAt === null ? null : fedAt + def.cycleMs });
    if (a.uid >= nextUid) nextUid = a.uid + 1;
  }
  farm.nextUid = nextUid;
  return farm;
}

/** Sản phẩm vật nuôi trang trại SẢN XUẤT ĐƯỢC (có ≥ 1 con loại đó): { "trung-ga": số quả mỗi chu kỳ, sua: ... }.
 *  core/orders.js dùng cùng quy tắc (đọc s.animals) để đưa trứng / sữa vào đơn. */
export function producibleGoods(farm) {
  const out = {};
  for (const a of Array.isArray(farm?.list) ? farm.list : []) {
    const def = ANIMAL[a?.kind];
    if (def) out[def.product] = (out[def.product] || 0) + def.qty;
  }
  return out;
}
