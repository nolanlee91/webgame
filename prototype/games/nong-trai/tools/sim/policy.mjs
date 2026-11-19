// Chính sách người chơi "tham nhưng hợp lý" cho bộ mô phỏng. Mỗi lần nhìn màn hình (tick) làm theo thứ tự:
//   đồng bộ → thu hoạch / nhận máy / thu trứng sữa → nhận nhiệm vụ → giao đơn → bỏ đơn kẹt → chạy máy → cho ăn
//   → bán dư → xây / nâng / mua theo danh sách ưu tiên → gieo (cây hợp với thời gian tới lần nhìn tiếp) → tưới.
// Chỉ dùng hàm của harness (⇒ luật thật). Không đọc giờ thật.
import { CROP, CROPS, ITEM, RECIPE, MACHINE, ANIMAL, BUILDING, QUESTS, MARKET, plots, orders, P, A, V, B } from "./harness.mjs";
import { RECIPES } from "../../data/recipes.js?v=m2";
import { VILLAGERS, REPEATABLE_BY_ID } from "../../data/village.js?v=m4";

export const XP_WORTH = 2;          // 1 XP ≈ 2 xu khi chọn cây (người chơi muốn lên cấp)
export const STALE_ORDER_MS = 30 * 60_000; // đơn không giao được sau 30 phút CHƠI ⇒ bỏ
const FEED = "thuc-an-gia-suc";

const base = (id) => ITEM[id]?.sell || 0;
const cropOk = (s, id) => { const c = CROP[id]; return !!c && s.level >= c.level && (!c.requires || (s.buildings?.[c.requires]?.level ?? 0) >= 1); };

/** Nhu cầu: món các đơn đang cần + món trao tay của chuỗi NPC hiện tại (từ cấp 14) + món chuỗi / nhiệm vụ cần "nhận từ máy". */
function demandOf(f) {
  const s = f.s, need = { ...orders.demand(s) };
  if (s.level >= 14) {
    for (const v of VILLAGERS) {
      const q = V.currentChainStep(s.village, v.id);
      if (q?.give) for (const [id, n] of Object.entries(q.give)) need[id] = (need[id] || 0) + n;
      else if (q?.event === 'jobCollected' && q.match?.item && f.have(q.match.item) < 1) need[q.match.item] = (need[q.match.item] || 0) + 1;
    }
  }
  return need;
}

function machineReady(f, id) { const m = f.s.production.machines[id]; return !!m && f.now >= m.readyAt; }
function queuedOutputs(f) {
  const out = {};
  for (const m of Object.values(f.s.production.machines)) for (const j of m.queue) { const r = RECIPE[j.recipe]; out[r.output] = (out[r.output] || 0) + r.qty; }
  return out;
}
function animalCounts(f) {
  const c = { ga: 0, bo: 0 };
  for (const a of f.s.animals.list) c[a.kind]++;
  return c;
}
const feedNeedPerCycle = (f) => { const c = animalCounts(f); return c.ga * ANIMAL.ga.feed + c.bo * ANIMAL.bo.feed; };

/** Dự trữ không bán: đơn/chuỗi + nguyên liệu cho máy đang có. */
function keepOf(f, need) {
  const s = f.s, keep = { ...need };
  const add = (id, n) => { keep[id] = (keep[id] || 0) + n; };
  if (machineReady(f, "bep-sen")) add("dau-tay", 3);
  if (machineReady(f, "coi-xay")) { if (f.s.animals.list.length) add("ngo", 4); if (s.level >= 6 && machineReady(f, "lo-banh")) add("lua", 4); }
  if (machineReady(f, "lo-banh")) { add("trung-ga", 4); add("bot-gao", 2); add("bi-ngo", 1); }
  if (machineReady(f, "may-bo-sua")) add("sua", 3);
  if (machineReady(f, "noi-duong")) add("mia", 2);
  if (s.production.machines["lo-banh"]?.level >= 2) { add("duong", 1); add("sua", 1); }
  add(FEED, Math.max(feedNeedPerCycle(f) * 3, f.s.animals.list.length ? 3 : 0));
  return keep;
}

