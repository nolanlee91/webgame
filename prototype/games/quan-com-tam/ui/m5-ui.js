// S (M5): giao diện tối thiểu cho lối chơi mới — tab Chuẩn bị "Hội chợ · Thử thách" (thẻ hội chợ + lịch thử thách 5 ngày),
// nút bật / tắt món ở tab Menu, danh sách huy hiệu ở Sổ · Huy hiệu. Gọi từ ui/progress-ui.js, ui/overlays.js, ui/book-tabs.js qua dòng "// S:".
// Không sửa index.html: dùng lại lớp có sẵn (card, rowx, btn, review, muted).
import { el, button } from "./common.js?v=c6";
import { FAIR, CHALLENGE, DISHES, GEAR } from "../data/economy.js?v=c6";
import * as EX from "../core/extras.js?v=c6";

const ERR = { "too-soon": "Hội chợ mỗi 4 ngày một lần.", already: "Hôm nay đã thuê gian rồi.", "fair-day": "Hôm nay đi hội chợ, thử thách để hôm khác.", "day-started": "Ngày đã bắt đầu, mai nha.",
  money: "Không đủ tiền.", locked: "Chưa mở khoá.", "last-dish": "Phải còn ít nhất một món.", needs: "Cần mua đồ nghề trước." };
export const errText = (e) => ERR[e] || null;

/** Tab Chuẩn bị "Hội chợ · Thử thách" (cấp 18+). doAct = (action) ⇒ kết quả, tự vẽ lại. */
export function fairTab(main, s, doAct) {
  const c = el("div", "card", main);
  c.dataset.s = "fair";
  el("h3", "", c, "Đêm hội ẩm thực bờ sông");
  el("p", "", c, `Thuê gian ${FAIR.price}k: ca tối hôm nay thành đêm hội ${Math.round(FAIR.ms / 60000)} phút, thêm ~${FAIR.guests} khách đi nhóm 2–4 người, giá bán +${Math.round((FAIR.priceMul - 1) * 100)}%, khách hội chợ kém kiên nhẫn hơn. Mỗi ${FAIR.every} ngày một lần.`);
  if (s.level < FAIR.level) el("p", "muted", c, `Mở ở cấp ${FAIR.level}.`);
  else if (s.stage !== "quan") el("p", "muted", c, "Lên quán rồi mới được ban tổ chức mời.");
  else if (EX.fairToday(s)) el("p", "", c, `Đã thuê gian cho tối nay (lần thứ ${s.fair.count}). Chuẩn bị nhiều sườn, nhóm đủ than!`);
  else if (!EX.fairAvailable(s)) el("p", "muted", c, `Hội chợ kế tiếp: ngày ${EX.nextFairDay(s)}.`);
  button(c, "btn primary", `Thuê gian · ${FAIR.price}k`, () => doAct({ type: "fair" }), { "data-act": "fair", disabled: EX.fairAvailable(s) && s.money >= FAIR.price ? null : "" });

  const k = el("div", "card", main);
  k.dataset.s = "challenge";
  el("h3", "", k, "Lịch thử thách");
  el("p", "muted", k, s.level < CHALLENGE.level ? `Mở ở cấp ${CHALLENGE.level}. Miễn phí, đạt lần đầu +${CHALLENGE.firstReward.money}k, +${CHALLENGE.firstReward.xp} XP và huy hiệu; lần sau +${CHALLENGE.reward.money}k, +${CHALLENGE.reward.xp} XP.`
    : `Miễn phí. Đạt lần đầu +${CHALLENGE.firstReward.money}k, +${CHALLENGE.firstReward.xp} XP và huy hiệu; lần sau +${CHALLENGE.reward.money}k, +${CHALLENGE.reward.xp} XP.`);
  for (const d of EX.challengeWeek(s)) {
    const r = el("div", "rowx", k);
    const l = el("div", "", r);
    el("div", "nm", l, `Ngày ${d.day}: ${d.name}${s.badges?.["tt-" + d.id] ? " · đã có huy hiệu" : ""}`);
    el("div", "sub", l, d.desc);
    if (d.day === s.day && s.level >= CHALLENGE.level) {
      const on = s.challenge?.day === s.day;
      button(r, "btn small" + (on ? " primary" : ""), on ? "Đã nhận · bỏ" : "Nhận thử thách", () => doAct({ type: "challenge", on: !on }), { "data-act": "challenge", disabled: s.shiftIdx > 0 || EX.fairToday(s) ? "" : null });
    }
  }
}

