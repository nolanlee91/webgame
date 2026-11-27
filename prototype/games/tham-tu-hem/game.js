// Nối mọi thứ: manifest → bản lưu → danh mục vụ (nạp động, thiếu file ⇒ "Sắp ra mắt") → màn hình.
// Trạng thái vụ chỉ đổi qua apply() (core/engine.js). Giao diện đọc state + sự kiện để chạy hiệu ứng, âm thanh, thoại.
import { CASES } from "./data/cases/index.js?v=t10";
import { CASE_META } from "./data/case-meta.js?v=t10";
import { validateCase } from "./core/validate.js?v=t10";
import { createRun, apply, sanitizeRun, textOf, nextHint, MAX_CRED } from "./core/engine.js?v=t10";
import { recordSolve, displayName, unlocked as isUnlocked, SEASONS, seasonOf, seasonUnlocked, pickSeason } from "./core/progress.js?v=t10";
import { plain } from "./core/text.js?v=t10";
import { makeSave, browserStorage } from "./save.js?v=t10";
import { setManifest, registerSheets, preloadCaseArt } from "./ui/art.js?v=t10";
import { h, $, clear, icon, toast, confirmBox, choiceBox } from "./ui/dom.js?v=t10";
import { createDialog } from "./ui/dialog.js?v=d12";
import { soundsFor, unlockSound, muted, setMuted, musicOn, setMusic, setScene, play as sfx, soundDebug } from "./ui/sfx.js?v=t10";
import * as S from "./ui/screens.js?v=d12";
import * as P from "./ui/panels.js?v=d12";
import { stamp, shake, crackLens } from "./ui/fx.js?v=t10";

const params = new URLSearchParams(location.search);
const LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const DEV_CASE = params.get("case") && (LOCAL || params.get("dev") === "1") ? params.get("case") : null;
const CAST_NAMES = { teo: "Tèo", batu: "Bà Tư Hóng", chuba: "Chú Ba dân phòng", narr: "" };

const store = makeSave(browserStorage());
const G = { profile: null, cat: [], c: null, s: null, screen: "title", overlays: [], ui: { mood: {}, soi: false, sceneScroll: 0, nbTab: "clues" } };

