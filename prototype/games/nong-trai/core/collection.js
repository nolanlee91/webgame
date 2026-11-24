// Sổ sưu tập (DESIGN-2.0 §3 cấp 20 "Nông trại danh tiếng", §2.9 — Milestone 6). Luật thuần, không DOM.
//
// 30 món: 7 nông sản, 2 sản phẩm chăn nuôi, 18 thành phẩm Xưởng (12 cũ + 6 công thức M6), 3 vật liệu. Mỗi món tự ghi vào sổ
// lần đầu nó VÀO kho do người chơi làm ra / nhận được (thu hoạch, nhận từ máy, thu trứng sữa, thưởng đơn / nhiệm vụ, rơi khi thu
// hoạch) — KHÔNG tính mua ở chợ. Sổ đếm tổng số đã làm / nhận (con số hiện trên trang sổ).
// Cách đếm: apply() so số lượng (kho + giỏ tràn) trước / sau mỗi action ⇒ phần TĂNG là phần vừa làm ra. Một chỗ, không phải sửa
// từng module (thu hoạch, Xưởng, chuồng, đơn, nhiệm vụ làng …).
// Mốc thưởng 10 / 20 / 30 món: nhận bằng action claimBook (theo thứ tự). Thưởng: xu + vật liệu + trang trí (đều không tính sức chứa).
//
// s.collection = { counts: { id: số đã làm / nhận }, claimed: số mốc đã nhận (0..3) }
import { ITEMS, ITEM } from "../data/catalog.js?v=m7";
import { have, add } from "./inventory.js?v=m7";

const GROUP_ORDER = ["nong-san", "chan-nuoi", "thanh-pham", "vat-lieu"];
/** 30 món của sổ, theo nhóm kệ (thứ tự hiển thị). */
export const BOOK = Object.freeze(GROUP_ORDER.flatMap((cat) => ITEMS.filter((it) => it.cat === cat && it.bag !== "decor").map((it) => it.id)));
export const BOOK_SET = new Set(BOOK);
export const BOOK_GROUPS = Object.freeze([
  { id: "nong-san", name: "Nông sản" }, { id: "chan-nuoi", name: "Chăn nuôi" }, { id: "thanh-pham", name: "Thành phẩm" }, { id: "vat-lieu", name: "Vật liệu" },
]);
/** Mốc thưởng. title: danh hiệu sổ khi đạt mốc. */
export const BOOK_TIERS = Object.freeze([
  Object.freeze({ at: 10, title: "Nhà sưu tầm tập sự", reward: Object.freeze({ coins: 800, items: Object.freeze({ "van-go": 2, "hop-dinh": 2 }), decor: Object.freeze({}) }) }),
  Object.freeze({ at: 20, title: "Nhà sưu tầm chăm chỉ", reward: Object.freeze({ coins: 4000, items: Object.freeze({ "thung-son": 3 }), decor: Object.freeze({ "ghe-tre": 1 }) }) }),
  Object.freeze({ at: 30, title: "Nhà sưu tầm danh tiếng", reward: Object.freeze({ coins: 15000, items: Object.freeze({ "thung-son": 2 }), decor: Object.freeze({ "den-long": 1, "gieng-da": 1 }) }) }),
]);
/** Action không tính vào sổ (mua ở chợ không phải "làm ra"). */
export const NOT_COUNTED = new Set(["marketBuy"]);
const MAX_COUNT = 1e12;

export const createCollection = () => ({ counts: {}, claimed: 0 });
export const unlockedCount = (s) => BOOK.reduce((n, id) => n + ((s.collection?.counts?.[id] || 0) > 0 ? 1 : 0), 0);
/** Mốc kế tiếp nhận được (đủ món, chưa nhận) — index | -1. */
export function claimableTier(s) {
  const k = s.collection?.claimed || 0;
  return k < BOOK_TIERS.length && unlockedCount(s) >= BOOK_TIERS[k].at ? k : -1;
}
/** Danh hiệu sổ hiện tại ("" nếu chưa nhận mốc nào). */
export const bookTitle = (s) => (s.collection?.claimed ? BOOK_TIERS[s.collection.claimed - 1].title : "");

