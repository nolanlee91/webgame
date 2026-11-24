// S (M5): e2e lối chơi M5 (test/e2e.mjs gọi khi M5_ONLY=1 hoặc chạy đủ desktop). Nhảy cấp qua __game.setLevel, bấm nút thật trong bảng Chuẩn bị,
// chơi ca bằng bot trong trang (test/helpers.mjs botStep, cùng apply()).
// Cấp 11: mua vỉ chay riêng, menu chỉ cơm chay, ghim phiếu chay, xoay Thanh Bếp tới trang "Vỉ chay", chạm chip ⇒ đậu hũ lên vỉ chay, không dính mặn.
// Cấp 18 (quán): tab "Hội chợ · Thử thách" ⇒ thuê gian ⇒ ca tối thành đêm hội 4 phút (khách đi nhóm, giá +15%) ⇒ chốt ca có câu hội chợ.
// Cấp 20: nhận thử thách trên lịch ⇒ ca có thử thách ⇒ chốt ca ghi đạt / chưa đạt; Sổ · Huy hiệu liệt kê 14 huy hiệu.
export async function runM5(ctx) {
  const { b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT, tag, shots = true } = ctx;
  const shot = async (n) => { if (shots) await b.shot(`${OUT}/${tag}-m5-${n}.png`); };
  const installBot = () => b.ev(`(async()=>{const h=await import('./test/helpers.mjs?v=c5');window.__bot=(ms,cond)=>{const s=()=>__game.state;const r=h.seeded(23);for(let t=0;t<ms&&s().shift;t+=200){if(cond&&cond(s()))return true;h.botStep(s(),'good',r);if(!s().shift)break;if(cond&&cond(s()))return true;if(!s().shift.dialog)__game.act({type:'tick',dt:200},true)}const ov=__game.overlay;if(ov&&!['prep','summary','pause','intro'].includes(ov)&&!(s().shift&&s().shift.dialog))__game.overlays.close();return cond?cond(s()):!s().shift};return true})()`);
  const bot = (ms, cond = null) => b.ev(`window.__bot(${ms}, ${cond ? `(s)=>(${cond})` : "null"})`);
  const firstBatch = async () => { await pressSel('[data-tab="first"]'); for (const a of ["prepCook", "prepMoHanh", "prepLight"]) if (await at(`[data-act="${a}"]`)) await pressSel(`[data-act="${a}"]`); };
  const toNextDay = async () => {
    for (let i = 0; i < 3 && !(await S("s.dayDone")); i++) {
      if (await b.ev("__game.overlay==='summary'")) { if (await at('[data-act="toBreak"]')) { await pressSel('[data-act="toBreak"]'); await pressSel("#openShop"); await installBot(); await bot(600000); } }
    }
    await waitFor("__game.overlay==='summary'", 6000);
    if (await at('[data-act="nextDay"]')) await pressSel('[data-act="nextDay"]');
    await waitFor("__game.overlay==='prep'", 6000);
    await clearDrama();
  };
  // sự kiện Drama giữa hai ngày (Chuẩn bị): chọn lựa chọn bấm được, Tiếp, Xong
  const clearDrama = async () => {
    for (let k = 0; k < 8; k++) {
      await sleep(150);
      if (!(await b.ev("__game.dramaOpen"))) return;
      if (await at("#drama .choice:not(:disabled)")) await pressSel("#drama .choice:not(:disabled)");
      else if (await at('#drama [data-act="eventNext"]')) await pressSel('#drama [data-act="eventNext"]');
      else if (await at('#drama [data-act="eventDone"]')) await pressSel('#drama [data-act="eventDone"]');
    }
  };

  // ---- ván mới, cấp 11: vỉ chay riêng ----
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300);
  await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
  await b.nav(BASE);
  await pressSel("#introGo");
  await waitFor("__game.overlay==='prep'");
  await b.ev("__game.setLevel(11); __game.addMoney(4000)");
  await pressSel('[data-tab="gear"]');
  for (const id of ["steamer", "veg-grill"]) await pressSel(`[data-gear="${id}"]`);
  check(`${tag}: M5: mua vỉ nướng chay riêng ở Đồ nghề`, await S(`!!s.owned["veg-grill"]`));
  // menu: tắt hết, chỉ bán cơm chay (nút Tắt món thật)
  await pressSel('[data-tab="menu"]');
  for (let i = 0; i < 8; i++) {
    const id = await S(`(s.menu.find(x=>x!=="com-chay"&&!__game.dishes[x].special)||null)`);
    if (!id || !(await S(`s.menu.includes("com-chay")`))) break;
    await pressSel(`[data-dish="${id}"]`);
  }
  check(`${tag}: M5: tab Menu tắt được món (còn mỗi cơm chay)`, (await S("s.menu.filter(x=>!__game.dishes[x].special).join()")) === "com-chay", await S("s.menu.join()"));
  await pressSel('[data-tab="buy"]'); await pressSel('[data-act="restockToday"]');
  await b.ev("Object.assign(__game.state.stock,{'dau-hu':Math.max(__game.state.stock['dau-hu'],10),'bi-chay':Math.max(__game.state.stock['bi-chay'],10),'cha-chay':Math.max(__game.state.stock['cha-chay'],10),'nuoc-tuong':Math.max(__game.state.stock['nuoc-tuong'],10)})");
  await firstBatch();
  await pressSel("#openShop");
  check(`${tag}: M5: ca có vỉ chay (2 chỗ sau bếp 1)`, await waitFor("!!__game.state.shift") && (await S("s.shift.grill.vegFrom")) === 6 && (await S("s.shift.grill.slots.length")) === 8);
  await installBot();
  // chờ tới khi có phiếu chay, ghim bằng phiếu thật
  const gotTk = await bot(260000, "s.shift.tickets.some(t=>(t.status==='open'||t.status==='pinned')&&t.dish==='com-chay')&&!s.shift.dialog");
  // dọn vỉ bếp 1 để chắc chạm vào vỉ chay là chỗ trống
  if (gotTk) {
    for (let i = 0; i < 40 && !(await b.ev("__game.ownerFree()")); i++) await b.ev("__game.advance(300)");
    const tk = await S("(s.shift.tickets.find(t=>(t.status==='open'||t.status==='pinned')&&t.dish==='com-chay')||{}).id");
    await b.ev(`(()=>{const sl=__game.state.shift.slots[__game.state.shift.sel];if(sl.plate&&sl.tk!==${tk})__game.act({type:'discard'});})()`);
    if (await at(`.slip[data-tk="${tk}"]`)) await pressSel(`.slip[data-tk="${tk}"]`);
    // xoay Thanh Bếp tới trang vỉ chay
    for (let i = 0; i < 3 && !(await b.ev(`(document.querySelector('[data-act="grill2"]')||{}).textContent?.includes('vỉ chay')`)); i++) await pressSel('[data-act="grill2"]');
    check(`${tag}: M5: Thanh Bếp có trang "Vỉ chay" (2 chip)`, await b.ev(`(()=>{const v=[...document.querySelectorAll('.gchip')].filter(e=>!e.hidden&&!e.closest('[hidden]'));return v.length===2})()`), await b.ev(`[...document.querySelectorAll('.gchip')].filter(e=>!e.hidden).length`));
    await shot("01-vi-chay");
    await b.ev("__game.state.shift.grill.slots[6]=null");
    await pressSel('.gchip[data-slot="0"]');
    check(`${tag}: M5: chạm chip vỉ chay ⇒ đậu hũ lên vỉ chay, không dính mặn`, (await S("s.shift.grill.slots[6]&&s.shift.grill.slots[6].item")) === "dau-hu" && !(await S("s.shift.grill.slots[6].tainted")), await S("JSON.stringify(s.shift.grill.slots[6])"));
    for (let i = 0; i < 3 && !(await b.ev(`(document.querySelector('[data-act="grill2"]')||{}).textContent?.includes('bếp 1')`)); i++) await pressSel('[data-act="grill2"]');
  } else check(`${tag}: M5: có phiếu cơm chay trong ca`, false);
  await bot(600000);
  await toNextDay();

  // ---- cấp 18 ở quán: hội chợ ----
  await b.ev("__game.setLevel(18); __game.addMoney(3000)");
  await clearDrama();
  await pressSel('[data-tab="gear"]');
  if (await at('[data-act="rentQuan"]')) await pressSel('[data-act="rentQuan"]');
  check(`${tag}: M5: lên quán (thuê mặt bằng)`, (await S("s.stage")) === "quan");
  await pressSel('[data-tab="menu"]');
  for (const id of ["com-suon", "com-suon-bi"]) if (await at(`[data-dish="${id}"]`) && !(await S(`s.menu.includes("${id}")`))) await pressSel(`[data-dish="${id}"]`);
  await pressSel('[data-tab="fair"]');
  check(`${tag}: M5: tab Hội chợ · Thử thách có thẻ hội chợ + lịch thử thách`, await waitFor(`!!document.querySelector('[data-s="fair"]')&&!!document.querySelector('[data-s="challenge"]')`, 3000));
  const m0 = await S("s.money");
  await pressSel('[data-act="fair"]');
  check(`${tag}: M5: thuê gian hội chợ (trừ tiền, ghi ngày)`, (await S("s.fair&&s.fair.day===s.day")) && (await S("s.money")) === m0 - 180, `${m0} → ${await S("s.money")}`);
  await shot("02-hoi-cho");
  await b.ev("__game.act({type:'setPlan',kinds:['toi']})");
  await pressSel('[data-tab="buy"]'); await pressSel('[data-act="restockToday"]');
  await b.ev("Object.assign(__game.state.stock,{'suon-uop':Math.max(__game.state.stock['suon-uop'],30),bi:Math.max(__game.state.stock.bi,20),'gao-tam':Math.max(__game.state.stock['gao-tam'],40)})");
  await firstBatch();
  await pressSel("#openShop");
  check(`${tag}: M5: ca tối thành đêm hội (4 phút, khách đi nhóm 2–4)`, await waitFor("!!__game.state.shift") && (await S("s.shift.fair&&s.shift.len===240000&&s.shift.schedule.filter(g=>g.tag==='fair').every(g=>g.roles.length>=2&&g.roles.length<=4)")));
  await installBot();
  await bot(140000, "s.shift.tickets.some(t=>t.fairMul)");
  check(`${tag}: M5: phiếu hội chợ giá +15%`, await S("s.shift.tickets.filter(t=>t.gid!==null).every(t=>t.fairMul===1.15)"));
  await bot(700000);
  check(`${tag}: M5: chốt ca hội chợ có câu đêm hội`, await waitFor("__game.overlay==='summary'", 6000) && (await waitFor(`!!document.querySelector('[data-s="fair-done"]')`, 3000)), await S("JSON.stringify(s.lastSummary&&{fair:s.lastSummary.fair,line:s.lastSummary.fairLine})"));
  await shot("03-chot-hoi-cho");
  await toNextDay();

  // ---- cấp 20: thử thách ----
  await b.ev("__game.setLevel(20); __game.addMoney(2000)");
  await clearDrama();
  await pressSel('[data-tab="fair"]');
  const cid = await S("['mot-bep','khong-chay','trua-khong-phu','toan-mang-ve','mam-40'][s.day%5]");
  await pressSel('[data-act="challenge"]');
  check(`${tag}: M5: nhận thử thách trên lịch (${cid})`, (await S("s.challenge&&s.challenge.day===s.day&&s.challenge.id")) === cid);
  await shot("04-thu-thach");
  await pressSel('[data-tab="buy"]'); await pressSel('[data-act="restockToday"]');
  await b.ev("Object.assign(__game.state.stock,{'suon-uop':Math.max(__game.state.stock['suon-uop'],40),'gao-tam':Math.max(__game.state.stock['gao-tam'],50),hop:Math.max(__game.state.stock.hop,40)})");
  await firstBatch();
  await pressSel("#openShop");
  await waitFor("!!__game.state.shift");
  await installBot();
  let judged = false;
  for (let k = 0; k < 3 && !judged; k++) {
    await bot(700000);
    await waitFor("__game.overlay==='summary'", 6000);
    judged = await waitFor(`!!document.querySelector('[data-s="challenge-done"]')`, 2000);
    if (!judged && (await at('[data-act="toBreak"]'))) { await pressSel('[data-act="toBreak"]'); await pressSel("#openShop"); await waitFor("!!__game.state.shift"); await installBot(); }
  }
  check(`${tag}: M5: chốt ca thử thách ghi đạt / chưa đạt`, judged && (await S(`!!s.lastSummary.challenge&&s.lastSummary.challenge.id===${JSON.stringify(cid)}`)), await S("JSON.stringify(s.lastSummary.challenge)"));
  await shot("05-chot-thu-thach");
  // Sổ · Huy hiệu
  await toNextDay();
  await b.ev("__game.overlays.book(__game.state, 'badges')");
  await waitFor(`!!document.querySelector('#sheet [data-tab="badges"].on')`, 3000);
  check(`${tag}: M5: Sổ · Huy hiệu liệt kê 14 huy hiệu (có huy hiệu Chủ Quán)`, await waitFor(`document.querySelectorAll('[data-badge]').length===14`, 3000) && (await S("!!s.badges['chu-quan']")), await b.ev("document.querySelectorAll('[data-badge]').length"));
  await shot("06-huy-hieu");
}
