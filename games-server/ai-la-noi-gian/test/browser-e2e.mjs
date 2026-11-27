// E2E Ai Là Nội Gián trên Chrome headless thật, máy chủ thật (server.js).
//  Phần A: 6 tab = 6 người thật chơi trọn một ván theo kịch bản (mỗi tab chỉ dựa vào thẻ vai của chính nó).
//  Phần B: 1 người + 5 bot do máy chủ điều khiển chơi trọn một ván trên khung điện thoại 390×844.
// Bắt mọi khung WebSocket mỗi tab nhận và kiểm: không tab nào thấy vai/kênh mã hóa/kết quả quét khi chưa được phép;
// trang không ghi console, không lỗi JS.
// Chạy: node games-server/ai-la-noi-gian/test/browser-e2e.mjs [thư mục ảnh]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { tempProfile, guardChrome, shotDir } from '../../../prototype/games/_shared/test/lk-temp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const OUT = process.argv[2] || shotDir('noi-gian');
mkdirSync(OUT, { recursive: true });
process.env.NOIGIAN_SPEED = process.env.NOIGIAN_SPEED || '0.3';
const server = createRequire(import.meta.url)(join(REPO, 'server.js'));
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/games/ai-la-noi-gian/`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.error('Không thấy Chrome/Edge'); process.exit(2); }
const prof = tempProfile('noi-gian'); // %TEMP%/lk-e2e-noi-gian-*, tự xoá khi thoát (kể cả Ctrl+C / bị giết cứng)
const DPORT = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DPORT}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--no-first-run',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, prof);
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
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|fonts\.g/.test(m.params.entry.url || '')) this.errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`);
    };
    await this.cmd('Runtime.enable'); await this.cmd('Network.enable'); await this.cmd('Page.enable'); await this.cmd('Log.enable');
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
  async shot(file, full = false) {
    await fetch(`http://127.0.0.1:${DPORT}/json/activate/${this.tid}`); await sleep(250);
    const r = await this.cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
    writeFileSync(join(OUT, file), Buffer.from(r.result.data, 'base64')); console.log(`  📷 ${file}`);
  }
  role() { return this.ev(`document.getElementById('meRole').textContent`); }
  phase() { return this.ev(`document.getElementById('phaseTxt').textContent`); }
  seat() { return this.ev(`[...document.querySelectorAll('.seat--me')].map(b=>+b.dataset.seat)[0]`); }
  click(sel) { return this.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) throw new Error('không thấy ${sel.replace(/'/g, '')}'); e.click(); return true})()`); }
  /** không có phần tử nào tràn ngang khỏi màn hình */
  noOverflow() { return this.ev(`document.documentElement.scrollWidth <= window.innerWidth + 1`); }
}

/** kiểm rò rỉ trên mọi khung WebSocket một tab nhận được */
function leakCheck(t, moleSeats, hackerSeat) {
  const bad = [];
  for (const f of t.frames) {
    let m; try { m = JSON.parse(f); } catch { continue; }
    if (m.t !== 'state') continue;
    const v = m.v, iMole = moleSeats.includes(v.seat), over = v.phase === 'end';
    for (const p of v.players) if ('role' in p && !(p.seat === v.seat || over || !p.alive || (iMole && p.role === 'mole' && moleSeats.includes(p.seat)))) bad.push(`${t.name} thấy vai ghế ${p.seat} ở ${v.phase}`);
    if (!iMole && ('moleChat' in v || v.night?.pack)) bad.push(`${t.name} nhận kênh mã hóa`);
    if ('scan' in v && v.seat !== hackerSeat) bad.push(`${t.name} nhận kết quả quét`);
    if (/bot-\d|"token"/.test(f) && m.t === 'state') bad.push(`${t.name} nhận token`);
  }
  return bad;
}

