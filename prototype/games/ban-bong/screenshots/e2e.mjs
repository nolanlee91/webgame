// E2E Bắn Bóng Khủng Long trên Chrome headless — chuột / chạm kéo-thả / phím thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   node prototype/games/ban-bong/screenshots/e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const OUT = process.argv[2] || '.', BASE = 'http://127.0.0.1:8768/games/ban-bong/';
mkdirSync(OUT, { recursive: true });
try { rmSync(OUT + '/prof', { recursive: true, force: true }); } catch {}
const PORT = 9347;
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
const VK = { ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Escape: 27, Enter: 13, ' ': 32 };
async function key(k) {
  let c, vk = VK[k], text;
  if (/^[a-z]$/i.test(k)) { c = 'Key' + k.toUpperCase(); vk = k.toUpperCase().charCodeAt(0); text = k; }
  else if (k === ' ') { c = 'Space'; text = ' '; } else c = k;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code: c, key: k, windowsVirtualKeyCode: vk, text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: c, key: k, windowsVirtualKeyCode: vk });
  await sleep(30);
}
const mouse = (type, x, y, buttons = 1) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons, clickCount: 1 });
const click = async (x, y) => { await mouse('mouseMoved', x, y, 0); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y, 0); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(30); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
async function touchDrag(a, b, end = true) {
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  for (let t = 1; t <= 6; t++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + (b.x - a.x) * t / 6, y: a.y + (b.y - a.y) * t / 6 }] }); await sleep(20); }
  if (end) await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(!r.width)return null;return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(150); };
const S = () => ev('(()=>{const g=__game.state;return g&&{mode:g.mode,level:g.level,status:g.status,score:g.score,shots:g.shots,fired:g.fired,misses:g.misses,par:g.par,cur:g.cur,next:g.next,eggsLeft:g.eggsLeft,eggsTotal:g.eggsTotal,stars:g.stars,bonus:g.bonus,refills:g.refills,n:g.grid.filter(Boolean).length}})()');
const idleWait = async () => { for (let i = 0; i < 300; i++) { if (!(await ev('__game.busy'))) return true; await sleep(40); } return false; };
const visible = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&!!e.offsetParent})()`);
const txt = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const noOverflow = () => ev('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight');
const inView = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>e.offsetParent).every(e=>{const r=e.getBoundingClientRect();return r.left>=-.5&&r.top>=-.5&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5})`);
const fitsStage = () => ev(`(()=>{const b=document.querySelector('#stage').getBoundingClientRect(),a=document.querySelector('#frame').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+8&&a.top>=b.top-1&&a.bottom<=b.bottom+8})()`);
const noOverlap = () => ev(`(()=>{const a=document.querySelector('#frame').getBoundingClientRect();return [...document.querySelectorAll('.acts .btn,.stats,.mini .btn')].filter(e=>e.offsetParent).every(e=>{const b=e.getBoundingClientRect();return a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1})})()`);
// canvas có vẽ thật (đếm số màu khác nhau trên một dải ngang qua sân)
const canvasColors = () => ev(`(()=>{const c=document.querySelector('#cv'),g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data,set=new Set();for(let i=0;i<d.length;i+=4*97)set.add(d[i]<<16|d[i+1]<<8|d[i+2]);return set.size})()`);
const IMP = `const L=await import('./logic.js');`;
const fixture = (rows, cur, next, extra = '') => ev(`(async()=>{${IMP}const s=__game.state;L.gridFrom(s,${JSON.stringify(rows)},{cur:${cur},next:${next}});${extra};__game.resync();return true})()`);
const cellXY = (r, c) => ev(`__game.cellScreen(${r * 11 + c})`);
const W = 11;
const layoutOk = async (name) => {
  check(`${name}: không tràn trang, sân nằm gọn trong khung, không đè HUD/nút`, (await noOverflow()) && (await fitsStage()) && (await noOverlap()) && (await inView('.acts .btn, .stats')),
    JSON.stringify(await ev('(()=>{const f=document.querySelector("#frame").getBoundingClientRect();return {w:Math.round(f.width),h:Math.round(f.height),cs:__game.layout.cs}})()')));
};

