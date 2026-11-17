import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
// Chạy server từ thư mục prototype/ (cổng 8766) để link sang game thật (../games/…) mở được.
const OUT = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:8766/homepage/';
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try {
    const l = await (await fetch('http://127.0.0.1:9333/json')).json();
    const p = l.find(x => x.type === 'page');
    if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; }
  } catch {}
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
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(expr + ' :: ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const nav = async u => { await send('Page.navigate', { url: u }); await sleep(2000); };
const view = (w, h, m, dpr) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
const shot = async (name, full = false) => {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
  writeFileSync(OUT + '/' + name, Buffer.from(r.result.data, 'base64'));
};
const R = []; const check = (n, c, d = '') => console.log((c ? 'PASS ' : 'FAIL ') + n + (d !== '' ? ' — ' + d : ''));
const _c = check; globalThis.__log = 1;
const cards = () => ev('document.querySelectorAll("#grid .card").length');
const setQ = v => ev(`(()=>{const q=document.getElementById("q");q.value=${JSON.stringify(v)};q.dispatchEvent(new Event("input"))})()`);
const chip = c => ev(`document.querySelector('.tab[data-cat="${c}"]').click()`);

// ---------- Desktop ----------
await view(1440, 900, false, 1);
await nav(BASE + 'index.html'); await ev('localStorage.clear()'); await nav(BASE + 'index.html');
check('render 18 thẻ game', await cards() === 18);
check('font Roboto Slab + Be Vietnam Pro tải được', await ev('document.fonts.ready.then(()=>document.fonts.check(\'700 20px "Roboto Slab"\') && document.fonts.check(\'600 16px "Be Vietnam Pro"\'))'));
check('ảnh thumbnail tải được', await ev('[...document.querySelectorAll("#grid img")].every(i=>i.complete&&i.naturalWidth>0)'), await ev('document.querySelectorAll("#grid img").length') + ' ảnh');
await ev('(async()=>{document.querySelectorAll("#grid img").forEach(i=>i.loading="eager");await Promise.all([...document.querySelectorAll("#grid img")].map(i=>i.decode().catch(()=>0)))})()'); await sleep(800);
check('18/18 ô "Tất cả game" có ảnh thật, không còn hình tạm', await ev('document.querySelectorAll("#grid .tile img").length===18 && document.querySelectorAll("#grid .tile .ph").length===0'), await ev('document.querySelectorAll("#grid .tile img").length') + ' ảnh');
check('12 ảnh mới tải được (đủ pixel, không lỗi)', await ev('(()=>{const ids=["ran-san-moi","dat-bom","ban-bong","2048","co-ca-ngua","ban-cung","xep-gach","tim-diem-khac","dua-xe","nong-trai","ghep-keo","sudoku"];return ids.every(id=>{const i=document.querySelector(`#grid img[src="assets/thumbs/${id}.webp"]`);return i&&i.complete&&i.naturalWidth===384})})()'));
check('mọi ô lưới cùng kích thước, tỉ lệ 4:3', await ev('(()=>{const r=[...document.querySelectorAll("#grid .tile__art")].map(e=>e.getBoundingClientRect());return r.every(x=>Math.abs(x.width-r[0].width)<1&&Math.abs(x.height-r[0].height)<1&&Math.abs(x.width/x.height-4/3)<.03)})()'), await ev('(()=>{const r=document.querySelector("#grid .tile__art").getBoundingClientRect();return Math.round(r.width)+"×"+Math.round(r.height)})()'));
check('ảnh lấp kín ô (object-fit: cover, không viền trống)', await ev('[...document.querySelectorAll("#grid .tile img")].every(i=>getComputedStyle(i).objectFit==="cover"&&Math.abs(i.getBoundingClientRect().height-i.parentElement.clientHeight)<1.5&&Math.abs(i.getBoundingClientRect().width-i.parentElement.clientWidth)<1.5)'));
const above = await ev('[...document.querySelectorAll("#featured .card,#grid .card")].filter(c=>c.getBoundingClientRect().bottom<=innerHeight).length');
check('desktop 1440×900: thẻ game thấy trọn ngay khi mở', above >= 8, above + ' thẻ');
check('khu "Mới & Hot" có 1 thẻ lớn + 4 thẻ vừa, nằm trên lưới Tất cả', await ev('document.querySelectorAll("#featured .hero").length===1 && document.querySelectorAll("#featured .pick").length===4 && document.getElementById("featured").getBoundingClientRect().top < document.getElementById("grid").getBoundingClientRect().top'));
const ratio = await ev('(()=>{const A=e=>{const r=document.querySelector(e).getBoundingClientRect();return r.width*r.height};return Math.round(A("#featured .hero")/A("#grid .card")*10)/10+"× / "+Math.round(A("#featured .pick")/A("#grid .card")*10)/10+"×"})()');
check('desktop: 3 cấp kích thước rõ rệt (thẻ lớn / thẻ vừa so với ô thường)', parseFloat(ratio) >= 6 && parseFloat(ratio.split("/ ")[1]) >= 1.8, ratio);
check('có nhãn Hot/Mới', await ev('document.querySelectorAll("#featured .badge").length') === 5);
check('Tất cả game chia 3 nhóm (Trí tuệ/Giải đố/Hành động)', await ev('document.querySelectorAll("#grid .group").length') === 3);
check('không còn nút pill bo tròn (radius ≤ 4px)', await ev('[...document.querySelectorAll(".btn,.tab,.field")].every(e=>parseFloat(getComputedStyle(e).borderTopLeftRadius)<=4)'));
check('desktop: không cuộn ngang', await ev('document.documentElement.scrollWidth<=innerWidth'));
await shot('desktop-1440.png');
await shot('desktop-1440-full.png', true);

await chip('multi'); check('lọc "Chơi cùng bạn" = 9', await cards() === 9);
await chip('giai-do'); check('lọc "Giải đố" = 7', await cards() === 7);
await chip('all');
await setQ('dao vang');
check('tìm "dao vang" (không dấu) ra Đào Vàng', await ev('[...document.querySelectorAll("#grid .card__name")].map(n=>n.textContent).join()') === 'Đào Vàng');
await setQ('xyz'); check('không có kết quả → hiện thông báo trống', await ev('!document.getElementById("empty").hidden'));
await ev('document.getElementById("clearSearch").click()'); check('"Xem tất cả game" khôi phục 18', await cards() === 18);
await setQ('caro'); check('khi tìm kiếm: ẩn hàng nổi bật để kết quả lên đầu', await ev('document.getElementById("featuredSection").hidden')); await setQ('');

check('desktop: ô mã phòng nằm ngay trên thanh trên', await ev('getComputedStyle(document.getElementById("roomInline")).display!=="none"'));
await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="ab-1";c.dispatchEvent(new Event("input"));document.getElementById("roomInline").requestSubmit()})()');
check('mã sai → báo lỗi', (await ev('document.getElementById("roomInlineError").textContent')).length > 0, 'ô nhập lọc thành "' + await ev('document.getElementById("roomInlineCode").value') + '"');
await shot('desktop-room-error.png');
await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="abc789";c.dispatchEvent(new Event("input"))})()');
await ev('document.getElementById("roomInline").requestSubmit()'); await sleep(1500);
check('mã đúng → play.html?room=ABC789', (await ev('location.search')) === '?room=ABC789', await ev('document.querySelector("h1").textContent'));

