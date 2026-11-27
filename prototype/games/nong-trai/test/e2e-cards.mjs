// E2E m7 — thẻ chúc mừng khi xây / nâng công trình xong (Chrome headless qua CDP, bấm chuột / chạm thật):
// thẻ xây có "Dùng để / Bạn được"; xây Nhà kho ⇒ thẻ hiện ⇒ "Vào xem ngay" mở đúng Nhà kho; nâng kho ⇒ thẻ "60 → 90 chỗ";
// xây lâu xong lúc tắt game ⇒ thẻ hiện khi mở lại; nhiều thẻ xếp hàng; thẻ chờ khi đang mở bảng khác; Esc / Enter;
// công trình không có cảnh ⇒ cuộn tới + nhấp nháy; máy trong Xưởng; thẻ "Kho đầy" một lần; 1366×768 (dpr 1,25) và 390×844 (dpr 3):
// elementFromPoint không bị che, thẻ vừa màn, nút ≥ 44 px. Chụp ảnh.
// Chạy: (ở gốc repo) PORT=8847 node server.js   rồi   PORT=8847 node prototype/games/nong-trai/test/e2e-cards.mjs <thư mục output>
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { tempProfile, guardChrome, shotDir } from "../../_shared/test/lk-temp.mjs";
const OUT = process.argv[2] || shotDir("nong-trai-cards"), PORT = process.env.PORT || 8847, BASE = `http://127.0.0.1:${PORT}/games/nong-trai/?testclock`;
const DBG = Number(process.env.DBG_PORT || 9391);
mkdirSync(OUT, { recursive: true });
const PROF = tempProfile("nong-trai-cards"); // %TEMP%/lk-e2e-nong-trai-cards-*, tự xoá khi thoát (kể cả Ctrl+C / bị giết cứng)
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", `--remote-debugging-port=${DBG}`, "--user-data-dir=" + PROF, "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
guardChrome(chrome, PROF);
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
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/fonts\.g/.test(m.params.entry.url || "")) errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + " :: " + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
const nav = async (u = BASE) => { await send("Page.navigate", { url: u }); await sleep(500); for (let i = 0; i < 50 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(200); await sleep(500); };
const view = (w, h, m, dpr = 1) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = (on) => send("Emulation.setTouchEmulationEnabled", { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(OUT + "/" + name, Buffer.from(r.result.data, "base64")); };
let fails = 0, passes = 0;
const check = (n, c, d = "") => { if (!c) fails++; else passes++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
const click = async (x, y) => { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); };
const tap = async (x, y) => { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); };
const key = async (k, code = k) => { for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: { Enter: 13, Escape: 27, Tab: 9 }[k] || 0 }); await sleep(200); };
let press = click;
const at = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'center',inline:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async (sel) => { const p = await at(sel); if (!p) throw new Error("không thấy " + sel); await sleep(60); const q = await at(sel); await press(...q); await sleep(260); };
const S = (expr) => ev(`(()=>{const s=__game.state;return ${expr}})()`);
const setS = (body) => ev(`(()=>{const s=__game.state;const t=Date.now()+(window.__ntOffset||0);${body};__game.state=s})()`);
const visible = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')})()`);
const text = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const advance = async (ms) => { await ev(`window.__ntOffset=(window.__ntOffset||0)+${ms}`); await sleep(1400); };
/** Tắt trang, chờ `away` ms (đồng hồ thử), mở lại. */
const reopen = async (away = 0) => { await ev(`sessionStorage.setItem('ntOffset',String((window.__ntOffset||0)+${away}))`); await send("Page.navigate", { url: "about:blank" }); await sleep(300); await nav(BASE); await ev("sessionStorage.removeItem('ntOffset')"); };
const waitFor = async (expr, ms = 4000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr).catch(() => false)) return true; await sleep(100); } return false; };
const celOpen = () => visible("#ovCelebrate");
const celTitle = () => text("#celTitle");
const celBody = () => text("#celBody");
/** Điểm giữa nút có đúng là nút đó (không bị lớp khác che) + nằm trọn trong màn. */
const hitOk = (sel) => ev(`(()=>{const b=document.querySelector(${JSON.stringify(sel)});const r=b.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;const h=document.elementFromPoint(x,y);return !!h&&(h===b||b.contains(h))&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})()`);
const cardFits = () => ev(`(()=>{const r=document.querySelector('#ovCelebrate .cel-card').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()`);
const seenKey = () => ev("JSON.parse(localStorage.getItem('wgp.nongtrai.cards')||'null')");

