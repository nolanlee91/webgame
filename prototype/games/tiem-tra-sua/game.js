// Nối mọi thứ: tải manifest + ảnh → đọc bản lưu → vòng lặp (tick theo thời gian ca) → render cảnh / quầy / HUD → lưu tự động.
// Trạng thái chỉ đổi qua apply() (core/apply.js). Giao diện đọc trạng thái + sự kiện trả về để chạy hiệu ứng, âm thanh, thông báo.
import { makeAtlas, SHEETS, HD_SHEETS, LAZY_SHEETS, DEFER_SHEETS, preload, dpr, icon } from "./render/atlas.js?v=m38";
import { createScene } from "./render/scene.js?v=m41";
import { createBrew } from "./ui/brew.js?v=m41";
import { createHud, createRail, createOverlays, toast, fmtK } from "./ui/screens.js?v=m41";
import { createPanels } from "./ui/panels.js?v=m38";
import { createStockout } from "./ui/stockout.js?v=m41";
import { TIER_LINES } from "./data/lines-m5.js?v=m38";
import { apply } from "./core/apply.js?v=m38";
import { customer } from "./core/shift.js?v=m38";
import { currentEvent, openEvent } from "./core/drama.js?v=m38";
import { PLACE_REASON } from "./core/decor.js?v=m38";
import { STEP_VERB, STOCK } from "./data/ingredients.js?v=m38";
import { EQUIPMENT } from "./data/equipment.js?v=m38";
import { shopSave, browserStorage } from "./save.js?v=m38";
import { play, playEvent, soundMode, cycleSoundMode, unlockSound, setSoundScene, syncSound, soundDebug, MUTE_KEY, MUSIC_KEY } from "./ui/sfx.js?v=m38";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => reducedMQ.matches;

