// Nối mọi thứ: tải manifest (+ toạ độ cảnh) → đọc bản lưu → vòng lặp (tick theo thời gian ca) → vẽ cảnh / Thanh Bếp / Cột Dĩa / HUD → lưu tự động.
// Trạng thái chỉ đổi qua apply() (core/apply.js). Giao diện đọc trạng thái + sự kiện trả về để chạy hiệu ứng, âm thanh, thông báo.
import { makeAtlas, SHEETS, HD_SHEETS, LAZY_SHEETS, OPTIONAL_SHEETS, KEEP_BASE, preload } from "./render/atlas.js?v=c6";
import { placeholderFallback } from "./render/placeholder.js?v=c6";
import { createScene } from "./render/scene.js?v=c6";
import { configureScene } from "./core/placements.js?v=c6";
import { createGrillbar } from "./ui/grillbar.js?v=c6";
import { createColumn } from "./ui/column.js?v=c6";
import { createOverlays, levelUpShare } from "./ui/overlays.js?v=c6";
import { shareResult } from "../_shared/share.js?v=s1";
import { createDrama } from "./ui/drama.js?v=c6"; // B: drama
import { createBigGrill } from "./ui/bigrill.js?v=c6"; // V: bếp lớn HD
import { el, toast, fmtK, clockText, tableName } from "./ui/common.js?v=c6";
import { apply } from "./core/apply.js?v=c6";
import { hint } from "./core/tutorial.js?v=c6";
import { layerStrip } from "./core/plate.js?v=c6";
import { tableJob, groupById } from "./core/tables.js?v=c6";
import { ownerFree, ownerBusyWhy } from "./core/walker.js?v=c6";
import { itemName } from "./core/rescue.js?v=c6";
import { MISTAKES } from "./core/score.js?v=c6";
import { shopSave, browserStorage } from "./save.js?v=c6";
import { DISHES, LEVELS } from "./data/economy.js?v=c6";
import { setJournalBg } from "./ui/journal.js?v=c6"; // C: nền thẻ Nhật Ký
import { needPersona } from "./core/reviews.js?v=c6"; // C: hỏi tính cách một lần
import { addNewDishes } from "./core/progress.js?v=c6"; // A: móc e2e nhảy cấp
import * as PU from "./ui/progress-ui.js?v=c6"; // A: thông báo + lỗi của phần tiến trình M3
import { playEvent, play, soundMode, cycleSoundMode, unlockSound, setSoundScene, syncSound, soundDebug, MUTE_KEY, MUSIC_KEY } from "./ui/sfx.js?v=c6";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => reducedMQ.matches;
const TASK_NAME = { visit: "châm trà, lấy phiếu", deliver: "bưng dĩa", bill: "tính tiền", clean: "dọn bàn", wash: "rửa chén", rice: "bưng chén cơm", moHanh: "làm mỡ hành", marinate: "ướp sườn" };

