// E2E Cờ Cá Ngựa trên Chrome headless — điều khiển bằng chuột/phím/chạm thật qua CDP.
// node e2e.mjs <thư mục output>   (cần server: PORT=8766 node server.js ở gốc repo, hoặc python -m http.server 8766 trong prototype/)
// Chế độ chơi với máy: người chơi cầm ghế 0 (Đỏ), máy (ai.js) tự gieo + tự đi các ghế còn lại.
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const OUT = process.argv[2], URL0 = 'http://127.0.0.1:' + (process.env.PORT || 8766) + '/games/co-ca-ngua/index.html';
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
  if (m.method === 'Page.frameNavigated' && !m.params.frame.parentId && expectNav === 0) console.log('  !! trang tự chuyển tới ' + m.params.frame.url);
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
let expectNav = 0;
const nav = async u => { expectNav++; await send('Page.navigate', { url: u }); await sleep(1500); expectNav--; await ev(`addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a');if(a)localStorage.setItem('e2e.lastA',a.outerHTML.slice(0,160)+' @'+e.clientX+','+e.clientY)},true)`); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const KEYS = { Space: [' ', 32], KeyP: ['p', 80], KeyM: ['m', 77], Digit1: ['1', 49], Digit2: ['2', 50], Digit3: ['3', 51], Digit4: ['4', 52] };
const key = async code => { const [k, vk] = KEYS[code]; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const btn = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const S = () => ev('(()=>{const g=__game.state;return {phase:g.phase,seat:g.seats[g.turn],dice:g.dice,rolls:g.rolls,moves:g.moves.map(m=>({h:m.horse,kind:m.kind,to:m.to,kick:!!m.kick})),horses:g.horses,winner:g.winner,busy:__game.busy,bot:__game.botTurn}})()');
// Chờ tới lượt người chơi (máy đi xong), không bận hoạt ảnh.
const waitHuman = async (ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { const s = await S(); if (s.phase === 'over' || (!s.bot && !s.busy)) return s; await sleep(40); } return null; };
// Người chơi đi một bước (gieo hoặc chọn ngựa đầu tiên) nếu đang tới lượt mình.
const humanStep = async (s) => { if (s.bot || s.busy || s.phase === 'over') return; if (s.phase === 'roll') await key('Space'); else await key('Digit' + (s.moves[0].h + 1)); };
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
  const end = Date.now() + sec * 1000; let rolls = 0, picks = 0, kicks = 0, botRolls = 0, last = null;
  while (Date.now() < end) {
    let s;
    try { s = await S(); } catch (e) { console.log('  !! trang đã rời đi: ' + (await ev('location.href'))); throw e; }
    if (s.phase === 'over') break;
    if (last && last.bot && s.rolls > last.rolls) botRolls += s.rolls - last.rolls;
    last = s;
    if (s.busy || s.bot) { await sleep(25); continue; } // lượt máy: máy tự đi
    if (s.phase === 'roll') { if (useTouch) { const p = await ev('__game.screenOf(0,null)'); await tap(p.x, p.y); } else await key('Space'); rolls++; await sleep(60); continue; }
    if (s.phase === 'move') {
      const best = await ev(`${LOGIC}.then(L=>{const m=L.pickMove(__game.state);return {h:m.horse,kick:!!m.kick}})`);
      const p = await ev(`__game.screenOf(${s.seat},${best.h})`);
      if (useTouch) await tap(p.x, p.y); else await click(p.x, p.y);
      picks++; if (best.kick) kicks++;
      await sleep(60);
    }
  }
  return { rolls, picks, kicks, botRolls, ...(await S()) };
}

// ---------- Desktop: menu ----------
await view(1280, 900, false, 1);
await nav(URL0);
check('màn vào: có "Chơi với máy" + Tạo phòng / Vào phòng online, không còn "Chơi chung 1 máy"',
  await ev(`!!document.querySelector('[data-e=bot]') && !!document.querySelector('[data-e=create]') && !!document.querySelector('[data-e=join]') && !document.body.textContent.includes('Chơi chung')`));
await shot('cn-vao.png');
await click(...await btn('[data-e=bot]')); await sleep(600);
check('bấm "Chơi với máy" → phòng chờ, chọn 1/2/3 máy', await ev('__game.lobby') === true && await ev('[...document.querySelectorAll("[data-n]")].map(b=>b.dataset.n+":"+b.textContent).join()') === '2:1 máy,3:2 máy,4:3 máy');
await shot('cn-menu.png');
await click(...await btn('[data-n="4"]')); await sleep(300);
check('phòng chờ: chọn 4 người chưa vào ván, nút CHƠI hiện', await ev('__game.lobby') === true && await ev('!!document.querySelector("#playBtn").offsetParent'));
await click(...await btn('#playBtn')); await sleep(500);
check('bấm "3 máy" + CHƠI → vào bàn 4 màu, mỗi màu 4 ngựa trong chuồng', await ev('__game && __game.state.seats.length===4 && Object.values(__game.state.horses).every(a=>a.length===4&&a.every(p=>p===-1))'));
await shot('cn-4-nguoi-bat-dau.png');

// Asset thật board-v5: đã tải xong; board-v5-grid.json khớp đường đi/chuồng đích; ô chuồng đích trên ảnh đúng màu ghế
{ const end = Date.now() + 4000; while (Date.now() < end && !(await ev('__game.artReady'))) await sleep(50); }
check('asset board-v5 (bàn + 4 bộ ngựa + manifest + grid) tải xong, đang vẽ bằng ảnh', await ev('__game.artReady'));
const geo = await ev(`import("/games/co-ca-ngua/game.js").then(M=>fetch("/games/co-ca-ngua/"+M.ART.board.grid).then(r=>r.json()).then(grid=>new Promise(ok=>{const i=new Image();i.onload=()=>{
  const cv=document.createElement("canvas");cv.width=i.width;cv.height=i.height;const x=cv.getContext("2d");x.drawImage(i,0,0);
  const px=([c,r])=>{const d=x.getImageData(c*64+30,r*64+30,5,5).data;let R=0,G=0,B=0;for(let k=0;k<d.length;k+=4){R+=d[k];G+=d[k+1];B+=d[k+2]}const n=d.length/4;return [R/n,G/n,B/n]};
  const hue=([r,g,b])=>{if(r>150&&g>150&&b<90)return "yellow";if(r>g&&r>b)return "red";if(g>r&&g>b)return "green";if(b>r&&b>g)return "blue";return "?"};
  const stableBad=[];M.STABLE.forEach((a,s)=>a.forEach((c,k)=>{const h=hue(px(c));if(h!==M.VIEW_COLORS[s])stableBad.push(M.VIEW_COLORS[s]+k+":"+h)}));
  ok({grid:M.gridMismatch(grid),stableBad})};i.src="/games/co-ca-ngua/"+M.ART.board.src})))`);
check('board-v5-grid.json khớp 4 ô xuất phát + 16 ô chuồng đích của game; ô chuồng đích trên ảnh đúng màu ghế', !geo.grid.length && !geo.stableBad.length, JSON.stringify(geo));
const quad = await ev('(()=>{const c=document.querySelector(".cn-board canvas").getBoundingClientRect();const f=(s)=>{const p=__game.screenOf(s,0);return (p.x>c.left+c.width/2?"phải":"trái")+"-"+(p.y>c.top+c.height/2?"dưới":"trên")};return [0,1,2,3].map(f).join()})()');
check('ngựa trong chuồng nằm đúng lán cùng màu: Đỏ trên-trái, Xanh dương dưới-trái, Vàng dưới-phải, Xanh lá trên-phải', quad === 'trái-trên,trái-dưới,phải-dưới,phải-trên', quad);
await shot('cn-4-nguoi-bat-dau.png');

// Gieo bằng phím Space
const r0 = (await S()).rolls; await key('Space'); await sleep(150);
check('Space → xúc xắc lăn (đang hoạt ảnh)', (await S()).rolls === r0 + 1 && (await ev('__game.busy')));
await waitIdle();
const sAfter = await S();
check('gieo xong hiện mặt 1–6', sAfter.dice >= 1 && sAfter.dice <= 6, 'mặt ' + sAfter.dice);
check('HUD: thẻ ghế 0 ghi "Bạn", các ghế khác ghi "Máy"', await ev('[0,1,2,3].map(s=>document.querySelector(`.cn-seat[data-seat="${s}"] .nm`).textContent).join()') === 'Bạn,Máy,Máy,Máy');
// Máy tự đi: người chơi đi hết lượt mình, sau đó không bấm gì — máy phải tự gieo
let sawBot = null;
{ const t = Date.now(); while (Date.now() - t < 15000) { const s = await S(); if (s.bot && !s.busy) { sawBot = s; break; } await humanStep(s); await sleep(60); } }
const botLbl = await ev('(document.querySelector(".cn-tray.on .lbl")||{}).textContent + " | " + document.querySelector(".cn-status").textContent');
check('tới lượt máy: HUD ghi "Máy"', !!sawBot && /Máy/.test(botLbl), botLbl);
// người bấm Space trong lượt máy → bị bỏ qua (máy chờ ≥ 450 ms mới gieo, nên gieo trong < 400 ms là do người)
{ const s = await S(); const t = Date.now(); await key('Space'); await sleep(40); const s2 = await S(); const dt = Date.now() - t;
  check('lượt máy: Space của người chơi không gieo hộ', dt > 400 || s2.rolls === s.rolls || !s.bot || s.busy, `${s.rolls}→${s2.rolls} trong ${dt}ms`); }
const hb = await waitHuman();
check('máy tự gieo + tự đi rồi trả lượt về người chơi', !!hb && hb.rolls > sawBot.rolls && (hb.seat === 0 || hb.phase === 'over'), hb ? `${hb.rolls - sawBot.rolls} lần gieo của máy` : 'hết giờ');
// tạm dừng giữa lượt máy → máy cũng dừng
{ const t = Date.now(); while (Date.now() - t < 15000) { const s = await S(); if (s.bot && !s.busy) break; await humanStep(s); await sleep(30); }
  await key('KeyP'); await sleep(50); const r = (await S()).rolls; await sleep(1800); const r2 = (await S()).rolls;
  check('P trong lượt máy → máy cũng dừng (1,8 giây không gieo)', (await ev('__game.paused')) && r2 === r, `${r}→${r2}`);
  await shot('cn-tam-dung-luot-may.png');
  await key('KeyP'); const w = await waitHuman();
  check('bỏ tạm dừng → máy đi tiếp', !!w && w.rolls > r2, w ? `${r2}→${w.rolls}` : ''); }

// ---------- Tung xúc xắc: kéo-thả bằng chuột trong sân của mình ----------
const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
const inYard = (f, p) => p.x >= f.yard[0] && p.x <= f.yard[2] && p.y >= f.yard[1] && p.y <= f.yard[3];
async function dragThrow(dx, dy, steps = 8, touch = false) {
  const d = await ev('__game.dieScreen()');
  if (touch) await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: d.x, y: d.y }] }); else await mouse('mousePressed', d.x, d.y);
  for (let i = 1; i <= steps; i++) { const x = d.x + dx * i / steps, y = d.y + dy * i / steps; if (touch) await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); else await mouse('mouseMoved', x, y); await sleep(10); }
  const held = await ev('getComputedStyle(document.querySelector(".cn-board canvas")).cursor');
  if (touch) await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); else await mouse('mouseReleased', d.x + dx, d.y + dy);
  await sleep(30);
  let flight; try { flight = await ev('__game.diceFlight'); } catch (e) { await sleep(800); console.log('  !! sau khi thả tay trang đã đổi; link vừa bấm: ' + (await ev('localStorage.getItem("e2e.lastA")'))); throw e; }
  return { held, flight, scrollY: await ev('scrollY') };
}
{
  const s0 = await waitHuman();
  if (s0.phase === 'roll' && s0.seat === 0) {
    const hover = await ev('__game.dieScreen()'); await mouse('mouseMoved', hover.x, hover.y); await sleep(50);
    check('rê chuột vào sân mình lúc tới lượt → con trỏ "grab"', (await ev('getComputedStyle(document.querySelector(".cn-board canvas")).cursor')) === 'grab');
    const r0 = (await S()).rolls;
    const t = await dragThrow(120, -60);
    check('cầm xúc xắc kéo đi rồi thả → tung: xúc xắc bay trong sân Đỏ, nảy vài lần', t.held === 'grabbing' && t.flight && t.flight.seat === 0 && t.flight.bounces >= 1 && inYard(t.flight, t.flight.end) && (await S()).rolls === r0 + 1, JSON.stringify(t.flight && { b: t.flight.bounces, ms: Math.round(t.flight.duration), end: [Math.round(t.flight.end.x), Math.round(t.flight.end.y)] }));
    await sleep(350); await shot('cn-xuc-xac-dang-bay.png');
    await waitIdle(4000);
    const s1 = await S();
    check('xúc xắc đáp đúng mặt logic gieo (hoạt ảnh chỉ là hình)', t.flight && t.flight.face === s1.dice, `bay ${t.flight && t.flight.face} / logic ${s1.dice}`);
    await shot('cn-xuc-xac-dap.png');
  }
  // nhiều lần tung liên tiếp (cả máy): đường bay khác nhau, luôn trong sân của ghế đang gieo
  const flights = []; const tEnd = Date.now() + 25000;
  while (Date.now() < tEnd && flights.length < 8) {
    const f = await ev('__game.diceFlight');
    if (f && !flights.some((x) => x.start.x === f.start.x && x.duration === f.duration && x.end.x === f.end.x)) flights.push(f);
    const s = await S(); if (!f) await humanStep(s); await sleep(40);
  }
  const ok = flights.every((f) => inYard(f, f.end));
  const distinct = new Set(flights.map((f) => Math.round(f.end.x) + ':' + Math.round(f.end.y) + ':' + f.bounces)).size;
  check('8 lần tung (người + máy): mỗi lần một đường khác nhau, đáp trong sân của ghế đang gieo, máy tung trong sân của máy', flights.length >= 6 && ok && distinct >= flights.length - 1 && flights.some((f) => f.seat !== 0),
    `${flights.length} lần, ${distinct} đường khác, ghế ${[...new Set(flights.map((f) => f.seat))].join('/')}`);
}

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
// Đỏ (ghế 0) có ngựa ở bước 5 và bước 10; Xanh dương (ghế 1) đứng ở ô tuyệt đối 9 = bước 42 của ghế 1. Gieo 4: ngựa 0 tới bước 9 → đá.
n = await stage({ 0: [5, 10, -1, -1], 1: [42, -1, -1, -1], 2: [-1, -1, -1, -1], 3: [-1, -1, -1, -1] }, 0, 4);
await sleep(80);
await shot('cn-chon-ngua.png');
check('gieo 4 → 2 ngựa đi được (viền vàng nhấp nháy)', n === 2);
s = await record('cn-da-ngua', async () => {
  const p = await ev('__game.screenOf(0,0)');
  await click(p.x, p.y); await sleep(250); await shot('cn-dang-nhay.png');
  await waitIdle(); const r = await S(); await sleep(450); return r;
});
check('bấm chuột vào ngựa 1 → đi 4 ô, đá ngựa Xanh dương về chuồng', s.horses[0][0] === 9 && s.horses[1][0] === -1, JSON.stringify(s.horses[0]) + ' / ' + JSON.stringify(s.horses[1]));
check('gieo 4 → hết lượt, sang máy Xanh dương', s.seat === 1 && s.bot);
await waitHuman();
await shot('cn-da-ngua.png');

