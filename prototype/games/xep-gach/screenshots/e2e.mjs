// E2E Xếp Gạch trên Chrome headless — phím / chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8767 node server.js   rồi   node e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('xep-gach'), BASE = 'http://127.0.0.1:8767/games/xep-gach/';
mkdirSync(OUT, { recursive: true });
const PROF = tempProfile('xep-gach'); // %TEMP%/lk-e2e-*, tự xoá khi thoát
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9343', '--user-data-dir=' + PROF, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:9343/json')).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
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
const KEYS = { ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39], ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40], Space: [' ', 32],
  KeyZ: ['z', 90], KeyC: ['c', 67], KeyP: ['p', 80], KeyM: ['m', 77], Escape: ['Escape', 27] };
const keyDown = (code, repeat = false) => { const [k, vk] = KEYS[code]; return send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: k, windowsVirtualKeyCode: vk, autoRepeat: repeat, text: k.length === 1 ? k : undefined }); };
const keyUp = code => { const [k, vk] = KEYS[code]; return send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k, windowsVirtualKeyCode: vk }); };
const key = async code => { await keyDown(code); await keyUp(code); await sleep(30); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const tStart = (x, y) => send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
const tMove = (x, y) => send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
const tEnd = () => send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const tap = async (x, y) => { await tStart(x, y); await tEnd(); };
async function swipe(x0, y0, x1, y1, ms, steps = 6) { await tStart(x0, y0); for (let i = 1; i <= steps; i++) { await sleep(ms / steps); await tMove(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); } await tEnd(); }
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(!r.width)return null;return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(120); };
const S = () => ev('(()=>{const g=__game.state;return g&&{status:g.status,mode:g.mode,level:g.level,score:g.score,lines:g.lines,time:g.time,pieces:g.pieces,hold:g.hold,holdUsed:g.holdUsed,cur:g.cur&&{...g.cur},clearing:!!g.clearing}})()');
const visible = sel => ev(`!document.querySelector(${JSON.stringify(sel)}).closest('[hidden]')`);
// Đặt bàn để test: n hàng đáy đầy trừ cột 0, khối I dọc sẵn ở cột 0
const setupTetris = (n, extra = '') => ev(`(()=>{const s=__game.state;for(let y=0;y<22;y++)for(let x=0;x<10;x++)s.board[y][x]=0;for(let i=0;i<${n};i++)for(let x=1;x<10;x++)s.board[21-i][x]=1+((x+i)%7);${extra};s.cur={kind:'I',rot:1,x:-2,y:2};s.lowest=2;s.lock=0;s.grav=0;return true})()`);
const stageCenter = () => ev(`(()=>{const r=document.querySelector('#cv').getBoundingClientRect();const L=__game.layout;return [L.bx+r.x+L.cs*5, L.by+r.y+L.cs*10]})()`);

