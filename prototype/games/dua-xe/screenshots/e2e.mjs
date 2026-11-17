// E2E Đua Xe Vượt Đồi trên Chrome headless — phím / chuột giữ bàn đạp / chạm đa điểm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8771 node server.js   rồi   node prototype/games/dua-xe/screenshots/e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const OUT = process.argv[2] || '.', BASE = (process.env.BASE || 'http://127.0.0.1:8771') + '/games/dua-xe/';
mkdirSync(OUT, { recursive: true });
try { rmSync(OUT + '/prof', { recursive: true, force: true }); } catch {}
const PORT = 9348;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
console.log('chrome pid', chrome.pid);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.g/.test(m.params.entry.url || '')) errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(1500); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = on => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const VK = { ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Escape: 27, Enter: 13 };
const kc = k => /^[a-z]$/i.test(k) ? { code: 'Key' + k.toUpperCase(), key: k, windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0), text: k } : { code: k, key: k, windowsVirtualKeyCode: VK[k] };
const keyDown = k => send('Input.dispatchKeyEvent', { type: 'keyDown', ...kc(k) });
const keyUp = k => { const o = kc(k); delete o.text; return send('Input.dispatchKeyEvent', { type: 'keyUp', ...o }); };
const key = async k => { await keyDown(k); await keyUp(k); await sleep(40); };
const mouse = (type, x, y, buttons = 1) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons, clickCount: 1 });
const click = async (x, y) => { await mouse('mouseMoved', x, y, 0); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y, 0); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); await sleep(40); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(!r.width)return null;return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(200); };
const S = () => ev('(async()=>{const L=await import("./logic.js");const s=__game.state;return s&&{status:s.status,reason:s.reason,dist:s.dist,fuel:s.fuel,coins:s.coins,picked:s.picked,fuels:s.fuels,x:L.carX(s),vx:L.carVx(s),a:L.carAngle(s),mode:__game.mode}})()');
const visible = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&!!e.offsetParent})()`);
const txt = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const noOverflow = () => ev('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight');
const inView = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>e.offsetParent&&getComputedStyle(e).visibility!=='hidden').every(e=>{const r=e.getBoundingClientRect();return r.left>=-.5&&r.top>=-.5&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5})`);
// các khối HUD / bàn đạp / nút không đè lên nhau
const noOverlap = () => ev(`(()=>{const els=[...document.querySelectorAll('.hud .chip,.tools .btn,.pedal')].filter(e=>e.offsetParent&&getComputedStyle(e).visibility!=='hidden').map(e=>e.getBoundingClientRect());for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j];if(!(a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1))return false}return true})()`);
const canvasColors = () => ev(`(()=>{const c=document.querySelector('#cv'),g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data,set=new Set();for(let i=0;i<d.length;i+=4*13)set.add(d[i]<<16|d[i+1]<<8|d[i+2]);return set.size})()`);
// dịch xe tới vị trí x (giữ trên mặt đất), tuỳ chọn góc nghiêng / độ cao
const teleport = (x, yOff = 0, ang = 0, vx = 0) => ev(`(async()=>{const L=await import("./logic.js");L.setPose(__game.state,${x},${yOff},${ang},${vx},0);return true})()`);
const holdKey = async (k, ms) => { await keyDown(k); await sleep(ms); await keyUp(k); };
const layoutOk = async name => {
  const ok = (await noOverflow()) && (await inView('.hud .chip, .tools .btn, .pedal')) && (await noOverlap());
  check(`${name}: không tràn trang, HUD + bàn đạp nằm trong màn hình và không đè nhau`, ok,
    JSON.stringify(await ev('(()=>({w:innerWidth,h:innerHeight,view:{W:__game.view.W,H:__game.view.H,P:__game.view.P,ppm:__game.view.ppm}}))()')));
};

// ===== 1. Desktop: bàn phím + chuột giữ bàn đạp =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('__game.destroy(); localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game: 3 thẻ nâng cấp, ví 0 xu → nút mua bị khoá', await visible('#ovMenu') && (await ev('document.querySelectorAll(".up").length')) === 3 && (await ev('[...document.querySelectorAll(".up button")].every(b=>b.disabled)')));
check('canvas vẽ cảnh đồi pixel (nhiều màu)', (await canvasColors()) > 15, await canvasColors());
await sleep(300); await shot('menu-desktop.png');