// ===== 1. Desktop: chuột + bàn phím =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('__game.destroy(); localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game: 12 màn + Tự do, chỉ màn 1 mở', await visible('#ovMenu') && (await ev('document.querySelectorAll(".lvb").length')) === 13 && (await ev('document.querySelectorAll(".lvb.lock").length')) === 11);
check('ô thông tin màn 1: cứu 3 trứng, 20 viên, 3 màu', /cứu 3/.test(await txt('#pick')) && /20 viên/.test(await txt('#pick')) && /3 màu/.test(await txt('#pick')));
check('icon trứng/đá/bom trong hướng dẫn là pixel vẽ bằng code', await ev('[...document.querySelectorAll(".how .ic")].every(e=>e.style.backgroundImage.startsWith("url(\\"data:image/png"))'));
check('sau menu vẫn thấy sân mẫu được vẽ trên canvas', (await canvasColors()) > 12);
await shot('ban-bong-desktop-menu.png');
await pressSel('.lvb.lock');
check('bấm màn chưa mở → không chọn được', (await ev('__game.save.sel')) === 1);
await pressSel('#playBtn');
await ev('__game.speed = 0.35');
let s = await S();
check('bấm Bắt đầu → vào màn 1, 20 viên, 3 trứng', s && s.status === 'playing' && s.level === 1 && s.shots === 20 && s.eggsTotal === 3);
check('HUD: còn 20 viên, màn 1/12, 3 icon trứng', (await txt('#hShots')) === '20' && (await txt('#hLevel')) === '1/12' && (await ev('document.querySelectorAll("#hEggs i").length')) === 3);
check('màn 1 không hạ trần → ẩn ô đếm hụt', !(await visible('#pushBox')));
await layoutOk('desktop 1440×900');

// rê chuột ngắm
const L0 = await ev(`__game.toScreen(5.5, 12.59)`);
await mouse('mouseMoved', L0.x + 200, L0.y - 200, 0); await sleep(60);
const aimR = await ev('__game.aim');
await mouse('mouseMoved', L0.x - 200, L0.y - 200, 0); await sleep(60);
const aimL = await ev('__game.aim');
check('rê chuột sang phải/trái → nòng xoay theo (≈45° / 135°)', Math.abs(aimR - Math.PI / 4) < 0.05 && Math.abs(aimL - 3 * Math.PI / 4) < 0.05, `${aimR.toFixed(2)} / ${aimL.toFixed(2)}`);
await mouse('mouseMoved', L0.x + 40, L0.y + 60, 0); await sleep(60);
check('rê chuột xuống dưới bệ → góc bị kẹp, không bắn ngược xuống', Math.abs((await ev('__game.aim')) - 9 * Math.PI / 180) < 0.01);

// bấm chuột để bắn thật
s = await S();
const p0 = await ev('__game.toScreen(5.5, 4)');
await click(p0.x, p0.y); await sleep(40);
check('bấm chuột → bóng bay (đang bay)', await ev('__game.flying'));
await idleWait();
let s2 = await S();
check('bóng dính lên bàn, còn 19 viên', s2.fired === 1 && s2.shots === 19 && (s2.n === s.n + 1 || s2.score > 0), JSON.stringify({ n0: s.n, n1: s2.n, sc: s2.score }));
check('âm thanh bắn đã phát (nếu tải được)', (await ev('__game.sfx.loaded')) === 0 || (await ev('__game.sfx.log.some(l=>l.n==="tha-moc")')));

// fixture: nổ 3 viên + làm rơi phần treo bên dưới, cứu trứng khi rơi
await fixture(['11111011111', '....0.....', '....3......', '...b.......', '', '', '', '', '', '', '', ''], 0, 0, 's.eggsLeft=2;s.eggsTotal=3;s.shots=15;s.shotsMax=20');
await ev('__game.resync()');
const tgt = await cellXY(1, 5);
await click(tgt.x, tgt.y); await idleWait(); await sleep(100);
s = await S();
check('bắn trúng nhóm 2 viên cùng màu → nổ 3, bóng treo bên dưới rơi, trứng rơi được cứu', s.eggsLeft === 1 && s.n === 10 && s.score === 30 + 40 + 100, JSON.stringify(s));
check('HUD trứng: 2/3 đã cứu (icon trứng nở)', /2\/3/.test(await txt('#hEggs')) && (await ev('document.querySelectorAll("#hEggs i.got").length')) === 2);
check('hiệu ứng nổ/rơi/trứng bay đang chạy trên canvas', (await ev('__game.fxCount')) > 0);

