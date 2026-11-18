// E2E Ma Sói trên Chrome headless thật: 6 tab = 6 người chơi thật qua máy chủ thật (server.js + MASOI_ONLINE=1).
// Mỗi tab chỉ dựa vào chính màn hình của nó (thẻ vai của mình) để chơi. Bắt mọi khung WebSocket mỗi tab nhận được
// và kiểm: không tab nào thấy vai người khác khi chưa được phép; không có console.log nào từ trang.
// Chạy: node games-server/ma-soi/test/browser-e2e.mjs [thư mục ảnh]   (mặc định prototype/games/ma-soi/screenshots/)
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const OUT = process.argv[2] || join(REPO, 'prototype/games/ma-soi/screenshots');
mkdirSync(OUT, { recursive: true });
process.env.MASOI_ONLINE = '1';
process.env.MASOI_SPEED = process.env.MASOI_SPEED || '0.3';
const server = createRequire(import.meta.url)(join(REPO, 'server.js'));
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/games/ma-soi/`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.error('Không thấy Chrome/Edge'); process.exit(2); }
const prof = await mkdtemp(join(tmpdir(), 'masoi-e2e-'));
const DPORT = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DPORT}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--no-first-run',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, msg) => { console.log(`${c ? '✔' : '✘'} ${msg}`); if (!c) fails++; };

for (let i = 0; i < 80; i++) { try { await fetch(`http://127.0.0.1:${DPORT}/json/version`); break; } catch { await sleep(250); } }

class Tab {
  constructor(name) { this.name = name; this.id = 0; this.pend = new Map(); this.frames = []; this.console = []; this.errors = []; }
  async open() {
    const t = await (await fetch(`http://127.0.0.1:${DPORT}/json/new?about:blank`, { method: 'PUT' })).json();
    this.tid = t.id; this.ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((r) => (this.ws.onopen = r));
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pend.has(m.id)) { this.pend.get(m.id)(m); this.pend.delete(m.id); }
      if (m.method === 'Network.webSocketFrameReceived') this.frames.push(m.params.response.payloadData);
      if (m.method === 'Runtime.consoleAPICalled') this.console.push(m.params.type);
      if (m.method === 'Runtime.exceptionThrown') this.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    };
    await this.cmd('Runtime.enable'); await this.cmd('Network.enable'); await this.cmd('Page.enable');
    await this.size(1366, 860);
    return this;
  }
  cmd(method, params = {}) { return new Promise((r) => { const i = ++this.id; this.pend.set(i, r); this.ws.send(JSON.stringify({ id: i, method, params })); }); }
  async ev(expr) {
    const r = await this.cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(`${this.name}: ${expr.slice(0, 100)} :: ${r.result.exceptionDetails.exception?.description}`);
    return r.result?.result?.value;
  }
  size(w, h, mobile = false) { return this.cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }); }
  async go(url) { await this.cmd('Page.navigate', { url }); await this.waitFor('document.readyState==="complete"'); await sleep(200); }
  async waitFor(expr, ms = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await this.ev(`!!(${expr})`)) return true; await sleep(100); }
    throw new Error(`${this.name}: hết giờ chờ ${expr}`);
  }
  async shot(file) {
    await fetch(`http://127.0.0.1:${DPORT}/json/activate/${this.tid}`); await sleep(250);
    const r = await this.cmd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, file), Buffer.from(r.result.data, 'base64')); console.log(`  📷 ${file}`);
  }
  role() { return this.ev(`document.getElementById('meRole').textContent`); }
  phase() { return this.ev(`document.getElementById('phaseTxt').textContent`); }
  seat() { return this.ev(`[...document.querySelectorAll('.seat--me')].map(b=>+b.dataset.seat)[0]`); }
  click(sel) { return this.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) throw new Error('không thấy ${sel.replace(/'/g, '')}'); e.click(); return true})()`); }
}

