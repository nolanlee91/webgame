// E2E Nông Trại (Milestone 1) trên Chrome headless — bấm chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8801 node server.js   rồi   node prototype/games/nong-trai/test/e2e.mjs <thư mục output>   [PORT=8801]
// Đồng hồ: trang mở với ?testclock ⇒ window.__ntOffset (ms) dịch thời gian để cây chín ngay, không phải chờ.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8801, BASE = `http://127.0.0.1:${PORT}/games/nong-trai/?testclock`;
const DBG = 9361;
mkdirSync(OUT, { recursive: true });
const PROF = OUT + "/prof";
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", `--remote-debugging-port=${DBG}`, "--user-data-dir=" + PROF, "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${DBG}/json`)).json(); const p = l.find((x) => x.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console.error " + m.params.args.map((a) => a.value || a.description).join(" "));
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + " :: " + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
const nav = async (u = BASE) => { await send("Page.navigate", { url: u }); await sleep(500); for (let i = 0; i < 50 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(200); await sleep(400); };
const view = (w, h, m, dpr = 1) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = (on) => send("Emulation.setTouchEmulationEnabled", { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(OUT + "/" + name, Buffer.from(r.result.data, "base64")); };
const shotFull = async (name) => {
  const h = await ev("Math.ceil(document.documentElement.scrollHeight)"), w = await ev("innerWidth");
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  writeFileSync(OUT + "/" + name, Buffer.from(r.result.data, "base64"));
};
const R = []; let fails = 0;
const check = (n, c, d = "") => { const s = (c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : ""); if (!c) fails++; R.push(s); console.log(s); };
const click = async (x, y) => { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); };
const tap = async (x, y) => { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); };
let press = click;
const at = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async (sel) => { const p = await at(sel); if (!p) throw new Error("không thấy " + sel); await sleep(60); const q = await at(sel); await press(...q); await sleep(220); };
const plot = (i) => pressSel(`#field .plot[data-i="${i}"]`);
const S = (expr) => ev(`(()=>{const s=__game.state;return ${expr}})()`);
const visible = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')})()`);
const text = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const advance = async (ms) => { await ev(`window.__ntOffset=(window.__ntOffset||0)+${ms}`); await sleep(400); };
const questId = () => S("(s.quests.tut<8)?['gieo-hat','tuoi-cay','thu-hoach','ban-hang','giao-don','mo-o-dat','nang-kho','len-cap-3'][s.quests.tut]:null");
const noOverflowX = () => ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth");
const claim = async () => { await pressSel("#qClaim"); await sleep(150); };

// ===== 1. Người chơi mới, desktop, chuột =====
await view(1280, 900, false); await touch(false); press = click;
await nav(); await ev("localStorage.clear()"); await nav();
check("người mới: hiện bảng cách chơi", await visible("#ovHelp"));
await pressSel("#helpOk");
check("ruộng 25 ô (homepage check dựa vào)", await ev('document.querySelectorAll("#field .plot").length===25'));
check("HUD: xu 24, cấp 1, kho 0/60", (await text("#hCoins")) === "24" && (await text("#hLevel")) === "1" && (await text("#hStore")) === "0/60");
check("nhiệm vụ 1/8 hiện kèm chân dung Chị Ba", await visible("#quest") && /Gieo hạt/.test(await text("#qTitle")) && await ev("!!document.querySelector('#quest .face[style*=\"--r:1\"]')"));
check("mũi tên chỉ vào ô đất trống", await ev("!!document.querySelector('#field .plot.qhl.qarrow')"));
check("khay hạt: 6 cây (có Lúa khoá cấp 6, không có Mía)", await ev("document.querySelectorAll('#seeds .seed').length===6&&/Cấp 6/.test(document.querySelector('#seeds .seed[data-id=lua]').textContent)&&!document.querySelector('[data-id=mia]')"));
await shot("01-desktop-moi.png");