// phím: ← → xoay nòng, X đổi viên, Space bắn
await ev('__game.aim = Math.PI/2');
await key('ArrowLeft'); await key('ArrowLeft');
const aK = await ev('__game.aim');
check('phím ← xoay nòng sang trái 2°/lần', Math.abs(aK - (Math.PI / 2 + 4 * Math.PI / 180)) < 1e-6);
await fixture(['00000000000', '1111111111', '22222222222'], 0, 1, 's.eggsLeft=1;s.eggsTotal=3');
await key('x');
s = await S();
check('phím X đổi viên đang bắn ↔ viên kế', s.cur === 1 && s.next === 0);
const Lc = await ev('__game.toScreen(5.5, 12.59)');
await click(Lc.x, Lc.y); await sleep(50);
s = await S();
check('bấm chuột vào bệ phóng → đổi viên (không bắn)', s.cur === 0 && s.next === 1 && s.fired >= 1 && !(await ev('__game.flying')));
const firedBefore = s.fired;
await key(' '); await sleep(30);
check('phím Space bắn', await ev('__game.flying'));
await idleWait();
s = await S();
check('sau khi bắn bằng phím: đã bắn thêm 1 viên', s.fired === firedBefore + 1);
await mouse('mouseMoved', L0.x + 150, L0.y - 320, 0); await sleep(150);
await shot('ban-bong-desktop-choi.png');

// hạ trần: bắn hụt đủ số lần
await fixture(['11111111111', '2222c22222', '11111111111'], 0, 0, 's.push=3;s.misses=2');
await ev('__game.fire(Math.PI/2)'); await idleWait();
s = await S();
check('bắn hụt lần thứ 3 → trần hạ một hàng (đổi chẵn lẻ), có thông báo', s.par === 1 && s.misses === 0 && s.n === 32 + 1 + 10 && (await ev('!!document.querySelector(".banner")')), JSON.stringify(s));
check('ô đếm hụt hiện đúng 3 nấc', (await visible('#pushBox')) && (await ev('document.querySelectorAll("#hPush i").length')) === 3);

// bom
await fixture(['11111111111', '2222*22222', '33333*33333'], 0, 0, 's.eggsLeft=1;s.push=0');
const bt = await cellXY(3, 5);
await click(bt.x, bt.y); await idleWait();
s = await S();
check('bắn chạm bom → bom nổ dây chuyền, xóa vùng xung quanh', s.n === 32 - 9 + 1 - 0 && (await ev('__game.sfx.loaded')) === 0 || (s.n <= 24), JSON.stringify(s));

// thắng: cứu trứng cuối cùng
await fixture(['11111001111', '....a.....'], 0, 0, 's.shots=12;s.shotsMax=20');
const wt = await cellXY(0, 5);
await click(wt.x, wt.y); await idleWait(); await sleep(200);
s = await S();
check('cứu trứng cuối → thắng, thưởng viên dư, 3 sao', s.status === 'won' && s.bonus === 11 * 50 && s.stars === 3, JSON.stringify(s));
check('bảng thắng hiện: 3 sao, trứng nở, nút Màn tiếp', (await visible('#ovWin')) && (await ev('document.querySelectorAll("#wStars i.on").length')) === 3 && (await ev('document.querySelectorAll("#wEggs i").length')) === 3 && (await visible('#nextBtn')));
check('mở khóa màn 2, lưu sao', (await ev('__game.save.unlocked')) === 2 && (await ev('__game.save.stars[1]')) === 3 && (await ev('JSON.parse(localStorage.getItem("wgp.ban-bong.v1")).unlocked')) === 2);
check('SDK nhận kết quả thắng', (await ev('window.__lastResult && window.__lastResult.result')) === 'won');
await sleep(700);
await shot('ban-bong-desktop-thang.png');
await pressSel('#nextBtn');
s = await S();
check('bấm Màn tiếp → màn 2 (4 trứng, 20 viên, có hạ trần)', s.level === 2 && s.eggsTotal === 4 && s.shots === 20 && (await visible('#pushBox')));

