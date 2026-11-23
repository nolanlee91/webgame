// Gộp A + B + C: tab cắm vào Sổ quản lý (ui/notebook.js registerTab). Nạp một lần từ ui/overlays.js.
//   events   "Sự kiện"   (B) lịch sử tình huống s.drama.history + khoảnh khắc Nhật Ký s.drama.moments
//   missions "Nhiệm vụ"  (A) nhiệm vụ ca đang mở / ca vừa chốt
//   badges   "Huy hiệu"  (A) cấp, giai đoạn quán, hạng quán, cột mốc (lên quán, mâm cơm), khách quen, kỷ niệm vỉa hè
//   debts    "Sổ nợ"     (A) sổ ghi nợ, xoá nợ (ngoài ca)
import { registerTab } from "./notebook.js?v=c2";
import { xpToNext } from "../core/progress.js?v=c2";
import { DISHES, DEBT, TIERS } from "../data/economy.js?v=c2";
import * as PG from "../core/progression.js?v=c2";
import * as PU from "./progress-ui.js?v=c2";

registerTab("events", "Sự kiện", (body, s, { el }) => {
  const hist = s.drama?.history || [];
  const moments = s.drama?.moments || [];
  if (!hist.length && !moments.length) { el("p", "muted", body, "Chưa có tình huống nào. Mở quán vài ngày là có chuyện."); return; }
  if (moments.length) {
    el("h3", "", body, "Khoảnh khắc (vào Nhật Ký)");
    for (const m of moments.slice(0, 8)) { const d = el("div", "review", body); d.dataset.moment = m.id || ""; el("b", "", d, `Ngày ${m.day}: `); el("span", "", d, `“${m.line}”${m.name ? " — " + m.name : ""}`); }
  }
  if (hist.length) {
    el("h3", "", body, "Đã xử lý");
    for (const h of hist.slice(0, 20)) {
      const d = el("div", "review", body); d.dataset.event = h.id;
      el("b", "", d, `Ngày ${h.day}${h.who ? " · " + h.who : ""}: `);
      el("span", "", d, h.label || h.choice || "");
      if (h.line) el("div", "small muted", d, h.line);
    }
  }
});

registerTab("missions", "Nhiệm vụ", (body, s, { el }) => {
  if (!PG.missionsUnlocked(s)) { el("p", "muted", body, "Nhiệm vụ ngày mở từ cấp 2 (sau ngày hướng dẫn)."); return; }
  const live = s.shift?.missions;
  const last = s.lastSummary?.missions;
  const list = live || last || [];
  if (!list.length) { el("p", "muted", body, "Mở ca là có 3 nhiệm vụ: làm xong được thưởng XP và tiền."); return; }
  el("h3", "", body, live ? "Ca đang mở" : `Ca vừa chốt (ngày ${s.lastSummary.day})`);
  for (const m of list) el("div", "review" + (m.done ? " done" : ""), body, `${m.done ? "[xong]" : live ? "[đang làm]" : "[hụt]"} ${m.text} (${Math.min(m.prog, m.n)}/${m.n})`).dataset.mission = m.id || m.text;
});

registerTab("badges", "Huy hiệu", (body, s, { el }) => {
  const nx = xpToNext(s);
  el("p", "", body, `Cấp ${s.level}${nx ? ` · ${nx.have}/${nx.need} XP tới cấp sau` : ""} · ${PG.stageName(s)}${s.tier ? ` · hạng ${s.tier}/${TIERS.length}` : ""} · đã bán ${s.stats?.plates || 0} dĩa · ${s.stats?.shifts || 0} ca.`);
  const marks = [];
  if (s.streetMemory) marks.push(`Lên quán ngày ${s.streetMemory.movedDay}`);
  const doneOrders = s.stats?.ordersDone || 0;
  if (doneOrders) marks.push(`${doneOrders} đơn đặt / mâm cơm giao đúng giờ`);
  if (s.stats?.debtPaid) marks.push(`Khách trả nợ ${s.stats.debtPaid}k`);
  if (s.fishSauce) marks.push(`Nước mắm nhà pha bậc ${s.fishSauce}`);
  if (PG.isFamous(s)) marks.push("Quán nổi tiếng");
  el("h3", "", body, "Cột mốc");
  if (!marks.length) el("p", "muted", body, "Chưa có cột mốc. Lên quán (cấp 7), giao mâm cơm đúng giờ, lên hạng quán…");
  for (const m of marks) el("div", "review", body, m);
  const regs = Object.entries(s.regulars || {});
  el("h3", "", body, "Khách quen");
  if (!regs.length) el("p", "muted", body, "Phục vụ khách quen hai lần từ 4 sao, họ sẽ gọi như hôm qua.");
  for (const [name, r] of regs) el("p", "", body, `${name}: ${r.visits} lần ghé${r.fav ? ` · như hôm qua: ${DISHES[r.fav.dish]?.name || r.fav.dish}` : ""}`);
  if (s.streetMemory) { el("h3", "", body, "Kỷ niệm vỉa hè"); el("p", "", body, s.streetMemory.line); }
});

registerTab("debts", "Sổ nợ", (body, s, { act, rerender, el }) => {
  if (s.level < DEBT.level && !(s.debts || []).length) { el("p", "muted", body, `Ghi sổ mở ở cấp ${DEBT.level}: khách quen xin ăn trước trả sau lúc tính tiền.`); return; }
  PU.book(body, s, { act, rerender }); // sổ nợ (xoá nợ ngoài ca) + kỷ niệm vỉa hè
});