// ===== 1. Desktop 1366×768 (laptop phóng 125 %): xây Nhà kho =====
await view(1366, 768, false, 1.25); await touch(false); press = click;
await nav(); await ev("localStorage.clear(); sessionStorage.clear()"); await nav();
await pressSel("#helpOk");
check("người mới: chưa có thẻ nào chờ", !(await celOpen()) && (await ev("__game.cards.pending().length")) === 0);
await setS("s.level=3; s.xp=0; s.coins=500; s.quests.tut=7"); // đang ở bước hướng dẫn 8 "Xây Nhà kho"
await sleep(300);
await pressSel("#buildBtn");
await pressSel('.bld[data-id="nha-kho"]');
const bc = await text("#buildBody");
check("thẻ xây (trước khi mua) hiện 'Dùng để' + 'Bạn được' kèm số từ data", /Dùng để:/.test(bc) && /Bạn được:/.test(bc) && /60 món/.test(bc) && /90 chỗ/.test(bc), bc);
check("thẻ xây: công dụng đứng trước giá", bc.indexOf("Dùng để") < bc.indexOf("Giá:"));
await shot("c01-the-xay-dung-de-desktop.png");
const sfx0 = (await ev("__game.sfx.log.length"));
await pressSel("#buildOk");
check("xây Nhà kho xong ⇒ thẻ chúc mừng giữa màn", await celOpen() && /Bạn vừa xây Nhà kho!/.test(await celTitle()), await celTitle());
const cb = await celBody();
check("thẻ: Dùng để / Bạn được (60 món, nâng lên 90, giỏ tràn 10) / Làm gì tiếp", /Dùng để:/.test(cb) && /60 món/.test(cb) && /90 chỗ/.test(cb) && /tối đa 10/.test(cb) && /Làm gì tiếp:.*Nhà kho/.test(cb), cb);
await waitFor("getComputedStyle(document.querySelector('#celPic .cel-pic')).backgroundImage.includes('buildings.webp')", 3000);
check("thẻ có hình Nhà kho (sprite buildings.webp, cỡ bội 0,5 px thiết bị)", await ev(`(()=>{const p=document.querySelector('#celPic .cel-pic');if(!p)return false;const k=p.offsetWidth*devicePixelRatio/256;return getComputedStyle(p).backgroundImage.includes('buildings.webp')&&Math.abs(k*2-Math.round(k*2))<0.02})()`),
  await ev(`(()=>{const p=document.querySelector('#celPic .cel-pic');return p?[p.className,getComputedStyle(p).backgroundImage.slice(-30),p.getBoundingClientRect().width,devicePixelRatio,document.getElementById('celTitle').textContent].join(' | '):document.getElementById('celPic').innerHTML})()`));