// thua do chạm vạch đỏ
{
  const rows = []; for (let r = 0; r < 12; r++) rows.push(r % 2 ? '1'.repeat(W - 1) : '2'.repeat(W));
  rows[0] = 'a' + '2'.repeat(W - 1);
  await fixture(rows, 0, 0, 's.push=0');
}
await ev('__game.fire(Math.PI/2)'); await idleWait(); await sleep(100);
s = await S();
check('bóng chạm vạch đỏ → thua', s.status === 'lost' && (await visible('#ovLose')) && /vạch đỏ/.test(await txt('#lTitle')));
check('bảng thua ghi số trứng chưa cứu', /Còn 1/.test(await txt('#lMiss')));
await shot('ban-bong-desktop-thua.png');
await pressSel('#retryBtn');
s = await S();
check('Chơi lại → bàn mới màn 2', s.status === 'playing' && s.level === 2 && s.fired === 0);

// thua do hết viên
await fixture(['a1111111111', '2222222222'], 1, 1, 's.shots=1;s.push=0');
await ev('__game.fire(Math.PI/2)'); await idleWait(); await sleep(100);
check('hết viên chưa cứu đủ trứng → thua "Hết viên!"', (await txt('#lTitle')) === 'Hết viên!');
await pressSel('#menuBtnL');

// lưu / chơi tiếp
await pressSel('.lvb[data-lv="2"]'); await pressSel('#playBtn');
await ev('__game.fire(1.2)'); await idleWait();
const saved = await ev(`(async()=>{${IMP}return JSON.stringify(L.serialize(__game.state))})()`);
await nav(BASE + '?seed=11');
check('tải lại trang → menu có nút "Chơi tiếp" + "Chơi lại từ đầu"', /Chơi tiếp/.test(await txt('#playBtn')) && (await visible('#freshBtn')));
await pressSel('#playBtn');
const resumed = await ev(`(async()=>{${IMP}const x=L.serialize(__game.state);return JSON.stringify(x)})()`);
check('Chơi tiếp → khôi phục đúng ván đang chơi (bàn, viên, điểm)', JSON.parse(resumed).grid.join() === JSON.parse(saved).grid.join() && JSON.parse(resumed).shots === JSON.parse(saved).shots && JSON.parse(resumed).cur === JSON.parse(saved).cur);
// dữ liệu lưu hỏng
await ev('__game.destroy(); localStorage.setItem("wgp.ban-bong.v1", JSON.stringify({unlocked:99, stars:{1:"x"}, sel:"abc", game:{v:1, grid:[1,2,3]}}))');
await nav(BASE + '?seed=11');
check('dữ liệu lưu hỏng → không lỗi, bỏ ván hỏng, giới hạn màn mở ≤ 12', (await visible('#ovMenu')) && (await ev('__game.save.game')) === null && (await ev('__game.save.unlocked')) === 12 && !/Chơi tiếp/.test(await txt('#playBtn')));
await ev('__game.destroy(); localStorage.setItem("wgp.ban-bong.v1", "{rác")');
await nav(BASE + '?seed=11');
check('JSON lưu hỏng hẳn → về mặc định', (await ev('__game.save.unlocked')) === 1);

// Tự do
await pressSel('.lvb.free'); await pressSel('#playBtn'); await ev('__game.speed = 0.35');
s = await S();
check('chế độ Tự do: không giới hạn viên, ẩn ô trứng, HUD "Tự do"', s.mode === 'free' && s.shots === null && !(await visible('#eggsBox')) && (await txt('#hLevel')) === 'Tự do');
await fixture(['00.........'], 0, 0);
const ft = await cellXY(0, 2);
await click(ft.x, ft.y); await idleWait();
s = await S();
check('Tự do: dọn sạch bàn → +500 và bàn mới', s.refills === 1 && s.n > 20 && s.status === 'playing');
// âm thanh + Esc
const m0 = await ev('localStorage.getItem("wgp.muted")');
await key('m');
check('phím M tắt tiếng, lưu wgp.muted', (await ev('localStorage.getItem("wgp.muted")')) === '1' && m0 !== '1' && /tắt/.test(await txt('#muteTx')));
await key('m');
await key('Escape');
check('Esc → về menu', await visible('#ovMenu'));
await key('Escape');
check('Esc lần nữa → đóng menu, chơi tiếp ván đang dở', !(await visible('#ovMenu')) && (await S()).mode === 'free');

