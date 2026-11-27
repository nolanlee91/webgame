// E2E Ô Ăn Quan trên Chrome headless — bấm chuột / chạm thật qua CDP, chụp ảnh desktop + điện thoại, thêm một trận online ngắn.
// Chạy: (ở gốc repo) PORT=8771 node server.js   rồi   node prototype/games/o-an-quan/screenshots/e2e.mjs <thư mục output>
// Kết quả ghi vào <output>/e2e-ket-qua.txt; ảnh chụp ghi vào <output>/*.png.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('o-an-quan'), PORT = process.env.PORT || 8771, BASE = 'http://127.0.0.1:' + PORT + '/games/o-an-quan/';
mkdirSync(OUT, { recursive: true });
const CDP = process.env.CDP_PORT || 9353;
const PROF = tempProfile('o-an-quan'); // %TEMP%/lk-e2e-o-an-quan-*, tự xoá khi thoát (kể cả Ctrl+C / bị giết cứng)
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + CDP, '--user-data-dir=' + PROF, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:' + CDP + '/json')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr.slice(0, 200) + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const nav = async (u) => { await send('Page.navigate', { url: u }); await sleep(500); for (let i = 0; i < 50 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(150); await sleep(250); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = (on) => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const KEYS = { KeyU: ['u', 85], KeyN: ['n', 78], KeyM: ['m', 77], KeyS: ['s', 83], Escape: ['Escape', 27], Enter: ['Enter', 13], ArrowRight: ['ArrowRight', 39], ArrowLeft: ['ArrowLeft', 37], ArrowDown: ['ArrowDown', 40], ArrowUp: ['ArrowUp', 38] };
const key = async (code) => { const [k, vk] = KEYS[code]; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined }); await sleep(40); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let press = click;
const at = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async (sel) => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(150); };
const visible = (sel) => ev(`!document.querySelector(${JSON.stringify(sel)}).hidden`);
const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const S = () => ev(`(()=>{const g=__game.state;return g&&{pits:g.pits,turn:g.turn,ply:g.ply,moves:g.moves.length,winner:g.winner,score:g.score,round:g.round,quanNon:g.quanNon,aiLevel:g.aiLevel,busy:__game.busy,thinking:__game.thinking,canAct:__game.canAct,sel:__game.board.selected}})()`);
const pitXY = (p) => ev(`(()=>{const q=__game.pitPoint(${p});return [q.x,q.y]})()`);
const arrowXY = (d) => ev(`(()=>{const q=__game.arrowPoint(${d});return q&&[q.x,q.y]})()`);
// điểm (x,y) có đúng là canvas bàn (không bị nút / lớp phủ nào che)?
const onCanvas = (x, y) => ev(`document.elementFromPoint(${x},${y})?.id==='cv'`);
const noOverflow = () => ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth && document.documentElement.scrollHeight<=document.documentElement.clientHeight+1');
const boardIn = () => ev(`(()=>{const b=__game.board.boardRect(),c=document.getElementById('cv').getBoundingClientRect();return b.l>=c.left-1&&b.t>=c.top-1&&b.r<=c.right+1&&b.b<=c.bottom+1&&b.b<=innerHeight})()`);
const entryFits = () => ev(`(()=>{const ov=document.getElementById('ovMenu'),o=ov.getBoundingClientRect();return ov.scrollTop===0&&['createBtn','joinBtn','soloBtn'].every(i=>{const r=document.getElementById(i).getBoundingClientRect();return r.height>=44&&r.top>=o.top&&r.bottom<=o.bottom})})()`);
const waitIdle = async (ms = 20000) => { const t0 = Date.now(); for (;;) { const s = await S(); if (!s || s.winner !== null || (s.canAct)) return s; if (Date.now() - t0 > ms) return s; await sleep(80); } };
const toSolo = async () => { if (await ev(`!document.getElementById('vEntry').hidden`)) await pressSel('#soloBtn'); };
const soloOpts = () => ev(`[...document.querySelectorAll('#vSolo .seg button[aria-checked=true]')].map(b=>b.dataset.v).join()`);

