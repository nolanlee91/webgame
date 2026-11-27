// E2E Tiệm Trà Sữa trên Chrome headless qua CDP — bấm chuột / chạm thật, chụp desktop 1366×768 + mobile 390×844.
// Chạy (ở gốc repo): PORT=8810 node server.js   rồi   PORT=8810 node prototype/games/tiem-tra-sua/test/e2e.mjs <thư mục ảnh>
// Kịch bản: mở game → nhận tiệm → mở ca → phục vụ đúng 3 khách (kiểm ly đổi hình ở từng bước) → 1 đơn sai (khiếu nại)
// → 1 khách hết kiên nhẫn → bảng chốt ca → Nhật Ký Làm Chủ (thẻ ảnh) → sự kiện giữa hai ca (chọn, xem hậu quả) → tải lại giữ tiến trình
// → kéo-thả trang trí → giữa ca tải lại giữ ly / phiếu → mobile chơi bằng chạm → sự kiện drama trong ca (390 px) → đơn hai ly (desktop).
import { writeFileSync } from "node:fs";
import { launch, sleep } from "./cdp.mjs";
import { runLayout } from "./e2e-layout.mjs";
import { LEVELS } from "../data/levels.js";
const LV = LEVELS.map((L) => L.xp);

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8810;
const BASE = `http://127.0.0.1:${PORT}/games/tiem-tra-sua/?seed=777&calm=1`; // calm=1: sự kiện trong ca chỉ mở bằng __game.forceEvent
const b = await launch(OUT, 9391);
const R = []; let fails = 0;
const check = (n, c, d = "") => { const s = (c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : ""); if (!c) fails++; R.push(s); console.log(s); };
let press = b.click;
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'nearest',inline:'nearest'});let r=e.getBoundingClientRect();const hit=(q)=>{const x=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);return !x||e.contains(x)||x.contains(e)};if(r.width&&e.closest('.sheet')&&!hit(r)){e.scrollIntoView({block:'center',inline:'nearest'});r=e.getBoundingClientRect();}return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
async function pressSel(sel) {
  let p = null;
  for (let i = 0; i < 30 && !(p = await at(sel)); i++) await sleep(100); // phần tử có thể hiện ở khung hình kế tiếp
  if (!p) throw new Error("không thấy " + sel + " :: " + (await b.ev("JSON.stringify({cup:__game.state.shift?.cup,ov:__game.overlay,opts:[...document.querySelectorAll('#opts .opt')].map(e=>e.dataset.step+':'+e.dataset.id+(e.disabled?'(x)':'')).join(' '),toasts:document.querySelector('#toasts').textContent})")));
  await sleep(40); await press(...((await at(sel)) || p)); await sleep(160);
}
const S = (expr) => b.ev(`(()=>{const s=__game.state;return ${expr}})()`);
const visible = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0})()`);
const text = (sel) => b.ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const stage = () => b.ev(`document.querySelector('#cupView .bigcup').dataset.stage`);
const noOverflowX = () => b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth");
async function waitFor(expr, ms = 8000) { for (let t = 0; t < ms; t += 100) { if (await b.ev(expr).catch(() => false)) return true; await sleep(100); } return false; }
/** Tua thời gian ca tới khi có khách id đứng chờ. */
async function untilWaiting(cid) {
  for (let i = 0; i < 400; i++) {
    if (await S(`!!s.shift&&s.shift.customers.some(c=>c.id===${cid}&&c.phase==='wait')`)) return true;
    await b.ev("__game.advance(250)");
  }
  return false;
}
const order = (cid) => S(`JSON.stringify(s.shift.customers.find(c=>c.id===${cid}).order)`).then(JSON.parse);
/** Pha bằng cách bấm nút nguyên liệu thật; trả danh sách stage sau mỗi bước. */
async function brewClicks(o, onStep = null) {
  const seq = [["cup", "ly"], ["base", o.base], ["add", o.add], ["sugar", o.sugar], ["ice", o.ice], ["topping", o.topping], ["lid", "dong-nap"]];
  const stages = [await stage()];
  for (const [step, id] of seq) {
    if (onStep) await onStep(step, id);
    await pressSel(`#opts .opt[data-step="${step}"][data-id="${id}"]`);
    stages.push(await stage());
  }
  return stages;
}