await nav(BASE + 'index.html');
await ev(`document.querySelector('a.card[data-id="dao-vang"]').click()`); await sleep(1500);
check('bấm thẻ Đào Vàng → mở thẳng game thật (1 thao tác)', (await ev('location.pathname')).endsWith('/games/dao-vang/') && await ev('!!document.getElementById("play1")'), await ev('location.href'));
await nav(BASE + 'index.html');
await ev(`document.querySelector('a.card[data-id="co-caro"]').click()`); await sleep(1500);
check('game chưa làm (Cờ Caro) → vẫn vào trang chờ play.html', (await ev('location.pathname+location.search')).endsWith('play.html?game=co-caro'), await ev('document.querySelector("h1").textContent'));
await nav(BASE + 'index.html');
check('mục "Chơi tiếp" hiện các game vừa chơi, mới nhất trước', await ev('!document.getElementById("recentSection").hidden && [...document.querySelectorAll("#recent .mini__name")].map(e=>e.textContent).join(",")') === 'Cờ Caro,Đào Vàng');
check('"Chơi tiếp" là điểm nhấn phụ (thẻ mini thấp hơn nhiều thẻ nổi bật)', await ev('document.querySelector("#recent .mini").offsetHeight*2 < document.querySelector("#featured .card").offsetHeight'));
await shot('desktop-1440-recent.png');
await ev('localStorage.clear()');
await ev(`document.querySelector('a.card[data-id="co-ca-ngua"]').click()`); await sleep(1500);
check('bấm thẻ Cờ Cá Ngựa → mở thẳng game thật (1 thao tác)', (await ev('location.pathname')).endsWith('/games/co-ca-ngua/') && await ev('!!document.getElementById("menu") && !!document.getElementById("stage")'), await ev('location.href'));
await ev('document.querySelector("a[href*=homepage]").click()'); await sleep(1500);
check('từ Cờ Cá Ngựa bấm "← Trang chủ" → về trang chủ', (await ev('location.pathname')).endsWith('/homepage/'), await ev('location.href'));
await ev('localStorage.clear()');
check('mỗi thẻ là 1 link duy nhất (1 lần Tab)', await ev('[...document.querySelectorAll("#grid .card")].every(c=>c.tagName==="A"&&c.querySelectorAll("a,button").length===0)'));

