// E2E Ghép Kẹo trên Chrome headless — kéo chuột / chạm / vuốt / phím thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   node screenshots/e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('ghep-keo'), BASE = 'http://127.0.0.1:' + (process.env.PORT || 8768) + '/games/ghep-keo/';
mkdirSync(OUT, { recursive: true });
try { rmSync(OUT + '/prof', { recursive: true, force: true }); } catch {}
const PORT = 9346;
const PROF = tempProfile('ghep-keo'); // %TEMP%/lk-e2e-*, tự xoá khi thoát
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROF, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
console.log('chrome pid', chrome.pid);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
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
const VK = { ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Escape: 27, Enter: 13, ' ': 32 };
async function key(k) {
  let c, vk = VK[k], text;
  if (/^[a-z]$/i.test(k)) { c = 'Key' + k.toUpperCase(); vk = k.toUpperCase().charCodeAt(0); text = k; }
  else if (k === ' ') { c = 'Space'; text = ' '; } else c = k;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code: c, key: k, windowsVirtualKeyCode: vk, text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: c, key: k, windowsVirtualKeyCode: vk });
  await sleep(30);
}
const mouse = (type, x, y, buttons = 1) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1 });
const click = async (x, y) => { await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y, 0); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
async function dragMouse(a, b) {
  await mouse('mousePressed', a.x, a.y);
  for (let t = 1; t <= 5; t++) { await mouse('mouseMoved', a.x + (b.x - a.x) * t / 5, a.y + (b.y - a.y) * t / 5); await sleep(16); }
  await mouse('mouseReleased', b.x, b.y, 0);
}
async function swipe(a, b) {
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  for (let t = 1; t <= 5; t++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + (b.x - a.x) * t / 5, y: a.y + (b.y - a.y) * t / 5 }] }); await sleep(16); }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(!r.width)return null;return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(150); };
const cell = i => ev(`__game.cellRect(${i})`);
const S = () => ev('(()=>{const g=__game.state;return g&&{mode:g.mode,level:g.level,status:g.status,score:g.score,moves:g.moves,movesLeft:g.movesLeft,movesMax:g.movesMax,target:g.target,specials:g.specials,cleared:g.cleared,stars:g.stars,bonus:g.bonus,kinds:g.cells.map(c=>c.k+(c.sp||"")).join(",")}})()');
const idleWait = async () => { for (let i = 0; i < 200; i++) { if (!(await ev('__game.busy'))) return true; await sleep(50); } return false; };
const visible = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&!!e.offsetParent})()`);
const txt = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const dom = () => ev('__game.domCheck()');
const noOverflow = () => ev('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight');
const inView = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>e.offsetParent).every(e=>{const r=e.getBoundingClientRect();return r.left>=-.5&&r.top>=-.5&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5})`);
const fitsStage = () => ev(`(()=>{const b=document.querySelector('#stage').getBoundingClientRect(),a=document.querySelector('#frame').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+8&&a.top>=b.top-1&&a.bottom<=b.bottom+8})()`);
const noOverlap = () => ev(`(()=>{const a=document.querySelector('#frame').getBoundingClientRect();return [...document.querySelectorAll('.acts .btn,.stats,.mini .btn')].filter(e=>e.offsetParent).every(e=>{const b=e.getBoundingClientRect();return a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1})})()`);
// dùng luật thật trong trang để tìm nước đi hợp lệ / vô nghĩa
const IMP = `const L=await import('./logic.js');`;
const findMove = () => ev(`(async()=>{${IMP}return L.findMove(__game.state.cells)})()`);
const findBad = () => ev(`(async()=>{${IMP}const c=__game.state.cells;for(let i=0;i<64;i++){const j=i+1;if(i%8<7&&!L.validSwap(c,i,j))return [i,j];}return null})()`);
const BASEROWS = '["01234501","23450123","45012345","01234501","23450123","45012345","01234501","23450123"]';
const fixture = (extra) => ev(`(async()=>{${IMP}const s=__game.state;L.boardFrom(s,${BASEROWS});${extra};__game.resync();return __game.domCheck()})()`);

