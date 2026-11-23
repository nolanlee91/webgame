// Bộ mô phỏng cân bằng Quán Cơm Tấm: một người chơi giả chơi từng ca bằng LUẬT THẬT (chép khung Bánh Mì tools/sim/harness.mjs).
// Mọi thay đổi trạng thái đi qua core/apply.js (cùng cửa với trình duyệt: bản nháp, kiểm bất biến, lỗi thì không đổi gì).
// Thời gian chơi thật = thời gian ca đã trôi (đồng hồ ca chạy theo thao tác: mỗi lần bấm tốn `tap` ms; cô chủ đi bộ trong cảnh tốn giờ ca)
// + hội thoại (đồng hồ dừng) + Chuẩn bị (đầu ngày, giữa hai ca) + Chốt ca + màn chào.
// Mọi import mang cùng tag ?v=c2 với luật để fit.mjs sửa tạm bảng cấp trong bộ nhớ có hiệu lực.
import { apply } from "../../core/apply.js?v=c2";
import { readFileSync } from "node:fs";
import { configureScene } from "../../core/placements.js?v=c2";
// toạ độ cảnh thật (manifest của Codex), như game.js lúc mở
try { configureScene(JSON.parse(readFileSync(new URL("../../data/asset-manifest.json", import.meta.url), "utf8")).placements || {}); } catch { /* dự phòng data/scene.js */ }
import { createState } from "../../core/state.js?v=c2";
import { itemResult, isCooked, zoneOf, freeWarm, heatMul, onGrill2, isVegSlot } from "../../core/grill.js?v=c2";
import { tableJob, groupById, canSeat, patienceLeft } from "../../core/tables.js?v=c2";
import { nextStep, slotOf, targetOf, bestPiece } from "../../core/plate.js?v=c2";
import { stockoutOptions } from "../../core/rescue.js?v=c2";
import { ownerFree, walkMs, pointsOf } from "../../core/walker.js?v=c2";
import { canAutoBill } from "../../core/bill.js?v=c2";
import { canMakeOne, consignAvailable, forecast, stockUsed, capacity } from "../../core/stock.js?v=c2";
import { currentEvent, pickFree } from "../../core/drama.js?v=c2";
import { replyOptions } from "../../core/reviews.js?v=c2";
import { orderOffers, gearBlock, staffToday } from "../../core/progression.js?v=c2";
import { GRILL, GEAR, DECOR, STAFF, TIERS, FISH_SAUCE, PROMOS, PROMO_UNLOCK, RENT, DISHES, LATE, dishParts } from "../../data/economy.js?v=c2";
import * as EX from "../../core/extras.js?v=c2";

/** RNG riêng của người chơi giả (không đụng RNG của ván). */
export function playerRng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Thứ tự mua của người "plan": đồ mở món / gỡ nút thắt trước, rồi trang trí. "impulse" mua trang trí rẻ trước. Thuê quán chen vào ở cấp 7. */
export const PLAN = ["egg-pan", "ban-3", "steamer", "takeaway-shelf", "ban-4", "soup-pot", "double-slot", "glass-case", "awning", "spare-sack",
  "egg-pan-2", "smoke-hood", "q-table-4", "tray-4", "signboard-2", "rice-cooker-2", "electric-blower", "q-table-5", "dish-cabinet", "veg-grill",
  "fridge", "grill-2", "cash-box", "queue-bench", "signboard-3", "water-can",
  "chalk-menu", "red-lantern", "bougainvillea-pot", "fairy-lights", "wall-fan", "old-radio", "old-tv", "banana-plant", "neon-sign"];
export const IMPULSE = ["red-lantern", "paper-lantern", "egg-pan", "chalk-menu", "bougainvillea-pot", "ban-3", "ceramic-jar", "steamer", "fairy-lights", "takeaway-shelf",
  "ban-4", "glass-case", "soup-pot", "wall-calendar", "double-slot", "awning", "old-radio", "water-can", "wall-fan", "egg-pan-2", "old-tv", "bird-cage", "banana-plant",
  "q-table-4", "smoke-hood", "signboard-2", "tray-4", "rice-cooker-2", "electric-blower", "q-table-5", "dish-cabinet", "veg-grill", "fridge", "grill-2", "cash-box",
  "neon-sign", "queue-bench", "signboard-3"];
const isDecor = (id) => !!DECOR[id];
const price = (id) => (GEAR[id] || DECOR[id])?.price ?? Infinity;
const levelOf = (id) => (GEAR[id] || DECOR[id])?.level ?? 99;