// ---------------- thu ----------------
function collectAll(f, tick) {
  const s = f.s;
  if (s.plots.some((p) => plots.isReady(p, f.now))) {
    let r = f.harvestAll();
    if (r.err === "basket-full" || r.blocked) { sellSurplus(f, true); r = f.harvestAll(); if (r.err === "basket-full" || r.blocked) tick.blocked = "basket-full"; }
  }
  if (Object.values(s.production.machines).some((m) => m.queue.some((j) => f.now >= j.endAt))) {
    const r = f.collectMachines();
    if (r.err === "full" || r.full) { sellSurplus(f, true); f.collectMachines(); }
  }
  if (s.animals.list.some((a) => A.stateOf(a, f.now) === "ready")) {
    const r = f.collectAnimals();
    if (r.err === "full" || r.full) { sellSurplus(f, true); f.collectAnimals(); }
  }
}

// ---------------- nhiệm vụ ----------------
function claimAll(f) {
  const s = f.s;
  for (let k = 0; k < 4; k++) { const q = QUESTS[s.quests.tut]; if (!q || s.quests.progress < q.count) break; f.claimQuest(q.id); }
  const ctx = f.villageCtx();
  for (let k = 0; k < 3; k++) { const q = V.currentProgression(s.village); if (!q || f.villageClaim("prog", q.id).err) break; }
  if (s.level >= 14) for (const v of VILLAGERS) f.villageClaim("chain", v.id, s.village.chains[v.id].step);
  for (const slot of [...s.village.board.slots]) {
    const q = REPEATABLE_BY_ID[slot.tpl];
    if (q && slot.progress >= q.count) f.villageClaim("board", slot.uid);
  }
  void ctx;
}

// ---------------- đơn ----------------
function deliverOrders(f, activeClock) {
  const s = f.s;
  f.orderSeen ||= {};
  const slots = [...s.orders.slots.map((x, i) => [i, x]), ...(s.orders.special ? [["special", s.orders.special]] : [])];
  for (const [slot, x] of slots) {
    const o = x.order;
    if (!o) continue;
    if (f.orderSeen[o.id] === undefined) f.orderSeen[o.id] = activeClock;
    const ok = Object.entries(o.items).every(([id, q]) => f.have(id) >= q);
    if (ok) { f.deliver(slot, o, x.rev); continue; }
    if (slot !== "special" && activeClock - f.orderSeen[o.id] > STALE_ORDER_MS) f.cancel(slot, o, x.rev);
  }
}

// ---------------- máy ----------------
function recipeOk(f, r, m) { return f.s.level >= r.level && m.level >= r.machineLevel; }
function inputsFree(f, r, reserved, times = 1) {
  return Object.entries(r.inputs).every(([id, q]) => f.have(id) - (reserved[id] || 0) >= q * times);
}
/** Giá trị cộng thêm mỗi phút máy khi bán ở giá gốc. */
export const valueAddPerMin = (r) => (base(r.output) * r.qty - Object.entries(r.inputs).reduce((t, [id, q]) => t + base(id) * q, 0)) / (r.ms / 60_000);

