// e2e Đợt 5 trang chủ (docs/audits/fixes/D5-home.md): tab sảnh "Phòng chờ / Đang diễn ra" + "N người đang chơi" chỉ khi đủ đông (P-F),
// thẻ Tài trợ ẩn tới khi có link https:// (HOME-11), màn đầu điện thoại xoay ngang thấy dải game (hero thu thấp), dọc / máy tính không đổi.
// Chạy: node prototype/games/_shared/test/home-d5-e2e.mjs [thư-mục-ảnh]   (tự bật server.js trong tiến trình, cổng ngẫu nhiên)
// /api/lobby giả bằng cách thay window.fetch trước khi trang chạy (máy chủ thật trả về rỗng khi không ai chơi).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { startServer, launchChrome, sleep } from "./cdp.mjs";
import { shotDir } from "./lk-temp.mjs";

const OUT = path.resolve(process.argv[2] || shotDir("home-d5"));
mkdirSync(OUT, { recursive: true });
for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RAILWAY_ENVIRONMENT", "RAILWAY_PROJECT_ID", "NODE_ENV", "DAILY_BOARD"]) delete process.env[k];
const { server, base } = await startServer();
const chrome = await launchChrome("home-d5");
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
const shot = async (t, name) => { const f = path.join(OUT, name); await t.shot(f); console.log("  ảnh: " + f); };
const noHScroll = (t) => t.ev(`document.documentElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1`);
const tabs = [];
const mockLobby = (data) => `(() => { const real = window.fetch.bind(window), body = ${JSON.stringify(JSON.stringify(data))};
  window.fetch = (u, o) => String(u).endsWith("/api/lobby") ? Promise.resolve(new Response(body, { status: 200, headers: { "Content-Type": "application/json" } })) : real(u, o); })()`;
async function open(name, w, h, mobile, lobby = null) {
  const ctx = await chrome.newContext();
  const t = await chrome.newTab(name, w, h, mobile, ctx);
  tabs.push(t);
  if (lobby) await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: mockLobby(lobby) });
  await t.go(base + "/homepage/");
  await t.waitFor(`!document.getElementById("lobby").classList.contains("is-loading")`);
  await sleep(300);
  return t;
}
const ROOMS = [{ game: "co-caro", code: "ABCDE", host: "Mèo 12", have: 1, max: 2 }];
const LIVE = [{ game: "ma-soi", rooms: 2, n: 11 }, { game: "co-caro", rooms: 3, n: 6 }, { game: "khong-co", rooms: 1, n: 2 }];

