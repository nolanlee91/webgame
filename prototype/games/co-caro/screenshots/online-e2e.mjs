// E2E Cờ Caro ONLINE — 2 trình duyệt độc lập (Chrome browser context riêng = như 2 máy: 1 máy tính + 1 điện thoại cảm ứng)
// vào cùng phòng bằng mã, chat với nhau, đánh hết ván, ván mới, rớt mạng / F5, rời phòng.
// Cần máy chủ online: node games-server/co-caro/dev.js  (PORT mặc định 8768)
// node screenshots/online-e2e.mjs <thư mục output>   [PORT=8768] [OFFPORT=<cổng server KHÔNG bật Caro online để thử thông báo>]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || '.', PORT = process.env.PORT || 8768, CDP = 9336;
const URL0 = `http://127.0.0.1:${PORT}/games/co-caro/index.html`;
mkdirSync(OUT, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + CDP, '--user-data-dir=' + OUT + '/prof-online', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };

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
  await P.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await P.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const ev = async (expr) => {
    const r = await P.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(name + ': ' + expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
    return r.result.result.value;
  };
  const tapAt = async (x, y) => {
    if (mobile) { await P.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await P.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await P.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); for (const type of ['mousePressed', 'mouseReleased']) await P.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); }
  };
  const pg = {
    name, mobile, P, ev, tapAt,
    nav: async (u) => { await P.send('Page.navigate', { url: u }); await sleep(1200); await until(() => ev('typeof window.__game==="object"'), 8000); },
    reload: async () => { await P.send('Page.reload', { ignoreCache: true }); await sleep(1400); await until(() => ev('typeof window.__game==="object"'), 8000); },
    shot: async (f) => { await P.send('Emulation.resetPageScaleFactor'); await sleep(200); const r = await P.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + f, Buffer.from(r.result.data, 'base64')); },
    rect: (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||!e.getClientRects().length)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`),
    async press(sel) { const p = await pg.rect(sel); if (!p) throw new Error(name + ': không thấy ' + sel); await tapAt(p[0], p[1]); },
    async type(sel, text) { await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.focus();e.select&&e.select()})()`); await P.send('Input.insertText', { text }); },
    async enter() { for (const type of ['keyDown', 'keyUp']) await P.send('Input.dispatchKeyEvent', { type, code: 'Enter', key: 'Enter', windowsVirtualKeyCode: 13, text: type === 'keyDown' ? '\r' : undefined }); },
    // đặt quân thật: chuột 1 lần; cảm ứng chạm chọn ô rồi bấm nút Đặt (nút khoá thì chạm không có tác dụng)
    async cell(r, c) { const p = await ev(`window.__game.cellPoint(${r},${c})`); await tapAt(p.x, p.y); if (mobile) { await sleep(60); const b = await pg.rect('#placeBtn'); if (b) await tapAt(b[0], b[1]); } },
    S: () => ev(`(()=>{const G=window.__game,s=G.state,r=G.room;return {room:r&&{code:r.code,phase:r.phase,you:r.you,host:r.host,gid:r.gid,seq:r.seq,n:r.players.length,oppLeft:r.oppLeft,chat:(r.chat||[]).map(c=>[c.name,c.text,c.mine])},side:G.mySide,turn:s&&s.turn,moves:s?s.moves.length:-1,winner:s&&s.winner,score:s&&s.score,first:s&&s.first}})()`),
    vis: (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none'})()`),
    text: (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`),
    toast: () => ev(`(()=>{const t=document.querySelector('#toast');return t&&!t.hidden?t.textContent:''})()`),
    overflow: () => ev(`document.documentElement.scrollWidth>innerWidth+1`),
  };
  return pg;
}
async function until(fn, ms = 6000, step = 60) { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch {} await sleep(step); } return null; }

const A = await newPage('A', 1280, 820, false);
const M = await newPage('B', 390, 844, true);

// ---------- Màn vào game: tên · Tạo phòng online · mã phòng · Chơi với máy ----------
await A.nav(URL0);
check('màn vào game: ô tên, nút Tạo phòng online, ô mã + Vào phòng, Chơi với máy — không còn ô "Chế độ"', await A.vis('#nameIn') && await A.vis('#createBtn') && await A.vis('#codeIn') && await A.vis('#joinBtn') && await A.vis('#soloBtn') && !(await A.ev(`!!document.querySelector('[data-k=mode]')`)));
await A.ev(`document.querySelector('#nameIn').value=''`);
await A.press('#createBtn'); await sleep(150);
check('chưa nhập tên → báo lỗi, chưa kết nối, vẫn ở màn đầu', (await A.text('#mErr')).includes('Nhập tên') && !(await A.ev('!!window.__game.net.ws')) && await A.vis('#vEntry'));
await A.type('#nameIn', 'An Caro'); await A.enter(); await sleep(150);
check('Enter ở ô tên → bước tuỳ chọn phòng (Bàn cờ + Luật), chưa kết nối', await A.vis('#vCreate') && await A.vis('#vCreate .seg[data-k=size]') && await A.vis('#vCreate .seg[data-k=rule]') && !(await A.ev('!!window.__game.net.ws')));
await A.press('#createBack'); await sleep(100);
check('Quay lại → màn đầu, focus nút Tạo phòng online', await A.vis('#vEntry') && await A.ev('document.activeElement.id') === 'createBtn');
await A.press('#createBtn'); await sleep(100);
await A.press('#vCreate .seg[data-k=size] [data-v="19"]');
await A.press('#createRoomBtn');
const code = await until(async () => (await A.S()).room?.code);
check('phòng tạo theo bàn đã chọn (19×19)', (await A.text('#rOpts')).includes('19×19'), await A.text('#rOpts'));
check('tạo phòng → mã 5 ký tự, URL có ?room=, hiện phòng chờ', /^[A-Z2-9]{5}$/.test(code || '') && (await A.ev('location.search')).includes('room=' + code) && await A.vis('#ovRoom'), code);
check('phòng chờ: chủ phòng 1 người → nút Bắt đầu khoá', await A.ev(`document.querySelector('#rStart').disabled`));
check('máy tính: ô chat hiện cạnh bàn cờ ngay trong phòng chờ', await A.vis('#chat') && await A.vis('#chatIn'));
await A.shot('online-phong-cho-desktop.png');

// ---------- Điện thoại vào bằng link mời ----------
await M.nav(URL0 + '?room=' + code);
check('link mời ?room= → điền sẵn mã, có lời mời, ô tên ngay trên', await M.ev(`document.querySelector('#codeIn').value`) === code && await M.vis('#nameIn') && (await M.text('#mNote')).includes(code));
await M.press('#joinBtn'); await sleep(150);
check('điện thoại chưa nhập tên → báo lỗi', (await M.text('#mErr')).includes('Nhập tên'));
await M.type('#nameIn', 'Bình'); await M.press('#joinBtn');
check('vào phòng bằng mã → cả 2 thấy 2 người', !!(await until(async () => (await A.S()).room?.n === 2 && (await M.S()).room?.n === 2)));
check('chủ phòng: Bắt đầu mở; người vào: "Chờ chủ phòng" khoá', await A.ev(`!document.querySelector('#rStart').disabled`) && await M.ev(`document.querySelector('#rStart').disabled && document.querySelector('#rStart').textContent.includes('Chờ')`));
check('điện thoại: ô chat ẩn, có nút Chat; không tràn ngang', !(await M.vis('#chat')) && await M.vis('#chatBtn') && !(await M.overflow()));
await M.shot('online-phong-cho-mobile.png');

// ---------- Chat qua máy chủ ----------
await A.type('#chatIn', 'Chào Bình, chơi nhé!'); await A.enter();
check('máy tính gửi chat (Enter) → điện thoại nhận, tên người gửi đúng', !!(await until(async () => (await M.S()).room.chat.some(([n, t, mine]) => n === 'An Caro' && t === 'Chào Bình, chơi nhé!' && !mine))));
check('điện thoại đang đóng chat → hiện thông báo nổi + số tin chưa đọc', (await until(() => M.toast())).includes('Chào Bình') && await M.text('#chatN') === '1');
await M.press('#chatBtn'); await sleep(200);
check('bấm Chat trên điện thoại → mở bảng chat, thấy tin, hết số chưa đọc', await M.vis('#chat') && (await M.text('#chatLog')).includes('Chào Bình') && !(await M.vis('#chatN')));
await M.type('#chatIn', 'Ok, mình cầm O 😎'); await M.press('#chatF button[type=submit]');
check('điện thoại gửi chat → máy tính nhận; tin của mình hiện "Bạn"', !!(await until(async () => (await A.S()).room.chat.some(([n, t]) => n === 'Bình' && t.startsWith('Ok, mình cầm O')))) && (await M.ev(`[...document.querySelectorAll('#chatLog li.mine b')].map(b=>b.textContent).join()`)).includes('Bạn'));
check('ô chat xoá sau khi gửi', await M.ev(`document.querySelector('#chatIn').value`) === '');
await M.shot('online-chat-mobile.png');
await M.press('#chatX'); await sleep(150);
// giả danh: gửi kèm name/from → máy chủ vẫn gắn tên thật
await M.ev(`window.__game.net.send({t:'chat',text:'tôi là chủ phòng',name:'An Caro',from:0,mine:true})`);
check('chống giả danh: gửi kèm tên người khác → máy chủ vẫn ghi tên thật', !!(await until(async () => (await A.S()).room.chat.some(([n, t]) => t === 'tôi là chủ phòng' && n === 'Bình'))));
await M.ev(`window.__game.net.send({t:'chat',text:'x'.repeat(260)})`);
check('tin quá dài bị máy chủ từ chối, báo lỗi', (await until(() => M.toast())).includes('dài quá'));
await A.ev(`document.querySelector('#chatIn').maxLength`).then((n) => check('ô nhập giới hạn 200 ký tự', n === 200, n));

// ---------- Bắt đầu ----------
await M.ev(`window.__game.net.send({t:'start'})`);
check('người không phải chủ phòng gửi start → bị từ chối', (await until(() => M.toast())).includes('chủ phòng'));
await A.press('#rStart');
check('chủ phòng bấm Bắt đầu → cả 2 vào ván, A cầm X, B cầm O', !!(await until(async () => { const a = await A.S(), b = await M.S(); return a.room.phase === 'play' && b.room.phase === 'play' && a.side === 1 && b.side === 2; })));
check('chế độ online: ẩn nút Đi lại; Ván mới khoá khi đang đánh', !(await A.vis('#undoBtn')) && await A.ev(`document.querySelector('#newBtn').disabled`));
const sz = (await A.ev('window.__game.state.size'));
const mid = Math.floor(sz / 2);

// ---------- Đánh ----------
await M.cell(mid, mid); await sleep(300);
check('chưa tới lượt (O) → chạm không gửi nước, nút Đặt khoá', (await A.S()).moves === 0 && await M.vis('#placeBtn') && await M.ev(`document.querySelector('#placeBtn').disabled`));
check('trạng thái: A "Lượt bạn", B "Chờ … đánh"', (await A.text('#hStatus')).includes('Lượt bạn') && (await M.text('#hStatus')).includes('Chờ'));
const X = [[mid, mid - 2], [mid, mid - 1], [mid, mid], [mid, mid + 1], [mid, mid + 2]];
const O = [[mid + 2, mid - 2], [mid + 2, mid - 1], [mid + 2, mid], [mid + 2, mid + 1]];
for (let k = 0; k < 4; k++) {
  await A.cell(...X[k]); await until(async () => (await M.S()).moves === 2 * k + 1);
  if (k === 1) {
    await A.cell(mid - 3, mid - 3); await sleep(250);
    check('đánh 2 nước liền (chưa tới lượt) → không được', (await A.S()).moves === 3);
    await M.cell(...X[0]); await sleep(250);
    check('chạm vào ô đã có quân → không gửi', (await M.S()).moves === 3);
  }
  await M.cell(...O[k]); await until(async () => (await A.S()).moves === 2 * k + 2);
}
await until(async () => (await M.S()).moves === 8, 3000); // điện thoại nhận lại nước của chính mình có thể chậm hơn máy tính vài ms
const mids = await A.S();
check('8 nước luân phiên, 2 máy thấy cùng bàn', mids.moves === 8 && (await M.S()).moves === 8 && JSON.stringify(await A.ev('window.__game.state.board')) === JSON.stringify(await M.ev('window.__game.state.board')));
await A.type('#chatIn', 'Coi chừng nha'); await A.enter();
await until(async () => (await M.S()).room.chat.some(([, t]) => t === 'Coi chừng nha'));
check('chat giữa ván không làm đổi ván (vẫn 8 nước, đúng lượt)', (await M.S()).moves === 8 && (await M.S()).turn === 1);
await A.shot('online-giua-van-desktop.png');
await M.shot('online-giua-van-mobile.png');
await A.cell(...X[4]);
check('A xếp đủ 5 → cả 2 thấy A thắng, tỉ số 1–0', !!(await until(async () => { const a = await A.S(), b = await M.S(); return a.winner === 1 && b.winner === 1 && a.score[1] === 1 && b.score[1] === 1; })));
await sleep(1500);
check('màn kết thúc: A "Bạn thắng!", B "Bạn thua!", nút Rời phòng', (await A.text('#eTitle')).includes('Bạn thắng') && (await M.text('#eTitle')).includes('Bạn thua') && (await A.text('#menuBtnE')).includes('Rời phòng'));
check('màn kết thúc online: chủ phòng có nút Hủy phòng, người kia không', await A.vis('#eDisband') && !(await M.vis('#eDisband')));
await A.shot('online-thang-desktop.png');
await M.shot('online-thua-mobile.png');

// ---------- Ván mới: người thua đi trước ----------
const g0 = (await A.S()).room.gid;
await M.press('#nextBtn');
check('bấm Ván mới → ván 2 cho cả 2, người thua (O) đi trước', !!(await until(async () => { const a = await A.S(), b = await M.S(); return a.room.gid > g0 && b.room.gid > g0 && a.moves === 0 && a.turn === 2 && b.turn === 2 && a.room.phase === 'play'; })));
check('ẩn màn kết thúc khi sang ván mới', !(await A.vis('#ovEnd')) && !(await M.vis('#ovEnd')));
await M.cell(mid, mid); await until(async () => (await A.S()).moves === 1);
check('B (O) đi trước được', (await A.S()).moves === 1 && (await A.S()).turn === 1);

// ---------- Rớt mạng / F5 ----------
await M.ev(`window.__toasts=[];new MutationObserver(()=>{const t=document.querySelector('#toast');if(!t.hidden)__toasts.push(t.textContent)}).observe(document.querySelector('#toast'),{attributes:true,childList:true,characterData:true,subtree:true});window.__game.net.drop()`);
check('điện thoại rớt mạng → báo đang nối lại', !!(await until(() => M.ev(`__toasts.some(t=>t.includes('nối lại'))`), 2000)));
check('tự nối lại, giữ ghế + ván', !!(await until(async () => { const b = await M.S(); return b.room?.phase === 'play' && b.side === 2 && b.moves === 1 && !(await M.toast()).includes('nối lại'); }, 8000)));
await A.reload();
check('F5 máy tính → vào lại đúng phòng + ván (không cần nhập lại)', !!(await until(async () => { const a = await A.S(); return a.room?.code === code && a.room.phase === 'play' && a.moves === 1 && a.side === 1; }, 8000)));
check('F5 xong vẫn thấy lại tin chat cũ của phòng', (await A.text('#chatLog')).includes('Coi chừng nha'));
await A.cell(mid - 1, mid - 1);
check('sau F5 đánh tiếp được', !!(await until(async () => (await M.S()).moves === 2)));

// ---------- Rời phòng giữa ván ----------
await M.press('#menuBtn'); await sleep(200);
check('menu tạm dừng online có nút Rời phòng', (await M.text('#menuBtnP')).includes('Rời phòng'));
await M.press('#menuBtnP');
check('B rời giữa ván → B về menu, URL bỏ ?room=', !!(await until(async () => (await M.S()).room === null && await M.vis('#ovMenu') && !(await M.ev('location.search')).includes('room='))));
check('A về phòng chờ, làm chủ phòng, báo đối thủ đã rời', !!(await until(async () => { const a = await A.S(); return a.room.phase === 'lobby' && a.room.n === 1 && a.room.host === a.room.you; })) && (await A.toast()).includes('rời phòng'));
await A.shot('online-doi-thu-roi-desktop.png');
await M.nav(URL0 + '?room=' + code); await M.press('#joinBtn');
check('người khác vào lại bằng mã → đủ 2, chơi tiếp được', !!(await until(async () => (await A.S()).room.n === 2)));
await A.press('#rStart');
check('ván mới sau khi có người mới vào', !!(await until(async () => (await M.S()).room?.phase === 'play' && (await A.S()).room?.phase === 'play')));
await A.press('#menuBtn'); await sleep(150); await A.press('#menuBtnP');
await until(async () => (await A.S()).room === null);
await until(async () => (await M.S()).room?.phase === 'lobby'); await M.press('#rLeave');
await until(async () => (await M.S()).room === null);

// ---------- Hủy phòng (chủ phòng) · "← Trang chủ" rời phòng ngay ----------
const S2 = (pg) => pg.ev(`({room:!!window.__game.room,err:document.querySelector('#mErr').textContent,seat:sessionStorage.getItem('wgp.caro.seat'),q:location.search,menu:!document.querySelector('#ovMenu').hidden})`);
await A.nav(URL0); await A.press('#createBtn'); await sleep(100); await A.press('#createRoomBtn');
const code2 = await until(async () => (await A.S()).room?.code);
check('phòng chờ: chủ phòng có nút Hủy phòng + Rời phòng', await A.vis('#rDisband') && await A.vis('#rLeave'));
await M.nav(URL0 + '?room=' + code2); await M.press('#joinBtn');
await until(async () => (await A.S()).room?.n === 2 && (await M.S()).room?.n === 2);
check('người vào: chỉ có Rời phòng, không có Hủy phòng', !(await M.vis('#rDisband')) && await M.vis('#rLeave'));
await A.press('#rDisband'); // confirm() tự đồng ý
const dis = await until(async () => { const a = await S2(A), b = await S2(M); return !a.room && !b.room && a.menu && b.menu ? [a, b] : null; }, 4000);
check('Hủy phòng → cả 2 về màn đầu: chủ "Đã hủy phòng.", khách "Chủ phòng đã hủy phòng."', !!dis && dis[0].err === 'Đã hủy phòng.' && dis[1].err === 'Chủ phòng đã hủy phòng.', JSON.stringify(dis));
check('Hủy phòng → xoá ghế đã lưu + bỏ ?room= trên URL', !!dis && !dis[0].seat && !dis[1].seat && !dis[0].q.includes('room=') && !dis[1].q.includes('room='));
await M.type('#codeIn', code2); await M.press('#joinBtn');
check('mã phòng đã hủy không vào được nữa', !!(await until(async () => (await M.text('#mErr')).includes('Không tìm thấy phòng'))), await M.text('#mErr'));
await A.press('#createBtn'); await sleep(100); await A.press('#createRoomBtn');
const code3 = await until(async () => { const c = (await A.S()).room?.code; return c && c !== code2 ? c : null; });
await M.nav(URL0 + '?room=' + code3); await M.press('#joinBtn');
await until(async () => (await A.S()).room?.n === 2);
const t0 = Date.now(); await M.press('header a');
check('khách bấm "← Trang chủ" ở phòng chờ → chủ phòng thấy rời ngay (< 2 giây)', !!(await until(async () => (await A.S()).room?.n === 1, 2000)), (Date.now() - t0) + 'ms');
check('…và khách sang trang chủ', !!(await until(() => M.ev('location.pathname.includes("homepage")'), 3000)));
await A.press('header a');
check('chủ phòng một mình bấm "← Trang chủ" → hủy phòng rồi sang trang chủ', !!(await until(() => A.ev('location.pathname.includes("homepage")'), 3000)));
await M.nav(URL0); await M.type('#codeIn', code3); await M.type('#nameIn', 'Bình'); await M.press('#joinBtn');
check('phòng đó đã bị xoá', !!(await until(async () => (await M.text('#mErr')).includes('Không tìm thấy phòng'))), await M.text('#mErr'));

// ---------- Máy chủ chưa bật online ----------
if (process.env.OFFPORT) {
  await M.nav(`http://127.0.0.1:${process.env.OFFPORT}/games/co-caro/index.html`);
  await M.type('#nameIn', 'Bình'); await M.press('#createBtn'); await sleep(100); await M.press('#createRoomBtn');
  check('máy chủ chưa bật Caro online → báo rõ, vẫn chơi được với máy', (await until(async () => (await M.text('#mErr')).includes('Chưa kết nối được'))) && !(await M.ev(`[...document.querySelectorAll('#ovMenu .btn')].some(b=>b.disabled)`)), await M.text('#mErr'));
  await M.shot('online-may-chu-tat-mobile.png');
}

// ---------- Chơi với máy vẫn như cũ (không còn chế độ 2 người chung máy) ----------
await A.nav(URL0);
check('màn đầu không còn ô "Chế độ"; Chơi với máy mở bước tuỳ chọn', !(await A.ev(`!!document.querySelector('[data-k=mode]')`)));
await A.press('#soloBtn'); await sleep(100);
check('bước Chơi với máy: Máy · Bàn cờ · Luật + Bắt đầu', await A.vis('#vSolo .seg[data-k=aiLevel]') && await A.vis('#vSolo .seg[data-k=size]') && await A.vis('#startBtn'));
await A.press('#startBtn'); await sleep(300);
await A.cell(mid, mid); await until(async () => (await A.S()).moves === 2, 3000);
check('chơi với máy vẫn chơi được, không có ô chat', (await A.S()).moves === 2 && !(await A.vis('#chat')) && await A.vis('#undoBtn'));

check('không có lỗi JS trên cả 2 trình duyệt', !A.P.errors.length && !M.P.errors.length, [...A.P.errors, ...M.P.errors].join(' | ').slice(0, 300));
const pass = R.filter((x) => x.startsWith('PASS')).length;
console.log(`\n${pass}/${R.length} PASS`);
writeFileSync(OUT + '/online-e2e-ket-qua.txt', R.join('\n') + `\n\n${pass}/${R.length} PASS\n`);
chrome.kill();
process.exit(pass === R.length ? 0 : 1);
