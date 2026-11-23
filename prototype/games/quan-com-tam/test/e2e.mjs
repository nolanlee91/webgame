// E2E Quán Cơm Tấm trên Chrome headless qua CDP (test/cdp.mjs chép từ Tiệm Bánh Mì) — bấm chuột / chạm thật.
// Chạy (ở gốc repo): PORT=8851 node server.js   rồi   PORT=8851 node prototype/games/quan-com-tam/test/e2e.mjs <thư mục ảnh>
// Kịch bản (desktop 1366×768 dpr 1,25 rồi mobile 390×844 dpr 3): mở game → đặt tên quán → Chuẩn bị (nhập + ướp, nấu cơm, mỡ hành, nhóm bếp)
// → mở quán → chơi trọn ngày 1 bằng nút thật: mời ngồi (chạm khách rồi chạm bàn), chạm bàn châm trà / lấy phiếu, ghim phiếu, bỏ sườn lên vỉ,
// lật đúng lúc, bày dĩa từng lớp (kiểm dĩa đổi lớp), giao (cô chủ đi bưng), tính tiền (Tính đúng + cộng tay), dọn bàn, rửa chén
// → kiểm "không nút nào bị che" (elementFromPoint 5 điểm mỗi nút, cả khi có thông báo và khi có bảng phủ) → chốt ca → sang ngày 2 → tải lại giữ tiến trình.
// Desktop thêm: tải lại giữa ca giữ dĩa đang bày (không trừ kho hai lần), Chơi lại từ đầu có xác nhận + .backup. Tua thời gian bằng __game.advance. Yêu cầu 0 lỗi console.
import { launch, sleep } from "./cdp.mjs";
import { runM3A, runM3AMobile } from "./e2e-m3a.mjs"; // A: M3 tiến trình + kinh tế
import { runM5V } from "./e2e-m5v.mjs"; // V: M5 hình + tiếng

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8851;
const BASE = `http://127.0.0.1:${PORT}/games/quan-com-tam/?seed=777`;
const b = await launch(OUT, Number(process.env.CDP_PORT) || 9481); // B: cổng CDP đổi được (chạy song song)
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
    if (!d) { if (await visible('#drama [data-act="eventDone"]')) await pressSel('#drama [data-act="eventDone"]'); return; }
    const root = d === "event" ? "#drama" : "#sheet"; // B: drama — hội thoại sự kiện ở lớp #drama
    await waitFor(`!!document.querySelector('${root} .choice:not(:disabled)')`, 3000);
    await pressSel(`${root} .choice:not(:disabled)`);
    for (let k = 0; k < 3 && (await visible('#drama [data-act="eventNext"], #drama [data-act="eventDone"]')); k++) {
      if (await visible('#drama [data-act="eventNext"]')) { await pressSel('#drama [data-act="eventNext"]'); await pressSel("#drama .choice:not(:disabled)"); }
      else await pressSel('#drama [data-act="eventDone"]');
    }
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
const step = () => b.ev(`(async()=>{const m=await import('./core/plate.js?v=c2');return m.nextStep(__game.state)})()`);

async function playDay1(tag, shots) {
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300); await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" }); await b.nav(BASE);
  check(`${tag}: mở game có ô tên quán`, await visible("#introGo") && await visible("#shopName"));
  check(`${tag}: cảnh vỉa hè vẽ qua atlas (ảnh thật hoặc hình dự phòng, không ảnh vỡ)`, await b.ev(`(()=>{const i=document.querySelector('.stage img[data-layer="street"]');return !!i&&i.complete&&i.naturalWidth===1280})()`));
  if (shots) await b.shot(`${OUT}/${tag}-01-chao.png`);
  await b.ev(`document.querySelector('#shopName').value=''`);
  await pressSel("#shopName"); await b.send("Input.insertText", { text: "Cơm Tấm Cô Ba Hẻm 5" });
  // M4 (C): chọn tính cách cô chủ ở màn chào
  await pressSel('.pcard[data-persona="lay"]');
  check(`${tag}: màn chào có 4 thẻ tính cách, chọn Lầy lội`, (await b.ev("document.querySelectorAll('.pcard').length")) === 4 && (await b.ev("document.querySelector('.pcard[data-persona=\"lay\"]').getAttribute('aria-checked')")) === "true");
  await pressSel("#introGo");
  check(`${tag}: tính cách đã lưu`, (await S("s.persona.id")) === "lay");
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
    try { // ca tự chốt giữa hai lệnh (đồng hồ ca chạy thật) ⇒ ra khỏi vòng, không coi là lỗi
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
    } catch (e) { if (await S("!!s.shift").catch(() => true)) throw e; break; }
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
  await replyFlow(tag, shots);
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