async function boot() {
  const manifest = await (await fetch("data/asset-manifest.json?v=c6")).json();
  configureScene(manifest.placements || {});
  const atlas = makeAtlas(manifest, "", { fallback: placeholderFallback() });
  const files = new Set((manifest.items || []).map((i) => i.filename));
  if (files.has("assets/journal-card.webp")) setJournalBg("assets/journal-card.webp"); // C:
  const load = preload;
  const hdOn = Object.entries(HD_SHEETS).filter(([, f]) => files.has(f));
  const replaced = new Set(hdOn.filter(([al]) => !KEEP_BASE.has(al)).map(([al]) => SHEETS[al]));
  const want = [...Object.entries(SHEETS).filter(([al, src]) => files.has(src) && !replaced.has(src) && !(OPTIONAL_SHEETS.has(al) && !files.has(src))).map(([, s]) => s), ...hdOn.map(([, f]) => f)];
  const store = shopSave(browserStorage());
  const seed = params.has("seed") ? Number(params.get("seed")) >>> 0 : (Math.random() * 2 ** 32) >>> 0;
  const loaded = store.read(seed);
  // tải nhanh: chỉ chờ ảnh của khung hình đầu (cảnh đang ở + chủ quán + bếp + thiết bị + bàn), tối đa 2,5 giây; phần còn lại tải nền
  const st0 = loaded.state.stage === "quan";
  const first = new Set([st0 ? SHEETS.quan : SHEETS.street, st0 ? SHEETS.quanFg : SHEETS.streetFg, SHEETS.owner, SHEETS.grill, SHEETS.grillItems, SHEETS.equip, SHEETS.tables, SHEETS.tableItems]);
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
  const notShift = new Set([SHEETS.journal, SHEETS.title, SHEETS.quan, SHEETS.quanFg]); // cảnh tiệm lớn: tải khi đổi cảnh (đã nằm trong first nếu đang ở đó)
  const prefetchShift = () => lazyWant.filter((src) => !notShift.has(src)).forEach(load);
  const prefetchJournal = () => { if (files.has(SHEETS.journal)) load(SHEETS.journal); };

  let state = loaded.state;
  let paused = false, lastSave = 0, dirty = false, restarting = false;
  const save = (force = false) => {
    if (restarting) return; // đang chơi lại: không ghi đè bản vừa cất
    const now = performance.now();
    if (!force && now - lastSave < 2500) { dirty = true; return; }
    store.write(state); lastSave = now; dirty = false;
  };
  const say = (t, kind = "") => toast($("#toasts"), t, kind);
  /** Vùng bong bóng phải tránh trong khung cảnh: dải gợi ý, thông báo, băng chữ. */
  const avoidRects = () => {
    const r0 = $("#scene").getBoundingClientRect();
    return [...document.querySelectorAll("#hintbar:not([hidden]), #toasts .toast, #banner:not([hidden])")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0)
      .map((r) => ({ x0: r.left - r0.left - 4, y0: r.top - r0.top - 4, x1: r.right - r0.left + 4, y1: r.bottom - r0.top + 4 }));
  };
  const scene = createScene($("#scene"), atlas, {
    onTable: (tid, gid) => { const r = act({ type: "tableTap", tid, gid: gid ?? undefined }); if (!r.err || gid !== null) scene.selectGroup(null); },
    onGroup: (gid) => { scene.selectGroup(scene.selected === gid ? null : gid); },
    avoid: avoidRects,
  });
  let bigOpen = false; // V: bếp lớn (desktop bảng nổi trên cảnh; mobile ở dock Bếp)
  const grillbar = createGrillbar($("#grillbar"), atlas, (a) => act(a), { onFan: (on) => { if (state.shift && (on || state.shift.grill.fan)) act({ type: "fan", on }, !on); }, onBig: () => { bigOpen = !bigOpen; }, isBig: () => bigOpen });
  const big = createBigGrill(atlas, (a) => act(a), { onClose: () => { bigOpen = false; if (narrow.matches) setDock("plate"); } });
  const BIG_PULSE = { flip: "grill", placed: "grill", moved: "grill", teaPoured: "pour", billOpen: "bill", paid: "bill" };
  const column = createColumn($("#rail"), $("#work"), atlas, (a) => act(a), { selectGroup: (gid) => scene.selectGroup(gid), selected: () => scene.selected });
  const toPrep = (tab) => { if (needPersona(state)) return overlays.personaAsk(state, () => toPrep(tab)); /* C: bản lưu cũ hỏi tính cách một lần */ store.snapshotDay(state); overlays.prep(state, tab); if (!state.shift && state.drama?.pending) drama.open(() => overlays.prep(state, tab)); /* B: sự kiện giữa hai ngày hiện trên Chuẩn bị */ };
  const overlays = createOverlays($("#overlay"), $("#sheet"), atlas, (a) => act(a), {
    state: () => state,
    afterIntro: () => { startRest(); if (state.shift) { paused = true; overlays.pause(); } else if (state.lastSummary && !state.lastSummary.seen) overlays.summary(state); else toPrep(); },
    afterSummary: () => toPrep("buy"),
    resume: () => { paused = false; openDialog(); },
    restart: () => { if (!store.reset()) return false; restarting = true; location.reload(); return true; },
    replayInfo: () => { const i = store.replayInfo(); return i && i.seed === state.seed && i.day <= state.day ? i : null; },
    replay: () => { save(true); if (!store.replayDay()) return false; restarting = true; location.reload(); return true; },
    toast: (t, k) => say(t, k),
    sceneImage: () => document.querySelector('.stage img[data-layer="quan"], .stage img[data-layer="street"]'), // C: ảnh cảnh cho thẻ Nhật Ký dự phòng
  });

  const drama = createDrama(atlas, { act: (a) => act(a), state: () => state }); // B: drama
  const ERR = {
    "owner-busy": () => { const w = ownerBusyWhy(state); return w.why === "away" ? "Cô chủ đang chạy ra chợ, chờ chút!" : w.why === "task" ? `Cô chủ đang ${TASK_NAME[w.kind] || "bận"}${w.tid ? " ở " + tableName(w.tid).toLowerCase() : ""} — xong mới về bếp được.` : "Cô chủ đang đi về bếp…"; },
    "no-ticket": () => "Chạm một phiếu để ghim lên ô bày trước.",
    "need-container": () => "Lấy dĩa (hoặc hộp) trước đã.",
    "need-com": () => "Xới cơm trước đã.",
    "has-container": () => "Dĩa đã có rồi.",
    "no-plates": () => "Hết dĩa sạch! Rửa chén, hoặc tạm dùng hộp.",
    "no-hop": () => "Hết hộp rồi.",
    "rice-cooking": () => "Nồi cơm đang nấu, chờ chút.",
    "rice-empty": () => "Nồi hết cơm! Bấm Nấu (40 giây).",
    "rice-full": () => "Nồi cơm còn đầy.",
    "com-max": () => "Đã hai vá rồi. Bấm Hoàn tác để bớt.",
    "mo-hanh-empty": () => "Hũ mỡ hành hết! Bấm Mỡ hành để làm hũ mới (8 giây).",
    "mo-hanh-max": () => "Đã thêm mỡ hành rồi. Bấm Hoàn tác để bớt.",
    "no-meat": () => "Chưa có miếng nào chín hai mặt. Nướng thêm trên vỉ.",
    "has-meat": () => "Dĩa đã có món nướng.",
    "grill-full": () => "Vỉ đầy rồi.",
    "slot-busy": () => "Ô bày đang có dĩa dở của phiếu khác. Giao hoặc đổ dĩa trước.",
    "cooked-wait": () => "Miếng này chín rồi, đang giữ ấm. Mở phiếu + xới cơm rồi gắp vào dĩa.",
    "warm-full": () => "Vùng giữ ấm đầy.",
    "table-dirty": () => "Bàn dơ! Dọn bàn trước rồi mới mời khách ngồi.",
    "table-small": () => "Bàn này không đủ chỗ cho nhóm.",
    "table-taken": () => "Bàn đang có khách.",
    "no-guest": () => "Chưa có khách chờ. Chạm khách đang đứng chờ rồi chạm bàn.",
    "no-job": () => "Bàn này chưa cần gì.",
    "queue-full": () => "Cô chủ đang có 4 việc chờ, làm từ từ thôi!",
    "queued": () => "Việc này đã giao cho cô chủ rồi.",
    "no-dirty": () => "Thau không có dĩa dơ.",
    "empty-bill": () => "Chạm các món bàn đã dùng để cộng tiền trước.",
    "manual-bill": () => "Từ ngày 4 phải tự cộng tiền.",
    "money": () => "Không đủ tiền.",
    "capacity": () => "Kho đầy rồi.",
    "locked": () => "Chưa mở khoá.",
    "no-than": () => "Không đủ than (cần 2 rổ).",
    "no-gao": () => "Hết gạo tấm.",
    "pan-busy": () => "Chảo đang chiên.",
    "egg-raw": () => "Trứng còn sống.",
    "no-suon": () => "Không còn sườn sống để ướp.",
    "no-mo-hanh-bo": () => "Hết bộ làm mỡ hành.",
    "owned": () => "Đã có rồi.",
    "plates-max": () => "Chồng dĩa đã tới trần tủ.",
    ...PU.ERR_EXTRA, // A:
  };
  function act(a, quiet = false) {
    if (a?.type === "startShift") store.snapshotDay(state);
    const r = apply(state, a);
    if (r.err) {
      if (!quiet && a.type !== "tick" && ERR[r.err]) { say(ERR[r.err](r), "warn"); play("error"); }
      if (r.err === "exception") console.error(r.detail);
      return r;
    }
    for (const e of r.events) {
      playEvent(e);
      if (BIG_PULSE[e.type]) big.pulse(BIG_PULSE[e.type]); else if (e.type === "layer") big.pulse(e.id === "hop" ? "box" : "plate"); // V: cô chủ cận cảnh
      switch (e.type) {
        case "flip": scene.act("grill", 450); if (e.perfect) { const p = e.slot < 6 ? scene.points.grillSlots[e.slot] : scene.points.grill2Slots?.[e.slot - 6]; if (p) scene.burst("sizzle", p[0], p[1] - 10, 1, reduced()); } break; // A: bếp 2
        case "placed": scene.act("grill", 400); break;
        case "layer": case "pinned": scene.act("plate", 400); break;
        case "burnt": say("Một miếng sườn cháy đen rồi!", "warn"); break;
        case "flare": say("Lửa bùng! Vùng nóng chín gấp đôi 3 giây.", "warn"); break;
        case "spareSack": say("Hết than trong kho, đã mở bao than dự phòng (+10 rổ).", "good"); break;
        case "say": say(e.text, e.kind); break;
        case "riceReady": if (!e.prep) say(`Nồi cơm chín, có ${e.n} phần.`, "good"); break;
        case "riceLow": say(`Nồi cơm còn ${e.n} phần. Nấu mẻ mới đi!`, "warn"); break;
        case "platesLow": say(`Dĩa sạch còn ${e.n}. Rửa chén đi!`, "warn"); break;
        case "moHanhReady": say("Hũ mỡ hành mới (20 phần).", "good"); break;
        case "marinated": if (e.rush) say(`Ướp gấp ${e.n} miếng sườn (tươi tối đa 90).`, "good"); break;
        case "seated": scene.selectGroup(null); break;
        case "ordered": if (e.tid) say(`${tableName(e.tid)} gọi ${e.n} dĩa. Ghim phiếu để bày!`, "good"); else say("Shipper chờ hộp mang về.", "good"); break;
        case "delivered": {
          const p = e.tid && scene.tablePoint(e.tid);
          if (e.mistakes.length) say(`Lỗi: ${e.mistakes.map((m) => MISTAKES[m]?.name).join(", ")}.`, "warn");
          else if (p) scene.burst("sparkle", p.at[0], p.at[1] - 150, 1, reduced());
          break;
        }
        case "paid": { const g = groupById(state, e.gid); const p = g?.table && scene.tablePoint(g.table); if (p) scene.burst("coin-fly", p.at[0], p.at[1] - 160, 1, reduced()); say(`+${fmtK(e.total)}${e.transfer ? " (chuyển khoản)" : ""}${e.under ? ` · tính thiếu ${e.under}k` : ""}`, e.under ? "warn" : "good"); break; }
        case "groupDone": if (e.stars <= 2) say(`Khách chấm ${e.stars} sao.`, "warn"); break;
        case "cleaned": { const p = scene.tablePoint(e.tid); if (p) scene.burst("wipe-shine", p.at[0], p.at[1] - 130, 1, reduced()); break; }
        case "washed": say(`Rửa xong ${e.n} dĩa.`, "good"); break;
        case "timeout": say(`${e.name} bỏ về vì chờ lâu. Review 1 sao.`, "warn"); break;
        case "passedBy": say("Không còn chỗ đứng chờ, khách đi ngang qua luôn.", "warn"); break;
        case "noTea": say("Có khách ly trà cạn lâu rồi!", "warn"); break;
        case "request": say(e.kind === "com" ? "Khách gọi thêm chén cơm (chạm bàn)." : "Khách xin khăn lạnh (chạm bàn).", ""); break;
        case "billCall": say(`${tableName(e.tid)} gọi tính tiền!`, "good"); break;
        case "billOpen": setDock("plate"); break;
        case "replied": say(`${e.label}: ${e.fx.join(" · ")}`, e.outcome === "phot" || e.outcome === "annoyed" ? "warn" : "good"); break; // C:
        case "persona": if (e.from) say(`Đổi tính: ${e.switches >= 3 ? "cư dân mạng bắt đầu để ý!" : "lựa chọn trả lời đã đổi theo."}`, e.switches >= 3 ? "warn" : ""); break; // C:
        case "levelUp": { // nút "Khoe" trên thông báo (7 giây); bấm thì ca tạm dừng tới khi đóng bảng chia sẻ. Bảng chốt ca cũng ghi "Lên cấp N!"
          const lv = e.level;
          toast($("#toasts"), `Lên cấp ${lv}!`, "good", { label: "Khoe", act: "shareLevel", onClick: () => shareLevel(lv) });
          break;
        }
        case "newDish": say(`Món mới vào menu: ${e.name}. Nhớ nhập đủ nguyên liệu!`, "good"); break;
        case "phase": showBanner(e.text); break;
        case "closing": showBanner("Hết giờ nhận khách. Phục vụ nốt các bàn đang ăn."); break;
        case "restocked": say(`Nhập ${e.n} ${itemName(e.id)} (−${fmtK(e.price)}${e.express ? ", giao gấp" : ""}).`); break;
        case "restockedToday": say(`Đã nhập đủ cho hôm nay (−${fmtK(e.spent)})${e.marinated ? `, ướp ${e.marinated} miếng sườn` : ""}.`, "good"); break;
        case "consigned": say(`Cô Ba gửi gói ký gửi (${fmtK(e.owed)}, bán tới đâu trả tới đó).`, "good"); break;
        case "borrowed": say(`Quán bên cạnh cho mượn ${e.n} ${itemName(e.id)}. Mai trả!`, "good"); break;
        case "delivered-stock": say(`${e.by === "anh-sau" ? "Anh Sáu chở tới" : "Đã mua về"} ${e.n} ${itemName(e.id)}.`, "good"); break;
        case "ownerBack": say("Cô chủ đã về quán.", "good"); break;
        case "breadSwap": say(`Đổi ${e.n} phiếu sang bánh mì sườn.`, "good"); break;
        case "closedEarly": say("Treo bảng hết món. Không nhận thêm khách.", "warn"); break;
        case "voided": say("Đã báo khách hết món.", "warn"); break;
        case "bought": say(`Đã mua ${e.name} (−${e.price}k).`, "good"); break;
        case "lit": say("Đã nhóm bếp than.", "good"); break;
        case "complaint": case "overcharge": case "stockout": case "drama": setTimeout(() => openDialog(), reduced() ? 0 : 250); break;
        case "shiftStarted": startRest(); prefetchShift(); setDock("plate"); say(`Mở quán ngày ${e.day}! Khoảng ${e.guests} khách.${e.tutorial ? " Làm theo dải gợi ý màu xanh." : ""}`, "good"); break;
        case "shiftEnded": prefetchJournal(); setTimeout(() => overlays.summary(state), reduced() ? 0 : 500); break;
        case "newDay": if (e.expired || Object.keys(e.spoiled || {}).length) say(`Sang ngày mới: bỏ ${e.expired ? e.expired + " miếng sườn ướp cũ" : ""}${Object.keys(e.spoiled || {}).length ? " và hàng tươi quá hạn" : ""}.`, "warn"); break;
        default: { const x = PU.toastFor(e); if (x) say(x[0], x[1]); break; } // A:
      }
    }
    if (a.type !== "tick") save(true); else if (r.events.length) save();
    return r;
  }
  function openDialog() {
    const d = state.shift?.dialog;
    if (!d || overlays.current) return;
    if (d.kind === "complaint") overlays.complaint(state);
    else if (d.kind === "overcharge") overlays.overcharge(state);
    else if (d.kind === "stockout") overlays.stockout(state);
    else if (d.kind === "event" && !drama.isOpen) drama.open(); // B: drama
  }
  let bannerT = 0;
  /** Đổi nhịp ca ("Cao điểm tới rồi!"): băng chữ 2 giây trong khung cảnh, không dừng ca, cùng chỗ với thông báo (không che bàn / Thanh Bếp). */
  function showBanner(text) { say(text, "phase"); }

  // ---------- HUD ----------
  const chips = $("#chips");
  const chip = (cls) => { const c = el("span", "chip " + cls, chips); const b = el("b", "", c); const sm = el("small", "", c); return { c, b, sm }; };
  const cDay = chip("day"), cMoney = chip("money"), cStar = chip("rep"), cLv = chip("lv");
  function hud() {
    const sh = state.shift;
    cDay.b.textContent = sh ? clockText(sh) : `Ngày ${state.day}`; cDay.sm.textContent = sh ? `Ngày ${state.day}` : "chuẩn bị";
    cMoney.b.textContent = fmtK(state.money); cMoney.sm.textContent = "";
    cStar.b.textContent = state.rating ? state.rating.toFixed(1).replace(".", ",") + "★" : "—★"; cStar.sm.textContent = "";
    cLv.b.textContent = `Cấp ${state.level}`; cLv.sm.textContent = `${state.xp} XP`;
  }

  // ---------- vòng lặp ----------
  let last = performance.now();
  const shopLabel = $("#shopLabel"), hintbar = $("#hintbar"), away = $("#away");
  // Khoe lúc lên cấp giữa ca: đang tạo ảnh / bảng chia sẻ đang mở ⇒ đồng hồ ca dừng (khách không mất kiên nhẫn), đóng bảng là chạy tiếp
  let sharing = false;
  function shareLevel(level) {
    if (sharing) return;
    sharing = true;
    shareResult(levelUpShare(state, level)).finally(() => { sharing = false; });
  }
  const shareOpen = () => sharing || !!document.querySelector(".lk-share");
  const running = () => state.shift && state.shift.status === "open" && !state.shift.dialog && !paused && !overlays.current && !shareOpen();
  function frame(now) {
    const dt = Math.min(250, now - last); last = now;
    if (running()) act({ type: "tick", dt }, true);
    if (dirty && performance.now() - lastSave > 2500) save(true);
    const sh = state.shift;
    const mode = paused || overlays.current && !sh ? (sh ? "quiet" : "prep") : sh?.dialog ? "dialog" : running() ? "service" : !sh ? "prep" : "quiet";
    // V: vòng lặp bếp than chỉ khi bếp đang nhóm (trong ca: sh.lit + còn than; chuẩn bị: đã nhóm mẻ đầu), quán đông khi ≥ 3 bàn có khách
    const lit = sh ? !!sh.lit && sh.grill.coal > 0 : (state.kitchen?.coal || 0) > 0;
    setSoundScene(mode, { grill: lit && mode !== "quiet", busy: !!sh && sh.groups.filter((g) => g.phase === "seated").length >= 3 });
    if (mode === "service" && sh.grill.fan) play("fan-flap"); // giữ quạt: tiếng phạch phạch theo nhịp (khoảng nghỉ trong sfx.js)
    const hn = sh?.tutorial ? hint(state) : null;
    scene.update(state, { reduced: reduced(), hintTable: hn?.tid, hintSeat: hn?.key === "seat" });
    grillbar.render(state, hn);
    { // V: bếp lớn — mobile: đầu vùng làm việc dock Bếp; desktop: bảng nổi trên cảnh khi bật (ẩn khi có hội thoại / bảng phủ)
      const host = narrow.matches ? document.querySelector("#work .w-kitchen") : $("#world");
      if (host && big.el.parentElement !== host) host.prepend(big.el);
      const want = !!sh && (narrow.matches ? $("#col").dataset.dock === "kitchen" : bigOpen && !sh.dialog && !overlays.current && !drama.isOpen);
      if (big.open !== want) big.show(want, narrow.matches ? 1.5 : 1);
      if (want) { big.setBase(grillbar.base || 0); big.render(state, { reduced: reduced() }); }
      if (!sh) bigOpen = false;
    }
    column.render(state, hn);
    hud();
    hintbar.hidden = !hn;
    if (hn && hintbar.textContent !== hn.text) hintbar.textContent = hn.text;
    away.hidden = !sh?.owner.away;
    if (sh?.owner.away) away.textContent = `Cô chủ đang chạy ra chợ… (${Math.max(0, Math.ceil((sh.owner.away.until - sh.t) / 1000))}s) — bếp vẫn chạy!`;
    $("#pauseBtn").disabled = !sh;
    if (shopLabel.textContent !== state.shopName) shopLabel.textContent = state.shopName;
    for (const b of document.querySelectorAll("#dock button")) b.disabled = !sh && !["book", "stock"].includes(b.dataset.dock);
    requestAnimationFrame(frame);
  }

  // ---------- bố cục ----------
  // mobile 390@3: hệ số 1,0 thiết bị cắt ~110 px ngang ⇒ dồn khung sang phải để thấy chỗ khách đứng chờ (mép phải) và mọi bàn
  const narrow = matchMedia("(max-width: 760px)");
  function layout() { scene.layout(narrow.matches ? 1280 : 640, 360, 1); }
  addEventListener("resize", layout);
  new ResizeObserver(layout).observe($("#scene"));
  layout();

  // ---------- điều khiển ----------
  const muteBtn = $("#muteBtn");
  const MODE_LABEL = { all: "Tiếng: bật", sfx: "Tiếng: hiệu ứng", off: "Tiếng: tắt" };
  const syncMute = () => { const m = soundMode(); muteBtn.dataset.mode = m; muteBtn.setAttribute("aria-pressed", m === "off" ? "true" : "false"); muteBtn.textContent = MODE_LABEL[m]; muteBtn.title = MODE_LABEL[m] + " (M)"; };
  document.addEventListener("pointerdown", () => unlockSound(), { passive: true, capture: true });
  // V: chạm (cảm ứng) chỉ được tính là thao tác người dùng ở lúc nhấc tay ⇒ mở khoá cả ở pointerup / touchend (ctx đang treo thì resume lại)
  for (const t of ["pointerup", "touchend"]) document.addEventListener(t, () => unlockSound(), { passive: true, capture: true });
  document.addEventListener("keydown", () => unlockSound(), true);
  muteBtn.addEventListener("click", () => { if (cycleSoundMode() !== "off") unlockSound(); syncMute(); });
  addEventListener("storage", (event) => { if (event.key === MUTE_KEY || event.key === MUSIC_KEY || event.key === null) { syncMute(); syncSound(); } });
  syncMute();
  const pauseFor = (fn) => { if (overlays.current && !["prep", "pause", "summary"].includes(overlays.current)) return; if (state.shift) paused = true; fn(); };
  $("#bookBtn").addEventListener("click", () => pauseFor(() => overlays.book(state)));
  $("#stockBtn").addEventListener("click", () => pauseFor(() => overlays.stock(state)));
  $("#helpBtn").addEventListener("click", () => pauseFor(() => overlays.help(state.shift ? null : () => toPrep())));
  $("#pauseBtn").addEventListener("click", () => { if (!state.shift || overlays.current) return; paused = true; overlays.pause(); });
  // dock mobile: Dĩa · Bàn · Bếp · Kho · Sổ
  function setDock(k) { const col = $("#col"); if (!["plate", "tables", "kitchen"].includes(k)) return; col.dataset.dock = k; for (const b of document.querySelectorAll("#dock button")) b.classList.toggle("on", b.dataset.dock === k); }
  $("#dock").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-dock]"); if (!b) return;
    const k = b.dataset.dock;
    if (k === "stock") pauseFor(() => overlays.stock(state));
    else if (k === "book") pauseFor(() => overlays.book(state));
    else { setDock(k); $("#col").scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }
  });
  document.addEventListener("visibilitychange", () => { syncSound(); if (document.hidden) { save(true); if (state.shift && !overlays.current && !state.shift.dialog) { paused = true; overlays.pause(); } } });
  addEventListener("pagehide", () => save(true));
  let fanKey = false;
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (overlays.current || drama.isOpen) return; // B: drama
    const key = e.key.toLowerCase();
    if (key === "m") { muteBtn.click(); return; }
    if (key === "escape" || key === "p") { $("#pauseBtn").click(); return; }
    if (key === "?" || key === "h") { $("#helpBtn").click(); return; }
    if (key === "s") { $("#bookBtn").click(); return; }
    if (key === "k") { $("#stockBtn").click(); return; }
    if (!state.shift) return;
    if (e.altKey && /^[1-5]$/.test(e.key)) { const t = state.shift.tables[Number(e.key) - 1]; if (t) act({ type: "tableTap", tid: t.id, gid: scene.selected ?? undefined }); e.preventDefault(); return; }
    if (/^[1-6]$/.test(e.key)) { act({ type: "grillTap", slot: Number(e.key) - 1 }); e.preventDefault(); return; }
    if (e.shiftKey && /^Digit[1-6]$/.test(e.code) && state.shift.grill.slots.length > 6) { act({ type: "grillTap", slot: 5 + Number(e.code.slice(5)) }); e.preventDefault(); return; } // A: bếp 2
    if (key === "c") { act({ type: "addCoal" }); return; }
    if (key === "f") { if (!fanKey) { fanKey = true; act({ type: "fan", on: true }); } e.preventDefault(); return; }
    if (key === "r" && !state.shift.slots[state.shift.sel].tk) { act({ type: "cookRice" }); return; }
    if (key === "e" && !state.shift.slots[state.shift.sel].tk && state.shift.pan) { act({ type: "egg" }); return; } // A: chiên trứng
    if (key === " ") { act({ type: "autoStep" }); e.preventDefault(); return; }
    if (e.key === "Enter") { if (state.shift.billing) act({ type: "collect" }); else act({ type: "serve" }); e.preventDefault(); return; }
    if (e.key === "Backspace") { act({ type: "undo" }); e.preventDefault(); return; }
    if (e.key === "Tab") { const open = state.shift.tickets.filter((t) => t.status === "open" || t.status === "pinned"); if (open.length) { const cur = open.findIndex((t) => t.id === state.shift.slots[state.shift.sel].tk); act({ type: "pin", tk: open[(cur + 1) % open.length].id }); } e.preventDefault(); return; }
    if (key === "w" && !state.shift.slots[state.shift.sel].tk) { act({ type: "wash" }); return; }
    const L = "qwertyuiop".indexOf(key);
    if (L >= 0 && state.shift.slots[state.shift.sel].tk !== null) { const id = layerStrip(state)[L]; if (id) act({ type: "layer", id }); }
  });
  document.addEventListener("keyup", (e) => { if (e.key.toLowerCase() === "f" && fanKey) { fanKey = false; if (state.shift) act({ type: "fan", on: false }, true); } });

  // ---------- màn đầu ----------
  if (loaded.corrupt) say("Bản lưu cũ bị hỏng nên mở quán mới (bản cũ vẫn được giữ lại).", "warn");
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
    overlays, scene,
    hint: () => hint(state),
    sound: () => soundDebug(),
    ownerFree: () => (state.shift ? ownerFree(state) : false),
    tableJob: (tid) => tableJob(state, tid),
    sceneToClient(x, y) { const r = $("#scene").getBoundingClientRect(); const [sx, sy] = scene.toScreen(x, y); return [r.left + sx, r.top + sy]; },
    sceneScale: () => scene.scale,
    dishes: DISHES,
    // B: drama — mở thẳng một sự kiện (test / ?event=ID): trong ca mở hội thoại, ngoài ca hiện trên Chuẩn bị
    openEvent(id) { const r = act({ type: "eventOpen", id }); if (!r.err) { if (state.shift) openDialog(); else drama.open(() => { if (overlays.current === "prep") overlays.prep(state); }); } return r; },
    get dramaOpen() { return drama.isOpen; },
    // A: móc e2e tiến trình: nhảy cấp / thêm tiền (ghi qua bản lưu như thao tác thường)
    setLevel(n) { state.xp = LEVELS[n - 1] || 0; state.level = n; state.tutorialDone = true; addNewDishes(state); save(true); },
    addMoney(k) { state.money += Math.max(0, Math.floor(k)); save(true); },
  };
  if (params.get("event") && state.introSeen) window.__game.openEvent(params.get("event")); // B: drama
}

boot().catch((e) => {
  const m = document.getElementById("bootError");
  if (m) { m.hidden = false; m.textContent = "Không tải được quán: " + (e?.message || e); }
  console.error(e);
});
