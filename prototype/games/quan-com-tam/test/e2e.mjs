// E2E Quán Cơm Tấm trên Chrome headless qua CDP (test/cdp.mjs chép từ Tiệm Bánh Mì) — bấm chuột / chạm thật.
// Chạy (ở gốc repo): PORT=8851 node server.js   rồi   PORT=8851 node prototype/games/quan-com-tam/test/e2e.mjs <thư mục ảnh>
// Kịch bản (desktop 1366×768 dpr 1,25 rồi mobile 390×844 dpr 3): mở game → đặt tên quán → Chuẩn bị (nhập + ướp, nấu cơm, mỡ hành, nhóm bếp)
// → mở quán → chơi trọn ngày 1 bằng nút thật: mời ngồi (chạm khách rồi chạm bàn), chạm bàn châm trà / lấy phiếu, ghim phiếu, bỏ sườn lên vỉ,
// lật đúng lúc, bày dĩa từng lớp (kiểm dĩa đổi lớp), giao (cô chủ đi bưng), tính tiền (Tính đúng + cộng tay), dọn bàn, rửa chén
// → kiểm "không nút nào bị che" (elementFromPoint 5 điểm mỗi nút, cả khi có thông báo và khi có bảng phủ) → chốt ca → sang ngày 2 → tải lại giữ tiến trình.
// Desktop thêm: tải lại giữa ca giữ dĩa đang bày (không trừ kho hai lần), Chơi lại từ đầu có xác nhận + .backup. Tua thời gian bằng __game.advance. Yêu cầu 0 lỗi console.
import { launch, sleep } from "./cdp.mjs";

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8851;
const BASE = `http://127.0.0.1:${PORT}/games/quan-com-tam/?seed=777`;
const b = await launch(OUT, 9481);
let fails = 0;
const check = (n, c, d = "") => { const s = (c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : ""); if (!c) fails++; console.log(s); };
let press = b.click;
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
async function pressSel(sel, wait = 25) {
  let p = null;
  for (let i = 0; i < wait && !(p = await at(sel)); i++) await sleep(60);
  if (!p) { await b.shot(`${OUT}/LOI-${sel.replace(/[^a-z0-9]+/gi, "_").slice(0, 40)}.png`).catch(() => {}); throw new Error("không thấy " + sel + " :: " + (await b.ev("JSON.stringify({ov:__game.overlay,dialog:__game.state.shift?.dialog,hint:__game.hint()})"))); }
  await press(...p); await sleep(70);
  if (process.env.DEBUG) { LAST.push(sel); if (LAST.length > 6) LAST.shift(); }
}
const LAST = [];
const S = (expr) => b.ev(`(()=>{const s=__game.state;return ${expr}})()`);
const visible = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0})()`);
const noOverflowX = () => b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth");
async function waitFor(expr, ms = 8000) { for (let t = 0; t < ms; t += 80) { if (await b.ev(expr).catch(() => false)) return true; await sleep(80); } return false; }
/** Mọi nút trong danh sách không bị phần tử khác che (5 điểm: tâm + 4 góc lùi vào 20%). */
async function notCovered(sels) {
  return b.ev(`(()=>{const bad=[];for(const sel of ${JSON.stringify(sels)}){for(const e of document.querySelectorAll(sel)){if(e.closest('[hidden]')||!e.getBoundingClientRect().width)continue;const r=e.getBoundingClientRect();
    if(r.bottom>innerHeight||r.top<0||r.right>innerWidth||r.left<0)continue;
    const pts=[[.5,.5],[.2,.2],[.8,.2],[.2,.8],[.8,.8]];for(const[fx,fy]of pts){const x=r.left+r.width*fx,y=r.top+r.height*fy;const h=document.elementFromPoint(x,y);if(!h||!(h===e||e.contains(h))){bad.push(sel+(e.dataset.slot??e.dataset.layer??e.dataset.table??e.dataset.dock??e.dataset.act??'')+'@'+Math.round(x)+','+Math.round(y)+' ⇐ '+(h?h.className||h.tagName:'null'));break;}}}}return bad})()`);
}
const CONTROLS = ['[data-act="serve"]', '[data-act="undo"]', ".strip .lay", ".gchip", '[data-act="addCoal"]', '[data-act="fan"]', '[data-act="cookRice"]', '[data-act="wash"]', "#dock button", ".tbtn-scene", ".slip"];

/** Hội thoại (khiếu nại / hết hàng / tính dư): bấm lựa chọn đầu tiên bấm được. */
async function clearDialogs() {
  for (let i = 0; i < 4; i++) {
    const d = await S("s.shift&&s.shift.dialog&&s.shift.dialog.kind");
    if (!d) return;
    await waitFor("!!document.querySelector('#sheet .choice:not(:disabled)')", 3000);
    await pressSel("#sheet .choice:not(:disabled)");
  }
}
/** Cô chủ đứng ở bếp và không có miếng nào sắp tới lúc lật / gắp trong `sec` giây (để rời bếp ra bàn). */
const grillSafe = (sec) => S(`(()=>{const g=s.shift.grill;for(let i=0;i<6;i++){const it=g.slots[i];if(!it)continue;if(i>=4&&it.warmMs<50000)continue;const z=i<2?1.5:i<4?1:.25;const rate=100/9*z*1.2*(s.shift.tutorial?.85:1);const tgt=it.sides[0]<100?100:127;if((tgt-it.sides[0])/rate<${sec})return false}return true})()`);
async function tendGrill() {
  // lật mặt dưới đã chín, bỏ miếng cháy (chạm chip thật)
  for (let i = 0; i < 6; i++) {
    const st = await S(`(()=>{const it=s.shift&&s.shift.grill.slots[${i}];if(!it)return null;return it.sides[0]>=130||it.sides[1]>=130?"burnt":it.sides[0]>=100&&it.sides[1]<100?"flip":(${i}<4&&it.sides[0]>=100&&it.sides[1]>=100&&s.shift.grill.slots.slice(4).some(x=>!x))?"warm":null})()`);
    if (st && (await b.ev("__game.ownerFree()"))) await pressSel(`.gchip[data-slot="${i}"]`);
  }
}
const step = () => b.ev(`(async()=>{const m=await import('./core/plate.js?v=c1');return m.nextStep(__game.state)})()`);

async function playDay1(tag, shots) {
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300); await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" }); await b.nav(BASE);
  check(`${tag}: mở game có ô tên quán`, await visible("#introGo") && await visible("#shopName"));
  check(`${tag}: cảnh vỉa hè vẽ qua atlas (ảnh thật hoặc hình dự phòng, không ảnh vỡ)`, await b.ev(`(()=>{const i=document.querySelector('.stage img[data-layer="street"]');return !!i&&i.complete&&i.naturalWidth===1280})()`));
  if (shots) await b.shot(`${OUT}/${tag}-01-chao.png`);
  await b.ev(`document.querySelector('#shopName').value=''`);
  await pressSel("#shopName"); await b.send("Input.insertText", { text: "Cơm Tấm Cô Ba Hẻm 5" });
  await pressSel("#introGo");
  check(`${tag}: bảng Chuẩn bị`, await waitFor("__game.overlay==='prep'"));
  check(`${tag}: tên quán đã lưu`, (await S("s.shopName")) === "Cơm Tấm Cô Ba Hẻm 5");
  await pressSel('[data-act="restockToday"]');
  await pressSel('[data-tab="first"]');
  for (const a of ["prepCook", "prepMoHanh", "prepLight"]) if (await at(`[data-act="${a}"]`)) await pressSel(`[data-act="${a}"]`);
  check(`${tag}: mẻ đầu: nồi cơm đầy, hũ mỡ hành, bếp đã nhóm`, (await S("s.kitchen.rice")) >= 10 && (await S("s.moHanh.n")) >= 10 && (await S("s.kitchen.coal")) >= 70, await S("JSON.stringify({k:s.kitchen,m:s.moHanh})"));
  if (shots) await b.shot(`${OUT}/${tag}-02-chuan-bi.png`);
  await pressSel("#openShop");
  check(`${tag}: mở quán, ca hướng dẫn ngày 1`, await waitFor("!!__game.state.shift") && (await S("s.shift.tutorial")) === true);
  let delivered = 0, flips = 0, perfect = 0, billsAuto = 0, billsManual = 0, cleaned = 0, washed = 0, layersOk = true, firstPlate = true, covered = [], coveredOv = [], hintSeen = new Set(), seatedByTap = 0;
  const shot = async (n) => { if (shots) await b.shot(`${OUT}/${tag}-${n}.png`); };
  for (let guard = 0; guard < 3000 && (await S("!!s.shift")); guard++) {
    await clearDialogs();
    if (!(await S("!!s.shift"))) break;
    const h = await b.ev("JSON.stringify(__game.hint())").then(JSON.parse).catch(() => null);
    if (h) hintSeen.add(h.key);
    // tính tiền đang mở: lần đầu "Tính đúng", sau đó cộng tay từng dòng thật
    if (await S("!!s.shift.billing")) {
      if (billsAuto === 0) { await pressSel('[data-act="autoBill"]'); billsAuto++; }
      else { const keys = await S("JSON.stringify(s.shift.billing.lines.filter(l=>l.real).map(l=>l.key))").then(JSON.parse); for (const k of keys) await pressSel(`.bline[data-line="${k}"]`); billsManual++; }
      if (shots && billsAuto + billsManual === 1) await shot("07-tinh-tien");
      await pressSel('[data-act="collect"]');
      continue;
    }
    await tendGrill();
    // mời ngồi: chạm nhóm đang chờ rồi chạm bàn trống
    const seat = await S(`(()=>{const g=s.shift.groups.find(x=>x.phase==='wait');if(!g)return null;const t=s.shift.tables.find(x=>x.gid===null&&x.state!=='dirty'&&x.seats>=g.size);return t?{gid:g.id,tid:t.id}:null})()`);
    if (seat) {
      if (shots && seatedByTap === 0) await shot("03-khach-cho");
      await pressSel(`.gbtn[data-gid="${seat.gid}"]`);
      await pressSel(`.tbtn-scene[data-table="${seat.tid}"]`);
      if (await S(`s.shift.groups.some(g=>g.id===${seat.gid}&&g.phase!=='wait')`)) seatedByTap++;
      continue;
    }
    // bày dĩa
    const free = await b.ev("__game.ownerFree()");
    // nướng sẵn: số miếng trên vỉ theo kịp số người đã ngồi chưa có món (chạm chip trống ở vùng nóng)
    if (free) {
      const pre = await S(`(()=>{const sh=s.shift;const want=sh.groups.filter(g=>g.phase==='seated'&&!g.paid).reduce((a,g)=>a+g.members.filter(m=>!m.plate&&(m.tk===null||sh.tickets.find(t=>t.id===m.tk&&t.status!=='served'&&t.status!=='carrying'))).length,0)-sh.slots.filter(x=>x.plate&&x.plate.meat).length;const have=sh.grill.slots.filter(Boolean).length;if(have>=want||have>=4||s.stock['suon-uop']<=0)return -1;return [0,1,2,3].find(i=>!sh.grill.slots[i])??-1})()`);
      if (pre >= 0) { await pressSel(`.gchip[data-slot="${pre}"]`); continue; }
    }
    if (free) {
      if (await S("s.shift.slots[s.shift.sel].tk===null")) {
        const tk = await S("(s.shift.tickets.find(t=>t.status==='open')||{}).id??null");
        if (tk !== null) { await pressSel(`.slip[data-tk="${tk}"]`); continue; }
      } else {
        const st = await step();
        const before = await b.ev(`(document.querySelector('.plate-view')||{dataset:{}}).dataset.layers||''`);
        if (st === "grill") { const slot = await S("[0,1,2,3].find(i=>!s.shift.grill.slots[i])??-1"); if (slot >= 0) { await pressSel(`.gchip[data-slot="${slot}"]`); continue; } }
        else if (st === "meat") {
          const slot = await S("s.shift.grill.slots.findIndex(it=>it&&it.sides[0]>=100&&it.sides[1]>=100&&it.sides[0]<130&&it.sides[1]<130)");
          if (slot >= 0) await pressSel(`.gchip[data-slot="${slot}"]`); else await pressSel('[data-layer="meat"]');
          if (firstPlate) { const after = await b.ev(`document.querySelector('.plate-view').dataset.layers`); if (after === before) layersOk = false; }
          continue;
        } else if (st === "serve") {
          if (firstPlate) { await shot("05-dia-du-lop"); covered = await notCovered(CONTROLS); }
          if (await grillSafe(5)) { await pressSel('[data-act="serve"]'); delivered++; firstPlate = false; continue; }
        } else if (st && !st.startsWith("wait") && st !== "egg") {
          await pressSel(`[data-layer="${st}"]`);
          if (firstPlate) { const after = await b.ev(`(document.querySelector('.plate-view')||{dataset:{}}).dataset.layers||''`); if (after === before) layersOk = false; if (st === "com") await shot("04-xoi-com"); }
          continue;
        }
      }
    }
    // việc ở bàn (chỉ rời bếp khi vỉ an toàn)
    const job = await S(`(()=>{for(const t of s.shift.tables){const j=__game.tableJob(t.id);if(j&&j!=='seat')return {tid:t.id,j}}return null})()`);
    if (job && free && (await grillSafe(5)) && (await S("s.shift.owner.queue.length<2"))) {
      await pressSel(`.tbtn-scene[data-table="${job.tid}"]`);
      if (job.j === "clean") cleaned++;
      continue;
    }
    if (free && (await S("s.shift.cleanPlates<=3&&s.shift.dirty>0")) && (await grillSafe(9))) { await pressSel('[data-act="wash"]'); washed++; continue; }
    if (free && (await S("s.shift.grill.coal<35&&s.shift.grill.pending.length===0&&s.stock.than>0"))) { await pressSel('[data-act="addCoal"]'); continue; }
    if (process.env.DEBUG && guard % 20 === 0) console.log(guard, LAST.join(' ; '), JSON.stringify(h), await S("JSON.stringify({t:Math.round(s.shift.t/1000),own:s.shift.owner.task&&s.shift.owner.task.kind,q:s.shift.owner.queue.length,slot:s.shift.slots[0].tk,g:s.shift.groups.map(g=>g.phase+':'+g.table),tk:s.shift.tickets.map(t=>t.status)})"), await step());
    await b.ev("__game.advance(600)");
  }
  check(`${tag}: chơi trọn ngày 1 bằng nút thật`, delivered >= 6, `${delivered} dĩa bưng ra bàn, ${seatedByTap} lần mời ngồi`);
  check(`${tag}: dĩa đổi lớp sau mỗi bước bày (plate-layers)`, layersOk);
  check(`${tag}: tính tiền cả nút Tính đúng lẫn cộng tay từng dòng`, billsAuto >= 1 && billsManual >= 1, `${billsAuto} tự động · ${billsManual} tay`);
  check(`${tag}: dọn bàn bằng chạm bàn`, cleaned >= 1, String(cleaned));
  check(`${tag}: gợi ý ngày 1 dẫn từng bước (mời ngồi, lấy phiếu, ghim phiếu, lật, bày, gắp, giao, tính tiền, dọn)`, ["seat", "visit", "pin", "flip", "layer", "pick", "serve", "bill", "clean"].every((k) => hintSeen.has(k)), [...hintSeen].join(","));
  check(`${tag}: không nút nào bị che lúc đang chơi (có thông báo)`, covered.length === 0, covered.slice(0, 4).join(" | "));
  check(`${tag}: bảng chốt ca hiện lời lỗ`, await waitFor("__game.overlay==='summary'", 6000));
  const sum = await S("JSON.stringify(s.lastSummary)").then(JSON.parse);
  check(`${tag}: chốt ca có doanh thu, giá vốn, sao trung bình`, sum.revenue > 0 && sum.cogs > 0 && sum.avg >= 3, `doanh thu ${sum.revenue}k · lời ${sum.profit}k · ${sum.avg} sao · ${sum.plates} dĩa · bỏ về ${sum.lost} · lật đúng lúc ${sum.perfectFlips}`);
  await shot("08-chot-ca");
  check(`${tag}: không tràn ngang`, await noOverflowX());
  await pressSel('[data-act="nextDay"]');
  check(`${tag}: sang ngày 2 về Chuẩn bị`, await waitFor("__game.overlay==='prep'") && (await S("s.day")) === 2);
  // bảng phủ: thông báo lên dải trên cùng, không đè nút của bảng
  await pressSel('[data-buy="than"]');
  coveredOv = await notCovered(["#sheet .tab", "#sheet [data-buy]", "#openShop"]);
  check(`${tag}: có bảng phủ + thông báo: không nút nào bị che`, coveredOv.length === 0, coveredOv.slice(0, 3).join(" | "));
  const moneyNow = await S("s.money");
  await b.nav(BASE);
  check(`${tag}: tải lại giữ tiến trình (ngày 2, tên quán, tiền)`, (await S("s.day")) === 2 && (await S("s.shopName")) === "Cơm Tấm Cô Ba Hẻm 5" && (await S("s.money")) === moneyNow, `${moneyNow}k`);
  return sum;
}

// ===== desktop 1366×768 dpr 1,25, chuột =====
const MOBILE_ONLY = !!process.env.MOBILE_ONLY;
await b.view(1366, 768, false, 1.25); await b.touch(false); press = b.click;
if (!MOBILE_ONLY) {
  await playDay1("desktop", true);
  check("desktop: cảnh hệ số bội 0,5 thiết bị (1366@1,25 ⇒ 1,0)", await b.ev("(()=>{const k=__game.sceneScale()*devicePixelRatio;return Math.abs(k-1)<1e-6})()"), String(await b.ev("__game.sceneScale()")));
  // giữa ca tải lại giữ dĩa đang bày, kho, tiền (không trừ hai lần)
  await pressSel('[data-act="restockToday"]');
  await pressSel('[data-tab="first"]');
  for (const a of ["prepCook", "prepLight"]) if (await at(`[data-act="${a}"]`)) await pressSel(`[data-act="${a}"]`);
  await pressSel("#openShop");
  await waitFor("!!__game.state.shift");
  let tk = null;
  for (let i = 0; i < 300 && tk === null; i++) {
    await clearDialogs();
    const g = await S("(()=>{const g=s.shift.groups.find(x=>x.phase==='wait');const t=g&&s.shift.tables.find(x=>x.gid===null&&x.state!=='dirty'&&x.seats>=g.size);return g&&t?[g.id,t.id]:null})()");
    if (g) await b.ev(`__game.act({type:'seat',gid:${g[0]},tid:'${g[1]}'})`);
    await b.ev(`(()=>{for(const t of __game.state.shift.tables)if(__game.tableJob(t.id)==='visit')__game.act({type:'tableTap',tid:t.id})})()`);
    tk = await S("(s.shift.tickets.find(t=>t.status==='open')||{}).id??null");
    if (tk === null) await b.ev("__game.advance(400)");
  }
  for (let i = 0; i < 60 && !(await b.ev("__game.ownerFree()")); i++) await b.ev("__game.advance(300)");
  await pressSel(`.slip[data-tk="${tk}"]`);
  await pressSel('[data-layer="dia"]'); await pressSel('[data-layer="com"]'); await pressSel('[data-layer="moHanh"]');
  const before = await S("JSON.stringify([s.shift.slots[0].plate&&{c:s.shift.slots[0].plate.com,m:s.shift.slots[0].plate.moHanh},s.shift.rice.n,s.moHanh.n,s.money,s.shift.cleanPlates])");
  await b.nav(BASE);
  check("desktop: giữa ca tải lại giữ dĩa đang bày, nồi cơm, hũ mỡ hành, tiền (không trừ hai lần)", (await S("JSON.stringify([s.shift.slots[0].plate&&{c:s.shift.slots[0].plate.com,m:s.shift.slots[0].plate.moHanh},s.shift.rice.n,s.moHanh.n,s.money,s.shift.cleanPlates])")) === before && (await b.ev("__game.overlay")) === "pause", before);
  // chơi lại từ đầu: hỏi xác nhận, cất .backup
  await pressSel('[data-act="restart"]');
  check("desktop: Chơi lại từ đầu hỏi xác nhận", await waitFor("__game.overlay==='confirm-restart'"));
  const keyBefore = await b.ev("localStorage.getItem('wgp.quancomtam.v1')");
  await pressSel('[data-act="restartYes"]');
  await sleep(800); await b.waitGame();
  await waitFor("!!document.querySelector('#app.ready')", 8000);
  check("desktop: chơi lại ⇒ bản cũ ở .backup, quán mới ngày 1", (await b.ev("localStorage.getItem('wgp.quancomtam.v1.backup')")) === keyBefore && (await S("s.day")) === 1 && (await b.ev("__game.overlay")) === "intro");
  // bản lưu hỏng ⇒ chép sang .corrupt, mở quán mới, không lỗi
  await b.ev("addEventListener('pagehide',()=>localStorage.setItem('wgp.quancomtam.v1','{hỏng'))");
  await b.nav(BASE);
  check("desktop: bản lưu hỏng được chép sang .corrupt, mở quán mới", (await b.ev("localStorage.getItem('wgp.quancomtam.v1.corrupt')")) === "{hỏng" && (await S("s.day")) === 1);
}

// ===== mobile 390×844 dpr 3, chạm =====
await b.view(390, 844, true, 3); await b.touch(true); press = b.tap;
await playDay1("mobile", true);
check("mobile: cảnh hệ số bội 0,5 thiết bị (390@3 ⇒ 1,0, thấy mọi bàn)", await b.ev("(()=>{const k=__game.sceneScale()*devicePixelRatio*2;return Math.abs(k-Math.round(k))<1e-6})()"), String(await b.ev("__game.sceneScale()")));
check("mobile: thấy đủ mọi bàn trong khung cảnh", await b.ev(`(()=>{const w=document.querySelector('#scene').getBoundingClientRect();return [...document.querySelectorAll('.tbtn-scene')].every(e=>{const r=e.getBoundingClientRect();return r.left>=w.left-2&&r.right<=w.right+2&&r.top>=w.top-2&&r.bottom<=w.bottom+2})})()`));
check("0 lỗi console", b.errors.length === 0, b.errors.slice(0, 5).join(" | "));
b.close();
console.log(fails ? `\n${fails} FAIL` : "\nE2E ĐẠT");
process.exit(fails ? 1 : 0);