const NAMES = ['Cú Đêm', 'Mèo Mun', 'Chim Sẻ', 'Cáo Lửa', 'Gấu Xám', 'Sóc Nâu'];
const tabs = [];
try {
  // ====================== PHẦN A: 6 người thật ======================
  for (const n of NAMES) tabs.push(await new Tab(n).open());
  const [host] = tabs;
  await host.go(BASE);
  await host.shot('01-home-desktop.png');
  await host.ev(`document.getElementById('nameInp').value=${JSON.stringify(NAMES[0])}`);
  await host.click('#createBtn');
  await host.waitFor(`!document.getElementById('game').hidden`);
  const code = await host.ev(`document.getElementById('barCodeTxt').textContent`);
  ok(/^[A-HJKMNP-Z2-9]{5}$/.test(code), `tạo phòng, mã ${code}`);
  ok(await host.ev(`!document.getElementById('botRow').hidden`), 'chủ phòng thấy nút Thêm bot');
  for (let i = 1; i < 6; i++) {
    const t = tabs[i];
    await t.go(`${BASE}?p=${code}`);
    ok(await t.ev(`document.getElementById('codeInp').value`) === code, `${t.name}: link mời điền sẵn mã`);
    await t.ev(`document.getElementById('nameInp').value=${JSON.stringify(NAMES[i])}`);
    await t.click('#joinBtn');
    await t.waitFor(`!document.getElementById('game').hidden`);
  }
  await host.waitFor(`document.querySelectorAll('.seat[data-seat]').length===6`);
  ok(await tabs[1].ev(`document.getElementById('botRow').hidden`), 'người không phải chủ phòng không thấy nút Thêm bot');
  await host.shot('02-lobby-desktop.png', true);

  await host.click('[data-a="start"]');
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovReveal').hidden`)));
  for (const t of tabs) { t.r = await t.role(); t.s = await t.seat(); }
  console.log('  vai (mỗi tab tự đọc thẻ của mình):', tabs.map((t) => `${t.name}=${t.r}`).join(', '));
  const moles = tabs.filter((t) => t.r === 'Nội Gián'), hacker = tabs.find((t) => t.r === 'Hacker Mật'), sec = tabs.find((t) => t.r === 'Kỹ Sư An Ninh');
  const agents = tabs.filter((t) => t.r === 'Đặc Vụ Hiện Trường');
  ok(moles.length === 2 && hacker && sec && agents.length === 2, 'chia vai 2 Nội Gián / Hacker Mật / Kỹ Sư An Ninh / 2 Đặc Vụ');
  await sleep(900);
  await moles[0].shot('03-reveal-mole.png');
  ok((await moles[0].ev(`document.getElementById('revealCap').textContent`)).includes(moles[1].name), 'Nội Gián thấy tên đồng bọn khi lật thẻ');
  ok(!(await agents[0].ev(`document.getElementById('revealCap').textContent`)).includes('Đồng bọn'), 'Đặc Vụ không thấy ai là đồng bọn');

  // ---- đêm 1 ----
  await Promise.all(tabs.map((t) => t.waitFor(`document.body.classList.contains('is-night') && document.getElementById('ovReveal').hidden`)));
  const canSeen = await moles[0].ev(`[...document.querySelectorAll('.seat--can')].map(b=>+b.dataset.seat)`);
  ok(!canSeen.includes(moles[1].s) && !canSeen.includes(moles[0].s), 'Nội Gián không chọn được đồng bọn/chính mình');
  ok(await agents[0].ev(`document.querySelectorAll('.seat--can').length`) === 0, 'Đặc Vụ Hiện Trường không có hành động ban đêm');
  ok(await moles[0].ev(`!document.getElementById('tabMole').hidden`) && await agents[0].ev(`document.getElementById('tabMole').hidden`), 'chỉ Nội Gián thấy tab Kênh mã hóa');
  const victim1 = agents[0];
  for (const m of moles) await m.click(`.seat[data-seat="${victim1.s}"]`);
  await moles[0].ev(`(()=>{document.getElementById('tabMole').click();const i=document.getElementById('chatInp');i.value='Xử ${victim1.name} nhé';document.getElementById('chatForm').requestSubmit()})()`);
  await hacker.click(`.seat[data-seat="${moles[0].s}"]`);
  await sec.click(`.seat[data-seat="${sec.s}"]`);
  await hacker.waitFor(`document.querySelector('#scanLog li:nth-child(2)')`);
  ok((await hacker.ev(`document.getElementById('scanLog').textContent`)).includes(`${moles[0].name} là Nội Gián`), 'Hacker Mật quét ra Nội Gián');
  ok(await sec.ev(`document.querySelector('.seat--sel')?.dataset.seat`) === String(sec.s), 'Kỹ Sư An Ninh che chính mình');
  await moles[1].waitFor(`/Xử/.test(document.getElementById('chatLog').textContent)`);
  ok(true, 'Nội Gián kia nhận tin trong Kênh mã hóa');
  await sleep(1400); // chờ chuyển cảnh 2 s xong
  await moles[0].shot('04-night-mole-desktop.png');
  await hacker.shot('05-night-hacker-desktop.png');
  await agents[1].size(390, 844, true);
  await agents[1].shot('06-night-agent-mobile.png');
  ok(await agents[1].noOverflow(), 'mobile 390px: không tràn ngang (đêm)');

  // ---- bình minh / ngày 1 ----
  await Promise.all(tabs.map((t) => t.waitFor(`/Báo cáo ca trực/.test(document.getElementById('phaseTxt').textContent)`, 20000)));
  await sleep(500);
  await host.shot('07-dawn-desktop.png');
  ok((await host.ev(`document.getElementById('chatLog').textContent`)).includes(`${victim1.name} bị Nội Gián phá hoại`), `đêm 1: ${victim1.name} bị phá hoại, cả đội thấy`);
  await Promise.all(tabs.map((t) => t.waitFor(`/Họp khẩn/.test(document.getElementById('phaseTxt').textContent)`, 20000)));
  await hacker.ev(`(()=>{const i=document.getElementById('chatInp');i.value='Tôi quét rồi, ${moles[0].name} là Nội Gián!';document.getElementById('chatForm').requestSubmit()})()`);
  await sec.click('#quick [data-q="3"]');
  await sleep(1400);
  await host.shot('08-day-desktop.png');
  await agents[1].shot('08b-day-mobile.png');
  ok(!(await agents[1].ev(`document.getElementById('chatLog').textContent`)).includes('Xử '), 'tin Kênh mã hóa không lọt vào Phòng họp');

  // ---- bỏ phiếu bắt Nội Gián 1 ----
  const alive = () => tabs.filter((t) => t !== victim1);
  await Promise.all(alive().map((t) => t.waitFor(`/Bỏ phiếu/.test(document.getElementById('phaseTxt').textContent)`, 30000)));
  for (const t of alive()) { if (t === moles[0]) await t.click('[data-a="skip"]'); else if (t !== agents[1]) await t.click(`.seat[data-seat="${moles[0].s}"]`); }
  await sleep(400);
  await host.shot('09-vote-desktop.png');
  await agents[1].shot('10-vote-mobile.png');
  await agents[1].click(`.seat[data-seat="${moles[0].s}"]`);
  await host.waitFor(`/Phán quyết/.test(document.getElementById('phaseTxt').textContent)`);
  ok((await host.ev(`document.getElementById('chatLog').textContent`)).includes(`${moles[0].name} bị bắt giữ — là Nội Gián`), 'họp 1: bắt đúng Nội Gián');

  // ---- đêm 2: Nội Gián còn lại nhắm Hacker, Kỹ Sư che đúng ⇒ an toàn; đêm sau không được che lại người cũ ----
  await Promise.all(alive().map((t) => t.waitFor(`document.body.classList.contains('is-night')`, 20000)));
  await sleep(300);
  await moles[1].click(`.seat[data-seat="${hacker.s}"]`);
  ok(await sec.ev(`!document.querySelector('.seat[data-seat="${sec.s}"]').classList.contains('seat--can')`), 'Kỹ Sư không che lại người đêm trước');
  await sec.click(`.seat[data-seat="${hacker.s}"]`);
  const alive2 = alive().filter((t) => t !== moles[0]);
  await Promise.all(alive2.map((t) => t.waitFor(`/Báo cáo ca trực/.test(document.getElementById('phaseTxt').textContent)`, 20000)));
  ok((await host.ev(`document.getElementById('chatLog').textContent`)).includes('Đêm 2: hệ thống an toàn'), 'đêm 2: tường lửa chặn được phá hoại');
  await Promise.all(alive2.map((t) => t.waitFor(`/Bỏ phiếu/.test(document.getElementById('phaseTxt').textContent)`, 40000)));
  for (const t of alive2) { if (t === moles[1]) await t.click(`.seat[data-seat="${hacker.s}"]`); else await t.click(`.seat[data-seat="${moles[1].s}"]`); }

  // ---- hết ván ----
  await Promise.all(tabs.map((t) => t.waitFor(`!document.getElementById('ovEnd').hidden`, 20000)));
  ok(/bắt gọn/.test(await host.ev(`document.getElementById('endTitle').textContent`)), 'Đặc Vụ thắng khi bắt đủ 2 Nội Gián');
  const hostLog = await host.ev(`window.__sfx.log.join(',')`);
  const need = ['card', 'alarm', 'power', 'gavel', 'hit', moles.includes(host) ? 'lose' : 'win'];
  ok(need.every((n) => hostLog.includes(n)), `âm thanh các mốc (lật thẻ, mất điện, đèn sáng, bỏ phiếu, có người bị loại, thắng): ${hostLog}`);
  ok((await moles[1].ev(`window.__sfx.log.join(',')`)).includes('lose') && (await hacker.ev(`window.__sfx.log.join(',')`)).includes('win'), 'phe thua (Nội Gián) nghe tiếng thua, phe thắng nghe tiếng thắng');
  await host.click('#sndBtn');
  ok(await host.ev(`localStorage.getItem('wgp.muted')==='1' && document.getElementById('sndBtn').getAttribute('aria-pressed')==='true'`), 'bấm nút loa ⇒ tắt tiếng (wgp.muted=1)');
  await host.click('#sndBtn');
  await host.shot('11-end-desktop.png');
  await agents[1].shot('12-end-mobile.png');

  const moleSeats = moles.map((m) => m.s);
  const leaksA = tabs.flatMap((t) => leakCheck(t, moleSeats, hacker.s));
  ok(leaksA.length === 0, `A: không rò vai/kênh mã hóa/kết quả quét qua mạng (${tabs.reduce((a, t) => a + t.frames.length, 0)} khung đã kiểm)${leaksA.length ? ': ' + leaksA.slice(0, 5).join('; ') : ''}`);
  const agentNight = agents[1].frames.filter((f) => f.includes('"phase":"night"')).length;
  ok(agentNight <= 4, `Đặc Vụ gần như không nhận gói nào trong đêm (${agentNight} khung, chỉ lúc vào đêm)`);

  await host.click('#againBtn');
  await Promise.all(tabs.map((t) => t.waitFor(`/Phòng chờ/.test(document.getElementById('phaseTxt').textContent)`)));
  ok(await agents[1].ev(`document.getElementById('meRole').textContent`) === 'Chưa phát thẻ', 'ván mới: về phòng chờ, xoá vai');

  // ---- khách lỡ đóng tab ⇒ "Quay lại phòng" về đúng ghế ----
  const last = tabs[5], lastSeat = await last.seat();
  const back = await new Tab('tab mới').open(); tabs.push(back);
  await back.go(BASE);
  ok((await back.ev(`document.querySelector('.home__row')?.textContent || ''`)).includes(`Quay lại phòng ${code}`), 'tab mới thấy nút Quay lại phòng');
  await back.click('.home__row .btn');
  await back.waitFor(`!document.getElementById('game').hidden && document.querySelector('.seat--me')`);
  ok(await back.seat() === lastSeat, `quay lại đúng ghế của ${NAMES[5]}`);
  await last.waitFor(`/tab khác/.test(document.getElementById('homeMsg').textContent)`);
  ok(await host.ev(`document.querySelectorAll('.seat[data-seat]').length`) === 6, 'phòng vẫn 6 người, không sinh người trùng');
  for (const t of tabs) try { await t.ev(`document.querySelector('[data-a="leave"]')?.click()`); } catch {}

  // ====================== PHẦN B: 1 người + 5 bot, khung điện thoại ======================
  const solo = await new Tab('Một mình').open(); tabs.push(solo);
  await solo.size(390, 844, true);
  await solo.go(BASE);
  await solo.ev(`localStorage.removeItem('ai-la-noi-gian:last')`);
  await solo.go(BASE);
  await solo.shot('20-home-mobile.png');
  await solo.ev(`document.getElementById('nameInp').value='Thử Một Mình'`);
  await solo.click('#createBtn');
  await solo.waitFor(`!document.getElementById('game').hidden`);
  for (let i = 0; i < 5; i++) { await solo.click('#addBot'); await sleep(120); }
  await solo.waitFor(`document.querySelectorAll('.seat[data-seat]').length===6`);
  ok(await solo.ev(`document.querySelectorAll('.chip--bot').length`) === 5, 'thêm 5 bot vào phòng chờ');
  await solo.click('[data-kick]'); await solo.waitFor(`document.querySelectorAll('.chip--bot').length===4`);
  await solo.click('#addBot'); await solo.waitFor(`document.querySelectorAll('.chip--bot').length===5`);
  ok(true, 'bớt / thêm lại bot được');
  await solo.shot('21-lobby-bots-mobile.png', true);
  ok(await solo.noOverflow(), 'mobile 390px: không tràn ngang (phòng chờ)');
  await solo.click('[data-a="start"]');
  await solo.waitFor(`!document.getElementById('ovReveal').hidden`);
  const soloRole = await solo.role();
  console.log(`  phần B: người thật là ${soloRole}`);
  const phases = new Set(); let shotN = false, shotD = false;
  for (let guard = 0; guard < 400; guard++) {
    const ph = await solo.phase();
    if (!/Hết|thắng/.test(ph)) phases.add(ph.split(' ·')[0]); else break;
    // người thật luôn làm hành động hợp lệ đầu tiên có thể
    if (/Mất điện|Bỏ phiếu/.test(ph)) {
      await solo.ev(`(()=>{const b=document.querySelector('.seat--can:not(.seat--sel)'); if(b && !document.querySelector('.seat--sel')) b.click();})()`);
      if (/Mất điện/.test(ph) && !shotN) { await sleep(1500); await solo.shot('22-night-bots-mobile.png'); shotN = true; }
    }
    if (/Họp khẩn/.test(ph) && !shotD) { await solo.click('#quick [data-q="0"]'); await sleep(1500); await solo.shot('23-day-bots-mobile.png'); shotD = true; }
    await sleep(250);
  }
  await solo.waitFor(`!document.getElementById('ovEnd').hidden`, 60000);
  ok(['Mất điện', 'Báo cáo ca trực', 'Họp khẩn', 'Bỏ phiếu bắt giữ'].every((p) => phases.has(p)) || phases.size >= 3, `B: đi đủ các pha (${[...phases].join(' → ')})`);
  ok(true, `B: ván 1 người + 5 bot kết thúc — ${await solo.ev(`document.getElementById('endTitle').textContent`)}`);
  const botChat = await solo.ev(`document.getElementById('chatLog').textContent`);
  ok(/Bot /.test(botChat), 'bot có lên tiếng trong Phòng họp');
  await solo.shot('24-end-bots-mobile.png');
  // xem khung desktop của cùng ván kết thúc
  await solo.size(1366, 860); await sleep(300);
  await solo.ev(`document.getElementById('endClose').click()`); await sleep(200);
  await solo.shot('25-end-board-desktop.png');
  const vEnd = JSON.parse(solo.frames.filter((f) => f.includes('"phase":"end"')).pop()).v;
  const leaksB = leakCheck(solo, vEnd.players.filter((p) => p.role === 'mole').map((p) => p.seat), vEnd.players.find((p) => p.role === 'hacker').seat);
  ok(leaksB.length === 0, `B: không rò vai bot qua mạng (${solo.frames.length} khung)${leaksB.length ? ': ' + leaksB.slice(0, 5).join('; ') : ''}`);

  ok(tabs.every((t) => t.console.length === 0), `trang không ghi console (${tabs.map((t) => t.console.length).join('/')})`);
  ok(tabs.every((t) => t.errors.length === 0), `không lỗi JS / không tải hỏng tài nguyên${tabs.some((t) => t.errors.length) ? ': ' + tabs.flatMap((t) => t.errors).slice(0, 3).join(' | ') : ''}`);
} catch (e) { console.error('✘', e.message); fails++; }
finally {
  for (const t of tabs) try { t.ws.close(); } catch {}
  chrome.kill(); server.closeAllConnections?.(); server.close();
  console.log(`\nẢnh: ${OUT}`);
  console.log(fails ? `${fails} lỗi` : 'Tất cả đạt');
  setTimeout(() => process.exit(fails ? 1 : 0), 300);
}