// Gián điệp âm thanh: đếm AudioContext tạo ra và mọi nguồn tiếng bắt đầu phát (AudioBufferSource / HTMLAudio), cài trước khi trang chạy.
await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(() => {
  const spy = window.__audioSpy = { ctx: 0, starts: 0, loops: 0, html: 0 };
  const AC = window.AudioContext;
  if (AC) window.AudioContext = class extends AC { constructor(...a) { super(...a); spy.ctx++; } };
  const st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { spy.starts++; if (this.loop) spy.loops++; return st.apply(this, a); };
  const hp = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) { spy.html++; return hp.apply(this, a); };
})();` });
const audioFetched = () => b.ev("performance.getEntriesByType('resource').filter(e=>e.name.includes('/assets/audio/')).map(e=>e.name.split('/').pop().split('?')[0])");

// ===== 1. Người chơi mới, desktop, chuột =====
await b.view(1366, 768, false); await b.touch(false); press = b.click;
await b.nav(BASE); await b.ev("localStorage.clear()"); await b.nav(BASE);
await sleep(500);
check("âm thanh: trước thao tác người chơi không tạo AudioContext, không phát, không tải file âm thanh nào", await b.ev("__audioSpy.ctx===0&&__audioSpy.starts===0&&__audioSpy.html===0&&__game.sound().ctx===null") && (await audioFetched()).length === 0, JSON.stringify([await b.ev("JSON.stringify(__audioSpy)"), await audioFetched()]));
check("mở game: bảng chào mừng có chân dung nhân viên (portraits.webp) và ô tên tiệm", await visible("#introGo") && await visible("#shopName") && await b.ev("!!document.querySelector('.intro .portrait[style*=\"portraits\"]')"));
check("cảnh tiệm dùng nhân viên 144 × 192 từ barista-scene", await waitFor(`(() => {
  const actor = document.querySelector('.stage .barista');
  return !!document.querySelector('#scene img.bglayer[src$="shop-scene.webp"]') && // QUICK2-04: ảnh cảnh là thẻ có sẵn trong HTML, nằm dưới sân khấu
    !document.querySelector('#scene .scene-ph') &&
    !!document.querySelector('.stage img[src$="shop-counter-foreground.webp"]') &&
    actor?.style.backgroundImage.includes("barista-scene.webp") &&
    actor.style.width === "144px" && actor.style.height === "192px";
})()`));
await b.shot(OUT + "/01-desktop-chao-mung.png");
await b.ev(`(()=>{const i=document.querySelector('#shopName');i.value='';})()`);
await pressSel("#shopName");
await b.send("Input.insertText", { text: "Trà Sữa Hẻm Nhà Mình" });
check("tính cách chủ tiệm ở màn chào: 4 thẻ, mặc định Hiền lành", await b.ev("document.querySelectorAll('.intro .pcard').length===4&&document.querySelector('.intro .pcard.on').dataset.persona==='hien'"));
await pressSel('.intro .pcard[data-persona="lay"]');
check("chọn Lầy lội: thẻ sáng lên", await b.ev("document.querySelector('.intro .pcard.on').dataset.persona==='lay'"));
await pressSel("#introGo");
check("nhận tiệm ⇒ tính cách chủ tiệm là Lầy lội", (await S("s.owner.persona")) === "lay");
check("đặt tên tiệm (có dấu) → hiện trên thanh trên", (await text("#shopLabel")) === "Trà Sữa Hẻm Nhà Mình");
check("bảng Chuẩn bị ca ngày 1: menu 8 món (2 đã mở), kho, nút Mở quán", await visible("#openShop") && /Ngày 1/.test(await text(".sheet h2")) && await b.ev("document.querySelectorAll('.menu li').length===8&&document.querySelectorAll('.menu li.locked').length===6"));
await b.shot(OUT + "/02-desktop-chuan-bi-ca.png");
await pressSel("#openShop");
check("mở quán: trừ phí ca 12k (160 → 148), đồng hồ ca chạy", (await S("s.money")) === 148 && await S("s.shift&&s.shift.status==='open'"));
await sleep(600);
const t1 = await S("s.shift.t");
check("đồng hồ ca tăng theo thời gian thật", t1 > 200, String(t1));
await waitFor("__game.sound().loops.includes('counter-rhythm')", 6000);
const snd1 = await b.ev("JSON.stringify({spy:__audioSpy,sound:__game.sound()})").then(JSON.parse);
const got1 = await audioFetched();
// (_shared/feedback.js của cổng tạo AudioContext riêng cho tiếng bấm nút — game chỉ thêm đúng một)
check("âm thanh: sau khi bấm, AudioContext của game chạy, có hiệu ứng phát (mở quán), nhạc quầy + âm quán lặp, mỗi vòng lặp một bản",
  snd1.spy.ctx >= 1 && snd1.spy.ctx <= 2 && snd1.sound.ctx === "running" && snd1.sound.started >= 1 && snd1.sound.scene === "service" &&
  snd1.sound.loops.includes("counter-rhythm") && snd1.sound.loops.includes("shop-loop") && !snd1.sound.loops.includes("evening-prep") &&
  new Set(snd1.sound.loops).size === snd1.sound.loops.length && snd1.sound.failed.length === 0, JSON.stringify(snd1));
check("âm thanh: tải lười — chỉ file cần tới (không tải bài nhạc chưa dùng hết lượt), mỗi file một lần",
  got1.includes("open.mp3") && got1.includes("counter-rhythm.mp3") && new Set(got1).size === got1.length, got1.join(","));
// Nút Tiếng xoay vòng: bật hết → chỉ hiệu ứng (nhạc tắt, âm quán còn) → tắt → bật hết
await pressSel("#muteBtn");
await waitFor("!__game.sound().loops.includes('counter-rhythm')", 2000);
check("nút Tiếng lần 1: chỉ hiệu ứng — tắt nhạc quầy, còn âm quán, lưu tts.music=0, wgp.muted vẫn 0",
  await b.ev("document.querySelector('#muteBtn').dataset.mode==='sfx'&&localStorage.getItem('tts.music')==='0'&&localStorage.getItem('wgp.muted')!=='1'&&__game.sound().loops.includes('shop-loop')&&!__game.sound().loops.includes('counter-rhythm')"));
await pressSel("#muteBtn");
check("nút Tiếng lần 2: tắt — wgp.muted=1, không còn vòng lặp", await waitFor("document.querySelector('#muteBtn').dataset.mode==='off'&&localStorage.getItem('wgp.muted')==='1'&&__game.sound().loops.length===0", 2000));
await pressSel("#muteBtn");
check("nút Tiếng lần 3: bật lại hết, nhạc chạy tiếp", await waitFor("document.querySelector('#muteBtn').dataset.mode==='all'&&localStorage.getItem('wgp.muted')==='0'&&__game.sound().loops.includes('counter-rhythm')", 3000));
// Tab khác (hoặc game khác của Lụm Kèo) tắt tiếng chung: sự kiện storage
await b.ev("localStorage.setItem('wgp.muted','1');dispatchEvent(new StorageEvent('storage',{key:'wgp.muted'}))");
const startsMuted = await b.ev("__game.sound().started");
check("tắt tiếng ở tab khác: nút đổi sang tắt, vòng lặp dừng, hiệu ứng không phát", await waitFor("document.querySelector('#muteBtn').dataset.mode==='off'&&__game.sound().loops.length===0", 2000) &&
  (await b.ev("import('/games/tiem-tra-sua/ui/sfx.js?v=d11').then(m=>m.play('coin'))")) === false && (await b.ev("__game.sound().started")) === startsMuted);
await b.ev("localStorage.setItem('wgp.muted','0');dispatchEvent(new StorageEvent('storage',{key:'wgp.muted'}))");
check("bật lại ở tab khác: nhạc chạy lại", await waitFor("document.querySelector('#muteBtn').dataset.mode==='all'&&__game.sound().loops.includes('counter-rhythm')", 3000));
await pressSel("#pauseBtn");
check("tạm dừng: âm nền dừng hẳn", await waitFor("__game.sound().scene==='quiet'&&__game.sound().loops.length===0", 2000));
await pressSel("#resumeBtn");
check("tiếp tục ca: âm nền chạy lại, không tạo thêm AudioContext", await waitFor(`__game.sound().loops.includes('counter-rhythm')&&__audioSpy.ctx===${snd1.spy.ctx}`, 3000));

// ===== 2. Ba khách phục vụ đúng =====
const served = [];
for (const [cid, how] of [[1, "scene"], [2, "rail"], [3, "scene"]]) {
  check(`khách #${cid} đi vào và đứng chờ`, await untilWaiting(cid));
  await sleep(250);
  if (how === "scene") await pressSel(`.cust[data-cid="${cid}"]`); else await pressSel(`#rail .slip[data-cid="${cid}"]`);
  check(`chạm ${how === "scene" ? "khách trong cảnh" : "phiếu ở dải phiếu"} → ghim phiếu #${cid} lên Quầy pha`, (await S("s.shift.stations[s.shift.sel].cid")) === cid && /#\d+ · /.test(await text("#ticket .t-name")));
  const o = await order(cid);
  const money0 = await S("s.money");
  const price = await S(`s.shift.customers.find(c=>c.id===${cid}).price`);
  let hintOk = true;
  const stages = await brewClicks(o, async (step, id) => {
    if (cid !== 1 || step === "cup" || step === "lid") return;
    hintOk &&= await b.ev(`(()=>{const h=[...document.querySelectorAll('#opts .opt.hint')];return h.length===1&&h[0].dataset.id===${JSON.stringify(String(id))}})()`);
  });
  if (cid === 1) check("ngày học: ở mỗi bước, đúng một nút theo phiếu được đánh dấu “Phiếu ghi”", hintOk);
  if (cid === 1) {
    check("ly đổi hình ở MỖI bước (7 bước → 8 trạng thái khác nhau, từ ly trống tới có nắp)", new Set(stages).size === 8, stages.join(" | "));
    check("lớp ly cuối: sữa 75% + vệt siro (asset mới) + trân châu + đá + thành ly + nắp", stages.at(-1) === "milk-75+syrup-swirl+pearls-bottom+ice-top+empty-cup+dome-lid", stages.at(-1));
    check("ly nhỏ trên mặt quầy trong cảnh cũng có nắp", await b.ev("[...document.querySelectorAll('.minicup i')].some(e=>/cup-layers/.test(e.style.backgroundImage))&&document.querySelectorAll('.minicup i').length===6"));
    check("phiếu tích đúng từng mục đã pha", await b.ev("document.querySelectorAll('#ticket .t-items li.ok').length===document.querySelectorAll('#ticket .t-items li').length"));
    await b.shot(OUT + "/03-desktop-pha-xong.png");
  } else check(`ly #${cid} đổi hình ở từng bước có nguyên liệu`, new Set(stages).size >= 6, stages.join(" | "));
  check(`nút Giao sáng lên và ghi tên khách`, await b.ev("!document.querySelector('#serveBtn').disabled") && (await text("#serveBtn")).includes("Giao cho"));
  await pressSel("#serveBtn");
  const rv = await S(`JSON.stringify(s.shift.reviews.find(r=>r.cid===${cid}))`).then(JSON.parse);
  served.push(rv);
  check(`giao #${cid}: +${price}k, review ${rv?.stars} sao, khách vui đứng phản ứng`, (await S("s.money")) === money0 + price && rv && rv.stars >= 4 && (await S(`s.shift.customers.find(c=>c.id===${cid}).mood`)) === "happy");
  if (cid === 1) { await sleep(150); await b.shot(OUT + "/04-desktop-giao-ly.png"); }
  const again = await b.ev(`__game.act({type:'serve',cid:${cid}}).err`);
  check(`giao lặp #${cid} bị chặn (không cộng tiền lần hai)`, again === "not-waiting");
}

