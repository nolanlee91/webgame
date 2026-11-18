// E2E Cờ Caro trên Chrome headless — bấm chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8766 node server.js   rồi   node e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || '.', BASE = 'http://127.0.0.1:8766/games/co-caro/';
mkdirSync(OUT, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9343', '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
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
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(600); for (let i = 0; i < 50 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(200); await sleep(200); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = on => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const KEYS = { KeyU: ['u', 85], KeyN: ['n', 78], KeyM: ['m', 77], Escape: ['Escape', 27], Enter: ['Enter', 13], ArrowRight: ['ArrowRight', 39], ArrowDown: ['ArrowDown', 40], ArrowUp: ['ArrowUp', 38] };
const key = async code => { const [k, vk] = KEYS[code]; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined }); await sleep(40); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(150); };
const S = () => ev('(()=>{const g=__game.state;return g&&{size:g.size,rule:g.rule,mode:g.mode,turn:g.turn,moves:g.moves.length,winner:g.winner,line:g.line&&g.line.length,score:g.score,round:g.round,first:g.first,thinking:__game.thinking,pending:__game.pending}})()');
const pt = (r, c) => ev(`(()=>{const p=__game.cellPoint(${r},${c});return [p.x,p.y]})()`);
const cell = async (r, c) => { await press(...await pt(r, c)); await sleep(60); };
const visible = sel => ev(`!document.querySelector(${JSON.stringify(sel)}).hidden`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const choose = async (k, v) => { await pressSel(`.seg[data-k="${k}"] button[data-v="${v}"]`); };
const csPx = () => ev('__game.layout.cs/__game.layout.dpr');
const noOverflow = () => ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth && document.documentElement.scrollHeight<=document.documentElement.clientHeight+1');
const boardInStage = () => ev(`(()=>{const L=__game.layout,c=document.getElementById('cv').getBoundingClientRect();const n=__game.state?__game.state.size:15;const x0=c.left+(L.ox-L.fr)/L.dpr,x1=c.left+(L.ox+L.cs*n+L.fr)/L.dpr,y0=c.top+(L.oy-L.fr)/L.dpr,y1=c.top+(L.oy+L.cs*n+L.fr)/L.dpr;return x0>=c.left-1&&y0>=c.top-1&&x1<=c.right+1&&y1<=c.bottom+1&&y1<=innerHeight})()`);

const put = async (r, c) => { await cell(r, c); if (press === tap) await pressSel('#placeBtn'); };   // cảm ứng: chạm chọn ô rồi bấm nút Đặt
const waitAi = async () => { await sleep(60); for (let k = 0; k < 40 && (await S()).thinking; k++) await sleep(100); await sleep(60); };
const free = () => ev(`(()=>{const s=__game.state,n=s.size,m=n>>1;for(let d=0;d<n;d++)for(let r=m-d;r<=m+d;r++)for(let c=m-d;c<=m+d;c++)if(r>=0&&c>=0&&r<n&&c<n&&!s.board[r*n+c])return [r,c];return null})()`);
// Dựng sẵn thế cờ: ghi ván dở (chơi với máy) vào localStorage rồi tải lại trang → "Chơi tiếp ván dở"
const SAVE = 'wgp.caro.v1';
const saveGame = (moves, o = {}) => ev(`localStorage.setItem('${SAVE}', ${JSON.stringify(JSON.stringify({ opts: { mode: 'ai', aiLevel: 'hard', size: 15, rule: o.rule || 'free' }, game: { size: 15, rule: o.rule || 'free', mode: 'ai', aiLevel: 'hard', score: { 1: 0, 2: 0, draw: 0 }, round: 1, first: 1, moves } }))})`);
const interleave = (xs, os) => xs.flatMap((x, i) => (os[i] ? [x, os[i]] : [x]));
const rectOf = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,h:r.height,w:r.width}})()`);
const boardRect = () => ev(`(()=>{const L=__game.layout,c=document.getElementById('cv').getBoundingClientRect();const n=__game.state?__game.state.size:15;return {l:c.left+(L.ox-L.fr)/L.dpr,r:c.left+(L.ox+L.cs*n+L.fr)/L.dpr,t:c.top+(L.oy-L.fr)/L.dpr,b:c.top+(L.oy+L.cs*n+L.fr)/L.dpr}})()`);
const apart = (a, b) => a.r <= b.l + 1 || b.r <= a.l + 1 || a.b <= b.t + 1 || b.b <= a.t + 1;

// ===== 1. Desktop, chuột — chơi với máy (mặc định) =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE);
// Bản lưu cũ còn chế độ "2 người chung máy" (pvp) → phải chuyển sang chơi với máy, bỏ ván dở chung máy
await ev(`localStorage.setItem('${SAVE}', JSON.stringify({opts:{mode:'pvp',aiLevel:'easy',size:19,rule:'free'},game:{size:15,rule:'free',mode:'pvp',aiLevel:'hard',score:{1:2,2:1,draw:0},round:4,first:1,moves:[[7,7],[7,8]]}}))`);
await nav(BASE);
check('bản lưu cũ mode "pvp" → menu chuyển sang Chơi với máy, bỏ ván dở chung máy', await ev(`[...document.querySelectorAll('.seg button[aria-checked=true]')].map(b=>b.dataset.v).join()`) === 'ai,easy,19,free' && await visible('#optAi') && !(await ev(`!!document.getElementById('resumeGameBtn')`)), await text('#mResume'));
await ev('localStorage.clear()'); await nav(BASE);
check('menu hiện khi mở game, mặc định Chơi với máy (khó) · 15×15 · Tự do, không còn "2 người chung máy"', await visible('#ovMenu') && await ev(`[...document.querySelectorAll('.seg button[aria-checked=true]')].map(b=>b.dataset.v).join()`) === 'ai,hard,15,free' && await visible('#optAi') && await ev(`!document.querySelector('[data-v=pvp]')&&[...document.querySelectorAll('.seg[data-k=mode] button')].map(b=>b.dataset.v).join()==='ai,online'`) && !/chung máy/.test(await text('#ovMenu')));
await shot('caro-desktop-menu.png');
await pressSel('#startBtn');
let s = await S();
check('Bắt đầu → bàn 15×15 trống, X (Bạn) đi trước, khung X sáng "LƯỢT"', s && s.size === 15 && s.mode === 'ai' && s.moves === 0 && s.turn === 1 && (await text('#nX')) === 'Bạn' && await ev(`document.getElementById('plX').classList.contains('on')&&!document.getElementById('plO').classList.contains('on')`), JSON.stringify(s));
check('desktop chuột: không hiện nút Đặt (một lần nhấp là đặt)', await ev(`getComputedStyle(document.getElementById('placeBar')).display==='none'`));
await cell(7, 7); s = await S();
check('nhấp ô (7,7) → đặt X ngay (1 lần nhấp), máy đang nghĩ', s.moves === 1 && s.turn === 2 && s.thinking && await ev(`__game.state.board[7*15+7]===1`) && /Máy đang nghĩ/.test(await text('#hStatus')), await text('#hStatus'));
await waitAi(); s = await S();
check('máy trả lời, trả lượt cho bạn', s.moves === 2 && s.turn === 1);
await cell(7, 7); s = await S();
check('nhấp lại ô đã có quân → không đổi gì (báo đỏ)', s.moves === 2 && s.turn === 1);
await click(5, 5); await sleep(60); s = await S();
check('nhấp ra ngoài bàn → không đổi gì', s.moves === 2);
let fc = await free();
for (let i = 0; i < 6; i++) await click(...await pt(...fc)); await sleep(80); s = await S();
check('nhấp nhanh 6 lần vào 1 ô trống → chỉ đặt 1 quân', s.moves === 3);
await waitAi();
await key('KeyU'); s = await S();
check('phím U → đi lại cả nước của bạn và của máy', s.moves === 2 && s.turn === 1 && await ev(`__game.state.board[${fc[0]}*15+${fc[1]}]===0`));
await pressSel('#undoBtn'); s = await S();
check('nút Đi lại → về bàn trống, nút bị khoá', s.moves === 0 && s.turn === 1 && await ev(`document.getElementById('undoBtn').disabled`));
await ev(`document.getElementById('cv').focus()`);
await key('ArrowRight'); await key('Enter'); s = await S();
check('bàn phím: mũi tên + Enter đặt quân', s.moves === 1 && await ev('__game.state.board[7*15+8]===1'), JSON.stringify(await ev('__game.state.moves')));
await waitAi();
// X thắng theo đường chéo (X: (7,8),(8,9),(9,10),(10,11) + (11,12)); O rải rác — dựng sẵn bằng ván dở đã lưu
const xs = [[7, 8], [8, 9], [9, 10], [10, 11]], os = [[0, 0], [0, 2], [0, 4], [2, 0]];
await saveGame(interleave(xs, os)); await nav(BASE); await pressSel('#resumeGameBtn');
await shot('caro-desktop-choi.png');
s = await S();
check('4 quân X liền nhau chưa thắng, tới lượt bạn', s.winner === 0 && s.moves === 8 && s.turn === 1);
await cell(11, 12); s = await S();
check('X đủ 5 quân chéo → Bạn thắng, tỉ số 1–0, có đường thắng 5 ô', s.winner === 1 && s.line === 5 && s.score[1] === 1 && /thắng/.test(await text('#hStatus')), JSON.stringify(s));
const bc = await ev(`(()=>{const r=document.querySelector('#cv').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()`);
for (let i = 0; i < 30; i++) await click(bc[0] + Math.random() * bc[2], bc[1] + Math.random() * bc[3]);
s = await S(); check('spam 30 lần nhấp sau khi thắng → bàn khoá, không thêm quân', s.moves === 9);
await sleep(700); await shot('caro-desktop-duong-thang.png');
await sleep(800);
check('màn hình thắng hiện: "Bạn thắng!", tỉ số, nút Ván tiếp', await visible('#ovEnd') && /Bạn thắng/.test(await text('#eTitle')) && /chéo/.test(await text('#eSub')), await text('#eSub'));
await shot('caro-desktop-thang.png');
const snd = await ev('__game.sfx.loaded');
check('âm thanh: tải được và phát tiếng đặt quân + tiếng thắng', snd >= 5 && await ev(`(()=>{const n=__game.sfx.log.map(x=>x.n);return n.includes('buoc-nhay')&&n.includes('thang')})()`), snd + ' file');
await pressSel('#viewBtn');
check('"Xem bàn cờ" đóng bảng, nút công cụ thành "Ván tiếp"', !(await visible('#ovEnd')) && /Ván tiếp/.test(await text('#newBtn')));
await pressSel('#newBtn'); await waitAi(); s = await S();
check('Ván tiếp → ván 2, người thua (máy, O) đi trước và tự đánh, giữ tỉ số', s.round === 2 && s.moves === 1 && s.turn === 1 && s.first === 2 && s.score[1] === 1, JSON.stringify(s));
await key('KeyM');
check('phím M tắt tiếng (lưu chung wgp.muted)', await ev(`localStorage.getItem('wgp.muted')==='1'&&document.getElementById('muteBtn').getAttribute('aria-pressed')==='true'`));
await pressSel('#muteBtn');
check('nút âm thanh bật lại', await ev(`localStorage.getItem('wgp.muted')==='0'`));
// Tạm dừng
fc = await free(); await cell(...fc); await waitAi();
await key('Escape');
check('Esc → bảng Tạm dừng', await visible('#ovPause'));
fc = await free(); await click(...await pt(...fc)); s = await S();
check('đang tạm dừng: nhấp bàn không đặt quân', s.moves === 3);
await pressSel('#resumeBtn');
check('Chơi tiếp → đóng bảng', !(await visible('#ovPause')));
// Lưu ván, tải lại trang
await nav(BASE);
check('tải lại trang → menu có "Chơi tiếp ván dở" (ván 2, 3 nước, 1–0, với máy)', await visible('#resumeGameBtn') && /Ván 2.*3 nước.*1 – 0.*với máy/.test(await text('#mResume')), await text('#mResume'));
await pressSel('#resumeGameBtn'); s = await S();
check('chơi tiếp ván dở → đúng bàn, đúng lượt, đúng tỉ số', s.moves === 3 && s.round === 2 && s.turn === 1 && s.score[1] === 1 && s.mode === 'ai', JSON.stringify(s));
// Hòa: lấp kín bàn theo mẫu không có 5 liên tiếp — dựng sẵn 224 nước, nhấp nước cuối
{
  const n = 15, col = (r, c) => (Math.floor(((c + 2 * r) % 4) / 2) === 0 ? 1 : 2), a = [], b = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) (col(r, c) === 1 ? a : b).push([r, c]);
  const last = a.pop();
  await saveGame(interleave(a, b)); await nav(BASE); await pressSel('#resumeGameBtn');
  s = await S();
  check('dựng thế 224 nước, chưa ai thắng, tới lượt bạn', s.moves === 224 && s.winner === 0 && s.turn === 1, JSON.stringify(s));
  await cell(...last); s = await S();
  await sleep(1500);
  check('bàn kín không ai đủ 5 → "Hòa!", cộng 1 ván hòa', s.winner === 3 && await visible('#ovEnd') && /Hòa/.test(await text('#eTitle')) && /Hòa 1/.test(await text('#hDraw')), String(s.winner));
}
// Luật chặn 2 đầu
await saveGame([[3, 1], [3, 0], [3, 2], [3, 6], [3, 3], [10, 10], [3, 4], [10, 12]], { rule: 'block2' }); await nav(BASE); await pressSel('#resumeGameBtn');
await cell(3, 5); s = await S();
check('luật Chặn 2 đầu: 5 quân bị chặn 2 đầu → chưa thắng', s.rule === 'block2' && s.moves === 9 && s.winner === 0 && /chặn 2 đầu/.test(await text('#hRound')));
await waitAi();
await saveGame(interleave([[4, 4], [5, 5], [6, 6], [7, 7]], [[0, 14], [1, 14], [2, 14], [14, 0]]), { rule: 'block2' }); await nav(BASE); await pressSel('#resumeGameBtn');
await cell(8, 8); s = await S();
check('luật Chặn 2 đầu: 5 quân chéo thoáng → thắng', s.winner === 1, JSON.stringify(s));
await sleep(1500);

// ===== 2. Chơi với máy đến hết ván =====
await pressSel('#menuBtnE');
await choose('rule', 'free');
check('Chơi với máy → có lựa chọn Dễ/Khó', await visible('#optAi'));
await pressSel('#startBtn');
check('HUD: "Bạn" (X) vs "Máy (khó)" (O)', (await text('#nX')) === 'Bạn' && /Máy/.test(await text('#nO')));
await cell(7, 7); s = await S();
check('bạn đánh → máy "đang nghĩ", bàn khoá', s.thinking && s.turn === 2 && /Máy đang nghĩ/.test(await text('#hStatus')));
await cell(6, 6); s = await S();
check('nhấp trong lúc máy nghĩ → không đặt được', s.moves === 1);
await sleep(900); s = await S();
check('máy trả lời trong < 1 giây, trả lượt cho bạn', s.moves === 2 && s.turn === 1 && !s.thinking, JSON.stringify(s));
await pressSel('#undoBtn'); s = await S();
check('Đi lại khi chơi với máy → bỏ cả nước của bạn và của máy', s.moves === 0 && s.turn === 1);
// Chơi hết ván: "người" dùng máy dễ để chọn nước, bấm chuột thật
let guard = 0;
while (!(await S()).winner && guard++ < 120) {
  const mv = await ev(`import('./ai.js').then(A=>A.bestMove(__game.state,'easy'))`);
  await cell(mv[0], mv[1]);
  await waitAi();
}
s = await S();
check('đánh với máy đến hết ván → có kết quả, không lỗi', s.winner > 0, 'người thắng: ' + s.winner + ' sau ' + s.moves + ' nước');
await sleep(1500);
check('màn hình kết thúc hiện "Bạn thắng!" / "Máy thắng!"', await visible('#ovEnd') && /(Bạn|Máy) thắng|Hòa/.test(await text('#eTitle')), await text('#eTitle'));
await shot('caro-desktop-may.png');
await pressSel('#nextBtn'); await sleep(1100); s = await S();
check('ván tiếp với máy: nếu máy thua thì máy đi trước (tự đánh)', s.first === 2 ? s.moves === 1 : s.moves === 0, JSON.stringify(s));

// ===== 3. Đổi kích thước giữa ván =====
await pressSel('#menuBtn'); await pressSel('#menuBtnP');
await pressSel('#startBtn'); s = await S();
check('Trận mới từ menu → ván với máy, bàn trống', s.mode === 'ai' && s.moves === 0);
await cell(7, 7); await waitAi();
await view(390, 844, true, 3); await sleep(400);
fc = await free(); await cell(...fc); s = await S();
check('thu nhỏ về mobile dọc giữa ván → vẫn bấm trúng ô', s.moves === 3 && await ev(`__game.state.board[${fc[0]}*15+${fc[1]}]===1`));
check('mobile dọc: bàn nằm gọn trong khung, không cuộn trang', await boardInStage() && await noOverflow());
await waitAi();
await view(844, 390, true, 3); await sleep(400);
fc = await free(); await cell(...fc); s = await S();
check('xoay ngang → vẫn bấm trúng ô, bàn gọn trong màn', s.moves === 5 && await ev(`__game.state.board[${fc[0]}*15+${fc[1]}]===1`) && await boardInStage() && await noOverflow(), 'ô ' + (await csPx()).toFixed(1) + 'px');
await shot('caro-mobile-ngang.png');
await waitAi();
await view(1280, 720, false, 1); await sleep(400);
fc = await free(); await cell(...fc); s = await S();
check('về desktop 1280×720 → vẫn đúng ô, bàn gọn', s.moves === 7 && await ev(`__game.state.board[${fc[0]}*15+${fc[1]}]===1`) && await boardInStage(), 'ô ' + (await csPx()).toFixed(1) + 'px');
await waitAi();

// ===== 4. Mobile, chạm — chạm chọn ô, bấm nút Đặt =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE); await ev('localStorage.clear()'); await nav(BASE);
await shot('caro-mobile-menu.png');
check('mobile: menu không tràn, nút ≥ 44px', await noOverflow() && await ev(`[...document.querySelectorAll('#ovMenu .btn')].filter(b=>b.getClientRects().length).every(b=>b.offsetHeight>=44)`));
await pressSel('#startBtn');
check('mobile: chạm "Bắt đầu" → vào ván', !!(await S()), await ev(`JSON.stringify([innerHeight, document.getElementById('startBtn')?.getBoundingClientRect().y, document.getElementById('ovMenu').hidden])`));
await sleep(200);
const cs15 = await csPx();
check('mobile 15×15: ô ≥ 22px, bàn gọn trong màn', cs15 >= 22 && await boardInStage() && await noOverflow(), cs15.toFixed(1) + 'px/ô');
check('mobile: nút công cụ ≥ 44px, không đè bàn cờ', await ev(`(()=>{const bs=[...document.querySelectorAll('.tools .btn')].filter(b=>b.getClientRects().length);const st=document.getElementById('stage').getBoundingClientRect();return bs.every(b=>{const r=b.getBoundingClientRect();return r.height>=44&&r.top>=st.bottom-1&&r.bottom<=innerHeight})})()`));
{
  const pb = await rectOf('#placeBtn'), st = await rectOf('#stage'), bd = await boardRect();
  check('mobile: nút "Đặt quân" hiện dưới bàn, cao ≥ 44px, không đè bàn, trong màn hình, đang khoá (chưa chọn ô)', pb.h >= 44 && pb.t >= st.b - 1 && apart(pb, bd) && pb.b <= await ev('innerHeight') && pb.l >= 0 && pb.r <= await ev('innerWidth') && await ev(`document.getElementById('placeBtn').disabled`), JSON.stringify(pb));
}
await cell(7, 7); s = await S();
check('chạm 1 ô → chỉ chọn ô (quân mờ + gợi ý), chưa đặt; nút Đặt bấm được', s.moves === 0 && s.pending && s.pending[0] === 7 && await visible('#tip') && !(await ev(`document.getElementById('placeBtn').disabled`)));
await cell(6, 6); s = await S();
check('chạm sang ô khác → đổi ô chọn, vẫn chưa đặt', s.moves === 0 && s.pending[0] === 6 && s.pending[1] === 6);
await cell(6, 6); s = await S();
check('chạm lại đúng ô đang chọn → vẫn chưa đặt (chỉ nút Đặt mới đặt)', s.moves === 0 && s.pending && s.pending[0] === 6);
await shot('caro-mobile-chon-o.png');
await pressSel('#placeBtn'); s = await S();
check('bấm "Đặt quân" → đặt X vào ô đã chọn, máy nghĩ, nút Đặt khoá', s.moves === 1 && await ev('__game.state.board[6*15+6]===1') && !s.pending && !(await visible('#tip')) && await ev(`document.getElementById('placeBtn').disabled`));
await cell(8, 8); s = await S();
check('chạm trong lúc máy nghĩ → không chọn được ô', s.thinking ? !s.pending : true);
await waitAi(); s = await S();
check('máy trả lời → tới lượt bạn, nút Đặt vẫn khoá tới khi chọn ô', s.moves === 2 && s.turn === 1 && await ev(`document.getElementById('placeBtn').disabled`));
fc = await free();
for (let i = 0; i < 8; i++) await tap(...await pt(...fc)); await sleep(80); s = await S();
check('chạm nhanh 8 lần 1 ô → chỉ chọn, không tự đặt', s.moves === 2 && s.pending && s.pending[0] === fc[0] && s.pending[1] === fc[1]);
{ const p = await at('#placeBtn'); for (let i = 0; i < 5; i++) await tap(...p); }
await sleep(80); s = await S();
check('bấm nhanh 5 lần nút Đặt → đúng 1 quân', s.moves === 3);
await waitAi();
// Chơi tới hết ván bằng chạm + nút Đặt
guard = 0;
while (!(await S()).winner && guard++ < 120) {
  const mv = await ev(`import('./ai.js').then(A=>A.bestMove(__game.state,'easy'))`);
  await put(mv[0], mv[1]);
  await waitAi();
}
await shot('caro-mobile-choi.png');
s = await S();
check('mobile: đánh với máy bằng chạm + Đặt đến hết ván → có kết quả', s.winner > 0, 'người thắng: ' + s.winner + ' sau ' + s.moves + ' nước');
await sleep(1500);
check('mobile: bảng kết quả gọn trong màn', await visible('#ovEnd') && /(Bạn|Máy) thắng|Hòa/.test(await text('#eTitle')) && await noOverflow());
await shot('caro-mobile-thang.png');
await pressSel('#menuBtnE'); await choose('size', '19'); await pressSel('#startBtn'); await sleep(200);
const cs19 = await csPx();
check('mobile 19×19: bàn gọn, chạm + Đặt vẫn đặt đúng ô', await boardInStage() && (await put(18, 18), (await S()).moves >= 1 && await ev('__game.state.board[18*19+18]===1')), cs19.toFixed(1) + 'px/ô');
await waitAi();
await cell(0, 0);
await shot('caro-mobile-19.png');
await view(844, 390, true, 3); await sleep(400);
{
  const pb = await rectOf('#placeBtn'), bd = await boardRect();
  check('điện thoại ngang: nút Đặt bên phải bàn, ≥ 44px, không đè bàn, không tràn', pb.h >= 44 && apart(pb, bd) && pb.r <= await ev('innerWidth') && await boardInStage() && await noOverflow(), JSON.stringify(pb));
}
await shot('caro-mobile-ngang-dat.png');
await view(360, 740, true, 3); await sleep(300);
{
  const pb = await rectOf('#placeBtn'), bd = await boardRect();
  check('mobile 360×740: không tràn, bàn gọn, nút Đặt không đè bàn', await noOverflow() && await boardInStage() && pb.h >= 44 && apart(pb, bd), (await csPx()).toFixed(1) + 'px/ô');
}

check('không có lỗi JS / console', errors.length === 0, errors.join(' | '));
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + '\n');
console.log(R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
ws.close(); chrome.kill();
process.exit(0);
