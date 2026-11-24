// Bộ mô phỏng cân bằng Tiệm Bánh Mì: một người chơi giả chơi từng ca bằng LUẬT THẬT (chép khung Trà Sữa tools/sim/harness.mjs).
// Mọi thay đổi trạng thái đi qua core/apply.js (cùng cửa với trình duyệt: bản nháp, kiểm bất biến, lỗi thì không đổi gì).
// Thời gian chơi thật = thời gian ca đã trôi (đồng hồ ca chạy theo thao tác: mỗi lần bấm tốn `tap` ms) + hội thoại (đồng hồ dừng)
// + Chuẩn bị ca (kể cả canh mẻ đầu ngày, mỗi mẻ bằng số giây canh) + Chốt ca + màn chào.
// Mọi import mang cùng tag ?v=b5 với luật để fit.mjs sửa tạm bảng cấp trong bộ nhớ có hiệu lực.
import { apply } from "../../core/apply.js?v=b5";
import { createState } from "../../core/state.js?v=b5";
import { customer } from "../../core/shift.js?v=b5";
import { board, sameLeft } from "../../core/board.js?v=b5";
import { batchLevel, caseCap, bakingCount, prepMax, traySize } from "../../core/oven.js?v=b5";
import { grillLevel, panSlots } from "../../core/cook.js?v=b5";
import { currentEvent, affordable, choiceVisible } from "../../core/drama.js?v=b5";
import { stockoutOptions, nochangeOptions } from "../../core/rescue.js?v=b5";
import { consignAvailable, canMakeOne, costToMakeOne, demandEstimate, packPrice, packSize, capacity, stockUsed, maiOpen } from "../../core/stock.js?v=b5";
import { makeChange, floatValue } from "../../core/money.js?v=b5";
import { replyOptions } from "../../core/reviews.js?v=b5";
import { preorderOffers, fairAvailable, canBuy } from "../../core/progress.js?v=b5";
import { challengeToday } from "../../core/challenge.js?v=b5";
import { menuFor } from "../../core/order.js?v=b5";
import { EVENT } from "../../data/events.js?v=b5";
import { EQUIPMENT, DECOR, SIGNBOARDS, RANKS, HOUSE_PATE, PROMOS, PROMO_UNLOCK, FAIR, HELPER, RENT } from "../../data/equipment.js?v=b5";
import { SPREADS, VEG_IDS, SAUCES, RETAIL, BACHUC, STOCK, FILLINGS, LEVEL_USE } from "../../data/economy.js?v=b5";

/** RNG riêng của người chơi giả (không đụng RNG của ván). */
export function playerRng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Thứ tự mua của người "plan": đồ mở món / gỡ nút thắt trước, rồi trang trí. "impulse" mua trang trí rẻ trước. Thuê tiệm chen vào ở cấp 7. */
export const PLAN = ["egg-pan", "xiu-mai-pot", "long-board", "tray-6", "grill", "vegan-board", "warm-case", "rattan-lamp", "chalk-menu", "ceramic-jar", "board-2", "toaster-2",
  "egg-pan-2", "hood", "cash-counter", "wheat-bundle", "herb-pot", "long-table", "signboard-2", "tea-jug", "que-tray", "wall-calendar", "old-radio", "fridge", "electric-oven",
  "banana-plant", "plastic-stools", "auto-dose", "queue-rope", "board-3", "neon-sign", "signboard-3", "wind-chime", "wall-fan", "small-table"];
export const IMPULSE = ["rattan-lamp", "chalk-menu", "ceramic-jar", "egg-pan", "wheat-bundle", "herb-pot", "wind-chime", "xiu-mai-pot", "long-board", "grill", "tray-6", "vegan-board",
  "wall-calendar", "old-radio", "warm-case", "board-2", "banana-plant", "signboard-2", "small-table", "plastic-stools", "tea-jug", "egg-pan-2", "toaster-2", "cash-counter", "hood",
  "que-tray", "long-table", "fridge", "neon-sign", "electric-oven", "queue-rope", "signboard-3", "auto-dose", "board-3", "wall-fan"];
const ITEM = (id) => EQUIPMENT[id] || DECOR[id] || SIGNBOARDS[id];

