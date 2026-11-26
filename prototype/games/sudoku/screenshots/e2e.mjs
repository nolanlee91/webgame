// E2E Sudoku trên Chrome headless — chuột / phím / chạm thật qua CDP, chụp ảnh desktop + mobile.
// Chạy: (ở gốc repo) PORT=8768 node server.js   rồi   node screenshots/e2e.mjs <thư mục output>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tempProfile, guardChrome, shotDir } from '../../_shared/test/lk-temp.mjs';
const OUT = process.argv[2] || shotDir('sudoku'), BASE = 'http://127.0.0.1:8768/games/sudoku/';
mkdirSync(OUT, { recursive: true });
try { rmSync(OUT + '/prof', { recursive: true, force: true }); } catch {}
const PORT = 9345;
const PROF = tempProfile('sudoku'); // %TEMP%/lk-e2e-*, tự xoá khi thoát
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROF, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
guardChrome(chrome, PROF);
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
const VK = { ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Escape: 27, Delete: 46, Backspace: 8 };
async function key(k, { shift = false, ctrl = false, code } = {}) {
  let c = code, vk = VK[k], text;
  if (/^[0-9]$/.test(k)) { c = c || 'Digit' + k; vk = 48 + +k; text = shift ? undefined : k; }
  else if (/^[a-z]$/i.test(k)) { c = c || 'Key' + k.toUpperCase(); vk = k.toUpperCase().charCodeAt(0); text = ctrl ? undefined : k; }
  else c = c || k;
  const mods = (shift ? 8 : 0) | (ctrl ? 2 : 0);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code: c, key: k, windowsVirtualKeyCode: vk, modifiers: mods, text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: c, key: k, windowsVirtualKeyCode: vk, modifiers: mods });
  await sleep(30);
}
const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
const click = async (x, y) => { await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let press = click;
const at = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(!r.width)return null;return [r.x+r.width/2,r.y+r.height/2]})()`);
const pressSel = async sel => { const p = await at(sel); if (!p) throw new Error('không thấy ' + sel); await press(...p); await sleep(120); };
const cellSel = i => `.cell[data-i="${i}"]`;
const S = () => ev('(()=>{const g=__game.state;return g&&{status:g.status,diff:g.diff,clues:g.clues,level:g.level,mistakes:g.mistakes,hintsLeft:g.hintsLeft,time:g.time,moves:g.moves,sel:__game.sel,notesMode:__game.notesMode,cells:g.cells,notes:g.notes,puzzle:g.puzzle,solution:g.solution,hinted:g.hinted,hist:g.history.length}})()');
const visible = sel => ev(`!document.querySelector(${JSON.stringify(sel)}).closest('[hidden]')`);
const txt = sel => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const has = (i, cls) => ev(`document.querySelector('${cellSel(i)}').classList.contains('${cls}')`);
const domOk = () => ev(`(()=>{const g=__game.state;for(let i=0;i<81;i++){const c=document.querySelector('.cell[data-i="'+i+'"]');const v=g.cells[i];const sp=c.querySelector('span');if(v){if(!sp||+sp.textContent!==v)return 'ô '+i+' thiếu số '+v;}else{if(sp)return 'ô '+i+' thừa số';const n=c.querySelectorAll('.nt i:not(:empty)').length;let b=0;for(let d=1;d<=9;d++)if(g.notes[i]&(1<<d))b++;if(n!==b)return 'ô '+i+' ghi chú '+n+'≠'+b;}if(c.classList.contains('given')!==(g.puzzle[i]>0))return 'ô '+i+' sai kiểu cho sẵn';}return 'ok'})()`);
const noOverflow = () => ev('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight');
const inView = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>e.offsetParent).every(e=>{const r=e.getBoundingClientRect();return r.left>=-.5&&r.top>=-.5&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5})`);
const fitsStage = () => ev(`(()=>{const b=document.querySelector('#stage').getBoundingClientRect();return ['#frame','#ctrl'].every(s=>{const a=document.querySelector(s).getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+8&&a.top>=b.top-1&&a.bottom<=b.bottom+8})})()`);
const noOverlap = () => ev(`(()=>{const a=document.querySelector('#frame').getBoundingClientRect(),b=document.querySelector('#ctrl').getBoundingClientRect();return a.bottom<=b.top+1||a.right<=b.left+1})()`);
const empties = s => s.cells.map((v, i) => v ? -1 : i).filter(i => i >= 0);

