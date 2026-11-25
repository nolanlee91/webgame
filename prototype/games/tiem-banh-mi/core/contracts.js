// Hợp đồng định kỳ (Milestone 5): sự kiện K02 (Đội Chú Tám, 12 ổ / 2 ngày) và X05 (Hoa Sen Xanh, 25 ổ / tuần) ký hợp đồng ⇒ đơn đặt trước tự sinh
// đúng lịch ở đầu ca. Hợp đồng trả khi giao (không cọc). Giao đủ mọi đợt ⇒ cờ "hop-dong-xong" (sự kiện HD1: gia hạn). Trễ / huỷ một đợt ⇒ cờ "hop-dong-tre";
// trễ đợt thứ hai ⇒ huỷ hợp đồng, cờ "hop-dong-vo" (sự kiện HD2). Thuần.
import { CONTRACT_LINES } from "../data/lines-m5.js?v=b6";
import { engineFlag } from "./flags.js?v=b6";
import { freshLine } from "./text.js?v=b6";

export const CONTRACT = { maxStrikes: 2 };
const int = (v, lo, hi, d) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : d);
const clean = (c) => ({
  id: String(c.id).slice(0, 30), name: String(c.name || "Khách hợp đồng").slice(0, 40), arch: c.arch || "office", recipe: c.recipe || "cha-lua",
  n: int(c.n, 2, 30, 6), every: int(c.every, 1, 14, 2), left: int(c.left, 0, 20, 0), next: int(c.next, 0, 1e9, 0), dueMs: int(c.dueMs, 20000, 200000, 40000),
  discount: Math.max(0, Math.min(0.3, Number(c.discount) || 0)), label: String(c.label || "Hợp đồng").slice(0, 40), strikes: int(c.strikes, 0, 5, 0), done: int(c.done, 0, 1e6, 0),
});
export const loadContracts = (arr) => (Array.isArray(arr) ? arr.filter((c) => c && typeof c === "object" && c.id && c.left > 0).slice(0, 4).map(clean) : []);

/** Ký hợp đồng (fx.contract của sự kiện): đợt đầu giao ở ca tới. Ký lại cùng id thì nối thêm đợt. */
export function addContract(s, spec, ev) {
  s.contracts = s.contracts || [];
  const old = s.contracts.find((c) => c.id === spec.id);
  if (old) { old.left += spec.deliveries || 3; old.strikes = 0; ev.push({ type: "contract", id: old.id, name: old.name, left: old.left, renew: true }); return old; }
  const c = clean({ ...spec, left: spec.deliveries || 3, next: s.shift ? s.day + 1 : s.day, strikes: 0, done: 0 });
  s.contracts.push(c);
  ev.push({ type: "contract", id: c.id, name: c.name, left: c.left, next: c.next });
  return c;
}
/** Đầu ca: hợp đồng tới hạn hôm nay ⇒ đơn đặt trước (không cọc) cho ca này. */
export function contractOrders(s, ev, createPreorder) {
  for (const c of s.contracts || []) {
    if (c.left <= 0 || c.next > s.day) continue;
    const p = createPreorder(s, { recipe: c.recipe, n: c.n, name: c.name, arch: c.arch, when: "next", dueMs: c.dueMs, discount: c.discount, label: c.label, noDeposit: true, contract: c.id }, ev);
    if (p) p.day = s.day;
    c.left--; c.next = s.day + c.every;
  }
}
/** Giao xong một đợt hợp đồng (settle). */
export function contractDelivered(s, cid, onTime, ev) {
  const c = (s.contracts || []).find((x) => x.id === cid);
  if (!c) return;
  c.done++;
  if (!onTime) { c.strikes++; engineFlag(s, "hop-dong-tre", 2); }
  s.shift?.moments.push({ kind: "contract", name: c.name, line: freshLine(s, onTime ? CONTRACT_LINES.delivered : CONTRACT_LINES.late, { name: c.name, n: c.n }) });
  if (c.strikes >= CONTRACT.maxStrikes) { breakContract(s, c, ev); return; }
  if (c.left <= 0) {
    s.contracts = s.contracts.filter((x) => x !== c);
    engineFlag(s, "hop-dong-xong", 3);
    s.shift?.moments.push({ kind: "contract", name: c.name, line: freshLine(s, CONTRACT_LINES.finished, { name: c.name, n: c.done }) });
    ev.push({ type: "contractDone", id: c.id, name: c.name, done: c.done });
  }
}
/** Một đợt hợp đồng không kịp (preFail). */
export function contractFailed(s, cid, ev) {
  const c = (s.contracts || []).find((x) => x.id === cid);
  if (!c) return;
  c.strikes++;
  engineFlag(s, "hop-dong-tre", 2);
  if (c.strikes >= CONTRACT.maxStrikes) breakContract(s, c, ev);
}
function breakContract(s, c, ev) {
  s.contracts = (s.contracts || []).filter((x) => x !== c);
  engineFlag(s, "hop-dong-vo", 3);
  s.shift?.moments.push({ kind: "contract", name: c.name, line: freshLine(s, CONTRACT_LINES.broken, { name: c.name }) });
  ev.push({ type: "contractBroken", id: c.id, name: c.name });
}
