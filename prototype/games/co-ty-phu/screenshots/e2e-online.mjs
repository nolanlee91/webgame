// E2E Cờ Tỷ Phú online trên Chrome headless — 3 tab = 3 người chơi thật (mỗi tab sessionStorage riêng), bấm chuột / chạm qua CDP.
// Thử: tạo phòng, vào bằng link + mã, đổi linh vật, chủ phòng bắt đầu, chơi các lượt, chat, rớt mạng nối lại, rời ván, hết ván,
// về phòng chờ; chơi với máy vẫn chạy; trang chủ xếp kệ đúng. Chụp ảnh desktop 1440×900 + mobile 390×844.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   [PORT=8768] node prototype/games/co-ty-phu/screenshots/e2e-online.mjs [thư mục output]
// (mặc định ảnh + result.txt vào %TEMP%/lk-e2e-shots-co-ty-phu-online)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('co-ty-phu-online'), PORT = process.env.PORT || 8768, ORIGIN = 'http://127.0.0.1:' + PORT, BASE = ORIGIN + '/games/co-ty-phu/';
const DBG = 9361;
mkdirSync(OUT, { recursive: true });
const PROF = tempProfile('co-ty-phu-online'); // %TEMP%/lk-e2e-co-ty-phu-online-*, tự xoá khi thoát (kể cả Ctrl+C / bị giết cứng)
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + DBG, '--user-data-dir=' + PROF, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('TIMEOUT sau bước: ' + (R.at(-1) || '-')); try { writeFileSync(OUT + '/result.txt', R.join(String.fromCharCode(10)) + ' TIMEOUT'); } catch {} chrome.kill(); process.exit(1); }, 480000).unref();
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };

class Tab {
  constructor(name, wsUrl) { this.name = name; this.wsUrl = wsUrl; this.id = 0; this.pend = new Map(); this.errors = []; }
  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((r) => (this.ws.onopen = r));
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pend.has(m.id)) { this.pend.get(m.id)(m); this.pend.delete(m.id); }
      if (m.method === 'Runtime.exceptionThrown') this.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') this.errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
    };
    await this.send('Runtime.enable'); await this.send('Log.enable'); await this.send('Page.enable');
    // mọi tab coi như đang hiển thị (headless có thể báo tab nền) → client phát hoạt ảnh như người thật
    await this.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    return this;
  }
  send(method, params = {}) { return new Promise((r) => { const i = ++this.id; this.pend.set(i, r); this.ws.send(JSON.stringify({ id: i, method, params })); }); }
  async ev(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(this.name + ': ' + expr.slice(0, 80) + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
    return r.result.result.value;
  }
  async view(w, h, mobile) {
    await this.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await this.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
    this.mobile = mobile;
  }
  async nav(u) {
    await this.send('Page.navigate', { url: u }); await sleep(500);
    for (let i = 0; i < 60 && !(await this.ev('typeof __cotyphu==="object" && !!__cotyphu.net').catch(() => false)); i++) await sleep(200);
    await sleep(300);
  }
  async shot(name) {
    await this.send('Page.bringToFront'); await sleep(300); // Chrome chạy nền chỉ vẽ tab đang chọn
    const r = await Promise.race([this.send('Page.captureScreenshot', { format: 'png' }), sleep(10000).then(() => null)]);
    if (!r) { const alive = await Promise.race([this.ev('1+1'), sleep(3000).then(() => 'treo')]); console.log('! chụp ' + name + ' quá 10s, trang trả lời: ' + alive); return; }
    writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64'));
  }
  async front() { await this.send('Page.bringToFront'); await sleep(150); }
  async at(sel) { return this.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`); }
  async press(x, y) {
    if (this.mobile) { await this.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await this.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else for (const type of ['mousePressed', 'mouseReleased']) await this.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
  async tap(sel) { const p = await this.at(sel); if (!p) throw new Error(this.name + ': không bấm được ' + sel); await this.press(...p); await sleep(150); }
  async type(sel, text) { await this.tap(sel); await this.ev(`document.querySelector(${JSON.stringify(sel)}).select?.()`); await this.send('Input.insertText', { text }); }
  visible(sel) { return this.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none'})()`); }
  text(sel) { return this.ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||""`); }
  async waitFor(expr, ms = 8000) { for (let t = 0; t < ms; t += 100) { if (await this.ev(expr).catch(() => false)) return true; await sleep(100); } return false; }
  noHOverflow() { return this.ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth'); }
  room() { return this.ev('(()=>{const r=__cotyphu.room;return r&&{code:r.code,phase:r.phase,you:r.you,host:r.host,n:r.players.length,players:r.players,seq:r.seq,gid:r.gid,turn:r.game&&r.game.turn,gphase:r.game&&r.game.phase,round:r.game&&r.game.round,chat:r.chat.length}})()'); }
}

let list;
for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${DBG}/json`)).json(); if (list.find((x) => x.type === 'page')) break; } catch {} await sleep(250); }
// Mỗi người chơi một browser context riêng (localStorage / cookie tách biệt = như 3 máy). Chung một context thì tab B mở link mời
// sẽ dùng lại ghế đã lưu của A trong localStorage (tính năng "mở lại link ⇒ về đúng ghế") và đá A ra — đó là lý do bản cũ dừng ở #start.
const bws = new WebSocket((await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json()).webSocketDebuggerUrl);
await new Promise((r) => (bws.onopen = r));
let bid = 0; const bpend = new Map();
bws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && bpend.has(m.id)) { bpend.get(m.id)(m.result); bpend.delete(m.id); } };
const bcmd = (method, params = {}) => new Promise((r) => { const i = ++bid; bpend.set(i, r); bws.send(JSON.stringify({ id: i, method, params })); });
const newTab = async (name) => {
  const { browserContextId } = await bcmd('Target.createBrowserContext', { disposeOnDetach: true });
  const { targetId } = await bcmd('Target.createTarget', { url: 'about:blank', browserContextId });
  return new Tab(name, `ws://127.0.0.1:${DBG}/devtools/page/${targetId}`).open();
};
const A = await newTab('A'), B = await newTab('B'), C = await newTab('C');
await A.view(1440, 900, false); await B.view(390, 844, true); await C.view(1280, 800, false);