// Đi một nước bằng thao tác thật: bấm ô rồi bấm mũi tên; kiểm cả hai điểm bấm không bị che.
let covered = 0;
async function humanMove(pick = 'random') {
  const s = await S();
  const legal = await ev('__game.legal()');
  const m = pick === 'first' ? legal[0] : legal[Math.floor(Math.random() * legal.length)];
  const p = await pitXY(m[0]);
  if (!(await onCanvas(...p))) covered++;
  await press(...p); await sleep(80);
  const a = await arrowXY(m[1]);
  if (!a || !(await onCanvas(...a))) covered++;
  if (a) { await press(...a); await sleep(80); }
  return { m, before: s };
}
async function playToEnd(maxMoves, opts = {}) {
  let n = 0, skips = 0;
  for (; n < maxMoves; n++) {
    const s = await waitIdle();
    if (!s || s.winner !== null) break;
    if (!s.canAct) break;
    await humanMove();
    if (opts.skipEvery && n % opts.skipEvery === 1 && await visible('#anim')) { await pressSel('#skipBtn'); skips++; }
    else if (opts.fast && await visible('#anim')) await pressSel('#fastBtn');
  }
  for (let i = 0; i < 300 && ((await S())?.winner === null || (await S())?.busy); i++) await sleep(100);
  for (let i = 0; i < 40 && !(await visible('#ovEnd')); i++) await sleep(100);
  return { n, skips };
}

// ===== 1. Desktop 1366×768, chuột — màn vào game =====
await view(1366, 768, false, 1); await touch(false); press = click;
await nav(BASE);
await ev('localStorage.clear()'); await nav(BASE);
check('màn vào game chuẩn: tên · Tạo phòng online · Phòng kín · mã phòng + Vào phòng · Chơi với máy; "Cách chơi" gập', await visible('#ovMenu') && await visible('#vEntry') && !(await visible('#vSolo')) && await ev(`!document.querySelector('details.how').open && !!document.getElementById('privateRoom')`) && await entryFits() && await noOverflow());
check('chưa có ván dở → không có nút "Chơi tiếp"', !(await visible('#resumeGameBtn')));
await shot('desktop-menu.png');
await pressSel('#soloBtn');
check('"Chơi với máy" → bước tuỳ chọn Máy (Dễ/Vừa/Khó) + Luật, mặc định Vừa · Thường', await visible('#vSolo') && await soloOpts() === 'medium,thuong' && await ev(`document.querySelectorAll('#vSolo [data-k=aiLevel] button').length===3`));
await key('Escape');
check('Esc → quay lại màn đầu', await visible('#vEntry'));
// D12: ô tên giờ điền sẵn tên khách (_shared/online-kit.js sharedName) ⇒ bấm "Tạo phòng online" ngay là vào bước tạo phòng.
// Kiểm "báo nhập tên" bằng cách xoá trắng ô tên trước (người chơi tự xoá tên rồi bấm).
check('ô tên điền sẵn tên khách', (await ev(`document.getElementById('nameIn').value.trim().length`)) > 0);
await pressSel('#createBtn');
check('tên khách điền sẵn → "Tạo phòng online" vào thẳng bước tạo phòng', await visible('#vCreate'));
await key('Escape');
check('Esc ở bước tạo phòng → quay lại màn đầu', await visible('#vEntry'));
await ev(`(()=>{const i=document.getElementById('nameIn');i.value='';i.dispatchEvent(new Event('input',{bubbles:true}))})()`);
await pressSel('#createBtn');
check('"Tạo phòng online" khi ô tên trống → báo nhập tên', /Nhập tên/.test(await text('#mErr')) && await visible('#vEntry'));
await ev(`document.getElementById('nameIn').value='Tí Sỏi'`);
await pressSel('#createBtn');
check('nhập tên → bước tạo phòng: Chế độ 1v1/2v2 + Luật Thường/Quan non', await visible('#vCreate') && await ev(`document.querySelectorAll('#vCreate [data-k=size] button').length===2 && document.querySelectorAll('#vCreate [data-k=rule] button').length===2`));
await pressSel('#createBack');