async function boot() {
  const manifest = await (await fetch("data/asset-manifest.json")).json();
  const atlas = makeAtlas(manifest);
  // chỉ tải sheet có trong manifest (sheet Codex đang vẽ sẽ tự được dùng khi thêm vào manifest)
  const files = new Set((manifest.items || []).map((i) => i.filename));
  // sheet có bản HD thì tải bản HD thay bản thường (trừ chỗ hình hiện nhỏ: icon() tự lấy bản thường, xem render/atlas.js)
  const load = preload;
  // chân dung chỉ hiện qua icon() ở ~120–150 px: màn dpr < 1,5 thì icon() lấy bản thường ⇒ tải trước bản thường cho khớp
  const lowDpr = dpr() < 1.5, ICON_ONLY = new Set(["portraits", "faces"]);
  const hdOn = Object.entries(HD_SHEETS).filter(([al, f]) => files.has(f) && !(lowDpr && ICON_ONLY.has(al) && files.has(SHEETS[al])));
  const replaced = new Set(hdOn.map(([al]) => SHEETS[al]));
  const want = [...Object.values(SHEETS).filter((src) => files.has(src) && !replaced.has(src)), ...hdOn.map(([, f]) => f)];
  // Không tải nền (PERF-01): sheet lười (LAZY_SHEETS: biểu cảm HD, chân dung NPC, thời tiết, thẻ Nhật Ký, ảnh phố) tải khi màn của nó hiện,
  // và tải trước đúng màn kế tiếp: mở ca ⇒ chân dung hội thoại + thời tiết; hết ca ⇒ thẻ Nhật Ký.
  // Người chơi mới (màn chào) chỉ chờ sheet màn đầu; sheet trong tiệm (DEFER_SHEETS) tải khi bấm "Nhận tiệm".
  const store = shopSave(browserStorage());
  const seed = params.has("seed") ? Number(params.get("seed")) >>> 0 : (Math.random() * 2 ** 32) >>> 0;
  const loaded = store.read(seed);
  const deferred = want.filter((src) => DEFER_SHEETS.has(src) && !LAZY_SHEETS.has(src));
  const first = want.filter((src) => !LAZY_SHEETS.has(src) && !DEFER_SHEETS.has(src));
  await Promise.all((loaded.state.introSeen ? [...first, ...deferred] : first).map(load));
  const prefetch = (list) => list.forEach((src) => files.has(src) && load(src));
  const prefetchShop = () => prefetch(deferred);
  const prefetchShift = () => prefetch([HD_SHEETS.drama, (lowDpr ? SHEETS.faces : HD_SHEETS.faces), SHEETS.weather]);
  const prefetchJournal = () => prefetch([SHEETS.journal]);

  let state = loaded.state;
  let paused = false, lastSave = 0, dirty = false, restarting = false;

  const save = (force = false) => {
    if (restarting) return; // đang chơi lại: không ghi đè bản vừa cất
    const now = performance.now();
    if (!force && now - lastSave < 2500) { dirty = true; return; }
    store.write(state); lastSave = now; dirty = false;
  };

  const toasts = $("#toasts");
  const say = (t, kind = "") => toast(toasts, t, kind);
  const scene = createScene($("#scene"), atlas, { onCustomer: (cid) => act({ type: "pin", cid }) });
  const brew = createBrew($("#brew"), atlas, (a) => act(a));
  const hud = createHud($("#hud"), atlas);
  const rail = createRail($("#rail"), atlas, (cid) => act({ type: "pin", cid }));
  let panels;
  const overlays = createOverlays($("#overlay"), atlas, (a) => act(a), {
    state: () => state,
    afterIntro: () => { prefetchShop(); store.snapshotDay(state); overlays.prep(state); },
    resume: () => { paused = false; },
    restart: () => { if (!store.reset()) return false; restarting = true; location.reload(); return true; },
    // "Chơi lại ngày hôm nay": ảnh đầu ngày (save.js DAY_KEY), bản hiện tại cất sang REPLAY_BACKUP_KEY trước
    replayDay: () => store.replayInfo()?.day ?? null,
    replay: () => { if (!store.replayDay()) return false; restarting = true; location.reload(); return true; },
    onClose: () => {},
    notebook: (tab, back) => panels.notebook(state, tab, back),
    journal: (back) => panels.journal(state, back),
    arrange: () => arrange(),
    afterSummary: () => betweenDays(),
    toast: (t, kind) => say(t, kind),
  });
  panels = createPanels(atlas, (a) => act(a), overlays, { state: () => state, resume: () => { paused = false; }, toast: say });
  const stockout = createStockout(atlas, (a) => act(a), overlays, { state: () => state, resume: () => { paused = false; } });

  /** Sau bảng chốt ca: sự kiện giữa hai ca (nếu có) rồi bảng Chuẩn bị ca. */
  function betweenDays() {
    if (currentEvent(state) && !state.shift) panels.event(state, { onDone: () => betweenDays() });
    else { store.snapshotDay(state); overlays.prep(state); }
  }
  function arrange() {
    overlays.close();
    scene.setArrange({ state: () => state, onDrop: (id, x, y) => { const r = act({ type: "place", id, x, y }); if (r.err) say(PLACE_REASON[r.detail?.reason] || "Chỗ này không đặt được.", "warn"); scene.setOwned(state); } });
    panels.arrange(state, { onDone: () => { scene.setArrange(null); scene.setOwned(state); overlays.prep(state); } });
  }

  const ERR = {
    "wrong-step": (r) => `Làm theo thứ tự nha: bước kế tiếp là “${STEP_VERB[r.detail?.want] || "…"}”.`,
    "out-of-stock": (r) => `Hết ${Object.keys(r.detail?.use || {}).map((id) => STOCK[id]?.name).join(", ")} trong kho.`,
    "locked": () => "Chưa mở khóa.",
    "not-sealed": () => "Đóng nắp trước rồi mới giao.",
    "not-waiting": () => "Khách này không còn chờ nữa.",
    "money": () => "Không đủ tiền.",
    "capacity": () => "Kho đầy rồi.",
    "sealed": () => "Ly đã đóng nắp. Giao hoặc đổ bỏ.",
    "not-cooked": () => "Chưa có trân châu nấu sẵn. Bấm Nấu ở Bếp topping.",
    "kitchen-busy": () => "Bếp đang nấu mẻ khác.",
    "owned": () => "Tiệm đã có món này.",
    "requires": () => "Cần mua món trước đó.",
    "order-full": () => "Đơn này đã đủ ly.",
    "cannot-afford": () => "Chưa đủ tiền hoặc nguyên liệu cho lựa chọn này.",
    "event-pending": () => "Còn một chuyện cần xử lý trước khi mở quán.",
    "supplier-closed": () => "Vựa sỉ chỉ giao trước ca. Giữa ca nhập gấp ở Dì Ba.",
    "away": () => "Bạn đang chạy đi mua hàng, quầy bỏ trống. Chờ chút!",
    "coming": (r) => `${STOCK[r.detail?.id]?.name || "Hàng"} đang được mang tới, pha món khác trước nha.`,
  };


  function act(a, fromLoop = false) {
    if (a?.type === "startShift") store.snapshotDay(state); // bảo đảm có ảnh đầu ngày trước khi mở ca
    const r = apply(state, a);
    if (r.err) {
      if (!fromLoop && ERR[r.err]) { say(ERR[r.err](r), "warn"); play("error"); }
      return r;
    }
    let justDid = null;
    for (const e of r.events) {
      playEvent(e); // bảng sự kiện → tiếng ở ui/sfx.js (soundsFor)
      switch (e.type) {
        case "brewed":
          justDid = e.step;
          if (e.dual?.length && e.line) say(e.line, "good");
          if (e.also?.length && e.step === "cup") say(e.line || `Pha đồng loạt: ${e.also.length + 1} ly cùng yêu cầu.`, "good");
          break;
        case "filled": say(`Đã ghép ly ${e.n}/${e.of} vào đơn. Pha tiếp ly kế!`, "good"); break;
        case "served": {
          const p = scene.posOf(state, e.cid);
          if (p) scene.burst("bfx", "coin", p[0], p[1] - 190, 1, reduced());
          scene.burst("bfx", "success", 548, 412, 1, reduced());
          scene.served();
          brew.act("serve");
          say(`+${fmtK(e.price)}${e.cups > 1 ? ` (${e.cups} ly)` : ""} · ${e.stars} sao${e.xp ? ` · +${e.xp} XP` : ""}${e.tip ? ` · thưởng ${e.tip}k` : ""}${e.repay ? ` · trả ký gửi ${e.repay}k` : ""}`, e.stars >= 4 ? "good" : e.stars <= 2 ? "warn" : "");
          break;
        }
        case "stockout": play("stock"); setTimeout(() => { if (state.shift?.dialog?.kind === "stockout" && !overlays.current) stockout.dialog(state); }, reduced() ? 0 : 300); break;
        case "lowStock": play("stock"); say(`Nhân viên: “${e.line}” (bấm ô Kho để nhập gấp)`, "warn"); break;
        case "ranBack": play("paper"); say(e.line, "good"); break;
        case "delivered": play(e.wrong ? "error" : "paper"); say(e.line, e.wrong ? "warn" : "good"); break;
        case "restockedToday": play("paper"); say(`Đã nhập đủ cho hôm nay (−${fmtK(e.spent)}).`, "good"); break;
        case "stockoutResolved": play(e.choice === "close" ? "error" : "paper"); break;
        case "complaint": setTimeout(() => state.shift?.dialog && overlays.complaint(state), reduced() ? 0 : 450); break;
        case "drama": if (WEATHER[e.id]) { scene.setWeather(WEATHER[e.id].kind); wxUntil = (state.shift?.t || 0) + WEATHER[e.id].ms; }
          setTimeout(() => { if (state.shift?.dialog?.kind === "event" && !overlays.current) panels.event(state, { onDone: () => {} }); }, reduced() ? 0 : 350); break;
        case "missionDone": say(`Xong nhiệm vụ: ${e.text} (+${e.xp} XP${e.money ? `, +${e.money}k` : ""})${e.line ? " " + e.line : ""}`, "good"); break;
        case "missionsAll": say(e.line, "good"); break;
        case "consignDone": say(e.line, "good"); break;
        case "timeout": say(`${e.name} bỏ về vì chờ lâu. −1 review 1 sao.`, "warn"); break;
        case "levelUp": { const real = e.unlocks.filter((u) => u.kind !== "note"); say(`Lên cấp ${e.level}!${real.length ? " Mở: " + real.map((u) => u.name).join(", ") : ""}`, "good"); break; }
        case "restocked": say(`Nhập ${e.n} phần ${STOCK[e.id].name} (−${fmtK(e.price)}${e.express ? ", giao gấp" : ""}${e.supplier === "si" ? ", vựa sỉ" : ""})`); break;
        case "shiftEnded": prefetchJournal(); setTimeout(() => overlays.summary(state), reduced() ? 0 : 600); break;
        case "cooking": say("Bắt đầu nấu mẻ " + e.size + " phần trân châu."); break;
        case "batchDone": say("Mẻ trân châu " + e.size + " phần đã chín!", "good"); break;
        case "fairJoined": play("level"); say(`Đã thuê gian hàng hội chợ (−${fmtK(e.fee)}). Hôm nay đông lắm, nhập dư hàng nha!`, "good"); break;
        case "challengeJoined": play("paper"); say(`Nhận thử thách “${e.name}”. Cố lên chủ tiệm!`, "good"); break;
        case "tierUp": play("level"); say(TIER_LINES[(e.tier - 1) % TIER_LINES.length].replace("{tier}", e.name) + ` (−${fmtK(e.price)})`, "good"); break;
        case "badge": play("level"); say(e.line, "good"); break;
        case "bought": scene.setOwned(state); say("Đã mua " + EQUIPMENT[e.id].name + " (−" + fmtK(e.price) + ")", "good"); break;
        case "consigned": say(`${e.line ? e.line + " " : "Dì Ba ký gửi một gói hàng. "}(${fmtK(e.owed)}, bán tới đâu trừ tới đó.)`, "good"); break;
        case "promoted": say(e.line, "good"); break;
        case "replied": say(`${e.label}: ${e.fx.slice(0, 2).join(" · ")}`, e.outcome === "phot" || e.outcome === "annoyed" ? "warn" : "good"); break;
        case "persona": if (e.switches >= 3) say(`Đổi tính lần thứ ${e.switches} trong ngày. Cư dân mạng bắt đầu để ý…`, "warn"); break;
        case "shiftStarted": prefetchShop(); prefetchShift(); if (params.get("calm") === "1" && state.shift) state.shift.drama.max = 0; say(`Mở cửa ngày ${e.day}! ${e.guests} khách dự kiến.`, "good"); break;
        default: break;
      }
    }
    if (!fromLoop || r.events.length) brew.render(state, { justDid, reduced: reduced() });
    if (!fromLoop) save(true); else if (r.events.length) save();
    return r;
  }

  // ---------- thời tiết theo sự kiện (V15 mưa bão, O04 cúp điện): lớp weather-fx khi Codex giao, ngược lại lớp CSS ----------
  const WEATHER = { V15: { kind: "rain", ms: 70000 }, O04: { kind: "power", ms: 25000 } };
  let wxUntil = 0;
  // ---------- vòng lặp ----------
  let last = performance.now();
  const shopLabel = $("#shopLabel");
  const running = () => state.shift && state.shift.status === "open" && !state.shift.dialog && !paused && !overlays.current;
  function frame(now) {
    const dt = Math.min(250, now - last); last = now;
    if (running()) act({ type: "tick", dt }, true);
    if (dirty && performance.now() - lastSave > 2500) save(true);
    const shift = state.shift;
    const mode = paused ? "quiet" : shift?.dialog ? "dialog" : running() ? "service" :
      (!shift && (!overlays.current || ["intro", "persona", "prep", "summary"].includes(overlays.current))) ? "prep" : "quiet";
    setSoundScene(mode, mode === "service" && !!shift.kitchen?.batches.length);
    const wd = state.shift?.dialog;
    if (wd?.kind === "event" && WEATHER[wd.id] && scene.weather !== WEATHER[wd.id].kind) { scene.setWeather(WEATHER[wd.id].kind); wxUntil = state.shift.t + WEATHER[wd.id].ms; }
    else if (scene.weather && (!state.shift || state.shift.t > wxUntil)) scene.setWeather(null);
    scene.update(state, { reduced: reduced() });
    scene.setOwned(state);
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
    // mobile: luôn thấy từ nhân viên sau quầy (x≈470) tới cửa (x≈1240)
    if (mobile.matches) scene.layoutFit(440, 1262, 250, 712); else scene.layout(640, 360, 1);
    brew.setCupScale(mobile.matches ? 0.75 : innerHeight < 820 ? 1.1 : 1.4);
  }
  addEventListener("resize", layout);
  new ResizeObserver(layout).observe($("#scene"));
  layout();

  // ---------- điều khiển ----------
  const muteBtn = $("#muteBtn");
  // icon nút thanh trên (Cần Codex #10: ui-icons sound-on / sound-off / pause / help) — chưa có thì giữ chữ
  const iconBtn = (btn, name) => { if (!atlas.has("icons", name)) return false; const sm = btn.querySelector(".sm"); if (sm) { sm.textContent = ""; sm.appendChild(icon(atlas, ["icons", name], 24)); } return true; };
  iconBtn($("#helpBtn"), "help"); iconBtn($("#pauseBtn"), "pause"); iconBtn($("#bookBtn"), "journal");
  // Nút Tiếng xoay vòng: bật hết → chỉ hiệu ứng (tắt nhạc, lưu tts.music) → tắt (wgp.muted, công tắc tổng chung Lụm Kèo).
  const MODE_LABEL = { all: "Tiếng: bật", sfx: "Tiếng: chỉ hiệu ứng (tắt nhạc)", off: "Tiếng: tắt" };
  const syncMute = () => {
    const m = soundMode(); muteBtn.dataset.mode = m;
    muteBtn.setAttribute("aria-pressed", m === "off" ? "true" : "false");
    muteBtn.setAttribute("aria-label", MODE_LABEL[m]); muteBtn.title = MODE_LABEL[m] + " — bấm để đổi";
    const ic = m === "off" ? "sound-off" : "sound-on";
    if (atlas.has("icons", ic)) { muteBtn.textContent = ""; muteBtn.appendChild(icon(atlas, ["icons", ic], 24)); }
    else muteBtn.textContent = m === "all" ? "Tiếng: bật" : m === "sfx" ? "Tiếng: hiệu ứng" : "Tiếng: tắt";
  };
  // Âm thanh chỉ mở sau thao tác đầu tiên (chính sách tự phát của trình duyệt); không tải gì trước đó.
  const unlock = () => unlockSound();
  document.addEventListener("pointerdown", unlock, { passive: true, capture: true });
  document.addEventListener("keydown", unlock, true);
  muteBtn.addEventListener("click", () => {
    if (cycleSoundMode() !== "off") unlockSound();
    syncMute();
  });
  addEventListener("storage", (event) => {
    if (event.key === MUTE_KEY || event.key === MUSIC_KEY || event.key === null) { syncMute(); syncSound(); }
  });
  syncMute();
  $("#helpBtn").addEventListener("click", () => { if (state.shift) paused = true; overlays.help(); });
  $("#bookBtn").addEventListener("click", () => {
    if (overlays.current && overlays.current !== "prep" && overlays.current !== "pause") return;
    const back = overlays.current === "prep" ? () => overlays.prep(state) : null;
    if (state.shift) paused = true;
    panels.notebook(state, "reviews", back || (() => { if (state.shift) overlays.pause(state, "pause"); else overlays.prep(state); }));
  });
  // ô Kho trên HUD: giữa ca mở bảng nhập gấp (Dì Ba +15%)
  $("#hStock").addEventListener("click", () => { if (!state.shift || overlays.current || state.shift.dialog) return; paused = true; stockout.quick(state); });
  $("#hStock").setAttribute("role", "button"); $("#hStock").tabIndex = 0;
  $("#pauseBtn").addEventListener("click", () => { if (!state.shift || overlays.current) return; paused = true; overlays.pause(state, "pause"); });
  document.addEventListener("visibilitychange", () => {
    syncSound();
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
    else if (e.key === "Tab" && state.shift.stations.length > 1 && e.shiftKey) { act({ type: "select", station: (state.shift.sel + 1) % state.shift.stations.length }); e.preventDefault(); }
  });

  // ---------- màn đầu ----------
  brew.render(state);
  scene.setOwned(state);
  if (loaded.corrupt) say("Bản lưu cũ bị hỏng nên mở tiệm mới (bản cũ vẫn được giữ lại).", "warn");
  if (loaded.migrated) say("Đã nâng cấp bản lưu lên phiên bản mới (bản cũ được giữ một bản sao).", "good");
  // ?event=ID: xem thử một sự kiện (công cụ viết thoại)
  if (params.has("event") && state.introSeen) openEvent(state, params.get("event"));
  if (!state.introSeen) overlays.intro(state);
  else if (state.shift?.dialog?.kind === "complaint") overlays.complaint(state);
  else if (state.shift?.dialog?.kind === "event") panels.event(state, { onDone: () => {} });
  else if (state.shift?.dialog?.kind === "stockout") stockout.dialog(state);
  else if (state.shift) { paused = true; overlays.pause(state, "resume"); }
  else if (state.lastSummary && !state.lastSummary.seen) overlays.summary(state);
  else betweenDays();
  if (loaded.fresh || loaded.migrated) save(true);
  $("#app").classList.add("ready");
  requestAnimationFrame((t) => { last = t; frame(t); });

  // Móc kiểm thử (e2e): tua thời gian ca không cần chờ thật, mở thẳng sự kiện.
  window.__game = {
    get state() { return state; },
    act,
    advance(ms) { for (let left = ms; left > 0 && state.shift && !state.shift.dialog; left -= 200) act({ type: "tick", dt: Math.min(200, left) }, true); },
    get paused() { return paused || !!overlays.current; },
    get overlay() { return overlays.current; },
    customer: (cid) => customer(state, cid),
    forceEvent(id) {
      const r = openEvent(state, id);
      if (r.ok) { save(true); if (state.shift) panels.event(state, { onDone: () => {} }); else betweenDays(); }
      return r;
    },
    showSummary: () => overlays.summary(state),
    sound: () => soundDebug(), // trạng thái âm thanh cho e2e (ctx, cảnh, vòng lặp đang chạy, số tiếng đã phát)
    sceneToClient(x, y) { const r = $("#scene").getBoundingClientRect(); const [sx, sy] = scene.toScreen(x, y); return [r.left + sx, r.top + sy]; },
    visibleRect: () => scene.visibleRect(),
    store: () => ({ day: store.replayInfo()?.day ?? null }),
  };
}

boot().catch((e) => {
  const m = document.getElementById("bootError");
  if (m) { m.hidden = false; m.textContent = "Không tải được tiệm: " + (e?.message || e); }
  console.error(e);
});
