// E2E "Tắt chat" (wgp.chatOff) cho 10 game online, trên Chrome headless thật.
// Chạy: PORT=8922 node server.js (ở gốc repo), rồi: node prototype/games/_shared/test/chat-off-e2e.mjs [thư-mục-ảnh] [game,game…]
// Mỗi game × 2 khung (390×844 cảm ứng, 1366×768): A tạo phòng (mặc định công khai ⇒ có trong /api/lobby), B vào bằng mã,
// B bấm "Tắt chat" ⇒ ô nhập khoá, tin của A không hiện (không toast, không tiếng); A vẫn chat; tải lại ⇒ vẫn tắt; "Bật lại" ⇒ thấy tin.
// Thêm (khung rộng): tick "Phòng kín" ⇒ phòng không có trong /api/lobby.
import { launchChrome, sleep } from "./cdp.mjs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { shotDir } from "./lk-temp.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:8922";
const OUT = process.argv[2] || shotDir("chat-off");
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
mkdirSync(OUT, { recursive: true });

const CHESS = (id, extra = {}) => ({ id, name: "#nameIn", priv: "#privateRoom", create: ["#createBtn"], code: "#rCode", codeIn: "#codeIn", join: "#joinBtn",
  chatIn: "#chatIn", chatForm: "#chatF", openChat: "#chatBtn", closeChat: "#chatX", ...extra });
const GAMES = [
  CHESS("co-caro", { create: ["#createBtn", "#createRoomBtn"] }),
  CHESS("co-vua"),
  CHESS("co-tuong"),
  CHESS("o-an-quan", { create: ["#createBtn", "#createRoomBtn"] }),
  { id: "noi-tu", name: "#oName", priv: "#privateRoom", create: ["#createBtn"], code: "#lCode", codeIn: "#oCode", join: "#enterBtn",
    chatIn: "#chatInp", chatForm: "#chatForm", openChat: "#chatBtn", closeChat: "#chatClose", leave: "#leaveBtn" }, // máy chủ Nối Từ giữ phòng 5 phút, tối đa 4 phòng/IP ⇒ rời hẳn sau mỗi lượt
  { id: "co-ca-ngua", name: "#cnName", priv: "#privateRoom", create: ['[data-e="create"]'], code: ".cn-lobby .code", codeIn: "#cnCode", join: '[data-e="join"]',
    chatIn: ".cn-chat input", chatForm: ".cn-chat form", openChat: ".cn-chat-btn", closeChat: '.cn-chat [data-c="close"]' },
  { id: "co-ty-phu", name: "#nmIn", priv: "#privateRoom", create: ["#mkRoom"], code: "#rCode", codeIn: "#codeIn", join: "#joinRoom",
    chatIn: "#chat input", chatForm: "#chat form", openChat: "#chatBtn", closeChat: "#chat .close" },
  { id: "dat-bom", name: "#nameInp", priv: "#privateRoom", create: ["#createBtn"], code: "#lobCode", codeIn: "#codeInp", join: '#joinForm [type="submit"], #joinForm button',
    chatIn: "#chatInp", chatForm: "#chatForm" },
  { id: "ma-soi", name: "#nameInp", priv: "#privateRoom", create: ["#createBtn"], code: "#barCodeTxt", codeIn: "#codeInp", join: "#joinBtn",
    chatIn: "#chatInp", chatForm: "#chatForm", keepLog: true },
  { id: "ai-la-noi-gian", name: "#nameInp", priv: "#privateRoom", create: ["#createBtn"], code: "#barCodeTxt", codeIn: "#codeInp", join: "#joinBtn",
    chatIn: "#chatInp", chatForm: "#chatForm", keepLog: true },
].filter((g) => !ONLY || ONLY.includes(g.id));

// đếm tiếng phát ra (WebAudio + <audio>) để biết tin nhắn có kêu không
const SPY = `(() => { window.__snd = 0; const w = (P, k) => { const o = P && P.prototype[k]; if (!o) return; P.prototype[k] = function (...a) { window.__snd++; return o.apply(this, a); }; };
  w(window.AudioBufferSourceNode, "start"); w(window.OscillatorNode, "start"); w(window.HTMLMediaElement, "play"); })();`;

