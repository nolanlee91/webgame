// A: e2e M3 tiến trình + kinh tế (test/e2e.mjs gọi sau phần desktop / mobile ngày 1). Nhảy cấp qua __game.setLevel, mua đồ / chọn ca / nhận đơn /
// thuê mặt bằng / thuê Bông / kéo thả trang trí bằng nút thật trong bảng Chuẩn bị; chơi ca bằng bot trong trang (test/helpers.mjs botStep, cùng apply()).
// Desktop: cấp 6 → ca trưa + ca tối, ghi sổ (nút trên phiếu tính tiền), chơi lại ngày hôm nay (xác nhận + .before-replay) → cấp 7 thuê mặt bằng
// lên quán (cảnh quan-scene, 3 bàn) → cấp 10: ô bày đôi + khay, nhận mâm cơm, thuê Bông, ca có mâm (bày ×N) → trang trí kéo thả.
// Mobile: chụp quán + bảng Chuẩn bị tab mới ở 390@3.
export async function runM3A(ctx) {
  const { b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT, tag, shots = true } = ctx;
  const shot = async (n) => { if (shots) await b.shot(`${OUT}/${tag}-m3-${n}.png`); };
  const installBot = () => b.ev(`(async()=>{const h=await import('./test/helpers.mjs?v=c1');window.__bot=(ms,cond)=>{const s=()=>__game.state;const r=h.seeded(17);for(let t=0;t<ms&&s().shift;t+=200){if(cond&&cond(s()))return true;h.botStep(s(),'good',r);if(!s().shift)break;if(cond&&cond(s()))return true;if(!s().shift.dialog)__game.act({type:'tick',dt:200},true)}const ov=__game.overlay;if(ov&&!['prep','summary','pause','intro'].includes(ov)&&!(s().shift&&s().shift.dialog))__game.overlays.close();return cond?cond(s()):!s().shift};return true})()`);
  const bot = (ms, cond = null) => b.ev(`window.__bot(${ms}, ${cond ? `(s)=>(${cond})` : "null"})`);

  // ---- ván mới, cấp 6 ----
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300);
  await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
  await b.nav(BASE);
  await pressSel("#introGo");
  await waitFor("__game.overlay==='prep'");
  await b.ev("__game.setLevel(6); __game.addMoney(1500)");
  await pressSel('[data-tab="gear"]');
  for (const id of ["egg-pan", "steamer", "takeaway-shelf", "ban-3", "ban-4", "soup-pot"]) await pressSel(`[data-gear="${id}"]`);
  check(`${tag}: mua đồ bằng nút Đồ nghề (chảo, xửng, kệ mang về, bàn 3, bàn 4, nồi canh)`, await S(`["egg-pan","steamer","takeaway-shelf","ban-3","ban-4","soup-pot"].every(k=>s.owned[k])`));
  check(`${tag}: món mới tự vào menu (đặc biệt, bì chả)`, await S(`s.menu.includes("dac-biet")&&s.menu.includes("com-bi-cha")`), await S("s.menu.join()"));
  await pressSel('[data-tab="shift"]');
  await pressSel('[data-plan="trua+toi"]');
  check(`${tag}: chọn ca ở Chuẩn bị: cả trưa + tối`, (await S("s.plan.join('+')")) === "trua+toi");
  await shot("01-chon-ca");
  await pressSel('[data-tab="buy"]'); await pressSel('[data-act="restockToday"]');
  // kho vỉa hè 80 phần chật khi mới nhảy cấp (còn gói học ngày 1): bù chả / bì / trứng cho bot (không qua nút)
  await b.ev("Object.assign(__game.state.stock,{cha:Math.max(__game.state.stock.cha,16),bi:Math.max(__game.state.stock.bi,16),trung:Math.max(__game.state.stock.trung,12),'suon-uop':Math.max(__game.state.stock['suon-uop'],20)})");
  await pressSel('[data-tab="first"]');
  for (const a of ["prepCook", "prepMoHanh", "prepLight"]) if (await at(`[data-act="${a}"]`)) await pressSel(`[data-act="${a}"]`);
  await pressSel("#openShop");
  const dayMoney = await b.ev("(JSON.parse(localStorage.getItem('wgp.quancomtam.v1.day')||'{}').money)");
  check(`${tag}: mở ca trưa (dân văn phòng), cờ lunch-today`, await waitFor("!!__game.state.shift") && (await S("s.shift.kind")) === "trua" && (await S("s.flags['lunch-today']===s.day")));
  check(`${tag}: chảo + xửng có nút trên Thanh Bếp`, await b.ev(`!!document.querySelector('[data-act="egg"]:not([hidden])')&&!!document.querySelector('[data-act="steam"]:not([hidden])')`));
  check(`${tag}: nhiệm vụ ngày hiện trong cột việc`, await waitFor("document.querySelectorAll('.a-missions [data-mission]').length===3", 3000));
  // bàn đầu tiên gọi tính tiền: coi như khách quen xin ghi sổ (xin hay không là hên xui 40%, ở đây ép để bấm nút thật)
  await installBot();
  let ghiSoDone = false;
  const tryGhiSo = async (ms) => {
    if (ghiSoDone) return;
    const gotBill = await bot(ms, "s.shift&&s.shift.billing&&!s.shift.groups.find(g=>g.id===s.shift.billing.gid).takeaway");
    if (!gotBill) return;
    await b.ev(`(()=>{const b=__game.state.shift.billing;const g=__game.state.shift.groups.find(x=>x.id===b.gid);g.members[0].role='regular';if(!b.ghiSo)b.ghiSo={id:'x',name:g.members[0].name,amount:b.lines.filter(l=>l.real).reduce((a,l)=>a+l.price,0)}})()`);
    await sleep(150);
    await shot("02-ghi-so");
    await pressSel('[data-act="ghiSoYes"]');
    ghiSoDone = true;
    check(`${tag}: ghi sổ bằng nút trên phiếu tính tiền ⇒ sổ nợ + cờ ghiso-open`, (await S("s.debts.length")) === 1 && (await S("s.flags['ghiso-open']")) === 1, await S("JSON.stringify(s.debts)"));
  };
  await tryGhiSo(150000);
  await shot("03-ca-trua");
  await bot(400000);
  check(`${tag}: chốt ca trưa`, await waitFor("__game.overlay==='summary'", 6000) && (await S("s.lastSummary.kind")) === "trua");
  await pressSel('[data-act="toBreak"]');
  await pressSel("#openShop");
  check(`${tag}: nghỉ giữa ca ⇒ mở ca tối`, await waitFor("!!__game.state.shift") && (await S("s.shift.kind")) === "toi");
  await installBot();
  await tryGhiSo(200000);
  check(`${tag}: có bàn xin ghi sổ trong ngày`, ghiSoDone);
  await bot(500000);
  check(`${tag}: chốt ngày (ca tối)`, await waitFor("__game.overlay==='summary'", 6000) && (await S("s.dayDone")));
  await shot("04-chot-ngay");
  // ---- chơi lại ngày hôm nay ----
  check(`${tag}: chốt ngày có nút Chơi lại ngày hôm nay`, !!(await at('[data-act="replay"]')));
  await pressSel('[data-act="replay"]');
  check(`${tag}: chơi lại ngày hỏi xác nhận`, await waitFor("__game.overlay==='confirm-replay'"));
  await pressSel('[data-act="replayYes"]');
  await sleep(900); await b.waitGame(); await waitFor("!!document.querySelector('#app.ready')", 8000);
  const rp = await S("JSON.stringify({debts:s.debts.length,money:s.money,done:s.dayDone})").then(JSON.parse);
  const bk = await b.ev("(()=>{try{const d=JSON.parse(localStorage.getItem('wgp.quancomtam.v1.before-replay'));return {done:d.dayDone,debts:(d.debts||[]).length}}catch{return null}})()");
  check(`${tag}: chơi lại ⇒ về ảnh đầu ngày (chưa ghi sổ, tiền đầu ngày), bản cũ (đã chốt ngày, có sổ nợ) ở .before-replay`, rp.debts === 0 && rp.money === dayMoney && !rp.done && bk?.done === true && bk.debts === 1, JSON.stringify({ rp, dayMoney, bk }));
  if (await b.ev("__game.overlay==='summary'")) await pressSel('[data-act="nextDay"]');
  // Chơi lại ngày hôm nay cũng có ở Cách chơi
  await waitFor("__game.overlay==='prep'", 4000);
  await b.ev("document.querySelector('#helpBtn').click()");
  check(`${tag}: Cách chơi có Chơi lại ngày hôm nay`, await waitFor(`!!document.querySelector('#sheet [data-act="replay"]')`, 3000));
  await pressSel('[data-act="helpClose"]');

  // ---- cấp 7: thuê mặt bằng lên quán ----
  await b.ev("__game.setLevel(7); __game.addMoney(400)");
  await b.ev("__game.overlays.prep(__game.state, 'gear')");
  await waitFor("__game.overlay==='prep'");
  await shot("05-thue-mat-bang");
  await pressSel('[data-act="rentQuan"]');
  check(`${tag}: thuê mặt bằng ⇒ lên quán, cờ quan-moved, kỷ niệm vỉa hè`, (await S("s.stage")) === "quan" && (await S("s.flags['quan-moved']===s.day")) && (await S("!!s.streetMemory")));
  check(`${tag}: cảnh quán (quan-scene) vẽ qua atlas`, await waitFor(`(()=>{const i=document.querySelector('.stage img[data-layer="quan"]');return !!i&&i.complete&&i.naturalWidth===1280})()`, 6000));
  check(`${tag}: quán có 3 bàn (2 bàn 2 + 1 bàn 4)`, await b.ev("document.querySelectorAll('.tbtn-scene').length") === 3);

  // ---- cấp 10: ô bày đôi + khay, mâm cơm, Bông ----
  await b.ev("__game.setLevel(10); __game.addMoney(3000)");
  await b.ev("__game.overlays.prep(__game.state, 'gear')");
  for (const id of ["double-slot", "tray-4", "q-table-4"]) await pressSel(`[data-gear="${id}"]`);
  await pressSel('[data-staff="bong"]');
  check(`${tag}: thuê Bông hôm nay (cờ helper-bong)`, await S("s.staff.bong===s.day&&s.flags['helper-bong']===s.day"));
  await pressSel('[data-tab="shift"]'); await pressSel('[data-plan="toi"]');
  await pressSel('[data-tab="orders"]');
  const ci = await S("s.offers.list.findIndex(o=>o.kind==='catering')");
  check(`${tag}: tab Đơn đặt có mâm cơm công ty`, ci >= 0);
  await shot("06-don-dat");
  await pressSel(`[data-offer="${ci}"]`);
  check(`${tag}: nhận mâm cơm ⇒ cọc 30%`, (await S("s.orders.length")) === 1 && (await S("s.orders[0].deposit")) > 0);
  await pressSel('[data-tab="buy"]'); await pressSel('[data-act="restockToday"]');
  await b.ev("__game.state.stock.hop = Math.max(__game.state.stock.hop, 40)");
  await pressSel('[data-tab="first"]');
  for (const a of ["prepCook", "prepMoHanh", "prepLight"]) if (await at(`[data-act="${a}"]`)) await pressSel(`[data-act="${a}"]`);
  await pressSel("#openShop");
  check(`${tag}: ca ở quán có phiếu mâm cơm, 4 bàn, Bông, 2 ô bày`, await waitFor("!!__game.state.shift") && (await S("s.shift.tickets.some(t=>t.catering)&&s.shift.tables.length===4&&!!s.shift.helper&&s.shift.slots.length===2")));
  const ctk = await S("s.shift.tickets.find(t=>t.catering).id");
  for (let i = 0; i < 40 && !(await b.ev("__game.ownerFree()")); i++) await b.ev("__game.advance(300)");
  await pressSel(`.slip[data-tk="${ctk}"]`);
  await pressSel('[data-layer="dia"]');
  check(`${tag}: bày ×N: một chạm lấy 4 hộp cho mâm cơm`, (await S("1+(s.shift.slots[s.shift.sel].batch||[]).length")) === 4);
  await pressSel('[data-layer="com"]');
  await shot("07-bay-mam");
  await installBot();
  await bot(120000, "s.shift&&s.shift.groups.some(g=>g.phase==='seated')");
  await bot(40000);
  await shot("08-quan-trong-ca");
  await bot(600000);
  check(`${tag}: chốt ca ở quán có mâm cơm`, await waitFor("__game.overlay==='summary'", 6000) && (await S("(s.lastSummary.orders||[]).length")) === 1, await S("JSON.stringify(s.lastSummary.orders)"));
  check(`${tag}: Bông làm việc trong ca, lương trả lúc chốt`, (await S("s.lastSummary.helperJobs")) > 0 && (await S("s.lastSummary.staff")) >= 40, await S("JSON.stringify({j:s.lastSummary.helperJobs,w:s.lastSummary.staff})"));
  await pressSel('[data-act="nextDay"]');

  // ---- trang trí kéo thả ----
  await waitFor("__game.overlay==='prep'");
  await pressSel('[data-tab="decor"]');
  await pressSel('[data-decor-buy="banana-plant"]');
  await pressSel('[data-decor-buy="red-lantern"]');
  const pin = await at('.a-drag [data-decor="red-lantern"]');
  const box = await b.ev("(()=>{const r=document.querySelector('.a-drag').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()");
  if (pin && box) {
    const tx = box[0] + box[2] * (980 / 1280), ty = box[1] + box[3] * (180 / 720);
    await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: pin[0], y: pin[1], button: "left", clickCount: 1 });
    for (let i = 1; i <= 6; i++) await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pin[0] + ((tx - pin[0]) * i) / 6, y: pin[1] + ((ty - pin[1]) * i) / 6, button: "left", buttons: 1 });
    await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: tx, y: ty, button: "left", clickCount: 1 });
    await sleep(200);
  }
  const placed = await S("JSON.stringify(s.placement['red-lantern']||null)");
  check(`${tag}: kéo thả đèn lồng lên tường quán`, placed !== "null", placed);
  await shot("09-trang-tri");
  check(`${tag}: trang trí vẽ trong cảnh quán`, await b.ev("document.querySelectorAll('.stage .decor').length") >= 2);
}

