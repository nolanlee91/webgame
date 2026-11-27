// e2e Đợt 12 trang chủ (docs/audits/fixes/D12-home.md) — quyết định chủ dự án:
//  1. Sảnh MỘT bố cục cố định: hàng "Có mã phòng? [mã] Vào · + Tạo phòng" ở CÙNG toạ độ khi 0 phòng / 1 phòng / 5 phòng / phòng về sau 1 s;
//     máy tính hero trái + sảnh phải cao bằng hero; trống ⇒ một dòng nhắn, không nút Tạo phòng thứ hai; CLS ≤ 0,01; "Tất cả game" không bị xô.
//  2. Điện thoại (dọc + xoay ngang thấp): một danh sách — không dải "Chơi ngay", băng thấp "Tựa game của tuần" (= HERO_SLIDES[0]),
//     không game nào lặp trong màn đầu, mỗi game đúng một lần trong các kệ.
//  3. Thẻ "Tài trợ" SpeakUp Kids (link thật, tab mới, rel noopener sponsored, bấm đúng 1 tiếng).
//  4. Hộp "☕ Ủng hộ Lụm Kèo": ảnh QR chỉ tải khi mở, mở / đóng (×, Esc, nền mờ), focus về nút, nút chép số tài khoản, đếm donate_open.
// Chạy: node prototype/games/_shared/test/home-d12-e2e.mjs [thư-mục-ảnh]   (tự bật server.js trong tiến trình, cổng ngẫu nhiên)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { startServer, launchChrome, sleep } from "./cdp.mjs";
import { shotDir } from "./lk-temp.mjs";
import { SOUND_HOOK } from "./audit-lib.mjs";

const OUT = path.resolve(process.argv[2] || shotDir("home-d12"));
mkdirSync(OUT, { recursive: true });
for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RAILWAY_ENVIRONMENT", "RAILWAY_PROJECT_ID", "NODE_ENV", "DAILY_BOARD"]) delete process.env[k];
const { server, base } = await startServer();
const chrome = await launchChrome("home-d12");
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
const shot = async (t, name) => { const f = path.join(OUT, name); await t.shot(f); console.log("  ảnh: " + f); };
const tabs = [];
const room = (i) => ({ game: ["co-caro", "co-ca-ngua", "ma-soi", "noi-tu", "co-vua"][i % 5], code: "ABCD" + i, host: "Mèo " + i, have: 1, max: 2 });
const STATES = [["0-phong", { rooms: [] }], ["1-phong", { rooms: [room(0)] }], ["5-phong", { rooms: [0, 1, 2, 3, 4].map(room) }], ["ve-muon-1s", { rooms: [room(0)], delay: 1000 }]];
const mock = (d) => `(() => { const real = window.fetch.bind(window), body = ${JSON.stringify(JSON.stringify({ rooms: d.rooms, playing: d.playing || [] }))};
  window.fetch = (u, o) => String(u).endsWith("/api/lobby") ? new Promise(r => setTimeout(() => r(new Response(body, { status: 200, headers: { "Content-Type": "application/json" } })), ${d.delay || 0})) : real(u, o); })()`;
