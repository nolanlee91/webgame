// E2E Rắn Săn Mồi trên Chrome headless — phím / chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   node e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('ran-san-moi'), BASE = 'http://127.0.0.1:' + (process.env.PORT || 8768) + '/games/ran-san-moi/';
mkdirSync(OUT, { recursive: true });
const PROF = tempProfile('ran-san-moi'); // %TEMP%/lk-e2e-*, tự xoá khi thoát
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9345', '--user-data-dir=' + PROF, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:9345/json')).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
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
  KeyW: ['w', 87], KeyA: ['a', 65], KeyS: ['s', 83], KeyD: ['d', 68], Enter: ['Enter', 13], KeyP: ['p', 80], KeyM: ['m', 77], Escape: ['Escape', 27] };
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
const visible = sel => ev(`!document.querySelector(${JSON.stringify(sel)}).closest('[hidden]')`);
const S = () => ev('(()=>{const g=__game.state;return g&&{status:g.status,mode:g.mode,dir:g.dir,q:[...g.queue],len:g.snake.length,head:{...g.snake[0]},score:g.score,eaten:g.eaten,gold:!!g.gold,died:g.died}})()');
// đặt mồi ngay trước đầu rắn theo hướng sắp đi
const feed = () => ev(`(()=>{const s=__game.state,h=s.snake[0],d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[s.queue[0]||s.dir];s.food={x:(h.x+d[0]+20)%20,y:(h.y+d[1]+20)%20};return 1})()`);
const txt = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const noOverflow = () => ev('document.documentElement.scrollWidth<=innerWidth+1');
const inView = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()`);
const padVis = () => ev("getComputedStyle(document.querySelector('#pad')).visibility==='visible'&&getComputedStyle(document.querySelector('#pad')).display!=='none'");

// ===== 1. Desktop: phím =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game', await visible('#ovMenu'));
await sleep(400); await shot('rsm-desktop-menu.png');
await pressSel('.mode[data-mode="wrap"]');
check('chọn Xuyên tường đổi trạng thái nút', await ev("document.querySelector('.mode[data-mode=wrap]').classList.contains('on')"));
await pressSel('.mode[data-mode="classic"]');
await pressSel('#playBtn'); await sleep(100);
let s = await S();
check('Bắt đầu → ván Cổ điển, rắn dài 4 hướng phải', s && s.status === 'play' && s.mode === 'classic' && s.len === 4 && s.dir === 'right', JSON.stringify(s));
await key('ArrowLeft'); s = await S();
check('← (quay đầu 180°) bị bỏ qua', s.q.length === 0 && s.dir === 'right');
await key('ArrowUp'); await sleep(220); s = await S();
check('↑ đổi hướng lên', s.dir === 'up', s.dir);
await key('KeyA'); await sleep(220); s = await S();
check('A (WASD) đổi hướng trái', s.dir === 'left', s.dir);
await key('KeyS'); await sleep(220); s = await S();
check('S đổi hướng xuống', s.dir === 'down');
await key('KeyD'); await sleep(220);
s = await S(); const len0 = s.len, sc0 = s.score;
await feed(); await sleep(400); s = await S();
check('ăn mồi → dài thêm 1, +10 điểm, HUD cập nhật', s.len === len0 + 1 && s.score === sc0 + 10 && await txt('#hScore') === '10' && await txt('#hLen') === '5', JSON.stringify(s));
for (let i = 0; i < 4; i++) { await feed(); await sleep(200); }
s = await S();
check('ăn đủ 5 mồi → xuất hiện đồng vàng', s.eaten === 5 && s.gold, JSON.stringify(s));
await ev('(()=>{const s=__game.state;s.queue=[];s.dir="right";s.last=null;s.snake=s.snake.map((c,i)=>({x:Math.max(0,8-i),y:10}));return 1})()');
await ev(`(()=>{const s=__game.state,h=s.snake[0],d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[s.dir];s.gold.x=(h.x+d[0]+20)%20;s.gold.y=(h.y+d[1]+20)%20;return 1})()`);
await sleep(30); await shot('rsm-desktop-choi.png');
await sleep(300); s = await S();
check('ăn đồng vàng → +50×cấp điểm', !s.gold && s.score >= 100, JSON.stringify(s));
const iv0 = await ev('import("./logic.js").then(L=>L.interval(__game.state))');
await ev('(()=>{const s=__game.state;s.queue=[];s.dir="right";s.snake=s.snake.map((c,i)=>({x:Math.max(0,4-i),y:10}));s.snake[0].x=4;return 1})()');
await ev('for(let i=0;i<12;i++)__game.state.snake.push({...__game.state.snake.at(-1)})');
const iv1 = await ev('import("./logic.js").then(L=>L.interval(__game.state))');
await sleep(100);
check('rắn dài hơn → nhịp nhanh hơn, HUD tốc độ tăng', iv1 < iv0 && +(await txt('#hSpeed')) >= 3, iv0 + '→' + iv1);
await key('KeyP'); await sleep(100);
const sp = await S();
check('P tạm dừng → che bàn', await ev('__game.paused') && await visible('#ovPause'), JSON.stringify(sp) + ' paused=' + await ev('__game.paused'));
await sleep(500);
check('đang dừng rắn đứng yên', JSON.stringify((await S()).head) === JSON.stringify(sp.head));
await shot('rsm-desktop-tam-dung.png');
await key('Escape'); await sleep(80);
check('Esc chơi tiếp', !(await ev('__game.paused')) && !(await visible('#ovPause')));
await key('KeyM');
check('M tắt tiếng (lưu localStorage)', await ev("localStorage.getItem('wgp.muted')==='1'"));
await key('KeyM');
// lao lên tường
await ev('(()=>{const s=__game.state;s.queue=[];s.snake=s.snake.slice(0,8);const h=s.snake[0];s.dir=h.y>0&&s.snake[1].y<h.y?"left":"up";s.food={x:19,y:19};return 1})()');
await key('ArrowUp');
await sleep(3500);
s = await S();
check('đụng tường → thua, lý do "wall"', s.status === 'over' && s.died && s.died.by === 'wall', JSON.stringify(s.died));
await sleep(800);
check('bảng kết quả hiện, tiêu đề đúng', await visible('#ovEnd') && /tường/.test(await txt('#eTitle')));
const score = s.score;
check('kỷ lục được lưu + báo Kỷ lục mới', await ev(`JSON.parse(localStorage.getItem('wgp.ransanmoi.v1')).best.classic===${score}`) && /Kỷ lục mới/.test(await txt('#eRecord')), score);
await shot('rsm-desktop-thua.png');
await key('Enter'); await sleep(150); s = await S();
check('Enter chơi lại ván mới', s.status === 'play' && s.len === 4 && s.score === 0);
check('HUD kỷ lục hiển thị', (await txt('#hBest')).replace(/\D/g, '') === String(score), await txt('#hBest'));
// tự cắn thân
await ev('(()=>{const s=__game.state;s.snake=[{x:5,y:5},{x:4,y:5},{x:4,y:6},{x:5,y:6},{x:6,y:6},{x:7,y:6}];s.dir="up";s.queue=[];s.food={x:0,y:0};return 1})()');
await key('ArrowLeft'); await key('ArrowDown'); await sleep(600); s = await S();
check('cắn vào thân → thua, lý do "self"', s.status === 'over' && s.died && s.died.by === 'self', JSON.stringify(s.died));
await sleep(900);
check('tiêu đề "Cắn trúng đuôi"', /Cắn/.test(await txt('#eTitle')));
await pressSel('#menuBtnE'); await sleep(100);
check('Về menu → menu + kỷ lục ở menu', await visible('#ovMenu') && /Kỷ lục/.test(await txt('#mBest')));
// Xuyên tường
await pressSel('.mode[data-mode="wrap"]'); await pressSel('#playBtn');
await ev('__game.state.food={x:0,y:0}');
await sleep(2700); s = await S();
check('Xuyên tường: đi qua mép phải sang mép trái, vẫn sống', s.status === 'play' && s.mode === 'wrap' && s.head.x < 6, JSON.stringify(s.head));
await shot('rsm-desktop-xuyen-tuong.png');
check('desktop: không tràn ngang, bàn chơi nằm gọn màn hình', await noOverflow() && await inView('#cv'));
const L1 = await ev('__game.layout');
check('desktop: bàn đủ to (ô ≥ 24px)', L1.cs >= 24, 'ô ' + L1.cs);

// ===== 2. Mobile 390×844: chạm =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=5'); await sleep(300);
check('mobile: không tràn ngang, menu vừa màn hình, d-pad ẩn ở menu', await noOverflow() && await inView('#ovMenu') && !(await padVis()));
await shot('rsm-mobile-menu.png');
await pressSel('.mode[data-mode="classic"]');
await pressSel('#playBtn'); await sleep(150);
check('mobile: d-pad hiện khi chơi, nằm trong màn hình', await padVis() && await inView('#pad'));
check('mobile: bàn chơi + d-pad không chồng nhau', await ev("(()=>{const a=document.querySelector('#cv').getBoundingClientRect(),b=document.querySelector('#pad').getBoundingClientRect();return a.bottom<=b.top+1})()"));
const L2 = await ev('__game.layout'); check('mobile: ô bàn ≥ 14px', L2.cs >= 14, 'ô ' + L2.cs);
await pressSel('#pad [data-dir="up"]'); await sleep(250); s = await S();
check('mobile: nút ▲ đổi hướng lên', s.dir === 'up', s.dir);
await pressSel('#pad [data-dir="left"]'); await sleep(250); s = await S();
check('mobile: nút ◀ đổi hướng trái', s.dir === 'left', s.dir);
const cvr = await ev(`(()=>{const r=document.querySelector('#cv').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
await swipe(cvr[0], cvr[1], cvr[0], cvr[1] + 80, 90); await sleep(250); s = await S();
check('mobile: vuốt xuống trên bàn → đi xuống', s.dir === 'down', s.dir);
await swipe(cvr[0], cvr[1], cvr[0] + 80, cvr[1], 90); await sleep(250); s = await S();
check('mobile: vuốt phải → đi phải', s.dir === 'right', s.dir);
await feed(); await sleep(350);
await ev('__game.state.food={x:15,y:4}');
await sleep(200); await shot('rsm-mobile-choi.png');
for (let i = 0; i < 40; i++) await pressSel('#pad [data-dir="' + ['up', 'right', 'down', 'left'][i % 4] + '"]').catch(() => {});
s = await S(); check('mobile: spam nút → không lỗi', s.status === 'play' || s.status === 'over');
if (s.status !== 'play') { await sleep(1000); await pressSel('#againBtn'); await sleep(150); }
{
  await pressSel('#pauseBtn'); await sleep(100);
  check('mobile: nút tạm dừng', await ev('__game.paused') && await visible('#ovPause'));
  await shot('rsm-mobile-tam-dung.png');
  await pressSel('#resumeBtn');
  await ev('(()=>{const s=__game.state;s.queue=[];s.snake=s.snake.slice(0,6);return 1})()');
}
await sleep(4500);
check('mobile: thua → bảng kết quả vừa màn hình', await visible('#ovEnd') && await inView('#ovEnd'));
await shot('rsm-mobile-thua.png');
await view(844, 390, true, 3); await sleep(400);
await pressSel('#againBtn'); await sleep(300);
check('mobile ngang: không tràn, bàn nằm trong màn hình', await noOverflow() && await inView('#cv'));
await shot('rsm-mobile-ngang.png');
check('không có lỗi console', errors.length === 0, errors.join(' | '));
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + '\n');
console.log(R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
chrome.kill(); process.exit(0);
