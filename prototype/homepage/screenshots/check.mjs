import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
// Chạy server từ thư mục prototype/ (cổng 8766) để link sang game thật (../games/…) mở được.
const OUT = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:8766/homepage/';
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=' + OUT + '/prof', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 240; i++) {
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

// Báo lỗi mã phòng không được làm xê dịch hàng "ô mã + Vào phòng + Tạo phòng mới"; dòng đỏ nằm trên ô nhập, đọc đủ chữ.
const pinRects = 'JSON.stringify(["roomInlineCode","createRoom"].map(i=>document.getElementById(i)).concat(document.querySelector("#roomInline button[type=submit]")).map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}))';
const pinStable = async (tag, shotName) => {
  await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="";c.dispatchEvent(new Event("input"))})()');
  const before = await ev(pinRects);
  await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="ab1";c.dispatchEvent(new Event("input"));document.getElementById("roomInline").requestSubmit()})()'); await sleep(200);
  const after = await ev(pinRects);
  const err = await ev('(()=>{const e=document.getElementById("roomInlineError"),i=document.getElementById("roomInlineCode"),r=e.getBoundingClientRect();return JSON.stringify({t:e.textContent,above:r.bottom<=i.getBoundingClientRect().top+1,cut:e.scrollWidth>e.clientWidth+1,h:Math.round(r.height)})})()');
  const E = JSON.parse(err);
  if (shotName) await shot(shotName);
  check(`${tag}: mã sai → dòng đỏ hiện phía trên ô nhập, đủ chữ, không làm lệch ô mã/Vào phòng/Tạo phòng mới`, before === after && E.t.length > 0 && E.above && !E.cut && E.h > 0, before === after ? err : before + ' → ' + after);
  await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="abc789";c.dispatchEvent(new Event("input"))})()');
  check(`${tag}: gõ lại mã đúng → dòng đỏ biến mất, hàng nút vẫn giữ chỗ`, await ev('document.getElementById("roomInlineError").textContent') === '' && await ev(pinRects) === before);
  await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="";c.dispatchEvent(new Event("input"))})()');
};
const cards = () => ev('document.querySelectorAll("#grid .card").length');
const setQ = v => ev(`(()=>{const q=document.getElementById("q");q.value=${JSON.stringify(v)};q.dispatchEvent(new Event("input"))})()`);
const chip = c => ev(`document.querySelector('.tab[data-cat="${c}"]').click()`);