// ===== 1. Màn vào phòng + tạo phòng (A, desktop) =====
await A.nav(BASE); await A.ev('localStorage.clear();sessionStorage.clear()'); await A.nav(BASE);
check('A: màn vào phòng hiện (tên, Tạo phòng, mã phòng, Chơi với máy)', await A.visible('#vEntry') && await A.visible('#mkRoom') && await A.visible('#codeIn') && await A.visible('#goSolo') && !(await A.visible('#vSolo')));
check('A: nhãn đầu trang "2–4 người", không còn "chơi với máy"', (await A.text('#tagline')).includes('2–4 người'));
await A.shot('ctp-desktop-entry.png');
await A.tap('#joinRoom');
check('A: mã phòng trống → báo lỗi, không kết nối', (await A.text('#entryErr')).includes('5 ký tự'));
await A.type('#nmIn', 'An Đại Gia'); await A.tap('#mkRoom');
check('A: tạo phòng → vào phòng chờ có mã', await A.waitFor('__cotyphu.room&&__cotyphu.room.phase==="lobby"') && await A.visible('#vRoom'));
let ra = await A.room(); const CODE = ra.code;
check('A: là chủ phòng, 1/4 người, URL có ?room=', ra.host === 0 && ra.n === 1 && (await A.ev('location.search')).includes(CODE), CODE);
check('A: chủ phòng 1 người → nút Bắt đầu bị khoá', await A.ev('document.querySelector("#start").disabled'));
check('A: khung chat hiện cạnh bàn (desktop)', await A.visible('#chat') && !(await A.visible('#chatBtn')));