let fails = 0, passes = 0;
const results = [];
const check = (label, ok, info = "") => { (ok ? passes++ : fails++); results.push(`${ok ? "ĐẠT" : "LỖI"}  ${label}${!ok && info ? "  :: " + info : ""}`); console.log(`${ok ? "  ✔" : "  ✘"} ${label}${!ok && info ? "  :: " + info : ""}`); };
const lobby = async () => (await (await fetch(BASE + "/api/lobby")).json()).rooms;
const Q = (s) => JSON.stringify(s);
// số lần phát tiếng: lớp đếm WebAudio/<audio> + nhật ký window.__sfx.log (Đặt Bom, Ma Sói, Nội Gián ghi tên tiếng kể cả khi AudioContext chưa mở)
const SND = "window.__snd + (window.__sfx?.log?.length || 0)";

// Kiểm trước máy chủ ở BASE có đủ trang các game (chạy nhầm cổng của bản cũ / server khác ⇒ báo ngay, khỏi chờ hết giờ từng ô)
for (const g of GAMES) {
  const r = await fetch(`${BASE}/games/${g.id}/`).catch((e) => ({ ok: false, status: e.message }));
  if (!r.ok) { console.error(`Máy chủ ${BASE} không phục vụ /games/${g.id}/ (${r.status}). Chạy: PORT=… node server.js ở gốc repo rồi đặt BASE.`); process.exit(2); }
}
const chrome = await launchChrome("chat-off");
async function tab(name, w, h, mobile) {
  const ctx = await chrome.newContext();
  const t = await chrome.newTab(name, w, h, mobile, ctx);
  await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: SPY });
  return t;
}
const fill = (t, sel, val) => t.ev(`(() => { const e = document.querySelector(${Q(sel)}); e.value = ${Q(val)}; e.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
const visible = (sel) => `(() => { const e = document.querySelector(${Q(sel)}); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; })()`;
async function tap(t, sel, touch) {
  await t.waitFor(visible(sel), 8000);
  return t.click(sel, { touch });
}
async function sendChat(t, g, text) {
  await fill(t, g.chatIn, text);
  await t.ev(`document.querySelector(${Q(g.chatForm)}).requestSubmit()`);
}
// Tên khách giờ tự sinh (_shared/account.js: getName() không bao giờ rỗng) ⇒ ô tên luôn điền sẵn, người chơi bấm Tạo / Vào phòng luôn.
// Test đi đúng luồng đó: chỉ chờ ô tên hiện + có tên sẵn, không bắt buộc gõ. (Vẫn ghi đè tên riêng cho A / B để ảnh chụp dễ đọc.)
const nameReady = (g) => `(${visible(g.name)}) && document.querySelector(${Q(g.name)}).value.trim().length > 0`;
async function create(t, g, priv) {
  await t.go(`${BASE}/games/${g.id}/`);
  await t.waitFor(nameReady(g), 15000);
  await fill(t, g.name, "An" + g.id.slice(0, 3));
  await t.ev(`(() => { const c = document.querySelector(${Q(g.priv)}); c.checked = ${priv}; return true; })()`);
  for (const s of g.create) { await t.waitFor(visible(s)); await t.ev(`document.querySelector(${Q(s)}).click()`); await sleep(200); }
  await t.waitFor(`/^[A-Z0-9]{5}$/.test((document.querySelector(${Q(g.code)})?.textContent || "").trim())`);
  return (await t.ev(`document.querySelector(${Q(g.code)}).textContent.trim()`));
}
const noOverflow = (t) => t.ev("document.documentElement.scrollWidth <= innerWidth + 1");
// nút bật/tắt không bị che và không đè lên phần tử khác trong cùng hàng tiêu đề
const toggleClear = (t) => t.ev(`(() => { const b = [...document.querySelectorAll("[data-chat-toggle]")].find((e) => e.getBoundingClientRect().width > 0); if (!b) return "không thấy nút";
  const r = b.getBoundingClientRect(); if (r.height < 43.5) return "nút thấp " + r.height; if (r.right > innerWidth + 1 || r.left < -1) return "tràn ngang";
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!(top === b || b.contains(top))) return "bị che bởi " + (top && top.outerHTML.slice(0, 80));
  for (const s of b.parentElement.children) { if (s === b) continue; const q = s.getBoundingClientRect(); if (!q.width) continue;
    if (q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) return "đè lên " + s.outerHTML.slice(0, 60); }
  return "ok"; })()`);

for (const g of GAMES) {
  for (const [vw, vh, mob] of [[390, 844, true], [1366, 768, false]]) {
    const tag = `${g.id} ${vw}×${vh}`;
    console.log(`\n== ${tag}`);
    const A = await tab("A", vw, vh, mob), B = await tab("B", vw, vh, mob);
    try {
      const code = await create(A, g, false);
      check(`${tag}: phòng mặc định (công khai như cũ) có trong /api/lobby`, (await lobby()).some((r) => r.code === code && r.game === g.id));
      // B vào: giữ nguyên tên khách tự sinh (luồng mặc định của người mới), chỉ nhập mã phòng
      await B.go(`${BASE}/games/${g.id}/`);
      await B.waitFor(nameReady(g), 15000);
      await fill(B, g.codeIn, code);
      await B.ev(`document.querySelector(${Q(g.join)}).click()`);
      await B.waitFor(`!!document.querySelector(${Q(g.chatIn)}) && document.querySelector(${Q(g.chatIn)}).isConnected && !document.querySelector(${Q(g.chatIn)}).closest("[hidden]")`, 15000);
      await sleep(800);
      // trước khi tắt: tin của A tới B (B mở hoặc không mở khung chat ⇒ thấy trong log hoặc toast)
      const s0 = await B.ev(SND);
      await sendChat(A, g, "Chao ban mot " + vw);
      await sleep(1500);
      // thấy tin trong khung/toast, hoặc (game không có toast, vd Nối Từ) có số tin chưa đọc trên nút Chat
      const seen1 = await B.ev(`document.body.innerText.includes("Chao ban mot ${vw}") || [...document.querySelectorAll("#chatN, #chatBadge, .cn-chat-btn .n, .chatbtn .n")].some((e) => !e.hidden && /[0-9]/.test(e.textContent))`);
      const snd1 = (await B.ev(SND)) - s0;
      check(`${tag}: chat bật ⇒ B thấy tin của A`, seen1);
      console.log(`      (tiếng khi chat bật: ${snd1} lần phát)`);
      // B tắt chat bằng nút ở tiêu đề khung chat (màn hẹp: mở khung chat trước)
      const narrow = await B.ev(`!(${visible("[data-chat-toggle]")})`);
      if (narrow && g.openChat) await tap(B, g.openChat, mob);
      const clear = await toggleClear(B);
      check(`${tag}: nút "Tắt chat" ≥44px, không bị che/đè`, clear === "ok", clear);
      if (await B.ev(visible("[data-chat-toggle]"))) await tap(B, "[data-chat-toggle]", mob);
      else await B.ev(`document.querySelector("[data-chat-toggle]").click()`);
      await sleep(300);
      check(`${tag}: tắt ⇒ lưu wgp.chatOff=1, ô nhập khoá`, await B.ev(`localStorage.getItem("wgp.chatOff")==="1" && document.querySelector(${Q(g.chatIn)}).disabled && document.documentElement.classList.contains("wgp-chat-off")`));
      await B.shot(join(OUT, `${g.id}-${vw}-B-tat-chat.png`));
      if (narrow && g.closeChat && await B.ev(visible(g.closeChat))) await tap(B, g.closeChat, mob);
      const s1 = await B.ev(SND);
      await sendChat(A, g, "Tin bi an " + vw);
      await sleep(1600);
      const leaked = await B.ev(`document.body.innerText.includes("Tin bi an ${vw}")`);
      const snd2 = (await B.ev(SND)) - s1;
      check(`${tag}: chat tắt ⇒ B không thấy tin (không log, không toast)`, !leaked);
      check(`${tag}: chat tắt ⇒ B không có tiếng tin nhắn`, snd2 === 0, `phát ${snd2} lần`);
      check(`${tag}: A vẫn chat được (thấy tin của mình)`, await A.ev(`document.body.innerText.includes("Tin bi an ${vw}") || [...document.querySelectorAll("li")].some((l) => l.textContent.includes("Tin bi an ${vw}"))`));
      await A.shot(join(OUT, `${g.id}-${vw}-A.png`));
      if (narrow) await B.shot(join(OUT, `${g.id}-${vw}-B-dong-khung.png`));
      check(`${tag}: không tràn ngang (A, B)`, (await noOverflow(A)) && (await noOverflow(B)));
      // tải lại ⇒ vẫn tắt
      await B.go(`${BASE}/games/${g.id}/`);
      await sleep(1500);
      check(`${tag}: tải lại ⇒ vẫn tắt`, await B.ev(`document.documentElement.classList.contains("wgp-chat-off") && localStorage.getItem("wgp.chatOff")==="1"`));
      // bật lại: nếu đã vào lại phòng thì bấm "Bật lại" trong khung chat; không thì vào lại bằng mã
      const back = await B.ev(`!!document.querySelector(${Q(g.chatIn)}) && !document.querySelector(${Q(g.chatIn)}).closest("[hidden]") && getComputedStyle(document.querySelector(${Q(g.chatIn)})).display !== "none"`);
      console.log(`      (sau khi tải lại B ${back ? "tự vào lại phòng" : "về màn vào phòng"})`);
      if (!back) {
        await B.waitFor(nameReady(g), 15000); await fill(B, g.codeIn, code);
        await B.ev(`document.querySelector(${Q(g.join)}).click()`);
        await B.waitFor(`!!document.querySelector(${Q(g.chatIn)}) && !document.querySelector(${Q(g.chatIn)}).closest("[hidden]")`, 15000).catch(() => {});
        await sleep(600);
      }
      if (!(await B.ev(visible("[data-chat-on]"))) && g.openChat && await B.ev(visible(g.openChat))) await tap(B, g.openChat, mob);
      if (await B.ev(visible("[data-chat-on]"))) await tap(B, "[data-chat-on]", mob);
      else await B.ev(`document.querySelector("[data-chat-on]").click()`);
      await sleep(300);
      check(`${tag}: "Bật lại" ⇒ xoá wgp.chatOff, ô nhập mở`, await B.ev(`localStorage.getItem("wgp.chatOff")===null && !document.documentElement.classList.contains("wgp-chat-off")`));
      await sendChat(A, g, "Chao lai lan nua " + vw);
      await sleep(1500);
      check(`${tag}: bật lại ⇒ B thấy tin mới`, await B.ev(`document.body.innerText.includes("Chao lai lan nua ${vw}")`));
      await B.shot(join(OUT, `${g.id}-${vw}-B-bat-lai.png`));
      check(`${tag}: không lỗi console`, !A.errors.length && !B.errors.length, [...A.errors, ...B.errors].join(" | ").slice(0, 300));
      // phòng kín vẫn chạy như cũ (khung rộng)
      if (!mob) {
        const C = await tab("C", vw, vh, false);
        const pc = await create(C, g, true);
        check(`${tag}: tick "Phòng kín" ⇒ không có trong /api/lobby`, !(await lobby()).some((r) => r.code === pc));
        if (g.leave) await C.ev(`document.querySelector("#cancelBtn")?.click()`).catch(() => {});
        await Promise.race([C.cmd("Page.close"), sleep(1000)]); C.close();
      }
    } catch (e) {
      check(`${tag}: chạy hết kịch bản`, false, e.message);
      try { await B.shot(join(OUT, `${g.id}-${vw}-B-loi.png`)); await A.shot(join(OUT, `${g.id}-${vw}-A-loi.png`)); } catch {}
    }
    if (g.leave) for (const t of [A, B]) await t.ev(`document.querySelector(${Q(g.leave)})?.click()`).catch(() => {});
    for (const t of [A, B]) { await Promise.race([t.cmd("Page.close"), sleep(1000)]); t.close(); } // đóng hẳn trang ⇒ phòng cũ giải tán (máy chủ giới hạn số phòng mỗi IP)
  }
}
chrome.close();
console.log(`\nẢnh: ${OUT}\n${passes} đạt, ${fails} lỗi`);
process.exit(fails ? 1 : 0);