// ---------- Desktop ----------
await view(1440, 900, false, 1);
await nav(BASE + 'index.html'); await ev('localStorage.clear()'); await nav(BASE + 'index.html');
const NG = await ev('GAMES.length');
check('render đủ ' + NG + ' thẻ game (mỗi game 1 lần, không lặp giữa các kệ)', await cards() === NG && await ev('new Set([...document.querySelectorAll("#grid .card")].map(c=>c.dataset.id)).size') === NG);
check('font Roboto Slab + Be Vietnam Pro tải được', await ev('document.fonts.ready.then(()=>document.fonts.check(\'800 20px "Roboto Slab"\') && document.fonts.check(\'600 16px "Be Vietnam Pro"\'))'));
check('ảnh thumbnail tải được', await ev('[...document.querySelectorAll("#grid img")].every(i=>i.complete&&i.naturalWidth>0)'), await ev('document.querySelectorAll("#grid img").length') + ' ảnh');
await ev('(async()=>{document.querySelectorAll("#grid img").forEach(i=>i.loading="eager");await Promise.all([...document.querySelectorAll("#grid img")].map(i=>i.decode().catch(()=>0)))})()'); await sleep(800);
check('mọi thẻ game có ảnh thật, không còn hình tạm', await ev('document.querySelectorAll("#grid .card img").length===GAMES.length && document.querySelectorAll("#grid .ph").length===0'), await ev('document.querySelectorAll("#grid .card img").length') + ' ảnh');
check('10 ảnh mới tải được (đủ pixel, không lỗi)', await ev('(()=>{const ids=["ran-san-moi","dat-bom","ban-bong","2048","co-ca-ngua","xep-gach","dua-xe","nong-trai","ghep-keo","sudoku"];return ids.every(id=>{const i=document.querySelector(`#grid img[src="assets/thumbs/${id}.webp"]`);return i&&i.complete&&i.naturalWidth>=384})})()'));
check('Thư viện: mọi ô cùng kích thước, tỉ lệ 4:3', await ev('(()=>{const r=[...document.querySelectorAll("#grid .tile__art")].map(e=>e.getBoundingClientRect());return r.every(x=>Math.abs(x.width-r[0].width)<1&&Math.abs(x.height-r[0].height)<1&&Math.abs(x.width/x.height-4/3)<.03)})()'), await ev('(()=>{const r=document.querySelector("#grid .tile__art").getBoundingClientRect();return Math.round(r.width)+"×"+Math.round(r.height)})()'));
check('ảnh lấp kín ô (object-fit: cover, không viền trống)', await ev('[...document.querySelectorAll("#grid .tile img")].every(i=>getComputedStyle(i).objectFit==="cover"&&Math.abs(i.offsetHeight-i.parentElement.clientHeight)<1.5&&Math.abs(i.offsetWidth-i.parentElement.clientWidth)<1.5)'));
check('thương hiệu "Lụm Kèo" + slogan "Rủ bạn vào chơi" hiện trên thanh trên', await ev('(()=>{const t=document.querySelector(".topbar .logo__text"),s=document.querySelector(".topbar .logo__slogan");return t.textContent==="Lụm Kèo"&&s.textContent==="Rủ bạn vào chơi"&&t.offsetHeight>0&&s.offsetHeight>0})()') && (await ev('document.title')).startsWith('Lụm Kèo'), await ev('document.title'));
check('Tầng 1: carousel (trái, ~1/3) + sảnh chờ (phải, ~2/3) cùng hàng', await ev('(()=>{const a=document.querySelector("#featured").getBoundingClientRect(),b=document.querySelector(".lobby").getBoundingClientRect();return Math.abs(a.top-b.top)<2&&a.right<b.left&&b.width>a.width*1.8})()'), await ev('(()=>{const a=document.querySelector("#featured").offsetWidth,b=document.querySelector(".lobby").offsetWidth;return a+"px / "+b+"px"})()'));
check('carousel: ' + await ev('HERO_SLIDES.length') + ' trang, ảnh 4:3 hiện TRỌN (object-fit: contain, không cắt)', await ev('(()=>{const s=document.querySelectorAll("#heroTrack .slide");const a=document.querySelector(".slide .hero__art").getBoundingClientRect(),i=document.querySelector(".slide .hero__art img");return s.length===HERO_SLIDES.length&&getComputedStyle(i).objectFit==="contain"&&Math.abs(a.width/a.height-4/3)<.03})()'), await ev('(()=>{const a=document.querySelector(".slide .hero__art").getBoundingClientRect();return Math.round(a.width)+"×"+Math.round(a.height)})()'));
{ const d0 = await ev('document.querySelector(".hero__dot[aria-current=true]").dataset.i'); await ev('document.getElementById("heroNext").click()'); await sleep(700);
  check('carousel: nút › chuyển sang trang kế, chấm chỉ trang cập nhật', await ev('document.querySelector(".hero__dot[aria-current=true]").dataset.i') === String((+d0 + 1) % await ev('HERO_SLIDES.length')));
  await ev('document.getElementById("heroPrev").click()'); await sleep(700); }
