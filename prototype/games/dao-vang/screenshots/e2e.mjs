// E2E Đào Vàng trên Chrome headless — điều khiển bằng phím/chạm thật qua CDP.
// node e2e.mjs <thư mục output>   (cần server: python -m http.server 8766 trong prototype/)
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const OUT = process.argv[2], BASE = 'http://127.0.0.1:8766/games/dao-vang/index.html';
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9334', '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:9334/json')).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errors = []; let frames = null;
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
  if (m.method === 'Page.screencastFrame') {
    if (frames) { const f = frames.dir + '/f' + String(frames.n++).padStart(5, '0') + '.jpg'; writeFileSync(f, Buffer.from(m.params.data, 'base64')); frames.list.push([f, m.params.metadata.timestamp]); }
    ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: m.params.sessionId } }));
  }
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(1800); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const KEYS = { Space: [' ', 32], ArrowDown: ['ArrowDown', 40], KeyS: ['s', 83], KeyP: ['p', 80] };
const key = async code => { const [k, vk] = KEYS[code]; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const S = () => ev('(()=>{const g=__game.state;return {status:g.status,level:g.level,score:g.score,target:g.target,time:g.time,tick:g.tick,hooks:g.hooks.map(h=>({x:h.x,y:h.y,a:h.angle,s:h.state,carry:h.carry&&h.carry.kind,earned:h.earned})),objs:g.objects.filter(o=>!o.taken).map(o=>({k:o.kind,x:o.x,y:o.y,r:o.r}))}})()');
const GOOD = new Set(['goldL', 'goldM', 'goldS', 'diamond', 'bag']);
// "Người chơi máy": chỉ bấm phím thật khi móc đang chỉ đúng vào vàng/kim cương (vật đầu tiên trên đường thả).
function aimedAtGood(h, objs) {
  const dx = Math.sin(h.a), dy = Math.cos(h.a); let best = null;
  for (const o of objs) { const ox = o.x - h.x, oy = o.y - h.y, along = ox * dx + oy * dy; if (along < 0) continue; const perp = Math.abs(ox * dy - oy * dx); if (perp <= o.r + 4 && (!best || along < best.along)) best = { o, along }; }
  return best && GOOD.has(best.o.k) && Math.abs(Math.abs(h.a) - 1.2566) > 0.05 ? best.o : null;
}
async function autoplay(sec, keys, onTick) {
  const end = Date.now() + sec * 1000;
  while (Date.now() < end) {
    const s = await S(); if (s.status !== 'playing') return s;
    for (const [i, h] of s.hooks.entries()) if (h.s === 'swing' && aimedAtGood(h, s.objs)) await key(keys[i]);
    if (onTick) await onTick(s);
    await sleep(8);
  }
  return S();
}
async function record(name, fn) {
  const dir = OUT + '/frames-' + name; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  frames = { dir, n: 0, list: [] };
  await send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 });
  const res = await fn();
  await send('Page.stopScreencast'); await sleep(200);
  const L = frames.list; frames = null;
  const lines = L.map(([f, t], i) => `file '${f.replace(/\\/g, '/')}'\nduration ${Math.max(0.01, ((L[i + 1]?.[1] ?? t + 0.04) - t)).toFixed(3)}`);
  lines.push(`file '${L[L.length - 1][0].replace(/\\/g, '/')}'`);
  writeFileSync(dir + '/list.txt', lines.join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', dir + '/list.txt', '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-crf', '26', OUT + '/' + name + '.mp4']);
  rmSync(dir, { recursive: true, force: true });
  return res;
}

// ---------- Desktop: menu ----------
await view(1280, 860, false, 1);
await nav(BASE);
check('trang Đào Vàng mở được, có 2 chế độ chơi', await ev('!!document.getElementById("play1") && !!document.getElementById("play2")'));
await shot('dv-menu.png');
const b1 = await ev('(()=>{const r=document.getElementById("play1").getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()');
await click(...b1); await sleep(600);
check('bấm "1 người" → vào game, có canvas, ẩn màn chọn chế độ', await ev('!!document.querySelector("#stage canvas") && __game.state.players===1 && getComputedStyle(document.getElementById("menu")).display==="none"'));
check('desktop 1280×860: thấy trọn khung chơi không cần cuộn', await ev('document.querySelector("#stage canvas").getBoundingClientRect().bottom<=innerHeight'));

// ---------- 1 người: chơi bằng phím thật ----------
await nav(BASE + '?players=1&seed=11'); await sleep(300);
let s = await S();
check('1 người: 1 móc, đang lắc, đồng hồ 60 giây', s.hooks.length === 1 && s.hooks[0].s === 'swing' && s.time > 57, s.time.toFixed(1) + ' giây');
const a1 = s.hooks[0].a; await sleep(300); s = await S();
check('móc tự lắc qua lại', Math.abs(s.hooks[0].a - a1) > 0.05);
await shot('dv-1p-bat-dau.png');
await key('Space'); await sleep(120); s = await S();
check('phím Space → thả móc (dây dài ra)', s.hooks[0].s !== 'swing');
await sleep(2500);
let grabbedShot = false;
const t0 = (await S()).time;
s = await record('dao-vang-1-nguoi', () => autoplay(16, ['Space'], async st => {
  if (!grabbedShot && st.hooks[0].s === 'back' && ['goldL', 'goldM', 'diamond'].includes(st.hooks[0].carry)) { grabbedShot = true; await shot('dv-1p-keo-vang.png'); }
}));
check('gắp được vàng/kim cương bằng phím thật → điểm tăng', s.score > 0, s.score + ' điểm');
check('đồng hồ đếm ngược trong lúc chơi', s.time < t0 - 10, t0.toFixed(1) + ' → ' + s.time.toFixed(1));
check('có ảnh lúc đang kéo vàng lên', grabbedShot);

