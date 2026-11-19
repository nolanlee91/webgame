// TRANG THỬ NỘI BỘ (dev-only, không liên kết, noindex) cho cảnh Milestone 4 — không đụng game.js / apply.js.
// Dựng một trạng thái thật trong bộ nhớ (core/animals.js + core/village.js + core/inventory.js bag()), một exec() tối giản
// dùng chính handler sẽ ghép vào apply() (core/m4-handlers.js), chạy trên bản nháp (lỗi ⇒ không đổi gì), và đồng hồ tua được.
// window.__m4 = { s, exec, travel(ms), now(), dev, scenes } cho test tự động qua CDP.
import { bag, wallet } from "../core/inventory.js?v=m5";
import { bindM4, m4Sync, m4Track, m4InvariantError, ensureM4 } from "../core/m4-handlers.js?v=m5";
import { TUTORIAL } from "../data/quests.js?v=m5";
import { createAnimalsScene } from "./scene-animals.js?v=m5";
import { createVillageScene } from "./scene-village.js?v=m5";
import { createTruck } from "./truck.js?v=m5";
import { makeToast, fmtNum } from "./m4-art.js?v=m5";

const MAX_LEVEL = 20, xpNeed = (lv) => 60 * lv * lv;
function addXp(s, n, ev) {
  s.xp += Math.max(0, Math.floor(n));
  while (s.level < MAX_LEVEL && s.xp >= xpNeed(s.level)) { s.xp -= xpNeed(s.level); s.level++; ev.push({ type: "levelUp", level: s.level }); }
  if (s.level >= MAX_LEVEL) s.xp = Math.min(s.xp, xpNeed(MAX_LEVEL));
}
const deps = { bag, wallet, addXp };
const H = bindM4(deps);

let offset = 0;
const now = () => Date.now() + offset;

function fresh(t) {
  const s = {
    level: 9, xp: 0, coins: 600, seed: 12345, warehouse: 2, inv: { "thuc-an-gia-suc": 3 }, overflow: {}, decor: {},
    buildings: { "chuong-ga": { level: 1, done: true, startAt: t, readyAt: t } },
    quests: { tut: TUTORIAL.length, progress: 0 }, stats: { harvested: 0, earned: 0, delivered: 0 },
  };
  return ensureM4(s, {}, t);
}
let s = fresh(now());

const ERR = {
  coins: "Không đủ xu.", locked: "Chưa đủ cấp.", "no-housing": "Cần xây chuồng trước.", capacity: "Chuồng đã đầy.", feed: "Hết thức ăn gia súc.",
  "not-hungry": "Con này đang no.", "not-ready": "Chưa chín.", full: "Kho đầy.", none: "Không có con nào cần làm.", "not-found": "Không thấy con này.",
  "quest-incomplete": "Nhiệm vụ chưa xong.", "quest-claimed": "Đã nhận rồi.", "give-stock": "Chưa đủ hàng để trao.", bad: "Không làm được.",
};
const toast = makeToast(null);

/** apply() tối giản: sync → handler → track trên bản nháp; lỗi / sai bất biến ⇒ không đổi gì. */
function apply(state, action, t) {
  const h = H[action?.type];
  if (!h) return { err: "bad-action", events: [] };
  const d = structuredClone(state), ev = [];
  m4Sync(d, t, ev);
  const r = h(d, action, t, ev);
  if (!r || r.err) return { err: r?.err || "bad", events: [] };
  m4Sync(d, t, ev);
  m4Track(d, ev, t);
  const bad = m4InvariantError(d) || (d.coins < 0 ? "coins" : null) || (Object.values(d.inv).some((q) => !Number.isInteger(q) || q < 0) ? "count" : null);
  if (bad) return { err: "invariant-" + bad, events: [] };
  s = d;
  return { ok: true, events: ev, result: r };
}

const log = [];
let animals, village, truck;
function exec(action, origin = {}) {
  const r = apply(s, action, now());
  log.push({ action, err: r.err || null, events: r.events.map((e) => e.type) });
  if (r.err) {
    toast(animals.errorText?.(r.err) || village.errorText?.(r.err) || ERR[r.err] || "Không làm được (" + r.err + ").");
  } else {
    const lv = r.events.find((e) => e.type === "levelUp");
    if (lv) toast(`Lên cấp ${lv.level}!`);
    animals.onEvents(r.events, origin);
    village.onEvents(r.events, origin);
    if (r.events.some((e) => e.type === "delivered")) truck.kick();
  }
  renderAll();
  return r;
}
/** Tick: chỉ đồng bộ làng (lấp bảng) — trạng thái vật nuôi suy ra từ thời gian. */
function tick() {
  const ev = [];
  const d = structuredClone(s);
  m4Sync(d, now(), ev);
  m4Track(d, ev, now());
  s = d;
  if (ev.length) village.onEvents(ev, {});
}