check('Tầng 1 thấy trọn trong màn 1440×900 (không cần cuộn)', await ev('Math.max(document.querySelector("#featured").getBoundingClientRect().bottom,document.querySelector(".lobby").getBoundingClientRect().bottom)<=innerHeight'), await ev('Math.round(Math.max(document.querySelector("#featured").getBoundingClientRect().bottom,document.querySelector(".lobby").getBoundingClientRect().bottom))+"px"'));
check('sảnh chờ: ' + await ev('LOBBY_ROOMS.length') + ' phòng, xếp 3 phòng/hàng, mỗi phòng có nút "Vào" + số ghế', await ev('(()=>{const r=[...document.querySelectorAll("#rooms .room")];return r.length===LOBBY_ROOMS.length&&r.length>=10&&getComputedStyle(document.getElementById("rooms")).gridTemplateColumns.split(" ").length===3&&r.every(x=>x.querySelector("a.room__go")&&/\\d\\/\\d/.test(x.querySelector(".room__cnt").textContent))})()'));
check('sảnh chờ: phòng không bị cắt chữ (tên game, số ghế, nút Vào thấy đủ)', await ev('[...document.querySelectorAll("#rooms .room")].every(r=>{const b=r.getBoundingClientRect(),g=r.querySelector(".room__go").getBoundingClientRect(),c=r.querySelector(".room__cnt");return g.right<=b.right&&c.offsetWidth>0&&c.getBoundingClientRect().right<=g.left})'));
check('sảnh chờ: đã bỏ hàng lọc phòng theo game', await ev('!document.getElementById("roomGames") && !document.querySelector(".lobby .chip")'));
check('nút Tạo phòng / Vào phòng chỉ có 1 bộ (trong sảnh chờ), header không còn nút trùng', await ev('(()=>{const t=[...document.querySelectorAll("a,button")].filter(e=>e.offsetParent&&/Tạo phòng|Nhập mã/i.test(e.textContent));return t.length===1&&!!t[0].closest(".lobby")&&!document.querySelector(".topbar .btn")&&!document.getElementById("roomDialog")&&document.querySelectorAll("#roomInline button[type=submit]").length===1})()'), await ev('[...document.querySelectorAll("a,button")].filter(e=>e.offsetParent&&/Tạo phòng|Nhập mã|Vào phòng/i.test(e.textContent)).map(e=>e.textContent.trim()).join(" | ")'));
{ const top = await ev('(async()=>{document.getElementById("createRoom").click();await new Promise(r=>setTimeout(r,1200));return Math.round(document.getElementById("duel").getBoundingClientRect().top)})()');
  check('"Tạo phòng mới" → cuộn tới kệ Đối kháng đông người để chọn game', top >= 0 && top < 200, 'kệ cách đỉnh ' + top + 'px'); await ev('scrollTo(0,0)'); await sleep(300); }
check('bộ lọc trên lưới = đúng tên + số của các kệ bên dưới', await ev('(()=>{const tabs=[...document.querySelectorAll("#chips .tab")].slice(1).map(t=>t.firstChild.textContent.trim()+"="+t.querySelector(".tab__n").textContent);const sh=[...document.querySelectorAll("#grid .shelf__title")].map(x=>x.firstChild.textContent.trim()+"="+x.querySelector(".count").textContent);return tabs.join()===sh.join()&&document.querySelector("#chips .tab .tab__n").textContent===String(GAMES.length)})()'), await ev('[...document.querySelectorAll("#chips .tab")].map(t=>t.textContent.trim().replace(/\s+/g," ")).join(" | ")'));