check("thẻ kêu 'qua-man' (âm có sẵn)", await ev(`__game.sfx.log.slice(${sfx0}).some(x=>x.n==='qua-man')`));
check("không còn toast cũ 'Nhà kho đã xây xong' trùng thẻ", !/đã xây xong/.test(await text("#toast")) || await ev("document.getElementById('toast').hidden"));
await sleep(500); // chờ hiệu ứng xuất hiện (phóng 0,72 → 1,04 → 1) xong rồi mới đo
check("1366×768: nút 'Vào xem ngay' / 'Để sau' không bị che, thẻ vừa màn", await hitOk("#celGo") && await hitOk("#celLater") && await cardFits());
check("tiêu điểm bàn phím ở nút chính", await ev("document.activeElement.id==='celGo'"));
await sleep(500); await shot("c02-the-chuc-mung-nha-kho-desktop.png");
await pressSel("#celGo");
check("'Vào xem ngay' ⇒ đóng thẻ, mở đúng Nhà kho, thoát chế độ Xây", !(await celOpen()) && await visible("#warehouse") && /Nhà kho/.test(await text("#whBody")) && !(await visible("#buildBar")));
check("ghi 'đã xem' ở khoá riêng wgp.nongtrai.cards, bản lưu v7 không có trường mới", (await seenKey())?.b?.["nha-kho"] === 1 && !("cards" in JSON.parse(await ev("localStorage.getItem('wgp.nongtrai.v7')"))));
check("hướng dẫn không bị chặn: bước 8 xong, nút Nhận còn đó", await visible("#qClaim"));
await reopen(0);
check("mở lại: thẻ Nhà kho không hiện lại", !(await celOpen()));

// ===== 2. Nâng kho: trước → sau, phím Esc =====
await pressSel("#stockTool");
check("bảng Kho: nút nâng hiện trước → sau (60 → 90 chỗ)", /Nâng kho: 60 → 90 chỗ/.test(await text("#whBody")), await text("#whBody"));
await pressSel("#whUpgrade");
check("nâng kho ⇒ thẻ 'Nhà kho lên cấp 2!' + 'Kho: 60 → 90 chỗ'", await celOpen() && /Nhà kho lên cấp 2!/.test(await celTitle()) && /Kho: 60 → 90 chỗ/.test(await celBody()), await celBody());
check("dòng trước → sau in đậm số mới", await ev("[...document.querySelectorAll('#celBody .cel-gain b')].some(b=>/90 chỗ/.test(b.textContent))"));
await sleep(500); await shot("c03-the-nang-kho-truoc-sau-desktop.png");
await key("Escape");
check("Esc = Để sau: thẻ đóng, vẫn ở bảng Kho", !(await celOpen()) && await visible("#warehouse"));

// ===== 3. Xây lâu xong lúc tắt game ⇒ thẻ khi mở lại; Enter = Vào xem ngay =====
await setS("s.level=10; s.coins=50000; s.inv['van-go']=40; s.inv['hop-dinh']=40; s.inv['thung-son']=20; s.quests.tut=8");
await sleep(300);
await pressSel("#buildBtn");
await pressSel('.bld[data-id="chuong-ga"]');
await pressSel("#buildOk");
check("xây chuồng gà (2 phút) ⇒ chưa có thẻ, toast báo đang xây", !(await celOpen()) && /Bắt đầu xây Chuồng gà/.test(await text("#toast")));
await reopen(125_000);
check("tắt game 2 phút rồi mở lại ⇒ thẻ 'Bạn vừa xây Chuồng gà!' (6 gà)", await waitFor("!document.getElementById('ovCelebrate').hidden") && /Chuồng gà/.test(await celTitle()) && /6 gà/.test(await celBody()), await celTitle());
check("toast 'Trong lúc bạn vắng' không nhắc lại công trình", !/đã xây xong/.test(await text("#toast")));
await key("Enter");
check("Enter = Vào xem ngay ⇒ cảnh Chăn nuôi", !(await celOpen()) && (await ev("__game.scene")) === "animals");
await pressSel('#animalsScene [data-act="back"], #animalsScene [data-back]').catch(() => ev("__game.goScene('farm')"));