// ===== 3. Đơn sai → khiếu nại =====
check("khách #4 đứng chờ", await untilWaiting(4));
await pressSel(`#rail .slip[data-cid="4"]`);
const o4 = await order(4);
const wrongAdd = o4.add === "sua" ? "dao" : "sua";
const m4 = await S("s.money");
await brewClicks({ ...o4, add: wrongAdd });
await pressSel("#serveBtn");
check("giao sai món nền → bảng khiếu nại có chân dung khách + nhân viên và 3 cách xử lý", await waitFor("!!document.querySelector('.sheet[data-kind=complaint]')") && await b.ev("document.querySelectorAll('.choices .choice').length===3&&document.querySelectorAll('.drama .portrait').length===2"));
check("khiếu nại: chưa thu tiền, đồng hồ ca dừng", (await S("s.money")) === m4 && await (async () => { const a = await S("s.shift.t"); await sleep(500); return (await S("s.shift.t")) === a; })());
check("khiếu nại: âm nền hạ nhỏ (vẫn một bản nhạc quầy, không có nồi sôi), đã phát tiếng khiếu nại", await b.ev("(()=>{const d=__game.sound();return d.scene==='dialog'&&d.loops.filter(n=>n==='counter-rhythm').length===1&&!d.loops.includes('boil-loop')})()") && (await audioFetched()).includes("complaint.mp3"));
await b.shot(OUT + "/05-desktop-khieu-nai.png");
await pressSel('.choices [data-choice="refund"]');
check("chọn “Xin lỗi, không lấy tiền”: 0 doanh thu, ly tính hao hụt, review 2 sao lý do xin lỗi", (await S("s.money")) === m4 && (await S("s.shift.ledger.refunds")) === 1 && (await S("s.shift.ledger.waste")) > 0 && (await S("s.shift.reviews.find(r=>r.cid===4).stars")) === 2);

// ===== 4. Hết kiên nhẫn =====
check("khách #5 đứng chờ", await untilWaiting(5));
await pressSel(`.cust[data-cid="5"]`);
const pat = await S("s.shift.customers.find(c=>c.id===5).patience");
await b.ev(`__game.advance(${Math.round(pat * 0.7)})`);
await sleep(200);
check("khách sốt ruột: dáng impatient (customer-reactions) + thanh kiên nhẫn đỏ", /impatient/.test(await S("s.shift.customers.find(c=>c.id===5).mood")) && await b.ev("!!document.querySelector('.cust[data-cid=\"5\"][data-mood=\"impatient\"]')") && await b.ev("!!document.querySelector('#ticket .pbar.low')"));
await b.shot(OUT + "/06-desktop-sot-ruot.png");
await b.ev(`__game.advance(${Math.round(pat * 0.35)})`);
check("hết kiên nhẫn: khách bỏ về, review 1 sao, phiếu gỡ khỏi quầy", (await S("s.shift ? s.shift.reviews.find(r=>r.cid===5)?.stars : s.lastSummary.reviews.at(-1).stars")) === 1);
await b.ev("__game.advance(8000)");
check("hết khách → bảng Chốt ca", await waitFor("!!document.querySelector('.sheet[data-kind=summary]')"));
const sum = await S("JSON.stringify(s.lastSummary)").then(JSON.parse);
check("chốt ca: 3 ly bán, 1 khách bỏ về, 5 review, có headline vui", sum.cups === 3 && sum.lost === 1 && sum.reviews.length === 5 && sum.headline.length > 20, sum.headline);
check("chốt ca: lợi nhuận = doanh thu − giá vốn − hao hụt − phí", sum.profit === sum.revenue - sum.cogs - sum.waste - sum.fee && /Lợi nhuận vận hành/.test(await text(".ledger")), JSON.stringify({ r: sum.revenue, c: sum.cogs, w: sum.waste, f: sum.fee, p: sum.profit }));
check("bảng chốt ca hiện review có sao (ui-icons review-star)", await b.ev("document.querySelectorAll('.reviews .rv').length===5&&!!document.querySelector('.rv .stars .ico')"));
await sleep(3400); // chờ bảng hiện hết + thông báo tắt
await b.shot(OUT + "/07-desktop-chot-ca.png");
check("M4: chốt ca có nút Nhật Ký và Trả lời review", await visible("#journalBtn") && await visible("#replyBtn"));
// ----- Nhật Ký Làm Chủ -----
await pressSel("#journalBtn");
check("M4: Nhật Ký: thẻ canvas 1080×1350 vẽ trên journal-card.webp", await waitFor("!!document.querySelector('#journalCanvas')&&document.querySelector('#journalCanvas').dataset.drawn>='1'") &&
  await b.ev("(()=>{const c=document.querySelector('#journalCanvas');return c.width===1080&&c.height===1350})()"));
const px = await b.ev("(()=>{const c=document.querySelector('#journalCanvas').getContext('2d');const a=c.getImageData(540,700,1,1).data,t=c.getImageData(60,1100,1,1).data;return [a[0],a[1],a[2],t[0],t[1],t[2]]})()");
check("M4: Nhật Ký: có ảnh nền (giữa thẻ không phải màu kem trơn) và vùng chữ kem", !(px[0] > 240 && px[1] > 230 && px[2] > 200) && px[3] > 200, px.join(","));
const jLabel = await b.ev("document.querySelector('#journalCanvas').getAttribute('aria-label')");
check("M4: Nhật Ký: câu meme + câu trích", jLabel.includes(sum.headline) && /“.+”/.test(jLabel), jLabel);
const png = await b.ev("document.querySelector('#journalCanvas').toDataURL('image/png').length");
check("M4: Nhật Ký: xuất PNG được (canvas không bị khoá)", png > 50000, String(png));
await b.shot(OUT + "/07b-desktop-nhat-ky.png");
{ // D11 TLC12-08: ô "Ẩn tên tiệm" 28 px, nhãn bọc ô là vùng chạm ≥ 44 px (bấm vào chữ cũng đổi)
  const g = await b.ev("(()=>{const c=document.getElementById('jHideName'),l=c.closest('label'),a=c.getBoundingClientRect(),r=l.getBoundingClientRect();return JSON.stringify({c:[Math.round(a.width),Math.round(a.height)],l:[Math.round(r.width),Math.round(r.height)]})})()").then(JSON.parse);
  check("D11 TLC12-08: Nhật Ký: ô Ẩn tên tiệm ≥ 28 px, nhãn bọc ≥ 44 × 44", g.c[0] >= 28 && g.c[1] >= 28 && g.l[0] >= 44 && g.l[1] >= 44, JSON.stringify(g));
}
await pressSel("#jHideName");
await sleep(300);
check("M4: Nhật Ký: ẩn tên tiệm vẽ lại thẻ", await b.ev("document.querySelector('#journalCanvas').dataset.drawn>='2'"));
await pressSel("#jBack");
check("M4: quay lại bảng chốt ca", await visible("#nextDay"));
// ----- Trả lời review theo tính cách (lỗi cũ: trả lời bằng meme không hiện gì) -----
await pressSel("#replyBtn");
check("Sổ: review đầu tiên chưa trả lời mở sẵn bảng trả lời, có hàng đổi tính cách ngay trên lựa chọn", await waitFor("!!document.querySelector('.notebook .rv-reply .persona-switch')") &&
  await b.ev("document.querySelector('.rv-reply .persona-switch .ps.on').dataset.persona==='lay'&&[...document.querySelectorAll('.rv-reply [data-reply]')].every(e=>e.dataset.reply.startsWith('lay-'))"));