check('sảnh chờ: phòng Cờ Cá Ngựa "Vào" mở game thật', (await ev('document.querySelector("#rooms .room__go").getAttribute("href")')).includes('games/co-ca-ngua'), await ev('document.querySelector("#rooms .room__go").getAttribute("href")'));
check('Tầng 2: kệ đầu "Đối kháng đông người" (' + await ev('DUELS.length') + ' game) rồi các kệ danh mục, không còn mục "Chơi tiếp"', await ev('(()=>{const t=[...document.querySelectorAll("#grid .shelf__title")].map(x=>x.firstChild.textContent.trim());return t[0]==="Đối kháng đông người"&&document.querySelectorAll("#grid .shelf--duel .tile").length===DUELS.length&&t.length>=3&&!document.getElementById("recentSection")&&!document.getElementById("recent")})()'), await ev('[...document.querySelectorAll("#grid .shelf__title")].map(x=>x.firstChild.textContent.trim()).join(" | ")'));
check('mọi kệ cùng 1 kiểu lưới 6 ô/dòng; ô đối kháng có nhãn số phòng', await ev('[...document.querySelectorAll("#grid .tiles")].every(t=>getComputedStyle(t).gridTemplateColumns.split(" ").length===6) && [...document.querySelectorAll(".shelf--duel .tile:not(.is-soon)")].every(d=>/phòng/.test(d.querySelector(".tile__rooms")?.textContent||""))'));
check('Thư viện: 6 cột trên desktop', await ev('getComputedStyle(document.querySelector("#grid .tiles")).gridTemplateColumns.split(" ").length') === 6);
check('màu vàng chỉ dùng cho nút chính "Chơi ngay" (trong carousel)', await ev('(()=>{const g=[...document.querySelectorAll("body *")].filter(e=>/255, 201, 74/.test(getComputedStyle(e).backgroundImage+getComputedStyle(e).backgroundColor));return g.length===HERO_SLIDES.length&&g.every(e=>!!e.closest(".hero")&&/Chơi ngay/i.test(e.textContent))})()'), await ev('[...document.querySelectorAll("body *")].filter(e=>/255, 201, 74/.test(getComputedStyle(e).backgroundImage+getComputedStyle(e).backgroundColor)).length') + ' nút vàng');
check('Nối Thú có link game thật', await ev(`document.querySelector('#grid a.card[data-id="noi-thu"]').getAttribute('href')`) === '../games/noi-thu/');
check('game chưa có bản chơi: thẻ có nhãn "Đang cập nhật" + ảnh mờ (mọi nơi)', await ev('(()=>{const ids=GAMES.filter(g=>!g.url).map(g=>g.id);const c=[...document.querySelectorAll("#grid a.card")];const soon=c.filter(a=>a.classList.contains("is-soon"));return soon.length===ids.length&&soon.every(a=>ids.includes(a.dataset.id)&&/Đang cập nhật/.test(a.querySelector(".soon")?.textContent||"")&&/blur/.test(getComputedStyle(a.querySelector("img")).filter))})()'), await ev('GAMES.filter(g=>!g.url).length') + ' game đang cập nhật');
check('game chơi được: ảnh rõ, không nhãn "Đang cập nhật"', await ev('[...document.querySelectorAll("#grid a.card")].filter(a=>GAMES.find(g=>g.id===a.dataset.id).url).every(a=>!a.classList.contains("is-soon")&&!a.querySelector(".soon")&&getComputedStyle(a.querySelector("img")).filter==="none")'), await ev('GAMES.filter(g=>g.url).map(g=>g.name).join(", ")'));
check('sảnh chờ: phòng của game chưa có ghi "Sắp có" + ảnh mờ', await ev('[...document.querySelectorAll("#rooms .room")].every(r=>{const s=r.classList.contains("is-soon");return s===(r.querySelector(".room__go").textContent==="Sắp có")})'));
check('có nhãn Hot/Mới', await ev('document.querySelectorAll("#featured .badge,#grid .badge").length') >= 3);
check('footer: banner tài trợ + nút âm thanh', await ev('!!document.querySelector(".footer .sponsor") && !!document.querySelector(".footer #soundBtn")'));
check('pixel UI: không bo góc (radius = 0) cho nút, ô, thẻ, khung', await ev('[...document.querySelectorAll(".btn,.tab,.field,.card,.px-panel,.room")].every(e=>parseFloat(getComputedStyle(e).borderTopLeftRadius)===0)'));
check('desktop: không cuộn ngang', await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));
await shot('desktop-1440.png');
await ev('(async()=>{document.querySelectorAll("img").forEach(i=>i.loading="eager");await Promise.all([...document.querySelectorAll("img")].map(i=>i.decode().catch(()=>0)))})()'); await shot('desktop-1440-full.png', true);