await plot(12);
check("gieo cà rốt → ô 12 có cây, nhiệm vụ 1 xong (nút Nhận)", (await S("s.plots[12].crop")) === "ca-rot" && await visible("#qClaim"));
await claim();
check("nhận thưởng NV1: +6 xu, sang NV2 tưới cây", (await S("s.coins")) === 30 && (await questId()) === "tuoi-cay");
check("NV2: chỉ vào nút Tưới nước", await ev("document.getElementById('waterTool').classList.contains('qhl')"));
await pressSel("#waterTool"); await plot(12);
check("tưới → ô ướt, NV2 xong", await S("s.plots[12].watered") && await visible("#qClaim"));
await claim();
await pressSel("#seedTool"); await plot(6); await plot(7);
check("gieo thêm 2 ô bằng hạt tặng (còn 0 hạt tặng)", (await S("s.freeSeeds")) === 0 && (await S("s.plots[7].crop")) === "ca-rot");
await advance(31_000);
check("tua đồng hồ 31 giây → cây chín, có viền chỉ vào ô chín", await ev("document.querySelectorAll('#field .plot.ready').length===3") && await ev("!!document.querySelector('#field .plot.ready.qhl')"));
await pressSel("#allBtn");
check("Thu hết → 3 cà rốt vào kho, kho 3/60, NV3 xong", (await S("s.inv['ca-rot']")) === 3 && (await text("#hStore")) === "3/60" && await visible("#qClaim"));
await claim();
check("lên cấp 2 (toast báo mở khoá Dâu tây)", (await S("s.level")) === 2);
await pressSel("#sellTool");
check("Bán → mở Nhà kho: nhóm Nông sản, icon items.webp, nguồn gốc / dùng cho, đơn đang cần", await visible("#warehouse") && /Nông sản/.test(await text("#whBody")) && /Nguồn: Trồng ở ruộng/.test(await text("#whBody")) && /Đơn đang cần/.test(await text("#whBody")) && await ev("!!document.querySelector('#whBody .it')"));
await shot("02-desktop-kho.png");
const coinsBeforeSell = await S("s.coins");
await pressSel('#whBody [data-act="sell1"][data-id="ca-rot"]');
check("Bán 1 cà rốt: +6 xu, còn 2, NV4 xong", (await S("s.coins")) === coinsBeforeSell + 6 && (await S("s.inv['ca-rot']")) === 2 && await visible("#qClaim"));
await claim();
check("NV5: chỉ vào nút Đơn hàng", await ev("document.getElementById('ordersTool').classList.contains('qhl')"));
await pressSel("#ordersTool");
check("Bảng đơn: ≥3 phiếu, phiếu 1 của Bác Tư, 2/2 cà rốt, nút Giao bật", await ev("document.querySelectorAll('#slips .slip[data-slot]').length>=3") && /Bác Tư/.test(await text('#slips .slip[data-slot="0"]')) && /2\/2/.test(await text('#slips .slip[data-slot="0"]')) && await ev(`!document.querySelector('#slips [data-act=deliver][data-slot="0"]').disabled`));
check("phiếu có chân dung Cô Hai (npc.webp) hoặc huy hiệu chữ", await ev("!!document.querySelector('#slips .face')"));
const order0 = await S("({id:s.orders.slots[0].order.id,rev:s.orders.slots[0].rev,coins:s.orders.slots[0].order.coins})");
const invBefore = await S("JSON.stringify(s.inv)");
check("chưa bấm Giao thì kho chưa bị trừ", invBefore === JSON.stringify({ "ca-rot": 2 }));
await shot("03-desktop-don-hang.png");
const c0 = await S("s.coins");
await pressSel('#slips [data-act="deliver"][data-slot="0"]');
check("Giao đơn đầu: trừ 2 cà rốt, +" + order0.coins + " xu, NV5 xong", (await S("s.coins")) === c0 + order0.coins && !(await S("s.inv['ca-rot']")) && await visible("#qClaim"));
check("giao lại đơn cũ (id+rev) bị chặn", (await ev(`(()=>{const L=__game;return null})()`)) === null &&
  (await ev(`import('./logic.js?v=m1').then(L=>L.apply(__game.state,{type:'deliver',slot:0,id:${order0.id},rev:${order0.rev}},Date.now()+(window.__ntOffset||0)).err)`)) === "order-changed");
await claim();
// bỏ đơn
const slot1 = await S("s.orders.slots[1].order.id");
await pressSel('#slips [data-act="cancel"][data-slot="1"]');
check("Bỏ đơn cần bấm 2 lần (lần 1 chỉ hỏi lại)", (await S("s.orders.slots[1].order&&s.orders.slots[1].order.id")) === slot1 && /Bấm lần nữa/.test(await text('#slips [data-act="cancel"][data-slot="1"]')));
await pressSel('#slips [data-act="cancel"][data-slot="1"]');
check("Bỏ đơn → phiếu trống 'Đơn mới sau 2:00'", (await S("s.orders.slots[1].order")) === null && /Đơn mới sau [12]:\d\d/.test(await text('#slips .slip[data-slot="1"]')));

