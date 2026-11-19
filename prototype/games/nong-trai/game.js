// Nông Trại — giao diện (DOM + canvas nhỏ mỗi ô), điều khiển (chạm / chuột / phím), lưu tiến trình, âm thanh.
// Luật ở core/ (qua logic.js); mọi thay đổi trạng thái đi qua L.apply(state, action, now) trong run().
import * as L from "./logic.js?v=m2";
import { browserStorage, farmSave } from "./save.js?v=m2";
import { createWorkshopScene } from "./ui/scene-workshop.js?v=m2";
import { createMarketScene } from "./ui/scene-market.js?v=m2";
import { loadSprites, playFx } from "./ui/sprites.js?v=m2";

const MUTE_KEY = "wgp.muted";
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
};
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
const npcOf = (id) => L.NPC[id] || L.NPCS[0];
/** Icon vật phẩm từ assets/v3/items.webp (CSS background-position, nearest-neighbour). */
function iconHtml(id, cls = "") {
  const c = L.iconCell(id);
  return c ? `<i class="it${c.sheet === "decor" ? " it--decor" : ""} ${cls}" style="--c:${c.col};--r:${c.row}" aria-hidden="true"></i>` : "";
}
function faceHtml(npcId, cls = "") {
  const n = npcOf(npcId);
  return n.portrait
    ? `<span class="face ${cls}" style="--c:${n.portrait.col};--r:${n.portrait.row}${n.portrait.sheet ? `;background-image:url(assets/v3/${n.portrait.sheet}.webp)` : ""}" aria-hidden="true"></span>`
    : `<span class="face face--badge ${cls}" style="--npc:${n.color}" aria-hidden="true">${esc(n.initial)}</span>`;
}

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const now = ctx.now || (() => Date.now());
  const storage = ctx.storage ?? browserStorage();
  const save = farmSave(storage);
  const $ = (id) => document.getElementById(id);
  const ui = {
    field: $("field"), seeds: $("seeds"), coins: $("hCoins"), level: $("hLevel"), xp: $("hXp"), xpTxt: $("hXpTxt"),
    store: $("hStore"), over: $("hOver"), storeBar: $("hStoreBar"), storeStat: $("hStoreStat"), plots: $("hPlots"), all: $("allBtn"), mute: $("muteBtn"), muteIc: $("muteIc"),
    help: $("helpBtn"), ovHelp: $("ovHelp"), helpOk: $("helpOk"), toast: $("toast"),
    farm: $("farm"), warehouse: $("warehouse"), whBody: $("whBody"), upgrades: $("upgrades"), orders: $("ordersPanel"), slips: $("slips"),
    upgrade: $("upgradeBuy"), upgradeInfo: $("upgradeInfo"), sell: $("sellAll"),
    water: $("waterTool"), grow: $("seedTool"), depot: $("stockTool"), orderTool: $("ordersTool"), sellTool: $("sellTool"), improve: $("upgradeTool"),
    market: $("market"), board: $("boardBtn"), boardBadge: $("boardBadge"),
    lot: $("workshopLot"), lotTag: $("lotTag"), lotBar: $("lotBar"), wsBadge: $("wsBadge"), wsTool: $("workshopTool"), mkTool: $("marketTool"),
    ovBuild: $("ovBuild"), buildBody: $("buildBody"), buildOk: $("buildOk"), buildCancel: $("buildCancel"),
    quest: $("quest"), qFace: $("qFace"), qStep: $("qStep"), qTitle: $("qTitle"), qHint: $("qHint"), qBar: $("qBar"), qProg: $("qProg"), qReward: $("qReward"), qClaim: $("qClaim"),
  };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-kim-cuong", "qua-man", "trung-da", "thang"], sdk);

  const first = save.initialize(now()); // di chuyển v2 → v3 (giữ backup) nếu cần
  let s = save.read(now()).state;
  const fresh = first.fresh, migrated = first.migrated;
  let mode = "seed", pick = L.FIELD_CROPS[0].id, cursor = 12, confirmAt = -1, confirmT = 0, toastT = 0, tickTimer = 0, secTimer = 0;
  let cancelArm = null, cancelT = 0, rewardTimer = 0, scene = "farm", lastFinished = 0, workshop = null, market = null;

  // ---------- dựng DOM ----------
  const cells = s.plots.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "plot"; b.dataset.i = i;
    const cv = document.createElement("canvas"); cv.width = cv.height = ATLAS_CELL;
    const lbl = document.createElement("span"); lbl.className = "lbl";
    const bar = document.createElement("span"); bar.className = "bar2"; const fill = document.createElement("i"); bar.append(fill);
    const drop = document.createElement("span"); drop.className = "drop"; drop.hidden = true;
    b.append(cv, lbl, bar, drop);
    b.addEventListener("click", () => { cursor = i; mutate(() => act(i)); });
    ui.field.append(b);
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
    render();
    return r;
  }
  const exec = (action, origin) => mutate(() => run(action, origin));

  // ---------- hiển thị ----------
  function toast(text, ms = 2400) {
    ui.toast.textContent = text; ui.toast.hidden = false;
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
    const host = scene === "workshop" ? ui.wsRoot : scene === "market" ? ui.mkRoot : ui.farm;
    const r = el.getBoundingClientRect(), h = host.getBoundingClientRect();
    const x = r.left - h.left + r.width / 2, y = r.top - h.top + r.height / 2;
    for (const k of kinds) playFx(host, k, x, y, size);
    if (text) floatAt(host, x, y - 18, text, color);
  }
  function pulse(el) { if (!el) return; el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); }

  /** Phản hồi cho mọi sự kiện luật trả về: hiệu ứng ô, âm thanh, thông báo. */
  function feedback(events, origin = {}) {
    const msgs = [];
    let sound = null;
    for (const e of events) {
      switch (e.type) {
        case "planted": plotEffect(e.i, "plant"); sound ??= ["buoc-nhay", 0.6]; if (e.free) float(e.i, "Hạt tặng", "#c8f0a0"); break;
        case "watered": plotEffect(e.i, "water"); float(e.i, "Tưới!", "#9fd8ff"); sound ??= ["buoc-nhay", 0.5, 1.4]; break;
        case "harvested":
          plotEffect(e.i, "harvest");
          float(e.i, e.overflow ? "+1 giỏ tràn" : "+1 vào kho", e.overflow ? "#ffb08a" : "#ffe9a8");
          sound ??= ["trung-kim-cuong", 0.7, 0.95 + Math.random() * 0.1];
          if (e.material) msgs.push(`Nhặt được 1 ${L.ITEM[e.material].name}!`);
          break;
        case "plotBought": plotEffect(e.i, "till"); float(e.i, `−${e.cost} xu`, "#ffe9a8"); sound = ["thang", 0.6]; msgs.push("Đã mở thêm một ô ruộng!"); break;
        case "sold":
          sound = ["trung-kim-cuong", 0.8];
          if (e.market) { fxOn(origin.el, ["xu-bay"], `+${fmtNum(e.coins)} xu`, "#ffe9a8"); msgs.push(`Bán ${e.count} ${L.ITEM[Object.keys(e.items)[0]].name} giá ${fmtNum(e.price)} ${e.trend}: +${fmtNum(e.coins)} xu.`); }
          else { saleBurst(e.coins); msgs.push(`Đã bán ${e.count} món theo giá chợ hôm nay, nhận ${fmtNum(e.coins)} xu.`); }
          sdk.reportScore?.(s.stats.earned); break;
        case "delivered":
          sound = ["trung-kim-cuong", 0.9]; saleBurst(e.coins); fxOn(origin.el, ["giao-don", "xu-bay"]);
          msgs.push(`${npcOf(e.npc).name} đã nhận hàng: +${fmtNum(e.coins)} xu, +${e.xp} XP` +
            (Object.keys(e.materials).length ? `, ${Object.entries(e.materials).map(([m, q]) => `${q} ${L.ITEM[m].name}`).join(", ")}` : "") + ".");
          sdk.reportScore?.(s.stats.earned);
          break;
        case "orderCancelled": msgs.push(e.slot === "special" ? "Đã bỏ đơn đặc biệt." : "Đã bỏ đơn. Đơn mới sau 2 phút."); sound ??= ["buoc-nhay", 0.4, 0.8]; break;
        case "orderNew": if (origin.tick) { pulse(ui.board); pulse(ui.orderTool); } break;
        case "orderExpired": msgs.push("Đơn đặc biệt của Anh Út đã hết hạn."); break;
        case "warehouseUpgraded": sound = ["thang", 0.7]; msgs.push(`Nhà kho đã nâng lên ${e.cap} chỗ!`); break;
        case "farmUpgraded": sound = ["thang", 0.6]; msgs.push(`Đã mở ${e.name.toLowerCase()}!`); break;
        case "gift": sound = ["qua-man", 0.6]; msgs.push("Chị Ba tặng bạn 3 hạt cà rốt — trồng lại từ đầu nhé!"); break;
        case "questDone": pulse(ui.quest); sound ??= ["trung-kim-cuong", 0.6, 1.2]; break;
        case "questClaimed": sound = ["qua-man", 0.7]; msgs.push(`Nhiệm vụ xong: +${e.reward.coins} xu${e.reward.xp ? `, +${e.reward.xp} XP` : ""}.`); break;
        case "buildStarted": sound = ["thang", 0.7]; fxOn(ui.lot, ["khoi-xay-dung"], `−${fmtNum(e.cost)} xu`, "#ffe9a8", 96);
          msgs.push(`Bắt đầu xây ${e.name} — xong sau ${fmtLeft(e.readyAt - now())}. Tắt máy vẫn xây tiếp.`); break;
        case "buildingDone": sound = ["qua-man", 0.8]; fxOn(ui.lot, ["khoi-xay-dung", "lap-lanh"], null, null, 96); pulse(ui.lot);
          msgs.push(`${e.name} đã xây xong! Chạm vào Xưởng để chế biến — Bếp sên đã sẵn sàng.`); break;
        case "machineBuildStarted": sound = ["thang", 0.7]; fxOn(origin.el, ["khoi-xay-dung"], `−${fmtNum(e.cost)} xu`, "#ffe9a8");
          msgs.push(`Đang lắp ${L.MACHINE[e.machine].name} — xong sau ${fmtLeft(e.readyAt - now())}.`); break;
        case "machineUpgraded": sound = ["thang", 0.7]; fxOn(origin.el, ["lap-lanh"]); msgs.push(`${L.MACHINE[e.machine].name} lên cấp ${e.level}: ${e.slots} ô hàng chờ.`); break;
        case "workshopUpgraded": sound = ["thang", 0.8]; fxOn(origin.el, ["lap-lanh"]); msgs.push(`Xưởng lên cấp ${e.level}: mọi máy thêm ${e.extraSlots} ô hàng chờ!`); break;
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
        case "levelUp": sound = ["qua-man", 0.8]; msgs.push(`Lên cấp ${e.level}!` + (e.unlocks.length ? ` Mở khoá: ${e.unlocks.join(", ")}.` : "")); break;
      }
    }
    if (sound) sfx.play(...sound);
    if (msgs.length) toast(msgs.slice(-2).join(" "), msgs.some((m) => m.startsWith("Lên cấp")) ? 4200 : 2600);
  }

  function renderHud() {
    ui.coins.textContent = fmtNum(s.coins);
    ui.level.textContent = s.level;
    const need = L.xpNeed(s.level);
    ui.xp.style.width = Math.round((100 * s.xp) / need) + "%";
    ui.xpTxt.textContent = `${s.xp}/${need} XP`;
    const used = L.used(s), cap = L.capacity(s), over = L.overflowCount(s);
    ui.store.textContent = `${used}/${cap}`;
    ui.over.textContent = over ? `+${over} giỏ tràn` : "";
    ui.over.hidden = !over;
    ui.storeBar.style.width = Math.min(100, Math.round((100 * used) / cap)) + "%";
    ui.storeStat.classList.toggle("full", used >= cap);
    ui.storeStat.title = over ? `Kho đầy — ${over} món đang ở giỏ tràn` : `Kho: ${used}/${cap} chỗ`;
    ui.plots.textContent = `${s.plots.filter((p) => p.open).length}/${L.W * L.H}`;
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
    const ready = L.boardView(s).slots.filter((x) => x.ready).length + (L.boardView(s).special?.ready ? 1 : 0);
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
        (sellable ? `<small>Giá chợ hôm nay: ${fmtNum(L.priceOf(id, now()))} xu ${L.MARKET.trend(id, now())}</small>` : "") +
        `<small>Nguồn: ${esc(it.source)} · Dùng cho: ${esc(it.uses)}</small>` +
        (want ? `<small class="want">Đơn đang cần: ${want}</small>` : "") + `</div>` +
        (sellable ? `<div class="wh-btns"><button class="btn btn--sm" type="button" data-act="sell1" data-id="${id}" data-key="s1-${where}-${id}" aria-label="Bán 1 ${esc(it.name)}">Bán 1</button>` +
          `<button class="btn btn--sm" type="button" data-act="sellN" data-id="${id}" data-key="sn-${where}-${id}" aria-label="Bán hết ${esc(it.name)}">Hết · ${fmtNum(q * L.priceOf(id, now()))} xu</button></div>` : "") + `</li>`;
    };
    let html = `<div class="wh-head"><b>Nhà kho</b><span class="wh-cap${used >= cap ? " full" : ""}">${used}/${cap} chỗ</span>` +
      `<div class="px-bar wh-bar" aria-hidden="true"><i style="width:${Math.min(100, Math.round((100 * used) / cap))}%"></i></div></div>`;
    if (over) {
      const value = Object.entries(s.overflow).reduce((n, [id, q]) => n + q * (L.priceOf(id, now()) || 0), 0);
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
    if (decor.length) html += `<h3>Trang trí (túi riêng)</h3><ul class="wh-list">${decor.map((id) => `<li class="wh-item">${iconHtml(id)}<div class="wh-info"><b>${esc(L.ITEM[id].name)} <span class="qty">×${s.decor[id]}</span></b><small>Không tính sức chứa · đặt lên bản đồ ở chế độ xây dựng (bản sau)</small></div></li>`).join("")}</ul>`;
    const nx = L.nextWarehouse(s);
    if (nx) {
      const mats = Object.entries(nx.materials);
      const okLevel = s.level >= nx.minLevel, okCoins = s.coins >= nx.cost, okMats = mats.every(([m, q]) => L.have(s, m) >= q);
      html += `<div class="wh-up"><p><b>Nâng kho lên ${nx.cap} chỗ</b> · ${fmtNum(nx.cost)} xu` +
        (mats.length ? ` · ${mats.map(([m, q]) => `${iconHtml(m, "it--sm")}${L.have(s, m)}/${q} ${esc(L.ITEM[m].name)}`).join(" · ")}` : "") +
        (okLevel ? "" : ` · <span class="need">cần cấp ${nx.minLevel}</span>`) + `</p>` +
        `<button class="btn btn--teal" type="button" id="whUpgrade" data-act="whUpgrade" data-key="wh-up"${okLevel && okCoins && okMats ? "" : " disabled"}>Nâng kho</button></div>`;
    } else html += `<p class="wh-up">Nhà kho đã ở mức lớn nhất.</p>`;
    setHtml(ui.whBody, html);
    ui.sell.disabled = !Object.entries({ ...s.inv, ...s.overflow }).some(([id, q]) => q > 0 && L.ITEM[id]?.cat === "nong-san");
  }

  function slipHtml(v, slotKey) {
    const key = `slot-${slotKey}`;
    if (!v.order) {
      return `<li class="slip slip--empty" data-slot="${slotKey}"><p>${slotKey === "special" ? "Anh Út sẽ ghé với đơn đặc biệt mới" : "Đơn mới"} sau ${until(v.refillAt)}</p></li>`;
    }
    const o = v.order, npc = npcOf(o.npc), T = L.ORDER_TYPES[o.type];
    const items = v.items.map((it) => `<li class="${it.owned >= it.need ? "ok" : ""}">${iconHtml(it.id)}<span>${esc(L.ITEM[it.id].name)}</span><b>${Math.min(it.owned, it.need)}/${it.need}</b></li>`).join("");
    const mats = Object.entries(o.materials).map(([m, q]) => `${iconHtml(m, "it--sm")}${q}`).join(" ");
    const armed = cancelArm === `${slotKey}:${o.id}`;
    return `<li class="slip slip--${o.type}${v.ready ? " ready" : ""}" data-slot="${slotKey}">` +
      `<div class="slip-head">${faceHtml(o.npc)}<div><b>${esc(npc.name)}</b><small>${esc(T.name)}${o.expiresAt ? ` · còn ${until(o.expiresAt)}` : ""}</small></div></div>` +
      `<ul class="slip-items">${items}</ul>` +
      `<p class="slip-reward">${iconHtml("dong-xu", "it--sm")}<b>${fmtNum(o.coins)}</b> ${iconHtml("sao-xp", "it--sm")}<b>${o.xp} XP</b>${mats ? ` <span class="mats">${mats}</span>` : ""}</p>` +
      `<p class="slip-status">${v.ready ? "Đủ hàng — giao được!" : "Còn thiếu hàng"}</p>` +
      `<div class="slip-btns"><button class="btn btn--teal" type="button" data-act="deliver" data-slot="${slotKey}" data-id="${o.id}" data-rev="${v.rev}" data-key="${key}-giao"${v.ready ? "" : " disabled"} aria-label="Giao đơn của ${esc(npc.name)}">Giao</button>` +
      `<button class="btn btn--sm${armed ? " armed" : ""}" type="button" data-act="cancel" data-slot="${slotKey}" data-id="${o.id}" data-rev="${v.rev}" data-key="${key}-bo">${armed ? "Bấm lần nữa" : "Bỏ đơn"}</button></div></li>`;
  }
  function renderOrders() {
    if (ui.orders.hidden) return;
    const b = L.boardView(s);
    let html = b.slots.map((v, k) => slipHtml(v, k)).join("");
    if (b.special) html += slipHtml(b.special, "special");
    const slots = L.orderSlotCount(s.level);
    const nextSlot = [3, 6, 11].find((lv) => lv > s.level);
    if (slots < 6 && nextSlot) html += `<li class="slip slip--locked"><p>Ô đơn thứ ${slots + 1} mở ở cấp ${nextSlot}</p></li>`;
    if (s.level < L.COMBO_LEVEL) html += `<li class="slip slip--locked"><p>Đơn kết hợp của Bác Tư mở ở cấp ${L.COMBO_LEVEL}</p></li>`;
    else if (s.level < L.SPECIAL_LEVEL) html += `<li class="slip slip--locked"><p>Đơn đặc biệt của Anh Út mở ở cấp ${L.SPECIAL_LEVEL}</p></li>`;
    setHtml(ui.slips, html);
  }

  function renderQuest() {
    const q = L.currentQuest(s);
    ui.quest.hidden = !q;
    if (!q) return;
    const done = L.questComplete(s), k = L.QUESTS.indexOf(q);
    const tut = k < L.TUTORIAL.length;
    ui.qStep.textContent = tut ? `Chị Ba · Nhiệm vụ ${k + 1}/${L.TUTORIAL.length}` : `Chị Ba · Tiến trình ${k - L.TUTORIAL.length + 1}/${L.PROGRESSION.length}`;
    ui.qTitle.textContent = q.title;
    let hint = q.hint;
    if (q.id === "mo-o-dat" && !L.hasFeature(s, "plots")) hint = "Lên cấp 2 để mở thêm ô đất — thu hoạch và giao đơn để lấy kinh nghiệm.";
    if (q.id === "nang-kho" && L.nextWarehouse(s) && s.coins < L.nextWarehouse(s).cost) hint = `Để dành ${L.nextWarehouse(s).cost} xu rồi mở Kho, bấm “Nâng kho” — kho đầy thì hàng rơi vào giỏ tràn.`;
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
  let hlEl = null;
  function highlight(t) {
    const q = L.currentQuest(s);
    let el = null;
    if (q && !L.questComplete(s)) {
      const firstPlot = (pred) => { const order = [12, ...s.plots.keys()]; const i = order.find((k) => pred(s.plots[k], k)); return i === undefined ? null : cells[i].b; };
      switch (q.target) {
        case "plot-empty": el = mode === "seed" ? firstPlot((p) => p.open && !p.crop) : ui.grow; break;
        case "plot-growing": el = mode === "water" ? firstPlot((p) => p.crop && !p.watered && !L.isReady(p, t)) : (s.plots.some((p) => p.crop && !p.watered && !L.isReady(p, t)) ? ui.water : ui.grow); break;
        case "plot-ready": el = firstPlot((p) => L.isReady(p, t)); break;
        case "sell": el = scene === "market" ? ui.mkRoot.querySelector('#mkSell [data-act="sell"]') : ui.warehouse.hidden ? ui.sellTool : ui.sell.disabled ? null : ui.sell; break;
        case "workshop-lot": el = s.level >= L.WORKSHOP.unlock ? (scene === "farm" ? ui.lot : ui.wsRoot.querySelector("[data-back]")) : null; break;
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
    if (el === hlEl) return;
    hlEl?.classList.remove("qhl", "qarrow");
    hlEl = el;
    if (el) { el.classList.add("qhl"); if (q?.arrow && el !== ui.qClaim) el.classList.add("qarrow"); }
  }

  function renderPlot(i, t) {
    const p = s.plots[i], c = cells[i], cost = L.plotCost(s);
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
  // ---------- lô Xưởng trên bản đồ ----------
  function renderLot(t) {
    const st = L.workshopState(s, t), w = L.workshopOf(s), lv = L.workshopLevel(s, t);
    ui.lot.dataset.state = st; ui.lot.dataset.level = String(lv);
    let tag, aria;
    if (st === "locked") { tag = `Xưởng · cấp ${L.WORKSHOP.unlock}`; aria = `Lô Xưởng chế biến — mở ở cấp ${L.WORKSHOP.unlock}`; }
    else if (st === "available") { tag = "Có thể xây"; aria = `Xưởng chế biến — có thể xây (${L.WORKSHOP.cost} xu)`; }
    else if (st === "building") { tag = `Đang xây ${fmtClock(w.readyAt - t)}`; aria = `Xưởng đang xây — còn ${fmtLeft(w.readyAt - t)}`; }
    else { tag = "Xưởng chế biến"; aria = "Vào Xưởng chế biến"; }
    if (ui.lotTag.textContent !== tag) ui.lotTag.textContent = tag;
    ui.lot.setAttribute("aria-label", aria); ui.lot.title = aria;
    ui.lotBar.hidden = st !== "building";
    if (st === "building") { const span = w.readyAt - w.startAt || L.WORKSHOP.buildMs; ui.lotBar.firstChild.style.width = Math.round(100 * Math.min(1, Math.max(0, 1 - (w.readyAt - t) / span))) + "%"; }
    const fin = st === "done" ? L.finishedJobs(s, t) : 0;
    ui.wsBadge.hidden = !fin; ui.wsBadge.textContent = fin || "";
    ui.wsTool.textContent = fin ? `Xưởng (${fin})` : "Xưởng";
  }
  function lotTap() {
    const t = now(), st = L.workshopState(s, t);
    if (st === "locked") { toast(`Xưởng chế biến mở ở cấp ${L.WORKSHOP.unlock}. Giao đơn, thu hoạch để lên cấp nhé!`); sfx.play("trung-da", 0.3); return; }
    if (st === "building") { toast(`Xưởng đang xây, còn ${fmtLeft(L.workshopOf(s).readyAt - t)}. Tắt máy vẫn xây tiếp.`); sfx.play("buoc-nhay", 0.3); return; }
    if (st === "done") { goScene("workshop"); return; }
    const W = L.WORKSHOP, ok = s.coins >= W.cost;
    ui.buildBody.innerHTML = `<ul><li>Giá: ${iconHtml("dong-xu", "it--sm")}<b>${fmtNum(W.cost)} xu</b> (bạn có ${fmtNum(s.coins)})</li><li>Thời gian xây: <b>${fmtLeft(W.buildMs)}</b> — tắt máy vẫn xây tiếp</li>` +
      `<li>Tặng kèm <b>Bếp sên</b>: mứt dâu, sốt cà chua, nước ép cà rốt</li><li>Cối xay (cấp 5) và Lò bánh (cấp 8) lắp thêm bên trong Xưởng</li></ul>` +
      (ok ? "" : `<p class="need">Còn thiếu ${fmtNum(W.cost - s.coins)} xu.</p>`);
    ui.buildOk.disabled = !ok; ui.buildOk.textContent = ok ? `Xây · ${fmtNum(W.cost)} xu` : "Chưa đủ xu";
    ui.ovBuild.hidden = false; (ok ? ui.buildOk : ui.buildCancel).focus();
    sfx.play("buoc-nhay", 0.35, 1.1);
  }
  const closeBuild = () => { ui.ovBuild.hidden = true; ui.lot.focus({ preventScroll: true }); };

  // ---------- cảnh ----------
  const HASH = { workshop: "#xuong", market: "#cho" };
  function goScene(next, quiet) {
    if (next === "workshop" && L.workshopState(s, now()) !== "done") next = "farm";
    if (!["farm", "workshop", "market"].includes(next)) next = "farm";
    const prev = scene;
    scene = next;
    document.body.dataset.scene = next;
    if (next === "workshop") workshop.show(); else workshop.hide();
    if (next === "market") market.show(); else market.hide();
    try { history.replaceState(null, "", location.pathname + location.search + (HASH[next] || "")); } catch {}
    if (prev !== next) {
      if (!quiet) sfx.play("buoc-nhay", 0.4, next === "farm" ? 0.9 : 1.15);
      window.scrollTo({ top: Math.max(0, document.querySelector(".wrap").offsetTop - 4) });
      const focus = next === "farm" ? (prev === "workshop" ? ui.lot : ui.market) : document.querySelector(`#${next}Scene [data-back]`);
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
  loadSprites();

  function render() {
    renderHud();
    renderLot(now());
    workshop?.render();
    market?.render();
    renderWarehouse();
    renderOrders();
    renderQuest();
    renderField(now());
  }
  /** Mỗi giây: đồng hồ trên phiếu đơn; luật đồng bộ theo thời gian (lấp đơn, hết hạn, lưới an toàn) khi cần. */
  function second() {
    if (document.hidden) return;
    const t = now();
    for (const el of document.querySelectorAll("[data-until]")) el.textContent = fmtClock(Number(el.dataset.until) - t);
    renderLot(t);
    if (scene === "workshop") workshop.render(); else if (scene === "market") market.render();
    const fin = L.finishedJobs(s, t);
    if (fin > lastFinished) {
      const done = Object.entries(s.production.machines).flatMap(([id, m]) => m.queue.filter((j) => j.endAt <= t && j.endAt > t - 1500).map((j) => `${L.MACHINE[id].name} xong ${L.RECIPE[j.recipe].name}`));
      if (done.length) { toast(done.join(" · ") + (scene === "workshop" ? " — chạm ô để nhận!" : " — vào Xưởng để nhận!"), 3200); sfx.play("trung-kim-cuong", 0.35, 1.3); pulse(ui.lot); pulse(ui.wsTool); }
    }
    lastFinished = fin;
    if (L.needsSync(s, t)) mutate(() => { const r = L.apply(s, { type: "tick" }, now()); if (r.ok && r.events.length) { persist(); feedback(r.events, { tick: true }); render(); } });
  }

  // ---------- hành động ----------
  function choose(id) {
    if (!L.cropUnlocked(s, id)) { toast(`${L.CROP[id].name} mở khoá ở cấp ${L.CROP[id].level}.`); sfx.play("trung-da", 0.4); return; }
    pick = id; selectMode("seed"); sfx.play("buoc-nhay", 0.3, 1.3); render();
  }
  function fail(code, action) { toast((M2_ACTIONS.has(action?.type) && ERR_M2[code]) || ERR[code] || ERR_M2[code] || "Không làm được."); sfx.play("trung-da", 0.4); }
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
    mode = next;
    for (const [key, button] of [["seed", ui.grow], ["water", ui.water], ["stock", ui.depot], ["orders", ui.orderTool], ["upgrade", ui.improve]]) {
      button.setAttribute("aria-pressed", String(key === mode));
    }
    for (const [key, el] of Object.entries(PANELS)) el.hidden = key !== mode;
    render();
  }
  const openPanel = (m) => { selectMode(m); sfx.play("buoc-nhay", 0.3, 1.2); };
  ui.grow.onclick = () => openPanel("seed");
  ui.water.onclick = () => openPanel("water");
  ui.depot.onclick = () => openPanel("stock");
  ui.orderTool.onclick = ui.board.onclick = () => { openPanel("orders"); if (ui.board === document.activeElement) ui.orders.scrollIntoView({ block: "nearest" }); };
  ui.improve.onclick = () => openPanel("upgrade");
  ui.market.onclick = ui.mkTool.onclick = () => goScene("market");
  ui.lot.onclick = ui.wsTool.onclick = lotTap;
  ui.buildCancel.onclick = closeBuild;
  ui.buildOk.onclick = () => { ui.ovBuild.hidden = true; exec({ type: "buildWorkshop" }, { el: ui.lot }); };
  for (const b of document.querySelectorAll("[data-back]")) b.onclick = () => goScene("farm");
  ui.sellTool.onclick = () => {
    openPanel("stock");
    (ui.sell.disabled ? ui.depot : ui.sell).focus({ preventScroll: true });
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
    else if (b.dataset.act === "whUpgrade") exec({ type: "upgradeWarehouse" });
  });
  ui.slips.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || b.disabled) return;
    const slot = b.dataset.slot === "special" ? "special" : Number(b.dataset.slot), id = Number(b.dataset.id), rev = Number(b.dataset.rev);
    if (b.dataset.act === "deliver") { cancelArm = null; exec({ type: "deliver", slot, id, rev }, { el: b }); return; }
    const arm = `${b.dataset.slot}:${id}`;
    if (cancelArm !== arm) { // bỏ đơn cũng bấm 2 lần cho chắc
      cancelArm = arm; clearTimeout(cancelT); cancelT = setTimeout(() => { cancelArm = null; render(); }, 2500);
      sfx.play("buoc-nhay", 0.35, 1.2); render(); return;
    }
    cancelArm = null;
    exec({ type: "cancelOrder", slot, id, rev });
  });
  ui.qClaim.onclick = () => exec({ type: "claimQuest", id: ui.qClaim.dataset.id });
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
  const showHelp = (on) => { ui.ovHelp.hidden = !on; if (on) ui.helpOk.focus(); else cells[cursor].b.focus({ preventScroll: true }); };
  ui.help.addEventListener("click", () => showHelp(true));
  ui.helpOk.addEventListener("click", () => showHelp(false));
  function onKey(e) {
    if (!ui.ovHelp.hidden) { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); showHelp(false); } return; }
    if (!ui.ovBuild.hidden) { if (e.key === "Escape") { e.preventDefault(); closeBuild(); } return; }
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
    else if (k === "m") setMuted(!sdk.sound.muted);
  }
  window.addEventListener("keydown", onKey);
  function onStorage(e) {
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
  lastFinished = L.finishedJobs(s, now());
  mutate(() => {
    const r = L.apply(s, { type: "tick" }, now());
    const newOrders = r.ok ? r.events.filter((e) => e.type === "orderNew").length : 0;
    const built = r.ok && r.events.some((e) => e.type === "buildingDone");
    if (r.ok && r.events.length) { persist(); render(); }
    if (r.ok) feedback(r.events.filter((e) => e.type === "gift" || e.type === "levelUp"));
    if (HASH.workshop === location.hash) goScene("workshop", true); else if (HASH.market === location.hash) goScene("market", true);
    if (fresh) showHelp(true);
    else if (migrated && first.from === "v3") toast("Nông trại đã cập nhật: có Xưởng chế biến (từ cấp 4) và Khu chợ với giá đổi theo giờ. Tiến trình cũ vẫn giữ nguyên!", 5200);
    else if (migrated) toast("Nông trại đã được nâng cấp: có Bảng đơn, Nhà kho có sức chứa và nhiệm vụ của Chị Ba. Tiến trình cũ vẫn giữ nguyên!", 5200);
    else if (away || newOrders || awayJobs || built) {
      const parts = [away && `${away} ô đã chín`, awayJobs && `Xưởng xong ${awayJobs} mẻ`, built && "Xưởng chế biến đã xây xong", newOrders && `${newOrders} đơn mới trên bảng`].filter(Boolean);
      toast(`Trong lúc bạn vắng: ${parts.join(" · ")}.` + (away ? ' Bấm "Thu hết" để gom!' : ""), 4200);
    }
  });
  secTimer = setInterval(second, 1000);

  return {
    destroy() {
      clearTimeout(tickTimer); clearTimeout(rewardTimer); clearInterval(secTimer); sfx.close(); onLeave();
      window.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("storage", onStorage);
    },
    // Dành cho test/debug — không phải API cho core.
    get state() { return s; },
    set state(v) { s = v; persist(); render(); },
    get pick() { return pick; },
    get mode() { return mode; },
    get scene() { return scene; },
    goScene,
    get sfx() { return { log: sfx.log.slice() }; },
    now,
    render,
  };
}