// ---------- Chặn đường ----------
n = await stage({ 0: [5, 8, -1, -1] }, 0, 5);
check('không nhảy qua ngựa khác: gieo 5 chỉ ngựa đi trước được đi', n === 1);
await waitIdle(); await sleep(500); await waitIdle();
s = await S();
await waitHuman();
check('chỉ 1 nước đi → tự đi', s.horses[0][1] === 13 && s.horses[0][0] === 5);

// ---------- Vào chuồng đích bằng phím số + thắng ----------
n = await stage({ 0: [47, 46, 45, 43] }, 0, 1);
check('ngựa ở cửa chuồng gieo 1 → vào bậc 1', n === 1);
await waitIdle(); await sleep(500); await waitIdle(); await sleep(300);
s = await S();
check('đủ 4 ngựa trong chuồng đích → Đỏ thắng, ván kết thúc', s.phase === 'over' && s.winner === 0);
check('báo kết quả cho SDK (gameOver)', await ev('window.__lastResult && window.__lastResult.winner==="red" && window.__lastResult.won===true'));
await sleep(600);
{ const lg = (await ev('__game.sfx')).log, th = lg.filter(e => e.n === 'thang').length, tu = lg.filter(e => e.n === 'thua').length;
  check('bạn thắng → phát "thang", không phát "thua"; bảng ghi "Bạn thắng!"', th === 1 && tu === 0 && (await ev('document.querySelector(".cn-result .px-h").textContent')) === 'Bạn thắng!', `thang ${th}, thua ${tu}`); }
