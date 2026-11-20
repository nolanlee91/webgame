// E2E Tiệm Bánh Mì trên Chrome headless qua CDP (test/cdp.mjs chép từ Trà Sữa) — bấm chuột / chạm thật.
// Chạy (ở gốc repo): PORT=8841 node server.js   rồi   PORT=8841 node prototype/games/tiem-banh-mi/test/e2e.mjs <thư mục ảnh>
// Kịch bản (desktop 1366×768 dpr 1,25 rồi mobile 390×844 dpr 3): mở game → đặt tên tiệm → Chuẩn bị ca (nhập hàng, mẻ đầu canh lò thật)
// → mở hàng → chơi trọn ngày 1: nướng / rút lò, ghim phiếu, ráp từng bước bằng nút thật (kiểm ổ đổi lớp ở từng bước), nướng lại cho phiếu
// "giòn giòn", gói, giao, thối tiền (nút Thối đúng + chọn tờ tay) → bảng chốt ca → tải lại giữ tiến trình → Chơi lại từ đầu có backup.
// Tua thời gian ca bằng __game.advance (không chờ thật). Yêu cầu 0 lỗi console.
import { launch, sleep } from "./cdp.mjs";

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8841;
const BASE = `http://127.0.0.1:${PORT}/games/tiem-banh-mi/?seed=777&prepSpeed=8`;
const b = await launch(OUT, 9461);
let fails = 0;
const check = (n, c, d = "") => { const s = (c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : ""); if (!c) fails++; console.log(s); };
let press = b.click;
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;e.scrollIntoView({block:'center',inline:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
async function pressSel(sel, wait = 30) {
  let p = null;
  for (let i = 0; i < wait && !(p = await at(sel)); i++) await sleep(80);
  if (!p) throw new Error("không thấy " + sel + " :: " + (await b.ev("JSON.stringify({ov:__game.overlay,dialog:__game.state.shift?.dialog,board:__game.state.shift?.boards[0]&&{cid:__game.state.shift.boards[0].cid,step:__game.state.shift.boards[0].step},paying:__game.state.shift?.paying,toasts:document.querySelector('#toasts').textContent})")));
  await press(...p); await sleep(90);
}
const S = (expr) => b.ev(`(()=>{const s=__game.state;return ${expr}})()`);
const visible = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0})()`);
const stage = () => b.ev(`(document.querySelector('#loafView')||{dataset:{}}).dataset.stage||''`);
const noOverflowX = () => b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth");
async function waitFor(expr, ms = 8000) { for (let t = 0; t < ms; t += 80) { if (await b.ev(expr).catch(() => false)) return true; await sleep(80); } return false; }
const CYCLE = [0, 2, 3, 1];
const clicksTo = (cur, want) => { let i = CYCLE.indexOf(cur), n = 0; while (CYCLE[i % 4] !== want && n < 4) { i++; n++; } return n; };

/** Hội thoại (khiếu nại / hết hàng / hết lẻ): bấm lựa chọn đầu tiên bấm được. */
async function clearDialogs() {
  for (let i = 0; i < 4; i++) {
    const d = await S("s.shift&&s.shift.dialog&&s.shift.dialog.kind");
    if (!d) return;
    await waitFor("!!document.querySelector('#sheet .choice:not(:disabled)')", 3000);
    await pressSel("#sheet .choice:not(:disabled)");
  }
}
/** Lò: nếu tủ ít bánh thì bỏ mẻ, tua tới vùng chín rồi rút bằng nút thật. */
async function tendOven(minCase = 2) {
  const st = await S("JSON.stringify({c:s.shift.case.length,o:s.shift.oven[0],t:s.shift.t,phoi:s.stock.phoi,gas:s.stock.gas})").then(JSON.parse);
  if (!st.o && st.c < minCase && st.phoi > 0 && st.gas > 0) { await pressSel('[data-act="bake"]'); st.o = { t0: await S("s.shift.t") }; st.t = st.o.t0; }
  if (st.o) {
    const need = 28500 - (st.t - st.o.t0);
    if (need > 0) await b.ev(`__game.advance(${need})`);
    await clearDialogs();
    if (await S("!!s.shift&&!!s.shift.oven[0]")) await pressSel('[data-act="pull"]');
  }
}
/** Ráp đúng ổ đang chọn trên thớt bằng nút thật; trả các stage ổ sau mỗi bước. */
async function buildClicks(shotPrefix = null) {
  const it = await S("JSON.stringify((()=>{const b=s.shift.boards[0];return s.shift.customers.find(c=>c.id===b.cid).items[b.item]})())").then(JSON.parse);
  const stages = [];
  await pressSel('[data-act="take"]'); stages.push(await stage());
  if (it.crispy && (await S("s.shift.boards[0].loaf.crisp")) < 85) {
    await pressSel('[data-act="toast"]'); await b.ev("__game.advance(4400)"); await pressSel('[data-act="toast"]');
  }
  await pressSel('[data-act="slice"]'); stages.push(await stage());
  for (const id of ["pate", "bo", "mayo"]) { const want = it.spreads[id] || 0; for (let k = clicksTo(0, want); k > 0; k--) await pressSel(`[data-spread="${id}"]`); }
  stages.push(await stage());
  if (shotPrefix) await b.shot(`${OUT}/${shotPrefix}-ra-p-phet.png`);
  for (const id of it.fills) await pressSel(`[data-fill="${id}"]`);
  const vegs = ["do-chua", "dua-leo", "rau-mui", "hanh-la"], on = vegs.filter((v) => it.veg[v]);
  if (on.length === 4) await pressSel('[data-veg="all"]'); else for (const v of on) await pressSel(`[data-veg="${v}"]`);
  stages.push(await stage());
  for (let k = clicksTo(0, it.ot); k > 0; k--) await pressSel('[data-spice="ot"]');
  for (const id of ["nuoc-tuong", "tuong-ot"]) if (it.sauces[id]) await pressSel(`[data-sauce="${id}"]`);
  stages.push(await stage());
  await pressSel(`[data-wrap="${it.bag ? "tui" : it.wrap}"]`); stages.push(await stage());
  return stages;
}
/** Thối tiền: tay (chọn tờ theo cách máy giải) hoặc nút Thối đúng. */
async function payClicks(manual) {
  if (!(await S("s.shift&&s.shift.paying!==null"))) return "none";
  await waitFor("!!document.querySelector('#change')", 3000);
  if (manual) {
    const bills = await b.ev("(async()=>{const m=await import('./core/money.js?v=b1');const s=__game.state;const c=s.shift.customers.find(x=>x.id===s.shift.paying);return JSON.stringify(m.makeChange(s.float,c.pay.change))})()").then(JSON.parse);
    if (bills) { for (const [d, n] of Object.entries(bills)) for (let i = 0; i < n; i++) await pressSel(`[data-bill="${d}"]`); await pressSel('[data-act="giveChange"]'); return "manual"; }
  }
  await pressSel('[data-act="autoChange"]');
  await clearDialogs();
  return "auto";
}

async function playDay1(tag, shots) {
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300); await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" }); await b.nav(BASE);
  check(`${tag}: mở game có ô tên tiệm`, await visible("#introGo") && await visible("#shopName"));
  check(`${tag}: cảnh xe đẩy dùng ảnh thật cart-scene + cart-foreground`, await b.ev(`!!document.querySelector('.stage img[src$="cart-scene.webp"]')&&!!document.querySelector('.stage img[src$="cart-foreground.webp"]')`));
  if (shots) await b.shot(`${OUT}/${tag}-01-chao.png`);
  await b.ev(`document.querySelector('#shopName').value=''`);
  await pressSel("#shopName"); await b.send("Input.insertText", { text: "Bánh Mì Hẻm Mười" });
  await pressSel("#introGo");
  check(`${tag}: bảng Chuẩn bị ca`, await waitFor("__game.overlay==='prep'"));
  check(`${tag}: tên tiệm đã lưu`, (await S("s.shopName")) === "Bánh Mì Hẻm Mười");
  await pressSel('[data-act="restockToday"]');
  if (shots) await b.shot(`${OUT}/${tag}-02-chuan-bi-ca.png`);
  await pressSel('[data-tab="oven"]');
  // canh lò thật: bỏ mẻ, chờ thanh vào vùng chín (đồng hồ chuẩn bị ×8), bấm Rút
  await pressSel('[data-act="prepBake"]');
  const gold = await waitFor("document.querySelector('.minioven .oven-lbl.golden')!==null", 12000);
  await pressSel('[data-act="prepPull"]');
  check(`${tag}: mẻ đầu ngày canh lò thật, rút đúng vùng chín`, gold && (await S("s.prep.loaves.length")) === 4 && (await S("s.prep.loaves[0].crisp")) === 100, await S("JSON.stringify(s.prep)"));
  if (shots) await b.shot(`${OUT}/${tag}-03-me-dau.png`);
  await pressSel("#openShop");
  check(`${tag}: mở hàng, 4 ổ trong tủ kính`, await waitFor("!!__game.state.shift") && (await S("s.shift.case.length")) === 4);
  let served = 0, manualDone = 0, autoDone = 0, layersOk = true, toastOk = null, firstShot = true;
  for (let guard = 0; guard < 40; guard++) {
    if (!(await S("!!s.shift"))) break;
    await clearDialogs();
    // chờ khách
    let cid = null;
    for (let i = 0; i < 300 && (await S("!!s.shift")); i++) {
      cid = await S("(s.shift.customers.find(c=>c.phase==='wait'&&!c.filled.some(Boolean))||{}).id??null");
      if (cid !== null) break;
      await b.ev("__game.advance(400)"); await clearDialogs();
    }
    if (cid === null) break;
    await tendOven(2);
    if (!(await S(`!!s.shift&&s.shift.customers.some(c=>c.id===${cid}&&c.phase==='wait')`))) continue;
    if (firstShot && shots) { await b.shot(`${OUT}/${tag}-04-khach-cho.png`); }
    await pressSel(`#rail .slip[data-cid="${cid}"]`);
    const n = await S(`s.shift.customers.find(c=>c.id===${cid}).items.length`);
    for (let k = 0; k < n; k++) {
      const crispy = await S("(()=>{const b=s.shift.boards[0];return s.shift.customers.find(c=>c.id===b.cid).items[b.item].crispy})()");
      const st = await buildClicks(firstShot && shots ? tag + "-05" : null);
      if (crispy) toastOk = await S("s.shift.boards[0].loaf.crisp>=85&&s.shift.boards[0].loaf.toasted");
      if (new Set(st).size < st.length - 1) layersOk = false;
      if (firstShot && shots) await b.shot(`${OUT}/${tag}-06-goi.png`);
      await pressSel('[data-act="serve"]');
    }
    await clearDialogs();
    if (firstShot && shots && await S("s.shift&&s.shift.paying!==null")) await b.shot(`${OUT}/${tag}-07-thoi-tien.png`);
    const how = await payClicks(served % 2 === 1);
    if (how === "manual") manualDone++; else if (how === "auto") autoDone++;
    served++; firstShot = false;
  }
  // tua tới hết ca
  for (let i = 0; i < 200 && (await S("!!s.shift")); i++) { await b.ev("__game.advance(2000)"); await clearDialogs(); }
  check(`${tag}: phục vụ cả ngày 1 bằng nút thật`, served >= 8, `${served} khách`);
  check(`${tag}: ổ bánh đổi lớp ở từng bước (loaf-layers)`, layersOk);
  check(`${tag}: phiếu "giòn giòn" được nướng lại ở lò than (≥ 85)`, toastOk !== false, String(toastOk));
  check(`${tag}: thối tiền cả nút Thối đúng lẫn chọn tờ tay`, autoDone >= 1 && manualDone >= 1, `${autoDone} tự động · ${manualDone} tay`);
  check(`${tag}: bảng chốt ca hiện lời lỗ`, await waitFor("__game.overlay==='summary'", 5000));
  const sum = await S("JSON.stringify(s.lastSummary)").then(JSON.parse);
  check(`${tag}: chốt ca có doanh thu, giá vốn, sao trung bình`, sum.revenue > 0 && sum.cogs > 0 && sum.avg >= 3.5, `doanh thu ${sum.revenue}k · lời ${sum.profit}k · ${sum.avg} sao · bán ${sum.loaves} ổ`);
  if (shots) await b.shot(`${OUT}/${tag}-08-chot-ca.png`);
  check(`${tag}: không tràn ngang`, await noOverflowX());
  await pressSel('[data-act="nextDay"]');
  check(`${tag}: sang ngày 2 về Chuẩn bị ca`, await waitFor("__game.overlay==='prep'") && (await S("s.day")) === 2);
  await b.nav(BASE);
  check(`${tag}: tải lại giữ tiến trình (ngày 2, tên tiệm, tiền)`, (await S("s.day")) === 2 && (await S("s.shopName")) === "Bánh Mì Hẻm Mười" && (await S("s.money")) === sum.money);
  return sum;
}