await pressSel('#playBtn');
let st = await S();
check('bấm "Lên đường" → bắt đầu ván, overlay tắt, xăng đầy', st && st.mode === 'play' && st.status === 'run' && !(await visible('#ovMenu')) && Math.round(st.fuel) >= 99, JSON.stringify(st));
const x0 = st.x;
await keyDown('ArrowRight'); await sleep(1600);
check('giữ phím → xe tăng tốc tới trước', (await S()).vx > 4, JSON.stringify(await S()));
check('bàn đạp GA sáng lên khi giữ phím', await ev('document.querySelector("#gasBtn").classList.contains("on")'));
await shot('play-desktop.png');
await keyUp('ArrowRight');
st = await S();
check('quãng đường + HUD cập nhật', st.x > x0 + 4 && st.dist > 0 && (await txt('#hDist')) === st.dist.toLocaleString('vi-VN') + ' m', `${st.dist} / ${await txt('#hDist')}`);
check('xăng tiêu hao khi ga', st.fuel < 99.5, st.fuel.toFixed(2));
await holdKey('ArrowLeft', 1400);
check('giữ phím ← → phanh, xe chậm lại', Math.abs((await S()).vx) < 2.5, (await S()).vx.toFixed(2));
// chuột giữ bàn đạp GA
await sleep(300);
const g = await at('#gasBtn');
await mouse('mouseMoved', ...g, 0); await mouse('mousePressed', ...g); await sleep(1300);
check('giữ chuột trên bàn đạp GA → ga', (await ev('__game.input.gas')) && (await S()).vx > 3, (await S()).vx.toFixed(2));
await mouse('mouseReleased', ...g, 0); await sleep(80);
check('nhả chuột → hết ga', !(await ev('__game.input.gas')));
const bk = await at('#brakeBtn');
await mouse('mouseMoved', ...bk, 0); await mouse('mousePressed', ...bk); await sleep(250);
check('giữ chuột trên bàn đạp PHANH → phanh', await ev('__game.input.brake'));
await mouse('mouseReleased', ...bk, 0); await sleep(80);

// nhặt xu + can xăng (dịch xe tới ngay trước vật phẩm rồi chạy qua)
const coinX = await ev('(async()=>{const L=await import("./logic.js");const s=__game.state;const it=L.itemsNear(s,L.START_X+30,L.START_X+200).find(i=>i.kind==="coin");return it&&it.x})()');
await teleport(coinX - 3, 0, 0, 5);
const c0 = (await S()).coins;
await keyDown('ArrowRight'); await sleep(900); await keyUp('ArrowRight');
st = await S();
check('chạy qua xu → cộng tiền, HUD tiền cập nhật', st.coins > c0 && st.picked > 0 && (await txt('#hCoins')) === st.coins.toLocaleString('vi-VN'), `${c0} → ${st.coins}`);
await ev('__game.state.fuel=12;__game.hud()');
check('xăng thấp → thanh xăng đỏ nhấp nháy', await ev('document.querySelector("#fuelBox").classList.contains("low")'));
await sleep(100); await shot('fuel-low-desktop.png');
const fuelX = await ev('(async()=>{const L=await import("./logic.js");return L.fuelXs(__game.state,0)[0]})()');
await teleport(fuelX - 3, 0, 0, 5);
await keyDown('ArrowRight'); await sleep(800); await keyUp('ArrowRight');
st = await S();
check('chạy qua can xăng → đổ đầy bình, có thông báo', st.fuels === 1 && st.fuel > 90 && !(await ev('document.querySelector("#fuelBox").classList.contains("low")')), `fuel ${st.fuel.toFixed(1)}`);

