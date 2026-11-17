// E2E 2048 trên Chrome headless — phím / chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   node screenshots/e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const OUT = process.argv[2] || '.', BASE = 'http://127.0.0.1:8768/games/2048/';
mkdirSync(OUT, { recursive: true });
try { rmSync(OUT + '/prof', { recursive: true, force: true }); } catch {}
const PORT = 9344;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
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
const KEYS = { ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39], ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40],
  KeyW: ['w', 87], KeyA: ['a', 65], KeyS: ['s', 83], KeyD: ['d', 68], KeyZ: ['z', 90], KeyN: ['n', 78], KeyM: ['m', 77], Escape: ['Escape', 27] };
const keyDown = (code, repeat = false) => { const [k, vk] = KEYS[code]; return send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: k, windowsVirtualKeyCode: vk, autoRepeat: repeat, text: k.length === 1 ? k : undefined }); };
const keyUp = code => { const [k, vk] = KEYS[code]; return send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k, windowsVirtualKeyCode: vk }); };
const key = async (code, wait = 40) => { await keyDown(code); await keyUp(code); await sleep(wait); };
const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
const click = async (x, y) => { await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
async function drag(x0, y0, x1, y1) { await mouse('mousePressed', x0, y0); for (let i = 1; i <= 5; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (x1 - x0) * i / 5, y: y0 + (y1 - y0) * i / 5, button: 'left', buttons: 1 }); await sleep(15); } await mouse('mouseReleased', x1, y1); }
const tStart = (x, y) => send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
const tMove = (x, y) => send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
const tEnd = () => send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const tap = async (x, y) => { await tStart(x, y); await tEnd(); };
async function swipe(x0, y0, x1, y1, ms = 80, steps = 4) { await tStart(x0, y0); for (let i = 1; i <= steps; i++) { await sleep(ms / steps); await tMove(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); } await tEnd(); }
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(!r.width)return null;return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(150); };
const S = () => ev('(()=>{const g=__game.state;return g&&{status:g.status,size:g.size,score:g.score,moves:g.moves,time:g.time,undoLeft:g.undoLeft,won:g.won,maxTile:g.maxTile,cells:g.cells.map(c=>c?c.v:0)}})()');
const visible = sel => ev(`!document.querySelector(${JSON.stringify(sel)}).closest('[hidden]')`);
// DOM khớp state: mỗi ô có đúng 1 phần tử cùng giá trị ở đúng vị trí
const domOk = () => ev(`(()=>{const g=__game.state,n=g.size;const els=[...document.querySelectorAll('#board .tile')];if(els.length!==g.cells.filter(Boolean).length)return 'số ô DOM '+els.length+' ≠ '+g.cells.filter(Boolean).length;for(const e of els){const c=g.cells[+e.dataset.at];if(!c||c.v!==+e.dataset.v||c.id!==+e.dataset.id)return 'lệch ở ô '+e.dataset.at;}return 'ok'})()`);
const setBoard = (vals, extra = '') => ev(`(()=>{const g=__game.state;let id=g.nextId;g.cells=${JSON.stringify(vals)}.map(v=>v?{id:id++,v}:null);g.nextId=id;g.history=[];g.status='playing';g.won=false;g.maxTile=Math.max(...g.cells.map(c=>c?c.v:0));${extra};__game.resync();return 1})()`);
const boardBox = () => ev(`(()=>{const r=document.querySelector('#board').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()`);
const noOverflow = () => ev('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight');
const inView = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>e.offsetParent).every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5})`);
const fitsStage = () => ev(`(()=>{const a=document.querySelector('#frame').getBoundingClientRect(),b=document.querySelector('#stage').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1})()`);

// ===== 1. Desktop, phím + chuột =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('__game.destroy(); localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game', await visible('#ovMenu'));
await shot('g2048-desktop-menu.png');
await pressSel('#playBtn'); await sleep(200);
let s = await S();
check('Bắt đầu → ván 4×4, 2 ô đầu', s && s.size === 4 && s.status === 'playing' && s.cells.filter(Boolean).length === 2, JSON.stringify(s && s.cells));
check('DOM khớp bàn lúc đầu', (await domOk()) === 'ok', await domOk());
// 40 nước bằng phím mũi tên
const dirs = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
let okAll = true, bad = '';
for (let i = 0; i < 40; i++) {
  await key(dirs[(i * 3 + (i >> 2)) % 4], 20);
  await sleep(130);
  const d = await domOk(); if (d !== 'ok') { okAll = false; bad = d; break; }
}
s = await S();
check('40 lần bấm mũi tên → ô trượt/gộp, DOM luôn khớp bàn', okAll && s.moves > 15, bad || 'nước=' + s.moves + ' điểm=' + s.score);
const sumBoard = s.cells.reduce((a, b) => a + b, 0);
check('điểm ghi trên HUD đúng', (await ev('document.querySelector("#hScore").textContent')) === s.score.toLocaleString('vi-VN'));
await shot('g2048-desktop-choi.png');
// WASD
let m0 = s.moves;
for (const k of ['KeyA', 'KeyW', 'KeyD', 'KeyS']) { await key(k, 20); await sleep(130); }
s = await S();
check('phím WASD cũng trượt', s.moves > m0, m0 + '→' + s.moves);
void sumBoard;
// Gộp xác định
if (s.status !== 'playing') { await pressSel('#againBtn'); }
await setBoard([2, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
let sc0 = (await S()).score;
await key('ArrowLeft', 0); await sleep(60); await shot('g2048-desktop-dang-gop.png'); await sleep(200);
s = await S();
check('[2,2,4,4] ← → [4,8], +12 điểm', s.cells[0] === 4 && s.cells[1] === 8 && s.score - sc0 === 12, JSON.stringify(s.cells.slice(0, 4)));
check('DOM sau gộp đúng', (await domOk()) === 'ok', await domOk());
// Độ mượt chữ "+điểm": lấy mẫu từng khung hình, phải đổi vị trí liên tục (không nhảy bậc), chỉ dùng transform
await sleep(900);
await setBoard([16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const smooth = ev(`new Promise(res=>{const ys=[],ops=[];let f0=null,t0=performance.now();const tick=()=>{const f=document.querySelector('#board .float');if(f){f0=f0||f;const m=new DOMMatrix(getComputedStyle(f).transform);ys.push(Math.round(m.m42*10)/10);ops.push(+getComputedStyle(f).opacity)}if(performance.now()-t0<1100)requestAnimationFrame(tick);else res({n:ys.length,distinct:new Set(ys).size,mono:ys.slice(3).every((y,i,a)=>i===0||y<=a[i-1]+0.01),left:f0&&f0.style.left,maxOp:Math.max(...ops),gone:!document.querySelector('#board .float')})};requestAnimationFrame(tick)})`);
await key('ArrowLeft', 0);
const sm = await smooth;
check('chữ "+điểm" bay mượt: vị trí đổi mỗi khung hình, chỉ dùng transform, tự dọn khi xong', sm.distinct >= 15 && sm.mono && !sm.left && sm.maxOp === 1 && sm.gone, JSON.stringify(sm));
// Gộp dồn dập: không chồng quá 3 chữ trên bàn, chỉ 1 chữ ở ô điểm
let maxF = 0, maxG = 0;
for (let i = 0; i < 10; i++) {
  await setBoard([8, 8, 8, 8, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  await key(i % 2 ? 'ArrowRight' : 'ArrowLeft', 0); await sleep(130);
  const c = await ev(`[document.querySelectorAll('#board .float').length, document.querySelectorAll('#scoreBox .gain').length]`);
  maxF = Math.max(maxF, c[0]); maxG = Math.max(maxG, c[1]);
}
await sleep(1300);
const left = await ev(`document.querySelectorAll('#board .float, #scoreBox .gain, #board .part').length`);
check('gộp liên tiếp 10 lần: tối đa 3 chữ bay, 1 chữ ở ô điểm, dọn sạch sau đó', maxF <= 3 && maxF >= 1 && maxG === 1 && left === 0, `float≤${maxF} gain≤${maxG} còn ${left}`);
// Nước không đổi gì
const before = JSON.stringify((await S()).cells); m0 = (await S()).moves;
await setBoard([2, 4, 8, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
m0 = (await S()).moves;
await key('ArrowLeft'); await key('ArrowUp'); await sleep(150);
check('nước không làm gì thay đổi → không tính, không sinh ô', (await S()).moves === m0 && (await S()).cells.filter(Boolean).length === 4);
void before;
// Hoàn tác
await key('ArrowDown'); await sleep(150);
s = await S();
check('↓ đi được', s.moves === m0 + 1 && s.cells.filter(Boolean).length === 5);
await key('KeyZ'); await sleep(100); s = await S();
check('Z hoàn tác → bàn trở lại, còn 2 lần', JSON.stringify(s.cells) === JSON.stringify([2, 4, 8, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) && s.undoLeft === 2 && (await domOk()) === 'ok');
check('số lần hoàn tác hiện trên nút', (await ev('document.querySelector("#undoN").textContent')) === '2');
await key('KeyZ'); await sleep(80);
check('hết bước để lùi → không trừ lượt', (await S()).undoLeft === 2);
await key('ArrowDown'); await sleep(150); await pressSel('#undoBtn'); await sleep(100);
check('nút Hoàn tác (chuột) hoạt động', (await S()).undoLeft === 1);
// Kéo chuột trên bàn
let [bx, by, bw, bh] = await boardBox();
m0 = (await S()).moves;
await drag(bx + bw * 0.3, by + bh * 0.5, bx + bw * 0.3, by + bh * 0.95); await sleep(200);
check('kéo chuột xuống trên bàn → trượt xuống', (await S()).moves === m0 + 1);
// Thắng
await setBoard([1024, 1024, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
await key('ArrowLeft'); await sleep(700);
s = await S();
check('ghép 1024+1024 → 2048, hiện màn Đạt 2048!', s.status === 'won' && await visible('#ovWin') && (await ev('document.querySelector("#wTitle").textContent')).includes('2048'), s.status + ' ' + await ev('document.querySelector("#wTitle").textContent'));
const lr = await ev('window.__lastResult');
check('báo SDK gameOver result=goal', lr && lr.result === 'goal' && lr.maxTile === 2048);
await shot('g2048-desktop-thang.png');
await pressSel('#keepBtn'); await sleep(100); s = await S();
check('Chơi tiếp → tiếp tục ván, không hỏi lại', s.status === 'playing' && s.won && !(await visible('#ovWin')));
// Thua: một nước cuối làm bàn kín không gộp được
await setBoard([0, 2, 4, 8, 16, 32, 64, 128, 2, 4, 8, 16, 32, 64, 128, 256], 'g.won=true');
await key('ArrowLeft'); await sleep(250);
s = await S();
check('bàn kín không còn cặp → hết nước đi', s.status === 'over');
await sleep(1100);
check('hiện bảng Hết nước đi / Kết thúc + kỷ lục', await visible('#ovEnd') && (await ev('document.querySelector("#eRecord").textContent')).includes('Kỷ lục'));
await shot('g2048-desktop-thua.png');
check('phím mũi tên bị chặn khi đã thua', await (async () => { const a = (await S()).moves; await key('ArrowRight'); return (await S()).moves === a; })());
await pressSel('#endUndoBtn'); await sleep(150); s = await S();
check('Hoàn tác từ bảng thua → chơi lại được', s.status === 'playing' && !(await visible('#ovEnd')) && s.undoLeft === 0);
check('hết lượt hoàn tác → nút mờ', await ev('document.querySelector("#undoBtn").disabled'));
// Lưu ván + nạp lại trang
await setBoard([2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 8, 0, 0, 0, 0, 16], 'g.score=4321');
await key('ArrowRight'); await sleep(150);
s = await S();
const savedScore = s.score, savedCells = JSON.stringify(s.cells);
await nav(BASE);
check('mở lại trang → menu có "Chơi tiếp" kèm điểm', (await ev('document.querySelector("#playBtn").textContent')).includes('Chơi tiếp') && await visible('#freshBtn'));
await pressSel('#playBtn'); await sleep(150); s = await S();
check('Chơi tiếp → đúng ván đã lưu', s.score === savedScore && JSON.stringify(s.cells) === savedCells && (await domOk()) === 'ok');
// Ván mới có hỏi lại
await key('KeyN'); await sleep(100);
check('N giữa ván → hỏi "Ván mới?"', await visible('#ovConfirm'));
await key('Escape'); await sleep(100);
check('Esc huỷ, ván giữ nguyên', !(await visible('#ovConfirm')) && (await S()).score === savedScore);
await pressSel('#newBtn'); await pressSel('#yesNewBtn'); await sleep(100); s = await S();
check('đồng ý → ván mới sạch', s.moves === 0 && s.score === 0 && s.cells.filter(Boolean).length === 2);
const sv = await ev('JSON.parse(localStorage.getItem("wgp.2048.v1"))');
check('lưu kỷ lục 4×4 + ô lớn nhất', sv && sv.best[4] >= savedScore && sv.top[4] >= 2048, JSON.stringify(sv && { best: sv.best, top: sv.top }));
// Đồng hồ
await key('ArrowLeft'); await key('ArrowDown');
const t1 = (await S()).time; await sleep(1200); const t2 = (await S()).time;
check('đồng hồ chạy khi chơi', t2 > t1 + 0.9);
await key('Escape'); await sleep(100); const t3 = (await S()).time; await sleep(700);
check('Esc → về menu, đồng hồ dừng', await visible('#ovMenu') && (await S()).time === t3);
// Âm thanh
const mu0 = await ev('localStorage.getItem("wgp.muted")');
await key('KeyM'); const mu1 = await ev('localStorage.getItem("wgp.muted")');
check('M tắt/bật tiếng, lưu chung wgp.muted', mu0 !== mu1 && (await ev('document.querySelector(".muteIc").src')).includes(mu1 === '1' ? 'tat' : 'bat'));
await key('KeyM');
check('âm thanh tải đủ 7 file', (await ev('__game.sfx.loaded')) === 7, await ev('__game.sfx.loaded'));
// Cỡ 5×5 và 3×3
await pressSel('.mode[data-size="5"]');
check('menu 5×5 chưa có ván → nút Bắt đầu', (await ev('document.querySelector("#playBtn").textContent')).includes('Bắt đầu'));
await pressSel('#playBtn'); await sleep(150);
for (let i = 0; i < 24; i++) { await key(dirs[i % 4], 10); await sleep(120); }
s = await S();
check('5×5: bàn 25 ô, mục tiêu 4096, DOM khớp', s.size === 5 && s.cells.length === 25 && (await domOk()) === 'ok' && (await ev('document.querySelector("#hTopL").textContent')).includes('4096'));
check('5×5 vừa khung', await fitsStage());
await shot('g2048-desktop-5x5.png');
await key('Escape'); await pressSel('.mode[data-size="3"]'); await pressSel('#playBtn'); await sleep(150);
await setBoard([128, 128, 0, 0, 0, 0, 0, 0, 0]);
await key('ArrowLeft'); await sleep(700);
check('3×3: ghép tới 256 là thắng', (await S()).status === 'won' && (await ev('document.querySelector("#wTitle").textContent')).includes('256'));
await pressSel('#keepBtn');
// Ô lớn hiển thị đủ chữ số
await key('Escape'); await pressSel('.mode[data-size="4"]'); await pressSel('#playBtn'); await sleep(150);
await setBoard([2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 65536, 131072], 'g.won=true');
const fitText = await ev(`[...document.querySelectorAll('#board .tile span')].every(sp=>{const t=sp.getBoundingClientRect(),f=sp.closest('.tile').getBoundingClientRect();return t.width<=f.width-4})`);
check('ô đến 131072 vẫn vừa chữ', fitText);
await shot('g2048-desktop-bang-mau.png');

// ===== 2. Nhiều cỡ màn hình =====
for (const [w, h, mob, label] of [[1440, 900, false, 'desktop lớn'], [1280, 720, false, 'laptop'], [1024, 768, false, 'tablet ngang'], [768, 1024, true, 'tablet dọc'], [390, 844, true, 'điện thoại'], [360, 640, true, 'điện thoại nhỏ'], [844, 390, true, 'điện thoại ngang']]) {
  await view(w, h, mob, 1); await sleep(350);
  const L = await ev('__game.layout');
  const f = [await fitsStage(), await noOverflow(), await inView('.acts .btn'), (await ev('getComputedStyle(document.querySelector(".keys")).display'))==='none' || await inView('.keys')];
  check(`${label} ${w}×${h}: bàn vừa khung, không tràn, nút trong màn hình`, f.every(Boolean) && L.cs >= 40, 'ô ' + L.cs + 'px ' + f.join(','));
}

// ===== 3. Mobile chạm =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=5'); await ev('__game.destroy(); localStorage.removeItem("wgp.2048.v1")'); await nav(BASE + '?seed=5');
await shot('g2048-mobile-menu.png');
await pressSel('#playBtn'); await sleep(200);
check('mobile: chạm Bắt đầu', (await S()).status === 'playing');
[bx, by, bw, bh] = await boardBox();
const cx = bx + bw / 2, cy = by + bh / 2, d = bw * 0.3;
const sws = { left: [cx + d, cy, cx - d, cy], right: [cx - d, cy, cx + d, cy], up: [cx, cy + d, cx, cy - d], down: [cx, cy - d, cx, cy + d] };
let okSw = true;
for (const [dir, v] of Object.entries(sws)) {
  const tiles = { left: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], right: [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], up: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0], down: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  // đặt ô ở phía ngược lại để chắc chắn nước vuốt có tác dụng
  const startVals = { left: [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], right: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], up: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0], down: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  void tiles;
  await setBoard(startVals[dir]);
  await swipe(...v); await sleep(200);
  const st = await S();
  const where = { left: 0, right: 3, up: 0, down: 12 }[dir];
  if (!(st.moves >= 1 && st.cells[where] === 2)) { okSw = false; console.log('vuốt', dir, JSON.stringify(st.cells)); }
}
check('mobile: vuốt trái/phải/lên/xuống đều đúng hướng', okSw);
// Vuốt chéo/ngắn không làm gì
m0 = (await S()).moves;
await swipe(cx, cy, cx + 6, cy + 5, 60);
await tap(cx, cy); await sleep(150);
check('mobile: chạm/vuốt quá ngắn không tính nước', (await S()).moves === m0);
// Chơi thật một lúc bằng vuốt
await pressSel('#newBtn'); if (await visible('#ovConfirm')) await pressSel('#yesNewBtn');
const order = ['left', 'down', 'right', 'down', 'left', 'up'];
for (let i = 0; i < 36; i++) { await swipe(...sws[order[i % order.length]], 70, 3); await sleep(140); }
s = await S();
check('mobile: 36 lần vuốt → chơi bình thường, DOM khớp', s.moves > 15 && (await domOk()) === 'ok', 'nước=' + s.moves);
check('mobile: trang không bị cuộn khi vuốt', (await ev('scrollY')) === 0 && await noOverflow());
await shot('g2048-mobile-choi.png');
await setBoard([64, 64, 32, 32, 8, 0, 8, 4, 2, 0, 0, 0, 0, 0, 0, 0]);
await swipe(...sws.left, 70, 3); await sleep(70); await shot('g2048-mobile-gop.png'); await sleep(200);
s = await S();
check('mobile: gộp nhiều cặp 1 lần vuốt', s.cells[0] === 128 && s.cells[1] === 64 && s.cells[4] === 16);
await pressSel('#undoBtn'); await sleep(100);
check('mobile: chạm Hoàn tác', (await S()).cells[0] === 64);
await setBoard([1024, 1024, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
await swipe(...sws.left, 70, 3); await sleep(700);
check('mobile: màn Đạt 2048!', await visible('#ovWin') && await inView('#ovWin .btn'));
await shot('g2048-mobile-thang.png');
await pressSel('#keepBtn');
await setBoard([0, 2, 4, 8, 16, 32, 64, 128, 2, 4, 8, 16, 32, 64, 128, 256], 'g.won=true');
await swipe(...sws.left, 70, 3); await sleep(1300);
check('mobile: thua → bảng kết quả, nút trong màn hình', await visible('#ovEnd') && await inView('#ovEnd .btn'));
await shot('g2048-mobile-thua.png');
await pressSel('#menuBtnE'); await sleep(150);
check('mobile: Về menu', await visible('#ovMenu'));
// Ngang
await view(844, 390, true, 2); await sleep(300);
await pressSel('#playBtn'); await sleep(200);
await shot('g2048-mobile-ngang.png');
check('mobile ngang: bàn + nút vừa màn hình', await fitsStage() && await inView('.acts .btn'));

check('không có lỗi console', errors.length === 0, errors.join(' | '));
const pass = R.filter(x => x.startsWith('PASS')).length;
console.log(`${pass}/${R.length} PASS`);
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + `\n${pass}/${R.length} PASS\n`);
ws.close(); chrome.kill();
process.exit(pass === R.length ? 0 : 1);