export class Player {
  constructor(profile, { seed = 1, gameSeed = 20261119 } = {}) {
    this.p = profile;
    this.r = playerRng(seed);
    this.s = createState(gameSeed);
    this.clock = 0;
    this.errors = [];
    this.log = { actions: 0, rejected: 0, consign: 0, stuck: [], stockouts: 0, closed: 0, dialogs: 0, fair: 0, challenge: 0, challengeWin: 0, express: 0, burnt: 0, batches: 0, rejectTypes: {} };
    this.notice = new Map();
  }
  act(a) {
    this.log.actions++;
    const r = apply(this.s, a);
    if (r.err) { this.log.rejected++; this.log.rejectTypes[a.type + ":" + r.err] = (this.log.rejectTypes[a.type + ":" + r.err] || 0) + 1; if (r.err === "exception") this.errors.push({ day: this.s.day, where: a.type, err: r.detail?.slice?.(0, 300) }); }
    return r;
  }
  /** Thời gian thật trôi: đồng hồ ca chạy (nếu đang mở, không có hội thoại). */
  wait(ms) {
    this.clock += ms;
    for (let left = ms; left > 0 && this.s.shift && !this.s.shift.dialog; left -= 1000) {
      const r = this.act({ type: "tick", dt: Math.min(1000, left) });
      if (r.err) { this.errors.push({ day: this.s.day, where: "tick", err: r.err }); break; }
    }
  }
  tap(a) { const r = this.act(a); this.wait(this.p.tap * (0.8 + this.r() * 0.4)); return r; }
  pickOne(list) { return list[Math.floor(this.r() * list.length)]; }

  // ---------- hội thoại ----------
  clearEvents() {
    for (let i = 0; i < 12; i++) {
      const d = currentEvent(this.s);
      if (!d) return;
      const node = EVENT[d.id].nodes[d.node];
      const ok = node.choices.filter((c) => choiceVisible(this.s, c) && affordable(this.s, c));
      const ch = this.pickOne(ok);
      this.clock += this.p.dialog; this.log.dialogs++;
      const r = this.act({ type: "event", choice: ch.id });
      if (r.err) { this.errors.push({ day: this.s.day, where: "event", id: d.id, err: r.err }); return; }
    }
  }
  replyOne() {
    if (this.r() > this.p.reply) return;
    const r = (this.s.feed || []).find((x) => !x.reply && x.day === this.s.day - 1);
    if (!r) return;
    const opts = replyOptions(this.s, r, this.s.owner.persona || "hien");
    if (!opts.length) return;
    this.clock += 6000;
    this.act({ type: "reply", id: r.id, kind: this.pickOne(opts).id });
  }

