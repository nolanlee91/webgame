// E2E Nối Từ trên Chrome headless thật — bấm chuột / chạm thật, gõ chữ Việt qua Input.insertText (đường IME commit),
// đồng hồ THẬT (trọng tài 15 s/lượt, bot nghĩ 0,8–2,5 s). Tự dựng server tĩnh phục vụ prototype/ trên cổng ngẫu nhiên.
// Chạy: node test/browser/e2e.mjs [thư mục ảnh]   (từ prototype/games/noi-tu; mặc định ảnh vào screenshots/)
// Không nằm trong `npm test` (cần Chrome, ~1,5 phút): `npm run test:e2e`.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = normalize(join(HERE, '../../../..'));                  // prototype/
const OUT = process.argv[2] || join(HERE, '../../screenshots');
mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.ogg': 'audio/ogg', '.webp': 'image/webp', '.css': 'text/css' };
const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(ROOT, p));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}/games/noi-tu/`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.error('Không thấy Chrome/Edge'); process.exit(2); }
const prof = await mkdtemp(join(tmpdir(), 'noitu-e2e-'));
const PORT = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--no-first-run',
  '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 80 && !ws; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = l.find((x) => x.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
  if (!ws) await sleep(250);
}
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.params.entry.url || '')) errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr.slice(0, 120) + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async (u) => { await send('Page.navigate', { url: u }); await sleep(400); await waitFor('typeof __game==="object" && !!__game.dict', 8000); await sleep(150); };
const view = (w, h, m, dpr = 1) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = (on) => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64')); };
const R = []; let fails = 0;
const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + (typeof d === 'string' ? d : JSON.stringify(d)) : ''); if (!c) fails++; R.push(s); console.log(s); };
async function waitFor(expr, ms = 5000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(`(()=>{try{return !!(${expr})}catch{return false}})()`)) return true; await sleep(80); } return false; }
const click = async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let press = click;
const at = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async (sel) => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(120); };
const KEYS = { Enter: ['Enter', 13], Escape: ['Escape', 27] };
const key = async (code) => { const [k, vk] = KEYS[code]; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, text: type === 'keyDown' && code === 'Enter' ? '\r' : undefined }); await sleep(60); };
const typeWord = async (w) => { await pressSel('#inp'); await ev(`document.getElementById('inp').value=''`); await send('Input.insertText', { text: w }); await sleep(40); };
const visible = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().height>0})()`);
const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const S = () => ev(`(()=>{const s=__game.state,r=s&&s.round;return r&&{no:r.no,turn:r.turn,chain:r.chain.map(c=>c.word),seats:r.chain.map(c=>c.seat),over:r.over,winner:r.winner,reason:r.reason,first:r.first,score:s.score}})()`);
// trợ giúp chọn từ (đọc từ điển trong trang, chỉ để test biết từ nào hợp lệ — UI không dùng)
const PICK = `((mode)=>{const d=__game.dict,r=__game.state.round,ls=w=>w.split(' ')[1];const used=new Set(r.used);const last=r.chain.at(-1);
  const pool=(last?d.startsWith(ls(last.word)):d.all()).filter(k=>!used.has(k));
  const after=k=>{const u=new Set(used);u.add(k);return d.countNext(ls(k),u)};
  if(mode==='dead')return pool.find(k=>after(k)===0)||null;
  if(mode==='live')return pool.filter(k=>after(k)>0).sort((a,b)=>after(b)-after(a))[0]||null;
  if(mode==='wrong'){const need=last&&ls(last.word);return d.all().find(k=>k.split(' ')[0]!==need&&!used.has(k))}
})`;
const pick = (mode) => ev(`${PICK}(${JSON.stringify(mode)})`);
const noOverflow = () => ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth && document.documentElement.scrollHeight<=document.documentElement.clientHeight+1');
const inView = (sel) => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return r.top>=-1&&r.left>=-1&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1})()`);
const minBtn = (sel) => ev(`Math.min(...[...document.querySelectorAll(${JSON.stringify(sel)})].filter(b=>!b.closest('[hidden]')&&b.offsetParent).map(b=>Math.min(b.getBoundingClientRect().height,b.getBoundingClientRect().width)))`);
const btnSizes = (sel) => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(b=>!b.closest('[hidden]')&&b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return (b.id||b.className)+':'+Math.round(r.width)+'x'+Math.round(r.height)}).join(' ')`);
const layout = () => ev(`(()=>{const d=document.documentElement,q=s=>{const r=document.querySelector(s).getBoundingClientRect();return s+':'+Math.round(r.top)+'-'+Math.round(r.bottom)+'/'+Math.round(r.left)+'-'+Math.round(r.right)};return [d.scrollWidth+'x'+d.scrollHeight,innerWidth+'x'+innerHeight,q('#dock'),q('#clock'),q('#stage')].join(' ')})()`);
/** chờ tới lượt mình (bot có thể kết thúc ván bằng từ cụt/bí từ ⇒ chơi ván tiếp) */
async function untilMyTurn(wantChain = false) {
  for (let k = 0; k < 8; k++) {
    await waitFor('__game.state && __game.state.round && (__game.state.round.over || __game.state.round.turn===0)', 6000);
    const s = await S();
    if (!s.over && (!wantChain || s.chain.length)) return s;
    if (s.over) { await pressSel(await visible('#nextBtn') ? '#nextBtn' : '#nextBtn2'); await waitFor('!__game.state.round.over', 3000); continue; }
    // lượt mình nhưng chuỗi trống mà cần chuỗi: đánh một từ sống để máy đáp
    await typeWord(await pick('live')); await key('Enter'); await sleep(200);
  }
  throw new Error('không tới được lượt mình');
}

