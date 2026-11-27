// Nông Trại — giao diện (DOM + canvas nhỏ mỗi ô), điều khiển (chạm / chuột / phím), lưu tiến trình, âm thanh.
// Luật ở core/ (qua logic.js); mọi thay đổi trạng thái đi qua L.apply(state, action, now) trong run().
import * as L from "./logic.js?v=m16";
import { shortNum } from "./ui/short-num.js?v=m16"; // TLC12-04
import { browserStorage, farmSave } from "./save.js?v=m16";
import { createWorkshopScene } from "./ui/scene-workshop.js?v=m16";
import { createMarketScene } from "./ui/scene-market.js?v=m16";
import { loadSprites, playFx, frame as spriteFrame, sheet as spriteSheet } from "./ui/sprites.js?v=m16";
import { createFarmMap, spriteCss, STATUS_TEXT, resolveSprite, GARDEN } from "./ui/farm-map.js?v=m16";
import { createAnimalsScene } from "./ui/scene-animals.js?v=m16";
import { createVillageScene } from "./ui/scene-village.js?v=m16";
import { createTruck } from "./ui/truck.js?v=m16";
import { farmShare } from "./ui/share-card.js?v=m16";
import { shareResult } from "../_shared/share.js?v=s3";

const MUTE_KEY = "wgp.muted";
const CEL_KEY = "wgp.nongtrai.cards"; // m7: thẻ chúc mừng đã xem (khoá riêng, không thuộc bản lưu)
const STAGE_COL = { seed: 0, sprout: 1, grow: 2, mature: 3, ready: 4 };
const STAGE_SCALE = { seed: 0.4, sprout: 0.55, grow: 0.7, mature: 0.85, ready: 1 }; // cây chưa có atlas: vẽ icon theo cỡ
const ATLAS_CELL = 80, ICON_CELL = 64;
const atlas = new Image(), atlas2 = new Image(), icons = new Image();
const ART = {
  onReady: null,
  draw(canvas, key) {
    const g = canvas.getContext("2d");
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (!key) return;
    const [crop, stage] = key.split(":");
    const c = L.CROP[crop];
    if (!c) return;
    g.imageSmoothingEnabled = false;
    if (c.atlasRow !== null) {
      const im = c.atlas === "crops-2" ? atlas2 : atlas;
      if (!im.complete || !im.naturalWidth) return;
      g.drawImage(im, STAGE_COL[stage] * ATLAS_CELL, c.atlasRow * ATLAS_CELL, ATLAS_CELL, ATLAS_CELL, 0, 0, canvas.width, canvas.height);
    } else {
      const cell = L.iconCell(crop);
      if (!cell || !icons.complete || !icons.naturalWidth) return;
      const k = STAGE_SCALE[stage] || 1, w = canvas.width * 0.8 * k;
      g.drawImage(icons, cell.col * ICON_CELL, cell.row * ICON_CELL, ICON_CELL, ICON_CELL, (canvas.width - w) / 2, canvas.height * 0.92 - w, w, w);
    }
  },
};
let pending = 3;
const loaded = () => { if (--pending <= 0) ART.onReady?.(); };
atlas.onload = atlas2.onload = icons.onload = loaded;
atlas.onerror = atlas2.onerror = icons.onerror = loaded;
atlas.src = new URL("assets/garden/crops.webp", import.meta.url).href;
icons.src = new URL("assets/v3/items.webp", import.meta.url).href;
atlas2.src = new URL("assets/v3/crops-2.webp", import.meta.url).href;

