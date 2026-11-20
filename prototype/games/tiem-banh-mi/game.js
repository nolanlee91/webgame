// Nối mọi thứ: tải manifest + ảnh → đọc bản lưu → vòng lặp (tick theo thời gian ca) → vẽ cảnh / quầy ráp / HUD → lưu tự động.
// Trạng thái chỉ đổi qua apply() (core/apply.js). Giao diện đọc trạng thái + sự kiện trả về để chạy hiệu ứng, âm thanh, thông báo.
import { makeAtlas, SHEETS, HD_SHEETS, LAZY_SHEETS, OPTIONAL_SHEETS } from "./render/atlas.js?v=b1";
import { placeholderFallback } from "./render/placeholder.js?v=b1";
import { createScene } from "./render/scene.js?v=b1";
import { createBench } from "./ui/bench.js?v=b1";
import { createHud, createRail, createOverlays, toast, fmtK } from "./ui/screens.js?v=b1";
import { apply } from "./core/apply.js?v=b1";
import { customer } from "./core/shift.js?v=b1";
import { hint } from "./core/tutorial.js?v=b1";
import { itemName } from "./core/rescue.js?v=b1";
import { STEP_NAME } from "./core/board.js?v=b1";
import { STOCK, NAMES } from "./data/economy.js?v=b1";
import { OVEN_LINES, LOW_LINES } from "./data/lines-ops.js?v=b1";
import { shopSave, browserStorage } from "./save.js?v=b1";
import { play, playEvent, soundMode, cycleSoundMode, unlockSound, setSoundScene, syncSound, soundDebug, MUTE_KEY, MUSIC_KEY } from "./ui/sfx.js?v=b1";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => reducedMQ.matches;
const pickOf = (list, i) => list[i % list.length];

