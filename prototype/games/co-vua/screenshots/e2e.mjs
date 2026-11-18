// E2E Cờ Vua trên Chrome headless — bấm chuột / chạm thật qua CDP, chụp ảnh desktop + mobile, thử online với 1 người chơi giả qua WebSocket.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   node prototype/games/co-vua/screenshots/e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || '.', HOST = '127.0.0.1:' + (process.env.PORT || 8768), BASE = 'http://' + HOST + '/games/co-vua/';
mkdirSync(OUT, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9350', '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:9350/json')).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
  if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true });
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(600); for (let i = 0; i < 50 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(200); await sleep(400); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = on => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async name => { await sleep(250); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(200); };
const visible = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const choose = async (k, v) => { await pressSel(`.seg[data-k="${k}"] button[data-v="${v}"]`); };
const SQ = n => (8 - +n[1]) * 8 + 'abcdefgh'.indexOf(n[0]);
const sqPt = async n => ev(`(()=>{const p=__game.squarePoint(${SQ(n)});return [p.x,p.y]})()`);
const mv = async (a, b) => { await press(...await sqPt(a)); await sleep(80); await press(...await sqPt(b)); await sleep(120); };
const S = () => ev('(()=>{const g=__game.state;return g&&{turn:g.turn,n:g.moves.length,res:g.result,score:g.score,round:g.round,white:g.white,mode:g.mode,last:g.moves.length?g.moves[g.moves.length-1].san:null}})()');
const noOverflow = () => ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth && document.documentElement.scrollHeight<=document.documentElement.clientHeight+1');
const boardIn = () => ev(`(()=>{const L=__game.layout,c=document.getElementById('cv').getBoundingClientRect();const x0=c.left+(L.ox-L.pad)/L.dpr,x1=c.left+(L.ox+L.cs*8+L.pad)/L.dpr,y0=c.top+(L.oy-L.pad)/L.dpr,y1=c.top+(L.oy+L.cs*8+L.pad)/L.dpr;return x0>=c.left-1&&y0>=c.top-1&&x1<=c.right+1&&y1<=c.bottom+1&&y1<=innerHeight})()`);
const waitFor = async (expr, ms = 4000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr).catch(() => false)) return true; await sleep(100); } return false; };

// ===== 1. Desktop, chuột — 2 người chung máy =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE); await ev('localStorage.clear();sessionStorage.clear()'); await nav(BASE);
check('menu hiện, mặc định 2 người chung máy', await visible('#ovMenu') && await ev(`document.querySelector('.seg[data-k=mode] [aria-checked=true]').dataset.v`) === 'pvp' && !(await visible('#optAi')));
await shot('covua-desktop-menu.png');
await pressSel('#startBtn');
let s = await S();
check('Bắt đầu → thế xuất phát, Trắng đi trước, khung người 1 sáng LƯỢT', s && s.n === 0 && s.turn === 'w' && await ev(`document.getElementById('plA').classList.contains('on')`));
check('bàn cờ nằm gọn trong khung, không tràn trang', await boardIn() && await noOverflow());
await press(...await sqPt('e2')); await sleep(100);
check('bấm Tốt e2 → chọn, có 2 ô đi được (e3, e4)', await ev('__game.selected') === SQ('e2') && await ev('__game.targets.length') === 2);
await press(...await sqPt('e4')); await sleep(100); s = await S();
check('bấm e4 → đi e4, tới lượt Đen', s.n === 1 && s.turn === 'b' && s.last === 'e4');
await mv('e7', 'e5'); await mv('d1', 'h5'); await mv('b8', 'c6');
await press(...await sqPt('a1')); await sleep(80); s = await S();
check('bấm quân không đi được (Xe a1) → không chọn', await ev('__game.selected') === -1 && s.n === 4);
await mv('f1', 'c4');
await press(...await sqPt('e8')); await sleep(80); await press(...await sqPt('e6')); await sleep(80); s = await S();
check('bấm ô đi sai luật (Vua e8→e6) → không đi', s.n === 5 && s.turn === 'b');
await mv('g8', 'f6');
await shot('covua-desktop-choi.png');
await mv('h5', 'f7'); s = await S();
check('chiếu bí "Scholar\'s mate" → Trắng thắng, lí do chiếu bí, tỉ số 1-0', s.res && s.res.winner === 'w' && s.res.reason === 'mate' && s.score[0] === 1 && s.last === 'Qxf7#', JSON.stringify(s));
check('màn kết thúc hiện "Trắng thắng!" + lí do', await waitFor(`!document.getElementById('ovEnd').hidden`) && /Trắng thắng/.test(await text('#eTitle')) && /chiếu bí/.test(await text('#eSub')), await text('#eSub'));
await shot('covua-desktop-ket-thuc.png');
await pressSel('#nextBtn'); s = await S();
check('Ván tiếp → ván 2, người 1 đổi sang Đen (Trắng thuộc người 2)', s.round === 2 && s.white === 1 && s.n === 0);