// ===== 4. Nhiều thẻ xếp hàng + thẻ chờ khi đang mở bảng khác =====
await pressSel("#buildBtn");
await pressSel('.bld[data-id="chuong-bo"]'); await pressSel("#buildOk");
await pressSel('.bld[data-id="nha-kinh"]'); await pressSel("#buildOk");
await pressSel('.bld[data-id="nha"]'); // mở thẻ nâng Nhà rồi để đó trong lúc 2 công trình xây xong
await advance(301_000);
check("đang mở thẻ xây (bảng khác) ⇒ thẻ chúc mừng chờ, không đè", await visible("#ovBuild") && !(await celOpen()) && (await ev("__game.cards.pending().length")) === 2);
await pressSel("#buildCancel");
check("đóng bảng ⇒ thẻ thứ nhất hiện, báo 'Còn 1 thẻ nữa'", await waitFor("!document.getElementById('ovCelebrate').hidden", 2500) && /Chuồng bò/.test(await celTitle()) && /Còn 1 thẻ nữa/.test(await text("#celMore")));
await pressSel("#celLater");
check("Để sau ⇒ thẻ thứ hai (Nhà kính) hiện lần lượt", await waitFor("!document.getElementById('ovCelebrate').hidden&&/Nhà kính/.test(document.getElementById('celTitle').textContent)", 3000) && /6 ô/.test(await celBody()));
await pressSel("#celGo");
check("Vào xem ngay ⇒ bảng Nhà kính mở", await visible("#ovGreenhouse"));
await pressSel("#ghClose");

// ===== 5. Công trình không có cảnh: cuộn tới + nhấp nháy (hàng rào đá) =====
await setS("s.level=15");
await sleep(300);
await pressSel("#buildBtn");
await pressSel('.bld[data-id="hang-rao"]');
check("thẻ nâng hàng rào: Bạn được 'hàng rào đá'", /Bạn được:/.test(await text("#buildBody")) && /hàng rào đá/.test(await text("#buildBody")));
await pressSel("#buildOk");
check("nâng hàng rào ⇒ thẻ 'Hàng rào lên cấp 2!'", await celOpen() && /Hàng rào lên cấp 2!/.test(await celTitle()));
await pressSel("#celGo");
check("Vào xem ngay (không có cảnh) ⇒ hàng rào nhấp nháy viền vàng + mũi tên, về bản đồ", (await ev("__game.scene")) === "farm" && await ev("document.querySelector('.bld[data-id=\"hang-rao\"]').classList.contains('spot')"));
await sleep(300); await shot("c04-vao-xem-hang-rao-nhap-nhay-desktop.png");

// ===== 6. Máy trong Xưởng =====
await setS("s.buildings.xuong={level:1,done:true,readyAt:t-1000}; s.production.machines['bep-sen']=s.production.machines['bep-sen']||{level:1,slots:2,readyAt:t-1000,queue:[],nextUid:1}");
await sleep(300); await ev("__game.cards.dismissAll()");
await ev("__game.goScene('workshop')"); await sleep(300);
check("Xưởng: máy chưa lắp hiện 'Dùng để / Bạn được' trước khi bấm Xây", /Dùng để:.*thức ăn gia súc/i.test(await text('.mach[data-m="coi-xay"] .mach-foot')), await text('.mach[data-m="coi-xay"] .mach-foot'));
await at('.mach[data-m="coi-xay"] .mach-foot'); await sleep(200); await shot("c09-xuong-dung-de-truoc-khi-xay-desktop.png");
await pressSel('.mach[data-m="coi-xay"] [data-act="build"]');
await advance(91_000);
check("lắp Cối xay xong ⇒ thẻ 'Bạn vừa lắp Cối xay!'", await waitFor("!document.getElementById('ovCelebrate').hidden") && /lắp Cối xay/.test(await celTitle()), await celTitle());
await sleep(400); await shot("c05-the-lap-may-desktop.png");
await pressSel("#celGo");
check("Vào xem ngay ⇒ ở Xưởng, máy Cối xay được chỉ", (await ev("__game.scene")) === "workshop" && await ev("document.querySelector('.mach[data-m=coi-xay]').classList.contains('spot')"));
check("nút nâng máy hiện trước → sau (2 → 3 ô)", /2 → 3 ô/.test(await text('.mach[data-m="coi-xay"] .mach-foot')), await text('.mach[data-m="coi-xay"] .mach-foot'));
await ev("__game.goScene('farm')"); await sleep(200);

