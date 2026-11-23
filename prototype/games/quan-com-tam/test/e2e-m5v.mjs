// V: e2e M5 hình + tiếng (test/e2e.mjs gọi; M5V_ONLY=1 chỉ chạy phần này). Kiểm:
// - âm thanh: trước thao tác đầu không tạo AudioContext, không tải file; sau thao tác thì tải + phát (gián điệp AudioBufferSourceNode.start);
//   nút Tiếng 3 trạng thái (bật hết → chỉ hiệu ứng → tắt bằng wgp.muted → bật hết); vòng lặp bếp than chỉ khi bếp nhóm; không file nào lỗi.
// - ảnh đợt 2: bếp lớn HD (grill-hd + grill-items-hd), dĩa HD (plate-layers-hd), chân dung Drama HD, vật dụng quán (fixtures) ×1, lớp thời tiết khi mưa.
// - quán đông: không khách nào đè vùng đầu khách khác; 4 nhóm chờ ở cửa: nhãn + bong bóng không chồng nhau.
const SPY = `(()=>{if(window.__spy)return;const s=window.__spy={ctx:0,start:0,loops:0};const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const st=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){s.start++;if(this.loop)s.loops++;return st.apply(this,a)};
  const W=function(...a){s.ctx++;return new AC(...a)};W.prototype=AC.prototype;window.AudioContext=W;if(window.webkitAudioContext)window.webkitAudioContext=W;})()`;
const audioReq = (b) => b.ev("JSON.stringify(performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.includes('/assets/audio/')).map(n=>n.split('/').pop().split('?')[0]))").then(JSON.parse);