await shot('cn-thang.png');
await key('Space'); await sleep(300);
s = await S();
check('Space ở màn thắng → ván mới, ngựa về chuồng', s.phase === 'roll' && Object.values(s.horses).every(a => a.every(p => p === -1)));
// máy thắng → người chơi nghe "thua", không nghe "thang"
{ const before = (await ev('__game.sfx')).log.length;
  await stage({ 0: [5, -1, -1, -1], 1: [47, 46, 45, 43], 2: [-1, -1, -1, -1], 3: [-1, -1, -1, -1] }, 1, 1);
  const t = Date.now(); while (Date.now() - t < 6000 && (await S()).phase !== 'over') await sleep(50);
  await waitIdle(); await sleep(700);
  const lg = (await ev('__game.sfx')).log.slice(before), th = lg.filter(e => e.n === 'thang').length, tu = lg.filter(e => e.n === 'thua').length;
  const head = await ev('document.querySelector(".cn-result .px-h").textContent');
  check('máy tự vào chuồng và thắng → phát "thua", KHÔNG phát "thang"; bảng ghi máy thắng', (await S()).winner === 1 && th === 0 && tu === 1 && /Máy/.test(head), `thang ${th}, thua ${tu}, "${head}"`);
  await shot('cn-may-thang.png');
  await key('Space'); await sleep(300); }