// ---------- âm thanh ----------
function makeSfx(dir, names, sdk) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const buf = {}, log = [];
  let ac = null;
  if (AC) {
    try { ac = new AC(); } catch { ac = null; }
    if (ac) for (const n of names) {
      fetch(new URL(dir + n + ".ogg", import.meta.url)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((b) => ac.decodeAudioData(b)).then((d) => { buf[n] = d; })
        .catch(() => console.warn("Không tải được âm thanh " + n + ".ogg"));
    }
  }
  const muted = () => !!(sdk.sound && sdk.sound.muted);
  return {
    play(n, vol = 1, rate = 1) {
      log.push({ n, t: Math.round(performance.now()) }); if (log.length > 300) log.shift();
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; s.playbackRate.value = rate; gn.gain.value = vol; s.connect(gn).connect(ac.destination); s.start();
      return true;
    },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

const fmtNum = (n) => n.toLocaleString("vi-VN");
export { farmShare }; // giữ chỗ export cũ (thân hàm chuyển sang ui/share-card.js để test Node)
function fmtLeft(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  if (t < 60) return t + " giây";
  if (t < 3600) { const m = Math.floor(t / 60), s = t % 60; return m + ":" + String(s).padStart(2, "0"); }
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60); return h + " giờ " + m + " phút";
}
/** Đồng hồ gọn: 0:20, 7:45, 1:05:00. */
function fmtClock(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
function fmtGrow(ms) { const t = ms / 1000; return t < 60 ? t + " giây" : fmtNum(t / 60) + " phút"; }
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ERR = {
  coins: "Chưa đủ xu.", level: "Chưa đủ cấp để trồng cây này.", locked: "Ô này chưa mở.", far: "Chỉ mở được ô cạnh ruộng đang có.",
  "plots-level": "Lên cấp 2 để mở thêm ô đất.", growing: "Cây chưa chín.", watered: "Cây này đã tưới rồi.",
  "empty-stock": "Kho chưa có hàng để bán.", "none-ready": "Chưa có ô nào chín.",
  "basket-full": "Kho và giỏ tràn đều đầy! Bán bớt hoặc nâng kho rồi thu tiếp.", "basket-empty": "Giỏ tràn đang trống.",
  "upgrade-level": "Bạn chưa đủ cấp để nâng cấp.", upgraded: "Đã hoàn thành mọi nâng cấp.",
  "warehouse-level": "Chưa đủ cấp để nâng kho.", "warehouse-max": "Nhà kho đã ở mức lớn nhất.", materials: "Chưa đủ vật liệu để nâng kho.",
  "order-stock": "Kho chưa đủ hàng để giao đơn này.", "order-changed": "Đơn này đã đổi. Hãy xem đơn mới.", "order-expired": "Đơn này đã hết hạn.",
  "quest-incomplete": "Nhiệm vụ chưa xong.", "quest-claimed": "Đã nhận thưởng nhiệm vụ này.",
  "greenhouse-only": "Mía chỉ trồng được trong Nhà kính.", greenhouse: "Cây trong Nhà kính không cần tưới.",
  "book-incomplete": "Sổ sưu tập chưa đủ món cho mốc này.", "book-claimed": "Đã nhận thưởng mốc này rồi.",
};
/** Lỗi xây dựng / trang trí (Milestone 3). */
const ERR_M3 = {
  locked: "Chưa đủ cấp.", built: "Công trình này đã xây rồi.", "not-built": "Cần xây công trình trước.", building: "Đang xây, chờ chút nhé.",
  max: "Đã nâng tối đa.", coins: "Chưa đủ xu.", materials: "Chưa đủ vật liệu (ván gỗ / hộp đinh / thùng sơn).", milestone: "Công trình này mở trong bản cập nhật sau.",
  "not-buildable": "Không xây được ở đây.", slot: "Ô trang trí này chưa mở.", "slot-taken": "Ô này đã có đồ trang trí.", "slot-empty": "Ô này đang trống.",
  "slot-size": "Đồ này cần ô lớn.", "no-decor": "Túi trang trí không còn món này.", "bag-full": "Túi trang trí đã đầy.", bad: "Không làm được.",
};
const M3_ACTIONS = new Set(["startBuild", "startUpgrade", "placeDecor", "removeDecor"]);
/** Lỗi của Xưởng / chợ (Milestone 2) — cùng mã "locked" nhưng nghĩa là chưa đủ cấp. */
const ERR_M2 = {
  locked: "Chưa đủ cấp.", "workshop-level": "Chưa đủ cấp — Xưởng mở ở cấp 4, nâng Xưởng cấp 2 ở cấp 13.", built: "Đã xây rồi.",
  "no-workshop": "Cần xây xong Xưởng chế biến trước.", "not-built": "Máy này chưa xây.", building: "Đang xây, chờ chút nhé.",
  inputs: "Thiếu nguyên liệu.", "queue-full": "Hàng chờ đã đầy — nâng máy để thêm ô.", "not-ready": "Mẻ này chưa xong.",
  "not-found": "Ô này đã được nhận rồi.", full: "Kho và giỏ tràn đều đầy — bán bớt rồi nhận tiếp.", max: "Đã nâng tối đa.",
  "machine-level": "Cần nâng máy lên cấp cao hơn.", "plant-only": "Hạt giống trả tiền lúc gieo ở ô đất.", "bad-count": "Số lượng không hợp lệ.",
  "empty-stock": "Không còn hàng này để bán.", requires: "Cần công trình khác trước.", bad: "Không làm được.",
};
const M2_ACTIONS = new Set(["buildWorkshop", "upgradeWorkshop", "buildMachine", "upgradeMachine", "enqueue", "collect", "collectAll", "marketSell", "marketBuy"]);
/** Lỗi chăn nuôi / làng (Milestone 4) — cảnh tự có errorText(code) cho vài mã, còn lại ở đây. */
const ERR_M4 = {
  locked: "Chưa đủ cấp.", "no-housing": "Cần xây chuồng trước (nút Xây trên bản đồ).", capacity: "Chuồng đã đầy — nâng chuồng để thêm chỗ.", coins: "Chưa đủ xu.",
  feed: "Hết thức ăn gia súc — Cối xay: 2 ngô → 3 bao, hoặc mua ở Khu chợ.", "not-hungry": "Con này đang no.", "not-ready": "Chưa có gì để thu.",
  "not-found": "Không thấy con vật này.", none: "Không con nào đang đói.", full: "Kho và giỏ tràn đều đầy — bán bớt rồi thu tiếp.",
  "give-stock": "Chưa đủ hàng để trao.", "quest-incomplete": "Nhiệm vụ chưa xong.", "quest-claimed": "Đã nhận thưởng nhiệm vụ này.", bad: "Không làm được.",
};
const M4_ACTIONS = new Set(["buyAnimal", "feedAnimal", "feedAll", "collectAnimal", "collectAllAnimals", "talkNpc", "claimProgressQuest", "claimChainStep", "claimBoardQuest"]);
/** Cấp mở Khu chăn nuôi (gà, data/animals.js). */
const ANIMALS_LEVEL = Math.min(...L.ANIMALS.map((a) => a.level));
const npcOf = (id) => L.NPC[id] || L.NPCS[0];
/** Icon vật phẩm từ assets/v3/items.webp (CSS background-position, nearest-neighbour). */
function iconHtml(id, cls = "") {
  const c = L.iconCell(id);
  if (!c) return "";
  // Milestone 6: icon items-2.webp khi manifest đã có frame cùng tên (Codex), chưa có ⇒ ô dự phòng items.webp + bộ lọc màu
  if (c.hd && spriteFrame("items-2", id)) return `<i class="it it--items2 ${cls}" style="--c:${c.hd.col};--r:${c.hd.row}" aria-hidden="true"></i>`;
  return `<i class="it${c.sheet === "decor" ? " it--decor" : ""} ${cls}" style="--c:${c.col};--r:${c.row}${c.filter ? `;filter:${c.filter}` : ""}" aria-hidden="true"></i>`;
}
function faceHtml(npcId, cls = "") {
  const n = npcOf(npcId);
  return n.portrait
    ? `<span class="face ${cls}" style="--c:${n.portrait.col};--r:${n.portrait.row}${n.portrait.sheet ? `;background-image:url(assets/v3/${n.portrait.sheet}.webp)` : ""}" aria-hidden="true"></span>`
    : `<span class="face face--badge ${cls}" style="--npc:${n.color}" aria-hidden="true">${esc(n.initial)}</span>`;
}

export function mount(root, ctx = {}) {
  let lastPanSig = "", panRaf = 0; // nút cuộn bản đồ (placePan): chữ ký lần đặt trước + khung hình đã hẹn
  const sdk = ctx.sdk || { sound: { muted: false } };
  const now = ctx.now || (() => Date.now());
  const storage = ctx.storage ?? browserStorage();
  const save = farmSave(storage);
  const $ = (id) => document.getElementById(id);
  // bản đồ (Milestone 3) dựng trước để các nút công trình có id cũ (#workshopLot, #market, #boardBtn) tồn tại khi gom ui
  const fmap = createFarmMap({ L, farm: $("farm"), map: $("farmMap"), esc, fmtClock, onTap: (id, el) => bldTap(id, el), onSlot: (id, el) => slotTap(id, el) });
  const ui = {
    field: $("field"), seeds: $("seeds"), coins: $("hCoins"), level: $("hLevel"), xp: $("hXp"), xpTxt: $("hXpTxt"),
    store: $("hStore"), over: $("hOver"), storeBar: $("hStoreBar"), storeStat: $("hStoreStat"), plots: $("hPlots"), all: $("allBtn"), mute: $("muteBtn"), muteIc: $("muteIc"),
    help: $("helpBtn"), ovHelp: $("ovHelp"), helpOk: $("helpOk"), toast: $("toast"),
    farm: $("farm"), warehouse: $("warehouse"), whBody: $("whBody"), upgrades: $("upgrades"), orders: $("ordersPanel"), slips: $("slips"),
    upgrade: $("upgradeBuy"), upgradeInfo: $("upgradeInfo"), sell: $("sellAll"),
    water: $("waterTool"), grow: $("seedTool"), depot: $("stockTool"), orderTool: $("ordersTool"), sellTool: $("sellTool"), improve: $("upgradeTool"),
    market: $("market"), board: $("boardBtn"), boardBadge: $("boardBadge"),
    lot: $("workshopLot"), lotTag: $("lotTag"), lotBar: $("lotBar"), wsBadge: $("wsBadge"), wsTool: $("workshopTool"), mkTool: $("marketTool"),
    ovBuild: $("ovBuild"), buildBody: $("buildBody"), buildOk: $("buildOk"), buildCancel: $("buildCancel"), buildEnter: $("buildEnter"), buildTitle: $("buildTitle"),
    buildBtn: $("buildBtn"), buildBar: $("buildBar"), pan: $("panBtn"), buildExit: $("buildExit"), fieldEast: $("fieldEast"),
    ovDecor: $("ovDecor"), decorBody: $("decorBody"), ovGh: $("ovGreenhouse"), ghSeeds: $("ghSeeds"), ghGrid: $("ghGrid"), ghNote: $("ghNote"), ghClose: $("ghClose"),
    animalsTool: $("animalsTool"), villageTool: $("villageTool"), truckLane: $("truckLane"), farmMap: $("farmMap"),
    coopBadge: $("coopBadge"), barnBadge: $("barnBadge"), villageBadge: $("villageBadge"),
    bookBtn: $("bookBtn"), ovBook: $("ovBook"), bookBody: $("bookBody"),
    quest: $("quest"), qFace: $("qFace"), qStep: $("qStep"), qTitle: $("qTitle"), qHint: $("qHint"), qBar: $("qBar"), qProg: $("qProg"), qReward: $("qReward"), qClaim: $("qClaim"),
  };
  // D4 (TLC1-05): bố cục điện thoại dọc (khay dính đáy) — khớp media query trong index.html
  const PORTRAIT = matchMedia("(max-width: 760px) and (orientation: portrait), (max-width: 760px) and (min-height: 501px)");
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-kim-cuong", "qua-man", "trung-da", "thang"], sdk);

  const first = save.initialize(now()); // di chuyển v2 → v3 (giữ backup) nếu cần
  let s = save.read(now()).state;
  const fresh = first.fresh, migrated = first.migrated;
  let mode = "seed", pick = L.FIELD_CROPS[0].id, cursor = 12, confirmAt = -1, confirmT = 0, toastT = 0, tickTimer = 0, secTimer = 0;
  let cancelArm = null, cancelT = 0, rewardTimer = 0, scene = "farm", lastFinished = 0, workshop = null, market = null, animals = null, village = null, truck = null;
  let buildMode = false, cardFor = null, decorFor = null, ghPick = "mia";
  // m7 — thẻ chúc mừng công trình: sổ "đã xem" ở khoá RIÊNG (không đổi bản lưu v7). Công trình / máy có level > level đã xem ⇒ thẻ chờ hiện
  // (kể cả xây xong lúc tắt game). Chỉ ghi "đã xem" khi người chơi đóng thẻ ⇒ tắt trang giữa chừng thì lần sau thẻ vẫn hiện.
  const CEL_BUILDINGS = L.BUILDINGS.filter((b) => ["build", "expansion", "prebuilt"].includes(b.kind)).map((b) => b.id);
  const CEL_MACHINES = L.MACHINES_NOW.filter((m) => !m.withWorkshop).map((m) => m.id); // Bếp sên đi kèm Xưởng ⇒ nằm trong thẻ Xưởng
  const machineLv = (id, t) => { const m = s.production?.machines?.[id]; return m && t >= m.readyAt ? m.level : 0; };
  function readSeen() {
    try { const o = JSON.parse(storage?.getItem(CEL_KEY) || "null"); if (o && o.v === 1 && o.b && o.m) return { v: 1, b: { ...o.b }, m: { ...o.m }, tip: { ...(o.tip || {}) } }; } catch {}
    return null;
  }
  function writeSeen() { try { storage?.setItem(CEL_KEY, JSON.stringify(seen)); } catch {} }
  let seen = readSeen();
  if (!seen) { // lần đầu có bản m7: coi mọi thứ đang có là đã xem (người chơi cũ không bị dồn thẻ)
    const t = now();
    seen = { v: 1, b: Object.fromEntries(CEL_BUILDINGS.map((id) => [id, L.levelOf(s, id, t)])), m: Object.fromEntries(CEL_MACHINES.map((id) => [id, machineLv(id, t)])), tip: {} };
    writeSeen();
  }
  let celCur = null, celHold = 0, celFocus = null, celReady = false; // celReady: DOM thẻ đã gom (render() có thể chạy sớm hơn)

  // ---------- dựng DOM ----------
  const cells = s.plots.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "plot"; b.dataset.i = i;
    const cv = document.createElement("canvas"); cv.width = cv.height = ATLAS_CELL;
    const lbl = document.createElement("span"); lbl.className = "lbl";
    const bar = document.createElement("span"); bar.className = "bar2"; const fill = document.createElement("i"); bar.append(fill);
    const drop = document.createElement("span"); drop.className = "drop"; drop.hidden = true;
    b.append(cv, lbl, bar, drop);
    b.addEventListener("click", () => { if (i < L.BASE_PLOTS) cursor = i; mutate(() => act(i)); });
    (i < L.BASE_PLOTS ? ui.field : i < L.GH_FIRST ? ui.fieldEast : ui.ghGrid).append(b);
    return { b, cv, lbl, bar, fill, drop, key: null };
  });
  const seedBtns = L.FIELD_CROPS.map((c, n) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "seed"; b.setAttribute("role", "radio"); b.dataset.id = c.id;
    const cv = document.createElement("canvas"); cv.width = cv.height = ATLAS_CELL;
    b.append(cv);
    b.insertAdjacentHTML("beforeend", `<b>${c.name}</b><small class="info"></small>`);
    b.title = `${c.name}: hạt ${c.seed} xu · chín sau ${fmtGrow(c.growMs)} · bán ${c.sell} xu (phím ${n + 1})`;
    b.addEventListener("click", () => choose(c.id));
    ui.seeds.append(b);
    return b;
  });
  ART.onReady = () => { for (const c of cells) c.key = undefined; L.FIELD_CROPS.forEach((k, n) => ART.draw(seedBtns[n].querySelector("canvas"), k.id + ":ready")); render(); };
  if (pending <= 0) ART.onReady();
  ui.qFace.outerHTML = faceHtml(L.QUEST_GIVER, "quest-face");

  // ---------- lưu ----------
  function persist() {
    if (!save.write(s, now())) toast("Trình duyệt không lưu được tiến trình.");
  }
  function mutate(action) {
    const p = save.exclusive(() => {
      const current = save.read(now());
      if (!current.fresh) s = current.state;
      action();
    });
    p?.catch?.((e) => { console.warn(e); toast("Chưa cập nhật được nông trại. Hãy thử lại."); });
  }
  /** Chạy một action qua luật. Lỗi ⇒ báo, không đổi gì. Gọi bên trong mutate(). */
  function run(action, origin) {
    const r = L.apply(s, action, now());
    if (r.err) { fail(r.err, action); render(); return null; }
    persist();
    feedback(r.events, origin);
    animals?.onEvents(r.events, origin); village?.onEvents(r.events, origin); // cảnh Milestone 4: hiệu ứng + toast riêng khi đang mở
    render();
    return r;
  }
  const exec = (action, origin) => mutate(() => run(action, origin));

  // ---------- hiển thị ----------
  function toast(text, ms = 2400, action = null) {
    ui.toast.textContent = text; ui.toast.hidden = false;
    if (action) { // nút nhỏ trong toast (vd "Khoe kết quả" khi lên cấp) — toast ở lâu hơn để kịp bấm
      const b = document.createElement("button"); b.type = "button"; b.className = "btn btn--sm btn--primary toast-act"; b.id = action.id || ""; b.textContent = action.label;
      b.addEventListener("click", () => { ui.toast.hidden = true; action.onClick(); });
      ui.toast.append(" ", b); ms = Math.max(ms, 7000);
    }
    clearTimeout(toastT); toastT = setTimeout(() => (ui.toast.hidden = true), ms);
  }
  function float(i, text, color) {
    const f = document.createElement("span");
    f.className = "float"; f.textContent = text; if (color) f.style.color = color;
    f.setAttribute("aria-hidden", "true");
    cells[i].b.append(f);
    setTimeout(() => f.remove(), 1000);
  }
  function plotEffect(i, kind) {
    const effect = document.createElement("span");
    effect.className = `plot-effect plot-effect--${kind}`;
    effect.setAttribute("aria-hidden", "true");
    for (const [x, y] of [[-17, -10], [-10, -21], [-3, -14], [5, -22], [12, -13], [18, -8]]) {
      const particle = document.createElement("i");
      particle.style.setProperty("--dx", `${x}px`);
      particle.style.setProperty("--dy", `${y}px`);
      effect.append(particle);
    }
    cells[i].b.querySelector(".plot-effect")?.remove();
    cells[i].b.append(effect);
    setTimeout(() => effect.remove(), 600);
  }
  function saleBurst(coins) {
    const reward = $("saleReward");
    reward.textContent = `+${fmtNum(coins)} xu`;
    reward.hidden = false;
    clearTimeout(rewardTimer);
    rewardTimer = setTimeout(() => { reward.hidden = true; }, 1000);
  }
  /** Chữ nổi tại (x, y) trong host (position: relative). */
  function floatAt(host, x, y, text, color) {
    const f = document.createElement("span");
    f.className = "float"; f.textContent = text; if (color) f.style.color = color;
    f.style.left = x + "px"; f.style.top = y + "px";
    f.setAttribute("aria-hidden", "true");
    host.append(f);
    setTimeout(() => f.remove(), 1000);
  }
  /** fx.webp tại phần tử bất kỳ (tính theo khung bản đồ / cảnh đang mở). */
  function fxOn(el, kinds, text, color, size = 64) {
    if (!el) return;
    const host = scene === "workshop" ? ui.wsRoot : scene === "market" ? ui.mkRoot : scene === "animals" ? animals.root : scene === "village" ? village.root : ui.farm;
    const r = el.getBoundingClientRect(), h = host.getBoundingClientRect();
    const x = r.left - h.left + r.width / 2, y = r.top - h.top + r.height / 2;
    for (const k of kinds) playFx(host, k, x, y, size);
    if (text) floatAt(host, x, y - 18, text, color);
  }
  function pulse(el) { if (!el) return; el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); }

  /** Mở khoá khi lên cấp (core/levels-map.js unlocksAt): chỉ món đã có trong bản hiện tại (milestone ≤ CURRENT_MILESTONE). */
  function unlockNames(level) {
    const u = L.mapUnlocksAt(level);
    const names = u.features.filter((f) => f.milestone <= L.CURRENT_MILESTONE).map((f) => f.name);
    for (const b of u.build) {
      const step = L.BUILDING[b.id].levels[b.toLevel - 1];
      if (b.action !== "upgrade" || step.feature || b.id === "xuong" || !L.inMilestone(b.id)) continue; // đã có trong danh sách tính năng
      names.push(b.id === "nha-kho" ? `Nâng Nhà kho lên ${L.WAREHOUSE[b.toLevel - 1].cap} chỗ` : `Nâng ${b.name} cấp ${b.toLevel}`);
    }
    if (u.decor.length) names.push("Trang trí: " + u.decor.map((d) => d.name).join(", "));
    return names;
  }
  /** Phản hồi cho mọi sự kiện luật trả về: hiệu ứng ô, âm thanh, thông báo. */
  function feedback(events, origin = {}) {
    let msgs = [], shareAct = null;
    let sound = null, fxBudget = 6;
    for (const e of events) {
      switch (e.type) {
        case "planted": plotEffect(e.i, "plant"); sound ??= ["buoc-nhay", 0.6]; if (e.free) float(e.i, "Hạt tặng", "#c8f0a0"); break;
        case "watered": plotEffect(e.i, "water"); float(e.i, "Tưới!", "#9fd8ff"); if (fxBudget-- > 0) fxOn(cells[e.i].b, ["nuoc-tuoi"], null, null, 56); sound ??= ["buoc-nhay", 0.5, 1.4]; break;
        case "harvested":
          plotEffect(e.i, "harvest");
          if (fxBudget-- > 0) fxOn(cells[e.i].b, ["lap-lanh"], null, null, 56); // "Thu hết" 30 ô ⇒ chỉ vài ô có lấp lánh (đỡ tốn DOM)
          float(e.i, e.overflow ? "+1 giỏ tràn" : "+1 vào kho", e.overflow ? "#ffb08a" : "#ffe9a8");
          sound ??= ["trung-kim-cuong", 0.7, 0.95 + Math.random() * 0.1];
          if (e.material) msgs.push(`Nhặt được 1 ${L.ITEM[e.material].name}!`);
          break;
        case "plotBought": plotEffect(e.i, "till"); float(e.i, `−${e.cost} xu`, "#ffe9a8"); sound = ["thang", 0.6]; msgs.push("Đã mở thêm một ô ruộng!"); break;
        case "sold":
          sound = ["trung-kim-cuong", 0.8];
          if (e.market) { fxOn(origin.el, ["xu-bay"], `+${fmtNum(e.coins)} xu`, "#ffe9a8"); msgs.push(`Bán ${e.count} ${L.ITEM[Object.keys(e.items)[0]].name} ${e.fair ? (e.hot ? `(${e.hot} món hàng săn, giá ${fmtNum(e.price)})` : `giá phiên chợ ${fmtNum(e.price)}`) : `giá ${fmtNum(e.price)} ${e.trend}`}: +${fmtNum(e.coins)} xu.`); }
          else { saleBurst(e.coins); msgs.push(`Đã bán ${e.count} món theo giá chợ hôm nay, nhận ${fmtNum(e.coins)} xu.`); }
          sdk.reportScore?.(s.stats.earned); break;
        case "delivered":
          sound = ["trung-kim-cuong", 0.9]; saleBurst(e.coins); fxOn(origin.el, ["giao-don", "xu-bay"]);
          msgs.push(`${npcOf(e.npc).name} đã nhận hàng: +${fmtNum(e.coins)} xu, +${e.xp} XP` +
            (Object.keys(e.materials).length ? `, ${Object.entries(e.materials).map(([m, q]) => `${q} ${L.ITEM[m].name}`).join(", ")}` : "") + ".");
          sdk.reportScore?.(s.stats.earned);
          truck?.kick(); markTruck(); // xe Anh Út ghé cổng (từ cấp 11)
          break;
        case "orderCancelled": msgs.push(L.isSpecialSlot(e.slot) ? "Đã bỏ đơn đặc biệt." : "Đã bỏ đơn. Đơn mới sau 2 phút."); sound ??= ["buoc-nhay", 0.4, 0.8]; break;
        // Milestone 6: Sổ sưu tập
        case "bookNew": pulse(ui.bookBtn); msgs.push(`Sổ sưu tập: thêm ${e.name} (${e.total}/${L.BOOK.length})!`); sound ??= ["trung-kim-cuong", 0.5, 1.35]; break;
        case "bookTierReady": pulse(ui.bookBtn); msgs.push(`Sổ sưu tập đủ ${e.at} món — mở Sổ để nhận thưởng!`); sound = ["qua-man", 0.6]; break;
        case "bookClaimed": sound = ["qua-man", 0.8]; fxOn(origin.el, ["lap-lanh", "xu-bay"], `+${fmtNum(e.reward.coins)} xu`, "#ffe9a8");
          shareAct = { id: "shareTitle", label: "Khoe kết quả", onClick: ((t) => () => shareResult(farmShare(s, "title", t)))(e.title) };
          msgs.push(`Danh hiệu mới: “${e.title}” — +${fmtNum(e.reward.coins)} xu` + [...Object.entries(e.reward.items), ...Object.entries(e.reward.decor)].map(([id, q]) => `, ${q} ${L.ITEM[id].name}`).join("") + "."); break;
        case "orderNew": if (origin.tick) { pulse(ui.board); pulse(ui.orderTool); } break;
        case "orderExpired": msgs.push("Đơn đặc biệt của Anh Út đã hết hạn."); break;
        case "warehouseUpgraded": pulse(ui.storeStat); break; // m7: thẻ "Nhà kho lên cấp …" hiện trước → sau
        case "farmUpgraded": sound = ["thang", 0.6]; msgs.push(`Đã mở ${e.name.toLowerCase()}!`); break;
        case "gift": sound = ["qua-man", 0.6]; msgs.push("Chị Ba tặng bạn 3 hạt cà rốt — trồng lại từ đầu nhé!"); break;
        case "questDone": pulse(ui.quest); sound ??= ["trung-kim-cuong", 0.6, 1.2]; break;
        case "questClaimed": sound = ["qua-man", 0.7]; msgs.push(`Nhiệm vụ xong: +${e.reward.coins} xu${e.reward.xp ? `, +${e.reward.xp} XP` : ""}.`); break;
        case "buildStarted": {
          sound = ["thang", 0.7]; const el = fmap.el(e.id);
          fxOn(el, ["khoi-xay-dung"], e.cost ? `−${fmtNum(e.cost)} xu` : null, "#ffe9a8", 96);
          if (!e.instant && e.readyAt > now()) msgs.push(`Bắt đầu xây ${e.name} — xong sau ${fmtLeft(e.readyAt - now())}. Tắt máy vẫn xây tiếp.`);
          break;
        }
        case "upgradeStarted": sound = ["thang", 0.75]; fxOn(fmap.el(e.id), ["lap-lanh"], e.cost ? `−${fmtNum(e.cost)} xu` : null, "#ffe9a8", 96);
          if (!e.instant) msgs.push(`Đang nâng ${e.name} lên cấp ${e.level} — xong sau ${fmtLeft(e.readyAt - now())}. Trong lúc nâng vẫn dùng được.`); break;
        case "buildingDone": { // m7: thẻ chúc mừng (pumpCards) kể công dụng + kêu "qua-man" ⇒ ở đây chỉ còn hiệu ứng trên bản đồ, không toast trùng
          const el = fmap.el(e.id);
          fxOn(el, ["khoi-xay-dung", "lap-lanh"], null, null, 96); pulse(el);
          break;
        }
        case "decorPlaced": sound = ["qua-man", 0.6, 1.15]; setTimeout(() => fxOn(fmap.slotEl(e.slot), ["lap-lanh"]), 30); msgs.push(`Đã đặt ${e.name} lên bản đồ.`); break;
        case "decorRemoved": sound = ["buoc-nhay", 0.5, 0.9]; fxOn(origin.slot ? fmap.slotEl(origin.slot) : null, ["lap-lanh"]); msgs.push(`Đã cất ${e.name} vào túi trang trí.`); break;
        case "machineBuildStarted": sound = ["thang", 0.7]; fxOn(origin.el, ["khoi-xay-dung"], `−${fmtNum(e.cost)} xu`, "#ffe9a8");
          msgs.push(`Đang lắp ${L.MACHINE[e.machine].name} — xong sau ${fmtLeft(e.readyAt - now())}.`); break;
        case "machineUpgraded": sound = ["thang", 0.7]; fxOn(origin.el, ["lap-lanh"]); break; // m7: thẻ chúc mừng thay toast
        case "workshopUpgraded": sound = ["thang", 0.8]; fxOn(origin.el, ["lap-lanh"]); break;
        case "jobQueued": sound ??= ["buoc-nhay", 0.6, 0.85];
          msgs.push(`${L.MACHINE[e.machine].name}: ${e.startAt > now() ? "xếp hàng" : "bắt đầu"} ${L.RECIPE[e.recipe].name} — xong sau ${fmtLeft(e.endAt - now())}.`); break;
        case "jobCollected": {
          const it = L.ITEM[e.item];
          sound = ["trung-kim-cuong", 0.85, 1.05];
          if (origin.el) fxOn(origin.el, ["lap-lanh", "xu-bay"], `+${e.qty} ${it.name}${e.xp ? ` · +${e.xp} XP` : ""}`, "#ffe9a8");
          if (e.xp) msgs.push(`Nhận ${e.qty} ${it.name}, +${e.xp} XP${e.overflow ? " (vào giỏ tràn)" : ""}.`);
          break;
        }
        case "jobsCollected": if (origin.el) fxOn(origin.el, ["lap-lanh", "xu-bay"], `+${e.xp} XP`, "#ffe9a8"); msgs.push(`Nhận ${e.count} mẻ, +${e.xp} XP${e.full ? " — kho đầy, còn mẻ chưa nhận" : ""}.`); break;
        case "bought": sound = ["qua-man", 0.55, 1.2]; fxOn(origin.el, ["lap-lanh"], `−${fmtNum(e.coins)} xu`, "#ffe9a8");
          msgs.push(`Đã mua ${e.count} ${L.ITEM[e.id].name} (−${fmtNum(e.coins)} xu)${L.isDecor(e.id) ? " — cất trong túi trang trí" : ""}.`); break;
        case "levelUp": { sound = ["qua-man", 0.8]; { const st = ui.level.closest(".stat"); playFx(st, "lap-lanh", st.clientWidth / 2, st.clientHeight / 2, 72); pulse(st); } shareAct = { id: "shareLevel", label: "Khoe kết quả", onClick: () => shareResult(farmShare(s, "level")) }; const u = unlockNames(e.level); msgs.push(`Lên cấp ${e.level}!` + (u.length ? ` Mở khoá: ${u.join(", ")}.` : "")); break; }
        // Milestone 4 — cảnh Chăn nuôi / Làng tự phát hiệu ứng + toast khi đang mở; ở bản đồ thì báo ở đây
        case "villageQuestDone":
          sound ??= ["trung-kim-cuong", 0.6, 1.2];
          if (scene !== "village") { pulse(ui.villageTool); msgs.push(`Nhiệm vụ làng xong: ${e.title} — ${e.scope === "progression" ? "bấm “Nhận” ở thanh nhiệm vụ" : "vào Làng để nhận thưởng"}.`); }
          if (e.scope === "progression") pulse(ui.quest);
          break;
        case "villageQuestClaimed":
          if (scene !== "village") { sound = ["qua-man", 0.7]; msgs.push(`Nhận thưởng: ${e.title}` + (e.reward?.coins ? ` +${fmtNum(e.reward.coins)} xu` : "") + (e.reward?.xp ? `, +${e.reward.xp} XP` : "") + "."); }
          break;
        case "animalCollected": if (scene !== "animals") { sound ??= ["trung-kim-cuong", 0.7]; msgs.push(`+${e.qty} ${L.ITEM[e.item].name}.`); } break;
      }
    }
    if (sound) sfx.play(...sound);
    msgs = msgs.filter(Boolean);
    if (msgs.length) toast(msgs.slice(-2).join(" "), msgs.some((m) => m.startsWith("Lên cấp")) ? 4200 : 2600, shareAct);
  }

  let shownCoins = null;
  // D9: điện thoại dọc 341–440 px — HUD (chỉ số + nút) phải một hàng. Thử hiện đủ "320/320"; nếu nút công cụ bị đẩy xuống hàng
  // dưới thì ẩn phần "/320" (.hud.nocap, vẫn đọc được bằng trình đọc màn hình). Chỉ đo khi số đổi hoặc khung đổi cỡ.
  const HUD_TIGHT = matchMedia("(max-width: 440px) and (min-width: 341px) and (orientation: portrait)");
  const hudEl = document.querySelector(".hud"), statsEl = document.querySelector(".hud .stats"), toolsEl = document.querySelector(".hud .tools");
  let hudFitDirty = true, hudCoinsTxt = "", shownStore = null;
  function fitHud() {
    hudFitDirty = false;
    hudEl.classList.remove("nocap");
    if (!HUD_TIGHT.matches || !statsEl.offsetWidth) return;
    if (toolsEl.offsetTop >= statsEl.offsetTop + statsEl.offsetHeight - 2) hudEl.classList.add("nocap");
  }
  let fitRaf = 0; const refitHud = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitHud); };
  HUD_TIGHT.addEventListener?.("change", refitHud);
  window.addEventListener("resize", refitHud);
  document.fonts?.ready.then(refitHud);
  function renderHud() {
    if (shownCoins !== s.coins) {
      if (shownCoins !== null && s.coins > shownCoins) { const st = ui.coins.closest(".stat"); st.classList.remove("bump"); void st.offsetWidth; st.classList.add("bump"); }
      shownCoins = s.coins; ui.coins.textContent = shortNum(s.coins); // TLC12-04: số gọn, số đủ ở title / aria-label
      const full = `${fmtNum(s.coins)} xu`, st = ui.coins.closest(".stat"); st.title = full; st.setAttribute("aria-label", "Xu: " + full);
    }
    if (ui.level.textContent !== String(s.level)) { ui.level.textContent = s.level; hudFitDirty = true; }
    const need = L.xpNeed(s.level);
    ui.xp.style.width = Math.round((100 * s.xp) / need) + "%";
    ui.xpTxt.textContent = `${shortNum(s.xp)}/${shortNum(need)} XP`; ui.xpTxt.title = `${fmtNum(s.xp)}/${fmtNum(need)} XP`;
    const used = L.used(s), cap = L.capacity(s), over = L.overflowCount(s);
    const storeTxt = `${used}/${cap}`;
    if (shownStore !== storeTxt) { shownStore = storeTxt; ui.store.innerHTML = `${used}<span class="cap">/${cap}</span>`; hudFitDirty = true; } // D9: phần "/sức chứa" ẩn được khi chật (fitHud)
    if (ui.coins.textContent !== hudCoinsTxt) { hudCoinsTxt = ui.coins.textContent; hudFitDirty = true; }
    if (hudFitDirty) fitHud();
    ui.over.textContent = over ? `+${over} giỏ tràn` : "";
    ui.over.hidden = !over;
    ui.storeBar.style.width = Math.min(100, Math.round((100 * used) / cap)) + "%";
    ui.storeStat.classList.toggle("full", used >= cap);
    ui.storeStat.title = over ? `Kho đầy — ${over} món đang ở giỏ tràn` : `Kho: ${used}/${cap} chỗ`;
    const baseOpen = s.plots.slice(0, L.BASE_PLOTS).filter((p) => p.open).length, extraOpen = s.plots.slice(L.BASE_PLOTS).filter((p) => p.open).length;
    ui.plots.textContent = `${baseOpen}/${L.W * L.H}` + (extraOpen ? ` +${extraOpen}` : "");
    ui.plots.title = extraOpen ? `${baseOpen}/25 ô ruộng chính · ${extraOpen} ô Nhà kính / phía Đông` : "";
    L.FIELD_CROPS.forEach((c, n) => {
      const b = seedBtns[n], ok = L.cropUnlocked(s, c.id);
      b.classList.toggle("locked", !ok);
      b.setAttribute("aria-checked", String(pick === c.id));
      b.setAttribute("aria-disabled", String(!ok));
      b.tabIndex = pick === c.id ? 0 : -1;
      b.querySelector(".info").textContent = !ok ? `Cấp ${c.level}` : c.id === "ca-rot" && s.freeSeeds
        ? `${s.freeSeeds} hạt tặng` : `${c.seed} xu · ${fmtGrow(c.growMs)}`;
    });
    const total = used + over;
    ui.depot.textContent = total ? `Kho (${total})` : "Kho";
    const bv = L.boardView(s), ready = bv.slots.filter((x) => x.ready).length + (bv.special?.ready ? 1 : 0) + (bv.special2?.ready ? 1 : 0);
    ui.boardBadge.textContent = ready || "";
    ui.boardBadge.hidden = !ready;
    ui.orderTool.textContent = ready ? `Đơn (${ready})` : "Đơn hàng";
    const next = L.UPGRADES[s.upgrade];
    ui.upgradeInfo.textContent = next ? `${next.name} · Cấp ${next.level} · ${next.cost} xu` : "Đã mở mọi trang trí.";
    ui.upgrade.disabled = !next;
    ui.farm.dataset.upgrade = s.upgrade;
  }

  // Thay nội dung khi đổi; giữ tiêu điểm bàn phím theo data-key.
  const lastHtml = new WeakMap();
  function setHtml(el, html) {
    if (lastHtml.get(el) === html) return;
    const key = document.activeElement?.closest?.("[data-key]") && el.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    el.innerHTML = html;
    lastHtml.set(el, html);
    if (key) el.querySelector(`[data-key="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
  }
  const until = (t) => `<span data-until="${t}">${fmtClock(t - now())}</span>`;

  function renderWarehouse() {
    if (ui.warehouse.hidden) return;
    const used = L.used(s), cap = L.capacity(s), over = L.overflowCount(s), need = L.demand(s);
    const row = (id, q, where) => {
      const it = L.ITEM[id], sellable = L.sellable(id), want = need[id] || 0;
      return `<li class="wh-item">${iconHtml(id)}<div class="wh-info"><b>${esc(it.name)} <span class="qty">×${fmtNum(q)}</span></b>` +
        (sellable ? `<small>Giá chợ hôm nay: ${fmtNum(L.salePrice(s, id, now()))} xu ${L.MARKET.trend(id, now())}</small>` : "") +
        `<small>Nguồn: ${esc(it.source)} · Dùng cho: ${esc(it.uses)}</small>` +
        (want ? `<small class="want">Đơn đang cần: ${want}</small>` : "") + `</div>` +
        (sellable ? `<div class="wh-btns"><button class="btn btn--sm" type="button" data-act="sell1" data-id="${id}" data-key="s1-${where}-${id}" aria-label="Bán 1 ${esc(it.name)}">Bán 1</button>` +
          `<button class="btn btn--sm" type="button" data-act="sellN" data-id="${id}" data-key="sn-${where}-${id}" aria-label="Bán hết ${esc(it.name)}">Hết · ${fmtNum(q * L.salePrice(s, id, now()))} xu</button></div>` : "") + `</li>`;
    };
    let html = `<div class="wh-head"><b>Nhà kho</b><span class="wh-cap${used >= cap ? " full" : ""}">${used}/${cap} chỗ</span>` +
      `<div class="px-bar wh-bar" aria-hidden="true"><i style="width:${Math.min(100, Math.round((100 * used) / cap))}%"></i></div></div>`;
    if (over) {
      const value = Object.entries(s.overflow).reduce((n, [id, q]) => n + q * (L.salePrice(s, id, now()) || 0), 0);
      html += `<div class="basket" id="basket"><p><b>Giỏ tràn ${over}/${L.OVERFLOW_MAX}</b> — kho đầy nên hàng mới nằm tạm ở đây. Bán bớt hoặc nâng kho; có chỗ trống hàng sẽ tự vào kho.</p>` +
        `<div class="basket-items">${Object.entries(s.overflow).map(([id, q]) => `<span>${iconHtml(id, "it--sm")}×${q}</span>`).join("")}</div>` +
        `<button class="btn btn--primary" type="button" id="sellBasket" data-act="sellBasket" data-key="basket">Bán nhanh giỏ tràn · ${fmtNum(value)} xu</button></div>`;
    }
    const groups = L.CATEGORIES.map((cat) => {
      const ids = Object.keys(s.inv).filter((id) => L.ITEM[id]?.cat === cat.id && s.inv[id] > 0);
      return ids.length ? `<h3>${esc(cat.name)}</h3><ul class="wh-list">${ids.map((id) => row(id, s.inv[id], "inv")).join("")}</ul>` : "";
    }).join("");
    html += groups || `<p class="wh-empty">Kho trống. Thu hoạch cây chín để đưa nông sản vào kho.</p>`;
    const decor = Object.keys(s.decor || {}).filter((id) => s.decor[id] > 0);
    if (decor.length) html += `<h3>Trang trí (túi riêng)</h3><ul class="wh-list">${decor.map((id) => `<li class="wh-item">${iconHtml(id)}<div class="wh-info"><b>${esc(L.ITEM[id].name)} <span class="qty">×${s.decor[id]}</span></b><small>Không tính sức chứa · đặt lên bản đồ ở chế độ Xây (nút búa)</small></div></li>`).join("")}</ul>`;
    // Nhà kho là công trình (Milestone 3): xây ở cấp 3 trên bản đồ, nâng = startUpgrade nha-kho
    const tw = now(), whLv = L.levelOf(s, "nha-kho", tw), nx = whLv >= 1 ? L.nextStep(s, "nha-kho", tw) : null;
    if (whLv < 1) {
      const b0 = L.BUILDING["nha-kho"].levels[0];
      html += s.level >= b0.unlock ? `<div class="wh-up"><p><b>Đang dùng kho tạm ${cap} chỗ.</b> Xây Nhà kho trên bản đồ (${fmtNum(b0.cost)} xu, xây ngay) để mở các mốc nâng: lần đầu lên ${L.WAREHOUSE[1].cap} chỗ.</p>` +
        `<button class="btn btn--teal" type="button" id="whBuild" data-act="whBuild" data-key="wh-build">Xây Nhà kho</button></div>`
        : `<p class="wh-up">Kho tạm ${cap} chỗ. Nhà kho xây được từ cấp ${b0.unlock}.</p>`;
    } else if (nx) {
      const mats = Object.entries(nx.materials);
      const okLevel = s.level >= nx.unlock, okCoins = s.coins >= nx.cost, okMats = mats.every(([m, q]) => L.have(s, m) >= q);
      html += `<div class="wh-up"><p><b>Nâng kho: ${L.WAREHOUSE[whLv - 1].cap} → ${L.WAREHOUSE[nx.level - 1].cap} chỗ</b> · ${fmtNum(nx.cost)} xu` +
        (mats.length ? ` · ${mats.map(([m, q]) => `${iconHtml(m, "it--sm")}${L.have(s, m)}/${q} ${esc(L.ITEM[m].name)}`).join(" · ")}` : "") +
        (okLevel ? "" : ` · <span class="need">cần cấp ${nx.unlock}</span>`) + `</p>` +
        `<button class="btn btn--teal" type="button" id="whUpgrade" data-act="whUpgrade" data-key="wh-up"${okLevel && okCoins && okMats ? "" : " disabled"}>Nâng kho</button></div>`;
    } else html += `<p class="wh-up">Nhà kho đã ở mức lớn nhất.</p>`;
    setHtml(ui.whBody, html);
    ui.sell.disabled = !Object.entries({ ...s.inv, ...s.overflow }).some(([id, q]) => q > 0 && L.ITEM[id]?.cat === "nong-san");
  }

  function slipHtml(v, slotKey) {
    const key = `slot-${slotKey}`;
    if (!v.order) {
      return `<li class="slip slip--empty" data-slot="${slotKey}"><p>${L.isSpecialSlot(slotKey) ? "Anh Út sẽ ghé với đơn đặc biệt mới" : "Đơn mới"} sau ${until(v.refillAt)}</p></li>`;
    }
    const o = v.order, npc = npcOf(o.npc), T = L.ORDER_TYPES[o.type];
    const items = v.items.map((it) => `<li class="${it.owned >= it.need ? "ok" : ""}">${iconHtml(it.id)}<span>${esc(L.ITEM[it.id].name)}</span><b>${Math.min(it.owned, it.need)}/${it.need}</b></li>`).join("");
    const mats = Object.entries(o.materials).map(([m, q]) => `${iconHtml(m, "it--sm")}${q}`).join(" ");
    const armed = cancelArm === `${slotKey}:${o.id}`, pay = L.orderPayout(s, o, now()); // xu thật nhận (gồm danh tiếng Nhà, Milestone 5)
    return `<li class="slip slip--${o.type}${v.ready ? " ready" : ""}" data-slot="${slotKey}">` +
      `<div class="slip-head">${faceHtml(o.npc)}<div><b>${esc(npc.name)}</b><small>${esc(T.name)}${o.expiresAt ? ` · còn ${until(o.expiresAt)}` : ""}</small></div></div>` +
      `<ul class="slip-items">${items}</ul>` +
      `<p class="slip-reward">${iconHtml("dong-xu", "it--sm")}<b>${fmtNum(pay)}</b>${pay > o.coins ? `<small class="fame-plus" title="Danh tiếng Nhà: đơn hàng trả thêm xu">★+${fmtNum(pay - o.coins)}</small>` : ""} ${iconHtml("sao-xp", "it--sm")}<b>${o.xp} XP</b>${mats ? ` <span class="mats">${mats}</span>` : ""}</p>` +
      `<p class="slip-status">${v.ready ? "Đủ hàng — giao được!" : "Còn thiếu hàng"}</p>` +
      `<div class="slip-btns"><button class="btn btn--teal" type="button" data-act="deliver" data-slot="${slotKey}" data-id="${o.id}" data-rev="${v.rev}" data-key="${key}-giao"${v.ready ? "" : " disabled"} aria-label="Giao đơn của ${esc(npc.name)}">Giao</button>` +
      `<button class="btn btn--sm${armed ? " armed" : ""}" type="button" data-act="cancel" data-slot="${slotKey}" data-id="${o.id}" data-rev="${v.rev}" data-key="${key}-bo">${armed ? "Bấm lần nữa" : "Bỏ đơn"}</button></div></li>`;
  }
  function renderOrders() {
    if (ui.orders.hidden) return;
    const b = L.boardView(s);
    let html = b.slots.map((v, k) => slipHtml(v, k)).join("");
    if (b.special) html += slipHtml(b.special, "special");
    if (b.special2) html += slipHtml(b.special2, "special2"); // Milestone 6: đơn đặc biệt thứ hai (cấp 18)
    else if (s.level >= L.SPECIAL_LEVEL && s.level < L.SPECIAL2_LEVEL) html += `<li class="slip slip--locked"><p>Đơn đặc biệt thứ hai mở ở cấp ${L.SPECIAL2_LEVEL}</p></li>`;
    const slots = L.orderSlotCount(s.level);
    const nextSlot = [3, 6, 11].find((lv) => lv > s.level);
    if (slots < 6 && nextSlot) html += `<li class="slip slip--locked"><p>Ô đơn thứ ${slots + 1} mở ở cấp ${nextSlot}</p></li>`;
    if (s.level < L.COMBO_LEVEL) html += `<li class="slip slip--locked"><p>Đơn kết hợp của Bác Tư mở ở cấp ${L.COMBO_LEVEL}</p></li>`;
    else if (s.level < L.SPECIAL_LEVEL) html += `<li class="slip slip--locked"><p>Đơn đặc biệt của Anh Út mở ở cấp ${L.SPECIAL_LEVEL}</p></li>`;
    setHtml(ui.slips, html);
  }

  /** Milestone 4: hết sổ hướng dẫn + tiến trình M2 ⇒ thanh nhiệm vụ hiện nhiệm vụ tiến trình chăn nuôi của Chị Ba (core/village.js). */
  function renderVillageQuest() {
    const lg = L.villageLog(s.village, L.rulesCtx(s, now()), L.bag(s)), q = lg.progression, nx = lg.progressionNext;
    const k = L.VILLAGE_PROGRESSION.findIndex((x) => x.id === (q || nx)?.id);
    ui.quest.hidden = k < 0;
    if (k < 0) return;
    const def = L.VILLAGE_PROGRESSION[k], done = !!q?.claimable;
    ui.qStep.textContent = `Chị Ba · Chăn nuôi ${k + 1}/${L.VILLAGE_PROGRESSION.length}`;
    ui.qTitle.textContent = def.title;
    ui.qHint.textContent = done ? "Xong rồi! Bấm “Nhận” để lấy thưởng." : q ? def.hint : `Lên cấp ${def.minLevel} để bắt đầu — giao đơn và chế biến để lấy kinh nghiệm.`;
    const p = q ? Math.min(q.progress, q.count) : 0, n = q ? q.count : def.count;
    ui.qBar.style.width = Math.round((100 * p) / n) + "%";
    ui.qProg.textContent = q ? `${p}/${n}` : `Cấp ${s.level}/${def.minLevel}`;
    const r = def.reward;
    ui.qReward.innerHTML = `${iconHtml("dong-xu", "it--sm")}${r.coins || 0}` + (r.xp ? ` ${iconHtml("sao-xp", "it--sm")}${r.xp}` : "") +
      Object.entries(r.items || {}).map(([id, c]) => ` ${iconHtml(id, "it--sm")}${c}`).join("");
    ui.qClaim.hidden = !done;
    ui.qClaim.dataset.id = def.id; ui.qClaim.dataset.kind = "village";
    ui.quest.classList.toggle("done", done);
  }
  function renderQuest() {
    const q = L.currentQuest(s);
    if (!q) return renderVillageQuest();
    ui.quest.hidden = false;
    ui.qClaim.dataset.kind = "";
    const done = L.questComplete(s), k = L.QUESTS.indexOf(q);
    const tut = k < L.TUTORIAL.length;
    ui.qStep.textContent = tut ? `Chị Ba · Nhiệm vụ ${k + 1}/${L.TUTORIAL.length}` : `Chị Ba · Tiến trình ${k - L.TUTORIAL.length + 1}/${L.PROGRESSION.length}`;
    ui.qTitle.textContent = q.title;
    let hint = q.hint;
    if (q.id === "mo-o-dat" && !L.hasFeature(s, "plots")) hint = "Lên cấp 2 để mở thêm ô đất — thu hoạch và giao đơn để lấy kinh nghiệm.";
    if (q.id === "xay-nha-kho" && s.coins < 60) hint = "Để dành 60 xu rồi bấm “Xây” (cái búa), chạm lô Nhà kho bên trái ruộng — kho đầy thì hàng rơi vào giỏ tràn.";
    if (q.id === "xay-xuong" && s.level < L.WORKSHOP.unlock) hint = `Lên cấp ${L.WORKSHOP.unlock} để mở Xưởng chế biến — giao đơn và thu hoạch để lấy kinh nghiệm.`;
    if ((q.id === "lam-thuc-an" || q.id === "giao-ket-hop") && s.level < 5) hint = "Lên cấp 5 để mở " + (q.id === "lam-thuc-an" ? "Cối xay trong Xưởng." : "đơn kết hợp của Bác Tư.");
    ui.qHint.textContent = done ? "Xong rồi! Bấm “Nhận” để lấy thưởng." : hint;
    const prog = q.level ? (done ? 1 : Math.min(1, s.level / q.level)) : s.quests.progress / q.count;
    ui.qBar.style.width = Math.round(prog * 100) + "%";
    ui.qProg.textContent = q.level ? `Cấp ${Math.min(s.level, q.level)}/${q.level}` : `${s.quests.progress}/${q.count}`;
    ui.qReward.innerHTML = `${iconHtml("dong-xu", "it--sm")}${q.reward.coins}` + (q.reward.xp ? ` ${iconHtml("sao-xp", "it--sm")}${q.reward.xp}` : "");
    ui.qClaim.hidden = !done;
    ui.qClaim.dataset.id = q.id;
    ui.quest.classList.toggle("done", done);
  }

  /** Mũi tên + viền sáng vào điều khiển nhiệm vụ đang cần. */
  let hlEl = null, detourKey = "";
  /** TLC12-01: việc kế tiếp NV1–NV5 (core/guide.js) ⇒ nút trên màn. Bán luôn trỏ "Bán 1" (không "Bán hết") để giữ hàng cho đơn. */
  function goalEl(g) {
    const plot = (i) => cells[i]?.b || null;
    switch (g.do) {
      case "claim": return ui.qClaim;
      case "plant":
        if (mode !== "seed") return ui.grow;
        if (pick !== g.crop) return seedBtns[L.FIELD_CROPS.findIndex((c) => c.id === g.crop)] || null;
        return plot(g.i);
      case "water": return g.detour || mode === "water" ? plot(g.i) : ui.water;
      case "harvest": case "wait": return plot(g.i);
      case "sell":
        if (scene === "market") return ui.mkRoot.querySelector(`#mkSell [data-act="sell"][data-id="${CSS.escape(g.id)}"][data-n="1"]`);
        if (scene !== "farm") return null;
        return ui.warehouse.hidden ? ui.sellTool : ui.whBody.querySelector(`[data-act="sell1"][data-id="${CSS.escape(g.id)}"]`);
      case "deliver":
        if (scene !== "farm") return null;
        return ui.orders.hidden ? ui.orderTool : ui.slips.querySelector(`[data-act="deliver"][data-slot="${g.slot}"]:not([disabled])`);
    }
    return null;
  }
  function highlight(t) {
    const q = L.currentQuest(s);
    let el = null;
    const g = L.tutorialGoal(s, t);
    if (g) {
      el = goalEl(g);
      // đi vòng (hết cây chín, kho trống, thiếu hàng giao đơn) ⇒ gợi ý nói rõ việc cần làm và tự mở (điện thoại gập gợi ý)
      if (g.detour && g.hint) {
        if (ui.qHint.textContent !== g.hint) ui.qHint.textContent = g.hint;
        const key = `${q.id}:${g.do}`;
        if (detourKey !== key && !ui.quest.classList.contains("open")) {
          ui.quest.classList.add("open"); $("qMore")?.setAttribute("aria-expanded", "true"); $("qMore")?.setAttribute("aria-label", "Thu gọn nhiệm vụ");
        }
        detourKey = key;
      } else detourKey = "";
    } else if (q && !L.questComplete(s)) {
      const firstPlot = (pred) => { const order = [12, ...s.plots.keys()]; const i = order.find((k) => pred(s.plots[k], k)); return i === undefined ? null : cells[i].b; };
      switch (q.target) {
        case "plot-empty": el = mode === "seed" ? firstPlot((p) => p.open && !p.crop) : ui.grow; break;
        case "plot-growing": el = mode === "water" ? firstPlot((p) => p.crop && !p.watered && !L.isReady(p, t)) : (s.plots.some((p) => p.crop && !p.watered && !L.isReady(p, t)) ? ui.water : ui.grow); break;
        case "plot-ready": el = firstPlot((p) => L.isReady(p, t)); break;
        case "sell": el = scene === "market" ? ui.mkRoot.querySelector('#mkSell [data-act="sell"]') : ui.warehouse.hidden ? ui.sellTool : ui.sell.disabled ? null : ui.sell; break;
        case "workshop-lot": el = s.level >= L.WORKSHOP.unlock ? (scene === "farm" ? (buildMode || ui.lot.hidden ? ui.buildBtn : ui.lot) : ui.wsRoot.querySelector("[data-back]")) : null; break;
        case "build:nha-kho": { const b = fmap.el("nha-kho"); el = scene !== "farm" ? null : b && !b.hidden ? b : ui.buildBtn; break; }
        case "workshop": {
          if (L.workshopState(s, t) !== "done") { el = null; break; }
          if (scene !== "workshop") { el = scene === "farm" ? ui.lot : null; break; }
          el = ui.wsRoot.querySelector(".slot--done") || (workshop.recipeOpen ? document.querySelector('#recipeBody [data-act="start"]:not([disabled])') : ui.wsRoot.querySelector('.mach-foot [data-act="build"]:not([disabled])') || ui.wsRoot.querySelector('.mach[data-state="ready"] .mach-btn'));
          break;
        }
        case "market": el = scene === "farm" ? ui.market : null; break;
        case "orders": el = scene !== "farm" ? null : ui.orders.hidden ? ui.orderTool : ui.slips.querySelector('[data-act="deliver"]:not([disabled])'); break;
        case "plot-buy": el = L.hasFeature(s, "plots") ? firstPlot((p, k) => L.canBuy(s, k)) : null; break;
        case "warehouse-upgrade": el = ui.warehouse.hidden ? ui.depot : ui.whBody.querySelector("#whUpgrade:not([disabled])"); break;
      }
    } else if (q) el = ui.qClaim;
    if (el === hlEl && (!el || el.classList.contains("qhl"))) return;
    hlEl?.classList.remove("qhl", "qarrow");
    hlEl = el;
    if (el) { el.classList.add("qhl"); if (q?.arrow && el !== ui.qClaim && g?.do !== "wait") el.classList.add("qarrow"); }
  }

  function renderPlot(i, t) {
    const p = s.plots[i], c = cells[i], cost = L.plotCost(s);
    if (i >= L.BASE_PLOTS) { c.b.hidden = !p.open; if (!p.open) return; } // ô phía Đông / Nhà kính: chỉ hiện khi đã mở
    const st = p.open ? L.stage(p, t) : "locked";
    const key = st === "locked" || st === "empty" ? null : p.crop + ":" + st;
    if (c.key !== key) {
      if (c.key && key && c.key.startsWith(p.crop + ":")) {
        if (st === "ready") sfx.play("trung-kim-cuong", 0.3, 1.3);
        plotEffect(i, "grow");
      }
      ART.draw(c.cv, key);
      c.key = key;
    }
    const plotsOn = L.hasFeature(s, "plots");
    const buyable = !p.open && L.canBuy(s, i);
    c.b.classList.toggle("locked", !p.open);
    c.b.classList.toggle("far", !p.open && !(buyable && plotsOn));
    c.b.classList.toggle("wet", p.open && !!p.crop && p.watered && st !== "ready");
    c.b.classList.toggle("ready", st === "ready");
    c.b.classList.toggle("confirm", confirmAt === i);
    c.b.classList.toggle("cursor", cursor === i && document.activeElement === c.b);
    c.bar.hidden = !(p.crop && st !== "ready");
    if (!c.bar.hidden) c.fill.style.width = Math.round(L.progress(p, t) * 100) + "%";
    c.drop.hidden = !(p.crop && !p.watered && st !== "ready");
    let lbl = "", aria;
    const name = p.crop && L.CROP[p.crop].name;
    if (!p.open) {
      lbl = buyable && plotsOn ? `${cost} xu` : "";
      aria = !buyable ? "Ô cỏ — chưa mở được, cần mở ô bên cạnh trước" : plotsOn ? `Ô cỏ — mở với giá ${cost} xu` : "Ô cỏ — mở thêm ô đất từ cấp 2";
    } else if (st === "empty") aria = mode === "water" ? "Ô đất trống" : `Ô đất trống — gieo ${L.CROP[pick].name}`;
    else if (st === "ready") { lbl = "Chín!"; aria = `${name} đã chín — bấm để thu hoạch`; }
    else { lbl = fmtClock(p.readyAt - t); aria = `${name} — còn ${fmtLeft(p.readyAt - t)}${p.watered ? "" : ", chưa tưới"}`; }
    if (c.lbl.textContent !== lbl) c.lbl.textContent = lbl;
    if (c.b.getAttribute("aria-label") !== aria) { c.b.setAttribute("aria-label", aria); c.b.title = aria; }
  }
  function renderField(t) {
    for (let i = 0; i < cells.length; i++) renderPlot(i, t);
    ui.all.disabled = !s.plots.some((p) => L.isReady(p, t));
    highlight(t);
    clearTimeout(tickTimer);
    if (!document.hidden && s.plots.some((p) => p.crop && !L.isReady(p, t))) tickTimer = setTimeout(() => renderField(now()), 250);
  }
  // ---------- bản đồ: công trình, chế độ Xây, trang trí, Nhà kính (Milestone 3) ----------
  const affordErr = (step) => (step ? L.affordError(step, { coins: () => s.coins }, { has: (id, n) => L.have(s, id) >= n }) : "max");
  const canAffordId = (id) => { const st = L.nextStep(s, id, now()); return !!st && s.level >= st.unlock && !affordErr(st); };
  const millBusy = (t) => (s.production.machines["coi-xay"]?.queue || []).some((j) => j.startAt <= t && t < j.endAt);
  function renderMap(t) {
    const layout = fmap.render({ s, t, buildMode, canAfford: canAffordId, busyMill: millBusy(t), fair: !!L.activeFair(s, t) });
    renderFairNav(t);
    // Xưởng: số mẻ xong chờ nhận (huy hiệu trên công trình + nút điều hướng)
    const fin = L.workshopState(s, t) === "done" ? L.finishedJobs(s, t) : 0;
    ui.wsBadge.hidden = !fin; ui.wsBadge.textContent = fin || "";
    ui.wsTool.textContent = fin ? `Xưởng (${fin})` : "Xưởng";
    ui.buildBtn.setAttribute("aria-pressed", String(buildMode));
    ui.buildBar.hidden = !buildMode || scene !== "farm";
    // PERF-06: không đọc bố cục mỗi giây (long task ở CPU yếu) — chỉ đặt lại nút cuộn khi cảnh / bề rộng bản đồ / thanh Xây đổi;
    // cuộn, đổi cỡ cửa sổ / khung bản đồ do listener + ResizeObserver lo
    const panSig = `${scene}|${fmap.bw}|${buildMode}`;
    if (panSig !== lastPanSig) { lastPanSig = panSig; schedulePan(); }
    if (cardFor && !ui.ovBuild.hidden) renderBuildCard(t, true);
    return layout;
  }
  // ---------- Milestone 4: nút điều hướng + huy hiệu Chăn nuôi / Làng, xe giao hàng ----------
  let lastAnimalsReady = -1;
  const navHtml = (name, locked, badge) => esc(name) + (locked ? `<small>Cấp ${locked}</small>` : "") + (badge ? `<span class="nav-badge">${esc(badge)}</span>` : "");
  function renderM4(t) {
    const rc = L.rulesCtx(s, t), st = L.animalStatus(s.animals, t, rc);
    const egg = st.kinds.ga?.ready || 0, milk = st.kinds["bo-sua"]?.ready || 0, ready = egg + milk;
    const aLocked = s.level < ANIMALS_LEVEL, vLocked = s.level < L.VILLAGE_LEVEL;
    setHtml(ui.animalsTool, navHtml("Chăn nuôi", aLocked && ANIMALS_LEVEL, !aLocked && ready ? String(ready) : ""));
    ui.animalsTool.classList.toggle("is-locked", aLocked);
    ui.animalsTool.setAttribute("aria-label", aLocked ? `Chăn nuôi — mở ở cấp ${ANIMALS_LEVEL}` : ready ? `Chăn nuôi — ${egg ? egg + " trứng" : ""}${egg && milk ? ", " : ""}${milk ? milk + " sữa" : ""} chờ thu` : "Chăn nuôi");
    ui.coopBadge.hidden = !egg; ui.coopBadge.textContent = egg ? String(egg) : "";
    ui.barnBadge.hidden = !milk; ui.barnBadge.textContent = milk ? String(milk) : "";
    const lg = vLocked ? null : L.villageLog(s.village, rc, L.bag(s));
    const claim = lg ? (lg.progression?.claimable ? 1 : 0) + lg.board.filter((q) => q.claimable).length + lg.chains.filter((c) => c.quest?.claimable && !c.locked).length : 0;
    setHtml(ui.villageTool, navHtml("Làng", vLocked && L.VILLAGE_LEVEL, claim ? "!" : ""));
    ui.villageTool.classList.toggle("is-locked", vLocked);
    ui.villageTool.setAttribute("aria-label", vLocked ? `Làng — mở ở cấp ${L.VILLAGE_LEVEL}` : claim ? `Làng — ${claim} nhiệm vụ chờ nhận thưởng` : "Làng");
    ui.villageBadge.hidden = !claim; ui.villageBadge.textContent = claim ? "!" : "";
    if (lastAnimalsReady >= 0 && ready > lastAnimalsReady && scene !== "animals") {
      toast(`${egg ? `${egg} trứng gà` : ""}${egg && milk ? " · " : ""}${milk ? `${milk} sữa` : ""} đã sẵn sàng — vào Chăn nuôi để thu!`, 3000);
      sfx.play("trung-kim-cuong", 0.35, 1.2); pulse(ui.animalsTool);
    }
    lastAnimalsReady = ready;
  }
  /** Xe Anh Út đang chạy qua cổng ⇒ ẩn xe đứng yên trên bản đồ (khỏi thấy 2 xe), giữ vòng vẽ chạy. */
  function markTruck() {
    if (!truck) return;
    const busy = truck.phase !== "idle";
    const v = busy ? "busy" : "";
    const changed = ui.farmMap.dataset.truck !== v;
    if (changed) ui.farmMap.dataset.truck = v;
    if (busy || changed) truck.kick(); // vừa hết lượt ⇒ vẽ thêm 1 khung để xoá canvas (vòng rAF có thể đã dừng khi tab bị ẩn / chụp ảnh)
  }
  function openAnimals() {
    if (s.level < ANIMALS_LEVEL) { toast(`Chăn nuôi mở ở cấp ${ANIMALS_LEVEL} — giao đơn, chế biến để lên cấp.`); sfx.play("trung-da", 0.3); return; }
    if (buildMode) setBuildMode(false, true);
    goScene("animals");
  }
  function openVillage() {
    if (s.level < L.VILLAGE_LEVEL) { toast(`Làng mở ở cấp ${L.VILLAGE_LEVEL}.`); sfx.play("trung-da", 0.3); return; }
    if (buildMode) setBuildMode(false, true);
    goScene("village");
  }
  /** Bản đồ rộng hơn khung (khung hẹp / đã mở phía Đông): nút cuộn nhanh sang Đông / về ruộng, nằm ở mép phải khung. */
  /** Gộp các lần cần đặt lại nút cuộn vào một khung hình (đọc bố cục một lần, sau khi DOM đã ghi xong). */
  function schedulePan() { if (!panRaf) panRaf = requestAnimationFrame(() => { panRaf = 0; placePan(); }); }
  function placePan() {
    const f = ui.farm, wide = f.scrollWidth > f.clientWidth + 8;
    ui.pan.hidden = !wide || scene !== "farm";
    if (ui.pan.hidden) return;
    const atEnd = f.scrollLeft + f.clientWidth >= f.scrollWidth - 8;
    const txt = atEnd ? "← Về ruộng" : fmap.bw > 1 ? "Phía Đông →" : "Xem thêm →";
    if (ui.pan.textContent !== txt) ui.pan.textContent = txt;
    // D4: xoay ngang thì .farm-world là display:contents ⇒ khung chứa nút là .wrap; dùng offsetParent chung của bản đồ và nút
    const box = ui.pan.offsetParent || f.parentElement;
    ui.pan.style.top = `${f.offsetTop + 8}px`;
    ui.pan.style.right = `${Math.max(8, box.clientWidth - f.offsetLeft - f.offsetWidth + 8)}px`;
  }
  function setBuildMode(on, quiet) {
    buildMode = !!on;
    if (!quiet) sfx.play("buoc-nhay", 0.45, buildMode ? 1.25 : 0.9);
    if (buildMode && scene !== "farm") goScene("farm", true);
    render();
    if (buildMode) {
      if (s.level < 3) toast("Nhà kho mở ở cấp 3 — lô mờ là công trình sắp mở.", 3200);
      ui.farm.scrollIntoView({ block: "nearest" });
    }
  }
  /** Lối vào công trình đã xây (ngoài chế độ Xây chạm là vào). null ⇒ không có cảnh riêng. */
  function enterOf(id) {
    const t = now();
    if ((id === "chuong-ga" || id === "chuong-bo") && L.levelOf(s, id, t) >= 1) return { label: "Vào Chăn nuôi", go: () => goScene("animals") };
    if (id === "xuong" && L.workshopState(s, t) === "done") return { label: "Vào Xưởng", go: () => goScene("workshop") };
    if (id === "coi-xay-gio" && L.workshopState(s, t) === "done") return { label: "Vào Xưởng", go: () => goScene("workshop") };
    if (id === "sap-cho") return { label: "Vào Khu chợ", go: () => goScene("market") };
    if (id === "bang-don-hang") return { label: "Mở Bảng đơn", go: () => { openPanel("orders"); ui.orders.scrollIntoView({ block: "nearest" }); } };
    if (id === "nha-kho" && L.levelOf(s, id, t) >= 1) return { label: "Mở Nhà kho", go: () => { openPanel("stock"); ui.warehouse.scrollIntoView({ block: "nearest" }); } };
    if (id === "nha-kinh" && L.levelOf(s, id, t) >= 1) return { label: "Vào Nhà kính", go: () => openGreenhouse() };
    return null;
  }
  function bldTap(id) {
    const it = fmap.layout?.items.find((x) => x.id === id);
    if (!it) return;
    if (id === "bien-lang") { openVillage(); return; } // biển Làng (tự hiện từ cấp 6): luôn là lối vào cảnh Làng, cả trong chế độ Xây
    if (!buildMode && L.inMilestone(id) && (it.status === "done" || it.status === "upgradeable")) {
      const e = enterOf(id);
      if (e) { e.go(); return; }
    }
    openBuildCard(id);
  }
  /** m7: "→ sau" in đậm trong dòng "Kho: 60 → 90 chỗ". */
  const gainHtml = (g) => { const k = g.indexOf(" → "); return k < 0 ? esc(g) : `${esc(g.slice(0, k))} → <b>${esc(g.slice(k + 3))}</b>`; };
  /** m7: dòng "Dùng để …" + "Bạn được …" (data/building-info.js) cho thẻ xây / nâng. */
  const aboutHtml = (a, label = "Bạn được:") => !a ? "" : `<li class="bc-about"><b>Dùng để:</b> ${esc(a.use)}</li>` +
    `<li class="bc-about"><b>${label}</b><ul class="bc-gain">${a.gain.map((g) => `<li>${gainHtml(g)}</li>`).join("")}</ul></li>`;
  function openBuildCard(id) {
    cardFor = id;
    renderBuildCard(now());
    ui.ovBuild.hidden = false;
    (ui.buildOk.hidden || ui.buildOk.disabled ? (ui.buildEnter.hidden ? ui.buildCancel : ui.buildEnter) : ui.buildOk).focus();
    sfx.play("buoc-nhay", 0.35, 1.1);
  }
  /** Thẻ xây / nâng cấp (khung ui-kit): giá xu + vật liệu có/cần, thời gian, hiệu ứng, cấp mở / lý do. */
  function renderBuildCard(t, live) {
    const id = cardFor, def = L.BUILDING[id], it = fmap.layout?.items.find((x) => x.id === id);
    if (!def || !it) { ui.ovBuild.hidden = true; return; }
    const inMs = L.inMilestone(id), status = inMs ? it.status : "locked";
    const machine = def.kind === "machine";
    const step = !machine && inMs ? L.nextStep(s, id, t) : null; // mốc kế tiếp (xây nếu level 0)
    const isUp = it.level >= 1, toLv = it.level + 1;
    const title = machine ? def.name : status === "building" ? `${def.name} — đang ${it.upgrading ? "nâng cấp" : "xây"}` : step && status !== "done" ? `${isUp ? "Nâng cấp" : "Xây"} ${def.name}` : def.name;
    const pic = status === "building" && !it.upgrading ? { sheet: "buildings", id: "gian-giao" } : resolveSprite(step?.sprite || it.sprite || def.levels[0].sprite);
    const picCss = pic && pic.sheet !== "garden" ? spriteCss(pic.sheet, pic.id) : null;
    const picHtml = picCss ? `<span class="bc-pic" style="${picCss}" aria-hidden="true"></span>` : pic?.sheet === "garden" ? `<img class="bc-pic${pic.filter ? " spr--" + pic.filter : ""}" src="assets/garden/${pic.id}.webp" alt="">` : "";
    let rows = "";
    const lvTxt = def.levels.length > 1 && it.level >= 1 ? ` · cấp ${it.level}/${def.levels.length}` : "";
    if (!inMs) rows += aboutHtml(L.about(id, 1, 0)) + `<li class="miss">Cần cấp ${def.levels[0].unlock}.</li>`;
    else if (machine) {
      rows += aboutHtml(L.about(id, 1, 0));
      if (status === "locked") rows += `<li class="miss">Mở ở cấp ${it.unlockLevel}</li>`;
      else if (status === "available") rows += `<li>${L.workshopState(s, t) === "done" ? `Vào Xưởng, chạm ô Cối xay để lắp (${fmtNum(L.MACHINE["coi-xay"].buildCost)} xu).` : `<span class="miss">Cần xây Xưởng chế biến trước.</span>`}</li>`;
      else if (status === "building") rows += `<li>Đang lắp — xong sau <b>${fmtLeft(it.remainingMs)}</b></li>`;
    } else if (status === "building") {
      const u = it.upgrading, prog = u ? u.progress : it.progress, left = u ? u.remainingMs : it.remainingMs;
      rows += aboutHtml(L.about(id, u ? u.toLevel : 1, u ? u.toLevel - 1 : 0), "Xong sẽ được:");
      rows += `<li>${u ? `Nâng lên cấp ${u.toLevel}` : "Đang xây"} — còn <b>${fmtLeft(left)}</b>. Tắt máy vẫn xây tiếp.</li><li><div class="bc-bar"><i style="width:${Math.round(prog * 100)}%"></i></div></li>`;
    } else if (step) {
      const okCoins = s.coins >= step.cost;
      rows += aboutHtml(L.about(id, toLv, it.level)); // m7: công dụng trước giá; nâng cấp ⇒ "Kho: 60 → 90 chỗ"
      rows += `<li>Giá: ${iconHtml("dong-xu", "it--sm")}<b class="${okCoins ? "ok" : "miss"}">${fmtNum(step.cost)} xu</b> (bạn có ${fmtNum(s.coins)})</li>`;
      for (const [m, q] of Object.entries(step.materials)) {
        const have = L.have(s, m);
        rows += `<li>${iconHtml(m, "it--sm")}${esc(L.ITEM[m].name)}: <b class="${have >= q ? "ok" : "miss"}">${have}/${q}</b></li>`;
      }
      rows += `<li>Thời gian: <b>${step.ms ? fmtLeft(step.ms) + "</b> — tắt máy vẫn xây tiếp" : "xây ngay</b>"}</li>`;
      if (s.level < step.unlock) rows += `<li class="miss">${isUp ? "Nâng" : "Xây"} được từ cấp ${step.unlock} (bạn đang cấp ${s.level})</li>`;
    } else rows += `<li>${it.level >= def.levels.length && def.levels.length > 1 ? "Đã nâng tối đa." : "Đã xây xong."}</li>` + aboutHtml(L.about(id, Math.max(1, it.level), 0), "Bạn đang có:");
    const statusTxt = !inMs ? (s.level >= def.levels[0].unlock ? "Khoá · sắp có" : `Khoá · Cấp ${def.levels[0].unlock}`) : status === "locked" ? `Khoá · Cấp ${it.unlockLevel}` : STATUS_TEXT[status];
    const html = `<div class="bc-head">${picHtml}<div><span class="bc-status" data-s="${status}">${statusTxt}</span><small>${lvTxt}</small></div></div><ul>${rows}</ul>`;
    ui.buildTitle.textContent = title;
    setHtml(ui.buildBody, html);
    // nút
    const can = inMs && !!step && status !== "building" && s.level >= step.unlock && (isUp ? status === "upgradeable" : status === "available");
    const err = can ? affordErr(step) : null;
    ui.buildOk.hidden = !(inMs && step && status !== "building" && (status === "available" || status === "upgradeable" || (status === "locked" && step)));
    ui.buildOk.disabled = !can || !!err;
    ui.buildOk.textContent = !can ? (step && s.level < step.unlock ? `Cần cấp ${step.unlock}` : "Chưa xây được") : err === "coins" ? "Thiếu xu" : err === "materials" ? "Thiếu vật liệu" : `${isUp ? "Nâng cấp" : "Xây"} · ${fmtNum(step.cost)} xu`;
    ui.buildOk.dataset.action = isUp ? "startUpgrade" : "startBuild";
    const enter = inMs && (status === "done" || status === "upgradeable" || (machine && status === "available")) ? (enterOf(id) || (machine && L.workshopState(s, t) === "done" ? { label: "Vào Xưởng" } : null)) : null;
    ui.buildEnter.hidden = !enter; if (enter) ui.buildEnter.textContent = enter.label;
    ui.buildCancel.textContent = ui.buildOk.hidden && !enter ? "Đóng" : "Để sau";
    if (!live) ui.ovBuild.querySelector(".build-card").scrollTop = 0;
  }
  const closeBuild = () => { const id = cardFor; ui.ovBuild.hidden = true; cardFor = null; fmap.el(id)?.focus({ preventScroll: true }); };
  function confirmBuild() {
    const id = cardFor, type = ui.buildOk.dataset.action;
    if (!id || ui.buildOk.disabled) return;
    ui.ovBuild.hidden = true; cardFor = null;
    exec({ type, id }, { el: fmap.el(id) });
  }

  // ---- trang trí: chạm ô (chế độ Xây) ⇒ chọn món trong túi để đặt, hoặc cất món đang đặt ----
  function slotTap(slotId) {
    decorFor = slotId;
    renderDecorSheet();
    ui.ovDecor.hidden = false;
    ui.decorBody.querySelector("button:not([disabled])")?.focus();
    sfx.play("buoc-nhay", 0.35, 1.15);
  }
  function renderDecorSheet() {
    const slot = L.DECOR_SLOT[decorFor];
    if (!slot) { ui.ovDecor.hidden = true; return; }
    const placed = (s.decorPlaced || []).find((d) => d.slot === decorFor);
    let html = `<div class="rc-head"><b id="decorTitle">${placed ? "Đồ trang trí" : `Đặt trang trí · ô ${slot.size === "l" ? "lớn" : "nhỏ"}`}</b>` +
      `<button class="btn btn--sm rc-close" type="button" data-act="close" aria-label="Đóng">✕</button></div>`;
    if (placed) {
      const d = L.DECOR_ITEM[placed.id];
      html += `<ul class="dc-list"><li class="dc-row">${iconHtml(placed.id)}<div><b>${esc(d.name)}</b><br><small>Đang đặt ở ô này${d.rare ? " · đồ hiếm" : ""}</small></div>` +
        `<button class="btn btn--teal" type="button" data-act="remove" data-key="dc-remove">Cất vào túi</button></li></ul>`;
    } else {
      const ids = Object.keys(s.decor || {}).filter((k) => s.decor[k] > 0 && L.DECOR_ITEM[k]);
      if (!ids.length) html += `<p class="rc-note">Túi trang trí trống. Cô Hai bán chậu hoa, ghế tre, cỏ lau, đống bí ngô ở Khu chợ (đồ hiếm từ cấp 19).</p>` +
        `<div class="actions"><button class="btn btn--primary" type="button" data-act="market">Đến Khu chợ</button></div>`;
      else html += `<ul class="dc-list">${ids.map((k) => {
        const d = L.DECOR_ITEM[k], big = d.size === "l" && slot.size !== "l", low = s.level < d.unlock;
        return `<li class="dc-row">${iconHtml(k)}<div><b>${esc(d.name)} <span class="qty">×${s.decor[k]}</span></b><br><small>${d.size === "l" ? "Đồ lớn — chỉ đặt ở ô lớn" : "Đồ nhỏ"}${d.rare ? " · hiếm" : ""}</small></div>` +
          `<button class="btn btn--primary btn--sm" type="button" data-act="place" data-id="${k}" data-key="dc-${k}"${big || low ? " disabled" : ""}>${big ? "Cần ô lớn" : low ? `Cấp ${d.unlock}` : "Đặt"}</button></li>`;
      }).join("")}</ul><p class="rc-note">Đồ đặt rồi vẫn cất lại túi được bất cứ lúc nào.</p>`;
    }
    setHtml(ui.decorBody, html);
  }
  const closeDecor = () => { ui.ovDecor.hidden = true; const id = decorFor; decorFor = null; fmap.slotEl(id)?.focus?.({ preventScroll: true }); };
  ui.decorBody.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || b.disabled) return;
    const slot = decorFor;
    if (b.dataset.act === "close") return closeDecor();
    if (b.dataset.act === "market") { closeDecor(); setBuildMode(false, true); goScene("market"); return; }
    ui.ovDecor.hidden = true; decorFor = null;
    if (b.dataset.act === "place") exec({ type: "placeDecor", id: b.dataset.id, slot }, { slot });
    else if (b.dataset.act === "remove") exec({ type: "removeDecor", slot }, { slot });
  });

  // ---- Nhà kính: bảng riêng với 6 (9) ô, hạt chọn riêng (mía mặc định) ----
  function openGreenhouse() {
    ui.ovGh.hidden = false;
    renderGreenhouse();
    sfx.play("buoc-nhay", 0.4, 1.15);
    (ui.ghSeeds.querySelector('[aria-checked="true"]') || ui.ghClose).focus();
  }
  function renderGreenhouse() {
    if (ui.ovGh.hidden) return;
    const crops = L.CROPS.filter((c) => c.id === "mia" || L.FIELD_CROPS.includes(c));
    if (!L.cropUnlocked(s, ghPick)) ghPick = crops.find((c) => L.cropUnlocked(s, c.id))?.id || "ca-rot";
    setHtml(ui.ghSeeds, crops.map((c) => {
      const ok = L.cropUnlocked(s, c.id);
      return `<button type="button" class="gh-seed${ok ? "" : " locked"}" role="radio" aria-checked="${ghPick === c.id}" data-id="${c.id}" data-key="gh-${c.id}"${ok ? "" : ' aria-disabled="true"'}>${iconHtml(c.id)}${esc(c.name)} <small>${ok ? c.seed + " xu" : "cấp " + c.level}</small></button>`;
    }).join(""));
    const open = s.plots.filter((p) => p.gh && p.open).length;
    ui.ghNote.textContent = `${open} ô · gieo xong là tự tưới (chín nhanh như đã tưới). ` + (open < 9 ? `Nâng Nhà kính (cấp 16) để có 9 ô.` : "");
  }
  ui.ghSeeds.addEventListener("click", (e) => {
    const b = e.target.closest(".gh-seed");
    if (!b) return;
    if (!L.cropUnlocked(s, b.dataset.id)) { toast(`${L.CROP[b.dataset.id].name} mở ở cấp ${L.CROP[b.dataset.id].level}.`); sfx.play("trung-da", 0.3); return; }
    ghPick = b.dataset.id; sfx.play("buoc-nhay", 0.3, 1.3); renderGreenhouse();
  });
  ui.ghClose.onclick = () => { ui.ovGh.hidden = true; fmap.el("nha-kinh")?.focus({ preventScroll: true }); };

  // ---------- m7: thẻ chúc mừng khi xây / nâng xong + thẻ "Kho đầy" (một lần) ----------
  const cel = { ov: $("ovCelebrate"), card: $("ovCelebrate").querySelector(".cel-card"), stage: $("celStage"), pic: $("celPic"), ribbon: $("celRibbon"),
    title: $("celTitle"), body: $("celBody"), go: $("celGo"), later: $("celLater"), more: $("celMore"), share: $("celShare") };
  /** Hình công trình cỡ hiển thị = bội 0,5 px thiết bị (PLAYBOOK §2), không quá ~150 px CSS. */
  function picHtml(sp, max = 150) {
    sp = sp && resolveSprite(sp);
    if (!sp) return `<span class="cel-pic cel-pic--field" aria-hidden="true"></span>`;
    const dpr = window.devicePixelRatio || 1;
    const fit = (w, h) => { const k = Math.max(0.5, Math.floor((max * dpr) / Math.max(w, h) / 0.5) * 0.5) / dpr; return [Math.round(w * k), Math.round(h * k)]; };
    if (sp.sheet === "garden") {
      const [w0, h0] = GARDEN[sp.id] || [192, 192], [w, h] = fit(w0, h0);
      return `<img class="cel-pic${sp.filter ? " spr--" + sp.filter : ""}" src="assets/garden/${sp.id}.webp" alt="" style="width:${w}px;height:${h}px">`;
    }
    const css = spriteCss(sp.sheet, sp.id), sh = spriteSheet(sp.sheet), f = spriteFrame(sp.sheet, sp.id);
    if (!css || !f) return `<span class="cel-pic cel-pic--field" aria-hidden="true"></span>`;
    const [w, h] = fit(sh?.frameWidth || f.width, sh?.frameHeight || f.height);
    return `<span class="cel-pic" style="${css};width:${w}px;height:${h}px" aria-hidden="true"></span>`;
  }
  /** Thẻ đang chờ (thứ tự: công trình → máy → mẹo kho đầy). Level đã xem cao hơn thật (bản lưu bị thay) ⇒ hạ xuống cho khớp, không thẻ. */
  function pendingCards(t) {
    const out = [];
    let dirty = false;
    for (const id of CEL_BUILDINGS) {
      if (!L.inMilestone(id)) continue;
      const lv = L.levelOf(s, id, t), was = seen.b[id] ?? (L.BUILDING[id].kind === "prebuilt" ? 1 : 0);
      if (lv > was) out.push({ kind: "building", id, to: lv, from: was });
      else if (lv < was) { seen.b[id] = lv; dirty = true; }
    }
    for (const id of CEL_MACHINES) {
      const lv = machineLv(id, t), was = seen.m[id] ?? 0;
      if (lv > was) out.push({ kind: "machine", id, to: lv, from: was });
      else if (lv < was) { seen.m[id] = lv; dirty = true; }
    }
    if (!seen.tip.overflow && L.overflowCount(s) > 0) out.push({ kind: "tip", id: "overflow" });
    if (dirty) writeSeen();
    return out;
  }
  /** Hiện thẻ kế tiếp nếu rảnh: không đè bảng khác (Cách chơi / thẻ xây / Sổ…) — thẻ chờ tới khi các bảng đó đóng. */
  function pumpCards() {
    if (!celReady || celCur || document.hidden) return;
    if (performance.now() < celHold) return;
    if (document.querySelector(".ov:not([hidden]):not(#ovCelebrate)")) return;
    const list = pendingCards(now());
    if (list.length) showCard(list[0], list.length - 1);
  }
  function showCard(c, more) {
    celCur = c;
    const t = now();
    let a, sp, ribbon;
    if (c.kind === "tip") {
      a = { title: "Kho đầy rồi!", tip: true };
      sp = L.levelOf(s, "nha-kho", t) >= 1 ? L.BUILDING["nha-kho"].levels[Math.max(0, L.levelOf(s, "nha-kho", t) - 1)].sprite : L.BUILDING["nha-kho"].levels[0].sprite;
      ribbon = "Mẹo nhỏ";
    } else if (c.kind === "machine") {
      a = L.about(c.id, c.to, c.from, "machine");
      const def = L.MACHINE[c.id], big = c.id === "lo-banh" && c.to >= 2;
      sp = { sheet: big ? "machines-2" : def.sheet || "machines", id: `${big ? "lo-banh-2" : def.sprite}-idle` };
      ribbon = c.from ? "Lên cấp!" : "Lắp xong!";
    } else {
      a = L.about(c.id, c.to, c.from);
      sp = c.id === "dat-phia-dong" ? null : L.BUILDING[c.id].levels[c.to - 1]?.sprite;
      ribbon = c.from ? "Lên cấp!" : c.id === "dat-phia-dong" ? "Mở đất!" : "Xây xong!";
    }
    cel.ribbon.textContent = ribbon;
    cel.title.textContent = a.title;
    c.sp = sp; cel.pic.innerHTML = picHtml(sp);
    cel.body.innerHTML = a.tip
      ? `<p class="cel-use">Hàng mới vào <b>giỏ tràn</b> (tối đa ${L.OVERFLOW_MAX}). Bán bớt, giao đơn hoặc nâng kho để có thêm chỗ.</p>` +
        `<p class="cel-next"><b>Làm gì tiếp:</b> Mở Nhà kho, bấm “Bán nhanh giỏ tràn” hoặc nâng kho.</p>`
      : `<p class="cel-use"><b>Dùng để:</b> ${esc(a.use)}</p><p class="cel-h">Bạn được:</p>` +
        `<ul class="cel-gain">${a.gain.map((g) => `<li>${gainHtml(g)}</li>`).join("")}</ul><p class="cel-next"><b>Làm gì tiếp:</b> ${esc(a.next)}</p>`;
    cel.go.textContent = a.tip ? "Mở Nhà kho" : "Vào xem ngay";
    cel.more.hidden = !more; cel.more.textContent = more ? `Còn ${more} thẻ nữa` : "";
    cel.share.hidden = !(c.kind === "building" && c.id === "nha" && c.from >= 1 && c.to > c.from); // nâng Nhà ⇒ danh hiệu danh tiếng mới: nút khoe
    cel.card.dataset.kind = c.kind; cel.card.dataset.id = c.id;
    // pháo giấy pixel: vài ô vuông màu rơi xuống (CSS steps), mỗi lần hiện đổi chỗ
    const conf = cel.stage.querySelector(".cel-confetti");
    conf.innerHTML = Array.from({ length: 14 }, (_, k) => `<i style="--x:${4 + ((k * 37) % 92)}%;--d:${(k % 7) * 70}ms;--c:${["#ffc94a", "#7fd47f", "#4aa8e0", "#e0483d", "#ffe9a8"][k % 5]}"></i>`).join("");
    celFocus = document.activeElement;
    cel.ov.hidden = false;
    cel.card.classList.remove("cel-in"); void cel.card.offsetWidth; cel.card.classList.add("cel-in");
    cel.card.scrollTop = 0;
    cel.go.focus({ preventScroll: true });
    sfx.play(a.tip ? "trung-da" : "qua-man", a.tip ? 0.5 : 0.85, a.tip ? 1.2 : 1);
    setTimeout(() => { if (!cel.ov.hidden) playFx(cel.stage, "lap-lanh", cel.stage.clientWidth / 2, cel.stage.clientHeight / 2, 96); }, 180);
  }
  /** Đóng thẻ (cả hai nút): ghi "đã xem" rồi mới làm việc tiếp; thẻ sau chờ ~0,8 s để người chơi kịp nhìn chỗ vừa mở. */
  function closeCard(goTo) {
    const c = celCur;
    if (!c) return;
    if (c.kind === "tip") seen.tip.overflow = 1;
    else if (c.kind === "machine") seen.m[c.id] = Math.max(seen.m[c.id] || 0, c.to);
    else seen.b[c.id] = Math.max(seen.b[c.id] || 0, c.to);
    writeSeen();
    cel.ov.hidden = true; celCur = null;
    celHold = pendingCards(now()).length ? performance.now() + 800 : 0; // còn thẻ dồn ⇒ nghỉ chút; thao tác mới của người chơi thì thẻ hiện ngay
    sfx.play("buoc-nhay", 0.35, goTo ? 1.2 : 0.9);
    if (goTo) celGoTo(c);
    else if (celFocus?.isConnected && celFocus.offsetParent) celFocus.focus({ preventScroll: true });
    celFocus = null;
  }
  /** "Vào xem ngay": cảnh / bảng của công trình nếu có; không có ⇒ cuộn bản đồ tới, viền vàng nhấp nháy + mũi tên. */
  function celGoTo(c) {
    if (buildMode) setBuildMode(false, true);
    if (c.kind === "tip") { if (scene !== "farm") goScene("farm", true); openPanel("stock"); ui.warehouse.scrollIntoView({ block: "nearest" }); return; }
    if (c.kind === "machine") {
      goScene("workshop");
      const el = ui.wsRoot.querySelector(`.mach[data-m="${c.id}"]`);
      if (el) { el.scrollIntoView({ block: "nearest", inline: "center" }); spot(el); }
      return;
    }
    const e = enterOf(c.id);
    if (e) { if (scene !== "farm") goScene("farm", true); e.go(); return; }
    if (scene !== "farm") goScene("farm", true);
    const east = c.id === "dat-phia-dong", def = L.BUILDING[c.id];
    fmap.scrollToX(east ? L.EAST_FIELD.x + L.EAST_FIELD.w / 2 : def.x, true);
    ui.farm.scrollIntoView({ block: "nearest" });
    spot(east ? ui.fieldEast : fmap.el(c.id));
  }
  function spot(el) {
    if (!el) return;
    el.classList.remove("spot"); void el.offsetWidth; el.classList.add("spot");
    clearTimeout(el._spotT); el._spotT = setTimeout(() => el.classList.remove("spot"), 4200);
  }
  cel.go.onclick = () => closeCard(true);
  cel.later.onclick = () => closeCard(false);
  // Khoe danh hiệu Nhà: thẻ chúc mừng vẫn mở (bảng chia sẻ nổi trên), đóng bảng là quay lại thẻ
  cel.share.onclick = () => { const c = celCur; if (c?.id === "nha") shareResult(farmShare(s, "fame", null, c.to)); };
  cel.ov.addEventListener("click", (e) => { if (e.target === cel.ov) closeCard(false); });
  celReady = true;

  // ---------- Milestone 6: Sổ sưu tập + Phiên chợ (nút Chợ) ----------
  function renderFairNav(t) {
    const f = L.activeFair(s, t);
    setHtml(ui.mkTool, "Chợ" + (f ? `<span class="nav-badge nav-badge--fair">Hội</span>` : ""));
    ui.mkTool.setAttribute("aria-label", f ? "Chợ — đang có Phiên chợ" : "Chợ");
    ui.mkTool.classList.toggle("is-fair", !!f);
  }
  function renderBook() {
    const v = L.bookView(s);
    setHtml(ui.bookBtn, `${iconHtml("so-suu-tap", "it--sm")}<span><span class="bk-name">Sổ </span>${v.unlocked}/${v.total}</span>` + (v.claimable >= 0 ? `<span class="nav-badge">!</span>` : ""));
    ui.bookBtn.setAttribute("aria-label", `Sổ sưu tập: ${v.unlocked}/${v.total} món` + (v.claimable >= 0 ? " — có thưởng chờ nhận" : ""));
    if (ui.ovBook.hidden) return;
    let html = `<div class="rc-head"><div><b id="bookTitle">Sổ sưu tập</b><br><small>${v.title ? `Danh hiệu: “${esc(v.title)}” · ` : ""}${v.unlocked}/${v.total} món — mỗi món tự ghi khi bạn thu / làm ra lần đầu</small></div>` +
      `<button class="btn btn--sm rc-close" type="button" data-act="close" aria-label="Đóng Sổ sưu tập">✕</button></div>`;
    html += `<div class="px-bar book-bar" aria-hidden="true"><i style="width:${Math.round((100 * v.unlocked) / v.total)}%"></i></div>`;
    html += `<div class="book-share"><button class="btn btn--sm" type="button" data-act="share" id="shareBook">Khoe kết quả</button></div>`;
    html += `<ul class="book-tiers">${v.tiers.map((x) => {
      const r = x.reward, gift = [`${iconHtml("dong-xu", "it--xs")}${fmtNum(r.coins)}`, ...Object.entries(r.items).map(([id, q]) => `${iconHtml(id, "it--xs")}${q}`), ...Object.entries(r.decor).map(([id, q]) => `${iconHtml(id, "it--xs")}${q}`)].join(" ");
      const btn = x.claimed ? `<span class="book-done">Đã nhận</span>` : v.claimable === x.k ? `<button class="btn btn--primary btn--sm" type="button" data-act="claim" data-tier="${x.k}" data-key="book-claim-${x.k}">Nhận</button>` : `<span class="book-need">${Math.min(v.unlocked, x.at)}/${x.at}</span>`;
      return `<li class="${x.claimed ? "done" : x.reached ? "ready" : ""}"><b>${x.at} món</b><small>“${esc(x.title)}”</small><span class="book-gift">${gift}</span>${btn}</li>`;
    }).join("")}</ul>`;
    for (const g of L.BOOK_GROUPS) {
      const es = v.entries.filter((e) => e.cat === g.id);
      html += `<h3>${esc(g.name)} <small>${es.filter((e) => e.unlocked).length}/${es.length}</small></h3><ul class="book-grid">` + es.map((e) =>
        `<li class="book-entry${e.unlocked ? "" : " locked"}" data-id="${e.id}" title="${esc(e.unlocked ? `${e.name}: đã có ${e.count}` : `${e.name} — ${e.source}`)}">${iconHtml(e.id)}<b>${e.unlocked ? esc(e.name) : "???"}</b><small>${e.unlocked ? "×" + fmtNum(e.count) : esc(e.source.split(" · ")[0])}</small></li>`).join("") + `</ul>`;
    }
    if (v.claimed >= v.tiers.length) html += `<p class="rc-note">Đã nhận mọi mốc — nông trại của bạn đã là “${esc(v.title)}”.</p>`;
    setHtml(ui.bookBody, html);
  }
  function showBook(on) {
    ui.ovBook.hidden = !on;
    if (on) { renderBook(); ui.ovBook.querySelector(".book-card").scrollTop = 0; (ui.bookBody.querySelector('[data-act="claim"]') || ui.bookBody.querySelector('[data-act="close"]'))?.focus(); sfx.play("buoc-nhay", 0.35, 1.15); }
    else ui.bookBtn.focus({ preventScroll: true });
  }
  ui.bookBtn.onclick = () => showBook(true);
  ui.ovBook.addEventListener("click", (e) => { if (e.target === ui.ovBook) showBook(false); });
  ui.bookBody.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || b.disabled) return;
    if (b.dataset.act === "close") return showBook(false);
    if (b.dataset.act === "share") return void shareResult(farmShare(s, "title"));
    if (b.dataset.act === "claim") exec({ type: "claimBook", tier: Number(b.dataset.tier) }, { el: b });
  });

  // ---------- cảnh ----------
  const HASH = { workshop: "#xuong", market: "#cho", animals: "#chan-nuoi", village: "#lang" };
  function goScene(next, quiet) {
    if (next === "workshop" && L.workshopState(s, now()) !== "done") next = "farm";
    if (next === "animals" && s.level < ANIMALS_LEVEL) next = "farm";
    if (next === "village" && s.level < L.VILLAGE_LEVEL) next = "farm";
    if (!["farm", "workshop", "market", "animals", "village"].includes(next)) next = "farm";
    const prev = scene;
    scene = next;
    document.body.dataset.scene = next;
    if (next === "workshop") workshop.show(); else workshop.hide();
    if (next === "market") market.show(); else market.hide();
    if (next === "animals") animals.show(); else animals.hide();
    if (next === "village") village.show(); else village.hide();
    try { history.replaceState(null, "", location.pathname + location.search + (HASH[next] || "")); } catch {}
    if (prev !== next) {
      if (!quiet) sfx.play("buoc-nhay", 0.4, next === "farm" ? 0.9 : 1.15);
      window.scrollTo({ top: Math.max(0, document.querySelector(".wrap").offsetTop - 4) });
      const shown = (id) => { const el = fmap.el(id); return el && !el.hidden ? el : null; };
      const back = { workshop: ui.lot, market: ui.market, animals: shown("chuong-ga") || shown("chuong-bo") || ui.animalsTool, village: shown("bien-lang") || ui.villageTool };
      const focus = next === "farm" ? back[prev] || ui.market : document.querySelector(`#${next}Scene [data-back], #${next}Scene [data-act="back"]`);
      if (next !== "farm") buildMode = false;
      focus?.focus({ preventScroll: true });
    }
    render();
  }
  function plantSeed(crop) {
    const c = L.CROP[crop];
    if (!L.cropUnlocked(s, crop)) { toast(`${c.name} mở ở cấp ${c.level}.`); sfx.play("trung-da", 0.3); return; }
    pick = crop; goScene("farm"); selectMode("seed");
    toast(`Đã chọn hạt ${c.name.toLowerCase()} — chạm ô đất trống để gieo, trả ${c.seed} xu mỗi hạt.`);
  }
  const sceneCtx = {
    L, esc, fmtNum, fmtClock, fmtLeft, iconHtml, until: (x) => until(x), setHtml: (el, h) => setHtml(el, h),
    get s() { return s; }, now, exec: (a, o) => exec(a, o), toast: (m, ms) => toast(m, ms), sfx: (...a) => sfx.play(...a), floatAt, plantSeed,
  };
  workshop = createWorkshopScene(sceneCtx); market = createMarketScene(sceneCtx);
  ui.wsRoot = workshop.root; ui.mkRoot = market.root;
  // Milestone 4: cảnh Chăn nuôi + Làng tự dựng DOM / style trong .wrap (vùng "world"); ctx luật dùng chung với apply() (core/apply.js rulesCtx)
  const m4ctx = { ...sceneCtx, host: document.querySelector(".wrap"), onBack: () => goScene("farm"), rulesCtx: () => L.rulesCtx(s, now()) };
  Object.defineProperty(m4ctx, "s", { get: () => s }); // spread chép giá trị getter ⇒ đặt lại getter để luôn đọc trạng thái mới
  animals = createAnimalsScene(m4ctx); village = createVillageScene(m4ctx);
  truck = createTruck(ui.truckLane, { now, lastDeliveryAt: () => s.lastDeliveryAt, level: () => s.level });
  loadSprites().then(() => { fmap.invalidate(); render(); if (celCur) cel.pic.innerHTML = picHtml(celCur.sp); }); // thẻ hiện trước khi sprite nạp ⇒ vẽ lại hình

  function render() {
    renderHud();
    renderMap(now());
    renderM4(now());
    renderGreenhouse();
    workshop?.render();
    market?.render();
    animals?.render(); village?.render(); // cảnh ẩn tự bỏ qua
    renderWarehouse();
    renderOrders();
    renderBook();
    renderQuest();
    renderField(now());
    pumpCards();
  }
  /** Mỗi giây: đồng hồ trên phiếu đơn; luật đồng bộ theo thời gian (lấp đơn, hết hạn, lưới an toàn) khi cần. */
  function second() {
    if (document.hidden) return;
    const t = now();
    for (const el of document.querySelectorAll("[data-until]")) el.textContent = fmtClock(Number(el.dataset.until) - t);
    if (scene === "farm") renderMap(t);
    renderM4(t);
    markTruck();
    if (!ui.ovGh.hidden) renderField(t);
    if (scene === "workshop") workshop.render(); else if (scene === "market") market.render();
    const fin = L.finishedJobs(s, t);
    if (fin > lastFinished) {
      const done = Object.entries(s.production.machines).flatMap(([id, m]) => m.queue.filter((j) => j.endAt <= t && j.endAt > t - 1500).map((j) => `${L.MACHINE[id].name} xong ${L.RECIPE[j.recipe].name}`));
      if (done.length) { toast(done.join(" · ") + (scene === "workshop" ? " — chạm ô để nhận!" : " — vào Xưởng để nhận!"), 3200); sfx.play("trung-kim-cuong", 0.35, 1.3); pulse(ui.lot); pulse(ui.wsTool); }
    }
    lastFinished = fin;
    pumpCards();
    if (L.needsSync(s, t)) mutate(() => { const r = L.apply(s, { type: "tick" }, now()); if (r.ok && r.events.length) { persist(); feedback(r.events, { tick: true }); render(); } });
  }

  // ---------- hành động ----------
  function choose(id) {
    if (!L.cropUnlocked(s, id)) { toast(`${L.CROP[id].name} mở khoá ở cấp ${L.CROP[id].level}.`); sfx.play("trung-da", 0.4); return; }
    pick = id; selectMode("seed"); sfx.play("buoc-nhay", 0.3, 1.3); render();
  }
  function fail(code, action) {
    if (M4_ACTIONS.has(action?.type)) { toast(animals.errorText(code) || village.errorText(code) || ERR_M4[code] || "Không làm được."); sfx.play("trung-da", 0.4); return; }
    toast((M3_ACTIONS.has(action?.type) && ERR_M3[code]) || (M2_ACTIONS.has(action?.type) && ERR_M2[code]) || ERR[code] || ERR_M2[code] || ERR_M3[code] || "Không làm được."); sfx.play("trung-da", 0.4); }
  function act(i) {
    const p = s.plots[i], t = now();
    if (!p.open) {
      if (!L.hasFeature(s, "plots")) return fail("plots-level");
      if (!L.canBuy(s, i)) return fail("far");
      const cost = L.plotCost(s);
      if (confirmAt !== i) { // bấm 2 lần mới mua — tránh lỡ tay tiêu xu
        confirmAt = i; clearTimeout(confirmT); confirmT = setTimeout(() => { confirmAt = -1; render(); }, 2500);
        toast(`Bấm lần nữa để mở ô này với giá ${cost} xu.`); sfx.play("buoc-nhay", 0.35, 1.2); render(); return;
      }
      confirmAt = -1;
      return run({ type: "buyPlot", i });
    }
    if (!p.crop) {
      if (p.gh) return run({ type: "plant", i, crop: ghPick }, { el: cells[i].b }); // Nhà kính: hạt chọn riêng trong bảng Nhà kính
      if (mode === "water") { toast("Ô này chưa có cây để tưới."); sfx.play("trung-da", 0.25); return; }
      return run({ type: "plant", i, crop: pick });
    }
    if (L.isReady(p, t)) return run({ type: "harvest", i });
    if (!p.watered) return run({ type: "water", i });
    toast(`${L.CROP[p.crop].name} còn ${fmtLeft(p.readyAt - t)} nữa mới chín.`); sfx.play("trung-da", 0.25);
  }

  // ---------- điều khiển ----------
  const PANELS = { seed: ui.seeds, water: $("waterHint"), stock: ui.warehouse, orders: ui.orders, upgrade: ui.upgrades };
  function selectMode(next) {
    const tray = (m) => m === "seed" || m === "water";
    if (tray(next) && !tray(mode)) requestAnimationFrame(() => { if (SHORT.matches) centerField(); }); // TLC12-03: bản đồ vừa thành khung cuộn ⇒ ruộng vào giữa
    mode = next;
    for (const [key, button] of [["seed", ui.grow], ["water", ui.water], ["stock", ui.depot], ["orders", ui.orderTool], ["upgrade", ui.improve]]) {
      button.setAttribute("aria-pressed", String(key === mode));
    }
    for (const [key, el] of Object.entries(PANELS)) el.hidden = key !== mode;
    document.body.dataset.panel = mode; // D4: điện thoại dọc — khay dính đáy khi gieo / tưới (index.html)
    render();
  }
  const openPanel = (m) => {
    const prev = mode;
    selectMode(m); sfx.play("buoc-nhay", 0.3, 1.2);
    // D4 (TLC1-05): điện thoại dọc — Kho / Đơn / Nâng cấp dài ⇒ khay thôi dính đáy, cuộn tới khay để bảng hiện ngay dưới nút;
    // quay về Hạt giống / Tưới ⇒ cuộn lại lên ruộng (khay dính đáy trở lại)
    if (!PORTRAIT.matches || scene !== "farm" || prev === m) return;
    const docked = (x) => x === "seed" || x === "water";
    if (!docked(m)) document.querySelector(".farm-controls")?.scrollIntoView({ block: "start" });
    else if (!docked(prev)) window.scrollTo({ top: 0 });
  };
  ui.grow.onclick = () => openPanel("seed");
  ui.water.onclick = () => openPanel("water");
  ui.depot.onclick = () => openPanel("stock");
  ui.orderTool.onclick = () => openPanel("orders"); // Bảng đơn trên bản đồ: farm-map ⇒ bldTap ⇒ enterOf("bang-don-hang")
  ui.improve.onclick = () => openPanel("upgrade");
  ui.mkTool.onclick = () => goScene("market"); // sạp trên bản đồ: bldTap ⇒ enterOf("sap-cho")
  ui.wsTool.onclick = () => (L.workshopState(s, now()) === "done" ? goScene("workshop") : openBuildCard("xuong"));
  ui.animalsTool.onclick = () => openAnimals();
  ui.villageTool.onclick = () => openVillage();
  ui.buildBtn.onclick = () => setBuildMode(!buildMode);
  ui.buildExit.onclick = () => setBuildMode(false);
  ui.pan.onclick = () => {
    const f = ui.farm, atEnd = f.scrollLeft + f.clientWidth >= f.scrollWidth - 8;
    sfx.play("buoc-nhay", 0.3, 1.2);
    if (atEnd) fmap.scrollToX(L.FIELD.x + L.FIELD.w / 2, true); else f.scrollTo({ left: f.scrollWidth, behavior: "smooth" });
  };
  ui.farm.addEventListener("scroll", schedulePan, { passive: true });
  window.addEventListener("resize", schedulePan);
  // khung / bản đồ đổi cỡ (mở Khu đất phía Đông, thanh công cụ xuống dòng…) ⇒ đặt lại nút cuộn
  const panRO = typeof ResizeObserver === "function" ? new ResizeObserver(schedulePan) : null;
  if (panRO) for (const el of [ui.farm, ui.farm.parentElement, ui.farmMap]) if (el) panRO.observe(el);
  ui.buildEnter.onclick = () => { const e = enterOf(cardFor); ui.ovBuild.hidden = true; cardFor = null; e?.go(); };
  ui.buildCancel.onclick = closeBuild;
  ui.buildOk.onclick = confirmBuild;
  for (const b of document.querySelectorAll("[data-back]")) b.onclick = () => goScene("farm");
  ui.sellTool.onclick = () => {
    openPanel("stock");
    (ui.whBody.querySelector('[data-act="sell1"]') || (ui.sell.disabled ? ui.depot : ui.sell)).focus({ preventScroll: true }); // TLC12-01: "Bán 1" trước "Bán hết"
    ui.warehouse.scrollIntoView({ block: "nearest" });
  };
  ui.sell.onclick = () => exec({ type: "sellAll" });
  ui.whBody.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || b.disabled) return;
    const id = b.dataset.id;
    if (b.dataset.act === "sell1") exec({ type: "sell", id, n: 1 });
    else if (b.dataset.act === "sellN") exec({ type: "sell", id });
    else if (b.dataset.act === "sellBasket") exec({ type: "sellOverflow" });
    else if (b.dataset.act === "whUpgrade") exec({ type: "startUpgrade", id: "nha-kho" }, { el: fmap.el("nha-kho") });
    else if (b.dataset.act === "whBuild") { setBuildMode(true, true); openBuildCard("nha-kho"); }
  });
  ui.slips.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || b.disabled) return;
    const slot = L.isSpecialSlot(b.dataset.slot) ? b.dataset.slot : Number(b.dataset.slot), id = Number(b.dataset.id), rev = Number(b.dataset.rev);
    if (b.dataset.act === "deliver") { cancelArm = null; exec({ type: "deliver", slot, id, rev }, { el: b }); return; }
    const arm = `${b.dataset.slot}:${id}`;
    if (cancelArm !== arm) { // bỏ đơn cũng bấm 2 lần cho chắc
      cancelArm = arm; clearTimeout(cancelT); cancelT = setTimeout(() => { cancelArm = null; render(); }, 2500);
      sfx.play("buoc-nhay", 0.35, 1.2); render(); return;
    }
    cancelArm = null;
    exec({ type: "cancelOrder", slot, id, rev });
  });
  // D4 (TLC1-05): điện thoại / xoay ngang — thanh nhiệm vụ một dòng, chạm (hoặc nút mũi tên) để mở / gập chi tiết
  const qMore = $("qMore");
  const toggleQuest = () => {
    const on = !ui.quest.classList.contains("open");
    ui.quest.classList.toggle("open", on); qMore.setAttribute("aria-expanded", String(on));
    qMore.setAttribute("aria-label", on ? "Thu gọn nhiệm vụ" : "Xem chi tiết nhiệm vụ");
    sfx.play("buoc-nhay", 0.25, on ? 1.3 : 1.1);
  };
  qMore.onclick = (e) => { e.stopPropagation(); toggleQuest(); };
  ui.quest.addEventListener("click", (e) => { if (!e.target.closest("button") && qMore.offsetParent) toggleQuest(); });
  ui.qClaim.onclick = () => exec(ui.qClaim.dataset.kind === "village" ? { type: "claimProgressQuest", id: ui.qClaim.dataset.id } : { type: "claimQuest", id: ui.qClaim.dataset.id }, { el: ui.qClaim });
  ui.upgrade.onclick = () => exec({ type: "upgradeFarm" });
  ui.all.addEventListener("click", () => exec({ type: "harvestAll" }));
  function setMuted(m) {
    sdk.sound = sdk.sound || {}; sdk.sound.muted = m;
    try { storage && storage.setItem(MUTE_KEY, m ? "1" : "0"); } catch {}
    ui.mute.setAttribute("aria-pressed", String(m));
    ui.muteIc.src = m ? "assets/ui/icon-am-thanh-tat.png" : "assets/ui/icon-am-thanh-bat.png";
  }
  let muted = !!sdk.sound?.muted;
  try { muted ||= storage?.getItem(MUTE_KEY) === "1"; } catch {}
  setMuted(muted);
  ui.mute.addEventListener("click", () => setMuted(!sdk.sound.muted));
  // TLC1-02: nút "Đã hiểu" nằm cuối bảng ⇒ focus không được kéo bảng xuống cuối (trước đây mở ra đã cuộn tới cuối, mất tiêu đề)
  const showHelp = (on) => { ui.ovHelp.hidden = !on; if (on) { ui.helpOk.focus({ preventScroll: true }); ui.ovHelp.scrollTop = 0; for (const e of ui.ovHelp.querySelectorAll("*")) if (e.scrollTop) e.scrollTop = 0; } else cells[cursor].b.focus({ preventScroll: true }); };
  ui.help.addEventListener("click", () => showHelp(true));
  ui.helpOk.addEventListener("click", () => showHelp(false));
  function onKey(e) {
    if (document.querySelector(".lk-share")) return; // bảng chia sẻ đang mở: phím thuộc về bảng
    if (celCur) { // m7: thẻ chúc mừng — Enter = Vào xem ngay (trừ khi đang ở nút Để sau / Khoe), Esc = Để sau, Tab quanh các nút
      if (e.key === "Escape") { e.preventDefault(); closeCard(false); }
      else if ((e.key === "Enter" || e.key === " ") && document.activeElement === cel.share && !cel.share.hidden) { e.preventDefault(); cel.share.click(); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); closeCard(document.activeElement !== cel.later); }
      else if (e.key === "Tab") {
        e.preventDefault();
        const f = [cel.go, cel.later, cel.share].filter((b) => !b.hidden), i = f.indexOf(document.activeElement);
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
      return;
    }
    if (!ui.ovHelp.hidden) { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); showHelp(false); } return; }
    if (!ui.ovBuild.hidden) { if (e.key === "Escape") { e.preventDefault(); closeBuild(); } return; }
    if (!ui.ovDecor.hidden) { if (e.key === "Escape") { e.preventDefault(); closeDecor(); } return; }
    if (!ui.ovGh.hidden) { if (e.key === "Escape") { e.preventDefault(); ui.ghClose.click(); } return; }
    if (!ui.ovBook.hidden) { if (e.key === "Escape") { e.preventDefault(); showBook(false); } return; }
    if (workshop.onKey(e)) return;
    if (scene !== "farm") {
      if (e.key === "Escape") { e.preventDefault(); goScene("farm"); }
      else if (e.key.toLowerCase() === "m") setMuted(!sdk.sound.muted);
      return;
    }
    if (e.target?.closest?.("button:not(.plot), a") && (e.key === "Enter" || e.key === " ")) return;
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv) {
      if (!e.target?.closest?.(".plot") && e.target !== document.body) return;
      e.preventDefault();
      const x = Math.min(L.W - 1, Math.max(0, (cursor % L.W) + mv[0])), y = Math.min(L.H - 1, Math.max(0, Math.floor(cursor / L.W) + mv[1]));
      cursor = y * L.W + x; cells[cursor].b.focus({ preventScroll: true }); render(); return;
    }
    if (e.key === "Enter" || e.key === " ") { if (e.target.closest && e.target.closest(".plot")) return; e.preventDefault(); mutate(() => act(cursor)); return; }
    if (/^[1-6]$/.test(e.key) && L.FIELD_CROPS[+e.key - 1]) { choose(L.FIELD_CROPS[+e.key - 1].id); return; }
    const k = e.key.toLowerCase();
    if (k === "h") exec({ type: "harvestAll" });
    else if (k === "b") setBuildMode(!buildMode);
    else if (k === "escape" && buildMode) setBuildMode(false);
    else if (k === "m") setMuted(!sdk.sound.muted);
  }
  window.addEventListener("keydown", onKey);
  function onStorage(e) {
    if (e.key === MUTE_KEY && e.newValue !== null) { // tắt / bật tiếng ở tab khác (trang chủ, game khác) ⇒ theo khoá chung wgp.muted
      sdk.sound = sdk.sound || {}; sdk.sound.muted = e.newValue === "1";
      ui.mute.setAttribute("aria-pressed", String(sdk.sound.muted)); ui.muteIc.src = sdk.sound.muted ? "assets/ui/icon-am-thanh-tat.png" : "assets/ui/icon-am-thanh-bat.png";
      return;
    }
    if (e.storageArea !== storage || document.hidden) return;
    const current = save.read(now());
    if (!current.fresh) { s = current.state; render(); }
  }
  const onLeave = () => save.touch(now());
  function onVisibility() {
    if (document.hidden) { clearTimeout(tickTimer); onLeave(); }
    else { const current = save.read(now()); if (!current.fresh) s = current.state; render(); second(); }
  }
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("storage", onStorage);
  selectMode("seed");

  // ---------- chào mừng / vắng mặt ----------
  const away = L.readyWhileAway(s, now()), awayJobs = L.finishedWhileAway(s, now());
  const awayAnimals = L.animalsReadyWhileAway(s.animals, s.lastSeen, now());
  const awayGoods = Object.entries(awayAnimals).filter(([, n]) => n > 0).map(([id, n]) => `${n} ${L.ITEM[id].name.toLowerCase()}`);
  lastFinished = L.finishedJobs(s, now());
  mutate(() => {
    const r = L.apply(s, { type: "tick" }, now());
    const newOrders = r.ok ? r.events.filter((e) => e.type === "orderNew").length : 0;
    if (r.ok && r.events.length) { persist(); render(); }
    if (r.ok) feedback(r.events.filter((e) => e.type === "gift" || e.type === "levelUp"));
    const hashScene = Object.keys(HASH).find((k) => HASH[k] === location.hash);
    if (hashScene) goScene(hashScene, true);
    if (fresh) showHelp(true);
    else if (migrated && first.from === "v6") toast("Nông trại đã cập nhật: Sổ sưu tập 30 món (nút Sổ), 6 công thức mới, hàng rào đá (cấp 15), Phiên chợ và đơn đặc biệt hai lúc (cấp 18). Tiến trình vẫn giữ nguyên!", 5600);
    else if (migrated && first.from === "v5") toast("Nông trại đã cập nhật: Chăn nuôi (chuồng gà cấp 7, chuồng bò cấp 9) và Làng với 4 người bạn (cấp 6). Tiến trình vẫn giữ nguyên!", 5600);
    else if (migrated && first.from === "v4") toast("Nông trại đã cập nhật: chế độ Xây (nút búa) — Nhà kho, Nhà kính, Khu đất phía Đông và trang trí trên bản đồ. Tiến trình và kho đã nâng vẫn giữ nguyên!", 5600);
    else if (migrated && first.from === "v3") toast("Nông trại đã cập nhật: có Xưởng chế biến (từ cấp 4) và Khu chợ với giá đổi theo giờ. Tiến trình cũ vẫn giữ nguyên!", 5200);
    else if (migrated) toast("Nông trại đã được nâng cấp: có Bảng đơn, Nhà kho có sức chứa và nhiệm vụ của Chị Ba. Tiến trình cũ vẫn giữ nguyên!", 5200);
    else if (away || newOrders || awayJobs || awayGoods.length) { // công trình xây xong lúc vắng: thẻ chúc mừng riêng (m7), không nhắc lại ở đây
      const parts = [away && `${away} ô đã chín`, awayJobs && `Xưởng xong ${awayJobs} mẻ`, awayGoods.length && `${awayGoods.join(", ")} chờ thu ở chuồng`, newOrders && `${newOrders} đơn mới trên bảng`].filter(Boolean);
      toast(`Trong lúc bạn vắng: ${parts.join(" · ")}.` + (away ? ' Bấm "Thu hết" để gom!' : ""), 4200);
    }
  });
  secTimer = setInterval(second, 1000);
  document.body.classList.add("nt-ready"); // đã vẽ xong lần đầu ⇒ hiện bố cục (index.html giữ ẩn trước đó, tránh nhảy bố cục)
  // khung hẹp: bản đồ rộng hơn màn ⇒ đặt ruộng vào giữa khung cuộn
  // D4: xoay ngang bản đồ có thể cao hơn khung ⇒ đặt ruộng vào giữa theo chiều dọc; xoay máy thì đặt lại
  const centerField = () => {
    if (scene !== "farm") return;
    fmap.scrollToX(L.FIELD.x + L.FIELD.w / 2);
    const f = ui.farm, over = f.scrollHeight - f.clientHeight;
    f.scrollTop = over > 4 ? Math.max(0, Math.min(over, (L.FIELD.y + L.FIELD.h / 2) * f.scrollHeight - f.clientHeight / 2)) : 0;
  };
  requestAnimationFrame(centerField);
  const LANDSCAPE = matchMedia("(orientation: landscape) and (max-height: 500px)");
  const SHORT = matchMedia("(max-width: 760px) and (orientation: portrait) and (max-height: 700px)"); // TLC12-03: bản đồ là khung cuộn riêng (index.html)
  const onOrient = () => requestAnimationFrame(centerField);
  LANDSCAPE.addEventListener?.("change", onOrient);
  SHORT.addEventListener?.("change", onOrient);

  return {
    destroy() {
      clearTimeout(tickTimer); clearTimeout(rewardTimer); clearInterval(secTimer); sfx.close(); onLeave(); truck?.destroy(); animals?.hide(); village?.hide();
      window.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("storage", onStorage); window.removeEventListener("resize", schedulePan); panRO?.disconnect(); LANDSCAPE.removeEventListener?.("change", onOrient); SHORT.removeEventListener?.("change", onOrient); cancelAnimationFrame(panRaf);
    },
    // Dành cho test/debug — không phải API cho core.
    get state() { return s; },
    set state(v) { s = v; persist(); render(); },
    get pick() { return pick; },
    get mode() { return mode; },
    get scene() { return scene; },
    goScene,
    /** m7: thẻ chúc mừng — xem thẻ đang hiện / đang chờ; dismissAll() đóng hết và ghi đã xem (test cũ không bị thẻ che nút). */
    cards: {
      get current() { return celCur ? { ...celCur } : null; },
      pending: () => pendingCards(now()),
      get hold() { return Math.max(0, Math.round(celHold - performance.now())); },
      dismissAll() { if (celCur) closeCard(false); for (const c of pendingCards(now())) { celCur = c; closeCard(false); } celHold = 0; },
    },
    get sfx() { return { log: sfx.log.slice() }; },
    now,
    render,
  };
}
