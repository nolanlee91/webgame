// Bộ mô phỏng cân bằng: một người chơi giả chơi từng ca bằng LUẬT THẬT. Mọi thay đổi trạng thái đi qua core/apply.js
// (cùng cửa với trình duyệt: bản nháp, kiểm bất biến, lỗi thì không đổi gì). Thời gian chơi thật = thời gian ca đã trôi
// (đồng hồ ca chạy theo thao tác của người chơi) + thời gian ở hội thoại (đồng hồ dừng) + bảng Chuẩn bị ca + Chốt ca.
import { apply } from "../../core/apply.js";
import { createState } from "../../core/state.js";
import { customer, curStation, nextStep, wantOf, orderAt } from "../../core/shift.js";
import { currentEvent, affordable } from "../../core/drama.js";
import { needsBailout, consignAvailable, PROMOS, PROMO_UNLOCK } from "../../core/business.js";
import { packPrice, packSize, capacity, stockUsed, useOfSpec, SUPPLIERS } from "../../core/economy.js";
import { recipesAt } from "../../core/progression.js";
import { replyOptions } from "../../core/reviews.js";
import { stockoutOptions, demandEstimate, menuStock } from "../../core/stockout.js";
// hội chợ (cấp 18) và ca thử thách (cấp 20): nạp mềm để bộ mô phỏng chạy được cả trên bản trước Milestone 5 (số "trước")
const FAIRM = await import("../../core/fair.js?v=m37").catch(() => null);
const CHALM = await import("../../core/challenge.js?v=m37").catch(() => null);
const TIERS = FAIRM?.TIERS || [];
import { EVENT } from "../../data/events.js";
import { CHOICES, STOCK, STEPS, choice } from "../../data/ingredients.js";
import { RECIPE } from "../../data/recipes.js";
import { EQUIPMENT } from "../../data/equipment.js";
import { BATCHES, PEARL_RAW } from "../../data/equipment.js";

/** RNG riêng của người chơi giả (không đụng RNG của ván). */
export function playerRng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Thứ tự mua của người chơi "plan": máy gỡ nút thắt trước, rồi trang trí. Người "impulse" mua đồ trang trí rẻ trước. */
const PLAN = ["crate-rack", "double-station", "powered-sealer", "dual-pot-cooker", "crate-rack", "waiting-bench", "flowering-pot", "premium-lantern",
  "dual-spout-brewer", "room-screen", "tea-table-set", "upright-fridge", "portion-dispenser", "lit-signboard", "triple-station"];
const IMPULSE = ["flowering-pot", "waiting-bench", "premium-lantern", "room-screen", "tea-table-set", "lit-signboard", "powered-sealer",
  "double-station", "crate-rack", "dual-pot-cooker", "dual-spout-brewer", "upright-fridge", "portion-dispenser", "triple-station"];

export class Player {
  constructor(profile, { seed = 1, gameSeed = 20261119 } = {}) {
    this.p = profile;
    this.r = playerRng(seed);
    this.s = createState(gameSeed);
    this.clock = 0; // ms thời gian chơi thật
    this.errors = [];
    this.log = { actions: 0, rejected: 0, consign: 0, stuck: [], express: 0, outOfStock: 0, stockouts: 0, closed: 0, dialogs: 0, fair: 0, challenge: 0, badges: 0 };
    this.days = []; // tóm tắt từng ngày
  }

  act(a) {
    this.log.actions++;
    const r = apply(this.s, a);
    if (r.err) { this.log.rejected++; return r; }
    return r;
  }
  /** Bước thời gian thật: đồng hồ ca chạy (nếu đang mở và không có hội thoại). */
  wait(ms) {
    this.clock += ms;
    for (let left = ms; left > 0 && this.s.shift && !this.s.shift.dialog; left -= 1000) {
      const r = this.act({ type: "tick", dt: Math.min(1000, left) });
      if (r.err) { this.errors.push({ day: this.s.day, where: "tick", err: r.err }); break; }
    }
  }
  tap(a) { const r = this.act(a); this.wait(this.p.tap * (0.8 + this.r() * 0.4)); return r; }