const lid = await b.ev("Number(document.querySelector('.rv-reply').closest('.rv').dataset.review)");
await b.ev("document.querySelector('.rv-reply').scrollIntoView({block:'center'})");
await b.shot(OUT + "/07d-desktop-tra-loi-review.png");
await pressSel('.rv-reply [data-reply="lay-meme"]');
const lt = await S(`(s.feed.find(r=>r.id===${lid}).reply||{}).text||''`);
check("Lầy lội: trả lời bằng meme ⇒ câu trả lời hiện ngay dưới review trong sổ, có kết quả + hậu quả", lt.length > 15 && (await text(`.rv[data-review="${lid}"] .rv-thread .rp-text`)).includes(lt) &&
  await b.ev(`document.querySelectorAll('.rv[data-review="${lid}"] .rp-res .chip').length>=1&&!!document.querySelector('.rv[data-review="${lid}"] .rp-res .oc')`), lt);
check("sau khi trả lời: review vừa trả lời nằm trong tầm nhìn (không nhảy về đầu sổ)", await b.ev(`(()=>{const sh=document.querySelector('.sheet[data-kind=notebook]').getBoundingClientRect(),r=document.querySelector('.rv[data-review="${lid}"]').getBoundingClientRect();return r.bottom>sh.top&&r.top<sh.bottom})()`));
await b.shot(OUT + "/07e-desktop-da-tra-loi.png");
const rest = await S("s.feed.filter(r=>!r.reply).length");
if (rest) {
  const before = await b.ev("[...document.querySelectorAll('.rv-reply [data-reply]')].map(e=>e.dataset.reply).join()");
  await pressSel('.rv-reply .persona-switch [data-persona="cucsuc"]');
  const after = await b.ev("[...document.querySelectorAll('.rv-reply [data-reply]')].map(e=>e.dataset.reply).join()");
  check("đổi tính cách ngay trong bảng trả lời ⇒ lựa chọn đổi sang Cục súc, thành mặc định", before !== after && after.split(",").every((x) => x.startsWith("cuc-")) && (await S("s.owner.persona")) === "cucsuc", before + " → " + after);
  const cid2 = await b.ev("Number(document.querySelector('.rv-reply').closest('.rv').dataset.review)");
  const opt = await b.ev("(document.querySelector('.rv-reply [data-reply=\"cuc-truth\"]')||document.querySelector('.rv-reply [data-reply=\"cuc-meme\"]')).dataset.reply");
  await pressSel(`.rv-reply [data-reply="${opt}"]`);
  const ct = await S(`(s.feed.find(r=>r.id===${cid2}).reply||{}).text||''`);
  check(`Cục súc: trả lời ${opt} ⇒ câu trả lời hiện trong sổ`, ct.length > 10 && (await text(`.rv[data-review="${cid2}"] .rv-thread .rp-text`)).includes(ct), ct);
} else check("(không còn review để thử đổi tính cách)", true);
check("Sổ quản lý 1366: không tràn ngang", await noOverflowX());
await pressSel("#nbClose");
check("đóng sổ ⇒ về bảng chốt ca", await visible("#nextDay"));
await pressSel("#nextDay");
// ----- sự kiện giữa hai ca -----
const dayEv = await waitFor("!!document.querySelector('.sheet[data-kind=event]')", 2500);
if (dayEv) {
  const evId = await b.ev("document.querySelector('.sheet[data-kind=event]').dataset.event");
  check(`M4: sự kiện giữa hai ca ${evId}: chân dung, câu thoại, ≥ 2 lựa chọn`, await b.ev("document.querySelectorAll('.sheet[data-kind=event] .choice').length>=2&&document.querySelectorAll('.sheet[data-kind=event] .portrait').length===2&&document.querySelector('.say .line').textContent.length>10"));
  await b.shot(OUT + "/07c-desktop-su-kien-giua-ca.png");
  const h0 = await S("s.drama.history.length");
  while (await visible(".sheet[data-kind=event]")) {
    await pressSel(".sheet[data-kind=event] .choice:not([disabled])");
    check("M4: chọn → bảng hậu quả có câu trả lời và danh sách hậu quả", await waitFor("!!document.querySelector('.sheet[data-kind=\"event-result\"] .quote')") && await b.ev("document.querySelectorAll('.fx-list li').length>=1"));
    await pressSel("#eventNext");
  }
  check("M4: lựa chọn ghi vào lịch sử sự kiện + khoảnh khắc Nhật Ký", (await S("s.drama.history.length")) > h0 && (await S("s.lastSummary.moments.some(m=>m.kind==='drama')")));
} else check("M4: (seed này không có sự kiện giữa hai ca)", true);
check("Chuẩn bị ngày 2", /Ngày 2/.test(await text(".sheet h2")));
const snap = await S("JSON.stringify({m:s.money,x:s.xp,l:s.level,r:s.rep,d:s.day,st:s.stock,j:s.journal.length,n:s.shopName,f:s.followers})");

// ===== 5. Tải lại giữ tiến trình =====
await b.nav(BASE);
check("tải lại: tiền, XP, cấp, danh tiếng, ngày, kho, nhật ký, tên tiệm, người theo dõi giữ nguyên", (await S("JSON.stringify({m:s.money,x:s.xp,l:s.level,r:s.rep,d:s.day,st:s.stock,j:s.journal.length,n:s.shopName,f:s.followers})")) === snap);
check("tải lại sau chốt ca mở thẳng bảng Chuẩn bị ngày 2", /Ngày 2/.test(await text(".sheet h2")) && await visible("#openShop"));
// Milestone 3: mua trang trí, nấu trân châu
const mBuy = await S("s.money");
await pressSel('[data-buy="flowering-pot"]');
check("M3: mua Chậu hoa tím (−40k) → xuất hiện trong cảnh, nút thành “Đã có”", (await S("s.money")) === mBuy - 40 && await S("s.owned['flowering-pot']===true") &&
  await b.ev("!!document.querySelector('.stage .decor[data-item=\"flowering-pot\"]')") && (await text('[data-buy="flowering-pot"]')) === "Đã có");
