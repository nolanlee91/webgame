// A: giao diện tiến trình + kinh tế M3 trong bảng Chuẩn bị / chốt ca / Sổ (ui/overlays.js gọi qua vài dòng "// A:").
// Tab: Nhập hàng (Cô Ba + Chú Hòa), Đồ nghề (đồ, phụ việc theo ngày, thuê mặt bằng), Trang trí (mua + kéo thả trong quán),
// Đơn đặt (đơn đặt trước / mâm cơm), Hạng quán (hạng, nước mắm nhà pha, quảng bá), Ca (trưa / tối / cả hai, ca khuya kéo dài).
// CSS riêng chèn một lần (không sửa index.html).
import { el, button, fmtK } from "./common.js?v=c5";
import { STOCK, DISHES, GEAR, STAFF, DECOR, TIERS, FISH_SAUCE, PROMOS, PROMO_UNLOCK, SHIFTS, RENT, LATE, PREORDER, DEBT, hoaPack } from "../data/economy.js?v=c5";
import { packPrice, packSize, canBuy, maxPlates } from "../core/stock.js?v=c5";
import * as PG from "../core/progression.js?v=c5";
import { icon } from "../render/atlas.js?v=c5"; // V: hình thật của đồ trang trí trên khung kéo thả
import * as M5 from "./m5-ui.js?v=c5"; // S: tab Hội chợ · Thử thách (M5)

const BUY_ORDER = ["suon", "gao-tam", "than", "do-chua", "dua-leo", "nuoc-mam", "mo-hanh-bo", "tra", "khan-lanh", "hop", "bi", "trung", "cha", "tui", "suon-non", "ga", "lap-xuong", "dau-hu", "bi-chay", "cha-chay", "nuoc-tuong"];
const OWN_TABS = new Set(["buy", "gear", "decor", "orders", "rank", "shift", "fair"]); // S: fair
export const renders = (tab) => OWN_TABS.has(tab);

let cssDone = false;
function css() {
  if (cssDone || typeof document === "undefined") return;
  cssDone = true;
  const st = document.createElement("style");
  st.dataset.a = "progress";
  st.textContent = `
  .a-plan { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
  .a-plan .btn.on { background: var(--indigo2); color: #fff; }
  .a-drag { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #3a2c22 center / cover no-repeat; touch-action: none; margin: 8px 0; box-shadow: 0 0 0 2px var(--cream3); }
  .a-drag .zone { position: absolute; border: 2px dashed rgba(255, 240, 200, .45); border-radius: 8px; pointer-events: none; }
  .a-drag .pin { position: absolute; transform: translate(-50%, -100%); min-width: 44px; min-height: 44px; padding: 2px 6px; border-radius: 10px; border: 0; background: #ffe7b0; color: #3a2416; font: 800 11px/1.1 inherit; box-shadow: 0 2px 0 rgba(0,0,0,.35); cursor: grab; touch-action: none; display: flex; align-items: center; justify-content: center; text-align: center; }
  .a-drag .pin.has-spr, .a-drag .pin.wall.has-spr { background: rgba(255, 240, 200, .18); padding: 0; box-shadow: 0 0 0 1.5px rgba(255, 240, 200, .55) inset; } /* V: */
  .a-drag .pin.has-spr .ico { display: block; image-rendering: pixelated; pointer-events: none; }
  .a-drag .pin.has-spr small { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(255, 250, 240, .95); color: #3a2416; border-radius: 7px; padding: 0 5px; font-size: 10px; pointer-events: none; }
  .a-drag .pin.wall { background: #f6c0a8; } .a-drag .pin.drag { cursor: grabbing; outline: 3px solid var(--amber); z-index: 5; } .a-drag .pin.bad { outline: 3px solid #c8342a; }
  .a-tag { display: inline-block; font-size: 11px; font-weight: 800; border-radius: 6px; padding: 0 6px; background: var(--cream2); margin-left: 4px; }
  .a-tag.good { background: #cfe9d6; color: #1e5a33; } .a-tag.warn { background: var(--ember-l); color: #7a2a22; }
  .a-miss { font-size: 12.5px; margin: 2px 0; } .a-miss.done { color: #2f5a50; text-decoration: line-through; }
  .a-missions { background: #fffaf0; color: var(--ink); border-radius: 12px; padding: 6px 10px; margin-top: 6px; box-shadow: 0 0 0 1.5px var(--cream3) inset; }
  .a-missions h3 { margin: 0 0 2px; font-size: 13px; }
  .a-ghiso { background: #fff1d6; border-radius: 10px; padding: 6px 8px; box-shadow: 0 0 0 2px var(--amber) inset; font-size: 12.5px; }
  .a-ghiso .acts { margin-top: 4px; }
  .a-slots { display: flex; gap: 6px; margin-bottom: 4px; } .a-slots .btn.on { background: var(--indigo2); color: #fff; }
  .a-batch { font-size: 12px; font-weight: 800; color: var(--brown); }
  `;
  document.head.appendChild(st);
}

