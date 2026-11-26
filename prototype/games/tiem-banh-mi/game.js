// Nối mọi thứ: tải manifest + ảnh → đọc bản lưu → vòng lặp (tick theo thời gian ca) → vẽ cảnh / quầy ráp / HUD → lưu tự động.
// Trạng thái chỉ đổi qua apply() (core/apply.js). Giao diện đọc trạng thái + sự kiện trả về để chạy hiệu ứng, âm thanh, thông báo.
import { makeAtlas, SHEETS, HD_SHEETS, LAZY_SHEETS, OPTIONAL_SHEETS, KEEP_BASE, preload } from "./render/atlas.js?v=b8";
import { placeholderFallback } from "./render/placeholder.js?v=b8";
import { createScene } from "./render/scene.js?v=b8";
import { createBench } from "./ui/bench.js?v=b8";
import { createHud, createRail, createOverlays, toast, fmtK, levelUpShare } from "./ui/screens.js?v=b8";
import { shareResult } from "../_shared/share.js?v=s2";
import { apply } from "./core/apply.js?v=b8";
import { customer } from "./core/shift.js?v=b8";
import { hint } from "./core/tutorial.js?v=b8";
import { itemName } from "./core/rescue.js?v=b8";
import { STEP_NAME, STEPS } from "./core/board.js?v=b8";
import { STOCK, NAMES } from "./data/economy.js?v=b8";
import { OVEN_LINES, LOW_LINES } from "./data/lines-ops.js?v=b8";
import { shopSave, browserStorage } from "./save.js?v=b8";
import { setJournalBg } from "./ui/journal.js?v=b8";
import { currentEvent, openEvent } from "./core/drama.js?v=b8";
import { DECOR } from "./data/equipment.js?v=b8";
import { PLACE_REASON } from "./core/progress.js?v=b8";
import { play, playEvent, soundMode, cycleSoundMode, unlockSound, setSoundScene, syncSound, soundDebug, MUTE_KEY, MUSIC_KEY } from "./ui/sfx.js?v=b8";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => reducedMQ.matches;
const pickOf = (list, i) => list[i % list.length];