  // ---------- giữa hai ca ----------
  shop() {
    const s = this.s;
    const plan = this.p.shopping === "plan";
    // thuê tiệm (cấp 7): người "plan" để dành ưu tiên, người "impulse" thuê khi dư
    if (s.level >= RENT.level && !s.shop) {
      if (s.money >= RENT.price + (plan ? 60 : 90)) { if (!this.act({ type: "rentShop" }).err) this.clock += 6000; }
      else if (plan) return; // để dành
    }
    const reserve = plan ? 80 + 4 * s.level : 40 + 5 * s.level;
    for (const id of plan ? PLAN : IMPULSE) {
      const it = ITEM(id);
      if (!it || canBuy(s, id) === "owned" || it.level > s.level || canBuy(s, id) === "needs" || canBuy(s, id) === "not-needed") continue;
      if (s.money - it.price < reserve) { if (plan) break; continue; }
      if (!this.act({ type: "buy", id }).err) this.clock += 2500;
    }
    // bình gas dự phòng khi gas thấp
    if (!s.owned["spare-gas"] && (s.stock.gas || 0) < 8 && s.money > 200) this.act({ type: "buy", id: "spare-gas" });
    // chỗ tiêu tiền cuối game: hạng tiệm + pate nhà làm khi đồ đã mở gần đủ
    const gearLeft = (plan ? PLAN : IMPULSE).filter((id) => { const it = ITEM(id); return it && it.level <= s.level && !s.owned[id] && canBuy(s, id) !== "not-needed"; }).length;
    for (let k = 0; k < 2; k++) {
      const R = RANKS[s.rank || 0], P = HOUSE_PATE[s.pate || 0];
      if (gearLeft <= 1 && R && R.level <= s.level && s.shop && s.money - R.price >= reserve * 2) { if (!this.act({ type: "buyRank" }).err) { this.clock += 2500; continue; } }
      if (gearLeft <= 1 && P && P.level <= s.level && s.money - P.price >= reserve * 2) { if (!this.act({ type: "buyPate" }).err) { this.clock += 2500; continue; } }
      break;
    }
    if (s.level >= 19 && !s.house) this.act({ type: "house", name: "Ổ Mô Phỏng", spreads: { pate: 2, bo: 2 }, fills: ["cha-lua", "thit-nguoi", "cha-bong"], price: 40 });
  }
  restock() {
    const s = this.s;
    if (this.p.stock < 1 && this.r() < 0.3) {
      // người ẩu: chỉ nhập phôi + pate khi gần hết
      for (const id of ["phoi", "pate", "bo", "giay-goi", "rau", "do-chua", "dua-leo"]) if ((s.stock[id] || 0) < 6 && packPrice(id) < s.money - 20) this.act({ type: "restock", id });
    } else this.act({ type: "restockToday" });
    // Chị Mai (cấp 9): phôi gói đôi rẻ hơn cho người "plan"
    if (maiOpen(s) && this.p.shopping === "plan") {
      const d = demandEstimate(s);
      const short = d.short.find((x) => x.id === "phoi");
      if (short && short.need - short.have >= 12 && packPrice("phoi", false, "mai") < s.money - 40 && capacity(s) - stockUsed(s) >= packSize("phoi", "mai")) this.act({ type: "restock", id: "phoi", sup: "mai" });
    }
    if (this.p.stock > 1) {
      for (const id of ["phoi", "pate"]) if (capacity(s) - stockUsed(s) >= packSize(id) && packPrice(id) < s.money - 60) this.act({ type: "restock", id });
    }
    this.clock += 4000;
  }
  prepDay() {
    const s = this.s;
    this.clearEvents();
    this.replyOne();
    if (!s.owner.persona) this.act({ type: "persona", persona: this.pickOne(["hien", "cucsuc", "lay", "sale"]) });
    if (s.stale?.n && !s.stale.choice) this.act({ type: "stale", choice: this.p.id === "sloppy" ? this.pickOne(["sell", "give", "toss"]) : "sell" });
    if (consignAvailable(s)) { this.act({ type: "consign" }); this.log.consign++; }
    else if (!canMakeOne(s) && costToMakeOne(s) > s.money) this.log.stuck.push({ day: s.day, money: s.money, why: "no-bailout" });
    this.restock(); // nhập hàng trước, mua đồ bằng tiền còn lại
    this.shop();
    // hội chợ (cấp 18) / ca thử thách (cấp 20)
    if (this.p.fair && fairAvailable(s) && s.money >= FAIR.price + 150) { if (!this.act({ type: "fair" }).err) this.log.fair++; }
    if (this.p.challenge && challengeToday(s)) { if (!this.act({ type: "challenge", on: true }).err) this.log.challenge++; }
    if (s.level >= PROMO_UNLOCK && s.promo?.day !== s.day) {
      const kind = s.money > 400 ? "check-in" : s.money > 200 ? "to-roi" : "livestream";
      if (s.money >= PROMOS[kind].price + 60) this.act({ type: "promo", kind });
    }
    if (s.level >= HELPER.level && this.p.id === "careful" && s.money > 600) this.act({ type: "helper", on: true });
    // đơn đặt trước (tiệm, cấp 7)
    const offers = preorderOffers(s);
    const take = this.p.id === "careful" ? 2 : this.p.id === "average" ? 1 : this.r() < 0.5 ? 1 : 0;
    for (let i = 0; i < Math.min(take, offers.length); i++) this.act({ type: "acceptOffer", idx: i });
    // tiền lẻ
    if (s.day >= 2) { const f = floatValue(s.float); if (f < 40) this.act({ type: "exchange", pack: "nho" }); if (f < 70) this.act({ type: "exchange", pack: "vua" }); }
    if (this.p.stock >= 1) this.act({ type: "restockToday" });
    // mẻ đầu ngày: canh lò thật (mỗi mẻ tốn đúng số giây canh)
    const want = this.p.id === "sloppy" ? Math.max(1, prepMax(s) - 1) : prepMax(s);
    for (let i = 0; i < want; i++) {
      const [lo, hi] = this.p.prepSec, sec = lo + this.r() * (hi - lo);
      const r = this.act({ type: "firstBatch", sec });
      if (r.err) break;
      this.clock += sec * 1000 + 2500;
    }
    this.clock += this.p.prep;
  }