// phím số chọn ngựa
n = await stage({ 0: [5, 8, -1, -1] }, 0, 2);
check('gieo 2 → 2 lựa chọn', n === 2);
await key('Digit2'); await waitIdle();
s = await S();
await waitHuman();
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
check('ván người vs 1 máy (phím + chuột thật) chơi tới khi có người thắng; máy tự gieo', rest.phase === 'over' && rest.winner != null && full.botRolls + rest.botRolls > 20, `${rest.rolls} lần gieo, máy gieo ${full.botRolls + rest.botRolls}, thắng: ghế ${rest.winner}`);
await shot('cn-2-nguoi-ket-thuc.png');

// ---------- Âm thanh: phát đúng sự kiện trong ván vừa chơi ----------
const sx = await ev('__game.sfx');
const cnt = n => sx.log.filter(e => e.n === n).length;
check('8 file SFX Cá Ngựa tải + giải mã được, âm thanh đang chạy', sx.loaded === 8 && sx.state === 'running', `${sx.loaded}/8, ${sx.state}`);
check('xúc xắc nảy phát tiếng "cộp" (đoạn ngắn do-xuc-xac, to nhỏ / cao thấp khác nhau)', cnt('do-xuc-xac:nay') > rest.rolls, `${cnt('do-xuc-xac:nay')} tiếng nảy / ${rest.rolls} lần gieo`);
check('mỗi lần gieo (cả người lẫn máy) phát "do-xuc-xac" đúng 1 lần', cnt('do-xuc-xac') === rest.rolls, `${cnt('do-xuc-xac')} tiếng / ${rest.rolls} lần gieo (bộ đếm của ván)`);
const endSfx = rest.winner === 0 ? 'thang' : 'thua';
check('ngựa nhảy từng ô phát "buoc-nhay", đá quân "da-quan", vào chuồng "ve-chuong", hết ván đúng 1 tiếng thắng/thua theo người chơi', cnt('buoc-nhay') > 50 && cnt('da-quan') >= 1 && cnt('ve-chuong') >= 4 && cnt(endSfx) === 1 && cnt('thang') + cnt('thua') === 1,
  `bước ${cnt('buoc-nhay')}, đá ${cnt('da-quan')}, về chuồng ${cnt('ve-chuong')}, thang ${cnt('thang')}, thua ${cnt('thua')} (thắng: ghế ${rest.winner})`);