// ===== 1. Desktop: chuột + bàn phím =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('__game.destroy(); localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game: 12 màn + chế độ Tự do, chỉ màn 1 mở', await visible('#ovMenu') && (await ev('document.querySelectorAll(".lvb").length')) === 13 && (await ev('document.querySelectorAll(".lvb.lock").length')) === 11);
check('sau menu là bàn kẹo mẫu 64 viên, sprite pixel vẽ bằng code', (await ev('document.querySelectorAll("#board .ck").length')) === 64 && await ev('document.querySelector("#board .ck .sp").style.backgroundImage.startsWith("url(\\"data:image/png")'));
check('ô thông tin màn: 20 bước, mục tiêu 1.200', /20 bước/.test(await txt('#pick')) && /1\.200/.test(await txt('#pick')));
await shot('ghep-keo-desktop-menu.png');
await pressSel('.lvb.lock');
check('bấm màn chưa mở → không chọn được', (await ev('__game.save.sel')) === 1);
await pressSel('#playBtn');
let s = await S();
check('Bắt đầu → màn 1, 20 bước, 5 loại kẹo', s.status === 'playing' && s.level === 1 && s.movesLeft === 20 && new Set(s.kinds.split(',')).size === 5);
check('HUD: còn 20 bước, màn 1/12, điểm 0', (await txt('#hMoves')) === '20' && (await txt('#hLevel')) === '1 / 12' && (await txt('#hScore')) === '0');
check('DOM khớp bàn', (await dom()) === 'ok', await dom());
// kéo chuột nước vô nghĩa
let bad = await findBad(); let before = await S();
await dragMouse(await cell(bad[0]), await cell(bad[1])); await sleep(80);
check('đang chạy hoạt ảnh thì khóa thao tác', await ev('__game.busy'));
await idleWait(); s = await S();
check('kéo chuột nước vô nghĩa → kẹo đổi rồi trả về, không mất bước', s.moves === 0 && s.movesLeft === 20 && s.kinds === before.kinds && (await dom()) === 'ok', `ô ${bad}`);
// kéo chuột nước hợp lệ
let mv = await findMove();
await dragMouse(await cell(mv[0]), await cell(mv[1]));
await idleWait(); s = await S();
check('kéo chuột nước hợp lệ → nổ, rơi, sinh kẹo mới, trừ 1 bước, có điểm', s.moves === 1 && s.movesLeft === 19 && s.score > 0 && s.cleared >= 3 && (await dom()) === 'ok', `điểm ${s.score}, nổ ${s.cleared}`);
check('HUD cập nhật bước + điểm', (await txt('#hMoves')) === '19' && (await txt('#hScore')) === s.score.toLocaleString('vi-VN'));
// bấm 2 ô
mv = await findMove();
await click(...Object.values(await cell(mv[0])).slice(0, 2)); await sleep(80);
check('bấm 1 viên → viên đó được chọn (nhảy + khung vàng)', (await ev('__game.sel')) === mv[0] && (await ev('document.querySelectorAll(".ck.sel").length')) === 1);
await click(...Object.values(await cell(mv[1])).slice(0, 2));
await idleWait(); s = await S();
check('bấm viên kề bên → đổi chỗ', s.moves === 2 && (await dom()) === 'ok');
// bấm 2 ô không kề → đổi lựa chọn
await click(...Object.values(await cell(0)).slice(0, 2)); await click(...Object.values(await cell(18)).slice(0, 2)); await sleep(50);
check('bấm viên không kề → chuyển lựa chọn, không đổi', (await ev('__game.sel')) === 18 && (await S()).moves === 2);
await click(...Object.values(await cell(18)).slice(0, 2)); await sleep(50);
check('bấm lại viên đang chọn → bỏ chọn', (await ev('__game.sel')) === -1);
// bàn phím
mv = await findMove();
await key('ArrowLeft');
let cur = 27; const tx = mv[0] % 8, ty = (mv[0] / 8) | 0;
while (cur % 8 < tx) { await key('ArrowRight'); cur++; } while (cur % 8 > tx) { await key('ArrowLeft'); cur--; }
while (((cur / 8) | 0) < ty) { await key('ArrowDown'); cur += 8; } while (((cur / 8) | 0) > ty) { await key('ArrowUp'); cur -= 8; }
await key(' ');
check('phím mũi tên di chuyển ô, Space chọn kẹo', (await ev('__game.sel')) === mv[0], `sel ${await ev('__game.sel')} cần ${mv[0]}`);
await key(mv[1] === mv[0] + 1 ? 'ArrowRight' : 'ArrowDown');
await idleWait(); s = await S();
check('mũi tên khi đang chọn → đổi kẹo', s.moves === 3 && (await dom()) === 'ok');
// gợi ý
await key('h');
const hp = await ev('__game.hintPair');
check('phím H → gợi ý 1 nước hợp lệ, 2 viên rung', !!hp && (await ev(`(async()=>{${IMP}return L.validSwap(__game.state.cells,${hp[0]},${hp[1]})})()`)) && (await ev('document.querySelectorAll(".ck.hint").length')) === 2);
await key('ArrowUp'); await key('ArrowUp'); // chạm phím = thao tác, gợi ý vẫn giữ tới khi đổi
await sleep(200);
await shot('ghep-keo-desktop-choi.png');
// tự gợi ý khi đứng yên
await ev('__game.swap(...__game.state.cells.length?[0,0]:[0,0])'); // không làm gì (không kề)
mv = await findMove(); await ev(`__game.swap(${mv[0]},${mv[1]})`); await idleWait();
check('đổi xong thì xóa gợi ý', (await ev('__game.hintPair')) === null);
await sleep(6700);
check('đứng yên ~6 giây → tự gợi ý', (await ev('__game.hintPair')) !== null);
// Esc → menu, Esc → quay lại
await key('Escape');
check('Esc → menu, nút "Chơi tiếp"', await visible('#ovMenu') && /Chơi tiếp/.test(await txt('#playBtn')) && await visible('#freshBtn'));
await key('Escape');
check('Esc lần nữa → quay lại ván', !(await visible('#ovMenu')) && (await S()).moves === 4);
// lưu + tải lại
before = await S();
await nav(BASE + '?seed=11');
check('tải lại trang → menu có "Chơi tiếp"', /Chơi tiếp/.test(await txt('#playBtn')));
await pressSel('#playBtn'); s = await S();
check('Chơi tiếp → đúng bàn, điểm, số bước', s.kinds === before.kinds && s.score === before.score && s.movesLeft === before.movesLeft && s.moves === before.moves && (await dom()) === 'ok');