for (const sh of await ev('SHELVES.map(s=>s.cat)')) { await chip(sh); const want = await ev(`document.querySelector('.tab[data-cat="${sh}"] .tab__n').textContent`);
  check('bấm tab "' + await ev(`SHELVES.find(s=>s.cat==="${sh}").title`) + '" → hiện đúng ' + want + ' game của kệ đó', String(await cards()) === want && await ev(`document.getElementById('gamesTitle').firstChild.textContent.trim()===SHELVES.find(s=>s.cat==="${sh}").title`)); }

await chip('all');
await setQ('dao vang');
check('tìm "dao vang" (không dấu) ra Đào Vàng', await ev('[...document.querySelectorAll("#grid .card__name")].map(n=>n.textContent).join()') === 'Đào Vàng');
await setQ('xyz'); check('không có kết quả → hiện thông báo trống', await ev('!document.getElementById("empty").hidden'));
await ev('document.getElementById("clearSearch").click()'); check('"Xem tất cả game" khôi phục đủ ' + NG, await cards() === NG);
await setQ('caro'); check('khi tìm kiếm: ẩn tầng tiêu điểm/sảnh chờ để kết quả lên đầu', await ev('document.getElementById("featuredSection").hidden')); await setQ('');

await pinStable('desktop 1440');
check('desktop: ô mã phòng có sẵn trong sảnh chờ', await ev('getComputedStyle(document.getElementById("roomInline")).display!=="none"'));
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
await ev(`document.querySelector('a.card[data-id="noi-thu"]').click()`); await sleep(1500);
check('bấm thẻ Nối Thú → mở thẳng game thật', (await ev('location.pathname')).endsWith('/games/noi-thu/') && await ev('!!document.getElementById("stage")'), await ev('location.href'));
await nav(BASE + 'index.html');
await ev(`document.querySelector('a.card[data-id="co-tuong"]').click()`); await sleep(1500);
check('bấm thẻ Cờ Tướng → mở thẳng game thật', (await ev('location.pathname')).endsWith('/games/co-tuong/') && await ev('!!document.getElementById("stage")'), await ev('location.href'));
await nav(BASE + 'index.html');
await ev(`document.querySelector('a.card[data-id="dat-bom"]').click()`); await sleep(1500);
check('bấm thẻ Đặt Bom → mở thẳng game thật', (await ev('location.pathname')).endsWith('/games/dat-bom/') && await ev('!!document.getElementById("createBtn")'), await ev('location.href'));
await nav(BASE + 'index.html');
await ev(`document.querySelector('a.card[data-id="nong-trai"]').click()`); await sleep(1500);
check('game đang cập nhật (Nông Trại) → vào trang chờ play.html', (await ev('location.pathname+location.search')).endsWith('play.html?game=nong-trai'), await ev('document.querySelector("h1").textContent'));
await nav(BASE + 'index.html');
check('đã bỏ mục "Chơi tiếp" (kể cả khi có lịch sử chơi)', await ev('!document.getElementById("recentSection") && !document.querySelector(".mini")'));
await ev('localStorage.clear()');
await ev(`document.querySelector('a.card[data-id="co-ca-ngua"]').click()`); await sleep(1500);
check('bấm thẻ Cờ Cá Ngựa → mở thẳng game thật (1 thao tác)', (await ev('location.pathname')).endsWith('/games/co-ca-ngua/') && await ev('!!document.getElementById("stage")'), await ev('location.href'));
await ev('document.querySelector("a[href*=homepage]").click()'); await sleep(1500);
check('từ Cờ Cá Ngựa bấm "← Trang chủ" → về trang chủ', (await ev('location.pathname')).endsWith('/homepage/'), await ev('location.href'));
await ev('localStorage.clear()');
check('mỗi thẻ là 1 link duy nhất (1 lần Tab)', await ev('[...document.querySelectorAll("#grid .card")].every(c=>c.tagName==="A"&&c.querySelectorAll("a,button").length===0)'));

// ---------- Tablet ----------
await view(820, 1180, true, 2); await nav(BASE + 'index.html');
check('tablet 820: không cuộn ngang', await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));
await shot('tablet-820.png');
await pinStable('tablet 820');
await view(1100, 800, false, 1); await nav(BASE + 'index.html'); await pinStable('laptop 1100');
await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="ab1";c.dispatchEvent(new Event("input"));document.getElementById("roomInline").requestSubmit()})()'); await sleep(200); await shot('laptop-1100-room-error.png');