const lastWin = sx.log.filter(e => e.n === endSfx).pop(), lastHome = sx.log.filter(e => e.n === 've-chuong').pop();
check('tiếng thắng/thua phát sau tiếng ngựa cuối về chuồng', lastWin && lastHome && lastWin.t >= lastHome.t, lastWin && lastHome ? `+${lastWin.t - lastHome.t}ms` : '');
// Tắt tiếng
await ev(`document.querySelector('[data-act="mute"]').scrollIntoView({block:"center"})`); await sleep(100);
await click(...await btn('[data-act="mute"]')); await sleep(100);
const nBefore = (await ev('__game.sfx')).log.length;
await key('Space'); await sleep(200); await key('Space'); await sleep(900);
const muteTxt = await ev(`document.querySelector('[data-act="mute"]').getAttribute("aria-pressed")+" "+document.querySelector('[data-act="mute"] img').src.split("/").pop()`);
check('bấm "Âm thanh" → tắt tiếng: gieo không phát tiếng nào, nút đổi icon', (await ev('__game.sfx')).log.length === nBefore && /^true .*am-thanh-tat/.test(muteTxt) && (await ev('localStorage.getItem("wgp.muted")')) === '1', muteTxt);
await key('KeyM'); await sleep(100);
check('phím M → bật lại tiếng', (await ev(`document.querySelector('[data-act="mute"]').getAttribute("aria-pressed")`)) === 'false' && (await ev('localStorage.getItem("wgp.muted")')) === '0');

