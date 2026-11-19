// E2E Nông Trại (Milestone 1 + 2: Xưởng chế biến, Khu chợ) trên Chrome headless — bấm chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8802 node server.js   rồi   PORT=8802 node prototype/games/nong-trai/test/e2e.mjs <thư mục output>
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
/** Tải lại thật (kể cả khi URL chỉ khác #hash), giữ đồng hồ thử (sessionStorage) để không "lùi giờ" sau khi tua. */
const reload = async (hash = "") => { await ev("sessionStorage.setItem('ntOffset',String(window.__ntOffset||0))"); await send("Page.navigate", { url: "about:blank" }); await sleep(300); await nav(BASE + hash); await ev("sessionStorage.removeItem('ntOffset')"); };
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
  (await ev(`import('./logic.js?v=m2').then(L=>L.apply(__game.state,{type:'deliver',slot:0,id:${order0.id},rev:${order0.rev}},Date.now()+(window.__ntOffset||0)).err)`)) === "order-changed");
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
check("v2 → v3: xu 137, cấp 3, XP 12, ô mua, kho (vượt 60 vẫn giữ), cây đang trồng, nâng cấp, đơn cũ", mig.v === 4 && mig.c === 137 && mig.l === 3 && mig.x === 12 && mig.b === 1 && mig.inv["ca-chua"] === 70 && mig.ngo === "ngo" && mig.ngoAt === t2 + 120_000 && mig.d === "dau-tay" && mig.up === 1 && JSON.stringify(mig.o0) === JSON.stringify({ "dau-tay": 2, "ca-chua": 1 }) && mig.slots === 4, JSON.stringify(mig));
check("v2: giữ bản gốc ở wgp.nongtrai.v2.backup và không xoá v2; đã ghi v4", await ev(`localStorage.getItem('wgp.nongtrai.v2.backup')===localStorage.getItem('wgp.nongtrai.v2')&&!!localStorage.getItem('wgp.nongtrai.v2')&&JSON.parse(localStorage.getItem('wgp.nongtrai.v4')).v===4`));
check("v2: thông báo nâng cấp, người chơi cấp 3 bỏ qua hướng dẫn ⇒ nhiệm vụ tiến trình 'Xây Xưởng'", /nâng cấp/.test(await text("#toast")) && mig.tut === 8 && /Xây Xưởng/.test(await text("#qTitle")));
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


// ===== 6. Milestone 2: Xưởng chế biến + Khu chợ + chuỗi A (desktop, chuột) =====
await view(1280, 900, false); await touch(false); press = click;
await ev("localStorage.clear()"); await nav(BASE);
await pressSel("#helpOk");
// gieo nhanh một người chơi cấp 4 đã xong hướng dẫn (seed save qua state, như người chơi đã chơi ~10 phút)
await ev(`(()=>{const s=__game.state;s.level=4;s.xp=0;s.coins=400;s.quests.tut=8;s.quests.progress=0;s.inv={'dau-tay':6,'ca-chua':6};__game.state=s})()`);
await sleep(300);
const lotState = () => ev("document.getElementById('workshopLot').dataset.state");
check("M2 cấp 4: lô Xưởng 'Có thể xây' (bản vẽ lo-ban-ve), nhiệm vụ tiến trình 'Xây Xưởng chế biến'", (await lotState()) === "available" && /Có thể xây/.test(await text("#lotTag")) && /Xây Xưởng/.test(await text("#qTitle")));
await shot("m2-01-lo-xuong-co-the-xay.png");
await pressSel("#workshopLot");
check("chạm lô ⇒ hộp xác nhận: giá 150 xu, 1 phút, tặng Bếp sên", await visible("#ovBuild") && /150 xu/.test(await text("#buildBody")) && /Bếp sên/.test(await text("#buildBody")));
await pressSel("#buildOk");
check("Xây ⇒ giàn giáo (gian-giao) + đồng hồ + thanh tiến độ, trừ 150 xu", (await lotState()) === "building" && /Đang xây/.test(await text("#lotTag")) && await visible("#lotBar") && (await S("s.coins")) === 250);
await shot("m2-02-dang-xay.png");
await advance(61_000); await sleep(1300);
check("tua 61 s ⇒ Xưởng xong (sprite xuong-che-bien), nhiệm vụ xong", (await lotState()) === "done" && /Xưởng chế biến/.test(await text("#lotTag")) && await visible("#qClaim"));
await claim();
await shot("m2-03-xuong-tren-ban-do.png");
await pressSel("#workshopLot");
check("chạm Xưởng ⇒ cảnh Xưởng riêng (bản đồ ẩn), 3 máy: Bếp sên sẵn sàng, Cối xay khoá cấp 5, Lò bánh khoá cấp 8",
  (await ev("__game.scene")) === "workshop" && await visible("#workshopScene") && (await ev("document.getElementById('farm').offsetParent===null")) &&
  (await ev("document.querySelector('.mach[data-m=bep-sen]').dataset.state")) === "ready" &&
  /cấp 5/.test(await text(".mach[data-m=coi-xay] .queue")) && /cấp 8/.test(await text(".mach[data-m=lo-banh] .queue")), await ev(`__game.scene+" "+[...document.querySelectorAll(".mach")].map(m=>m.dataset.state+":"+m.querySelector(".queue").textContent).join("|")`));