// ---------- Mobile ----------
for (const [w, h] of [[390, 844], [360, 740]]) {
  await view(w, h, true, 3); await nav(BASE + 'index.html');
  check(`mobile ${w}: không cuộn ngang`, await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth'), await ev('document.documentElement.scrollWidth+"/"+document.documentElement.clientWidth'));
  check(`mobile ${w}: Tất cả game 3 cột`, await ev('getComputedStyle(document.querySelector("#grid .tiles")).gridTemplateColumns.split(" ").length') === 3);
  check(`mobile ${w}: xếp dọc tiêu điểm → sảnh chờ (ô mã + Tạo phòng mới); phòng chờ là dải vuốt ngang`, await ev('(()=>{const h=document.querySelector("#featured .hero").getBoundingClientRect(),l=document.querySelector(".lobby").getBoundingClientRect(),c=document.getElementById("createRoom").getBoundingClientRect(),p=document.getElementById("rooms");return h.width>=innerWidth-30&&h.bottom<=l.top&&c.height>=44&&c.width>0&&p.scrollWidth>p.clientWidth&&getComputedStyle(p).overflowX==="auto"})()'));
  check(`mobile ${w}: logo + slogan vẫn hiện, không tràn`, await ev('document.querySelector(".logo__slogan").offsetHeight>0 && document.querySelector(".logo__words").getBoundingClientRect().right<=innerWidth'));
  check(`mobile ${w}: thanh trên 1 hàng, ô tìm ở đầu trang`, await ev('document.querySelector(".topbar").offsetHeight<=58 && !!document.querySelector("#mobileSearchSlot .search")'));
  check(`mobile ${w}: nút "Chơi ngay" thấy ngay khi mở`, await ev('document.querySelector(".hero .btn--gold").getBoundingClientRect().bottom<=innerHeight'));
  const small = await ev('[...document.querySelectorAll("button,a.card,input,.search")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.top<innerHeight&&(r.height<40||r.width<40)}).map(e=>(e.id||e.className)+":"+Math.round(e.getBoundingClientRect().width)+"x"+Math.round(e.getBoundingClientRect().height)).join(",")');
  check(`mobile ${w}: vùng chạm ≥ 40px`, small === '', small);
  await ev('document.getElementById("roomInline").scrollIntoView({block:"center"})'); await sleep(200);
  await pinStable(`mobile ${w}`, `mobile-${w}-room-error.png`); await ev('scrollTo(0,0)'); await sleep(200);
  check(`mobile ${w}: tên game không bị cắt`, await ev('[...document.querySelectorAll(".card__name")].filter(n=>n.scrollWidth>n.clientWidth+1).length') === 0);
  await shot(`mobile-${w}.png`);
  if (w === 390) {
    await view(390, 844, true, 2); await sleep(500); await ev('(async()=>{document.querySelectorAll("img").forEach(i=>i.loading="eager");await Promise.all([...document.querySelectorAll("img")].map(i=>i.decode().catch(()=>0)))})()'); await shot('mobile-390-full.png', true); await view(390, 844, true, 3);
    await ev('document.getElementById("rooms").scrollIntoView()'); await ev('scrollBy(0,-300)'); await sleep(300); await shot('mobile-390-lobby.png');
    await ev('(()=>{const c=document.getElementById("roomInlineCode");c.value="xyz123";c.dispatchEvent(new Event("input"));document.getElementById("roomInline").requestSubmit()})()'); await sleep(1500);
    check('mobile: ô mã trong sảnh chờ, mã đúng → play.html?room=XYZ123', (await ev('location.search')) === '?room=XYZ123');
  }
}
check('không có lỗi JS / console', errors.length === 0, errors.join(' | '));
console.log(R.join('\n'));
ws.close(); chrome.kill();
process.exit(0);