/** Ván mới ở quán đông: cấp 16, đủ bàn, ghế chờ, bảng hiệu, tủ kính, kệ mang về; mở ca tối rồi dồn khách cho kín bàn + 4 nhóm đứng chờ. */
export async function crowdQuan(ctx, { bench = true } = {}) {
  const { b, S, pressSel, waitFor, sleep, BASE, PORT } = ctx;
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300);
  await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
  await b.nav(BASE);
  await pressSel("#introGo");
  await waitFor("__game.overlay==='prep'");
  await b.ev("__game.setLevel(16); __game.addMoney(6000)");
  await b.ev("__game.overlays.prep(__game.state, 'gear')");
  await waitFor("__game.overlay==='prep'");
  await pressSel('[data-act="rentQuan"]');
  for (const id of ["q-table-4", "q-table-5", "glass-case", "takeaway-shelf", "signboard-2", "signboard-3", ...(bench ? ["queue-bench"] : [])]) {
    await b.ev("__game.overlays.prep(__game.state, 'gear')");
    await b.ev(`(()=>{const e=document.querySelector('[data-gear="${id}"]');if(e&&!e.disabled)e.click()})()`);
  }
  await b.ev("__game.overlays.prep(__game.state, 'buy')");
  await pressSel('[data-act="restockToday"]');
  await b.ev("Object.assign(__game.state.stock,{cha:40,bi:40,trung:30,'suon-uop':60,than:30,'gao-tam':60,tra:60})");
  await pressSel('[data-tab="first"]');
  for (const a of ["prepCook", "prepMoHanh", "prepLight"]) await b.ev(`(()=>{const e=document.querySelector('[data-act="${a}"]');if(e&&!e.disabled)e.click()})()`);
  await pressSel("#openShop");
  await waitFor("!!__game.state.shift");
  // dồn lịch khách: mọi nhóm ăn tại chỗ tới ngay, mời ngồi đủ bàn (qua apply), phần còn lại đứng chờ
  await b.ev(`(()=>{const sh=__game.state.shift;let k=0;for(const g of sh.schedule){if(!g.done&&!/shipper/.test(g.arch||'')){g.at=sh.t+100+k*120;k++}}})()`);
  for (let i = 0; i < 60; i++) {
    for (let k = 0; k < 8 && ((await S("!!(s.shift&&s.shift.dialog)")) || (await b.ev("__game.dramaOpen"))); k++) { // hội thoại bật giữa chừng: bấm lựa chọn đầu / Tiếp / Xong
      await b.ev(`(()=>{const q=(x)=>{const e=document.querySelector(x);if(e&&!e.disabled&&!e.closest('[hidden]')){e.click();return true}return false};q('#drama [data-act="eventDone"]')||q('#drama [data-act="eventNext"]')||q('#drama .choice:not(:disabled)')||q('#sheet .choice:not(:disabled)')})()`);
      await sleep(150);
    }
    await b.ev("__game.advance(400)");
    await b.ev(`(()=>{const sh=__game.state.shift;for(const g of sh.groups.filter(x=>x.phase==='wait')){const t=sh.tables.find(x=>x.gid===null&&x.state!=='dirty'&&x.seats>=g.size&&!x.joinOf);if(t)__game.act({type:'seat',gid:g.id,tid:t.id},true)}})()`);
    const full = await S("s.shift.tables.every(t=>t.gid!==null||t.joinOf)");
    if (full && (await S("s.shift.groups.filter(g=>g.phase==='wait').length")) >= 3) break;
  }
  // thêm khách lẻ để đủ 4 nhóm đứng chờ (ghế chờ: 4 chỗ)
  await b.ev(`(()=>{const sh=__game.state.shift;const one=sh.schedule.find(g=>g.roles.length===1&&!/shipper/.test(g.arch||''))||sh.schedule.find(g=>!/shipper/.test(g.arch||''));for(let k=0;k<4;k++)sh.schedule.push({...JSON.parse(JSON.stringify(one)),roles:[one.roles[0]],done:false,retry:0,at:sh.t+100+k*150,tag:undefined})})()`);
  for (let i = 0; i < 10 && (await S("s.shift.groups.filter(g=>g.phase==='wait'||g.phase==='enter').length")) < 4; i++) await b.ev("__game.advance(400)");
  // khách đã ngồi xong (hết đoạn đi tới ghế), các nhóm chờ đứng yên ở chỗ chờ
  for (let i = 0; i < 12 && (await S("s.shift.groups.some(g=>g.phase==='toTable'||g.phase==='enter')")); i++) await b.ev("__game.advance(400)");
  await b.ev("(()=>{const sh=__game.state.shift;for(const g of sh.groups)g.patienceMs=Math.max(g.patienceMs||0,600000)})()");
  await sleep(300);
}

/** Chồng vùng đầu: hộp hữu hình thật của từng khách (quét alpha của frame trên sheet), vùng đầu = 30% trên của hộp, bỏ 30% mỗi bên.
 *  Khách vẽ sau (z cao hơn) không được đè vùng đầu khách vẽ trước. */