/** Mobile 390@3: chụp quán + tab mới (đã có bản lưu cấp 10 ở quán từ phần desktop thì dùng lại, không thì tạo nhanh). */
export async function runM3AMobile(ctx) {
  const { b, check, S, pressSel, waitFor, sleep, OUT, tag } = ctx;
  await b.ev("__game.setLevel(10); __game.addMoney(1500)");
  if ((await S("s.stage")) !== "quan") { await b.ev("__game.overlays.prep(__game.state, 'gear')"); await pressSel('[data-act="rentQuan"]'); }
  await b.ev("__game.overlays.prep(__game.state, 'orders')");
  await waitFor("__game.overlay==='prep'");
  await b.shot(`${OUT}/${tag}-m3-01-don-dat.png`);
  check(`${tag}: tab Đơn đặt hiện ở 390`, await b.ev("!!document.querySelector('[data-tab=\"orders\"]')"));
  await pressSel('[data-tab="gear"]');
  if (await S("s.staff.bong!==s.day")) await pressSel('[data-staff="bong"]');
  await pressSel('[data-tab="buy"]'); await pressSel('[data-act="restockToday"]');
  await pressSel('[data-tab="first"]');
  for (const a of ["prepCook", "prepMoHanh", "prepLight"]) await b.ev(`(()=>{const e=document.querySelector('[data-act="${a}"]');if(e&&!e.disabled)e.click()})()`);
  await pressSel("#openShop");
  await waitFor("!!__game.state.shift");
  await b.ev(`(async()=>{const h=await import('./test/helpers.mjs?v=c1');const r=h.seeded(3);for(let t=0;t<70000&&__game.state.shift;t+=200){h.botStep(__game.state,'good',r);if(__game.state.shift&&!__game.state.shift.dialog)__game.act({type:'tick',dt:200},true)}})()`);
  await sleep(300);
  await b.shot(`${OUT}/${tag}-m3-02-quan-trong-ca.png`);
  check(`${tag}: cảnh quán trong ca ở 390 (có Bông)`, (await S("!!s.shift&&s.stage==='quan'&&!!s.shift.helper")) && (await b.ev("!!document.querySelector('.stage .helper:not([hidden])')")));
  check(`${tag}: không tràn ngang`, await b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth"));
}