// ===== 2. Chơi với máy (Vừa) bằng chuột =====
await pressSel('#soloBtn'); await pressSel('#startBtn');
let s = await S();
check('Bắt đầu → bàn 2×5 ô, mỗi ô 5 dân, 2 quan, bạn (đội A) đi trước, khung A sáng "LƯỢT"', s && s.pits.join() === '0,5,5,5,5,5,0,5,5,5,5,5' && s.turn === 0 && s.canAct && await ev(`document.getElementById('plA').classList.contains('on')`), JSON.stringify(s?.pits));
const info = await ev('__game.board.info');
check('desktop: bàn nằm ngang, phóng bội 0,5 (ảnh pixel sắc)', !info.rot && (info.k * 2) % 1 === 0 && !info.smooth, JSON.stringify(info));
check('bàn gọn trong khung, trang không tràn', await boardIn() && await noOverflow());
check('ô dân + mũi tên không bị nút / lớp phủ che (elementFromPoint)', await (async () => { for (const p of [1, 2, 3, 4, 5, 7, 11]) if (!(await onCanvas(...await pitXY(p)))) return false; return true; })());
await press(...await pitXY(7)); await sleep(80);
check('bấm ô bên đối thủ → không chọn được', (await S()).sel === null);
await press(...await pitXY(3)); await sleep(80);
check('bấm ô 3 bên mình → chọn ô, hiện 2 mũi tên vàng + gợi ý', (await S()).sel === 3 && !!(await arrowXY(1)) && await visible('#tip'));
await shot('desktop-chon-huong.png');
for (const d of [-1, 1]) { const a = await arrowXY(d); check(`mũi tên ${d > 0 ? 'phải' : 'trái'} không bị che`, await onCanvas(...a)); }
await press(...await arrowXY(1)); await sleep(700);
s = await S();
check('bấm mũi tên phải → rải sỏi từng viên (đang hoạt cảnh, hiện nút Tua / Bỏ qua)', s.busy && s.moves === 1 && await visible('#anim'));
await shot('desktop-dang-rai.png');
for (let i = 0; i < 12; i++) await click(...await pitXY(4));
check('bấm loạn lúc đang rải → không đi thêm nước', (await S()).moves === 1);
await pressSel('#skipBtn');
s = await S();
check('"Bỏ qua" → hoạt cảnh xong ngay, bàn khớp trạng thái thật', !s.busy && await ev('JSON.stringify(__game.board.display.pits)===JSON.stringify(__game.state.pits) && JSON.stringify(__game.board.display.score)===JSON.stringify(__game.state.score)'));
check('ô 3 sang phải: rải tiếp ô 9 rồi ăn ô 4 → +6 điểm', s.score[0] === 6, JSON.stringify(s.score));
s = await waitIdle();
check('máy (Vừa) đi xong → trả lượt cho bạn', s.canAct && s.moves === 2 && s.turn === 0);
await ev(`document.getElementById('cv').focus()`);
await key('ArrowRight'); await key('Enter');
const selK = (await S()).sel;
check('bàn phím: mũi tên chọn ô, Enter → hiện mũi tên hướng', selK !== null);
await key('ArrowLeft'); await sleep(200);
check('bàn phím: mũi tên ← khi đã chọn → rải sang trái', (await S()).moves === 3);
await key('KeyS'); await waitIdle();
await key('KeyU'); s = await S();
check('phím U → đi lại (bỏ nước của bạn + nước máy)', s.moves === 2 && s.turn === 0, 'moves ' + s.moves);
await sleep(400);
check('nhạc ván bật sau lần chạm đầu, không còn nền sân (amb-yard)', await ev(`(()=>{const l=__game.sfx.loops;return l['music-game']===true&&!('amb-yard' in l)})()`), JSON.stringify(await ev('__game.sfx.loops')));
await key('KeyM'); await sleep(100);
check('phím M tắt tất cả (lưu chung wgp.muted), nền lặp dừng', await ev(`localStorage.getItem('wgp.muted')==='1'&&document.getElementById('muteBtn').getAttribute('aria-pressed')==='true'&&!Object.values(__game.sfx.loops).some(Boolean)`));
await pressSel('#muteBtn'); await sleep(300);
check('nút âm thanh bật lại, nền lặp chạy lại', await ev(`localStorage.getItem('wgp.muted')==='0'&&__game.sfx.loops['music-game']===true`));
// lưu ván dở → tải lại → "Chơi tiếp"
await nav(BASE);
check('tải lại trang → màn đầu có "▶ Chơi tiếp" (ván 1, 2 nước, máy Vừa)', await visible('#resumeGameBtn') && /Ván 1.*2 nước.*Vừa/.test(await text('#mResume')), await text('#mResume'));
await pressSel('#resumeGameBtn'); s = await S();
check('Chơi tiếp → đúng bàn, đúng điểm, đúng lượt', s.moves === 2 && s.turn === 0 && s.aiLevel === 'medium');
// chơi hết ván bằng chuột (thỉnh thoảng bấm Bỏ qua / Tua)
covered = 0;
let r = await playToEnd(200, { skipEvery: 3 });
s = await S();
check('desktop: đánh với máy bằng chuột tới hết ván → có kết quả, tổng điểm 70', s.winner !== null && s.score[0] + s.score[1] === 70, 'người thắng ' + s.winner + ' sau ' + s.moves + ' nước, điểm ' + s.score.join('–'));
check('desktop: suốt ván, mọi điểm bấm (ô + mũi tên) đều trúng bàn, không bị che', covered === 0, 'bị che ' + covered);
check('bảng kết quả: tiêu đề, điểm hai đội, tỉ số các ván, nút Ván tiếp', await visible('#ovEnd') && /thắng|thua|Hòa/.test(await text('#eTitle')) && await ev(`document.querySelectorAll('#eResult b').length===2`) && /Tỉ số các ván/.test(await text('#eTally')));
await shot('desktop-ket-qua.png');
const snd = await ev('__game.sfx.loaded');
check('âm thanh Codex (AUDIO.md): nạp đủ 17 hiệu ứng mp3 (14 + chat, pause, invalid của Codex 11/2026); pebble-1..4 xoay vòng khi rải, bốc, ăn, chọn, tới lượt, kết ván', snd === 17 && await ev(`(()=>{const n=__game.sfx.log.map(x=>x.n);return ['pebble-1','pebble-2','pebble-3','pebble-4','pick-up','capture','select','turn'].every(k=>n.includes(k))&&(n.includes('win')||n.includes('lose')||n.includes('draw'))})()`), snd + ' file · ' + [...new Set(await ev('__game.sfx.log.map(x=>x.n)'))].join(','));
check('dùng ảnh thật của Codex (sân, bàn, sỏi, quan, tay)', (await ev('__game.assets.loaded.join()')) === 'yard,board,stones,quan,hand');
await pressSel('#viewBtn');
check('"Xem bàn" đóng bảng, nút công cụ thành "Ván tiếp"', !(await visible('#ovEnd')) && /Ván tiếp/.test(await text('#newBtn')));
await shot('desktop-xem-ban.png');
const before = await S();
await pressSel('#newBtn'); s = await S();
check('Ván tiếp → ván 2, đội thua đi trước, giữ tỉ số', s.round === 2 && s.pits.join() === '0,5,5,5,5,5,0,5,5,5,5,5' || (s.round === 2 && s.moves <= 1), JSON.stringify({ w: before.winner, turn: s.turn }));
check('ván xong thì không còn ván dở trong bản lưu cũ (bản lưu chỉ còn ván mới)', await ev(`(()=>{const v=JSON.parse(localStorage.getItem('wgp.o-an-quan.v1'));return v.v===1})()`));

