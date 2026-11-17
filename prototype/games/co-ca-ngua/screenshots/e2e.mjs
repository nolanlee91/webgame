// E2E Cờ Cá Ngựa trên Chrome headless — điều khiển bằng chuột/phím/chạm thật qua CDP.
// node e2e.mjs <thư mục output>   (cần server: python -m http.server 8766 trong prototype/)
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const OUT = process.argv[2], URL0 = 'http://127.0.0.1:8766/games/co-ca-ngua/index.html';
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
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(1500); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const KEYS = { Space: [' ', 32], KeyP: ['p', 80], Digit1: ['1', 49], Digit2: ['2', 50], Digit3: ['3', 51], Digit4: ['4', 52] };
const key = async code => { const [k, vk] = KEYS[code]; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const btn = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const S = () => ev('(()=>{const g=__game.state;return {phase:g.phase,seat:g.seats[g.turn],dice:g.dice,rolls:g.rolls,moves:g.moves.map(m=>({h:m.horse,kind:m.kind,to:m.to,kick:!!m.kick})),horses:g.horses,winner:g.winner,busy:__game.busy}})()');
const waitIdle = async (ms = 4000) => { const end = Date.now() + ms; while (Date.now() < end) { if (!(await ev('__game.busy'))) return true; await sleep(30); } return false; };
const LOGIC = 'import("/games/co-ca-ngua/logic.js")';
// Dựng thế cờ: đặt ngựa + xúc xắc đã gieo = d (giống vừa gieo xong), để kiểm tra bấm chọn ngựa thật.
const stage = (horses, seat, d) => ev(`${LOGIC}.then(L=>{const g=__game.state;Object.assign(g.horses,${JSON.stringify(horses)});g.turn=g.seats.indexOf(${seat});g.phase="roll";L.roll(g,${d});__game.state=g;return g.moves.length})`);

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
// "Người chơi": gieo bằng Space, chọn ngựa bằng CHUỘT bấm vào con ngựa (nước đi khá: đá > vào chuồng > lên bậc > xuất > đi xa).
async function play(sec, useTouch = false) {
  const end = Date.now() + sec * 1000; let rolls = 0, picks = 0, kicks = 0;
  while (Date.now() < end) {
    const s = await S();
    if (s.phase === 'over') break;
    if (s.busy) { await sleep(25); continue; }
    if (s.phase === 'roll') { if (useTouch) { const p = await ev('__game.screenOf(0,null)'); await tap(p.x, p.y); } else await key('Space'); rolls++; await sleep(60); continue; }
    if (s.phase === 'move') {
      const best = await ev(`${LOGIC}.then(L=>{const m=L.pickMove(__game.state);return {h:m.horse,kick:!!m.kick}})`);
      const p = await ev(`__game.screenOf(${s.seat},${best.h})`);
      if (useTouch) await tap(p.x, p.y); else await click(p.x, p.y);
      picks++; if (best.kick) kicks++;
      await sleep(60);
    }
  }
  return { rolls, picks, kicks, ...(await S()) };
}

// ---------- Desktop: menu ----------
await view(1280, 900, false, 1);
await nav(URL0);
check('trang Cờ Cá Ngựa mở được, có lựa chọn 2/3/4 người', await ev('[...document.querySelectorAll("[data-n]")].map(b=>b.dataset.n).join()') === '2,3,4');
await shot('cn-menu.png');
await click(...await btn('[data-n="4"]')); await sleep(500);
check('bấm "4 người" → vào bàn 4 màu, mỗi màu 4 ngựa trong chuồng', await ev('__game && __game.state.seats.length===4 && Object.values(__game.state.horses).every(a=>a.length===4&&a.every(p=>p===-1))'));
await shot('cn-4-nguoi-bat-dau.png');

// Gieo bằng phím Space
const r0 = (await S()).rolls; await key('Space'); await sleep(150);
check('Space → xúc xắc lăn (đang hoạt ảnh)', (await S()).rolls === r0 + 1 && (await ev('__game.busy')));
await waitIdle();
const sAfter = await S();
check('gieo xong hiện mặt 1–6', sAfter.dice >= 1 && sAfter.dice <= 6, 'mặt ' + sAfter.dice);

// FPS
const fps = await ev('new Promise(r=>{let n=0;const t0=performance.now();(function f(){n++;if(performance.now()-t0<1000)requestAnimationFrame(f);else r(n)})()})');
check('chạy mượt ≥ 50 FPS', fps >= 50, fps + ' FPS');

// ---------- Thế cờ dựng sẵn: xuất ngựa bằng chuột ----------
await nav(URL0 + '?players=4&seed=7');
let n = await stage({ 0: [-1, -1, -1, -1] }, 0, 6);
check('gieo 6 khi cả 4 ngựa trong chuồng → 4 lựa chọn xuất ngựa', n === 4);
await sleep(700); // chờ tự đi (mọi lựa chọn giống nhau → tự xuất)
await waitIdle();
let s = await S();
check('mọi lựa chọn đều là xuất ngựa → tự xuất 1 ngựa, được gieo thêm', s.horses[0].filter(p => p === 0).length === 1 && s.seat === 0 && s.phase === 'roll');

// ---------- Đá ngựa bằng chuột ----------
// Đỏ (ghế 0) có ngựa ở bước 5 và bước 10; Xanh lá (ghế 1) đứng ở ô tuyệt đối 9 = bước 42 của ghế 1. Gieo 4: ngựa 0 tới bước 9 → đá.
n = await stage({ 0: [5, 10, -1, -1], 1: [42, -1, -1, -1], 2: [-1, -1, -1, -1], 3: [-1, -1, -1, -1] }, 0, 4);
await sleep(80);
await shot('cn-chon-ngua.png');
check('gieo 4 → 2 ngựa đi được (viền vàng nhấp nháy)', n === 2);
await record('cn-da-ngua', async () => {
  const p = await ev('__game.screenOf(0,0)');
  await click(p.x, p.y); await sleep(250); await shot('cn-dang-nhay.png');
  await waitIdle(); await sleep(450);
});
s = await S();
check('bấm chuột vào ngựa 1 → đi 4 ô, đá ngựa Xanh lá về chuồng', s.horses[0][0] === 9 && s.horses[1][0] === -1, JSON.stringify(s.horses[0]) + ' / ' + JSON.stringify(s.horses[1]));
check('gieo 4 → hết lượt, sang Xanh lá', s.seat === 1 && s.phase === 'roll');
await shot('cn-da-ngua.png');

// ---------- Chặn đường ----------
n = await stage({ 0: [5, 8, -1, -1] }, 0, 5);
check('không nhảy qua ngựa khác: gieo 5 chỉ ngựa đi trước được đi', n === 1);
await waitIdle(); await sleep(500); await waitIdle();
s = await S();
check('chỉ 1 nước đi → tự đi', s.horses[0][1] === 13 && s.horses[0][0] === 5);

// ---------- Vào chuồng đích bằng phím số + thắng ----------
n = await stage({ 0: [47, 46, 45, 43] }, 0, 1);
check('ngựa ở cửa chuồng gieo 1 → vào bậc 1', n === 1);
await waitIdle(); await sleep(500); await waitIdle(); await sleep(300);
s = await S();
check('đủ 4 ngựa trong chuồng đích → Đỏ thắng, ván kết thúc', s.phase === 'over' && s.winner === 0);
check('báo kết quả cho SDK (gameOver)', await ev('window.__lastResult && window.__lastResult.winner==="red"'));
await shot('cn-thang.png');
await key('Space'); await sleep(300);
s = await S();
check('Space ở màn thắng → ván mới, ngựa về chuồng', s.phase === 'roll' && Object.values(s.horses).every(a => a.every(p => p === -1)));
// phím số chọn ngựa
n = await stage({ 0: [5, 8, -1, -1] }, 0, 2);
check('gieo 2 → 2 lựa chọn', n === 2);
await key('Digit2'); await waitIdle();
s = await S();
check('nhấn phím 2 → đi ngựa số 2', s.horses[0][1] === 10 && s.horses[0][0] === 5);

// Tạm dừng
await key('KeyP'); await sleep(100);
check('P → tạm dừng', await ev('__game.paused')); await shot('cn-tam-dung.png');
const rp = (await S()).rolls; await key('Space'); await sleep(200);
check('Space khi tạm dừng → chỉ bỏ tạm dừng, không gieo', !(await ev('__game.paused')) && (await S()).rolls === rp);

// ---------- Chơi trọn 1 ván 2 người bằng phím + chuột thật ----------
await nav(URL0 + '?players=2&seed=21');
const full = await record('ca-ngua-2-nguoi', () => play(60));
console.log(`  60 giây đầu ván 2 người: ${full.rolls} lần gieo, ${full.picks} lần chọn ngựa bằng chuột, ${full.kicks} lần đá`);
await shot('cn-2-nguoi-giua-van.png');
const rest = await play(600);
check('ván 2 người chơi bằng phím + chuột thật tới khi có người thắng', rest.phase === 'over' && rest.winner != null, `${rest.rolls + full.rolls} lần gieo, thắng: ghế ${rest.winner}`);
await shot('cn-2-nguoi-ket-thuc.png');

// ---------- 4 người, quay video 45 giây ----------
await nav(URL0 + '?players=4&seed=5');
const f4 = await record('ca-ngua-4-nguoi', () => play(45));
check('4 người: lượt đi vòng đủ 4 màu, có ngựa ra bàn', f4.rolls >= 20 && Object.values(f4.horses).flat().some(p => p >= 0), `${f4.rolls} lần gieo, ${f4.kicks} lần đá`);
await shot('cn-4-nguoi-giua-van.png');

// ---------- Mobile dọc 390×844, chạm ----------
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
await view(390, 844, true, 2);
await nav(URL0);
await tap(...await btn('[data-n="3"]')); await sleep(400);
check('mobile: chạm "3 người" → bàn 3 màu', await ev('__game.state.seats.join()') === '0,1,2');
const fit = await ev('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return {w:r.width,right:r.right,bottom:r.bottom,vw:innerWidth}})()');
check('mobile: bàn cờ vừa khít bề ngang, không tràn', fit.right <= fit.vw + 0.5 && fit.w >= 360, JSON.stringify(fit));
const m3 = await play(25, true);
check('mobile: chạm để gieo + chạm vào ngựa để đi', m3.rolls >= 8, `${m3.rolls} lần gieo, ${m3.picks} lần chọn ngựa`);
await shot('cn-mobile-3-nguoi.png');

check('không có lỗi JS / console', errors.length === 0, errors.length + ' lỗi: ' + [...new Set(errors)].slice(0, 3).join(' | ').slice(0, 600));
console.log('\n' + R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
ws.close(); chrome.kill(); process.exit(0);