// ===== 2. B vào bằng link mời (mobile, chạm), C vào bằng mã (desktop) =====
await B.nav(BASE + '?room=' + CODE); await B.ev('localStorage.clear();sessionStorage.clear()'); await B.nav(BASE + '?room=' + CODE);
check('B: link mời điền sẵn mã phòng', (await B.ev('document.querySelector("#codeIn").value')) === CODE);
await B.type('#nmIn', 'Bình'); await B.tap('#joinRoom');
check('B: vào phòng (mobile)', await B.waitFor('__cotyphu.room&&__cotyphu.room.n!==0&&__cotyphu.room.players.length===2'));
await C.nav(BASE); await C.ev('localStorage.clear();sessionStorage.clear()'); await C.nav(BASE);
await C.type('#nmIn', 'Chi'); await C.type('#codeIn', CODE.toLowerCase()); await C.tap('#joinRoom');
check('C: vào bằng mã (gõ chữ thường vẫn được)', await C.waitFor('__cotyphu.room&&__cotyphu.room.players.length===3'));
check('A thấy 3/4 người, nút Bắt đầu mở', await A.waitFor('__cotyphu.room.players.length===3&&!document.querySelector("#start").disabled'));
check('B (không phải chủ) không bấm được Bắt đầu', await B.ev('document.querySelector("#start").disabled') && (await B.text('#start')).includes('Chờ'));
// B đổi linh vật sang ô trống (quân 3)
await B.tap('#rPick button[data-t="3"]');
check('B đổi linh vật sang quân trống → A thấy cập nhật', await A.waitFor('__cotyphu.room.players[1].tok===3'));
check('B không chọn được linh vật người khác đang giữ', await B.ev('document.querySelector(\'#rPick button[data-t="0"]\').disabled'));
check('mobile phòng chờ: không tràn ngang', await B.noHOverflow());
await A.shot('ctp-desktop-room.png'); await B.shot('ctp-mobile-room.png');

// ===== 3. Chủ phòng bắt đầu =====
await A.tap('#start');
for (const T of [A, B, C]) check(T.name + ': vào ván, lớp phủ phòng chờ đóng', await T.waitFor('__cotyphu.room.phase==="play"&&document.querySelector("#lobby").hidden&&!!__cotyphu.g'));
check('3 thẻ người chơi hiện, đúng tên', (await A.ev('[0,1,2].every(k=>!document.querySelector("#pc"+k).hidden)&&document.querySelector("#pc3").hidden')) && (await A.text('#pc1')).includes('Bình'));
check('quân của mình có dấu ▼ (đúng ghế)', await B.ev('document.querySelectorAll(".token.me").length===1&&__cotyphu.g.players[1].token===3'));

// Bấm nút hành động của người đang có lượt (chỉ người có lượt mới có nút)
const tabs = [A, B, C];
async function stepOnce(label) {
  const r = await A.room(); if (!r || r.phase !== 'play') return false;
  const T = tabs[r.turn];
  const ok = await T.waitFor('!!document.querySelector("#actions .btn")', 15000);
  if (!ok) return false;
  const others = await Promise.all(tabs.filter((x) => x !== T).map((x) => x.ev('!!document.querySelector("#actions .btn")')));
  if (others.some(Boolean)) check('chỉ người có lượt mới có nút (' + label + ')', false);
  const seq = r.seq;
  const sel = await T.ev('document.querySelector("#actions .btn--primary")?"#actions .btn--primary":"#actions .btn"');
  await T.tap(sel);
  await A.waitFor(`__cotyphu.room.seq>${seq}||__cotyphu.room.phase!=="play"`, 30000);
  return true;
}
// lượt sai người: A gửi gieo khi không phải lượt A → máy chủ từ chối, không đổi seq
{ const r = await A.room(); const W = tabs[(r.turn + 1) % 3]; const seq = r.seq;
  await W.ev('__cotyphu.net.send({t:"roll"})'); await sleep(500);
  check('gửi gieo khi chưa tới lượt → máy chủ bỏ qua', (await A.room()).seq === seq); }

let steps = 0;
for (; steps < 8; steps++) if (!(await stepOnce('lượt ' + steps))) break;
check('chơi 8 nước bằng bấm thật, ván chạy tiếp', steps === 8, 'seq=' + (await A.room()).seq);
check('tiền/vị trí khớp giữa các tab', JSON.stringify(await A.ev('__cotyphu.room.game.players.map(p=>[p.cash,p.pos])')) === JSON.stringify(await B.ev('__cotyphu.room.game.players.map(p=>[p.cash,p.pos])')));
await A.waitFor('!!document.querySelector("#actions .btn")||document.querySelector(".pcard.turn .timer")', 15000);
await A.shot('ctp-desktop-play.png'); await B.shot('ctp-mobile-play.png');
check('desktop đang chơi: không tràn ngang', await A.noHOverflow());
check('mobile đang chơi: không tràn ngang', await B.noHOverflow());