// thắng màn 1
await ev('__game.state.score=__game.state.target-1');
mv = await findMove(); const ml = (await S()).movesLeft;
await dragMouse(await cell(mv[0]), await cell(mv[1])); await idleWait(); await sleep(400);
s = await S();
check('đạt mục tiêu → qua màn, thưởng bước dư 60/bước', s.status === 'won' && s.bonus === (ml - 1) * 60 && await visible('#ovWin'), `thưởng ${s.bonus}`);
check('bảng thắng: sao, tổng điểm, nút Màn tiếp', (await ev('document.querySelectorAll("#wStars i.on").length')) === s.stars && s.stars >= 1 && /Qua màn 1/.test(await txt('#wTitle')) && await visible('#nextBtn'));
const sv = await ev('__game.save');
check('lưu: mở khóa màn 2, lưu sao + kỷ lục, xóa ván đang chơi', sv.unlocked === 2 && sv.stars[1] === s.stars && sv.best[1] === s.score && sv.game === null);
check('SDK nhận gameOver thắng', (await ev('window.__lastResult.result')) === 'won' && (await ev('window.__lastResult.score')) === s.score);
await sleep(700);
await shot('ghep-keo-desktop-thang.png');
await pressSel('#nextBtn'); s = await S();
check('Màn tiếp → màn 2 (18 bước, mục tiêu thu kẹo)', s.level === 2 && s.movesLeft === 18 && (await ev('document.querySelectorAll("#hGoals .goal").length')) === 1 && await visible('#goalsBox'));
// thua màn 2
await ev('__game.state.movesLeft=1'); await ev('__game.resync()');
mv = await findMove();
await dragMouse(await cell(mv[0]), await cell(mv[1])); await idleWait(); await sleep(300);
s = await S();
check('hết bước chưa đạt → thua, báo còn thiếu gì', s.status === 'lost' && await visible('#ovLose') && /Còn thiếu/.test(await txt('#lMiss')) && (await ev('window.__lastResult.result')) === 'lost');
await shot('ghep-keo-desktop-thua.png');
await pressSel('#retryBtn'); s = await S();
check('Chơi lại → màn 2 từ đầu', s.level === 2 && s.movesLeft === 18 && s.score === 0 && s.status === 'playing');