// ===== 2. Tải lại giữ nguyên =====
const snap = await S("JSON.stringify({c:s.coins,l:s.level,x:s.xp,inv:s.inv,q:s.quests,o:s.orders.slots.map(x=>x.order&&x.order.id),p:s.plots.map(p=>p.crop)})");
await nav(BASE);
const snap2 = await S("JSON.stringify({c:s.coins,l:s.level,x:s.xp,inv:s.inv,q:s.quests,o:s.orders.slots.map(x=>x.order&&x.order.id),p:s.plots.map(p=>p.crop)})");
check("tải lại trang: xu, cấp, XP, kho, nhiệm vụ, đơn, ruộng giữ nguyên", snap === snap2, snap2);
check("tải lại: không hiện lại bảng cách chơi", !(await visible("#ovHelp")));
await advance(160_000); // tải lại trang đặt lại __ntOffset ⇒ tua quá mốc bỏ đơn (31 s + 2 phút)
await sleep(1300);
check("2 phút sau khi bỏ đơn → có đơn mới (đồng bộ theo giờ)", !!(await S("s.orders.slots[1].order")));
// NV6 mở ô (cấp 2)
check("NV6 mở ô đất: chỉ vào ô cỏ mua được", (await questId()) === "mo-o-dat" && await ev("!!document.querySelector('#field .plot.locked.qhl')"));
await ev("(()=>{const s=__game.state;s.coins+=200;__game.state=s})()");
const buyI = await ev("+document.querySelector('#field .plot.locked.qhl').dataset.i");
await plot(buyI); await plot(buyI);
check("mở ô (bấm 2 lần) → ô mở, NV6 xong", await S(`s.plots[${buyI}].open`) && await visible("#qClaim"));
await claim();
await pressSel("#stockTool");
await pressSel("#whUpgrade");
check("NV7 nâng kho 60 → 90", (await text("#hStore")).endsWith("/90") && await visible("#qClaim"));
await claim();
check("NV8 lên cấp 3 đang mở", (await questId()) === "len-cap-3");

// ===== 3. Kho đầy → giỏ tràn =====
await ev(`(()=>{const s=__game.state;s.inv={'ca-chua':90};const t=Date.now()+(window.__ntOffset||0);for(const i of [6,7,8]){s.plots[i]={open:true,crop:'ca-rot',plantAt:t-40000,readyAt:t-1000,watered:false}}__game.state=s})()`);
await pressSel("#allBtn");
check("kho đầy không chặn thu hoạch: 3 cà rốt vào giỏ tràn, HUD báo +3", (await S("JSON.stringify(s.overflow)")) === JSON.stringify({ "ca-rot": 3 }) && (await text("#hStore")) === "90/90" && /\+3 giỏ tràn/.test(await text("#hOver")));
await pressSel("#stockTool");
check("Nhà kho hiện Giỏ tràn 3/10 + nút bán nhanh", /Giỏ tràn 3\/10/.test(await text("#whBody")) && await visible("#sellBasket"));
await shot("04-desktop-gio-tran.png");
const cb = await S("s.coins");
await pressSel("#sellBasket");
check("Bán nhanh giỏ tràn: +18 xu, giỏ trống", (await S("s.coins")) === cb + 18 && (await S("Object.keys(s.overflow).length")) === 0);