async function boot() {
  const manifest = await (await fetch("data/asset-manifest.json?v=b6")).json();
  const atlas = makeAtlas(manifest, "", { fallback: placeholderFallback() });
  const files = new Set((manifest.items || []).map((i) => i.filename));
  const load = preload;
  const hdOn = Object.entries(HD_SHEETS).filter(([, f]) => files.has(f));
  const replaced = new Set(hdOn.filter(([al]) => !KEEP_BASE.has(al)).map(([al]) => SHEETS[al]));
  const want = [...Object.entries(SHEETS).filter(([al, src]) => files.has(src) && !replaced.has(src) && !(OPTIONAL_SHEETS.has(al) && !files.has(src))).map(([, s]) => s), ...hdOn.map(([, f]) => f)];
  const store = shopSave(browserStorage());
  const seed = params.has("seed") ? Number(params.get("seed")) >>> 0 : (Math.random() * 2 ** 32) >>> 0;
  const loaded = store.read(seed);
  // M5 tải nhanh: chỉ chờ ảnh của khung hình đầu (cảnh đang ở — xe đẩy hay tiệm — + chủ tiệm, lò, đồ trên quầy, icon), tối đa 2,5 giây.
  // Khách, ổ bánh cận cảnh (HD), chân dung, thời tiết, trang trí… tải nền sau khi tiệm hiện ra (CSS nền tự tải khi cần, không hỏng hình).
  const first = new Set([loaded.state.shop ? SHEETS.shop : SHEETS.cart, loaded.state.shop ? SHEETS.shopFg : SHEETS.cartFg, SHEETS.baker, SHEETS.chars, SHEETS.ovens, SHEETS.equip, SHEETS.icons, SHEETS.ingr]);
  await Promise.race([Promise.all(want.filter((src) => first.has(src)).map(load)), new Promise((ok) => setTimeout(ok, 2500))]);
  const idle = globalThis.requestIdleCallback || ((f) => setTimeout(f, 300));
  // PERF-01: chỉ tải nền sprite thường của cảnh (khách, đồ, hiệu ứng). Sheet lớn LAZY_SHEETS (chân dung / biểu cảm / NPC HD, cận cảnh HD,
  // thời tiết, thẻ Nhật Ký, ảnh tựa) KHÔNG tải nền: trình duyệt tải khi màn của nó hiện (nền CSS), game tải trước đúng màn kế tiếp:
  // mở ca ⇒ sheet trong ca (hội thoại, cận cảnh), hết ca ⇒ thẻ Nhật Ký. Icon đang chờ sheet hiện ô mờ giữ cỗ (atlas.js .loading).
  const rest = want.filter((src) => !first.has(src) && !LAZY_SHEETS.has(src));
  // người chơi mới đang ở màn chào: sprite trong quán chưa cần ⇒ bắt đầu tải khi bấm qua màn chào (hooks.afterIntro)
  let restOn = false;
  const startRest = () => { if (restOn) return; restOn = true; idle(() => { let i = 0; const nextBatch = () => { const part = rest.slice(i, i + 3); i += 3; if (part.length) Promise.all(part.map(load)).then(() => idle(nextBatch)); }; nextBatch(); }); };
  if (loaded.state.introSeen) startRest();
  const lazyWant = want.filter((src) => LAZY_SHEETS.has(src) && !first.has(src));
  const notShift = new Set([SHEETS.journal, SHEETS.title, SHEETS.shop, SHEETS.shopFg]); // cảnh tiệm lớn: tải khi đổi cảnh (đã nằm trong first nếu đang ở đó)
  const prefetchShift = () => lazyWant.filter((src) => !notShift.has(src)).forEach(load);
  const prefetchJournal = () => { if (files.has(SHEETS.journal)) load(SHEETS.journal); };

  if (files.has("assets/journal-card.webp")) setJournalBg("assets/journal-card.webp");
  let state = loaded.state;
  let paused = false, lastSave = 0, dirty = false, restarting = false;
  const save = (force = false) => {
    if (restarting) return; // đang chơi lại: không ghi đè bản vừa cất
    const now = performance.now();
    if (!force && now - lastSave < 2500) { dirty = true; return; }
    store.write(state); lastSave = now; dirty = false;
  };
  const say = (t, kind = "") => toast($("#toasts"), t, kind);
  /** Vùng bong bóng thoại phải tránh: chip HUD + viên Lò / Gas (toạ độ trong khung cảnh).
   *  D6: nhớ sẵn, không đọc getBoundingClientRect mỗi khung (như hudBottom của Trà Sữa, D5-shops). HUD / viên là lớp phủ tuyệt đối
   *  cùng khung với #scene, dựng một lần ⇒ vị trí tương đối chỉ đổi khi khung cảnh, HUD hay một chip / viên đổi cỡ (đổi chữ, ẩn hiện,
   *  xoay máy) ⇒ ResizeObserver + resize xoá bộ nhớ. Không có ResizeObserver thì đọc mỗi lần như cũ. */
  let avoidCache = null;
  const avoidRects = () => {
    if (avoidCache) return avoidCache;
    const r0 = $("#scene").getBoundingClientRect();
    const out = [...document.querySelectorAll("#hud .chip, #pills > *")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0)
      .map((r) => ({ x0: r.left - r0.left - 4, y0: r.top - r0.top - 4, x1: r.right - r0.left + 4, y1: r.bottom - r0.top + 4 }));
    if (avoidRO) avoidCache = out;
    return out;
  };
  let avoidRO = null;
  const scene = createScene($("#scene"), atlas, { onCustomer: (cid) => act({ type: "pin", cid }), avoid: avoidRects });
  const bench = createBench($("#bench"), atlas, (a) => act(a));
  const hud = createHud($("#hud"), $("#pills"), atlas, (a) => act(a));
  if (typeof ResizeObserver === "function") { // chip / viên dựng xong ở createHud ⇒ theo dõi từ đây
    const dropAvoid = () => { avoidCache = null; };
    avoidRO = new ResizeObserver(dropAvoid);
    for (const e of [$("#scene"), $("#hud"), $("#pills"), ...document.querySelectorAll("#hud .chip, #pills > *")]) if (e) avoidRO.observe(e);
    addEventListener("resize", dropAvoid);
  }
  const rail = createRail($("#rail"), (cid) => act({ type: "pin", cid }));
  /** Giữa hai ca: sự kiện Drama (nếu có) rồi Chuẩn bị ca. */
  const toPrep = (tab) => { if (state.drama?.pending) overlays.event(state, () => toPrep(tab)); else { store.snapshotDay(state); overlays.prep(state, tab); } };
  const overlays = createOverlays($("#overlay"), $("#sheet"), atlas, (a) => act(a), {
    state: () => state,
    afterIntro: () => { startRest(); toPrep(); },
    afterSummary: (tab) => toPrep(tab),
    resume: () => { paused = false; openDialog(); },
    restart: () => { if (!store.reset()) return false; restarting = true; location.reload(); return true; },
    replayInfo: () => { const i = store.replayInfo(); return i && i.seed === state.seed && i.day <= state.day ? i : null; },
    replay: () => { save(true); if (!store.replayDay()) return false; restarting = true; location.reload(); return true; },
    moved: () => showMove(),
    decor: () => decorMode(true),
    sceneImage: () => { const img = document.querySelector('.stage img[data-layer="shop"], .stage img[data-layer="cart"]'); return img && img.complete && img.naturalWidth ? img : null; },
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
    "pan-busy": () => "Chảo đang chiên hết chỗ. Chờ trứng chín.",
    "owned": () => "Đã có rồi.",
    "grill-busy": () => "Bếp than đang có mẻ thịt.",
    "grill-raw": () => "Thịt chưa chín, chờ thêm chút.",
    "too-soon": () => "Hội chợ mỗi 4 ngày mới thuê gian lại được.",
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
        case "step": scene.act(e.step === "wrap" ? "wrap" : "slice", 500); if (e.step === "slice") scene.burst("crumbs", scene.points.boards[0][0], scene.points.boards[0][1] - 20, 0.5, reduced()); if (e.step === "take" && e.n > 1) say(`Ráp ×${e.n} trên thớt dài.`, "good"); if (e.step === "toast" && e.burnt) say("Nướng quá lâu, ổ cháy rồi!", "warn"); break;
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
        case "complaint": case "stockout": case "nochange": case "drama": setTimeout(() => openDialog(), reduced() ? 0 : 350); break;
        case "missionDone": say(`Xong nhiệm vụ: ${e.text} (+${e.xp} XP${e.money ? `, +${e.money}k` : ""})`, "good"); break;
        case "missionsAll": say(e.line, "good"); break;
        case "bought": say(`Đã mua ${e.name} (−${e.price}k). ${e.line || ""}`, "good"); break;
        case "rented": say(e.line, "good"); break;
        case "ranked": say(`Lên hạng tiệm ${e.rank}! ${e.line}`, "good"); break;
        case "preorder": say(`Nhận đơn đặt trước ${e.name}: ${e.n} ổ, cọc ${e.deposit}k.`, "good"); break;
        case "preorderOpen": say(`Đơn đặt trước của ${e.name}: ${e.n} ổ, giao trong ${Math.round((e.due - (state.shift?.t || 0)) / 1000)} giây.`, "good"); break;
        case "preorderFail": say(`Trễ đơn đặt trước của ${e.name}. ${e.line}`, "warn"); break;
        case "helperChange": say(e.line, "good"); break;
        case "partialTaken": say(`Khách lấy luôn ${e.n} ổ đã gói, trả ${e.pay}k (70%).`, "warn"); break;
        case "spareGas": say("Hết gas, đã thay bình dự phòng.", "good"); break;
        case "cookWait": say(e.why === "egg" ? "Trứng đang chiên (6 giây), xong là bỏ vào ổ." : e.why === "meat" ? "Đã bỏ mẻ thịt lên bếp than (25 giây). Chín thì gắp rồi bỏ vào ổ." : e.why === "meat-pull" ? "Thịt chín rồi, bấm “Gắp thịt” trước." : "Hết hàng sống để nấu.", "warn"); break;
        case "eggReady": say("Trứng chín rồi!", "good"); break;
        case "grillReady": say("Mẻ thịt nướng chín, gắp ra!", "good"); break;
        case "grillBurnt": say(e.pulled ? "Mẻ thịt cháy mất rồi." : "Thịt trên bếp than sắp cháy!", "warn"); break;
        case "grillPulled": say(`Gắp ${e.n} phần thịt nướng, giữ ấm tới hết ca.`, "good"); break;
        case "contract": say(e.renew ? `Gia hạn hợp đồng với ${e.name} (còn ${e.left} đợt).` : `Ký hợp đồng với ${e.name}: ${e.left} đợt giao, đợt đầu ngày ${e.next}.`, "good"); break;
        case "contractDone": say(`Trọn hợp đồng với ${e.name}: ${e.done} đợt giao!`, "good"); break;
        case "contractBroken": say(`${e.name} ngưng hợp đồng vì giao trễ.`, "warn"); break;
        case "badge": say(e.line, "good"); break;
        case "challengeResult": say(e.ok ? `Đạt thử thách “${e.name}”! +${e.money}k, +${e.xp} XP` : `Chưa đạt thử thách “${e.name}”.`, e.ok ? "good" : "warn"); break;
        case "challenge": if (e.on) say(`Nhận thử thách hôm nay: ${e.name}.`, "good"); break;
        case "fair": say(`Thuê gian Lễ hội Bánh Mì phố (lần ${e.count}). Ca hôm nay dài hơn, đông hơn!`, "good"); break;
        case "replied": break;
        case "persona": break;
        case "lowStock": say(`“${LOW_LINES[0].replace("{item}", STOCK[e.id]?.name || e.id).replace("{n}", e.n)}”`, "warn"); break;
        case "ranBack": case "delivered": say(e.line, e.wrong ? "warn" : "good"); break;
        case "timeout": say(`${e.name} bỏ về vì chờ lâu. Review 1 sao.`, "warn"); break;
        case "levelUp": { // nút "Khoe" trên thông báo (7 giây); bấm thì ca tạm dừng tới khi đóng bảng chia sẻ. Bảng chốt ca cũng ghi "Lên cấp N!"
          const lv = e.level;
          toast($("#toasts"), `Lên cấp ${lv}!`, "good", { label: "Khoe", act: "shareLevel", onClick: () => shareLevel(lv) });
          break;
        }
        case "phase": showBanner(e.text); break;
        case "restocked": say(`Nhập ${e.n} phần ${STOCK[e.id].name} (−${fmtK(e.price)}${e.express ? ", giao gấp" : ""})`); break;
        case "restockedToday": say(`Đã nhập đủ cho hôm nay (−${fmtK(e.spent)}).`, "good"); break;
        case "consigned": say(`Bà Tư ký gửi một gói hàng (${fmtK(e.owed)}, bán tới đâu trả tới đó).`, "good"); break;
        case "exchanged": say(`Cô Sáu đổi ${e.value}k tiền lẻ.`, "good"); break;
        case "shiftStarted": startRest(); prefetchShift(); dock(); say(`Mở hàng ngày ${e.day}! Khoảng ${e.guests} khách. Phí ca ${e.fee}k.`, "good"); break;
        case "shiftEnded": prefetchJournal(); setTimeout(() => { dock(); overlays.summary(state); }, reduced() ? 0 : 600); break;
        default: break;
      }
    }
    if (!fromLoop) save(true); else if (r.events.length) save();
    return r;
  }
  function openDialog() {
    const d = state.shift?.dialog;
    if (!d || overlays.current) return;
    if (d.kind === "event") overlays.event(state);
    else if (d.kind === "complaint") overlays.complaint(state);
    else if (d.kind === "stockout") overlays.stockout(state);
    else if (d.kind === "nochange") overlays.nochange(state);
  }
  // Khoe lúc lên cấp giữa ca: đang tạo ảnh / bảng chia sẻ đang mở ⇒ đồng hồ ca dừng (khách không mất kiên nhẫn), đóng bảng là chạy tiếp
  let sharing = false;
  function shareLevel(level) {
    if (sharing) return;
    sharing = true;
    shareResult(levelUpShare(state, level)).finally(() => { sharing = false; });
  }
  const shareOpen = () => sharing || !!document.querySelector(".lk-share");
  let bannerT = 0;
  function showBanner(text) { const b = $("#banner"); b.textContent = text; b.hidden = false; clearTimeout(bannerT); bannerT = setTimeout(() => { b.hidden = true; }, 2600); }

  // ---------- vòng lặp ----------
  let last = performance.now();
  const shopLabel = $("#shopLabel"), hintbar = $("#hintbar"), away = $("#away");
  const running = () => state.shift && state.shift.status === "open" && !state.shift.dialog && !paused && !overlays.current && !shareOpen();
  function frame(now) {
    // TLC22-01: hẹn khung sau TRƯỚC khi làm việc ⇒ một lỗi trong event / vẽ không bao giờ làm đơ cả game
    requestAnimationFrame(frame);
    try { step(now); } catch (err) { console.error(err); }
  }
  function step(now) {
    const dt = Math.min(250, now - last); last = now;
    if (running()) act({ type: "tick", dt }, true);
    if (dirty && performance.now() - lastSave > 2500) save(true);
    const sh = state.shift;
    const mode = paused ? "quiet" : sh?.dialog ? "dialog" : running() ? "service" : !sh ? "prep" : "quiet";
    setSoundScene(mode, mode === "service" && sh.oven.some(Boolean));
    const hn = sh?.tutorial ? hint(state) : null;
    scene.update(state, { reduced: reduced(), hintPin: hn?.key === "pin" });
    if ((state.shop ? "shop" : "cart") !== sceneMode) { sceneMode = state.shop ? "shop" : "cart"; layout(); }
    $("#world").dataset.weather = state.weather?.kind === "rain" && state.weather.day === state.day && sh ? "rain" : "";
    rail(state, hn?.key === "pin");
    hud(state);
    // số review chưa trả lời: chấm trên nút Sổ (thanh trên) và nút Sổ của dock điện thoại
    { const n = (state.feed || []).filter((r) => !r.reply).length; for (const b of document.querySelectorAll("#bookBtn, #dock button[data-dock=book]")) { if (n) b.dataset.count = n > 9 ? "9+" : String(n); else delete b.dataset.count; } }
    bench.render(state, hn);
    bench.frame(state);
    revealStep(sh, hn);
    hintbar.hidden = !hn;
    if (hn && hintbar.textContent !== hn.text) hintbar.textContent = hn.text;
    away.hidden = !sh?.away;
    if (sh?.away) away.textContent = sh.away.kind === "change" ? "Đang chạy qua Cô Sáu đổi tiền lẻ…" : sh.away.kind === "si" ? "Đang chạy ra lò đầu hẻm mua bánh sỉ…" : sh.away.kind === "gas" ? "Đang chạy qua Cô Sáu mượn bình gas…" : `Đang chạy ra chợ mua ${itemName(sh.away.id)}… (${Math.ceil((sh.away.until - sh.t) / 1000)}s)`;
    $("#pauseBtn").disabled = !sh;
    if (shopLabel.textContent !== state.shopName) shopLabel.textContent = state.shopName;
  }

  // Bước đổi ⇒ cuộn tới nút của bước đó (TLC2-01: trên điện thoại trước đây mỗi đơn phải tự cuộn 2–4 lần).
  // Không tự cuộn khi đang ráp mà lò chín (nút Rút ở viên thuốc trên cảnh), khi chờ lò / nướng lại, hoặc khi có bảng phủ.
  let revealKey = "";
  const BUILD = ["spread", "fill", "veg", "spice", "wrap"];
  function revealStep(sh, hn) {
    if (!sh || sh.dialog || overlays.current) { revealKey = ""; return; }
    const b = sh.boards[sh.sel];
    let h = hn || hint(state);
    if (!h && sh.paying !== null) h = { key: "change" }; // đang chạy đi đổi lẻ (gợi ý tắt): khay thối tiền vẫn phải nằm trong khung
    // lò chín giữa lúc ráp / thối tiền: nút Rút có sẵn ở viên Lò trên cảnh ⇒ vẫn cuộn tới bước đang làm (khay thối tiền)
    if (h?.key === "pull" && (b?.loaf || sh.paying !== null)) h = sh.paying !== null ? { key: "change" } : null;
    let keys = h && !["waitOven", "idle", "toasting"].includes(h.key) ? [h.key] : [];
    // đang ráp: thấy cùng lúc nhóm đang làm (còn bấm thêm được) và nhóm kế mà phiếu thật sự cần (bỏ qua nhóm phiếu không có)
    if (keys.length && BUILD.includes(h.key) && b?.loaf && b.cid !== null) {
      const it = customer(state, b.cid)?.items[b.item];
      if (it) {
        const need = { spread: Object.values(it.spreads).some(Boolean), fill: it.fills.length > 0, veg: Object.values(it.veg).some(Boolean), spice: it.ot > 0 || Object.values(it.sauces).some(Boolean), wrap: true };
        const cur = STEPS[b.step], next = STEPS.slice(Math.max(b.step + 1, 3)).find((x) => need[x]) || "wrap";
        // nhóm đang làm đã đủ theo phiếu ⇒ chỉ cần thấy nhóm kế (khung thấp như điện thoại xoay ngang không chứa nổi cả hai nhóm)
        const l = b.loaf, curDone = cur === "spread" ? Object.keys({ ...it.spreads, ...l.spreads }).every((id) => (it.spreads[id] || 0) === (l.spreads[id] || 0))
          : cur === "fill" ? it.fills.every((id) => l.fills.includes(id)) : cur === "veg" ? Object.keys({ ...it.veg, ...l.veg }).every((id) => !!it.veg[id] === !!l.veg[id])
          : cur === "spice" ? it.ot === l.ot && Object.keys({ ...it.sauces, ...l.sauces }).every((id) => !!it.sauces[id] === !!l.sauces[id]) : false;
        keys = BUILD.includes(cur) && cur !== next && !curDone ? [cur, next] : [next];
      }
    }
    const k = JSON.stringify([keys, sh.sel, b?.cid, b?.item, sh.paying]);
    if (k === revealKey) return;
    revealKey = k;
    if (keys.length) bench.reveal(keys);
  }

  // ---------- bố cục ----------
  // điện thoại + máy tính bảng dọc (≤ 1024, TLC2-03) dùng bố cục xếp dọc; phải khớp media query trong index.html
  const mobile = matchMedia("(max-width: 760px) and (min-height: 501px), (max-width: 1024px) and (orientation: portrait)");
  // điện thoại xoay ngang (TLC2-04): bố cục 2 cột riêng (khối cuối index.html); cảnh nhỏ ⇒ khung theo vùng như mobile, ổ cận cảnh nhỏ lại
  const short = matchMedia("(orientation: landscape) and (max-height: 500px)");
  let camQueue = false, sceneMode = state.shop ? "shop" : "cart";
  function layout() {
    // mobile: luôn thấy từ chủ tiệm sau xe tới hàng chờ (cắt bớt bầu trời / lòng đường)
    if (mobile.matches || short.matches) { const r = scene.region(camQueue ? "queue" : "work"); scene.layoutFit(r[0], r[1], r[2], r[3]); } else scene.layout(660, 400, 1);
    bench.setLoafScale(mobile.matches ? 1 : short.matches ? 0.5 : innerHeight < 820 ? 0.75 : 1);
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
  const openBook = (tab) => { if (overlays.current && !["prep", "pause", "summary"].includes(overlays.current)) return; if (state.shift) paused = true; overlays.notebook(state, tab); };
  $("#bookBtn").addEventListener("click", () => openBook());
  // dock mobile 5 nút: Quầy · Lò · Khách · Kho · Sổ (SCREENS.md)
  function dock() { for (const b of document.querySelectorAll("#dock button")) b.disabled = !state.shift && b.dataset.dock !== "book"; }
  document.querySelector("#dock").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-dock]"); if (!b) return;
    const k = b.dataset.dock;
    if (k === "bench") { camQueue = false; layout(); $("#bench").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); }
    else if (k === "oven") { const o = document.querySelector('#bench [data-act="pull"], #bench [data-act="bake"]'); o?.scrollIntoView({ block: "center" }); const p = document.querySelector('[data-act="ovenPill"]'); if (p && state.shift) p.click(); }
    else if (k === "queue") { camQueue = !camQueue; b.classList.toggle("on", camQueue); layout(); $("#world").scrollIntoView({ block: "start" }); }
    else if (k === "stock") { if (state.shift) { paused = true; overlays.prep(state, "stock"); } }
    else if (k === "book") openBook();
  });
  dock();
  // ---------- lên tiệm: cảnh chuyển 4 giây ----------
  function showMove() {
    const m = $("#move"); m.hidden = false; m.classList.remove("go"); void m.offsetWidth; m.classList.add("go");
    setTimeout(() => { m.hidden = true; }, reduced() ? 600 : 4000);
  }
  // ---------- sắp xếp trang trí (kéo thả trong cảnh tiệm) ----------
  let decorSel = null;
  function decorMode(on) {
    const bar = $("#decorBar");
    bar.hidden = !on; $("#app").classList.toggle("decor-on", on);
    if (!on) { decorSel = null; store.snapshotDay(state); overlays.prep(state, "shop"); return; }
    bar.textContent = "";
    const t = document.createElement("b"); t.textContent = "Chọn đồ rồi kéo / chạm vào chỗ muốn đặt trong tiệm:"; bar.appendChild(t);
    for (const id of Object.keys(DECOR)) {
      if (!state.owned[id]) continue;
      const b = document.createElement("button"); b.type = "button"; b.className = "btn small" + (decorSel === id ? " primary" : ""); b.dataset.decor = id; b.textContent = DECOR[id].name;
      b.addEventListener("click", () => { decorSel = id; decorMode(true); });
      bar.appendChild(b);
    }
    if (decorSel) { const r = document.createElement("button"); r.type = "button"; r.className = "btn small"; r.dataset.act = "resetPlace"; r.textContent = "Đặt lại chỗ cũ"; r.addEventListener("click", () => { act({ type: "resetPlace", id: decorSel }); }); bar.appendChild(r); }
    const done = document.createElement("button"); done.type = "button"; done.className = "btn primary small"; done.dataset.act = "decorDone"; done.textContent = "Xong"; done.addEventListener("click", () => decorMode(false)); bar.appendChild(done);
  }
  const sceneEl = $("#scene");
  let dragging = false;
  const placeAtEvent = (e, commit) => {
    if (!decorSel || bar().hidden) return;
    const r = sceneEl.getBoundingClientRect(); const [x, y] = scene.toScene(e.clientX - r.left, e.clientY - r.top);
    if (!commit) { const g = document.querySelector(`.decor[data-decor="${decorSel}"]`); if (g) g.style.translate = "0 0"; return; }
    const res = act({ type: "place", id: decorSel, x, y });
    if (res.err) say(PLACE_REASON[res.detail?.reason] || "Chỗ này không đặt được.", "warn");
  };
  const bar = () => $("#decorBar");
  sceneEl.addEventListener("pointerdown", (e) => { if (!decorSel || bar().hidden) return; dragging = true; sceneEl.setPointerCapture?.(e.pointerId); e.preventDefault(); });
  sceneEl.addEventListener("pointerup", (e) => { if (!dragging) return; dragging = false; placeAtEvent(e, true); });
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
    if (key === "s") { $("#bookBtn").click(); return; }
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
  else toPrep();
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
    get event() { return currentEvent(state); },
    openEvent(id) { const r = openEvent(state, id); if (r.ok) { if (state.shift) openDialog(); else overlays.event(state, () => toPrep()); } return r; },
    save: () => save(true),
    overlays,
    scene,
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