// kẹo đặc biệt (dựng bàn cố định ở chế độ Tự do)
await key('Escape'); await pressSel('.lvb.free'); await pressSel('#playBtn');
s = await S();
check('chế độ Tự do: không giới hạn bước, HUD "Đã đi"', s.mode === 'free' && s.movesLeft === null && (await txt('#hMovesL')) === 'Đã đi' && !(await visible('#hBar')));
check('dựng bàn thử kẹo sọc', (await fixture('for(const i of [0,1,3,10])L.setCell(s,i,5)')) === 'ok');
await dragMouse(await cell(2), await cell(10)); await idleWait(); s = await S();
check('xếp 4 viên → tạo kẹo sọc', s.specials >= 1 && /\dh|\dv/.test(s.kinds), s.kinds);
await fixture('L.setCell(s,27,L.STAR)');
let c0 = (await S()).cleared;
await dragMouse(await cell(27), await cell(28)); await sleep(150);
check('kẹo sao: có vòng nổ', (await ev('document.querySelectorAll("#board .ring").length')) >= 1);
await idleWait(); s = await S();
check('đổi kẹo sao → xóa hết 1 loại kẹo (≥ 10 viên)', s.cleared - c0 >= 10 && (await dom()) === 'ok', `nổ ${s.cleared - c0}`);
await fixture('L.setCell(s,27,0,"h");L.setCell(s,28,1,"v")');
c0 = (await S()).cleared;
await dragMouse(await cell(27), await cell(28)); await idleWait(); s = await S();
check('đổi 2 kẹo sọc → nổ chữ thập (≥ 15 viên)', s.cleared - c0 >= 15 && (await dom()) === 'ok', `nổ ${s.cleared - c0}`);
await fixture('L.setCell(s,27,0,"b")');
await sleep(100);
await shot('ghep-keo-desktop-dacbiet.png');
check('kỷ lục Tự do được lưu', (await ev('__game.save.freeBest')) === s.score && s.score > 0);
// tắt tiếng
await key('m');
check('phím M → tắt tiếng (lưu wgp.muted)', (await ev('localStorage.getItem("wgp.muted")')) === '1' && /tắt/.test(await txt('#muteTx')));
await pressSel('#muteBtn');
check('nút Âm thanh → bật lại', (await ev('localStorage.getItem("wgp.muted")')) === '0');
// save hỏng
await ev(`__game.destroy();localStorage.setItem("wgp.ghep-keo.v1","{hỏng")`); await nav(BASE);
check('dữ liệu lưu hỏng → vẫn mở được menu, về mặc định', await visible('#ovMenu') && (await ev('__game.save.unlocked')) === 1);
await ev(`__game.destroy();localStorage.setItem("wgp.ghep-keo.v1",JSON.stringify({unlocked:3,game:{v:1,mode:"level",level:1,cells:[1,2]}}))`); await nav(BASE);
check('ván lưu sai cấu trúc → bỏ qua ván, giữ tiến độ', !/Chơi tiếp/.test(await txt('#playBtn')) && (await ev('__game.save.unlocked')) === 3);

