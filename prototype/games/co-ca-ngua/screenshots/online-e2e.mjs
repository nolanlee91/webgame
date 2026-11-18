// E2E Cờ Cá Ngựa ONLINE — 3 trình duyệt độc lập (Chrome browser context riêng = như 3 máy) vào cùng phòng bằng mã.
// Cần máy chủ online: node games-server/co-ca-ngua/dev.js  (PORT mặc định 8767)
// node screenshots/online-e2e.mjs <thư mục output>   [PORT=8767] [OFFPORT=<cổng server KHÔNG bật online để thử thông báo>]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || '.', PORT = process.env.PORT || 8767, CDP = 9335;
const URL0 = `http://127.0.0.1:${PORT}/games/co-ca-ngua/index.html`;
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
  const pg = {
    name, mobile, P, ev,
    nav: async (u) => { await P.send('Page.navigate', { url: u }); await sleep(1200); },
    shot: async (f) => { await P.send('Emulation.resetPageScaleFactor'); await ev('scrollTo(0,0)'); await sleep(150); if (mobile) console.log('  ' + f + ' visualViewport', await ev('[visualViewport.offsetLeft, visualViewport.offsetTop, visualViewport.scale].join(",")')); const r = await P.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + f, Buffer.from(r.result.data, 'base64')); },
    rect: (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`),
    async press(sel) {
      const p = await pg.rect(sel); if (!p) throw new Error(name + ': không thấy ' + sel); const [x, y] = p;
      if (mobile) { await P.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await P.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      else for (const type of ['mousePressed', 'mouseReleased']) await P.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    },
    async type(sel, text) { await ev(`document.querySelector(${JSON.stringify(sel)}).focus()`); await ev(`document.querySelector(${JSON.stringify(sel)}).select()`); await P.send('Input.insertText', { text }); },
    async key(code, k, vk) { for (const type of ['keyDown', 'keyUp']) await P.send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' ? k : undefined }); },
    S: () => ev(`(()=>{const G=window.__game;if(!G||!G.room)return null;const g=G.state;return {lobby:G.lobby,phase:g.phase,turn:g.turn,seat:g.seats[g.turn],me:G.mySeat,horses:JSON.stringify(g.horses),moves:g.moves.map(m=>m.horse),seq:G.netSeq,inbox:G.inbox,busy:G.busy,desyncs:G.desyncs,players:G.room.players.length,code:G.room.code,rphase:G.room.phase,winner:g.winner}})()`),
    toast: () => ev(`(()=>{const t=document.querySelector('.cn-toast');return t&&!t.hidden?t.textContent:''})()`),
  };
  return pg;
}
async function until(fn, ms = 6000, step = 60) { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch {} await sleep(step); } return null; }

const A = await newPage('A', 1280, 900, false);
const Bm = await newPage('B', 390, 844, true);
const C = await newPage('C', 1280, 900, false);

// ---------- Màn vào phòng + tạo phòng ----------
await A.nav(URL0);
check('màn vào phòng hiện: ô tên, Tạo phòng online, ô mã, Chơi chung 1 máy',
  await A.ev(`!!document.querySelector('#cnName') && !!document.querySelector('[data-e=create]') && !!document.querySelector('#cnCode') && !!document.querySelector('[data-e=local]')`));
await A.shot('online-vao-phong-desktop.png');
await A.press('[data-e=create]'); await sleep(200);
check('chưa nhập tên → báo lỗi, chưa kết nối', (await A.ev(`document.querySelector('.err').textContent`)).includes('Nhập tên'));
await A.type('#cnName', 'An Ngựa Ô'); await A.press('[data-e=create]');
const code = await until(async () => (await A.S())?.code);
check('tạo phòng online → nhận mã phòng 5 ký tự, URL có ?room=', /^[A-Z2-9]{5}$/.test(code || '') && (await A.ev('location.search')).includes('room=' + code), code);
check('chủ phòng 1 người: nút Bắt đầu bị khoá (cần ≥ 2 người)', await A.ev(`document.querySelector('#playBtn').disabled && document.querySelector('#playBtn').textContent.includes('Bắt đầu')`));

// ---------- B (điện thoại) vào bằng link mời, C (máy tính) gõ mã ----------
await Bm.nav(URL0 + '?room=' + code);
check('mở link mời ?room= → mã phòng điền sẵn, ẩn nút Tạo phòng', await Bm.ev(`document.querySelector('#cnCode').value`) === code && !(await Bm.ev(`!!document.querySelector('[data-e=create]')`)));
await Bm.shot('online-moi-vao-phong-mobile.png');
await Bm.type('#cnName', 'Bình'); await Bm.press('[data-e=join]');
await C.nav(URL0);
await C.type('#cnName', 'Chi'); await C.type('#cnCode', 'ab1'); await C.press('[data-e=join]'); await sleep(150);
check('mã sai định dạng → báo lỗi ngay (không gửi máy chủ)', (await C.ev(`document.querySelector('.err').textContent`)).includes('5 ký tự'));
await C.type('#cnCode', 'QQQQQ'); await C.press('[data-e=join]');
await until(async () => (await C.ev(`document.querySelector('.err')?.textContent||''`)).includes('Không tìm thấy'));
check('mã phòng không tồn tại → "Không tìm thấy phòng"', (await C.ev(`document.querySelector('.err').textContent`)).includes('Không tìm thấy'));
await C.type('#cnCode', code.toLowerCase()); await C.press('[data-e=join]');
await until(async () => (await A.S())?.players === 3 && (await Bm.S())?.players === 3 && (await C.S())?.players === 3);
check('3 người ở 3 trình duyệt cùng thấy phòng 3 người', (await A.S())?.players === 3 && (await C.S())?.players === 3);
const rowsA = await A.ev(`[...document.querySelectorAll('.cn-row:not(.off) .nm')].map(e=>e.textContent.trim())`);
check('phòng chờ hiện tên thật + "(Bạn)" đúng người', rowsA.some((t) => t.startsWith('An Ngựa Ô (Bạn)')) && rowsA.includes('Bình') && rowsA.includes('Chi'), rowsA.join(' | '));
check('người không phải chủ phòng: nút "Chờ chủ phòng" khoá, luật khoá', await Bm.ev(`document.querySelector('#playBtn').disabled && document.querySelector('[data-rule="16"]').disabled`));
await Bm.ev(`__net.send({t:'start'})`);
check('máy chủ từ chối người không phải chủ bắt đầu ván', (await until(() => Bm.toast(), 2000)) .includes('chủ phòng'));
await A.press('[data-rule="16"]');
check('chủ phòng đổi luật "Gieo 1 hoặc 6" → mọi máy thấy', !!(await until(async () => (await C.ev(`document.querySelector('[data-rule="16"]').getAttribute('aria-pressed')`)) === 'true')));
await A.shot('online-phong-cho-desktop.png'); await Bm.shot('online-phong-cho-mobile.png');

// ---------- Bắt đầu ----------
await A.press('#playBtn');
await until(async () => { const s = await Promise.all([A.S(), Bm.S(), C.S()]); return s.every((x) => x && !x.lobby); });
let st = await Promise.all([A.S(), Bm.S(), C.S()]);
check('chủ bấm Bắt đầu → cả 3 máy vào bàn 3 màu, cùng trạng thái', st.every((x) => !x.lobby && x.horses === st[0].horses && x.turn === st[0].turn), st.map((x) => x.me).join(','));
check('mỗi máy một màu riêng (ghế 0,1,2)', JSON.stringify(st.map((x) => x.me).sort()) === '[0,1,2]');
const pages = [A, Bm, C];
const turnPage = async () => { const s = await A.S(); return pages[[A, Bm, C].findIndex((_, i) => st[i].me === s.seat)]; };
// người không có lượt: bấm Space không gửi gì; cố gửi thẳng "roll" → máy chủ từ chối, không ai thay đổi
const tp = await turnPage(), other = pages.find((p) => p !== tp && !p.mobile) || pages.find((p) => p !== tp);
const seq0 = (await A.S()).seq;
await other.ev(`__net.send({t:'roll'})`);
const tt = await until(() => other.toast(), 2000);
await sleep(300);
check('gửi "gieo" khi chưa tới lượt → máy chủ báo "Chưa tới lượt bạn", ván không đổi', (tt || '').includes('Chưa tới lượt') && (await A.S()).seq === seq0, tt);
await other.ev(`__net.send({t:'move',horse:0})`); await sleep(300);
check('gửi "đi ngựa" sai lượt/sai pha → ván không đổi', (await A.S()).seq === seq0);
check('khay người khác hiện "Chờ … gieo"', (await other.ev(`document.querySelector('.cn-tray.on .lbl')?.textContent||''`)).includes('Chờ'));

// ---------- Chơi thật ~45 giây: ai có lượt thì bấm khay / phím trên máy của mình ----------
let acts = 0, rolls = 0, picks = 0;
async function play(ms, active = pages, stop = async () => false) {
const t0 = Date.now();
while (Date.now() - t0 < ms) {
  const s = await A.S(); if (s.rphase === 'over' || s.phase === 'over' || await stop(s)) return true;
  const p = active[active.map((q) => st[pages.indexOf(q)].me).indexOf(s.seat)], ps = p ? await p.S() : null;
  if (!ps || ps.busy || ps.inbox || ps.seat !== ps.me) { await sleep(80); continue; }
  if (ps.phase === 'roll') { if (p.mobile) await p.press('.cn-tray.on .pit'); else await p.key('Space', ' ', 32); rolls++; acts++; await sleep(250); }
  else if (ps.phase === 'move' && ps.moves.length > 1) { const h = ps.moves[ps.moves.length - 1]; await p.key('Digit' + (h + 1), String(h + 1), 49 + h); picks++; acts++; await sleep(250); }
  else await sleep(80);
  if (acts === 14) {
    await A.shot('online-giua-van-desktop.png'); await Bm.shot('online-giua-van-mobile.png');
    const sw = await Bm.ev('[document.documentElement.scrollWidth, innerWidth, [...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>391).slice(0,4).map(e=>e.className||e.tagName).join(",")]');
    check("điện thoại 390px giữa ván: không tràn ngang", sw[0] <= 390 && sw[1] <= 390, sw.join(" / "));
  }
}
return false;
}
await play(45000);
await sleep(2500);
st = await Promise.all([A.S(), Bm.S(), C.S()]);
check(`45 giây chơi thật (${rolls} lần gieo, ${picks} lần chọn ngựa) → 3 máy khớp nhau từng ngựa, cùng số thứ tự`, st.every((x) => x.horses === st[0].horses && x.seq === st[0].seq && x.turn === st[0].turn), st.map((x) => x.seq).join(','));
check('không máy nào phải nhận lại trạng thái do lệch (desync = 0)', st.every((x) => x.desyncs === 0), st.map((x) => x.desyncs).join(','));
check('đã chơi được nhiều lượt', rolls >= 8, String(rolls));

// ---------- Rớt mạng + tải lại trang ----------
await Bm.ev('__net.drop()');
check('rớt mạng → hiện "đang nối lại"', (await until(() => Bm.toast(), 1500) || '').includes('nối lại'));
const back = await until(async () => { const [a, b] = await Promise.all([A.S(), Bm.S()]); return b && !b.inbox && !b.busy && b.horses === a.horses && b.seq === a.seq && (await Bm.ev('__net.ws && __net.ws.readyState')) === 1 ? b : null; }, 9000);
check('tự nối lại, giữ đúng ghế, trạng thái khớp máy khác', !!back && back.me === st[1].me);
await C.nav(URL0 + '?room=' + code);
const cBack = await until(async () => { const [a, c] = await Promise.all([A.S(), C.S()]); return c && !c.lobby && c.horses === a.horses ? c : null; }, 8000);
check('tải lại trang (F5) → tự vào lại đúng ghế giữa ván', !!cBack && cBack.me === st[2].me);

// ---------- Rời ván: máy chủ đi thay ----------
await C.press('[data-act="leave"]');
check('bấm Rời phòng (xác nhận) → về màn vào phòng', !!(await until(() => C.ev(`!!document.querySelector('#cnName')`), 3000)));
const leftShown = await until(() => A.ev(`[...document.querySelectorAll('.cn-card .sub')].some(e=>e.textContent.includes('Đã rời'))`), 3000);
check('máy khác thấy "Đã rời · máy đi thay"', !!leftShown);
const cSeat = st[2].me; let sawC = false;
const autoPlayed = await play(25000, [A, Bm], async (s) => { if (s.seat === cSeat) sawC = true; return sawC && s.seat !== cSeat; });
check('ván vẫn chạy tiếp khi có người rời (máy chủ đi thay)', !!autoPlayed);
await A.shot('online-nguoi-roi-desktop.png');

// ---------- Hai tab cùng một người: tab cũ bị thay ----------
const seatB = JSON.parse(await Bm.ev(`sessionStorage.getItem('wgp.co-ca-ngua.seat')`));
await C.nav(URL0 + '?local=1'); // C dùng làm "tab khác" của B: ghép token của B rồi tải lại
await C.ev(`sessionStorage.setItem('wgp.co-ca-ngua.seat', ${JSON.stringify(JSON.stringify(seatB))})`);
await C.nav(URL0 + '?room=' + code);
const replaced = await until(() => Bm.ev(`(document.querySelector('.err')?.textContent||'').includes('tab khác')`), 6000);
check('mở cùng chỗ ngồi ở tab khác → tab cũ thoát, báo rõ', !!replaced);

// ---------- Máy chủ chưa bật online ----------
if (process.env.OFFPORT) {
  const D = await newPage('D', 390, 844, true);
  await D.nav(`http://127.0.0.1:${process.env.OFFPORT}/games/co-ca-ngua/index.html`);
  await D.type('#cnName', 'Dũng'); await D.press('[data-e=create]');
  const off = await until(() => D.ev(`(document.querySelector('.err')?.textContent||'').includes('Chưa kết nối được máy chủ')`), 6000);
  check('máy chủ chưa bật online → báo rõ, vẫn còn nút Chơi chung 1 máy', !!off && await D.ev(`!!document.querySelector('[data-e=local]')`));
  await D.shot('online-may-chu-tat-mobile.png');
  await D.press('[data-e=local]'); await sleep(600);
  check('"Chơi chung 1 máy" → phòng chờ chung máy cũ', await D.ev('__game.lobby === true && !!document.querySelector("[data-n]").offsetParent'));
}

const errs = [A, Bm, C].flatMap((p) => p.P.errors.map((e) => p.name + ': ' + e));
check('không có lỗi JS trên trang', errs.length === 0, errs.slice(0, 3).join(' / '));
const fails = R.filter((x) => x.startsWith('FAIL')).length;
console.log(`\n${R.length - fails}/${R.length} PASS`);
writeFileSync(OUT + '/online-e2e-result.txt', R.join('\n') + '\n');
chrome.kill();
process.exit(fails ? 1 : 0);