// ===== 3. Bản lưu: migration an toàn =====
await ev(`localStorage.setItem('wgp.o-an-quan.v1', JSON.stringify({opts:{aiLevel:'hard',rule:'quan-non'},game:{moves:[[3,1]]}}))`); await nav(BASE);
check('bản lưu thiếu phiên bản → giữ tuỳ chọn (Khó · Quan non), bỏ ván dở, không lỗi', !(await visible('#resumeGameBtn')) && await (async () => { await toSolo(); return (await soloOpts()) === 'hard,quan-non'; })());
await ev(`localStorage.setItem('wgp.o-an-quan.v1', JSON.stringify({v:1,opts:{aiLevel:'easy',rule:'thuong'},game:{aiLevel:'easy',quanNon:false,first:0,round:1,moves:[[7,1],[3,1]]}}))`); await nav(BASE);
check('bản lưu có nước sai luật → bỏ ván dở', !(await visible('#resumeGameBtn')));
await ev(`localStorage.setItem('wgp.o-an-quan.v1', '{hỏng')`); await nav(BASE);
check('bản lưu hỏng JSON → về mặc định, vẫn chơi được', await visible('#vEntry') && !(await visible('#resumeGameBtn')));
await nav(BASE + '?room=K7M2Q');
check('link mời ?room=K7M2Q → điền sẵn mã + nhắc', (await ev(`document.getElementById('codeIn').value`)) === 'K7M2Q' && /K7M2Q/.test(await text('#mNote')));