/** Danh sách tab Chuẩn bị (base = tab gốc của overlays.js). */
export function tabs(s, base) {
  css();
  const out = base.slice();
  const add = (id, name, after) => { const i = out.findIndex((t) => t[0] === after); out.splice(i < 0 ? out.length : i + 1, 0, [id, name]); };
  if (s.level >= 4) add("decor", "Trang trí", "gear");
  if (PG.ordersOpen(s)) add("orders", "Đơn đặt", "shift");
  if ((s.level >= 10 && s.stage === "quan") || s.level >= PROMO_UNLOCK) add("rank", "Hạng quán", "decor");
  if (s.level >= 18) add("fair", "Hội chợ · Thử thách", "rank"); // S: M5
  return out;
}

const row = (main, name, sub) => { const r = el("div", "rowx", main); const l = el("div", "", r); el("div", "nm", l, name); if (sub) el("div", "sub", l, sub); return { r, right: el("div", "r", r) }; };
const ERR = {
  money: "Không đủ tiền.", capacity: "Kho đầy rồi.", locked: "Chưa mở khoá.", owned: "Đã có rồi.", needs: "Cần mua món đi kèm trước.", "needs-quan": "Phải lên quán trước.",
  "not-needed": "Lên quán rồi, không cần nữa.", "preorder-max": "Tối đa 2 đơn mỗi ngày.", "once-per-day": "Mỗi ngày quảng bá một lần.", "day-started": "Ngày đã bắt đầu, mai nhận nha.", max: "Đã tới bậc cuối.", "plates-max": "Chồng dĩa đã tới trần tủ.",
};
const errText = (e) => ERR[e] || M5.errText(e) || PG.PLACE_REASON[String(e).replace("place-", "")] || "Không làm được."; // S: lỗi M5

/** Vẽ tab của phần A. ctx = { act, rerender(tab?), toast, atlas }. */
export function render(tab, main, s, ctx) {
  css();
  const doAct = (a, keep = tab) => { const r = ctx.act(a); if (r.err) ctx.toast(errText(r.err), "warn"); ctx.rerender(keep); return r; };
  if (tab === "buy") return buyTab(main, s, doAct);
  if (tab === "gear") return gearTab(main, s, doAct);
  if (tab === "decor") return decorTab(main, s, ctx, doAct);
  if (tab === "orders") return ordersTab(main, s, doAct);
  if (tab === "rank") return rankTab(main, s, doAct);
  if (tab === "shift") return shiftTab(main, s, doAct);
  if (tab === "fair") return M5.fairTab(main, s, doAct); // S: M5
}