  // ---------- trong ca ----------
  pickCustomer() {
    const sh = this.s.shift;
    const busy = new Set(sh.boards.map((b) => b.cid).filter((x) => x !== null));
    const w = sh.customers.filter((c) => c.phase === "wait" && !busy.has(c.id) && c.filled.some((x) => !x));
    if (!w.length) return null;
    const due = (c) => (c.pre ? c.pre.dueT + 60000 : c.arriveT + c.patience);
    // ước lượng thời gian ráp: ~11 lần bấm mỗi ổ (ráp ×N gộp ổ giống nhau) + đọc phiếu
    const est = (c) => this.p.read + this.p.tap * 11 * Math.ceil(c.items.filter((_, i) => !c.filled[i]).length / Math.max(1, this.s.owned["long-table"] ? 8 : this.s.owned["long-board"] ? 4 : 1));
    const t = sh.t;
    // người cẩn thận / trung bình: khách sắp hết kiên nhẫn trước, nhưng bỏ qua khách chắc chắn không kịp (nhìn thanh kiên nhẫn)
    if (this.p.pinSmart) { const ok = w.filter((c) => due(c) - t > est(c)); return (ok.length ? ok : w).sort((a, b) => due(a) - due(b))[0]; }
    return w.sort((a, b) => a.id - b.id)[0];
  }
  /** Lượng ổ cần trong tủ: ổ khách đang chờ còn thiếu + đệm theo buổi. */
  breadTarget() {
    const sh = this.s.shift;
    const need = sh.customers.filter((c) => c.phase === "wait" || c.phase === "enter").reduce((a, c) => a + c.items.filter((it, i) => !c.filled[i] && it.recipe !== "que").length, 0);
    const late = sh.t > (sh.len || 240000) - 45000;
    const buf = late ? 0 : sh.phase === "trua" ? 2 : 4;
    return Math.min(caseCap(this.s), need + buf);
  }
  tendOven() {
    const s = this.s, sh = s.shift;
    for (let i = 0; i < sh.oven.length; i++) {
      const b = sh.oven[i];
      if (!b) continue;
      const lv = batchLevel(s, b), key = `${s.day}:${i}:${b.t0}`;
      if (lv === "golden") {
        if (!this.notice.has(key)) { const [a, z] = this.p.react; this.notice.set(key, sh.t + (a + this.r() * (z - a)) * 1000); }
        if (sh.t >= this.notice.get(key)) { this.tap({ type: "pull", slot: i }); return true; }
      } else if (lv === "dark" || lv === "burnt") { if (lv === "burnt") this.log.burnt++; this.tap({ type: "pull", slot: i }); return true; }
    }
    const g = grillLevel(sh);
    if (g === "golden" || g === "burnt") { this.tap({ type: "grillPull" }); return true; }
    // ô Kho đỏ (≤ 2 phần) ⇒ nhập gấp +15% (người ẩu ít để ý)
    if (this.p.id !== "sloppy" || this.r() < 0.25) {
      const need = {};
      for (const q of sh.customers) if (q.phase === "wait" || q.phase === "enter") q.items.forEach((it, i) => { if (!q.filled[i]) for (const id of [...Object.keys(it.spreads), ...it.fills]) need[id] = (need[id] || 0) + 1; });
      for (const id of Object.keys(need)) {
        if (!STOCK[id] || (s.stock[id] || 0) >= need[id] || (s.stock[id] || 0) > 2 || packPrice(id, true) > s.money - 40 || (STOCK[id].kho && capacity(s) - stockUsed(s) < packSize(id))) continue;
        if (!this.tap({ type: "restock", id }).err) { this.log.express++; return true; }
      }
    }
    // bánh mì que: khay que khi có phiếu que mà que chín chưa đủ
    const queNeed = sh.customers.filter((q) => q.phase === "wait" || q.phase === "enter").reduce((a, q) => a + q.items.filter((it, i) => !q.filled[i] && it.recipe === "que").length, 0) * 5;
    const freeQ = sh.oven.findIndex((x) => !x);
    if (queNeed > (sh.que || 0) && freeQ >= 0 && !sh.oven.some((b) => b?.kind === "que") && s.owned["que-tray"]) {
      if ((s.stock["phoi-que"] || 0) >= 5) { const r = this.tap({ type: "bake", slot: freeQ, kind: "que" }); if (!r.err) return true; }
      else if (packPrice("phoi-que", true) < s.money - 20 && capacity(s) - stockUsed(s) >= packSize("phoi-que")) { if (!this.tap({ type: "restock", id: "phoi-que" }).err) return true; }
    }
    // nướng mẻ mới
    const free = sh.oven.findIndex((x) => !x);
    if (free >= 0 && sh.case.length + bakingCount(sh) < this.breadTarget()) {
      if ((s.stock.phoi || 0) > 0 && ((s.stock.gas || 0) > 0 || s.owned["spare-gas"])) { const r = this.tap({ type: "bake", slot: free }); this.log.batches++; return !r.err; }
      if ((s.stock.phoi || 0) === 0 && (this.p.id !== "sloppy" || this.r() < 0.3) && packPrice("phoi", true) < s.money - 10 && capacity(s) - stockUsed(s) >= packSize("phoi")) {
        if (!this.tap({ type: "restock", id: "phoi" }).err) { this.log.express++; return true; }
      }
    }
    return false;
  }
  cookAhead() {
    const s = this.s, sh = s.shift, c = sh.cook;
    if (!this.p.cookAhead || !c) return false;
    const pending = (id) => sh.customers.filter((q) => q.phase === "wait" || q.phase === "enter").reduce((a, q) => a + q.items.filter((it, i) => !q.filled[i] && it.fills.includes(id)).length, 0);
    if (panSlots(s) && c.pan.some((x) => x === null) && c.eggs + c.pan.filter((x) => x !== null).length < pending("trung") && (s.stock.trung || 0) > 0) { this.tap({ type: "fry" }); return true; }
    const meatMenu = menuFor(s).some((r) => r.id === "thit-nuong");
    if (s.owned.grill && meatMenu && !c.grill && c.meat < pending("thit-nuong") && (s.stock["thit-nuong"] || 0) > 0) { this.tap({ type: "grill" }); return true; }
    return false;
  }
  miss(step) { return this.r() < (this.p.miss[step] || 0); }
  bachucPick(target) {
    const s = this.s;
    const fills = FILLINGS.filter((id) => STOCK[id].unlock <= s.level && id !== "trung" && id !== "thit-nuong" && (id !== "xiu-mai" || s.owned["xiu-mai-pot"]) && (s.stock[id] || 0) > 0);
    const spreads = { pate: 2, bo: 2 };
    let price = BACHUC.base + BACHUC.surcharge + RETAIL.pate + RETAIL.bo;
    const out = [];
    for (const id of fills.sort((a, b) => RETAIL[b] - RETAIL[a])) if (price + RETAIL[id] <= target + BACHUC.tolerance) { out.push(id); price += RETAIL[id]; }
    return { spreads, fills: out };
  }
  /** Một bước ráp trên thớt đang chọn. Trả true nếu đã làm gì đó. */
  buildStep(c) {
    const s = this.s, sh = s.shift, b = board(s), L = b.loaf;
    const it = c.items[b.item];
    if (!L) {
      const n = Math.max(1, sameLeft(s, b));
      const r = this.tap({ type: "take", n });
      if (r.err === "case-short") this.tap({ type: "take", n: 1 });
      return true;
    }
    if (L.wrap) { this.tap({ type: "serve" }); return true; }
    const wantToast = !L.que && (L.n || 1) === 1 && !L.sliced && ((it.crispy && L.crisp < 85) || (this.p.toastSoggy && L.crisp < 50) || it.recipe === "bo-duong") && !L.toasted;
    if (L.toastT0 !== null && L.toastT0 !== undefined) { if (sh.t - L.toastT0 >= 4000) { this.tap({ type: "toast" }); return true; } return false; }
    if (wantToast) { const r = this.tap({ type: "toast" }); if (!r.err) return true; }
    if (!L.sliced && !L.que) { this.tap({ type: "slice" }); return true; }
    let spreads = it.spreads, fills = it.fills;
    if (it.recipe === "bachuc") ({ spreads, fills } = this.bachucPick(it.target));
    if (b.step < 3) {
      for (const id of SPREADS) {
        const want = spreads[id] || 0;
        if ((L.spreads[id] || 0) !== want) { let lvl = want; if (this.miss("spread")) lvl = this.pickOne([0, 1, 2, 3].filter((x) => x !== want)); if (lvl === (L.spreads[id] || 0)) lvl = want; const r = this.tap({ type: "spread", id, lvl }); if (!r.err) return true; }
      }
    }
    if (L.que) { this.tap({ type: "wrap", kind: "tui" }); return true; }
    if (b.step <= 4) {
      for (const id of fills) if (!L.fills.includes(id)) {
        let fid = id;
        if (this.miss("fill")) { const alt = FILLINGS.filter((x) => x !== id && STOCK[x].unlock <= s.level && !["trung", "thit-nuong", "xiu-mai"].includes(x)); if (alt.length) fid = this.pickOne(alt); }
        const r = this.tap({ type: "fill", id: fid });
        if (r.result?.wait) { this.wait(800); return true; }
        if (!r.err) return true;
      }
      if (b.step < 4) { this.tap({ type: "skip", step: "fill" }); return true; }
    }
    if (b.step <= 5) {
      const on = VEG_IDS.filter((v) => it.veg[v]);
      const forget = this.miss("veg");
      if (on.length === 4 || (forget && on.length)) { if (VEG_IDS.some((v) => !L.veg[v])) { this.tap({ type: "veg", id: "all" }); return true; } }
      else for (const v of on) if (!L.veg[v]) { this.tap({ type: "veg", id: v }); return true; }
      if (b.step < 5) { this.tap({ type: "skip", step: "veg" }); return true; }
    }
    if (b.step <= 6) {
      let ot = it.ot;
      if (L.ot !== ot && !L._otDone) { if (this.miss("spice")) ot = Math.min(3, ot + 1 + Math.floor(this.r() * 2)); if (ot !== L.ot) { const r = this.tap({ type: "spice", id: "ot", lvl: ot }); if (!r.err) return true; } }
      for (const id of SAUCES) if (it.sauces[id] && !L.sauces[id]) { this.tap({ type: "spice", id }); return true; }
      if (b.step < 6) { this.tap({ type: "skip", step: "spice" }); return true; }
    }
    let kind = it.bag ? "tui" : it.wrap;
    if (this.miss("wrap")) kind = kind === "giay" ? "cat-doi" : "giay";
    const r = this.tap({ type: "wrap", kind });
    if (r.err) this.tap({ type: "wrap", kind: it.bag ? "tui" : it.wrap });
    return true;
  }
  payChange() {
    const s = this.s, sh = s.shift;
    const c = customer(s, sh.paying);
    if (s.day <= 3 && !(s.challenge?.day === s.day)) { this.tap({ type: "autoChange" }); return; }
    let mk = makeChange(s.float, c.pay.change);
    if (!mk) { this.tap({ type: "noChange" }); return; }
    if (this.r() < this.p.change) { const d = Object.keys(mk)[0]; const alt = { ...mk }; if (this.r() < 0.5 && alt[d] > 0) alt[d]--; else { const up = Object.keys(s.float).find((x) => s.float[x] > (alt[x] || 0)); if (up) alt[up] = (alt[up] || 0) + 1; } mk = alt; }
    this.wait(1200); // đếm tiền (đồng hồ ca vẫn chạy)
    const r = this.tap({ type: "giveChange", bills: mk });
    if (r.err) this.tap({ type: "giveChange", bills: makeChange(s.float, c.pay.change) || {} });
  }
  step() {
    const s = this.s, sh = s.shift;
    if (!sh) return false;
    if (sh.dialog) {
      this.clock += this.p.dialog; this.log.dialogs++;
      const d = sh.dialog;
      if (d.kind === "complaint") { this.act({ type: "complaint", choice: this.p.complaint }); return true; }
      if (d.kind === "stockout") {
        this.log.stockouts++; this.log.soIds = this.log.soIds || {}; const kk = d.id + ">" ; this.log.soIds[kk] = (this.log.soIds[kk] || 0) + 1;
        const opts = stockoutOptions(s).filter((o) => o.ok !== false && (o.price || 0) <= s.money);
        const pref = this.p.id === "careful" ? ["waitOven", "consign", "run", "ship", "si", "borrow", "gasCall", "gasBorrow", "swap", "dismiss", "close"] : this.p.id === "average" ? ["waitOven", "consign", "ship", "run", "borrow", "si", "gasBorrow", "gasCall", "swap", "dismiss", "close"] : ["waitOven", "consign", "borrow", "gasBorrow", "run", "ship", "swap", "dismiss", "close"];
        // cùng một món hết lặp lại nhiều lần trong ca (không còn tiền, ký gửi đã dùng) ⇒ người chơi thật đóng cửa sớm
        const rk = s.day + ":" + d.id; this.soRepeat = this.soRepeat?.k === rk ? { k: rk, n: this.soRepeat.n + 1 } : { k: rk, n: 1 };
        let o = pref.map((id) => opts.find((x) => x.id === id)).find(Boolean) || opts[0];
        if (this.soRepeat.n > 6) o = opts.find((x) => x.id === "close") || o;
        if (o.id === "close") this.log.closed++;
        this.log.soIds[d.id + ">" + o.id] = (this.log.soIds[d.id + ">" + o.id] || 0) + 1;
        const r = this.act({ type: "stockout", choice: o.id });
        if (r.err) { this.errors.push({ day: s.day, where: "stockout", err: r.err, choice: o.id }); this.act({ type: "stockout", choice: "close" }); }
        return true;
      }
      if (d.kind === "nochange") { const o = nochangeOptions(s).find((x) => x.ok !== false) || nochangeOptions(s)[0]; this.act({ type: "nochange", choice: o.id }); return true; }
      this.clearEvents();
      if (s.shift?.dialog?.kind === "event") { this.errors.push({ day: s.day, where: "event-stuck", id: s.shift.dialog.id }); s.shift.dialog = null; }
      return true;
    }
    if (sh.away) { this.wait(500); return true; }
    if (this.tendOven()) return true;
    if (!s.shift) return false;
    if (sh.paying !== null) { this.payChange(); return true; }
    if (this.cookAhead()) return true;
    const b = board(s);
    let c = b.cid !== null ? customer(s, b.cid) : null;
    if (c && c.phase !== "wait") { if (b.loaf) this.tap({ type: "discard" }); c = null; }
    if (!c) {
      const nc = this.pickCustomer();
      if (!nc) { this.wait(400); return true; }
      this.wait(this.p.read); // đọc phiếu: đồng hồ ca vẫn chạy
      const r = this.tap({ type: "pin", cid: nc.id });
      if (r.err) this.wait(400);
      return true;
    }
    if (!b.loaf && c.items[b.item]?.recipe === "que" && (sh.que || 0) < 5) { this.wait(600); return true; }
    if (!b.loaf && !sh.case.length && c.items[b.item]?.recipe !== "que") { if (!this.tendOven()) this.wait(600); if (!sh.case.length && !sh.oven.some(Boolean)) this.tap({ type: "take" }); return true; }
    const before = this.log.actions;
    if (!this.buildStep(c)) this.wait(300);
    if (this.log.actions === before) this.wait(300);
    // kẹt trên một thớt quá lâu: đổ ổ làm lại
    this.guardN = (b.cid === this.guardCid && this.guardStep === b.step) ? (this.guardN || 0) + 1 : 0;
    this.guardCid = b.cid; this.guardStep = b.step;
    if (this.guardN > 40) { this.act({ type: "discard" }); this.guardN = 0; this.errors.push({ day: s.day, where: "board-stuck", step: b.step }); }
    return true;
  }
  playShift() {
    const s = this.s;
    const day = s.day, m0 = s.money, xp0 = s.xp;
    const r = this.act({ type: "startShift" });
    if (r.err) { this.errors.push({ day, where: "startShift", err: r.err }); return null; }
    let guard = 0;
    while (s.shift && guard++ < 40000) this.step();
    if (s.shift) { this.errors.push({ day, where: "shift-hang" }); s.shift = null; return null; }
    const sum = s.lastSummary;
    if (sum.challenge?.ok) this.log.challengeWin++;
    this.clock += this.p.summary;
    this.act({ type: "closeSummary" });
    return { day, level: s.level, xp: s.xp, xpGain: s.xp - xp0, money: s.money, moneyDelta: s.money - m0, profit: sum.profit, loaves: sum.loaves, served: sum.served, lost: sum.lost,
      avg: sum.avg, waste: sum.waste, expired: sum.expiredK || 0, baked: sum.batches, burnt: sum.burntBatches, early: sum.early };
  }
  start() {
    this.act({ type: "setName", name: "Tiệm Mô Phỏng" });
    this.act({ type: "seeIntro" });
    this.act({ type: "persona", persona: "hien" });
    this.clock += 40000; // màn chào + đặt tên
  }
}
export { traySize, LEVEL_USE };
