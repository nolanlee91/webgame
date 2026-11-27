// e2e Đợt 11 trang chủ (docs/audits/fixes/D11-misc.md):
//  HOME2-06 chạm hero đúng lúc đang tự trượt ⇒ mở game của slide nằm dưới ngón tay; chạm / vuốt hero ⇒ dừng hẳn tự chuyển.
//  HOME2-07 thẻ phòng: tên chủ phòng dài có "…" (390, 1366); điện thoại ≤ 3 phòng ⇒ danh sách rộng hết panel, nút "Vào" sát mép phải.
//  HOME2-10 chip điều hướng (link #lobby…) kêu "bụp" như mọi nút / thẻ; lướt ngang hàng chip không kêu.
//  HOME2-13 568×320 (iPhone SE xoay ngang): hàng chip + ô tìm gộp một hàng ⇒ dải "Chơi ngay" lên cao.
// Chạy: node prototype/games/_shared/test/home-d11-e2e.mjs [thư-mục-ảnh]   (tự bật server.js trong tiến trình, cổng ngẫu nhiên)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { startServer, launchChrome, sleep } from "./cdp.mjs";
import { shotDir } from "./lk-temp.mjs";
import { SOUND_HOOK } from "./audit-lib.mjs";

const OUT = path.resolve(process.argv[2] || shotDir("home-d11"));
mkdirSync(OUT, { recursive: true });
for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RAILWAY_ENVIRONMENT", "RAILWAY_PROJECT_ID", "NODE_ENV", "DAILY_BOARD"]) delete process.env[k];
const { server, base } = await startServer();
const chrome = await launchChrome("home-d11");
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
const shot = async (t, name) => { const f = path.join(OUT, name); await t.shot(f); console.log("  ảnh: " + f); };
const tabs = [];
const mockLobby = (data) => `(() => { const real = window.fetch.bind(window), body = ${JSON.stringify(JSON.stringify(data))};
  window.fetch = (u, o) => String(u).endsWith("/api/lobby") ? Promise.resolve(new Response(body, { status: 200, headers: { "Content-Type": "application/json" } })) : real(u, o); })()`;