function buyTab(main, s, doAct) {
  button(main, "btn primary", "Nhập + ướp đủ cho hôm nay", () => doAct({ type: "restockToday" }), { "data-act": "restockToday" });
  el("p", "muted", main, PG.hoaOpen(s)
    ? "Cô Ba sạp thịt chợ (gói nhỏ, giao gấp trong ca được) · Chú Hòa vựa gạo than (gói gấp đôi rẻ 10%, chỉ giao trước ca)."
    : "Cô Ba sạp thịt chợ: sườn, gạo tấm, đồ chua, dưa leo, nước mắm, than, trà, hộp. Hàng tươi có hạn (dưa leo, bì, sườn sống 3 ngày). Chú Hòa mở ở cấp 9.");
  for (const id of BUY_ORDER) {
    if (!canBuy(s, id)) continue;
    const { right } = row(main, STOCK[id].name, `Có ${s.stock[id] || 0} ${STOCK[id].unit}`);
    button(right, "btn small", `Cô Ba +${packSize(id)} · ${packPrice(id)}k`, () => doAct({ type: "restock", id }), { "data-buy": id, disabled: packPrice(id) > s.money ? "" : null });
    if (PG.canBuyHoa(s, id)) { const [n, p] = hoaPack(id); button(right, "btn small", `Chú Hòa +${n} · ${p}k`, () => doAct({ type: "restockHoa", id }), { "data-hoa": id, disabled: p > s.money ? "" : null }); }
  }
}

function rentCard(main, s, doAct) {
  if (s.stage !== "street" || s.level < RENT.level) return;
  const c = el("div", "card", main);
  el("h3", "", c, "Thuê mặt bằng lên quán?");
  el("p", "", c, `Quán có mái: nồi cơm lớn 20 phần, ${RENT.plates} dĩa, kho 140, 3 bàn (một bàn 4 chỗ), đơn đặt trước. Phí ca tăng. Đồ đã mua và hàng trong kho đi theo.`);
  el("p", "muted", c, "Ở lại vỉa hè cũng được: bán tiếp, đủ tiền thì thuê sau.");
  button(c, "btn primary", `Thuê ngay · ${RENT.price}k`, () => doAct({ type: "rentQuan" }), { "data-act": "rentQuan", disabled: s.money < RENT.price ? "" : null });
}

function gearTab(main, s, doAct) {
  rentCard(main, s, doAct);
  el("h3", "", main, "Đồ nghề");
  const list = Object.entries(GEAR).filter(([id, G]) => !(G.street && s.stage === "quan")).sort((a, b) => a[1].level - b[1].level);
  for (const [id, G] of list) {
    const block = PG.gearBlock(s, id);
    const owned = !G.repeat && s.owned[id];
    const sub = G.level > s.level ? `Mở ở cấp ${G.level}` : block === "needs-quan" ? `Cần lên quán · ${G.text}` : block === "needs" ? `Cần ${GEAR[G.needs]?.name} · ${G.text}` : G.text;
    const { right } = row(main, `${G.name} · ${G.price}k`, sub);
    const dis = owned || !!block || G.price > s.money || (id === "plates-4" && s.plates + 4 > maxPlates(s));
    button(right, "btn small", owned ? "Đã có" : "Mua", () => doAct({ type: "buyGear", id }), { "data-gear": id, disabled: dis ? "" : null });
  }
  el("h3", "", main, "Phụ việc (thuê theo ngày, trả lương mỗi ca mở)");
  for (const [id, S] of Object.entries(STAFF)) {
    const on = PG.staffToday(s, id);
    const { right } = row(main, `${S.name} · ${S.price}k / ca`, S.level > s.level ? `Mở ở cấp ${S.level}` : S.text);
    button(right, "btn small" + (on ? " primary" : ""), on ? "Đang thuê hôm nay" : "Thuê hôm nay", () => doAct({ type: "hireStaff", id, on: !on }), { "data-staff": id, disabled: S.level > s.level || s.shiftIdx > 0 ? "" : null });
  }
}