// tạm dừng / tắt tiếng
await key('p');
const dP = (await S()).x; await sleep(500);
check('phím P → tạm dừng, xe đứng yên', (await visible('#ovPause')) && (await ev('__game.mode')) === 'pause' && Math.abs((await S()).x - dP) < 1e-6);
await shot('pause-desktop.png');
await key('p');
check('phím P lần nữa → chơi tiếp', (await ev('__game.mode')) === 'play' && !(await visible('#ovPause')));
await key('m');
check('phím M → tắt tiếng (lưu lại)', (await ev('__game.save && localStorage.getItem("wgp.muted")')) === '1' && (await ev('document.querySelector("#muteBtn").getAttribute("aria-pressed")')) === 'true');
await pressSel('#muteBtn');
check('nút loa → bật tiếng lại', (await ev('localStorage.getItem("wgp.muted")')) === '0');

// tới ~260 m rồi lật xe → thua "Xe lật!", lưu kỷ lục
await teleport(266, 0, 0, 6); await sleep(200);
const dBefore = (await S()).dist;
await teleport(270, 1.2, Math.PI, 0);
await sleep(2400);
st = await S();
check('xe lộn ngược chạm đầu → "Xe lật!", hiện bảng kết thúc', st.status === 'over' && st.reason === 'lat' && (await visible('#ovOver')) && (await txt('#oTitle')) === 'Xe lật!', JSON.stringify(st));
check('quãng đường ≥ 260 m và là kỷ lục mới, báo điểm cho SDK', dBefore >= 260 && (await ev('__game.save.best')) === st.dist && (await ev('window.__lastResult && window.__lastResult.score')) === st.dist && (await visible('.record')), `best ${await ev('__game.save.best')}`);
check('tiền ván này cộng vào ví + đếm số ván', (await ev('__game.save.coins')) === st.coins && (await ev('__game.save.runs')) === 1);
check('âm thanh có phát (xu, can xăng, va chạm)', await ev('["trung-vang","trung-kim-cuong","no-tnt"].every(n=>__game.sfx.log.some(e=>e.n===n))'), JSON.stringify(await ev('[...new Set(__game.sfx.log.map(e=>e.n))]')));
await shot('over-crash-desktop.png');

// Enter → chơi lại; hết xăng → "Hết xăng!"
await key('Enter');
check('Enter → chơi lại ván mới', (await ev('__game.mode')) === 'play' && (await S()).dist === 0);
await ev('__game.state.fuel=0');
await sleep(2200);
st = await S();
check('hết xăng và xe dừng → "Hết xăng!"', st.status === 'over' && st.reason === 'xang' && (await txt('#oTitle')) === 'Hết xăng!', JSON.stringify(st));
check('không phá kỷ lục → hiện kỷ lục cũ', (await ev('__game.save.runs')) === 2 && (await txt('#oRecord')).includes('Kỷ lục'));

// nạp tiền vào lưu trữ → mua nâng cấp; tải lại giữ nguyên
await ev('__game.destroy()');
await ev('(()=>{const v=JSON.parse(localStorage.getItem("wgp.dua-xe.v1"));v.coins=600;localStorage.setItem("wgp.dua-xe.v1",JSON.stringify(v))})()');
await nav(BASE + '?seed=11');
check('tải lại trang: kỷ lục + ví còn nguyên', (await txt('#mBest')).startsWith(String(await ev('__game.save.best'))) && (await txt('#mCoins')) === '600');
check('đủ tiền → nút mua mở khoá', !(await ev('document.querySelector(\'.up[data-k="engine"] button\').disabled')));
await pressSel('.up[data-k="engine"] button');
check('mua Động cơ cấp 1 → trừ 150 xu, sáng 1 vạch, lưu lại', (await ev('JSON.parse(localStorage.getItem("wgp.dua-xe.v1")).up.engine')) === 1 && (await txt('#mCoins')) === '450' && (await ev('document.querySelectorAll(\'.up[data-k="engine"] .pips i.on\').length')) === 1);
await pressSel('.up[data-k="engine"] button');
check('không đủ tiền mua cấp 2 (350 xu, còn 450 → còn 100) thì khoá nút', (await txt('#mCoins')) === '100' && (await ev('document.querySelector(\'.up[data-k="engine"] button\').disabled')));
await shot('shop-desktop.png');
await pressSel('#playBtn');
check('xe đã nâng cấp: tốc độ tối đa tăng', (await ev('__game.state.cfg.vmax')) > 12.5 + 1.8 * 2 - 0.01, await ev('__game.state.cfg.vmax'));
// ẩn tab → tự tạm dừng
await ev('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');
check('ẩn tab → tự tạm dừng', (await ev('__game.mode')) === 'pause');
await ev('delete document.hidden'); await key('Escape');
check('Esc → chơi tiếp', (await ev('__game.mode')) === 'play');
await layoutOk('desktop 1440×900');

