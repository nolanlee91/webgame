// e2e "Bảng xếp hạng hôm nay": HAI người chơi (2 hồ sơ Chrome riêng, máy chủ chế độ RAM + x-dev-user) chơi cả 3 thử thách
// bằng giao diện thật (bấm đáp án, bấm ô + bàn số, phím mũi tên), thấy nhau trên bảng đúng thứ tự, thấy "Hạng #N/M" trên trang Bảng xếp hạng.
// D3: không còn hỏi tên — mỗi người có tên tự sinh (account.js getName) gửi thẳng; A đổi tên bằng nút "Đổi tên" (kiểm 2–16 ký tự ở máy).
// Người A: máy tính 1366×768 (chuột). Người B: điện thoại 390×844 (chạm).
// Chạy: node prototype/games/_shared/test/daily-board-e2e.mjs <thư-mục-ảnh>   (tự bật server.js ở cổng 8897)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { REPO, sleep, launchChrome } from "./cdp.mjs";
import { shotDir, guardServer } from "./lk-temp.mjs";

const OUT = path.resolve(process.argv[2] || shotDir("daily-board"));
mkdirSync(OUT, { recursive: true });
const PORT = Number(process.env.E2E_PORT) || 8897, BASE = `http://127.0.0.1:${PORT}`;
const env = { ...process.env, PORT: String(PORT), DAILY_SUDOKU_MIN_SEC: "0" };
for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RAILWAY_ENVIRONMENT", "RAILWAY_PROJECT_ID", "NODE_ENV", "DAILY_BOARD"]) delete env[k];
const server = guardServer(spawn(process.execPath, ["server.js"], { cwd: REPO, env, stdio: "ignore" })); // tắt cùng test, kể cả khi bị giết cứng
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
for (let i = 0; i < 120; i++) { try { if ((await fetch(BASE + "/healthz")).ok) break; } catch {} await sleep(250); }
const chrome = await launchChrome("daily-board");
const finish = (code) => { try { chrome.close(); } catch {} try { server.kill(); } catch {} setTimeout(() => process.exit(code), 900); };

const shot = async (tab, name) => { const f = path.join(OUT, name); await tab.shot(f); console.log("  ảnh: " + f); };
const noHScroll = (tab) => tab.ev(`document.documentElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1`);
/** Mở trang và chờ trang MỚI tải xong (không lẫn trang cũ cùng URL). */
async function nav(tab, url) {
  try { await tab.ev("window.__oldPage = 1"); } catch {}
  await tab.cmd("Page.navigate", { url: BASE + url });
  await tab.waitFor(`!window.__oldPage && document.readyState === "complete"`, 30000);
}
const boardState = (tab) => tab.ev(`document.getElementById("dlyLb")?.dataset.state || ""`);
const readBoard = (tab) => tab.ev(`JSON.stringify({ state: document.getElementById("dlyLb")?.dataset.state, hidden: document.getElementById("dlyLb")?.hidden,
  count: document.getElementById("dlyLbCount")?.textContent, me: document.getElementById("dlyLbMe")?.textContent,
  rows: [...document.querySelectorAll("#dlyLbList .dly-lb__row")].map(li => ({ r: li.querySelector(".dly-lb__rank").textContent, n: li.querySelector(".dly-lb__name").textContent, s: li.querySelector(".dly-lb__score").textContent, you: li.classList.contains("is-you") })),
  fits: (() => { const b = document.getElementById("dlyLb"); return !b || b.scrollWidth <= b.clientWidth + 1; })() })`).then(JSON.parse);