function runMachines(f, need) {
  const s = f.s, ctx = f.prodCtx();
  const queued = queuedOutputs(f);
  // nguyên liệu thô mà đơn đang cần trực tiếp thì không đem chế biến (trừ khi để làm món đơn cần)
  const reservedRaw = {};
  for (const [id, q] of Object.entries(need)) if (!RECIPES.some((r) => r.output === id)) reservedRaw[id] = q;
  for (const [mid, m] of Object.entries(s.production.machines)) {
    if (f.now < m.readyAt) continue;
    for (let guard = 0; guard < 6 && m.queue.length < P.capacity(m, ctx); guard++) {
      let best = null, bestScore = 0;
      for (const r of RECIPES) {
        if (r.machine !== mid || !recipeOk(f, r, m) || !inputsFree(f, r, reservedRaw)) continue;
        const stock = f.have(r.output) + (queued[r.output] || 0);
        let score = 0;
        if ((need[r.output] || 0) > stock) score = 1000;
        else if (r.output === FEED && f.s.animals.list.length && stock < feedNeedPerCycle(f) * 3) score = 900;
        else if (r.output === "bot-gao" && machineReady(f, "lo-banh") && stock < 2) score = 800;
        else if (r.output === FEED || r.output === "bot-gao") score = 0; // không làm dư để bán (lời thấp)
        else score = valueAddPerMin(r) > 0 ? valueAddPerMin(r) : 0;
        if (score > bestScore) { best = r; bestScore = score; }
      }
      if (!best) break;
      if (f.enqueue(mid, best.id).err) break;
      queued[best.output] = (queued[best.output] || 0) + best.qty;
    }
  }
}

// ---------------- vật nuôi ----------------
function tendAnimals(f) {
  if (f.s.animals.list.some((a) => A.stateOf(a, f.now) === "hungry") && f.have(FEED) > 0) f.feedAll();
}

// ---------------- bán ----------------
function sellSurplus(f, force = false, need = demandOf(f)) {
  const s = f.s, keep = keepOf(f, need);
  const pressure = force || f.used() >= f.cap() * 0.7 || Object.keys(s.overflow).length > 0;
  const broke = s.coins < 30;
  const ids = new Set([...Object.keys(s.inv), ...Object.keys(s.overflow)]);
  for (const id of ids) {
    if (!(base(id) > 0)) continue;
    const excess = f.have(id) - (keep[id] || 0);
    if (excess <= 0) continue;
    const price = MARKET.priceOf(id, f.now);
    const good = price >= base(id) * 0.97;
    if (good || pressure || broke || ITEM[id].cat === "nong-san" && price >= base(id) * 0.9) f.sell(id, Math.min(excess, 999));
  }
}

// ---------------- xây / mua ----------------
function shopPrice(id) { return MARKET.shop[id]?.buy ?? Infinity; }
function matsGap(f, mats) {
  let cost = 0;
  for (const [id, q] of Object.entries(mats || {})) {
    const miss = Math.max(0, q - f.have(id));
    if (miss) { if (!(f.s.level >= (MARKET.shop[id]?.level ?? Infinity))) return Infinity; cost += miss * shopPrice(id); }
  }
  return cost;
}
function buyMats(f, mats) {
  for (const [id, q] of Object.entries(mats || {})) { const miss = q - f.have(id); if (miss > 0 && f.buy(id, miss).err) return false; }
  return true;
}