const CLSOBS = `window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });`;
async function open(name, w, h, mobile, lobby = { rooms: [] }, extra = "") {
  const ctx = await chrome.newContext();
  const t = await chrome.newTab(name, w, h, mobile, ctx);
  tabs.push(t);
  await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("wgp.muted","0")}catch{}` + SOUND_HOOK + ";" + mock(lobby) + ";" + CLSOBS + extra });
  await t.go(base + "/homepage/");
  await t.waitFor(`!document.getElementById("lobby").classList.contains("is-loading")`);
  if (lobby.delay) await t.waitFor(`document.querySelectorAll(".lobby .room").length > 0`, 8000);
  await sleep(1200);
  return t;
}
// số tiếng: các lần phát cách nhau < 30 ms tính là một tiếng (cùng cách đếm với double-sound-e2e)
const sounds = (t, from) => t.ev(`(() => { const s = window.__snd.filter(x => x.t >= ${from}).map(x => x.t).sort((a, b) => a - b); let n = 0, last = -1e9; for (const x of s) { if (x - last >= 30) n++; last = x; } return n; })()`);
const now = (t) => t.ev("Math.round(performance.now())");

try {
  // ---------- 1. Sảnh cố định: cùng toạ độ ở mọi trạng thái, CLS ----------
  const VPS = [[1366, 768, false], [1920, 1080, false], [1024, 768, false], [390, 844, true], [360, 640, true], [320, 568, true]];
  for (const [w, h, mob] of VPS) {
    const pos = [];
    for (const [st, d] of STATES) {
      const t = await open(`sanh-${w}-${st}`, w, h, mob, d);
      const m = await t.ev(`(() => { const R = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(","); };
        const L = document.getElementById("lobby"), H = document.querySelector(".hero").getBoundingClientRect(), B = L.getBoundingClientRect();
        const shown = (s) => { const e = L.querySelector(s); return !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().height > 0; };
        return { ctl: [R("#roomInlineCode"), R("#roomInline button"), R("#createRoom")].join(" | "), title: shown(".lobby__title"), body: R("#lobbyBody"), games: Math.round(document.getElementById("games").getBoundingClientRect().top + scrollY),
          empty: shown("#lobbyEmpty"), emptyTx: document.getElementById("lobbyEmpty").textContent, creates: L.querySelectorAll("a[href='#duel'], #createRoom, #createRoom2").length,
          rooms: L.querySelectorAll(".room").length, tabs: shown(".ltabs"), side: B.left >= H.right - 1 && Math.abs(B.top - H.top) <= 2, sameH: Math.abs(B.height - H.height) <= 2, peek: !!document.getElementById("lobbyPeek"),
          sw: document.documentElement.scrollWidth <= innerWidth + 1, cls: +window.__cls.toFixed(4) }; })()`);
      pos.push(m);
      check(`${w}×${h} ${st}: CLS ≤ 0,01`, m.cls <= 0.01, String(m.cls));
      if (st === "0-phong") check(`${w}×${h} trống: tiêu đề + hàng mã + MỘT dòng nhắn, không nút Tạo phòng thứ 2, không tab`, m.title && m.empty && /^Chưa có phòng nào đang chờ/.test(m.emptyTx) && m.creates === 1 && !m.tabs && m.rooms === 0, JSON.stringify(m));
      else check(`${w}×${h} ${st}: có phòng ⇒ danh sách hiện trong ô, dòng nhắn ẩn${mob ? "" : ", có tab"}`, m.rooms >= 1 && !m.empty && (mob || m.tabs), JSON.stringify(m));
      if (w >= 1024) check(`${w}×${h} ${st}: hero trái, sảnh phải cao bằng hero (không còn hero trọn hàng của D11), không nút "Xem"`, m.side && m.sameH && !m.peek, JSON.stringify(m));
      check(`${w}×${h} ${st}: không tràn ngang`, m.sw);
      await shot(t, `sanh-${w}x${h}-${st}.png`);
      await t.closeTab();
    }
    const same = (k) => pos.every((p) => p[k] === pos[0][k]);
    check(`${w}×${h}: hàng mã phòng / Vào / Tạo phòng CÙNG toạ độ ở 0 · 1 · 5 phòng · phòng về muộn`, same("ctl"), pos.map((p) => p.ctl).join(" ‖ "));
    check(`${w}×${h}: ô danh sách cùng khung + "Tất cả game" không xô ở mọi trạng thái`, same("body") && same("games"), pos.map((p) => p.body + " @" + p.games).join(" ‖ "));
  }

  // ---------- 2. Điện thoại: một danh sách ----------
  for (const [w, h] of [[390, 844], [360, 640], [320, 568], [568, 320], [844, 390]]) {
    const t = await open(`mot-ds-${w}x${h}`, w, h, true, { rooms: [] });
    const m = await t.ev(`(() => { const hero = document.querySelector(".hero").getBoundingClientRect(), s1 = document.querySelector("#heroTrack .slide");
      const hit = (e) => { const r = e.getBoundingClientRect(); if (!r.width || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return false;
        const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y = Math.min(Math.max(r.top + Math.min(r.height / 2, 20), 1), innerHeight - 1), top = document.elementFromPoint(x, y); return !!top && (top === e || e.contains(top)); };
      const vis = [...document.querySelectorAll("a[data-id]")].filter(hit).map(e => e.dataset.id);
      const shelf = [...document.querySelectorAll("#grid .tile[data-id]")].map(e => e.dataset.id).filter(id => id !== "sponsor");
      const full = [...document.querySelectorAll("#grid .tile")].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }).length;
      const img = document.querySelector(".hero__art img");
      return { qp: !!document.getElementById("quickPlay") || !!document.querySelector(".qp, .tile--qp, .tile--feat"), heroH: Math.round(hero.height), id: s1.dataset.id, want: window.HERO_SLIDES[0].id,
        kicker: s1.querySelector(".kicker").textContent, name: s1.querySelector(".hero__name").textContent, go: !!s1.querySelector(".btn"),
        nav: document.getElementById("heroNext").getBoundingClientRect().height, dots: document.getElementById("heroDots").getBoundingClientRect().height,
        vis, dupVis: vis.length !== new Set(vis).size, dupShelf: shelf.length !== new Set(shelf).size, shelf: shelf.length, games: window.GAMES.length, full,
        prio: img.getAttribute("fetchpriority"), src: img.currentSrc.replace(location.origin, ""), codeBottom: Math.round(document.getElementById("roomInlineCode").getBoundingClientRect().bottom),
        qpImgs: performance.getEntriesByType("resource").filter(r => /thumbs\\//.test(r.name)).length, sw: document.documentElement.scrollWidth <= innerWidth + 1 }; })()`);
    check(`D12 ${w}×${h}: không dải "Chơi ngay" / ô lớn; băng thấp 96–120 px = HERO_SLIDES[0] (kicker, tên, Chơi ngay), không ‹ › / chấm`,
      !m.qp && m.heroH >= 90 && m.heroH <= 120 && m.id === m.want && m.kicker === "Tựa game của tuần" && m.go && m.nav === 0 && m.dots === 0 && m.prio === "high" && m.sw, JSON.stringify(m));
    check(`D12 ${w}×${h}: không game nào lặp trong màn đầu (kể cả băng); mỗi game đúng một lần trong các kệ`, !m.dupVis && !m.dupShelf && m.shelf === m.games, `màn đầu ${m.vis.join(",")} · kệ ${m.shelf}/${m.games}`);
    if (w === 390) check("D12 390×844: màn đầu thấy băng + hàng mã phòng + trọn hàng ô đầu của kệ đầu (≥ 3 thẻ)", m.codeBottom < h && m.full >= 3, JSON.stringify({ code: m.codeBottom, full: m.full }));
    console.log(`  ${w}×${h}: thẻ game thấy trọn trong màn đầu = ${m.full} (+ băng Tựa game của tuần), ảnh băng ${m.src}`);
    await shot(t, `mot-ds-${w}x${h}.png`);
    // tự chuyển / vuốt tắt ở băng
    await sleep(6000);
    check(`D12 ${w}×${h}: băng không tự chuyển (vẫn slide 1 sau 6 s)`, await t.ev(`document.querySelector("#heroTrack").style.transform === "translateX(0%)"`));
    await t.closeTab();
  }

  // ---------- 3. Thẻ Tài trợ ----------
  for (const [w, h, mob] of [[1366, 768, false], [390, 844, true]]) {
    const t = await open(`tai-tro-${w}`, w, h, mob);
    const m = await t.ev(`(() => { const s = document.querySelector("#grid .tile--sponsor"); if (!s) return null; const sh = [...document.querySelectorAll("#grid .shelf")].pop(), tl = sh.querySelectorAll(".tile");
      s.scrollIntoView({ block: "center" }); return { href: s.getAttribute("href"), target: s.target, rel: s.rel.split(" ").sort().join(" "), last: tl[tl.length - 1] === s, label: s.getAttribute("aria-label") }; })()`);
    check(`Tài trợ ${w}: thẻ SpeakUp Kids cuối kệ cuối, https://speakupkids.net/, tab mới, rel noopener sponsored`, m && m.href === "https://speakupkids.net/" && m.target === "_blank" && m.rel === "noopener sponsored" && m.last, JSON.stringify(m));
    await sleep(300);
    const p = await t.ev(`(() => { const r = document.querySelector("#grid .tile--sponsor").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    const t0 = await now(t);
    if (mob) {
      await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] }); await sleep(90);
      await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      await t.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
      await t.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
    }
    await sleep(400);
    const n = await sounds(t, t0);
    check(`Tài trợ ${w}: bấm thẻ ⇒ đúng 1 tiếng, trang chủ không chuyển (link mở tab mới)`, n === 1 && (await t.ev("location.pathname")) === "/homepage/", `tiếng ${n}`);
    await t.closeTab();
  }

  // ---------- 4. Hộp Ủng hộ ----------
  const BEACON = `;window.__beacons = []; const _sb = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = (u, b) => { window.__beacons.push(String(b)); return true; };`;
  for (const [w, h, mob] of [[320, 568, true], [390, 844, true], [1366, 768, false]]) {
    const t = await open(`ung-ho-${w}`, w, h, mob, { rooms: [] }, BEACON);
    await t.cmd("Browser.grantPermissions", { permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"], origin: base }).catch(() => {});
    const qrReq = () => t.ev(`performance.getEntriesByType("resource").filter(r => /ung-ho-qr/.test(r.name)).length`);
    check(`Ủng hộ ${w}: ảnh QR KHÔNG tải khi chưa mở hộp`, (await qrReq()) === 0 && (await t.ev(`!document.querySelector(".donate__qr img").getAttribute("src")`)));
    const btnTx = await t.ev(`document.getElementById("donateBtn").textContent`);
    check(`Ủng hộ ${w}: chân trang có nút "☕ Ủng hộ Lụm Kèo", cao ≥ 44 px`, btnTx === "☕ Ủng hộ Lụm Kèo" && (await t.ev(`document.getElementById("donateBtn").getBoundingClientRect().height >= 44`)), btnTx);
    const t0 = await now(t);
    const free = await t.click("#donateBtn", { touch: mob });
    await t.waitFor(`document.getElementById("donateDlg").open && document.querySelector(".donate__qr img").complete && document.querySelector(".donate__qr img").naturalWidth > 0`, 6000);
    await sleep(400);
    const n = await sounds(t, t0);
    const m = await t.ev(`(() => { const d = document.getElementById("donateDlg"), q = d.querySelector(".donate__qr img").getBoundingClientRect(), b = d.querySelector(".donate__box").getBoundingClientRect();
      return { qrW: Math.round(q.width), nat: d.querySelector(".donate__qr img").naturalWidth, inView: b.top >= 0 && b.bottom <= innerHeight + 1 && b.left >= 0 && b.right <= innerWidth,
        render: getComputedStyle(d.querySelector(".donate__qr img")).imageRendering, focusIn: d.contains(document.activeElement), hint: /Quét QR/.test(d.textContent), thanks: /trà đá/.test(d.textContent),
        acc: d.querySelector("[data-acc]").dataset.acc.length, beacons: window.__beacons.filter(x => /donate_open/.test(x)).length }; })()`);
    check(`Ủng hộ ${w}: bấm ⇒ mở hộp, đúng 1 tiếng, ảnh tải lúc này, QR ≥ 240 px (image-rendering auto), focus trong hộp, cả hộp nằm trong màn`,
      free && n === 1 && m.qrW >= 240 && m.nat === 720 && m.render === "auto" && m.focusIn && m.inView && m.hint && m.thanks && (await qrReq()) === 1, JSON.stringify({ ...m, sounds: n }));
    check(`Ủng hộ ${w}: mở hộp ⇒ gửi đúng 1 sự kiện donate_open`, m.beacons === 1, String(m.beacons));
    await shot(t, `ung-ho-${w}x${h}.png`);
    // chép số tài khoản (không in số ra log)
    await t.ev(`document.querySelector(".donate__copy").click()`); await sleep(300);
    const cp = await t.ev(`(async () => { let clip = ""; try { clip = await navigator.clipboard.readText(); } catch (e) { clip = "?"; } const acc = document.querySelector("[data-acc]").dataset.acc;
      return { toast: document.querySelector(".donate__toast").hidden ? "" : document.querySelector(".donate__toast").textContent, match: clip === acc, readable: clip !== "?" }; })()`);
    check(`Ủng hộ ${w}: "Chép số tài khoản" ⇒ bộ nhớ tạm đúng số, hiện "Đã chép"`, cp.toast === "Đã chép" && (cp.match || !cp.readable), JSON.stringify(cp));
    // Tab giữ trong hộp
    for (let i = 0; i < 4; i++) { await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); }
    check(`Ủng hộ ${w}: Tab nhiều lần vẫn ở trong hộp`, await t.ev(`document.getElementById("donateDlg").contains(document.activeElement)`));
    // Esc đóng, focus về nút
    await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await sleep(200);
    check(`Ủng hộ ${w}: Esc ⇒ đóng, focus về nút Ủng hộ`, await t.ev(`!document.getElementById("donateDlg").open && document.activeElement.id === "donateBtn"`));
    // × đóng
    await t.ev(`document.getElementById("donateBtn").click()`); await sleep(150);
    await t.click(".donate__x", { touch: mob }); await sleep(250);
    check(`Ủng hộ ${w}: nút × ⇒ đóng`, await t.ev(`!document.getElementById("donateDlg").open`));
    // chạm nền mờ đóng
    await t.ev(`document.getElementById("donateBtn").click()`); await sleep(150);
    if (mob) { await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 4, y: 4 }] }); await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
    else { await t.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: 4, y: 4, button: "left", clickCount: 1 }); await t.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: 4, y: 4, button: "left", clickCount: 1 }); }
    await sleep(250);
    check(`Ủng hộ ${w}: chạm nền mờ ⇒ đóng; mở lại không tải ảnh lần 2, đếm thêm 1 lần mở`, await t.ev(`!document.getElementById("donateDlg").open`) && (await qrReq()) === 1
      && (await t.ev(`window.__beacons.filter(x => /donate_open/.test(x)).length`)) === 3);
    await t.closeTab();
  }
  // trang Thử thách cũng có nút
  {
    const ctx = await chrome.newContext(); const t = await chrome.newTab("ung-ho-bxh", 390, 844, true, ctx); tabs.push(t);
    await t.go(base + "/homepage/bang-xep-hang.html"); await sleep(400);
    await t.ev(`document.getElementById("donateBtn").click()`); await sleep(400);
    check("Ủng hộ trang Thử thách: có nút ở chân trang, mở được hộp + ảnh", await t.ev(`document.getElementById("donateDlg").open && !!document.querySelector(".donate__qr img").getAttribute("src")`));
  }

  const errs = tabs.flatMap((t) => t.errors.map((e) => t.name + ": " + e)).filter((e) => !/ws\/|\/api\/ev/.test(e));
  check("không có lỗi JS / console error", !errs.length, errs.join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + (e && e.stack || e)); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
try { chrome.close(); } catch {}
server.close();
setTimeout(() => process.exit(fails ? 1 : 0), 800);