export class Player {
  constructor(profile, { seed = 1, gameSeed = 20261120 } = {}) {
    this.p = profile;
    this.r = playerRng(seed);
    this.s = createState(gameSeed);
    this.clock = 0;
    this.errors = [];
    this.log = { actions: 0, rejected: 0, consign: 0, stuck: [], stockouts: 0, soldOut: 0, dialogs: 0, burnt: 0, placed: 0, fair: 0, challenge: 0, challengeWin: 0,
      orders: 0, ghiSo: 0, rejectTypes: {}, walkouts: 0, guests: 0, timeouts: 0, idleMs: 0 };
    this.notice = new Map();
    this.missPlan = new Map();
  }
  act(a) {
    this.log.actions++;
    const r = apply(this.s, a);
    if (r.events) for (const e of r.events) if (e.type === "timeout") { const k = "to:" + e.where; this.log.timeoutWhere = this.log.timeoutWhere || {}; this.log.timeoutWhere[k] = (this.log.timeoutWhere[k] || 0) + 1; }
    if (r.err) {
      this.log.rejected++; const k = a.type + ":" + r.err; this.log.rejectTypes[k] = (this.log.rejectTypes[k] || 0) + 1;
      if (r.err === "exception" || String(r.err).startsWith("invariant")) this.errors.push({ day: this.s.day, where: a.type, err: r.err, detail: String(r.detail || "").slice(0, 300) });
    }
    return r;
  }
  /** Thời gian thật trôi: đồng hồ ca chạy (nếu đang mở, không có hội thoại). */
  wait(ms) {
    this.clock += ms;
    for (let left = ms; left > 0 && this.s.shift && !this.s.shift.dialog; left -= 250) {
      const r = this.act({ type: "tick", dt: Math.min(250, left) });
      if (r.err) { this.errors.push({ day: this.s.day, where: "tick", err: r.err, detail: String(r.detail || "").slice(0, 300) }); break; }
    }
  }
  tap(a) { const r = this.act(a); this.wait(r.err ? 150 : this.p.tap * (0.8 + this.r() * 0.4)); return r; }
  pickOne(list) { return list[Math.floor(this.r() * list.length)]; }
  chance(p) { return this.r() < p; }

  // ---------- hội thoại ----------
  clearEvents() {
    for (let i = 0; i < 12; i++) {
      const d = currentEvent(this.s);
      if (!d) return;
      const ch = pickFree(this.s, this.r);
      this.clock += this.p.dialog; this.log.dialogs++;
      const r = this.act({ type: "event", choice: ch });
      if (r.err) { this.errors.push({ day: this.s.day, where: "event", id: d.id, err: r.err }); if (this.s.shift?.dialog) this.s.shift.dialog = null; else if (this.s.drama) this.s.drama.pending = null; return; }
    }
  }
  replyOne() {
    if (!this.chance(this.p.reply)) return;
    const r = (this.s.feed || []).find((x) => !x.reply && x.day >= this.s.day - 1);
    if (!r) return;
    const opts = replyOptions(this.s, r);
    if (!opts.length) return;
    this.clock += 6000;
    this.act({ type: "reply", id: r.id, kind: this.pickOne(opts).id });
  }