async function open(name, w, h, mobile, lobby = { rooms: [] }) {
  const ctx = await chrome.newContext();
  const t = await chrome.newTab(name, w, h, mobile, ctx);
  tabs.push(t);
  await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("wgp.muted","0")}catch{}` + SOUND_HOOK + ";" + mockLobby(lobby) });
  await t.go(base + "/homepage/");
  await t.waitFor(`!document.getElementById("lobby").classList.contains("is-loading") && !document.querySelector(".hero").classList.contains("is-loading")`);
  await sleep(300);
  return t;
}
const touch = async (t, pts) => {
  await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pts[0]] });
  for (const p of pts.slice(1)) { await sleep(16); await t.cmd("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [p] }); }
  await sleep(40);
  await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
};
const center = (t, sel) => t.ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const osc = (t) => t.ev(`window.__snd.filter(s => /osc/.test(s.k)).length`);

try {
  // ---------- HOME2-10: chip điều hướng kêu ----------
  {
    const t = await open("chip-390", 390, 844, true);
    const p = await center(t, '.mainnav__a[href="#lobby"]');
    const n0 = await osc(t);
    await touch(t, [p]); await sleep(400);
    const n1 = await osc(t);
    check("HOME2-10: chạm chip 'Phòng' (#lobby) ⇒ có tiếng bụp + nhảy tới sảnh", n1 > n0 && (await t.ev("location.hash")) === "#lobby", `osc ${n0}→${n1}, hash ${await t.ev("location.hash")}`);
    await t.ev("scrollTo(0,0)"); await sleep(200);
    const q = await center(t, '.mainnav__a[href="#lobby"]');
    const n2 = await osc(t);
    await touch(t, [q, { x: q.x - 20, y: q.y }, { x: q.x - 45, y: q.y }, { x: q.x - 70, y: q.y }]); await sleep(400);
    check("HOME2-10: lướt ngang qua hàng chip ⇒ không kêu", (await osc(t)) === n2, `osc ${n2}→${await osc(t)}`);
    const d = await open("chip-1366", 1366, 768, false);
    const c = await center(d, '.mainnav__a[href="#lobby"]');
    const m0 = await osc(d);
    await d.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: c.x, y: c.y, button: "left", clickCount: 1 });
    await d.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: c.x, y: c.y, button: "left", clickCount: 1 });
    await sleep(300);
    check("HOME2-10: máy tính bấm chuột mục 'Phòng online' ⇒ có tiếng như nút khác", (await osc(d)) > m0);
  }

  // ---------- HOME2-06: chạm hero lúc đang trượt ----------
  {
    const t = await open("hero-390", 390, 844, true);
    const want = await t.ev(`new URL(document.querySelector("#heroTrack .slide").href).pathname`);
    const p = await center(t, ".slide .hero__art");
    await t.ev(`document.getElementById("heroNext").click()`); // trượt 0 → 1 (0,5 s); chạm ngay khi slide 0 còn gần như kín khung
    await sleep(60);
    await touch(t, [p]);
    await sleep(900);
    const got = await t.ev("location.pathname");
    check("HOME2-06: chạm đúng lúc đang trượt ⇒ mở game của slide đang nằm dưới ngón tay (không hụt, không sang slide mới)", got === want, `muốn ${want}, ra ${got}`);

    const u = await open("hero-stop", 390, 844, true);
    const h = await center(u, ".slide .hero__art");
    await touch(u, [h, { x: h.x - 30, y: h.y }, { x: h.x - 70, y: h.y }, { x: h.x - 110, y: h.y }]); // vuốt sang slide 2
    await sleep(700);
    const s0 = await u.ev(`[...document.querySelectorAll(".hero__dot")].findIndex(d => d.getAttribute("aria-current") === "true")`);
    await sleep(6500); // HERO_MS = 5,5 s
    const s1 = await u.ev(`[...document.querySelectorAll(".hero__dot")].findIndex(d => d.getAttribute("aria-current") === "true")`);
    check("HOME2-06: đã chạm / vuốt hero ⇒ không tự chuyển nữa", s0 === 1 && s1 === 1, `sau vuốt ${s0}, 6,5 s sau ${s1}`);
    const inert = await u.ev(`[...document.querySelectorAll("#heroTrack .slide")].map(s => s.inert ? 1 : 0).join("")`);
    check("HOME2-06: trượt xong ⇒ chỉ slide đang hiện là không inert (giữ HOME-10)", inert.split("").filter((x) => x === "0").length === 1 && inert[1] === "0", inert);
  }

  // ---------- HOME2-07: thẻ phòng ----------
  const LONG = "Gấu Trúc Bông Siêu Cấp";
  for (const [w, h, mob] of [[390, 844, true], [1366, 768, false], [320, 568, true]]) {
    const t = await open(`phong-${w}`, w, h, mob, { rooms: [{ game: "co-caro", code: "ABCDE", host: LONG, have: 1, max: 2 }] });
    await t.ev(`document.getElementById("lobby").scrollIntoView()`); await sleep(200);
    const m = await t.ev(`(() => { const n = document.querySelector("#rooms .room__hostName"), cs = getComputedStyle(n), room = document.querySelector("#rooms .room"),
      list = document.getElementById("rooms"), go = room.querySelector(".room__go"), L = list.getBoundingClientRect(), R = room.getBoundingClientRect(), G = go.getBoundingClientRect(),
      lp = parseFloat(getComputedStyle(list).paddingRight);
      return { ell: cs.textOverflow, clipped: n.scrollWidth > n.clientWidth, text: n.textContent, roomRight: Math.round(L.right - lp - R.right), goGap: Math.round(R.right - G.right), sw: document.documentElement.scrollWidth <= innerWidth }; })()`);
    check(`HOME2-07 ${w}: tên chủ phòng dài bị cắt CÓ "…" (text-overflow: ellipsis)`, m.ell === "ellipsis" && m.text === LONG, JSON.stringify(m));
    if (mob) check(`HOME2-07 ${w}: 1 phòng ⇒ thẻ rộng hết danh sách, nút Vào sát mép phải thẻ, không tràn ngang`, Math.abs(m.roomRight) <= 2 && m.goGap <= 12 && m.sw, JSON.stringify(m));
    await shot(t, `phong-${w}.png`);
  }
  {
    const many = Array.from({ length: 5 }, (_, i) => ({ game: "co-caro", code: "ABCD" + i, host: "Mèo " + i, have: 1, max: 2 }));
    const t = await open("phong-nhieu-390", 390, 844, true, { rooms: many });
    const cols = await t.ev(`getComputedStyle(document.getElementById("rooms")).gridAutoColumns`);
    check("HOME2-07: ≥ 4 phòng ⇒ vẫn là dải vuốt ngang 88% (lộ mép cột sau)", cols === "88%" || (/px$/.test(cols) && parseFloat(cols) < 390 * 0.9), cols);
  }

  // ---------- HOME2-13: 568×320 ----------
  for (const [w, h] of [[568, 320], [667, 375]]) {
    const t = await open(`ngang-${w}`, w, h, true);
    const m = await t.ev(`(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), nav = r(".mainnav"), q = r(".field.search"), qp = r("#quickPlay");
      const chips = [...document.querySelectorAll(".mainnav__a")].map(a => a.getBoundingClientRect()).filter(c => c.right <= innerWidth && c.left >= 0).length;
      return { navMid: Math.round(nav.top + nav.height / 2), qMid: Math.round(q.top + q.height / 2), qLeft: Math.round(q.left), navRight: Math.round(nav.right), qW: Math.round(q.width),
        qp: Math.round(qp.top), chips, sw: document.documentElement.scrollWidth <= innerWidth + 1, sticky: getComputedStyle(document.querySelector(".topbar__row")).position }; })()`);
    check(`HOME2-13 ${w}×${h}: 4 chip + ô tìm cùng một hàng, ô tìm ≥ 140 px, không tràn ngang`, Math.abs(m.navMid - m.qMid) <= 6 && m.qLeft >= m.navRight && m.qW >= 140 && m.chips === 4 && m.sw, JSON.stringify(m));
    check(`HOME2-13 ${w}×${h}: dải 'Chơi ngay' bắt đầu ≤ ${h - 90} px (trước: y 291 ở 568×320)`, m.qp <= h - 90, JSON.stringify(m));
    await shot(t, `ngang-${w}x${h}.png`);
  }
  {
    const t = await open("doc-390-nav", 390, 844, true);
    const m = await t.ev(`(() => { const nav = document.querySelector(".mainnav").getBoundingClientRect(), q = document.querySelector(".field.search").getBoundingClientRect();
      return { below: q.top >= nav.bottom, float: getComputedStyle(document.querySelector(".mainnav")).float }; })()`);
    check("dọc 390: không đổi (ô tìm vẫn nằm dưới hàng chip)", m.below && m.float === "none", JSON.stringify(m));
  }

  const errs = tabs.flatMap((t) => t.errors.map((e) => t.name + ": " + e)).filter((e) => !/ws\//.test(e));
  check("không có lỗi JS / console error", !errs.length, errs.join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + (e && e.stack || e)); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
try { chrome.close(); } catch {}
server.close();
setTimeout(() => process.exit(fails ? 1 : 0), 800);