  // ---------- giữa hai ca ----------
  clearEvents() {
    for (let i = 0; i < 12; i++) {
      const d = currentEvent(this.s);
      if (!d) return;
      const node = EVENT[d.id].nodes[d.node];
      const ok = node.choices.filter((c) => affordable(this.s, c));
      const ch = ok[Math.floor(this.r() * ok.length)];
      this.clock += this.p.dialog;
      this.log.dialogs++;
      const r = this.act({ type: "choose", choice: ch.id });
      if (r.err) { this.errors.push({ day: this.s.day, where: "choose", id: d.id, err: r.err }); return; }
    }
  }

  replyOne() {
    if (this.r() > this.p.reply) return;
    const r = (this.s.feed || []).find((x) => !x.reply && x.day === this.s.day - 1);
    if (!r) return;
    const opts = replyOptions(this.s, r, this.s.owner.persona || "hien");
    if (!opts.length) return;
    this.clock += 6000;
    this.act({ type: "reply", id: r.id, kind: opts[Math.floor(this.r() * opts.length)].id });
  }

  /** Phần nguyên liệu dự kiến cho ca tới theo menu đang mở. */
  plannedUse() {
    const menu = recipesAt(this.s.level);
    const guests = 9 + Math.floor(this.s.level / 3);
    const need = {};
    for (const R of menu) {
      const use = useOfSpec(R);
      for (const [id, n] of Object.entries(use)) need[id] = (need[id] || 0) + (n * guests * 1.25) / menu.length;
    }
    return need;
  }

  restockPlan() {
    const s = this.s;
    const need = this.plannedUse();
    const sup = s.level >= SUPPLIERS.si.unlock && this.p.shopping === "plan" ? "si" : "di-ba";
    // nhập theo độ thiếu tương đối, giữ tiền cho phí ca
    for (let guard = 0; guard < 60; guard++) {
      let best = null, gap = 0;
      for (const [id, n] of Object.entries(need)) {
        if (STOCK[id].unlock > s.level) continue;
        const target = Math.ceil(n * this.p.stockPlan);
        const g = (target - (s.stock[id] || 0)) / Math.max(1, target);
        if (g > gap) { gap = g; best = id; }
      }
      if (!best) break;
      let supplier = sup;
      if (packPrice(best, false, supplier) > s.money - 12 || capacity(s) - stockUsed(s) < packSize(best, supplier)) supplier = "di-ba";
      if (packPrice(best, false, supplier) > s.money - 12) break;
      if (capacity(s) - stockUsed(s) < packSize(best, supplier)) break;
      const r = this.act({ type: "restock", id: best, supplier });
      if (r.err) break;
      this.clock += 600;
    }
  }

  shop() {
    const s = this.s;
    const list = this.p.shopping === "plan" ? PLAN : IMPULSE;
    const reserve = this.p.shopping === "plan" ? 90 : 45;
    for (const id of list) {
      const it = EQUIPMENT[id];
      if (!it || s.owned[id] || it.unlock > s.level || (it.requires && !s.owned[it.requires])) continue;
      if (s.money - it.price < reserve) { if (this.p.shopping === "plan") break; continue; } // để dành cho món ưu tiên
      if (!this.act({ type: "buy", id }).err) this.clock += 2500;
    }
    // hạng tiệm (chỗ tiêu tiền cuối game): mua khi đã có hết máy đang mở và còn dư
    const T = TIERS[s.tier || 0];
    const gearDone = list.every((id) => s.owned[id] || EQUIPMENT[id].unlock > s.level);
    if (T && gearDone && s.level >= T.unlock && s.money - T.price >= reserve * 2) { if (!this.act({ type: "tier" }).err) this.clock += 2500; }
  }