// ===== 1. Desktop: chuột + bàn phím =====
await view(1440, 900, false, 1); await touch(false); press = click;
await nav(BASE + '?seed=11'); await ev('__game.destroy(); localStorage.clear()'); await nav(BASE + '?seed=11');
check('menu hiện khi mở game, có 3 mức độ', await visible('#ovMenu') && (await ev('document.querySelectorAll(".mode").length')) === 3);
check('lưới vẽ đủ 81 ô trong 9 khối', (await ev('document.querySelectorAll("#board .box").length')) === 9 && (await ev('document.querySelectorAll("#board .cell").length')) === 81);
await shot('sudoku-desktop-menu.png');
await pressSel('.mode[data-diff="de"]');
await pressSel('#playBtn'); await sleep(150);
let s = await S();
check('chọn Dễ → Bắt đầu: đề Dễ 36–38 số cho sẵn', s.status === 'playing' && s.diff === 'de' && s.clues >= 36 && s.clues <= 38 && s.level === 1, `${s.diff} ${s.clues} số, cấp ${s.level}`);
check('DOM khớp đề (ô cho sẵn in đậm)', (await domOk()) === 'ok', await domOk());
check('HUD hiện mức Dễ, 0 lỗi, 3 gợi ý', (await txt('#hDiff')) === 'Dễ' && (await txt('#hMist')) === '0' && (await txt('#hintN')) === '3');
// chọn ô trống bằng chuột, điền đúng bằng phím
let E = empties(s);
let i0 = E[0];
await pressSel(cellSel(i0));
check('bấm chuột vào ô → ô được chọn, hàng/cột/khối sáng lên', (await S()).sel === i0 && await has(i0, 'sel') && await ev(`document.querySelectorAll('.cell.peer').length`) === 20);
await key(String(s.solution[i0])); s = await S();
check('gõ số đúng → điền vào ô, không tính lỗi', s.cells[i0] === s.solution[i0] && s.mistakes === 0 && !(await has(i0, 'wrong')));
check('các ô cùng số được tô', await ev(`document.querySelectorAll('.cell.same').length`) >= 1);
// điền sai
let i1 = E[1];
await pressSel(cellSel(i1));
const wrongD = (s.solution[i1] % 9) + 1;
await key(String(wrongD)); s = await S();
check('gõ số sai → ô đỏ, tính 1 lỗi, HUD cập nhật', s.cells[i1] === wrongD && s.mistakes === 1 && await has(i1, 'wrong') && (await txt('#hMist')) === '1');
await key('Delete'); s = await S();
check('Delete xóa số sai', s.cells[i1] === 0 && !(await has(i1, 'wrong')));
// ô cho sẵn không sửa được
const g0 = s.puzzle.findIndex(Boolean);
await pressSel(cellSel(g0)); await key(String((s.puzzle[g0] % 9) + 1));
check('ô cho sẵn không sửa được', (await S()).cells[g0] === s.puzzle[g0]);
// di chuyển bằng phím
await pressSel(cellSel(40));
await key('ArrowRight'); await key('ArrowDown'); await key('ArrowDown');
check('phím mũi tên di chuyển ô chọn', (await S()).sel === 40 + 1 + 18);
await key('a'); await key('w');
check('WASD cũng di chuyển', (await S()).sel === 40 + 9);
await pressSel(cellSel(0)); await key('ArrowLeft'); await key('ArrowUp');
check('đi quá mép thì vòng sang phía bên kia', (await S()).sel === 80);
// ghi chú
s = await S(); E = empties(s);
const n1 = E.find(i => L_peerEmpty(s, i));
function L_peerEmpty(st, i) { const r = (i / 9) | 0; for (let c = 0; c < 9; c++) { const j = r * 9 + c; if (j !== i && !st.cells[j]) return true; } return false; }
await pressSel(cellSel(n1));
await key('n');
check('N bật chế độ ghi chú (nút sáng, phím số đổi màu)', (await S()).notesMode && await ev(`document.querySelector('#notesBtn').classList.contains('on') && document.querySelector('#pad').classList.contains('notes')`));
const dN = (await S()).solution[n1];
const dO = (dN % 9) + 1;
await key(String(dN)); await key(String(dO)); await key('5'); await key('5');
s = await S();
check('ghi chú: bật 2 số, bấm 5 hai lần thì tắt lại', s.notes[n1] === ((1 << dN) | (1 << dO)) && s.cells[n1] === 0, s.notes[n1]);
check('ghi chú hiện số nhỏ trong ô', (await domOk()) === 'ok' && (await ev(`document.querySelectorAll('${cellSel(n1)} .nt i:not(:empty)').length`)) === 2);
await key('n');
// Shift + số = ghi chú nhanh ở ô khác cùng hàng
const r1 = (n1 / 9) | 0; const n2 = [...Array(9)].map((_, c) => r1 * 9 + c).find(j => j !== n1 && !s.cells[j]);
await pressSel(cellSel(n2)); await key(String(dN), { shift: true });
s = await S();
check('Shift + số ghi chú nhanh khi đang ở chế độ điền', !s.notesMode && (s.notes[n2] & (1 << dN)) && s.cells[n2] === 0, s.notes[n2]);
// điền đúng ô n1 → ghi chú số đó ở ô cùng hàng tự xóa
await pressSel(cellSel(n1)); await key(String(dN));
s = await S();
check('điền số → tự xóa ghi chú cùng số ở hàng/cột/khối', s.cells[n1] === dN && !(s.notes[n2] & (1 << dN)) && s.notes[n1] === 0);
// hoàn tác
await key('z', { ctrl: true }); s = await S();
check('Ctrl+Z hoàn tác: ô trống lại, ghi chú quay về', s.cells[n1] === 0 && (s.notes[n2] & (1 << dN)) && s.notes[n1] === ((1 << dN) | (1 << dO)));
await pressSel('#undoBtn'); s = await S();
check('nút Hoàn tác hoạt động', !(s.notes[n2] & (1 << dN)));
// nút Xóa
await pressSel(cellSel(n1)); await pressSel('#eraseBtn');
check('nút Xóa xóa ghi chú', (await S()).notes[n1] === 0);
// bàn phím số bằng chuột
await pressSel(`#pad button[data-d="${(await S()).solution[n1]}"]`);
check('bấm phím số trên màn hình → điền', (await S()).cells[n1] === (await S()).solution[n1]);
// gợi ý
s = await S(); E = empties(s);
await pressSel(cellSel(E[0])); await key('h'); s = await S();
check('H gợi ý: điền đúng ô đang chọn, còn 2 lượt, ô khóa lại', s.cells[E[0]] === s.solution[E[0]] && s.hinted[E[0]] === 1 && s.hintsLeft === 2 && await has(E[0], 'hinted') && (await txt('#hintN')) === '2');
await key('Delete');
check('ô gợi ý không xóa được', (await S()).cells[E[0]] === s.solution[E[0]]);
// hoàn thành 1 hàng → nháy sáng
s = await S();
let rowK = -1, last = -1;
for (let r = 0; r < 9 && rowK < 0; r++) { const e = [...Array(9)].map((_, c) => r * 9 + c).filter(j => s.cells[j] !== s.solution[j]); if (e.length >= 2) { rowK = r; last = e[e.length - 1]; for (const j of e.slice(0, -1)) { await ev(`__game.select(${j})`); await ev(`__game.input(${s.solution[j]})`); } } }
await pressSel(cellSel(last)); await key(String(s.solution[last])); await sleep(40);
check('điền xong 1 hàng → cả hàng nháy sáng + âm thanh', await ev(`document.querySelectorAll('.cell.flash').length`) >= 9 && (await ev('__game.sfx.log.map(x=>x.n).slice(-3)')).includes('trung-da') || (await ev('__game.sfx.loaded')) < 6);
// phím số mờ khi đủ 9
s = await S();
const dFull = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort((a, b) => s.cells.filter((v, i) => v === a && v === s.solution[i]).length < s.cells.filter((v, i) => v === b && v === s.solution[i]).length ? 1 : -1)[0];
for (let j = 0; j < 81; j++) if (s.solution[j] === dFull && s.cells[j] !== dFull) { await ev(`__game.select(${j})`); await ev(`__game.input(${dFull})`); }
check('đủ 9 ô một số → phím số đó mờ đi', await ev(`document.querySelector('#pad button[data-d="${dFull}"]').disabled`));
await shot('sudoku-desktop-choi.png');
// trùng số → đánh dấu
s = await S(); E = empties(s);
const cE = E[0]; const peerV = (() => { for (let j = 0; j < 81; j++) if (j !== cE && s.cells[j] && ((j / 9 | 0) === (cE / 9 | 0))) return s.cells[j]; })();
await pressSel(cellSel(cE)); await key(String(peerV));
check('số trùng trong hàng → gạch đỏ cả 2 ô', await has(cE, 'clash') && (await ev(`document.querySelectorAll('.cell.clash').length`)) >= 2);
await shot('sudoku-desktop-loi.png');
await key('Backspace');
// đồng hồ
const t1 = (await S()).time; await sleep(1200); const t2 = (await S()).time;
check('đồng hồ chạy khi chơi', t2 > t1 + 0.9 && (await txt('#hTime')) !== '0:00');
await key('Escape'); await sleep(80); const t3 = (await S()).time; await sleep(700);
check('Esc → menu, đồng hồ dừng, menu báo đề đang giải dở', await visible('#ovMenu') && (await S()).time === t3 && (await txt('#playBtn')).includes('Giải tiếp'));
await pressSel('#playBtn');
// thắng: điền gần hết rồi bấm ô cuối bằng chuột + phím số trên màn hình
s = await S(); E = empties(s).concat(s.cells.map((v, i) => v && v !== s.solution[i] ? i : -1).filter(i => i >= 0));
for (const j of E.slice(0, -1)) { await ev(`__game.select(${j})`); await ev(`__game.input(${s.solution[j]})`); }
const lastI = E[E.length - 1];
await pressSel(cellSel(lastI)); await pressSel(`#pad button[data-d="${s.solution[lastI]}"]`);
await sleep(300);
check('ô cuối → giải xong, bàn chạy hiệu ứng sóng', (await S()).status === 'won' && await ev(`document.querySelector('#board').classList.contains('win')`));
await sleep(900);
check('hiện bảng Giải xong + kỷ lục lần đầu', await visible('#ovWin') && /Giải xong|Hoàn hảo/.test(await txt('#wTitle')) && (await txt('#wRecord')).includes('Lần đầu'));
const lr = await ev('window.__lastResult');
check('báo SDK gameOver (solved) + điểm', lr && lr.result === 'solved' && lr.diff === 'de' && lr.score > 0 && (await ev('window.__lastScore')) === lr.score, JSON.stringify(lr));
await shot('sudoku-desktop-thang.png');
let sv = await ev('JSON.parse(localStorage.getItem("wgp.sudoku.v1"))');
check('lưu kỷ lục thời gian mức Dễ, xoá ván đã giải', sv.best.de > 0 && sv.wins.de === 1 && !sv.games.de, JSON.stringify({ best: sv.best, wins: sv.wins }));
check('phím số bị chặn sau khi thắng', await (async () => { await ev('__game.select(0)'); return (await ev('__game.input(1)')) === false; })());
// Đề mới (cùng mức) từ bảng thắng
await pressSel('#nextBtn'); s = await S();
check('Đề mới → đề Dễ khác, sạch', s.status === 'playing' && s.diff === 'de' && s.mistakes === 0 && s.hintsLeft === 3 && !(await visible('#ovWin')));
// Lưu ván + nạp lại trang (mức Khó)
await key('Escape'); await pressSel('.mode[data-diff="kho"]');
check('menu: mức Dễ có kỷ lục', (await txt('[data-rec="de"]')).includes('Kỷ lục'));
await pressSel('#playBtn'); s = await S();
check('đề Khó: ≤30 số cho sẵn, cần suy luận sâu (cấp 3)', s.diff === 'kho' && s.clues <= 30 && s.level === 3, `${s.clues} số, cấp ${s.level}`);
E = empties(s);
await pressSel(cellSel(E[0])); await key(String(s.solution[E[0]]));
await pressSel(cellSel(E[1])); await key(String((s.solution[E[1]] % 9) + 1));
await pressSel(cellSel(E[2])); await key('n'); await key('1'); await key('2'); await key('9'); await key('n');
await pressSel(cellSel(E[3])); await key('n'); await key('4'); await key('7'); await key('n');
await pressSel(cellSel(E[4]));
await sleep(1100);
await shot('sudoku-desktop-kho.png');
s = await S();
const snap = JSON.stringify({ c: s.cells, n: s.notes, m: s.mistakes, p: s.puzzle });
await nav(BASE);
check('mở lại trang → menu có "Giải tiếp" ở mức Khó', (await txt('#playBtn')).includes('Giải tiếp') && await visible('#freshBtn') && await ev(`document.querySelector('.mode[data-diff="kho"]').classList.contains('on')`));
await pressSel('#playBtn'); const s2 = await S();
check('Giải tiếp → đúng đề, số, ghi chú, lỗi, thời gian', JSON.stringify({ c: s2.cells, n: s2.notes, m: s2.mistakes, p: s2.puzzle }) === snap && s2.time >= 1 && (await domOk()) === 'ok');
check('hoàn tác vẫn dùng được sau khi nạp lại', s2.hist > 0 && await ev('__game.undo()'));
// Đề mới có hỏi lại
await pressSel('#newBtn');
check('Đề mới giữa ván → hỏi lại', await visible('#ovConfirm'));
await key('Escape');
check('Esc huỷ, ván giữ nguyên', !(await visible('#ovConfirm')) && JSON.stringify((await S()).puzzle) === JSON.stringify(s.puzzle));
await pressSel('#newBtn'); await pressSel('#yesNewBtn'); s = await S();
check('đồng ý → đề Khó mới', s.diff === 'kho' && JSON.stringify(s.puzzle) !== JSON.stringify(s2.puzzle) && s.moves === 0);
// âm thanh
const mu0 = await ev('localStorage.getItem("wgp.muted")');
await key('m'); const mu1 = await ev('localStorage.getItem("wgp.muted")');
check('M tắt/bật tiếng, lưu chung wgp.muted', mu0 !== mu1 && (await ev('document.querySelector(".muteIc").src')).includes(mu1 === '1' ? 'tat' : 'bat'));
await key('m');
check('âm thanh tải đủ 6 file', (await ev('__game.sfx.loaded')) === 6, await ev('__game.sfx.loaded'));
// Vừa
await key('Escape'); await pressSel('.mode[data-diff="vua"]'); await pressSel('#playBtn'); s = await S();
check('đề Vừa: 29–32 số cho sẵn, cấp 2', s.diff === 'vua' && s.clues >= 29 && s.clues <= 32 && s.level === 2, `${s.clues} số, cấp ${s.level}`);

