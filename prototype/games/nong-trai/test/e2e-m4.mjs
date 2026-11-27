// E2E trang thử Milestone 4 (ui/dev-m4.html) trên Chrome headless qua CDP: mua gà, cho ăn, tua giờ, thu trứng, mua bò,
// thoại NPC, nhận bước chuỗi / nhiệm vụ bảng, điện thoại 390 × 844 không tràn ngang, 0 lỗi console. Chụp ảnh.
// Chạy: (ở gốc repo) PORT=8805 node server.js   rồi   PORT=8805 node prototype/games/nong-trai/test/e2e-m4.mjs <thư mục output>
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8805, BASE = `http://127.0.0.1:${PORT}/games/nong-trai/ui/dev-m4.html`;
const DBG = 9375;
mkdirSync(OUT, { recursive: true });
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", `--remote-debugging-port=${DBG}`, "--user-data-dir=" + OUT + "/prof", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60 && !ws; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${DBG}/json`)).json(); const p = l.find((x) => x.type === "page"); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
  await sleep(250);
}
if (ws.readyState !== 1) await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) errors.push("console." + m.params.type + " " + m.params.args.map((a) => a.value || a.description).join(" "));
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/fonts\.g/.test(m.params.entry.url || "")) errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + " :: " + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
const view = (w, h, m) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: m });
const nav = async (hash = "") => {
  await send("Page.navigate", { url: BASE + hash }); await sleep(400);
  for (let i = 0; i < 50 && !(await ev('typeof __m4==="object" && document.documentElement.classList.contains("m4-art-ready")').catch(() => false)); i++) await sleep(200);
  await sleep(500);
};
const shot = async (name, full = false) => {
  const p = { format: "png" };
  if (full) { const h = await ev("Math.ceil(document.documentElement.scrollHeight)"), w = await ev("innerWidth"); Object.assign(p, { captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } }); }
  const r = await send("Page.captureScreenshot", p); writeFileSync(OUT + "/" + name, Buffer.from(r.result.data, "base64"));
};
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
const click = async (x, y) => { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); };
const tap = async (x, y) => { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); };
let press = click;
const at = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'center',inline:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,r.width,r.height]})()`);
const pressSel = async (sel) => { const p = await at(sel); if (!p) throw new Error("không thấy " + sel); await sleep(80); const q = await at(sel); await press(q[0], q[1]); await sleep(260); };
const S = (expr) => ev(`(()=>{const s=__m4.s;return ${expr}})()`);
const noOverflowX = () => ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth");
const smallTargets = (root) => ev(`[...document.querySelectorAll(${JSON.stringify(root)} + ' button')].filter(b=>!b.closest('[hidden]')&&b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [b.textContent.trim().slice(0,20)||b.getAttribute('aria-label'),Math.round(r.width),Math.round(r.height)]}).filter(([,w,h])=>w<44||h<44)`);

// ---------- desktop ----------
await view(1280, 900, false);
await nav();
check("trang thử tải, cảnh chăn nuôi hiện", await ev("!document.getElementById('animalsScene').hidden"));
check("noindex", await ev(`document.querySelector('meta[name=robots]').content.includes('noindex')`));
const coins0 = await S("s.coins");
await pressSel('.an-pen[data-kind="ga"] [data-act="buy"]');
check("mua gà: có 1 con, trừ 60 xu", (await S("s.animals.list.length")) === 1 && (await S("s.coins")) === coins0 - 60, `xu ${await S("s.coins")}`);
await pressSel('.an-pen[data-kind="ga"] [data-act="buy"]');
const feed0 = await S("s.inv['thuc-an-gia-suc']");
await pressSel('.an-tap[data-uid="1"]');
check("chạm gà đói ⇒ cho ăn (−1 bao, đang làm)", (await S("s.inv['thuc-an-gia-suc']")) === feed0 - 1 && (await S("s.animals.list[0].fedAt")) !== null);
await pressSel('[data-act="feedAll"]');
check("Cho ăn tất cả: con thứ 2 được ăn", (await S("s.animals.list.every(a=>a.fedAt!==null)")));
await shot("01-animals-producing-desktop.png");
await ev("__m4.travel(4*60000+1000)"); await sleep(400);
check("tua 4 phút ⇒ 2 bong bóng trứng (chín)", (await ev("document.querySelectorAll('.an-tap[data-state=ready]').length")) === 2);
await shot("02-animals-ready-desktop.png");
await pressSel('.an-tap[data-uid="1"]');
check("chạm gà chín ⇒ +1 trứng gà", (await S("s.inv['trung-ga']||0")) === 1, `trứng ${await S("s.inv['trung-ga']")}`);
check("fx lấp lánh / chữ nổi hiện", (await ev("document.querySelectorAll('.an-scene .m4-fx, .an-scene .m4-float').length")) > 0);
await pressSel('[data-act="collectAll"]');
check("Thu tất cả ⇒ 2 trứng, gà về đói", (await S("s.inv['trung-ga']")) === 2 && (await S("s.animals.list.every(a=>a.fedAt===null)")));
// bò: cần chuồng bò + cấp 9 (trang thử bắt đầu cấp 9, chưa có chuồng bò)
check("bò chưa có chuồng ⇒ nút mua khoá + lý do", await ev(`document.querySelector('.an-pen[data-kind="bo-sua"] [data-act=buy]').disabled && /Chuồng bò/.test(document.querySelector('.an-pen[data-kind="bo-sua"] .an-lock').textContent)`));
await ev("__m4.dev.barn(); __m4.dev.coins()");
await sleep(200);
await pressSel('.an-pen[data-kind="bo-sua"] [data-act="buy"]');
check("mua bò (kind bo-sua, −180 xu)", (await S("s.animals.list.filter(a=>a.kind==='bo-sua').length")) === 1);
await ev("__m4.dev.feed()");
const cow = await S("s.animals.list.find(a=>a.kind==='bo-sua').uid");
await pressSel(`.an-tap[data-uid="${cow}"]`);
await ev("__m4.travel(8*60000+1000)"); await sleep(300);
await pressSel(`.an-tap[data-uid="${cow}"]`);
check("bò: cho ăn 2 bao, 8 phút sau thu 1 sữa", (await S("s.inv.sua||0")) === 1);
await shot("03-animals-cow-desktop.png", true);

// ---------- làng ----------
await pressSel('.nav [data-scene="village"]');
check("cảnh làng hiện", await ev("!document.getElementById('villageScene').hidden"));
check("bảng nhiệm vụ làng có 3 ô", (await ev("document.querySelectorAll('.vl-slip').length")) === 3);
await pressSel('.vl-npc[data-npc="bac-tu"]');
check("chạm Bác Tư ⇒ thẻ thoại có chân dung + câu thoại", await ev("!!document.querySelector('.vl-face') && /Bác Tư/.test(document.querySelector('.vl-dialog').textContent) && document.querySelector('.vl-line').textContent.length>5"));
check("trò chuyện +1 thân thiết (qua exec talkNpc)", (await S("s.village.friends['bac-tu'].points")) === 1);
await shot("04-village-dialog-desktop.png", true);
// nhiệm vụ tiến trình của Chị Ba: chuồng gà đã xây ⇒ "Xây chuồng gà" nhận được
await pressSel('.vl-npc[data-npc="chi-ba"]');
const progBtn = await at('[data-act="claimProg"]');
check("Chị Ba: nhiệm vụ tiến trình có nút nhận", !!progBtn && (await ev("!document.querySelector('[data-act=claimProg]').disabled")));
const c1 = await S("s.coins");
await pressSel('[data-act="claimProg"]');
check("nhận nhiệm vụ tiến trình ⇒ +xu, qua bước tiếp", (await S("s.coins")) > c1 && (await S("s.village.prog.i")) === 1);
// chuỗi NPC: cấp 14
await ev("document.getElementById('devLevel').value='14'; document.getElementById('devLevel').dispatchEvent(new Event('change'))");
await ev("__m4.dev.goods()"); await sleep(200);
await pressSel('.vl-npc[data-npc="bac-tu"]');
const stepBtn = await at('[data-act="claimStep"]');
check("Bác Tư cấp 14: bước 1 trao 3 bánh trứng nhận được", !!stepBtn && (await ev("!document.querySelector('[data-act=claimStep]').disabled")));
const cake0 = await S("s.inv['banh-trung']");
await pressSel('[data-act="claimStep"]');
check("nhận bước chuỗi: trừ 3 bánh trứng, sang bước 2", (await S("s.inv['banh-trung']||0")) === cake0 - 3 && (await S("s.village.chains['bac-tu'].step")) === 1);
// bảng: tạo sự kiện đủ cho mọi ô rồi nhận 1 ô
await ev("for (const b of document.querySelectorAll('[data-dev=ev]')) __m4.dev.ev(b)");
await ev(`__m4.devEvent([...Array.from({length:4},()=>({type:'animalCollected',kind:'ga',item:'trung-ga',qty:1})),
  ...Array.from({length:3},()=>({type:'delivered',orderType:'thuong',npc:'co-hai',items:{'ca-rot':2}}))])`); await sleep(200);
const done = await ev("document.querySelectorAll('[data-act=claimBoard]:not([disabled])').length");
check("bảng: có ô đủ tiến độ sau sự kiện", done > 0, `${done} ô`);
const uid0 = await ev("Number(document.querySelector('[data-act=claimBoard]:not([disabled])').dataset.uid)");
await pressSel('[data-act="claimBoard"]:not([disabled])');
check("nhận ô bảng ⇒ ô được thay, vẫn 3 ô", !(await S(`s.village.board.slots.some(x=>x.uid===${uid0})`)) && (await S("s.village.board.slots.length")) === 3);
await ev("__m4.dev.ev(document.querySelector('[data-ev=deliverEgg]'))"); await sleep(1800);
check("xe giao hàng (ui/truck.js) đang chạy sau sự kiện giao đơn (cấp ≥ 11)", (await ev("__m4.scenes.truck.phase")) !== "idle", await ev("__m4.scenes.truck.phase"));
await shot("05b-truck-desktop.png");
await shot("05-village-board-desktop.png", true);

// ---------- điện thoại 390 × 844 ----------
await view(390, 844, true); await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }); press = tap;
await nav();
await ev("__m4.dev.coins(); __m4.dev.barn()"); await sleep(200);
await pressSel('.an-pen[data-kind="ga"] [data-act="buy"]');
await pressSel('.an-pen[data-kind="ga"] [data-act="buy"]');
await pressSel('.an-tap[data-uid="1"]');
check("điện thoại: chạm cho gà ăn", (await S("s.animals.list[0].fedAt")) !== null);
check("điện thoại chăn nuôi: không tràn ngang", await noOverflowX(), await ev("document.documentElement.scrollWidth"));
const smallA = await smallTargets(".an-scene");
check("điện thoại chăn nuôi: nút chạm ≥ 44 px", smallA.length === 0, JSON.stringify(smallA));
await shot("06-animals-mobile.png", true);
await ev("__m4.travel(240000+500)"); await sleep(300);
await shot("07-animals-mobile-ready.png");
await pressSel('.nav [data-scene="village"]');
await ev("document.getElementById('devLevel').value='14'; document.getElementById('devLevel').dispatchEvent(new Event('change'))"); await sleep(200);
await pressSel('.vl-npc[data-npc="anh-ut"]');
check("điện thoại: thoại Anh Út", /Anh Út/.test(await ev("document.querySelector('.vl-dialog').textContent")));
check("điện thoại làng: không tràn ngang (đường làng cuộn trong khung)", await noOverflowX(), await ev("document.documentElement.scrollWidth"));
const smallV = await smallTargets(".vl-scene");
check("điện thoại làng: nút chạm ≥ 44 px", smallV.length === 0, JSON.stringify(smallV));
await shot("08-village-mobile.png", true);
await ev("document.querySelector('.vl-road').scrollLeft = 0"); await ev("scrollTo(0,0)"); await sleep(150);
await shot("09-village-mobile-top.png");
// 0 tài nguyên trống: trạng thái 0 con
await ev("__m4.dev.reset()"); await pressSel('.nav [data-scene="animals"]');
check("0 con: thẻ hướng dẫn hiện", await ev(`!document.querySelector('.an-pen[data-kind="ga"] .an-empty').hidden && /Mua gà/.test(document.querySelector('.an-pen[data-kind="ga"] .an-empty').textContent)`));
await shot("10-animals-empty-mobile.png", true);

// Milestone 6: trang thử nạp đúng một bản module (?v=m15), không lẫn bản cũ m5
check("M6: mọi module JS của game nạp với tag ?v=m15", await ev("(()=>{const js=performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/nong-trai\\/.*\\.js(\\?|$)/.test(n)&&!/_shared/.test(n));return js.length>5&&js.every(n=>/\\?v=m15/.test(n)||/dev-m4\\.js$/.test(n))})()"),
  await ev("performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/\\.js(\\?|$)/.test(n)&&!/\\?v=m15/.test(n)).join(' ')"));

check("0 lỗi console / exception", errors.length === 0, errors.join(" | "));
console.log(fails ? `${fails} FAIL` : "ALL PASS");
ws.close(); chrome.kill();
process.exit(fails ? 1 : 0);