// ===== 1. Desktop, phím + chuột =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game', await visible('#ovMenu'));
await shot('xg-desktop-menu.png');
await pressSel('#lvPick button[data-lv="3"]');
await pressSel('#playBtn'); await sleep(200);
let s = await S();
check('chọn cấp 3 + Bắt đầu → ván Vô tận cấp 3', s && s.mode === 'endless' && s.level === 3 && s.status === 'playing', JSON.stringify(s));
let x0 = s.cur.x;
await key('ArrowLeft'); s = await S();
check('← dời khối sang trái 1 ô', s.cur.x === x0 - 1, x0 + '→' + s.cur.x);
await key('ArrowRight'); await key('ArrowRight'); s = await S();
check('→ dời sang phải', s.cur.x === x0 + 1);
const r0 = s.cur.rot; await key('ArrowUp'); s = await S();
check('↑ xoay phải', s.cur.kind === 'O' || s.cur.rot === (r0 + 1) % 4);
await key('KeyZ'); s = await S();
check('Z xoay trái về lại', s.cur.rot === r0);
await keyDown('ArrowLeft'); await sleep(450); await keyUp('ArrowLeft'); s = await S();
const leftMost = await ev(`import('./logic.js').then(L=>Math.min(...L.cellsOf(__game.state.cur.kind,__game.state.cur.rot,__game.state.cur.x,__game.state.cur.y).map(c=>c[0])))`);
check('giữ ← (tự lặp) → khối chạm tường trái', leftMost === 0, 'cột ' + leftMost);
const sc0 = s.score; const kind0 = s.cur.kind;
await key('Space'); await sleep(60); s = await S();
check('Space thả rơi → khoá khối, +điểm, ra khối mới', s.pieces === 1 && s.score > sc0, JSON.stringify(s));
await sleep(80); await shot('xg-desktop-tha-roi.png');
const k1 = s.cur.kind; await key('KeyC'); s = await S();
check('C giữ khối → ô Giữ có khối', s.hold === k1 && s.holdUsed);
const k2 = s.cur.kind; await key('KeyC'); s = await S();
check('giữ lần 2 cùng lượt bị chặn', s.cur.kind === k2 && s.hold === k1);
void kind0;
await keyDown('ArrowDown'); await sleep(300); await keyUp('ArrowDown'); s = await S();
check('giữ ↓ rơi nhanh (+1 điểm/ô)', s.cur && s.cur.y > 5, 'y=' + (s.cur && s.cur.y));
// Ăn 4 hàng
await setupTetris(4, 's.board[17][5]=3');
const scB = (await S()).score;
await key('Space'); await sleep(110); await shot('xg-desktop-an-4-hang.png'); await sleep(500); s = await S();
check('xếp I vào khe → ăn 4 hàng, điểm 800 × cấp', s.lines === 4 && s.score - scB >= 800 * 3, '+' + (s.score - scB));
await sleep(500); await shot('xg-desktop-sau-an-hang.png');
// Tạm dừng
await key('KeyP'); await sleep(100); const t1 = (await S()).time; await sleep(500); const t2 = (await S()).time;
check('P tạm dừng → đồng hồ đứng, hiện hộp Tạm dừng', t1 === t2 && await visible('#ovPause'));
await shot('xg-desktop-tam-dung.png');
await pressSel('#resumeBtn'); await sleep(300);
check('Chơi tiếp → đồng hồ chạy lại', (await S()).time > t2 && !(await ev('__game.paused')));
await pressSel('#pauseBtn'); check('nút tạm dừng trên HUD hoạt động', await ev('__game.paused')); await key('Escape'); await sleep(100);
check('Esc bỏ tạm dừng', !(await ev('__game.paused')));
const m0 = await ev('localStorage.getItem("wgp.muted")');
await key('KeyM'); const m1 = await ev('localStorage.getItem("wgp.muted")');
check('M tắt/bật tiếng, lưu chung wgp.muted', m0 !== m1 && (await ev('document.querySelector("#muteIc").src')).includes(m1 === '1' ? 'tat' : 'bat'));
await key('KeyM');
check('âm thanh tải đủ 8 file', (await ev('__game.sfx.loaded')) === 8, await ev('__game.sfx.loaded'));
// Dựng chồng cao để chụp cảnh báo + chơi bình thường
await ev(`(()=>{const s=__game.state;for(let y=4;y<22;y++)for(let x=0;x<10;x++)s.board[y][x]=(x+y*3)%11<8?1+((x*3+y)%7):0;return 1})()`);
await sleep(300); await shot('xg-desktop-nguy-hiem.png');
// Thua
await ev(`(()=>{const s=__game.state;for(let y=2;y<22;y++)for(let x=0;x<10;x++)s.board[y][x]=x===9?0:1+((x+y)%7);s.cur={kind:'O',rot:0,x:4,y:0};s.lowest=0;return 1})()`);
const finalScore = (await S()).score;
await key('Space'); await sleep(300); s = await S();
check('gạch chạm nóc → thua', s.status === 'over');
await sleep(1300);
check('hiện bảng kết quả Hết chỗ + Kỷ lục mới', await visible('#ovEnd') && (await ev('document.querySelector("#eTitle").textContent')) === 'Hết chỗ!' && (await ev('document.querySelector("#eRecord").textContent')).includes('Kỷ lục'));
const sv = await ev('JSON.parse(localStorage.getItem("wgp.xepgach.v1"))');
check('lưu kỷ lục Vô tận', sv && sv.best.endless === finalScore && sv.startLevel === 3, JSON.stringify(sv));
await shot('xg-desktop-thua.png');
await pressSel('#againBtn'); await sleep(200); s = await S();
check('Chơi lại → ván mới sạch', s.status === 'playing' && s.score === 0 && s.pieces === 0 && s.level === 3);
// Về đích 40 hàng
await pressSel('#pauseBtn'); await pressSel('#menuBtnP');
check('Về menu', await visible('#ovMenu'));
await pressSel('.mode[data-mode="sprint"]');
check('chọn Về đích → ẩn chọn cấp', !(await visible('#lvPick')) || (await ev('document.querySelector("#lvPick").hidden')));
await pressSel('#playBtn'); await sleep(200); s = await S();
check('ván Về đích 40 hàng, cấp 1', s.mode === 'sprint' && s.level === 1 && (await ev('document.querySelector("#hLines").textContent')) === '0/40');
await ev('__game.state.lines=36;__game.state.time=83.4'); await setupTetris(4, 's.board[17][5]=3');
await key('Space'); await sleep(200); s = await S();
check('đạt 40 hàng → Về đích, đồng hồ dừng', s.status === 'won' && s.lines === 40);
await sleep(1400);
check('bảng Về đích + lưu thời gian kỷ lục', (await ev('document.querySelector("#eTitle").textContent')) === 'Về đích!' && (await ev('JSON.parse(localStorage.getItem("wgp.xepgach.v1")).best.sprint')) > 83);
await shot('xg-desktop-ve-dich.png');
await pressSel('#menuBtnE'); await pressSel('.mode[data-mode="endless"]'); await pressSel('#playBtn'); await sleep(200);
// Chơi tự nhiên vài khối để có ảnh giữa ván
for (let i = 0; i < 9; i++) { for (let j = 0; j < (i % 4); j++) await key(i % 2 ? 'ArrowLeft' : 'ArrowRight'); if (i % 3 === 0) await key('ArrowUp'); await key('Space'); await sleep(60); }
await sleep(300); await shot('xg-desktop-choi.png');
const lay1 = await ev('__game.layout');
check('desktop 1440×900: ô gạch ≥ 34px, bố cục 2 bên', lay1.cs >= 34 && lay1.variant === 'A', 'ô ' + lay1.cs + 'px ' + lay1.variant);