// ===== 2. Bố cục nhiều kích thước =====
await ev('localStorage.clear()'); await nav(BASE + '?seed=3'); await pressSel('#playBtn');
for (const [w, h, m, label] of [[1440, 900, false, 'desktop'], [1280, 720, false, 'laptop'], [1024, 768, false, 'tablet ngang'], [768, 1024, true, 'tablet dọc'], [390, 844, true, 'mobile'], [360, 640, true, 'mobile nhỏ'], [844, 390, true, 'mobile ngang']]) {
  await view(w, h, m, 1); await sleep(350);
  const Lt = await ev('__game.layout');
  const f = [await fitsStage(), await noOverlap(), await noOverflow(), await inView('.acts .btn, .mini .btn'), await inView('.stats')];
  check(`${label} ${w}×${h}: bàn vừa khung, không chồng HUD/nút, không tràn`, f.every(Boolean) && Lt.cs >= 30, 'ô ' + Lt.cs + 'px ' + f.join(','));
}

// ===== 3. Mobile chạm / vuốt =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=5'); await ev('__game.destroy(); localStorage.removeItem("wgp.ghep-keo.v1")'); await nav(BASE + '?seed=5');
await shot('ghep-keo-mobile-menu.png');
check('mobile: menu + 12 màn vừa màn hình', await inView('#ovMenu .btn') || (await ev('document.querySelector("#ovMenu").scrollHeight>0')));
await pressSel('#playBtn'); s = await S();
check('mobile: chạm Bắt đầu → màn 1', s.status === 'playing' && s.level === 1);
mv = await findMove();
await swipe(await cell(mv[0]), await cell(mv[1])); await idleWait(); s = await S();
check('mobile: vuốt kẹo sang ô bên cạnh → đổi chỗ', s.moves === 1 && (await dom()) === 'ok');
bad = await findBad(); before = await S();
await swipe(await cell(bad[0]), await cell(bad[1])); await idleWait(); s = await S();
check('mobile: vuốt nước vô nghĩa → trả về, không mất bước', s.moves === 1 && s.kinds === before.kinds);
mv = await findMove();
let p = await cell(mv[0]); await tap(p.x, p.y); await sleep(60);
p = await cell(mv[1]); await tap(p.x, p.y); await idleWait(); s = await S();
check('mobile: chạm 2 viên kề nhau → đổi chỗ', s.moves === 2 && (await dom()) === 'ok');
await pressSel('#hintBtn');
check('mobile: chạm Gợi ý', (await ev('document.querySelectorAll(".ck.hint").length')) === 2);
check('mobile: trang không cuộn, không tràn', (await ev('scrollY')) === 0 && await noOverflow());
await sleep(300);
await shot('ghep-keo-mobile-choi.png');
await pressSel('#muteBtn2');
check('mobile: nút loa trên HUD tắt tiếng', (await ev('localStorage.getItem("wgp.muted")')) === '1');
await pressSel('#muteBtn2');
await ev('__game.state.score=__game.state.target-1');
mv = await findMove(); await swipe(await cell(mv[0]), await cell(mv[1])); await idleWait(); await sleep(1000);
check('mobile: qua màn → bảng thắng, nút trong màn hình', await visible('#ovWin') && await inView('#ovWin .btn'));
await shot('ghep-keo-mobile-thang.png');
await pressSel('#nextBtn');
await pressSel('#menuBtn');
check('mobile: nút Menu → menu, màn 2 đã mở', await visible('#ovMenu') && (await ev('document.querySelectorAll(".lvb.lock").length')) === 10);
await pressSel('#playBtn');
// ngang
await view(844, 390, true, 2); await sleep(400);
mv = await findMove(); before = await S();
await swipe(await cell(mv[0]), await cell(mv[1])); await idleWait(); s = await S();
check('mobile ngang: vuốt vẫn đổi được', s.moves === before.moves + 1 && (await dom()) === 'ok');
await shot('ghep-keo-mobile-ngang.png');
check('mobile ngang: bàn + nút vừa màn hình', await fitsStage() && await inView('.acts .btn') && await noOverlap());

check('không có lỗi console', errors.length === 0, errors.join(' | '));
const pass = R.filter(x => x.startsWith('PASS')).length;
console.log(`${pass}/${R.length} PASS`);
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + `\n${pass}/${R.length} PASS\n`);
ws.close(); chrome.kill();
process.exit(pass === R.length ? 0 : 1);
