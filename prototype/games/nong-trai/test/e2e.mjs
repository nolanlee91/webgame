// E2E Nông Trại (Milestone 1 + 2: Xưởng chế biến, Khu chợ + 3: chế độ Xây, Nhà kính, Khu đất phía Đông, trang trí + 4: Chăn nuôi, Làng, xe giao hàng + 5: bậc Nhà, gà / bò trên bản đồ, điện thoại) trên Chrome headless — bấm chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8804 node server.js   rồi   PORT=8804 node prototype/games/nong-trai/test/e2e.mjs <thư mục output>
// Đồng hồ: trang mở với ?testclock ⇒ window.__ntOffset (ms) dịch thời gian để cây chín ngay, không phải chờ.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8801, BASE = `http://127.0.0.1:${PORT}/games/nong-trai/?testclock`;
const DBG = Number(process.env.DBG_PORT || 9384);
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
const shot = async (name) => { await ev("window.__game&&__game.cards&&__game.cards.dismissAll()").catch(() => {}); const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(OUT + "/" + name, Buffer.from(r.result.data, "base64")); };
const shotFull = async (name) => {
  await ev("window.__game&&__game.cards&&__game.cards.dismissAll()").catch(() => {});
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
// m7: thẻ chúc mừng xây xong (test riêng ở e2e-cards.mjs) — kịch bản cũ đóng hết thẻ trước mỗi lần bấm / chụp để thẻ không che nút
const dismissCards = () => ev("window.__game&&__game.cards&&__game.cards.dismissAll()").catch(() => {});
const pressSel = async (sel) => { await dismissCards(); const p = await at(sel); if (!p) throw new Error("không thấy " + sel); await sleep(60); const q = await at(sel); await press(...q); await sleep(220); };
const plot = (i) => pressSel(`#field .plot[data-i="${i}"]`);
const S = (expr) => ev(`(()=>{const s=__game.state;return ${expr}})()`);
const visible = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')})()`);
const text = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const advance = async (ms) => { await ev(`window.__ntOffset=(window.__ntOffset||0)+${ms}`); await sleep(400); };
/** Tải lại thật (kể cả khi URL chỉ khác #hash), giữ đồng hồ thử (sessionStorage) để không "lùi giờ" sau khi tua. */
const reload = async (hash = "") => { await ev("sessionStorage.setItem('ntOffset',String(window.__ntOffset||0))"); await send("Page.navigate", { url: "about:blank" }); await sleep(300); await nav(BASE + hash); await ev("sessionStorage.removeItem('ntOffset')"); };
const questId = () => S("(s.quests.tut<8)?['gieo-hat','tuoi-cay','thu-hoach','ban-hang','giao-don','mo-o-dat','len-cap-3','xay-nha-kho'][s.quests.tut]:null");
const noOverflowX = () => ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth");
const claim = async () => { await pressSel("#qClaim"); await sleep(150); };
/** Chờ tới khi biểu thức đúng (tối đa ms) — tránh lệch nhịp canvas / requestAnimationFrame. */
const waitFor = async (expr, ms = 5000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr).catch(() => false)) return true; await sleep(100); } return !!(await ev(expr).catch(() => false)); };

// ===== 1. Người chơi mới, desktop, chuột =====
await view(1280, 900, false); await touch(false); press = click;
await nav(); await ev("localStorage.clear()"); await nav();
check("người mới: hiện bảng cách chơi", await visible("#ovHelp"));
await pressSel("#helpOk");
check("ruộng 25 ô (homepage check dựa vào)", await ev('document.querySelectorAll("#field .plot").length===25'));
check("HUD: xu 24, cấp 1, kho 0/60", (await text("#hCoins")) === "24" && (await text("#hLevel")) === "1" && (await text("#hStore")) === "0/60");
check("nhiệm vụ 1/8 hiện kèm chân dung Chị Ba", await visible("#quest") && /Gieo 3 hạt/.test(await text("#qTitle")) && await ev("!!document.querySelector('#quest .face[style*=\"--r:1\"]')"));
check("mũi tên chỉ vào ô đất trống", await ev("!!document.querySelector('#field .plot.qhl.qarrow')"));
check("khay hạt: 6 cây (có Lúa khoá cấp 6, không có Mía)", await ev("document.querySelectorAll('#seeds .seed').length===6&&/Cấp 6/.test(document.querySelector('#seeds .seed[data-id=lua]').textContent)&&!document.querySelector('[data-id=mia]')"));
await shot("01-desktop-moi.png");

