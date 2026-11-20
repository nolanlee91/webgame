// Gợi ý ngày 1 (GAME-DESIGN §7 M2: người mới tự nướng, ráp và giao được 1 ổ không cần đọc hướng dẫn ngoài).
// hint(s) ⇒ { key, text } theo trạng thái; key cũng là tên vùng UI được làm nổi (ui/bench.js). Thuần.
import { HINTS } from "../data/lines-ops.js?v=b3";
import { TOASTER } from "../data/economy.js?v=b3";
import { batchLevel, bakingCount } from "./oven.js?v=b3";
import { board, STEPS } from "./board.js?v=b3";

export function hint(s) {
  const sh = s.shift;
  if (!sh || sh.dialog || sh.away) return null;
  const mk = (key) => ({ key, text: HINTS[key] });
  if (sh.oven.some((b) => b && ["golden", "dark", "burnt"].includes(batchLevel(s, b)))) return mk("pull");
  if (sh.paying !== null) return mk("change");
  const b = board(s);
  if (b.cid !== null) {
    const c = sh.customers.find((x) => x.id === b.cid);
    const it = c?.items[b.item];
    if (!b.loaf) return sh.case.length ? mk("take") : sh.oven.some(Boolean) ? mk("waitOven") : mk("bake");
    const l = b.loaf;
    if (l.toastT0 !== null) return mk("toasting");
    if (l.wrap) return mk("serve");
    if (!l.sliced) return it?.crispy && l.crisp < TOASTER.minCrisp && !l.toasted ? mk("toast") : mk("slice");
    const nextStep = STEPS[Math.max(b.step + 1, 3)] || "wrap";
    return mk(nextStep);
  }
  if (sh.customers.some((c) => c.phase === "wait")) return sh.case.length || bakingCount(sh) ? mk("pin") : mk("bake");
  if (sh.case.length + bakingCount(sh) < 4 && (s.stock.phoi || 0) > 0 && sh.oven.some((x) => !x)) return mk("bake");
  if (sh.oven.some(Boolean)) return mk("waitOven");
  return mk("idle");
}