  prepDay() {
    const s = this.s;
    this.clearEvents();
    this.replyOne();
    if (!s.owner.persona && s.introSeen) this.act({ type: "setPersona", persona: ["hien", "cuc", "lay", "sale"][Math.floor(this.r() * 4)] });
    if (needsBailout(s)) {
      if (consignAvailable(s)) { this.act({ type: "consign" }); this.log.consign++; }
      else this.log.stuck.push({ day: s.day, money: s.money, why: "bailout-used" });
    }
    this.shop();
    // hội chợ (cấp 18) / ca thử thách (cấp 20) — người cẩn thận và trung bình tham gia khi có
    if (FAIRM && FAIRM.fairAvailable(s) && this.p.id !== "sloppy" && s.money >= FAIRM.FAIR.fee + 60) { if (!this.act({ type: "fair" }).err) this.log.fair++; }
    const ch = CHALM && CHALM.challengeToday(s);
    if (ch && this.p.id === "careful") { if (!this.act({ type: "challenge", id: ch.id }).err) this.log.challenge++; }
    if (s.level >= PROMO_UNLOCK && s.promo?.day !== s.day) {
      const kind = s.money > 260 ? "check-in" : s.money > 120 ? "to-roi" : "livestream";
      if (s.money >= PROMOS[kind].price + 40) this.act({ type: "promo", kind });
    }
    this.restockPlan();
    if (this.p.id !== "sloppy" && demandEstimate(s).short.length) this.act({ type: "restockToday" }); // nút "Nhập đủ cho hôm nay"
    this.clock += this.p.prep;
  }

  // ---------- trong ca ----------
  pickCustomer() {
    const sh = this.s.shift;
    const busy = new Set(sh.stations.map((st) => st.cid).filter((x) => x !== null));
    const w = sh.customers.filter((c) => c.phase === "wait" && !busy.has(c.id) && c.filled.some((x) => !x));
    if (!w.length) return null;
    if (this.p.pinSmart) {
      w.sort((a, b) => (a.arriveT + a.patience + a.bonus) - (b.arriveT + b.patience + b.bonus));
      return w[0];
    }
    return w.sort((a, b) => a.id - b.id)[0];
  }

  pickChoice(step, want) {
    if (step === "cup") return "ly";
    if (step === "lid") return "dong-nap";
    const miss = this.p.miss[step] || 0;
    if (this.r() >= miss) return want;
    const opts = CHOICES[step].filter((c) => (c.unlock || 1) <= this.s.level && String(c.id) !== String(want));
    return opts.length ? opts[Math.floor(this.r() * opts.length)].id : want;
  }

  ensurePearls() {
    const s = this.s, sh = s.shift;
    const k = sh.kitchen;
    const want = sh.customers.filter((c) => c.phase !== "leave").reduce((a, c) => a + c.items.filter((it, i) => !c.filled[i] && it.order.topping === "tran-chau").length, 0);
    const cooking = k.batches.reduce((a, b) => a + b.size, 0);
    if (k.ready + cooking >= Math.max(1, want)) return;
    const slots = s.owned["dual-pot-cooker"] ? 2 : 1;
    if (k.batches.length >= slots) return;
    const size = s.level >= BATCHES[6].unlock && want > 3 ? 6 : 3;
    if ((s.stock[PEARL_RAW] || 0) < size) {
      if ((s.stock[PEARL_RAW] || 0) >= 3) return this.tap({ type: "cook", size: 3 });
      if (!this.tap({ type: "restock", id: PEARL_RAW }).err) this.log.express++;
      if ((s.stock[PEARL_RAW] || 0) < 3) return;
      return this.tap({ type: "cook", size: Math.min(size, s.stock[PEARL_RAW] >= 6 ? size : 3) });
    }
    this.tap({ type: "cook", size });
  }