await plot(12);
check("TLC12-01: gieo 1 hạt → NV1 1/3, mũi tên vẫn chỉ ô trống", (await S("s.plots[12].crop")) === "ca-rot" && !(await visible("#qClaim")) && (await text("#qProg")) === "1/3" && await ev("!!document.querySelector('#field .plot.qhl.qarrow:not([data-i=\"12\"])')"));
await plot(6); await plot(7);
check("gieo đủ 3 hạt tặng → NV1 xong (nút Nhận), còn 0 hạt tặng", (await S("s.freeSeeds")) === 0 && (await S("s.plots[7].crop")) === "ca-rot" && await visible("#qClaim"));
await claim();
check("nhận thưởng NV1: +6 xu, sang NV2 tưới cây", (await S("s.coins")) === 30 && (await questId()) === "tuoi-cay");
check("NV2: chỉ vào nút Tưới nước", await ev("document.getElementById('waterTool').classList.contains('qhl')"));
await pressSel("#waterTool"); await plot(12);
check("tưới → ô ướt, NV2 xong", await S("s.plots[12].watered") && await visible("#qClaim"));
await claim();
check("NV3 khi cây chưa chín: mũi tên chờ ở ô đang lớn, gợi ý 'Chờ cây chín…' / 'Tưới'", await ev("!!document.querySelector('#field .plot.qhl')") && /Chờ cây chín|Tưới cây/.test(await text("#qHint")), await text("#qHint"));
await advance(31_000);
check("tua đồng hồ 31 giây → cây chín, có viền chỉ vào ô chín", await ev("document.querySelectorAll('#field .plot.ready').length===3") && await ev("!!document.querySelector('#field .plot.ready.qhl')"));
await pressSel("#allBtn");
check("Thu hết → 3 cà rốt vào kho, kho 3/60, NV3 xong", (await S("s.inv['ca-rot']")) === 3 && (await text("#hStore")) === "3/60" && await visible("#qClaim"));
// Đường XP 60·cấp²: 3 cà rốt + thưởng NV1–3 chưa đủ cấp 2 ⇒ đặt XP thiếu đúng phần thưởng NV3 (như đã cày thêm vài vụ), nhận thưởng ⇒ lên cấp 2.
check("3 vụ đầu chưa đủ lên cấp 2 (đường XP mới)", (await S("s.level")) === 1);
const need1 = await ev("import('./core/progression.js?v=m13').then(m=>m.xpNeed(1))");
const nv3Xp = await ev("import('./data/quests.js?v=m13').then(m=>m.TUTORIAL[2].reward.xp)");
await ev(`(()=>{const s=__game.state;s.xp=${need1 - nv3Xp};__game.state=s})()`);
await claim();
check("lên cấp 2 (toast báo mở khoá Dâu tây)", (await S("s.level")) === 2);
check("TLC12-01: NV4 mũi tên chỉ nút Bán (không phải Bán hết)", await ev("document.getElementById('sellTool').classList.contains('qhl')&&!document.getElementById('sellAll')?.classList.contains('qhl')"));
await pressSel("#sellTool");
check("TLC12-01: mở Kho ⇒ mũi tên chỉ 'Bán 1' cà rốt", await ev(`!!document.querySelector('#whBody [data-act="sell1"][data-id="ca-rot"].qhl')`));
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
  (await ev(`import('./logic.js?v=m13').then(L=>L.apply(__game.state,{type:'deliver',slot:0,id:${order0.id},rev:${order0.rev}},Date.now()+(window.__ntOffset||0)).err)`)) === "order-changed");
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
check("NV7 lên cấp 3 đang mở (M3: Nhà kho xây từ cấp 3)", (await questId()) === "len-cap-3");
await ev(`(()=>{const s=__game.state;s.level=3;s.xp=0;__game.state=s})()`);
await sleep(300);
await ev(`import('./logic.js?v=m13').then(L=>{const r=L.apply(__game.state,{type:'tick'},Date.now()+(window.__ntOffset||0));__game.state=__game.state})`);
await claim();
check("NV8 xây Nhà kho: chỉ vào lô bản vẽ Nhà kho trên bản đồ", (await questId()) === "xay-nha-kho" && await ev("document.querySelector('.bld[data-id=\"nha-kho\"]').classList.contains('qhl')"));
await pressSel('.bld[data-id="nha-kho"]');
check("chạm lô Nhà kho ⇒ thẻ xây: 60 xu, xây ngay", await visible("#ovBuild") && /60 xu/.test(await text("#buildBody")) && /xây ngay/.test(await text("#buildBody")));
await pressSel("#buildOk");
check("xây Nhà kho ⇒ NV8 xong, kho vẫn 60 chỗ", (await text("#hStore")).endsWith("/60") && await visible("#qClaim") && (await S("s.buildings['nha-kho'].level")) === 1);
await claim();
await pressSel("#stockTool");
await pressSel("#whUpgrade");
check("nâng kho 60 → 90 (bảng Kho ⇒ startUpgrade nha-kho)", (await text("#hStore")).endsWith("/90"));

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
check("v2 → v3: xu 137, cấp 3, XP 12, ô mua, kho (vượt 60 vẫn giữ), cây đang trồng, nâng cấp, đơn cũ", mig.v === 7 && mig.c === 137 && mig.l === 3 && mig.x === 12 && mig.b === 1 && mig.inv["ca-chua"] === 70 && mig.ngo === "ngo" && mig.ngoAt === t2 + 120_000 && mig.d === "dau-tay" && mig.up === 1 && JSON.stringify(mig.o0) === JSON.stringify({ "dau-tay": 2, "ca-chua": 1 }) && mig.slots === 4, JSON.stringify(mig));
check("v2: giữ bản gốc ở wgp.nongtrai.v2.backup và không xoá v2; đã ghi v7", await ev(`localStorage.getItem('wgp.nongtrai.v2.backup')===localStorage.getItem('wgp.nongtrai.v2')&&!!localStorage.getItem('wgp.nongtrai.v2')&&JSON.parse(localStorage.getItem('wgp.nongtrai.v7')).v===7`));
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
check("mobile: HUD — số kho không bị che / tràn khỏi ô chỉ số", await ev("(()=>{const a=document.getElementById('hStore').getBoundingClientRect(),b=document.querySelector('.stats').getBoundingClientRect(),c=document.getElementById('allBtn').getBoundingClientRect();return a.right<=b.right&&(b.right<=c.left||b.bottom<=c.top)})()"));
await shot("06-mobile-chinh.png");
// TLC12-04: 999.999.999 xu ⇒ HUD vẫn 1 hàng (số gọn "999tr", số đủ ở title)
{
  const hudH = () => ev("Math.round(document.querySelector('.hud .stats').getBoundingClientRect().height)");
  const h0 = await hudH(), c0 = await S("s.coins");
  await ev("(()=>{const s=__game.state;s.coins=999999999;__game.state=s})()"); await sleep(300);
  const h1 = await hudH();
  check("TLC12-04: 999.999.999 xu ở 390 ⇒ HUD không cao thêm, số gọn '999tr', title đủ số", h1 <= h0 && (await text("#hCoins")) === "999tr" &&
    /999\.999\.999 xu/.test(await ev("document.getElementById('hCoins').closest('.stat').title")), `h ${h0}→${h1} '${await text("#hCoins")}'`);
  await ev(`(()=>{const s=__game.state;s.coins=${c0};__game.state=s})()`); await sleep(200);
}
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
check("mobile: chạm ô → gieo được, NV1 1/3", (await S("s.plots[12].crop")) === "ca-rot" && (await text("#qProg")) === "1/3");
check("mobile: thanh nhiệm vụ không tràn", await noOverflowX());
await shot("09-mobile-nhiem-vu.png");
// TLC12-01: bot chỉ chạm vào ô sáng (.qhl) — hồ sơ mới ở 390 đi hết NV1→NV5, không có nhịp nào thiếu ô sáng (trừ lúc chờ cây: tua giờ)
{
  await ev("localStorage.clear()"); await nav(BASE);
  if (await visible("#helpOk")) await pressSel("#helpOk");
  let miss = 0, worstMiss = 0, steps = 0, opened = false;
  const goal = () => ev("import('./logic.js?v=m13').then(L=>L.tutorialGoal(__game.state,Date.now()+(window.__ntOffset||0)))");
  while ((await S("s.quests.tut")) < 5 && steps < 80) {
    steps++;
    const g = await goal();
    if (g?.detour && await ev("document.getElementById('quest').classList.contains('open')")) opened = true;
    if (g?.do === "wait") { await advance(g.ms + 600); continue; }
    if (!(await visible(".qhl"))) { miss++; worstMiss = Math.max(worstMiss, miss); await sleep(300); continue; }
    miss = 0;
    await pressSel(".qhl");
  }
  check("TLC12-01: bot chỉ chạm ô sáng ⇒ xong NV1–NV5 ở 390", (await S("s.quests.tut")) >= 5 && (await S("s.stats.delivered")) === 1, `tut=${await S("s.quests.tut")} bước=${steps}`);
  check("TLC12-01: không có nhịp nào thiếu ô sáng quá 1 lần", worstMiss <= 1, `worstMiss=${worstMiss}`);
  check("TLC12-01: lúc phải chờ / đi vòng, gợi ý nhiệm vụ tự mở trên điện thoại", opened);
}
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
  (await ev(`import('./logic.js?v=m13').then(L=>L.apply(__game.state,{type:'collect',machine:'bep-sen',uid:${uid2}},Date.now()+(window.__ntOffset||0)).err)`)) === "not-found");
