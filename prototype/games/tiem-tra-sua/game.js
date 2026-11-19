// Nối mọi thứ: tải manifest + ảnh → đọc bản lưu → vòng lặp (tick theo thời gian ca) → render cảnh / quầy / HUD → lưu tự động.
// Trạng thái chỉ đổi qua apply() (core/apply.js). Giao diện đọc trạng thái + sự kiện trả về để chạy hiệu ứng, âm thanh, thông báo.
import { makeAtlas, SHEETS } from "./render/atlas.js";
import { createScene } from "./render/scene.js";
import { createBrew } from "./ui/brew.js";
import { createHud, createRail, createOverlays, toast, fmtK } from "./ui/screens.js";
import { apply } from "./core/apply.js";
import { customer } from "./core/shift.js";
import { STEP_VERB, STOCK } from "./data/ingredients.js";
import { EQUIPMENT } from "./data/equipment.js";
import { shopSave, browserStorage } from "./save.js";
import { play, isMuted, setMuted } from "./ui/sfx.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => reducedMQ.matches;

async function boot() {
  const manifest = await (await fetch("data/asset-manifest.json")).json();
  const atlas = makeAtlas(manifest);
  await Promise.all(Object.values(SHEETS).map((src) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = src; })));

  const store = shopSave(browserStorage());
  const seed = params.has("seed") ? Number(params.get("seed")) >>> 0 : (Math.random() * 2 ** 32) >>> 0;
  const loaded = store.read(seed);
  let state = loaded.state;
  let paused = false, lastSave = 0, dirty = false;

  const save = (force = false) => {
    const now = performance.now();
    if (!force && now - lastSave < 2500) { dirty = true; return; }
    store.write(state); lastSave = now; dirty = false;
  };

  const toasts = $("#toasts");
  const scene = createScene($("#scene"), atlas, { onCustomer: (cid) => act({ type: "pin", cid }) });
  const brew = createBrew($("#brew"), atlas, (a) => act(a));
  const hud = createHud($("#hud"), atlas);
  const rail = createRail($("#rail"), atlas, (cid) => act({ type: "pin", cid }));
  const overlays = createOverlays($("#overlay"), atlas, (a) => act(a), {
    state: () => state,
    afterIntro: () => overlays.prep(state),
    resume: () => { paused = false; },
    onClose: () => {},
  });

  const ERR = {
    "wrong-step": (r) => `Làm theo thứ tự nha: bước kế tiếp là “${STEP_VERB[r.detail?.want] || "…"}”.`,
    "out-of-stock": (r) => `Hết ${Object.keys(r.detail?.use || {}).map((id) => STOCK[id]?.name).join(", ")} trong kho.`,
    "locked": () => "Nguyên liệu này chưa mở khóa.",
    "not-sealed": () => "Đóng nắp trước rồi mới giao.",
    "not-waiting": () => "Khách này không còn chờ nữa.",
    "money": () => "Không đủ tiền nhập hàng.",
    "capacity": () => "Kho đầy rồi.",
    "sealed": () => "Ly đã đóng nắp. Giao hoặc đổ bỏ.",
    "not-cooked": () => "Chưa có trân châu nấu sẵn. Bấm Nấu ở Bếp topping.",
    "kitchen-busy": () => "Bếp đang nấu mẻ khác.",
    "owned": () => "Tiệm đã có món này.",
  };

  function act(a, fromLoop = false) {
    const r = apply(state, a);
    if (r.err) {
      if (!fromLoop && ERR[r.err]) { toast(toasts, ERR[r.err](r), "warn"); play("error"); }
      return r;
    }
    let justDid = null;
    for (const e of r.events) {
      switch (e.type) {
        case "brewed":
          justDid = e.step;
          play(e.step === "ice" ? "ice" : e.step === "topping" ? "plop" : e.step === "lid" ? "seal" : e.step === "cup" ? "plop" : "pour");
          break;
        case "arrive": play("bell"); break;
        case "pinned": play("plop"); break;
        case "served": {
          play("coin");
          const p = scene.posOf(state, e.cid);
          if (p) scene.burst("bfx", "coin", p[0], p[1] - 132, 1, reduced());
          scene.burst("bfx", "success", 548, 412, 1, reduced());
          brew.act("serve");
          toast(toasts, `+${fmtK(e.price)} · ${e.stars} sao${e.xp ? ` · +${e.xp} XP` : ""}`, e.stars >= 4 ? "good" : e.stars <= 2 ? "warn" : "");
          break;
        }
        case "complaint": play("sad"); setTimeout(() => state.shift?.dialog && overlays.complaint(state), reduced() ? 0 : 450); break;
        case "timeout": play("sad"); toast(toasts, `${e.name} bỏ về vì chờ lâu. −1 review 1 sao.`, "warn"); break;
        case "impatient": break;
        case "levelUp": { play("level"); const real = e.unlocks.filter((u) => u.kind !== "note"); toast(toasts, `Lên cấp ${e.level}!${real.length ? " Mở: " + real.map((u) => u.name).join(", ") : ""}`, "good"); break; }
        case "restocked": toast(toasts, `Nhập ${e.n} phần ${STOCK[e.id].name} (−${fmtK(e.price)}${e.express ? ", giao gấp" : ""})`); break;
        case "shiftEnded": setTimeout(() => overlays.summary(state), reduced() ? 0 : 600); break;
        case "cooking": play("plop"); toast(toasts, "Bắt đầu nấu mẻ " + e.size + " phần trân châu."); break;
        case "batchDone": play("bell"); toast(toasts, "Mẻ trân châu " + e.size + " phần đã chín!", "good"); break;
        case "bought": play("level"); scene.setOwned(state); toast(toasts, "Đã mua " + EQUIPMENT[e.id].name + " (−" + fmtK(e.price) + ")", "good"); break;
        case "shiftStarted": toast(toasts, `Mở cửa ngày ${e.day}! ${e.guests} khách dự kiến.`, "good"); break;
        default: break;
      }
    }
    if (!fromLoop || r.events.length) brew.render(state, { justDid, reduced: reduced() });
    if (!fromLoop) save(true); else if (r.events.length) save();
    return r;
  }

  // ---------- vòng lặp ----------
  let last = performance.now();
  const shopLabel = $("#shopLabel");
  const running = () => state.shift && state.shift.status === "open" && !state.shift.dialog && !paused && !overlays.current;
  function frame(now) {
    const dt = Math.min(250, now - last); last = now;
    if (running()) act({ type: "tick", dt }, true);
    if (dirty && performance.now() - lastSave > 2500) save(true);
    scene.update(state, { reduced: reduced() });
    rail(state);
    hud(state);
    brew.frame(state);
    $("#pauseBtn").disabled = !state.shift;
    if (shopLabel.textContent !== state.shopName) shopLabel.textContent = state.shopName;
    requestAnimationFrame(frame);
  }

  // ---------- bố cục ----------
  const mobile = matchMedia("(max-width: 760px)");
  function layout() {
    if (mobile.matches) scene.layout(730, 440, 1.4); else scene.layout(640, 360, 1);
    brew.setCupScale(mobile.matches ? 0.75 : innerHeight < 820 ? 1.1 : 1.4);
  }
  addEventListener("resize", layout);
  new ResizeObserver(layout).observe($("#scene"));
  layout();

  // ---------- điều khiển ----------
  const muteBtn = $("#muteBtn");
  const syncMute = () => { const m = isMuted(); muteBtn.setAttribute("aria-pressed", m ? "true" : "false"); muteBtn.textContent = m ? "Tiếng: tắt" : "Tiếng: bật"; };
  muteBtn.addEventListener("click", () => { setMuted(!isMuted()); syncMute(); });
  syncMute();
  $("#helpBtn").addEventListener("click", () => overlays.help());
  $("#pauseBtn").addEventListener("click", () => { if (!state.shift || overlays.current) return; paused = true; overlays.pause(state, "pause"); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { save(true); if (state.shift && !overlays.current) { paused = true; overlays.pause(state, "pause"); } }
  });
  addEventListener("pagehide", () => save(true));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (overlays.current) { if (e.key === "Escape" && (overlays.current === "help")) overlays.close(); return; }
    const key = e.key.toLowerCase();
    if (key === "m") { muteBtn.click(); return; }
    if (key === "p") { $("#pauseBtn").click(); return; }
    if (!state.shift) return;
    if (/^[1-9]$/.test(e.key)) { const b = document.querySelectorAll("#opts .opt")[Number(e.key) - 1]; if (b && !b.disabled) b.click(); e.preventDefault(); }
    else if (e.key === "Enter") { const b = $("#serveBtn"); if (!b.disabled) { b.click(); e.preventDefault(); } }
    else if (e.key === "Backspace") { const b = $("#undoBtn"); if (!b.disabled) { b.click(); e.preventDefault(); } }
  });

  // ---------- màn đầu ----------
  brew.render(state);
  scene.setOwned(state);
  if (loaded.corrupt) toast(toasts, "Bản lưu cũ bị hỏng nên mở tiệm mới (bản cũ vẫn được giữ lại).", "warn");
  if (!state.introSeen) overlays.intro(state);
  else if (state.shift?.dialog) overlays.complaint(state);
  else if (state.shift) { paused = true; overlays.pause(state, "resume"); }
  else if (state.lastSummary && !state.lastSummary.seen) overlays.summary(state);
  else overlays.prep(state);
  if (loaded.fresh) save(true);
  $("#app").classList.add("ready");
  requestAnimationFrame((t) => { last = t; frame(t); });

  // Móc kiểm thử (e2e): tua thời gian ca không cần chờ thật.
  window.__game = {
    get state() { return state; },
    act,
    advance(ms) { for (let left = ms; left > 0 && state.shift && !state.shift.dialog; left -= 200) act({ type: "tick", dt: Math.min(200, left) }, true); },
    get paused() { return paused || !!overlays.current; },
    get overlay() { return overlays.current; },
    customer: (cid) => customer(state, cid),
  };
}

boot().catch((e) => {
  const m = document.getElementById("bootError");
  if (m) { m.hidden = false; m.textContent = "Không tải được tiệm: " + (e?.message || e); }
  console.error(e);
});