check("máy vẽ từ machines.webp (canvas có pixel), ô hàng chờ dùng ui-kit", await ev("(()=>{const c=document.querySelector('.mach[data-m=bep-sen] canvas');const d=c.getContext('2d').getImageData(0,0,192,192).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n>2000})()") &&
  await ev("getComputedStyle(document.documentElement).getPropertyValue('--uk-hang-cho-trong').includes('data:image')"));
await pressSel(".mach[data-m=bep-sen] .mach-btn");
check("chạm máy ⇒ bảng công thức (the-cong-thuc): Mứt dâu 3/3 bật, Nước ép 'Thiếu nguyên liệu'", await visible("#ovRecipe") && /Mứt dâu/.test(await text("#recipeBody")) &&
  await ev("!document.querySelector('[data-act=start][data-r=mut-dau]').disabled") && await ev("document.querySelector('[data-act=start][data-r=nuoc-ep-ca-rot]').disabled") && /Thiếu nguyên liệu/.test(await text("#recipeBody")));
await shot("m2-04-bang-cong-thuc.png");
await pressSel("[data-act=start][data-r=mut-dau]");
await pressSel("[data-act=start][data-r=mut-dau]");
check("Bắt đầu 2 mẻ Mứt dâu: trừ 6 dâu ngay, 2 ô (chạy + chờ), hàng chờ đầy ⇒ nút tắt 'Hàng chờ đầy'", (await S("s.inv['dau-tay']||0")) === 0 &&
  (await S("s.production.machines['bep-sen'].queue.length")) === 2 && /Hàng chờ đầy|Thiếu nguyên liệu/.test(await text("#recipeBody")));
await pressSel(".rc-close");
check("khay: 1 ô đang chạy (đồng hồ), 1 ô chờ", await ev("!!document.querySelector('.slot--run .slot-time')") && await ev("!!document.querySelector('.slot--wait')"));
await shot("m2-05-dang-che-bien.png");
// tải lại (đồng hồ thật, offset về 0): vẫn ở cảnh Xưởng, hàng chờ giữ nguyên
const jobs0 = await S("JSON.stringify(s.production)");
await reload("#xuong");
check("tải lại: vẫn ở cảnh Xưởng (#xuong), hàng chờ giữ nguyên", (await ev("__game.scene")) === "workshop" && (await S("JSON.stringify(s.production)")) === jobs0);
await advance(245_000); await sleep(1300);
check("tua thời gian ⇒ 2 ô 'Nhận', huy hiệu số trên máy", (await ev("document.querySelectorAll('.slot--done').length")) === 2 && (await text(".mach[data-m=bep-sen] .mach-badge")) === "2");
const xp0 = await S("s.xp");
await pressSel(".slot--done");
const fxSeen = await ev("!!document.querySelector('#workshopScene .fx')");
check("chạm ô xong ⇒ +1 Mứt dâu, +8 XP (qua cấp), hiệu ứng fx lap-lanh / xu-bay, nhiệm vụ 'Làm hũ mứt' xong", (await S("s.inv['mut-dau']")) === 1 && (await S("s.xp")) === xp0 + 8 && fxSeen && await visible("#qClaim"));
const uid2 = await S("s.production.machines['bep-sen'].queue[0].uid");
await pressSel(".slot--done");
check("nhận ô thứ 2; nhận lại ô cũ bị chặn (not-found)", (await S("s.inv['mut-dau']")) === 2 &&
  (await ev(`import('./logic.js?v=m2').then(L=>L.apply(__game.state,{type:'collect',machine:'bep-sen',uid:${uid2}},Date.now()+(window.__ntOffset||0)).err)`)) === "not-found");