// ===== 4. Laptop phóng 125% (dpr 1,25) =====
await view(1366, 768, false, 1.25); await nav(BASE); await toSolo(); await pressSel('#startBtn');
const i125 = await ev('__game.board.info');
check('1366×768 dpr 1,25: hệ số phóng thiết bị là bội 0,5 → ảnh pixel nét', (i125.k * 2) % 1 === 0 && !i125.smooth && await boardIn(), JSON.stringify(i125));
await shot('desktop-dpr125.png');

// ===== 5. Điện thoại 390×844, chạm =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE); await ev('localStorage.removeItem("wgp.o-an-quan.v1")'); await nav(BASE);
check('mobile: màn vào game gọn, 3 nút ≥ 44px, không tràn', await entryFits() && await noOverflow());
await shot('mobile-menu.png');
await toSolo(); await pressSel('#vSolo .seg[data-k="aiLevel"] button[data-v="hard"]'); await pressSel('#startBtn');
const im = await ev('__game.board.info');
check('mobile dọc: bàn tự xoay dọc để ô to hơn, hệ số bội 0,5', im.rot && (im.k * 2) % 1 === 0, JSON.stringify(im));
check('mobile: bàn gọn trong màn, không tràn', await boardIn() && await noOverflow());
await press(...await pitXY(2)); await sleep(100);
const a1 = await arrowXY(1), a0 = await arrowXY(-1);
const gap = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
check('mobile: chạm ô → 2 mũi tên trên bàn, cách nhau đủ xa cho ngón cái, không bị che', (await S()).sel === 2 && gap >= 60 && await onCanvas(...a1) && await onCanvas(...a0), 'cách ' + Math.round(gap) + 'px');
await shot('mobile-chon-huong.png');
await press(...a1); await sleep(250);
check('mobile: chạm mũi tên → rải, có nút Tua / Bỏ qua', (await S()).busy && await visible('#anim'));
await pressSel('#fastBtn');
check('mobile: nút "Tua ×4" bật', await ev(`document.getElementById('fastBtn').getAttribute('aria-pressed')==='true'`));
await sleep(200); await shot('mobile-dang-rai.png');
covered = 0;
r = await playToEnd(200, { fast: true });
s = await S();
check('mobile: đánh với máy Khó bằng chạm tới hết ván → có kết quả', s.winner !== null && s.score[0] + s.score[1] === 70, 'người thắng ' + s.winner + ' sau ' + s.moves + ' nước');
check('mobile: suốt ván mọi điểm chạm trúng bàn, không bị che', covered === 0, 'bị che ' + covered);
check('mobile: bảng kết quả gọn trong màn', await ev(`(()=>{const c=document.querySelector('#ovEnd .card').getBoundingClientRect();return c.left>=0&&c.right<=innerWidth})()`) && await noOverflow());
await shot('mobile-ket-qua.png');
await pressSel('#viewBtn'); await shot('mobile-xem-ban.png');

// ===== 6. Điện thoại ngang 844×390 =====
await view(844, 390, true, 3); await nav(BASE); await toSolo(); await pressSel('#startBtn');
const il = await ev('__game.board.info');
check('điện thoại ngang: HUD dồn cột trái, bàn nằm ngang phóng bội 0,5 lớn nhất (1,5 thiết bị), gọn, không tràn', !il.rot && il.k === 1.5 && await boardIn() && await noOverflow(), JSON.stringify(il));
await shot('mobile-ngang.png');