const NAMES = ['Tí Còi', 'Bé Na', 'Chú Tư', 'Cô Ba', 'Anh Hai', 'Út Mập'];
const tabs = [];
try {
  for (const n of NAMES) tabs.push(await new Tab(n).open());
  const [host] = tabs;

  // ---- màn đầu + tạo phòng ----
  await host.go(BASE);
  await host.shot('01-home-desktop.png');
  await host.ev(`document.getElementById('nameInp').value=${JSON.stringify(NAMES[0])}`);
  await host.click('#createBtn');
  await host.waitFor(`!document.getElementById('game').hidden`);
  const code = await host.ev(`document.getElementById('barCodeTxt').textContent`);
  ok(/^[A-HJKMNP-Z2-9]{5}$/.test(code), `tạo phòng, mã ${code}`);
  for (let i = 1; i < 6; i++) {
    const t = tabs[i];
    await t.go(`${BASE}?p=${code}`);
    ok(await t.ev(`document.getElementById('codeInp').value`) === code, `${t.name}: link mời điền sẵn mã`);
    await t.ev(`document.getElementById('nameInp').value=${JSON.stringify(NAMES[i])}`);
    await t.click('#joinBtn');
    await t.waitFor(`!document.getElementById('game').hidden`);
  }
  await host.waitFor(`document.querySelectorAll('.seat[data-seat]').length===6`);
  await host.shot('02-lobby-desktop.png');

  // ---- bắt đầu, phát thẻ ----
  await host.click('[data-a="start"]');
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovReveal').hidden`)));
  const roles = {};
  for (const t of tabs) { t.r = await t.role(); t.s = await t.seat(); roles[t.s] = t.r; }
  console.log('  vai (mỗi tab tự đọc thẻ của mình):', tabs.map((t) => `${t.name}=${t.r}`).join(', '));
  const wolves = tabs.filter((t) => t.r === 'Ma Sói'), seer = tabs.find((t) => t.r === 'Tiên Tri'), guard = tabs.find((t) => t.r === 'Bảo Vệ');
  const villagers = tabs.filter((t) => t.r === 'Dân Làng');
  ok(wolves.length === 2 && seer && guard && villagers.length === 2, 'chia vai 2 Sói / Tiên Tri / Bảo Vệ / 2 Dân');
  await sleep(900);
  await wolves[0].shot('03-reveal-wolf.png');

  // ---- đêm 1 ----
  await Promise.all(tabs.map((t) => t.waitFor(`document.body.classList.contains('is-night') && document.getElementById('ovReveal').hidden`)));
  const villagerSeatsSeenByWolf = await wolves[0].ev(`[...document.querySelectorAll('.seat--can')].map(b=>+b.dataset.seat)`);
  ok(!villagerSeatsSeenByWolf.includes(wolves[1].s), 'Sói không chọn được đồng bọn');
  const victim1 = villagers[0];
  for (const w of wolves) await w.click(`.seat[data-seat="${victim1.s}"]`);
  await wolves[0].ev(`(()=>{document.getElementById('tabWolf').click();const i=document.getElementById('chatInp');i.value='Cắn ${victim1.name} nhé';document.getElementById('chatForm').requestSubmit()})()`);
  await seer.click(`.seat[data-seat="${wolves[0].s}"]`);
  await guard.click(`.seat[data-seat="${guard.s}"]`);
  await seer.waitFor(`document.querySelector('#seerLog li')`);
  ok((await seer.ev(`document.getElementById('seerLog').textContent`)).includes('phe Sói'), 'Tiên Tri soi ra phe Sói');
  await sleep(1300); // chờ chuyển cảnh xong
  await wolves[0].shot('04-night-wolf-desktop.png');
  await seer.shot('05-night-seer-desktop.png');
  await villagers[1].size(390, 844, true);
  await villagers[1].shot('06-night-villager-mobile.png');

  // ---- bình minh / ngày 1 ----
  await Promise.all(tabs.map((t) => t.waitFor(`/Bình minh/.test(document.getElementById('phaseTxt').textContent)`, 20000)));
  await sleep(400);
  await host.shot('07-dawn-desktop.png');
  ok((await host.ev(`document.getElementById('chatLog').textContent`)).includes(`${victim1.name} bị Sói cắn`), `đêm 1: ${victim1.name} bị cắn, cả làng thấy`);
  await Promise.all(tabs.map((t) => t.waitFor(`/Ban ngày/.test(document.getElementById('phaseTxt').textContent)`, 20000)));
  await seer.ev(`(()=>{const i=document.getElementById('chatInp');i.value='Tôi soi rồi, ${wolves[0].name} là Sói!';document.getElementById('chatForm').requestSubmit()})()`);
  await guard.click('#quick [data-q="3"]');
  await sleep(1300);
  await villagers[1].shot('08-day-mobile.png');

  // ---- bỏ phiếu: cả làng treo Sói 1 ----
  const alive = () => tabs.filter((t) => t !== victim1);
  await Promise.all(alive().map((t) => t.waitFor(`/Bỏ phiếu/.test(document.getElementById('phaseTxt').textContent)`, 30000)));
  for (const t of alive()) { if (t === wolves[0]) await t.click('[data-a="skip"]'); else if (t !== villagers[1]) await t.click(`.seat[data-seat="${wolves[0].s}"]`); }
  await sleep(500);
  await host.shot('09-vote-desktop.png');
  await villagers[1].shot('10-vote-mobile.png');
  await villagers[1].click(`.seat[data-seat="${wolves[0].s}"]`);
  await host.waitFor(`/Phán quyết/.test(document.getElementById('phaseTxt').textContent)`);
  ok((await host.ev(`document.getElementById('chatLog').textContent`)).includes(`${wolves[0].name} bị treo cổ — là Ma Sói`), 'ngày 1: treo đúng Sói');

  // ---- đêm 2: Sói còn lại cắn, Bảo Vệ chặn đúng ⇒ bình yên; ngày 2 treo nốt ----
  await Promise.all(alive().map((t) => t.waitFor(`document.body.classList.contains('is-night')`, 20000)));
  await sleep(300);
  await wolves[1].click(`.seat[data-seat="${seer.s}"]`);
  await guard.click(`.seat[data-seat="${seer.s}"]`);
  const alive2 = alive().filter((t) => t !== wolves[0]);
  await Promise.all(alive2.map((t) => t.waitFor(`/Bình minh/.test(document.getElementById('phaseTxt').textContent)`, 20000)));
  ok((await host.ev(`document.getElementById('chatLog').textContent`)).includes('Đêm 2: bình yên'), 'đêm 2: Bảo Vệ chặn được Sói');
  await Promise.all(alive2.map((t) => t.waitFor(`/Bỏ phiếu/.test(document.getElementById('phaseTxt').textContent)`, 40000)));
  for (const t of alive2) { if (t === wolves[1]) await t.click(`.seat[data-seat="${seer.s}"]`); else await t.click(`.seat[data-seat="${wolves[1].s}"]`); }

  // ---- hết ván ----
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovEnd').hidden`, 20000)));
  ok(/Dân làng/.test(await host.ev(`document.getElementById('endTitle').textContent`)), 'Dân làng thắng');
  await host.shot('11-end-desktop.png');
  await villagers[1].shot('12-end-mobile.png');

  // ---- kiểm rò rỉ trên từng tab: mọi khung WebSocket nhận được ----
  const wolfSeats = wolves.map((w) => w.s);
  let leaksFound = [];
  for (const t of tabs) {
    for (const f of t.frames) {
      let m; try { m = JSON.parse(f); } catch { continue; }
      if (m.t !== 'state') continue;
      const v = m.v, iWolf = wolfSeats.includes(v.seat), over = v.phase === 'end';
      for (const p of v.players) if ('role' in p && !(p.seat === v.seat || over || !p.alive || (iWolf && p.role === 'wolf' && wolfSeats.includes(p.seat)))) leaksFound.push(`${t.name} thấy vai ghế ${p.seat} ở ${v.phase}`);
      if (!iWolf && ('wolfChat' in v || v.night?.pack)) leaksFound.push(`${t.name} nhận kênh Sói`);
      if ('seer' in v && t !== seer) leaksFound.push(`${t.name} nhận kết quả soi`);
    }
    // trước khi hết ván, không có chữ "Cắn ..." (kênh Sói) trong khung của dân
  }
  ok(leaksFound.length === 0, `không rò vai/kênh Sói/kết quả soi qua mạng (${tabs.reduce((a, t) => a + t.frames.length, 0)} khung đã kiểm)${leaksFound.length ? ': ' + leaksFound.slice(0, 5).join('; ') : ''}`);
  const villagerNightFrames = villagers[1].frames.filter((f) => f.includes('"phase":"night"')).length;
  ok(villagerNightFrames <= 4, `dân làng gần như không nhận gói nào trong đêm (${villagerNightFrames} khung, chỉ lúc vào đêm/kết nối)`);
  ok(tabs.every((t) => t.console.length === 0), `trang không ghi console (${tabs.map((t) => t.console.length).join('/')})`);
  ok(tabs.every((t) => t.errors.length === 0), `không lỗi JS${tabs.some((t) => t.errors.length) ? ': ' + tabs.flatMap((t) => t.errors).slice(0, 3).join(' | ') : ''}`);
  const maps = await (await fetch(BASE + 'app.js')).text();
  ok(!/sourceMappingURL/.test(maps), 'không có source map');

  // ---- chơi lại ----
  await host.click('#againBtn');
  await Promise.all(tabs.map((t) => t.waitFor(`/Phòng chờ/.test(document.getElementById('phaseTxt').textContent)`)));
  ok(await villagers[1].ev(`document.getElementById('meRole').textContent`) === 'Chưa phát thẻ', 'ván mới: về phòng chờ, xoá vai');

  // ---- khách lỡ đóng tab: mở tab mới trên cùng máy ⇒ "Quay lại phòng" về đúng ghế (không tạo người mới) ----
  const last = tabs[5], lastSeat = await last.seat();
  const back = await new Tab('tab mới').open(); tabs.push(back);
  await back.go(BASE);
  ok((await back.ev(`document.querySelector('.home__row').textContent`)).includes(`Quay lại phòng ${code}`), 'tab mới thấy nút Quay lại phòng');
  await back.click('.home__row .btn:last-child');
  await back.waitFor(`!document.getElementById('game').hidden && document.querySelector('.seat--me')`);
  ok(await back.seat() === lastSeat && await back.ev(`document.querySelector('.seat--me .seat__name').textContent`) === NAMES[5], `quay lại đúng ghế của ${NAMES[5]}`);
  await last.waitFor(`/tab khác/.test(document.getElementById('homeMsg').textContent)`);
  ok(await host.ev(`document.querySelectorAll('.seat[data-seat]').length`) === 6, 'phòng vẫn 6 người, không sinh người trùng');
} catch (e) { console.error('✘', e.message); fails++; }
finally {
  for (const t of tabs) try { t.ws.close(); } catch {}
  chrome.kill(); server.closeAllConnections?.(); server.close();
  console.log(fails ? `\n${fails} lỗi` : '\nTất cả đạt');
  setTimeout(() => process.exit(fails ? 1 : 0), 300);
}