// ===== 2. Nhiều cỡ màn hình =====
for (const [w, h, mob, label] of [[1440, 900, false, 'desktop lớn'], [1280, 720, false, 'laptop'], [1024, 768, false, 'tablet ngang'], [768, 1024, true, 'tablet dọc'], [390, 844, true, 'điện thoại'], [360, 640, true, 'điện thoại nhỏ'], [844, 390, true, 'điện thoại ngang']]) {
  await view(w, h, mob, 1); await sleep(350);
  const Lt = await ev('__game.layout');
  const f = [await fitsStage(), await noOverlap(), await noOverflow(), await inView('#pad .btn'), await inView('.tools .btn'), await inView('.acts .btn, .mini .btn')];
  check(`${label} ${w}×${h}: bàn + phím số vừa màn hình, không chồng, không tràn`, f.every(Boolean) && Lt.cs >= 26, 'ô ' + Lt.cs + 'px ' + f.join(','));
}

// ===== 3. Mobile chạm =====
await view(390, 844, true, 3); await touch(true); press = tap;
await nav(BASE + '?seed=5'); await ev('__game.destroy(); localStorage.removeItem("wgp.sudoku.v1")'); await nav(BASE + '?seed=5');
await shot('sudoku-mobile-menu.png');
await pressSel('#playBtn'); s = await S();
check('mobile: chạm Bắt đầu (mặc định mức Vừa)', s.status === 'playing' && s.diff === 'vua');
E = empties(s);
await pressSel(cellSel(E[0]));
check('mobile: chạm ô → chọn', (await S()).sel === E[0]);
await pressSel(`#pad button[data-d="${s.solution[E[0]]}"]`);
check('mobile: chạm phím số → điền', (await S()).cells[E[0]] === s.solution[E[0]]);
await pressSel(cellSel(E[1])); await pressSel(`#pad button[data-d="${(s.solution[E[1]] % 9) + 1}"]`);
check('mobile: điền sai → đỏ + lỗi', (await S()).mistakes === 1 && await has(E[1], 'wrong'));
await pressSel('#eraseBtn');
check('mobile: chạm Xóa', (await S()).cells[E[1]] === 0);
await pressSel('#notesBtn');
for (const d of [2, 5, 8]) await pressSel(`#pad button[data-d="${d}"]`);
check('mobile: Ghi chú + chạm số → ghi chú', (await S()).notes[E[1]] === ((1 << 2) | (1 << 5) | (1 << 8)) && (await txt('#notesN')) === 'Bật');
await pressSel(cellSel(E[2])); for (const d of [1, 3]) await pressSel(`#pad button[data-d="${d}"]`);
await pressSel('#notesBtn');
await pressSel(cellSel(E[3])); await pressSel('#hintBtn');
check('mobile: chạm Gợi ý', (await S()).hintsLeft === 2 && (await S()).cells[E[3]] === s.solution[E[3]]);
await pressSel('#undoBtn');
await pressSel(cellSel(E[4]));
check('mobile: trang không cuộn, không tràn', (await ev('scrollY')) === 0 && await noOverflow());
await sleep(400);
await shot('sudoku-mobile-choi.png');
s = await S(); E = empties(s).concat(s.cells.map((v, i) => v && v !== s.solution[i] ? i : -1).filter(i => i >= 0));
for (const j of E.slice(0, -1)) { await ev(`__game.select(${j})`); await ev(`__game.input(${s.solution[j]})`); }
await pressSel(cellSel(E[E.length - 1])); await pressSel(`#pad button[data-d="${s.solution[E[E.length - 1]]}"]`); await sleep(1300);
check('mobile: giải xong → bảng kết quả, nút trong màn hình', await visible('#ovWin') && await inView('#ovWin .btn'));
await shot('sudoku-mobile-thang.png');
await pressSel('#menuBtnW');
check('mobile: Đổi mức → về menu', await visible('#ovMenu'));
await pressSel('.mode[data-diff="de"]'); await pressSel('#playBtn');
await pressSel('#menuBtn2');
check('mobile: nút ☰ trên HUD mở menu', await visible('#ovMenu'));
await pressSel('#playBtn');
// ngang
await view(844, 390, true, 2); await sleep(300);
s = await S(); E = empties(s); await pressSel(cellSel(E[0])); await pressSel(`#pad button[data-d="${s.solution[E[0]]}"]`);
check('mobile ngang: chạm ô + phím số vẫn điền được', (await S()).cells[E[0]] === s.solution[E[0]]);
await shot('sudoku-mobile-ngang.png');
check('mobile ngang: bàn + phím số vừa màn hình', await fitsStage() && await inView('#pad .btn') && await noOverlap());

check('không có lỗi console', errors.length === 0, errors.join(' | '));
const pass = R.filter(x => x.startsWith('PASS')).length;
console.log(`${pass}/${R.length} PASS`);
writeFileSync(OUT + '/e2e-ket-qua.txt', R.join('\n') + `\n${pass}/${R.length} PASS\n`);
ws.close(); chrome.kill();
process.exit(pass === R.length ? 0 : 1);