// Phong cấp + đi lại (2 người chung máy) — dựng thế qua __game không được, nên đi thật bằng chuỗi nước ngắn
await pressSel('#menuBtn'); await pressSel('#menuBtnP');
await pressSel('#startBtn'); // trận mới từ menu (ván dở rỗng)
for (const [a, b] of [['h2', 'h4'], ['g7', 'g5'], ['h4', 'g5'], ['g8', 'f6'], ['g5', 'g6'], ['f8', 'g7'], ['g6', 'h7'], ['f6', 'g8']]) await mv(a, b);
s = await S();
check('đi tới thế Tốt h7 sắp phong cấp', s.n === 8 && await ev(`__game.state.board[${SQ('h7')}]==='P'`), JSON.stringify(s));
await press(...await sqPt('h7')); await sleep(80); await press(...await sqPt('g8')); await sleep(150);
check('Tốt h7 ăn g8 → hiện bảng chọn phong cấp 4 quân', await ev('__game.promoOpen') && await ev(`document.querySelectorAll('#promoBox button').length`) === 4);
await shot('covua-desktop-phong-cap.png');
await pressSel('#promoBox button[data-p="n"]'); s = await S();
check('chọn Mã → phong thành Mã, chiếu Vua f8? (SAN có =N)', /=N/.test(s.last) && await ev(`__game.state.board[${SQ('g8')}]==='N'`), s.last);
await pressSel('#undoBtn'); s = await S();
check('Đi lại → Tốt về h7', s.n === 8 && await ev(`__game.state.board[${SQ('h7')}]==='P'`));
await ev('location.reload()'); await sleep(1200); await waitFor('typeof __game==="object"');
check('tải lại trang → có "Chơi tiếp ván dở"', await visible('#resumeGameBtn'));
await pressSel('#resumeGameBtn'); s = await S();
check('chơi tiếp → khôi phục đúng 8 nước', s && s.n === 8);

// ===== 2. Chơi với máy (dễ) =====
await pressSel('#menuBtn'); await pressSel('#menuBtnP');
await choose('mode', 'ai'); await choose('aiLevel', 'easy');
await pressSel('#startBtn'); s = await S();
check('chơi với máy: bạn cầm Trắng ván 1', s.mode === 'ai' && s.white === 0 && s.turn === 'w');
await mv('d2', 'd4');
check('máy trả lời trong ~1 giây', await waitFor('__game.state.moves.length===2', 3000));
await mv('c1', 'f4'); await waitFor('__game.state.moves.length===4', 3000);
await pressSel('#undoBtn'); s = await S();
check('Đi lại khi chơi với máy → lùi 2 nước (cả nước máy)', s.n === 2 && s.turn === 'w');
await pressSel('#resignBtn'); s = await S();
check('Xin thua → máy thắng', s.res && s.res.reason === 'resign' && s.res.winner === 'b' && s.score[1] === 1);
await waitFor(`!document.getElementById('ovEnd').hidden`);
await pressSel('#nextBtn'); await sleep(200);
check('ván 2 bạn cầm Đen: bàn lật (Đen ở dưới), máy đi trước', await ev('__game.flipped') && await waitFor('__game.state.moves.length===1', 3000));
await shot('covua-desktop-voi-may-den.png');

// ===== 3. Mobile, chạm =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE); await ev('localStorage.clear()'); await nav(BASE);
await shot('covua-mobile-menu.png');
check('mobile: menu không tràn ngang', await noOverflow());
await pressSel('#startBtn');
check('mobile: bàn cờ vừa khung, không tràn', await boardIn() && await noOverflow());
check('mobile: ô cờ đủ to để chạm (≥ 40px)', await ev('__game.layout.cs/__game.layout.dpr') >= 40, String(await ev('__game.layout.cs/__game.layout.dpr')));
await mv('e2', 'e4'); await mv('d7', 'd5'); await mv('e4', 'd5'); s = await S();
check('mobile: chạm chọn + chạm đích → đi được, ăn quân (exd5)', s.n === 3 && s.last === 'exd5', s.last);
await press(...await sqPt('d8')); await sleep(120);
await shot('covua-mobile-choi.png');
const toolsOk = await ev(`[...document.querySelectorAll('.tools .btn')].filter(b=>b.offsetParent).every(b=>{const r=b.getBoundingClientRect();return r.right<=innerWidth&&r.bottom<=innerHeight&&r.height>=40})`);
check('mobile: hàng nút nằm gọn trong màn hình, cao ≥ 40px', toolsOk);