// ===== 4. Di chuyển bản lưu v2 =====
const t2 = Date.now();
const plots = Array.from({ length: 25 }, (_, i) => ({ open: [6, 7, 8, 11, 12, 13, 16, 17, 18, 2].includes(i), crop: null, plantAt: 0, readyAt: 0, watered: false }));
plots[6] = { open: true, crop: "ngo", plantAt: t2 - 60_000, readyAt: t2 + 120_000, watered: false };
plots[12] = { open: true, crop: "dau-tay", plantAt: t2 - 200_000, readyAt: t2 - 110_000, watered: false };
const v2 = { v: 2, coins: 137, xp: 12, level: 3, bought: 1, lastSeen: t2 - 300_000, freeSeeds: 0, upgrade: 1, stock: { "ca-rot": 4, "ca-chua": 70, "dau-tay": 2, ngo: 0, "bi-ngo": 0 }, orders: [{ recipe: 4, revision: 3 }, { recipe: 5, revision: 1 }], plots, stats: { harvested: 88, earned: 640 } };
await ev(`localStorage.clear();localStorage.setItem('wgp.nongtrai.v2',${JSON.stringify(JSON.stringify(v2))})`);
await nav(BASE.replace("?testclock", ""));
const mig = await S("({v:s.v,c:s.coins,l:s.level,x:s.xp,b:s.bought,inv:s.inv,ngo:s.plots[6].crop,ngoAt:s.plots[6].readyAt,d:s.plots[12].crop,up:s.upgrade,o0:s.orders.slots[0].order&&s.orders.slots[0].order.items,slots:s.orders.slots.length,tut:s.quests.tut})");
check("v2 → v3: xu 137, cấp 3, XP 12, ô mua, kho (vượt 60 vẫn giữ), cây đang trồng, nâng cấp, đơn cũ", mig.v === 3 && mig.c === 137 && mig.l === 3 && mig.x === 12 && mig.b === 1 && mig.inv["ca-chua"] === 70 && mig.ngo === "ngo" && mig.ngoAt === t2 + 120_000 && mig.d === "dau-tay" && mig.up === 1 && JSON.stringify(mig.o0) === JSON.stringify({ "dau-tay": 2, "ca-chua": 1 }) && mig.slots === 4, JSON.stringify(mig));
check("v2: giữ bản gốc ở wgp.nongtrai.v2.backup và không xoá v2; đã ghi v3", await ev(`localStorage.getItem('wgp.nongtrai.v2.backup')===localStorage.getItem('wgp.nongtrai.v2')&&!!localStorage.getItem('wgp.nongtrai.v2')&&JSON.parse(localStorage.getItem('wgp.nongtrai.v3')).v===3`));
check("v2: thông báo nâng cấp, người chơi cấp 3 bỏ qua hướng dẫn", /nâng cấp/.test(await text("#toast")) && mig.tut === 8 && !(await visible("#quest")));
check("v2: ô dâu tây đã chín trong lúc vắng", await ev("document.querySelector('#field .plot[data-i=\"12\"]').classList.contains('ready')"));
check("kho vượt sức chứa sau di chuyển: HUD đỏ 76/60", (await text("#hStore")) === "76/60" && await ev("document.getElementById('hStoreStat').classList.contains('full')"));
await shot("05-desktop-v2-di-chuyen.png");

// ===== 5. Mobile 390×844, chạm =====
await view(390, 844, true, 2); await touch(true); press = tap;
await nav(BASE);
await sleep(300);
check("mobile 390: không tràn ngang", await noOverflowX(), await ev("document.documentElement.scrollWidth"));
const small = await ev(`[...document.querySelectorAll('.farm-nav button, #seeds .seed, .tools .btn')].filter(b=>{const r=b.getBoundingClientRect();return r.height<44||r.width<44}).map(b=>b.id||b.dataset.id)`);
check("mobile: nút điều hướng / hạt / công cụ ≥ 44px", small.length === 0, JSON.stringify(small));
check("mobile: HUD — số kho không bị che / tràn khỏi ô chỉ số", await ev("(()=>{const a=document.getElementById('hStore').getBoundingClientRect(),b=document.querySelector('.stats').getBoundingClientRect(),c=document.getElementById('allBtn').getBoundingClientRect();return a.right<=b.right&&b.right<=c.left})()"));
await shot("06-mobile-chinh.png");
await pressSel("#ordersTool");
check("mobile: bảng đơn mở, không tràn ngang, nút Giao/Bỏ ≥ 44px", await visible("#ordersPanel") && await noOverflowX() &&
  await ev(`[...document.querySelectorAll('#slips button')].every(b=>b.getBoundingClientRect().height>=44)`));
await shotFull("07-mobile-don-hang.png");
await pressSel("#stockTool");
check("mobile: nhà kho mở, không tràn ngang, nút bán ≥ 44px", await visible("#warehouse") && await noOverflowX() &&
  await ev(`[...document.querySelectorAll('#whBody button')].every(b=>b.getBoundingClientRect().height>=44)`));
await shotFull("08-mobile-kho.png");
// người mới trên mobile: chạm gieo
await ev("localStorage.clear()"); await nav(BASE);
await pressSel("#helpOk");
await plot(12);
check("mobile: chạm ô → gieo được, nhiệm vụ đổi", (await S("s.plots[12].crop")) === "ca-rot" && await visible("#qClaim"));
check("mobile: thanh nhiệm vụ không tràn", await noOverflowX());
await shot("09-mobile-nhiem-vu.png");
await view(1280, 900, false); await touch(false); press = click;
await nav(BASE);
await pressSel("#ordersTool");
await shotFull("10-desktop-toan-trang.png");

check("0 lỗi console / exception", errors.length === 0, errors.join(" | "));
writeFileSync(OUT + "/e2e-ket-qua.txt", R.join("\n") + `\n\n${R.length - fails}/${R.length} PASS\n`);
console.log(`\n${R.length - fails}/${R.length} PASS`);
ws.close(); chrome.kill();
await sleep(500);
try { rmSync(PROF, { recursive: true, force: true }); } catch {}
process.exit(fails ? 1 : 0);
