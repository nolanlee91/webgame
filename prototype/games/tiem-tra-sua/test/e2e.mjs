// E2E Tiệm Trà Sữa trên Chrome headless qua CDP — bấm chuột / chạm thật, chụp desktop 1366×768 + mobile 390×844.
// Chạy (ở gốc repo): PORT=8810 node server.js   rồi   PORT=8810 node prototype/games/tiem-tra-sua/test/e2e.mjs <thư mục ảnh>
// Kịch bản: mở game → nhận tiệm → mở ca → phục vụ đúng 3 khách (kiểm ly đổi hình ở từng bước) → 1 đơn sai (khiếu nại)
// → 1 khách hết kiên nhẫn → bảng chốt ca → tải lại giữ tiến trình → giữa ca tải lại giữ ly / phiếu → mobile chơi bằng chạm.
import { writeFileSync } from "node:fs";
import { launch, sleep } from "./cdp.mjs";

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8810;
const BASE = `http://127.0.0.1:${PORT}/games/tiem-tra-sua/?seed=777`;
const b = await launch(OUT, 9391);
const R = []; let fails = 0;
const check = (n, c, d = "") => { const s = (c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : ""); if (!c) fails++; R.push(s); console.log(s); };
let press = b.click;
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
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

// ===== 1. Người chơi mới, desktop, chuột =====
await b.view(1366, 768, false); await b.touch(false); press = b.click;
await b.nav(BASE); await b.ev("localStorage.clear()"); await b.nav(BASE);
check("mở game: bảng chào mừng có chân dung nhân viên (portraits.webp) và ô tên tiệm", await visible("#introGo") && await visible("#shopName") && await b.ev("!!document.querySelector('.intro .portrait[style*=\"portraits.webp\"]')"));
check("cảnh tiệm thật từ asset Codex: nền shop-scene + lớp che quầy + nhân viên", await b.ev(`!!document.querySelector('.stage img[src$="shop-scene.webp"]')&&!!document.querySelector('.stage img[src$="shop-counter-foreground.webp"]')&&/characters\\.webp/.test(document.querySelector('.stage .barista').style.backgroundImage)`));
await b.shot(OUT + "/01-desktop-chao-mung.png");
await b.ev(`(()=>{const i=document.querySelector('#shopName');i.value='';})()`);
await pressSel("#shopName");
await b.send("Input.insertText", { text: "Trà Sữa Hẻm Nhà Mình" });
await pressSel("#introGo");
check("đặt tên tiệm (có dấu) → hiện trên thanh trên", (await text("#shopLabel")) === "Trà Sữa Hẻm Nhà Mình");
check("bảng Chuẩn bị ca ngày 1: menu 8 món (2 đã mở), kho, nút Mở quán", await visible("#openShop") && /Ngày 1/.test(await text(".sheet h2")) && await b.ev("document.querySelectorAll('.menu li').length===8&&document.querySelectorAll('.menu li.locked').length===6"));
await b.shot(OUT + "/02-desktop-chuan-bi-ca.png");
await pressSel("#openShop");
check("mở quán: trừ phí ca 12k (160 → 148), đồng hồ ca chạy", (await S("s.money")) === 148 && await S("s.shift&&s.shift.status==='open'"));
await sleep(600);
const t1 = await S("s.shift.t");
check("đồng hồ ca tăng theo thời gian thật", t1 > 200, String(t1));