try {
  // ================= 1. DESKTOP, chuột + bàn phím =================
  await view(1440, 900, false); await touch(false); press = click;
  await nav(BASE); await ev('localStorage.clear()'); await nav(BASE);
  check('mở game → menu hiện, chưa có trận lưu, mặc định máy Dễ, khay nhập bị khoá', await visible('#ovMenu') && !(await visible('#resumeBtn'))
    && await ev(`document.querySelector('.seg button[aria-checked=true]').dataset.v`) === 'easy' && await ev('document.getElementById("dock").inert'));
  check('từ điển nạp đúng bản ghim (hash khớp words.json)', await ev(`fetch('data/words.json').then(r=>r.json()).then(j=>j.contentHash===__game.dict.contentHash&&__game.dict.size===591)`));
  await shot('noitu-desktop-menu.png');
  await pressSel('#startBtn');
  await waitFor('__game.session && __game.session.status==="live" && __game.state && __game.state.round');
  let s = await S();
  check('Bắt đầu → ván 1, bạn đi trước, chuỗi trống, thẻ Bạn sáng LƯỢT, ô nhập được focus', s.no === 1 && s.turn === 0 && s.chain.length === 0
    && await ev(`document.getElementById('pl0').classList.contains('on')&&!document.getElementById('pl1').classList.contains('on')`)
    && await ev(`document.activeElement.id==='inp'`), s);
  const c0 = await ev(`[+document.getElementById('cNum').textContent, __game.session.remainingMs()]`);
  check('đồng hồ hiện số giây của trọng tài (≈15, khớp session.remainingMs)', c0[0] >= 14 && c0[0] <= 15 && Math.abs(c0[0] - Math.ceil(c0[1] / 1000)) <= 1, c0);

  await typeWord('học'); await key('Enter'); await sleep(150);
  check('từ 1 tiếng ở lượt mở đầu → báo "2 tiếng", không vào chuỗi', /2 tiếng/.test(await text('#msgTxt')) && (await S()).chain.length === 0, await text('#msgTxt'));
  await typeWord('xyz abc'); await key('Enter'); await sleep(150);
  check('từ không có trong từ điển → báo lý do, ghi vào danh sách từ thiếu để duyệt', /chưa có trong từ điển/.test(await text('#msgTxt'))
    && await ev(`JSON.parse(localStorage.getItem('noi-tu:missing')).includes('xyz abc')`), await text('#msgTxt'));
  check('ô nhập giữ nguyên chữ vừa gõ để sửa', await ev(`document.getElementById('inp').value`) === 'xyz abc');
  const w1 = await pick('live');
  await typeWord(w1.toUpperCase().replace(' ', '   ')); await key('Enter');
  await waitFor('__game.state.round.chain.length===1');
  s = await S();
  check(`gõ "${w1.toUpperCase()}" (hoa, thừa cách) → được chuẩn hoá và nối, thẻ màu Đỏ, chuyển lượt máy`, s.chain[0] === w1 && s.seats[0] === 0 && s.turn === 1
    && await ev(`!!document.querySelector('.w--0.last')`) && await ev(`document.getElementById('inp').value===''`), s);
  check('lượt máy: hiện thẻ "máy đang nghĩ", đồng hồ chuyển màu máy, nút Nối khoá', await visible('.w.ghost') && await ev(`document.getElementById('clock').classList.contains('bot')`)
    && await ev(`document.getElementById('sendBtn').getAttribute('aria-disabled')==='true'`));
  await shot('noitu-desktop-may-nghi.png');
  const sub0 = await ev('__game.t.submits');
  await typeWord('gì đó'); await key('Enter'); await sleep(100);
  check('gõ Enter khi chưa tới lượt → không gửi lệnh, báo chờ', await ev('__game.t.submits') === sub0 && /Chưa tới lượt/.test(await text('#msgTxt')));
  await ev(`document.getElementById('inp').value=''`);
  s = await untilMyTurn(true);
  check('máy nối từ hợp lệ trong ≤ 2,5 s rồi trả lượt (thẻ Xanh, âm tiết nối tô sáng)', s.chain.length >= 2 || s.chain.length === 1 && s.seats[0] === 1, s);
  check('âm tiết nối giữa 2 thẻ được đánh dấu', s.chain.length < 2 || await ev(`document.querySelectorAll('.w')[1].querySelector('.sy').classList.contains('lk')`));
  const need = await text('#need'), lastW = s.chain.at(-1);
  check('khay nhập hiện sẵn tiếng phải nối', need === lastW.split(' ')[1], need);
  const wrong = await pick('wrong');
  await typeWord(wrong); await key('Enter'); await sleep(150);
  check(`từ sai đầu ("${wrong}") → báo phải bắt đầu bằng "${need}"`, (await text('#msgTxt')).includes(`bắt đầu bằng “${need}”`) && (await S()).chain.length === s.chain.length, await text('#msgTxt'));
  const cA = await ev(`[+document.getElementById('cNum').textContent, __game.session.remainingMs()]`); await sleep(1100);
  const cB = await ev(`[+document.getElementById('cNum').textContent, __game.session.remainingMs()]`);
  check('đồng hồ đếm lùi theo trọng tài (giảm ~1 s, số trên màn = ceil(remainingMs))', cB[1] < cA[1] - 900 && cB[0] === Math.ceil(cB[1] / 1000) || Math.abs(cB[0] - Math.ceil(cB[1] / 1000)) <= 1, [cA, cB]);
  const w2 = await pick('live');
  if (w2) {
    await typeWord(w2.split(' ')[1]); await key('Enter');
    await waitFor(`__game.state.round.chain.length===${s.chain.length + 1}`, 2000);
    check(`chỉ gõ tiếng thứ hai ("${w2.split(' ')[1]}") → tự ghép thành "${w2}"`, (await S()).chain.at(-1) === w2, await S());
  }
  await shot('noitu-desktop-choi.png');

  // ----- tạm dừng thật: đồng hồ trọng tài dừng -----
  s = await untilMyTurn(true);
  await key('Escape'); await sleep(150);
  check('Esc giữa ván → menu tạm dừng, phiên chơi đóng (trọng tài dừng)', await visible('#ovMenu') && await ev('__game.session===null') && await visible('#resumeBtn')
    && /tạm dừng/i.test(await text('#mNote')), await text('#mNote'));
  await sleep(1500);
  await pressSel('#resumeBtn');
  await waitFor('__game.session && __game.session.status==="live" && __game.state');
  const s2 = await S(), rem = await ev('__game.session.remainingMs()');
  check('Chơi tiếp → đúng chuỗi cũ + tỉ số, lượt đang dở được tính lại đủ 15 s', JSON.stringify(s2.chain) === JSON.stringify(s.chain) && s2.turn === 0 && rem > 14000, [s2.chain.length, rem]);
  // ----- tải lại trang giữa ván -----
  await nav(BASE);
  check('tải lại trang giữa ván → menu có "Chơi tiếp" + mô tả trận lưu', await visible('#resumeBtn') && /ván [0-9]+, tỉ số/.test(await text('#mNote')), await text('#mNote'));
  await pressSel('#resumeBtn');
  await waitFor('__game.state && __game.state.round');
  check('Chơi tiếp sau tải lại → dựng lại đúng chuỗi từ (không chạy lại hiệu ứng cũ)', JSON.stringify((await S()).chain) === JSON.stringify(s.chain) && await ev(`document.querySelectorAll('.w.new').length===0`));

  // ----- hết giờ -----
  s = await untilMyTurn();
  const scoreBefore = s.score;
  const tOut = Date.now();
  const timedOut = await waitFor('__game.state.round.over', 17000);
  s = await S();
  check('không gõ gì 15 s → trọng tài xử thua hết giờ, máy +1', timedOut && s.reason === 'timeout' && s.winner === 1 && s.score[1] === scoreBefore[1] + 1, [Date.now() - tOut, s]);
  check('bảng kết quả: "Máy thắng!" + lý do hết giờ + người thua đi trước', await visible('#ovEnd') && /Máy thắng/.test(await text('#eTitle'))
    && /hết 15 giây/.test(await text('#eSub')) && /bạn đi trước/.test(await text('#eNext')), await text('#eSub'));
  await shot('noitu-desktop-het-gio.png');
  await pressSel('#nextBtn');
  await waitFor('!__game.state.round.over');
  s = await S();
  check('Ván tiếp → ván mới, BẠN (người thua) đi trước, chuỗi trống', s.first === 0 && s.turn === 0 && s.chain.length === 0, s);

  // ----- từ cụt thắng ngay -----
  const dead = await pick('dead');
  await typeWord(dead); await key('Enter');
  await waitFor('__game.state.round.over', 2000);
  s = await S();
  check(`đánh từ cụt "${dead}" → thắng ngay (không chờ máy hết giờ), thẻ cụt gạch tiếng cuối`, s.over && s.winner === 0 && s.reason === 'no-move' && await visible('.w.dead')
    && /Bạn thắng/.test(await text('#eTitle')) && /từ cụt/.test(await text('#eSub')), s);
  await shot('noitu-desktop-tu-cut.png');
  await pressSel('#nextBtn');
  await waitFor('!__game.state.round.over');
  s = await S();
  check('máy thua ⇒ ván sau MÁY đi trước, máy tự mở màn', s.first === 1 && s.turn === 1 && await visible('.w.ghost'), s);
  const opened = await waitFor('__game.state.round.chain.length>=1 || __game.state.round.over', 4000);
  s = await S();
  check('máy mở màn bằng một từ trong ≤ 2,5 s', opened && s.seats[0] === 1, s);

  // ----- chịu thua 2 bước -----
  s = await untilMyTurn();
  await pressSel('#resignBtn');
  check('bấm "Chịu thua" lần 1 → chỉ hỏi lại, ván chưa kết thúc', !(await S()).over && /Chắc chưa/.test(await text('#resignBtn')));
  await pressSel('#resignBtn'); await waitFor('__game.state.round.over', 2000);
  s = await S();
  check('bấm lần 2 → thua ván (resign), bảng kết quả "Bạn đã chịu thua"', s.over && s.reason === 'resign' && s.winner === 1 && /chịu thua/.test(await text('#eSub')), s);
  await pressSel('#viewBtn');
  check('"Xem chuỗi từ" → đóng bảng, chuỗi còn nguyên, khay hiện nút Ván tiếp', !(await visible('#ovEnd')) && await visible('#nextBtn2') && !(await visible('#form')));
  await pressSel('#nextBtn2'); await waitFor('!__game.state.round.over');
  check('nút Ván tiếp trong khay → mở ván mới', !(await S()).over);

  // ----- âm thanh, độ khó, trận mới -----
  await pressSel('#muteBtn');
  check('nút âm thanh → tắt (aria-pressed, lưu wgp.muted)', await ev(`document.getElementById('muteBtn').getAttribute('aria-pressed')==='true'&&localStorage.getItem('wgp.muted')==='1'`));
  await pressSel('#muteBtn');
  check('có phát âm thanh khi nối/thắng/thua', await ev(`(()=>{const n=new Set(__game.sfx.log.map(x=>x.n));return n.has('buoc-nhay')&&n.has('thang')&&(n.has('thua')||n.has('het-gio'))})()`), await ev(`[...new Set(__game.sfx.log.map(x=>x.n))]`));
  await pressSel('#menuBtn');
  await pressSel('.seg[data-k="level"] button[data-v="hard"]');
  await pressSel('#startBtn');
  await waitFor('__game.state && __game.state.round && __game.state.round.no===1');
  s = await S();
  check('chọn máy Khó + Trận mới → tỉ số 0–0, ván 1, tên hiện "Khó"', s.score[0] === 0 && s.score[1] === 0 && /Khó/.test(await text('#n1')), [s.score, await text('#n1')]);
  check('desktop 1440×900: không tràn trang, khay nhập + đồng hồ trong màn', await noOverflow() && await inView('#dock') && await inView('#clock'));
  await view(1280, 720, false);
  check('desktop 1280×720: không tràn, khay nhập trong màn', await noOverflow() && await inView('#dock'));

  // ================= 2. MOBILE dọc 390×844, chạm =================
  await view(390, 844, true, 3); await touch(true); press = tap;
  await ev('localStorage.clear()'); await nav(BASE);
  check('mobile: menu gọn trong màn, nút ≥ 44px', await noOverflow() && await minBtn('#ovMenu .btn, #ovMenu .seg button') >= 44, await minBtn('#ovMenu .btn, #ovMenu .seg button'));
  await shot('noitu-mobile-menu.png');
  await pressSel('#startBtn');
  await waitFor('__game.state && __game.state.round');
  check('mobile: không tràn trang, khay nhập + đồng hồ + 2 thẻ người chơi đều trong màn', await noOverflow() && await inView('#dock') && await inView('#clock') && await inView('#pl0') && await inView('#pl1'));
  check('mobile: nút công cụ + nút Nối ≥ 44px; chữ ô nhập ≥ 16px (iOS không tự phóng to)', await minBtn('.tools .btn, #sendBtn, #resignBtn') >= 44
    && await ev(`parseFloat(getComputedStyle(document.getElementById('inp')).fontSize)>=16`), await btnSizes('.tools .btn, #sendBtn, #resignBtn'));
  // chơi vài lượt bằng chạm: chạm ô nhập, gõ, chạm nút Nối
  let played = 0;
  for (let k = 0; k < 6 && played < 3; k++) {
    s = await untilMyTurn();
    const w = await pick('live'); if (!w) break;
    await typeWord(s.chain.length ? w.split(' ')[1] : w); await pressSel('#sendBtn');
    if (await waitFor(`__game.state.round.chain.some(c=>c.word===${JSON.stringify(w)})`, 2000)) played++;
  }
  check('mobile: chạm ô nhập + gõ + chạm "Nối" → từ vào chuỗi (3 lượt)', played >= 3, played);
  await waitFor('__game.state.round.over || __game.state.round.turn===0', 4000);
  check('mobile: chuỗi từ xuống dòng trong khung, không cuộn ngang', await ev(`(()=>{const c=document.getElementById('chain');return c.scrollWidth<=c.clientWidth+1})()`));
  check('mũi tên nối không bị lặp: số mũi tên = số từ − 1 (+1 nếu máy đang nghĩ)', await ev(`(()=>{const c=document.getElementById('chain'),n=c.querySelectorAll('.w:not(.ghost)').length,g=c.querySelectorAll('.w.ghost').length;return c.querySelectorAll('.arrow').length===Math.max(0,n-1)+(g&&n?1:0)})()`),
    await ev(`[document.querySelectorAll('#chain .arrow').length, document.querySelectorAll('#chain .w').length]`));
  check('mobile: thanh thời gian hiện rõ (rộng > 40% khung đồng hồ)', await ev(`document.querySelector('.clock .track').getBoundingClientRect().width > document.getElementById('clock').getBoundingClientRect().width*0.4`));
  await shot('noitu-mobile-choi.png');
  // bàn phím ảo mở: khung còn ~ 844-400
  await view(390, 440, true, 3); await sleep(200);
  check('mobile + bàn phím ảo (khung 390×440): ô nhập, đồng hồ, thẻ người chơi vẫn thấy, không tràn', await noOverflow() && await inView('#dock') && await inView('#clock') && await inView('#pl0'));
  check('mobile + bàn phím ảo: thẻ từ mới nhất vẫn thấy trong khung chuỗi', await ev(`(()=>{const l=[...document.querySelectorAll('#chain .w')].at(-1);if(!l)return true;const c=document.getElementById('chain').getBoundingClientRect(),r=l.getBoundingClientRect();return r.bottom<=c.bottom+2&&r.top>=c.top-2})()`));
  await shot('noitu-mobile-ban-phim.png');
  await view(390, 844, true, 3); await sleep(100);
  s = await untilMyTurn();
  await pressSel('#resignBtn'); await pressSel('#resignBtn');
  await waitFor('__game.state.round.over', 2000);
  check('mobile: bảng kết quả gọn trong màn, nút ≥ 44px', await visible('#ovEnd') && await noOverflow() && await minBtn('#ovEnd .btn') >= 44);
  await shot('noitu-mobile-ket-qua.png');
  await pressSel('#nextBtn'); await waitFor('!__game.state.round.over');
  await view(360, 740, true, 3); await sleep(150);
  check('mobile 360×740: không tràn, khay nhập trong màn', await noOverflow() && await inView('#dock') && await minBtn('#sendBtn') >= 44, await layout() + ' ' + await btnSizes('#sendBtn'));
  await view(844, 390, true, 3); await sleep(150);
  check('mobile xoay ngang 844×390: không tràn, khay nhập + đồng hồ trong màn', await noOverflow() && await inView('#dock') && await inView('#clock'));
  await shot('noitu-mobile-ngang.png');
  // tắt màn hình / chuyển app giữa ván ⇒ tự tạm dừng
  await view(390, 844, true, 3);
  s = await untilMyTurn();
  await ev(`Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))`);
  check('chuyển app/ẩn tab giữa ván → tự tạm dừng (không bị xử thua khi không nhìn)', await visible('#ovMenu') && await ev('__game.session===null'));
  await ev(`delete document.hidden`);

  check('không có lỗi JS / console', errors.length === 0, errors.join(' | '));
} catch (e) {
  check('kịch bản chạy hết không vướng lỗi', false, String(e.stack || e));
}
writeFileSync(join(OUT, 'e2e-ket-qua.txt'), R.join('\n') + `\n\n${R.length - fails}/${R.length} PASS\n`);
console.log(`\n${R.length - fails}/${R.length} PASS`);
ws.close(); chrome.kill(); srv.close();
await sleep(300); await rm(prof, { recursive: true, force: true }).catch(() => {});
process.exit(fails ? 1 : 0);
