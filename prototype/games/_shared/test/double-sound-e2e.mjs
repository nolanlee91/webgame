// E2E "mỗi lần bấm đúng MỘT tiếng" (Chrome headless thật, server.js thật).
// Lỗi cũ: nhiều nút kêu 2 tiếng — "tách" chung của feedback.js + tiếng riêng của game (vd. Ô Ăn Quan "▶ Bắt đầu" = tách + turn.mp3).
// Cách kiểm: mọi trang prototype/games/*/index.html + trang chủ; bấm THẬT (chuột ở 1366×768, chạm ở 390×844 có giả lập cảm ứng)
// từng nút đang hiện, ở màn đầu và sau khi bấm Chơi; ghi mọi tiếng bắt đầu trong 350 ms.
//  - "tách"/"bụp" của feedback.js = oscillator có tần số đầu (setValueAtTime) 1400/240 hoặc 300/700; mỗi cụm < 30 ms tính 1 tiếng.
//  - tiếng game = AudioBufferSource / <audio> không lặp, hoặc oscillator có hẹn stop() (tiếng máy chạy liên tục không tính).
//  - LỖI khi một lần bấm có ≥ 2 tiếng: tách + tiếng game, hoặc tách 2 lần.
// Đào Vàng / 2048 / Rắn còn kiểm thêm màn hết ván (nút ⚔ Thách bạn) và bảng chia sẻ "Thách bạn" của challenge.js.
// Thêm: trang chủ — thẻ game (press-nav.js) bấm chuột + chạm ⇒ đúng 1 "bụp"; đo độ trễ "tách" sau khi nhả chuột.
//
// Chạy:  node prototype/games/_shared/test/double-sound-e2e.mjs [lọc-trang] [--baseline] [--out kq.json] [--shots]
//   lọc-trang: một hoặc nhiều chuỗi cách nhau dấu phẩy (vd. "2048,xep-gach")
//   --baseline : thay feedback.js bằng bản ở nhánh master (git show) — tự kiểm test BẮT được lỗi cũ (phải báo Ô Ăn Quan #startBtn).
import { launchChrome, sleep, REPO } from "./cdp.mjs";
import { shotDir } from "./lk-temp.mjs";
import { readdirSync, existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const optVal = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const only = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");
const BASELINE = flag("--baseline");
const OUTFILE = optVal("--out");
const SHOTS = flag("--shots") ? shotDir("double-sound") : null;

const GAMES = join(REPO, "prototype/games");
const PAGES = ["/homepage/", ...readdirSync(GAMES).filter((d) => !d.startsWith("_") && existsSync(join(GAMES, d, "index.html"))).map((d) => `/games/${d}/`)]
  .filter((p) => !only || only.split(",").some((o) => p.includes(o)));
const MAX_BTNS = 24, WAIT = 350;
const baselineSrc = BASELINE ? Buffer.from(execFileSync("git", ["show", "master:prototype/games/_shared/feedback.js"], { cwd: REPO })).toString("base64") : null;

// Server thật, cổng cố định trong dải 8921–8929 (máy dùng chung với agent khác).
const require = createRequire(import.meta.url);
const server = require(join(REPO, "server.js"));
let port = 0;
for (const p of [8921, 8922, 8923, 8924, 8925, 8926, 8927, 8928, 8929]) {
  try { await new Promise((ok, bad) => { server.once("error", bad); server.listen(p, "127.0.0.1", () => { server.off("error", bad); ok(); }); }); port = p; break; } catch {}
}
if (!port) throw new Error("Cổng 8921–8929 đều bận");
const base = `http://127.0.0.1:${port}`;

const HOOK = `(() => {
  const D = window.__ds = { snd: [], up: 0, down: 0, click: 0 };
  try { localStorage.clear(); } catch {} // mỗi lần tải: trạng thái mới (không mang chế độ / bản lưu / tắt tiếng từ lần bấm trước)
  const now = () => performance.now();
  const abUrl = new WeakMap(), bufName = new WeakMap(), freq0 = new WeakMap(), recOf = new WeakMap();
  const nameOf = (u) => { try { return decodeURIComponent(new URL(u, location.href).pathname.split("/").pop()); } catch { return String(u); } };
  const RA = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = function () { const u = this.url; return RA.call(this).then((ab) => { abUrl.set(ab, nameOf(u)); return ab; }); };
  const DA = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (ab, ok, bad) {
    const n = abUrl.get(ab) || "?"; const p = DA.call(this, ab);
    p.then((b) => { bufName.set(b, n); ok && ok(b); }, (e) => bad && bad(e)); return p;
  };
  const SV = AudioParam.prototype.setValueAtTime;
  AudioParam.prototype.setValueAtTime = function (v, t) { if (!freq0.has(this)) freq0.set(this, Math.round(v)); return SV.call(this, v, t); };
  const BS = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { D.snd.push({ k: "buf", t: now(), n: (this.buffer && bufName.get(this.buffer)) || "?", loop: !!this.loop }); return BS.apply(this, a); };
  const OS = OscillatorNode.prototype.start, OT = OscillatorNode.prototype.stop;
  OscillatorNode.prototype.start = function (...a) {
    const r = { k: "osc", t: now(), f: freq0.get(this.frequency) ?? Math.round(this.frequency.value), stop: false }; recOf.set(this, r); D.snd.push(r);
    return OS.apply(this, a);
  };
  OscillatorNode.prototype.stop = function (...a) { const r = recOf.get(this); if (r) r.stop = true; return OT.apply(this, a); };
  const MP = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) { D.snd.push({ k: "media", t: now(), n: nameOf(this.currentSrc || this.src), loop: !!this.loop, muted: this.muted }); return MP.apply(this, a); };
  addEventListener("pointerdown", () => { D.down = now(); }, true);
  addEventListener("pointerup", () => { D.up = now(); }, true);
  addEventListener("click", () => { D.click = now(); }, true);
})();`;

const FB = { 1400: "click", 240: "click", 300: "bup", 700: "bup", 500: "sent", 1500: "sent" };
/** Phân loại tiếng của một lần bấm. */
function classify(snd) {
  const fb = snd.filter((x) => x.k === "osc" && FB[x.f] && FB[x.f] !== "sent").sort((a, b) => a.t - b.t);
  let groups = 0, last = -1e9;
  for (const x of fb) { if (x.t - last > 30) groups++; last = x.t; }
  const sent = snd.some((x) => x.k === "osc" && FB[x.f] === "sent");
  const game = snd.filter((x) => (x.k === "buf" && !x.loop) || (x.k === "media" && !x.loop && !x.muted) || (x.k === "osc" && !FB[x.f] && x.stop))
    .map((x) => x.n || "osc" + x.f);
  const count = groups + (sent ? 1 : 0) + (game.length ? 1 : 0);
  const g0 = snd.find((x) => (x.k === "buf" && !x.loop) || (x.k === "media" && !x.loop && !x.muted) || (x.k === "osc" && !FB[x.f] && x.stop));
  return { groups, sent, game: [...new Set(game)], count, fbAt: fb.length ? fb[0].t : null, gameAt: g0 ? g0.t : null };
}

const SEL = 'button, .btn, .px-btn, [role="button"], a.btn, a.px-link, input[type="submit"]';
const LIST_JS = `(() => { const out = [];
  document.querySelectorAll(${JSON.stringify(SEL)}).forEach((el, i) => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || el.disabled || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || +cs.opacity === 0) return;
    if (el.tagName === "A" && el.getAttribute("href") && !el.getAttribute("href").startsWith("#")) return; // link chuyển trang
    const x = r.left + r.width / 2, y = r.top + r.height / 2, top = document.elementFromPoint(x, y);
    if (!top || !(top === el || el.contains(top))) return; // bị che
    out.push({ i, label: (el.id ? "#" + el.id + " " : "") + (el.textContent || el.getAttribute("aria-label") || el.value || "").trim().replace(/\\s+/g, " ").slice(0, 32), x: Math.round(x), y: Math.round(y) });
  });
  return out; })()`;
const SIG_JS = `JSON.stringify([location.href, localStorage.getItem("wgp.muted"), ${LIST_JS}.map((b) => b.i + b.label + b.x + "," + b.y)])`;
const START_JS = `(() => { const c = [...document.querySelectorAll("#playBtn,#play1,#goSolo,#start,#introGo,#startBtn,button")].find((b) => b.offsetParent && !b.disabled &&
  (/^(playBtn|play1|goSolo|introGo|startBtn)$/.test(b.id) || /^(▶\\s*)?(Chơi|Bắt đầu|Chơi ngay|Vào quán|Mở quán)/i.test(b.textContent.trim())));
  if (c) { c.click(); return c.id || c.textContent.trim().slice(0, 20); } return ""; })()`;

// Màn kết thúc ván + bảng "Thách bạn" (challenge.js, Đợt 10) của 3 game có nút ⚔ Thách bạn: ép hết ván bằng __game.
const OVER = {
  "/games/ran-san-moi/": `(async () => { __game.steps(400); })()`,
  "/games/2048/": `(async () => { const d = ["left","up","right","down"]; for (let i = 0; i < 4000 && __game.state.status === "playing"; i++) { if (!__game.move(d[i % 4])) for (const x of d) if (__game.move(x)) break; if (i % 50 === 0) await new Promise((r) => setTimeout(r, 0)); } })()`,
  "/games/dao-vang/": `(async () => { __game.state.time = 0.02; })()`,
};
const CHAL_VISIBLE = `(() => { const b = document.querySelector("#chalBtnE, #chalBtn"); return !!b && !b.hidden && b.getClientRects().length > 0 && !b.closest("[hidden]"); })()`;

const chrome = await launchChrome("double-sound");
async function openTab(touch) {
  const t = await chrome.newTab(touch ? "touch" : "mouse", touch ? 390 : 1366, touch ? 844 : 768, touch);
  const orig = t.ws.onmessage;
  t.ws.onmessage = (e) => {
    orig(e);
    const m = JSON.parse(e.data);
    if (m.method === "Page.javascriptDialogOpening") t.cmd("Page.handleJavaScriptDialog", { accept: false });
    if (m.method === "Fetch.requestPaused") {
      t.cmd("Fetch.fulfillRequest", { requestId: m.params.requestId, responseCode: 200, body: baselineSrc,
        responseHeaders: [{ name: "Content-Type", value: "text/javascript; charset=utf-8" }, { name: "Cache-Control", value: "no-store" }] });
    }
  };
  await t.cmd("Network.enable"); await t.cmd("Network.setCacheDisabled", { cacheDisabled: true });
  if (BASELINE) await t.cmd("Fetch.enable", { patterns: [{ urlPattern: "*/_shared/feedback.js*", requestStage: "Request" }] });
  await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: HOOK });
  return t;
}
async function press(t, touch, x, y) {
  if (touch) {
    await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await sleep(40);
    await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await t.cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await t.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await sleep(60);
    await t.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  }
}
async function load(t, url, phase) {
  await t.go(url); await sleep(900);
  await t.cmd("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Shift", code: "ShiftLeft", windowsVirtualKeyCode: 16 }); // kích hoạt người dùng (mở khoá AudioContext) mà không bấm vào đâu
  await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Shift", code: "ShiftLeft", windowsVirtualKeyCode: 16 });
  if (phase === "menu") return true;
  if (!(await t.ev(START_JS))) return false;
  await sleep(1500);
  if (phase === "over" || phase === "share") {
    await t.ev(OVER[url.slice(base.length)]);
    try { await t.waitFor(CHAL_VISIBLE, 8000); } catch { console.error("  over?", await t.ev(`JSON.stringify({ st: __game.state && __game.state.status, ov: [...document.querySelectorAll("[id^=ov]")].map((o) => o.id + ":" + o.hidden) })`)); return false; }
    await sleep(1500); // chờ tiếng hết ván / kỷ lục (hẹn 700 ms) qua hết
    await t.ev(`navigator.clipboard && (navigator.clipboard.writeText = () => Promise.resolve()); true`);
  }
  if (phase === "share") {
    await t.ev(`document.querySelector("#chalBtnE, #chalBtn").click(); true`);
    try { await t.waitFor(`!!document.querySelector(".lk-share")`, 5000); } catch { return false; }
    await sleep(500);
  }
  return true;
}