try {
  // ---------- P-F: tab sảnh ----------
  const A = await open("tab-dong", 1366, 768, false, { rooms: ROOMS, players: 1234, playing: LIVE });
  const s1 = JSON.parse(await A.ev(`JSON.stringify({ tabs: [...document.querySelectorAll(".ltab")].map(b => b.textContent.replace(/\\s+/g, " ").trim() + ":" + b.getAttribute("aria-selected")),
    wait: !document.getElementById("rooms").hidden, live: !document.getElementById("liveRooms").hidden, rooms: document.querySelectorAll("#rooms .room").length,
    online: document.getElementById("lobbyOnline").hidden ? "" : document.getElementById("lobbyOnline").textContent, h: Math.min(...[...document.querySelectorAll(".ltab")].map(b => b.getBoundingClientRect().height)) })`));
  check("P-F: 2 tab 'Phòng chờ 1' (đang chọn) / 'Đang diễn ra 5', cao ≥ 44 px", s1.tabs.join("|") === "Phòng chờ 1:true|Đang diễn ra 5:false" && s1.wait && !s1.live && s1.rooms === 1 && s1.h >= 44, JSON.stringify(s1));
  check("P-F: đủ đông (1234 ≥ 20) ⇒ hiện '1.234 người đang chơi'", s1.online === "1.234 người đang chơi", s1.online);
  await A.ev(`document.getElementById("ltabLive").click()`); await sleep(100);
  const s2 = JSON.parse(await A.ev(`JSON.stringify({ sel: document.getElementById("ltabLive").getAttribute("aria-selected"), wait: !document.getElementById("rooms").hidden,
    items: [...document.querySelectorAll("#liveRooms .room")].map(r => r.querySelector(".room__name").textContent + "/" + r.querySelector(".room__host").textContent + "/" + r.querySelector(".room__cnt").textContent + "/" + r.querySelector("a").getAttribute("href")) })`));
  check("P-F: bấm 'Đang diễn ra' ⇒ mỗi game 1 dòng (số bàn, số người, nút Chơi mở game), bỏ game lạ", s2.sel === "true" && !s2.wait && s2.items.length === 2 && /Ma Sói\/2 bàn đang chơi\/11 người\//.test(s2.items[0]) && /Cờ Caro\/3 bàn/.test(s2.items[1]), JSON.stringify(s2));
  await A.ev(`document.getElementById("ltabLive").focus()`);
  await A.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 }); await A.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await sleep(100);
  check("P-F: phím ← về 'Phòng chờ' (ARIA tabs, chỉ tab đang chọn nhận Tab)", await A.ev(`document.activeElement.id === "ltabWait" && document.getElementById("ltabWait").getAttribute("aria-selected") === "true" && document.getElementById("ltabLive").tabIndex === -1`));
  await A.ev(`document.getElementById("lobby").scrollIntoView()`); await shot(A, "sanh-tab-1366.png");

  const B = await open("tab-vang", 1366, 768, false, { rooms: [], players: 7, playing: [{ game: "co-caro", rooms: 1, n: 2 }] });
  const s3 = JSON.parse(await B.ev(`JSON.stringify({ online: document.getElementById("lobbyOnline").hidden, sel: document.getElementById("ltabLive").getAttribute("aria-selected"), n: document.querySelectorAll("#liveRooms .room").length, empty: document.getElementById("lobby").classList.contains("is-empty"), tabsShown: !!document.querySelector(".ltabs").getBoundingClientRect().height })`));
  check("P-F: sảnh vắng (7 người) ⇒ KHÔNG hiện số người; không phòng chờ mà có ván ⇒ mở sẵn 'Đang diễn ra'", s3.online && s3.sel === "true" && s3.n === 1 && !s3.empty && s3.tabsShown, JSON.stringify(s3));

  const C = await open("tab-rong", 1366, 768, false, { rooms: [] });
  check("P-F: máy chủ cũ (chỉ có rooms) / không ai chơi ⇒ sảnh trống có lời nhắn + nút Tạo phòng (D9: bỏ 'Mở phòng nhanh'), không số người, không lỗi", await C.ev(`document.getElementById("lobby").classList.contains("is-empty") && document.getElementById("lobbyOnline").hidden && !document.getElementById("lobbyEmpty").hidden && /Tạo phòng/.test(document.getElementById("createRoom2").textContent) && !document.querySelector(".quick__item, #quickTitle, #quickGrid")`));

  // ---------- HOME-11: thẻ Tài trợ ----------
  const sp = (t) => t.ev(`(() => { const s = document.querySelector("#grid .tile--sponsor"); return s ? s.tagName + "|" + s.getAttribute("href") + "|" + s.getAttribute("rel") : ""; })()`);
  check("HOME-11: SPONSOR.url trống ⇒ không có thẻ Tài trợ", (await sp(C)) === "");
  const rer = (t, u) => t.ev(`(() => { window.SPONSOR.url = ${JSON.stringify(u)}; document.querySelector('#chips .tab[data-cat="all"]').click(); })()`);
  for (const u of ["#", "http://speakup.vn", "javascript:alert(1)", "https://", "  "]) { await rer(C, u); check(`HOME-11: url ${JSON.stringify(u)} ⇒ vẫn ẩn`, (await sp(C)) === ""); }
  await rer(C, "https://speakup.example/kids");
  check("HOME-11: điền link https:// ⇒ thẻ tự hiện, là link tab mới rel=sponsored", (await sp(C)) === "A|https://speakup.example/kids|sponsored noopener");

  // ---------- Màn đầu điện thoại xoay ngang ----------
  for (const [w, h] of [[844, 390], [740, 360]]) {
    const L = await open(`ngang-${w}`, w, h, true, { rooms: [] });
    await sleep(500);
    const m = JSON.parse(await L.ev(`JSON.stringify((() => { const r = (s) => document.querySelector(s).getBoundingClientRect();
      const qp = [...document.querySelectorAll("#qpRow .card")].filter(e => { const q = e.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 && q.right <= innerWidth; });
      const hit = (s) => { const e = document.querySelector(s), q = e.getBoundingClientRect(), x = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !!x && (x === e || e.contains(x)); };
      return { hero: Math.round(r(".hero").height), heroFrac: +(r(".hero").height / innerHeight).toFixed(2), qp: qp.length, sticky: getComputedStyle(document.querySelector(".topbar")).position,
        play: hit(".slide .btn"), dot: Math.round(r(".hero__dot").height), nav: Math.round(r("#heroNext").height) }; })())`));
    check(`ngang ${w}×${h}: slide ≤ 35% chiều cao, thấy trọn ≥ 5 game 'Chơi ngay' trong màn đầu`, m.heroFrac <= 0.35 && m.qp >= 5, JSON.stringify(m));
    check(`ngang ${w}×${h}: thanh trên không dính, nút Chơi ngay bấm được, chấm / mũi tên ≥ 44 px, không tràn ngang`, m.sticky === "static" && m.play && m.dot >= 44 && m.nav >= 44 && (await noHScroll(L)), JSON.stringify(m));
    await shot(L, `man-dau-${w}x${h}.png`);
  }
  // dọc + máy tính: không đổi
  const P = await open("doc-390", 390, 844, true, { rooms: [] });
  const pm = JSON.parse(await P.ev(`JSON.stringify({ hero: Math.round(document.querySelector(".hero").getBoundingClientRect().height), rows: getComputedStyle(document.getElementById("qpRow")).gridTemplateRows.split(" ").length, text: getComputedStyle(document.querySelector(".hero__info")).paddingBottom })`));
  check("dọc 390×844: slide + dải Chơi ngay 2 hàng như D3", pm.hero === 152 && pm.rows === 2, JSON.stringify(pm));
  const Dk = await open("may-tinh", 1366, 768, false, { rooms: [] });
  const dm = JSON.parse(await Dk.ev(`JSON.stringify({ hero: Math.round(document.querySelector(".hero").getBoundingClientRect().height), qp: getComputedStyle(document.getElementById("quickPlay")).display, sticky: getComputedStyle(document.querySelector(".topbar")).position })`));
  check("máy tính 1366×768: slide 470 px, không có dải Chơi ngay, thanh trên dính như cũ", dm.hero === 470 && dm.qp === "none" && dm.sticky === "sticky", JSON.stringify(dm));

  const errs = tabs.flatMap((t) => t.errors.map((e) => t.name + ": " + e)).filter((e) => !/ws\//.test(e));
  check("không có lỗi JS / console error", !errs.length, errs.join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + (e && e.stack || e)); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
try { chrome.close(); } catch {}
server.close();
setTimeout(() => process.exit(fails ? 1 : 0), 800);
