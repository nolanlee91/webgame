// Nông Trại — giao diện (DOM + canvas nhỏ mỗi ô), điều khiển (chạm / chuột / phím), lưu tiến trình, âm thanh. Luật trong logic.js.
import * as L from "./logic.js";
import { drawFarm } from "./scenery.js?v=3";

const SAVE_KEY = "wgp.nongtrai.v1";
const MUTE_KEY = "wgp.muted";

// ---------- ART: hình tạm vẽ bằng code (khối pixel 16×16 có viền tối, vẽ lên canvas 64×64) ----------
// Khi có bộ sprite (assets/crops.png, 64 px/khung: hàng = cây theo thứ tự CROPS, cột = hạt / mầm / lớn / chín),
// chỉ cần thay ART.draw để drawImage từ atlas — phần còn lại của game không đổi.
const PAL = {"x":"#1a120a","k":"#1f5e22","g":"#3fae4a","G":"#8be08f","s":"#6b4a22","o":"#e8842a","O":"#ffb366","q":"#a8521a","y":"#ffc94a","Y":"#fff0b0","u":"#c98a1c","r":"#e0483d","R":"#ff8f84","m":"#1f6b2a","M":"#7fcf6a","d":"#2a1a0e","w":"#a8763f","n":"#5a3a1a","c":"#ffe9a8"};
const MAPS = {
  "seed": [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "......xx........",
    ".....xwwx..xx...",
    "....xwnnwxxwwx..",
    "....xnnnnxwnnwx.",
    ".....xxxx.xnnx..",
    "..........xxx...",
  ],
  "sprout": [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....xx....xx....",
    "...xGGx..xGGx...",
    "...xgGGxxGGgx...",
    "....xggkkggx....",
    ".....xxkkxx.....",
    ".......kk.......",
    ".......kk.......",
    "......xkkx......",
    ".....xdwwdx.....",
    "......xxxx......",
  ],
  "grow": [
    "................",
    "................",
    "................",
    "..xx........xx..",
    ".xGGx......xGGx.",
    ".xgGGx....xGGgx.",
    "..xggkx..xkggx..",
    "...xxkkxxkkxx...",
    ".....xkkkkx.....",
    "..xx..xkkx..xx..",
    ".xGGxxxkkxxxGGx.",
    ".xgggkkkkkkgggx.",
    "..xxxx.kk.xxxx..",
    ".......kk.......",
    "......xddx......",
    ".....xdwwdx.....",
  ],
  "rau-muong": [
    "................",
    "..x....xx....x..",
    ".xGx..xGGx..xGx.",
    ".xGgx.xGgx.xgGx.",
    "..xgGxxggxxGgx..",
    "..xkggxkgxggkx..",
    "xx.xkgxkgxgkx.xx",
    "xGx.xkxkkxkx.xGx",
    "xgGxxkkkkkkxxGgx",
    ".xggkkkkkkkkggx.",
    "..xxkkskkskkxx..",
    "....xksskssx....",
    ".....xssssx.....",
    "......xssx......",
    ".....xdwwdx.....",
    "......xxxx......",
  ],
  "ca-rot": [
    ".....x..x.......",
    "....xGxxGx......",
    "....xgGgGx..x...",
    ".....xgkgx.xGx..",
    "......xkkxxgx...",
    ".....xxkkkxx....",
    "....xOOooooox...",
    "....xOOoooooqx..",
    ".....xOoooqqx...",
    ".....xOooooqx...",
    "......xOoqqx....",
    "......xooqqx....",
    ".......xoqx.....",
    ".......xoqx.....",
    "........xx......",
    "................",
  ],
  "bap": [
    "......xx........",
    ".....xYyx.......",
    "....xYyyux......",
    "....xyYyux..x...",
    "....xYyyux.xgx..",
    "...xxyYyuxxGgx..",
    "..xGxYyyuxgGx...",
    "..xgGxyyuxgkx...",
    "...xgGxuxGgkx...",
    "....xggxxgkx....",
    ".....xkkkkx.....",
    "......xkkx......",
    "......xkkx......",
    ".....xkkkkx.....",
    ".....xdwwdx.....",
    "......xxxx......",
  ],
  "bi-do": [
    "................",
    "........xx......",
    ".......xsx..xx..",
    "......xsx..xgGx.",
    "....xxxsxxxgkx..",
    "..xxOOxOOxOOxx..",
    ".xOOooxooxoooqx.",
    "xOOoooxooxooooqx",
    "xOooooxooxooooqx",
    "xOooooxooxoooqqx",
    "xoooooxooxoooqqx",
    ".xoooqxoqxooqqx.",
    "..xxqqxqqxqqxx..",
    "....xxxxxxxx....",
    "................",
    "................",
  ],
  "dua-hau": [
    "................",
    "................",
    "........xx......",
    "......xxsx......",
    "....xxmmMMxx....",
    "...xMMmmMMmmx...",
    "..xmMMmmMMmmMx..",
    ".xmmMMmmMMmmMMx.",
    ".xmmMMmmMMmmMMx.",
    "xMmmMMmmMMmmMMmx",
    "xMmmMMmmMMmmMMmx",
    ".xmmMMmmMMmmMMx.",
    "..xmMMmmMMmmMx..",
    "...xxMmmMMmxx...",
    ".....xxxxxx.....",
    "................",
  ],
};
// Sprite Pixel V5 của Codex (assets/asset-manifest.json): crops.png 4 cột (hạt · mầm · đang lớn · chín) × 5 hàng theo
// thứ tự L.CROPS, khung 64×64, gốc cây ở (32, 56). Chưa tải xong ⇒ dùng tạm khối pixel vẽ bằng code ở trên.
const STAGE_COL = { seed: 0, sprout: 1, grow: 2, ready: 3 };
const atlas = new Image();
const ART = {
  ready: false,
  onReady: null,
  /** key: "<cây>:<giai đoạn>" hoặc null (ô trống). */
  draw(cv, key) {
    const g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    if (!key) return;
    const [crop, st] = key.split(":"), row = L.CROPS.findIndex((c) => c.id === crop);
    if (this.ready && row >= 0) {
      g.imageSmoothingEnabled = false;
      g.drawImage(atlas, STAGE_COL[st] * 64, row * 64, 64, 64, 0, 0, cv.width, cv.height);
      return;
    }
    const map = MAPS[st === "ready" ? crop : st];
    if (!map) return;
    const n = map.length, k = cv.width / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const ch = map[j][i]; if (ch === ".") continue;
      g.fillStyle = PAL[ch]; g.fillRect(i * k, j * k, k, k);
    }
  },
};
atlas.onload = () => { ART.ready = true; ART.onReady && ART.onReady(); };
atlas.src = new URL("assets/crops.png", import.meta.url).href;

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
function fmtGrow(ms) { const t = ms / 1000; return t < 60 ? t + " giây" : t / 60 + " phút"; }
const ERR = {
  coins: "Chưa đủ xu.", level: "Chưa đủ cấp để trồng cây này.", locked: "Ô này chưa mở.", far: "Chỉ mở được ô cạnh ruộng đang có.",
  growing: "Cây chưa chín.", watered: "Cây này đã tưới rồi.",
};

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const now = ctx.now || (() => Date.now());
  const storage = ctx.storage || (() => { try { return window.localStorage; } catch { return null; } })();
  const $ = (id) => document.getElementById(id);
  const ui = {
    field: $("field"), seeds: $("seeds"), coins: $("hCoins"), level: $("hLevel"), xp: $("hXp"), xpTxt: $("hXpTxt"),
    harvested: $("hHarvested"), plots: $("hPlots"), all: $("allBtn"), mute: $("muteBtn"), muteIc: $("muteIc"),
    help: $("helpBtn"), ovHelp: $("ovHelp"), helpOk: $("helpOk"), toast: $("toast"),
  };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-kim-cuong", "qua-man", "trung-da", "thang"], sdk);

  let raw = null; try { raw = storage && storage.getItem(SAVE_KEY); } catch {}
  const fresh = !raw;
  let s = L.load(raw, now());
  let pick = L.CROPS[0].id, cursor = 12, confirmAt = -1, confirmT = 0, toastT = 0, destroyed = false, raf = 0, lastSave = 0;

  // ---------- dựng DOM ----------
  drawFarm($("scenery"));
  const cells = s.plots.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "plot"; b.dataset.i = i;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64;
    const lbl = document.createElement("span"); lbl.className = "lbl";
    const bar = document.createElement("span"); bar.className = "bar2"; const fill = document.createElement("i"); bar.append(fill);
    const drop = document.createElement("span"); drop.className = "drop"; drop.hidden = true;
    b.append(cv, lbl, bar, drop);
    b.addEventListener("click", () => { cursor = i; act(i); });
    ui.field.append(b);
    return { b, cv, lbl, bar, fill, drop, key: null };
  });
  const seedBtns = L.CROPS.map((c, n) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "seed"; b.setAttribute("role", "radio"); b.dataset.id = c.id;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; ART.draw(cv, c.id + ":ready");
    b.append(cv);
    b.insertAdjacentHTML("beforeend", `<b>${c.name}</b><small class="info"></small>`);
    b.title = `${c.name}: hạt ${c.seed} xu · chín sau ${fmtGrow(c.growMs)} · bán ${c.sell} xu (phím ${n + 1})`;
    b.addEventListener("click", () => choose(c.id));
    ui.seeds.append(b);
    return b;
  });

  ART.onReady = () => { for (const c of cells) c.key = undefined; L.CROPS.forEach((k, n) => ART.draw(seedBtns[n].querySelector("canvas"), k.id + ":ready")); render(); };
  if (ART.ready) ART.onReady();

  // ---------- lưu ----------
  function persist(force) {
    const t = now();
    if (!force && t - lastSave < 1500) return;
    lastSave = t;
    try { storage && storage.setItem(SAVE_KEY, L.dump(s, t)); } catch {}
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
      b.querySelector(".info").innerHTML = ok ? `${c.seed} xu · ${fmtGrow(c.growMs)}` : `<span class="need">Cấp ${c.level}</span>`;
    });
  }
  function renderPlot(i, t) {
    const p = s.plots[i], c = cells[i], cost = L.plotCost(s);
    const st = p.open ? L.stage(p, t) : "locked";
    const key = st === "locked" || st === "empty" ? null : p.crop + ":" + st;
    if (c.key !== key) { if (st === "ready" && c.key === p.crop + ":grow") sfx.play("trung-kim-cuong", 0.3, 1.3); ART.draw(c.cv, key); c.key = key; } // cây vừa chín trước mắt
    const buyable = !p.open && L.canBuy(s, i);
    c.b.classList.toggle("locked", !p.open);
    c.b.classList.toggle("grassB", !p.open && ((i % L.W) + Math.floor(i / L.W)) % 2 === 1); // 2 kiểu cỏ xen kẽ
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
    else if (st === "empty") { aria = `Ô đất trống — gieo ${L.CROP[pick].name}`; }
    else if (st === "ready") { lbl = "Chín!"; aria = `${name} đã chín — bấm để thu hoạch`; }
    else { lbl = fmtClock(p.readyAt - t); aria = `${name} — còn ${fmtLeft(p.readyAt - t)}${p.watered ? "" : ", chưa tưới"}`; }
    if (c.lbl.textContent !== lbl) c.lbl.textContent = lbl;
    if (c.b.getAttribute("aria-label") !== aria) c.b.setAttribute("aria-label", aria);
  }
  function render() {
    const t = now();
    for (let i = 0; i < cells.length; i++) renderPlot(i, t);
    renderHud();
  }

  // ---------- hành động ----------
  function choose(id) {
    if (!L.unlocked(s, id)) { toast(`${L.CROP[id].name} mở khoá ở cấp ${L.CROP[id].level}.`); sfx.play("trung-da", 0.4); return; }
    pick = id; sfx.play("buoc-nhay", 0.3, 1.3); render();
  }
  function fail(code) { toast(ERR[code] || "Không làm được."); sfx.play("trung-da", 0.4); }
  function afterHarvest(r, i) {
    plotEffect(i, "harvest");
    float(i, `+${r.coins} xu`);
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
    persist(true); render();
    sdk.reportScore && sdk.reportScore(s.stats.earned);
  }
  function harvestAll() {
    const crops = s.plots.map((p) => p.crop); // ghi lại trước khi thu (thu xong ô trống)
    const r = L.harvestAll(s, now());
    if (!r.count) { sfx.play("trung-da", 0.3); return toast("Chưa có ô nào chín."); }
    r.plots.forEach((i) => {
      plotEffect(i, "harvest");
      float(i, `+${L.CROP[crops[i]].sell} xu`);
    });
    toast(`Thu ${r.count} ô: +${fmtNum(r.coins)} xu, +${r.xp} XP.`);
    sfx.play("trung-kim-cuong", 0.8);
    if (r.levelUp) levelUp(r.levelUp, r.unlocked);
    persist(true); render();
  }

  // ---------- điều khiển ----------
  ui.all.addEventListener("click", harvestAll);
  function setMuted(m) {
    sdk.sound = sdk.sound || {}; sdk.sound.muted = m;
    try { storage && storage.setItem(MUTE_KEY, m ? "1" : "0"); } catch {}
    ui.mute.setAttribute("aria-pressed", String(m));
    ui.muteIc.src = m ? "assets/ui/icon-am-thanh-tat.png" : "assets/ui/icon-am-thanh-bat.png";
  }
  setMuted(!!(sdk.sound && sdk.sound.muted));
  ui.mute.addEventListener("click", () => setMuted(!sdk.sound.muted));
  const showHelp = (on) => { ui.ovHelp.hidden = !on; if (on) ui.helpOk.focus(); else cells[cursor].b.focus({ preventScroll: true }); };
  ui.help.addEventListener("click", () => showHelp(true));
  ui.helpOk.addEventListener("click", () => showHelp(false));
  function onKey(e) {
    if (!ui.ovHelp.hidden) { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); showHelp(false); } return; }
    if (e.target?.closest?.(".seed, .tools button, .farm-nav a") && (e.key === "Enter" || e.key === " ")) return;
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv) {
      e.preventDefault();
      const x = Math.min(L.W - 1, Math.max(0, (cursor % L.W) + mv[0])), y = Math.min(L.H - 1, Math.max(0, Math.floor(cursor / L.W) + mv[1]));
      cursor = y * L.W + x; cells[cursor].b.focus({ preventScroll: true }); render(); return;
    }
    if (e.key === "Enter" || e.key === " ") { if (e.target.closest && e.target.closest(".plot")) return; e.preventDefault(); act(cursor); return; }
    if (/^[1-5]$/.test(e.key)) { choose(L.CROPS[+e.key - 1].id); return; }
    const k = e.key.toLowerCase();
    if (k === "h") harvestAll();
    else if (k === "m") setMuted(!sdk.sound.muted);
  }
  window.addEventListener("keydown", onKey);
  const onHide = () => { if (document.visibilityState === "hidden") persist(true); };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);

  // ---------- vòng cập nhật: 4 lần / giây là đủ cho đồng hồ đếm ngược ----------
  let lastTick = 0;
  function tick(t) {
    if (destroyed) return;
    raf = requestAnimationFrame(tick);
    if (t - lastTick < 250) return;
    lastTick = t; render(); persist(false);
  }
  render();
  raf = requestAnimationFrame(tick);

  // ---------- chào mừng / vắng mặt ----------
  const away = L.readyWhileAway(s, now());
  if (fresh) showHelp(true);
  else if (away) toast(`Trong lúc bạn vắng, ${away} ô đã chín. Bấm "Thu hết" để gom!`, 4000);
  s.lastSeen = now(); persist(true);

  return {
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); sfx.close(); persist(true);
      window.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onHide);
    },
    // Dành cho test/debug — không phải API cho core.
    get state() { return s; },
    set state(v) { s = v; render(); },
    get pick() { return pick; },
    get sfx() { return { log: sfx.log.slice() }; },
    render,
  };
}
