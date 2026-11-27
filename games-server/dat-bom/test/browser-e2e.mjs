// E2E Đặt Bom trên Chrome headless thật: trang thật (handler tĩnh của server.js) + máy chủ phòng thật (host.js),
// ván ngắn (20 s) để kiểm được cả kết thúc "hết giờ".
//  - 3 tab = 3 người: chủ phòng (desktop), bạn vào bằng link mời (desktop), người lạ vào từ danh sách phòng công khai
//    trên khung điện thoại 390×844 (cảm ứng: D-pad + nút BOM).
//  - Chat qua lại, bắt đầu, đếm ngược, đi bằng phím thật, đặt bom bằng Space và bằng nút cảm ứng, hai người tự nổ ⇒
//    người còn lại thắng; ván mới ⇒ hết giờ ⇒ hoà; chủ phòng đưa cả phòng về phòng chờ; một người rời phòng.
//  - Trang không ghi console, không lỗi JS, không tràn ngang; chụp ảnh từng bước.
// Chạy: node games-server/dat-bom/test/browser-e2e.mjs [thư mục ảnh]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { tempProfile, guardChrome, shotDir } from '../../../prototype/games/_shared/test/lk-temp.mjs';
import http from 'node:http';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const OUT = process.argv[2] || shotDir('dat-bom');
mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url);
const main = require(join(REPO, 'server.js'));             // chỉ mượn handler phục vụ file tĩnh
const server = http.createServer(main.listeners('request')[0]);
require(join(REPO, 'games-server/dat-bom/host.js')).createDatBomHost(server, { rules: { roundMs: 20000 } });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/games/dat-bom/`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.error('Không thấy Chrome/Edge'); process.exit(2); }
const prof = tempProfile('dat-bom'); // %TEMP%/lk-e2e-dat-bom-*, tự xoá khi thoát (kể cả Ctrl+C / bị giết cứng)
const DPORT = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DPORT}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--no-first-run',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, prof);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, msg) => { console.log(`${c ? '✔' : '✘'} ${msg}`); if (!c) fails++; };

for (let i = 0; i < 80; i++) { try { await fetch(`http://127.0.0.1:${DPORT}/json/version`); break; } catch { await sleep(250); } }

const bws = new WebSocket((await (await fetch(`http://127.0.0.1:${DPORT}/json/version`)).json()).webSocketDebuggerUrl);
await new Promise((r) => (bws.onopen = r));
let bid = 0; const bpend = new Map();
bws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && bpend.has(m.id)) { bpend.get(m.id)(m); bpend.delete(m.id); } };
const browserCmd = (method, params = {}) => new Promise((r) => { const i = ++bid; bpend.set(i, r); bws.send(JSON.stringify({ id: i, method, params })); });