/** M4 (C): từ bảng chốt ngày mở Sổ, trả lời review, đổi tính cách ngay trong bảng (lựa chọn đổi), trả lời lần nữa, câu trả lời hiện + còn đó, mở thẻ Nhật Ký. */
async function replyFlow(tag, shots) {
  check(`${tag}: chốt ngày có câu chốt Nhật Ký`, (await b.ev("(document.querySelector('#sheet .headline')||{}).textContent||''")).length > 10);
  await pressSel('[data-act="openBook"]');
  check(`${tag}: mở Sổ quản lý (6 tab: Review, Nhật ký, Sự kiện, Nhiệm vụ, Huy hiệu, Sổ nợ)`, await waitFor("__game.overlay==='book'") && (await b.ev("[...document.querySelectorAll('#sheet .tabs .tab')].map(e=>e.dataset.tab).join()")) === "reviews,journal,events,missions,badges,debts");
  // gộp A + B: tab cắm vào Sổ (registerTab) vẽ được, rồi về tab Review
  for (const t of ["events", "missions", "badges", "debts"]) { await pressSel(`#sheet .tabs [data-tab="${t}"]`); check(`${tag}: tab Sổ "${t}" có nội dung`, (await b.ev("(document.querySelector('#sheet .nb-body')||{}).textContent||''")).length > 10); }
  if (shots) await b.shot(`${OUT}/${tag}-09b-so-tab-no.png`);
  await pressSel('#sheet .tabs [data-tab="reviews"]');
  const opts = () => b.ev("[...document.querySelectorAll('#sheet .choices [data-reply]')].map(e=>e.dataset.reply).join(',')");
  const o1 = await opts();
  check(`${tag}: bảng trả lời theo tính cách đang chọn (Lầy lội)`, o1.length > 0 && o1.split(",").every((x) => x.startsWith("lay-")), o1);
  await pressSel('#sheet .persona-switch [data-persona="hien"]');
  const o2 = await opts();
  check(`${tag}: đổi tính ngay trong bảng ⇒ lựa chọn đổi liền`, o2 !== o1 && o2.split(",").every((x) => x.startsWith("hien-")) && (await S("s.persona.id")) === "hien", o2);
  if (tag === "mobile") { const cv = await notCovered(["#sheet .choice", "#sheet .persona-switch .ps", "#sheet .tab"]); check(`${tag}: bảng trả lời không nút nào bị che`, cv.length === 0, cv.slice(0, 3).join(" | ")); }
  const id1 = Number(await b.ev("document.querySelector('#sheet .nb-pane').dataset.review"));
  await pressSel("#sheet .choices [data-reply]:not(:disabled)");
  const t1 = await S(`(s.feed.find(r=>r.id===${id1}).reply||{}).text||''`);
  check(`${tag}: trả lời lần 1 hiện ngay dưới review`, t1.length > 10 && (await b.ev("(document.querySelector('#sheet .reply-done .say')||{}).textContent||''")).includes(t1), t1);
  if (shots) await b.shot(`${OUT}/${tag}-09-tra-loi-review.png`);
  const id2 = await b.ev("(()=>{const e=document.querySelector('#sheet .revbtn:not(.done)');return e?Number(e.dataset.review):null})()");
  let t2 = "";
  if (id2 !== null) {
    await pressSel(`#sheet .revbtn[data-review="${id2}"]`);
    await pressSel('#sheet .persona-switch [data-persona="cucsuc"]');
    const o3 = await opts();
    check(`${tag}: đổi sang Cục súc ⇒ lựa chọn cục súc`, o3.split(",").every((x) => x.startsWith("cuc-")), o3);
    await pressSel("#sheet .choices [data-reply]:not(:disabled)");
    t2 = await S(`(s.feed.find(r=>r.id===${id2}).reply||{}).text||''`);
  }
  const listed = (id, t) => b.ev(`(()=>{const e=document.querySelector('#sheet .revbtn[data-review="${id}"] .say');return !!e&&e.textContent.includes(${JSON.stringify(t)})&&e.getBoundingClientRect().height>0})()`);
  check(`${tag}: trả lời lần 2 xong, cả hai câu trả lời hiện trong sổ`, (await listed(id1, t1)) && (id2 === null || (t2.length > 10 && (await listed(id2, t2)))), t2);
  // đóng sổ ⇒ về bảng chốt ngày; mở lại ⇒ câu trả lời vẫn còn
  await pressSel('[data-act="bookClose"]');
  check(`${tag}: đóng sổ quay về bảng chốt ngày`, await waitFor("__game.overlay==='summary'"));
  await pressSel('[data-act="journalCard"]');
  check(`${tag}: mở thẻ Nhật Ký 1080×1350 (nền dự phòng hoặc journal-card)`, await waitFor("__game.overlay==='journal'&&document.querySelector('#journalCanvas').dataset.ready==='1'") && (await b.ev("(()=>{const c=document.querySelector('#journalCanvas');return c.width===1080&&c.height===1350})()")));
  const q0 = await b.ev("document.querySelector('#journalCanvas').dataset.quote");
  await pressSel('[data-act="hideName"]');
  await waitFor("document.querySelector('#journalCanvas').dataset.ready==='1'");
  check(`${tag}: ẩn tên quán trên thẻ`, (await b.ev("document.querySelector('#journalCanvas').dataset.shop")) === "");
  await pressSel('[data-act="nextMoment"]');
  await waitFor("document.querySelector('#journalCanvas').dataset.ready==='1'");
  const q1 = await b.ev("document.querySelector('#journalCanvas').dataset.quote");
  check(`${tag}: đổi khoảnh khắc trên thẻ`, q1.length > 5 && (q1 !== q0 || (await S("s.journal[0].moments.length")) <= 1), q1);
  check(`${tag}: có nút lưu PNG + chia sẻ`, (await visible('[data-act="savePng"]')) && (await visible('[data-act="sharePng"]')));
  if (shots) await b.shot(`${OUT}/${tag}-10-nhat-ky.png`);
  check(`${tag}: thẻ xuất PNG được (canvas không bẩn)`, await b.ev("document.querySelector('#journalCanvas').toDataURL('image/png').length>5000"));
  await pressSel('[data-act="closeJournal"]');
  check(`${tag}: đóng thẻ về bảng chốt ngày`, await waitFor("__game.overlay==='summary'"));
  if (await at('[data-act="openBook"]')) {
    await pressSel('[data-act="openBook"]');
    check(`${tag}: mở lại sổ, câu trả lời vẫn còn`, await listed(id1, t1));
    await pressSel('[data-act="bookClose"]');
    await waitFor("__game.overlay==='summary'");
  }
}

