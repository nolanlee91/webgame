// Nông Trại — giao diện (DOM + canvas nhỏ mỗi ô), điều khiển (chạm / chuột / phím), lưu tiến trình, âm thanh. Luật trong logic.js.
import * as L from "./logic.js?v=garden2";
import { browserStorage, farmSave } from "./save.js?v=garden2";

const MUTE_KEY = "wgp.muted";
const STAGE_COL = { seed: 0, sprout: 1, grow: 2, mature: 3, ready: 4 };
const ATLAS_CELL = 80;
const atlas = new Image();
const ART = {
  onReady: null,
  draw(canvas, key) {
    const g = canvas.getContext("2d");
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (!key || !atlas.complete || !atlas.naturalWidth) return;
    const [crop, stage] = key.split(":");
    const row = L.CROPS.findIndex((c) => c.id === crop);
    if (row < 0) return;
    g.imageSmoothingEnabled = false;
    g.drawImage(atlas, STAGE_COL[stage] * ATLAS_CELL, row * ATLAS_CELL,
      ATLAS_CELL, ATLAS_CELL, 0, 0, canvas.width, canvas.height);
  },
};
atlas.onload = () => ART.onReady?.();
atlas.src = new URL("assets/garden/crops.webp", import.meta.url).href;

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
/** Đồng hồ gọn trong ô: 0:20, 7:45, 1:05:00. */
function fmtClock(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
function fmtGrow(ms) { const t = ms / 1000; return t < 60 ? t + " giây" : fmtNum(t / 60) + " phút"; }
const ERR = {
  coins: "Chưa đủ xu.", level: "Chưa đủ cấp để trồng cây này.", locked: "Ô này chưa mở.", far: "Chỉ mở được ô cạnh ruộng đang có.",
  growing: "Cây chưa chín.", watered: "Cây này đã tưới rồi.", "empty-stock": "Kho chưa có nông sản để bán.",
  "upgrade-level": "Bạn chưa đủ cấp để nâng cấp.", upgraded: "Đã hoàn thành mọi nâng cấp.",
};

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const now = ctx.now || (() => Date.now());
  const storage = ctx.storage ?? browserStorage();
  const save = farmSave(storage);
  const $ = (id) => document.getElementById(id);
  const ui = {
    field: $("field"), seeds: $("seeds"), coins: $("hCoins"), level: $("hLevel"), xp: $("hXp"), xpTxt: $("hXpTxt"),
    harvested: $("hHarvested"), plots: $("hPlots"), all: $("allBtn"), mute: $("muteBtn"), muteIc: $("muteIc"),
    help: $("helpBtn"), ovHelp: $("ovHelp"), helpOk: $("helpOk"), toast: $("toast"),
    farm: $("farm"), warehouse: $("warehouse"), stock: $("stockList"), upgrades: $("upgrades"),
    upgrade: $("upgradeBuy"), upgradeInfo: $("upgradeInfo"), sell: $("sellAll"),
    water: $("waterTool"), grow: $("seedTool"), depot: $("stockTool"), improve: $("upgradeTool"), market: $("market"),
  };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-kim-cuong", "qua-man", "trung-da", "thang"], sdk);

  const { state, fresh } = save.read(now());
  let s = state, mode = "seed";
  let pick = L.CROPS[0].id, cursor = 12, confirmAt = -1, confirmT = 0, toastT = 0, tickTimer = 0;

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
  const seedBtns = L.CROPS.map((c, n) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "seed"; b.setAttribute("role", "radio"); b.dataset.id = c.id;
    const cv = document.createElement("canvas"); cv.width = cv.height = ATLAS_CELL; ART.draw(cv, c.id + ":ready");
    b.append(cv);
    b.insertAdjacentHTML("beforeend", `<b>${c.name}</b><small class="info"></small>`);
    b.title = `${c.name}: hạt ${c.seed} xu · chín sau ${fmtGrow(c.growMs)} · bán ${c.sell} xu (phím ${n + 1})`;
    b.addEventListener("click", () => choose(c.id));
    ui.seeds.append(b);
    return b;
  });

  ART.onReady = () => { for (const c of cells) c.key = undefined; L.CROPS.forEach((k, n) => ART.draw(seedBtns[n].querySelector("canvas"), k.id + ":ready")); render(); };
  if (atlas.complete && atlas.naturalWidth) ART.onReady();

  // ---------- lưu ----------
  function persist() {
    if (!save.write(s, now())) {
      toast("Trình duyệt không lưu được tiến trình.");
    }
  }
  function mutate(action) {
    const pending = save.exclusive(() => {
      const current = save.read(now());
      if (!current.fresh) s = current.state;
      action();
    });
    pending?.catch(() => toast("Chưa cập nhật được nông trại. Hãy thử lại."));
  }

  // ---------- hiển thị ----------
  function toast(text, ms = 2200) {
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
  function renderHud() {
    ui.coins.textContent = fmtNum(s.coins);
    ui.level.textContent = s.level;
    const need = L.xpNeed(s.level);
    ui.xp.style.width = Math.round((100 * s.xp) / need) + "%";
    ui.xpTxt.textContent = `${s.xp}/${need} XP`;
    ui.harvested.textContent = fmtNum(s.stats.harvested);
    ui.plots.textContent = `${s.plots.filter((p) => p.open).length}/${L.W * L.H}`;
    ui.all.disabled = !s.plots.some((p) => L.isReady(p, now()));
    L.CROPS.forEach((c, n) => {
      const b = seedBtns[n], ok = L.unlocked(s, c.id);
      b.classList.toggle("locked", !ok);
      b.setAttribute("aria-checked", String(pick === c.id));
      b.setAttribute("aria-disabled", String(!ok));
      b.tabIndex = pick === c.id ? 0 : -1;
      b.querySelector(".info").textContent = !ok ? `Cấp ${c.level}` : c.id === "ca-rot" && s.freeSeeds
        ? `${s.freeSeeds} hạt tặng` : `${c.seed} xu · ${fmtGrow(c.growMs)}`;
    });
    const stock = L.CROPS.filter((c) => s.stock[c.id]);
    const total = stock.reduce((sum, c) => sum + s.stock[c.id], 0);
    ui.depot.textContent = total ? `Kho (${total})` : "Kho";
    ui.sell.disabled = total === 0;
    ui.stock.textContent = total ? stock.map((c) => `${c.name} ×${s.stock[c.id]} · ${fmtNum(s.stock[c.id] * c.sell)} xu`).join("  /  ") : "Kho trống. Thu hoạch cây chín để đưa nông sản vào kho.";
    const next = L.UPGRADES[s.upgrade];
    ui.upgradeInfo.textContent = next ? `${next.name} · Cấp ${next.level} · ${next.cost} xu` : "Đã mở mọi trang trí.";
    ui.upgrade.disabled = !next;
    ui.farm.dataset.upgrade = s.upgrade;
  }
  function renderPlot(i, t) {
    const p = s.plots[i], c = cells[i], cost = L.plotCost(s);
    const st = p.open ? L.stage(p, t) : "locked";
    const key = st === "locked" || st === "empty" ? null : p.crop + ":" + st;
    if (c.key !== key) {
      if (c.key && c.key.startsWith(p.crop + ":")) {
        if (st === "ready") sfx.play("trung-kim-cuong", 0.3, 1.3);
        plotEffect(i, "grow");
      }
      ART.draw(c.cv, key);
      c.key = key;
    }
    const buyable = !p.open && L.canBuy(s, i);
    c.b.classList.toggle("locked", !p.open);
    c.b.classList.toggle("far", !p.open && !buyable);
    c.b.classList.toggle("wet", p.open && !!p.crop && p.watered && st !== "ready");
    c.b.classList.toggle("ready", st === "ready");
    c.b.classList.toggle("confirm", confirmAt === i);
    c.b.classList.toggle("cursor", cursor === i && document.activeElement === c.b);
    c.bar.hidden = !(p.crop && st !== "ready");
    if (!c.bar.hidden) c.fill.style.width = Math.round(L.progress(p, t) * 100) + "%";
    c.drop.hidden = !(p.crop && !p.watered && st !== "ready");
    let lbl = "", aria;
    const name = p.crop && L.CROP[p.crop].name;
    if (!p.open) { lbl = buyable ? `${cost} xu` : ""; aria = buyable ? `Ô cỏ — mở với giá ${cost} xu` : "Ô cỏ — chưa mở được, cần mở ô bên cạnh trước"; }
    else if (st === "empty") { aria = mode === "water" ? "Ô đất trống" : `Ô đất trống — gieo ${L.CROP[pick].name}`; }
    else if (st === "ready") { lbl = "Chín!"; aria = `${name} đã chín — bấm để thu hoạch`; }
    else { lbl = fmtClock(p.readyAt - t); aria = `${name} — còn ${fmtLeft(p.readyAt - t)}${p.watered ? "" : ", chưa tưới"}`; }
    if (c.lbl.textContent !== lbl) c.lbl.textContent = lbl;
    if (c.b.getAttribute("aria-label") !== aria) {
      c.b.setAttribute("aria-label", aria);
      c.b.title = aria;
    }
  }
  function renderField(t) {
    for (let i = 0; i < cells.length; i++) renderPlot(i, t);
    ui.all.disabled = !s.plots.some((p) => L.isReady(p, t));
    clearTimeout(tickTimer);
    if (!document.hidden && s.plots.some((p) => p.crop && !L.isReady(p, t))) {
      tickTimer = setTimeout(() => renderField(now()), 250);
    }
  }
  function render() {
    renderField(now());
    renderHud();
  }

  // ---------- hành động ----------
  function choose(id) {
    if (!L.unlocked(s, id)) { toast(`${L.CROP[id].name} mở khoá ở cấp ${L.CROP[id].level}.`); sfx.play("trung-da", 0.4); return; }
    pick = id; selectMode("seed"); sfx.play("buoc-nhay", 0.3, 1.3); render();
  }
  function fail(code) { toast(ERR[code] || "Không làm được."); sfx.play("trung-da", 0.4); }
  function afterHarvest(r, i) {
    plotEffect(i, "harvest");
    float(i, "+1 vào kho", "#ffe9a8");
    sfx.play("trung-kim-cuong", 0.7, 0.95 + Math.random() * 0.1);
    if (r.levelUp) levelUp(r.levelUp, r.unlocked);
  }
  function levelUp(lv, ids) {
    sfx.play("qua-man", 0.8);
    const names = ids.map((id) => L.CROP[id].name);
    toast(`Lên cấp ${lv}!` + (names.length ? ` Mở khoá: ${names.join(", ")}.` : ""), 3200);
  }
  function act(i) {
    const p = s.plots[i], t = now();
    if (!p.open) {
      if (!L.canBuy(s, i)) return fail("far");
      const cost = L.plotCost(s);
      if (confirmAt !== i) { // bấm 2 lần mới mua — tránh lỡ tay tiêu xu
        confirmAt = i; clearTimeout(confirmT); confirmT = setTimeout(() => { confirmAt = -1; render(); }, 2500);
        toast(`Bấm lần nữa để mở ô này với giá ${cost} xu.`); sfx.play("buoc-nhay", 0.35, 1.2); render(); return;
      }
      confirmAt = -1;
      const r = L.buyPlot(s, i);
      if (r.err) return fail(r.err);
      plotEffect(i, "till");
      float(i, `−${r.cost} xu`, "#ffe9a8"); sfx.play("thang", 0.6); toast("Đã mở thêm một ô ruộng!");
    } else if (!p.crop) {
      if (mode === "water") return toast("Ô này chưa có cây để tưới.");
      const r = L.plant(s, i, pick, t);
      if (r.err) return fail(r.err);
      plotEffect(i, "plant");
      sfx.play("buoc-nhay", 0.6);
    } else if (L.isReady(p, t)) {
      afterHarvest(L.harvest(s, i, t), i);
    } else if (!p.watered) {
      L.water(s, i, t); plotEffect(i, "water"); sfx.play("buoc-nhay", 0.5, 1.4); float(i, "Tưới!", "#9fd8ff");
    } else {
      toast(`${L.CROP[p.crop].name} còn ${fmtLeft(p.readyAt - t)} nữa mới chín.`); sfx.play("trung-da", 0.25);
    }
    persist(); render();
  }
  function harvestAll() {
    const r = L.harvestAll(s, now());
    if (!r.count) { sfx.play("trung-da", 0.3); return toast("Chưa có ô nào chín."); }
    r.plots.forEach((i) => {
      plotEffect(i, "harvest");
      float(i, "+1 vào kho", "#ffe9a8");
    });
    toast(`Đã cất ${r.count} nông sản vào kho. +${r.xp} XP.`);
    sfx.play("trung-kim-cuong", 0.8);
    if (r.levelUp) levelUp(r.levelUp, r.unlocked);
    persist(); render();
  }

  // ---------- điều khiển ----------
  function selectMode(next) {
    mode = next;
    for (const [key, button] of [["seed", ui.grow], ["water", ui.water], ["stock", ui.depot], ["upgrade", ui.improve]]) {
      button.setAttribute("aria-pressed", String(key === mode));
    }
    ui.seeds.hidden = mode !== "seed";
    ui.warehouse.hidden = mode !== "stock";
    ui.upgrades.hidden = mode !== "upgrade";
    $("waterHint").hidden = mode !== "water";
  }
  ui.grow.onclick = () => selectMode("seed");
  ui.water.onclick = () => selectMode("water");
  ui.depot.onclick = () => selectMode("stock");
  ui.market.onclick = $("sellTool").onclick = () => {
    selectMode("stock");
    (ui.sell.disabled ? ui.depot : ui.sell).focus();
  };
  ui.improve.onclick = () => selectMode("upgrade");
  ui.sell.onclick = () => mutate(() => {
    const result = L.sell(s);
    if (result.err) return fail(result.err);
    persist(); render();
    const reward = $("saleReward");
    reward.textContent = `+${fmtNum(result.coins)} xu`;
    reward.hidden = false;
    clearTimeout(rewardTimer);
    rewardTimer = setTimeout(() => { reward.hidden = true; }, 1000);
    sfx.play("trung-kim-cuong", 0.8);
    toast(`Đã bán ${result.count} nông sản, nhận ${fmtNum(result.coins)} xu.`);
    sdk.reportScore?.(s.stats.earned);
  });
  let rewardTimer;
  ui.upgrade.onclick = () => mutate(() => {
    const result = L.upgradeFarm(s);
    if (result.err) return fail(result.err);
    persist(); render();
    sfx.play("thang", 0.6);
    toast(`Đã mở ${result.name.toLowerCase()}!`);
  });
  ui.all.addEventListener("click", () => mutate(harvestAll));
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
    if (e.target?.closest?.("button:not(.plot), a") && (e.key === "Enter" || e.key === " ")) return;
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv) {
      e.preventDefault();
      const x = Math.min(L.W - 1, Math.max(0, (cursor % L.W) + mv[0])), y = Math.min(L.H - 1, Math.max(0, Math.floor(cursor / L.W) + mv[1]));
      cursor = y * L.W + x; cells[cursor].b.focus({ preventScroll: true }); render(); return;
    }
    if (e.key === "Enter" || e.key === " ") { if (e.target.closest && e.target.closest(".plot")) return; e.preventDefault(); mutate(() => act(cursor)); return; }
    if (/^[1-5]$/.test(e.key)) { choose(L.CROPS[+e.key - 1].id); return; }
    const k = e.key.toLowerCase();
    if (k === "h") mutate(harvestAll);
    else if (k === "m") setMuted(!sdk.sound.muted);
  }
  window.addEventListener("keydown", onKey);
  function onStorage(e) {
    if (e.storageArea !== storage || document.hidden) return;
    const current = save.read(now());
    if (!current.fresh) {
      s = current.state;
      render();
    }
  }
  const onLeave = () => save.touch(now());
  function onVisibility() {
    if (document.hidden) {
      clearTimeout(tickTimer);
      onLeave();
    } else {
      const current = save.read(now());
      if (!current.fresh) s = current.state;
      render();
    }
  }
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("storage", onStorage);
  render();

  // ---------- chào mừng / vắng mặt ----------
  const away = L.readyWhileAway(s, now());
  if (fresh) showHelp(true);
  else if (away) toast(`Trong lúc bạn vắng, ${away} ô đã chín. Bấm "Thu hết" để gom!`, 4000);
  save.initialize(now());

  return {
    destroy() {
      clearTimeout(tickTimer); clearTimeout(rewardTimer); sfx.close(); onLeave();
      window.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("storage", onStorage);
    },
    // Dành cho test/debug — không phải API cho core.
    get state() { return s; },
    set state(v) { s = v; persist(); render(); },
    get pick() { return pick; },
    get sfx() { return { log: sfx.log.slice() }; },
    render,
  };
}