/** Trang trí: mua + (ở quán) kéo thả trên ảnh cảnh quán. Đồ không đặt được trên bàn, lối đi, chỗ khách chờ. */
function decorTab(main, s, ctx, doAct) {
  el("p", "muted", main, `Hấp dẫn ${String(PG.appeal(s)).replace(".", ",")} / ${s.level >= 19 ? 4 : 3} (mỗi điểm thêm khách đi ngang mỗi ca).${s.stage === "quan" ? " Kéo đồ đã mua trên hình quán để đổi chỗ." : " Lên quán thì kéo thả đổi chỗ được; vỉa hè đặt chỗ mặc định."}`);
  if (s.stage === "quan") {
    const box = el("div", "a-drag", main);
    const src = ctx.atlas?.sheet?.("quan") ? ctx.atlas.base + ctx.atlas.sheet("quan").filename : "";
    if (src) box.style.backgroundImage = `url("${src}")`;
    box.dataset.drag = "decor";
    const Z = { wall: { x: [40, 1240], y: [80, 330] }, floor: { x: [20, 1260], y: [420, 712] } };
    for (const z of Object.values(Z)) { const d = el("div", "zone", box); d.style.left = (z.x[0] / 12.8) + "%"; d.style.top = (z.y[0] / 7.2) + "%"; d.style.width = ((z.x[1] - z.x[0]) / 12.8) + "%"; d.style.height = ((z.y[1] - z.y[0]) / 7.2) + "%"; }
    for (const id of Object.keys(s.decor || {})) {
      const D = DECOR[id];
      const at = PG.decorAt(s, id, ctx.atlas?.placements || {});
      const pin = button(box, "pin" + (D.place === "wall" ? " wall" : ""), D.name, null, { "data-decor": id, "aria-label": `${D.name}: kéo để đổi chỗ` });
      pin.style.left = (at[0] / 12.8) + "%"; pin.style.top = (at[1] / 7.2) + "%";
      if (ctx.atlas?.has?.("decor", id)) { // V: đồ thật (decor.webp, ô 128 cảnh) thu theo khung kéo thả; tên nhỏ dưới chân
        const k = (box.clientWidth || 640) / 1280;
        pin.textContent = ""; pin.classList.add("has-spr");
        pin.appendChild(icon(ctx.atlas, ["decor", id], Math.max(44, Math.round(128 * k)), "ico"));
        el("small", "", pin, D.name);
      }
      dragPin(pin, box, (x, y) => { const r = ctx.act({ type: "placeDecor", id, x, y }); if (r.err) { ctx.toast(errText(r.err), "warn"); return false; } ctx.toast(`Đã đặt ${D.name}.`, "good"); return true; });
    }
  }
  for (const [id, D] of Object.entries(DECOR)) {
    if (D.event && !s.decor?.[id]) continue;
    const own = !!s.decor?.[id];
    const { right } = row(main, `${D.name} · ${D.price}k`, D.level > s.level ? `Mở ở cấp ${D.level}` : `+${String(D.appeal).replace(".", ",")} hấp dẫn${D.guests ? `, ca tối +${D.guests} khách` : ""}${D.patience ? `, kiên nhẫn +${D.patience}%` : ""} · ${D.place === "wall" ? "treo tường" : "đặt sàn"}`);
    button(right, "btn small", own ? "Đã có" : "Mua", () => doAct({ type: "buyDecor", id }), { "data-decor-buy": id, disabled: own || D.level > s.level || D.price > s.money ? "" : null });
  }
}
/** Kéo thả một nút trên khung 1280×720 thu nhỏ; thả ⇒ onDrop(x, y) theo toạ độ cảnh; sai chỗ ⇒ về chỗ cũ. */
function dragPin(pin, box, onDrop) {
  let start = null;
  pin.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try { pin.setPointerCapture?.(e.pointerId); } catch { /* chuột giả lập: bỏ qua */ }
    start = { left: pin.style.left, top: pin.style.top };
    pin.classList.add("drag");
  });
  pin.addEventListener("pointermove", (e) => {
    if (!start) return;
    const r = box.getBoundingClientRect();
    const fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), fy = Math.max(0, Math.min(1, (e.clientY - r.top + pin.offsetHeight * 0.5) / r.height));
    pin.style.left = fx * 100 + "%"; pin.style.top = fy * 100 + "%";
  });
  const end = () => {
    if (!start) return;
    pin.classList.remove("drag");
    const x = Math.round(parseFloat(pin.style.left) * 12.8), y = Math.round(parseFloat(pin.style.top) * 7.2);
    if (!onDrop(x, y)) { pin.style.left = start.left; pin.style.top = start.top; }
    start = null;
  };
  pin.addEventListener("pointerup", end);
  pin.addEventListener("pointercancel", () => { if (start) { pin.style.left = start.left; pin.style.top = start.top; pin.classList.remove("drag"); start = null; } });
}

