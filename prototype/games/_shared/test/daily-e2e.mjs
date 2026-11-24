// e2e "Thử thách hôm nay" bằng Chrome headless + CDP (Node ≥ 22, có WebSocket sẵn).
// Chạy: node prototype/games/_shared/test/daily-e2e.mjs <thư-mục-ảnh>
// Tự bật server (cổng 8767) và Chrome (cổng 9334). Chỉ chạy trên localhost.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.resolve(process.argv[2] || "daily-shots");
mkdirSync(OUT, { recursive: true });
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const PORT = 8767, BASE = `http://127.0.0.1:${PORT}`;
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, ["server.js"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), DAILY_SUDOKU_MIN_SEC: "0" }, stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9334", "--user-data-dir=" + OUT + "/prof", "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore" });
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
const done = (code) => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} process.exit(code); };

let ws;
for (let i = 0; i < 120; i++) {
  try {
    const l = await (await fetch("http://127.0.0.1:9334/json")).json();
    const p = l.find((x) => x.type === "page");
    if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; }
  } catch {}
  await sleep(250);
}
await new Promise((r) => (ws.onopen = r));
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + "/homepage/")).ok) break; } catch {} await sleep(250); }

let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/favicon|\/api\/lobby|ws\//.test(m.params.entry.url || "")) errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r.result.exceptionDetails) throw new Error(expr.slice(0, 120) + " :: " + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Browser.grantPermissions", { origin: BASE, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
const nav = async (u, wait = 1500) => {
  try { await ev("window.__oldPage = 1"); } catch {}
  await send("Page.navigate", { url: BASE + u });
  // chờ trang MỚI tải xong hẳn (máy nặng / tắt cache có khi > 1,5 s; mở lại cùng URL thì trang cũ cũng "complete"), rồi đợi thêm cho module dựng giao diện
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev(`!window.__oldPage && document.readyState === "complete"`)) break; } catch {} }
  await sleep(wait);
};
const view = (w, h, mobile) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
const shot = async (name, full = false) => {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
  writeFileSync(path.join(OUT, name), Buffer.from(r.result.data, "base64"));
  console.log("  ảnh: " + path.join(OUT, name));
};
// Phần tử ở tâm (hoặc điểm cho trước) có đúng là nó / con của nó không ⇒ không bị che
const hitOk = (sel) => ev(`(() => { const out = []; for (const el of document.querySelectorAll(${JSON.stringify(sel)})) {
  const r = el.getBoundingClientRect(); if (r.right <= 0 || r.left >= innerWidth || r.bottom <= 0 || r.top >= innerHeight) continue;
  const x = Math.min(innerWidth - 2, Math.max(1, r.left + r.width / 2)), y = Math.min(innerHeight - 2, Math.max(1, r.top + r.height / 2));
  const h = document.elementFromPoint(x, y); out.push(!!h && (h === el || el.contains(h))); } return out; })()`);
const noHScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1`);

try {
  // ---------- Trang chủ, chưa chơi ----------
  await view(1366, 768, false);
  await nav("/homepage/");
  await ev(`localStorage.removeItem("wgp.daily.v1"); localStorage.setItem("wgp.sudoku.v1", JSON.stringify({ diff: "de", best: { de: 99 }, wins: { de: 3 }, games: {} })); localStorage.setItem("wgp.2048.v1", JSON.stringify({ size: 3, best: { 3: 1234, 4: 0, 5: 0 }, top: { 3: 128, 4: 0, 5: 0 }, games: {} })); localStorage.setItem("wgp.dovuinhanh.v1", JSON.stringify({ best: { normal: 1500, fast: 0 }, cat: "dia-ly", mode: "fast", recent: [1, 2, 3] })); true`);
  const normalBefore = await ev(`JSON.stringify(["wgp.sudoku.v1","wgp.2048.v1","wgp.dovuinhanh.v1"].map(k=>localStorage.getItem(k)))`);
  await nav("/homepage/");
  const H = JSON.parse(await ev(`JSON.stringify((() => {
    const d = document.getElementById("daily"), a = document.getElementById("featuredSection"), g = document.getElementById("games");
    return { cards: [...document.querySelectorAll(".dcard")].map(c => c.dataset.game + ":" + c.querySelector(".dcard__go").textContent.trim()),
      order: a.compareDocumentPosition(d) & 4 && d.compareDocumentPosition(g) & 4, inMain: !!d.closest("main"), no: document.getElementById("dailyNo").textContent,
      count: document.getElementById("dailyCount").textContent };
  })())`));
  check("trang chủ: 3 thẻ đều 'Chơi ngay'", H.cards.length === 3 && H.cards.every((c) => c.includes("Chơi ngay")), H.cards.join(" | "));
  check("trang chủ: khu thử thách nằm trong <main>, giữa hero/sảnh và 'Tất cả game'", H.inMain && !!H.order);
  check("trang chủ: số thử thách + đếm ngược", /^#\d+$/.test(H.no) && /^\d\d:\d\d:\d\d$/.test(H.count), H.no + " " + H.count);
  const day = +H.no.slice(1);
  const toDaily = `scrollTo(0, document.getElementById("daily").getBoundingClientRect().top + scrollY - (document.querySelector(".topbar")?.offsetHeight || 0) - 12)`;
  await ev(toDaily); await sleep(200);
  await shot("trang-chu-chua-choi-1366.png");
  await view(390, 844, true); await nav("/homepage/"); await ev(toDaily); await sleep(200);
  check("trang chủ 390 (chưa chơi): thẻ không che, không tràn ngang", (await hitOk(".dcard")).every(Boolean) && (await noHScroll()));
  await shot("trang-chu-chua-choi-390.png");
  await view(1366, 768, false);

  // ---------- Đố Vui: chơi một lượt daily đến hết ----------
  await nav("/games/do-vui-nhanh/?daily=1");
  const q0 = JSON.parse(await ev(`JSON.stringify({ chip: document.getElementById("dlyChip")?.textContent, menu: document.getElementById("ovMenu").hidden, n: __game.state.qs.length, ids: __game.daily.ids, qno: document.getElementById("qNo").textContent })`));
  check("Đố Vui daily: nhãn 'Thử thách #N', vào thẳng câu 1/5", q0.chip === `★ Thử thách #${day}` && q0.menu && q0.n === 5 && q0.qno === "CÂU 1/5", JSON.stringify(q0));
  // Tải lại giữa câu 1 ⇒ câu 1 tính hết giờ (không được chơi lại)
  await nav("/games/do-vui-nhanh/?daily=1");
  const afterReload = await ev(`JSON.stringify({ i: __game.state.i, a: __game.state.answers.map(a => a.timeout) })`);
  check("Đố Vui daily: tải lại giữa câu ⇒ câu đó tính hết giờ, sang câu 2", afterReload === JSON.stringify({ i: 1, a: [true] }), afterReload);
  const marks = [false];
  for (let k = 1; k < 5; k++) {
    const want = k !== 3; // câu 4 cố ý chọn sai
    await ev(`(() => { const s = __game.state, q = s.qs[s.i]; const pick = ${want} ? q.correct : (q.correct + 1) % 4;
      document.querySelectorAll(".ans")[pick].click(); })()`);
    marks.push(want);
    await sleep(150);
    await ev(`document.getElementById("nextBtn").click()`);
    await sleep(150);
  }
  await sleep(400);
  const P = JSON.parse(await ev(`JSON.stringify({ ov: !!document.getElementById("dlyOv") && !document.getElementById("dlyOv").hidden, grid: document.getElementById("dlyGrid")?.textContent,
    det: document.getElementById("dlyDet")?.textContent, streak: document.getElementById("dlyStreak")?.textContent, cd: document.getElementById("dlyCount")?.textContent,
    normal: document.getElementById("dlyNormal")?.getAttribute("href"), end: document.getElementById("ovEnd").hidden })`));
  const expGrid = marks.map((m) => (m ? "🟩" : "🟥")).join("");
  check("Đố Vui daily: hết 5 câu ⇒ bảng kết quả (ô 🟩/🟥, chuỗi 1, đếm ngược, nút Chơi thường)", P.ov && P.grid === expGrid && P.streak === "1" && /^\d\d:\d\d:\d\d$/.test(P.cd) && P.normal === "./" && P.end, JSON.stringify(P));
  check("Đố Vui daily: bảng kết quả không bị che (elementFromPoint)", (await hitOk("#dlyShare, #dlyNormal, #dlyView")).every(Boolean));
  await shot("do-vui-ket-qua-1366.png");
  // Chia sẻ: máy tính ⇒ chép clipboard + thông báo
  await send("Page.bringToFront");
  await ev(`document.getElementById("dlyShare").click()`);
  await sleep(500);
  const SH = JSON.parse(await ev(`(async () => { let clip = ""; try { clip = await navigator.clipboard.readText(); } catch (e) { clip = "ERR " + e.message; }
    return JSON.stringify({ clip, text: window.__dailyShareText, toast: document.getElementById("dailyToast")?.textContent, btn: document.getElementById("dlyShare").textContent }); })()`));
  check("chia sẻ: chuỗi đúng mẫu (tên + #N, ô emoji, chuỗi ngày, link ?daily=1&ref=daily)",
    SH.text && SH.text.startsWith(`Lụm Kèo · Thử thách #${day} · Đố Vui\n${expGrid}\n`) && SH.text.includes("🔥 Chuỗi 1 ngày") && SH.text.endsWith("https://lumkeo.com/games/do-vui-nhanh/?daily=1&ref=daily"), JSON.stringify(SH.text));
  check("chia sẻ: fallback clipboard có đúng chuỗi + báo 'Đã chép, dán vào Zalo / Facebook nhé'", SH.clip.replace(/\r\n/g, "\n") === SH.text && SH.toast === "Đã chép, dán vào Zalo / Facebook nhé" && SH.btn === "Đã chép ✓", JSON.stringify(SH.clip) + " | " + SH.toast);
  await shot("do-vui-da-chep-1366.png");
  // Mở lại ⇒ khoá
  await nav("/games/do-vui-nhanh/?daily=1");
  const L2 = JSON.parse(await ev(`JSON.stringify({ ov: !document.getElementById("dlyOv").hidden, state: __game.state, grid: document.getElementById("dlyGrid").textContent })`));
  check("Đố Vui daily: mở lại trong ngày ⇒ khoá, chỉ hiện bảng kết quả", L2.ov && L2.state === null && L2.grid === expGrid);
  await view(390, 844, true); await sleep(300);
  check("Đố Vui daily 390×844: bảng kết quả không che, không tràn ngang", (await hitOk("#dlyShare, #dlyNormal, #dlyView")).every(Boolean) && (await noHScroll()));
  await shot("do-vui-ket-qua-390.png");
  await view(1366, 768, false);

  // ---------- Sudoku daily ----------
  await nav("/games/sudoku/?daily=1");
  const S0 = JSON.parse(await ev(`JSON.stringify({ chip: document.getElementById("dlyChip")?.textContent, menu: document.getElementById("ovMenu").hidden, diff: __game.state.diff, seed: __game.state.seed, dseed: __game.daily.seed, clues: __game.state.clues })`));
  check("Sudoku daily: nhãn, vào thẳng đề Vừa theo hạt ngày", S0.chip === `★ Thử thách #${day}` && S0.menu && S0.diff === "vua" && S0.seed === S0.dseed, JSON.stringify(S0));
  // điền 1 ô sai rồi giải hết
  await ev(`(() => { const g = __game, s = g.state; const i = s.cells.findIndex(v => v === 0); g.select(i); g.input((s.solution[i] % 9) + 1); g.erase(); })()`);
  await nav("/games/sudoku/?daily=1"); // tiến độ giữ qua tải lại (kể cả số lỗi)
  const keep = await ev(`__game.state.mistakes`);
  check("Sudoku daily: tải lại giữ tiến độ (số lỗi = 1)", keep === 1, String(keep));
  await ev(`(() => { const g = __game, s = g.state; for (let i = 0; i < 81; i++) if (s.cells[i] !== s.solution[i]) { g.select(i); g.input(s.solution[i]); } })()`);
  await sleep(1300);
  const SP = JSON.parse(await ev(`JSON.stringify({ ov: !document.getElementById("dlyOv")?.hidden, grid: document.getElementById("dlyGrid")?.textContent, title: document.getElementById("dlyTitle")?.textContent, win: document.getElementById("ovWin").hidden })`));
  check("Sudoku daily: giải xong ⇒ bảng kết quả thanh thời gian, có lỗi nên không ⭐", SP.ov && /^⏱️🟩.* \d+:\d\d$/.test(SP.grid) && !SP.grid.includes("⭐") && SP.win, JSON.stringify(SP));
  await shot("sudoku-ket-qua-1366.png");
  await nav("/games/sudoku/?daily=1");
  check("Sudoku daily: mở lại ⇒ khoá (bàn đã giải, không nhập được)", await ev(`!document.getElementById("dlyOv").hidden && __game.input(5) === false && __game.state.status === "won"`));

  // ---------- 2048 daily ----------
  await nav("/games/2048/?daily=1");
  const T0 = JSON.parse(await ev(`JSON.stringify({ chip: document.getElementById("dlyChip")?.textContent, undo: __game.state.undoLeft, board: __game.state.cells.map(c => c ? c.v : 0).join(","), moves: document.getElementById("hMoves").textContent })`));
  check("2048 daily: nhãn, không hoàn tác, đếm nước x/150", T0.chip === `★ Thử thách #${day}` && T0.undo === 0 && T0.moves === "0/150", JSON.stringify(T0));
  await ev(`(async () => { const d = ["left","down","right","down"]; for (let i = 0; i < 20; i++) { __game.move(d[i % 4]) || __game.move("up"); await new Promise(r => setTimeout(r, 15)); } })()`);
  const mid = await ev(`JSON.stringify({ b: __game.state.cells.map(c => c ? c.v : 0).join(","), m: __game.state.moves, sc: __game.state.score })`);
  await nav("/games/2048/?daily=1");
  const mid2 = await ev(`JSON.stringify({ b: __game.state.cells.map(c => c ? c.v : 0).join(","), m: __game.state.moves, sc: __game.state.score })`);
  check("2048 daily: tải lại giữ đúng bàn / nước / điểm", mid === mid2, mid);
  await ev(`(async () => { const d = ["left","down","right","down"]; for (let i = 0; i < 400 && __game.state.status === "playing"; i++) { __game.move(d[i % 4]) || __game.move("up") || __game.move("right"); await new Promise(r => setTimeout(r, 5)); } })()`);
  await sleep(1400);
  const TP = JSON.parse(await ev(`JSON.stringify({ ov: !document.getElementById("dlyOv")?.hidden, grid: document.getElementById("dlyGrid")?.textContent, title: document.getElementById("dlyTitle")?.textContent, moves: __game.state.moves, end: document.getElementById("ovEnd").hidden })`));
  check("2048 daily: hết lượt (≤150 nước) ⇒ bảng kết quả hàng mốc ô", TP.ov && TP.moves <= 150 && /^[🟦🟩🟪🟧🟨⬜]+$/u.test(TP.grid) && TP.end, JSON.stringify(TP));
  await view(390, 844, true); await sleep(300);
  await shot("2048-ket-qua-390.png");
  await view(1366, 768, false);

  // ---------- Bản lưu chế độ thường không bị đụng ----------
  const normalAfter = await ev(`JSON.stringify(["wgp.sudoku.v1","wgp.2048.v1","wgp.dovuinhanh.v1"].map(k=>localStorage.getItem(k)))`);
  check("bản lưu chế độ thường (Sudoku / 2048 / Đố Vui) giữ nguyên sau khi chơi daily", normalAfter === normalBefore, normalAfter);
  await nav("/games/sudoku/");
  check("Sudoku thường vẫn mở menu bình thường + có link thử thách đã xong", await ev(`!document.getElementById("ovMenu").hidden && !document.getElementById("dlyChip") && document.getElementById("dailyLink").textContent.includes("đã xong")`));
  await nav("/games/2048/");
  check("2048 thường vẫn mở menu bình thường", await ev(`!document.getElementById("ovMenu").hidden && !document.body.classList.contains("is-daily")`));
  await nav("/games/do-vui-nhanh/");
  check("Đố Vui thường: menu + ván 10 câu như cũ", await ev(`(() => { document.getElementById("playBtn").click(); return __game.state.qs.length === 10 && document.getElementById("qNo").textContent === "CÂU 1/10"; })()`));

  // ---------- Trang chủ sau khi chơi ----------
  for (const [w, h, m, name] of [[1366, 768, false, "trang-chu-1366.png"], [390, 844, true, "trang-chu-390.png"]]) {
    await view(w, h, m);
    await nav("/homepage/");
    const R = JSON.parse(await ev(`JSON.stringify((() => {
      const cards = [...document.querySelectorAll(".dcard")];
      const sec = document.getElementById("daily").getBoundingClientRect(), g = document.getElementById("gamesTitle").getBoundingClientRect();
      return { cards: cards.map(c => c.dataset.game + ":" + c.querySelector(".dcard__go").textContent.trim()), secH: Math.round(sec.height), secTop: Math.round(sec.top + scrollY),
        gamesTop: Math.round(g.top + scrollY), cardH: Math.round(cards[0].getBoundingClientRect().height),
        rowScroll: document.getElementById("dailyCards").scrollWidth > document.getElementById("dailyCards").clientWidth };
    })())`));
    check(`trang chủ ${w}×${h}: cả 3 thẻ 'Đã xong ✓'`, R.cards.every((c) => c.includes("Đã xong ✓")), R.cards.join(" | "));
    check(`trang chủ ${w}×${h}: không tràn ngang trang`, await noHScroll());
    await ev(`document.getElementById("daily").scrollIntoView({ block: "center" })`); await sleep(200);
    const hits = await hitOk(".dcard");
    check(`trang chủ ${w}×${h}: thẻ trong khung nhìn không bị che (elementFromPoint)`, hits.length >= (m ? 1 : 3) && hits.every(Boolean), JSON.stringify(hits));
    console.log(`  khu thử thách cao ${R.secH}px (thẻ ${R.cardH}px), 'Tất cả game' ở y=${R.gamesTop}px${m ? ", dải thẻ cuộn ngang: " + R.rowScroll : ""}`);
    if (m) check("trang chủ 390: khu thử thách gọn (≤ 160px)", R.secH <= 160, R.secH + "px");
    await ev(`scrollTo(0, 0)`); await sleep(150);
    await shot(name);
    await ev(`scrollTo(0, document.getElementById("daily").getBoundingClientRect().top + scrollY - (document.querySelector(".topbar")?.offsetHeight || 0) - 12)`); await sleep(200);
    await shot(name.replace(".png", "-khu.png"));
  }
  check("không có lỗi JS trên trang", errors.length === 0, errors.join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + e.message); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
done(fails ? 1 : 0);