await claim();
await shot("m2-06-nhan-mut.png");
// đơn kết hợp có thành phẩm (cấp 5): sinh tự nhiên bằng luật (bỏ đơn → đơn mới sau 2 phút)
await ev(`(()=>{const s=__game.state;s.level=5;s.xp=0;__game.state=s})()`);
const comboSlot = await ev(`import('./logic.js?v=m2').then(L=>{const s=__game.state;for(let k=0;k<400;k++){const i=s.orders.slots.findIndex(x=>x.order&&x.order.type==='ket-hop'&&x.order.items['mut-dau']);if(i>=0){__game.state=s;return i}
  const j=k%s.orders.slots.length,x=s.orders.slots[j],t=Date.now()+(window.__ntOffset||0);if(x.order)L.apply(s,{type:'cancelOrder',slot:j,id:x.order.id,rev:x.rev},t);window.__ntOffset=(window.__ntOffset||0)+121000;L.apply(s,{type:'tick'},Date.now()+window.__ntOffset)}__game.state=s;return -1})`);
check("cấp 5: Bác Tư đặt đơn kết hợp có Mứt dâu (sinh theo luật, chỉ món làm được)", comboSlot >= 0, String(comboSlot));
const combo = await S(`s.orders.slots[${comboSlot}].order`);
await ev(`(()=>{const s=__game.state;const o=s.orders.slots[${comboSlot}].order;for(const [id,q] of Object.entries(o.items))if(id!=='mut-dau')s.inv[id]=Math.max(s.inv[id]||0,q);__game.state=s})()`); // nông sản: như vừa thu hoạch
await pressSel("#workshopScene [data-back]");
await pressSel("#ordersTool");
check("phiếu đơn kết hợp hiện Mứt dâu, đủ hàng, nút Giao bật", /Mứt dâu/.test(await text(`#slips .slip[data-slot="${comboSlot}"]`)) && await ev(`!document.querySelector('#slips [data-act=deliver][data-slot="${comboSlot}"]').disabled`));
await shotFull("m2-07-don-ket-hop.png");
const cBefore = await S("s.coins"), mutBefore = await S("s.inv['mut-dau']");
await pressSel(`#slips [data-act=deliver][data-slot="${comboSlot}"]`);
check("giao đơn kết hợp: trừ mứt, +" + combo.coins + " xu (thưởng cố định ×1,3 giá gốc)", (await S("s.coins")) === cBefore + combo.coins && (await S("s.inv['mut-dau']||0")) === mutBefore - combo.items["mut-dau"] && combo.npc === "bac-tu");
// Khu chợ
await ev(`(()=>{const s=__game.state;s.level=7;s.inv['mut-dau']=(s.inv['mut-dau']||0)+0;__game.state=s})()`);
await pressSel("#market");
check("chạm sạp trên bản đồ ⇒ cảnh Khu chợ: gian quầy + Cô Hai (canvas), bong bóng thoại, bảng giá ↑↓·, 'đổi giá sau h:mm:ss'",
  (await ev("__game.scene")) === "market" && /Cô Hai/.test(await text("#mkBubble")) && /[↑↓·]/.test(await text("#mkBoard")) && /đổi giá sau \d+:\d\d:\d\d/.test(await text("#mkChange")) &&
  await ev("(()=>{const c=document.getElementById('mkStall');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=40)if(d[i])n++;return n>2000})()"));
