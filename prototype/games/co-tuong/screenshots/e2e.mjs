// E2E Cờ Tướng trên Chrome headless — chuột / chạm thật qua CDP, chụp ảnh desktop + mobile, chơi máy, và ONLINE 2 máy
// (2 browser context riêng = 1 máy tính + 1 điện thoại) qua mã phòng: chat, đi quân, chống gian lận, cầu hòa, xin thua, ván sau đổi màu, F5, rời phòng.
// Chạy: (ở gốc repo) node games-server/co-tuong/dev.js   rồi   node prototype/games/co-tuong/screenshots/e2e.mjs <thư mục output>   [PORT=8769]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || '.', PORT = process.env.PORT || 8769, CDP = 9347;
const URL0 = `http://127.0.0.1:${PORT}/games/co-tuong/`;
mkdirSync(OUT, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + CDP, '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
// ô theo ký hiệu cờ: cột a–i (trái → phải nhìn từ phía Đỏ), hàng 0 = hàng cuối của Đỏ
const sq = (n) => (9 - Number(n[1])) * 9 + (n.charCodeAt(0) - 97);

function rpc(url) {
  const ws = new WebSocket(url); let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true });
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { ws, send, errors, open: new Promise((r) => (ws.onopen = r)) };
}
let ver;
for (let i = 0; i < 60; i++) { try { ver = await (await fetch(`http://127.0.0.1:${CDP}/json/version`)).json(); break; } catch {} await sleep(250); }
const B = rpc(ver.webSocketDebuggerUrl); await B.open;

