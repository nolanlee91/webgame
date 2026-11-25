// Điền biến vào câu thoại. {Call} = viết hoa chữ đầu của {call}.
import { pick } from "./rng.js?v=m38";
const cap = (v) => (v ? v[0].toLocaleUpperCase("vi") + v.slice(1) : v);
export function fill(tpl, ctx) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) => {
    const low = k[0].toLowerCase() + k.slice(1);
    const v = ctx[k] ?? ctx[low];
    if (v === undefined || v === null) return m;
    return k[0] !== low[0] ? cap(String(v)) : String(v);
  });
}
export const pickLine = (s, list, ctx) => fill(pick(s, list), ctx);