const results = [];
const doubles = [], unreached = [];
const delays = [], clickDelays = [];
let pressCount = 0;
try {
  // chuột và chạm chạy song song (2 tab) cho nhanh; các trang lần lượt
  const runInput = async (p, touch) => {
    {
      const input = touch ? "chạm" : "chuột";
      const t = await openTab(touch);
      for (const phase of ["menu", "game", ...(OVER[p] ? ["over", "share"] : [])]) {
        if (!(await load(t, base + p, phase))) { if (phase !== "menu" && phase !== "game") console.log(`FAIL ${p} [${phase}/${input}] không tới được màn này`), unreached.push(`${p} ${phase}/${input}`); continue; }
        const btns = (await t.ev(LIST_JS)).slice(0, MAX_BTNS);
        let dirty = false;
        for (const b of btns) {
          try {
            if (dirty) { if (!(await load(t, base + p, phase))) break; dirty = false; }
            const pos = (await t.ev(LIST_JS)).find((x) => x.i === b.i);
            if (!pos) continue;
            const sig0 = await t.ev(SIG_JS);
            const n0 = await t.ev("__ds.snd.length");
            await press(t, touch, pos.x, pos.y); await sleep(WAIT);
            let r;
            try { r = await t.ev(`({ snd: __ds.snd.slice(${n0}), up: __ds.up, down: __ds.down, click: __ds.click, href: location.href })`); } catch { dirty = true; continue; }
            if (!r || !r.href.includes(p)) { dirty = true; continue; } // đã chuyển trang
            const c = classify(r.snd.filter((x) => x.t >= r.down - 5)); // chỉ tiếng bắt đầu từ lúc nhấn (tiếng nền của ván — gộp ô, kỷ lục hẹn giờ — không tính)
            pressCount++;
            const row = { page: p, phase, input, label: pos.label, ...c, gameAfterUp: c.gameAt != null && r.up ? Math.round(c.gameAt - r.up) : null,
              gameAfterClick: c.gameAt != null && r.click > r.down ? Math.round(c.gameAt - r.click) : null };
            results.push(row);
            if (c.fbAt != null && !touch && r.up) delays.push(c.fbAt - r.up), clickDelays.push(c.fbAt - Math.max(r.click, r.up));
            if (c.count >= 2) {
              doubles.push(row);
              console.log(`FAIL ${p} [${phase}/${input}] ${pos.label} :: tách×${c.groups}${c.sent ? " +vút" : ""} + game=${c.game.join(",") || "-"}`);
              if (SHOTS) await t.shot(join(SHOTS, `${p.replace(/\W+/g, "_")}${phase}-${input === "chạm" ? "touch" : "mouse"}-${b.i}.png`));
            }
            if ((await t.ev(SIG_JS)) !== sig0) dirty = true; // gồm cả khoá tắt tiếng: nút 🔊 bị bấm ⇒ tải lại (game giữ trạng thái im trong bộ nhớ)
            await t.ev(`try { localStorage.removeItem("wgp.muted") } catch {}`);
          } catch (e) { dirty = true; console.error(`  ! ${p} ${phase}/${input} ${b.label}: ${String(e.message).slice(0, 160)}`); }
        }
      }
      if (t.errors.length) console.error(`  (lỗi console ${p} ${input}: ${t.errors.length})`);
      await t.closeTab();
    }
  };
  for (const p of PAGES) {
    await Promise.all([runInput(p, false), runInput(p, true)]);
    console.error(`xong ${p}`);
  }

  // ── Trang chủ: thẻ game (press-nav.js gọi play() của feedback.js) ⇒ đúng 1 "bụp", không chuyển trang trong lúc kiểm ──
  if (!only || only.split(",").some((o) => "/homepage/".includes(o))) {
    for (const touch of [false, true]) {
      const t = await openTab(touch);
      await load(t, base + "/homepage/", "menu");
      await t.waitFor('document.querySelectorAll("a.tile[href]").length > 3');
      await t.ev(`addEventListener("click", (e) => { if (e.target.closest("a.tile")) { e.preventDefault(); e.stopImmediatePropagation(); } }, true); true`);
      const pos = await t.ev(`(async () => { const a = [...document.querySelectorAll("a.tile[href]")].find((a) => a.getBoundingClientRect().width > 0);
        if (!a) return null; a.scrollIntoView({ block: "center" }); await new Promise((r) => setTimeout(r, 400)); const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: a.dataset.id }; })()`);
      if (pos) {
        const n0 = await t.ev("__ds.snd.length");
        await press(t, touch, pos.x, pos.y); await sleep(WAIT);
        const c = classify(await t.ev(`__ds.snd.slice(${n0})`));
        const row = { page: "/homepage/", phase: "press-nav", input: touch ? "chạm" : "chuột", label: "a.tile " + pos.label, ...c };
        results.push(row); pressCount++;
        const good = c.groups === 1 && c.count === 1;
        console.log(`${good ? "PASS" : "FAIL"} trang chủ press-nav ${row.input} ${row.label}: bụp×${c.groups}, game=${c.game.join(",") || "-"}`);
        if (!good) doubles.push(row);
      } else console.log("FAIL trang chủ: không thấy thẻ game để bấm"), unreached.push("/homepage/ press-nav");
      await t.closeTab();
    }
  }
} finally {
  chrome.close(); server.close();
}

