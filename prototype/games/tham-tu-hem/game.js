// Nối mọi thứ: manifest → bản lưu → danh mục vụ (nạp động, thiếu file ⇒ "Sắp ra mắt") → màn hình.
// Trạng thái vụ chỉ đổi qua apply() (core/engine.js). Giao diện đọc state + sự kiện để chạy hiệu ứng, âm thanh, thoại.
import { CASES } from "./data/cases/index.js?v=t1";
import { validateCase } from "./core/validate.js?v=t1";
import { createRun, apply, sanitizeRun, textOf, nextHint, MAX_CRED } from "./core/engine.js?v=t1";
import { recordSolve, displayName, unlocked as isUnlocked } from "./core/progress.js?v=t1";
import { plain } from "./core/text.js?v=t1";
import { makeSave, browserStorage } from "./save.js?v=t1";
import { setManifest } from "./ui/art.js?v=t1";
import { h, $, clear, icon, toast, confirmBox, choiceBox } from "./ui/dom.js?v=t1";
import { createDialog } from "./ui/dialog.js?v=t1";
import { soundFor, unlockSound, muted, setMuted, play as sfx } from "./ui/sfx.js?v=t1";
import * as S from "./ui/screens.js?v=t1";
import * as P from "./ui/panels.js?v=t1";
import { stamp, shake, crackLens } from "./ui/fx.js?v=t1";

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
    if (fresh.length) { for (const e of fresh) toast("Từ khoá mới: " + G.c.words[e.id].text, "word"); soundFor({ type: "word" }); app.save(); P.refreshBadges(app); }
  },
  /** Hành động engine ⇒ hiệu ứng ⇒ thoại ⇒ vẽ lại. */
  async act(a, { quiet = false, before = null } = {}) {
    const r = apply(G.c, G.s, a);
    if (r.error) { if (!quiet) toast(r.error, "bad"); return r; }
    G.s = r.s;
    for (const e of r.ev) soundFor(e);
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
  show(screen) { G.screen = screen; G.overlays = []; renderAll(); },
  refresh() { renderAll(); },
  async openOverlay(name, arg) { G.overlays.push({ name, arg }); renderAll(); },
  closeOverlay() { G.overlays.pop(); renderAll(); },
  closeAll() { G.overlays = []; renderAll(); },
  get top() { return G.overlays[G.overlays.length - 1]?.name || null; },
  textOf: (it) => textOf(G.c, it),
  stamp, shake, crackLens,
  async openCase(id) {
    const e = G.cat.find((x) => x.id === id);
    if (!e || !e.c || !e.open) return;
    const raw = G.profile.runs[id];
    let s = raw ? sanitizeRun(e.c, raw) : null;
    if (s && s.phase !== "intro") {
      const v = await choiceBox(`Hồ sơ số ${e.no}: ${e.title}`, "Vụ này đang điều tra dở. Tiếp tục hay chơi lại từ đầu? (Chơi lại sẽ xoá tiến độ của riêng vụ này.)",
        [{ label: "Tiếp tục", value: "go", kind: "primary" }, { label: "Chơi lại vụ", value: "redo", kind: "danger" }, { label: "Đóng", value: null }]);
      if (v == null) return;
      if (v === "redo") s = null;
    }
    G.c = e.c; G.s = s || createRun(e.c, (Math.random() * 2 ** 31) >>> 0); G.ui.mood = {}; G.ui.soi = false; G.ui.sceneScroll = 0;
    app.save();
    const ph = G.s.phase;
    app.show(ph === "intro" ? "office" : ph === "finale" ? "finale" : ph === "done" ? "result" : "scene");
    sfx("door");
  },
  /** Kết vụ đã ghi ⇒ về bản đồ. */
  leaveCase(to = "map") { finalizeNow(); G.c = null; G.s = null; app.show(to); },
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
    tools.append(
      h("button.btn.btn--icon", { type: "button", id: "btnNotebook", title: "Sổ tay (N)", onclick: () => toggleOverlay("notebook") }, icon("book", 16), h("span.hide-sm", "Sổ tay"), h("span.dot", { hidden: true })),
      G.screen === "scene" ? h("button.btn.btn--icon", { type: "button", id: "btnBoard", title: "Bảng suy luận (B)", onclick: () => toggleOverlay("board") }, icon("board", 16), h("span.hide-sm", "Bảng")) : null,
      h("button.btn.btn--icon", { type: "button", id: "btnHint", title: "Gợi ý của Tèo (trừ điểm sao)", onclick: () => app.hint() }, icon("bulb", 16), h("span.hide-sm", "Tèo")));
  }
  tools.append(h("button.btn.btn--icon", { type: "button", id: "btnMute", title: muted() ? "Bật tiếng" : "Tắt tiếng", "aria-pressed": muted() ? "true" : "false", onclick: () => { setMuted(!muted()); renderBar(); } }, icon(muted() ? "mute" : "sound", 16)));
  b.append(tools);
}
function renderAll() {
  renderBar();
  const sc = clear(screenEl());
  sc.dataset.screen = G.screen;
  const fn = { title: S.title, map: S.map, office: S.office, scene: S.scene, finale: S.finale, result: S.result }[G.screen];
  sc.append(fn(app));
  const ov = clear(ovEl());
  for (const o of G.overlays) {
    const el = { notebook: P.notebook, board: P.board, talk: P.talk }[o.name]?.(app, o.arg);
    if (el) ov.append(h("div.ov-layer", { data: { ov: o.name } }, el));
  }
  ov.hidden = !G.overlays.length;
  document.body.classList.toggle("ov-open", !!G.overlays.length);
  S.afterRender?.(app);
  P.refreshBadges(app);
}
function toggleOverlay(name) {
  if (!G.c || !(G.screen === "scene" || G.screen === "finale")) return;
  if (name === "board" && G.screen !== "scene") return;
  if (app.top === name) app.closeOverlay();
  else { G.overlays = G.overlays.filter((o) => o.name !== name); app.openOverlay(name); }
}

