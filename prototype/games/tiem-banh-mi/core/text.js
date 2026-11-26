// Điền biến vào câu thoại. {Call} = viết hoa chữ đầu của {call}.
// freshLine: mọi pool câu chọn qua đây — nhớ 120 câu gần nhất (một ca Bánh Mì nói ~60–100 câu: gọi món, thối tiền, review) (trong ca ở sh.usedLines, giữa hai ca ở s.usedDay), ưu tiên câu chưa dùng.
import { pick } from "./rng.js?v=b11";

const cap = (v) => (v ? v[0].toLocaleUpperCase("vi") + v.slice(1) : v);
export function fill(tpl, ctx = {}) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) => {
    const low = k[0].toLowerCase() + k.slice(1);
    const v = ctx[k] ?? ctx[low];
    if (v === undefined || v === null) return m;
    return k[0] !== low[0] ? cap(String(v)) : String(v);
  });
}
export const pickLine = (s, list, ctx) => fill(pick(s, list), ctx);
export const MEMORY = 120;
export function freshLine(s, list, ctx = {}) {
  if (!list || !list.length) return "";
  const mem = s.shift ? (s.shift.usedLines ||= []) : (s.usedDay = Array.isArray(s.usedDay) ? s.usedDay : []);
  const used = new Set(mem);
  const fresh = list.filter((t) => !used.has(t));
  const tpl = pick(s, fresh.length ? fresh : list);
  mem.push(tpl);
  if (mem.length > MEMORY) mem.shift();
  return fill(tpl, ctx);
}
/** Gộp câu chung + câu riêng của nhóm khách. */
export const poolFor = (table, arch) => [...(table?.default || []), ...(table?.[arch] || [])];