const silent = results.filter((r) => r.count === 0).length;
const tach = results.filter((r) => r.groups > 0 && !r.game.length).length;
const gameOnly = results.filter((r) => r.game.length && !r.groups).length;
const ds = delays.sort((a, b) => a - b);
console.log(`\n${BASELINE ? "[feedback.js bản master] " : ""}${PAGES.length} trang, ${pressCount} lần bấm: ${tach} chỉ "tách", ${gameOnly} chỉ tiếng game, ${silent} im, ${doubles.length} KÊU 2 TIẾNG`);
if (ds.length) console.log(`Độ trễ "tách" sau khi nhả chuột: trung vị ${ds[ds.length >> 1].toFixed(1)} ms, lớn nhất ${ds[ds.length - 1].toFixed(1)} ms (${ds.length} lần; âm = kêu lúc nhấn xuống)`);
const cd = clickDelays.sort((a, b) => a - b);
if (cd.length) console.log(`  … tính từ lúc sự kiện click được phát (đã trừ thời gian trang bận trước click): trung vị ${cd[cd.length >> 1].toFixed(1)} ms, lớn nhất ${cd[cd.length - 1].toFixed(1)} ms`);
const late = results.filter((r) => r.gameAfterUp != null).map((r) => r.gameAfterUp).sort((a, b) => a - b);
if (late.length) console.log(`Tiếng game bắt đầu sau khi nhả tay: trung vị ${late[late.length >> 1]} ms, lớn nhất ${late[late.length - 1]} ms (${late.length} lần; âm = phát lúc nhấn xuống)`);
const lc = results.filter((r) => r.gameAfterClick != null).map((r) => r.gameAfterClick).sort((a, b) => a - b);
if (lc.length) console.log(`  … tính từ sự kiện click: trung vị ${lc[lc.length >> 1]} ms, lớn nhất ${lc[lc.length - 1]} ms; ${lc.filter((v) => v > 0).length}/${lc.length} lần phát SAU khi click đã xử lý xong (bất đồng bộ)`);
if (OUTFILE) writeFileSync(OUTFILE, JSON.stringify({ baseline: BASELINE, results, delays: ds }, null, 1));
if (unreached.length) console.log(`Không tới được màn cần kiểm: ${unreached.join("; ")}`);
const nFail = doubles.length + unreached.length;
console.log(nFail ? `\n${nFail} FAIL` : "\n0 FAIL — mỗi lần bấm một tiếng");
process.exit(nFail ? 1 : 0);