await b.shot(OUT + "/08a-desktop-nang-cap.png");
// ----- kéo-thả trang trí -----
await pressSel("#arrangeBtn");
check("M3: chế độ xếp chỗ: thanh công cụ nổi, vùng sàn hiện, chậu hoa kéo được", await visible("#arrangeDone") && await b.ev("!document.querySelector('.place-zone').hidden&&!!document.querySelector('.stage.arranging .decor.movable[data-item=\"flowering-pot\"]')"));
async function dragTo(fromScene, toScene) {
  const [x0, y0] = await b.ev(`__game.sceneToClient(${fromScene[0]},${fromScene[1]})`);
  const [x1, y1] = await b.ev(`__game.sceneToClient(${toScene[0]},${toScene[1]})`);
  await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: x0, y: y0, button: "left", clickCount: 1 });
  for (let i = 1; i <= 8; i++) await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x0 + ((x1 - x0) * i) / 8, y: y0 + ((y1 - y0) * i) / 8, button: "left", buttons: 1 });
  await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x1, y: y1, button: "left", clickCount: 1 });
  await sleep(200);
}
await dragTo([1080, 435], [1080, 505]); // kéo vào lối đi từ cửa ⇒ bị chặn
check("M3: kéo chậu hoa vào lối đi → bị chặn, giữ chỗ cũ, báo lý do", (await S("JSON.stringify(s.placement)")) === "{}" && /lối|chỗ/.test(await text("#toasts")));
await dragTo([1080, 435], [1000, 663]);
check("M3: kéo chậu hoa ra góc trống → lưu vị trí mới (neo chân = chỗ thả + khoảng lệch lúc cầm)", (await S("JSON.stringify(s.placement['flowering-pot'])")) === "[1000,680]", await S("JSON.stringify(s.placement)"));
await b.shot(OUT + "/08b-desktop-xep-trang-tri.png");
await pressSel("#arrangeDone");
check("M3: xong xếp chỗ → về bảng Chuẩn bị ca", await visible("#openShop"));
// hết hàng: bảng Chuẩn bị ngày 2 báo món có thể hết (ngày học đã dùng bớt ly), "Nhập đủ cho hôm nay"
check("hết hàng: Chuẩn bị ngày 2 có hộp “Coi chừng hết hàng” liệt kê món thiếu + số khách dự kiến", await visible("#stockWarn") && /dự kiến ~\d+ khách/.test(await text("#stockWarn")), await text("#stockWarn"));
const mFill = await S("s.money");
await pressSel("#fillToday");
check("hết hàng: bấm “Nhập đủ cho hôm nay” ⇒ trừ tiền, giữ lại phí ca, ly đủ dùng", (await S("s.money")) < mFill && (await S("s.money")) >= 12 && !(await b.ev("[...document.querySelectorAll('#stockWarn li')].some(l=>/Ly/.test(l.textContent))")));
// giữa ca
await pressSel("#openShop");
if (await visible("#openAnyway")) await pressSel("#openAnyway");
check("ngày 2 là ngày thường (6–10 khách, thêm tối đa 3 nhờ review / người theo dõi)", await S("!s.shift.tutorial&&s.shift.planned>=6&&s.shift.planned<=13"));
check("M3: ngày thường bắt đầu chưa có trân châu nấu sẵn, Bếp topping hiện trong Quầy pha", (await S("s.shift.kitchen.ready")) === 0 && await visible("#kitchen [data-cook='3']"));
const raw0 = await S("s.stock['tran-chau-song']");
await pressSel("#kitchen [data-cook='3']");
check("M3: bấm Nấu 3 → trừ 3 trân châu sống, thanh nấu chạy, bếp bận", (await S("s.stock['tran-chau-song']")) === raw0 - 3 && (await S("s.shift.kitchen.batches.length")) === 1 && await b.ev("document.querySelector('#kitchen [data-cook=\"3\"]').disabled"));
await b.ev("__game.advance(18400)");
await sleep(200);
check("M3: 18 giây ca sau mẻ chín → 3 phần sẵn", (await S("s.shift.kitchen.ready")) === 3 && /sẵn 3/.test(await text("#kitchen")));
const firstId = await S("s.shift.schedule.length?1:0");
await untilWaiting(firstId);
await pressSel(`#rail .slip[data-cid="${firstId}"]`);
const o6 = await order(firstId);
for (const [step, id] of [["cup", "ly"], ["base", o6.base], ["add", o6.add]]) await pressSel(`#opts .opt[data-step="${step}"][data-id="${id}"]`);
const midStage = await stage(), midT = await S("s.shift.t");
await b.nav(BASE);
check("tải lại giữa ca: bảng “Ca đang dở dang”, ca tạm dừng", await visible("#resumeBtn") && /dở dang/.test(await text(".sheet h2")) && await b.ev("__game.paused"));
check("tải lại giữa ca: ly đang pha + phiếu ghim giữ nguyên", (await stage()) === midStage && (await S("s.shift.stations[s.shift.sel].cid")) === firstId && (await S("s.shift.t")) >= midT - 1);
check("tải lại giữa ca: trân châu đã nấu giữ nguyên", (await S("s.shift.kitchen.ready")) >= 2);
await b.shot(OUT + "/08-desktop-tai-lai-giua-ca.png");
await pressSel("#resumeBtn");
await pressSel(`#opts .opt[data-step="sugar"][data-id="${o6.sugar}"]`);
check("tiếp tục pha sau khi tải lại", (await S("s.shift.stations[s.shift.sel].cup.steps.length")) === 4);
check("desktop 1366: không tràn ngang", await noOverflowX());

// ===== 6. Mobile 390×844, chạm =====
await b.view(390, 844, true, 2); await b.touch(true); press = b.tap;
await b.nav(BASE);
await pressSel("#resumeBtn");
check("mobile: cảnh + dải phiếu + quầy pha cùng màn, không tràn ngang", await noOverflowX() && await visible(".world") && await visible("#ticket") && await visible("#opts"));
for (const [step, id] of [["ice", o6.ice], ["topping", o6.topping], ["lid", "dong-nap"]]) await pressSel(`#opts .opt[data-step="${step}"][data-id="${id}"]`);
check("mobile: chạm pha tiếp tới đóng nắp", await S("s.shift.stations[s.shift.sel].cup&&s.shift.stations[s.shift.sel].cup.sealed") && /dome-lid/.test(await stage()));
const m6 = await S("s.money");
await pressSel("#serveBtn");
check("mobile: chạm Giao → thu tiền", (await S("s.money")) > m6);
check("mobile: nút điều khiển chính ≥ 44px", await b.ev(`[...document.querySelectorAll('#opts .opt, .acts .btn, .top .tbtn, #rail .slip')].filter(e=>e.offsetParent).every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.width>=44})`),
  await b.ev(`[...document.querySelectorAll('#opts .opt, .acts .btn, .top .tbtn, #rail .slip')].filter(e=>{const r=e.getBoundingClientRect();return e.offsetParent&&(r.height<44||r.width<44)}).map(e=>e.className+Math.round(e.getBoundingClientRect().height)).join(',')`));
const next = await S("(s.shift.customers.find(c=>c.phase==='wait')||{}).id||0");
if (!next) await b.ev("__game.advance(15000)");
const n2 = await S("(s.shift.customers.find(c=>c.phase==='wait')||{}).id||0");
if (n2) {
  await pressSel(`#rail .slip[data-cid="${n2}"]`);
  await pressSel(`#opts .opt[data-step="cup"]`);
  await pressSel(`#opts .opt[data-step="base"][data-id="${(await order(n2)).base}"]`);
}
await sleep(500);
check("mobile: ghim phiếu bằng chạm, bắt đầu pha ly mới", !!n2 && (await S("s.shift.stations[s.shift.sel].cup.steps.length")) === 2);
await b.shot(OUT + "/09-mobile-390-pha.png");
await b.ev("document.querySelector('#rail').scrollIntoView()");
await b.shot(OUT + "/10-mobile-390-full.png", true);
// ----- mobile 390: bảng trả lời review giữa ca (Sổ) -----
await b.ev("document.querySelector('#brew').scrollTop=0;window.scrollTo(0,0)");
await pressSel("#bookBtn");
const mrid = await waitFor("!!document.querySelector('.notebook .rv-reply')", 3000) ? await b.ev("Number(document.querySelector('.rv-reply').closest('.rv').dataset.review)") : 0;
if (mrid) {
  await pressSel('.rv-reply .persona-switch [data-persona="hien"]');
  check("mobile: đổi sang Hiền lành trong bảng trả lời, nút ≥ 44px, không tràn ngang", (await S("s.owner.persona")) === "hien" && await noOverflowX() &&
    await b.ev("[...document.querySelectorAll('.rv-reply .ps, .rv-reply .ropt')].every(e=>e.getBoundingClientRect().height>=44)"));
  await b.ev("document.querySelector('.rv-reply').scrollIntoView({block:'center'})");
  await b.shot(OUT + "/10b-mobile-390-tra-loi.png");
  await pressSel('.rv-reply [data-reply="hien-meme"]');
  const mt = await S(`(s.feed.find(r=>r.id===${mrid}).reply||{}).text||''`);
  check("mobile: Hiền lành trả lời meme ⇒ câu hiện dưới review", mt.length > 10 && (await text(`.rv[data-review="${mrid}"] .rv-thread .rp-text`)).includes(mt), mt);
  await b.shot(OUT + "/10c-mobile-390-da-tra-loi.png");
} else check("mobile: (không còn review chưa trả lời)", true);
await pressSel("#nbClose");
if (await visible("#resumeBtn")) await pressSel("#resumeBtn");
check("mobile: khung cảnh thấy cả nhân viên sau quầy và cửa ra vào", await b.ev(`(()=>{const r=document.querySelector('#scene').getBoundingClientRect();const a=__game.sceneToClient(472,300),d=__game.sceneToClient(1240,470);return a[0]>=r.left-1&&d[0]<=r.right+1})()`));