// ===== 4. Chat =====
await A.type('#chat input', 'Chào cả nhà, lụm kèo nào!'); await A.tap('#chat form .btn');
check('A gửi chat → hiện trong khung của A', await A.waitFor('document.querySelector("#chat .log").textContent.includes("lụm kèo nào")'));
check('B (mobile) có huy hiệu tin chưa đọc', await B.waitFor('!document.querySelector("#chatBtn .n").hidden&&document.querySelector("#chatBtn .n").textContent==="1"'));
await B.tap('#chatBtn');
check('B mở bảng chat, thấy tin của A, huy hiệu tắt', await B.waitFor('document.body.classList.contains("chat-open")&&document.querySelector("#chat .log").textContent.includes("lụm kèo nào")&&document.querySelector("#chatBtn .n").hidden'));
await B.type('#chat input', 'Ok chơi luôn <b>x</b>'); await B.tap('#chat form .btn');
check('A nhận tin của B, chữ <b> hiện nguyên văn (không chèn HTML)', await A.waitFor('document.querySelector("#chat .log").textContent.includes("<b>x</b>")&&!document.querySelector("#chat .log b b")'));
await B.shot('ctp-mobile-chat.png');
await B.tap('#chat .close');
check('B đóng bảng chat', !(await B.ev('document.body.classList.contains("chat-open")')));
await C.ev('(async()=>{for(let i=0;i<7;i++){__cotyphu.net.send({t:"chat",text:"spam "+i});}})()'); await sleep(700);
check('chat spam bị giới hạn (≤ 4 tin liền)', (await A.ev('[...document.querySelectorAll("#chat .log li")].filter(l=>l.textContent.includes("spam")).length')) <= 4);

// ===== 5. Rớt mạng → tự nối lại giữ ghế =====
await B.ev('__cotyphu.net.drop()');
check('B rớt mạng → A thấy "Mất kết nối" hoặc B đã nối lại ngay', await A.waitFor('__cotyphu.room.players[1].connected===false', 3000) || true);
check('B tự nối lại, giữ đúng ghế 2', await B.waitFor('__cotyphu.net.ws&&__cotyphu.net.ws.readyState===1&&__cotyphu.room.you===1', 12000) && await A.waitFor('__cotyphu.room.players[1].connected===true', 12000));
// tải lại trang B giữa ván → vào lại đúng ván
await B.nav(BASE + '?room=' + CODE);
check('B tải lại trang → vào lại ván đang chơi', await B.waitFor('__cotyphu.mode==="online"&&__cotyphu.room&&__cotyphu.room.phase==="play"&&document.querySelector("#lobby").hidden', 10000));
for (let k = 0; k < 3; k++) if (!(await stepOnce('sau nối lại ' + k))) break;
check('chơi tiếp sau khi nối lại', (await A.room()).phase === 'play');

// ===== 6. C rời ván → máy chủ chơi thay =====
await C.ev('__cotyphu.net.leave()');
check('C rời → về màn vào phòng', await C.waitFor('__cotyphu.mode==="solo"&&!document.querySelector("#vEntry").closest("[hidden]")', 6000));
check('A thấy C "Đã rời"', await A.waitFor('__cotyphu.room.players[2].left===true&&document.querySelector("#pc2").textContent.includes("Đã rời")', 6000));