function ordersTab(main, s, doAct) {
  const today = (s.orders || []).filter((o) => o.day === s.day);
  el("p", "muted", main, `Khách đặt trước: cọc 30% nhận liền, giao đủ trước giờ hẹn. Trễ ≤ 30 giây trừ 10%, trễ hơn trừ 30%; tới hạn mà thiếu thì khách lấy phần đã xong, trả 70%. Tối đa ${PREORDER.perDay} đơn mỗi ngày.${s.level < PREORDER.cateringLevel ? ` Mâm cơm công ty (10+ phần, bày ×N) mở ở cấp ${PREORDER.cateringLevel}.` : ""}`);
  const offers = PG.orderOffers(s);
  if (!offers.length) el("p", "", main, "Hôm nay chưa có ai đặt.");
  offers.forEach((o, i) => {
    const total = Math.round(o.n * PG.orderUnit(s, o.dish) * (o.n >= 10 ? 0.93 : 1));
    const { right } = row(main, `${o.kind === "catering" ? "Mâm cơm" : "Đặt trước"}: ${o.name}`, `${o.label} · ${o.n} phần ${DISHES[o.dish].name.toLocaleLowerCase("vi")} · giao lúc ${Math.round(o.dueFrac * 100)}% ca · ${total}k (cọc ${Math.round(total * PREORDER.deposit)}k)`);
    button(right, "btn small", o.taken ? "Đã nhận" : "Nhận đơn", () => doAct({ type: "acceptOrder", idx: i }), { "data-offer": i, disabled: o.taken || today.length >= PREORDER.perDay || s.shiftIdx > 0 ? "" : null });
  });
  if (today.length) {
    el("h3", "", main, "Đơn hôm nay");
    for (const o of today) el("p", "", main, `• ${o.name}: ${o.done}/${o.n} phần ${DISHES[o.dish].name.toLocaleLowerCase("vi")} (${SHIFTS[o.shift]?.name.toLowerCase()}) · ${o.status === "done" ? "đã giao" : o.status === "late" ? "trễ" : "chờ"}`);
    if (PG.batchMax(s) < 2) el("p", "muted", main, "Mẹo: Ô bày đôi (cấp 6) bày 2 hộp một lượt, khay mâm (cấp 10) bày 4.");
  }
}