// ---------- Cách chơi bằng giao diện thật ----------
async function playQuiz(tab, oks, touch) {
  await nav(tab, "/games/do-vui-nhanh/?daily=1");
  await tab.waitFor(`window.__game && __game.state && __game.state.phase === "ask"`);
  for (let k = 0; k < oks.length; k++) {
    await tab.waitFor(`__game.state.i === ${k} && __game.state.phase === "ask" && !document.querySelector(".ans").disabled`);
    const pick = await tab.ev(`(() => { const q = __game.state.qs[__game.state.i]; return ${oks[k]} ? q.correct : (q.correct + 1) % 4; })()`);
    await tab.click(`.ans[data-i="${pick}"]`, { touch });
    await tab.waitFor(`!document.getElementById("nextBtn").hidden`);
    await tab.click("#nextBtn", { touch });
  }
  await tab.waitFor(`document.getElementById("dlyOv") && !document.getElementById("dlyOv").hidden`);
}
async function playSudoku(tab, touch, { mistake = false } = {}) {
  await nav(tab, "/games/sudoku/?daily=1");
  await tab.waitFor(`window.__game && __game.state && __game.state.status === "playing"`);
  const todo = JSON.parse(await tab.ev(`JSON.stringify(__game.state.cells.map((v, i) => [i, __game.state.solution[i], v]).filter(([i, s, v]) => v !== s).map(([i, s]) => [i, s]))`));
  if (mistake) {
    const [i, d] = todo[0];
    await tab.click(`.cell[data-i="${i}"]`, { touch });
    await tab.click(`#pad button[data-d="${(d % 9) + 1}"]`, { touch });
  }
  for (const [i, d] of todo) {
    await tab.click(`.cell[data-i="${i}"]`, { touch });
    await tab.click(`#pad button[data-d="${d}"]`, { touch });
  }
  await tab.waitFor(`document.getElementById("dlyOv") && !document.getElementById("dlyOv").hidden`, 20000);
}
const KEYS = { left: ["ArrowLeft", 37], right: ["ArrowRight", 39], up: ["ArrowUp", 38], down: ["ArrowDown", 40] };
async function play2048(tab, order) {
  await nav(tab, "/games/2048/?daily=1");
  await tab.waitFor(`window.__game && __game.state && __game.state.status === "playing"`);
  for (let n = 0; n < 200; n++) {
    const st = JSON.parse(await tab.ev(`JSON.stringify({ m: __game.state.moves, st: __game.state.status, c: __game.state.cells.map(c => c ? c.v : 0) })`));
    if (st.st !== "playing") break;
    // hướng đầu tiên trong thứ tự làm bàn đổi (tính từ bàn hiện tại)
    const ok = (dir) => { const c = st.c; for (let a = 0; a < 4; a++) { const line = []; for (let b = 0; b < 4; b++) { const [x, y] = dir === "left" ? [b, a] : dir === "right" ? [3 - b, a] : dir === "up" ? [a, b] : [a, 3 - b]; line.push(c[y * 4 + x]); }
      for (let b = 1; b < 4; b++) if (line[b] && (!line[b - 1] || line[b - 1] === line[b])) return true; } return false; };
    const dir = order.find(ok);
    if (!dir) break;
    const [key, code] = KEYS[dir];
    await tab.cmd("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: code });
    await tab.cmd("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: code });
    await tab.waitFor(`__game.state.moves > ${st.m} || __game.state.status !== "playing"`, 5000);
  }
  await tab.waitFor(`document.getElementById("dlyOv") && !document.getElementById("dlyOv").hidden`, 20000);
}
async function typeName(tab, name, touch) {
  await tab.waitFor(`document.getElementById("dlyLb")?.dataset.state === "rename"`);
  await tab.click("#dlyName", { touch });
  await tab.ev(`document.getElementById("dlyName").select()`);
  await tab.cmd("Input.insertText", { text: name });
  await tab.click("#dlyNameOk", { touch });
}
const waitBoard = (tab) => tab.waitFor(`["board", "error", "off"].includes(document.getElementById("dlyLb")?.dataset.state)`, 20000);

try {
  const ctxA = await chrome.newContext(), ctxB = await chrome.newContext();
  const A = await chrome.newTab("A", 1366, 768, false, ctxA);
  const B = await chrome.newTab("B", 390, 844, true, ctxB);
  const cfg = await (await fetch(BASE + "/api/config")).json();
  check("máy chủ chế độ RAM (không có Supabase) ⇒ /api/config board:'memory'", cfg.board === "memory" && cfg.supabase === false, JSON.stringify(cfg));

  // ---------- Đố Vui: A 5/5 (tên tự sinh ⇒ đổi tên bằng nút "Đổi tên"), B 4/5 (giữ tên tự sinh) ----------
  await playQuiz(A, [true, true, true, true, true], false);
  await waitBoard(A);
  let a = await readBoard(A);
  const genA = await A.ev(`JSON.parse(localStorage.getItem("wgp.account.v1")).name`);
  check("A Đố Vui: KHÔNG hỏi tên — gửi thẳng bằng tên tự sinh, bảng có mình #1",
    a.state === "board" && a.rows.length === 1 && a.rows[0].n === genA && /^[\p{L} ]+ \d\d$/u.test(genA) && a.rows[0].r === "#1" && a.rows[0].you && a.count === "1 người đã chơi", JSON.stringify(a) + " tên=" + genA);
  await A.click("#dlyLbRename");
  await typeName(A, "a", false);
  const errA = await A.ev(`document.getElementById("dlyNameErr")?.textContent || ""`);
  check("HOME-15: đổi tên 1 ký tự ⇒ báo lỗi rõ ở máy, không gửi", errA === "Tên cần ít nhất 2 ký tự." && (await boardState(A)) === "rename", errA);
  await shot(A, "bxh-doi-ten-loi-1366.png");
  await typeName(A, "  Anh   Tuấn  ", false);
  await waitBoard(A);
  a = await readBoard(A);
  check("A đổi tên: bảng hiện 'Anh Tuấn' (đã gộp khoảng trắng), tên chung trên máy đổi theo",
    a.state === "board" && a.rows.length === 1 && a.rows[0].n === "Anh Tuấn" && a.rows[0].you && (await A.ev(`JSON.parse(localStorage.getItem("wgp.account.v1")).name`)) === "Anh Tuấn", JSON.stringify(a));
  await playQuiz(B, [true, true, false, true, true], true);
  await waitBoard(B);
  let b = await readBoard(B);
  const genB = await B.ev(`JSON.parse(localStorage.getItem("wgp.account.v1")).name`);
  check("B Đố Vui: tên tự sinh (không phải 'Người chơi'); thứ tự A (5/5) trên B (4/5); '2 người đã chơi'",
    b.state === "board" && b.rows.map((r) => r.r + " " + r.n + " " + r.s).join(" | ") === `#1 Anh Tuấn 5/5 | #2 ${genB} 4/5` && genB !== "Người chơi"
    && b.rows[1].you && !b.rows[0].you && b.count === "2 người đã chơi" && /hạng #2 \/ 2/.test(b.me), JSON.stringify(b));
  check("B: có link 'Xem bảng xếp hạng đầy đủ' tới trang riêng", (await B.ev(`document.getElementById("dlyLbMore")?.getAttribute("href")`)) === "../../homepage/bang-xep-hang.html?game=do-vui-nhanh");
  check("B Đố Vui 390: bảng xếp hạng vừa khung, không tràn ngang trang", b.fits && (await noHScroll(B)));
  check("B Đố Vui 390: nút Khoe kết quả vẫn bấm được (không bị che)", await B.click("#dlyShare", { touch: true }));
  await B.ev(`document.getElementById("dlyLb").scrollIntoView({ block: "center" })`);
  await shot(B, "bxh-do-vui-390.png");
  // A mở lại ⇒ không gửi lại, thấy B
  await nav(A, "/games/do-vui-nhanh/?daily=1");
  await waitBoard(A);
  a = await readBoard(A);
  check("A mở lại Đố Vui: khoá + bảng có cả 2 người, A vẫn #1", a.rows.length === 2 && a.rows[0].n === "Anh Tuấn" && a.rows[0].you && a.count === "2 người đã chơi", JSON.stringify(a));
  await shot(A, "bxh-do-vui-1366.png");

  // ---------- Sudoku: A có 1 lỗi (+30 giây), B không lỗi ⇒ B #1 ----------
  await playSudoku(A, false, { mistake: true });
  check("A Sudoku: tự gửi bằng tên chung 'Anh Tuấn'", await A.waitFor(`document.getElementById("dlyLb")?.dataset.state !== "rename"`, 3000).catch(() => false));
  await waitBoard(A);
  await playSudoku(B, true);
  await waitBoard(B);
  b = await readBoard(B);
  const sres = JSON.parse(await B.ev(`localStorage.getItem("wgp.daily.v1")`)).games.sudoku;
  check("Sudoku: B (không lỗi) #1, A (1 lỗi, +30 giây) #2", b.rows.length === 2 && b.rows[0].n === genB && b.rows[0].you && b.rows[1].n === "Anh Tuấn", JSON.stringify(b.rows) + " B=" + JSON.stringify(Object.values(sres.days)[0]?.time));
  check("Sudoku 390: không tràn ngang", b.fits && (await noHScroll(B)));
  await B.ev(`document.getElementById("dlyLb").scrollIntoView({ block: "center" })`);
  await shot(B, "bxh-sudoku-390.png");

  // ---------- 2048: hai chiến thuật khác nhau, bảng theo điểm máy chủ tính ----------
  await play2048(A, ["left", "down", "right", "up"]);
  await waitBoard(A);
  await play2048(B, ["up", "right", "left", "down"]);
  await waitBoard(B);
  b = await readBoard(B);
  const scoreA = await A.ev(`__game.state.score`), scoreB = await B.ev(`__game.state.score`);
  const want = scoreA >= scoreB ? ["Anh Tuấn", genB] : [genB, "Anh Tuấn"];
  const api2048 = await (await fetch(`${BASE}/api/daily/2048/${await B.ev("__game.daily.day")}`)).json();
  check("2048: máy chủ phát lại ra đúng điểm trong game của cả hai", api2048.top.map((e) => e.score).sort((x, y) => x - y).join() === [scoreA, scoreB].sort((x, y) => x - y).join(), JSON.stringify(api2048.top) + ` A=${scoreA} B=${scoreB}`);
  check("2048: thứ tự theo điểm (cao trên)", b.rows.map((r) => r.n).join() === want.join(), JSON.stringify(b.rows) + ` A=${scoreA} B=${scoreB}`);
  await A.ev(`document.getElementById("dlyLb").scrollIntoView({ block: "center" })`);
  await shot(A, "bxh-2048-1366.png");

  // ---------- Mất kết nối bảng: kết quả + Khoe vẫn dùng được ----------
  await B.cmd("Network.enable");
  await B.cmd("Network.setBlockedURLs", { urls: ["*/api/daily/*"] });
  const errsBefore = B.errors.length;
  await nav(B, "/games/2048/?daily=1");
  await B.waitFor(`document.getElementById("dlyLb")?.dataset.state === "error"`, 20000);
  const off = JSON.parse(await B.ev(`JSON.stringify({ msg: document.querySelector("#dlyLb .dly-lb__msg")?.textContent, retry: !!document.getElementById("dlyLbRetry"), grid: document.getElementById("dlyGrid").textContent })`));
  check("mất kết nối: 'Chưa kết nối được bảng xếp hạng.' + nút Thử lại, ô kết quả vẫn có", /Chưa kết nối được bảng xếp hạng/.test(off.msg) && off.retry && off.grid.length > 0, JSON.stringify(off));
  check("mất kết nối: nút Khoe kết quả vẫn bấm được", await B.click("#dlyShare", { touch: true }));
  await shot(B, "bxh-mat-ket-noi-390.png");
  await B.cmd("Network.setBlockedURLs", { urls: [] });
  await B.click("#dlyLbRetry", { touch: true });
  await waitBoard(B);
  check("Thử lại sau khi có mạng ⇒ hiện bảng", (await boardState(B)) === "board");
  B.errors.splice(errsBefore); // lỗi "bị chặn" do test tự gây ra

  // ---------- Trang Bảng xếp hạng: "Hạng #N/M" trên thẻ thử thách + bảng tô dòng của mình ----------
  const expRank = { A: { "do-vui-nhanh": 1, sudoku: 2, "2048": want[0] === "Anh Tuấn" ? 1 : 2 }, B: { "do-vui-nhanh": 2, sudoku: 1, "2048": want[0] === genB ? 1 : 2 } };
  for (const [who, tab, file] of [["A", A, "bxh-trang-rieng-1366.png"], ["B", B, "bxh-trang-rieng-390.png"]]) {
    await nav(tab, "/homepage/bang-xep-hang.html?game=do-vui-nhanh");
    await tab.waitFor(`document.querySelectorAll(".dcard__rank").length === 3`, 15000).catch(() => {});
    const R = JSON.parse(await tab.ev(`JSON.stringify(Object.fromEntries([...document.querySelectorAll(".dcard")].map(c => [c.dataset.game, c.querySelector(".dcard__rank")?.textContent || ""])))`));
    const ok = Object.entries(expRank[who]).every(([g, r]) => R[g] === `🏆 Hạng #${r}/2`);
    check(`trang Bảng xếp hạng ${who}: thẻ thử thách hiện 'Hạng #N/2' đúng cả 3 game`, ok, JSON.stringify(R));
    check(`trang Bảng xếp hạng ${who}: không tràn ngang`, await noHScroll(tab));
    await tab.waitFor(`document.getElementById("lbPanel").dataset.state === "board"`, 15000);
    const me = JSON.parse(await tab.ev(`JSON.stringify([...document.querySelectorAll("#lbList .lb__row")].map(r => ({ n: r.querySelector(".lb__name").firstChild.textContent.trim(), you: r.classList.contains("is-you") })))`));
    const myName = who === "A" ? "Anh Tuấn" : genB;
    check(`trang Bảng xếp hạng ${who}: tab Đố Vui, dòng của mình được tô`, me.length === 2 && me.filter((x) => x.you).map((x) => x.n).join() === myName, JSON.stringify(me));
    await tab.ev(`document.getElementById("bang").scrollIntoView({ block: "start" })`);
    await sleep(150);
    await shot(tab, file);
  }
  // trang chủ không gọi API khi chưa xong game nào (hồ sơ mới)
  const ctxC = await chrome.newContext();
  const C = await chrome.newTab("C", 1366, 768, false, ctxC);
  await C.cmd("Network.enable");
  const reqs = [];
  C.ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Network.requestWillBeSent") reqs.push(m.params.request.url); });
  await nav(C, "/homepage/");
  await sleep(1500);
  check("trang chủ người mới: không gọi API bảng (ô hồ sơ chỉ đọc tên trên máy)", !reqs.some((u) => /\/api\/daily|\/api\/config/.test(u)), reqs.filter((u) => /api|account/.test(u)).join(" "));
  const nameC = await C.ev(`document.getElementById("meName").textContent`);
  check("trang chủ người mới: ô hồ sơ có tên tự sinh ngay", /^[\p{L} ]+ \d\d$/u.test(nameC), nameC);

  check("không có lỗi JS / console error (A, B, C)", !A.errors.length && !B.errors.length && !C.errors.length, [...A.errors, ...B.errors, ...C.errors].join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + (e && e.stack || e)); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
finish(fails ? 1 : 0);