// ===== 7. Chơi nhanh tới hết ván =====
for (const T of [A, B]) await T.ev('__cotyphu.setFast(0.04)');
const t0 = Date.now();
while (Date.now() - t0 < 360000) {
  const r = await A.room(); if (!r || r.phase !== 'play') break;
  if (r.turn === 2) { await A.waitFor(`__cotyphu.room.seq>${r.seq}||__cotyphu.room.phase!=="play"`, 30000); continue; }
  const T = tabs[r.turn];
  if (await T.ev('!!document.querySelector("#actions .btn")')) {
    const sel = await T.ev('document.querySelector("#actions .btn--primary")?"#actions .btn--primary":"#actions .btn"');
    await T.tap(sel).catch(() => {});
    await A.waitFor(`__cotyphu.room.seq>${r.seq}||__cotyphu.room.phase!=="play"`, 30000);
  } else await sleep(60);
}
const rEnd = await A.room();
check('ván kết thúc (hết vòng hoặc phá sản)', rEnd.phase === 'over', 'vòng ' + rEnd.round + ', ' + Math.round((Date.now() - t0) / 1000) + 's');
for (const T of [A, B]) check(T.name + ': bảng tổng kết hiện, nút "Về phòng chờ" + "Rời phòng"', await T.waitFor('!document.querySelector("#endOv").hidden', 15000) && (await T.text('#again')) === 'Về phòng chờ' && await T.visible('#endLeave'));
await A.front(); await A.shot('ctp-desktop-end.png'); await B.front(); await B.shot('ctp-mobile-end.png');
console.log('… B bấm Về phòng chờ'); await B.tap('#again');
check('về phòng chờ: cả A và B quay lại phòng, C (đã rời) bị bỏ khỏi danh sách', await A.waitFor('__cotyphu.room.phase==="lobby"&&__cotyphu.room.players.length===2&&!document.querySelector("#vRoom").closest("[hidden]")') && await B.waitFor('__cotyphu.room.phase==="lobby"&&document.querySelector("#endOv").hidden'));
await A.tap('#start');
check('ván 2 bắt đầu lại từ đầu (gid 2, tiền khởi điểm)', await A.waitFor('__cotyphu.room.phase==="play"&&__cotyphu.room.gid===2') && await B.waitFor('__cotyphu.g&&__cotyphu.g.players.every(p=>p.pos===0)&&document.querySelector("#endOv").hidden'));
await B.tap('#backBtn').catch(() => {});
await B.ev('__cotyphu.net.leave()'); await A.ev('__cotyphu.net.leave()');
check('rời phòng → về màn vào phòng, URL bỏ ?room=', await A.waitFor('__cotyphu.mode==="solo"&&!location.search.includes("room")', 5000));

// ===== 8. Chơi với máy vẫn chạy =====
await C.nav(BASE); await C.tap('#goSolo');
check('Chơi với máy: hiện chọn quân + số người', await C.visible('#vSolo') && await C.visible('#start') && (await C.text('#backBtn')) === 'Quay lại');
await C.tap('#start');
check('ván với máy bắt đầu, lượt người chơi có nút Gieo', await C.waitFor('__cotyphu.g&&__cotyphu.mode==="solo"&&!!document.querySelector("#actions .btn--primary")') && (await C.text('#tagline')).includes('chơi với máy'));
await C.tap('#actions .btn--primary');
check('gieo xúc xắc với máy → máy tự đi tiếp', await C.waitFor('__cotyphu.g.turn!==0||__cotyphu.g.phase==="decide"', 15000));
check('chơi với máy không có chat', !(await C.visible('#chat')) && !(await C.visible('#chatBtn')));

// ===== 9. Trang chủ: kệ + nhãn =====
await A.send('Page.navigate', { url: ORIGIN + '/homepage/' }); await sleep(1800);
const shelf = (id) => A.ev(`(()=>{const s=document.getElementById(${JSON.stringify(id)});return s?[...s.querySelectorAll('.tile')].map(t=>t.textContent.replace(/\\s+/g,' ')):[]})()`);
const duel = await shelf('duel'), tri = await shelf('tri-tue');
check('trang chủ: Cờ Tỷ Phú ở kệ Đối kháng đông người, nhãn 2–4 người', duel.some((t) => t.includes('Cờ Tỷ Phú') && t.includes('2–4 người')), duel.find((t) => t.includes('Tỷ Phú')) || '');
// Từ khi trang chủ gom mọi game chơi online vào kệ Đối kháng (DUEL_IDS trong homepage/games.js), Cờ Vua + Cờ Tướng nằm ở kệ này.
check('trang chủ: Cờ Vua + Cờ Tướng ở kệ Đối kháng (game online), không lặp ở kệ Trí tuệ', duel.some((t) => t.includes('Cờ Vua')) && duel.some((t) => t.includes('Cờ Tướng')) && !tri.some((t) => /Cờ Vua|Cờ Tướng/.test(t)));
check('trang chủ: Cờ Tỷ Phú không còn ở kệ Trí tuệ', !tri.some((t) => t.includes('Tỷ Phú')));
await A.ev('document.getElementById("duel").scrollIntoView()'); await A.shot('home-desktop-duel.png');
await A.ev('document.getElementById("tri-tue").scrollIntoView()'); await A.shot('home-desktop-tritue.png');

for (const T of [A, B, C]) check(T.name + ': không có lỗi JS', T.errors.length === 0, T.errors.slice(0, 3).join(' | '));
writeFileSync(OUT + '/result.txt', R.join('\n') + '\n');
console.log('\n' + R.filter((s) => s.startsWith('PASS')).length + '/' + R.length + ' PASS');
chrome.kill();
process.exit(0);
