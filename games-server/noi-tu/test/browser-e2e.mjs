// E2E Nối Từ online trên Chrome headless thật: 2 tab = 2 người chơi qua máy chủ thật (server.js + NOITU_ONLINE=1).
// Tab A tạo phòng, tab B mở link mời ?p=MÃ, hai bên thay nhau nối từ bằng ô nhập thật; kiểm cả hai thấy cùng chuỗi,
// gõ sai lượt bị chặn, tải lại trang giữa ván vẫn vào lại đúng ghế, chịu thua + chơi lại cần cả hai đồng ý.
// Chạy: node games-server/noi-tu/test/browser-e2e.mjs [thư mục ảnh]   (mặc định prototype/games/noi-tu/screenshots/online/)
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const OUT = process.argv[2] || join(REPO, 'prototype/games/noi-tu/screenshots/online');
mkdirSync(OUT, { recursive: true });
process.env.NOITU_ONLINE = '1';
const server = createRequire(import.meta.url)(join(REPO, 'server.js'));
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/games/noi-tu/`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.error('Không thấy Chrome/Edge'); process.exit(2); }
const prof = await mkdtemp(join(tmpdir(), 'noitu-online-'));
const DPORT = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DPORT}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--no-first-run',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, msg) => { console.log(`${c ? '✔' : '✘'} ${msg}`); if (!c) fails++; };
for (let i = 0; i < 80; i++) { try { await fetch(`http://127.0.0.1:${DPORT}/json/version`); break; } catch { await sleep(250); } }