/** Kẹp từ bản lưu. Save cũ (v2–v6) chưa có sổ ⇒ `seed` = trạng thái đã đọc: món đang có trong kho coi như đã từng làm (không mất công). */
export function sanitize(raw, seed = null) {
  const out = createCollection();
  if (raw && typeof raw === "object") {
    if (raw.counts && typeof raw.counts === "object") for (const [id, n] of Object.entries(raw.counts)) {
      if (BOOK_SET.has(id) && Number.isFinite(n) && n >= 1) out.counts[id] = Math.min(MAX_COUNT, Math.floor(n));
    }
    if (Number.isInteger(raw.claimed)) out.claimed = Math.max(0, Math.min(BOOK_TIERS.length, raw.claimed));
    // không nhận mốc vượt số món thật (save bị sửa tay)
    const n = BOOK.filter((id) => out.counts[id] > 0).length;
    while (out.claimed > 0 && BOOK_TIERS[out.claimed - 1].at > n) out.claimed--;
  } else if (seed) {
    for (const id of BOOK) { const q = have(seed, id); if (q > 0) out.counts[id] = Math.min(MAX_COUNT, q); }
  }
  return out;
}

/** Ghi sổ sau một action: món nào trong sổ TĂNG so với trạng thái trước ⇒ cộng số; lần đầu ⇒ sự kiện bookNew. */
export function track(s, before, actionType, events) {
  if (!s.collection) s.collection = createCollection();
  if (NOT_COUNTED.has(actionType) || !before) return;
  const c = s.collection.counts;
  const was = unlockedCount(s);
  for (const id of BOOK) {
    const d = have(s, id) - have(before, id);
    if (d <= 0) continue;
    const first = !(c[id] > 0);
    c[id] = Math.min(MAX_COUNT, (c[id] || 0) + d);
    if (first) events.push({ type: "bookNew", id, name: ITEM[id].name, total: unlockedCount(s) });
  }
  const now = unlockedCount(s);
  for (const t of BOOK_TIERS) if (was < t.at && now >= t.at) events.push({ type: "bookTierReady", at: t.at, title: t.title });
}

/** Nhận thưởng mốc `tier` (index, phải là mốc kế tiếp và đủ món). Xu cộng vào tổng kiếm được (bảng điểm danh tiếng). */
export function claim(s, tier, events) {
  if (!s.collection) s.collection = createCollection();
  if (!Number.isInteger(tier) || tier < 0 || tier >= BOOK_TIERS.length) return { err: "bad" };
  if (tier < s.collection.claimed) return { err: "book-claimed" };
  if (tier > s.collection.claimed || unlockedCount(s) < BOOK_TIERS[tier].at) return { err: "book-incomplete" };
  const { reward, at, title } = BOOK_TIERS[tier];
  s.coins += reward.coins;
  s.stats.earned += reward.coins;
  for (const [id, q] of Object.entries(reward.items)) add(s, id, q); // vật liệu: không tính sức chứa
  s.decor ||= {};
  for (const [id, q] of Object.entries(reward.decor)) s.decor[id] = (s.decor[id] || 0) + q;
  s.collection.claimed = tier + 1;
  events.push({ type: "bookClaimed", tier, at, title, reward: { coins: reward.coins, items: { ...reward.items }, decor: { ...reward.decor } } });
  return { ok: true, coins: reward.coins };
}

/** Dữ liệu trang sổ. */
export function bookView(s) {
  const c = s.collection?.counts || {};
  const entries = BOOK.map((id) => ({ id, name: ITEM[id].name, cat: ITEM[id].cat, count: c[id] || 0, unlocked: (c[id] || 0) > 0, source: ITEM[id].source }));
  const n = entries.filter((e) => e.unlocked).length;
  return { entries, unlocked: n, total: BOOK.length, claimed: s.collection?.claimed || 0, claimable: claimableTier(s), title: bookTitle(s),
    tiers: BOOK_TIERS.map((t, k) => ({ ...t, k, reached: n >= t.at, claimed: k < (s.collection?.claimed || 0) })) };
}