  // ---------- giữa hai ca ----------
  canAfford(id, reserve) { return this.s.money - price(id) >= reserve; }
  buy(id) {
    const r = isDecor(id) ? this.act({ type: "buyDecor", id }) : this.act({ type: "buyGear", id });
    if (!r.err) this.clock += 2500;
    return !r.err;
  }
  shop() {
    const s = this.s, plan = this.p.shopping === "plan";
    // thuê mặt bằng (cấp 7): người "plan" để dành ưu tiên, người "impulse" thuê khi dư
    if (s.level >= RENT.level && s.stage === "street") {
      if (s.money >= RENT.price + (plan ? 80 : 120)) { if (!this.act({ type: "rentQuan" }).err) this.clock += 8000; }
      else if (plan) return;
    }
    // để dành đủ tiền nhập hàng hôm nay (~11k mỗi dĩa dự báo) + đệm theo hồ sơ
    const reserve = Math.round(forecast(s).dishes * (plan ? 8 : 5)) + (plan ? 20 : 0) + (s.stage === "quan" ? 60 : 0);
    for (const id of plan ? PLAN : IMPULSE) {
      if (!(GEAR[id] || DECOR[id]) || levelOf(id) > s.level) continue;
      if (GEAR[id] && (s.owned[id] || gearBlock(s, id))) continue;
      if (isDecor(id) && s.decor?.[id]) continue;
      if (id === "spare-sack" && (s.spareSack || 0) >= 1) continue;
      if (!this.canAfford(id, reserve)) { if (plan) break; continue; }
      this.buy(id);
    }
    // thêm dĩa khi ít
    if (s.plates < (s.stage === "quan" ? 20 : 12) && s.money > 200) this.act({ type: "buyGear", id: "plates-4" });
    // chỗ tiêu tiền cuối game: hạng quán + nước mắm nhà pha khi đồ đã gần đủ
    const gearLeft = (plan ? PLAN : IMPULSE).filter((id) => (GEAR[id] || DECOR[id]) && levelOf(id) <= s.level && !(GEAR[id] && (s.owned[id] || gearBlock(s, id))) && !(isDecor(id) && s.decor?.[id]) && id !== "spare-sack").length;
    for (let k = 0; k < 3; k++) {
      const T = TIERS[s.tier || 0], F = FISH_SAUCE[s.fishSauce || 0];
      if (gearLeft <= 2 && T && T.level <= s.level && s.stage === "quan" && s.money - T.price >= reserve * 2) { if (!this.act({ type: "buyTier" }).err) { this.clock += 2500; continue; } }
      if (gearLeft <= 2 && F && F.level <= s.level && s.money - F.price >= reserve * 2) { if (!this.act({ type: "buyFishSauce" }).err) { this.clock += 2500; continue; } }
      break;
    }
  }
  restock() {
    const s = this.s;
    this.act({ type: "restockToday" });
    // Chú Hòa (cấp 9): gạo + than gói to rẻ cho người "plan"
    if (s.level >= 9 && this.p.shopping === "plan") {
      if ((s.stock["gao-tam"] || 0) < 30 && s.money > 200) this.act({ type: "restockHoa", id: "gao-tam" });
      if ((s.stock.than || 0) < 12 && s.money > 200) this.act({ type: "restockHoa", id: "than" });
    }
    this.clock += 4000;
  }
  prepShift(first) {
    const s = this.s;
    this.clearEvents();
    if (first) {
      this.replyOne();
      if (consignAvailable(s)) { this.act({ type: "consign" }); this.log.consign++; }
      else if (!canMakeOne(s)) this.log.stuck.push({ day: s.day, money: s.money, why: "no-bailout" });
      // ca: cả hai ca từ cấp 5
      if (s.level >= 5 && this.p.lunch) this.act({ type: "setPlan", kinds: ["trua", "toi"] });
      if (s.level >= LATE.level && this.p.id === "careful" && !s.lateShift) this.act({ type: "setLate", on: true });
      this.shop();
      this.restock();
      // hội chợ (cấp 18) / ca thử thách (cấp 20)
      if (this.p.fair && EX.fairAvailable(s) && s.money >= EX.FAIR.price + 200) { if (!this.act({ type: "fair" }).err) this.log.fair++; }
      if (this.p.challenge && EX.challengeToday(s) && !EX.fairToday(s)) { if (!this.act({ type: "challenge", on: true }).err) this.log.challenge++; }
      if (s.level >= PROMO_UNLOCK && s.promo?.day !== s.day) {
        const kind = s.money > 500 ? "check-in" : s.money > 250 ? "to-roi" : "livestream";
        if (s.money >= PROMOS[kind].price + 80) this.act({ type: "promo", kind });
      }
      if (s.level >= STAFF.bong.level && s.money > (this.p.id === "careful" ? 250 : 400)) this.act({ type: "hireStaff", id: "bong", on: true });
      if (s.level >= STAFF["di-nam"].level && s.money > 400) this.act({ type: "hireStaff", id: "di-nam", on: true });
      // đơn đặt trước (quán, cấp 7)
      const offers = orderOffers(s);
      for (let i = 0; i < Math.min(this.p.accept, offers.length); i++) if (!this.act({ type: "acceptOrder", idx: i }).err) this.log.orders++;
      this.act({ type: "restockToday" });
      // kho đầy sau khi nhập (đo cho quyết định sức chứa vỉa hè): còn dưới 6 chỗ
      if (stockUsed(s) >= capacity(s) - 6) { this.log.capFull = (this.log.capFull || 0) + 1; if (s.stage === "street" && s.level >= 5) this.log.capFullStreet56 = (this.log.capFullStreet56 || 0) + 1; }
      if (s.stage === "street" && s.level >= 5 && s.level <= 6) this.log.street56Days = (this.log.street56Days || 0) + 1;
      this.manageMenu();
      this.clock += this.p.prep;
    } else this.clock += this.p.between;
    // mẻ đầu ca: nồi cơm, mỡ hành, nhóm bếp
    this.act({ type: "prepCook" });
    if (s.moHanh.n < 10) this.act({ type: "prepMoHanh" });
    this.act({ type: "prepLight" });
  }

