// E2E Nối Thú trên Chrome headless — bấm chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8766 node server.js   rồi   node e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('noi-thu'), BASE = 'http://127.0.0.1:8766/games/noi-thu/';
mkdirSync(OUT, { recursive: true });
const PROF = tempProfile('noi-thu'); // %TEMP%/lk-e2e-*, tự xoá khi thoát
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9342', '--user-data-dir=' + PROF, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:9342/json')).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
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
const KEYS = { KeyH: ['h', 72], KeyS: ['s', 83], KeyP: ['p', 80], KeyM: ['m', 77], Escape: ['Escape', 27], Enter: ['Enter', 13], ArrowRight: ['ArrowRight', 39], ArrowDown: ['ArrowDown', 40] };
const key = async code => { const [k, vk] = KEYS[code]; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined }); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(120); };
const S = () => ev('(()=>{const g=__game.state;return g&&{status:g.status,level:g.level,score:g.score,time:g.time,hints:g.hints,shuffles:g.shuffles,sel:g.sel,combo:g.combo,left:g.grid.flat().filter(Boolean).length}})()');
// Cặp nối được kế tiếp (dùng đúng luật trong logic.js) → toạ độ màn hình của 2 ô
const nextPair = () => ev(`import('./logic.js').then(L=>{const h=L.findAnyPair(__game.state.grid);return h&&[__game.cellPoint(...h.a),__game.cellPoint(...h.b),h.a,h.b]})`);
const visible = sel => ev(`!document.querySelector(${JSON.stringify(sel)}).hidden`);
async function playPairs(n, gap = 90) { let k = 0; for (; k < n; k++) { const s = await S(); if (!s || s.status !== 'playing') break; const p = await nextPair(); if (!p) break; await press(...p[0]); await sleep(40); await press(...p[1]); await sleep(gap); } return k; }

