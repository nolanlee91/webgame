// Chụp ảnh các trạng thái UI/HUD Cờ Cá Ngựa (phòng chờ, lượt, gieo 6, không đi được, xếp hạng, mobile).
// node hud-shots.mjs <thư mục output>   (cần server: PORT=8766 node server.js ở gốc repo)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const URL0 = 'http://127.0.0.1:' + (process.env.PORT || 8766) + '/games/co-ca-ngua/index.html';
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9335', '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch('http://127.0.0.1:9335/json')).json(); const p = l.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(250);
}
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description)); return r.result.result.value; };
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(1800); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64')); console.log('shot', name); };
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const btn = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const waitIdle = async (ms = 4000) => { const end = Date.now() + ms; while (Date.now() < end) { if (!(await ev('__game.busy'))) return; await sleep(30); } };
const LOGIC = 'import("/games/co-ca-ngua/logic.js")';
const stage = (horses, seat, d) => ev(`${LOGIC}.then(L=>{const g=__game.state;Object.assign(g.horses,${JSON.stringify(horses)});g.turn=g.seats.indexOf(${seat});g.phase="roll";L.roll(g,${d});__game.state=g;return g.moves.length})`);
// Dựng thế cờ rồi gieo bằng CHUỘT vào khay (xúc xắc thật, ép mặt = d bằng cách thay hàm random trong 1 lần).
const rollTray = async (horses, seat, d) => {
  // chọn rng sao cho lần gieo kế tiếp ra đúng mặt d (dùng chính hàm rand của logic.js)
  await ev(`${LOGIC}.then(L=>{const g=__game.state;Object.assign(g.horses,${JSON.stringify(horses)});g.turn=g.seats.indexOf(${seat});g.phase="roll";g.dice=null;g.moves=[];
    for(let k=1;k<5000;k++){const t={rng:k};if(1+Math.floor(L.rand(t)*6)===${d}){g.rng=k;break}}__game.state=g;})`);
  await sleep(100);
  const p = await ev('__game.screenOf(0,null)'); await click(p.x, p.y);
};

// ---------- Desktop 1366×900 ----------
await view(1366, 900, false, 1);
await nav(URL0 + '?local=1');
await shot('hud-01-phong-cho.png');
await click(...await btn('[data-n="4"]')); await sleep(300);
await click(...await btn('[data-rule="16"]')); await sleep(300);
await shot('hud-02-phong-cho-4-nguoi.png');
await click(...await btn('#playBtn')); await sleep(900);
await shot('hud-03-luot-do-cho-gieo.png');
// giữa ván: vài ngựa trên đường, Xanh dương đang chọn ngựa
await stage({ 0: [5, 20, -1, 46], 1: [12, -1, -1, -1], 2: [30, 2, -1, -1], 3: [8, 25, -1, -1] }, 3, 4); await sleep(500);
await shot('hud-04-chon-ngua.png');
// gieo 6 → "GIEO TIẾP"
await rollTray({ 0: [5, 20, -1, 46], 1: [12, -1, -1, -1], 2: [30, 2, -1, -1], 3: [8, 25, -1, -1] }, 2, 6);
await sleep(800); await waitIdle(); await sleep(600); await waitIdle(); await sleep(200);
await shot('hud-05-gieo-6-gieo-tiep.png');
// không đi được: mọi ngựa trong chuồng, gieo 3
await rollTray({ 0: [-1, -1, -1, -1], 1: [-1, -1, -1, -1], 2: [-1, -1, -1, -1], 3: [-1, -1, -1, -1] }, 1, 3);
await sleep(820);
await shot('hud-06-khong-di-duoc.png');
await waitIdle(); await sleep(300);
await shot('hud-07-xuc-xac-sang-nguoi-ke.png');
// thắng: Đỏ đưa ngựa cuối vào chuồng
await ev('(()=>{})()');
await stage({ 0: [47, 46, 45, 43], 1: [44, 30, 10, -1], 2: [20, -1, -1, -1], 3: [46, 45, 5, -1] }, 0, 1);
await sleep(600); await waitIdle(); await sleep(1500);
await shot('hud-08-xep-hang.png');

// ---------- Mobile 390×844 ----------
await view(390, 844, true, 2);
await nav(URL0 + '?local=1');
await shot('hud-09-mobile-phong-cho.png');
await nav(URL0 + '?players=3&seed=3');
await stage({ 0: [5, 20, -1, -1], 1: [12, -1, -1, -1], 2: [30, 2, -1, -1] }, 1, 5); await sleep(500);
await shot('hud-10-mobile-chon-ngua.png');
await waitIdle(); await sleep(300);
await shot('hud-11-mobile-cho-gieo.png');
await stage({ 0: [47, 46, 45, 43], 1: [44, 30, 10, -1], 2: [20, -1, -1, -1] }, 0, 1);
await sleep(600); await waitIdle(); await sleep(1500);
await shot('hud-12-mobile-xep-hang.png');

console.log('errors:', errors.length ? errors : 'none');
ws.close(); chrome.kill(); process.exit(0);