  /** Tắt món thiếu nguyên liệu riêng (bì / chả / trứng / thịt khác) sau khi nhập; bật lại khi kho đủ. Người ẩu ít khi để ý. */
  manageMenu() {
    const s = this.s;
    if (this.p.id === "sloppy" && this.chance(0.7)) return;
    const parts = (id) => Object.keys(dishParts(id)).filter((k) => k !== "suon-uop" && k !== "bread");
    const short = (k) => (k === "cha" ? (s.stock.cha || 0) < 4 : (s.stock[k] || 0) < 3);
    for (const id of [...(s.menu || [])]) if (!DISHES[id]?.special && parts(id).some(short)) this.act({ type: "toggleDish", id, on: false });
    for (const id of [...(s.menuOff || [])]) if (parts(id).every((k) => (s.stock[k] || 0) >= 8)) this.act({ type: "toggleDish", id, on: true });
  }
  // ---------- trong ca ----------
  /** Giây tới lúc miếng cần tay (mặt dưới chạm 100 nếu chưa chín, chạm cháy cạnh nếu đã chín) — người cẩn thận không rời bếp khi sắp tới lúc. */
  grillSafeSec() {
    const g = this.s.shift.grill;
    let min = Infinity;
    g.slots.forEach((it, i) => {
      if (!it) return;
      const z = zoneOf(i, g);
      if (z === "warm" && it.warmMs < GRILL.warmSafeMs - 8000) return;
      const rate = (100 / GRILL.side[it.item]) * GRILL.zoneMul[z] * Math.max(0.6, heatMul(g, onGrill2(g, i) ? 2 : 1)) * (z === "hot" ? 1.2 : 1);
      const b = it.sides[0];
      // miếng chín hai mặt ngoài vùng ấm mà vùng ấm đã đầy: không tránh được, không giữ chân cô chủ
      if (b >= 100 && (z === "warm" || freeWarm(g) < 0)) return;
      const target = b < 100 ? 100 : 112;
      min = Math.min(min, Math.max(0, (target - b) / rate));
    });
    return min;
  }
  /** Bếp có kịp cho một chuyến ra bàn tid không (đi + về + làm), theo hồ sơ (leaveSafe = giây đệm; 0 = không quan tâm). */
  safeTrip(tid, workMs = 1500) {
    if (!this.p.leaveSafe) return true;
    const tp = pointsOf(this.s).tables.find((x) => x.id === tid);
    const trip = (tp ? walkMs(this.s, tp.servePoint) * 2 : 5000) + workMs;
    return this.grillSafeSec() * 1000 >= trip + (this.p.leaveSafe - 4) * 1000;
  }
  /** Một thao tác ở bếp (cô chủ đứng ở bếp). Trả true nếu đã làm. */
  tendGrill() {
    const s = this.s, sh = s.shift, g = sh.grill;
    for (let i = 0; i < g.slots.length; i++) {
      const it = g.slots[i];
      if (!it) continue;
      const res = itemResult(it);
      if (res === "burnt") { this.log.burnt++; this.tap({ type: "discardMeat", slot: i }); return true; }
      const key = `${s.day}:${sh.kind}:${it.id}:${it.flips}`;
      if (it.sides[0] >= 100 && zoneOf(i, g) !== "warm") {
        if (!this.notice.has(key)) { const [a, z] = this.p.react; this.notice.set(key, sh.t + (a + this.r() * (z - a)) * 1000); }
        if (sh.t < this.notice.get(key)) continue;
        if (it.sides[1] < 100) { this.tap({ type: "flip", slot: i }); return true; }
        if (freeWarm(g) >= 0) { this.tap({ type: "moveWarm", slot: i }); return true; }
      }
      // giữ ấm quá lâu (khô / sắp cháy): người cẩn thận ưu tiên dùng, nếu không ai cần thì bỏ
      if (zoneOf(i, g) === "warm" && it.warmMs > GRILL.warmSafeMs - 1500 && this.p.id === "careful") { this.tap({ type: "discardMeat", slot: i }); return true; }
    }
    if (g.coal < 40 && !g.pending.length && (s.stock.than || 0) + (s.spareSack || 0) > 0) { this.tap({ type: "addCoal" }); return true; }
    if (g.coal2 !== undefined && g.coal2 < 40 && !(g.pending2 || []).length && (s.stock.than || 0) > 0 && (sh.t < sh.len - 30000) && this.p.id !== "sloppy") { this.tap({ type: "addCoal", grill: 2 }); return true; }
    if (g.coal < 12 && !g.pending.length && (this.outAt?.than ?? -1e9) < sh.t - 20000 && !sh.deliveries.some((d) => d.id === "than")) { this.tap({ type: "addCoal" }); return true; } // hết than: hội thoại cứu
    return false;
  }
  stations() {
    const s = this.s, sh = s.shift;
    const open = sh.tickets.filter((t) => t.status === "open" || t.status === "pinned");
    // nồi cơm: nấu khi sắp hết và còn khách (người ẩu nấu bất kể, cuối ca dư cơm)
    const wantRice = open.length + sh.groups.filter((g) => (g.phase === "seated" || g.phase === "toTable" || g.phase === "wait") && g.orderT === null).reduce((a, g) => a + g.size, 0);
    if (sh.rice.n <= 3 && !sh.rice.cooking && open.length && (this.p.id === "sloppy" || (wantRice > sh.rice.n && sh.t < sh.len - 35000))) { const r = this.tap({ type: "cookRice" }); if (!r.err) return true; }
    // hấp chả sẵn khi menu có món chả (xửng 30 giây, đừng để phiếu đứng chờ)
    if (sh.steamer && !sh.steamer.cooking && sh.steamer.done < 3 && (s.stock.cha || 0) > 0 && sh.t < sh.len - 20000 && (s.menu || []).some((id) => DISHES[id]?.cha && !DISHES[id]?.vegan)) { const r = this.tap({ type: "steam" }); if (!r.err) return true; }
    if (s.moHanh.n < 2 && (s.stock["mo-hanh-bo"] || 0) > 0 && !sh.owner.queue.some((q) => q.kind === "moHanh")) { const r = this.tap({ type: "moHanh" }); if (!r.err) return true; }
    // trứng: chiên khi dĩa đang bày cần trứng (người cẩn thận canh lòng đào)
    const sl = slotOf(s);
    if (sh.pan && sl.tk !== null && nextStep(s) === "egg") { const r = this.tap({ type: "egg" }); if (!r.err) return true; }
    return false;
  }
  /** Nướng sẵn: phiếu đang chờ + khách đã ngồi chưa gọi (đoán sườn) + đệm theo hồ sơ. */
  placeAhead() {
    const s = this.s, sh = s.shift, g = sh.grill;
    const need = {};
    for (const t of sh.tickets) if ((t.status === "open" || t.status === "pinned") && DISHES[t.dish]?.meat) {
      const n = t.catering ? Math.min(t.n, 4) : 1;
      need[DISHES[t.dish].meat] = (need[DISHES[t.dish].meat] || 0) + n;
    }
    // đệm nướng sẵn (giữ ấm ở vùng phải): có khách đang ngồi / đang tới thì giữ `ahead` miếng sườn chín sẵn
    const late = sh.t > sh.len - 30000;
    const coming = sh.groups.filter((x) => (x.phase === "seated" || x.phase === "toTable") && x.orderT === null).reduce((a, x) => a + x.size, 0);
    const cookedNow = g.slots.filter((it) => it && isCooked(it)).length;
    const warmN = g.slots.filter((_, i) => zoneOf(i, g) === "warm").length;
    const buf = late || cookedNow >= warmN ? 0 : Math.min(this.p.ahead, coming, warmN - cookedNow);
    if (buf) need.suon = (need.suon || 0) + buf;
    for (const [item, n] of Object.entries(need)) {
      const sid = item === "suon" ? "suon-uop" : item;
      if ((s.stock[sid] || 0) <= 0 && (sh.deliveries.some((d) => d.id === sid) || (this.outAt?.[sid] ?? -1e9) > sh.t - 8000)) continue;
      const on = g.slots.filter((it) => it && it.item === item).length;
      const plated = sh.slots.filter((x) => x.plate?.meat?.item === item).length;
      if (on + plated >= n || on >= 6) continue;
      // không nướng quá số chỗ giữ ấm: miếng chín thừa mà vùng ấm đầy thì cháy
      const warmSlots = g.slots.filter((_, i) => zoneOf(i, g) === "warm").length;
      const tickets = n - (item === "suon" ? buf : 0);
      if (g.slots.filter(Boolean).length >= tickets + warmSlots) continue;
      // người cẩn thận / trung bình: số miếng trên bếp ≤ chỗ giữ ấm + 1 (miếng chín thừa ngoài vùng ấm sẽ cháy trong lúc bày dĩa khác)
      if (this.p.leaveSafe && g.slots.filter(Boolean).length >= warmSlots + 1) return false;
      // người cẩn thận / trung bình không giữ quá nhiều miếng đang nướng (không kịp lật khi phải ra bàn)
      const cooking = g.slots.filter((it, i) => it && zoneOf(i, g) !== "warm" && !isCooked(it)).length;
      if (this.p.leaveSafe && cooking >= (this.p.id === "careful" ? 3 : 4)) return false;
      const free = g.slots.map((x, i) => (!x && zoneOf(i, g) !== "warm" && !isVegSlot(g, i) ? i : -1)).filter((i) => i >= 0);
      if (!free.length && item !== "dau-hu") return false;
      // đậu hũ: để game chọn (vỉ chay riêng, rồi chỗ chưa nướng thịt) — người ẩu bỏ đại chỗ nóng nhất
      const pref = item === "dau-hu" && this.p.id !== "sloppy" ? -1 : this.p.zone === "mid" ? free.find((i) => zoneOf(i, g) === "mid") ?? free[0] : free.find((i) => zoneOf(i, g) === "hot") ?? free[0];
      if (pref === undefined) return false;
      const r = this.tap({ type: "placeMeat", slot: pref, item });
      if (!r.err) { this.log.placed++; return true; }
      return false;
    }
    return false;
  }
  /** Chọn phiếu để ghim: khách ngồi lâu nhất có món làm được ngay (thịt chín sẵn / không cần thịt). */
  pickTicket() {
    const s = this.s, sh = s.shift;
    const open = sh.tickets.filter((t) => t.status === "open" && (t.catering || groupById(s, t.gid)?.phase === "seated" || groupById(s, t.gid)?.phase === "queue"));
    if (!open.length) return null;
    const ready = (t) => { const tg = targetOf(t); return (!tg.meat || bestPiece(s, tg) >= 0) && (!tg.cha || tg.vegan || (sh.steamer?.done || 0) > 0); };
    const urg = (t) => (t.catering ? 0.5 : patienceLeft(s, groupById(s, t.gid)));
    const r = open.filter(ready);
    const list = r.length ? r : open;
    return list.sort((a, b) => urg(a) - urg(b))[0];
  }
  /** Một bước bày dĩa (theo nextStep, có xác suất quên lớp / bỏ sót dặn riêng). */
  plateStep() {
    const s = this.s, sh = s.shift, sl = slotOf(s);
    if (sl.tk === null) {
      const t = this.pickTicket();
      if (!t) return false;
      this.wait(this.p.id === "careful" ? 900 : 500); // đọc phiếu
      // bày ×N cho bàn cùng món (khi có ô bày đôi)
      const r = this.tap({ type: "pin", tk: t.id });
      // món có trứng: bắc trứng ngay lúc ghim phiếu (bày cơm, mỡ hành, thịt xong là trứng vừa lòng đào)
      if (!r.err && sh.pan && DISHES[t.dish]?.trung && !sh.pan.egg && (s.stock.trung || 0) > 0) this.tap({ type: "egg" });
      if (!r.err && EX.batchCandidates(s, t.id).length && !t.catering) this.tap({ type: "batchPin", on: true });
      return !r.err;
    }
    const t = sh.tickets.find((x) => x.id === sl.tk);
    if (!t || t.status === "void" || t.status === "served") { if (sl.plate) this.tap({ type: "discard" }); else sl.tk = null; return true; }
    let step = nextStep(s);
    if (!step) return false;
    // lớp đã bỏ qua (hết hàng, chọn "bỏ qua") ⇒ tự chọn lớp kế tiếp còn thiếu, không bấm lại lớp hết hàng
    const sk = this.skip?.tk === t.id ? this.skip.ids : null;
    if (sk && sk.has(step)) step = this.nextAfterSkip(t, sk);
    // thiếu món chính (bì / chả / trứng đã bỏ qua vì hết) ⇒ báo hết món thay vì bưng sai món
    if (sk && ["bi", "cha", "trung"].filter((x) => sk.has(x) && targetOf(t)[x]).length >= 2) { if (sl.plate) this.tap({ type: "discard" }); this.tap({ type: "voidTicket", tk: t.id }); this.skip = null; return true; }
    if (step === "grill") return this.placeAhead();
    if (step.startsWith("wait")) return false;
    // sai sót của người chơi: quên lớp phụ ⇒ giao luôn; bỏ sót dặn riêng ⇒ lớp sai
    const mk = sh.kind + ":" + t.id;
    if (!this.missPlan.has(mk)) this.missPlan.set(mk, { layer: this.chance(this.p.miss.layer), quirk: this.chance(this.p.miss.quirk) && (t.quirks || []).length > 0 });
    const mp = this.missPlan.get(mk);
    // người cẩn thận / trung bình chưa đi bưng khi miếng trên bếp sắp cần tay (lật trước đã)
    if ((step === "serve" || mp.layer && ["doChua", "duaLeo", "sauce"].includes(step)) && !t.takeaway && !t.catering && !this.safeTrip(t.tid, 600)) return false;
    if (mp.layer && ["doChua", "duaLeo", "sauce"].includes(step)) { mp.layer = false; this.tap({ type: "serve" }); return true; }
    if (mp.quirk && step === "com" && sl.plate && sl.plate.com >= 1 && (t.quirks || []).includes("themCom")) { mp.quirk = false; this.tap({ type: "layer", id: "moHanh" }); return true; }
    if (mp.quirk && step === "sauce" && (t.quirks || []).includes("riengNuocMam") && sl.plate?.sauce === null) { mp.quirk = false; this.tap({ type: "layer", id: "sauce" }); this.tap({ type: "serve" }); return true; }
    if (mp.quirk && step === "doChua" && (t.quirks || []).includes("khongMoHanh")) { mp.quirk = false; if (sl.plate?.moHanh === 0) { this.tap({ type: "layer", id: "moHanh" }); return true; } }
    const r = sk && sk.size ? this.tap(step === "serve" ? { type: "serve" } : step === "egg" ? { type: "egg" } : step === "meat" ? { type: "autoStep" } : { type: "layer", id: step }) : this.tap({ type: "autoStep" });
    if (r.ok && r.result?.stockout) this.lastOut = { tk: t.id, step };
    if (r.err) {
      if (step === "dia" && r.err === "no-plates") { this.tap({ type: "layer", id: "hop" }); return true; }
      if (r.err === "no-cha-ready") { if (sh.steamer && !sh.steamer.cooking) this.tap({ type: "steam" }); return false; }
      return false;
    }
    return true;
  }
  /** Bước kế tiếp khi một số lớp đã bỏ qua (hết hàng). */
  nextAfterSkip(t, sk) {
    const s = this.s, p = slotOf(s).plate, tg = targetOf(t);
    if (!p) return tg.kind;
    const want = [["com", p.com < tg.com], ["moHanh", p.moHanh < tg.moHanh], ["hanhPhi", tg.hanhPhi && !p.hanhPhi], ["meat", tg.meat && !p.meat], ["bi", tg.bi && !p.bi], ["cha", tg.cha && !p.cha],
      ["trung", tg.trung && !p.trung], ["doChua", tg.doChua && !p.doChua], ["duaLeo", tg.duaLeo && !p.duaLeo], ["sauce", tg.sauce && p.sauce === null], ["ngo", tg.ngo && !p.ngo]];
    const w = want.find(([id, need]) => need && !sk.has(id));
    if (!w) return "serve";
    if (w[0] === "meat") return nextStep(s);
    if (w[0] === "trung") { const pan = s.shift.pan; return pan?.egg ? (s.shift.t - pan.egg.t0 >= 6000 ? "trung" : "wait-egg") : "egg"; }
    return w[0];
  }
  /** Việc ở bàn: giao cho cô chủ (hàng đợi), chỉ khi bếp an toàn theo hồ sơ. */
  tableJobs(maxPri = 9) {
    const s = this.s, sh = s.shift;
    const queued = sh.owner.queue.length + (sh.owner.task && sh.owner.task.kind !== "home" ? 1 : 0);
    if (queued >= (this.p.leaveSafe ? 1 : 3)) return false;
    const jobs = [];
    for (const t of sh.tables) {
      const job = tableJob(s, t.id);
      if (!job || job === "seat") continue;
      if ([sh.owner.task, ...sh.owner.queue].some((q) => q && q.tid === t.id && q.kind === job)) continue;
      const g = t.gid !== null ? groupById(s, t.gid) : null;
      const pri = job === "bill" ? 0 : job === "visit" ? (g?.orderT === null ? 1 : 2) : job === "clean" ? (sh.groups.some((x) => x.phase === "wait") ? 1.5 : 3) : 2.5;
      if (pri <= maxPri && (!ownerFree(s) || this.safeTrip(t.id, job === "visit" ? 2800 : job === "clean" ? 2500 : 1000))) jobs.push({ t, job, pri });
    }
    if (!jobs.length) {
      if (maxPri < 9) return false;
      if (sh.cleanPlates <= 2 && sh.dirty > 0 && !sh.owner.queue.some((q) => q.kind === "wash")) { const r = this.tap({ type: "wash" }); return !r.err; }
      return false;
    }
    jobs.sort((a, b) => a.pri - b.pri);
    // người ẩu đôi khi bỏ qua châm trà
    const j = jobs[0];
    if (this.p.id === "sloppy" && j.job === "visit" && this.chance(0.25)) return false;
    const r = this.tap({ type: "tableTap", tid: j.t.id });
    return !r.err;
  }
  billStep() {
    const s = this.s, sh = s.shift, b = sh.billing;
    if (b.ghiSo) { const acc = this.chance(this.p.ghiSo); this.tap({ type: "ghiSo", accept: acc }); if (acc) this.log.ghiSo++; return; }
    if (canAutoBill(s)) { this.tap({ type: "autoBill" }); this.tap({ type: "collect" }); return; }
    const bad = this.chance(this.p.miss.bill);
    for (const l of b.lines) {
      if (b.tapped.includes(l.key)) continue;
      if (l.real || (bad && this.chance(0.5))) { this.tap({ type: "tapLine", key: l.key }); if (!s.shift?.billing) return; }
    }
    if (bad && s.shift.billing && s.shift.billing.tapped.length > 1 && this.chance(0.4)) this.tap({ type: "tapLine", key: s.shift.billing.tapped[0] });
    if (s.shift?.billing) this.tap({ type: "collect" });
  }
  dialogStep() {
    const s = this.s, sh = s.shift, d = sh.dialog;
    this.clock += this.p.dialog; this.log.dialogs++;
    if (d.kind === "complaint") {
      const t = sh.tickets.find((x) => x.id === d.tk);
      const remade = !!t?.remade || (this.skip?.tk === d.tk && this.skip.ids.size > 0);
      this.act({ type: "complaint", choice: d.serious ? (this.p.id === "careful" || remade ? "refund" : "remake") : remade && this.p.complaint === "remake" ? "discount" : this.p.complaint });
      return;
    }
    if (d.kind === "overcharge") { this.act({ type: "overcharge", choice: this.p.id === "careful" ? "refundTea" : "refund" }); return; }
    if (d.kind === "stockout") {
      this.log.stockouts++;
      this.log.soIds = this.log.soIds || {}; this.log.soIds[d.id] = (this.log.soIds[d.id] || 0) + 1;
      const opts = stockoutOptions(s).filter((o) => o.ok);
      const side = !["suon-uop", "gao-tam", "than"].includes(d.id);
      const pref = side ? ["borrow", "dismiss", "consign"] : this.p.id === "sloppy" ? ["consign", "borrow", "marinate", "dismiss", "bread", "ship", "run", "soldOut"] : ["consign", "marinate", "borrow", "ship", "run", "dismiss", "bread", "soldOut"];
      // hội thoại hết hàng mở khi bày một lớp: chọn "bỏ qua" thì nhớ bỏ lớp đó ở dĩa này
      const L = { "do-chua": "doChua", "dua-leo": "duaLeo", "nuoc-mam": "sauce", "nuoc-tuong": "sauce", "mo-hanh-bo": "moHanh", bi: "bi", "bi-chay": "bi", "cha-chay": "cha", cha: "cha", trung: "trung" }[d.id];
      const tk = slotOf(s).tk;
      const o = pref.map((id) => opts.find((x) => x.id === id)).find(Boolean) || opts[0];
      if (o?.id === "soldOut") this.log.soldOut++;
      this.outAt = { ...(this.outAt || {}), [d.id]: sh.t };
      if (o?.id === "dismiss" && L && tk !== null) { if (this.skip?.tk !== tk) this.skip = { tk, ids: new Set() }; this.skip.ids.add(L); }
      const r = this.act({ type: "stockout", choice: o?.id || "soldOut" });
      if (r.err) { this.errors.push({ day: s.day, where: "stockout", err: r.err, choice: o?.id }); this.act({ type: "stockout", choice: "soldOut" }); }
      return;
    }
    if (d.kind === "event") { this.clock -= this.p.dialog; this.clearEvents(); return; }
    this.errors.push({ day: s.day, where: "dialog-unknown", kind: d.kind });
    sh.dialog = null;
  }
  step() {
    const s = this.s, sh = s.shift;
    if (!sh) return;
    if (sh.dialog) { this.dialogStep(); return; }
    if (this.coolUntil > sh.t) { this.wait(300); return; }
    if (sh.billing && sh.owner.task?.kind === "bill") { this.billStep(); return; }
    if (sh.billing) { this.billStep(); return; }
    // xếp chỗ (người cẩn thận / trung bình không mời thêm khi đang có nhiều bàn chưa lên món: làm xong bàn cũ đã)
    const pending = sh.groups.filter((x) => (x.phase === "seated" || x.phase === "toTable") && !x.paid && x.members.some((m) => !m.plate && m.tk !== null || x.orderT === null)).length;
    const cap = this.p.maxPending ?? 99;
    for (const g of pending >= cap ? [] : sh.groups.filter((x) => x.phase === "wait")) {
      const t = sh.tables.find((x) => x.gid === null && x.state !== "dirty" && x.seats >= g.size && !x.joinOf) || sh.tables.find((x) => canSeat(s, g, x));
      if (t) { this.tap({ type: "seat", gid: g.id, tid: t.id }); return; }
    }
    if (sh.owner.away) { this.wait(400); return; }
    if (ownerFree(s)) {
      if (this.tendGrill()) return;
      if (!s.shift) return;
      if (this.tableJobs(1.5)) return; // khách mới ngồi chưa có trà / gọi tính tiền / có khách chờ bàn dơ: ra bàn trước
      if (!s.shift || s.shift.dialog) return;
      if (this.placeAhead()) return;
      if (!s.shift || s.shift.dialog) return;
      if (this.plateStep()) return;
      if (!s.shift || s.shift.dialog) return;
      if (this.stations()) return;
    }
    if (!s.shift || s.shift.dialog) return;
    if (this.tableJobs()) return;
    this.log.idleMs += 300;
    const why = sh.owner.away ? "away" : !ownerFree(s) ? "walk" : this.p.leaveSafe && this.grillSafeSec() < this.p.leaveSafe && sh.tables.some((t) => { const j = tableJob(s, t.id); return j && j !== "seat"; }) ? "safe" : "none";
    this.log.idle = this.log.idle || {}; this.log.idle[why] = (this.log.idle[why] || 0) + 300;
    if (why === "none" && process.env.SIM_DEBUG) {
      const open = sh.tickets.filter((t) => t.status === "open" || t.status === "pinned").length;
      const st0 = slotOf(s).tk !== null ? nextStep(s) : "-"; const k = `open${Math.min(open, 3)}:step=${st0}:grill${sh.grill.slots.filter(Boolean).length}` + (st0 === "grill" ? `:uop${s.stock["suon-uop"]}:suon${s.stock.suon}:del${sh.deliveries.length}:dish${sh.tickets.find((x) => x.id === slotOf(s).tk)?.dish}` : "");
      this.log.noneWhy = this.log.noneWhy || {}; this.log.noneWhy[k] = (this.log.noneWhy[k] || 0) + 1;
    }
    this.wait(300);
  }
  playShift() {
    const s = this.s;
    const day = s.day, m0 = s.money, xp0 = s.xp;
    const r = this.act({ type: "startShift" });
    if (r.err) { this.errors.push({ day, where: "startShift", err: r.err }); return null; }
    this.coolUntil = 0; this.outAt = {}; this.skip = null; // đồng hồ ca mới bắt đầu từ 0
    const guests = s.shift.schedule.reduce((a, g) => a + g.roles.length, 0);
    let guard = 0, lastT = -1, same = 0;
    while (s.shift && guard++ < 60000) {
      this.step();
      // vòng lặp không làm đồng hồ ca chạy (thao tác lặp bị từ chối / hội thoại mở đóng liên tục) ⇒ đứng chờ một nhịp như người thật
      if (s.shift && s.shift.t === lastT) {
        if (++same > 60) {
          this.log.loops = (this.log.loops || 0) + 1; same = 0;
          if (s.shift.dialog?.kind === "stockout") { const o = stockoutOptions(s).find((x) => x.ok && (x.id === "dismiss" || x.id === "soldOut")); this.act({ type: "stockout", choice: o?.id || "soldOut" }); }
          else if (s.shift.dialog) this.dialogStep();
          this.coolUntil = (s.shift?.t || 0) + 4000;
          this.wait(500);
        }
      } else { same = 0; lastT = s.shift?.t; }
    }
    if (s.shift) { this.errors.push({ day, where: "shift-hang", t: s.shift.t }); s.shift = null; return null; }
    const sum = s.lastSummary;
    if (sum.challenge?.ok) this.log.challengeWin++;
    this.clock += this.p.summary;
    this.act({ type: "closeSummary" });
    this.log.guests += guests; this.log.walkouts += sum.lost || 0; this.log.timeouts += sum.timeouts || 0;
    return { day, kind: sum.kind, level: s.level, xp: s.xp, xpGain: s.xp - xp0, money: s.money, moneyDelta: s.money - m0, profit: sum.profit, plates: sum.plates, lost: sum.lost,
      passed: sum.passed || 0, guests, avg: sum.avg, waste: sum.waste, burnt: sum.burnt, riceLeft: sum.riceLeft, stage: s.stage, fair: !!sum.fair, challenge: sum.challenge || null };
  }
  /** Một ngày: chuẩn bị + các ca + sang ngày. Trả bản ghi ngày. */
  playDay() {
    const s = this.s;
    const day = s.day, m0 = s.money, xp0 = s.xp;
    const shifts = [];
    let first = true;
    do {
      this.prepShift(first); first = false;
      const rec = this.playShift();
      if (!rec) return null;
      shifts.push(rec);
    } while (!s.dayDone);
    this.act({ type: "nextDay" });
    this.clearEvents();
    const sum = (k) => shifts.reduce((a, x) => a + (x[k] || 0), 0);
    return { day, level: s.level, xp: s.xp, xpGain: s.xp - xp0, money: s.money, moneyDelta: s.money - m0, profit: sum("profit"), plates: sum("plates"), lost: sum("lost"),
      guests: sum("guests"), passed: sum("passed"), burnt: sum("burnt"), waste: Math.round(sum("waste")), shifts: shifts.length, stage: s.stage, fair: shifts.some((x) => x.fair),
      challenge: shifts.find((x) => x.challenge)?.challenge || null, avg: Math.round((shifts.reduce((a, x) => a + x.avg, 0) / shifts.length) * 10) / 10 };
  }
  start() {
    this.act({ type: "setName", name: "Quán Mô Phỏng" });
    this.act({ type: "seeIntro" });
    this.act({ type: "persona", persona: this.pickOne(["hien", "cucsuc", "lay", "sale"]) });
    this.clock += 40000; // màn chào + đặt tên
  }
}