// ===== 4. Online: trình duyệt tạo phòng, 1 người chơi giả vào qua WebSocket =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE); await ev('localStorage.clear();sessionStorage.clear()'); await nav(BASE);
await choose('mode', 'online');
await ev(`document.getElementById('nameIn').value='Tí'`);
await pressSel('#createBtn');
check('tạo phòng → phòng chờ có mã 5 ký tự', await waitFor(`!document.getElementById('ovRoom').hidden`) && /^[A-Z0-9]{5}$/.test(await text('#rCode')));
const code = await text('#rCode');
const bot = new WebSocket('ws://' + HOST + '/ws/co-vua'); let bv = null; const berr = [];
bot.onmessage = e => { const m = JSON.parse(e.data); if (m.t === 'state') bv = m.v; if (m.t === 'err') berr.push(m.code); };
await new Promise(r => bot.onopen = r);
bot.send(JSON.stringify({ t: 'join', code, name: 'Bé Na' }));
check('người chơi 2 vào → nút Bắt đầu bật', await waitFor(`!document.getElementById('rStart').disabled`));
await shot('covua-online-phong-cho.png');
await pressSel('#rStart');
check('bắt đầu → vào ván, Tí cầm Trắng, có ô chat', await waitFor(`__game.state&&__game.myColor==='w'&&!document.getElementById('chat').hidden`));
await mv('e2', 'e4');
await sleep(300);
check('máy chủ nhận nước e4 của Tí', bv && bv.game.moves.length === 1);
bot.send(JSON.stringify({ t: 'move', from: SQ('e2'), to: SQ('e4') })); await sleep(300);
check('người chơi 2 đi sai luật (Đen đi Tốt trắng) → máy chủ từ chối', berr.includes('illegal') && bv.game.moves.length === 1, berr.join());
bot.send(JSON.stringify({ t: 'move', from: SQ('c7'), to: SQ('c5') }));
check('nước c5 của người 2 hiện trên trình duyệt', await waitFor('__game.state.moves.length===2'));
bot.send(JSON.stringify({ t: 'chat', text: 'Chào Tí, chơi vui nhé!' }));
check('tin chat của đối thủ hiện trong ô chat', await waitFor(`/chơi vui/.test(document.getElementById('chatLog').textContent)`));
await ev(`document.getElementById('chatIn').value='Chào Bé Na!'`); await pressSel('#chatF button');
await sleep(300);
check('Tí gửi chat → máy chủ nhận', bv.chat.some(c => /Bé Na!/.test(c.text)));
bot.send(JSON.stringify({ t: 'draw' }));
check('đối thủ mời hòa → hiện thanh "mời hòa"', await waitFor(`!document.getElementById('askDraw').hidden`));
await shot('covua-online-choi.png');
await pressSel('#askNo'); await sleep(300);
check('bấm Đánh tiếp → từ chối hòa', bv.drawOffer === -1 && !(await visible('#askDraw')));
await mv('g1', 'f3'); await sleep(200);
await pressSel('#resignBtn');
check('Xin thua online → ván kết thúc, đối thủ thắng', await waitFor(`__game.state.result&&__game.state.result.reason==='resign'`) && await waitFor(`!document.getElementById('ovEnd').hidden`, 3000) && /thua/.test(await text('#eTitle')), await text('#eTitle'));
await shot('covua-online-ket-thuc.png');
bot.send(JSON.stringify({ t: 'again' }));
check('ván tiếp online → Tí đổi sang Đen, bàn lật', await waitFor(`__game.state&&!__game.state.result&&__game.myColor==='b'&&__game.flipped`));
// mobile online
await view(390, 844, true, 3); await touch(true); press = tap; await sleep(500);
bot.send(JSON.stringify({ t: 'move', from: SQ('d2'), to: SQ('d4') }));
await waitFor('__game.state.moves.length===1');
check('mobile online: không tràn, có nút Chat', await noOverflow() && await visible('#chatBtn') && await boardIn());
await shot('covua-mobile-online.png');
await pressSel('#chatBtn'); await shot('covua-mobile-chat.png');
check('mobile: mở bảng chat', await ev(`document.body.classList.contains('chat-open')`));
bot.close();

check('không có lỗi JS trên trang', errors.filter(e => !/favicon|ERR_CONNECTION|WebSocket/.test(e)).length === 0, errors.join(' | '));
writeFileSync(OUT + '/e2e-result.txt', R.join('\n') + '\n');
console.log(R.filter(r => r.startsWith('FAIL')).length ? 'CÓ LỖI' : 'TẤT CẢ ĐẠT', R.length);
chrome.kill(); process.exit(0);