// ---------- Tạm dừng ----------
await key('KeyP'); await sleep(200);
const tp = (await S()).time; await sleep(1500);
check('phím P → tạm dừng, đồng hồ đứng yên', (await ev('__game.paused')) && Math.abs((await S()).time - tp) < 0.01);
await shot('dv-tam-dung.png');
await key('KeyP'); await sleep(1200);
check('P lần nữa → chơi tiếp', !(await ev('__game.paused')) && (await S()).time < tp - 0.5);

// ---------- Hết giờ: qua màn ----------
await ev('(()=>{const g=__game.state;g.score=Math.max(g.score,g.target+40);g.time=0.4})()'); await sleep(900);
s = await S();
check('hết giờ + đủ mục tiêu → "Qua màn"', s.status === 'cleared');
await shot('dv-qua-man.png');
const keep = s.score;
await key('Space'); await sleep(300); s = await S();
check('Space → sang màn 2, giữ điểm, mục tiêu cao hơn, đồng hồ reset', s.level === 2 && s.score === keep && s.status === 'playing' && s.target > 650 && s.time > 59, `màn ${s.level}, mục tiêu ${s.target}`);
check('màn 2 có thêm thùng TNT', s.objs.some(o => o.k === 'tnt'));

// ---------- Hết giờ: thua ----------
await ev('(()=>{const g=__game.state;g.score=Math.min(g.score,g.target-100);g.time=0.4})()'); await sleep(900);
s = await S();
check('hết giờ + thiếu điểm → "Hết giờ" (thua)', s.status === 'failed', `${s.score}/${s.target}`);
await shot('dv-het-gio.png');
await key('Space'); await sleep(300); s = await S();
check('Space → chơi lại từ màn 1, điểm 0', s.level === 1 && s.score === 0 && s.status === 'playing');

// ---------- 2 người cùng máy ----------
await nav(BASE + '?players=2&seed=5'); await sleep(300);
s = await S();
check('2 người: 2 móc, 2 thợ mỏ', s.hooks.length === 2);
await key('KeyS'); await sleep(120); s = await S();
check('P1 bấm S → chỉ móc trái thả, móc phải vẫn lắc', s.hooks[0].s !== 'swing' && s.hooks[1].s === 'swing');
await key('ArrowDown'); await sleep(120); s = await S();
check('P2 bấm ↓ → móc phải thả', s.hooks[1].s !== 'swing');
await sleep(3000);
let both = false;
s = await record('dao-vang-2-nguoi', () => autoplay(16, ['KeyS', 'ArrowDown'], async st => {
  if (!both && st.hooks.every(h => h.s !== 'swing') && st.hooks.some(h => h.carry)) { both = true; await shot('dv-2p-ca-hai-cung-tha.png'); }
}));
check('2 người: cả hai cùng gom điểm, chung tổng điểm', s.hooks[0].earned > 0 && s.hooks[1].earned > 0 && s.score === s.hooks[0].earned + s.hooks[1].earned, `P1 ${s.hooks[0].earned} + P2 ${s.hooks[1].earned} = ${s.score}`);
await ev('(()=>{const g=__game.state;g.score=Math.max(g.score,g.target+10);g.time=0.3})()'); await sleep(800);
await shot('dv-2p-qua-man.png');

// ---------- Mobile: chạm ----------
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
await view(844, 390, true, 2);
await nav(BASE + '?players=1&seed=21'); await sleep(300);
check('mobile ngang 844×390: không cuộn ngang, khung chơi vừa chiều cao màn hình', await ev('document.documentElement.scrollWidth<=innerWidth && document.querySelector("#stage").getBoundingClientRect().bottom<=innerHeight'), await ev('Math.round(document.querySelector("#stage").getBoundingClientRect().bottom)+"/"+innerHeight'));
const cr = await ev('(()=>{const r=document.querySelector("#stage canvas").getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()');
await tap(cr[0] + cr[2] / 2, cr[1] + cr[3] / 2); await sleep(150);
check('mobile: chạm màn hình → thả móc', (await S()).hooks[0].s !== 'swing');
await sleep(1600);
await shot('dv-mobile-ngang.png');

await view(390, 844, true, 3);
await nav(BASE + '?players=2&seed=8'); await sleep(300);
check('mobile dọc 390: không cuộn ngang, canvas vừa màn hình', await ev('document.documentElement.scrollWidth<=innerWidth && document.querySelector("#stage canvas").getBoundingClientRect().width<=390'));
const cp = await ev('(()=>{const r=document.querySelector("#stage canvas").getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()');
await tap(cp[0] + cp[2] * 0.8, cp[1] + cp[3] / 2); await sleep(150); s = await S();
check('mobile 2 người: chạm nửa phải → chỉ móc P2 thả', s.hooks[1].s !== 'swing' && s.hooks[0].s === 'swing');
await tap(cp[0] + cp[2] * 0.2, cp[1] + cp[3] / 2); await sleep(150); s = await S();
check('mobile 2 người: chạm nửa trái → móc P1 thả', s.hooks[0].s !== 'swing');
await sleep(800);
await shot('dv-mobile-doc-2p.png');

check('không có lỗi JS / console', errors.length === 0, errors.join(' | '));
console.log('\n' + R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
ws.close(); chrome.kill(); process.exit(0);
