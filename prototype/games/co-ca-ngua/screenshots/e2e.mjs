// E2E Cờ Cá Ngựa trên Chrome headless — điều khiển bằng chuột/phím/chạm thật qua CDP.
// node e2e.mjs <thư mục output>   (cần server: python -m http.server 8766 trong prototype/)
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
const KEYS = { Space: [' ', 32], KeyP: ['p', 80], KeyM: ['m', 77], Digit1: ['1', 49], Digit2: ['2', 50], Digit3: ['3', 51], Digit4: ['4', 52] };
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
await nav(URL0 + '?local=1');
check('trang Cờ Cá Ngựa mở được, có lựa chọn 2/3/4 người', await ev('[...document.querySelectorAll("[data-n]")].map(b=>b.dataset.n).join()') === '2,3,4');
await shot('cn-menu.png');
await click(...await btn('[data-n="4"]')); await sleep(300);
check('phòng chờ: chọn 4 người chưa vào ván, nút CHƠI hiện', await ev('__game.lobby') === true && await ev('!!document.querySelector("#playBtn").offsetParent'));
await click(...await btn('#playBtn')); await sleep(500);
check('bấm "4 người" + CHƠI → vào bàn 4 màu, mỗi màu 4 ngựa trong chuồng', await ev('__game && __game.state.seats.length===4 && Object.values(__game.state.horses).every(a=>a.length===4&&a.every(p=>p===-1))'));
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
await record('cn-da-ngua', async () => {
  const p = await ev('__game.screenOf(0,0)');
  await click(p.x, p.y); await sleep(250); await shot('cn-dang-nhay.png');
  await waitIdle(); await sleep(450);
});
s = await S();
check('bấm chuột vào ngựa 1 → đi 4 ô, đá ngựa Xanh dương về chuồng', s.horses[0][0] === 9 && s.horses[1][0] === -1, JSON.stringify(s.horses[0]) + ' / ' + JSON.stringify(s.horses[1]));
check('gieo 4 → hết lượt, sang Xanh dương', s.seat === 1 && s.phase === 'roll');
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

// ---------- Âm thanh: phát đúng sự kiện trong ván vừa chơi ----------
const sx = await ev('__game.sfx');
const cnt = n => sx.log.filter(e => e.n === n).length;
check('5 file SFX Cá Ngựa tải + giải mã được, âm thanh đang chạy', sx.loaded === 5 && sx.state === 'running', `${sx.loaded}/5, ${sx.state}`);
check('mỗi lần gieo phát "do-xuc-xac" đúng 1 lần', cnt('do-xuc-xac') === rest.rolls, `${cnt('do-xuc-xac')} tiếng / ${rest.rolls} lần gieo (bộ đếm của ván)`);
check('ngựa nhảy từng ô phát "buoc-nhay", đá quân phát "da-quan", vào chuồng đích phát "ve-chuong", thắng phát "thang" 1 lần', cnt('buoc-nhay') > 50 && cnt('da-quan') >= 1 && cnt('ve-chuong') >= 4 && cnt('thang') === 1,
  `bước ${cnt('buoc-nhay')}, đá ${cnt('da-quan')}, về chuồng ${cnt('ve-chuong')}, thắng ${cnt('thang')}`);
const lastWin = sx.log.filter(e => e.n === 'thang').pop(), lastHome = sx.log.filter(e => e.n === 've-chuong').pop();
check('tiếng "thang" phát sau tiếng ngựa cuối về chuồng', lastWin && lastHome && lastWin.t >= lastHome.t, lastWin && lastHome ? `+${lastWin.t - lastHome.t}ms` : '');
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
check('4 người: lượt đi vòng đủ 4 màu, có ngựa ra bàn', f4.rolls >= 20 && Object.values(f4.horses).flat().some(p => p >= 0), `${f4.rolls} lần gieo, ${f4.kicks} lần đá`);
await shot('cn-4-nguoi-giua-van.png');

// ---------- Mobile dọc 390×844, chạm ----------
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
await view(390, 844, true, 2);
await nav(URL0 + '?local=1');
await tap(...await btn('[data-n="3"]')); await sleep(300);
await ev('document.querySelector("#playBtn").scrollIntoView({block:"center"})'); await sleep(100);
await tap(...await btn('#playBtn')); await sleep(400); await ev('scrollTo(0,0)'); await sleep(100);
check('mobile: chạm "3 người" → bàn 3 màu', await ev('__game.state.seats.join()') === '0,1,2');
const fit = await ev('(()=>{const r=document.querySelector(".cn-board canvas").getBoundingClientRect();return {w:r.width,right:r.right,bottom:r.bottom,vw:innerWidth}})()');
check('mobile: bàn cờ vừa khít bề ngang, không tràn', fit.right <= fit.vw + 0.5 && fit.w >= 360, JSON.stringify(fit));
const m3 = await play(25, true);
check('mobile: chạm để gieo + chạm vào ngựa để đi', m3.rolls >= 8, `${m3.rolls} lần gieo, ${m3.picks} lần chọn ngựa`);
await shot('cn-mobile-3-nguoi.png');

check('không có lỗi JS / console', errors.length === 0, errors.length + ' lỗi: ' + [...new Set(errors)].slice(0, 3).join(' | ').slice(0, 600));
console.log('\n' + R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
ws.close(); chrome.kill(); process.exit(0);