function rankTab(main, s, doAct) {
  if (s.stage === "quan" && s.level >= 10) {
    el("h3", "", main, `Hạng quán · bậc ${s.tier || 0}/${TIERS.length}`);
    el("p", "muted", main, "Mỗi bậc: thêm 1 khách đi ngang mỗi ca, kiên nhẫn +2%.");
    const T = TIERS[s.tier || 0];
    if (T) { const { right } = row(main, `Lên bậc ${(s.tier || 0) + 1} · ${fmtK(T.price)}`, T.level > s.level ? `Mở ở cấp ${T.level}` : ""); button(right, "btn small", "Lên hạng", () => doAct({ type: "buyTier" }), { "data-act": "buyTier", disabled: T.level > s.level || T.price > s.money ? "" : null }); }
    else el("p", "", main, "Đã tới bậc cuối.");
    el("h3", "", main, `Nước mắm nhà pha · bậc ${s.fishSauce || 0}/${FISH_SAUCE.length}`);
    el("p", "muted", main, "Mỗi bậc: mọi dĩa +1k giá bán, khách khen nước mắm.");
    const F = FISH_SAUCE[s.fishSauce || 0];
    if (F) { const { right } = row(main, `Pha bậc ${(s.fishSauce || 0) + 1} · ${fmtK(F.price)}`, F.level > s.level ? `Mở ở cấp ${F.level}` : ""); button(right, "btn small", "Pha", () => doAct({ type: "buyFishSauce" }), { "data-act": "buyFishSauce", disabled: F.level > s.level || F.price > s.money ? "" : null }); }
  }
  el("h3", "", main, "Quảng bá (một lần mỗi ngày)");
  if (s.level < PROMO_UNLOCK) { el("p", "muted", main, `Mở ở cấp ${PROMO_UNLOCK}.`); return; }
  const done = s.promo?.day === s.day;
  if (done) el("p", "", main, `Hôm nay đã chạy: ${PROMOS[s.promo.kind].name}${s.promo.roll ? ` (${s.promo.roll === "viral" ? "lên xu hướng" : s.promo.roll === "ok" ? "ổn" : "hơi xịt"})` : ""}.`);
  for (const [kind, P] of Object.entries(PROMOS)) {
    const { right } = row(main, `${P.name} · ${P.price ? P.price + "k" : "miễn phí"}`, P.desc);
    button(right, "btn small", "Chạy", () => doAct({ type: "promo", kind }), { "data-promo": kind, disabled: done || P.price > s.money ? "" : null });
  }
  el("p", "muted", main, `Người theo dõi: ${s.followers || 0}.`);
}

function shiftTab(main, s, doAct) {
  el("p", "", main, "Ca tối 17:30–23:00: tối sớm sinh viên, cao điểm 18:30–20:00, khuya thợ công trình và tài xế.");
  if (s.level < SHIFTS.trua.unlock) el("p", "muted", main, `Ca trưa (dân văn phòng) mở ở cấp ${SHIFTS.trua.unlock}.`);
  else {
    el("p", "", main, "Ca trưa 11:00–13:00: dân văn phòng tới dồn trong 45 phút, ăn nhanh, ghét bàn dơ; shipper lấy nhiều hộp mang về. Mở cả hai ca thì gấp đôi tiền, nhưng cũng gấp đôi than, gạo, phí ca.");
    const box = el("div", "a-plan", main);
    const cur = s.plan.join("+");
    for (const [kinds, label] of [[["trua"], "Chỉ ca trưa"], [["toi"], "Chỉ ca tối"], [["trua", "toi"], "Cả trưa + tối"]]) {
      button(box, "btn small" + (cur === kinds.join("+") ? " on" : ""), label, () => doAct({ type: "setPlan", kinds }), { "data-plan": kinds.join("+"), disabled: s.shiftIdx > 0 || s.dayDone ? "" : null });
    }
  }
  if (s.level >= LATE.level) {
    const { right } = row(main, "Ca khuya kéo dài tới 0:30", `Ca tối dài thêm ${Math.round(LATE.extraMs / 1000)} giây, khuya đông hơn 25%.`);
    button(right, "btn small" + (s.lateShift ? " primary" : ""), s.lateShift ? "Đang bật" : "Bật", () => doAct({ type: "setLate", on: !s.lateShift }), { "data-act": "late" });
  } else el("p", "muted", main, `Ca khuya kéo dài mở ở cấp ${LATE.level}.`);
  const w = PG.rollWeather(s);
  el("p", "muted", main, w.kind === "rain" ? `Hôm nay trời mưa: ${s.stage === "quan" ? "quán có mái, vắng 15%" : s.owned.awning ? "có mái bạt, vắng 15%" : "vỉa hè vắng 40% (mái bạt cấp 6 đỡ hơn)"}.` : "Hôm nay trời khô ráo.");
}