// ===== 2. Đổi kích thước giữa ván =====
const before = await S();
await view(390, 844, true, 3); await sleep(400);
let lay = await ev('__game.layout');
check('thu về mobile dọc giữa ván → bố cục cột phải, ván giữ nguyên', lay.variant === 'B' && (await S()).pieces === before.pieces, 'ô ' + lay.cs + 'px');
check('mobile 390×844: ô gạch ≥ 24px', lay.cs >= 24, 'ô ' + lay.cs + 'px');
const fit = await ev(`(()=>{const d=document.documentElement;const pb=document.querySelector('#pad').getBoundingClientRect();return d.scrollWidth<=innerWidth+1 && pb.height>0 && pb.bottom<=innerHeight+1})()`);
check('mobile: không tràn ngang, khay nút nằm trong màn hình', fit);
await view(844, 390, true, 3); await sleep(400); lay = await ev('__game.layout');
const fitL = await ev(`(()=>{const pb=document.querySelector('#pad').getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth+1 && pb.width>0 && pb.bottom<=innerHeight+1})()`);
check('mobile xoay ngang 844×390: bàn vừa khung, khay nút bên phải', lay.cs >= 15 && fitL, 'ô ' + lay.cs + 'px');
await shot('xg-mobile-ngang.png');

// ===== 3. Mobile chạm thật =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=21'); await sleep(200);
check('mở lại trang → menu nhớ chế độ + kỷ lục', (await ev('document.querySelector("#mBest").textContent')).includes('Kỷ lục'));
await shot('xg-mobile-menu.png');
await pressSel('#playBtn'); await sleep(250); s = await S();
check('mobile: chạm Bắt đầu → vào ván', s && s.status === 'playing');
let c = await stageCenter();
let rr = s.cur.rot; await tap(...c); await sleep(80); s = await S();
check('chạm bàn → xoay khối', s.cur.kind === 'O' || s.cur.rot !== rr);
x0 = s.cur.x; const cs = (await ev('__game.layout')).cs;
await swipe(c[0], c[1], c[0] + cs * 2.2, c[1], 260); await sleep(60); s = await S();
check('kéo ngang 2 ô → dời 2 cột', s.cur.x === x0 + 2, x0 + '→' + s.cur.x);
let pc = s.pieces;
await swipe(c[0], c[1] - cs * 2, c[0], c[1] + cs * 3, 60, 2); await sleep(80); s = await S();
check('vuốt nhanh xuống → thả rơi', s.pieces === pc + 1);
const kk = s.cur.kind;
await swipe(c[0], c[1] + cs, c[0], c[1] - cs * 3, 60, 2); await sleep(80); s = await S();
check('vuốt lên → giữ khối', s.hold === kk);
x0 = s.cur.x; await pressSel('#pad [data-act="left"]'); s = await S();
check('nút ◀ dời trái', s.cur.x === x0 - 1);
const pr = await at('#pad [data-act="right"]'); await tStart(...pr); await sleep(500); await tEnd(); await sleep(50);
const rightMost = await ev(`import('./logic.js').then(L=>Math.max(...L.cellsOf(__game.state.cur.kind,__game.state.cur.rot,__game.state.cur.x,__game.state.cur.y).map(c=>c[0])))`);
check('giữ nút ▶ → tự lặp tới tường phải', rightMost === 9, 'cột ' + rightMost);
rr = (await S()).cur.rot; await pressSel('#pad [data-act="cw"]'); s = await S();
check('nút Xoay', s.cur.kind === 'O' || s.cur.rot !== rr);
pc = s.pieces; await pressSel('#pad [data-act="hard"]'); s = await S();
check('nút Thả (vàng) thả rơi', s.pieces === pc + 1);
// spam chạm ngẫu nhiên
const cvr = await ev(`(()=>{const r=document.querySelector('#cv').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()`);
for (let i = 0; i < 40; i++) await tap(cvr[0] + Math.random() * cvr[2], cvr[1] + Math.random() * cvr[3]);
for (let i = 0; i < 30; i++) await pressSel('#pad [data-act="' + ['left', 'right', 'cw', 'ccw', 'soft', 'hold'][i % 6] + '"]').catch(() => {});
s = await S(); check('spam chạm bàn + nút → không lỗi', s.status === 'playing' || s.status === 'over');
for (let i = 0; i < 6; i++) { await pressSel('#pad [data-act="' + (i % 2 ? 'left' : 'right') + '"]'); await pressSel('#pad [data-act="hard"]'); }
await setupTetris(3, 's.board[18][5]=0;s.board[17][2]=3;s.board[17][3]=3');
await pressSel('#pad [data-act="hard"]'); await sleep(90);
await shot('xg-mobile-an-hang.png'); await sleep(600);
await shot('xg-mobile-choi.png');
await pressSel('#pauseBtn'); await sleep(100);
check('mobile: nút tạm dừng → che bàn', await ev('__game.paused') && await visible('#ovPause'));
await shot('xg-mobile-tam-dung.png');
await pressSel('#resumeBtn');
await ev(`(()=>{const s=__game.state;for(let y=2;y<22;y++)for(let x=0;x<10;x++)s.board[y][x]=x===9?0:1+((x+y)%7);s.cur={kind:'O',rot:0,x:4,y:0};s.lowest=0;return 1})()`);
await pressSel('#pad [data-act="hard"]'); await sleep(1500);
check('mobile: thua → bảng kết quả', await visible('#ovEnd'));
await shot('xg-mobile-thua.png');
check('không có lỗi console', errors.length === 0, errors.join(' | '));
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + '\n');
console.log(R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
chrome.kill(); process.exit(0);