const host = document.getElementById("m4main");
const sceneCtx = {
  get s() { return s; }, now, exec, host, toast,
  sfx: () => {}, // trang thử: im lặng
};
animals = createAnimalsScene(sceneCtx);
village = createVillageScene(sceneCtx);
truck = createTruck(document.getElementById("truckBox"), { now, lastDeliveryAt: () => s.lastDeliveryAt, level: () => s.level, width: 420, height: 120 });

let scene = "animals";
function go(name) {
  scene = name;
  for (const b of document.querySelectorAll("[data-scene]")) b.setAttribute("aria-pressed", String(b.dataset.scene === name));
  if (name === "animals") { village.hide(); animals.show(); } else { animals.hide(); village.show(); }
}
document.querySelector(".nav").addEventListener("click", (e) => { const b = e.target.closest("[data-scene]"); if (b) go(b.dataset.scene); });

// ---------- công cụ dev ----------
const lvSel = document.getElementById("devLevel");
lvSel.innerHTML = Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
lvSel.onchange = () => { s.level = Number(lvSel.value); s.xp = 0; tick(); renderAll(); };
const devEvent = (events) => { // sự kiện giả từ phần game khác (ruộng, Xưởng, đơn) để thử nhiệm vụ làng
  const d = structuredClone(s), ev = [...events];
  m4Sync(d, now(), ev); m4Track(d, ev, now()); s = d;
  village.onEvents(ev, {});
  if (ev.some((e) => e.type === "delivered")) truck.kick();
  renderAll();
};
const DEV = {
  t: (b) => travel(Number(b.dataset.ms)),
  more: (b) => { const m = document.getElementById("devMore"); m.hidden = !m.hidden; b.setAttribute("aria-expanded", String(!m.hidden)); },
  coins: () => { s.coins += 500; renderAll(); },
  feed: () => { s.inv["thuc-an-gia-suc"] = (s.inv["thuc-an-gia-suc"] || 0) + 10; renderAll(); },
  goods: () => { for (const [id, n] of [["banh-trung", 3], ["sua", 4], ["bot-gao", 2], ["lua", 6]]) s.inv[id] = (s.inv[id] || 0) + n; renderAll(); },
  coop: () => { const b = s.buildings["chuong-ga"]; s.buildings["chuong-ga"] = { level: b ? Math.min(3, b.level + 1) : 1, done: true, startAt: now(), readyAt: now() }; tick(); renderAll(); },
  barn: () => { const b = s.buildings["chuong-bo"]; s.buildings["chuong-bo"] = { level: b ? Math.min(2, b.level + 1) : 1, done: true, startAt: now(), readyAt: now() }; tick(); renderAll(); },
  tut: (b) => { const done = s.quests.tut >= TUTORIAL.length; s.quests.tut = done ? 0 : TUTORIAL.length; b.setAttribute("aria-pressed", String(!done)); tick(); renderAll(); },
  ev: (b) => devEvent({
    harvest: Array.from({ length: 20 }, () => ({ type: "harvested", crop: "lua" })),
    deliverEgg: [{ type: "delivered", orderType: "ket-hop", npc: "bac-tu", items: { "trung-ga": 2, "banh-trung": 1 } }],
    job: Array.from({ length: 5 }, () => ({ type: "jobCollected", machine: "coi-xay", item: "bot-gao", qty: 1 })),
    sell: [{ type: "sold", count: 25, items: { "ca-chua": 25 } }],
  }[b.dataset.ev] || []),
  reset: () => { offset = 0; s = fresh(now()); tick(); renderAll(); },
};
document.querySelector(".dev-bar").addEventListener("click", (e) => { const b = e.target.closest("[data-dev]"); if (b) DEV[b.dataset.dev]?.(b); });

function travel(ms) { offset += ms; tick(); renderAll(); }
function renderAll() {
  const d = new Date(now());
  document.getElementById("devClock").textContent = `Giờ thử: ${d.toLocaleTimeString("vi-VN")}${offset ? ` (+${Math.round(offset / 60000)} ph)` : ""}`;
  document.getElementById("devStat").textContent = `Cấp ${s.level} · ${fmtNum(s.coins)} xu · ${s.xp}/${xpNeed(s.level)} XP · kho: ${Object.entries(s.inv).map(([k, v]) => `${k} ${v}`).join(", ") || "trống"}`;
  lvSel.value = String(s.level);
  animals.render(); village.render(); truck.kick();
}

tick();
go(location.hash === "#lang" ? "village" : "animals");
renderAll();
setInterval(() => { if (!document.hidden) { document.getElementById("devClock").textContent = new Date(now()).toLocaleTimeString("vi-VN") + (offset ? ` (+${Math.round(offset / 60000)} ph)` : ""); } }, 1000);

window.__m4 = {
  get s() { return s; }, set s(v) { s = v; renderAll(); }, exec, travel, now, dev: DEV, devEvent, go, log,
  scenes: { animals, village, truck },
};