await claim();
await shot("m2-06-nhan-mut.png");
// đơn kết hợp có thành phẩm (cấp 5): sinh tự nhiên bằng luật (bỏ đơn → đơn mới sau 2 phút)
await ev(`(()=>{const s=__game.state;s.level=5;s.xp=0;__game.state=s})()`);
const comboSlot = await ev(`import('./logic.js?v=m13').then(L=>{const s=__game.state;for(let k=0;k<400;k++){const i=s.orders.slots.findIndex(x=>x.order&&x.order.type==='ket-hop'&&x.order.items['mut-dau']);if(i>=0){__game.state=s;return i}
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
const stallPainted = "(()=>{const c=document.getElementById('mkStall');if(!c||!c.width)return false;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=40)if(d[i])n++;return n>2000})()";
await waitFor(stallPainted); // canvas quầy vẽ sau khi atlas nạp + rAF ⇒ chờ có pixel thay vì đọc ngay (từng chập chờn)
check("chạm sạp trên bản đồ ⇒ cảnh Khu chợ: gian quầy + Cô Hai (canvas), bong bóng thoại, bảng giá ↑↓·, 'đổi giá sau h:mm:ss'",
  (await ev("__game.scene")) === "market" && /Cô Hai/.test(await text("#mkBubble")) && /[↑↓·]/.test(await text("#mkBoard")) && /đổi giá sau (\d+:)?\d+:\d\d/.test(await text("#mkChange")) && // còn < 1 giờ ⇒ đồng hồ m:ss (từng làm check chập chờn theo giờ chạy)
  await ev(stallPainted), [await ev("__game.scene"), await text("#mkBubble"), await text("#mkChange"), await ev(stallPainted)].join(" | "));
const mutLeft = await S("s.inv['mut-dau']||0");
if (!mutLeft) await ev(`(()=>{const s=__game.state;s.inv['sot-ca-chua']=1;__game.state=s})()`); // dự phòng nếu đơn đòi hết mứt
const prodId = mutLeft ? "mut-dau" : "sot-ca-chua";
const want = await ev(`import('./logic.js?v=m13').then(L=>({p:L.priceOf('${prodId}',Date.now()+(window.__ntOffset||0)),t:L.MARKET.trend('${prodId}',Date.now()+(window.__ntOffset||0))}))`);
check("kệ Bán: thành phẩm hiện giá hôm nay + mũi tên xu hướng", new RegExp(`${want.p} xu ${want.t === "·" ? "·" : want.t}`).test(await text("#mkSell")));
await shot("m2-08-khu-cho.png");
const c1 = await S("s.coins");
await pressSel(`#mkSell [data-act=sell][data-id="${prodId}"][data-n="1"]`);
check(`Bán 1 ${prodId} ở chợ: +${want.p} xu (market.priceOf)`, (await S("s.coins")) === c1 + want.p);
const c2 = await S("s.coins");
await pressSel('#mkBuy [data-act=buy][data-id="thuc-an-gia-suc"]');
check("Mua thức ăn gia súc (cấp 7): −72 xu (giá M6), vào kho", (await S("s.coins")) === c2 - 72 && (await S("s.inv['thuc-an-gia-suc']")) === 1);
check("hạt giống ghi 'trả khi gieo' + nút Gieo; món khoá hiện cấp", /trả khi gieo/.test(await text("#mkBuy")) && /Cấp \d+/.test(await text("#mkBuy")));
// Nhà kho dùng cùng giá chợ
await pressSel("#marketScene [data-back]"); await pressSel("#stockTool");
const whOk = await ev(`import('./logic.js?v=m13').then(L=>{const s=__game.state,t=Date.now()+(window.__ntOffset||0),q=s.inv['ca-chua'];const b=document.querySelector('#whBody [data-act=sellN][data-id="ca-chua"]');return !!b&&b.textContent.includes((q*L.priceOf('ca-chua',t)).toLocaleString('vi-VN')+' xu')})`);
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

// ===== 7. Milestone 3: chế độ Xây, Nhà kho / Nhà kính / Khu đất phía Đông, trang trí (desktop, chuột) =====
await view(1280, 900, false); await touch(false); press = click;
await ev("localStorage.clear()"); await nav(BASE);
await pressSel("#helpOk");
// người chơi cấp 10 đã xong mọi nhiệm vụ (seed qua state), có 4 ván gỗ cho Nhà kính
await ev(`(()=>{const s=__game.state;s.level=10;s.xp=0;s.coins=3000;s.quests.tut=13;s.quests.progress=0;s.inv={'van-go':4};__game.state=s})()`);
await sleep(400);
const bld = (id) => `.bld[data-id="${id}"]`;
const bstat = (id) => ev(`(()=>{const b=document.querySelector('${bld(id)}');return b&&!b.hidden?b.dataset.status+'|'+b.dataset.view+'|'+b.querySelector('.market-tag').textContent:null})()`);
check("M3 cấp 10 (ngoài chế độ Xây): bản vẽ 'Có thể xây' của Nhà kho + Nhà kính + chuồng gà / bò (M4) hiện trên bản đồ",
  /^available\|blueprint\|Có thể xây/.test(await bstat("nha-kho")) && /^available/.test(await bstat("nha-kinh")) && /^available\|blueprint/.test(await bstat("chuong-ga")) && /^available\|blueprint/.test(await bstat("chuong-bo")));
await pressSel("#buildBtn");
check("nút Xây (búa) ⇒ chế độ Xây: thanh trạng thái, ruộng mờ, nhãn trạng thái chuẩn", await visible("#buildBar") && await ev("document.getElementById('farm').classList.contains('building')") &&
  /Nâng cấp được/.test(await bstat("nha")) /* M5: Nhà nâng bậc danh tiếng từ cấp 10 */ && /Nâng cấp được/.test(await bstat("sap-cho")) && /Có thể xây/.test(await bstat("nha-kinh")) && /^available\|blueprint\|Có thể xây/.test(await bstat("chuong-ga")),
  [await bstat("nha"), await bstat("sap-cho"), await bstat("chuong-ga")].join(" / "));
check("bản vẽ lo-ban-ve vẽ từ buildings.webp", await ev(`getComputedStyle(document.querySelector('${bld("nha-kinh")} .spr')).backgroundImage.includes('buildings.webp')`));
await pressSel(bld("chuong-ga"));
check("chuồng gà (Milestone 4): thẻ xây thật — 300 xu, 2:00, 6 gà, nút Xây bật", await visible("#ovBuild") && await visible("#buildOk") && !(await ev("document.getElementById('buildOk').disabled")) && /300 xu/.test(await text("#buildBody")) && /2:00/.test(await text("#buildBody")) && /6 gà/.test(await text("#buildBody")));
await pressSel("#buildCancel");
await shot("m3-01-che-do-xay.png");
await pressSel(bld("nha-kho"));
check("thẻ xây Nhà kho: giá 60 xu (có/cần), xây ngay, hiệu ứng, khung ui-kit", /60 xu/.test(await text("#buildBody")) && /xây ngay/.test(await text("#buildBody")) && /bạn có 3\.000/.test(await text("#buildBody")));
await pressSel("#buildOk");
check("xây Nhà kho (tức thì): công trình hiện trên bản đồ, HUD kho 0/60, −60 xu", /^upgradeable\|built/.test(await bstat("nha-kho")) && (await text("#hStore")) === "0/60" && (await S("s.coins")) === 2940);
await pressSel(bld("nha-kho"));
check("Nhà kho 'Nâng cấp được' ⇒ thẻ nâng: 60 → 90 chỗ, 80 xu", /Nâng cấp được/.test(await text("#buildBody")) && /90 chỗ/.test(await text("#buildBody")) && /Nâng cấp · 80 xu/i.test(await text("#buildOk")));
await pressSel("#buildOk");
check("nâng kho ⇒ HUD kho đổi 0/90 ngay", (await text("#hStore")) === "0/90" && (await S("s.warehouse")) === 1);
await pressSel(bld("nha-kinh"));
check("thẻ Nhà kính: 900 xu, 4/4 ván gỗ, 5 phút, mía + không cần tưới", /900 xu/.test(await text("#buildBody")) && /4\/4/.test(await text("#buildBody")) && /5:00/.test(await text("#buildBody")) && /không cần tưới/.test(await text("#buildBody")));
await shot("m3-02-the-xay-nha-kinh.png");
await pressSel("#buildOk");
await sleep(300);
check("xây Nhà kính ⇒ giàn giáo gian-giao + 'Đang xây' + thanh tiến độ, trừ ván gỗ", /^building\|scaffold\|Đang xây \d:\d\d/.test(await bstat("nha-kinh")) &&
  await ev(`!document.querySelector('${bld("nha-kinh")} .lot-bar').hidden`) && !(await S("s.inv['van-go']||0")), await bstat("nha-kinh"));
await shot("m3-03-gian-giao.png");
await advance(301_000); await sleep(1300);
check("tua 5 phút ⇒ Nhà kính xong (sprite nha-kinh), báo xây xong", /^(done|upgradeable)\|built/.test(await bstat("nha-kinh")) && await ev(`getComputedStyle(document.querySelector('${bld("nha-kinh")} .spr')).backgroundPosition.startsWith('66.6')`), await bstat("nha-kinh"));
await pressSel("#buildExit");
check("thoát chế độ Xây", !(await visible("#buildBar")) && !(await ev("document.getElementById('farm').classList.contains('building')")));
check("khay hạt ruộng chính không có Mía; luật chặn mía ở ô thường", await ev("!document.querySelector('#seeds [data-id=mia]')") &&
  (await ev(`import('./logic.js?v=m13').then(L=>L.apply(structuredClone(__game.state),{type:'plant',i:12,crop:'mia'},Date.now()+(window.__ntOffset||0)).err)`)) === "greenhouse-only");
await pressSel(bld("nha-kinh"));
check("chạm Nhà kính ⇒ bảng Nhà kính: 6 ô, hạt Mía chọn sẵn", await visible("#ovGreenhouse") && (await ev("[...document.querySelectorAll('#ghGrid .plot')].filter(b=>!b.hidden).length")) === 6 &&
  await ev("document.querySelector('#ghSeeds [data-id=mia]').getAttribute('aria-checked')==='true'"));
await pressSel('#ghGrid .plot[data-i="34"]');
check("gieo mía ở ô Nhà kính 34: đã tưới sẵn (không cần tưới), −24 xu", (await S("s.plots[34].crop")) === "mia" && await S("s.plots[34].watered") && (await S("s.coins")) === 2940 - 80 - 900 - 24);
await shot("m3-04-nha-kinh-mia.png");
await pressSel("#ghClose");

// ---- cấp 17: Khu đất phía Đông ----
await ev(`(()=>{const s=__game.state;s.level=17;s.coins=20000;s.inv={'van-go':8,'hop-dinh':8};__game.state=s})()`);
await sleep(400);
check("cấp 17: bản đồ rộng 1,5 lần, dải đất phía Đông hé ra (cuộn ngang trong khung, trang không tràn)", (await ev("getComputedStyle(document.getElementById('farmMap')).getPropertyValue('--bw').trim()")) === "1.5" &&
  await visible("#eastWild") && await ev("(()=>{const f=document.getElementById('farm');return f.scrollWidth>f.clientWidth+50})()") && await noOverflowX());
await pressSel("#buildBtn");
await pressSel(bld("dat-phia-dong"));
check("thẻ Khu đất phía Đông: 15.000 xu, 8 ván gỗ + 8 hộp đinh, +9 ô", /15\.000 xu/.test(await text("#buildBody")) && /8\/8/.test(await text("#buildBody")) && /\+9 ô/.test(await text("#buildBody")));
await pressSel("#buildOk");
check("mở đất ⇒ giàn giáo + đồng hồ", /^building\|scaffold/.test(await bstat("dat-phia-dong")));
await advance(301_000); await sleep(1500);
check("tua 5 phút ⇒ 9 ô phía Đông (25–33) hiện trên bản đồ, dải hoang biến mất", !(await visible("#eastWild")) && await visible("#fieldEast") &&
  (await ev("[...document.querySelectorAll('#fieldEast .plot')].filter(b=>!b.hidden).map(b=>+b.dataset.i).join(',')")) === "25,26,27,28,29,30,31,32,33");
await pressSel("#buildExit");
await pressSel(`#fieldEast .plot[data-i="25"]`);
check("ô phía Đông 25 gieo được (hạt đang chọn)", (await S("s.plots[25].crop")) === "ca-rot", await S("JSON.stringify(s.plots[25])"));
await shot("m3-05-dat-phia-dong.png");

// ---- trang trí: mua ở chợ ⇒ đặt lên ô ⇒ cất lại ----
await pressSel("#marketTool");
await pressSel('#mkBuy [data-act=buy][data-id="chau-hoa"]');
check("mua Chậu hoa ở chợ ⇒ vào túi trang trí", (await S("s.decor['chau-hoa']")) === 1);
await pressSel("#marketScene [data-back]");
await pressSel("#buildBtn");
check("chế độ Xây: ô trang trí viền vàng (≥ 44px)", await ev("document.querySelectorAll('#slotLayer .dslot').length>=9") &&
  await ev("[...document.querySelectorAll('#slotLayer .dslot')].every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})"));
await pressSel('#slotLayer .dslot[data-slot="hien-nha"]');
check("chạm ô ⇒ bảng chọn đồ trong túi", await visible("#ovDecor") && /Chậu hoa/.test(await text("#decorBody")));
await pressSel('#decorBody [data-act=place][data-id="chau-hoa"]');
check("đặt Chậu hoa ⇒ hiện trên bản đồ (decor.webp), túi −1", (await S("JSON.stringify(s.decorPlaced)")) === JSON.stringify([{ id: "chau-hoa", slot: "hien-nha" }]) && !(await S("s.decor['chau-hoa']||0")) &&
  await ev(`getComputedStyle(document.querySelector('#decorLayer [data-slot="hien-nha"]')).backgroundImage.includes('decor.webp')`),
  await S("JSON.stringify([s.decorPlaced,s.decor])") + " " + await ev(`(document.querySelector('#decorLayer [data-slot="hien-nha"]')||{}).outerHTML`));
await shot("m3-06-trang-tri.png");
await pressSel('#slotLayer .dslot[data-slot="hien-nha"]');
await pressSel('#decorBody [data-act=remove]');
check("cất Chậu hoa ⇒ về túi, ô trống", (await S("s.decor['chau-hoa']")) === 1 && (await S("s.decorPlaced.length")) === 0 && !(await ev(`!!document.querySelector('#decorLayer [data-slot="hien-nha"]')`)));
await pressSel('#slotLayer .dslot[data-slot="goc-ruong-tl"]');
await pressSel('#decorBody [data-act=place][data-id="chau-hoa"]');
// ---- tải lại giữ mọi thứ ----
const snapM3 = await S("JSON.stringify({b:s.buildings,d:s.decor,dp:s.decorPlaced,p25:s.plots[25].crop,p34:s.plots[34].crop,w:s.warehouse,c:s.coins})");
await reload();
check("tải lại: công trình, trang trí, ô phía Đông + Nhà kính, kho giữ nguyên; bản đồ vẫn vẽ đúng", (await S("JSON.stringify({b:s.buildings,d:s.decor,dp:s.decorPlaced,p25:s.plots[25].crop,p34:s.plots[34].crop,w:s.warehouse,c:s.coins})")) === snapM3 &&
  (await text("#hStore")).endsWith("/90") && await visible("#fieldEast") && await ev(`!!document.querySelector('#decorLayer [data-slot="goc-ruong-tl"]')`), snapM3);
// ---- mobile 390×844: chế độ Xây ----
await view(390, 844, true, 2); await touch(true); press = tap;
await reload();
await pressSel("#buildBtn");
check("mobile 390: chế độ Xây — trang không tràn ngang, bản đồ cuộn trong khung", await visible("#buildBar") && await noOverflowX() &&
  await ev("(()=>{const f=document.getElementById('farm');return f.scrollWidth>f.clientWidth})()"), await ev("document.documentElement.scrollWidth"));
check("mobile: công trình / ô trang trí / nút Xây ≥ 44px", await ev(`[...document.querySelectorAll('.bld:not([hidden]):not(.static), #slotLayer .dslot, #buildBtn, #buildExit')].every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})`),
  await ev(`[...document.querySelectorAll('.bld:not([hidden]):not(.static), #slotLayer .dslot')].filter(b=>{const r=b.getBoundingClientRect();return r.width<44||r.height<44}).map(b=>(b.dataset.id||b.dataset.slot)+Math.round(b.getBoundingClientRect().width)).join(',')`));
await shot("m3-07-mobile-che-do-xay.png");
await pressSel(bld("nha-kho"));
check("mobile: thẻ nâng kho vừa màn, nút ≥ 44px", await visible("#ovBuild") && await noOverflowX() && await ev("document.querySelector('.build-card').getBoundingClientRect().right<=innerWidth") &&
  await ev("[...document.querySelectorAll('#ovBuild .actions .btn')].filter(b=>b.offsetParent).every(b=>b.getBoundingClientRect().height>=44)"));
await shot("m3-08-mobile-the-xay.png");
await pressSel("#buildCancel");
await ev("document.getElementById('farm').scrollLeft=99999"); await sleep(200);
await shot("m3-09-mobile-phia-dong.png");
await pressSel("#buildExit");
await view(1280, 900, false); await touch(false); press = click;
await reload();
await shotFull("m3-10-desktop-toan-trang.png");

// ===== 8. Milestone 4: Chăn nuôi (chuồng gà / bò), Làng (NPC, bảng nhiệm vụ), xe giao hàng — trong game thật (desktop, chuột) =====
await view(1280, 900, false); await touch(false); press = click;
await ev("localStorage.clear()"); await nav(BASE);
await pressSel("#helpOk");
// người chơi cấp 9 đã xong hướng dẫn + tiến trình M2 (seed qua state), có Cối xay để có thức ăn
await ev(`(()=>{const s=__game.state;s.level=9;s.xp=0;s.coins=5000;s.quests.tut=13;s.quests.progress=0;s.inv={'thuc-an-gia-suc':4,'ngo':6};__game.state=s})()`);
await sleep(500);
const tnow = () => "Date.now()+(window.__ntOffset||0)";
const QLEN = await ev("import('./data/quests.js?v=m13').then(m=>m.QUESTS.length)");
check("M4 seed: sổ M1/M2 đã xong (" + QLEN + " nhiệm vụ) ⇒ thanh nhiệm vụ hiện tiến trình Chăn nuôi 1/6 'Xây chuồng gà'", QLEN === 13 && await visible("#quest") && /Chăn nuôi 1\/6/.test(await text("#qStep")) && /Xây chuồng gà/.test(await text("#qTitle")), await text("#quest"));
check("M4: nút điều hướng 'Chăn nuôi' + 'Làng' mở (không khoá), biển Làng hiện trên bản đồ và chạm được",
  await visible("#animalsTool") && !(await ev("document.getElementById('animalsTool').classList.contains('is-locked')")) && /^Làng/.test(await text("#villageTool")) &&
  await visible('.bld[data-id="bien-lang"]') && (await ev("document.querySelector('.bld[data-id=\"bien-lang\"]').tagName")) === "BUTTON");
await shot("m4-01-ban-do-cap-9.png");
// xây chuồng gà: chạm bản vẽ ⇒ thẻ ⇒ Xây ⇒ giàn giáo ⇒ tua 2 phút ⇒ xong
await pressSel(bld("chuong-ga"));
check("chạm bản vẽ chuồng gà ⇒ thẻ xây 300 xu / 2:00", await visible("#ovBuild") && /300 xu/.test(await text("#buildBody")) && /2:00/.test(await text("#buildBody")));
await pressSel("#buildOk");
await sleep(300);
check("xây chuồng gà ⇒ giàn giáo + đồng hồ, −300 xu; chưa mua gà được khi đang xây", /^building\|scaffold\|Đang xây/.test(await bstat("chuong-ga")) && (await S("s.coins")) === 4700 &&
  (await ev(`import('./logic.js?v=m13').then(L=>L.apply(structuredClone(__game.state),{type:'buyAnimal',kind:'ga'},${tnow()}).err)`)) === "no-housing");
await shot("m4-02-chuong-ga-gian-giao.png");
await advance(121_000); await sleep(1300);
check("tua 2 phút ⇒ chuồng gà xong (sprite chuong-ga), nhiệm vụ 'Xây chuồng gà' xong (nút Nhận)", /^(done|upgradeable)\|built\|Chuồng gà/.test(await bstat("chuong-ga")) && await visible("#qClaim"), await bstat("chuong-ga"));
await claim();
check("nhận thưởng tiến trình M4 qua thanh nhiệm vụ: +40 xu, sang 'Mua con gà đầu tiên' (2/6)", (await S("s.coins")) === 4740 && /Chăn nuôi 2\/6/.test(await text("#qStep")) && (await S("s.village.prog.i")) === 1);
// vào Khu chăn nuôi từ bản đồ
await pressSel(bld("chuong-ga"));
await waitFor("document.documentElement.classList.contains('m4-art-ready')");
check("chạm chuồng gà ⇒ cảnh Chăn nuôi (#chan-nuoi), bản đồ ẩn, chuồng trống dạy bước mua", (await ev("__game.scene")) === "animals" && (await ev("location.hash")) === "#chan-nuoi" &&
  (await ev("document.getElementById('farm').offsetParent===null")) && /Chuồng còn trống/.test(await text('#animalsScene .an-pen[data-kind="ga"] .an-empty')));
await pressSel('#animalsScene [data-act="buy"][data-kind="ga"]');
check("Mua gà: −60 xu, 1 con đói, nhiệm vụ 'Mua con gà đầu tiên' xong", (await S("s.animals.list.length")) === 1 && (await S("s.coins")) === 4680 && (await S("s.animals.list[0].kind")) === "ga" && await visible("#qClaim"));
await claim();
check("nhận thưởng: +20 xu, +2 bao thức ăn", (await S("s.coins")) === 4700 && (await S("s.inv['thuc-an-gia-suc']")) === 6);
await sleep(300);
await pressSel('#animalsScene .an-tap[data-uid="1"]');
check("chạm gà đói ⇒ cho ăn: −1 bao, đang đẻ (đồng hồ 4:00)", (await S("s.inv['thuc-an-gia-suc']")) === 5 && (await ev('document.querySelector(\'#animalsScene .an-tap[data-uid="1"]\').dataset.state')) === "producing" && /[34]:\d\d/.test(await text('#animalsScene .an-tap[data-uid="1"]')));
const yardPainted = (k) => `(()=>{const c=document.querySelector('#animalsScene .an-pen[data-kind="${k}"] canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=16)if(d[i])n++;return n>1500})()`;
check("sân gà vẽ từ animals.webp + buildings.webp (canvas có pixel)", await waitFor(yardPainted("ga")));
await shot("m4-03-chan-nuoi-cho-an.png");
await advance(241_000); await sleep(1300);
check("tua 4 phút ⇒ gà có trứng (bong bóng), nút 'Thu tất cả (1)'", (await ev('document.querySelector(\'#animalsScene .an-tap[data-uid="1"]\').dataset.state')) === "ready" && /Thu tất cả \(1\)/.test(await text('#animalsScene [data-act="collectAll"]')));
const xpEgg = await S("s.xp");
await pressSel('#animalsScene .an-tap[data-uid="1"]');
check("chạm bong bóng ⇒ +1 trứng gà vào kho, +2 XP, gà đói lại; nhiệm vụ 'Thu quả trứng đầu tiên' xong", (await S("s.inv['trung-ga']")) === 1 && (await S("s.xp")) === xpEgg + 2 && (await ev('document.querySelector(\'#animalsScene .an-tap[data-uid="1"]\').dataset.state')) === "hungry" && await visible("#qClaim"));
await claim();
// đơn có trứng: bộ sinh đơn thật đòi trứng khi đã có gà (bỏ đơn → đơn mới sau 2 phút)
const eggSlot = await ev(`import('./logic.js?v=m13').then(L=>{const s=__game.state;for(let k=0;k<600;k++){const i=s.orders.slots.findIndex(x=>x.order&&x.order.items['trung-ga']&&x.order.items['trung-ga']<=(s.inv['trung-ga']||0));if(i>=0){__game.state=s;return i}
  const j=k%s.orders.slots.length,x=s.orders.slots[j],t=Date.now()+(window.__ntOffset||0);if(x.order)L.apply(s,{type:'cancelOrder',slot:j,id:x.order.id,rev:x.rev},t);window.__ntOffset=(window.__ntOffset||0)+121000;L.apply(s,{type:'tick'},Date.now()+window.__ntOffset)}__game.state=s;return -1})`);
check("có gà ⇒ bảng đơn đòi trứng gà (sinh theo luật, đúng số trứng của đàn)", eggSlot >= 0, String(eggSlot));
const eggOrder = await S(`s.orders.slots[${eggSlot}].order`);
await ev(`(()=>{const s=__game.state;const o=s.orders.slots[${eggSlot}].order;for(const [id,q] of Object.entries(o.items))if(id!=='trung-ga')s.inv[id]=Math.max(s.inv[id]||0,q);__game.state=s})()`);
// tải lại giữ đơn có trứng (loadOrder nhận món chăn nuôi)
await reload("#chan-nuoi");
check("tải lại: đơn có trứng vẫn còn nguyên (id, món), vẫn ở cảnh Chăn nuôi", (await S(`s.orders.slots[${eggSlot}].order&&s.orders.slots[${eggSlot}].order.id`)) === eggOrder.id &&
  (await S(`JSON.stringify(s.orders.slots[${eggSlot}].order.items)`)) === JSON.stringify(eggOrder.items) && (await ev("__game.scene")) === "animals");
await pressSel('#animalsScene [data-act="back"]');
check("← Nông trại ⇒ về bản đồ, hash bỏ", (await ev("__game.scene")) === "farm" && (await ev("location.hash")) === "");
await pressSel("#ordersTool");
check("phiếu đơn hiện Trứng gà, đủ hàng, nút Giao bật", /Trứng gà/.test(await text(`#slips .slip[data-slot="${eggSlot}"]`)) && await ev(`!document.querySelector('#slips [data-act=deliver][data-slot="${eggSlot}"]').disabled`));
await shotFull("m4-04-don-co-trung.png");
const cEgg = await S("s.coins");
await pressSel(`#slips [data-act=deliver][data-slot="${eggSlot}"]`);
check("giao đơn có trứng: +" + eggOrder.coins + " xu, nhiệm vụ 'Giao đơn có trứng hoặc sữa' xong; cấp 9 ⇒ xe giao hàng chưa chạy", (await S("s.coins")) === cEgg + eggOrder.coins && await visible("#qClaim") &&
  /trứng hoặc sữa/.test(await text("#qTitle")) && (await S("s.lastDeliveryAt")) > 0 && (await ev("document.querySelector('#truckLane canvas').dataset.phase")) === "idle");
await claim();
// chuồng bò (cấp 9): xây ⇒ tua ⇒ mua bò ⇒ cho ăn 2 bao ⇒ tua 8 phút ⇒ vắt sữa
await pressSel(bld("chuong-bo"));
check("thẻ chuồng bò: 600 xu, 3:00, 4 bò", /600 xu/.test(await text("#buildBody")) && /3:00/.test(await text("#buildBody")) && /4 bò/.test(await text("#buildBody")));
await pressSel("#buildOk");
await advance(181_000); await sleep(1300);
check("tua 3 phút ⇒ chuồng bò xong", /^(done|upgradeable)\|built\|Chuồng bò/.test(await bstat("chuong-bo")), await bstat("chuong-bo"));
await pressSel(bld("chuong-bo"));
await pressSel('#animalsScene [data-act="buy"][data-kind="bo-sua"]');
check("Mua bò sữa: −180 xu, 2 con trong đàn", (await S("s.animals.list.length")) === 2 && (await S("s.animals.list[1].kind")) === "bo-sua");
await ev(`(()=>{const s=__game.state;s.inv['thuc-an-gia-suc']=(s.inv['thuc-an-gia-suc']||0)+4;__game.state=s})()`);
await sleep(300);
const feedBefore = await S("s.inv['thuc-an-gia-suc']");
await pressSel('#animalsScene [data-act="feedAll"]');
check("Cho ăn tất cả: gà 1 bao + bò 2 bao (−3), cả hai đang làm", (await S("s.inv['thuc-an-gia-suc']")) === feedBefore - 3 && (await S("s.animals.list.every(a=>a.fedAt)")));
await waitFor(yardPainted("bo-sua"));
await shotFull("m4-05-chuong-bo.png");
await advance(481_000); await sleep(1300);
const milk0 = await S("s.inv['sua']||0"), eggs0 = await S("s.inv['trung-ga']||0");
await pressSel('#animalsScene [data-act="collectAll"]');
check("tua 8 phút ⇒ Thu tất cả: +1 sữa, +1 trứng", (await S("s.inv['sua']")) === milk0 + 1 && (await S("s.inv['trung-ga']")) === eggs0 + 1);
// huy hiệu trên bản đồ: trứng chờ thu trên chuồng gà
await pressSel('#animalsScene [data-act="feedAll"]');
await advance(241_000); await sleep(1300);
await pressSel('#animalsScene [data-act="back"]');
await sleep(300);
check("bản đồ: huy hiệu trứng chờ thu trên chuồng gà + số trên nút Chăn nuôi", (await text("#coopBadge")) === "1" && await visible("#coopBadge") && /1/.test(await text("#animalsTool .nav-badge")));
await shot("m4-06-huy-hieu-chuong.png");
// Làng: chạm biển Làng ⇒ cảnh Làng, trò chuyện NPC, nhận nhiệm vụ bảng
await pressSel(bld("bien-lang"));
await waitFor("!!document.querySelector('#villageScene') && !document.querySelector('#villageScene').hidden");
check("chạm biển Làng ⇒ cảnh Làng (#lang), 4 NPC, bảng 3 nhiệm vụ", (await ev("__game.scene")) === "village" && (await ev("location.hash")) === "#lang" &&
  (await ev("document.querySelectorAll('#villageScene .vl-npc').length")) === 4 && (await ev("document.querySelectorAll('#villageScene [data-act=claimBoard]').length")) === 3);
const coHai0 = await S("JSON.stringify(s.village.friends['co-hai']||{talks:0,points:0})").then(JSON.parse); // giao đơn của Cô Hai trước đó cũng cộng thân thiết
await pressSel('#villageScene .vl-npc[data-npc="co-hai"]');
await sleep(300);
check("chạm Cô Hai ⇒ trò chuyện: câu thoại đầu hiện trong thẻ + thân thiết +1", (await S("s.village.friends['co-hai'].talks")) === (coHai0.talks || 0) + 1 && (await S("s.village.friends['co-hai'].points")) === (coHai0.points || 0) + 1 && /Trời hửng nắng/.test(await text("#villageScene")),
  await S("JSON.stringify(s.village.friends['co-hai'])") + " trước " + JSON.stringify(coHai0));
await shotFull("m4-07-lang-tro-chuyen.png");
// một ô bảng đã đủ tiến độ (như đã giao 3 đơn) ⇒ nút Nhận thưởng
const slot0 = await S("JSON.stringify(s.village.board.slots[0])");
await ev(`import('./data/village.js?v=m13').then(V=>{const s=__game.state;const sl=s.village.board.slots[0];sl.progress=V.REPEATABLE_BY_ID[sl.tpl].count;__game.state=s})`);
await sleep(400);
const bReward = await ev(`import('./data/village.js?v=m13').then(V=>V.REPEATABLE_BY_ID[__game.state.village.board.slots[0].tpl].reward)`);
const cB = await S("s.coins"), uid0 = JSON.parse(slot0).uid;
check("Làng: huy hiệu '!' khi có nhiệm vụ chờ nhận", /!/.test(await text("#villageTool")));
await pressSel(`#villageScene [data-act="claimBoard"][data-uid="${uid0}"]`);
check("nhận nhiệm vụ bảng: +" + bReward.coins + " xu, ô được thay bằng nhiệm vụ mới", (await S("s.coins")) === cB + bReward.coins && !(await S(`s.village.board.slots.some(x=>x.uid===${uid0})`)) && (await S("s.village.board.slots.length")) === 3);
// tải lại giữ mọi thứ (đàn, làng, công trình, xu), mở lại đúng cảnh
const snapM4 = await S("JSON.stringify({a:s.animals,v:s.village,b:s.buildings,c:s.coins,inv:s.inv,ld:s.lastDeliveryAt})");
await reload("#lang");
check("tải lại: đàn, làng, công trình, kho, xu giữ nguyên; mở lại đúng cảnh Làng", (await S("JSON.stringify({a:s.animals,v:s.village,b:s.buildings,c:s.coins,inv:s.inv,ld:s.lastDeliveryAt})")) === snapM4 && (await ev("__game.scene")) === "village");
await reload("#chan-nuoi");
check("tải lại #chan-nuoi ⇒ cảnh Chăn nuôi", (await ev("__game.scene")) === "animals" && (await ev("document.querySelectorAll('#animalsScene .an-tap').length")) === 2);
// xe giao hàng (cấp 11): giao đơn ⇒ xe chạy vào cổng, chất hàng, chạy đi
await pressSel('#animalsScene [data-act="back"]');
await ev(`(()=>{const s=__game.state;s.level=11;s.xp=0;__game.state=s})()`);
await sleep(400);
const anySlot = await S("s.orders.slots.findIndex(x=>x.order)");
await ev(`(()=>{const s=__game.state;const o=s.orders.slots[${anySlot}].order;for(const [id,q] of Object.entries(o.items))s.inv[id]=Math.max(s.inv[id]||0,q);__game.state=s})()`);
await pressSel("#ordersTool");
await pressSel(`#slips [data-act=deliver][data-slot="${anySlot}"]`);
check("cấp 11: giao đơn ⇒ xe Anh Út chạy (pha arrive/load), xe đứng yên ẩn", await waitFor("document.querySelector('#truckLane canvas').dataset.phase!=='idle'", 1500) && (await ev("document.getElementById('farmMap').dataset.truck")) === "busy");
await sleep(1300);
await ev("document.getElementById('farm').scrollIntoView({block:'start'})");
const truckPainted = await ev("(()=>{const c=document.querySelector('#truckLane canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=16)if(d[i])n++;return n>300})()");
check("xe vẽ từ buildings.webp ở cổng (canvas có pixel)", truckPainted);
await shot("m4-08-xe-giao-hang.png");
check("sau ~4,4 giây xe chạy đi (idle), xe đứng yên hiện lại", await waitFor("document.querySelector('#truckLane canvas').dataset.phase==='idle'&&document.getElementById('farmMap').dataset.truck===''", 7000),
  await ev(`import('./core/village.js?v=m13').then(V=>document.querySelector('#truckLane canvas').dataset.phase+' / '+document.getElementById('farmMap').dataset.truck+' / '+JSON.stringify(V.truckVisit(Date.now()+(window.__ntOffset||0),__game.state.lastDeliveryAt,{level:__game.state.level}))+' / '+__game.state.lastDeliveryAt+' / '+(Date.now()+(window.__ntOffset||0)))`));
// mobile 390×844: hai cảnh, chạm
await view(390, 844, true, 2); await touch(true); press = tap;
await reload("#chan-nuoi");
await waitFor(yardPainted("ga"));
const smallIn = (sel) => `[...document.querySelectorAll('${sel} button')].filter(b=>b.offsetParent&&!b.closest('[hidden]')).filter(b=>{const r=b.getBoundingClientRect();return r.height<44||r.width<44}).map(b=>(b.dataset.act||b.className)+Math.round(b.getBoundingClientRect().width)+'x'+Math.round(b.getBoundingClientRect().height))`;
check("mobile 390: Chăn nuôi không tràn ngang, nút / con vật ≥ 44px", (await ev("__game.scene")) === "animals" && await noOverflowX() && (await ev(smallIn("#animalsScene"))).length === 0,
  await ev("document.documentElement.scrollWidth") + " " + JSON.stringify(await ev(smallIn("#animalsScene"))));
await shotFull("m4-09-mobile-chan-nuoi.png");
await pressSel('#animalsScene .an-tap[data-uid="1"]');
check("mobile: chạm gà có trứng ⇒ thu", (await ev('document.querySelector(\'#animalsScene .an-tap[data-uid="1"]\').dataset.state')) === "hungry");
await reload("#lang");
check("mobile 390: Làng không tràn ngang, NPC / nút ≥ 44px", (await ev("__game.scene")) === "village" && await noOverflowX() && (await ev(smallIn("#villageScene"))).length === 0,
  await ev("document.documentElement.scrollWidth") + " " + JSON.stringify(await ev(smallIn("#villageScene"))));
await pressSel('#villageScene .vl-npc[data-npc="bac-tu"]');
check("mobile: chạm Bác Tư ⇒ trò chuyện", (await S("s.village.friends['bac-tu'].talks")) === 1);
await shotFull("m4-10-mobile-lang.png");
await pressSel('#villageScene [data-act="back"]');
check("mobile: bản đồ có nút Chăn nuôi / Làng ≥ 44px, không tràn ngang", await noOverflowX() && await ev("['animalsTool','villageTool'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width>=44&&r.height>=44})"));
await shot("m4-11-mobile-ban-do.png");
await view(1280, 900, false); await touch(false); press = click;
// người chơi cấp thấp: nút khoá, hash bị bỏ qua
await ev("localStorage.clear()"); await send("Page.navigate", { url: "about:blank" }); await sleep(300); await nav(BASE + "#chan-nuoi");
await pressSel("#helpOk");
check("cấp 1: nút Chăn nuôi khoá 'Cấp 7', Làng khoá 'Cấp 6'; #chan-nuoi không mở cảnh", /Cấp 7/.test(await text("#animalsTool")) && /Cấp 6/.test(await text("#villageTool")) && (await ev("__game.scene")) === "farm");
await pressSel("#animalsTool");
check("chạm nút khoá ⇒ báo cấp mở, vẫn ở bản đồ", /cấp 7/.test(await text("#toast")) && (await ev("__game.scene")) === "farm");

// ===== Milestone 5: bậc Nhà (danh tiếng), gà / bò trên bản đồ, chuồng ở mép dưới không bị cắt, thanh điều hướng điện thoại, tắt tiếng chung =====
await ev(`(()=>{const s=__game.state,t=Date.now()+(window.__ntOffset||0);s.level=14;s.xp=0;s.coins=60000;s.inv['van-go']=20;s.inv['hop-dinh']=20;
  s.buildings['chuong-ga']={level:1,done:true,startAt:t-1,readyAt:t-1};s.buildings['chuong-bo']={level:1,done:true,startAt:t-1,readyAt:t-1};
  s.animals.list=[1,2,3].map(u=>({uid:u,kind:'ga',fedAt:null,readyAt:null})).concat([{uid:4,kind:'bo-sua',fedAt:null,readyAt:null}]);__game.state=s})()`);
await reload();
await waitFor("document.querySelectorAll('#farmMap .critter').length===4", 4000);
check("M5 bản đồ: 3 gà + 1 bò đi lại trước chuồng (khung animals.webp, CSS)", (await ev("document.querySelectorAll('#farmMap .critter--ga').length")) === 3 &&
  (await ev("document.querySelectorAll('#farmMap .critter--bo-sua').length")) === 1 && await ev("getComputedStyle(document.querySelector('#farmMap .critter')).backgroundImage.includes('animals.webp')"));
const inMap = (id) => `(()=>{const m=document.getElementById('farmMap').getBoundingClientRect(),b=document.querySelector('.bld[data-id="${id}"]'),t=b.querySelector('.market-tag').getBoundingClientRect(),r=b.getBoundingClientRect();return !b.hidden&&r.bottom<=m.bottom+1&&t.bottom<=m.bottom&&t.top>=m.top})()`;
check("M5 desktop: chuồng gà / chuồng bò / nhãn nằm trọn trong bản đồ (không bị cắt mép dưới)", await ev(inMap("chuong-ga")) && await ev(inMap("chuong-bo")));
await pressSel(bld("nha"));
check("chạm Nhà ⇒ thẻ nâng Nhà: danh hiệu hiện tại + bậc tiếp (+2 % xu đơn), 3 000 xu", await visible("#ovBuild") && /Nông trại nhỏ/.test(await text("#buildBody")) && /Nông trại chăm chỉ/.test(await text("#buildBody")) &&
  /\+2 % xu/.test(await text("#buildBody")) && /3\.000 xu/.test(await text("#buildOk")), await text("#buildBody"));
await pressSel("#buildOk");
await advance(121_000); await sleep(1300);
check("âm thanh: nâng Nhà kêu 'thang', xây xong kêu 'qua-man' (sfx.log)", await ev("(()=>{const l=__game.sfx.log.map(x=>x.n);return l.includes('thang')&&l.includes('qua-man')})()"));
check("tua 2 phút ⇒ Nhà ★1, nhãn bản đồ 'Nhà ★1', đơn hàng có +2 %", (await S("s.buildings.nha.level")) === 2 && /Nhà ★1/.test(await text('.bld[data-id="nha"] .market-tag')));
await pressSel("#ordersTool");
check("phiếu đơn hiện xu thật nhận (★+ danh tiếng)", await ev("[...document.querySelectorAll('#slips .slip-reward')].some(p=>/★\+/.test(p.textContent))") || await ev("[...document.querySelectorAll('#slips .slip-reward b')].length===0"));
// tắt tiếng ở tab khác (khoá chung wgp.muted) ⇒ game theo
await ev(`window.dispatchEvent(new StorageEvent('storage',{key:'wgp.muted',newValue:'1',oldValue:'0'}))`);
check("wgp.muted đổi ở tab khác ⇒ nút âm thanh chuyển sang tắt", (await ev("document.getElementById('muteBtn').getAttribute('aria-pressed')")) === "true");
await ev(`window.dispatchEvent(new StorageEvent('storage',{key:'wgp.muted',newValue:'0',oldValue:'1'}))`);
// điện thoại 390: 10 nút điều hướng không bị cắt chữ, ≥ 48 px
await view(390, 844, true, 2); await touch(true); press = tap;
await reload();
check("M5 mobile 390: nút điều hướng không cắt chữ (2 hàng × 5), cao ≥ 48 px, không tràn ngang", await noOverflowX() &&
  await ev("[...document.querySelectorAll('.farm-nav button')].every(b=>b.scrollWidth<=b.clientWidth+1&&b.getBoundingClientRect().height>=48)") &&
  await ev("new Set([...document.querySelectorAll('.farm-nav button')].map(b=>Math.round(b.getBoundingClientRect().top))).size===2"),
  await ev("[...document.querySelectorAll('.farm-nav button')].map(b=>b.id+':'+b.scrollWidth+'/'+b.clientWidth+'x'+Math.round(b.getBoundingClientRect().height)).join(',')"));
await shot("m5-01-mobile-dieu-huong.png");
await ev("document.getElementById('farm').scrollTo({left:0})"); await sleep(200);
await ev("document.querySelector('.bld[data-id=\"chuong-ga\"]').scrollIntoView({block:'center',inline:'nearest'})"); await sleep(300);
check("M5 mobile: chuồng gà / bò nằm trọn trong bản đồ", await ev(inMap("chuong-ga")) && await ev(inMap("chuong-bo")));
await shot("m5-02-mobile-chuong.png");
await view(1280, 900, false); await touch(false); press = click;

// ===== Milestone 6: Sổ sưu tập, đơn đặc biệt hai lúc, Phiên chợ, hàng rào đá, nhà theo bậc (dự phòng), save v6 → v7 =====
await ev(`(()=>{const s=__game.state;s.level=18;s.xp=0;s.coins=50000;s.inv['hop-dinh']=10;s.inv['thung-son']=10;
  s.collection={counts:{'ca-rot':5,'ca-chua':4,'dau-tay':3,'ngo':2,'bi-ngo':1,'lua':1,'trung-ga':6,'sua':2,'mut-dau':1,'bot-gao':2},claimed:0};__game.state=s})()`);
await reload();
check("M6: nút Sổ hiện 10/30 + huy hiệu thưởng", /Sổ 10\/30/.test(await text("#bookBtn")) && await visible("#bookBtn .nav-badge"), await text("#bookBtn"));
await pressSel("#bookBtn");
check("M6: Sổ sưu tập mở — 30 ô (10 đã có, 20 ẩn ???), 3 mốc, nút Nhận mốc 10", await visible("#ovBook") && (await ev("document.querySelectorAll('#bookBody .book-entry').length")) === 30 &&
  (await ev("document.querySelectorAll('#bookBody .book-entry.locked').length")) === 20 && (await ev("document.querySelectorAll('#bookBody .book-tiers li').length")) === 3 && await visible('#bookBody [data-act="claim"][data-tier="0"]'));
await shot("m6-01-so-suu-tap.png");
const coinsBook = await S("s.coins");
await pressSel('#bookBody [data-act="claim"][data-tier="0"]');
check("M6: nhận mốc 10 ⇒ +800 xu, 2 ván gỗ, mốc ghi 'Đã nhận', danh hiệu", (await S("s.coins")) === coinsBook + 800 && (await S("s.collection.claimed")) === 1 && /Đã nhận/.test(await text("#bookBody")) && /Nhà sưu tầm tập sự/.test(await text("#bookBody")));
await pressSel('#bookBody [data-act="close"]');
check("M6: icon món mới dùng items-2.webp (asset Codex), không còn bộ lọc màu dự phòng",
  await ev("(()=>{const e=[...document.querySelectorAll('#bookBody .book-entry')].find(x=>x.dataset.id==='banh-ngo');const i=e&&e.querySelector('.it');return !!i&&getComputedStyle(i).backgroundImage.includes('items-2.webp')&&!/hue-rotate/.test(i.style.filter)})()"));
// đơn đặc biệt hai lúc
await pressSel("#ordersTool");
check("M6 cấp 18: bảng đơn có 2 phiếu đặc biệt (special + special2)", await visible('#slips .slip[data-slot="special"]') && await visible('#slips .slip[data-slot="special2"]'));
await ev(`(()=>{const s=__game.state;const o=s.orders.special2.order;for(const [id,q] of Object.entries(o.items))s.inv[id]=Math.max(s.inv[id]||0,q);__game.state=s})()`);
await sleep(300);
const coinsSp2 = await S("s.coins");
await pressSel('#slips [data-act=deliver][data-slot="special2"]');
check("M6: giao đơn đặc biệt thứ hai ⇒ nhận xu, ô chờ đơn mới", (await S("s.coins")) > coinsSp2 && (await S("s.orders.special2.order")) === null && /Anh Út sẽ ghé/.test(await text('#slips .slip[data-slot="special2"]')));
// hàng rào đá (frame chưa có ⇒ hàng rào gỗ lọc màu đá)
await pressSel(bld("hang-rao"));
check("M6: chạm hàng rào ⇒ thẻ nâng hàng rào đá 6 000 xu + vật liệu", await visible("#ovBuild") && /hàng rào đá/.test(await text("#buildBody")) && /6\.000 xu/.test(await text("#buildOk")), await text("#buildBody"));
await pressSel("#buildOk"); await sleep(300);
check("M6: hàng rào lên đá (xong ngay), bản đồ vẽ hang-rao.webp (asset Codex)", (await S("s.buildings['hang-rao'].level")) === 2 && await ev(`!!document.querySelector('${bld("hang-rao")} [style*="hang-rao.webp"]')`));
check("M6: nhà bậc ★1 vẽ nha-bac-1 từ house-tiers.webp (asset Codex) + nhãn Nhà ★1", await ev(`!!document.querySelector('${bld("nha")} [style*="house-tiers.webp"]')`) && /Nhà ★1/.test(await text(`${bld("nha")} .market-tag`)));
await ev(`document.querySelector('${bld("hang-rao")}').scrollIntoView({block:'center'})`); await sleep(200);
await shot("m6-02-ban-do-hang-rao-da.png");
// Phiên chợ: tua tới giờ phiên kế tiếp
const fairStart = await ev("import('./core/fair.js?v=m13').then(F=>F.nextFair(Date.now()+(window.__ntOffset||0)).startAt)");
await ev(`window.__ntOffset=(window.__ntOffset||0)+(${fairStart}-(Date.now()+(window.__ntOffset||0)))+60000`);
await reload();
check("M6 Phiên chợ: nút Chợ có huy hiệu 'Hội', sạp có cờ + nhãn 'Phiên chợ!'", /Hội/.test(await text("#marketTool")) && await ev(`!!document.querySelector('${bld("sap-cho")} .fair-flag')`) && /Phiên chợ/.test(await text(`${bld("sap-cho")} .market-tag`)));
const hot = await ev("import('./core/fair.js?v=m13').then(F=>F.activeFair(__game.state,Date.now()+(window.__ntOffset||0)).hot[0])");
await ev(`(()=>{const s=__game.state;s.inv['${hot}']=12;__game.state=s})()`);
await pressSel("#marketTool");
check("M6: Khu chợ hiện băng Phiên chợ đang diễn ra + hàng săn", await visible("#mkFair.on") && /đang diễn ra/.test(await text("#mkFair")) && /hàng săn: còn 10/.test(await text("#mkSell")), await text("#mkFair"));
const quote12 = await ev(`import('./core/fair.js?v=m13').then(F=>F.quote(__game.state,'${hot}',12,Date.now()+(window.__ntOffset||0)).coins)`);
const coinsFair = await S("s.coins");
await pressSel(`#mkSell [data-act=sell][data-id="${hot}"][data-n="12"]`);
check("M6: bán 12 hàng săn ⇒ 10 món giá rưỡi + 2 món giá thường, hạn mức lưu", (await S("s.coins")) - coinsFair === quote12 && (await S(`s.fair.sold['${hot}']`)) === 10, `${(await S("s.coins")) - coinsFair} vs ${quote12}`);
await shot("m6-03-phien-cho.png");
// mobile 390: Sổ sưu tập + băng phiên chợ
await view(390, 844, true, 2); await touch(true); press = tap;
await reload("#cho");
check("M6 mobile 390: Khu chợ + băng Phiên chợ không tràn ngang", (await ev("__game.scene")) === "market" && await visible("#mkFair") && await noOverflowX());
await shot("m6-04-mobile-phien-cho.png");
await pressSel("#marketScene [data-back]");
await pressSel("#bookBtn");
check("M6 mobile 390: Sổ sưu tập không tràn ngang, nút ≥ 44 px", await visible("#ovBook") && await noOverflowX() &&
  await ev("[...document.querySelectorAll('#bookBody button, #bookBtn')].every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})"));
await shot("m6-05-mobile-so-suu-tap.png");
await pressSel('#bookBody [data-act="close"]');
check("M6 mobile 390: hàng công cụ (Thu hết / Xây / Sổ / âm thanh / ?) không tràn ngang", await noOverflowX());
await shot("m6-06-mobile-ban-do.png");
await view(1280, 900, false); await touch(false); press = click;
// save v6 → v7 trong trình duyệt: không mất dữ liệu, giữ bản sao v6
await ev(`(()=>{const s=JSON.parse(JSON.stringify(__game.state));s.v=6;s.coins=12345;s.inv={'mut-dau':3,'ca-rot':2};delete s.collection;delete s.fair;delete s.orders.special2;
  localStorage.clear();localStorage.setItem('wgp.nongtrai.v6',JSON.stringify(s));})()`);
await reload();
check("M6: save v6 → v7: giữ xu / kho, sổ ghi sẵn món trong kho, v6 gốc + v6.backup còn, báo cập nhật",
  (await S("s.coins")) === 12345 && (await S("s.collection.counts['mut-dau']")) === 3 && await ev("JSON.parse(localStorage.getItem('wgp.nongtrai.v7')).v===7&&localStorage.getItem('wgp.nongtrai.v6.backup')===localStorage.getItem('wgp.nongtrai.v6')") &&
  /Sổ sưu tập/.test(await text("#toast")), await text("#toast"));

check("0 lỗi console / exception", errors.length === 0, errors.join(" | "));
writeFileSync(OUT + "/e2e-ket-qua.txt", R.join("\n") + `\n\n${R.length - fails}/${R.length} PASS\n`);
console.log(`\n${R.length - fails}/${R.length} PASS`);
ws.close(); chrome.kill();
await sleep(500);
try { rmSync(PROF, { recursive: true, force: true }); } catch {}
process.exit(fails ? 1 : 0);