const app = {
  G,
  name(pid) {
    if (pid === "me") return displayName(G.profile);
    return G.c?.people?.[pid]?.name || CAST_NAMES[pid] || pid;
  },
  words: () => G.c?.words || {},
  save() { if (G.c && G.s) G.profile.runs[G.c.id] = G.s; store.write(G.profile); },
  /** Đọc chữ vừa hiện (nhặt từ khoá). */
  read(text) {
    if (!G.c || !G.s || !text || !/\[\[/.test(text)) return;
    const r = apply(G.c, G.s, { type: "read", text });
    if (r.error || r.s === G.s) return;
    const fresh = r.ev.filter((e) => e.type === "word");
    G.s = r.s;
    if (fresh.length) { for (const e of fresh) toast("Từ khoá mới: " + G.c.words[e.id].text, "word"); sfx("keyword"); app.save(); P.refreshBadges(app); }
  },
  /** Hành động engine ⇒ hiệu ứng ⇒ thoại ⇒ vẽ lại. */
  async act(a, { quiet = false, before = null } = {}) {
    const r = apply(G.c, G.s, a);
    if (r.error) { if (!quiet) toast(r.error, "bad"); return r; }
    G.s = r.s;
    soundsFor(r.ev);
    const lastLine = [...r.show].reverse().find((x) => x.t === "line" && G.c.people[x.who]);
    if (lastLine) G.ui.mood[lastLine.who] = lastLine.mood;
    app.save();
    if (r.ev.some((e) => e.type === "cred")) { renderBar(); crackLens($(".cred"), r.ev.some((e) => e.type === "rescue") ? -1 : G.s.cred); }
    if (before) await before(r);
    app.refresh();
    await app.dialog.play(r.show);
    app.refresh();
    return r;
  },
  show(screen) { G.screen = screen; G.overlays = []; renderAll(); if (screen === "map") prefetchNextCase(); },
  refresh() { renderAll(); },
  async openOverlay(name, arg) { G.overlays.push({ name, arg }); renderAll(); },
  closeOverlay() { G.overlays.pop(); renderAll(); },
  closeAll() { G.overlays = []; renderAll(); },
  get top() { return G.overlays[G.overlays.length - 1]?.name || null; },
  textOf: (it) => textOf(G.c, it),
  stamp, shake, crackLens,
  async openCase(id) {
    let e = G.cat.find((x) => x.id === id);
    if (!e || !e.open || e.busy) return;
    if (!e.c) {
      // PERF-03: file vụ chỉ nạp khi mở vụ; kèm tải trước nền văn phòng + chân dung người nói (tối đa ~2,5 giây) để thoại mở đầu không chạy trên nền đen
      if (e.status !== "lazy") return;
      const card = document.querySelector(`.case-card[data-case="${id}"]`);
      e.busy = true; card?.setAttribute("aria-busy", "true"); card?.classList.add("is-loading");
      e = await ensureCase(e);
      card?.removeAttribute("aria-busy"); card?.classList.remove("is-loading");
      if (!e.c) { toast(e.status === "broken" ? "Vụ này đang được sửa, quay lại sau nha." : "Vụ này sắp ra mắt.", "bad"); renderAll(); return; }
    }
    await Promise.race([preloadCaseArt(e.c), new Promise((ok) => setTimeout(ok, 2500))]);
    const raw = G.profile.runs[id];
    let s = raw ? sanitizeRun(e.c, raw) : null;
    if (s && s.phase !== "intro") {
      const v = await choiceBox(`Hồ sơ số ${e.no}: ${e.title}`, "Vụ này đang điều tra dở. Tiếp tục hay chơi lại từ đầu? (Chơi lại sẽ xoá tiến độ của riêng vụ này.)",
        [{ label: "Tiếp tục", value: "go", kind: "primary" }, { label: "Chơi lại vụ", value: "redo", kind: "danger" }, { label: "Đóng", value: null }]);
      if (v == null) return;
      if (v === "redo") s = null;
    }
    G.c = e.c; G.s = s || createRun(e.c, (Math.random() * 2 ** 31) >>> 0); G.ui.mood = {}; G.ui.soi = !!e.c.soiOn; /* TTH-02: vụ hướng dẫn bật sẵn Chế độ soi */ G.ui.sceneScroll = 0; G.ui.solvedSfx = false; G.ui.slot = null; G.ui.chip = null; G.ui.boardMsg = "";
    app.save();
    const ph = G.s.phase;
    app.show(ph === "intro" ? "office" : ph === "finale" ? "finale" : ph === "done" ? "result" : "scene");
    sfx("door-bell");
  },
  /** Kết vụ đã ghi ⇒ về bản đồ. */
  leaveCase(to = "map") {
    const prev = G.c ? seasonOf(G.cat.find((x) => x.id === G.c.id)) : null;
    app.dialog?.cancel(); // TTH-01: thanh trên bấm được cả lúc đang thoại
    finalizeNow(); G.c = null; G.s = null;
    G.ui.season = app.seasonOpen(2) && !G.profile.flags.s2intro ? null : prev;
    app.show(to);
  },
  /** Xong màn chuyển mùa 2 ⇒ ghi cờ, về bản đồ tab mùa 2. */
  seasonIntroDone() { G.profile.flags.s2intro = 1; store.write(G.profile); G.ui.season = 2; G.ui.s2phone = false; app.show("map"); },
  async replayCase() {
    const id = G.c.id;
    if (!(await confirmBox("Chơi lại vụ?", "Tiến độ đang dở của vụ này sẽ bị xoá. Vụ đã phá vẫn giữ ★ và danh tiếng.", "Chơi lại", "Thôi", true))) return;
    finalizeNow();
    delete G.profile.runs[id]; store.write(G.profile);
    G.c = null; G.s = null;
    await app.openCase(id);
  },
  async wipeAll() {
    if (!(await confirmBox("Xoá toàn bộ tiến độ?", "Tên thám tử, ★, danh tiếng và mọi vụ đang dở sẽ bị xoá. Bản cũ được cất dự phòng trong máy.", "Xoá hết", "Thôi", true))) return false;
    store.wipe();
    location.reload();
    return true;
  },
  async hint() {
    const h0 = nextHint(G.c, G.s);
    if (h0.i != null && !G.s.hints.includes(h0.i)) {
      if (!G.ui.hintOk && !(await confirmBox("Hỏi Tèo?", "Mỗi gợi ý mới của Tèo sẽ trừ điểm sao cuối vụ. Gợi ý đã nghe thì hỏi lại miễn phí.", "Hỏi Tèo", "Thôi"))) return;
      G.ui.hintOk = true;
    }
    await app.act({ type: "hint" });
  },
  setName(n) { G.profile.name = n; if (!G.profile.created) G.profile.created = 1; store.write(G.profile); },
  isUnlocked: (i) => isUnlocked(G.profile, G.cat, i),
  // ---------- mùa (tab bản đồ) ----------
  real: () => G.cat.filter((x) => !x.dev),
  /** Tab đang xem: chọn tay trong phiên, không thì tự chọn (vụ đang dở / vụ mới nhất đã mở). */
  season: () => (G.ui.season && app.seasonOpen(G.ui.season) ? G.ui.season : pickSeason(G.profile, app.real())),
  seasonOpen: (n) => seasonUnlocked(G.profile, app.real(), n),
  pickSeason(n) {
    const S0 = SEASONS.find((x) => x.no === n);
    if (!S0) return;
    if (!app.seasonOpen(n)) { toast(S0.lockMsg || "Chưa mở", "bad"); return; }
    if (G.ui.season === n && G.screen === "map") return;
    G.ui.season = n; sfx("map-select"); app.show("map");
  },
  plain: (t) => plain(t, G.c?.words || {}),
};

// ---------- kết vụ: ghi danh tiếng khi rời màn kết (câu hỏi phụ trả lời trước đó được cộng luôn). Đóng trang ở màn kết ⇒ ghi lúc mở lại. ----------
function finalizeNow() {
  if (!G.c || !G.s || G.s.phase !== "done" || !G.profile.runs[G.c.id]) return null;
  const r = recordSolve(G.profile, G.c, G.s);
  G.profile = r.p; store.write(G.profile);
  if (r.rankUp) setTimeout(() => toast("Lên hạng: " + r.rankUp.name + "!", "good"), 300);
  return r;
}
app.previewSolve = () => recordSolve(G.profile, G.c, G.s);

// ---------- vẽ ----------
const bar = () => $("#bar"), screenEl = () => $("#screen"), ovEl = () => $("#ov");
function renderBar() {
  const b = clear(bar());
  const inCase = !!G.c && ["office", "scene", "finale", "result"].includes(G.screen);
  b.classList.toggle("in-case", inCase);
  if (inCase) b.append(h("button.btn.btn--ghost.back", { type: "button", id: "toMap", title: "Về bản đồ (tiến độ đã lưu)", onclick: () => app.leaveCase() }, icon("back", 16), h("span.hide-xs", "Bản đồ")));
  else b.append(h("a.back", { href: "../../homepage/", title: "Về Lụm Kèo" }, icon("back", 16), h("span.hide-xs", "Lụm Kèo")));
  b.append(h("h1", h("span.t1", "Thám Tử"), " ", h("span.t2", "Hẻm")));
  if (inCase) b.append(h("div.case-name.hide-sm", `Hồ sơ số ${G.c.no}: ${G.c.title}`));
  const tools = h("div.tools");
  if (inCase && (G.screen === "scene" || G.screen === "finale")) {
    const cred = h("div.cred", { title: `Uy tín ${G.s.cred}/${MAX_CRED}`, "aria-label": `Uy tín ${G.s.cred} trên ${MAX_CRED}` });
    for (let i = 0; i < MAX_CRED; i++) cred.append(h("span.lens" + (i < G.s.cred ? "" : ".off"), icon(i < G.s.cred ? "lens" : "lensOff", 16)));
    b.append(cred);
    tools.append(...[
      h("button.btn.btn--icon.btn--tool", { type: "button", id: "btnNotebook", title: "Sổ tay (N)", onclick: () => toggleOverlay("notebook") }, icon("book", 16), h("span.tl", "Sổ tay"), h("span.dot", { hidden: true })),
      G.screen === "scene" ? h("button.btn.btn--icon.btn--tool", { type: "button", id: "btnBoard", title: "Bảng suy luận (B)", onclick: () => toggleOverlay("board") }, icon("board", 16), h("span.tl", "Bảng")) : null,
      h("button.btn.btn--icon.btn--tool", { type: "button", id: "btnHint", title: "Gợi ý của Tèo (trừ điểm sao)", onclick: () => app.hint() }, icon("bulb", 16), h("span.tl", "Tèo"))].filter(Boolean));
  }
  if (!muted()) tools.append(h("button.btn.btn--icon.hide-xs", { type: "button", id: "btnMusic", title: musicOn() ? "Tắt nhạc (giữ tiếng)" : "Bật nhạc", "aria-pressed": musicOn() ? "true" : "false", onclick: () => { setMusic(!musicOn()); renderBar(); } }, icon(musicOn() ? "note" : "noteOff", 16)));
  tools.append(h("button.btn.btn--icon", { type: "button", id: "btnMute", title: muted() ? "Bật tiếng (M)" : "Tắt tiếng (M)", "aria-pressed": muted() ? "true" : "false", onclick: () => { setMuted(!muted()); renderBar(); } }, icon(muted() ? "mute" : "sound", 16)));
  b.append(tools);
}
function renderAll() {
  // lần đầu mở bản đồ mùa 2 (tự chọn hoặc bấm tab) ⇒ màn chuyển ngắn
  if (G.screen === "map" && app.season() === 2 && !G.profile.flags.s2intro) G.screen = "season";
  renderBar();
  const sc = clear(screenEl());
  sc.dataset.screen = G.screen;
  const fn = { title: S.title, map: S.map, office: S.office, scene: S.scene, finale: S.finale, result: S.result, season: seasonScreen }[G.screen];
  sc.append(fn(app));
  const ov = clear(ovEl());
  for (const o of G.overlays) {
    const el = { notebook: P.notebook, board: P.board, talk: P.talk }[o.name]?.(app, o.arg);
    if (el) ov.append(h("div.ov-layer", { data: { ov: o.name } }, el));
  }
  ov.hidden = !G.overlays.length;
  document.body.classList.toggle("ov-open", !!G.overlays.length);
  setScene(G.screen === "scene" && app.top === "talk" ? "talk" : G.screen === "map" && app.season() === 2 ? "map2" : G.screen);
  S.afterRender?.(app);
  P.refreshBadges(app);
}
function seasonScreen(app) {
  const el = S.seasonIntro(app, () => app.seasonIntroDone());
  const ph = el.querySelector(".season-phone");
  if (!G.ui.s2phone) {
    ph.hidden = true;
    if (!G.ui.s2playing) {
      G.ui.s2playing = true;
      setTimeout(async () => {
        await app.dialog.play(S.SEASON2_INTRO);
        G.ui.s2playing = false;
        if (G.screen !== "season") return;
        G.ui.s2phone = true; sfx("zalo-ping"); renderAll();
      }, 0);
    }
  }
  return el;
}
function toggleOverlay(name) {
  if (!G.c || !(G.screen === "scene" || G.screen === "finale")) return;
  if (name === "board" && G.screen !== "scene") return;
  if (app.top === name) app.closeOverlay();
  else { G.overlays = G.overlays.filter((o) => o.name !== name); if (name === "notebook") sfx("page-flip"); app.openOverlay(name); }
}

// ---------- phím tắt ----------
addEventListener("keydown", (e) => {
  if (document.querySelector(".modal")) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (app.dialog?.open) {
    // nút trong khung thoại (Đọc nhanh, Tua) đang có focus ⇒ để Space/Enter bấm chính nút đó (D12)
    if ((e.key === " " || e.key === "Enter") && !document.activeElement?.closest?.(".dlg-ctl button")) { e.preventDefault(); app.dialog.next(); }
    return;
  }
  if (typing) return;
  if (e.key === "Escape") { if (G.overlays.length) { e.preventDefault(); app.closeOverlay(); } return; }
  if (e.key === "m" || e.key === "M") { e.preventDefault(); setMuted(!muted()); renderBar(); toast(muted() ? "Đã tắt tiếng" : "Đã bật tiếng"); return; }
  if (e.key === "n" || e.key === "N") { e.preventDefault(); toggleOverlay("notebook"); }
  if (e.key === "b" || e.key === "B") { e.preventDefault(); toggleOverlay("board"); }
});
addEventListener("pointerdown", unlockSound, { capture: true, once: true });
addEventListener("pointerup", unlockSound, { capture: true }); // cảm ứng: thao tác thật tính ở lúc nhấc tay (xem unlockSound)
// tiếng bấm nút của game (feedback.js chung bị tắt bằng data-nosfx trên body, vẫn giữ hiệu ứng lún nút)
document.body.dataset.nosfx = "";
addEventListener("pointerdown", (e) => { const b = e.target.closest("button:not(:disabled), .btn, a.back"); if (b && !b.closest(".dlg") && (e.button === 0 || e.pointerType !== "mouse")) sfx("click"); }, true);
addEventListener("keydown", unlockSound, { capture: true, once: true });
addEventListener("pagehide", () => { if (G.profile) app.save(); });
let rz = 0;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (!app.dialog?.open) renderAll(); }, 150); });