/** Cột phải bảng Chuẩn bị: sổ nợ, tin trả nợ, giai đoạn quán, đơn hôm nay, thuê mặt bằng. */
export function side(card, s, ctx) {
  el("p", "muted", card, `${PG.stageName(s)} · hấp dẫn ${String(PG.appeal(s)).replace(".", ",")}${s.tier ? ` · hạng ${s.tier}` : ""}${PG.rainToday(s) ? " · trời mưa" : ""}`);
  if (s.level >= DEBT.level) el("p", "", card, `Sổ nợ: ${(s.debts || []).length} lần ghi, ${PG.debtTotal(s)}k / hạn mức ${DEBT.limit(s.level)}k.`);
  for (const n of (s.debtNews || []).slice(0, 3)) el("p", "muted", card, "• " + n);
  const today = (s.orders || []).filter((o) => o.day === s.day && o.status === "waiting");
  for (const o of today) el("p", "", card, `• Đơn ${o.name}: ${o.n} phần, ${SHIFTS[o.shift]?.name.toLowerCase()}.`);
  if ((s.friedRice || 0) > 0) el("p", "", card, `• Còn ${s.friedRice} phần cơm chiên từ cơm dư hôm qua.`);
  if (s.stage === "street" && s.level >= RENT.level) button(card, "btn small", s.money >= RENT.price ? `Thuê mặt bằng lên quán (${RENT.price}k)` : `Lên quán: cần ${RENT.price}k`, () => ctx.rerender("gear"), { "data-act": "toRent" });
}

/** Thêm vào chốt ca. */
export function summary(card, m) {
  if (m.missions?.length) {
    el("p", "", card, "Nhiệm vụ: " + m.missions.map((x) => `${x.done ? "[xong]" : "[hụt]"} ${x.text}`).join(" · ")).dataset.missions = "";
    for (const x of m.missionsMissed || []) el("p", "muted", card, `Hụt “${x.text}”. ${x.line}`);
  }
  if (m.ghiSo) el("p", "", card, `Ghi sổ ca này: ${m.ghiSo}k (sổ nợ tổng ${m.debtTotal}k).`);
  for (const o of m.orders || []) el("p", "", card, `${o.kind === "catering" ? "Mâm cơm" : "Đơn đặt trước"} ${o.name}: ${o.done}/${o.n} phần · ${o.status === "done" ? "đúng giờ" : o.status === "late" ? "trễ" : o.status}${o.paid ? ` · thu thêm ${o.paid}k` : ""}`);
  if (m.helperJobs) el("p", "muted", card, `Bông làm ${m.helperJobs} việc (châm trà, dọn bàn).`);
  if (m.final && m.friedTomorrow) el("p", "muted", card, `Cơm dư ${m.riceLeft} phần ⇒ mai có ${m.friedTomorrow} dĩa cơm chiên.`);
  else if (m.riceLeft) el("p", "muted", card, `Cơm dư ${m.riceLeft} phần thành hao${m.final ? " (có chảo trứng thì mai thành cơm chiên)" : ""}.`);
}

/** Tab Sổ nợ trong Sổ quản lý (ui/book-tabs.js): sổ nợ, xoá nợ được ngoài ca. */
export function book(p, s, ctx) {
  css();
  if (s.level >= DEBT.level || (s.debts || []).length) {
    el("h3", "", p, `Sổ nợ · ${PG.debtTotal(s)}k / hạn mức ${DEBT.limit(s.level)}k`);
    if (!(s.debts || []).length) el("p", "muted", p, "Chưa ai ghi sổ. Khách quen (và thợ quen ăn vui 3 lần) có thể xin ghi sổ lúc tính tiền.");
    const by = {};
    for (const d of s.debts || []) (by[d.id] ||= { name: d.name, amount: 0, n: 0, day: d.day }).amount += d.amount, by[d.id].n++;
    for (const [id, d] of Object.entries(by)) {
      const { right } = row(p, `${d.name}: ${d.amount}k (${d.n} lần)`, `Từ ngày ${d.day}`);
      if (!s.shift) button(right, "btn small", "Xoá nợ (+1 danh tiếng)", () => { const r = ctx.act({ type: "forgiveDebt", id }); if (!r.err) ctx.rerender(); }, { "data-forgive": id });
    }
  }
  // kỷ niệm vỉa hè: tab Huy hiệu (ui/book-tabs.js)
}