// ===== 2. Các khung hình khác: không tràn, không đè =====
for (const [w, h, m, dpr, name] of [[1920, 1080, false, 1, 'desktop 1920×1080'], [1280, 720, false, 1, 'laptop 1280×720'], [768, 1024, true, 2, 'tablet dọc 768×1024'], [360, 640, true, 3, 'điện thoại nhỏ 360×640']]) {
  await view(w, h, m, dpr); await sleep(400);
  await layoutOk(name);
}

// ===== 3. Mobile dọc: chạm kéo để ngắm, thả để bắn =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=21'); await ev('__game.destroy(); localStorage.clear()'); await nav(BASE + '?seed=21');
check('mobile: menu vừa màn hình, bấm được', (await noOverflow()) && (await inView('#playBtn')));
await shot('ban-bong-mobile-menu.png');
await pressSel('#playBtn'); await ev('__game.speed = 0.35');
await layoutOk('mobile 390×844');
check('mobile: hiện dòng hướng dẫn chạm', await visible('#hintTx'));
s = await S();
const mL = await ev('__game.toScreen(5.5, 12.59)'), mT = await ev('__game.toScreen(8, 3)');
await touchDrag({ x: mL.x - 30, y: mL.y - 120 }, mT, false); await sleep(120);
check('mobile: chạm kéo → nòng xoay theo ngón tay (chưa bắn)', !(await ev('__game.flying')) && (await ev('__game.aim')) < Math.PI / 2 && (await S()).fired === 0);
await shot('ban-bong-mobile-ngam.png');
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(40);
check('mobile: thả tay → bắn', (await ev('__game.flying')) || (await S()).fired === 1);
await idleWait();
check('mobile: còn 19 viên', (await S()).shots === 19);
const mB = await ev('__game.toScreen(7, 13.4)');
await touchDrag(mT, mB); await sleep(80);
check('mobile: kéo xuống dưới bệ rồi thả → hủy, không bắn', (await S()).fired === 1 && !(await ev('__game.flying')));
s = await S();
await tap(mL.x, mL.y); await sleep(60);
const s3 = await S();
check('mobile: chạm bệ → đổi viên', s3.cur === s.next && s3.next === s.cur && s3.fired === 1);
await pressSel('#swapBtn');
check('mobile: nút Đổi viên hoạt động', (await S()).cur === s.cur);
// chơi vài viên bằng bot để có bàn đang dở cho ảnh
for (let n = 0; n < 3; n++) { await ev(`(async()=>{${IMP}__game.fire(L.bestShot(__game.state, 60).a)})()`); await idleWait(); }
await sleep(500);
await shot('ban-bong-mobile-choi.png');
await fixture(['11111001111', '....a.....'], 0, 0, 's.shots=10;s.shotsMax=20;s.eggsTotal=3');
const mw = await cellXY(0, 5);
await touchDrag({ x: mL.x, y: mL.y - 100 }, mw); await idleWait(); await sleep(900);
check('mobile: thắng → bảng thắng vừa màn hình', (await visible('#ovWin')) && (await inView('#ovWin .btn')));
await shot('ban-bong-mobile-thang.png');

// ===== 4. Mobile xoay ngang =====
await pressSel('#nextBtn'); await ev('__game.speed = 0.35');
await view(844, 390, true, 3); await sleep(500);
await layoutOk('mobile ngang 844×390');
for (let n = 0; n < 2; n++) { await ev(`(async()=>{${IMP}__game.fire(L.bestShot(__game.state, 60).a)})()`); await idleWait(); }
await sleep(400);
await shot('ban-bong-mobile-ngang.png');

check('không có lỗi console / exception trong suốt quá trình', errors.length === 0, errors.slice(0, 3).join(' | '));
const pass = R.filter(r => r.startsWith('PASS')).length;
const summary = `${pass}/${R.length} PASS`;
console.log(summary);
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + '\n' + summary + '\n');
ws.close(); chrome.kill();
process.exit(pass === R.length ? 0 : 1);