// ===== 7. Drama trong ca (mobile 390) =====
await b.ev("document.querySelector('#brew').scrollTop=0");
const wid = await S("(s.shift.customers.find(c=>c.phase==='wait')||{}).id||0");
if (!wid) await b.ev("__game.advance(12000)");
const forced = await b.ev("JSON.stringify(__game.forceEvent('K11'))");
check("M4: mở sự kiện K11 (“ít ngọt mà ngọt”) trong ca", /"ok":true/.test(forced), forced);
check("M4: hội thoại sự kiện: ca tạm dừng, khách đang chờ là người nói, có lựa chọn", await waitFor("!!document.querySelector('.sheet[data-kind=event]')") &&
  await (async () => { const a = await S("s.shift.t"); await sleep(500); return (await S("s.shift.t")) === a; })() && await b.ev("document.querySelectorAll('.sheet[data-kind=event] .choice').length>=2"));
check("mobile: nút lựa chọn sự kiện ≥ 44px, không tràn ngang", await noOverflowX() && await b.ev("[...document.querySelectorAll('.sheet[data-kind=event] .choice')].every(e=>e.getBoundingClientRect().height>=44)"));
await b.shot(OUT + "/11-mobile-390-su-kien.png");
const mom0 = await S("s.shift.moments.length");
let steps = 0;
while (await visible(".sheet[data-kind=event]") && steps++ < 4) {
  await pressSel(".sheet[data-kind=event] .choice:not([disabled])");
  await waitFor("!!document.querySelector('.sheet[data-kind=\"event-result\"]')");
  if (steps === 1) await b.shot(OUT + "/12-mobile-390-hau-qua.png");
  await pressSel("#eventNext");
}
check("M4: chọn xong: hội thoại đóng, ca chạy tiếp, khoảnh khắc lưu vào ca", (await S("s.shift.dialog")) === null && (await S("s.shift.moments.length")) > mom0 && !(await b.ev("__game.paused")));
await b.nav(BASE);
check("M4: tải lại sau sự kiện: lịch sử sự kiện giữ nguyên", (await S("s.drama.history.some(h=>h.id==='K11')")));

// ===== 8. Đơn hai ly (desktop) =====
await b.view(1366, 768, false); await b.touch(false); press = b.click;
await b.nav(BASE);
if (await visible("#resumeBtn")) await pressSel("#resumeBtn");
await b.ev("(()=>{const sh=__game.state.shift;for(const st of sh.stations){st.cup=null;st.cid=null;st.item=null}sh.schedule.unshift({at:sh.t+50,arch:'van-phong',name:'Chị Hằng',items:[{recipe:'tra-dao',sugar:50,ice:'vua'},{recipe:'tra-dao',sugar:30,ice:'it'}]});sh.planned++})()");
for (let i = 0; i < 40 && !(await S("s.shift.customers.some(c=>c.name==='Chị Hằng'&&c.phase==='wait')")); i++) await b.ev("__game.advance(1500)");
const gid = await S("(s.shift.customers.find(c=>c.name==='Chị Hằng')||{}).id||0");
check("M3: khách gọi 2 ly tới quầy, phiếu ghi “2 ly”", !!gid && await waitFor(`!!document.querySelector('#rail .slip[data-cid="${gid}"] .cups-badge')`) && /2 ly/.test(await text(`#rail .slip[data-cid="${gid}"]`)),
  JSON.stringify({ gid, t: await S("s.shift&&s.shift.t"), ov: await b.ev("__game.overlay"), cs: await S("s.shift&&s.shift.customers.map(c=>c.name+':'+c.phase)"), sch: await S("s.shift&&s.shift.schedule.length"), html: await b.ev(`(document.querySelector('#rail')||{}).innerHTML.slice(0,1500)`), items: await S("JSON.stringify(s.shift.customers.map(c=>c.items.length))") }));
await pressSel(`#rail .slip[data-cid="${gid}"]`);
check("M3: phiếu đơn nhiều ly có khay 2 ly, đang pha ly 1/2", await b.ev("document.querySelectorAll('#ticket .tray-cup').length===2") && /ly 1\/2/.test(await text("#ticket .t-name")));
const items = await S(`JSON.stringify(s.shift.customers.find(c=>c.id===${gid}).items.map(i=>i.order))`).then(JSON.parse);
await brewClicks(items[0]);
check("M3: nút đổi thành “Ghép ly vào đơn”", /Ghép ly/.test(await text("#serveBtn")));
const mg = await S("s.money");
await pressSel("#serveBtn");
check("M3: ghép ly 1: chưa thu tiền, phiếu sang ly 2/2", (await S("s.money")) === mg && /ly 2\/2/.test(await text("#ticket .t-name")) && await b.ev("!!document.querySelector('#ticket .tray-cup.done')"));
const st2 = await brewClicks(items[1]);
check("M3: ly 2 (30% đường, ít đá) đổi hình theo từng bước", new Set(st2).size >= 5, st2.join(" | "));
check("M3: nút đổi thành “Giao đủ 2 ly”", /Giao đủ 2 ly/.test(await text("#serveBtn")));
await b.shot(OUT + "/13-desktop-don-hai-ly.png");
await pressSel("#serveBtn");
const price2 = await S(`s.shift.reviews.find(r=>r.cid===${gid})?.stars||0`);
check("M3: giao đủ 2 ly một lượt: thu tiền cả đơn, review, ghi đơn nhiều ly", (await S("s.money")) === mg + 52 && price2 >= 3 && (await S("s.shift.ledger.multi")) === 1, `money ${mg}→${await S("s.money")}, ${price2} sao`);
const mrv = await S(`JSON.stringify(s.shift.reviews.find(r=>r.cid===${gid})||null)`).then(JSON.parse);
const msay = await S(`(s.shift.customers.find(c=>c.id===${gid})||{say:{}}).say.text||''`);
check("M3 nội dung: đơn hai ly đúng hết ⇒ review từ bảng đơn nhiều ly (lý do multi…), khách nói câu riêng của đơn nhóm", !!mrv && /^multi/.test(mrv.reason) && mrv.line.length > 15 && msay.length > 10 && msay !== mrv.line, JSON.stringify({ mrv, msay }));
check("desktop: không tràn ngang sau M3–M4", await noOverflowX());
// Sổ quản lý mở được giữa ca (tạm dừng)
await pressSel("#bookBtn");
check("M4: Sổ quản lý: tab Review / Nhật ký / Sự kiện / Nhiệm vụ, sổ review có dữ liệu", await visible(".sheet[data-kind=notebook]") && await b.ev("document.querySelectorAll('.notebook .tab').length===4&&document.querySelectorAll('.notebook .rv').length>=5") && await b.ev("__game.paused"));
await pressSel('.notebook .tab[data-tab="drama"]');
check("M4: Sổ: tab Sự kiện ghi lựa chọn đã làm", (await text(".nb-body")).length > 20);
await b.shot(OUT + "/14-desktop-so-quan-ly.png");
await pressSel("#nbClose");

// ===== 9. Sự kiện vựa sỉ qua ?event=ID (U01: bao trà rẻ mà cũ, nhiều bước) =====
await b.nav(BASE + "&event=U01");
check("M3 nội dung: ?event=U01 mở sự kiện vựa sỉ trong ca: chân dung, câu thoại, 3 lựa chọn", await waitFor("!!document.querySelector('.sheet[data-kind=event][data-event=U01]')") &&
  await b.ev("document.querySelectorAll('.sheet[data-kind=event] .choice').length===3") && /vựa sỉ/.test(await text(".sheet[data-kind=event] .say .line")));