// ===== 1. Desktop, chuột =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game', await visible('#ovMenu'));
await shot('nt-desktop-menu.png');
await pressSel('#playBtn'); await sleep(300);
let s = await S();
check('bấm Bắt đầu → màn 1 (6×10 = 60 ô)', s && s.level === 0 && s.left === 60 && s.status === 'playing', JSON.stringify(s));
await shot('nt-desktop-bat-dau.png');
let p = await nextPair();
await press(...p[0]); await sleep(60); s = await S();
check('nhấp 1 ô → ô được chọn', s.sel && s.sel[0] === p[2][0] && s.sel[1] === p[2][1]);
await press(...p[0]); await sleep(60); s = await S();
check('nhấp lại ô đó → bỏ chọn', s.sel === null);
await press(...p[0]); await sleep(40); await press(...p[1]); await sleep(80); s = await S();
check('nối cặp hợp lệ → mất 2 ô, +10 điểm', s.left === 58 && s.score === 10, JSON.stringify(s));
await sleep(30); await shot('nt-desktop-noi.png');
const bad = await ev(`(()=>{const g=__game.state.grid;let a=null;for(let r=1;r<g.length-1;r++)for(let c=1;c<g[0].length-1;c++){const t=g[r][c];if(!t)continue;if(!a)a=[r,c,t.t];else if(t.t!==a[2])return [__game.cellPoint(a[0],a[1]),__game.cellPoint(r,c)]}})()`);
await press(...bad[0]); await sleep(40); await press(...bad[1]); await sleep(60); s = await S();
check('nhấp 2 ô khác loại → không mất ô, chuyển chọn sang ô mới', s.left === 58 && !!s.sel);
await press(...bad[1]); await sleep(40);
for (let i = 0; i < 9; i++) await press(...bad[0]);
s = await S(); check('nhấp nhanh 9 lần vào 1 ô → trạng thái hợp lệ (số lẻ = đang chọn)', s.left === 58 && !!s.sel);
const b = await ev(`(()=>{const r=document.querySelector('#cv').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()`);
for (let i = 0; i < 60; i++) await press(b[0] + Math.random() * b[2], b[1] + Math.random() * b[3]);
await sleep(200); s = await S();
check('spam 60 lần nhấp ngẫu nhiên → không lỗi, số ô vẫn chẵn', s.status === 'playing' && s.left % 2 === 0, 'còn ' + s.left);
const h0 = s.hints;
await pressSel('#hintBtn'); s = await S();
check('nút Gợi ý trừ 1 lượt', s.hints === h0 - 1);
await shot('nt-desktop-goi-y.png');
await key('KeyH'); await key('KeyH'); await key('KeyH'); s = await S();
check('gợi ý dừng ở 0, nút bị khoá', s.hints === 0 && await ev('document.querySelector("#hintBtn").disabled'));
await key('KeyS'); await key('KeyS'); await key('KeyS'); s = await S();
check('đảo bàn tối đa 2 lần, số ô giữ nguyên', s.shuffles === 0 && s.left % 2 === 0 && await ev('document.querySelector("#shufBtn").disabled'));
await key('KeyP'); await sleep(100); const t1 = (await S()).time; await sleep(700); const t2 = (await S()).time;
check('P tạm dừng → đồng hồ đứng, hiện hộp Tạm dừng', t1 === t2 && await visible('#ovPause'));
await shot('nt-desktop-tam-dung.png');
await pressSel('#resumeBtn'); await sleep(400);
check('Tiếp tục → đồng hồ chạy lại', (await S()).time < t2 && !(await ev('__game.paused')));
await ev('document.querySelector("#cv").focus()');
await key('ArrowRight'); await key('ArrowDown'); await key('Enter'); s = await S();
check('bàn phím: mũi tên + Enter chọn được ô', !!s.sel || s.left < 58);
const m0 = await ev('localStorage.getItem("wgp.muted")');
await key('KeyM'); const m1 = await ev('localStorage.getItem("wgp.muted")');
check('M tắt/bật tiếng, lưu chung wgp.muted', m0 !== m1 && (await ev('document.querySelector("#muteIc").src')).includes(m1 === '1' ? 'tat' : 'bat'));
await key('KeyM');
await playPairs(40, 60); await sleep(900); s = await S();
check('dọn sạch màn 1 → Qua màn', s.status === 'cleared' && await visible('#ovEnd'), JSON.stringify(s));
check('màn hình qua màn có thưởng giờ + nút màn 2', (await ev('document.querySelector("#eResult").textContent')).includes('Thưởng') && !!(await at('#nextBtn')));
await shot('nt-desktop-qua-man.png');
const saved = await ev('JSON.parse(localStorage.getItem("wgp.noithu.v1"))');
check('lưu tiến độ: mở màn 2 + kỷ lục', saved && saved.unlocked === 1 && saved.best === s.score, JSON.stringify(saved));
await pressSel('#nextBtn'); await sleep(300); s = await S();
check('Màn 2 → 7×12, giữ điểm, có ô dồn', s.level === 1 && s.left === 84 && s.score === saved.best);
await playPairs(6, 220); await sleep(250);
check('màn 2 ô dồn xuống: mọi ô sát đáy cột', await ev(`(()=>{const g=__game.state.grid;for(let c=1;c<g[0].length-1;c++){let seen=false;for(let r=1;r<g.length-1;r++){if(g[r][c])seen=true;else if(seen)return false}}return true})()`));
await shot('nt-desktop-man2-o-don.png');
// ===== 2. Đổi kích thước giữa ván =====
const before = await S();
await view(390, 844, true, 3); await sleep(400);
let lay = await ev('__game.layout');
check('thu cửa sổ về mobile giữa ván → bàn xoay dọc, ván giữ nguyên', lay.tr === true && (await S()).left === before.left);
p = await nextPair(); await click(...p[0]); await sleep(40); await click(...p[1]); await sleep(120);
check('sau khi xoay vẫn nối đúng ô', (await S()).left === before.left - 2);
await view(844, 390, true, 3); await sleep(400); lay = await ev('__game.layout');
check('xoay ngang → bàn nằm ngang, ô ≥ 18px', lay.tr === false && lay.cs >= 18, 'ô ' + lay.cs + 'px');
await shot('nt-mobile-ngang.png');
await ev('__game.state.time = 0.3'); await sleep(700); s = await S();
check('hết giờ → màn hình Hết giờ + nút chơi lại', s.status === 'timeout' && await visible('#ovEnd') && !!(await at('#againBtn')));
await view(390, 844, true, 3); await sleep(300);
await shot('nt-mobile-het-gio.png');
await click(...(await at('#againBtn'))); await sleep(300); s = await S();
check('Chơi lại màn 2 → điểm trả về lúc đầu màn', s.level === 1 && s.status === 'playing' && s.score === saved.best && s.left === 84);
// ===== 3. Mobile chạm thật =====
await touch(true); press = tap;
await nav(BASE + '?seed=21');
check('mở lại trang → menu có "Chơi tiếp màn 2"', (await ev('document.querySelector("#playBtn").textContent')).includes('màn 2'));
await shot('nt-mobile-menu.png');
await pressSel('#freshBtn'); await sleep(300);
const n = await playPairs(8, 80); s = await S();
check('mobile: chạm nối 8 cặp', n === 8 && s.left === 60 - 16, JSON.stringify(s));
await sleep(80); await shot('nt-mobile-choi.png');
const fit = await ev(`(()=>{const d=document.documentElement;return d.scrollWidth<=innerWidth+1 && document.querySelector('#hintBtn').getBoundingClientRect().bottom<=innerHeight+1})()`);
check('mobile 390×844: không tràn ngang, nút công cụ nằm trong màn hình', fit);
await nav(BASE + '?seed=3&level=8'); await sleep(200); lay = await ev('__game.layout');
check('mobile màn 8 (9×16): ô đủ lớn để chạm', lay.cs >= 32, 'ô ' + lay.cs + 'px');
await shot('nt-mobile-man8.png');
await playPairs(80, 15); await sleep(900); s = await S();
check('dọn sạch màn 8 → Phá đảo 8 màn', s.status === 'won' && (await ev('document.querySelector("#eTitle").textContent')).includes('Phá đảo'));
await shot('nt-mobile-pha-dao.png');
// ===== 4. Desktop màn 8 =====
await touch(false); press = click; await view(1440, 900, false, 1);
await nav(BASE + '?seed=9&level=8'); await playPairs(10, 40); await sleep(150);
await shot('nt-desktop-man8.png');
await view(1280, 720, false, 1); await sleep(300); lay = await ev('__game.layout');
check('desktop 1280×720 màn 8: vừa khung, ô ≥ 40px', lay.cs >= 40, 'ô ' + lay.cs + 'px');
check('không có lỗi console', errors.length === 0, errors.join(' | '));
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + '\n');
console.log(R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
chrome.kill(); process.exit(0);