const HEAD_OVERLAP = `(async()=>{const cache=window.__alpha=window.__alpha||{};
  const sheet=async(url)=>{if(cache[url])return cache[url];const im=new Image();im.src=url;await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);return cache[url]={w:c.width,d:g.getImageData(0,0,c.width,c.height).data}};
  const els=[...document.querySelectorAll('.stage .spr.cust')].filter(e=>!e.hidden&&+getComputedStyle(e).opacity>0.5&&/url/.test(e.style.backgroundImage));
  const out=[];
  for(const e of els){const url=e.style.backgroundImage.replace(/^url[(]["']?/,'').replace(/["']?[)]$/,'');const S=await sheet(new URL(url,location.href).href);
    const bw=parseFloat(e.style.backgroundSize),k=bw/S.w,[px,py]=e.style.backgroundPosition.split(' ').map(parseFloat);
    const fx=Math.round(-px/k),fy=Math.round(-py/k),fw=Math.round(parseFloat(e.style.width)/k),fh=Math.round(parseFloat(e.style.height)/k);
    let x0=fw,y0=fh,x1=0,y1=0;for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){if(S.d[((fy+y)*S.w+fx+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
    const r=e.getBoundingClientRect(),fl=e.classList.contains('flip');const ax0=fl?fw-1-x1:x0,ax1=fl?fw-1-x0:x1;
    out.push({key:e.dataset.key,phase:e.dataset.phase,z:+e.style.zIndex||0,x0:r.left+r.width*ax0/fw,x1:r.left+r.width*(ax1+1)/fw,y0:r.top+r.height*y0/fh,y1:r.top+r.height*(y1+1)/fh});}
  const bad=[];
  for(const a of out)for(const c of out){if(a===c||c.z<=a.z)continue;
    const hw=(a.x1-a.x0)*.3,head={x0:a.x0+hw,x1:a.x1-hw,y0:a.y0,y1:a.y0+(a.y1-a.y0)*.3};
    const ix=Math.min(head.x1,c.x1)-Math.max(head.x0,c.x0),iy=Math.min(head.y1,c.y1)-Math.max(head.y0,c.y0);
    if(ix>2&&iy>2)bad.push(a.key+'('+a.phase+')<'+c.key+'('+c.phase+') '+Math.round(ix)+'x'+Math.round(iy));}
  return JSON.stringify({n:out.length,bad});})()`;