await b.shot(OUT + "/15-desktop-su-kien-vua-si.png");
await pressSel('.sheet[data-kind=event] .choice[data-choice="call"]');
check("M3 nội dung: gọi Anh Út ⇒ bảng hậu quả, rồi sang bước hai (chuyện con gà)", await waitFor("!!document.querySelector('.sheet[data-kind=\"event-result\"] .quote')"));
await pressSel("#eventNext");
check("M3 nội dung: bước hai có lựa chọn nghe hết / cúp máy", await waitFor("!!document.querySelector('.sheet[data-kind=event] .choice[data-choice=\"polite\"]')") && /con gà/.test(await text(".sheet[data-kind=event] .say .line")));
await pressSel('.sheet[data-kind=event] .choice[data-choice="polite"]');
await waitFor("!!document.querySelector('.sheet[data-kind=\"event-result\"]')");
await pressSel("#eventNext");
check("M3 nội dung: chọn cúp máy ⇒ hội thoại đóng, hẹn U03 (giao trễ) ca sau, cờ ut-doi, lịch sử ghi U01", (await S("s.shift.dialog")) === null &&
  await S("s.drama.queue.some(q=>q.id==='U03'&&q.day===s.day+1)&&!!s.drama.flags['ut-doi']&&s.drama.history.filter(h=>h.id==='U01').length===2"));

// ===== 10. Hết hàng giữa ca: ngày 2 không còn ly =====
await b.view(1366, 768, false, 1.25); await b.touch(false); press = b.click;
await b.ev("Storage.prototype.setItem=()=>{};localStorage.clear()"); await b.nav(BASE); // chặn pagehide ghi lại bản cũ
await pressSel("#introGo");
await b.ev("(()=>{const s=__game.state;s.tutorialDone=true;s.day=2;s.stock.ly=0;s.drama.pending=null;s.drama.queue=[];__game.act({type:'setName',name:'Tiệm Hết Ly'});})()");
await b.nav(BASE);
check("hết hàng: ngày 2 còn 0 ly ⇒ hộp cảnh báo ghi “Ly + nắp còn 0”", await waitFor("!!document.querySelector('#stockWarn')") && /Ly \+ nắp còn 0/.test(await text("#stockWarn")), await text("#stockWarn"));
await b.shot(OUT + "/16-desktop-canh-bao-het-hang.png");
await pressSel("#openShop");
check("hết hàng: bấm Mở quán khi còn thiếu ⇒ hỏi lại (Nhập đủ trước / Vẫn mở quán)", await visible("#openAnyway") && await visible("#fillFirst") && !(await S("!!s.shift")));
await pressSel("#openAnyway");
check("hết hàng: Vẫn mở quán ⇒ ca mở với 0 ly", await S("!!s.shift&&s.stock.ly===0"));
await b.ev("__game.state.shift.drama.max=0");
await untilWaiting(1);
await pressSel('#rail .slip[data-cid="1"]');
check("hết hàng: ghim khách cần ly ⇒ hội thoại hết hàng có chân dung, câu nhân viên, 5+ lựa chọn có chi phí", await waitFor("!!document.querySelector('.sheet[data-kind=stockout]')") &&
  await b.ev("document.querySelectorAll('.sheet[data-kind=stockout] .choice').length>=5&&document.querySelectorAll('.sheet[data-kind=stockout] .portrait').length>=1&&document.querySelectorAll('.sheet[data-kind=stockout] .cost').length>=5"));
check("hết hàng: đồng hồ ca dừng khi hội thoại mở", await (async () => { const a = await S("s.shift.t"); await sleep(400); return (await S("s.shift.t")) === a; })());
await b.shot(OUT + "/17-desktop-hoi-thoai-het-hang.png");
const mRun = await S("s.money");
await pressSel('.sheet[data-kind=stockout] .choice[data-choice="run"]');
check("hết hàng: Chạy đi mua gấp ⇒ bảng hậu quả, trừ tiền +30%", await waitFor("!!document.querySelector('.sheet[data-kind=\"stockout-result\"] .quote')") && (await S("s.money")) === mRun - 26);
await pressSel("#stockoutNext");
check("hết hàng: quầy bỏ trống (nhân viên rời cảnh), bấm pha bị chặn", await S("!!s.shift.away") && await b.ev("document.querySelector('.stage .barista').style.visibility==='hidden'"));
await b.shot(OUT + "/18-desktop-chay-di-mua.png");
await b.ev("__game.advance(12400)");
await sleep(200);
check("hết hàng: chạy về ⇒ có 10 ly, nhân viên trở lại quầy", (await S("s.stock.ly")) === 10 && await S("!s.shift.away") && await b.ev("document.querySelector('.stage .barista').style.visibility===''"));
if (await S("s.shift.customers.find(c=>c.id===1)?.phase==='wait'")) {
  if ((await S("s.shift.stations[s.shift.sel].cid")) !== 1) await pressSel('#rail .slip[data-cid="1"]');
  const oR = await order(1);
  if (oR.topping === "tran-chau") { await pressSel("#kitchen [data-cook='3']"); await b.ev("__game.advance(18400)"); }
  await brewClicks(oR);
  const before = await S("s.shift.ledger.served");
  await pressSel("#serveBtn");
  check("hết hàng: pha xong và giao được đơn sau khi chạy đi mua", (await S("s.shift.ledger.served")) === before + 1);
} else check("hết hàng: (khách #1 đã bỏ về trong lúc chạy đi mua — vẫn hợp lệ)", true);
// đóng cửa sớm
await b.ev("(()=>{const s=__game.state;s.stock.ly=0;})()");
const nextC = await S("(s.shift.customers.find(c=>c.phase==='wait'&&!s.shift.stations.some(x=>x.cid===c.id))||{}).id");
let cidClose = nextC;
if (!cidClose) { for (let i = 0; i < 200 && !cidClose; i++) { await b.ev("__game.advance(300)"); cidClose = await S("(s.shift.customers.find(c=>c.phase==='wait'&&!s.shift.stations.some(x=>x.cid===c.id))||{}).id"); } }
await pressSel(`#rail .slip[data-cid="${cidClose}"]`);
await waitFor("!!document.querySelector('.sheet[data-kind=stockout]')");
const rep0 = await S("s.rep");
await pressSel('.sheet[data-kind=stockout] .choice[data-choice="close"]');
await waitFor("!!document.querySelector('.sheet[data-kind=\"stockout-result\"]')");
await pressSel("#stockoutNext");
check("hết hàng: Đóng cửa sớm ⇒ khách về, danh tiếng giảm, bảng chốt ca có câu Nhật Ký “đóng cửa sớm”", await waitFor("!!document.querySelector('.sheet[data-kind=summary]')", 12000) &&
  (await S("s.rep")) < rep0 && (await S("s.lastSummary.closedEarly")) === "ly" && /ly|đóng cửa/i.test(await text(".sheet[data-kind=summary] .headline")), await text(".headline"));
await b.shot(OUT + "/19-desktop-dong-cua-som.png");
// mobile: hộp cảnh báo đọc được ở 390
await b.view(390, 844, true);
await b.ev("(()=>{const s=__game.state;s.stock.ly=0;__game.act({type:'closeSummary'});})()");
await b.nav(BASE);
await waitFor("!!document.querySelector('#stockWarn')||!!document.querySelector('.sheet[data-kind=event]')");
if (await visible(".sheet[data-kind=event]")) { await b.ev("(()=>{const s=__game.state;s.drama.pending=null;__game.act({type:'setName',name:'Tiệm Hết Ly'});})()"); await b.nav(BASE); await waitFor("!!document.querySelector('#stockWarn')"); }
check("hết hàng 390: hộp cảnh báo + nút Nhập đủ hiện, không tràn ngang", await visible("#stockWarn") && await visible("#fillToday") && await noOverflowX());
await b.shot(OUT + "/20-mobile-canh-bao-het-hang.png");

// ===== 11. Milestone 5: hội chợ (cấp 18), huy hiệu, kéo trang trí sát mép phải (kẹp trong khung), chơi lại ngày hôm nay =====
await b.view(1366, 768, false, 1.25); await b.touch(false); press = b.click;
await b.ev("Storage.prototype.setItem=()=>{};localStorage.clear()"); await b.nav(BASE);
await pressSel("#introGo");
await b.ev(`(()=>{const s=__game.state;s.tutorialDone=true;s.day=9;s.xp=${LV[17]};s.level=18;s.money=3000;s.capacity=130;s.owned['crate-rack']=true;s.owned['flowering-pot']=true;
  for(const id of Object.keys(s.stock))s.stock[id]=7;s.drama.pending=null;s.drama.queue=[];__game.act({type:'setName',name:'Tiệm Hội Chợ'});})()`);