class Tab {
  constructor(name) { this.name = name; this.id = 0; this.pend = new Map(); this.errors = []; }
  async open() {
    const t = await (await fetch(`http://127.0.0.1:${DPORT}/json/new?about:blank`, { method: 'PUT' })).json();
    this.tid = t.id; this.ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((r) => (this.ws.onopen = r));
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pend.has(m.id)) { this.pend.get(m.id)(m); this.pend.delete(m.id); }
      if (m.method === 'Runtime.exceptionThrown') this.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    };
    await this.cmd('Runtime.enable'); await this.cmd('Page.enable');
    await this.size(1280, 800);
    return this;
  }
  cmd(method, params = {}) { return new Promise((r) => { const i = ++this.id; this.pend.set(i, r); this.ws.send(JSON.stringify({ id: i, method, params })); }); }
  async ev(expr) {
    const r = await this.cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(`${this.name}: ${expr.slice(0, 100)} :: ${r.result.exceptionDetails.exception?.description}`);
    return r.result?.result?.value;
  }
  size(w, h, mobile = false) { return this.cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }); }
  async go(url) { await this.cmd('Page.navigate', { url }); await this.waitFor('document.readyState==="complete" && window.__game'); await this.ev('window.__game.ready'); await sleep(150); }
  async reload() { await this.cmd('Page.reload'); await sleep(300); await this.waitFor('document.readyState==="complete" && window.__game'); await this.ev('window.__game.ready'); }
  async waitFor(expr, ms = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (await this.ev(`!!(${expr})`)) return true; } catch { /* trang đang tải */ } await sleep(100); }
    throw new Error(`${this.name}: hết giờ chờ ${expr}`);
  }
  async shot(file) {
    await fetch(`http://127.0.0.1:${DPORT}/json/activate/${this.tid}`); await sleep(250);
    const r = await this.cmd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, file), Buffer.from(r.result.data, 'base64')); console.log(`  📷 ${file}`);
  }
  click(sel) { return this.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) throw new Error('không thấy'); e.click(); return true})()`); }
  text(sel) { return this.ev(`document.querySelector(${JSON.stringify(sel)}).textContent`); }
  st() { return this.ev(`(()=>{const g=window.__game,s=g.state; return s && {seq:s.seq, seat:g.session?.mySeat, turn:s.round?.turn, over:s.round?.over, chain:s.round?.chain.map(c=>c.word), score:s.score, names:s.seats.map(x=>x.name), rematch:s.rematch}})()`); }
  /** chọn một từ nối hợp lệ (không cụt) bằng từ điển của trang, rồi gõ vào ô nhập và bấm Nối */
  async play() {
    const w = await this.ev(`(()=>{const g=window.__game, r=g.state.round, d=g.dict, last=r.chain.at(-1);
      const pool = last ? d.startsWith(last.word.split(' ')[1]) : d.all();
      const used = new Set(r.used);
      return pool.find(k => !used.has(k) && d.countNext(k.split(' ')[1], new Set([...used, k])) > 0); })()`);
    await this.ev(`(()=>{const i=document.getElementById('inp'); i.value=${JSON.stringify(w)}; document.getElementById('sendBtn').click(); return true})()`);
    return w;
  }
}

let A, B;
try {
  A = await new Tab('A').open(); B = await new Tab('B').open();

  // ---- A tạo phòng ----
  await A.go(BASE);
  await A.click('.seg[data-k="mode"] button[data-v="online"]');
  await A.ev(`document.getElementById('oName').value='Lan'`);
  await A.shot('01-menu-online.png');
  await A.click('#createBtn');
  await A.waitFor(`!document.getElementById('mLobby').hidden`);
  const code = await A.text('#lCode');
  ok(/^[A-HJKMNP-Z2-9]{5}$/.test(code), `A tạo phòng, mã ${code}`);
  await A.shot('02-lobby-code.png');

  // ---- B mở link mời ----
  await B.go(`${BASE}?p=${code}`);
  ok((await B.ev(`document.getElementById('oCode').value`)) === code, 'link mời điền sẵn mã phòng, chọn sẵn Online');
  await B.ev(`document.getElementById('oName').value='Minh'`);
  await B.click('#enterBtn');
  await A.waitFor(`window.__game.state?.round`); await B.waitFor(`window.__game.state?.round`);
  const sa = await A.st(), sb = await B.st();
  ok(sa.seat !== sb.seat && sa.seat != null && sb.seat != null, `hai tab ở hai ghế khác nhau (${sa.seat}/${sb.seat})`);
  ok(JSON.stringify(sa.names) === JSON.stringify(['Lan', 'Minh']), `tên người chơi đúng: ${sa.names}`);
  ok(!(await A.ev(`document.body.innerText.includes('Máy')`)), 'giao diện online không còn chữ "Máy"');
  ok((await B.ev(`location.search`)) === '', 'link mời được xoá khỏi thanh địa chỉ sau khi vào');

  // ---- gõ sai lượt bị chặn ở giao diện + server ----
  const [T, W] = sa.turn === sa.seat ? [A, B] : [B, A];
  await W.ev(`(()=>{const i=document.getElementById('inp'); i.value='học tập'; document.getElementById('sendBtn').click(); return true})()`);
  await sleep(200);
  ok((await W.st()).chain.length === 0, 'người không tới lượt gửi từ ⇒ không được tính');
  const r1 = await W.ev(`window.__game.session.submit('học tập')`);
  ok(r1.ok === false && r1.reason === 'not-your-turn', `gọi thẳng submit khi chưa tới lượt ⇒ server từ chối (${r1.reason})`);

  // ---- chơi 6 nước luân phiên ----
  let p = T, q = W;
  for (let i = 0; i < 6; i++) {
    const n = (await p.st()).chain.length;
    const w = await p.play();
    await q.waitFor(`window.__game.state.round.chain.length===${n + 1}`, 8000);
    [p, q] = [q, p];
    if (i === 1) await A.shot('03-A-dang-choi.png');
  }
  const ca = await A.st(), cb = await B.st();
  ok(ca.chain.length === 6 && JSON.stringify(ca.chain) === JSON.stringify(cb.chain) && ca.seq === cb.seq, `6 nước, hai tab cùng chuỗi: ${ca.chain.join(' → ')}`);
  await B.shot('04-B-cung-chuoi.png');

  // ---- trò chuyện: đi qua máy chủ, hiện ở cả hai tab, không chèn được HTML ----
  const say = (t, msg) => t.ev(`(()=>{document.getElementById('chatInp').value=${JSON.stringify(msg)}; document.getElementById('chatSend').click(); return true})()`);
  ok(!(await A.ev(`document.getElementById('chat').hidden`)) && (await A.ev(`getComputedStyle(document.getElementById('chat')).display`)) !== 'none', 'desktop: khung chat hiện cạnh bàn chơi');
  await say(A, 'Chào Minh <img src=x onerror=alert(1)>');
  await B.waitFor(`document.querySelector('#chatLog li:not(.sys)')?.textContent.includes('Chào Minh')`, 5000);
  ok(!(await B.ev(`!!document.querySelector('#chatLog img')`)), 'tin nhắn hiện dạng chữ thuần (không chèn HTML)');
  ok((await B.text('#chatLog li:last-child b')) === 'Lan', 'B thấy tên người gửi "Lan" (máy chủ gắn tên)');
  await say(B, 'Chào Lan, chơi tiếp nào!');
  await A.waitFor(`document.querySelectorAll('#chatLog li:not(.sys)').length===2`, 5000);
  ok((await A.text('#chatLog li.me b')) === 'Bạn', 'tin của chính mình ghi "Bạn", căn phải');
  await A.shot('04b-A-chat.png');

  // ---- từ sai luật ----
  const r2 = await p.ev(`window.__game.session.submit(window.__game.state.round.chain.at(-1).word.split(' ')[1] + ' qqq')`);
  ok(r2.ok === false && r2.reason === 'not-in-dict', `từ không có trong từ điển ⇒ từ chối (${r2.reason})`);

  // ---- tải lại trang giữa ván: vào lại đúng ghế, cùng chuỗi ----
  const seatB = (await B.st()).seat;
  await B.reload();
  await B.waitFor(`window.__game.state?.round && window.__game.session?.status==='live'`);
  const rb = await B.st();
  ok(rb.seat === seatB && JSON.stringify(rb.chain) === JSON.stringify(ca.chain), 'B tải lại trang ⇒ vào lại đúng ghế, đủ chuỗi');
  await B.waitFor(`document.querySelectorAll('#chatLog li:not(.sys)').length===2`, 5000);
  ok(true, 'B tải lại trang ⇒ vẫn thấy lại tin nhắn trong phòng');

  // ---- mở menu online không dừng ván ----
  await A.click('#menuBtn');
  ok(!(await A.ev(`document.getElementById('mRoom').hidden`)) && (await A.ev(`window.__game.session?.status`)) === 'live', 'menu online: ván vẫn chạy, có nút Rời phòng');
  await A.shot('05-menu-trong-phong.png');
  await A.click('#backBtn');

  // ---- chịu thua + chơi lại cần cả hai ----
  await A.click('#resignBtn'); await A.click('#resignBtn');
  await B.waitFor(`window.__game.state.round.over`);
  const eb = await B.st();
  ok(eb.score[1 - (await A.st()).seat] === 1, `A chịu thua ⇒ B được 1 điểm (${eb.score})`);
  await B.shot('06-B-thang.png');
  await A.click('#nextBtn');
  await sleep(400);
  ok((await A.st()).over === true, 'mới A bấm chơi tiếp ⇒ ván chưa bắt đầu');
  ok((await B.ev(`document.getElementById('eNext').textContent`)).includes('muốn chơi tiếp'), 'B thấy "Lan muốn chơi tiếp!"');
  await B.click('#nextBtn');
  await A.waitFor(`window.__game.state.round && !window.__game.state.round.over && window.__game.state.roundNo===2`);
  ok(true, 'cả hai đồng ý ⇒ ván 2 bắt đầu');

  // ---- điện thoại ----
  await B.size(390, 844, true); await sleep(300);
  await B.shot('07-B-mobile.png');
  ok((await B.ev(`getComputedStyle(document.getElementById('chat')).display`)) === 'none' && (await B.ev(`getComputedStyle(document.getElementById('chatBtn')).display`)) !== 'none',
    'điện thoại: chat thu vào nút 💬, không che bàn chơi');
  await say(A, 'Bạn đang dùng điện thoại à?');
  await B.waitFor(`!document.getElementById('chatBadge').hidden && document.getElementById('chatBadge').textContent==='1'`, 5000);
  ok(true, 'điện thoại: có tin mới ⇒ nút chat hiện số 1');
  await B.click('#chatBtn'); await sleep(200);
  ok((await B.ev(`getComputedStyle(document.getElementById('chat')).display`)) !== 'none' && (await B.ev(`document.getElementById('chatBadge').hidden`)), 'bấm nút ⇒ mở khung chat, xoá số tin chưa đọc');
  await B.shot('08-B-mobile-chat.png');
  await B.click('#chatClose');

  // ---- rời phòng ----
  await A.click('#menuBtn'); await A.click('#leaveBtn');
  await B.waitFor(`window.__game.session?.status==='opponent-left'`, 5000);
  ok(true, 'A rời phòng ⇒ B được báo đối thủ mất kết nối');

  ok(A.errors.length === 0 && B.errors.length === 0, `không có lỗi JS (${[...A.errors, ...B.errors].join(' | ')})`);
} catch (e) {
  console.error(e); fails++;
} finally {
  chrome.kill(); server.close(); server.closeAllConnections?.();
  console.log(fails ? `\n✘ ${fails} lỗi` : '\n✔ E2E online xong');
  process.exit(fails ? 1 : 0);
}