// ===== desktop 1366×768 dpr 1,25, chuột =====
await b.view(1366, 768, false, 1.25); await b.touch(false); press = b.click;
await playDay1("desktop", true);
// giữa ca tải lại giữ ổ đang ráp
await pressSel('[data-act="restockToday"]');
await pressSel("#openShop");
await b.ev("__game.act({type:'bake',slot:0});__game.advance(28500);__game.act({type:'pull',slot:0})");
let cid = null;
for (let i = 0; i < 200 && cid === null; i++) { cid = await S("(s.shift.customers.find(c=>c.phase==='wait')||{}).id??null"); if (cid === null) await b.ev("__game.advance(400)"); }
await pressSel(`#rail .slip[data-cid="${cid}"]`); await pressSel('[data-act="take"]'); await pressSel('[data-act="slice"]');
await b.ev("__game.act({type:'spread',id:'pate',lvl:2})");
const before = await S("JSON.stringify([s.shift.boards[0].loaf.spreads,s.stock.pate,s.money])");
await b.nav(BASE);
check("desktop: giữa ca tải lại giữ ổ đang ráp, kho, tiền (không trừ hai lần)", (await S("JSON.stringify([s.shift.boards[0].loaf.spreads,s.stock.pate,s.money])")) === before && (await b.ev("__game.overlay")) === "pause");
// chơi lại từ đầu: hỏi xác nhận, cất .backup
await pressSel('[data-act="restart"]');
check("desktop: Chơi lại từ đầu hỏi xác nhận", await waitFor("__game.overlay==='confirm-restart'"));
const keyBefore = await b.ev("localStorage.getItem('wgp.tiembanhmi.v1')");
await pressSel('[data-act="restartYes"]');
await sleep(800); await b.waitGame();
await waitFor("!!document.querySelector('#app.ready')", 8000);
check("desktop: chơi lại ⇒ bản cũ ở .backup, tiệm mới ngày 1", (await b.ev("localStorage.getItem('wgp.tiembanhmi.v1.backup')")) === keyBefore && (await S("s.day")) === 1 && (await b.ev("__game.overlay")) === "intro");

// ===== mobile 390×844 dpr 3, chạm =====
await b.view(390, 844, true, 3); await b.touch(true); press = b.tap;
await playDay1("mobile", true);
check("mobile: cảnh hệ số bội 0,5 thiết bị", await b.ev("(()=>{const k=__game.sceneScale()*devicePixelRatio*2;return Math.abs(k-Math.round(k))<1e-6})()"), String(await b.ev("__game.sceneScale()")));
check("0 lỗi console", b.errors.length === 0, b.errors.slice(0, 5).join(" | "));
b.close();
console.log(fails ? `\n${fails} FAIL` : "\nE2E ĐẠT");
process.exit(fails ? 1 : 0);