async function newPage(name, w, h, mobile) {
  const ctx = (await B.send('Target.createBrowserContext', { disposeOnDetach: true })).result.browserContextId;
  const tid = (await B.send('Target.createTarget', { url: 'about:blank', browserContextId: ctx })).result.targetId;
  let wsUrl; for (let i = 0; i < 40 && !wsUrl; i++) { const l = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); wsUrl = l.find((x) => x.id === tid)?.webSocketDebuggerUrl; if (!wsUrl) await sleep(100); }
  const P = rpc(wsUrl); await P.open;
  await P.send('Runtime.enable'); await P.send('Page.enable'); await P.send('Network.enable'); await P.send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async (expr) => {
    const r = await P.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(name + ': ' + expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
    return r.result.result.value;
  };
  const pg = {
    name, P, ev, errors: P.errors, mobile,
    async view(w, h, m) {
      pg.mobile = m;
      await P.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: m ? 2 : 1, mobile: m });
      await P.send('Emulation.setTouchEmulationEnabled', { enabled: m, maxTouchPoints: m ? 5 : 1 }); await sleep(250);
    },
    async tapAt(x, y) {
      if (pg.mobile) { await P.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await P.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      else { await P.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); for (const type of ['mousePressed', 'mouseReleased']) await P.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); }
      await sleep(70);
    },
    nav: async (u) => { await P.send('Page.navigate', { url: u }); for (let i = 0; i < 50 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(150); await sleep(500); },
    reload: async () => { await P.send('Page.reload', { ignoreCache: true }); await sleep(400); for (let i = 0; i < 50 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(150); await sleep(800); },
    shot: async (f) => { await sleep(250); const r = await P.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + f, Buffer.from(r.result.data, 'base64')); },
    rect: (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||!e.getClientRects().length||e.closest('[hidden]'))return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`),
    async press(sel) { const p = await pg.rect(sel); if (!p) throw new Error(name + ': không thấy ' + sel); await pg.tapAt(p[0], p[1]); await sleep(100); },
    async type(sel, text) { await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.focus();e.select&&e.select()})()`); await P.send('Input.insertText', { text }); },
    async key(code, k, vk) { for (const type of ['keyDown', 'keyUp']) await P.send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined }); await sleep(50); },
    async at(n) { const p = await ev(`__game.point(${sq(n)})`); await pg.tapAt(p.x, p.y); },
    async go(a, b) { await pg.at(a); await pg.at(b); },
    S: () => ev(`(()=>{const G=__game,s=G.state,r=G.room;return {room:r&&{code:r.code,phase:r.phase,you:r.you,gid:r.gid,seq:r.seq,n:r.players.length,round:r.round,score:r.score,draws:r.draws,drawOffer:r.drawOffer,oppLeft:r.oppLeft,chat:(r.chat||[]).map(c=>[c.name,c.text,c.mine])},side:G.mySide,flip:G.flipped,sel:G.sel,dests:G.dests,mode:s&&s.mode,turn:s&&s.turn,moves:s?s.moves.length:-1,winner:s&&s.winner,reason:s&&s.reason,check:s&&s.check,score:s&&s.score,round:s&&s.round,thinking:G.thinking}})()`),
    vis: (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none'})()`),
    text: (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`),
    toast: () => ev(`(()=>{const t=document.querySelector('#toast');return t&&!t.hidden?t.textContent:''})()`),
    fits: () => ev(`document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1`),
    // khung bàn cờ (gồm viền gỗ) nằm gọn trong canvas và trong màn hình
    boardIn: () => ev(`(()=>{const L=__game.layout,c=document.getElementById('cv').getBoundingClientRect(),e=L.m+L.fr;const x0=c.left+(L.ox-e)/L.dpr,x1=c.left+(L.ox+8*L.cs+e)/L.dpr,y0=c.top+(L.oy-e)/L.dpr,y1=c.top+(L.oy+9*L.cs+e)/L.dpr;return x0>=c.left-1&&y0>=c.top-1&&x1<=c.right+1&&y1<=c.bottom+1&&y1<=innerHeight&&x1<=innerWidth})()`),
    cs: () => ev('__game.layout.cs/__game.layout.dpr'),
  };
  await pg.view(w, h, mobile);
  return pg;
}
async function until(fn, ms = 6000, step = 60) { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch {} await sleep(step); } return null; }

// ===================== 1. Desktop, chuột — 2 người chung máy =====================
const D = await newPage('desktop', 1440, 900, false);
await D.nav(URL0); await D.ev('localStorage.clear()'); await D.nav(URL0);
check('mở game → hiện menu, mặc định Chơi với máy · Dễ', await D.vis('#ovMenu') && await D.ev(`[...document.querySelectorAll('.seg button[aria-checked=true]')].map(b=>b.dataset.v).join()`) === 'ai,easy');
await D.shot('tuong-desktop-menu.png');
await D.press('.seg[data-k=mode] [data-v=pvp]');
check('chọn 2 người → ẩn mức độ máy', !(await D.vis('#optAi')));
await D.press('#startBtn');
let s = await D.S();
check('Bắt đầu → 32 quân đúng chỗ, Đỏ đi trước, HUD Đỏ sáng', s.moves === 0 && s.turn === 1 && await D.ev(`__game.state.board.filter(x=>x!=='.').length===32&&document.getElementById('plR').classList.contains('on')`));
check('desktop: bàn cờ nằm gọn, không tràn trang, ô ≥ 40px', await D.boardIn() && await D.fits() && (await D.cs()) >= 40, String(await D.cs()));
await D.at('h2'); s = await D.S();
check('nhấp Pháo h2 → chọn quân, hiện ô đi được', s.sel === sq('h2') && s.dests.includes(sq('e2')) && s.dests.length > 5, JSON.stringify(s.dests));
await D.at('h2'); s = await D.S();
check('nhấp lại quân đang chọn → bỏ chọn', s.sel === -1);
await D.at('e7'); s = await D.S();
check('Đỏ nhấp vào quân Đen → không chọn được', s.sel === -1 && s.moves === 0);
await D.go('h2', 'e2'); s = await D.S();
check('Pháo h2 → e2 (Pháo đầu): đi được, tới lượt Đen', s.moves === 1 && s.turn === 2 && /Lượt Đen/.test(await D.text('#hStatus')));
await D.go('h0', 'h3'); s = await D.S();
check('Mã đi sai luật (h0 → h3) không được', s.moves === 1 && s.turn === 2);
await D.go('h7', 'e7'); s = await D.S();
check('Đen: Pháo h7 → e7', s.moves === 2 && s.turn === 1);
await D.go('e2', 'e6'); s = await D.S();
check('Pháo e2 ăn Tốt e6 → CHIẾU (Pháo e7 làm ngòi), báo "Chiếu!"', s.moves === 3 && s.check && /Chiếu/.test(await D.text('#hStatus')) && await D.ev(`document.getElementById('plB').classList.contains('chk')`), await D.text('#hStatus'));
await D.shot('tuong-desktop-chieu.png');
await D.go('b9', 'c7'); s = await D.S();
check('đang bị chiếu: đi Mã không giải chiếu → không được', s.moves === 3 && s.turn === 2);
check('nhật ký nước đi ghi đúng tên nước', (await D.text('#logList')).includes('Pháo 2-5') && (await D.text('#logN')).includes('3 nước'), await D.text('#logList'));
await D.key('KeyU', 'u', 85); s = await D.S();
check('phím U → đi lại 1 nước, hết chiếu', s.moves === 2 && !s.check && s.turn === 1);
await D.press('#resignBtn'); await sleep(500);
s = await D.S();
check('Xin thua (bên đang tới lượt = Đỏ) → Đen thắng, hiện bảng kết quả', s.winner === 2 && s.reason === 'resign' && await until(() => D.vis('#ovEnd'), 2000) && (await D.text('#eTitle')).includes('Đen thắng'), await D.text('#eTitle'));
await D.shot('tuong-desktop-ket-thuc.png');
await D.press('#nextBtn'); s = await D.S();
check('Ván tiếp → ván 2, bàn mới, tỉ số Đen 1', s.round === 2 && s.moves === 0 && s.score[2] === 1 && (await D.text('#sB')) === '1');
await D.ev(`document.getElementById('cv').focus()`);
for (let i = 0; i < 3; i++) await D.key('ArrowUp', 'ArrowUp', 38);
await D.key('Enter', 'Enter', 13); await D.key('ArrowUp', 'ArrowUp', 38); await D.key('Enter', 'Enter', 13); s = await D.S();
check('bàn phím: mũi tên + Enter chọn Tốt e3 rồi tiến e4', s.moves === 1 && await D.ev(`__game.state.board[${sq('e4')}]==='P'`));
await D.press('#drawBtn'); s = await D.S();
check('2 người: Cầu hòa (xác nhận) → hòa', s.winner === 3 && s.reason === 'agreed');
await until(() => D.vis('#ovEnd'), 2000); await D.press('#menuBtnE'); await sleep(200);

// ---- chơi với máy ----
await D.press('.seg[data-k=mode] [data-v=ai]');
check('chọn Chơi với máy → hiện mức độ', await D.vis('#optAi'));
await D.press('#startBtn');
await D.go('h2', 'e2');
s = await until(async () => { const v = await D.S(); return v.moves === 2 && !v.thinking ? v : null; }, 5000);
check('chơi với máy: Đỏ đi → máy (Đen) tự đi lại', !!s && s.turn === 1, JSON.stringify(s));
await D.press('#drawBtn'); await sleep(150);
check('cầu hòa khi mới vài nước → máy từ chối, ván vẫn tiếp', !(await D.S()).winner && (await D.toast()).includes('Máy'));
await D.shot('tuong-desktop-may.png');
await D.reload();
check('F5 giữa ván với máy → menu có "Chơi tiếp ván dở"', await D.vis('#resumeGameBtn'));
await D.press('#resumeGameBtn'); s = await D.S();
check('Chơi tiếp → khôi phục đúng 2 nước, vẫn chế độ máy', s.moves === 2 && s.mode === 'ai');
await D.press('#undoBtn'); s = await D.S();
check('Đi lại khi chơi máy → lùi 2 nước (cả nước của máy)', s.moves === 0 && s.turn === 1);
check('desktop không có lỗi JS', D.errors.length === 0, D.errors.join(' | '));

// ===================== 2. Điện thoại, chạm =====================
const T = await newPage('mobile', 390, 844, true);
await T.nav(URL0); await T.ev('localStorage.clear()'); await T.nav(URL0);
await T.shot('tuong-mobile-menu.png');
await T.press('.seg[data-k=mode] [data-v=pvp]'); await T.press('#startBtn');
check('mobile dọc: bàn cờ nằm gọn, không tràn, ô ≥ 34px', await T.boardIn() && await T.fits() && (await T.cs()) >= 34, String(await T.cs()));
await T.at('b0'); s = await T.S();
check('chạm Mã b0 → chọn, hiện ô đi + gợi ý chạm', s.sel === sq('b0') && s.dests.length === 2 && await T.vis('#tip'));
await T.shot('tuong-mobile-chon-quan.png');
await T.at('c2'); s = await T.S();
check('chạm ô sáng c2 → Mã đi', s.moves === 1 && await T.ev(`__game.state.board[${sq('c2')}]==='N'`));
await T.go('b7', 'b0'); s = await T.S();
check('chạm nước sai (Pháo Đen b7 → b0: qua ngòi mà ô đích trống) → không đi', s.moves === 1);
await T.go('h9', 'g7'); await T.go('h2', 'h6'); s = await T.S();
check('mobile: nút xin thua / cầu hòa / đi lại hiển thị trong màn hình', await T.vis('#resignBtn') && await T.vis('#drawBtn') && await T.vis('#undoBtn') && await T.fits());
await T.shot('tuong-mobile-choi.png');
await T.view(844, 390, true);
check('mobile ngang: bàn cờ vẫn nằm gọn', await T.boardIn() && await T.fits());
await T.shot('tuong-mobile-ngang.png');
await T.view(390, 844, true);
check('mobile không có lỗi JS', T.errors.length === 0, T.errors.join(' | '));

// ===================== 3. ONLINE: máy tính (A) + điện thoại (M) =====================
const A = await newPage('A', 1280, 820, false);
const M = await newPage('M', 390, 844, true);
await A.nav(URL0);
await A.press('.seg[data-k=mode] [data-v=online]');
check('chọn Online → ô tên, Tạo phòng, ô mã', await A.vis('#nameIn') && await A.vis('#createBtn') && await A.vis('#codeIn'));
await A.type('#nameIn', 'An Tướng'); await A.press('#createBtn');
const code = await until(async () => (await A.S()).room?.code);
check('tạo phòng → mã 5 ký tự, có ?room=, hiện phòng chờ, Bắt đầu khoá', /^[A-Z0-9]{5}$/.test(code || '') && (await A.ev('location.search')).includes(code) && await A.vis('#ovRoom') && await A.ev(`document.querySelector('#rStart').disabled`), code);
await A.shot('online-phong-cho-desktop.png');
await M.nav(URL0 + '?room=' + code);
check('link mời → chọn sẵn Online + điền mã', await M.ev(`document.querySelector('#codeIn').value`) === code);
await M.type('#nameIn', 'Bình'); await M.press('#joinBtn');
check('điện thoại vào phòng → cả 2 thấy 2 người', !!(await until(async () => (await A.S()).room?.n === 2 && (await M.S()).room?.n === 2)));
await A.type('#chatIn', 'Chào Bình!'); await A.press('#chatF button[type=submit]');
check('chat máy tính → điện thoại nhận đúng tên', !!(await until(async () => (await M.S()).room.chat.some(([n, t, mine]) => n === 'An Tướng' && t === 'Chào Bình!' && !mine))));
await M.ev(`__game.net.send({t:'chat',text:'tôi là chủ phòng',name:'An Tướng',mine:true})`);
check('chống giả danh trong chat: máy chủ gắn tên thật', !!(await until(async () => (await A.S()).room.chat.some(([n, t]) => t === 'tôi là chủ phòng' && n === 'Bình'))));
await M.shot('online-phong-cho-mobile.png');
await M.ev(`__game.net.send({t:'start'})`);
check('người vào sau gửi start → bị từ chối', (await until(() => M.toast())).includes('chủ phòng'));
await A.press('#rStart');
check('chủ phòng bấm Bắt đầu → cả 2 vào ván', !!(await until(async () => (await A.S()).room?.phase === 'play' && (await M.S()).room?.phase === 'play')));
let a = await A.S(), m = await M.S();
check('ván 1: chủ phòng cầm Đỏ (bàn thường), điện thoại cầm Đen (bàn xoay)', a.side === 1 && !a.flip && m.side === 2 && m.flip);
await M.go('h7', 'e7'); await sleep(200);
check('Đen bấm đi khi chưa tới lượt → không đi được', (await A.S()).moves === 0);
await M.ev(`__game.net.send({t:'move',f:${sq('h7')},to:${sq('e7')}})`);
check('gửi thẳng nước đi khi chưa tới lượt → máy chủ từ chối "Chưa tới lượt"', (await until(() => M.toast())).includes('Chưa tới lượt') && (await A.S()).moves === 0);
await A.ev(`__game.net.send({t:'move',f:${sq('h0')},to:${sq('h3')}})`);
check('gửi nước sai luật (Mã h0 → h3) → máy chủ từ chối', (await until(() => A.toast())).includes('không hợp lệ') && (await A.S()).moves === 0);
await A.ev(`__game.net.send({t:'move',f:${sq('h7')},to:${sq('h3')}})`); await sleep(300);
check('gửi nước đi quân của đối thủ → không đi được', (await A.S()).moves === 0);
await A.go('h2', 'e2');
check('Đỏ (máy tính) đi Pháo h2 → e2 → điện thoại nhận', !!(await until(async () => (await M.S()).moves === 1)));
await M.go('h7', 'e7');
check('Đen (điện thoại, bàn xoay) chạm Pháo h7 → e7 → máy tính nhận', !!(await until(async () => (await A.S()).moves === 2)));
await A.go('e2', 'e6');
check('Đỏ ăn Tốt e6 chiếu → điện thoại thấy "Chiếu"', !!(await until(async () => { const v = await M.S(); return v.moves === 3 && v.check && /Chiếu/.test(await M.text('#hStatus')); })));
await M.shot('online-chieu-mobile.png');
await A.shot('online-giua-van-desktop.png');
await M.press('#drawBtn');
check('điện thoại cầu hòa → máy tính hiện thanh Đồng ý / Từ chối', !!(await until(() => A.vis('#offer'))));
await A.shot('online-cau-hoa-desktop.png');
await A.press('#offerNo');
check('máy tính từ chối → điện thoại được báo', !!(await until(async () => (await M.toast()).includes('từ chối'))) && !(await A.vis('#offer')));
await M.ev(`__game.net.send({t:'draw'})`);
check('cầu hòa lần 2 trong cùng nước → bị chặn (chống spam)', (await until(() => M.toast())).includes('nhanh quá'));
await M.press('#resignBtn');
check('điện thoại xin thua → máy tính "Bạn thắng!", điện thoại "Bạn thua!"', !!(await until(async () => await A.vis('#ovEnd') && await M.vis('#ovEnd'), 4000)) && (await A.text('#eTitle')).includes('Bạn thắng') && (await M.text('#eTitle')).includes('Bạn thua'));
a = await A.S();
check('tỉ số theo người: chủ phòng 1 – 0', a.room.score[0] === 1 && a.room.score[1] === 0, JSON.stringify(a.room.score));
await M.shot('online-thua-mobile.png'); await A.shot('online-thang-desktop.png');
await M.press('#nextBtn');
check('Ván tiếp → ván 2, đổi màu: điện thoại cầm Đỏ, máy tính bàn xoay', !!(await until(async () => { const x = await A.S(), y = await M.S(); return x.room.round === 2 && x.room.phase === 'play' && y.side === 1 && x.side === 2 && x.flip && !y.flip; })));
await M.go('b2', 'e2');
check('ván 2: điện thoại (Đỏ) đi trước được', !!(await until(async () => (await A.S()).moves === 1)));
const gid = (await A.S()).room.gid;
await A.reload();
check('máy tính F5 giữa ván → tự vào lại đúng phòng, đúng ván', !!(await until(async () => { const v = await A.S(); return v.room && v.room.gid === gid && v.moves === 1 && v.side === 2; }, 6000)));
await M.press('#menuBtn'); await M.press('#menuBtnP');
check('điện thoại rời phòng → máy tính về phòng chờ, điểm làm lại', !!(await until(async () => { const v = await A.S(); return v.room && v.room.phase === 'lobby' && v.room.n === 1 && v.room.score[0] === 0; })) && await A.vis('#ovRoom'));
await A.shot('online-doi-thu-roi-desktop.png');
check('online không có lỗi JS', A.errors.length === 0 && M.errors.length === 0, [...A.errors, ...M.errors].join(' | '));

writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + '\n');
console.log(R.filter((x) => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
chrome.kill(); process.exit(0);