const mutLeft = await S("s.inv['mut-dau']||0");
if (!mutLeft) await ev(`(()=>{const s=__game.state;s.inv['sot-ca-chua']=1;__game.state=s})()`); // dự phòng nếu đơn đòi hết mứt
const prodId = mutLeft ? "mut-dau" : "sot-ca-chua";
const want = await ev(`import('./logic.js?v=m2').then(L=>({p:L.priceOf('${prodId}',Date.now()+(window.__ntOffset||0)),t:L.MARKET.trend('${prodId}',Date.now()+(window.__ntOffset||0))}))`);
check("kệ Bán: thành phẩm hiện giá hôm nay + mũi tên xu hướng", new RegExp(`${want.p} xu ${want.t === "·" ? "·" : want.t}`).test(await text("#mkSell")));
await shot("m2-08-khu-cho.png");
const c1 = await S("s.coins");
await pressSel(`#mkSell [data-act=sell][data-id="${prodId}"][data-n="1"]`);
check(`Bán 1 ${prodId} ở chợ: +${want.p} xu (market.priceOf)`, (await S("s.coins")) === c1 + want.p);
const c2 = await S("s.coins");
await pressSel('#mkBuy [data-act=buy][data-id="thuc-an-gia-suc"]');
check("Mua thức ăn gia súc (cấp 7): −48 xu, vào kho", (await S("s.coins")) === c2 - 48 && (await S("s.inv['thuc-an-gia-suc']")) === 1);
check("hạt giống ghi 'trả khi gieo' + nút Gieo; món khoá hiện cấp", /trả khi gieo/.test(await text("#mkBuy")) && /Cấp \d+/.test(await text("#mkBuy")));
// Nhà kho dùng cùng giá chợ
await pressSel("#marketScene [data-back]"); await pressSel("#stockTool");
const whOk = await ev(`import('./logic.js?v=m2').then(L=>{const s=__game.state,t=Date.now()+(window.__ntOffset||0),q=s.inv['ca-chua'];const b=document.querySelector('#whBody [data-act=sellN][data-id="ca-chua"]');return !!b&&b.textContent.includes((q*L.priceOf('ca-chua',t)).toLocaleString('vi-VN')+' xu')})`);
check("Nhà kho 'Bán hết' tính theo giá chợ hôm nay (một nguồn giá)", whOk);
// tải lại giữ mọi thứ
const snapM2 = await S("JSON.stringify({c:s.coins,l:s.level,inv:s.inv,p:s.production,b:s.buildings,q:s.quests,d:s.decor})");
await reload("#cho");
check("tải lại: xu, cấp, kho, Xưởng, máy, nhiệm vụ giữ nguyên; mở lại đúng cảnh Khu chợ", (await S("JSON.stringify({c:s.coins,l:s.level,inv:s.inv,p:s.production,b:s.buildings,q:s.quests,d:s.decor})")) === snapM2 && (await ev("__game.scene")) === "market");
// Mobile 390×844: hai cảnh
await view(390, 844, true, 2); await touch(true); press = tap;
await reload("#cho");
check("mobile 390: Khu chợ không tràn ngang, nút ≥ 44px", (await ev("__game.scene")) === "market" && await noOverflowX() &&
  await ev(`[...document.querySelectorAll('#marketScene button')].every(b=>{const r=b.getBoundingClientRect();return r.height>=44&&r.width>=44})`), await ev(`document.documentElement.scrollWidth+" "+[...document.querySelectorAll("#marketScene button")].filter(b=>{const r=b.getBoundingClientRect();return r.height<44||r.width<44}).map(b=>b.textContent+Math.round(b.getBoundingClientRect().width)+"x"+Math.round(b.getBoundingClientRect().height)).join(",")`));
await shotFull("m2-09-mobile-cho.png");
await pressSel('#marketScene [data-back]');
await pressSel("#workshopLot");
check("mobile: chạm Xưởng trên bản đồ ⇒ cảnh Xưởng, không tràn ngang, ô / nút ≥ 44px", (await ev("__game.scene")) === "workshop" && await noOverflowX() &&
  await ev(`[...document.querySelectorAll('#workshopScene button')].filter(b=>b.offsetParent).every(b=>{const r=b.getBoundingClientRect();return r.height>=44&&r.width>=44})`));
await shotFull("m2-10-mobile-xuong.png");
await pressSel(".mach[data-m=bep-sen] .mach-btn");
check("mobile: bảng công thức vừa màn, không tràn ngang", await visible("#ovRecipe") && await noOverflowX() && await ev("document.querySelector('.recipe-card').getBoundingClientRect().right<=innerWidth"));
await shot("m2-11-mobile-cong-thuc.png");
await view(1280, 900, false); await touch(false); press = click;

check("0 lỗi console / exception", errors.length === 0, errors.join(" | "));
writeFileSync(OUT + "/e2e-ket-qua.txt", R.join("\n") + `\n\n${R.length - fails}/${R.length} PASS\n`);
console.log(`\n${R.length - fails}/${R.length} PASS`);
ws.close(); chrome.kill();
await sleep(500);
try { rmSync(PROF, { recursive: true, force: true }); } catch {}
process.exit(fails ? 1 : 0);