// ---------- 4 người, quay video 45 giây ----------
await nav(URL0 + '?players=4&seed=5');
const f4 = await record('ca-ngua-4-nguoi', () => play(45));
check('bạn + 3 máy: máy gieo nhiều lượt, có ngựa ra bàn', f4.botRolls >= 8 && Object.values(f4.horses).flat().some(p => p >= 0), `người ${f4.rolls}, máy ${f4.botRolls} lần gieo, ${f4.kicks} lần đá`);
await shot('cn-4-nguoi-giua-van.png');

// ---------- Mobile dọc 390×844, chạm ----------
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
await view(390, 844, true, 2);
await nav(URL0 + '?local=1');
await tap(...await btn('[data-n="3"]')); await sleep(300);
await ev('document.querySelector("#playBtn").scrollIntoView({block:"center"})'); await sleep(100);
await tap(...await btn('#playBtn')); await sleep(400); await ev('scrollTo(0,0)'); await sleep(100);
check('mobile: chạm "2 máy" → bàn 3 màu', await ev('__game.state.seats.join()') === '0,1,2');
const fit = await ev('(()=>{const r=document.querySelector(".cn-board canvas").getBoundingClientRect();return {w:r.width,right:r.right,bottom:r.bottom,vw:innerWidth}})()');
check('mobile: bàn cờ vừa khít bề ngang, không tràn', fit.right <= fit.vw + 0.5 && fit.w >= 360, JSON.stringify(fit));
const ovf = await ev('[document.documentElement.scrollWidth, innerWidth]');
check('mobile 390×844: trang không tràn ngang', ovf[0] <= ovf[1], ovf.join(' / '));
{ const s = await waitHuman(); if (s.phase === 'roll' && s.seat === 0) {
  const t = await dragThrow(-80, 90, 8, true);
  check('mobile: kéo xúc xắc bằng ngón tay rồi thả → tung trong sân, trang không bị cuộn', t.flight && t.flight.seat === 0 && inYard(t.flight, t.flight.end) && t.scrollY === 0, JSON.stringify({ scrollY: t.scrollY, b: t.flight && t.flight.bounces }));
  await sleep(300); await shot('cn-mobile-xuc-xac-bay.png'); } }
const m3 = await play(25, true);
check('mobile: chạm để gieo + chạm vào ngựa để đi, máy đi xen kẽ', m3.rolls >= 4 && m3.botRolls >= 4, `${m3.rolls} lần gieo, ${m3.picks} lần chọn ngựa, máy ${m3.botRolls} lần gieo`);
await shot('cn-mobile-3-nguoi.png');

check('không có lỗi JS / console', errors.length === 0, errors.length + ' lỗi: ' + [...new Set(errors)].slice(0, 3).join(' | ').slice(0, 600));
console.log('\n' + R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
writeFileSync(OUT + '/e2e-result.txt', R.join('\n') + '\n');
ws.close(); chrome.kill(); process.exit(R.some(x => x.startsWith('FAIL')) ? 1 : 0);