// ===== 2. Ba khách phục vụ đúng =====
const served = [];
for (const [cid, how] of [[1, "scene"], [2, "rail"], [3, "scene"]]) {
  check(`khách #${cid} đi vào và đứng chờ`, await untilWaiting(cid));
  await sleep(250);
  if (how === "scene") await pressSel(`.cust[data-cid="${cid}"]`); else await pressSel(`#rail .slip[data-cid="${cid}"]`);
  check(`chạm ${how === "scene" ? "khách trong cảnh" : "phiếu ở dải phiếu"} → ghim phiếu #${cid} lên Quầy pha`, (await S("s.shift.active")) === cid && /#\d+ · /.test(await text("#ticket .t-name")));
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
    check("lớp ly cuối: sữa 75% + trân châu + đá + thành ly + nắp", stages.at(-1) === "milk-75+pearls-bottom+ice-top+empty-cup+dome-lid", stages.at(-1));
    check("ly nhỏ trên mặt quầy trong cảnh cũng có nắp", await b.ev("document.querySelectorAll('.minicup i').length===5"));
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
const snap = await S("JSON.stringify({m:s.money,x:s.xp,l:s.level,r:s.rep,d:s.day,st:s.stock,j:s.journal.length,n:s.shopName})");
await pressSel("#nextDay");
check("Chuẩn bị ngày 2", /Ngày 2/.test(await text(".sheet h2")));

// ===== 5. Tải lại giữ tiến trình =====
await b.nav(BASE);
check("tải lại: tiền, XP, cấp, danh tiếng, ngày, kho, nhật ký, tên tiệm giữ nguyên", (await S("JSON.stringify({m:s.money,x:s.xp,l:s.level,r:s.rep,d:s.day,st:s.stock,j:s.journal.length,n:s.shopName})")) === snap);
check("tải lại sau chốt ca mở thẳng bảng Chuẩn bị ngày 2", /Ngày 2/.test(await text(".sheet h2")) && await visible("#openShop"));
// Milestone 3: mua trang trí, nấu trân châu
const mBuy = await S("s.money");
await pressSel('[data-buy="flowering-pot"]');
check("M3: mua Chậu hoa tím (−40k) → xuất hiện trong cảnh, nút thành “Đã có”", (await S("s.money")) === mBuy - 40 && await S("s.owned['flowering-pot']===true") &&
  await b.ev("!!document.querySelector('.stage .decor[data-item=\"flowering-pot\"]')") && (await text('[data-buy="flowering-pot"]')) === "Đã có");
await b.shot(OUT + "/08a-desktop-nang-cap.png");
// giữa ca
await pressSel("#openShop");
check("ngày 2 là ngày thường (6–10 khách)", await S("!s.shift.tutorial&&s.shift.planned>=6&&s.shift.planned<=10"));
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
check("tải lại giữa ca: ly đang pha + phiếu ghim giữ nguyên", (await stage()) === midStage && (await S("s.shift.active")) === firstId && (await S("s.shift.t")) >= midT - 1);
check("tải lại giữa ca: trân châu đã nấu giữ nguyên", (await S("s.shift.kitchen.ready")) >= 2);
await b.shot(OUT + "/08-desktop-tai-lai-giua-ca.png");
await pressSel("#resumeBtn");
await pressSel(`#opts .opt[data-step="sugar"][data-id="${o6.sugar}"]`);
check("tiếp tục pha sau khi tải lại", (await S("s.shift.cup.steps.length")) === 4);
check("desktop 1366: không tràn ngang", await noOverflowX());

// ===== 6. Mobile 390×844, chạm =====
await b.view(390, 844, true, 2); await b.touch(true); press = b.tap;
await b.nav(BASE);
await pressSel("#resumeBtn");
check("mobile: cảnh + dải phiếu + quầy pha cùng màn, không tràn ngang", await noOverflowX() && await visible(".world") && await visible("#ticket") && await visible("#opts"));
for (const [step, id] of [["ice", o6.ice], ["topping", o6.topping], ["lid", "dong-nap"]]) await pressSel(`#opts .opt[data-step="${step}"][data-id="${id}"]`);
check("mobile: chạm pha tiếp tới đóng nắp", await S("s.shift.cup&&s.shift.cup.sealed") && /dome-lid/.test(await stage()));
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
check("mobile: ghim phiếu bằng chạm, bắt đầu pha ly mới", !!n2 && (await S("s.shift.cup.steps.length")) === 2);
await b.shot(OUT + "/09-mobile-390-pha.png");
await b.ev("document.querySelector('#rail').scrollIntoView()");
await b.shot(OUT + "/10-mobile-390-full.png", true);

check("0 lỗi console / exception", b.errors.length === 0, b.errors.join(" | "));
writeFileSync(OUT + "/e2e-ket-qua.txt", R.join("\n") + `\n\n${R.length - fails}/${R.length} PASS\n`);
console.log(`\n${R.length - fails}/${R.length} PASS`);
b.close();
await sleep(700);
process.exit(fails ? 1 : 0);