// ===== 7. Online: trang này tạo phòng, một người chơi giả (WebSocket Node) vào bằng mã =====
await view(1366, 768, false, 1); await touch(false); press = click;
await nav(BASE); await ev(`document.getElementById('nameIn').value='Tí Sỏi'`);
await pressSel('#createBtn'); await pressSel('#vCreate .seg[data-k="rule"] button[data-v="quan-non"]'); await pressSel('#createRoomBtn');
for (let i = 0; i < 40 && !(await visible('#ovRoom')); i++) await sleep(100);
const code = await text('#rCode');
check('online: tạo phòng → phòng chờ có mã 5 ký tự, luật quan non, chủ phòng chọn được luật', /^[A-Z0-9]{5}$/.test(code) && /quan non/.test(await text('#rOpts')) && await visible('#rRule'), code);
const bot = new WebSocket('ws://127.0.0.1:' + PORT + '/ws/o-an-quan');
const botQ = []; let botV = null;
bot.onmessage = (e) => { const m = JSON.parse(e.data); botQ.push(m); if (m.t === 'state') botV = m.v; };
await new Promise((r) => (bot.onopen = r));
bot.send(JSON.stringify({ t: 'join', code, name: 'Bình' }));
for (let i = 0; i < 40 && !(await ev(`!document.getElementById('rStart').disabled`)); i++) await sleep(100);
check('online: người thứ 2 vào → nút Bắt đầu mở', await ev(`!document.getElementById('rStart').disabled`) && /Bình/.test(await text('#rSeats')));
await shot('online-phong-cho.png');
await pressSel('#rStart');
for (let i = 0; i < 40 && !(await S()); i++) await sleep(100);
s = await S();
check('online: vào ván, quan non bật, tới lượt bạn, có ô chat', s && s.quanNon && s.canAct && await visible('#chat'));
await humanMove('first'); await sleep(200);
for (let i = 0; i < 50 && !(botV && botV.seq === 1); i++) await sleep(100);
check('online: nước của bạn tới máy chủ, máy kia nhận đúng', botV && botV.seq === 1);
await pressSel('#skipBtn').catch(() => {});
bot.send(JSON.stringify({ t: 'chat', text: 'Chào bạn, đánh hay đó!' }));
const L = await import('../logic.js');
const bs = L.replay(L.newMatch({ quanNon: true, first: 0 }), botV.game.moves);
const bm = L.legalMoves(bs)[0];
bot.send(JSON.stringify({ t: 'move', pit: bm[0], dir: bm[1] }));
await sleep(600);
s = await S();
check('online: nước của đối thủ → hoạt cảnh rải trên máy mình', s.moves === 2 && (s.busy || true));
await shot('online-dang-rai.png');
for (let i = 0; i < 60 && !(await S()).canAct && (await S()).winner === null; i++) await sleep(100);
check('online: tin nhắn của đối thủ hiện trong khung chat', /Chào bạn/.test(await text('#chatLog')));
await shot('online-chat.png');
bot.send(JSON.stringify({ t: 'leave' }));
for (let i = 0; i < 30 && !(await visible('#ovRoom')); i++) await sleep(100);
check('online: đối thủ rời giữa ván → về phòng chờ, báo có người rời', await visible('#ovRoom') && /rời phòng/.test(await text('#toast')));
bot.close();
await ev('__game.net.leave()'); await sleep(300);
// phòng 2v2: 4 ghế chia hai đội, danh sách phòng công khai ghi đúng sức chứa 4
await ev('sessionStorage.clear()'); await nav(BASE); await ev(`document.getElementById('nameIn').value='Tí Sỏi'`);
await pressSel('#createBtn'); await pressSel('#vCreate .seg[data-k="size"] button[data-v="4"]'); await pressSel('#createRoomBtn');
for (let i = 0; i < 40 && !(await visible('#ovRoom')); i++) await sleep(100);
const code4 = await text('#rCode');
const pub = await (await fetch('http://127.0.0.1:' + PORT + '/api/lobby')).json().catch(() => null);
const mine4 = pub && pub.rooms.find((x) => x.code === code4 && x.game === 'o-an-quan');
check('online 2v2: phòng chờ 4 ghế (Đội A1, B1, A2, B2), Bắt đầu khoá tới khi đủ 4; danh sách phòng công khai ghi 1/4', await ev(`document.querySelectorAll('#rSeats .seat').length===4`) && /A1.*B1.*A2.*B2/.test(await text('#rSeats')) && await ev(`document.getElementById('rStart').disabled`) && !!mine4 && mine4.max === 4 && mine4.have === 1, JSON.stringify(mine4) + ' ' + code4);
await shot('online-phong-cho-2v2.png');

check('không có lỗi JS / console', errors.length === 0, errors.slice(0, 5).join(' | '));
const pass = R.filter((x) => x.startsWith('PASS')).length;
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + `\n\n${pass}/${R.length} đạt\n`);
console.log(`\n${pass}/${R.length} đạt`);
chrome.kill();
await sleep(800);
try { rmSync(PROF, { recursive: true, force: true }); } catch {}
process.exit(pass === R.length ? 0 : 1);