/** Danh sách ưu tiên (thứ tự quan trọng). Mỗi mục { key, cost, mats, major, go() }. */
function plan(f) {
  const s = f.s, now = f.now, out = [];
  const lvl = s.level;
  const bStep = (id) => {
    if (B.isBusy(s, id, now)) return null;
    const st = B.nextStep(s, id, now);
    return st && lvl >= st.unlock ? st : null;
  };
  const building = (id, major, cond = true) => {
    const st = bStep(id);
    if (!st || !cond) return;
    const isNew = B.levelOf(s, id, now) === 0;
    out.push({ key: `${isNew ? "build" : "up"}:${id}@${st.level}`, cost: st.cost, mats: st.materials, major,
      go: () => (isNew ? f.build(id) : f.upgradeBuilding(id)) });
  };
  const xuongDone = B.isBuilt(s, "xuong", now);
  const machine = (id, major) => {
    const def = MACHINE[id];
    if (!xuongDone || s.production.machines[id] || lvl < def.unlock) return;
    if (def.requires && !f.builtIds().includes(def.requires)) return;
    out.push({ key: `machine:${id}`, cost: def.buildCost, mats: {}, major, go: () => f.buildMachine(id) });
  };
  const animals = (kind) => {
    const cap = f.animalCtx().capacity(kind), n = animalCounts(f)[kind];
    if (n < cap && lvl >= ANIMAL[kind].level && s.production.machines["coi-xay"]) {
      out.push({ key: `animal:${kind}`, cost: ANIMAL[kind].buy, mats: {}, major: false, go: () => f.buyAnimal(kind) });
    }
  };
  const plot = () => {
    if (lvl < 2) return;
    const i = s.plots.findIndex((p, k) => k < 25 && plots.canBuy(s, k));
    if (i >= 0) out.push({ key: "plot", cost: plots.plotCost(s), mats: {}, major: false, go: () => f.buyPlot(i) });
  };
  const wh = B.levelOf(s, "nha-kho", now);
  const fill = f.used() / f.cap();

  building("nha-kho", true, wh === 0 || wh === 1);   // xây + nâng mốc 90 (nhiệm vụ hướng dẫn)
  if (s.bought < 3) plot();
  building("xuong", true);
  machine("coi-xay", true);
  building("chuong-ga", true);
  animals("ga");
  machine("lo-banh", true);
  if (s.bought < 8) plot();
  building("chuong-bo", true);
  animals("bo");
  building("nha-kinh", true);
  machine("may-bo-sua", true);
  machine("noi-duong", true);
  if (wh >= 2 && fill > 0.75) building("nha-kho", true);
  if (lvl >= 16) { const m = s.production.machines["lo-banh"]; if (m && m.level < 2 && now >= m.readyAt) out.push({ key: "mup:lo-banh", cost: MACHINE["lo-banh"].upgrades[0].cost, mats: {}, major: true, go: () => f.upgradeMachine("lo-banh") }); }
  building("xuong", true);           // nâng Xưởng cấp 2 (cấp 13)
  building("dat-phia-dong", true);
  plot();
  // nâng máy khi máy hay đầy hàng chờ
  for (const [id, m] of Object.entries(s.production.machines)) {
    const u = P.nextUpgrade(s.production, id);
    if (u && now >= m.readyAt && m.queue.length >= P.capacity(m, f.prodCtx()) - 0) out.push({ key: `mup:${id}`, cost: u.cost, mats: {}, major: false, go: () => f.upgradeMachine(id) });
  }
  building("chuong-ga", false);
  building("chuong-bo", false);
  building("nha-kinh", false);
  return out;
}

function buildAndBuy(f) {
  const s = f.s;
  const openPlots = s.plots.filter((p) => p.open).length;
  const reserve = Math.min(80, openPlots * 6);
  let target = null;
  for (const it of plan(f)) {
    const mcost = matsGap(f, it.mats);
    if (!Number.isFinite(mcost)) { if (it.major && !target) target = it; continue; }
    const total = it.cost + mcost;
    if (target && total > Math.max(40, target.cost * 0.15)) continue;
    if (s.coins - total >= reserve || (it.key.startsWith("build:nha-kho") && s.coins >= total)) {
      if (mcost && !buyMats(f, it.mats)) continue;
      const r = it.go();
      if (r?.err && it.major && !target) target = it;
    } else if (it.major && !target) target = it;
  }
  f.savingFor = target?.key || null;
}

// ---------------- gieo ----------------
/** Lúc sẽ thu nếu gieo cây c bây giờ (đã tưới ngay). */
function harvestAt(f, c, t) {
  const g = Math.round(c.growMs * plots.WATER_FACTOR);
  const ready = f.now + g;
  if (ready <= t.lastCheck) return f.now + Math.ceil(g / t.checkMs) * t.checkMs;
  return Math.max(ready, t.nextStart);
}
function cropScore(f, c, t) {
  const dt = harvestAt(f, c, t) - f.now;
  return (c.sell - c.seed + XP_WORTH * c.xp) / Math.max(dt, 1);
}