await b.nav(BASE);
check("M5: cấp 18 ⇒ bảng Chuẩn bị ca có hộp Hội chợ khu phố + nút thuê gian hàng", await waitFor("!!document.querySelector('#fairBox #fairBtn')") && !(await b.ev("document.querySelector('#fairBtn').disabled")));
check("M5: có ảnh đầu ngày 9 để chơi lại", (await b.ev("__game.store().day")) === 9);
const mFair = await S("s.money");
await pressSel("#fairBtn");
check("M5: thuê gian hàng ⇒ trừ 150k, hộp đổi sang “hôm nay có gian ở hội chợ”", (await S("s.money")) === mFair - 150 && (await S("s.fair.day===s.day")) && /Hôm nay tiệm có gian/.test(await text("#fairBox")));
await b.shot(OUT + "/21-desktop-hoi-cho-chuan-bi.png");
// kéo chậu hoa sát mép phải: desktop phóng cảnh nên mép phải bị cắt ⇒ điểm thả được kẹp trong khung đang thấy
await pressSel("#arrangeBtn");
const vr = await b.ev("__game.visibleRect()");
const pot0 = await S("JSON.stringify(s.placement['flowering-pot']||null)");
await dragTo([1080, 435], [Math.min(1278, vr.x1 + 30), 600]);
const potAt = await S("s.placement['flowering-pot']||null");
const potBox = await b.ev("(()=>{const e=document.querySelector('.stage .decor[data-item=\"flowering-pot\"]').getBoundingClientRect(),r=document.querySelector('#scene').getBoundingClientRect();return [e.right,r.right,e.left]})()");
check("M5: kéo trang trí sát mép phải ⇒ vị trí kẹp trong khung đang thấy, chậu hoa không bị khuất", !!potAt && potAt[0] <= vr.x1 && potBox[0] <= potBox[1] + 1, JSON.stringify({ vr, potAt, potBox, pot0 }));
await b.shot(OUT + "/22-desktop-keo-sat-mep.png");
await pressSel("#arrangeDone");
await pressSel("#openShop");
if (await visible("#openAnyway")) await pressSel("#openAnyway");
check("M5: ca hội chợ: dài 4 phút, đông khách, có đơn nhóm kết hợp", await S("s.shift.fair&&s.shift.duration===240000&&s.shift.planned>=12&&s.shift.schedule.some(g=>g.items.length>1)"));
await b.ev("__game.state.shift.drama.max=0");
await b.ev("__game.advance(3000)");
await b.shot(OUT + "/23-desktop-ca-hoi-cho.png");
// mưa bão (V15): chưa có weather-fx.webp ⇒ lớp mưa CSS phủ cảnh; xong sự kiện vẫn mưa một lúc
await b.ev("__game.forceEvent('V15')");
check("M5: sự kiện mưa (V15) ⇒ lớp mưa phủ cảnh (CSS dự phòng khi chưa có weather-fx)", await waitFor("!!document.querySelector('.sheet[data-kind=event][data-event=V15]')") && // lớp mưa có thể bật chậm hơn hộp sự kiện vài khung khi máy bận ⇒ chờ tới 3 s thay vì đọc đúng lúc hộp mở
  await waitFor("(()=>{const w=document.querySelector('.stage .wx.wx-rain');return !!w&&!w.hidden&&w.getClientRects().length>0&&getComputedStyle(w).visibility!=='hidden'})()", 3000));
for (let i = 0; i < 4 && await visible(".sheet[data-kind=event] .choice"); i++) { // sự kiện nhiều bước
  await pressSel('.sheet[data-kind=event] .choice:not([disabled])');
  await waitFor("!!document.querySelector('#eventNext')");
  if (i === 0) await b.shot(OUT + "/23b-desktop-mua.png");
  await pressSel("#eventNext");
}
// chơi lại ngày hôm nay từ bảng tạm dừng
await pressSel("#pauseBtn");
check("M5: bảng tạm dừng có “Chơi lại ngày 9”", await visible("#replayAsk") && /ngày 9/.test(await text("#replayAsk")));
await pressSel("#replayAsk");
check("M5: hỏi xác nhận trước khi chơi lại (Chơi lại / Thôi)", await visible("#replayYes") && await visible("#replayNo"));
await pressSel("#replayNo");
check("M5: bấm Thôi ⇒ vẫn ở ca hội chợ", await S("!!s.shift&&s.shift.fair") && await visible("#replayAsk"));
await pressSel("#replayAsk");
await pressSel("#replayYes");
await b.nav(BASE); // trang tự tải lại; chờ __game mới
check("M5: chơi lại ⇒ về đầu ngày 9 (chưa mở ca, chưa thuê gian, tiền như lúc mở bảng Chuẩn bị ca), bản trước được cất dự phòng",
  await waitFor("!!document.querySelector('#openShop')") && (await S("s.day")) === 9 && (await S("s.shift")) === null && (await S("s.money")) === mFair && !(await S("s.fair&&s.fair.day===s.day")) &&
  await b.ev("JSON.parse(localStorage.getItem('wgp.tiemtrasua.v1.before-replay')).shift.fair===true"));
// huy hiệu: Sổ ⇒ Nhiệm vụ có bức tường huy hiệu
await pressSel("#prepBook");
await pressSel('.notebook .tab[data-tab="missions"]');
check("M5: Sổ ⇒ Nhiệm vụ có bức tường huy hiệu (14 huy hiệu, chưa có thì mờ)", await waitFor("!!document.querySelector('#badgeWall')") && await b.ev("document.querySelectorAll('#badgeWall .bw-item').length>=14"));
await pressSel("#nbClose");
// lên cấp 20 ⇒ lịch ca thử thách + hạng tiệm
await b.ev(`(()=>{const s=__game.state;s.xp=${LV[19]};s.level=20;__game.act({type:'setName',name:'Tiệm Hội Chợ'});})()`);
await b.nav(BASE);
check("M5: cấp 20 ⇒ lịch ca thử thách 5 ngày, nút nhận thử thách hôm nay, hàng hạng tiệm", await waitFor("!!document.querySelector('#challengeBox #challengeBtn')") && await b.ev("document.querySelectorAll('#challengeBox .ch-week li').length===5") && await visible("#tierRow"));
await pressSel("#challengeBtn");
check("M5: nhận thử thách ⇒ ghi vào bản lưu, hộp đổi tiêu đề", (await S("s.challenge&&s.challenge.day===s.day")) && /Ca thử thách hôm nay/.test(await text("#challengeBox")));
await pressSel("#tierBtn");
check("M5: lên hạng tiệm ⇒ trừ tiền, hạng 1/8", (await S("s.tier")) === 1);
await b.shot(OUT + "/24-desktop-thu-thach-hang-tiem.png");
await b.view(390, 844, true, 3);
await b.nav(BASE);
await waitFor("!!document.querySelector('#challengeBox')");
check("M5 390: hộp hội chợ / thử thách / hạng tiệm không tràn ngang", await noOverflowX());
await b.shot(OUT + "/25-mobile-thu-thach.png");

// bố cục nhiều khung: nút bước không bị thanh hành động che, 0 lần tự cuộn (D2: TLC1-01)
if (!process.env.SKIP_LAYOUT) await runLayout({ b, check, PORT, OUT });
check("0 lỗi console / exception", b.errors.length === 0, b.errors.join(" | "));
writeFileSync(OUT + "/e2e-ket-qua.txt", R.join("\n") + `\n\n${R.length - fails}/${R.length} PASS\n`);
console.log(`\n${R.length - fails}/${R.length} PASS`);
b.close();
await sleep(700);
process.exit(fails ? 1 : 0);