// ---------- phím tắt ----------
addEventListener("keydown", (e) => {
  if (document.querySelector(".modal")) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (app.dialog?.open) {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); app.dialog.next(); }
    return;
  }
  if (typing) return;
  if (e.key === "Escape") { if (G.overlays.length) { e.preventDefault(); app.closeOverlay(); } return; }
  if (e.key === "n" || e.key === "N") { e.preventDefault(); toggleOverlay("notebook"); }
  if (e.key === "b" || e.key === "B") { e.preventDefault(); toggleOverlay("board"); }
});
addEventListener("pointerdown", unlockSound, { capture: true, once: true });
addEventListener("keydown", unlockSound, { capture: true, once: true });
addEventListener("pagehide", () => { if (G.profile) app.save(); });
let rz = 0;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (!app.dialog?.open) renderAll(); }, 150); });

// ---------- khởi động ----------
async function loadCase(entry) {
  const url = entry.dev ? "./test/fixtures/mini-case.js?v=t1" : `./data/cases/${entry.id}.js?v=t1`;
  try {
    const c = (await import(url)).default;
    const v = validateCase(c);
    if (v.errors.length && !entry.dev) { console.warn(`Vụ ${entry.id} chưa đạt bộ kiểm:`, v.errors.slice(0, 5)); return { ...entry, c: null, status: "broken" }; }
    return { ...entry, c, status: "ok", title: c.title || entry.title, no: c.no ?? entry.no, tagline: c.tagline || "" };
  } catch { return { ...entry, c: null, status: "soon" }; }
}
async function boot() {
  try { setManifest(await (await fetch("data/asset-manifest.json?v=t1")).json()); } catch { setManifest(null); }
  const r = store.read();
  G.profile = r.profile;
  if (r.corrupt) setTimeout(() => toast("Bản lưu bị hỏng nên đã mở hồ sơ mới (bản cũ vẫn được cất trong máy).", "bad"), 400);
  const list = [...CASES];
  if (DEV_CASE === "__mini") list.unshift({ id: "mini", no: 0, title: "Vụ mẫu", difficulty: 0, dev: true });
  G.cat = await Promise.all(list.map(loadCase));
  G.cat.forEach((e, i) => { e.open = e.dev || isUnlocked(G.profile, G.cat.filter((x) => !x.dev), G.cat.filter((x) => !x.dev).indexOf(e)); });
  // vụ đã xong nhưng chưa ghi (đóng trang ở màn kết) ⇒ ghi bây giờ
  for (const e of G.cat) {
    const raw = G.profile.runs[e.id];
    if (e.c && raw?.phase === "done") { const s = sanitizeRun(e.c, raw); if (s?.phase === "done") G.profile = recordSolve(G.profile, e.c, s).p; else delete G.profile.runs[e.id]; }
  }
  store.write(G.profile);
  app.dialog = createDialog(document.body, { caseId: () => G.c?.id || "", name: app.name, words: app.words, read: app.read, textOf: app.textOf, card: (it) => P.dialogCard(app, it), fast: () => params.get("fast") === "1" });
  app.refreshCatalog = () => { const real = G.cat.filter((x) => !x.dev); G.cat.forEach((e) => { e.open = e.dev || isUnlocked(G.profile, real, real.indexOf(e)); }); };
  app.show("title");
  $("#app").classList.add("ready");
  window.__game = {
    get state() { return G.s; }, get profile() { return G.profile; }, get screen() { return G.screen; }, get overlay() { return app.top; },
    get dialogOpen() { return !!app.dialog.open; }, get caseData() { return G.c; }, catalog: () => G.cat.map((e) => ({ id: e.id, status: e.status, open: e.open })),
    store, app,
  };
}
const _leave = app.leaveCase;
app.leaveCase = (to) => { _leave(to); app.refreshCatalog?.(); renderAll(); };
boot();
