// Nối mọi thứ: tải manifest + ảnh → đọc bản lưu → vòng lặp (tick theo thời gian ca) → render cảnh / quầy / HUD → lưu tự động.
// Trạng thái chỉ đổi qua apply() (core/apply.js). Giao diện đọc trạng thái + sự kiện trả về để chạy hiệu ứng, âm thanh, thông báo.
import { makeAtlas, SHEETS, icon } from "./render/atlas.js?v=snap2";
import { createScene } from "./render/scene.js";
import { createBrew } from "./ui/brew.js";
import { createHud, createRail, createOverlays, toast, fmtK } from "./ui/screens.js";
import { createPanels } from "./ui/panels.js";
import { apply } from "./core/apply.js";
import { customer } from "./core/shift.js";
import { currentEvent, openEvent } from "./core/drama.js";
import { PLACE_REASON } from "./core/decor.js";
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
  // chỉ tải sheet có trong manifest (sheet Codex đang vẽ sẽ tự được dùng khi thêm vào manifest)
  const files = new Set((manifest.items || []).map((i) => i.filename));
  await Promise.all(Object.values(SHEETS).filter((src) => files.has(src)).map((src) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = src; })));

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

  const toasts = $("#toasts");
  const say = (t, kind = "") => toast(toasts, t, kind);
  const scene = createScene($("#scene"), atlas, { onCustomer: (cid) => act({ type: "pin", cid }) });
  const brew = createBrew($("#brew"), atlas, (a) => act(a));
  const hud = createHud($("#hud"), atlas);
  const rail = createRail($("#rail"), atlas, (cid) => act({ type: "pin", cid }));
  let panels;
  const overlays = createOverlays($("#overlay"), atlas, (a) => act(a), {
    state: () => state,
    afterIntro: () => overlays.prep(state),
    resume: () => { paused = false; },
    restart: () => { if (!store.reset()) return false; restarting = true; location.reload(); return true; },
    onClose: () => {},
    notebook: (tab, back) => panels.notebook(state, tab, back),
    journal: (back) => panels.journal(state, back),
    arrange: () => arrange(),
    afterSummary: () => betweenDays(),
  });
  panels = createPanels(atlas, (a) => act(a), overlays, { state: () => state, resume: () => { paused = false; }, toast: say });

  /** Sau bảng chốt ca: sự kiện giữa hai ca (nếu có) rồi bảng Chuẩn bị ca. */
  function betweenDays() {
    if (currentEvent(state) && !state.shift) panels.event(state, { onDone: () => betweenDays() });
    else overlays.prep(state);
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
  };

  function act(a, fromLoop = false) {
    const r = apply(state, a);
    if (r.err) {
      if (!fromLoop && ERR[r.err]) { say(ERR[r.err](r), "warn"); play("error"); }
      return r;
    }
    let justDid = null;
    for (const e of r.events) {
      switch (e.type) {
        case "brewed":
          justDid = e.step;
          play(e.step === "ice" ? "ice" : e.step === "topping" ? "plop" : e.step === "lid" ? "seal" : e.step === "cup" ? "plop" : "pour");
          if (e.also?.length && e.step === "cup") say(`Pha đồng loạt: ${e.also.length + 1} ly cùng yêu cầu.`, "good");
          break;
        case "arrive": play("bell"); break;
        case "pinned": play("plop"); break;
        case "filled": play("plop"); say(`Đã ghép ly ${e.n}/${e.of} vào đơn. Pha tiếp ly kế!`, "good"); break;
        case "served": {
          play("coin");
          const p = scene.posOf(state, e.cid);
          if (p) scene.burst("bfx", "coin", p[0], p[1] - 132, 1, reduced());
          scene.burst("bfx", "success", 548, 412, 1, reduced());
          scene.served();
          brew.act("serve");
          say(`+${fmtK(e.price)}${e.cups > 1 ? ` (${e.cups} ly)` : ""} · ${e.stars} sao${e.xp ? ` · +${e.xp} XP` : ""}${e.tip ? ` · thưởng ${e.tip}k` : ""}${e.repay ? ` · trả ký gửi ${e.repay}k` : ""}`, e.stars >= 4 ? "good" : e.stars <= 2 ? "warn" : "");
          break;
        }
        case "complaint": play("sad"); setTimeout(() => state.shift?.dialog && overlays.complaint(state), reduced() ? 0 : 450); break;
        case "drama": play("bell"); setTimeout(() => { if (state.shift?.dialog?.kind === "event" && !overlays.current) panels.event(state, { onDone: () => {} }); }, reduced() ? 0 : 350); break;
        case "dramaResolved": play(e.rolled === "lose" ? "sad" : "coin"); break;
        case "missionDone": play("level"); say(`Xong nhiệm vụ: ${e.text} (+${e.xp} XP${e.money ? `, +${e.money}k` : ""})`, "good"); break;
        case "timeout": play("sad"); say(`${e.name} bỏ về vì chờ lâu. −1 review 1 sao.`, "warn"); break;
        case "levelUp": { play("level"); const real = e.unlocks.filter((u) => u.kind !== "note"); say(`Lên cấp ${e.level}!${real.length ? " Mở: " + real.map((u) => u.name).join(", ") : ""}`, "good"); break; }
        case "restocked": say(`Nhập ${e.n} phần ${STOCK[e.id].name} (−${fmtK(e.price)}${e.express ? ", giao gấp" : ""}${e.supplier === "si" ? ", vựa sỉ" : ""})`); break;
        case "shiftEnded": setTimeout(() => overlays.summary(state), reduced() ? 0 : 600); break;
        case "cooking": play("plop"); say("Bắt đầu nấu mẻ " + e.size + " phần trân châu."); break;
        case "batchDone": play("bell"); say("Mẻ trân châu " + e.size + " phần đã chín!", "good"); break;
        case "bought": play("level"); scene.setOwned(state); say("Đã mua " + EQUIPMENT[e.id].name + " (−" + fmtK(e.price) + ")", "good"); break;
        case "placed": play("plop"); break;
        case "consigned": play("coin"); say(`Dì Ba ký gửi một gói hàng (${fmtK(e.owed)}), bán tới đâu trừ tới đó.`, "good"); break;
        case "promoted": play("coin"); say(e.line, "good"); break;
        case "replied": play("plop"); say(`Đã trả lời: “${e.line}”`, "good"); break;
        case "shiftStarted": if (params.get("calm") === "1" && state.shift) state.shift.drama.max = 0; say(`Mở cửa ngày ${e.day}! ${e.guests} khách dự kiến.`, "good"); break;
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
  const syncMute = () => {
    const m = isMuted(); muteBtn.setAttribute("aria-pressed", m ? "true" : "false");
    const ic = m ? "sound-off" : "sound-on";
    if (atlas.has("icons", ic)) { muteBtn.textContent = ""; muteBtn.appendChild(icon(atlas, ["icons", ic], 24)); muteBtn.setAttribute("aria-label", m ? "Tiếng: tắt" : "Tiếng: bật"); }
    else muteBtn.textContent = m ? "Tiếng: tắt" : "Tiếng: bật";
  };
  muteBtn.addEventListener("click", () => { setMuted(!isMuted()); syncMute(); });
  syncMute();
  $("#helpBtn").addEventListener("click", () => { if (state.shift) paused = true; overlays.help(); });
  $("#bookBtn").addEventListener("click", () => {
    if (overlays.current && overlays.current !== "prep" && overlays.current !== "pause") return;
    const back = overlays.current === "prep" ? () => overlays.prep(state) : null;
    if (state.shift) paused = true;
    panels.notebook(state, "reviews", back || (() => { if (state.shift) overlays.pause(state, "pause"); else overlays.prep(state); }));
  });
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
    sceneToClient(x, y) { const r = $("#scene").getBoundingClientRect(); const [sx, sy] = scene.toScreen(x, y); return [r.left + sx, r.top + sy]; },
  };
}

boot().catch((e) => {
  const m = document.getElementById("bootError");
  if (m) { m.hidden = false; m.textContent = "Không tải được tiệm: " + (e?.message || e); }
  console.error(e);
});