// ---------- khởi động ----------
/** Mục danh mục chưa nạp file vụ: tên / số / câu dẫn lấy từ data/case-meta.js (sinh từ file vụ), status "lazy" = có file, mở là nạp. */
const lazyEntry = (e) => { const m = CASE_META[e.id]; return m ? { ...e, c: null, status: "lazy", title: m.title || e.title, no: m.no ?? e.no, tagline: m.tagline || "" } : { ...e, c: null, status: "soon" }; };
/** Nạp file vụ của mục (một lần), thay vào G.cat, giữ cờ mở khoá. */
async function ensureCase(e) {
  if (e.c) return e;
  const d = await loadCase(e);
  const i = G.cat.findIndex((x) => x.id === e.id);
  const out = { ...d, open: i >= 0 ? G.cat[i].open : e.open };
  if (i >= 0) G.cat[i] = out;
  return out;
}
/** Bản đồ hiện ra ⇒ nạp trước file vụ người chơi gần như chắc sẽ mở (vụ đang dở, không thì vụ mới nhất đã mở mà chưa phá). */
function prefetchNextCase() {
  const real = G.cat.filter((x) => !x.dev && x.open && x.status === "lazy");
  const next = real.find((x) => { const r = G.profile.runs[x.id]; return r && r.phase && r.phase !== "intro"; }) || real.find((x) => !G.profile.solved[x.id]);
  if (next) import(`./data/cases/${next.id}.js?v=t15`).catch(() => {});
}
async function loadCase(entry) {
  const url = entry.dev ? "./test/fixtures/mini-case.js?v=t10" : `./data/cases/${entry.id}.js?v=t15`;
  try {
    const c = (await import(url)).default;
    const v = validateCase(c);
    if (v.errors.length && !entry.dev) { console.warn(`Vụ ${entry.id} chưa đạt bộ kiểm:`, v.errors.slice(0, 5)); return { ...entry, c: null, status: "broken" }; }
    registerSheets(c);
    return { ...entry, c, status: "ok", title: c.title || entry.title, no: c.no ?? entry.no, tagline: c.tagline || "" };
  } catch { return { ...entry, c: null, status: "soon" }; }
}
async function boot() {
  try { setManifest(await (await fetch("data/asset-manifest.json?v=t10")).json()); } catch { setManifest(null); }
  const r = store.read();
  G.profile = r.profile;
  if (r.corrupt) setTimeout(() => toast("Bản lưu bị hỏng nên đã mở hồ sơ mới (bản cũ vẫn được cất trong máy).", "bad"), 400);
  const list = [...CASES];
  if (DEV_CASE === "__mini") list.unshift({ id: "mini", no: 0, title: "Vụ mẫu", difficulty: 0, dev: true });
  // mùa còn khoá thì chưa nạp file vụ (status "pending"): người chơi mùa 1 không phải tải / gặp 404 các vụ chưa ra
  const realList = list.filter((x) => !x.dev);
  // PERF-03: không nạp file vụ lúc mở game (12 vụ × 60–90 KB): thẻ bản đồ dùng data/case-meta.js, file vụ nạp khi mở vụ (openCase)
  G.cat = await Promise.all(list.map((e) => (e.dev ? loadCase(e) : seasonUnlocked(G.profile, realList, seasonOf(e)) ? lazyEntry(e) : { ...e, c: null, status: "pending" })));
  G.cat.forEach((e, i) => { e.open = e.dev || isUnlocked(G.profile, G.cat.filter((x) => !x.dev), G.cat.filter((x) => !x.dev).indexOf(e)); });
  // vụ đã xong nhưng chưa ghi (đóng trang ở màn kết) ⇒ nạp đúng các vụ đó rồi ghi bây giờ
  for (const [i, e] of G.cat.entries()) if (e.status === "lazy" && G.profile.runs[e.id]?.phase === "done") G.cat[i] = await ensureCase(e);
  for (const e of G.cat) {
    const raw = G.profile.runs[e.id];
    if (e.c && raw?.phase === "done") { const s = sanitizeRun(e.c, raw); if (s?.phase === "done") G.profile = recordSolve(G.profile, e.c, s).p; else delete G.profile.runs[e.id]; }
  }
  store.write(G.profile);
  app.dialog = createDialog(document.body, { caseId: () => G.c?.id || "", name: app.name, words: app.words, read: app.read, textOf: app.textOf, card: (it) => P.dialogCard(app, it), fast: () => params.get("fast") === "1" });
  app.refreshCatalog = () => {
    const real = app.real();
    G.cat.forEach((e) => { e.open = e.dev || isUnlocked(G.profile, real, real.indexOf(e)); });
    // mùa vừa mở khoá ⇒ thẻ vụ của mùa đó hiện (file vụ vẫn chỉ nạp khi mở vụ)
    G.cat.forEach((e, i) => { if (e.status === "pending" && seasonUnlocked(G.profile, real, seasonOf(e))) G.cat[i] = { ...lazyEntry(e), open: e.open }; });
  };
  app.show("title");
  $("#app").classList.add("ready");
  setTimeout(() => document.getElementById("bootShell")?.remove(), 250); // màn tựa tĩnh (index.html) nhường chỗ sau khi #app hiện xong
  window.__game = {
    get state() { return G.s; }, get profile() { return G.profile; }, get screen() { return G.screen; }, get overlay() { return app.top; },
    get dialogOpen() { return !!app.dialog.open; }, get caseData() { return G.c; }, catalog: () => G.cat.map((e) => ({ id: e.id, status: e.status, open: e.open, season: seasonOf(e) })), get season() { return app.season(); },
    store, app, sound: soundDebug,
  };
}
const _leave = app.leaveCase;
app.leaveCase = (to) => { _leave(to); app.refreshCatalog?.(); renderAll(); };
boot();