// ===== desktop 1366×768 dpr 1,25, chuột =====
const MOBILE_ONLY = !!process.env.MOBILE_ONLY;
await b.view(1366, 768, false, 1.25); await b.touch(false); press = b.click;
const M5V = { b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT }; // V:
if (process.env.M3_ONLY) await runM3A({ b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT, tag: "desktop" }); // A: chỉ chạy phần M3
else if (process.env.M5V_ONLY) { if (!MOBILE_ONLY) await runM5V({ ...M5V, tag: "desktop" }); } // V: chỉ chạy phần M5 hình + tiếng
else if (!MOBILE_ONLY) {
  // tách cho vừa giới hạn thời gian: DESK_PART=1 chỉ ngày 1 (+ review / Nhật Ký), DESK_PART=2 bỏ ngày 1 (quán mới) rồi chạy phần còn lại
  const part = process.env.DESK_PART || "";
  if (part !== "2") await playDay1("desktop", true);
  else { await b.send("Page.navigate", { url: "about:blank" }); await sleep(300); await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" }); await b.nav(BASE); await pressSel("#introGo"); await waitFor("__game.overlay==='prep'"); }
  check("desktop: cảnh hệ số bội 0,5 thiết bị (1366@1,25 ⇒ 1,0)", await b.ev("(()=>{const k=__game.sceneScale()*devicePixelRatio;return Math.abs(k-1)<1e-6})()"), String(await b.ev("__game.sceneScale()")));
  if (part !== "1") {
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
  // ===== B: Drama — mở sự kiện bằng móc, ca dừng, chân dung, chọn lựa chọn và kiểm hiệu ứng, không nút nào bị che =====
  await pressSel('[data-act="resume"]');
  const r1 = await b.ev("JSON.stringify(__game.openEvent('K14'))");
  check("desktop: Drama: mở sự kiện K14 bằng móc", JSON.parse(r1).ok === true && (await waitFor("__game.dramaOpen&&!document.querySelector('#drama').hidden")), r1);
  const t0 = await S("s.shift.t"); await sleep(700);
  check("desktop: Drama: đồng hồ ca dừng khi hội thoại mở", (await S("s.shift.t")) === t0 && (await S("s.shift.dialog.kind")) === "event");
  check("desktop: Drama: hai chân dung (Cô Út + cô chủ) vẽ qua atlas", await b.ev(`(()=>{const p=[...document.querySelectorAll('#drama .dportrait')];return p.length===2&&p.every(x=>x.dataset.frame||x.querySelector('.ini'))})()`), await b.ev(`[...document.querySelectorAll('#drama .dportrait')].map(x=>x.dataset.frame).join(',')`));
  const covD = await notCovered(["#drama .choice"]);
  check("desktop: Drama: không lựa chọn nào bị che", covD.length === 0, covD.slice(0, 3).join(" | "));
  await b.shot(`${OUT}/desktop-09-drama.png`);
  const rep0 = await S("s.rep");
  await pressSel('#drama .choice[data-choice="stool"]');
  check("desktop: Drama: chọn 'mời ghế đẩu' ⇒ +1 danh tiếng, bảng hậu quả có nút Xong", (await S("s.rep")) === Math.min(100, rep0 + 1) && (await visible('#drama [data-act="eventDone"]')), `${rep0} → ${await S("s.rep")}`);
  await pressSel('#drama [data-act="eventDone"]');
  check("desktop: Drama: đóng hội thoại, ca chạy lại", (await S("s.shift.dialog")) === null && (await b.ev("document.querySelector('#drama').hidden")) && (await S("s.drama.history[0].id")) === "K14");
  await b.ev("__game.openEvent('O11')");
  await waitFor("__game.dramaOpen");
  check("desktop: Drama: độc thoại chỉ một chân dung", (await b.ev("document.querySelectorAll('#drama .dportrait').length")) === 1);
  const pl0 = await S("s.plates");
  await pressSel('#drama .choice[data-choice="clean"]');
  check("desktop: Drama: bể dĩa ⇒ quán mất 2 dĩa", (await S("s.plates")) === pl0 - 2, `${pl0} → ${await S("s.plates")}`);
  await pressSel('#drama [data-act="eventDone"]');
  // chơi lại từ đầu: hỏi xác nhận, cất .backup
  await b.ev("__game.overlays.pause()");
  await pressSel('[data-act="restart"]');
  check("desktop: Chơi lại từ đầu hỏi xác nhận", await waitFor("__game.overlay==='confirm-restart'"));
  const keyBefore = await b.ev("localStorage.getItem('wgp.quancomtam.v1')");
  await pressSel('[data-act="restartYes"]');
  await sleep(800); await b.waitGame();
  await waitFor("!!document.querySelector('#app.ready')", 8000);
  check("desktop: chơi lại ⇒ bản cũ ở .backup, quán mới ngày 1", (await b.ev("localStorage.getItem('wgp.quancomtam.v1.backup')")) === keyBefore && (await S("s.day")) === 1 && (await b.ev("__game.overlay")) === "intro");
  // bản lưu hỏng ⇒ chép sang .corrupt, mở quán mới, không lỗi
  // ghi bản hỏng từ một trang khác cùng origin (trang game đang mở sẽ tự lưu khi rời trang)
  await b.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/games/quan-com-tam/data/asset-manifest.json` }); await sleep(400);
  await b.ev("localStorage.setItem('wgp.quancomtam.v1','{hỏng');localStorage.removeItem('wgp.quancomtam.v1.corrupt')");
  await b.nav(BASE);
  check("desktop: bản lưu hỏng được chép sang .corrupt, mở quán mới", (await b.ev("localStorage.getItem('wgp.quancomtam.v1.corrupt')")) === "{hỏng" && (await S("s.day")) === 1);
  }
  if (!process.env.SKIP_M3 && !part) await runM3A({ b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT, tag: "desktop" }); // A:
  if (!process.env.SKIP_M5V && part !== "1") await runM5V({ ...M5V, tag: "desktop" }); // V:
}

// ===== mobile 390×844 dpr 3, chạm ===== (DESKTOP_ONLY=1 bỏ qua; chạy tách hai lần cho vừa giới hạn thời gian)
if (!process.env.DESKTOP_ONLY) {
await b.view(390, 844, true, 3); await b.touch(true); press = b.tap;
if (process.env.M5V_ONLY) await runM5V({ b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT, tag: "mobile" }); // V:
else {
await playDay1("mobile", true);
if (!process.env.SKIP_M3) await runM3AMobile({ b, check, S, pressSel, waitFor, sleep, OUT, tag: "mobile" }); // A:
check("mobile: cảnh hệ số bội 0,5 thiết bị (390@3 ⇒ 1,0, thấy mọi bàn)", await b.ev("(()=>{const k=__game.sceneScale()*devicePixelRatio*2;return Math.abs(k-Math.round(k))<1e-6})()"), String(await b.ev("__game.sceneScale()")));
check("mobile: thấy đủ mọi bàn trong khung cảnh", await b.ev(`(()=>{const w=document.querySelector('#scene').getBoundingClientRect();return [...document.querySelectorAll('.tbtn-scene')].every(e=>{const r=e.getBoundingClientRect();return r.left>=w.left-2&&r.right<=w.right+2&&r.top>=w.top-2&&r.bottom<=w.bottom+2})})()`));
if (!process.env.SKIP_M5V) await runM5V({ b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT, tag: "mobile" }); // V:
}
}
const errs = b.errors.filter((e) => !/favicon\.ico/.test(e)); // favicon: chỉ do trang JSON phụ trong bước ghi bản lưu hỏng
check("0 lỗi console", errs.length === 0, errs.slice(0, 5).join(" | "));
b.close();
console.log(fails ? `\n${fails} FAIL` : "\nE2E ĐẠT");
process.exit(fails ? 1 : 0);