/** Nút bật / tắt một món ở tab Menu (overlays.js). */
export function menuToggle(row, s, id, act, rerender) {
  const d = DISHES[id];
  if (d.special || d.level > s.level || (d.needs || []).some((k) => !s.owned?.[k])) return;
  const on = (s.menu || []).includes(id);
  button(row, "btn small" + (on ? "" : " primary"), on ? "Tắt món" : "Bán lại", () => { act({ type: "toggleDish", id, on: !on }); rerender(); }, { "data-dish": id });
}

/** Sổ · Huy hiệu: 14 huy hiệu (đã có / chưa có). */
export function badges(body, s, { el: mk = el } = {}) {
  const got = Object.keys(s.badges || {}).length;
  mk("h3", "", body, `Huy hiệu (${got}/${EX.BADGES.length})`);
  for (const b of EX.BADGES) {
    const day = s.badges?.[b.id];
    const d = mk("div", "review" + (day ? "" : " muted"), body, `${day ? "★" : "☆"} ${b.name} — ${b.desc}${day ? ` (ngày ${day})` : ""}`);
    d.dataset.badge = b.id;
  }
  if (s.fair?.count) mk("p", "muted", body, `Đã dự ${s.fair.count} đêm hội chợ.`);
}
export { GEAR };

/** Bảng chốt ca: đêm hội chợ, kết quả thử thách, huy hiệu mới. */
export function summary(box, m) {
  if (m.levelUps?.length) { const p = el("p", "", box, `Lên cấp ${m.levelUps.join(", ")} trong ca!`); p.dataset.s = "level-up"; }
  if (m.fair && m.fairLine) { const p = el("p", "", box, `Đêm hội chợ: ${m.fairLine}`); p.dataset.s = "fair-done"; }
  if (m.challenge) {
    const c = m.challenge;
    const p = el("p", "", box, `Thử thách ${c.name}: ${c.ok ? `ĐẠT (+${c.money}k, +${c.xp} XP${c.first ? ", huy hiệu mới" : ""})` : "chưa đạt"}. ${c.line}`);
    p.dataset.s = "challenge-done";
  }
  for (const b of m.badges || []) el("p", "", box, `Huy hiệu mới: ${b.name}.`).dataset.badge = b.id;
}

/** Chữ ký vẽ lại của nút bày ×N (cột Dĩa). */
export const batchSig = (s, sl) => `${sl.batchTks?.length || 0}:${sl.plate ? 1 : 0}:${sl.tk !== null && !sl.plate ? EX.batchCandidates(s, sl.tk).length : 0}`;
/** Nút "Bày ×N" ở đầu cột Dĩa: phiếu cùng bàn, cùng món, cùng dặn riêng ⇒ một lượt bày nhiều dĩa, bưng một chuyến (ô bày đôi 2, khay mâm 4). */
export function batchButton(head, s, sl, tkt, act) {
  if (sl.batchTks?.length) {
    const d = el("div", "a-batch", head, `Bày ×${1 + sl.batchTks.length}: mỗi chạm áp cho ${1 + sl.batchTks.length} dĩa cùng món, bưng một chuyến.`);
    if (!sl.plate) button(d, "btn small", "Bày từng dĩa", () => act({ type: "batchPin", on: false }), { "data-act": "batchOff" });
    return;
  }
  if (sl.plate || tkt.takeaway) return;
  const n = EX.batchCandidates(s, tkt.id).length;
  if (n) button(head, "btn small", `Bày ×${n + 1} (${n + 1} dĩa cùng món, cùng bàn)`, () => act({ type: "batchPin", on: true }), { "data-act": "batchPin" });
}