function plantAll(f, t, need) {
  const s = f.s;
  const empty = s.plots.map((p, i) => [p, i]).filter(([p]) => p.open && !p.crop).map(([, i]) => i);
  if (!empty.length) return;
  const growing = {};
  for (const p of s.plots) if (p.crop) growing[p.crop] = (growing[p.crop] || 0) + 1;
  // muốn: thiếu cho đơn + nguyên liệu máy
  const want = {};
  const addWant = (id, n) => { if (n > 0 && cropOk(s, id)) want[id] = (want[id] || 0) + n; };
  const queued = queuedOutputs(f);
  for (const [id, q] of Object.entries(need)) {
    if (CROP[id]) addWant(id, q - f.have(id));
    else {
      const r = RECIPES.find((x) => x.output === id);
      const lack = q - f.have(id) - (queued[id] || 0);
      if (r && lack > 0) for (const [inp, k] of Object.entries(r.inputs)) if (CROP[inp]) addWant(inp, k * Math.ceil(lack / r.qty) - f.have(inp));
    }
  }
  if (machineReady(f, "coi-xay") && s.animals.list.length) {
    const feedLack = feedNeedPerCycle(f) * 3 - f.have(FEED) - (queued[FEED] || 0);
    if (feedLack > 0) addWant("ngo", Math.ceil(feedLack / 3) * 2 - f.have("ngo"));
  }
  if (machineReady(f, "lo-banh") && s.level >= 6 && f.have("bot-gao") + (queued["bot-gao"] || 0) < 2) addWant("lua", 4 - f.have("lua"));
  if (machineReady(f, "noi-duong")) addWant("mia", 4 - f.have("mia"));
  if (machineReady(f, "bep-sen")) {
    const m = s.production.machines["bep-sen"], free = P.capacity(m, f.prodCtx()) - m.queue.length;
    if (free > 0 && s.level >= 2) addWant("dau-tay", 3 * free - f.have("dau-tay"));
  }
  const cap = Math.ceil(empty.length * 0.6);
  let used = 0;
  const list = [...empty];
  // Mía chỉ gieo ở ô nhà kính (plots.js không chặn — xem báo cáo), cây khác ưu tiên ô ruộng.
  for (const [id, n0] of Object.entries(want)) {
    let n = n0 - (growing[id] || 0);
    while (n > 0 && list.length && used < cap) {
      const k = list.findIndex((i) => (CROP[id].requires ? s.plots[i].gh : true));
      if (k < 0) break;
      const i = list[k];
      if (!f.plant(i, id).ok) break;
      list.splice(k, 1); used++; n--;
    }
  }
  const options = CROPS.filter((c) => cropOk(s, c.id));
  for (const i of list) {
    const p = s.plots[i];
    const ranked = options.filter((c) => !(c.requires && !p.gh) && c.seed <= s.coins || (c.id === "ca-rot" && s.freeSeeds > 0))
      .sort((a, b) => cropScore(f, b, t) - cropScore(f, a, t));
    for (const c of ranked) { if (f.plant(i, c.id).ok) break; }
  }
}

function waterAll(f) {
  const s = f.s;
  for (let i = 0; i < s.plots.length; i++) { const p = s.plots[i]; if (p.crop && !p.watered && !plots.isReady(p, f.now)) f.water(i); }
}

/** Một lần nhìn màn hình. t = { checkMs, lastCheck, nextStart, activeClock }. Trả { useful, blocked, broke }. */
export function tick(f, now, t) {
  f.sync(now);
  f.useful = 0;
  const info = { blocked: null, broke: false };
  collectAll(f, info);
  claimAll(f);
  deliverOrders(f, t.activeClock);
  let need = demandOf(f);
  runMachines(f, need);
  tendAnimals(f);
  sellSurplus(f, false, need);
  buildAndBuy(f);
  need = demandOf(f);
  plantAll(f, t, need);
  waterAll(f);
  claimAll(f);
  const s = f.s;
  const emptyOpen = s.plots.some((p) => p.open && !p.crop);
  if (emptyOpen && s.freeSeeds === 0 && s.coins < 2) info.broke = true;
  info.useful = f.useful;
  return info;
}