async function boot() {
  const manifest = await (await fetch("data/asset-manifest.json?v=b1")).json();
  const atlas = makeAtlas(manifest, "", { fallback: placeholderFallback() });
  const files = new Set((manifest.items || []).map((i) => i.filename));
  const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = src; });
  const hdOn = Object.entries(HD_SHEETS).filter(([, f]) => files.has(f));
  const replaced = new Set(hdOn.map(([al]) => SHEETS[al]));
  const want = [...Object.entries(SHEETS).filter(([al, src]) => files.has(src) && !replaced.has(src) && !(OPTIONAL_SHEETS.has(al) && !files.has(src))).map(([, s]) => s), ...hdOn.map(([, f]) => f)];
  await Promise.all(want.filter((src) => !LAZY_SHEETS.has(src)).map(load));
  const idle = globalThis.requestIdleCallback || ((f) => setTimeout(f, 1200));
  idle(() => want.filter((src) => LAZY_SHEETS.has(src)).forEach(load));

  const store = shopSave(browserStorage());
  const seed = params.has("seed") ? Number(params.get("seed")) >>> 0 : (Math.random() * 2 ** 32) >>> 0;
  const loaded = store.read(seed);
  let state = loaded.state;
  let paused = false, lastSave = 0, dirty = false, restarting = false;
  const save = (force = false) => {
    if (restarting) return; // đang chơi lại: không ghi đè bản vừa cất
    const now = performance.now();
    if (!force && now - lastSave < 2500) { dirty = true; return; }
    store.write(state); lastSave = now; dirty = false;
  };
  const say = (t, kind = "") => toast($("#toasts"), t, kind);
  const scene = createScene($("#scene"), atlas, { onCustomer: (cid) => act({ type: "pin", cid }) });
  const bench = createBench($("#bench"), atlas, (a) => act(a));
  const hud = createHud($("#hud"), $("#pills"), atlas, (a) => act(a));
  const rail = createRail($("#rail"), (cid) => act({ type: "pin", cid }));
  const overlays = createOverlays($("#overlay"), $("#sheet"), atlas, (a) => act(a), {
    state: () => state,
    afterIntro: () => { store.snapshotDay(state); overlays.prep(state); },
    afterSummary: () => { store.snapshotDay(state); overlays.prep(state); },
    resume: () => { paused = false; openDialog(); },
    restart: () => { if (!store.reset()) return false; restarting = true; location.reload(); return true; },
    toast: (t, k) => say(t, k),
    prepSpeed: () => Number(params.get("prepSpeed")) || 1,
  });

  const ERR = {
    "wrong-step": (r) => r.detail?.back ? `Đã qua bước “${STEP_NAME[r.detail.back]}”. Bấm Hoàn tác để sửa.` : `Làm theo thứ tự nha: “${STEP_NAME[r.detail?.want] || "…"}” trước.`,
    "no-ticket": () => "Chạm một khách để ghim phiếu lên thớt trước.",
    "board-busy": () => "Thớt đang ráp dở ổ khác. Giao hoặc đổ ổ đó trước.",
    "toasting": () => "Ổ đang nướng lại trên lò than. Bấm “Lấy ra” trước.",
    "toaster-busy": () => "Lò than đang bận.",
    "wrapped": () => "Ổ đã gói rồi, bấm Giao.",
    "not-wrapped": () => "Gói ổ bánh trước rồi mới giao.",
    "paying": () => "Thối tiền cho khách trước đã.",
    "away": () => "Bạn đang chạy đi, quầy bỏ trống. Chờ chút!",
    "slot-busy": () => "Ngăn lò đang có mẻ.",
    "case-full": () => "Tủ kính đầy rồi, bán bớt rồi nướng tiếp.",
    "money": () => "Không đủ tiền.",
    "capacity": () => "Kho đầy rồi.",
    "locked": () => "Chưa mở khoá.",
    "manual-change": () => "Từ ngày 4 phải tự chọn tờ thối.",
    "no-bills": () => "Quỹ lẻ không còn tờ đó.",
    "not-waiting": () => "Khách này không còn chờ nữa.",
    "cannot-afford": () => "Chưa đủ tiền cho lựa chọn này.",
  };
  function act(a, fromLoop = false) {
    if (a?.type === "startShift") store.snapshotDay(state);
    const r = apply(state, a);
    if (r.err) {
      if (!fromLoop && ERR[r.err]) { say(ERR[r.err](r), "warn"); play("error"); }
      if (r.err === "exception") console.error(r.detail);
      return r;
    }
    for (const e of r.events) {
      playEvent(e);
      switch (e.type) {
        case "step": scene.act(e.step === "wrap" ? "wrap" : "slice", 500); if (e.step === "slice") scene.burst("crumbs", scene.points.board[0], scene.points.board[1] - 20, 0.5, reduced()); if (e.step === "toast" && e.burnt) say("Nướng quá lâu, ổ cháy rồi!", "warn"); break;
        case "batchLoaded": scene.act("oven", 700); break;
        case "batchGolden": say(pickOf(OVEN_LINES.ready, state.shift?.stats.batches || 0), "good"); break;
        case "batchDark": say(pickOf(OVEN_LINES.dark, 0), "warn"); break;
        case "batchBurnt": say(pickOf(OVEN_LINES.burnt, 0), "warn"); break;
        case "batchPulled": scene.act("oven", 700); say(`Rút ${e.n} ổ · giòn ${e.crisp}${e.level === "raw" || e.level === "pale" ? " (hơi sống)" : e.level === "dark" ? " (hơi xém)" : ""}`, e.level === "golden" ? "good" : "warn"); break;
        case "toastReady": say("Ổ trên lò than đủ giòn, lấy ra!", "good"); break;
        case "toastBurnt": say("Ổ trên lò than sắp cháy!", "warn"); break;
        case "filled": say(`Đã gói ổ ${e.n}/${e.of}. Ráp tiếp ổ kế!`, "good"); break;
        case "paying": scene.act("change", 600); break;
        case "served": {
          scene.act("serve", 600);
          const p = scene.posOf(state, e.cid);
          if (p && e.price) scene.burst("coin-fly", p[0], p[1] - 220, 1, reduced());
          bench.resetPicked();
          const ch = e.change === "short" ? ` · thối thiếu ${-e.diff}k (đã bù)` : e.change === "overBack" ? ` · thối dư ${e.diff}k, khách trả lại` : e.change === "overGone" ? ` · thối dư mất ${e.diff}k` : "";
          say(`${e.owed ? "Khách nợ" : e.lost ? "Khách đi luôn" : "+" + fmtK(e.price)} · ${e.stars} sao${e.xp ? ` · +${e.xp} XP` : ""}${ch}`, e.stars >= 4 && !e.change ? "good" : e.stars <= 2 || e.change === "short" ? "warn" : "");
          break;
        }
        case "complaint": case "stockout": case "nochange": setTimeout(() => openDialog(), reduced() ? 0 : 350); break;
        case "lowStock": say(`“${LOW_LINES[0].replace("{item}", STOCK[e.id]?.name || e.id).replace("{n}", e.n)}”`, "warn"); break;
        case "ranBack": case "delivered": say(e.line, e.wrong ? "warn" : "good"); break;
        case "timeout": say(`${e.name} bỏ về vì chờ lâu. Review 1 sao.`, "warn"); break;
        case "levelUp": say(`Lên cấp ${e.level}!`, "good"); break;
        case "phase": showBanner(e.text); break;
        case "restocked": say(`Nhập ${e.n} phần ${STOCK[e.id].name} (−${fmtK(e.price)}${e.express ? ", giao gấp" : ""})`); break;
        case "restockedToday": say(`Đã nhập đủ cho hôm nay (−${fmtK(e.spent)}).`, "good"); break;
        case "consigned": say(`Bà Tư ký gửi một gói hàng (${fmtK(e.owed)}, bán tới đâu trả tới đó).`, "good"); break;
        case "exchanged": say(`Cô Sáu đổi ${e.value}k tiền lẻ.`, "good"); break;
        case "shiftStarted": say(`Mở hàng ngày ${e.day}! Khoảng ${e.guests} khách. Phí ca ${e.fee}k.`, "good"); break;
        case "shiftEnded": setTimeout(() => overlays.summary(state), reduced() ? 0 : 600); break;
        default: break;
      }
    }
    if (!fromLoop) save(true); else if (r.events.length) save();
    return r;
  }
  function openDialog() {
    const d = state.shift?.dialog;
    if (!d || overlays.current) return;
    if (d.kind === "complaint") overlays.complaint(state);
    else if (d.kind === "stockout") overlays.stockout(state);
    else if (d.kind === "nochange") overlays.nochange(state);
  }
  let bannerT = 0;
  function showBanner(text) { const b = $("#banner"); b.textContent = text; b.hidden = false; clearTimeout(bannerT); bannerT = setTimeout(() => { b.hidden = true; }, 2600); }

  // ---------- vòng lặp ----------
  let last = performance.now();
  const shopLabel = $("#shopLabel"), hintbar = $("#hintbar"), away = $("#away");
  const running = () => state.shift && state.shift.status === "open" && !state.shift.dialog && !paused && !overlays.current;
  function frame(now) {
    const dt = Math.min(250, now - last); last = now;
    if (running()) act({ type: "tick", dt }, true);
    if (dirty && performance.now() - lastSave > 2500) save(true);
    const sh = state.shift;
    const mode = paused ? "quiet" : sh?.dialog ? "dialog" : running() ? "service" : !sh ? "prep" : "quiet";
    setSoundScene(mode, mode === "service" && sh.oven.some(Boolean));
    const hn = sh?.tutorial ? hint(state) : null;
    scene.update(state, { reduced: reduced(), hintPin: hn?.key === "pin" });
    rail(state, hn?.key === "pin");
    hud(state);
    bench.render(state, hn);
    bench.frame(state);
    hintbar.hidden = !hn;
    if (hn && hintbar.textContent !== hn.text) hintbar.textContent = hn.text;
    away.hidden = !sh?.away;
    if (sh?.away) away.textContent = sh.away.kind === "change" ? "Đang chạy qua Cô Sáu đổi tiền lẻ…" : sh.away.kind === "si" ? "Đang chạy ra lò đầu hẻm mua bánh sỉ…" : sh.away.kind === "gas" ? "Đang chạy qua Cô Sáu mượn bình gas…" : `Đang chạy ra chợ mua ${itemName(sh.away.id)}… (${Math.ceil((sh.away.until - sh.t) / 1000)}s)`;
    $("#pauseBtn").disabled = !sh;
    if (shopLabel.textContent !== state.shopName) shopLabel.textContent = state.shopName;
    requestAnimationFrame(frame);
  }

  // ---------- bố cục ----------
  const mobile = matchMedia("(max-width: 760px)");
  function layout() {
    // mobile: luôn thấy từ chủ tiệm sau xe tới hàng chờ (cắt bớt bầu trời / lòng đường)
    if (mobile.matches) scene.layoutFit(330, 1180, 150, 720); else scene.layout(660, 400, 1);
    bench.setLoafScale(mobile.matches ? 1 : innerHeight < 820 ? 0.75 : 1);
  }
  addEventListener("resize", layout);
  new ResizeObserver(layout).observe($("#scene"));
  layout();

  // ---------- điều khiển ----------
  const muteBtn = $("#muteBtn");
  const MODE_LABEL = { all: "Tiếng: bật", sfx: "Tiếng: chỉ hiệu ứng", off: "Tiếng: tắt" };
  const syncMute = () => { const m = soundMode(); muteBtn.dataset.mode = m; muteBtn.setAttribute("aria-pressed", m === "off" ? "true" : "false"); muteBtn.textContent = MODE_LABEL[m]; muteBtn.title = MODE_LABEL[m] + " (M)"; };
  document.addEventListener("pointerdown", () => unlockSound(), { passive: true, capture: true });
  document.addEventListener("keydown", () => unlockSound(), true);
  muteBtn.addEventListener("click", () => { if (cycleSoundMode() !== "off") unlockSound(); syncMute(); });
  addEventListener("storage", (event) => { if (event.key === MUTE_KEY || event.key === MUSIC_KEY || event.key === null) { syncMute(); syncSound(); } });
  syncMute();
  $("#helpBtn").addEventListener("click", () => { if (overlays.current && !["prep", "pause"].includes(overlays.current)) return; if (state.shift) paused = true; overlays.help(); });
  $("#pauseBtn").addEventListener("click", () => { if (!state.shift || overlays.current) return; paused = true; overlays.pause(); });
  document.addEventListener("visibilitychange", () => { syncSound(); if (document.hidden) { save(true); if (state.shift && !overlays.current && !state.shift.dialog) { paused = true; overlays.pause(); } } });
  addEventListener("pagehide", () => save(true));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (overlays.current) return;
    const key = e.key.toLowerCase();
    if (key === "m") { muteBtn.click(); return; }
    if (key === "escape" || key === "p") { $("#pauseBtn").click(); return; }
    if (key === "h") { $("#helpBtn").click(); return; }
    if (!state.shift) return;
    const click = (sel) => { const b = document.querySelector(sel); if (b && !b.disabled) { b.click(); e.preventDefault(); return true; } return false; };
    if (/^[1-6]$/.test(e.key)) click(`#rail .slip:nth-child(${e.key})`);
    else if (e.key === "Enter") { click('[data-act="giveChange"]') || click('[data-act="serve"]'); }
    else if (e.key === "Backspace") click('[data-act="undo"]');
    else if (key === "l") click('[data-act="ovenPill"]');
    else if (key === "n") click('[data-act="toast"]');
  });

  // ---------- màn đầu ----------
  if (loaded.corrupt) say("Bản lưu cũ bị hỏng nên mở tiệm mới (bản cũ vẫn được giữ lại).", "warn");
  if (loaded.migrated) say("Đã nâng cấp bản lưu lên phiên bản mới (bản cũ được giữ một bản sao).", "good");
  if (!state.introSeen) overlays.intro(state);
  else if (state.shift?.dialog) openDialog();
  else if (state.shift) { paused = true; overlays.pause(); }
  else if (state.lastSummary && !state.lastSummary.seen) overlays.summary(state);
  else { store.snapshotDay(state); overlays.prep(state); }
  if (loaded.fresh || loaded.migrated) save(true);
  $("#app").classList.add("ready");
  requestAnimationFrame((t) => { last = t; frame(t); });

  // Móc kiểm thử (e2e): tua thời gian ca, đọc trạng thái, toạ độ cảnh ⇒ màn hình.
  window.__game = {
    get state() { return state; },
    act,
    advance(ms) { for (let left = ms; left > 0 && state.shift && !state.shift.dialog; left -= 200) act({ type: "tick", dt: Math.min(200, left) }, true); },
    get paused() { return paused || !!overlays.current; },
    get overlay() { return overlays.current; },
    customer: (cid) => customer(state, cid),
    hint: () => hint(state),
    sound: () => soundDebug(),
    sceneToClient(x, y) { const r = $("#scene").getBoundingClientRect(); const [sx, sy] = scene.toScreen(x, y); return [r.left + sx, r.top + sy]; },
    visibleRect: () => scene.visibleRect(),
    sceneScale: () => scene.scale,
    names: NAMES,
  };
}

boot().catch((e) => {
  const m = document.getElementById("bootError");
  if (m) { m.hidden = false; m.textContent = "Không tải được tiệm: " + (e?.message || e); }
  console.error(e);
});