export async function runM5V(ctx) {
  const { b, check, S, pressSel, at, waitFor, sleep, OUT, BASE, PORT, tag } = ctx;
  const visible = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&!e.disabled&&e.getBoundingClientRect().width>0})()`);
  /** Đóng hội thoại Drama bằng nút thật: chọn lựa chọn đầu, Tiếp / Xong tới khi đóng. */
  const closeDrama = async () => {
    for (let i = 0; i < 6 && (await b.ev("__game.dramaOpen")); i++) {
      if (await visible('#drama [data-act="eventDone"]')) await pressSel('#drama [data-act="eventDone"]');
      else if (await visible('#drama [data-act="eventNext"]')) await pressSel('#drama [data-act="eventNext"]');
      else if (await visible("#drama .choice:not(:disabled)")) await pressSel("#drama .choice:not(:disabled)");
      await sleep(120);
    }
  };
  const shot = (n) => b.shot(`${OUT}/${tag}-m5-${n}.png`);
  // ---- âm thanh trước / sau thao tác đầu ----
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: SPY });
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300);
  await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
  await b.nav(BASE);
  await sleep(600);
  const req0 = await audioReq(b), spy0 = await b.ev("JSON.stringify(window.__spy)").then(JSON.parse), dbg0 = await b.ev("JSON.stringify(__game.sound())").then(JSON.parse);
  check(`${tag}: âm thanh — chưa thao tác: không AudioContext, không tải file, không phát`, req0.length === 0 && spy0.ctx === 0 && spy0.start === 0 && dbg0.ctx === null, JSON.stringify({ req0, spy0 }));
  await pressSel("#introGo"); // thao tác đầu
  await waitFor("__game.overlay==='prep'");
  await waitFor("__game.sound().ctx==='running'", 4000);
  await sleep(1200);
  const req1 = await audioReq(b);
  check(`${tag}: âm thanh — sau thao tác đầu: tạo AudioContext, tải hiệu ứng nhỏ + nhạc chuẩn bị + phố đêm, chưa tải nhạc cao điểm`,
    (await b.ev("window.__spy.ctx")) === 1 && req1.includes("pork-sizzle.mp3") && req1.includes("prep-music-loop.mp3") && req1.includes("riverside-night-loop.mp3") && !req1.includes("rush-music-loop.mp3"), req1.join(","));
  check(`${tag}: âm thanh — Chuẩn bị: vòng lặp nhạc + phố đêm đang chạy`, await waitFor("window.__spy.loops>=2&&__game.sound().loops.includes('prep-music-loop')", 4000), await b.ev("JSON.stringify(__game.sound())"));
  // phát hiệu ứng thật (qua thao tác): nhập hàng ⇒ tiếng tiền
  const st0 = await b.ev("window.__spy.start");
  await pressSel('[data-act="restockToday"]');
  await pressSel('[data-tab="first"]');
  for (const a of ["prepCook", "prepMoHanh", "prepLight"]) if (await at(`[data-act="${a}"]`)) await pressSel(`[data-act="${a}"]`);
  check(`${tag}: âm thanh — thao tác Chuẩn bị phát hiệu ứng (AudioBufferSourceNode.start)`, await waitFor(`window.__spy.start>${st0}`, 3000), String(await b.ev("window.__spy.start")));
  // nút 3 trạng thái
  const states = [];
  for (let i = 0; i < 3; i++) { await b.ev("document.querySelector('#muteBtn').click()"); await sleep(80); states.push(await b.ev("JSON.stringify([document.querySelector('#muteBtn').dataset.mode,localStorage.getItem('wgp.muted'),localStorage.getItem('qct.music')])")); }
  check(`${tag}: nút Tiếng 3 trạng thái (chỉ hiệu ứng → tắt bằng wgp.muted → bật hết)`, states[0].replace("null", '"0"') === '["sfx","0","0"]' && states[1] === '["off","1","0"]' && states[2] === '["all","0","1"]', states.join(" "));
  await b.ev("document.querySelector('#muteBtn').click()"); await sleep(300);
  check(`${tag}: chỉ hiệu ứng ⇒ nhạc dừng, phố đêm vẫn chạy`, await waitFor("!__game.sound().loops.includes('prep-music-loop')&&__game.sound().loops.includes('riverside-night-loop')", 3000), await b.ev("JSON.stringify(__game.sound().loops)"));
  await b.ev("document.querySelector('#muteBtn').click()"); await sleep(200);
  const offStart = await b.ev("window.__spy.start");
  await b.ev("__game.act({type:'buy',id:'than',n:1})");
  await sleep(300);
  check(`${tag}: tắt (wgp.muted) ⇒ không phát gì, ctx treo`, (await b.ev("window.__spy.start")) === offStart && (await b.ev("__game.sound().ctx")) !== "running", await b.ev("__game.sound().ctx"));
  await b.ev("document.querySelector('#muteBtn').click()"); await sleep(200);
  await pressSel("#openShop");
  await waitFor("!!__game.state.shift");
  await sleep(1400);
  const dbg = await b.ev("JSON.stringify(__game.sound())").then(JSON.parse);
  const req2 = await audioReq(b);
  check(`${tag}: trong ca: nhạc cao điểm + phố đêm + bếp than (bếp đã nhóm), mỗi file tải một lần`, dbg.loops.includes("rush-music-loop") && dbg.loops.includes("riverside-night-loop") && dbg.loops.includes("charcoal-grill-loop") && new Set(req2).size === req2.length, JSON.stringify({ loops: dbg.loops, req2 }));
  check(`${tag}: âm thanh — không file nào lỗi tải`, dbg.failed.length === 0, dbg.failed.join(","));
  // ---- thời tiết ở vỉa hè ----
  await b.ev("(()=>{const s=__game.state;s.weather={day:s.day,kind:'rain'}})()");
  await sleep(400);
  const wx = await b.ev(`(()=>{const r=[...document.querySelectorAll('.stage .wx-rain:not([hidden])')];return JSON.stringify({rain:r.length,img:r[0]&&r[0].style.backgroundImage,w:r[0]&&Math.round(r[0].getBoundingClientRect().width/__game.sceneScale()),flood:!!document.querySelector('.stage .wx-flood:not([hidden])')})})()`).then(JSON.parse);
  check(`${tag}: trời mưa ở vỉa hè ⇒ lớp mưa weather-fx phủ cảnh (×2 = 1280) + nước ngập`, wx.rain === 1 && /weather-fx\.webp/.test(wx.img) && wx.w === 1280 && wx.flood, JSON.stringify(wx));
  await shot("00-mua-via-he");
  await b.ev("(()=>{const s=__game.state;s.weather={day:s.day,kind:'clear'}})()");
  await sleep(200);
  check(`${tag}: hết mưa ⇒ tắt lớp mưa`, await b.ev("!document.querySelector('.stage .wx-rain:not([hidden])')&&!document.querySelector('.stage .wx-flood:not([hidden])')"));

  // ---- quán đông ----
  await crowdQuan(ctx);
  const cnt = await S("JSON.stringify({seated:s.shift.groups.filter(g=>g.phase==='seated').length,wait:s.shift.groups.filter(g=>g.phase==='wait').length,tables:s.shift.tables.length})").then(JSON.parse);
  await sleep(1200);
  check(`${tag}: quán đông ≥ 3 bàn có khách ⇒ vòng lặp quán đông`, cnt.seated < 3 || (await waitFor("__game.sound().loops.includes('busy-dining-loop')", 3000)), JSON.stringify({ cnt, loops: await b.ev("JSON.stringify(__game.sound().loops)") }));
  await shot("01-quan-dong");
  const ho = await b.ev(HEAD_OVERLAP).then(JSON.parse);
  check(`${tag}: quán đông (${cnt.seated} bàn, ${cnt.wait} nhóm chờ): không khách nào đè vùng đầu khách khác`, ho.n >= 8 && ho.bad.length === 0, JSON.stringify(ho).slice(0, 300));
  const lab = await b.ev(`(()=>{const r=[...document.querySelectorAll('.gbtn:not([hidden]),.bubble:not([hidden])')].map(e=>e.getBoundingClientRect()).filter(r=>r.width);let bad=0;for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i],c=r[j];if(a.left<c.right-1&&a.right>c.left+1&&a.top<c.bottom-1&&a.bottom>c.top+1)bad++}return JSON.stringify({n:r.length,bad})})()`).then(JSON.parse);
  check(`${tag}: nhãn nhóm chờ + bong bóng không chồng nhau`, lab.bad === 0, JSON.stringify(lab));
  // vật dụng quán (fixtures) ở ×1: tủ kính, ghế chờ, bảng hiệu, bảng menu
  const fx = await b.ev(`JSON.stringify([...document.querySelectorAll('.stage .fixture:not([hidden])')].map(e=>[e.dataset.fixture,Math.round(e.getBoundingClientRect().width/__game.sceneScale())]))`).then(JSON.parse);
  check(`${tag}: vật dụng quán vẽ từ fixtures.webp ở ×1 (ô 384 px cảnh)`, fx.length >= 4 && fx.every(([, w]) => w === 384) && fx.some(([n]) => n.startsWith("glass-case")) && fx.some(([n]) => n === "queue-bench"), JSON.stringify(fx));
  // trang trí (decor.webp) cũng ×1: ô 128 px cảnh
  await b.ev("(()=>{const s=__game.state;s.decor={...(s.decor||{}),'red-lantern':true,'banana-plant':true}})()");
  await sleep(250);
  const dc = await b.ev(`JSON.stringify([...document.querySelectorAll('.stage .decor:not([hidden])')].map(e=>[e.dataset.decor,Math.round(e.getBoundingClientRect().width/__game.sceneScale()),/decor\.webp/.test(e.style.backgroundImage)]))`).then(JSON.parse);
  check(`${tag}: trang trí vẽ từ decor.webp ở ×1 (ô 128 px cảnh)`, dc.length >= 2 && dc.every(([, w, real]) => w === 128 && real), JSON.stringify(dc));
  // ---- bếp lớn HD ----
  await b.ev("__game.state.shift.grill.slots[0]||__game.act({type:'grillTap',slot:0},true)");
  if (tag === "mobile") await pressSel('#dock [data-dock="kitchen"]'); else await pressSel('[data-act="bigGrill"]');
  await sleep(300);
  const bg = await b.ev(`(()=>{const p=document.querySelector('.bigrill');if(!p||p.closest('[hidden]'))return null;const g=p.querySelector('.bg-grill'),o=p.querySelector('.bg-owner'),it=[...p.querySelectorAll('.bg-item:not([hidden])')];
    return JSON.stringify({grill:g&&g.style.backgroundImage,owner:o&&o.style.backgroundImage,items:it.map(e=>e.style.backgroundImage),k:+p.dataset.k})})()`).then((x) => (x ? JSON.parse(x) : null));
  check(`${tag}: bếp lớn dùng grill-hd + grill-items-hd + cận cảnh chủ quán owner-actions-hd, hệ số thiết bị bội 0,5`, !!bg && /grill-hd\.webp/.test(bg.grill) && /owner-actions-hd\.webp/.test(bg.owner) && bg.items.length >= 1 && bg.items.every((u) => /grill-items-hd\.webp/.test(u)) && Math.abs(bg.k * 2 - Math.round(bg.k * 2)) < 1e-6, JSON.stringify(bg));
  await shot("02-bep-lon");
  // chạm miếng trên bếp lớn = chạm chip (grillTap)
  await b.ev("(()=>{const sh=__game.state.shift;sh.owner.queue.length=0;if(sh.owner.task)sh.owner.task=null;sh.owner.pos=[...__game.scene.points.owner];const sl=sh.grill.slots[0];if(sl){sl.sides[0]=104}})()");
  const freeNow = await waitFor("__game.ownerFree()", 3000);
  await pressSel('.bigrill .bg-slot[data-slot="0"]');
  check(`${tag}: chạm miếng trên bếp lớn ⇒ lật (cùng thao tác chip)`, (await S("s.shift.grill.slots[0]&&s.shift.grill.slots[0].flips||0")) >= 1, JSON.stringify({ freeNow, it: await S("s.shift.grill.slots[0]"), why: await b.ev("JSON.stringify(__game.act({type:'grillTap',slot:0},true))"), dlg: await S("s.shift.dialog") }));
  if (tag !== "mobile") await pressSel('[data-act="bigGrill"]');
  else await pressSel('#dock [data-dock="plate"]');
  // ---- dĩa HD ----
  // một bàn gọi món: cô chủ ra châm trà + lấy phiếu (tua tới khi có phiếu)
  for (let i = 0; i < 40 && (await S("!s.shift.tickets.some(t=>t.status==='open')")); i++) {
    await b.ev("(()=>{for(const t of __game.state.shift.tables)if(__game.tableJob(t.id)==='visit'){__game.act({type:'tableTap',tid:t.id},true);break}})()");
    await b.ev("__game.advance(500)");
  }
  const tk = await S("(s.shift.tickets.find(t=>t.status==='open')||{}).id??null");
  if (tk !== null) {
    for (let i = 0; i < 40 && !(await b.ev("__game.ownerFree()")); i++) await b.ev("__game.advance(200)");
    await b.ev(`__game.act({type:'pin',tk:${tk}})`); await b.ev("__game.act({type:'layer',id:'dia'})"); await b.ev("__game.act({type:'layer',id:'com'})");
    await sleep(250);
  }
  const pl = await b.ev("JSON.stringify([...document.querySelectorAll('.plate-view .spr[data-layer]')].map(e=>e.style.backgroundImage))").then(JSON.parse);
  check(`${tag}: dĩa trên ô bày vẽ bằng plate-layers-hd`, pl.length >= 2 && pl.every((u) => /plate-layers-hd\.webp/.test(u)), pl.join(" "));
  if (tag !== "mobile") check(`${tag}: cô chủ cận cảnh (owner-actions-hd) đứng sau dĩa HD`, await b.ev("(()=>{const o=document.querySelector('.plate-view .plate-owner');return !!o&&!o.hidden&&/owner-actions-hd/.test(o.style.backgroundImage)&&o===o.parentElement.firstElementChild})()"));
  // ---- chân dung Drama HD ----
  await b.ev("__game.openEvent('K14')");
  await waitFor("__game.dramaOpen");
  const fr = await b.ev("JSON.stringify([...document.querySelectorAll('#drama .dportrait')].map(x=>[x.dataset.frame,(x.querySelector('.pic')||{style:{}}).style.backgroundImage]))").then(JSON.parse);
  check(`${tag}: Drama: chân dung HD (portrait-expressions-hd / drama-portraits-hd), cô chủ có biểu cảm`, fr.length === 2 && fr.every(([f, u]) => /^(faces|drama)\//.test(f) && /-hd\.webp/.test(u)), JSON.stringify(fr));
  await shot("03-drama");
  await closeDrama();
  const r2 = await b.ev("JSON.stringify(__game.openEvent('K03')||{})");
  await waitFor("__game.dramaOpen&&!document.querySelector('#drama').hidden", 3000);
  const f2 = await b.ev("JSON.stringify([...document.querySelectorAll('#drama .dportrait')].map(x=>[x.dataset.frame,(x.querySelector('.pic')||{style:{}}).style.backgroundImage]))").then(JSON.parse);
  check(`${tag}: Drama: Anh Sáu (NPC có chân dung riêng) dùng drama-portraits-hd`, f2.some(([f, u]) => /^drama\/anh-sau-/.test(f) && /drama-portraits-hd\.webp/.test(u)), JSON.stringify({ f2, r2 }));
  await shot("03b-drama-npc");
  await closeDrama();
  // ---- thời tiết ở quán: mưa chỉ thấy qua cửa sổ + cửa (2 lớp cắt khung), khói dày ----
  await b.ev("(()=>{const s=__game.state;s.weather={day:s.day,kind:'rain'}})()");
  await sleep(400);
  const wq = await b.ev("JSON.stringify([...document.querySelectorAll('.stage .wx-rain:not([hidden])')].map(e=>e.style.clipPath))").then(JSON.parse);
  check(`${tag}: mưa ở quán ⇒ 2 lớp mưa cắt theo cửa sổ + cửa`, wq.length === 2 && wq.every((c) => /inset/.test(c)), JSON.stringify(wq));
  await shot("04-mua-quan");
  await b.ev("(()=>{const s=__game.state;s.weather={day:s.day,kind:'clear'};s.shift.grill.smoke=90})()");
  await sleep(400);
  check(`${tag}: khói dày ⇒ lớp khói; hết mưa ⇒ tắt lớp mưa`, await b.ev("!!document.querySelector('.stage .weather .wx-smoke:not([hidden])')&&!document.querySelector('.stage .weather .wx-rain:not([hidden])')"));
  await b.ev("__game.state.shift.grill.smoke=0");
  // ---- giảm chuyển động: mưa đứng hình, không chớp ----
  await b.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await b.ev("(()=>{const s=__game.state;s.weather={day:s.day,kind:'rain'}})()");
  const frames = new Set(); let flashes = 0;
  for (let i = 0; i < 14; i++) { await sleep(90); frames.add(await b.ev("(document.querySelector('.stage .wx-rain:not([hidden])')||{dataset:{}}).dataset.f||''")); if (await b.ev("!!document.querySelector('.stage .wx-flash:not([hidden])')")) flashes++; }
  check(`${tag}: giảm chuyển động ⇒ mưa một khung đứng yên, không chớp`, frames.size === 1 && [...frames][0] === "rain-1" && flashes === 0, JSON.stringify({ frames: [...frames], flashes }));
  await b.send("Emulation.setEmulatedMedia", { features: [] });
  await b.ev("(()=>{const s=__game.state;s.weather={day:s.day,kind:'clear'}})()");
}