// ---------- Tablet ----------
await view(820, 1180, true, 2); await nav(BASE + 'index.html');
check('tablet 820: không cuộn ngang', await ev('document.documentElement.scrollWidth<=innerWidth'));
await shot('tablet-820.png');

// ---------- Mobile ----------
for (const [w, h] of [[390, 844], [360, 740]]) {
  await view(w, h, true, 3); await nav(BASE + 'index.html');
  check(`mobile ${w}: không cuộn ngang`, await ev('document.documentElement.scrollWidth<=innerWidth'), await ev('document.documentElement.scrollWidth+"/"+innerWidth'));
  check(`mobile ${w}: Tất cả game 3 cột`, await ev('getComputedStyle(document.querySelector("#grid .tiles")).gridTemplateColumns.split(" ").length') === 3);
  check(`mobile ${w}: thẻ lớn tràn ngang, 4 game nổi bật thành dải vuốt ngang`, await ev('(()=>{const h=document.querySelector("#featured .hero").getBoundingClientRect(),p=document.querySelector(".picks");return h.width>=innerWidth-26&&p.scrollWidth>p.clientWidth&&getComputedStyle(p).overflowX==="auto"})()'));
  check(`mobile ${w}: thanh trên 1 hàng, ô tìm ở đầu trang`, await ev('document.querySelector(".topbar").offsetHeight<=58 && !!document.querySelector("#mobileSearchSlot .search")'));
  const vis = await ev('[...document.querySelectorAll("#featured .card")].filter(c=>{const r=c.getBoundingClientRect();return r.top>=0&&r.top<innerHeight&&r.left<innerWidth}).length');
  check(`mobile ${w}: game nổi bật hiện ngay khi mở (thấy ít nhất phần đầu)`, vis >= 3, vis + ' thẻ');
  const small = await ev('[...document.querySelectorAll("button,a.card,input,.search")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.top<innerHeight&&(r.height<40||r.width<40)}).map(e=>(e.id||e.className)+":"+Math.round(e.getBoundingClientRect().width)+"x"+Math.round(e.getBoundingClientRect().height)).join(",")');
  check(`mobile ${w}: vùng chạm ≥ 40px`, small === '', small);
  check(`mobile ${w}: tên game không bị cắt`, await ev('[...document.querySelectorAll(".card__name")].filter(n=>n.scrollWidth>n.clientWidth+1).length') === 0);
  await shot(`mobile-${w}.png`);
  if (w === 390) { await ev('localStorage.setItem("wgp.recent",JSON.stringify(["dao-vang","co-tuong","xep-gach"]))'); await nav(BASE + 'index.html'); await shot('mobile-390-recent.png'); await ev('localStorage.clear()'); await nav(BASE + 'index.html'); }
  if (w === 390) {
    await view(390, 844, true, 2); await sleep(500); await shot('mobile-390-full.png', true); await view(390, 844, true, 3);
    await ev('document.getElementById("openRoom").click()');
    check('mobile: nút "Mã phòng" mở hộp thoại', await ev('document.getElementById("roomDialog").open'));
    await ev('(()=>{const c=document.getElementById("roomCode");c.value="ab-1";c.dispatchEvent(new Event("input"));document.getElementById("roomForm").requestSubmit()})()');
    check('mobile: mã sai → báo lỗi trong hộp thoại', (await ev('document.getElementById("roomError").textContent')).length > 0);
    await ev('(()=>{const c=document.getElementById("roomCode");c.value="xyz123";c.dispatchEvent(new Event("input"))})()');
    await shot('mobile-390-room-dialog.png');
    await ev('document.getElementById("roomForm").requestSubmit()'); await sleep(1500);
    check('mobile: mã đúng → play.html?room=XYZ123', (await ev('location.search')) === '?room=XYZ123');
  }
}
check('không có lỗi JS / console', errors.length === 0, errors.join(' | '));
console.log(R.join('\n'));
ws.close(); chrome.kill();
process.exit(0);
