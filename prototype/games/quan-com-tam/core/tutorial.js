// Gợi ý từng bước ngày 1 (GAME-DESIGN §7 M2: người mới tự nướng, bày và bưng được 1 dĩa mà không cần đọc hướng dẫn ngoài).
// hint(s) ⇒ { key, text, target } theo trạng thái; target là vùng UI được làm nổi (data-hint ở ui/). Thuần.
import { itemResult, isCooked, sideState } from "./grill.js?v=c2";
import { slotOf, ticketOf, targetOf, nextStep, LAYER_NAME } from "./plate.js?v=c2";
import { tableJob, availableTables } from "./tables.js?v=c2";
import { ownerFree } from "./walker.js?v=c2";

export const HINTS = {
  seat: "Có khách! Chạm khách đang đứng chờ, rồi chạm một bàn trống để mời ngồi.",
  visit: "Khách đã ngồi. Chạm bàn: cô chủ ra châm trà đá và lấy phiếu gọi món.",
  pin: "Phiếu mới! Chạm phiếu để ghim lên ô bày dĩa.",
  grill: "Chạm một chỗ trống trên vỉ để bỏ miếng sườn ướp. Hai chỗ bên trái là vùng nóng, chín nhanh.",
  flip: "Mặt dưới đã chín vàng! Chạm miếng sườn để lật mặt kia xuống than.",
  waitMeat: "Sườn đang nướng. Trong lúc chờ, bày dĩa: lấy dĩa, xới cơm, rưới mỡ hành.",
  layer: "Bày tiếp: chạm ô “{layer}” trên dải lớp.",
  pick: "Sườn chín hai mặt rồi! Chạm miếng sườn để gắp vào dĩa.",
  serve: "Dĩa đủ lớp rồi. Bấm Giao: cô chủ bưng ra bàn (bếp vẫn chạy trong lúc đi).",
  bill: "Bàn gọi tính tiền. Chạm bàn, cộng từng dòng (hoặc bấm “Tính đúng”), rồi Thu tiền.",
  billing: "Chạm từng món bàn đã ăn để cộng tiền. Ngày 1–3 có nút “Tính đúng”. Xong bấm Thu tiền.",
  clean: "Bàn dơ thì khách mới không ngồi được. Chạm bàn để dọn và lau.",
  wash: "Dĩa sạch sắp hết. Chạm thau rửa chén (nút Dĩa sạch) để rửa.",
  coal: "Than sắp tàn: bấm Than để thêm một rổ.",
  rice: "Nồi cơm sắp hết: bấm Nấu để nấu mẻ mới (40 giây).",
  busy: "Cô chủ đang đi làm việc ở bàn. Bếp vẫn chạy, coi chừng sườn cháy!",
  burnt: "Miếng sườn cháy đen rồi. Chạm để bỏ, rồi nướng miếng khác.",
  idle: "Chờ khách tới. Có thể nướng sẵn một miếng rồi dời sang vùng giữ ấm bên phải.",
};

export function hint(s) {
  const sh = s.shift;
  if (!sh || sh.dialog || sh.owner.away) return null;
  const mk = (key, extra = {}) => ({ key, text: (HINTS[key] || "").replace("{layer}", extra.layer || ""), ...extra });
  const g = sh.grill;
  if (sh.billing) return mk("billing");
  const burnt = g.slots.findIndex((it) => it && itemResult(it) === "burnt");
  if (burnt >= 0) return mk("burnt", { slot: burnt });
  // lật: mặt dưới chín mà mặt trên còn sống
  const flipI = g.slots.findIndex((it) => it && it.sides[0] >= 100 && it.sides[1] < 100);
  if (flipI >= 0 && ownerFree(s)) return mk("flip", { slot: flipI });
  const tables = sh.tables;
  if (tables.some((t) => tableJob(s, t.id) === "bill")) return mk("bill", { tid: tables.find((t) => tableJob(s, t.id) === "bill").id });
  if (sh.groups.some((x) => x.phase === "wait") && tables.some((t) => tableJob(s, t.id) === "seat")) return mk("seat");
  const sl = slotOf(s);
  if (sl.tk !== null) {
    if (!ownerFree(s)) return mk("busy");
    const n = nextStep(s);
    if (n === "grill") return mk("grill", { slot: g.slots.findIndex((x) => !x) });
    if (n === "meat") return mk("pick", { slot: g.slots.findIndex((it) => it && isCooked(it)) });
    if (n === "wait-meat") {
      const p = sl.plate;
      if (!p) return mk("layer", { layer: LAYER_NAME[targetOf(ticketOf(s, sl.tk)).kind], step: targetOf(ticketOf(s, sl.tk)).kind });
      if (!p.com) return mk("layer", { layer: LAYER_NAME.com, step: "com" });
      if (!p.moHanh && targetOf(ticketOf(s, sl.tk)).moHanh) return mk("layer", { layer: LAYER_NAME.moHanh, step: "moHanh" });
      return mk("waitMeat");
    }
    if (n === "serve") return mk("serve");
    if (n && LAYER_NAME[n]) return mk("layer", { layer: LAYER_NAME[n], step: n });
  }
  if (sh.tickets.some((t) => t.status === "open")) return mk("pin", { tk: sh.tickets.find((t) => t.status === "open").id });
  const visit = tables.find((t) => tableJob(s, t.id) === "visit");
  if (visit) return mk("visit", { tid: visit.id });
  const dirty = tables.find((t) => tableJob(s, t.id) === "clean");
  if (dirty) return mk("clean", { tid: dirty.id });
  if (sh.cleanPlates <= 2 && sh.dirty > 0) return mk("wash");
  if (g.coal < 25 && (s.stock.than || 0) > 0) return mk("coal");
  if (sh.rice.n <= 3 && !sh.rice.cooking && (s.stock["gao-tam"] || 0) > 0) return mk("rice");
  return mk("idle");
}
