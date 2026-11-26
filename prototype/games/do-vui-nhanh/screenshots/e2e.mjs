// E2E Đố Vui Nhanh trên Chrome headless — phím / chuột / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   node e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('do-vui-nhanh'), BASE = 'http://127.0.0.1:' + (process.env.PORT || 8768) + '/games/do-vui-nhanh/';
mkdirSync(OUT, { recursive: true });
const PROF = tempProfile('do-vui-nhanh'); // %TEMP%/lk-e2e-*, tự xoá khi thoát
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9346', '--user-data-dir=' + PROF, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:9346/json')).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.g/.test(m.params.entry.url || '')) errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(1500); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const touch = on => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: on ? 5 : 1 });
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); };
const R = []; const check = (n, c, d = '') => { const s = (c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''); R.push(s); console.log(s); };
const KEYS = { ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39], ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40], Space: [' ', 32],
  Digit1: ['1', 49], Digit2: ['2', 50], Digit3: ['3', 51], Digit4: ['4', 52], KeyF: ['f', 70], Enter: ['Enter', 13], KeyP: ['p', 80], KeyM: ['m', 77], Escape: ['Escape', 27] };
const keyDown = (code, repeat = false) => { const [k, vk] = KEYS[code]; return send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: k, windowsVirtualKeyCode: vk, autoRepeat: repeat, text: k.length === 1 ? k : undefined }); };
const keyUp = code => { const [k, vk] = KEYS[code]; return send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k, windowsVirtualKeyCode: vk }); };
const key = async code => { await keyDown(code); await keyUp(code); await sleep(30); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const tStart = (x, y) => send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
const tMove = (x, y) => send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
const tEnd = () => send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const tap = async (x, y) => { await tStart(x, y); await tEnd(); };
async function swipe(x0, y0, x1, y1, ms, steps = 6) { await tStart(x0, y0); for (let i = 1; i <= steps; i++) { await sleep(ms / steps); await tMove(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); } await tEnd(); }
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(!r.width)return null;return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(120); };
const visible = sel => ev(`!document.querySelector(${JSON.stringify(sel)}).closest('[hidden]')`);
const txt = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const S = () => ev('(()=>{const g=__game.state;return g&&{status:g.status,phase:g.phase,i:g.i,score:g.score,streak:g.streak,correct:g.correct,cat:g.cat,mode:g.mode,fifty:g.fiftyLeft,hidden:[...g.hidden],c:g.qs[g.i]&&g.qs[g.i].correct,cats:g.qs.map(q=>q.cat),ids:g.qs.map(q=>q.id)}})()');
const noOverflow = () => ev('document.documentElement.scrollWidth<=innerWidth+1');
const inView = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()`);
const DIG = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

// ===== 1. Desktop: chuột + phím =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game, có 5 lựa chọn chủ đề + 2 chế độ', await visible('#ovMenu') && await ev("document.querySelectorAll('#catPick [data-cat]').length") === 5 && await ev("document.querySelectorAll('#modePick [data-mode]').length") === 2);
await sleep(300); await shot('dvn-desktop-menu.png');
await pressSel('#playBtn'); await sleep(150);
let s = await S();
check('Bắt đầu → 10 câu khác nhau, chủ đề trộn', s.status === 'play' && s.phase === 'ask' && new Set(s.ids).size === 10 && new Set(s.cats).size >= 3, JSON.stringify(s.cats));
check('câu hỏi + 4 đáp án hiển thị', (await txt('#qText')).length > 5 && await ev("[...document.querySelectorAll('.ans .t')].every(e=>e.textContent.length>0)"));
check('đồng hồ chạy', await (async () => { const a = await ev("document.querySelector('#tFill').style.width"); await sleep(700); return a !== await ev("document.querySelector('#tFill').style.width"); })());
await shot('dvn-desktop-cau-hoi.png');
// đúng bằng chuột
await pressSel(`.ans[data-i="${s.c}"]`); await sleep(100);
let s2 = await S();
check('bấm đúng → +điểm, chuỗi 1, đánh dấu ✓ xanh', s2.phase === 'reveal' && s2.score > 100 && s2.streak === 1 && await ev(`document.querySelectorAll('.ans')[${s.c}].classList.contains('right')`), JSON.stringify(s2));
check('đã trả lời thì bấm đáp án khác không đổi kết quả', await (async () => { await pressSel(`.ans[data-i="${(s.c + 1) % 4}"]`).catch(() => {}); return (await S()).score === s2.score; })());
await sleep(60); await shot('dvn-desktop-dung.png');
await key('Enter'); await sleep(120); s = await S();
check('Enter → câu 2', s.i === 1 && s.phase === 'ask' && /2\/10/.test(await txt('#qNo')));
// sai bằng phím
const wrong = (s.c + 1) % 4;
await key(DIG[wrong]); await sleep(100); s2 = await S();
check('phím số chọn sai → mất chuỗi, hiện ✗ + đáp án đúng', s2.streak === 0 && await ev(`document.querySelectorAll('.ans')[${wrong}].classList.contains('wrong')`) && /Đáp án/.test(await txt('#fbNote')));
await shot('dvn-desktop-sai.png');
check('tự sang câu sau sau vài giây', await (async () => { await sleep(3600); return (await S()).i === 2; })());
// 50:50
s = await S();
await key('KeyF'); await sleep(80); s2 = await S();
check('F dùng 50:50 → ẩn 2 đáp án sai, chỉ 1 lần', s2.hidden.length === 2 && !s2.hidden.includes(s.c) && s2.fifty === 0 && await ev("document.querySelectorAll('.ans.gone').length") === 2 && await ev("document.querySelector('#fiftyBtn').disabled"));
await key('KeyF'); check('50:50 lần 2 không có tác dụng', (await S()).hidden.length === 2);
// tạm dừng: đồng hồ đứng
await key('KeyP'); await sleep(100);
check('P tạm dừng → che câu hỏi', await ev('__game.paused') && await visible('#ovPause'));
const tf = await ev("document.querySelector('#tNum').textContent"); await sleep(1200);
check('đang dừng đồng hồ đứng yên', tf === await ev("document.querySelector('#tNum').textContent"));
await key(DIG[s.c]); check('đang dừng không trả lời được', (await S()).phase === 'ask');
await key('Escape'); await sleep(80);
check('Esc chơi tiếp', !(await ev('__game.paused')));
await key(DIG[s.c]); await sleep(80); s2 = await S();
check('trả lời đúng sau 50:50', s2.streak === 1);
await key('Space'); await sleep(100);
// hết giờ
await ev('__game.elapse(16000)'); await sleep(300); s2 = await S();
check('hết 15 giây → tính hết giờ', s2.phase === 'reveal' && /Hết giờ/.test(await txt('#fbText')), await txt('#fbText'));
await key('KeyM');
check('M tắt tiếng (lưu localStorage)', await ev("localStorage.getItem('wgp.muted')==='1'"));
await key('KeyM');
// trả lời nốt: đúng hết
await key('Enter'); await sleep(100);
for (let n = 0; n < 6; n++) { s = await S(); await key(DIG[s.c]); await sleep(60); await key('Enter'); await sleep(100); }
s = await S();
check('hết 10 câu → bảng kết quả', s.status === 'over' && await visible('#ovEnd'), JSON.stringify(s));
check('kết quả: 8/10 đúng, danh hiệu, sao, kỷ lục mới', /8\/10/.test(await txt('#eResult')) && (await txt('#eTitle')).length > 2 && await ev("document.querySelectorAll('#eStars i.on').length") === 2 && /Kỷ lục mới/.test(await txt('#eRecord')));
check('kỷ lục được lưu', await ev(`JSON.parse(localStorage.getItem('wgp.dovuinhanh.v1')).best.normal===${s.score}`));
check('xem lại có đủ 10 câu', await ev("document.querySelectorAll('#eList li').length") === 10);
await sleep(400); await shot('dvn-desktop-ket-qua.png');
await ev("document.querySelector('#eReview').open=true"); await sleep(100); await shot('dvn-desktop-xem-lai.png');
const firstIds = s.ids;
await pressSel('#againBtn'); await sleep(150); s = await S();
check('Chơi lại → ván mới không lặp câu vừa gặp', s.status === 'play' && s.ids.every(x => !firstIds.includes(x)));
await pressSel('#pauseBtn'); await pressSel('#menuBtnP'); await sleep(100);
check('Tạm dừng → Về menu', await visible('#ovMenu') && /Kỷ lục/.test(await txt('#mBest')));
// chủ đề + Siêu tốc
await pressSel('#catPick [data-cat="tieng-anh"]'); await pressSel('#modePick [data-mode="fast"]'); await pressSel('#playBtn'); await sleep(150); s = await S();
check('chọn Tiếng Anh + Siêu tốc → toàn câu tiếng Anh, 8 giây', s.cat === 'tieng-anh' && s.mode === 'fast' && s.cats.every(c => c === 'tieng-anh') && +(await txt('#tNum')) <= 8);
await key(DIG[s.c]); await sleep(60); s2 = await S();
check('Siêu tốc: đúng nhanh ≈ ×1,5 điểm', s2.score >= 250, s2.score);
check('desktop: không tràn ngang, thẻ câu hỏi + đáp án nằm gọn', await noOverflow() && await inView('.qcard') && await inView('#answers'));

// ===== 2. Mobile 390×844: chạm =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=5'); await sleep(300);
check('mobile: không tràn ngang, nút Bắt đầu trong màn hình', await noOverflow() && await inView('#playBtn'));
await shot('dvn-mobile-menu.png');
await pressSel('#catPick [data-cat="all"]'); await pressSel('#modePick [data-mode="normal"]');
await pressSel('#playBtn'); await sleep(200); s = await S();
check('mobile: đáp án 1 cột, cả 4 nút + đồng hồ nằm trong màn hình', await ev("(()=>{const b=[...document.querySelectorAll('.ans')].map(e=>e.getBoundingClientRect());return b.every(r=>Math.abs(r.left-b[0].left)<2)})()") && await inView('#answers') && await inView('#timer'));
check('mobile: nút đáp án đủ to để chạm (≥ 48px)', await ev("[...document.querySelectorAll('.ans')].every(e=>e.getBoundingClientRect().height>=48)"));
await shot('dvn-mobile-cau-hoi.png');
await pressSel(`.ans[data-i="${s.c}"]`); await sleep(100);
check('mobile: chạm đáp án đúng', (await S()).streak === 1);
await shot('dvn-mobile-dung.png');
await pressSel('#nextBtn'); await sleep(120); s = await S();
check('mobile: nút Câu tiếp', s.i === 1);
await pressSel('#fiftyBtn'); s2 = await S();
check('mobile: nút 50:50', s2.hidden.length === 2);
await pressSel(`.ans[data-i="${s2.hidden[0]}"]`).catch(() => {});
check('mobile: đáp án đã ẩn không chạm được', (await S()).phase === 'ask');
await pressSel(`.ans[data-i="${(s.c + 1) % 4 === s2.hidden[0] || (s.c + 1) % 4 === s2.hidden[1] ? [0, 1, 2, 3].find(k => k !== s.c && !s2.hidden.includes(k)) : (s.c + 1) % 4}"]`); await sleep(100);
check('mobile: chạm sai', (await S()).streak === 0);
await shot('dvn-mobile-sai.png');
for (let n = 0; n < 40; n++) { const p = await at('.ans:not(:disabled), #nextBtn:not([hidden])'); if (p) await tap(...p); await sleep(60); if ((await S()).status === 'over') break; }
await sleep(500);
check('mobile: chơi hết ván → bảng kết quả vừa màn hình', await visible('#ovEnd') && await noOverflow() && await inView('#againBtn'));
await shot('dvn-mobile-ket-qua.png');
await view(844, 390, true, 3); await sleep(300);
await pressSel('#againBtn'); await sleep(200);
check('mobile ngang: không tràn ngang, câu hỏi hiển thị', await noOverflow() && await visible('.qcard'));
await shot('dvn-mobile-ngang.png');
check('không có lỗi console', errors.length === 0, errors.join(' | '));
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + '\n');
console.log(R.filter(x => x.startsWith('PASS')).length + '/' + R.length + ' PASS');
chrome.kill(); process.exit(0);