const KEYS = { ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40, ' ': 32 };
class Tab {
  constructor(name) { this.name = name; this.id = 0; this.pend = new Map(); this.last = null; this.nFrames = 0; this.console = []; this.errors = []; }
  async open(w = 1366, h = 860, mobile = false) {
    // mỗi người một cửa sổ riêng ⇒ tab nào cũng "đang hiển thị" (requestAnimationFrame chạy như máy thật)
    const { targetId } = (await browserCmd('Target.createTarget', { url: 'about:blank', newWindow: true })).result;
    this.tid = targetId; this.ws = new WebSocket(`ws://127.0.0.1:${DPORT}/devtools/page/${targetId}`);
    await new Promise((r) => (this.ws.onopen = r));
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pend.has(m.id)) { this.pend.get(m.id)(m); this.pend.delete(m.id); }
      if (m.method === 'Network.webSocketFrameReceived') {
        const d = m.params.response.payloadData;
        if (d.startsWith('{"t":"f"')) { this.last = JSON.parse(d); this.nFrames++; }
      }
      if (m.method === 'Runtime.consoleAPICalled') this.console.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
      if (m.method === 'Runtime.exceptionThrown') this.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|fonts\.g/.test(m.params.entry.url || '')) this.errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`);
    };
    await this.cmd('Runtime.enable'); await this.cmd('Network.enable'); await this.cmd('Page.enable'); await this.cmd('Log.enable');
    await this.cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    if (mobile) await this.cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    return this;
  }
  cmd(method, params = {}) { return new Promise((r) => { const i = ++this.id; this.pend.set(i, r); this.ws.send(JSON.stringify({ id: i, method, params })); }); }
  async ev(expr) {
    const r = await this.cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(`${this.name}: ${expr.slice(0, 100)} :: ${r.result.exceptionDetails.exception?.description}`);
    return r.result?.result?.value;
  }
  async go(url) { await this.cmd('Page.navigate', { url }); await this.waitFor('document.readyState==="complete"'); await sleep(200); }
  async waitFor(expr, ms = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await this.ev(`!!(${expr})`)) return true; await sleep(100); }
    throw new Error(`${this.name}: hết giờ chờ ${expr}`);
  }
  async front() { await fetch(`http://127.0.0.1:${DPORT}/json/activate/${this.tid}`); await this.cmd('Page.bringToFront'); await sleep(150); }
  async shot(file, full = false) {
    await this.front(); await sleep(150);
    const r = await this.cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
    writeFileSync(join(OUT, file), Buffer.from(r.result.data, 'base64')); console.log(`  📷 ${file}`);
  }
  click(sel) { return this.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) throw new Error('không thấy ${sel.replace(/'/g, '')}'); e.click(); return true})()`); }
  visible(sel) { return this.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; const r=e.getBoundingClientRect(); return !e.closest('[hidden]') && r.width>0 && r.height>0 && getComputedStyle(e).visibility!=='hidden'})()`); }
  noOverflow() { return this.ev(`document.documentElement.scrollWidth <= window.innerWidth + 1`); }
  key(type, key) { const vk = KEYS[key]; return this.cmd('Input.dispatchKeyEvent', { type, key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(type === 'keyDown' && key === ' ' ? { text: ' ' } : {}) }); }
  async hold(key, ms) { await this.front(); await this.key('keyDown', key); await sleep(ms); await this.key('keyUp', key); }
  async center(sel) { return this.ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); }
  async touch(sel, ms = 80, dx = 0) {
    await this.front();
    const c = await this.center(sel); const p = [{ x: c.x + dx, y: c.y, id: 1 }];
    await this.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: p }); await sleep(ms);
    await this.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  pos(i) { return this.last ? { x: this.last.p[i][0], y: this.last.p[i][1], alive: this.last.p[i][3] } : null; }
}

const tabs = [];
try {
  const A = await new Tab('Tèo').open(), B = await new Tab('Tí').open(), C = await new Tab('Sửu').open(390, 844, true);
  tabs.push(A, B, C);

  // ---------- màn đầu + tạo phòng ----------
  await A.go(BASE);
  await A.waitFor(`!/Đang tải/.test(document.getElementById('pubList').textContent)`);
  ok(await A.visible('.home__poster') && await A.ev(`document.querySelector('.home__poster').naturalWidth>0`), 'màn đầu: poster tải được');
  await A.shot('01-home-desktop.png');
  // tên khách giờ tự sinh (_shared/account.js) ⇒ ô tên luôn điền sẵn; kiểm tra hợp lệ khi người chơi sửa tên
  const autoName = await A.ev(`document.getElementById('nameInp').value`);
  ok(autoName.trim().length > 0 && autoName.length <= 16, `người mới: ô tên điền sẵn tên khách tự sinh (“${autoName}”)`);
  // PARTY2-06 (D8): không cắt im lặng ở 16 nữa — bộ đếm n/16, dài quá thì nhắc và không tạo phòng
  await A.ev(`(()=>{const i=document.getElementById('nameInp'); i.value='Nguyễn Thị Thanh Hương'; i.dispatchEvent(new Event('input'))})()`);
  ok(/^22\/16 · dài quá$/.test(await A.ev(`document.getElementById('nameCount').textContent`)), 'ô tên có bộ đếm n/16, báo "dài quá"');
  await A.click('#createBtn');
  await sleep(300);
  ok(/Tên tối đa 16 ký tự — bớt 6/.test(await A.ev(`document.getElementById('homeMsg').textContent`)) && await A.ev(`document.getElementById('game').hidden`), 'tên dài quá ⇒ nhắc bớt ký tự, không tạo phòng');
  await A.ev(`document.getElementById('nameInp').value='   '`);
  await A.click('#createBtn');
  await sleep(300);
  ok(/Nhập tên|tên/i.test(await A.ev(`document.getElementById('homeMsg').textContent`)) && await A.ev(`document.getElementById('game').hidden`),
    'xoá trắng tên rồi bấm Tạo phòng ⇒ nhắc nhập tên, không tạo phòng');
  ok(await A.ev(`document.activeElement===document.getElementById('nameInp')`), 'tên trống ⇒ con trỏ về ô tên');
  await A.ev(`document.getElementById('nameInp').value='Tèo'`);
  await A.click('#createBtn');
  await A.waitFor(`!document.getElementById('game').hidden && !document.getElementById('ovLobby').hidden`);
  ok(!(await A.ev(`document.getElementById('privToggle').checked`)), 'phòng mới mặc định công khai (ô Phòng kín để trống)');
  await A.click('#leaveBtn');
  await A.waitFor(`!document.getElementById('home').hidden`);
  await A.click('#privateRoom');
  await A.click('#createBtn');
  await A.waitFor(`!document.getElementById('game').hidden && !document.getElementById('ovLobby').hidden`);
  const code = await A.ev(`document.getElementById('lobCode').textContent`);
  ok(/^[A-Z2-9]{5}$/.test(code), `tạo phòng kín, mã ${code}`);
  ok(await A.ev(`document.getElementById('privToggle').checked`), 'tích Phòng kín giữ phòng ngoài sảnh');
  ok(new URL(await A.ev('location.href')).searchParams.get('p') === code, 'địa chỉ trang mang mã phòng (?p=) để chép mời');
  ok(await A.visible('#startBtn') && await A.ev(`document.getElementById('startBtn').getAttribute('aria-disabled')`) === 'true', 'chủ phòng thấy nút Bắt đầu, còn mờ khi chỉ có 1 người');
  await A.click('#startBtn');
  await sleep(200);
  ok(await A.ev(`document.getElementById('ovLobby').hidden===false`), '1 người bấm Bắt đầu: vẫn ở phòng chờ');

  // ---------- bạn vào bằng link mời ----------
  await B.go(`${BASE}?p=${code}`);
  ok(await B.ev(`document.getElementById('codeInp').value`) === code, 'link mời điền sẵn mã phòng');
  await B.ev(`document.getElementById('nameInp').value='Tí'`);
  await B.ev(`document.getElementById('joinForm').requestSubmit()`);
  await B.waitFor(`!document.getElementById('ovLobby').hidden`);
  ok(!(await B.visible('#startBtn')), 'người không phải chủ phòng không thấy nút Bắt đầu');
  ok(/Chờ chủ phòng/.test(await B.ev(`document.getElementById('lobNote').textContent`)), 'người vào thấy "Chờ chủ phòng bắt đầu"');
  await A.waitFor(`document.querySelectorAll('#pplList li').length===2`);

  // ---------- bật công khai, người lạ (điện thoại) vào từ danh sách ----------
  await A.click('#privToggle');
  await B.waitFor(`!document.getElementById('privToggle').checked`);
  ok(await B.ev(`document.getElementById('privToggle').disabled`), 'chỉ chủ phòng đổi được Phòng kín');
  await C.go(BASE);
  await C.waitFor(`document.querySelector('#pubList [data-code="${code}"]')`, 8000);
  ok(true, 'phòng công khai hiện trong danh sách của người lạ');
  ok(await C.ev(`document.body.classList.contains('is-touch')`), 'điện thoại: nhận ra màn cảm ứng');
  ok(await C.noOverflow(), 'điện thoại màn đầu: không tràn ngang');
  await C.shot('02-home-mobile.png');
  await C.ev(`document.getElementById('nameInp').value='Sửu'`);
  await C.click(`#pubList [data-code="${code}"]`);
  await C.waitFor(`!document.getElementById('ovLobby').hidden`);
  await A.waitFor(`document.querySelectorAll('#pplList li').length===3`);
  ok(/3 người/.test(await A.ev(`document.getElementById('lobNote').textContent`)), 'chủ phòng thấy 3 người sẵn sàng');

  // ---------- chat ----------
  await A.ev(`(()=>{document.getElementById('chatInp').value='Chào cả nhà!';document.getElementById('chatForm').requestSubmit()})()`);
  await C.waitFor(`/Chào cả nhà!/.test(document.getElementById('chatLog').textContent)`);
  await C.ev(`(()=>{document.getElementById('chatInp').value='Sửu vào rồi đây';document.getElementById('chatForm').requestSubmit()})()`);
  await B.waitFor(`/Sửu vào rồi đây/.test(document.getElementById('chatLog').textContent)`);
  ok(await A.ev(`document.querySelector('#chatLog .msg.mine')?.textContent.includes('Chào cả nhà')`), 'chat: tin của mình được đánh dấu, cả phòng nhận được');
  await B.ev(`(()=>{document.getElementById('chatInp').value='<img src=x onerror=alert(1)>';document.getElementById('chatForm').requestSubmit()})()`);
  await A.waitFor(`/onerror/.test(document.getElementById('chatLog').textContent)`);
  ok(await A.ev(`!document.querySelector('#chatLog img')`), 'chat: thẻ HTML hiện như chữ, không chạy');
  await A.shot('03-lobby-desktop.png');
  await C.shot('04-lobby-mobile.png');
  ok(await A.noOverflow() && await C.noOverflow(), 'phòng chờ: không tràn ngang (desktop + điện thoại)');

  // ---------- bắt đầu ----------
  await A.click('#startBtn');
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovCount').hidden`, 5000)));
  ok(true, 'cả 3 tab thấy đếm ngược');
  await C.shot('05-countdown-mobile.png');
  await Promise.all(tabs.map((t) => t.waitFor(`document.getElementById('ovCount').hidden && document.getElementById('ovLobby').hidden`, 8000)));
  ok(await C.visible('#bombBtn') && await C.visible('.dpad'), 'điện thoại: hiện D-pad + nút BOM');
  ok(!(await A.visible('#bombBtn')), 'desktop: không hiện nút cảm ứng');
  const fps0 = A.nFrames; await sleep(1000);
  ok(A.nFrames - fps0 >= 14, `máy chủ gửi khung đều (~${A.nFrames - fps0}/giây)`);
  ok(/\d:\d\d/.test(await A.ev(`document.getElementById('hudTime').textContent`)), 'HUD có đồng hồ');

  // ---------- đi bằng phím thật ----------
  const a0 = A.pos(0);
  await A.hold('ArrowRight', 500); await sleep(250);
  const a1 = B.pos(0); // vị trí người 0 theo khung mà tab KHÁC nhận ⇒ máy chủ đã chấp nhận
  ok(a1.x - a0.x >= 0.8 && a1.y === a0.y, `phím → đi sang phải, máy chủ chấp nhận (${a0.x.toFixed(2)} → ${a1.x.toFixed(2)})`);
  await A.hold('ArrowLeft', 120); await sleep(200);
  const a2 = B.pos(0);
  ok(a2.x < a1.x, 'phím ← đi ngược lại');

  // điện thoại: D-pad — ghế 2 ở góc trên phải (11,1): đi sang trái
  const c0 = A.pos(2);
  await C.touch('.dpad button[data-dir="l"]', 400); await sleep(250);
  const c1 = A.pos(2);
  ok(c0.x - c1.x >= 0.5, `D-pad cảm ứng: đi sang trái (${c0.x.toFixed(2)} → ${c1.x.toFixed(2)})`);

  // ---------- đặt bom: A bằng Space, C bằng nút BOM; cả hai đứng yên ⇒ tự nổ; B thắng ----------
  await A.front(); await A.key('keyDown', ' '); await A.key('keyUp', ' ');
  await C.touch('#bombBtn', 60);
  await B.waitFor(`true`); await sleep(300);
  ok(B.last.b.length === 2, `máy chủ nhận 2 quả bom (Space + nút BOM), thấy ở tab thứ ba: ${B.last.b.length}`);
  await A.shot('06-play-desktop.png');
  await C.shot('07-play-mobile.png');
  ok(await A.noOverflow() && await C.noOverflow(), 'đang chơi: không tràn ngang');
  { // chụp ngay lúc lửa đang cháy (0,5 s) để xem sprite nổ trên renderer thật
    const t0 = Date.now(); while (!(B.last?.fl?.length) && Date.now() - t0 < 6000) await sleep(20);
    ok(B.last?.fl?.length > 0, `bom nổ: máy chủ gửi ${B.last?.fl?.length || 0} ô lửa`);
    await sleep(120);
    const r = await B.cmd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, '06b-boom-desktop.png'), Buffer.from(r.result.data, 'base64')); console.log('  📷 06b-boom-desktop.png');
  }
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovEnd').hidden`, 8000)));
  ok(await B.ev(`document.getElementById('endTitle').textContent`) === 'Bạn thắng!', 'người sống sót cuối cùng: "Bạn thắng!"');
  ok(await A.ev(`document.getElementById('endTitle').textContent`) === 'Tí thắng!', 'người thua thấy tên người thắng');
  ok(/sống sót/.test(await A.ev(`document.getElementById('endKick').textContent`)), 'lý do: người sống sót cuối cùng');
  ok(/1<\/b> thắng/.test(await C.ev(`document.getElementById('pplList').innerHTML`)), 'danh sách người chơi cộng 1 trận thắng cho Tí');
  await sleep(600);
  await B.shot('08-end-desktop.png');
  await C.shot('09-end-mobile.png');
  ok(await C.noOverflow(), 'màn kết thúc điện thoại: không tràn ngang');
  ok(await A.visible('#toLobbyBtn') && !(await B.visible('#toLobbyBtn')), 'chỉ chủ phòng thấy "Về phòng chờ"');
  const t1 = await A.ev(`document.getElementById('hudTime').textContent`); await sleep(1200);
  ok(await A.ev(`document.getElementById('hudTime').textContent`) === t1, 'hết ván: đồng hồ đứng yên');

  // ---------- ván mới ⇒ hết giờ ⇒ hoà ----------
  await B.click('#againBtn');
  await Promise.all(tabs.map((t) => t.waitFor(`document.getElementById('ovEnd').hidden && !document.getElementById('ovCount').hidden`, 5000)));
  ok(true, 'ai bấm "Ván mới" cũng được: cả phòng sang ván 2');
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovEnd').hidden`, 30000)));
  ok(/Hết giờ/.test(await A.ev(`document.getElementById('endKick').textContent`)), 'hết 20 s ⇒ kết thúc vì hết giờ');
  ok(await A.ev(`document.getElementById('endTitle').textContent`) === 'Hoà!', 'không ai ghi điểm ⇒ hoà');
  await A.shot('10-timeout-desktop.png');

  // ---------- chủ phòng về phòng chờ; một người rời ----------
  await A.click('#toLobbyBtn');
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovLobby').hidden && document.getElementById('ovEnd').hidden`, 5000)));
  ok(true, 'chủ phòng đưa cả phòng về phòng chờ');
  await C.click('#leaveBtn');
  await C.waitFor(`!document.getElementById('home').hidden`);
  await A.waitFor(`document.querySelectorAll('#pplList li').length===2`);
  ok(true, 'người rời phòng về màn đầu, phòng còn 2 người');
  ok(await A.ev(`document.querySelectorAll('#pplList li').length`) === 2, 'danh sách cập nhật sau khi rời');

  // ---------- tải lại trang giữa chừng vẫn vào lại đúng ghế ----------
  await B.go(`${BASE}?p=${code}`);
  await B.waitFor(`!document.getElementById('game').hidden && /\\(bạn\\)/.test(document.getElementById('pplList').textContent)`);
  ok((await B.ev(`document.querySelector('#pplList li:nth-child(2) .ppl__nm').textContent`)).includes('Tí (bạn)'), 'tải lại trang: vào lại đúng ghế cũ');

  for (const t of tabs) {
    ok(t.errors.length === 0, `${t.name}: không lỗi JS${t.errors.length ? ' — ' + t.errors.join(' | ') : ''}`);
    ok(t.console.length === 0, `${t.name}: không ghi console${t.console.length ? ' — ' + t.console.join(' | ') : ''}`);
  }
} catch (e) {
  fails++; console.error('✘ DỪNG:', e.message);
  for (const t of tabs) console.error(`  ${t.name}: khung=${t.nFrames}`, await t.ev(`JSON.stringify({lob:document.getElementById('ovLobby').hidden,cnt:document.getElementById('ovCount').hidden,end:document.getElementById('ovEnd').hidden,banner:document.getElementById('banner').textContent,vis:document.visibilityState})`).catch(() => '?'), t.errors.join(' | '));
} finally {
  chrome.kill(); server.close();
  console.log(fails ? `\n${fails} lỗi` : '\nTất cả đạt'); console.log(`Ảnh: ${OUT}`);
  process.exit(fails ? 1 : 0);
}