  /** Một quyết định trong ca. Trả false khi ca đã đóng. */
  step() {
    const s = this.s, sh = s.shift;
    if (!sh) return false;
    if (sh.dialog) {
      this.clock += this.p.dialog; this.log.dialogs++;
      if (sh.dialog.kind === "complaint") { this.act({ type: "resolve", choice: this.p.complaint }); return true; }
      if (sh.dialog.kind === "stockout") {
        this.log.stockouts++;
        const opts = stockoutOptions(s).filter((o) => o.ok);
        const pref = this.p.id === "careful" ? ["run", "shipper", "consign", "borrow", "swap", "close"] : this.p.id === "average" ? ["shipper", "run", "borrow", "consign", "swap", "close"] : ["borrow", "swap", "consign", "close", "run"];
        const o = pref.map((id) => opts.find((x) => x.id === id)).find(Boolean) || opts[0];
        if (o.id === "close") this.log.closed++;
        const r = this.act({ type: "stockout", choice: o.id });
        if (r.err) { this.errors.push({ day: s.day, where: "stockout", err: r.err }); this.act({ type: "stockout", choice: "close" }); }
        return true;
      }
      this.clearEvents();
      return true;
    }
    if (sh.away) { this.wait(500); return true; }
    // ô Kho đỏ trên HUD ⇒ nhập gấp (+15%) trước khi hết hẳn (người ẩu chỉ thỉnh thoảng để ý)
    if (this.p.id !== "sloppy" || this.r() < 0.15) {
      for (const id of menuStock(s)) {
        if ((s.stock[id] || 0) > 2) continue;
        if (packPrice(id, true) > s.money - 15 || capacity(s) - stockUsed(s) < packSize(id)) continue;
        if (!this.tap({ type: "restock", id }).err) { this.log.express++; return true; }
      }
    }
    if (this.p.id !== "sloppy" || this.r() < 0.5) this.ensurePearls();
    if (!s.shift) return false;
    // chọn chỗ pha: ly đã đóng nắp ⇒ giao; ly dở ⇒ pha tiếp
    const sts = s.shift.stations;
    let si = sts.findIndex((st) => st.cup && (st.cup.sealed || (st.cup.steps.length === STEPS.length - 1 && st.lidSkip)));
    if (si < 0) si = sts.findIndex((st) => st.cup && st.cid !== null);
    if (si < 0) si = sts.findIndex((st) => st.cid !== null);
    if (si >= 0 && si !== s.shift.sel) { this.tap({ type: "select", station: si }); return true; }
    const st = curStation(s.shift);
    const c = st.cid !== null ? customer(s, st.cid) : null;
    if (st.cup && (!c || c.phase !== "wait")) { this.tap({ type: "discard" }); return true; }
    if (!c) {
      const nc = this.pickCustomer();
      if (!nc) { if (st.cup) this.tap({ type: "discard" }); else this.wait(500); return true; }
      this.clock += this.p.read;
      this.tap({ type: "pin", cid: nc.id });
      return true;
    }
    const want = nextStep(st.cup);
    const ord = orderAt(s, st);
    // quên nắp: ly đủ 6 bước vẫn giao được
    if (want === "lid" && this.r() < this.p.lid) { this.tap({ type: "serve", cid: c.id }); return true; }
    if (want === null) {
      const r = this.tap({ type: "serve", cid: c.id });
      if (r.err) this.tap({ type: "discard" });
      return true;
    }
    const id = this.pickChoice(want, wantOf(ord, want));
    const r = this.tap({ type: "brew", step: want, id });
    if (r.err === "not-cooked") { this.ensurePearls(); this.wait(1500); }
    else if (r.err === "out-of-stock") {
      this.log.outOfStock++;
      const miss = Object.keys(r.detail?.use || {});
      let ok = true;
      for (const m of miss) { const rr = this.tap({ type: "restock", id: m }); if (rr.err) ok = false; else this.log.express++; }
      if (!ok) { // không mua nổi: đổ ly, bỏ đơn này
        if (st.cup) this.tap({ type: "discard" });
        this.wait(1500);
      }
    } else if (r.err === "coming") { this.tap({ type: "discard" }); this.wait(1500); }
    else if (r.err && r.err !== "wrong-step") this.wait(500);
    return true;
  }

  playShift() {
    const s = this.s;
    const day = s.day, t0 = this.clock, m0 = s.money, xp0 = s.xp;
    const r = this.act({ type: "startShift" });
    if (r.err) { this.errors.push({ day, where: "startShift", err: r.err }); return null; }
    let guard = 0;
    while (s.shift && guard++ < 20000) this.step();
    if (s.shift) { this.errors.push({ day, where: "shift-hang" }); s.shift = null; return null; }
    const sum = s.lastSummary;
    this.clock += this.p.summary;
    const rec = { day, level: s.level, xp: s.xp, xpGain: s.xp - xp0, money: s.money, moneyDelta: s.money - m0, profit: sum.profit, cups: sum.cups, served: sum.served,
      lost: sum.lost, avgStars: sum.avgStars, planned: sum.planned, minutes: (this.clock - t0) / 60000, clock: this.clock, owned: Object.keys(s.owned).length, rep: s.rep };
    this.days.push(rec);
    this.act({ type: "closeSummary" });
    return rec;
  }

  start() {
    this.act({ type: "setName", name: "Tiệm Mô Phỏng" });
    this.act({ type: "setPersona", persona: "hien" });
    this.act({ type: "seeIntro" });
    this.clock += 40000; // màn chào
  }
}
export { RECIPE, choice };