// ===== 7. Kho đầy lần đầu ⇒ thẻ giải thích (một lần) =====
await setS("const cap=[60,90,130,180,250,320][s.warehouse]; s.inv={'ca-chua':cap}; s.overflow={}; for(const i of [6,7]){s.plots[i]={open:true,crop:'ca-rot',plantAt:t-40000,readyAt:t-1000,watered:false}}");
await sleep(200); await ev("__game.cards.dismissAll()");
const tipSeen0 = (await seenKey())?.tip?.overflow;
await pressSel("#allBtn");
check("kho đầy, hàng vào giỏ tràn lần đầu ⇒ thẻ 'Kho đầy rồi!' (tối đa 10)", !tipSeen0 && await celOpen() && /Kho đầy rồi!/.test(await celTitle()) && /giỏ tràn.*tối đa 10/.test(await celBody()) && /Mở Nhà kho/.test(await text("#celGo")), await celBody());
await sleep(400); await shot("c06-the-kho-day-desktop.png");
await pressSel("#celGo");
check("'Mở Nhà kho' ⇒ bảng Kho có Giỏ tràn", await visible("#warehouse") && /Giỏ tràn/.test(await text("#whBody")));
await setS("s.plots[8]={open:true,crop:'ca-rot',plantAt:t-40000,readyAt:t-1000,watered:false}");
await pressSel("#allBtn");
check("lần sau kho đầy ⇒ không hiện lại thẻ", !(await celOpen()));

// ===== 8. Điện thoại 390×844 (dpr 3, chạm) =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(); await ev("localStorage.clear(); sessionStorage.clear()"); await nav();
await pressSel("#helpOk");
await setS("s.level=3; s.coins=500; s.quests.tut=8");
await sleep(300);
await pressSel("#buildBtn");
await pressSel('.bld[data-id="nha-kho"]');
check("mobile: thẻ xây có 'Dùng để / Bạn được', vừa màn", /Dùng để:/.test(await text("#buildBody")) && await ev("document.querySelector('.build-card').getBoundingClientRect().right<=innerWidth"));
await pressSel("#buildOk");
check("mobile: thẻ chúc mừng hiện", await celOpen() && /Nhà kho/.test(await celTitle()));
await sleep(500); // chờ hiệu ứng xuất hiện (phóng 0,72 → 1,04 → 1) xong rồi mới đo
check("mobile 390×844: thẻ vừa màn, không tràn ngang", await cardFits() && await ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth"));
check("mobile: 2 nút ≥ 44 px, elementFromPoint đúng nút (không bị che)", await ev("['celGo','celLater'].every(i=>{const r=document.getElementById(i).getBoundingClientRect();return r.height>=44&&r.width>=44})") && await hitOk("#celGo") && await hitOk("#celLater"));
await sleep(500); await shot("c07-the-chuc-mung-mobile.png");
await pressSel("#celGo");
check("mobile: chạm 'Vào xem ngay' ⇒ Nhà kho", !(await celOpen()) && await visible("#warehouse"));
await pressSel("#whUpgrade");
await sleep(500); // chờ hiệu ứng xuất hiện (phóng 0,72 → 1,04 → 1) xong rồi mới đo
check("mobile: thẻ nâng kho 60 → 90, vừa màn", await celOpen() && /60 → 90 chỗ/.test(await celBody()) && await cardFits() && await hitOk("#celGo"),
  await ev("JSON.stringify({hold:__game.cards.hold,cur:__game.cards.current,pending:__game.cards.pending()})"));
await sleep(500); await shot("c08-the-nang-kho-mobile.png");
check("mobile: lớp tối phủ cả màn (góc trên / dưới đều thuộc lớp thẻ)", await ev("[[195,20],[20,830],[370,400]].every(([x,y])=>document.getElementById('ovCelebrate').contains(document.elementFromPoint(x,y)))"),
  await ev("JSON.stringify([[195,20],[20,830]].map(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&(e.id||e.className)}))"));
await pressSel("#celLater");

check("0 lỗi console / exception", errors.length === 0, errors.join(" | "));
console.log(`\n${passes}/${passes + fails} PASS`);
ws.close(); chrome.kill();
process.exit(fails ? 1 : 0);