// ===== 2. Mobile cầm dọc: chạm đa điểm =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=21');
await sleep(300); await shot('menu-mobile.png');
check('mobile: menu không tràn ngang', await noOverflow());
await pressSel('#playBtn');
check('chạm "Lên đường" → vào ván', (await ev('__game.mode')) === 'play');
await layoutOk('mobile 390×844');
const gp = await at('#gasBtn'), bp = await at('#brakeBtn');
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: gp[0], y: gp[1], id: 1 }] });
await sleep(1500);
check('chạm giữ GA → xe chạy', (await ev('__game.input.gas')) && (await S()).vx > 3, (await S()).vx.toFixed(2));
await shot('play-mobile.png');
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: gp[0], y: gp[1], id: 1 }, { x: bp[0], y: bp[1], id: 2 }] });
await sleep(150);
check('chạm thêm ngón thứ 2 vào PHANH → giữ cả hai cùng lúc', (await ev('__game.input.gas')) && (await ev('__game.input.brake')));
// nhấc riêng ngón GA: CDP không giả lập được nhấc 1 trong 2 ngón, nên phát pointerup thật của đúng ngón đó trên bàn đạp GA
await ev('(()=>{const id=__game.pointers.gas[0];document.querySelector("#gasBtn").dispatchEvent(new PointerEvent("pointerup",{pointerId:id,pointerType:"touch",bubbles:true}))})()');
await sleep(100);
check('nhấc ngón GA, còn PHANH', !(await ev('__game.input.gas')) && (await ev('__game.input.brake')));
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(100);
check('nhấc hết ngón → không ga không phanh', !(await ev('__game.input.gas')) && !(await ev('__game.input.brake')));
await teleport(60, 1.2, Math.PI, 0); await sleep(2300);
check('mobile: lật xe → bảng kết thúc vừa màn hình', (await visible('#ovOver')) && (await noOverflow()) && (await inView('#ovOver .btn')));
await shot('over-mobile.png');
await pressSel('#shopBtn');
check('nút "Nâng cấp xe" → về menu có cửa hàng', (await ev('__game.mode')) === 'menu' && (await visible('#ups')));
await shot('shop-mobile.png');

// ===== 3. Nhiều cỡ màn hình =====
for (const [w, h, m, name] of [[360, 640, true, 'mobile 360×640'], [412, 915, true, 'mobile 412×915'], [844, 390, true, 'mobile ngang 844×390'], [768, 1024, true, 'tablet 768×1024'], [1280, 720, false, 'laptop 1280×720'], [1920, 1080, false, 'desktop 1920×1080']]) {
  await view(w, h, m, m ? 2 : 1); await touch(m); press = m ? tap : click;
  await nav(BASE + '?seed=31');
  check(`${name}: menu + nút Lên đường nằm gọn`, (await noOverflow()) && (await ev('(()=>{const b=document.querySelector("#playBtn"),o=document.querySelector("#ovMenu");o.scrollTop=o.scrollHeight;const r=b.getBoundingClientRect();return r.bottom<=innerHeight+.5&&r.top>=0})()')));
  await pressSel('#playBtn');
  await ev('__game.step(1.5,{gas:true,brake:false})'); await sleep(250);
  await layoutOk(name);
  if (name.includes('ngang')) await shot('play-mobile-landscape.png');
  if (name.includes('1280')) await shot('play-laptop.png');
}

check('không có lỗi console / exception', errors.length === 0, errors.slice(0, 5).join(' | '));
const fails = R.filter(r => r.startsWith('FAIL')).length;
const summary = `${R.length - fails}/${R.length} PASS`;
console.log(summary);
writeFileSync(OUT + '/e2e-ket-qua.txt', `E2E Đua Xe Vượt Đồi — Chrome headless (CDP), ${new Date().toISOString()}\n${R.join('\n')}\n${summary}\n`);
ws.close(); chrome.kill();
process.exit(fails ? 1 : 0);