/** Hộp nhiệm vụ trong ca (cột việc). */
export function missionsBox(parent) {
  css();
  const box = el("div", "a-missions", parent);
  box.hidden = true;
  let sig = "";
  return (s) => {
    const ms = s.shift?.missions || [];
    box.hidden = !ms.length;
    const ns = ms.map((m) => `${m.id}${m.prog}${m.done}`).join("|");
    if (ns === sig) return;
    sig = ns;
    box.textContent = "";
    el("h3", "", box, "Nhiệm vụ hôm nay");
    for (const m of ms) el("div", "a-miss" + (m.done ? " done" : ""), box, `${m.text} (${Math.min(m.prog, m.n)}/${m.n})`).dataset.mission = m.id;
  };
}

/** A: thông báo cho sự kiện của phần A (game.js gọi ở nhánh default). Trả [chữ, kiểu] hoặc null. */
export function toastFor(e) {
  switch (e.type) {
    case "rented": return [`${e.line} ${e.memory || ""}`.trim(), "good"];
    case "ghiSoAsk": return [`${e.name} xin ghi sổ ${fmtK(e.amount)}. Chọn trên phiếu tính tiền.`, ""];
    case "ghiSo": return e.accept ? [`Ghi sổ cho ${e.name}: ${fmtK(e.amount)}.`, "good"] : [`${e.name} trả liền, hơi buồn.`, "warn"];
    case "debtPaid": return [`${e.name} trả nợ ${fmtK(e.amount)}.`, "good"];
    case "debtForgot": return [`${e.name} biệt tăm, nợ coi như mất.`, "warn"];
    case "debtForgiven": return ["Đã xoá nợ. Hàng xóm khen quán có tình.", "good"];
    case "orderTaken": return [`Nhận đơn ${e.name}: ${e.n} phần, cọc ${fmtK(e.deposit)}.`, "good"];
    case "orderOpen": return [`Phiếu mâm cơm ${e.n} phần đã lên thanh phiếu. Giao trước giờ hẹn!`, "good"];
    case "orderLate": return [`Đơn ${e.name} tới giờ rồi! Trễ là bị trừ tiền.`, "warn"];
    case "cateringBatch": return [`Mâm cơm: xong ${e.done}/${e.total} phần.`, "good"];
    case "orderDone": return [`${e.line}${e.pay ? ` (+${fmtK(e.pay)})` : ""}`, e.late ? "warn" : "good"];
    case "missionDone": return [`Xong nhiệm vụ “${e.text}”: +${e.xp} XP${e.money ? `, +${fmtK(e.money)}` : ""}. ${e.line}`, "good"];
    case "staff": return [e.on ? `Thuê ${e.name} hôm nay.` : `Thôi thuê ${e.name}.`, "good"];
    case "decorPlaced": return null;
    case "tier": return [`${e.line}`, "good"];
    case "fishSauce": return [`Nước mắm nhà pha bậc ${e.tier}: mọi dĩa +${e.tier}k.`, "good"];
    case "promoted": return [e.line, e.roll === "flop" ? "warn" : "good"];
    case "joined": return ["Ghép hai bàn cho nhóm đông.", "good"];
    default: return null;
  }
}
export const ERR_EXTRA = {
  "debt-limit": () => "Sổ nợ tới hạn mức rồi, khách phải trả liền.",
  "no-ghiso": () => "Khách không xin ghi sổ.",
  "in-shift": () => "Đang trong ca, để sau ca.",
  "needs-quan": () => "Phải lên quán trước.",
  "bad-offer": () => "Đơn này không nhận được.",
  "preorder-max": () => "Tối đa 2 đơn mỗi ngày.",
};
