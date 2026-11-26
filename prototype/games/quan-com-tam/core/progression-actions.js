// A: thao tác M3 (tiến trình + kinh tế) cho core/apply.js. Gộp vào HANDLERS bằng một dòng `...aHandlers(deps)`; khoá trùng (layer, undo, discard,
// serve, buyGear, prepCook) bọc bản gốc để thêm bày ×N cho mâm cơm, lọc đồ vỉa hè / quán, cỡ nồi theo giai đoạn.
import * as PG from "./progression.js?v=c9";
import * as st from "./stock.js?v=c9";
import { judge } from "./score.js?v=c9";
import { cookNow } from "./rice.js?v=c9";
import { LATE } from "../data/economy.js?v=c9";

export function aHandlers({ noShift, noDialog, ownerOnly, inShift, outToDialog, pl, tb, sh, autoStep }) {
  return {
    // ---- bọc thao tác gốc ----
    layer: ownerOnly((s, a, ev) => outToDialog(s, PG.batchLayer(s, a.id, ev, pl.layer), ev)),
    undo: ownerOnly((s, a, ev) => PG.batchUndo(s, ev, pl.undo)),
    discard: noDialog((s, a, ev) => PG.batchDiscard(s, ev, pl.discard)),
    autoStep: ownerOnly((s, a, ev) => {
      if (!PG.isCateringSlot(s)) return autoStep(s, ev);
      const n = pl.nextStep(s);
      if (n === "serve") return PG.serveCatering(s, ev, judge);
      if (n && n !== "grill" && n !== "egg" && !n.startsWith("wait")) return outToDialog(s, PG.batchLayer(s, n, ev, pl.layer), ev);
      return autoStep(s, ev);
    }),
    serve: noDialog((s, a, ev) => (PG.isCateringSlot(s) ? PG.serveCatering(s, ev, judge) : sh.serve(s, ev))),
    buyGear: noShift((s, a, ev) => { const b = PG.gearBlock(s, a.id); return b ? { err: b } : st.buyGear(s, a.id, ev); }),
    prepCook: noShift((s, a, ev) => { const r = { n: s.kitchen.rice, size: PG.potSize(s), cooking: null }; const out = cookNow(s, r, ev); if (out.ok) s.kitchen.rice = r.n; return out; }),
    // ---- mới ----
    rentQuan: (s, a, ev) => PG.rentQuan(s, ev),
    restockHoa: (s, a, ev) => PG.restockHoa(s, a.id, ev),
    hireStaff: (s, a, ev) => PG.hireStaff(s, a.id, a.on !== false, ev),
    buyDecor: (s, a, ev) => PG.buyDecor(s, a.id, ev),
    placeDecor: (s, a, ev) => PG.placeDecor(s, a.id, Number(a.x), Number(a.y), ev),
    buyTier: (s, a, ev) => PG.buyTier(s, ev),
    buyFishSauce: (s, a, ev) => PG.buyFishSauce(s, ev),
    promo: (s, a, ev) => PG.promo(s, a.kind, ev),
    acceptOrder: (s, a, ev) => PG.acceptOrder(s, a.idx, ev),
    forgiveDebt: (s, a, ev) => PG.forgiveDebt(s, a.id, ev),
    ghiSo: noDialog((s, a, ev) => PG.resolveGhiSo(s, !!a.accept, ev, tb.collect)),
    setLate: noShift((s, a) => { if (s.level < LATE.level) return { err: "locked" }; s.lateShift = !!a.on; return { ok: true }; }),
    blower: inShift((s, a, ev) => { if (!s.owned?.["electric-blower"]) return { err: "locked" }; s.shift.grill.blower = !!a.on; ev.push({ type: "blower", on: !!a.on }); return { ok: true }; }),
  };
}
